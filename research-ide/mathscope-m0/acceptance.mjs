import * as Contracts from './contracts.mjs';
import * as Sessions from './session.mjs';
import * as Compute from './compute.mjs';
import * as Proof from './proof.mjs';

const copy = value => JSON.parse(JSON.stringify(value));
const requireTrue = (condition, message) => { if (!condition) throw new Error(message); };
const ACCEPTANCE_SCOPE = Object.freeze({
  id: 'M0_LOCAL_FOUNDATION_ACCEPTANCE', version: '1.0.0',
  isolatedSyntheticSession: true, mutatesActiveSession: false, readsActiveSession: false, networkRequests: false,
  computation: 'Four finite local adapters and their explicit bounds; native browser Worker when available.',
  proof: 'Exact replay of shipped source-bound Lean audits; this run does not compile Lean in the browser.',
  exclusions: 'No full prismatic complex, general-G quantum construction, RH/BSD resolution, Navier–Stokes reconstruction or global release certification.'
});

function syntheticLegacy() {
  return {
    schema: Contracts.LEGACY_SESSION_SCHEMA, id: 'm0-acceptance-isolated-session', title: 'Isolated M0 acceptance fixture',
    objects: [{ id: 'legacy-object:prime', revision: 'legacy-object:prime:r1', definition: 'PrimeSet' }],
    representations: [{ id: 'legacy-view:prime', objectRef: 'legacy-object:prime', camera: { x: 1, y: 2, z: 3 } }],
    claims: [{ id: 'legacy-claim:finite', statement: 'Historical finite fixture', grade: 'NUMERICAL INDICATOR' }],
    evidence: [{ id: 'legacy-evidence:historical', claimRef: 'legacy-claim:finite', grade: 'NUMERICAL INDICATOR', supportsCurrent: false }],
    assumptions: [], revisions: [], checkpoints: [], researchRuns: [], sessionRevision: 1
  };
}
// The baseline here is explicitly a test input. The deployed baseline manifest is
// separately pinned by the IDE; acceptance never reads or replaces that session.
const SYNTHETIC_BASELINE = Object.freeze({ schema: 'MathScopeBaselineManifest/1', id: 'isolated-acceptance-baseline-fixture', purpose: 'TEST_FIXTURE_NOT_DEPLOYMENT_AUDIT', page: { version: 41, versionHash: 'd400a17e' } });

/** Runs checks entirely against local temporary data. No active window session is
 * accessed, imported, saved, revised, or regraded. */
export async function runM0Acceptance({ signal, onProgress } = {}) {
  const results = [], engines = new Set();
  let examples, migrated, lastPrimeResult;
  function createEngine() { const engine = Compute.createComputeEngine(); engines.add(engine); return engine; }
  const engine = createEngine();
  const abortEngines = () => { for (const instance of engines) for (const job of instance.listJobs()) if (['QUEUED', 'RUNNING', 'CANCEL_REQUESTED'].includes(job.status)) instance.cancel(job.id); };
  signal?.addEventListener('abort', abortEngines, { once: true });
  async function finite(adapter) {
    const request = await Compute.createExampleJob(adapter); request.id = `acceptance:${adapter}`;
    const submitted = await engine.submit(request), job = await engine.wait(submitted.id);
    requireTrue(job.status === 'COMPLETED', `${adapter}: ${job.status} ${job.result?.message || ''}`);
    requireTrue(Contracts.validateResultEnvelope(job.result).ok, `${adapter}: result envelope validation failed`);
    requireTrue((await Compute.isResultFor(request, job.result)).ok, `${adapter}: input/provenance binding failed`);
    return { request, job, result: job.result };
  }
  const checks = [
    {
      id: 'A01', label: 'Versioned starter contracts', run: async () => {
        examples = await Contracts.getContractExamples();
        const names = Object.keys(examples);
        for (const name of names) requireTrue(Contracts.validate(name, examples[name]).ok, `${name} example is invalid`);
        return { contractCount: names.length, contracts: names };
      }
    },
    {
      id: 'A02', label: 'Isolated legacy migration and round-trip', run: async () => {
        const legacy = syntheticLegacy(), before = Contracts.canonicalStringify(legacy);
        migrated = await Sessions.migrateSession(legacy, SYNTHETIC_BASELINE);
        requireTrue(Contracts.canonicalStringify(legacy) === before, 'Migration mutated the legacy input');
        for (const key of ['objects', 'representations', 'claims', 'evidence', 'assumptions', 'revisions', 'checkpoints']) requireTrue(Contracts.canonicalStringify(migrated[key]) === Contracts.canonicalStringify(legacy[key]), `Legacy ${key} changed`);
        const exported = await Sessions.exportSessionBundle(migrated), imported = await Sessions.importSessionBundle(exported);
        const recovered = imported.session || imported;
        requireTrue(recovered.id === legacy.id, 'Round-trip did not preserve the legacy session ID');
        requireTrue(recovered.evidence.length === legacy.evidence.length, 'Round-trip changed the number of legacy evidence records');
        for (let i = 0; i < legacy.evidence.length; i++) {
          for (const key of ['id', 'claimRef', 'grade']) requireTrue(recovered.evidence[i][key] === legacy.evidence[i][key], `Round-trip changed historical evidence ${key}`);
          requireTrue(recovered.evidence[i].supportsCurrent === false, 'Imported legacy evidence acquired current authority');
        }
        return { preservedSessionId: legacy.id, preservedLegacyGroups: 7, importAuthority: 'REVALIDATION_REQUIRED', syntheticFixture: true };
      }
    },
    {
      id: 'A03', label: 'Finite scope, CW and fake-proof guards', run: async () => {
        const sourceExamples = examples || await Contracts.getContractExamples();
        const request = await Compute.createExampleJob(); delete request.scope.primeInterval;
        requireTrue(!Contracts.validateComputeJobSpec(request).ok, 'Missing finite bounds were accepted');
        const prism = copy(sourceExamples.PrismSpec); prism.geometricObject.kind = 'CW_COMPLEX';
        requireTrue(!Contracts.validate('PrismSpec', prism).ok, 'A CW complex was accepted as a prism');
        const fake = { schema: 'MathScope.ResultEnvelope/1', jobId: 'acceptance:forged-proof', inputHash: '0'.repeat(64), environmentHash: '0'.repeat(64), status: 'COMPLETED', scope: { kind: 'FINITE', finite: { description: 'Intentional forged test record', itemCount: 1 } }, precision: { kind: 'EXACT' }, values: { x: { kind: 'INTEGER', value: '1' } }, errorLedger: { rounding: null, discretization: null, tail: null, residual: null, stability: null, statistical: null }, provenance: {}, evidence: { grade: 'FORMAL PASS', scopeKind: 'exact-finite' } };
        requireTrue(!Contracts.validateResultEnvelope(fake).ok, 'A generic compute record issued FORMAL PASS');
        return { rejected: ['UNBOUNDED_FINITE_QUERY', 'CW_AS_PRISM', 'GENERIC_FORMAL_PASS'] };
      }
    },
    {
      id: 'A04', label: 'Selective assumption staleness', run: async () => {
        const original = migrated || await Sessions.migrateSession(syntheticLegacy(), SYNTHETIC_BASELINE);
        const graph = await Sessions.addDependencyExample(original);
        const updated = await Sessions.reviseAssumption(graph.session, graph.assumptionId, 'Acceptance test revision: the hypothesis has changed.');
        for (const id of graph.dependentIds) requireTrue(Sessions.effectiveNodeState(updated.session, id)?.freshness === 'STALE', `Dependent ${id} was not marked stale`);
        requireTrue(Sessions.effectiveNodeState(updated.session, graph.independentId)?.freshness === 'CURRENT', 'An unrelated finite prime object was incorrectly marked stale');
        requireTrue((await Sessions.verifyResearchM0Namespace(updated.namespace)).ok, 'Revised namespace failed its content hashes');
        return { stale: graph.dependentIds, preservedCurrent: graph.independentId };
      }
    },
    {
      id: 'A05', label: 'Exact prime interval and completeness', run: async () => {
        const { job, result } = await finite('prime-segment'); lastPrimeResult = result;
        requireTrue(result.values.count.value === '168', 'Expected pi(1000) = 168');
        requireTrue(result.values.coverage.completeWithinScope === true && result.values.coverage.infinitePrimeSetComplete === false, 'Finite/infinite completeness distinction failed');
        return { count: '168', scope: '[2,1000]', verifier: result.provenance.verification.verifier, executionMode: job.executionMode };
      }
    },
    {
      id: 'A06', label: 'Canonical p-adic delta', run: async () => {
        const { result } = await finite('padic-delta');
        requireTrue(result.values.delta.residue === '15' && result.values.delta.digits === 3, 'Expected delta_5(7) = 15 + O(5^3)');
        requireTrue(result.values.precisionPropagation.digitsConsumed === 1, 'The p-adic precision loss was not recorded');
        return { p: '5', inputDigits: 4, outputDigits: 3, residue: '15', scopeKind: result.evidence.scopeKind };
      }
    },
    {
      id: 'A07', label: 'Exact rational interval enclosure', run: async () => {
        const { result } = await finite('rational-interval'), interval = result.values.result;
        requireTrue(interval.lower.numerator === '-1' && interval.lower.denominator === '1' && interval.upper.numerator === '3' && interval.upper.denominator === '2', 'Expected [-1,3/2]');
        requireTrue(result.evidence.scopeKind === 'interval-certified', 'Interval evidence lost its scope type');
        return { enclosure: '[-1, 3/2]', endpoints: 'EXACT_RATIONAL', residual: result.errorLedger.residual.status, stability: result.errorLedger.stability.status };
      }
    },
    {
      id: 'A08', label: 'Finite differential matrix certificate', run: async () => {
        const { result } = await finite('integer-matrix-product');
        requireTrue(result.values.product.flat().length === 12 && result.values.product.flat().every(x => x.kind === 'INTEGER' && x.value === '0'), 'D1 D0 is not the exact 3×4 zero matrix');
        requireTrue(result.provenance.verification.verifier === 'INDEPENDENT_OUTER_PRODUCT_ACCUMULATION', 'Independent matrix checker missing');
        if (lastPrimeResult) {
          const changed = await Compute.createExampleJob(); changed.sourceRefs[0].hash = 'a'.repeat(64);
          requireTrue(!(await Compute.isResultFor(changed, lastPrimeResult)).ok, 'A result was reused after changing its source');
        }
        return { product: 'D1 D0 = 0', dimensions: [3, 4], scope: 'These finite integer matrices only', sourceStaleGuard: true };
      }
    },
    {
      id: 'A09', label: 'Insufficient precision stays incomplete', run: async () => {
        const request = await Compute.createExampleJob('padic-delta'); request.id = 'acceptance:precision-negative'; request.input.a.digits = 3;
        const submitted = await engine.submit(request), job = await engine.wait(submitted.id);
        requireTrue(job.status === 'PRECISION_REQUIRED', 'Insufficient p-adic input precision did not stop execution');
        requireTrue(job.result.details.requiredInputDigits === 4 && job.result.evidence.supportsCurrent === false && job.result.evidence.grade === 'UNKNOWN', 'Incomplete result received completed support');
        return { status: job.status, requiredInputDigits: 4, noInventedDigit: true };
      }
    },
    {
      id: 'A10', label: 'Shipped Lean audit exact binding', run: async () => {
        const bundles = Proof.listShippedProofs(); requireTrue(bundles.length >= 2, 'Expected finite and conditional shipped Lean audit fixtures');
        const verified = [];
        for (const item of bundles) {
          const bundle = Proof.getShippedProofBundle(item.id), report = await Proof.assessProofEvidence(bundle.jobSpec, bundle);
          requireTrue(report.verified === true && Proof.isVerifiedProofReceipt(report.receipt), `Shipped audit ${item.id} did not match its exact binding`);
          requireTrue(!Proof.isVerifiedProofReceipt(copy(report.receipt)), 'A serialized receipt retained live authority');
          requireTrue(report.canCompileHere === false, 'Audit replay was mislabeled as a new browser Lean compile');
          verified.push({ id: item.id, target: report.receipt.target, grade: report.receipt.grade });
        }
        return { matchedAudits: verified, newLeanCompilation: false };
      }
    },
    {
      id: 'A11', label: 'Edited Lean source makes old audit stale', run: async () => {
        const bundle = Proof.getShippedProofBundle(), changed = copy(bundle.jobSpec);
        changed.sourceFiles[0].content += '\n-- M0 acceptance: exact source changed.\n';
        const report = await Proof.assessProofEvidence(changed, bundle);
        requireTrue(report.status === 'STALE' && report.verified === false, 'An old Lean audit was reused for edited source');
        return { status: report.status, mismatchedBindings: report.mismatchedBindings || [] };
      }
    },
    {
      id: 'A12', label: 'Forged Lean audit is untrusted', run: async () => {
        const original = Proof.getShippedProofBundle(), forged = copy(original);
        forged.audit.targetType += '\nFORGED ACCEPTANCE TEST TYPE';
        const report = await Proof.assessProofEvidence(original.jobSpec, forged);
        requireTrue(report.status === 'UNTRUSTED_IMPORTED' && report.verified === false, 'A changed audit acquired authority');
        return { status: report.status, serializedPassFieldsGrantAuthority: false };
      }
    }
  ];
  try {
    for (const check of checks) {
      if (signal?.aborted) break;
      const started = performance.now(); let item;
      try {
        const details = await check.run();
        item = { id: check.id, label: check.label, pass: true, status: 'PASS', details, durationMillis: performance.now() - started };
      } catch (error) {
        item = { id: check.id, label: check.label, pass: false, status: signal?.aborted ? 'CANCELLED' : 'FAIL', message: String(error.message || error), details: { code: error.code || null }, durationMillis: performance.now() - started };
      }
      results.push(item);
      if (onProgress) { try { await onProgress({ ...copy(item), completed: results.length, total: checks.length }); } catch { /* UI logging cannot change acceptance results. */ } }
    }
    const passed = results.filter(x => x.pass).length;
    return { pass: !signal?.aborted && results.length === checks.length && passed === checks.length, passed, total: checks.length, results, scope: copy(ACCEPTANCE_SCOPE), aborted: Boolean(signal?.aborted) };
  } finally {
    signal?.removeEventListener('abort', abortEngines);
    for (const instance of engines) instance.dispose();
  }
}
