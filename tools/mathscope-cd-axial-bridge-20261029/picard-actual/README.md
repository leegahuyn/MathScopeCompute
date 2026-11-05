# Picard operator: source-structure audit and finite-iterate countermodel

This is an independently replayed diagnostic for the order-one inner Picard source. It does **not** certify an actual physical solution, evaluate the certified truncation index, prove convergence, close the actual residual or its moments, or change any M3/M4 acceptance count.

## What was verified

1. `check_a1_mask.py` replays the exact 4,420,257-node graph and verifies the JSONL SHA-256 `a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269` and registry SHA-256 `bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e`. The registered system 0 has a 6×6 `A1` mask with six **syntactically nonzero** entries in rows 4–5 and columns 0–3 and literal-zero entries elsewhere. It has no path `i→k→j` with both mask entries present, so `A1(x) D A1(y)` vanishes for a diagonal intermediate kernel under the real matrix interpretation. For `A1(x) D (∂η A1)(y)`, zero entries must remain zero on a differentiability neighborhood. Inserting a forbidden `(0,4)` entry creates the `(0,4,0)` path and is rejected. The lack of adjacent derivative-bearing factors gives the combinatorial bound `ceil(k/2)` in a k-factor word: partition positions into adjacent pairs, with at most one selected per pair. The finite `k=0..100` loop is a control, not a formal proof of that general statement.

2. `runtime_fixture.mjs` runs the source producer, matching `actual-continuation-exact-functions.mjs` and `actual-global-source-expressions.mjs` against Git blobs `1684bc230b42b766821c633ee3fb961198aa616c` and `854bb862276d03c236b2df73ba1bb9a61373c4df`. The producer creates an **opaque** `actual_background_picard` root separately from displayed finite partial sums. Source lines 199–206 and 352–354 define its radial symbolic derivative through the system RHS and integral expression; applying this rewrite is not independent evidence that any analytically constructed root satisfies that equation. The source's diagnostic numeric interpreter rejects this fixture's opaque root with `UNSUPPORTED`; this observation concerns that particular diagnostic path, not every possible evaluator.

3. `check_fixture.py` interprets the source-generated synthetic finite DAG by exact SymPy integration. For the artificial system `y'=1+y, y(0)=0`, the 0–8 displayed terms give `y_N=∑_{k=1}^N ξ^k/k!` and exact ODE defect `y_N'−1−y_N=−ξ^N/N!`. At N=3 and ξ=1 the defect is `−1/6`. This is a countermodel to identifying a finite displayed iterate with an exact solution; it is **not** a counterexample to the original physical Picard system, its convergence, or its residual cancellation.

4. `check_majorant_provenance.mjs` matches both majorant module blobs and seven referenced input file byte counts/SHA-256s to commit `7aeaa25f3a9cfcf048c7bb7b6e4dcbe66300e2aa`. The source declares that the certified truncation index was not numerically materialized and that its tail is not an error bound for the displayed partial sum. These are provenance and source-declaration checks: the cited bounds, complex-strip analyticity, differentiability, fixed-point convergence and existence are **not** validated by byte equality.

The next original-source obligations are: establish a real/complex interpretation and domain for the opaque function; independently prove the Picard limit solves all six system equations with sufficient radial/η regularity and axis limits; verify actual coefficient/norm bounds and the intended K-tail premises; and then bind the actual residual and parameter-dependent moments to that solution. A finite graph or a differentiator rewrite cannot supply these facts.

## Reproduction

Use Python 3 with SymPy and Node.js. The original reference checkout must contain the pinned branch, and the source checkout must contain its matching two modules. Run from the workspace root, replacing the paths as appropriate:

```powershell
$env:MATHSCOPE_REPO = '<path to source checkout>'
$env:MATHSCOPE_REFERENCE_REPO = '<path to checkout with origin/mathscope-cd-lean-three-gates-20261027>'
node work/picard-actual/runtime_fixture.mjs
python work/picard-actual/check_fixture.py
python work/picard-actual/check_a1_mask.py --source <original-graph-dir> --out work/picard-actual/a1-mask-independent.json
node work/picard-actual/check_majorant_provenance.mjs
```

Each script regenerates its named JSON output. The `--source` directory contains `original-source-nodes.jsonl.gz` and `original-source-functions.json`. The synthetic input is fully created inside the script; it does not require actual runtime field values. Avoid executing fixture outputs as a substitute for source-native analytic evidence.
