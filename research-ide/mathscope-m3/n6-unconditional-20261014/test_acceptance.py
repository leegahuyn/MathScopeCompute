"""Negative controls for provenance and mathematical overclaiming."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from acceptance import CLASS_IDS, PARENT, SEQUENCE, original_acceptance, original_class_obligations
from run_job import safe_name, verify_receipt, write

class AcceptanceControls(unittest.TestCase):
    def rows(self):
        return [{'id': name, 'status': 'OPEN', 'wholeSourceCertificateIndependentlyVerified': False} for name in sorted(CLASS_IDS)]

    def test_test_pass_and_sample_flags_do_not_close_universal_targets(self):
        result = original_acceptance(self.rows(), {'PASS': True, 'samples': 1000000, 'allTestsPassed': True, 'PROVED': True})
        self.assertFalse(result['N6-01']['originalCriterionComplete'])
        self.assertFalse(result['N6-02']['originalCriterionComplete'])

    def test_missing_original_class_is_rejected(self):
        with self.assertRaises(ValueError):
            original_acceptance(self.rows()[1:])

    def test_duplicate_obligation_is_rejected(self):
        rows = self.rows()
        with self.assertRaises(ValueError):
            original_acceptance(rows + [copy.deepcopy(rows[0])])

    def test_serialized_universal_proof_label_is_rejected(self):
        rows = self.rows()
        rows[0]['status'] = 'PROVED'
        with self.assertRaises(ValueError):
            original_acceptance(rows)

    def test_unverified_certificate_boolean_is_rejected(self):
        rows = self.rows()
        rows[0]['wholeSourceCertificateIndependentlyVerified'] = True
        with self.assertRaises(ValueError):
            original_acceptance(rows)

    def original_data(self):
        return {'source': {'fullParentNodesSHA256': PARENT}, 'orderedOriginalUpdates': SEQUENCE.copy(),
                'requirements': [{'id': name, 'proved': False, 'sourceRoots': [3825006], 'required': 'every fixed derivative on one domain', 'minimalLemma': 'actual source norm bound'} for name in sorted(CLASS_IDS)]}

    def test_stale_pressure_or_reordered_initial_state_is_rejected(self):
        data = self.original_data()
        self.assertEqual(len(original_class_obligations(data)), 10)
        data['orderedOriginalUpdates'][2] = 'reuse-pre-temporal-pressure'
        with self.assertRaises(ValueError):
            original_class_obligations(data)

    def test_altered_parent_and_historical_class_proof_are_rejected(self):
        data = self.original_data()
        data['source']['fullParentNodesSHA256'] = 'different-source'
        with self.assertRaises(ValueError):
            original_class_obligations(data)
        data = self.original_data()
        data['requirements'][0]['proved'] = True
        with self.assertRaises(ValueError):
            original_class_obligations(data)

    def receipt(self, folder):
        content = b'{"actualSourceNode":622971}\n'
        (folder / 'result.json').write_bytes(content)
        value = {'sourceCommit': 'head-sha', 'executionStatus': 'SUCCESS',
                 'members': [{'path': 'result.json', 'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest()}]}
        write(folder / 'receipt.json', value)
        return value

    def test_changed_bytes_are_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            self.receipt(folder)
            verify_receipt(folder, 'head-sha')
            (folder / 'result.json').write_bytes(b'{"actualSourceNode":622972}\n')
            with self.assertRaises(ValueError):
                verify_receipt(folder, 'head-sha')

    def test_wrong_source_sha_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            self.receipt(folder)
            with self.assertRaises(ValueError):
                verify_receipt(folder, 'other-head')

    def test_extra_or_missing_members_are_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            self.receipt(folder)
            (folder / 'extra.json').write_bytes(b'{}')
            with self.assertRaises(ValueError):
                verify_receipt(folder, 'head-sha')
            (folder / 'extra.json').unlink()
            (folder / 'result.json').unlink()
            with self.assertRaises(ValueError):
                verify_receipt(folder, 'head-sha')

    def test_duplicate_and_failed_receipts_are_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            value = self.receipt(folder)
            value['members'] *= 2
            write(folder / 'receipt.json', value)
            with self.assertRaises(ValueError):
                verify_receipt(folder, 'head-sha')
            value = self.receipt(folder)
            value['executionStatus'] = 'IMPLEMENTATION_FAILURE'
            write(folder / 'receipt.json', value)
            with self.assertRaises(ValueError):
                verify_receipt(folder, 'head-sha')

    def test_unsafe_paths_are_rejected(self):
        for name in ['../source.json', '/source.json', 'C:/source.json', 'a\\source.json', 'a//source.json']:
            with self.subTest(name=name), self.assertRaises(ValueError):
                safe_name(name)

if __name__ == '__main__':
    unittest.main()
