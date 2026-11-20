# Actual N1 local Volterra realization on the strict natural core

**VERIFIED**. The unchanged original runtime reproduced the N1 graph
prefix and both registered Picard systems. It checked 78 entries of
the retained standalone actual system against its original shared
kernel and 78 entries after restricting its three original leading
branches to the strict core. The auxiliary matrix and forcing entries
were bound to their registered bodies by the original \(X=\xi^2\)
substitution. Exact Python arithmetic checked all 78 parities, 12
matrix row sums, six forcing bounds, and the intermediate pressure,
angular and axial forcing norms. These use the actual untransformed
source arithmetic for each entry and the recorded original bound
\(C_{\rm aux}\) #117190. The source analytic certificate agrees on
12 exact profile parameter expressions and records 51 exact scalar
checks supporting its written natural-datum theorem.

**CONDITIONAL ON THE ORIGINAL WRITTEN NATURAL DATUM THEOREM**.
The original A.21 pressure and \(B_\rho\) natural realization already
establish the required \((\phi,u)\) natural series. From that source
input the original actual N1 system has a locally unique ordinary
Volterra realization for \(0\le Y<4,\ \eta\in[-1,1]\).
Its value and every fixed mixed derivative agree with the corresponding
analytic auxiliary restriction. This applies on the C95 physical box.
The proof uses the strict natural branches of the original leading
operands, with the continuation endpoint at \(Y=4\) as a left trace.

Put \(a^2=7/\Lambda\), \(s=\rho/(2^{21}Q)\),
\(C=C_{\rm aux}\) and \(M=\exp(9C^2a^2/(2s))\).
For every fixed pair of nonnegative integers \(r,m\), the four actual
even components on the strict core obey

\[
 \bigl|\partial_X^r\partial_\eta^m W_i\bigr|
 \le r!\,m!\,\Lambda^r(2/s)^m\,M,\qquad i=0,1,2,3.
\]

All six components in their source \(\xi\) coordinate obey

\[
 \bigl|\partial_\xi^r\partial_\eta^m W_i\bigr|
 \le r!\,m!\,(2\sqrt{\Lambda})^r(2/s)^m\,M .
\]

These are finite analytic derivative bounds with exact positive scales.
The C95 value and radial derivative intervals retain their endpoints.

## Binding the local source norm

Write \(S_w=\{\eta:\operatorname{dist}(\eta,[-1,1])<w\}\) and
\(\omega=\rho/(8192Q)=256s\). The pinned natural theorem gives
\(\|(\phi,u)\|_{B_\rho}\le Q\). On \(|Y|\le8\) and \(S_{\rho/4}\),
the geometric evaluation factor is
\((1-8/20-1/4)^{-1}=20/7<3\).
The same source polynomials satisfy \(|H_\star|<16\),
\(|H_\star'|<24\) on that tube. Moving from a nearest real point
by at most \(\rho/4\) changes \(H_\star^2\) by less than
\(768\rho/4<\sigma_\star^2/2\). Since \(|L|<2\), the actual
\(\zeta=-L H_\star/(H_\star^2+\sigma_\star^2)\) obeys
\(|\zeta|<64/\sigma_\star^2\). The straight primitive path has
length below two. Thus the original \(g\) satisfies
\[
 |g|\le G_*=\frac{\exp(128\Lambda/\sigma_\star^2)}{C_{\rm Selected}}.
\]

For the original \(F_0=g\phi\),
\(U_0=U_\star+u/\Lambda\), the stored common value bound
\(64Q(1+G_*)\) follows from \(|U_\star|\le41/8,\ Q,\Lambda>1\).
Use the radius-one Cauchy circle in \(Y\) for centers \(|Y|<7\)
and the chain \(\partial_X=\Lambda\partial_Y\).
The stored positive norm \(H\) bounds \(F_0,U_0\) and both
\(X\) derivatives through order two on \(S_{\omega/2}\).

The original natural average divides radial degree \(j\) by \(j+1\),
so it equals \(\int_0^1 U_0(tX,\eta)\,dt\) on the convergent
disc. It is a contraction for each of the same \(X\) derivatives.
On \(S_{\omega/4}\) its first \(\eta\) derivative costs at
most \(4H/\omega\). Substituting in the original \(v_0=V_0/X\)
formula gives the stored common bound \(V=128H/\omega\) for
\(v_0\) and both \(X\) derivatives there. Indeed the largest bound
from \(|\eta|\le33/32,\ |D|\le1/2,\ |d|\le3,\ |L^{-1}|\le2\)
is \(6(33/32)H+24H/\omega\).
For the further \(\eta\) derivatives take a Cauchy circle of
radius \(\omega/16\) on \(S_{\omega/8}\).
This gives \(e_1=16/\omega\) and \(e_2=2e_1^2\), while the
registered coefficient strip \(S_{4s}\) lies inside \(S_{\omega/8}\).

The replay assigns these bounds to the actual leading jet IDs,
carries absolute values through every retained sum and product,
and compares the resulting exact positive coefficient lists.
The original exponent envelope \(E=4+2h\) enters the stored
norms with nonnegative coefficients. The checker compares each
absolute polynomial to the smaller envelope obtained at \(E=4\).
It checks the abstract row-sum bounds as well as the stored exact
identity \(C=2(\mathrm{matrixBound}+\sum_i\mathrm{forcingBound}_i)\).
Thus each of \(\|A_0\|_\infty,\|A_1\|_\infty,\|f\|_\infty\)
is at most \(C/2\) throughout \(|\xi|<a,\ S_{4s}\) in the
ordinary natural realization, where \(Y=\Lambda\xi^2\).

## Local convergence and ordinary derivatives

Use the original \(G_i f=\xi\int_0^1t^{c_i}f(t\xi,\eta)\,dt\)
and \(\mathcal K=G(A_0+A_1\partial_\eta)\).
The exact \(A_1\) mask sends coordinates 0–3 to coordinates 4–5
and annihilates coordinates 4–5. Diagonal \(G\) and every
\(\eta\) derivative preserve these subspaces.
Thus two adjacent \(A_1\) operators cancel in each word even when
the outer derivative lands on the inner coefficient. Among \(k\)
letters at most \(\lceil k/2\rceil\) are derivatives.
Allocate total strip loss \(s\) among them and use Cauchy for each.
For \(m_0=k+1\), \(p\le\lceil k/2\rceil\), the \(m_0\) Volterra factors
give the ordered simplex denominator \(m_0!\). Summing over the at
most \(2^k\) words bounds the term by
\((Ca)^{m_0}\max(1,p/s)^p/m_0!\) on \(S_s\).
These estimates give normal convergence on the auxiliary complex disc
and establish the ordinary integral equation by Cauchy on a smaller
strip. The same factorial estimate applied to the iterated difference
gives uniqueness among locally bounded holomorphic solutions with
the stated zero datum.

For \(x=3(Ca)^2/s\), \(p^p\le3^p p!\) and
\(m_0!\ge p!(m_0-p)!\) give the even bound \(x^j/j!\)
at \(m_0=2j\) and odd bound \(Ca\,x^j/(j+1)!\) at \(m_0=2j+1\).
Their sum is at most \(e^x-1+Ca\,e^x\le e^{3x/2}=M\).
For \(x\ge4/3\) use \(Ca\le\sqrt{x/3}\le x/2\).
For \(x\le4/3\) use \(Ca\le2/3\) and
\(\inf_{x\ge0}(e^{-x}+x/2)=(1+\log 2)/2>2/3\).

Let \(P=\operatorname{diag}(1,1,1,1,-1,-1)\).
The replay checks \(A_\ell(-\xi)=-P A_\ell(\xi)P\) and
\(f(-\xi)=-P f(\xi)\) entrywise. The sum therefore satisfies
\(W(-\xi)=P W(\xi)\). Its first four components are analytic
in \(Y\) on \(|Y|<7\). At \(0\le Y<4,\eta\in[-1,1]\), circles
of radius one in \(Y\) and \(s/2\) in \(\eta\) give the stated
even derivative norm. In \(\xi\) use radius \(1/(2\sqrt\Lambda)\),
since \((2+1/2)^2<7\).

On the original strict real core, every point of every Volterra
radial segment remains in the same three retained natural leading
branches. Their derivatives and all 78 restricted kernel entries
agree with the auxiliary operands. Induction on the literal finite
Volterra words identifies every actual term with the matching
auxiliary term. The analytic local sum therefore realizes the
actual native body and its ordinary derivatives throughout this
core. No continuation across the right side of \(X_a\) is needed
for this comparison.

**OPEN**. Independent formalization of the original written
natural theorem, ordinary matching across and beyond the right
B.26 join, higher orders, and final numerical jet validation.

## Replay

    $p = 'work/goal-next'
    $d = "$p/continuation96/y/final"
    $g = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next'
    $r = "$p/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier"
    $n = "$p/hosted-43055678022-N4/original-whole-k-current-pressure-graph"
    node "$d/replay_n1_local_majorant.mjs" $r "$n/original-source-functions.json" "$p/continuation90/y/final/core-operands.json" "$d/local-majorant-operands-repeat.json"
    python -B "$d/verify_n1_local_majorant.py" "$d/local-majorant-operands-repeat.json" "$p/continuation90/y/final" $g "$d/local-majorant-repeat.json"
