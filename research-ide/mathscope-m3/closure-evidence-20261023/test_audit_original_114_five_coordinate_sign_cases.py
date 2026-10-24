import copy,os,unittest
from audit_original_114_five_coordinate_sign_cases import (
 certificate,validate_certified_scope,InvalidOriginalPositiveSource
)
class OriginalFiveRealPositiveCoordinates(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.c=certificate(os.environ['MATHSCOPE_GRAPH_DIR'])
    def test_exact_count_114(self):
        a=self.c
        self.assertEqual(a['positive_Xa_exp_real_source_coordinate_calls'],58)
        self.assertEqual(a['positive_exp_log_positive_source_coordinate_calls_requiring_positive_X'],29)
        self.assertEqual(a['raw_X_coordinate_calls_requiring_positive_chart_X'],27)
        self.assertEqual(sum(a['source_X_coordinate_call_counts'].values()),114)
    def test_no_native_domain_proof_from_positive_source(self):
        a=self.c
        self.assertTrue(validate_certified_scope(a))
        self.assertFalse(a['actual_native_X_coordinate_substitution_certified'])
        self.assertEqual(a['original_114_global_Y_lower_and_upper_bounds_newly_certified'],0)
        self.assertEqual(a['original_523_Y_upper_bound_OPEN'],490)
        self.assertEqual(a['final_67_field_jets_certified'],0)
    def test_fake_actual_substitution_certification_rejected(self):
        a=copy.deepcopy(self.c)
        a['actual_native_X_coordinate_substitution_certified']=True
        with self.assertRaises(InvalidOriginalPositiveSource):validate_certified_scope(a)
    def test_fake_67_field_jet_claim_rejected(self):
        a=copy.deepcopy(self.c);a['final_67_field_jets_certified']=67
        with self.assertRaises(InvalidOriginalPositiveSource):validate_certified_scope(a)
if __name__=='__main__':unittest.main()
