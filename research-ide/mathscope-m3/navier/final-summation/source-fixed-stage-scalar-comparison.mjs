/** Exact original-h choice and consumption of ONE fixed finite residual.
 *
 * The comparison stage can be far beyond every representable numeric index.
 * It is a finite ceiling expression, never a truncated or rounded integer.
 * Constructing this expression does not construct its source fields, their
 * norm constants, the cutoff prefix, or any missing all-order hypothesis.
 */
import {getPinnedSourceProfile,sourceExponentContract} from '../../../mathscope-m2/navier/source-profile.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {originalPhysicalIterationLosses} from '../source-iteration-decay.mjs';
import {shrinkingCutoffThresholdExpression} from '../shrinking-cutoff-summation.mjs';

const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const only=(x,keys)=>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!keys.includes(k)))fail('INVALID_INPUT','Use the specified source scalar inputs without caller-supplied authority.');};
const copy=x=>structuredClone(x),choices=new WeakMap(),comparisons=new WeakMap();
const natural=(x,label,maximum=10000)=>{if(!Number.isSafeInteger(x)||x<0||x>maximum)fail('RESOURCE_LIMIT',label+' exceeds its finite integer work budget.');return x;};
const root=(G,id)=>{if(!Number.isSafeInteger(id)||id<0||!G.nodes[id])fail('INVALID_SOURCE_ROOT','An existing root in the same source graph is required.');return id;};
const scalar=(G,id)=>{root(G,id);if(G.freeCoordinates(id).size)fail('COORDINATE_DEPENDENT_BOUND','A bound constant or cutoff scale must be independent of evaluation coordinates.');return id;};
const rationalRoot=(G,text)=>{const[n,d='1']=text.split('/');return G.q(BigInt(n),BigInt(d));};
const affine=(G,h,row)=>G.add(rationalRoot(G,row.constant),G.mul(rationalRoot(G,row.slope),h));

function graphSeal(G){
  const count=G.nodes.length,chunks=[];
  for(let i=0;i<count;i+=4096)chunks.push(canonical(G.nodes.slice(i,Math.min(count,i+4096))));
  const definitions=typeof G.captureFunctionDefinitions==='function'?G.captureFunctionDefinitions():null;
  if(definitions!==null&&typeof G.functionDefinitionsUnchanged!=='function')fail('UNSEALED_SOURCE_DEFINITIONS','Retained source functions need an exact integrity check.');
  return {G,count,chunks,source:canonical(G.source),definitions};
}
function graphIntact(s){
  if(s.G.nodes.length<s.count||canonical(s.G.source)!==s.source)return false;
  for(let i=0;i<s.count;i+=4096)if(canonical(s.G.nodes.slice(i,Math.min(s.count,i+4096)))!==s.chunks[i/4096])return false;
  return s.definitions===null||s.G.functionDefinitionsUnchanged(s.definitions);
}
function seal(map,G,record,extra={}){map.set(record,{record:canonical(record),graph:graphSeal(G),...extra});return record;}
function checkSeal(map,record,code){const s=map.get(record);if(!s||canonical(record)!==s.record||!graphIntact(s.graph))fail(code,'Use the unchanged internally constructed record and its retained source graph.');return s;}

/** Source order identities hold for every positive h; the pinned parameter
 * definition additionally puts h in (0,1/16), where the physical losses
 * have already been proved. No numeric original h or J is evaluated.
 */
export function prepareOriginalFixedStageChoice(G,input={}){
  only(input,['derivativeOrder','decayOrder','maxAddedNodes']);
  const m=natural(input.derivativeOrder??0,'Residual derivative order'),N=natural(input.decayOrder??0,'Flatness order',1000000),
    maxAdded=natural(input.maxAddedNodes??10000,'Additional graph node budget',1000000),before=G.nodes.length;
  if(typeof G.ceiling!=='function'||typeof G.maximum!=='function'||typeof G.freeCoordinates!=='function')
    fail('UNSUPPORTED_SOURCE_SCALAR_GRAPH','Exact ceiling, maximum and free-coordinate operations are required.');
  const profile=getPinnedSourceProfile();
  if(canonical(G.source?.parametersExactExpressions)!==canonical(profile.parametersExactExpressions))
    fail('CHANGED_ORIGINAL_EXPONENT','Retain the complete original positive source exponent definition.');
  const h=G.parameter('h'),q=(n,d=1)=>G.q(n,d),
    velocityLossData=originalPhysicalIterationLosses({order:m+1}),
    residualLossData=originalPhysicalIterationLosses({order:m}),
    tailLossData=originalPhysicalIterationLosses({order:m+2}),
    Kv=affine(G,h,velocityLossData.K),Kr=affine(G,h,residualLossData.K),ell=affine(G,h,tailLossData.ellPrime),
    tailRequired=G.add(q(N+1),Kv,ell),residualRequired=G.add(q(N+1),Kr),
    tailStageLower=G.div(G.mul(q(20),tailRequired),h),residualStageLower=G.div(G.mul(q(10),residualRequired),h),
    lower=G.maximum(q(m+2),tailStageLower,residualStageLower),J=G.ceiling(lower),
    beta=G.sub(G.div(G.mul(h,G.add(J,G.one)),q(20)),ell),
    rho=G.mul(h,G.add(q(1,5),G.div(J,q(10)))),
    tailMargin=G.sub(beta,G.add(q(N+1),Kv)),residualMargin=G.sub(G.sub(rho,Kr),q(N+1)),
    tailMarginDecomposed=G.add(G.div(G.mul(h,G.sub(J,tailStageLower)),q(20)),G.div(h,q(20))),
    residualMarginDecomposed=G.add(G.div(G.mul(h,G.sub(J,residualStageLower)),q(10)),G.div(h,q(5))),
    identity=expression=>sourceGraphRationalIdentity(G,expression,{atomicNodes:[h,J],maxTerms:12000}),
    checks=[
      {id:'complete-tail-order-margin-identity',...identity(G.sub(tailMargin,tailMarginDecomposed))},
      {id:'one-fixed-residual-order-margin-identity',...identity(G.sub(residualMargin,residualMarginDecomposed))},
      {id:'original-physical-velocity-loss-verified',pass:velocityLossData.pass&&velocityLossData.checks.every(x=>x.pass)},
      {id:'original-physical-residual-loss-verified',pass:residualLossData.pass&&residualLossData.checks.every(x=>x.pass)},
      {id:'full-cutoff-tail-loss-verified',pass:tailLossData.pass&&tailLossData.checks.every(x=>x.pass)},
      {id:'integer-stage-is-ceiling-of-all-three-requirements',pass:G.nodes[J].op==='ceiling'&&G.nodes[J].args.length===1&&G.nodes[J].args[0]===lower},
      {id:'fixed-stage-and-every-loss-source-only',pass:[h,Kv,Kr,ell,J,beta,rho].every(id=>G.freeCoordinates(id).size===0)}
    ];
  if(checks.some(x=>!x.pass))fail('SOURCE_FIXED_STAGE_IDENTITY_FAILED','A full original-h stage-choice identity failed.');
  if(G.nodes.length-before>maxAdded)fail('RESOURCE_LIMIT','The finite exact stage-choice program exceeded its additional node budget.');
  return seal(choices,G,{schema:'MathScope.N6.OriginalSourceFixedStageChoice/1',reference:'Lemma5.4, (9.17)-(9.20)',
    derivativeOrder:m,decayOrder:N,sourceExponent:sourceExponentContract(),
    sourceH:{root:h,interval:['0','1/16'],strictEndpoints:true,
      proof:'The original h=exp(-8002*(exp(1048576)+10)) is positive. Its negative logarithm exceeds 88022>4, and exp(4)>2^4=16.'},
    roots:{h,velocityLoss:Kv,residualLoss:Kr,tailDerivativeLoss:ell,tailRequired,residualRequired,
      tailStageLower,residualStageLower,stageLower:lower,fixedStage:J,tailExponent:beta,residualDecay:rho,
      tailMargin,residualMargin,tailMarginDecomposed,residualMarginDecomposed},
    fixedStageFormula:'J=ceil(max(m+2,20*(N+K_(m+1)+1+ellPrime_(m+2))/h,10*(N+K_m+1)/h))',
    inequalities:[
      {id:'integer-fixed-stage',statement:'J is an integer and J>=m+2',basis:'ceil(x)>=x and max includes m+2'},
      {id:'strict-tail-decay-margin',statement:'beta-(N+K_(m+1)+1)>=h/20>0',basis:'J>=tailStageLower and the checked complete margin identity'},
      {id:'strict-finite-residual-decay-margin',statement:'rho-K_m-(N+1)>=h/5>0',basis:'J>=residualStageLower and the checked complete margin identity'},
      {id:'tail-exponent-positive',statement:'beta>N+K_(m+1)+1>=1',basis:'N>=0 and all coefficients of K_(m+1) are nonnegative for h>0'}],
    requiredSourceEstimates:{
      finiteVelocity:{stageRoot:J,derivativeOrder:m+1,lossRoot:Kv,constantAndLogarithmicPowerRequired:true},
      finiteResidual:{stageRoot:J,derivativeOrder:m,decayRoot:rho,lossRoot:Kr,constantAndLogarithmicPowerRequired:true},
      cutoffTail:{fixedStageRoot:J,derivativeOrder:m+2,lossRoot:ell,everyFutureIncrementNormRequired:true},
      flatRemainder:{stageRoot:J,derivativeOrder:m,decayOrder:N,oneActualGlobalConstantRequired:true},
      cutoffScale:{stageRoot:J,completeOriginalScaleRootRequired:true}},
    orderOfChoices:['m and N','one exact finite J','the actual constants, cutoff scale and positive q neighborhood for this same J'],
    checks,conditionalStageChoiceVerified:true,numericOriginalHUsed:false,numericStageIndexMaterialized:false,
    originalStageFieldsConstructed:false,sourceNormConstantsConstructed:false,cutoffPrefixConstructed:false,
    originalSourcePremisesAuthenticated:false,originalN608Complete:false,wholeM3Complete:false},{});
}

export function assertOriginalFixedStageChoice(choice){checkSeal(choices,choice,'INVALID_FIXED_STAGE_CHOICE');return true;}

/** Retain all actual supplied scalar constants. Their provenance is an
 * explicit premise until an original-current adapter authenticates them.
 * The scale construction does not shrink the common domain on which the
 * finite operators exist; it chooses a comparison neighborhood inside it.
 */
export function bindOriginalFixedStageScalarEstimates(G,choice,input){
  const sourceSeal=checkSeal(choices,choice,'INVALID_FIXED_STAGE_CHOICE');
  if(sourceSeal.graph.G!==G)fail('WRONG_SOURCE_GRAPH','Use the same graph for the fixed stage and every source estimate.');
  only(input,['commonLogQReciprocalRoot','cutoff','finiteState','finiteResidual','flatRemainder','maxAddedNodes']);
  only(input.cutoff,['stageRoot','logScaleRoot','tailDerivativeOrder']);
  only(input.finiteState,['stageRoot','derivativeOrder','constantRoot','logPower','lossRoot']);
  only(input.finiteResidual,['stageRoot','derivativeOrder','constantRoot','logPower','lossRoot','decayRoot']);
  only(input.flatRemainder,['stageRoot','derivativeOrder','decayOrder','constantRoot']);
  const {derivativeOrder:m,decayOrder:N,roots:r}=choice,V=input.finiteState,R=input.finiteResidual,E=input.flatRemainder,C=input.cutoff,
    maxAdded=natural(input.maxAddedNodes??10000,'Additional comparison node budget',1000000),before=G.nodes.length,
    q=(n,d=1)=>G.q(n,d),common=scalar(G,input.commonLogQReciprocalRoot),LJ=scalar(G,C.logScaleRoot);
  if([V.stageRoot,R.stageRoot,E.stageRoot,C.stageRoot].some(id=>id!==r.fixedStage)||E.derivativeOrder!==m||E.decayOrder!==N||R.derivativeOrder!==m)
    fail('WRONG_FIXED_STAGE','Velocity, residual, flat remainder and cutoff must refer to exactly this one J,m,N.');
  if(!Number.isSafeInteger(V.derivativeOrder)||V.derivativeOrder<m+1||V.derivativeOrder>10002||C.tailDerivativeOrder!==m+2)
    fail('INSUFFICIENT_COMPARISON_DERIVATIVES','The full advection needs U_J through m+1 and the cutoff error through m+2.');
  if(V.lossRoot!==r.velocityLoss||R.lossRoot!==r.residualLoss||R.decayRoot!==r.residualDecay)
    fail('CHANGED_SOURCE_DECAY_LOSS','Use the exact previously checked physical losses and the original residual decay.');
  for(const id of [V.constantRoot,R.constantRoot,E.constantRoot]){
    scalar(G,id);if(G.isq(id)&&G.fraction(id)[0]<0n)fail('NEGATIVE_NORM_PREMISE','A supplied norm upper bound cannot be negative.');
  }
  const pv=natural(V.logPower,'Velocity logarithmic power'),pr=natural(R.logPower,'Residual logarithmic power'),
    threshold=(constantRoot,logPower)=>shrinkingCutoffThresholdExpression(G,{coefficientNorm:constantRoot,logPower,
      gain:G.one,stage:1,previousLogScale:common,logQ0Reciprocal:common}),
    tv=threshold(V.constantRoot,pv),tr=threshold(R.constantRoot,pr),
    CE=G.add(G.one,G.sqrt(G.add(G.one,G.pow(E.constantRoot,2)))),
    logDelta=G.maximum(G.one,G.add(G.one,common),G.add(G.one,LJ),tv.logScale,tr.logScale),
    delta=G.exp(G.neg(logDelta)),a=G.exp(G.neg(G.mul(r.fixedStage,G.log(q(2))))),
    differenceConstant=G.mul(q(15n*(1n<<BigInt(m))),a),totalConstant=G.add(differenceConstant,q(1,2),CE);
  if(G.nodes.length-before>maxAdded)fail('RESOURCE_LIMIT','The source scalar comparison exhausted its additional-node budget.');
  const record={schema:'MathScope.N6.OriginalSourceSingleFixedResidualComparison/1',reference:'Lemma5.4, (9.18), (9.20)',
    derivativeOrder:m,decayOrder:N,fixedStageRoot:r.fixedStage,choice:copy(choice),
    sameFixedStagePremises:{velocity:copy(V),residual:copy(R),flatRemainder:copy(E),cutoff:copy(C)},
    absorption:{velocity:tv,residual:tr,dyadicTarget:'1/2',
      thresholdStageOneMeans:'Only the logarithmic absorption target 2^-1; it is not a replacement for the selected correction index J.'},
    roots:{commonLogQReciprocal:common,fixedCutoffLogScale:LJ,logDelta,delta,tailCoefficient:a,
      positiveFlatConstant:CE,differenceConstant,totalConstant,tailExponent:r.tailExponent,residualDecay:r.residualDecay},
    normalizedResidualUpper:{constantRoot:totalConstant,qExponent:N},
    exactNSDifferenceConstant:String(6n*(1n<<BigInt(m))),
    completeNSDifference:'e_t-Delta(e)+grad(pi)+(v dot grad)e+(e dot grad)v+(e dot grad)e',
    proof:[
      'J is fixed before the constants and comparison neighborhood are selected. Every norm and the sole flat remainder are for that same stage.',
      'For 0<q<exp(-logDelta), q<q0/e<q0 and q<1/(e*a_J)<1/(2*a_J). All first-J cutoffs are therefore on their exact plateau.',
      'The retained source norm thresholds give V<=q^(-K_(m+1)-1)/2 and the nonflat part of the one finite residual <=q^N/2.',
      'The complete m+2 cutoff tail obeys E_tail<=2^-J*q^beta<=1, because J>=2, beta>0 and q<1.',
      'The full Cartesian difference is <=6*2^m*E_tail*(1+V+E_tail)<=15*2^m*2^-J*q^N.',
      'Add only the same E_(J,m,N)<=C_(J,m,N)*q^N. The positive retained majorant dominates its constant. No E_j series is formed.'
    ],
    conditionalEstimateVerified:true,commonDomainForFiniteOperatorsChanged:false,allFlatResidualsSummed:false,
    sourceBoundsAreExplicitPremises:true,actualPositiveWindowIndicesEnumerated:false,numericOriginalHUsed:false,
    numericStageIndexMaterialized:false,actualOriginalFiniteStageConstructed:false,
    originalSourcePremisesAuthenticated:false,originalN608Complete:false,wholeM3Complete:false};
  return seal(comparisons,G,record,{choice});
}

export function assertOriginalFixedStageScalarComparison(record){
  const s=checkSeal(comparisons,record,'INVALID_SCALAR_FIXED_STAGE_COMPARISON');assertOriginalFixedStageChoice(s.choice);return true;
}
