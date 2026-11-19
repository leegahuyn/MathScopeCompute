# Original n=1 native eta kernel and leading-bound reduction

The packet supplies 18 actual source RHS eta identities, 12 consecutive
formal eta derivative identities, nine literal first-Volterra-term eta
identities, and an independent norm-tree bound for all actual system0 matrix
rows and forcing operands. The remaining exact leading B bound is written
in SEMANTICS_BOUND_REDUCTION.md. This is a smaller source obligation than
repeating the prior abstract fixed-n tail theorem.

Run the scripts from this directory. `ORIGINAL_RESEARCH_IDE` is the
archived `work/goal-next/continuation30/forced-probe/runtime/research-ide`
directory. `N4_REGISTRY` is the `original-source-functions.json` in the
same original GitHub run 43055678022 graph archive.

```
node --max-old-space-size=4096 export_n1_kernel.mjs ORIGINAL_RESEARCH_IDE N4_REGISTRY SOURCE.json

python -B check_n1_kernel.py SOURCE.json RESULT.json
```

Python uses SymPy 1.14.0.
Six original module hashes and the full registry hash are hard assertions.
The n=1 prefix matches the independently authenticated historical source.
Repeat both outputs and check byte equality. No local Lean compiler, new
dependency installation, network request, Git operation or repository edit.

The actual native diagnostic evaluator rejects the Picard descriptor; the
source's displayed finite sum is never treated as an exact limit. Ordinary
leading natural/B.26 complex jet bounds, their actual join and average
semantics remain explicit. This is n=1 only. RELEASE HOLD.
