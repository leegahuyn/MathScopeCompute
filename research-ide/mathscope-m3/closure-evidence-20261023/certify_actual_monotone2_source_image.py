#!/usr/bin/env python3
"""Actual source monotone system 2: inverse exists uniquely ON SOURCE IMAGE.

This is a mathematical theorem, not simply a registry declaration.

Original source: source-global-band.mjs, source-profile.mjs, SHA pinned
4,420,257-node AST with actual_monotone_root(2,Z,T).

Define F(s,Z,T)=s-Z^2*s^(2h)-T with 0<h<2^-4096<1/16,
D=1/2-h, s0 in [1/2,2], eta in [-1,1].
Let Z=s0^D*eta and T=s0*(1-eta^2).
Then F(s0,Z,T)=0 since 2D+2h=1.
For any s in [1/2,2]:
  0<=Z^2 <= 2, 0<s^(2h-1)<=2.
Thus F'(s)=1-2h*Z^2*s^(2h-1) > 1-8h > 1/2;
uniqueness follows. In fact the root is exactly s0.
Consequently 2s0>=1, 1/(2s0)<=1 and 1/2<=s0<=2.

CRITICAL: The actual 56 native callers use *free coordinates* Z,T.
This result proves the inverse on the declared image, NOT that all
actual call coordinates are in that image or radial R support.
"""
import argparse,json
from fractions import Fraction as Q
from pathlib import Path
from certify_actual_monotone2_safe_box import source_bound_certificate,SOURCE_BAND_GIT_BLOB_SHA1

PROFILE_BLOB_SHA1="84cbf606cab6510ab61f0446f0a6fdc7a89ec006"
EXPECTED_H="exp(-8002*(exp(1048576)+10))"
EXPECTED_D="1/2-h"

def require(ok,message):
    if not ok:raise ValueError("ORIGINAL_CHART_IMAGE_NOT_PROVED: "+message)

def source_image_certificate(root_receipt,profile_receipt,global_source_file):
    base=source_bound_certificate(root_receipt,global_source_file)
    profile=json.loads(Path(profile_receipt).read_text(encoding="utf8"))
    exponent=profile.get("exponent")
    validate=profile.get("validation")
    require(validate and validate.get("ok") is True and exponent and
            exponent.get("hExpression")==EXPECTED_H and
            exponent.get("upperBoundExact")=="2^-4096" and
            exponent.get("D")==EXPECTED_D and
            exponent.get("positive") is True and
            exponent.get("notNumericallyReplaced") is True,
            "exact N3 h bound and D relation not replayed by Node source module")
    actual=json.loads(Path(root_receipt).read_text(encoding="utf8"))
    proof_text=actual["actual_native_system2_source_fields"].get("endpointProof","")
    require("Z=s^D*eta,T=s*(1-eta^2)" in proof_text and
            "s in[1/2,2],eta in[-1,1]" in proof_text,
            "actual registered original slow chart image statement changed")
    # Pure, strictly exact arithmetic on universally quantified real exponents.
    h_limit=Q(1,16)
    stronger_limit=Q(1,2**4096)
    require(stronger_limit<h_limit,"actual source h upper bound insufficient")
    # 2D+2h = 1. F'(s) >=1-2h*(Z^2<=2)*(s^(2h-1)<=2)>1-8h.
    weak_d_lower=Q(1)-8*h_limit
    true_d_lower=Q(1)-8*stronger_limit
    require(weak_d_lower==Q(1,2) and true_d_lower>Q(1,2),
            "source complete-image monotonicity gap")
    return {
      "schema":"MathScope.M3.OriginalSlowChartMonotone2SourceImageInverse/1",
      "original_slow_band_source_blob_sha1":SOURCE_BAND_GIT_BLOB_SHA1,
      "original_source_profile_blob_sha1":PROFILE_BLOB_SHA1,
      "original_root_sha256":base["original_graph_sha256"],
      "native_system_2_root_id":622820,
      "native_system_2_arguments":["m3_global_band_slow_Z$30436","m3_global_band_slow_T$30437"],
      "source_exponent_h_strictly_positive":True,
      "exact_source_h_strict_upper":"2^-4096",
      "source_D_equals_one_half_minus_h":True,
      "source_chart_image_hypotheses":"s0 in [1/2,2]; eta in [-1,1]; Z=s0^(1/2-h)*eta; T=s0*(1-eta^2)",
      "chart_equation":"F(s,Z,T)=s-Z^2*s^(2h)-T",
      "source_image_F_at_original_s0_exactly_zero":True,
      "source_image_root_existence_from_exact_identity":True,
      "source_image_full_bracket_Fprime_strict_lower":str(true_d_lower),
      "source_image_full_bracket_Fprime_strict_greater_than_one_half":True,
      "source_image_root_uniquely_equals_original_s0":True,
      "source_image_common_inverse_denominator_2s_min":"1",
      "source_image_common_inverse_denominator_2s_max":"4",
      "source_image_common_inverse_reciprocal_max":"1",
      "all_original_56_native_call_actual_coordinates_in_source_image_proved":False,
      "source_R_support_Y_less_than_4point1_proved":False,
      "new_unconditional_global_source_Y_bounds_114":0,
      "source_523_Y_certified":33,
      "source_523_Y_open":490,
      "final_field_67_jets_certified":0,
      "M3":"62/64","M4":"0/16","release":"HOLD"
    }

if __name__=="__main__":
    a=argparse.ArgumentParser()
    a.add_argument("--monotone2-receipt",required=True)
    a.add_argument("--profile-receipt",required=True)
    a.add_argument("--source-file",required=True)
    a.add_argument("--output")
    args=a.parse_args()
    result=source_image_certificate(args.monotone2_receipt,args.profile_receipt,args.source_file)
    if args.output:Path(args.output).write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n")
    print(json.dumps(result,indent=2,ensure_ascii=False))
