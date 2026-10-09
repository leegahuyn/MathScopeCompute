# Pinned original Navier–Stokes validation

This workflow addresses two original verification requirements in the research IDE:
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

## Final tracked-source status check

The last source-status operation runs the actual
`git status --porcelain --untracked-files=no`. Its stdout contains the
tracked-file change entries; stderr contains diagnostics. A Git configuration
warning on stderr must not be misclassified as a changed source file.

The audit accepts this last check only when Git actually exits with code 0
and stdout is empty. A nonzero exit code fails even when stdout is empty.
Any stdout bytes fail, including a real tracked-file change alongside the
same warning. The original before/after tracked-file hash comparison,
official kernel hashes, pinned source/configuration checks, protected
Comparator and mandatory nanoda requirements are unchanged.

The receipt's `source-status-after` step preserves the actual exit code,
the full byte lengths and SHA-256 hashes of both
`source-status-after.stdout.log` and `source-status-after.stderr.log`.
The customary `source-status-after.log` is also retained and hashed; it
groups the complete stdout and stderr under explicit labels, without
claiming that this grouping reproduces cross-stream event ordering.
An executable-launch failure records its error and an unknown (`null`)
process exit code and fails the check.

### Runner regression tests

From the repository root:

```sh
python3 -B -m unittest discover -s tools/ns-original-ci -p test_git_status.py -v
```

From this runner directory itself, including the portable `runner-fix`
copy in the English evidence ZIP, the equivalent command is:

```sh
python3 -B -m unittest discover -s . -p test_git_status.py -v
```

These tests create temporary miniature Git repositories and execute the
installed Git. A clearly marked test-only shim writes an injected warning
to stderr and then `exec`s that real Git, preserving its actual stdout and
exit code. They check a clean repository with the warning, a truly changed
tracked file with the same warning, and a non-repository failure. They also
verify the exact separate logs and their hashes. No permission failure needs
to be manufactured, and no original mathematical source or Git configuration
is changed by these tests.

Successful regression tests validate this runner behavior only. They are
not a default-build or Comparator proof receipt, and do not change the
recorded result of any earlier or currently running CI attempt.
