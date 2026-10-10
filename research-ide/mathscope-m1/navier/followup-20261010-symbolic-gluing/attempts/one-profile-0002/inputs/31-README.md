# Quantitative outer reselection after the fixed-logP failure

This is a new investigation. No published source, certificate, acceptance
record, or English release is modified. The old `Md=1, logP=14` candidate
and its fixed-logP family remain rejected.

The independent calculation in `independent-axial/` proves an actual
replacement of the entire axial region, for every eta, with an explicit
radial scale threshold. The accompanying `OUTER_DERIVATION.md` develops
the later stages using specified positive real expressions, finite moment
matrices, a uniform scalar amplitude root, and explicit error budgets.
`check_outer_envelopes.py` checks the exact scalar inequalities in that
derivation without constructing enormous decimal expansions.

The new parameters are

\[
M_d=2^{20},\quad T=e^{M_d}+10,\quad \log P_*=2T,\quad
\lambda=e^{-1000T},\quad h=e^{-8002T},\quad c_o=1/256,\quad T_f=128.
\]

These expressions define strictly positive finite real numbers. In
particular, lambda and h are not floating-point zeros. The same h expression
is used in the pressure schedule, cone estimates, and endpoint schedule.
The radial scale is left free subject to `XR >= 2^40`; the later source
choice `XR=110(C Pstar)^10`, with C>1, would satisfy that restriction.

## Current concrete calculations

| Calculation | Recorded result and covered scope |
|---|---|
| Independent whole axial region | 47 exact and interval checks; actual relaxed cone for every eta and every axial y, including the positive finite terminal-wait prerequisite |
| Explicit outer sufficient inequalities | 106 exact scalar checks across the stage estimates in `OUTER_DERIVATION.md`; the continuous analytic argument is separately reviewed |
| Independent continuous reviews | 16 axial-review checks, 45 pulse/moment-review checks and 21 postpulse/exterior checks, with the written reviews bound to the examined source bytes |
| Actual source main-pulse integral | 2,048 whole cells on each of the two non-polynomial collars, plus the closed middle integral; 11 checks |
| Independent pulse integral diagnostic | 70-digit Gauss–Legendre calculation and exact endpoint checks, 15/15; numerical agreement is not the enclosure proof |
| Rejection controls | 8/8, including omitted cutoff, deleted lambda smallness, hidden analytic premise and false global promotion |
| Original Lean cone predicates | Seven conditional theorems compiled with actual exit code 0 in `formal-cone/attempts/0001`; their analytic field hypotheses have not been instantiated in Lean |

The current source-bound review outcome and the exact completion boundary
are collected in [FINAL_HANDOFF_EN.md](FINAL_HANDOFF_EN.md) and
`final-review-bindings.json`. The later independent reviews found no
blocking defect in the specified finite A.4 analytic argument. They do
not turn its scalar checks into a Lean proof of the continuous functions.
The older envelope receipt's `independentAuditOfWholeAnalyticBridgeComplete`
field remains false as a preserved record of its earlier creation state.
The separate current receipt binds the subsequent completed reviews.

The computed whole-cell enclosure of the actual source shape is

\[
K_b\in[0.2450496191973,\;0.2450496212058].
\]

Together with the explicit uniform total-S error bound in the derivation,
this encloses the one selected amplitude function, for every eta, in

\[
\operatorname{Amp}(\eta)\in
[1.0100502641935,\;1.0100502683328].
\]

These decimal endpoints are widened for display. The JSON stores the
exact 88-bit outward endpoints. The independent central diagnostic is
`1.010050266264900596...`; it is not substituted for the eta-dependent
root. Its very small but nonzero S error and end corrections are retained
in the uniform interval.

The closed central integral uses the **exact source identity**
`sigma(1-t)=1-sigma(t)`, hence `integral_0^1 sigma(t)dt=1/2`.
Therefore `phi_b(xi)=xi-.01` for xi>=.02. The beginning collar has the
exact change-of-variable factor `.02^3=1/125000`; the final collar uses
`(xi-.01)*(1-sigma(xi-10))`. The check that the independently enclosed
primitive contains 1/2 is a consistency check, not the proof of this
central matching identity.

## Mathematical and implementation boundaries

The outer pressure is its own A.21 function for these parameters. It is
not the pressure from any earlier axis certificate. The finite moment
coefficients below are defined from their actual continuous integrals;
no prior numerical residual is set to zero. A root's exact defining
equation, smoothness, uniqueness bracket, and bounds are distinct from a
floating-point array of its values.

The code in this directory checks scalar bounds and the exact expression
bindings. Its accompanying calculus derivation is not a new Lean proof.
It does not regenerate the original B.2 axis, B.8 matching, C.12 global
modulation, A.7 heat collar, or final stress for this new pressure. No
original N3 gate is promoted. In particular, a successfully bounded
replacement outer region alone is not a completed global profile.

The original A.4 domain ends at terminal coordinate 1/2. The remaining
terminal collar and its heat replacement are not silently included in
that finite-domain claim. The initial and axial stages are required to
satisfy the relaxed cone; eta=0 and k'=0 give v=2 in the axial stage.
The stronger admissible cone is asserted only on the stages where v>2.

## Reproduction

```sh
python3 -B independent-axial/verify_axial_bounds.py
python3 -B check_outer_envelopes.py
python3 -B independent-review-axial/review_checks.py
python3 -B independent-review-pulse/review_checks.py
python3 -B independent-postpulse/check_bounds.py
python3 -B certify_main_pulse_integral.py --cells 2048
python3 -B verify_pulse_integral_independent.py
python3 -B -m unittest test_outer_envelopes.py -v
python3 -B verify_final_snapshot.py
```

The standard library is sufficient for the new envelope checker. The
independent axial calculation uses the unchanged sibling outward interval
module. The optional independent high-precision pulse diagnostic uses
mpmath 1.3.0. Reproduction writes only new receipts in this directory.

Read `OUTER_DERIVATION.md` for the function definitions and the analytic
connections behind each scalar check. The certificate deliberately records
which statements are continuous analytic arguments and which are exact
finite arithmetic checks.
