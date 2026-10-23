#!/usr/bin/env python3
"""Conditional original paper (8.20) finite Fourier mean-update kernel.

Delta v=-ci^-1*N^-1 Etheta0; gamma_d=-ci^-1*N^-1 Ez0.
This does NOT instantiate the actual private original Etheta/Ez, the
(8.14) axial potential/cutoff remainder, or pressure reconstruction.
"""
from rigorous_rational_intervals import Interval,UncertifiedExpression
from original_torus_fourier_interval import inverse_finite_real_fourier_modes

def paper_eq820_finite_torus_update(theta_modes,axial_modes,ci_interval):
    ci=Interval.parse(ci_interval)
    if ci.lo<=0:raise UncertifiedExpression('Strict positive ci rational lower bound required')
    signed_inverse=-ci.reciprocal()
    theta=inverse_finite_real_fourier_modes(theta_modes)
    axial=inverse_finite_real_fourier_modes(axial_modes)
    def apply(finite_modes):
        return {k:{'re':(Interval.parse(v['re'])*signed_inverse).json(),
                   'im':(Interval.parse(v['im'])*signed_inverse).json()}
             for k,v in finite_modes['output_coefficients'].items()}
    return {'schema':'MathScope.M3.ConditionalPaperEq820MeanCorrection/1',
      'delta_v_coefficients':apply(theta),
      'gamma_desired_coefficients':apply(axial),
      'finite_mode_zero_mean_invariant':True,
      'finite_mode_real_conjugacy_invariant':True,
      'input_ci_independently_source_certified':False,
      'input_mean_residuals_independently_source_certified':False,
      'actual_axial_cutoff_remainder_A1_included':False,
      'actual_pressure_recomputed':False,
      'actual_original_final_67_jet_intervals_certified':0,
      'scope':'FINITE_APPROXIMATION_OF_EQ820_ONLY_NOT_ORIGINAL_SOURCE',
      'release':'HOLD'}
