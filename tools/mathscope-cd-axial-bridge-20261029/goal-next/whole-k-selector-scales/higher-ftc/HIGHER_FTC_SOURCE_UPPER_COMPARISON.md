# Original higher common-selector FTC upper operands

The two higher selector maxima each have five original top-order FTC
clauses. The earlier comparison eliminates the historical terms and
reduces lower derivative maxima to subsets of their top-order maximum.
This calculation bounds the existing original constants from above. Their
source roots and selection recipe stay in use.

## Actual derivative domains

The original `prepareActualOrderInduction` and sealed
`attachActualInductionNorms` produce all ordinary mixed derivative bounds
through total order eight for the exact first three positive tuples.
The literal 123,870-node tuple prefix agrees byte for byte with the
hosted original N2 export. Its 59 native expressions, six Picard systems,
three quadratic systems, two monotone systems and fixed registry fields
agree. The hosted expression records additionally mark 57 bodies with
`historicalBodyPreserved: true`.

On \(X\ge X_a/2\), the source supplies \(E,U,\Pi\) bounds. The
ordinary product rule converts \(E=\sqrt{2X}F\) there to \(F\).
On \(0\le X\le X_a/2\), the actual Picard profile equals the auxiliary
core. The positive coefficient bound is
\[
 r!k!\,\Lambda^r(2/\sigma_n)^k\,M_n^{\rm aux}.
\]
Here \(\sigma_n\) and \(M_n^{\rm aux}\) are its actual strip and solution
norm. The original compact zero extensions cover the remaining Cartesian
profile box. The leading ordinary \(U_0\) bound is global and the separate
\(F_0\) bound covers \([0,X_+]\), exactly the domain used below by higher
positive stresses.

## Analytic comparison of the five clause types

Every FTC face of a derivative uses the original integral of
\(\sqrt{1+f^2}\). If its corresponding ordinary mixed derivative is
bounded by \(M\), its upper bound is the original face volume times
\(1+M\). The zero-dimensional face has volume one. The code retains all
face derivatives, summands, cutoff Euler weights and positive maximum
operands. The normalized pressure rectangle has the four face volumes
\(1,X_+,2,2X_+\). The exact hosted native pressure checks independently
verify every one of 24 order-two and 40 order-three faces and all 30
weighted max terms, including the original cutoff polynomials in \(h\).

For the higher stresses, the original primitive integrals have fixed
lower endpoint \(X_-\), upper endpoint \(X\), and compact support
\([X_-,X_+]\). Their densities are \(2Xr_{n,\theta}/R\) and \(r_{n,z}\).
The code includes every original time, convection, pressure and viscosity
term of these two residuals. The \(Z\) and \(T\) exponent magnitudes are
below four for the source \(h<1/16\), \(n\le3\). This also covers the
second lower axial-viscosity \(Z\). The pressure derivative uses the
original \(\Pi_n\) profile. Every signed primitive is upper-bounded in
absolute value, so the sign disappears only from the inequality.

The zeroth radial derivative of a primitive uses the full length bound
\(X_+\). A positive radial derivative lowers one derivative on the
actual density. All angular derivatives pass under this fixed-endpoint
integral by the source smooth joins. The ordinary denominator bounds
use \(X\ge X_->0\) for \((2X)^{-1}\) and \((2X)^{-1/2}\). Beyond the
compact interval the source itself is zero with matching derivatives.
The velocity average is \(\int_0^1 U_n(tX,\eta)\,dt\), with mixed bound
\(\|\partial_X^r\partial_\eta^k U_n\|_\infty/(r+1)\). The source radial
velocity formula includes \(U_n\), this average, and its \(\eta\)
derivative. Both Cartesian constructions use the exact quadratic chain
rule for \(X=(y_1^2+y_2^2)/2\). They retain all nine original velocity and
potential components and all three pressure and stress components. The
physical derivative recurrence uses the original positive calculus and
ordinary or extra cutoff weights as appropriate.

On the weighted rectangle,
\(\log(X/X_a)\ge t_1/128\) and \(\log(X_b/X)>127\) by the original
continuation. Write \(g=\log(1/\zeta)\) and \(y=\log X\). Its ordinary
\(y\) derivative bounds are
\[
 |\partial_y^j g|\le (j+1)!\left(128^{j+2}t_1^{-j}+4\cdot127^{-j-2}\right).
\]
Unsigned Stirling numbers give bounds in ordinary \(X\), using
\(X^{-j}\le X_-^{-j}\). The positive exponential product recurrence
then bounds every required ordinary derivative of \(1/\zeta\). The
quotient family differentiates the original product \(T_n/\zeta\)
throughout. The direct family takes its base derivative on \(T_n\)
first and differentiates both factors only on the FTC faces. These
produce separate exact upper operands. Total derivative demand is at
most eight, including the two radial derivatives in the stress density.

## Reproduction

`SOURCE_TREE` contains the original Git source blobs. All imported
source modules are compared to the pinned Git revision before execution.
`ORIGINAL_N2` is the extracted source graph from GitHub run 43020929929.

```text
node --max-old-space-size=8192 build_higher_ftc_norm_operands.mjs REPO SOURCE_TREE higher-ftc-norm-operands.json higher-ftc-prefix-capture.json higher-ftc-all-upper-operands.json
python bind_higher_normalized_pressure_ftc.py --original ORIGINAL_N2 --norm-packet higher-ftc-norm-operands.json --prefix higher-ftc-prefix-capture.json --out higher-ftc-pressure-binding.json
node --max-old-space-size=8192 rebuild_higher_ftc_exact_bodies.mjs REPO SOURCE_TREE higher-ftc-all-upper-operands.json higher-ftc-exact-bodies.json.gz
python compare_higher_ftc_exact_bodies.py --original ORIGINAL_N2 --rebuilt higher-ftc-exact-bodies.json.gz --prefix higher-ftc-prefix-capture.json --out higher-ftc-exact-binding.json
node --max-old-space-size=4096 evaluate_higher_ftc_operands.mjs REPO SOURCE_TREE higher-ftc-all-upper-operands.json historical-scale-arithmetic-input.json higher-ftc-all-n2-arithmetic.json 2
node --max-old-space-size=4096 evaluate_higher_ftc_operands.mjs REPO SOURCE_TREE higher-ftc-all-upper-operands.json historical-scale-arithmetic-input.json higher-ftc-all-n3-arithmetic.json 3
```

The current comparison is concerned with the original slow common
selector. Global wave construction, whole-K integration and all 67
final jets have separate evidence obligations.
