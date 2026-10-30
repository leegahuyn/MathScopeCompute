import { SHIPPED_PROOF_BUNDLES, SHIPPED_AUDIT_DIGESTS } from './lean/shipped-proof-data.mjs';

/**
 * M0 proof provenance.  This module checks exact bindings to audits produced by
 * an actual pinned Lean run.  It does not execute Lean in a browser and does not
 * grant the older application's FORMAL PASS status.
 *
 * The trust anchor is the reviewed application release's immutable allowlist.
 * There is no remote signature service in M0.  A serialized receipt has no
 * authority: only a fresh, exact matched receipt has the private WeakSet brand.
 */

const VERSION = 'mathscope.proof-job/1';
const GRADES = new Set(['EXACT_FINITE', 'CONDITIONAL_FORMAL', 'UNCONDITIONAL_FORMAL']);
const STANDARD_AXIOMS = new Set(['propext', 'Classical.choice', 'Quot.sound']);
const receiptAuthority = new WeakSet();
const moduleAuthority = deepFreeze(cloneJSON(SHIPPED_AUDIT_DIGESTS));
const shippedBundles = deepFreeze(cloneJSON(SHIPPED_PROOF_BUNDLES));

function cloneJSON(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function canonicalProofJSON(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Proof metadata must contain finite JSON numbers.');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalProofJSON).join(',')}]`;
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalProofJSON(value[k])}`).join(',')}}`;
  }
  throw new TypeError('Proof metadata must be ordinary JSON; undefined, BigInt and executable values are rejected.');
}

export async function proofSha256(value) {
  if (!globalThis.crypto?.subtle) throw new Error('SHA256_UNAVAILABLE: a secure browser context is required.');
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : canonicalProofJSON(value));
  const result = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(result), x => x.toString(16).padStart(2, '0')).join('');
}

function validId(value, field) {
  if (typeof value !== 'string' || !value.trim() || value.length > 500) throw new TypeError(`Invalid ${field}.`);
  return value;
}

function normalKind(value) {
  return String(value || '').toLowerCase().replaceAll('-', '_');
}

/** This is a structural guard, never a substitute for Lean's dependency audit. */
export function auditDependencyGraph(graph, targetId, options = {}) {
  const issues = [];
  const fail = (code, message, details = {}) => issues.push({ code, message, ...details });
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    return { ok: false, status: 'INVALID_GRAPH', authority: 'STRUCTURAL_GUARD_ONLY', issues: [{ code: 'GRAPH_REQUIRED', message: 'A dependency graph is required.' }], closure: [] };
  }
  if (graph.nodes.length > 1024 || graph.edges.length > 4096) {
    return { ok: false, status: 'INVALID_GRAPH', authority: 'STRUCTURAL_GUARD_ONLY', issues: [{ code: 'GRAPH_BUDGET', message: 'The M0 graph budget was exceeded.' }], closure: [] };
  }
  const nodes = new Map();
  const adjacency = new Map();
  const allowedKinds = new Set(['theorem', 'definition', 'hypothesis', 'user_axiom', 'reference', 'open', 'imported_theorem']);
  for (const node of graph.nodes) {
    if (!node || typeof node.id !== 'string' || !node.id || nodes.has(node.id)) {
      fail('INVALID_NODE', 'Node IDs must be present and unique.');
      continue;
    }
    if (!allowedKinds.has(normalKind(node.kind))) fail('INVALID_NODE_KIND', `Unsupported node kind for ${node.id}.`);
    nodes.set(node.id, node);
    adjacency.set(node.id, []);
  }
  if (!nodes.has(targetId)) fail('TARGET_MISSING', 'The exact claim ID must occur in the dependency graph.');
  for (const edge of graph.edges) {
    if (!edge || edge.type !== 'DEPENDS_ON' || !nodes.has(edge.from) || !nodes.has(edge.to)) {
      fail('INVALID_EDGE', 'Proof dependencies require existing IDs and DEPENDS_ON direction (claim to prerequisite).');
      continue;
    }
    adjacency.get(edge.from).push(edge.to);
  }
  const color = new Map();
  const closure = [];
  const stack = [];
  function visit(id) {
    if (color.get(id) === 1) {
      fail('DEPENDENCY_CYCLE', 'A dependency cycle cannot close a research gate.', { cycle: [...stack.slice(stack.indexOf(id)), id] });
      return;
    }
    if (color.get(id) === 2) return;
    color.set(id, 1);
    stack.push(id);
    closure.push(id);
    for (const next of adjacency.get(id) || []) visit(next);
    stack.pop();
    color.set(id, 2);
  }
  if (nodes.has(targetId)) visit(targetId);
  const reachable = closure.map(id => nodes.get(id));
  const userAxioms = reachable.filter(n => normalKind(n.kind) === 'user_axiom').map(n => n.id);
  const open = reachable.filter(n => normalKind(n.kind) === 'open').map(n => n.id);
  const references = reachable.filter(n => normalKind(n.kind) === 'reference').map(n => n.id);
  const hypotheses = reachable.filter(n => normalKind(n.kind) === 'hypothesis').map(n => n.id);
  for (const node of reachable) {
    if (['hypothesis', 'user_axiom'].includes(normalKind(node.kind)) && (typeof node.statement !== 'string' || !node.statement.trim())) {
      fail('ASSUMPTION_STATEMENT_MISSING', `Assumption ${node.id} has no exact statement.`);
    }
  }
  if (open.length) fail('RESEARCH_OPEN', 'An open mathematical input remains in the dependency closure.', { nodes: open });
  if (references.length) fail('THEOREM_REFERENCE_ONLY', 'A literature reference has no imported kernel theorem adapter.', { nodes: references });
  if (userAxioms.length && options.requestedGrade !== 'CONDITIONAL_FORMAL') {
    fail('USER_AXIOM_GRADE_CONFLICT', 'A custom axiom requires a conditional grade.', { nodes: userAxioms });
  }
  if (options.closeResearchGate) {
    const normalize = value => String(value || '').replace(/\s+/g, ' ').trim();
    const targetStatement = normalize(nodes.get(targetId)?.statement);
    const same = reachable.filter(n => n.id !== targetId && ['hypothesis', 'user_axiom'].includes(normalKind(n.kind)) && targetStatement && normalize(n.statement) === targetStatement);
    if (same.length) fail('GOAL_ASSUMED_AS_PREMISE', 'Restating the desired conclusion as an assumption does not close the research gate.', { nodes: same.map(n => n.id) });
  }
  return deepFreeze({ ok: issues.length === 0, status: issues.length ? 'DEPENDENCY_REJECTED' : 'DEPENDENCY_VALID', authority: 'STRUCTURAL_GUARD_ONLY', issues, closure: [...new Set(closure)].sort(), userAxioms, hypotheses, open, references });
}

function normalizeGraph(graph) {
  canonicalProofJSON(graph);
  return {
    nodes: cloneJSON(graph.nodes).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    edges: cloneJSON(graph.edges).sort((a, b) => canonicalProofJSON(a) < canonicalProofJSON(b) ? -1 : canonicalProofJSON(a) > canonicalProofJSON(b) ? 1 : 0),
  };
}

export function getProofCapabilities() {
  return deepFreeze({
    schemaVersion: VERSION,
    capability: 'EXPORT_AND_PINNED_AUDIT_ONLY',
    exactShippedAuditChecks: true,
    arbitrarySourceCompile: false,
    remoteEndpoint: null,
    executableBrowserMetadata: false,
    existingFormalPassIssuer: false,
    receiptPersistence: 'Serialized receipts lose authority; exact audit matching must run again.',
    shippedCount: shippedBundles.length,
    trustAnchor: 'Exact immutable hashes reviewed with this application release; no remote attestation service.',
    limitation: 'Edited Lean source can be exported as a ProofJob. A new kernel run must be supplied by a separately authorized compiler integration; M0 does not claim that service exists.',
  });
}

export function listShippedProofs() {
  return shippedBundles.map(b => deepFreeze({ id: b.id, claimId: b.jobSpec.claimId, label: b.label, target: b.jobSpec.target, grade: b.jobSpec.requestedGrade, scope: b.scope, explanation: b.explanation, axioms: cloneJSON(b.audit.axioms), auditDigest: moduleAuthority[b.id] }));
}

export function getShippedProofBundle(id = shippedBundles[0]?.id) {
  const bundle = shippedBundles.find(b => b.id === id);
  if (!bundle) throw new RangeError('Unknown shipped proof ID.');
  return cloneJSON(bundle);
}

/** Prepare a reproducible request; preparing a request is not a proof result. */
export async function prepareProofJob(input) {
  const spec = input?.jobSpec || input;
  if (!spec || typeof spec !== 'object') throw new TypeError('ProofJob specification required.');
  const claimId = validId(spec.claimId, 'claimId');
  const target = validId(spec.target, 'target');
  if (!/^[A-Za-z_][A-Za-z0-9_.']*$/.test(target)) throw new TypeError('The target must be an explicit Lean declaration name.');
  const requestedGrade = spec.requestedGrade || 'CONDITIONAL_FORMAL';
  if (!GRADES.has(requestedGrade)) throw new TypeError('Unsupported requested proof grade.');
  if (!Array.isArray(spec.sourceFiles) || !spec.sourceFiles.length || spec.sourceFiles.length > 128) throw new TypeError('One to 128 Lean source files are required.');
  const seen = new Set();
  let totalBytes = 0;
  const sourceFiles = [];
  for (const file of spec.sourceFiles) {
    if (!file || typeof file.path !== 'string' || !/^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.lean$/.test(file.path) || file.path.split('/').some(p => p === '..' || p === '.')) throw new TypeError('Source paths must be relative .lean paths without traversal.');
    if (seen.has(file.path) || typeof file.content !== 'string') throw new TypeError('Source paths must be unique and include full source text.');
    seen.add(file.path);
    totalBytes += new TextEncoder().encode(file.content).length;
    if (totalBytes > 2 * 1024 * 1024) throw new RangeError('The M0 proof source budget is 2 MiB.');
    sourceFiles.push({ path: file.path, content: file.content, sha256: await proofSha256(file.content) });
  }
  sourceFiles.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (!Array.isArray(spec.assumptions)) throw new TypeError('Explicit assumptions array required; [] means no stated extra assumptions.');
  canonicalProofJSON(spec.assumptions);
  const assumptionIds = new Set();
  const assumptions = cloneJSON(spec.assumptions);
  for (const assumption of assumptions) {
    validId(assumption.id, 'assumption.id');
    validId(assumption.statement, 'assumption.statement');
    if (assumptionIds.has(assumption.id)) throw new TypeError('Duplicate assumption ID.');
    assumptionIds.add(assumption.id);
  }
  assumptions.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (!spec.dependencyGraph || !Array.isArray(spec.dependencyGraph.nodes) || !Array.isArray(spec.dependencyGraph.edges)) throw new TypeError('Explicit dependencyGraph required.');
  const dependencyGraph = normalizeGraph(spec.dependencyGraph);
  const graphAudit = auditDependencyGraph(dependencyGraph, claimId, { requestedGrade });
  canonicalProofJSON(spec.environment || {});
  canonicalProofJSON(spec.context || {});
  const environment = cloneJSON(spec.environment || {});
  const context = cloneJSON(spec.context || {});
  if (!environment.leanVersion || !environment.leanCommit || !environment.runtimeLibrarySha256) throw new TypeError('Pinned Lean environment and runtime digest required.');
  const source = await proofSha256(sourceFiles.map(({ path, sha256 }) => ({ path, sha256 })));
  const digests = {
    source,
    assumptions: await proofSha256(assumptions),
    dependency: await proofSha256(dependencyGraph),
    context: await proofSha256(context),
    environment: await proofSha256(environment),
  };
  digests.binding = await proofSha256({ schemaVersion: VERSION, claimId, target, requestedGrade, ...digests });
  return deepFreeze({
    schemaVersion: VERSION,
    id: `proof-job:${digests.binding}`,
    claimId, target, requestedGrade, sourceFiles, assumptions, dependencyGraph, context, environment, digests, graphAudit,
    status: graphAudit.ok ? 'PREPARED_LOCAL_CHECK_REQUIRED' : 'BLOCKED_DEPENDENCY',
    capability: 'EXPORT_AND_PINNED_AUDIT_ONLY',
  });
}

function result(status, reason, extra = {}) {
  return deepFreeze({ status, verified: false, reason, canCompileHere: false, ...extra });
}

export async function assessProofEvidence(jobInput, bundleInput) {
  let job;
  try { job = await prepareProofJob(jobInput); }
  catch (error) { return result('INVALID_PROOF_JOB', String(error.message || error)); }
  if (jobInput?.schemaVersion === VERSION && (jobInput.id !== job.id || canonicalProofJSON(jobInput.digests || {}) !== canonicalProofJSON(job.digests))) {
    return result('STALE', 'The serialized job hash does not match the recomputed source and metadata bindings. Prepare a fresh ProofJob.', { mismatchedBindings: ['serializedJobBinding'] });
  }
  if (!job.graphAudit.ok) return result('DEPENDENCY_REJECTED', 'The graph contains an unresolved or circular proof dependency.', { issues: job.graphAudit.issues });
  if (!bundleInput) return result('LOCAL_CHECK_REQUIRED', 'No audit was supplied. Export this source for a new pinned Lean run.');
  let bundle;
  try {
    canonicalProofJSON(bundleInput);
    bundle = cloneJSON(bundleInput);
  } catch (error) { return result('UNTRUSTED_IMPORTED', `Malformed imported audit: ${error.message}`); }
  if (!bundle.id || !Object.hasOwn(moduleAuthority, bundle.id)) return result('UNTRUSTED_IMPORTED', 'This imported audit has no matching immutable release authority.');
  const actualBundleDigest = await proofSha256(bundle);
  if (actualBundleDigest !== moduleAuthority[bundle.id]) return result('UNTRUSTED_IMPORTED', 'The audit JSON differs from the immutable shipped audit. Changing its exit code, axioms, type or hash cannot grant verification.');
  const auditJob = await prepareProofJob(bundle.jobSpec);
  const changed = ['source', 'assumptions', 'dependency', 'context', 'environment', 'binding'].filter(k => job.digests[k] !== auditJob.digests[k]);
  if (changed.length) return result('STALE', 'The stored audit applies to different source, assumptions, context, target, or environment.', { mismatchedBindings: changed, expectedJobId: auditJob.id, currentJobId: job.id });
  const audit = bundle.audit;
  if (audit.compileExitCode !== 0 || audit.sorry || audit.axioms.all.some(a => /(?:^|\.)sorryAx$/.test(a)) || !audit.negativeControls.every(n => n.rejected && n.exitCode !== 0)) {
    return result('AUDIT_REJECTED', 'Compiler success, absence of sorry, and required negative controls are mandatory.');
  }
  const customAxioms = audit.axioms.all.filter(a => !STANDARD_AXIOMS.has(a));
  if (customAxioms.length && job.requestedGrade !== 'CONDITIONAL_FORMAL') return result('USER_AXIOM_GRADE_CONFLICT', 'Custom axioms cannot be displayed as an unconditional theorem.');
  const declaredAxioms = new Set(job.assumptions.filter(a => normalKind(a.kind) === 'user_axiom').map(a => a.declaration));
  if (customAxioms.some(name => !declaredAxioms.has(name))) return result('ASSUMPTION_AUDIT_MISMATCH', 'A custom kernel axiom is missing from the explicit assumption ledger.');
  const receipt = deepFreeze({
    id: `proof-receipt:${actualBundleDigest}:${job.digests.binding}`,
    schemaVersion: 'mathscope.proof-receipt/1',
    claimId: job.claimId,
    jobId: job.id,
    target: job.target,
    targetType: audit.targetType,
    status: 'LOCAL_AUDIT_VERIFIED',
    grade: job.requestedGrade,
    sourceDigest: job.digests.source,
    assumptionsDigest: job.digests.assumptions,
    environmentDigest: job.digests.environment,
    dependencyDigest: job.digests.dependency,
    contextDigest: job.digests.context,
    context: cloneJSON(job.context),
    bindingDigest: job.digests.binding,
    auditDigest: actualBundleDigest,
    axioms: cloneJSON(audit.axioms),
    scope: bundle.scope,
    mathematicalStatus: customAxioms.length ? 'USER_AXIOM_DEPENDENT' : job.assumptions.length ? 'EXPLICIT_HYPOTHESES' : 'FIXED_FINITE_THEOREM',
    issuedExistingFormalPass: false,
  });
  receiptAuthority.add(receipt);
  return deepFreeze({ status: 'LOCAL_AUDIT_VERIFIED', verified: true, reason: 'Exact source, environment, assumption and target bindings match a shipped audit from the pinned Lean kernel run.', canCompileHere: false, receipt, job, explanation: bundle.explanation });
}

export function isVerifiedProofReceipt(value) {
  return Boolean(value && typeof value === 'object' && receiptAuthority.has(value));
}

/** Source and logs are exportable data.  Reimporting them does not import authority. */
export function exportProofRequest(job, bundle = null) {
  if (!job || job.schemaVersion !== VERSION) throw new TypeError('Prepare a ProofJob before exporting.');
  return {
    schemaVersion: 'mathscope.proof-export/1',
    job: cloneJSON(job),
    audit: bundle ? cloneJSON(bundle) : null,
    importedTrust: 'REVALIDATION_REQUIRED',
    reproduction: 'From lean/: lake build MathScope.M0.Finite MathScope.M0.Analytic MathScope.M0.Conditional MathScope.M0.Comparison; then inspect #check and #print axioms. NegativeFalse.lean and NegativeMatrix.lean must fail.',
  };
}
