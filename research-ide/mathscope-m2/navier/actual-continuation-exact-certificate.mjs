/** Compact source-bound N4-04 receipt. The reproducible full expression DAG
 * is hashed once; it is not copied into every UI table and job export.
 * Exact functional construction is distinct from decimal quadrature.
 */
import {prepareActualSecondOrderStressProgram} from './actual-continuation-exact-order-two-stress.mjs';
import {attachActualOrderOneStress} from './actual-continuation-exact-stress.mjs';
import {assertActualFirstOrderCompleted} from './actual-continuation-exact-order-one.mjs';
import {assertActualSecondOrderCompleted} from './actual-continuation-exact-order-two.mjs';
import {actualInnerPDEIdentity} from './actual-continuation-exact-pde-proof.mjs';
import {actualConservativeMomentProof} from './actual-continuation-exact-conservation.mjs';
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

function normalize(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','terms','bits','etaOrder','heatIterations'].includes(k)))fail('INVALID_INPUT','Use the actual background certificate source profile and finite display parameters only.');
  const r={sourceProfile:input.sourceProfile??SOURCE_PROFILE_ID,terms:input.terms??0,bits:input.bits??128,etaOrder:input.etaOrder??2,heatIterations:input.heatIterations??0};
  assertSourceProfile(r.sourceProfile);
  for(const[k,a,b]of [['terms',0,2],['bits',16,4096],['etaOrder',0,2],['heatIterations',0,2]])if(!Number.isSafeInteger(r[k])||r[k]<a||r[k]>b)fail('RESOURCE_LIMIT',k+' must be an integer in ['+a+','+b+'].');
  return r;
}
const rejects=(fn)=>{try{fn();return false;}catch(e){return ['PREVIOUS_ORDER_INCOMPLETE','INVALID_SOURCE_CONSTRUCTION'].includes(e.code);}};

export function prepareActualBackgroundMomentCertificate(input={},context={}){
  const request=normalize(input);context.checkCancelled?.();
  const second=prepareActualSecondOrderStressProgram(request,context),first=attachActualOrderOneStress(second.completedOrderOne,{heatIterations:request.heatIterations},context,second.actualHeat),G=second.G;
  context.checkCancelled?.();
  const innerProofs=[actualInnerPDEIdentity(second.completedOrderOne,{order:1}),actualInnerPDEIdentity(second.completedOrderTwo,{order:2})],conservation=actualConservativeMomentProof(second.completedOrderOne,second.completedOrderTwo,second.actualHeat);
  const gateOne=assertActualFirstOrderCompleted(second.completedOrderOne),gateTwo=assertActualSecondOrderCompleted(second.completedOrderTwo);
  const sourceGates=[
    {order:1,nextOrder:2,beforeCorrectionRejected:rejects(()=>assertActualFirstOrderCompleted(second.originalLeading)),copiedReportRejected:rejects(()=>assertActualFirstOrderCompleted({...second.completedOrderOne})),afterCorrectionAccepted:gateOne.actualContinuousFiveMomentIdentity===true,actualNextSourceGenerated:second.program.scope.actualOrderTwoSourceGenerated,authority:gateOne.authority},
    {order:2,nextOrder:3,beforeCorrectionRejected:rejects(()=>assertActualSecondOrderCompleted(second.completedOrderTwo.preparedSecondInner)),copiedReportRejected:rejects(()=>assertActualSecondOrderCompleted({...second.completedOrderTwo})),afterCorrectionAccepted:gateTwo.actualContinuousFiveMomentIdentity,actualNextSourceGenerated:false,authority:gateTwo.authority}
  ];
  sourceGates.forEach(row=>{row.name='실제 '+row.order+'차 모멘트 복구 → '+row.nextOrder+'차 소스 허용';row.sourcePath='conservation.correctedMomentSourceProofs';row.pass=row.beforeCorrectionRejected&&row.copiedReportRejected&&row.afterCorrectionAccepted;});
  const labels={
    1:['n=1 ∫ R U₁ dR','n=1 ∫ R² E₁ dR','n=1 ∫ (2E₀E₁−Ω₀)/R dR','n=1 ∫ R²(U₀E₁+U₁E₀) dR','n=1 ∫ R(2U₀U₁−E₀E₁+Ω₀/2) dR'],
    2:['n=2 ∫ R U₂ dR','n=2 ∫ R² E₂ dR','n=2 ∫ (2E₀E₂+E₁²−Ω₁)/R dR','n=2 ∫ R²(U₀E₂+U₁E₁+U₂E₀) dR','n=2 ∫ R(2U₀U₂+U₁²−E₀E₂−E₁²/2+Ω₁/2) dR']
  };
  const momentIdentities=[];
  for(const[order,r]of [[1,first.orderOne],[2,second.orderTwo]])for(let j=0;j<5;j++){
    const proof=conservation.correctedMomentSourceProofs.find(p=>p.key===order+':'+j),residual=(r.momentResiduals??r.residuals)[j];
    momentIdentities.push({order,moment:j+1,label:labels[order][j],rawDebtRoot:r.moments[j],correctionRoot:r.correctionMoments[j],correctedResidualRoot:residual,
      exactResidual:'0',identityProof:proof.check,zeroFunctionSystem:proof.system,sourcePath:'graph.roots.actualOrder'+(order===1?'One':'Two')+'MomentResidual'+j,
      valueMeaning:'Exact identity between the actual source functionals; no numerical debt magnitude is reported.',verified:proof.check.pass});
  }
  const supportRows=[];
  for(const order of [1,2])for(const component of ['theta','z']){
    const packet=order===1?first:second,r=order===1?first.orderOne:second.orderTwo,s=order===1?first.stress:second.stressTwo,pde=innerProofs[order-1],total=conservation.totals.find(t=>t.order===order);
    const heatTail=order===1&&component==='theta',endpoint=heatTail?r.Xb:r.Xplus,exterior=component==='theta'?s.exteriorAngular:s.exteriorAxial,integralZero=component==='theta'?total.thetaReduced:total.zReduced;
    const verified=pde.pass&&s.supportOrder.pass&&exterior.pass&&integralZero===G.zero&&(!heatTail||s.exteriorIdentity.pass);
    supportRows.push({order,component,label:'T'+order+(component==='theta'?'θ':'z'),fromSymbol:'Xminus',toSymbol:heatTail?'Xb':'Xplus',fromRoot:r.Xminus,toRoot:endpoint,
      fromRank:0,toRank:heatTail?2:1,stressRoot:component==='theta'?s.Ttheta:s.Tz,
      forwardRoot:component==='theta'?s.thetaForward:s.zForward,backwardRoot:component==='theta'?s.thetaBackward:s.zBackward,
      rawTotalResidualRoot:component==='theta'?s.totalAngular:s.totalAxial,conservativeTotalRoot:component==='theta'?total.theta:total.z,
      exactTotalResidual:'0',evidence:{innerPDEOrder:order,innerPDEVerified:pde.pass,sourceOrderVerified:s.supportOrder.pass,exteriorTermChecks:exterior.checks,conservativeReducedRoot:integralZero,
        heatIdentityRequired:heatTail,heatIdentityVerified:heatTail?s.exteriorIdentity.pass:null},
      positionMeaning:'ORDER_RANK_ONLY; ranks are not physical X values or logarithmic distances.',verified});
  }
  const pass=momentIdentities.every(r=>r.verified)&&supportRows.every(r=>r.verified)&&sourceGates.every(r=>r.pass)&&innerProofs.every(p=>p.pass)&&conservation.pass;
  if(!pass)fail('INTERNAL_VALIDATION','The complete actual first/second-order acceptance proof did not pass.');
  const roots={...second.roots,...first.roots};
  for(const row of conservation.totals){roots['actualOrder'+row.order+'ConservativeThetaTotal']=row.theta;roots['actualOrder'+row.order+'ConservativeZTotal']=row.z;}
  const program=G.pack(roots,{construction:'Actual N4-04 first and second coefficient construction, full source moment restoration and stress support identities.',request,
    proofs:{inner:innerProofs,conservation,supportOrder:first.stress.supportOrder,firstExterior:first.program.orderOneStress.exteriorZeroChecks,secondExterior:second.program.orderTwoStress.exteriorZeroChecks,heatExterior:first.stress.exteriorIdentity},
    fieldDefinitions:{orderOne:first.program.reconstruction??second.completedOrderOne.program.reconstruction,orderTwo:second.program.reconstruction??second.completedOrderTwo.program.reconstruction},
    numericalQuadratureEnclosures:false});
  // The summary contains references into this one graph, not hidden sampled
  // substitutes. All raw incoming/correction/residual roots remain in it.
  const certificate={schema:'MathScope.ActualBackgroundMomentCertificate/1',profileId:request.sourceProfile,parameterExpressionSHA256:program.parameterExpressionSHA256,request,
    originalCriterion:{id:'N4-04',title:'차수별 radial cutoff와 모멘트 복구',sourcePage:58,text:'Lemma5.2에 따라 En,Un을 확장하고 Vn, Πn을 재구성한 뒤 (5.10)-(5.12)의 다섯 total moments를 0으로 맞춘다. 합격:\nn차수의 moment correction 완료 전 n+1 source 생성 금지. n=1과 n≥2의 다른 Tn support를 각각 검사한다.',testedActualOrders:[1,2]},
    momentIdentities,supportRows,sourceGates,
    continuousInverse:{U:{matrix:first.orderOne.Umat,inverse:first.orderOne.Uinverse,determinantRoot:G.determinant(first.orderOne.Umat),...first.orderOne.proof.normalizedU},E:{matrix:first.orderOne.Emat,inverse:first.orderOne.Einverse,determinantRoot:G.determinant(first.orderOne.Emat),...first.orderOne.proof.normalizedE},proof:first.orderOne.proof},
    innerProofs,conservation,supportOrder:first.stress.supportOrder,heatExterior:first.stress.exteriorIdentity,
    graph:{sha256:null,nodeCount:G.nodes.length,roots,compiler:'actual-continuation-exact-certificate.mjs:compileActualBackgroundMomentProgram',input:request,
      hashScope:'Canonical JSON of one complete actual source function program, including every retained node, root, implicit/Picard/shared-function body and proof. This is a reproducible local construction digest, not a live HTML digest.',
      graphIncludedInReceipt:false,sourceNodeIdentifiersPreserved:true},
    arithmetic:{mode:'EXACT_CONSTRUCTIVE_FUNCTIONALS',finiteAlgebra:'BigInt rational numerator cancellation on the actual matrix/rhs graph',analyticOperations:'Source radial-series limit, six-component Picard limit, actual continuous integrals and uniquely isolated implicit roots with stated convergence tails.',
      observedNumericDebtValues:false,finiteIteratesUsedAsRoot:false,quadratureErrorEstimatedAsProof:false},
    scope:{originalN404Complete:pass,actualFirstAndSecondOrderConstructed:true,actualFiveMomentIdentitiesChecked:10,actualInnerPDEIdentitiesChecked:12,actualStressSupportComponentsChecked:4,
      actualNextSourceRequiresPriorMomentCompletion:true,allOrdersConstructed:false,allOrderDerivativeNormsAndCutoffsConstructed:false,
      globalSignedMomentValuesNumericallyEnclosed:false,globalNumericStressResidualEvaluated:false,giantSourceParametersMaterialized:false,completeFormalNSTheoremClaimed:false,newLeanKernelProof:false},
    checks:[
      {id:'actual-source-profile',pass:program.profileId===request.sourceProfile,detail:'Every retained source operation uses the pinned accepted N3 profile and its original parameters.'},
      {id:'actual-first-and-second-five-moments',pass:momentIdentities.length===10&&momentIdentities.every(r=>r.verified),detail:'Ten exact rational identities are executed on the actual incoming moment and continuous inverse operands.'},
      {id:'actual-inner-pde-and-axis-datum',pass:innerProofs.every(p=>p.pass),detail:'Both original six-component systems and their convergent zero-axis solutions satisfy the six reconstructed inner equations.'},
      {id:'actual-conservative-stress-totals',pass:conservation.pass,detail:'The actual corrected moments and their eta derivatives reduce all four original conservative total identities to zero.'},
      {id:'actual-component-supports',pass:supportRows.length===4&&supportRows.every(r=>r.verified),detail:'Inner PDE, actual endpoint ordering, exterior zero expressions and conservative total identities justify each stress support.'},
      {id:'actual-heat-tail-identity',pass:first.stress.exteriorIdentity.pass,detail:'The source heat function and its derivative are retained in the n=1 angular exterior identity.'},
      {id:'prior-correction-source-gates',pass:sourceGates.every(r=>r.pass),detail:'Uncorrected, copied or modified reports do not authorize a later source; actual n=2 is generated only from the finalized n=1 instance.'},
      {id:'continuous-inverse-nonzero',pass:Object.values(first.orderOne.proof.checks).every(Boolean),detail:'Source positive scales and continuous 2×2 and 3×3 determinant bounds justify the exact inverse; rational cancellation alone is not a nonvanishing proof.'},
      {id:'exact-functional-scope',pass:true,detail:'The result verifies constructive function identities. It does not claim signed numerical quadrature, all-order construction or a completed formal NS theorem.'}
    ],
    pass};
  return {G,program,certificate,first,second};
}

export function compileActualBackgroundMomentProgram(input={},context={}){return prepareActualBackgroundMomentCertificate(input,context).program;}

export async function actualBackgroundMomentCertificate(input={},context={}){
  const prepared=prepareActualBackgroundMomentCertificate(input,context);context.checkCancelled?.();
  const serialized=canonicalStringify(prepared.program),digest=await sha256(serialized);context.checkCancelled?.();
  prepared.certificate.graph.sha256=digest;prepared.certificate.graph.serializedProgramBytes=new TextEncoder().encode(serialized).length;
  return prepared.certificate;
}
