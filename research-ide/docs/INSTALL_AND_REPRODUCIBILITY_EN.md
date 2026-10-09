# Installation and reproducibility

## 1. Directory and runtime

Run commands from the directory containing the English README and the three sibling source directories:

- `mathscope-m1`: registry, engine, Worker, CLI, domains, formalization, and evidence.
- `mathscope-m0`: object, session, precision, and evidence contracts used by M1.
- `mathscope-extension`: the shared session-bundle implementation and required supporting file.
- `localization` and `tools`: the English presentation layer and integrity/restoration utilities.

Keep these relative paths. The English launcher and original CLI run on **Node.js 24+**; the original CLI was validated on Node **24.19.0**. Its execution path uses Node's built-in `worker_threads`, filesystem, URL, and crypto APIs. No npm package installation is required for the CLI. Python and Lean are only needed for the optional independent-reference or formal checks that use them.

When this tree is installed inside MathScopeCompute, first change into `research-ide`. The existing Python backend retains its own installation procedure; installing the Node experiment does not alter it.

## 2. Verify before running

```bash
node --version
python3 tools/verify_english_release.py
node tools/mathscope-en.mjs list
```

The Python utility verifies every included original file against the v54 archive selection, the 50 pinned computation sources, the English artifact manifest, the complete set of 70 criteria, and coverage of all 59 example labels. It verifies integrity and translation bindings. It does not run Lean or certify a mathematical theorem.

`SOURCE_TRANSLATION_MANIFEST.json` separates original source/evidence hashes from English document and tool hashes. Do not edit the original files just to translate messages. To change the mathematical engine, make a new version with new pins, fresh computations, and an explicit acceptance assessment.

## 3. List and run examples

```bash
node tools/mathscope-en.mjs list --json
node tools/mathscope-en.mjs run prime-1000 --out ./runs/prime-1000
node tools/mathscope-en.mjs run prime-million --out ./runs/prime-million
node tools/mathscope-en.mjs run p1-p3 --out ./runs/p1-p3
node tools/mathscope-en.mjs run g2-projection --out ./runs/g2-projection
node tools/mathscope-en.mjs run ns-source-pressure-bounds --out ./runs/pressure
node tools/mathscope-en.mjs run ns-axis-source-exact-bounds --out ./runs/axis
node tools/mathscope-en.mjs run ns-source-inner-gluing --out ./runs/gluing
```

Each command is independent. Use a **new output directory**. If omitted, `--out` defaults to a timestamped subdirectory under `m1-output`. Existing directories are never overwritten by `run`.

The original equivalent remains available:

```bash
node mathscope-m1/cli.mjs list --json
node mathscope-m1/cli.mjs run prime-1000 --out ./runs/original-prime-1000
```

The launcher passes `run` arguments directly to this original CLI. It does not change the input or use a separate mathematics implementation. `list --json` includes English and original labels and each **unchanged** request. Its `presentationRequestSha256` checks the exact UTF-8 serialization `JSON.stringify(originalExample.request)`; this is deliberately a separate field from the engine's `inputHash`.

The first prime example returns the 168 primes in [2,1000]. The million example computes 78,498 primes in [2,10⁶]. The projective-line example returns the integral comparison model with free cohomology ranks (1,0,1). All interpretation still depends on the recorded coefficient ring, degree cutoff, precision, and comparison assumptions.

## 4. Read the output files

| File | Content |
|---|---|
| `request.json` | Original mathematical input and normalized precision/budget |
| `environment.json` | Installed Worker SHA-256, engine version, capabilities, and environment hash |
| `result.json` | Domain computation, assumptions, observation definition, finite scope, and error information |
| `replay-bundle.json` | Actual engine export with request, environment, result, hashes, and checkpoint |
| `summary.json` | Terminal status, Worker information, source/input/result/mathematical/bundle hashes, and scope |
| `files-manifest.json` | Byte lengths and SHA-256 for the five preceding files |

`resultHash` binds the full result. `mathematicalHash` follows the engine's recorded semantic hash policy, excluding designated top-level timing statistics. Do not compare unrelated digests as though they use the same serialization or same exclusions.

Imported JSON carries no live execution receipt or proof authority. An existing bundle is a record. `engine.replay(bundle)` starts a fresh calculation in the matching installed environment and compares results. The CLI provides `list` and `run`; **there is no `replay` CLI subcommand**. The evidence includes replay checks through the public `createM1Engine` API.

## 5. Exit codes and incomplete results

| Exit code | Meaning |
|---:|---|
| 0 | `COMPLETED`: the requested bounded calculation completed |
| 2 | `PARTIAL`: computed parts and unresolved conditions are both returned |
| 3 | `PRECISION_REQUIRED` or `BUDGET_EXCEEDED` |
| 4 | `UNSUPPORTED` |
| 130 | `CANCELLED` |
| 1 | Invalid input, execution failure, or file I/O failure |

The gluing example is expected to return 2 at this baseline. Do not rewrite it as success merely to obtain a green CI job. A test script checking that example should assert the expected `PARTIAL` status and its explicit false certification fields.

`Ctrl+C` requests cancellation through the Worker path. Requests retain their declared time, operation, sample, and result-byte budgets. The Worker also has a memory cap. Budget refusal is a supported outcome rather than permission to silently loosen limits.

## 6. Independent numerical and exact-reference checks

Node tests use the built-in test runner. Use **Python 3.12 or later** for the Python verification and follow-up tools. Python references use `mpmath` for high-precision numerical comparisons and `sympy` for independent symbolic calculations. The versions actually used by the local reference environment are recorded in `requirements-reference.txt`. Install them in a separate virtual environment:

```bash
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r requirements-reference.txt
```

These are reference-computation dependencies. The standalone Node CLI has no Python dependency. Upstream Lean builds and archived PDF-rendering scripts have their own environments and are not installed by this requirements file.

Examples of directly reproducible follow-up checks:

```bash
node --test mathscope-m1/navier/followup-construction/axis-certificates.test.mjs
python3 -B mathscope-m1/navier/followup-construction/verify-axis-independent.py

node mathscope-m1/navier/followup-construction/pressure-analytic.verify.mjs
python3 mathscope-m1/navier/followup-construction/pressure-analytic-reference.py

node --test mathscope-m1/navier/followup-construction/axis-source-certificate.test.mjs
python3 -B mathscope-m1/navier/followup-construction/verify-axis-source-independent.py

node --test mathscope-m1/navier/followup-construction/source-inner-gluing.test.mjs
python3 mathscope-m1/navier/followup-construction/source-inner-gluing-reference.py
```

Many original verifier scripts intentionally write their generated fixtures, logs, or receipts into their original working directories. **Run reproduction on a disposable copy** if preserving the frozen tree matters. Re-running a script may change timing fields or generated records even when its mathematical comparison succeeds. Keep the new run separate from the archived baseline and compare the declared mathematical data, versions, and source pins.

The English-layer tests use a temporary output directory and do not modify original members:

```bash
node --test tools/mathscope-en.test.mjs
```

## 7. Lean reproduction has two distinct environments

| Environment | Version and pinned source |
|---|---|
| Local MathScope component checks | Lean 4.34.1, commit `5045d0056413266e57c625dcd7c365b10e377c52`; imported local mathlib commit `d13f23b723b8a846827a245b89c10fc7d3f11612` |
| Original NS C/D and full-build attempt | Lean 4.34.0-rc2, commit `6a10ac8c22beadecabdbb0919c2b50214762f91d`; original mathlib commit `85e3a25e006c35636f0e53b0e9296caca2685bc0` |

The official NS repository is pinned at `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`. Obtain its full checkout and required toolchain/dependencies separately. Only the specifically included unchanged source files, licenses, and audit/reproduction records are in this package. **A packaged `.lean` file and a historical exit code do not amount to a new local build.**

Use the commands and recorded entry path in `mathscope-m1/navier/official-validation/full-pinned-command-results.json` and the immutable snapshot. The original protected Comparator requires an appropriate unprivileged Linux user environment with its expected systemd/DBus facilities. Do not disable its isolation settings to report a passing comparator.

## 8. Browser and backend boundaries

`workspace.html`, `workspace.css`, and `workspace.mjs` integrate with the existing MathScope/M0 navigation and session. They are not a self-contained replacement for the whole deployed page. The Node CLI is independently executable and does not access or alter a user's browser session.

The Python MathScopeCompute backend and this research experiment share a repository, not an automatic runtime bridge. Connecting these workers to HTTP routes, authentication, job queues, or persistent services is an explicit integration change and is not performed by running the CLI or generating this English release.
