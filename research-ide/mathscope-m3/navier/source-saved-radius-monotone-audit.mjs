/** Bounded-memory source audit of the first actual whole-mean derivative stop.
 * A source hash proves identity. Every analytic premise stays explicit.
 * No original graph, derivative routine, norm label or criterion is edited.
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyExactStageSnapshot } from './tests/exact-stage-snapshot.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const ORIGINAL = 'research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291/';
const PINS = Object.freeze({
  index: 'ba251f2f3401d2d81467a8ac3c5ceb0da7c6ddc3899aab6d9d580755ff0fd1f3',
  dependencies: '37960fe03a79493d12b6b9051b8a69a88ab71cc3505cc8cd62c6f2fc4bc0daeb',
  maximum: '190f8b3abf266b728f0c3b299d71ce6d31d7bf97fcba0249a7d59842872a1e06',
  monotone: [
    'a62918fe806c1c7c476fd3751b3c7db40e769658525d25a3e656e1ea42a5b55a',
    'cb14bd8cb0201d630aff22dfaf1f5b52474f44172107c3fbebc4aaa917842c3e',
    'e53efe521098aa99b855aa457a26f35edec45e6f74224d650afce71b80fec958',
  ],
});
const sha = value => createHash('sha256').update(value).digest('hex');
const hash = value => sha(JSON.stringify(value));
const fail = message => { throw Object.assign(new Error(message), { code: 'INVALID_RADIUS_MONOTONE_AUDIT' }); };
const require = (value, message) => { if (!value) fail(message); };
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const pathOf = path => { const file = resolve(ROOT, path); require(file.startsWith(ROOT + sep), 'The immutable source path must stay in this repository.'); return file; };
async function pinned(path, expected, bytes) { const raw = await readFile(pathOf(path)); require(sha(raw) === expected && (bytes === undefined || raw.length === bytes), 'Changed source bytes: ' + path); return raw; }
const row = (node, id) => { const n = node(id); require(n && typeof n.op === 'string' && Array.isArray(n.args), 'A required actual node is absent: ' + id); return { sourceNode: id, node: structuredClone(n), nodeSHA256: hash(n) }; };
const q = (node, id, numerator, denominator = '1') => { const n = node(id); return n?.op === 'rational' && n.args[0] === String(numerator) && n.args[1] === String(denominator); };

/** Unauthenticated fixture theorem: a sum of FTC faces is at least one,
 * provided its integrands are real/integrable and intervals are ordered.
 * It accepts no caller completion/authority/analytic-proof flag.
 */
export function inspectRadiusFTCDominance({ node, maximum, maxWork = 20000 } = {}) {
  require(typeof node === 'function' && Number.isSafeInteger(maximum) && maximum >= 0 && Number.isSafeInteger(maxWork) && maxWork > 0 && maxWork <= 20000, 'Use an actual maximum node and bounded finite work.');
  let work = 0;
  const selected = new Map();
  const take = id => { require(++work <= maxWork, 'The exact FTC skeleton exceeded its work budget.'); const r = row(node, id); selected.set(id, r); return r.node; };
  const m = take(maximum);
  require(m.op === 'maximum' && m.args.length === 2 && q(node, m.args[0], 1), 'Keep max(1,B) with its original two ordered operands.');
  const flatten = (id, active = new Set()) => { require(!active.has(id), 'A source FTC sum is cyclic.'); active.add(id); const n = take(id); const out = n.op === 'add' ? n.args.flatMap(x => flatten(x, active)) : [id]; active.delete(id); return out; };
  // The retained B is a sum of three independently anchored 3D FTC sums.
  const b = take(m.args[1]);
  require(b.op === 'add' && b.args.length === 2, 'Keep the actual three-term norm aggregate.');
  // Source node interning orders additions by node ID. Identify the 24
  // faces directly, without assuming which of the three sums came first.
  const faces = flatten(m.args[1]).map(faceId => {
    let id = faceId; const integrals = [];
    while (take(id).op === 'definite_integral') { const n = take(id); require(n.args.length === 4, 'Keep the full actual definite integral.');
      integrals.push({ ...row(node, id), boundCoordinate: row(node, n.args[1]), lower: row(node, n.args[2]), upper: row(node, n.args[3]) }); id = n.args[0]; }
    const sqrt = take(id); require(sqrt.op === 'sqrt_positive' && sqrt.args.length === 1, 'Every actual FTC face must retain sqrt(1+f^2).');
    const sum = take(sqrt.args[0]); require(sum.op === 'add' && sum.args.length === 2, 'Keep the one plus square integrand.');
    const squareId = q(node, sum.args[0], 1) ? sum.args[1] : q(node, sum.args[1], 1) ? sum.args[0] : null;
    require(squareId !== null, 'An FTC face lost its exact positive unit term.');
    const square = take(squareId); require(square.op === 'integer_power' && square.args[1] === 2, 'An FTC face must contain an actual even square.');
    require(integrals.length <= 3, 'The actual FTC face has at most three integration coordinates.');
    return { sourceFace: faceId, integrals, integrand: row(node, id), square: row(node, squareId), actualBody: row(node, square.args[0]),
      anchoredZeroDimensionalFace: integrals.length === 0, realBodyProved: false, integrabilityProved: false, orderedEndpointsProved: false };
  });
  const dimensions = [0, 1, 2, 3].map(d => faces.filter(f => f.integrals.length === d).length);
  require(faces.length === 24 && JSON.stringify(dimensions) === JSON.stringify([3, 9, 9, 3]), 'Retain all three complete 3D FTC face inventories; no zero-dimensional anchor or nonempty face may be omitted.');
  const uniqueSelected = [...selected.values()].sort((a, b) => a.sourceNode - b.sourceNode);
  return freeze({ schema: 'MathScope.N6.RadiusMaximumFTCDominance/1', sourceMaximum: row(node, maximum), aggregate: row(node, m.args[1]), faces, faceDimensionCounts: dimensions,
    selectedSkeleton: uniqueSelected, selectedSkeletonSHA256: hash(uniqueSelected), workUsed: work,
    structuralIdentityVerified: true, sourceAuthenticated: false,
    conditionalDominance: { lowerBound: '3', maximumUnitOperand: '1', strictMarginAtLeast: '2', selectedOperand: m.args[1],
      derivation: 'Each zero-dimensional face is sqrt(1+f^2)>=1 for real f. Every other face integral is nonnegative for real integrands on ordered intervals. There are three anchors, hence B>=3>1 and max(1,B)=B.',
      finiteDerivativeRule: 'On an open neighborhood where all retained faces define a C^m aggregate and the same inequalities hold, D^alpha max(1,B)=D^alpha B for every |alpha|<=m.',
      hypotheses: ['Every actual face body is real and its retained integral exists.', 'Every actual integration interval is ordered on the audited source domain.', 'The aggregate B has every requested derivative on the relevant open neighborhood (or an explicitly specified one-sided boundary).'],
      analyticHypothesesProved: false, globalSmoothnessProved: false },
    originalDerivativeRoutineCalled: false, originalSourceGraphChanged: false, originalN601Complete: false, originalN602Complete: false, M3CountRaised: false });
}

const primitiveChildren = n => ['add', 'multiply', 'maximum', 'smooth_piecewise'].includes(n.op) ? n.args :
  ['inverse', 'sqrt_positive', 'exp', 'log_positive', 'sine', 'cosine', 'ceiling', 'integer_power', 'source_step_derivative'].includes(n.op) ? [n.args[0]] :
  n.op === 'definite_integral' ? n.args : ['rational', 'coordinate', 'source_parameter'].includes(n.op) ? [] : null;
function inspectMonotone(node, definition, index) {
  const selected = new Map(), unresolved = new Map();
  const visit = (id, active = new Set()) => { require(!active.has(id), 'A monotone defining body is cyclic.'); if (selected.has(id)) return; active.add(id); const r = row(node, id); selected.set(id, r);
    const children = primitiveChildren(r.node); if (children === null) unresolved.set(id, { ...r, closureProved: false }); else children.forEach(x => visit(x, active)); active.delete(id); };
  for (const id of [...definition.parameters, definition.variable, ...['body', 'left', 'right', 'derivativeLower', 'derivativeUpper'].map(k => definition[k])]) visit(id);
  const conditions = [
    ['Q(z)=Integral_0^1(1-t)R_second(t*z)dt is positive on the entire retained mu image.', 'The signed surrogate W=d0*mu*sqrt(Q(mu*p2)) extends smoothly at p2=0 and on flat collars.', 'F(0)<=0<=F(S^12), and exp(-S^14)<=F_mu<=exp(S^22) on the whole bracket.', 'Natural series/quadratic coefficients and differentiation under their complete defining integrals are justified.'],
    ['The actual lifted density a*(1+t^2)/(2*pi*vTarget) is real and strictly positive.', 'The complete source primitive satisfies phi(0)=0 and phi(theta+2*pi)=phi(theta)+1.', 'The retained bracket 2*pi*(phase-1)..2*pi*(phase+1) and bounds 1/(16*S^2)..exp(S^38) hold for all source arguments.', 'The system0 branch and every upstream coefficient have all requested derivatives.'],
    ['The actual source image is Z=s0^D*eta, T=s0*(1-eta^2), D=1/2-h, 1/2<=s0<=2, |eta|<=1.', 'The retained original parameter satisfies 0<h<1/16, and all substitutions preserve this image.'],
  ][index];
  return { index, definition: structuredClone(definition), definitionSHA256: hash(definition), selectedNodeCount: selected.size,
    selectedNodeBindingsSHA256: hash([...selected.values()].sort((a, b) => a.sourceNode - b.sourceNode)), exactOperandRows: ['body', 'left', 'right', 'derivativeLower', 'derivativeUpper'].map(k => ({ role: k, ...row(node, definition[k]) })),
    unresolvedUpstreamOperators: [...unresolved.values()], necessaryAnalyticConditions: conditions, analyticConditionsProvedByThisAudit: false,
    system2ConditionalBracketTheorem: index === 2 ? { formula: 'F(s)=s-Z^2*s^(2h)-T; F_s=1-2h*Z^2*s^(2h-1)',
      fullBracketDerivation: 'On the recorded source image, Z^2<=2^(1-2h). For 1/2<=s<=2, s^(2h-1)<=2^(1-2h). Thus 0<=2h*Z^2*s^(2h-1)<=2h*2^(2-4h)<8h<1/2, so 1/2<F_s<=1 on the full bracket. F(s0)=0 gives the endpoint signs.',
      exactImageAndParameterGuardProved: false, conditionalAlgebraOnly: true } : null };
}

/** No graph/registry/flag replacement is accepted. Stream all saved bytes,
 * keep only small source slices, and authenticate every original dependency.
 */
export async function auditSavedRadiusAndMonotone(...replacement) {
  require(replacement.length === 0, 'The source audit takes no caller graph, branch, hypothesis or completion flag.');
  const startedAt = new Date().toISOString();
  const index = JSON.parse(await pinned(ORIGINAL + 'checkpoint-index.json', PINS.index));
  const capture = JSON.parse(await pinned(ORIGINAL + 'source-bytes-before.json', PINS.dependencies));
  require(capture.files.length === 155 && index.checkpoints[0].firstNode === 0 && index.checkpoints[0].nodeCount === 3892594, 'Keep all 155 original dependencies and the complete source parent.');
  for (const r of capture.files) { await pinned(r.path, r.sha256, r.bytes); await pinned(ORIGINAL + 'sources/' + r.path, r.sha256, r.bytes); }
  const first = index.checkpoints[0], selected = new Map(), nodesHash = createHash('sha256'); let nodeBytes = 0, header;
  const keep = id => id < 8000 || (id >= 494400 && id <= 494786) || (id >= 498800 && id <= 499869) ||
    (id >= 516000 && id <= 517247) || (id >= 539398 && id <= 539400) || (id >= 622802 && id <= 622820) || [137008, 215514, 346574].includes(id);
  const stream = await verifyExactStageSnapshot(pathOf(first.path), { onHeader: h => { header = h; }, onNode: (id, n) => {
    const line = JSON.stringify([id, n]) + '\n'; nodesHash.update(line); nodeBytes += Buffer.byteLength(line); if (keep(id)) selected.set(id, freeze(n));
  } });
  require(stream.manifestSHA256 === first.sha256 && nodesHash.digest('hex') === first.nodesSHA256, 'The full saved parent node stream changed.');
  const node = id => selected.get(id), tables = [];
  const collect = (layer, namespace) => { for (const [key, value] of Object.entries(layer ?? {})) { if (key === 'base') collect(value, namespace + '.base'); else if (key === 'monotone' && typeof value === 'string') tables.push({ namespace: namespace + '.' + key, value: JSON.parse(value) }); } };
  collect(header.definitions, 'snapshot'); require(tables.length === 1 && tables[0].value.length === 3 && tables[0].value.every((d, j) => hash(d) === PINS.monotone[j]), 'The exact three original monotone bodies/brackets/bounds changed.');
  require(hash(node(539400)) === PINS.maximum && node(622802)?.op === 'coordinate', 'The actual maximum or differentiated source R binding changed.');
  const radius = inspectRadiusFTCDominance({ node, maximum: 539400 });
  const monotone = tables[0].value.map((d, j) => inspectMonotone(node, d, j));
  for (const r of capture.files) await pinned(r.path, r.sha256, r.bytes);
  return freeze({ schema: 'MathScope.N6.SavedRadiusMonotoneAudit/1', startedAt, finishedAt: new Date().toISOString(),
    source: { snapshotIndexSHA256: PINS.index, sourceDependencyCaptureSHA256: PINS.dependencies, sourceDependencies: capture.files,
      completeParentSnapshotNodeCount: first.nodeCount, completeParentSnapshotNodeSHA256: first.nodesSHA256, completeParentSnapshotNodeBytes: nodeBytes,
      fullUncompressedStreamVerified: true, compressedBytes: stream.compressedBytes, retainedAuditNodeCount: selected.size, boundedMemorySelection: true },
    sourceMaximum: { ...radius, sourceAuthenticated: true }, differentiatedSourceCoordinate: row(node, 622802), monotoneRegistryNamespace: tables[0].namespace, monotone,
    mathematicalStatus: 'EXACT_FTC_MAXIMUM_CONDITIONAL_DOMINANCE_ALL_ANALYTIC_GUARDS_OPEN',
    scope: { originalSourceFilesUnchanged: true, originalDerivativeRoutineCalled: false, originalPrivateAuthorityHydrated: false,
      radiusConditionalDominanceDerived: true, radiusGlobalSmoothnessProved: false, allThreeMonotoneAnalyticConditionsProved: false,
      wholeUpdatedMeanResidualVerified: false, originalN601Complete: false, originalN602Complete: false, completeN6: false, M3CountRaised: false } });
}
