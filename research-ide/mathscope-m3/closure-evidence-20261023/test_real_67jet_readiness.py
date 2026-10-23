"""Independent negative controls for original M3 67-jet readiness."""
import copy, json, os, pathlib, unittest
from collections import Counter
import verify_real_67jet_readiness as src

class TestRealOriginalJetGate(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.req,_=src.load_source(src.REQ)
        cls.family,_=src.load_source(src.FAMILY)
        cls.grid,_=src.load_source(src.GRID)
        cls.real=json.loads(pathlib.Path(os.environ['REAL_RECEIPT_FILE']).read_text())
    def check_bad(self,*,req=None,family=None,grid=None,real=None):
        with self.assertRaises(ValueError):
            src.validate(req or self.req,family or self.family,grid or self.grid,real or self.real)
    def test_exact_real_authentic_receipt(self):
        a=src.result(self.req,self.family,self.grid,self.real)
        self.assertEqual(a['actual_final_field_jet_count_certified'],0)
        self.assertEqual(a['exact_cutoff_point_jet_count'],13)
        self.assertEqual(a['real_source_checkpoint']['graph_node_count'],4162316)
    def test_all_original_67_targets(self):
        j=self.req['requested_field_jets']
        self.assertEqual(len(j),67)
        self.assertEqual(Counter(x.split('@')[0] for x in j),dict(A0=19,A1=19,A2=19,b=6,p=4))
        a=src.result(self.req,self.family,self.grid,self.real)
        self.assertTrue(all(x['original_final_field_numeric_interval'] is None for x in a['field_jet_targets']))
    def test_missing_jet_rejected(self):
        r=copy.deepcopy(self.req);r['requested_field_jets'].pop();self.check_bad(req=r)
    def test_duplicate_jet_rejected(self):
        r=copy.deepcopy(self.req);r['requested_field_jets'][-1]=r['requested_field_jets'][0];self.check_bad(req=r)
    def test_wrong_b_coordinate_rejected(self):
        r=copy.deepcopy(self.req);r['coordinates']['b_and_C']=['x','y','tau'];self.check_bad(req=r)
    def test_wrong_time_sign_rejected(self):
        r=copy.deepcopy(self.req);r['coordinates']['physical_time_derivative']='partial_tau';self.check_bad(req=r)
    def test_wrong_scale_selector_count_rejected(self):
        r=copy.deepcopy(self.req);r['frozen_scale_nodes'].pop();self.check_bad(req=r)
    def test_wrong_signed_status_rejected(self):
        r=copy.deepcopy(self.real);r['real_original_signed162_seal_issued']=True;self.check_bad(real=r)
    def test_changed_cor85_root_node_rejected(self):
        r=copy.deepcopy(self.real)
        next(x for x in r['graph_node_counts'] if x['stage']=='original_corollary_8_5_stress')['node_count']+=1
        self.check_bad(real=r)
    def test_unexecuted_stress_rejected(self):
        r=copy.deepcopy(self.real);r['real_original_latest_cor85_stress_seal_issued']=False;self.check_bad(real=r)
    def test_functional_DAG_forward_edge_rejected(self):
        r=copy.deepcopy(self.family);r['nodes'][1]['inputs']=['f_fake'];self.check_bad(family=r)
    def test_cell_promoted_rejected(self):
        r=copy.deepcopy(self.grid)
        next(c for c in r['cells'] if c['index']==[3,3,3])['status']='ENERGY_DONE'
        self.check_bad(grid=r)
    def test_zero_invented_instead_of_missing_rejected(self):
        r=copy.deepcopy(self.req);r['missing_values_replaced_by_zero']=True;self.check_bad(req=r)
    def test_exact_original_cutoff(self):
        a=src.result(self.req,self.family,self.grid,self.real)['cutoff_point_jets']
        self.assertEqual(len(a),13)
        self.assertEqual(a['C@0,0,0']['symbolic_value'],'1/2')
        self.assertEqual(a['C@0,0,1']['symbolic_value'],'-4/tau0')
        self.assertEqual(sum(x['symbolic_value']=='0' for x in a.values()),11)
    def test_original_numeric_final_gate_never_passes_with_only_cor85(self):
        r=src.result(self.req,self.family,self.grid,self.real)
        self.assertEqual(r['blocker_code'],'FINAL_NUMERIC_ROOTS_ABSENT')
        self.assertIsNone(r['original_numeric_interval_results'])
        self.assertFalse(r['N706_closed'])
        self.assertFalse(r['N805_closed'])
        self.assertIsNone(r['last_resolved_tau'])

if __name__=='__main__':unittest.main()
