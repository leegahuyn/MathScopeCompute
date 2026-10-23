#!/usr/bin/env python3
"""Exact rational CONDITIONAL bound for 523 source natural-series calls.

Source: source-saved-quadratic-series-audit.mjs::naturalSeriesScaledTail
       original B.14/B.15 recurrence, source operation actual_natural_series.

Only when source conditions 0<=Y<=5 and ||(Phi,u)||_{B_rho}<=Q with rho>0
AND common analytic coefficient/domain hypotheses are INDEPENDENTLY proved:
|D_Y^k D_eta^m(source_natural_series - partial_N)|
 <= coefficient_factor(k,m,N,Y) * Q * rho^(-m).

This never computes final A,b,p, never assigns Y=5 as an actual source value
and never authenticates coefficients or analytic continuation.
"""
from fractions import Fraction as F
from math import factorial

# Independent offline checksum-bound root-reachable derivative-order frontier:
# original DAG SHA256 a6d99fd0...e0ca269; definition SHA256 bc058708...beadabb6e
PINNED_SOURCE_SHA256='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
ACTUAL_REACHABLE_DERIVATIVE_SHAPES={
 (0,0):93,(0,1):92,(0,2):77,(0,3):53,(0,4):41,(0,5):19,
 (1,0):42,(1,1):38,(1,2):22,(1,3):10,(1,4):8,(1,5):6,
 (2,0):13,(2,1):7,(3,0):2
}
assert sum(ACTUAL_REACHABLE_DERIVATIVE_SHAPES.values())==523
class MissingSourceNaturalAnalyticPremise(ValueError):pass

def conditional_scaled_tail(k,m,N,Y):
    if any(type(q) is not int for q in [k,m,N]) or min(k,m)<0 or not(k<=N<=10000) or max(k,m)>12:
        raise MissingSourceNaturalAnalyticPremise('Retain source natural derivative budget k,m<=12 and N>=k')
    if type(Y) is float or isinstance(Y,bool):
        raise MissingSourceNaturalAnalyticPremise('Require exact rational Y domain majorant')
    try:Y=F(Y)
    except Exception as e:raise MissingSourceNaturalAnalyticPremise('No source rational Y') from e
    if Y<0 or Y>5:raise MissingSourceNaturalAnalyticPremise('Conditional analytic source Y<=5 must be proved')
    n=N+1
    ratio=Y/F(20)*F(N+2+m,N+2-k)
    if ratio>=1:raise MissingSourceNaturalAnalyticPremise('Natural series ratio requires larger N')
    first=F(factorial(m)*factorial(n+m),factorial(m)*factorial(n))*F(factorial(n),factorial(n-k))
    first*=F(factorial(m),(m+1)**2*20**n*(n+1)**2)*Y**(n-k)
    return ratio,first/(1-ratio)

def original_523_conditional_frontier(N=12,Y='5'):
    if type(N) is not int or N<3:raise MissingSourceNaturalAnalyticPremise('N must retain every original order')
    rows=[]
    for (k,m),calls in sorted(ACTUAL_REACHABLE_DERIVATIVE_SHAPES.items()):
        ratio,b=conditional_scaled_tail(k,m,N,Y)
        rows.append({'radialOrder':k,'etaOrder':m,'actual_original_AST_calls':calls,
                     'ratioUpper':str(ratio),'conditional_scaled_tail_factor':str(b)})
    factor=max(F(row['conditional_scaled_tail_factor']) for row in rows)
    return {'schema':'MathScope.M3.ConditionalOriginal523NaturalSeriesTailFrontier/1',
     'source_first_fivemap_graph_sha256':PINNED_SOURCE_SHA256,
     'original_reachable_natural_series_calls':523,'distinct_derivative_shapes':15,
     'max_source_radial_order':3,'max_source_eta_order':5,
     'truncation_degree':N,'assumed_source_Y_range':['0',str(F(Y))],
     'worst_ratio_upper':str(max(F(x['ratioUpper']) for x in rows)),
     'worst_normalized_tail_factor':str(factor),'per_order':rows,
     'scale':'Q*rho^(-etaOrder)',
     'original_source_Y_domain_proved_here':False,
     'original_coefficient_B_rho_norm_proved_here':False,
     'uniform_complex_analytic_domain_proved_here':False,
     'finite_coefficient_numeric_evaluation_proved_here':False,
     'source_natural_series_actual_values_certified':0,
     'final_original_67_jet_intervals_certified':0,
     'release':'HOLD'}
