import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime,registry,previous,output]=process.argv.slice(2);
assert(output,'ORIGINAL_RUNTIME ORIGINAL_REGISTRY C97_OPERANDS NEW_JSON');
const digest=value=>createHash('sha256').update(value).digest('hex');
const load=async(path,sha)=>{
  const raw=await readFile(path);
  assert.equal(digest(raw),sha,path);
  return JSON.parse(raw);
};
const previousSHA='d43384e8f8cb1fc2204595298b50e48c7247dc68677a2670e0e6f284f2223052';
const earlier=await load(previous,previousSHA);
for(const [file,sha] of Object.entries(earlier.sourcePins))
  assert.equal(digest(await readFile(resolve(runtime,file))),sha,file);
const archived=await load(registry,earlier.registrySHA);
const src=await import(pathToFileURL(resolve(runtime,'actual-residual-order-induction-source.mjs')));
const live=src.prepareActualOrderInduction({order:1,maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(live));
const {G,bootstrap,records}=live;
assert.equal(digest(JSON.stringify(G.nodes)),earlier.prefixSHA);
assert.deepEqual(G.picardSystems,JSON.parse(archived.base.picard).slice(0,2));
const actual=G.picardSystems[0],auxiliary=G.picardSystems[1];
const {X,eta}=bootstrap.constants,{inner,orderOne}=bootstrap;
const {A,D,d,L}=G.core;
const h=G.parameter('h'),Q=G.parameter('Q'),rho=G.parameter('rho'),Lam=G.parameter('Lambda');
const t1=G.parameter('t1'),Xa=G.parameter('Xa');
const z=G.zero,o=G.one,q=(a,b=1)=>G.q(a,b);
const atXi=id=>G.substitute(id,X,G.pow(actual.xi,2));
const {F0,U0,v0}=inner;
const F0node=G.nodes[F0],U0node=G.nodes[U0],v0node=G.nodes[v0];
for(const node of [F0node,U0node,v0node]){
  assert.equal(node.op,'smooth_piecewise');
  assert.deepEqual(node.args.slice(0,3),[X,Xa,inner.aSquared]);
}
assert.equal(F0node.args[3],records[0].auxiliary.F);
assert.equal(U0node.args[3],records[0].auxiliary.U);
assert.equal(v0node.args[3],records[0].auxiliary.v);
const lambda1=G.mul(q(2),h),b0=G.neg(G.add(A,q(1,2))),c0=G.neg(A);
const beta=G.add(b0,lambda1),gamma=G.add(c0,lambda1),pressureExponent=G.add(G.mul(q(-2),A),lambda1);
assert.equal(lambda1,inner.lambda1);
const Hf=G.add(F0,G.mul(X,G.derivative(F0,X))),Hu=G.mul(X,G.derivative(U0,X));
const Z=(e,u)=>G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(e,u),G.mul(X,G.derivative(u,X)))),G.mul(d,G.derivative(u,eta))),L);
const ZF=Z(b0,F0),ZU=Z(c0,U0);
const ZZF=Z(G.sub(b0,D),ZF),ZZU=Z(G.sub(c0,D),ZU);
const vX=G.derivative(v0,X),vXX=G.derivative(vX,X);
const vEta=G.derivative(v0,eta),vPlusXvX=G.add(v0,G.mul(X,vX));
const omega=G.add(G.div(G.add(G.mul(D,eta,vEta),vPlusXvX),L),
  G.mul(v0,G.add(G.mul(q(1,2),v0),G.mul(X,vX))),
  G.div(G.mul(U0,G.sub(G.mul(d,vEta),G.mul(q(2),eta,vPlusXvX))),L),
  G.mul(q(-2),G.add(G.mul(q(2),vX),G.mul(X,vXX))));
assert.equal(omega,inner.omegaOverX);
const pKnown=G.mul(q(-1,2),omega),xi=actual.xi;
const diagonalTerm=G.add(G.div(xi,L),G.mul(xi,v0),G.div(G.mul(q(-2),eta,xi,U0),L));
const matrix0=[
  [z,z,z,z,o,z],[z,z,z,z,z,o],[z,z,z,z,z,q(-1)],
  [G.mul(q(4),xi,F0),z,z,z,z,z],
  [G.mul(q(2),G.add(G.div(G.mul(beta,G.sub(G.mul(q(2),eta,U0),o)),L),v0)),
    G.add(G.div(G.mul(q(4),eta,G.sub(A,lambda1),Hf),L),G.mul(q(2),ZF)),
    G.div(G.mul(q(-4),eta,G.add(D,lambda1),Hf),L),z,diagonalTerm,z],
  [G.div(G.mul(q(-8),eta,X,F0),L),
    G.add(G.div(G.mul(q(2),gamma,G.sub(G.mul(q(2),eta,U0),o)),L),
      G.div(G.mul(q(4),eta,G.sub(A,lambda1),Hu),L),G.mul(q(2),ZU)),
    G.div(G.mul(q(-4),eta,G.add(D,lambda1),Hu),L),G.div(G.mul(q(4),pressureExponent,eta),L),z,diagonalTerm],
];
const same=G.div(G.mul(q(-2),d,Hf),L),zeros=()=>Array(6).fill(z);
const matrix1=[zeros(),zeros(),zeros(),zeros(),
  [G.div(G.mul(q(2),G.add(G.mul(D,eta),G.mul(d,U0))),L),same,same,z,z,z],
  [z,G.div(G.mul(q(2),G.add(G.mul(D,eta),G.mul(d,U0),G.neg(G.mul(d,Hu)))),L),
    G.div(G.mul(q(-2),d,Hu),L),G.div(G.mul(q(2),d),L),z,z],
];
const force=[z,z,z,G.mul(q(2),xi,pKnown),G.mul(q(-2),ZZF),
  G.mul(q(2),G.add(G.neg(ZZU),G.div(G.mul(q(-2),eta,X,pKnown),L)))];
assert.deepEqual(matrix0.map(row=>row.map(atXi)),actual.A0);
assert.deepEqual(matrix1.map(row=>row.map(atXi)),actual.A1);
assert.deepEqual(force.map(atXi),actual.forcing);
assert.deepEqual(actual.diagonal,[0,0,2,0,3,1]);
assert.deepEqual(actual.zeroAxisDatum,Array(6).fill(z));
assert.deepEqual(actual.sourceLeading,{F0:atXi(F0),U0:atXi(U0),v0:atXi(v0),omega0OverX:atXi(omega)});

const alpha=G.sqrt(Xa),endX=inner.aSquared,end=G.sqrt(endX);
assert.equal(endX,G.mul(Xa,G.exp(G.div(t1,q(16)))));
assert.deepEqual(actual.radialDomain,[z,end]);
assert.equal(orderOne.Xkeep,G.mul(Xa,G.exp(G.div(t1,q(64)))));
assert.equal(orderOne.Xcut,G.mul(Xa,G.exp(G.div(t1,q(32)))));
const targetLoss=G.div(inner.delta,q(16));
assert.equal(inner.delta,G.div(rho,G.mul(q(1024),Q)));
const core=G.picardPartialSum(0,2);
assert.equal(core.count,2);
const recordsOut=[];
function integral(body,i){
  if(body===z)return z;
  const tau=G.fresh('C98_full_actual_collar_binder');
  return G.integral(G.mul(G.pow(G.div(tau,xi),actual.diagonal[i]),
    G.substitute(body,xi,tau)),tau,alpha,xi);
}
function rightTerms(seed){
  const term0=seed.map((u,i)=>G.add(G.mul(G.pow(G.div(alpha,xi),actual.diagonal[i]),u),
    integral(actual.forcing[i],i)));
  const term1=term0.map((_,i)=>{
    const rows=actual.A0[i].map((a,j)=>G.mul(a,term0[j]));
    actual.A1[i].forEach((a,j)=>{
      if(a!==z)rows.push(G.mul(a,G.derivative(term0[j],eta)));
    });
    return integral(G.add(...rows),i);
  });
  return {term0,term1};
}
const leftExact=actual.diagonal.map((_,i)=>G.picardRoot(1,i,alpha,eta));
const leftFinite=core.sum.map(term=>G.substitute(term,xi,alpha));
const exact=rightTerms(leftExact),finite=rightTerms(leftFinite);
for(const [i] of actual.diagonal.entries()){
  const value=G.add(finite.term0[i],finite.term1[i]);
  const probe=G.simultaneousSubstitute(value,[xi,eta],[end,z]);
  assert.deepEqual([...G.freeCoordinates(probe)],[]);
  const native=G.picardRoot(0,i,end,z),even=i<4?G.picardEven(0,i,endX,z):null;
  assert.deepEqual(G.nodes[native],{op:'actual_background_picard',args:[0,i,end,z,0]});
  if(i<4)assert.deepEqual(G.nodes[even],{op:'actual_background_even_profile',args:[0,i,endX,z,0,0]});
  recordsOut.push({i,auxSeed:leftExact[i],finiteSeed:leftFinite[i],
    actualCoreTerms:core.terms.map(term=>term[i]),exactT0:exact.term0[i],exactKT0:exact.term1[i],
    finiteT0:finite.term0[i],finiteKT0:finite.term1[i],probe,native,even});
}
const finiteClosure=new Set();
const stack=recordsOut.map(row=>row.probe);
while(stack.length){
  const id=stack.pop();
  if(finiteClosure.has(id))continue;
  finiteClosure.add(id);
  const {op,args}=G.nodes[id];
  if(['rational','source_parameter','coordinate'].includes(op))continue;
  if(['integer_power','source_step_derivative'].includes(op))stack.push(args[0]);
  else if(op==='actual_natural_series')stack.push(args[1],args[2]);
  else if(op==='actual_quadratic_root')stack.push(args[2]);
  else if(op==='actual_monotone_root')stack.push(...args.slice(1));
  else if(op==='actual_expression_partial')stack.push(G.expressionSystems[args[0]].body,...args[1]);
  else if(['add','multiply','inverse','sqrt_positive','exp','log_positive','definite_integral','smooth_piecewise'].includes(op))
    stack.push(...args);
  else throw Error('Unexpected finite endpoint operation: '+op+' at '+id);
}
const ids={X,eta,h,A,D,d,L,Q,rho,Lam,t1,Xa,alpha,endX,end,xi,delta:inner.delta,targetLoss,
  F0,U0,v0,Hf,Hu,ZF,ZU,ZZF,ZZU,omega,pKnown,Xkeep:orderOne.Xkeep,Xcut:orderOne.Xcut};
const heads=[...new Set(Object.values(ids).concat(actual.forcing,
  actual.A0.flat(),actual.A1.flat(),recordsOut.flatMap(row=>Object.values(row).flat()).filter(x=>x!==null)))];
const counts={matrixEntries:actual.A0.flat().length+actual.A1.flat().length,
  forcingEntries:force.length,exactRightEndpointCalls:recordsOut.length,
  finiteSeamTerms:core.count,finiteRightTerms:2};
const data={schema:'MathScope.C98.OriginalN1FullCommonCollarOperands/1',previousSHA,
  registrySHA:earlier.registrySHA,prefixSHA:earlier.prefixSHA,profileSHA:earlier.profileSHA,
  ids,profileExpressions:G.source.parametersExactExpressions,
  actual:{system:0,leading:actual.sourceLeading,diagonal:actual.diagonal,
    radialDomain:actual.radialDomain,A0:actual.A0,A1:actual.A1,forcing:actual.forcing},
  auxiliary:{system:1,radialDomain:auxiliary.radialDomain},
  sourceCutoffAndCompensation:{Xkeep:orderOne.Xkeep,Xcut:orderOne.Xcut,
    Xminus:orderOne.Xminus,Xplus:orderOne.Xplus},
  records:recordsOut,heads:heads.map(key=>[key,G.nodes[key]]),counts,
  finiteEndpointClosure:{nodes:finiteClosure.size,zeroFreeCoordinates:true,noPicardOrEvenOracle:true}};
await writeFile(output,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...counts,endX,end,Xkeep:orderOne.Xkeep,Xcut:orderOne.Xcut}));
