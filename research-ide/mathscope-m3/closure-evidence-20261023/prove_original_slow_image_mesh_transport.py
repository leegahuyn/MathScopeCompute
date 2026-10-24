#!/usr/bin/env python3
"""Exact rational SAME-MESH transport of the original Navier-Stokes slow-chart image.

Original F(s,Z,T)=s-Z²*s^(2h)-T, D=1/2-h, 0<h<2^-4096.
Assume source image reference (s0,eta0):
  1/2+delta <= s0 <= 2-delta, |eta0|<=1,
  Z0=s0^D eta0,T0=s0(1-eta0²) >= epsT.
The source band declares same-box Euclidean distance <=4/S³,
S=ell². If the actual target (Z,T) is THIS point in the same box,
|Z-Z0|,|T-T0|<=eps=4/ell^6.
For 0<delta<=1/2, Z0²<=2-delta and
 |Z²-Z0²| <= (2*sqrt(2)+eps)*eps < 3eps+eps².
 If 3eps+eps²<delta, Z²<2.
 |F(s;Z,T)-F(s;Z0,T0)| <= 2*(3eps+eps²)+eps
                          = 7eps+2eps² for s in [1/2,2].
 F'(s;Z0,T0)>1/2; so at source endpoints the reference margins are
  >=delta/2. Thus when 7eps+2eps²<delta/2, both target
 endpoint signs hold, and target T>=T0-eps>=0.
 Therefore target is in the actual slow-chart image and inverse exists
 uniquely in [1/2,2], giving inverse denominator 2s>=1.

With delta=1/8 and every integer ell>=3, these strict inequalities
hold by exact rational comparison (max eps=4/729).

CRITICAL: Actual final 11-root path use of this same-box transport,
source representative interior s0 margin and T0 lower bound, and
all native #623935 coordinate substitutions are NOT proven by this lemma.
"""
import argparse,json,hashlib
from fractions import Fraction as Q
from pathlib import Path

BAND_SHA="1f1c18a26372c998d8389b6c5138b3c9d3a66f36"
PROFILE_SHA="84cbf606cab6510ab61f0446f0a6fdc7a89ec006"

class MissingActualMeshSupport(ValueError):pass

def require(ok,msg):
    if not ok:raise MissingActualMeshSupport(msg)

def exact_transport(ell,delta=Q(1,8)):
    require(type(ell) is int and ell>=1,"original ell positive integer required")
    require(type(delta) is Q and Q(0)<delta<=Q(1,2),"strict reference interior margin delta")
    eps=Q(4,ell**6)
    zsq_err=3*eps+eps*eps
    endpoint_err=2*zsq_err+eps
    require(zsq_err<delta,"source derivative Z squared small-box margin not met")
    require(endpoint_err<delta/2,"source image boundary endpoint margin not met")
    return {
       "ell_integer":ell,
       "reference_s_interior_margin_delta":str(delta),
       "source_same_box_max_absolute_Z_T_displacement":str(eps),
       "Z_squared_variation_upper_rational":str(zsq_err),
       "source_endpoint_F_variation_upper_rational":str(endpoint_err),
       "reference_T0_strict_requirement":f"T0 >= {eps}",
       "reference_s_strict_requirement":f"1/2+{delta} <= s0 <= 2-{delta}",
       "source_image_target_certified_given_exact_assumptions":True,
       "target_original_slow_root_exists_and_is_unique":True,
       "target_source_inverse_denominator_two_s_lower":"1",
    }

def pin_and_prove(source_band,source_profile,source_two_root=None):
    original=Path(source_band).read_bytes()
    profile=Path(source_profile).read_bytes()
    sha=lambda b:hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
    require(sha(original)==BAND_SHA and sha(profile)==PROFILE_SHA,
            "original Git SHA pins missing")
    src=original.decode();pf=profile.decode()
    require("S=G.pow(ell,2)" in src and
            "Euclidean distance<=4/S^3." in src and
            "slowPointDomain:'Original image s in[1/2,2]" in src and
            "endpointProof:'The same original image Z=s^D*eta,T=s*(1-eta^2)" in src and
            "D:'1/2-h'" in pf and "upperBoundExact:'2^-4096'" in pf,
            "exact original mesh-size/source-chart/N3 constants")
    if source_two_root:
        r=json.loads(Path(source_two_root).read_text(encoding='utf8'))
        require(r.get("schema")=="MathScope.M3.Original2Root2SourceImageEndpointObligations/1"
                and r.get("original_662_syntactic_calls_semantically_relevant")==2
                and r["original_transformed_chart_call"]["node_id"]==623935
                and not r["all_actual_two_root_calls_image_domains_proved"],
                "unapproved promotion or wrong source root call")
    smallest=exact_transport(3)
    return {
      "schema":"MathScope.M3.OriginalSlowChartSameMeshImageTransportConditional/1",
      "original_source_band_blob_sha1":BAND_SHA,
      "original_source_profile_blob_sha1":PROFILE_SHA,
      "source_same_mesh_diameter":"<=4/S^3, S=ell^2",
      "source_mesh_epsilon":"4/ell^6",
      "valid_for_all_integer_ell_at_least":3,
      "source_reference_s_delta":"1/8",
      "all_ell_ge3_sufficient_by_exact_monotonicity":True,
      "worst_ell_3_exact_certificate":smallest,
      "required_original_reference_image_s_interior":"5/8 <= s0 <= 15/8",
      "required_original_reference_T0_positivity":"T0 >= 4/ell^6",
      "required_actual_target_same_mesh_box_with_that_reference":True,
      "actual_reachable_root_623935_has_source_same_mesh_attachment_certified":False,
      "actual_reachable_root_622820_image_conditions_certified":False,
      "source_interior_reference_s_and_T_bounds_certified":False,
      "original_global_monotone2_source_image_newly_certified":0,
      "original_114_natural_Y_newly_certified":0,
      "original_523_natural_Y_certified":33,
      "original_523_natural_Y_OPEN":490,
      "original_67_final_jets_certified":0,
      "M3":"62/64","M4":"0/16","release":"HOLD"
    }

if __name__=="__main__":
    a=argparse.ArgumentParser()
    a.add_argument('--source-global-band',required=True)
    a.add_argument('--source-profile',required=True)
    a.add_argument('--two-root-receipt')
    a.add_argument('--output')
    x=a.parse_args()
    result=pin_and_prove(x.source_global_band,x.source_profile,x.two_root_receipt)
    if x.output:Path(x.output).write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(result,indent=2,ensure_ascii=False))
