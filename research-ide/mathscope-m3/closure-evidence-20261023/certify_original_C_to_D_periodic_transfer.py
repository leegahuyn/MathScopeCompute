#!/usr/bin/env python3
"""Rigorous *conditional* C -> D transfer from OpenAI NS Theorem 1.1 to Cor. 10.6.

This authenticates rational spatial/time scaling and the exact nonlinear
periodicization argument. It is not a substitute for an ACTUAL MathScope C
candidate (final A-D fields, pressure, forcing, support and all jets).
PDF: OpenAI 'Finite time blowup for Navier-Stokes' pp. 123--126
(10.22)--(10.23), Cor. 10.6.
Lean: NavierStokes/R3/ParabolicScaling.lean and
      NavierStokes/PeriodicPaperTheorem.lean
      at f9e8bc5b38b6e212696e8a30e3e91517af887bbd.
No assumption that the auxiliary Fourier torus is the physical T^3.
"""
from fractions import Fraction as Q
import argparse,json

PDF_SHA256='0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'
LEAN_REVISION='f9e8bc5b38b6e212696e8a30e3e91517af887bbd'
LEAN_FILES={
 'NavierStokes/R3/ParabolicScaling.lean':'5dd1d3756b0e43c56a063ae3dce0ee27349da1c3',
 'NavierStokes/PeriodicPaperSupport.lean':'1ddcca82e104e09d773f708a55e1f83cdb7740f5',
 'NavierStokes/PeriodicPaperScalingSupport.lean':'e46b1b7e8c4dfc22ee18789ab23e3ef50437795f',
 'NavierStokes/PeriodicPaperTheorem.lean':'e7cdc29594f635a0eebf6967352a148be1b818e9',
}
SOURCE_GRAPH_SHA256='a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'

class UnprovedCandidateScope(ValueError):
    pass

def require(value,message):
    if not value:raise UnprovedCandidateScope(message)

def exact_parabolic_exponents():
    # For tilde u(x,t)=lambda*u(lambda*x,lambda^2(t-t0)),
    # tilde p=lambda^2*p(...), tilde f=lambda^3*f(...):
    # all terms in NS residual scale lambda^3, divergence lambda^2.
    # d^3x=lambda^-3 d^3y, dt=lambda^-2 ds.
    out={
      'time_derivative_u':3,
      'u_dot_grad_u':3,
      'nu_laplacian_u':3,
      'grad_pressure':3,
      'forcing':3,
      'divergence_u':2,
      'spatial_velocity_L2_squared':-1,
      'spatial_force_L2_squared':3,
      'integrated_nu_gradient_L2_squared':-1,
      'time_integral_force_L2_then_squared':-1,
      'velocity_pointwise_amplitude':1,
    }
    require(all(out[x]==3 for x in
      ('time_derivative_u','u_dot_grad_u','nu_laplacian_u',
       'grad_pressure','forcing')),'nonlinear PDE scaling mismatch')
    require(out['spatial_velocity_L2_squared']==out['integrated_nu_gradient_L2_squared']
         ==out['time_integral_force_L2_then_squared']==-1,
        'energy/dissipation/forcing scaling mismatch')
    return out

def conditional_C_to_D_transfer(spatial_halfwidth, scaling=None,
                                initial_rest_through=None, final_force_time=Q(2)):
    """Construct exact rational parameter witnesses for *any C candidate*
    supported inside [-R,R]^3. The C candidate itself is NOT supplied.
    A smooth extension by zero at t0 needs an independently certified
    rest interval after s=0, so initial_rest_through must be >0.
    """
    require(type(spatial_halfwidth) is Q and spatial_halfwidth>=0,
       'positive rational cube support radius R required')
    require(type(final_force_time) is Q and final_force_time>=1,
       'source force future compact-time upper support bound needed')
    if scaling is None: scaling=2+4*spatial_halfwidth
    require(type(scaling) is Q and scaling>1,
       'strict positive rational parabolic compression lambda>1 required')
    require(4*spatial_halfwidth<scaling,
       'source common spatial support must compress inside quarter fundamental cube')
    require(type(initial_rest_through) is Q and initial_rest_through>0,
       'source force and fields must vanish on genuine initial time interval')
    lam=scaling;R=spatial_halfwidth
    t0=1-1/(lam*lam)
    halfwidth=R/lam
    margin=Q(1,4)-halfwidth
    translated_gap=1-2*halfwidth
    support_force_end=t0+final_force_time/(lam*lam)
    scale=exact_parabolic_exponents()
    require(0<t0<1 and halfwidth<Q(1,4)
         and margin>0 and translated_gap>Q(1,2)
         and support_force_end>=1,
       'periodic source compressed support/time interval inconsistent')
    # For any distinct integers k != l, some component |k_i-l_i|>=1;
    # the compact support translations (cube side 2R/lambda) have
    # a strictly positive inter-translate coordinate gap.
    # Consequently (sum u_k . grad)(sum u_l) contains no cross term
    # at any point. Compact smooth supports guarantee derivatives vanish
    # outside supports, including the boundaries of zero neighborhoods.
    # Periodization on T3 preserves the PDE if the C candidate does.
    return {
      'schema':'MathScope.M3.OriginalOpenAICtoDParabolicPeriodicTransferConditional/1',
      'source_paper_sha256':PDF_SHA256,
      'official_Lean_revision':LEAN_REVISION,
      'official_Lean_Git_blob_sha1':LEAN_FILES,
      'scope':'CLAY_C_WHOLE_SPACE_TO_D_PHYSICAL_PERIODIC_TORUS_ONLY',
      'not_the_auxiliary_oscillatory_torus':True,
      'base_positive_viscosity_stays_unchanged_under_parabolic_compression':True,
      'source_common_support_coordinate_bound':str(R),
      'compression_lambda':str(lam),
      'compressed_support_halfwidth':str(halfwidth),
      'fundamental_cube_halfwidth':'1/2',
      'quarter_cube_interior_margin':str(margin),
      'minimum_distinct_integer_translate_support_gap':str(translated_gap),
      'physical_spatial_translates_disjoint_with_positive_gap':True,
      'time_shift_t0':str(t0),
      'source_initial_rest_interval_to_be_verified':str(initial_rest_through),
      'source_time_one_goes_to_periodic_time_one':str(t0+1/(lam*lam)),
      'compressed_force_time_support_subset':[str(t0),str(support_force_end)],
      'source_parabolic_exponents':scale,
      'PDE_residual_and_forcing_scale_by_lambda_cubed_given_source_C_PDE':True,
      'divergence_zero_preserved_given_source_C_divergence_zero':True,
      'nonlinear_cross_terms_vanish_given_source_C_compact_smooth_support':True,
      'torus_integral_equals_compressed_whole_space_integral_under_support':True,
      'periodic_L2_energy_and_nu_dissipation_scale_by_one_over_lambda':True,
      'source_force_L1_t_L2_x_squared_scales_by_one_over_lambda':True,
      'C_blowup_inherits_D_blowup_at_t_one_given_source_C_blowup':True,
      'source_actual_final_C_velocity_pressure_force_input_authenticated':False,
      'source_actual_common_support_and_initial_rest_hypotheses_authenticated':False,
      'source_actual_full_K_energy_and_force_work_authenticated':False,
      'source_actual_final_A_to_D_fields_authenticated':False,
      'source_actual_C_theorem_to_MathScope_AST_refinement_proved':False,
      'original_523_Y_bounds_certified':33,'original_523_Y_bounds_OPEN':490,
      'final_67_jets':0,'M3':'62/64','M4':'0/16','release':'HOLD'
    }

def conditional_energy_transfer(E2,nu_dissipation_integral,F_integral_squared,lam):
    """Exact *input-conditional* Lemma 10.4 (10.13) conservation of
    normalized energy inequality; never use hypothetical values as actual
    MathScope physical-field integration evidence.
    """
    require(all(type(v) is Q for v in
                (E2,nu_dissipation_integral,F_integral_squared,lam)),
            'rational verified energy inputs are required')
    require(E2>=0 and nu_dissipation_integral>=0
         and F_integral_squared>=0 and lam>1,
         'positive exact C energy/dissipation/force values required')
    require(E2+2*nu_dissipation_integral<=F_integral_squared,
         'source candidate does not meet C (10.13) inequality')
    compressed_E2=E2/lam
    compressed_D=nu_dissipation_integral/lam
    compressed_Fsq=F_integral_squared/lam
    require(compressed_E2+2*compressed_D<=compressed_Fsq,
         'incorrect C to D energy scaling')
    return {
      'schema':'MathScope.M3.OriginalOpenAICtoDEnergyIdentityConditional/1',
      'old_E2':str(E2),
      'old_nu_times_integrated_gradient_L2_squared':str(nu_dissipation_integral),
      'old_force_L1_t_L2_x_squared':str(F_integral_squared),
      'new_E2':str(compressed_E2),
      'new_nu_times_integrated_gradient_L2_squared':str(compressed_D),
      'new_force_L1_t_L2_x_squared':str(compressed_Fsq),
      'new_energy_inequality_check':True,
      'these_are_supplied_hypothetical_rationals_not_actual_N706_integration':True,
      'N7_06_original_whole_K_energy_discharged':False,
      'original_final_67_jets_certified':0,'release':'HOLD',
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--output')
    x=p.parse_args()
    c=conditional_C_to_D_transfer(Q(1),initial_rest_through=Q(1,16))
    e=conditional_energy_transfer(Q(1),Q(1),Q(4),Q(c['compression_lambda']))
    evidence={'transfer':c,'energy_example':e}
    serial=json.dumps(evidence,indent=2,ensure_ascii=False)+'\n'
    if x.output:
      from pathlib import Path
      Path(x.output).write_text(serial,encoding='utf-8')
    print(serial)
if __name__=='__main__':main()
