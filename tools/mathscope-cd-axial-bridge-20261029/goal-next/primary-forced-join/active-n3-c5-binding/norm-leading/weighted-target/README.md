# Original target C6 FTC matching against prior directed C7 rows

The earlier C7 source target graph has 216 actual four-face FTC rows, 72 each in the inner, middle and outer recipes. Its distinct existing numeric receipts give directed intervals for those rows. Restricting to the 28 pairs `(r,e)` with `r+e<=6`, two components and three regions gives **168 candidate rows and 672 faces**, listed with original source bodies, IDs and directed intervals in `c7-candidate-168.json`. The 168 *prior* upper intervals all lie below the exact dyadic integer tower T15, `T1=2`, `T_(j+1)=2^Tj`. This is not a bound for the live C6 norm until same-source equality is established.

The original live C6 source uses the same three region recipes but creates them on its own private target graph. Reusing the numerical C7 intervals requires a binding for every live row: the source derivative, four original anchored FTC faces, their exact endpoints, original actual/native arguments, registered function bodies and the literal source normalization. The older R/Z-only aggregate numerical bound is a pointwise target bound; it does **not** imply an upper bound on the different positive `N6` source-norm expression. The later full-slow result includes T but similarly must not be substituted for the native `N6` value without checking the native positive program.

## Live exporter

`export_target_c6_dag.mjs` exports the target object's exact 168 FTC rows after the caller verifies the original private family and target seals. It walks typed nodes and captures actual expression, Picard, quadratic and monotone definitions and their source operands. Integral body, bound-coordinate node and endpoints remain separate. Output is gzip NDJSON containing header, typed nodes, referenced definitions and a trailer; unsupported operations, missing rows and a visit-budget overflow fail closed. Current exporter additionally requires the independently pinned first 117,100-node original source prefix and records its hash. Existing older live exports lacking that header can still be compared without assuming the prefix.

The exporter passes a synthetic 168-row fixture with missing-row, unsupported-operator, source-prefix and visit-budget negative controls. It also successfully walks the actual archived C7 168-row target graph (`test_c7_grammar.mjs`): 22,850 reached nodes, 14 referenced expression systems, three quadratic systems and two monotone systems. That is a typed-grammar check, not a live C6 comparison or a private seal.

## Source and lexical comparison

`match_live_c6_to_c7.py` checks all 168 `(kind,component,r,e)` keys, then independently compares each of the 672 source face roots and the 168 whole FTC roots with the already pinned archived C7 graph. The typed comparator treats integral endpoints in the outer lexical environment and binds the integration variable only in its body. Native expression actual arguments are compared in their outer environment, then registered bodies are compared with their formal variables bound; derivative order is exact. Reassociation/reordering of source add, multiply and maximum are the only algebraic normalizations. Coordinates, literals, branch guards and all other source operations retain their types.

Only the six known target wrappers permit a naming/budget difference: `DirectionalActualTarget_{inner,outer,middle}_{0,1}` versus `ActualCommonTargetRegular_{inner,outer}_{0,1}` or `ActualCommonTargetMiddle_{0,1}`. Both must have derivative limits at least eight, and their body, formal and actual operands are still compared. This accommodates C7's generated limit nine versus C6's limit eight without relaxing any other native function. For a live export without a proved prefix hash the comparator uses no shared-prefix shortcut. The exact pinned comparator also runs binder-renaming, endpoint-scope and derivative-order negative controls; a corner face cannot be exchanged with its integral face.

The archived byte-for-byte self-test is explicitly marked `TEST_ONLY_ARCHIVE_SELF_COMPARISON` and uses an identity shortcut; it is not live evidence. A real match is only reported if a distinct live export matches all rows, all faces and the original numeric bounds. Original analytic interval premises and a live private-seal attestation remain independent of the expression comparison.

## Commands

```text
python work/goal-next/continuation38/target-bound/prepare_c7_subset.py --out work/goal-next/continuation38/target-bound/c7-candidate-168.json
python work/goal-next/continuation38/target-bound/check_c7_directed.py --out work/goal-next/continuation38/target-bound/c7-directed-readback.json
node work/goal-next/continuation38/target-bound/test_export_target_c6_dag.mjs <temporary-test-output.gz>
node --max-old-space-size=2048 work/goal-next/continuation38/target-bound/test_c7_grammar.mjs <target-c7.json> <target-c7-graph.jsonl.gz> <c7-grammar-test.jsonl.gz>
python work/goal-next/continuation38/target-bound/match_live_c6_to_c7.py --self-test --live <c7-grammar-test.jsonl.gz> --out <self-fast.json>
python work/goal-next/continuation38/target-bound/match_live_c6_to_c7.py --live <sealed-live-c6-dag.jsonl.gz> --out <live-c6-c7-binding.json>
```

## Actual N3 readback

The N3 job in GitHub run 43371105453 reports nine original private-family/C5 checks. Its typed DAG has 23,366 nodes and a body checksum recorded in the native receipt. Run the certified comparator with the packaged files to reproduce the 168-row and 672-face match:

```text
python match_c6_certified.py --archive c7-grammar-test.jsonl.gz --candidates c7-candidate-168.json --comparator compare_selector_exports.py --live hosted-43371105453-n3/primary-target-c6-source.jsonl.gz --out replay.json
```

`safe_common_nodes.py` accelerates the comparison only for equal typed records with equal referenced definitions and strictly earlier certified dependencies. `test_safe_common_nodes.py` rejects changed leaves, altered registrations, unsupported operations and forward references.

`classify_weighted_target.py` binds the matched IDs to the norm index. `bind_three_source_integrals.py` checks 54 complete ancestors of the three historical integrals. The directed replay then takes the existing target, chart and integral bounds as premises, and encloses all seven exact N3 roots. The independent integer readback verifies each upper endpoint lies below the tower T15. The N4 source DAG and the complete K norm remain open. RELEASE HOLD.
