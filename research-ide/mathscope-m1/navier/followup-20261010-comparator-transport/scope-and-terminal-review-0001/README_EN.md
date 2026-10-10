# Preserved Theorem 4.6 scope, terminal-auditor review and actual negative controls

**25 original files / 455,419 bytes are preserved unchanged. The preservation check is 302/302 `PRESERVATION_PASS`, with `N106Completed=false`. The frozen 69/1 assessment and all existing verdicts remain unchanged.**

| Original directory | Files | Recorded scope |
| --- | ---: | --- |
| [theorem46-scope-review](raw/theorem46-scope-review/THEOREM46_SCOPE_REVIEW.md) | 4 | 428/428 source/record consistency checks and a reasoned same-profile map of Theorem 4.6(i)–(vi); zero new kernel or Comparator executions. |
| [independent-terminal-auditor-review](raw/independent-terminal-auditor-review/reviewer-receipt-0001.json) | 4 | 74/74 auditor-source and actual-input binding review; no successful final production artifact is inferred. |
| [negative-controls-0001](raw/terminal-auditor-negative-controls-0001/receipt.json) | 9 | The actual cancelled ZIP and actual successful diagnostic ZIP were rejected by the prior auditor: exit 1, `FAIL_OR_INCOMPLETE`. |
| [negative-controls-0002](raw/terminal-auditor-negative-controls-0002/receipt.json) | 8 | The final auditor, strengthened for 35-stage order and exact unit placement, also rejected both actual non-acceptance artifacts. |

A negative-control receipt's PASS means that both real inputs were correctly rejected. The underlying artifact audits remain `FAIL_OR_INCOMPLETE`, `N106Completed=false`. Prior-version cancelled/diagnostic audit counts are 109/174 and 32/114; final-version counts are 109/175 and 32/115. This preservation operation reruns none of them.

The Theorem 4.6 map explains the original leading-profile acceptance scope and separates a conditional recommendation for a future fully evidenced assessment from the current false flags. Neither that source review nor this copy changes `fullOriginalTheorem46CertificationFlag=false` or `entireNewProfileLeanFormalized=false` in an existing assessment.

## Portable paths and precise prior-version provenance

[source-mapping.json](source-mapping.json) records 121 references. **118 resolve by repository-relative paths** to existing mathematical evidence, trusted inputs and preserved old/diagnostic packets. The original ZIPs are not duplicated. **Three supplied PDFs retain their original absolute paths, sizes and SHA values only; their contents are intentionally not copied or republished.** Original PDF reference strings in raw records remain unchanged.

References are resolved by path **and** SHA, since one historical absolute auditor path has two recorded versions. The original reviewer reconstructed prior `83dcdd…` bytes after execution by exactly reversing the strengthening patch and checked them against the SHA recorded during the original executions. Both the reconstruction and its explicit provenance note are retained. It is not represented as a contemporaneous pre-execution snapshot. The final auditor SHA is `81c7991b62e2c9d7a88be179b5ae6d94ca7b9cf2726a8655d3ee512e795d00ef`.

```sh
python -B verify_preserved_reviews.py
```

Verification uses the full repository's relative paths and does not need the original scratch paths. It does not read the external supplied PDFs, import or execute any preserved reviewer/producer/auditor, or run mathematical checks. To write a new receipt, use `--output` with a new filename inside this folder. The 302 checks in [preservation-receipt.json](preservation-receipt.json) are preservation checks, not new mathematical proofs or N1-06 acceptance checks.
