import unittest
from verified_inputs import checked, sha
class PinnedCacheControls(unittest.TestCase):
    def test_mutated_source_rejected(self):
        raw=b'{"binder":12,"branch":"zero-seeded","limit":"infinite"}'
        for changed in (raw.replace(b'12',b'13'),raw.replace(b'zero-seeded',b'other-root'),raw.replace(b'infinite',b'finite')):
            with self.assertRaises(ValueError): checked(changed,sha(raw))
    def test_unaltered_bytes_accepted(self):
        raw=b'exact original data';self.assertEqual(checked(raw,sha(raw)),raw)
if __name__=='__main__': unittest.main()
