/** Lemma5.4 as explicit, bounded exact cutoff/tail computations.
 *
 * A coefficient majorant must come from its field, not from this module.
 * The standalone rational fixtures below therefore have no source authority.
 * The scalar-graph constructor is ready to consume actual source norm roots;
 * it never invents those roots or replaces a locally finite sum by a finite
 * forward sum of the flat residuals.
 */
import {rational as Q,readRational as readQ,qadd,qsub,qmul,qdiv,qpow,qcompare,qtext} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {originalCoreRestrictionRecipe,verifyOriginalCoreSupportInduction} from './source-core-restriction.mjs';

const fail=(message,code='INVALID_SHRINKING_CUTOFF')=>{throw Object.assign(new Error(message),{code});},
  copy=x=>structuredClone(x),seals=new WeakMap(),
  canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}',
  q=readQ,zero=Q(0),one=Q(1),
  maxQ=(...xs)=>xs.reduce((a,b)=>qcompare(a,b)>=0?a:b),
  natural=(x,name)=>{if(!Number.isSafeInteger(x)||x<0)fail(name+' must be a finite nonnegative integer.','RESOURCE_LIMIT');return x;},
  only=(input,keys)=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k)))fail('Unexpected cutoff input or caller-supplied authority.','INVALID_INPUT');};

/** A polynomial logarithm is absorbed using an explicit elementary bound.
 * For x>=0, log(1+x)<=sqrt(x), proved by differentiating their difference:
 * (sqrt(x)-1)^2/[2sqrt(x)(1+x)] >= 0. For C>0 and j>=1, log(C)<=C and
 * j log(2)<j. The two rational thresholds below are thus sufficient.
 */
export function exactLogarithmicTailThreshold(input){
  only(input,['constant','logPower','gain','stage']);
  const C=q(input.constant),gamma=q(input.gain),P=natural(input.logPower,'Logarithmic power'),j=natural(input.stage,'Correction stage');
  if(j<1||qcompare(C,zero)<=0||qcompare(gamma,zero)<=0)fail('A cutoff tail requires a positive actual majorant, positive gain and stage>=1.');
  const twiceP=Q(2n*BigInt(P)),fourPSquared=Q(4n*BigInt(P)**2n),
    logThreshold=qpow(qdiv(twiceP,gamma),2),coefficientThreshold=qdiv(qmul(Q(2),qadd(C,Q(j))),gamma),
    L=maxQ(one,logThreshold,coefficientThreshold);
  return {schema:'MathScope.N6.ExactLogTailThreshold/1',constant:qtext(C),logPower:P,gain:qtext(gamma),stage:j,
    logReciprocalThreshold:qtext(L),logarithmThreshold:qtext(logThreshold),coefficientThreshold:qtext(coefficientThreshold),
    checks:[
      {id:'positive-log-coordinate',left:qtext(L),right:'1',pass:qcompare(L,one)>=0},
      {id:'polynomial-logarithm-absorbed-by-half-gain',left:qtext(qmul(qpow(gamma,2),L)),right:qtext(fourPSquared),
        pass:qcompare(qmul(qpow(gamma,2),L),fourPSquared)>=0},
      {id:'constant-and-dyadic-tail-absorbed-by-half-gain',left:qtext(qdiv(qmul(gamma,L),Q(2))),right:qtext(qadd(C,Q(j))),
        pass:qcompare(qdiv(qmul(gamma,L),Q(2)),qadd(C,Q(j)))>=0}
    ],
    quantifiedBound:'C*(1+abs(log(q)))^P*q^gamma <= 2^(-j) for every 0<q<=exp(-L)',
    proof:[
      'Put x=-log(q)>=L>=1. Since sqrt(x)-log(1+x) starts at0 and has nonnegative derivative, log(1+x)<=sqrt(x).',
      'gamma^2*x>=4P^2 implies P*sqrt(x)<=gamma*x/2. Therefore P*log(1+x)-gamma*x<=-gamma*x/2.',
      'gamma*x/2>=C+j>=log(C)+j*log(2) implies log(C)+P*log(1+x)-gamma*x<=-j*log(2).'
    ],
    derivativeNumeratorPolynomial:['1','-2','1'],derivativeNumeratorMeaning:'(sqrt(x)-1)^2',
    sourceAuthenticated:false,actualCoefficientMajorantProved:false,arithmetic:'BIGINT_RATIONAL',floatingPointDecision:false};
}

/** Construct the same sufficient threshold on an existing exact scalar
 * graph. The supplied coefficientNorm may have either sign: C=1+sqrt(1+C0^2)
 * is positive and dominates its absolute value. The positive gain remains a
 * mathematical source premise unless it is a rational constant checked here.
 */
export function shrinkingCutoffThresholdExpression(G,input){
  only(input,['coefficientNorm','logPower','gain','stage','previousLogScale','logQ0Reciprocal']);
  const {coefficientNorm,gain,previousLogScale,logQ0Reciprocal}=input,P=natural(input.logPower,'Logarithmic power'),j=natural(input.stage,'Correction stage');
  if(j<1||[coefficientNorm,gain,previousLogScale,logQ0Reciprocal].some(root=>!Number.isSafeInteger(root)||!G.nodes[root]))
    fail('Use actual scalar norm, gain and common-domain roots.');
  for(const root of [coefficientNorm,gain,previousLogScale,logQ0Reciprocal])
    if(G.freeCoordinates(root).size)fail('Every cutoff threshold input must be source-only; a sample coordinate cannot define its all-domain constant.');
  if(G.isq(gain)&&G.fraction(gain)[0]<=0n)fail('A shrinking cutoff cannot absorb a nonpositive decay gain.');
  const C=G.add(G.one,G.sqrt(G.add(G.one,G.pow(coefficientNorm,2)))),
    logarithmThreshold=G.pow(G.div(G.q(2n*BigInt(P)),gain),2),coefficientThreshold=G.div(G.mul(G.q(2),G.add(C,G.q(j))),gain),
    L=G.maximum(G.one,G.add(G.one,previousLogScale),G.add(G.one,logQ0Reciprocal),logarithmThreshold,coefficientThreshold),a=G.exp(L);
  return {schema:'MathScope.N6.ExactSourceScalarCutoffThreshold/1',stage:j,logPower:P,gain,coefficientNorm,positiveMajorant:C,
    previousLogScale,logQ0Reciprocal,logarithmThreshold,coefficientThreshold,logScale:L,scale:a,
    scaleRule:'a_j=exp(max(1,1+log(a_(j-1)),1+log(1/q0),(2P/gamma)^2,2(C+j)/gamma))',
    gammaForOriginalCycle:'g_j/2=h*j/20',commonDomainThresholdChanged:false,
    doublingProof:'L_j>=L_(j-1)+1 gives a_j/a_(j-1)>=e>2.',
    outerSupportProof:'L_j>=1+log(1/q0) gives a_j^(-1)<=q0/e<q0.',
    positiveGainRequired:true,positiveGainRationallyChecked:G.isq(gain),
    sourceAuthenticated:false,actualCoefficientMajorantProved:false,actualSourceFieldConstructed:false,
    allConstantsRetainedAsExactSourceRoots:true,largeScaleRoundedToInfinity:false};
}

/** A checked finite prefix of the quantitative rule. Each row explicitly
 * supplies every m<=j requirement. These numbers are generic majorant
 * premises; only an authenticated field adapter may supply original ones.
 */
export function checkedShrinkingCutoffSchedule(input){
  only(input,['logQ0Reciprocal','rows','maxWork']);
  const logQ0=q(input.logQ0Reciprocal),rows=input.rows,maxWork=input.maxWork??100000;
  natural(maxWork,'Work budget');if(qcompare(logQ0,zero)<0||!Array.isArray(rows)||!rows.length||rows.length>10000)
    fail('Use0<q0<=1 and a nonempty finite consecutive coefficient-bound prefix.');
  let previous=logQ0,previousG=zero,work=0;const stages=[];
  for(let index=0;index<rows.length;index++){
    const raw=rows[index],j=index+1;only(raw,['stage','gain','bounds']);
    if(raw.stage!==j||!Array.isArray(raw.bounds)||raw.bounds.length!==j+1)fail('Every stage j must retain all cutoff derivative bounds0<=m<=j, in consecutive order.');
    const g=q(raw.gain);if(qcompare(g,zero)<=0||qcompare(g,previousG)<0)fail('The actual positive gains must be nondecreasing.');
    const thresholds=raw.bounds.map((bound,m)=>{
      only(bound,['order','constant','logPower']);if(bound.order!==m)fail('A cutoff derivative order was omitted or duplicated.');
      if(++work>maxWork)fail('The exact cutoff schedule exhausted its finite majorant budget.','RESOURCE_LIMIT');
      return {order:m,...exactLogarithmicTailThreshold({constant:bound.constant,logPower:bound.logPower,gain:qtext(qdiv(g,Q(2))),stage:j})};
    }),L=maxQ(one,qadd(previous,one),qadd(logQ0,one),...thresholds.map(row=>q(row.logReciprocalThreshold)));
    stages.push({stage:j,gain:qtext(g),logScale:qtext(L),scale:{exp:qtext(L)},thresholds,
      previousLogScale:qtext(previous),doublingLogGap:qtext(qsub(L,previous)),outerLogGap:qtext(qsub(L,logQ0)),
      everyDerivativeRequirementSatisfied:thresholds.every(row=>row.checks.every(check=>check.pass)&&qcompare(L,q(row.logReciprocalThreshold))>=0)});
    previous=L;previousG=g;
  }
  const result={schema:'MathScope.N6.CheckedFiniteShrinkingCutoffSchedule/1',logQ0Reciprocal:qtext(logQ0),q0:{exp:qtext(qmul(Q(-1),logQ0))},stages,
    futureExtensionRule:'Continue the same rule with actual positive majorants, all0<=m<=j, nondecreasing positive g_j and L_j>=L_(j-1)+1.',
    checks:[{id:'all-cutoff-majorants-retained',pass:stages.every(row=>row.everyDerivativeRequirementSatisfied)},
      {id:'every-scale-at-least-doubles',pass:stages.every(row=>qcompare(q(row.doublingLogGap),one)>=0)},
      {id:'strict-support-inside-unchanged-q0',pass:stages.every(row=>qcompare(q(row.outerLogGap),one)>=0)}],
    workUsed:work,maxWork,sourceAuthenticated:false,callerMajorantsArePremisesOnly:true,
    actualSourceCoefficientBoundsVerified:false,actualSourceFinalFieldConstructed:false,allFlatResidualsSummed:false};
  seals.set(result,canonical(result));return result;
}

export function assertShrinkingCutoffSchedule(result){
  if(!seals.has(result)||seals.get(result)!==canonical(result))fail('Use the unchanged internally checked cutoff prefix.');return true;
}

/** Store every possibly active index on a closed positive-q window.
 * An original field comparison is refused unless all first J cutoffs are
 * on their plateau. A bound on the tail of this finite cutoff sum remains
 * a conditional majorant computation until a source field supplies C-hat.
 */
export function shrinkingCutoffWindow(result,input){
  assertShrinkingCutoffSchedule(result);only(input,['logQReciprocal','order','truncateAfter','derivativeLoss']);
  if(!Array.isArray(input.logQReciprocal)||input.logQReciprocal.length!==2)fail('Specify the complete closed log(1/q) evaluation window.');
  const [low,high]=input.logQReciprocal.map(x=>q(x)),m=natural(input.order,'Derivative order'),J=natural(input.truncateAfter,'Fixed truncation'),loss=q(input.derivativeLoss);
  if(qcompare(low,q(result.logQ0Reciprocal))<=0||qcompare(high,low)<0||qcompare(loss,zero)<0||J<Math.max(1,m)||J>=result.stages.length)
    fail('The tail comparison requires a positive-q window, J>=max(1,m), the next gain, and a nonnegative derivative loss.');
  const classification=result.stages.map(row=>{const L=q(row.logScale),inactive=qcompare(L,high)>=0,plateau=qcompare(low,qadd(L,one))>=0;
    return {stage:row.stage,logScale:row.logScale,status:inactive?'ZERO_ON_ENTIRE_WINDOW':plateau?'ONE_ON_ENTIRE_WINDOW':'MAY_BE_ACTIVE_OR_IN_TRANSITION',
      exactScaleValueNumericallyEvaluated:false,zero:inactive,plateau};}),
    firstInactive=classification.find(row=>row.zero)?.stage??null,complete=firstInactive!==null,
    activeIndices=classification.filter(row=>!row.zero).map(row=>row.stage),plateau=classification.slice(0,J).every(row=>row.plateau),
    nextGain=q(result.stages[J].gain),tailExponent=qsub(qdiv(nextGain,Q(2)),loss),tailCoefficient=Q(1,1n<<BigInt(J)),
    bound=complete&&plateau?{coefficient:qtext(tailCoefficient),qExponent:qtext(tailExponent),
      formula:'2^(-J)*q^(g_(J+1)/2-ellPrime_m)',derivativeOrder:m,fixedUncutStage:J,
      firstJCutoffsExactlyOne:true,allLaterUnmaterializedCutoffsZeroOnThisWindow:true,
      proof:'For every retained j>J, m<=j and C-hat*Lambda^P*q^(g_j/2)<=2^-j; monotonicity of g and0<q<1 give the displayed geometric sum. All indices at or beyond the first inactive cutoff are zero by scale monotonicity.'}:null;
  return {schema:'MathScope.N6.ShrinkingCutoffWindowCertificate/1',sourceAuthenticated:false,
    logQReciprocal:[qtext(low),qtext(high)],qWindow:{lower:{exp:qtext(qmul(Q(-1),high))},upper:{exp:qtext(qmul(Q(-1),low))}},
    order:m,truncateAfter:J,derivativeLoss:qtext(loss),classifications:classification,activeIndices,firstEntirelyInactiveIndex:firstInactive,
    everyPossiblyActiveIndexIncluded:complete,firstJCutoffsExactlyOne:plateau,tailToOneFixedUncutStage:bound,
    status:bound?'CONDITIONAL_MAJORANT_AND_COMPLETE_ACTIVE_WINDOW':'FINITE_STAGE_APPROXIMATION_WITHOUT_VALIDATED_UNCUT_TAIL',
    missing:!complete?['The finite prefix has not reached an identically inactive cutoff on the entire evaluation window.']:!plateau?['At least one of the first J cutoffs may be in transition; its commutator cannot be omitted.']:[],
    actualCoefficientClassPremisesVerified:false,actualSourceFinalFieldConstructed:false,flatRemaindersAddedTogether:false};
}

/** Exact differential identities and the fixed-stage order of choices.
 * The source-neutral proof uses arbitrary Cartesian velocity/pressure jets.
 * It neither assumes the base residual is zero nor sums E_(j,m).
 */
export function originalShrinkingCutoffProof(){
  const support=verifyOriginalCoreSupportInduction(originalCoreRestrictionRecipe()),
    increment=support.checks.find(row=>row.id==='literal-full-NS-increment-and-base-residual-separation'),
    curl=support.checks.find(row=>row.id==='all-potential-cutoff-curl-products-retained');
  if(!increment?.pass||!curl?.pass)fail('The complete NS difference or potential-cutoff curl identity is unavailable.');
  const constantPolynomial=['1','-2','1'],square=[1,-1],expanded=[square[1]*square[1],2*square[0]*square[1],square[0]*square[0]].map(String);
  if(canonical(expanded)!==canonical(constantPolynomial))fail('The logarithmic absorption derivative lost its nonnegative square.');
  return {schema:'MathScope.N6.CheckedShrinkingCutoffTheorem/1',sourceAuthenticated:false,
    completeNSIncrement:copy(increment.evidence),completeCutoffCurl:copy(curl.evidence.cartesianProductRules),
    logAbsorption:{derivativeNumerator:constantPolynomial,exactSquare:expanded,nonnegativeSquareVerified:true},
    fixedDifferentialPolynomial:{name:'Cartesian Navier-Stokes residual',order:2,degree:2,coefficientLoss:'0',
      stressEntryPresent:false,formula:'partial_t u-Delta u+(u dot grad)u+grad p',
      comparison:'R(v+e,p+pi)-R(v,p)=partial_t e-Delta e+grad pi+(v dot grad)e+(e dot grad)v+(e dot grad)e'},
    finalTailChoice:{first:['m','N'],second:'one fixed integer J>=m+2',third:'the positive q neighborhood and constants for this fixed J',
      requiredInequalities:['g_(J+1)/2-ellPrime_(m+2)>=N+K_(m+2)+1','rho_J-K_m>=N+1','g_(J+1)/2-ellPrime_(m+2)>=0'],
      nearZeroPlateau:'q<(2*a_J)^(-1)',finiteStateLogarithms:'Absorb the fixed C_(J,m+2)*Lambda^P_(J,m+2) into one additional q^(-1), only after J is fixed.',
      onlyFlatRemainderUsed:'E_(J,m)<=C_(J,m,N)*q^N for this fixed J',
      seriesOfFlatRemaindersFormed:false,initializationCutoffErrors:'Supported away from q=0 and retained in the fixed-stage flat estimate.'},
    supportAndRegularity:{qBoundedBelowOnCompactSetsRequired:true,potentialsCutBeforeCurl:true,
      directAzimuthalTerm:'chi(a_j*q)*b_j(r,z,t)*e_theta has zero divergence because chi and b_j are independent of theta.',
      locallyFinite:'If q>=delta>0, any a_j>delta^(-1) has zero cutoff; the geometrically increasing scales give finitely many active indices.',
      axisAndLateralZeroExtensionsRequired:true},
    checks:[{id:'all-physical-NS-increment-terms-retained',pass:increment.pass},
      {id:'all-cutoff-curl-commutators-retained',pass:curl.pass},
      {id:'unmodified-base-residual-not-assumed-zero',pass:increment.evidence.baseResidualAssumedZero===false},
      {id:'logarithmic-threshold-positive-square',pass:true}],
    actualCoefficientMajorantsAvailable:false,actualOriginalCutoffSequenceInstantiated:false,
    actualOriginalAllSpaceFinalFieldConstructed:false,newLeanKernelProof:false};
}
