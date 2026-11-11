# M4 original criterion evidence from 2026-11-11

The original acceptance text is recorded at
`research-ide/mathscope-m4/recovery-20261019/ORIGINAL_M4_CRITERIA.json`
in commit `9595b4de5a1065b694d225c0ad2a14d5aa4435a9`. These runs cover
five individual criteria. The finite fixtures and conditional Lean targets
retain the mathematical scopes specified in their input and output records.

| Criterion | Observed evidence |
| --- | --- |
| I3-01 | Lean compiled the six M4 modules and two inherited M0 modules. The unconditional gate checked the transitive axiom dependencies of 184 exported MathScope declarations. Importing Open or Conditional separately failed the gate. Importing a new theorem that uses a synthetic user axiom failed the same gate and reported the dependency. |
| I3-02 | Lean checked the original differential, bracket, prime, and holonomy modules together with the new exact `p=2` quotient precision and nonidentity semilinear chain map over `Int × Int`. The finite fixture compiled. An invalid prime claim for 21 and a same-width numerator claim failed. |
| I3-03 | Six analytic assumptions have explicit domains, norms and quantifiers. The three actual M4 analytic targets are bound to compiled source and logs. Four unused adapter specifications are OPEN. |
| R1-01 | All 13 prescribed cases ran in fresh Workers and agreed with their corresponding local executions and the immutable fixture manifest. Exact normalized input, Worker, mathematical result, and invariant hashes were matched. For the 96 exterior points the largest Cartesian velocity error upper bound was (4.75087\times10^{-11}), inside the requested (10^{-8}) absolute tolerance. |
| R1-02 | Separate changes in p-adic precision, exact rational tail degree, spatial grids, lattice spacing and extent, and sample counts produced a finite refinement table. The fixed physical BPST box bounds passed and a deliberately violating row failed. Six pseudorandom SU2 replica runs passed the 12 predeclared conditional Gaussian checks against deterministic Bessel reference intervals. |

## I3-01 GitHub execution

The GitHub workflow compiles the actual repository blobs at the checked-out
commit, on the official Lean 4.34.1 core toolchain. The six required M4
modules are Defs, Finite, Analytic, Comparison, Conditional and Open. The
Lean environment records imported defining modules and the compiler's
transitive axiom collector provides the axiom dependencies. The allowlist
contains `propext`, `Classical.choice`, and `Quot.sound`.

The standalone Conditional build lists
`MathScope.M4.Conditional.assumedComplete` for
`MathScope.M4.Conditional.assumed_cauchy_limit`. The unconditional gate
rejects Conditional imports, Open imports, and user axioms from any
exported declaration's transitive dependency closure. The control
`(0 : Nat) = 1 := by rfl` also fails elaboration.

The first GitHub attempt reached the original module builds before the
audit helper exceeded its memory cap. The successful run narrows the Lean
imports and increases the cap only for the helper and probes. The original
Lean modules and their compiler limits are the same in both runs.
[Failed run 42995412528](https://github.com/leegahuyn/MathScopeCompute/actions/runs/42995412528)
and [successful run 42995742694](https://github.com/leegahuyn/MathScopeCompute/actions/runs/42995742694).

The finite acceptance extension compiled in run 42996997312. Its separate
positive fixture and both rejected controls have exact source and log hashes.
The generic theorems cover all integers at `p=2` and the displayed product
complex. The other imported theorems retain their original finite statements.
[GitHub run 42996997312](https://github.com/leegahuyn/MathScopeCompute/actions/runs/42996997312).

Repository paths for the workflow and its scripts:

- `.github/workflows/mathscope-m4-closure-20261111.yml`
- `tools/mathscope-cd-axial-bridge-20261029/m4-closure/M4ClosureAudit.lean`
- `tools/mathscope-cd-axial-bridge-20261029/m4-closure/run_closure.py`

## R1-01 and R1-02 reproduction

Run the unchanged historical verifier from the original checkout with
Node 24.18.0. Pass an unused output directory in the workspace.

```powershell
node research-ide/mathscope-m4/release-lab/verify-fixtures.mjs --out <new-replay-directory>
```

Run the scripts from this evidence directory, using the same checkout as
`REPO` and the emitted `manifest.json` as `REPLAY_MANIFEST`.

```text
node r1_worker_acceptance.mjs REPO REPLAY_MANIFEST R1-01_RECEIPT.json
node r1_refinement_acceptance.mjs REPO REPLAY_MANIFEST R1-01_RECEIPT.json R1-02_RECEIPT.json
node r1_spatial_grid.mjs REPO R1-02_RECEIPT.json R1-02_SPATIAL_GRID.json
```

`r1_worker_acceptance.mjs` authenticates the historic manifest and
observed source closure, compares a second clean Worker run of each case,
and checks the additional finite numerical bounds. The catalog's Git
blob and Windows checkout use different line endings and have equal
parsed contents. Its loaded-module ledger records the exact byte hashes
and distinguishes exact byte equality from line-ending normalization.

The exterior Worker uses the approximate adaptive Simpson value path.
The acceptance calculation uses separate certified interval quadrature,
monotonicity of the positive heat integral in Z, and directed propagation
through the exterior profile at each emitted finite coordinate. The
Taylor–Green energy and dissipation checks use outward exponential
bounds. These are finite error bounds of the declared fixtures. The
sampled exterior and axis models have their existing local domains.

`r1_refinement_acceptance.mjs` reads the exact p-adic residue and series
tail observations, executes the declared BPST box and one-link SU2
Worker jobs, and records both deterministic bounds and separate
autocorrelation-aware statistical estimates. The three replica seeds at
each sample count are fixed before execution. Approximate Gaussian
coverage is conditional on stationarity and the reported diagnostics.
The deterministic reference is an outward Bessel enclosure. The average
estimated mean standard errors at 12000 and 24000 retained samples were
0.00780264 and 0.00549518. The corresponding average effective sample
sizes were 2674.23 and 5429.38.

`r1_spatial_grid.mjs` evaluates the same fixed-time Taylor–Green
benchmark at K=4 and K=8. Exact integer sums of squared trigonometric
values on both grids give the same mean as continuous integration.
Directed summation of the emitted velocities encloses the numerical
mean. Both computed discrepancies are below (10^{-14}).

## Remaining criteria

The repository evaluator accepted the reviewed candidates for I3-01, I3-02,
I3-03, R1-01 and R1-02. It rejected a one-byte alteration to a raw artifact and a
scope alteration for each candidate. Serialized copies of the five receipts
were also rejected. The exact outcome is in `authoritative-assessment.json`.
The assessment has `canFreeze=false` and `publicationConfirmed=false`.

I3-04–I3-08 require their reference adapters, parameter-specific job rechecks, proof UI audit,
research-boundary tests and claim presentation evidence. R1-03–R1-07
require corresponding application paths and independent interaction
evidence. R1-08 requires its actual post-publication receipt. The observed
M4 criterion evidence and the remaining M3 whole-K gates are independent.
