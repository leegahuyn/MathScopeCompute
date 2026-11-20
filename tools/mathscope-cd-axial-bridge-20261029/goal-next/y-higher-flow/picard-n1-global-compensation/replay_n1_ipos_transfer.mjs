import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime,registry,c97path,c98folder,output]=process.argv.slice(2);
assert(output,'ORIGINAL_RUNTIME ORIGINAL_REGISTRY C97_OPERANDS C98_Y_FOLDER NEW_JSON');
const sha=value=>createHash('sha256').update(value).digest('hex');
const read=async(path,pin)=>{
  const bytes=await readFile(path);
  assert.equal(sha(bytes),pin,path);
  return JSON.parse(bytes);
};
const C97='d43384e8f8cb1fc2204595298b50e48c7247dc68677a2670e0e6f284f2223052';
const C98='4addbef308f52e5956e54cfc0e0f83d5155b5c571e2558d42056d540d1853d08';
const C98Operands='0c6a32b4641da682aba70d5ecdb1533528d1ea6c793a44ab4c767db98525551c';
const old=await read(c97path,C97);
const oldResult=await read(resolve(c98folder,'full-n1-collar.json'),C98);
const saved=await read(resolve(c98folder,'full-n1-collar-operands.json'),C98Operands);
assert.equal(oldResult.operandsSHA256,C98Operands);
const archived=await read(registry,saved.registrySHA);
const originalPins={...old.sourcePins,
  'actual-continuation-exact-order-one.mjs':'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72',
  'actual-global-primitive-kernels.mjs':'efebfbcfb124f5bed96bf13435333cb784a0d5cab319303a0244c788ce1bed59',
  'actual-continuation-exact-support.mjs':'0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98'};
for(const [name,pin] of Object.entries(originalPins))
  assert.equal(sha(await readFile(resolve(runtime,name))),pin,name);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const {prepareActualOrderInduction,assertActualOrderInduction}=await load('actual-residual-order-induction-source.mjs');
const {actualSupportOrderProof}=await load('actual-continuation-exact-support.mjs');
const {explicitPrimitiveBodyIdentity}=await load('actual-global-primitive-kernels.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const live=prepareActualOrderInduction({order:1,maxNodes:2000000});
assert.ok(assertActualOrderInduction(live));
const {G,bootstrap,records}=live,{inner,orderOne:r,constants}=bootstrap,{X,eta}=constants;
const raw=records[1].raw,system=G.picardSystems[0],xi=system.xi;
assert.equal(sha(JSON.stringify(G.nodes)),saved.prefixSHA);
assert.deepEqual(G.picardSystems,JSON.parse(archived.base.picard).slice(0,2));
assert.equal(raw.system,0);
const q=(a,b=1)=>G.q(a,b),z=G.zero,o=G.one;
const Xa=G.parameter('Xa'),t1=G.parameter('t1'),lambda=G.parameter('lambda');
const alpha=G.sqrt(Xa),a=G.sqrt(inner.aSquared),loss=G.div(inner.delta,q(16));
assert.equal(alpha,saved.ids.alpha);
assert.equal(a,saved.ids.end);
assert.equal(loss,saved.ids.targetLoss);
assert.equal(r.Xcut,saved.ids.Xcut);
assert.equal(r.Xkeep,saved.ids.Xkeep);
const core=G.picardPartialSum(0,2);
function integralRight(body,i){
  if(body===z)return z;
  const tau=G.fresh('C98_full_actual_collar_binder');
  return G.integral(G.mul(G.pow(G.div(tau,xi),system.diagonal[i]),G.substitute(body,xi,tau)),tau,alpha,xi);
}
function rightTerms(seed){
  const term0=seed.map((u,i)=>G.add(G.mul(G.pow(G.div(alpha,xi),system.diagonal[i]),u),
    integralRight(system.forcing[i],i)));
  const term1=term0.map((_,i)=>{
    const rows=system.A0[i].map((co,j)=>G.mul(co,term0[j]));
    system.A1[i].forEach((co,j)=>{if(co!==z)rows.push(G.mul(co,G.derivative(term0[j],eta)));});
    return integralRight(G.add(...rows),i);
  });
  return {term0,term1};
}
const exactSeed=system.diagonal.map((_,i)=>G.picardRoot(1,i,alpha,eta));
const finiteSeed=core.sum.map(term=>G.substitute(term,xi,alpha));
rightTerms(exactSeed);
const finite=rightTerms(finiteSeed);
const finiteFormal=[];
for(let i=0;i<6;i++){
  const value=G.add(finite.term0[i],finite.term1[i]);
  const probe=G.simultaneousSubstitute(value,[xi,eta],[a,z]);
  assert.equal(probe,oldResult.finiteEndpointApproximations[i]);
  assert.equal(G.picardRoot(0,i,a,z),oldResult.nativeEndpointCalls[i]);
  if(i<4)assert.equal(G.picardEven(0,i,inner.aSquared,z),saved.records[i].even);
  finiteFormal.push(value);
}

const support=actualSupportOrderProof(bootstrap.completedOrderOne);
assert.ok(support.pass);
assert.ok(support.expressionChecks.allEndpointsIndependentOfEta);
assert.deepEqual(bootstrap.completedOrderOne.program.support.orderOneStress,[r.Xminus,r.Xb]);
const kappa=G.sub(o,G.step(G.div(G.sub(G.log(G.div(X,Xa)),G.div(t1,q(64))),G.div(t1,q(64)))));
const Ft=G.choose(X,r.Xkeep,r.Xcut,raw.F,G.mul(kappa,raw.F),z);
const Ut=G.choose(X,r.Xkeep,r.Xcut,raw.U,G.mul(kappa,raw.U),z);
const local=[
  Ut,G.mul(q(2),X,Ft),G.mul(q(2),inner.F0,Ft),
  G.mul(q(2),X,G.add(G.mul(inner.U0,Ft),G.mul(Ut,inner.F0))),
  G.sub(G.mul(q(2),inner.U0,Ut),G.mul(q(2),X,inner.F0,Ft))];
assert.deepEqual(local,bootstrap.completedOrderOne.program.momentRepair.localIntegrands);
for(const [i,id] of r.localMoments.entries()){
  const n=G.nodes[id];
  assert.equal(n.op,'definite_integral');
  assert.deepEqual(n.args.slice(2),[z,r.Xcut]);
  assert.equal(n.args[0],G.substitute(local[i],X,n.args[1]));
}
assert.deepEqual(r.moments,[r.localMoments[0],r.localMoments[1],G.sub(r.localMoments[2],bootstrap.pressureOmega),
  r.localMoments[3],G.add(r.localMoments[4],bootstrap.fluxOmega)]);
const mBranch=G.nodes[r.M1],pBranch=G.nodes[r.Pi1];
assert.equal(mBranch.op,'smooth_piecewise');
assert.deepEqual(mBranch.args.slice(0,2),[X,r.Xkeep]);
assert.equal(mBranch.args[5],z);
assert.equal(pBranch.op,'smooth_piecewise');
assert.deepEqual(pBranch.args.slice(0,4),[X,r.Xkeep,r.Xplus,raw.Pi]);
assert.equal(pBranch.args[5],z);
const t=G.fresh('C99_raw_axis_average_cover');
const rawAverage=G.integral(G.picardEven(0,1,G.mul(t,X),eta),t,z,o);
assert.ok(explicitPrimitiveBodyIdentity(G,mBranch.args[3],G.mul(X,rawAverage)).pass);

const T=G.parameter('T'),Pstar=G.parameter('Pstar'),BOuter=G.parameter('BOuter');
const Kpos=G.mul(Pstar,G.inv(G.add(o,G.pow(eta,2))),G.exp(G.add(G.mul(q(-1,2),T),q(-7,10),
  G.mul(q(-1,2),lambda),G.neg(G.mul(G.add(q(1,2),lambda),G.sub(G.mul(q(60),BOuter),q(14)))))));
const power=(x,e)=>G.exp(G.mul(e,G.log(x)));
const r1m=power(r.Rbase,G.sub(o,G.mul(q(2),lambda)));
const rn2m=power(r.Rbase,G.sub(q(-2),G.mul(q(2),lambda)));
const rn0m=power(r.Rbase,G.mul(q(-2),lambda));
assert.equal(r.ef,G.mul(Kpos,power(r.Rbase,G.add(o,G.mul(q(2),lambda)))));
assert.equal(r.Rbase,G.sqrt(G.mul(q(2),r.X0)));
const [m0,m1,m2,m3,m4]=r.moments;
assert.deepEqual(r.Urhs,[G.neg(G.div(m0,r.Rbase)),
  G.div(G.add(G.neg(G.div(m0,r.Rbase)),G.div(m3,G.mul(r.ef,r1m))),G.mul(q(2),lambda))]);
assert.deepEqual(r.Erhs,[G.neg(G.div(m1,G.pow(r.Rbase,2))),
  G.neg(G.div(m2,G.mul(q(2),r.ef,rn2m))),G.div(m4,G.mul(r.ef,rn0m))]);
const sqrt2X=G.sqrt(G.mul(q(2),X));
const correctionU=G.choose(X,r.X0,r.IposRight,z,G.div(G.add(...r.alpha.map((c,j)=>
  G.mul(c,r.bump(r.normalizedR,j)))),r.Rbase),z);
const correctionE=G.div(G.add(...r.beta.map((c,j)=>G.mul(c,r.bump(r.normalizedR,j+2)))),r.Rbase);
const correctionF=G.choose(X,r.X0,r.IposRight,z,G.div(correctionE,sqrt2X),z);
assert.equal(r.U1,G.add(Ut,correctionU));
assert.equal(r.F1,G.add(Ft,correctionF));
assert.equal(r.E1,G.mul(sqrt2X,r.F1));
const emptyRoots=[bootstrap.pressureOmega,bootstrap.fluxOmega];
const originalRHS=[...r.Urhs,...r.Erhs];
const supportNames=['Xminus','Xkeep','Xcut','Xplus','Xb','X0','IposRight'];
const roots={F1:r.F1,U1:r.U1,E1:r.E1,M1:r.M1,M1overX:r.M1overX,
  v1:r.v1,V1:r.V1,Pi1:r.Pi1,pressureDerivative:r.pressureDerivative};

const rebuiltNative=new Map(),replacement=new Map(),affected=new Map();
const unary=['integer_power','source_step_derivative'];
const leaves=['coordinate','rational','source_parameter'];
const expressionNodes=['add','multiply','inverse','sqrt_positive','exp','log_positive','sine','cosine',
  'definite_integral','smooth_piecewise','ceiling','maximum','minimum'];
const children=(op,args)=>{
  if(leaves.includes(op))return [];
  if(unary.includes(op))return [args[0]];
  if(op==='actual_natural_series')return [args[1],args[2]];
  if(op==='actual_quadratic_root')return [args[2]];
  if(op==='actual_monotone_root')return args.slice(1);
  if(op==='actual_expression_partial')return [G.expressionSystems[args[0]].body,...args[1]];
  if(op==='actual_background_even_profile'||op==='actual_background_picard')return [args[2],args[3]];
  if(expressionNodes.includes(op))return args;
  throw Error('Unhandled original source operation '+op);
};
function usesActualRaw(id){
  if(affected.has(id))return affected.get(id);
  const {op,args}=G.nodes[id];
  const hit=(op==='actual_background_even_profile'||op==='actual_background_picard')&&args[0]===0;
  const answer=hit||children(op,args).some(usesActualRaw);
  affected.set(id,answer);
  return answer;
}
// 0 = nonnegative, 1 = at most one, 2 = at most Xcut. A null grade
// leaves the sign unknown. Xcut<1 is in the original endpoint proof.
const capRoots=new Set([z,Xa,r.Xminus,r.Xkeep,r.Xcut]);
function grade(id,env){
  if(env.has(id))return env.get(id);
  if(capRoots.has(id))return 2;
  const {op,args}=G.nodes[id];
  if(op==='rational'){
    const [n,d]=args.map(BigInt);
    return n<0n ? null : (n<=d?1:0);
  }
  if(op==='multiply'){
    const factors=args.map(x=>grade(x,env));
    if(factors.includes(null))return null;
    return factors.includes(0)?0:Math.max(...factors);
  }
  return null;
}
function restrict(env,id,cap){
  if(cap===null)return env;
  const result=new Map(env);
  const prior=grade(id,env);
  if(prior!==null)result.set(id,Math.max(prior,cap));
  return result;
}
const provenDomainCalls=new Set(), visitedDomainContexts=new Set();
function proveRawDomain(id,env){
  if(!usesActualRaw(id))return;
  const key=JSON.stringify([id,[...env].sort(([a],[b])=>a-b)]);
  if(visitedDomainContexts.has(key))return;
  visitedDomainContexts.add(key);
  const {op,args}=G.nodes[id];
  if(op==='actual_background_even_profile'){
    assert.equal(grade(args[2],env),2,JSON.stringify({id,x:args[2],node:G.nodes[args[2]],env:[...env]}));
    provenDomainCalls.add(id);
  }else if(op==='definite_integral'){
    const [body,binder,lo,hi]=args;
    proveRawDomain(lo,env);
    proveRawDomain(hi,env);
    const bounds=[grade(lo,env),grade(hi,env)];
    const inner=new Map(env);
    inner.set(binder,bounds.includes(null)?null:Math.min(...bounds));
    proveRawDomain(body,inner);
  }else if(op==='smooth_piecewise'){
    const [x,lo,hi,below,between,above]=args;
    [x,lo,hi].forEach(child=>proveRawDomain(child,env));
    proveRawDomain(below,restrict(env,x,grade(lo,env)));
    proveRawDomain(between,restrict(env,x,grade(hi,env)));
    proveRawDomain(above,env);
  }else if(op==='actual_expression_partial'){
    proveRawDomain(G.materializeExpressionFunction(args[0],args[1],args[2]),env);
  }else children(op,args).forEach(child=>proveRawDomain(child,env));
}
for(const id of [...Object.values(roots),...r.moments])
  proveRawDomain(id,new Map([[X,0]]));
function replace(id){
  if(replacement.has(id))return replacement.get(id);
  if(!usesActualRaw(id))return id;
  const {op,args}=G.nodes[id];
  let value;
  if(op==='actual_background_even_profile'){
    const [sys,i,x,e,k,m]=args;
    assert.equal(sys,0);
    assert.ok([0,1,3].includes(i));
    assert.equal(k,0,'This receipt is only for value and pure eta original callers.');
    let left=G.substitute(core.sum[i],xi,G.sqrt(X));
    let right=G.substitute(finiteFormal[i],xi,G.sqrt(X));
    for(let j=0;j<m;j++){left=G.derivative(left,eta);right=G.derivative(right,eta);}
    const approximation=G.choose(X,Xa,inner.aSquared,left,right,z);
    value=G.simultaneousSubstitute(approximation,[X,eta],[x,e]);
    rebuiltNative.set(id,{component:i,radialOrder:k,etaOrder:m,X:x,eta:e,approximant:value});
  }else if(op==='actual_expression_partial'){
    value=replace(G.materializeExpressionFunction(args[0],args[1],args[2]));
  }else if(unary.includes(op)){
    value=G.node(op,[replace(args[0]),args[1]]);
  }else{
    assert.ok(expressionNodes.includes(op),[op,id]);
    value=G.node(op,args.map(replace));
  }
  replacement.set(id,value);
  return value;
}
for(const root of emptyRoots)assert.ok(!usesActualRaw(root));
const approximants=Object.fromEntries(Object.entries(roots).map(([key,id])=>[key,replace(id)]));
const approximateLocal=r.localMoments.map(replace),approximateIncoming=r.moments.map(replace);
const approximateRHS=originalRHS.map(replace),approximateCoefficients=[...r.alpha,...r.beta].map(replace);
assert.ok(Object.values(approximants).every(id=>!usesActualRaw(id)));
assert.ok(approximateIncoming.every(id=>!usesActualRaw(id)));
assert.ok(approximateRHS.every(id=>!usesActualRaw(id)));
assert.ok(approximateCoefficients.every(id=>!usesActualRaw(id)));
assert.ok([...r.Umat.flat(),...r.Emat.flat(),...r.Uinverse.flat(),...r.Einverse.flat()].every(id=>!usesActualRaw(id)));
assert.ok(rebuiltNative.size>0);
assert.deepEqual([...rebuiltNative.keys()].sort((a,b)=>a-b),[...provenDomainCalls].sort((a,b)=>a-b));
const momentsChecks=r.momentResiduals.map(id=>{
  const check=sourceGraphRationalIdentity(G,replace(id),{atomicNodes:approximateIncoming});
  assert.ok(check.pass);
  return {original:id,approximate:replace(id),numeratorMonomials:check.numeratorMonomials};
});

const actualProfile=G.source.parametersExactExpressions;
const result={schema:'MathScope.C99.OriginalN1CompensatedTransferOperands/1',
  prior:{C97,C98,C98Operands},originalPins,originalPrefixSHA256:saved.prefixSHA,
  registrySHA:saved.registrySHA,profileSHA:saved.profileSHA,
  rawSupports:Object.fromEntries(supportNames.map(name=>[name,r[name]])),
  sourceSupportProof:{pass:support.pass,inequalities:support.inequalities,endpoints:support.endpoints},
  profileScalars:Object.fromEntries(['T','Pstar','lambda','Q','BOuter','XR','X0Ipos','CSelected'].map(name=>[name,actualProfile[name]])),
  sourceRoots:{X,eta,Xa,t1,commonASquared:inner.aSquared,localF:Ft,localU:Ut,Kpos,ef:r.ef,Rbase:r.Rbase,
    pressureOmega:bootstrap.pressureOmega,fluxOmega:bootstrap.fluxOmega},
  localMoments:r.localMoments,incomingMoments:r.moments,approximateLocal,approximateIncoming,
  matrices:{U:r.Umat,E:r.Emat,Uinverse:r.Uinverse,Einverse:r.Einverse,normalizedInverseProof:r.proof},
  originalRHS,approximateRHS,coefficients:[...r.alpha,...r.beta],approximateCoefficients,
  outputs:roots,approximants,rawRequestReplacements:[...rebuiltNative],
  momentsChecks,noRawCallInCompensatedApproximants:true,
  rawDomainProof:{verifiedContexts:visitedDomainContexts.size,allActualRadialArgumentsAtMostXcut:true,
    actualRawCallIds:[...provenDomainCalls].sort((a,b)=>a-b)},
  sourceScope:{axisAverageThroughXkeep:true,taperThroughXcut:true,pressureNativeThroughXkeep:true,
    pressureOmegaAndFluxOmegaUntouched:true,orderOneStressEndsAtXb:true},
  nodeCounts:{unchanged:117676,total:G.nodes.length}};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({local:r.localMoments,rawRequests:rebuiltNative.size,outputs:Object.keys(roots).length,
  exactMomentChecks:momentsChecks.length,outputNodes:G.nodes.length}));
