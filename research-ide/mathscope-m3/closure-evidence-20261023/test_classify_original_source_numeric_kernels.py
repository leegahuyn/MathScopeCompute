import copy,unittest
from classify_original_source_numeric_kernels import audit,category

def fixture():
    return {'schema':'MathScope.M3.SourceGraphReplayManifest/1',
      'final_all_cycle_A_b_p':False,'actual_final_67_jets_certified':0,
      'release':'HOLD','original_pr30_commit':'a'*40,'executing_commit':'b'*40,
      'node_stream_sha256':'c'*64,'node_count':9,
      'operation_histogram':{'rational':2,'coordinate':1,'add':1,
       'source_parameter':1,'m3_global_pulse_jet':2,'definite_integral':1,
       'm3_coupled_inverse_partial':1}}

class OriginalNativeInventoryTests(unittest.TestCase):
    def test_truthful_counts(self):
        a=audit(fixture())
        self.assertEqual(a['distinct_source_operators'],7)
        self.assertEqual(a['first_fivemap_node_count'],9)
        self.assertEqual(a['elementary_node_count'],4)
        self.assertEqual(a['unsupported_node_count'],5)
        self.assertEqual(a['actual_final_67_jet_intervals_certified'],0)
        self.assertFalse(a['actual_final_A_b_p_graph_included'])
        self.assertFalse(a['source_replay_archive_independently_sha256_verified_by_this_tool'])
    def test_actual_ode_and_inverse_blocked(self):
        self.assertEqual(category('m3_global_pulse_jet'),'ORIGINAL_ODE_JET_ENCLOSURE_REQUIRED')
        self.assertEqual(category('m3_coupled_inverse_partial'),'FOURIER_INVERSE_AND_TAIL_BOUNDS_REQUIRED')
    def test_unrecognized_native_ops_fail_open_only_as_metadata(self):
        self.assertEqual(category('m3_unknown_bespoke'),'UNRECOGNIZED_M3_NATIVE_KERNEL_REQUIRED')
        self.assertEqual(category('does_not_exist'),'UNKNOWN_SOURCE_OPERATION_IMPLEMENTATION_REQUIRED')
    def test_sum_node_count_mismatch(self):
        x=fixture();x['node_count']=10
        with self.assertRaises(ValueError):audit(x)
    def test_missing_histogram(self):
        x=fixture();x.pop('operation_histogram')
        with self.assertRaises(ValueError):audit(x)
    def test_forged_all_cycle_promotion_rejected(self):
        x=fixture();x['final_all_cycle_A_b_p']=True
        with self.assertRaises(ValueError):audit(x)
    def test_forged_67_values_rejected(self):
        x=fixture();x['actual_final_67_jets_certified']=1
        with self.assertRaises(ValueError):audit(x)
    def test_malformed_counts_rejected(self):
        x=fixture();x['operation_histogram']['add']=1.5
        with self.assertRaises(ValueError):audit(x)
if __name__=='__main__':unittest.main()
