# Directed amplitude budgets for the four annular corrections

For the original annulus let `J(u)^2=2(E(u)+D(u))` in the normalization
of the center and exterior receipts. This is the square of a Hilbert-space
norm of the pair formed by the endpoint velocity and the weighted space-time
gradient. Its triangle inequality therefore applies to the initialized field
and all four corrections, including overlapping supports. If each of the
five terms has `J²≤2^-26 S_R`, their sum has
`J²≤25·2^-26 S_R<2^-21 S_R`.

For stages one through four use the separate spatial weights of the source
potential and direct velocity. With `s_x=(1+h)/2`, require one constant
`C_j` for each stage and each Cartesian component:

```text
|∂^r A_j| ≤ C_j q^(1/2-A+jh/10-r s_x), r=0,1,2
|∂^r B_j| ≤ C_j q^(-A+jh/10-r s_x),    r=0,1
```

Apply the original correction cutoff before curl and retain the outer time
and axial factors. The outer spatial radial factor is one on the annulus.
The combined cutoff has value at most one, axial derivative at most
`64 q^-s_x`, and second axial derivative at most `8192 q^(-2s_x)`.
These bounds use the existing derivative receipts, `q/tau0≤2` and
`D≤s_x`. They include the mixed product of the two cutoff derivatives.
The product rule gives per-component curl-plus-direct velocity and each
Cartesian gradient entry bounded respectively by

```text
2^8 C_j q^(-A+(j/10-1/2)h)
2^15 C_j q^(-A-1/2+(j/10-1)h)
```

The annulus has normalized endpoint measure and normalized slab measure
at most `32 tau0 Xb`, since `r dr=q dX`, `q<2 tau0`, the axial normalized
length is `sqrt(2)`, and the angle length is `2π`. The slab time interval
has length 1/2. Replacing q by tau0 in either negative power costs at
most four, since `1/2≤q/tau0` and both exponents lie in [-2,0].
The three velocity and nine gradient entries, including the factor two
in twice the dissipation, give

```text
J(u_j)^2 ≤ 2^44 Xb C_j² tau0^(1+(j/5-2)h).
```

The original force scale is `S_R=tau0^(1-2h) B_h^4 Xb^(-4A)/(4A)`.
Using `B_h>1`, `Xb>1`, and `4A<3` gives
`J(u_j)^2/S_R≤2^46 Xb^4 C_j² tau0^(jh/5)`. A sufficient amplitude
threshold is therefore `2^-36 Xb^-2 tau0^(-jh/10)` for each stage.
The directed calculation retains the exact small factor h in
`h log(tau0)`; all four thresholds are positive and exceed one.

The existing coarse **upper endpoint** for K is larger than each admitted
threshold. This checks the limitations of that endpoint as a numerical
majorant. It does not show that the actual K or the actual stage amplitudes
exceed any threshold. The independently evaluated stage-amplitude constants,
and a separate initialized-field bound in this energy norm, are still
required. No N7-06, N8-05 or final-jet status changes.

```text
node evaluate_correction_budgets.mjs GOAL_NEXT ARITHMETIC_RUNTIME HISTORICAL_INPUT annular-thresholds.json
```

The initialized-field readback reuses the existing 67 actual atom intervals
and the exact Cartesian localization stencil. It retains both transverse
coordinates at most `2 sqrt(Xb) sqrt(tau0)` and the exact affine axial
cutoff powers. On the full physical annulus,
`Q=q/tau0=rho+zeta² Q^(2h)`, `Q^(2h)≤1+4h` and `rho≥1/2` give
`eta²=(Q-rho)/Q≤17/33<(3/4)^2`, within that receipt's chart. After
evaluating the 50 nonzero stencil terms and dividing both sides by tau0,
the initialized upper endpoint still exceeds the sufficient initialized
budget. The largest retained normalized stencil endpoint involves the
`b@1,0,0` atom and the product of the transverse coordinates. This
identifies a priority for sharper original atom bounds.

```text
node evaluate_initialized_budget.mjs GOAL_NEXT ARITHMETIC_RUNTIME HISTORICAL_INPUT original-67plus13-polynomials.json annular-initialized-budget.json
```
### Component bounds for the dominant initialized radial atom

`direct-spatial-factor.json` binds the directed component bounds of
stage-zero DAG root #496, the bound for `b@1,0,0`. The root adds #491 (slow
background) to #479 (physical scaling) times the sum of #492 (initialized
mean value) and #493 (initialized mean radial derivative). The mapped orders
and inverse-radius powers are respectively `(0,3)` and `(1,2)` with
coefficient `1/2`. The names in the archived `radial-dominance.json` were
reversed. The upper endpoint of the scaled #493 contribution strictly
exceeds the other two upper endpoints. The original 67-atom output retains
its existing SHA-256
`9dcc5ad21169fe7462bd76f588d994126f0beaef5fdfc4e6ab4657e056371b34`.

For the radial derivative, retain the original spatial #267 and FiveMap
#234 terms in #276. The old maximum also included the temporal #273. Their
rounded upper endpoints coincide at the recorded precision. The physical
factor is exactly `exp[(ell+17)(2+h)log(2)]`. Since the original schedule is
`tau0=exp[-(ell+15)log(2)]`, split this factor into
`4^(2+h) tau0^(-2-h)` before multiplying by the positive envelope.
The direct value and axial derivative have reciprocal powers `1+h` and
`3/2`, respectively. The axial derivative retains the ordinary temporal
field's spatial derivative and the FiveMap derivative. Its mean bound
dispenses with the radial phase derivative and time transport term. The
source contains an exact cancellation of the two opposite (h) exponents
for this axial scale.

The new replay splits twelve affected stencil terms, giving 62 positive
terms in total. The normalized leading mean contribution has exact
`tau0` exponent zero. The directed bound is strictly lower than the archived
50-term result and still exceeds the initialized energy budget. Even after
removing the positive split contributions of the three direct mean atoms
from the budget computation, the remaining upper envelope exceeds the
threshold. The largest remaining term contains `A1@2,0,0,0`.

Reproduce the spatial factor by appending a new diagnostic output path as
the fifth argument to the
[stage-zero replay](../../../whole-k-annular-initial/numerical/STAGE_ZERO_NUMERICAL.md).
Then append the spatial-factor receipt as a sixth argument to
`evaluate_initialized_budget.mjs`. This emits the factorization and
remaining-envelope comparisons in `initialized-budget-direct.json`.
