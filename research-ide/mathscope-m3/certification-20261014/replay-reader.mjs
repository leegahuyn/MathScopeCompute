/** Offline optimization fork. Original producer and prior audit bytes are unchanged.
 * Base file: source-saved-whole-mean-direct-audit.mjs; SHA256 8b45d6266936ca720ce421bf3fbd316cf5e5678c00547232e08191b6e9c732ed.
 * No mathematical acceptance flags are promoted. */
/** Independent conservative-cylindrical replay of the stored whole mean.
 * No original formula helper, derivative routine, freeCoordinates cache or
 * recorded PASS bit is called. Analytic domains and unresolved custom-body
 * closure are hypotheses, never silently promoted to an actual PDE proof.
 */
import { createHash } from 'node:crypto';

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
  if (!integer(maxWork) || maxWork < 1 || maxWork > 5000000 || !integer(maxNodes) || maxNodes < 1 || maxNodes > 800000) fail('Use finite work <=5000000 and scalar nodes <=800000 in this separate offline reader.', 'RESOURCE_LIMIT');
  require(Array.isArray(sourceOperationRules) && sourceOperationRules.every(r => r && typeof r.sourceOperation === 'string' && typeof r.independentOperation === 'string' && ['importCall', 'differentiate', 'substitute', 'diagnostics'].every(k => typeof r[k] === 'function')) && new Set(sourceOperationRules.map(r => r.sourceOperation)).size === sourceOperationRules.length, 'Retain distinct complete independent source-operation rules.');
  const rules = [...sourceOperationRules], ruleForSource = op => rules.find(r => r.sourceOperation === op), ruleForIndependent = op => rules.find(r => r.independentOperation === op);
  const nodes = [], intern = new Map(), imported = new Map(), sourceBindings = new Map(), derivativeCache = new Map(), substitutionCache = new Map();
  const selectedSource = new Map(), selectedSourceBytes = new Map(), emittedNodes = [], domain = new Map(), callDefinitions = new Map(), unresolvedClosure = new Map(), supportCache = new Map(), unknownSourceOperators = new Map(), discreteDerivativeStops = [];
  let reader;
  let work = 0, alphaSerial = 0, skippedSubstitutions = 0, retainedBinders = 0;
  const sourceStack = [], occurrenceCache = new Map();
  const tick = () => { if (++work > maxWork) throw Object.assign(new Error('Independent optimized replay exhausted its work budget.'),{code:'RESOURCE_LIMIT',actualSourceImportStack:sourceStack.slice(-24),workUsed:work,scalarNodes:nodes.length}); };
  const take = id => { tick(); require(integer(id), 'Every source child must be an exact nonnegative node ID.'); const n = node(id); require(n && typeof n.op === 'string' && Array.isArray(n.args), 'A source node is missing or malformed.'); const raw = JSON.stringify(n); require(!selectedSourceBytes.has(id) || selectedSourceBytes.get(id) === raw, 'An already imported source node changed.'); selectedSourceBytes.set(id, raw); selectedSource.set(id, n); return n; };
  const put = (op, args) => { tick(); const key = JSON.stringify([op, args]); if (intern.has(key)) return intern.get(key); if (nodes.length >= maxNodes) throw Object.assign(new Error('Independent optimized replay exhausted its scalar node budget.'),{code:'RESOURCE_LIMIT',actualSourceImportStack:sourceStack.slice(-24),workUsed:work,scalarNodes:nodes.length}); const id = nodes.length, n = freeze({ op, args: structuredClone(args) }); nodes.push(n); emittedNodes.push(n); intern.set(key, id); return id; };
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
    // The reviewed grammar is [x,lower,upper,left,middle,right]. A defined
    // piecewise value with three zero arms is identically zero; this does not
    // choose a maximum branch or discharge the original join/domain guards.
    if(op==='smooth_piecewise'&&args.length===6&&args.slice(3).every(x=>x===zero))return zero;
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
    sourceStack.push(id);try{return importSourceBody(id);}catch(error){if(!error.actualSourceImportStack)error.actualSourceImportStack=sourceStack.slice(-24);throw error;}finally{sourceStack.pop();}
  }
  function importSourceBody(id) {
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
  // Exact occurrence over reviewed semantic operand positions. Unknown
  // operations are conservative: they prevent skipping/retaining a binder.
  // Metadata (registry indices, orders) must never be treated as node IDs.
  function occurs(id, bound) {
    if(id===bound)return true;const key=`${id}:${bound}`;
    if(occurrenceCache.has(key))return occurrenceCache.get(key);
    const {op,args:a}=nodes[id];let out;
    if(['rational','coordinate','source_parameter'].includes(op))out=false;
    else if(op==='unreviewed_source_operation')out=true;
    else if(op==='definite_integral')out=(a[1]!==bound&&occurs(a[0],bound))||occurs(a[2],bound)||occurs(a[3],bound);
    else if(['integer_power','source_step_derivative'].includes(op))out=occurs(a[0],bound);
    else if(op==='independent_defined_partial')out=[...a[2],...a[4]].some(x=>occurs(x,bound));
    else if(op==='independent_implicit_monotone_root')out=a[2].some(x=>occurs(x,bound));
    else if(op==='independent_implicit_quadratic_root')out=[a[2],...a[3]].some(x=>occurs(x,bound));
    else if(op==='independent_exact_natural_series')out=[a[1],a[2]].some(x=>occurs(x,bound));
    else if(['add','multiply','maximum','smooth_piecewise','inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling'].includes(op))out=a.some(x=>occurs(x,bound));
    else out=true;
    occurrenceCache.set(key,out);return out;
  }
  function dependencyWitness(root,variable){
    const seen=new Set(),queue=[[root,[]]],unknown=[];let visits=0;
    while(queue.length&&visits++<200000){
      const [id,path]=queue.pop();if(seen.has(id))continue;seen.add(id);
      const n=nodes[id],row={independentNode:id,operation:n.op,sourceIds:sourceBindings.get(id)??[]},nextPath=[...path,row];
      if(id===variable)return {found:true,path:nextPath,unknown,visits};
      const a=n.args;let children=[];
      if(n.op==='definite_integral')children=[...(a[1]===variable?[]:[a[0]]),a[2],a[3]];
      else if(['integer_power','source_step_derivative'].includes(n.op))children=[a[0]];
      else if(n.op==='independent_defined_partial')children=[...a[2],...a[4]];
      else if(n.op==='independent_implicit_monotone_root')children=a[2];
      else if(n.op==='independent_implicit_quadratic_root')children=[a[2],...a[3]];
      else if(n.op==='independent_exact_natural_series')children=[a[1],a[2]];
      else if(['add','multiply','maximum','smooth_piecewise','inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling'].includes(n.op))children=a;
      else if(!['rational','coordinate','source_parameter'].includes(n.op))unknown.push(row);
      for(const child of children)queue.push([child,nextPath]);
    }
    return {found:false,path:[],unknown:unknown.slice(0,24),visits,budgetExhausted:queue.length>0};
  }
  function substitute(id, bound, value) {
    if (id === bound) return value; if(bound===value||!occurs(id,bound)){skippedSubstitutions++;return id;} const key = `${id}:${bound}:${value}`; if (substitutionCache.has(key)) return substitutionCache.get(key);
    tick(); const { op, args: a } = nodes[id]; let out;
    if (['rational', 'coordinate', 'source_parameter', 'unreviewed_source_operation'].includes(op)) out = id;
    else if (ruleForIndependent(op)) out = ruleForIndependent(op).substitute(reader, id, bound, value);
    else if (op === 'independent_defined_partial') out = put(op, [a[0], a[1], a[2].map(x => substitute(x, bound, value)), a[3], a[4].map(x => substitute(x, bound, value))]);
    else if (op === 'definite_integral') {
      // The binder is local to the integrand; endpoints are outside scope.
      // Exact reviewed occurrence can avoid renaming. Unknown dependencies
      // force the conservative path and retain their open closure obligation.
      let body = a[0], binder = a[1];
      if (binder !== bound) {
        // A binder absent from the replacement cannot capture it. The
        // occurrence check sees every semantic operand and hidden unknowns.
        if(occurs(value,binder)){
        let name; do { name = `independent-integral-alpha:${++alphaSerial}:${nodes.length}`; } while (nodes.some(n => n.op === 'coordinate' && n.args[0] === name));
        const fresh = put('coordinate', [name]); body = substitute(body, binder, fresh); binder = fresh;
        }else retainedBinders++;
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
    else if (op === 'smooth_piecewise') { domain.set(`join:${id}`, { kind: 'SMOOTH_MATCHING_JOIN', operand: id, movingBoundariesRetained: a.slice(0, 3), provedByThisAudit: false }); out = constructor(op, [...a.slice(0, 3), ...a.slice(3).map(d)]); }
    else if (op === 'ceiling' || op === 'maximum') {
      const differentiatedOperands = a.map(d);
      if (differentiatedOperands.some(x => x !== zero)) {
        const sourceIds = [...(sourceBindings.get(id) || [])], variableSourceIds = [...(sourceBindings.get(variable) || [])];
        discreteDerivativeStops.push({ operation: op, independentNode: id, sourceIds, originalSourceNodes: sourceIds.map(sourceNode => ({ sourceNode, node: structuredClone(take(sourceNode)), nodeSHA256: hash(take(sourceNode)) })), operandRoots: a, differentiatedOperands, variable, variableSourceIds, frozenOrSmoothSelectionProved: false });
        throw Object.assign(new Error(`A ${op} selection (independent node ${id}, actual source nodes ${sourceIds.join(',') || 'derived'}) depends on differentiated variable ${variable} (actual source nodes ${variableSourceIds.join(',') || 'derived'}); its frozen/smooth branch is unproved.`),{code:'UNRESOLVED_CUSTOM_DERIVATIVE',dependencyWitness:dependencyWitness(id,variable)});
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
  const diagnostics = () => ({ workUsed: work, maxWork, scalarNodes: nodes.length, maxNodes, skippedSubstitutions, retainedBinders, exactCaptureAvoidanceForReviewedOperands:true, unknownCaptureClosureProved:false,
    selectedSourceNodeCount: selectedSource.size, selectedSourceNodesSha256: hash([...selectedSource].sort(([a], [b]) => a - b)),
    sourceBindings: [...sourceBindings].map(([id, sourceIds]) => ({ id, sourceIds })),
    inspectedDefinitionBindings: [...callDefinitions.values()], unresolvedCustomBodyClosure: [...unresolvedClosure.values()],
    unknownSourceOperators: [...unknownSourceOperators.values()],
    discreteDerivativeStops,
    sourceOperatorAudits: rules.map(r => ({ ...r.diagnostics(reader), sourceOperation: r.sourceOperation, independentOperation: r.independentOperation })),
    domainHypotheses: [...domain.values()], originalDerivativeRoutineCalled: false, originalFreeCoordinateRoutineCalled: false, originalPassBitsRead: false });
  const registerDomainHypothesis = record => { require(record && record.provedByThisAudit === false, 'New analytic hypotheses must remain explicitly unproved.'); domain.set(`external:${hash(record)}`, freeze(structuredClone(record))); };
  const assertSourceNodeBinding = (id, expected) => { require(same(take(id), expected), 'An independent reader has a changed source operand.'); return true; };
  reader = Object.freeze({ nodes, zero, one, q, add, mul, neg, sub, inv, div, pow, integral, put, importSource, derivative, substitute, diagnostics, registerDomainHypothesis, assertSourceNodeBinding, occurs });
  readerSeals.set(reader, { node, emittedNodes, methods: { ...reader } }); return reader;
}

export function assertIndependentMeanReader(reader, input = {}) {
  require(input && typeof input === 'object' && Object.keys(input).every(k => k === 'expectedSourceNode'), 'Select the exact expected source provider only.');
  const s = readerSeals.get(reader); require(s && Object.isFrozen(reader) && Object.entries(s.methods).every(([k, v]) => reader[k] === v) && reader.nodes.length === s.emittedNodes.length && reader.nodes.every((n, i) => n === s.emittedNodes[i]), 'Use the unchanged privately issued independent reader and scalar nodes.');
  require(input.expectedSourceNode === undefined || input.expectedSourceNode === s.node, 'A private saved-source adapter requires its exact original node provider.'); return true;
}

