/** Original inner-path enclosure for N7-07.
 *
 * Rebuilds the same private common M2 family, computes the original nonlinear
 * core interval afresh, and retains the actual all-order background cutoff
 * bound. The identification with the paper's final localized field uses
 * Proposition 9.9 and Proposition 10.1 as EXTERNAL SOURCE THEOREMS. This
 * module does not construct the missing N6 stages or their final global sum.
 * No plotted values or expression node identifiers are used as a blowup proof.
 */
import {prepareActualCommonAdmissibleFamily,assertActualCommonAdmissibleFamily,actualCommonAdmissibleFamilyCertificate} from '../../mathscope-m2/navier/actual-common-admissible-family.mjs';
import {actualNormalizedFiniteBlock,assertActualNormalizedCutoffs} from '../../mathscope-m2/navier/actual-residual-order-induction-cutoffs.mjs';
import {evaluateActualCorePoint} from '../../mathscope-m2/navier/actual-core-evaluator.mjs';
import {PINNED_CORE} from '../../mathscope-m2/navier/source-core-data.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from '../../mathscope-m2/navier/source-profile.mjs';
import {sourceGraphRationalIdentity} from '../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {rational,readRational,qcompare,qadd,qsub,qtext,directedArithmetic} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {NS_PAPER} from './corrections.mjs';

const seals=new WeakMap();
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const FAMILY_REQUEST=Object.freeze({sourceProfile:SOURCE_PROFILE_ID,throughOrder:2,derivativeOrder:3,maxNodes:5000000,maxProfileJets:60000,maxJetRequests:600000});
const COMMON6_FAMILY_GRAPH=Object.freeze({sha256:'bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219',nodeCount:622781,canonicalBytes:28446215,fixedCompilerPrefix:true});
const PARAMETER_SHA='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152';
const metadata=p=>({schema:p.schema,request:p.request,sourceBinding:p.sourceBinding,point:p.point,leading:p.leading,remainder:p.remainder,localization:p.localization,annularRestriction:p.annularRestriction,rows:p.rows,claims:p.claims,checks:p.checks,scope:p.scope,formulaProgram:p.formulaProgram});

function requestOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['depths','bits','degree'].includes(k)))
    fail('INVALID_INPUT','Only finite observation depth, interval precision and comparison degree may be selected. Original parameters and the source point are fixed.');
  const depths=input.depths??[0,2,4,8,12],bits=input.bits??256,degree=input.degree??64;
  if(!Array.isArray(depths)||!depths.length||depths.length>32||depths.some(n=>!Number.isSafeInteger(n)||n<0||n>256)||new Set(depths).size!==depths.length)
    fail('INVALID_INPUT','Use 1..32 distinct integer depths in 0..256.');
  if(!Number.isSafeInteger(bits)||bits<128||bits>512||!Number.isSafeInteger(degree)||degree<32||degree>64)
    fail('INVALID_INPUT','Use 128..512 interval bits and comparison degree 32..64.');
  return {depths:[...depths].sort((a,b)=>a-b),bits,degree};
}

/** A closed scalar/function expression DAG. Original A.13/A.21 integrals
 * retain their integrands, local variables and endpoints. Every original
 * parameter keeps its complete pinned expression. This is not a numerical
 * evaluation of C and is never accepted as private source authority.
 */
function scalarProgram(G,roots,cutoff){
  const map=new Map(),nodes=[],sourceNodeIds=[];
  function copy(id){
    if(map.has(id))return map.get(id);
    const node=G.nodes[id];if(!node)fail('INVALID_SOURCE_CONSTRUCTION','A scalar formula root is absent.');
    const {op,args}=node;let out;
    if(['rational','source_parameter','coordinate'].includes(op))out=[...args];
    else if(['integer_power','source_step_derivative'].includes(op))out=[copy(args[0]),args[1]];
    else if(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling','floor','sine','cosine','definite_integral','smooth_piecewise'].includes(op))out=args.map(copy);
    else fail('INVALID_SOURCE_CONSTRUCTION','An explicit inner-growth scalar bound contains an unsupported operation: '+op);
    const next=nodes.length;nodes.push({op,args:out});sourceNodeIds.push(id);map.set(id,next);return next;
  }
  if(Object.values(roots).some(id=>G.freeCoordinates(id).size))fail('INVALID_SOURCE_CONSTRUCTION','A scalar observation or error bound contains an unbound coordinate.');
  const outRoots=Object.fromEntries(Object.entries(roots).map(([k,v])=>[k,copy(v)])),
    functions={localizationCutoff:{variable:copy(cutoff.coordinate),body:copy(cutoff.body),unitUpper:copy(cutoff.unitUpper),zeroLower:copy(cutoff.zeroLower)}};
  return {schema:'MathScope.N7.InnerGrowthScalarProgram/1',roots:outRoots,functions,nodes,sourceNodeIds,
    parametersExactExpressions:structuredClone(G.source.parametersExactExpressions),parameterExpressionSHA256:PARAMETER_SHA,
    sourceStepDerivative:{definition:'d^k/ds^k sigma_2(s); sigma_2(s)=a(s)/(a(s)+a(1-s)), a(s)=exp(-1/s^2) for s>0 and 0 otherwise, with constant flat extensions sigma_2=0 on s<=0 and 1 on s>=1.',
      implementation:'mathscope-m2/navier/actual-global-source-expressions.mjs:step; actual-residual-order-induction-kernels.mjs:sourceAllOrderCutoffJets',derivativeOrderIsMetadata:true,callerSuppliedValues:false},
    allScalarRootsHaveNoFreeCoordinates:true,definiteIntegralBodiesAndEndpointsRetained:true,
    valuesAreExactExpressions:true,numericalHugeConstantsEvaluated:false,underflowReplacedByZero:false};
}

function fixedTimeCutoff(G){
  const s=G.fresh('n7_inner_growth_cutoff_s'),u=G.sub(G.mul(G.q(2),s),G.one),
    a=G.exp(G.neg(G.inv(u))),b=G.exp(G.neg(G.inv(G.sub(G.one,u)))),
    body=G.choose(s,G.q(1,2),G.one,G.one,G.div(b,G.add(a,b)),G.zero);
  return {coordinate:s,body,unitUpper:G.q(1,2),zeroLower:G.one,
    definition:'chi(s)=1-sigma_1(2s-1), sigma_1 uses exp(-1/u) with its exact flat branches.',
    supportedAtMostOne:true,unitOnAtMostHalf:true};
}

/** Build the actual function restriction and source-bound error scale.
 * The genuine private family seal is required; serialized records cannot
 * become coefficient sources. The new rows are enclosures, not midpoints.
 */
function attachInnerGrowth(family,familyCertificate,request,context){
  assertActualCommonAdmissibleFamily(family);
  if(!same(familyCertificate.graph,COMMON6_FAMILY_GRAPH)||!same(family.request,FAMILY_REQUEST))
    fail('INVALID_SOURCE_CONSTRUCTION','The common family must reproduce the actual common6 compiler prefix.');
  const {G,prepared}=family,{background}=family.source,{cutoffs}=background;
  assertActualNormalizedCutoffs(cutoffs);
  const sourceCount=G.nodes.length,sourcePrefix=canonicalStringify(G.nodes),sourceDefinitions=G.captureFunctionDefinitions(),
    q=(a,b=1)=>G.q(a,b),{X,eta}=prepared.bootstrap.constants,
    Lambda=G.parameter('Lambda'),CSelected=G.parameter('CSelected'),h=G.parameter('h'),A=G.add(q(1,2),h),D=G.sub(q(1,2),h),
    Xa=G.parameter('Xa'),Xin=G.div(q(2),Lambda),Y=q(2),zero=G.zero,
    exponent=sourceExponentContract(),heat=prepared.bootstrap.actualHeat,
    fullF=prepared.records[0].global.F,fullDefinition=G.nodes[fullF],fullBody=heat.heat.finalF,branch=G.nodes[fullBody],
    naturalBody=G.mul(G.core.g,G.natural('Phi',G.mul(Lambda,X))),
    atZeroG=G.substitute(G.core.g,eta,zero),phiRoot=G.natural('Phi',Y,zero),
    eScale=G.div(q(2),G.mul(CSelected,G.sqrt(Lambda))),e0=G.mul(eScale,phiRoot),eLower=G.div(G.one,G.mul(CSelected,G.sqrt(Lambda))),
    radialPointCheck=sourceGraphRationalIdentity(G,G.sub(G.mul(Lambda,Xin),Y),{atomicNodes:[Lambda]}),
    gAtZeroCheck=sourceGraphRationalIdentity(G,G.sub(atZeroG,G.inv(CSelected)),{atomicNodes:[CSelected]});
  const core=evaluateActualCorePoint({sourceProfile:SOURCE_PROFILE_ID,Y:'2',eta:{kind:'DIRECT_RATIONAL',value:'0'},radialOrder:0,etaOrder:0,bits:request.bits,degree:request.degree},context),
    phi=core.phi.rows[0].actualNonlinearInterval,L=readRational(phi.lower),U=readRational(phi.upper),
    stored=PINNED_CORE.rows.find(r=>r.quantity==='CE_over_sqrt_2X'&&r.radialDerivativeOrder===0&&r.Y==='2'),
    intervalOverlap=stored&&qcompare(L,readRational(stored.sameInfiniteCoreInterval.upper))<=0&&qcompare(U,readRational(stored.sameInfiniteCoreInterval.lower))>=0,
    tail=actualNormalizedFiniteBlock(cutoffs,{derivativeOrder:0},context),C=tail.coefficient;
  const checks=[
    {id:'same-common6-family-actually-reconstructed',pass:same(familyCertificate.graph,COMMON6_FAMILY_GRAPH)},
    {id:'original-positive-parameters-and-Xa',pass:same(G.source.parametersExactExpressions.Xa,{quotient:[{integer:4},{ref:'Lambda'}]})&&exponent.positive&&exponent.upperBoundExact==='2^-4096'&&same(exponent.hExact,G.source.parametersExactExpressions.h)},
    {id:'Xin-Xa-half-inside-both-original-domains',pass:radialPointCheck.pass&&same(G.source.parametersExactExpressions.Xa,{quotient:[{integer:4},{ref:'Lambda'}]})},
    {id:'full-leading-source-has-the-actual-core-branch',pass:fullDefinition.op==='actual_expression_partial'&&same(fullDefinition.args[1],[X,eta])&&same(fullDefinition.args[2],[0,0])&&G.expressionSystems[fullDefinition.args[0]].body===fullBody&&branch.op==='smooth_piecewise'&&branch.args[0]===X&&branch.args[1]===Xa&&branch.args[3]===naturalBody},
    {id:'eta-zero-leading-scale-is-exact',pass:gAtZeroCheck.pass&&radialPointCheck.pass},
    {id:'fresh-actual-nonlinear-core-interval-positive',pass:core.sourceBindings.parameterExpressionSHA256===PARAMETER_SHA&&core.request.Y==='2'&&core.coordinates.etaExact==='0'&&qcompare(L,rational(1,2))>0&&qcompare(U,rational(1))<0&&core.scope.positiveBanachErrorRetained&&core.scope.actualPressureAnalyticErrorRetained&&Boolean(intervalOverlap)},
    {id:'whole-original-normalized-domain-contains-Xa-half',pass:cutoffs.normPrefixes[1].normalized.every(r=>r.domain.X[0]===G.div(Xa,q(2)))},
    {id:'actual-n1-and-n2-plus-n3-tail-retained',pass:tail.finite.length===2&&tail.finite[0].order===1&&tail.finite[1].order===2&&tail.tailStarts===3&&tail.tailConstant===q(1,4)&&C===G.add(tail.finite[0].bound,tail.finite[1].bound,q(1,4))},
    {id:'actual-all-order-source-induction-and-common-enlargement',pass:background.induction.allIntegerOrdersBySameWellFoundedRecipe&&family.scope.sameCommonAllOrderRecursiveSelectorDefined&&family.selector.rows.every((r,i)=>r.historicalScale===cutoffs.rows[i].scale&&r.historicalLogScale===cutoffs.rows[i].logScale&&G.nodes[r.logScale].op==='maximum'&&G.nodes[r.logScale].args.includes(r.historicalLogScale))},
    {id:'source-only-remainder-and-domain-threshold',pass:G.freeCoordinates(C).size===0&&G.freeCoordinates(family.constants.qStar).size===0}
  ];
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','Inner restriction binding failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  // The all-band partition uses ell0+4, six powers of two below the
  // family's earlier ellMinimum+4 threshold. The WHOLE cutoff support,
  // not only the displayed sample points, must lie in this smaller domain.
  const sourceQStar=family.constants.qStar,qStar=G.exp(G.neg(G.mul(G.add(family.constants.ell0,q(4)),G.log(q(2))))),
    C0=q(4),tau0=G.div(qStar,q(32)),z0=G.exp(G.mul(D,G.log(tau0))),r0=G.one,
    plateau=G.inv(G.add(q(4),G.div(q(4),tau0),G.mul(q(32),Xin))),
    normalizedRemainder=G.div(C,eScale),shrinkLog=G.log(G.add(G.one,G.mul(q(4),normalizedRemainder))),
    cutoff=fixedTimeCutoff(G),formulaRoots={Lambda,CSelected,h,A,D,Xa,Xin,Y,eScale,eLower,C,normalizedRemainder,sourceQStar,qStar,tau0,z0,r0,plateau,shrinkLog},
    arithmetic=directedArithmetic(request.bits),rows=[];
  for(const depth of request.depths){
    const logTau=G.sub(G.log(plateau),G.div(G.add(shrinkLog,G.mul(q(depth),G.log(q(2)))),G.mul(q(2),h))),
      tau=G.exp(logTau),time=G.sub(G.one,tau),rSquared=G.mul(q(2),Xin,tau),radius=G.sqrt(rSquared),
      error=rational(1,1n<<BigInt(depth+2)),lower=qsub(L,error),upper=qadd(U,error),
      interval={lower:qtext(lower),upper:qtext(upper)},display=arithmetic.pack(arithmetic.unpack(interval)).displayEnclosure,
      velocityScale=G.mul(eScale,G.exp(G.neg(G.mul(A,logTau)))),timeCutoffArgument=G.div(tau,tau0),radialCutoffArgument=G.mul(q(2),rSquared);
    Object.assign(formulaRoots,{['logTau_'+depth]:logTau,['tau_'+depth]:tau,['time_'+depth]:time,['radius_'+depth]:radius,
      ['velocityScale_'+depth]:velocityScale,['timeCutoffArgument_'+depth]:timeCutoffArgument,['radialCutoffArgument_'+depth]:radialCutoffArgument});
    rows.push({depth,tau,time,logTau,position:[radius,zero,zero],sourceProfilePoint:{X:Xin,Y,eta:zero},
      normalizedQuantity:'(CSelected*sqrt(Lambda)/2)*tau^A*u_theta(x_tau,1-tau)',
      leadingInterval:{lower:phi.lower,upper:phi.upper},remainderAbsUpper:qtext(error),interval,displayEnclosure:display,
      physicalVelocity:{positiveScale:velocityScale,intervalMultiplier:interval,binary64:null},
      cutoffArguments:{time:timeCutoffArgument,radial:radialCutoffArgument,axial:zero},
      exactPlateau:{time:'tau/tau0<1/4<1/2',radial:'2*r_tau^2=4*Xin*tau<1/8<1/2',axial:'0',product:'1'},
      enclosureMethod:'FRESH_ACTUAL_CORE_INTERVAL_PLUS_SOURCE_ALL_ORDER_CUTOFF_TAIL',finiteSumMidpointUsed:false,
      originalFinalN6InstanceNumericallyEvaluated:false,externalSourceTheoremBridgeRequired:true});
  }
  const annularRestriction={point:Xin,sourceInnerBoundary:Xa,positiveGap: G.div(q(2),Lambda),
    statement:'Every annular wave/mean representative in the original (9.21) vanishes on X<Xa; therefore its curl and direct azimuthal contribution vanish on an open neighborhood of Xin=Xa/2. Multiplication by chi(a_j*q) preserves this exact zero.',
    sourceReferences:[{page:106,reference:'Definition9.4: fixed supported wave/mean potentials'},{page:114,reference:'Proposition9.9 and (9.21)'},{page:116,reference:'Step5: all annular corrections vanish for Xin<Xa'},{page:124,reference:'(10.20)-(10.21), summation cutoffs retained'}],
    evidenceKind:'EXTERNAL_SOURCE_THEOREM_APPLIED_TO_EXACT_ORIGINAL_INNER_RESTRICTION',
    originalFinalN6InstanceConstructed:false,allAnnularTermsNumericallyEnumerated:false,unknownCorrectionValuesSetToZero:false};
  const localization={reference:'(10.3)-(10.4)',qStar,sourceQStar,sourceEll0:family.constants.ell0,C0,tau0,z0,r0,plateau,cutoff,
    sourceDomainIdentity:'qStar=exp(-(ell0+4)*log2)=sourceQStar/64, since ell0=ellMinimum+6. This is the smaller complete common partition threshold from actual-common-global-wave-bounds.mjs, retained for the whole localization support.',
    uniformQBound:'D=1/2-h>1/4; max(2,2^(1/(2D)))<=4=C0, so q<=4*(tau+|z|^(1/D)).',
    margin:'4*(tau0+z0^(1/D))=qStar/4<qStar/2',
    spatialCutoff:'chi_x=chi(2*r^2/r0^2)*chi(2*z^2/z0^2)',temporalCutoff:'chi_t=chi(tau/tau0)',
    compactK:'{r<=r0/sqrt(2), |z|<=z0/sqrt(2)}',zeroInitialInterval:'0<=t<=1-tau0',
    exactPathPlateau:'tau<plateau<min(tau0/4,1/(32*Xin),1/4) implies chi_x=chi_t=1 and all positive cutoff derivatives vanish near every sample.',
    forceOrGlobalFieldEvaluated:false,sourceTheoremReference:{page:118,reference:'Proposition10.1'},externalFinalFieldIdentification:true};
  const remainder={reference:'(5.42), (5.46), (10.21)',coefficient:C,normalizedCoefficient:normalizedRemainder,
    finiteBlock:tail,commonSelectorPrefix:family.selector.rows.map(r=>({order:r.order,historicalScale:r.historicalScale,scale:r.scale,logScale:r.logScale,previousLogScale:r.previousLogScale})),
    exactSourceSequence:'The same original common b_n, not an observation-dependent replacement. Every b_n>=c_n, with original chi and its Euler derivative bounds.',
    allOrderProof:'n=1 and n=2 retain their actual source bounds and q^(2nh). For n>=3, the actual canonical diagonal induction bounds each normalized term by2^-n*q^(nh). Their sum is<=q^(3h)/4<=q^(2h)/4 on0<q<=1. Enlarging c_n to the authenticated common b_n preserves these bounds.',
    inequality:'|tau^A*u_theta-e0|<=C*tau^(2h) on the original inner restriction. Identification with the final localized field uses the listed external source theorems.',
    observationProof:'tau_d=plateau*exp(-(log(1+4*C/eScale)+d*log2)/(2h)). Since0<plateau<1, (C/eScale)*tau_d^(2h)<=2^(-d)*(C/eScale)/(1+4*C/eScale)<2^(-d-2).',
    positiveExponentRetained:true,observedSlopeUsed:false,allCutoffTermsAndUnboundedTailRetained:true,hugeConstantNumericallyEvaluated:false};
  const leading={actualFullSourceRoot:fullF,actualFullSourceBody:fullBody,actualInnerBranch:branch.args[3],sourceG:G.core.g,gAtEtaZero:atZeroG,
    actualCoreValue:phiRoot,actualE0:e0,positivePrefactor:eScale,rigorousLower:eLower,
    formula:'e0=2*Phi(2,0)/(CSelected*sqrt(Lambda)) > 1/(CSelected*sqrt(Lambda)) >0',
    intervalScale:'Multiply the fresh exact rational Phi interval by the strictly positive exact eScale.',
    freshCore:core,previousAcceptedCore:{sourceHash:PINNED_CORE.acceptedCore.sha256,sourcePath:stored.sourcePath,interval:stored.sameInfiniteCoreInterval},
    intervalOverlapWithPreviousActualCore:Boolean(intervalOverlap),newCoreExecution:true,numericalHugeScaleEvaluated:false};
  const claims={
    actualBackgroundPath:{status:'CERTIFIED_SOURCE_BOUND_POINTWISE_ENCLOSURE',claim:'The normalized original realized M2 background lies in each computed rational interval at its exact source-defined tau.',sourceInductionRetained:true},
    originalLocalizedPath:{status:'CONDITIONAL_ON_EXTERNAL_SOURCE_THEOREM_IDENTIFICATION',dependencies:['Proposition9.9: actual final (9.21), annular support, on the smaller same-source complete partition domain','Proposition10.1: localized field agrees on the fixed cutoff plateau'],samePhysicalPointAndScale:true},
    asymptotic:{status:'SOURCE_ANALYTIC_IMPLICATION_WITH_EXTERNAL_LOCALIZATION_BRIDGE',proof:'e0>=eLower>0, h>0, and the explicit remainder imply tau^A*u_theta>=eLower/2 for all sufficiently small positive tau. SinceA>0, the identified original field grows without bound; a finite plot is not the proof.',domainAndRemainderExplicit:true},
    finalN6Construction:{status:'NOT_CONSTRUCTED_BY_THIS_MODULE'},smoothGlobalForce:{status:'NOT_ESTABLISHED_BY_THIS_MODULE'},newLean:{status:'NOT_RUN'},originalN7CriterionComplete:false};
  checks.push({id:'original-compiler-prefix-and-function-definitions-preserved',pass:canonicalStringify(G.nodes.slice(0,sourceCount))===sourcePrefix&&G.functionDefinitionsUnchanged(sourceDefinitions)},
    {id:'all-observed-enclosure-lower-endpoints-strictly-positive',pass:rows.every(r=>qcompare(readRational(r.interval.lower),rational(0))>0)});
  if(checks.some(c=>!c.pass))fail('INVALID_SOURCE_CONSTRUCTION','The source prefix or positive interval check failed.');
  const scope={actualCommonFamilyReconstructed:true,actualCoreIntervalRecomputed:true,sourceCoefficientTailConstructed:true,
    sameOriginalCommonSequence:true,exactPositiveTauAndPath:true,finitePlotUsedAsBlowupProof:false,
    originalCompleteN6FieldConstructed:false,allAnnularCorrectionsExecuted:false,globalLocalizedForceConstructed:false,
    sourcePaperTheoremsUsedAsExternalDependencies:true,newLeanKernelProof:false,wholeM3Complete:false};
  const result={G,family,schema:'MathScope.N7.ActualInnerGrowth/1',request,
    sourceBinding:{paper:NS_PAPER,profileId:SOURCE_PROFILE_ID,parameterExpressionSHA256:PARAMETER_SHA,common6FamilyGraph:familyCertificate.graph,
      common6Path:'mathscope-m2/navier/research/evidence/common-physical-package-20261011/actual-common-physical-package-source-attempt6.json',
      sourceProfileArchive:PINNED_CORE.assembly,acceptedCoreArchive:PINNED_CORE.acceptedCore},
    point:{Xin,Xa,Y,eta:zero,formula:'Xin=Xa/2=2/Lambda, x_tau=(sqrt(2*Xin*tau),0,0), eta=0, q=tau',coreWithinDomain:true},
    leading,remainder,localization,annularRestriction,rows,claims,checks,scope,formulaProgram:scalarProgram(G,formulaRoots,cutoff)};
  seals.set(result,{family,G,sourceCount,sourcePrefix,sourceDefinitions,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(metadata(result))});
  context.onProgress?.({stage:'n7-original-inner-growth-source-sealed',nodeCount:G.nodes.length,scalarNodes:result.formulaProgram.nodes.length});
  return result;
}

export async function prepareActualInnerGrowth(input={},context={}){
  const request=requestOf(input),family=prepareActualCommonAdmissibleFamily(FAMILY_REQUEST,context),certificate=await actualCommonAdmissibleFamilyCertificate(family);
  return attachInnerGrowth(family,certificate,request,context);
}

export function assertActualInnerGrowth(result){
  const seal=seals.get(result);
  if(!seal||result.G!==seal.G||result.family!==seal.family||canonicalStringify(metadata(result))!==seal.data||canonicalStringify(seal.G.nodes.slice(0,seal.count))!==seal.prefix||!seal.G.functionDefinitionsUnchanged(seal.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private original inner-growth construction; copied records and edited source or conclusion fields are not accepted.');
  assertActualCommonAdmissibleFamily(seal.family);return true;
}

export async function actualInnerGrowthCertificate(result){
  assertActualInnerGrowth(result);
  const certificate=structuredClone(metadata(result));
  return {...certificate,graph:{sourceFamily:result.sourceBinding.common6FamilyGraph,constructedNodeCount:seals.get(result).count,
    scalarProgramSHA256:await sha256(canonicalStringify(result.formulaProgram)),scalarNodeCount:result.formulaProgram.nodes.length},
    verification:{status:'SOURCE_BOUND_INNER_RESTRICTION_EXECUTED',checksPass:result.checks.every(c=>c.pass),
      freshCoreIntervalExecuted:true,freshCommonFamilyExecuted:true,wholeLocalizedN6FieldExecuted:false,importedProofStatusAdopted:false}};
}
