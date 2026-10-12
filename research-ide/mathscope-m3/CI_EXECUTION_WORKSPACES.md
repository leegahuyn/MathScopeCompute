# M3 execution workspace CI

The workflow `.github/workflows/m3-execution-workspaces.yml` checks the new
Y5/Y6/Y7 and N6/N7/N8 execution paths on pull requests, pushes to `main`, and
manual dispatch. Changes under `research-ide/` trigger it because the new
modules read preserved M0, M1 and M2 runtime and source files. It does not
execute the original M2 completion graphs or change P7.
The pinned `gauge-real-spectral-verification.yml` is also an explicit trigger:
its exact source bytes are part of the packaged Real Lean evidence.

## Environment and commands

The job uses Ubuntu 24.04, Node 24, Python 3.12, and `numpy==2.3.5`. JavaScript
tests use Node built-ins and relative repository modules; there is no npm
install. The builder uses the Python standard library and the existing static
P8 bundler. The source PDF, browser credentials, service secrets, Lean and
Mathlib are not prerequisites for this runtime job. Real Lean verification
continues in `gauge-real-spectral-verification.yml` and `p8-verification.yml`.

Run these commands from the repository root, in this order:

```bash
python -m pip install numpy==2.3.5
python -B research-ide/mathscope-m3/web/build_extended.py --check
node research-ide/mathscope-m3/gauge/tests/verify_transport.mjs
python -B research-ide/mathscope-m3/gauge/tests/verify_package_guards.py
python -B research-ide/mathscope-m3/web/tests/test_extended_build.py
node --test --test-reporter=tap research-ide/mathscope-m3/web/tests/extended-worker.test.mjs
node --test --test-reporter=tap research-ide/mathscope-m3/gauge/tests/*.test.mjs
node research-ide/mathscope-m3/gauge/verify_runtime.mjs
node research-ide/mathscope-m3/navier/tests/run.mjs
python -B research-ide/mathscope-m3/navier/tests/independent_numpy.py
```

The workflow additionally checks the three frozen M2 receipt hashes, every
recorded source file, the six current Navier implementation hashes, and exact
agreement of the JSON and JavaScript source inheritance records. These are
read-only checks. It deliberately does not run `build-source-inheritance.py`
as a generator: generation changes `baseCommit` to the current checkout and
would rewrite the authority records under test.

Two focused packaging gates protect the recorded Lean evidence. The source
transport test reproduces the observed WebsitePublisher Unicode-escape
mutation and requires every decoded proof-source hash to stay exact. The
package guard runs only in a temporary source copy: it accepts unchanged
receipts and rejects altered finite/Real Lean sources, compiler logs and the
import closure. These tests need the checked-in audit sources, logs and
`y7-real-attempt3-38215697672.zip`; they do not run Lean or contact a publisher.

## What a passing run establishes

The committed Worker bundle must match its source and original criterion
records before any test writes a new receipt. Tests then execute numerical
models, reject altered assumptions and replay data, verify selected source
points and display contracts, and compare the newly generated Navier Fourier
output with an independent NumPy implementation and exact Taylor-Green energy.
Gauge correlation recomputation uses the saved production samples; it does
not repeat those long production chains. The small seeded chains in the
runtime tests and public examples are new executions.

Test logs are uploaded even on failure. Fresh result JSON files are collected
only after all execution steps pass, so an interrupted run does not present
old checked-in receipts as new CI results. Numerical success does not close
the remaining original criteria, N6/N7 reconstruction, PDE error enclosures,
Yang-Mills continuum obligations, or new Lean kernel obligations. Browser
route, rendering and accessibility checks remain a separate release gate.

## Updating a release

Some tests overwrite evidence JSON inside the disposable checkout. Inspect
new results before deliberately updating released evidence. After approved
engine, UI, progress or source changes, regenerate the bundle with
`python -B research-ide/mathscope-m3/web/build_extended.py`, then rerun
`--check`. The CI job fails a stale committed bundle; it never rebuilds that
bundle to make the freshness check pass.

## Local command validation on 2026-10-12

The commands were executed in an isolated copy with Node 24.19.0, Python
3.12.14 and NumPy 2.3.5: gauge tests 26/26, public gauge examples 13 with
session replay `MATCH`, Worker tests 9/9, original-criteria builder tests 9/9,
Navier checks 36/36 with 11 matching example replays, and NumPy checks 4/4.
The read-only audit matched three frozen M2 receipts, 250 source entries and
six Navier implementation files. The added source transport gate matched all
45 decoded source hashes. All six isolated package-guard processes produced
the expected result, and the original sources and receipts were unchanged.
The YAML and all shell steps parsed, and
receipt collection completed. The isolated copy's bundle was generated once
before its freshness check because the shared release was still being
edited. These are local executions, not a claim that GitHub Actions or the
live browser release already passed.
