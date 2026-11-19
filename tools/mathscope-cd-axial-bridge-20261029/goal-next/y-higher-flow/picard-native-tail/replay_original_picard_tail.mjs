import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, registryPath, output] = process.argv.slice(2);
assert(output, 'ORIGINAL_NAVIER_DIRECTORY ORIGINAL_REGISTRY NEW_JSON');
const sha = (value) => createHash('sha256').update(value).digest('hex');
const sourcePins = {
  'actual-residual-order-induction-source.mjs': '30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
  'actual-continuation-exact-inner.mjs': '3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8',
  'actual-residual-order-induction-expressions.mjs': 'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501',
  'actual-continuation-exact-functions.mjs': '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'actual-background-majorant.mjs': 'e741d1cd144481c205874d05842b7961807c923f92155a662347dbcd48785b52',
  'source-profile.mjs': '4578d632c3da8c6994557bcb4e78babf4dcede1e4893252c6a8ae2e342426133',
  'source-profile-data.mjs': 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a',
};
for (const [file, expected] of Object.entries(sourcePins)) {
  assert.equal(sha(await readFile(resolve(runtime,file))), expected, file);
}
const registered = await readFile(registryPath);
const registrySHA256 = sha(registered);
assert.equal(registrySHA256, '049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad');
const originalSystems = JSON.parse(JSON.parse(registered).base.picard);
const modulePath = pathToFileURL(resolve(runtime,'actual-residual-order-induction-source.mjs'));
const source = await import(modulePath);
const live = source.prepareActualOrderInduction({order:5,maxNodes:2000000}, {
  onProgress: ({phase,order,nodes}) => console.log(JSON.stringify({phase,order,nodes})),
});
assert.ok(source.assertActualOrderInduction(live));
const {G, bootstrap, records} = live;
assert.deepEqual(G.picardSystems, originalSystems);
const profile = G.source;
assert.equal(profile.parameterExpressionSHA256, 'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152');
const originalFirstNodes = 130348;
const originalPrefixSHA256 = sha(JSON.stringify(G.nodes.slice(0,originalFirstNodes)));
const originalNodeCountBeforeQueries = G.nodes.length;
const profileKeys = ['Md','T','h','j0','sigmaStar','rho','logP','Pstar','K','Q',
                     'Lambda','Xa','BRefUpper','logCSelected','CSelected','t1'];
const profileScalars = Object.fromEntries(profileKeys.map((code) => [code,profile.parametersExactExpressions[code]]));

const rows = [];
const ids = [G.zero,G.one,bootstrap.inner.B,bootstrap.inner.C1,bootstrap.inner.delta,bootstrap.inner.aSquared];
for (const {order,raw,auxiliary,norm:rowsForOrder} of records.slice(1)) {
  for (const kind of ['actual','auxiliary']) {
    const native = kind === 'actual' ? raw : auxiliary;
    const system = G.picardSystems[native.system];
    const norm = rowsForOrder[kind];
    const indexData = {
      s:norm.strip,C:norm.C,aSquared:norm.radialDomain,Kcondition:norm.Kcondition,
      loss:norm.loss,solutionNorm:norm.solutionNorm,
    };
    for (const [field,value] of Object.entries(indexData)) assert(Number.isSafeInteger(value), field);
    assert.deepEqual(system.radialDomain,[G.zero,G.sqrt(indexData.aSquared)]);
    assert.equal(system.tail.sourceBound,indexData.C);
    assert.equal(system.tail.solutionStrip,indexData.s);
    assert.equal(system.tail.Kcondition,indexData.Kcondition);
    assert.equal(system.tail.loss,indexData.loss);
    ids.push(...Object.values(indexData),system.radialDomain[1]);
    const cone = norm.leadingBase ? {
      matrixBound:norm.matrixBound,forcingBounds:norm.forcingBounds,E:norm.exponentBound,
      H0:norm.lowerMixedRadialBounds[0],V0:norm.lowerRegularVBounds[0],
      previousStrip:norm.previousStrip,e1:norm.e1,naturalBase:norm.leadingBase.naturalBase,
      gBound:norm.leadingBase.gBound,bootstrapB:norm.leadingBase.B,radius:norm.radius,
    } : null;
    if (cone) ids.push(...Object.values(cone).flat().filter(Number.isSafeInteger));
    const queries = [];
    for (const bits of [128,256]) {
      for (let etaOrder=0;etaOrder<=12;etaOrder++) {
        const computed = source.actualOrderInductionTail(live,{order,kind,etaOrder,bits});
        assert.ok(computed.positiveRemainderRetained && computed.actualSourceConvergenceModulus);
        assert.equal(computed.finiteDisplayedTermsCertified,false);
        ids.push(computed.K,computed.tail,computed.target);
        queries.push(computed);
      }
    }
    rows.push({index:native.system,order,kind,xi:system.xi,eta:system.eta,domain:system.radialDomain,indexData,cone,queries});
    console.log(JSON.stringify({system:native.system,order,kind,queries:queries.length}));
  }
}
const bootstrapHistorical = {K:originalSystems[0].tail.K,Kprecision:originalSystems[0].tail.Kprecision,
  etaOrder:originalSystems[0].tail.etaOrder,error:originalSystems[0].tail.error,target:originalSystems[0].tail.target,
  B:bootstrap.inner.B,C1:bootstrap.inner.C1,delta:bootstrap.inner.delta};
ids.push(...Object.entries(bootstrapHistorical).filter(([name])=>name!=='etaOrder').map(([,id])=>id));
const reached = new Set();
while (ids.length) {
  const id=ids.pop();
  if (reached.has(id)) continue;
  reached.add(id);
  const {op,args} = G.nodes[id];
  if (['rational','source_parameter'].includes(op)) continue;
  if (op==='integer_power') ids.push(args[0]);
  else if (['add','multiply','inverse','exp','log_positive','sqrt_positive','ceiling','maximum'].includes(op)) ids.push(...args);
  else throw new Error('Unexpected scalar operation '+op);
}
const result = {
  schema:'MathScope.C89.OriginalLiveNativePicardTailInputs/1',sourcePins,registrySHA256,
  originalFirstNodes,originalPrefixSHA256,originalNodeCountBeforeQueries,
  actualRegistryMatches:true,parameterExpressionSHA256:profile.parameterExpressionSHA256,profileScalars,
  bootstrapHistorical,rows,nodes:[...reached].sort((a,b)=>a-b).map((id)=>[id,G.nodes[id]]),
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
