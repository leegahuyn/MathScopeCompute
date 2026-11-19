# Actual N4 physical application domain flow

The fourteen original simultaneous slow-chart expression applications use
`X=R^2/(2s)` and `eta=Z/s^(1/2-h)`, where the registered original slow
inverse has the equation `s-Z^2*s^(2h)-T=0` and bracket `[1/2,2]`.
The checker binds the exact original equation, its argument slots and
physical coordinate operands. Its physical input premises are that this
native inverse is defined, the normalized physical time is nonnegative and
`0<h<1/16`. The compiled source-chart lemmas prove on these premises that
physical X is nonnegative and physical eta lies in `[-1,1]`.

Starting at these fourteen actual source applications, a forward must
analysis inspects every ordinary and typed definition path to their
descendant original even-profile calls. At a native definition edge it
clears ambient coordinate facts and reconstructs the facts of each formal
from that call's actual argument. Facts at a shared source node are
intersected across incoming paths. Thus the check follows new actual
arguments through nested calls and does not assume a fixed formal X remains
the same value across a native scope.

The checked subset has 208,393 source ancestor nodes and 182 distinct
original profile call nodes. The reached original Picard systems are

| Original order | System | Calls |
| --- | --- | --- |
| 1 | 0 | 90 |
| 2 | 3 | 55 |
| 3 | 5 | 33 |
| 4 | 7 | 4 |

For all 182 sites the propagated point facts give
`0<=X<=Xcut` and `|eta|<=1`. The original source formulas are
`Xkeep=Xa*exp(t1/64)`, `Xcut=Xa*exp(t1/32)` and
`a^2=Xa*exp(t1/16)`. The positive Xa and t1 follow from the pinned original
parameter graph. The original 7,358,162-node compressed graph is streamed
and its complete uncompressed SHA-256 checked to recover the otherwise
omitted endpoint node `a=sqrt(a^2)`. Consequently `Xcut<a^2` and the
actual profile radius `sqrt(X)` is in the registered `[0,a]` domain.

The analysis reintroduces each upper bound from an actual source
piecewise arm or from mapped actual arguments. It uses original integral
body facts for the bound coordinates. Three deliberate proof controls give

| Withheld facts | Sites lacking at least one required fact |
| --- | --- |
| Physical X/eta input | 170 |
| Piecewise upper guards | 168 |
| Integral interval facts | 182 |

These are unresolved obligations of the deliberately weakened analyses.
They assert no counterexample to the original source.

The result connects the named actual fourteen input applications to 182
downstream original literal call sites. It still assumes the defined
physical inverse and nonnegative time, original lazy branch and
capture-free substitution semantics, the native partial-derivative
interpretation, and integral semantics. It establishes argument domains.
The remaining 77 original profile sites, dynamically materialized calls,
arbitrary recursion, convergence of native solutions, cutoff endpoint
derivatives and final fields need their separate evidence. RELEASE HOLD.

Run with Python 3 from the workspace root. Set REPLAY to this directory
and NEW_JSON to a new output path.

```text
python REPLAY/physical_frame_flow.py work/goal-next/y-n4/reached.json work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph/original-source-functions.json work/goal-next/y/native_reference_scopes.py work/goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/source-profile-data.mjs work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph/original-source-nodes.jsonl.gz NEW_JSON
```

For the three controls, append respectively `--drop-physical-input`,
`--drop-upper-guards` or `--drop-integral-facts`. The four final receipts
are `physical-flow.json`, `no-physical-input.json`, `no-guards.json` and
`no-integrals.json`. The other exploratory files in the scratch directory
predate this final checker and are excluded.
