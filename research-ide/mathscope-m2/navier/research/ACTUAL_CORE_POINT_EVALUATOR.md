# Actual nonlinear leading core at requested points

## Result and scope

`evaluateActualCorePoint` evaluates outward intervals for the **n=0 leading
nonlinear core** of the accepted `same-profile-2026-10-10.3` construction.
It evaluates the explicit resolvent comparison at the requested point, then
adds the positive, source-proved distance to the actual nonlinear fixed point.
It does not identify the comparison with that fixed point. It also encloses
the actual normalized axial correction and its radial average, including
ordinary eta derivatives through order two.

The source proof already gives a uniform real-eta displacement estimate.
The earlier comparison polynomial around eta=0 was a restriction of that
particular evaluator, rather than a restriction of the actual fixed-point
estimate. Re-evaluating the comparison at each center avoids extrapolating
that old polynomial. This program is a point evaluator. It is not an
interval-cell integrator, a global moment computation, or a completed
evaluation of the B26 cutoff/activation collar.

## API and exact coordinates

```js
evaluateActualCorePoint({
  Y: '4',
  eta: {kind: 'RHO_SCALED', value: '1/8'},
  radialOrder: 2,
  etaOrder: 2,
  bits: 192,
  degree: 48
}, {checkCancelled})
```

`Y` is an exact rational in `[0,41/10]`. The derivative orders are 0..2.
The arithmetic precision is 96..512 bits and comparison degree 32..64.
Exact rational inputs have a 4096-bit numerator/denominator budget; unsafe
machine numbers, extrapolation, unknown options and alternate profiles fail.

| Eta chart | Requested value | Actual eta |
|---|---|---|
| `RHO_SCALED` | rational in `[-1/4,1/4]` | value times rho |
| `J_SCALED` | rational in `[-1,1]` | value times j0 |
| `DIRECT_RATIONAL` | rational in `[-1,1]` | that exact rational |

The source definitions are `j0=h^4`, `sigma=j0/2000`,
`rho=j0^2/262144000000`, `K=exp(4T)`, `Q=2^260 K/sigma^2`,
`Lambda=Q^64`, with the source-selected amplitude unchanged. Elementary
source inequalities give `0<h<2^-4096`, `0<j0<2^-16384`,
`0<K^-1<2^-2048`. Their positive definitions remain in the result;
enclosing a tiny positive number by a dyadic interval with lower endpoint
zero does not define that parameter to be zero.

For nonzero direct rational eta, the exact ratio bound
`|j0/eta| <= 2^-16384/|eta|` is formed **before** fixed-precision rounding.
Thus a small exact eta never becomes a zero denominator. The input budget
implies `|eta|>=2^-4096`, so this ratio is at most `2^-12288`.

## Actual source and provenance

The result pins the assembly receipt, its parameter expression hash, the
actual pressure receipt, and these two arguments:

- `mathscope-m1/navier/followup-20261010-same-datum-axis/SAME_DATUM_ANALYTIC_AXIS.md`,
  SHA256 `1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920`.
  Equations (5), (14a), (16), (21), (22).
- `mathscope-m1/navier/followup-20261010-symbolic-gluing/PRESSURE_DATUM_INTERVAL.md`,
  SHA256 `8dfd40a7206871b425e69894ead0321fe6f476c338f0532739c1d055a920386d`.
  Equations (1), (2) and section 4.

These are arguments for the supplied original paper, SHA256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`,
with original Lean commit
`f9e8bc5b38b6e212696e8a30e3e91517af887bbd`. No new Lean theorem is asserted.
The test verifies the current bytes of all four pinned runtime sources.

## Pointwise comparison and its complete radial tail

Write `H=D eta+(1-eta^2)(4eta+j0)` and
`chi=H^2/(H^2+sigma^2)`. At the requested real point the program evaluates
the actual rational expression using outward interval jets, retaining the
small positive source parameters. In a j-normalized chart its expression is

`H/j0 = 1+(9/2-h)xi-j0^2 xi^2-4j0^2 xi^3`.

The explicit comparison is the entire series

`f0(Y chi) = sum_n (-chi)^n Y^n/[2^n n! (n+1)!]`.

For the normalized eta derivatives we require a complex bound at each
requested center, not an eta-zero Taylor extrapolation. On the circle
`|delta eta|=j0*10^-12` about any real eta in `[-1,1]`, the source polynomial
has `|H'|<30`. Consequently `|delta H|/sigma <= 60000*10^-12 = a`.
For real `H0`, the identity `2|H0|sigma <= H0^2+sigma^2` gives

`|H^2-H0^2|/(H0^2+sigma^2) <= a+a^2 = e`.

Therefore the denominator stays nonzero and
`|chi| <= (1+e)/(1-e) < 2`. This is a circle for the **explicit comparison**.
It is not asserted to be inside the much smaller analytic neighborhood
of the nonlinear fixed point. The exact rational inequality is independently
checked in Python.

At radial derivative order k, the absolute first omitted comparison term is

`Y^(N+1-k)/[(N+1-k)! (N+2)!]`.

Every later term ratio is at most
`r=Y/[(N+2-k)(N+3)]<1`; division by `1-r` covers the entire tail.
Cauchy's formula multiplies it by `m!*10^(12m)` for
`j0^m partial_eta^m`. This tail is explicitly retained in every Phi row.

## Positive nonlinear error, independent of display precision

The actual source has

`||(Phi,u)-(f0(Y chi),-Y Z*/(2L))|| <= 29 Q^-53`.

The real-eta coefficient-space evaluation estimate applies at every
eta in the source interval `I=[-33/32,33/32]`. For k,m up to two,

`29 Q^-53 rho^-m (m+k)! /[(m+1)^2 20^k (1-Y/20)^(m+k+1)]`

bounds the corresponding error. Using `rho^-1<=Q`, `Q>=2^260`,
`j0^m<=1` and `K^-1<=1` gives the positive exact rational upper bound
actually stored by this evaluator:

`29*2^(-260(53-m))*(m+k)! /[(m+1)^2 20^k (1-Y/20)^(m+k+1)]`.

This floor is added after the comparison summation; increasing `bits` does
not remove it. The only exact exception is the source axis identity
`Phi(0,eta)=1`, `u(0,eta)=0`. All eta derivatives of these constants vanish.
For other entries the nonlinear error remains strictly positive even when
its decimal display would underflow. The program keeps its exact rational.

## Actual pressure, axial correction and average

The source A.21 pressure satisfies on the whole horizontal strip
`|Im eta|<=1/16`:

`P/K = -cP/(1+eta^2)^2 + E`, with `|E|<2^-1400`.

The actual pressure receipt supplies `P(0)/K`. Negating that interval and
widening by `2^-1400` encloses the fixed `cP`. At every requested real center,
the error in the mth Taylor coefficient is bounded by `16^m*2^-1400`.
Thus the program evaluates actual `P/K` and derivatives through order three
by rational jets plus this analytic error. It never silently defines the
rational approximant to be the actual pressure.

The original expression

`Z*/K = K^-1[-A(1-2eta U*)U*-4H*] - d P'/K +4A eta P/K`

then gives the source reference `u_ref/K=-Y Z*/(2LK)`. The same positive
Banach error encloses actual `u/K` and its first two eta derivatives.
The radial average of the reference is exactly half the reference. The
average of the error is bounded by the same monotone-in-Y error envelope,
so `A_Y(u)/K` and its derivatives are enclosed as well.

Physical core reconstruction remains

`U=4eta+j0+(K/Lambda)(u/K)`;
`M/X=A_X(U)=4eta+j0+(K/Lambda)(A_Y(u)/K)`.

The result also encloses the restored values using the positive scale
`K/Lambda <= Q^-63 <= 2^-16380`. In the J/RHO charts the zeroth-order output
is `U/j0` and `(M/X)/j0`; there the correction scale is
`K/(Lambda*j0) <= 2^-16640`. This last inequality follows by inserting
`Q=2^260*4000000*K/j0^2` and using `K>1`, `j0<1`.
Ordinary eta derivatives of orders one and two keep their original scale.
For evaluation of core Omega this supplies U, U_eta, M/X, its eta derivative
and its second eta derivative, with exact symbolic restoration factors.

## Output and integration boundary

`phi.rows` contains the nine mixed intervals, their complete comparison
tail and positive nonlinear floor. `axial.rows` contains the three actual
normalized corrections and averages. `axial.actualValues` contains restored
intervals with explicit normalization. Every interval exposes rational
`lower`/`upper` and outward finite `displayEnclosure`; the latter is a
display projection, not the source value. A direct results job uses
`result.results.phi.rows[i]` as its source path.

`0<=Y<=4` is the unmodified original core. For `4<Y<=41/10` the program
evaluates the natural analytic continuation that serves as an input to B26;
it does not apply the actual cutoff or calculate the physical collar.
The exact g primitive, the actual nonlinear pressure correction, global
moment integrals, background positive-order corrections, global pulse
family and covariance still require their own computations. Those flags
remain false and the overall result remains PARTIAL.

## Validation

`node --test navier/tests/actual-core-evaluator.test.mjs` gives 14 passing
tests. One runs an independent Python `Fraction` verifier with 68 exact
checks: pressure derivatives, independent closed forms for the axial
reference, 80-term Bessel sums, and the comparison-circle inequality.
Zero-parameter limits used by that verifier are arithmetic enclosure test
points only; they never replace the fixed parameters in production.
Negative checks include a changed source profile, invalid domains/precision,
extra options, tiny rational denominators, a changed eta center near the
small-H point, source-byte drift, cancellation and replay. Precision changes
must leave both mathematical error budgets present.
