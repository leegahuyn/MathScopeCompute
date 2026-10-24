#!/usr/bin/env python3
"""Exact source-native #623935 integer-mesh counterexample without pairing guard.

This is a genuine ORIGINAL INTEGER MESH configuration for the SOURCE expression with Xa<Xb,
but is NOT claimed to match the pinned N3 numeric parameter values or actual 11-root physical evaluation support.
Proof holds uniformly for every 0<h<2^-4096 without choosing a numeric h.

ell=3, r=0, z=1000, t=0, Xa=1, Xb=2 yields a=b=1/2,
m=0, M=1/972, zlo=3997/2916>4/3.
A=(1/2)^(2h) lies in (1/2,1), hence U=sqrt((b-m)/A)
lies in (sqrt(1/2),1), with U>2/3.
Both signed Z intersections are empty. Source chooses the positive
candidate (zlo+U)/2>1 despite its negative interval width. At s=a=b,
g(s)=s-Zmid^2*s^(2h)<0, source T_lower=0 and T_upper=g(s)<0,
giving source T midpoint <0, outside real slow-chart image.
Thus source mesh-geometry alone, without representative/mesh binding,
cannot certify root #623935 globally.
"""
import argparse,json
from fractions import Fraction as F
from prove_original_root623935_mesh_prerequisites import real_mesh_box
from prove_original_root623935_general_srep_image import graph_pin,GRAPH_SHA

def exact_original_integer_mesh_counterexample():
    ell=3;r=F(0);z=F(1000);t=F(0);Xa=F(1);Xb=F(2)
    q=real_mesh_box(ell,r,z,t,Xa,Xb)
    a=F(q['source_s_lower_a']);b=F(q['source_s_upper_b'])
    m=F(q['source_T_lower_m']);M=F(q['source_T_upper_M'])
    zlo=F(q['z_bounds'][0]);zhi=F(q['z_bounds'][1])
    assert a==b==F(1,2) and m==0 and M==F(1,972)
    assert zlo==F(3997,2916)>F(4,3) and zhi>zlo
    # Since 0<2h<1, A=2^(-2h) in (1/2,1).
    # Source L^2=(a-M)/A, U^2=(b-m)/A, hence:
    # 0<L<U<1 and U>sqrt(1/2)>2/3.
    assert 0<a-M<b-m==F(1,2)
    assert F(1,2)>F(4,9)
    # U<1<zlo implies both negative and positive interval
    # intersections empty, and the source's w_minus<0 selects
    # the positive candidate even when w_plus<0.
    # Zmid>(zlo+2/3)/2 > 1.
    midpoint_lower=(zlo+F(2,3))/2
    assert midpoint_lower>1
    # g(a)=a-Zmid²*A < 1/2-1*(1/2)=0.
    # Therefore original T lower=max(0,g(a))=0 and
    # upper=min(M,g(b))=g(b)<0; selected T midpoint <0.
    return {
      'schema':'MathScope.M3.OriginalRoot623935ExactIntegerMeshNoImageWitness/1',
      'original_AST_sha256_required':GRAPH_SHA,
      'original_integer_mesh_ell_r_z_t':[ell,0,1000,0],
      'source_Xa_and_Xb':['1','2'],
      'source_s_interval':[str(a),str(b)],
      'source_T_interval':[str(m),str(M)],
      'source_z_cell':[str(zlo),str(zhi)],
      'all_source_h_0_lt_h_lt_2_neg4096':True,
      'source_U_strict_interval':['2/3','1'],
      'negative_signed_intersection_width_strict_negative':True,
      'positive_signed_intersection_width_strict_negative':True,
      'selected_positive_candidate_Z_strict_lower':str(midpoint_lower),
      'selected_positive_candidate_Z_greater_than_one':True,
      'source_selected_T_upper_strict_negative':True,
      'source_T_lower_is_zero':True,
      'source_selected_Tmid_strict_negative':True,
      'actual_monotone2_s_in_half_two_exists':False,
      'actual_N3_parameters_equal_these_source_witnesses_proved':False,
      'actual_runtime_support_contains_this_unpaired_integer_cell_proved':False,
      'shows_unqualified_source_mesh_is_not_globally_safe':True,
      'need_original_actual_mesh_representative_pairing':True,
      'new_actual_11root_image_calls_certified':0,
      'original_523_Y_proved':33,'original_523_Y_OPEN':490,
      'final_67_jets':0,'M3':'62/64','M4':'0/16','release':'HOLD'
    }

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--original-graph');a.add_argument('--output')
    x=a.parse_args()
    r=exact_original_integer_mesh_counterexample()
    if x.original_graph:r['SHA_verified_graph_pin']=graph_pin(x.original_graph)
    out=json.dumps(r,indent=2)
    if x.output:open(x.output,'w').write(out+'\n')
    print(out)
