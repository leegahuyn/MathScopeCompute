# Original N1 radial and parameter derivative intervals

**VERIFIED**. The unchanged source runtime reproduced the C90 original
graph prefix and the first two registered Picard systems. It differentiated
the retained actual N1 even profile #28835 and generated three native
derivative calls. The actual \(X\) derivative calls are #117737 at the C90
point and #117743 at the positive edge of the parameter interval. The
actual \(\eta\) derivative at the smaller positive radial point is #117749.
The independent Python verifier checks the native argument order, the
exact source coordinates and the original forcing derivative
\(\partial_\eta f_5(0,0)=48\) in both systems.

**CONDITIONAL**. Under the original C47 coefficient domain and C54
ordinary core realization used in C90, set \(B=2^{20}\) and let
\((a,C,s,j_0,\xi_*,X_*)\) have their exact C90 meanings. Define

\[
  E=\frac{s j_0}{B(1+C)},\qquad
  \xi_{\mathrm{small}}=s\xi_*,\qquad
  X_{\mathrm{small}}=\xi_{\mathrm{small}}^2 .
\]

For the actual system 0 component \(U_1\),

\[
 \frac12-\frac{217}{B}
 < \frac{\partial_X U_1(X,\eta)}{j_0}
 < \frac12+\frac{218}{B}
 \quad (0\le X\le X_*,\ |\eta|\le E),
\]

\[
 12-\frac{109}{B}
 < \frac{\partial_\eta U_1(X,0)}{X}
 < 12+\frac{109}{B}
 \quad (0<X\le X_{\mathrm{small}}).
\]

Here \(0<E<1\) and \(0<X_{\mathrm{small}}<X_*<X_a\)
follow from the exact C90 scales, \(0<j_0,s<1\) and \(C>0\).
The auxiliary analytic radial core supplies these enclosures for the
actual system through the same C54 equality of ordinary values and
derivatives. The first interval includes the continuous even-profile
derivative at the axis.

## Exact initial derivative

Set \(c=-A\), \(c-D=-1\), \(L=1-2h\eta^2\),
\(d=1-\eta^2\), and \(U_\star=4\eta+j_0\). At \(\xi=0\) the
\(X\partial_X\) and pressure contributions vanish. Thus
\(f_5(0,\eta)=-2 Z_{c-D} Z_c U_\star\), where the restricted
operator is \(Z_b g=(2b\eta g+d\,\partial_\eta g)/L\).
Writing \(w=Z_cU_\star\), its constant term is \(4\) and
\(w''(0)=16c-8+16h\). Thus

\[
 \partial_\eta f_5(0,0)=-2\bigl[-8+16c-8+16h\bigr]=48 .
\]

The runtime checks the same derivative by point differentiation and
by differentiation followed by substitution. Both original systems
give the same retained axis forcing body.

## Two-term derivative remainder

As in C90, let \(T_0=Gf\), \(T_{k+1}=G(A_0+A_1\partial_\eta)T_k\)
and let \(R\) denote the component-1 sum from \(k=2\). Row 1 gives
\(T_{0,1}=0,\ T_{1,1}=G_1G_5f_5\), and \(c_1=0, c_5=1\).
For \(\xi>0\),

\[
 \partial_X T_{1,1}(\xi,\eta)
 =\frac{1}{2\xi}T_{0,5}(\xi,\eta)
 =\frac12\int_0^1 t f_5(t\xi,\eta)\,dt .
\]

C47 bounds \(|f_5|\le C/2\). For \(0\le\xi\le\xi_*\) the
radial Cauchy circle of radius \(a/2\) lies in the ordinary auxiliary
disc. For real \(|\eta|\le E\) the circle of radius \(s/2\) is
inside the coefficient strip. These yield
\(|\partial_\xi f_5|\le C/a\) and
\(|\partial_\eta f_5|\le C/s\) along the required real paths.
Integration and division by \(j_0\) give an initial
\(\partial_X\) error around \(A\) at most
\( C\xi/(6aj_0)+ C|\eta|/(4sj_0)
 \le (1/6+1/4)/B\).

For every \(\xi\in(0,\xi_*]\) use the radial circle centered at
\(\xi\) with radius \(\xi\), where \(|z|\le 2\xi<a\).
The C47 word bound gives
\(\sup |R(z,\eta)|\le 2(6C\xi/\sqrt{s})^3\) there.
The Cauchy derivative, followed by division by \(2\xi j_0\),
gives a remaining error at most
\(216 C^3\xi/(j_0s^{3/2})\le216/B\).
The exact total certificate around \(A\) is \(2597/(12B)\).
The source fact \(0<h<1/B\) gives the stated radial derivative bounds.

For the centerline parameter derivative, Cauchy in both variables gives
\(|\partial_\xi\partial_\eta f_5|\le2C/(as)\).
The two weighted integrals in \(G_1G_5\) give the initial error
\(2C\xi/(9as)\), after normalization by \(X\), around \(48/4=12\).
On the parameter circle centered at zero of radius \(s/2\), the C47
estimate for \(R\) is \(2(3C\xi/\sqrt{s})^3\).
The derivative estimate and normalization by \(X\) give the tail
\(108 C^3\xi/s^{5/2}\). With \(\xi\le s\xi_*\), these errors are at
most \(2/(9B)\) and \(108/B\), respectively. The exact total is
\(974/(9B)\), giving the stated parameter derivative bounds.

**OPEN**. Ordinary source assumptions for the full coefficient domain,
higher derivatives and the other native systems, and the 67 final jets.

## Replay

Run from the workspace root. Provide two fresh output paths.

    $d = 'work/goal-next/continuation91/y/final'
    $prior = 'work/goal-next/continuation90/y/final'
    $runtime = 'work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier'
    $archive = 'work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph'
    node "$d/replay_core_derivatives.mjs" $runtime "$archive/original-source-functions.json" "$prior/core-operands.json" "$d/derivative-operands-repeat.json"
    python -B "$d/verify_core_derivatives.py" "$d/derivative-operands-repeat.json" $prior "$d/derivative-intervals-repeat.json"

This continuation authenticates the C90 receipt of the full original
node-stream replay and independently reproduces the original prefix from
the byte-pinned runtime. The derivative error arithmetic uses exact
fractions and two original Picard terms, so its cost is independent of
the source index K.
