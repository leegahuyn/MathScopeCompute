# R1-08: read-only operational rollback audit

The exact original blueprint (page 68) requires a declared release scope, module status distinguished from global HOLD, prepared patch/test/rollback materials, and an actual post-publication screen before recording deployment completion. It does **not** require performing a live rollback. The handoff (page 11) additionally states the I0–I3 and selected P/Y/N package prerequisites. Existing R1-08 registration is limited to the separate owner-private M1/M2 candidate; it does not establish acceptance or deployment of that candidate on the current WebsitePublisher operating site.

## Current authenticated provider metadata

`provider-metadata.json` records read-only authenticated WebsitePublisher project 29770 page/version metadata, observed 2026-11-12 16:39:09 UTC. Current `v0.3.1.html` is version 137, provider version hash `9171eb0c`; version history lists 137 entries, `tier_versions=0`, and selected versions 137, 136 and 103 each have `within_tier=false`. This is a provider metadata result, not a full-content download or proof the account can retrieve or restore any listed version. The current stored-page reported size is 29,580,450 bytes; the previously archived HTTP response is 30,707,818 bytes. They are different representations and are not asserted byte-equal. Current HTTP bytes were not freshly read in this audit.

The tool `rollback_page` creates a new live version from a previous version. It has no documented dry-run parameter. Invoking it would change the operating site, so it was not called. A genuinely authenticated production rollback rehearsal is OPEN; successful metadata reads or an offline reverse transform cannot prove it.

## Byte and browser rehearsal

`rehearse.cjs` uses the **archived public HTTP body**, SHA-256 `a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48`, never the editable WebsitePublisher source. It inserts the previously tested pointer CSS at a unique anchor in memory, yielding candidate SHA-256 `bed25212d4d3397d2c5d71092afe141ef87c165b6a9fba00d1827c97ef4d84a3`; reversing the exact insertion reproduces the baseline byte-for-byte. A changed baseline and two changed-candidate controls fail the hash gate. This is a hypothetical local transform, not an authorized or deployable WebsitePublisher patch. No remote write or rollback took place.

`browser.cjs` serves those exact locally patched bytes on loopback. On desktop 1280×900 and mobile 390×844, each launcher was hit by the pointer and opened/closed its own dialog. External requests were intentionally blocked: each run reports 10 blocked requests and 10 `net::ERR_FAILED` console messages. There were no uncaught page exceptions in these two runs. These observations do not test live networking, full functionality, or a hosted candidate.

## Source gate and remaining evidence

`gate.mjs` replays the original evaluator using the recorded 19 private-candidate artifacts. The exact reviewed private scope is accepted; appending a claim that it confirms a production rollback is rejected with `CRITERION_REVIEW_REQUIRED`, and an altered artifact is rejected with `CRITERION_ARTIFACT_HASH_MISMATCH`. With the single supplied criterion receipt, the assessment returns `canFreeze=false` and `publicationConfirmed=false`. This is a single-criterion test: the existing 16/16 scoped assessment is separate, and the evaluator's publication flag deliberately never independently confirms any deployment.

For a future operational R1-08 review, the missing evidence must match its exact claimed production scope: the actual WebsitePublisher editable-source version and integrity/hash mapping to the HTTP response; a reviewed production-targeted patch, test results and recovery material; provider capability and access to the chosen recovery target (version metadata alone is insufficient); actual candidate version/deployment identity and post-publication screen plus required human-facing workflows and diagnostics; and an independent reviewer anchor for that exact evidence. An *actual production rollback exercise* would additionally require an authorized state-changing restore and its provider result/new version and post-restore byte/screen checks. It is not a prerequisite stated by the original R1-08 text, but cannot be claimed on the present evidence. Existing CSS and P7 failures in the separate private candidate and the historical operating launcher overlap remain scoped as recorded.

Overall operational R1-08 remains OPEN; final global RELEASE HOLD remains. No Lean job was run.

## Local reproduction

```powershell
$out = '<checkpoint>/tools/mathscope-cd-axial-bridge-20261029/goal-next/m4/r108/operational-replay-audit'
$snapshot = '<checkpoint>/inputs/operational-m4/production-v137.html'
node "$out/rehearse.cjs" $snapshot $out
node "$out/browser.cjs" $snapshot '<Playwright module>' '<Chrome executable>' $out
node "$out/gate.mjs" '<original acceptance.mjs>' '<reviewed evidence repository root>' "$out/gate.json"
```

The HTTP snapshot is in the previous checkpoint package. For the gate use the root-level evaluator at research-ide/mathscope-m4/acceptance.mjs from Continuation17, SHA-256 cf62892821d89aabec7d528cdc0b1b135234033923882b1b76ac47ea192738fb. The artifact root is the merged package directory. The historical evaluator under history/20261111 predates this private registration. The provider metadata came from a read-only call. The fresh HTTP hash readback is recorded in the Continuation27 preservation receipt.
