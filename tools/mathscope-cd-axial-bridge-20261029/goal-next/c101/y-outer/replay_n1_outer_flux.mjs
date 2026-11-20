import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime,registry,c99dir,c100dir,taperDir,output]=process.argv.slice(2);
assert(output,'ORIGINAL_RUNTIME ORIGINAL_REGISTRY C99_Y C100_Y C101_TAPER NEW_JSON');
const sha=value=>createHash('sha256').update(value).digest('hex');
const read=async(path,pin)=>{
  const bytes=await readFile(path);
  assert.equal(sha(bytes),pin,path);
  return JSON.parse(bytes);
};
const C99Ops='d52bfc8ddd4a9987cd25d3d4a2161cc10e19d8d2ee7975f87ae2e7b68f8e27be';
const C100='17664f981265e2373a5c16d0bf3c9dc233af48605974de1e072520b9932b71de';
const C100Ops='afa75d0bba159592b4ce217dc06c9b871fb7137f9617291240370a53b1aad35f';
const C101Taper='867bc1d589edd923257c2250672ca66d1341847a914eba952ac2b645ed627f8a';
const old=await read(resolve(c99dir,'n1-ipos-transfer-operands.json'),C99Ops);
const current=await read(resolve(c100dir,'n1-radial-seams.json'),C100);
const currentSource=await read(resolve(c100dir,'n1-radial-seams-operands.json'),C100Ops);
const taper=await read(resolve(taperDir,'n1-taper-flux.json'),C101Taper);
assert.equal(current.operandsSHA256,C100Ops);
assert.equal(taper.priorC100ReceiptSHA256,C100);
assert.equal(current.exactCompensatedMomentsZero,5);
const archived=await read(registry,old.registrySHA);
for(const [name,pin] of Object.entries(currentSource.sourcePins))
  assert.equal(sha(await readFile(resolve(runtime,name))),pin,name);
const get=name=>import(pathToFileURL(resolve(runtime,name)));
const {prepareActualOrderInduction,assertActualOrderInduction}=await get('actual-residual-order-induction-source.mjs');
const {sourceGraphRationalIdentity}=await get('actual-continuation-exact-identities.mjs');
const {explicitPrimitiveBodyIdentity}=await get('actual-global-primitive-kernels.mjs');
const live=prepareActualOrderInduction({order:1,maxNodes:2000000});
assert.ok(assertActualOrderInduction(live));
const {G,bootstrap}=live,{inner,orderOne:r,constants:{X,eta}}=bootstrap;
assert.equal(sha(JSON.stringify(G.nodes)),old.originalPrefixSHA256);
assert.deepEqual(G.picardSystems,JSON.parse(archived.base.picard).slice(0,2));
const stress=bootstrap.program.orderOneStress,{angularTerms:th,axialTerms:ax}=stress;
assert.equal(stress.axialSupported,117047);
assert.deepEqual(stress.totalResidualIntegrals,[117072,117075]);
assert.ok(stress.supportOrder.pass);
assert.deepEqual([r.Xminus,r.Xkeep,r.Xcut,r.Xplus,r.Xb],[28814,28819,28823,28824,28826]);

const {A,D,d,L}=G.core,q=(n,f=1)=>G.q(n,f),z=G.zero,o=G.one;
const {F1,U1,v1,Pi1,M1,M1overX,alpha,beta:betaBumps,Rbase:rb}=r;
const F0=bootstrap.actualHeat.heat.finalF,U0=bootstrap.finalU,v0=bootstrap.finalv;
const dx=id=>G.derivative(id,X),de=id=>G.derivative(id,eta);
const l=inner.lambda1,lambda=G.parameter('lambda');
const c=G.neg(A),b=G.neg(G.add(A,q(1,2))),gamma=G.add(c,l),beta=G.add(b,l);
const Z=(power,f)=>G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(power,f),G.mul(X,dx(f)))),
  G.mul(d,de(f))),L);
const T=(power,f)=>G.div(G.add(G.neg(G.mul(power,f)),G.mul(D,eta,de(f)),G.mul(X,dx(f))),L);
const pow=(id,e)=>G.exp(G.mul(e,G.log(id)));
const radial=G.sqrt(G.mul(q(2),X)), x=G.div(radial,rb), X2=G.pow(X,2);
assert.equal(x,r.normalizedR);
const sourceMomentAtoms=[...r.moments,...r.localMoments,...alpha,...betaBumps,r.ef,rb];
const fieldAtoms=[F0,U0,v0,F1,U1,v1,Pi1,M1,M1overX,...[F0,U0,v0,F1,U1,v1,Pi1].flatMap(v=>[dx(v),de(v)])];
const identities=[];
function verify(label,actual,expected,atoms=fieldAtoms){
  const proof=sourceGraphRationalIdentity(G,G.sub(actual,expected),{atomicNodes:atoms});
  assert.ok(proof.pass,label);
  const result={label,actual,expected,numeratorMonomials:proof.numeratorMonomials};
  identities.push(result);
  return result;
}
verify('positive-radius-coordinate-jacobian',dx(x),G.div(o,G.mul(rb,radial)),[rb,radial]);
verify('original-axial-pressure-exponent',G.add(c,gamma),q(-1));
verify('original-weighted-angular-exponents-c-beta',G.add(c,beta),q(-3,2));
verify('original-weighted-angular-exponents-gamma-b',G.add(gamma,b),q(-3,2));
verify('leading-continuity-coefficient',G.sub(o,D),G.neg(c));
verify('order-one-continuity-coefficient',G.sub(G.sub(o,D),l),G.neg(gamma));
verify('same-original-order-one-radial-velocity',v1,G.div(G.sub(
  G.sub(G.mul(q(2),eta,U1),G.mul(q(2),eta,G.add(D,l),M1overX)),
  G.mul(d,de(M1overX))),L));

const ua=Z(c,U0),ub=Z(gamma,U1);
// These are expanded boundary derivatives after substituting the two
// ordinary continuity identities d_X(Xv_j)=-Z_{c_j}(U_j).
const radialAxProduct=G.add(G.mul(X,v0,dx(U1)),G.mul(X,v1,dx(U0)),
  G.neg(G.mul(ua,U1)),G.neg(G.mul(ub,U0)));
const axialProduct=G.mul(U0,U1),axialJ=G.add(G.mul(q(2),axialProduct),Pi1);
verify('axial-source-convective-group',G.add(...ax.slice(1,6)),
  G.add(radialAxProduct,Z(q(-1),axialJ)));
const radialThetaProduct=G.mul(q(2),G.add(
  G.mul(X,v0,dx(G.mul(X,F1))),G.mul(X,v1,dx(G.mul(X,F0))),
  G.neg(G.mul(ua,X,F1)),G.neg(G.mul(ub,X,F0))));
const thetaProduct=G.add(G.mul(U0,F1),G.mul(U1,F0)),thetaJ=G.mul(q(2),X,thetaProduct);
verify('weighted-angular-source-convective-group',G.mul(q(2),X,G.add(...th.slice(1,5))),
  G.add(radialThetaProduct,G.mul(q(2),X,Z(q(-3,2),thetaProduct))));
const axialZBoundary=G.div(G.mul(q(-2),eta,dx(G.mul(X,axialJ))),L);
verify('axial-J-conservative-prefix',Z(q(-1),axialJ),
  G.add(axialZBoundary,G.div(G.mul(d,de(axialJ)),L)));
const thetaZBoundary=G.div(G.mul(q(-4),eta,dx(G.mul(X2,thetaProduct))),L);
verify('weighted-angular-J-conservative-prefix',G.mul(q(2),X,Z(q(-3,2),thetaProduct)),
  G.add(thetaZBoundary,G.div(G.add(G.mul(eta,thetaJ),G.mul(d,de(thetaJ))),L)));
verify('axial-time-mass-prefix',T(gamma,U1),G.div(G.add(dx(G.mul(X,U1)),
  G.neg(G.mul(G.add(gamma,o),U1)),G.mul(D,eta,de(U1))),L));
const weightedF=G.mul(q(2),X,F1);
verify('weighted-angular-time-prefix',G.mul(q(2),X,T(beta,F1)),G.div(G.add(
  dx(G.mul(q(2),X2,F1)),G.neg(G.mul(G.add(beta,q(2)),weightedF)),G.mul(D,eta,de(weightedF))),L));

const scaleP=G.mul(q(2),r.ef,pow(rb,G.sub(q(-2),G.mul(q(2),lambda))));
const Fpos=G.mul(r.ef,pow(radial,G.sub(q(-2),G.mul(q(2),lambda))));
const width=q(1,2048);
const bump=(s,j)=>G.div(G.step(G.div(G.sub(s,r.supports[j][0]),width),1),width);
const dU=G.choose(X,r.X0,r.IposRight,z,G.div(G.add(...alpha.map((v,j)=>G.mul(v,bump(x,j)))),rb),z);
const dE=G.div(G.add(...betaBumps.map((v,j)=>G.mul(v,bump(x,j+2)))),rb);
const dF=G.choose(X,r.X0,r.IposRight,z,G.div(dE,radial),z);
assert.equal(U1,G.add(old.sourceRoots.localU,dU));
assert.equal(F1,G.add(old.sourceRoots.localF,dF));
const primalBump=(coefficients,offset,weight,totals,prefix)=>G.add(...coefficients.map((u,j)=>{
  const k=j+offset, t=G.fresh(prefix+j);
  const integral=G.integral(G.mul(weight(t),bump(t,k)),t,r.supports[k][0],x);
  return G.mul(u,G.choose(x,...r.supports[k],z,integral,totals[j]));
}));
const correctionM=G.mul(rb,primalBump(alpha,0,t=>t,r.Umat[0],'C101_outer_mass_'));
const correctionP=G.mul(scaleP,primalBump(betaBumps,2,
  t=>pow(t,G.sub(q(-2),G.mul(q(2),lambda))),r.Emat[1],'C101_outer_pressure_'));
const branches=G.nodes[M1],pressureBranches=G.nodes[Pi1];
function summands(id){
  const n=G.nodes[id];
  return n.op==='add'?n.args.flatMap(summands):[id];
}
const findSummand=(body,expected)=>summands(body).find(id=>
  explicitPrimitiveBodyIdentity(G,id,expected,{atomicNodes:sourceMomentAtoms}).pass);
const massMatched=findSummand(branches.args[4],correctionM);
const pressureMatched=findSummand(pressureBranches.args[4],correctionP);
assert.notEqual(massMatched,undefined);
assert.notEqual(pressureMatched,undefined);
const lastAngular=G.mul(r.X0,G.pow(r.supports[4][1],2));
const lastAxial=G.mul(r.X0,G.pow(r.supports[1][1],2));
assert.equal(branches.args[2],lastAxial);
const allMass=G.mul(rb,G.add(...alpha.map((u,j)=>G.mul(u,r.Umat[0][j]))));
const allPres=G.mul(scaleP,G.add(...betaBumps.map((u,j)=>G.mul(u,r.Emat[1][j]))));
verify('saturated-original-mass-prefix',r.momentResiduals[0],G.add(r.moments[0],allMass),sourceMomentAtoms);
verify('saturated-original-pressure-prefix',r.momentResiduals[2],G.add(r.moments[2],allPres),sourceMomentAtoms);
const compactPressureDerivative=G.choose(X,r.X0,r.IposRight,z,G.mul(q(2),Fpos,dF),z);
const data={schema:'MathScope.C101.OriginalN1OuterConservativeErrorOperands/1',
  prior:{C99Ops,C100,C100Ops,C101Taper},originalPrefixSHA256:old.originalPrefixSHA256,
  actualSourceIntegrals:{axialBody:117047,axialTotal:117075,angularTotal:117072},
  sourceRoots:{X,eta,cut:r.Xcut,Xpos:r.X0,IposRight:r.IposRight,lastAxial,lastAngular,
    Xplus:r.Xplus,Xb:r.Xb,normalizedRadius:x,radial,rb,scaleP,Fpos,dU,dF,compactPressureDerivative,
    completePressureOmega:bootstrap.pressureOmega,completeFluxOmega:bootstrap.fluxOmega},
  restoredMoments:[...r.momentResiduals],flatSourceSupports:r.supports,
  primitives:{massActual:massMatched,massRebuilt:correctionM,pressureActual:pressureMatched,
    pressureRebuilt:correctionP,matchedTwoMassAndThreePressureBumps:true},
  identities,ordinaryContinuityUsed:true};
await writeFile(output,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({identities:identities.length,lastAngular,Xplus:r.Xplus,axialBody:117047}));
