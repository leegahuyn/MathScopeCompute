import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const [runtime, output] = process.argv.slice(2);
const modules = {
  'actual-residual-order-induction-source.mjs': '30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
  'actual-continuation-exact-order-one.mjs': 'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72',
  'actual-continuation-exact-inner.mjs': '3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8',
  'actual-continuation-exact-pregluing.mjs': '7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3',
  'actual-continuation-exact-heat.mjs': 'c999b45a6d1e18226c80fb9866b6743553f1859c67dffa39490cd25f7e13d172',
  'actual-continuation-exact-core.mjs': 'd657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
  'actual-global-source-outer.mjs': '5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9',
  'actual-covariance-source-target.mjs': 'c79f67ef6310d398703629782f3bf8ec41743443f108123593018810bf8f2885',
};
const sha = value => createHash('sha256').update(value).digest('hex');
const texts = {};
for (const [name, digest] of Object.entries(modules)) {
  const raw = await readFile(path.join(runtime, name));
  assert.equal(sha(raw), digest, name);
  texts[name] = raw.toString();
}
const key = (x) => pathToFileURL(path.join(runtime, x));
const induction = await import(key('actual-residual-order-induction-source.mjs'));
const algebra = await import(key('actual-continuation-exact-identities.mjs'));
const { prepareActualOrderInduction, assertActualOrderInduction } = induction;
const { sourceGraphRationalIdentity } = algebra;
const live = prepareActualOrderInduction({ order: 3, maxNodes: 5000000, maxDerivativeOrder: 32 });
assert.equal(assertActualOrderInduction(live), true);
const { G, bootstrap, records } = live;
const firstCount = G.nodes.length;
assert.equal(firstCount, 123870);
const prefix = sha(JSON.stringify(G.nodes.slice(0, 117100)));
assert.equal(prefix, 'd125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116');
const fullPrefix = sha(JSON.stringify(G.nodes));
const { X, eta } = bootstrap.constants, q = (a,b=1) => G.q(a,b), zero = G.zero;
const { Xminus, Xkeep, Xcut, Xplus, Xb, supports, normalizedR, Rbase } = bootstrap.orderOne;
assert.deepEqual([X,eta,Xminus,Xkeep,Xcut,Xplus,Xb], [4756,2,28814,28819,28823,28824,28826]);
const aSquare = bootstrap.inner.aSquared;
assert.equal(aSquare, 24805);
const exactIds = new Set();
function node(id, op=null) {
  const value=G.nodes[id];
  assert.ok(value, id);
  if (op!==null) assert.equal(value.op,op,id);
  if (id<firstCount) exactIds.add(id);
  return value.args;
}
function opening(id) {
  const [def, args, derivative]=node(id,'actual_expression_partial');
  assert.ok(derivative.every(x => x===0));
  return G.materializeExpressionFunction(def,args,derivative);
}
function identity(x,y,atoms) {
  assert.equal(sourceGraphRationalIdentity(G,G.sub(x,y),{atomicNodes:atoms,maxTerms:20000}).pass,true);
}
function verifyPicard(r) {
  const { order,raw }=r;
  const p=G.picardSystems[raw.system], xi=p.xi;
  assert.deepEqual(p.radialDomain,[zero,G.sqrt(aSquare)]);
  assert.deepEqual(p.zeroAxisDatum,[0,0,0,0,0,0]);
  assert.deepEqual(p.diagonal,[0,0,2,0,3,1]);
  assert.deepEqual(p.A0[1],[0,0,0,0,0,1]);
  assert.deepEqual(p.A0[2],[0,0,0,0,0,q(-1)]);
  assert.deepEqual(p.A0[3].slice(1),[0,0,0,0,0]);
  assert.ok(p.A1.slice(1,4).every(row=>row.every(x=>x===zero)));
  const at = body => G.substitute(body,X,G.pow(xi,2));
  const leading = at(records[0].actual.F);
  const source = at(order===1?G.mul(q(-1,2),raw.omegaOverX):raw.pKnown);
  identity(p.A0[3][0],G.mul(q(4),xi,leading),[xi,leading]);
  identity(p.forcing[3],G.mul(q(2),xi,source),[xi,source]);
  return {system:raw.system,xi,axisDatum:p.zeroAxisDatum,pressureA0:p.A0[3][0],pressureForcing:p.forcing[3]};
}
const orders=[];
for (const r of records.slice(1)) {
  const { order,raw,actual,global }=r;
  const record=verifyPicard(r);
  const { kappa }=actual;
  for (const [field,rawId] of [['F',raw.F],['U',raw.U]]) {
    const branch=node(actual[field],'smooth_piecewise');
    assert.deepEqual(branch.slice(0,4),[X,Xkeep,Xcut,rawId]);
    assert.equal(branch[5],zero);
    identity(branch[4],G.mul(kappa,rawId),[kappa,rawId]);
  }
  const heads={};
  for (const name of ['F','U','M','average','v','Pi']) heads[name]=opening(global[name]);
  const mass=node(heads.M,'smooth_piecewise');
  const avg=node(heads.average,'smooth_piecewise');
  assert.deepEqual(mass.slice(0,3),avg.slice(0,3));
  assert.deepEqual(mass.slice(0,2),[X,Xkeep]);
  assert.equal(mass[5],zero); assert.equal(avg[5],zero);
  const lastU = G.mul(bootstrap.orderOne.X0,G.pow(supports[1][1],2));
  assert.equal(mass[2],lastU);
  identity(mass[3],G.mul(X,avg[3]),[X,avg[3]]);
  const actualMassSlot=order===1?heads.M:global.M;
  identity(avg[4],G.div(actualMassSlot,X),[X,actualMassSlot]);
  const pi=node(heads.Pi,'smooth_piecewise');
  assert.deepEqual(pi.slice(0,4),[X,Xkeep,Xplus,raw.Pi]);
  assert.equal(pi[5],zero);
  const momentRows=order===1?bootstrap.orderOne.momentResiduals:global.momentResiduals;
  assert.equal(momentRows.length,5);
  for (const row of momentRows) {
    node(row);
    identity(row,zero,global.incoming);
  }
  const mutant=G.add(momentRows[2],global.incoming[2]);
  assert.equal(sourceGraphRationalIdentity(G,mutant,{atomicNodes:global.incoming,maxTerms:20000}).pass,false);
  const omega=order===1?null:node(global.omega,'smooth_piecewise');
  if (omega) {
    assert.deepEqual(omega.slice(0,4),[X,aSquare,Xplus,raw.omegaOverX]);
    assert.equal(omega[5],zero);
  }
  for (const name of ['F','U','v','Pi','M','average']) node(global[name]);
  orders.push({order,raw:{F:raw.F,U:raw.U,Pi:raw.Pi},actualCutoff:[actual.F,actual.U],
    globalRoots:{F:global.F,U:global.U,M:global.M,average:global.average,v:global.v,Pi:global.Pi},
    bodies:heads,picard:record,pressureOuterBranch:pi[4],pressureDerivative:global.pressureDerivative,
    lastU,omegaBranches:omega,exactMomentRows:momentRows,omittedThirdMomentCorrectionRejected:true});
}

const heat=bootstrap.actualHeat.heat;
const terminal=heat.stageFields.at(-1);
assert.equal(terminal.id,'terminal');
const [y,lastStart,lastEnd,entry,interior,tail]=node(terminal.entryBranch,'smooth_piecewise');
assert.deepEqual([lastStart,lastEnd,entry,interior],[terminal.start,terminal.end,terminal.value,terminal.value]);
assert.deepEqual([lastStart,lastEnd,interior,tail],[294,319,71767,71748]);
const globalF=opening(records[0].global.F);
assert.equal(globalF,heat.finalF);
assert.deepEqual(node(globalF,'smooth_piecewise').slice(0,3),[X,G.parameter('Xa'),heat.XK]);
assert.equal(heat.Xb,Xb);
assert.equal(heat.stageFields.length,12);
for(let i=1;i<heat.stageFields.length;i++) assert.equal(heat.stageFields[i-1].end,heat.stageFields[i].start);
for (const id of [X,Xminus,Xkeep,Xcut,Xplus,Xb,normalizedR,Rbase,aSquare,heat.Xtail,heat.XK,
                  heat.heatCutoff,heat.exteriorAmplitude,heat.exteriorF,records[0].global.U,
                  records[0].global.v,bootstrap.finalM]) node(id);
for (const [first,last] of supports) { node(first,'rational'); node(last,'rational'); }
const heatCode=texts['actual-continuation-exact-heat.mjs'];
const coreCode=texts['actual-continuation-exact-core.mjs'];
const outerCode=texts['actual-global-source-outer.mjs'];
assert.ok(heatCode.includes("fo=G.sub(o,G.mul(rho,G.sub(o,G.step(G.div(G.sub(s,o),q(2))))))"));
assert.ok(heatCode.includes("heatCutoff=G.step(G.div(G.sub(s,q(1,5)),q(3,10)))"));
assert.ok(coreCode.includes("id==='terminal'){delta=G.add(G.mul(terminalSlope,s),G.log(G.div(fo(s),G.sub(one,rho))));theta=G.zero;}"));
assert.ok(outerCode.includes("stage('terminal',q(3),s=>sum(mul(terminalSlope,s),d.log(div(fo(s),sub(o,rho)))),z)"));
assert.ok(texts['actual-covariance-source-target.mjs'].includes('Cp=integrate(\'Cp\',G.pow(F,2))'));
assert.ok(texts['actual-covariance-source-target.mjs'].includes('Pi=G.add(G.core.P0,Cp)'));
const details={schema:'MathScope.C112.OriginalK1RadialLeafJoinGraph/1',status:'VERIFIED_ORIGINAL_N0_THROUGH_N3_JOIN_OPERANDS',
  sourceModules:modules,originalPrefixRecords:firstCount,historicalPrefixSHA256:prefix,originalPrefixSHA256:fullPrefix,
  positiveOrders:orders,formalRadius:X,formalEta:eta,
  originalBoundaries:{Xa:G.parameter('Xa'),Xminus,Xkeep,Xcut,aSquare,Xplus,Xb,Xv:bootstrap.constants.Xv},
  bumpSupports:supports,terminal:{entryBranch:terminal.entryBranch,localStartsAt:lastStart,localEndsAt:lastEnd,inside:interior,after:tail,
    Xtail:heat.Xtail,XK:heat.XK,Xb:heat.Xb,outerCutoff:heat.heatCutoff,heatF:heat.finalF,exteriorF:heat.exteriorF,
    schedule:heat.stageFields.map(row=>row.id)},
  nodeControls:[...exactIds].sort((a,b)=>a-b).map(id=>[id,G.nodes[id]])};
await writeFile(output,JSON.stringify(details,null,2)+'\n',{flag:'wx'});
console.log('PASS actual N0-N3 leaf branches, three Picard primitive rows and 15 pressure/stream moment identities');
