/** Original zero-auxiliary-mean inverse on the authenticated full current.
 *
 * The exact inverse is an infinite limit with source-generated finite
 * Fourier parts and explicit four-extra-derivative tails. The actual
 * meridional potential retains A1 and the slow time residual. This module
 * does not claim the later nonlinear pressure/moment initialization ran.
 */
import {assertGlobalCurrentPressure,globalCurrentPressureCertificate} from './source-global-pressure.mjs';
import {finiteAuxiliaryInverse,actualFourierCoefficient,auxiliaryInverseTail} from './source-auxiliary-fourier.mjs';
import {materializeAuxiliarySourceClosure} from './source-auxiliary-expressions.mjs';
import {realizeOriginalTemporalPotential} from './source-temporal-potential.mjs';
import {globalGraphEqual} from './source-global-current.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});},
  record=s=>({schema:s.schema,source:s.source,periodicity:s.periodicity,inverses:s.inverses,potential:s.potential,
    derivativeQueries:s.derivativeQueries,closure:s.closure,checks:s.checks,convergence:s.convergence,scope:s.scope}),
  progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});};

/** Direct N differentiation uses the ACTUAL source Fourier coefficients.
 * Its remaining divisor product is reduced by the explicit quadratic norm,
 * with sqrt(2)^2=2 and an independently nonzero exact integer denominator.
 */
export function checkActualFiniteAuxiliaryIdentity(G,finite){
  const {Y}=finite,rows=finite.rows.map(row=>{
    const c=row.coefficient,d=row.divisor,root=d.sqrtTwo,m=BigInt(d.quadratic.m),n=BigInt(d.quadratic.n),norm=BigInt(d.quadratic.integerNorm),
      direct=G.add(G.mul(G.sub(root,G.one),G.derivative(row.value,Y[0])),G.derivative(row.value,Y[1])),
      projectedWithDivisor=G.mul(row.sourceProjection,d.value,d.reciprocal),
      differential=globalGraphEqual(G,direct,projectedWithDivisor,[c.C,c.S,c.sine,c.cosine,c.twoPi,root]),
      quadratic=globalGraphEqual(G,G.sub(G.mul(d.value,d.conjugate),G.q(norm)),
        G.neg(G.mul(G.q(n*n),G.sub(G.pow(root,2),G.q(2)))),[root]),
      denominator=norm===m*m-2n*n*n&&norm!==0n&&G.nodes[root].op==='sqrt_positive'&&G.nodes[root].args[0]===G.q(2),
      coefficientIndependent=Y.every(y=>!G.freeCoordinates(c.C).has(y)&&!G.freeCoordinates(c.S).has(y));
    return {mode:row.mode,differential,quadratic,nonzeroOriginalNorm:denominator,
      actualCoefficientsIndependentOfY:coefficientIndependent,
      pass:differential.pass&&quadratic.pass&&denominator&&coefficientIndependent,
      conclusion:'N applied to this actual source Fourier pair equals its exact projected source pair.'};
  });
  return {schema:'MathScope.N6.ActualFiniteTemporalIdentity/1',rows,pass:rows.every(x=>x.pass),
    sourceAuthenticated:false,finiteProjectionMistakenForFullSource:false};
}

function sourceSmoothPeriodicity(pressure){
  const {current,cover,geometry}=pressure,G=pressure.G,sqrtTwo=G.sqrt(G.q(2)),
    checks=[{id:'same-original-two-dimensional-time-direction',pass:geometry.vt[0]===G.sub(sqrtTwo,G.one)&&geometry.vt[1]===G.one},
      {id:'all81-both-sign-full-curl-periodic-bodies',pass:cover.rows.length===81&&cover.rows.every(x=>x.signs.length===2)&&
        Object.values(cover.fields).every(field=>G.periodicIndexedSystem(field).rows.length===162)},
      {id:'original-integer-torus-cover-and-flat-joins',pass:cover.proof.exactSourceAuthority&&
        cover.proof.sourceCoveringDifference.pass&&cover.proof.allCrossLabelProductsVanish&&
        cover.proof.haarInvariance.noExtraCoveringMultiplicity},
      {id:'actual-full-pressure-before-temporal-inverse',pass:pressure.checks.every(x=>x.pass)&&
        pressure.residual.allAuxiliaryModesRetained&&pressure.scope.actualAllAuxiliaryModesRetained},
      {id:'original-slow-factors-constant-in-auxiliary-coordinates',pass:[geometry.ci,geometry.epsilon,
        pressure.pressure.rho,pressure.pressure.chi,geometry.radialPrimitive].every(x=>geometry.Y.every(y=>!G.freeCoordinates(x).has(y)))}];
  if(checks.some(x=>!x.pass))fail('The actual temporal inverse lost an original periodic source premise: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  return {checks,sourceAuthenticated:true,sourceBodyRoots:{theta:pressure.residual.Etheta,z:pressure.residual.Ez},
    originalParameterExpressionSHA256:current.source.parameterExpressionSHA256,
    completeCommonTorusCoverProof:cover.proof,
    exactSmoothnessDerivation:[
      'Every retained local pulse is the original finite-interval linear Volterra solution with its smooth original coefficients. Differentiating the equation gives the retained finite variational systems.',
      'The actual primary potential is multiplied by the original flat auxiliary cutoffs before its full curl. All local derivatives therefore have the same zero join across every compact rectangle boundary.',
      'The original integer common-torus maps preserve smooth periodic joins. The complete locally finite81-box sum and all six full-curl products retain every sign and both torus Jacobian columns.',
      'The pressure is the actual finite translated radial integral T0 of its full source with the original slow cutoff. Translation, integration, slow differentiation and products preserve this smooth1-periodicity.',
      'The complete Etheta and Ez are finite differential expressions in those exact bodies. The FTC tail below is generated from their actual derivatives, not supplied numerical or theorem-reference bounds.'],
    sourceAnalyticalSmoothnessUsed:true,allOrderUniformWMClassEstimateInferred:false};
}

export function attachGlobalTemporalInverse(pressure,context={}){
  assertGlobalCurrentPressure(pressure);const G=pressure.G,start=G.nodes.length,
    periodicity=sourceSmoothPeriodicity(pressure),geometry={...pressure.geometry,chi:pressure.pressure.chi},
    {R,Z,T,Y}=geometry,parameters=[R,Z,T,pressure.current.band.coordinates.ell,...Y],directions=[R,Z,T,...Y],
    inverses={};
  for(const [component,body]of Object.entries(periodicity.sourceBodyRoots)){
    const system=G.defineAuxiliaryInverse({name:'GlobalActualTemporal_'+component,body,Y,parameters,directions}),
      exact=G.auxiliaryInverseValue(system,parameters),finite=finiteAuxiliaryInverse(G,{body,Y,cutoff:1,derivativeOrders:[0,1]}),
      identity=checkActualFiniteAuxiliaryIdentity(G,finite),sourceC4=finite.tails[0].sourceBound.upper,
      sourceProjectionErrorUpper=G.div(G.mul(G.q(4),sourceC4),G.mul(G.pow(finite.haarMean.twoPi,4),G.q(finite.cutoff**2))),
      NDerivativeLimitErrorUpper=G.mul(G.sqrt(G.q(2)),finite.tails[1].upper);
    if(!identity.pass)fail('A finite actual-source temporal Fourier identity failed.');
    inverses[component]={system,body,exact,finite,identity,sourceProjectionErrorUpper,NDerivativeLimitErrorUpper,
      sourceProjectionTailProof:'The actual C4 bound gives |Fhat(k)|<=C4/((2*pi)^4*|k|max^4). Summing all8*n points of each omitted shell and integral_K^infinity x^-3 dx gives4*C4/((2*pi)^4*K^2).',
      NDerivativeLimitTailProof:'Each first-coordinate inverse tail is bounded by the actual m=1 tail. The original coefficient sum |sqrt(2)-1|+1=sqrt(2) bounds N applied to the omitted inverse.',
      originalZeroMeanSource:finite.centeredBody,actualHaarMean:finite.haarMean.C,
      exactZeroMode:G.zero,exactInverseEquation:'N inverse = actual E - normalized Haar mean(actual E)',
      sourceAuthenticated:true,finiteSumReplacesExactLimit:false};
    progress(context,'global-source-actual-temporal-coefficients-and-C1-tail-program',G,{component});
  }
  const potential=realizeOriginalTemporalPotential(G,{geometry,inverseTheta:inverses.theta.exact,inverseZ:inverses.z.exact,tag:'global_actual_temporal'}),
    requestedRoots=[...Object.values(potential.velocity),potential.psi,potential.cutoffRemainder,...Object.values(potential.slowTime)],
    preliminary=materializeAuxiliarySourceClosure(G,requestedRoots,{maxExpressions:70000,onProgress:context.onProgress}),
    queryGroups=new Map();
  // The additive facade deliberately leaves inverse derivatives as exact
  // limits. Every requested derivative is separately assigned an ACTUAL
  // source derivative and tail here; none inherits an unrelated base tail.
  for(const inverse of preliminary.exactInversePartials){
    const s=G.auxiliaryInverseSystem(inverse.system),slow=inverse.orders.slice(0,3),torusOrder=inverse.orders[3]+inverse.orders[4],
      key=inverse.system+':'+slow.join(','),row=queryGroups.get(key)??{system:inverse.system,slowOrders:slow,torusOrders:new Set(),requests:[]};
    row.torusOrders.add(torusOrder);row.requests.push(inverse);queryGroups.set(key,row);
  }
  const derivativeQueries=[];
  for(const row of queryGroups.values()){
    const s=G.auxiliaryInverseSystem(row.system);let sourceBody=s.body;
    row.slowOrders.forEach((order,j)=>{for(let k=0;k<order;k++)sourceBody=G.derivative(sourceBody,[R,Z,T][j]);});
    const maximumTorusOrder=Math.max(...row.torusOrders),matching=Object.values(inverses).find(x=>x.system===row.system),
      sameBase=row.slowOrders.every(x=>x===0),
      tail=sameBase&&maximumTorusOrder<=1?matching.finite.tails.find(x=>x.derivativeOrder===maximumTorusOrder):
        auxiliaryInverseTail(G,{body:sourceBody,Y,cutoff:1,derivativeOrder:maximumTorusOrder}),
      mean=actualFourierCoefficient(G,{body:sourceBody,Y,k:[0,0]});
    derivativeQueries.push({system:row.system,slowOrders:row.slowOrders,maximumTorusOrder,actualDifferentiatedSource:sourceBody,
      exactHaarMean:mean.C,tail,requests:row.requests.map(x=>({orders:x.orders,body:x.body})),
      sourceDerivativesGeneratedBeforeSubstitution:true,actualTailAssignedToEveryRequestedPartial:true,
      applicationRule:'This is a bound function at every original slow point. At each inverse-partial application, substitute its actual slow arguments into this bound before radial integration; Y arguments do not enter its uniform torus bound.',
      numericalApplicationEnclosuresComputed:false});
    progress(context,'global-source-temporal-requested-inverse-jet-tail-program',G,{system:row.system,slowOrders:row.slowOrders,maximumTorusOrder});
  }
  const tailRoots=[...Object.values(inverses).flatMap(x=>[x.finite.value,x.finite.sourceProjection,x.actualHaarMean,
    ...x.finite.tails.flatMap(t=>[t.upper,...t.sourceBound.faces.flatMap(f=>[f.derivative,f.first,f.second,f.mixed])])]),
    ...derivativeQueries.flatMap(q=>[q.actualDifferentiatedSource,q.exactHaarMean,q.tail.upper,
      ...q.tail.sourceBound.faces.flatMap(f=>[f.derivative,f.first,f.second,f.mixed])])],
    closure=materializeAuxiliarySourceClosure(G,[...requestedRoots,...tailRoots],{maxExpressions:90000,onProgress:context.onProgress}),
    allRequests=closure.exactInversePartials.every(p=>derivativeQueries.some(q=>q.system===p.system&&
      q.slowOrders.every((x,j)=>x===p.orders[j])&&q.maximumTorusOrder>=p.orders[3]+p.orders[4])),
    checks=[...periodicity.checks,...potential.checks,
      {id:'actual-two-complete-finite-Fourier-identity-checks',pass:Object.values(inverses).every(x=>x.identity.pass&&x.finite.pairCount===4)},
      {id:'actual-zero-mode-projected-never-divided',pass:Object.values(inverses).every(x=>x.exactZeroMode===G.zero&&x.finite.zeroMode.retainedSeparately&&!x.finite.zeroMode.inverted)},
      {id:'actual-C1-convergence-and-four-additional-derivatives',pass:Object.values(inverses).every(x=>x.finite.tails.length===2&&
        x.finite.tails.every(t=>t.sourceDerivativeOrder===t.derivativeOrder+4&&t.tailTendsToZero&&!t.omittedModesSetToZero))},
      {id:'each-requested-inverse-partial-has-its-own-source-tail',pass:allRequests&&derivativeQueries.every(q=>q.actualTailAssignedToEveryRequestedPartial)},
      {id:'all-source-tail-derivatives-and-cover-rows-materialized',pass:closure.allRequestedSharedBodiesMaterialized&&
        closure.allDeclaredCoverRowsRetained&&closure.baseClosure.allRequestedSharedBodiesMaterialized},
      {id:'slow-time-and-axial-cutoff-remainders-retained',pass:potential.slowTimeTermsRetained&&!potential.cutoffRemainderDeclaredZero}];
  if(checks.some(x=>!x.pass))fail('An actual full temporal source identity or derivative tail was omitted: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const result={schema:'MathScope.N6.GlobalActualTemporalInverse/1',G,pressure,
    source:{sameActualGlobalCurrent:true,paperSHA256:pressure.current.source.paperSHA256,
      parameterExpressionSHA256:pressure.current.source.parameterExpressionSHA256,actualFullPressureGraphInput:true,
      originalM2Modified:false,callerBodyOrBoundsAccepted:false,sourcePrefixCount:start},periodicity,inverses,potential,
    derivativeQueries,closure,checks,
    convergence:{zeroMode:'Every finite inverse sum has zero Haar mean. The actual C0 tail tends to zero, so the exact limit has zero Haar mean.',
      originalNIdentity:'The direct N identity is checked for each actual coefficient pair. The actual C1 tail proves uniform convergence of first torus derivatives. Fourier completeness for the actual smooth periodic source identifies their limit as E-HaarMean(E).',
      fourExtraDerivativesRetained:true,completeOmittedSquareLatticeRetained:true,
      slowDerivativeIdentity:'N acts only on Y, with a fixed direction. Every requested slow derivative uses the separately differentiated source and its own actual Fourier tail.',
      sourceFourierTheoremApplied:true,numericalFourierCoefficientsEvaluated:false},
    scope:{actualSourceAuxiliaryTemporalInverseConstructed:true,actualOriginalAxialPotentialRealized:true,
      originalN605OperatorCriteriaSatisfied:true,actualPostTemporalNonlinearPressureReconstructed:false,
      actualFiveMomentsAfterTemporalApplied:false,initializedJ0:false,allOrderTargetClassBoundsCertified:false,
      completeN6:false,numericalWholeFieldEnclosure:false,newLeanKernelProof:false}};
  const count=G.nodes.length;seals.set(result,{G,pressure,start,count,delta:canonicalStringify(G.nodes.slice(start)),
    definitions:G.captureFunctionDefinitions(),record:canonicalStringify(record(result))});
  progress(context,'global-source-exact-temporal-inverse-and-actual-tails-sealed',G);return result;
}

export function assertGlobalTemporalInverse(s){
  const seal=seals.get(s);if(!seal||seal.G!==s.G||seal.pressure!==s.pressure||seal.record!==canonicalStringify(record(s))||
    seal.delta!==canonicalStringify(s.G.nodes.slice(seal.start,seal.count))||!s.G.functionDefinitionsUnchanged(seal.definitions))
    fail('Use the unchanged privately constructed original temporal inverse.');
  assertGlobalCurrentPressure(s.pressure);return true;
}

export async function globalTemporalInverseCertificate(s){
  assertGlobalTemporalInverse(s);const seal=seals.get(s),sourcePressure=await globalCurrentPressureCertificate(s.pressure),
    encoded=canonicalStringify({sourcePressureGraph:sourcePressure.graph,record:record(s),nodes:s.G.nodes.slice(seal.start,seal.count),definitions:seal.definitions});
  return {...record(s),convergence:s.convergence,sourcePressure,
    graph:{sha256:await sha256(encoded),nodeCount:seal.count,deltaNodeCount:seal.count-seal.start,canonicalBytes:new TextEncoder().encode(encoded).length},
    execution:'ACTUAL_ORIGINAL_TEMPORAL_FOURIER_LIMIT_WITH_SOURCE_TAIL_AND_MERIDIONAL_POTENTIAL',
    numericalValuesOrEnclosures:false,individualOperatorAcceptanceDoesNotCompletePackage:true};
}
