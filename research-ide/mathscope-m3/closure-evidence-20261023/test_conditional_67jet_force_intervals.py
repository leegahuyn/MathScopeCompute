import unittest,copy
from conditional_67jet_force_intervals import ConditionalPointForce,fixture_linear_curl
from rigorous_rational_intervals import UncertifiedExpression
from verify_real_67jet_readiness import load_source,REQ

class ConditionalExactForceTests(unittest.TestCase):
    def test_toy_vector_potential_xy_at_point(self):
        jets,xy=fixture_linear_curl()
        r=ConditionalPointForce(jets,xy).evaluate()
        self.assertEqual(r['velocity_intervals'],[['2','2'],['-3','-3'],['0','0']])
        self.assertEqual(r['defined_force_intervals'],[['2','2'],['3','3'],['0','0']])
        self.assertEqual(r['direct_divergence_interval'],['0','0'])
        self.assertEqual(r['actual_source_final_jet_enclosures_certified'],0)
    def test_toy_full_cell_enclosures(self):
        jets,xy=fixture_linear_curl()
        xy={'x':['2','5/2'],'y':['3','7/2']}
        jets['A2@0,0,0,0']=['6','35/4']
        jets['A2@1,0,0,0']=['3','7/2']
        jets['A2@0,1,0,0']=['2','5/2']
        r=ConditionalPointForce(jets,xy).evaluate()
        self.assertEqual(r['velocity_intervals'],[['2','5/2'],['-7/2','-3'],['0','0']])
        self.assertEqual(r['defined_force_intervals'],[['2','5/2'],['3','7/2'],['0','0']])
    def test_physical_time_minus_partial_tau(self):
        jets,xy=fixture_linear_curl()
        for key in list(jets):jets[key]=['0','0']
        jets['C@0,0,0']=['1','1']
        jets['A2@0,1,0,1']=['2','2']
        jets['A2@1,0,0,1']=['3','3']
        result=ConditionalPointForce(jets,xy).evaluate()
        self.assertEqual(result['defined_force_intervals'],[['-2','-2'],['3','3'],['0','0']])
    def test_missing_original_A_field_jet_fails(self):
        j,xy=fixture_linear_curl()
        j.pop('A2@1,1,0,0')
        with self.assertRaises(UncertifiedExpression):ConditionalPointForce(j,xy)
    def test_missing_cutoff_jet_fails(self):
        j,xy=fixture_linear_curl()
        j.pop('C@1,0,0')
        with self.assertRaises(UncertifiedExpression):ConditionalPointForce(j,xy)
    def test_numerical_float_endpoint_fails(self):
        j,xy=fixture_linear_curl();j['C@0,0,0']=[1.0,1.0]
        with self.assertRaises(UncertifiedExpression):ConditionalPointForce(j,xy)
    def test_interval_denominator_or_missing_source_does_not_gain_certificate(self):
        j,xy=fixture_linear_curl()
        r=ConditionalPointForce(j,xy).evaluate()
        self.assertFalse(r['original_source_input_interval_provenance_verified'])
        self.assertFalse(r['actual_original_force_proved'])
        self.assertEqual(r['release'],'HOLD')

if __name__=='__main__':unittest.main()
