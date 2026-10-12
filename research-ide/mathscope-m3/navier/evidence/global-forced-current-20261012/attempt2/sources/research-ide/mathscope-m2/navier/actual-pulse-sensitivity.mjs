/** Actual first slow sensitivity of the two original source pulses.
 * This advances the source-to-curl dependency without relabeling the generic
 * curl tests or claiming the full physical residual/flat-error package.
 */
import {prepareActualCovarianceOperator,assertActualCovarianceOperator} from './actual-covariance-source-operator.mjs';
import {ActualPulseSensitivityExpressions} from './actual-pulse-sensitivity-kernel.mjs';
import {actualPulseSensitivityMatrixBounds} from './actual-pulse-sensitivity-bounds.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap();
function requestOf(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','anchorOrder','ellExact','slowCoordinate','derivativeOrder','terms'].includes(k)))fail('INVALID_INPUT','Use only a source identity, band selector, first slow coordinate and finite display term count. Matrices, derivatives, bounds and completion flags are not caller inputs.');
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID;assertSourceProfile(sourceProfile);
  const slowCoordinate=input.slowCoordinate??'R',derivativeOrder=input.derivativeOrder??1,terms=input.terms??0;
  if(!['R','Z','T'].includes(slowCoordinate))fail('UNSUPPORTED','First ordinary slow R, Z and T partial derivatives are supported with frozen labels. Representative and label derivatives require separate contracts.');
  if(derivativeOrder!==1)fail('UNSUPPORTED','This additive source step certifies exactly one slow derivative, not higher or mixed orders.');
  if(!Number.isSafeInteger(terms)||terms<0)fail('INVALID_INPUT','The displayed term count is a nonnegative integer.');
  if(terms!==0)fail('RESOURCE_LIMIT','This bounded source release displays the zero-term approximant and its nonzero convergent tail. Positive-term source materialization exceeds the verified worker budget; it is not returned as a completed calculation.');
  if(input.ellExact!==undefined&&input.anchorOrder!==undefined)fail('INVALID_INPUT','Use one original integer band or one canonical anchor.');
  if(input.anchorOrder!==undefined)fail('RESOURCE_LIMIT','Canonical-anchor sensitivities are outside the verified worker budget of this release. Use the actual original band ellExact:1.');
  const ellExact=input.ellExact??'1';if(typeof ellExact!=='string'||!/^[0-9]+$/.test(ellExact)||ellExact.length>2048||BigInt(ellExact)<1n)fail('INVALID_INPUT','ellExact is a positive exact integer string.');
  if(BigInt(ellExact)!==1n)fail('RESOURCE_LIMIT','Only the actual original band ellExact:1 has a bounded source sensitivity runtime in this release. Other source bands are not replaced by band one.');
  return {sourceProfile,ellExact:'1',slowCoordinate,derivativeOrder,terms};
}
const liveData=r=>canonicalStringify({request:r.request,rows:r.rows,roots:r.roots,scope:r.scope,domain:r.domain,checks:r.checks});

export function prepareActualPulseSensitivityProgram(input={},context={}){
  const request=requestOf(input),{sourceProfile,slowCoordinate,terms}=request;
  const operator=prepareActualCovarianceOperator({sourceProfile,...(request.ellExact!==undefined?{ellExact:request.ellExact}:{anchorOrder:request.anchorOrder})},context);
  assertActualCovarianceOperator(operator);context.checkCancelled?.();
  const G=new ActualPulseSensitivityExpressions(operator.G,{maxNodes:3000000,checkCancelled:context.checkCancelled}),variable=operator.coordinates[slowCoordinate],v=operator.coordinates.v,rows=[];
  for(const family of operator.families){
    const bounds=actualPulseSensitivityMatrixBounds(G,operator,family,slowCoordinate),original=G.covarianceSystems[family.system];
    const system=G.definePulseFirstVariation({name:'ActualSourcePulseFirst_'+slowCoordinate+'_'+family.sign,variable:v,parameters:original.parameters,parameter:variable,matrix:original.matrix,initial:original.initial,left:G.zero,length:original.length,
      matrixNorm:bounds.matrixNorm,matrixDerivativeNorm:bounds.matrixDerivativeNorm,initialNorm:G.one,initialDerivativeNorm:G.zero,leftDerivativeNorm:G.zero});
    G.bindOriginalCovarianceVariation(family.system,system);
    const variation=G.pulseSensitivitySystems[system],wDerivative=family.w.map(x=>G.derivative(x,variable)),amplitudeDerivative=family.t.map(x=>G.derivative(x,variable)),basisDerivative=family.frame.B.map(r=>r.map(x=>G.derivative(x,variable)));
    const PDerivative=G.derivative(family.P,variable);if(PDerivative!==G.zero)fail('INVALID_SOURCE_CONSTRUCTION','The frozen-reference envelope unexpectedly depends on the requested local slow coordinate.');
    const finite=G.pulseSensitivityPartialSum(system,{terms}),finiteAmplitudeDerivative=family.frame.B.map((row,i)=>G.mul(family.P,G.add(...row.map((x,j)=>G.add(G.mul(basisDerivative[i][j],finite.values[j]),G.mul(x,finite.values[j+2]))))));
    const amplitudeDerivativeTail=G.mul(family.P,G.add(bounds.basisNorm,bounds.basisDerivativeNorm),finite.tail);
    const endpoints=[['left',G.zero],['midpoint',G.div(operator.geometry.Ls,G.q(2))],['right',operator.geometry.Ls]].map(([name,time])=>({name,time,timeDerivative:G.derivative(time,variable),
      originalAmplitude:family.t.map(x=>G.substitute(x,v,time)),amplitudeDerivative:family.t.map(x=>G.derivative(G.substitute(x,v,time),variable)),
      derivativeOfComposedEndpoint:true,expression:'partial_a t(v,a) at v=b(a), plus t_v*b_a; b_a is actually computed, never assumed.'}));
    rows.push({sign:family.sign,originalCovarianceSystem:family.system,system,parameter:variable,coordinate:slowCoordinate,
      matrix:structuredClone(original.matrix),matrixDerivative:variation.matrixDerivative,originalInitial:variation.initial,initialDerivative:variation.initialDerivative,variationInitial:variation.variationInitial,
      left:variation.left,leftDerivative:variation.leftDerivative,length:variation.length,lengthDerivative:variation.lengthDerivative,
      w:family.w,wDerivative,amplitude:family.t,amplitudeDerivative,basisDerivative,referenceEnvelopeDerivative:PDerivative,
      finite,finiteAmplitudeDerivative,amplitudeDerivativeTail,bounds,endpoints,
      exactInitialAmplitudeDerivativeRetained:true,actualInitialAmplitudeNotForcedConstant:true,sourceCoefficientsReplaced:false});
  }
  const scope={actualSourceFirstSlowDerivativeConstructed:true,actualMatrixDerivativeIncluded:true,sourceDerivedUniformMatrixDerivativeBound:true,firstVariationConvergentLimit:true,
    initialAndEndpointDependenceIncluded:true,actualAmplitudeDerivativeConstructed:true,derivativeOrder:1,secondSlowDerivativeSupported:false,
    fixedLabelDerivative:true,representativeDerivativeSupported:false,actualCovarianceWeightDerivativeConstructed:false,
    numericalSensitivityQuadrature:false,displayedPartialSumIsExactLimit:false,actualSourceFullCurlComplete:false,allSlowGaussianDerivativesComplete:false,
    fullSameProfileN5:false,fullPhysicalResidualAndFlatErrorPackageComplete:false,newLeanKernelProof:false};
  const domain={sourceProfile,band:structuredClone(operator.program.band),slowPoint:structuredClone(operator.chart),pulseTime:'0<=v<=Ls',
    derivative:'partial_'+slowCoordinate+' at fixed pulse time, source representative, dyadic Q, integer carrier and auxiliary label',
    sourceNormDomain:'Actual completed background on the enlarged source chart [Xa/2,2Xb] x eta[-1,1] x s[1/2,2]; boundary derivatives are one-sided.',
    doesNotRequireExercisedBandBelowQStar:true,doesNotInferPulseOrCovariancePositivityOfExercisedBand:true};
  const checks=[
    {id:'same-genuine-source-matrix-and-initial',pass:rows.every(r=>canonicalStringify(r.matrix)===canonicalStringify(operator.families.find(f=>f.sign===r.sign).frame.wMatrix)&&canonicalStringify(r.originalInitial)===canonicalStringify([G.one,G.zero])),meaning:'Both signs retain the exact original covariance coefficient matrix and normalized growing datum.'},
    {id:'nonconstant-matrix-derivative-retained',pass:rows.every(r=>r.matrixDerivative.flat().some(x=>x!==G.zero)),meaning:'The actual first slow derivative of M is constructed from its body and contributes to the augmented ODE.'},
    {id:'source-derived-continuous-derivative-bound',pass:rows.every(r=>r.bounds.sourceDerived&&G.freeCoordinates(r.bounds.matrixDerivativeNorm).size===0),meaning:'Every moving-frame term is bounded by ordinary first-jet calculus using the actual completed C2 source; no sampled maximum is used.'},
    {id:'source-initial-and-endpoints-computed',pass:rows.every(r=>r.initialDerivative.every(x=>x===G.zero)&&r.leftDerivative===G.zero&&r.lengthDerivative===G.zero&&r.endpoints.length===3),meaning:'Only normalized w has constant initial data. Actual t=B P w keeps the differentiated B(0) factor and every endpoint chain rule.'},
    {id:'actual-amplitude-initial-dependence',pass:rows.every(r=>slowCoordinate==='R'?r.endpoints[0].amplitudeDerivative.some(x=>x!==G.zero):r.endpoints[0].amplitudeDerivative.every(x=>x===G.zero)),meaning:'The actual initial frame depends on R. Its Z/T derivatives vanish by the retained initial frame expression; no common zero datum is imposed on t.'},
    {id:'nonzero-vanishing-factorial-tail',pass:rows.every(r=>r.finite.tail!==G.zero&&r.amplitudeDerivativeTail!==G.zero&&r.finite.tailTendsToZero&&!r.finite.finiteSumIsExactSolution),meaning:'A source-derived augmented-system norm bounds every displayed finite sum, with a factorial tail tending to zero.'},
    {id:'limited-source-step',pass:!scope.actualSourceFullCurlComplete&&!scope.fullSameProfileN5&&!scope.fullPhysicalResidualAndFlatErrorPackageComplete,meaning:'The sensitivity closes a necessary derivative input; weights, full curl and flat errors keep their existing separate scope.'},
  ];
  if(!checks.every(c=>c.pass))fail('INTERNAL_VALIDATION','The actual first pulse-sensitivity source contract failed.');
  const roots=Object.fromEntries(rows.flatMap(r=>[
    ...r.wDerivative.map((x,j)=>['w_'+r.sign+'_d'+slowCoordinate+'_'+j,x]),...r.amplitudeDerivative.map((x,j)=>['t_'+r.sign+'_d'+slowCoordinate+'_'+j,x]),
    ['matrixDerivativeNorm_'+r.sign,r.bounds.matrixDerivativeNorm],['variationTail_'+r.sign,r.finite.tail],['amplitudeDerivativeTail_'+r.sign,r.amplitudeDerivativeTail],
    ...r.finiteAmplitudeDerivative.map((x,j)=>['finite_t_'+r.sign+'_d'+slowCoordinate+'_'+j,x])
  ]));
  const result={G,operator,request,rows,roots,checks,scope,domain};
  result.program=G.pack(roots,{schema:'MathScope.ActualPulseSensitivityProgram/1',compiler:'actual-pulse-sensitivity.mjs:prepareActualPulseSensitivityProgram',compilerInput:request,
    sourceProfile,parameterExpressionSHA256:operator.parameterExpressionSHA256,domain,scope,checks,rows});
  seals.set(result,{G,operator,nodeCount:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),covariance:JSON.stringify(G.covarianceSystems),variations:JSON.stringify(G.pulseSensitivitySystems),aliases:JSON.stringify([...G.pulseSensitivityAliases]),data:liveData(result)});
  return result;
}

export function assertActualPulseSensitivityProgram(result){
  const s=seals.get(result);
  if(!s||result.G!==s.G||result.operator!==s.operator||JSON.stringify(s.G.nodes.slice(0,s.nodeCount))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions)||JSON.stringify(s.G.covarianceSystems)!==s.covariance||JSON.stringify(s.G.pulseSensitivitySystems)!==s.variations||JSON.stringify([...s.G.pulseSensitivityAliases])!==s.aliases||liveData(result)!==s.data)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged internally generated actual source pulse sensitivity. Copied receipts and caller fields are not source certificates.');
  assertActualCovarianceOperator(s.operator);for(const row of result.rows)s.G.assertPulseFirstVariation(row.system);return true;
}

export async function actualPulseSensitivityCertificate(input={},context={}){
  const prepared=prepareActualPulseSensitivityProgram(input,context);assertActualPulseSensitivityProgram(prepared);context.checkCancelled?.();
  const {G,program,request,rows,checks,scope,domain}=prepared,serialized=canonicalStringify(program),digest=await sha256(serialized);context.checkCancelled?.();
  const expression=id=>({rootId:id,operation:G.nodes[id].op,arguments:structuredClone(G.nodes[id].args),valueKind:'exact convergent source expression; not a binary64 sample'});
  return {schema:'MathScope.ActualPulseSensitivityCertificate/1',status:'COMPLETED',pass:true,request,sourceProfile:request.sourceProfile,parameterExpressionSHA256:prepared.operator.parameterExpressionSHA256,
    completedScope:'Actual source first slow-parameter variation and its convergent functional tail; additive prerequisite for the N5 package full-curl path.',domain,scope,checks,
    graph:{sha256:digest,nodeCount:G.nodes.length,serializedProgramBytes:new TextEncoder().encode(serialized).length,roots:program.roots,compiler:program.compiler,compilerInput:request,graphIncluded:false},
    equationRows:rows.map(r=>({sign:r.sign,coordinate:r.coordinate,originalSystem:r.originalCovarianceSystem,variationSystem:r.system,matrixRoots:r.matrix,matrixDerivativeRoots:r.matrixDerivative,
      matrixNorm:expression(r.bounds.matrixNorm),matrixDerivativeNorm:expression(r.bounds.matrixDerivativeNorm),sourceJetAuditRowCount:r.bounds.rows.length,
      originalInitial:r.originalInitial.map(expression),variationInitial:r.variationInitial.map(expression),leftDerivative:expression(r.leftDerivative),lengthDerivative:expression(r.lengthDerivative),
      originalODE:'w_v=M w',variationODE:'s_v=M s+(partial_a M)w',variationInitialFormula:'g_a-M(left)g*left_a',
      endpointFormula:'d_a t(b(a),a)=partial_a t(b(a),a)+t_v(b(a),a)*b_a'})),
    derivativeRows:rows.flatMap(r=>r.amplitudeDerivative.map((id,j)=>({sign:r.sign,component:['r','theta','z'][j],coordinate:r.coordinate,derivative:expression(id),finiteApproximation:expression(r.finiteAmplitudeDerivative[j]),
      absoluteTail:expression(r.amplitudeDerivativeTail),tailFormula:'P(v)*(||B||+||partial_a B||)*I*exp((K+Ka)L)*((K+Ka)L)^(N+1)/(N+1)!',finiteApproximationIsExact:false}))),
    endpointRows:rows.flatMap(r=>r.endpoints.map(e=>({sign:r.sign,name:e.name,time:expression(e.time),timeDerivative:expression(e.timeDerivative),amplitudeDerivative:e.amplitudeDerivative.map(expression)}))),
    convergence:{method:'Explicit four-component block Volterra series',blockMatrix:'[[M,0],[partial_a M,M]]',sourceOfDerivative:'Ordinary chain/product rules on the retained source matrix body',
      sourceOfNorm:'Actual completed enlarged C2 and frozen source denominator bounds; every sum, product, inverse and square-root term is retained.',allFiniteOrdersInTailSeries:true,
      slowDerivativeOrder:1,terms:request.terms,partialSumIsExactSolution:false,numericalWholeSourceEvaluation:false},
    nextDependency:'Differentiate the actual covariance integral/weights and assemble the full cutoff potential curl; second slow derivatives and global flat-error bounds remain separate.'};
}
