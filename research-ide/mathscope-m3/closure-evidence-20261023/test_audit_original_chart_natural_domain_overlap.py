import unittest,tempfile
from pathlib import Path
from audit_original_chart_natural_domain_overlap import (
 verify_chart_natural_domain_mismatch,UnsupportedOriginalChartClaim)

class SourceNaturalChartDomainContradiction(unittest.TestCase):
 def test_exact_source_chart_and_Y8_counterexample(self):
  x=verify_chart_natural_domain_mismatch()
  self.assertEqual(x['Y_at_algebraic_test_point'],'8')
  self.assertFalse(x['declared_full_box_alone_proves_natural_Y_le_5'])
  self.assertEqual(x['necessary_extra_source_chart_condition'],'0<=X<=5/Lambda')
  self.assertEqual(x['conditional_Y_lower_bound_from_chart_box'],'2')
  self.assertTrue(x['actual_source_log_X_over_Xa_positive_if_chart_hypotheses_hold'])
 def test_declared_chart_is_not_actual_point_realizability_proof(self):
  x=verify_chart_natural_domain_mismatch()
  self.assertFalse(x['tested_point_is_known_attained_by_actual_PDE_field'])
  self.assertFalse(x['physical_chart_coverage_or_cutoff_support_proved'])
 def test_no_coefficient_norm_or_final_jet_promotion(self):
  x=verify_chart_natural_domain_mismatch()
  self.assertFalse(x['source_Brho_coefficient_norm_le_Q_proved'])
  self.assertFalse(x['source_complex_eta_domain_proved'])
  self.assertEqual(x['actual_original_final_67_jets_certified'],0)
  self.assertEqual(x['remaining_source_Y_bound_calls_after_this_audit'],490)
 def test_reject_synthetic_changed_chart_even_if_source_has_some_numeric_bounds(self):
  with tempfile.TemporaryDirectory() as d:
   path=Path(d)/'fake.mjs'
   path.write_text("slowPointDomain:'X in[Xa/2,Xb]', positiveWeightDomain:'Xa<X<Xb'\n")
   with self.assertRaises(UnsupportedOriginalChartClaim):
    verify_chart_natural_domain_mismatch(path)
if __name__=='__main__':unittest.main()
