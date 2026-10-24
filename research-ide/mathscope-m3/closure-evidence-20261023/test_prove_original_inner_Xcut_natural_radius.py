import unittest,tempfile
from pathlib import Path
from fractions import Fraction as F
from prove_original_inner_Xcut_natural_radius import (
 first_order_inner_natural_radius_bound,MissingOriginalInnerBranchProof)

class OriginalFirstOrderInnerYRadius(unittest.TestCase):
 def test_exact_Xcut_source_y_upper(self):
  a=first_order_inner_natural_radius_bound()
  self.assertEqual(F(a['conditional_Lambda_X_cut_strict_upper']),F(1024,255))
  self.assertLess(F(a['conditional_Lambda_X_cut_strict_upper']),5)
 def test_exact_Xkeep_stronger_upper(self):
  a=first_order_inner_natural_radius_bound()
  self.assertEqual(F(a['conditional_Lambda_X_keep_strict_upper']),F(2048,511))
  self.assertLess(F(a['conditional_Lambda_X_keep_strict_upper']),
                  F(a['conditional_Lambda_X_cut_strict_upper']))
 def test_do_not_promote_all_original_114_calls(self):
  a=first_order_inner_natural_radius_bound()
  self.assertFalse(a['all_114_physically_reachable_Lambda_X_calls_inside_that_branch_proved'])
  self.assertFalse(a['other_490_natural_calls_Y_bounded'])
  self.assertFalse(a['common_Brho_coefficient_norm_proved'])
  self.assertEqual(a['actual_final_67_jets_certified'],0)
 def test_tampered_inner_branch_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   file=Path(d)/'invalid-original-order-one.mjs'
   file.write_text("Xcut=G.mul(Xa,G.exp(G.div(t1,q(16))));\n")
   with self.assertRaises(MissingOriginalInnerBranchProof):
    first_order_inner_natural_radius_bound(file)
 def test_true_selected_domain_bound_does_not_certify_full_chart(self):
  a=first_order_inner_natural_radius_bound()
  self.assertEqual(a['on_selected_inner_choose_branch_only'],'0<=X<=Xcut')
  self.assertFalse(a['source_log_positive_guards_globally_proved'])
if __name__=='__main__':unittest.main()
