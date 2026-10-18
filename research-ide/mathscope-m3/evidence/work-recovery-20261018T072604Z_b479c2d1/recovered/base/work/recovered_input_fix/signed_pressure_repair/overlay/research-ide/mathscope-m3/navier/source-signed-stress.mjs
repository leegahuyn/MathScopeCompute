/** Actual-current-residual signed stress on one authenticated source member.
 *
 * The target is Corollary8.5 applied to the current full-curl covariance,
 * pressure and compatibility defects. The original H and positive a are
 * fixed. This constructs a selected finite wave update; it does not make
 * the missing temporal/moment initialization, all-label sum or class tail.
 */
import {assertActualCurrentMeanState} from './source-current-state.mjs';
import {assertActualCurrentPressure} from './source-pressure.mjs';
import {assertActualNavierHigherJetExpressions,materializeActualHigherExpressionClosure} from './source-higher-jets.mjs';
import {exactCylindricalHarmonicCurl,normalizeEqualPiecewiseBranches} from '../../mathscope-m2/navier/actual-full-curl.mjs';
import {exactSignedCovarianceInverse,exactCovarianceResidualExpansion} from '../../mathscope-m2/navier/actual-physical-residual-algebra.mjs';
import {assertSlowSignedTargetCoordinates} from '../../mathscope-m2/navier/actual-common-physical-jet-kernel.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap();
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});};
const names=['rr','rtheta','rz','thetatheta','thetaz','zz'],pairs=[[0,0],[0,1],[0,2],[1,1],[1,2],[2,2]];
const data=p=>({schema:p.schema,source:p.source,target:p.target,inverse:p.inverse,rows:p.rows,updated:p.updated,checks:p.checks,scope:p.scope});
const dot=(G,a,b)=>G.add(...a.map((v,i)=>G.mul(v,b[i])));
const cross=(G,a,b)=>[G.sub(G.mul(a[1],b[2]),G.mul(a[2],b[1])),G.sub(G.mul(a[2],b[0]),G.mul(a[0],b[2])),G.sub(G.mul(a[0],b[1]),G.mul(a[1],b[0]))];
const shared=(G,body,name)=>{const coordinates=[...G.freeCoordinates(body)].sort((a,b)=>a-b);return coordinates.length?G.share(body,coordinates,name):body;};
function equal(G,left,right,atomicNodes=[]){
  const n=normalizeEqualPiecewiseBranches(G,G.sub(left,right),atomicNodes);
  return {...sourceGraphRationalIdentity(G,n.normalized,{atomicNodes,maxTerms:180000}),left,right,equalBranchNormalization:n.identities};
}
function sourceGuard(G,physical,body){
  const m=physical.geometry,{xi,v}=m.coordinates;
  let out=G.choose(v,G.zero,m.Ls,G.zero,body,G.zero);
  out=G.choose(xi,G.neg(m.r0),m.r0,G.zero,out,G.zero);
  out=G.choose(m.X,m.Xa,m.Xb,G.zero,out,G.zero);
  for(const axis of [...physical.slowCutoff.meshAxes,physical.slowCutoff.bandAxis])out=G.choose(axis.offset,...axis.activeOffsetInterval,G.zero,out,G.zero);
  return out;
}

/** A narrow exact integral-linearity proof. Every named integral is checked
 * against its retained body before its source name is used in reduction.
 * Nonlinear or variable-dependent factors are never pulled outside.
 */
export function normalizePressureMeanIntegral(G,state){
  const g=state.mean.geometry,{R,radialVariable:r,innerRadius:left,outerRadius:right}=g,
    at=body=>G.substitute(body,R,r),P=state.mean.P,
    Pdefinition=G.materializeExpressionFunction(...G.nodes[P].args),
    known=new Map([[at(state.mean.gr),{value:P,definition:Pdefinition}],[at(g.unnormalized),{value:g.rhoMass,definition:g.rhoMass}]]),steps=[];
  for(const [body,row]of known){
    const integral=G.integral(body,r,left,right);
    if(integral!==row.definition)fail('A pressure normalization name is not the original full radial integral.');
    steps.push({rule:'retained defining integral',integral,value:row.value,definition:row.definition});
  }
  const integrate=body=>{
    if(known.has(body))return known.get(body).value;
    const n=G.nodes[body];
    if(!G.freeCoordinates(body).has(r))return G.mul(body,G.sub(right,left));
    if(n.op==='add'){
      const result=G.add(...n.args.map(integrate));steps.push({rule:'finite integral additivity',body,result});return result;
    }
    if(n.op==='multiply'){
      const constant=n.args.findIndex(x=>!G.freeCoordinates(x).has(r));
      if(constant>=0){const result=G.mul(n.args[constant],integrate(n.args[1-constant]));steps.push({rule:'radial-independent scalar factor',body,result,constant:n.args[constant]});return result;}
    }
    return G.integral(body,r,left,right);
  };
  const source=at(state.mean.pressure.source),retainedIntegral=G.integral(source,r,left,right),normalized=integrate(source),check=equal(G,normalized,G.zero,[P,g.rhoMass]);
  if(retainedIntegral!==state.mean.pressure.totalSource||!check.pass)fail('The actual mean pressure source did not have its exactly normalized zero integral.');
  return {retainedIntegral,normalized,steps,check,sourceBody:state.mean.pressure.source,
    positiveDenominator:{expression:g.rhoMass,reason:'The same nonzero positive smooth bump is integrated over its whole support inside the original mean patch.'},
    numericalQuadratureUsed:false,zeroIntegralIsAConsequenceNotAnInput:true,sourceAuthenticated:false};
}

function currentStressTarget(G,state){
  const {physical,mean}=state,g=mean.geometry,{R,Z}=g,{epsilon}=physical.band.geometry,q=(n,d=1)=>G.q(n,d),
    integral=body=>G.integral(G.substitute(body,R,g.radialVariable),g.radialVariable,g.innerRadius,g.outerRadius),
    primitive=body=>G.integral(G.substitute(body,R,g.radialVariable),g.radialVariable,g.innerRadius,R),
    W=state.covariance.fullAuxiliaryMean,E=[mean.residual.Etheta,mean.residual.Ez],
    expectedMoments=[G.mul(epsilon,G.derivative(mean.Jtheta,Z)),G.mul(epsilon,G.derivative(G.add(mean.Jz,G.mul(g.cRho,mean.P)),Z))],
    sigma=[G.div(g.rho,G.pow(R,2)),G.div(g.rho,R)],
    normalizedBumpIdentities=sigma.map((x,j)=>equal(G,G.mul(G.pow(R,2-j),x),g.rho,[g.rho,R])),
    pressureMeanNormalization=normalizePressureMeanIntegral(G,state),
    radialFlux=[G.mul(G.pow(R,2),G.sub(W.rtheta,mean.residual.fullOriginalStress[0])),G.mul(R,G.sub(W.rz,mean.residual.fullOriginalStress[1]))],
    axialFlux=[G.mul(G.pow(R,2),W.thetaz),G.mul(R,G.add(W.zz,mean.pressure.value))],
    weightedResidualIdentities=E.map((f,j)=>equal(G,G.mul(G.pow(R,2-j),f),
      G.add(G.derivative(radialFlux[j],R),G.mul(epsilon,G.derivative(axialFlux[j],Z))),
      [R,epsilon,...Object.values(W),...mean.residual.fullOriginalStress,mean.pressure.value])),
    sources=E.map((f,j)=>G.sub(f,G.mul(sigma[j],expectedMoments[j]))),
    integrals=sources.map((f,j)=>{
      const e=2-j,weighted=G.mul(G.pow(R,e),f),I=primitive(weighted),J=integral(weighted),
        value=G.neg(G.div(G.sub(I,G.mul(g.chi,J)),G.pow(R,e))),
        cutoffRemainder=G.div(G.mul(G.derivative(g.chi,R),J),G.pow(R,e)),
        derivative=G.add(G.derivative(value,R),G.div(G.mul(q(e),value),R)),
        exactWithRemainder=equal(G,derivative,G.add(G.neg(f),cutoffRemainder),[f,J,g.chi,R]);
      return {weight:e,source:f,weightedSource:weighted,left:I,whole:J,value,cutoffRemainder,derivative,exactWithRemainder};
    }),Sigma=integrals.map((v,j)=>shared(G,v.value,'N6_CurrentSignedTarget_'+j)),
    zeroInitialMoments=Object.values(mean.initialMeanVelocity).every(x=>x===G.zero),
    sourceSupport={sourcePaletteAuthenticated:physical.geometry.palette.pass,
      radialEnvelopeFixed:g.checks.find(c=>c.id==='fixed-chart-radial-envelope-independent-of-R-Z-T')?.pass===true,
      wholeOriginalShell:[physical.geometry.Xa,physical.geometry.Xb],integrationEnvelope:[g.innerRadius,g.outerRadius],
      normalizedBandRange:['1/2','2'],meanPatch:g.supports,
      endpointReason:'Full wave products carry the original shell and slow guards. The unchanged background stress is shell-supported. On this band 1/2<=q/Q<=2; the fixed radial envelope encloses every support closure.'},
    compatibility={equations:['8.12','8.13','8.15','8.16','8.18'],weightedResidualIdentities,pressureMeanNormalization,normalizedBumpIdentities,
      zeroInitialMoments,sourceSupport,
      proofSteps:['Multiply the current two tangential equations by R^2 and R; the checked pointwise identities give a radial derivative and an axial flux derivative.',
        'Integrate at fixed (Z,T). The radial flux endpoint terms vanish by the retained source support, and the fixed integration endpoints allow the slow derivative to commute with this unshifted mean integral.',
        'The pressure source integral is exactly zero by the checked retained-integral linearity reduction, hence the auxiliary mean cutoff remainder and all its slow derivatives vanish.',
        'Integration by parts gives integral R*<p_m>=-1/2*integral R^2*<g_r>+c_rho*P. The full product c_rho*P stays inside partial_Z.',
        'The two normalized bumps have weighted integral1. Therefore each weighted stress source has integral0, and its torus-independent cutoff remainder is identically0 by Lemma8.2.'],
      result:'The literal retained Ic expressions satisfy (Dr+2/R)Htheta=-<Etheta>+sigma_theta*epsilon*partial_Z Jtheta and (Dr+1/R)Hz=-<Ez>+sigma_z*epsilon*partial_Z(Jz+c_rho*P).',
      method:'Exact retained-graph algebra plus source-supported FTC and integration by parts. This is not a new Lean kernel proof or a numerical enclosure.',
      allOrderClassBoundCertified:false};
  const checks=[...weightedResidualIdentities,...normalizedBumpIdentities,...integrals.map(x=>x.exactWithRemainder),pressureMeanNormalization.check];
  if(checks.some(c=>!c.pass)||!zeroInitialMoments||!sourceSupport.sourcePaletteAuthenticated||!sourceSupport.radialEnvelopeFixed)fail('The actual current signed target lost a source compatibility condition.');
  return {Sigma,E,expectedMoments,sigma,integrals,compatibility,checks,
    actualCurrentResidualUsed:true,callerSuppliedTargetUsed:false,fullProductCRhoPInsideDerivative:true,
    physicalBumpsFixedByRho:'sigma_theta=rho/R^2 and sigma_z=rho/R; their physical profiles are the same fixed mean-patch bump divided by x^2 and x.'};
}

export function attachActualCurrentSignedStress(state,pressure,G,context={}){
  assertActualCurrentMeanState(state);assertActualCurrentPressure(pressure);assertActualNavierHigherJetExpressions(G,state);
  if(pressure.state!==state)fail('The covariance target must use the pressure belonging to the same current velocity.');
  const physical=state.physical,b=physical.band,m=physical.geometry,{R,Z,xi,v,theta}=m.coordinates,{epsilon,k,Dgeom,ci,r0,Ls}=b.geometry,
    q=(n,d=1)=>G.q(n,d),target=currentStressTarget(G,state),coordinateDomain=assertSlowSignedTargetCoordinates(G,target.Sigma,b.coordinates),
    inverse=exactSignedCovarianceInverse(G,{H:b.target.H,amplitudes:b.target.squareRootWeights,epsilon,target:target.Sigma}),
    eta=physical.slowCutoff.body,rows=[],means=Object.fromEntries(names.map(n=>[n,[]]));
  context.onProgress?.({stage:'n6-actual-current-Corollary8_5-target-and-fixed-inverse',nodeCount:G.nodes.length});
  for(const [index,f]of b.families.entries()){
    const old=state.rows[index],oldPhysical=physical.rows[index],deltaA=inverse.deltaAmplitude[index],
      deltaAmplitude=f.t.map(t=>G.mul(G.sqrt(epsilon),deltaA,b.cutoffs.chi,b.cutoffs.psi,t)),
      coefficient=cross(G,f.frame.n,deltaAmplitude).map(x=>G.div(G.mul(eta,x),G.mul(k,f.frame.nSquared))),
      potential=coefficient.map((x,j)=>shared(G,x,'N6_ActualSignedPotential_'+f.sign+'_'+j)),
      curl=exactCylindricalHarmonicCurl(G,{R,Z,xi,epsilon,radialFast:m.radialFast,k,normal:f.frame.n,potential}),
      materializedCurlBodies=materializeActualHigherExpressionClosure(G,
        [...potential,...curl.radialDerivatives,...curl.axialDerivatives,curl.divergence.real,curl.divergence.imaginary],{onProgress:context.onProgress}),
      cos=G.cosine(G.mul(k,f.phase)),sin=G.sine(G.mul(k,f.phase)),
      fullOld=old.curl.leading.map((a,j)=>shared(G,G.sub(G.mul(a,cos),G.mul(old.curl.remainder[j],sin)),'N6_OldFull_'+f.sign+'_'+j)),
      W0=oldPhysical.weightedAmplitude.map((a,j)=>shared(G,G.mul(eta,a,cos),'N6_OriginalPrimary_'+f.sign+'_'+j)),
      linear=deltaAmplitude.map((a,j)=>shared(G,G.mul(eta,a,cos),'N6_SignedPrimary_'+f.sign+'_'+j)),
      fullDelta=curl.leading.map((a,j)=>shared(G,G.sub(G.mul(a,cos),G.mul(curl.remainder[j],sin)),'N6_SignedFull_'+f.sign+'_'+j)),
      previous=fullOld.map((a,j)=>G.sub(a,W0[j])),remainder=fullDelta.map((a,j)=>G.sub(a,linear[j])),
      expansion=exactCovarianceResidualExpansion(G,{primary:W0,previous,linearIncrement:linear,curlRemainder:remainder,target:target.Sigma}),
      updatedLeading=old.curl.leading.map((a,j)=>G.add(a,curl.leading[j])),updatedRemainder=old.curl.remainder.map((a,j)=>G.add(a,curl.remainder[j])),
      angularMean=Object.fromEntries(pairs.map(([a,b],j)=>[names[j],sourceGuard(G,physical,G.mul(q(1,2),
        G.add(G.mul(updatedLeading[a],updatedLeading[b]),G.mul(updatedRemainder[a],updatedRemainder[b]))))]));
    for(const name of names){
      const mean=G.mul(Dgeom,ci,G.integral(G.integral(angularMean[name],xi,G.neg(r0),r0),v,G.zero,Ls));
      means[name].push(shared(G,mean,'N6_UpdatedHaar_'+f.sign+'_'+name));
    }
    rows.push({sign:f.sign,fixedOriginalH:b.target.H,fixedOriginalA:b.target.squareRootWeights[index],deltaA,
      originalPhase:f.phase,originalRectangle:old.rectangle,deltaAmplitude,coefficient,potential,curl,materializedCurlBodies,
      originalFull:fullOld,originalPrimary:W0,primaryIncrement:linear,fullIncrement:fullDelta,previousCurlCorrection:previous,newCurlRemainder:remainder,
      expansion,updatedLeading,updatedRemainder,angularMean,fullSourceCutoffsAndGeometryRetained:true,
      noFreshSquareRootOfSignedTarget:true,sourceFieldBeforePeriodicEvaluation:true});
    context.onProgress?.({stage:'n6-current-signed-full-curl-and-three-remainders-'+f.sign,nodeCount:G.nodes.length});
  }
  const W=Object.fromEntries(names.map(n=>[n,shared(G,G.add(...means[n]),'N6_UpdatedFullMean_'+n)])),
    g=state.mean.geometry,integral=body=>G.integral(G.substitute(body,R,g.radialVariable),g.radialVariable,g.innerRadius,g.outerRadius),
    primitive=body=>G.integral(G.substitute(body,R,g.radialVariable),g.radialVariable,g.innerRadius,R),
    de=(f,e)=>G.add(G.derivative(f,R),G.div(G.mul(q(e),f),R)),dz=f=>G.mul(epsilon,G.derivative(f,Z)),
    gr=shared(G,G.add(G.neg(de(W.rr,1)),G.neg(dz(W.rz)),G.div(W.thetatheta,R)),'N6_SignedUpdatedGr'),
    P=shared(G,integral(gr),'N6_SignedUpdatedP'),pSource=G.sub(gr,G.mul(g.rho,P)),pWhole=integral(pSource),
    p=G.sub(primitive(pSource),G.mul(g.chi,pWhole)),A0=G.mul(G.derivative(g.chi,R),pWhole),
    pressureCheck=equal(G,G.derivative(p,R),G.sub(pSource,A0),[gr,P,g.rho,pWhole]),
    Jtheta=shared(G,integral(G.mul(G.pow(R,2),W.thetaz)),'N6_SignedUpdatedJtheta'),
    Jz=shared(G,G.sub(integral(G.mul(R,W.zz)),G.mul(q(1,2),integral(G.mul(G.pow(R,2),gr)))),'N6_SignedUpdatedJz'),
    Etheta=G.sub(G.add(de(W.rtheta,2),dz(W.thetaz)),de(state.mean.residual.fullOriginalStress[0],2)),
    Ez=G.sub(G.add(de(W.rz,1),dz(G.add(W.zz,p))),de(state.mean.residual.fullOriginalStress[1],1)),
    localPrimaryBilinear=inverse.cross.map(x=>G.mul(G.pow(eta,2),x)),localTarget=target.Sigma.map(x=>G.mul(G.pow(eta,2),x)),
    localInverseChecks=localPrimaryBilinear.map((x,j)=>equal(G,x,localTarget[j],[...b.target.H.flat(),eta,...target.Sigma])),
    checks=[{id:'actual-current-source-Corollary8_5-target',pass:target.checks.every(c=>c.pass)},
      {id:'same-original-H-and-fixed-positive-a',pass:inverse.a.every((a,j)=>a===b.target.squareRootWeights[j])&&inverse.H.every((r,i)=>r.every((x,j)=>x===b.target.H[i][j]))},
      {id:'selected-member-bilinear-target-has-original-partition-square',pass:localInverseChecks.every(c=>c.pass)},
      {id:'actual-full-curl-divergence-identities',pass:rows.every(r=>r.curl.divergence.checks.every(c=>c.pass))},
      {id:'actual-signed-curl-shared-derivative-bodies-materialized',pass:rows.every(r=>r.materializedCurlBodies.allRequestedSharedBodiesMaterialized)},
      {id:'all-three-actual-same-label-covariance-remainders-retained',pass:rows.every(r=>r.expansion.checks.every(c=>c.pass)&&r.expansion.newIncrementSquareRetained&&r.expansion.previousCorrectionRetained)},
      {id:'all-six-updated-covariances-and-current-P-J',pass:names.every(n=>G.nodes[W[n]])&&[gr,P,Jtheta,Jz].every(n=>G.nodes[n])},
      {id:'updated-mean-pressure-reconstructed-before-updated-E',...pressureCheck},
      {id:'original-private-source-and-higher-jet-definitions-preserved',pass:assertActualNavierHigherJetExpressions(G,state)}];
  if(checks.some(c=>!c.pass))fail('An actual signed-stress update check failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const result={schema:'MathScope.N6.ActualCurrentSignedStress/1',G,state,pressure,
    source:{samePrivateSourceState:true,currentPressureWasReconstructed:true,originalParametersReplaced:false,
      paperSHA256:state.source.paperSHA256,parameterExpressionSHA256:state.source.parameterExpressionSHA256,
      equations:['8.18','7.31','7.40','7.41'],coordinateDomain},target,inverse,rows,
    updated:{fullAuxiliaryCovariance:W,gr,P,Jtheta,Jz,meanPressure:{source:pSource,totalSource:pWhole,value:p,cutoffRemainder:A0,check:pressureCheck},
      auxiliaryMeanResidual:{Etheta,Ez},localPrimaryBilinear,localTarget,localInverseChecks,
      twoIndependentHaarAndAngularAverages:true,allSameLabelFullSquaresRetained:true,meansRemainZeroVelocity:true},checks,
    scope:{actualSourceCurrentSignedWaveUpdateConstructed:true,fullCurlCovarianceRecomputed:true,currentMeanPressureAndPJRecomputed:true,
      oneOriginalBandAndMeshMember:true,allLabelsAssembled:false,globalBilinearIdentityClaimedForSingleMember:false,
      updatedFullAuxiliaryPressureConstructed:false,updatedFullPhysicalPDEJetCompared:false,initializedJ0:false,
      temporalAndFiveMomentUpdatesApplied:false,allOrderTargetClassBoundCertified:false,completeN6:false,numericalFieldEnclosure:false}};
  seals.set(result,{G,state,pressure,count:G.nodes.length,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(data(result))});
  context.onProgress?.({stage:'n6-current-source-signed-update-sealed',nodeCount:G.nodes.length});return result;
}

export function assertActualCurrentSignedStress(result){
  const s=seals.get(result);
  if(!s||s.G!==result.G||s.state!==result.state||s.pressure!==result.pressure||s.data!==canonicalStringify(data(result))||
    s.nodes!==canonicalStringify(result.G.nodes.slice(0,s.count))||!result.G.functionDefinitionsUnchanged(s.definitions))fail('Use the unmodified privately constructed current signed stress, not a receipt or a supplied target.');
  assertActualCurrentPressure(result.pressure);assertActualNavierHigherJetExpressions(result.G,result.state);return true;
}

export async function actualCurrentSignedStressCertificate(result){
  assertActualCurrentSignedStress(result);
  const roots={target:result.target.Sigma,deltaA:result.inverse.deltaAmplitude,
    actualFullIncrement:result.rows.map(r=>r.fullIncrement),updated:result.updated},encoded=canonicalStringify(result.G.pack(roots,{schema:'MathScope.N6.ActualCurrentSignedStressProgram/1'}));
  return {...data(result),graph:{nodeCount:result.G.nodes.length,sha256:await sha256(encoded),canonicalBytes:new TextEncoder().encode(encoded).length},
    sourceExpressionValuesAreNumericalEnclosures:false,sourceConstructionRetained:true};
}
