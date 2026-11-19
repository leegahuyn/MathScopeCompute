# Original n=1 axial source seven-flux identity

New result: actual source raw #117045 and its eta AD expression satisfy the
independent complete Step 4 conservative identity, with all seven boundary
fluxes and both ordered continuity defects. The supported #117047 derivative
and all three original native integral bindings match exactly. The positive
check uses symbolic actual field jets and exact rational algebra only.

`EXACT_N1_SOURCE_BRIDGE.md` states the equations, source namespaces, domain,
all-n versus n=1 distinction, exact remaining native/analytic obligations,
and the meaning of the three nonzero faulty-algebra controls.

The source slice authenticates the legacy #672 registry and original
117,100-node prefix. It explicitly compares N4's DIFFERENT function #672.
All four module hashes in the exporter are hard-pinned before execution.
The imported producer remains unchanged; finite derivative work is append-only
in a disposable process. No repository, source runtime, Git or web state changes.

Run from this directory. `RUNTIME` is the archived
`work/goal-next/continuation30/forced-probe/runtime/research-ide`.
`LEGACY_REGISTRY` is `work/delivery-20261110/inputs/graph/original-source-functions.json`.
`N4_REGISTRY` is the original registry in the GitHub run 43055678022
`original-whole-k-current-pressure-graph` artifact.

```
node --max-old-space-size=4096 export_source_jets.mjs RUNTIME LEGACY_REGISTRY SOURCE_SLICE.json N4_REGISTRY

python -B check_source_identity.py SOURCE_SLICE.json IDENTITY.json
```

Python uses SymPy 1.14.0. Repeat source export and identity outputs must
be byte-identical.

The repository Lean module `AxialSourceSevenFlux.lean` has two scalar
theorems checked by the hosted axial bridge workflow.
It explicitly assumes L!=0 and requires both continuity equations to remove
the defects. It does not interpret the AST, prove primitive jet existence,
or infer actual integral cancellation and cutoff joins from a zero branch.

VERIFIED: exact finite source/algebra checks and their controls. CONDITIONAL:
native ordinary derivative/mixed commutation and fixed-cutoff join semantics,
actual continuity, boundary and whole-moment/integral premises. General
recursive native semantics remains OPEN. Counters and RELEASE HOLD unchanged.
