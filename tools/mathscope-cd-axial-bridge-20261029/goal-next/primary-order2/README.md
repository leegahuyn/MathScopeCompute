# Original primary order-2 hosted construction

GitHub Actions [run 43035074273](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43035074273) completed the native C5/C3/order-2 construction. The offline replay authenticates the four native program hashes and their source attachment. The finite order-2 source class covers the original primary current. Its use for the corrected first Forced input requires the same-source join and actual uniform forcing estimates.

## Install and dispatch

Copy this directory, excluding its `.github` folder, to `tools/mathscope-cd-axial-bridge-20261029/goal-next/primary-order2` on the evidence branch. Copy `.github/workflows/mathscope-primary-order2.yml` to the repository `.github/workflows` directory. The workflow is manually dispatched and runs only on `mathscope-cd-axial-source-bridge-20261029`. It creates a separate checkout of exact original commit `f8cb4034e86d7b669d52a6f2248aebba156b51b5`, without changing the existing operating source. The primary source files at this reference match the historical pinned implementations; this does not itself identify the generated graph with the repaired first-Forced or FiveMap graph.

The hosted runner constructs family `throughOrder=2, derivativeOrder=5`, band `coefficientOrder=1`, fixed representative and actual current, target derivative order 3 on that same family, and primary class order 2. It performs live private-seal and family-identity checks, source checks, exact degree-ledger checks, a wrong-order rejection and scope-mutation rejection. The class uses the entire fixed-label annular domain and its own declared source atlas, and does not assert one finite prefix covers all q.

Each step saves canonical source programs with the native hash: family program, target program, native current program and additive primary program, plus certificates and the complete current graph. Readback verifies content hashes and lengths, native parents, node counts, current native suffix, exact derivative requests, and blocked scope promotions. A PASS indicates these checks and the source attachment executed as declared; it is not an independent proof of all analytic majorant premises, a proved bound on the source-only K, source identity with later corrected cycle, actual Forced W-alpha seminorms, later-stage closure, or Lean compilation.

Time and RSS checkpoints are recorded in `checkpoints.jsonl`; step stdout is saved as `native-run.log`. A caught failure writes `status.json` with failing stage and error. Abrupt process termination can leave only checkpoints and stdout, which are still uploaded. `independent-readback.json` appears only when verification succeeds. The job requires both construction and verifier exit status 0; outputs are uploaded on failure too. The time/heap/node budgets are starting limits, not a claim the higher-order build will fit. Resource-limit failures remain failures rather than lower-order substitutions.

No actual mathematical source files or certificates are patched by this runner. It copies only the runner and its checks as untracked files into the separately pinned reference checkout.

## Small checks run locally

```
node --check run_primary_order2.mjs
node --test primary-order2-checks.test.mjs
python -m unittest discover -s . -p test_verify_primary_order2.py
```

The Python verifier has synthetic success, missing/failed status, changed-body and RELEASE-promotion negative controls. The Node checks exercise family mismatch, wrong C5 row, wrong target pole, false source check, scope promotion and bad degree ledger. The separate GitHub workflow ran the actual native build and saved its logs, original programs and source certificates.
