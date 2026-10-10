# Independent review of the positive symbolic-lambda C.2 certificate

## Finding and scope

The exact row transformation, whole-cell integration construction, block
implicit-function estimates through two eta derivatives, and lambda-scaled
radial/axial shear bounds are mathematically consistent for the stated
**conditional local correction problem**. The new source's
`lambda = exp(-1000*T)` remains strictly positive. The construction has not
provided the actual incoming five-moment discrepancy from a completed infinite
axis/core and C.12 modulation, and it does not certify a final global profile.

The reviewed immutable certificate is `attempts/0001/certificate.json`, SHA-256
`a76539a30b9900a0275f2cfb25948c5aa13f222e3e578d3d5fb1f81617bccbe7`.
The producer SHA-256 is
`ca7e2890609ed13a04dd2ca68b4ab7d5d5e43067fedbec27958b93f52c016b23`.

`verify_certificate.py` imports neither the producer nor its dyadic arithmetic
module. Its **58/58** independent exact-Fraction checks are preserved in
`fraction-review-001.json`. These include a separate whole-cell step-derivative
calculation, using base-ten rational outward bounds and a different cell grid.
The optional `crosscheck_mpmath.py` performs independent high-precision numerical
diagnostics; such quadrature remains a diagnostic rather than an interval proof.

The original formulas were compared with the supplied Navier–Stokes text:
4.15 (printed p. 28), Corollary A.3/A.4 scaling (printed pp. 128–129), the A.9
reserved intervals, and Proposition C.2 (printed pp. 162–163). The preserved
extracted source text SHA-256 is
`2bc25d7e76b65611bc9d946708c71dc35b254a2e5b293eebc672c491a877b0f4`.
The outer derivation binds the underlying paper SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.

## 1. Exact equivalence with the original five moments

Write `X = X0*x`, where `X0 > 0` is fixed independently of eta, and set

\[
 E_0=K(\eta)x^{-1/2-\lambda},\qquad U_0=0,\qquad K(\eta)>0.
\]

The actual correction is

\[
 \delta U=K\lambda\sum_{j=0}^{1}z_j b_j,
 \qquad
 \delta E=K\lambda\sum_{j=2}^{4}z_j b_j.
\]

All five supports are pairwise disjoint: `[9,9.5]`, `[10,10.5]`,
`[11,11.5]`, `[12,12.5]`, `[13,13.5]`, with the bumps flat at their endpoints.
Thus both cross products between distinct bumps and the product
`delta U * delta E` vanish identically. The latter is why the original
J functional has no quadratic contribution in this particular construction.

Using `H = sqrt(2X)*E`, the original moment increments are

\[
\begin{aligned}
 \Delta M&=X_0K\lambda\sum_{j<2}z_j\int b_j\,dx,\\
 \Delta J&=\sqrt2 X_0^{3/2}K^2\lambda
                    \sum_{j<2}z_j\int x^{-\lambda}b_j\,dx,\\
 \Delta I&=\sqrt2 X_0^{3/2}K\lambda
                    \sum_{j\ge2}z_j\int x^{1/2}b_j\,dx,\\
 \Delta S&=X_0K^2\left[-\lambda\sum_{j\ge2}z_j
                      \int x^{-1/2-\lambda}b_j\,dx
                      +\lambda^2\left(\sum_{j<2}z_j^2\int b_j^2\,dx
                          -\frac12\sum_{j\ge2}z_j^2\int b_j^2\,dx\right)\right],\\
 \Delta C_p&=K^2\left[\lambda\sum_{j\ge2}z_j
                         \int x^{-3/2-\lambda}b_j\,dx
                 +\frac{\lambda^2}{2}\sum_{j\ge2}z_j^2
                         \int b_j^2/x\,dx\right].
\end{aligned}
\]

Each bump has exact mass one. Subtracting the normalized M row from the
normalized J row and dividing by `lambda^2` therefore produces exactly the
weight

\[
 w_\lambda(x)=\frac{x^{-\lambda}-1}{\lambda}.
\]

The five rows in the certificate consequently give precisely
`A_lambda*z + lambda*Q(z) = scaledDebt`. No moment, factor of `sqrt(2)`, or
power of `X0`, `K`, or `lambda` is missing.

This transformation preserves the physical conditioning cost. In particular,
the second transformed debt row divides a difference of normalized physical
moments by **lambda squared**. A well-conditioned transformed U matrix does
not prove that the original incoming discrepancy satisfies that extremely
small physical tolerance. Lambda zero is forbidden for this equivalence.

## 2. Whole-cell remainder and integration

For `x>1`, put `L=log(x)`. The exact integral representation is

\[
 w_\lambda(x)=-\int_0^L e^{-\lambda s}\,ds,
 \qquad
 0\le w_\lambda(x)+L\le\lambda L^2/2.
\]

The latter follows from `0 <= 1-exp(-lambda*s) <= lambda*s`.
For an entire cell `x in [a,b]` and every
`0 < lambda <= 2^-200`, the interval

\[
 [-\log b,\,-\log a+2^{-200}(\log b)^2/2]
\]

contains the exact weight. Similarly,
`1-2^-200*log(b) <= x^(-lambda) <= 1`. The producer retains these positive
remainders as exact fractions before outward dyadic conversion. A remainder
smaller than one dyadic unit expands the enclosure; it is not silently
declared zero.

For width `w=1/2`, the bump is `b(x)=sigma'(t)/w`, with `x=a+w*t`.
The exact continuous integrals become

\[
 \int g(x)b(x)\,dx=\int_0^1 g(a+wt)\,d\sigma(t),
 \qquad
 \int g(x)b(x)^2\,dx=\frac1w\int_0^1g(a+wt)\sigma'(t)\,d\sigma(t).
\]

The measure is positive. The range of each weight on a closed cell times an
enclosure of its nonnegative `sigma(right)-sigma(left)` mass encloses the
whole cell integral. Intersecting the mass's lower endpoint with zero is valid
because monotonicity establishes nonnegativity. The exact unit mass follows
from the fundamental theorem of calculus and is not a sampled quadrature sum.

The producer covers both endpoint collars and the entire middle interval.
Its squared-bump factors `1/w` and `1/(w*x)` match the identities above.
There is no omitted endpoint tail. The endpoint derivative majorants are valid
because on `0<t<=1/2`,

\[
 \sigma'(t)\le4t^{-3}e^{4-t^{-2}},\qquad
 |\sigma''(t)|\le(16t^{-6}+12t^{-4})e^{4-t^{-2}}.
\]

Each displayed majorant increases on this interval, so evaluating the positive
right endpoint bounds a whole collar. Reflection handles the opposite collar.
The exact differentiated logistic formula supplies the interior bounds.

## 3. Uniform implicit root and eta derivatives

The matrices depend on the fixed positive lambda and bump geometry, not eta.
Eta enters only through `K(eta)` and the **scaled debt**. Let `R_U` and `R_E`
be the exact rational preconditioners in the certificate. The assumptions are

\[
 \sup_{\eta\in[-1,1]}
 \|R_U\partial_\eta^k d_U(\eta)\|_\infty\le\beta,
 \qquad
 \sup_{\eta\in[-1,1]}
 \|R_E\partial_\eta^k d_E(\eta)\|_\infty\le\beta,
 \quad k=0,1,2,
 \qquad \beta=10^{-8}.
\]

**These derivatives include differentiation of the divisions by `K(eta)` and
`K(eta)^2` in the scaled debt.** Bounds on derivatives of unscaled moments
alone cannot be substituted here. The debt must be at least C2 for the claimed
C2 root bounds; a smooth debt gives a smooth root by the same local implicit
function argument. Only orders zero through two have quantitative tolerances
in this certificate.

First solve the linear U block. Its residual norm is at most
`z_U=0.0004891393074203144... < 1`; its self-map bound is
`beta+z_U*r_U < r_U`. Then, for that same U root, solve the E block. Its
self-map and derivative bounds are

\[
 \beta+\lambda B_U r_U^2+z_Er_E+\lambda B_Er_E^2<r_E,
 \qquad L_E=z_E+2\lambda B_Er_E<1.
\]

Here `r_U=r_E=10^-6`; all lambda terms are bounded using the positive upper
bound, and `z_E=0.027172616868350073...`. This sequential block argument is
sufficient. The independent audit also verifies that the full block map's
maximum-norm contraction bound is below one.

Differentiating the same equation gives

\[
 u_1=u_2=\frac{\beta}{1-z_U},\qquad
 e_1=\frac{\beta+2\lambda B_Ur_Uu_1}{1-L_E},
\]

\[
 e_2=\frac{\beta+2\lambda B_U(u_1^2+r_Uu_2)
                         +2\lambda B_Ee_1^2}{1-L_E}.
\]

The factor two in each differentiated quadratic term is retained. All four
bounds are strictly below the corresponding radius. These estimates hold for
every eta under the uniform debt assumption, without a finite eta stencil.

## 4. Independent derivative and shear proof

The independent verifier uses 226 closed cells with middle-grid denominator
256, and 60-digit base-ten rational outward rounding for a 40-term positive
exponential Taylor series with a geometric remainder. This differs from the
producer's 88-bit dyadic arithmetic and 898 cells. The independent bounds are

\[
 \|\sigma'\|_\infty<8.600591<9,
 \qquad \|\sigma''\|_\infty<111.377748<128.
\]

Since every support satisfies `1<x<13.5<e^5`, an independent lower bound is

\[
 E_0/K\ge m_0=(1-5\cdot2^{-200})/\sqrt{13.5}>0.
\]

The verifier bounds the square root by separate exact integer comparisons and
then subtracts `2*lambda*r_E*9`. Thus `E/K` remains positive everywhere on
the supports. Because supports are disjoint, at most one bump contributes at
any point; no factor of three or five is missing from the pointwise estimate.

With `alpha=-1/2-lambda`, the exact radial shear variation is

\[
 \delta a=-2\lambda z_j
       \frac{x b_j'(x)-\alpha b_j(x)}{x^\alpha+\lambda z_jb_j(x)}.
\]

On U correction supports, E is unmodified, and
`|b_s| = |2*x*delta U_x/E|`. These formulas give the independent conservative
bounds

\[
 |\delta a|/\lambda<0.050859<1/4,
 \qquad |b_s|/\lambda<0.039506<1/4.
\]

The producer's tighter recorded formulas were independently checked as well:
approximately `0.0397894951` and `0.0309008103`. The independent conservative
bounds do not depend on trusting those tighter step suprema. Since the base
shear is `a0=2+2*lambda`, the corrected radial shear remains strictly above 2.
These facts alone do not bound the full stress-cone quantities, which also
depend on pressure, cumulative moments and eta derivatives of the same profile.

## 5. Physical reservation and remaining completion conditions

The exact first transition changes log E by `-1/5`, the axial interval by
`-T/2`, and the entry transition by `-1/2-lambda/2`, using
`integral_0^1 sigma = 1/2`. Hence the constant-slope interval starts at
`X=XR*exp(T+2)` with amplitude
`Pstar*exp(-T/2-7/10-lambda/2)`, exactly as recorded. Each proposed support has
`0<log(x)<5` and fits its assigned unaltered A.9 reservation. The symbolic
`X0_i` and `e_star_i` therefore refer to the new outer source, while XR remains
a later positive parameter. This is a source binding, not a choice of a
completed global core radius.

Actual N3-05 completion still needs the same source's incoming scaled debt and
its required eta derivatives enclosed inside the proved neighborhood. N3-06
also needs one finite modulation frequency, bounds for the same field's
cumulative moments and pressure, and the stress-cone inequalities on the
remaining regions. The certificate correctly keeps these claims false.
Once the actual five moments are matched while keeping the same axis pressure
datum, the original Lemma 4.4 can propagate pressure and reconstructed-field
equality beyond the patch. This review does not assert that this missing
matching has already occurred.
