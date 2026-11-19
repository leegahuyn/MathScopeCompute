/** Export actual ordered axial operands and ordinary eta AD without graph evaluation. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime, output] = process.argv.slice(2);
assert.ok(runtime && output, 'Provide the archived original navier runtime and an output path.');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const sourcePins = {
  'actual-residual-order-induction-source.mjs': '30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
  'actual-residual-order-induction-expressions.mjs': 'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501',
  'actual-continuation-exact-order-two-source.mjs': '1ebf8b2b6f1df054a06309c5dc8695f2f3a867733544ab012f206bfed2969dd0',
  'actual-continuation-exact-functions.mjs': '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'actual-continuation-exact-stress.mjs': '22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2',
  'actual-global-source-expressions.mjs': 'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
  'actual-continuation-exact-order-one.mjs': 'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72',
  'source-profile-data.mjs': 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a',
};
for (const [file, pin] of Object.entries(sourcePins)) {
  assert.equal(sha256(await readFile(resolve(runtime, file))), pin, file);
}
const modulePath = resolve(runtime, 'actual-residual-order-induction-source.mjs');
const {prepareActualOrderInduction, assertActualOrderInduction} =
  await import(pathToFileURL(modulePath).href);
const prepared = prepareActualOrderInduction({order: 5});
assert.equal(assertActualOrderInduction(prepared), true);
const {G, records, bootstrap} = prepared;
const {X, eta} = bootstrap.constants;
const {Xminus, Xplus} = bootstrap.orderOne;
const profileModule = resolve(runtime,'source-profile-data.mjs');
const {PINNED_N3}=await import(pathToFileURL(profileModule).href);
const {Md,T,lambda,h}=PINNED_N3.parametersExactExpressions;
assert.deepEqual(Md,{integer:1048576});
assert.deepEqual(T,{sum:[{exp:{ref:'Md'}},{integer:10}]});
assert.deepEqual(lambda,{exp:{product:[{integer:-1000},{ref:'T'}]}});
assert.deepEqual(h,{exp:{product:[{integer:-8002},{ref:'T'}]}});
const Ipos = {
  parameterRoots:{lambda:G.parameter('lambda'),h:G.parameter('h')},
  supports:bootstrap.orderOne.supports.map(pair=>pair.map(id=>G.fraction(id).map(String))),
  matrixShapes:[bootstrap.orderOne.Umat.map(row=>row.length),bootstrap.orderOne.Emat.map(row=>row.length)],
  exactSourceExpressions:{Md,T,lambda,h},
};
const prefix = {count: 117100, sha256: 'd125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116'};
assert.equal(sha256(JSON.stringify(G.nodes.slice(0, prefix.count))), prefix.sha256);
assert.equal(bootstrap.stress.axial, 117045);
assert.equal(bootstrap.program.orderOneStress.axialSupported, 117047);
assert.equal(bootstrap.stress.totalAxial, 117075);
assert.equal(G.derivative(Xminus, eta), G.zero);
assert.equal(G.derivative(Xplus, eta), G.zero);
const finiteSourceNodeCount = G.nodes.length;
const rows = [];

function assertNative(id, parameters, jet) {
  const node = G.nodes[id];
  assert.equal(node.op, 'actual_expression_partial');
  const [system, coordinates, orders] = node.args;
  assert.deepEqual(coordinates, parameters);
  assert.deepEqual(orders, jet);
  assert.deepEqual(G.expressionSystems[system].parameters, [X, eta]);
  return system;
}

for (const record of records.slice(2)) {
  const n = record.order, stress = record.stress;
  const terms = stress.axialTerms;
  assert.equal(terms.length, 2*n+6);
  assert.equal(stress.lowerViscosityOrder, n-1);
  assert.equal(record.global.actualMomentChecks.length, 5);
  assert.ok(record.global.actualMomentChecks.every(check => check.pass));
  const nativeRaw = assertNative(stress.rawZ, [X, eta], [0, 0]);
  const raw = G.expressionSystems[nativeRaw].body;
  const zBody = stress.zBody;
  assert.deepEqual(G.nodes[zBody], {op:'smooth_piecewise', args:[X, Xminus, Xplus, G.zero, stress.rawZ, G.zero]});
  const etaApplication = G.derivative(stress.rawZ, eta);
  assert.equal(assertNative(etaApplication, [X, eta], [0, 1]), nativeRaw);
  const rawEta = G.materializeExpressionFunction(nativeRaw, [X, eta], [0, 1]);
  const supportedEta = G.derivative(zBody, eta);
  assert.deepEqual(G.nodes[supportedEta], {op:'smooth_piecewise', args:[X, Xminus, Xplus, G.zero, etaApplication, G.zero]});

  const [outerX, lower, upper, low, inner, high] = G.nodes[stress.Tz].args;
  assert.deepEqual([outerX, lower, upper, low, high], [X, Xminus, Xplus, G.zero, G.zero]);
  assert.equal(G.nodes[inner].op, 'multiply');
  assert.ok(G.nodes[inner].args.includes(G.q(-1)));
  const inverseR = G.inv(G.sqrt(G.mul(G.q(2), X)));
  function extractIntegral(quotient) {
    const node = G.nodes[quotient];
    assert.equal(node.op, 'multiply');
    assert.ok(node.args.includes(inverseR));
    const integral = node.args.find(id => id !== inverseR);
    assert.equal(G.nodes[integral].op, 'definite_integral');
    return integral;
  }
  const forward = extractIntegral(G.nodes[inner].args.find(id => id !== G.q(-1)));
  const backward = extractIntegral(stress.backwardZ);
  const binders = [];
  for (const [integral, a, b] of [[forward,Xminus,X],[backward,X,Xplus]]) {
    assert.equal(G.nodes[integral].op, 'definite_integral');
    const [density, t, actualA, actualB] = G.nodes[integral].args;
    assert.notEqual(t, X);
    assert.notEqual(t, eta);
    assert.deepEqual([actualA, actualB], [a, b]);
    const body = G.nodes[density];
    assert.equal(body.op, 'smooth_piecewise');
    const sourceApplication = body.args[4];
    assert.deepEqual(body.args, [t, Xminus, Xplus, G.zero, sourceApplication, G.zero]);
    assert.equal(assertNative(sourceApplication, [t, eta], [0, 0]), nativeRaw);
    const integrandEta = G.derivative(density, eta);
    const etaBody = G.nodes[integrandEta], sourceEtaApplication = etaBody.args[4];
    assert.equal(etaBody.op, 'smooth_piecewise');
    assert.deepEqual(etaBody.args, [t, Xminus, Xplus, G.zero, sourceEtaApplication, G.zero]);
    assert.equal(assertNative(sourceEtaApplication, [t, eta], [0, 1]), nativeRaw);
    binders.push({integral, t, density, a, b, sourceApplication, etaApplication:sourceEtaApplication});
  }
  assert.notEqual(binders[0].t, binders[1].t);
  const aliases = [];
  function jets(name, root, dx, de) {
    function add(x, e, id) {
      if (id === G.zero) throw Error(`Unexpected zero jet: ${name}[${x},${e}]`);
      aliases.push({name, x, eta:e, node:id});
    }
    let radial = root;
    for (let x=0; x<=dx; x++) {
      let mixed = radial;
      for (let e=0; e<=de; e++) {
        add(x,e,mixed);
        if (e<de) mixed=G.derivative(mixed,eta);
      }
      if (x<dx) radial=G.derivative(radial,X);
    }
    for (let e=1; e<=de; e++) {
      let mixed = root;
      for (let i=0; i<e; i++) mixed=G.derivative(mixed,eta);
      for (let x=1; x<=dx; x++) {
        mixed=G.derivative(mixed,X);
        add(x,e,mixed);
      }
    }
  }
  for (const {order, global:field} of records.slice(0,n+1)) {
    jets('U'+order,field.U,order===n||order===n-1?2:1,order===n-1?3:2);
    jets('v'+order,field.v,0,1);
  }
  jets('Pi',record.global.Pi,1,2);
  const atomIds = new Set(aliases.map(alias=>alias.node));
  const all = new Set();
  function visit(id) {
    if (all.has(id)) return;
    all.add(id);
    if (atomIds.has(id)) return;
    const {op,args}=G.nodes[id];
    if (['coordinate','source_parameter','rational'].includes(op)) return;
    if (['add','multiply'].includes(op)) args.forEach(visit);
    else if (['inverse','integer_power'].includes(op)) visit(args[0]);
    else throw Error(`Unsupported original axial arithmetic ${op} #${id} n=${n}`);
  }
  [raw,rawEta,...terms].forEach(visit);
  rows.push({n, raw, rawEta, nativeRaw, zBody, supportedEta, terms, aliases, binders,
    graph:[...all].sort((a,b)=>a-b).map(id=>[id,G.nodes[id]])});
}
const result = {status:'VERIFIED_FINITE_ACTUAL_ORDERED_AXIAL_SOURCE_SLICES', sourcePins, prefix, finiteSourceNodeCount, Ipos,
  constants:{X,eta,h:G.parameter('h'),Xminus,Xplus}, rows, release:'HOLD'};
await writeFile(output, JSON.stringify(result, null, 2)+'\n');
console.log(JSON.stringify({status:result.status, finiteSourceNodeCount,
  rows:rows.map(row=>({n:row.n,raw:row.raw,rawEta:row.rawEta,terms:row.terms.length,slice:row.graph.length}))}));
