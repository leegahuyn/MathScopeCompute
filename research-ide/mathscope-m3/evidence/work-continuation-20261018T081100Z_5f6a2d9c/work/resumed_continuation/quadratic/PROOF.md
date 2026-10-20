# Actual continuous C.2 matrix and ordinary eta jets

This is new continuation work. It does not recover lost implementation bytes,
rerun the original source producer, evaluate the actual oscillatory/improper
RHS, or close any of the 138 whole-kernel rows. N7-06 and N8-05 remain open.

The full original gzip is authenticated by SHA256
`42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3`.
Its exact header matches the retained source header, and the prefix through
node71726 is read without running a producer. All retained scalar-closure
records in that prefix are compared. Every one of the 25 entries of original
I1 quadratic system1's linear matrix is matched to an analytic integral AST,
with alpha renaming of integral variables and exact associative/commutative
normalization only. Heat system2 has exactly the same lower-right E block.
The unchanged parameter-expression SHA is
`e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`.

## Continuous matrix enclosures

Write `delta=2^-200`, retaining the original theorem `0<lambda<=delta`.
This is an enclosure of the actual positive parameter, not lambda=0 and not
a different parameter fixture. All original B, C0, K, X0, lambda powers,
second debt-row normalization, and source labels remain unchanged.

The original bumps are
`b_j(x)=2 sigma_2'(2(x-(9+j)))`, with positive mass one on
`[9+j,9+j+1/2]`. Hence each weighted integral is enclosed by the minimum and
maximum of its continuous weight over that support. No sample sum replaces
the integral. Square-root endpoints are exact dyadic enclosures checked by
squaring. Logarithms use the rational atanh series and its positive geometric
remainder; the computation contains no floating-point bound endpoints.

For x in these supports, `log(x)<3`, because
`exp(3)>sum_{k=0}^4 3^k/k!>13.5`. Therefore
`1-3delta <= x^-lambda <= 1` by `exp(-t)>=1-t`. The three E weights are
`sqrt(2x)`, `-x^(-1/2-lambda)`, `x^(-3/2-lambda)`. These give the recorded
entry intervals directly. The U weight is
`w_lambda(x)=-int_0^log(x) exp(-lambda s) ds`; its endpoints use
`-log(x) <= w_lambda(x) <= -log(x)+lambda log(x)^2/2`.

The U interval determinant is strictly negative. For E, write each point
column as `x^(-3/2-lambda) [sqrt(2)*x^(2+lambda), -x, 1]^T`.
If `x<y<z` in the three ordered supports, the remaining determinant is
`(y-x)(z-x)(z-y) f[x,y,z]` for `f(t)=sqrt(2)*t^(2+lambda)`.
Since `f''>=2sqrt(2)`, its second divided difference is at least `sqrt(2)`.
The three gaps are at least `1/2,3/2,1/2`. Multilinearity integrates this
positive determinant against the product of the three original unit-mass
bump measures. Thus the exact computed lower bound is

`D_E >= (3/8)*sqrt(2)_lower * product_{r=11.5,12.5,13.5} ((1-3delta)/(r*sqrt(r)_upper))`.

This is approximately `6.20345780796e-6`, larger than the retained source
bound `3/64000000`. A direct interval expansion supplies an upper endpoint.
Exact interval cofactors divided by this determinant interval enclose every
entry of the original continuous E inverse. The U block is treated similarly.
The new full inverse infinity-norm bound is approximately `54752.2249451`,
improving the retained `2^30`. Decimal figures here are explanatory only;
the evidence carries exact rational endpoints.

## Same-root derivative intervals and actual callers

The retained I1 and heat proofs explicitly use the maximum over component,
eta in `[-1,1]`, and **ordinary** eta derivative orders 0,1,2. Their incoming
exact-inverse-times-RHS C2 bound is `beta=2^-441`. This is a theorem bound,
not a numerical RHS value. The coefficient matrices and lambda are eta
independent. In this norm, a square has norm at most `4r^2`, and the
difference of squares on the r ball has norm at most `8r` times distance.

With `r=10^-6`, the retained `||Qdiag||<=64`, and the new continuous inverse
bound M, the original map has C2 contraction bound
`q_new=8*delta*M*64*r`, approximately `1.74450653353e-59`.
The exact self-map inequality is checked. The original zero-seeded root
remains the same unique root, and
`||z||_C2 <= beta + q_new ||z||_C2`, giving
`||z||_C2 <= beta/(1-q_new)`.

This supplies exact rational intervals for orders 0,1,2 at all eight actual
I1/heat calls: nodes9169..9173 and71717..71719, whose actual eta argument is
source coordinate2. The magnitude is approximately `1.76105091434e-133`.
It does not make a claim about higher orders or an evaluated derivative
center. In particular, it does not reclassify the previous value-only
adapter as a historical derivative computation.

For original I1, the actual Jacobian is `J=A+2lambda Qdiag diag(z)`.
Let `p=2delta*M*64*||z||_C2<1`. The matrix Neumann estimate gives
`||J^-1||<=M/(1-p)` and `||J^-1-A^-1||<=M*p/(1-p)`.
Adding the latter symmetric error to every entry of the already enclosed
continuous inverse gives the recorded actual Jacobian inverse intervals.
The rational preconditioner is never relabeled as a different exact matrix.

The actual original products node9206=`9170*9205` and
node71726=`71717*71725` have factors equal to `2sigma_2'(...)`.
Their complete ordinary scalar factor cones contain no eta coordinate2 and
no unresolved native operations; they are eta independent. Both factors
are in `[0,128]` on every finite real X, using the following elementary
new bound for precisely the original cutoff definition.

For `s in [1/4,3/4]`,
`sigma_2'(s)=2sigma_2(s)(1-sigma_2(s))(s^-3+(1-s)^-3)<=64`.
For `s<=1/4`, `sigma_2(1-sigma_2)<=exp(2)exp(-s^-2)`;
`s^-3 exp(-s^-2)<=64exp(-16)` because that function is increasing there,
and `(1-s)^-3<=64/27`. Hence the derivative is at most
`(3584/27)exp(-14)<1`, verified using a lower exponential Taylor sum.
Symmetry covers `s>=3/4`, and the flat exterior derivative is zero.
Consequently each ordinary eta derivative of these two actual source
callers, through order2, is enclosed by
`[-128*beta/(1-q_new),128*beta/(1-q_new)]`.

## Remaining exact requirements

For nonzero-centered/refined roots, original I1 RHS nodes8830..8834 still
require continuous loop density integrals8786..8790, their original phase
`N log X`, roots and cancellation. Row8831 retains the original division
by lambda squared after the dJ/dM combination. Heat RHS nodes71708,
71712,71716 require original heat integrals71547,71610,71671 with their
infinite-tail change of variable and eta dependence. Native frontier records
and integral operands are listed in `ACTUAL_RHS_REMAINING_REQUIREMENTS.json`.

No actual RHS value or RHS derivative value is claimed. No finite root
iterate is declared exact. All global mixed jets, energy/norm integrals,
uncovered caller domains, whole-kernel requirements, N7-06 and N8-05 remain.
