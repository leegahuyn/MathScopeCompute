# A continuous interval for the actual A.21 pressure datum

## Scope and inputs

This note connects the pressure-prefix interval to the actual outer datum,
including every real parameter `eta` in `[-1,1]`. It does not replace that
datum by a rational function. The rational function below is an approximation
with a proved analytic error, and is used only for validated evaluation.

The source paper is the supplied 166-page PDF, SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
The formulas are A.5, A.7, A.10--A.13 and A.21 (printed pages 129--134).
The exact outer choices are those in `OUTER_DERIVATION.md`, SHA-256
`ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81`.
Here `P=exp(2T)`, `T=exp(2^20)+10`, and `f(z)=(1+z^2)^(-1)`.

Define, using the literal step in A.5,

\[
 \Sigma(y)=\int_0^y\sigma(s)\,ds,\qquad
 R(y)=\exp\left(\frac y5-\frac65\Sigma(y)\right),\qquad
 c_P=\frac52+\frac12\int_0^1R(y)\,dy+\frac12e^{-2/5}.
 \tag{1}
\]

The accepted numerical input is the append-only run
`attempts/pressure-prefix-0002/receipt.json`. Run 0001 is rejected because
its flat-collar multiplier was coded as a point instead of an interval.
The original receipt and producer snapshot are retained with a rejection
record. No accepted result depends on run 0001.

## 1. Exact relation to the entire pressure

The reference interval contributes `(5/2)P^2 f(z)^2` to `-Pi_0`.
On the first unit transition, `(log E)'=1/10-(3/5)sigma`; hence
`E^2=P^2 f(z)^2 R(y)`. Symmetry of the literal step gives
`Sigma(1)=1/2`, so the next stage starts at `P_1=P exp(-1/5)`.

On the entire following axial transition of length `T`, the source has
`l=0` and **exactly** `E=P_1 f(z) exp(-s/2)`. In particular the angular
factor on this stage is `f`, as explicitly stated in A.2 and A.5. Its
integral is `(1/2)P^2 exp(-2/5)(1-exp(-T))f(z)^2`.

Omit only the pressure-neutral angular bumps when computing A.21. On all
subsequent unedited intervals write `E=c(s)f(z)^(theta(s))`, `0<=theta<=1`,
starting at `c(0)=P exp(-1/5-T/2)`. On the intermediate interval and pulse,
`c'/c<=-1/2`. In A.10 the additional factor `2^(-(1-theta))` decreases,
so this inequality persists for the coefficient `c`. On the exterior
transitions `l<=0`; on the final flattening `l=-h+fo'/fo<-3h/4<0`.
Thus `c'/c<=-1/2` on the entire tail, including its infinite power-law end.
Consequently `integral_0^infinity c(s)^2 ds <= c(0)^2`.

On the full horizontal strip `|Im z|<=1/16` one has
`Re(1+z^2)>=255/256` and the analytic principal logarithm is available.
Uniformly for `0<=theta<=1`,
`|f(z)^(2theta)| <= (256/255)^2 < 2`. The actual post-axial pressure
tail, divided by `P^2`, therefore has modulus less than `exp(-T)`.
The infinite continuation of the preceding axial exponential has the
same bound. Subtracting the two tails proves the actual analytic identity

\[
 \frac{\Pi_0(z)}{P^2}=-c_P f(z)^2+\mathcal E(z),\qquad
 |\mathcal E(z)|<2e^{-T}<2^{-1400},\quad |\Im z|\le\frac1{16}.
 \tag{2}
\]

For the last strict bound use `T>2^39>1024`, `e>8/3`, and
`2(3/8)^1024<2^-1400`, checked as an exact rational inequality. The much
stronger actual scale is retained in the mathematical definition.
All pressure-neutral outer edits preserve (2) exactly by their defining
continuous moment equations. Later B.8, C.2 and heat corrections preserve
the same datum when their five-moment restoration equations are satisfied.
This note alone does not assert that every later correction has been
attached to the final field or checked in Lean.

## 2. Uniform analytic enclosures used by the quadrature

Set `delta=1/16` and `r=1/256`. At each real center
`t in [delta,1-delta]`, the literal step is holomorphic on `|z-t|<=r`
and has modulus less than 2 there. This statement follows directly from
`sigma=q/(1+q)` and `q=exp(L)`,

\[
 L(z)=\frac1{(1-z)^2}-\frac1{z^2}.
\]

For `delta<=t<=3/10`, write `z=t(1+w)`, `|w|<=1/16`.
The absolutely convergent reciprocal-square series gives
`Re((1+w)^(-2))>=194/225>64/75`. Also
`|1-z|>=1-(17/16)t>=109/160`. It follows that
`Re L(z) <= (160/109)^2-256/27 < -4`, so `|sigma(z)|<1`.
Reflection `sigma(z)=1-sigma(1-z)` supplies the bound 2 on the right.
For `3/10<=t<=7/10`, integrate `L'` along a vertical segment through `z`:

\[
 |\Im L(z)|\le r\frac4{(3/10-r)^3}<\frac23.
\]

Thus `cos(Im L)>=7/9` and `|q/(1+q)|<=9/7<2`; in particular there
is no zero of the denominator on these discs. The local analytic
primitive agrees with the real integral of the step. Since
`Sigma(t)>=0` and `|1/5-(6/5)sigma|<13/5`,

\[
 \Re\log R(z)\le\frac15+\frac{13}{5}r<\frac14,
 \qquad |R(z)|<2.
 \tag{3}
\]

These are bounds over complete complex discs, not values at a sample mesh.

## 3. Outward Taylor integration and both flat collars

The accepted producer uses 384-bit dyadic intervals, Taylor degree 96,
and step `h_q=1/2048`. There are exactly 1792 cells covering
`[1/16,15/16]`. It computes the actual Taylor coefficients of the literal
step by exponential and reciprocal power-series recurrences and then
uses the identity `R'=(1/5-(6/5)sigma)R`. The scaled cell coordinate
has coefficients for the physical increment `h_q`.

Cauchy's estimate (3) makes each discarded endpoint series tail at most

\[
 2\frac{(h_q/r)^{97}}{1-h_q/r},\qquad h_q/r=\frac18.
 \tag{4}
\]

The integral error per cell is at most `h_q` times (4). Interval
propagation includes both this analytic error and the complete uncertainty
in the entering value of `R`. Every integer multiplication, division and
coefficient convolution rounds outward. Point exponentials use range
reduction to an argument at most `1/2`, 120 Taylor terms and the rigorous
tail `2*(1/2)^121/121!<2^-700`, followed by outward interval squaring.
Machine floating point is used only for elapsed-time displays.

For `0<=t<=delta`, monotonicity and the explicit exponent give
`sigma(t)<=sigma(delta)<2 exp(-254)<2^-350`. Hence
`0<=Sigma(t)<epsilon=2^-350`, and

\[
 1-2\epsilon\le \exp(-6\Sigma(t)/5)\le1.
 \tag{5}
\]

The left collar integral is enclosed by
`5(exp(1/80)-1)*[1-2epsilon,1]`; the value starting the body is
`exp(1/80)*[1-2epsilon,1]`. At the other endpoint symmetry gives
`Sigma(t)=t-1/2+Sigma(1-t)`. Its collar integral is enclosed by
`exp(-2/5)(exp(1/16)-1)*[1-2epsilon,1]`.
Both sides of (5), including its upper endpoint 1, are present in run 0002.

The resulting interval for (1) has width below `2^-279` and, in
particular, below the requested `2^-256` evaluation target. The exact
rational endpoints, all input and producer hashes, operation counts and
the producer snapshot are retained in that run. This is a continuous
integral enclosure, including the flat collars and Taylor remainders.

## 4. Actual normalized Taylor coefficients of the pressure

For every real `eta_0`, the disc of radius `1/16` is covered by (2), so
the error in its order-`k` Taylor coefficient is less than
`2^-1400 * 16^k`. In particular at zero,

\[
 (1+\eta^2)^{-2}=\sum_{m=0}^{\infty}(-1)^m(m+1)\eta^{2m}.
 \tag{6}
\]

The checker exports interval coefficients for `Pi_0/P^2` through degree
48 by combining (6), the actual interval for `c_P`, and the Cauchy error.
Odd coefficients are exactly zero by evenness of the entire datum;
even coefficients contain the full error from (2). All coefficient
interval widths are below `2^-256`. Multiplication by `k!` converts a
coefficient interval into a derivative interval without changing the
meaning of the normalization. The scalar quadrature width is the
dominant error; no pressure Taylor remainder is silently discarded.

The actual datum remains the full integral A.21 in every subsequent
identity and definition. These evaluated coefficients provide finite
input enclosures for that function, not a new pressure definition.
They are not yet a kernel proof identifying the infinite axis fixed
point with the evaluated core array.
