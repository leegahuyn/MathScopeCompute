/** Complete actual initial Etheta/Ez class composition.
 *
 * Only privately bound same-current covariance, original background stress
 * and full shifted pressure norms are accepted. The unchanged background
 * flat residual and nonzero angular equations remain separate operands.
 */
import {assertGlobalRadialPressureClass,globalRadialPressureClassCertificate}
  from './source-global-pressure-class-majorants.mjs';
import {assertGlobalBackgroundClass,globalBackgroundClassCertificate}
  from './source-background-class-majorants.mjs';
import {globalCurrentPressureCertificate} from './source-global-pressure.mjs';
import {originalInitialMeanResidualDemand,exactCompleteInitialMeanResidual,initialMeanResidualMajorants}
  from './source-initial-residual-class-kernel.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),copy=x=>structuredClone(x),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),
  fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},CHUNK=4096,
  snapshot=G=>({count:G.nodes.length,source:canonicalStringify(G.source),definitions:G.captureFunctionDefinitions(),
    chunks:Array.from({length:Math.ceil(G.nodes.length/CHUNK)},(_,j)=>canonicalStringify(G.nodes.slice(j*CHUNK,(j+1)*CHUNK)))}),
  unchanged=(G,s)=>G.nodes.length>=s.count&&canonicalStringify(G.source)===s.source&&G.functionDefinitionsUnchanged(s.definitions)&&
    s.chunks.every((x,j)=>x===canonicalStringify(G.nodes.slice(j*CHUNK,Math.min(s.count,(j+1)*CHUNK)))),
  record=p=>({schema:p.schema,request:p.request,demand:p.demand,source:p.source,domain:p.domain,
    sourceBinding:p.sourceBinding,actualResidualRoots:p.actualResidualRoots,inputRows:p.inputRows,rows:p.rows,
    checks:p.checks,scope:p.scope});

export function attachGlobalInitialResidualClass(pressureClass,background,input={},context={}){
  assertGlobalRadialPressureClass(pressureClass);assertGlobalBackgroundClass(background);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['order','maxWork'].includes(k)))
    fail('Choose finite output order and work budget only; source fields, norms and completion flags are not inputs.','INVALID_INPUT');
  const request={order:input.order??0,maxWork:input.maxWork??200000},
    demand=originalInitialMeanResidualDemand({order:request.order}),m=request.order,
    pressure=pressureClass.pressure,current=pressure.current,commonY=pressureClass.commonY,
    G=pressureClass.G,PG=pressure.G;
  if(!Number.isSafeInteger(request.maxWork)||request.maxWork<1||BigInt(m+2)**2n>BigInt(request.maxWork))
    fail('The full initial residual norm composition exceeds its explicit finite budget.','RESOURCE_LIMIT');
  if(background.G!==G||background.primary!==commonY.primary||background.current!==current||
    pressureClass.current!==current||background.source.parameterExpressionSHA256!==pressureClass.source.parameterExpressionSHA256)
    fail('Use the same actual private primary current and the same source norm graph for every operand.');
  const valid=(f,exponent)=>f&&Number.isSafeInteger(f.constant)&&!!G.nodes[f.constant]&&G.freeCoordinates(f.constant).size===0&&
    Number.isSafeInteger(f.power)&&f.power>=0&&Number.isSafeInteger(f.pole)&&f.pole>=0&&
    f.epsilonExponent===exponent&&f.weight==='zeta',
    inputRows=Array.from({length:m+1},(_,j)=>({order:j,covarianceOrder:j+1,pressureOrder:j+1,stressOrder:j+1,
      covariance:commonY.bounds.rows[j+1]?.fields.fullCovariance,
      pressure:pressureClass.rows[j+1]?.pressure,stress:background.rows[j+1]?.fullStress}));
  if(pressureClass.request.order<demand.requiredPressureOrder||background.request.order<demand.requiredBackgroundClassOrder||
    commonY.scope.actualFiniteDerivativeOrder<demand.requiredCommonYCovarianceOrder||
    inputRows.some(r=>!valid(r.covariance,'1')||!valid(r.pressure,'1-kappa_s')||!valid(r.stress,'1')))
    fail('Generate the actual complete pressure and original stress through order '+(m+1)+
      ', and the same-current common-Y covariance through order '+(m+2)+'.','RESOURCE_LIMIT');
  const normStart=G.nodes.length,sourceStart=PG.nodes.length,{geometry}=pressure,
    exact=exactCompleteInitialMeanResidual(PG,{R:geometry.R,Z:geometry.Z,T:geometry.T,Y:geometry.Y,
      epsilon:geometry.epsilon,radialFast:geometry.radialFast,W:pressure.covariance.fullAngularMean,
      stress:pressure.residual.fullOriginalStress,pressureZ:pressure.pressure.slowZDerivative}),
    coefficient=pressureClass.coefficientBounds,
    rows=inputRows.map((r,j)=>{
      context.checkCancelled?.();const bound=initialMeanResidualMajorants(G,{order:j,radiusBase:coefficient.B,
        directPowerDerivativeBounds:coefficient.rows.map(x=>x.bound),covarianceNorm:r.covariance.constant,
        stressNorm:r.stress.constant,pressureDerivativeNorm:r.pressure.constant,maxWork:request.maxWork}),
        power=Math.max(r.covariance.power,r.pressure.power,r.stress.power),
        pole=Math.max(r.covariance.pole,r.pressure.pole,r.stress.pole);
      return {order:j,bound,fields:Object.fromEntries(Object.entries(bound.fields).map(([name,f])=>[name,{
        constant:f.constant,power,pole,epsilonExponent:'1-kappa_s',weight:'zeta',gaussian:'1',
        actualSourceRoot:exact.roots[name],sourceGraphNamespace:'pressure.G',
        derivativeConvention:'All mixed derivatives of total order <= '+j+' in the same independent R,Z,T,Y0,Y1 chart.',
        originalPressureExponent:name==='Ez'?'2-kappa_s':null,
        exactLowerOrderAdjustment:'S_ref>=1 and delta_*=min(1,da,db)<=1.'}]))};
    }),sourceBinding={graphNamespace:'pressure.G',exact,fullCovariance:copy(pressure.covariance.fullAngularMean),
      fullOriginalStress:copy(pressure.residual.fullOriginalStress),fullPressure:pressure.pressure.value,
      actualPressureZ:pressure.pressure.slowZDerivative,actualPressureZIntegral:copy(pressure.pressure.slowZIntegrals),
      actualPressureCutoffRemainder:pressure.pressure.cutoffRemainder,actualRadialForce:pressure.radial.gr,
      originalBackgroundFlatResidualSeparate:pressure.residual.backgroundFlatResidualSeparate,
      originalNonzeroAngularResidualSeparate:pressure.residual.nonzeroAngularWaveResidualSeparate,
      completeOriginalStressSource:copy(background.binding),
      fastRadialPhaseUpper:copy(pressureClass.sourceBinding.phase),
      pressureDerivativeMeaning:'The exact Z derivative of T0(g_r-rho P), including the original cutoff derivative and full translated source.'},
    checks=[
      {id:'same-private-pressure-background-and-common-Y-norm-graph',pass:background.G===G&&background.primary===commonY.primary&&background.current===current},
      {id:'every-required-actual-covariance-stress-and-pressure-order',pass:inputRows.length===m+1&&inputRows.every(r=>
        valid(r.covariance,'1')&&valid(r.stress,'1')&&valid(r.pressure,'1-kappa_s'))},
      {id:'literal-complete-source-Etheta-and-Ez',pass:exact.roots.Etheta===pressure.residual.Etheta&&exact.roots.Ez===pressure.residual.Ez},
      {id:'both-original-stresses-and-all-fast-derivatives-retained',pass:same(exact.stress,background.binding.actualFullStress)&&
        same(exact.stress,current.mean.residual.fullOriginalStress)&&exact.originalStressAuxiliaryIndependent&&
        exact.rows.every(r=>r.terms.stressFastRadial===PG.zero)},
      {id:'full-shifted-pressure-Z-derivative-never-Haar-substituted',pass:exact.pressureZ===pressure.pressure.slowZDerivative&&
        pressure.pressure.slowZIntegrals.body===PG.derivative(pressure.pressure.source,geometry.Z)&&
        pressure.pressure.slowZIntegrals.endpointCheck.pass&&!pressure.pressure.cutoffRemainderDeclaredZero},
      {id:'original-both-torus-directions-and-one-radial-loss',pass:same(exact.vr,geometry.vr)&&pressureClass.sourceBinding.phase.identity.pass&&
        rows.every(r=>r.bound.outputEpsilonExponent==='1-kappa_s'&&r.bound.radial.originalLNorm===G.sqrt(G.q(2)))},
      {id:'pressure-keeps-extra-epsilon-before-weaker-common-class',pass:rows.every(r=>r.bound.originalPressureContributionExponent==='2-kappa_s'&&
        r.fields.Ez.originalPressureExponent==='2-kappa_s')},
      {id:'every-resulting-norm-is-a-complete-closed-source-expression',pass:rows.every(r=>Object.values(r.fields).every(f=>G.freeCoordinates(f.constant).size===0))},
      {id:'unchanged-flat-background-and-angular-equations-remain-separate',pass:pressure.residual.backgroundFlatResidualSeparate&&
        pressure.residual.nonzeroAngularWaveResidualSeparate&&background.scope.unchangedBackgroundFlatResidualRetained}
    ];
  if(checks.some(r=>!r.pass))fail('The complete actual initial residual class attachment failed: '+checks.filter(r=>!r.pass).map(r=>r.id).join(', '));
  const result={schema:'MathScope.N6.ActualGlobalInitialResidualClass/1',G,pressure,pressureClass,background,request,demand,
    source:{paperSHA256:pressureClass.source.paperSHA256,parameterExpressionSHA256:pressureClass.source.parameterExpressionSHA256,
      sourcePages:[89,90,91,106,107],equations:['8.3','8.5','8.8','8.9','9.11'],
      actualSourceGraphNamespace:'pressure.G',normGraphNamespace:'pressureClass.G',samePrivateCompleteInitialCurrent:true},
    domain:{sourceWindow:copy(current.band.window),sourceQDomain:copy(current.domain),
      referenceS:'ell_ref^2',deltaStar:'min(1,log(X/Xa),log(Xb/X))',originalQBigUnchanged:true},
    sourceBinding,actualResidualRoots:copy(exact.roots),inputRows:copy(inputRows),rows,checks,
    scope:{actualCompleteInitialEthetaEzNormsConstructed:true,actualFiniteDerivativeOrder:m,
      fullOriginalStressRetained:true,fullShiftedPressureDerivativeRetained:true,
      allFiniteOrdersBySameOriginalNormGenerator:true,allIntegerDerivativeGraphsLiterallyExecuted:false,
      unchangedBackgroundFlatResidualRetained:true,nonzeroAngularResidualClassCertified:false,
      actualTemporalClassApplied:false,actualFreshPostTemporalPJClassesCertified:false,
      actualCompleteInitialN6TupleClassCertified:false,allFiniteIterationStagesClassCertified:false,
      completeN6:false,newLeanKernelProof:false}};
  seals.set(result,{G,PG,pressure,pressureClass,background,normStart,sourceStart,norm:snapshot(G),source:snapshot(PG),record:canonicalStringify(record(result))});
  context.onProgress?.({stage:'actual-complete-initial-Etheta-Ez-class-sealed',order:m,normNodes:G.nodes.length,sourceNodes:PG.nodes.length});
  return result;
}

export function assertGlobalInitialResidualClass(p){
  const s=seals.get(p);if(!s||s.G!==p.G||s.PG!==p.pressure?.G||s.pressure!==p.pressure||s.pressureClass!==p.pressureClass||
    s.background!==p.background||s.record!==canonicalStringify(record(p))||!unchanged(p.G,s.norm)||!unchanged(p.pressure.G,s.source))
    fail('Use the unchanged private complete initial Etheta/Ez norm attachment.');
  assertGlobalRadialPressureClass(p.pressureClass);assertGlobalBackgroundClass(p.background);return true;
}

export async function globalInitialResidualClassCertificate(p){
  assertGlobalInitialResidualClass(p);const s=seals.get(p),parent=await globalRadialPressureClassCertificate(p.pressureClass),
    background=await globalBackgroundClassCertificate(p.background),pressure=await globalCurrentPressureCertificate(p.pressure),
    start=parent.graph.normNodeCount;
  if(!Number.isSafeInteger(start)||start>s.normStart)fail('The complete authentic parent norm boundary is missing.');
  const program={schema:'MathScope.N6.ActualGlobalInitialResidualClassProgram/1',record:record(p),
    parentGraphs:{pressureClass:parent.graph,background:background.graph,pressure:pressure.graph},
    norm:{start,nodes:p.G.nodes.slice(start,s.norm.count),definitions:s.norm.definitions},
    actualSource:{start:pressure.graph.nodeCount,nodes:s.PG.nodes.slice(pressure.graph.nodeCount,s.source.count),definitions:s.source.definitions}},
    encoded=canonicalStringify(program);
  return {...record(p),parents:program.parentGraphs,program,
    graph:{sha256:await sha256(encoded),normNodeCount:s.norm.count,sourceNodeCount:s.source.count,
      canonicalBytes:new TextEncoder().encode(encoded).length,requiresCompleteAuthenticatedParentPrograms:true},
    integerRootsAreExactSourceExpressions:true,numericalNormValuesComputed:false,
    execution:'ACTUAL_COMPLETE_INITIAL_E_PAIR_FROM_FULL_COMMON_Y_ORIGINAL_STRESS_AND_SHIFTED_PRESSURE_CLASSES'};
}
