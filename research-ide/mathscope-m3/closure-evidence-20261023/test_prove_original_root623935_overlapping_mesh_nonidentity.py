import os,unittest
from fractions import Fraction as F
from prove_original_root623935_overlapping_mesh_nonidentity import overlapping_neighbor_cert
from prove_original_root623935_general_srep_image import graph_pin

class OriginalOverlappingPairedMesh(unittest.TestCase):
    def test_two_exact_paired_meshes_but_distinct_inverse_roots(self):
        x=overlapping_neighbor_cert()
        self.assertTrue(x['both_source_actual_representative_mesh_guards_certified'])
        self.assertEqual(x['selected_Z_neighbor_values'],['-1/1944','1/729'])
        self.assertEqual(x['same_selected_T_value'],'1')
        self.assertTrue(x['different_selected_Z_squared'])
        self.assertTrue(x['different_unique_inverse_s_roots_for_all_source_h'])
        self.assertFalse(x['actual_original_gluing_partition_weights_evaluated'])
        self.assertEqual(x['original_523_Y_OPEN'],490)
        self.assertEqual(x['actual_final_67_jets'],0)
        self.assertEqual(x['release'],'HOLD')
    def test_symbolic_same_source_rep_eta_and_T(self):
        x=overlapping_neighbor_cert()
        self.assertEqual(x['actual_representative_s_X_eta'],['1','1/2','1/1458'])
        self.assertEqual(x['actual_representative_Z_T'][0],'1/1458')
        self.assertNotEqual(F(x['selected_Z_neighbor_values'][0])**2,
                            F(x['selected_Z_neighbor_values'][1])**2)
    def test_full_original_graph_sha_if_supplied(self):
        path=os.environ.get('MATHSCOPE_ORIGINAL_GRAPH_FILE')
        if not path:self.skipTest('authenticated original graph required')
        self.assertEqual(graph_pin(path)['actual_root_node'],623935)

if __name__=='__main__':unittest.main()
