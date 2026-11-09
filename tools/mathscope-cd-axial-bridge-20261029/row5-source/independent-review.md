# Independent review: original order-one axial AST bridge

## Executed checks

On a separate copy of `check_source_row.py`, using Python 3.12 and SymPy 1.14,
the full source replay completed successfully: 4,420,257 graph nodes; exact
uncompressed JSONL SHA-256
`a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269`;
registry SHA-256
`bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e`.
The independently produced result JSON is byte-identical to the supplied
`source-row.json` (SHA-256
`91bd6bc70bfeb65c88345024348141550d2c1a77f8135e360ae3d0f7d3c8e268`).
All six A0 coefficients, six A1 coefficients and the forcing entry for
Picard system 0 row 5 agree with the independent transcription; the eight
flattened additive terms of raw residual #117045 also have zero symbolic
remainders. The substituted bridge remainder and source v1-average-formula
remainder are zero. The checker source SHA-256 is
`bb3c02ba38b2e46c71d314d8e63f081f0ee51bf2a028456cd46c06412ecc697a`.

The separate copy of `audit_mutations.py` independently replaced #25811 and
#117030 with literal zero *after* graph authentication. Each run terminated
with an `AssertionError` at the corresponding symbolic comparison. Its own
SHA-256 is `9e5cd616d551798f08455fe7a8710c8089aeab0ea8d93bf5df8545e054951995`.
These two tests show detection of those two injected deviations, not every
possible source or interpreter mutation. In addition, the direct algebraic
pressure and radial-viscosity alterations produce nonzero expressions.

The source producer `research-ide/mathscope-m2/navier/actual-continuation-exact-stress.mjs`
constructs exactly the eight axial terms in the same order as the checker,
using `T_(c+lambda1) U1`, four transport terms, `Z_(-2A+lambda1) Pi1`,
the radial Laplacian and the lower-order `-Z_(c-D) Z_c U0`. The original
`actual-continuation-exact-inner.mjs` builds the corresponding matrix and
forcing. Manual source comparison agrees with the checker's arithmetic.
The program's source variable `v1` is the radial factor in `X*v1*U0_X`;
the JSON's symbolic label `V1` at node #29440 is this factor. In the
manuscript's notation the radial coefficient `V1` itself is `X*v1`, so the
labels must not be silently identified.

## Scope and obligations

The `raw_aliases` and `aliases` dictionaries replace actual profile,
derivative, average and viscosity nodes with formal symbolic atoms before
normalization. They preserve node IDs but do not prove that the atoms denote
the asserted actual derivatives or that the independently sourced atoms are
equal. The identity is conditional on all explicitly listed substitutions:
`X=xi²` with nonzero xi, valid radial chain rules, equality of leading
profiles and their derivatives, equality of lower axial viscosity, the
pressure reconstruction, the average identity, nonzero L and defined
operations. The finite syntactic pressure row and v1 formula are checked; the
Picard output satisfying its ODE, differentiation under the average, and
regularity are not established by those syntax checks.

The source producer clips the raw integrand, so the structural identity does
not establish equality of full and clipped residuals, zero total moments,
smooth endpoint jets, physical-native argument/domain conditions, or results
for every recursion order. It does not establish an actual-source
counterexample either. Preserve the distinction between this PASS and the
open analytic/source obligations.

The reproduction uses ordinary `python`, not `python -O`: these scripts use
Python `assert` for integrity checks, which optimized mode disables. The
independent run artifacts are in `work/row5-review2/`; the original files
being reviewed were not modified by this audit.
