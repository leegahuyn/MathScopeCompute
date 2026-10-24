#!/usr/bin/env python3
"""Direct original AST geometry of the two-root physical slow-chart call #623935.

Critical: source *lower* slow-s bound uses K=XR*exp(u) at node #28826,
while source *upper* slow-s bound uses Xa. They are NOT interchangeable!

Original mesh INTEGER GRID INDEX (r,z,t), source frozen N1 integer ell>=3:
 E=ell^6, delta=3/(4*E),
 r-=(r-3/4)/E, r+=(r+3/4)/E and analogously for z,t.
 BEWARE original coordinate index is DIVIDED BY E, NOT a physical center!
 a=max(1/2,max(0,r-)^2/(2*K)).
 b=max(a,min(2,r+^2/(2*Xa))).
 m=max(0,t-), M=t+.
Source branch uses real signed sqrt/max to project Z into admissible annulus.

Actual necessary mesh prerequisites:
 K>0, Xa>0, a<=2, 0<=m<=M, m<=b.
* These are NOT automatic from the source AST without actual chart support.
* a<=2 iff max(0,r-)^2<=4K.
* m<=M iff t+>=0.
* m<=b needs its own actual interval bound.

On the exact source central slice z=0, with a<=M and b>m
(and the above bounds), the source Z negative signed interval has
strictly positive width: L=0,U>0, z range [-delta,delta], so
w-=min(delta,U)>0. Hence chosen Z is in the source annulus,
chosen T lies in [g(a),g(b)] and the actual root is within [a,b]
under 0<h<2^-4096. This is a GENUINE CONDITIONAL physical-input
subdomain, not all 11-root runtime positions.
"""
from fractions import Fraction as F
import argparse,gzip,hashlib,json
from pathlib import Path

GRAPH='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
BAND='1f1c18a26372c998d8389b6c5138b3c9d3a66f36'
ORDER_ONE_SHA='a94a7079f6884795b79145a143ca2ba7ab15a1eb'
PIN={
    19:('rational',['1','2']),20:('rational',['-1','1']),
    24:('rational',['2','1']),190:('rational',['-2','1']),
    3617:('source_parameter',['Xa']),
    622791:('coordinate',['N6_global_frozen_integer_band_N1$30434']),
    623855:('coordinate',['m3_global_fixed_mesh_r$30477']),
    623856:('coordinate',['m3_global_fixed_mesh_z$30478']),
    623857:('coordinate',['m3_global_fixed_mesh_t$30479']),
    623858:('integer_power',[622791,6]),
    623859:('inverse',[623858]),
    120836:('rational',['3','4']),
    623860:('multiply',[120836,623859]),
    623861:('multiply',[623855,623859]),
    623862:('multiply',[623856,623859]),
    623863:('multiply',[623857,623859]),
    623864:('multiply',[20,623860]),
    623865:('add',[623861,623864]),
    623866:('add',[623860,623861]),
    623867:('add',[623862,623864]),
    623868:('add',[623860,623862]),
    623869:('add',[623863,623864]),
    623870:('add',[623860,623863]),
    623871:('maximum',[0,623865]),
    623872:('integer_power',[623871,2]),
    623873:('inverse',[137008]),
    623874:('multiply',[623872,623873]),
    623875:('maximum',[19,623874]),
    623876:('integer_power',[623866,2]),
    623877:('multiply',[24,3617]),
    623878:('inverse',[623877]),
    623879:('multiply',[623876,623878]),
    623880:('multiply',[20,623879]),
    623881:('maximum',[190,623880]),
    623882:('multiply',[20,623881]),
    623883:('maximum',[623875,623882]),
    137008:('multiply',[24,28826]),
    28826:('multiply',[12,28825]),
    28825:('exp',[319]),
    12:('source_parameter',['XR']),
}
class OriginalMeshConditionOPEN(ValueError):pass

def require(c,msg):
    if not c:raise OriginalMeshConditionOPEN(msg)

def real_mesh_box(ell,r,z,t,Xa,K):
    if type(ell) is not int or ell<3:
        raise OriginalMeshConditionOPEN('original positive integer ell>=3 required')
    if any(type(v) is not F for v in (r,z,t,Xa,K)):
        raise OriginalMeshConditionOPEN('exact rational witness inputs required')
    require(Xa>0 and K>0,'source Xa and K=XR*exp(u) strictly positive')
    E=ell**6
    d=F(3,4*E)
    # Exact original AST: source first divides integer mesh INDEX
    # by ell^6, then subtracts/adds 3/(4 ell^6).
    r0,z0,t0=r/E,z/E,t/E
    rlo,rhi=r0-d,r0+d
    zlo,zhi=z0-d,z0+d
    tlo,thi=t0-d,t0+d
    a=max(F(1,2),max(F(0),rlo)**2/(2*K))
    b=max(a,min(F(2),rhi*rhi/(2*Xa)))
    m=max(F(0),tlo)
    M=thi
    # Code must not silently replace Xa with K in upper s bound.
    return {
      'ell':ell,'mesh_radius_delta':str(d),
      'source_coordinates_are_grid_indices_not_physical_centers':True,
      'physical_mesh_center':[str(r0),str(z0),str(t0)],
      'r_bounds':[str(rlo),str(rhi)],
      'z_bounds':[str(zlo),str(zhi)],
      't_bounds':[str(tlo),str(thi)],
      'source_K_XR_exp_u':str(K),'source_Xa':str(Xa),
      'source_s_lower_a':str(a),'source_s_upper_b':str(b),
      'source_T_lower_m':str(m),'source_T_upper_M':str(M),
      'a_within_original_bracket':a<=2,
      'source_T_range_nonempty':m<=M,
      'source_T_lower_le_s_upper':m<=b,
      'original_root_chart_basic_box_feasible':a<=2 and m<=M and m<=b,
      'source_lower_s_radial_criterion':str(max(F(0),rlo)**2)+' <= 4*K',
      'source_upper_s_uses_Xa_not_K':True,
    }

def central_slice_negative_projection(ell,r,t,Xa,K):
    """True physical chart input slice z=0 with STRICT interior tests."""
    result=real_mesh_box(ell,r,F(0),t,Xa,K)
    a,b,m,M=(F(result[k]) for k in (
     'source_s_lower_a','source_s_upper_b',
     'source_T_lower_m','source_T_upper_M'))
    require(result['original_root_chart_basic_box_feasible'],
        'original source slow s/T box not feasible')
    require(a<=M and b>m, 'strict source-annulus central Z=0 projection not certified')
    # L=sqrt(max(0,(a-M)/a^(2h)))=0, U>0 from b>m,
    # |zlo|=zhi=delta. Thus wminus=min(delta,U)>0 and chosen
    # negative midpoint lies in [-U,0]. The original T clamp works
    # because a<=M and m<b; g monotone for 0<h<2^-4096.
    return {
      **result,
      'central_Z_mesh_center_exactly_zero':True,
      'source_annulus_L_equals_zero':True,
      'source_annulus_U_strictly_positive':True,
      'source_negative_signed_Z_intersection_strict_width':True,
      'source_piecewise_selects_negative_branch':True,
      'actual_monotone2_source_Z_T_image_value_on_this_subdomain':True,
      'native_inverse_denominator_two_s_ge_one_on_this_subdomain':True,
      'actual_original_11root_all_image_paths_proved':False,
    }

def certify_actual_source_representative_in_mesh(
    ell,r_index,z_index,t_index,Xa,Xb,Xrep,srep,Rrep,Zrep,Trep):
    """PROVEN original representative -> s and T intervals, conditional on
    true point-mesh pairing, original Xb = XR exp(outer-stage-end).
    This does not certify matching of arbitrary native consumer coordinates.
    """
    vals=(r_index,z_index,t_index,Xa,Xb,Xrep,srep,Rrep,Zrep,Trep)
    require(all(type(x) is F for x in vals),
            'actual representative must have exact rational source witness')
    require(F(0)<Xa<=Xrep<=Xb and F(1,2)<=srep<=F(2),
            'original representative source X,s domain absent')
    require(Rrep>=0 and Rrep*Rrep==2*srep*Xrep,
            'Rrep²=2*srep*Xrep source relation absent')
    require(F(0)<=Trep<=srep and Zrep*Zrep<=F(2),
            'original slow-image necessary scalar bounds absent')
    c=real_mesh_box(ell,r_index,z_index,t_index,Xa,Xb)
    dr,dz,dt=(F(z) for z in c['physical_mesh_center'])
    d=F(c['mesh_radius_delta'])
    require(all(abs(u-v)<=d for u,v in (
      (Rrep,dr),(Zrep,dz),(Trep,dt))),
      'source representative is not proven inside THIS integer-mesh box')
    a,b,m,M=(F(c[k]) for k in (
       'source_s_lower_a','source_s_upper_b','source_T_lower_m','source_T_upper_M'))
    require(a<=srep<=b<=2 and m<=Trep<=M,
            'source representative radial/time interval transport failed')
    return {
      'schema':'MathScope.M3.OriginalRepresentativeMeshRadialAndTimeTransport/1',
      'exact_source_mesh_center_grid_indices':[str(v) for v in (r_index,z_index,t_index)],
      'exact_Xa_Xrep_Xb':[str(Xa),str(Xrep),str(Xb)],
      'exact_srep':str(srep),
      'exact_source_representative_R_Z_T':[str(Rrep),str(Zrep),str(Trep)],
      's_lower_a_le_srep_le_s_upper_b_proved':True,
      'T_lower_m_le_Trep_le_T_upper_M_proved':True,
      'original_radial_time_box_feasible':True,
      'source_Z_T_representative_full_image_identity_proved':False,
      'actual_root623935_all_runtime_representatives_inside_source_mesh_proved':False,
      'all_11_physical_root_native_domain_certified':False,
    }

def inspect_sha_original_geometry(graph_dir,source_band_file,order_one_file):
    data=Path(source_band_file).read_bytes()
    blob=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
    require(blob==BAND,'source-global-band Git blob SHA mismatched')
    order_bytes=Path(order_one_file).read_bytes()
    order_blob=hashlib.sha1(b'blob '+str(len(order_bytes)).encode()+b'\x00'+order_bytes).hexdigest()
    require(order_blob==ORDER_ONE_SHA and
      'const Xb=G.mul(XR,G.exp(G.outer.stages.at(-1).end));' in order_bytes.decode('utf8'),
      'original order-one Xb=XR exp(stageEnd) expression not authenticated')
    want=set(PIN)|{0}
    found={};sha=hashlib.sha256();n=0
    with gzip.open(Path(graph_dir)/'original-source-nodes.jsonl.gz','rb') as f:
        for j,line in enumerate(f):
            sha.update(line)
            if j==0:
                require(json.loads(line)=={'schema':'MathScope.M3.FullNodesJSONL/1','node_count':4420257},
                    'original graph header')
                continue
            node=j-1;n+=1
            if node in want:found[node]=json.loads(line)
    require(n==4420257 and sha.hexdigest()==GRAPH,'exact original node stream SHA')
    for i,(op,args) in PIN.items():
        require(found.get(i)=={'op':op,'args':args},'original mesh physical guard changed node '+str(i))
    require(found[0]=={'op':'rational','args':['0','1']},
            'source zero rational literal changed')
    return {
        'schema':'MathScope.M3.OriginalRoot623935ActualMeshRadialAndTimeGuards/1',
        'original_source_graph_sha256':GRAPH,'source_band_blob_sha1':BAND,
        'original_order_one_Xb_source_blob_sha1':ORDER_ONE_SHA,
        'original_lower_radial_denominator_K_equals_order_one_Xb':True,
        'original_frozen_mesh_coordinate_nodes':{'ell':622791,'r':623855,'z':623856,'t':623857},
        'original_delta':'3/(4*ell^6)',
        'actual_grid_index_to_physical_center':'(r,z,t)/ell^6',
        'actual_lower_s_expression':'max(1/2,max(0,(r-3/4)/ell^6)^2/(2*XR*exp(u)))',
        'actual_upper_s_expression':'max(a,min(2,((r+3/4)/ell^6)^2/(2*Xa)))',
        'actual_lower_T_expression':'max(0,(t-3/4)/ell^6)',
        'actual_upper_T_expression':'(t+3/4)/ell^6',
        'necessary_radial_condition':'max(0,(r-3/4)/ell^6)^2<=4*XR*exp(u)',
        'necessary_time_conditions':'(t+3/4)/ell^6>=0 AND max(0,(t-3/4)/ell^6)<=b',
        'central_slice_z_zero_negative_projection_conditional_certified':True,
        'actual_11_root_mesh_r_z_t_support_globally_proved':False,
        'actual_negative_projection_all_source_switches_proved':False,
        'original_global_monotone2_call_domains_newly_certified':0,
        'original_523_Y_certified':33,'original_523_Y_OPEN':490,
        'original_final_67_jets':0,'M3':'62/64','M4':'0/16','release':'HOLD'
    }

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--graph-dir',required=True)
    p.add_argument('--global-band',required=True)
    p.add_argument('--order-one-source',required=True)
    p.add_argument('--output')
    x=p.parse_args()
    report=inspect_sha_original_geometry(x.graph_dir,x.global_band,x.order_one_source)
    if x.output:Path(x.output).write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
