# N4 original natural-call reach and 15 new Picard operands

The original N4 GitHub run 43055678022 exported the actual N4 raw-base current/pressure and selector graph. Its 7,358,162-node stream has SHA-256 `ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd`; the original native registry has SHA-256 `049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad`. The retained N4 selector graph is separate; this audit uses the 14 manifest current/pressure and selector roots. The typed collector uses the common registry reader with a synthetic empty coupled facade only as a reader adapter. The traversal concerns the current, pressure and selector roots.

A conservative traversal of both sides of all branches reaches 1,169,752 nodes, 751 native definition entries and 597 natural-series calls, with no unresolved reached native kinds. All 582 N3 natural call descriptors and their literal original AST nodes are preserved. N4 adds 15:

- 11 calls use #129036 = Lambda*xi5^2;
- four use #129110 = Lambda*Xa*exp(log(xi5^2/Xa)).

The actual original order-5 Picard system 9 has xi formal #129000, eta formal #2 and radial domain `[0,#24806]`. The pinned exact source profile and endpoint AST establish `Xa=4/Lambda`, `0<t1<1` and `#24806=sqrt(Xa*exp(t1/16))`. For a defined original Picard call in this domain, `0<=Lambda*xi5^2<=4 exp(t1/16)<64/15<5`. In its active log branch, the second operand equals the first. The four log calls are reachable in the uncut coefficient closure, and all become unreachable when the nine original matching `xi5^2>Xa` branch edges are cut. No shared expression in that closure changes the formal xi5. The four actual system-9 even-profile call nodes are reachable before, and unreachable after, removing their original matching Xkeep/Xcut branch arms (66 cut nodes). These are static guard-dominance and conditional domain reductions, with negative controls; they do not evaluate the source Picard solution.

The actual N4 selector computes b5 through the original order-5 prefix, which explains the new system-9 reach. The full original whole-K slab atlas uses b5*q>=2, conditional on one actual same family and original scale inequalities. Complete range transport of the other 582 arguments, Picard convergence, eta substitutions, chart compatibility and boundary derivatives remain OPEN. RELEASE HOLD remains unchanged.

Replay from this directory. In the combined evidence archive:

- `MATHSCOPE_N3_REACHED` points to `inputs/original-whole-k-n3-diagonal/y-reached.json`.
- `MATHSCOPE_N4_REACHED` points to `inputs/original-whole-k-n4-diagonal/y-reached.json`.
- `MATHSCOPE_N4_GRAPH` points to `inputs/original-whole-k-n4-diagonal/original-whole-k-current-pressure-graph`.
- `MATHSCOPE_ORIGINAL_RUNTIME` points to `inputs/original-core-runtime`.

    node --max-old-space-size=4096 collect_n4_reachable.mjs GRAPH REACHED_JSON
    python audit_new15.py
