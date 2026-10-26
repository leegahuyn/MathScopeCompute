import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from audit_original_Omega_prefix_sign import source_omega_sign_contract, ChangedOmegaSource

class ExactOriginalOmegaPrefix(unittest.TestCase):
    def test_three_original_integrands(self):
        r=source_omega_sign_contract()
        self.assertEqual(r['prefix_j_to_integrand'],['v0','U0*v0','v0^2'])
        self.assertTrue(r['Omega2_nonnegative_under_stated_hypotheses'])
        self.assertFalse(r['natural_Y_uses_integral_value'])
        self.assertEqual(r['prefix_name_role'],'INTEGRATION_DUMMY_VARIABLE_NAME_NOT_INTEGRAL_VALUE_NAME')

    def test_every_upper_remains_open(self):
        r=source_omega_sign_contract()
        self.assertEqual(r['Omega0_sign_from_source_alone'],'UNKNOWN')
        self.assertEqual(r['Omega1_sign_from_source_alone'],'UNKNOWN')
        self.assertFalse(r['all_70_Omega_natural_calls_Y_bounds_certified'])
        self.assertFalse(r['upper_for_any_Omega_from_sign_alone'])
        self.assertEqual(r['original_Y_unproved_calls'],490)
        self.assertEqual(r['release'],'HOLD')

    def test_tampered_source_fails_closed(self):
        real=Path(__file__).resolve().parents[2]/'mathscope-m2/navier/actual-continuation-exact-order-one.mjs'
        with TemporaryDirectory() as tmp:
            fake=Path(tmp)/'changed.mjs'
            fake.write_text(real.read_text().replace('G.pow(v0,2)','G.neg(G.pow(v0,2))'))
            with self.assertRaises(ChangedOmegaSource):
                source_omega_sign_contract(fake)

if __name__=='__main__':unittest.main()
