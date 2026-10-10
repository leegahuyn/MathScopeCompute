# N1 follow-up on 2026-10-10 KST

This directory adds new read-only observations and independent evidence checks.
Historical receipts, original acceptance criteria, the source proof, the Lean
kernel, Comparator configuration, and the running GitHub jobs are preserved.

## N1-05: the requested remaining condition stays satisfied

The preserved original whole-default-build receipt records an actual **exit 0**
at **2026-10-09T20:59:06.787843+00:00**. Its complete log ends with
`Build completed successfully (11424 jobs).` This follow-up does not rerun that
build or describe its cached/resumed artifacts as a fresh build.

`verify_n105.py` newly checks the receipt, complete log, recorded environment,
the 15-member completion snapshot, all 124 frozen delivery inputs, the preserved
29-check historical runtime audit, original guards, interrupted attempts, and
the distinct historical cache-command outcomes. It invokes the existing portable
43-check original GitHub artifact audit without writing into that old directory.

| New audit | Result | Scope |
|---|---|---|
| `n105-portable-audit.json` | 22/22 | Release-contained bytes and receipts; includes the separate 43/43 original GitHub artifact audit |
| `n105-runtime-audit.json` | 36/36 | Above, plus the actual preserved official runtime's source, pins, kernel, documented entry and complete `.olean` inventory |

All **2,669 actual tracked original files** in the preserved runtime match the
independent GitHub source hash dictionary. The original default-target inventories
are **817/817 NavierStokes**, **1,840/1,840 Euler**, and **2/2 ComparatorChallenges**.
The runtime was only read by this follow-up. The optional runtime inspection does
not make the portable package depend on that machine continuing to exist.

The GitHub default-build job remains a **failed job** because of its historical
audit-wrapper error. Its two underlying original commands independently exited
zero. Both facts are preserved. The new verifier does not promote N1-06 or any N3
condition from these successful default-build results.

Run from the repository root, selecting a new output filename:

```sh
python3 -B research-ide/mathscope-m1/navier/followup-20261010-n1-final/verify_n105.py \
  --output /tmp/new-n105-portable-audit.json
```

If the actual preserved original runtime is still present, add
`--runtime-navier /absolute/path/to/mathscope-m1/navier`. This option only reads it.
The report file is opened with exclusive creation; earlier reports are not overwritten.

## N1-06: live observations and the exact remaining receipt

The first saved observation in `github-observation-001.json` was received at
**2026-10-09T21:44:37 UTC** (**2026-10-10 06:44:37 KST**):

| Run / job | Actual observation |
|---|---|
| Run `37979127351`, commit `8c4271aa5a35b1d34c30279fb306a099944e4823` | `in_progress` |
| Comparator job `113984853927` | `in_progress`; original pinned protected-validation step running |
| Default-build job `113984854490` | `completed` / `failure`; underlying command exit codes remain separately audited |
| Run `37992645347`, commit `0056147e90bdd4fd4f575aa4df08aa5f937301fd` | `pending`; no jobs allocated yet |

The old run started at **2026-10-09T19:16:48Z**. The workflow has a **350-minute**
job limit and `cancel-in-progress: false`. No existing job was cancelled, and no
new run was dispatched by this follow-up. The protected Comparator result is
still unknown in this observation. A job-log request returned `BlobNotFound`
while the job was running; its response is preserved separately. That API result
is neither a mathematical failure nor the Comparator process's exit code.

The only currently exposed artifact is the old default-build artifact
`11644582983`, **282,640 bytes**, with GitHub SHA-256
`79d9b7eade3bd569a62b0a344eb0a1fd4fa37e07f6b4c10121565bd185ccf5d6`.

Before N1-06 can be called complete, the actual independent Comparator artifact
must show all of the following from the same protected run:

1. The exact pinned original configuration and source, official archive/kernel,
   Comparator, mathlib, lean4export, Landrun, and nanoda versions and hashes.
2. An unprivileged verification user without effective capabilities and the real
   systemd user/DBus session used by the original address-family guard.
3. Successful negative AF_UNIX-creation and Landlock outside-write probes.
4. Zero original NavierStokes, Euler and ComparatorChallenges `.olean` artifacts
   before entering Comparator, apart from the separately permitted trusted tools
   and Mathlib cache.
5. The complete protected command log and its actual exit code, including the
   original external nanoda acceptance, the Lean default-kernel replay and the
   original Comparator final result.
6. Both original submitted theorem types and actual `#print axioms` output,
   compared with `propext`, `Quot.sound`, and `Classical.choice`.
7. Identical before/after tracked-source hashes, unchanged kernel/configuration,
   and an honest distinction between the Comparator command and a later wrapper
   status if the old stderr-parsing defect occurs again.
8. Downloaded artifact bytes bound to the GitHub artifact digest, members and
   step-log digests, with retrieval timestamps.

These are the inherited requirements, not new proof assumptions. The existing
runner preserves the required guard and mandatory nanoda; its source-status
stream-separation fix belongs to the already pending second run. No original
proof, configuration, kernel, or guard is modified in this directory.
