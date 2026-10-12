/** Actual M3 primary-wave class constants on the original source atlas.
 *
 * This adapter uses the private M3 current, its own moving frames and H,
 * and freshly generated norms of the SAME common source family. It never
 * presents an M3 object to the older M2 physical-band authenticator.
 * The fixed cutoff/map body constructor below is reused as scalar calculus;
 * the experimental source-global-class conclusion is not used as evidence.
 */
import {assertGlobalCurrentState,globalCurrentStateCertificate,globalGraphEqual,guardGlobalLocalBody} from './source-global-current.mjs';
import {assertActualCommonAdmissibleFamily} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {assertActualCommonTargetWeightedNorms,actualCommonTargetWeightedNormCertificate} from '../../mathscope-m2/navier/actual-common-target-weighted-norms.mjs';
import {originalWeightedCovarianceJetPowers,doubleBoundaryGaussianPoleBound} from '../../mathscope-m2/navier/actual-global-wave-bound-kernel.mjs';
import {normalizedHomogeneousPulseBinding} from '../../mathscope-m2/navier/actual-pulse-gaussian-power-kernel.mjs';
import {originalPulseTimeCutoff} from '../../mathscope-m2/navier/actual-gaussian-flat-tail-kernel.mjs';
import {assertSourceSquaredProductPartition,covariancePhysicalExponentAudit} from '../../mathscope-m2/navier/actual-covariance-global-assembly.mjs';
import {globalClassSourceCutoffAndMapConstants} from './source-global-class.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  copy=x=>structuredClone(x),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  choose=(n,k)=>{let c=1n;for(let j=1;j<=k;j++)c=c*BigInt(n-j+1)/BigInt(j);return c;},
  reserve=n=>n<=1n?0:(n-1n).toString(2).length,
  pairs=[[0,0],[0,1],[0,2],[1,1],[1,2],[2,2]],names=['rr','rtheta','rz','thetatheta','thetaz','zz'],
  degree=(power,pole=0)=>({power,pole}),mul=(a,b)=>degree(a.power+b.power,a.pole+b.pole),
  times=(a,n)=>degree(a.power+reserve(n),a.pole),
  sum=xs=>degree(Math.max(...xs.map(x=>x.power))+reserve(BigInt(xs.length)),Math.max(...xs.map(x=>x.pole))),
  product=(a,b,m)=>sum(Array.from({length:m+1},(_,j)=>times(mul(a[j],b[m-j]),choose(m,j)))),
  dot=(G,a,b)=>G.add(...a.map((x,j)=>G.mul(x,b[j]))),
  progress=(c,stage,G)=>{c.checkCancelled?.();c.onProgress?.({stage,nodeCount:G.nodes.length});};

/** Exact finite-order algebra. It supplies no source constants or seals.
 * The pressure numerator retains both n^T K and n_prime^T; its 1/k is
 * recorded as a separate sqrt(epsilon) gain, with the original carrier
 * frozen before slow or pulse differentiation.
 */
export function originalPrimaryClassDegreeProgram(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxWork','targetPoles'].includes(k)))
    fail('Select finite order, work budget and the actual target pole inventory only.','INVALID_INPUT');
  const order=input.order??0,maxWork=input.maxWork??100000,
    weighted=originalWeightedCovarianceJetPowers({order,maxWork,...(input.targetPoles?{targetPoles:input.targetPoles}:{})}),
    rows=weighted.mixed.rows,at=name=>{const r=rows.find(r=>r.label===name);if(!r)fail('Missing original primary coefficient '+name);return r.powers;},
    pressureNumerator=Array.from({length:order+1},(_,m)=>degree(Math.max(...[0,1,2].map(j=>at('original pressure numerator '+j)[m])))),
    invNormal=Array.from({length:order+1},(_,m)=>degree(at('original 1/|n|^2')[m])),
    pressureRow=Array.from({length:order+1},(_,m)=>product(pressureNumerator,invNormal,m)),
    pressure=Array.from({length:order+1},(_,m)=>times(product(pressureRow,weighted.amplitude,m),3n)),
    // The scalar half may be omitted only in an upper bound. The original
    // angular mean itself retains that half in the source binding below.
    primaryCovariance=Array.from({length:order+1},(_,m)=>product(weighted.amplitude,weighted.amplitude,m)),
    covarianceRemainder=Array.from({length:order+1},(_,m)=>product(weighted.curl,weighted.curl,m));
  if([...pressure,...primaryCovariance,...covarianceRemainder].some(r=>!Number.isSafeInteger(r.power)||!Number.isSafeInteger(r.pole)))
    fail('The exact primary coefficient degrees exceeded their representation budget.','RESOURCE_LIMIT');
  return {schema:'MathScope.N6.OriginalPrimaryClassDegreeProgram/1',order,weighted,pressureNumerator,invNormal,pressureRow,pressure,
    primaryCovariance,covarianceRemainder,
    exponents:{primary:'1/2',potential:'1',homogeneousPressure:'1',curlRemainder:'1-kappa_s',
      fullCovariance:'1',exactInitialCovarianceRemainder:'2-2*kappa_s',conservativeInitialCovarianceRemainder:'3/2-kappa_s'},
    pressureIdentity:'pi=i*(n^T*K-n_prime^T)*weightedAmplitude/(k*|n|^2).',
    fullCurlIdentity:'(weightedAmplitude+i*curlRemainder)*exp(i*k*Phi), after the actual moving-frame tangency identity.',
    angularMeanIdentity:'mean_theta(u_a*u_b)=(weightedAmplitude_a*weightedAmplitude_b+curlRemainder_a*curlRemainder_b)/2.',
    derivativeOrders:{output:order,amplitudeAndTarget:order+1,background:order+3},
    noMissingDerivativeReplacedByC2:true,allMixedProductsRetained:true,sourceAuthenticated:false,completeN6:false};
}

/** Execute the original H/positive-weight/global-partition identity on
 * THIS private current. No historical receipt or arbitrary H is accepted.
 */
export function attachOriginalPrimaryCovarianceIdentity(current){
  assertGlobalCurrentState(current);const {G,band,local}=current,{epsilon,haarFactor,Ls}=band.geometry,{v}=band.coordinates,
    q=(n,d=1)=>G.q(n,d),squareEpsilon=G.sqrt(epsilon),sourceRows=band.families.map((f,j)=>{
      const a=band.target.squareRootWeights[j],y=band.target.weights[j],old=local.rows[j],
        integrals=[1,2].map(component=>G.mul(haarFactor,G.integral(G.mul(G.pow(band.cutoffs.psi,2),f.t[0],f.t[component]),v,G.zero,Ls))),
        primary=Object.fromEntries(pairs.map(([u,w],i)=>[names[i],G.mul(q(1,2),old.weightedAmplitude[u],old.weightedAmplitude[w])])),
        remainder=Object.fromEntries(pairs.map(([u,w],i)=>[names[i],G.mul(q(1,2),old.curl.remainder[u],old.curl.remainder[w])])),
        factored=[1,2].map(component=>G.mul(q(1,2),G.pow(local.slowCutoff.body,2),G.pow(squareEpsilon,2),G.pow(a,2),
          G.pow(band.cutoffs.chi,2),G.pow(band.cutoffs.psi,2),f.t[0],f.t[component])),
        factorChecks=['rtheta','rz'].map((name,k)=>globalGraphEqual(G,primary[name],factored[k],
          [local.slowCutoff.body,squareEpsilon,a,band.cutoffs.chi,band.cutoffs.psi,...f.t])),
        fullAngular=Object.fromEntries(pairs.map(([u,w],i)=>[names[i],G.mul(q(1,2),G.add(
          G.mul(old.curl.leading[u],old.curl.leading[w]),G.mul(old.curl.remainder[u],old.curl.remainder[w])))])),
        guardChecks=names.map(name=>({component:name,
          pass:guardGlobalLocalBody(G,current.geometry,local.slowCutoff,fullAngular[name]).body===old.angularMean[name]})),
        homogeneousPressure=dot(G,f.frame.pressureImaginaryRow,old.weightedAmplitude),
        pressureExpected=[0,1,2].map(k=>G.div(G.sub(dot(G,f.frame.n,f.frame.principalK.map(r=>r[k])),f.frame.nPrime[k]),
          G.mul(band.geometry.k,f.frame.nSquared))),
        pressureChecks=pressureExpected.map((x,k)=>({component:k,pass:x===f.frame.pressureImaginaryRow[k]}));
      return {sign:f.sign,a,y,originalHColumn:band.target.H.map(r=>r[j]),actualIntegralColumn:integrals,
        primary,remainder,fullAngular,guardChecks,homogeneousPressure,pressureChecks,
        angularFactorChecks:factorChecks,actualTangency:old.tangency,
        squareRootDefinition:{a,radicand:y,pass:G.nodes[a].op==='sqrt_positive'&&G.nodes[a].args[0]===y},
        pass:factorChecks.every(x=>x.pass)&&integrals.every((x,i)=>x===band.target.H[i][j])&&a===old.originalFixedPositiveA&&
          old.tangency.pass&&guardChecks.every(x=>x.pass)&&pressureChecks.every(x=>x.pass)};
    }),localReduced=band.target.Hy.map(x=>G.mul(epsilon,G.pow(local.slowCutoff.body,2),x)),
    localTarget=band.target.components.map(x=>G.mul(epsilon,G.pow(local.slowCutoff.body,2),x)),
    inverseChecks=localReduced.map((x,j)=>globalGraphEqual(G,x,localTarget[j],
      [...band.target.H.flat(),...band.target.components,local.slowCutoff.body,epsilon])),
    partition=current.assembly.partition.partition,exponent=covariancePhysicalExponentAudit(),
    checks=[
      {id:'both-actual-H-integrals-positive-a-and-complete-curl',pass:sourceRows.length===2&&sourceRows.every(x=>x.pass&&x.squareRootDefinition.pass)},
      {id:'actual-positive-epsilon-root',pass:G.nodes[squareEpsilon].op==='sqrt_positive'&&G.nodes[squareEpsilon].args[0]===epsilon},
      {id:'unchanged-H-inverse-solves-the-original-target',pass:band.target.inverseChecks.every(x=>x.pass)&&inverseChecks.every(x=>x.pass)},
      {id:'complete-squared-partition-with-original-physical-exponents',pass:assertSourceSquaredProductPartition(G,partition)&&
        partition.rows.length===81&&exponent.pass&&current.assembly.sourceCrossTermsZero},
      {id:'all-six-whole-Haar-covariance-roots-retained',pass:names.every(name=>Number.isSafeInteger(current.covariance.fullAuxiliaryMean[name]))&&
        current.covariance.allSixSymmetricComponents&&current.covariance.fullCurlRemaindersRetained}];
  if(checks.some(x=>!x.pass))fail('An actual primary covariance or pressure source identity was lost: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  return {schema:'MathScope.N6.ActualPrimaryCovarianceAndPressureIdentity/1',sourceRows,localReduced,localTarget,inverseChecks,
    globalLeadingTarget:band.target.components.map(x=>G.mul(epsilon,x)),fullGlobalHaar:current.covariance.fullAuxiliaryMean,exponent,checks,
    identity:'The leading covariance equals epsilon*T0_star after the complete original squared partition. The full covariance retains every full-curl remainder.',
    proof:['The actual positive nt square root and cleared frame/triple-product identities identify each leading curl with its same weighted amplitude.',
      'The exact nonzero angular carrier gives cosine/sine squares one half and the mixed angular average zero. Thus the initial angular covariance remainder is exactly one half of the imaginary curl-remainder product.',
      'The two remaining chi/psi/pulse Haar integrals are the literal H columns. The same positive a has a^2=y and H*y=T0_star.',
      'The actual 81-candidate squared partition, original support palette and physical chart exponent identity give the global leading target, including its derivatives and flat edge extensions.'],
    samePrivateCurrentUsed:true,leadingCovarianceCancellationExecuted:true,fullCovarianceDeclaredEqualToTarget:false,
    completeNSResidualDeclaredZero:false,newLeanKernelProof:false};
}

const record=p=>({schema:p.schema,request:p.request,source:p.source,sourcePulseBindings:p.sourcePulseBindings,
  covariance:p.covariance,bounds:p.bounds,sourceReferences:p.sourceReferences,domain:p.domain,checks:p.checks,scope:p.scope});

/** Finite genuine source bound. The norm graph and current graph retain
 * separate namespaces. The source-bound class statement is for all points
 * and labels in the current's exact window, not a selected-point sample.
 */
export function attachGlobalPrimaryClassOperator(current,target,input={},context={}){
  assertGlobalCurrentState(current);assertActualCommonTargetWeightedNorms(target);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxWork'].includes(k)))
    fail('Select finite derivative order and work budget; source constants come only from the private same-family generators.','INVALID_INPUT');
  const request={order:input.order??0,maxWork:input.maxWork??100000},m=request.order,family=current.band.family;
  assertActualCommonAdmissibleFamily(family);
  if(target.family!==family)fail('The actual M3 current and target norms must share the same private common family.');
  if(!Number.isSafeInteger(m)||m<0||!Number.isSafeInteger(request.maxWork)||request.maxWork<1)
    fail('Use a finite nonnegative order and positive work budget.','INVALID_INPUT');
  const backgroundRow=family.source.backgroundNorms.gaussianRows.find(r=>r.derivativeOrder===m+1);
  if(!backgroundRow||backgroundRow.backgroundDerivativeOrder!==m+3||target.request.derivativeOrder<m+1)
    fail('The same family must actually generate C_(m+3) and weighted target norms through m+1 before this full-curl class leaf.','RESOURCE_LIMIT');
  const G=target.G,PG=current.G,band=current.band,c=family.constants,ownStart=G.nodes.length,sourceStart=PG.nodes.length,
    q=(n,d=1)=>G.q(n,d),targetRows=target.rows.slice(0,m+2),
    degreeProgram=originalPrimaryClassDegreeProgram({...request,targetPoles:targetRows.map(r=>r.pole)}),
    coefficientConstants=globalClassSourceCutoffAndMapConstants(G,family,m),
    E=G.pow(c.Bnorm,256),W=G.exp(G.mul(q(3),E,c.Lmax)),
    dstar=family.uniformCovariance.inverse.determinantScaleLower,cy=family.uniformCovariance.positivity.weightOverZetaLower,
    haarLengthUpper=G.mul(q(2),G.sub(q(4),G.mul(q(2),G.sqrt(q(2)))),G.pow(c.r0,2)),
    K=G.maximum(q(1n<<128n),backgroundRow.B_m,G.pow(W,m+3),G.inv(dstar),G.inv(G.sqrt(cy)),haarLengthUpper,
      coefficientConstants.maximum,...targetRows.map(r=>r.N_m)),
    rows=Array.from({length:m+1},(_,j)=>{
      const named={primary:degreeProgram.weighted.amplitude[j],potential:degreeProgram.weighted.potential[j],
        curlRemainder:degreeProgram.weighted.curl[j],homogeneousPressure:degreeProgram.pressure[j],
        fullCovariance:degreeProgram.primaryCovariance[j],covarianceRemainder:degreeProgram.covarianceRemainder[j]};
      // The full angular covariance also includes the correction square.
      // epsilon^(2-2kappa)<=epsilon, so one source maximum covers it.
      named.fullCovariance=sum([named.fullCovariance,named.covarianceRemainder]);
      return {order:j,inputBackgroundOrder:m+3,inputTargetOrder:m+1,fields:Object.fromEntries(Object.entries(named).map(([name,d])=>[name,{
        ...d,constant:G.pow(K,d.power),epsilonExponent:degreeProgram.exponents[name]??degreeProgram.exponents.exactInitialCovarianceRemainder,
        weight:name.includes('Covariance')||name==='covarianceRemainder'?'zeta':'sqrt(zeta)',
        gaussian:name.includes('Covariance')||name==='covarianceRemainder'?'P(v)^2':'P(v)',
        sourceStage:'LOCAL_COEFFICIENT_BEFORE_AUXILIARY_HAAR_AVERAGE',
        pointwiseBound:'constant*S_label^power*epsilon^epsilonExponent*weight*delta_*^(-pole)*gaussian'}]))};
    }),maxPole=Math.max(...rows.flatMap(r=>Object.values(r.fields).map(x=>x.pole))),
    boundary=doubleBoundaryGaussianPoleBound(G,{innerExponent:G.pow(c.t1,2),outerExponent:q(4),pole:maxPole}),
    // The original angular half remains in the field. For an upper bound
    // we safely use the full rectangle mass Dgeom*(2r0)^2. Every one of
    // the 81 boxes and both signs is included before any radial integral.
    auxiliaryMass=G.mul(q(4),G.sub(q(4),G.mul(q(2),G.sqrt(q(2)))),G.pow(c.r0,2)),
    referenceChartCovarianceFactor=G.exp(G.mul(G.add(G.mul(q(2),c.A),G.mul(q(2),c.h)),G.log(q(4)))),
    haarRows=rows.map(r=>({order:r.order,referenceS:'S_ref=ell_ref^2',gaussianEnvelopeAfterAverage:'P(v)^2<=1',
      fields:Object.fromEntries(['fullCovariance','covarianceRemainder'].map(name=>{
        const f=r.fields[name];return [name,{...f,constant:G.mul(q(162),auxiliaryMass,referenceChartCovarianceFactor,
          G.pow(q(4),r.order+f.power),f.constant),gaussian:'1',sourceStage:'COMPLETE_81_BOX_TWO_SIGN_GLOBAL_HAAR_COVARIANCE',
          pointwiseBound:'constant*S_ref^power*epsilon_ref^epsilonExponent*zeta*delta_*^(-pole)'}];
      })),
      exactComparison:'Here ratio=Q_ref/Q_label. All active labels have |ell_label-ell_ref|<=2, so S_label<=4*S_ref. The reference covariance equals ratio^(2A) times the local covariance; epsilon_label^alpha/epsilon_ref^alpha=ratio^(-h*alpha). All slow derivative chart factors are <=4 per derivative. The original X and both logarithmic boundary distances are unchanged.',
      everyCandidateRetained:true,pointActiveCountSubstitutedForWholeInventory:false,
      covarianceScope:'The complete normalized auxiliary Haar covariance. The Y-dependent covariance before Haar still requires the two-column (xi,v) common-torus pullback derivative factors.',
      completePreHaarCommonYCovarianceClassSupplied:false}));
  progress(context,'m3-primary-class-actual-target-cutoff-and-frame-constants',G);
  const sourcePulseBindings=band.families.map((f,j)=>{
    const system=PG.covarianceSystems[f.system],binding=normalizedHomogeneousPulseBinding(PG,{v:band.coordinates.v,length:band.geometry.Ls,
      lambda:f.frame.reference.lambda,dref:f.frame.reference.dref,damping:f.frame.actualDamping,projected:f.frame.projected,
      error:f.frame.projectedError,matrix:system.matrix,P:f.P,initial:system.initial},context),
      cutoff=originalPulseTimeCutoff(PG,band.coordinates.v,band.geometry.Ls),
      actualAmplitude=f.t.map(x=>PG.mul(PG.sqrt(band.geometry.epsilon),band.target.squareRootWeights[j],
        band.cutoffs.chi,band.cutoffs.psi,x)).map(x=>PG.mul(current.local.slowCutoff.body,x));
    return {sign:f.sign,graphNamespace:'current',system:f.system,originalMatrix:system.matrix,originalP:f.P,
      originalAmplitude:f.t,weightedAmplitude:current.local.rows[j].weightedAmplitude,originalPositiveA:band.target.squareRootWeights[j],
      fullNormal:f.frame.n,fullNormalPrime:f.frame.nPrime,originalB:f.frame.B,binding,
      originalInitialData:same(system.initial,[PG.one,PG.zero]),
      sourceAmplitudeBodyMatches:same(actualAmplitude,current.local.rows[j].weightedAmplitude),
      sameOriginalTimeCutoff:cutoff.psi===band.cutoffs.psi,
      frozenReferenceAndCarrier:[f.P,...Object.values(f.carrier).filter(Number.isSafeInteger)].every(x=>
        ['R','Z','T'].every(name=>!PG.freeCoordinates(x).has(band.coordinates[name]))),
      coefficientsBoundBySamePrimitive:band.bounds.primitive===family.uniformCovariance.primitiveProof};
  }),covariance=attachOriginalPrimaryCovarianceIdentity(current),
    sourceReferences={graphNamespace:'current',fullCurl:current.local.rows.map(r=>({sign:r.sign,potential:r.potential,
      leading:r.curl.leading,remainder:r.curl.remainder,fullCoefficient:r.curl.fullCoefficient,guards:r.guards})),
      H:band.target.H,positiveWeights:band.target.weights,positiveSquareRoots:band.target.squareRootWeights,
      fullGlobalCovariance:current.covariance.fullAuxiliaryMean,originalBackground:band.fields,
      currentPressure:current.mean.pressure.value,retainedCurrentE:current.target.E,
      originalSourcePrimitive:family.uniformCovariance.primitiveProof,
      integerIDsNeverCopiedFromCurrentToNormGraph:true},
    domain={...copy(current.domain),actualWindow:copy(band.window),sourceFamilyRequest:copy(family.request),
      sameCommonThresholdForAllFixedOrders:true,
      sourceWindow:'The concrete band includes every active coefficient through its certified cutoff window. Its first omitted term and every derivative vanish by the original selector; this one window is not claimed to cover every q.',
      allBandRecipe:'For each other valid prefix window run the same original selector, field, carrier, frame, exact Volterra and H construction. All norm constants here come from the same common family and are independent of the chosen window and discrete labels.',
      classCoordinates:'Fixed-label (R,Z,T,xi,v); representative, ell, mesh labels and rounded carriers are frozen before differentiation.',
      wholeAnnulus:'Xa<X<Xb, s in[1/2,2], eta in[-1,1] on the same original box. The actual positive weights extend smoothly by zero at both original flat edges.',
      derivativeExecution:'Every requested norm leaf is constructed. The private current has a separate finite slow-jet execution budget; the class proof does not assert that every high-order current derivative graph was materialized.'},
    checks=[
      {id:'same-private-M3-current-and-original-family',pass:target.family===band.family&&assertGlobalCurrentState(current)&&assertActualCommonAdmissibleFamily(family)},
      {id:'actual-source-Cm-plus-three-and-all-target-jets',pass:backgroundRow.backgroundDerivativeOrder===m+3&&targetRows.length===m+2&&
        targetRows.every((r,j)=>r.derivativeOrder===j&&r.pole===3+3*j)},
      {id:'same-primitive-determinant-and-weight-floors',pass:band.bounds.primitive===family.uniformCovariance.primitiveProof&&
        band.quantitative.sourceDeterminantScaleLower===dstar&&band.quantitative.sourceWeightOverZetaLower===cy},
      {id:'both-complete-stable-pulse-bindings-and-original-amplitudes',pass:sourcePulseBindings.length===2&&sourcePulseBindings.every(r=>
        r.binding.pass&&r.originalInitialData&&r.sourceAmplitudeBodyMatches&&r.sameOriginalTimeCutoff&&r.frozenReferenceAndCarrier&&r.coefficientsBoundBySamePrimitive)},
      {id:'complete-moving-normal-pressure-and-covariance-cancellation',pass:covariance.checks.every(r=>r.pass)},
      {id:'actual-all-order-source-recipe-and-single-common-threshold',pass:family.scope.allFixedDerivativeClausesBySameRecipe&&
        family.uniformCovariance.universalAnalyticRecipeSourceBound&&band.background.omittedTail.wholeBandAndAllCutoffDerivatives},
      {id:'actual-cutoff-chart-and-both-original-flat-factors',pass:coefficientConstants.materializedCoefficientBodies&&coefficientConstants.sourceOnly&&
        target.scalarRules.inner.a===G.pow(c.t1,2)&&target.scalarRules.outer.a===q(4)&&boundary.pass},
      {id:'all-norm-constants-are-source-only',pass:[K,W,dstar,cy,haarLengthUpper,boundary.constant,
        ...rows.flatMap(r=>Object.values(r.fields).map(x=>x.constant)),
        ...haarRows.flatMap(r=>Object.values(r.fields).map(x=>x.constant))].every(x=>G.freeCoordinates(x).size===0)},
      {id:'original-positive-h-and-small-radial-phase-loss',pass:family.constants.h===band.constants.h&&
        coefficientConstants.kappa===G.q(1,100000)&&degreeProgram.exponents.curlRemainder==='1-kappa_s'}];
  if(checks.some(x=>!x.pass))fail('The actual original primary class binding failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const bounds={graphNamespace:'norm',backgroundRow:copy(backgroundRow),targetRows:copy(targetRows),K,E,W,dstar,cy,haarLengthUpper,
      coefficientConstants,degreeProgram,rows,haarRows,boundary,auxiliaryMass,referenceChartCovarianceFactor,
      boundMeaning:'Finite positive expression constants, not floating-point values. Every row bounds all derivatives through that order on the actual same-box source domain.',
      actualInputTargetAndBackgroundNormsConstructed:true},
    result={schema:'MathScope.N6.ActualPrimaryClassOperator/1',G,current,target,request,
      source:{paperSHA256:current.source.paperSHA256,parameterExpressionSHA256:current.source.parameterExpressionSHA256,
        sourcePages:[77,78,79,84,85,86,87,88,106,107],sourceEquations:['7.12','7.16','7.19','7.20','7.27','7.37','9.11'],
        ownM3CurrentSeal:true,oldM2PhysicalBandSealUsed:false,allConstantsFromSamePrivateFamily:true},
      sourcePulseBindings,covariance,bounds,sourceReferences,domain,checks,
      scope:{actualOriginalPrimaryWOneHalfClassCertified:true,actualOriginalPotentialWOneClassCertified:true,
        actualOriginalPrimaryPressureWOneClassCertified:true,actualFullCurlRemainderWOneMinusKappaClassCertified:true,
        actualLeadingCovarianceCancellationBoundToCompleteCurrent:true,actualFiniteDerivativeOrder:m,
        actualFullAuxiliaryHaarCovarianceClassCertified:true,actualPreHaarCommonYCovarianceClassCertified:false,
        allFiniteOrdersBySameOriginalNormGenerator:true,allIntegerDerivativeGraphsLiterallyExecuted:false,
        actualPostTemporalFiveMapClassCertified:false,actualForcedInputWClassCertified:false,
        actualShiftedRadialPressureClassCertified:false,actualCompleteInitialN6TupleClassCertified:false,
        allFiniteIterationStagesClassCertified:false,completeN6:false,newLeanKernelProof:false}};
  seals.set(result,{G,current,target,ownStart,count:G.nodes.length,ownNodes:canonicalStringify(G.nodes.slice(ownStart)),
    definitions:G.captureFunctionDefinitions(),PG,sourceStart,sourceCount:PG.nodes.length,
    sourceNodes:canonicalStringify(PG.nodes.slice(sourceStart)),sourceDefinitions:PG.captureFunctionDefinitions(),
    record:canonicalStringify(record(result))});progress(context,'m3-primary-source-class-leaf-sealed',G);return result;
}

export function prepareGlobalPrimaryClassOperator(current,input={},context={}){
  assertGlobalCurrentState(current);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxWork','maxTargetNodes','maxTargetJetRequests'].includes(k)))
    fail('Select finite order and representation budgets; the target norm is generated from this private source family.','INVALID_INPUT');
  const order=input.order??0,target=current.band.family.constructTargetWeightedNorms({derivativeOrder:order+1,
    maxNodes:input.maxTargetNodes??5000000,maxJetRequests:input.maxTargetJetRequests??300000},context);
  return attachGlobalPrimaryClassOperator(current,target,{order,maxWork:input.maxWork??100000},context);
}

export function assertGlobalPrimaryClassOperator(p){
  const s=seals.get(p);if(!s||s.G!==p.G||s.current!==p.current||s.target!==p.target||s.record!==canonicalStringify(record(p))||
    s.ownNodes!==canonicalStringify(p.G.nodes.slice(s.ownStart,s.count))||!p.G.functionDefinitionsUnchanged(s.definitions)||
    s.PG!==p.current.G||s.sourceNodes!==canonicalStringify(s.PG.nodes.slice(s.sourceStart,s.sourceCount))||
    !s.PG.functionDefinitionsUnchanged(s.sourceDefinitions))fail('Use the unchanged actual primary source class attachment.');
  assertGlobalCurrentState(p.current);assertActualCommonTargetWeightedNorms(p.target);return true;
}

/** The original complete target program is saved once by the caller. This
 * additive packet retains every NEW norm coefficient body and every new
 * actual-pulse identity node, linked to the two authenticated base graphs.
 */
export async function globalPrimaryClassOperatorCertificate(p){
  assertGlobalPrimaryClassOperator(p);const s=seals.get(p),target=await actualCommonTargetWeightedNormCertificate(p.target),
    current=await globalCurrentStateCertificate(p.current),data=record(p),
    program={schema:'MathScope.N6.ActualPrimaryClassAdditiveProgram/1',targetBase:target.graph,currentBase:current.graph,
      norm:{start:s.ownStart,nodes:JSON.parse(s.ownNodes),definitions:s.definitions},
      current:{start:s.sourceStart,nodes:JSON.parse(s.sourceNodes),definitions:s.sourceDefinitions},record:data},
    encoded=canonicalStringify(program);
  return {...data,schema:'MathScope.N6.ActualPrimaryClassOperatorCertificate/1',sourceTarget:target,sourceCurrent:current,
    program,graph:{sha256:await sha256(encoded),canonicalBytes:new TextEncoder().encode(encoded).length,
      normNodeCount:s.count,normAddedNodes:s.count-s.ownStart,currentAddedNodes:s.sourceCount-s.sourceStart,
      graphRootIDsNamespaced:true,requiresCompleteAuthenticatedTargetBaseProgram:true},
    integerExpressionRootsAreNotNumericalNormValues:true};
}
