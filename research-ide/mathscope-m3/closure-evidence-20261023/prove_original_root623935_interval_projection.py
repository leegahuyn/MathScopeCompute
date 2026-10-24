#!/usr/bin/env python3
"""Direct source-level original slow-chart image projection for actual root #623935.

The exact AST implements a NONCONVEX signed-domain projection, NOT arbitrary
averaging of two image coordinates. Let a=s_lower,b=s_upper, m=T_lower,
M=T_upper with 1/2<=a<=b<=2, 0<=m<=M, 0<h<2^-4096.
Set
  L=sqrt(max(0,(a-M)/a^(2h))),
  U=sqrt(max(0,(b-m)/b^(2h))).
If 0<=L<=U, U²<=2 and mesh z interval [zlo,zhi] has a
strictly nonempty intersection with EITHER [-U,-L] or [L,U],
select the SIGNED interval with positive width:
  negative width w-=min(zhi,-L)-max(zlo,-U);
  positive width w+=min(zhi,U)-max(zlo,L).
Source Z value #623921 selects negative when w->0; positive when w-<0.
WARNING at w-=0: source smooth_piecewise has coincident endpoints
and its source-branch joining convention is not certified; leave OPEN.

For the selected Zmid, |Zmid| in [L,U]. Then
 lower=max(m,a-a^(2h)*Zmid²)
 upper=min(M,b-b^(2h)*Zmid²).
By monotonicity of s ->s-Zmid²*s^(2h) on [1/2,2],
lower<=upper. Source T value #623934 equals (lower+upper)/2.
Thus Tmid>=0 and the exact F(a;Zmid,Tmid)<=0,
F(b;Zmid,Tmid)>=0; the native root exists uniquely in
[a,b] subset [1/2,2], with 2s>=1. This is the mathematical
argument on the STRICT case; actual original bounds and branch
feasibility on every 11-root evaluated path remain unproved.
"""
import argparse,gzip,hashlib,json
from pathlib import Path
from fractions import Fraction as Q

GRAPH='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
PIN={
0:('rational',['0','1']),19:('rational',['1','2']),20:('rational',['-1','1']),
623875:('maximum',[19,623874]),623883:('maximum',[623875,623882]),
623884:('maximum',[0,623869]),623885:('multiply',[20,623870]),
623887:('log_positive',[623875]),623888:('multiply',[25,623887]),
623889:('exp',[623888]),623890:('inverse',[623889]),
623886:('add',[623875,623885]),623891:('multiply',[623886,623890]),
623899:('maximum',[0,623891]),623900:('sqrt_positive',[623899]),
623894:('log_positive',[623883]),623895:('multiply',[25,623894]),
623896:('exp',[623895]),623897:('inverse',[623896]),
623892:('multiply',[20,623884]),623893:('add',[623883,623892]),
623898:('multiply',[623893,623897]),623901:('maximum',[0,623898]),
623902:('sqrt_positive',[623901]),
623903:('multiply',[20,623902]),623904:('maximum',[623867,623903]),
623905:('multiply',[20,623900]),623906:('multiply',[20,623868]),
623907:('multiply',[20,623905]),623908:('maximum',[623906,623907]),
623909:('multiply',[20,623908]),623910:('maximum',[623867,623900]),
623911:('maximum',[623906,623903]),623912:('multiply',[20,623911]),
623913:('multiply',[20,623904]),623914:('add',[623909,623913]),
623915:('multiply',[20,623910]),623916:('add',[623912,623915]),
623917:('add',[623904,623909]),623918:('multiply',[19,623917]),
623919:('add',[623910,623912]),623920:('multiply',[19,623919]),
623921:('smooth_piecewise',[623914,0,0,623920,623920,623918]),
623922:('integer_power',[623921,2]),
623923:('multiply',[623889,623922]),
623924:('multiply',[20,623923]),623925:('add',[623875,623924]),
623926:('maximum',[623884,623925]),
623927:('multiply',[623896,623922]),623928:('multiply',[20,623927]),
623929:('add',[623883,623928]),623930:('multiply',[20,623929]),
623931:('maximum',[623885,623930]),623932:('multiply',[20,623931]),
623933:('add',[623926,623932]),623934:('multiply',[19,623933]),
623935:('actual_monotone_root',[2,623921,623934]),
25:('multiply',[9,24])
}

class ProjectedImageConditionOPEN(ValueError): pass

def require(ok,msg):
    if not ok: raise ProjectedImageConditionOPEN(msg)

def exact_signed_interval_midpoint(L,U,zlo,zhi):
    """Rational strict-branch selection theorem, no transcendental approximation."""
    if any(type(z) is not Q for z in (L,U,zlo,zhi)):
        raise ProjectedImageConditionOPEN('exact rational witness expected')
    require(Q(0)<=L<=U and zlo<=zhi,'source annular/mesh Z intervals inconsistent')
    neglo=max(zlo,-U);neghi=min(zhi,-L)
    poslo=max(zlo,L);poshi=min(zhi,U)
    wnegative=neghi-neglo;wpositive=poshi-poslo
    if wnegative>0: return {
        'branch':'negative','Z_midpoint':str((neglo+neghi)/2),
        'strict_w_negative':True,'certifies_L_le_absZ_le_U':True}
    if wnegative<0 and wpositive>=0:return {
        'branch':'positive','Z_midpoint':str((poslo+poshi)/2),
        'strict_w_negative':False,'certifies_L_le_absZ_le_U':True}
    raise ProjectedImageConditionOPEN('negative width equals zero (join) or no admissible positive interval')

def original_exact_projection(graph_dir,reached_receipt):
    proof=json.loads(Path(reached_receipt).read_text(encoding='utf8'))
    require(proof.get('schema')=='MathScope.M3.Original11PhysicalRootsExactly2Monotone2SourceCalls/1'
            and proof.get('original_source_graph_sha256')==GRAPH
            and [x['node_id'] for x in proof['source_semantic_root_reachable_calls']]==[622820,623935],
            '11-physical-root native semantic inputs incorrect')
    want=set(PIN);seen={};h=hashlib.sha256();count=0
    with gzip.open(Path(graph_dir)/'original-source-nodes.jsonl.gz','rb') as f:
        for j,line in enumerate(f):
            h.update(line)
            if j==0:
                require(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},'source header')
                continue
            node=j-1;count+=1
            if node in want:seen[node]=json.loads(line)
    require(count==4420257 and h.hexdigest()==GRAPH,'original graph SHA')
    for node,(op,args) in PIN.items():
        require(seen.get(node)=={'op':op,'args':args},'source projection identity changed node '+str(node))
    return {
       'schema':'MathScope.M3.OriginalPhysicalRoot623935NonconvexSignedProjection/1',
       'original_source_SHA256':GRAPH,
       'root_to_native_reachable_623935':True,
       'source_Z_lower_cut_node':623900,
       'source_Z_upper_cut_node':623902,
       'source_negative_candidate_Z_midpoint_node':623918,
       'source_positive_candidate_Z_midpoint_node':623920,
       'source_negative_intersection_width_node':623914,
       'source_positive_intersection_width_node':623916,
       'source_piecewise_Z_node':623921,
       'source_T_lower_mid_interval_node':623926,
       'source_T_upper_mid_interval_node':623932,
       'source_T_half_sum_node':623934,
       'source_monotone_system2_call_node':623935,
       'strict_negative_or_strict_positive_intersection_proves_chart_image_conditionally':True,
       'sufficient_source_s_interval':'1/2 <= a <= b <= 2',
       'sufficient_source_T_interval':'0 <= m <= M',
       'sufficient_source_signed_Z_intersection':'w_minus>0 OR (w_minus<0 AND w_plus>=0)',
       'sufficient_source_square_bound':'U^2<=2',
       'sufficient_source_h_interval':'0<h<2^-4096',
       'source_piecewise_equality_at_zero_derivative_join_certified':False,
       'all_original_11_root_actual_mesh_intersections_certified':False,
       'all_actual_slow_image_guard_domains_globally_certified':False,
       'new_original_114_Y_bounds_certified':0,
       'original_523_Y_certified':33,'original_523_Y_OPEN':490,
       'final_67_jet_intervals':0,
       'M3':'62/64','M4':'0/16','release':'HOLD'
    }
if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--graph-dir',required=True)
    p.add_argument('--reach-receipt',required=True)
    p.add_argument('--output')
    a=p.parse_args();r=original_exact_projection(a.graph_dir,a.reach_receipt)
    if a.output:Path(a.output).write_text(json.dumps(r,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(r,indent=2,ensure_ascii=False))
