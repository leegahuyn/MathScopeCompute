import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,oldManifest,output]=process.argv.slice(2);
assert.ok(output,'Give original runtime, immutable C112 order-12 manifest and fresh output');
const sha=b=>createHash('sha256').update(b).digest('hex');
const historical='fd58cbfe5bfbef7bda341de896f9c6dab114bcd15cfffe4b4f663bfa69a5c0be';
assert.equal(sha(await readFile(oldManifest)),historical);
const pins={
  'actual-residual-order-induction-source.mjs':'30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
  'actual-residual-order-induction-expressions.mjs':'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501',
  'actual-positive-global-stress.mjs':'77227cd74000f5b6d4bec0361106af21d8020b2eee1eb979c1adc9ec3aae97d1',
  'actual-global-conservative-moments.mjs':'e2f21cb108137a49e29cb17aa4bbf66e8971e106dbb446a276f6821a72c29221',
  'actual-residual-order-induction-proof.mjs':'ca7149281d52e609664f90dea14c2ca2009ac982fc3087ec8714f0152de831f7',
  'actual-positive-global-stress-kernel.mjs':'c666add7eba6063a9a701c5633f33a81a37b1ed0a4650af19a2142f76b6efb8f',
  'actual-continuation-exact-order-one.mjs':'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72',
  'actual-global-pressure-convolution.mjs':'169d12967c1f0a57b1f1e07f7d98c732b5831a048f7517e731bf4fe4955d6d2b',
  'actual-continuation-exact-support.mjs':'0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98',
  'actual-leading-stream-primitive.mjs':'4a9a1d28d9ee7cea2d776fe73bdeed3a95dbe62fdb50a51fa536d3ccc55667de',
  'actual-background-residual-bridge.mjs':'a0d2823ee658aadff65171441c06c9cb0f52ac7115be948e17600d343fd5788a',
  'actual-continuation-exact-order-two-source.mjs':'1ebf8b2b6f1df054a06309c5dc8695f2f3a867733544ab012f206bfed2969dd0',
  'actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'actual-continuation-exact-identities.mjs':'bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712',
};
const source=Object.fromEntries(await Promise.all(Object.entries(pins).map(async([name,pin])=>{
  const bytes=await readFile(resolve(runtime,name));assert.equal(sha(bytes),pin,name);return [name,bytes.toString()];
})));
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const induction='actual-residual-order-induction-source.mjs',adapter='actual-positive-global-stress.mjs';
function boundSource(name,markers){
  return markers.map(marker=>{
    const at=source[name].indexOf(marker);assert.ok(at>=0,name+': '+marker);
    return {line:source[name].slice(0,at).split('\n').length,token:marker};
  });
}
const anchors={
  construction:boundSource(induction,[
    'for(let n=1;n<=order;n++)',
    'records.slice(0,n).some(r=>!r.global.completed)',
    "raw=sourceSystem(G,bootstrap,records,n,'actual',norm)",
    'global=completeOrder(G,bootstrap,records,n,raw,actual,context);stress=attachStress(G,bootstrap,records,n,global)',
    'global={order:1,F:share(r.F1',
    'stress=bootstrap.stress',
    'xi,eta,diagonal:[0,0,2,0,3,1]',
    'G.picardEven(system,0,X,eta)',
    "fields=Array.from({length:n},(_,i)=>i===0?records[0][kind]:records[i][kind])",
    'all=[...records.slice(0,n).map(r=>r.global),tuple]',
    'for(let i=0;i<=n;i++){const j=n-i;',
    'theta.push(G.mul(v[i],G.add(G.mul(X,Fx[j]),F[j])),G.mul(U[i],Z(G.add(b,nu(j)),F[j])))',
    'axial.push(G.mul(X,v[i],Ux[j]),G.mul(U[i],Z(G.add(c,nu(j)),U[j])))',
    'thetaBody=G.mul(q(2),X,G.choose(X,Xminus,Xplus,z,rawTheta,z))',
    'G.integral(G.substitute(body,X,t),t,a,b)',
    'G.neg(G.div(integrate(thetaBody,Xminus,X),G.mul(q(2),X)))',
    'G.neg(G.div(integrate(zBody,Xminus,X),G.sqrt(G.mul(q(2),X))))',
    'backwardTheta:G.div(integrate(thetaBody,X,Xplus),G.mul(q(2),X))',
    'backwardZ:G.div(integrate(zBody,X,Xplus),G.sqrt(G.mul(q(2),X)))']),
  moments:boundSource('actual-global-conservative-moments.mjs',[
    "fullPressureDerivative=currentPressure.independent.fullRadialDensity",
    'densities=[g.U,G.mul(q(2),X,g.F),fullPressureDerivative',
    'G.add(...allPairs.map(([i,j])=>G.mul(q(2),X,fullU[i],fullF[j])))',
    'G.sub(G.add(...allPairs.map(([i,j])=>G.mul(fullU[i],fullU[j]))),G.mul(X,fullPressureDerivative))',
    'allOrderedPairsRetained:true',
  ]),
  binding:boundSource(adapter,[
    'function actualRawCoefficient(moments,n,context)',
    'sourceInner=verifyActualInductionInnerEquations(prepared,{order:n,kind:',
    'actualMomentFamilies:m[n],lowerMomentFamilies:[m[n-1][1],m[n-1][0]]',
    'originalTotal=n===1?(component===',
    'derivativeLimits:[2]',
    'allFixedEtaDerivatives:true',
    'const s=live.get(result)',
    'for(let n=1;n<=moments.request.throughOrder;n++)']),
  base:boundSource('actual-continuation-exact-order-one.mjs',[
    'M1=G.choose(X,Xkeep,lastU,G.mul(X,axisAverage),unclosedM,z)',
    'G.add(D,inner.lambda1),M1overX',
    'Xminus<Xkeep<Xcut<a^2',
    'heat-compensated leading difference identity (5.19)']),
  leading:boundSource('actual-leading-stream-primitive.mjs',[
    'original-C12-pre-U-is-same-pre-C12-source',
    'original-global-v-is-the-same-stream-reconstruction',
    'M_X=U gives L(v+X v_X)+d U_eta-2A eta U-2eta X U_X=0']),
  pressure:boundSource('actual-global-pressure-convolution.mjs',[
    'commonCore:{domain:[G.zero,facts.a],F0:targets.F,U0:targets.U,v0:targets.v',
    'The original Omega wrapper must keep its complete cutoff-local and global representatives.']),
  support:boundSource('actual-continuation-exact-support.mjs',[
    'allEndpointsIndependentOfEta:',
    'Xminus<Xkeep<Xcut<a^2<IposLeft<IposRight<Xv<Xplus<Xb']),
  firstStress:boundSource('actual-background-residual-bridge.mjs',[
    "right=component==='theta'&&n===1?Xb:Xplus",
    "n===1?record.stress.angular:record.stress.rawTheta",
    "n===1?record.stress.axial:record.stress.rawZ"]),
};

const {ActualConvergentExpressions}=await load('actual-continuation-exact-functions.mjs');
const {ActualInductionExpressions}=await load('actual-residual-order-induction-expressions.mjs');
const {sourceScaledOperators}=await load('actual-continuation-exact-order-two-source.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const stressKernel=await load('actual-positive-global-stress-kernel.mjs');
const originalTotal=stressKernel.originalPositiveConservativeTotalIdentity();
const originalSplit=stressKernel.originalSignedStressSplitIdentity();
assert.ok(originalTotal.pass&&originalSplit.pass);
const G=new ActualInductionExpressions(new ActualConvergentExpressions(),{maxDerivativeOrder:16});
const q=(u,v=1)=>G.q(u,v),add=(...x)=>G.add(...x),m=(...x)=>G.mul(...x),sub=(x,y)=>G.sub(x,y);
const {D,d,L,A,eta}=G.core,X=G.fresh('induction_proof_X'),xx=G.fresh('induction_visible_X'),ee=G.fresh('induction_visible_eta'),
  freeI=G.fresh('positive_pair_i'),freeJ=G.fresh('positive_pair_j'),freeN=G.fresh('positive_stage_n'),h=G.parameter('h');
const at=x=>G.simultaneousSubstitute(x,[X,eta],[xx,ee]);
const dx=x=>G.derivative(x,X),de=x=>G.derivative(x,eta);
const dx0=sub(X,xx),de0=sub(eta,ee);
const atoms=[xx,ee,freeI,freeJ,freeN,h];
function jet(label){
  const ys=Array.from({length:6},(_,k)=>G.fresh(label+'_'+k));atoms.push(...ys);
  return add(ys[0],m(dx0,ys[1]),m(de0,ys[2]),m(q(1,2),G.pow(dx0,2),ys[3]),m(dx0,de0,ys[4]),m(q(1,2),G.pow(de0,2),ys[5]));
}
const check=(a,b)=>sourceGraphRationalIdentity(G,at(sub(a,b)),{atomicNodes:atoms,maxTerms:100000});
const {T,Z}=sourceScaledOperators(G,X,eta),c=k=>add(G.neg(A),m(q(2),h,k)),a=k=>sub(c(k),q(1,2));
const zeta=k=>add(m(q(-2),A),m(q(2),h,k)),tau=k=>add(zeta(k),q(1,2));
const U=jet('U_i'),u=jet('U_j'),f=jet('F_j'),V=jet('V_i'),Vmass=jet('M'),P=jet('Pi_n'),Q=jet('sumUU'),g=jet('total_g');
const defect=add(dx(V),Z(c(freeI),U)),phi=m(q(2),X,f),v=G.div(V,X),jAccum=add(freeI,freeJ);
const zTerm=add(m(V,dx(u)),m(U,Z(c(freeJ),u)));
const tTerm=m(q(2),X,add(m(v,add(f,m(X,dx(f)))),m(U,Z(a(freeJ),f))));
const zRight=sub(add(dx(m(V,u)),Z(zeta(jAccum),m(U,u))),m(defect,u));
const tRight=sub(add(dx(m(V,phi)),Z(tau(jAccum),m(U,phi))),m(defect,phi));
const zetabar=(e,f)=>G.div(add(m(q(2),eta,e,f),m(d,de(f))),L);
const tbar=(e,f)=>G.div(add(G.neg(m(e,f)),m(D,eta,de(f))),L);
const bZ=f=>G.neg(G.div(m(q(2),eta,X,f),L)),bT=f=>G.div(m(X,f),L);
const previous=sub(freeN,q(1));
const derivedMassDefect=add(dx(G.div(sub(sub(m(q(2),eta,X,U),m(q(2),eta,add(D,m(q(2),h,freeI)),Vmass)),m(d,de(Vmass))),L)),Z(c(freeI),U));
const rho=sub(dx(Vmass),U);
const retainedMassDefect=G.neg(G.div(add(m(q(2),eta,add(D,m(q(2),h,freeI)),rho),m(d,de(rho))),L));
const adjustedPress=sub(Q,m(X,dx(P)));
const checks={
  freeAxialTransport:check(zTerm,zRight),
  freeWeightedAngularTransport:check(tTerm,tRight),
  sourceMassDefect:check(derivedMassDefect,retainedMassDefect),
  independentAxialExponent:check(add(c(freeI),c(freeJ)),zeta(jAccum)),
  independentAngularExponent:check(add(c(freeI),a(freeJ),q(1)),tau(jAccum)),
  timeBox:check(T(freeN,g),add(tbar(add(freeN,q(1)),g),dx(bT(g)))),
  axialBox:check(Z(freeN,g),add(zetabar(add(freeN,q(1)),g),dx(bZ(g)))),
  weightedTime:check(m(q(2),X,T(a(freeN),f)),T(add(a(freeN),q(1)),phi)),
  weightedPreviousDoubleZ:check(m(q(2),X,Z(sub(a(previous),D),Z(a(previous),f))),
    Z(add(sub(a(previous),D),q(1)),Z(add(a(previous),q(1)),phi))),
  radialViscosityAxial:check(m(q(-2),add(m(X,dx(dx(g))),dx(g))),dx(m(q(-2),X,dx(g)))),
  radialViscosityTheta:check(m(q(-4),X,add(m(X,dx(dx(f))),m(q(2),dx(f)))),dx(m(q(-4),G.pow(X,2),dx(f)))),
  pressureBoundary:check(sub(add(Q,P),adjustedPress),dx(m(X,P))),
  pressureBoundaryEta:check(de(sub(add(Q,P),adjustedPress)),dx(de(m(X,P)))),
};
const neg={
  omittedAxialContinuityDefect:check(zTerm,add(zRight,m(defect,u))),
  missingAngularWeight:check(tTerm,sub(add(dx(m(V,f)),Z(tau(jAccum),m(U,f))),m(defect,f))),
  missingPressureBoundary:check(add(Q,P),adjustedPress),
  wrongPreviousIndex:check(Z(sub(a(previous),D),Z(a(previous),f)),Z(sub(a(freeN),D),Z(a(freeN),f))),
};
assert.ok(Object.values(checks).every(x=>x.pass));
assert.ok(Object.values(neg).every(x=>!x.pass));
const zeros=Object.fromEntries(Object.entries(checks).map(([name,proof])=>[name,proof.numeratorMonomials]));
const nonzeros=Object.fromEntries(Object.entries(neg).map(([name,proof])=>[name,proof.numeratorMonomials]));

// Reproduce the original adapter's exact [2] family materialization cap
// in the same graph class. This is only a limit witness, not a sampled
// mathematical counterexample or a substitute for any original moment.
const familyBody=G.pow(eta,4),sys=G.defineExpressionFunction({name:'adapter_family_resource_witness',parameters:[eta],body:familyBody,derivativeLimits:[2]});
for(let k=0;k<=2;k++)assert.deepEqual(G.nodes[G.expressionValue(sys,[eta],[k])].args,[sys,[eta],[k]]);
let rejected;
try{G.expressionValue(sys,[eta],[3]);}catch(e){assert.equal(e.code,'RESOURCE_LIMIT');rejected=e.message;}
assert.equal(rejected,'The shared body derivative budget is exhausted.');
const radial1=G.fresh('independent_forward_radial'),radial2=G.fresh('independent_backward_radial');
const low=G.parameter('Xa'),high=G.parameter('XR'),testDensity=G.share(add(m(X,eta),G.pow(X,2)),[X,eta],'bound_coordinate_kernel_density');
const int1=G.integral(G.substitute(testDensity,X,radial1),radial1,low,X);
const int2=G.integral(G.substitute(testDensity,X,radial2),radial2,X,high);
const sameDensity=(left,right)=>check(G.substitute(G.nodes[left].args[0],G.nodes[left].args[1],X),
  G.substitute(G.nodes[right].args[0],G.nodes[right].args[1],X));
assert.ok(sameDensity(int1,int2).pass);
for(const [item,b,a] of [[int1,low,X],[int2,X,high]]){
  const [integrand,t,l,r]=G.nodes[item].args;
  assert.deepEqual([l,r],[b,a]);
  assert.deepEqual([...G.freeCoordinates(item)].sort((x,y)=>x-y),[eta,X].sort((x,y)=>x-y));
  assert.equal(G.derivative(item,eta),G.integral(G.derivative(integrand,eta),t,l,r));
}
const wrongEta=G.integral(G.simultaneousSubstitute(testDensity,[X,eta],[radial2,X]),radial2,X,high);
assert.ok(!sameDensity(int1,wrongEta).pass);
const actual={schema:'MathScope.C117.OriginalPositiveOrderStructuralConservation/1',
  originalSourceSHA256:pins,c112HistoricalManifestSHA256:historical,anchors,indeterminateOrdinaryIdentityNumerators:zeros,
  negativeControls:nonzeros,originalExistingKernels:{total:originalTotal.schema,split:originalSplit.schema,
    totalChecks:Object.keys(originalTotal.checks),finiteOrderSamplesUsed:false},sourceInduction:{
    measure:'ordered pair index i from 0 through n, j=n-i, successful completed 5-moment rows at every earlier positive index',
    specializedHomogeneities:'c_i=-A+2ih, a_i=c_i-1/2; nu_n=2nh and mu_n=nu_n-2h',
    genuineNativeEta:'same coordinate in Xi Picard composition, whole profiles, fresh radial binders, and original source guard',
    leadingBase:'M0_X=U0 original full stream at N0; N1 uses original complete mass and subtracted angular identity (5.19), theta upper Xb and z upper Xplus',
    nAtLeastTwo:'fixed each mathematical n; same recurrence and three boundary stages, assuming ordinary regularity and admitted original source realization',
    pressureFifthMoment:'sum Ui Uj-X Pi_n,X; exact retained boundary [X Pi_n]',
    proofScope:'independent exact algebra with free indices and hash-pinned source loop structure; not a proof of arbitrary numerical materialization or convergence of infinite sum'},
  adapterBoundary:{actualSourceFamilyEtaLimit:2,thirdDerivativeRequest:rejected,mathematicalZeroAllFixedOrdersRequiresOrdinaryMomentRegularity:true},
  binderKernel:{radialBindersIndependent:true,bothLimitsFixedUnderEta:true,wrongCoordinateSubstitutionRejected:true},
  noFiniteOrderArgumentForStructuralIdentities:true,infiniteAssembly:'OPEN',generalY:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(actual,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({numerators:zeros,negative:nonzeros,adapterLimit:actual.adapterBoundary.actualSourceFamilyEtaLimit}));
