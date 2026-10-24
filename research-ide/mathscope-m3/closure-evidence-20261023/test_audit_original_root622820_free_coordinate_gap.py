import os,unittest
from fractions import Fraction as F
from audit_original_root622820_free_coordinate_gap import (
 inspect_original_graph,evaluate_exact_h_independent_free_counterexample,DirectImageOPEN)

class DirectCallSourceDomain(unittest.TestCase):
    def test_exact_zero_zero_fails_original_bracket_for_every_h(self):
        c=evaluate_exact_h_independent_free_counterexample()
        self.assertEqual(c['F_one_half'],'1/2')
        self.assertEqual(c['F_two'],'2')
        self.assertFalse(c['zero_zero_inside_original_chart_image'])
        self.assertFalse(c['runtime_11root_support_contains_Z_T_zero_proved'])
        self.assertEqual(c['original_523_Y_OPEN'],490)
    def test_fake_numerical_probe_rejected(self):
        with self.assertRaises(DirectImageOPEN):
            evaluate_exact_h_independent_free_counterexample(F(1),F(0))
    def test_actual_SHA_pins_when_graph_supplied(self):
        graph=os.environ.get('MATHSCOPE_ORIGINAL_GRAPH_FILE')
        if not graph:self.skipTest('original 4.42M graph needed')
        self.assertTrue(inspect_original_graph(graph))

if __name__=='__main__':unittest.main()
