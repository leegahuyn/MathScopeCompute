from pathlib import Path
import hashlib
import importlib.util
import json
import subprocess
import tempfile
import unittest

FILE = Path(__file__).resolve().parents[1] / 'static_module_bundle.py'
SPEC = importlib.util.spec_from_file_location('static_m3_bundle', FILE)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class DeferredAssertionTests(unittest.TestCase):
    def fixture(self, folder, early=False):
        a, b, entry = [folder / (name + '.mjs') for name in ['family', 'band', 'entry']]
        a.write_text("import {run} from './band.mjs';\nconst accepted=new WeakSet();\nexport function assertFamily(value){if(!accepted.has(value))throw new Error('AUTHENTIC_SOURCE_REQUIRED');return true;}\nexport function execute(){const value={};accepted.add(value);return [run(value),value];}\n")
        b.write_text("import {assertFamily} from './family.mjs';\n" + ("assertFamily({});\n" if early else '') + "export function run(value){return assertFamily(value);}\n")
        entry.write_text("import {execute} from './family.mjs';\nimport {run} from './band.mjs';\nconst result=execute();if(result[0]!==true)throw new Error('VALUE_CHANGED');let rejected=false;try{run({});}catch(error){rejected=error.message==='AUTHENTIC_SOURCE_REQUIRED';}if(!rejected)throw new Error('EXCEPTION_CHANGED');console.log('PASS');\n")
        pin = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
        edge = {'from': 'band.mjs', 'to': 'family.mjs', 'fromSHA256': pin(b), 'toSHA256': pin(a), 'functions': ['assertFamily']}
        return a, b, entry, edge

    def test_deferred_call_preserves_private_identity_and_exceptions(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            a, b, entry, edge = self.fixture(folder)
            code, paths, audit = MODULE.bundle(entry, root=folder, audited_edges=[edge])
            result = subprocess.run(['node', '--input-type=module'], input=code, text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(result.stdout.strip(), 'PASS')
            self.assertEqual(audit, [edge])
            self.assertEqual(set(paths), {a, b, entry})

    def test_early_access_and_unapproved_source_changes_are_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            a, b, entry, edge = self.fixture(folder, early=True)
            code, _, _ = MODULE.bundle(entry, root=folder, audited_edges=[edge])
            result = subprocess.run(['node', '--input-type=module'], input=code, text=True, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('before module initialization', result.stderr)
            with self.assertRaisesRegex(ValueError, 'Unaudited module cycle'):
                MODULE.bundle(entry, root=folder, audited_edges=[])
            b.write_text(b.read_text() + '\n// source changed\n')
            with self.assertRaisesRegex(ValueError, 'source bytes changed'):
                MODULE.bundle(entry, root=folder, audited_edges=[edge])


if __name__ == '__main__':
    unittest.main()
