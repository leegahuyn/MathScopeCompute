import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, registry, c100, output] = process.argv.slice(2);
assert(output, 'Usage: ORIGINAL_NAVIER N2_REGISTRY C100_N1_SEAM_RECEIPT NEW_JSON');
const sha = x => createHash('sha256').update(x).digest('hex');
const pinned = async (path, hash) => {
  const data = await readFile(path);
  assert.equal(sha(data), hash, path);
  return data;
};
const registryPin = '6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f';
const c100Pin = '17664f981265e2373a5c16d0bf3c9dc233af48605974de1e072520b9932b71de';
const archived = JSON.parse(await pinned(registry, registryPin));
const lowerReceipt = JSON.parse(await pinned(c100, c100Pin));
const pins = {
  'actual-residual-order-induction-source.mjs':'30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
  'actual-continuation-exact-order-two-source.mjs':'1ebf8b2b6f1df054a06309c5dc8695f2f3a867733544ab012f206bfed2969dd0',
  'actual-continuation-exact-identities.mjs':'bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712',
  'actual-global-primitive-kernels.mjs':'efebfbcfb124f5bed96bf13435333cb784a0d5cab319303a0244c788ce1bed59',
  'actual-residual-order-induction-expressions.mjs':'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501',
  'actual-continuation-exact-support.mjs':'0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98'
};
const load = name => import(pathToFileURL(resolve(runtime, name)));
for (const [name, hash] of Object.entries(pins)) await pinned(resolve(runtime,name), hash);
const src = await load('actual-residual-order-induction-source.mjs');
const { buildActualOmegaCoefficientOverX } = await load('actual-continuation-exact-order-two-source.mjs');
const { explicitPrimitiveBodyIdentity } = await load('actual-global-primitive-kernels.mjs');
const { sourceGraphRationalIdentity } = await load('actual-continuation-exact-identities.mjs');
const { actualSupportOrderProof, checkActualExteriorZeros } = await load('actual-continuation-exact-support.mjs');
const live = src.prepareActualOrderInduction({order:2, maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(live));
const {G,bootstrap:b,records:[l,n1,n2]} = live;
const originalNodeCount = G.nodes.length, originalPrefixSHA256 = sha(JSON.stringify(G.nodes));
const {raw,actual,global:g,stress} = n2;
const {orderOne:r, inner, constants:{X,eta,Xv}} = b;
const system = G.picardSystems[3], aux = G.picardSystems[2], xi = system.xi;
const q = (n,d=1) => G.q(n,d), zero = G.zero, one = G.one, atXi = id => G.substitute(id,X,G.pow(xi,2));
assert.equal(raw.system,3);
assert.equal(n2.auxiliary.system,2);
assert.deepEqual(G.picardSystems,JSON.parse(archived.base.picard).slice(0,4));
assert.equal(system.radialDomain[1],G.sqrt(inner.aSquared));
assert.notEqual(aux.radialDomain[1],system.radialDomain[1]);
assert.equal(inner.aSquared,24805);
assert.deepEqual(system.diagonal,[0,0,2,0,3,1]);
assert.deepEqual(system.zeroAxisDatum,Array(6).fill(0));
assert.deepEqual(system.lowerOrders.map(x=>[x.F,x.U,x.v]),
  [[l.actual.F,l.actual.U,l.actual.v],[n1.actual.F,n1.actual.U,n1.actual.v]].map(row=>row.map(atXi)));
assert.equal(raw.lambda,G.mul(q(4),G.parameter('h')));
assert.equal(n1.raw.lambda,G.mul(q(2),G.parameter('h')));
const unwrap = id => {
  const {op,args} = G.nodes[id];
  assert.equal(op,'actual_expression_partial');
  assert.deepEqual(args[1],[X,eta]);
  assert.deepEqual(args[2],[0,0]);
  return G.expressionSystems[args[0]].body;
};
const same = (a,b,atoms=[]) => sourceGraphRationalIdentity(G,G.sub(a,b),{atomicNodes:atoms}).pass;
const sameBody = (a,b) => explicitPrimitiveBodyIdentity(G,a,b).pass;
const integral = root => {
  const node=G.nodes[root];
  assert.equal(node.op,'definite_integral');
  return node.args;
};
const sourceR = n2.norm.actual;
assert.equal(sourceR.strip,G.div(inner.delta,q(524288)));
assert.equal(system.tail.Kcondition,sourceR.Kcondition);
const nativeTail=src.actualOrderInductionTail(live,{order:2,kind:'actual',etaOrder:8,bits:256});

const inOmega = buildActualOmegaCoefficientOverX(G,{order:1,X,eta,U:[l.actual.U,n1.actual.U],v:[l.actual.v,n1.actual.v]});
const outOmega = buildActualOmegaCoefficientOverX(G,{order:1,X,eta,U:[l.global.U,n1.global.U],v:[l.global.v,n1.global.v]});
assert.equal(raw.omegaOverX,inOmega.value);
assert.deepEqual(G.nodes[g.omega],{op:'smooth_piecewise',args:[X,inner.aSquared,r.Xplus,inOmega.value,outOmega.value,zero]});
assert.ok(same(raw.pKnown,G.sub(G.pow(n1.actual.F,2),G.mul(q(1,2),inOmega.value)),[n1.actual.F,inOmega.value]));
assert.ok(same(g.lowerPressure,G.sub(G.pow(n1.global.F,2),G.mul(q(1,2),g.omega)),[n1.global.F,g.omega]));
assert.ok(same(g.pressureDerivative,G.add(G.mul(q(2),g.F0Fn),g.lowerPressure),[g.F0Fn,g.lowerPressure]));
assert.equal(G.nodes[n1.actual.F].args[1],r.Xkeep);
assert.equal(G.nodes[n1.actual.F].args[2],r.Xcut);
assert.equal(G.nodes[n1.actual.F].args[5],zero);
assert.equal(G.nodes[n1.actual.U].args[5],zero);
const [avgBody,avgVar,avgLo,avgHi] = integral(n1.actual.average);
assert.deepEqual([avgLo,avgHi],[zero,one]);
assert.equal(avgBody,G.substitute(n1.actual.U,X,G.mul(avgVar,X)));
assert.equal(unwrap(n1.global.F),r.F1);
assert.equal(unwrap(n1.global.U),r.U1);
assert.equal(unwrap(n1.global.v),r.v1);
assert.equal(unwrap(n1.global.M),r.M1);
assert.equal(unwrap(n1.global.average),r.M1overX);
assert.deepEqual(G.nodes[r.M1].args.slice(0,3),[X,r.Xkeep,29328]);
assert.equal(G.nodes[r.M1].args[5],zero);
assert.deepEqual(G.nodes[g.dU].args.slice(0,4),[X,r.X0,r.IposRight,zero]);
assert.deepEqual(G.nodes[g.dF].args.slice(0,4),[X,r.X0,r.IposRight,zero]);

const pressureRow = G.mul(q(4),xi,atXi(l.actual.F));
assert.deepEqual(system.A0[3],[pressureRow,zero,zero,zero,zero,zero]);
assert.deepEqual(system.A1[3],Array(6).fill(zero));
assert.equal(system.forcing[3],G.mul(q(2),xi,atXi(raw.pKnown)));
assert.equal(system.A0[1][5],one);
assert.equal(system.A0[2][5],q(-1));
assert.equal(system.A0[1].filter(x=>x!==zero).length,1);
assert.equal(system.A0[2].filter(x=>x!==zero).length,1);
assert.ok([system.A1[1],system.A1[2]].every(row=>row.every(x=>x===zero)));
assert.deepEqual(system.forcing.slice(0,3),[zero,zero,zero]);

const parities = new Map();
const cacheParity = (id,value) => {parities.set(id,value);return value;};
function parity(id) {
  if (parities.has(id)) return parities.get(id);
  if (id===xi) return 1;
  if (!G.dependsOn(id,xi)) return 0;
  const {op,args}=G.nodes[id];
  if (op==='add'||op==='smooth_piecewise') {
    if (op==='smooth_piecewise') assert.ok(args.slice(0,3).every(x=>parity(x)===0));
    const entries=args.slice(op==='add'?0:3).filter(x=>x!==zero).map(parity);
    assert.ok(entries.every(x=>x===entries[0]),[id,op]);
    return cacheParity(id,entries[0]??0);
  }
  if (op==='multiply') return cacheParity(id,args.map(parity).reduce((a,b)=>a^b,0));
  if (op==='integer_power') return cacheParity(id,(parity(args[0])*args[1])&1);
  if (op==='inverse') return cacheParity(id,parity(args[0]));
  if (op==='definite_integral') {
    assert.ok(args.slice(2).every(x=>parity(x)===0));
    return cacheParity(id,parity(args[0]));
  }
  const inputs=
    op==='actual_background_even_profile'||op==='actual_background_picard'?args.slice(2,4):
    op==='actual_natural_series'?args.slice(1,3):
    op==='actual_quadratic_root'?[args[2]]:
    op==='actual_monotone_root'?args.slice(1):
    op==='actual_expression_partial'?args[1]:
    op==='source_step_derivative'?[args[0]]:args;
  assert.ok(inputs.every(x=>parity(x)===0),[id,op]);
  return cacheParity(id,0);
}
const parityShape=[0,0,0,0,1,1];
for (const matrix of [system.A0,system.A1])
  matrix.forEach((row,i)=>row.forEach((id,j)=>{
    if (id!==zero) assert.equal(parity(id),1^parityShape[i]^parityShape[j]);
  }));
system.forcing.forEach((id,i)=>{if (id!==zero) assert.equal(parity(id),1^parityShape[i]);});

const {terms,sum} = G.picardPartialSum(3,3);
const P2=system.diagonal.map((_,j)=>G.add(terms[0][j],terms[1][j]));
const tIntegral = density => {
  const t=G.fresh('C103_n2_mass_pressure_t');
  return G.mul(xi,G.integral(G.substitute(density,xi,G.mul(t,xi)),t,zero,one));
};
const pressure2 = G.add(tIntegral(system.forcing[3]),tIntegral(G.mul(pressureRow,P2[0])));
assert.ok(sameBody(sum[3],pressure2));
assert.equal(terms[0][0],zero);
assert.equal(terms[1][3],zero);
assert.notEqual(terms[2][3],zero);
const firstMomentRhs = G.mul(system.A0[1][5],G.add(terms[0][5],terms[1][5]));
const leftPressure = G.nodes[unwrap(g.Pi)];
const leftMass = G.nodes[unwrap(g.M)];
assert.deepEqual(leftPressure.args.slice(0,4),[X,r.Xkeep,r.Xplus,raw.Pi]);
assert.equal(leftPressure.args[5],zero);
assert.deepEqual(leftMass.args.slice(0,4),[X,r.Xkeep,29328,G.mul(X,raw.average)]);
assert.equal(leftMass.args[5],zero);
const flattenAdd = id => G.nodes[id].op==='add' ? G.nodes[id].args.flatMap(flattenAdd) : [id];
const pressureMiddle = flattenAdd(leftPressure.args[4]);
const prefixes = pressureMiddle.filter(id=>G.nodes[id].op==='definite_integral');
assert.equal(prefixes.length,1);
const [lowerPressureIntegrand,pressureBinder,pLo,pHi] = integral(prefixes[0]);
assert.deepEqual([pLo,pHi],[zero,X]);
assert.deepEqual(G.nodes[lowerPressureIntegrand].args.slice(1),[[pressureBinder,eta],[0,0]]);
assert.equal(G.expressionSystems[G.nodes[lowerPressureIntegrand].args[0]].body,g.lowerPressure);

const oldSupport=actualSupportOrderProof(b.completedOrderOne);
const exterior=checkActualExteriorZeros(b.G,[b.finalU,b.finalv,r.F1,r.U1,r.v1,r.M1],oldSupport);
assert.ok(exterior.pass);
assert.ok(exterior.zeroBranchTrace.every(row=>row.rightEndpoint!==r.Xplus));
assert.equal(oldSupport.endpoints.Xv,Xv);
assert.equal(oldSupport.endpoints.Xplus,r.Xplus);
assert.ok(oldSupport.expressionChecks.allEndpointsIndependentOfEta);
assert.ok(exterior.zeroBranchTrace.some(row=>row.rightEndpoint===Xv||row.rightEndpoint===29328));

const evenName = 'actual_background_even_profile';
const cutoffRawBoundary = raw.F;
const leaf = new Set(['coordinate','rational','source_parameter']);
const typed = new Set(['integer_power','source_step_derivative']);
const ordinary = new Set(['add','multiply','inverse','sqrt_positive','exp','log_positive','sine','cosine',
  'definite_integral','smooth_piecewise','maximum','minimum','ceiling']);
const children = (op,args) => {
  if (leaf.has(op)) return [];
  if (typed.has(op)) return [args[0]];
  if (op==='actual_expression_partial') return [G.expressionSystems[args[0]].body,...args[1]];
  if (op===evenName || op==='actual_background_picard') return args.slice(2,4);
  if (op==='actual_natural_series') return args.slice(1,3);
  if (op==='actual_quadratic_root') return [args[2]];
  if (op==='actual_monotone_root') return args.slice(1);
  assert.ok(ordinary.has(op),op);
  return args;
};
const cache = new Map();
function needs(id) {
  if (id<cutoffRawBoundary) return false;
  if (cache.has(id)) return cache.get(id);
  const {op,args} = G.nodes[id];
  const hit = (op===evenName && args[0]===3) || children(op,args).some(needs);
  cache.set(id,hit);
  return hit;
}
const ret = new Map(), rawCalls = new Set();
const rawFinite = [P2[0],P2[1],P2[2],sum[3]].map(id=>G.substitute(id,xi,G.sqrt(X)));
function replace(id) {
  if (!needs(id)) return id;
  if (ret.has(id)) return ret.get(id);
  const {op,args}=G.nodes[id];
  let changed;
  if (op===evenName) {
    const [sid,j,x,e,radialOrder,etaOrder]=args;
    assert.equal(sid,3);
    assert.equal(radialOrder,0);
    assert.ok(j<=3);
    rawCalls.add(id);
    let finite=rawFinite[j];
    for (let k=0;k<etaOrder;k++) finite=G.derivative(finite,eta);
    changed=G.simultaneousSubstitute(finite,[X,eta],[x,e]);
  } else if (op==='actual_expression_partial') {
    changed=replace(G.materializeExpressionFunction(args[0],args[1],args[2]));
  } else if (typed.has(op)) {
    changed=G.node(op,[replace(args[0]),args[1]]);
  } else {
    assert.ok(ordinary.has(op),op);
    changed=G.node(op,args.map(replace));
  }
  ret.set(id,changed);
  return changed;
}
const fields = {F:g.F,U:g.U,M:g.M,average:g.average,v:g.v,V:g.V,Pi:g.Pi,E:g.E,pressureDerivative:g.pressureDerivative};
const approximation = Object.fromEntries(Object.entries(fields).map(([name,id])=>[name,replace(id)]));
const incoming = g.incoming.map(replace);
assert.ok(incoming.every((id,j)=>id!==g.incoming[j]));
assert.equal(replace(g.lowerPressure),g.lowerPressure);
assert.ok(g.lowerBodies.every(id=>replace(id)===id));
assert.ok(Object.values(approximation).every(id=>!needs(id)));
const checks = g.momentResiduals.map(root=>{
  const proof=sourceGraphRationalIdentity(G,replace(root),{atomicNodes:incoming});
  assert.ok(proof.pass);
  return proof.numeratorMonomials;
});
assert.ok(checks.every(n=>n===0));
assert.ok(lowerReceipt.exactCompensatedMomentsZero===5);
assert.ok(stress.conservativeSourceMoments.every(Boolean));
assert.deepEqual(stress.compactSupport,[r.Xminus,r.Xplus]);

const out={
  schema:'MathScope.C103.OriginalN2PressureAndCompensationOperands/1',
  pins,registryPin,c100Pin,originalNodeCount,originalPrefixSHA256,
  actualSystem:3,auxiliarySystem:2,actualXi:xi,originalEta:eta,originalX:X,
  originalParityPositions:78,
  nativeTail:{...nativeTail,strip:sourceR.strip,C:sourceR.C,Kcondition:sourceR.Kcondition,radialDomain:sourceR.radialDomain},
  guards:{Xkeep:r.Xkeep,Xcut:r.Xcut,Xa:G.parameter('Xa'),aSquared:inner.aSquared,
    IposLeft:r.X0,IposRight:r.IposRight,Xv,Xplus:r.Xplus},
  sourcePressure:{density:g.pressureDerivative,lowerPressure:g.lowerPressure,rawKnown:raw.pKnown,rawOmega:inOmega.value,
    outerOmega:outOmega.value,omegaSwitch:g.omega,outerPressurePrefix:prefixes[0],pressureBinder,
    rawPressure:raw.Pi,actualPressure:g.Pi,originalRow:pressureRow,originalForcing:system.forcing[3],
    finiteThirdPressure:sum[3],verifiedPressureReplay:pressure2,exactFiniteIntegralIdentity:true},
  sourceMass:{originalRegularAverage:raw.average,originalM:g.M,n1CutoffAverage:n1.actual.average,originalFirstMomentHelper:firstMomentRhs},
  outerZeroLower:{expressions:exterior.checks,proofNodes:exterior.visitedNodes,trace:exterior.zeroBranchTrace},
  originalMomentRoots:g.incoming,approximationMomentRoots:incoming,approximationMomentNumeratorMonomials:checks,
  originalFields:fields,approximation,
  replacedN2EvenCalls:[...rawCalls].sort((a,b)=>a-b),lowerHistoriesRetained:true,
  originalN2StressSource:{z:stress.zBody,theta:stress.thetaBody,RZ:[stress.Tz,stress.Ttheta]},
  finalNodes:G.nodes.length
};
await writeFile(output,JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({systems:[2,3],points:rawCalls.size,exactMomentChecks:checks,exteriorLeaves:exterior.checks.length}));
