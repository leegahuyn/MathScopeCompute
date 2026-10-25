#!/usr/bin/env python3
"""Source-image slow chart: explicit uniform holomorphic inverse neighborhood.

ORIGINAL first-FiveMap native monotone system 2:
    F(s,Z,T)=s-Z**2*s**(2*h)-T,
    D=1/2-h, Z0=s0**D*eta, T0=s0*(1-eta**2).
Actual N3 source guarantees 0<h<2**-4096. For any real
s0 in [1/2,2], eta in [-1,1], the inverse is holomorphic on
|Z-Z0|<1/100 and |T-T0|<1/100, with |s-s0|<1/8.

Rigorous contraction on the CLOSED disk |s-s0|<=1/8:
 Re(s)>=3/8, |s|<=17/8, so principal log is analytic;
 |s**(2h)|<3/2, |s**(2h-1)|<4 (0<2h<1/2).
 |Z0|<3/2, |Z|<151/100<8/5.
 sup|d_s (Z**2*s**(2h)+T)| < 512*h/25 < 1/8.
 At s0, displacement < (301/10000)*(3/2)+1/100
   =1103/20000 < 7/64.
 Therefore the closed disk maps strictly into itself:
   1103/20000 + (1/8)*(1/8) < 1/8.
 Banach's fixed-point theorem yields a unique holomorphic fixed point.
 Parameter-dependent holomorphy follows from uniformly convergent
 analytic Picard iterates. Cauchy's formula gives for every a,b>=0
   |partial_Z**a partial_T**b s(Z0,T0)| <=
        (17/8) * a! * b! * 100**(a+b).

This is a source-image theorem about ONE exact native operation.
It does NOT certify caller support, branch gluing, any global B_rho
profile norm, all-j field smoothness, or source final 67 jets.
"""
import argparse,json,math
from fractions import Fraction as Q
from pathlib import Path

SOURCE_GRAPH_SHA='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
SOURCE_REG_SHA='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
R=Q(1,8)
DELTA=Q(1,100)
H_UPPER=Q(1,2**4096)

def exact_tube_contract():
    assert 0<H_UPPER<Q(1,256)
    assert 2*H_UPPER<Q(1,2)
    assert Q(17,8)<Q(3,2)**2   # |s|^(2h) < sqrt(17/8) <3/2
    assert Q(2)<Q(3,2)**2     # |Z0| <= sqrt(2) <3/2
    upperZ=Q(3,2)+DELTA
    assert upperZ<Q(8,5)
    assert Q(3,8)>0 and Q(17,8)==Q(2)+R
    assert (Q(3,2)/Q(3,8))==4
    derivative_factor=2*(Q(8,5)**2)*4
    assert derivative_factor==Q(512,25)
    assert derivative_factor*H_UPPER<Q(1,8)
    displacement=(upperZ+Q(3,2))*DELTA*Q(3,2)+DELTA
    assert displacement==Q(1103,20000)
    assert displacement<Q(7,64)
    assert displacement+R*Q(1,8)<R
    return {
      'schema':'MathScope.M3.OriginalMonotone2UniformComplexImageTube/1',
      'source_graph_sha256':SOURCE_GRAPH_SHA,
      'native_registry_sha256':SOURCE_REG_SHA,
      'pinned_native_system':2,'actual_original_reachable_call_ids':[622820,623935],
      'source_exponent_h_upper_strict':'2^-4096',
      'source_image_s0_interval':['1/2','2'],
      'source_image_eta_interval':['-1','1'],
      'source_Z0':'s0^(1/2-h) eta',
      'source_T0':'s0 (1-eta^2)',
      'holomorphic_Z_and_T_polydisk_radii':[str(DELTA),str(DELTA)],
      'holomorphic_s_solution_disk_radius':str(R),
      'analytic_log_branch':'principal, Re(s)>3/8',
      'source_G_s_complex_contraction_constant_strict_upper':'1/8',
      'source_G_s_exact_factor_times_h':str(derivative_factor)+' h',
      'center_displacement_strict_upper':str(displacement),
      'strict_inward_mapping':True,
      'source_inverse_unique_in_solution_disk':True,
      'source_inverse_holomorphic_over_image_polydisk':True,
      'cauchy_all_mixed_Z_T_orders_bound':'(17/8) * a! * b! * 100^(a+b)',
      'complex_s_root_bound':'17/8',
      'complex_eta_exact_chart_pullback':original_chart_complex_eta_pullback(),
      'native_callers_real_source_image_all_verified':False,
      'source_mesh_switch_gluing_C_infinity':False,
      'source_Brho_global_norm_and_complex_eta_transport':False,
      'original_523_Y_upper_bound_certified':33,
      'original_523_Y_upper_bound_OPEN':490,
      'final_67_source_jets_certified':0,
      'M3':'62/64','M4':'0/16','release':'HOLD'
    }

def original_chart_complex_eta_pullback():
    """For fixed real s0, Z(eta)=s0^(1/2-h)*eta,
    T(eta)=s0*(1-eta^2), including complex |eta-eta0|<1/1000.

    The full eta disk is in the uniform source-image inverse tube:
      |delta Z| <= (3/2)/1000 < 1/100,
      |delta T| <= 2*(1/1000)*(2+1/1000) < 1/100.
    F(s0,Z(eta),T(eta)) is identically zero as a HOLOMORPHIC
    function, so uniqueness forces inverse s(Z(eta),T(eta))=s0;
    ALL complex eta derivatives along the exact image vanish.
    This does not bound independent actual native free-coordinate
    calls or complex analytic Phi/u source profiles.
    """
    d=Q(1,1000)
    boundZ=Q(3,2)*d
    boundT=Q(2)*d*(Q(2)+d)
    assert boundZ==Q(3,2000)<DELTA
    assert boundT==Q(2001,500000)<DELTA
    assert Q(1,2)-H_UPPER>0
    return {
       'source_chart_complex_eta_radius':str(d),
       'source_chart_eta_Z_excursion_bound':str(boundZ),
       'source_chart_eta_T_excursion_bound':str(boundT),
       'source_chart_exact_2D_plus_2h_equals_one':True,
       'source_chart_complex_F_s0_Z_eta_T_eta_identically_zero':True,
       'native_inverse_after_source_image_eta_pullback_is_s0_identically':True,
       'every_positive_order_eta_derivative_of_inverse_on_exact_source_image':'0',
       'source_native_free_coordinate_call_uses_this_pullback_proved':False,
       'original_analytic_profile_phi_u_Brho_scope_proved':False,
       'release':'HOLD'
    }

def cauchy_derivative_majorant(a,b):
    if type(a) is not int or type(b) is not int or min(a,b)<0:
        raise ValueError('Need nonnegative native inverse derivative multiindex')
    if a+b>64:raise ValueError('Finite certificate evaluation limited to total order 64')
    return Q(17,8)*math.factorial(a)*math.factorial(b)*100**(a+b)

def main():
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path)
    opt=p.parse_args()
    x=exact_tube_contract()
    if opt.output:opt.output.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'actual_system2_tube':'UNIFORM_SOURCE_IMAGE_PROVED',
      'complex_inverse_derivative_orders':'ALL_ORDER_CAUCHY',
      'caller_support':'OPEN','final_67_jets':0,'release':'HOLD'}))
if __name__=='__main__':main()
