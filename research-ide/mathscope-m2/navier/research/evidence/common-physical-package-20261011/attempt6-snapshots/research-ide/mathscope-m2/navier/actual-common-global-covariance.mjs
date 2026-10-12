/** Original all-label PRIMARY covariance and the signed inverse handed to
 * N6. The full physical curl and its remainder remain separate objects.
 * Angular/Haar averages are never substituted for pointwise NS products.
 */
import {assertActualCommonGlobalWaveBounds} from './actual-common-global-wave-bounds.mjs';
import {assertActualCommonBandPhysicalCurl} from './actual-common-band-physical-curl.mjs';
import {covarianceGlobalAssemblyRecipe} from './actual-covariance-global-assembly.mjs';
import {exactSignedCovarianceInverse} from './actual-physical-residual-algebra.mjs';
import {assertSlowSignedTargetCoordinates} from './actual-common-physical-jet-kernel.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  data=p=>canonicalStringify({sourceBinding:p.sourceBinding,local:p.local,assembly:p.assembly,signedWitness:p.signedWitness,
    inverseClass:p.inverseClass,n6Interface:p.n6Interface,roots:p.roots,checks:p.checks,scope:p.scope});

function signedLocalTarget(physical,Sigma){
  const {G,band}=physical;
  const coordinateDomain=assertSlowSignedTargetCoordinates(G,Sigma,band.coordinates);
  // Input validation can fail cheaply, but every successful call must
  // reauthenticate the same live H, positive amplitudes and source graph.
  assertActualCommonBandPhysicalCurl(physical);
  const inverse=exactSignedCovarianceInverse(G,{H:band.target.H,amplitudes:band.target.squareRootWeights,epsilon:band.geometry.epsilon,target:Sigma}),
    rows=band.families.map((f,j)=>({sign:f.sign,fixedOriginalWeight:band.target.weights[j],fixedSquareRoot:band.target.squareRootWeights[j],
      amplitudeIncrement:inverse.deltaAmplitude[j],
      primaryCoefficient:f.t.map(t=>G.mul(G.sqrt(band.geometry.epsilon),inverse.deltaAmplitude[j],band.cutoffs.chi,band.cutoffs.psi,t)),
      pressureCoefficient:G.mul(G.sqrt(band.geometry.epsilon),inverse.deltaAmplitude[j],band.cutoffs.chi,band.cutoffs.psi,
        G.add(...f.frame.pressureImaginaryRow.map((a,i)=>G.mul(a,f.t[i])))),
      originalPhase:f.phase,originalH:band.target.H,originalMovingFrame:f.frame.B}));
  return {Sigma,inverse,rows,coordinateDomain,
    definition:'The original local primary increment has coefficient sqrt(epsilon)*delta_a_j*chi*psi*t_j and the SAME real cosine, phase, slow partition factor and physical scale as the fixed primary wave.',
    actualSourceHAndFixedPositiveAmplitudes:true,averagedBilinearInverse:true,
    targetMayHaveEitherSign:true,targetRegularityClassVerified:false,
    edgeQualification:'For an input in the stated M_alpha class the source derivative theorem below gives the flat supported extension. An arbitrary caller expression is not thereby certified to belong to that class.',
    newPhysicalCorrectionAlreadyAdded:false};
}

export function attachActualCommonGlobalCovariance(globalWave,context={}){
  assertActualCommonGlobalWaveBounds(globalWave);
  const physical=globalWave.physical,{family,band,G}=physical,sourceCount=G.nodes.length,sourcePrefix=canonicalStringify(G.nodes),
    q=(n,d=1)=>G.q(n,d),{R,Z,T,theta,v}=band.coordinates,
    angleCos=G.cosine(theta),angleSin=G.sine(theta),toCylindrical=values=>[
      G.add(G.mul(angleCos,values[0]),G.mul(angleSin,values[1])),
      G.sub(G.mul(angleCos,values[1]),G.mul(angleSin,values[0])),values[2]],
    atProfile=body=>G.simultaneousSubstitute(body,[family.roots.X,family.roots.eta],[band.chart.X,band.chart.eta]),
    targetProfile=family.leading.raw.map(atProfile),H=band.target.H,y=band.target.weights,sigma=band.target.squareRootWeights,
    epsilon=band.geometry.epsilon,mean=H.map(row=>G.mul(epsilon,G.add(...row.map((a,j)=>G.mul(a,y[j]))))),
    expected=band.target.components.map(x=>G.mul(epsilon,x)),
    localChecks=mean.map((x,j)=>sourceGraphRationalIdentity(G,G.sub(x,expected[j]),{atomicNodes:H.flat(),maxTerms:100000})),
    local={H,y,sigma,mean,expected,checks:localChecks,
      cosineMean:band.geometry.angularAverage,haarFactor:band.geometry.haarFactor,
      originalIntegralRows:band.families.map(f=>({sign:f.sign,theta:f.covariance.theta,z:f.covariance.z,mass:f.covariance.mass})),
      squareRootRule:sigma.map((x,j)=>({sqrt:x,radicand:y[j],nodeIsThePositiveSquareRoot:G.nodes[x].op==='sqrt_positive'&&G.nodes[x].args[0]===y[j]})),
      proof:'The original nonzero integer angular carrier gives the exact cosine-square average1/2. Each covariance column is its actual normalized Haar integral of chi^2*psi^2*t_r*t_tan. The weight is slow, hence leaves both integrals; by the positive square-root definition sigma_j^2=y_j. The source inverse then gives epsilon*H*y=epsilon*Tstar.',
      noExtraFactorForTheTwoSigns:true,noExtraIntegerCoverDegree:true,fullCurlUsedInThisPrimaryMean:false},
    assembly=covarianceGlobalAssemblyRecipe(G,{h:family.constants.h,q:band.chart.qActual,Q:band.geometry.Q,target:targetProfile,partition:physical.geometry.partition.partition}),
    signedTarget=expected.map(x=>G.neg(x)),signedWitness=signedLocalTarget(physical,signedTarget),
    signedChecks=signedWitness.inverse.dSigma.map((x,j)=>sourceGraphRationalIdentity(G,G.add(x,y[j]),{atomicNodes:H.flat(),maxTerms:100000})),
    inverseClass={
      input:'For each fixed alpha, a genuine source target Sigma in M_alpha has every finite slow jet bounded by a source constant*epsilon^alpha*zeta times a finite S power and endpoint pole.',
      reciprocalWeight:'Differentiate sigma*(1/sigma)=1. Since sigma>=sqrt(cy)*sqrt(zeta), the mth reciprocal jet is bounded by a source constant times zeta^(-1/2), a finite S power and endpoint pole. All product terms are present, using the already authenticated sigma jets.',
      matrix:'Every finite H^-1 jet has polynomial S growth by the actual determinant lower bound and the full differentiated inverse identity.',
      primary:'sqrt(epsilon)*delta_a = H^-1*Sigma/(2*sqrt(epsilon)*sqrt(y)). Thus L Sigma has W_(alpha-1/2) coefficients, with its actual unchanged Gaussian P and sqrt(zeta). This is a linear map of Sigma and does not require its sign to be positive.',
      fullCurl:'Use the same original n cross coefficient/(k*|n|^2) potential and same physical map. The 1/k factor gains epsilon^(1/2); the original radial fast derivative costs at most epsilon^(-kappa_s). The full curl remainder has class W_(alpha-kappa_s). All slow partition and basis derivatives are retained.',
      square:'The primary square is the displayed nonzero epsilon*H*(delta_a)^2. The entire increment covariance lies in M_(2alpha-1). Same-label squares do not vanish by palette separation.',
      previousCorrection:'Under the original additional premise U in W_(1/2), if U=W0+E with E in W_rho, the retained covariance residual consists of B(E,L Sigma), B(U,R_curl Sigma), and C(V). Their classes are M_(rho+alpha-1/2), M_(alpha+1/2-kappa_s), and M_(2alpha-1), respectively, in the original admissible exponent domain. The W_(1/2) premise is not inferred from arbitrary rho.',
      endpoints:'After these products every coefficient still contains sqrt(zeta), so the proven two-edge Gaussian/pole lemma supplies every fixed flat derivative. No reciprocal weight is evaluated at a zero boundary.',
      temporal:'The signed operator has the same fixed Gaussian P, so each temporal-cutoff commutator has the same all-label flat-tail proof after its finite source constants and alpha scale loss are inserted.',
      allFinite:'These are well-founded differentiated product/inverse recurrences on the SAME actual H and positive amplitudes; finite target membership is a separate premise, supplied by the subsequent N6 construction.'},
    n6Interface={
      covarianceFrame:{kind:'CYLINDRICAL_RADIAL_ANGULAR_AXIAL',originalAngle:theta,
        radialBasis:[angleCos,angleSin,G.zero],angularBasis:[G.neg(angleSin),angleCos,G.zero],axialBasis:[G.zero,G.zero,G.one],
        pointwiseProducts:'C_raw(u)=(u_r*u_theta,u_r*u_z) and B_raw(u,v)=(u_r*v_theta+v_r*u_theta,u_r*v_z+v_r*u_z). Project the Cartesian physical vectors onto these actual bases first.',
        definition:'The original C(u)=<<C_raw(u)>_theta>_Y and B(u,v)=<<B_raw(u,v)>_theta>_Y include both the angular and normalized auxiliary Haar averages (7.23). These are covariance operations. The pointwise products in the full physical NS residual are retained separately and are never replaced by an average.',
        originalAngularAndNormalizedHaarAveragesRequired:true},
      currentBackgroundVelocity:physical.background.physical.velocity,currentBackgroundPressure:physical.background.physical.pressure,
      actualCurrentFullWave:physical.roots.combinedPhysicalJets.velocity,actualCurrentWavePressure:physical.roots.combinedPhysicalJets.pressure,
      actualPrimary:physical.roots.actualPrimaryWave,actualCurlRemainder:physical.roots.actualCurlRemainder,
      actualCurrentFullWaveCylindrical:toCylindrical(physical.roots.combinedPhysicalJets.velocity),
      actualPrimaryCylindrical:toCylindrical(physical.roots.actualPrimaryWave),
      actualCurlRemainderCylindrical:toCylindrical(physical.roots.actualCurlRemainder),
      fullPhysicalResidual:physical.roots.physicalResidual,flatTemporalForce:physical.roots.actualTemporalCutoffForce,
      retainedAfterTemporalForce:physical.roots.retainedPhysicalResidualAfterTemporalForce,
      originalEikonalDefects:physical.roots.originalEikonalDefects,retainedSelfAdvection:physical.roots.retainedWaveSelfAdvection,
      iterationOrder:['Definition9.4','Proposition9.5','Proposition9.6','Lemma9.7','Lemma9.8','Proposition9.9'],
      status:'ACTUAL_M2_DATA_PREPARED; N6_CORRECTION_NOT_STARTED',
      covarianceMeaning:'The certified7.30 identity is the angular/Haar average of the primary wave. The actual full physical curl differs by the retained curl remainder; its complete NS residual stays in this interface.',
      noFieldOrResidualReplacedByItsAverage:true},
    checks=[{id:'private-common-global-wave-source',pass:assertActualCommonGlobalWaveBounds(globalWave)},
      {id:'two-actual-H-inverse-mean-identities',pass:localChecks.every(x=>x.pass)},
      {id:'original-positive-square-root-definition',pass:local.squareRootRule.every(x=>x.nodeIsThePositiveSquareRoot)},
      {id:'weights-are-slow-in-the-actual-integrals',pass:y.every(x=>[theta,v,band.cutoffs.xi].every(z=>!G.freeCoordinates(x).has(z)))},
      {id:'original-cosine-and-Haar-measures',pass:band.geometry.angularAverage===q(1,2)&&band.geometry.normalizedHaarNoExtraIntegerCoverMultiplicity&&band.families.every(f=>f.carrier.nonzeroAngularInteger)},
      {id:'same-leading-target-on-all-relative-bands',pass:band.target.raw.raw.every((x,j)=>x===family.leading.raw[j])&&band.target.raw.bothShearTermsRetained&&physical.geometry.partition.noIndependentOffsetCoordinates},
      {id:'global-physical-exponent-and-complete-partition',pass:assembly.checks.every(x=>x.pass)&&assembly.exponents.pass&&assembly.rows.length===81},
      {id:'actual-all-label-positivity-and-flat-joins',pass:globalWave.scope.actualCommonAllBandPositiveSmoothWeights&&globalWave.scope.actualGlobalFullCurlDivergenceZero},
      {id:'signed-source-witness-keeps-both-matrix-columns',pass:signedChecks.every(x=>x.pass)&&signedWitness.inverse.checks.every(x=>x.pass)&&signedWitness.inverse.targetMayHaveEitherSign},
      {id:'actual-full-residual-and-curl-remainder-stay-present',pass:n6Interface.actualCurlRemainder.length===3&&n6Interface.fullPhysicalResidual.length===3&&!physical.scope.totalUncorrectedNSResidualDeclaredFlat},
      {id:'physical-source-prefix-not-changed',pass:canonicalStringify(G.nodes.slice(0,sourceCount))===sourcePrefix}],
    sourceBinding={sourceProfile:family.request.sourceProfile,parameterExpressionSHA256:family.sourceBinding.parameterExpressionSHA256,
      sameActualCommonFamily:true,graphNamespace:'physical',sourceEquations:['7.27','7.30','7.37','7.40','7.41'],allLabelHypothesesFromPrivateGlobalWave:true},
    scope={actualOriginalGlobalPrimaryCovariance730:true,actualOriginalSignedCovarianceInverse:true,
      actualFullCurlResidualInterfaceForN6:true,actualAllLabelSupportAndEdgeHypotheses:true,
      fullPhysicalCurlCovarianceDeclaredEqualToPrimaryTarget:false,pointwiseProductReplacedByAverage:false,
      arbitrarySignedInputClassAutomaticallyCertified:false,actualN6CorrectionPerformed:false,
      originalN5CovarianceSourcePackageComplete:true,numericalDerivativeEnclosures:false,newLeanKernelProofExecuted:false,wholeM2Complete:false,M3Started:false};
  if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual common covariance/N6 interface lost a source binding: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const roots={localPrimaryMean:mean,globalPrimaryCovariance:assembly.roots.physicalTarget,signedWitness:signedWitness.inverse.deltaAmplitude,
    actualFullCurl:physical.roots.combinedPhysicalJets.velocity,actualCurlRemainder:physical.roots.actualCurlRemainder,retainedNSResidual:physical.roots.physicalResidual},
    result={G,globalWave,physical,family,sourceBinding,local,assembly,signedWitness:{...signedWitness,checks:signedChecks},inverseClass,n6Interface,roots,checks,scope};
  result.constructSignedLocalTarget=Sigma=>signedLocalTarget(physical,Sigma);
  const packed=G.pack(roots,{schema:'MathScope.ActualCommonGlobalCovarianceProgram/1',sourceBinding,local,assembly,
    signedWitness:result.signedWitness,inverseClass,n6Interface,checks,scope});
  result.program=JSON.parse(canonicalStringify(packed));
  seals.set(result,{G,globalWave,physical,family,constructSignedLocalTarget:result.constructSignedLocalTarget,
    count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:data(result),program:canonicalStringify(result.program)});
  context.onProgress?.({stage:'actual-common-global-covariance-and-N6-interface-sealed',nodeCount:G.nodes.length});return result;
}

export function assertActualCommonGlobalCovariance(p){
  const s=seals.get(p);
  if(!s||s.G!==p.G||s.globalWave!==p.globalWave||s.physical!==p.physical||s.family!==p.family||s.constructSignedLocalTarget!==p.constructSignedLocalTarget||
    s.data!==data(p)||s.program!==canonicalStringify(p.program)||s.prefix!==canonicalStringify(p.G.nodes.slice(0,s.count))||!p.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private original global covariance and signed inverse.');
  assertActualCommonGlobalWaveBounds(s.globalWave);return true;
}

export async function actualCommonGlobalCovarianceCertificate(p){
  assertActualCommonGlobalCovariance(p);const s=seals.get(p);
  return {schema:'MathScope.ActualCommonGlobalCovarianceCertificate/1',sourceBinding:p.sourceBinding,roots:p.roots,
    checks:p.checks,scope:p.scope,n6Interface:p.n6Interface,
    graph:{namespace:'physical',sha256:await sha256(s.program),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.program).length,fixedCompilerPrefix:true}};
}
