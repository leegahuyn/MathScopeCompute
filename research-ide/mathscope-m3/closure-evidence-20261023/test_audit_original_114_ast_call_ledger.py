"""Exact 4.42M source stream replay + adversarial drift controls."""
import copy,os,unittest
from audit_original_114_ast_call_ledger import (
    replay,verify_rows,expected_index,EXPECTED_GRAPH_SHA,EXPECTED_REG_SHA,
    EXPECTED_ROWHASH,InvalidSourceLedger)

class FullOriginal114SourceLedger(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source=replay(os.environ['MATHSCOPE_GRAPH_DIR'])
        cls.rows=cls.source['actual_source_call_nodes']

    def test_original_graph_and_native_registry_digest(self):
        self.assertEqual(self.source['original_graph_sha256'],EXPECTED_GRAPH_SHA)
        self.assertEqual(self.source['original_registry_sha256'],EXPECTED_REG_SHA)
        self.assertEqual(self.source['original_graph_node_count'],4420257)
        self.assertEqual(self.source['source_114_ledger_sha256'],EXPECTED_ROWHASH)

    def test_all_114_individually_verified_in_authentic_AST(self):
        self.assertEqual(len(self.rows),114)
        self.assertEqual({x['node_id'] for x in self.rows},set(expected_index()))
        self.assertEqual(verify_rows(self.rows),EXPECTED_ROWHASH)
        self.assertEqual(sum(x['calls'] for x in self.source['groups']),114)
        self.assertEqual(self.source['guarded_call_count'],87)

    def test_original_derivative_orders_and_components(self):
        self.assertEqual(self.source['component_counts'],{'Phi':44,'u':38,'average':32})
        self.assertEqual(max(x['k'] for x in self.rows),3)
        self.assertEqual(max(x['m'] for x in self.rows),3)
        self.assertEqual(set(x['eta_node_id'] for x in self.rows),{2})

    def test_no_unproved_global_support_promoted(self):
        self.assertEqual(self.source['source_Y_upper_bound_certified_114'],0)
        self.assertEqual(self.source['native_call_branch_and_support_paths_proved'],0)
        self.assertEqual(self.source['actual_67_final_field_jets'],0)
        self.assertEqual(self.source['source_Y_open_523'],490)
        self.assertEqual(self.source['release'],'HOLD')

    def test_dropped_original_node_rejected(self):
        with self.assertRaises(InvalidSourceLedger):
            verify_rows(self.rows[:-1])

    def test_duplicate_original_node_rejected(self):
        bad=copy.deepcopy(self.rows)
        bad[0]['node_id']=bad[1]['node_id']
        with self.assertRaises(InvalidSourceLedger):
            verify_rows(bad)

    def test_swapped_original_Y_rejected(self):
        bad=copy.deepcopy(self.rows)
        bad[0]['Y_node_id']=99999
        with self.assertRaises(InvalidSourceLedger):
            verify_rows(bad)

    def test_faked_component_rejected(self):
        bad=copy.deepcopy(self.rows)
        bad[0]['component']='fake'
        with self.assertRaises(InvalidSourceLedger):
            verify_rows(bad)

    def test_faked_derivative_order_rejected(self):
        bad=copy.deepcopy(self.rows)
        bad[0]['k']+=1
        with self.assertRaises(InvalidSourceLedger):
            verify_rows(bad)

if __name__=='__main__':unittest.main()
