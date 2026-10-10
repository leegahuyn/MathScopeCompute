# v3 actual-evidence contract

This is a report input-schema integration. It changes no original M0/M1 gate. It does not run Comparator, nanoda, Lean, mathematical checkers or the artifact auditor. All source and evidence files are read by byte-pinned references. No final result is inferred from code review, publication or initial run metadata.

## Frozen baseline

| Object | Exact SHA-256 |
| --- | --- |
| Original 15-page PDF | `cad9a136c0f4986f16f7f2347e5fc45441f230687e6f544a89e19354ea332888` |
| Historical 68/2 assessment | `913faa68844dc0f8108ea6b3e0a2144dfcd6e2d2213c4861954f67e99ab476a9` |
| Frozen 69/1 assessment | `e57681b7bb751967b406ad440942728ecfd8fe47eb9672129ff19c8a7eb6634c` |
| Original 70 criteria | `854f67efad0f6d0cda7ab784611e5352b753ddd297fbac5a1382f4032ba02dc2` |
| Original NS gates | `57e993971939ef47ad5d81506e3e568ff256c4621bc5ade091c6e089ba895080` |
| Old-run preservation audit | `4feddf1cbbda6b42b56123783fb73432d6d191227d3e498ed6a213f6ff6c0166` |
| Old cancelled run original ZIP | `1af31713f8f021605af509bab4634fed7ab041636f6f1670be2bd3e3c61788d2` |

The old actual run/job/artifact are `37979127351` / `113984853927` / `11654200401`. Its job remains `completed/cancelled`, protected exit absent, audit `FAIL_OR_INCOMPLETE` 138/163 and `N106Completed=false`. It is always excluded from the later gate. Every listed diagnostic run is also excluded.

## Common actual final execution binding

`gateExecution.expectedAuditSchema` selects one of the two schema branches below. Final bindings must contain actual positive run/job/artifact IDs and an actual 40-character head commit, the raw final jobs/artifacts observation, independent audit, auditor source, input manifest and original ZIP.

The exact job must belong to the exact run and be completed with a literal non-null conclusion. Candidate `actualJobStatus` and `actualJobConclusion` are null until the final observation exists, then must equal it exactly. Audit fields must preserve those same actual values. Conflicting repeated records fail. An artifact must belong to the same run/head and have the same ID, digest and byte count as the original supplied ZIP. Every file member's name, byte count and SHA is compared to the actual audit; the archive is never recompressed to invent an expected hash. Terminal audit inventories count file entries as its real auditor does, excluding directory entries; the old portable branch retains its prior inventory rule.

The audit's IDs, final observation SHA, source SHA, manifest SHA, ZIP hash/size and literal check counts must agree. Every check result must be a JSON boolean, and total/passed must equal the actual list. Merely setting an input FINAL flag, N106 boolean or display counts cannot replace these bindings.

## Branch 1: historical portable audit

Schema: `MathScope.OriginalProtectedComparatorPortableAudit/1`.

The existing v2 interpretation is retained: `portableInputManifestSHA256` binds the supplied manifest, whose `mathscopeCommit` must match that gate's source head. `actualRunBinding` is null in this branch. N106 PASS requires complete actual audit PASS, protected exit 0, 2,669 original source entries, and the two submitted theorem axioms within `propext`, `Quot.sound`, `Classical.choice`.

The historical controller rule remains literal controller PASS or the original independently established narrow `postcheckOnlyFailure=true` exception. A controller/job failure is not relabelled as a success. This exception is confined to this historical branch.

## Branch 2: actual terminal audit

Schema: `MathScope.OriginalProtectedComparatorTerminalAudit/1`.

| Independent binding | Exact identity |
| --- | --- |
| Reviewed terminal auditor | SHA `81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef` |
| Historical TRUST manifest | SHA `48341732c4eac4a991ed5b65b786beedc9f1d7098a97698ce99c89dead22a273`; historical commit `8c4271aa5a35b1d34c30279fb306a099944e4823` |
| Actual runtime/run binding | SHA `5f728471bfac35a987f927fccb722452f60635f5a2707cb2b4cf1c8bc646bcab` |
| Bound actual run/job/head | `38014602021` / `114101981614` / `55dacb898f8c204bf0c5925ea901d75d6c2d0f46` |

`auditInputsManifest` is the historical TRUST manifest. Its original eight files are individually hashed; Git blob identities are checked where provided. **Its historical commit is intentionally not required to equal the later runtime commit.** The actual auditor's `portableInputManifestSHA256` must equal this historical manifest SHA.

The separate required `gateExecution.actualRunBinding` has schema `MathScope.ActualProtectedComparatorRunBinding/1`. Its run ID, job ID and `mathscopeCommit` must match the supplied actual gate, and its original-acceptance SHA must remain fixed. Its SHA must equal both the frozen auditor binding and the actual receipt's **`actualRunBindingSHA256`**. Workflow path and branch are bound too.

Eight runtime files are required: `run_protected.py`, `protected_transport.py`, `metadata_probe.py`, `test_protected_transport.py`, `ns-comparator-verification.yml`, `source-original-run.py`, `pins.json`, `probe.py`. For each, its stored byte count, SHA-256 and Git blob SHA-1 must match the actual local snapshot; its `artifactName` must identify the exact same bytes inside the actual final ZIP. All local input paths and hashes are retained in the eventual build manifest.

The binding's byte-pinned initial observation and run metadata must identify that same source/run/job. They preserve the original `in_progress`, null conclusion and `N106CompletedAtBinding=false`. Initial observation timestamps must precede the recorded binding time. A successful later outcome cannot overwrite those initial values.

A terminal N106 PASS additionally requires **all** of these literal actual outcomes:

- GitHub job `status=completed` and `conclusion=success`.
- Controller `actualControllerStatus=PASS`, integer `actualControllerExitCode=0`.
- Integer `actualProtectedComparatorExitCode=0`.
- `postcheckOnlyFailure=false`; the historical exception is unavailable.
- Complete audit PASS and the same original source inventory, actual submitted theorem/axiom constraints and all recorded original guard/kernel/source/Comparator acceptance checks.

The frozen auditor itself checks the 35 actual stages in exact order, unit placement and preserved protected arguments. This generator binds its source and output; it does not rerun that audit. Without a real final ZIP, runtime-to-artifact comparison has not happened and N106 remains open.

## A new unchanged-criteria assessment

An actual PASS still cannot display 70/0 without a **new** supplied assessment. All nine original `criterionText` / `criterionDetailText` strings must equal the original 70 JSON entries. Original 70 and NS-gates hashes, parameter-expression SHA and same-profile evidence SHA must match the frozen 69/1 snapshot. The N1-06 row must cite the exact new independent audit SHA.

The eight other completed gates stay PASS. N1-06 status, total counts, remaining-gate list and both all-nine/all-70 booleans must agree with the actual bound audit. A new PASS assessment must be 70/0/0 with no remaining gates and true completion flags. An incomplete audit cannot support those values; a fully bound unsuccessful result retains 69/1/0 and false flags. Its new 69/1 assessment is optional. Missing/conflicting source or artifact bindings still prevent finalization.

New assessment time must not precede the frozen assessment. Final report time must not precede the final observation or supplied new assessment. Historical 61/7/2, 68/2, 69/1 and their source files are never overwritten. This scope is original acceptance completion; it adds no claim that the entire global continuation and stress construction is formalized in Lean.

## Actual publication history

The `.3` main, download and CI receipt hashes remain fixed; its public ZIP remains 114,184,222 bytes with SHA `94bb85e441a322cd57102b5fc2bfb159d53f82b37c35de119f79a97d9f4447c8`. The historical local/public equality is established by its frozen receipt. The former local `dist` path may later hold a `.4` package; the generator rechecks the preserved actual `.3` public download instead of relabelling it as a local archive.

`publicationFollowup` is null or an actual new publication with main/tree/tag, release and asset IDs, exact release API response, local ZIP, actual public download, successful local/public byte comparison and completed same-commit publication CI. API release/asset metadata must match all supplied identities, ZIP bytes, digest and URLs. A planned tag is not evidence. A branch-only target needs a separately observed resolved commit and an explicit contract extension; it cannot be inferred from a later branch state.

## Refusal and rendering boundary

- Pending actual results: exit 2 and no PDF; `--finalize` remains refused.
- Invalid or mismatched evidence: exit 1 and no PDF.
- Fully bound actual final evidence and reviewed FINAL input: ready exit 0; PDF creation still needs explicit `--finalize` and new output paths.
- Korean factual findings: one to three paragraphs, each at most 480 characters.
- KST is the reader-facing timezone, with exact raw UTC retained.
- Default 2 appendix / 17 combined pages; a supplied new publication requires 3 appendix / 18 total pages.
- Overflow is rejected, existing files are not replaced, and original 15 decoded content streams, extracted text, media boxes and PDF bytes remain checked.
- All pages need new rendered visual QA after actual generation.

Preparation tests use actual historical/diagnostic failures and the actual pending runtime binding, with clearly labelled in-memory negative controls. No successful terminal audit fixture, new assessment or PDF is manufactured. The positive final-artifact/ZIP and visual layout branches remain explicitly unexecuted until actual evidence arrives.
