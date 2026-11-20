import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime,registry,c90path,c96path,output]=process.argv.slice(2);
assert(output,'ORIGINAL_NAVIER ORIGINAL_REGISTRY C90_OPERANDS C96_MAJORANT NEW_JSON');
const sha=b=>createHash('sha256').update(b).digest('hex');
const load=async(path,hash)=>{
  const bytes=await readFile(path);
  assert.equal(sha(bytes),hash,path);
  return JSON.parse(bytes);
};
const c90SHA='c251beed8ffd1476ffab392c4aa352e47aa992b5dd3284333101fcda0663c84d';
const c96SHA='9c44b1ca18765f406ce28cbc495056b23fd1e7f50fdcb1403b8c7e800531b26e';
const c90=await load(c90path,c90SHA),c96=await load(c96path,c96SHA);
const pins={...c90.sourcePins,
  'actual-global-source-expressions.mjs':'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
  'actual-continuation-exact-pregluing.mjs':'7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3',
};
for(const [file,hash] of Object.entries(pins))assert.equal(sha(await readFile(resolve(runtime,file))),hash,file);
const stepCode=await readFile(resolve(runtime,'actual-global-source-expressions.mjs'),'utf8');
assert(stepCode.includes('z=mul(ia,ia).map((v,k)=>-v+mul(ib,ib)[k])'));
const archived=await load(registry,c90.registrySHA256);
const src=await import(pathToFileURL(resolve(runtime,'actual-residual-order-induction-source.mjs')));
const live=src.prepareActualOrderInduction({order:1,maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(live));
const {G,bootstrap,records}=live;
assert.equal(sha(JSON.stringify(G.nodes)),c90.originalPrefixSHA256);
assert.deepEqual(G.picardSystems,JSON.parse(archived.base.picard).slice(0,2));
const {X,eta}=bootstrap.constants, {inner}=bootstrap;
const actual=G.picardSystems[0],auxiliary=G.picardSystems[1];
const z=G.zero,o=G.one,q=(a,b=1)=>G.q(a,b),B=q(1048576);
const Xa=G.parameter('Xa'),Lambda=G.parameter('Lambda'),t1=G.parameter('t1');
const C1=inner.C1, sAux=auxiliary.tail.solutionStrip, Mleft=records[1].norm.auxiliary.solutionNorm;
assert.equal(sAux,c96.solutionStrip);
const alpha=G.sqrt(Xa), yWitness=G.div(t1,q(128)), XWitness=G.mul(Xa,G.exp(yWitness));
const xiWitness=G.sqrt(XWitness), XiUpper=G.sqrt(inner.aSquared), width=G.sub(xiWitness,alpha);
const s0=G.div(sAux,q(4));
const b=G.div(G.mul(width,G.pow(s0,2)),
              G.mul(G.add(o,width),B,G.pow(G.add(o,C1),3)));
const xiEnd=G.add(alpha,b), XEnd=G.pow(xiEnd,2), YEnd=G.mul(Lambda,XEnd);
const geometric=G.div(G.mul(q(3),C1,b),s0), M0=G.add(o,Mleft);
const F0=inner.F0, U0=inner.U0, V0=inner.v0;
const F0branch=G.nodes[F0];
assert.equal(F0branch.op,'smooth_piecewise');
assert.deepEqual(F0branch.args.slice(0,3),[X,Xa,inner.aSquared]);
const [naturalBranch,activationBranch]=F0branch.args.slice(3,5);
assert.equal(naturalBranch,records[0].auxiliary.F);
const registeredRow=actual.A0[3][0];
assert.equal(registeredRow,G.mul(q(4),actual.xi,G.substitute(F0,X,G.pow(actual.xi,2))));
const liveRowAtWitness=G.simultaneousSubstitute(registeredRow,[actual.xi,eta],[xiWitness,z]);
const naturalAtWitness=G.simultaneousSubstitute(naturalBranch,[X,eta],[XWitness,z]);
const activationAtWitness=G.simultaneousSubstitute(activationBranch,[X,eta],[XWitness,z]);
const actualCompareRow=G.mul(q(4),xiWitness,activationAtWitness);
const naturalCompareRow=G.mul(q(4),xiWitness,naturalAtWitness);

// This explicit restart uses the original, unchanged A0/A1/forcing.
// Its certification as the split original integral is analytic.
const seed=[],homogeneous=[],fPart=[],first=[],second=[],calls=[];
const heads=new Map();
function record(id){heads.set(id,G.nodes[id]);return id;}
function rightIntegral(body,component) {
  if(body===z)return z;
  const tau=G.fresh('C97_original_right_radial_binder');
  const scale=G.pow(G.div(tau,actual.xi),actual.diagonal[component]);
  const integrand=G.mul(scale,G.substitute(body,actual.xi,tau));
  const integral=G.integral(integrand,tau,alpha,actual.xi);
  assert.equal(G.nodes[integral].op,'definite_integral');
  assert.deepEqual(G.nodes[integral].args.slice(1),[tau,alpha,actual.xi]);
  return record(integral);
}
for(const [i,c] of actual.diagonal.entries()){
  seed.push(record(G.picardRoot(1,i,alpha,eta)));
  homogeneous.push(record(G.mul(G.pow(G.div(alpha,actual.xi),c),seed[i])));
  fPart.push(rightIntegral(actual.forcing[i],i));
  first.push(record(G.add(homogeneous[i],fPart[i])));
}
for(let i=0;i<6;i++){
  const terms=actual.A0[i].map((id,j)=>G.mul(id,first[j]));
  actual.A1[i].forEach((id,j)=>{if(id!==z)terms.push(G.mul(id,G.derivative(first[j],eta)));});
  second.push(rightIntegral(G.add(...terms),i));
  const restarted=record(G.simultaneousSubstitute(G.add(first[i],second[i]),[actual.xi,eta],[xiEnd,z]));
  const actualCall=record(G.picardRoot(0,i,xiEnd,z));
  const value= i<4 ? record(G.picardEven(0,i,XEnd,z)) : null;
  calls.push({component:i,seed:seed[i],homogeneous:homogeneous[i],forcingIntegral:fPart[i],
    term0:first[i],term1:second[i],restarted,actualCall,evenCall:value});
}
const ids={z,o,B,X,eta,Xa,Lambda,t1,C1,sAux,Mleft,alpha,yWitness,XWitness,xiWitness,XiUpper,
  width,s0,b,xiEnd,XEnd,YEnd,geometric,M0};
const reached=new Set(), stack=Object.values(ids), stop=new Set([C1,sAux,Mleft,XiUpper]);
while(stack.length){
  const id=stack.pop();
  if(reached.has(id))continue;
  reached.add(id);
  const {op,args}=G.nodes[id];
  if(stop.has(id)||['rational','coordinate','source_parameter'].includes(op))continue;
  if(op==='integer_power')stack.push(args[0]);
  else if(['add','multiply','inverse','sqrt_positive','exp'].includes(op))stack.push(...args);
  else throw Error([id,op,JSON.stringify(args)].join(' '));
}
const result={
  schema:'MathScope.C97.OriginalN1B26RestartOperands/1',c90SHA,c96SHA,sourcePins:pins,
  registrySHA:c90.registrySHA256,prefixSHA:c90.originalPrefixSHA256,profileSHA:c90.parameterExpressionSHA256,
  ids,system:0,auxiliary:1,diagonal:actual.diagonal,registeredDomain:actual.radialDomain,
  A1mask:actual.A1.map(row=>row.map(id=>id!==z)),
  branch:{F0,U0,V0,F0branch,naturalBranch,activationBranch,registeredRow,liveRowAtWitness,
    naturalAtWitness,activationAtWitness,actualCompareRow,naturalCompareRow},
  calls,heads:[...heads],
  nodes:[...reached].sort((a,b)=>a-b).map(id=>[id,G.nodes[id]]),
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checks:calls.length,registeredRow,actualCompareRow,naturalCompareRow,XWitness,XEnd,C1}));
