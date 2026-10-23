#!/usr/bin/env python3
"""Exact rational conditional Picard tail for source actual_covariance_volterra.

Original covarianceSystems describes a real 2x2 matrix IVP
   y'(v)=M(v)y(v), y(0)=y0,
with a source-specific matrix norm, interval length and initial vector.

Provided source AUTHENTICATED majorants A>=sup||M||_infty,
Y>=||y0||_infty, L>=length, Picard finite truncation 0..N
has an error <= Y*(A*L)^(N+1)*exp(A*L)/(N+1)!.
This module does not infer A/Y/L from SourceExpressions root IDs.
"""
from fractions import Fraction as F
from math import factorial
from rigorous_rational_intervals import Interval,UncertifiedExpression
from certified_bounded_transcendentals import exp_positive_bounded

def rational(x,name):
    if isinstance(x,(float,bool)) or not isinstance(x,(str,int,F)):
        raise UncertifiedExpression('Exact source-certified rational required: '+name)
    try:return F(x)
    except Exception as e:raise UncertifiedExpression('Invalid certified rational '+name) from e

def original_covariance_volterra_tail(matrix_norm_upper,initial_norm_upper,
                                    interval_length,retained_order):
    A=rational(matrix_norm_upper,'A')
    Y=rational(initial_norm_upper,'Y')
    L=rational(interval_length,'L')
    if min(A,Y,L)<0:raise UncertifiedExpression('All source norm majorants must be nonnegative')
    if type(retained_order) is not int or retained_order<0 or retained_order>256:
        raise UncertifiedExpression('Require finite integer 0 <= retained_order <= 256')
    x=A*L
    if x>16:raise UncertifiedExpression('Source requires a separately proved bound for exp(A*L) when A*L>16')
    exponential=exp_positive_bounded(Interval(x,x),terms=32)
    error=Y*x**(retained_order+1)*exponential.hi/F(factorial(retained_order+1))
    return {
      'schema':'MathScope.M3.ConditionalOriginalCovarianceVolterraTail/1',
      'matrix_dimension':2,'initial_norm_majorant':str(Y),
      'matrix_induced_infinity_norm_majorant':str(A),
      'original_interval_length_majorant':str(L),
      'retained_picard_order':retained_order,
      'tail_norm_closed_interval':['0',str(error)],
      'source_covariance_system_ID':None,
      'actual_original_matrix_and_norm_upper_value_evaluated':False,
      'actual_native_registry_SHA256_verified_by_this_function':False,
      'higher_order_derivative_majorants_proved':False,
      'final_all_cycle_A_b_p_values_evaluated':False,
      'actual_original_final_67_jets_certified':0,
      'release':'HOLD'}
