# Production evidence panel recovery

This is a new UI implementation reconstructed from the verified production
v117 block and saved MathScope evidence. It replaces only the existing
"MathScope M3 integrated 20261016 BEGIN/END" block on the existing
v0.3.1.html production page. It does not change shared engines, existing assets,
the other four pages, or the mathematical acceptance ledger.

## Published baseline and pending followup

The isolated evidence panel was actually published to the existing production
URL at page version 118, stored page hash `9a0eebc5`. A new public HTTPS read
after the scratch reset again returned 29,172,293 bytes with SHA-256
`bade76b34a07352e7cdce793ddc4af18e75e031976357bc6e030bd101a1187bb`.
See `evidence/PUBLIC_RESUME_READBACK_ESCALATED.json` and the recovered
`V118_BROWSER_QA_BEFORE_FOLLOWUP.json`. The original browser QA, Worker result,
screenshot, source-link visits and historical-counter locations were recovered
from known original files with all five prior hashes matching; the recovery
receipt distinguishes this from the later unsuccessful shared-copy attempt.

Actual v118 browser inspection found overlapping launcher hit regions and
unlabelled historical counters. `generated/followup-2/` is a **new reconstruction**
against recovered published v118 bytes. It prepares two guarded existing-fragment
patches for the layout and runtime, adjusts the three launcher positions, and
adds an idempotent historical-scope note to both legacy dialogs and the main
`n3-picard-audit` card. The stored evidence, calculations and original historical
values are preserved. These two patches are **prepared and not yet sent** in
this snapshot; actual publication and browser verification need separate receipts.

The earlier followup-1 payloads, modified source and 22-test logs were lost
before durable saving. `generated/followup-1/RECOVERY_LIMITS.json` retains only
metadata observed in the earlier tool outputs. It does not claim that those
original bytes were recovered. The new followup-2 has new hashes and its own
23-test execution record. `baseline/v118-published/` preserves the recovered
published source before these changes.

Reproduce the followup-2 local checks from a clean Node 24 checkout:

```sh
node research-ide/mathscope-m4/recovery-ui-20261019/tests/recovery-model.test.mjs
node --check research-ide/mathscope-m4/recovery-ui-20261019/generated/followup-2/runtime.js
node --check research-ide/mathscope-m4/recovery-ui-20261019/recovery-runtime.js
```

The generated requests can also be rebuilt locally with `build_followup2.py
--public-baseline /path/to/verified-v118.html`; the builder requires the exact
public baseline hash and has no network or publication behavior. A checked-in
public-page backup is unnecessary for the Node contract tests.

Actual mobile viewport and touch inspection remain unverified. The narrow-width
geometry calculations are limited CSS checks. Existing Three.js startup errors
when WebGL is disabled remain recorded; the preserved reference Worker and its
Canvas/SVG display worked in the actual browser. No original M4 resource budget
acceptance or mathematical completion is inferred from those observations.

All older whole-block and fragment-create requests below are historical records;
do not replay them against the already published page. Root owns subsequent
remote writes and must freshly read both fragment versions before applying the
two guarded followup-2 requests.

## Evidence and scope

The panel includes the original M3 64 and M4 16 IDs, full original acceptance
text and physical PDF page numbers. M3 remains 62/64 within the inherited
recorded scopes, with N7-06 and N8-05 OPEN. M4 retains its 14 PARTIAL and
2 OPEN preparation statuses and no final acceptance count. The initial
1,260 obligations remain scoped to the original initial construction.

The 35 native displayed rows are 25 exact continuous I1 matrix interval
records, 8 actual root uniform eta-derivative records, and 2 actual caller
uniform eta-derivative records from the authenticated continuation file.
Each root/caller record covers the indicated ordinary eta orders 0, 1, 2;
these are not spatial field samples, evaluated RHS centers, or completion
of the original 138 native numerical kernels.

The z-slice explorer uses the actual 512 generated cutoff cells in the
normalized enclosing box [-1,1]^3. The original K has radial squared
coordinate <=1/2 and axial zeta squared <=1/2. Exact-zero extension cells
are distinguished from cells still requiring actual A/b/p jets.
The physical z0 and tau0 powers remain explicit. The 8-to-16 grid table
is cutoff support coverage only, not global energy convergence.

N7-06 independently requests space/time comparisons. N8-05 independently
requests grid, Fourier cutoff, coefficient order, and arithmetic precision
doubling with the other three fixed. Missing actual energy, comparison,
tail bounds, and actual global last-resolved tau are null and stay OPEN.

Legacy norm exponent selection/export, terminal-jet formulas, cutoff
selector formulas, finite angular alias controls, and pinned UI_DATA.json
ID import remain available with their original historical scope.
Historical import cannot overwrite the current M3 62/64 data.
No new chart requires WebGL.

## Exact data transport and publication recovery

The HTML carries a lossless gzip-base64 representation of the complete JSON.
It retains all 80 original criteria and their full detail, all 35 native
records, and all 512 cutoff cells. The browser bounds the encoded size to
400,000 characters and the decoded size to 2,500,000 bytes, checks the exact
declared byte length and SHA-256, then parses and validates the original
JSON. No values are shown from a corrupt or unsupported transport. Static
62/64 scoped status, null tau, and four immutable ledger links remain
available when the browser cannot decompress it.

The canonical original-criteria link uses the existing
research-ide/mathscope-m3/ORIGINAL_M3_M4_CRITERIA.json at the saved source
commit. The build independently checks every immutable GitHub blob/tree
URL using git cat-file and compares available SHA-256 byte pins. Its full
receipt is generated/IMMUTABLE_SOURCE_LINKS.json.

The first 1,280,749-byte patch call ended without a success/error response
when the stalled tool was interrupted. PUBLICATION_ATTEMPT_1.json records
that ambiguous result. Subsequent API history and actual public HTML
readback at 2026-10-18 19:58 UTC still showed unchanged v117. The reduced
request also corrects the canonical criteria link; it is not a blind
resend of the interrupted request. A later server execution cannot be
excluded from those observations alone, so another write must first read
the actual state and use the current hash guard.

## Build and checks

Run from the repository root:

    python research-ide/mathscope-m4/recovery-ui-20261019/build_ui.py --revision ACTUAL_SAVED_SOURCE_COMMIT
    node --test-reporter=tap research-ide/mathscope-m4/recovery-ui-20261019/tests/recovery-model.test.mjs
    node --check research-ide/mathscope-m4/recovery-ui-20261019/generated/runtime.js
    python research-ide/mathscope-m4/recovery-ui-20261019/verify_static.py

The build requires the read-only public production v117 backup at
../website_audit/production-v117-public.html. Its original byte hash and
the isolated old block are retained in baseline/. The complete 29 MB
public backup belongs to the downloadable checkpoint, not a new
production page. Reusing it for the local comparison is different from
assuming that v117 is still the current server version.

The Node contract/codec and generated runtime syntax checks use only
checked-in files and work in a clean Node 24 checkout. They do not require
the external full-page backup or publication credentials.

## Small supported fragment staging

`python research-ide/mathscope-m4/recovery-ui-20261019/build_fragments.py`
prepares 14 complete HTML fragments: one layout, 12 inert data script
elements, and one complete runtime script. It also prepares a 21,290-byte
exact old-block-to-SSI activation patch in generated/fragments/. The
unchanged decoded data SHA-256 is a0aece9bfb60d7ca3d7632c5e61c3d4f32b5a2bd495642b9517a3c0e03e23e85.

The runtime requires each data part exactly once in its fixed order, then
applies the existing bounded decode, exact length, and SHA-before-parse
checks. Server-side SSI expansion yields the prepared rendered block;
there is no browser DOM installer, eval, or external script dependency.

Each unique fragment must be created and independently recorded before
the production page references it. A fragment create response is not a
page publication. If a response is ambiguous, read the fragment list and
versions before any retry or subsequent create. Existing names must never
be overwritten. Read the current page version immediately before the one
guarded activation patch; inspect actual public HTML and the browser after
activation. No paid quota change or asset deletion is permitted.

The first two whole-block patch calls and a later read-only batched call
were interrupted without a tool terminal result. Their exact observations
are preserved in evidence/. The successful parent fragment-list read
showed no existing fragments. Those observations do not establish why the
earlier calls stalled. This plan and its files alone do not claim any
remote fragment creation or page publication.

generated/websitepublisher-patch.json is a concrete supported patch_page
request guarded by base_version_hash d7474dd6. Read current page versions
again before applying. If the current server hash differs, inspect and
rebase the patch; do not overwrite another worker. One successful
WebsitePublisher patch is immediately live; no separate deploy call is
assumed. Read back the version and inspect the actual HTTPS page afterward.

A local file browser preview was rejected by the cloud browser URL policy,
which permits http/https only. No workaround was used. Prepublication
evidence distinguishes Node/static checks from real browser checks.
Mobile device layout cannot be claimed from CSS inspection alone.

## Artifacts

- generated/RECOVERY_UI_DATA.json: complete exact decoded source-data bytes.
- generated/RECOVERY_UI_DATA.json.gz: lossless deterministic compressed bytes.
- generated/IMMUTABLE_SOURCE_LINKS.json: saved-commit path and byte checks.
- generated/integrated-block.html: only the preserved-page replacement block.
- generated/PREPUBLICATION_MANIFEST.json: source hashes, size, block boundaries
  and all outside script/byte preservation checks.
- evidence/: commands, exit codes, static checks, browser receipts when available.
- baseline/: original isolated v117 block and public backup metadata.

No numerical sample, green CI check, generated document, or visualization
issues a new global mathematical acceptance result.

