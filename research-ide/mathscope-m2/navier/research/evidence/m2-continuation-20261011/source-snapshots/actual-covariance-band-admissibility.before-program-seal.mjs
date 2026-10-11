/** Exact exclusion of the displayed finite bands from the original positive
 * covariance theorem. This does not decide the sign of an actual H inverse.
 * The threshold and first cutoff are consumed from private source producers.
 */
import {prepareActualCovarianceOperator,assertActualCovarianceOperator} from './actual-covariance-source-operator.mjs';
import {certifyActualCovarianceOperatorBounds} from './actual-covariance-operator-bounds.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile,sourceExponentContract} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const witnesses=new WeakMap();
const publicData=p=>JSON.stringify({request:p.request,roots:p.roots,sourceBinding:p.sourceBinding,proof:p.proof,decision:p.decision,checks:p.checks,
  program:{compiler:p.program.compiler,compilerInput:p.program.compilerInput,roots:p.program.roots,sourceBinding:p.program.sourceBinding,proof:p.program.proof,decision:p.program.decision,checks:p.program.checks}});

function requestOf(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','ellExact'].includes(k)))
    fail('INVALID_INPUT','Use only the pinned source profile and an exact finite band integer. Bounds, h, matrices and completion flags are never caller inputs.');
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID;assertSourceProfile(sourceProfile);
  const ellExact=input.ellExact??'1';
  if(typeof ellExact!=='string'||!/^[0-9]+$/.test(ellExact)||ellExact.length>4)fail('INVALID_INPUT','ellExact must be an exact positive integer string in 1..128.');
  const ell=BigInt(ellExact);if(ell<1n||ell>128n)fail('UNSUPPORTED','This certificate covers precisely the finite band range 1..128. It does not declare a larger requested band admissible.');
  return {sourceProfile,ellExact:String(ell)};
}

/** Only integer arithmetic is evaluated here; powers such as 2^(-ellMinimum)
 * remain exact expressions. Analytic monotonicity steps are stated in proof. */
export function finiteCovarianceBandExclusionArithmetic(){
  const hExponent=4096,coefficientExponent=6,frequencyExponent=2*(hExponent+coefficientExponent),limit=128;
  const rows=[
    {id:'threshold-multiplier-is-power-of-two',pass:(1n<<BigInt(coefficientExponent))===64n},
    {id:'inverse-h-dominates-entire-finite-band',pass:(1n<<BigInt(hExponent))>BigInt(limit+1)},
    {id:'frequency-lower-exponent-computed',pass:frequencyExponent===8204},
    {id:'frequency-lower-dominates-finite-band',pass:(1n<<BigInt(frequencyExponent))>BigInt(limit)},
    {id:'epsilon-exponent-strictly-below-one',pass:BigInt(limit)<(1n<<BigInt(hExponent))},
    {id:'physical-band-threshold-gap',pass:133-129===4&&(1n<<4n)===16n}
  ];
  return {schema:'MathScope.FiniteCovarianceBandExclusionArithmetic/1',hExponent,coefficientExponent,frequencyExponent,limit,rows,pass:rows.every(r=>r.pass),floatingTranscendentalEvaluation:false};
}

/** Consume a live original operator. Copied objects and edited source bodies
 * fail its private authenticator before any domain conclusion is constructed. */
export function certifyActualCovarianceBandAdmissibility(operator,context={}){
  assertActualCovarianceOperator(operator);context.checkCancelled?.();
  const request=requestOf({sourceProfile:operator.sourceProfile,ellExact:operator.program.band.ellExact});
  if(operator.program.band.selectionKind!=='ARBITRARY_ORIGINAL_DYADIC_INTEGER')fail('UNSUPPORTED','Use an actual exact integer band, not a canonical anchor.');
  const bounds=certifyActualCovarianceOperatorBounds(operator),{G}=operator,q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),logTwo=G.log(q(2));
  const exponent=sourceExponentContract(),arithmetic=finiteCovarianceBandExclusionArithmetic(),selection=bounds.selection;
  const expectedH={exp:{product:[{integer:-8002},{ref:'T'}]}};
  const sourceDefinition=assertSourceProfile(request.sourceProfile).parametersExactExpressions;
  const first=operator.background.cutoffs.rows[0],zeroNorm=first?.coefficientBounds.find(r=>r.derivativeOrder===0);
  if(!first||!zeroNorm)fail('INVALID_SOURCE_CONSTRUCTION','The actual canonical c1 zeroth-derivative norm is required.');
  const frequency=G.pow(G.div(q(64),h),2),expectedSminimum=G.maximum(...selection.conditions.map(r=>r.lower));
  const expectedEllMinimum=G.ceiling(G.maximum(q(8),expectedSminimum,frequency));
  const expectedQStar=G.exp(G.neg(G.mul(G.add(expectedEllMinimum,q(4)),logTwo)));
  const norm=G.maximum(G.one,...zeroNorm.terms.map(t=>t.upper));
  const firstRequiredLog=G.div(G.add(logTwo,G.log(norm)),h);
  const firstLog=G.maximum(G.add(G.zero,logTwo),...first.coefficientBounds.map(r=>r.requiredLog));
  const actualFirstBandRow=operator.band.rows.find(r=>r.order===1);
  const cutoffDefinition=G.expressionSystems[operator.band.cutoffSystem];
  if(!cutoffDefinition||cutoffDefinition.parameters.length!==1)fail('INVALID_SOURCE_CONSTRUCTION','The actual complete summation cutoff definition is required.');
  const cutoffArgument=cutoffDefinition.parameters[0],cutoffU=G.sub(G.mul(q(2),cutoffArgument),G.one);
  const cutoffA=G.exp(G.neg(G.inv(cutoffU))),cutoffB=G.exp(G.neg(G.inv(G.sub(G.one,cutoffU))));
  const cutoffBody=G.choose(cutoffArgument,q(1,2),G.one,G.one,G.div(cutoffB,G.add(cutoffA,cutoffB)),G.zero);
  const recurrenceChecks=operator.background.cutoffs.rows.map((row,index)=>{
    const previous=index?operator.background.cutoffs.rows[index-1].logScale:G.zero,doubling=G.add(previous,logTwo);
    return {id:'canonical-doubling-recurrence-'+row.order,pass:row.previousLogScale===previous&&row.doubling===doubling&&row.logScale===G.maximum(doubling,...row.coefficientBounds.map(r=>r.requiredLog))&&row.scale===G.exp(row.logScale)};
  });
  const g=operator.geometry,powReal=(a,b)=>G.exp(G.mul(b,G.log(a))),Tg=G.add(q(4),G.sqrt(q(2)));
  const paletteQuotient=G.div(G.sub(G.mul(G.add(G.one,h),g.ell,logTwo),G.mul(q(2),G.log(g.ell))),G.log(Tg));
  const paletteIndex=G.neg(G.ceiling(G.neg(paletteQuotient))),r0=q(1,1n<<34n),ci=G.mul(powReal(Tg,paletteIndex),powReal(g.Q,G.add(G.one,h)));
  const checks=[
    {id:'private-original-operator',pass:true},
    {id:'unchanged-positive-h-definition',pass:JSON.stringify(exponent.hExact)===JSON.stringify(expectedH)&&JSON.stringify(sourceDefinition.h)===JSON.stringify(expectedH)&&JSON.stringify(sourceDefinition.T)===JSON.stringify({sum:[{exp:{ref:'Md'}},{integer:10}]})&&JSON.stringify(sourceDefinition.Md)===JSON.stringify({integer:1048576})&&exponent.positive&&exponent.upperBoundExact==='2^-4096'&&exponent.notNumericallyReplaced},
    {id:'original-frequency-threshold-root',pass:selection.frequencyMinimum===frequency},
    {id:'original-maximum-and-ceiling-root',pass:selection.Sminimum===expectedSminimum&&selection.ellMinimum===expectedEllMinimum},
    {id:'original-qstar-and-buffer-root',pass:selection.qStar===expectedQStar&&selection.activeBandBuffer===4},
    {id:'threshold-has-no-display-coordinate',pass:G.freeCoordinates(selection.qStar).size===0},
    {id:'original-c1-prefix-independent-norm',pass:first.order===1&&first.canonicalNormRequest?.throughOrder===1&&first.canonicalNormRequest?.derivativeOrder===1&&first.selectedByLaterPrefix===false&&zeroNorm.bound===norm&&zeroNorm.requiredLog===firstRequiredLog},
    {id:'original-c1-maximum-and-exponential',pass:first.previousLogScale===G.zero&&first.logScale===firstLog&&first.scale===G.exp(firstLog)},
    {id:'c1-is-the-actual-field-cutoff-operand',pass:!!actualFirstBandRow&&actualFirstBandRow.sigma===G.mul(first.scale,operator.band.qVariable)},
    {id:'original-complete-cutoff-body-and-flat-zero-branch',pass:cutoffDefinition.body===cutoffBody},
    {id:'actual-field-retains-cutoff-and-extra-stream-derivative',pass:!!actualFirstBandRow&&actualFirstBandRow.chi===G.expressionValue(operator.band.cutoffSystem,[actualFirstBandRow.sigma])&&actualFirstBandRow.extraCutoff===G.mul(actualFirstBandRow.sigma,G.expressionValue(operator.band.cutoffSystem,[actualFirstBandRow.sigma],[1]))},
    {id:'original-dyadic-scale',pass:operator.geometry.ell===q(BigInt(request.ellExact))&&operator.geometry.Q===G.exp(G.neg(G.mul(operator.geometry.ell,logTwo)))},
    {id:'original-epsilon-and-carrier-ceiling',pass:g.S===G.pow(g.ell,2)&&g.epsilon===powReal(g.Q,h)&&g.k===G.ceiling(G.inv(G.sqrt(g.epsilon)))},
    {id:'original-palette-and-pulse-length',pass:g.Tg===Tg&&g.paletteIndex===paletteIndex&&g.r0===r0&&g.ci===ci&&g.Ls===G.div(G.mul(q(2),r0),ci)},
    ...recurrenceChecks,...arithmetic.rows
  ];
  if(!checks.every(r=>r.pass))fail('INVALID_SOURCE_CONSTRUCTION','An actual source threshold or cutoff root differs from the proved definition: '+checks.filter(r=>!r.pass).map(r=>r.id).join(', '));
  const roots={h,frequencyMinimum:frequency,Sminimum:selection.Sminimum,ellMinimum:selection.ellMinimum,qStar:selection.qStar,ell:operator.geometry.ell,Q:operator.geometry.Q,
    actualC1:first.scale,actualC1Norm:norm,actualC1RequiredLog:firstRequiredLog,canonicalC1LowerBound:G.exp(G.div(logTwo,h)),actualCompleteTimeCutoffBody:cutoffBody};
  const proof={
    kind:'SOURCE_BOUND_WRITTEN_ANALYTIC_DOMAIN_EXCLUSION_WITH_EXACT_STRUCTURAL_AND_INTEGER_CHECKS',
    positiveH:{exact:exponent.hExact,strictRange:'0 < h < 2^-4096',derivation:exponent.proof,zeroSubstitutionUsed:false},
    originalThreshold:{definition:'ellMinimum=ceil(max(8,Sminimum,(64/h)^2)); qStar=2^(-ellMinimum-4)',
      frequencyLower:'(64/h)^2 > (2^6 * 2^4096)^2 = 2^8204',integerBandLower:'ellMinimum > 2^8204 > 128',
      argument:'Positive inversion reverses h<2^-4096. Squaring positive quantities preserves strict inequality. The original maximum and ceiling are at least their frequency operand.'},
    memberExclusion:{range:'Every exact integer 1<=ell<=128',physicalBand:'q=2^-ell*s, 1/2<=s<=2',
      memberQLower:'q>=2^-129',uniformQStarUpper:'qStar<=2^-133',separation:'q/qStar>=16',
      argument:'ellMinimum is an integer greater than 128, hence at least 129. The original buffer 4 gives qStar<=2^-133, while each declared finite band has q>=2^-129.'},
    exactLeadingBackgroundOnFiniteBands:{
      canonicalFirstScale:'log(c1)>=requiredLog_1,0=(log2+log B_1,0)/h; B_1,0=max(1, actual norm terms)>=1',
      firstScaleLower:'c1>=2^(1/h)>2^129',sequenceRule:'The unchanged canonical recipe has c_n>=2*c_(n-1) for every n>=2, hence c_n>=c1.',
      strictInactiveArgument:'For every finite displayed band and every n>=1, c_n*q>2^129*2^-129=1.',
      cutoffDefinition:'The original complete time cutoff is 1 for t<=1/2, exp(-1/(1-u))/(exp(-1/u)+exp(-1/(1-u))) for 1/2<t<1 with u=2t-1, and 0 for t>=1. Its flat extension and every derivative equal zero for argument>=1. This literal function body and the extra stream derivative are matched to the actual field roots.',
      conclusion:'All positive-order normalized background terms, including every differentiated cutoff and the extra stream term, vanish identically on an open neighborhood of each point of these bands. The actual completed F and G equal their original leading fields there.',
      proofUsesCanonicalSequenceDefinitionForAllN:true,generated128SourceGraphsClaimed:false,leadingFieldNumericallyEvaluated:false,
      sourceSequenceScope:'The currently implemented canonical normalized sequence, and any later enlargement that retains its doubling recurrence. The complete physical and weighted-stress selector is not asserted here.'},
    finiteBandCarrier:{definition:'epsilon=2^(-ell*h); k=ceil(epsilon^(-1/2))',conclusion:'k=2 for every 1<=ell<=128',
      argument:'0<ell*h<128*2^-4096<1, hence 1/2<epsilon<1 and 1<epsilon^(-1/2)<sqrt2<2.'},
    ellOneGeometry:request.ellExact==='1'?{Q:'1/2',S:'1',k:'2',paletteIndex:'0',ci:'2^(-1-h)',Ls:'2^(-32+h)',
      argument:'0<(1+h)log2/log(4+sqrt2)<1, since 0<h<1 and 2^(1+h)<4<4+sqrt2. Its floor is 0. Substitute original r0=2^-34 and Ls=2*r0/ci. No approximation h=0 is taken.'}:null,
    signBoundary:'Nonmembership in this sufficient theorem is not a counterexample to invertibility or positive weights. Actual det(H) and both weight signs require a separate theorem or rigorous enclosure.'
  };
  const decision={uniformTheoremMember:false,uniformTheoremNonmembershipProved:true,physicalQBelowUniformQStar:false,physicalQNonmembershipProved:true,
    actualDeterminantSign:'UNKNOWN',actualWeightSigns:['UNKNOWN','UNKNOWN'],actualDeterminantNonzeroProved:false,actualPositiveWeightsProved:false,
    squareRootWeightsOnThisMemberCertified:false,positiveOrderBackgroundCutoffsAllInactive:true,completedFGExactlyLeadingOnFiniteBands:true,
    fullPhysicalResidualAndFlatErrorPackageComplete:false,newLeanKernelProof:false,m3MayStart:false};
  const sourceBinding={sourceProfile:operator.sourceProfile,parameterExpressionSHA256:operator.parameterExpressionSHA256,
    actualOperator:'prepareActualCovarianceOperator; live private identity checked',actualBounds:'certifyActualCovarianceOperatorBounds; recomputed internally',
    actualCutoff:'operator.background.cutoffs.rows[0], matched to the actual first field cutoff operand',
    scope:'One actual source graph authenticates the original threshold and prefix-independent c1. The inequality proof covers all integers 1..128; other band graphs are not claimed to have been executed.'};
  const program=G.pack(roots,{schema:'MathScope.ActualCovarianceBandAdmissibilityProgram/1',compiler:'actual-covariance-band-admissibility.mjs:prepareActualCovarianceBandAdmissibility',compilerInput:request,sourceBinding,proof,decision,checks});
  const result={G,operator,bounds,request,roots,sourceBinding,proof,decision,checks,program};
  witnesses.set(result,{G,operator,data:publicData(result),count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions()});
  return result;
}

export function assertActualCovarianceBandAdmissibility(prepared){
  const saved=witnesses.get(prepared);
  if(!saved||prepared.G!==saved.G||prepared.operator!==saved.operator||publicData(prepared)!==saved.data||JSON.stringify(saved.G.nodes.slice(0,saved.count))!==saved.nodes||!saved.G.functionDefinitionsUnchanged(saved.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private actual band admissibility construction; a copied or edited conclusion is not evidence.');
  assertActualCovarianceOperator(saved.operator);return true;
}

export function prepareActualCovarianceBandAdmissibility(input={},context={}){
  const request=requestOf(input),operator=prepareActualCovarianceOperator(request,context);
  return certifyActualCovarianceBandAdmissibility(operator,context);
}

export async function actualCovarianceBandAdmissibilityCertificateFromProgram(prepared,context={}){
  assertActualCovarianceBandAdmissibility(prepared);
  const serialized=canonicalStringify(prepared.program),graphSHA256=await sha256(serialized);context.checkCancelled?.();
  return {schema:'MathScope.ActualCovarianceBandAdmissibilityCertificate/1',sourceBinding:prepared.sourceBinding,request:prepared.request,
    graph:{sha256:graphSHA256,nodeCount:prepared.G.nodes.length,canonicalBytes:new TextEncoder().encode(serialized).byteLength,compiler:prepared.program.compiler,compilerInput:prepared.request,roots:prepared.roots,graphIncluded:false},
    proof:prepared.proof,decision:prepared.decision,checks:prepared.checks,pass:true,
    scope:'The requested finite member is proved outside the original positive-family theorem. This certificate does not assert a sign of its determinant or weights and does not authorize M3.'};
}

export async function actualCovarianceBandAdmissibilityCertificate(input={},context={}){
  return actualCovarianceBandAdmissibilityCertificateFromProgram(prepareActualCovarianceBandAdmissibility(input,context),context);
}
