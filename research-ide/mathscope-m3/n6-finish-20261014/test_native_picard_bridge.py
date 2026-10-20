import unittest
from native_picard_bridge import certificate, identities, normalize, independent_distribute


class NativeRecurrenceTests(unittest.TestCase):
    def test_both_exact_backends_prove_all_variable_identities(self):
        for a, b in identities().values():
            self.assertEqual(normalize(a), normalize(b))
            self.assertEqual(independent_distribute(a), independent_distribute(b))

    def test_both_backends_detect_mixed_sign_and_pressure_factor(self):
        for mutation in [{'mutate_angular': True}, {'mutate_pressure': True}]:
            changed = [a-b for a, b in identities(**mutation).values()]
            self.assertTrue(any(normalize(x) for x in changed))
            self.assertTrue(any(independent_distribute(x) for x in changed))

    def test_scalar_identity_cannot_promote_native_norm_or_domains(self):
        c = certificate()
        self.assertFalse(c['nativeB_rhoNormBoundProved'])
        self.assertFalse(c['nativePressureEqualsLeanNewPressureProved'])
        self.assertFalse(c['actualAllCallArgumentDomainsProved'])
        self.assertEqual(c['newClosedJets'], 0)


if __name__ == '__main__': unittest.main()
