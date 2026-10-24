import os,unittest
from audit_original_11_root_native_bridge_gap import root_native_bridge_gap
class Original11RootNativeBodyGap(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.result=root_native_bridge_gap(os.environ['MATHSCOPE_GRAPH_DIR'])
    def test_original_roots_and_zero_direct_natural_descendants(self):
        r=self.result
        self.assertEqual(len(r['original_physical_roots']),11)
        self.assertTrue(all(x['root_op']=='add' for x in r['original_physical_roots']))
        self.assertTrue(all(x['original_114_call_nodes_directly_reachable']==0 for x in r['original_physical_roots']))
        self.assertEqual(r['source_11_roots_direct_AST_descendant_114_call_count'],0)
    def test_native_body_bridge_remains_required(self):
        r=self.result
        self.assertEqual(r['original_114_semantic_calls_reachable_in_separate_source_native_audit'],114)
        self.assertFalse(r['native_body_path_guard_dominance_proved'])
        self.assertEqual(r['global_original_Y_upper_newly_certified'],0)
    def test_final_proof_not_promoted(self):
        r=self.result
        self.assertEqual(r['all_523_original_Y_OPEN'],490)
        self.assertEqual(r['final_67_jets'],0)
        self.assertEqual(r['release'],'HOLD')
if __name__=='__main__':unittest.main()
