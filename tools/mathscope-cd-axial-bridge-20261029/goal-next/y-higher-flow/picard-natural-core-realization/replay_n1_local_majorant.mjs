import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime,registry,c90path,output]=process.argv.slice(2);
assert(output,'ORIGINAL_NAVIER ORIGINAL_REGISTRY C90_OPERANDS NEW_JSON');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async(path,hash)=>{
  const bytes=await readFile(path);
  assert.equal(sha(bytes),hash,path);
  return JSON.parse(bytes);
};
const c90SHA='c251beed8ffd1476ffab392c4aa352e47aa992b5dd3284333101fcda0663c84d';
const c90=await read(c90path,c90SHA);
const pins={...c90.sourcePins,
  'actual-continuation-exact-order-two-source.mjs':'1ebf8b2b6f1df054a06309c5dc8695f2f3a867733544ab012f206bfed2969dd0',
  'actual-continuation-exact-identities.mjs':'bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712',
};
for(const [file,hash] of Object.entries(pins))assert.equal(sha(await readFile(resolve(runtime,file))),hash);
const url=name=>pathToFileURL(resolve(runtime,name));
const source=await import(url('actual-residual-order-induction-source.mjs'));
const {buildActualOmegaCoefficientOverX,sourceScaledOperators}=await import(url('actual-continuation-exact-order-two-source.mjs'));
const {sourceGraphRationalIdentity}=await import(url('actual-continuation-exact-identities.mjs'));
const original=await read(registry,c90.registrySHA256);
const live=source.prepareActualOrderInduction({order:1,maxNodes:2000000});
assert.ok(source.assertActualOrderInduction(live));
const {G,bootstrap,records}=live;
assert.equal(sha(JSON.stringify(G.nodes)),c90.originalPrefixSHA256);
assert.deepEqual(G.picardSystems,JSON.parse(original.base.picard).slice(0,2));
const {X,eta}=bootstrap.constants, {A,D,d,L,h}=G.core, q=(a,b=1)=>G.q(a,b);
const aux=records[1].auxiliary, actual=G.picardSystems[0], auxiliary=G.picardSystems[1];
const norm=records[1].norm.auxiliary, leading=records[0].auxiliary;
const {F,U,v}=leading, fields={F,U,v};
const {Z}=sourceScaledOperators(G,X,eta);
const lambda=G.mul(q(2),h), b=G.neg(G.add(A,q(1,2))), c=G.neg(A);
function jetRows(field) {
  const rows=[];
  for(let i=0;i<=2;i++){
    for(let j=0;j<=2-i;j++){
      let id=field;
      for(let k=0;k<i;k++)id=G.derivative(id,X);
      for(let k=0;k<j;k++)id=G.derivative(id,eta);
      rows.push({i,j,id});
      if(i*j){
        const reversed=G.derivative(G.derivative(field,eta),X);
        if(reversed!==id)rows.push({i,j,id:reversed});
      }
    }
  }
  return rows;
}
const leadingJets=Object.fromEntries(Object.entries(fields).map(([name,id])=>[name,jetRows(id)]));
const originalLeading=[['F',bootstrap.inner.F0,F],['U',bootstrap.inner.U0,U],['v',bootstrap.inner.v0,v]];
for(const [,old,newBody] of originalLeading){
  assert.equal(G.nodes[old].op,'smooth_piecewise');
  assert.deepEqual(G.nodes[old].args.slice(0,4),[X,G.parameter('Xa'),bootstrap.inner.aSquared,newBody]);
}

const atXi=(id,system)=>G.substitute(id,X,G.pow(system.xi,2));
assert.deepEqual(aux.rawMatrix0.map(row=>row.map(id=>atXi(id,auxiliary))),auxiliary.A0);
assert.deepEqual(aux.rawMatrix1.map(row=>row.map(id=>atXi(id,auxiliary))),auxiliary.A1);
assert.deepEqual(aux.rawForcing.map(id=>atXi(id,auxiliary)),auxiliary.forcing);
assert.deepEqual(auxiliary.diagonal,actual.diagonal);
assert.deepEqual(auxiliary.zeroAxisDatum,actual.zeroAxisDatum);
assert.equal(auxiliary.tail.sourceBound,norm.C);
assert.equal(auxiliary.tail.solutionStrip,norm.strip);
assert.deepEqual(auxiliary.radialDomain,[G.zero,G.sqrt(norm.radialDomain)]);
assert.equal(norm.C,G.mul(q(2),G.add(norm.matrixBound,...norm.forcingBounds)));
const matrixGroups=r=>[...r.matrix0.flat(),...r.matrix1.flat(),...r.rawForcing];
const registered=s=>[...s.A0.flat(),...s.A1.flat(),...s.forcing];
const same=(a,b,atoms=[])=>sourceGraphRationalIdentity(G,G.sub(a,b),{atomicNodes:atoms}).pass;

// Bind the retained standalone body to the same kernel with its original
// leading fields, then replace only the branches known on the strict core.
const {F0:f0,U0:u0,v0}=bootstrap.inner;
const omega=buildActualOmegaCoefficientOverX(G,{order:0,X,eta,U:[u0],v:[v0]}).value;
const actualAtoms=[f0,u0,v0].flatMap(id=>jetRows(id).map(row=>atXi(row.id,actual)));
assert(same(atXi(omega,actual),atXi(bootstrap.inner.omegaOverX,actual),actualAtoms));
const k0=source.actualInductionLinearKernel(G,{X,eta,xi:actual.xi,lambda,F0:f0,U0:u0,v0,
  pKnown:G.mul(q(-1,2),bootstrap.inner.omegaOverX),Htheta:G.neg(Z(G.sub(b,D),Z(b,f0))),
  Hz:G.neg(Z(G.sub(c,D),Z(c,u0)))});
const comparisons=[];
for(const [i,id] of matrixGroups(k0).entries()){
  const proof=same(atXi(id,actual),registered(actual)[i],actualAtoms);
  assert(proof, 'standalone '+i);
  comparisons.push(proof);
}
const core=source.actualInductionLinearKernel(G,{X,eta,xi:actual.xi,lambda,F0:F,U0:U,v0:v,
  pKnown:aux.pKnown,Htheta:aux.Htheta,Hz:aux.Hz});
const naturalOmega=buildActualOmegaCoefficientOverX(G,{order:0,X,eta,U:[U],v:[v]}).value;
assert(same(aux.pKnown,G.mul(q(-1,2),naturalOmega)));
assert(same(aux.Htheta,G.neg(Z(G.sub(b,D),Z(b,F)))));
assert(same(aux.Hz,G.neg(Z(G.sub(c,D),Z(c,U)))));
const branchComparisons=[];
for(const [i,id] of matrixGroups(core).entries()){
  const other=G.substitute(registered(auxiliary)[i],auxiliary.xi,actual.xi);
  const proof=same(atXi(id,actual),other);
  assert(proof,'core '+i);
  branchComparisons.push(proof);
}

const retained=[
  ...aux.rawMatrix0.flat(),...aux.rawMatrix1.flat(),...aux.rawForcing,aux.pKnown,aux.Htheta,aux.Hz,
  norm.C,norm.strip,norm.sourceStrip,norm.previousStrip,norm.radialDomain,norm.radius,norm.exponentBound,
  norm.lowerMixedRadialBounds[0],norm.lowerRegularVBounds[0],norm.e1,norm.e2,norm.matrixBound,
  ...norm.forcingBounds,norm.leadingBase.naturalBase,norm.leadingBase.gBound,bootstrap.inner.delta,
];
const held=new Set([X,eta,aux.xi,A,D,d,L,G.inv(L),h,
  ...Object.values(leadingJets).flat().map(row=>row.id)]);
function closure(initial,stops,allowOpaque) {
  const ids=initial.slice(), reached=new Set();
  while(ids.length){
    const id=ids.pop();
    if(reached.has(id))continue;
    reached.add(id);
    const {op,args}=G.nodes[id];
    if(stops.has(id)||['rational','source_parameter','coordinate'].includes(op))continue;
    if(op==='integer_power')ids.push(args[0]);
    else if(['add','multiply','inverse','maximum','exp'].includes(op))ids.push(...args);
    else if(allowOpaque.has(op))continue;
    else throw Error([id,op,JSON.stringify(args)].join(' '));
  }
  return reached;
}
const majorantRoots=[...aux.rawMatrix0.flat(),...aux.rawMatrix1.flat(),...aux.rawForcing,aux.pKnown,aux.Htheta,aux.Hz];
const estimateNodes=closure(majorantRoots,held,new Set());
const scalarNodes=closure(retained.slice(majorantRoots.length),new Set(),new Set());
const all=new Set([...estimateNodes,...scalarNodes,...held]);
const result={
  schema:'MathScope.C96.OriginalN1LocalMajorantOperands/1',c90SHA,sourcePins:pins,
  registrySHA:c90.registrySHA256,prefixSHA:c90.originalPrefixSHA256,profileSHA:c90.parameterExpressionSHA256,
  profileScalars:Object.fromEntries(['Md','T','logP','Pstar','lambda','h','K','j0','sigmaStar','rho','Q','Lambda','CSelected','logCSelected','BRefUpper']
    .map(key=>[key,G.source.parametersExactExpressions[key]])),
  reference:{X,eta,xi:aux.xi,A,D,d,L,invL:G.inv(L),h,leadingJets},
  exactCore:{actual:0,auxiliary:1,leading:originalLeading,guard:[G.zero,G.parameter('Xa')],
    originalMatrixAndForceEqualities:comparisons.length,coreMatrixAndForceEqualities:branchComparisons.length,
    upperDerivativeMask:auxiliary.A1.map(row=>row.map(id=>id!==G.zero)),diagonal:auxiliary.diagonal},
  estimates:{A0:aux.rawMatrix0,A1:aux.rawMatrix1,forcing:aux.rawForcing,pKnown:aux.pKnown,Htheta:aux.Htheta,Hz:aux.Hz},
  norm:{C:norm.C,s:norm.strip,sourceStrip:norm.sourceStrip,omega:norm.previousStrip,
    aSquared:norm.radialDomain,radius:norm.radius,e1:norm.e1,e2:norm.e2,E:norm.exponentBound,
    H:norm.lowerMixedRadialBounds[0],V:norm.lowerRegularVBounds[0],
    matrix:norm.matrixBound,forcing:norm.forcingBounds,leadingBase:norm.leadingBase.naturalBase,
    gBound:norm.leadingBase.gBound,delta:bootstrap.inner.delta},
  nodes:[...all].sort((x,y)=>x-y).map(id=>[id,G.nodes[id]]),
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({standalone:comparisons.length,strictCore:branchComparisons.length,
  estimateNodes:estimateNodes.size,scalarNodes:scalarNodes.size,C:norm.C}));
