# Preserved actual protected-Comparator transport repair and publication

This directory preserves **the reviewed implementation, recorded local tests, independent source review, authenticated Git publication, and the actual start of the subsequent protected run**. It contains no final result for that run. **`N106Completed=false`; the frozen separate assessment remains 69 PASS / 1 PARTIAL / 0 BLOCKED.**

## Recorded evidence

| Raw evidence | Actual recorded scope |
| --- | --- |
| [Local verification receipt](raw/ns-guard-repair-20261010/protected-controller-local-0001/receipt.json), original streams, ten source snapshots and diffs | Twelve actual local tests, exit 0. These tests did not execute the actual protected Comparator. |
| [Independent implementation review](raw/ns-guard-repair-20261010/independent-production-review/reviewer-receipt-0001.json), verifier, report and referenced inputs | 73/73 PASS. The reviewer did not rerun tests, guards or Comparator. The review retains the original `--pty`, AF_UNIX, Landlock, original-source and kernel conditions. |
| [Workflow syntax receipt](raw/ns-guard-repair-20261010/production-workflow-syntax-001.json) | Actual workflow and four shell blocks passed syntax checks. |
| [Git object publication](raw/github-protected-transport-upload-20261010/receipts/object-publication.json) and [main publication](raw/github-protected-transport-upload-20261010/receipts/publication.json) | The five reviewed source files bind byte-for-byte to Git blobs and the actual published tree/commit. Main publication was recorded at 2026-10-10 10:48:36 KST (raw UTC `2026-10-10T01:48:36.227Z`). |
| [Local alignment receipt](raw/github-protected-transport-upload-20261010/receipts/local-alignment.json) | Local `a2130ba9…` and remote `55dacb89…` have the same tree. The initial local-main assertion error and the subsequent ancestry-checked fast-forward remain literal in the raw record. |
| [Initial protected-run observation](raw/ns-guard-repair-20261010/protected-run-0001/observation-002.json) and [actual run metadata](raw/ns-guard-repair-20261010/protected-run-0001/run-metadata-001.json) | Run `38014602021`, job `114101981614`, actual source commit `55dacb898f8c204bf0c5925ea901d75d6c2d0f46`. At 10:51:42 KST (raw UTC `2026-10-10T01:51:42.233Z`), step 6 was `in_progress`, conclusion null, with no artifact. Later outcomes are not backfilled into this snapshot. |

The repair preserves the original inner `--pty` and AF_UNIX-protected command and observes streams, EOF and actual exit through an outer terminal. An exit 0 obtained only during timeout cleanup does not become success. Recorded implementation tests and review do not prove that the subsequent complete Comparator run succeeds; its actual final artifact must establish that separately.

The published commit is `55dacb898f8c204bf0c5925ea901d75d6c2d0f46`, tree `95a671fe81b64ed2303da01c4f6c887691fa8287`. Before metadata alignment the local commit was `a2130ba975891e62dacba7572f137e704551341a`; this distinction is preserved. The actual earlier **local** main was `0056147e90bdd4fd4f575aa4df08aa5f937301fd`, while the earlier **remote** main was `c61d35806bb3579131eb7ff8c55187ae26209ade`. The original assertion failure and correction explanation are retained unchanged.

## Portable provenance verification

[source-mapping.json](source-mapping.json) records **30 raw files / 254,339 bytes**, plus ten aliases resolving reviewed original source paths to the exact copied snapshots without redundant copies. All 29 independent-review input paths resolve within the packet. Requested evidence and its referenced upload payload/root-tree request, diagnostic review receipt and initial run observation are included; there are no omissions. Source/destination bytes and SHA-256 were compared during copying.

[preservation-receipt.json](preservation-receipt.json) records **252/252 `PRESERVATION_PASS`**, including the unchanged bytes/hashes of 67 frozen old-run files, 49 diagnostic files and eight v2 files: 124 prior files altogether. **This is a preservation-check count, not a mathematical-theorem count or a Comparator completion count.** No recorded test or reviewer was rerun.

```bash
python -B verify_preserved_production.py
```

The default command reads only this packet and works without the original absolute paths. `--verify-frozen-inputs` additionally checks the 124 original workspace files when present. `--output` accepts a new receipt path inside this directory and refuses to replace existing evidence.

| File | SHA-256 |
| --- | --- |
| source-mapping.json | `150f8d74887097c6f7e1e16ce038d890558f7c878d43beb920af45e556ed63cd` |
| preservation-receipt.json | `6bdd8620599c54efb9bb95704b125c135036fd232afdd2fef04dda56df1dc689` |
| verify_preserved_production.py | `23a8ef9966a409889d429dfa92c197a829ec5f606688a88420f1d9c4be2cf3cc` |

The prior failed/diagnostic/mathematical evidence, original 70 criteria, frozen 69/1 assessment, 15-page PDF and published `.3` release remain unchanged. See [V2_COMPATIBILITY_READONLY.md](V2_COMPATIBILITY_READONLY.md) for the report input-schema assessment. This preservation operation performed no commit, publication, new Comparator run or PDF generation.
