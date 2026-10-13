/** Independent conservative-cylindrical replay of the stored whole mean.
 * No original formula helper, derivative routine, freeCoordinates cache or
 * recorded PASS bit is called. Analytic domains and unresolved custom-body
 * closure are hypotheses, never silently promoted to an actual PDE proof.
 */
import { createHash } from 'node:crypto';
import { assertSavedInitializedSource, savedInitializedSourceProgram } from './source-saved-initialized-authority.mjs';
import { assertSavedInitializedCutoffAuthority } from './source-saved-initialized-cutoff-norms.mjs';
import { createFactoredRationalVerifier } from './forced-rational-identity.mjs';
import { attachSavedMonotoneDerivativeAuthority } from './source-saved-monotone-implicit-derivatives.mjs';
import { attachSavedQuadraticDerivativeAuthority } from './source-saved-quadratic-implicit-derivatives.mjs';

const seals = new WeakSet(), keys = ['beta', 'v', 'gamma'];
const readerSeals = new WeakMap();
const fail = (message, code = 'INVALID_WHOLE_MEAN_DIRECT_AUDIT') => { throw Object.assign(new Error(message), { code }); };
const require = (ok, message) => { if (!ok) fail(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const integer = n => Number.isSafeInteger(n) && n >= 0;
const gcd = (a, b) => { a = a < 0n ? -a : a; while (b) [a, b] = [b, a % b]; return a; };

/** Unauthenticated algebra kernel for source replay and adversarial fixtures.
 * Caller-supplied nodes never gain source authority. Unknown derivative rules
 * throw rather than inventing a zero derivative or truncating an exact limit.
 */
export function createIndependentMeanReader({ node, definitions = {}, sourceOperationRules = [], maxWork = 200000, maxNodes = 200000 } = {}) {
  require(typeof node === 'function' && definitions && typeof definitions === 'object', 'An explicit read-only graph reader and definition registries are required.');
  if (!integer(maxWork) || maxWork < 1 || maxWork > 400000 || !integer(maxNodes) || maxNodes < 1 || maxNodes > 200000) fail('Use finite work <=400000 and scalar nodes <=200000.', 'RESOURCE_LIMIT');
  require(Array.isArray(sourceOperationRules) && sourceOperationRules.every(r => r && typeof r.sourceOperation === 'string' && typeof r.independentOperation === 'string' && ['importCall', 'differentiate', 'substitute', 'diagnostics'].every(k => typeof r[k] === 'function')) && new Set(sourceOperationRules.map(r => r.sourceOperation)).size === sourceOperationRules.length, 'Retain distinct complete independent source-operation rules.');
  const rules = [...sourceOperationRules], ruleForSource = op => rules.find(r => r.sourceOperation === op), ruleForIndependent = op => rules.find(r => r.independentOperation === op);
  const nodes = [], intern = new Map(), imported = new Map(), sourceBindings = new Map(), derivativeCache = new Map(), substitutionCache = new Map();
  const selectedSource = new Map(), selectedSourceBytes = new Map(), emittedNodes = [], domain = new Map(), callDefinitions = new Map(), unresolvedClosure = new Map(), supportCache = new Map(), unknownSourceOperators = new Map(), discreteDerivativeStops = [];
  let reader;
  let work = 0, alphaSerial = 0;
  const tick = () => { if (++work > maxWork) fail('Independent whole-mean replay exhausted its work budget.', 'RESOURCE_LIMIT'); };
  const take = id => { tick(); require(integer(id), 'Every source child must be an exact nonnegative node ID.'); const n = node(id); require(n && typeof n.op === 'string' && Array.isArray(n.args), 'A source node is missing or malformed.'); const raw = JSON.stringify(n); require(!selectedSourceBytes.has(id) || selectedSourceBytes.get(id) === raw, 'An already imported source node changed.'); selectedSourceBytes.set(id, raw); selectedSource.set(id, n); return n; };
  const put = (op, args) => { tick(); const key = JSON.stringify([op, args]); if (intern.has(key)) return intern.get(key); if (nodes.length >= maxNodes) fail('Independent replay exhausted its scalar node budget.', 'RESOURCE_LIMIT'); const id = nodes.length, n = freeze({ op, args: structuredClone(args) }); nodes.push(n); emittedNodes.push(n); intern.set(key, id); return id; };
  const q = (n, d = 1n) => { n = BigInt(n); d = BigInt(d); if (!d) fail('An exact rational denominator is zero.'); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d); return put('rational', [String(n / g), String(d / g)]); };
  const zero = q(0), one = q(1), rational = id => nodes[id].op === 'rational';
  const add = (...xs) => xs.reduce((a, b) => { if (a === zero) return b; if (b === zero) return a; if (rational(a) && rational(b)) { const [n, d] = nodes[a].args.map(BigInt), [m, e] = nodes[b].args.map(BigInt); return q(n * e + m * d, d * e); } return put('add', [a, b].sort((a, b) => a - b)); }, zero);
  const mul = (...xs) => xs.reduce((a, b) => { if (a === zero || b === zero) return zero; if (a === one) return b; if (b === one) return a; if (rational(a) && rational(b)) { const [n, d] = nodes[a].args.map(BigInt), [m, e] = nodes[b].args.map(BigInt); return q(n * m, d * e); } return put('multiply', [a, b].sort((a, b) => a - b)); }, one);
  const neg = x => mul(q(-1), x), sub = (a, b) => a === b ? zero : add(a, neg(b));
  const inv = x => { if (rational(x)) { const [n, d] = nodes[x].args; return q(d, n); } domain.set(`nonzero:${x}`, { kind: 'NONZERO_DENOMINATOR', operand: x, provedByThisAudit: false }); return put('inverse', [x]); };
  const div = (a, b) => a === zero ? zero : mul(a, inv(b));
  const pow = (x, n) => { if (!Number.isSafeInteger(n) || Math.abs(n) > 1000000) fail(`Finite replay power ${n} exceeded the exact verifier representation budget.`, 'RESOURCE_LIMIT'); if (n < 0) return pow(inv(x), -n); if (n === 0) return one; if (n === 1) return x; if (n === 2 && rational(x)) { const [a, b] = nodes[x].args.map(BigInt); return q(a * a, b * b); } return put('integer_power', [x, n]); };
  const integral = (body, bound, left, right) => body === zero || left === right ? zero : put('definite_integral', [body, bound, left, right]);
  const constructor = (op, args) => {
    if (op === 'add') return add(...args); if (op === 'multiply') return mul(...args); if (op === 'inverse') return inv(args[0]);
    if (op === 'integer_power') return pow(...args); if (op === 'definite_integral') return integral(...args);
    if (op === 'exp' && args[0] === zero) return one; if (op === 'log_positive' && args[0] === one) return zero;
    if (op === 'sqrt_positive' || op === 'log_positive') domain.set(`${op}:${args[0]}`, { kind: 'POSITIVE_ANALYTIC_ARGUMENT', operation: op, operand: args[0], provedByThisAudit: false });
    return put(op, args);
  };
  const registry = (op, index) => {
    const list = op === 'm3_aux_expression_partial' ? definitions.expressionDefinitions : op === 'actual_expression_partial' ? definitions.expression :
      op === 'm3_aux_indexed_partial' ? definitions.fieldDefinitions : op === 'm3_aux_inverse_partial' ? definitions.inverseDefinitions : definitions.m3GlobalFields;
    const at = op === 'm3_aux_expression_partial' ? -1 - index : index;
    require(Number.isSafeInteger(index) && Array.isArray(list) && list[at], 'A derivative call lost its original defining registry.'); return list[at];
  };
  // This deliberately narrow closure checker does not pretend to know an
  // unreviewed recurrence/Volterra/indexed-limit body from its signature.
  const primitiveSupport = (root, active = new Set(), cache = supportCache) => {
    if (cache.has(root)) return cache.get(root); if (active.has(root)) fail('Cyclic source definition.', 'DEPENDENCY_CYCLE'); active.add(root);
    const n = take(root), a = n.args; let support = new Set();
    if (n.op === 'coordinate') support.add(root);
    else if (['rational', 'source_parameter'].includes(n.op)) {}
    else if (['add', 'multiply', 'maximum', 'smooth_piecewise'].includes(n.op)) { for (const x of a) for (const y of primitiveSupport(x, active, cache)) support.add(y); }
    else if (['inverse', 'sqrt_positive', 'exp', 'log_positive', 'sine', 'cosine', 'ceiling', 'integer_power', 'source_step_derivative'].includes(n.op)) support = new Set(primitiveSupport(a[0], active, cache));
    else if (n.op === 'definite_integral') { support = new Set(primitiveSupport(a[0], active, cache)); support.delete(a[1]); for (const x of [a[2], a[3]]) for (const y of primitiveSupport(x, active, cache)) support.add(y); }
    else if (ruleForSource(n.op)?.sourceClosure && ruleForSource(n.op).sourceClosure(root).primitiveBodyClosureProved) {
      for (const x of ruleForSource(n.op).sourceClosure(root).actualArgumentSourceNodes) for (const y of primitiveSupport(x, active, cache)) support.add(y);
    }
    else { const key = `${n.op}:${root}`; unresolvedClosure.set(key, { sourceNode: root, operation: n.op, reason: 'Actual defining limit/indexed body capture closure is not proved by a function signature.', discharged: false }); support.add(key); }
    active.delete(root); cache.set(root, support); return support;
  };
  const call = (op, index, values, orders) => {
    const d = registry(op, index); require(Array.isArray(d.parameters) && d.parameters.length === values.length && new Set(d.parameters).size === d.parameters.length && d.parameters.every(x => take(x).op === 'coordinate'), 'Keep every original distinct formal parameter.');
    const expression = ['m3_aux_expression_partial', 'actual_expression_partial'].includes(op), directionIndices = expression ? d.parameters.map((_, i) => i) : d.directionParameterIndices;
    require(Array.isArray(directionIndices) && Array.isArray(orders) && orders.length === directionIndices.length && orders.every(integer) && directionIndices.every(x => integer(x) && x < values.length), 'The actual derivative directions must map to declared parameters.');
    const key = `${op}:${index}`;
    if (!callDefinitions.has(key)) {
      let capture = [];
      if (expression) {
        require(integer(d.body), 'A shared expression must retain its actual body.');
        capture = [...primitiveSupport(d.body)].filter(x => typeof x === 'number' && !d.parameters.includes(x));
      } else {
        unresolvedClosure.set(key, { operation: op, registryIndex: index, definitionSha256: hash(d), reason: 'Indexed or inverse defining bodies require a separately reviewed full derivative/domain/cover rule.', discharged: false });
      }
      callDefinitions.set(key, { operation: op, registryIndex: index, definitionSha256: hash(d), name: d.name, parameters: [...d.parameters], directionParameterIndices: [...directionIndices], capturedCoordinates: capture, definedBody: d.body ?? null });
    }
    const binding = callDefinitions.get(key);
    return put('independent_defined_partial', [op, index, values, orders, binding.capturedCoordinates.map(importSource)]);
  };
  const custom = new Set(['m3_aux_expression_partial', 'actual_expression_partial', 'm3_aux_indexed_partial', 'm3_aux_inverse_partial', 'm3_global_indexed_partial']);
  function importSource(id) {
    if (imported.has(id)) return imported.get(id); const n = take(id), a = n.args; let out;
    if (n.op === 'rational') out = q(...a);
    else if (['coordinate', 'source_parameter'].includes(n.op)) out = put(n.op, [a[0]]);
    else if (['add', 'multiply', 'maximum', 'smooth_piecewise'].includes(n.op)) out = constructor(n.op, a.map(importSource));
    else if (['inverse', 'sqrt_positive', 'exp', 'log_positive', 'sine', 'cosine', 'ceiling'].includes(n.op)) out = constructor(n.op, [importSource(a[0])]);
    else if (['integer_power', 'source_step_derivative'].includes(n.op)) out = constructor(n.op, [importSource(a[0]), a[1]]);
    else if (n.op === 'definite_integral') out = integral(...a.map(importSource));
    else if (custom.has(n.op)) out = call(n.op, a[0], a[1].map(importSource), a[2]);
    else if (ruleForSource(n.op)) out = ruleForSource(n.op).importCall(reader, id);
    else { unknownSourceOperators.set(id, { sourceNode: id, operation: n.op, definingOperands: structuredClone(a), originalNodeSha256: hash(n), derivativeRuleReviewed: false }); out = put('unreviewed_source_operation', [id, n.op]); }
    imported.set(id, out); const existing = sourceBindings.get(out) || []; existing.push(id); sourceBindings.set(out, existing); return out;
  }
  function substitute(id, bound, value) {
    if (id === bound) return value; const key = `${id}:${bound}:${value}`; if (substitutionCache.has(key)) return substitutionCache.get(key);
    tick(); const { op, args: a } = nodes[id]; let out;
    if (['rational', 'coordinate', 'source_parameter', 'unreviewed_source_operation'].includes(op)) out = id;
    else if (ruleForIndependent(op)) out = ruleForIndependent(op).substitute(reader, id, bound, value);
    else if (op === 'independent_defined_partial') out = put(op, [a[0], a[1], a[2].map(x => substitute(x, bound, value)), a[3], a[4].map(x => substitute(x, bound, value))]);
    else if (op === 'definite_integral') {
      // Alpha-rename before inserting an arbitrary argument. The source
      // binder is local to the integrand; endpoints remain outside its scope.
      // Renaming even when a collision is absent avoids trusting unknown
      // custom-body free-coordinate caches to decide whether capture occurs.
      let body = a[0], binder = a[1];
      if (binder !== bound) {
        let name; do { name = `independent-integral-alpha:${++alphaSerial}:${nodes.length}`; } while (nodes.some(n => n.op === 'coordinate' && n.args[0] === name));
        const fresh = put('coordinate', [name]); body = substitute(body, binder, fresh); binder = fresh;
        body = substitute(body, bound, value);
      }
      out = integral(body, binder, substitute(a[2], bound, value), substitute(a[3], bound, value));
    }
    else if (['integer_power', 'source_step_derivative'].includes(op)) out = constructor(op, [substitute(a[0], bound, value), a[1]]);
    else out = constructor(op, a.map(x => substitute(x, bound, value)));
    substitutionCache.set(key, out); return out;
  }
  function derivative(id, variable) {
    const key = `${id}:${variable}`; if (derivativeCache.has(key)) return derivativeCache.get(key); tick();
    const { op, args: a } = nodes[id], d = x => derivative(x, variable); let out;
    if (['rational', 'source_parameter'].includes(op)) out = zero;
    else if (op === 'coordinate') out = id === variable ? one : zero;
    else if (op === 'add') out = add(...a.map(d));
    else if (op === 'multiply') out = add(...a.map((x, i) => mul(d(x), ...a.filter((_, j) => j !== i))));
    else if (op === 'inverse') out = neg(mul(d(a[0]), pow(id, 2)));
    else if (op === 'integer_power') out = mul(q(a[1]), pow(a[0], a[1] - 1), d(a[0]));
    else if (op === 'exp') out = mul(id, d(a[0]));
    else if (op === 'log_positive') out = div(d(a[0]), a[0]);
    else if (op === 'sqrt_positive') out = div(d(a[0]), mul(q(2), id));
    else if (op === 'sine') out = mul(constructor('cosine', a), d(a[0]));
    else if (op === 'cosine') out = neg(mul(constructor('sine', a), d(a[0])));
    else if (op === 'source_step_derivative') { domain.set(`step:${id}`, { kind: 'ORIGINAL_SMOOTH_STEP_DERIVATIVE', sourceOperand: id, order: a[1] + 1, provedByThisAudit: false }); out = mul(constructor(op, [a[0], a[1] + 1]), d(a[0])); }
    else if (op === 'smooth_piecewise') { domain.set(`join:${id}`, { kind: 'SMOOTH_MATCHING_JOIN', operand: id, movingBoundariesRetained: a.slice(0, 3), provedByThisAudit: false }); out = put(op, [...a.slice(0, 3), ...a.slice(3).map(d)]); }
    else if (op === 'ceiling' || op === 'maximum') {
      const differentiatedOperands = a.map(d);
      if (differentiatedOperands.some(x => x !== zero)) {
        const sourceIds = [...(sourceBindings.get(id) || [])], variableSourceIds = [...(sourceBindings.get(variable) || [])];
        discreteDerivativeStops.push({ operation: op, independentNode: id, sourceIds, originalSourceNodes: sourceIds.map(sourceNode => ({ sourceNode, node: structuredClone(take(sourceNode)), nodeSHA256: hash(take(sourceNode)) })), operandRoots: a, differentiatedOperands, variable, variableSourceIds, frozenOrSmoothSelectionProved: false });
        fail(`A ${op} selection (independent node ${id}, actual source nodes ${sourceIds.join(',') || 'derived'}) depends on differentiated variable ${variable} (actual source nodes ${variableSourceIds.join(',') || 'derived'}); its frozen/smooth branch is unproved.`, 'UNRESOLVED_CUSTOM_DERIVATIVE');
      }
      out = zero;
    }
    else if (op === 'definite_integral') {
      const [body, bound, left, right] = a, dl = d(left), dr = d(right);
      domain.set(`leibniz:${id}:${variable}`, { kind: 'FINITE_INTEGRAL_LEIBNIZ', body, bound, left, right, variable, differentiationUnderIntegralRequired: true, movingEndpointTermsRetained: true, provedByThisAudit: false });
      out = add(bound === variable ? zero : integral(d(body), bound, left, right), dr === zero ? zero : mul(substitute(body, bound, right), dr), dl === zero ? zero : neg(mul(substitute(body, bound, left), dl)));
    } else if (op === 'independent_defined_partial') {
      const [kind, index, values, orders, captured] = a, binding = callDefinitions.get(`${kind}:${index}`);
      if (captured.some(x => d(x) !== zero)) fail('An actual named body captures the differentiation coordinate outside its formal arguments.', 'CAPTURED_COORDINATE_DERIVATIVE');
      out = add(...values.map((x, j) => { const scale = d(x); if (scale === zero) return zero; const at = binding.directionParameterIndices.indexOf(j); if (at < 0) fail('Frozen/discrete label derivative is not an available exact operator.', 'UNRESOLVED_CUSTOM_DERIVATIVE'); const next = [...orders]; next[at]++; return mul(scale, put(op, [kind, index, values, next, captured])); }));
    } else if (ruleForIndependent(op)) out = ruleForIndependent(op).differentiate(reader, id, variable);
    else fail(`No independent exact derivative rule for ${op}${op === 'unreviewed_source_operation' ? ` (${a[1]}, actual source node ${a[0]})` : ''}.`, 'UNRESOLVED_CUSTOM_DERIVATIVE');
    derivativeCache.set(key, out); return out;
  }
  const diagnostics = () => ({ workUsed: work, maxWork, scalarNodes: nodes.length, maxNodes,
    selectedSourceNodeCount: selectedSource.size, selectedSourceNodesSha256: hash([...selectedSource].sort(([a], [b]) => a - b)),
    sourceBindings: [...sourceBindings].map(([id, sourceIds]) => ({ id, sourceIds })),
    inspectedDefinitionBindings: [...callDefinitions.values()], unresolvedCustomBodyClosure: [...unresolvedClosure.values()],
    unknownSourceOperators: [...unknownSourceOperators.values()],
    discreteDerivativeStops,
    sourceOperatorAudits: rules.map(r => ({ ...r.diagnostics(reader), sourceOperation: r.sourceOperation, independentOperation: r.independentOperation })),
    domainHypotheses: [...domain.values()], originalDerivativeRoutineCalled: false, originalFreeCoordinateRoutineCalled: false, originalPassBitsRead: false });
  const registerDomainHypothesis = record => { require(record && record.provedByThisAudit === false, 'New analytic hypotheses must remain explicitly unproved.'); domain.set(`external:${hash(record)}`, freeze(structuredClone(record))); };
  const assertSourceNodeBinding = (id, expected) => { require(same(take(id), expected), 'An independent reader has a changed source operand.'); return true; };
  reader = Object.freeze({ nodes, zero, one, q, add, mul, neg, sub, inv, div, pow, integral, put, importSource, derivative, substitute, diagnostics, registerDomainHypothesis, assertSourceNodeBinding });
  readerSeals.set(reader, { node, emittedNodes, methods: { ...reader } }); return reader;
}

export function assertIndependentMeanReader(reader, input = {}) {
  require(input && typeof input === 'object' && Object.keys(input).every(k => k === 'expectedSourceNode'), 'Select the exact expected source provider only.');
  const s = readerSeals.get(reader); require(s && Object.isFrozen(reader) && Object.entries(s.methods).every(([k, v]) => reader[k] === v) && reader.nodes.length === s.emittedNodes.length && reader.nodes.every((n, i) => n === s.emittedNodes[i]), 'Use the unchanged privately issued independent reader and scalar nodes.');
  require(input.expectedSourceNode === undefined || input.expectedSourceNode === s.node, 'A private saved-source adapter requires its exact original node provider.'); return true;
}

/** Derivation starts from total cylindrical conservative fluxes and subtracts
 * the fixed background flux. It does not take stored residuals as operands.
 */
export function independentlyReconstructWholeMean(reader, { geometry, background, velocity, covariance, stress, pressure }) {
  const G = reader, at = x => G.importSource(x), R = at(geometry.R), e = at(geometry.epsilon), ci = at(geometry.ci), a = at(geometry.radialFast),
    Z = at(geometry.Z), T = at(geometry.T), Y = geometry.Y.map(at), vr = geometry.vr.map(at), vt = geometry.replayTimeDirection ?? geometry.vt.map(at),
    D = (x, v) => G.derivative(x, v), L = x => G.add(...Y.map((y, j) => G.mul(vr[j], D(x, y)))),
    Dr = x => G.add(D(x, R), G.mul(a, L(x))), Dz = x => G.mul(e, D(x, Z)),
    time = x => G.add(G.neg(G.mul(e, D(x, T))), G.mul(ci, G.add(...Y.map((y, j) => G.mul(vt[j], D(x, y)))))),
    divFlux = (x, weight) => G.add(Dr(x), G.div(G.mul(G.q(weight), x), R)),
    lap = x => G.add(Dr(Dr(x)), G.div(Dr(x), R), Dz(Dz(x))), vectorLap = x => G.sub(lap(x), G.div(x, G.pow(R, 2))),
    [b, V, axial] = ['b', 'V', 'G'].map(k => at(background[k])), [beta, v, gamma] = keys.map(k => at(velocity[k])),
    fullB = G.add(b, beta), fullV = G.add(V, v), fullG = G.add(axial, gamma), W = Object.fromEntries(Object.entries(covariance).map(([k, x]) => [k, at(x)])),
    deltaFlux = (x, y, oldX, oldY, covariance) => G.add(G.sub(G.mul(x, y), G.mul(oldX, oldY)), covariance),
    thetaRadial = G.sub(deltaFlux(fullB, fullV, b, V, W.rtheta), at(stress[0])),
    thetaAxial = deltaFlux(fullG, fullV, axial, V, W.thetaz),
    zRadial = G.sub(deltaFlux(fullB, fullG, b, axial, W.rz), at(stress[1])),
    zAxial = G.add(G.sub(G.pow(fullG, 2), G.pow(axial, 2)), W.zz, at(pressure)),
    Etheta = G.add(time(v), divFlux(thetaRadial, 2), Dz(thetaAxial), G.neg(G.mul(e, vectorLap(v)))),
    Ez = G.add(time(gamma), divFlux(zRadial, 1), Dz(zAxial), G.neg(G.mul(e, lap(gamma)))),
    gr = G.add(G.neg(time(beta)), G.neg(divFlux(deltaFlux(fullB, fullB, b, b, W.rr), 1)),
      G.neg(Dz(deltaFlux(fullB, fullG, b, axial, W.rz))), G.div(deltaFlux(fullV, fullV, V, V, W.thetatheta), R), G.mul(e, vectorLap(beta)));
  return { Etheta, Ez, gr, pressureZ: D(at(pressure), Z),
    derivation: 'Total cylindrical conservative fluxes minus fixed background fluxes; weights R²/R for tangential/axial divergence, complete scalar/vector viscosity, slow plus fast time and direct complete-pressure gradient.',
    sixCovarianceRootsRetained: Object.keys(W).length === 6, sourceAuthenticated: false };
}

export function auditSavedWholeMeanDirect(capability, cutoff, input = {}) {
  assertSavedInitializedSource(capability); assertSavedInitializedCutoffAuthority(cutoff);
  require(input && typeof input === 'object' && !Array.isArray(input) && Object.keys(input).every(k => ['maxWork', 'maxNodes', 'maxTerms', 'maxProducts'].includes(k)), 'Only finite replay budgets may be supplied.');
  const source = savedInitializedSourceProgram(capability), before = source.mean.stages.temporal, after = source.mean.stages.moments;
  require(same(cutoff.source, capability.source) && same(cutoff.actualRoots, source.actualRoots), 'Use the same privately authenticated initialized source and pressure cutoff authority.');
  require(same(before.mean.background, after.mean.background) && same(before.mean.fullAngularCovariance, after.mean.fullAngularCovariance) && same(before.mean.fullOriginalStress, after.mean.fullOriginalStress), 'Preserve the identical full background, six covariances and original stresses.');
  require(cutoff.bodies.pressureRows[0].pressure === before.pressure.value && cutoff.bodies.pressureRows[1].pressure === after.pressure.value && source.mean.nonlinear.remaindersDeclaredZero === false, 'Keep both complete latest pressures and all original nonzero remainders.');
  const definitions = {};
  for (const kind of ['expressionDefinitions', 'expression', 'fieldDefinitions', 'inverseDefinitions', 'm3GlobalFields']) {
    const found = source.definitionCollections.filter(row => row.namespace.endsWith('.' + kind));
    require(found.length === 1, 'Every defining registry must be the unique actual saved table: ' + kind); definitions[kind] = found[0].value;
  }
  const g = cutoff.bodies.geometry;
  // Recover vt=(sqrt(2)-1,1) as a NEW independent scalar. The original
  // radial direction is bound by cutoff authority; no frozen map is read.
  const originalNode = source.node;
  const rows = [], stops = [];
  // Construct this virtual direction in the independent graph; it never
  // obtains a source node ID or replaces the exact saved node provider.
  require(originalNode(g.vr[0]).op === 'rational' && same(originalNode(g.vr[0]).args, ['1', '1']), 'The fixed original direction first component must be exactly one.');
  const implicit = attachSavedMonotoneDerivativeAuthority(capability), quadratic = attachSavedQuadraticDerivativeAuthority(capability);
  const replay = createIndependentMeanReader({ node: originalNode, definitions, sourceOperationRules: [implicit, quadratic], maxWork: input.maxWork ?? 200000, maxNodes: input.maxNodes ?? 200000 });
  const geometry = { ...g, replayTimeDirection: [replay.neg(replay.importSource(g.vr[1])), replay.importSource(g.vr[0])] };
  const verify = createFactoredRationalVerifier(replay, { maxTerms: input.maxTerms ?? 20000, maxProducts: input.maxProducts ?? 200000 });
  for (const [stage, state] of [['temporal', before], ['moments', after]]) {
    try {
      const rebuilt = independentlyReconstructWholeMean(replay, { geometry, background: state.mean.background, velocity: state.velocity, covariance: state.mean.fullAngularCovariance, stress: state.mean.fullOriginalStress, pressure: state.pressure.value });
      const comparisons = {};
      for (const key of ['Etheta', 'Ez']) comparisons[key] = verify(replay.sub(rebuilt[key], replay.importSource(state.mean[key])));
      comparisons.gr = verify(replay.sub(rebuilt.gr, replay.importSource(state.mean.raw.gr)));
      comparisons.pressureZ = verify(replay.sub(rebuilt.pressureZ, replay.importSource(state.pressure.slowZDerivative)));
      rows.push({ stage, rebuilt, originalRoots: { Etheta: state.mean.Etheta, Ez: state.mean.Ez, gr: state.mean.raw.gr, pressure: state.pressure.value, pressureZ: state.pressure.slowZDerivative }, comparisons });
    } catch (error) {
      if (!['RESOURCE_LIMIT', 'UNRESOLVED_CUSTOM_DERIVATIVE', 'UNRESOLVED_IMPLICIT_UPSTREAM', 'CAPTURED_COORDINATE_DERIVATIVE', 'DEPENDENCY_CYCLE'].includes(error.code)) throw error;
      stops.push({ stage, code: error.code, reason: error.message }); break;
    }
  }
  const diagnostics = replay.diagnostics(), algebraMatched = rows.length === 2 && rows.every(row => Object.values(row.comparisons).every(check => check.pass));
  const unresolved = stops.length > 0 || diagnostics.unresolvedCustomBodyClosure.length > 0;
  const result = freeze({ schema: 'MathScope.N6.SavedWholeMeanDirectAudit/1', source: structuredClone(capability.source),
    sourceBindings: { previousVelocity: structuredClone(before.velocity), updatedVelocity: structuredClone(after.velocity), previousPressure: before.pressure.value, updatedPressure: after.pressure.value,
      previousA0: before.pressure.cutoffRemainder, updatedA0: after.pressure.cutoffRemainder, originalNonlinearRemainders: structuredClone(source.mean.nonlinear.remainderDefects), unchangedCovariance: structuredClone(before.mean.fullAngularCovariance), unchangedStress: structuredClone(before.mean.fullOriginalStress) },
    rows, diagnostics, stops, conditionalAlgebraIdentitiesMatched: algebraMatched,
    status: stops.length ? 'UNRESOLVED' : !algebraMatched ? 'DIFFERENCE_NOT_RESOLVED' : unresolved ? 'CONDITIONAL_MATCH_CUSTOM_CLOSURE_OPEN' : 'CONDITIONAL_STORED_NORMALIZED_MEAN_MATCH',
    scope: { actualSavedWholeVelocityAndPressureRootsBound: true, independentConservativeMeanFormulaConstructed: rows.length === 2,
      actualMonotoneAndQuadraticDerivativeRulesAttached: true, implicitDomainHypothesesDischarged: false,
      originalFormulaHelperCalled: false, originalDerivativeRoutineCalled: false, oldResidualRootUsedAsProofOperand: false,
      independentStoredMeanAlgebraMatched: algebraMatched, customBodyClosureProved: !unresolved,
      allDenominatorAndDomainHypothesesProved: false, actualWholeMeanDifferenceRecomputed: false,
      wholePhysicalNonzeroAngularPDERecomputed: false, originalPrivateProducerHydrated: false,
      numericalErrorEnclosureComputed: false, originalN601Complete: false, originalN602Complete: false, completeN6: false, wholeM3Complete: false },
    limitation: 'This compares reconstructed stored normalized angular means under retained exact-function, capture-closure, smoothness, join, integral and denominator hypotheses. It cannot establish the full Cartesian/nonzero-angular physical PDE or original N6-02 acceptance.' });
  seals.add(result); return result;
}
export function assertSavedWholeMeanDirectAudit(result) { require(seals.has(result) && Object.isFrozen(result), 'A copied, serialized or modified audit is not a private source record.'); return true; }
