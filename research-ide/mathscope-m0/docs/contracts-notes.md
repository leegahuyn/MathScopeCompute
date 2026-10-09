# MathScope M0 — I0 contracts and session integration

## What is implemented

The browser-neutral modules `contracts.mjs`, `session.mjs` and `integration.mjs` implement additive M0 records inside the existing `MathScopeResearchSession/0.3.1-foundation.1` session. The starting baseline is page **41 / d400a17e**, whose exact page, extension, Lean-source and attached-paper digests are recorded in `baseline/manifest.json`. This work does not implement the later prismatic-complex, general-group quantum Yang–Mills, or Navier–Stokes reconstruction algorithms.

There are **17 versioned JSON Schema documents** in `schemas/`, including the 16 runtime contracts and a structural ResearchM0 namespace schema. `schemas/examples-v1.json` contains ten complete starter contracts. The runtime uses the same schema definitions as the exported domain schemas. Mathematical conditions that JSON Schema cannot express—range consistency, identity bindings, semantic inference boundaries, cycles and content digests—are checked separately.

The schemas use JSON Schema draft 2020-12 syntax. An independent third-party JSON Schema validator was not installed in this environment; the exported schemas have been exercised through the shared runtime validator and complete examples. This is software validation, not Lean verification of the schema implementation.

## I0 checklist coverage

| Item | Implemented behavior | Remaining boundary |
|---|---|---|
| I0-01 baseline | Immutable manifest digest; migration preserves all original root IDs, grades, revisions and values; tested with the real prior `createResearchBundle` implementation | The parent integration owns the live-page replay of the existing 28 browser checks and deployment-version check |
| I0-02 finite/infinite scope | Symbolic originals and bounded observations have separate contracts; prime bounds use exact integer strings; absent or inconsistent bounds reject; finite results cannot claim an infinite scope | No whole infinite object is materialized by these finite adapters |
| I0-03 prism input | Ring presentation, ideal, delta/Frobenius conventions, precision loss, geometry, hypotheses and comparison provenance are explicit; CW relabeling, a bare `Z/p^N` prism and self-declared verified status reject | The initial P1 prism remains `INTERFACE`; actual comparison certificates and complex reconstruction are later packages |
| I0-04 G and state family | Lie family/rank/dimension, global form, representation, invariant form, coupling, channel, seed/lattice and Delta role are checked; BPST requires an explicit matching SU(2) embedding | These are input contracts. New general-G field jobs and ensembles remain unsupported; the existing classical SU(2) extension is separate |
| I0-05 PDE input | Paper construction, illustrative model and general solver have disjoint model IDs; paper force cannot be replaced by manufactured force; positive bounded time and cutoff data required | Actual-paper quantitative profile/pulse reconstruction is not claimed |
| I0-06 assumptions | Individual USER_AXIOM provenance persists; direct/indirect and ledger-wrapped user axioms cannot be hidden in an unconditional target; one revision stales only reachable descendants | Selectivity applies to declared M0 dependencies; the previous foundation retains its own legacy dependency machinery |
| I0-07 evidence | Existing grades are preserved as recorded metadata; exact-finite/interval/statistical scopes are typed; generic data cannot create FORMAL PASS or THEOREM-BACKED; imported jobs/results/proofs remain untrusted | A kernel receipt applies to its exact shipped formal scope; no generic theorem-mapping adapter is asserted |
| I0-08 graph boundaries | Version/hash-bound edges, cycles, finite-to-infinite limits, projection/spectrum conditions and Weil-RH→classical-RH direct proof rejection implemented | Actual proof edges need an authentic live receipt containing exact graph endpoint bindings; currently shipped lemmas do not certify arbitrary session claims |

This table describes implemented **M0 contract behavior**. It is not a declaration that the full 28-package blueprint or the open mathematical research goals are complete.

## Public interfaces

### Contracts

```js
import {getContractExamples, validate, assertValid, SCHEMAS} from './contracts.mjs';
const examples = await getContractExamples();
const report = validate('PrismSpec', examples.PrismSpec); // {ok, errors, warnings}
assertValid('PrimeQuerySpec', examples.PrimeQuerySpec);    // throws ContractError
```

Supported runtime names: `PrecisionBudget`, `FiniteScope`, `SourceManifest`, `AssumptionLedger`, `AssumptionSpec`, `PrismSpec`, `PrimeQuerySpec`, `GaugeGroupSpec`, `StateFamilySpec`, `PDEConstructionSpec`, `ObservationMapSpec`, `ComputeJobSpec`, `ResultEnvelope`, `ClaimSpec`, `LegacyObservation`, `ProofJob`.

`canonicalStringify` sorts object keys and rejects cycles, reserved prototype keys, undefined values, nonfinite numbers and unsafe untagged integers. Exact large integers are decimal strings. Explicitly tagged FLOAT64 values and statistical estimate fields may contain large finite approximate numbers. That exception does not apply to sample counts, precision, dimensions or ordinary integers. SHA-256 uses WebCrypto and has no weak-hash fallback.

### Session lifecycle

```js
import * as S from './session.mjs';
const migrated = await S.migrateSession(existingSession, baselineManifest);
let ns = migrated.researchM0;
ns = await S.addNode(ns, {kind:'SourceManifest', payload:examples.SourceManifest});
ns = await S.addNode(ns, {kind:'PrimeQuerySpec', payload:examples.PrimeQuerySpec},
                    {allowUnresolvedRefs:false});
const exported = await S.exportSessionBundle({...existingSession, researchM0:ns});
const imported = await S.importSessionBundle(exported,
    {expectedBaselineHash:ns.baselineHash});
```

Most update functions accept a whole session or the namespace and return the same shape. `reviseAssumption` returns `{session, namespace, invalidated}`. `addDependencyExample` returns a usable example and the dependent/independent IDs. `getSessionNodeKinds()` exposes the schema-name-to-node-kind mapping.

Migration never rewrites original root records. A legacy record without a revision is referenced by `legacy-unversioned` together with its complete content digest. Legacy-index hashes cover the entire legacy node, whereas a legacy node's own `hash` field often contains an input hash; those values must not be confused.

Each M0 node is `{id, kind, revision, payload, hash, freshness, staleReasons, supportsCurrent, effectiveTrust}`. The hash covers the canonical **payload**; the reference additionally binds ID and revision. Mutable freshness and trust fields do not change that content hash. Previous payloads remain in `history`. Automatic edges record typed source/model/assumption references; explicit edges carry exact endpoint revisions and hashes.

An old assumption reference does not become current merely because the dependent record is resubmitted. It remains stale. Repeated insertion of an identical current payload is idempotent. Updating one object preserves unrelated calculations and their identities.

### Imports and explicit input revalidation

`importSessionBundle` verifies the complete bundle digest, namespace payload digests, baseline digest and nested checkpoint namespaces. It preserves recorded grades and numerical data, but sets effective trust to `REVALIDATION_REQUIRED`, including old proof records and nested checkpoint evidence. Hash integrity does not establish authorship or mathematical truth.

The synchronous `quarantineResearchM0Namespace` exists for the old foundation importer. Its default integrity marker is `NOT_CHECKED`; it never claims that the old plain-JSON importer ran SHA-256 verification. Only the asynchronous verified importer supplies `SHA256_VERIFIED`.

After import, the explicit UI action **입력 계약 다시 확인** calls:

```js
ns = await S.revalidateImportedInputs(ns, {expectedBaselineHash});
```

This verifies contracts and hashes, then restores only input definitions to `CURRENT / DECLARED`. It leaves `supportsCurrent:false`; stored compute jobs, results and proofs remain untrusted. Existing STALE and HISTORICAL nodes stay so. An event records `CONTRACT_AND_HASH_ONLY`. A fresh calculation can then create a new result, while the old imported result remains untrusted. Source authenticity is not inferred from SourceManifest metadata; the compute bridge independently checks the actual installed worker bytes.

### Compute-to-session binding

```js
import {prepareSessionJob, saveSessionJob} from './integration.mjs';
const prepared = await prepareSessionJob(request, ns, await engine.capabilities());
const queued = await engine.submit(prepared.request);
const job = await engine.wait(queued.id);
// Called only by the user's explicit result-save action:
ns = await saveSessionJob(ns, prepared, job);
```

Preparation records the installed worker as a real SourceManifest node, with a node payload hash distinct from the raw worker-source hash. It generates a finite target from the actual adapter, input, domain, basis, scope, precision, seed and assumptions. Prime jobs get PrimeQuerySpec; the other three finite adapters get an explicitly scoped ClaimSpec containing the exact machine context. Existing references are reused only when they match the supported target semantics exactly.

A finite arithmetic adapter cannot be redirected to an arbitrary PrismSpec, StateFamilySpec or PDEConstructionSpec by changing a model label. Unknown/stale assumptions reject before execution. Preparation changes no session. Save rechecks job identity, installed environment, inputs, source/model/assumption references and result hash, and freshly recomputes completed bounded results before adding source→target→job→result records. If an assumption or model changed while the job ran, save rejects without modifying the session. It does not silently attach the old result to the new inputs.

### Proof authority

ProofJob is a prepared-source record with source files, content hashes, assumptions, dependency graph, context, environment and binding digests. It is stored with `DECLARED` effective trust. A copied audit JSON, a residual, a statistical confidence interval or a USER_AXIOM cannot issue the application's existing FORMAL PASS grade.

`effectiveEvidenceTrust` recognizes only the actual branded receipt object itself. It refuses separate claim metadata, copies and same-ID records. A graph proof edge additionally needs `receipt.context.graphBinding.from/to` matching both endpoint IDs, revisions and payload hashes. Imported edges keep only an audit reference until an actual authority rechecks them. The currently shipped finite/conditional lemmas are displayed for their own exact scope; attaching them as proof of a changed or arbitrary natural-language claim remains blocked.

## Validation performed

- `node --test mathscope-m0/tests/contracts.test.mjs`: **21 passing tests** covering contracts, exact serialization, migration, provenance, selective staleness, cycles, false inference edges, imports and tampering.
- `node --test mathscope-m0/tests/integration.test.mjs`: **8 passing tests**, including all four real adapters, source/target binding, model relabeling rejection, stale-save rejection and the import→input revalidation→fresh computation workflow.
- The proof agent adds independent receipt-scope tests; the compute agent tests kernel arithmetic, cancellation/resume and reproduction. Those counts belong to their own test reports.
- Browser interaction, existing-page regression and final optimistic-lock deployment are verified by the parent integration. These module tests alone do not assert that the live UI or every blueprint checklist item is complete.

The tests exercise behavior that can fail across component boundaries. They do not count merely drawing a diagram, declaring a schema name, or preserving a theorem label as a proof.
