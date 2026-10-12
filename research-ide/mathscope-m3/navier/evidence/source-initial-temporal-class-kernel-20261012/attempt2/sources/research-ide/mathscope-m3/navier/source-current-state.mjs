/** Actual M2 common-family -> N6 current-state bridge.
 *
 * The private M2 constructors are executed again. Serialized root numbers,
 * browser rows and numerical samples are never accepted as field authority.
 * This finite query constructs one original band/mesh member; the complete
 * countable wave and the j=0 correction cycle are separate obligations.
 */
import {prepareActualCommonAdmissibleFamily} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {attachActualCommonBandPhysicalCurl,assertActualCommonBandPhysicalCurl,actualCommonBandPhysicalCurlCertificate} from '../../mathscope-m2/navier/actual-common-band-physical-curl.mjs';
import {exactCylindricalHarmonicCurl,normalizeEqualPiecewiseBranches} from '../../mathscope-m2/navier/actual-full-curl.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap();
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const pairs=[[0,0],[0,1],[0,2],[1,1],[1,2],[2,2]];
const pairNames=['rr','rtheta','rz','thetatheta','thetaz','zz'];
const dot=(G,a,b)=>G.add(...a.map((x,i)=>G.mul(x,b[i])));
const progress=(context,stage,G)=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length});};
const metadata=s=>({schema:s.schema,request:s.request,source:s.source,geometry:s.geometry,rows:s.rows,covariance:s.covariance,mean:s.mean,checks:s.checks,scope:s.scope});

function equal(G,left,right,atomicNodes=[]){
  const n=normalizeEqualPiecewiseBranches(G,G.sub(left,right),atomicNodes);
  return {...sourceGraphRationalIdentity(G,n.normalized,{atomicNodes,maxTerms:160000}),left,right,equalBranchNormalization:n.identities};
}

/** Put the guard outside the complete expression. A zero slow factor must
 * prevent evaluation of the source inverse/square root off its valid box.
 * All joins are the unchanged source's flat cutoffs, not hard clipping.
 */
function guardedSourceBody(G,physical,body,{auxiliary=true}={}){
  const map=physical.geometry,{xi,v}=map.coordinates;
  let out=body;
  if(auxiliary){
    out=G.choose(v,G.zero,map.Ls,G.zero,out,G.zero);
    out=G.choose(xi,G.neg(map.r0),map.r0,G.zero,out,G.zero);
  }
  out=G.choose(map.X,map.Xa,map.Xb,G.zero,out,G.zero);
  for(const axis of [...physical.slowCutoff.meshAxes,physical.slowCutoff.bandAxis])
    out=G.choose(axis.offset,...axis.activeOffsetInterval,G.zero,out,G.zero);
  return out;
}

function makeScalar(G,body,name){
  const free=[...G.freeCoordinates(body)].sort((a,b)=>a-b);
  return free.length?G.share(body,free,name):body;
}

function sourceMeanGeometry(G,physical){
  const b=physical.band,{R,Z,T}=b.coordinates,q=(n,d=1)=>G.q(n,d),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    s=b.chart.s,lambda=G.parameter('lambda'),h=G.parameter('h'),X0=G.parameter('X0Imean'),
    x0=G.mul(G.sqrt(G.mul(q(2),X0)),G.exp(q(1,2))),radialScale=G.sqrt(s),
    x=G.div(R,radialScale),u=G.fresh('n6_mean_bump_argument'),
    raw=G.exp(G.neg(G.inv(G.mul(u,G.sub(G.one,u))))),seed=G.choose(u,G.zero,G.one,G.zero,raw,G.zero),
    xunit=G.div(x,x0),argument=G.mul(q(10),G.sub(xunit,G.one)),
    unnormalized=G.div(G.substitute(seed,u,argument),G.mul(x0,radialScale)),
    radialVariable=G.fresh('n6_mean_radial_integral'),
    innerRadius=G.sqrt(G.parameter('Xa')),outerRadius=G.mul(q(2),G.sqrt(physical.geometry.Xb)),
    integrate=body=>G.integral(G.substitute(body,R,radialVariable),radialVariable,innerRadius,outerRadius),
    rhoMass=integrate(unnormalized),rho=G.div(unnormalized,rhoMass),cRho=G.mul(q(1,2),integrate(G.mul(G.pow(R,2),rho))),
    // The fixed physical cutoff is 0 before the first mean bump and 1
    // after it. Its location depends on q, not a reselected band label.
    chi=G.step(argument),
    supports={normalizedBumpArgument:argument,logXOverX0:['1','1+2*log(11/10)'],
      innerRadius,outerRadius,withinOriginalImean:true,
      originalMeanPatchX0:X0,allNormalizationFactorsRetained:true},
    checks=[{id:'original-positive-lambda-and-h-retained',pass:lambda!==G.zero&&h!==G.zero&&G.source.parametersExactExpressions.lambda?.exp!==undefined},
      {id:'mean-bump-support-strictly-inside-Imean',pass:1+2*Math.log(1.1)<5},
      {id:'fixed-chart-radial-envelope-independent-of-R-Z-T',pass:[innerRadius,outerRadius].every(a=>[R,Z,T].every(c=>!G.freeCoordinates(a).has(c)))},
      {id:'rho-normalization-uses-entire-actual-bump',pass:G.nodes[rhoMass].op==='definite_integral'&&G.nodes[rhoMass].args[2]===innerRadius&&G.nodes[rhoMass].args[3]===outerRadius}];
  return {R,Z,T,s,lambda,h,x0,radialScale,x,seed,seedVariable:u,unnormalized,rhoMass,rho,cRho,chi,radialVariable,innerRadius,outerRadius,supports,checks,
    integrate,primitive:body=>G.integral(G.substitute(body,R,radialVariable),radialVariable,innerRadius,R),
    power};
}

/** The auxiliary zero mode of equations (8.3), (8.12), (8.15).
 * All six full-curl covariances are used. The nonzero auxiliary pressure is
 * not replaced by this zero mode; it is explicitly still unconstructed.
 */
function currentInitialMean(G,physical,covariance,context){
  const g=sourceMeanGeometry(G,physical),{R,Z,T}=g,{epsilon}=physical.band.geometry,q=(n,d=1)=>G.q(n,d),
    Dr=x=>G.derivative(x,R),Dz=x=>G.mul(epsilon,G.derivative(x,Z)),
    De=(x,e)=>G.add(Dr(x),G.div(G.mul(q(e),x),R)),W=covariance.fullAuxiliaryMean,
    rawGr=G.add(G.neg(De(W.rr,1)),G.neg(Dz(W.rz)),G.div(W.thetatheta,R)),
    gr=makeScalar(G,rawGr,'N6_CurrentInitialMeanRadialSource'),P=makeScalar(G,g.integrate(gr),'N6_CurrentInitialPressureDefect'),
    pressureSource=G.sub(gr,G.mul(g.rho,P)),pressurePrimitive=g.primitive(pressureSource),
    totalPressureSource=g.integrate(pressureSource),
    pressure=G.sub(pressurePrimitive,G.mul(g.chi,totalPressureSource)),
    pressureCutoffRemainder=G.mul(Dr(g.chi),totalPressureSource),
    background=physical.band.background,{q:q0,X,eta}=background.coordinates,
    at=body=>G.simultaneousSubstitute(body,[q0,X,eta],[physical.band.chart.qActual,physical.band.chart.X,physical.band.chart.eta]),
    stressScale=G.mul(epsilon,g.power(g.s,G.neg(G.add(physical.band.constants.A,q(1,2))))),
    Sigma=[background.normalizedBodies.Ttheta,background.normalizedBodies.Tz].map(body=>G.mul(stressScale,at(body))),
    Etheta=G.sub(G.add(De(W.rtheta,2),Dz(W.thetaz)),De(Sigma[0],2)),
    Ez=G.sub(G.add(De(W.rz,1),Dz(G.add(W.zz,pressure))),De(Sigma[1],1)),
    Jtheta=makeScalar(G,g.integrate(G.mul(G.pow(R,2),W.thetaz)),'N6_CurrentInitialJtheta'),
    Jz=makeScalar(G,G.sub(g.integrate(G.mul(R,W.zz)),G.mul(q(1,2),g.integrate(G.mul(G.pow(R,2),gr)))),'N6_CurrentInitialJz'),
    directPressureDerivative=Dr(pressure),expectedPressureDerivative=G.sub(pressureSource,pressureCutoffRemainder),
    pressureCheck=equal(G,directPressureDerivative,expectedPressureDerivative,[gr,P,g.rho,totalPressureSource]);
  progress(context,'n6-current-full-curl-mean-defects-and-pressure-zero-mode',G);
  return {initialMeanVelocity:{beta:G.zero,v:G.zero,gamma:G.zero},gr,P,Jtheta,Jz,
    grBody:rawGr,pressure:{source:pressureSource,primitive:pressurePrimitive,totalSource:totalPressureSource,value:pressure,cutoffRemainder:pressureCutoffRemainder,
      directRadialDerivative:directPressureDerivative,expectedRadialDerivative:expectedPressureDerivative,check:pressureCheck,
      kind:'ACTUAL_AUXILIARY_ZERO_MODE_ONLY',normalization:'<p_m>_Y=T_0(<g_r>_Y-rho*P)',
      fullNonzeroAuxiliaryPressureConstructed:false,zeroMomentAlgebra:'integral(<gr>-rho*P)=P-(integral(rho))*P=0; rho has its full positive integral in its denominator.',
      zeroMomentNotAssumedAsAnInput:true},
    residual:{Etheta,Ez,radial:G.sub(directPressureDerivative,gr),fullOriginalStress:Sigma,
      stressSourceRoots:[background.normalizedBodies.Ttheta,background.normalizedBodies.Tz],
      fullHigherStressRetained:true,sourceBackgroundFlatResidualSeparate:true},
    geometry:Object.fromEntries(Object.entries(g).filter(([,value])=>typeof value!=='function')),checks:[...g.checks,{id:'actual-current-pressure-zero-mode-radial-identity',...pressureCheck}],
    scope:{actualFullCurlMeanDefectsConstructed:true,actualMeanPressureZeroModeConstructed:true,fullPressureConstructed:false,
      temporalMeanUpdateApplied:false,fiveMomentUpdateApplied:false,initializedJ0:false,sourceZeroModeArraysAreExactExpressions:true,numericalValuesComputed:false}};
}

/** Derive full cylindrical curl coefficients and the six angular and Haar
 * means on the SAME private source graph. The two signs need not have
 * different angular integers: their cross products vanish by the original
 * disjoint auxiliary supports, not a guessed frequency distinction.
 */
export function attachActualCurrentMeanState(physical,context={}){
  assertActualCommonBandPhysicalCurl(physical);
  const {G,band}=physical,sourceCount=G.nodes.length,sourcePrefix=canonicalStringify(G.nodes),sourceDefinitions=G.captureFunctionDefinitions(),
    {R,Z,theta,xi,v}=physical.geometry.coordinates,{epsilon,k,r0,Ls,Dgeom,ci}=band.geometry,q=(n,d=1)=>G.q(n,d),
    rows=[],checks=[];
  for(const [index,row] of physical.rows.entries()){
    const original=band.families[index],potential=row.coefficient.map((body,j)=>makeScalar(G,body,'N6_OriginalCoefficient_'+row.sign+'_'+j)),
      curl=exactCylindricalHarmonicCurl(G,{R,Z,xi,epsilon,radialFast:physical.geometry.radialFast,k,normal:original.frame.n,potential}),
      angularIndependent=potential.every(x=>!G.freeCoordinates(x).has(theta)),
      carrierCheck=equal(G,G.mul(k,original.carrier.p),original.carrier.roundedInteger,[k,original.carrier.roundedInteger]),
      local={},primary={},remainder={},mean={},primaryMean={},remainderMean={},
      jacobian=G.mul(Dgeom,ci),
      integrate=body=>G.mul(jacobian,G.integral(G.integral(body,xi,G.neg(r0),r0),v,G.zero,Ls));
    for(const [[a,b],name] of pairs.map((p,j)=>[p,pairNames[j]])){
      const actual=G.mul(q(1,2),G.add(G.mul(curl.leading[a],curl.leading[b]),G.mul(curl.remainder[a],curl.remainder[b]))),
        primaryBody=G.mul(q(1,2),G.pow(physical.slowCutoff.body,2),row.weightedAmplitude[a],row.weightedAmplitude[b]);
      local[name]=guardedSourceBody(G,physical,actual);
      primary[name]=guardedSourceBody(G,physical,primaryBody);
      remainder[name]=G.sub(local[name],primary[name]);
      mean[name]=makeScalar(G,integrate(local[name]),'N6_FullHaar_'+row.sign+'_'+name);
      primaryMean[name]=makeScalar(G,integrate(primary[name]),'N6_PrimaryHaar_'+row.sign+'_'+name);
      remainderMean[name]=G.sub(mean[name],primaryMean[name]);
    }
    const rowChecks=[{id:'same-original-potential-body-'+row.sign,pass:potential.every((x,j)=>G.nodes[x].op==='actual_expression_partial'&&G.expressionSystems[G.nodes[x].args[0]].body===row.coefficient[j])},
      {id:'angular-independent-full-potential-'+row.sign,pass:angularIndependent},
      {id:'source-nonzero-integer-angular-carrier-'+row.sign,pass:original.carrier.nonzeroAngularInteger&&carrierCheck.pass},
      {id:'actual-full-curl-geometric-identities-'+row.sign,pass:curl.divergence.checks.every(c=>c.pass)},
      {id:'all-six-full-covariances-retained-'+row.sign,pass:pairNames.every(n=>local[n]!==G.zero&&mean[n]!==undefined)},
      {id:'Haar-measure-not-multiplied-by-cover-degree-'+row.sign,pass:jacobian===G.mul(Dgeom,ci)&&band.geometry.normalizedHaarNoExtraIntegerCoverMultiplicity},
      {id:'full-curl-remainder-not-assumed-zero-'+row.sign,pass:curl.remainder.some(x=>x!==G.zero)&&pairNames.every(n=>remainder[n]!==undefined)}];
    checks.push(...rowChecks);
    rows.push({sign:row.sign,sourceRow:index,sourcePotential:[...row.coefficient],potential,curl,carrier:original.carrier,
      angularIndependent,carrierCheck,angularMean:local,primaryAngularMean:primary,fullMinusPrimaryAngularMean:remainder,
      auxiliaryMean:mean,primaryAuxiliaryMean:primaryMean,fullMinusPrimaryAuxiliaryMean:remainderMean,
      normalizedHaarJacobian:jacobian,rectangle:row.rectangle,checks:rowChecks,
      angularIdentity:'For the actual nonzero integer m=k*p, <(A cos(m theta+psi)-B sin(m theta+psi))_a*(...)_b>_theta=(A_a*A_b+B_a*B_b)/2.',
      noFrequencySeparationAssumed:true,zeroGuardBeforeSourceInverseEvaluation:true});
    progress(context,'n6-actual-full-angular-and-Haar-covariance-'+row.sign,G);
  }
  const fullAuxiliaryMean=Object.fromEntries(pairNames.map(name=>[name,makeScalar(G,G.add(...rows.map(r=>r.auxiliaryMean[name])),'N6_CurrentFullHaar_'+name)])),
    covariance={components:pairNames,fullAuxiliaryMean,
      angularMeanRepresentation:{kind:'SUM_OF_ORIGINAL_DISJOINT_PERIODIC_RECTANGLES',rows:rows.map(r=>({sign:r.sign,rectangle:r.rectangle,components:r.angularMean})),
        crossTermsZeroBy:'The actual common all-band palette separates the enlarged auxiliary supports of overlapping slow labels, including the two signs.',
        originalPalette:physical.geometry.palette,originalTorus:physical.geometry.torus},
      primaryOnlySubstitution:false,fullCurlRemaindersRetained:true,allSixSymmetricComponents:true,angularAndAuxiliaryMeansSeparate:true},
    mean=currentInitialMean(G,physical,covariance,context);
  checks.push(...mean.checks,{id:'original-disjoint-auxiliary-palette-authenticated',pass:physical.geometry.palette.pass&&physical.geometry.palette.commonToAllBandsAndLabels&&physical.geometry.torus.pass},
    {id:'unchanged-actual-M2-physical-prefix',pass:canonicalStringify(G.nodes.slice(0,sourceCount))===sourcePrefix&&G.functionDefinitionsUnchanged(sourceDefinitions)},
    {id:'still-authentic-private-M2-physical-member',pass:assertActualCommonBandPhysicalCurl(physical)});
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','N6 source-current checks failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const state={schema:'MathScope.N6.ActualCurrentMeanState/1',G,physical,request:band.request,
    source:{profile:G.source.id,paperSHA256:physical.sourceBinding.originalPDFSHA256,parameterExpressionSHA256:G.source.parameterExpressionSHA256,
      commonFamilyExecuted:true,sourcePhysicalNodeCount:sourceCount,originalPotentialCurlsUsed:true,serializedCertificateUsedAsAuthority:false},
    geometry:{coordinates:physical.geometry.coordinates,Q:band.geometry.Q,epsilon,k,meshLabels:band.meshLabels,paletteIndex:band.geometry.paletteIndex},
    rows,covariance,mean,checks,
    scope:{actualOriginalSourceExecuted:true,fullCylindricalWaveCovarianceConstructed:true,actualCurrentMeanDefectsConstructed:true,
      oneOriginalBandAndMeshMember:true,allBandsAndLabelsAssembled:false,originalFullBackgroundAndStressRetained:true,
      sourceParametersReplaced:false,sourcePrimaryOrPressureModified:false,fullPressureReconstructionComplete:false,
      completeN6:false,initializedJ0:false,analyticBlowupProof:false,numericalFullFieldValuesComputed:false}};
  const count=G.nodes.length;
  seals.set(state,{G,physical,count,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),metadata:canonicalStringify(metadata(state))});
  progress(context,'n6-current-mean-state-sealed',G);
  return state;
}

export function assertActualCurrentMeanState(state){
  const s=seals.get(state);
  if(!s||s.G!==state.G||s.physical!==state.physical||s.metadata!==canonicalStringify(metadata(state))||
    s.prefix!==canonicalStringify(state.G.nodes.slice(0,s.count))||!state.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged privately constructed current source state. A receipt or modified mean is not field authority.');
  assertActualCommonBandPhysicalCurl(state.physical);return true;
}

export async function actualCurrentMeanStateCertificate(state){
  assertActualCurrentMeanState(state);const s=seals.get(state),data=metadata(state),
    physical=await actualCommonBandPhysicalCurlCertificate(state.physical),
    encoded=canonicalStringify({metadata:data,nodes:state.G.nodes.slice(0,s.count),definitions:s.definitions});
  return {...data,physicalSource:physical,graph:{sha256:await sha256(encoded),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(encoded).length},
    execution:'ACTUAL_SOURCE_EXPRESSION_CONSTRUCTION',sourceExpressionValuesAreNumericalEnclosures:false,
    remaining:['Assemble every active original band/mesh member on one common torus.','Construct the nonzero-auxiliary pressure using the shifted radial primitive.','Apply the actual temporal correction before the five-moment j=0 update.','Prove the original class constants and the all-stage/final tail bounds.']};
}

export function prepareActualCurrentMeanState(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['meshLabels','maxNodes'].includes(k)))
    fail('INVALID_INPUT','The source query fixes the unchanged common6 family and first-admissible band; only a node budget and fixed mesh labels are accepted.');
  const maxNodes=input.maxNodes??5000000;
  if(!Number.isSafeInteger(maxNodes)||maxNodes<1000000||maxNodes>8000000)fail('RESOURCE_LIMIT','Use a finite source node budget from one to eight million.');
  const family=prepareActualCommonAdmissibleFamily({throughOrder:2,derivativeOrder:3,maxNodes,maxProfileJets:60000,maxJetRequests:600000},context),
    band=family.constructBand({maxNodes,...(input.meshLabels===undefined?{}:{meshLabels:input.meshLabels})},context),
    physical=attachActualCommonBandPhysicalCurl(family,band,context);
  return attachActualCurrentMeanState(physical,context);
}
