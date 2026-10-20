import { canonicalProofJSON, proofSha256 } from '../../mathscope-m0/proof.mjs';

const SHA256 = /^[a-f0-9]{64}$/;
const clone = value => JSON.parse(canonicalProofJSON(value));
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const equal = (a, b) => canonicalProofJSON(a) === canonicalProofJSON(b);
const assert = (condition, code) => { if (!condition) throw new Error(code); };
const validName = value => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_.:-]{0,199}$/.test(value);
const keysOf = object => Object.keys(object);

/**
 * Track evidence against an explicit semantic dependency graph.
 * This verifies the declared graph's provenance/lifecycle only. It does not
 * infer mathematical dependencies, run Lean, certify a numerical enclosure,
 * or close any original M3/M4 criterion.
 */
export async function createEvidenceSession({ nodes, parameters, sources, maxRuns = 128 }) {
  canonicalProofJSON({ nodes, parameters, sources });
  assert(Array.isArray(nodes) && nodes.length > 0 && nodes.length <= 512, 'GRAPH_BUDGET');
  assert(Number.isSafeInteger(maxRuns) && maxRuns > 0 && maxRuns <= 512, 'RUN_BUDGET');
  assert(parameters && !Array.isArray(parameters) && sources && !Array.isArray(sources), 'PARAMETER_SOURCE_RECORDS_REQUIRED');
  assert(keysOf(parameters).every(validName) && keysOf(sources).every(validName), 'INVALID_PARAMETER_SOURCE_KEY');
  assert(Object.values(sources).every(value => SHA256.test(value)), 'SOURCE_SHA256_REQUIRED');
  const graph = clone(nodes), byId = new Map();
  for (const node of graph) {
    assert(validName(node.id) && !byId.has(node.id), 'UNIQUE_NODE_ID_REQUIRED');
    assert(typeof node.scope === 'string' && node.scope.length > 0, 'NODE_SCOPE_REQUIRED');
    for (const key of ['dependsOn', 'parameterKeys', 'sourceKeys']) {
      assert(Array.isArray(node[key]) && node[key].every(validName) && new Set(node[key]).size === node[key].length, 'UNIQUE_DEPENDENCY_KEYS_REQUIRED');
    }
    assert(node.parameterKeys.every(key => Object.hasOwn(parameters, key)), 'UNKNOWN_PARAMETER');
    assert(node.sourceKeys.every(key => Object.hasOwn(sources, key)), 'UNKNOWN_SOURCE');
    byId.set(node.id, node);
  }
  const ordered = [], color = new Map();
  const visit = id => {
    assert(byId.has(id), 'UNKNOWN_DEPENDENCY');
    assert(color.get(id) !== 1, 'DEPENDENCY_CYCLE');
    if (color.get(id) === 2) return;
    color.set(id, 1); byId.get(id).dependsOn.forEach(visit); color.set(id, 2); ordered.push(id);
  };
  graph.forEach(node => visit(node.id));
  // Snapshot all validated caller data before the first asynchronous digest.
  // Mutating the caller's objects while construction awaits cannot switch inputs.
  let currentParameters = clone(parameters), currentSources = clone(sources), view = {}, viewRevision = 0;
  const graphDigest = await proofSha256(graph);
  let revision = 0, sequence = 0;
  const epochs = new Map(ordered.map(id => [id, 0])), runs = new Map(), tokens = new WeakMap();
  const getNode = id => { assert(byId.has(id), 'UNKNOWN_NODE'); return byId.get(id); };
  const selected = (object, names) => Object.fromEntries(names.map(key => [key, object[key]]));
  async function bindings(parameterSnapshot, sourceSnapshot) {
    const result = new Map();
    for (const id of ordered) {
      const node = getNode(id);
      result.set(id, await proofSha256({
        graphDigest, nodeId: id, scope: node.scope,
        parameters: selected(parameterSnapshot, node.parameterKeys),
        sources: selected(sourceSnapshot, node.sourceKeys),
        dependencies: node.dependsOn.map(parent => ({ id: parent, digest: result.get(parent) })),
      }));
    }
    return result;
  }
  const stale = run => epochs.get(run.nodeId) !== run.epoch;
  const summary = run => freeze({
    id: run.id, nodeId: run.nodeId, state: stale(run) ? 'STALE' : run.state,
    executionState: run.state, stale: stale(run), scope: getNode(run.nodeId).scope,
    bindingDigest: run.bindingDigest, inputRevision: run.revision, epoch: run.epoch,
    resultDigest: run.resultDigest ?? null, resumedFrom: run.resumedFrom ?? null,
    kernelPass: false, originalCriterionAccepted: false,
  });
  const resolveToken = token => { const run = tokens.get(token); assert(run && runs.get(run.id) === run, 'FOREIGN_RUN_TOKEN'); return run; };
  const resolveRun = id => { assert(runs.has(id), 'UNKNOWN_RUN'); return runs.get(id); };

  function update(patch, sourcePatch = {}) {
    canonicalProofJSON({ patch, sourcePatch });
    assert(patch && !Array.isArray(patch) && sourcePatch && !Array.isArray(sourcePatch), 'PATCH_RECORD_REQUIRED');
    assert(keysOf(patch).every(key => Object.hasOwn(currentParameters, key)), 'UNKNOWN_PARAMETER');
    assert(keysOf(sourcePatch).every(key => Object.hasOwn(currentSources, key)), 'UNKNOWN_SOURCE');
    assert(Object.values(sourcePatch).every(value => SHA256.test(value)), 'SOURCE_SHA256_REQUIRED');
    const changedParameters = keysOf(patch).filter(key => !equal(patch[key], currentParameters[key]));
    const changedSources = keysOf(sourcePatch).filter(key => sourcePatch[key] !== currentSources[key]);
    if (!changedParameters.length && !changedSources.length) return freeze({ revision, changedParameters: [], changedSources: [], invalidated: [] });
    const invalidated = new Set();
    for (const id of ordered) {
      const node = getNode(id);
      if (node.parameterKeys.some(key => changedParameters.includes(key)) || node.sourceKeys.some(key => changedSources.includes(key)) || node.dependsOn.some(parent => invalidated.has(parent))) {
        invalidated.add(id); epochs.set(id, epochs.get(id) + 1);
      }
    }
    currentParameters = { ...currentParameters, ...clone(patch) };
    currentSources = { ...currentSources, ...clone(sourcePatch) }; revision++;
    return freeze({ revision, changedParameters, changedSources, invalidated: [...invalidated] });
  }
  async function beginWithSnapshot(nodeId, snapshot = null, resumedFrom = null) {
    getNode(nodeId); assert(runs.size < maxRuns, 'RUN_BUDGET_EXPORT_REQUIRED');
    const values = snapshot || { parameters: clone(currentParameters), sources: clone(currentSources), revision, epoch: epochs.get(nodeId) };
    const run = { id: `M4R-${++sequence}`, nodeId, revision: values.revision, epoch: values.epoch,
      parameters: clone(values.parameters), sources: clone(values.sources), state: 'STARTING', resumedFrom };
    runs.set(run.id, run);
    const allBindings = await bindings(run.parameters, run.sources);
    run.bindingDigest = allBindings.get(nodeId); run.state = 'RUNNING';
    const token = freeze({ id: run.id, nodeId, bindingDigest: run.bindingDigest }); tokens.set(token, run);
    return token;
  }
  async function complete(token, result, receipt) {
    const run = resolveToken(token);
    assert(run.state === 'RUNNING', 'RUN_NOT_RUNNING');
    canonicalProofJSON({ result, receipt });
    assert(receipt && receipt.bindingDigest === run.bindingDigest, 'RESULT_BINDING_MISMATCH');
    assert(SHA256.test(receipt.resultDigest || ''), 'RESULT_SHA256_REQUIRED');
    assert(typeof receipt.producer === 'string' && receipt.producer.length > 0, 'RESULT_PRODUCER_REQUIRED');
    assert(receipt.kernelPass === false && receipt.originalCriterionAccepted === false, 'UNAUTHORIZED_ACCEPTANCE_CLAIM');
    const checkedResult = clone(result), checkedReceipt = clone(receipt);
    const digest = await proofSha256(checkedResult);
    assert(digest === checkedReceipt.resultDigest, 'RESULT_HASH_MISMATCH');
    // Cancel, semantic update, or a second completion may happen while hashing.
    assert(run.state === 'RUNNING', 'RUN_NOT_RUNNING');
    run.result = checkedResult; run.resultDigest = digest; run.receipt = checkedReceipt; run.state = 'RECORDED';
    return summary(run);
  }
  function cancel(token) {
    const run = resolveToken(token);
    assert(['STARTING', 'RUNNING'].includes(run.state), 'RUN_NOT_RUNNING'); run.state = 'CANCELLED';
    return summary(run);
  }
  function resume(runId) {
    const old = resolveRun(runId); assert(old.state === 'CANCELLED', 'CANCELLED_RUN_REQUIRED');
    return beginWithSnapshot(old.nodeId, { parameters: old.parameters, sources: old.sources, revision: old.revision, epoch: old.epoch }, runId);
  }
  function exportRecord(runId) {
    const run = resolveRun(runId); assert(run.state === 'RECORDED', 'RECORDED_RESULT_REQUIRED'); assert(!stale(run), 'STALE_INPUT');
    return freeze({ schema: 'MathScope.M4.SemanticEvidence/1', graphDigest, nodeId: run.nodeId,
      parameters: clone(run.parameters), sources: clone(run.sources), bindingDigest: run.bindingDigest,
      result: clone(run.result), resultDigest: run.resultDigest, producer: run.receipt.producer,
      trust: 'RECOMPUTATION_REQUIRED', kernelPass: false, originalCriterionAccepted: false });
  }
  async function inspectImport(record) {
    canonicalProofJSON(record);
    assert(record?.schema === 'MathScope.M4.SemanticEvidence/1' && record.graphDigest === graphDigest, 'FOREIGN_GRAPH');
    getNode(record.nodeId);
    assert(record.trust === 'RECOMPUTATION_REQUIRED' && record.kernelPass === false && record.originalCriterionAccepted === false, 'UNAUTHORIZED_ACCEPTANCE_CLAIM');
    const snapshot = clone(record), epochBefore = epochs.get(record.nodeId);
    assert(equal(keysOf(snapshot.parameters).sort(), keysOf(currentParameters).sort()) && equal(keysOf(snapshot.sources).sort(), keysOf(currentSources).sort()), 'IMPORT_INPUT_KEYS_MISMATCH');
    assert(Object.values(snapshot.sources).every(value => SHA256.test(value)), 'SOURCE_SHA256_REQUIRED');
    const expected = (await bindings(snapshot.parameters, snapshot.sources)).get(snapshot.nodeId);
    assert(expected === snapshot.bindingDigest, 'IMPORT_BINDING_MISMATCH');
    assert(await proofSha256(snapshot.result) === snapshot.resultDigest, 'IMPORT_RESULT_HASH_MISMATCH');
    const current = (await bindings(clone(currentParameters), clone(currentSources))).get(snapshot.nodeId);
    return freeze({ state: expected === current && epochBefore === epochs.get(snapshot.nodeId) ? 'BINDING_MATCH_RECOMPUTATION_REQUIRED' : 'FOREIGN_INPUT_STALE',
      nodeId: snapshot.nodeId, bindingDigest: expected, kernelPass: false, originalCriterionAccepted: false,
      attached: false, reason: 'Imported bytes never attach evidence or restore run authority; rerun the bound producer.' });
  }
  return Object.freeze({
    begin: nodeId => beginWithSnapshot(nodeId), complete, cancel, resume, update, exportRecord, inspectImport,
    run: id => summary(resolveRun(id)), runs: () => [...runs.values()].map(summary),
    snapshot: () => freeze({ graphDigest, parameters: clone(currentParameters), sources: clone(currentSources), revision, view: clone(view), viewRevision }),
    updateView: patch => { canonicalProofJSON(patch); assert(patch && !Array.isArray(patch), 'VIEW_RECORD_REQUIRED'); view = { ...view, ...clone(patch) }; viewRevision++; return freeze({ viewRevision, mathematicalRevision: revision, invalidated: [] }); },
    binding: async nodeId => { getNode(nodeId); const p = clone(currentParameters), s = clone(currentSources); return (await bindings(p, s)).get(nodeId); },
  });
}
