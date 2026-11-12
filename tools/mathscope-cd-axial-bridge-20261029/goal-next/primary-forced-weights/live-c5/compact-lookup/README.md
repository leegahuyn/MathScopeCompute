# Compact intern-table experiment

This scratch-only experiment replaces neither source code nor a workflow.
`CompactLookup` is a `Map` subclass whose public keys remain the original
`JSON.stringify([op,args])` strings. Only `add` and `multiply` keys with two
nonnegative integer node IDs below `2^25` are stored as exactly representable
integers:

```text
2*(a*2^25+b) + (op == multiply ? 1 : 0)
```

The maximum is `2^51-1`, so JavaScript binary64 represents it exactly.
Other strings stay strings. The integer and string key spaces are disjoint.
Inverse decoding preserves key spelling, insertion order, `Map` cloning,
and source IDs. `CompactDerivativeLookup` similarly packs source derivative
keys of the form `id:coordinate` with two 25-bit integer parts; its encoded
maximum is `2^50-1`. Every other string stays intact. The source graph uses
string keys; this wrapper deliberately rejects arbitrary non-string inputs.

`full-graph-differential.json` replays all 4,456,994 original archived nodes,
comparing every interned ID and ordered map entry. It also checks controls
that expose a missing opcode bit or missing range check, reversible encoding,
and `new Map(...)` cloning. The checked gzip SHA-256 is
`9b2e16a14fe0daf81e4325d05eb5966d74164e34b537da1fb3abc4d95754751c`.
`native-constructor-parity.json` compares original convergent and induction
constructors, native derivative memo use, capture-avoiding integral
substitution and expression-function definitions. The original 119-file
runtime manifest is verified before each native replay.

The two `chart-c8-*.json` files independently execute the actual order-eight
`exactSlowProfileExpansion` for its leading-F multiplier. Both return 165
rows and identical graph, expansion and definition hashes. In this one local
test, post-GC heap was 504,986,264 bytes before and 418,023,088 bytes after;
runtime was 9.15 s before and 13.47 s after. Measurements are runtime and
machine dependent. This is only one chart multiplier, without the remaining
source family, FTC construction or sealing. It does **not** show that the
failed 11 GiB hosted run will fit.

Original constructors clone a lookup with `new Map(value)` and therefore
restore the ordinary map; any future use must apply compaction to the actual
graph after its relevant clone. `compactFromLegacy` temporarily retains both
maps, so conversion itself may increase peak memory. The unmodified actual C2
background norm issuer was separately run with each table and passed its
private `WeakMap` seal and twelve source checks in both cases. Its full graph,
program, source rows and roots are byte-identical; mutations to a graph node
and a norm row are rejected by the original seal. This does not test the
actual C8 sealed constructor or a live source family.
Replacing an intern table is not permission to change the native source body,
cache key meaning, append order, mutation checks or resource limits. Validate
all of those separately before any hosted retry. No Lean theorem, M3 gate or
final jet is established here.

Replay with Node and the pinned original runtime:

```sh
p=work/goal-next/continuation28/compact-lookup
runtime=work/goal-next/continuation27/original-primary-degree-runtime
graph=work/goal-next/corrected-flat/hosted-43010593847/corrected-first-cycle-graph/original-source-nodes.jsonl.gz
node --expose-gc --max-old-space-size=4096 "$p/replay_lookup.mjs" differential "$graph" 4456994
node --max-old-space-size=2048 "$p/native_constructor_parity.mjs" "$runtime"
node --expose-gc --max-old-space-size=4096 "$p/chart_parity.mjs" baseline "$runtime" 8
node --expose-gc --max-old-space-size=4096 "$p/chart_parity.mjs" compact "$runtime" 8
node --expose-gc --max-old-space-size=4096 "$p/native_seal_parity.mjs" baseline "$runtime" > baseline.json
node --expose-gc --max-old-space-size=4096 "$p/native_seal_parity.mjs" compact "$runtime" > compact.json
node "$p/compare_native_c2.mjs" baseline.json compact.json
```
