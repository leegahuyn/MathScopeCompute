"""Negative-controls on the genuine GitHub original Signed private+Temporal source receipt."""
import copy, json, os, pathlib, unittest
from collections import Counter
import verify_67jet_after_actual_signed as gate
from verify_real_67jet_readiness import REQ,FAMILY,GRID,load_source
class Signed67RealEvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.real=json.loads(pathlib.Path(os.environ['ACTUAL_SIGNED_CI_RECEIPT']).read_text())
        cls.req,_=load_source(REQ)
        cls.family,_=load_source(FAMILY)
        cls.grid,_=load_source(GRID)
    def bad(self,action):
        x=copy.deepcopy(self.real);action(x)
        with self.assertRaises(ValueError):
            gate.check_receipt(x)
    def test_source_authenticated_but_67_numerically_unavailable(self):
        x=gate.evaluate(self.req,self.family,self.grid,self.real)
        self.assertTrue(x['provenance']['signed162_private_authenticated'])
        self.assertTrue(x['provenance']['post_signed_temporal_ast_authenticated'])
        self.assertEqual(x['total_required'],67)
        self.assertEqual(x['final_numeric_certified'],0)
        self.assertTrue(all(row['numeric_interval'] is None for row in x['final_67_jet_requests']))
    def test_original_67_names_not_fabricated(self):
        x=gate.evaluate(self.req,self.family,self.grid,self.real)
        self.assertEqual(Counter(i['component'] for i in x['final_67_jet_requests']),
                         {'A0':19,'A1':19,'A2':19,'b':6,'p':4})
    def test_unsigned_predecessor_rejected(self):
        self.bad(lambda x:x.update(real_original_signed162_seal_issued=False))
    def test_partial_cover_loses_original_signed_provenance(self):
        self.bad(lambda x:x.update(actual_signed162_indexed_rows=1619))
    def test_modified_signed_velocity_root_fails(self):
        self.bad(lambda x:x['signed162_root_inventory']['velocity'].__setitem__(0,100000000))
    def test_mismatched_post_signed_inverse_root_fails(self):
        self.bad(lambda x:x['post_signed_exact_inverse_roots'].__setitem__(0,12))
    def test_temporal_AST_without_true_source_rejected(self):
        self.bad(lambda x:x.update(post_signed_exact_inverse_AST_private_source_checked=False))
    def test_faked_complete_67_claim_rejected(self):
        self.bad(lambda x:x.update(actual_final67_jets_evaluated=67))
    def test_faked_FiveMap_completion_rejected(self):
        self.bad(lambda x:x.update(post_signed_five_map_mean_source_AST_checked=True))
    def test_faked_release_rejected(self):
        self.bad(lambda x:x.update(release='RELEASE'))
    def test_stale_execution_commit_rejected(self):
        self.bad(lambda x:x.update(executing_commit='false-commit'))
    def test_cannot_omit_any_original_temporal_stage(self):
        def altered(x):
            x['successfully_authenticated'].remove('post_signed_original_exact_temporal_AST_and_fresh_mean_PJ')
        self.bad(altered)
if __name__=='__main__':unittest.main()
