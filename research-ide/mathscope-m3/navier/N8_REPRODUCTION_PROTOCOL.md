# N8 observed selected-run reproduction

This protocol addresses the original N8-08 reproducibility requirement
(Blueprint p. 66) for the runs actually executed on the public v0.3.1 page.
It does not change the acceptance status of any original criterion by
itself. A successful local command is not an observed hosted CI run.

## Observed inputs and declared models

The immutable public inputs are under
`../evidence/all64-20261012/public-v99/`.

| Input | Role | Mathematical scope | Comparison |
| --- | --- | --- | --- |
| `flow-export.json` | Selected run | The executed finite periodic Taylor–Green Fourier model, its stored states, 81 points, four paths, and periodic/core energy observations | Absolute tolerance 2e-12 plus relative tolerance 2e-11; types, fields, array sizes and integer values must also agree |
| `core-refinement-export.json` | Original-source fixture | Exact independent refinement of the authenticated original core restriction | Exact equality of every numerical and structural value |
| `near-terminal-run.json` | Original-source fixture | Authenticated original three-component core enclosures at the specified positive logarithmic times | Exact equality of every numerical and structural value |

The near-terminal input is a saved WebMCP run response. It is not an export
record and is never described as one. The other two files contain actual
exported execution records, including their recorded presentation hashes.
Every input retains its own source manifest and result digest.

The original paper has SHA-256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
The exact original criterion catalog is
`../ORIGINAL_M3_M4_CRITERIA.json`, SHA-256
`bfe0e57b127849a5413414c8e8340ed5592049082fd211d9172a2fce6f219156`.

## Reproduction command

From the repository root, with Node.js and Python installed:

```sh
python -B research-ide/mathscope-m3/navier/tools/reproduce-selected-runs.py \
  --output /tmp/mathscope-n8-new-attempt

python -B research-ide/mathscope-m3/navier/tools/verify-selected-reference.py \
  /tmp/mathscope-n8-new-attempt/N8-flow/N8-flow.json \
  --output /tmp/mathscope-n8-new-attempt/independent-numpy.json
```

The NumPy reference requires NumPy. Hosted CI installs the pinned version
2.3.5 under Python 3.12 and Node.js 24. The receipts record the versions
actually used, including Node, V8, operating system, commit and tree.
For an isolated checkout, pass its absolute path as `--source-root` and
the observation directory as `--observations-root`.

An existing output directory is rejected. Each new attempt records the
launcher, verifier snapshots, declared memory/time limits, process IDs,
observed memory, stdout, stderr, return status and completion timestamps.
The launcher uses a fresh Node process for each fixture, so native Worker
allocator pages are released between fixtures. Each fixture defaults to a
1 GiB owned RSS limit and a 90-second limit. An optional
`--shared-limit-mib` preserves memory reserved for a concurrent source
constructor. Exceeding a resource limit produces a failed receipt; it
does not change the mathematical tolerance or count as a successful run.

## What is checked

The verifier checks every byte in the current shipped build's source
manifest before and after execution, checks the build and Worker bundle
hashes, and snapshots its own source. It validates the saved result digest
and the exact requested input. The only permitted input normalization is
the installed parser's documented omitted `parameters` object becoming
an empty object.

Each fixture is executed both through the current Node source modules and
through the actual shipped Worker bundle. These two current results must
have identical result digests. A separate Worker then replays the fresh
execution record and must return `MATCH`.

The current mathematical payload is compared with the public observation
using the declared tolerance. It includes every computed result and every
sampled field, path and energy value. Display state, claim summaries,
implementation pins and run hashes are verified as provenance separately.
A changed source manifest is reported explicitly. It never authorizes
replay of an old record: fresh execution from its validated input is a
separate action, and `importedAuthorityAdopted` remains false.

For the selected finite flow, the independent Python program reconstructs
the original Taylor–Green Fourier coefficients, applies the separate
closed-form Crank–Nicolson modal recurrence at all accepted times, performs
complex Fourier synthesis at every visible point, checks angular velocity
including the undefined axis, and computes Parseval and independent tensor
quadrature energies. The continuous Taylor–Green comparison has a separate
1e-5 discretization tolerance. It is not a rigorous continuum error bound.

## Required metadata

Each child receipt supplies edition, source binding, constants, basis,
domain, accepted and rejected time schedule, quadrature, truncations,
precision, tails, residual, energy and camera. Complete coefficient arrays,
state history, paths and iteration diagnostics remain in its fresh record.
The receipt also supplies the exact runner commit/tree, source manifest,
build and bundle hashes, verifier source and log paths. The hosted workflow
adds the observed workflow/run identities and keeps these files as a CI
artifact even when a step fails.

The selected public camera has yaw `-0.7200000000000001`, pitch `0.44` and
zoom `1`. Its selected physical point is `0:10`, at
`[pi/4, pi/4, 0]`. The camera is a display observation. It does not alter
the mathematical source or result digest.

The finite flow's residual is its discrete step defect and finite
divergence checks. Its global energy is the full periodic-box integral;
its core energy is an explicitly selected subregion. Neither is the
original localized solution's whole-K energy. Its omitted continuum-mode
tail is not certified. Original-source fixtures explicitly report that
their pointwise/core observations do not compute a whole-space residual
or spatial energy integral. A missing original observable is not filled
with a finite-model number, null or a fabricated zero.

## External acceptance

`.github/workflows/m3-execution-workspaces.yml` runs the mutation guards,
all three fresh-process reproductions and the independent NumPy program.
The recorded workflow definition alone is insufficient: the release review
must observe its execution at the final revision and compare the served
build with that revision.

Public export and replay results, actual camera observations, source
digests and browser failures are retained separately under `public-v99`.
The browser's Blob-download attempt failed; the WebMCP exports succeeded.
The original core record was imported, inspected and recalculated on the
public page. Near-terminal replay also matched there. Additional browser
interactions were interrupted by the browser-control connection; no
unobserved flow import or browser replay is marked successful.

Original N7 whole-K energy, all-space terminal force jets, complete N6
source/class iteration and N8 all-scale adaptation remain their own
explicit obligations. A successful reproducibility gate does not close
those rows or issue a formal proof.
