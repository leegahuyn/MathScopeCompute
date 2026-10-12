/** Complete positive-window consumer of the original (9.21) cutoff sum.
 *
 * The independent coefficient, current and all-order norm adapters must
 * still authenticate their inputs. This module constructs and checks the
 * actual supplied function roots, retains transition commutators and uses
 * one fixed uncut residual. A checked generic prefix is not a proof of the
 * original final field or of an infinite list of source norm premises.
 */
import {rational as Q,readRational as readQ,qadd,qsub,qmul,qpow,qcompare,qtext} from '../../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {assertShrinkingCutoffSchedule,shrinkingCutoffWindow,exactLogarithmicTailThreshold} from '../shrinking-cutoff-summation.mjs';

const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const copy=x=>structuredClone(x),plans=new WeakMap(),fields=new WeakMap();
const only=(x,keys)=>{if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!keys.includes(k)))fail('INVALID_INPUT','Unexpected final-summation argument or caller-supplied authority.');};
const natural=(x,label,maximum=1024)=>{if(!Number.isSafeInteger(x)||x<0||x>maximum)fail('RESOURCE_LIMIT',label+' must be a nonnegative integer within '+maximum+'.');return x;};
const root=(G,id)=>{if(!Number.isSafeInteger(id)||id<0||!G.nodes[id])fail('INVALID_SOURCE_ROOT','An actual root in the supplied source graph is required.');return id;};
const q=readQ,zero=Q(0),one=Q(1);
const maxQ=(...values)=>values.reduce((a,b)=>qcompare(a,b)>=0?a:b);
const graphChunkSize=4096;
function sealGraph(G){
  const count=G.nodes.length,chunks=[];
  for(let i=0;i<count;i+=graphChunkSize)chunks.push(canonical(G.nodes.slice(i,Math.min(count,i+graphChunkSize))));
  const definitions=typeof G.captureFunctionDefinitions==='function'?G.captureFunctionDefinitions():null;
  if(definitions!==null&&typeof G.functionDefinitionsUnchanged!=='function')fail('UNSEALED_FUNCTION_DEFINITIONS','The supplied function graph must support exact definition integrity checks.');
  return {G,count,chunks,definitions,source:canonical(G.source??null)};
}
function graphUnchanged(seal){
  const {G,count,chunks,definitions}=seal;
  if(G.nodes.length<count||canonical(G.source??null)!==seal.source)return false;
  for(let i=0;i<count;i+=graphChunkSize)if(chunks[i/graphChunkSize]!==canonical(G.nodes.slice(i,Math.min(count,i+graphChunkSize))))return false;
  return definitions===null||G.functionDefinitionsUnchanged(definitions);
}

export function prepareFinalSummationWindow(schedule,input){
  assertShrinkingCutoffSchedule(schedule);
  const window=shrinkingCutoffWindow(schedule,input),firstInactive=window.firstEntirelyInactiveIndex;
  const result={schema:'MathScope.N6.FinalSummationWindowPlan/1',reference:'(9.21), Lemma5.4',
    schedule:copy(schedule),window,
    requiredIncrementIndices:copy(window.activeIndices),
    commonDomainLogReciprocal:schedule.logQ0Reciprocal,
    completeOnEntirePositiveWindow:window.everyPossiblyActiveIndexIncluded,
    firstExcludedIndex:firstInactive,
    omittedFutureCutoffTerms:firstInactive===null?null:{firstIndex:firstInactive,identicallyZero:true,
      reason:'L_j is nondecreasing and L_first>=max_window log(1/q); hence a_j*q>=1 throughout this closed window for every later j.'},
    lastResolvedPositiveQWindow:window.everyPossiblyActiveIndexIncluded?copy(window.qWindow):null,
    unresolvedReason:window.everyPossiblyActiveIndexIncluded?null:'The retained prefix has not reached a cutoff that vanishes on the entire requested window.',
    sourceCoefficientNormsAuthenticated:false,sourceCurrentRootsAuthenticated:false,
    originalFinalFieldConstructed:false,allFutureNormPremisesProved:false,wholeM3Complete:false};
  plans.set(result,canonical(result));return result;
}

export function assertFinalSummationWindow(plan){
  if(!plans.has(plan)||plans.get(plan)!==canonical(plan))fail('INVALID_WINDOW_PLAN','Use the unchanged internally prepared complete-window plan.');return true;
}

function freeCoordinates(G,id,memo=new Map()){
  if(typeof G.freeCoordinates==='function')return G.freeCoordinates(id);
  if(memo.has(id))return memo.get(id);root(G,id);const {op,args}=G.nodes[id];let set=new Set();
  if(op==='coordinate')set.add(id);
  else if(op==='definite_integral'){
    for(const c of freeCoordinates(G,args[0],memo))if(c!==args[1])set.add(c);
    for(const endpoint of [args[2],args[3]])for(const c of freeCoordinates(G,endpoint,memo))set.add(c);
  }
  else if(!['rational','source_parameter'].includes(op)){
    if(!['add','multiply','inverse','integer_power','exp','log_positive','sqrt_positive','source_step_derivative','smooth_piecewise'].includes(op))
      fail('UNSUPPORTED_SOURCE_COORDINATE_RULE','The complete free-coordinate rule is missing for '+op+'.');
    const children=['integer_power','source_step_derivative'].includes(op)?[args[0]]:args;
    for(const child of children)for(const c of freeCoordinates(G,child,memo))set.add(c);
  }
  memo.set(id,set);return set;
}

/** The cutoff is one on s<=1/2, zero on s>=1, and smoothly flat at both
 * seams. Constants can be branched before constructing a reciprocal at a
 * seam. The open formula retains both positive exponential terms.
 */
export function originalFinalCutoffRoot(G,s){
  root(G,s);
  if(G.isq(s)){
    const v=Q(...G.nodes[s].args);
    if(qcompare(v,Q(1,2))<=0)return G.one;
    if(qcompare(v,one)>=0)return G.zero;
  }
  const u=G.sub(G.mul(G.q(2),s),G.one),left=G.exp(G.neg(G.inv(u))),right=G.exp(G.neg(G.inv(G.sub(G.one,u)))),
    inside=G.div(right,G.add(left,right));
  return G.choose(s,G.q(1,2),G.one,G.one,inside,G.zero);
}

const curl=(G,v,xyz)=>[[1,2],[2,0],[0,1]].map(([j,k])=>G.sub(G.derivative(v[k],xyz[j]),G.derivative(v[j],xyz[k])));
const vadd=(G,...values)=>[0,1,2].map(i=>G.add(...values.map(v=>v[i])));
const cross=(G,a,b)=>[[1,2],[2,0],[0,1]].map(([j,k])=>G.sub(G.mul(a[j],b[k]),G.mul(a[k],b[j])));

/** A piecewise expression whose three branches are literally the same
 * operand equals that operand. The source differentiator intentionally
 * retains these nodes (including choose(...,0,0,0)); ordinary rational
 * cancellation treats them as opaque. Expose this exact branch identity
 * through a read-only node view, leaving the actual source graph intact.
 */
function completePiecewiseRationalIdentity(G,expression,maxTerms){
  const reductions=new Set(),nodes=new Proxy(G.nodes,{get(target,key){
    const node=Reflect.get(target,key);
    if(node&&node.op==='smooth_piecewise'&&node.args[3]===node.args[4]&&node.args[4]===node.args[5]){
      reductions.add(Number(key));return {...node,op:'add',args:[node.args[3],G.zero]};
    }
    return node;
  }});
  return {...sourceGraphRationalIdentity({nodes},expression,{maxTerms}),
    identicalPiecewiseBranchReductions:[...reductions],
    piecewiseReductionRule:'choose(x,a,b,F,F,F)=F for every branch, including the two seams.',
    originalGraphModified:false};
}

/** Materialize the complete finite set of supplied Cartesian operands on
 * the plan's window. Every direct azimuthal scalar is supplied in the
 * separate s=x1^2+x2^2 variable, so its angular independence is checked by
 * its dependency set rather than asserted by a boolean.
 */
export function constructFinalSummationFromRoots(G,plan,input){
  assertFinalSummationWindow(plan);only(input,['coordinates','radialSquaredVariable','qRoot','base','increments','maxAddedNodes','maxIdentityTerms']);
  if(!plan.completeOnEntirePositiveWindow)fail('UNRESOLVED_ACTIVE_SET','A final-window value requires every possibly active correction; the current prefix is incomplete.');
  const xyzT=input.coordinates,s=input.radialSquaredVariable,maxAdded=input.maxAddedNodes??100000,maxTerms=input.maxIdentityTerms??12000;
  natural(maxAdded,'Additional source node budget',1000000);natural(maxTerms,'Exact identity term budget',1000000);
  if(!Array.isArray(xyzT)||xyzT.length!==4||new Set([...xyzT,s]).size!==5||[...xyzT,s].some(id=>G.nodes[root(G,id)].op!=='coordinate'))
    fail('INVALID_CARTESIAN_COORDINATES','Use four distinct Cartesian/time coordinates and a separate radial-squared coordinate.');
  const [x,y,z,t]=xyzT,xyz=xyzT.slice(0,3),qr=root(G,input.qRoot),allowedQ=new Set([z,t]);
  if([...freeCoordinates(G,qr)].some(id=>!allowedQ.has(id)))fail('INVALID_ORIGINAL_Q','The original summation q depends on z and time only.');
  if(!Array.isArray(input.increments)||canonical(input.increments.map(r=>r.stage))!==canonical(plan.requiredIncrementIndices))
    fail('INCOMPLETE_ACTIVE_SOURCE','Supply exactly the consecutive possibly active increments in their original order.');
  const before=G.nodes.length,checks=[];
  const budget=()=>{if(G.nodes.length-before>maxAdded)fail('RESOURCE_LIMIT','Final source cutoff/curl construction exhausted its additional-node budget; no resolved field is returned.');};
  const check=(id,expression)=>{
    const proof=completePiecewiseRationalIdentity(G,expression,maxTerms);checks.push({id,...proof});
    if(!proof.pass)fail('FINAL_SUMMATION_IDENTITY_FAILED',id);budget();
  };
  const operands=(row,stage)=>{
    only(row,stage===0?['potential','azimuthalScalar','pressure']:['stage','potential','azimuthalScalar','pressure']);
    if(!Array.isArray(row.potential)||row.potential.length!==3)fail('INVALID_POTENTIAL','A complete three-component Cartesian potential is required.');
    const A=row.potential.map(id=>root(G,id)),p=root(G,row.pressure),rawB=root(G,row.azimuthalScalar),allowedB=new Set([s,z,t]);
    if([...freeCoordinates(G,rawB)].some(id=>!allowedB.has(id)))fail('NONAXISYMMETRIC_DIRECT_MEAN','The direct azimuthal mean must depend on radial-squared, z and time only.');
    if([...A,p].some(id=>[...freeCoordinates(G,id)].some(c=>!new Set(xyzT).has(c))))fail('UNSUBSTITUTED_SOURCE_COORDINATE','Pull back all auxiliary and radial variables before the Cartesian final sum.');
    const b=G.substitute(rawB,s,G.add(G.pow(x,2),G.pow(y,2))),B=[G.neg(G.mul(y,b)),G.mul(x,b),G.zero],curlA=curl(G,A,xyz),velocity=vadd(G,curlA,B);
    check('axisymmetric-direct-mean-divergence-stage-'+stage,G.add(...B.map((v,i)=>G.derivative(v,xyz[i]))));
    budget();return {stage,A,b,B,p,curlA,velocity};
  };
  const base=operands(input.base,0),stages=[],gradQ=xyz.map(v=>G.derivative(qr,v));
  for(const supplied of input.increments){
    const j=supplied.stage,row=operands(supplied,j),classification=plan.window.classifications[j-1];
    const L=q(plan.schedule.stages[j-1].logScale),a=G.exp(G.q(...L)),argument=G.mul(a,qr),
      c=classification.plateau?G.one:originalFinalCutoffRoot(G,argument),dc=xyz.map(v=>G.derivative(c,v)),
      potential=row.A.map(v=>G.mul(c,v)),directB=row.B.map(v=>G.mul(c,v)),
      velocity=vadd(G,curl(G,potential,xyz),directB),commutator=cross(G,dc,row.A),
      decomposed=vadd(G,row.velocity.map(v=>G.mul(c,v)),commutator),pressure=G.mul(c,row.p);
    velocity.forEach((v,i)=>check('complete-cutoff-curl-stage-'+j+'-component-'+i,G.sub(v,decomposed[i])));
    check('cutoff-gradient-orthogonal-to-direct-mean-stage-'+j,G.add(...dc.map((v,i)=>G.mul(v,row.B[i]))));
    stages.push({...row,logScale:plan.schedule.stages[j-1].logScale,scale:a,argument,cutoff:c,gradient:dc,
      cutoffPotential:potential,cutoffDirectMean:directB,cutoffVelocity:velocity,cutoffPressure:pressure,commutator,
      possibleTransition:!classification.plateau,commutatorOmitted:false});budget();
  }
  const A=[0,1,2].map(i=>G.add(base.A[i],...stages.map(row=>row.cutoffPotential[i]))),
    B=[0,1,2].map(i=>G.add(base.B[i],...stages.map(row=>row.cutoffDirectMean[i]))),
    velocity=vadd(G,base.velocity,...stages.map(row=>row.cutoffVelocity)),pressure=G.add(base.p,...stages.map(row=>row.cutoffPressure)),
    directFinal=vadd(G,curl(G,A,xyz),B),J=plan.window.truncateAfter,
    fullReferenceAvailable=stages.length>=J,
    uncutVelocity=fullReferenceAvailable?vadd(G,base.velocity,...stages.filter(row=>row.stage<=J).map(row=>row.velocity)):null,
    uncutPressure=fullReferenceAvailable?G.add(base.p,...stages.filter(row=>row.stage<=J).map(row=>row.p)):null;
  velocity.forEach((v,i)=>check('summed-potential-original-9.21-component-'+i,G.sub(v,directFinal[i])));
  const result={schema:'MathScope.N6.ConstructedFinalWindowFromSourceRoots/1',reference:'(9.21)',
    coordinates:xyzT,radialSquaredVariable:s,qRoot:qr,qGradient:gradQ,base,stages,
    finalPotential:A,finalDirectMean:B,velocity,pressure,
    fixedUncutStage:fullReferenceAvailable?{stage:J,velocity:uncutVelocity,pressure:uncutPressure,
      differenceVelocity:velocity.map((v,i)=>G.sub(v,uncutVelocity[i])),differencePressure:G.sub(pressure,uncutPressure)}:null,
    fixedUncutStageUnavailableReason:fullReferenceAvailable?null:'The complete active cutoff prefix ends before J; at least one nonzero uncut reference increment was not supplied.',
    validOnlyOn:copy(plan.window.qWindow),completeActiveSet:copy(plan.requiredIncrementIndices),
    omittedCutoffTerms:copy(plan.omittedFutureCutoffTerms),fixedStageTail:copy(plan.window.tailToOneFixedUncutStage),
    checks,addedNodes:G.nodes.length-before,maxAddedNodes:maxAdded,
    allTransitionCurlCommutatorsRetained:true,oldFlatRemainderDiscarded:false,flatResidualSeriesFormed:false,
    constructedSuppliedFunctionRoots:true,sourceCoefficientNormsAuthenticated:false,sourceCurrentRootsAuthenticated:false,
    originalFinalN6FieldConstructed:false,wholeKEnergyComputed:false,wholeM3Complete:false};
  budget();fields.set(result,{record:canonical(result),graph:sealGraph(G)});return result;
}

export function assertConstructedFinalWindow(result){
  const seal=fields.get(result);
  if(!seal||seal.record!==canonical(result)||!graphUnchanged(seal.graph))fail('INVALID_FINAL_WINDOW','Use the unchanged internally constructed window result and its unchanged source operand graph.');return true;
}

/** A quantitative Cartesian version of the single-fixed-J comparison.
 * C_m=6*2^m bounds all five linear terms and all three advection products.
 * The supplied finite-state/residual/flat constants are visible premises.
 * No E_j for j!=J is accepted or added to a remainder series.
 */
export function fixedStageFinalResidualComparison(plan,input){
  assertFinalSummationWindow(plan);only(input,['derivativeOrder','decayOrder','finiteState','finiteResidual','flatRemainder']);
  const m=natural(input.derivativeOrder,'Residual derivative order',64),N=natural(input.decayOrder,'Requested flatness order',10000),J=plan.window.truncateAfter,
    tail=plan.window.tailToOneFixedUncutStage;
  if(!tail||plan.window.order!==m+2||J<m+2)fail('FIXED_STAGE_TAIL_REQUIRED','Use the same complete window with a valid uncut tail through m+2 derivatives and J>=m+2.');
  only(input.finiteState,['stage','derivativeOrder','constant','qLoss','logPower']);only(input.finiteResidual,['stage','constant','qLoss','decay','logPower']);
  only(input.flatRemainder,['stage','derivativeOrder','decayOrder','constant']);
  const V=input.finiteState,R=input.finiteResidual,E=input.flatRemainder;
  if(!Number.isSafeInteger(V.derivativeOrder)||V.derivativeOrder<m+1||V.derivativeOrder>10000)
    fail('INSUFFICIENT_FINITE_STATE_DERIVATIVES','The same finite state requires its C^(m+1) bound for differentiated advection.');
  if([V.stage,R.stage,E.stage].some(j=>j!==J)||E.derivativeOrder!==m||E.decayOrder!==N)fail('WRONG_FIXED_STAGE','Every finite field, residual and flat bound must refer to the same fixed J,m,N.');
  const CV=q(V.constant),CR=q(R.constant),CE=q(E.constant),K=q(V.qLoss),KF=q(R.qLoss),rho=q(R.decay),beta=q(tail.qExponent);
  if([CV,CR].some(v=>qcompare(v,zero)<=0)||[CE,K,KF].some(v=>qcompare(v,zero)<0))fail('INVALID_BOUND_PREMISE','Positive majorants and nonnegative norm losses/flat constants are required.');
  const pv=natural(V.logPower,'Finite-state logarithmic power',10000),pr=natural(R.logPower,'Finite-residual logarithmic power',10000),
    vThreshold=exactLogarithmicTailThreshold({constant:qtext(CV),logPower:pv,gain:'1',stage:1}),
    rThreshold=exactLogarithmicTailThreshold({constant:qtext(CR),logPower:pr,gain:'1',stage:1}),
    requiredLog=maxQ(q(vThreshold.logReciprocalThreshold),q(rThreshold.logReciprocalThreshold)),
    checks=[
      {id:'error-tail-nonnegative-exponent',pass:qcompare(beta,zero)>=0},
      {id:'nonlinear-difference-has-requested-decay',pass:qcompare(beta,qadd(Q(N),qadd(K,one)))>=0},
      {id:'one-finite-residual-has-one-extra-power',pass:qcompare(qsub(rho,KF),Q(N+1))>=0},
      {id:'entire-window-satisfies-fixed-logarithm-absorption',pass:qcompare(q(plan.window.logQReciprocal[0]),requiredLog)>=0}
    ],C=Q(6n*(1n<<BigInt(m))),a=q(tail.coefficient),differenceConstant=qmul(qmul(C,a),Q(5,2)),total=qadd(qadd(differenceConstant,Q(1,2)),CE);
  return {schema:'MathScope.N6.SingleFixedStageResidualComparison/1',derivativeOrder:m,decayOrder:N,fixedStage:J,
    normConvention:'Maximum absolute Cartesian space-time derivative of each velocity/pressure component through the indicated total order.',
    exactNSDifferenceConstant:qtext(C),completeNSDifference:'e_t-Delta(e)+grad(pi)+(v dot grad)e+(e dot grad)v+(e dot grad)e',
    fixedStateBoundPremise:copy(V),fixedResidualBoundPremise:copy(R),onlyFlatRemainderPremise:copy(E),
    tail:copy(tail),logAbsorption:{finiteState:vThreshold,finiteResidual:rThreshold,requiredLogReciprocal:qtext(requiredLog)},
    normalizedResidualUpper:{coefficient:qtext(total),qExponent:N},differenceCoefficient:qtext(differenceConstant),
    proof:['On the verified neighborhood, V<=q^(-K-1)/2 and E<=2^(-J)*q^beta<=1.',
      'The complete Cartesian residual difference is <=6*2^m*E*(1+V+E). Since q<1 and K>=0, 1+V+E<=(5/2)*q^(-K-1).',
      'The one fixed uncut residual is <=q^N/2+C_(J,m,N)*q^N after its own logarithms are absorbed.',
      'The two explicit positive constants add once. No other finite-stage flat remainder enters the estimate.'],
    checks,conditionalEstimateVerified:checks.every(row=>row.pass),allOriginalSourcePremisesAuthenticated:false,
    futureCutoffNormBoundsRemainPremises:true,allFlatResidualsSummed:false,wholeM3Complete:false};
}
