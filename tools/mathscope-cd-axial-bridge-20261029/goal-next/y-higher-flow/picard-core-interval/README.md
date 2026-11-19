# One original native N1 velocity value on its radial core

**VERIFIED**. The archived original N4 registry and its full 7,358,162-node
stream identify the N1 actual radial equation and its separate natural
auxiliary equation. The unchanged runtime generates the two native terms and
the node for the original actual even profile #28835 at a strictly positive
source-defined radius and eta=0. Exact substitution of the axis into the
two original axial forcing roots #26744 and #117624 gives the same
expression. Independent rational polynomial normalization gives
\(f_5(0,0)=4Aj_0\), with \(A=\tfrac12+h\) and \(j_0=h^4>0\).
The original axis slope independently normalizes to \(Aj_0\).

**CONDITIONAL**. Under the pinned C47 ordinary coefficient analyticity and
source norm estimates and the C54 ordinary realization on the common core,
the actual native value obeys

\[
 \frac{524233}{1048576}
 < \frac{U_1(X_*,0)}{j_0 X_*}
 < \frac{524344}{1048576}.
\]

Here \(U_1\) means zero-based component 1 of actual N1 system 0.
The absolute interval multiplies both endpoints by the exact positive value
\(j_0X_*\). The chart point and scaling use the original auxiliary N1
operands \((a,C,s)=(\#117625,\#117190,\#117103)\):

\[
 \xi_*=\frac{a}{1+a}\frac{j_0s^2}{2^{20}(1+C)^3},
 \qquad X_*=\xi_*^2,\qquad Y_*=\Lambda X_*.
\]

The original profile gives \(0<h<2^{-20}\), \(0<j_0<1\),
\(Q>1\), \(\Lambda=Q^{64}\), and
\(s=\rho/(2^{21}Q)\in(0,1/2)\). The C47 source coefficient bound has
\(C>0\). Since \(a^2=7/\Lambda\), \(\xi_*<a/2^{20}\) and
\(0<Y_*<7/2^{40}<4\). Thus \(0<X_*<X_a\), where the
C54 source comparison makes the ordinary auxiliary value agree with
the original actual value before the cutoff starts.

## Two-term enclosure

Let \(G_i g(\xi)=\xi\int_0^1t^{c_i}g(t\xi)\,dt\) and
\(T_k=[G(A_0+A_1\partial_\eta)]^kGf\). The native source row for
component 1 has \(f_1=0,\ c_1=0,\ A_{1,1j}=0\), and the only
nonzero \(A_0\) entry in that row is \(A_{0,15}=1\).
Since \(c_5=1\), the two generated terms satisfy
\(T_{0,1}=0\) and \(T_{1,1}=G_1G_5f_5\).

On the original auxiliary complex radial disc \(|\xi|<a\) at
\(\eta=0\), C47 bounds \(|f_5|\le C/2\). Each circle of radius
\(a/2\) centered at \(u\in[0,\xi_*]\) lies in that disc. Cauchy's
estimate gives \(|\partial_\xi f_5(u,0)|\le C/a\). The inner
weighted and outer unweighted radial integrals then give

\[
 \left|T_{0,5}(u,0)-f_5(0,0)u/2\right|\le Cu^2/(3a),
 \qquad
 \left|T_{1,1}(\xi_*,0)-Aj_0\xi_*^2\right|
 \le C\xi_*^3/(9a).
\]

For \(m=k+1\ge3\), the C47 word estimate on the smaller radial
disc gives \(|T_{k,1}(\xi_*,0)|\le
[3C\xi_*/\sqrt{2sm}]^m\le r^m\) with
\(r=3C\xi_*/\sqrt s<3/2^{20}<1/2\). The tail beginning with \(k=2\)
is bounded by \(2r^3\). Dividing by \(j_0\xi_*^2\), the Cauchy
error is at most \(1/(9\cdot2^{20})\). The tail is at most
\(54/2^{20}\), using \(C^3/(1+C)^3<1\) and \(\sqrt s<1\).
The total error around \(A\) is at most \(487/(9\cdot2^{20})\).
Adding the source bound \(h<2^{-20}\) gives the reported rational
interval. The two term count and error apply to this chosen radius.

**OPEN**. The standalone unconditional ordinary realization assumptions,
enclosures at other native source inputs, derivative and external
primitive realization, and the 67 final source jets.

## Reproduction

Run from the workspace root. The two output names must be fresh.

    $d = 'work/goal-next/continuation90/y/final'
    $archive = 'work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph'
    $runtime = 'work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier'
    $prior = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next'
    $scope = "$prior/axial-order-one-identity/general-source-picard"
    node "$d/replay_core_value.mjs" $runtime "$archive/original-source-functions.json" "$d/core-operands-repeat.json"
    python "$d/verify_core_interval.py" "$d/core-operands-repeat.json" $archive 'work/goal-next/continuation89/y/final/picard-tail.json' "$prior/axial-picard/ORIGINAL_PICARD_ANALYTIC.md" "$scope/source-picard-scope.json" "$scope/SOURCE_PICARD_SCOPE.md" "$d/core-interval-repeat.json"

The Python script authenticates the full original graph stream and checks
the compact operand extraction and interval arithmetic with exact fractions.
The archived ordinary coefficient and convergence proofs are pinned
dependencies of the interval. Only two terms are needed even when the
original source index \(K\) is enormous.
