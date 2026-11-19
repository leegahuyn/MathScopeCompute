# N4 selector inputs at the remaining literal profile sites

The prior physical-application analysis covered 182 of the 259 distinct
original N4 even-profile nodes in its fourteen actual input contexts.
`classify_remaining.py` checks the exact complement. Every one of the
remaining 77 nodes is a descendant of the fifth original complete selector
scale #4582351. The missing sites have systems 0, 3, 5, 7 and 9 with
counts 11, 11, 22, 29 and 4. After cutting the fifth selector node, all
original roots lose every path to these 77 sites. Original root #4599550
reaches the same sites through its selector dependency.

`selector_frame_flow.py` starts separately at all five original selector
scale roots #4582068, #4582117, #4582180, #4582258 and #4582351 with no
initial coordinate facts. It supplies no physical slow-inverse, physical
time or eta-image fact. It uses the same native actual-parameter
reconstruction as the prior physical analysis. At every native definition
edge it clears ambient coordinate facts and rebuilds each formal's
nonnegativity, unit-interval and cutoff-bound facts from that call's actual
arguments. Facts are intersected at shared source nodes.

The source parameter graph gives positive Xa and t1, and the checked source
cutoffs satisfy

```text
Xkeep = Xa*exp(t1/64) < Xcut = Xa*exp(t1/32) < a^2 = Xa*exp(t1/16).
```

The full 7,358,162-node source stream is hashed and its missing radial
endpoint recovered as `a=sqrt(a^2)`. Thus the source conditions
`0<=X<=Xcut` and `|eta|<=1` suffice for the original registered
`[0,a]` Picard radius and admitted eta interval.

The positive selector replay checks all 259 original literal profile sites
through 468,209 source ancestor nodes, including the 77 outside the earlier
physical root subset. Reached systems 0, 3, 5, 7 and 9 have counts
101, 66, 55, 33 and 4. The guard control leaves 245 sites unresolved.
The integral control leaves all 259 sites unresolved. These controls
demonstrate sensitivity of the analysis.

These are argument-domain conclusions in the selector source contexts.
The separate physical-application premises remain part of that earlier
root family's result. Native substitution, lazy branches, integral
semantics and the partial-derivative interpretation remain analytic/source
premises. The finite selector analysis does not construct the Picard
solutions, prove limit/derivative convergence or all-order recursion, or
certify whole Y, final fields or jet acceptance. RELEASE HOLD.

Reproduce from the workspace root with Python 3. Replace REPLAY with the
location of this directory and NEW_JSON with a fresh output path.

```text
python REPLAY/classify_remaining.py work/goal-next/y-n4/reached.json work/goal-next/y/native_reference_scopes.py work/goal-next/continuation47/y/physical-flow.json NEW_JSON

python REPLAY/selector_frame_flow.py work/goal-next/y-n4/reached.json work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph/original-source-functions.json work/goal-next/y/native_reference_scopes.py work/goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/source-profile-data.mjs work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph/original-source-nodes.jsonl.gz NEW_JSON
```

For the controls append `--drop-upper-guards` or
`--drop-integral-facts` to the second command.
