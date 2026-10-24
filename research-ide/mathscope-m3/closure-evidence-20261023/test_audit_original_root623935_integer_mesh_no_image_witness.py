import os,unittest
from fractions import Fraction as F
from audit_original_root623935_integer_mesh_no_image_witness import exact_original_integer_mesh_counterexample
from prove_original_root623935_mesh_prerequisites import real_mesh_box
from prove_original_root623935_general_srep_image import graph_pin

class OriginalSourceIntegerMeshDomainGap(unittest.TestCase):
    def test_uniform_all_h_source_mesh_counterexample(self):
        x=exact_original_integer_mesh_counterexample()
        self.assertEqual(x['original_integer_mesh_ell_r_z_t'],[3,0,1000,0])
        self.assertEqual(x['source_s_interval'],['1/2','1/2'])
        self.assertEqual(x['source_T_interval'],['0','1/972'])
        self.assertEqual(x['source_z_cell'][0],'3997/2916')
        self.assertTrue(x['negative_signed_intersection_width_strict_negative'])
        self.assertTrue(x['positive_signed_intersection_width_strict_negative'])
        self.assertTrue(x['selected_positive_candidate_Z_greater_than_one'])
        self.assertTrue(x['source_selected_Tmid_strict_negative'])
        self.assertFalse(x['actual_runtime_support_contains_this_unpaired_integer_cell_proved'])
        self.assertEqual(x['original_523_Y_OPEN'],490)
        self.assertEqual(x['final_67_jets'],0)
        self.assertEqual(x['release'],'HOLD')
    def test_original_real_mesh_mixed_denominators_unaltered(self):
        x=real_mesh_box(3,F(0),F(1000),F(0),F(1),F(1))
        self.assertTrue(x['source_upper_s_uses_Xa_not_K'])
        self.assertEqual(x['physical_mesh_center'],['0','1000/729','0'])
    def test_pinned_original_source_ast(self):
        p=os.getenv('MATHSCOPE_ORIGINAL_GRAPH_FILE')
        if not p:self.skipTest('requires authenticated 4.42M original source graph')
        self.assertEqual(graph_pin(p)['actual_root_node'],623935)

if __name__=='__main__':unittest.main()
