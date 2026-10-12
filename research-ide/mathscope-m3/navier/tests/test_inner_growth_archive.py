"""Fast archive gates against copies of the actual successful source receipt."""
from contextlib import contextmanager
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('inner_archive_builder', Path(__file__).with_name('build-inner-growth-evidence.py'))
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


class InnerArchiveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.root = Path(cls.temp.name)
        for source in BUILDER.source_paths() + [BUILDER.ROOT / BUILDER.TARGET]:
            target = cls.root / source.relative_to(BUILDER.ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    @contextmanager
    def changed(self, relative, raw):
        path = self.root / relative
        before = path.read_bytes()
        try:
            if raw is None:
                path.unlink()
            else:
                path.write_bytes(raw)
            yield
        finally:
            path.write_bytes(before)

    def test_actual_archive_preserves_every_formula_and_exact_source_row(self):
        value = BUILDER.archive(self.root)
        actual = json.loads((self.root / BUILDER.ATTEMPT / 'inner-growth.json').read_bytes())
        self.assertEqual(value['certificate'], actual)
        result = BUILDER.build(self.root, check=True)
        self.assertEqual(result['scalarNodes'], 28966)
        self.assertEqual(result['sourceFiles'], 97)
        self.assertFalse(result['freshSourceConstructorExecuted'])
        self.assertEqual(len(value['independentVerification']['checks']), 9)

    def test_original_dependency_changed_or_missing_is_rejected(self):
        source = BUILDER.BASE / 'source-inner-growth.mjs'
        for changed in [b'// different source\n', None]:
            with self.subTest(changed=changed), self.changed(source, changed):
                with self.assertRaises((ValueError, FileNotFoundError)):
                    BUILDER.archive(self.root)

    def test_changed_exact_bound_cannot_keep_the_observed_artifact_authority(self):
        path = BUILDER.ATTEMPT / 'inner-growth.json'
        record = json.loads((self.root / path).read_bytes())
        record['rows'][0]['interval']['lower'] = '1/2'
        with self.changed(path, json.dumps(record).encode()):
            with self.assertRaisesRegex(ValueError, 'artifact bytes changed'):
                BUILDER.archive(self.root)

    def test_rewriting_the_receipt_does_not_authorize_new_claims(self):
        receipt = json.loads((self.root / BUILDER.RECEIPT).read_bytes())
        receipt['originalFinalN6FieldConstructed'] = True
        with self.changed(BUILDER.RECEIPT, json.dumps(receipt).encode()):
            with self.assertRaisesRegex(ValueError, 'immutable observed N7 receipt'):
                BUILDER.archive(self.root)

    def test_stale_generated_module_is_rejected_without_overwriting_it(self):
        stale = (self.root / BUILDER.TARGET).read_bytes() + b'// stale transport\n'
        with self.changed(BUILDER.TARGET, stale):
            with self.assertRaisesRegex(ValueError, 'Stale generated'):
                BUILDER.build(self.root, check=True)
            self.assertEqual((self.root / BUILDER.TARGET).read_bytes(), stale)

    def test_manifest_path_escape_is_rejected_before_reading(self):
        for path in ['/etc/passwd', '../not-a-source', 'research-ide/../../outside']:
            with self.subTest(path=path), self.assertRaisesRegex(ValueError, 'outside|escapes'):
                BUILDER.verified_file(self.root, {'path': path, 'sha256': '0' * 64, 'bytes': 1})


if __name__ == '__main__':
    unittest.main()
