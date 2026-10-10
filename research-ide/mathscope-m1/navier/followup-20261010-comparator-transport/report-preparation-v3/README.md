# Final handoff appendix v3: actual terminal-source integration

This new scratch directory extends the frozen v2 input contract. It edits none of v1, v2, the archived old/diagnostic/production packets, the original criteria, the existing assessments or English reports, the frozen 15-page PDF, or the published `.3` release.

**No PDF, successful future artifact, or 70/0 assessment has been generated.** The actual subsequent run is now known: `38014602021`, job `114101981614`, source `55dacb898f8c204bf0c5925ea901d75d6c2d0f46`. Its initial binding records `in_progress`, null conclusion, and no gate completion. The candidate's final status/conclusion, artifact, final audit and new assessment remain `null`.

The original PDF authoring marker has already been used for this continuing report. Do not run it again.

## Execution roles and separate source bindings

| Input | Preserved role |
| --- | --- |
| `oldFailedExecution` | Actual cancelled run `37979127351` / job `113984853927`, original 138/163 incomplete audit. It never becomes the new gate run. |
| `diagnosticHistory` | Actual successful transport diagnostic `38013278865` / job `114097893399`. Its diagnostic scope never establishes N1-06. |
| `gateExecution` | Actual protected Comparator run `38014602021` / job `114101981614`, using the frozen reviewed terminal auditor. Only its final actual artifact/audit can establish N1-06. |
| `gateExecution.auditInputsManifest` | Original eight-file TRUST manifest. It intentionally retains historical commit `8c4271aa…`; it is not relabelled as the new runtime source. |
| `gateExecution.actualRunBinding` | Separate actual run/job/head binding, eight runtime files, SHA-256/Git blob identities and actual initial observations. A final real ZIP must contain those exact runtime bytes. |

The runtime binding SHA is `5f728471bfac35a987f927fccb722452f60635f5a2707cb2b4cf1c8bc646bcab`; the historical manifest SHA is `48341732c4eac4a991ed5b65b786beedc9f1d7098a97698ce99c89dead22a273`. Both are preserved separately in the input and eventual build manifest.

The reviewed terminal auditor SHA is `81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef`. Its actual source-review receipt reports 74/74 PASS and `N106Completed=false`; source review is not an artifact result. The report generator hashes this source without importing or executing it.

## Files and present refusal

- `input-template.json`: observed run/job/head and existing frozen references, with all unknown final fields left null.
- `input-schema.json`: JSON Schema 2020-12 for this exact v3 structure.
- `VALIDATION_CONTRACT.md`: historical and terminal branches, exact source/artifact binding and assessment rules.
- `build_handoff_addendum.py`: scoped standard-library schema/evidence reader and guarded renderer. The schema reader supports only the keywords used by this bundled schema; it is not a general JSON Schema implementation.
- `verify_preparation.py`: real input checks and refusal tests using actual historical evidence, with explicit in-memory negative controls. No fake PASS fixture is constructed.
- `unchanged-inputs-before.json`: 172 frozen files across v1/v2, the three archived packets and the original criteria.

```sh
python -B build_handoff_addendum.py --input input-template.json
```

The actual candidate returns exit **2**, `PENDING_ACTUAL_RESULTS`, `N106Completed:false`, 69/1 counts and nine concrete missing final conditions. Adding `--finalize` is also refused before any PDF renderer is imported or an output is created. The preparation verification checks the separate historical/runtime eight-file bindings and the original prior files. It does not exercise the future successful-artifact/rendering branch because no such artifact exists in this input.

## Supplying actual final results later

Keep this template frozen and copy it to a new `final-input.json`. Fill only actually observed values:

1. Actual `artifactId`, original `artifactZIP`, byte-pinned raw jobs/artifacts `finalObservation`, and literal `actualJobStatus` / `actualJobConclusion` from that observation.
2. The actual independent audit using the selected schema, with its exact source, historical manifest and separate runtime binding. All IDs, hashes, eight runtime files and archive members must agree.
3. One to three factual Korean findings, an actual final timestamp, and—only if supported—a **new** unchanged-criteria assessment. The root task owns that assessment producer; this renderer does not generate an assessment.
4. Set `state=FINAL_ACTUAL_RESULTS_VERIFIED` only after those actual facts exist. A FINAL flag alone cannot bypass missing evidence.

For the new `MathScope.OriginalProtectedComparatorTerminalAudit/1` branch, N1-06 PASS requires actual GitHub `completed/success`, controller `PASS` with integer exit 0, protected Comparator integer exit 0, and `postcheckOnlyFailure=false`, in addition to the original source/guard/kernel/theorem checks. The old portable-schema branch keeps its original narrow postcheck exception; that exception cannot be used by the terminal branch.

A fully bound unsuccessful final audit can retain 69/1. Missing or conflicting artifact/source bindings still block finalization. An actual PASS also cannot display 70/0 until its complete binding and the new unchanged-criteria assessment have been verified.

## Publication, rendering and QA boundary

The `.3` release, original local/public comparison and preserved public ZIP remain fixed. `publicationFollowup` is null; no `.4` tag, release ID or asset is predicted. If an actual new release becomes available, provide its observed commit/tree/tag, release API payload, asset, local ZIP, actual public download and completed same-commit publication CI receipts.

Two appended pages make **17 total**; a follow-up publication requires three appended pages, **18 total**. The renderer refuses text overflow. Reader times remain **KST first** with exact raw UTC alongside. Once actual results have been bound, the existing final command shape is:

```sh
python -B build_handoff_addendum.py \
  --input final-input.json \
  --finalize \
  --font-dir /workspace/scratch/afa9cd11a21b/tmp/pdfs/fonts \
  --output /workspace/scratch/9a6c38c54c2e/output/pdf/MathScope_M0_M1_Handoff_2026-10-10_KO.pdf
```

That command is **not run to create a PDF during preparation**. New combined PDF, appendix and build manifest paths are exclusive; existing files cannot be overwritten. The original 15 decoded streams, text and media boxes, and the original PDF bytes remain checked. Every page of the eventual new PDF still needs rendered visual QA before delivery. No v3 PDF or layout QA is claimed here. The parent owns final delivery and publication.

한국어: 현재 v3는 실제 실행 식별자와 입력만 연결한 준비본이다. 원래 기준은 유지하며 최종 실행·artifact·독립 감사가 없으면 69/1과 전체 완료 false를 유지하고 PDF 생성을 거부한다.
