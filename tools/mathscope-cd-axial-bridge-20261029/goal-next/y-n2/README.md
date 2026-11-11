# N=2 current/pressure: 44 new natural-series source calls

The graph and registry from GitHub run 43020929929 are authenticated by the exact node-stream and registry hashes below. A typed, conservative static traversal of the nine actual N2 current/pressure roots visits 310,386 nodes, 675 native definition entries and 567 natural-series calls; all reached native definition rules are resolved. The export is `RAW_BASE_ONLY`: the collector supplies an empty coupled facade only to reuse the shared registry reader, and makes no claim about Forced, FiveMap, or any omitted coupled registry. It traverses both sides of every branch; the count is not a count of simultaneously evaluated calls.

All 523 N1-reached calls are literal unchanged AST nodes within this N2 traversal. The new 44 calls use five Y operands:

| Operand | Calls | Actual source meaning |
| --- | ---: | --- |
| #118954 | 18 | Lambda*xi2², actual order-two Picard system 3 |
| #119028 | 10 | Lambda*Xa*exp(log(xi2²/Xa)) |
| #119672 | 1 | 4*exp(log((Xa*exp(log(xi2²/Xa)))/Xa)) |
| #122291 | 11 | Lambda*xi3², actual order-three Picard system 5 |
| #122365 | 4 | Lambda*Xa*exp(log(xi3²/Xa)) |

The order-three Picard body is present even for N=2 because the actual next scale b3 uses its source norms. Under the original Picard variable domain `0<=xi<=sqrt(Xa*exp(t1/16))`, `Xa=4/Lambda`, and `0<t1<1`, all five operands (when defined) simplify to `Lambda*xi²`, with

    0 <= Y <= 4*exp(t1/16) < 64/15 < 5.

The positive-log operands occur only after a source guard selecting `xi²>Xa`, so their log arguments are strictly positive, even at xi=0 under lazy branch semantics. All Picard-coefficient paths to the 11 system-3 log-dependent calls and 4 system-5 log-dependent calls are structurally dominated by matching xi²/Xa branch nodes; removing those branches leaves no path. No `actual_expression_partial` in the corresponding Picard source-body closure changes its formal xi. The one call #119673 is additionally behind a guard requiring `Xa*exp(t1)<xi²`; that is impossible in the actual Picard radial interval. Its static presence in the 567-call inventory is therefore not a claim it runs in the valid Picard domain.

The N2 typed graph contains 37 `actual_background_even_profile` calls for these two actual Picard systems. The audit checks each against a dominating original Xkeep/Xcut guard with **the same X operand**; removal of the safe branch arms leaves none reachable. Their source X-arguments are the actual formal X, `X*t`, xi3², or `xi3²*t`. Every one of the 14 calls using the t products is under its own exact original integral binder t in [0,1]. This is a structural semantic precondition: it does not in itself prove all native formal-to-actual substitutions are hygienic and nonnegative in every reachable caller, or that the Picard implementation converges and honors its stored interval.

Accordingly this is **a conditional source-bound reduction for the 44 new calls**, not a verified 567/567 actual range statement. The N1 523 source-bound argument needs to be transported separately through the N2 callers, and the 37 guarded calls need full native parameter-frame/binder and Picard regularity/domain validation. The original N1 raw unbound result remains 519/523, and current 67-jet/release statuses remain unchanged.

## Portable replay

Keep these files at their workspace-relative paths: `goal-20261111/y/{exact_original_node_children.mjs,original_native_semantic_definitions.mjs}`, `inputs/original-y-replay/reached.json`, `goal-next/y/native_reference_scopes.py`, `axial-exterior/check_source_guards.py`, and the two scripts in this folder. Supply the original N2 graph directory and the pinned source profile. The `reached.json` here is reproducible and need not be archived if regenerated.

    node --max-old-space-size=4096 goal-next/y-n2/collect_n2_reachable.mjs <N2-graph-dir> goal-next/y-n2/reached.json
    python goal-next/y-n2/audit_new44.py --n2-reached goal-next/y-n2/reached.json --n1-reached inputs/original-y-replay/reached.json --registry <N2-graph-dir>/original-source-functions.json --graph <N2-graph-dir> --profile <source-profile-data.mjs> --out goal-next/y-n2/new44-audit.json

Expected SHA-256: N2 uncompressed node stream `75db9fddc311fb7ce8d7968fbde4a52a07521cf8d47feb0b8f302d6bed108987`, N2 registry `6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f`, source profile `df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a`, N1 `reached.json` `5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459`, N2 `reached.json` `4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32`.
