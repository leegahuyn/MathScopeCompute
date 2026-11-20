import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, c102, output] = process.argv.slice(2);
assert(output, 'Usage: ORIGINAL_RUNTIME C102_ABSOLUTE_OUTER NEW_JSON');
const sha = data => createHash('sha256').update(data).digest('hex');
const load = name => import(pathToFileURL(resolve(runtime, name)));
const read = async (path, pin) => {
  const data = await readFile(path);
  assert.equal(sha(data), pin, path);
  return data;
};
const pins = {
  'actual-residual-order-induction-source.mjs': '30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
  'actual-global-source-outer.mjs': '5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9',
  'actual-continuation-exact-support.mjs': '0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98',
  'actual-covariance-ell-one-obstruction.mjs': '305fb60d757d6e4b1963bb6be73a73e25ab14c04c6a6a23aaa74b99ee48eb96f',
};
for (const [name, pin] of Object.entries(pins)) await read(resolve(runtime, name), pin);
const opaque = 'a66c0591ea13634608803e57ead2a80d6167270637afa72d6f74fc71d587d213';
const old = JSON.parse(await read(resolve(c102, 'n1-absolute-outer-operands.json'), opaque));
const source = await load('actual-residual-order-induction-source.mjs');
const { ellOneSourceScalarIdentity } = await load('actual-covariance-ell-one-obstruction.mjs');
const live = source.prepareActualOrderInduction({order: 1, maxNodes: 2000000});
assert.ok(source.assertActualOrderInduction(live));
const {G, bootstrap: b} = live, r = b.orderOne;
assert.equal(sha(JSON.stringify(G.nodes)), old.originalPrefixSHA256);
assert.deepEqual([r.Xcut, r.X0, r.Xplus, r.Xb], [28823, old.originalSource.IposLeft, 28824, 28826]);
const p = G.source.parametersExactExpressions;
const ref = name => ({ref:name}), i = n => ({integer:n}), mul = (...x) => ({product:x});
const expected = {
  T:{sum:[{exp:ref('Md')},i(10)]}, Md:i(1048576),
  h:{exp:mul(i(-8002),ref('T'))}, lambda:{exp:mul(i(-1000),ref('T'))}, co:{rational:'1/256'},
  Tf:i(128), BOuter:mul(i(1000),ref('T')), logP:mul(i(2),ref('T')), Pstar:{exp:ref('logP')},
  XR:mul(i(110),{power:[mul(ref('CSelected'),ref('Pstar')),10]}),
  Q:{quotient:[mul(i(String(1n<<260n)),ref('K')),{power:[ref('sigmaStar'),2]}]},
  sigmaStar:{quotient:[ref('j0'),i(2000)]}, j0:{power:[ref('h'),4]}, K:{power:[ref('Pstar'),2]},
  logCSelected:{sum:[mul(i(10),{log:{sum:[i(1),ref('BRefUpper')]}}),{power:[ref('Q'),200]}]},
  BRefUpper:{power:[ref('Q'),300]}, CSelected:{exp:ref('logCSelected')},
  Lambda:{power:[ref('Q'),64]}, t1:{power:[ref('CSelected'),-120]},
  Xa:{quotient:[i(4),ref('Lambda')]}, X0Ipos:old.symbolicSourceScales.X0
};
for (const [name, body] of Object.entries(expected)) assert.deepEqual(p[name],body,name);
const q = n => G.q(n), pnode = n => G.parameter(n), z = G.zero, one = G.one;
const T=pnode('T'), B=pnode('BOuter'), Tf=pnode('Tf'), h=pnode('h'), lambda=pnode('lambda'),
  XR=pnode('XR'), rho=G.mul(pnode('co'),h);
const check = (left,right,name) => assert.ok(ellOneSourceScalarIdentity(G,left,right).pass,name);
const integrate = (fn,lo=z,hi=one) => {
  const s=G.fresh('C102_A13_integral');
  return G.integral(fn(s),s,lo,hi);
};
const S = s => integrate(t=>G.step(t),z,s);
const a=G.sub(one,lambda), d=G.sub(one,h), hold=G.mul(q(-4),G.log(h)), half=G.q(1,2);
const Q0=G.div(G.sub(lambda,h),a);
const Qsteep=G.mul(G.exp(G.neg(G.mul(a,half))),G.add(Q0,integrate(s=>
  G.mul(G.exp(G.mul(a,G.sub(s,S(s)))),G.sub(G.add(lambda,G.mul(a,G.step(s))),h)))));
const Qhold=G.add(Qsteep,G.mul(d,hold));
const Qb=G.mul(G.exp(G.neg(G.mul(d,half))),G.add(Qhold,integrate(s=>
  G.mul(G.exp(G.mul(d,S(s))),d,G.sub(one,G.step(s))))));
const Qp=integrate(s=>G.div(G.mul(G.exp(G.mul(d,s)),rho,G.step(G.div(G.sub(s,one),q(2)),1)),
  G.mul(q(2),G.sub(one,rho))),one,q(3));
const wait=G.div(G.log(G.div(Qb,Qp)),d);
for (const [name,body] of [['Qb',Qb],['Qp',Qp],['terminalWait',wait]]) check(G.outer.roots[name],body,name);
const ids=['initial','axialDecay','entry','reservedPower','pulse','interpolation','angular','steepen','steepPower','flatten','wait','terminal'];
const lengths=[one,T,one,G.mul(q(60),B),G.div(q(13),lambda),Tf,G.mul(q(30),B),one,hold,one,wait,q(3)];
const stages=G.outer.stages;
assert.deepEqual(stages.map(stage=>stage.id),ids);
let radius=z;
for (const [j,stage] of stages.entries()) {
  check(stage.start,radius,stage.id+' start');
  check(stage.length,lengths[j],stage.id+' length');
  radius=G.add(radius,lengths[j]);
  check(stage.end,radius,stage.id+' end');
}
assert.equal(r.Xb,G.mul(XR,G.exp(stages.at(-1).end)));
assert.equal(r.Xplus,G.mul(G.outer.roots.Xv,G.exp(one)));
assert.ok(b.program.orderOneStress.supportOrder.pass);
assert.equal(b.program.orderOneStress.axialSupported,117047);
const terminal = {
  schema:'MathScope.C102.OriginalN1OuterScaleOperands/1', priorOperandsSHA256:opaque,
  sourcePrefixSHA256:old.originalPrefixSHA256, profiles:expected, runtimePins:pins,
  originalNodes:{Xcut:r.Xcut,X0:r.X0,last:old.originalSource.last,Xplus:r.Xplus,Xb:r.Xb,axialBody:117047},
  stageIds:ids, terminalWaitAndTwoIntegralBodiesEqual:true, wholeStageStartsAndEndsEqual:true,
  leadingValueBounds:old.sameSourcePositiveLeadingValueBounds,
};
delete terminal.leadingValueBounds.arithmeticNodes;
await writeFile(output,JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
console.log('12 exact original stages; Qb, Qp, and wait replayed; Xcut, X0, XL, Xplus, Xb pinned');
