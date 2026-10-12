/** Original all-label full-curl means and their actual current Sigma.
 *
 * This module consumes the new source-bound band compiler and its fixed
 * representative. It does not import a selected M2 member's private seal.
 * All 81 point candidates are retained. The entire indexed field remains
 * inside every radial integral, so cells crossed by that integral are not
 * replaced by the at-most-16 positive boxes at one point.
 */
import {assertGlobalSourceBand,globalSourceBandCertificate} from './source-global-band.mjs';
import {assertGlobalFixedRepresentative,globalFixedRepresentativeCertificate} from './source-global-representative.mjs';
import {GlobalSourceExpressions,materializeGlobalSourceClosure} from './source-global-expressions.mjs';
import {originalCommonBandPhysicalMap} from '../../mathscope-m2/navier/actual-common-band-physical-curl.mjs';
import {fixedLabelSourcePartitionFactor} from '../../mathscope-m2/navier/actual-physical-full-curl.mjs';
import {attachActualSlowPartition} from '../../mathscope-m2/navier/actual-covariance-source-certificate.mjs';
import {assertSourceSquaredProductPartition,covariancePhysicalExponentAudit} from '../../mathscope-m2/navier/actual-covariance-global-assembly.mjs';
import {exactCylindricalHarmonicCurl,normalizeEqualPiecewiseBranches} from '../../mathscope-m2/navier/actual-full-curl.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {clearDisposableThirdJetCaches} from '../../mathscope-m2/navier/actual-third-jet-ftc.mjs';
import {normalizePressureMeanIntegral} from './source-signed-stress.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  pairs=[[0,0],[0,1],[0,2],[1,1],[1,2],[2,2]],names=['rr','rtheta','rz','thetatheta','thetaz','zz'];
const progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});};
const cross=(G,a,b)=>[G.sub(G.mul(a[1],b[2]),G.mul(a[2],b[1])),G.sub(G.mul(a[2],b[0]),G.mul(a[0],b[2])),G.sub(G.mul(a[0],b[1]),G.mul(a[1],b[0]))];
const dot=(G,a,b)=>G.add(...a.map((v,j)=>G.mul(v,b[j])));
export function shareGlobalScalar(G,body,name){const free=[...G.freeCoordinates(body)].sort((a,b)=>a-b);return free.length?G.share(body,free,name):body;}
export function globalGraphEqual(G,left,right,atomicNodes=[]){
  const n=normalizeEqualPiecewiseBranches(G,G.sub(left,right),atomicNodes);
  return {...sourceGraphRationalIdentity(G,n.normalized,{atomicNodes,maxTerms:180000}),left,right,equalBranchNormalization:n.identities};
}

/** A guard is an outer lazy piecewise operation, never merely a factor 0
 * multiplying an already evaluated singular body. The global cover adds
 * a still earlier band guard using the valid reference q, before a candidate
 * whose q/Q_ell lies outside [1/2,2] can call its local monotone root.
 */
export function guardGlobalLocalBody(G,geometry,slowCutoff,body,{auxiliary=true}={}){
  const {xi,v}=geometry.coordinates,layers=[];let out=body;
  const add=(coordinate,left,right,role)=>{const inner=out;out=G.choose(coordinate,left,right,G.zero,inner,G.zero);layers.push({role,coordinate,left,right,body:inner,guarded:out});};
  if(auxiliary){add(v,G.zero,geometry.Ls,'auxiliary longitudinal');add(xi,G.neg(geometry.r0),geometry.r0,'auxiliary transverse');}
  add(geometry.X,geometry.Xa,geometry.Xb,'original open stress shell');
  for(const [j,axis]of [...slowCutoff.meshAxes,slowCutoff.bandAxis].entries())add(axis.offset,...axis.activeOffsetInterval,j===3?'original local band':'original local mesh '+j);
  return {body:out,layers,zeroBeforeSingularBodyEvaluation:layers.every(x=>G.nodes[x.guarded].op==='smooth_piecewise'&&G.nodes[x.guarded].args[3]===G.zero&&G.nodes[x.guarded].args[5]===G.zero)};
}

function actualTangency(G,f,k,amplitude,rawPotential,potential){
  const n=f.frame.n,nt=f.frame.nt,tangentSquared=G.add(G.pow(n[1],2),G.pow(n[2],2)),ntSquared=G.pow(nt,2),
    ntDefinition=G.nodes[nt],frameAtoms=[...n,nt,f.frame.J[1][0]],
    frameChecks=[0,1].map(j=>globalGraphEqual(G,G.mul(ntSquared,dot(G,n,f.frame.B.map(row=>row[j]))),
      G.mul(n[0],G.sub(ntSquared,tangentSquared)),frameAtoms)),
    rawLeading=cross(G,n,rawPotential).map(x=>G.neg(G.mul(k,x))),normalAmplitude=dot(G,n,amplitude),
    tripleChecks=rawLeading.map((x,j)=>globalGraphEqual(G,x,G.sub(amplitude[j],G.div(G.mul(n[j],normalAmplitude),f.frame.nSquared)),[...n,...amplitude,k])),
    sharedBodies=potential.map((x,j)=>({root:x,body:G.materializeExpressionFunction(...G.nodes[x].args),expected:rawPotential[j]}));
  return {nt,tangentSquared,frameChecks,tripleChecks,sharedBodies,
    pass:ntDefinition.op==='sqrt_positive'&&ntDefinition.args[0]===tangentSquared&&frameChecks.every(x=>x.pass)&&tripleChecks.every(x=>x.pass)&&sharedBodies.every(x=>x.body===x.expected),
    proof:'The actual nt=sqrt(n_theta^2+n_z^2)>0 makes the checked cleared frame products vanish. Thus n dot B=0 and n dot t=0. The checked vector triple product identifies the leading curl with the retained tangent amplitude.',
    noNumericalTangencyAssumption:true};
}

/** Source chart geometry of the unchanged mean bump. The fixed radial
 * envelope contains the whole annulus for every s in [1/2,2], including
 * every mesh cell crossed at fixed Z,T. It is not a pointwise label list.
 */
export function globalMeanGeometry(G,band){
  const {R,Z,T}=band.coordinates,q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),s=band.chart.s,
    X0=G.parameter('X0Imean'),x0=G.mul(G.sqrt(G.mul(q(2),X0)),G.exp(q(1,2))),radialScale=G.sqrt(s),
    u=G.fresh('global_mean_bump_argument'),seed=G.choose(u,G.zero,G.one,G.zero,G.exp(G.neg(G.inv(G.mul(u,G.sub(G.one,u))))),G.zero),
    argument=G.mul(q(10),G.sub(G.div(R,G.mul(radialScale,x0)),G.one)),
    unnormalized=G.div(G.substitute(seed,u,argument),G.mul(x0,radialScale)),radialVariable=G.fresh('global_whole_radial_integral'),
    innerRadius=G.sqrt(G.parameter('Xa')),outerRadius=G.mul(q(2),G.sqrt(band.chart.Xb)),
    integrate=body=>G.integral(G.substitute(body,R,radialVariable),radialVariable,innerRadius,outerRadius),
    primitive=body=>G.integral(G.substitute(body,R,radialVariable),radialVariable,innerRadius,R),
    rhoMass=integrate(unnormalized),rho=G.div(unnormalized,rhoMass),cRho=G.mul(q(1,2),integrate(G.mul(G.pow(R,2),rho))),chi=G.step(argument),
    checks=[{id:'global-radial-envelope-fixed-in-slow-calculus',pass:[innerRadius,outerRadius].every(x=>[R,Z,T].every(v=>!G.freeCoordinates(x).has(v)))},
      {id:'global-mean-rho-normalized-on-whole-original-envelope',pass:G.nodes[rhoMass].op==='definite_integral'&&G.nodes[rhoMass].args[2]===innerRadius&&G.nodes[rhoMass].args[3]===outerRadius},
      {id:'original-reserved-mean-patch',pass:X0===G.parameter('X0Imean')&&1+2*Math.log(1.1)<5}];
  return {R,Z,T,s,X0,x0,radialScale,seed,argument,unnormalized,rhoMass,rho,cRho,chi,radialVariable,innerRadius,outerRadius,integrate,primitive,power,checks,
    supports:{originalMeanPatchX0:X0,logXOverX0:['1','1+2*log(11/10)'],withinOriginalImean:true,
      radialEnvelope:[innerRadius,outerRadius],entireIndexedFieldIntegrated:true,pointwisePositiveLabelCountUsedAsRadialCount:false}};
}

/** Equations (8.3), (8.12), (8.15) from all six actual full-curl means. */
export function buildGlobalMeanState(G,band,W,context={},prefix='GlobalCurrent'){
  const g=globalMeanGeometry(G,band),{R,Z,T}=g,{epsilon}=band.geometry,q=(n,d=1)=>G.q(n,d),
    Dr=x=>G.derivative(x,R),Dz=x=>G.mul(epsilon,G.derivative(x,Z)),De=(x,e)=>G.add(Dr(x),G.div(G.mul(q(e),x),R)),
    scalar=(body,name)=>shareGlobalScalar(G,body,prefix+'_'+name),
    rawGr=G.add(G.neg(De(W.rr,1)),G.neg(Dz(W.rz)),G.div(W.thetatheta,R)),gr=scalar(rawGr,'gr'),P=scalar(g.integrate(gr),'P'),
    pressureSource=G.sub(gr,G.mul(g.rho,P)),pressurePrimitive=g.primitive(pressureSource),totalPressureSource=g.integrate(pressureSource),
    pressure=G.sub(pressurePrimitive,G.mul(g.chi,totalPressureSource)),pressureCutoffRemainder=G.mul(Dr(g.chi),totalPressureSource),
    background=band.background,{q:q0,X,eta}=background.coordinates,
    at=body=>G.simultaneousSubstitute(body,[q0,X,eta],[band.chart.qActual,band.chart.X,band.chart.eta]),
    stressScale=G.mul(epsilon,g.power(g.s,G.neg(G.add(band.constants.A,q(1,2))))),
    fullOriginalStress=[background.normalizedBodies.Ttheta,background.normalizedBodies.Tz].map(x=>G.mul(stressScale,at(x))),
    Etheta=G.sub(G.add(De(W.rtheta,2),Dz(W.thetaz)),De(fullOriginalStress[0],2)),
    Ez=G.sub(G.add(De(W.rz,1),Dz(G.add(W.zz,pressure))),De(fullOriginalStress[1],1)),
    Jtheta=scalar(g.integrate(G.mul(G.pow(R,2),W.thetaz)),'Jtheta'),
    Jz=scalar(G.sub(g.integrate(G.mul(R,W.zz)),G.mul(q(1,2),g.integrate(G.mul(G.pow(R,2),gr)))),'Jz'),
    pressureCheck=globalGraphEqual(G,Dr(pressure),G.sub(pressureSource,pressureCutoffRemainder),[gr,P,g.rho,totalPressureSource]),
    mean={initialMeanVelocity:{beta:G.zero,v:G.zero,gamma:G.zero},gr,grBody:rawGr,P,Jtheta,Jz,
      pressure:{source:pressureSource,primitive:pressurePrimitive,totalSource:totalPressureSource,value:pressure,cutoffRemainder:pressureCutoffRemainder,check:pressureCheck,
        kind:'ACTUAL_COMPLETE_GLOBAL_AUXILIARY_ZERO_MODE',fullNonzeroAuxiliaryPressureConstructed:false},
      residual:{Etheta,Ez,fullOriginalStress,stressSourceRoots:[background.normalizedBodies.Ttheta,background.normalizedBodies.Tz],fullHigherStressRetained:true},
      geometry:Object.fromEntries(Object.entries(g).filter(([,v])=>typeof v!=='function')),
      checks:[...g.checks,{id:'global-current-mean-pressure-FTC',...pressureCheck}]};
  if(mean.checks.some(x=>!x.pass))fail('An actual global current mean/pressure identity failed.');
  progress(context,'global-source-all-six-means-whole-radial-P-J-and-pressure',G);return mean;
}

/** Corollary 8.5 is applied to the ACTUAL current full-cover covariance.
 * Its weighted zero moments are consequences of support, the displayed
 * FTC identities and integration by parts, never supplied input promises.
 */
export function buildGlobalCurrentSigma(G,band,covariance,mean,context={}){
  const g=mean.geometry,{R,Z,radialVariable:r,innerRadius:left,outerRadius:right}=g,{epsilon}=band.geometry,q=(n,d=1)=>G.q(n,d),
    integral=body=>G.integral(G.substitute(body,R,r),r,left,right),primitive=body=>G.integral(G.substitute(body,R,r),r,left,R),
    W=covariance.fullAuxiliaryMean,E=[mean.residual.Etheta,mean.residual.Ez],
    moments=[G.mul(epsilon,G.derivative(mean.Jtheta,Z)),G.mul(epsilon,G.derivative(G.add(mean.Jz,G.mul(g.cRho,mean.P)),Z))],
    sigma=[G.div(g.rho,G.pow(R,2)),G.div(g.rho,R)],
    pressureMeanNormalization=normalizePressureMeanIntegral(G,{mean}),
    normalizedBumpIdentities=sigma.map((x,j)=>globalGraphEqual(G,G.mul(G.pow(R,2-j),x),g.rho,[R,g.rho])),
    radialFlux=[G.mul(G.pow(R,2),G.sub(W.rtheta,mean.residual.fullOriginalStress[0])),G.mul(R,G.sub(W.rz,mean.residual.fullOriginalStress[1]))],
    axialFlux=[G.mul(G.pow(R,2),W.thetaz),G.mul(R,G.add(W.zz,mean.pressure.value))],
    weightedResidualIdentities=E.map((x,j)=>globalGraphEqual(G,G.mul(G.pow(R,2-j),x),
      G.add(G.derivative(radialFlux[j],R),G.mul(epsilon,G.derivative(axialFlux[j],Z))),[R,epsilon,...Object.values(W),...mean.residual.fullOriginalStress,mean.pressure.value])),
    sources=E.map((x,j)=>G.sub(x,G.mul(sigma[j],moments[j]))),
    integrals=sources.map((source,j)=>{
      const e=2-j,weighted=G.mul(G.pow(R,e),source),partial=primitive(weighted),whole=integral(weighted),
        value=G.neg(G.div(G.sub(partial,G.mul(g.chi,whole)),G.pow(R,e))),
        cutoffRemainder=G.div(G.mul(G.derivative(g.chi,R),whole),G.pow(R,e)),
        direct=G.add(G.derivative(value,R),G.div(G.mul(q(e),value),R)),
        check=globalGraphEqual(G,direct,G.add(G.neg(source),cutoffRemainder),[source,whole,g.chi,R]);
      return {weight:e,source,weighted,partial,whole,value,cutoffRemainder,direct,check};
    }),Sigma=integrals.map((x,j)=>shareGlobalScalar(G,x.value,'GlobalActualCurrentSigma_'+j)),
    checks=[...weightedResidualIdentities.map((x,j)=>({id:'global-current-weighted-residual-'+j,...x})),
      ...normalizedBumpIdentities.map((x,j)=>({id:'global-current-normalized-bump-'+j,...x})),
      ...integrals.map((x,j)=>({id:'global-current-Sigma-FTC-'+j,...x.check})),{id:'global-current-exact-pressure-zero-moment',...pressureMeanNormalization.check},
      {id:'global-current-Sigma-no-angular-or-auxiliary-coordinate',pass:Sigma.every(x=>[...G.freeCoordinates(x)].every(v=>[band.coordinates.R,band.coordinates.Z,band.coordinates.T,band.coordinates.ell].includes(v)))}];
  if(checks.some(x=>!x.pass))fail('An actual global current Sigma compatibility check failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const compatibility={equations:['8.12','8.13','8.15','8.16','8.18'],pressureMeanNormalization,weightedResidualIdentities,normalizedBumpIdentities,
    sourceSupport:{wholeOriginalShell:[G.parameter('Xa'),band.chart.Xb],radialEnvelope:[left,right],
      entireIndexedFieldInsideEveryIntegral:true,allCrossedRadialLabelsRetained:true,pointBoundSubstitutedForRadialCount:false},
    proofSteps:['Multiply the two actual global tangential residuals by R^2 and R. The checked literal identities give radial divergence plus epsilon times the Z derivative of their axial flux.',
      'Integrate the entire indexed field at fixed Z,T. Every source field has the original flat annular support. Its boundary flux is zero at both fixed envelope endpoints; local finiteness and flat joins permit differentiation and integration.',
      'The retained normalization integral of rho is its entire positive bump mass. Exact integral additivity therefore gives integral(gr-rho P)=0, including every Z derivative of that identity.',
      'Integration by parts gives integral R p=-1/2 integral R^2 gr+c_rho P. The FULL product Jz+c_rho P remains inside partial_Z.',
      'The two weighted rho bumps integrate to one. The weighted sources for Sigma have zero integral, so their displayed cutoff whole-integral remainders vanish by the actual support/FTC argument.'],
    theoremDependencies:['Original flat square-root weight extension at Xa,Xb and source C-infinity compact cutoffs.','Compact-subset locally finite all-label source wave and its fixed-label differentiability.'],
    allOrderTargetClassBoundCertified:false,newLeanKernelProof:false};
  progress(context,'global-source-current-Sigma-from-all-label-E-P-J',G);return {Sigma,E,moments,sigma,integrals,checks,compatibility,
    callerSuppliedTargetUsed:false,actualCurrentResidualUsed:true,fullProductCRhoPInsideDerivative:true,initialMeanVelocityZero:true};
}

/** Compose the whole local-cover mean in a reference chart. Candidate
 * guards are formed from that chart's valid q BEFORE any local body/root.
 */
export function registerGlobalMeanFields(G,band,partition,localSystems,{prefix='GlobalFullMean'}={}){
  const {R,Z,T,ell}=band.coordinates,{A,D}=band.constants,q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    radius=q(3,4),systems={},roots={},recipes={};
  for(const name of names.filter(n=>localSystems[n]!==undefined)){
    const rows=partition.labels.map((label,i)=>{
      const p=partition.partition.rows[i],b=partition.bands[p.relativeBand+1],
        meshOffsets=b.meshCoordinates.map((x,j)=>G.sub(x,label.grid[j])),bandOffset=G.sub(partition.bandCoordinate,label.ell),
        guards=[[band.chart.X,G.parameter('Xa'),band.chart.Xb],...meshOffsets.map(x=>[x,G.neg(radius),radius]),[bandOffset,G.neg(radius),radius]];
      return {localSystem:localSystems[name],values:[...b.slow,label.ell,...label.grid],localDirectionIndices:[0,1,2],
        coefficient:power(b.ratio,G.mul(q(2),A)),derivativeScales:[G.sqrt(b.ratio),power(b.ratio,D),b.ratio],guards,
        label:{key:label.key,ell:label.ell,Q:label.Q,grid:label.grid,signs:[1,-1],countInGlobalSum:1}};
    });
    systems[name]=G.defineGlobalIndexedField({name:prefix+'_'+name,parameters:[R,Z,T,ell],directions:[R,Z,T],rows,
      sourceRecipe:{referenceQ:band.geometry.Q,originalPartition:'actual-covariance-source-certificate.mjs:attachActualSlowPartition',
        completeCandidateCount:81,physicalMeanScale:'(Q_ref/Q_label)^(2A)',referenceDerivativeScales:['ratio^(1/2)','ratio^D','ratio'],
        candidateGuardRunsBeforeLocalMonotoneRoot:true,labelsNotDifferentiated:true,sourceAuthorityIssuedOnlyByEnclosingCurrentState:true}});
    roots[name]=G.globalIndexedValue(systems[name],[R,Z,T,ell]);recipes[name]=rows;
  }
  return {systems,roots,recipes};
}

const stateData=s=>({schema:s.schema,source:s.source,geometry:s.geometry,domain:s.domain,local:s.local,assembly:s.assembly,
  covariance:s.covariance,mean:s.mean,target:s.target,closure:s.closure,checks:s.checks,scope:s.scope});

export function attachGlobalCurrentState(representative,context={}){
  assertGlobalFixedRepresentative(representative);const band=representative.band;assertGlobalSourceBand(band);
  const G=band.G;if(!(G instanceof GlobalSourceExpressions))fail('Construct this band with the new independent global expression kernel.');
  clearDisposableThirdJetCaches(band.family.G);clearDisposableThirdJetCaches(G);
  const prefixCount=G.nodes.length,prefix=canonicalStringify(G.nodes),definitions=G.captureFunctionDefinitions(),
    {R,Z,T,ell,Xrep,etaRep,sRep,theta,v}=band.coordinates,xi=band.cutoffs.xi,q=(n,d=1)=>G.q(n,d),
    geometry=originalCommonBandPhysicalMap(G,band,band.meshLabels),
    bandCoordinate=G.neg(G.div(G.log(band.chart.qActual),G.log(q(2)))),bandAxis=fixedLabelSourcePartitionFactor(G,G.sub(bandCoordinate,ell)),
    meshAxes=[R,Z,T].map((x,j)=>fixedLabelSourcePartitionFactor(G,G.sub(G.mul(G.pow(ell,6),x),band.meshLabels[j]))),
    slowCutoff={bandCoordinate,bandAxis,meshAxes,body:G.mul(bandAxis.value,...meshAxes.map(x=>x.value))},
    parameters=[R,Z,T,xi,v,Xrep,etaRep,sRep,ell,...band.meshLabels],localParameters=[R,Z,T,ell,...band.meshLabels],
    atRepresentative=body=>G.simultaneousSubstitute(body,[Xrep,etaRep,sRep],[representative.roots.X,representative.roots.eta,representative.roots.s]),
    rows=[],means=Object.fromEntries(names.map(n=>[n,[]]));
  for(const [index,f]of band.families.entries()){
    const pulse=G.bindGlobalPulseDerivatives(f.system,{directions:[R,Z,T]}),a=band.target.squareRootWeights[index],
      amplitude=f.t.map(x=>G.mul(G.sqrt(band.geometry.epsilon),a,band.cutoffs.chi,band.cutoffs.psi,x)),
      weighted=amplitude.map(x=>G.mul(slowCutoff.body,x)),rawPotential=cross(G,f.frame.n,weighted).map(x=>G.div(x,G.mul(band.geometry.k,f.frame.nSquared))),
      potential=rawPotential.map((x,j)=>G.share(x,parameters,'GlobalOriginalPotential_'+f.sign+'_'+j)),
      curl=exactCylindricalHarmonicCurl(G,{R,Z,xi,epsilon:band.geometry.epsilon,radialFast:geometry.radialFast,k:band.geometry.k,normal:f.frame.n,potential}),
      tangency=actualTangency(G,f,band.geometry.k,weighted,rawPotential,potential),
      jacobian=G.mul(band.geometry.Dgeom,band.geometry.ci),integrate=body=>G.mul(jacobian,G.integral(G.integral(body,xi,G.neg(geometry.r0),geometry.r0),v,G.zero,geometry.Ls)),
      angularMean={},mean={},guards={};
    for(const [[a,b],name]of pairs.map((p,j)=>[p,names[j]])){
      const angular=G.mul(q(1,2),G.add(G.mul(curl.leading[a],curl.leading[b]),G.mul(curl.remainder[a],curl.remainder[b]))),
        aux=guardGlobalLocalBody(G,geometry,slowCutoff,angular),whole=integrate(aux.body),
        outer=guardGlobalLocalBody(G,geometry,slowCutoff,whole,{auxiliary:false}),
        fixed=atRepresentative(outer.body);
      angularMean[name]=aux.body;guards[name]={angular:aux,whole:outer};
      mean[name]=G.share(fixed,localParameters,'GlobalFixedRepresentativeMean_'+f.sign+'_'+name);means[name].push(mean[name]);
    }
    const checks=[{id:'global-source-potential-and-leading-tangency-'+f.sign,pass:tangency.pass},
      {id:'global-source-local-full-curl-identities-'+f.sign,pass:curl.divergence.checks.every(x=>x.pass)},
      {id:'global-source-fixed-representative-guards-'+f.sign,pass:Object.values(guards).every(x=>x.angular.zeroBeforeSingularBodyEvaluation&&x.whole.zeroBeforeSingularBodyEvaluation)},
      {id:'global-source-angular-half-integer-carrier-'+f.sign,pass:f.carrier.nonzeroAngularInteger&&band.geometry.angularAverage===q(1,2)&&potential.every(x=>!G.freeCoordinates(x).has(theta))},
      {id:'global-source-unchanged-Haar-normalization-'+f.sign,pass:band.geometry.normalizedHaarNoExtraIntegerCoverMultiplicity&&jacobian===G.mul(band.geometry.Dgeom,band.geometry.ci)}];
    if(checks.some(x=>!x.pass))fail('An original global local-body identity failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
    rows.push({sign:f.sign,pulse,originalCovariance:f.system,originalFixedPositiveA:a,amplitude,weightedAmplitude:weighted,rawPotential,potential,curl,tangency,
      angularMean,mean,guards,normalizedHaarJacobian:jacobian,checks,frozenRepresentativeRoots:representative.roots,
      angularCrossIdentity:'cos^2 and sin^2 have mean 1/2; cos*sin has mean zero for the same original nonzero integer angular carrier.',
      fullCurlRemainderRetained:true,sourceBodyDerivativesTakenBeforeRepresentativeSubstitution:true});
    progress(context,'global-source-original-full-curl-mean-'+f.sign,G);
  }
  const localSystems=Object.fromEntries(names.map(name=>{
      const body=G.add(...means[name]);return [name,G.defineExpressionFunction({name:'GlobalBothSignsFullMean_'+name,parameters:localParameters,body})];
    })),partition=attachActualSlowPartition(band),registered=registerGlobalMeanFields(G,band,partition,localSystems),
    fullAuxiliaryMean=registered.roots,
    covariance={components:names,fullAuxiliaryMean,indexedSystems:registered.systems,allSixSymmetricComponents:true,
      primaryOnlySubstitution:false,fullCurlRemaindersRetained:true,angularAndAuxiliaryMeansSeparate:true,
      commonTorus:geometry.torus,originalPalette:geometry.palette,
      crossLabelReason:'Every overlapping slow label and both signs use the original separated periodic support palette on the same normalized Haar torus.'},
    mean=buildGlobalMeanState(G,band,fullAuxiliaryMean,context),target=buildGlobalCurrentSigma(G,band,covariance,mean,context),
    qGlobalStar=G.exp(G.neg(G.mul(G.add(band.family.constants.ell0,q(4)),G.log(q(2))))),
    domain={referenceChart:'The original (R,Z,T), with T>=0, q=Q_ref*s>0 and 1/2<=s<=2.',
      q:band.chart.qActual,qGlobalStar,nextScale:band.window.nextSourceScale,nextScaleTimesQ:G.mul(band.window.nextSourceScale,band.chart.qActual),
      conditions:['0<q<qGlobalStar','b_(N+1)*q>=1'],prefixOrder:band.request.coefficientOrder,
      exactPrefixProof:'The actual common b_n is monotone. For n>=N+1, b_n*q>=1; the original time cutoff and all its derivatives are exactly zero, including at the flat endpoint.',
      prefixSharedByAllCoverLabels:true,prefixSharedByWholeRadialIntegral:true,
      bandFloorProof:'q<2^(-(ell0+4)) implies -log2(q)>ell0+4. Every active |ell+log2(q)|<3/4 therefore has ell>=ell0.',
      compatibleAtlas:'For any two prefix orders valid at this same q, every extra coefficient is exactly zero together with all derivatives. The backgrounds, phases, original matrices, Volterra solutions, H and fixed positive a coincide by ODE uniqueness. The actual monotone b_n>=2^n makes these prefix domains cover every q>0.',
      commonSequenceReplaced:false,oneFinitePrefixClaimedValidAtAllQ:false},
    assembly={partition,localSystems,parameters:localParameters,registeredRecipes:registered.recipes,candidateBoxes:81,
      atMostPositivePointBoxes:16,pointwiseLabelsUsedAsRadialInventory:false,
      derivativeRule:'For each fixed physical label, differentiate its complete local body first. In a reference chart the multiplier is ratio^(2A+a/2+b*D+c). Only then use the complete 81-candidate relabeling.',
      outerCandidateGuard:'Use reference q and mapped mesh coordinates to test all support guards before invoking a candidate local monotone root, fixed representative or H inverse.',
      radialRule:'Integrate the entire smooth indexed operation over the complete fixed source radial envelope. The operation reindexes all 81 candidates at each radial argument. No crossed cell is omitted.',
      sourceCrossTermsZero:geometry.palette.pass&&geometry.torus.pass,
      allMixedLocalDerivativesRetainFlatJoins:true,sourcePhysicalExponentAudit:covariancePhysicalExponentAudit()},
    checks=[...rows.flatMap(x=>x.checks),...mean.checks,...target.checks,
      {id:'global-source-complete-actual-81-cover',pass:partition.labels.length===81&&new Set(partition.labels.map(x=>x.key)).size===81&&assertSourceSquaredProductPartition(G,partition.partition)},
      {id:'global-source-all-label-bodies-registered',pass:names.every(n=>registered.recipes[n].length===81&&registered.recipes[n].every(r=>r.localSystem===localSystems[n]&&r.label.countInGlobalSum===1&&r.guards.length===5))},
      {id:'global-source-original-common-palette',pass:geometry.palette.pass&&geometry.palette.commonToAllBandsAndLabels&&geometry.torus.pass},
      {id:'global-source-physical-normalization-exponents',pass:assembly.sourcePhysicalExponentAudit.pass},
      {id:'global-source-fixed-representative-prefix-unchanged',pass:canonicalStringify(G.nodes.slice(0,prefixCount))===prefix&&G.functionDefinitionsUnchanged(definitions)&&assertGlobalFixedRepresentative(representative)}];
  if(checks.some(x=>!x.pass))fail('The actual global current assembly failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const state={schema:'MathScope.N6.GlobalActualCurrentState/1',G,band,representative,
    source:{paperSHA256:band.sourceBinding.originalPDFSHA256,parameterExpressionSHA256:G.source.parameterExpressionSHA256,
      originalM2Modified:false,sourceFamilyPrivateSealUsed:true,newM3BandAndRepresentativeSealsUsed:true,oldM2BandSealForged:false,
      serializedReceiptUsedAsFieldAuthority:false,prefixNodeCount:prefixCount},geometry,domain,
    local:{parameters,localParameters,slowCutoff,rows},assembly,covariance,mean,target,closure:null,checks,
    scope:{actualOriginalFullCoverMeanConstructed:true,actualCurrentGlobalSigmaConstructed:true,all81PointCandidatesRetained:true,
      completeIndexedFieldInsideRadialPrimitives:true,validOnDeclaredSourcePrefixAtlas:true,
      allOrderSourceClassBoundsCertified:false,signedThreeRemaindersConstructed:false,fullNonzeroAuxiliaryPressureConstructed:false,
      initializedJ0:false,originalN604Complete:false,completeN6:false,analyticBlowupProof:false,numericalGlobalFieldValuesComputed:false}};
  seals.set(state,{G,band,representative,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(stateData(state)),kernel:G.globalKernelDefinitions()});
  progress(context,'global-source-current-and-Sigma-sealed',G);return state;
}

export function assertGlobalCurrentState(state){
  const s=seals.get(state);
  if(!s||s.G!==state.G||s.band!==state.band||s.representative!==state.representative||s.data!==canonicalStringify(stateData(state))||
    s.prefix!==canonicalStringify(state.G.nodes.slice(0,s.count))||!state.G.functionDefinitionsUnchanged(s.definitions))
    fail('Use the unchanged privately constructed global source current state and its complete original target.');
  assertGlobalFixedRepresentative(state.representative);return true;
}
export async function globalCurrentStateCertificate(state){
  assertGlobalCurrentState(state);const s=seals.get(state),G=state.G,data=stateData(state),
    band=await globalSourceBandCertificate(state.band),representative=await globalFixedRepresentativeCertificate(state.representative),
    encoded=canonicalStringify({data,nodes:G.nodes.slice(state.source.prefixNodeCount,s.count),definitions:s.definitions,kernel:s.kernel});
  return {...data,sourceBand:band,sourceRepresentative:representative,
    graph:{sha256:await sha256(encoded),nodeCount:s.count,deltaNodeCount:s.count-state.source.prefixNodeCount,canonicalBytes:new TextEncoder().encode(encoded).length},
    execution:'ACTUAL_ORIGINAL_SOURCE_EXPRESSION_CONSTRUCTION',numericalValuesOrEnclosures:false};
}

export async function auditGlobalCurrentDerivatives(state,context={}){
  assertGlobalCurrentState(state);const {G}=state,
    roots=[...Object.values(state.covariance.fullAuxiliaryMean),state.mean.gr,state.mean.P,state.mean.Jtheta,state.mean.Jz,
      state.mean.pressure.value,...state.target.E,...state.target.Sigma,
      ...state.local.rows.flatMap(row=>[...row.potential,...row.curl.radialDerivatives,...row.curl.axialDerivatives,row.curl.divergence.real,row.curl.divergence.imaginary])],
    closure=materializeGlobalSourceClosure(G,roots,context);
  assertGlobalCurrentState(state);
  const source=await globalCurrentStateCertificate(state),definitions=G.captureFunctionDefinitions(),kernel=G.globalKernelDefinitions(),
    encoded=canonicalStringify({sourceGraph:source.graph,closure,nodes:G.nodes.slice(state.source.prefixNodeCount),definitions,kernel}),
    checks=[{id:'every-requested-global-mean-derivative-has-all81-candidates',pass:closure.indexedPartials.length>0&&closure.indexedPartials.every(x=>x.rows===81&&x.allDeclaredRowsRetained&&!x.labelsDifferentiated)},
      {id:'each-original-sign-has-actual-variational-matrix-bodies',pass:[0,1].every(id=>closure.pulseBlocks.some(x=>x.pulse===id))&&closure.pulseBlocks.every(x=>x.allCoefficientAndTimeDerivativeBodiesGenerated)},
      {id:'all-current-source-shared-derivatives-materialized',pass:closure.allRequestedSharedBodiesMaterialized&&closure.allActualApplicationArgumentsRetained},
      {id:'no-discrete-point-label-bound-used-as-radial-sum',pass:state.assembly.pointwiseLabelsUsedAsRadialInventory===false&&state.scope.completeIndexedFieldInsideRadialPrimitives}];
  if(checks.some(x=>!x.pass))fail('The actual global current derivative audit failed.');
  progress(context,'global-source-current-derivative-audit-complete',G,{functions:closure.partials.length});
  return {schema:'MathScope.N6.GlobalCurrentDerivativeAudit/1',source,closure,kernel,checks,
    graph:{sha256:await sha256(encoded),nodeCount:G.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length},
    actualSourceBodiesExecuted:true,numericalFieldEnclosureComputed:false,allOrderClassBoundCertified:false,originalN604Complete:false};
}
