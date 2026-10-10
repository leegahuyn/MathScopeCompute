# Independent review: the new symbolic axial-stage proposal

## Conclusion

**No blocking mathematical defect was found in the updated, explicitly scoped
axial-stage claim.** The reviewed derivation establishes the actual relaxed
cone for the literal unedited reference axial stage at every
`eta in [-1,1]`, `y in [0,T]`, and constant `XR >= 128`, using that new
schedule's own A.21 pressure. The admissible cone is asserted only where
`v>2`. It remains unproved on the whole axial stage because `v=2` at eta zero
and wherever k' vanishes.

This is an analytic derivation supported by exact arithmetic and whole-cell
interval bounds. It is not a new Lean analytic theorem, a completed corrected
outer profile, a regenerated axis/joining chain, or a completed original
acceptance gate.

The initial version had two missing addition signs in the displayed Ns
identity. The owner repaired them and regenerated the source-bound record.
The owner also incorporated the terminal-wait and source-slope argument
developed during this review. Both issues are resolved in the revision below.

## Reviewed revision and execution

The read-only review targeted:

`mathscope-m1/navier/followup-20261010-outer-reselection/independent-axial/`

| File | SHA-256 |
| --- | --- |
| DERIVATION_EN.md | `8cc933c198f6fd762d8087706c3e62b4eff68dfee9e6dd7b758d57ab676e26a4` |
| verify_axial_bounds.py | `01538f853fff689e30e0837ec9705eb12ba3992aa3128b92972846f8007371e9` |
| independent-axial-certificate.json | `45e7069d5cf9a64cad81c8f728783e6536d31ffdd6d0660aa6e046f188108090` |

An in-memory call to the generator, with bytecode disabled and without
executing its file-writing main function, exactly reproduced the stored JSON:
**47/47 target checks passed**. The separate review program passed **16/16**
checks, including a distinct Laurent-polynomial expansion of the cone
identity and exact terminal-wait comparisons. It checked that the target
file hashes were unchanged by the review.

The unavailable optional SymPy module was not installed. The polynomial
identity was instead checked using a small independent exact Laurent ring
implemented with Python's standard-library Fraction type. This has no effect
on the reviewed code or its dependencies.

## Source correspondence

The original paper is the supplied edition with SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
The review read extracted pp.28–32, 129–136 and 155, including:

- The moment definitions and reconstructed Qs/Ns in 4.15–4.16.
- The actual relaxed/admissible cone definitions and Lemma 4.5.
- The literal step and radial stages in A.2/A.5–A.13.
- The unedited pressure definition and exact neutral-edit qualifications in A.21–A.23.
- The axial Q equation and sufficient ratio test in A.24–A.26.
- The normalized five-moment formula B.35.

The derivative interval implementation was read, including its endpoint
majorant, positive Taylor remainder, monotone reciprocal, and underflow-safe
upper endpoint. Its source hash is recorded by the target certificate.
The old binary64 outer producer's hash is a source reference: the new
expression-valued parameters are not falsely described as accepted numerical
inputs to that old producer.

## 1. Exact parameter definitions

The new proposal is

\[
M_d=2^{20},\quad T=e^{M_d}+10,\quad \log P_*=2T,\quad
\lambda=e^{-1000T},\quad h=e^{-8002T},\quad
c_o=1/256,\quad T_f=128.
\]

These are positive finite real expressions. In particular, T>11,
0<h<1/100, lambda<1/2, h<lambda/2, and h exp(T)<1/48 follow from the
elementary monotone exponential inequalities used in the certificate.
None of these values is replaced by an underflowed zero or an infinite
binary64 value. The proposal is different from the prior Md=1 datum.

These few inequalities are adequate for the present axial analysis; they
are not a verification of every later source smallness requirement involving
unquantified C_pre constants.

## 2. The step bound is over whole cells

For 0<t<=1/2,

\[
\sigma'(t)=\sigma(t)(1-\sigma(t))
\bigl(2t^{-3}+2(1-t)^{-3}\bigr).
\]

On the first endpoint cell the implementation uses

\[
\sigma'(t)\le4t^{-3}e^{4-t^{-2}}.
\]

This follows from 1/(1-t)^2<=4, (1-t)^(-3)<=t^(-3), and the exponential
upper bound for sigma(1-sigma). The logarithmic derivative of the majorant
is `(2-3t^2)/t^3`, positive on this collar. Thus its right-end value bounds
the whole cell. At t=0 the derivative is zero by the flat extension.

The other cells evaluate the exact derivative expression over interval
ranges, and sigma'(1-t)=sigma'(t) covers the other half of [0,1]. The
256-cell upper bound is below nine. No sampled maximum is used as a
supremum. Consequently `|k'|<=36/(Md(1+y))` is valid on the entire axial
stage, including both endpoints and the final eleven-unit zero-k portion.

## 3. Qstart and the lower bound for all eta

In A.25, L>=1-2h and the term `(D+4d) eta J0'` is nonnegative. Dropping
nonnegative terms gives the displayed conservative lower bound
`Qref >= (9/5-(29/5)h)/(8/5)>1`.

During the initial unit transition, the source is at least -h and
`1<=1+l<=8/5`. Variation of constants gives
`Qstart >= exp(-8/5)-h > 1/5-h >= 1/6`. The negative forcing is bounded
correctly: its positive integrating-factor weight is at most one.

With s=eta^2 and z=exp(-y), A.26 has source

\[
-h+2hk s+(D+dk)\frac{2s}{1+s}\ge-h+\frac{49}{100}s.
\]

The lower solution is therefore
`z/6+((49/100)s-h)(1-z)`. The four-corner argument is legitimate because
the comparison expression is affine separately in s and z. Before the h
loss it is at least `(s+z)/12`. Since h<=z/48, the result is at least
`s/12+z/16 >= (s+z)/16`.

No division by eta, d=1-eta^2, or z=0 is performed. In the actual finite
interval z>=exp(-T)>0, so Q is strictly positive at eta=0 and eta=±1 too.

## 4. Reference moments and the Ns bound

For the literal inner reference and axial stage, U=k eta and the radial
coefficient k is independent of eta. Hence M-eta M_eta=0 is an exact
identity of this reference field, not an assumed matching residual.
The weighted means satisfy 0<=kbar<=4 and 0<=kSquaredBar<=16, so
`W=1-L*kbar` has absolute value at most three.

The reference energy primitive divided by XE^2 is exactly

\[
R_E=e^{-3/5}(5/6+C)+y,\quad
C=\int_0^1e^{(6/5)t-(6/5)\int_0^t\sigma}\,dt.
\]

The inner integral contributes 5/6; the initial unit transition contributes
C; XE^2 is constant on the axial stage. Since C<exp(6/5)<4,
`0<=R_E<5+y`. The individual reference E^2 and U^2 primitives are not
asserted to be separately matched by an unconstructed replacement axis.

After the two addition signs were restored, the Ns expression agrees
exactly with 4.16/B.35:

\[
\frac{N_s}{E^2}=
\frac{-Wk\eta+4h\eta^3\overline{k^2}-2d\eta\overline{k^2}}{E^2}
+(-2h\eta-dJ_0')R_E
+4A\eta\frac{\Pi}{E^2}-d\frac{\Pi_\eta}{E^2}.
\]

There is no extra X under the -WU term. The geometric numerator is bounded
by `(12+64h+32)|eta|`. The energy term has coefficient at most
`(2h+2)|eta|`. The pressure terms have coefficient at most
`(2A+2)/(1-rho)^2`. Since `E^2>=exp(2T)>=exp(22)`, the three stated bounds
are respectively less than `|eta|`, `3|eta|(5+y)`, and `7|eta|`.
Their sum is below `(23+3y)|eta|<=24(1+y)|eta|`.

At eta=0 all these exact terms vanish, including Pi_eta by the explicit
even pressure integrand. Thus the factor |eta| is justified at the center,
not inserted by continuity from a punctured domain.

## 5. The unedited pressure tail really exists

The terminal waiting interval is an actual dependency of the infinite
backward pressure. The owner has now included its proof.

The profile-interpolation angular factor gives a slope loss at most
`9 log(2)/128 < 9/128 < 1/10`, as required in A.10.
For rho=h/256,

\[
0\le f_o'/f_o\le
\frac{9h}{512(1-h/256)}\le\frac{150}{8533}h<h/4.
\]

Consequently the terminal l lies in `[-h,-3h/4)`, so `0<1+l<1`.
The target Qp of A.13 is positive: its integrand is positive on a
nonempty open subinterval. Also

\[
0<Q_p<e^3\int_0^3f_o'/f_o
<27\frac{\rho}{1-\rho}\le\frac{900}{8533}h<1.
\]

The scalar Q defining the schedule starts at
`(lambda-h)/(1-lambda)>0`. Its source -l-h is nonnegative on the
transition to l=-1. On the hold of length `4 log(1/h)`, Q increases by
`4(1-h)log(1/h)`. The next unit flattening has a nonnegative source and
a linear coefficient at most one. Therefore

\[
Q_{\rm before}>\frac{4(99/100)8002(11)}3
=\frac{2904726}{25}=116189.04>Q_p.
\]

The wait `log(Qbefore/Qp)/(1-h)` is thus positive and finite. Its scalar
definition is independent of eta. The finite stages and the tail therefore
define a positive unedited E schedule, without assuming that the angular
moment correction has already been solved. Its pulse amplitude affects U,
not the E profile entering A.21.

All later unedited logarithmic E slopes obey the necessary decay bound.
The stated `(1-rho)^(-2)` tail factor is conservative; the checked terminal
slope condition even permits a stronger bound. The eta-dependent part is
f^theta with 0<=theta<=1 and stage lengths independent of eta. Differentiating
the pressure numerator contributes -2 theta J0' and gives the displayed
Pi_eta/E^2 bound. Both infinite-tail integrals converge without truncation.

An exact future pressure-neutral edit may be omitted before its support.
The reviewed document does not claim that the relevant correction roots
exist for this new proposal or silently set any computed residual to zero.

## 6. The ratio inequalities imply the actual cone

Combining the verified Q and Ns bounds gives
`|bs*w|<=768*(36/Md)=27/1024<1/32`. Also
`bs^2/a<=2*(36/Md)^2`, with a=2.

The independent Laurent-polynomial expansion gives identically

\[
2c^2-(v-2)j^2=(v/a)\delta,
\]

with exactly the c,j,v,delta definitions used by Lemma 4.5.
For a=2, v/a>=1, so the positive delta lower bound implies the stated
G lower bound. The bounds on c, v and G give the two actual amplitude
thresholds `86/21` and `4225/496`, both less than nine. At P>=9,
`Pc>max(2,v)` and the source cone polynomial has a positive margin.

Finally `p_s,1=XQ/L>=XR*e/16>XR/8`, because Q includes the exp(-y) lower
bound and L<=1. Hence XR>=128 is more than sufficient for P>=9.
This checks actual cone membership, rather than only the sufficient A.24
ratio inequalities.

The case v=2 is handled by the relaxed branch of Lemma 4.5. The document
correctly refuses to call it a strict admissible-cone certificate at every
axial point. No compactness of an unbounded parameter family is smuggled
into the proof: the explicit P threshold eliminates that dependence.

## Remaining scope

The reviewed assertion is limited to this new unedited reference axial
stage and its own pressure. It does not show that the pulse roots, corrected
angular moments, full exterior cone, heat replacement, new infinite axis,
same-source joining, global modulation or final stress have been completed.
It does not change the earlier actual Md=1 failure or the frozen published
English release.

Only this review directory was written. To reproduce its nonmutating checks:

```sh
python3 -B tmp/axial-reselection-review/review_checks.py
```

The owner incorporated the suggested repairs and additional analytic
dependency proof. This reviewer did not edit the target files or repository.
