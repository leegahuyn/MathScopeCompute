# Independent review of original N8-08

Reviewed on 2026-10-12 against Blueprint p. 66, the actual selected-run
verifier, the fixed hosted-CI archive and the public-v99 observations.
This review does not modify the criterion ledger or publish a release.

## Verdict

The observed package satisfies the literal **selected run plus fixtures**
reproducibility obligation of N8-08 for its stated scopes. It contains a
finite periodic Fourier selected run and two authenticated original-core
fixtures, with an actual execution in a different environment at the same
declared tolerances. The row does not additionally require a browser import
and replay of every selected run, or completion of the final nonzero N6
field, its whole-K energy, or all-scale adaptation.

The original row lists edition, commit, constants, basis, domain, time
schedule, quadrature, truncations, precision, tails, residual, energy,
camera and build logs. Its acceptance sentence requires fixtures and a
selected run to reproduce in another environment at the same tolerance.
The separate preceding rows retain the stronger original-field and
all-scale obligations. These are not silently removed by this review.

## Concrete evidence checked

The reviewed manifest is
`evidence/n8-reproduction-20261012/manifest.json`, SHA-256
`f82c98a92ee6f760fe4c5a9a48c0d8fef021e53a7bb7b918d66258308a2d6738`.
The independent read-only command
`python -B tests/build-n8-reproduction-evidence.py --check` passed all 44
archive, job, source, input, metadata and comparison checks. This command
verified the recorded execution; it did not pretend to execute a new run.

The downloaded hosted artifact is 4,936,391 bytes, SHA-256
`9e6defc224572602d85262c682d274478b1088bdfb09332d1e6a05496dd4eab8`.
The retained GitHub observation identifies job `114909653537`, workflow
run `38278478150`, artifact `11760526040`, PR head
`a2105903d23d25f4a8068bd846cb7d7ad6dc4bbe`, and the actual merge-checkout
commit `231bda30c1cf1fb9cae1c3dcfcc8895da4a5e77f`. Their distinction is
preserved. The source manifest covers 523 unchanged shipped files.

| Executed record | Mathematical comparison | Observed result |
| --- | --- | --- |
| Public finite Fourier selected run | Absolute tolerance `2e-12` plus relative tolerance `2e-11`; every value and structure in the complete computation and sampled field/path/energy payload | 16,987 numerical values, maximum absolute difference `1.1102230246251565e-16`, zero mismatches |
| Original core independent-refinement fixture | Exact equality of all numerical and structural values | 2,239 numerical values, zero mismatches |
| Original near-terminal core fixture | Exact equality of all numerical and structural values | 86,487 numerical values, zero mismatches |

Each fixture ran in a fresh direct Node process and in the actual shipped
Worker bundle. The current direct and Worker results matched exactly; a
separate fresh Worker replay returned `MATCH`. The hosted environment was
Node 24.21.0 on Linux, with Python 3.12.15 and NumPy 2.3.5 for the
independent reference. The 14 NumPy checks cover original Taylor-Green
coefficients, all accepted times, independent modal recurrence, Fourier
synthesis, angular velocity, Parseval energy and independent spatial
quadrature. Six mutation controls reject changed models, values and
incomplete replay metadata.

The verifier was inspected: it compares complete result payloads and all
sampled flow/path/energy quantities, enforces exact types, integer values,
object fields and array lengths, and applies the declared tolerance only
to finite noninteger numbers. Source hashes, result digests and presentation
state are checked separately. Historical source records never become new
execution authority.

## Metadata and physical scope

The selected run supplies actual residual data: discrete step defects,
finite divergence observations and the complete accepted/rejected step
history. Its energy data are actual whole-periodic-box and selected-box
integrals, with Parseval and independent quadrature comparisons. These
values are independently reproduced, so the selected run does not satisfy
the residual/energy categories merely by storing nulls or a status label.

The two original fixtures are point/core observations. Their missing
whole-space residual and spatial-energy integral are explicitly recorded
as outside those fixture operations. A finite-model energy is never
substituted for an original-core integral. This is appropriate fixture
metadata, while N7 whole-K energy remains a separate unfinished criterion.

The original coefficients, exact source program identities, positive
logarithmic times, truncation inventories, precision and complete retained
tails remain in the fixture records. The finite flow's continuum tail is
explicitly uncertified. No new continuum error enclosure or full-field
conclusion is produced by matching a computation.

Public flow/core exports and actual camera observations are retained.
The original-core import, inspection and recalculation and near-terminal
replay were observed publicly. A Blob download failed and additional
browser interaction was interrupted; neither is marked successful.
Those failures do not negate the actual exported package or the
different-environment reproductions required by this literal row.

## Release boundary

The reviewed evidence applies to its exact observed source, build and
Worker bytes. The packager correctly requires another reproduction in CI
when a new shipped build is made. The next release must preserve that gate
and match the served build to its release revision. The historic CI result
must not be relabeled as a fresh execution of changed code.

Sources reviewed: `N8_REPRODUCTION_PROTOCOL.md`,
`tools/reproduce-selected-runs.mjs`, `tools/n8-reproduction-contract.mjs`,
`tests/build-n8-reproduction-evidence.py`, the manifest and its fixed CI
archive, and the original acceptance text in Blueprint p. 66.
