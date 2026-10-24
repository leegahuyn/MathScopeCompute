#!/usr/bin/env python3
"""A genuine analytic sufficient domain for actual slow-band monotone root #2.

Verified authentic original chart equation (source-global-band.mjs and
4.42M original AST):
 F(s;Z,T,h) = s - Z^2*s^(2h) - T.

On the explicitly stated REAL box:
  0 < h < 1/16, |Z| <= 1/2, 1/2 <= T <= 3/2,
  s in [1/2,2],
there is exactly one root s*. Proof:
 F(1/2) <= 1/2-T <=0;
 F(2) >=2- (1/4)*2 -3/2 =0 (2^(2h)<2);
 F'(s)=1-2h Z^2*s^(2h-1)>1-(1/8)(1/4)(2)=15/16>1/2.
Hence 1/2 <=s*<=2 and 2s*>=1, (2s*)^-1<=1.

The *actual* 56 native callers' Z,T,h are not proved to be in this
box, nor are all source R/support bounds proved. Do not count this
conditional theorem as 56 globally certified native callers.
"""
import argparse,json
from fractions import Fraction as Q
from pathlib import Path
from hashlib import sha256

SOURCE_GRAPH_SHA="a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269"
SOURCE_NATIVE_SHA="bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e"
SOURCE_BAND_GIT_BLOB_SHA1="1f1c18a26372c998d8389b6c5138b3c9d3a66f36"
SOURCE_EXPRESSION="chartBody=G.sub(G.sub(sv,G.mul(G.pow(Z,2),power(sv,G.mul(q(2),h)))),T)"
EXPECTED={"left":19,"right":24,"derivativeLower":19,"derivativeUpper":1,"body":622819,"variable":622810}

def demand(ok,why):
    if not ok:raise ValueError("UNPROVED_MONOTONE_2_DOMAIN: "+why)

def source_bound_certificate(source_receipt,source_file=None):
    c=json.loads(Path(source_receipt).read_text(encoding="utf8"))
    demand(c["schema"]=="MathScope.M3.MonotoneRoot2ActualArgumentInterval/1" and
       c["graph_sha256"]==SOURCE_GRAPH_SHA and c["registry_sha256"]==SOURCE_NATIVE_SHA
       and c["original_root_node_id"]==622820 and c["original_system_id"]==2
       and c["original_56_derived_denominator_node"]==622822,
       "original slow-chart monotone2 SHA/system/denominator identity")
    actual=c["actual_arguments"]
    demand([v["id"] for v in actual]==[622803,622804] and
       [v["node"]["args"][0] for v in actual]==[
       "m3_global_band_slow_Z$30436","m3_global_band_slow_T$30437"],
       "source actual slow-chart Z,T coordinate identities")
    d=c["source_definition_root_ids"]
    demand(all(d[k]==n for k,n in EXPECTED.items()),"source exact bracket/body/formal coordinate")
    trees=c["original_endpoint_and_derivative_source_trees"]
    for name,num,den in (("left",1,2),("right",2,1),("derivativeLower",1,2),("derivativeUpper",1,1)):
        demand(trees[name]["source_tree"]=={"id":d[name],"op":"rational","args":[str(num),str(den)]},
               "source bracket/derivative rational literal: "+name)
    if source_file:
        src=Path(source_file).read_text(encoding="utf8")
        demand(SOURCE_EXPRESSION in src and
          "name:'ActualCommonBandSlowInverse'" in src and
          "left:q(1,2),right:q(2),derivativeLower:q(1,2),derivativeUpper:G.one" in src,
          "original source-global-band body or root bracket drift")
    h_upper=Q(1,16);z_square_max=Q(1,4)
    min_s=Q(1,2);max_s=Q(2)
    T_min=Q(1,2);T_max=Q(3,2)
    # For 0<2h<1, s^(2h) <= max(1,s) <=2, and
    # s^(2h-1) <=2 for s in [1/2,2].
    left_F_upper=min_s-T_min
    right_F_lower=max_s-z_square_max*max_s-T_max
    derivative_lower=Q(1)-Q(2)*h_upper*z_square_max*Q(2)
    demand(left_F_upper<=0 and right_F_lower>=0 and derivative_lower==Q(15,16)
        and derivative_lower>Q(1,2),"endpoints/monotonicity exact rational proof")
    # If numerator R^2 is real and Lambda>0, root s>=1/2 gives
    # 0<= Lambda*R^2/(2*s)<=Lambda*R^2. The R bound is separately OPEN.
    output={
       "schema":"MathScope.M3.OriginalMonotone2PositiveSafeBox/1",
       "original_graph_sha256":SOURCE_GRAPH_SHA,
       "original_native_registry_sha256":SOURCE_NATIVE_SHA,
       "original_source_global_band_blob_SHA1":SOURCE_BAND_GIT_BLOB_SHA1,
       "original_source_root_node_id":622820,
       "original_source_native_system_id":2,
       "original_actual_slow_chart_arguments":[622803,622804],
       "exact_root_equation":"s - Z^2*s^(2h) - T = 0",
       "real_input_sufficient_box":{
          "h":"0<h<1/16","Z":"-1/2<=Z<=1/2",
          "T":"1/2<=T<=3/2"},
       "actual_left_F_upper":str(left_F_upper),
       "actual_right_F_lower":str(right_F_lower),
       "strict_lower_bound_on_full_interval_derivative":str(derivative_lower),
       "root_existence_and_uniqueness_on_stated_box":True,
       "root_enclosure_on_stated_box":["1/2","2"],
       "entire_original_common_denominator_2s_lower_bound_on_stated_box":"1",
       "entire_original_reciprocal_1_over_2s_upper_bound_on_stated_box":"1",
       "conditional_56_R_radius_sufficient":"real R, Lambda>0, Lambda*R^2<=41/10",
       "all_actual_native_slow_Z_T_h_box_memberships_verified":False,
       "all_actual_source_R_radius_support_memberships_verified":False,
       "original_56_actual_inverse_argument_global_Y_newly_certified":0,
       "source_114_original_natural_calls_newly_certified":0,
       "source_523_Y_certified":33,"source_523_Y_OPEN":490,
       "final_67_jet_intervals":0,"M3":"62/64","M4":"0/16","release":"HOLD"}
    return output

def adversarial_outside_box(Z,T):
    """Exact uncontroversial counterexample whenever Z=0: the root is s=T."""
    demand(Z==Q(0),"only exact Z=0 outside-box example is proved")
    return {"Z":str(Z),"T":str(T),"unique_root":str(T),
            "inside_original_bracket":Q(1,2)<=T<=Q(2)}

if __name__=="__main__":
    a=argparse.ArgumentParser()
    a.add_argument("--original-receipt",required=True)
    a.add_argument("--source-file")
    a.add_argument("--output")
    args=a.parse_args()
    receipt=source_bound_certificate(args.original_receipt,args.source_file)
    if args.output:Path(args.output).write_text(json.dumps(receipt,indent=2,ensure_ascii=False)+"\n")
    print(json.dumps(receipt,indent=2,ensure_ascii=False))
