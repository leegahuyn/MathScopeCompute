import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, registry, output] = process.argv.slice(2);
assert(output, 'ORIGINAL_NAVIER_DIR ORIGINAL_FUNCTION_REGISTRY NEW_JSON');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sourcePins = {
  'actual-residual-order-induction-source.mjs': '30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
  'actual-continuation-exact-inner.mjs': '3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8',
  'actual-residual-order-induction-expressions.mjs': 'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501',
  'actual-continuation-exact-functions.mjs': '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'actual-continuation-exact-core.mjs': 'd657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
  'actual-background-majorant.mjs': 'e741d1cd144481c205874d05842b7961807c923f92155a662347dbcd48785b52',
  'source-profile.mjs': '4578d632c3da8c6994557bcb4e78babf4dcede1e4893252c6a8ae2e342426133',
  'source-profile-data.mjs': 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a',
};
for (const [file, expected] of Object.entries(sourcePins))
  assert.equal(sha(await readFile(resolve(runtime, file))), expected, file);

const originalRegistry = await readFile(registry);
const registrySHA256 = sha(originalRegistry);
assert.equal(registrySHA256, '049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad');
const originalSystems = JSON.parse(JSON.parse(originalRegistry).base.picard);
const url = (file) => pathToFileURL(resolve(runtime, file));
const src = await import(url('actual-residual-order-induction-source.mjs'));
const live = src.prepareActualOrderInduction({order: 1, maxNodes: 2000000});
assert.ok(src.assertActualOrderInduction(live));
const {G, records, bootstrap} = live;
assert.deepEqual(G.picardSystems, originalSystems.slice(0, 2));
const profile = G.source;
assert.equal(profile.parameterExpressionSHA256, 'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152');
const originalPrefixNodes = G.nodes.length;
const originalPrefixSHA256 = sha(JSON.stringify(G.nodes));
const z = G.zero, o = G.one;
const {A, h, j0:j, Lambda} = G.core;
const leadingAxisU = G.substitute(G.core.Ustar, G.core.eta, z);
assert.equal(leadingAxisU, j);
const axisExpected = G.mul(G.q(4), A, j);
const {auxiliary:norm} = records[1].norm;
const aSquared = norm.radialDomain;
const a = G.sqrt(aSquared), C = norm.C, s = norm.strip;
const scale = G.q(1048576);
const xi = G.div(G.mul(a, j, G.pow(s, 2)), G.mul(G.add(o, a), scale, G.pow(G.add(o, C), 3)));
const X = G.pow(xi, 2), Y = G.mul(Lambda, X);
const Xa = G.parameter('Xa');
const normalize = G.mul(j, X);
const ids = [z,o,A,h,j,Lambda,leadingAxisU,axisExpected,aSquared,a,C,s,scale,xi,X,Y,Xa,normalize];
const rows = [];
for (const kind of ['raw', 'auxiliary']) {
  const r = records[1][kind], system = G.picardSystems[r.system];
  const [t0,t1] = G.picardPartialSum(r.system, 2).terms;
  const first = t0[1], second = t1[1];
  assert.equal(first, z);
  assert.deepEqual(system.A0[1], [z,z,z,z,z,o]);
  assert.deepEqual(system.A1[1], [z,z,z,z,z,z]);
  assert.equal(system.forcing[1], z);
  assert.deepEqual(system.diagonal,[0,0,2,0,3,1]);
  const f5 = system.forcing[5];
  const f5Axis = G.substitute(G.substitute(f5, system.xi, z), system.eta, z);
  const application = G.simultaneousSubstitute(r.U, [G.nodes[r.U].args[2],system.eta], [X,z]);
  assert.equal(application, G.picardEven(r.system,1,X,z));
  const pointRadial = G.materializePicardEvenDerivative(r.system,1,X,z);
  const sourceAxisSlope = kind==='raw'
    ? G.substitute(bootstrap.roots.actualN1UaxisSlope,system.eta,z)
    : G.div(f5Axis,G.q(4));
  const layers = [t0[5], second].map((root) => {
    const head = G.nodes[root];
    assert.equal(head.op, 'multiply');
    assert.ok(head.args.includes(system.xi));
    const integral = head.args.find((id) => id !== system.xi);
    const body = G.nodes[integral];
    assert.equal(body.op, 'definite_integral');
    assert.deepEqual(body.args.slice(2), [z,o]);
    return [[root, head], [integral, body]];
  });
  ids.push(r.U, f5Axis, application, pointRadial, sourceAxisSlope);
  rows.push({
    kind, system:r.system, f5, f5Axis, formalU:r.U, application, pointRadial,
    first, second, firstRadialVelocity:t0[5], sourceAxisSlope,
    A0Row:system.A0[1], A1Row:system.A1[1], firstForcing:system.forcing[1],
    diagonal:system.diagonal, xiFormal:system.xi, etaFormal:system.eta,
    domain:system.radialDomain, sourceInductionCore:records[1].coreAgreement.domain, layers,
  });
}

const reached = new Set();
while (ids.length) {
  const id = ids.pop();
  if (reached.has(id)) continue;
  reached.add(id);
  const {op,args} = G.nodes[id];
  if (['rational','source_parameter','coordinate'].includes(op)) continue;
  if (op === 'integer_power') ids.push(args[0]);
  else if (['add','multiply','inverse','exp','log_positive','sqrt_positive','ceiling','maximum'].includes(op))
    ids.push(...args);
  else if (['actual_background_even_profile','actual_background_picard'].includes(op))
    ids.push(...args.slice(2,4));
  else throw Error(`Unexpected reached geometry or axis expression ${id} ${op} ${JSON.stringify(args)}`);
}
const profileKeys = ['Md','T','h','j0','sigmaStar','rho','logP','Pstar','K','Q','Lambda','Xa'];
const profileScalars = Object.fromEntries(profileKeys.map((code) => [code,profile.parametersExactExpressions[code]]));
const result = {
  schema:'MathScope.C90.OriginalNativeCoreOperands/1', sourcePins, registrySHA256,
  profile:profile.id, profileScalars, parameterExpressionSHA256:profile.parameterExpressionSHA256,
  originalPrefixNodes, originalPrefixSHA256, originalSystemsBound:true,
  ids:{zero:z,one:o,A,h,j,Lambda,leadingAxisU,axisExpected,aSquared,a,C,s,scale,xi,X,Y,Xa,normalize},
  rows, nodes:[...reached].sort((u,v)=>u-v).map((id)=>[id,G.nodes[id]]),
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
for (const r of rows) console.log(JSON.stringify(r));
