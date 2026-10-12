"""Original-blueprint authority tests, independent of generated worker bytes."""
import copy
import importlib.util
import json
from pathlib import Path
import sys
import unittest

sys.dont_write_bytecode = True
WEB = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('extended_build_gate', WEB / 'build_extended.py')
BUILD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILD)


class OriginalCriteriaBindingTests(unittest.TestCase):
    def setUp(self):
        self.original = json.loads((WEB.parent / 'ORIGINAL_M3_M4_CRITERIA.json').read_text())
        self.documents = [(name, json.loads((WEB.parent / (name + '_PROGRESS.json')).read_text()))
                          for name in ('GAUGE', 'N6', 'N7', 'N8')]

    def validate(self, documents=None, original=None):
        return BUILD.validate_extended_criteria(original or self.original,
                                               self.documents if documents is None else documents)

    def doc(self, name, documents=None):
        return dict(self.documents if documents is None else documents)[name]

    def test_actual_48_rows_are_bound_and_ordered(self):
        rows = self.validate()
        self.assertEqual([r['id'] for r in rows],
                         [p + '-' + str(i).zfill(2) for p in BUILD.PACKAGES for i in range(1, 9)])
        self.assertEqual(len(rows), 48)
        for row in rows:
            self.assertIs(type(row['originalCriterionComplete']), bool)
            if row['originalCriterionComplete']:
                self.assertIn(row['status'], BUILD.COMPLETE_STATUSES)
                self.assertTrue(row['evidence'])

    def test_whitespace_and_same_bytes_filename_are_permitted(self):
        doc = self.doc('N6')
        doc['sourceBlueprint']['source'] = 'same-bytes-renamed.pdf'
        for row in doc['criteria']:
            row['source'] = 'same-bytes-renamed.pdf'
            row['title'] = '\n ' + '\t'.join(row['title'].split()) + ' '
            row['text'] = '\n'.join(row['text'].split())
        self.assertEqual(len(self.validate()), 48)

    def test_mathematical_title_or_requirement_mutation_is_rejected(self):
        for key in ('title', 'text'):
            with self.subTest(key=key):
                documents = copy.deepcopy(self.documents)
                self.doc('N8', documents)['criteria'][0][key] += ' The original requirement is removed.'
                with self.assertRaisesRegex(ValueError, 'Original criterion changed'):
                    self.validate(documents)

    def test_page_and_blueprint_identity_mutations_are_rejected(self):
        mutations = [
            lambda d: d['criteria'][0].__setitem__('page', 65),
            lambda d: d['criteria'][0].__setitem__('page', '66'),
            lambda d: d['criteria'][0].__setitem__('source', 'unbound.pdf'),
            lambda d: d['criteria'][0].__setitem__('sourceSha256', '0' * 64),
            lambda d: d['sourceBlueprint'].__setitem__('sha256', '0' * 64),
            lambda d: d['sourceBlueprint'].__setitem__('checklistPage', 65),
            lambda d: d['sourceBlueprint'].__setitem__('pageCount', 1),
            lambda d: d.pop('sourceBlueprint'),
        ]
        for i, mutation in enumerate(mutations):
            with self.subTest(mutation=i):
                documents = copy.deepcopy(self.documents)
                mutation(self.doc('N8', documents))
                with self.assertRaises(ValueError):
                    self.validate(documents)
        gauge = self.doc('GAUGE')
        gauge['source']['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'blueprint SHA256'):
            self.validate()

    def test_missing_reordered_duplicate_and_extra_rows_are_rejected(self):
        mutations = [
            lambda rows: rows.pop(),
            lambda rows: rows.reverse(),
            lambda rows: rows.__setitem__(1, copy.deepcopy(rows[0])),
            lambda rows: rows.append(copy.deepcopy(rows[-1])),
            lambda rows: rows[0].__setitem__('id', 'P7-01'),
        ]
        for i, mutation in enumerate(mutations):
            with self.subTest(mutation=i):
                documents = copy.deepcopy(self.documents)
                mutation(self.doc('N6', documents)['criteria'])
                with self.assertRaisesRegex(ValueError, 'exactly eight original criteria in order'):
                    self.validate(documents)

    def test_duplicate_package_documents_do_not_silently_overwrite(self):
        gauge = copy.deepcopy(self.doc('GAUGE'))
        gauge['criteria'] = gauge['criteria'][:8]
        documents = self.documents + [('Y5', gauge)]
        with self.assertRaisesRegex(ValueError, 'Duplicate assessment package'):
            self.validate(documents)
        with self.assertRaisesRegex(ValueError, 'Missing original package assessments'):
            self.validate(self.documents[:-1])

    def test_completion_boolean_status_and_evidence_must_agree(self):
        mutations = [
            lambda r: r.__setitem__('originalCriterionComplete', 'true'),
            lambda r: r.__setitem__('originalCriterionComplete', 1),
            lambda r: r.__setitem__('status', ''),
            lambda r: r.__setitem__('status', 'PARTIAL'),
            lambda r: r.__setitem__('status', 'FORMAL_COMPLETE'),
            lambda r: r.__setitem__('evidence', []),
            lambda r: r.__setitem__('evidence', [' ']),
            lambda r: r.__setitem__('evidence', 'not-an-evidence-list'),
        ]
        for i, mutation in enumerate(mutations):
            with self.subTest(mutation=i):
                documents = copy.deepcopy(self.documents)
                mutation(self.doc('N8', documents)['criteria'][0])
                with self.assertRaises(ValueError):
                    self.validate(documents)
        self.doc('N6')['criteria'][0]['status'] = 'PASS'
        with self.assertRaisesRegex(ValueError, 'status contradicts'):
            self.validate()

    def test_summary_counts_cannot_promote_incomplete_original_rows(self):
        for field, value in [('completedOriginalCriteria', 8), ('allOriginalCriteriaComplete', True),
                             ('originalCriterionCount', 7)]:
            with self.subTest(field=field):
                documents = copy.deepcopy(self.documents)
                self.doc('N8', documents)[field] = value
                with self.assertRaisesRegex(ValueError, 'Progress (count|completion) contradicts'):
                    self.validate(documents)

    def test_original_baseline_itself_requires_eight_ordered_items(self):
        original = copy.deepcopy(self.original)
        original['criteria'] = [r for r in original['criteria'] if r['id'] != 'N8-08']
        with self.assertRaisesRegex(ValueError, 'Original package must contain exactly eight'):
            self.validate(original=original)


if __name__ == '__main__':
    unittest.main(verbosity=2)
