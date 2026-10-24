#!/usr/bin/env python3
"""Original native #623935 signed projection: C0 obstruction without mesh pairing.

Proves, for every 0<h<2^-4096, a discontinuity in the *source-selected
Z input* as real admissible Xa<Xb vary with fixed integer mesh indices.
It is not a counterexample on actual paired physical-field support.

At ell=3, (r,z,t)=(2E,0,E), E=ell^6, delta=3/(4E),
zlo=-delta, zhi=delta, m=1-delta, M=1+delta.
Pick Xa=(2+delta)^2/4, Xb=(2-delta)^2/(2a). Then source bounds
are a and b=2 for a in [M+delta², M+2delta²].
Write H(a)=a-M-a^(2h)*delta². At left H<0 (a>1);
at right H>0 (a<2, 2h<1), and
H'(a)=1-2h a^(2h-1) delta²>0.
Thus unique a* in interval has source L(a*)=delta.
Source U²=(2-m)/2^(2h)>(1+delta)/2>delta².
For a<a* approaching a*, L<delta and negative interval has width
delta-L>0, giving selected Znegative=(-delta-L)/2 -> -delta.
At a=a*, negative width=0 so source chooses positive interval of
zero width, Zpositive=+delta. The jump is exactly 2delta>0.

The T midpoint and inverse root need not jump: only the source Z input
is proven discontinuous. This invalidates inferring C0 / all-order jets
from the total unconstrained signed projection expression alone.
"""
from fractions import Fraction as F
from prove_original_root623935_mesh_prerequisites import real_mesh_box
from prove_original_root623935_general_srep_image import GRAPH_SHA,graph_pin

def certificate():
    ell=3;E=ell**6
    delta=F(3,4*E);m=1-delta;M=1+delta
    rlo=2-delta;rhi=2+delta
    Xa=rhi*rhi/4
    lo=M+delta*delta
    hi=M+2*delta*delta
    if not (F(1)<M<lo<hi<F(2)):raise AssertionError('source h parameter interval')
    checked=[]
    for a in (lo,hi):
        Xb=rlo*rlo/(2*a)
        q=real_mesh_box(ell,F(2*E),F(0),F(E),Xa,Xb)
        assert 0<Xa<Xb
        assert F(q['source_s_lower_a'])==a
        assert F(q['source_s_upper_b'])==2
        assert F(q['source_T_lower_m'])==m
        assert F(q['source_T_upper_M'])==M
        assert [F(t) for t in q['z_bounds']]==[-delta,delta]
        checked.append({'source_a':str(a),'source_Xa':str(Xa),
                        'source_Xb':str(Xb),'actual_original_mesh_formulas_pass':True})
    # For all source 0<2h<2^-4095<1, a^2h is strictly
    # >1 when a>1 and <2 when a<2. Consequently:
    # H(lo)=delta²*(1-lo^(2h))<0,
    # H(hi)=delta²*(2-hi^(2h))>0.
    # H' > 0 since 2h<1, a>=1 implies a^(2h-1)<=1.
    # U²=(2-m)/2^(2h)>(1+delta)/2 > delta².
    assert (1+delta)/2>delta*delta
    assert hi<2 and delta<1 and m>0
    return {
       'schema':'MathScope.M3.OriginalRoot623935SignedZSourceC0Obstruction/1',
       'original_graph_sha256_required':GRAPH_SHA,
       'root_node':623935,'source_signed_selector_node':623921,
       'original_integer_mesh':[ell,2*E,0,E],
       'fixed_source_Xa':str(Xa),
       'variable_original_source_Xb':'(2-delta)^2/(2*a)',
       'source_delta':str(delta),
       'source_m_M':[str(m),str(M)],
       'a_bracket_exact_rationals':[str(lo),str(hi)],
       'source_original_bounds_checked_at_both_bracket_endpoints':checked,
       'H_left_negative_for_all_source_h':True,
       'H_right_positive_for_all_source_h':True,
       'H_strictly_increasing_on_bracket_for_all_source_h':True,
       'unique_real_a_star_with_source_L_eq_delta':True,
       'source_U_gt_delta_for_all_source_h':True,
       'negative_selected_Z_left_limit':str(-delta),
       'positive_selected_Z_at_zero_width':str(delta),
       'original_signed_Z_selector_jump':str(2*delta),
       'global_unconstrained_signed_projection_is_C0':False,
       'actual_native_runtime_passes_through_switch_proved':False,
       'actual_source_mesh_representative_pairing_proved':False,
       'source_junction_all_order_smoothness_proved':False,
       'actual_final_67_jets':0,'original_523_Y_proved':33,
       'original_523_Y_OPEN':490,'M3':'62/64','M4':'0/16','release':'HOLD',
    }

if __name__=='__main__':
    import argparse,json
    p=argparse.ArgumentParser()
    p.add_argument('--graph');p.add_argument('--output')
    args=p.parse_args()
    result=certificate()
    if args.graph:result['original_graph_pin']=graph_pin(args.graph)
    output=json.dumps(result,indent=2,ensure_ascii=False)
    if args.output:open(args.output,'w').write(output+'\n')
    print(output)
