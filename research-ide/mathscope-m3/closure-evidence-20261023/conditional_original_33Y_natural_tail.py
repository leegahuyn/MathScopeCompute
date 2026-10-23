#!/usr/bin/env python3
"""Original 33 root-reachable source calls: rigorous CONDITIONAL N=12 tail.

Inputs must be the actual SHA-verified real-56 source argument receipt from
audit_original_56_Y_eta_domain.py. Only source-proved 0<=Y<=5 bounds are used:
 Y=4 (15 calls) and Y=4exp(t1)<32/7 (18 calls).
The source coefficient Banach norm Q, analytic rho disk, actual eta values,
finite B.14/B.15 coefficients and all-cycle final field are NOT certified.
"""
from fractions import Fraction as F
from pathlib import Path
import json,sys
from conditional_original_natural523_tail import conditional_scaled_tail
from audit_original_56_Y_eta_domain import SOURCE_SHA
class MissingOriginalCoefficientPremise(ValueError):pass

def conditional_source33_envelope(verified_56_receipt):
    a=verified_56_receipt
    if(a.get('source_sha256')!=SOURCE_SHA or a.get('natural_calls')!=523 or
       a.get('unique_Y_eta_pairs')!=56 or
       a.get('original_source_Y_interval_0_to_5_algebraically_certified_calls')!=33 or
       a.get('final_original_67_jets_certified')!=0):
        raise MissingOriginalCoefficientPremise('Need authentic source 56-row mathematical proof receipt')
    rows=[]
    covered=0
    for item in a['pairs']:
        cls=item['source_Y_algebraic_classification']
        if not cls.get('Y_upper5_proved'):continue
        if cls['shape']=='SOURCE_EXACT_RATIONAL_Y_LE_5':
            majorant=F(cls['exact_Y'])
        elif cls['shape']=='SOURCE_LAMBDA_XA_EXP_CANCELS_TO_FOUR_TIMES_EXP':
            if not cls.get('exponent_bound_proved') or cls.get('source_t1_upper')!='1/8':
                raise MissingOriginalCoefficientPremise('Original t1 inequality not certified')
            majorant=F(cls['source_Y_strict_upper_bound'])
        else:raise MissingOriginalCoefficientPremise('Unexpected unproved source case promoted')
        if not 0<=majorant<=5:raise MissingOriginalCoefficientPremise('Source Y outside admissible interval')
        for key,n in item['derivative_orders'].items():
            k,m=map(int,key.split(','))
            if n<1:raise MissingOriginalCoefficientPremise('Invalid source mode call count')
            ratio,bound=conditional_scaled_tail(k,m,12,majorant)
            rows.append({'Y_root':item['Y_node_id'],'Y_upper':str(majorant),
              'component_case':cls['shape'],'k':k,'m':m,'actual_call_count':n,
              'conditional_scaled_tail_ratio_upper':str(ratio),
              'conditional_scaled_tail_coefficient':str(bound),
              'conditional_full_bound':'('+str(bound)+') * Q * rho^(-'+str(m)+')'})
            covered+=n
    if covered!=33:raise MissingOriginalCoefficientPremise('Source backed call coverage changed')
    return {'schema':'MathScope.M3.Original33ProvedYConditionalDegree12Tail/1',
      'source_original_node_sha256':SOURCE_SHA,
      'original_Y_interval_algebraically_certified_calls':33,
      'source_derivative_rows':rows,
      'truncation_order':12,
      'Y_bounds_proven_for_these_calls':True,
      'source_coefficient_Brho_norm_le_Q_proven':False,
      'shared_complex_eta_domain_proven':False,
      'finite_original_natural_coefficients_numerically_certified':0,
      'final_original_67_jet_intervals_certified':0,
      'release':'HOLD'}
if __name__=='__main__':
    if len(sys.argv)!=3:raise SystemExit('Usage: script.py authentic_real56_receipt.json output.json')
    r=conditional_source33_envelope(json.loads(Path(sys.argv[1]).read_text()))
    Path(sys.argv[2]).write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'source_Y_domain_proven_calls':33,'conditional_rows':len(r['source_derivative_rows']),
                     'final_67':0,'release':'HOLD'}))
