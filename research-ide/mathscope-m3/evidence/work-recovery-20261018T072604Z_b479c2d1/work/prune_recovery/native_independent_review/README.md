# Independent review of the new native recovery

This review checks the recovered source bindings and exact arithmetic without
running a source producer or importing the native implementation into the math
review. It does not repeat the implementation's test suite.

The arithmetic review independently reconstructs all thirteen quadratic
component bounds from the original B8 data and C2/I2 contraction formulas. Each
reported component retains its exact system, normalized RHS and complete
definition hash. The bound is the inherited same-root bound beta/(1-q), centered
at zero; it is not a computed RHS integral or a derivative value. The B8
preconditioner remains an approximate preconditioner. Original C2/I2 continuous
matrices are retained.

Both original slow-root calls have the literal residual
`s-Z^2*s^(2h)-T` and original bracket `[1/2,2]`. The bracket is conditional on
source caller arguments, `Z^2<=2`, and certified endpoint signs. The exact
source parameter `0<h<1/16` gives derivative at least `1-8h>1/2` throughout
the bracket. This establishes uniqueness under those conditions; actual caller
boxes were not evaluated by this recovery.

For every one of the fifteen natural derivative pairs, the reviewer sums the
majorant using the Euler differential recurrence for the geometric series,
independently of the implementation's Stirling-number calculation. Exact
rational coefficients agree. The original parameter ASTs give
`Q=2^260*4000000*exp(64020*T)` and
`rho^-1=2^16*4000000*exp(64016*T)`. The integer compression proof is valid.
Actual calls include eta order five, so the largest recorded bound is
`exp(exp(1048599))`. The previous `1048598` form is the eta-order-at-most-four
version of this particular proof; it cannot describe the present inventory.
The report does not assert that a sharper order-five bound is impossible.

The binding subreview independently checks all 1,602 native call identities:
1,013 expression calls and 589 semantic kernels. It checks all 5,184 indexed
rows and their 6,804 symbolic derivative terms with a separate closed
multinomial calculation, plus matrix/parameter normalization and extra literal
source records. Of 425 distinct local recipe operand/formal/body/guard IDs,
411 are outside the exported raw closure. A subsequent source supplement
recovers 429 missing direct records from the broader 453-ID inventory that
also includes outer arguments and derivative-map coefficients. It leaves the
original raw closure unchanged. The independent audit still identifies 418
additional immediate dependencies. These direct records do not supply their
full transitive dependencies, formal derivative bodies, or numerical evaluations.

Review found replay guard gaps in the initial new implementation: missing
absolute source pins, permissive outer registry parsing, and omitted total
indexed derivative-order limits. These were reported to the author and fixed.
The reports pin the reviewed final files. The proof-application cache dependency
was replaced with extraction from the whole-byte-pinned gzip and exact stream
header, so mutable database files are no longer required for that application.

The remaining numerical obligations include lexical caller domains, finite
coefficient errors and full tails, radial Picard collar recurrences, actual
root refinement, covariance and inverse values, formal derivative
materialization, and final-field energy assembly. These reviews close none of
N706, N805, or the final numerical evaluator.

`MATH_SOURCE_REVIEW.json` and `binding_scope/` contain the exact checks and
source pins. `NATIVE_INDEPENDENT_REVIEW_MANIFEST.json` pins the complete review.
