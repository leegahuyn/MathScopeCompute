import unittest
from fractions import Fraction as F
from pathlib import Path
from tempfile import TemporaryDirectory
from audit_first_order_114_X_route_guards import (
 audit_first_order_routes,ChangedFirstOrderSource,ROOT)

class RealSourceFirstOrderRouteContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.receipt=audit_first_order_routes()

    def test_all_eight_source_X_pairs_preserved_without_promotion(self):
        a=self.receipt
        self.assertEqual(a['original_X_pair_count'],8)
        self.assertEqual(a['original_X_call_count'],114)
        self.assertEqual(sum(x['calls'] for x in a['original_X_source_pair_ids_and_counts']),114)
        self.assertEqual(a['global_114_X_calls_root_to_branch_mappings_proved'],0)
        self.assertEqual(a['global_114_X_calls_Y_upper_certified'],0)

    def test_local_Ft_Ut_and_moment_integral(self):
        a=self.receipt
        self.assertTrue(a['local_selected_Ft_Ut_X_le_Xcut_implies_picard_argument_within_radial_domain'])
        self.assertTrue(a['local_moment_t_in_0_Xcut_implies_picard_argument_within_radial_domain'])
        self.assertLess(F(a['local_Y_Lambda_Xcut_strict_upper']),F(41,10))

    def test_axis_average_actual_integral_argument(self):
        a=self.receipt
        self.assertTrue(a['axis_average_t_in_0_1_and_X_in_0_Xkeep_implies_tX_in_0_Xkeep'])
        self.assertTrue(a['M1_and_M1overX_route_axis_average_only_on_X_le_Xkeep_selected_arms'])
        self.assertTrue(a['axis_average_selected_arm_sqrt_tX_in_0_a_for_original_Picard'])
        self.assertLess(F(a['local_Y_Lambda_Xkeep_strict_upper']),F(a['local_Y_Lambda_a_squared_strict_upper']))

    def test_release_and_original_jets_remain_blocked(self):
        a=self.receipt
        self.assertTrue(a['WARNING_selected_branch_routing_not_global_114_consumer_path_certificate'])
        self.assertEqual(a['final_67_field_jet_intervals_certified'],0)
        self.assertFalse(a['all_A_D_final_field_roots_materialized'])
        self.assertFalse(a['common_complex_eta_and_Brho_norm_certified'])
        self.assertEqual(a['M3'],'62/64')
        self.assertEqual(a['release'],'HOLD')

    def test_changed_axis_average_integration_limit_rejected(self):
        orig=ROOT/'actual-continuation-exact-order-one.mjs'
        with TemporaryDirectory() as td:
            fake=Path(td)/orig.name
            fake.write_text(orig.read_text().replace(
             "eta,eta),t,z,o);","eta,eta),t,z,G.q(2));"))
            with self.assertRaises(ChangedFirstOrderSource):
                audit_first_order_routes({orig.name:fake})

    def test_changed_piecewise_semantics_rejected(self):
        orig=ROOT/'actual-global-source-expressions.mjs'
        with TemporaryDirectory() as td:
            fake=Path(td)/orig.name
            fake.write_text(orig.read_text().replace(
                'x<=a?args[3]:x>=b?args[5]:args[4]',
                'x<=a?args[5]:x>=b?args[3]:args[4]'))
            with self.assertRaises(ChangedFirstOrderSource):
                audit_first_order_routes({orig.name:fake})

    def test_changed_nested_M1overX_selected_branch_rejected(self):
        orig=ROOT/'actual-continuation-exact-order-one.mjs'
        with TemporaryDirectory() as td:
            fake=Path(td)/orig.name
            fake.write_text(orig.read_text().replace(
                'M1overX=G.choose(X,Xkeep,lastU,axisAverage,G.div(M1,X),z)',
                'M1overX=G.div(M1,X)'))
            with self.assertRaises(ChangedFirstOrderSource):
                audit_first_order_routes({orig.name:fake})

    def test_changed_even_profile_kernel_rejected(self):
        orig=ROOT/'actual-continuation-exact-functions.mjs'
        with TemporaryDirectory() as td:
            fake=Path(td)/orig.name
            fake.write_text(orig.read_text().replace(
                "this.node('actual_background_even_profile',[system,component,X,eta,radialOrder,etaOrder])",
                "this.node('actual_background_even_profile',[system,component,X,eta,radialOrder,etaOrder+1])"))
            with self.assertRaises(ChangedFirstOrderSource):
                audit_first_order_routes({orig.name:fake})

if __name__=='__main__':
    unittest.main()
