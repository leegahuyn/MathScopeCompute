import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, registry, c90Path, c91Path, output] = process.argv.slice(2);
assert(output, 'ORIGINAL_NAVIER_DIR ORIGINAL_FUNCTION_REGISTRY C90_OPERANDS C91_OPERANDS NEW_JSON');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function load(path, expected) {
  const blob = await readFile(path);
  assert.equal(sha(blob),expected,path);
  return JSON.parse(blob);
}
const c90SHA256 = 'c251beed8ffd1476ffab392c4aa352e47aa992b5dd3284333101fcda0663c84d';
const c91SHA256 = '991b9ce42da0b6bbda6f076df1818a4b194dbb5343b04a2ecd00b50f14104a3c';
const c90 = await load(c90Path,c90SHA256);
const c91 = await load(c91Path,c91SHA256);
for (const [file, pin] of Object.entries(c90.sourcePins))
  assert.equal(sha(await readFile(resolve(runtime,file))),pin,file);
const original = await load(registry,c90.registrySHA256);
const source = await import(pathToFileURL(resolve(runtime,'actual-residual-order-induction-source.mjs')));
const live = source.prepareActualOrderInduction({order:1,maxNodes:2000000});
assert.ok(source.assertActualOrderInduction(live));
const {G,bootstrap,records} = live;
const {X:formalX, eta} = bootstrap.constants;
assert.deepEqual(G.picardSystems,JSON.parse(original.base.picard).slice(0,2));
assert.equal(G.nodes.length,c90.originalPrefixNodes);
assert.equal(sha(JSON.stringify(G.nodes)),c90.originalPrefixSHA256);
assert.equal(G.source.parameterExpressionSHA256,c90.parameterExpressionSHA256);

const z = G.zero, o = G.one;
const {A,D,h,j0:j,Lambda,CSelected,sigmaStar:sigma,g,zeta} = G.core;
const g0 = G.substitute(g,eta,z), zeta0 = G.substitute(zeta,eta,z);
const zetaPrime0 = G.derivativeAt(zeta,eta,z);
const b = G.neg(G.add(A,G.q(1,2)));
const gSecond0 = G.derivativeAt(G.derivative(g,eta),eta,z);
const M = G.mul(G.inv(CSelected),G.pow(G.div(Lambda,j),2));
const scale = G.q(1048576);
const {auxiliary:norm} = records[1].norm;
const a = G.sqrt(norm.radialDomain), C = norm.C, s = norm.strip;
const xi = G.div(G.mul(a,j,G.pow(s,2)),G.mul(G.add(o,a),scale,G.pow(G.add(o,C),3)));
const X = G.pow(xi,2);
const e = G.div(G.mul(s,j),G.mul(scale,G.add(o,C)));
const xiF = G.mul(xi,G.div(M,G.add(o,M))), XF = G.pow(xiF,2), YF = G.mul(Lambda,XF);
const ids = [z,o,A,D,h,j,Lambda,CSelected,sigma,g0,zeta0,zetaPrime0,b,gSecond0,M,scale,a,C,s,xi,X,e,xiF,XF,YF];
const rows = [];
for (const kind of ['raw','auxiliary']) {
  const r = records[1][kind], sys = G.picardSystems[r.system];
  const f4 = sys.forcing[4], axis = G.substitute(f4,sys.xi,z);
  const f4Axis = G.substitute(axis,eta,z);
  const slope = kind==='raw' ? G.substitute(bootstrap.roots.actualN1FaxisSlope,eta,z)
                            : G.div(f4Axis,G.q(8));
  const initialF = kind==='raw' ? sys.sourceLeading.F0 : sys.lowerOrders[0].F;
  const leadingAtAxis = G.substitute(G.substitute(initialF,sys.xi,z),eta,z);
  const avgPart = G.picardEven(r.system,2,formalX,eta);
  assert.equal(r.average,G.add(r.U,avgPart));
  const negOne = G.q(-1);
  assert.deepEqual(sys.A0[0],[z,z,z,z,o,z]);
  assert.deepEqual(sys.A0[2],[z,z,z,z,z,negOne]);
  assert.deepEqual(sys.A1[0],[z,z,z,z,z,z]);
  assert.deepEqual(sys.A1[2],[z,z,z,z,z,z]);
  assert.equal(sys.forcing[0],z);
  assert.equal(sys.forcing[2],z);
  const at = (body,x,y) => G.simultaneousSubstitute(body,[formalX,eta],[x,y]);
  const F = at(r.F,XF,z);
  const dXF = at(G.derivative(r.F,formalX),XF,z);
  const K = at(avgPart,X,e);
  const partial = G.picardPartialSum(r.system,2);
  assert.equal(partial.terms[0][0],z);
  ids.push(r.F,avgPart,F,dXF,K,f4Axis,slope,leadingAtAxis,negOne);
  rows.push({kind,system:r.system,formalF:r.F,formalK:avgPart,originalForcing4:f4,f4Axis,slope,leadingAtAxis,
    calls:{F,dXF,K},diagonal:sys.diagonal,sourceCore:records[1].coreAgreement.domain,
    A0Rows:[sys.A0[0],sys.A0[2]],A1Rows:[sys.A1[0],sys.A1[2]],forcingRows:[sys.forcing[0],sys.forcing[2]],
    firstTwoF:partial.terms.map(w=>w[0])});
}
const reached = new Set();
const stop = new Set([a,C,s]);
while (ids.length) {
  const id = ids.pop();
  if (reached.has(id)) continue;
  reached.add(id);
  const {op,args} = G.nodes[id];
  if (stop.has(id)||['rational','source_parameter','coordinate'].includes(op)) continue;
  if (op==='integer_power') ids.push(args[0]);
  else if (['add','multiply','inverse','exp','log_positive','sqrt_positive','ceiling','maximum'].includes(op))
    ids.push(...args);
  else if (op==='actual_background_even_profile') ids.push(...args.slice(2,4));
  else throw Error(['Unexpected angular or average operand',id,op,JSON.stringify(args)].join(' '));
}
const profileKeys = ['sigmaStar','CSelected','logCSelected','Q','K','Lambda','h','j0','Xa'];
const profileScalars = Object.fromEntries(profileKeys.map(key=>[key,G.source.parametersExactExpressions[key]]));
const result = {
  schema:'MathScope.C92.OriginalN1AngularAverageOperands/1', c90SHA256,c91SHA256,
  registrySHA256:c90.registrySHA256,prefixSHA256:c90.originalPrefixSHA256,
  profileSHA256:c90.parameterExpressionSHA256,profileScalars,
  ids:{z,o,A,D,h,j,Lambda,CSelected,sigma,g0,zeta0,zetaPrime0,b,gSecond0,M,scale,a,C,s,xi,X,e,xiF,XF,YF},
  rows,nodes:[...reached].sort((u,v)=>u-v).map(id=>[id,G.nodes[id]]),
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
for (const row of rows) console.log(JSON.stringify(row));
