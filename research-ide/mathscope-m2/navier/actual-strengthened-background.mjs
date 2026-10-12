/** A distinct actual background using explicitly strengthened cutoffs.
 * The historical canonical c_n are retained as source roots and never
 * mutated. Every new a_n is at least that c_n and twice the preceding a_n.
 * This module does not turn an unverified global residual into a flat one.
 */
import {prepareActualOrderInduction,assertActualOrderInduction} from './actual-residual-order-induction-source.mjs';
import {attachActualCanonicalCutoffs,assertActualNormalizedCutoffs} from './actual-residual-order-induction-cutoffs.mjs';
import {attachActualPhysicalCutoffSelector,assertActualPhysicalCutoffSelector} from './actual-background-physical-seminorms.mjs';
import {attachActualOrderOneWeightedStress,assertActualOrderOneWeightedStress} from './actual-order-one-weighted-stress.mjs';
import {verifyActualInductionInnerEquations,verifyActualInductionMoments,verifyActualInductionParametricKernel} from './actual-residual-order-induction-proof.mjs';
import {actualLeadingTargetOnSensitivityGraph} from './actual-covariance-sensitivity.mjs';
import {actualSupportOrderProof} from './actual-continuation-exact-support.mjs';
import {originalLeadingMomentStressIdentity,physicalSourceChartDerivatives,directCartesianMomentum} from './actual-strengthened-background-kernels.mjs';
import {SOURCE_PROFILE_ID} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap();
const publicData=r=>({request:r.request,selection:r.selection,leading:r.leading,band:r.band,rows:r.rows,coordinates:r.coordinates,
  roots:r.roots,cartesian:r.cartesian,checks:r.checks,sourceProofs:r.sourceProofs,scope:r.scope});

function originalTimeCutoff(G){
  const t=G.fresh('strengthened_original_time_cutoff'),u=G.sub(G.mul(G.q(2),t),G.one),a=G.exp(G.neg(G.inv(u))),b=G.exp(G.neg(G.inv(G.sub(G.one,u)))),
    body=G.choose(t,G.q(1,2),G.one,G.one,G.div(b,G.add(a,b)),G.zero);
  return {system:G.defineExpressionFunction({name:'ActualStrengthenedOriginalTimeCutoff',parameters:[t],body}),coordinate:t,body,
    definition:'chi(s)=1-sigma_1(2s-1); the original exp(-1/t) time seed, with its exact flat branches.'};
}

function sourceExterior(prepared){
  assertActualOrderInduction(prepared);const {G,bootstrap,records}=prepared,{X,eta}=bootstrap.constants,
    order=actualSupportOrderProof(bootstrap.completedOrderOne),ends=new Set(Object.entries(order.endpoints).filter(([k])=>k!=='Xb').map(([,v])=>v));
  for(const support of bootstrap.orderOne.supports)for(const x of support)ends.add(G.mul(bootstrap.orderOne.X0,G.pow(x,2)));
  const cache=new Map(),trace=[];
  const zero=id=>{
    if(id===G.zero)return true;if(cache.has(id))return cache.get(id);const {op,args}=G.nodes[id];let value=false;
    if(op==='add')value=args.every(zero);else if(op==='multiply')value=args.some(zero);
    else if(op==='integer_power'&&args[1]>0||op==='sqrt_positive')value=zero(args[0]);
    else if(op==='smooth_piecewise'&&args[0]===X&&ends.has(args[2])){value=zero(args[5]);if(value)trace.push({root:id,after:args[2],body:args[5]});}
    else if(op==='actual_expression_partial'){
      const f=G.expressionSystems[args[0]];
      if(f.parameters.every((v,j)=>args[1][j]===v&&(v===X||v===eta)))value=zero(f.body);
    }
    cache.set(id,value);return value;
  };
  const rows=records.slice(1).map(r=>{
    const thetaNode=G.nodes[r.stress.Ttheta],thetaEndsAtXb=r.order!==1||thetaNode.op==='smooth_piecewise'&&thetaNode.args[0]===X&&thetaNode.args[1]===order.endpoints.Xminus&&thetaNode.args[2]===order.endpoints.Xb&&thetaNode.args[3]===G.zero&&thetaNode.args[5]===G.zero;
    return {order:r.order,fields:Object.fromEntries(['F','U','M','average','Pi','v'].map(k=>[k,zero(r.global[k])])),
      stress:r.order===1?{thetaEndsAtXb,z:zero(r.stress.Tz)}:{theta:zero(r.stress.Ttheta),z:zero(r.stress.Tz)}};
  });
  const pass=rows.every(r=>Object.values(r.fields).every(Boolean)&&Object.values(r.stress).every(Boolean));
  if(!pass)fail('INVALID_SOURCE_CONSTRUCTION','A strengthened summand lost its original zero exterior.');
  return {order,rows,trace,pass,meaning:'Every source coefficient and its finite smooth derivative has its original closed support. This reducer does not set any nonzero primitive to zero.'};
}

/** Apply actual physical inequalities to the actual background, explicitly.
 * The anchor band q in[1/(4*a_anchor),1/(2*a_anchor)] has at most anchor+1
 * nonzero summands for every doubling continuation, including all jets.
 */
export function attachActualStrengthenedBackground(prepared,input={},context={}){
  assertActualOrderInduction(prepared);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['anchorOrder','derivativeOrder'].includes(k)))fail('INVALID_INPUT','Only the actual anchor and derivative representation are inputs.');
  const anchorOrder=input.anchorOrder??1,derivativeOrder=input.derivativeOrder??2;
  if(!Number.isSafeInteger(anchorOrder)||anchorOrder<1||anchorOrder+1>prepared.order||!Number.isSafeInteger(derivativeOrder)||derivativeOrder<0||derivativeOrder>8)
    fail('RESOURCE_LIMIT','Generate the anchor and next actual order, with a derivative representation through eight.');
  const {G,bootstrap,records}=prepared,{X,eta}=bootstrap.constants,c=(n,d=1)=>G.q(n,d),{A,D,L}=G.core,h=G.parameter('h'),
    progress=stage=>context.onProgress?.({stage,nodeCount:G.nodes.length});
  const historical=attachActualCanonicalCutoffs(prepared,context);progress('historical-canonical-cutoffs-retained');
  const physicalCandidate=attachActualPhysicalCutoffSelector(prepared,context);progress('actual-physical-candidate-constraints');
  const rowsSelection=[];let previous=G.zero;
  for(let n=1;n<=prepared.order;n++){
    const old=historical.rows[n-1],candidate=physicalCandidate.rows[n-1],doubling=G.add(previous,G.log(c(2))),logScale=G.maximum(old.logScale,candidate.logScale,doubling),scale=G.exp(logScale);
    rowsSelection.push({order:n,historicalLogScale:old.logScale,historicalScale:old.scale,candidateLogScale:candidate.logScale,
      doubling,logScale,scale,constraints:candidate.constraints,originalNormalizedConstraints:old.coefficientBounds,
      inequalities:['a_n>=c_n','a_n>=physicalCandidate_n','a_n>=2*a_(n-1)'],diagonalRequest:{throughOrder:n,derivativeOrder:n}});previous=logScale;
  }
  const orderOneWeighted=attachActualOrderOneWeightedStress(prepared,{derivativeOrder},context);progress('actual-order-one-weighted-block');
  const systems=[];for(let n=1;n<=prepared.order;n++)for(const kind of ['actual','auxiliary'])systems.push(verifyActualInductionInnerEquations(prepared,{order:n,kind}));
  const moments=Array.from({length:prepared.order-1},(_,j)=>verifyActualInductionMoments(prepared,{order:j+2})),parametric=verifyActualInductionParametricKernel(prepared),support=sourceExterior(prepared),leadingIdentity=originalLeadingMomentStressIdentity();
  const leading=actualLeadingTargetOnSensitivityGraph(G,{background:{prepared},chart:{s:G.one,X,eta},constants:{h,A,D}});
  const cutoff=originalTimeCutoff(G),q=G.fresh('actual_strengthened_background_q'),power=a=>G.exp(G.mul(a,G.log(q))),
    possibleLast=anchorOrder+1,anchor=rowsSelection[anchorOrder-1],lower=G.div(c(1,4),anchor.scale),upper=G.div(c(1,2),anchor.scale),
    Fterms=[records[0].global.F],Uterms=[records[0].global.U],Mterms=[bootstrap.finalM],Pterms=[leading.Pi],Tterms=[[leading.raw[0]],[leading.raw[1]]],
    radialTerms=[G.div(records[0].global.v,c(2))],rows=[];
  for(let n=1;n<=possibleLast;n++){
    const r=records[n],selected=rowsSelection[n-1],sigma=G.mul(selected.scale,q),chi=G.expressionValue(cutoff.system,[sigma]),extra=G.mul(sigma,G.expressionValue(cutoff.system,[sigma],[1])),w=power(G.mul(c(2*n),h)),weighted=G.mul(w,chi),
      F=G.mul(weighted,r.global.F),U=G.mul(weighted,r.global.U),M=G.mul(weighted,r.global.M),Pi=G.mul(weighted,r.global.Pi),
      radial=G.mul(w,G.sub(G.div(G.mul(chi,r.global.v),c(2)),G.div(G.mul(eta,extra,r.global.average),L))),stress=[r.stress.Ttheta,r.stress.Tz].map(t=>G.mul(weighted,t));
    Fterms.push(F);Uterms.push(U);Mterms.push(M);Pterms.push(Pi);radialTerms.push(radial);stress.forEach((t,j)=>Tterms[j].push(t));
    rows.push({order:n,selectedScale:selected.scale,historicalScale:selected.historicalScale,sigma,chi,extra,w,F,U,M,Pi,radial,stress,
      actualSourceRoots:{F:r.global.F,U:r.global.U,M:r.global.M,average:r.global.average,Pi:r.global.Pi,v:r.global.v,Ttheta:r.stress.Ttheta,Tz:r.stress.Tz}});
  }
  const coordinates={q,X,eta},share=(body,name)=>G.share(body,[q,X,eta],'ActualStrengthened_'+name),
    F=share(G.add(...Fterms),'F'),U=share(G.add(...Uterms),'U'),M=share(G.add(...Mterms),'M'),Pi=share(G.add(...Pterms),'Pi'),radial=share(G.add(...radialTerms),'RadialCartesianCoefficient'),
    thetaStress=share(G.add(...Tterms[0]),'Ttheta'),zStress=share(G.add(...Tterms[1]),'Tz'),sqrt2X=G.sqrt(G.mul(c(2),X));
  const roots={q,normalizedAngular:share(G.mul(sqrt2X,F),'NormalizedAngular'),normalizedAxial:U,normalizedRadial:share(G.mul(sqrt2X,radial),'NormalizedRadial'),
    normalizedPressure:Pi,normalizedThetaStress:thetaStress,normalizedZStress:zStress,
    physicalAngular:share(G.mul(power(G.neg(A)),sqrt2X,F),'PhysicalAngular'),physicalAxial:share(G.mul(power(G.neg(A)),U),'PhysicalAxial'),
    physicalRadial:share(G.mul(power(c(-1,2)),sqrt2X,radial),'PhysicalRadial'),physicalPressure:share(G.mul(power(G.mul(c(-2),A)),Pi),'PhysicalPressure'),
    physicalStream:share(G.mul(power(G.sub(G.one,A)),M),'PhysicalStream'),
    physicalThetaStress:share(G.mul(power(G.neg(G.add(A,c(1,2)))),thetaStress),'PhysicalThetaStress'),
    physicalZStress:share(G.mul(power(G.neg(G.add(A,c(1,2)))),zStress),'PhysicalZStress')};
  const y1=G.fresh('actual_strengthened_cartesian_y1'),y2=G.fresh('actual_strengthened_cartesian_y2'),e=G.fresh('actual_strengthened_cartesian_eta'),cartX=G.div(G.add(G.pow(y1,2),G.pow(y2,2)),c(2)),at=body=>G.simultaneousSubstitute(body,[X,eta],[cartX,e]),
    pA=power(G.neg(A)),pRad=power(c(-1,2)),cartBodies=[G.sub(G.mul(pRad,y1,at(radial)),G.mul(pA,y2,at(F))),G.add(G.mul(pRad,y2,at(radial)),G.mul(pA,y1,at(F))),G.mul(pA,at(U))],
    velocity=cartBodies.map((f,j)=>G.share(f,[q,y1,y2,e],'ActualStrengthenedCartesianVelocity_'+j)),pressure=G.share(at(roots.physicalPressure),[q,y1,y2,e],'ActualStrengthenedCartesianPressure');
  const positivePotentials=rows.map(r=>{
    const factor=G.mul(power(G.neg(h)),r.w,r.chi,at(r.actualSourceRoots.average),c(1,2));
    return {order:r.order,values:[G.neg(G.mul(y2,factor)),G.mul(y1,factor),G.zero],originalAverage:r.actualSourceRoots.average};
  });
  const cartesian={coordinates:{q,x1:y1,x2:y2,eta:e},profileX:cartX,velocity,pressure,positivePotentials,
    representation:'u=(-y2*q^-A*F+y1*q^-1/2*B, y1*q^-A*F+y2*q^-1/2*B, q^-A*U); positive potentials use the retained smooth M_n/X.',
    axisVelocityRepresentativesIncluded:true,stressDivergenceAtAxisNotNumericallyEvaluated:true};
  const jets={};for(const [name,body]of Object.entries(roots)){
    if(name==='q')continue;jets[name]=[];
    for(let a=0;a<=derivativeOrder;a++)for(let b=0;a+b<=derivativeOrder;b++)for(let d=0;a+b+d<=derivativeOrder;d++){
      let value=body;for(let k=0;k<a;k++)value=G.mul(q,G.derivative(value,q));for(let k=0;k<b;k++)value=G.derivative(value,X);for(let k=0;k<d;k++)value=G.derivative(value,eta);
      jets[name].push({orders:[a,b,d],value});
    }
  }
  const selection={definition:'log a_n=max(log c_n, log physicalCandidate_n, log a_(n-1)+log2), a_0=1.',rows:rowsSelection,
    originalCanonicalSequencePreserved:true,oldAndNewBackgroundsIdentified:false,weightedN1SelectorChangeNeeded:false,
    currentPhysicalCandidateDerivativeBudget:16,allUnboundedPhysicalDiagonalRequestsExecuted:false,
    physicalInequality:'For all constructed n and m<=n, B_nm*q^(n*h)<=2^-n on 0<q<=1/a_n; hence each actual cutoff tuple derivative<=2^-n*q^(n*h-(2*A+m)).'};
  const band={kind:'ACTUAL_STRENGTHENED_ANCHOR_BAND',anchorOrder,q:[lower,upper],eta:['-1','1'],X:['0','finite profile maximum'],
    lowerDefinition:'1/(4*a_anchor)',upperDefinition:'1/(2*a_anchor)',positiveExactEndpoints:true,potentiallyActiveLastOrder:possibleLast,
    allLaterInactiveFrom:anchorOrder+2,
    tailProof:'For n>=anchor+2, a_n>=2^(n-anchor)*a_anchor and q>=1/(4*a_anchor), hence a_n*q>=1. The original cutoff and every derivative vanish.',
    plateauProof:'For n<=anchor, a_n<=a_anchor and q<=1/(2*a_anchor), hence the cutoff is one with all positive derivatives zero.',
    completeForEveryDoublingContinuation:true,unconstructedHigherCoefficientsAssumedZero:false,
    coverage:'This is one proved compact band. It is not relabeled as every q or every pulse band.'};
  const checks=[
    {id:'actual-inner-and-auxiliary-equations',pass:systems.every(s=>s.pass)&&parametric.pass},
    {id:'actual-ordered-five-moments-and-support',pass:moments.every(m=>m.pass)&&support.pass},
    {id:'original-leading-moment-stress-operator-identity',pass:leadingIdentity.pass},
    {id:'actual-historical-scales-remain-explicit-max-constraints',pass:rowsSelection.every((r,j)=>r.historicalScale===historical.rows[j].scale&&r.scale===G.exp(r.logScale)&&G.freeCoordinates(r.scale).size===0)},
    {id:'every-norm-constraint-was-source-generated',pass:rowsSelection.every(r=>r.constraints.every(c=>G.nodes[c.bound]&&G.nodes[c.requiredLog]))},
    {id:'actual-selected-scales-enter-every-cutoff',pass:rows.every(r=>r.selectedScale===rowsSelection[r.order-1].scale&&r.sigma===G.mul(r.selectedScale,q))},
    {id:'complete-active-prefix-present',pass:rows.length===possibleLast&&anchorOrder+1<=prepared.order},
    {id:'n1-weighted-stress-source-bound',pass:orderOneWeighted.scope.actualRequestedOrderOneWeightedEstimateEstablished}
  ];
  if(!checks.every(c=>c.pass))fail('INTERNAL_VALIDATION','An actual strengthened-background binding failed.');
  const sourceProofs={systems,moments,parametric,support,leadingIdentity,n1Weighted:{request:orderOneWeighted.request,weightedRows:orderOneWeighted.weightedRows,cutoffWeights:orderOneWeighted.cutoff.weights,
    scaleIndependentCutoffBound:true,oldC1DerivativeRootsNotReusedAtNewA1:true},jets,
    remainingGlobalIdentities:['Actual global M_n,X=U_n on every branch, not just the inner system','Actual global Pi_n,X=sum_(i+j=n) F_i F_j-Omega_(n-1)/(2X)','Actual global stress primitive derivative including every boundary and the leading target']};
  const scope={actualStrengthenedCutoffsSelected:true,actualStrengthenedCutoffsAppliedToFields:true,actualCompleteBandBodyConstructed:true,
    historicalCutoffSourceUnchanged:true,historicalBackgroundReplaced:false,pressureAndSignedStressIncluded:true,actualPotentialExtraRadialTermIncluded:true,
    numericalFieldValuesEnclosed:false,allOrderPhysicalDiagonalRecipeCertified:false,globalFiniteResidualCancellationCertified:false,
    fullPhysicalResidualAndFlatErrorPackageComplete:false,wholeGN4Complete:false,actualPositiveWeightsAssumed:false,newLeanKernelProof:false,m3MayStart:false};
  const result={G,prepared,historical,physicalCandidate,orderOneWeighted,request:{anchorOrder,derivativeOrder,generatedOrder:prepared.order},selection,leading,band,rows,coordinates,roots,cartesian,checks,sourceProofs,scope};
  const packed=G.pack(roots,{schema:'MathScope.ActualStrengthenedBackgroundProgram/1',compiler:'actual-strengthened-background.mjs:prepareActualStrengthenedBackground',...publicData(result)}),{nodes,...metadata}=packed;
  result.program={...structuredClone(metadata),nodes:nodes.slice()};
  seals.set(result,{G,prepared,historical,physicalCandidate,orderOneWeighted,count:G.nodes.length,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),
    data:canonicalStringify(publicData(result)),metadata:canonicalStringify(metadata),serialized:canonicalStringify(result.program)});
  progress('sealed-actual-strengthened-background');return result;
}

export function assertActualStrengthenedBackground(result){
  const s=seals.get(result);if(!s||s.G!==result.G||s.prepared!==result.prepared||s.historical!==result.historical||s.physicalCandidate!==result.physicalCandidate||s.orderOneWeighted!==result.orderOneWeighted||
    canonicalStringify(publicData(result))!==s.data||canonicalStringify(result.G.nodes.slice(0,s.count))!==s.nodes||!result.G.functionDefinitionsUnchanged(s.definitions))fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged actual strengthened background, not supplied fields or edited completion flags.');
  const {nodes,...metadata}=result.program??{};if(!Array.isArray(nodes)||canonicalStringify(nodes)!==s.nodes||canonicalStringify(metadata)!==s.metadata)fail('INVALID_SOURCE_CONSTRUCTION','The fixed strengthened compiler program was changed.');
  assertActualOrderInduction(s.prepared);assertActualNormalizedCutoffs(s.historical);assertActualPhysicalCutoffSelector(s.physicalCandidate);assertActualOrderOneWeightedStress(s.orderOneWeighted);return true;
}

export function prepareActualStrengthenedBackground(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','order','anchorOrder','derivativeOrder','maxNodes'].includes(k)))fail('INVALID_INPUT','Only actual source and finite construction budgets are accepted.');
  const prepared=prepareActualOrderInduction({sourceProfile:input.sourceProfile??SOURCE_PROFILE_ID,order:input.order??2,maxNodes:input.maxNodes??2000000,maxDerivativeOrder:128},context);
  return attachActualStrengthenedBackground(prepared,{anchorOrder:input.anchorOrder??1,derivativeOrder:input.derivativeOrder??2},context);
}

/** Explicitly compile the full physical momentum on the open stress shell.
 * This is an operator evaluation on the actual new field, not a flat-error
 * theorem and not a definition of an arbitrary forcing that makes it true.
 */
export function actualStrengthenedPhysicalMomentum(result){
  assertActualStrengthenedBackground(result);const {G,coordinates:{q,X,eta},cartesian:c,roots}=result,
    chart=physicalSourceChartDerivatives(G,c.coordinates),half=G.q(1,2),radius=G.sqrt(G.mul(G.q(2),X)),
    theta=G.add(G.mul(radius,G.derivative(roots.physicalThetaStress,X)),G.div(G.mul(G.q(2),roots.physicalThetaStress),radius)),
    axial=G.add(G.mul(radius,G.derivative(roots.physicalZStress,X)),G.div(roots.physicalZStress,radius)),
    scale=G.exp(G.mul(G.neg(half),G.log(q))),at=body=>G.simultaneousSubstitute(body,[X,eta],[c.profileX,c.coordinates.eta]),
    stress=[G.neg(G.mul(scale,c.coordinates.x2,at(G.div(theta,radius)))),G.mul(scale,c.coordinates.x1,at(G.div(theta,radius))),G.mul(scale,at(axial))],
    momentum=directCartesianMomentum(G,{velocity:c.velocity,pressure:c.pressure,operators:chart.operators,stressDivergence:stress});
  return {schema:'MathScope.ActualStrengthenedPhysicalMomentum/1',coordinates:c.coordinates,velocity:c.velocity,pressure:c.pressure,stressDivergence:stress,...momentum,
    domain:'0<q in the declared compact band, X>0, -1<=eta<=1. The displayed cylindrical stress coefficients are not evaluated at X=0.',
    sourceAuthenticated:true,actualCutoffBodiesRetained:true,allPhysicalDerivativeCoefficientsRetained:true,declaredZero:false,flatErrorBoundProved:false};
}

export async function actualStrengthenedBackgroundCertificateFromProgram(result){
  assertActualStrengthenedBackground(result);const s=seals.get(result);
  return {schema:'MathScope.ActualStrengthenedBackgroundCertificate/1',status:'COMPLETED_FOR_ACTUAL_BAND_CONSTRUCTION',pass:true,
    request:result.request,selection:result.selection,band:result.band,roots:result.roots,checks:result.checks,scope:result.scope,
    graph:{sha256:await sha256(s.serialized),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).byteLength,compiler:result.program.compiler,fixedCompilerPrefix:true},
    remainingGlobalIdentities:result.sourceProofs.remainingGlobalIdentities};
}
