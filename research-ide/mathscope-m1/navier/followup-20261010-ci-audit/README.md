# Original GitHub CI: independent follow-up observation

Repository: `leegahuyn/MathScopeCompute`. Run: [37979127351](https://github.com/leegahuyn/MathScopeCompute/actions/runs/37979127351). The run uses MathScope commit `8c4271aa5a35b1d34c30279fb306a099944e4823` and original OpenAI source commit `f9e8bc5b38b6e212696e8a30e3e91517af887bbd` with official Lean 4.34.0-rc2.

## Default-build job

The actual GitHub job `113984854490` and its CI controller both ended in **failure**. The original cache and default-build commands themselves both completed successfully. The downstream bookkeeping check merged two Git configuration warnings into the porcelain status output and treated that merged text as source changes. The failure is preserved; this observation does not rewrite or promote the GitHub job conclusion.

| Executed stage | Actual exit | Completed UTC | Evidence |
| --- | ---: | --- | --- |
| Official `lake exe cache get` | 0 | 2026-10-09 19:19:18.828764 | Full `default-build-artifact/cache-get.log`; 8747 downloaded and decompressed |
| Unmodified official `lake build` | 0 | 2026-10-09 20:58:47.143428 | Full `default-build-artifact/original-default-build.log`; 11424 jobs completed |
| `git status --porcelain --untracked-files=no` | 0 | 2026-10-09 20:58:47.807611 | Only two Git configuration permission warnings in merged output |
| CI wrapper | 1 | 2026-10-09 20:58:47.808373 | `RuntimeError: Original tracked source status is not clean` |

The two warnings concern `/home/runner/.config/git/attributes` and `/home/runner/.config/git/ignore`. The immutable controller snapshot demonstrates that `run()` uses `stderr=subprocess.STDOUT`, returns the combined log, and rejects any nonempty `.strip()` result from the status command. There are no porcelain modification entries in the saved log. Independently, all **2669 tracked source file hashes** agree before and after the build, and the official kernel, source configuration, manifest, toolchain, and dependency pins agree with their recorded pins. Final free disk is 70,285,918,208 bytes; there is no disk-capacity failure in this result.

Independent artifact verification passed **43/43 checks**, recorded in `default-build-independent-audit.json`. These check the actual stage receipts and complete log hashes, rather than substituting the GitHub job label for the command results.

## Principal digests

| Item | SHA-256 |
| --- | --- |
| Downloaded artifact ZIP, 282640 bytes | `79d9b7eade3bd569a62b0a344eb0a1fd4fa37e07f6b4c10121565bd185ccf5d6` |
| Original cache-get log | `cbe05321881c35ee5997dc1270f32b787446d10297c8bf7c689bddbaa12791ed` |
| Original default-build log | `7e779054769415eb9f5444f2df6c8edbb23a775c1547bb69db4368d986d36c5c` |
| Source-hash JSON, before and after | `1511e4398e2825776b1f1f6de35925b02cba19237b42d26bd13a9a65cd8b0f28` |
| Official shared Lean kernel | `cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5` |
| Artifact's complete result JSON | `7a0e85569880866a8fd2f639e3ec06476acb49b21fcbdb1fed05e71780e8bc39` |
| Independent audit JSON | `36ab708c54864d0a6ae4f17a7ecbabccb28d7b2a423710f87dfb63e1b7598ab8` |

The ZIP digest and byte count were checked against both the connected GitHub artifact metadata and the upload receipt in the actual job log. Artifact ID is `11644582983`. The downloaded controller matches immutable Git blob `c381c075256953aa7be37541c7984b6780623a09`.

## Comparator scope

At 2026-10-09 21:05:42 UTC, separate Comparator job `113984853927` was still **in progress**. This default-build artifact contains no protected Comparator command result and establishes no nanoda completion. The Comparator job has the same final bookkeeping check, so its eventual protected-command outcome must be inspected separately from the wrapper's conclusion.

This directory contains only read-only observations and downloaded evidence. No original source, guard, workflow, job, or existing completion record has been changed.
