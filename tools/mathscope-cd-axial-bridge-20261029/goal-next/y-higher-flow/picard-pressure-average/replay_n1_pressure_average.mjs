import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, registry, c90Path, c92Path, output] = process.argv.slice(2);
assert(output,'ORIGINAL_NAVIER_DIR ORIGINAL_REGISTRY C90_OPERANDS C92_OPERANDS NEW_JSON');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function load(path,expected) {
  const bytes = await readFile(path);
  assert.equal(sha(bytes),expected,path);
  return JSON.parse(bytes);
}
const c90SHA256 = 'c251beed8ffd1476ffab392c4aa352e47aa992b5dd3284333101fcda0663c84d';
const c92SHA256 = 'ff210cc2c4c3c5ed8f66104d7eeedc9acabf4641a7f98ddcf33609e3532d4fd8';
const c90 = await load(c90Path,c90SHA256), c92 = await load(c92Path,c92SHA256);
const pins = {...c90.sourcePins,
  'actual-continuation-exact-identities.mjs':'bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712',
  'actual-global-source-outer.mjs':'5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9',
};
for (const [path,pin] of Object.entries(pins))
  assert.equal(sha(await readFile(resolve(runtime,path))),pin,path);
const original = await load(registry,c90.registrySHA256);
const sourceUrl = (path) => pathToFileURL(resolve(runtime,path));
const source = await import(sourceUrl('actual-residual-order-induction-source.mjs'));
const {sourceGraphRationalIdentity} = await import(sourceUrl('actual-continuation-exact-identities.mjs'));
const live = source.prepareActualOrderInduction({order:1,maxNodes:2000000});
assert.ok(source.assertActualOrderInduction(live));
const {G,bootstrap,records} = live;
const {X:formalX,eta} = bootstrap.constants;
assert.deepEqual(G.picardSystems,JSON.parse(original.base.picard).slice(0,2));
assert.equal(sha(JSON.stringify(G.nodes)),c90.originalPrefixSHA256);
assert.equal(G.source.parameterExpressionSHA256,c90.parameterExpressionSHA256);

const z = G.zero, o = G.one, {A,j0:j,Lambda,P0:P} = G.core;
assert.equal(P,G.pressure.pressure);
const power = G.parameter('Pstar'), q = (x,y=1) => G.q(x,y);
const atAxis = (v) => G.substitute(v,eta,z);
const etaSecondAtAxis = (v) => atAxis(G.derivative(G.derivative(v,eta),eta));
const p00 = atAxis(P), p2 = etaSecondAtAxis(P);
const expected = G.add(q(-12),G.mul(q(-1,2),p2),G.mul(q(2),A,p00)), N = G.neg(expected);
const scale = q(1048576);
const {auxiliary:norm} = records[1].norm;
const a = G.sqrt(norm.radialDomain), C = norm.C, s = norm.strip;
const xi = G.div(G.mul(a,j,G.pow(s,2)),G.mul(G.add(o,a),scale,G.pow(G.add(o,C),3))), X = G.pow(xi,2);
const e = G.div(G.mul(s,j),G.mul(scale,G.add(o,C))), XSmall = G.pow(G.mul(s,xi),2);
const xiP = G.mul(xi,G.div(a,G.add(o,a))), XP = G.pow(xiP,2), YP = G.mul(Lambda,XP);
const ids = [z,o,A,j,Lambda,scale,a,C,s,xi,X,e,XSmall,xiP,XP,YP,power,p00,p2,expected,N];
const truth = expression => {
  const proof = sourceGraphRationalIdentity(G,expression);
  return {pass:proof.pass,monomials:proof.monomials,atomCount:proof.actualAtomicOperandCount,
    unmatched:proof.residual?.slice(0,3)};
};
const pressureStages = G.pressure.stages.map(stage => {
  const d0 = atAxis(stage.integrand), d2 = etaSecondAtAxis(stage.integrand);
  const expectedD2 = G.mul(q(-4),stage.theta,d0);
  const value = atAxis(stage.integral), second = etaSecondAtAxis(stage.integral);
  const densityIdentity = truth(G.sub(d2,expectedD2));
  assert.ok(densityIdentity.pass,stage.id);
  ids.push(value,second,stage.theta,d0,d2,expectedD2,stage.upper);
  return {name:stage.id,theta:stage.theta,thetaNode:G.nodes[stage.theta],d0,d2,expectedD2,
    densityIdentity,value,second,variable:stage.variable,lower:stage.lower,upper:stage.upper};
});
const prefix = atAxis(G.pressure.initialInfinitePrefix), prefix2 = etaSecondAtAxis(G.pressure.initialInfinitePrefix);
const tail = atAxis(G.pressure.terminalInfiniteTail), tail2 = etaSecondAtAxis(G.pressure.terminalInfiniteTail);
const {Qb,Qp,terminalWait} = G.outer.roots;
const waitLog = G.log(G.div(Qb,Qp)), h = G.parameter('h');
assert.equal(terminalWait,G.div(waitLog,G.sub(o,h)));
assert.equal(terminalWait,pressureStages.find(row=>row.name==='wait').upper);
ids.push(prefix,prefix2,tail,tail2);
const expectedP00 = G.mul(q(-1,2),G.pow(power,2),G.add(prefix,...pressureStages.map(row=>row.value),tail));
const expectedP2 = G.mul(q(-1,2),G.pow(power,2),G.add(prefix2,...pressureStages.map(row=>row.second),tail2));
assert.ok(truth(G.sub(p00,expectedP00)).pass);
assert.ok(truth(G.sub(p2,expectedP2)).pass);
const rows = [];
for (const kind of ['raw','auxiliary']) {
  const r = records[1][kind], sys = G.picardSystems[r.system];
  const f3 = sys.forcing[3], f3AtAxis = atAxis(G.substitute(f3,sys.xi,z));
  const derivativeAtAxis = atAxis(G.substitute(G.derivative(f3,sys.xi),sys.xi,z));
  const originalAxisKnown = kind==='raw' ? atAxis(bootstrap.roots.actualN1PiaxisSlope)
      : atAxis(G.substitute(r.pKnown,formalX,z));
  const identity = truth(G.sub(originalAxisKnown,expected));
  const forcingIdentity = truth(G.sub(derivativeAtAxis,G.mul(q(2),originalAxisKnown)));
  assert.ok(identity.pass,JSON.stringify(identity));
  assert.ok(forcingIdentity.pass,JSON.stringify(forcingIdentity));
  assert.equal(f3AtAxis,z);
  const [t0,t1] = G.picardPartialSum(r.system,2).terms;
  assert.equal(t0[0],z);
  assert.equal(t1[3],z);
  assert.deepEqual(sys.A1[3],[z,z,z,z,z,z]);
  assert.deepEqual(sys.A0[3].slice(1),[z,z,z,z,z]);
  const k = G.picardEven(r.system,2,formalX,eta);
  assert.equal(k,c92.rows.find(row=>row.kind===kind).formalK);
  const at = (body,x,y) => G.simultaneousSubstitute(body,[formalX,eta],[x,y]);
  const calls = {
    Pi:at(r.Pi,XP,z), dXPi:at(G.derivative(r.Pi,formalX),XP,z),
    dXK:at(G.derivative(k,formalX),X,e), dEtaK:at(G.derivative(k,eta),XSmall,z),
  };
  ids.push(r.Pi,k,originalAxisKnown,derivativeAtAxis,...Object.values(calls));
  rows.push({kind,system:r.system,originalPi:r.Pi,originalK:k,forcing:f3,xiFormal:sys.xi,A0:sys.A0[3],
    A1:sys.A1[3],diag:sys.diagonal,f3AtAxis,derivativeAtAxis,originalAxisKnown,identity,forcingIdentity,
    pressureTerm0:t0[3],pressureTerm1:t1[3],priorF0Term0:t0[0],calls,originalCore:records[1].coreAgreement.domain});
}
const reached = new Set(), stop = new Set([a,C,s]), atoms = [];
while (ids.length) {
  const id = ids.pop();
  if (reached.has(id)) continue;
  reached.add(id);
  const {op,args} = G.nodes[id];
  if (stop.has(id)||['rational','source_parameter','coordinate'].includes(op)) continue;
  if (['definite_integral','exp','source_step_derivative','log_positive'].includes(op)) atoms.push(id);
  else if (op==='integer_power') ids.push(args[0]);
  else if (['add','multiply','inverse'].includes(op)) ids.push(...args);
  else if (op==='actual_background_even_profile') ids.push(...args.slice(2,4));
  else throw Error(['Unexpected scalar pressure operand',id,op,JSON.stringify(args)].join(' '));
}
const result = {
  schema:'MathScope.C94.OriginalN1PressureAverageDerivativeOperands/1',c90SHA256,c92SHA256,
  registrySHA256:c90.registrySHA256,profileSHA256:c90.parameterExpressionSHA256,
  prefixSHA256:c90.originalPrefixSHA256,ids:{z,o,A,j,Lambda,scale,a,C,s,xi,X,e,XSmall,xiP,XP,YP,power,p00,p2,expected,N},
  profileScalars:Object.fromEntries(['T','h','lambda','Tf','co','BOuter','Pstar','logP']
    .map(key=>[key,G.source.parametersExactExpressions[key]])),
  pressure:{root:P,stages:pressureStages,prefix,prefix2,tail,tail2,wait:{Qb,Qp,terminalWait,waitLog}}, rows,
  atomIds:atoms.sort((a,b)=>a-b),
  nodes:[...reached].sort((a,b)=>a-b).map(id=>[id,G.nodes[id]]),
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
for (const row of rows) console.log(JSON.stringify(row));
