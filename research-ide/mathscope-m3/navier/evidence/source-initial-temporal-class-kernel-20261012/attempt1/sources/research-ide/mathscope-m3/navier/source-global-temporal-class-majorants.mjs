/** Actual initial temporal update with complete source seminorm inputs.
 *
 * Both actual E components, the exact Fourier inverse, full T1 potential,
 * A1 cutoff error, radial epsilon gain and slow-time residual are bound to
 * the same private original current. Operator constants alone grant none
 * of these input class bounds.
 */
import {assertGlobalTemporalInverse,globalTemporalInverseCertificate} from './source-global-temporal.mjs';
import {assertGlobalInitialResidualClass,globalInitialResidualClassCertificate} from './source-global-initial-residual-class.mjs';
import {assertOriginalFourierClassMajorants,originalFourierClassMajorantCertificate,
  attachOriginalTemporalClassOperator,assertOriginalTemporalClassOperator} from './source-fourier-class-majorants.mjs';
import {assertOriginalRadialClassMajorants,originalRadialClassMajorantCertificate,
  attachGlobalPressureRadialClassOperator,assertPressureRadialClassOperator} from './source-radial-class-majorants.mjs';
import {copyClosedOriginalSourceConstants} from './source-pressure-class-kernel.mjs';
import {originalTemporalClassDerivativeDemand,originalCommonCiUpperFactorization,
  originalRawTemporalCutoffMajorant,composeOriginalTemporalClassRows} from './source-temporal-class-kernel.mjs';
import {originalFullMeanOperators} from './source-full-mean-equations.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),copy=x=>structuredClone(x),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},CHUNK=4096,
  snapshot=G=>({count:G.nodes.length,source:canonicalStringify(G.source),definitions:G.captureFunctionDefinitions(),
    chunks:Array.from({length:Math.ceil(G.nodes.length/CHUNK)},(_,j)=>canonicalStringify(G.nodes.slice(j*CHUNK,(j+1)*CHUNK)))}),
  unchanged=(G,s)=>G.nodes.length>=s.count&&canonicalStringify(G.source)===s.source&&G.functionDefinitionsUnchanged(s.definitions)&&
    s.chunks.every((x,j)=>x===canonicalStringify(G.nodes.slice(j*CHUNK,Math.min(s.count,(j+1)*CHUNK)))),
  record=p=>({schema:p.schema,request:p.request,demand:p.demand,source:p.source,domain:p.domain,sourceBinding:p.sourceBinding,
    fixedConstantCopies:p.fixedConstantCopies,inputRows:p.inputRows,desiredRows:p.desiredRows,radialRows:p.radialRows,
    productProgram:p.productProgram,rows:p.rows,cutoffGains:p.cutoffGains,pendingCutoffGains:p.pendingCutoffGains,
    checks:p.checks,scope:p.scope});

function requestOf(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','ibpOrder','maxWork'].includes(k)))
    fail('Choose finite output and IBP orders and a work budget, without supplying source norms or completion flags.','INVALID_INPUT');
  const request={order:input.order??0,ibpOrder:input.ibpOrder??0,maxWork:input.maxWork??200000},
    demand=originalTemporalClassDerivativeDemand({order:request.order,ibpOrder:request.ibpOrder});
  if(!Number.isSafeInteger(request.maxWork)||request.maxWork<1||BigInt(demand.requiredResidualPairOrder+2)**2n>BigInt(request.maxWork))
    fail('The complete original temporal class demand exceeds its finite work budget.','RESOURCE_LIMIT');
  return {request,demand};
}

export function attachGlobalTemporalClass(temporal,initialResidualClass,fourier,radial,input={},context={}){
  assertGlobalTemporalInverse(temporal);assertGlobalInitialResidualClass(initialResidualClass);
  assertOriginalFourierClassMajorants(fourier);assertOriginalRadialClassMajorants(radial);
  const {request,demand}=requestOf(input),m=request.order,p=request.ibpOrder,
    G=initialResidualClass.G,PG=temporal.G,pressure=temporal.pressure,current=pressure.current,
    {R,Z,T,Y,epsilon,ci}=pressure.geometry,
    inputRows=initialResidualClass.rows.slice(0,demand.requiredResidualPairOrder+1),
    desiredCount=demand.requiredDesiredVelocityOrder+1,radialCount=m+2,
    requiredPole=inputRows.length?Math.max(...inputRows.flatMap(r=>Object.values(r.fields).map(f=>f.pole))):Infinity,
    fullNorm=f=>f&&Number.isSafeInteger(f.constant)&&!!G.nodes[f.constant]&&G.freeCoordinates(f.constant).size===0&&
      Number.isSafeInteger(f.power)&&f.power>=0&&Number.isSafeInteger(f.pole)&&f.pole>=0&&
      f.epsilonExponent==='1-kappa_s'&&f.weight==='zeta'&&f.gaussian==='1';
  if(pressure!==initialResidualClass.pressure||initialResidualClass.pressureClass.commonY.primary.current!==current)
    fail('The complete E norms and temporal inverse must come from the same actual private pressure/current.');
  if(inputRows.length!==demand.requiredResidualPairOrder+1||inputRows.some((r,j)=>r.order!==j||!fullNorm(r.fields.Etheta)||!fullNorm(r.fields.Ez)))
    fail('Generate the complete same-current Etheta/Ez norm pair through order '+demand.requiredResidualPairOrder+
      ' before the full temporal velocity/potential/slow-time class attachment.','RESOURCE_LIMIT');
  if(fourier.request.order<demand.requiredFixedFourierOrder||fourier.operators.temporal.rows.length<desiredCount||
    radial.request.order<demand.requiredFixedRadialOutputOrder||radial.request.ibpOrder<demand.fixedRadialIBPOrder||
    radial.request.pole<requiredPole||radial.cutoff.rows.length<demand.requiredCutoffDerivativeOrder+1)
    fail('Generate all requested original fixed Fourier and T1/A1 constants at the actual input pole '+requiredPole+'.','RESOURCE_LIMIT');
  if([fourier,radial].some(x=>x.source.parameterExpressionSHA256!==initialResidualClass.pressureClass.source.parameterExpressionSHA256||
    x.source.paperSHA256!==initialResidualClass.pressureClass.source.paperSHA256))
    fail('All source seminorm and operator programs must retain the same original paper and exact parameters.');

  const normStart=G.nodes.length,sourceStart=PG.nodes.length,q=(n,d=1)=>G.q(n,d),
    operatorAttachment=attachOriginalTemporalClassOperator(temporal,fourier),
    radialAttachment=attachGlobalPressureRadialClassOperator(pressure,radial),
    ciUpper=originalCommonCiUpperFactorization(PG,{ell:current.band.coordinates.ell}),
    e1=radial.rows.find(r=>r.e===1),change=radial.change.exponents.find(r=>r.e===1);
  if(!e1||!change||e1.orders.length<radialCount||change.throughOrder.length<desiredCount)
    fail('Retain the original e=1 potential operator, every requested mixed change-of-coordinate constant and its whole remainder.','RESOURCE_LIMIT');
  const fourierRoots=fourier.operators.temporal.rows.slice(0,desiredCount).map(r=>r.constant),
    radialRoots=[radial.phase.kappa,radial.phase.rho,radial.weight.wholeIntegralConstant,radial.geometry.middleZetaInverse,
      ...e1.orders.slice(0,radialCount).flatMap(r=>[r.primitiveConstant,...r.remainderRows.slice(0,p).map(a=>a.constant)]),
      ...change.throughOrder.slice(0,radialCount).flatMap(r=>[r.outputPrefactor,r.outputComposition,r.transformedSource]),
      ...radial.cutoff.rows.slice(0,m+3).map(r=>r.bound)],
    fcopy=copyClosedOriginalSourceConstants(fourier.G,G,[...new Set(fourierRoots)],{maxWork:request.maxWork,name:'actual_temporal_fourier_norm'}),
    rcopy=copyClosedOriginalSourceConstants(radial.G,G,[...new Set(radialRoots)],{maxWork:request.maxWork,name:'actual_temporal_T1_norm'}),
    map=(c,id)=>{const value=c.mapping.get(id);if(value===undefined)fail('A complete original operator constant is missing from the norm graph copy.');return value;},
    fat=id=>map(fcopy,id),rat=id=>map(rcopy,id),kappa=rat(radial.phase.kappa),rho=rat(radial.phase.rho),
    desiredRows=Array.from({length:desiredCount},(_,j)=>{
      context.checkCancelled?.();const op=fourier.operators.temporal.rows[j],source=inputRows[j+4],
        bound=f=>({...copy(f),constant:G.mul(fat(op.constant),f.constant),power:f.power+op.addedSPower,
          actualInputDerivativeOrder:j+4,operatorGraphNamespace:'norm',completeOriginalInverse:true});
      if(op.order!==j||op.inputOrder!==j+4||op.addedSPower!==1)
        fail('The original temporal operator lost its complete four-extra-derivative input and one S factor.');
      return {order:j,v:bound(source.fields.Etheta),gammaDesired:bound(source.fields.Ez),
        inputRoots:copy(initialResidualClass.actualResidualRoots),inputNorms:copy(source.fields),
        operatorConstant:fat(op.constant),zeroHaarMeanAtEverySlowAndRadialPoint:true};
    }),radialRows=Array.from({length:radialCount},(_,j)=>{
      const c=change.throughOrder[j],raw=originalRawTemporalCutoffMajorant(G,{order:j,
        outputPrefactor:rat(c.outputPrefactor),outputComposition:rat(c.outputComposition),
        cutoffDerivative:rat(radial.cutoff.rows[j+1].bound),wholeIntegral:rat(radial.weight.wholeIntegralConstant),
        middleZetaInverse:rat(radial.geometry.middleZetaInverse),transformedSource:rat(c.transformedSource)});
      return {order:j,e:1,primitiveConstant:rat(e1.orders[j].primitiveConstant),rawCutoffConstant:raw.constant,rawCutoffProof:raw};
    }),productProgram=composeOriginalTemporalClassRows(G,{order:m,desiredRows,radialRows}),rows=productProgram.rows,
    cutoffGains=Array.from({length:radialCount},(_,j)=>({order:j,rows:e1.orders[j].remainderRows.slice(0,p).map(a=>{
      const inputOrder=a.demand.flatRemainderInputOrder,f=desiredRows[inputOrder].gammaDesired,
        exactSPower=G.add(q(f.power),G.mul(q(a.ibpOrder),rho)),power=f.power+a.ibpOrder,
        epsilonExponent=G.add(G.sub(G.one,kappa),G.mul(q(a.ibpOrder),kappa));
      if(!Number.isSafeInteger(power))fail('The actual source class degree exceeds its finite representation.','RESOURCE_LIMIT');
      return {ibpOrder:a.ibpOrder,desiredInputOrder:inputOrder,actualResidualInputOrder:inputOrder+4,
        constant:G.mul(rat(a.constant),f.constant),power,exactSPower,epsilonExponent,
        epsilonExponentFormula:'1-kappa_s+'+a.ibpOrder+'*kappa_s',pole:radial.request.pole,weight:'zeta',
        wholeWeightedHaarMomentZero:true,allSourceDerivativesOfZeroMomentRetained:true,
        inputNorm:copy(f),sourceGraphNamespace:'temporal.G',positiveGainApplied:true,
        integerPowerWeakening:'0<rho_g<1 and S_ref>=1.'};
    })})),{N}=originalFullMeanOperators(PG,pressure.geometry),
    potential=temporal.potential,actualA=PG.neg(potential.cutoffRemainder),actualFastCutoff=PG.mul(ci,N(actualA)),
    actualGammaFromFTC=potential.explicitRadialDerivative.realizedGammaFromFTC,
    actualRoots={...copy(potential.velocity),gammaDesired:potential.gammaDesired,psi:potential.psi,
      cutoffA1:potential.cutoffRemainder,slowTimeAngular:potential.slowTime.angular,
      slowTimeAxial:potential.slowTime.axial,fastTimeAxialCutoff:actualFastCutoff},
    sourceBinding={graphNamespace:'temporal.G',actualInputResidual:copy(initialResidualClass.actualResidualRoots),
      exactFourierSources:Object.fromEntries(Object.entries(temporal.inverses).map(([k,v])=>[k,{system:v.system,body:v.body,exact:v.exact,
        originalHaarMean:v.actualHaarMean,zeroMode:v.exactZeroMode,finiteSumReplacesExactLimit:v.finiteSumReplacesExactLimit}])),
      actualRoots,actualGammaFromFTC,potential:copy(potential),ciUpper,
      fixedFourierBinding:{...operatorAttachment,G:null,temporal:null,operator:null},
      fixedRadialGeometryBinding:{...radialAttachment,G:null,input:null,operator:null},
      weightedZeroMoment:{body:potential.weighted,value:PG.zero,e:1,
        proof:'At every R,Z,T the complete exact gamma_d has zero normalized Haar mean. Fubini gives integral R*Haar(gamma_d)dR=0; every fixed slow derivative is the same exact zero identity. The original translated T1 potential preserves that average.',
        actualSourceInverseZeroMode:temporal.inverses.z.exactZeroMode,numericallyEstimatedAsZero:false},
      physicalRealization:'Delta beta=-epsilon*partial_Z T1(gamma_d), Delta gamma=gamma_d-A1(gamma_d).',
      unchangedBackgroundResidual:'The original E_B is retained separately from these exact mean-increment residuals; it is not replaced by zero.'},
    pendingOrder=Math.max(1,p+1),pendingDemand=originalTemporalClassDerivativeDemand({order:m,ibpOrder:pendingOrder}),
    pendingCutoffGains={nextIBPOrder:pendingOrder,demand:pendingDemand,
      actualAvailableResidualOrder:initialResidualClass.rows.length-1,
      sourceRowsAvailable:initialResidualClass.rows.length>pendingDemand.requiredResidualPairOrder,
      appliedByThisRequest:false,allOrdersFlatnessInferredFromFiniteRequest:false},
    checks=[
      {id:'same-private-complete-E-pair-and-temporal-current',pass:pressure===initialResidualClass.pressure&&
        temporal.inverses.theta.body===initialResidualClass.actualResidualRoots.Etheta&&
        temporal.inverses.z.body===initialResidualClass.actualResidualRoots.Ez&&operatorAttachment.checks.every(c=>c.pass)},
      {id:'all-requested-complete-source-class-rows-generated',pass:inputRows.length===demand.requiredResidualPairOrder+1&&inputRows.every((r,j)=>r.order===j&&fullNorm(r.fields.Etheta)&&fullNorm(r.fields.Ez))},
      {id:'literal-both-desired-ci-inverse-velocities',pass:potential.inverseTheta===temporal.inverses.theta.exact&&potential.inverseZ===temporal.inverses.z.exact&&
        potential.velocity.v===PG.neg(PG.div(temporal.inverses.theta.exact,ci))&&potential.gammaDesired===PG.neg(PG.div(temporal.inverses.z.exact,ci))},
      {id:'literal-full-original-T1-body-shift-and-cutoff',pass:potential.weighted===PG.mul(R,potential.gammaDesired)&&potential.integrals.body===potential.weighted&&
        potential.integrals.originalRadialPrimitive===pressure.geometry.radialPrimitive&&
        same(potential.integrals.shiftedY,Y.map((y,j)=>PG.add(y,PG.mul(potential.integrals.shift,pressure.geometry.vr[j]))))&&
        radialAttachment.checks.every(c=>c.pass)&&potential.checks.every(c=>c.pass)&&potential.cutoffRemainderDeclaredZero===false},
      {id:'literal-radial-epsilon-and-retained-slow-time-terms',pass:potential.velocity.beta===PG.neg(PG.mul(epsilon,PG.derivative(potential.psi,Z)))&&
        potential.slowTime.angular===PG.neg(PG.mul(epsilon,PG.derivative(potential.velocity.v,T)))&&
        potential.slowTime.axial===PG.neg(PG.mul(epsilon,PG.derivative(potential.velocity.gamma,T)))&&potential.slowTimeTermsRetained},
      {id:'same-original-ci-upper-and-two-time-direction-components',pass:ciUpper.identity.pass&&ciUpper.index===pressure.geometry.commonIndex&&
        ciUpper.baseEll===pressure.geometry.referenceBaseEll&&same(pressure.geometry.vt,[PG.sub(PG.sqrt(PG.q(2)),PG.one),PG.one])},
      {id:'actual-zero-mode-and-complete-weighted-mean-identity',pass:Object.values(temporal.inverses).every(x=>x.exactZeroMode===PG.zero&&!x.finiteSumReplacesExactLimit)&&
        temporal.periodicity.checks.every(c=>c.pass)&&potential.zeroMeanProofRequiresSourceInverse},
      {id:'all-source-only-constants-copied-completely',pass:[fcopy,rcopy].every(c=>c.allCopiedRootsClosed&&c.allDefiningIntegrandsAndEndpointsRetained)&&
        rows.every(r=>Object.values(r.fields).every(f=>G.freeCoordinates(f.constant).size===0))},
      {id:'positive-IBP-gains-use-the-full-required-actual-input-order',pass:cutoffGains.every(r=>r.rows.length===p&&r.rows.every(a=>a.actualResidualInputOrder<=demand.requiredResidualPairOrder))},
      {id:'full-potential-cutoff-and-fast-and-slow-remainders-retained',pass:rows.every(r=>r.fullGammaIsDesiredMinusActualA1&&!r.rawCutoffDeclaredZero)&&
        productProgram.allFullPotentialAndSlowTimeTermsRetained&&!productProgram.flatA1InferredFromUnimprovedNorm}
    ];
  if(checks.some(c=>!c.pass))fail('Actual complete temporal class attachment failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  const fixedCopy=(c,graph)=>({roots:c.roots,identities:c.identities,work:c.work,fromNodeCount:graph.nodes.length,
    parameterExpressionSHA256:c.parameterExpressionSHA256,allCopiedRootsClosed:true,sourceNumericalValuesUsed:false}),
    result={schema:'MathScope.N6.ActualGlobalTemporalClass/1',G,temporal,initialResidualClass,fourier,radial,
      operatorAttachment,radialAttachment,request,demand,
      source:{paperSHA256:temporal.source.paperSHA256,parameterExpressionSHA256:temporal.source.parameterExpressionSHA256,
        sourcePages:[91,92,93,95,96],equations:['8.8','8.14','8.19','8.20','8.21','8.22','8.23'],
        actualSourceGraphNamespace:'temporal.G',inputAndOutputNormGraphNamespace:'initialResidualClass.G',
        samePrivateCompleteInitialCurrent:true},
      domain:{sourceWindow:copy(current.band.window),sourceQDomain:copy(current.domain),referenceS:'ell_ref^2',
        deltaStar:'min(1,log(X/Xa),log(Xb/X))',frozenReferenceAndOriginalCommonIndex:true,sourceWindowEnlarged:false},
      sourceBinding,fixedConstantCopies:{fourier:fixedCopy(fcopy,fourier.G),radial:fixedCopy(rcopy,radial.G)},
      inputRows:copy(inputRows),desiredRows,radialRows,productProgram,rows,cutoffGains,pendingCutoffGains,checks,
      scope:{actualCompleteInputEClassesApplied:true,actualDesiredTemporalVelocityNormsConstructed:true,
        actualFullT1PotentialAndVelocityNormsConstructed:true,actualRadialVelocityExtraEpsilonCertified:true,
        actualUnimprovedA1AndFastAndSlowResidualNormsConstructed:true,actualFiniteOutputOrder:m,actualFiniteIBPOrder:p,
        actualInputResidualDerivativeOrder:demand.requiredResidualPairOrder,
        allFiniteOrdersBySameOriginalNormGenerator:true,allIntegerDerivativeGraphsLiterallyExecuted:false,
        actualAllOrdersTemporalCutoffFlatnessCertified:false,actualUpdatedPressureClassCertified:false,
        actualFreshPostTemporalPJClassesCertified:false,actualFiveMapAfterTemporalClassesCertified:false,
        unchangedBackgroundFlatResidualRetained:true,actualCompleteInitialN6TupleClassCertified:false,
        allFiniteIterationStagesClassCertified:false,completeN6:false,newLeanKernelProof:false}};
  seals.set(result,{G,PG,temporal,initialResidualClass,fourier,radial,operatorAttachment,radialAttachment,
    normStart,sourceStart,norm:snapshot(G),source:snapshot(PG),record:canonicalStringify(record(result))});
  context.onProgress?.({stage:'actual-complete-temporal-class-sealed',normNodes:G.nodes.length,sourceNodes:PG.nodes.length,
    outputOrder:m,inputResidualOrder:demand.requiredResidualPairOrder,ibpOrder:p});return result;
}

export function assertGlobalTemporalClass(p){
  const s=seals.get(p);if(!s||s.G!==p.G||s.PG!==p.temporal?.G||s.temporal!==p.temporal||s.initialResidualClass!==p.initialResidualClass||
    s.fourier!==p.fourier||s.radial!==p.radial||s.operatorAttachment!==p.operatorAttachment||s.radialAttachment!==p.radialAttachment||
    s.record!==canonicalStringify(record(p))||!unchanged(p.G,s.norm)||!unchanged(p.temporal.G,s.source))
    fail('Use the unchanged private complete initial temporal class attachment.');
  assertGlobalInitialResidualClass(p.initialResidualClass);assertOriginalTemporalClassOperator(p.operatorAttachment);
  assertPressureRadialClassOperator(p.radialAttachment);return true;
}

export async function globalTemporalClassCertificate(p){
  assertGlobalTemporalClass(p);const s=seals.get(p),parent=await globalInitialResidualClassCertificate(p.initialResidualClass),
    temporal=await globalTemporalInverseCertificate(p.temporal),fourier=await originalFourierClassMajorantCertificate(p.fourier),
    radial=await originalRadialClassMajorantCertificate(p.radial);
  if(!Number.isSafeInteger(parent.graph.normNodeCount)||parent.graph.normNodeCount>s.normStart)
    fail('The authentic parent norm program must retain its exact complete node boundary.');
  const program={schema:'MathScope.N6.ActualGlobalTemporalClassProgram/1',record:record(p),
    parentGraphs:{initialResidual:parent.graph,temporal:temporal.graph,fourier:fourier.graph,radial:radial.graph},
    norm:{start:parent.graph.normNodeCount,nodes:p.G.nodes.slice(parent.graph.normNodeCount,s.norm.count),definitions:s.norm.definitions},
    actualSource:{start:temporal.graph.nodeCount,nodes:s.PG.nodes.slice(temporal.graph.nodeCount,s.source.count),definitions:s.source.definitions}},
    encoded=canonicalStringify(program);
  return {...record(p),parents:program.parentGraphs,program,
    graph:{sha256:await sha256(encoded),normNodeCount:s.norm.count,sourceNodeCount:s.source.count,
      canonicalBytes:new TextEncoder().encode(encoded).length,requiresCompleteAuthenticatedParentPrograms:true},
    integerRootsAreExactSourceExpressions:true,numericalNormValuesComputed:false,
    execution:'ACTUAL_COMPLETE_E_SOURCE_CLASSES_THROUGH_ORIGINAL_FOURIER_T1_AND_A1_OPERATORS'};
}
