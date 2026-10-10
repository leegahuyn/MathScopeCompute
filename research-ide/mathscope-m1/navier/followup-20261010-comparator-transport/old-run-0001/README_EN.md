# Original protected Comparator run: cancelled outcome and resumption

**N1-06 remains incomplete (PARTIAL).** The actual final GitHub conclusion of protected run `37979127351`, Comparator job `113984853927`, is `cancelled`. This directory preserves the failed and unexecuted evidence. It does not alter the original 70 criteria, the frozen **69 PASS / 1 PARTIAL / 0 BLOCKED** assessment, the existing 15-page PDF, or the existing English reports. Both all-nine and all-70 completion flags remain `false`.

The final observation was received at **2026-10-10 10:09:15.456 KST** (raw UTC `2026-10-10T01:09:15.456Z`). The independent preservation audit finished at **10:19:44.538 KST** (UTC `2026-10-10T01:19:44.538179+00:00`). Raw timestamps and bytes are retained under `raw/`.

## Actual execution boundary

| Evidence | Recorded outcome |
| --- | --- |
| Preparation | The first 29 of 30 controller stages completed with exit 0. Building Comparator and nanoda tools does not establish acceptance of the submitted solution. |
| Last started stage | `guard-preflight`, **04:20:20.282990 KST on October 10** (UTC `2026-10-09T19:20:20.282990+00:00`). |
| Last stage log | Only a systemd unit start line and a TTY attachment notice, 131 bytes total. No stage exit code or completion timestamp. |
| Cancellation marker | **10:07:03.240601 KST** (raw UTC `2026-10-10T01:07:03.2406010Z`), **20,802.957611 seconds / 5 h 46 min 42.957611 s** after the recorded preflight start. This is elapsed time between two records, not a measured child-process completion time. |
| Later stages | No recorded `landlock-preflight`, `protected-comparator`, `submitted-type-and-axiom-audit`, or `source-status-after` execution. |
| Acceptance and preservation | No nanoda/Lean solution acceptance, no submitted theorem type/axiom audit, and no `source-hashes-after.json`. The last controller snapshot still says `RUNNING`, with `exitCode: null`. |
| Evidence recovery | Collection and artifact upload succeeded; the original 34-member ZIP was recovered. |

The primary evidence is the [controller snapshot](raw/final-artifact-0001/extracted/result.json), [preflight log](raw/final-artifact-0001/extracted/guard-preflight.log), [whole job log](raw/final-artifact-0001/job-113984853927.log), and [final API observation](raw/github-observation-025.json). The unchanged [portable Comparator audit](raw/final-artifact-0001/comparator-portable-audit.json) records **138/163**, `FAIL_OR_INCOMPLETE`, and `N106Completed=false`. Its 25 unmet checks include absent or unfinished evidence; they are not 25 theorem counterexamples, proof of changed source, or a nanoda rejection.

The recorded first probe uses the original `systemd-run --user --pty --wait --collect --property=RestrictAddressFamilies=~AF_UNIX` command and `probe.py unix-socket`. There is no observed AF_UNIX denial result. These logs do not identify the internal cause of the stalled TTY/systemd/probe transport. The stopping point is also distinct from the historical final Git-status warning problem.

## Preservation and independent verification

The [path mapping](source-mapping.json) records every original absolute path, original relative path, destination relative path, byte count, and SHA-256. **62 files / 790,215 bytes** retain their relative hierarchy under `raw/`.

| Location | Preserved evidence |
| --- | --- |
| `raw/final-artifact-0001/` | Original receipt, portable audit, whole job log and API response, original ZIP, and all 34 extracted files |
| `raw/github-observation-016.json` … `025.json` | Actual observations retained after publication |
| `raw/root-observation-001.json`, `raw/root-run-metadata-001.json` | Raw root observation and run metadata |
| `raw/stage-analysis-001/` | Historical analysis and pinned controller/probe/workflow/configuration inputs, written before the final cancellation; use the final artifact and observation 025 for the final outcome |

The original **135,397-byte ZIP** is stored without recompression. Only its duplicate base64 encoding is omitted. The mapping preserves the omitted encoding's size and SHA and records exact decoded-byte equality with the stored ZIP. Its original mention in the received receipt remains unchanged.

The [independent preservation receipt](preservation-receipt.json) records **252/252 `PRESERVATION_PASS`**: original-to-copy bytes, 34 ZIP members against extracted bytes, original receipt hashes, API response against whole-job bytes, and the actual incomplete outcome. Ten frozen repository files and the existing PDF were also checked unchanged. **252 counts preservation checks; it is not added to the 163 N1-06 acceptance checks or to mathematical theorem counts.**

| File | SHA-256 |
| --- | --- |
| Original artifact ZIP | `1af31713f8f021605af509bab4634fed7ab041636f6f1670be2bd3e3c61788d2` |
| Original received receipt | `1bfa73d215a287183fc554c0d1a965ed2955b08eabe8475b0f737b8920e28715` |
| Original portable Comparator audit | `d63ee66217a2b4dea4a81c7b91cb7e762ac7c2b52c48828960c4fca3cbfbbbbe` |
| Final observation 025 | `e93a2f3205c12b2aa4a200724f7ca1d2d6119d1ed34354270b062303f1442fa3` |
| Path mapping | `be8fdbe37d5c26117c2f0d348f6d356d87a4be3bf1a8e967eaff1a8fc8730a2e` |
| Independent preservation receipt | `4feddf1cbbda6b42b56123783fb73432d6d191227d3e498ed6a213f6ff6c0166` |

For portable byte verification, run the following from this directory. It requires neither the original scratch directory nor a new output file:

```sh
python verify_preserved_evidence.py
```

For an additional comparison with the original scratch files:

```sh
python verify_preserved_evidence.py \
  --source-root /workspace/scratch/9a6c38c54c2e/tmp/n106-live-after-freeze
```

## Exact resumption point

The unchanged original N1-06 criterion requires storing the **actual submitted theorems' `#print axioms` and Comparator results**, without confusing intentional challenge placeholders with proof-root dependencies. The user's remaining condition is an independent Comparator execution preserving the original protections. This cancelled run does not promote the [frozen 69/1 assessment](../../followup-20261010-final-stress-audit/ORIGINAL_NINE_GATES_ASSESSMENT_2026_10_10_3.json).

Resume by diagnosing the outer TTY transport and systemd user session at the first preflight. Preserve the original `--pty`, AF_UNIX restriction, unprivileged user, Landlock, original source, kernel, and dependency pins. Record new execution evidence under a separate attempt. Reassessment requires an actual protected Comparator outcome, mandatory nanoda/Lean acceptance, submitted theorem type/axiom output, and final source-preservation evidence. This preservation task neither performs such a new run nor claims its success.

Observation 025 already shows the corrected run `37992645347` jobs `114093554886` and `114093555036` as `in_progress`. That is the status **at that observation**, not evidence of success. Further diagnosis and outcomes belong in new files and receipts. This bundle is follow-up evidence intended for a possible `.4` publication; it is not claimed to be contained in the already published `.3` ZIP. The existing PDF was not modified, and no final combined PDF was generated.
