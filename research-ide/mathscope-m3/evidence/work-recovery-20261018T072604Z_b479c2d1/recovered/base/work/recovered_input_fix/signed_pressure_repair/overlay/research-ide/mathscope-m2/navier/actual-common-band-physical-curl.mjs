/** Full physical curl and exact NS residual of one member of the SAME
 * common all-band family. Each band has its own completed background,
 * frozen representative, carrier, Volterra systems and covariance inverse.
 * This file never converts a serialized certificate into source authority.
 */
import {assertActualCommonAdmissibleFamily,assertActualCommonAdmissibleBand} from './actual-common-admissible-family.mjs';
import {ActualCommonPhysicalJetExpressions} from './actual-common-physical-jet-kernel.mjs';
import {clearDisposableThirdJetCaches} from './actual-third-jet-ftc.mjs';
import {exactPhysicalVelocityJets,physicalCoordinateTuple} from './actual-physical-jet-kernel.mjs';
import {fixedLabelSourcePartitionFactor,actualPhysicalWaveExponentAudit} from './actual-physical-full-curl.mjs';
import {attachSourcePalette,attachActualSlowPartition} from './actual-covariance-source-certificate.mjs';
import {normalizeEqualPiecewiseBranches} from './actual-full-curl.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {exactPhysicalMomentumSplit} from './actual-physical-residual-algebra.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),names=['R','Z','T','theta','xi','v'],sameArray=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  data=p=>canonicalStringify({request:p.request,sourceBinding:p.sourceBinding,geometry:p.geometry,slowCutoff:p.slowCutoff,
    variations:p.variations,rows:p.rows,background:p.background,residual:p.residual,roots:p.roots,checks:p.checks,scope:p.scope});
const cross=(G,a,b)=>[G.sub(G.mul(a[1],b[2]),G.mul(a[2],b[1])),G.sub(G.mul(a[2],b[0]),G.mul(a[0],b[2])),G.sub(G.mul(a[0],b[1]),G.mul(a[1],b[0]))];
const dot=(G,a,b)=>G.add(...a.map((x,j)=>G.mul(x,b[j])));
const same=(G,a,b,atomicNodes=[])=>{
  const z=normalizeEqualPiecewiseBranches(G,G.sub(a,b),atomicNodes);
  return {...sourceGraphRationalIdentity(G,z.normalized,{atomicNodes,maxTerms:160000}),equalBranchNormalization:z.identities};
};
const progress=(context,stage,G)=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length});};

function mapBody(G,body,map,rectangle,tag){
  const free=G.freeCoordinates(body),ordered=names.map(n=>map.coordinates[n]),
    parameters=[...ordered.filter(x=>free.has(x)),...[...free].filter(x=>!ordered.includes(x)).sort((a,b)=>a-b)],
    system=parameters.length?G.defineExpressionFunction({name:'ActualCommonBandPhysicalComposition_'+tag+'_'+body,parameters,body,derivativeLimits:parameters.map(()=>0)}):null,
    materialized=system===null?body:G.materializeExpressionFunction(system,parameters),
    values=parameters.map(x=>x===map.coordinates.xi?rectangle.xi:x===map.coordinates.v?rectangle.v:x),
    local=system===null?body:G.expressionValue(system,values),
    timeGuard=G.choose(rectangle.v,G.zero,map.Ls,G.zero,local,G.zero),
    transverseGuard=G.choose(rectangle.xi,G.neg(map.r0),map.r0,G.zero,timeGuard,G.zero),
    // The actual common family's flat sqrt theorem supplies these joins.
    // Guard before evaluating any inverse, sqrt or Volterra on the exterior.
    shellGuard=G.choose(map.X,map.Xa,map.Xb,G.zero,transverseGuard,G.zero),
    mapped=G.simultaneousSubstitute(shellGuard,map.Yi,map.physicalYi),final=G.freeCoordinates(mapped),
    eliminated=[map.coordinates.xi,map.coordinates.v,...map.Yi,...map.templateGrid].every(x=>!final.has(x));
  if(materialized!==body||!eliminated)fail('INVALID_SOURCE_CONSTRUCTION','The original body or the common physical composition was lost.');
  return {body,system,parameters,values,materialized,local,timeGuard,transverseGuard,shellGuard,mapped,
    exactBodyRetained:true,auxiliaryCoordinatesEliminated:true,zeroGuardBeforeSingularEvaluation:true};
}

/** No source claim: assemble the original coordinate identities from the
 * retained operands. The private caller supplies label/domain membership.
 */
export function originalCommonBandPhysicalMap(G,source,meshLabels){
  const {geometry:g,constants:c}=source,q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),sqrt2=G.sqrt(q(2)),
    basis=[[G.one,G.sub(G.one,sqrt2)],[G.sub(sqrt2,G.one),G.one]],
    coordinates=physicalCoordinateTuple(G,{...source.coordinates,xi:source.cutoffs.xi}),
    auxiliary=attachSourcePalette({...source,G,geometry:{...g,rectangleBasis:basis}}),
    label=id=>G.simultaneousSubstitute(id,auxiliary.grid,meshLabels),
    rectangles=auxiliary.rectangleRows.map(r=>({...r,color:label(r.color),center:r.center.map(label),copy:r.copy.map(label),xi:label(r.xi),eta:label(r.eta),v:label(r.v)})),
    physicalR=G.mul(G.sqrt(g.Q),coordinates.R),radialPrimitive=G.mul(power(auxiliary.physicalMap.Lambda,g.paletteIndex),power(physicalR,auxiliary.physicalMap.dr)),
    timePrimitive=G.mul(power(g.Tg,g.paletteIndex),G.sub(G.one,G.mul(g.Q,coordinates.T))),
    expectedYi=[0,1].map(j=>G.add(G.mul(basis[0][j],radialPrimitive),G.mul(basis[1][j],timePrimitive))),
    radialFast=G.derivative(radialPrimitive,coordinates.R),exponents=actualPhysicalWaveExponentAudit(),
    ciExpected=G.mul(power(g.Tg,g.paletteIndex),power(g.Q,G.add(G.one,c.h))),LsExpected=G.div(G.mul(q(2),g.r0),g.ci),
    checks=[{id:'original-physical-Yi',pass:sameArray(expectedYi,auxiliary.physicalMap.Yi)},
      {id:'actual-source-ci-Ls',pass:g.ci===ciExpected&&g.Ls===LsExpected},
      {id:'original-basis-torus-palette',pass:auxiliary.torus.pass&&auxiliary.palette.pass&&auxiliary.palette.commonToAllBandsAndLabels},
      {id:'fixed-band-and-labels',pass:[g.ell,g.Q,g.epsilon,g.k,g.ci,g.Ls,...meshLabels].every(root=>Object.values(coordinates).every(x=>!G.freeCoordinates(root).has(x)&&G.derivative(root,x)===G.zero))},
      {id:'actual-R-only-fast-factor',pass:Object.values(coordinates).filter(x=>x!==coordinates.R).every(x=>G.derivative(radialFast,x)===G.zero)},
      {id:'original-positive-h-physical-powers',pass:exponents.pass}];
  if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The common physical map must retain the original frozen band, labels and exact powers.');
  return {coordinates,basis,meshLabels,templateGrid:auxiliary.grid,Yi:auxiliary.Yi,physicalYi:auxiliary.physicalMap.Yi,
    physicalMap:auxiliary.physicalMap,rectangles,palette:auxiliary.palette,torus:auxiliary.torus,
    radialPrimitive,timePrimitive,radialFast,exponents,Q:g.Q,epsilon:g.epsilon,k:g.k,Ls:g.Ls,r0:g.r0,
    X:source.chart.X,Xa:G.parameter('Xa'),Xb:source.chart.Xb??source.constants.Xb??source.roots?.Xb,
    checks,sourceAuthenticated:false,
    chain:'D_r=partial_R+a(R)partial_xi; D_z=epsilon partial_Z; D_t=-epsilon partial_T+partial_v. The original orthogonal rectangle basis and ci=Tg^i Q^(1+h) give these exact identities. Spatial/time scales are applied before actual composition.'};
}

/** Actual normalized background jets. Coordinate coefficients and the
 * cylindrical rotation are differentiated every time. b includes the
 * radial stream cutoff commutator supplied by the common source family.
 */
function backgroundPhysicalJets(G,source,map,scales){
  const {R,Z,T,theta}=map.coordinates,{F,G:axial,b,pressure}=source.fields;
  if([F,axial,b,pressure].some(x=>!Number.isSafeInteger(x)||!G.nodes[x]))
    fail('INVALID_SOURCE_CONSTRUCTION','The complete common background b,F,G and pressure must be supplied by its private producer.');
  const c=G.cosine(theta),s=G.sine(theta),cylindrical=[b,G.mul(R,F),axial],
    velocity=[G.sub(G.mul(c,b),G.mul(s,R,F)),G.add(G.mul(s,b),G.mul(c,R,F)),axial],
    Dr=x=>G.derivative(x,R),Da=x=>G.div(G.derivative(x,theta),R),
    Dx=x=>G.sub(G.mul(c,Dr(x)),G.mul(s,Da(x))),Dy=x=>G.add(G.mul(s,Dr(x)),G.mul(c,Da(x))),Dz=x=>G.mul(map.epsilon,G.derivative(x,Z)),
    Dt=x=>G.neg(G.mul(map.epsilon,G.derivative(x,T))),D=[Dx,Dy,Dz],
    gradient=velocity.map(x=>D.map(d=>d(x))),laplacian=velocity.map(x=>G.add(...D.map(d=>d(d(x))))),
    time=velocity.map(Dt),pressureGradient=D.map(d=>d(pressure)),
    normalized={velocity,gradient,laplacian,time,pressure,pressureGradient},physical={
      velocity:velocity.map(x=>G.mul(scales.velocity,x)),gradient:gradient.map(row=>row.map(x=>G.mul(scales.gradient,x))),
      laplacian:laplacian.map(x=>G.mul(scales.hessian,x)),time:time.map(x=>G.mul(scales.time,x)),
      pressure:G.mul(scales.pressure,pressure),pressureGradient:pressureGradient.map(x=>G.mul(scales.pressureGradient,x))};
  return {sourceFields:source.fields,cylindrical,normalized,physical,
    definition:'Q^-A*(b*cos(theta)-R*F*sin(theta), b*sin(theta)+R*F*cos(theta), G), pressure Q^-2A*p.',
    originalRadialCutoffCommutatorRetained:true,originalPressureAxisDatumRetained:true,finiteDifferencesUsed:false};
}

export function originalTemporalCutoffFullCurlForce(G,{basePotential,psi,map,residualScale,rectangle,tag}){
  const {R,Z,T,theta,xi,v}=map.coordinates,c=G.cosine(theta),s=G.sine(theta),
    A=[G.sub(G.mul(c,basePotential[0]),G.mul(s,basePotential[1])),G.add(G.mul(s,basePotential[0]),G.mul(c,basePotential[1])),basePotential[2]],
    Dr=x=>G.add(G.derivative(x,R),G.mul(map.radialFast,G.derivative(x,xi))),Da=x=>G.div(G.derivative(x,theta),R),
    Dx=x=>G.sub(G.mul(c,Dr(x)),G.mul(s,Da(x))),Dy=x=>G.add(G.mul(s,Dr(x)),G.mul(c,Da(x))),Dz=x=>G.mul(map.epsilon,G.derivative(x,Z)),
    Dt=x=>G.add(G.neg(G.mul(map.epsilon,G.derivative(x,T))),G.derivative(x,v)),
    baseVelocity=[G.sub(Dy(A[2]),Dz(A[1])),G.sub(Dz(A[0]),Dx(A[2])),G.sub(Dx(A[1]),Dy(A[0]))],
    psiPrime=G.derivative(psi,v),checks=[... [Dx,Dy,Dz].map((D,j)=>({id:'spatial-psi-'+j,...same(G,D(psi),G.zero)})),
      {id:'original-normalized-time-cutoff',...same(G,Dt(psi),psiPrime)}],
    body=baseVelocity.map(x=>G.mul(psiPrime,x)),composition=body.map((x,j)=>mapBody(G,G.mul(residualScale,x),map,rectangle,tag+'_temporal_'+j));
  if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The original time cutoff no longer commutes with all spatial operators.');
  return {basePotential,baseCartesianPotential:A,baseVelocity,psi,psiPrime,body,composition,physical:composition.map(x=>x.mapped),checks,
    identity:'curl_star(psi*A)=psi*curl_star(A); D_t(psi*u)=psi*D_t(u)+psi_prime*u. Every spatial derivative of psi is0 on the original independent-coordinate chart.',
    force:'The exact temporal-cutoff force is Q^(-A-1-h)*psi_prime*curl_star(A_base), including the full curl remainder. It is not only the primary pulse term.',
    originalFullCurlBeforeTimeCutoffDerivative:true,divisionByPsiUsed:false,sourceGaussianBoundAttached:false,sourceAuthenticated:false};
}

export function attachActualCommonBandPhysicalCurl(family,band,context={}){
  assertActualCommonAdmissibleFamily(family);assertActualCommonAdmissibleBand(band);
  if(band.family!==family)fail('INVALID_SOURCE_CONSTRUCTION','A physical member must come from the very same common family.');
  if(!band.scope.actualBandInsideExplicitGamma||!band.scope.actualPositiveWeightsOnDeclaredAdmissibleDomain)
    fail('UNSUPPORTED','The physical square roots require the actual member of the source-proved admissible band domain.');
  const sourceCount=band.G.nodes.length;clearDisposableThirdJetCaches(band.G);assertActualCommonAdmissibleBand(band);
  const G=new ActualCommonPhysicalJetExpressions(band.G,{maxNodes:4000000,checkCancelled:context.checkCancelled,compactFTC:true,onProgress:context.onProgress}),
    directions=['R','Z','T'].map(n=>band.coordinates[n]),q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    meshLabels=band.meshLabels??band.label?.meshLabels;
  if(!Array.isArray(meshLabels)||meshLabels.length!==3)fail('INVALID_SOURCE_CONSTRUCTION','The actual band must carry its own three fixed integer labels.');
  const map=originalCommonBandPhysicalMap(G,band,meshLabels);
  progress(context,'common-band-source-map-bound',G);
  if(!Number.isSafeInteger(map.Xb)||!G.nodes[map.Xb])fail('INVALID_SOURCE_CONSTRUCTION','The common source must retain the actual outer shell endpoint.');
  const {Q,epsilon,k}=map,{A,h}=band.constants,
    scales={potential:power(Q,G.sub(q(1,2),A)),velocity:power(Q,G.neg(A)),gradient:power(Q,G.neg(G.add(A,q(1,2)))),
      hessian:power(Q,G.neg(G.add(A,G.one))),time:power(Q,G.neg(G.add(A,G.one,h))),pressure:power(Q,G.mul(q(-2),A)),pressureGradient:power(Q,G.neg(G.add(G.mul(q(2),A),q(1,2))))},
    variations=[];
  for(const f of band.families){
    const original=G.covarianceSystems[f.system],system=G.definePulseThirdVariation({name:'ActualCommonBandThird_'+f.sign,variable:map.coordinates.v,
      parameters:original.parameters,directions,matrix:original.matrix,initial:original.initial,left:G.zero,length:original.length});
    G.bindOriginalCovarianceThirdJet(f.system,system);
    variations.push({sign:f.sign,originalSystem:f.system,system,matrix:G.pulseThirdJetSystems[system].matrix,
      bounds:G.pulseThirdJetSystems[system].bounds,allFortyComponents:G.pulseThirdJetSystems[system].dimension===40,
      originalMatrixAndDatumRetained:true,finiteSumReplacesLimit:false});
  }
  progress(context,'common-band-two-actual-third-variations',G);
  const bandCoordinate=G.neg(G.div(G.log(band.chart.qActual),G.log(q(2)))),
    bandAxis=fixedLabelSourcePartitionFactor(G,G.sub(bandCoordinate,band.geometry.ell)),
    meshAxes=directions.map((x,j)=>fixedLabelSourcePartitionFactor(G,G.sub(G.mul(G.pow(band.geometry.ell,6),x),meshLabels[j]))),
    slowCutoff={bandCoordinate,bandAxis,meshAxes,meshLabels,body:G.mul(bandAxis.value,...meshAxes.map(x=>x.value))},rows=[];
  for(const [index,f]of band.families.entries()){
    const sigma=band.target.squareRootWeights[index],weightedBaseAmplitude=f.t.map(x=>G.mul(G.sqrt(epsilon),sigma,band.cutoffs.chi,x)),
      weightedAmplitude=weightedBaseAmplitude.map(x=>G.mul(band.cutoffs.psi,x)),
      baseCoefficient=cross(G,f.frame.n,weightedBaseAmplitude).map(x=>G.div(G.mul(slowCutoff.body,x),G.mul(k,f.frame.nSquared))),
      coefficient=baseCoefficient.map(x=>G.mul(band.cutoffs.psi,x)),
      sine=G.sine(G.mul(k,f.phase)),basePotential=baseCoefficient.map(x=>G.neg(G.mul(x,sine))),potential=basePotential.map(x=>G.mul(band.cutoffs.psi,x)),
      pressureImaginary=G.mul(slowCutoff.body,G.sqrt(epsilon),sigma,band.cutoffs.chi,band.cutoffs.psi,dot(G,f.frame.pressureImaginaryRow,f.t)),
      pressure=G.neg(G.mul(pressureImaginary,sine)),
      phaseGradient=[G.derivative(f.phase,map.coordinates.R),G.div(G.derivative(f.phase,map.coordinates.theta),map.coordinates.R),G.mul(epsilon,G.derivative(f.phase,map.coordinates.Z))],
      phaseChecks=phaseGradient.map((x,j)=>same(G,x,f.frame.n[j])),
      jets=exactPhysicalVelocityJets(G,{...map.coordinates,epsilon,radialFast:map.radialFast,potential,pressure},context),
      rectangle=map.rectangles[index],mapped={},composition=[],
      primaryCylindrical=weightedAmplitude.map(x=>G.mul(slowCutoff.body,x,G.cosine(G.mul(k,f.phase)))),
      rotationCos=G.cosine(map.coordinates.theta),rotationSin=G.sine(map.coordinates.theta),
      primaryCartesian=[G.sub(G.mul(rotationCos,primaryCylindrical[0]),G.mul(rotationSin,primaryCylindrical[1])),
        G.add(G.mul(rotationSin,primaryCylindrical[0]),G.mul(rotationCos,primaryCylindrical[1])),primaryCylindrical[2]],
      primaryComposition=primaryCartesian.map((x,j)=>mapBody(G,G.mul(scales.velocity,x),map,rectangle,f.sign+'_primary_'+j)),
      temporal=originalTemporalCutoffFullCurlForce(G,{basePotential,psi:band.cutoffs.psi,map,residualScale:scales.time,rectangle,tag:String(f.sign)});
    if(phaseChecks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual moving phase normal differs from its retained spatial gradient.');
    for(const name of ['potential','velocity','gradient','hessian','time','pressureGradient']){
      let serial=0;const values=jets.roots[name],apply=body=>{
        const item=mapBody(G,G.mul(scales[name],body),map,rectangle,f.sign+'_'+name+'_'+serial++);composition.push(item);return item.mapped;
      };
      mapped[name]=Array.isArray(values[0])?values.map(row=>row.map(apply)):values.map(apply);
    }
    const pi=mapBody(G,G.mul(scales.pressure,pressure),map,rectangle,f.sign+'_pressure');composition.push(pi);mapped.pressure=pi.mapped;
    rows.push({sign:f.sign,originalCovariance:band.target.H,originalWeight:band.target.weights[index],sigma,weightedAmplitude,
      weightedBaseAmplitude,baseCoefficient,coefficient,basePotential,potential,temporal,pressureImaginary,pressure,originalPressureRow:f.frame.pressureImaginaryRow,
      phase:f.phase,phaseGradient,phaseChecks,jets,rectangle,mapped,composition,primaryCylindrical,primaryCartesian,primaryComposition,
      physicalPrimary:primaryComposition.map(x=>x.mapped),physicalCurlRemainder:mapped.velocity.map((x,j)=>G.sub(x,primaryComposition[j].mapped)),
      originalEikonalDefect:f.fullEikonalRemainder,realConjugatePair:'Re(i*C*exp(i*k*Phi))=-C*sin(k*Phi); each original conjugate has its factor1/2.',
      fullSlowCutoffBeforeCurl:true,allBasisAndCutoffDerivativesRetained:true});
    progress(context,'common-band-physical-curl-'+f.sign,G);
  }
  const combined={};
  for(const name of ['potential','velocity','gradient','hessian','time','pressureGradient']){
    const first=rows[0].mapped[name];combined[name]=Array.isArray(first[0])?first.map((row,i)=>row.map((_,j)=>G.add(...rows.map(r=>r.mapped[name][i][j])))):
      first.map((_,i)=>G.add(...rows.map(r=>r.mapped[name][i])));
  }
  combined.pressure=G.add(...rows.map(r=>r.mapped.pressure));combined.laplacian=combined.hessian.map(row=>G.add(row[0],row[3],row[5]));
  combined.primary=[0,1,2].map(j=>G.add(...rows.map(r=>r.physicalPrimary[j])));
  combined.curlRemainder=combined.velocity.map((x,j)=>G.sub(x,combined.primary[j]));
  const background=backgroundPhysicalJets(G,band,map,scales),b=background.physical,
    residual=exactPhysicalMomentumSplit(G,{background:b.velocity,backgroundGradient:b.gradient,backgroundTime:b.time,backgroundLaplacian:b.laplacian,backgroundPressureGradient:b.pressureGradient,
      wave:combined.velocity,waveGradient:combined.gradient,waveTime:combined.time,waveLaplacian:combined.laplacian,wavePressureGradient:combined.pressureGradient}),
    temporalForce=[0,1,2].map(j=>G.add(...rows.map(r=>r.temporal.physical[j]))),
    retainedAfterTemporalForce=residual.total.map((x,j)=>G.sub(x,temporalForce[j])),
    partition=attachActualSlowPartition({...band,G}),
    checks=[{id:'unchanged-private-common-family',pass:assertActualCommonAdmissibleFamily(family)},
      {id:'unchanged-private-own-band-source',pass:assertActualCommonAdmissibleBand(band)},
      {id:'original-own-source-prefix',pass:sameArray(G.nodes.slice(0,sourceCount),band.G.nodes.slice(0,sourceCount))},
      {id:'both-source-variations-with-all-slow-third-jets',pass:variations.length===2&&variations.every(x=>x.allFortyComponents&&!x.finiteSumReplacesLimit)},
      {id:'all-original-physical-curl-and-mixed-identities',pass:rows.length===2&&rows.every(r=>r.jets.checks.length===19&&r.jets.checks.every(x=>x.pass))},
      {id:'all-physical-source-jet-bodies-materialized',pass:rows.every(r=>[...r.jets.potentialBindings,r.jets.pressureBinding,r.jets.radialFastBinding].every(b=>b.originalBodyBound&&b.partials.every(x=>x.pass)))},
      {id:'all-physical-map-and-shell-guards',pass:map.checks.every(x=>x.pass)&&rows.every(r=>r.composition.length===40&&r.composition.every(c=>c.exactBodyRetained&&c.auxiliaryCoordinatesEliminated&&c.zeroGuardBeforeSingularEvaluation))},
      {id:'same-full-background-and-all-NS-products',pass:residual.checks.every(x=>x.pass)&&background.originalRadialCutoffCommutatorRetained},
      {id:'full-curl-temporal-cutoff-commutator',pass:rows.every(r=>r.temporal.checks.every(x=>x.pass)&&!r.temporal.divisionByPsiUsed)},
      {id:'actual-primary-and-retained-curl-remainder',pass:rows.every(r=>r.primaryComposition.length===3&&r.primaryComposition.every(x=>x.exactBodyRetained&&x.auxiliaryCoordinatesEliminated&&x.zeroGuardBeforeSingularEvaluation))},
      {id:'complete-original-integer-partition',pass:partition.labels.length===81&&partition.noIndependentOffsetCoordinates&&map.palette.commonToAllBandsAndLabels}],
    scope={actualOwnCommonBandPhysicalCurl:true,actualPhysicalVelocitySpace2Time1:true,actualCompleteCovarianceWeightDerivatives:true,
      originalFullHAndVolterraLimitsRetained:true,actualPhysicalPressureGradient:true,actualSameBackgroundNSResidualConstructed:true,
      actualFullCurlTemporalCutoffForceConstructed:true,
      allOrderedSelfInteractionsRetained:true,actualLocalDivergenceZero:true,completeOriginalPartitionRetained:true,
      thisExecutionMaterializesOneLabel:true,allLabelsLiterallyExecuted:false,uniformAllLabelBoundsAttached:false,
      totalUncorrectedNSResidualDeclaredZero:false,totalUncorrectedNSResidualDeclaredFlat:false,
      numericalValuesComputed:false,newLeanKernelProofExecuted:false,fullM2Complete:false,m3MayStart:false};
  if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','A common-band physical source binding failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const roots={combinedPhysicalJets:combined,backgroundPhysicalJets:b,physicalResidual:residual.total,retainedLinearResidual:residual.linear,
    actualTemporalCutoffForce:temporalForce,retainedPhysicalResidualAfterTemporalForce:retainedAfterTemporalForce,
    actualPrimaryWave:combined.primary,actualCurlRemainder:combined.curlRemainder,
    retainedWaveSelfAdvection:residual.waveSelfAdvection,originalEikonalDefects:rows.map(r=>r.originalEikonalDefect),originalH:band.target.H,originalWeights:band.target.weights},
    sourceBinding={producer:'actual-common-admissible-family.mjs:actualCommonAdmissibleBand',sourceCount,ownCommonSelector:true,
      originalPDFSHA256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',
      originalCoefficientsUnchanged:true,oneWitnessNotCopiedToOtherLabels:true,bodyDerivativeAuthentication:'The source C3 variational system and each actual used body partial are materialized; no caller derivative arrays or guessed zeros.'},
    result={G,family,band,request:band.request,sourceBinding,geometry:{...map,scales,partition},slowCutoff,variations,rows,background,residual,roots,checks,scope},
    packed=G.pack(roots,{schema:'MathScope.ActualCommonBandPhysicalCurlProgram/1',compiler:'actual-common-band-physical-curl.mjs:attachActualCommonBandPhysicalCurl',
      request:result.request,sourceBinding,geometry:result.geometry,slowCutoff,variations,rows,background,residual,checks,scope});
  result.program=JSON.parse(canonicalStringify(packed));
  seals.set(result,{G,family,band,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:data(result),program:canonicalStringify(result.program)});
  return result;
}

export function assertActualCommonBandPhysicalCurl(p){
  const s=seals.get(p);
  if(!s||s.G!==p.G||s.family!==p.family||s.band!==p.band||s.data!==data(p)||s.program!==canonicalStringify(p.program)||
    s.prefix!==canonicalStringify(p.G.nodes.slice(0,s.count))||!p.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private physical member of the same common family.');
  assertActualCommonAdmissibleFamily(s.family);assertActualCommonAdmissibleBand(s.band);return true;
}

export async function actualCommonBandPhysicalCurlCertificate(p){
  assertActualCommonBandPhysicalCurl(p);const s=seals.get(p);
  return {schema:'MathScope.ActualCommonBandPhysicalCurlCertificate/1',request:p.request,sourceBinding:p.sourceBinding,geometry:p.geometry,
    roots:p.roots,checks:p.checks,scope:p.scope,graph:{sha256:await sha256(s.program),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.program).length,fixedCompilerPrefix:true}};
}
