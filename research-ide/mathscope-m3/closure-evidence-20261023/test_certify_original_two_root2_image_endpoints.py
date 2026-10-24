import copy,json,os,tempfile,unittest
from fractions import Fraction as Q
from pathlib import Path
from certify_original_two_root2_image_endpoints import (
    certify_independent_W_T_box,inspect_exact_two_calls,ImageConditionNotProved,H
)

class DirectActualRoot2SourceImage(unittest.TestCase):
    def test_nonzero_exact_image_boundary_Z_plusminus1_Tzero(self):
        result=certify_independent_W_T_box(Q(1),Q(1),Q(0),Q(0))
        self.assertTrue(result['domain_certified_for_entire_exact_W_T_box'])
        self.assertEqual(result['original_denominator_two_s_strict_positive_lower'],'1')
    def test_real_open_safe_small_box(self):
        result=certify_independent_W_T_box(Q(0),Q(1,4),Q(1,2),Q(3,2))
        self.assertTrue(result['real_eta_in_minus1_plus1'])
    def test_nonconvex_two_safe_points_midpoint_NOT_safe(self):
        certify_independent_W_T_box(Q(1),Q(1),Q(0),Q(0))
        with self.assertRaisesRegex(ImageConditionNotProved,'lower endpoint'):
            certify_independent_W_T_box(Q(0),Q(0),Q(0),Q(0))
    def test_outside_upper_endpoint_rejected(self):
        with self.assertRaisesRegex(ImageConditionNotProved,'upper endpoint'):
            certify_independent_W_T_box(Q(1),Q(1),Q(3,2),Q(3,2))
    def test_wrong_negative_or_unbounded_W_T_rejected(self):
        with self.assertRaises(ImageConditionNotProved):
            certify_independent_W_T_box(Q(-1),Q(1),Q(1),Q(1))
        with self.assertRaises(ImageConditionNotProved):
            certify_independent_W_T_box(Q(0),Q(3),Q(1),Q(1))
        with self.assertRaises(ImageConditionNotProved):
            certify_independent_W_T_box(Q(0),Q(0),Q(-1),Q(1))
    def test_float_substitution_not_a_rational_proof(self):
        with self.assertRaisesRegex(ImageConditionNotProved,'EXACT rational'):
            certify_independent_W_T_box(0.,Q(1),Q(1),Q(1))
    def test_strict_original_h_source_bound_exact(self):
        self.assertLess(H,Q(1,16))
        self.assertGreater(Q(1)-8*H,Q(1,2))

class Exact11RootSourceObligations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.reach=os.getenv('MATHSCOPE_ORIGINAL_REACH')
        if not cls.reach:
            raise unittest.SkipTest('full immutable original native/source graph only in source CI')
        cls.graph=os.environ['MATHSCOPE_GRAPH_DIR']
        cls.profile=os.environ['MATHSCOPE_N3_SOURCE_PROFILE']
        cls.band=os.environ['MATHSCOPE_GLOBAL_BAND_SOURCE']
        cls.result=inspect_exact_two_calls(cls.graph,cls.reach,cls.profile,cls.band)
    def test_exhaustive_original_relevant_calls_and_full_source_sha(self):
        c=self.result
        self.assertEqual(c['original_662_syntactic_calls_semantically_relevant'],2)
        self.assertEqual(c['original_direct_chart_call']['node_id'],622820)
        self.assertEqual(c['original_transformed_chart_call']['node_id'],623935)
        self.assertEqual(c['original_transformed_chart_call']['actual_Z_branch_condition_source_node_id'],623914)
        self.assertEqual(c['original_transformed_chart_call']['actual_Z_before_and_inside_source_node'],623920)
        self.assertEqual(c['original_transformed_chart_call']['actual_Z_after_source_node'],623918)
    def test_every_global_promotion_fails_closed(self):
        c=self.result
        self.assertFalse(c['all_actual_two_root_calls_image_domains_proved'])
        self.assertFalse(c['original_transformed_chart_call']['source_actual_branch_selector_sign_proved'])
        self.assertEqual(c['all_114_natural_series_global_call_paths_newly_certified'],0)
        self.assertEqual(c['original_523_natural_Y_OPEN'],490)
        self.assertEqual(c['actual_final_physical_67_jet_intervals'],0)
        self.assertEqual(c['release'],'HOLD')
    def test_forged_native_call_reach_receipt_rejected(self):
        data=json.loads(Path(self.reach).read_text())
        data['source_semantic_root_reachable_calls'][1]['T_source_id']=0
        with tempfile.TemporaryDirectory() as d:
            fake=Path(d)/'forged.json'
            fake.write_text(json.dumps(data))
            with self.assertRaisesRegex(ImageConditionNotProved,'actual two reached source calls'):
                inspect_exact_two_calls(self.graph,fake,self.profile,self.band)

if __name__=='__main__':unittest.main()
