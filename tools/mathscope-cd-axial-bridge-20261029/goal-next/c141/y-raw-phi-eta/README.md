# Original mixed eta derivatives of Φ

The original C139 rooted graph has 186 Φ calls with positive eta
derivative order. They have 11 mixed-order signatures and 49 radial
argument nodes. The original written MathScope same-datum proof yields
a uniform raw enclosure for these calls where the original charts are
defined. Four of the calls also have exact scaled dyadic enclosures
at the explicit point Y = 4, eta = 0.

## Original complex and coefficient hypotheses

The pinned source is SAME_DATUM_ANALYTIC_AXIS.md, SHA-256
1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920.
Its Section 4 and (9) establish a complex eta tube containing every
circle of radius $16\rho$ about $[-1,1]$. The denominator of $\chi$
is nonzero and $|\chi|\le1$ there. Sections 6–8 establish, under the
same original A.21 datum and profile, the Bρ coefficient displacement
of the nonlinear fixed point from the entire comparison $f_0(Y\chi)$.
Equation (14a) bounds this displacement by $29Q^{-53}$. Equation (16)
uses the analytic Bρ coefficient weights to bound every fixed mixed
derivative of the displacement. Thus for the 11 rooted signatures
and real $0\le Y\le41/10$, $-1\le\eta\le1$,

$$
\left|\partial_Y^k\partial_\eta^m(\Phi-f_0(Y\chi))\right|
\le
29Q^{-53}\rho^{-m}
\frac{(m+k)!}{(m+1)^2 20^k}
\left(\frac{200}{159}\right)^{m+k+1}
< 2^{-12468}.
$$

The exact replay bounds the rational factor including 29 by $2^{12}$,
uses $\rho^{-1}<Q$, and uses $m\le5$ and $Q>2^{260}$ from the pinned
profile. This yields the raw enclosure centered at
$\partial_Y^k\partial_\eta^m f_0(Y\chi)$ with radius $2^{-12460}$.
The source premise is the same-datum nonlinear Bρ result with its
displacement bound. C139 supplies $Y<256/63<41/10$ conditionally on
the used native branches and their chart premises. The packet
preserves these premises.

The center has an exact entire-function representation. If
$\chi_j=\chi^{(j)}(\eta)/j!$ and
$z(s)=\sum_{j=0}^m\chi_j s^j$, it is

$$
m![s^m]z(s)^k
\sum_{\ell=0}^m
\frac{Y^\ell f_0^{(k+\ell)}(Y\chi_0)}{\ell!}
(z(s)-\chi_0)^\ell,
\qquad
f_0(x)=\sum_{n\ge0}\frac{(-x/2)^n}{n!(n+1)!}.
$$

There is also an explicit finite-polynomial representation for
radius $2^{-260}$. On $|Y|\le5$ and the original complex eta tube,
the absolute tail of the comparison radial sum after degree $N\ge3$
is at most $2^{-N}$. The term bound starts at $n=3$ and propagates by
a ratio less than $1/2$. Mixed Cauchy differentiation, using radii
$9/10$ and $\rho$, then multiplies the bound by
$k!m!(10/9)^k\rho^{-m}<2^8Q^m$ on the original real chart. The bound
$Q<2^{131072T}$ gives
$N=\lceil131072\,mT\rceil+269$. At this degree the comparison
truncation error is less than $2^{-261}$. Adding the original
displacement remains within $2^{-260}$. This degree is expressed
symbolically and has not been materialized.

## Literal Y = 4, eta = 0

The literal source calls are #5748, #10450, #20811 and #81559 for
eta orders 1–4. For these explicit point specializations use
$s=\eta/j_0$, $j_0=h^4$, and $\tau=1/4000000$. The original exact
profile gives

$$
Z_h(s)=H_*(j_0s)/j_0
=1+(9/2-h)s-j_0^2s^2-4j_0^2s^3,\qquad
\chi(j_0s)=Z_h(s)^2/(Z_h(s)^2+\tau).
$$

The comparison at $h=0$ uses the polynomial $Z_0=1+(9/2)s$.
For complex $|s|\le1/32$ and the pinned $0<h<1$,
$|Z_h-1|,|Z_0-1|<1/6$ and $|Z_h-Z_0|<h/16$. The two denominators
have magnitudes greater than $1/2$. Subtracting the fractions gives
the bound $|\chi_h-\chi_0|<h$, and each $\chi$ has magnitude below 2.
On $|x|\le8$, the entire series gives $|f_0'(x)|<41$. Its differences
along a line segment then give
$|f_0(4\chi_h)-f_0(4\chi_0)|<4\cdot41h$ on that $s$ disk.
Cauchy's bound for orders 1–4 gives a scaled derivative error
below $2^{33}h<2^{-15971}$, using the pinned $h=e^{-8002T}$,
$T>2$, and $e>2$. The already bounded nonlinear error remains
below $2^{-12460}$ after multiplying by $j_0^m<1$.

The first four formal Taylor coefficients of $\chi_0(s)$ are
computed with exact rational series inversion. The entire comparison
at their common argument $4\cdot4000000/4000001$ uses alternating rational
enclosures for the needed $f_0^{(\ell)}$. The exact interval arithmetic
adds a radius $2^{-300}$ for both source-profile perturbations, then
rounds outward to a dyadic grid of spacing $2^{-260}$. Each of the four
final intervals has adjacent endpoints. Their integer numerators
enclose the actual scaled quantity $j_0^m\partial_\eta^m\Phi(4,0)$.

The fixed-point dyadics depend on the stated coordinate
specialization and gauge. The raw uniform enclosure uses exact
symbolic endpoint functions. Full physical native evaluation,
Lean formalization of the written source instantiation, original Y
acceptance, and final jet acceptance remain open.

## Replay

~~~text
python -B enclose_original_phi_eta.py SAME_DATUM_ANALYTIC_AXIS.md source-profile-data.mjs C139/expanded.json C139/transport-live.json phi-eta.json
~~~

RELEASE HOLD.
