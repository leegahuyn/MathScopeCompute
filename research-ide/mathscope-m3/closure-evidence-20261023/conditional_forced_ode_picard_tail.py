#!/usr/bin/env python3
"""Uniform finite-order Picard tail for original zero-data 3x3 forced pulses.

w'(t)=M(t)w(t)+g(t), w(0)=0, 0<=t<=L.
If M's induced infinity norm <= A and ||g||infty <= B (both supplied
as source-authenticated bounds), the retained ordered integrals
w_0..w_N have uniform tail
  ||w - sum_{j=0}^N w_j|| <= B L (A L)^(N+1) exp(A L)/(N+2)!.
This is a conditional analytic lemma, not a numeric evaluation of the
actual 4.4M graph or the original M(t), g(t), or all derivative orders.
"""
from fractions import Fraction as Q
from math import factorial
from rigorous_rational_intervals import Interval,UncertifiedExpression
from certified_bounded_transcendentals import exp_positive_bounded

def _q(value):
    if type(value) is float or type(value) is bool or not isinstance(value,(str,int,Q)):
        raise UncertifiedExpression('Only exact source-proved rational majorants accepted')
    try:return Q(value)
    except Exception as e:raise UncertifiedExpression('Invalid exact rational majorant') from e

def conditional_original_forced_ode_tail(A,B,L,retained_orders):
    A,B,L=map(_q,(A,B,L))
    if min(A,B,L)<0:raise UncertifiedExpression('Induced row norm, source norm and interval length must be nonnegative')
    if type(retained_orders) is not int or not 0<=retained_orders<=256:
        raise UncertifiedExpression('Finite retained Picard order 0..256 required')
    x=A*L
    if x>16:raise UncertifiedExpression('Need new directed exponential bound for source A*L>16')
    e=exp_positive_bounded(Interval(x,x),terms=25)
    upper=B*L*x**(retained_orders+1)*e.hi/Q(factorial(retained_orders+2))
    return {
      'schema':'MathScope.N6.ConditionalForced3x3PicardTail/1',
      'source_norm_bound_A':str(A),
      'source_forcing_bound_B':str(B),
      'source_interval_length_L':str(L),
      'retained_order_0_through_N':retained_orders,
      'tail_norm_closed_interval':['0',str(upper)],
      'proof':'Picard term j <= B*A^j*L^(j+1)/(j+1)!; factorial comparison with e^(A*L) bounds discarded j>N.',
      'dimension':3,'zero_data':True,
      'actual_native_ode_coefficients_source_certified':False,
      'actual_original_source_derivative_majorants_proved':False,
      'actual_final_67_jet_intervals_certified':0,
      'status':'GENERIC_SOURCE_CONDITIONAL_THEOREM_NOT_ORIGINAL_ODE_CERTIFICATE',
      'release':'HOLD'}
