/** Actual three-component inner-path enclosures with s=-log(tau) primary.
 *
 * The original common coefficient family, normalized all-order tail and
 * localization are rebuilt. The complete N6 final-field identification is
 * still an EXTERNAL source-theorem dependency. No arbitrary spatial sample,
 * pressure, force, or velocity after t=1 is manufactured by this module.
 */
import {prepareActualSourceLocalization,assertActualSourceLocalization,actualSourceLocalizationCertificate,exactLocalizationTau} from './source-localization.mjs';
import {evaluateActualCorePoint} from '../../mathscope-m2/navier/actual-core-evaluator.mjs';
import {assertActualGlobalLeadingPrepared} from '../../mathscope-m2/navier/actual-continuation-exact-global.mjs';
import {actualSupportOrderProof} from '../../mathscope-m2/navier/actual-continuation-exact-support.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {SOURCE_PROFILE_ID} from '../../mathscope-m2/navier/source-profile.mjs';
import {rational,readRational,qcompare,qadd,qsub,qtext,directedArithmetic} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),copy=value=>structuredClone(value),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const metadata=p=>({schema:p.schema,request:p.request,sourceBinding:p.sourceBinding,localizationBinding:p.localizationBinding,
  point:p.point,leadingBinding:p.leadingBinding,leading:p.leading,tail:p.tail,constants:p.constants,
  decimalSamples:p.decimalSamples,rows:p.rows,claims:p.claims,checks:p.checks,scope:p.scope,formulaProgram:p.formulaProgram});

function requestOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['decimalTaus','depths','bits','degree'].includes(k)))
    fail('INVALID_INPUT','Only exact decimal observations, finite enclosure depths, interval bits and comparison degree may be chosen. The original source point and constants are fixed.');
  const decimalTaus=input.decimalTaus??['1e-2','1e-4','1e-8','1e-12','1e-40','1e-1000'],depths=input.depths??[0,2,4,8,12],bits=input.bits??256,degree=input.degree??64;
  if(!Array.isArray(decimalTaus)||!decimalTaus.length||decimalTaus.length>32||new Set(decimalTaus).size!==decimalTaus.length)
    fail('INVALID_INPUT','Use 1..32 distinct exact positive decimal observations.');
  decimalTaus.forEach(exactLocalizationTau);
  if(!Array.isArray(depths)||!depths.length||depths.length>32||new Set(depths).size!==depths.length||depths.some(n=>!Number.isSafeInteger(n)||n<0||n>256))
    fail('INVALID_INPUT','Use 1..32 distinct integer error depths in 0..256.');
  if(!Number.isSafeInteger(bits)||bits<128||bits>512||!Number.isSafeInteger(degree)||degree<32||degree>64)
    fail('INVALID_INPUT','Use 128..512 directed interval bits and comparison degree 32..64.');
  return {decimalTaus:[...decimalTaus],depths:[...depths].sort((a,b)=>a-b),bits,degree};
}

/** This finite interval operation contains no source authority. Its callers
 * must provide actual source intervals, and its results are never proof tags.
 */
export function widenSourceInterval(interval,error,bits=256){
  const lower=readRational(interval?.lower),upper=readRational(interval?.upper),radius=readRational(error);
  if(qcompare(lower,upper)>0||qcompare(radius,rational(0))<0||!Number.isSafeInteger(bits)||bits<128||bits>512)
    fail('INVALID_INTERVAL','Use ordered exact bounds, a nonnegative exact error and 128..512 bits.');
  const exact={lower:qtext(qsub(lower,radius)),upper:qtext(qadd(upper,radius))},A=directedArithmetic(bits);
  return {...exact,displayEnclosure:A.pack(A.unpack(exact)).displayEnclosure,remainderAbsUpper:qtext(radius),midpointUsed:false};
}

function appendClosedObservations(localization,G,roots){
  const program=copy(localization.formulaProgram),mapping=new Map(program.sourceNodeIds.map((id,i)=>[id,i]));
  const append=id=>{
    if(mapping.has(id))return mapping.get(id);
    const {op,args}=G.nodes[id]??{};let out;
    if(['rational','source_parameter','coordinate'].includes(op))out=[...args];
    else if(['integer_power','source_step_derivative'].includes(op))out=[append(args[0]),args[1]];
    else if(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling','floor','sine','cosine','definite_integral','smooth_piecewise'].includes(op))out=args.map(append);
    else fail('INVALID_SOURCE_CONSTRUCTION','Unsupported closed observation scalar: '+op);
    const index=program.nodes.length;program.nodes.push({op,args:out});program.sourceNodeIds.push(id);mapping.set(id,index);return index;
  };
  if(Object.values(roots).some(id=>G.freeCoordinates(id).size))fail('INVALID_SOURCE_CONSTRUCTION','A selected sample retained a free coordinate.');
  return {...program,schema:'MathScope.N8.SourceNearTerminalScalarProgram/1',
    sourceLocalizationProgramRoots:program.roots,roots:Object.fromEntries(Object.entries(roots).map(([name,id])=>[name,append(id)])),
    primaryTimeVariable:'s=-log(tau)',allSelectedObservationRootsHaveNoFreeCoordinates:true,
    inheritedCartesianCutoffRetained:true,positiveTauNeverReconstructedFromDisplayedTime:true,
    valuesAreExactExpressions:true,underflowReplacedByZero:false};
}

/** Unfold the literal leading U/M/v branches on 0<X<Xa. Each branch
 * threshold and every discarded I1 bump is bound to the original source;
 * no compact-integrand argument is used to erase an accumulated moment.
 */
function originalLeadingInnerRestriction(localization){
  const {inner}=localization,{G,family}=inner,b=family.prepared.bootstrap,leading=b.originalLeading,
    {X,eta}=b.constants,{pre,loop}=leading,q=(n,d=1)=>G.q(n,d),Lambda=G.parameter('Lambda'),Xa=G.parameter('Xa'),
    p=G.source.parametersExactExpressions,XR=G.parameter('XR'),X0=G.parameter('X0I1'),Ileft=G.parameter('loopILeft'),
    {restLeft,restRight}=pre.constants,sourceOrder=actualSupportOrderProof(b.completedOrderOne);
  assertActualGlobalLeadingPrepared(leading);
  const parameterChecks={
    exactXa:same(p.Xa,{quotient:[{integer:4},{ref:'Lambda'}]}),
    exactXR:same(p.XR,{product:[{integer:110},{power:[{product:[{ref:'CSelected'},{ref:'Pstar'}]},10]}]}),
    exactPstar:same(p.Pstar,{exp:{ref:'logP'}})&&same(p.logP,{product:[{integer:2},{ref:'T'}]}),
    exactPositiveC:same(p.CSelected,{exp:{ref:'logCSelected'}})&&same(p.logCSelected,{sum:[{product:[{integer:10},{log:{sum:[{integer:1},{ref:'BRefUpper'}]}}]},{power:[{ref:'Q'},200]}]})&&same(p.BRefUpper,{power:[{ref:'Q'},300]}),
    exactPositiveJ:same(p.j0,{power:[{ref:'h'},4]}),
    restorationStarts:restLeft===G.mul(XR,G.exp(q(-8)))&&restRight===G.mul(XR,G.exp(q(-7))),
    loopStartsAfterXa:same(p.loopILeft,{product:[{quotient:[{integer:4},{ref:'Lambda'}]},{exp:{quotient:[{ref:'t1'},{integer:8}]}}]}),
    I1StartsAfterXR:same(p.X0I1,{product:[{ref:'XR'},{exp:{sum:[{ref:'T'},{integer:2},{product:[{integer:60},{ref:'BOuter'}]},{integer:-25}]}}]})&&same(p.BOuter,{product:[{integer:1000},{ref:'T'}]}),
    sourceOrder:sourceOrder.pass,
    sourceNaturalKernels:G.naturalKernel.coefficientImplementation==='actual-continuation-exact-core.mjs:prepareActualNaturalCoreProgram'&&G.naturalKernel.tailImplementation==='actual-continuation-exact-tail.mjs:actualNaturalScaledTail'
  };
  if(!Object.values(parameterChecks).every(Boolean))fail('INVALID_SOURCE_CONSTRUCTION','The original inner leading support or parameter definition changed.');
  const ends=new Map([[Xa,'X<=Xa'],[restLeft,'Xa<1<XR*exp(-8)'],[restRight,'Xa<1<XR*exp(-7)'],[Ileft,'Xa<loopILeft=Xa*exp(t1/8)']]),
    bumpArguments=new Map([0,1].map(j=>[G.div(G.sub(G.div(X,X0),q(j+9)),q(1,2)),j])),trace=[],cache=new Map();
  function restrict(id){
    if(cache.has(id))return cache.get(id);const {op,args}=G.nodes[id];let result=id;
    if(op==='actual_expression_partial'){
      const system=G.expressionSystems[args[0]];
      if(args[2].every(order=>order===0)&&same(args[1],system.parameters)){
        result=restrict(system.body);trace.push({node:id,rule:'same source expression body',body:system.body,result});
      }
    }else if(op==='smooth_piecewise'&&args[0]===X&&ends.has(args[1])){
      result=restrict(args[3]);trace.push({node:id,rule:'original left branch on the inner source domain',endpoint:args[1],relation:ends.get(args[1]),selected:args[3],result});
    }else if(op==='source_step_derivative'&&args[1]>=0&&bumpArguments.has(args[0])){
      result=G.zero;trace.push({node:id,rule:'original I1 bump is zero before X0*(j+9)',bump:bumpArguments.get(args[0]),derivativeOrder:args[1],result});
    }else if(G.dependsOn(id,X)){
      if(op==='add')result=G.add(...args.map(restrict));
      else if(op==='multiply')result=G.mul(...args.map(restrict));
      else if(op==='integer_power')result=G.pow(restrict(args[0]),args[1]);
      else if(op==='inverse')result=G.inv(restrict(args[0]));
    }
    cache.set(id,result);return result;
  }
  const Y=G.mul(Lambda,X),naturalU=pre.functions.naturalU(Y),average=G.add(G.core.Ustar,G.div(G.natural('average',Y),Lambda)),
    averageEta=G.derivative(average,eta),reducedU=restrict(family.prepared.records[0].global.U),reducedM=restrict(b.finalM),reducedVOverX=restrict(b.finalv),
    expectedVOverX=G.div(G.sub(G.sub(G.mul(q(2),eta,naturalU),G.mul(q(2),G.core.D,eta,average)),G.mul(G.core.d,averageEta)),G.core.L),
    Ucheck=sourceGraphRationalIdentity(G,G.sub(reducedU,naturalU),{atomicNodes:[G.natural('u',Y),G.core.Ustar]}),
    Mcheck=sourceGraphRationalIdentity(G,G.sub(reducedM,G.mul(X,average)),{atomicNodes:[G.natural('average',Y),G.core.Ustar]}),
    Vcheck=sourceGraphRationalIdentity(G,G.sub(reducedVOverX,expectedVOverX),{atomicNodes:[naturalU,average,averageEta,G.core.L]}),
    atEtaZero=G.substitute(reducedVOverX,eta,G.zero),averageEtaAtZero=G.substitute(averageEta,eta,G.zero),
    etaZeroCheck=sourceGraphRationalIdentity(G,G.add(atEtaZero,averageEtaAtZero),{atomicNodes:[averageEtaAtZero]});
  const checks=[{id:'same-actual-leading-U-global-body',pass:G.expressionSystems[G.nodes[family.prepared.records[0].global.U].args[0]].body===b.finalU&&b.finalU===leading.finalU},
    {id:'original-leading-U-reduces-to-the-same-natural-u-series',pass:Ucheck.pass},
    {id:'original-leading-M-reduces-to-X-times-same-natural-average',pass:Mcheck.pass},
    {id:'original-leading-v-reduces-to-complete-incompressible-radial-formula',pass:Vcheck.pass},
    {id:'original-eta-zero-radial-bracket-is-negative-average-eta-derivative',pass:etaZeroCheck.pass},
    {id:'both-original-I1-axial-bumps-disappear-before-their-support',pass:[0,1].every(j=>trace.some(row=>row.bump===j))}];
  if(checks.some(row=>!row.pass))fail('INVALID_SOURCE_CONSTRUCTION','The original leading inner restriction did not bind: '+checks.filter(row=>!row.pass).map(row=>row.id).join(', '));
  return {schema:'MathScope.N8.ActualLeadingInnerRestriction/1',domain:'0<X<Xa, -1<eta<1',parameterChecks,checks,
    sourceRoots:{globalU:family.prepared.records[0].global.U,globalM:b.finalM,globalVOverX:b.finalv,coreU:naturalU,coreAverage:average,coreAverageEta:averageEta},
    reduced:{U:reducedU,M:reducedM,VOverX:reducedVOverX,VOverXAtEtaZero:atEtaZero},trace,
    exactChecks:{U:Ucheck,M:Mcheck,VOverX:Vcheck,etaZero:etaZeroCheck},
    supportDerivation:'The original positive parameter definitions give CSelected>1, logP=2T, T>128 and XR=110*(CSelected*Pstar)^10. Hence XR*exp(-8)>1>Xa. Also loopILeft=Xa*exp(t1/8)>Xa and X0I1=XR*exp((60001)T-23)>XR. Both I1 bump arguments are negative throughout 0<X<Xa. These fixed source inequalities select the literal branches above.',
    noncoreMassIntegralsDiscarded:false,fullLeadingFunctionReplacedByToy:false,finalN6CorrectionSequenceConstructed:false};
}

export async function prepareActualSourceNearTerminal(input={},context={}){
  const request=requestOf(input),localization=context.localization??await prepareActualSourceLocalization({decimalTaus:request.decimalTaus},context);
  assertActualSourceLocalization(localization);
  if(!same(localization.request.decimalTaus,request.decimalTaus))fail('INVALID_SOURCE_CONSTRUCTION','Use a localization built for the same exact decimal observations.');
  const localizationCertificate=await actualSourceLocalizationCertificate(localization),{G,inner}=localization,{family}=inner,
    count=G.nodes.length,prefix=canonicalStringify(G.nodes),definitions=G.captureFunctionDefinitions(),q=(n,d=1)=>G.q(n,d),
    {h,A,D,qStar,tau0,z0}=localization.constants,Lambda=G.parameter('Lambda'),j0=G.parameter('j0'),CSelected=G.parameter('CSelected'),
    sqrtLambda=G.sqrt(Lambda),eScale=inner.leading.positivePrefactor,radialScale=G.inv(sqrtLambda),Xin=inner.point.Xin,R=G.div(q(2),sqrtLambda),
    leadingBinding=originalLeadingInnerRestriction(localization),finite=inner.remainder.finiteBlock,C=finite.coefficient,
    componentTailConstants={radial:G.mul(C,sqrtLambda),azimuthal:G.div(C,eScale),axial:G.div(C,j0)},
    Cstar=G.maximum(...Object.values(componentTailConstants)),plateau=inner.localization.plateau,
    shrinkLog=G.log(G.add(G.one,G.mul(q(4),Cstar))),
    freshCore=evaluateActualCorePoint({sourceProfile:SOURCE_PROFILE_ID,Y:'2',eta:{kind:'J_SCALED',value:'0'},radialOrder:0,etaOrder:1,bits:request.bits,degree:request.degree},context),
    phi=freshCore.phi.rows[0].actualNonlinearInterval,axial=freshCore.axial.actualValues.find(row=>row.etaDerivativeOrder===0),
    axialDerivative=freshCore.axial.actualValues.find(row=>row.etaDerivativeOrder===1),
    averageEta=axialDerivative.averageU,negativeAverageEta={lower:qtext(qsub(rational(0),readRational(averageEta.upper))),upper:qtext(qsub(rational(0),readRational(averageEta.lower)))},
    leadingIntervals=[negativeAverageEta,{lower:phi.lower,upper:phi.upper},{lower:axial.U.lower,upper:axial.U.upper}],
    radialIdentity={squareRootDefinition:G.nodes[sqrtLambda].op==='sqrt_positive'&&same(G.nodes[sqrtLambda].args,[Lambda]),
      scaledRadius:sourceGraphRationalIdentity(G,G.sub(G.mul(R,sqrtLambda),q(2)),{atomicNodes:[sqrtLambda]}),
      scaledX:sourceGraphRationalIdentity(G,G.sub(G.mul(Xin,Lambda),q(2)),{atomicNodes:[Lambda]}),
      inverseScale:sourceGraphRationalIdentity(G,G.sub(G.mul(radialScale,sqrtLambda),G.one),{atomicNodes:[sqrtLambda]})},
    exponentIdentity=sourceGraphRationalIdentity(G,G.sub(G.sub(A,h),q(1,2))),
    checks=[...leadingBinding.checks,
      {id:'actual-core-point-uses-the-same-eta-zero-and-original-parameters',pass:freshCore.sourceBindings.parameterExpressionSHA256===inner.sourceBinding.parameterExpressionSHA256&&freshCore.request.Y==='2'&&freshCore.request.eta.kind==='J_SCALED'&&freshCore.request.eta.value==='0'&&freshCore.domain.sourcePosition==='ACTUAL_UNMODIFIED_CORE'},
      {id:'axial-value-divides-by-j0-but-average-eta-derivative-is-ordinary',pass:axial.normalization==='DIVIDE_BY_POSITIVE_J0'&&axialDerivative.normalization==='ORDINARY_ETA_DERIVATIVE'&&freshCore.scope.positiveBanachErrorRetained&&freshCore.scope.actualPressureAnalyticErrorRetained},
      {id:'actual-radial-3h-tail-not-inferred-from-the-tangential-2h-tail',pass:finite.derivativeOrder===0&&finite.tangentialAxialBound.coefficient===C&&finite.tangentialAxialBound.power===G.mul(q(2),h)&&finite.physicalRadialNormalizedBound.coefficient===C&&finite.physicalRadialNormalizedBound.power===G.mul(q(3),h)},
      {id:'the-same-actual-n1-n2-and-common-all-order-induction-remain',pass:finite.finite.length===2&&finite.finite[0].order===1&&finite.finite[1].order===2&&finite.tailStarts===3&&family.source.background.induction.allIntegerOrdersBySameWellFoundedRecipe&&family.scope.sameCommonAllOrderRecursiveSelectorDefined&&inner.checks.find(row=>row.id==='actual-all-order-source-induction-and-common-enlargement')?.pass===true},
      {id:'radial-geometry-and-physical-growth-exponent-are-exact',pass:radialIdentity.squareRootDefinition&&radialIdentity.scaledRadius.pass&&radialIdentity.scaledX.pass&&radialIdentity.inverseScale.pass&&exponentIdentity.pass},
      {id:'three-leading-enclosures-have-nonzero-signs',pass:qcompare(readRational(negativeAverageEta.upper),rational(0))<0&&qcompare(readRational(phi.lower),rational(1,2))>0&&qcompare(readRational(axial.U.lower),rational(1,2))>0}];
  if(checks.some(row=>!row.pass))fail('INVALID_SOURCE_CONSTRUCTION','Near-terminal source input validation failed: '+checks.filter(row=>!row.pass).map(row=>row.id).join(', '));
  const roots={h,A,D,Lambda,CSelected,j0,sqrtLambda,eScale,radialScale,Xin,R,C,Cstar,plateau,shrinkLog,qStar,tau0,z0,
    radialTailPower:finite.physicalRadialNormalizedBound.power,tangentialAxialTailPower:finite.tangentialAxialBound.power,
    ...Object.fromEntries(Object.entries(componentTailConstants).map(([name,value])=>['tail_'+name,value]))},names=['radial','azimuthal','axial'],rows=[];
  for(const depth of request.depths){
    const s=G.add(G.neg(G.log(plateau)),G.div(G.add(shrinkLog,G.mul(q(depth),G.log(q(2)))),G.mul(q(2),h))),
      tau=G.exp(G.neg(s)),time=G.sub(G.one,tau),radius=G.mul(R,G.exp(G.mul(q(-1,2),s))),
      commonPhysicalScale=G.exp(G.mul(A,s)),qToH=G.exp(G.neg(G.mul(h,s))),
      normalizedScales=[G.mul(qToH,radialScale),eScale,j0],error=qtext(rational(1,1n<<BigInt(depth+2))),
      components=names.map((name,i)=>({name,cartesianComponent:i,
        leadingInterval:copy(leadingIntervals[i]),interval:widenSourceInterval(leadingIntervals[i],error,request.bits),
        normalizedVelocity:{quantity:'q^A*u_'+name,positiveScale:normalizedScales[i],scaleMeaning:['q^h/sqrt(Lambda)','2/(CSelected*sqrt(Lambda))','j0'][i]},
        physicalVelocity:{positiveScale:G.mul(commonPhysicalScale,normalizedScales[i]),binary64:null},
        sourceTailPower:i===0?'3h':'2h',scaledRemainderBound:error,sourceLimitIdentificationExternal:true}));
    Object.assign(roots,{['s_'+depth]:s,['tau_'+depth]:tau,['time_'+depth]:time,['radius_'+depth]:radius,
      ['qToH_'+depth]:qToH,['commonPhysicalScale_'+depth]:commonPhysicalScale,
      ...Object.fromEntries(components.flatMap(row=>[[`normalized_${row.name}_${depth}`,row.normalizedVelocity.positiveScale],[`physical_${row.name}_${depth}`,row.physicalVelocity.positiveScale]]))});
    rows.push({depth,primaryTime:{name:'s=-log(tau)',s,sourceOfTruth:'EXACT_SOURCE_EXPRESSION',binary64:null},
      tau:{expression:tau,exactSign:'POSITIVE',binary64:null,terminalTimeEvaluated:false},time:{expression:time,binary64:null},
      normalizedCoordinates:{X:Xin,Y:q(2),eta:G.zero,R,theta:'0',cartesian:[R,G.zero,G.zero]},
      physicalPosition:[radius,G.zero,G.zero],commonPhysicalScale,components,
      samePointAndTimeForAllComponents:true,unitLocalizationPlateau:true,allOriginalAnnularVelocityTermsVanishHere:true,
      externalSourceTheoremBridgeRequired:true,internalTauReconstructedFromDisplayedTime:false,underflowReplacedByZero:false,
      fullFinalN6VelocityNumericallyEvaluated:false});
  }
  const decimalSamples=localization.decimalSamples.map((sample,index)=>{
    const s=G.neg(sample.sourceLogTau),tau=G.exp(G.neg(s));
    if(tau!==sample.sourceTau)fail('INVALID_SOURCE_CONSTRUCTION','The exact positive decimal was lost when switching to s.');
    Object.assign(roots,{['decimal_s_'+index]:s,['decimal_tau_'+index]:tau,['decimal_time_'+index]:sample.sourceTime,
      ['decimal_radius_'+index]:sample.physicalPosition[0],['decimal_physical_scale_'+index]:sample.physicalVelocity.positiveScale});
    return {...copy(sample),primaryTime:{name:'s=-log(tau)',s,sourceOfTruth:'EXACT_DECIMAL_PAIR_AND_SOURCE_LOG_EXPRESSION'},
      physicalScalingAppliedAfterNormalizedEvaluation:true,threeComponentsEvaluatedExactly:true,
      nonzeroActiveSourceRegionSampled:false,finalFieldZeroExtensionDependency:'Original localization operator on its local domain, with its defined zero extension outside.'};
  });
  const leading={freshCore,intervals:Object.fromEntries(names.map((name,i)=>[name,copy(leadingIntervals[i])])),geometry:radialIdentity,physicalExponentIdentity:exponentIdentity,
    definitions:{radial:'-partial_eta A_X(U)(Xin,0)',azimuthal:'Phi(2,0)',axial:'U(Xin,0)/j0'},
    normalizedVelocity:'q^A*u = (q^h/sqrt(Lambda)*radial, eScale*azimuthal, j0*axial) plus the retained source coefficient corrections.',
    physicalVelocity:'u=q^(-A)*(q^A*u); the radial scale is equivalently q^(-1/2)/sqrt(Lambda), because A-h=1/2.',
    finiteCoreComparisonAndBothAnalyticErrorsRetained:true},
    tail={actualFiniteBlock:copy(finite),C,Cstar,componentTailConstants,commonSourceSequence:copy(inner.remainder.commonSelectorPrefix),
      tangentialAxial:'|q^A*delta u_theta|,|q^A*delta u_z|<=C*q^(2h)',radial:'|q^A*delta u_r|<=C*q^(3h)',
      componentNormalization:'Divide by eScale,j0,q^h/sqrt(Lambda), respectively; each resulting error is <=Cstar*q^(2h).',
      commonScale:'Cstar=max(C/eScale,C*sqrt(Lambda),C/j0)',
      sampleDefinition:'s_d=-log(plateau)+(log(1+4*Cstar)+d*log2)/(2h), tau_d=exp(-s_d)>0.',
      exactErrorProof:'Cstar*tau_d^(2h)=Cstar*plateau^(2h)*2^(-d)/(1+4*Cstar)<2^(-d-2). Since tau_d<plateau, every component uses the same original inner point and unit cutoff region.',
      finitePrefixOnlyUsedAsInfiniteTail:false,actualPrivateAllOrderSourceInductionConsumed:true,originalSerializedConditionalFlagsPreserved:true,
      originalCommonSequenceReplacedForEachObservation:false},
    claims={backgroundInnerRestriction:{status:'ACTUAL_SOURCE_INNER_PATH_ENCLOSURES',sourceOnly:true,allThreeComponents:true,originalCoefficientTailRetained:true},
      finalLocalizedVelocity:{status:'EXTERNAL_SOURCE_THEOREM_IDENTIFICATION_REQUIRED',dependencies:copy(inner.claims.originalLocalizedPath.dependencies),
        sameOriginalFinalN6InstanceConstructed:false,scope:'Only the original inner path and the global initial zero extension. No claim of a fully implemented N6 final field, arbitrary space-time values, or a new Navier-Stokes proof.'}},
    scope={actualFreshCoreIntervalsExecuted:true,actualOriginalLeadingBranchesUnfolded:true,actualThreeComponentNormalizedEnclosures:true,
      sourceLogTimeIsPrimary:true,normalizedThenPhysicalScalingApplied:true,exactPrescribedPositiveDecimalExamples:true,
      activeInnerPathUsesExactSourceExpressionPrecision:true,allSpaceSourceVelocityEvaluator:false,pressureEvaluated:false,
      fullN6FinalFieldConstructed:false,fullLocalizedForceConstructed:false,sourceFinalFieldIdentificationExternal:true,
      newLeanKernelProof:false,originalN804CriterionComplete:false,wholeN8ReconstructionComputed:false,wholeM3Complete:false};
  checks.push({id:'every-selected-row-shares-one-positive-tau-and-explicit-three-component-error',pass:rows.every(row=>row.samePointAndTimeForAllComponents&&row.components.length===3&&row.components.every(c=>c.interval.remainderAbsUpper===qtext(rational(1,1n<<BigInt(row.depth+2)))))},
    {id:'prescribed-decimal-observations-use-exact-zero-extension-not-missing-field-values',pass:decimalSamples.every(row=>row.cutoffState==='EXACT_TEMPORAL_ZERO_EXTENSION'&&row.missingSourceValuesSetToZero===false&&row.underflowReplacedByZero===false)},
    {id:'original-localization-graph-and-source-definitions-unchanged',pass:canonicalStringify(G.nodes.slice(0,count))===prefix&&G.functionDefinitionsUnchanged(definitions)&&assertActualSourceLocalization(localization)});
  const result={G,localization,schema:'MathScope.N8.ActualSourceNearTerminal/1',request,sourceBinding:copy(inner.sourceBinding),
    localizationBinding:{graph:copy(localizationCertificate.graph),sourceCutoffConstructed:true,fullN6FieldsConstructed:false,operator:copy(localization.operator)},
    point:{Xin,Y:q(2),eta:G.zero,R,cartesianRay:'theta=0; hence (u1,u2,u3)=(ur,utheta,uz)'},leadingBinding,leading,tail,
    constants:{h,A,D,Lambda,CSelected,j0,eScale,radialScale,C,Cstar,plateau,shrinkLog},decimalSamples,rows,claims,checks,scope,
    formulaProgram:appendClosedObservations(localization,G,roots)};
  if(checks.some(row=>!row.pass))fail('INVALID_SOURCE_CONSTRUCTION','The source near-terminal observation gate failed.');
  seals.set(result,{G,localization,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),metadata:canonicalStringify(metadata(result))});
  context.onProgress?.({stage:'n8-actual-source-near-terminal-sealed',nodes:G.nodes.length,scalarNodes:result.formulaProgram.nodes.length,rows:rows.length,components:3});return result;
}

export function assertActualSourceNearTerminal(result){
  const seal=seals.get(result);
  if(!seal||result.G!==seal.G||result.localization!==seal.localization||canonicalStringify(metadata(result))!==seal.metadata||
    canonicalStringify(seal.G.nodes.slice(0,seal.count))!==seal.prefix||!seal.G.functionDefinitionsUnchanged(seal.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private original three-component source observation. Copied records, omitted errors and altered source functions are not authoritative.');
  assertActualSourceLocalization(seal.localization);return true;
}

export async function actualSourceNearTerminalCertificate(result){
  assertActualSourceNearTerminal(result);return {...copy(metadata(result)),graph:{sourceFamily:copy(result.sourceBinding.common6FamilyGraph),
    constructedNodeCount:seals.get(result).count,scalarNodeCount:result.formulaProgram.nodes.length,
    scalarProgramSHA256:await sha256(canonicalStringify(result.formulaProgram))},
    verification:{status:'ACTUAL_SOURCE_THREE_COMPONENT_INNER_PATH_AND_ZERO_EXTENSION_EXECUTED',checksPass:result.checks.every(row=>row.pass),
      fullN6FinalFieldNumericallyExecuted:false,importedSourceAuthorityAdopted:false,newLeanExecuted:false}};
}
