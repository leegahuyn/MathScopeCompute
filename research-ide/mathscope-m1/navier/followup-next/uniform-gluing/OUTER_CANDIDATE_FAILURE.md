# The preserved Md=1 candidate fails the actual outer cone

## Conclusion

The common refined source datum, SHA-256
`ac79c8268a501f9762b5f13f6efe114809a94e568efc614e2fd66ceae4303c7a`,
uses `Md=1` and `logP=14`. Its prescribed A.2 outer profile has an actual
point where `Pc<0`. The original relaxed cone requires `Pc>2`. Consequently
this particular candidate cannot supply the global input for the original
C.1/C.12 construction, for any choice of positive radial scale XR.

This is a necessary-condition failure of the prescribed field, rather than
the failure of a conservative sufficient test. It does not contradict the
paper's existential choice of sufficiently large Md. It also does not
invalidate the interval certificates, implicit root, or local joining
estimates on their separately stated domains.

The source parameters, all previous JSON evidence, and the original
acceptance snapshot are preserved. The global construction needs a new
compatible outer parameter hierarchy; increasing Lambda, the inner amplitude,
XR, or the modulation frequency while keeping this outer profile does not
remove the failure of its required starting cone.

## Two independent computations

The `outer-uniform` implementation evaluates the actual continuous first-stage
and axial integrals with 256 cells and outward dyadic arithmetic. Its
`axial-midpoint-certificate.json` encloses

| Quantity at the same point | Outward interval, displayed approximately |
| --- | --- |
| Qs | `[1.7407967080, 1.7492319203]` |
| Ns/E² | `[-2.0036305684, -1.9999438556]` |
| bs*w | `[33.2862144, 33.5091637]` |
| Pc/XR | `[-143.31275, -141.61251]` |

The independent `verify_outer_counterexample.py` in this directory uses
neither that quadrature code nor its pressure-tail upper envelope. It proves
the negative sign with ODE barriers, the positive pressure integral on the
remaining exact axial segment, and exact rational bounds. Its **14/14**
checks give the coarser but sufficient conclusions

$$
N_s/E^2<-1.16942856,\qquad b_sw>9.35542849,
\qquad a-b_sw<-7.35542849,\qquad P_c/X_R<-2.45180949.
$$

The executable output stores exact fractions; the decimals in this note are
for display. Neither computation asserts a new Lean theorem or a general
Navier–Stokes result.

## 1. The actual source point

Take `eta=3/4`. In the local logarithmic coordinate of the axial transition,
choose

$$
y_* = \sqrt e-1,\qquad \log(1+y_*)/M_d=1/2.
$$

The global coordinate is `log(X/XR)=sqrt(e)`. The exact A.5 symmetry gives
`sigma(1/2)=1/2` and `sigma'(1/2)=8`. Therefore

$$
k=2,\quad k'=-32/\sqrt e<-16,\quad a=2,\quad
E^2=f^2\exp(28-2/5-y_*),\qquad f=16/25.
$$

The first transition contributes exactly `-1/5` to `log(E/(P*f))` because
the total integral of sigma on `[0,1]` is `1/2`. A finite positive Taylor
sum with a geometric remainder proves `2<e<4`. Hence `y*<1` and
`E²>f²*2^26`.

## 2. Positive Qs with an upper barrier

At this fixed eta, write

$$
C_\eta=-h(1-8\eta^2)+(D+4d)\eta J_0',\qquad a_0=4L-1.
$$

The ideal starting Q from A.25 lies between one and three. During the first
transition its equation is

$$
Q'+(1+l)Q=a_0l+C_\eta,\qquad l\ge0.
$$

Here `a0>1`, `Ceta>1`, `a0<3`, and `Ceta<3`. The vector field points
inward at both Q=1 and Q=3. During the following axial transition,

$$
Q'+Q=c_0+c_1k,\quad
c_0=-h+D\eta J_0'>1/3,\quad
c_1=2h\eta^2+d\eta J_0'>0,\quad c_0+4c_1<3.
$$

Since `0<=k<=4`, it follows that `1/3<Qs<=3` at the witness. Every one
of these comparisons is checked against the exact source h, including its
original binary64 rational value.

## 3. A pressure bound from a positive partial integral

The remaining axial segment has length

$$
T_d-y_*=e+11-\sqrt e>11.
$$

On that segment the square of E decays exactly as `exp(-s)`, and its eta
factor remains f. The A.21 pressure datum and the matching forward pressure
integral therefore imply

$$
\Pi/E^2\le-\tfrac12(1-2^{-11}),\qquad
\Pi_\eta/E^2\ge J_0'(1-2^{-11}).
$$

For positive eta, all later unedited pressure derivative contributions have
nonnegative sign, because the angular exponent theta is in `[0,1]`.
Only a known positive part of the exact pressure integral is retained; no
tail is approximated by zero. Future pressure-neutral corrections can be
omitted from this backward integral before their support, as specified after
A.23. Exact B.8 moment matching keeps this same pressure at the outer point.

## 4. The sign of Ns and the necessary cone condition

Let `kbar` and `kSquaredBar` denote the reference primitive averages of the
axial coefficient and its square. They lie in `[0,4]` and `[0,16]`. Thus
`W=1-L*kbar` has absolute value at most three. The reference energy primitive
ratio `R_E` is nonnegative. These separate reference primitives are a
convenient calculation of S and its derivative; they are **not** asserted
to be separately matched physical U² and E² integrals of the new axis.
It is the S combination, with the other four moments, that B.8 matches.

Substitution into B.35 gives

$$
\frac{N_s}{E^2}=-\frac{Wk\eta}{E^2}
+4h\eta\left(\frac{\eta^2\overline{k^2}}{E^2}-\frac{R_E}{2}\right)
-d\left(\frac{2\eta\overline{k^2}}{E^2}+J_0'R_E\right)
+4A\eta\frac{\Pi}{E^2}-d\frac{\Pi_\eta}{E^2}.
$$

Drop only nonpositive terms and insert the preceding bounds:

$$
\frac{N_s}{E^2}\le
\frac{9/2+27h}{f^2 2^{26}}
-(2A\eta+dJ_0')(1-2^{-11})<-1.
$$

Since both k' and Ns are negative,

$$
b_sw=\frac{2k'\eta\,(N_s/E^2)}{Q_s}>8.
$$

Finally `a=2` and `p_s,1=XQs/L>0`, so

$$
P_c=p_{s,1}\left(1-\frac{b_sw}{a}\right)<0.
$$

This directly violates the necessary relaxed-cone condition. Scaling XR
multiplies the negative Pc by a positive factor and cannot change its sign.

## Reproduction

```sh
python3 navier/followup-next/uniform-gluing/verify_outer_counterexample.py
```

The source formulas are A.2 and A.5–A.7 on p.129, A.21–A.26 on pp.133–135,
and B.35 on p.155 of the supplied paper, SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
