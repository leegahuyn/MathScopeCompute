# Same-run source readback of the first active N3 correction

[The completed GitHub run and full original first-correction artifact](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44582875351) carry exact head `059df9db3a188ce18f3c43a0dca3a92f2e02a4b2`. Its terminal metadata and native candidate progress are preserved here.

## VERIFIED

- The independent Python reader processed all 22,155,584 source nodes and 1,024,352,367 uncompressed bytes. The streamed SHA-256 is `faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96`. The native registry and embedded export manifest are also checked.
- The saved live preappend compact subset contains 1,663 records, all equal at the same source IDs. The 24 energy input roots, 33 spatial labels, and 162 indexed stress maps retain their original quantities, coordinate arguments and derivative slots. Three distinct candidate gauge differences remain at #22154926, #22154928 and #22154930.
- All 40,621 archived typed operands selected for the C73/C74 original steps match the live stream at the same IDs. The six 162-row covariance fields and selected signed bodies, Temporal inverse, Haar and initialized pressure and flux definitions agree. The earlier complete graph has a different header-normalized prefix digest. The equality here covers the selected source slices and declarations.
- The actual FiveMap radial primitive, radial and axial derivative slots, and fixed whole integral use the same integration variable. The incomplete integral uses bounds #17743711 and #17732748. The whole integral keeps fixed bounds #17743711 and #17743713. All five compact Temporal applications were checked against the actual native path.
- The same run produced 40 second Forced inverse candidates in 10 signed phase templates, with 80 returned signed harmonics and 240 typed metadata records for mapped potentials. The initial source path and the precise formal-argument order are checked. The candidate receipt reports 225,012 appended nodes, while the original streamed graph stops immediately before the repeat. The second-phase verification covers the metadata and predecessor source.

## CONDITIONAL

The 24 symbolic cutoff and energy-transfer bounds are applied to the bound live slots with their original physical derivative scaling. This step requires the corresponding uniform weighted input caps. The ordinary FiveMap and Temporal identities require FTC on the actual radial segment, the same smooth branch on that segment and its boundaries, valid differentiation under the integral at the fixed endpoints, and the original shifted phase support conditions. The source readback has no implication of cancellation for the full weighted radial integral.

## OPEN

The three full candidate gauge differences, the actual uniform norms of the first correction, and the repeated Forced append bodies and registry remain open. Support equality at the slow boundaries and a complete second correction also remain open. N7-06 and N8-05 both remain OPEN with 0/67 accepted final jets and RELEASE HOLD.

## Replay

Download the artifact named `mathscope-original-n3-primary-c5` of the linked run and extract it to a new directory. The full original streamed graph and registry stay in that artifact. The compact ZIP contains the readers, pins, manifests, exact receipts, and a log excerpt.

    python -B spatial/readback_corrected_retry.py --reader ../spatial-readback --artifact ARTIFACT --metadata github-run.json --prior PRIOR_FIRST_CYCLE --reference PRIOR_REFERENCE --scratch SCRATCH --out INDEPENDENT.json
    python -B spatial/bind_retry_spatial_cutoff.py --goal GOAL_NEXT --artifact ARTIFACT --run-json github-run.json --readback INDEPENDENT.json --out CUTOFF.json
    python -B spatial/verify_live_mean_gauge.py --reader ../spatial-readback --artifact ARTIFACT --spatial INDEPENDENT.json --compact ../compact-mean-increment/compact-mean.json --scratch SCRATCH --out MEAN.json
    python -B repeat-metadata/verify_live_repeat_metadata.py ARTIFACT github-run.json REPEAT.json

Use a new output location. `PRIOR_FIRST_CYCLE` and `PRIOR_REFERENCE` are the pinned compact predecessor directory and its first-cycle receipt, as described in the earlier independent reader. See [archived operand replay](archived-operands/README.md) for the archived source layout. The replay uses Python assertions.
