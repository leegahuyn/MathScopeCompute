import copy,unittest
from compile_original_67jet_force_stencil import compile_stencil
from verify_real_67jet_readiness import load_source,REQ

class Original67StencilTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.req,_=load_source(REQ)
    def test_exact_original_source_targets(self):
        r=compile_stencil(self.req)
        self.assertEqual(r['original_target_counts'],{'A0':19,'A1':19,'A2':19,'b':6,'p':4})
        self.assertEqual(r['original_cutoff_count'],13)
        self.assertEqual(r['original_final_field_value_intervals_obtained'],0)
    def test_missing_A_derivative_rejected(self):
        a=copy.deepcopy(self.req);a['requested_field_jets'].remove('A0@0,0,3,0')
        with self.assertRaisesRegex(ValueError,'mismatch'):compile_stencil(a)
    def test_missing_b_derivative_rejected(self):
        a=copy.deepcopy(self.req);a['requested_field_jets'].remove('b@2,0,0')
        with self.assertRaisesRegex(ValueError,'mismatch'):compile_stencil(a)
    def test_missing_pressure_gradient_rejected(self):
        a=copy.deepcopy(self.req);a['requested_field_jets'].remove('p@0,1,0,0')
        with self.assertRaisesRegex(ValueError,'mismatch'):compile_stencil(a)
    def test_missing_cutoff_third_jet_rejected(self):
        a=copy.deepcopy(self.req);a['requested_cutoff_jets'].remove('C@3,0,0')
        with self.assertRaisesRegex(ValueError,'mismatch'):compile_stencil(a)
    def test_wrong_time_sign_rejected(self):
        a=copy.deepcopy(self.req);a['coordinates']['physical_time_derivative']='partial_tau'
        with self.assertRaisesRegex(ValueError,'physical-time'):compile_stencil(a)
    def test_wrong_radial_coordinate_rejected(self):
        a=copy.deepcopy(self.req);a['coordinates']['b_and_C']=['r','z','tau']
        with self.assertRaisesRegex(ValueError,'coordinate'):compile_stencil(a)

if __name__=='__main__':unittest.main()
