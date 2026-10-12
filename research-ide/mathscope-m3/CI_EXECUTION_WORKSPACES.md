# M3 execution workspace CI

The workflow `.github/workflows/m3-execution-workspaces.yml` checks the new
Y5/Y6/Y7 and N6/N7/N8 execution paths on pull requests, pushes to `main`, and
manual dispatch. Changes under `research-ide/` trigger it because the new
modules read preserved M0, M1 and M2 runtime and source files. It does not
execute the original M2 completion graphs or change P7.
The pinned `gauge-real-spectral-verification.yml` is also an explicit trigger:
its exact source bytes are part of the packaged Real Lean evidence.

## Environment and commands

The jobs use Ubuntu 24.04, Node 24, Python 3.12, and `numpy==2.3.5`. JavaScript
tests use Node built-ins and relative repository modules; there is no npm
install. The builder uses the Python standard library and the existing static
P8 transport encoder. The M3 static closure separately records two audited
deferred assertion imports in the preserved M2 module cycle. Their exact
source hashes are allowlisted; other cycles, changed source bytes and early
access fail. A focused regression checks private source identity and exception
propagation, and the actual bundled Worker replays all newly added operators.
The source PDF, browser credentials, service secrets, Lean and
Mathlib are not prerequisites for this runtime job. Real Lean verification
continues in `gauge-real-spectral-verification.yml` and `p8-verification.yml`.

Run these commands from the repository root, in this order:

```bash
python -m pip install numpy==2.3.5
python -B research-ide/mathscope-m3/navier/tests/verify-packed-evidence.py --materialize
python -B research-ide/mathscope-m3/web/build_extended.py --check
python -B research-ide/mathscope-m3/evidence/all64-20261012/assessment-source-resume/build_review.py --check
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
recorded source file, all shipped Navier module hashes, and exact
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

## Original-source executions and exact archives

The resumed implementation adds source-bound all-cover signed and five-moment
records, full auxiliary pressure after the five original moment equations,
three-component near-terminal enclosures, a checked original-operator core
restriction, independent exact core refinement, and original cutoff-domain/
exterior-force records. The source temporal inverse retains the exact infinite
Fourier operator, its zero-mode projection and all derivative tail bounds.
The original localization and periodization reviews execute exact operator
identities and retain the unresolved whole-space energy and force hypotheses.
Archive
builders verify the raw receipt and every recorded source/artifact checksum
before including a compact record in the browser. `--check` compares the
generated archive with the committed file and fails stale packaging.

```bash
python -B research-ide/mathscope-m3/navier/tests/build-global-signed-evidence.py --check
python -B research-ide/mathscope-m3/navier/tests/build-global-moment-evidence.py --check
python -B research-ide/mathscope-m3/navier/tests/build-global-moment-pressure-evidence.py --check
python -B research-ide/mathscope-m3/navier/tests/build-near-terminal-evidence.py --check
python -B research-ide/mathscope-m3/navier/tests/build-exterior-force-evidence.py --check
python -B research-ide/mathscope-m3/navier/tests/build-core-restriction-evidence.py --check
python -B research-ide/mathscope-m3/navier/tests/build-localization-operator-evidence.py --check
python -B research-ide/mathscope-m3/navier/tests/build-periodization-review-evidence.py --check
python -B research-ide/mathscope-m3/navier/tests/build-global-temporal-evidence.py --check
```

The finite CI job runs the archive/view guards, independent Fraction core
refinement, the exact auxiliary Fourier kernel, and a new small core-support
proof with independent exact algebra. That proof revalidates the observed
original input archives and does not rerun their large constructors. It
identifies the final field only on the original core restriction and does not
evaluate nonzero annular corrections or the whole-space force and energy.
The localization gate independently expands the full cutoff commutators and
pressure Poisson identity, including nonzero divergence of the force. The
periodization gate checks the original viscosity scaling and disjoint-support
calculus; its comparison theorem remains conditional on the recorded energy,
force and common-data hypotheses. Neither gate issues a completed Theorem C/D.

Heavy original source constructors run in separate matrix jobs: global
moments, full auxiliary pressure, full pressure after the five original
moments, the temporal inverse with differentiated source tails, near-terminal
velocity, and cutoff-domain/exterior force. The original inner-growth
constructor has its own job. Each job preserves its newly executed raw logs,
source byte captures, certificate and independent checks, including failures.
The committed historical receipts are never relabelled as executions of the
new CI commit.

Constructor jobs can each require roughly 4 GiB of resident memory. Run these
jobs serially when sharing an 8 GiB machine. The workflow gives each
constructor a separate hosted runner. Inspect the actual workflow run and
artifact for its observed runtime and outcome; the workflow definition alone
does not prove that a new CI run passed.

After changing Navier modules, refresh only the implementation pin with
`python -B research-ide/mathscope-m3/navier/tests/build-source-inheritance.py --pin-only`.
This records every shipped `.mjs` module without regenerating or changing the
frozen M2 inheritance evidence. Then regenerate the extended browser bundle
and run the freshness checks.

The resumed assessment currently accepts 54 of the original 64 M3 criteria.
The exact nine promotions from the preserved 45-criterion assessment, their
source gates and the ten remaining criteria are recorded in
`M3_ALL64_REVIEW_KO.md` and the `assessment-source-resume` receipt. A gate or
operator marked complete within its stated scope does not complete the
remaining N6 iteration, whole-space N7 estimates or N8 convergence axes.

## Historical local command validation before the resumed source expansion

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
