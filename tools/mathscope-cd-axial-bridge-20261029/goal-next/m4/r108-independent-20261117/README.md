# R1-08 operational read-only evidence update

On 2026-11-17 at 06:40 UTC, read-only WebsitePublisher page-index and version
metadata calls for project 29770 reported `v0.3.1.html` at version **137**,
provider short hash `9171eb0c`, with 137 total versions. This matches the
earlier authenticated metadata receipt. The listed versions 103, 136 and 137
were all marked `within_tier=false`; metadata is not a full-content read.

The current editable-page `get_page` call was attempted and returned
`Transport closed`. The original provider's separate read-only
`versioning.get-page-version` integration was then called for versions 103
and 137. Both calls had a successful **outer** integration response but a
failed **nested** result: code 402, “Version history is not available on the
Free plan. Upgrade to Starter or higher.” Neither returned page content or a
SHA-256. Those precise nested results are in `version-access.json`. They
establish that these two stored-version content reads were denied at the
observed time; they do **not** establish that a rollback was attempted or
what a live rollback would return. Direct HTTP HEAD was also blocked by the
execution environment. Thus neither fresh served HTML bytes nor the mapping
between provider editable content and the earlier archived HTTP response was
verified here.

The previously verified 122-byte CSS candidate was constructed solely from
the archived HTTP body, with an exact reverse transform and local browser
checks. It is an offline candidate, never uploaded or published; its
browser replay deliberately blocked outbound resources. Its candidate hash
is `bed25212d4d3397d2c5d71092afe141ef87c165b6a9fba00d1827c97ef4d84a3`.
The separate private hosted M1/M2 candidate and its post-publication screen
are actual evidence for **that private scope**, not for a WebsitePublisher
production deployment. The two candidates and their hashes are distinct.

An independent execution of the original evaluator (SHA-256
`cf62892821d89aabec7d528cdc0b1b135234033923882b1b76ac47ea192738fb`)
against the exact existing 19 private-candidate artifacts returned:

```text
registered private scope:       CRITERION_ACCEPTED
expanded production claim:      CRITERION_REVIEW_REQUIRED
altered evidence artifact:      CRITERION_ARTIFACT_HASH_MISMATCH
single-criterion canFreeze:     false
single-criterion publication:   false
```

The two rejection cases are intentional negative controls. The original
R1-08 text requires prepared patch, test and rollback materials plus an
actual post-publication screen for the claimed deployment; it does not
require actually performing a production rollback. For a production-specific
claim the missing evidence remains the exact editable source and served
representation mapping, a source-bound reviewed production candidate and
recovery material, and its actual matching deployment and post-publication
review. A live rollback or new publication was not attempted. RELEASE HOLD
remains in force.

`provider-fresh.json` and `version-access.json` record the fresh connector
responses and their times; `independent-gate.json` records the evaluator
replay. `verify_readback.mjs` checks their exact recorded hashes and compares
the earlier provider and offline receipts. It verifies consistency of the
recorded inputs, not the connector's historical authentication by itself.

Reproduce the read-only evaluator and receipt checks from the workspace root:

```text
node work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/m4/r108/operational-replay-audit/gate.mjs work/MathScopeCompute-CD/research-ide/mathscope-m4/acceptance.mjs work/MathScopeCompute-Continuation22 work/goal-next/continuation44/m4/independent-gate.json
node work/goal-next/continuation44/m4/verify_readback.mjs work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/m4/r108/operational-replay-audit/provider-metadata.json work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/m4/r108/operational-replay-audit/offline-byte-rehearsal.json work/goal-next/continuation44/m4/provider-fresh.json work/goal-next/continuation44/m4/version-access.json work/goal-next/continuation44/m4/independent-gate.json work/goal-next/continuation44/m4/verified.json
```

No Git branch, production page or local Lean environment was changed.
