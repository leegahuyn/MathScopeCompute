# Compact exact replay of the original post-Five direct/split roots

The exporter must run while the same original graph and private post-Five
PDE owner remain live. Its source entry point validates the original
WeakMap seal through the exact loaded source module. It compares the fresh
first-cycle receipt with the pinned successful GitHub run 44528954587
receipt, omitting only each stage's rssBytes value.

The following fields are checked before export.

- The actual graph object is pde.G and its node count equals the fresh
  successful receipt.
- The split's three conservative difference roots and divergence root
  equal the successful reference roots.
- Direct conservative residual roots, physical velocity and pressure,
  and the physical divergence match the completed source stage.
- Previous Signed velocity and pressure, new mean increments and pressure
  delta match the pde private owner's source associations.
- The three original source files match their pinned SHA-256 values and
  the private PDE source seal passes again after collection.

Call after first-cycle success has been recorded, before releasing G,
split or pde

```javascript
await exportPostFiveDirectSplitClosure({
  G, split, pde,
  currentReceipt: receipt,
  referenceReceiptPath: referencePath,
  outDir,
  sourceFiles: [
    {name: 'source-postfive-full-3d-residual.mjs', file: fullPDEPath,
     sha256: expectedSourcePins['source-postfive-full-3d-residual.mjs']},
    {name: 'source-postfive-direct-split.mjs', file: splitPath,
     sha256: expectedSourcePins['source-postfive-direct-split.mjs']},
    {name: 'source-harmonic-assembly.mjs', file: harmonicPath,
     sha256: expectedSourcePins['source-harmonic-assembly.mjs']},
  ],
});
```

The exporter traverses only rational, addition, multiplication, inverse
and integer-power nodes. Every other original node is retained in full
as an opaque analytic atom with its original ID. The arithmetic closure,
all denominator roots, seven selected roots and source associations are
hashed in a compact manifest. The exporter appends no source graph nodes.

The independent Python verifier checks the closure hash and every source
file, compares stable receipt data, checks append-only topological
completeness, and uses the unchanged pinned original Exact reducer.
Its topological cache preparation avoids recursive traversal of deep
original chains. The acceptance result requires four zero polynomials
and three nonzero direct residual controls.

```text
python verify_direct_split_closure.py --closure CLOSURE_JSON --manifest MANIFEST_JSON --receipt PINNED_REFERENCE_RECEIPT --exact-module GOAL_NEXT/first-force-repair/verify_repaired_first_force.py --source-file source-postfive-full-3d-residual.mjs=FULL_PDE_PATH --source-file source-postfive-direct-split.mjs=SPLIT_PATH --source-file source-harmonic-assembly.mjs=HARMONIC_PATH --out NEW_RECEIPT
```

The synthetic controls run using

```text
node check_compact_fixture.mjs synthetic-compact-fixture.json
python check_compact_fixture.py synthetic-compact-fixture.json GOAL_NEXT/first-force-repair/verify_repaired_first_force.py
```

These controls exercise exporter closure semantics, four exact zeros,
three nonzero residual controls, a nonzero difference mutation, a missing
source node, and RSS-only receipt variation with a rejected root change.
They do not exercise the private live source seal.

GitHub run 44541601028 executed the exporter on the actual live first-cycle
graph. The independently reproduced result establishes four exact zero
differences under the original native and denominator domain assumptions.
The original residual size, force regularity, quantitative closure, higher
stages and final jet certification remain open. See the
[actual hosted replay](hosted-44541601028/README.md). RELEASE HOLD.
