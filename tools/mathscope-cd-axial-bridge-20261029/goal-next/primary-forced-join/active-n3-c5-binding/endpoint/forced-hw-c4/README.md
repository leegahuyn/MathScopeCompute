# Fourth-order transport and projection for two actual mode-two branches

The receipts bind the same-live N3 actual `m=2` branches `0:1` and
`1:1`. They check the original root handles, arithmetic coefficients and
guard evidence used by the following conditional estimates.

1. At fixed label, `H_w` preserves the transverse label coordinate and
   replaces the pulse coordinate by `w`. Its Jacobian column sums are at
   most two and its higher derivatives vanish. Derivatives through order
   four cost at most `2^4` under composition.
2. The six actual projected roots use the negative real orthogonal
   projection of the two pulled-back three-component sources. The recorded
   `C^4` estimate depends on the original normal, source bounds and the
   inverse squared normal.
3. On the admitted annulus the nonzero integer angular carrier gives
   `0 < |n|^(-2) <= 4 Renv^2 / epsilon`.
4. The normal and source coefficient derivatives reduce to the original slow
   chart and frozen-label quantities described in the geometry receipt.
5. The source-defined C8 norm bounds the fifth derivatives of F and G by
   K. Using the same-label assumption for the remaining slow field and
   radial inverse, the weighted receipt gives
   `C*T25*P^16*S^26*epsilon^(-31/2-kappa_s)*W5(H_w)^2`.
   Here P retains the actual frozen carriers and W5 retains the source's
   pointwise weighted derivatives. The tower bound uses the explicit gaps
   of the original K and radial-envelope endpoints.

These bounds assume the admitted fixed-label source domain and its smooth
extension through the required derivatives. Actual directed bounds for all
the remaining coefficients, the matrix propagator and the forced velocity
and pressure are open.

From the workspace root with the archived source trees and receipts restored,
run the five Python files in order `bound_same_live_hw_pullback.py`,
`bound_projected_m2_source.py`, `bound_same_live_normal_inverse.py`,
`reduce_m2_geometry_to_original_background.py` and
`bound_projected_with_background_k.py`. Each script names its pinned source
inputs and writes its receipt under
`work/goal-next/continuation42/forced`.
