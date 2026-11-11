# First original cutoff scale and weighted derivative closure

The checker reads the original localization scalar program, recursive
source-function family, and separate native Temporal estimate. The
comparisons use exact source roots, integer and rational arithmetic,
and elementary exponential inequalities.

## Exact common threshold

In the localization scalar program, source node #622791 is
`qBig=2^(-(ellMinimum+10))`. That ID belongs to the localization program.
The post-Five graph uses a different namespace after the common-family
prefix. The earlier admissible-family node #617437 uses ellMinimum+4.

Let `B=log(1/qBig)`, `H=1/h`, `B*=Bnorm`, and `R*=C12EnvelopeR`.
The actual ellMinimum is a ceiling of a maximum containing 8,
`(64H)^2`, `(B*)^512` and `(R*)^1024`. The nonnegative Bnorm sum includes
`2^128` and `(R*)^4096`. Since `1/2<log(2)<1`,

- `B>2048 H^2`, `B>(B*)^512/2`, and `B>(R*)^1024/2`.
- `B*≥max(2^128,(R*)^4096)`.

The fixed higher derivative background norms B_m have their own trees.
The estimate for Bnorm gives no upper bound on those norms.

## Available operator comparisons

**Moving tangent propagator.** The source value majorant has
`log W=3 (B*)^256 Lmax`, with `Lmax=(4+sqrt(2))/2^33<6/2^33`.
Thus `log W<B/2^28`, since `18<16 (B*)^256` and
`B>(B*)^512/2`. Extra forward damping preserves that value bound
at each nonzero integer harmonic. The differentiated forced operator
also requires B_m and the actual input seminorm.

**Temporal.** The native desired-velocity estimate costs `5 ell^2`
from the displayed joint C^(m+2) residual norm to C^m. On an original
band write `q=2^-ell s`, `s in [1/2,2]`, and `x=log(1/q)`. Then
`ell=(x+log s)/log(2)<2(1+x)`, so the cost is at most
`20(1+x)^2`. This contributes two logarithmic powers. The weighted
input derivative bound and realized meridional potential require
separate estimates. Applying the full radial operator to that
potential can require another derivative of the desired axial field.

**Fixed FiveMap coefficient inverse.** Set `T*=exp(1048576)+10`.
The exact source has `lambda=exp(-1000 T*)` and `h=exp(-8002 T*)`,
so `lambda^-1<H`. Its three normalized angular nodes are
`exp(2/5)`, `exp(-(2+2 lambda)/5)`, and `exp(-2 lambda/5)`.
All are less than two and every separation exceeds 1/8. For the
two negative exponent nodes, use `exp(-2 lambda/5)≥3/5` and
`1-exp(-2/5)≥2/7`, since `1-exp(-t)≥t/(1+t)`.
The angular inverse therefore has coefficient bound `4*8^2=256`
by its Lagrange formula, and row sum at most 768. The axial gap
`1-exp(-2 lambda/5)≥2 lambda/7>lambda/4` gives a cost
`4/lambda` on its one nonzero normalized target.

Let `x0=sqrt(2 X0Imean) exp(1/2)>1`. The five fixed positive moments
have the exact formula

    mu_p = (x0^p/10) integral_0^1 (1+t/10)^p exp[-1/(t(1-t))] dt.

For every |p|≤4, restrict the integration to t∈[1/4,3/4]. The two
factors in the integrand are at least 1/2 and exp(-6)>1/3^6, so
`mu_p^-1≤30000 x0^4`. Write `Lc=log CSelected`. The parameter tree
gives `Lc≥Q^200≥800 T*` and `log R*=exp(25600000 Lc)`.
The exact XR and X0Imean expressions give

    log(x0^4) = 2 log(220)+20 Lc+120042 T*-10 < 173 Lc.

Thus `x0^4<R*`. The positive row multiplier is
`a=K_five (2 X0Imean)^(1/2+lambda)/(1+eta^2)`.
The source exponent gives `K_five>exp(-90000 T*)`. Therefore
`a^-1 < H^12` for |eta|≤1, using `2<exp(T*)` and `90001<12*8002`.
Combining all row factors, the normalized inverse, and the target
rescalings bounded by four gives `C_Five,0≤2^27 R* H^13`.
Its logarithm is below B/64 because `27 log(2)<B/1024`,
`log R*≤B*/4096<B/1024`, and `13 log H<13 B/2048`.
This fixed coefficient estimate supplies no actual differentiated
target norms or bound after the radial primitive.

## Sufficient quantitative target and the first gaps

The prior cutoff proof gives

    S_hat_(1,m)(0) ≤ 2 K_m C 4^P P! exp(-B/4),   K_m=84,15460,

conditional on the actual original uncut norm at derivative order
m+1 being bounded by `C q^(-ell_(m+1)+g_1)(1+x)^P`.
A concrete sufficient target is `C≤2^a (B*)^b H^c W^d` with
each nonnegative exponent a,b,c,d,P at most 2^16. Then each
logarithm of the four coefficient factors and of `2 K_m 4^P P!`
is less than B/1024. For the last factor use `P!≤2^(16P)`.
For the others use `B*>2^127`, `H>2^4096`, and the two strict B
threshold inequalities. Their sum is less than B/4. This would
place the original first scale on its B+1 branch. The actual uncut
norm has not been bounded by that explicit target.

Qualitative finiteness alone cannot select the branch. A pressure-only
constant increment M has finite uncut norms, yet at `a=1` and
`q=qBig/2` its cutoff seminorm is at least `M(qBig/2)^(ellPrime_0-g_1)`.
It can exceed the coefficient threshold as M increases. This is a
logical countermodel, separate from the actual source increment.

The first missing live operation is `ActualCorrectionPotentials`
`f_ac81b63855489a21bb407b2d`. It needs the globally assembled Cartesian
potential A1, direct azimuthal coefficient B1, and complete pressure
difference in the original gauge. The physical velocity and pressure
roots do not identify that potential. For example, A and A+grad(x)
have the same curl, but their cutoff curls differ by grad(chi)×e_x.
The required assembly combines the actual Forced and Signed wave
potentials, Temporal and FiveMap meridional potentials, direct
azimuthal increments, and exact physical chart rescalings.

The first typed quantitative gap already occurs on the live Forced
route. Coefficient order 1 requests common background C^3, which
emits Gaussian rows B_0 and B_1. Ordinary differentiation of the
actual full-curl expression through order one or two requests pulse
amplitude derivatives through orders two or three, requiring the
same-family C^4/C^5 rows. Even when those rows are generated, the
actual repaired common-reference W_alpha input seminorms are still
required. The original class attachment explicitly leaves that input
open. A higher norm prefix must preserve the actual coefficient
window and labels. Later Temporal and pressure stages require the
actual differentiated residuals and targets. The actual C,P, first
scale, and final jets remain open.

## Replay

    python check_first_scale_closure.py --repo REPO --temporal-receipt TEMPORAL_JSON --out first-scale-closure.json
