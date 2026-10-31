# Independent M4 proof job fixture review

Result: PASS for the isolated fixture; not acceptance of M4 I3-05 or evidence of a deployed integration.

The three source modules' bytes were compared to `git show` of commit `9595b4de5a1065b694d225c0ad2a14d5aa4435a9` and their SHA-256 manifest entries. The original HTML and CSS hashes match the corresponding Git blobs. The candidate HTML contains exactly one insertion, the proof-job host, and the CSS is byte-identical to the source. See `provenance-replay.json` and `verify_provenance.py` (the latter records the local repository location).

`node --test proof-session.test.mjs` passed 5/5 on the actual checked-in fixture modules. A separate Chrome/Playwright execution of `visual-check.cjs`, with fixture content served from `127.0.0.1:38771`, checked all eight inputs, invalid JSON, out-of-order generation, console errors and desktop/mobile horizontal overflow. Browser plugin was not available. Its screenshots and machine-readable outcome are in this directory. Screenshots show the fixture only; they are not evidence that the original R1 worker functions were executed.

Review found the mounted widget originally ignored a provided `initial` option when populating its textarea and immediately replaced it with the default input. `proof-job-ui.mjs` now uses `options.initial ?? DEFAULT_M4_PROOF_INPUT`. `initial-regression.cjs` verifies in Chrome that `{...DEFAULT_M4_PROOF_INPUT,p:3}` appears in the textarea and active job and that `destroy` removes the widget. After this fix, the complete browser flow was rerun and passed. This change applies only to the isolated candidate.

Limits: the original R1 worker and build-release-lab integration do not run in this fixture, its UI has not been deployed, and no current Lean kernel verification occurs. The producer creates a fixed integer fixture: several input changes update metadata or namespace rather than changing the mathematical theorem. `KERNEL_PENDING` is not PASS. No M3, M4, Y, or jet acceptance counts may be changed based on these checks.
