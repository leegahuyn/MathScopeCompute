# Original N1 pressure and average-difference derivatives

**VERIFIED**. The unchanged original runtime reproduced the C90 source
prefix and both registered N1 systems. The actual pressure profile
#50557 and average-difference profile #117642 produced four typed calls
at positive original source inputs. The archived first-order pressure
forcing #26395 and auxiliary pressure forcing #117532 have the same
axis slope after exact normalization. The A.21 check preserves all 12
finite stages, the infinite prefix and the infinite exterior tail.
The runtime and Python normalize independently while retaining each
ordinary integral as one exact source operand.

**CONDITIONAL**. On the original C47 analytic coefficient domain and
C54 ordinary common-core realization, define \(B=2^{20}\) and use the
C90 scales \(a,s,\xi_*,X_*\). Let \(P\) be the original A.21 pressure
datum and set

\[
 N=12+\tfrac12P''(0)-2A P(0)>12,\qquad
 \xi_P=\xi_*\frac{a}{1+a},\qquad X_P=\xi_P^2 .
\]

At \(0<X\le X_P,\ \eta=0\), the actual N1 pressure component
\(\Pi_1\) satisfies

\[
 -1-\frac5B<\frac{\Pi_1(X,0)}{N X}<-1+\frac5B,\qquad
 -1-\frac{19}B<\frac{\partial_X\Pi_1(X,0)}{N}<-1+\frac{19}B.
\]

On the original C91 small parameter band \(0\le X\le X_*,\
|\eta|\le E=sj_0/[B(1+C)]\), the actual profile
\(K_1=\operatorname{Avg}(U_1)-U_1\) obeys

\[
 -\frac{524941}{2097152}<
 \frac{\partial_X K_1}{j_0}<
 -\frac{130909}{524288}.
\]

On the C91 centerline \(0<X\le s^2X_*,\ \eta=0\), it obeys

\[
 -\frac{12583239}{2097152}<
 \frac{\partial_\eta K_1}{X}<
 -\frac{12582585}{2097152}.
\]

## Exact pressure normalization and signs

The original leading axis fields have \(U_0=U_\star=4\eta+j_0\)
and \(U_{0,X}(0,\eta)=u_1=-Z_\star/(2L)\). The original regular
average has \(\partial_X\bar U_0(0,\eta)=u_1/2\). Substitute these
in the actual \(v_0=V_0/X\) reconstruction at \((X,\eta)=(0,0)\).
It gives \(v_0=-4,\ (v_0)_\eta=2A j_0,\ (v_0)_X=-u_1'(0)/2\).
The exact original \(\Omega_0/X\) expression becomes

\[
 \left.\frac{\Omega_0}{X}\right|_{0,0}
 =4+2A j_0^2-Z_\star'(0),\qquad
 Z_\star'(0)=-4A+2A j_0^2-4(4+D)-P''(0)+4A P(0).
\]

Since \(A+D=1\), the pressure source
\(p_{\rm known}=-\tfrac12(\Omega_0/X)\) has
\(p_{\rm known}(0,0)=-12-P''(0)/2+2A P(0)=-N\).
Direct differentiation of the original forcing \(f_3=2\xi p_{\rm known}\)
at the axis gives \(-2N\). Both source graphs pass the exact reduction.

Write each finite A.21 density as
\(J_i(y)(1+\eta^2)^{-2\theta_i(y)}\), with \(J_i(y)>0\).
The original \(\theta_i\) equals one for five stages, equals
\(1-\operatorname{step}(y/T_f)\in[0,1]\) in the interpolation,
and equals zero for six stages. The checked second derivative at
the axis is \(-4\theta_i J_i\). Every interval has a nonnegative
length. The fixed lengths and \(-4\log h\) have immediate signs
from the pinned profile. For the A.13 wait
\(\log(Q_b/Q_p)/(1-h)\), use \(0<h<e^{-1}\), \(h<\lambda<1\)
and \(\rho=h/256\).
The positive integrating-factor terms give
\(Q_b\ge e^{-(1-h)/2}(1-h)(-4\log h)>1\).
The normalized nonnegative cutoff derivative gives
\(0<Q_p\le e^3\rho/(1-\rho)<27/31<1\).
Thus the wait is positive. The prefix at the axis is \(5\), with
second derivative \(-20\), and the terminal tail is positive and
independent of \(\eta\).
Multiplication by the exact negative factor \(-P_\star^2/2\) therefore
gives \(P(0)\le -5P_\star^2/2<0\) and \(P''(0)\ge 10P_\star^2>0\).
Both strict signs and \(A>0\) prove \(N>12\).

## Two pressure terms and the derivatives of the regular average

The original component-3 diagonal is zero. Its \(A_0\) row
has only the \(F_1\) entry, and the \(A_1\) row vanishes.
Since the first \(F_1\) term vanishes, the first two pressure terms
are \(T_{0,3}=G_3 f_3\) and \(T_{1,3}=0\), where
\((G_3f)(\xi)=\xi\int_0^1 f(t\xi)\,dt\).
\(0<\xi_P<\xi_*<a/B\) and \(X_P<X_a\), so the full radial
segment and a circle of radius \(a/2\) about any point on it are
inside the auxiliary C47 disc at \(\eta=0\).
The \(C/2\) bound for the forcing gives \(|f_3''|\le4C/a^2\).
Taylor at the axis and the exact slope \(-2N\) give

\[
 |G_3f_3+N\xi^2|\le 2C\xi^3/(3a^2),\qquad
 |\partial_X G_3f_3+N|\le C\xi/a^2 .
\]

In the second inequality use \(\partial_X G_3f_3=f_3(\xi)/(2\xi)\).
The C47 remaining word sum starting at index 2 is bounded by
\(2(3C\xi/\sqrt s)^3\). On the circle of radius \(\xi\) centered
at \(\xi\), use \(2(6C\xi/\sqrt s)^3\) instead and differentiate
by Cauchy. After the appropriate \(X=\xi^2\) chain rule, the
remaining normalized value and derivative errors are at most
\(54/(12B)\) and \(216/(12B)\). The first-term errors add
\(2/(36B)\) and \(1/(12B)\). These inequalities use
\(\xi\le a^2 j_0s^2/[B(1+C)^3]\), \(j_0,s<1\) and \(N>12\).

The exact C92 average identity is
\(K_1(X,\eta)=\int_0^1 U_1(tX,\eta)\,dt-U_1(X,\eta)\).
Ordinary C47 radial and parameter regularity allows differentiation
under this fixed finite integral. The \(X\) derivative retains
the factor \(t\). On the centerline the \(\eta\) derivative normalized
by \(X\) retains the factor \(t\) after using the C91 bounds on
\((\partial_\eta U_1)(tX,0)/(tX)\). The endpoint \(t=0\) is
covered by the continuous zero-axis trace. Each target interval
is therefore \((l/2-u,u/2-l)\) from its respective C91
\(U_1\) derivative interval \((l,u)\).

**OPEN**. Other native orders, the ordinary full chart assumptions and
the 67 final source jets.

## Replay

Use the archived original runtime and fresh result paths.

    $p = 'work/goal-next'
    $d = "$p/continuation94/y/final"
    $runtime = "$p/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier"
    $archive = "$p/hosted-43055678022-N4/original-whole-k-current-pressure-graph"
    node "$d/replay_n1_pressure_average.mjs" $runtime "$archive/original-source-functions.json" "$p/continuation90/y/final/core-operands.json" "$p/continuation92/y/final/angular-average-operands.json" "$d/pressure-average-operands-repeat.json"
    python -B "$d/verify_n1_pressure_average.py" "$d/pressure-average-operands-repeat.json" "$p/continuation90/y/final" "$p/continuation91/y/final/derivative-intervals.json" "$p/continuation92/y/final/angular-average-operands.json" "$d/pressure-average-intervals-repeat.json"
