# Original Temporal inverse with two extra derivatives

## VERIFIED

The replay checks the full 4,420,257-node archived source graph, native
registry, original producer and the 58-root physical angle scope receipt.
The two actual centered residuals #4193097 and #4193099 enter registered
native inverses #4311889 and #4360116. Each centered body is its full
raw residual minus the original nested integral on \([0,1]^2\). The
native definition uses the exact zero-Haar-mode gauge, the five
differentiation directions \((R,Z,T,Y_0,Y_1)\), and the original two
torus coordinates in order. Its Fourier coefficient is on a unit
torus. The finite square cutoff remains separate from the native
limit. The desired increments #4417272 and #4417274 are precisely the
corresponding inverses multiplied by \(-c_{i0}^{-1}\).

The replay authenticates the actual common normalization #635063,
base band #635046 and common index #635056. Put \(S=\ell^2\) and
\(T_g=4+\sqrt2\). On the fixed reference chart,
\[
 \ell_b=\ell-2,\qquad
 x=\frac{(1+h)\ell_b\log2-2\log\ell_b}{\log T_g},\qquad
 i_0=\lfloor x\rfloor,\qquad c_{i0}=T_g^{i_0}2^{-(1+h)\ell}.
\]
For \(\delta=x-\lfloor x\rfloor\in[0,1)\), direct substitution gives
\[
 c_{i0}=T_g^{-\delta}2^{-2(1+h)}(\ell-2)^{-2},\qquad
 c_{i0}^{-1}/S<T_g 2^{2(1+h)}<363/16.
\]
The original common domain has \(\ell-2\ge8\) and the same positive
exact \(h=\exp(-8002(\exp(1048576)+10))<1/64\). For the rational bound
use \(\sqrt2<3/2\) and
\(2^{2h}<2^{1/32}<33/32\), since \((33/32)^{32}>2\) by the
binomial theorem. All derivatives in this estimate hold \(\ell\) and
the corresponding reference index fixed.

## CONDITIONAL

Let \(F\) be the actual raw or centered periodic residual for a single
component on the fixed slow/common-torus chart. Assume \(F\) is
jointly \(C^{r+2}\) there, with the torus derivatives periodic
through the required order. Define
\[
 M_r=\sup_{(R,Z,T)}
   \max_{\substack{|\alpha|\le r\\ j=0,1}}
   \|\partial_{Y_j}^2 D^\alpha F(R,Z,T,\cdot)\|_{L^2(\mathbb T^2)}.
\]
Here \(D^\alpha\) ranges over the five native directions. The Haar
measure has mass one, so the \(C^{r+2}\) maximum norm bounds \(M_r\).
Centering leaves every nonzero Fourier coefficient unchanged.

For \(k\in\mathbb Z^2\), \(n=|k|_\infty\), set
\(\lambda(k)=(\sqrt2-1)k_0+k_1\) and \(D=2+\sqrt2\). At \(k\ne0\)
the multiplier of the exact original inverse is
\((2\pi i\lambda(k))^{-1}\). With \(u=k_1-k_0\), \(v=k_0\),
the integer quadratic norm of \(u+v\sqrt2\) is \(u^2-2v^2\).
It is nonzero by evenness descent and has absolute value at least
one. Since \(|u-v\sqrt2|\le Dn\), we have
\(|\lambda(k)|^{-1}\le Dn\).

The small divisors in the whole frequency square also satisfy a
spacing estimate. For distinct \(k,l\) with \(|k|_\infty,|l|_\infty
\le N\), applying the same bound to \(k-l\) gives separation
\(1/(2DN)\), including separation from the zero frequency. Thus the
\(j\)-th positive value and the \(j\)-th negative absolute value
are at least \(j/(2DN)\). Consequently
\[
 \sum_{0<|k|_\infty\le N}|\lambda(k)|^{-2}
 \le 2(2DN)^2\sum_{j\ge1}j^{-2}\le16D^2N^2.
\]
For the omitted square \(n>K\ge1\), apply this estimate on each
dyadic block \(2^tK<n\le2^{t+1}K\). Then
\[
 \sum_{n>K}n^{-4}|\lambda(k)|^{-2}
 \le \sum_{t\ge0}\frac{64D^2}{2^{2t}K^2}
 =\frac{256D^2}{3K^2}.
\]
The shell \(n=1\) has sum \(12+6\sqrt2<21\), so the entire
nonzero square sum with weight \(n^{-4}\) is at most
\(21+256D^2/3\).

For each \(k\ne0\) choose \(j(k)\) with \(|k_{j(k)}|=n\).
Twice integrating \(D^\alpha F\) by parts in that variable yields
\[
 \left|\frac{\widehat{D^\alpha F}(k)}{2\pi i\lambda(k)}\right|
 \le \frac{n^{-2}|\lambda(k)|^{-1}}{(2\pi)^3}
 \left|\widehat{\partial_{Y_{j(k)}}^2D^\alpha F}(k)\right|.
\]
The sum of squares of the last coefficients is at most \(2M_r^2\)
by Bessel on the two disjoint frequency subsets. Cauchy–Schwarz and
the dyadic estimate give the full and omitted \(C^r\) norm bounds
for the inverse with respective constants
\[
 \frac{\sqrt{2(21+256D^2/3)}}{(2\pi)^3},\qquad
 \frac{\sqrt{512/3}\,D}{(2\pi)^3K}.
\]
In particular all derivative sums through order \(r\) converge
absolutely, uniformly wherever \(M_r\) is uniform. They give the
native Fourier limit. For \(r\ge1\), termwise differentiation
verifies \(N N^{-1}F=F-\operatorname{Haar}(F)\). Uniqueness in the
zero-mean class follows from the same nonzero mode symbols.

With the actual factor \(-c_{i0}^{-1}\), these imply
\[
 \|\Delta_{\mathrm{desired}}\|_{C^r}\le5S M_r,\qquad
 \|\Delta_{\mathrm{desired}}-\Delta_{\mathrm{desired},K}\|_{C^r}
 \le\frac{5S}{K} M_r .
\]
The rational upper coefficients before rounding to five are
\(5687/1152\) and \(2783/576\). For the exact comparison
\(\pi>3\), the first eight terms of
\(4\int_0^1(1+t^2)^{-1}dt\)'s alternating geometric expansion
give a rational lower bound greater than three. The exact checker
tests these rational inequalities and 148,224 integer modes.
The unbounded estimate follows from the spacing proof.

Thus the desired angular/axial temporal increments need \(C^3\)
input for \(C^1\) output and \(C^4\) input for \(C^2\) output, two
fewer derivatives than the original sufficient pointwise mode
estimate. The original exact native limit and source tail code
remain in use. The improved bound is independent analysis of that
same limit. For the retained slow-time term
\(-\epsilon\partial_T\Delta v\), use the desired bound at order
\(r+1\), which needs \(C^{r+3}\) of the actual residual and has the
extra fixed multiplier \(\epsilon\). The estimate preserves any
available bound depending only on the slow point, with the added
factor \(S\).

## OPEN

The actual input \(M_1,M_2\), including joint slow/shell derivative
definedness, the uniform weighted source seminorms, and the repaired
graph's input body provenance require separate evidence. The
source proof for the physical meridional increment still uses the
complete \(T_1\) potential, radial derivative, and actual \(A_1\)
cutoff. The improved desired-velocity estimate does not provide
their radial normalization, weighted whole-integral identity,
or flat estimates. A slow exterior where the input vanishes for
all torus arguments is preserved by this inverse. Auxiliary
support at individual torus points is a different condition.

## Replay

Use the adjacent \(\texttt{f1-mean}\), \(\texttt{f1-regularity}\),
\(\texttt{flat}\), and \(\texttt{flat-palette}\) directories.
Run with assertions enabled against the original graph and Git
objects.

```text
python check_temporal_regular.py --repo MATHSCOPE_CHECKOUT --graph-dir ORIGINAL_GRAPH_DIRECTORY --output temporal-regularity-receipt.json
```
