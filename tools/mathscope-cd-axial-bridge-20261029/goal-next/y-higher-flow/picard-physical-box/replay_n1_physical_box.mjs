import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime,n4registry,c90path,c94path,output] = process.argv.slice(2);
assert(output,'ORIGINAL_NAVIER_DIR ORIGINAL_N4_REGISTRY C90_OPERANDS C94_INTERVALS NEW_JSON');
const sha = b=>createHash('sha256').update(b).digest('hex');
async function pinned(path,hash) {
  const bytes=await readFile(path);
  assert.equal(sha(bytes),hash,path);
  return JSON.parse(bytes);
}
const c90SHA='c251beed8ffd1476ffab392c4aa352e47aa992b5dd3284333101fcda0663c84d';
const c94SHA='18f245b4b9b463052aab21ebebf7583c66f60f46b02a668a80a86560fedc5c9c';
const c90=await pinned(c90path,c90SHA), c94=await pinned(c94path,c94SHA);
const pins={...c90.sourcePins,'actual-continuation-exact-order-one.mjs':'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72'};
for (const [file,hash] of Object.entries(pins))
  assert.equal(sha(await readFile(resolve(runtime,file))),hash,file);
const original=await pinned(n4registry,c90.registrySHA256);
const source=await import(pathToFileURL(resolve(runtime,'actual-residual-order-induction-source.mjs')));
const live=source.prepareActualOrderInduction({order:1,maxNodes:2000000});
assert.ok(source.assertActualOrderInduction(live));
const {G,records,bootstrap}=live;
assert.deepEqual(G.picardSystems,JSON.parse(original.base.picard).slice(0,2));
assert.equal(sha(JSON.stringify(G.nodes)),c90.originalPrefixSHA256);
const {X:formalX,eta:formalEta}=bootstrap.constants;
const {A,D,h,j0:j,Lambda,CSelected}=G.core;
const z=G.zero,o=G.one,q=(n,d=1)=>G.q(n,d),B=q(1048576);
const norm=records[1].norm.auxiliary;
const a=G.sqrt(norm.radialDomain),C=norm.C,s=norm.strip;
const xi=G.div(G.mul(a,j,G.pow(s,2)),G.mul(G.add(o,a),B,G.pow(G.add(o,C),3)));
const E=G.div(G.mul(s,j),G.mul(B,G.add(o,C)));
const M=G.mul(G.inv(CSelected),G.pow(G.div(Lambda,j),2));
const aa=G.div(a,G.add(o,a)), mm=G.div(M,G.add(o,M));
const xiAll=G.mul(xi,aa,mm), Eall=G.mul(E,aa,mm);
const EF=G.div(G.mul(s,mm),G.mul(B,G.add(o,C)));
const EP=G.div(G.mul(s,aa),G.mul(B,G.add(o,C)));
const s0=q(31,32), eta0=G.div(Eall,q(4)), R=xiAll;
const Z=G.mul(G.exp(G.mul(D,G.log(s0))),eta0), T=G.mul(s0,G.sub(o,G.pow(eta0,2)));
const xp=G.div(G.pow(R,2),G.mul(q(2),s0)), Y=G.mul(Lambda,xp);
const physicalRadialChain=G.div(R,s0);
const r=records[1].raw;
const k=G.picardEven(r.system,2,formalX,formalEta);
assert.equal(r.average,G.add(r.U,k));
const orderOne=bootstrap.orderOne;
assert.equal(orderOne.Pi1,50558);
assert.equal(r.Pi,c94.actualPressureProfile);
const early={
  F:[r.F,orderOne.F1],U:[r.U,orderOne.U1],Pi:[r.Pi,orderOne.Pi1],
  K:[k,orderOne.M1overX],Xkeep:orderOne.Xkeep,X0:orderOne.X0,
};
const b=[early.F[1],early.U[1],early.Pi[1],early.K[1]];
const cutoffHeads=[];
for (const id of b) {
  cutoffHeads.push([id,G.nodes[id]]);
  if (G.nodes[id].op==='add') cutoffHeads.push(...G.nodes[id].args.map(i=>[i,G.nodes[i]]));
}
const ids=[z,o,A,D,h,j,Lambda,CSelected,a,C,s,B,xi,E,M,aa,mm,xiAll,Eall,EF,EP,s0,eta0,R,Z,T,xp,Y,physicalRadialChain];
const calls=[];
for (const raw of [r.F,r.U,k,r.Pi]) {
  const [system,component]=G.nodes[raw].args;
  const derivative=G.derivative(raw,formalX);
  const at=arg=>G.simultaneousSubstitute(arg,[formalX,formalEta],[xp,eta0]);
  const value=at(raw), dX=at(derivative);
  assert.equal(value,G.picardEven(system,component,xp,eta0,0,0));
  assert.equal(dX,G.picardEven(system,component,xp,eta0,1,0));
  const dR=G.mul(physicalRadialChain,dX);
  ids.push(raw,derivative,value,dX,dR);
  calls.push({system,component,raw,derivative,value,dX,dR});
}
const reached=new Set(), opaque=new Set([a,C,s]);
while (ids.length) {
  const id=ids.pop();
  if(reached.has(id))continue;
  reached.add(id);
  const {op,args}=G.nodes[id];
  if(opaque.has(id)||['rational','coordinate','source_parameter'].includes(op))continue;
  if(op==='integer_power')ids.push(args[0]);
  else if(['add','multiply','inverse','exp','log_positive'].includes(op))ids.push(...args);
  else if(op==='actual_background_even_profile')ids.push(...args.slice(2,4));
  else throw Error([id,op,JSON.stringify(args)].join(' '));
}
const outputJson={
  schema:'MathScope.C95.OriginalN1PhysicalCoreOperands/1',
  c90SHA,c94SHA,registrySHA:c90.registrySHA256,originalPrefixSHA:c90.originalPrefixSHA256,
  profileSHA:c90.parameterExpressionSHA256,pins,early,cutoffHeads,
  ids:{z,o,A,D,h,j,Lambda,CSelected,a,C,s,B,xi,E,M,aa,mm,xiAll,Eall,EF,EP,s0,eta0,R,Z,T,xp,Y,physicalRadialChain},
  calls,nodes:[...reached].sort((a,b)=>a-b).map(i=>[i,G.nodes[i]]),
};
await writeFile(output,JSON.stringify(outputJson,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({components:calls.length,early,calls,coordinate:{R,Z,T,xp,eta0}}));
