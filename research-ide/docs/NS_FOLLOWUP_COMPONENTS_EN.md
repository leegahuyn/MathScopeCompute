# Eight implemented Navier–Stokes follow-up families

These components are the frozen **v54** implementation. They extend actual source-formula calculations; they do not constitute one certified global NS leading profile. Their eight kinds provide eleven additional examples. The same source edition, formulas, precision, input, result, and unresolved gates are carried in each output.

The source is the pinned 166-page [Finite time blowup for Navier–Stokes](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf), SHA-256 `0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`. Formula numbers below refer to that edition. The [full source map](../mathscope-m1/navier/paper-reference-map.json) and [source lock](../mathscope-m1/navier/sources.lock.json) retain the edition and repository details.

| Family | Kind | Examples | Baseline grade |
|---|---|---|---|
| Rational-pressure axis | `ns.axis-certificate` | `ns-axis-exact-bounds` | Verified local bound certificate |
| Source outer construction | `ns.source-outer` | `ns-source-outer-repairs` | Computed source component / PARTIAL |
| Controlled continuation | `ns.controlled-continuation` | `ns-controlled-axis`, `ns-controlled-source-datum` | Computed source component / PARTIAL |
| Admissible loop | `ns.admissible-loop` | `ns-loop-zero-p2`, `ns-loop-tilted` | Computed C.1 loops / PARTIAL |
| A.21 analytic pressure | `ns.pressure-certificate` | `ns-source-pressure-bounds` | Exact rational bounds with an analytic theorem argument |
| A.21-bound axis | `ns.axis-source-certificate` | `ns-axis-source-exact-bounds` | Verified local bound certificate |
| C.12 modulation/restoration | `ns.radial-modulation` | `ns-source-radial-modulation`, `ns-source-radial-small-frequency` | Computed source component / PARTIAL |
| B.34/B.8 gluing | `ns.source-inner-gluing` | `ns-source-inner-gluing` | Computed source component / PARTIAL |

The validation counts below refer to scalar checks, assertions, or comparisons. They are not counts of original acceptance criteria or new Lean theorems. Run reference scripts on a disposable copy: some original scripts regenerate their evidence files.

## 1. Rational-pressure axis certificate

**Input and construction.** For

$$
P(\eta)=-\frac{K}{(1+\eta^2)^2},
$$

the module computes low-Z separation over the full η range, a common complex tube, Cauchy coefficient-norm bounds, and every term of the source controlled remainder. It evaluates a positive prefix and a rigorous tail for the infinite resolvent series. Exact rational arithmetic supplies the contraction, self-map, positivity, radial-tail, and mixed-tail constants; display floats are not proof inputs.

**Recorded result.** The default self-map bound is `1/400`; the uniform error bound relative to `f₀(Yχ(η))` is `1/318`. On the exact rectangle

$$
0\le Y\le41/10,\qquad -1\le\eta\le1,
$$

the lower bound for Φ is `16011107/61056000`, which is greater than `1/4`. The baseline records Node **27/27** and independent Fraction/Bernstein **131/131** checks.

**Hypothesis scope.** The default `h=1/200`, `j₀=3/100` is not an instance of the paper's narrower `SmallParameters` specialization. It follows a separately bounded general `Controlled/CompatibleData` path. The original rc2 audit imported 16 declarations and checked four additional scalar statements for this rational fixture, with a deliberately false inequality rejected.

**Remaining connection.** The exact local bounds do not by themselves identify the existing finite η-jet array with the same infinite fixed point. That needs coefficient identity, truncation bounds, and roundoff bounds. They also do not prove that a numerically corrected source exterior realizes the A.21 pressure or instantiate every generated premise in Lean.

Evidence: [default certificate](../mathscope-m1/navier/followup-construction/axis-default-certificate.json), [Node results](../mathscope-m1/navier/followup-construction/axis-test-results.json), [independent results](../mathscope-m1/navier/followup-construction/axis-independent-validation.json), [pinned audit](../mathscope-m1/navier/followup-construction/axis-pinned-audit.json).

```bash
node --test mathscope-m1/navier/followup-construction/axis-certificates.test.mjs
python3 -B mathscope-m1/navier/followup-construction/verify-axis-independent.py
```

## 2. Actual Appendix A outer construction and compensation

**Construction.** `outer.mjs` computes the smooth step and radial schedules A.5–A.13, terminal Q ODE, A.15 M/J correction, two angular bumps in A.11, A.19 amplitude, A.21 pressure treatment, and the three-bump heat compensation from A.7. Reserved patches remain explicitly located in the output.

**Large and small quantities.** Radii on scales such as `exp(65966)` and tiny nonzero moments are represented as signed logarithmic values. Overflow and underflow are not handled by silently substituting infinity or zero in the mathematical state. Stable integration coordinates are documented in the precision history.

**Verification.** The baseline records Node **40/40** and independent 70-digit Gauss comparisons **71/71**. The maximum relative discrepancy in the independently integrated M/J correction is approximately `3.4566e-9`, within the original `2e-8` tolerance. Earlier failed numerical formulations are preserved.

**Remaining connection.** A small numerical moment residual is not an exact identity. The module has finite η computations, while the acceptance criterion needs every η and one common corrected exterior E. It must establish E>0, exact moment restoration, the heat compensation, and reserved-patch properties simultaneously. The actual pressure of corrected E must be identified with the ideal A.21 target.

Evidence: [fixture](../mathscope-m1/navier/followup-construction/outer-fixture.json), [validation](../mathscope-m1/navier/followup-construction/outer-validation.json), [independent reference](../mathscope-m1/navier/followup-construction/outer-independent-reference.json), [precision history](../mathscope-m1/navier/followup-construction/outer-precision-history.json).

```bash
node mathscope-m1/navier/followup-construction/outer.verify.mjs
python3 mathscope-m1/navier/followup-construction/outer-reference.py
```

## 3. Source B.22/B.26 controlled continuation

**Construction.** Starting from finite nonlinear axis coefficients, the module applies the actual source cutoff and evolves the B.26 log-Φ/U equations while integrating all five cumulative moments M,I,J,S,C_p. Two examples use a rational pressure datum and an actual A.21 source datum.

The corrected source expression is

$$
N_s=-WU+
\frac{D(M-\eta M_\eta)+4h\eta S-dS_\eta}{X}
+4A\eta\Pi-d\Pi_\eta.
$$

The `−WU` term is **outside** the quotient by X. An earlier transcription put it inside. That error affected the reference shear, U evolution, and accumulated moments; changing the displayed formula alone would not repair the old output.

**Correction and verification.** The shared continuation/loop regression records **109/109** on the corrected implementation. A new independent source-equation check found all **243** checks failing on historical data, with maximum difference approximately **67.01080019**. After correction, **243/243** passed with maximum difference **2.8422e-14**. The old 109 regression checks had not independently reconstructed this expression, so their historical success is not presented as evidence that the wrong formula was correct.

**Remaining connection.** This is a finite-jet, Runge–Kutta/Hermite continuation. It needs a rigorous continuous ODE enclosure, identification with the infinite source-axis solution, uniform η bounds, and the same B.33/B.40 parameter hierarchy as the final gluing.

Evidence: [contract](../mathscope-m1/navier/followup-construction/continuation-loop-contract.json), [examples](../mathscope-m1/navier/followup-construction/continuation-loop-examples.json), [independent equation check](../mathscope-m1/navier/followup-construction/continuation-source-formula-independent.json), [correction record](../mathscope-m1/navier/followup-construction/ns-source-formula-correction.json). The previous bytes remain under `history/ns-wu-scaling-v1/` and are not imported by the current Worker.

```bash
node mathscope-m1/navier/followup-construction/test-continuation-loop.mjs
python3 mathscope-m1/navier/followup-construction/independent-continuation-formula.py
```

## 4. Actual C.1 admissible loop

**Construction.** The C.1 implementation computes the exponential tilt, positive-variance equation, and phase reparametrization. It treats the p₂=0 branch by its removable limit and returns zero-mean C.11 primitives. Weighted integration means and phase means are kept distinct.

For each fixed input state it calculates bounds on cone gaps for all phases. This all-phase statement is wider than a phase sample, but its state is still fixed. It is not a uniform theorem over every `(X,η)` in a completed source profile.

**Verification.** In addition to the shared **109/109** regression cohort, independent 160-digit Bessel and angular-integration checks record **39/39**. The two examples expose both the removable branch and a genuinely nonzero p₂ case.

**Remaining connection.** The full profile must keep the loop hypotheses and η derivatives controlled over all its states. The resulting loop must be attached to the same C.12 and gluing profile. An isolated admissible loop does not close that uniformity condition.

Evidence: [contract](../mathscope-m1/navier/followup-construction/continuation-loop-contract.json), [independent loop reference](../mathscope-m1/navier/followup-construction/independent-loop-reference.json), [implementation](../mathscope-m1/navier/followup-construction/admissible-loop.mjs).

```bash
python3 mathscope-m1/navier/followup-construction/independent-loop-reference.py
```

## 5. Exact analytic bounds for the actual A.21 target pressure

**Defined object.** The module defines the pressure of the unedited ideal schedule, retaining the source's transition lengths. With `y=log(X/X_R)`,

$$
P(z)=-\int_{\mathbb R}(1+z^2)^{-2\theta(y)}\,d\mu(y),
\qquad d\mu(y)=\tfrac12 E_{\mathrm{id,sched}}(y,0)^2dy,
\qquad0\le\theta\le1.
$$

The measure is positive and its total mass is bounded from the input. The producer does not accept a caller-supplied mass, norm, or truth flag, and it does not use an unchecked quadrature result as certificate input.

**Both infinite ends.** The exact argument gives

$$
\frac52P_*^2\le \mu(\mathbb R)\le
P_*^2\left(\frac52e^{1/5}+\frac{e^{-2/5}}{2(1-c_oh)^2}\right).
$$

The normalized upper bound for the default input is approximately **3.38866691845176**. The two infinite ends are included by analytic envelopes. A separate diagnostic numerical integral is a comparison, not the source of this bound. A very small positive mixed suffix is retained as a positive rational upper bound, not set to zero.

**Complex domain and all derivatives.** On a tube of radius r<1/2 around `[-W,W]`, the argument of the nonintegral power uses the principal Log in the right half-plane. Put `δ=1−r²`; then `Re(1+z²)>δ>0`. A common integrable majorant yields

$$
|P(z)|\le C_u\delta^{-2},\qquad
|P'(z)|\le4(W+r)C_u\delta^{-3}.
$$

Cauchy bounds control all integer derivative orders. For `ρ=q r_C`, the positive series

$$
\sum_{m\ge0}(m+1)^2q^m=\frac{1+q}{(1-q)^3}
$$

gives an explicit coefficient-norm bound. This is an analytic all-order argument with exact constants; it is not inferred from 17 plotted points.

**Exact input binding.** A numerical JavaScript `1e-8` represents the exact rational

$$
\frac{3022314549036573}{302231454903657293676544},
$$

which differs from the exact string `1/100000000`. The producer records the exact binary64 value, and the axis consumer must use the returned `parameterHExact`. A mismatch is rejected as `AXIS_H_MISMATCH`.

**Exponential enclosures.** BigInt rationals, positive Taylor sums with the explicit remainder, outward dyadic rounding, and repeated squaring produce bounds. `boundBits` is the dyadic grid parameter, not a claim that the final interval has that many significant digits. The finite Taylor remainder remains included.

**Verification and scope.** The baseline records Node **70/70** and independent Fraction/120-digit **306/306**. Negative controls detect omission of the Taylor tail, using only inner mass as a total upper bound, omitting complex-denominator loss, changing the pressure-derivative coefficient from 4 to 2, and deleting a positive mixed tail. The grade is `EXACT_RATIONAL_BOUNDS_WITH_ANALYTIC_THEOREM_ARGUMENT`; no new Lean instantiation of the full generated premise bundle is claimed.

**Remaining connection.** Prove that the pressure of the corrected exterior E equals this target for every η. Instantiate the generated analytic premises in Lean and connect the same input to the actual infinite axis and final gluing.

Evidence: [fixture](../mathscope-m1/navier/followup-construction/pressure-analytic-fixture.json), [validation](../mathscope-m1/navier/followup-construction/pressure-analytic-validation.json), [independent reference](../mathscope-m1/navier/followup-construction/pressure-analytic-independent.json), [complete original derivation](../mathscope-m1/navier/followup-construction/README_PRESSURE_ANALYTIC_KO.md).

```bash
node mathscope-m1/navier/followup-construction/pressure-analytic.verify.mjs
python3 mathscope-m1/navier/followup-construction/pressure-analytic-reference.py
```

## 6. Local axis bounds using that same A.21 pressure

**Construction.** The axis producer reruns the actual A.21 pressure producer from the same input, checks exact h identity, and derives the B_ρ, contraction, positivity, and infinite-tail bounds from its real/complex pressure bounds. Seven reused calculation sections of the rational-axis module are verified by source hashes. The public input does not accept an arbitrary mass, norm, Λ, log C, or truth flag.

Internally generated 256-bit rational bounds can exceed the size limit of a public input parser. They use an explicitly larger internal exact-rational path. This does not relax the public parser or authorize replacing exact large strings with floats.

**Verification.** Node **34/34**, independent Fraction/Bernstein/exponential comparisons **82/82**, and **4/4** negative controls are recorded. The exact default h, `1/400` self-map bound, and `16011107/61056000` positivity lower bound are traceable to their generated data. The rational default's four scalar Lean checks are not transferred automatically to this different A.21 instance.

**Remaining connection.** Connect the certified infinite fixed point to the same finite η jets and rounding error; prove the corrected-E pressure identity; instantiate the full A.21 analytic premises in Lean; and use the same global parameter choices in the final profile.

Evidence: [certificate](../mathscope-m1/navier/followup-construction/axis-source-default-certificate.json), [Node results](../mathscope-m1/navier/followup-construction/axis-source-test-results.json), [independent results](../mathscope-m1/navier/followup-construction/axis-source-independent-validation.json), [derivation](../mathscope-m1/navier/followup-construction/axis-source-derivation.json).

```bash
node --test mathscope-m1/navier/followup-construction/axis-source-certificate.test.mjs
python3 -B mathscope-m1/navier/followup-construction/verify-axis-source-independent.py
```

## 7. Actual C.12 modulation and first-patch restoration

**Construction.** The module applies C.12 to an explicitly positive annulus family. The actual C.1 loop and zero-mean C.11 primitives produce

$$
E_N=E\exp(\mathcal A/N),\qquad U_N=U+\mathcal B/N.
$$

It separately measures the small value change and order-one radial derivative change. Narrow cutoff regions receive dedicated integration and diagnostic subdivisions. The five moment errors caused by the actual modulation are computed and then restored with the nonlinear two-U/three-E bump map in the first patch.

The source `−WU` correction is applied here as well. Raw states, cumulative quantities, and the independent moment correction are not overwritten by a desired target.

**Verification.** The baseline records C.12 Node **57/57**, independent exact Fraction source-formula **1135/1135**, and independent 80-digit correction-map **74/74**. These check different facts; the 74 checks alone did not verify the original Ns transcription.

At `N=512`, all four sampled cone gaps are positive in **4294/4294** modulation samples and **65/65** restoration-patch samples. `N=256` has two failures near narrow cutoff locations. `N=8` exhibits actual violations. Those failures remain preserved rather than excluded from the presentation.

**Visualization.** Coordinates `(log X,η,N(E_N−E))` show the modulation as a function graph. They do not show a physical-space projection of a complete NS velocity field. The annulus example does not supply a regular Cartesian axis.

**Remaining connection.** Feed the same completed B.34/B.8 profile to C.12 and prove a uniform strict margin κ>0 over every `(X,η)`. The continuous derivative and integral enclosure, uniform first-patch interval Newton, and all-η restoration are not certified by the finite samples.

Evidence: [contract](../mathscope-m1/navier/followup-construction/source-radial-modulation-contract.json), [fixtures](../mathscope-m1/navier/followup-construction/source-radial-modulation-fixtures.json), [independent formula checks](../mathscope-m1/navier/followup-construction/c12-source-formula-independent.json), [independent correction](../mathscope-m1/navier/followup-construction/source-correction-independent.json).

```bash
node mathscope-m1/navier/followup-construction/test-source-radial-modulation.mjs
python3 mathscope-m1/navier/followup-construction/independent-c12-formula.py
python3 mathscope-m1/navier/followup-construction/independent-source-correction.py
```

## 8. Actual B.34/B.8 inner–outer moment gluing

**Upstream data.** The gluing routine starts at the actual corrected B.26 finite-axis endpoint. A caller cannot replace the endpoint or inject an arbitrary moment debt. The routine computes the B.34 logarithmic E transition and all five accumulated moments, applies the B.38 scale, restores G_i→4η on its specified interval, and calculates the debt that must be repaired.

The radius is preserved in signed-log form:

$$
\log X_R=\log X_i+10(\log C+\log P_*).
$$

The default example reaches approximately `X_R=exp(804.70048)`. Nonzero debt that cannot be represented in the chosen Newton coordinates produces `PRECISION_REQUIRED`; it is not rounded to zero and accepted.

**Five-dimensional correction.** The actual source block uses two U bumps and three E bumps:

$$
\delta U=c_0b_0+c_1b_1,\qquad
\delta E=c_2b_2+c_3b_3+c_4b_4.
$$

It builds the complete linear and quadratic moment map, the raw 5×5 Jacobian, the source block basis from A.3, a damped Newton iteration, and a separate 192-point reintegration. The moment-map rule uses 128 points. Omitting quadratic terms fails the original `1e-9` tolerance at all three η stencils.

**Default results.** The η stencils are `−2e-5,0,2e-5`. Their normalized residuals are approximately

$$
6.3817655\cdot10^{-13},\quad
6.8688394\cdot10^{-12},\quad
2.9137870\cdot10^{-10}.
$$

The center has **97/97 sampled** relaxed-cone checks passing. Node verification records **26/26**; independent 90-digit calculations record **691/691**. The checks include endpoint normalization, the transition, cumulative debt, quadratic map, Jacobian, block structure, and reintegration.

**Preserved failures.** The initial 32-point Gauss candidate failed **130 of 616** independent comparisons. The original tolerance was retained while quadrature and stable scaling were repaired. A larger-j₀ candidate produces actual Newton/cone failures. The `logP=14` source-pressure branch loses positivity in the current finite-axis approximation and is rejected as `INVALID_PROFILE`. That is a failure of this finite numerical construction, not a refutation of the source's infinite-axis theorem.

After a final inherited-property input guard was fixed, the full canonical input/result remained identical to the independently checked fixture. The final evidence-binding record documents that identity. It does not claim the 691 integrations were repeated for an input-only guard change.

**Critical scope condition.** The successful default uses `logP=0`, `j₀=1e-6`, `Λ=1024`, `logC=80`, and `T_sh=640`. It does **not** satisfy the paper's full large-amplitude hierarchy. The exact A.21 pressure/axis example uses `logP=14`; those are different inputs. Their separate successes cannot be assembled into one certified global witness.

**Remaining connection.** Certify the continuous moment integrals, uniform invertibility and interval-Newton/implicit-function inclusion over the same full η domain, the B.33/B.40 parameter hierarchy, and the finite-to-infinite-axis identification. Then attach C.12 and the stress/flatness proof to that same glued profile. The original N3-05 criterion therefore remains BLOCKED at v54.

Evidence: [contract](../mathscope-m1/navier/followup-construction/source-inner-gluing-contract.json), [fixture](../mathscope-m1/navier/followup-construction/source-inner-gluing-fixture.json), [Node checks](../mathscope-m1/navier/followup-construction/source-inner-gluing-tests.json), [independent checks](../mathscope-m1/navier/followup-construction/source-inner-gluing-independent.json), [failure history](../mathscope-m1/navier/followup-construction/source-inner-gluing-history.json), [final evidence binding](../mathscope-m1/navier/followup-construction/source-inner-gluing-final-evidence-binding.json).

```bash
node --test mathscope-m1/navier/followup-construction/source-inner-gluing.test.mjs
python3 mathscope-m1/navier/followup-construction/source-inner-gluing-reference.py
```

## What a combined certificate must share

The final object must bind the same source edition, pressure, h, axis, constant hierarchy, corrected exterior, accumulated moments, η domain, modulation, and stress. A certificate proved for one component is reusable only after its hypotheses and object identity are checked for that final object. [NS_GATES_EN.md](NS_GATES_EN.md) lists the exact unclosed acceptance conditions; a component's `COMPLETED` flag does not close them automatically.
