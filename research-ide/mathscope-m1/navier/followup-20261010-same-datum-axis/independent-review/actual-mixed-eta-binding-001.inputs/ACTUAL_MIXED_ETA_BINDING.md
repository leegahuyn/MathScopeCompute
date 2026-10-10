# Actual radial and eta truncation of the selected infinite profile

This binding closes the numerical premise of the finite mixed-jet bridge for
the accepted 25-by-5 coefficient array. It uses the actual selected infinite
nonlinear profile, the existing exact interval computation, and an explicit
real eta chart. No unspecified coefficient array, error radius, or `hround`
argument remains in this bound.

The relevant original criterion asks for the finite radial/eta jet to be a
truncation of the same infinite object, with truncation and roundoff separated.
It does not require a kernel evaluation of every numerical interval operation.
The following argument combines actual kernel identities with the already
audited exact rational enclosure calculation. The receipt distinguishes these
two kinds of evidence.

## 1. Actual functions and exact coefficient identities

The kernel-checked `ConcreteProducer` 0002 selects the actual coefficient pair
at `rho=sigma²/65536` and `Lambda=Q^64`, using the actual new pressure integral
and actual normalized amplitude. Write its first component as A and its
reference first component as B. The actual estimate is

\[
\|A-B\|\le29/Q^{53},\qquad Q\ge2^{260}.
\]

`ConcreteJetRecurrence` 0004 proves, for every n and every eta in the real
window,

\[
B_n(\eta)=\frac{(-\chi(h,j,\sigma,\eta)/2)^n}{n!(n+1)!}.
\]

It also proves the equality of every ordinary eta derivative on the interior
and the actual normalized error

\[
\left|\frac{j^m}{m!}\partial_\eta^m A_n(\eta)
 -\frac{j^m}{m!}\partial_\eta^m B_n(\eta)\right|
\le\frac{j^m}{m!}\frac{29}{Q^{53}}w_\rho(n,m).
\]

These conclusions have no free analytic-input, amplitude, or coefficient-norm
hypothesis. At n=0, `selectedPhi_axis_coefficient` gives the exact function
one on the whole real window, so every positive-order eta derivative is zero.
This justifies the exact zero error for the constant radial row.

`MixedEtaBindings` 0008 proves from the selected exponential parameters that
`0<h≤2^-4096`, `0<j`, and `j²≤2^-32768`. It also proves the exact identities

\[
H(h,j,j\xi)/j=1+(9/2-h)\xi-j^2\xi^2-4j^2\xi^3=:H_0(\xi),
\]
\[
\chi(h,j,\sigma,j\xi)=H_0(\xi)^2/(H_0(\xi)^2+1/4000000).
\]

Thus the finite rational Taylor algebra evaluated in the saved 125 rows is
the Taylor algebra of the **same actual reference function**. The h and j²
input boxes contain the actual positive parameters; their zero lower
endpoints do not replace either parameter by zero.

For n=0..24 and m=0..4, let

\[
a_{nm}=\frac{j^m}{m!}\partial_\eta^m A_n(0),\quad
b_{nm}=\frac{j^m}{m!}\partial_\eta^m B_n(0).
\]

The exact original weight, `j≤1`, `rho^-1≤Q`, and `m≤4<53` yield the explicit
budget

\[
|a_{nm}-b_{nm}|\le E_{nm}:=
\frac{29\,2^{-260(53-m)}\binom{n+m}{m}}
 {20^n(n+1)^2(m+1)^2}\quad(n>0),
\]

and E_0m=0. The inequality `rho^-1≤Q` follows from the actual operator
producer's `5120/rho≤Q` and rho>0. Every E_nm is compared exactly with its
saved row in the new receipt.

## 2. The actual finite array and its roundoff

For each accepted `actualNonlinearCoefficientInterval`, let its exact dyadic
endpoints be l_nm and u_nm. The new deliverable records the literal rational
midpoint c_nm=(l_nm+u_nm)/2 and radius d_nm=(u_nm-l_nm)/2. The independent
Taylor oracle is replayed for all 125 reference coefficients. Each oracle
interval lies in the saved reference interval; the latter plus [-E_nm,E_nm]
lies in [l_nm,u_nm]. Therefore

\[
|a_{nm}-c_{nm}|\le d_{nm}
\]

for these actual, named coefficients and all 125 actual recorded pairs.
This is the concrete instance of the earlier general rounding premise.
No claim is made that c_nm equals the nonlinear coefficient exactly.

Define the actual finite Taylor block and its rounded polynomial by

\[
T_A(Y,\xi)=\sum_{n=0}^{24}\sum_{m=0}^{4}a_{nm}Y^n\xi^m,
\qquad M(Y,\xi)=\sum_{n=0}^{24}\sum_{m=0}^{4}c_{nm}Y^n\xi^m.
\]

This is precisely the normalized-coordinate form of
`rectangularTaylor selectedPhiCoefficients 25 5 0 Y eta` with xi=eta/j.
The kernel recurrence module proves that this finite block is the projection
of the selected infinite nonlinear fixed-point equation. The normalization
uses j^m/m!, not j^m alone. The separate derivative-value tables retain their
different normalization j^m times the ordinary mixed derivative.

## 3. A specified eta chart and separate infinite tails

The actual chart is

\[
0\le Y\le41/10,\qquad |\eta|\le\rho/4,\qquad\xi=\eta/j.
\]

The new kernel module proves that it is inside the real coefficient window,
has positive radius, and satisfies `|xi|≤epsilon:=2^-16000<1/16`.

Only the **comparison** is analytically extended to the complex xi disk of
radius 1/16. On that disk `|H_0-1|<3/10`, its denominator has modulus above
12/25, and `|chi|<2`. These facts are already proved in the frozen mixed
comparison proof and independent 858-check review; the new receipt rechecks
the scalar inequalities at the actual input bounds. No assertion is made
that the unknown nonlinear profile has that larger complex xi domain.

For the comparison Bessel series the absolute sum on this disk is less than
`exp(4.1)<243`. Its eta Taylor tail after degree four is bounded by

\[
E_\eta=243\,(16\epsilon)^5/(1-16\epsilon)<2^{-79000}.
\]

For R=41/10, the radial tail starting with degree 25 is bounded uniformly
on the same comparison disk by

\[
E_r=\frac{R^{25}}{25!26!}\frac1{1-R/(26\cdot27)}.
\]

Cauchy bounds the m-th xi Taylor coefficient of that tail by 16^m E_r.
After summing m=0..4 on the actual chart, its contribution is at most
`E_r/(1-16 epsilon)`. This is an actual radial and eta truncation of the
comparison, with both remainders explicit.

The nonlinear value error is controlled on the actual real chart by the
original mixed-series norm estimate at R=5; `jetBound rho 5 0 0=4/3`. The
coarse already-proved bound `29/Q^53≤2^-512` therefore gives
`E_value=(4/3)2^-512`. The difference between the actual and reference
finite blocks has its own explicit budget

\[
E_{block}=\sum_{n=0}^{24}\sum_{m=0}^{4}E_{nm}R^n\epsilon^m,
\]

and the directed finite coefficient rounding has budget

\[
E_{round}=\sum_{n=0}^{24}\sum_{m=0}^{4}d_{nm}R^n\epsilon^m.
\]

Consequently, everywhere on the stated continuous chart,

\[
|\Phi_{selected}(Y,\eta)-M(Y,\eta/j)|
\le E_{value}+E_\eta+\frac{E_r}{1-16\epsilon}
   +E_{block}+E_{round}<2^{-118}.
\]

The new receipt checks the last inequality with exact rational arithmetic.
The extra finite-block term deliberately accounts for using the rounded
**nonlinear** coefficient intervals rather than just the comparison centers.
Every contribution is recorded separately. This calculation resolves both
truncation directions and arithmetic error for one explicitly specified
finite chart of the actual infinite solution.

## 4. Evidence and boundaries

The binding receipt pins all actual kernel source modules and their producer
receipts, the frozen numerical producer and arithmetic helper, all 125 rows,
the 858-check independent mixed review and its snapshots, and this proof and
verifier. It records each exact midpoint/radius, coefficient enclosure check,
and continuous-chart error budget. The accepted original files are unchanged.

This is a concrete mathematical/interval consumer attached to actual kernel
identities. It is not represented as kernel evaluation of all 125 numerical
rows. The earlier frozen mixed proof's statement that the analytic producer
was still missing describes its historical stage; the current binding uses
the subsequent actual `ConcreteProducer` and recurrence modules. The earlier
proof bytes and receipts are preserved.

One tiny eta Taylor chart does not cover the whole interval [-1,1]. The
original coefficient-space solution and its all-order estimates exist on
the whole window; this finite chart is the certified approximation demanded
by the radial/eta finite-jet criterion. The separate complete symbolic graph
and other original completion gates are not silently promoted by this
component receipt.
