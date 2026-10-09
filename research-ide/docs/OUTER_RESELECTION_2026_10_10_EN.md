# Quantitative replacement of the rejected outer candidate

This dated follow-up keeps the original acceptance criteria and v54 bytes
unchanged. It develops a new outer candidate after the rigorous failure of
the former `Md=1, logP=14` candidate. It does not supply a complete new
inner–annulus–exterior profile.

## 1. Why a new parameter choice was necessary

The [earlier counterexample](FOLLOWUP_2026_10_10_EN.md) enclosed a strictly
negative `Pc/XR` at an interior point of the old outer candidate. The
required cone has positive parallel stress. Increasing `XR` cannot repair
that sign. The separate fixed-`logP=14` audit also rejected every allowed
`0<Md<log(4)` in that family. These are preserved failure records.

The replacement uses exact positive real expressions:

\[
M_d=2^{20},\quad T=e^{M_d}+10,\quad \log P_*=2T,\quad
\lambda=e^{-1000T},\quad h=e^{-8002T},\quad
c_o=1/256,\quad T_f=128.
\]

The [expression tree and exact scalar checker](../mathscope-m1/navier/followup-20261010-outer-reselection/check_outer_envelopes.py)
retain these expressions symbolically. `lambda` and `h` are strictly
positive, finite real numbers. Neither is evaluated as a binary64 zero.
The 106 scalar checks use rational arithmetic, analytic exponential
envelopes and the conservative bound `T>=128`. They do not construct a
decimal expansion of `exp(T)`.

This symbolic parameter path is separate from the preserved browser and
Worker examples. The earlier numerical producer's supported ranges are
unchanged. It has not produced a new axis or global visualization for
these enormous parameters.

## 2. The specified outer functions and exact moment equations

The [complete derivation](../mathscope-m1/navier/followup-20261010-outer-reselection/OUTER_DERIVATION.md)
uses A.2–A.31, formulas 4.15–4.16 and Lemma 4.5 from the supplied paper,
whose SHA-256 is
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.

The order of construction is explicit:

1. Integrate the prescribed logarithmic slope to define the unedited
   radial schedule `E`.
2. Select the two angular correction coefficients from their actual
   continuous equations. The correction resets `I` and has exactly zero
   pressure increment. Positivity follows from a strict small-ball bound.
3. Select the finite terminal wait from the actual positive A.13
   integral. The entire future `E` is now fixed independently of the pulse
   amplitude.
4. For each pulse amplitude, solve the two exact linear equations `M=J=0`.
   Select the amplitude as the unique root of the actual total-`S`
   equation on `[0.9,1.2]`. Its derivative with respect to amplitude is
   bounded below by `0.35`.
5. Use this schedule's own A.21 pressure. The pressure-neutral edit does
   not change that datum. No pressure from the old axis certificate is
   substituted.

These are definitions through continuous integrals and separated roots.
An approximately zero sampled residual is never substituted for an exact
moment equation. The full-eta estimates apply to `-1<=eta<=1`.

## 3. An actual continuous pulse integral

For the specified smooth pulse `R0`, the new code encloses

\[
K_b=\int_0^{11}e^{-2\xi}R_0(\xi)^2\,d\xi.
\]

Each of its two non-polynomial collars is covered by 2,048 complete
integration cells with outward dyadic bounds. The intervening
polynomial–exponential integral has an explicit antiderivative. The
identity `sigma(1-t)=1-sigma(t)` proves the exact half integral used to
join the pieces; it is not inferred from a quadrature sample.

The [outward certificate](../mathscope-m1/navier/followup-20261010-outer-reselection/actual-main-pulse-integral.json)
gives, with displayed decimal endpoints rounded outward,

\[
0.24504961919738<K_b<0.24504962120574.
\]

Combining this interval with the written uniform total-`S` error bound
`2^-200` encloses the exact amplitude for every eta:

\[
1.01005026419360<A(\eta)<1.01005026833263.
\]

That amplitude statement depends on the continuous total-`S` derivation.
The independent 70-digit Gauss–Legendre calculation is a diagnostic
agreement check; it is not the source of the rigorous integral enclosure.
The archived exact dyadic endpoints, rather than the displayed decimals,
are used by the endpoint verifier.

## 4. Domain, cone bounds and formalization

The independent axial argument covers every eta and the entire axial
stage. It gives `Q>0`, an actual relaxed cone for `XR>=128`, and the
explicit stress threshold `p_s1>=9` for its normalized constant box.

The subsequent written estimates cover the specified outer schedule from
`X/XR=exp(-8)` through terminal local coordinate `y=1/2`, the finite A.4
interval. The common sufficient constants are

\[
c_{\min}=1/3,\quad c_{\max}=2259,\quad V=116,\quad G_{\min}=1/4.
\]

The scalar threshold is `p_s1>=2^24`; the radial requirement `XR>=2^40`
suffices for the stated stage bounds. This includes the size of the
actual stress, in addition to the normalized ratio conditions.

The stronger admissible cone additionally requires `v>2`. In the axial
stage `eta=0` or zero axial derivative gives `v=2`, so that stage's general
claim is the relaxed cone. This distinction is retained in the
[conditional Lean statements](../mathscope-m1/navier/followup-20261010-outer-reselection/formal-cone/README.md).
Their analytic field estimates are explicit hypotheses; checking these
statements does not prove that a new infinite profile satisfies those
hypotheses. All seven statements actually compiled with exit code 0 on
the original pinned rc2 kernel at 2026-10-09 20:59:35 UTC. Their seven
axiom audits contain only `propext`, `Classical.choice` and `Quot.sound`.
The original source and kernel bytes were unchanged. The dated
verification report records that execution separately from the full
default build and the protected Comparator.

The independent reviews distinguish their written continuous arguments
from finite arithmetic checks. The 106-check producer's historical flag
that its independent review was not yet complete is preserved. The later
review receipts identify the exact reviewed bytes; they do not rewrite
that earlier observation.

## 5. What remains for the original seven construction gates

This replacement does not reuse the old datum's certificates as if their
pressure and parameters had changed. A complete new source chain still
needs all of the following:

- The same new A.21 datum in the infinite B.2 fixed point, invariant ball,
  contraction estimates, finite jet, truncation and roundoff bounds, and
  the relevant Lean premises.
- The same source's core identities, Cartesian axis regularity and
  controlled continuation.
- Its actual incoming five-moment discrepancy in the B.8 joining map,
  with whole-eta inclusion and derivative bounds. Earlier B.8 results
  retain their earlier source and rectangle.
- One finite C.12 frequency with a strict cone and restoration on the
  entire final domain, including the regions outside the local joining
  rectangle.
- The A.7 heat-exterior compensation that restores the same pressure,
  disjoint reserved patches, and the final stress support, flat
  factorization and endpoint limits.

In particular, original N3-02 includes the heat replacement and its
pressure compensation. A pressure-neutral A.4 correction alone cannot
close that criterion. N3-01 through N3-07 therefore retain their original
open statuses in this follow-up. The new outer functions and verified
bounds are useful components of that unfinished source chain.
