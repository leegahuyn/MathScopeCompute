#!/usr/bin/env python3
"""Direct, fail-closed original-image condition on the ONLY TWO physically
root-reachable slow-chart monotone root(2,Z,T) expressions.

Actual original chart F(s)=s-Z²*s^(2h)-T, D=1/2-h, 0<h<2^-4096.
For W=Z²<=2 and T>=0, F is strictly increasing on [1/2,2].
Thus (Z,T) belongs the source image iff
  T+W*2^(-2h) >=1/2; T+W*2^(2h) <=2.
Then s in [1/2,2], eta=Z/s^D in [-1,1], 2s>=1.

Rational SUFFICIENT inequalities without approximating h:
  T + (1-2H) W >=1/2,  T + W/(1-2H) <=2, H=2^-4096,
by e^-u >=1-u and e^u <=1/(1-u), 0<=u=2h log(2)<2H.

For interval W in [Wlo,Whi],T in [Tlo,Thi], sufficient if
  Tlo + (1-2H)*Wlo>=1/2
  Thi + Whi/(1-2H)<=2.
This is a REAL PROOF conditional on source input intervals, NOT a
certificate that the unbounded source AST coordinate variables satisfy
them. Crucially source image is NONCONVEX: (Z,T)=(1,0),(-1,0)
are both actual image points, but their midpoint (0,0) is NOT.
"""
import argparse,gzip,hashlib,json
from pathlib import Path
from fractions import Fraction as F

GRAPH_SHA='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REG_SHA='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
H=F(1,2**4096)
SRC_PROFILE_GIT_SHA='84cbf606cab6510ab61f0446f0a6fdc7a89ec006'
SRC_BAND_GIT_SHA='1f1c18a26372c998d8389b6c5138b3c9d3a66f36'
EXPECTED={
0:('rational',['0','1']),19:('rational',['1','2']),
622803:('coordinate',['m3_global_band_slow_Z$30436']),
622804:('coordinate',['m3_global_band_slow_T$30437']),
622820:('actual_monotone_root',[2,622803,622804]),
623921:('smooth_piecewise',[623914,0,0,623920,623920,623918]),
623934:('multiply',[19,623933]),
623935:('actual_monotone_root',[2,623921,623934])
}
class ImageConditionNotProved(ValueError):pass

def require(ok,msg):
    if not ok:raise ImageConditionNotProved(msg)

def git_blob_sha(data):
    return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\x00'+data).hexdigest()

def certify_independent_W_T_box(wlo,whi,tlo,thi):
    """Direct rigorous rectangle, bound on W=Z² and T, NO implicit source guesses."""
    if any(type(v) is not F for v in (wlo,whi,tlo,thi)):
        raise ImageConditionNotProved('real bounds must be EXACT rational Fractions')
    if not (F(0)<=wlo<=whi<=F(2) and F(0)<=tlo<=thi):
        raise ImageConditionNotProved('source real W,T box invalid')
    lower=tlo+(1-2*H)*wlo
    upper=thi+whi/(1-2*H)
    if lower<F(1,2):
        raise ImageConditionNotProved('lower endpoint F(1/2)<=0 is OPEN')
    if upper>F(2):
        raise ImageConditionNotProved('upper endpoint F(2)>=0 is OPEN')
    return {
      'domain_certified_for_entire_exact_W_T_box':True,
      'W_source_bounds':[str(wlo),str(whi)],
      'T_source_bounds':[str(tlo),str(thi)],
      'original_chart_inverse_existence_and_uniqueness':True,
      'real_eta_in_minus1_plus1':True,
      'original_denominator_two_s_strict_positive_lower':'1',
      'uses_exact_2_pow_minus4096_h_bound':True
    }

def inspect_exact_two_calls(graph_dir,reached_receipt,profile_file,band_file):
    evidence=json.loads(Path(reached_receipt).read_text(encoding='utf8'))
    require(evidence.get('schema')=='MathScope.M3.Original11PhysicalRootsExactly2Monotone2SourceCalls/1'
      and evidence.get('original_source_graph_sha256')==GRAPH_SHA
      and evidence.get('original_source_native_registry_sha256')==REG_SHA
      and evidence.get('original_reachable_actual_natural_series_call_count')==523
      and evidence.get('source_actual_semantic_root_reachable_monotone2_calls')==2,
      'authenticated original 11-root extended native semantic reach receipt missing')
    actual=evidence['source_semantic_root_reachable_calls']
    require([(x['node_id'],x['Z_source_id'],x['T_source_id']) for x in actual]==
      [(622820,622803,622804),(623935,623921,623934)],
      'actual two reached source calls changed')
    profile_data=Path(profile_file).read_bytes()
    band_data=Path(band_file).read_bytes()
    require(git_blob_sha(profile_data)==SRC_PROFILE_GIT_SHA
         and git_blob_sha(band_data)==SRC_BAND_GIT_SHA,
         'actual accepted N3 exponent or original slow band Git blob SHA changed')
    profile=profile_data.decode()
    band=band_data.decode()
    require("'2^-4096'" in profile and "D:'1/2-h'" in profile
         and "Z=s^D*eta,T=s*(1-eta^2)" in band
         and "name:'ActualCommonBandSlowInverse'" in band,
         'source parameter N3 h,D or slow-chart equation provenance missing')
    needed=set(EXPECTED)|{623914,623920,623918,623933}
    found={};h=hashlib.sha256();count=0
    with gzip.open(Path(graph_dir)/'original-source-nodes.jsonl.gz','rb') as f:
        for j,line in enumerate(f):
            h.update(line)
            if j==0:
                require(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},
                        'wrong 4,420,257 source header')
                continue
            id=j-1;count+=1
            if id in needed:found[id]=json.loads(line)
    require(count==4420257 and h.hexdigest()==GRAPH_SHA,
            'original source stream SHA or count changed')
    for node,(op,args) in EXPECTED.items():
        require(found[node]=={'op':op,'args':args},'actual source branch equation changed: '+str(node))
    for node in (623920,623918,623933):
        require(found[node]['op'] in ('multiply','add'),
                'actual branch or T source expression changed '+str(node))
    # Nonconvex witness valid for ANY h>0:
    # for s=1, eta=+-1 -> Z=+-1,T=0; midpoint (0,0) solves F(s)=s,
    # no root in required [1/2,2].
    require(certify_independent_W_T_box(F(1),F(1),F(0),F(0))
        ['domain_certified_for_entire_exact_W_T_box'],
        'exact source image endpoints eta=+-1 are invalid')
    rejected=False
    try:certify_independent_W_T_box(F(0),F(0),F(0),F(0))
    except ImageConditionNotProved:rejected=True
    require(rejected,'nonconvex midpoint outside original image was falsely certified')
    return {
      'schema':'MathScope.M3.Original2Root2SourceImageEndpointObligations/1',
      'graph_sha256':GRAPH_SHA,'registry_sha256':REG_SHA,
      'physical_original_root_count':11,
      'original_662_syntactic_calls_semantically_relevant':2,
      'original_direct_chart_call':{'node_id':622820,'Z_node_id':622803,'T_node_id':622804,
          'required_exact_predicates':['T>=0','Z²<=2',
           'T+Z²*2^(-2h)>=1/2','T+Z²*2^(2h)<=2'],
          'source_actual_chart_image_evaluated':False},
      'original_transformed_chart_call':{
          'node_id':623935,'Z_node_id':623921,'T_node_id':623934,
          'actual_Z_branch_condition_source_node_id':623914,
          'actual_Z_piecewise_zero_left_right_nodes':[0,0],
          'actual_Z_before_and_inside_source_node':623920,
          'actual_Z_after_source_node':623918,
          'actual_T_half_sum_source_node':623933,
          'original_Z_realization_source_branch_AST':found[623921],
          'source_before_branch_W_and_T_endpoint_constraints_proved':False,
          'source_after_branch_W_and_T_endpoint_constraints_proved':False,
          'source_actual_branch_selector_sign_proved':False},
      'necessary_and_sufficient_source_image_criterion_under_Z2_le_2_T_ge_0':
          'T+Z²*2^(-2h)>=1/2 AND T+Z²*2^(2h)<=2',
      'safe_rational_sufficient_criterion_H_2pow_minus4096':
          'T+(1-2H)*Z²>=1/2 AND T+Z²/(1-2H)<=2 with 0<=Z²<=2,T>=0',
      'exact_original_image_not_convex_counterexample':{
          'source_image_endpoints':[[1,0],[-1,0]],'midpoint':[0,0],
          'endpoints_both_on_image':True,'midpoint_outside_image':True,
          'source_midpoint_claim_not_safe_without_real_branch_and_margin':True},
      'all_actual_two_root_calls_image_domains_proved':False,
      'all_114_natural_series_global_call_paths_newly_certified':0,
      'original_523_natural_Y_bounds_certified':33,'original_523_natural_Y_OPEN':490,
      'actual_final_physical_67_jet_intervals':0,
      'M3':'62/64','M4':'0/16','release':'HOLD'
    }

if __name__=='__main__':
    a=argparse.ArgumentParser()
    a.add_argument('--graph-dir',required=True)
    a.add_argument('--reach-receipt',required=True)
    a.add_argument('--source-profile',required=True)
    a.add_argument('--source-global-band',required=True)
    a.add_argument('--output')
    x=a.parse_args()
    r=inspect_exact_two_calls(x.graph_dir,x.reach_receipt,x.source_profile,x.source_global_band)
    if x.output:Path(x.output).write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(r,indent=2,ensure_ascii=False))
