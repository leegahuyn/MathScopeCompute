import os,unittest
from fractions import Fraction as F
from prove_original_root623935_autoselected_mesh import (
  sqrt_positive_rational_interval,nearest_integer_fraction,
  select_original_integer_mesh,certify_all_h_autoselected_representative)
from prove_original_root623935_general_srep_image import graph_pin,ImageConditionOPEN

class GeneralOriginalMeshSelector(unittest.TestCase):
    def test_outward_square_root_always_encloses_irrational(self):
        for a in (F(0),F(1,3),F(3,2),F(2),F(101,11)):
            lo,hi=sqrt_positive_rational_interval(a,80)
            self.assertLessEqual(lo*lo,a)
            self.assertGreater(hi*hi,a)
            self.assertLessEqual(hi-lo,F(1,1<<80))
    def test_exact_rounding_for_negative_values_and_halves(self):
        for q,k in ((F(-7,5),-1),(F(-3,2),-1),(F(-1,2),0),
                    (F(1,2),1),(F(17,10),2)):
            self.assertEqual(nearest_integer_fraction(q),k)
    def test_signed_projection_mesh_constructs_irrational_R_and_Z(self):
        n=0
        for ell in (3,4,7):
            for s in (F(1,2),F(3,4),F(1),F(3,2),F(2)):
                for eta in (F(-1),F(-3,5),F(0),F(3,5),F(1)):
                    for X in (F(1,2),F(3,4),F(1),F(3,2)):
                        cert=certify_all_h_autoselected_representative(
                          ell,F(1,2),F(3,2),X,s,eta)
                        self.assertTrue(cert['source_signed_projection_value_in_chart_image'])
                        self.assertTrue(all(q['strict_entire_interval_inside'] for q in cert['mesh_witnesses'].values()))
                        self.assertFalse(cert['all_runtime_source_mesh_index_bindings_proved'])
                        self.assertEqual(cert['original_523_Y_OPEN'],490)
                        n+=1
        self.assertEqual(n,300)
    def test_independent_interval_too_wide_fails_closed(self):
        with self.assertRaisesRegex(ImageConditionOPEN,'cannot certify'):
            select_original_integer_mesh(F(0),F(1),3)
    def test_source_coordinate_precision_too_small_fails_closed(self):
        with self.assertRaises(ImageConditionOPEN):
            certify_all_h_autoselected_representative(
              2**80,F(1,2),F(3,2),F(1),F(3,4),F(3,5),bits=100)
    def test_invalid_hypotheses_rejected(self):
        with self.assertRaises(ImageConditionOPEN):
            certify_all_h_autoselected_representative(3,F(1,2),F(1),F(3,2),F(1),F(0))
        with self.assertRaises(ImageConditionOPEN):
            certify_all_h_autoselected_representative(3,F(1,2),F(3,2),F(1),F(1),F(2))
    def test_immutable_original_ast_when_supplied(self):
        path=os.getenv('MATHSCOPE_ORIGINAL_GRAPH_FILE')
        if not path:self.skipTest('full original SHA-pinned AST only on original CI')
        self.assertEqual(graph_pin(path)['actual_root_node'],623935)

if __name__=='__main__':unittest.main()
