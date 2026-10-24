#!/usr/bin/env python3
"""Source-bound *local* radius bridge to Proposition B.2's 0<=Y<=4.1.

Xa=4/Lambda and 0<t1<1/8. Xkeep=Xa exp(t1/64), Xcut=Xa
exp(t1/32), a^2=Xa exp(t1/16), so 0<=Lambda X<512/127<41/10
on 0<=X<=a^2. The same is true for Y=Lambda xi^2 if |xi|<=a.

Neither the local radius nor the source's native radialDomain proves
that all 114 X and 33 xi^2 natural-series root consumers respect this
domain. Zero new globally certified calls; RELEASE HOLD retained.
"""
import hashlib
import json
import sys
from fractions import Fraction as F
from pathlib import Path

from pinned_n3_parameter_intervals import pinned_profile
from prove_original_n3_t1_natural_domain import source_t1_strict_upper_bound
from prove_original_inner_Xcut_natural_radius import first_order_inner_natural_radius_bound

GRAPH_SHA = 'a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REG_SHA = 'bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
INNER_BLOB = 'c49e1d871cb9e2a226964797b13a32e43b89366c'
ORDER_ONE_BLOB = 'a94a7079f6884795b79145a143ca2ba7ab15a1eb'

class ChangedOriginalLocalSource(ValueError):
    pass

def original_blob_sha(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

def authenticate(path, expected_blob, required):
    data=Path(path).read_bytes()
    if original_blob_sha(data)!=expected_blob:
        raise ChangedOriginalLocalSource('Original Git source blob changed: '+str(path))
    text=data.decode('utf-8')
    if not all(s in text for s in required):
        raise ChangedOriginalLocalSource('Original source expression missing: '+str(path))
    return hashlib.sha256(data).hexdigest()

def original_local_B2_radius_41(inner_path=None,order_one_path=None):
    base=Path(__file__).resolve().parents[2]/'mathscope-m2'/'navier'
    inner_path=Path(inner_path) if inner_path is not None else base/'actual-continuation-exact-inner.mjs'
    order_one_path=Path(order_one_path) if order_one_path is not None else base/'actual-continuation-exact-order-one.mjs'
    inner_sha=authenticate(inner_path,INNER_BLOB,(
        "aSquared=G.mul(Xa,G.exp(G.div(t1,q(16))))",
        "a=G.sqrt(aSquared)",
        "F0=G.choose(X,Xa,aSquared,naturalF,collarF,collarF)",
        "U0=G.choose(X,Xa,aSquared,naturalU,collarU,collarU)",
        "v0=G.choose(X,Xa,aSquared,coreVoverX,collarVoverX,collarVoverX)",
        "const xi=G.var('actual_inner_xi')",
        "const atXi=id=>G.substitute(id,X,G.pow(xi,2))",
        "radialDomain:[z,a]",
    ))
    order_sha=authenticate(order_one_path,ORDER_ONE_BLOB,(
        "Xkeep=G.mul(Xa,G.exp(G.div(t1,q(64))))",
        "Xcut=G.mul(Xa,G.exp(G.div(t1,q(32))))",
        "Ft=G.choose(X,Xkeep,Xcut,Fraw,G.mul(kappa,Fraw),z)",
        "Ut=G.choose(X,Xkeep,Xcut,Uraw,G.mul(kappa,Uraw),z)",
        "axisAverage=G.integral(G.substitute(inner.U1at(G.mul(t,X)),eta,eta),t,z,o)",
    ))
    profile=pinned_profile()
    if profile['parametersExactExpressions'].get('Xa')!={'quotient':[{'integer':4},{'ref':'Lambda'}]}:
        raise ChangedOriginalLocalSource('Pinned Xa=4/Lambda identity missing')
    sign=source_t1_strict_upper_bound()
    if not sign['original_t1_positive'] or sign['original_t1_strict_upper_bound']!='1/8':
        raise ChangedOriginalLocalSource('Original 0<t1<1/8 bound missing')
    prior=first_order_inner_natural_radius_bound(order_one_path)
    if not prior['conditional_selected_inner_branch_Lambda_X_le_5_proved']:
        raise ChangedOriginalLocalSource('Earlier Xcut proof not authenticated')
    # exp(s)<1/(1-s) for 0<s<1. Apply t1<1/8.
    keep=F(4)/(1-F(1,8*64))
    cut=F(4)/(1-F(1,8*32))
    a2=F(4)/(1-F(1,8*16))
    if not (F(4)<keep<cut<a2<F(41,10)<F(5)):
        raise AssertionError('Failed original local analytic domain comparison')
    return {
      'schema':'MathScope.M3.OriginalLocalB2AnalyticRadiusSourceBridge/1',
      'original_first_FiveMap_only':True,
      'original_node_SHA256':GRAPH_SHA,
      'original_native_registry_SHA256':REG_SHA,
      'pinned_parameter_expression_SHA256':profile['parameterExpressionSHA256'],
      'inner_original_Git_blob_SHA1':INNER_BLOB,
      'inner_original_SHA256':inner_sha,
      'order_one_original_Git_blob_SHA1':ORDER_ONE_BLOB,
      'order_one_original_SHA256':order_sha,
      'proposition_B2_real_interval_reference':'0 <= Y <= 41/10 (4.1), paper Proposition B.2 / B.13',
      'proof_inequality':'exp(s) < 1/(1-s) for 0<s<1',
      'Xa_times_Lambda':'4',
      'conditional_Lambda_Xkeep_strict_upper':str(keep),
      'conditional_Lambda_Xcut_strict_upper':str(cut),
      'conditional_Lambda_a_squared_strict_upper':str(a2),
      'local_X_zero_to_a_squared_implies_Y_in_B2_interval':True,
      'local_picard_abs_xi_le_a_implies_Y_in_B2_interval':True,
      'inner_leading_F0_U0_v0_source_choose_Xa_a_squared_anchors_verified':True,
      'native_picard_radial_domain_zero_to_a_source_verified':True,
      'actual_consumer_paths_to_local_picard_domain_verified':False,
      'all_114_Lambda_X_calls_support_proved':False,
      'all_33_Lambda_xi_squared_calls_support_proved':False,
      'all_70_Lambda_Omega_calls_range_proved':False,
      'source_217_new_unconditional_Y_bounds':0,
      'original_523_previously_certified_Y_bounds':33,
      'original_523_unproved_Y_bounds':490,
      'coefficient_Brho_norm_proved':False,
      'common_complex_eta_domain_proved':False,
      'original_finite_natural_coefficients_enclosed':0,
      'final_67_jets_certified':0,
      'M3':'62/64','M4':'0/16','release':'HOLD',
    }

if __name__=='__main__':
    out=original_local_B2_radius_41()
    if len(sys.argv)>1:
        Path(sys.argv[1]).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(out,ensure_ascii=False,indent=2))
