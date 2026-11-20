# All live original natural-series calls

The independent replay binds all 567 live rooted C139 calls to
conditional source-dependent enclosures from the original written
MathScope same-datum proof. It includes 263 Φ, 190 u and 114
average calls, with 41 derivative signatures and 61 radial argument
nodes. All radial orders 0–3 and eta orders 0–5 that occur in
the rooted graph are included. The exact replay checks the original
source operation, component, radial argument, eta formal and orders
for every call against the pinned expanded graph.

## Written source bounds and the runtime average

The source proof SAME_DATUM_ANALYTIC_AXIS.md uses the original A.21
pressure and fixed-point comparison

$$
x_0=\left(f_0(Y\chi),-\frac{Y Z_*}{2L}\right),\qquad
\|(\Phi,u)-x_0\|_{B_\rho}\le29Q^{-53}.
$$

The comparison and bound are from (14a) and the construction
preceding it. The original pinned runtime constructs the exact A.21
pressure, the same $Z_*$, and the u radial recurrence of (19). It
defines the actual average coefficients as

$$
\operatorname{average}_n=\frac{u_n}{n+1}\qquad (n\ge0).
$$

The preparer returns that coefficient array under average.
The materializeActualNaturalSeries operation differentiates the
selected original coefficient array in its eta formal, multiplies
each term by $(n)_k$ and evaluates the radial polynomial. The runtime
metadata identifies the whole actual function with the limit of these
exact coefficient sums. Its finite API cap on derivative orders is
recorded separately from the analytic definition.

The original uniformly convergent series and each fixed derivative
converge uniformly on the admitted rectangle. Integration term by
term and coefficient equality give

$$
\operatorname{average}(Y,\eta)=\int_0^1u(tY,\eta)\,dt
$$

including the axis value by continuity. For each $k,m$, differentiation
under the integral gives the integral of
$t^k\partial_Y^k\partial_\eta^m u(tY,\eta)$. Thus the comparison
for the actual average is $-YZ_*/(4L)$, and its error is bounded by
the error bound for $u$ divided by $k+1$.

Equation (16) bounds every live signature on $0\le Y\le41/10$,
$-1\le\eta\le1$ by

$$
29Q^{-53}\rho^{-m}
\frac{(m+k)!}{(m+1)^2 20^k}
\left(\frac{200}{159}\right)^{m+k+1}.
$$

The average uses the extra factor $1/(k+1)$. The exact replay checks
that the coefficient multiplying $Q^{-53}\rho^{-m}$ is below
$2^{12}$ in each case. Hence the raw radius
$2^{-[260(53-m)-12]}$ follows from $\rho^{-1}<Q$ and $Q>2^{260}$.
Each center is differentiated according to its original call.
C139 supplies the radial domain conditionally on the actual chart
premises, including wherever the used native branches are defined.

The comparison for both u and average is linear in Y. For the 17
calls with radial order at least two it vanishes exactly for every
eta. Their actual raw derivatives have the explicit zero-centered
interval with radius $2^{-13508}$ since all 17 eta orders are at
most one. This estimate requires the same-datum source bound and
defined chart conditions. Its endpoints require no numeric pressure
or coordinate values.

## Six explicitly specialized raw values and derivatives

At the literal $Y=4$ and explicit $\eta=0$, the original A.21 pressure
is even by the source representation (2), which uses
$(1+\eta^2)^{-2\theta}$. The pressure terms in $Z_*$ are odd,
including after division by the even function $L$. Substitution
of $U_*=4\eta+j_0$ and $H_*=D\eta+(1-\eta^2)U_*$ gives

$$
(Z_*)_{\mathrm{even}}
=-j_0\big[(A+4)-(16A+4)\eta^2\big].
$$

The normalized even-order comparison derivatives of u therefore
come from the power series of
$2[(A+4)-(16A+4)\eta^2]/(1-2h\eta^2)$ at zero. In eta
orders 0, 2 and 4 respectively, they are

$$
9+2h,\qquad -48-28h+8h^2,\qquad -1152h-672h^2+192h^3.
$$

The corresponding numbers for average are divided by two. Since
$Q>j_0^{-2}$, the error after division by $j_0$ is bounded by
$2^{12}j_0^{97}<h/2$ for all these orders. This is smaller than
the linear shifts in the displayed polynomials for
$0<h<2^{-16004}$. The exact replay checks the signed departure from
the constant terms and encloses each of the six normalized values
between adjacent dyadics of spacing $2^{-260}$. Multiplication by
$j_0$ also places the six actual raw values on their respective signed
side of zero inside the interval of width $2^{-260}$. These are
explicit specializations of source calls #4469, #4483, #9836,
#9839, #80392 and #80395. The other literal eta orders still use
the general symbolic centers.

The 567 enclosures carry the written source premise and the defined
original native chart conditions. General physical evaluation,
the Lean instantiation of the source theorem, original numerical
acceptance and final jet acceptance remain open.

## Replay

~~~text
python -B enclose_all_original_natural.py SAME_DATUM_ANALYTIC_AXIS.md source-profile-data.mjs actual-continuation-exact-core.mjs actual-continuation-exact-functions.mjs actual-leading-stream-primitive-kernel.mjs C139/expanded.json C139/transport-live.json natural-range.json
~~~

RELEASE HOLD.
