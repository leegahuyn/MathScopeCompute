/** Original Corollary8.5 bound to the authentic latest mean current.
 *
 * This is additive: it never repurposes the earlier pre-temporal Sigma.
 * The actual raw weighted whole integrals and cutoff errors remain in the
 * expression program even when a separate source proof identifies zero.
 * Uniform class estimates and a completed four-step cycle are not inferred.
 */
import {assertGlobalInitializedMean,globalInitializedMeanCertificate} from './source-global-initial-mean.mjs';
import {assertGlobalForcedCurrent,globalForcedCurrentCertificate} from './source-global-forced-current.mjs';
import {reconstructUpdatedMeanStress} from './source-updated-mean-stress.mjs';
import {globalGraphEqual,shareGlobalScalar} from './source-global-current.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});},
  record=s=>({schema:s.schema,source:s.source,stress:s.stress,Sigma:s.Sigma,compatibility:s.compatibility,checks:s.checks,scope:s.scope}),
  progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});};

function bindLatestMean({input,kind,mean,G,pressure,stage,assertInput},context){
  assertInput(input);assertGlobalInitializedMean(mean);
  const current=pressure.current,band=current.band,g=current.mean.geometry,{R,Z,T,Y}=pressure.geometry,start=G.nodes.length,
    geometry={...pressure.geometry,radialVariable:g.radialVariable},
    stress=reconstructUpdatedMeanStress(G,{geometry,stage,tag:'ActualLatestMean_'+kind}),
    originalMass=G.integral(G.substitute(g.unnormalized,R,g.radialVariable),g.radialVariable,g.innerRadius,g.outerRadius),
    normalizedMass=G.div(originalMass,g.rhoMass),normalizationCheck=globalGraphEqual(G,normalizedMass,G.one,[g.rhoMass]),
    sameVelocity=Object.keys(mean.stages.moments.velocity).every(name=>stage.velocity[name]===mean.stages.moments.velocity[name]),
    sigmaChecks=stress.sigma.map((body,j)=>globalGraphEqual(G,G.mul(G.pow(R,2-j),body),g.rho,[R,g.rho])),
    checks=[...stress.checks,
      {id:'latest-stress-private-current-and-entire-pressure-stage',pass:stage.mean.allOldAndQuadraticMeanTermsRetained&&
        stage.pressure.allAuxiliaryModesRetained&&stage.checks.every(x=>x.pass)&&stage.mean.P===stress.meanInput.P},
      {id:'latest-stress-original-full-radial-envelope',pass:g.radialVariable===geometry.radialVariable&&
        [g.innerRadius,g.outerRadius].every((x,j)=>x===[geometry.innerRadius,geometry.outerRadius][j]&&[R,Z,T,...Y].every(y=>!G.dependsOn(x,y)))},
      {id:'latest-stress-original-positive-bump-mass',pass:originalMass===g.rhoMass&&g.rho===G.div(g.unnormalized,g.rhoMass)&&
        stage.pressure.rho===g.rho&&stage.pressure.chi===g.chi&&normalizationCheck.pass&&current.mean.checks.every(x=>x.pass)},
      {id:'latest-stress-original-second-radial-bump-moment',pass:stress.cRho===g.cRho},
      ...sigmaChecks.map((check,j)=>({id:'latest-stress-normalized-weight-'+[2,1][j],...check})),
      {id:'latest-stress-same-conserved-actual-mean-velocity',pass:sameVelocity&&mean.scope.exactConservation9_10&&
        mean.conservation.angular===G.zero&&mean.conservation.axial===G.zero&&mean.conservation.allCorrectionsRemainDivergenceFree},
      {id:'latest-stress-original-complete-periodic-wave-support',pass:pressure.cover.rows.length===81&&
        pressure.cover.proof.allCrossLabelProductsVanish&&pressure.cover.proof.localFinitenessAndFlatJoins&&
        mean.potential.originalMeanPatchSupportRetained&&mean.temporal.periodicity.checks.every(x=>x.pass)},
      {id:'latest-stress-full-original-background-stress',pass:stage.mean.fullOriginalStress===pressure.residual.fullOriginalStress&&
        stage.mean.fullOriginalStress.length===2},
      {id:'latest-stress-all-new-targets-retained',pass:stress.meanInput.P===stage.mean.P&&stress.meanInput.Jtheta===stage.mean.Jtheta&&
        stress.meanInput.Jz===stage.mean.Jz&&stress.meanInput.Etheta===stage.mean.Etheta&&stress.meanInput.Ez===stage.mean.Ez}];
  if(kind==='after-forced')checks.push({id:'latest-stress-new-forced-full-covariance',pass:stage.mean.fullAngularCovariance===input.mean.fullCurrentCovariance&&
    input.scope.actualCompleteUpdatedCurrentConstructed&&input.templates.every(t=>t.support.checks.every(x=>x.pass)&&
      t.forced.every(f=>f.checks.every(x=>x.pass)))});
  if(checks.some(x=>!x.pass))fail('A latest-current Corollary8.5 source premise failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const normalization={rawNormalizedMass:stress.rhoMass,originalUnnormalizedMass:g.rhoMass,originalMassDefinition:originalMass,
    normalizedByIntegralLinearity:normalizedMass,value:G.one,check:normalizationCheck,
    positiveMassSource:current.target.compatibility.pressureMeanNormalization.positiveDenominator,
    proof:'The original positive compact bump is divided by its exact full radial mass. The denominator is independent of the bound radial variable; finite integral linearity gives mass/mass=1.',
    rawIntegralRewritten:false},
    compatibility={originalEquations:['8.2','8.12','8.15','8.16','8.18'],normalization,
      actualVelocityMoments:{raw:stress.conservation,sourceValues:[mean.conservation.angular,mean.conservation.axial],
        actualTemporalZeroModes:mean.conservation.exactTemporalZeroMeanSource,actualFiveRows:mean.conservation.actualFiveRows,
        sameVelocityAfterOptionalAngularStep:sameVelocity},
      sourceSupport:{shell:[G.parameter('Xa'),band.chart.Xb],radialEnvelope:[g.innerRadius,g.outerRadius],
        meanProfileSupport:mean.bumps.originalSourceRestriction,all81BoxesInEveryWholeIntegral:true,
        fullSourceZeroExtension:pressure.cover.proof.localFinitenessAndFlatJoins,
        forcedWaveSupport:kind==='after-forced'?input.templates.map(t=>({key:t.key,ideal:t.support,
          zeroDataAndOriginalCutoff:t.forced.map(f=>f.originalSupport)})):null},
      sourcePeriodicity:mean.temporal.periodicity,
      rows:stress.rows.map((row,j)=>({name:row.name,rawMoment:row.moment,target:row.target,
        rawWeightedSourceWhole:row.integrals.whole,rawCutoffRemainder:row.cutoffRemainder,
        rawCompatibilityRemainder:row.compatibility.remainder,rawTerms:row.compatibility.terms,
        theoremReducedWeightedWhole:G.zero,theoremReducedCutoff:G.zero,
        weightedDivergence:row.weightedDivergence,exactSourceEquation:G.neg(row.source),
        actualConservationRow:mean.conservation.actualFiveRows[j]})),
      proofSteps:[
        'The actual normalized complete mean equation is first checked as a weighted time derivative plus radial and axial fluxes; every old stress and quadratic covariance term is retained.',
        'The two actual temporal zero means and subsequent homogeneous profile rows give the two raw velocity moments zero at every slow point. The optional forced angular step has no zero angular velocity mode and leaves this exact mean tuple unchanged.',
        'The whole original wave cover, the original stress and the realized mean potentials have smooth shell zero extension. Their radial endpoint fluxes vanish at the retained enclosing endpoints.',
        'The complete source descends to the fixed common torus. The two opposite torus faces of each retained smooth field agree, so all explicit auxiliary FTC face terms vanish; distinct cover preimages are never identified.',
        'The same normalized rho and the newly computed P give zero Haar/radial integral of g_r-rho*P. Haar translation invariance and compact pressure FTC give partial_R Haar(p)=Haar(g_r)-rho*P, with zero Haar cutoff error.',
        'Integration by parts of the compact pressure gives integral R*Haar(p)=-1/2 integral R^2*Haar(g_r)+c_rho*P. The entire c_rho*P product remains inside partial_Z.',
        'Substitution into the retained general compatibility formulas gives the two original8.16 weighted moment identities. Normalized weighted bumps therefore give zero weighted source integrals.',
        'These new stress sources are independent of the auxiliary coordinates. Lemma8.2 identifies their retained compact cutoff errors with zero and proves the two exact Corollary8.5 equations, without extending axial support.'
      ],
      sourceTheoremsAppliedToConstructedOperands:true,rawIntegralNodesPreserved:true,mechanicalRawIntegralReduction:false,
      theoremReferencesSubstitutedForSourceOperands:false,allOrderUniformClassEstimateSupplied:false},
    Sigma=stress.Sigma.map((body,j)=>shareGlobalScalar(G,body,'ActualLatestMeanSigma_'+kind+'_'+j)),
    result={schema:'MathScope.N6.GlobalActualUpdatedMeanStress/1',G,input,mean,
      source:{kind,paperSHA256:current.source.paperSHA256,parameterExpressionSHA256:current.source.parameterExpressionSHA256,
        sourcePrefixCount:start,actualInputMean:'The complete temporal→fresh pressure→new five moments→fresh pressure velocity, with optional subsequent actual forced wave update.',
        latestCovariance:stage.mean.fullAngularCovariance,latestFullMeanPressure:stage.pressure.value,
        earlierPreTemporalSigmaReused:false,callerTargetsOrZeroMomentsAccepted:false,originalM2Modified:false},
      stress,Sigma,compatibility,checks,
      scope:{actualLatestMeanTangentialStressConstructed:true,actualCor8_5SourceCompatibilityApplied:true,
        exactWeightedDivergenceIdentityFromSource:true,rawWeightedIntegralsAndCutoffErrorsPreserved:true,
        sourceDerivativeClosureAudited:false,allOrderUniformClassBoundsEstablished:false,
        subsequentSignedCovarianceUpdateConstructed:false,completeFourStepCycle:false,
        initializedJ0:false,completeN6:false,numericalWholeFieldEnclosure:false,newLeanKernelProof:false}};
  const count=G.nodes.length;seals.set(result,{G,input,mean,assertInput,start,count,
    delta:canonicalStringify(G.nodes.slice(start,count)),definitions:G.captureFunctionDefinitions(),record:canonicalStringify(record(result))});
  progress(context,'actual-latest-mean-Cor8_5-stress-constructed',G,{kind});return result;
}

export function attachGlobalInitializedMeanStress(mean,context={}){
  assertGlobalInitializedMean(mean);return bindLatestMean({input:mean,kind:'after-mean',mean,G:mean.G,
    pressure:mean.temporal.pressure,stage:mean.stages.moments,assertInput:assertGlobalInitializedMean},context);
}

export function attachGlobalForcedMeanStress(forced,context={}){
  assertGlobalForcedCurrent(forced);const mean=forced.input.mean;
  return bindLatestMean({input:forced,kind:'after-forced',mean,G:forced.G,
    pressure:mean.temporal.pressure,stage:forced.mean,assertInput:assertGlobalForcedCurrent},context);
}

export function assertGlobalUpdatedMeanStress(s){
  const seal=seals.get(s);if(!seal||seal.G!==s.G||seal.input!==s.input||seal.mean!==s.mean||seal.record!==canonicalStringify(record(s))||
    seal.delta!==canonicalStringify(s.G.nodes.slice(seal.start,seal.count))||!s.G.functionDefinitionsUnchanged(seal.definitions))
    fail('Use the unchanged privately constructed actual latest-mean Corollary8.5 state.');
  seal.assertInput(s.input);assertGlobalInitializedMean(s.mean);return true;
}

export async function globalUpdatedMeanStressCertificate(s){
  assertGlobalUpdatedMeanStress(s);const seal=seals.get(s),source=s.source.kind==='after-forced'?
    await globalForcedCurrentCertificate(s.input):await globalInitializedMeanCertificate(s.input),
    encoded=canonicalStringify({sourceGraph:source.graph,record:record(s),nodes:s.G.nodes.slice(seal.start,seal.count),definitions:seal.definitions});
  return {...record(s),sourceGraph:source.graph,
    graph:{sha256:await sha256(encoded),nodeCount:seal.count,deltaNodeCount:seal.count-seal.start,canonicalBytes:new TextEncoder().encode(encoded).length},
    actualExpressionConstruction:true,numericalWholeFieldEnclosure:false,completeFourStepCycle:false};
}

export function globalUpdatedMeanStressSourceRoots(s){
  assertGlobalUpdatedMeanStress(s);return [...new Set([...s.Sigma,...s.stress.targets,s.stress.rhoMass,s.stress.cRho,
    ...s.stress.conservation,s.stress.pressureMoment.defect,
    ...s.stress.rows.flatMap(r=>[r.residual,r.mean,r.moment,r.source,r.value,r.integrals.whole,r.cutoffRemainder,
      r.weightedDivergence,...Object.values(r.compatibility.terms)])])];
}
