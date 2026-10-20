/** Conditional implicit derivatives of the retained actual slow-chart root.
 * The primitive differentiator derives from the complete equation body.
 * Existence, selected branch, differentiability and nonsingularity remain
 * analytic hypotheses. No original derivative or numerical root is called.
 */
import { createHash } from 'node:crypto';
import { assertSavedInitializedSource, savedInitializedSourceProgram } from './source-saved-initialized-authority.mjs';
import { assertIndependentMeanReader } from './source-saved-whole-mean-direct-audit.mjs';
import { createFactoredRationalVerifier } from './forced-rational-identity.mjs';

const fail = (message, code = 'INVALID_MONOTONE_IMPLICIT_DERIVATIVE') => { throw Object.assign(new Error(message), { code }); };
const require = (ok, message, code) => { if (!ok) fail(message, code); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const freeze = x => { if (x && typeof x === 'object' && !Object.isFrozen(x)) { Object.values(x).forEach(freeze); Object.freeze(x); } return x; };
const natural = n => Number.isSafeInteger(n) && n >= 0;
const seals = new WeakMap();
const privateSourceToken = Symbol('private-saved-monotone-source');
const definitionPins = Object.freeze([
  'a62918fe806c1c7c476fd3751b3c7db40e769658525d25a3e656e1ea42a5b55a',
  'cb14bd8cb0201d630aff22dfaf1f5b52474f44172107c3fbebc4aaa917842c3e',
  'e53efe521098aa99b855aa457a26f35edec45e6f74224d650afce71b80fec958',
]);

/** Unauthenticated fixture kernel. Supported systems must have a complete
 * primitive defining body with no hidden coordinate or unknown operator.
 * Every root value is a retained symbolic call, never a caller given number.
 */
function createKernel({ node, definitions, supportedSystems = [2], maxBindingWork = 200000 } = {}, token) {
  const sourceAuthenticated = token === privateSourceToken;
  require(typeof node === 'function' && Array.isArray(definitions) && Array.isArray(supportedSystems) && supportedSystems.every(natural), 'Retain the complete explicit monotone definitions.');
  require(natural(maxBindingWork) && maxBindingWork >= 1 && maxBindingWork <= 200000, 'Use a bounded source binding budget.');
  const definitionBindings = new Map(), readerStates = new WeakMap(); let bindingWork = 0;
  const take = id => { if (++bindingWork > maxBindingWork) fail('Monotone body binding exceeded its finite budget.', 'RESOURCE_LIMIT'); require(natural(id), 'A defining operand must be an actual node ID.'); const n = node(id); require(n && typeof n.op === 'string' && Array.isArray(n.args), 'A defining source node is absent.'); return n; };
  const inspect = (root, active = new Set(), cache = new Map(), selected = new Map(), unresolved = new Map()) => {
    if (cache.has(root)) return cache.get(root); if (active.has(root)) fail('An implicit definition is cyclic.', 'DEPENDENCY_CYCLE'); active.add(root);
    const n = take(root), a = n.args; selected.set(root, structuredClone(n)); let coordinates = new Set();
    if (n.op === 'coordinate') coordinates.add(root);
    else if (['rational', 'source_parameter'].includes(n.op)) {}
    else if (['add', 'multiply', 'maximum', 'smooth_piecewise'].includes(n.op)) { for (const x of a) for (const y of inspect(x, active, cache, selected, unresolved)) coordinates.add(y); }
    else if (['inverse', 'sqrt_positive', 'exp', 'log_positive', 'sine', 'cosine', 'ceiling', 'integer_power', 'source_step_derivative'].includes(n.op)) coordinates = new Set(inspect(a[0], active, cache, selected, unresolved));
    else if (n.op === 'definite_integral') { coordinates = new Set(inspect(a[0], active, cache, selected, unresolved)); coordinates.delete(a[1]); for (const x of a.slice(2)) for (const y of inspect(x, active, cache, selected, unresolved)) coordinates.add(y); }
    else unresolved.set(root, { sourceNode: root, operation: n.op, nodeSHA256: sha(n), definingOperands: structuredClone(a), closureProved: false });
    active.delete(root); cache.set(root, coordinates); return coordinates;
  };
  const bind = index => {
    if (definitionBindings.has(index)) { const previous = definitionBindings.get(index); require(sha(definitions[index]) === previous.definitionSHA256, 'The retained implicit definition changed after binding.'); return previous; }
    const d = definitions[index]; require(d && Array.isArray(d.parameters) && new Set(d.parameters).size === d.parameters.length && !d.parameters.includes(d.variable), 'An implicit body needs distinct complete formal parameters and a separate bound variable.');
    for (const id of [...d.parameters, d.variable]) require(take(id).op === 'coordinate', 'Every implicit formal/bound variable must be a source coordinate.');
    const selected = new Map(), unresolved = new Map(), allowed = [...d.parameters, d.variable], closure = {};
    for (const key of ['body', 'left', 'right', 'derivativeLower', 'derivativeUpper']) {
      const coordinates = [...inspect(d[key], new Set(), new Map(), selected, unresolved)];
      require(coordinates.every(id => allowed.includes(id)), 'An actual implicit equation or branch operand captures a hidden coordinate.', 'CAPTURED_IMPLICIT_COORDINATE');
      if (key !== 'body') require(!coordinates.includes(d.variable), 'Original bracket and derivative bounds must not capture the bound root variable.');
      closure[key] = coordinates;
    }
    const lower = take(d.derivativeLower), left = take(d.left), right = take(d.right);
    if (lower.op === 'rational' && BigInt(lower.args[0]) <= 0n) fail('A nonpositive derivative lower bound cannot authorize this branch.', 'SINGULAR_IMPLICIT_ROOT');
    if (left.op === 'rational' && right.op === 'rational' && BigInt(left.args[0]) * BigInt(right.args[1]) >= BigInt(right.args[0]) * BigInt(left.args[1])) fail('The retained implicit branch bracket must be strictly ordered.', 'INVALID_IMPLICIT_BRANCH');
    const result = { index, name: d.name, definition: structuredClone(d), definitionSHA256: sha(d), closure,
      selected: [...selected], unresolvedUpstreamOperators: [...unresolved.values()],
      supportedByThisKernel: supportedSystems.includes(index) && unresolved.size === 0,
      originalBracketAndBoundsRetained: true, sourceAuthenticated };
    freeze(result); definitionBindings.set(index, result); return result;
  };
  // Bind every system, including upstream-open systems. Their metadata is
  // never discarded merely because this bounded gate supports system2 only.
  definitions.forEach((_, i) => bind(i));
  const state = G => { if (!readerStates.has(G)) readerStates.set(G, { calls: new Map(), partials: new Map(), serial: 0, requests: [], hypotheses: [] }); return readerStates.get(G); };
  const checkReader = G => { require(G && typeof G.importSource === 'function' && typeof G.derivative === 'function' && typeof G.registerDomainHypothesis === 'function', 'Use the complete independent scalar reader.'); if (sourceAuthenticated) assertIndependentMeanReader(G, { expectedSourceNode: node }); };
  const checkSource = (G, id) => { if (sourceAuthenticated) G.assertSourceNodeBinding(id, take(id)); };
  const addHypothesis = (G, record) => { const h = { ...record, provedByThisAudit: false }; state(G).hypotheses.push(h); G.registerDomainHypothesis(h); };
  function emit(G, sourceId, index, values, derivedFrom = null) {
    const s = state(G), id = G.put('independent_implicit_monotone_root', [sourceId, index, values]);
    if (!s.calls.has(id)) s.calls.set(id, freeze({ independentRoot: id, originalSourceCall: sourceId, originalSourceNode: structuredClone(take(sourceId)), index,
      actualArgumentRoots: values, derivedArgumentSubstitution: derivedFrom !== null, derivedFrom, sourceAuthenticated: sourceAuthenticated && derivedFrom === null }));
    return id;
  }
  function importCall(G, sourceId) {
    checkReader(G); checkSource(G, sourceId); const n = take(sourceId), index = n.args[0], d = definitions[index];
    require(n.op === 'actual_monotone_root' && d && n.args.length === d.parameters.length + 1, 'Select an existing complete actual implicit call; no caller root value is accepted.');
    const binding = bind(index);
    for (const [id, expected] of binding.selected) { require(same(take(id), expected), 'The actual implicit defining body or branch operands changed after binding.'); checkSource(G, id); }
    for (const id of [...d.parameters, d.variable, ...n.args.slice(1)]) checkSource(G, id);
    const values = n.args.slice(1).map(G.importSource), result = emit(G, sourceId, index, values);
    addHypothesis(G, { kind: 'ORIGINAL_IMPLICIT_BRANCH', sourceNode: sourceId, registryIndex: index, definitionSHA256: binding.definitionSHA256,
      body: d.body, variable: d.variable, parameters: d.parameters, originalActualArguments: n.args.slice(1), left: d.left, right: d.right, derivativeLower: d.derivativeLower, derivativeUpper: d.derivativeUpper,
      statement: 'The retained symbolic call is the selected root of this complete F=0 equation on its original bracket. The branch is differentiable at every requested finite order and F_w at the retained root is nonzero.' });
    return result;
  }
  function simultaneous(G, expression, variables, values) {
    const s = state(G), temporary = variables.map(() => { let name; do { name = `independent-implicit-binder:${++s.serial}:${G.nodes.length}`; } while (G.nodes.some(n => n.op === 'coordinate' && n.args[0] === name)); return G.put('coordinate', [name]); });
    variables.forEach((v, j) => { expression = G.substitute(expression, v, temporary[j]); });
    temporary.forEach((v, j) => { expression = G.substitute(expression, v, values[j]); }); return expression;
  }
  function partials(G, root) {
    checkReader(G); const s = state(G), c = s.calls.get(root); require(c && same(G.nodes[root], { op: 'independent_implicit_monotone_root', args: [c.originalSourceCall, c.index, c.actualArgumentRoots] }) && same(take(c.originalSourceCall), c.originalSourceNode), 'A copied/replaced implicit root is not this reader call.');
    if (s.partials.has(root)) return s.partials.get(root); const b = bind(c.index), d = definitions[c.index];
    if (!b.supportedByThisKernel) fail(`Implicit system${c.index} ${d.name} retains unsupported upstream defining operators: ${b.unresolvedUpstreamOperators.map(x => `${x.operation}@${x.sourceNode}`).join(', ') || 'system not supported by this bounded gate'}.`, 'UNRESOLVED_IMPLICIT_UPSTREAM');
    const body = G.importSource(d.body), w = G.importSource(d.variable), parameters = d.parameters.map(G.importSource),
      Fw = G.derivative(body, w), verify = createFactoredRationalVerifier(G, { maxTerms: 20000, maxProducts: 200000 });
    if (verify(Fw).pass) fail('The independent complete F_w is identically zero despite a supplied lower-bound label.', 'SINGULAR_IMPLICIT_ROOT');
    const at = expression => simultaneous(G, expression, [...parameters, w], [...c.actualArgumentRoots, root]), denominator = at(Fw);
    if (verify(denominator).pass) fail('F_w at the retained arguments is identically zero.', 'SINGULAR_IMPLICIT_ROOT');
    const first = parameters.map(p => G.neg(G.div(at(G.derivative(body, p)), denominator)));
    const second = parameters.map((p, j) => parameters.map((q, k) => G.neg(G.div(G.add(at(G.derivative(G.derivative(body, p), q)),
      G.mul(at(G.derivative(G.derivative(body, p), w)), first[k]), G.mul(at(G.derivative(G.derivative(body, q), w)), first[j]),
      G.mul(at(G.derivative(Fw, w)), first[j], first[k])), denominator))));
    const result = { body, formalVariable: w, formalParameters: parameters, denominator, first, second,
      firstConstraintChecks: first.map((r, j) => verify(G.add(at(G.derivative(body, parameters[j])), G.mul(denominator, r)))),
      secondConstraintChecks: second.flatMap((row, j) => row.map((r, k) => verify(G.add(G.mul(denominator, r), at(G.derivative(G.derivative(body, parameters[j]), parameters[k])),
        G.mul(at(G.derivative(G.derivative(body, parameters[j]), w)), first[k]), G.mul(at(G.derivative(G.derivative(body, parameters[k]), w)), first[j]), G.mul(at(G.derivative(Fw, w)), first[j], first[k]))))),
      conditionalAlgebraOnly: true, branchExistenceOrDomainProved: false };
    require([...result.firstConstraintChecks, ...result.secondConstraintChecks].every(x => x.pass), 'An independently derived first/second implicit constraint identity failed.');
    addHypothesis(G, { kind: 'IMPLICIT_NONZERO_DERIVATIVE', sourceNode: c.originalSourceCall, registryIndex: c.index, denominator,
      lowerSourceNode: d.derivativeLower, upperSourceNode: d.derivativeUpper, statement: 'The original derivative bounds apply throughout the recorded source image and control this actual F_w; positivity and branch existence are not supplied by a serialized bound label.' });
    freeze(result); s.partials.set(root, result); return result;
  }
  function differentiate(G, root, variable) {
    const s = state(G), p = partials(G, root), c = s.calls.get(root);
    const answer = G.add(...c.actualArgumentRoots.map((x, j) => G.mul(p.first[j], G.derivative(x, variable))));
    s.requests.push({ root, variable, answer, recurrence: 'Sum_j (-F_j/F_w) at the retained symbolic root times derivative of every actual argument.' }); return answer;
  }
  function substitute(G, root, bound, value) {
    checkReader(G); const c = state(G).calls.get(root); require(c, 'Use an existing retained implicit root call.');
    const values = c.actualArgumentRoots.map(x => G.substitute(x, bound, value));
    return same(values, c.actualArgumentRoots) ? root : emit(G, c.originalSourceCall, c.index, values, root);
  }
  function sourceClosure(sourceId) {
    const n = take(sourceId), d = definitions[n.args[0]];
    require(n.op === 'actual_monotone_root' && d && n.args.length === d.parameters.length + 1, 'Retain the complete original implicit call.');
    const b = bind(n.args[0]); return { primitiveBodyClosureProved: b.supportedByThisKernel, actualArgumentSourceNodes: n.args.slice(1), definitionSHA256: b.definitionSHA256, branchAndDomainHypothesesProved: false };
  }
  const diagnostics = G => freeze(structuredClone({ schema: 'MathScope.N6.ConditionalMonotoneDerivativeKernel/1', bindingWork, maxBindingWork,
    registryBindings: [...definitionBindings.values()].map(({ selected, ...b }) => ({ ...b, selectedNodeCount: selected.length, selectedNodeBindingsSHA256: sha(selected) })),
    actualCallBindings: G ? [...state(G).calls.values()] : [], derivativeRequests: G ? state(G).requests : [],
    conditionalPartials: G ? [...state(G).partials].map(([root, p]) => ({ root, ...p })) : [],
    analyticHypotheses: G ? state(G).hypotheses : [], originalDerivativeRoutineCalled: false, numericalRootUsed: false,
    allThreeSystemsDerivativeClosed: false, allDenominatorAndDomainHypothesesProved: false, wholePhysicalPDEVerified: false, originalN601Complete: false, originalN602Complete: false, completeN6: false }));
  return Object.freeze({ sourceOperation: 'actual_monotone_root', independentOperation: 'independent_implicit_monotone_root', importCall, differentiate, substitute, partials, sourceClosure, diagnostics });
}

export function createConditionalMonotoneDerivativeKernel(input = {}) {
  require(input && typeof input === 'object' && !Array.isArray(input) && Object.keys(input).every(k => ['node', 'definitions', 'supportedSystems', 'maxBindingWork'].includes(k)), 'Fixture inputs cannot supply source authority or completion flags.');
  return createKernel(input);
}

export function attachSavedMonotoneDerivativeAuthority(capability, ...replacement) {
  assertSavedInitializedSource(capability); require(replacement.length === 0, 'No caller body, root, registry, branch or argument replacement is accepted.');
  const source = savedInitializedSourceProgram(capability), tables = source.definitionCollections.filter(x => x.namespace.endsWith('.monotone'));
  require(tables.length === 1 && tables[0].value.length === 3, 'Keep all three unambiguous actual monotone systems.');
  const definitions = tables[0].value;
  require(definitions.every((d, j) => sha(d) === definitionPins[j]), 'The actual implicit equation/body/bracket/derivative-bound definition changed.');
  const actualCalls = [];
  for (let id = 0; id < source.nodeCount; id++) { const n = source.node(id); if (n.op === 'actual_monotone_root') { require(definitions[n.args[0]] && n.args.length === definitions[n.args[0]].parameters.length + 1, 'An actual source implicit call has an incomplete tuple.'); actualCalls.push([id, structuredClone(n)]); } }
  require([0, 1, 2].every(j => actualCalls.some(([, n]) => n.args[0] === j)), 'Every original monotone system must retain actual call tuples.');
  const adapter = createKernel({ node: source.node, definitions, supportedSystems: [2] }, privateSourceToken);
  const binding = freeze({ source: structuredClone(capability.source), registrySHA256: sha(definitions), definitions: definitions.map((d, j) => ({ index: j, definition: structuredClone(d), definitionSHA256: definitionPins[j] })),
    actualCalls, actualCallsSHA256: sha(actualCalls), supportedSystems: [2], systems01RemainOpen: true,
    originalImplicitProducer: 'research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs', originalSourceFiles: source.sourceFiles.filter(x => ['actual-continuation-exact-functions.mjs', 'actual-continuation-exact-loop.mjs', 'source-global-band.mjs'].some(n => x.path.endsWith('/' + n))),
    sourceAuthenticated: true, derivativeAndBranchDomainProved: false });
  const authority = Object.freeze({ ...adapter, sourceBinding: binding }); seals.set(authority, { capability, source, adapter }); return authority;
}
export function assertSavedMonotoneDerivativeAuthority(authority) { const s = seals.get(authority); require(s && Object.isFrozen(authority) && Object.entries(s.adapter).every(([key, value]) => authority[key] === value), 'Use the unchanged privately bound implicit authority.'); assertSavedInitializedSource(s.capability); require(savedInitializedSourceProgram(s.capability) === s.source, 'The original source program changed.'); return true; }
