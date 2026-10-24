#!/usr/bin/env python3
"""Fail-closed original branch-routing theorem for first-order natural-series calls.

Proves local conditions on *selected source branches* and Picard arguments.
Does NOT associate any of the 114 globally reachable natural-series calls to
a branch, nor prove their global chart support, analytic coefficients or final jets.
"""
import hashlib,json,sys
from fractions import Fraction as F
from pathlib import Path
from audit_original_local_B2_radius_41 import original_local_B2_radius_41, original_blob_sha

ROOT=Path(__file__).resolve().parents[2]/'mathscope-m2'/'navier'
PIN={
 'actual-continuation-exact-inner.mjs':'c49e1d871cb9e2a226964797b13a32e43b89366c',
 'actual-continuation-exact-order-one.mjs':'a94a7079f6884795b79145a143ca2ba7ab15a1eb',
 'actual-global-source-expressions.mjs':'854bb862276d03c236b2df73ba1bb9a61373c4df',
 'actual-continuation-exact-functions.mjs':'1684bc230b42b766821c633ee3fb961198aa616c',
}
# Exact eight Y identifiers and call counts from the SHA-pinned 56->43
# receipt; this script independently validates source branches, not the
# 4.4-million-node original closure or consumer attachment.
X_SOURCE_PAIRS=((4757,27),(32495,23),(6945,21),(33412,17),
                (25063,8),(50907,6),(54061,6),(56747,6))
class ChangedFirstOrderSource(ValueError):pass

def source(name, overrides):
    path=Path(overrides.get(name,ROOT/name))
    data=path.read_bytes()
    if original_blob_sha(data)!=PIN[name]:
        raise ChangedFirstOrderSource('Original source SHA-1 changed: '+name)
    return data.decode('utf8'),hashlib.sha256(data).hexdigest()

def need(text, clauses, name):
    for clause in clauses:
        if clause not in text:
            raise ChangedFirstOrderSource('Source branch contract changed: '+name)

def audit_first_order_routes(overrides=None):
    overrides={} if overrides is None else overrides
    src={name:source(name,overrides) for name in PIN}
    inner=src['actual-continuation-exact-inner.mjs'][0]
    order=src['actual-continuation-exact-order-one.mjs'][0]
    ast=src['actual-global-source-expressions.mjs'][0]
    even=src['actual-continuation-exact-functions.mjs'][0]
    need(ast,[
      "choose(x,left,right,before,inside,after){return this.node('smooth_piecewise',[x,left,right,before,inside,after]);}",
      "v=ev(x<=a?args[3]:x>=b?args[5]:args[4],env);",
    ],'exact smooth_piecewise branch semantics')
    need(ast,[
      "// The compiler uses this only at source joins with matching derivatives.",
      "out=this.choose(args[0],args[1],args[2],d(3),d(4),d(5));",
    ],'piecewise derivative requires matching interface jets')
    need(inner,[
      "aSquared=G.mul(Xa,G.exp(G.div(t1,q(16))))",
      "F0=G.choose(X,Xa,aSquared,naturalF,collarF,collarF)",
      "U0=G.choose(X,Xa,aSquared,naturalU,collarU,collarU)",
      "v0=G.choose(X,Xa,aSquared,coreVoverX,collarVoverX,collarVoverX)",
      "radialDomain:[z,a]",
      "const F1at=Xvalue=>G.picardEven(system,0,Xvalue,eta),U1at=Xvalue=>G.picardEven(system,1,Xvalue,eta);",
    ],'same-source inner Picard')
    need(even,[
      "picardEven(system,component,X,eta=this.core.eta,radialOrder=0,etaOrder=0)",
      "return this.node('actual_background_even_profile',[system,component,X,eta,radialOrder,etaOrder]);",
      "if(radialOrder===0)return this.picardRoot(system,component,this.sqrt(X),eta,etaOrder);",
    ],'even-profile to sqrt(X) mapping')
    need(order,[
      "Xkeep=G.mul(Xa,G.exp(G.div(t1,q(64))))",
      "Xcut=G.mul(Xa,G.exp(G.div(t1,q(32))))",
      "const Fraw=inner.F1at(X),Uraw=inner.U1at(X);",
      "const Ft=G.choose(X,Xkeep,Xcut,Fraw,G.mul(kappa,Fraw),z),Ut=G.choose(X,Xkeep,Xcut,Uraw,G.mul(kappa,Uraw),z);",
      "const localMoments=localBodies.map((body,j)=>integrate(body,z,Xcut,'actual_n1_local_m'+j));",
      "const t=G.fresh('actual_n1_axis_average'),axisAverage=G.integral(G.substitute(inner.U1at(G.mul(t,X)),eta,eta),t,z,o);",
      "const M1=G.choose(X,Xkeep,lastU,G.mul(X,axisAverage),unclosedM,z),M1overX=G.choose(X,Xkeep,lastU,axisAverage,G.div(M1,X),z);",
    ],'source outer consumers, first order')
    previous=original_local_B2_radius_41(
        Path(overrides.get('actual-continuation-exact-inner.mjs',ROOT/'actual-continuation-exact-inner.mjs')),
        Path(overrides.get('actual-continuation-exact-order-one.mjs',ROOT/'actual-continuation-exact-order-one.mjs')))
    keep=F(previous['conditional_Lambda_Xkeep_strict_upper'])
    cut=F(previous['conditional_Lambda_Xcut_strict_upper'])
    a2=F(previous['conditional_Lambda_a_squared_strict_upper'])
    if not F(4)<keep<cut<a2<F(41,10)<F(5):
        raise ChangedFirstOrderSource('Pinned exact branch inequality failed')
    if len(X_SOURCE_PAIRS)!=8 or sum(c for _,c in X_SOURCE_PAIRS)!=114 or len(set(x for x,_ in X_SOURCE_PAIRS))!=8:
        raise ChangedFirstOrderSource('Original 114-caller ledger drifted')
    return {
      'schema':'MathScope.M3.FirstOrderSourceBranchRoutesToB2/1',
      'original_first_FiveMap_only':True,
      'source_SHA256':{name:src[name][1] for name in PIN},
      'source_graph_SHA256':previous['original_node_SHA256'],
      'source_native_SHA256':previous['original_native_registry_SHA256'],
      'original_X_source_pair_ids_and_counts':[{'Y_id':n,'calls':c} for n,c in X_SOURCE_PAIRS],
      'original_X_pair_count':8,'original_X_call_count':114,
      'smooth_piecewise_selected_arm_semantics_source_checked':True,
      'required_hypothesis_X_nonnegative':True,
      'piecewise_join_derivative_formula_source_assumes_matching_jets':True,
      'actual_join_matching_jets_certified_here':False,
      'local_selected_Ft_Ut_X_le_Xcut_implies_picard_argument_within_radial_domain':True,
      'local_moment_t_in_0_Xcut_implies_picard_argument_within_radial_domain':True,
      'axis_average_t_in_0_1_and_X_in_0_Xkeep_implies_tX_in_0_Xkeep':True,
      'M1_and_M1overX_route_axis_average_only_on_X_le_Xkeep_selected_arms':True,
      'axis_average_selected_arm_sqrt_tX_in_0_a_for_original_Picard':True,
      'local_Y_Lambda_Xkeep_strict_upper':str(keep),
      'local_Y_Lambda_Xcut_strict_upper':str(cut),
      'local_Y_Lambda_a_squared_strict_upper':str(a2),
      'local_selected_branches_fit_paper_B2_Y_0_to_4point1':True,
      'WARNING_selected_branch_routing_not_global_114_consumer_path_certificate':True,
      'global_114_X_calls_root_to_branch_mappings_proved':0,
      'global_114_X_calls_Y_upper_certified':0,
      'other_33_xi_calls_upper_certified_here':0,
      'Omega_70_upper_certified_here':0,
      'common_complex_eta_and_Brho_norm_certified':False,
      'all_A_D_final_field_roots_materialized':False,
      'final_67_field_jet_intervals_certified':0,
      'M3':'62/64','M4':'0/16','release':'HOLD',
    }

if __name__=='__main__':
    data=audit_first_order_routes()
    if len(sys.argv)>1:
        Path(sys.argv[1]).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    print(json.dumps(data,indent=2,ensure_ascii=False))
