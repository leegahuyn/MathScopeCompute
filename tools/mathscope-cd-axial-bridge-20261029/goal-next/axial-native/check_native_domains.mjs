import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { prepareActualOrderInduction } from '../../goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/actual-residual-order-induction-source.mjs';
import { actualPositiveStressFTC } from '../../goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/actual-background-residual-bridge.mjs';
import { actualSupportOrderProof } from '../../goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/actual-continuation-exact-support.mjs';

const output = process.argv[2];
assert.ok(output, 'Supply an output JSON path.');
const prepared = prepareActualOrderInduction({ order: 3, maxNodes: 2200000 });
const { G, bootstrap, records } = prepared;
const { X, eta } = bootstrap.constants;
const { zero, one } = G;
const geometry = actualSupportOrderProof(bootstrap.completedOrderOne);
assert.equal(geometry.pass, true);
const ftc = actualPositiveStressFTC(prepared);
assert.equal(ftc.pass, true);
const anchoredPrefix = createHash('sha256').update(JSON.stringify(G.nodes.slice(0, 117100))).digest('hex');
assert.equal(anchoredPrefix, 'd125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116');
console.log('Pinned original three-order graph and geometry verified.');

const e = geometry.endpoints;
const geometryNodes = [zero, e.Xa, e.Xminus, e.Xkeep, e.Xcut, e.aSquared, one,
  e.IposLeft, e.lastU, e.IposRight, e.Xv, e.Xplus, e.Xb];
assert.equal(new Set(geometryNodes).size, geometryNodes.length);
const rank = new Map(geometryNodes.map((id, k) => [id, k]));
const infinite = geometryNodes.length;
const geometryNames = ['0', 'Xa', 'Xminus', 'Xkeep', 'Xcut', 'aSquared', '1',
  'IposLeft', 'lastU', 'IposRight', 'Xv', 'Xplus', 'Xb', '+infinity'];
const range = (lo, hi, kind = 'X') => ({ lo, hi, kind });
const etaRange = range(-1, 1, 'eta');
const stringifyRange = ({lo, hi, kind}) => kind === 'eta' ? [-1,1] :
  [geometryNames[lo], geometryNames[hi]];
const atAnchor = (id, kind = 'X') => range(rank.get(id), rank.get(id), kind);
const inCore = range(0, rank.get(e.aSquared));
const external = range(0, infinite);
const active = range(rank.get(e.Xminus), rank.get(e.Xplus));

const leafKinds = new Set(['rational', 'source_parameter', 'coordinate']);
const plainOperations = new Set(['add', 'multiply', 'inverse', 'sqrt_positive', 'exp', 'log_positive',
  'sine', 'cosine', 'maximum', 'ceiling', 'ceiling_nonnegative', 'smooth_piecewise']);
const picardKinds = new Set(['actual_background_picard', 'actual_background_even_profile']);
function operands({op, args}) {
  if (leafKinds.has(op)) return [];
  if (plainOperations.has(op)) return args;
  if (op === 'integer_power' || op === 'source_step_derivative') return [args[0]];
  if (op === 'definite_integral') return [args[0], args[2], args[3]];
  if (op === 'actual_expression_partial') return args[1];
  if (op === 'actual_natural_series') return [args[1], args[2]];
  if (op === 'actual_quadratic_root') return [args[2]];
  if (op === 'actual_monotone_root') return args.slice(1);
  if (picardKinds.has(op)) return [args[2], args[3]];
  throw Error('Unrecognized source operation ' + op);
}
const relevantMemo = new Map();
function hasPicard(id) {
  if (relevantMemo.has(id)) return relevantMemo.get(id);
  const node = G.nodes[id];
  const yes = picardKinds.has(node.op) ||
    node.op === 'actual_expression_partial' && hasPicard(G.expressionSystems[node.args[0]].body) ||
    operands(node).some(hasPicard);
  relevantMemo.set(id, yes);
  return yes;
}
const separateLeadingDefinitions = {
  quadratic: G.quadraticSystems.length,
  monotone: G.monotoneSystems.length,
};
for (const s of G.quadraticSystems) {
  const roots = [s.scale, ...s.rhs, ...s.linear.flat(), ...s.quadraticDiagonal.flat()];
  assert.ok(roots.every(id => !hasPicard(id)));
}
for (const s of G.monotoneSystems) {
  const roots = [s.body,s.left,s.right,s.derivativeLower,s.derivativeUpper];
  assert.ok(roots.every(id => !hasPicard(id)));
}
function bound(id, environment) {
  if (environment.has(id)) return environment.get(id);
  if (rank.has(id)) return atAnchor(id);
  const {op, args} = G.nodes[id];
  if (op === 'sqrt_positive') {
    const r = bound(args[0], environment);
    if (r?.kind === 'X') return range(r.lo, r.hi, 'xi');
  }
  if (op === 'integer_power' && args[1] === 2) {
    const r = bound(args[0], environment);
    if (r?.kind === 'xi') return range(r.lo, r.hi);
  }
  if (op === 'multiply') {
    const [a,b] = args.map(i => bound(i, environment));
    if (a && b && a.kind !== 'eta' && b.kind !== 'eta') {
      const choices = [];
      if (a.kind === 'X' && a.hi <= rank.get(one)) choices.push(range(0, b.hi, b.kind));
      if (b.kind === 'X' && b.hi <= rank.get(one)) choices.push(range(0, a.hi, a.kind));
      if (choices.length) return choices.reduce((u, v) => u.hi <= v.hi ? u : v);
    }
  }
  return null;
}
const derivativeBodies = new Map();
function expressionBody(system, orders) {
  const k = JSON.stringify([system, orders]);
  if (!derivativeBodies.has(k)) {
    const definition = G.expressionSystems[system];
    let body = definition.body;
    for (let j = 0; j < orders.length; j++) {
      for (let r = 0; r < orders[j]; r++) body = G.derivative(body, definition.parameters[j]);
    }
    derivativeBodies.set(k, body);
  }
  return derivativeBodies.get(k);
}
const notes = { traversed: 0, pc: new Set(), binders: new Set(), shared: new Set(),
  cases: 0, empty: 0, discarded: 0, contexts: new Map() };
function stateKey(node, env) {
  return JSON.stringify([node, [...env].sort((a,b) => a[0] - b[0])]);
}
function certify(root, environment, label, allowedPicard = null) {
  const seen = new Set();
  const local = { visited: 0, pc: 0, binders: 0, shared: 0, allowedPicard, edgeOrders: new Set() };
  function need(ok, why, id, path) {
    if (!ok) throw new Error(JSON.stringify({ label, why, id, node: G.nodes[id], path }));
  }
  function visit(id, env, path) {
    if (!hasPicard(id)) return;
    const key = stateKey(id, env);
    if (seen.has(key)) return;
    seen.add(key);
    notes.traversed++;
    local.visited++;
    const {op, args} = G.nodes[id];
    const at = [...path.slice(-8), id];
    if (picardKinds.has(op)) {
      const sys = G.picardSystems[args[0]];
      const realKind = op === 'actual_background_picard' ? 'xi' : 'X';
      const x = bound(args[2], env);
      const y = bound(args[3], env);
      const upper = bound(sys.radialDomain[1], new Map());
      need(Boolean(x && y && upper && x.kind === realKind && upper.kind === 'xi' &&
        0 <= x.lo && x.hi <= upper.hi && y.kind === 'eta'), {kind:'Picard call', x, y, upper,
          radialArgument: G.nodes[args[2]], etaArgument: G.nodes[args[3]], env: [...env]}, id, at);
      if (allowedPicard !== null) need(sys.order < allowedPicard,
        {kind:'lower-order recursion', systemOrder: sys.order, allowedPicard}, id, at);
      notes.pc.add(id);
      local.pc++;
      local.edgeOrders.add(sys.order);
      operands({op,args}).forEach(a => visit(a, env, at));
      return;
    }
    if (op === 'actual_expression_partial') {
      const [system, actuals, orders] = args;
      const formals = G.expressionSystems[system].parameters;
      need(formals.length === actuals.length, 'shared arity', id, at);
      const inner = new Map();
      actuals.forEach((a,j) => {
        visit(a, env, at);
        const b = bound(a, env);
        if (b) inner.set(formals[j], b);
      });
      notes.shared.add(id);
      local.shared++;
      visit(expressionBody(system, orders), inner, at);
      return;
    }
    if (op === 'definite_integral') {
      const [body, binder, left, right] = args;
      visit(left, env, at);
      visit(right, env, at);
      if (!hasPicard(body)) return;
      const lo = bound(left, env), hi = bound(right, env);
      need(Boolean(lo && hi && lo.kind === hi.kind && lo.kind !== 'eta' &&
        G.nodes[binder].op === 'coordinate' && lo.hi < infinite && hi.hi < infinite),
        {kind:'literal binder endpoints', lo, hi, endpoints: [G.nodes[left],G.nodes[right]], env: [...env]}, id, at);
      const inner = new Map(env);
      inner.set(binder, range(Math.min(lo.lo, hi.lo), Math.max(lo.hi, hi.hi), lo.kind));
      notes.binders.add(id);
      local.binders++;
      visit(body, inner, at);
      return;
    }
    if (op === 'smooth_piecewise') {
      const [coordinate, left, right, before, middle, after] = args;
      [coordinate,left,right].forEach(a => visit(a,env,at));
      const active = bound(coordinate,env);
      const low = bound(left,env);
      const high = bound(right,env);
      notes.cases++;
      for (const [child, minimum, maximum] of [
        [before, null, low], [middle, low, high], [after, high, null],
      ]) {
        if (!hasPicard(child)) { notes.discarded++; continue; }
        if (!active || active.kind === 'eta') { visit(child,env,at); continue; }
        const lo = minimum?.kind === active.kind ? Math.max(active.lo,minimum.lo) : active.lo;
        const hi = maximum?.kind === active.kind ? Math.min(active.hi,maximum.hi) : active.hi;
        if (lo > hi) { notes.empty++; continue; }
        const inner = new Map(env);
        inner.set(coordinate,range(lo,hi,active.kind));
        visit(child,inner,at);
      }
      return;
    }
    operands({op,args}).forEach(a => visit(a,env,at));
  }
  visit(root, environment, []);
  const summary = {...local, edgeOrders: [...local.edgeOrders].sort()};
  notes.contexts.set(label, summary);
  return summary;
}

function explicitIntegral(root) {
  if (G.nodes[root].op === 'definite_integral') return root;
  const op = G.nodes[root].op;
  if (op !== 'multiply' && op !== 'inverse') return null;
  const matches = G.nodes[root].args.map(explicitIntegral).filter(x => x !== null);
  assert.ok(matches.length < 2);
  return matches[0] ?? null;
}
function verifyDensity(integral, expectedLeft, expectedRight, sourceDensity, env, label) {
  const [integrand, binder, left, right] = G.nodes[integral].args;
  assert.deepEqual([left,right], [expectedLeft,expectedRight]);
  assert.ok(binder !== X && binder !== eta && G.nodes[binder].op === 'coordinate');
  const integrandNode = G.nodes[integrand];
  let explicit = integrand;
  let sharedSystem = null;
  if (integrandNode.op === 'actual_expression_partial') {
    const [system, values, orders] = integrandNode.args;
    const definition = G.expressionSystems[system];
    assert.deepEqual(definition.parameters, [X,eta]);
    assert.deepEqual(values, [binder,eta]);
    assert.deepEqual(orders, [0,0]);
    assert.equal(definition.body, sourceDensity);
    sharedSystem = system;
    explicit = G.materializeExpressionFunction(system,values,orders);
  }
  assert.equal(G.substitute(explicit,binder,X), sourceDensity);
  for (const edge of [e.Xminus,e.Xplus]) {
    assert.equal(G.substitute(explicit,binder,edge),zero);
    assert.equal(G.substitute(G.derivative(explicit,eta),binder,edge),zero);
  }
  const dependencies = certify(integral,env,label);
  assert.ok(dependencies.pc > 0 && dependencies.binders > 0);
  return {integral, integrand, binder, formalArguments: [X,eta],
    actualArguments: [binder,eta], sharedSystem, endpoints: [left,right], dependencies};
}

const orderResults = [];
for (const record of records.slice(1)) {
  const n = record.order;
  const row = ftc.rows.find(r => r.order === n && r.component === 'z');
  const original = record.stress;
  const nativeDensity = row.materializedDensity;
  const openEnv = new Map([[X,active],[eta,etaRange]]);
  const globalEnv = new Map([[X,external],[eta,etaRange]]);
  const endpointEnv = new Map([[eta,etaRange]]);
  const forward = row.integral;
  const backward = explicitIntegral(n === 1 ? original.zBackward : original.backwardZ);
  const [integrand,binder] = G.nodes[forward].args;
  const whole = n === 1 ? original.totalAxial : G.integral(integrand,binder,e.Xminus,e.Xplus);
  const calls = [
    verifyDensity(forward,e.Xminus,X,nativeDensity,openEnv,'n'+n+':forward'),
    verifyDensity(backward,X,e.Xplus,nativeDensity,openEnv,'n'+n+':backward'),
    verifyDensity(whole,e.Xminus,e.Xplus,nativeDensity,endpointEnv,'n'+n+':whole'),
  ];
  certify(original.Tz,globalEnv,'n'+n+':stress-value');
  const dEta = G.derivative(original.Tz,eta);
  certify(dEta,globalEnv,'n'+n+':stress-eta');
  certify(G.derivative(dEta,X),globalEnv,'n'+n+':stress-X-eta');
  const endpointJets = [];
  for (const [r,s] of [[0,0],[0,1],[0,2],[1,0],[1,1],[2,0]]) {
    let derivative = original.Tz;
    for (let i = 0; i < r; i++) derivative = G.derivative(derivative,X);
    for (let j = 0; j < s; j++) derivative = G.derivative(derivative,eta);
    for (const edge of [e.Xminus,e.Xplus]) {
      const atEdge = G.substitute(derivative,X,edge);
      assert.equal(atEdge,zero);
      assert.equal(G.substitute(atEdge,eta,G.q(-1)),zero);
      assert.equal(G.substitute(atEdge,eta,G.q(1)),zero);
    }
    endpointJets.push([r,s]);
  }
  const raw = record.raw.system;
  const originalSystem = G.picardSystems[raw];
  const forcingEnv = new Map([[originalSystem.xi,range(inCore.lo,inCore.hi,'xi')],[eta,etaRange]]);
  const sourceRoots = [...originalSystem.A0.flat(),...originalSystem.A1.flat(),...originalSystem.forcing];
  const lower = sourceRoots.map((id,j) => certify(id,forcingEnv,'n'+n+':source-'+j,n));
  const reached = [...new Set(lower.flatMap(row=>row.edgeOrders))].sort();
  assert.deepEqual(reached, Array.from({length:n-1},(_,i)=>i+1));
  const radialDerivative = G.picardRadialDerivative(raw,5,originalSystem.xi,eta,1);
  const evenMaterializer = G.materializePicardEvenDerivative(raw,1,X,eta,1,1);
  const radial = certify(radialDerivative,forcingEnv,'n'+n+':regular-radial-derivative',n+1);
  const even = certify(evenMaterializer,new Map([[X,inCore],[eta,etaRange]]),
    'n'+n+':regular-even-X-materializer',n+1);
  assert.ok(radial.pc > 0 && radial.binders > 0);
  assert.ok(even.pc > 0 && even.binders > 0);
  orderResults.push({n,nativeDensity,raw:row.raw,stress:original.Tz,calls,sourceSystem:raw,
    lowerPicardOrders: reached,checkedStressDerivatives:[[0,0],[0,1],[1,1]],
    endpointJets,regularDerivatives:{radialDerivative,evenMaterializer,radial,even}});
  console.log('Checked original axial order ' + n + ' endpoint/binder and recursive Picard domains.');
}

assert.deepEqual(orderResults[0].calls.map(x=>x.integral),[117057,117066,117075]);
assert.equal(orderResults[0].nativeDensity,117047);
const unsafe = G.picardEven(records[2].raw.system,1,e.Xplus,eta);
assert.throws(() => certify(unsafe,new Map([[eta,etaRange]]),'out-of-core-negative-control'),
  error => error.message.includes('Picard call') && error.message.includes('out-of-core-negative-control'));
const independentBinder = G.fresh('domain_transport_negative_control');
const unsafeBoundBody = G.picardEven(records[2].raw.system,1,independentBinder,eta);
const unsafeBoundIntegral = G.integral(unsafeBoundBody,independentBinder,e.Xminus,e.Xplus);
assert.throws(() => certify(unsafeBoundIntegral,new Map([[X,inCore],[eta,etaRange]]),
  'independent-binder-negative-control'), error => error.message.includes('Picard call') &&
  error.message.includes('independent-binder-negative-control'));
const unsafeEta = G.picardEven(records[2].raw.system,1,e.Xkeep,e.Xplus);
assert.throws(() => certify(unsafeEta,new Map(),'eta-type-negative-control'),
  error => error.message.includes('Picard call') && error.message.includes('eta-type-negative-control'));

const sourceDir = new URL('../../goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/', import.meta.url);
const sourceNames = ['actual-residual-order-induction-source.mjs','actual-continuation-exact-stress.mjs',
  'actual-background-residual-bridge.mjs','actual-continuation-exact-support.mjs',
  'actual-continuation-exact-functions.mjs','actual-residual-order-induction-expressions.mjs'];
const sourceSHA256 = Object.fromEntries(await Promise.all(sourceNames.map(async name =>
  [name,createHash('sha256').update(await readFile(new URL(name,sourceDir))).digest('hex')])));

await writeFile(output,JSON.stringify({schema:'MathScope.OriginalAxialNativeTransport/1',
  anchoredPrefix, sourceSHA256, geometry, orderResults, separateLeadingDefinitions,
  scope:'Picard/even-profile applications and Picard-bearing integral binders reached by the original axial positive stress and its displayed jets. Separately certified leading primitives are inputs.',
  negativeControls:{
    outOfCore:{node:unsafe,actualArgument:e.Xplus,originalBound:e.aSquared,rejectedByChecker:true},
    independentBinder:{node:unsafeBoundIntegral,binder:independentBinder,
      inheritedOuterXBound:e.aSquared,binderUpper:e.Xplus,rejectedByChecker:true},
    etaOperand:{node:unsafeEta,actualEtaArgument:e.Xplus,rejectedByChecker:true},
  },
  visited:{states:notes.traversed,distinctPicardCallNodes:notes.pc.size,
    distinctIntegralNodes:notes.binders.size,distinctSharedApplications:notes.shared.size,
    branchContexts:notes.cases,disjointBranches:notes.empty,irrelevantBranches:notes.discarded},
  byContext:Object.fromEntries([...notes.contexts].filter(([,r])=>r.pc>0)),
},null,2)+'\n');
console.log('PASS: original axial forward, backward and whole binder transport through order 3.');

