#!/usr/bin/env python3
"""Source-proof: first-order original inner X branch has Y=Lambda X <5.

This checks the SAME immutable source order-one choose windows:
  Xkeep = Xa exp(t1/64), Xcut = Xa exp(t1/32)
  Ft = choose(X,Xkeep,Xcut,Fraw,kappa*Fraw,0).
For actual evaluation ONLY along this specific choose branch, 0<=X<=Xcut,
so 0<=Lambda X <= 4 exp(t1/32) <1024/255<5.

This is not a proof that all graph-root-reachable X-dependent natural
calls are within this branch: those require a path-sensitive analysis through
all native defining bodies, all choose branches and domain restrictions.
"""
from pathlib import Path
from fractions import Fraction as F
from prove_original_n3_t1_natural_domain import source_t1_strict_upper_bound
from pinned_n3_parameter_intervals import pinned_profile

class MissingOriginalInnerBranchProof(ValueError):pass

def first_order_inner_natural_radius_bound(source=None):
    src=Path(source) if source is not None else (
      Path(__file__).resolve().parents[2]/'mathscope-m2/navier/actual-continuation-exact-order-one.mjs')
    s=src.read_text(encoding='utf8')
    snippets=[
      "Xa=G.parameter('Xa'),t1=G.parameter('t1')",
      "Xkeep=G.mul(Xa,G.exp(G.div(t1,q(64))))",
      "Xcut=G.mul(Xa,G.exp(G.div(t1,q(32))))",
      "Ft=G.choose(X,Xkeep,Xcut,Fraw,G.mul(kappa,Fraw),z)",
      "Ut=G.choose(X,Xkeep,Xcut,Uraw,G.mul(kappa,Uraw),z)"
    ]
    for item in snippets:
      if item not in s:raise MissingOriginalInnerBranchProof('Original source branch changed: '+item)
    p=pinned_profile()
    if p['parametersExactExpressions'].get('Xa')!={'quotient':[{'integer':4},{'ref':'Lambda'}]}:
      raise MissingOriginalInnerBranchProof('Source Xa identity not retained')
    sign=source_t1_strict_upper_bound()
    if not sign['original_t1_positive'] or sign['original_t1_strict_upper_bound']!='1/8':
      raise MissingOriginalInnerBranchProof('Exact original positive t1 upper not proved')
    cut_upper=F(4)/(1-F(1,8*32))
    keep_upper=F(4)/(1-F(1,8*64))
    if not F(0)<keep_upper<cut_upper<5:raise AssertionError('Invalid original inner support bound')
    return {'schema':'MathScope.M3.OrderOneInnerBranchNaturalRadiusProof/1',
      'source_N3_parameter_SHA256':p['parameterExpressionSHA256'],
      'inner_F_and_U_choose_window_byte_verified':True,
      'original_X_keep_identity':'Xa*exp(t1/64)',
      'original_X_cut_identity':'Xa*exp(t1/32)',
      'on_selected_inner_choose_branch_only':'0<=X<=Xcut',
      'conditional_Lambda_X_keep_strict_upper':str(keep_upper),
      'conditional_Lambda_X_cut_strict_upper':str(cut_upper),
      'conditional_selected_inner_branch_Lambda_X_le_5_proved':True,
      'all_114_physically_reachable_Lambda_X_calls_inside_that_branch_proved':False,
      'other_490_natural_calls_Y_bounded':False,
      'source_log_positive_guards_globally_proved':False,
      'common_Brho_coefficient_norm_proved':False,
      'common_complex_eta_domain_proved':False,
      'original_finite_coefficients_interval_evaluated':False,
      'actual_final_67_jets_certified':0,'release':'HOLD'}
