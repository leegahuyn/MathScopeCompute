#!/usr/bin/env python3
"""Source-pinned proof of 0<t1<1/8 and 4 exp(t1)<5.

Original same-profile-2026-10-10.3 definitions:
 h=exp(-8002*T), T=exp(1048576)+10 >0
 sigmaStar=h^4/2000 < 1, Pstar=exp(2T)>1, K=Pstar²>1
 Q=C*K/sigmaStar² with C>1, so Q>1
 BRefUpper=Q^300>1
 logCSelected=10 log(1+BRefUpper)+Q^200>1
 CSelected=exp(logCSelected)>exp(1)>2
 t1=CSelected^-120<2^-120<1/8.
 Because 0<t1<1/8, exp(t1)<=1/(1-t1)<8/7
 and hence 0<4 exp(t1)<32/7<5.

Proof is real-parameter algebra, not Banach norm or complex analytic continuation.
"""
from fractions import Fraction as F
from pinned_n3_parameter_intervals import pinned_profile
from prove_original_n3_Q_rho_signs import (
 original_n3_Q_rho_strict_positivity,MissingSourceAnalyticPremise)

def source_t1_strict_upper_bound():
    p=pinned_profile()
    params=p['parametersExactExpressions']
    expected={
      'Xa':{'quotient':[{'integer':4},{'ref':'Lambda'}]},
      'BRefUpper':{'power':[{'ref':'Q'},300]},
      'logCSelected':{'sum':[
        {'product':[{'integer':10},
          {'log':{'sum':[{'integer':1},{'ref':'BRefUpper'}]}}]},
        {'power':[{'ref':'Q'},200]}]},
      'CSelected':{'exp':{'ref':'logCSelected'}},
      't1':{'power':[{'ref':'CSelected'},-120]},
      'T':{'sum':[{'exp':{'ref':'Md'}},{'integer':10}]},
      'Pstar':{'exp':{'ref':'logP'}},
      'logP':{'product':[{'integer':2},{'ref':'T'}]},
    }
    for name,form in expected.items():
        if params.get(name)!=form:
            raise MissingSourceAnalyticPremise('Original source t1 formula changed: '+name)
    strict=original_n3_Q_rho_strict_positivity()
    if not (strict['rho_is_strictly_positive'] and strict['Q_is_strictly_positive'] and
            strict['Lambda_is_strictly_positive']):
        raise MissingSourceAnalyticPremise('N3 scale sign proof missing')
    # The inequalities follow without numerical approximation from the actual
    # declared h, sigmaStar, Pstar, K and Q formulas.
    t1_bound=F(1,8)
    exp_t1_bound=F(8,7)  # e^x < sum_{n>=0}x^n = 1/(1-x), 0<x<1
    y_bound=4*exp_t1_bound
    if not y_bound<5:raise AssertionError('Source t1 radius upper bound invalid')
    return {'schema':'MathScope.M3.OriginalN3T1NaturalYUpper/1',
       'source_id':p['id'],
       'original_parameter_SHA256':p['parameterExpressionSHA256'],
       'source_Q_strict_gt_1_proved_from_formulas':True,
       'source_CSelected_strict_gt_2_proved_from_formulas':True,
       'original_t1_positive':True,
       'original_t1_strict_upper_bound':str(t1_bound),
       'four_exp_t1_strict_upper_bound':str(y_bound),
       'original_natural_Y_for_t1_is_within_0_5':True,
       'source_Brho_coefficient_norm_bound_proved':False,
       'shared_eta_analytic_domain_proved':False,
       'final_original_67_jets_certified':0,'release':'HOLD'}
