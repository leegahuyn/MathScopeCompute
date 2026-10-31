# I3-05 source-bound generated jobs and prototype session

Baseline modules are byte-extracted from `9595b4de5a1065b694d225c0ad2a14d5aa4435a9`; see `producer-hashes.json`. `independent-generated-jobs.mjs` runs the actual input-to-source generator with eight single-parameter changes, and checks that previous PASS data are not reused. `generated-jobs-result.json` records digests and exact states. Important qualification: changing G, delta, p, precision, coefficient formula, field or assumptions affects canonical source comment and namespace, but the generated theorem still proves the same fixed integer differential fixture. Only changing the four coefficient values changes its theorem body. No result here validates the semantic realization of those inputs.

`proof-session.mjs` is an isolated controller prototype. Its update immediately clears the active job, generates a new one, rejects stale completions from older requests, and keeps kernel status pending. `proof-session.test.mjs` checks this with actual generator calls, an intentionally delayed promise, invalid inputs and forged PASS data. A separate `ui-fixture.html` wires the prototype to input handlers for local browser tests. This fixture does not execute the original R1 worker or the site builder, and is not the deployed application. It cannot certify real application UI behavior, independent kernel execution, or original acceptance.

Reproduction from this directory, assuming Python 3, Node 18+ and a repository containing the original commit:

```
python load_baseline.py --repo /path/to/MathScopeCompute
node independent-generated-jobs.mjs
node --test proof-session.test.mjs
```

The mutation tests used here are controls against hash-based stale reuse, not a demonstration that every input field is mathematically implemented. Existing I3-05 remains PARTIAL and M4 remains 0/16.
