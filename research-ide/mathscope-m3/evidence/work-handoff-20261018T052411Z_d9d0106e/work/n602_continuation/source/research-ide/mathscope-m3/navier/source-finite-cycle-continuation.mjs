/** One honest finite continuation of the privately constructed forced current.
 * No serialized object, caller-selected target, or initial-only seal is accepted.
 * The original modules and earlier successful pretemporal run are unchanged.
 */
import {assertGlobalForcedCurrent,exactAngularWaveCovariance} from './source-global-forced-current.mjs';
import {originalHomogeneousPrimaryPressure} from './source-global-angular.mjs';
import {exactSignedCovarianceInverse} from '../../mathscope-m2/navier/actual-physical-residual-algebra.mjs';
import {exactCylindricalHarmonicCurl} from '../../mathscope-m2/navier/actual-full-curl.mjs';
import {exactHarmonicComplexAlgebra,reconstructAngularHarmonics,exactRealCylindricalPDE,originalCylindricalDifferentialOperators} from './source-harmonic-assembly.mjs';
import {reconstructUpdatedFullMeanPressure,exactNormalizedHaar,exactWholeRadialIntegral} from './source-updated-mean-pressure.mjs';
import {globalGraphEqual,shareGlobalScalar} from './source-global-current.mjs';
import {createQuadraticSourceVerifier} from './source-quadratic-identity.mjs';
import {finiteAuxiliaryInverse} from './source-auxiliary-fourier.mjs';
import {checkActualFiniteAuxiliaryIdentity} from './source-global-temporal.mjs';
import {realizeOriginalTemporalPotential} from './source-temporal-potential.mjs';
import {assertGlobalMomentCurrent,exactFiveMomentCoefficients} from './source-global-moment.mjs';
import {exactFullMeanMomentRemainders,originalFullMeanOperators} from './source-full-mean-equations.mjs';
import {completeSourceField,decomposedUpdate} from './source-continuation-kernels.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),names=['rr','rtheta','rz','thetatheta','thetaz','zz'],meanNames=['beta','v','gamma'];
const need=(ok,message)=>{if(!ok)throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});};
const progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});};
const cross=(G,a,b)=>[G.sub(G.mul(a[1],b[2]),G.mul(a[2],b[1])),G.sub(G.mul(a[2],b[0]),G.mul(a[0],b[2])),G.sub(G.mul(a[0],b[1]),G.mul(a[1],b[0]))];
const record=s=>({schema:s.schema,stage:s.stage,meanVelocity:s.meanVelocity,covariance:s.covariance,
  waveVelocity:s.waveVelocity,angularPressure:s.angularPressure,
  templates:s.templates.map(t=>({key:t.key,lift:t.lift,phase:t.phase,k:t.k,waveRows:t.waveRows})),
  global:s.global,pressure:s.latestMean.pressure,mean:s.latestMean.mean,sourceBinding:s.sourceBinding,
  correction:s.correction,ledger:s.ledger,checks:s.checks,scope:s.scope});
function seal(s,parent,firstStart){
  const start=firstStart??seals.get(parent)?.count;
  need(Number.isSafeInteger(start),'A new finite seal must retain its actual owned node prefix.');
  seals.set(s,{parent,G:s.G,forced:s.forced,source:s.source,current:s.current,pressure:s.pressure,geometry:s.geometry,
    start,count:s.G.nodes.length,delta:canonicalStringify(s.G.nodes.slice(start)),
    record:canonicalStringify(record(s)),definitions:s.G.captureFunctionDefinitions()});return s;
}
export function assertFiniteCurrent(s){
  const z=seals.get(s);need(z&&z.G===s.G&&z.forced===s.forced&&z.source===s.source&&z.current===s.current&&
    z.pressure===s.pressure&&z.geometry===s.geometry&&z.delta===canonicalStringify(s.G.nodes.slice(z.start,z.count))&&
    z.record===canonicalStringify(record(s))&&s.G.functionDefinitionsUnchanged(z.definitions),
    'Use the unchanged live finite current constructed by this module.');
  if(z.parent.stage)assertFiniteCurrent(z.parent);else assertGlobalForcedCurrent(z.parent);
  return true;
}

/** The only factory entrance. Every operand is taken from the original
 * private forced constructor; no schema tag or receipt grants authority.
 */
export function currentFromForced(forced,context={}){
  assertGlobalForcedCurrent(forced);
  const G=forced.G,start=G.nodes.length,source=forced.input,pressure=source.mean.temporal.pressure,current=pressure.current;
  need(forced.templates.length===10&&forced.assembly.signedSourceContributions===162&&
    forced.checks.every(x=>x.pass)&&source.mean.conservation.allCorrectionsRemainDivergenceFree,
    'The actual forced stage, original support, or mean conservation premise is incomplete.');
  need(forced.mean.completeBetaVGamma===source.mean.stages.moments.velocity,
    'The post-forced nonzero mean must be the exact unchanged initialized mean.');
  const geometry=forced.global.geometry;
  const {band}=current,{R}=geometry,D=originalCylindricalDifferentialOperators(G,geometry),stress=pressure.residual.fullOriginalStress;
  const backgroundVelocity=[band.fields.b,G.mul(R,band.fields.F),band.fields.G];
  const backgroundPDE=exactRealCylindricalPDE(G,{geometry,velocity:backgroundVelocity,pressure:band.fields.pressure});
  const stressDivergence=[G.zero,G.add(D.Dr(stress[0]),G.div(G.mul(G.q(2),stress[0]),R)),
    G.add(D.Dr(stress[1]),G.div(stress[1],R))];
  const oldFlat=backgroundPDE.conservativeResidual.map((x,j)=>G.add(x,stressDivergence[j]));
  const initialPotential=source.mean.temporal.potential,{N}=originalFullMeanOperators(G,geometry);
  const inheritedFax=G.mul(geometry.ci,N(G.sub(initialPotential.velocity.gamma,initialPotential.gammaDesired)));
  const decomposition=decomposedUpdate(G,geometry,source.global.velocity,source.global.pressure,
    forced.global.velocity,forced.global.pressure,oldFlat);
  const verify=createQuadraticSourceVerifier(G,{maxTerms:180000,maxProducts:3000000});
  const comparison=forced.global.direct.conservativeResidual.map((x,j)=>({component:j,direct:x,
    decomposed:decomposition.residual[j],...verify(G.sub(x,decomposition.residual[j]))}));
  need(comparison.every(x=>x.pass),'The actual forced whole-field comparison failed.');
  const s={schema:'MathScope.N602.LiveFiniteCurrent/1',stage:'post-forced',G,forced,source,pressure,current,geometry,
    templates:forced.templates,meanVelocity:forced.mean.completeBetaVGamma,covariance:forced.mean.fullCurrentCovariance,
    waveVelocity:forced.assembly.velocityFields.map(f=>f.root),angularPressure:forced.assembly.angularPressureField.root,
    latestMean:forced.mean,global:{velocity:forced.global.velocity,pressure:forced.global.pressure,
      direct:forced.global.direct,decomposition,comparison},
    sourceBinding:{originalForcedPrivateSealRequired:true,allOriginalModes:forced.templates.map(t=>({key:t.key,modes:t.waveRows.map(r=>r.m)})),
      actualNonzeroMeanPreserved:true,callerRootsAccepted:false,serializedCloneAccepted:false},
    correction:null,ledger:{oldFlatResidual:oldFlat,oldFlatDerivation:{backgroundPDE:backgroundPDE.conservativeResidual,stressDivergence},
      inheritedActualMeanResidual:source.global.referenceMeanResidual.conservativeResidual,
      pressureA0:[{stage:'initial-temporal',root:source.mean.stages.temporal.pressure.cutoffRemainder},
        {stage:'initial-fresh-five',root:source.mean.stages.moments.pressure.cutoffRemainder},
        {stage:'post-forced',root:forced.mean.pressure.cutoffRemainder}],
      temporalFax:[{stage:'initial-temporal',root:inheritedFax,actualGamma:initialPotential.velocity.gamma,
        gammaDesired:initialPotential.gammaDesired}],
      inheritedPulseCutoffTerms:source.initial.local.map(t=>({sign:t.sign,sourceFullCurl:t.sourceFullCurl,
        originalWaveRows:t.waveRows,actualCompleteResidual:t.update.direct,
        preservation:t.pulseEndpointRemaindersKept})),
      forcedCutoffRemainders:{actualSource:forced.templates.map(t=>({key:t.key,increment:t.increment,
        actualCompleteUpdate:t.update.direct})),automaticallyDeclaredGaussianFlat:false},
      interpretation:'pressureA0 entries are historical stage-specific pressure remainders, never a cumulative sum. The unchanged background flat force is the tensor-decomposition reference; the entire inherited mean residual including its actual Fax and latest A0 remains in oldResidual and is not replaced by the background term.'},
    checks:comparison,scope:{oneFiniteCanonicalCycleOnly:true,allOrderClassBoundCertified:false,originalN602Complete:false}};
  progress(context,'finite-current-factory-authenticated-actual-postforced',G);
  return seal(s,forced,start);
}

/** Original Sigma for a general actual mean: subtract the actual weighted
 * whole radial moment, not a formula specialized to zero mean velocity.
 * Normalized rho proves the weighted source has zero integral. Its link
 * to epsilon*dZ(Jtheta,Jz+cRho*P) is kept as a separate conservation identity.
 */
export function actualCurrentSigma(state){
  assertFiniteCurrent(state);const {G,geometry,latestMean,pressure}=state,{R,Y,innerRadius,outerRadius}=geometry;
  const rho=pressure.pressure.rho,chi=pressure.pressure.chi;
  const rows=[latestMean.mean.Etheta,latestMean.mean.Ez].map((body,j)=>{
    const e=2-j,E=shareGlobalScalar(G,exactNormalizedHaar(G,body,Y),'SuccessorHaarE_'+j);
    const moment=shareGlobalScalar(G,exactWholeRadialIntegral(G,G.mul(G.pow(R,e),E),geometry,'SuccessorWeightedE_'+j),'SuccessorMomentE_'+j);
    const normalizedSource=G.sub(E,G.mul(G.div(rho,G.pow(R,e)),moment));
    const r=G.fresh('SuccessorSigmaRadial_'+j),weighted=G.mul(G.pow(R,e),normalizedSource),integrand=G.substitute(weighted,R,r);
    const partial=G.integral(integrand,r,innerRadius,R),whole=G.integral(integrand,r,innerRadius,outerRadius);
    const rawValue=G.neg(G.div(G.sub(partial,G.mul(chi,whole)),G.pow(R,e)));
    const derivative=G.add(G.derivative(rawValue,R),G.div(G.mul(G.q(e),rawValue),R));
    const cutoffRemainder=G.div(G.mul(G.derivative(chi,R),whole),G.pow(R,e));
    const check=globalGraphEqual(G,derivative,G.add(G.neg(normalizedSource),cutoffRemainder));
    const value=shareGlobalScalar(G,rawValue,'SuccessorSigma_'+j);
    need(check.pass&&Y.every(y=>!G.freeCoordinates(value).has(y)),'Actual current Sigma FTC or Haar independence failed.');
    return {e,actualResidual:body,E,moment,normalizedSource,weighted,partial,whole,rawValue,value,cutoffRemainder,check};
  });
  return {rows,Sigma:rows.map(r=>r.value),sourceAuthenticated:true,
    normalizationSource:{rho,chi,innerRadius,outerRadius},
    weightedZeroMomentProof:'For M=integral r^e*Haar(E), integral r^e*(Haar(E)-rho*r^-e*M)=M-M*integral(rho)=0, using the unchanged original positive normalized rho.',
    currentMomentConservation:state.source.mean.conservation,
    compactFTCSourceRemainderNotNumericallyDiscarded:true,initialZeroMeanFormulaReused:false};
}

function nextCurrent(previous,{stage,meanVelocity,covariance,templates,waveVelocity,angularPressure,correction},context){
  assertFiniteCurrent(previous);const {G,geometry,current,pressure}=previous,{band}=current,{R}=geometry;
  const background={b:band.fields.b,V:G.mul(R,band.fields.F),G:band.fields.G};
  const latestMean=reconstructUpdatedFullMeanPressure(G,{geometry:pressure.geometry,background,velocity:meanVelocity,covariance,
    stress:pressure.residual.fullOriginalStress,rho:pressure.pressure.rho,chi:pressure.pressure.chi,tag:'FiniteCycle_'+stage});
  if(stage==='fresh-five'){
    const old=previous.latestMean.mean.raw,next=latestMean.mean.raw,n=correction.nonlinear,increment=correction.increment;
    const expansionChecks=[
      {id:'fresh-five-actual-radial-full-nonlinear-expansion',...globalGraphEqual(G,G.sub(G.sub(next.gr,old.gr),n.linear.PIntegrand),n.Rg)},
      {id:'fresh-five-actual-angular-flux-full-nonlinear-expansion',...globalGraphEqual(G,G.sub(G.sub(next.fluxTheta,old.fluxTheta),n.linear.JthetaIntegrand),n.JthetaIntegrand)},
      {id:'fresh-five-actual-axial-flux-full-nonlinear-expansion',...globalGraphEqual(G,G.sub(next.fluxZ,old.fluxZ),
        G.add(G.mul(G.q(2),R,background.G,increment.gamma),n.JzVelocityIntegrand))}];
    need(expansionChecks.every(c=>c.pass),'The actual old/new fresh-five nonlinear defect comparison failed.');
    correction={...correction,expansionChecks,actualNewDefects:Object.fromEntries(['P','Jtheta','Jz'].map(k=>[k,latestMean.mean[k]])),
      defectRemainderDerivation:'Integrate the three checked actual difference identities with normalized Haar. The fixed five-profile identities cancel exactly the actual pre-five P/J; all nonlinear remainder integrals are retained as the new defects, without declaring them zero.'};
  }
  const velocity=[background.b,background.V,background.G].map((x,j)=>G.add(x,meanVelocity[meanNames[j]],waveVelocity[j]));
  const fullPressure=G.add(band.fields.pressure,latestMean.pressure.value,angularPressure);
  const direct=exactRealCylindricalPDE(G,{geometry,velocity,pressure:fullPressure});
  const decomposition=decomposedUpdate(G,geometry,previous.global.velocity,previous.global.pressure,velocity,fullPressure,previous.ledger.oldFlatResidual);
  const verify=createQuadraticSourceVerifier(G,{maxTerms:180000,maxProducts:3000000});
  const comparison=direct.conservativeResidual.map((x,j)=>({component:j,direct:x,decomposed:decomposition.residual[j],
    ...verify(G.sub(x,decomposition.residual[j]))}));
  need(comparison.every(x=>x.pass),'The '+stage+' actual all3 direct/decomposed comparison failed.');
  const stalePressure=exactRealCylindricalPDE(G,{geometry,velocity,pressure:previous.global.pressure});
  const negativeControls={
    stalePressure:stalePressure.conservativeResidual.map((x,j)=>verify(G.sub(x,decomposition.residual[j]))),
    omittedQuadratic:direct.conservativeResidual.map((x,j)=>verify(G.sub(x,G.sub(decomposition.residual[j],decomposition.newQuadraticRemainder[j])))),
    omittedBackgroundFlat:direct.conservativeResidual.map((x,j)=>verify(G.sub(x,G.sub(decomposition.residual[j],previous.ledger.oldFlatResidual[j]))))};
  const controlSummary=Object.fromEntries(Object.entries(negativeControls).map(([name,checks])=>[name,{checks,
    rejectedAsAnExactIdentity:checks.some(c=>!c.pass),
    interpretation:'A passing omission may be an actually zero component; no nonzero value is invented to force rejection.'}]));
  const s={...previous,stage,meanVelocity,covariance,templates,waveVelocity,angularPressure,latestMean,correction,
    global:{velocity,pressure:fullPressure,direct,decomposition,comparison,negativeControls:controlSummary},
    sourceBinding:{...previous.sourceBinding,previousStage:previous.stage,sameActualPreviousCurrent:true,
      newMeanIsOldMeanPlusActualIncrement:stage!=='signed'||meanVelocity===previous.meanVelocity,
      fullUpdatedCovarianceBound:latestMean.mean.fullAngularCovariance===covariance},
    ledger:{...previous.ledger,pressureA0:[...previous.ledger.pressureA0,{stage,root:latestMean.pressure.cutoffRemainder}],
      temporalFax:[...previous.ledger.temporalFax,...(correction?.Fax!==undefined?[{stage,root:correction.Fax}]:[])]},checks:[...latestMean.checks,...comparison]};
  progress(context,'finite-cycle-'+stage+'-latest-pressure-and-actual-all3-comparison',G,
    {comparison,negativeControls:Object.fromEntries(Object.entries(controlSummary).map(([k,v])=>[k,v.rejectedAsAnExactIdentity]))});
  return seal(s,previous);
}

export function attachPostForcedSigned(previous,context={}){
  assertFiniteCurrent(previous);need(previous.stage==='post-forced','The finite signed update requires this actual post-forced current.');
  const {G,source,current,geometry}=previous,{band}=current,{R,Z,Xrep,etaRep,sRep,theta,v}=band.coordinates;
  const {epsilon,k}=band.geometry,xi=band.cutoffs.xi;
  const target=actualCurrentSigma(previous),inverse=exactSignedCovarianceInverse(G,{H:band.target.H,
    amplitudes:band.target.squareRootWeights,epsilon,target:target.Sigma});
  const atRepresentative=body=>G.simultaneousSubstitute(body,[Xrep,etaRep,sRep],
    [current.representative.roots.X,current.representative.roots.eta,current.representative.roots.s]);
  const C=exactHarmonicComplexAlgebra(G),increments=band.families.map((family,index)=>{
    const deltaA=inverse.deltaAmplitude[index],old=current.local.rows[index];
    need(inverse.a[index]===old.originalFixedPositiveA&&inverse.H.every((row,j)=>row[index]===band.target.H[j][index]),
      'The signed correction must retain the exact original positive amplitude and H column.');
    need(!G.freeCoordinates(deltaA).has(v)&&!G.freeCoordinates(deltaA).has(xi),
      'Actual signed amplitude must be independent of the fast homogeneous pulse variables.');
    const weighted=family.t.map(x=>G.mul(current.local.slowCutoff.body,G.sqrt(epsilon),deltaA,band.cutoffs.chi,band.cutoffs.psi,x));
    const amplitudeScalingChecks=weighted.map((x,j)=>globalGraphEqual(G,x,
      G.mul(G.div(deltaA,old.originalFixedPositiveA),old.weightedAmplitude[j]),
      [current.local.slowCutoff.body,G.sqrt(epsilon),deltaA,old.originalFixedPositiveA,band.cutoffs.chi,band.cutoffs.psi,...family.t]));
    need(amplitudeScalingChecks.every(c=>c.pass),'The new homogeneous signed amplitude is not the exact fast-constant multiple of the original tangential source.');
    const raw=cross(G,family.frame.n,weighted).map(x=>G.div(x,G.mul(k,family.frame.nSquared)));
    const potential=raw.map((x,j)=>G.share(x,current.local.parameters,'FiniteSignedPotential_'+index+'_'+j));
    const curl=exactCylindricalHarmonicCurl(G,{R,Z,xi,epsilon,radialFast:current.geometry.radialFast,k,normal:family.frame.n,potential});
    const primaryPressure=originalHomogeneousPrimaryPressure(G,{normal:family.frame.n,nPrime:family.frame.nPrime,
      K:family.frame.principalK,k,amplitude:weighted});
    need(curl.divergence.checks.every(x=>x.pass)&&primaryPressure.identity.pass,'The actual signed full curl or homogeneous pressure failed.');
    return {deltaA,weighted,potential,curl,primaryPressure,amplitudeScalingChecks,
      originalTangentialSource:old.weightedAmplitude,fixedOriginalPositiveA:old.originalFixedPositiveA,
      homogeneousLinearScaling:'deltaA/a is independent of xi and v; the same original tangential Volterra solution and homogeneous pressure are scaled before the full curl.'};
  });
  const templates=previous.templates.map(old=>{
    const inc=increments[old.signIndex],map=body=>G.simultaneousSubstitute(atRepresentative(body),[xi,v],[old.lift.xi,old.lift.v]);
    const positive={m:1,velocity:inc.curl.leading.map((x,j)=>C.value(G.mul(G.q(1,2),map(x)),G.mul(G.q(1,2),map(inc.curl.remainder[j])))),
      pressure:C.value(G.mul(G.q(1,2),map(inc.primaryPressure.value.real)),G.mul(G.q(1,2),map(inc.primaryPressure.value.imaginary)))};
    const increment=[positive,{m:-1,velocity:positive.velocity.map(C.conjugate),pressure:C.conjugate(positive.pressure)}];
    const waveRows=old.waveRows.map(row=>{
      const add=increment.find(r=>r.m===row.m);return add?{m:row.m,velocity:row.velocity.map((x,j)=>C.add(x,add.velocity[j])),pressure:C.add(row.pressure,add.pressure)}:row;
    });
    need(waveRows.some(r=>r.m===2)&&waveRows.some(r=>r.m===-2),'The actual forced second harmonics must survive the signed update.');
    const covariance=exactAngularWaveCovariance(G,{rows:waveRows,theta});
    const reconstruction=reconstructAngularHarmonics(G,{geometry:old.lift.geometry,phase:old.phase,k,rows:waveRows});
    return {...old,signedIncrement:increment,waveRows,covariance,reconstruction};
  });
  const covarianceFields=Object.fromEntries(names.map(n=>[n,completeSourceField(source,templates,'FiniteSignedCov_'+n,t=>t.covariance.values[n],{kind:'covariance',angular:false})]));
  const velocityFields=[0,1,2].map(j=>completeSourceField(source,templates,'FiniteSignedVelocity_'+j,t=>t.reconstruction.velocity[j],{kind:'velocity'}));
  const pressureField=completeSourceField(source,templates,'FiniteSignedAngularPressure',t=>t.reconstruction.pressure,{kind:'pressure'});
  need([...Object.values(covarianceFields),...velocityFields,pressureField].every(f=>f.contributions===162),'Every signed field must retain the original full162 contribution set.');
  return nextCurrent(previous,{stage:'signed',meanVelocity:previous.meanVelocity,
    covariance:Object.fromEntries(names.map(n=>[n,covarianceFields[n].root])),templates,
    waveVelocity:velocityFields.map(f=>f.root),angularPressure:pressureField.root,
    correction:{target,inverse,increments,full162Fields:{covarianceFields,velocityFields,pressureField},
      covarianceComputedBeforeAuxiliaryHaar:true,oldForcedHigherHarmonicsRetained:true}},context);
}

export function attachPostSignedTemporal(previous,context={}){
  assertFiniteCurrent(previous);need(previous.stage==='signed','Temporal correction must use the actual newly signed pressure.');
  const {G,geometry,current,latestMean}=previous,{R,Z,T,Y}=geometry;
  const parameters=[R,Z,T,current.band.coordinates.ell,...Y],directions=[R,Z,T,...Y],inverses={};
  const smoothnessChecks=[
    {id:'same-live-forced-current-and-unchanged-original-support',pass:assertGlobalForcedCurrent(previous.forced)&&
      previous.pressure.cover.proof.exactSourceAuthority&&previous.pressure.cover.proof.allCrossLabelProductsVanish},
    {id:'all-original-fixed-lift-forced-Volterra-bodies-retained',pass:previous.forced.templates.length===10&&
      previous.forced.templates.every(t=>t.forced.length===2&&t.forced.every(f=>f.checks.every(c=>c.pass)))},
    {id:'all-signed-full-curls-and-original-homogeneous-pressure',pass:previous.correction.increments.every(i=>
      i.curl.divergence.checks.every(c=>c.pass)&&i.primaryPressure.identity.pass)},
    {id:'actual-full-pressure-from-the-current-all162-full-Y-covariance',pass:latestMean.checks.every(c=>c.pass)&&
      latestMean.mean.fullAngularCovariance===previous.covariance&&
      Object.values(previous.correction.full162Fields.covarianceFields).every(f=>f.contributions===162)}];
  need(smoothnessChecks.every(c=>c.pass),'A source-specific smooth periodicity premise was lost.');
  const smoothPeriodicity={checks:smoothnessChecks,actualSourceBodies:{theta:latestMean.mean.Etheta,z:latestMean.mean.Ez},
    sourceSpecificProof:[
      'The unchanged initialized mean is built by exact Fourier inverses with its own source tails, radial potentials and fixed smooth compact profiles. Its exact source smoothness and original torus periodicity are retained by the private source chain.',
      'Each of the 20 original forced positive modes is the finite-interval zero-data Volterra solution with the retained original smooth coefficients and complete smooth current forcing. Parameter differentiation gives the full downward-closed variational equations; their local ordered-integral convergence proves every finite derivative exists.',
      'The original flat transverse and longitudinal cutoff factors, fixed integer torus maps and all162 support guards retain smooth periodic joins; every conjugate negative route and the unchanged mean remains present.',
      'The actual signed Sigma takes normalized Haar means and complete radial integrals of this same smooth current. Original positive fixed H and a yield smooth slow amplitudes; the full curl, homogeneous pressure and original fixed-lift assembly preserve the same periodic source class.',
      'All six actual full-Y covariances are finite products. The translated full pressure integral, every displayed finite derivative, sum and product preserve smooth periodicity. Consequently the two actual E roots above have their needed C4/C5 source derivatives; the computed Fourier tails bind those roots, not an abstract replacement.'
    ],allFiniteDerivativeExistenceDischargedAnalytically:true,uniformAllOrderNumericalClassBoundClaimed:false};
  for(const [name,body]of [['theta',latestMean.mean.Etheta],['z',latestMean.mean.Ez]]){
    const system=G.defineAuxiliaryInverse({name:'FinitePostSignedTemporal_'+name,body,Y,parameters,directions});
    const exact=G.auxiliaryInverseValue(system,parameters),finite=finiteAuxiliaryInverse(G,{body,Y,cutoff:1,derivativeOrders:[0,1]});
    const identity=checkActualFiniteAuxiliaryIdentity(G,finite);
    need(identity.pass&&finite.tails.every(t=>t.tailTendsToZero&&!t.omittedModesSetToZero),'The actual temporal Fourier identity/tail failed.');
    inverses[name]={system,body,exact,finite,identity,exactZeroMode:G.zero,finiteSumReplacesExactLimit:false};
    progress(context,'finite-temporal-actual-source-inverse-and-C1-tail',G,{component:name});
  }
  const potential=realizeOriginalTemporalPotential(G,{geometry:{...geometry,chi:previous.pressure.pressure.chi},
    inverseTheta:inverses.theta.exact,inverseZ:inverses.z.exact,tag:'FinitePostSignedTemporal'});
  const meanVelocity=Object.fromEntries(meanNames.map(n=>[n,G.add(previous.meanVelocity[n],potential.velocity[n])]));
  const {N}=originalFullMeanOperators(G,geometry),Fax=G.mul(geometry.ci,N(G.sub(potential.velocity.gamma,potential.gammaDesired)));
  return nextCurrent(previous,{stage:'temporal',meanVelocity,covariance:previous.covariance,templates:previous.templates,
    waveVelocity:previous.waveVelocity,angularPressure:previous.angularPressure,
    correction:{inverses,potential,Fax,smoothPeriodicity,actualOldMean:previous.meanVelocity,actualIncrement:potential.velocity,
      gammaDesiredNotSubstitutedForActualGamma:true,sourceAllOrderSmoothnessPremiseStillRequired:false,
      everyNewRequestedDerivativeTailMaterialized:false}},context);
}

export function attachPostTemporalFreshFive(previous,context={}){
  assertFiniteCurrent(previous);need(previous.stage==='temporal','Fresh five must use the pressure after the actual temporal increment.');
  const {G,geometry,current}=previous,template=previous.source.mean.template;
  assertGlobalMomentCurrent(template);need(template.current===current,'The fixed original profiles must come from the exact same current.');
  const b=template.bumps,{R,Z,Y,epsilon}=geometry,{band}=current,{A}=band.constants,s=band.chart.s,q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x)));
  const actualInputDefects=Object.fromEntries(['P','Jtheta','Jz'].map(n=>[n,previous.latestMean.mean[n]]));
  const targets={P:G.mul(power(s,G.mul(q(2),A)),actualInputDefects.P),
    Jtheta:G.mul(power(s,G.sub(G.mul(q(2),A),q(3,2))),actualInputDefects.Jtheta),
    Jz:G.mul(power(s,G.sub(G.mul(q(2),A),G.one)),actualInputDefects.Jz)};
  const coefficients=exactFiveMomentCoefficients(G,{angularNodes:b.powers.slice(0,3).map(p=>G.exp(G.mul(b.d,p))),
    angularFactors:b.coefficients.angularMatrix.map(row=>row[0]),angularTargets:[G.zero,G.neg(targets.P),G.neg(targets.Jz)],
    axialNode:G.exp(b.d),axialRatio:G.exp(G.mul(q(-2),b.d,b.lambda)),axialFactors:b.coefficients.axialMatrix.map(row=>row[0]),axialTarget:G.neg(targets.Jtheta)});
  need(canonicalStringify(coefficients.angularMatrix)===canonicalStringify(b.coefficients.angularMatrix)&&
    canonicalStringify(coefficients.axialMatrix)===canonicalStringify(b.coefficients.axialMatrix),'The fixed original five matrix changed.');
  const deltaV=shareGlobalScalar(G,G.add(...coefficients.angular.map((c,j)=>G.mul(c,b.copies[j].inQ))),'FiniteFreshFive_v');
  const gammaDesired=shareGlobalScalar(G,G.add(...coefficients.axial.map((c,j)=>G.mul(c,b.copies[j].inQ))),'FiniteFreshFive_gamma');
  const r=G.fresh('FiniteFreshFiveRadial'),integrand=G.substitute(G.mul(R,gammaDesired),R,r);
  const primitive=G.integral(integrand,r,geometry.innerRadius,R),whole=G.integral(integrand,r,geometry.innerRadius,geometry.outerRadius);
  const psi=G.div(primitive,R),rawBeta=G.neg(G.mul(epsilon,G.derivative(psi,Z))),beta=shareGlobalScalar(G,rawBeta,'FiniteFreshFive_beta');
  const increment={beta,v:deltaV,gamma:gammaDesired},meanVelocity=Object.fromEntries(meanNames.map(n=>[n,G.add(previous.meanVelocity[n],increment[n])]));
  const {De,Dz}=originalFullMeanOperators(G,geometry),checks=[globalGraphEqual(G,De(psi,1),gammaDesired,[R,primitive,gammaDesired]),
    globalGraphEqual(G,G.add(De(rawBeta,1),Dz(gammaDesired)),G.zero)];
  need(checks.every(x=>x.pass)&&Object.values(increment).every(x=>Y.every(y=>!G.freeCoordinates(x).has(y))),
    'The actual fresh-five potential, divergence, or zero auxiliary dependence failed.');
  const nonlinear=exactFullMeanMomentRemainders(G,{geometry,background:previous.latestMean.mean.background,
    previous:previous.meanVelocity,increment});
  const compactPsi=G.div(G.sub(primitive,G.mul(previous.pressure.pressure.chi,whole)),R);
  const wholeHaar=body=>exactWholeRadialIntegral(G,exactNormalizedHaar(G,body,Y),geometry,'FiniteFreshFiveRemainder');
  const remainderDefects={P:wholeHaar(nonlinear.Rg),Jtheta:wholeHaar(nonlinear.JthetaIntegrand),
    Jz:G.sub(wholeHaar(nonlinear.JzVelocityIntegrand),G.mul(q(1,2),wholeHaar(G.mul(G.pow(R,2),nonlinear.Rg))))};
  const next=nextCurrent(previous,{stage:'fresh-five',meanVelocity,covariance:previous.covariance,templates:previous.templates,
    waveVelocity:previous.waveVelocity,angularPressure:previous.angularPressure,
    correction:{actualInputDefects,targets,coefficients,increment,actualOldMean:previous.meanVelocity,
      primitive,whole,psi,compactPsi,rawBeta,checks,nonlinear,remainderDefects,nonlinearRemaindersDeclaredZero:false,
      exactConservationDerivation:'Initial actual weighted moments are zero; forced/signed nonzero angular modes do not change them. The temporal inverse and its actual meridional realization have zero normalized Haar mean. The fresh five homogeneous rows are exactly zero by the same original fixed profile change of variables, preserving both moments.',
      compactPotentialDerivation:'The unchanged original profile change of variables identifies whole with the normalized axial homogeneous row coefficients.axialValues[0]=0. Thus compactPsi=psi; the raw whole root is retained.',
      fixedProfileOnlyReused:true,oldTargetsReused:false}},context);
  return next;
}

export function attachCanonicalFiniteCycle(forced,context={}){
  const postForced=currentFromForced(forced,context),signed=attachPostForcedSigned(postForced,context),
    temporal=attachPostSignedTemporal(signed,context),five=attachPostTemporalFreshFive(temporal,context);
  return {schema:'MathScope.N602.ActualCanonicalFiniteCycle/1',stages:{postForced,signed,temporal,five},
    allMandatoryFiniteStagesConstructed:true,allActualComparisonsPassed:[postForced,signed,temporal,five].every(s=>s.global.comparison.every(c=>c.pass)),
    literalInfiniteExecutionRequired:false,allOrderClassBoundsCertified:false,originalN602Complete:false,
    reviewRequired:'Runtime success authenticates this finite cycle; independent source, chart, support and denominator review remains separate.'};
}
