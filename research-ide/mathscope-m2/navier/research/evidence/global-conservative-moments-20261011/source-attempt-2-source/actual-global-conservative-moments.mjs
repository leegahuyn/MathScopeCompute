/** Actual all-order schema for the five GLOBAL coefficient moments.
 * The original finite prefix, pressure primitive and leading stream proof
 * are the only field operands.  No moment value, derivative, source field,
 * boundary constant or completion flag can be injected by a caller.
 */
import {prepareActualGlobalPressureConvolution,assertActualGlobalPressureConvolution} from './actual-global-pressure-convolution.mjs';
import {explicitPrimitiveBodyIdentity} from './actual-global-primitive-kernels.mjs';
import {reduceExpressionOnDeclaredBranches,rewriteExactPressureOperands} from './actual-global-pressure-kernels.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {reduceLiteralZeroDerivatives} from './actual-strengthened-background-kernels.mjs';
import {originalLeadingOmegaFluxIdentity,originalPositiveContinuityDefectIdentity,originalConservativePairAndWeightIdentities,originalConfluentBumpMomentIdentity,originalIposFiveDensityJacobianIdentity} from './actual-global-conservative-moments-kernel.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const live=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  data=p=>({source:p.source,request:p.request,sourceBinding:p.sourceBinding,generic:p.generic,leadingIpos:p.leadingIpos,
    omegaFlux:p.omegaFlux,matrix:p.matrix,rows:p.rows,continuity:p.continuity,roots:p.roots,checks:p.checks,scope:p.scope,remaining:p.remaining});
const requirePass=(p,label)=>{if(!p.pass)fail('INVALID_SOURCE_CONSTRUCTION',label);return p;};
const body=(G,id)=>{const n=G.nodes[id];return n.op==='actual_expression_partial'&&n.args[2].every(x=>x===0)
  ?body(G,G.materializeExpressionFunction(n.args[0],n.args[1],n.args[2])):id;};
const equal=(G,a,b,atomicNodes=[],label='The original conservative moment body changed.')=>
  requirePass(explicitPrimitiveBodyIdentity(G,a,b,{atomicNodes,maxVisits:600000}),label);
const algebra=(G,difference,atomicNodes=[],label='The actual conservative moment algebra did not cancel.')=>
  requirePass(sourceGraphRationalIdentity(G,difference,{atomicNodes,maxTerms:100000}),label);

function actualLiteralFTC(G,primitive,X,density,atomicNodes=[]){
  const n=G.nodes[primitive];if(n.op!=='definite_integral')fail('INVALID_SOURCE_CONSTRUCTION','The actual whole/prefix moment must retain a literal integral.');
  const [integrand,variable,left,right]=n.args;
  if(G.dependsOn(integrand,X)||G.dependsOn(left,X))fail('INVALID_SOURCE_CONSTRUCTION','The actual prefix has a moving integrand or lower endpoint.');
  const derivative=G.derivative(primitive,X),reduced=reduceLiteralZeroDerivatives(G,derivative,{atomicNodes}),
    endpoint=G.substitute(integrand,variable,right),expected=G.mul(density,G.derivative(right,X));
  return {primitive,integrand,variable,left,right,density,derivative,reduced,expected,
    densityCheck:equal(G,endpoint,density,atomicNodes),derivativeCheck:equal(G,reduced.value,expected,atomicNodes),
    fixedLowerEndpoint:true,integrandFreeOfExternalX:true,pass:true};
}

/** Bind the independent original fluxOmega, using its own five whole
 * density integrals. The derived primitive is explicitly distinguished
 * from a primitive originally stored by the old constructor.
 */
function actualOmegaFlux(pressure,context){
  const {G,primitives:{prepared:{bootstrap:b}}}=pressure,{X,eta,Xv}=b.constants,q=(n,d=1)=>G.q(n,d),{A,D,d,L}=G.core,
    U=b.finalU,v=b.finalv,Ux=G.derivative(U,X),Ueta=G.derivative(U,eta),vX=G.derivative(v,X),vXX=G.derivative(vX,X),veta=G.derivative(v,eta),
    jets=[U,Ux,Ueta,v,vX,vXX,veta],w=b.originalLeading.program.weightedOmega,
    definitions={J0:{whole:w.integrals[1],density:G.mul(X,v)},J0eta:{whole:w.derivativeIntegrals.J0eta,density:G.mul(X,veta)},
      H0:{whole:w.integrals[3],density:G.mul(X,U,v)},H0eta:{whole:w.derivativeIntegrals.H0eta,density:G.mul(X,G.derivative(G.mul(U,v),eta))},
      K1:{whole:w.integrals[5],density:G.mul(X,G.pow(v,2))}};
  if(!same(w.names,['Jminus1','J0','Hminus1','H0','Kminus2','Kminus1'])||w.flux!==b.fluxOmega)
    fail('INVALID_SOURCE_CONSTRUCTION','Retain the original complete weighted Omega flux history.');
  context.onProgress?.({phase:'conservative-leading-Omega-flux-start',nodes:G.nodes.length});
  const rows=Object.fromEntries(Object.entries(definitions).map(([name,row])=>{
    const n=G.nodes[row.whole];if(n.op!=='definite_integral'||n.args[2]!==G.zero||n.args[3]!==Xv)
      fail('INVALID_SOURCE_CONSTRUCTION','The original flux Omega moment does not span the whole [0,Xv] history.');
    const wholeDensity=G.substitute(n.args[0],n.args[1],X),densityCheck=equal(G,wholeDensity,row.density,jets),
      t=G.fresh('actual_conservative_flux_'+name),integrand=G.substitute(n.args[0],n.args[1],t),primitive=G.integral(integrand,t,G.zero,X),
      ftc=actualLiteralFTC(G,primitive,X,row.density,jets),completed=G.integral(integrand,t,G.zero,Xv),
      // Bound-X fields are not free atoms under an alpha-renamed binder.
      wholeCheck=equal(G,completed,row.whole,[],'The original '+name+' whole weighted density or endpoint changed.');
    return [name,{...row,wholeDensity,densityCheck,primitive,ftc,completed,wholeCheck}];
  })),p=Object.fromEntries(Object.entries(rows).map(([k,r])=>[k,r.primitive])),whole=Object.fromEntries(Object.entries(rows).map(([k,r])=>[k,r.whole])),
    moment=G.sub(G.div(G.add(G.mul(D,eta,p.J0eta),G.neg(p.J0),G.mul(d,p.H0eta),G.mul(q(2),D,eta,p.H0)),G.mul(q(2),L)),G.mul(q(1,4),p.K1)),
    boundary=G.mul(G.pow(X,2),G.add(G.div(v,G.mul(q(2),L)),G.neg(G.div(G.mul(eta,U,v),L)),G.mul(q(1,2),G.pow(v,2)),G.neg(vX))),
    prefix=G.add(moment,boundary),derivative=G.derivative(prefix,X),
    rewritten=rewriteExactPressureOperands(G,derivative,{replacements:new Map(Object.values(rows).map(r=>[r.ftc.derivative,r.ftc.expected])),atomicNodes:jets,maxVisits:600000}),
    continuity=G.add(G.mul(L,G.add(v,G.mul(X,vX))),G.mul(d,Ueta),G.mul(q(-2),A,eta,U),G.mul(q(-2),eta,X,Ux)),
    continuityCheck=equal(G,continuity,pressure.omegaPrefix.continuityExpression,jets),factor=G.div(G.mul(X,v,continuity),G.mul(q(2),L)),
    actualOmega=pressure.omegaPrefix.originalOmega,
    factorization=algebra(G,G.sub(G.sub(rewritten.value,G.mul(q(1,2),X,actualOmega)),factor),jets),
    expectedWhole=G.sub(G.div(G.add(G.mul(D,eta,whole.J0eta),G.neg(whole.J0),G.mul(d,whole.H0eta),G.mul(q(2),D,eta,whole.H0)),G.mul(q(2),L)),G.mul(q(1,4),whole.K1)),
    wholeCheck=equal(G,b.fluxOmega,expectedWhole,Object.values(whole));
  if(!pressure.stream.scope.actualLeadingContinuityIdentity||!pressure.omegaPrefix.pass||
    !pressure.omegaPrefix.exterior.zeroExterior.U.pass||!pressure.omegaPrefix.exterior.zeroExterior.v.pass)
    fail('INVALID_SOURCE_CONSTRUCTION','The SAME actual continuity, regular axis and full exterior must precede the weighted Omega flux identity.');
  context.onProgress?.({phase:'conservative-leading-Omega-flux-bound',nodes:G.nodes.length});
  return {sourceWhole:b.fluxOmega,rows,derivedPrefix:prefix,derivedBoundary:boundary,derivative,rewritten,continuity,continuityCheck,factor,factorization,wholeCheck,
    actualOmega,actualGlobalOmega:pressure.rows[0].omega.global,
    axis:{endpoint:G.zero,regularSource:pressure.omegaPrefix.axis.actualNaturalSource,
      reason:'The original natural v,U and fixed jets are finite at the axis. All five prefixes vanish at coincident endpoints and the entire new boundary carries X^2.',divisionByZeroEvaluated:false},
    exterior:{endpoint:Xv,originalPressureAudit:pressure.omegaPrefix.source,
      reason:'The SAME original U,v exterior and all fixed jets are zero at Xv. Each new prefix equals its separately checked original whole density integral there, so the derived primitive equals the original fluxOmega.'},
    theorem:'integral_0^Xv X*OmegaOverX(X,eta)/2 dX equals the ORIGINAL source fluxOmega(eta). It has the same value over [0,Xplus] because the actual global Omega is zero after Xv.',
    newPrimitiveDerivedFromOriginalWholeDensities:true,originalFluxOperandChanged:false,callerPrimitiveAccepted:false,pass:true};
}

function flatStepValues(G,b){
  const {X}=b.constants,q=(n,d=1)=>G.q(n,d),values=new Map();
  for(let j=0;j<5;j++)for(const argument of [
    G.div(G.sub(G.div(X,G.parameter('XR')),q(j+6,2048)),q(1,4096)),
    G.div(G.sub(G.div(X,G.parameter('X0I1')),q(j+9)),q(1,2))])
    for(let k=0;k<=3;k++)values.set(G.step(argument,k),k?G.zero:G.one);
  return values;
}

/** U0 is zero during the actual reserved-power wait.  Its accumulated
 * M0 and v0 are deliberately NOT declared zero on that interval.
 */
function actualLeadingIposU(pressure){
  const {G,primitives:{prepared:{bootstrap:b}}}=pressure,{X}=b.constants,
    support=pressure.primitives.sourceSupport,{Xa,XR,Xi,restLeft,restRight}=b.originalLeading.pre.constants,
    tail=support.leadingExterior,pulse=G.outer.stages.find(s=>s.id==='pulse'),
    after=new Set([Xa,XR,Xi,restLeft,restRight,b.constants.Iright,b.constants.I1Right,...tail.physicalRightEnds]),
    q=(n,d=1)=>G.q(n,d),
    exactStart=G.add(G.parameter('T'),q(2),G.mul(q(60),G.parameter('BOuter'))),
    pulseCheck=algebra(G,G.sub(pulse.start,exactStart)),
    reduced=reduceExpressionOnDeclaredBranches(G,b.finalU,{coordinate:X,stepValues:flatStepValues(G,b),maxVisits:600000,
      selectPiecewise:p=>{
        if(p.coordinate===X&&after.has(p.right))return 5;
        if(p.coordinate===tail.tailLogCoordinate&&p.left===G.zero&&p.right===pulse.length)return 3;
        return null;
      }}),zero=reduceLiteralZeroDerivatives(G,reduced.value);
  if(!support.pass||!pressure.leadingRestrictions.ipos.pass||zero.value!==G.zero)
    fail('INVALID_SOURCE_CONSTRUCTION','The actual complete U0 must be zero on the original Ipos interval; no accumulated stream is discarded.');
  const globalSource=pressure.primitives.prepared.records[0].global.U,globalSourceCheck=equal(G,globalSource,b.finalU);
  return {source:b.finalU,globalSource,globalSourceCheck,domain:[b.orderOne.X0,b.orderOne.IposRight],
    reduced,zero,pulseCheck,sourceSupport: support.parameterExpressionSHA256,
    endpointProof:'The original Ipos logarithmic interval is [pulse.start-14,pulse.start-9]. The decay, B8, C12 and I1 corrections end earlier by the pinned source inequalities; the original axial pulse begins at pulse.start. Every chosen branch is therefore valid on all of Ipos.',
    originalF0OnSameInterval:pressure.leadingRestrictions.ipos.reservedF,
    accumulatedM0Discarded:false,v0AssumedZero:false,pass:true};
}

function actualMatrixMoments(pressure){
  const {G,primitives:{prepared:{bootstrap:b}}}=pressure,r=b.orderOne,q=(n,d=1)=>G.q(n,d),
    lambda=G.parameter('lambda'),width=q(1,2048),power=(x,p)=>G.exp(G.mul(p,G.log(x))),
    bump=(x,j)=>G.div(G.step(G.div(G.sub(x,r.supports[j][0]),width),1),width),rows=[];
  const checkIntegral=(name,original,j,density)=>{
    const n=G.nodes[original];if(n.op!=='definite_integral'||n.args[2]!==r.supports[j][0]||n.args[3]!==r.supports[j][1])
      fail('INVALID_SOURCE_CONSTRUCTION','Every Ipos matrix row must retain its full original bump interval.');
    const t=n.args[1],expected=density(t),check=equal(G,n.args[0],expected);
    rows.push({name,original,boundVariable:t,sourceDensity:n.args[0],expectedDensity:expected,left:n.args[2],right:n.args[3],check});
  };
  for(let j=0;j<2;j++){
    checkIntegral('U-first-'+j,r.Umat[0][j],j,t=>G.mul(t,bump(t,j)));
    checkIntegral('U-confluent-'+j,r.Umat[1][j],j,t=>{const s=G.fresh('actual_conservative_U_confluent');
      return G.mul(t,bump(t,j),G.integral(G.exp(G.mul(q(-2),lambda,s)),s,G.zero,G.log(t)));});
  }
  for(let j=0;j<3;j++){
    checkIntegral('E-first-'+j,r.Emat[0][j],j+2,t=>G.mul(G.pow(t,2),bump(t,j+2)));
    checkIntegral('E-pressure-'+j,r.Emat[1][j],j+2,t=>G.mul(power(t,G.sub(q(-2),G.mul(q(2),lambda))),bump(t,j+2)));
    checkIntegral('E-axial-flux-'+j,r.Emat[2][j],j+2,t=>G.mul(power(t,G.mul(q(-2),lambda)),bump(t,j+2)));
  }
  if(!Object.values(r.proof.checks).every(Boolean))fail('INVALID_SOURCE_CONSTRUCTION','The actual continuous source inverse domain must remain valid.');
  const exponent=G.sub(q(-2),G.mul(q(2),lambda)),powerAdditionChecks={
    UAngularFlux:algebra(G,G.sub(G.add(exponent,q(3)),G.sub(G.one,G.mul(q(2),lambda)))),
    EAxialFlux:algebra(G,G.sub(G.add(exponent,q(2)),G.mul(q(-2),lambda)))};
  return {rows,fullContinuousMatrices:{U:r.Umat,E:r.Emat},originalInverseProof:r.proof,powerAdditionChecks,
    radialChangeOfVariables:'R=Rbase*u, X=R^2/2, dX=Rbase^2*u du. All supports have u>1 and are disjoint.',
    transformedDensityWeights:['Rbase*u','Rbase^2*u^2','2*ef*Rbase^(-2-2lambda)*u^(-2-2lambda)',
      'ef*Rbase^(1-2lambda)*u^(1-2lambda)','-ef*Rbase^(-2lambda)*u^(-2lambda)'],
    originalUSecondRow:'Umat[0]-2*lambda*Umat[1], by the separately executed continuous FTC identity.',
    lambdaReplacedByZero:false,finiteMomentSamplesUsed:false,pass:true};
}

function literalWholeDensityCheck(G,whole,X,left,right,expected,atoms=[]){
  const n=G.nodes[body(G,whole)];if(n.op!=='definite_integral'||n.args[2]!==left||n.args[3]!==right)
    fail('INVALID_SOURCE_CONSTRUCTION','The original moment lost a complete integration endpoint.');
  const density=G.substitute(n.args[0],n.args[1],X),check=equal(G,density,expected,atoms);
  return {whole,integrand:n.args[0],variable:n.args[1],left,right,density,expected,check};
}

function positiveMomentRow(pressure,n,omegaFlux,matrix,context){
  const {G,primitives:{prepared}}=pressure,b=prepared.bootstrap,r=prepared.records[n],g=r.global,{X,eta}=b.constants,
    q=(n,d=1)=>G.q(n,d),z=G.zero,{Rbase,ef,Umat,Emat,supports,X0,IposRight,Xcut,Xplus}=b.orderOne,
    lambda=G.parameter('lambda'),power=(x,p)=>G.exp(G.mul(p,G.log(x))),dot=(a,b)=>G.add(...a.map((v,j)=>G.mul(v,b[j]))),
    width=q(1,2048),R=G.sqrt(G.mul(q(2),X)),u=G.div(R,Rbase),bump=(x,j)=>G.div(G.step(G.div(G.sub(x,supports[j][0]),width),1),width),
    dU=G.choose(X,X0,IposRight,z,G.div(G.add(...g.alpha.map((a,j)=>G.mul(a,bump(u,j)))),Rbase),z),
    dF=G.choose(X,X0,IposRight,z,G.div(G.add(...g.beta.map((a,j)=>G.mul(a,bump(u,j+2)))),G.mul(Rbase,R)),z),
    localU=r.actual.U,localF=r.actual.F,inner=prepared.records[0].actual,
    localBodies=[localU,G.mul(q(2),X,localF),G.mul(q(2),inner.F,localF),
      G.mul(q(2),X,G.add(G.mul(inner.U,localF),G.mul(localU,inner.F))),
      G.sub(G.mul(q(2),inner.U,localU),G.mul(q(2),X,inner.F,localF))],
    originalLocal=n===1?b.program.momentRepair.localIntegrands:g.localBodies,
    fieldChecks={U:equal(G,g.U,G.add(localU,dU)),F:equal(G,g.F,G.add(localF,dF))},
    localRows=localBodies.map((density,j)=>({j,sourceBody:originalLocal[j],bodyCheck:equal(G,originalLocal[j],density),
      ...literalWholeDensityCheck(G,g.localMoments[j],X,z,Xcut,density)})),
    lowerPairs=Array.from({length:Math.max(0,n-1)},(_,j)=>[j+1,n-j-1]),allPairs=Array.from({length:n+1},(_,i)=>[i,n-i]),
    fullF=prepared.records.map(v=>v.global.F),fullU=prepared.records.map(v=>v.global.U),
    lowerF=G.add(...lowerPairs.map(([i,j])=>G.mul(fullF[i],fullF[j]))),
    lowerUF=G.add(...lowerPairs.map(([i,j])=>G.mul(q(2),X,fullU[i],fullF[j]))),
    lowerFlux=G.add(...lowerPairs.map(([i,j])=>G.sub(G.mul(fullU[i],fullU[j]),G.mul(X,fullF[i],fullF[j])))),
    sourceOmega=pressure.rows[n-1].omega.source,
    lowerPressure=G.sub(lowerF,G.mul(q(1,2),sourceOmega)),
    lowerAxial=G.add(lowerFlux,G.mul(q(1,2),X,sourceOmega)),
    currentPressure=pressure.rows[n-1],expectedIncoming=[g.localMoments[0],g.localMoments[1]],incomingChecks=[],lowerRows=[];
  context.onProgress?.({phase:'conservative-actual-five-moments-start',order:n,nodes:G.nodes.length});
  if(n===1){
    expectedIncoming.push(G.sub(g.localMoments[2],b.pressureOmega),g.localMoments[3],G.add(g.localMoments[4],b.fluxOmega));
    if(!omegaFlux.pass||!pressure.omegaPrefix.pass)fail('INVALID_SOURCE_CONSTRUCTION','Both complete original weighted Omega moments are required at order one.');
    lowerRows.push({moment:3,originalWhole:b.pressureOmega,sourcePrefix:pressure.omegaPrefix.source,fullOmega:currentPressure.omega.global,
      proof:'The independently verified original P_Omega primitive gives the whole integral OmegaOverX/2, including its actual axis constant.'},
      {moment:5,originalWhole:b.fluxOmega,sourcePrefix:omegaFlux.derivedPrefix,fullOmega:currentPressure.omega.global,
        proof:'The new independently verified weighted primitive gives the whole integral X*OmegaOverX/2 from the original fluxOmega history.'});
  }else{
    for(const[j,expected]of [[0,lowerF],[1,lowerUF],[2,lowerFlux]])equal(G,g.lowerBodies[j],expected);
    equal(G,g.lowerPressure,lowerPressure);
    for(const[j,density]of [[2,lowerPressure],[3,lowerUF],[4,lowerAxial]]){
      const whole=body(G,g.incoming[j]),node=G.nodes[whole],parts=[];
      const collect=id=>{const x=G.nodes[id];if(x.op==='add')x.args.forEach(collect);else parts.push(id);};collect(whole);
      const integrals=parts.filter(id=>G.nodes[id].op==='definite_integral'&&id!==g.localMoments[j]);
      if(integrals.length!==1)fail('INVALID_SOURCE_CONSTRUCTION','The actual lower global moment must keep its one complete lower integral.');
      const check=literalWholeDensityCheck(G,integrals[0],X,z,Xplus,density,[...fullF,...fullU,sourceOmega]);
      lowerRows.push({moment:j+1,...check});expectedIncoming[j]=G.add(g.localMoments[j],integrals[0]);
    }
  }
  for(let j=0;j<5;j++)incomingChecks.push(equal(G,g.incoming[j],expectedIncoming[j],[...g.localMoments,b.pressureOmega,b.fluxOmega]));
  const originalUrow=Umat[0].map((v,j)=>G.sub(v,G.mul(q(2),lambda,Umat[1][j]))),
    R1=power(Rbase,G.sub(G.one,G.mul(q(2),lambda))),Rp=power(Rbase,G.sub(q(-2),G.mul(q(2),lambda))),Rz=power(Rbase,G.mul(q(-2),lambda)),
    corrections=[G.mul(Rbase,dot(Umat[0],g.alpha)),G.mul(G.pow(Rbase,2),dot(Emat[0],g.beta)),
      G.mul(q(2),ef,Rp,dot(Emat[1],g.beta)),G.mul(ef,R1,dot(originalUrow,g.alpha)),G.neg(G.mul(ef,Rz,dot(Emat[2],g.beta)))],
    originalCorrections=n===1?b.orderOne.correctionMoments:g.correctionMoments,
    correctionChecks=corrections.map((value,j)=>equal(G,originalCorrections[j],value,[...g.alpha,...g.beta,...Umat.flat(),...Emat.flat()])),
    residuals=g.incoming.map((value,j)=>G.add(value,originalCorrections[j])),
    checks=residuals.map(value=>algebra(G,value,g.incoming)),
    fullPressureDerivative=currentPressure.independent.fullRadialDensity,
    densities=[g.U,G.mul(q(2),X,g.F),fullPressureDerivative,
      G.add(...allPairs.map(([i,j])=>G.mul(q(2),X,fullU[i],fullF[j]))),
      G.sub(G.add(...allPairs.map(([i,j])=>G.mul(fullU[i],fullU[j]))),G.mul(X,fullPressureDerivative))],
    fullMoments=densities.map((density,j)=>{const t=G.fresh('actual_global_moment_'+n+'_'+j),f=G.share(density,[X,eta],'ActualFullGlobalMomentDensity'+n+'_'+j);
      return G.integral(G.substitute(f,X,t),t,z,Xplus);}),
    negative=sourceGraphRationalIdentity(G,G.sub(residuals[4],originalCorrections[4]),{atomicNodes:g.incoming});
  if(!matrix.pass||!currentPressure.pass||!currentPressure.pressurePrimitiveProved||!g.actualMomentChecks.every(p=>p.pass)||negative.pass)
    fail('INVALID_SOURCE_CONSTRUCTION','The actual whole pressure, continuous inverse or fifth-moment omission control failed.');
  context.onProgress?.({phase:'conservative-actual-five-moments-bound',order:n,nodes:G.nodes.length});
  return {order:n,allPairs,lowerPairs,fieldChecks,actualCorrections:{dU,dF,alpha:g.alpha,beta:g.beta},localRows,lowerRows,incomingChecks,
    originalIncoming:g.incoming,originalCorrections,correctionChecks,originalMomentResiduals:residuals,checks,negativeControls:{fifthCorrectionOmitted:negative},
    actualFullDensities:densities,actualWholeIntegrals:fullMoments,
    sourcePressureDerivative:g.pressureDerivative,independentFullPressureDerivative:fullPressureDerivative,
    globalDensityIdentification:{commonCore:pressure.leadingRestrictions.commonCore.domain,Ipos:[X0,IposRight],
      local:'On the entire actual local support the complete F0,U0 equal the checked original core representatives. Every retained local density has been compared above, including the original kappa factor.',
      patch:'On Ipos the complete F0 equals the checked original reserved power and U0=0 by the separate original branch check. Thus the current five patch densities have exactly the five weights in matrix.transformedDensityWeights. The actual alpha and beta solutions remain their operands.',
      lower:'Every ordered interior pair i,j>=1 is retained in the independently assembled lower bodies. The original Omega wrapper equals the full global Omega by the private pressure proof, on the core, middle and exterior.',
      whole:'Integrate the checked disjoint local and Ipos pieces and the complete lower bodies over [0,Xplus]. Every literal continuous matrix moment and every source lower integral has the original full endpoints. This yields exactly incoming+correction, as an identity of functions of eta.',
      pressure:'The same private global pressure primitive has zero axis and exterior values. Hence integration by parts gives integral(Pi_n)=-integral(X*Pi_n,X), including every original join.',
      actualLeadingHeatOmitted:false,actualLeadingStreamDiscarded:false,allOrderedPairsRetained:true},
    theorem:'For these original generated fields all five actual whole integrals are identically zero on eta in [-1,1], with every fixed eta derivative. Their zero value follows from the executed original inverse equation only after the source density and whole-moment identifications above.',
    sourceAllOrderRule:'Apply the same explicit full lower convolution at any positive integer n; finite-query graph budgets do not cap this algebraic schema.',
    pass:true};
}

function positiveContinuity(pressure,n,generic){
  const {G,primitives:{prepared}}=pressure,b=prepared.bootstrap,r=prepared.records[n],g=r.global,{X,eta}=b.constants,
    q=(n,d=1)=>G.q(n,d),{A,D,d,L}=G.core,nu=G.mul(q(2*n),G.parameter('h')),
    average=body(G,g.average),av=G.nodes[average],M=body(G,g.M),mn=G.nodes[M],
    sourceAverage=n===1?average:g.average,sourceU=n===1?body(G,g.U):g.U,
    expectedV=G.div(G.sub(G.sub(G.mul(q(2),eta,sourceU),G.mul(q(2),eta,G.add(D,nu),sourceAverage)),G.mul(d,G.derivative(sourceAverage,eta))),L),
    reconstruction=equal(G,g.v,expectedV),mass=pressure.primitives.rows[n-1].mass;
  if(av.op!=='smooth_piecewise'||mn.op!=='smooth_piecewise'||av.args[0]!==X||av.args[1]!==b.orderOne.Xkeep||
    av.args[2]!==mass.branches[1]||av.args[5]!==G.zero||mn.args[5]!==G.zero||!mass.pass||r.raw.lambda!==nu)
    fail('INVALID_SOURCE_CONSTRUCTION','The original positive average must keep its actual mass/X and regular core branches.');
  const coreMassCheck=equal(G,mn.args[3],G.mul(X,av.args[3])),middleCheck=equal(G,av.args[4],G.div(M,X)),
    delta=G.add(G.derivative(G.mul(X,g.v),X),G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(G.add(G.neg(A),nu),g.U),G.mul(X,G.derivative(g.U,X)))),G.mul(d,G.derivative(g.U,eta))),L));
  return {order:n,sourceU:g.U,sourceM:g.M,sourceAverage:g.average,sourcev:g.v,sourceExponent:nu,reconstruction,coreMassCheck,middleCheck,
    originalContinuityDefect:delta,generic:generic.schema,actualMassPrimitive:mass.source,
    proof:'For X>0 the checked original average equals M/X in both active branches and in the exact moment-closed exterior. The original M_X=U proof and its eta derivative make both mass defects in the independent arbitrary-n kernel zero. The original natural/Picard parity supplies the regular X=0 limit.',
    accumulatedMassDiscarded:false,defectExpressionRetained:true,pass:true};
}

export function attachActualGlobalConservativeMoments(pressure,context={}){
  assertActualGlobalPressureConvolution(pressure);const {G}=pressure,
    sourceBinding={...pressure.sourceBinding,parentProducer:'actual-global-pressure-convolution.mjs:attachActualGlobalPressureConvolution',
      fullGlobalPressureAndOriginalM0PrivateSealsChecked:true,originalFinitePrefixRecompiled:false},
    generic={omegaFlux:originalLeadingOmegaFluxIdentity(),continuity:originalPositiveContinuityDefectIdentity(),
      conservative:originalConservativePairAndWeightIdentities(),confluent:originalConfluentBumpMomentIdentity(),densityJacobian:originalIposFiveDensityJacobianIdentity()},
    leadingIpos=actualLeadingIposU(pressure),omegaFlux=actualOmegaFlux(pressure,context),matrix=actualMatrixMoments(pressure),rows=[],continuity=[];
  for(let n=1;n<=pressure.request.throughOrder;n++){
    context.checkCancelled?.();rows.push(positiveMomentRow(pressure,n,omegaFlux,matrix,context));continuity.push(positiveContinuity(pressure,n,generic.continuity));
  }
  const roots={actualOriginalOmegaFlux:omegaFlux.sourceWhole,actualDerivedOmegaFluxPrefix:omegaFlux.derivedPrefix,
    actualDerivedOmegaFluxPrefixDerivative:omegaFlux.derivative,
    ...Object.fromEntries(rows.flatMap(r=>r.actualWholeIntegrals.flatMap((v,j)=>[
      ['n'+r.order+'_actualWholeMoment'+(j+1),v],['n'+r.order+'_originalMomentResidual'+(j+1),r.originalMomentResiduals[j]]
    ]))),
    ...Object.fromEntries(continuity.map(r=>['n'+r.order+'_originalContinuityDefect',r.originalContinuityDefect]))},
    result={G,pressure,source:pressure.source,request:{throughOrder:pressure.request.throughOrder},sourceBinding,generic,leadingIpos,omegaFlux,matrix,rows,continuity,roots,
      checks:[{id:'actual-U0-reserved-interval-zero',pass:leadingIpos.pass},{id:'original-weighted-Omega-flux-history',pass:omegaFlux.pass},
        {id:'all-original-continuous-matrix-densities',pass:matrix.pass},...rows.map(r=>({id:'actual-global-five-moment-densities-n'+r.order,pass:r.pass})),
        ...continuity.map(r=>({id:'actual-global-stream-continuity-n'+r.order,pass:r.pass}))],
      scope:{actualOriginalWeightedOmegaFluxPrimitive:true,actualGlobalFiveMomentDensitiesBound:true,actualGlobalPositiveContinuity:true,
        allOrderPositiveMomentSchemaDescribed:true,allGeneratedOrdersExecuted:rows.length,actualGlobalTangentialStressCancellation:false,
        leadingOrderZeroResidualCancelled:false,allOrderPhysicalResidualFlatness:false,wholeGN4Complete:false,newLeanKernelProof:false,m3MayStart:false},
      remaining:['The conservative residual-to-total and stress-boundary adapter is separate from this five-moment density proof.',
        'The actual leading n=0 stress/pressure cancellation and an infinite common-cutoff residual/flat-error theorem are not claimed.']};
  const packed=G.pack(roots,{schema:'MathScope.ActualGlobalConservativeMomentsProgram/1',...data(result)}),{nodes,...metadata}=packed;
  result.program={...structuredClone(metadata),nodes:G.nodes.slice()};
  live.set(result,{G,pressure,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(data(result)),program:canonicalStringify(result.program)});
  return result;
}

export function prepareActualGlobalConservativeMoments(input={},context={}){
  return attachActualGlobalConservativeMoments(prepareActualGlobalPressureConvolution(input,context),context);
}

export function assertActualGlobalConservativeMoments(result){
  const s=live.get(result);if(!s||s.G!==result.G||s.pressure!==result.pressure||canonicalStringify(data(result))!==s.data||
    canonicalStringify(result.program)!==s.program||canonicalStringify(result.G.nodes.slice(0,s.count))!==s.prefix||!result.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged internally produced actual global moment proof.');
  assertActualGlobalPressureConvolution(result.pressure);return true;
}

export async function actualGlobalConservativeMomentsCertificate(result){
  assertActualGlobalConservativeMoments(result);const encoded=canonicalStringify(result.program);
  return {schema:'MathScope.ActualGlobalConservativeMomentsCertificate/1',...data(result),graph:{sha256:await sha256(encoded),
    nodeCount:result.program.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length,fixedCompilerPrefix:true}};
}
