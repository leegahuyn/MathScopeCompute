#!/usr/bin/env python3
"""Exact conditional L-infinity sufficient criteria for 70 original Omega calls.

For 0<=X<=a^2, Lambda*a^2<512/127 (SHA-pinned N3 source).
Original prefixes Omega0=int_0^X v0, Omega1=int_0^X U0*v0,
Omega2=int_0^X v0^2. Given real integrable functions and independently
proved Mv=sup|v0|, MU=sup|U0| over [0,X], then
Lambda|Omega0| <= (512/127)*Mv,
Lambda|Omega1| <= (512/127)*Mv*MU,
0 <= Lambda Omega2 <= (512/127)*Mv^2.
M <= 635/512 is SUFFICIENT for Y<=5. This DOES NOT assert that the
source has verified such sup norms, positivity of Omega0/Omega1,
or native consumer support X<=a^2.
"""
from fractions import Fraction as F
import json,sys
from pathlib import Path
from audit_original_local_B2_radius_41 import original_local_B2_radius_41
from audit_original_Omega_prefix_sign import source_omega_sign_contract

LAMBDA_A2_UPPER=F(512,127)
PRODUCT_THRESHOLD=F(635,512)
OMEGA_COUNTS=(26,26,18)
class UnprovedOmegaHypothesis(ValueError):pass

def conditional_bound_with_external_sup(Mv,MU):
    """Algebraic check on externally *hypothesized* bounds, NOT evidence."""
    if type(Mv) is not F or type(MU) is not F or Mv<0 or MU<0:
        raise UnprovedOmegaHypothesis('Exact nonnegative rational hypothetical bounds required')
    products=(Mv,Mv*MU,Mv*Mv)
    return {
      'hypothetical_Mv':str(Mv),
      'hypothetical_MU':str(MU),
      'source_proven_supnorm_inputs_present':False,
      'conditional_upper_products':[str(v) for v in products],
      'conditional_non_strict_Lambda_Omega_absolute_upper':[str(LAMBDA_A2_UPPER*v) for v in products],
      'Omega2_Y_nonnegative_under_real_integrability':True,
      'Omega0_and_Omega1_nonnegative_requires_extra_sign_proof':True,
      'sufficient_upper_5':[v<=PRODUCT_THRESHOLD for v in products],
      'source_70_calls_certified_by_hypothetical_input':0,
    }

def original_Omega_local_sup_targets():
    base=original_local_B2_radius_41()
    omega=source_omega_sign_contract()
    if (F(base['conditional_Lambda_a_squared_strict_upper'])!=LAMBDA_A2_UPPER or
        omega['prefix_j_to_integrand']!=['v0','U0*v0','v0^2'] or
        omega['Omega0_sign_from_source_alone']!='UNKNOWN' or
        not omega['Omega2_nonnegative_under_stated_hypotheses'] or
        sum(OMEGA_COUNTS)!=70):
        raise UnprovedOmegaHypothesis('Original source or exact local radius contract drifted')
    assert LAMBDA_A2_UPPER*PRODUCT_THRESHOLD == 5
    return {
      'schema':'MathScope.M3.SourceOmega70LocalSupNormSufficiency/1',
      'original_source_blob_SHA1':omega['original_order_one_blob_SHA1'],
      'original_source_SHA256':omega['original_order_one_SHA256'],
      'original_graph_sha256':base['original_node_SHA256'],
      'original_native_sha256':base['original_native_registry_SHA256'],
      'source_70_call_groups':[{'j':j,'calls':n} for j,n in enumerate(OMEGA_COUNTS)],
      'required_consumer_domain':'0 <= X <= a^2 (NOT established for 70 consumers)',
      'required_source_function_condition':'v0 and U0 real and integrable on [0,X]',
      'exact_upper_on_Lambda_a_squared':str(LAMBDA_A2_UPPER),
      'exact_allowed_sup_product_threshold':str(PRODUCT_THRESHOLD),
      'conditional_criteria':{
        'Omega0':'Mv <= 635/512, plus Omega0 >= 0',
        'Omega1':'Mv*MU <= 635/512, plus Omega1 >= 0',
        'Omega2':'Mv^2 <= 635/512, real v0 ensures Omega2 >= 0',
      },
      'actual_Mv_source_certified':False,
      'actual_MU_source_certified':False,
      'Omega0_Omega1_sign_certified':False,
      'actual_70_native_consumers_support_certified':False,
      'source_70_original_Y_upper_bound_certified':0,
      'original_523_Y_upper_bound_certified':33,
      'original_523_Y_remaining_open':490,
      'actual_67_final_jet_intervals_certified':0,
      'M3':'62/64','M4':'0/16','release':'HOLD',
    }

if __name__=='__main__':
    result=original_Omega_local_sup_targets()
    if len(sys.argv)>1:Path(sys.argv[1]).write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(result,indent=2,ensure_ascii=False))
