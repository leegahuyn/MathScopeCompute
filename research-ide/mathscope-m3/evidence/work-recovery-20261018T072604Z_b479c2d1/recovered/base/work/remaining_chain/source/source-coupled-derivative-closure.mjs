/** The complete mixed closure keeps each kind of infinite solution with
 * its own actual coefficient derivatives and limit bounds. A Fourier tail
 * of one source jet never supplies the bound of a different slow/torus jet.
 * No caller numerical bound, finite sum or completion flag is accepted.
 */
import {assertSourceCoupledExpressions,coupledExpressionChildren} from './source-coupled-expressions.mjs';
import {materializeGlobalSourceClosure} from './source-global-expressions.mjs';
import {finiteAuxiliaryInverse} from './source-auxiliary-fourier.mjs';

const fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});};
const expressions=new Set(['m3_coupled_expression_partial','m3_aux_expression_partial','m3_forced_expression_partial','actual_expression_partial']),
  fields=new Set(['m3_coupled_indexed_partial','m3_aux_indexed_partial']),
  inverses=new Set(['m3_coupled_inverse_partial','m3_aux_inverse_partial']),
  rootsOfComplex=z=>[z.real,z.imaginary],vectorRoots=z=>z.flatMap(rootsOfComplex);
const boundRoots=tail=>[tail.upper,tail.sourceBound.upper,tail.pi.value,...tail.sourceBound.faces.flatMap(f=>[
  f.derivative,f.first,f.second,f.mixed,f.anchor,f.xFace,f.yFace,f.mixedFace,f.upper,...Object.values(f.sourceExpressions)])];

export function materializeCoupledSourceClosure(G,roots,{maxExpressions=50000,fourierCutoff=1,onProgress}={}){
  assertSourceCoupledExpressions(G,G.baseGraph);
  if(!Array.isArray(roots)||roots.some(x=>!Number.isSafeInteger(x)||!G.nodes[x])||!Number.isSafeInteger(maxExpressions)||maxExpressions<1||maxExpressions>100000||
    !Number.isSafeInteger(fourierCutoff)||fourierCutoff<1||fourierCutoff>8)
    fail('Declare existing source roots, a finite complete closure budget and an explicit retained Fourier cutoff.','INVALID_INPUT');
  G.checkRetainedOperands(roots);
  const visited=new Set(),stack=[...roots],shared=new Map(),indexed=new Map(),forced=new Map(),fourier=new Map(),baseRoots=new Set(),F=G.forcedGraph,
    budget=()=>{if(shared.size+indexed.size+forced.size+fourier.size>maxExpressions)fail('The complete mixed source closure exceeded its declared budget.','RESOURCE_LIMIT');};
  while(stack.length){
    G.checkCancelled?.();const id=stack.pop();if(visited.has(id))continue;visited.add(id);
    const n=G.nodes[id],{op,args}=n;
    if(expressions.has(op)){
      const [system,values,orders]=args,key=system+':'+orders.join(','),definition=G.expressionSystem(system);
      if(G.expressionValue(system,values,orders)!==id)fail('A mixed shared derivative lost its original argument tuple.');
      let row=shared.get(key);if(!row){
        row={system,orders:[...orders],parameters:definition.parameters,
          body:G.materializeExpressionFunction(system,definition.parameters,orders),applicationsChecked:0,
          actualBodyDifferentiatedAtOwnCoordinates:true};shared.set(key,row);budget();
      }row.applicationsChecked++;stack.push(...values,row.body);
    }else if(fields.has(op)){
      const [system,values,orders]=args,key=system+':'+orders.join(',');
      if(G.periodicIndexedValue(system,values,orders)!==id)fail('A mixed all-label derivative lost its complete source application.');
      let row=indexed.get(key);if(!row){
        row=G.commonTorusDerivativeProgram(system,orders);indexed.set(key,row);budget();
        onProgress?.({stage:'coupled-all-label-local-body-derivative',system,orders,rows:row.terms.length,nodeCount:G.nodes.length});
      }stack.push(...values,...row.actualSourceOperands,...row.localBodies.map(x=>x.body));
    }else if(op==='m3_forced_pulse_partial'){
      const [system,part,component,time,values,orders]=args,key=system+':'+orders.join(',');
      if(F.forcedPulseValue(system,part,component,time,values,orders)!==id)fail('A forced jet lost its exact ordered-system identity.');
      let jet=forced.get(key);if(!jet){
        jet=F.materializeForcedPulseJet(system,orders);forced.set(key,jet);budget();
        stack.push(jet.matrixNorm,jet.forcingNorm,jet.intervalLength,...jet.coefficients.flatMap(c=>[
          ...c.matrix.flat(),...vectorRoots(c.forcing),...c.matrixEntries.flat().flatMap(e=>[e.expression,e.timeDerivative,e.upper]),
          ...c.forcingEntries.flatMap(z=>['real','imaginary'].flatMap(p=>[z[p].expression,z[p].timeDerivative,z[p].upper]))]));
        onProgress?.({stage:'coupled-actual-forced-source-variational-tail',system,orders,dimension:jet.dimensionPerRealPart,nodeCount:G.nodes.length});
      }stack.push(time,...values);
    }else if(inverses.has(op)){
      const [system,values,orders]=args,key=system+':'+orders.join(','),definition=G.auxiliaryInverseSystem(system);
      if(G.auxiliaryInverseValue(system,values,orders)!==id)fail('An exact mixed Fourier jet lost its complete defining source.');
      let row=fourier.get(key);if(!row){
        let body=definition.body;
        orders.forEach((n,j)=>{for(let k=0;k<n;k++)body=G.derivative(body,definition.directions[j]);});
        const finite=finiteAuxiliaryInverse(G,{body,Y:definition.Y,cutoff:fourierCutoff,derivativeOrders:[0,1]});
        row={system,orders:[...orders],originalBody:definition.body,actualDerivativeBody:body,
          parameters:definition.parameters,directions:definition.directions,Y:definition.Y,finite,
          sourceJetDifferentiatedBeforeTail:true,ownActualC0AndC1Tails:true,
          slowAndTorusDerivativeLimitsCommuteUnderRetainedLocalUniformBounds:true,
          exactLimitRetained:true,sourcePeriodicityStillRequiresAuthentication:true};fourier.set(key,row);budget();
        stack.push(body,finite.zeroMode.value,finite.value,...finite.rows.flatMap(x=>[
          x.coefficient.C,x.coefficient.S,x.value,x.divisor.value,x.divisor.reciprocal]),...finite.tails.flatMap(boundRoots));
        onProgress?.({stage:'coupled-actual-Fourier-source-jet-and-C0-C1-tails',system,orders,cutoff:fourierCutoff,nodeCount:G.nodes.length});
      }stack.push(...values);
    }else if(op==='m3_global_pulse_jet'||op==='actual_covariance_volterra'){
      // A retained original solution can be evaluated at a later exact
      // solution. Audit its OWN coefficient jet as well as every foreign
      // argument; sending the foreign node through the old walker would
      // either omit that defining system or encounter an unknown new op.
      const B=G.baseGraph.baseGraph,[system,component,time,values]=args,
        s=op==='m3_global_pulse_jet'?B.globalPulseSystem(system):B.covarianceSystems[system];
      if(!s)fail('A retained original pulse lost its coefficient definition.');
      const canonical=op==='m3_global_pulse_jet'?B.globalPulseJetValue(system,component,s.variable,s.parameters,args[4]):
        B.covarianceValue(system,component,s.variable,s.parameters);
      baseRoots.add(canonical);stack.push(time,...values);
    }else if(op==='m3_global_indexed_partial'){
      const B=G.baseGraph.baseGraph,[system,values,orders]=args,s=B.globalIndexedSystem(system);
      baseRoots.add(B.globalIndexedValue(system,s.parameters,orders));stack.push(...values);
    }else if(!G.extended(id)&&!G.baseGraph.extended(id))baseRoots.add(id);
    else stack.push(...coupledExpressionChildren(n));
  }
  const baseClosure=materializeGlobalSourceClosure(G.baseGraph.baseGraph,[...baseRoots],{maxExpressions,onProgress});
  return {schema:'MathScope.N6.ActualCoupledSourceDerivativeClosure/1',roots:[...roots],visitedNodes:visited.size,
    sharedExpressions:[...shared.values()],indexedPartials:[...indexed.values()],forcedJets:[...forced.values()],fourierJets:[...fourier.values()],baseClosure,
    everyMixedLocalBodyMaterialized:[...indexed.values()].every(x=>x.fullMixedLocalBodiesMaterialized),
    everyDeclaredIndexedRowRetained:[...indexed.values()].every(x=>x.allDeclaredRowsRetained),
    everyForcedDerivativeHasItsOwnActualSourceAndFactorialTail:[...forced.values()].every(x=>x.allActualMatrixSourceAndTimeDerivativeBodiesGenerated),
    everyFourierDerivativeHasItsOwnActualSourceAndC0C1Tail:[...fourier.values()].every(x=>x.ownActualC0AndC1Tails&&x.sourceJetDifferentiatedBeforeTail),
    finiteSeriesReplacedExactLimits:false,numericalSourceValuesOrWholeFieldEnclosures:false,
    originalSmoothSupportAndPeriodicityAuthenticatedHere:false,originalAllBandClassBoundsCertified:false,
    sourceAuthenticated:false,allCorrectionStagesConstructed:false,completeN6:false};
}
