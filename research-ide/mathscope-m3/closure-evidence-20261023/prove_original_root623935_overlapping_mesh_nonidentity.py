#!/usr/bin/env python3
"""Original root #623935: two genuine neighboring source mesh boxes overlap
at an exact sRep=1 chart representative, but return distinct selected Z and
distinct inverse root s for all 0<h<2^-4096.

This is NOT a failure of individual source image existence. Each selected
point is valid. It proves only that 'both cells contain the reference'
does not imply identity of selected chart evaluations, so global M3
gluing/partition-of-unity cannot be inferred from same-mesh membership.
"""
from fractions import Fraction as F
import json,argparse
from prove_original_root623935_mesh_prerequisites import (
    real_mesh_box,certify_actual_source_srep_one_signed_projection)
from prove_original_root623935_general_srep_image import graph_pin,GRAPH_SHA

def overlapping_neighbor_cert():
    E=3**6
    delta=F(3,4*E)
    eta=F(1,2*E)
    Xrep=F(1,2);Xa=F(1,2);Xb=F(3,2)
    r=F(E);t=F(E)
    x0=certify_actual_source_srep_one_signed_projection(3,r,F(0),t,Xa,Xb,Xrep,eta)
    x1=certify_actual_source_srep_one_signed_projection(3,r,F(1),t,Xa,Xb,Xrep,eta)
    q0=real_mesh_box(3,r,F(0),t,Xa,Xb)
    q1=real_mesh_box(3,r,F(1),t,Xa,Xb)
    a=F(q0['source_s_lower_a']);b=F(q0['source_s_upper_b'])
    m=F(q0['source_T_lower_m']);M=F(q0['source_T_upper_M'])
    assert a==F(1,2) and b==(1+delta)**2 and 0<m<M
    assert [q0[k] for k in ('source_s_lower_a','source_s_upper_b','source_T_lower_m','source_T_upper_M')]==[
        q1[k] for k in ('source_s_lower_a','source_s_upper_b','source_T_lower_m','source_T_upper_M')]
    assert F(q0['z_bounds'][0])==-delta and F(q0['z_bounds'][1])==delta
    assert F(q1['z_bounds'][0])==F(1,4*E) and F(q1['z_bounds'][1])==F(7,4*E)
    # sRep=1 -> Zrep=eta, TRep=1-eta² exactly independent of h.
    Trep=1-eta*eta
    assert -delta<eta<delta and F(1,4*E)<eta<F(7,4*E)
    assert m<Trep<M
    assert all(c['original_monotone2_root_exists_unique_on_selected_image'] for c in (x0,x1))
    # L=0 because a < M; U^2=(b-m)/b^(2h),
    # b in (1,2), 0<2h<1, so U²>(b-m)/2 > (7/(4E))².
    assert a<M and 1<b<2 and (b-m)/2>F(7,4*E)**2
    z_negative=-delta/2
    z_positive=F(1,E)
    assert z_negative==-F(1,1944) and z_positive==F(1,729)
    # Lower T=max(m,g(a))=m since a< m; upper T=min(M,g(b))=M.
    # For both selected Z, 0<=Z²<=1/E², b^(2h)<2, hence
    # g(b)>b-2/E²>M (exact source inequality).
    assert a<m and b-F(2,E*E)>M
    T_selected=(m+M)/2
    assert T_selected==1
    # Original F(s)=s-Z²*s^(2h)-1, strictly increasing on [1/2,2].
    # At s=1, F(1)=-Z²; the positive root satisfies s>1.
    # Distinct Z² imply distinct roots by strict monotonicity.
    assert z_negative*z_negative!=z_positive*z_positive
    return {
      'schema':'MathScope.M3.OriginalRoot623935PairedNeighborMeshValueNonidentity/1',
      'original_graph_sha256_required':GRAPH_SHA,'source_root_node':623935,
      'integer_mesh_boxes_ell_r_z_t':[[3,E,0,E],[3,E,1,E]],
      'actual_representative_s_X_eta':['1',str(Xrep),str(eta)],
      'actual_representative_Z_T':[str(eta),str(Trep)],
      'both_source_actual_representative_mesh_guards_certified':True,
      'source_same_radial_s_bracket':[str(a),str(b)],
      'source_same_T_bracket':[str(m),str(M)],
      'selected_Z_neighbor_values':[str(z_negative),str(z_positive)],
      'same_selected_T_value':str(T_selected),
      'strict_h_uniform_U_exceeds_both_mesh_z_cells':True,
      'selected_native_root_exists_for_both':True,
      'different_selected_Z_squared':True,
      'different_unique_inverse_s_roots_for_all_source_h':True,
      'does_not_refute_actual_final_global_gluing':True,
      'actual_original_gluing_partition_weights_evaluated':False,
      'all_actual_runtime_labels_and_support_verified':False,
      'actual_final_67_jets':0,'original_523_Y_proved':33,
      'original_523_Y_OPEN':490,'M3':'62/64','M4':'0/16','release':'HOLD',
    }

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--graph');p.add_argument('--output')
    q=p.parse_args()
    d=overlapping_neighbor_cert()
    if q.graph:d['original_graph_pin']=graph_pin(q.graph)
    s=json.dumps(d,indent=2,ensure_ascii=False)
    if q.output:open(q.output,'w').write(s+'\n')
    print(s)
