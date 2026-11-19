# Original N1 angular velocity and regular-average intervals

**VERIFIED**. The unchanged source runtime reproduced the original
graph prefix and the two registered N1 Picard systems. It bound the
retained actual angular profile \(F_1=\phi_1/C_{\mathrm{Selected}}\)
at #28834 and the regular-average difference
\(K_1=\operatorname{Avg}(U_1)-U_1\) at #117642. It generated the
actual angular value and \(X\)-derivative calls at a positive input
and the \(K_1\) call at the positive edge of the C91 parameter band.
The independent exact arithmetic checks both original angular forcing
roots and the two distinct registered component rows.

**CONDITIONAL**. Use the same ordinary C47 auxiliary analytic coefficient
bound and C54 common-core equality as C90 and C91. With
\(B=2^{20}\), define the positive scale and radius

\[
 M=(\Lambda/j_0)^2/C_{\mathrm{Selected}},\qquad
 \xi_F=\xi_*\frac{M}{1+M},\qquad X_F=\xi_F^2 .
\]

These are original symbolic operands. The strictly positive
\(X_F<X_*<X_a\) lies in the same original core. At \(\eta=0\) and
\(0<X\le X_F\), the following uniformly enclose the angular profile:

\[
 -\tfrac14-\tfrac{56}{B}
 < \frac{F_1(X,0)}{M X}
 < -\tfrac14+\tfrac{56}{B},
 \qquad
 -\tfrac14-\tfrac{218}{B}
 < \frac{\partial_X F_1(X,0)}{M}
 < -\tfrac14+\tfrac{218}{B}.
\]

With \(E=sj_0/[B(1+C)]\) as in C91, the original regular-average
difference satisfies

\[
 -\frac{262253}{1048576}
 < \frac{K_1(X,\eta)}{j_0 X}
 < -\frac{524071}{2097152}
 \quad (0<X\le X_*,\ |\eta|\le E).
\]

## Original angular forcing at the axis

The original leading angular profile at \(\xi=0\) is
\(g=\exp(\Lambda\psi)/C_{\mathrm{Selected}}\), where
\(\psi(0)=0,\ \psi'=\zeta\) and
\(\zeta=-L H_\star/(H_\star^2+\sigma_\star^2)\).
Here \(H_\star(0)=j_0,\ H_\star'(0)=4+D,\ L(0)=1,\ L'(0)=0\).
Set \(e=1/4000000\) since \(\sigma_\star=j_0/2000\). At \(\eta=0\),

\[
 g_0=1/C_{\mathrm{Selected}},\qquad
 \zeta_0=-\frac1{j_0(1+e)},\qquad
 \zeta'_0=\frac{(4+D)(1-e)}{j_0^2(1+e)^2}.
\]

At the axis the original angular forcing is
\(f_4=-2Z_{b-D}Z_b g\), with \(b=-1-h\).
The axis restriction of \(Z_\gamma\) is
\((2\gamma\eta+d\,\partial_\eta)/L\), with \(d(0)=1\) and
\(d'(0)=0\). Its displayed \(\eta\)-multiplication acts on the
profile. Evaluating the force at \(\eta=0\) gives the exact identity

\[
 f_4(0,0)=-2g_0(2b+\Lambda\zeta'_0+\Lambda^2\zeta_0^2).
\]

Both original source derivatives and the original
\(f_4(0,0)/8\) axis slope agree with these formulas by exact arithmetic.
The normalized leading coefficient \(f_4(0,0)/(8M)\) differs from
\(-1/4\) by less than \(1/B\). In fact its error is bounded by
\((2e+5/B^2+4/B^4)/4\), using \(0<h<1/B\),
\(|2b|<4\), \(0<4+D<5\), \(0<j_0<1\), and
\(\Lambda>B^2\). The last comparison follows from the original
profile \(Q>2^{260}\) and \(\Lambda=Q^{64}\).

## Two angular terms and the exact average identity

Write \(T_k=[G(A_0+A_1\partial_\eta)]^kGf\) with
\((G_i h)(\xi)=\xi\int_0^1t^{c_i}h(t\xi)\,dt\).
The source row for \(F_1\) gives \(T_{0,0}=0\) and
\(T_{1,0}=G_0G_4f_4\), with \((c_0,c_4)=(0,3)\).
The C47 coefficient bound \(C/2\) and a circle of radius \(a/2\)
give \(|\partial_\xi f_4|\le C/a\) on \(0\le\xi\le \xi_F\).
The two integrals bound the angular value error around \(X f_4(0,0)/8\)
by \(C\xi^3/(15a)\). For the \(X\) derivative, differentiate the
outer integral and divide by \(2\xi\). Its error around \(f_4(0,0)/8\)
is at most \(C\xi/(10a)\). After normalization the respective errors
are at most \(1/(15B)\) and \(1/(10B)\), since

\[
 \xi\le\xi_F\le
 \frac{a}{1+a}\frac{j_0 M s^2}{B (1+C)^3}.
\]

The C47 word bound on \(|z|\le \xi\) gives a remaining angular value
tail at most \(2(3C\xi/\sqrt{s})^3\). Its normalization by \(M X\)
is at most \(54/B\). The same tail bound on the radial circle of
radius \(\xi\) centered at \(\xi\) uses \(|z|\le2\xi\). Cauchy's
derivative estimate there followed by division by \(2\xi M\)
gives at most \(216/B\). Including the exact initial coefficient
error gives the stated angular intervals.

The distinct source row for \(K_1\) gives
\(\partial_\xi K_1+2K_1/\xi=-\partial_\xi U_1\).
Regularity and the zero axis datum give
\(U_1+K_1=\int_0^1U_1(tX,\eta)\,dt\).
Integrating by parts yields
\(K_1=-X\int_0^1 t\,\partial_X U_1(tX,\eta)\,dt\).
Apply the uniform C91 radial derivative interval at every \(tX\)
and use \(\int_0^1t\,dt=1/2\).

**OPEN**. Other native systems and final recovery of the 67 source
jets. The ordinary coefficient and core-realization premises remain
attached to all three local intervals.

## Reproduction

Run from the workspace root with two fresh output paths.

    $d = 'work/goal-next/continuation92/y/final'
    $c90 = 'work/goal-next/continuation90/y/final'
    $c91 = 'work/goal-next/continuation91/y/final'
    $runtime = 'work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier'
    $archive = 'work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph'
    node "$d/replay_n1_angular_average.mjs" $runtime "$archive/original-source-functions.json" "$c90/core-operands.json" "$c91/derivative-operands.json" "$d/angular-average-operands-repeat.json"
    python -B "$d/verify_n1_angular_average.py" "$d/angular-average-operands-repeat.json" $c90 $c91 "$d/angular-average-intervals-repeat.json"

Replay authenticates the C90 full original-stream receipt through
the pinned original operands and reproduces the original prefix
from the archived runtime. The enclosure uses exact polynomial and
rational arithmetic, two Picard terms, and the normalized C91 interval.
