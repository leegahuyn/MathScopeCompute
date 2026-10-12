/** Actual complete g_r -> P -> T0 pressure class composition.
 *
 * The input is the privately checked complete pre-Haar common-Y current,
 * together with the original fixed radial operator. No caller norm,
 * sampled covariance, Haar-only field, or completion flag is accepted.
 * An orderm pressure norm requires an actual covariance norm throughm+1.
 */
import {assertGlobalCommonYCovarianceClass,globalCommonYCovarianceClassCertificate}
  from './source-common-y-class-majorants.mjs';
import {assertOriginalRadialClassMajorants,originalRadialClassMajorantCertificate,
  attachGlobalPressureRadialClassOperator,assertPressureRadialClassOperator}
  from './source-radial-class-majorants.mjs';
import {originalPressureClassDerivativeDemand,copyClosedOriginalSourceConstants,
  originalRadialPhaseUpperFactorization,exactCompleteRadialCovarianceForce,radialCovarianceForceMajorant}
  from './source-pressure-class-kernel.mjs';
import {radialFactorial} from './source-radial-class-kernel.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),copy=x=>structuredClone(x),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},CHUNK=4096,
  snapshot=G=>({count:G.nodes.length,source:canonicalStringify(G.source),definitions:G.captureFunctionDefinitions(),
    chunks:Array.from({length:Math.ceil(G.nodes.length/CHUNK)},(_,j)=>canonicalStringify(G.nodes.slice(j*CHUNK,(j+1)*CHUNK)))}),
  unchanged=(G,s)=>G.nodes.length>=s.count&&canonicalStringify(G.source)===s.source&&G.functionDefinitionsUnchanged(s.definitions)&&
    s.chunks.every((x,j)=>x===canonicalStringify(G.nodes.slice(j*CHUNK,Math.min(s.count,(j+1)*CHUNK)))),
  record=p=>({schema:p.schema,request:p.request,demand:p.demand,source:p.source,domain:p.domain,sourceBinding:p.sourceBinding,
    fixedConstantCopy:p.fixedConstantCopy,coefficientBounds:p.coefficientBounds,inputRows:p.inputRows,
    grRows:p.grRows,rows:p.rows,pendingCutoffGains:p.pendingCutoffGains,checks:p.checks,scope:p.scope});

function requested(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','ibpOrder','maxWork'].includes(k)))
    fail('Choose finite output/IBP orders and a work budget only; no source norm or class flag is accepted.','INVALID_INPUT');
  const request={order:input.order??0,ibpOrder:input.ibpOrder??0,maxWork:input.maxWork??200000},
    demand=originalPressureClassDerivativeDemand(requestWithOrders(request));
  if(!Number.isSafeInteger(request.maxWork)||request.maxWork<1||
    BigInt(demand.requiredGrOrder+2)**2n>BigInt(request.maxWork))
    fail('The complete radial pressure class composition exceeds its explicit finite work budget.','RESOURCE_LIMIT');
  return {request,demand};
}
const requestWithOrders=r=>({order:r.order,ibpOrder:r.ibpOrder});

/** The complete finite source demand is checked BEFORE generating any
 * pressure norm. A value-only upstream witness cannot satisfy a W C1
 * premise merely because its source expression has formal derivatives.
 */
export function attachGlobalRadialPressureClass(commonY,radial,input={},context={}){
  assertGlobalCommonYCovarianceClass(commonY);assertOriginalRadialClassMajorants(radial);
  const {request,demand}=requested(input),m=request.order,p=request.ibpOrder,n=demand.requiredGrOrder,
    current=commonY.primary.current,pressure=commonY.pressure,G=commonY.G,PG=pressure.G,FG=radial.G,
    {R,Z,T,Y}=pressure.geometry,inputRows=commonY.bounds.rows.slice(0,demand.requiredCommonYCovarianceOrder+1),
    requiredPole=inputRows.length?Math.max(...inputRows.map(r=>r.fields.fullCovariance.pole)):Infinity;
  if(commonY.scope.actualFiniteDerivativeOrder<demand.requiredCommonYCovarianceOrder||
    inputRows.length!==demand.requiredCommonYCovarianceOrder+1||
    inputRows.some((r,j)=>r.order!==j||r.fields.fullCovariance.epsilonExponent!=='1'||r.fields.fullCovariance.weight!=='zeta'||
      r.fields.fullCovariance.gaussian!=='1'||!Number.isSafeInteger(r.fields.fullCovariance.power)||
      !Number.isSafeInteger(r.fields.fullCovariance.pole)||G.freeCoordinates(r.fields.fullCovariance.constant).size!==0))
    fail('Generate the same actual complete common-Y covariance norms through order '+demand.requiredCommonYCovarianceOrder+
      ' (primary order '+demand.requiredPrimaryOrder+', background C'+demand.requiredBackgroundSlowOrder+
      ', target C'+demand.requiredTargetWeightedOrder+') before this pressure composition.','RESOURCE_LIMIT');
  if(radial.request.order<m||radial.request.ibpOrder<Math.max(1,p)||radial.request.pole<requiredPole||
    radial.pressureRows.length<m+1||radial.pressureInput.length<n+1||radial.cutoff.rows.length<m+2)
    fail('Generate the original radial operator through every requested output/IBP order and at least the actual covariance pole '+requiredPole+'.','RESOURCE_LIMIT');
  if(pressure.current!==current||commonY.primary.G!==G||
    commonY.source.parameterExpressionSHA256!==radial.source.parameterExpressionSHA256||
    commonY.source.paperSHA256!==radial.source.paperSHA256)
    fail('The complete covariance and fixed radial operator must use the same original current, profile and parameter graph.');
  const normStart=G.nodes.length,sourceStart=PG.nodes.length,q=(a,b=1)=>G.q(a,b),
    force=exactCompleteRadialCovarianceForce(PG,{...pressure.geometry,W:pressure.covariance.fullAngularMean}),
    phase=originalRadialPhaseUpperFactorization(PG,{ell:current.band.coordinates.ell}),
    radialAttachment=attachGlobalPressureRadialClassOperator(pressure,radial),
    radius=radial.geometry.B,
    fixedRoots=[radius,radial.phase.dr,radial.phase.kappa,radial.phase.rho,
      radial.weight.wholeIntegralConstant,radial.geometry.middleZetaInverse,
      ...radial.pressureInput.slice(0,n+1).flatMap(r=>[r.wholeHaarProjectionConstant,r.rhoWeightedNorm,r.constant]),
      ...radial.pressureRows.slice(0,m+1).flatMap(r=>[r.pressureConstant,...r.cutoffRemainders.slice(0,p).map(a=>a.constant)]),
      ...radial.rows[0].orders.slice(0,m+1).map(r=>r.primitiveConstant),
      ...radial.change.exponents[0].throughOrder.slice(0,m+1).flatMap(r=>[r.outputPrefactor,r.outputComposition,r.transformedSource]),
      ...radial.cutoff.rows.slice(0,m+2).map(r=>r.bound)],
    copied=copyClosedOriginalSourceConstants(FG,G,[...new Set(fixedRoots)],{maxWork:request.maxWork,name:'actual_pressure_class'}),
    at=id=>{const value=copied.mapping.get(id);if(value===undefined)fail('A complete fixed radial constant was not copied.');return value;},
    B=at(radius),dr=at(radial.phase.dr),kappa=at(radial.phase.kappa),rho=at(radial.phase.rho),
    coefficientR=G.fresh('actual_gr_class_positive_R'),power=(x,a)=>G.exp(G.mul(a,G.log(x))),
    radialPowerBody=power(coefficientR,dr),
    coefficientRows=Array.from({length:n+2},(_,j)=>({order:j,
      actualDerivative:G.mul(radialPowerBody,G.pow(coefficientR,-j),...Array.from({length:j},(_,k)=>G.sub(dr,q(k)))),
      bound:G.mul(q(radialFactorial(j+4)),G.pow(B,j+4)),
      sourceFormula:'D_R^j R^d_r=R^(d_r-j)*product_(k=0..j-1)(d_r-k), on the original positive radial envelope.'})),
    grRows=Array.from({length:n+1},(_,j)=>{
      context.checkCancelled?.();const f=inputRows[j+1].fields.fullCovariance,
        bound=radialCovarianceForceMajorant(G,{order:j,radiusBase:B,directPowerDerivativeBounds:coefficientRows.map(r=>r.bound),
          inputNorm:f.constant,maxWork:request.maxWork});
      return {order:j,actualSourceRoot:force.value,sourceGraphNamespace:'pressure.G',inputOrder:j+1,input:copy(f),
        bound,constant:bound.constant,power:f.power,pole:radial.request.pole,
        originalInputPole:f.pole,lowerPoleAdjustment:'delta_*=min(1,da,db)<=1, so the input pole can be increased to the fixed radial operator pole.',
        epsilonExponent:'1-kappa_s',weight:'zeta',gaussian:'1',
        derivativeConvention:'Every ordinary slow/common-Y mixed derivative of total order <= '+j+' on the same original reference chart.'};
    }),rows=[];
  for(let j=0;j<=m;j++){
    context.checkCancelled?.();const gr=grRows[j],ri=radial.pressureInput[j],op=radial.pressureRows[j],c=radial.change.exponents[0].throughOrder[j],
      projectionConstant=at(ri.wholeHaarProjectionConstant),rhoNorm=at(ri.rhoWeightedNorm),
      rhoPConstant=G.mul(q(2n**BigInt(j)),rhoNorm,projectionConstant,gr.constant),
      centeredConstant=G.mul(at(ri.constant),gr.constant),
      rawCutoffOperator=G.mul(q(3n**BigInt(j)),at(c.outputPrefactor),at(c.outputComposition),
        at(radial.cutoff.rows[j+1].bound),at(radial.weight.wholeIntegralConstant),
        at(radial.geometry.middleZetaInverse),at(c.transformedSource)),
      rawCutoffConstant=G.mul(rawCutoffOperator,centeredConstant),
      weighted=(constant,extra={})=>({constant,power:gr.power,pole:gr.pole,epsilonExponent:'1-kappa_s',weight:'zeta',...extra}),
      cutoffGains=op.cutoffRemainders.slice(0,p).map(a=>{
        const sourceGr=grRows[a.demand.flatRemainderInputOrder],constant=G.mul(at(a.constant),sourceGr.constant),
          epsilonExponent=G.add(G.sub(G.one,kappa),G.mul(q(a.ibpOrder),kappa)),
          exactSPower=G.add(q(sourceGr.power),G.mul(q(a.ibpOrder),rho)),integerSPower=sourceGr.power+a.ibpOrder;
        if(!Number.isSafeInteger(integerSPower))fail('The complete polynomial S degree exceeds its integer representation.','RESOURCE_LIMIT');
        return {ibpOrder:a.ibpOrder,sourceGrOrder:a.demand.flatRemainderInputOrder,
          sourceCovarianceOrder:a.demand.flatRemainderInputOrder+1,input:copy(sourceGr),constant,
          epsilonExponent,epsilonExponentFormula:'1-kappa_s+'+a.ibpOrder+'*kappa_s',
          exactSPower,power:integerSPower,pole:radial.request.pole,weight:'zeta',
          powerWeakening:'0<rho_g<1 and S_ref>=1 allow the retained integer degree.',
          wholeActualWeightedZeroMoment:radialAttachment.sourceRows[0].weightedMean,
          allSourceDerivativesOfZeroMomentRetained:true,positiveEpsilonGain:true};
      });
    rows.push({order:j,gr:weighted(gr.constant),
      P:weighted(G.mul(projectionConstant,gr.constant),{weight:'1',pole:0,independentOfRAndY:true,
        radialAndTorusDerivativesAreExactlyZero:true,wholeNormalizedHaarProjection:true}),
      rhoP:weighted(rhoPConstant),centeredSource:weighted(centeredConstant),
      pressure:weighted(G.mul(at(op.pressureConstant),gr.constant)),
      fullPhysicalRadialDerivative:weighted(G.add(centeredConstant,rawCutoffConstant)),
      radialPressureDefect:weighted(G.add(rhoPConstant,rawCutoffConstant)),
      cutoffA0:weighted(rawCutoffConstant,{positiveEpsilonGain:false,flatnessClaimed:false}),
      rawCutoffOperator,rawCutoffProof:[
        'The complete A0 is chi_R times the whole shifted integral. In U=R^d_r it equals chi_R*integral F(U+u,Y+M*u*v_r)du.',
        'Every U,Z,T,Y derivative enters the full source F at fixed u and fixed original M; no derivative factor M is incurred.',
        'The full3^m product distribution, original R/U coordinate bounds, cutoff derivatives throughm+1 and whole weighted integral constant are retained.',
        'Every derivative of chi_R is supported in the strict original mean collar, where the displayed middle zeta inverse restores the output weight.',
        'This is the unimproved M_(1-kappa_s) bound. Positive epsilon gains require the separately listed actual higher source derivatives and zero mean.'
      ],cutoffGains,
      exactPressureIdentity:'D_r p_m=(g_r-rho P)-A0; hence D_r p_m-g_r=-rho P-A0.',
      sourceRadialDerivativeBoundUsesExactIdentity:true,pressureNotReplacedByItsHaarMean:true});
  }
  const firstUnrequestedIBP=Math.max(1,p+1),pendingCutoffGains=Array.from({length:m+1},(_,j)=>{
    const d=originalPressureClassDerivativeDemand({order:j,ibpOrder:firstUnrequestedIBP});
    return {outputOrder:j,nextIBPOrder:firstUnrequestedIBP,demand:d,
      actualAvailableCovarianceOrder:commonY.scope.actualFiniteDerivativeOrder,
      requiredNormRowAlreadyGenerated:commonY.scope.actualFiniteDerivativeOrder>=d.requiredCommonYCovarianceOrder,
      certification:'NOT_APPLIED_BY_THIS_FINITE_REQUEST',rawA0StillRetained:true,
      noMissingNormDeclaredZero:true};
  }),sourceBinding={graphNamespace:'pressure.G',fullCovariance:copy(pressure.covariance.fullAngularMean),force,
    actualGr:pressure.radial.gr,phase,originalRadialOperatorAttachment:{...radialAttachment,G:null,input:null,operator:null},
    actualP:pressure.radial.P,actualCenteredSource:pressure.pressure.source,actualPressure:pressure.pressure.value,
    actualA0:pressure.pressure.cutoffRemainder,actualFullRadialDerivative:pressure.pressure.fullRadialDerivative,
    actualRadialPressureDefect:pressure.residual.radial,
    actualPressureIdentity:copy(pressure.pressure.identity),
    sourcePeriodicity:pressure.cover.proof.sourcePeriodicity,sourceFlatJoins:copy(pressure.cover.proof.localFinitenessAndFlatJoins),
    originalAllSixAndAll162Rows:true,actualCompleteIntegralAndBothEndpointsRetained:true},
    checks=[
      {id:'same-private-pre-Haar-all162-covariance-input',pass:commonY.pressure===pressure&&pressure.current===current&&
        same(commonY.roots.fullCovariance,pressure.covariance.fullAngularMean)&&commonY.mapping.completePreHaarField&&
        !commonY.mapping.haarAverageSubstituted&&commonY.mapping.mapRows.length===162},
      {id:'every-requested-covariance-derivative-bound-actually-generated',pass:inputRows.length===demand.requiredCommonYCovarianceOrder+1&&
        inputRows.every((r,j)=>r.order===j)&&commonY.primary.request.order>=demand.requiredPrimaryOrder},
      {id:'literal-complete-gr-and-original-both-torus-directions',pass:force.value===pressure.radial.gr&&same(force.vr,pressure.geometry.vr)&&force.allFiveTermsRetained},
      {id:'literal-original-fixed-band-phase-and-upper-factorization',pass:phase.identity.pass&&phase.index===pressure.geometry.commonIndex&&
        phase.baseEll===pressure.geometry.referenceBaseEll&&pressure.cover.proof.integerRange.proof.some(t=>t.includes('ell_ref-2>=8'))&&
        radialAttachment.phase.commonIndex===phase.index&&radialAttachment.checks.every(c=>c.pass)},
      {id:'all-fixed-R-power-coefficient-jets-and-complete-Leibniz-envelopes',pass:coefficientRows.length===n+2&&
        grRows.every((r,j)=>r.bound.rows.length===j+1&&r.bound.inputDerivativeOrder===j+1&&r.bound.originalLNorm===G.sqrt(q(2)))},
      {id:'same-fixed-rho-full-mass-and-original-pressure-source',pass:radialAttachment.sourceRows.length===1&&
        radialAttachment.sourceRows[0].gr===force.value&&radialAttachment.sourceRows[0].P===pressure.radial.P&&
        radialAttachment.sourceRows[0].pressure===pressure.pressure.value&&radialAttachment.sourceRows[0].checks.every(c=>c.pass)},
      {id:'complete-unimproved-A0-and-exact-radial-PDE-defect-retained',pass:rows.every(r=>r.cutoffA0.flatnessClaimed===false)&&
        pressure.pressure.cutoffRemainderDeclaredZero===false&&pressure.pressure.identity.pass&&pressure.residual.fullPDEDeclaredSolved===false},
      {id:'every-positive-IBP-gain-has-its-actual-full-source-norm',pass:rows.every(r=>r.cutoffGains.length===p&&r.cutoffGains.every(a=>
        a.sourceCovarianceOrder<=commonY.scope.actualFiniteDerivativeOrder&&a.allSourceDerivativesOfZeroMomentRetained))},
      {id:'exact-closed-source-constant-namespace-copy',pass:copied.allCopiedRootsClosed&&copied.allDefiningIntegrandsAndEndpointsRetained&&
        copied.roots.every(r=>G.freeCoordinates(r.targetRoot).size===0)},
      {id:'all-resulting-norm-constants-source-only',pass:rows.every(r=>['gr','P','rhoP','centeredSource','pressure','fullPhysicalRadialDerivative','radialPressureDefect','cutoffA0'].every(k=>
        G.freeCoordinates(r[k].constant).size===0))&&grRows.every(r=>G.freeCoordinates(r.constant).size===0)},
      {id:'original-epsilon-and-source-window-are-kept',pass:current.band.geometry.epsilon===pressure.geometry.epsilon&&
        same(G.source.parametersExactExpressions.h,{exp:{product:[{integer:-8002},{ref:'T'}]}})&&
        radial.phase.drRangeProof.strict&&same(radial.phase.drRangeProof.range,['1','4'])}
    ];
  if(checks.some(c=>!c.pass))fail('Actual full gr/radial pressure class composition failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const result={schema:'MathScope.N6.ActualGlobalRadialPressureClass/1',G,commonY,radial,radialAttachment,pressure,current,request,demand,
    source:{paperSHA256:commonY.source.paperSHA256,parameterExpressionSHA256:commonY.source.parameterExpressionSHA256,
      equations:['8.3','8.5','8.8','8.9','8.10','8.12','9.11'],sourcePages:[89,90,91,92,93,94,106,107],
      inputNormGraphNamespace:'commonY.primary.G',fixedRadialConstantGraphNamespace:'fixedRadial.G',actualSourceGraphNamespace:'pressure.G',
      samePrivateCurrent:true,allHigherInputNormsFromSameOriginalGenerator:true},
    domain:{actualSourceWindow:copy(current.band.window),sourceQDomain:copy(current.domain),
      s:['1/2','2'],eta:['-1','1'],X:['Xa','Xb'],deltaStar:'min(1,log(X/Xa),log(Xb/X))',
      RPositiveEnvelope:['sqrt(Xa)','2sqrt(Xb)'],referenceS:'ell_ref^2',epsilon:'Q_ref^h',
      frozenReferenceBandAndCopies:true,noLargerWindowInferred:true,closedEtaOneSided:true},
    sourceBinding,fixedConstantCopy:{roots:copied.roots,identities:copied.identities,work:copied.work,
      fromNodeCount:FG.nodes.length,toStart:normStart,parameterExpressionSHA256:copied.parameterExpressionSHA256,
      sourceNumericalValuesUsed:false,sourceClassAuthorityComesFromPrivateInputAndOperator:true},
    coefficientBounds:{graphNamespace:'norm',R:coefficientR,B,dr,kappa,rho,radialPowerBody,rows:coefficientRows,
      proof:copy(radial.change.proofs),originalSourceUpperPhaseBound:phase.bound,
      physicalFastDerivative:'partial_R^j a = M * partial_R^(j+1) R^d_r',
      epsilonLoss:'one factor epsilon^(-kappa_s), independent of output derivative order'},
    inputRows:copy(inputRows),grRows,rows,pendingCutoffGains,checks,
    scope:{actualCompleteGrInputNormsConstructed:true,actualInitialGrMOneMinusKappaCertified:true,
      actualWholePAndCenteredSourceNormsConstructed:true,actualFullShiftedRadialPressureNormsConstructed:true,
      actualUnimprovedA0NormsConstructed:true,actualPressureRadialIdentityNormsConstructed:true,
      actualFiniteOutputOrder:m,actualFiniteIBPOrder:p,actualAvailableCovarianceOrder:commonY.scope.actualFiniteDerivativeOrder,
      allFiniteOrdersBySameOriginalNormGenerator:true,allIntegerDerivativeGraphsLiterallyExecuted:false,
      actualCutoffAllOrdersFlatnessCertified:false,actualPostTemporalFiveMapClassCertified:false,
      actualCompleteInitialN6TupleClassCertified:false,allFiniteIterationStagesClassCertified:false,
      completeN6:false,newLeanKernelProof:false}};
  const norm=snapshot(G),sourceCount=PG.nodes.length;
  seals.set(result,{G,PG,commonY,radial,radialAttachment,pressure,current,norm,
    sourceStart,sourceCount,sourceNodes:canonicalStringify(PG.nodes.slice(sourceStart,sourceCount)),
    sourceDefinitions:PG.captureFunctionDefinitions(),record:canonicalStringify(record(result))});
  context.onProgress?.({stage:'actual-full-gr-P-T0-pressure-class-sealed',nodeCount:G.nodes.length,sourceNodes:PG.nodes.length,
    outputOrder:m,ibpOrder:p,actualCovarianceOrder:commonY.scope.actualFiniteDerivativeOrder});
  return result;
}

export function assertGlobalRadialPressureClass(p){
  const s=seals.get(p);if(!s||s.G!==p.G||s.PG!==p.pressure?.G||s.commonY!==p.commonY||s.radial!==p.radial||
    s.radialAttachment!==p.radialAttachment||s.pressure!==p.pressure||s.current!==p.current||
    s.record!==canonicalStringify(record(p))||!unchanged(p.G,s.norm)||
    s.sourceNodes!==canonicalStringify(s.PG.nodes.slice(s.sourceStart,s.sourceCount))||
    !s.PG.functionDefinitionsUnchanged(s.sourceDefinitions))
    fail('Use the unchanged private same-source full gr/P/T0 norm composition.');
  assertGlobalCommonYCovarianceClass(p.commonY);assertOriginalRadialClassMajorants(p.radial);
  assertPressureRadialClassOperator(p.radialAttachment);return true;
}

/** A compact dependent program: the exact parent programs are linked by
 * their computed hashes, while only the complete appended norm/source
 * tables are repeated here. Integer roots denote expressions, not values.
 */
export async function globalRadialPressureClassCertificate(p){
  assertGlobalRadialPressureClass(p);const s=seals.get(p),
    parent=await globalCommonYCovarianceClassCertificate(p.commonY),
    fixed=await originalRadialClassMajorantCertificate(p.radial),
    program={schema:'MathScope.N6.ActualGlobalRadialPressureClassProgram/1',
      parentGraph:parent.graph,fixedOperatorGraph:fixed.graph,record:record(p),
      norm:{start:parent.graph.nodeCount,nodes:p.G.nodes.slice(parent.graph.nodeCount,s.norm.count),definitions:s.norm.definitions},
      pressure:{start:s.sourceStart,nodes:s.PG.nodes.slice(s.sourceStart,s.sourceCount),definitions:s.sourceDefinitions,
        parentPressureGraph:parent.parents.pressure}},encoded=canonicalStringify(program);
  return {...record(p),parents:{commonY:parent.graph,pressure:parent.parents.pressure,fixedRadial:fixed.graph},program,
    graph:{sha256:await sha256(encoded),normNodeCount:s.norm.count,pressureNodeCount:s.sourceCount,
      canonicalBytes:new TextEncoder().encode(encoded).length,requiresCompleteAuthenticatedParentPrograms:true},
    integerRootsAreExactSourceExpressions:true,numericalNormValuesComputed:false,
    execution:'ACTUAL_SAME_CURRENT_FULL_GR_P_T0_CLASS_COMPOSITION'};
}
