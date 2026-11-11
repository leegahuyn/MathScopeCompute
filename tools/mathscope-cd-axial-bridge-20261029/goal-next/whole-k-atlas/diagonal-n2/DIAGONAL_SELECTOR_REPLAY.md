# Exact retained selector comparison for the diagonal N2 construction

The baseline is the original N2 artifact from GitHub run 43020929929.
The candidate is the N2 diagonal materialization from run 43055678022,
evidence commit `5c5fe160f964bd195b16ee231380550f73250927`. The comparator
uses the actual exported source DAGs and registered function bodies.

The actual comparison passed. The baseline graph has 2,852,905 nodes
and the diagonal graph has 2,326,849, a difference of 526,056 nodes.
The comparison receipt SHA-256 is
`1dcb11c66fbd1349ee30bfea43193838794b9fb23e3f46ba5f335f5ce27ea1be`.

The matching key is coefficient order, derivative order and source
constraint kind. In N2 the 8, 15 and 20 clauses produce 43 actual pairs.
Each pair compares both the bound and its required logarithm, giving
86 exact source-expression comparisons. The checker also compares
the original common threshold, the historical logs, growth operands,
each selected maximum and scale, and the original N2 reference window
operands. It verifies the complete exported graph and raw registry
digests before using any node IDs.

The comparison keeps the same typed derivative order, native function
kind and original source body. An integral binds its variable in its
integrand only. Its endpoints are checked in the ambient lexical
scope. Native function bodies compare under their own formal-to-formal
mapping, and each application compares the actual arguments and its
derivative order. A remapped numeric node ID alone has no weight in
the comparison. Earlier byte-identical records are reused only after
the relevant early registered native definitions agree.

The first comparison retains operand order. An associative or
commutative difference can be resolved only by flattening and matching
exact addition, multiplication or maximum operands. Each matched leaf
still undergoes the typed lexical comparison. The actual comparison
accepted 100 multiplication and 40 addition normalizations. Its
first accepted normalization pairs multiplication roots #1138583 and
#686472 in the \((n,m)=(2,2)\) pressure-stress-physical bound. The seven
matched factor occurrences preserve the three lexical bindings
#1137920–22 to #685772–74. The provisional ordered comparison of
#1138581 and #686423 pairs a multiplication and an integer power.
Flattening their parent products yields exact factor pairs. The
receipt also records the first provisional ordered mismatch and the
path of any unresolved mismatch.

The original N2 self replay passed all 43 clauses and both changed
source-root controls. Its receipt SHA-256 is
`f5af5c80e2473b6b82e75238568de8f8740b40503dfcf837d61fab0c4026f409`.
The actual original N0-to-N2 remapping replay passed all 23 shared
clauses with no reordered arithmetic operands. Its receipt SHA-256
is `3fe565d70a3555d3f16d5e0ccbd8e826d6f4e7c1ca553f86a248e0755940e4b0`.
The synthetic controls additionally exercise an alpha-renamed integral
and native formal, a reassociated sum, an out-of-scope integral bound
and a changed native derivative order.

The independent overlay readback applies the pinned source transform to
the original three Git objects in memory. It verifies all before and
after SHA-256 digests and the six observed diagonal progress rows,
covering velocity and pressure-stress at derivative orders 1, 2 and 3.
Its receipt SHA-256 is
`12f37d7b48cc9e6d47da8914912c28ce9de311ddd2ea10e30272dcd56ad48186`.

## Replay

```text
python compare_selector_exports.py --left ORIGINAL_N2 --right DIAGONAL_N2 --expected-right-commit 5c5fe160f964bd195b16ee231380550f73250927 --require-diagonal --out diagonal-n2-comparison.json
python check_diagonal_overlay.py --repo REPO --artifact DIAGONAL_N2 --out diagonal-overlay-readback.json
```

The graph comparison checks the retained selector arithmetic. The
actual scalar values of the higher maxima, whole-K source fields,
numerical integrals, and final jets have separate verification scopes.
