import unittest
from fractions import Fraction as F
from audit_original_Omega_local_Linf_sufficiency import (
 original_Omega_local_sup_targets,conditional_bound_with_external_sup,
 UnprovedOmegaHypothesis,LAMBDA_A2_UPPER,PRODUCT_THRESHOLD)
class OmegaExactSourceNormSufficiency(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.a=original_Omega_local_sup_targets()

    def test_source_replays_70_actual_call_types(self):
        r=self.a
        self.assertEqual([g['calls'] for g in r['source_70_call_groups']],[26,26,18])
        self.assertEqual(F(r['exact_upper_on_Lambda_a_squared']),F(512,127))
        self.assertEqual(F(r['exact_allowed_sup_product_threshold']),F(635,512))
        self.assertEqual(LAMBDA_A2_UPPER*PRODUCT_THRESHOLD,F(5))

    def test_one_one_toy_assumptions_are_not_proof(self):
        trial=conditional_bound_with_external_sup(F(1),F(1))
        self.assertEqual(trial['sufficient_upper_5'],[True,True,True])
        self.assertFalse(trial['source_proven_supnorm_inputs_present'])
        self.assertEqual(trial['source_70_calls_certified_by_hypothetical_input'],0)

    def test_zero_supnorm_edge_case_has_valid_weak_bound(self):
        trial=conditional_bound_with_external_sup(F(0),F(0))
        self.assertEqual(trial['conditional_non_strict_Lambda_Omega_absolute_upper'],['0','0','0'])
        self.assertEqual(trial['sufficient_upper_5'],[True,True,True])

    def test_exact_borderline_and_failure(self):
        r=conditional_bound_with_external_sup(F(635,512),F(1))
        self.assertEqual(r['sufficient_upper_5'],[True,True,False])
        r=conditional_bound_with_external_sup(F(2),F(1))
        self.assertEqual(r['sufficient_upper_5'],[False,False,False])

    def test_no_sign_or_native_source_support_inferred(self):
        self.assertFalse(self.a['Omega0_Omega1_sign_certified'])
        self.assertFalse(self.a['actual_Mv_source_certified'])
        self.assertFalse(self.a['actual_MU_source_certified'])
        self.assertFalse(self.a['actual_70_native_consumers_support_certified'])
        self.assertEqual(self.a['source_70_original_Y_upper_bound_certified'],0)
        self.assertEqual(self.a['original_523_Y_remaining_open'],490)
        self.assertEqual(self.a['release'],'HOLD')

    def test_reject_floating_uncertified_sup(self):
        for v in [-1,1.0,'1',None]:
            with self.assertRaises(UnprovedOmegaHypothesis):
                conditional_bound_with_external_sup(v,F(1))
if __name__=='__main__':unittest.main()
