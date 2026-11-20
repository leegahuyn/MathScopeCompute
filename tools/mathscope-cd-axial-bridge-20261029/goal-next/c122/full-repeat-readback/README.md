# Independent readback prepared for the full Repeat retry

GitHub run 44682703381 on commit `287ca9eeaf2ab61f8405949c40e490af915cc1b0` is the only execution accepted in live mode. The C110 scanner is reproduced with two literal changes for the new run and commit. Its archived positive control reproduces the C110 receipt byte for byte, and the earlier failed run is rejected because its append stream and native registry are absent.

The new replay keeps the first spatial stage in full-source mode and materializes the same spatial jet atoms. Its optional standalone predecessor snapshot is deferred after the ingress receipt. This scheduling skips a prior duplicate export from the shared node array. The full Repeat emitter records the requested `full-source` mode and its exact root inventory. The anchored wrapper separately writes the coupled node/registry snapshot and binds it through the export receipt. The independent checker still requires all of those files and a successful resolved GitHub execution. The pinned earlier original predecessor remains the reference for the byte prefix.

## Checks still required on the extracted live run

- Uncompressed protected stream prefix 22,155,584 records with SHA-256 `faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96`.
- 225,012 append records, exactly 22,380,596 total. The 1,444 candidate roots must agree with the snapshot. Previous registry groups must be preserved with append counts `[914,0,0,40,0]`.
- Verify actual raw AST/native roots and literal guard geometry. Check 480 exact subtraction identities and the shifted-coordinate substitutions on the admitted strict guard interior.
- Chain the closed-pulse and 150 slow/transverse exception checks to that accepted live manifest. The actual physical radial boundary, global unclipped supported equality, second correction closure, canonical scale, N7/N8 closure, final jets and release retain their prior scopes.

Run from the packet directory in PowerShell, pointing `$artifact` to the full directory extracted from run 44682703381 and `$terminal` to its captured terminal GitHub JSON with jobs and steps.

```powershell
$goal = 'C:/Users/사용자/Documents/Codex/2026-10-29/referenced-chatgpt-conversation-this-is-an/work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next'
$priorRoot = 'C:/Users/사용자/Documents/Codex/2026-10-29/referenced-chatgpt-conversation-this-is-an/work/goal-next/continuation70/hosted-44582875351'
$prior = Join-Path $priorRoot 'first-correction-spatial-source'
$c110 = 'C:/Users/사용자/Documents/Codex/2026-10-29/referenced-chatgpt-conversation-this-is-an/work/goal-next/continuation110/active-j2-full-source'
$c112 = 'C:/Users/사용자/Documents/Codex/2026-10-29/referenced-chatgpt-conversation-this-is-an/work/goal-next/continuation112/j2-slow-radial'
$guard = 'C:/Users/사용자/Documents/Codex/2026-10-29/referenced-chatgpt-conversation-this-is-an/work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget/outer-physical-gauge/source/forced-gauge-spatial.json'
python -B .\verify_active_j2_full_source.py --artifact $artifact --terminal-run $terminal --predecessor $prior --old-metadata (Join-Path $priorRoot 'active-n3-repeat-forced-candidate.json') --active-guards $guard --out .\active-readback.json
python -B .\verify_native_j2_pulse.py --artifact $artifact --predecessor $prior --goal $goal --native-readback .\active-readback.json --protected-waves (Join-Path $c110 'protected-wave-bodies.json') --protected-tails (Join-Path $c110 'protected-cutoff-tails.json') --out .\active-pulse.json
python -B (Join-Path $c112 'verify_nonradial_append.py') --artifact $artifact --predecessor $prior --goal $goal --c110 . --pulse .\active-pulse.json --active-slow (Join-Path $c112 'active-slow-face-binding.json') --active-transverse (Join-Path $c110 'protected-transverse-bodies.json') --out .\active-nonradial.json
```

The commands use ordinary Python assertions and require no Lean compilation. Preserve the output files with the active-run provenance once available.
