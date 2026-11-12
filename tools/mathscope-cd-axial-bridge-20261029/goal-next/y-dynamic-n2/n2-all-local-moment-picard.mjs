import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream, readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
import {createGunzip} from 'node:zlib';

const [graph, library] = process.argv.slice(2);
assert(graph && library, 'Supply the original N2 graph directory and the exact-functions module.');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function pinned(path, hash) {
  const data = readFileSync(path);
  assert.equal(digest(data), hash, path);
  return data;
}
const induction = join(dirname(library), 'actual-residual-order-induction-expressions.mjs');
const runtime = join(dirname(library), 'actual-global-source-expressions.mjs');
pinned(library, '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311');
pinned(induction, 'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501');
const exactBranchSemantics = pinned(runtime, 'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3');
assert(exactBranchSemantics.includes('v=ev(x<=a?args[3]:x>=b?args[5]:args[4],env)'));
const {base} = JSON.parse(pinned(join(graph, 'original-source-functions.json'),
  '6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f'));
const nodes = [];
const hash = createHash('sha256');
const last = 120403;
const stream = createReadStream(join(graph, 'original-source-nodes.jsonl.gz')).pipe(createGunzip());
let count = -1;
for await (const line of createInterface({input: stream, crlfDelay: Infinity})) {
  hash.update(line + '\n');
  if (count >= 0 && count <= last) nodes.push(JSON.parse(line));
  count++;
}
const sourceHash = hash.digest('hex');
assert.equal(count, 2852905);
assert.equal(sourceHash, '75db9fddc311fb7ce8d7968fbde4a52a07521cf8d47feb0b8f302d6bed108987');
const {ActualConvergentExpressions} = await import(pathToFileURL(resolve(library)));
const {ActualInductionExpressions} = await import(pathToFileURL(resolve(induction)));
const G = new ActualInductionExpressions(new ActualConvergentExpressions(), {maxNodes: 800000});
G.nodes = nodes;
G.lookup = new Map(nodes.map((node,i) => [JSON.stringify([node.op,node.args]),i]));
for (const kind of ['expression', 'picard', 'quadratic', 'monotone']) {
  G[kind + 'Systems'] = JSON.parse(base[kind]);
}
G.derivatives = new Map();
G.substitutions = new Map();
G.dependencyCache = new Map();
G.expressionMaterializations = new Map();
G.serial = 2000000;

function expect(id, op, args) {
  assert.deepEqual(nodes[id], {op,args}, String(id));
}
const eta = 2, zero = 0, one = 1, four = 474;
const Lambda = 3454, t1 = 3612, Xa = 3617, inverseXa = 3679;
const Xcut = 28823, XcoreEnd = 24805;
expect(Lambda, 'source_parameter', ['Lambda']);
expect(t1, 'source_parameter', ['t1']);
expect(Xa, 'source_parameter', ['Xa']);
expect(inverseXa, 'inverse', [Xa]);
expect(Xcut, 'multiply', [Xa,28822]);
expect(28822, 'exp', [28821]);
expect(28821, 'multiply', [t1,28820]);
expect(28820, 'rational', ['1','32']);
expect(XcoreEnd, 'multiply', [Xa,24804]);
expect(24804, 'exp', [24803]);
expect(24803, 'multiply', [t1,24802]);
expect(24802, 'rational', ['1','16']);
expect(24806, 'sqrt_positive', [XcoreEnd]);
const sys = G.picardSystems[3];
assert.equal(sys.name, 'ActualSameN3actualOrder2');
assert.equal(sys.eta, eta);
assert.deepEqual(sys.radialDomain, [zero,24806]);

function children(id) {
  const {op,args} = nodes[id];
  if (['rational','coordinate','source_parameter'].includes(op)) return [];
  if (['add','multiply','smooth_piecewise'].includes(op)) return args;
  if (['integer_power','source_step_derivative','log_positive','exp','inverse','sqrt_positive'].includes(op)) return args.slice(0,1);
  if (op === 'definite_integral') return [args[0],args[2],args[3]];
  if (op === 'actual_natural_series') return args.slice(1,3);
  if (op === 'actual_background_even_profile') return args.slice(2,4);
  assert.fail(`Unexpected literal subtree operator ${op} at ${id}`);
}

const moments = [
  [19,120279,120279,11,[1]],
  [20,120283,120283,12,[0]],
  [21,120391,120287,13,[0]],
  [22,120396,120291,14,[0,1]],
  [23,120403,120295,15,[0,1]],
];
for (const [registration, whole, local] of moments) {
  assert.equal(G.expressionSystems[registration].body, whole);
  if (whole !== local) assert(nodes[whole].op === 'add' && nodes[whole].args.includes(local));
}

function factors(id, binder) {
  const {op,args} = nodes[id];
  if (op === 'multiply') return args.flatMap(child => factors(child, binder));
  if (op === 'sqrt_positive' && args[0] === binder) return [binder];
  assert(op === 'coordinate' && args[0].startsWith('actual_Picard_G$'), `Unrecognized Picard radius factor ${id}`);
  return [id];
}

function unwrapRadius(id, binder) {
  const {op,args} = nodes[id];
  if (op === 'integer_power' && args[1] === 2) {
    const fs = factors(args[0], binder).sort((a,b) => a-b);
    assert.equal(fs.filter(x => x === binder).length, 1);
    return {square: id, fs, needsPositive: false};
  }
  if (op !== 'multiply' || !args.includes(Xa)) return null;
  const [exponential] = args.filter(x => x !== Xa);
  const inner = unwrapLogExp(exponential, binder);
  return inner && {...inner, needsPositive: true};
}

function unwrapLogExp(id, binder) {
  const exp = nodes[id];
  if (exp.op !== 'exp') return null;
  const log = nodes[exp.args[0]];
  if (log.op !== 'log_positive') return null;
  const normalized = nodes[log.args[0]];
  if (normalized.op !== 'multiply' || !normalized.args.includes(inverseXa)) return null;
  const [radius] = normalized.args.filter(x => x !== inverseXa);
  return unwrapRadius(radius, binder);
}

function operand(id, binder) {
  const {op,args} = nodes[id];
  assert.equal(op, 'multiply');
  if (args.includes(Lambda)) {
    const [radius] = args.filter(x => x !== Lambda);
    return unwrapRadius(radius, binder);
  }
  assert(args.includes(four));
  const [exp] = args.filter(x => x !== four);
  const inner = unwrapLogExp(exp, binder);
  return inner && {...inner, needsPositive: true};
}

function scan(root, binder, {dropGuard = false, oversizeBinder = false} = {}) {
  const seen = new Set();
  const calls = new Set(), staticCalls = new Set(), priorProfiles = new Set();
  const domains = new Map();
  const agenda = [{id: root, allowed: new Set([binder]), positive: new Set()}];
  let obligations = 0;
  while (agenda.length) {
    const {id,allowed,positive} = agenda.pop();
    const key = JSON.stringify([id,[...allowed].sort(),[...positive].sort()]);
    if (seen.has(key)) continue;
    seen.add(key);
    const {op,args} = nodes[id];
    const visit = (id, bindings = allowed, guards = positive) => agenda.push({id,allowed:bindings,positive:guards});
    if (op === 'definite_integral') {
      const [body,t,a,b] = args;
      visit(a);
      visit(b);
      const goodBinder = a === zero && b === one && !oversizeBinder;
      visit(body, goodBinder ? new Set([...allowed,t]) : allowed);
      continue;
    }
    if (op === 'smooth_piecewise') {
      const [x,a,b,low,mid,high] = args;
      for (const child of [x,a,b,low]) visit(child);
      let strict = positive;
      if (!dropGuard && a === Xa && b === XcoreEnd && x > last) {
        const rad = unwrapRadius(x, binder);
        assert(rad && !rad.needsPositive, `Unrecognized source radial guard at ${id}`);
        assert(rad.fs.every(t => allowed.has(t)), `Unbound Picard factor in guard at ${id}`);
        strict = new Set([...positive,rad.fs.join(',')]);
      }
      visit(mid, allowed, strict);
      visit(high, allowed, strict);
      continue;
    }
    if (op === 'actual_natural_series') {
      const [,y,e] = args;
      if (y <= last) {
        staticCalls.add(id);
      } else {
        const rad = operand(y, binder);
        assert(rad && rad.fs.every(t => allowed.has(t)), `Unbound Picard factor at ${id} -> ${y}`);
        assert.equal(e, eta);
        assert(!rad.needsPositive || positive.has(rad.fs.join(',')), `Missing positive radius for log at ${id} -> ${y}`);
        domains.set(y, {argument:y, squaredRadius:rad.square, factors:rad.fs, logarithmsRequirePositive:rad.needsPositive});
        calls.add(id);
        obligations++;
      }
    }
    if (op === 'actual_background_even_profile') priorProfiles.add(args[0]);
    for (const child of children(id)) visit(child);
  }
  return {
    root, states: seen.size, dynamicCalls: [...calls].sort((a,b) => a-b), obligations,
    literalStaticCalls: staticCalls.size, priorProfileSystems: [...priorProfiles].sort(),
    domains: [...domains.values()].sort((a,b) => a.argument-b.argument),
  };
}

const partial = G.picardPartialSum(3,3);
assert(partial.finiteTermsAreExactExpressions && !partial.finitePartialSumIsExactSolution);
const checks = [];
for (const [registration,whole,local,expression,components] of moments) {
  assert.equal(nodes[local].op, 'definite_integral');
  const [call,binder,lo,hi] = nodes[local].args;
  assert.deepEqual([lo,hi], [zero,Xcut]);
  assert.equal(nodes[binder].op, 'coordinate');
  expect(call, 'actual_expression_partial', [expression,[binder,eta],[0,0]]);
  const applied = G.materializeExpressionFunction(expression,[binder,eta],[0,0]);
  const stack = [applied], seen = new Set(), profiles = new Map();
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    const {op,args} = nodes[id];
    if (op === 'actual_background_even_profile' && args[0] === 3) {
      assert.deepEqual(args.slice(2), [binder,eta,0,0]);
      profiles.set(args[1],id);
    }
    if (id > last) stack.push(...children(id));
  }
  assert.deepEqual([...profiles.keys()].sort(), components);
  for (const component of components) {
    const root = G.substitute(partial.sum[component],sys.xi,G.sqrt(binder));
    checks.push({registration,whole,local,binder,component,sourceProfile:profiles.get(component),...scan(root,binder)});
  }
}
const first = checks[0];
assert.throws(() => scan(first.root,first.binder,{dropGuard:true}), /Missing positive radius/);
assert.throws(() => scan(first.root,first.binder,{oversizeBinder:true}), /Unbound Picard factor/);
assert(checks.every(row => row.dynamicCalls.length > 0));
const result = {
  schema:'MathScope.OriginalN2FinitePicardFiveLocalMomentDomains/1',
  sourceNodes: count, sourceHash, actualLocalMoments: moments.length, finiteTerms: partial.count,
  localComponentBindings: checks.length,
  distinctGeneratedLiteralCalls: new Set(checks.flatMap(row => row.dynamicCalls)).size,
  totalLexicalObligations: checks.reduce((sum,row) => sum+row.obligations,0),
  checkedRange: 'With Xa>0, Lambda*Xa=4 and 0<t1<1/128, every checked call has 0<=Y<=4 exp(t1/32)<5. Each logarithm is positive-domain from its original lazy radial guard.',
  controls: {removeOriginalPositiveGuardRejected:true, enlargeUnitBinderRejected:true},
  checks,
  scope:'Generated literal calls with a substituted Y argument in the original three displayed terms of actual order-two Picard components 0 and 1, bound to five original local moment integrals. Prior native profile bodies, original static calls, nonlocal lower terms, derivatives of the limit, and all other finite counts remain separate.',
};
console.log(JSON.stringify(result,null,2));
