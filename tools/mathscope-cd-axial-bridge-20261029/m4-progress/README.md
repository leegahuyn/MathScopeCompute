# Historical M4 builder and original worker integration

This is a source-based, isolated test of the historical v103 R1 page. It is additional software evidence, with **M4 0/16 and RELEASE HOLD unchanged**. The operating website and original checkout were not changed.

## Verified scope

The source snapshot is pinned to `9595b4de5a1065b694d225c0ad2a14d5aa4435a9`. The modified builder accepts an optional `proof_editor_bundle`; omitting it produced exactly the same patch list, page bytes and manifest as the original builder for the recorded historical input. With the option, it adds one proof editor host and one inline script. Unique-anchor checks and the original reversible-patch check remain active. This comparison concerns the recorded build inputs, rather than every possible baseline.

Two stored browser replays of the generated page recorded a new job/source identity after changing p, immediate clearing after invalid JSON, no uncaught page exception, and no horizontal document overflow at 390x844; screenshots also cover 1200x900. The original R1 P0 worker reached COMPLETED. A separate historical baseline worker comparison obtained the same worker hash and result hash:

- Worker: `c34ab138ca5e088a4bb0a4564b8401b3caf384af4801d47eeb16088d8c4f8bb8`
- Result: `5388648743118a0f0528cb77ebe9f4784dd6fe12351cd140b0a77c246ad246dc`
- Candidate page: `f65f3dcfcb7ce524f4cb9987136416368ca03eb68e3e45905c31fa146bc526cf`
- Editor bundle: `baab30dff43b31d15b8191bb99120b6a3a5ede48e6f0c5e289214730b7553d4e`

The stored hostile-string test found no DOM/script injection, no request with a mutating HTTP method, and no kernel PASS in that session. These are finite test observations. The editor deliberately remains KERNEL_PENDING; it does not submit or certify a fresh Lean job.

## Console correction and limits

`browser-result.json.errors` collects `pageerror`, not all browser console messages. Independent console captures show CORS failures for the existing remote capabilities/health requests and a favicon 404. The historical baseline has the same categories of error, and also a cloud-Lean health CORS error in that capture. The claim is **no observed uncaught page exception in these tests**, not a clean console or verified remote service connectivity.

No current deployed page, new Lean kernel execution, arbitrary G/p/precision mathematical semantics, all-input security property, or complete I3/R1 acceptance criterion was proved. The P0 worker execution and the pending proof editor are distinct paths. A changed job/source hash does not establish that each metadata input changes the theorem's mathematical content. The source generator still produces its fixed integer-coefficient example.

The current read-only review authenticated all 13 source inputs against the pinned Git commit; only the optional builder is modified. The historical `original-hashes.json` recorded 12 of those files, omitting `shipped-proof-data.mjs`; `independent-current-review.json` supplies that missing comparison and does not replace the historical manifest. The current editor bundle equals both the stored independent bundle and the rebuilt bundle byte for byte. No new full browser run was performed for this documentation review.

## Reproduction and delivery contents

`materialize.py` reads the pinned files from `MATHSCOPE_SOURCE_REPO` into this isolated `source` directory. It restores the original builder; `prepare_integration.py` then adds the optional editor once, using sibling `m4-followup` sources. The preparation script intentionally requires unique original markers and is not idempotent. Do not rerun it on an already prepared builder. The prepared source snapshot and prebuilt editor bundle are included for review.

`run_isolated_build.py` additionally needs the historical baseline gzip and the two historical verification/kernel JSON inputs in that checkout. Those payloads are not fresh verification. It checks default parity and writes `built/candidate.html`. Browser scripts need Node, Playwright and Chrome; set `MATHSCOPE_PLAYWRIGHT_PATH`, `MATHSCOPE_CHROME_PATH` and `MATHSCOPE_TEST_URL` as needed. The independent console script also accepts `MATHSCOPE_CONSOLE_URL` and `MATHSCOPE_CONSOLE_OUT`. `baseline_server.py` accepts `/baseline.html` exactly and does not serve a query-string URL; its port can be set with `MATHSCOPE_BASELINE_PORT`.

After the recorded runs, output paths were changed to be relative to each script's directory, and the independent scripts were changed to share the one delivered `source` snapshot and editor bundle. `MATHSCOPE_SOURCE_SNAPSHOT` can override that source path. URL/browser environment overrides were also added. These path-only adjustments preserve test assertions and application code. They passed Node/Python syntax checks; stored browser results were preserved and no browser rerun is claimed for the adjustments. `replay-path-adjustments.json` lists the changes.

From this directory, authenticate the delivered source snapshot and editor digest using `python verify_snapshot.py --repo <checkout-containing-the-pinned-commit> --out rerun-source-digests.json`. This runs `git show` read-only for all 13 inputs, verifies the original and prepared builder against the recorded digests, and checks the bundle SHA-256. The recorded successful run is `source-digest-verification.json`. It proves byte provenance only. The source snapshot must stay in its prepared state for this exact check; materializing the original builder again changes its expected prepared digest until preparation is repeated.

The recommended archive contains the single `source` snapshot, the editor bundle/metafile, materialization/preparation/build/browser scripts, JSON results and screenshots. Omit `build-tools`/`node_modules`, `__pycache__`, the duplicate `independent-review/source` tree and bundle, the rebuilt bundle/metafile, candidate/baseline HTML, and scratch probes/engine entry. The zero-byte `independent-review/built/baseline-built.html` is a failed scratch output and is excluded. Candidate HTML is reproducible from the recorded historical inputs; its recorded hash remains in the results.
