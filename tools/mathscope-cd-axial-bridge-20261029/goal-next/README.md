The completed continuation archive contains the previous checkpoint and the Git
bytes of the new branch evidence. For an independent final M4 readback, extract
the archive, then run from the extraction root:

```text
node tools/mathscope-cd-axial-bridge-20261029/goal-next/m4/verify_registration.mjs . verified-assessment.json
```

The archived `SHA256.json` covers every other entry. GitHub compiler logs are
under `goal-next/ci-*` and `goal-next/m4`. The original graph and registries are
under `inputs/graph`, and the earlier 519-call exact range replay is under
`goal-20261111/y-next`. Historical reports are kept under `history`.

The source graph replay can be regenerated from the archive. The Y checker also
takes a MathScopeCompute checkout with the pinned producer Git objects.

```powershell
$bridge = 'tools/mathscope-cd-axial-bridge-20261029'
$range = "$bridge/goal-20261111/y-next"
$repo = "C:/path/to/MathScopeCompute"
node "$range/collect_reachable.mjs" inputs/graph inputs/producer/source-profile-data.mjs "$range/reached.json"
python "$bridge/goal-next/y/check_reference_source.py" --repo $repo --graph inputs/graph --profile inputs/producer/source-profile-data.mjs --y-replay $range --out verified-reference.json
python "$bridge/goal-next/cycle/group_postfive_residual.py" --reached "$range/reached.json" --registry inputs/graph/original-source-functions.json --graph inputs/graph/original-source-nodes.jsonl.gz --output verified-postfive.json
```
