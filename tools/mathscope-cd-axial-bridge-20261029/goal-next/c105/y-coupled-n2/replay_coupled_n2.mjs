import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, c104, c103, momentDir, output] = process.argv.slice(2);
assert(output,'Usage: ORIGINAL_RUNTIME C104_Y C103_Y ORIGINAL_MOMENT_DIRECTORY NEW_JSON');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const pinned = async (path,expected) => {
  const bytes=await readFile(path);
  assert.equal(sha(bytes),expected,path);
  return bytes;
};
const prior={
  C104:'9b94457853b46d03a64439173a414a5b614b814ddbbc92a808e0b1c0fc1be993',
  C104Ops:'215ad80b268a36ad6e6427a72ed399621f6f37835aff2f8f3fb8b57b1e17a592',
  C103Ops:'281e4b9d3e8046a8ad74c299b8a2d68661c1e7bcac73d3edf98a2d882dae24a0',
  pressureMoment:'3d4be5e7b50d1f1310ee2588f59cf055be87ddfaff60f75ca4cbf98c9371d4cb',
  higherMoment:'e78ddd420473f05bbb517b9d3f64bde2d2dd24ba8d28bb93292d5851f319748f',
};
const last=JSON.parse(await pinned(resolve(c104,'n2-absolute-stress.json'),prior.C104));
const con=JSON.parse(await pinned(resolve(c104,'n2-absolute-stress-operands.json'),prior.C104Ops));
const src=JSON.parse(await pinned(resolve(c103,'n2-pressure-compensation-operands.json'),prior.C103Ops));
const n1Mom=JSON.parse(await pinned(resolve(momentDir,'whole-moments/whole-moments.json'),prior.pressureMoment));
const higher=JSON.parse(await pinned(resolve(momentDir,'higher-whole-moments/higher-moments.json'),prior.higherMoment));
assert.equal(last.operandsSHA256,prior.C104Ops);
assert.equal(con.optionalInnerPressureForcingSensitivity.exactErrorIdentityNumeratorMonomials,0);
const pins={...src.pins,
  'actual-leading-all-order-jets.mjs':'d3af156118671a3e582c19a82064aab884a09d6ce81f51a6b2d64d35444cd29d',
  'actual-continuation-exact-global.mjs':'497e18fc52c10b9eb482bdb6cc18b406c02f453dc19663ba5535c13a41ec015f',
  'actual-continuation-exact-order-one.mjs':'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72'
};
for(const [n,p] of Object.entries(pins)) await pinned(resolve(runtime,n),p);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const generator=await load('actual-residual-order-induction-source.mjs');
const { sourceScaledOperators,buildActualOmegaCoefficientOverX }=await load('actual-continuation-exact-order-two-source.mjs');
const { sourceGraphRationalIdentity }=await load('actual-continuation-exact-identities.mjs');
const { actualLeadingAllOrderJets }=await load('actual-leading-all-order-jets.mjs');
const { actualSupportOrderProof,checkActualExteriorZeros }=await load('actual-continuation-exact-support.mjs');
const live=generator.prepareActualOrderInduction({order:2,maxNodes:2000000});
assert.ok(generator.assertActualOrderInduction(live));
const {G,records:[L0,n1,n2],bootstrap:b}=live,{constants:{X,eta,Xv},orderOne:r,inner}=b;
assert.equal(sha(JSON.stringify(G.nodes)),src.originalPrefixSHA256);
const q=(n,d=1)=>G.q(n,d),one=G.one,z=G.zero,h=G.parameter('h'),x2=G.pow(n2.raw.xi,2);
const {A,D,d,L}=G.core,{T,Z}=sourceScaledOperators(G,X,eta),
  a=G.neg(G.add(A,q(1,2))),c=G.neg(A),nu=G.mul(q(2),h),fExp=G.add(a,nu),uExp=G.add(c,nu);
const exact=(left,right,atoms=[])=>sourceGraphRationalIdentity(G,G.sub(left,right),{atomicNodes:atoms,maxTerms:200000});
const n2Aux=G.picardSystems[2], n2Act=G.picardSystems[3],liveMap=G.substitute.bind(G);
assert.equal(n2.raw.system,3);
assert.equal(n2.auxiliary.system,2);
assert.notEqual(n2Act.radialDomain[1],n2Aux.radialDomain[1]);
assert.equal(n2Act.radialDomain[1],G.sqrt(inner.aSquared));
assert.equal(n2.norm.actual.C,118568);
assert.equal(n2.norm.actual.strip,117678);
assert.equal(n2.norm.actual.Kcondition,118577);
const f0=L0.actual.F,u0=L0.actual.U,v0=L0.actual.v,{F:f1,U:u1,v:v1}=n1.actual;
const forced=(F,U,v)=>{
  const known=buildActualOmegaCoefficientOverX(G,{order:1,X,eta,U:[u0,U],v:[v0,v]}).value;
  return {
    known,p:G.sub(G.pow(F,2),G.mul(q(1,2),known)),
    angular:G.add(G.mul(v,G.add(F,G.mul(X,G.derivative(F,X)))),G.mul(U,Z(fExp,F)),G.neg(Z(G.sub(fExp,D),Z(fExp,F)))),
    axial:G.add(G.mul(X,v,G.derivative(U,X)),G.mul(U,Z(uExp,U)),G.neg(Z(G.sub(uExp,D),Z(uExp,U))))
  };
};
const original=forced(f1,u1,v1);
assert.equal(original.known,n2.raw.omegaOverX);
assert.ok(exact(original.p,n2.raw.pKnown,[f1,original.known]).pass);
assert.ok(exact(original.angular,n2.raw.Htheta).pass);
assert.ok(exact(original.axial,n2.raw.Hz).pass);
const independent=generator.actualInductionLinearKernel(G,{X,eta,xi:n2.raw.xi,lambda:n2.raw.lambda,F0:f0,U0:u0,v0,
  pKnown:n2.raw.pKnown,Htheta:n2.raw.Htheta,Hz:n2.raw.Hz});
assert.deepEqual(independent.matrix0.map(row=>row.map(id=>liveMap(id,X,x2))),n2Act.A0);
assert.deepEqual(independent.matrix1.map(row=>row.map(id=>liveMap(id,X,x2))),n2Act.A1);
assert.deepEqual(independent.rawForcing.map(id=>liveMap(id,X,x2)),n2Act.forcing);
const dummy=[0,1,2].map(i=>G.fresh('C105_lower_forcing_slot_'+i));
const perturbed=generator.actualInductionLinearKernel(G,{X,eta,xi:n2.raw.xi,lambda:n2.raw.lambda,F0:f0,U0:u0,v0,
  pKnown:dummy[0],Htheta:dummy[1],Hz:dummy[2]});
assert.deepEqual(perturbed.matrix0,independent.matrix0);
assert.deepEqual(perturbed.matrix1,independent.matrix1);
assert.deepEqual(perturbed.rawForcing.slice(0,3),[z,z,z]);

const x=G.fresh('C105_X'),e=G.fresh('C105_eta'),xoff=G.sub(X,x),eoff=G.sub(eta,e),atoms=[x,e,h];
const at=x=>G.simultaneousSubstitute(x,[X,eta],atoms.slice(0,2));
function jet(name){
  const j=Array.from({length:6},(_,i)=>G.fresh('C105_'+name+'_'+i));
  atoms.push(...j);
  return G.add(j[0],G.mul(j[1],xoff),G.mul(j[2],eoff),G.mul(q(1,2),j[3],G.pow(xoff,2)),
    G.mul(j[4],xoff,eoff),G.mul(q(1,2),j[5],G.pow(eoff,2)));
}
const f=jet('F'),u=jet('U'),v=jet('v'),df=jet('dF'),du=jet('dU'),dv=jet('dv');
const Fhat=G.sub(f,df),Uhat=G.sub(u,du),vhat=G.sub(v,dv);
const angular=(F,U,v)=>G.add(G.mul(v,G.add(F,G.mul(X,G.derivative(F,X)))),
  G.mul(U,Z(fExp,F)),G.neg(Z(G.sub(fExp,D),Z(fExp,F))));
const axial=(U,v)=>G.add(G.mul(X,v,G.derivative(U,X)),G.mul(U,Z(uExp,U)),G.neg(Z(G.sub(uExp,D),Z(uExp,U))));
const localDifference=[
  [G.sub(angular(f,u,v),angular(Fhat,Uhat,vhat)),
    G.add(G.mul(dv,G.add(f,G.mul(X,G.derivative(f,X)))),
      G.mul(vhat,G.add(df,G.mul(X,G.derivative(df,X)))),G.mul(du,Z(fExp,f)),
      G.mul(Uhat,Z(fExp,df)),G.neg(Z(G.sub(fExp,D),Z(fExp,df))))],
  [G.sub(axial(u,v),axial(Uhat,vhat)),
    G.add(G.mul(X,dv,G.derivative(u,X)),G.mul(X,vhat,G.derivative(du,X)),G.mul(du,Z(uExp,u)),
      G.mul(Uhat,Z(uExp,du)),G.neg(Z(G.sub(uExp,D),Z(uExp,du))))]
];
const localProofs=localDifference.map(([left,right])=>exact(at(left),at(right),atoms));
assert.ok(localProofs.every(p=>p.pass));
const globalOmega=buildActualOmegaCoefficientOverX(G,{order:1,X,eta,U:[L0.global.U,n1.global.U],v:[L0.global.v,n1.global.v]});
assert.equal(globalOmega.terms.length,7);
assert.deepEqual(G.nodes[n2.global.omega],{op:'smooth_piecewise',args:[X,inner.aSquared,r.Xplus,original.known,globalOmega.value,z]});
assert.equal(n2.global.lowerPressure,src.sourcePressure.lowerPressure);
const [fSq,uf,uSqMinus]=n2.global.lowerBodies;
assert.ok(exact(fSq,G.pow(n1.global.F,2),[n1.global.F]).pass);
assert.ok(exact(uf,G.mul(q(2),X,n1.global.U,n1.global.F),[X,n1.global.F,n1.global.U]).pass);
assert.ok(exact(uSqMinus,G.sub(G.pow(n1.global.U,2),G.mul(X,G.pow(n1.global.F,2))),[X,n1.global.F,n1.global.U]).pass);
const whole=[
  G.sub(fSq,G.mul(q(1,2),n2.global.omega)),uf,
  G.add(uSqMinus,G.mul(q(1,2),X,n2.global.omega))
];
const flatten=id=>G.nodes[id].op==='add'?G.nodes[id].args.flatMap(flatten):[id];
const getBody=id=>{
  const {op,args}=G.nodes[id];
  assert.equal(op,'actual_expression_partial');
  assert.deepEqual(args[1],[eta]);
  return G.expressionSystems[args[0]].body;
};
const integralIds=n2.global.incoming.slice(2).map((entry,j)=>{
  const parts=flatten(getBody(entry));
  const [wholeIntegral]=parts.filter(x=>G.nodes[x].op==='definite_integral'&&G.nodes[x].args[3]===r.Xplus);
  assert.ok(wholeIntegral!==undefined);
  const [body,binder,left,right]=G.nodes[wholeIntegral].args;
  assert.deepEqual([left,right],[z,r.Xplus]);
  const call=G.nodes[body];
  assert.equal(call.op,'actual_expression_partial');
  assert.deepEqual(call.args[1],[binder,eta]);
  const bodyRoot=G.expressionSystems[call.args[0]].body;
  assert.ok(exact(bodyRoot,whole[j],[X,n1.global.F,n1.global.U,n2.global.omega]).pass);
  return wholeIntegral;
});
const arbitrary=n2.global.incoming.map((_,j)=>G.fresh('C105_coupled_moment_'+j));
const newMoments=n2.global.momentResiduals.map(root=>exact(G.simultaneousSubstitute(root,n2.global.incoming,arbitrary),z,arbitrary));
assert.ok(newMoments.every(row=>row.pass));
assert.ok(n1Mom.omega && higher.status.toUpperCase().includes('VERIFIED'));
const sup=actualSupportOrderProof(b.completedOrderOne);
const zero=checkActualExteriorZeros(b.G,[b.finalU,b.finalv,r.F1,r.U1,r.v1,r.M1],sup);
assert.ok(zero.pass && zero.zeroBranchTrace.every(x=>x.rightEndpoint!==r.Xplus));
assert.equal(sup.endpoints.Xv,Xv);
assert.ok(sup.expressionChecks.allEndpointsIndependentOfEta);
const radialProfile=G.source.parametersExactExpressions;
assert.deepEqual(radialProfile.t1,{power:[{ref:'CSelected'},-120]});
assert.equal(r.Xcut,G.mul(G.parameter('Xa'),G.exp(G.div(G.parameter('t1'),q(32)))));
assert.equal(inner.aSquared,G.mul(G.parameter('Xa'),G.exp(G.div(G.parameter('t1'),q(16)))));
assert.equal(r.X0,src.guards.IposLeft);

const bounds=actualLeadingAllOrderJets({radialOrder:2,etaOrder:3});
assert.ok(bounds.pass);
assert.equal(bounds.sourceFunctionIdentity.U0Root,b.finalU);
assert.equal(bounds.parameterExpressionSHA256,b.program.parameterExpressionSHA256);
assert.equal(bounds.bounds.U0.domain.X[1],'infinity');
assert.deepEqual(bounds.bounds.F0active.domain.X,['0','Xplus=Xv*exp(1)']);
const norm=bounds.normProgram,head={U:bounds.bounds.U0.root,F:bounds.bounds.F0active.root};
const deps=new Set(),stack=Object.values(head);
while(stack.length){
  const i=stack.pop();
  if(deps.has(i))continue;
  deps.add(i);
  const {op,args}=norm.nodes[i];
  if(op==='rational'||op==='source_parameter')continue;
  if(op==='integer_power')stack.push(args[0]);
  else if(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling'].includes(op))stack.push(...args);
  else throw Error('Unknown positive norm operation '+op);
}
const record={
  schema:'MathScope.C105.ActualCoupledN2SourceOperands/1',prior,pins,
  originalPrefixSHA256:src.originalPrefixSHA256,actualSystem:3,auxiliarySystem:2,
  rawForcing:n2Act.forcing,rawForcingRows:3,sharedUnchangedMatrixEntries:72,
  originalNorms:{C1:n1.norm.actual.C,M1:n1.norm.actual.solutionNorm,
    C2:n2.norm.actual.C,Kcondition:n2.norm.actual.Kcondition,s:n2.norm.actual.strip,aSquared:inner.aSquared},
  forcingDifferenceNumeratorMonomials:[0,...localProofs.map(x=>x.numeratorMonomials)],
  exactLowerOmega:{inner:original.known,outer:globalOmega.value,switch:n2.global.omega,
    outerOmegaTermCount:globalOmega.terms.length,pressureSource:n2.global.lowerPressure,wholeLowerHistories:integralIds},
  guards:{X,eta,Xcut:r.Xcut,Xv,Xplus:r.Xplus,lastIpos:117099},
  ordinaryWholeMomentReplacementNumerators:newMoments.map(x=>x.numeratorMonomials),
  exteriorZeroChecks:zero.checks,
  leadingNorm:{...head,radialOrder:2,etaOrder:3,programSHA256:sha(JSON.stringify(norm.nodes)),nodeCount:deps.size,
    arithmeticNodes:[...deps].sort((a,b)=>a-b).map(i=>[i,norm.nodes[i]])}
};
await writeFile(output,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({coefficientMatrices:72,forcing:record.forcingDifferenceNumeratorMonomials,
  lowerHistories:integralIds,leadingPositiveDag:deps.size,saturations:record.exteriorZeroChecks.length}));
