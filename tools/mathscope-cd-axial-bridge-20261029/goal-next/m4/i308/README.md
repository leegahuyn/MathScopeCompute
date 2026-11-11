# I3-08 shared formal claim view

The original 99-page blueprint records this criterion on page 20. The normal
release-lab builder rechecks the existing core kernel artifact and renders its
11 M4 claims in the browser. The student and expert sections use one selected
claim ID and one shared object for the quantifier, premise IDs, verified scope
and approximation scope. The expert section exposes the exact Lean type, source
file, axiom list, counterexample condition and execution receipt SHA-256.

The precision-metric claim uses a common convergence index N for every domain
point and continuity of every approximant. The worked example traces k=3 through
the original k+2=5 proof steps. The integer example independently evaluates both
fixed D=1 matrices at the one audited vector. The conditional example shows its
named user axiom. The original proof bodies and evidence grades are preserved.

The exact replay checks 11 distinct authentic targets, the source SHA-256 for
each, the original criterion text, two worked examples and three tamper controls.
The browser replay checks all 11 rendered targets at 1200×900 and 390×844,
keyboard access, overflow, imported false evidence quarantine and the six
existing I3-07 research rows. It builds the isolated candidate on the recorded
v103 baseline, with the R1-03 routes present in the same source.

## Reproduce

Materialize the exact Git inputs with the commit in `source-pin.json`. Overlay
the five tested source files from `tested/` at the corresponding paths inside
the copied repository. The other tested release-lab inputs already match that
same pinned checkout. Provide a Git object store through `GIT_DIR` for the
original kernel verifier's exact M0 Git readback. Set the local Playwright
module and Chromium executable in the environment for the browser check.

```text
python materialize_i308.py REPO SCRATCH PIN
node SCRATCH/source/research-ide/mathscope-m4/web/formal-claim-view.mjs > SCRATCH/model.json
python SCRATCH/source/research-ide/mathscope-m4/web/build-release-lab.py --baseline BASELINE --out SCRATCH/built --kernel KERNEL_MODEL --verification ORIGINAL_FIXTURE_MANIFEST
node audit_i308.mjs SCRATCH SCRATCH/I3-08_RECEIPT.json
node verify_claim_panel.cjs SCRATCH
```

The baseline is the decompressed pinned `public-v103.html.gz` from the
materialized sources. The kernel model for the older release-lab pane is in the
adjacent I3-07 evidence. This audit rebinds an already compiled core artifact.
Publication remains unconfirmed and no new Lean execution is claimed.
