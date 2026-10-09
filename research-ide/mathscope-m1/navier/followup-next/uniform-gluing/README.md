# Continuous five-moment enclosures and source-dependent gluing

This follow-up implements **continuous integral enclosures and a uniform
implicit-function neighbourhood** for the actual five-bump moment maps in
Appendix B.8 and Appendix C.2. The earlier deployed implementation solved
sampled numerical systems and compared two quadrature rules. This directory
adds an arithmetic certificate for the continuous correction operator.

The original Navier–Stokes checklist is preserved. A certificate for the
correction operator does not establish the full leading profile. In particular,
the complete source-dependent derivative bounds, the outer pressure identity,
and the strict cone for the same final profile remain separate obligations.
Nothing in this directory is labelled a new Lean proof or a new full
Navier–Stokes solution.

## Files and reproducibility

| File | Purpose |
|---|---|
| `dyadic_interval.py` | Exact outward dyadic arithmetic, positive exponential series, rational roots and whole-cell flat-step bounds. |
| `certify_uniform_moment_map.py` | Continuous B.8 and C.2 coefficient enclosures and strict inclusion tests. |
| `uniform-moment-certificate.json` | Two complete map certificates, exact preconditioners, coefficient intervals and source hashes. |
| `verify_uniform_certificate.py` | Independent `Fraction` check of the finite inclusion inequalities, followed by independent 80-digit integration. |
| `uniform-moment-independent.json` | 126/126 independent checks for the two base certificates. |
| `test_uniform_moment_map.py` | Arithmetic, invalid input, overlapping support, singular weight, oversized radius/debt and false promotion controls. |
| `ideal_reference_bounds.py` | Exact B.35 ideal-field identities and source-dependent B.36 constants. |
| `bind_source_debt.py` | Recompute a smaller root ball from the source agent's all-eta analytic discrepancy bounds. |
| `certify_joining_rectangle.py` | Propagate the same source C1 bounds through all partial moments and B.35 over the complete joining rectangle. |
| `source-joining-rectangle-certificate.json` | Same-source whole-rectangle **relaxed** cone bounds. C.12's admissible cone is a separate obligation. |
| `source-bound-j0-original.json` | Preserved attempt with `j0=3/100`: moment inclusion succeeds, but its axial-shear bound is insufficient for B.36. |
| `certify_source_c2_map.py` | Recompute the C.2 operator for the actual source's much smaller, exactly represented lambda. |
| `source-radial-modulation-bounded-cache.mjs` | Isolated cache-only revision of the deployed C.12 calculation; production files are untouched. |
| `c12-eta1-endpoint-offline.json` | Actual endpoint calculation at eta=1, N=512 with an explicitly larger offline budget. This is still a sample, not a whole-domain certificate. |

From the repository root:

```bash
python mathscope-m1/navier/followup-next/uniform-gluing/certify_uniform_moment_map.py --panels 1024
python mathscope-m1/navier/followup-next/uniform-gluing/verify_uniform_certificate.py
python -m unittest discover -s mathscope-m1/navier/followup-next/uniform-gluing -p 'test_uniform_moment_map.py' -v
python mathscope-m1/navier/followup-next/uniform-gluing/ideal_reference_bounds.py
python mathscope-m1/navier/followup-next/uniform-gluing/bind_source_debt.py --source mathscope-m1/navier/followup-next/source-coherence/uniform-source-debt-small-j.json
python mathscope-m1/navier/followup-next/uniform-gluing/certify_joining_rectangle.py
```

The generator uses only the Python standard library. The independent numerical
cross-check uses the existing vendored mpmath copy. It does not import the JS
producer or reuse its Gauss nodes.

## 1. The normalization removes eta and amplitude from the operator

On a fixed correction patch let

\[
 E_0(x,\eta)=K(\eta)x^\alpha,\qquad U_0(x,\eta)=c(\eta),\qquad K(\eta)>0.
\]

For B.8, `alpha=1/10`, `K=Pstar/(1+eta^2)`, and `c=4eta`. For C.2,
`alpha=-1/2-lambda` and `c=0`. Five nonnegative smooth bumps have ordered,
pairwise disjoint supports. The first two perturb U and the final three
perturb E:

\[
 \delta U=K(v_0b_0+v_1b_1),\qquad
 \delta E=K(v_2b_2+v_3b_3+v_4b_4).
\]

Apply the following change of units to changes in the five source moments:

\[
 (\Delta M,\Delta I,\Delta J,\Delta S,\Delta C_p)
 \longmapsto
 \left(
 \frac{\Delta M}{K},
 \frac{\Delta J-c\Delta I}{K^2},
 \frac{\Delta I}{K},
 \frac{\Delta S-2c\Delta M}{K^2},
 \frac{\Delta C_p}{K^2}
 \right).
\]

The resulting map is exactly `A v + Q(v)`. Its coefficients do not depend on
eta, K or c. The two linear U rows have weights

\[
 1,\quad \sqrt 2\,x^{\alpha+1/2},
\]

and the three linear E rows have weights

\[
 \sqrt 2\,x^{1/2},\quad -x^\alpha,\quad x^{\alpha-1}.
\]

The only quadratic entries are

\[
 Q_S=\sum_{j<2}v_j^2\int b_j^2
       -\frac12\sum_{j\ge2}v_j^2\int b_j^2,
 \qquad
 Q_{C_p}=\frac12\sum_{j\ge2}v_j^2\int\frac{b_j^2}{x}.
\]

All mixed products vanish because the supports are actually disjoint. The code
rejects overlapping supports before using this identity. It also rejects
coalescing powers, including lambda=0 in the C.2 U block. No bound uniform as
lambda tends to zero is asserted.

The B.8 support endpoints are exactly the dyadic numbers published in the
deployed fixture. They lie strictly within `exp(-6)<x<exp(-5)`, checked using
outward exponential bounds. Thus this is an explicit continuous bump operator
at well-defined real endpoints, not a matrix attached to unspecified geometry.

## 2. Continuous integrals are enclosed by positive measures

The flat step is the same one used by the existing code:

\[
 \sigma(t)=\frac{e^{-1/t^2}}
 {e^{-1/t^2}+e^{-1/(1-t)^2}},\quad 0<t<1,
\]

extended by 0 and 1. Write `x=a+w*t`. For the B.8 convention
`b(x)=sigma'(t)`; for the C.2 convention `b(x)=sigma'(t)/w`.

The linear integral is evaluated against the positive measure `d sigma`:

\[
 \int_a^{a+w}g(x)b(x)\,dx
 =wf\int_0^1g(a+wt)\,d\sigma(t),
\]

where `f=1` or `f=1/w` accounts for the bump convention. On each closed cell,
the exact range of the weight is multiplied by the interval enclosing
`sigma(right)-sigma(left)`. Summing these products encloses the entire
continuous integral. For a squared bump, use

\[
 \int b^2g\,dx=w f^2\int\sigma'(t)g(a+wt)\,d\sigma(t).
\]

The endpoint cells use analytic derivative majorants. For `0<t<=b<=1/2`,

\[
 0\le\sigma'(t)\le4t^{-3}e^{4-t^{-2}}
                  \le4b^{-3}e^{4-b^{-2}}.
\]

The last inequality follows by differentiating the majorant. A corresponding
bound for the second derivative is
`(16*b^-6+12*b^-4)*exp(4-b^-2)`. Reflection handles the other endpoint. The
remaining cells use the differentiated formula with outward interval
operations. No derivative is sampled and then treated as a supremum.

Every endpoint is an integer divided by `2^88`. Addition, multiplication and
division use integer floor and ceiling. Rational roots use exact integer root
comparisons. `exp(-x)` uses a positive Taylor series with its geometric
remainder, range reduction, and repeated interval squaring. For `x>=88`,
`exp(-x)<2^-88` follows from `e>2`; this produces a nonzero upper bound rather
than treating the quantity as mathematical zero.

The exact mass `integral b = w*f` is separately inserted from the fundamental
theorem of calculus. This also guards against the unresolved bump mass problem
that affected the earlier 32-node numerical rule.

## 3. A uniform, nonlinear inclusion proof

Split the normalized variables into U variables `u` and E variables `e`.
The first two equations are linear:

\[
 A_Uu+d_U=0.
\]

Let the displayed exact rational preconditioners be `R_U` and `R_E`. The
certificate encloses the norms

\[
 z_U=\|I-R_UA_U\|_\infty<1,\quad
 z_E=\|I-R_EA_E\|_\infty<1.
\]

Consequently each linear block is invertible. If
`||R_U d_U|| <= beta_U` and `beta_U+z_U*r_U<r_U`, the unique U solution is in
the certified U ball.

With this U fixed, solve the remaining equations by the fixed-point map

\[
 T(e)=-R_Ed_E+(I-R_EA_E)e-R_EQ_U(u)-R_EQ_E(e).
\]

The enclosures produce constants `B_U` and `B_E` for the two preconditioned
quadratic maps. The strict inequalities checked with exact arithmetic are

\[
 \beta_E+B_Ur_U^2+z_Er_E+B_Er_E^2<r_E,
 \qquad z_E+2B_Er_E<1.
\]

These establish existence and uniqueness by contraction. The full 5 by 5
Jacobian is block lower triangular. The E block remains invertible throughout
the ball because the same bound is below one. This supplies the finite
implicit-function condition on the actual continuous moment map.

For the two base certificates:

| Map | U inverse residual | E inverse residual | E contraction upper bound |
|---|---:|---:|---:|
| B.8, alpha=1/10 | 0.000366902 | 0.014825385 | 0.187609677 |
| C.2, lambda=1/5 | 0.000638670 | 0.025646999 | 0.603474001 |

The B.8 certificate applies for all positive amplitudes, including `Pstar=e^14`.
The small-lambda source C.2 certificate is recomputed separately. A result for
lambda=1/5 is never transferred to the source's lambda near 1/5000.

If the same normalized discrepancy is smooth in eta and satisfies these bounds
on all of `[-1,1]`, the roots are smooth on this interval. For the first two
derivative orders, with `beta_Uj=||R_U d_U^(j)||` and
`beta_Ej=||R_E d_E^(j)||`, valid bounds are

\[
 u_1\le\frac{\beta_{U1}}{1-z_U},\qquad
 e_1\le\frac{\beta_{E1}+2B_Ur_Uu_1}{1-q_E},
\]

\[
 u_2\le\frac{\beta_{U2}}{1-z_U},\qquad
 e_2\le\frac{\beta_{E2}+2B_U(u_1^2+r_Uu_2)+2B_Ee_1^2}{1-q_E}.
\]

The inputs to these formulas must be real uniform derivative bounds. Three
finite-difference samples do not supply them.

## 4. Same-source binding and a detected missing tolerance

`bind_source_debt.py` consumes the source-dependent analytic bound chain from
`../source-coherence`. Its source SHA, axis-certificate SHA and moment-map SHA
are checked before using the raw discrepancy bounds. It independently
recomputes the matrix-weighted bounds and chooses a tighter root ball.

The first source-dependent run with `logP=14,j0=3/100` successfully places the
all-eta C0 bound in the continuous map neighbourhood. It gives U radius about
`3.88261e-6`, E radius about `8.17904e-8` and E contraction about `0.0152965`.
These estimates refer to the source agent's exact function-defined analytic
axis and continuation, not the older Float64 arrays.

Checking the original B.36 tolerance exposes another requirement. Direct
substitution in B.35 gives

\[
 W_0=-3+8h\eta^2,
\]

\[
 Q_{s,0}=\frac98-\frac58h+2h\eta^2+
 \frac54\frac{\eta^2(D+4d)}{1+\eta^2},
\]

and

\[
 N_{s,0}=\eta[-20+32(1+h)\eta^2]+4A\eta\Pi_0-d\Pi_{0,\eta}
 +K^2x^{1/5}\eta\left[5+\frac{25h}{3}+
 \frac{25d}{3(1+\eta^2)}\right].
\]

These identities have 180 exact rational substitution checks against the
original cumulative-moment formula, using arbitrary pressure value and
derivative inputs. The source pressure bounds then give, on the ideal joining
rectangle, `Qmin>1.12499999`, `emin>270182`, and a valid conservative
`wStar<120081081`. Thus B.36 asks for
`|bs| <= 8.32771e-10`. The first `j0=3/100` bound only proves
`|bs| <= 0.0205762`. This is an insufficiency of that bound, not a proof that the
actual cone fails. It is retained in `source-bound-j0-original.json` and forces
a smaller j0 in the original order of parameter choices.

Even once the radial shear tolerance is met, the Qs and Ns tolerance depends on
uniform eta derivatives of the same moments and fields. That obligation is
explicitly represented and is not inferred from C0 inclusion.

### The revised source choice and the complete joining rectangle

The revised source bound uses the same A.21 pressure with `logP=14`, followed
by `j0=1e-10`, a newly selected source-axis Lambda, and explicit small
continuation transitions. The source agent supplies C0 and C1 bounds on the
entire eta interval, derived from that exact function-defined profile. The
map binder records its hash and recomputes the bounds independently:

| Quantity | Verified upper bound |
|---|---:|
| `||R_U d_U||` | `1.280919e-14` |
| `||R_E d_E||` | `1.791833e-28` |
| U root radius | `1.294203e-14` |
| E root radius | `9.087818e-25` |
| E contraction | `0.014825385` |
| Axial shear on the correction supports | `6.858720e-11` |

The first derivative of the **same** root is bounded using the differentiated
implicit equation above. The continuous map has fixed-sign weights in every
nonzero entry. Each partial integral inside a bump is therefore bounded by the
absolute value of the full-support integral. Adding those bounds to the source
discrepancy bounds controls every radial prefix, including its eta derivative.

If `g=(g0,g1,g2,g3,g4)` denotes the normalized block moment error, the original
errors are recovered by the exact formulas

\[
 \Delta M=Kg_0,\quad\Delta I=Kg_2,\quad
 \Delta J=cKg_2+K^2g_1,\quad
 \Delta S=2cKg_0+K^2g_3,\quad\Delta C_p=K^2g_4.
\]

Their eta derivatives use `|K'/K|<=1`, `|c|<=4`, and `c'=4`. Substituting
these errors into B.35, with the unchanged pressure datum Pi0, yields outward
bounds throughout

\[
 (\log x,\eta)\in[-8,-5]\times[-1,1].
\]

The denominator `x*sqrt(2x)*E` is bounded below on this rectangle. The exact
arithmetic propagation gives

| Quantity on the entire joining rectangle | Bound |
|---|---:|
| `|Qs-Qs0|` | `< 1.012226e-6` |
| `|Ns-Ns0|` | `< 1.504164e-6` |
| E | `> 270182` |
| Qs | `> 1.12499898` |
| `G=Qs-bs*Ns/(a*E)` | `> 1.11341707` |
| `v=a+bs^2/a` | `< 1` |
| Pc | `> 8.2271` |

The Pc bound uses only `XR>=exp(10)`; the actual source XR is much larger and
is never rounded to Infinity. Since `v<1` and `Pc>2`, the strict relaxed-cone
inequalities hold across this entire rectangle, conditional on the explicit
source analytic bound chain. This is stronger than sampling the corrected
field at three eta values.

This result concerns the restored and moment-corrected joining rectangle.
The preceding activation and B.34 intervals, the completed outer field and
its pressure identity, and C.12's conversion to an admissible cone with `v>2`
remain outside this certificate. The generated analytic premise bundle has
not received a new Lean proof, and the original v54 Float64 arrays are not
identified with this exact function-defined source profile.

The final validation file records **23/23** tests. Its checks include 1,000
deterministic exact rational arithmetic controls, the 180 B.35 identity
controls, and 60 exact rational prefix perturbations with an independently
integer-certified enclosure of sqrt(2). The continuous coefficient comparisons
are **126/126** for the two base maps and **63/63** for the separate
source-lambda C.2 map. These counts are not counts of completed original IDE
acceptance criteria.

## 5. Actual C.12 computation outside eta=0

The unmodified deployed C.12 engine reaches its 100,000-family cache limit on
the trial `eta=[-1,0,1], N=512`. An isolated cache-only revision avoids retaining
zero loop families and keeps at most 8,192 nonzero families with deterministic
eviction. All non-instrumentation output fields are byte-identical to the old
engine on the N=8 parity control; its genuine cone violations are preserved.

The larger offline trial `eta=1,N=512` completes with 424,082,932 charged
operations in about 14 seconds. It reports 4,294/4,294 passing modulation
samples and 65/65 passing patch samples, with the smallest displayed strict
gap about 0.00475160. The production API's operation budget is not changed.
Intermediate cache-limit and budget-limit outcomes are preserved.

This makes a previously failing endpoint computation executable. It does not
establish the cone between samples, the complete eta interval, or C.12 on the
same full analytic source profile. Those claims remain false in the output.

## 6. A quantitative loop over every phase of the joining rectangle

`source-joining-loop-certificate.json` advances C.1 for the same analytic
source. It chooses explicit normalized loop constants using the integral
definition of the Bessel mean and obtains strict margins for every point of
the whole joining rectangle and every auxiliary phase. All **19/19** exact
scalar inequalities pass. Its independent verifier passes **13/13** rational
controls, including rejected false completion flags and a zero-margin
mutation. Separate 200-digit Bessel calculations pass **43/43** diagnostic
comparisons; those numerical comparisons do not replace the analytic bounds.

The actual source's radial scale is removed by `d0=XR*dbar` and
`mu=mubar/XR`. A single explicitly bounded root interval works for every
`p_s,2/XR`, including zero. The conservative choices yield
`deltaL ~= 1.13e-202`, `aL >= 3.61e-191`,
`(Pc-v)/XR >= 7.5e-5`, and the quadratic cone gap divided by `XR^2`
at least `1.09e-8`. Exact fractions preserve the strictly positive value of
`v-2` even though binary64 would round this particular v to 2.

`JOINING_LOOP.md` derives these bounds, the exact prescribed shear means,
and the resulting C.12 **value** estimates `|EN/E-1|<=4/N` and
`|UN-U|/E<=1/N` for every integer `N>=4`. It also specifies the remaining
slow derivative, moment, radial collar, and global interval inputs needed
before one can choose a source-wide finite frequency. This local C.1 loop
is not yet extended to a single global C.12 construction.

Reproduce these additional results with:

```sh
python3 navier/followup-next/uniform-gluing/certify_joining_loop.py
python3 navier/followup-next/uniform-gluing/verify_joining_loop.py
```

## 7. Refined source, slow derivatives, and the joining contribution

The current refined datum and the final joining contribution are described
in `JOINING_SLOW_BOUNDS.md`. The `source-final-*` artifacts use source SHA
`ac79c8268a501f9762b5f13f6efe114809a94e568efc614e2fd66ceae4303c7a`.
The two earlier source histories remain preserved under their previous names.

The new exact bounds include the same implicit root's second eta derivative,
the actual flat shape's first three derivatives, all required joining-field
eta/log-radius derivatives, and the loop's slow derivatives. A finite
symbolic local frequency `ceil(exp(T+3853))`, with exact
`T ~= 1.4659275904e72`, makes this rectangle's generated error contribution
fit a directly verified four-component cone tolerance. The required incoming
moment C1 bound is approximately `3.8495351560e-619`; it remains an explicit
open condition. No incoming moment is assigned zero.

The final bound producers pass **9** root, **11** rectangle, **19** loop,
**10** slow-bound, and **12** frequency-contribution scalar checks.
The added independent C2/frequency verifier passes **25/25**, including
rejected zero-bound, incorrect-frequency, and false-global-completion
mutations. Its **39** 100-digit shape derivative comparisons and the loop's
**43** Bessel comparisons remain numerical diagnostics. The complete
original interval, one compatible global loop, the actual incoming C12
moments, and the source patch restoration are not certified by these counts.

`source-binding-contract.json` fixes the exact domains, both radial
normalizations, the common pressure datum, and the outstanding tail and
incoming conditions. `file-manifest.json` records all files in this directory,
excluding itself and generated bytecode. Rebuild this handoff record with
`python3 navier/followup-next/uniform-gluing/build_handoff.py`.

## 8. The same Md=1 outer candidate is now proved unsuitable globally

The subsequent outer check found an actual required-cone failure in this
preserved common datum. At `eta=3/4` and axial `y=sqrt(e)-1`, the independent
`outer-uniform/axial-midpoint-certificate.json` encloses
`Pc/XR` between approximately `-143.31275` and `-141.61251`.
An independent proof in `verify_outer_counterexample.py` uses ODE barriers
and only the known positive remainder of the axial pressure integral,
without quadrature or an assumed tail value. Its **14/14** exact rational
checks already imply `Pc<0` for every positive XR.

This violates the necessary relaxed condition `Pc>2` for the actual
prescribed profile. The original global C.1/C.12 route cannot be completed
with this fixed Md=1 candidate by increasing XR, Lambda, or the frequency.
A new compatible outer parameter hierarchy is required. The existing
joining certificates and local finite-frequency contribution retain their
stated domains and input bindings; their global-completion flags remain
false. No historical source certificate or acceptance criterion was changed.

`OUTER_CANDIDATE_FAILURE.md` gives both computations, their source formulas,
and the precise distinction between the invalid global candidate and the
valid local certificates. This is not a refutation of the paper's
existential construction or a general Navier–Stokes assertion.

## Source

The governing formulas are the user-supplied `01-navier-stokes.pdf`, SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`:
equations (4.15), (4.16), (B.35)–(B.40), Lemmas A.1–A.2, Corollary A.3,
Proposition B.8 and Proposition C.2. This directory contains original
implementation and derivation, not a copy of the paper.
