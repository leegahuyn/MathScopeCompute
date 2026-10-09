# Pinned original Navier–Stokes validation

This workflow addresses two still-open acceptance items in the research IDE:
N1-05 (the **complete original default `lake build`**) and N1-06 (the **independent
protected Comparator**). A workflow file or a running job is not a passed gate.
Only the resulting exit codes, complete logs, source hashes and evidence receipts
can close these items.

The two jobs use separate fresh checkouts of
`openai/NavierStokesAndEuler@f9e8bc5b38b6e212696e8a30e3e91517af887bbd`.
They preserve the original Lake manifest, `lean-toolchain`, default targets and
NavierStokes Comparator configuration. The official Lean archive and kernel are
checked against the hashes recorded in the delivered audit. Landrun, Comparator,
lean4export, nanoda, Go and Rust versions are pinned in `pins.json`.

The Comparator job has an independent unprivileged Linux user with no sudo group
membership, its own systemd user manager and its own home directory. It keeps
`RestrictAddressFamilies=~AF_UNIX` and the original Landrun behavior. A negative
socket-creation probe and a negative out-of-sandbox write probe must both succeed
before Comparator starts. The job does not compile any original submitted project
module before entering Comparator. The trusted Mathlib cache and the pinned
Comparator/exporter tools are the only prebuilt dependencies allowed here.

The original configuration requires nanoda, which remains enabled. Both submitted
NS theorem types and their axiom dependencies are printed after a successful
Comparator run. No fake sandbox, omitted external kernel, replacement theorem,
custom Lean kernel or modified original proof is accepted.

Artifacts contain `result.json`, full step logs, the source-file hashes before and
after execution, and the MathScope workflow commit. A failed environmental
preflight stays a failed run. It is not evidence that the mathematical statement
is false, nor evidence that verification succeeded.

Run **Pinned original NS verification** manually in GitHub Actions to reproduce.
Changes to this workflow or its helper files also trigger both jobs on `main`.
The stock Ubuntu runner is used; no larger paid runner is requested. The job has
a 350-minute limit, and an interrupted or timed-out run does not count as success.

Upstream protection specification:
<https://github.com/leanprover/comparator/blob/19e111e2141cf333c7daff0f64c5f24acc91dd2e/README.md>.
