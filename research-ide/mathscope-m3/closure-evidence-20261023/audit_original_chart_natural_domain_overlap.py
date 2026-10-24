#!/usr/bin/env python3
"""Sound fail-closed check: the declared ORIGINAL full slow-chart box does NOT
imply the natural-series tail's Y<=5 for source Y=Lambda*X.

Xa=4/Lambda>0. Original box X in[Xa/2,2Xb] with Xb>Xa
contains the algebraic test point X=2Xa, at which Y=Lambda X=8>5.
This is a counterexample to inferring a box-wide upper bound ONLY; it is not
an assertion that every X is attained by the physical PDE fields.
The natural-series call needs a narrower chart/collar guard X<=5/Lambda.
"""
from pathlib import Path
from fractions import Fraction as F
from pinned_n3_parameter_intervals import pinned_profile
from prove_original_n3_Q_rho_signs import original_n3_Q_rho_strict_positivity

class UnsupportedOriginalChartClaim(ValueError):pass

def verify_chart_natural_domain_mismatch(source_path=None):
    if source_path is None:
        source_path=Path(__file__).resolve().parents[1]/'navier/source-global-band.mjs'
    text=Path(source_path).read_text(encoding='utf8')
    phrases=(
     "slowPointDomain:'Original image s in[1/2,2], X in[Xa/2,2Xb], eta in[-1,1].'",
     "positiveWeightDomain:'Additionally Xa<X<Xb and ell>=the explicit ell0.'"
    )
    if any(s not in text for s in phrases):
        raise UnsupportedOriginalChartClaim('Original source chart constraints changed')
    profile=pinned_profile()
    if profile['parametersExactExpressions'].get('Xa')!={'quotient':[{'integer':4},{'ref':'Lambda'}]}:
        raise UnsupportedOriginalChartClaim('Original Xa formula changed')
    signs=original_n3_Q_rho_strict_positivity()
    if not signs['Lambda_is_strictly_positive']:
        raise UnsupportedOriginalChartClaim('Lambda strict positivity not established')
    # Xa/2 < 2Xa < 2Xb whenever Xb>Xa, and Y(2Xa)=8>5.
    normalized_inner_test=F(2)  # X/Xa at witness
    normalized_Y_test=F(4)*normalized_inner_test
    if normalized_Y_test!=8 or not normalized_Y_test>5:
        raise AssertionError('Exact chart counterexample unexpectedly changed')
    return {
      'schema':'MathScope.M3.OriginalChartNaturalRadiusCoverageAudit/1',
      'profile_id':profile['id'],
      'source_parameter_expression_sha256':profile['parameterExpressionSHA256'],
      'source_chart_box':'Xa/2 <= X <= 2*Xb; additionally Xa < Xb',
      'natural_y_expression':'Y=Lambda*X','Xa_relation':'Xa=4/Lambda',
      'algebraic_full_box_test_point':'X=2*Xa',
      'algebraic_test_point_is_in_declared_bounding_box':True,
      'Y_at_algebraic_test_point':'8',
      'natural_tail_criterion':'Y<=5',
      'declared_full_box_alone_proves_natural_Y_le_5':False,
      'necessary_extra_source_chart_condition':'0<=X<=5/Lambda',
      'tested_point_is_known_attained_by_actual_PDE_field':False,
      'physical_chart_coverage_or_cutoff_support_proved':False,
      'source_complex_eta_domain_proved':False,
      'source_Brho_coefficient_norm_le_Q_proved':False,
      'remaining_source_Y_bound_calls_after_this_audit':490,
      'actual_original_final_67_jets_certified':0,
      'release':'HOLD'}
