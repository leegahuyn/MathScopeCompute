# Actual protected Comparator and the remaining printed-type parser issue

The production run **38014602021**, job **114101981614**, actually completed
successfully. Its original controller finished at **2026-10-10 11:44:09 KST**
(`2026-10-10T02:44:09.356301+00:00`); all 35 command stages exited 0. The original
nanoda and Lean kernels accepted, and the final Comparator success marker follows
the original Quot postcheck. The before/after original source inventories match.

The first unchanged primary auditor nevertheless returned **233/234,
FAIL_OR_INCOMPLETE**. Its only failed predicate assumes a colon immediately after
each submitted theorem name. Actual Lean output includes `(nu : ℝ) (hnu : nu > 0)`
between the name and the colon. The unchanged separate reviewer returned
**347/350**: the two corresponding type predicates and its requirement that the
primary auditor also pass failed. Their original unsuccessful results are retained.

The current frozen assessment therefore remains **69 PASS / 1 PARTIAL / 0
BLOCKED**, with N1-06 open. No corrected auditor version, new 70/0 assessment or
`.4` release was created by this handoff. The successful execution is not relabelled
as a failed CI run, and preservation checks are not acceptance evidence for a
missing final auditor decision.

## Preserved evidence

`source-mapping.json` maps 136 original received files (8,749,095 bytes) to their
exact copies under `raw/`. It includes the actual original ZIP, all earlier and
final API observations, 49 extracted members, raw GitHub log parts, exact
reassembled raw log, original auditor failures, a separate type/signature review,
and the preceding checkpoint publication receipts. Original CR, ANSI characters,
BOM and newline states remain unchanged. User-supplied PDFs were not copied.

The original ZIP is **313,326 bytes**, SHA-256
`1bc9b8134308ee9d8205c3273b96558ccb4efc456d0054da3ea033879c70d9b8`, artifact ID
**11657065866**. It is explicitly pinned in the distribution archive allowlist.

The portable preservation command, with a fresh output path, is:

```bash
python3 verify_preserved_terminal.py --output new-preservation-receipt.json
```

The saved execution passed **331/331** byte-retention and recorded-outcome checks.
It did not execute Comparator, Lean or the mathematical construction and records
`N106Completed=false`.

## Continue from the actual remaining point

Read the [complete Korean restart handoff](../RESTART_HANDOFF_2026_10_10_KO.md)
and [machine-readable restart state](../RESTART_STATE_2026_10_10.json). Preserve
both frozen auditor sources and their failed receipts. Create independently
reviewed new parser versions which verify the full parameterized original C/D
types, retain all security/kernel/source/exit checks, and inspect the same actual
ZIP and final observation again. Do not restart the already successful long
Comparator or whole-default build without a concrete new reason.

The source-signature comparison and exact inputs are in
`raw/independent-terminal-actual-0001/TYPE_OUTPUT_PARSER_REVIEW.md` and its companion
JSON and input directory. That review records the reason for a future correction;
it does not rewrite the unsuccessful audit or independently promote N1-06.
