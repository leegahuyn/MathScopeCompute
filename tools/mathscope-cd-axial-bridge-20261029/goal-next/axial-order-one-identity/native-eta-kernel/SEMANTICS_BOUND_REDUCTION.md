# Actual n=1 Picard eta kernel and the remaining leading bound

This checks a smaller ordinary-native obligation than the earlier general
fixed-n convergence and radial-tail arguments. It binds the original system0
eta recurrence to the actual matrix and forcing jets and independently bounds
their literal source operand trees. No finite iterate is called the exact
solution, and no numerical native value is evaluated.

## Fixed source and actual scope

The original n=1 bootstrap is run with terms=0,bits=128,heatIterations=0.
Its 117,100-node prefix is independently pinned to
`d125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116`.
Six source module hashes are hard assertions. The original N4 registry is
`049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad`.
Every actual system0 xi,eta,diagonal,A0,A1,forcing,sourceLeading and radial
domain field is compared to that registry. No function-number identification
with legacy #672 is used here.

The source physical-X leading fields are pulled back by the exact original
substitution `X=xi^2`, retaining their physical-X derivatives. This concerns
the n=1 raw inner ODE, before the order-one global bump repair. Its formal
xi is #25516, eta is #2, C1 is #24818, B is #24812 and delta is #24801.
The source scalar nodes are explicitly exported: A=#23,D=#22,d=#30,L=#28.
The disposable derivative replay ends at 125,352 nodes. Later node IDs have
that replay's namespace, not a claim of matching historic full-export IDs.

## Actual eta recurrence and literal G operator

Let `W_i^[m]` denote an ordinary eta derivative. For every component i=0..5
and m=0,1,2, independent Python exact polynomial normalization confirms the
ACTUAL original `picardRhs` graph equals

```
f_i^[m] + sum_(j=0)^5 sum_(k=0)^m binom(m,k)
          (A0_ij^[k] W_j^[m-k] + A1_ij^[k] W_j^[m-k+1]).
```

There are 18 actual RHS identities and 12 consecutive eta derivative
identities between those actual polynomials. Actual W descriptor inputs
run through eta order 3. Coefficient/forcing derivative paths are eta-only,
so this RHS check does not identify different mixed derivative paths.
All 234 coefficient slots are retained, including constants and literal zeros.
Removing the middle factor 2 in the second derivative fails actual rows3,4,5.

The first source Volterra term is exactly

```
(G f)_i(xi,eta) = xi * integral_0^1 t^c_i f_i(t xi,eta) dt,
c=(0,0,2,0,3,1).
```

The original nonzero components3,4,5 have their own actual fresh binders and
fixed bounds [0,1]. For eta orders0,1,2, the source derivative of this term
and the separately assembled `G(partial_eta^m f)` are the IDENTICAL node,
using the same original binder in the comparison: nine literal identities.
The first three components and all their tested derivatives are literal zero.
Ordinary differentiation under this compact integral still consumes the
actual leading derivative regularity premise; identical graph nodes alone
do not prove that premise.

## Independent bound tree of the actual source coefficients

Let `S_r={dist(eta,[-1,1])<r}`. Let the actual original leading F0,U0 be
holomorphic in eta on S_delta, continuous in physical X on [0,a^2], with
their physical-X derivatives through order2 uniformly bounded there by B.
Assume the original same-source average formula for v0, and the original
scalar facts B>=1,0<delta<=1,0<=xi<=a<=1,0<h<1/16. The original much
smaller delta ensures |eta|<=33/32 on S_(delta/4), with |1/L|<=2 and |d|<=3.

Cauchy on a radius delta/4 circle gives the conservative input bounds

```
|partial_eta partial_X^k F0|,|partial_eta partial_X^k U0|
    <=4B/delta, k=0,1,
|partial_eta^2 F0|,|partial_eta^2 U0| <=32B/delta^2.
```

The actual regular radial average has norm at most B, including its first
two X derivatives (in fact the k-th derivative gains 1/(k+1)). Its eta
derivative on S_(delta/2) is at most 2B/delta. Thus the original formula

```
v0=[2eta U0-2D eta Avg(U0)-d partial_eta Avg(U0)]/L
```

gives, on S_(delta/2),
`|partial_X^k v0|<=(6*(33/32)+12)B/delta<28B/delta` for k<=2.
A further Cauchy radius delta/4 gives
`|partial_eta v0|<=112B/delta^2` on S_(delta/4).

The checker reads 233 literal source coefficient/forcing nodes, stopping
only at these actual leading jet roots. It applies the ordinary triangle,
product, integer-power and nonzero-L inverse inequalities, and sums the
actual matrix rows. It uses positive polynomials in B and a temporary q=1/delta
(this q is NOT the paper's physical q). Every monomial is dominated by the
target B/delta or B^2/delta^2 because B,q>=1. All coefficients and exponent
comparisons are exact rationals/integers, with no sampled equality.

The resulting actual row bounds, as multiples of B/delta, are:

| row | A0 coefficient | A1 coefficient |
| --- | --- | --- |
|0|1|0|
|1|1|0|
|2|1|0|
|3|4|0|
|4|6123/32|993/16|
|5|9029/64|801/16|

All are less than 512. The actual Omega0/X tree is bounded by
`(4949/2)B^2/delta^2 <4096B^2/delta^2`.
The nonzero forcing rows3,4,5 have coefficients
`4949/2`, `32209173/8192`, `113329317/8192` against B^2/delta^2,
all less than 65536. The source C1 formula is checked as the SAME node:

```
C1 = 262144 B^2/delta^2.
```

Consequently each actual A0,A1 induced row norm and the actual forcing
vector norm is at most C1/2. This removes the separate *coefficient/forcing
majorant* premise under the precisely stated leading jet bound. It does not
claim to have independently proved that leading bound from B.26/natural
source semantics. Eighteen leading jet aliases represent sixteen derivative
classes; the leading X/eta mixed classes use the ordinary leading smoothness
premise already stated, not an additional source-Picard assumption.

## Consequence for the true fixed-n1 sum

Use the prior source-bound Volterra factorial/value-tail and fixed-radial
derivative proofs with the now-bound actual C1. Here s=delta/8, source strip
is2s=delta/4, and the source threshold is K=ceil(72 C1^2 a^2/s).
Given the leading holomorphy/jet premises, normal convergence defines the
ordinary fixed-n1 solution `W=sum_(k>=0) Koperator^k Gf`, with its original
zero-axis datum, and permits its eta derivatives on smaller strips. The
literal binomial RHS and G checks above identify the source's requested
eta jets0..2 with those derivatives in the canonical series denotation.
The previous high-radial-tail theorem handles fixed radial jets if its
leading higher-radial smoothness/bounds are supplied as well.

This is a mathematical denotation model, not evidence of numerical native
evaluation. An executed control sends a genuine original Picard descriptor
to the actual finite diagnostic evaluator. It rejects it with
`UNSUPPORTED: Unknown source program operation actual_background_picard`.
Thus this interpreter does not assign a finite display to the infinite
native. If an external interpreter supplies values, identifying those
values with the canonical series remains that interpreter's obligation.

## The next genuinely missing original bound

The remaining base statement is now exact:

```
B = 4096 Lambda^2 Q^3/t1,
sup_[0,a^2]xS_delta |partial_X^k F0|,
sup_[0,a^2]xS_delta |partial_X^k U0| <= B,  k=0,1,2,
delta=rho/(1024Q), a^2=Xa exp(t1/16).
```

These must be the ACTUAL natural core and literal B.26 activation, with
their genuine matching jets at Xa and the same core mass used by the radial
average. The source `actual-background-majorant.mjs` states a derivation
but its registry/proof strings alone do not establish the analytic functions
or their complex-strip bounds. The prior actual natural-axis proof and the
actual B.26 integral/ratio control are the next inputs to instantiate. Do
not substitute a B.22 reference field or an auxiliary natural extension in
the activation interval. Subsequent global cutoffs/bump joins are separate
from this raw common-inner rectangle.

VERIFIED: the finite actual source kernel and norm-tree reduction checks.
CONDITIONAL: ordinary leading source jet/holomorphy/average inputs and the
resulting canonical fixed-n1 denotation. General n and global cutoff/field
jets remain OPEN. No acceptance counter or RELEASE HOLD changes.
