# Original N1 solution on the full registered B.26 collar

**VERIFIED**. The unchanged runtime reconstructs the original two six-by-six matrices and six forcing entries. The original N1 registry is exact, including the row diagonal, its zero axis datum, and the formal \((\xi,\eta)\) frame. The six endpoint calls use \(\xi=\sqrt{X_a\exp(t_1/16)}\) at source nodes #24805 and #24806. Both original cutoff coordinates #28819 and #28823 are strictly inside this radial domain. The finite approximant uses two original axis terms to supply the seam data and two explicit restarted terms on the right. Its exact entries use the original leading fields and ordinary definite integrals.

**CONDITIONAL** on the pinned \(B_\rho\), A.21 and C55 ordinary leading realization. The estimates below cover \(X_a\le X\le X_a\exp(t_1/16)\), uniformly on the open strip \(S_{\delta/8}\) of complex points less than \(\delta/8\) from \([-1,1]\). The solution beside the seam uses the actual smoothed B.26 field. For the exact seed, the first correction \(\mathcal K_a T_0\) has norm at most \(2^{46}Q^{-51}t_1\) and the error past two terms is at most \(2^{66}Q^{-77}t_1^2\). Replacing the seam seed by two actual axis terms yields a finite two-plus-two enclosure with absolute error at most \(2^{74}Q^{-77}\). The same error on real \(\eta\) through eight \(\eta\) derivatives is less than \(2^{-15700}\) after the explicit Cauchy factors. Values in the center are expressions with the retained leading analytic functions and quadratures.

## Exact source scale and coefficient bound

Use \(\Lambda=Q^{64}\), \(Q\rho=2^{244}K\), \(K>1\), and \(\delta=\rho/(1024Q)\). Hence \(0<\delta<1\) and \(\delta^{-1}<Q^2\). The pinned profile also gives \(Q>2^{260}\), \(0<t_1\le Q^{-120}\), and \(0<h<2^{-7}\). On \(S_\delta\), the original \(L=1-2h\eta^2\) gives \(|1/L|\le2\) using \(|\eta|\le2\). In this domain \(|D|\le2\) and \(|d|\le5\). The original matrix exponents and the \(Z\) exponents \(b_0,c_0,b_0-D,c_0-D\) have absolute value at most four. This follows from \(A=1/2+h,\ D=1/2-h,\ \lambda_1=2h\).

Write \(\alpha=\sqrt{X_a}=2Q^{-32}\), \(a=\alpha\exp(t_1/32)\). The elementary majorant \(e^x\le 1/(1-x)\) for \(0\le x<1\) gives
\[
 b=a-\alpha<\frac{t_1}{8Q^{32}},\qquad
 a<3Q^{-32}<1,\qquad X\le 5/\Lambda<1.
\]
The source remainder uses a full positive interval since \(t_1>0\).

Take \(\theta=1\) through \(X=X_a\), and \(\theta=t_1\) for the extended interval through \(a^2\). C55 bounds the leading quantities on \(S_\delta\) by
\[
 (|F_0|,|F_{0,X}|,|F_{0,XX}|)\le
 (8Q,16\Lambda Q^2,128\Lambda^2Q^3/\theta),\qquad
 (|U_0|,|U_{0,X}|,|U_{0,XX}|)\le
 (8,Q/4,\Lambda Q/\theta).
\]
At the natural seam the natural and actual fixed derivative data agree. The bound for \(\theta=1\) comes from the natural \(Y\)-derivative bounds and \(Y=\Lambda X\). The upper bound for \(\theta=t_1\) uses the full B.26 formulas. In particular their \(t_1^{-1}\) term occurs in a second radial derivative and does not enter either matrix.

Let \(E=X\partial_X\), \(J=(8,Q,\Lambda Q/\theta)\), and \(\bar U_0(X)=\int_0^1 U_0(tX)\,dt\). For \(0\le j\le2\), \(\partial_X^j\bar U_0\) is bounded by \(J_j\), and its first \(\eta\)-derivative is bounded by \(2J_j/\delta\) on \(S_{\delta/2}\). Using the retained reconstruction of \(v_0\) gives
\[
 |v_0|\le 2^9/\delta,\quad |E v_0|\le 2^9/\delta,\quad
 |v_{0,X}|\le 2^6Q/\delta,\quad |X v_{0,XX}|\le 2^9Q/(\theta\delta).
\]
Cauchy on \(S_{\delta/4}\) gives \(|v_{0,\eta}|\le 2^{11}/\delta^2\). Also \(H_f=F_0+E F_0\) and \(H_u=E U_0\) obey \(|H_f|\le 2^7Q^2\), \(|H_u|\le2Q\).

For either leading profile \(u=F_0,U_0\),
\[
 |(u,E u,E^2u)|\le(2^3Q,2^7Q^2,2^{12}Q^3/\theta)
\]
componentwise, using \(E^2u=Eu+X^2u_{XX}\). For the original \(Z_eu=L^{-1}[2\eta(eu-Eu)+d u_\eta]\), the two coefficients have moduli at most 8 and 16. On \(S_{\delta/2}\), \(|Z_eu|\le2^{11}Q^2/\delta\), \(|EZ_eu|\le2^{16}Q^3/(\theta\delta)\). Here \(E\) commutes with \(Z_e\). A second Cauchy step gives \(|Z_{e-D}Z_eu|\le2^{20}Q^3/(\theta\delta^2)\) on \(S_{\delta/4}\).

Applying the displayed \(v_0\) bounds to the four retained summands of \(\Omega_0/X\) gives \(|\Omega_0/X|\le2^{20}Q/(\theta\delta^2)\). The signed source drive \(p_{\mathrm{known}}=-\Omega_0/(2X)\) is used in both pressure and axial forcing. Bounding the three nonzero forcing rows, including the \(-2\eta Xp_{\mathrm{known}}/L\) operand, gives \(\|f\|_\infty\le2^{24}Q^3/(\theta\delta^2)<2^{24}Q^7/\theta\). The independent rational checker compares every exact matrix row sum to \(2^{15}Q^2/\delta<2^{15}Q^4\). The row entries and forcings are the original retained graph outputs.

## Finite seam and full right interval

Let \(G_l\) be the diagonal integral from a nonnegative left endpoint \(l\), with nonnegative powers \((\tau/\xi)^{c_i}\) for the six original exponents. At zero the source form \(G_0 f=\xi\int_0^1 t^{c_i}f_i(t\xi,\eta)\,dt\) is regular. For a strip loss \(s_\ell=\delta/16\), \(k\) nested integrations on a width \(w\) give an upper bound \(w^k/k!\). Each of the at most \(2^k\) \(A_0\) or \(A_1\partial_\eta\) operator words is estimated from a starting strip by allocating successive Cauchy losses \(s_\ell/k\). Since \(k^k/k!<3^k\), the result for the \(k\)-th term is bounded by the initial norm times \((6M_Aw/s_\ell)^k\), \(M_A=2^{15}Q^4\). The geometric ratio ensures uniform convergence on the smaller strip even with \(\eta\)-derivative operators in the equation. Differentiation on smaller strips is justified by Cauchy.

On the core \([0,\alpha]\), the ratio is bounded by \(r_L=2^{23}Q^{-26}<1/2\). The initial term is bounded by \(2^{25}Q^{-25}\) on \(S_{\delta/4}\). Thus the actual seam trace \(W_a\) is bounded by \(2^{26}Q^{-25}\) on \(S_{3\delta/16}\), and the error in its first two original axis terms is at most \(2^{72}Q^{-77}\). The two core terms are literally generated by the archived actual finite-partial-sum implementation. Equivalence with the auxiliary trace follows from the C97 source agreement through the seam.

On \([\alpha,a]\), the solution with exact seed obeys
\[
 W=T_0+\mathcal K_aW,\qquad
 (T_0)_i=(\alpha/\xi)^{c_i}(W_a)_i+(G_\alpha f)_i,\qquad
 \mathcal K_a=G_\alpha(A_0+A_1\partial_\eta).
\]
Using \(b<t_1/(8Q^{32})\) and the collar forcing bound, \(G_\alpha f\) has norm at most \(2^{21}Q^{-25}\). The \(t_1\) factors cancel in this first forcing integral. Hence \(\|T_0\|\le 2^{27}Q^{-25}\) on \(S_{3\delta/16}\). The right ratio \(r_R=2^{19}Q^{-26}t_1<1/2\) uses the second strip loss, reaching \(S_{\delta/8}\). It gives the displayed \(K T_0\) and exact-trace right remainder. Splitting the original full Volterra integral gives this same equation for C55's actual solution. For uniqueness on the right, estimate an iterated difference using a further loss \(\delta/16\), on which the original and restarted solutions agree. Holomorphy then identifies both on their common strip \(S_{\delta/8}\).

With the two-term finite core seed, the change in \(T_0+\mathcal K_aT_0\) is bounded by \((1+r_R)2^{72}Q^{-77}\). Adding the right remainder gives a bound \(2^{74}Q^{-77}\). For real \(\eta\), order \(m\) multiplies this by \(m!(16/\delta)^m\). The checker computes exact dyadic exponents for \(0\le m\le8\).

**OPEN**. This calculation ends at the actual registered inner endpoint \(\#24805\). The later global compensation, full support through \(X_+\), all recursive orders, and final jets still require separate actual bounds. Quadrature center values, radial derivative error of the finite approximant and the original giant \(K\) native runtime remain unevaluated.

## Replay

    $p = 'work/goal-next'
    $d = "$p/continuation98/y/final"
    $g = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next'
    $r = "$p/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier"
    $n = "$p/hosted-43055678022-N4/original-whole-k-current-pressure-graph"
    node "$d/replay_full_n1_collar.mjs" $r "$n/original-source-functions.json" "$p/continuation97/y/final/b26-restart-operands.json" "$d/operands-repeat.json"
    python -B "$d/check_full_n1_collar.py" "$d/operands-repeat.json" "$p/continuation97/y/final" $g "$d/receipt-repeat.json"
