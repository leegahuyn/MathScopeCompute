# Raw preservation of assessment preparation — 0001

This packet preserves the narrow package archive selection review, an actual assessment-writer rejection of a cancelled run, and the independent writer source review. **It does not complete N1-06: `N106Completed: false` and the existing separate 69 PASS / 1 PARTIAL / 0 BLOCKED assessment remain in force.**

Preservation was verified at **10 October 2026, 11:32:57 KST**; the audit timestamp is `2026-10-10T02:32:57.851829+00:00`. The prospective production target recorded by these inputs is commit `55dacb898f8c204bf0c5925ea901d75d6c2d0f46`, run `38014602021`, job `114101981614`. This preservation does not supply that run's terminal result.

## Original records and their scope

| Raw directory | Files / bytes | Recorded result and meaning |
| --- | ---: | --- |
| [package-archive-review](raw/package-archive-review/) | 10 / 66,837 | 37/37. A narrow review of selecting exactly two original CI ZIPs by fixed byte count and SHA. No complete release verification or package build was performed. |
| [terminal-assessment-local-0001](raw/terminal-assessment-local-0001/) | 4 / 60,351 | 5/5 `PREPARATION_PASS`. The assessment writer actually rejected the audit of the cancelled historical run with **exit 1**. |
| [terminal-assessment-review-0001](raw/terminal-assessment-review-0001/) | 18 / 521,720 | 468/468 `PASS_SOURCE_REVIEW_ONLY`. A source review of the frozen writer and its actual rejection evidence. It ran no new Comparator, Lean kernel, or assessment writer. |

All **32 original files, totalling 648,908 bytes**, were copied without alteration. The [preservation receipt](preservation-receipt.json) records **480/480 `PRESERVATION_PASS`** for byte, hash, and record consistency checks. These are preservation checks, not additional mathematical theorems or successful production runs.

The frozen assessment writer SHA-256 is `d471135f614fb3ec9d18020c7744433eb4646ad7793ba720a7f127fe9eceb314`. The actual rejection log contains `Actual terminal artifact audit did not pass`, and stdout is empty. The command's `PENDING_ACTUAL_INDEPENDENT_REVIEW.json` and `MUST_NOT_EXIST.json` arguments named files that did not exist. This preservation did not create them.

## Portable references and historical byte versions

[source-mapping.json](source-mapping.json) retains the original absolute paths and separately supplies repository-relative locations for the exact referenced bytes. **201 reference bindings can be checked within the repository.** Where a recorded path later held different content, the mapping uses both path and SHA to select its captured byte version.

The historical N1 README resolves to the same **5,543 bytes** as the Git object cited by the original assessment. The later README and historical assessments remain unchanged. The package review's manifest observations are also historical records; the preservation verifier does not impose the old manifest state on later regeneration.

The **three user-supplied PDFs** retain only their original path, byte count, and SHA references. They occur eight times among the recorded references. Their document contents were not copied or republished here, and the default preservation verifier does not read them.

## Recheck

From this directory inside the complete `research-ide` repository, run:

```bash
python -B verify_preserved_preparation.py
```

For an additional preservation receipt, use a new filename:

```bash
python -B verify_preserved_preparation.py --output preservation-receipt-recheck-0001.json
```

The verifier checks copied raw bytes, exact repository references, and the recorded scope of the existing results. It executes no original reviewer, assessment writer, Comparator, Lean kernel, or package builder. Original scratch paths remain as execution provenance; repository-relative mappings supply the internal byte checks.

No final gate assessment or final PDF was generated. This preservation leaves the original 70 criteria, historical 68/2 and 69/1 assessments, existing 15-page PDF, and published `.3` release unchanged.
