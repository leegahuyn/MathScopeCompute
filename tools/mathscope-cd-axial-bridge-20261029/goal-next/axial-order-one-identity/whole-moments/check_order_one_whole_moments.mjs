/** Independent denotation check for the order-one whole physical moments. */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";

const [navier,collarFile,output]=process.argv.slice(2);
assert(navier&&collarFile&&output&&!fs.existsSync(output));
const sha=x=>crypto.createHash("sha256").update(x).digest("hex");
const pins={
  "actual-global-pressure-convolution.mjs":"169d12967c1f0a57b1f1e07f7d98c732b5831a048f7517e731bf4fe4955d6d2b",
  "actual-global-positive-primitives.mjs":"ad2d7ee3dd1da9a69aef0334724c8a67051f359b0a89bae153041fd6809f7513",
  "actual-leading-stream-primitive.mjs":"4a9a1d28d9ee7cea2d776fe73bdeed3a95dbe62fdb50a51fa536d3ccc55667de",
  "actual-continuation-exact-global.mjs":"497e18fc52c10b9eb482bdb6cc18b406c02f453dc19663ba5535c13a41ec015f",
  "actual-global-primitive-kernels.mjs":"efebfbcfb124f5bed96bf13435333cb784a0d5cab319303a0244c788ce1bed59",
  "actual-global-pressure-kernels.mjs":"43896a8d8a3156fbe6736092263f5cb95372bcd8742292af5e40322563c02c42",
  "actual-strengthened-background-kernels.mjs":"0fd965c3f82c33631727003255087885d899074e5bb882f779dd54eddfd3e133",
  "actual-continuation-exact-order-one.mjs":"bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72",
  "actual-continuation-exact-functions.mjs":"326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311",
  "actual-continuation-exact-identities.mjs":"bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712",
  "actual-continuation-exact-order-two-source.mjs":"1ebf8b2b6f1df054a06309c5dc8695f2f3a867733544ab012f206bfed2969dd0",
  "actual-continuation-exact-stress.mjs":"22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2"
};
for(const [f,digest] of Object.entries(pins))assert.equal(sha(fs.readFileSync(path.join(navier,f))),digest,f);
const mod=f=>import(pathToFileURL(path.resolve(navier,f)).href);
const {prepareActualGlobalPressureConvolution}=await mod("actual-global-pressure-convolution.mjs");
const {explicitPrimitiveBodyIdentity}=await mod("actual-global-primitive-kernels.mjs");
const {sourceGraphRationalIdentity}=await mod("actual-continuation-exact-identities.mjs");
const {buildActualOmegaCoefficientOverX}=await mod("actual-continuation-exact-order-two-source.mjs");
const {reduceExpressionOnDeclaredBranches,rewriteExactPressureOperands}=await mod("actual-global-pressure-kernels.mjs");
const {reduceLiteralZeroDerivatives}=await mod("actual-strengthened-background-kernels.mjs");

const previousRaw=fs.readFileSync(collarFile),collarSHA256=sha(previousRaw);
assert.equal(collarSHA256,"c59f31ab3b4df3893b11b3bc46a2d67b47d74ca7e63634fb607bb358e41dcd61");
const previous=JSON.parse(previousRaw);
const original=prepareActualGlobalPressureConvolution({order:1,maxNodes:500000});
const {G,primitives,stream,leadingRestrictions}=original,b=primitives.prepared.bootstrap,r=b.orderOne;
const prefixSHA256=sha(JSON.stringify(G.nodes.slice(0,117100)));
assert.equal(prefixSHA256,previous.originalPrefix.sha256);
assert.equal(b.stress.axial,previous.roots.raw);
const {X,eta,Xv}=b.constants,{Xkeep,Xcut,Xplus,X0,IposRight,Rbase,ef,supports,normalizedR}=r;
const {A,D,d,L}=G.core,z=G.zero,o=G.one,q=(n,d=1)=>G.q(n,d),node=i=>G.nodes[i];
const eq=(a,c,label,atomicNodes=[])=>{
  const result=explicitPrimitiveBodyIdentity(G,a,c,{atomicNodes});
  assert(result.pass,label);
  return result;
};
const rat=(x,label,atomicNodes=[])=>{
  const result=sourceGraphRationalIdentity(G,x,{atomicNodes});
  assert(result.pass,label);
  return result;
};
const integral=(f,t,a,c)=>G.integral(G.substitute(f,X,t),t,a,c);
const literal=(id,a,c,f,label)=>{
  const n=node(id);
  assert.equal(n.op,"definite_integral",label);
  const [body,variable,left,right]=n.args;
  assert.deepEqual([left,right],[a,c],label);
  assert.equal(node(variable).op,"coordinate",label);
  if(variable!==X)assert(!G.dependsOn(body,X),label+" captured formal X");
  for(const endpoint of [left,right])assert(!G.dependsOn(endpoint,eta),label+" moving eta endpoint");
  const atFormal=G.substitute(body,variable,X);
  const density=eq(atFormal,f,label);
  return {id,binder:variable,body,left,right,formalDensity:atFormal,expectedDensity:f,density};
};
assert.deepEqual([X,eta,Xkeep,Xcut,Xv,Xplus],[4756,2,28819,28823,3293,28824]);
assert(original.pressureOne.pass && original.pressureOne.localFTC.pass);
assert(leadingRestrictions.commonCore.pass && leadingRestrictions.ipos.pass);
assert(stream.scope.actualLeadingContinuityIdentity);

const {F0:Flocal,U0:Ulocal}=b.inner;
const [Ut,Ucor]=node(r.U1).args,[Ft,Fcor]=node(r.F1).args;
for(const [c,p] of [[Ut,Ucor],[Ft,Fcor]]){
  assert.equal(node(c).op,"smooth_piecewise");
  assert.deepEqual(node(c).args.slice(0,3),[X,Xkeep,Xcut]);
  assert.equal(node(c).args[5],z);
  assert.equal(node(p).op,"smooth_piecewise");
  assert.deepEqual(node(p).args.slice(0,4),[X,X0,IposRight,z]);
  assert.equal(node(p).args[5],z);
}
const local=(U,F,U1,F1)=>[U1,G.mul(q(2),X,F1),G.mul(q(2),F,F1),
  G.mul(q(2),X,G.add(G.mul(U,F1),G.mul(U1,F))),
  G.sub(G.mul(q(2),U,U1),G.mul(q(2),X,F,F1))];
const expectedLocal=local(Ulocal,Flocal,Ut,Ft);
const localRows=expectedLocal.map((f,i)=>literal(r.localMoments[i],z,Xcut,f,"local "+(i+1)));
assert.deepEqual(localRows.map(k=>k.id),b.program.momentRepair.localIntegrals);
const U=b.finalU,v=b.finalv,Ux=G.derivative(U,X),Ueta=G.derivative(U,eta),
  vx=G.derivative(v,X),vxx=G.derivative(vx,X),veta=G.derivative(v,eta),Uv=G.mul(U,v),
  UvEta=G.add(G.mul(Ueta,v),G.mul(U,veta)),vx1=G.add(v,G.mul(X,vx));
const atoms=[U,Ux,Ueta,v,vx,vxx,veta];
const w=b.originalLeading.program.weightedOmega;
assert.deepEqual(w.names,["Jminus1","J0","Hminus1","H0","Kminus2","Kminus1"]);
const omegaDensity=[v,G.mul(X,v),Uv,G.mul(X,Uv),G.pow(v,2),G.mul(X,G.pow(v,2))];
const omegaSource=[...w.integrals,w.derivativeIntegrals.Jmeta,w.derivativeIntegrals.J0eta,w.derivativeIntegrals.Hmeta,w.derivativeIntegrals.H0eta];
const allDensity=[...omegaDensity,veta,G.mul(X,veta),UvEta,G.mul(X,UvEta)];
const omegaRows=omegaSource.map((id,i)=>literal(id,z,Xv,allDensity[i],"weighted Ω "+i));
const prefixes=allDensity.map((f,j)=>integral(f,G.fresh("originalOmegaPrefix"+j),z,X));
const prefixFTC=prefixes.map((id,j)=>{
  const row=literal(id,z,X,allDensity[j],"temporary Ω primitive "+j);
  const derivative=G.derivative(id,X);
  const reduced=reduceLiteralZeroDerivatives(G,derivative,{atomicNodes:atoms});
  const complete=G.integral(row.body,row.binder,z,Xv);
  return {id,derivative,reduced:reduced.value,expected:row.expectedDensity,complete,
    sourceFTC:eq(reduced.value,row.expectedDensity,"literal prefix FTC "+j),
    originalWhole:eq(complete,omegaSource[j],"fixed completion uses actual Ω history "+j)};
});
const exactFTC=new Map(prefixFTC.map(row=>[row.derivative,row.expected]));
const differentiated=id=>{
  const original=G.derivative(id,X);
  const copied=rewriteExactPressureOperands(G,original,{replacements:exactFTC,atomicNodes:atoms}).value;
  return reduceLiteralZeroDerivatives(G,copied,{atomicNodes:atoms}).value;
};
const omegaFormula=(a,axis)=>{
  const [Jm,J0,Hm,H0,Km2,Km1,Jme,J0e,Hme,H0e]=a;
  const pressure=G.add(G.div(G.add(G.mul(D,eta,Jme),G.mul(d,Hme),G.neg(G.mul(q(2),A,eta,Hm))),G.mul(q(2),L)),G.mul(q(1,4),Km2),axis);
  const flux=G.sub(G.div(G.add(G.mul(D,eta,J0e),G.neg(J0),G.mul(d,H0e),G.mul(q(2),D,eta,H0)),G.mul(q(2),L)),G.mul(q(1,4),Km1));
  return [pressure,flux];
};
const axisVX=stream.roots.actualAxisVX;
const [srcP,srcQ]=omegaFormula(omegaSource,axisVX);
const omegaWhole=[eq(b.pressureOmega,srcP,"whole weighted pressure Ω",omegaSource),
  eq(b.fluxOmega,srcQ,"whole weighted axial flux Ω",omegaSource)];
const [baseP,baseQ]=omegaFormula(prefixes,axisVX);
const core=G.add(G.div(v,G.mul(q(2),L)),G.neg(G.div(G.mul(eta,U,v),L)),G.mul(q(1,2),G.pow(v,2)),G.neg(vx));
const fullP=G.add(baseP,G.mul(X,core),G.neg(v));
const fullQ=G.add(baseQ,G.mul(G.pow(X,2),core));
const matchOriginalPrefix={Jeta:6,Heta:8,H:2,K:4};
const originalPrefixBindings=Object.entries(matchOriginalPrefix).map(([name,j])=>({
  name,source:original.omegaPrefix.rows[name].primitive,derived:prefixes[j],
  matching:eq(original.omegaPrefix.rows[name].primitive,prefixes[j],"literal actual pressure prefix "+name)
}));
const samePressurePrefix=rat(G.sub(
  rewriteExactPressureOperands(G,original.omegaPrefix.active,{
    replacements:new Map(originalPrefixBindings.map(x=>[x.source,x.derived])),atomicNodes:atoms
  }).value,fullP),"original Ω pressure prefix including source axis constant",[...atoms,...prefixes,axisVX]);
const omega=buildActualOmegaCoefficientOverX(G,{order:0,X,eta,U:[U],v:[v]}).value;
const exposed=G.add(G.div(G.add(vx1,G.mul(D,eta,veta)),L),
  G.mul(v,G.add(G.mul(q(1,2),v),G.mul(X,vx))),
  G.div(G.mul(U,G.sub(G.mul(d,veta),G.mul(q(2),eta,vx1))),L),
  G.mul(q(-2),G.add(G.mul(q(2),vx),G.mul(X,vxx))));
const omegaDensityIdentity=rat(G.sub(omega,exposed),"actual radial Ω",atoms);
const C0=G.add(G.mul(L,vx1),G.mul(d,Ueta),G.neg(G.mul(q(2),A,eta,U)),G.neg(G.mul(q(2),eta,X,Ux)));
const divC=G.div(G.mul(v,C0),G.mul(q(2),L)),halfOmega=G.mul(q(1,2),omega);
const omegaFTC=[
  rat(G.sub(differentiated(fullP),G.add(halfOmega,divC)),"pressure prefix with continuity defect",atoms),
  rat(G.sub(differentiated(fullQ),G.mul(X,G.add(halfOmega,divC))),"flux prefix with weighted defect",atoms)
];
const negativeMissingFluxBoundary=sourceGraphRationalIdentity(G,
  G.sub(differentiated(baseQ),G.mul(X,G.add(halfOmega,divC))),{atomicNodes:atoms});
assert(!negativeMissingFluxBoundary.pass);
const expectedIncoming=[r.localMoments[0],r.localMoments[1],G.sub(r.localMoments[2],b.pressureOmega),
  r.localMoments[3],G.add(r.localMoments[4],b.fluxOmega)];
const incoming=r.moments.map((id,j)=>eq(id,expectedIncoming[j],"original incoming "+(j+1)));

const lam=G.parameter("lambda"),p=G.sub(q(-2),G.mul(q(2),lam)),R=G.sqrt(G.mul(q(2),X));
const power=(a,e)=>G.exp(G.mul(e,G.log(a)));
const bump=(s,j)=>G.div(G.step(G.div(G.sub(s,supports[j][0]),q(1,2048)),1),q(1,2048));
assert.equal(Rbase,G.sqrt(G.mul(q(2),X0)));
assert.equal(normalizedR,G.div(R,Rbase));
assert([...r.alpha,...r.beta,...r.moments].every(id=>!G.dependsOn(id,X)));
const sourceInverseJacobian=rat(G.sub(G.derivative(normalizedR,X),G.inv(G.mul(Rbase,R))),
  "actual inverse radial Jacobian",[Rbase,R]);
const physicalBumpEndpoints=supports.map(pair=>pair.map(rho=>G.mul(X0,G.pow(rho,2))));
const reservedF=G.mul(ef,power(R,p));
eq(leadingRestrictions.ipos.reservedF,reservedF,"same original F0 on Ipos");
assert.deepEqual(leadingRestrictions.ipos.domain,[X0,IposRight]);
assert.deepEqual(leadingRestrictions.commonCore.domain,[z,previous.endpoints.aSquared]);
eq(leadingRestrictions.commonCore.U0,Ulocal,"same actual U0 through local support");
eq(leadingRestrictions.commonCore.F0,Flocal,"same actual F0 through local support");
const support=b.stress.supportOrder,tail=support.leadingExterior;
const iq=b.originalLeading.pre.constants,pulse=G.outer.stages.find(x=>x.id==="pulse");
assert(support.pass);
assert(support.inequalities.includes("Xminus<Xkeep<Xcut<a^2<IposLeft<IposRight<Xv<Xplus<Xb"));
const stepValues=new Map();
for(let j=0;j<5;j++)for(const y of [
  G.div(G.sub(G.div(X,G.parameter("XR")),q(j+6,2048)),q(1,4096)),
  G.div(G.sub(G.div(X,G.parameter("X0I1")),q(j+9)),q(1,2))
])for(let k=0;k<=3;k++)stepValues.set(G.step(y,k),k?z:o);
const oldRights=new Set([iq.Xa,iq.XR,iq.Xi,iq.restLeft,iq.restRight,b.constants.Iright,b.constants.I1Right,...tail.physicalRightEnds]);
const UatIpos=reduceExpressionOnDeclaredBranches(G,U,{coordinate:X,stepValues,
  selectPiecewise:b=>{
    if(b.coordinate===X&&oldRights.has(b.right))return 5;
    if(b.coordinate===tail.tailLogCoordinate&&b.left===z&&b.right===pulse.length)return 3;
    return null;
  }});
assert.equal(UatIpos.value,z);
assert.equal(support.derivation.middle,"IposRight/Xv=exp(-9-13/lambda)<1 and Xplus/Xv=exp(1).");

const zeroSet=new Set([...oldRights,Xv]);
const reduceVExterior=id=>reduceExpressionOnDeclaredBranches(G,id,{coordinate:X,stepValues,
  selectPiecewise:x=>((x.coordinate===X&&zeroSet.has(x.right))||
    (x.coordinate===tail.tailLogCoordinate&&x.right===tail.tailLogRight))?5:null});
const M=stream.roots.actualGlobalM0;
assert.equal(M,9239);
assert.equal(stream.roots.actualGlobalU0,U);
const Mexterior=reduceVExterior(M);
assert.equal(Mexterior.value,z);
const Maxis=G.substitute(M,X,z),vAxis=G.substitute(original.omegaPrefix.axis.actualNaturalSource,X,z);
assert.equal(Maxis,z);
assert.equal(vAxis,original.omegaPrefix.axis.actualValue);
const axisVEquality=rat(G.sub(vAxis,axisVX),"actual regular natural v0(0)=V_X(0)",[G.core.Ustar]);
const zeroPrefixes=prefixes.map(id=>{const n=node(id);return G.integral(n.args[0],n.args[1],z,z);});
assert(zeroPrefixes.every(v=>v===z));
const [formalAxisPressure,formalAxisFlux]=omegaFormula(zeroPrefixes,axisVX);
const axisChecks=[rat(G.sub(formalAxisPressure,vAxis),"axis pressure constant cancels"),
  rat(formalAxisFlux,"axis flux primitive value")];
const vExterior=[v,vx].map(reduceVExterior);
assert(vExterior.every(row=>row.value===z));
assert(stream.checks.every(x=>x.pass));
assert(stream.parts.outer.affineRows.every(x=>x.pass));
const Utotal=integral(U,G.fresh("originalLeadingWholeMass"),z,Xv);
const leadingMassIntegral=literal(Utotal,z,Xv,U,"whole leading U0 by ordinary FTC");

const Uexpected=G.div(G.add(...r.alpha.map((a,j)=>G.mul(a,bump(normalizedR,j)))),Rbase);
const Fexpected=G.div(G.add(...r.beta.map((a,j)=>G.mul(a,bump(normalizedR,j+2)))),G.mul(Rbase,R));
const patchFieldIdentities=[
  rat(G.sub(node(Ucor).args[4],Uexpected),"actual Ipos U correction",[...r.alpha,bump(normalizedR,0),bump(normalizedR,1)]),
  rat(G.sub(node(Fcor).args[4],Fexpected),"actual Ipos F correction",[...r.beta,...r.beta.map((_,j)=>bump(normalizedR,j+2))])
];
const matrixEntries=[];
const matrix=(id,j,f,name)=>{
  const t=node(id).args[1];
  assert.notEqual(t,X,name+" shares caller coordinate");
  return {name,...literal(id,...supports[j],f(X),name)};
};
for(let j=0;j<2;j++){
  matrixEntries.push(matrix(r.Umat[0][j],j,t=>G.mul(t,bump(t,j)),"U first "+j));
  matrixEntries.push(matrix(r.Umat[1][j],j,t=>{
    const s=G.fresh("independentConfluent");
    const inner=G.integral(G.exp(G.mul(q(-2),lam,s)),s,z,G.log(t));
    return G.mul(t,bump(t,j),inner);
  },"U confluent "+j));
}
for(let j=0;j<3;j++){
  matrixEntries.push(matrix(r.Emat[0][j],j+2,t=>G.mul(G.pow(t,2),bump(t,j+2)),"E first "+j));
  matrixEntries.push(matrix(r.Emat[1][j],j+2,t=>G.mul(power(t,p),bump(t,j+2)),"E pressure "+j));
  matrixEntries.push(matrix(r.Emat[2][j],j+2,t=>G.mul(power(t,G.mul(q(-2),lam)),bump(t,j+2)),"E axial flux "+j));
}
const weights0=r.Umat[0].map((x,j)=>G.sub(x,G.mul(q(2),lam,r.Umat[1][j])));
const dot=(a,c)=>G.add(...a.map((x,j)=>G.mul(x,c[j])));
const corrections=[G.mul(Rbase,dot(r.Umat[0],r.alpha)),
  G.mul(G.pow(Rbase,2),dot(r.Emat[0],r.beta)),
  G.mul(q(2),ef,power(Rbase,p),dot(r.Emat[1],r.beta)),
  G.mul(ef,power(Rbase,G.sub(o,G.mul(q(2),lam))),dot(weights0,r.alpha)),
  G.neg(G.mul(ef,power(Rbase,G.mul(q(-2),lam)),dot(r.Emat[2],r.beta)))];
const correctionNodes=corrections.map((f,j)=>{
  const id=b.roots["actualOrderOneCorrectionMoment"+j];
  return eq(id,f,"same physical correction scale "+(j+1),[...r.alpha,...r.beta,...r.Umat.flat(),...r.Emat.flat()]);
});

const rho=G.fresh("ordinaryPositiveNormalizedRadial"),alphaDensity=G.fresh("retainedAlphaBumpDensity"),
  betaDensity=G.fresh("retainedBetaBumpDensity"),basePow=power(Rbase,p),rhoPow=power(rho,p);
const jac=G.mul(G.pow(Rbase,2),rho),scaledR=G.mul(Rbase,rho),scaledX=G.mul(q(1,2),G.pow(scaledR,2));
const directJacobian=rat(G.sub(G.derivative(scaledX,rho),jac),"positive radial chart derivative",[Rbase,rho]);
const actualScaledU=G.div(alphaDensity,Rbase),actualScaledF=G.div(betaDensity,G.mul(Rbase,scaledR)),actualScaledF0=G.mul(ef,basePow,rhoPow);
const scaledPatch=local(z,actualScaledF0,actualScaledU,actualScaledF).map(f=>G.substitute(f,X,scaledX));
const factor=G.mul(ef,basePow,rhoPow),expectPull=[
  G.mul(Rbase,rho,alphaDensity),G.mul(G.pow(Rbase,2),G.pow(rho,2),betaDensity),
  G.mul(q(2),factor,betaDensity),
  G.mul(factor,G.pow(Rbase,3),G.pow(rho,3),alphaDensity),
  G.neg(G.mul(factor,G.pow(Rbase,2),G.pow(rho,2),betaDensity))
];
const pullbacks=scaledPatch.map((f,i)=>rat(G.sub(G.mul(jac,f),expectPull[i]),"positive radial Jacobian "+(i+1),
  [alphaDensity,betaDensity,basePow,rhoPow,ef,Rbase]));
const missingJacobian=sourceGraphRationalIdentity(G,G.sub(scaledPatch[4],expectPull[4]),
  {atomicNodes:[alphaDensity,betaDensity,basePow,rhoPow,ef,Rbase]});
assert(!missingJacobian.pass);
const powerShifts=[
  rat(G.sub(G.add(p,q(3)),G.sub(o,G.mul(q(2),lam))),"angular flux power"),
  rat(G.sub(G.add(p,q(2)),G.mul(q(-2),lam)),"axial flux pressure power")
];

const fields=primitives.prepared.records;
const globalF=fields[0].global.F,globalU=fields[0].global.U;
const globalF1=fields[1].global.F,globalU1=fields[1].global.U;
eq(globalF1,G.add(Ft,Fcor),"same actual globally cut F1");
eq(globalU1,G.add(Ut,Ucor),"same actual globally cut U1");
eq(globalU,U,"same actual leading U0");
const fullOmega=original.rows[0].omega.global;
const actualGlobalPressureDensity=original.pressureOne.independentFullRadialDensity;
const pressureFormula=G.sub(G.mul(q(2),globalF,globalF1),G.mul(q(1,2),fullOmega));
const fullPressureEq=rat(G.sub(actualGlobalPressureDensity,pressureFormula),"original Pi1 radial density",
  [globalF,globalF1,fullOmega]);
// Expand the original split once in an atom model with precisely the same field operands.
const globalLocal=local(U,globalF,Ut,Ft),globalPatch=local(U,globalF,Ucor,Fcor);
const independentDensities=local(U,globalF,G.add(Ut,Ucor),G.add(Ft,Fcor));
independentDensities[2]=G.sub(independentDensities[2],G.mul(q(1,2),fullOmega));
independentDensities[4]=G.add(independentDensities[4],G.mul(q(1,2),X,fullOmega));
const omegaParts=[z,z,G.mul(q(-1,2),fullOmega),z,G.mul(q(1,2),X,fullOmega)];
const densitySplits=independentDensities.map((f,j)=>rat(G.sub(f,G.add(globalLocal[j],globalPatch[j],omegaParts[j])),
  "local + Ipos + Omega "+(j+1),[U,globalF,Ut,Ft,Ucor,Fcor,fullOmega]));
const actualDensities=[globalU1,G.mul(q(2),X,globalF1),actualGlobalPressureDensity,
  G.mul(q(2),X,G.add(G.mul(globalU,globalF1),G.mul(globalU1,globalF))),
  G.sub(G.mul(q(2),globalU,globalU1),G.mul(X,actualGlobalPressureDensity))];
const wholeDensities=actualDensities.map((f,j)=>literal(integral(f,G.fresh("derivedOrdinaryWholeMoment"+j),z,Xplus),
  z,Xplus,f,"whole physical "+(j+1)));
const packet={schema:"MathScope.OrderOneActualWholeMomentDenotation/1",status:"CONDITIONAL_ORDER_ONE_PHYSICAL_MOMENTS_BOUND_TO_ORIGINAL_SOURCE",
  pins,collarSHA256,originalPrefix:{nodes:117100,sha256:prefixSHA256},originalN1PressurePrefixNodes:original.program.nodes.length,
  endpoints:{Xkeep,Xcut,X0,IposRight,Xv,Xplus},
  localRows,incoming,correctionNodes,
  omega:{originalPressure:b.pressureOmega,originalFlux:b.fluxOmega,rows:omegaRows,wholeBodies:omegaWhole,omegaDensityIdentity,
    prefixes:{pressure:fullP,flux:fullQ,originalPrefixBindings,samePressurePrefix,radialFTCCopies:prefixFTC},
    continuity:C0,ordinaryDerivatives:omegaFTC,axisChecks,axisVEquality,
    literalZeroExteriorJets:vExterior.map(x=>({source:x.source,reduced:x.value})),missingFluxBoundaryRejected:true},
  patch:{Ucor,Fcor,U0IposZero:UatIpos.value,F0IposRoot:reservedF,
    fieldIdentities:patchFieldIdentities,matrixEntries,pullbacks,normalizedJacobian:jac,directJacobian,sourceInverseJacobian,
    physicalBumpEndpoints,powerShifts,missingJacobianRejected:true,repairCoefficientsRadialIndependent:true,
    proof:"R=Rbase*rho, X=R^2/2, dX=Rbase^2*rho drho with positive radii. r^a=exp(a*log(r)) gives real power splitting. The U confluent row is Rbase times rho*[1-2lambda*integral_0^log(rho) exp(-2lambda*s)ds]."},
  whole:{physicalMoments:wholeDensities,pressureDensityIdentity:fullPressureEq,densitySplits,
    rawResidual:previous.roots.raw,density:previous.roots.density,wholeStress:previous.roots.whole,
    originalResidualIds:previous.allFiveActualMomentRepairs.rows.map(x=>x.residual),
    semantics:"Disjoint fixed local and Ipos supports plus the two source-bound Omega functionals identify these whole integrals with the original incoming+correction nodes. No finite inverse is re-proved by this checker."},
  priorLeadingMass:{M,U,integral:leadingMassIntegral,axis:Maxis,exterior:Mexterior.value,
    originalSourceChecks:stream.checks.map(x=>x.id),outerMomentRows:stream.parts.outer.affineRows.map(x=>x.pass),
    necessary:"The original natural coefficient limit, B26, B8/C12/I1 exact-root restoration, fixed integrals, and outer affine mass restoration carry the ordinary piecewise M_X=U identity and matching constants. The preceding positive moment does not enter n=1."},
  scope:{ordinaryNativeIntegralAndLimitSemanticsRetained:true,originalDenominatorPremisesRetained:true,
    ordinaryChangeOfVariablesProofRequired:true,finiteMatrixCancellationRepeated:false,allN:false,release:"HOLD"}};
fs.writeFileSync(output,JSON.stringify(packet,null,2)+"\n");
console.log(JSON.stringify({status:packet.status,localRows:localRows.length,omegaHistories:omegaRows.length,
  bumpMatrixLiterals:matrixEntries.length,physicalDensitySplits:densitySplits.length,weightedDefectChecks:omegaFTC.length,originalLeadingMass:[M,U]}));
