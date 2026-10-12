/** Complete source derivative audit of temporal-before-moment mean fields.
 * Every new inverse partial receives a tail from its own actual source
 * derivative. Earlier bounds may be reused only for exactly the same
 * system and slow multi-index, with sufficient torus derivative order.
 */
import {assertGlobalInitializedMean,globalInitializedMeanCertificate} from './source-global-initial-mean.mjs';
import {createFactoredAuxiliaryMaterializer,materializeFactoredAuxiliarySourceClosure,declareInitializedMeanMaterializationBudget} from './source-factored-auxiliary-closure.mjs';
import {actualFourierCoefficient,auxiliaryInverseTail} from './source-auxiliary-fourier.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_CONSTRUCTION'});},
  progress=(context,stage,G,extra={})=>{context.checkCancelled?.();context.onProgress?.({stage,nodeCount:G.nodes.length,...extra});};

export async function auditGlobalInitializedMeanDerivatives(s,context={}){
  assertGlobalInitializedMean(s);const G=s.G,start=G.nodes.length,
    materializationBudget=declareInitializedMeanMaterializationBudget(G,6500000),{R,Z,T,Y}=s.temporal.pressure.geometry,
    materializer=createFactoredAuxiliaryMaterializer(G,{retainedClosures:[s.temporal.closure],maximumOrder:16,
      retainExpandedRows:false,compositionSharing:true}),
    meanNames=['gr','haarGr','P','Jtheta','Jz','Etheta','Ez','radialResidual'],
    pressureNames=['value','source','partialR','radialAuxiliaryDerivative','fullRadialDerivative','slowZDerivative','cutoffRemainder'],
    roots=[...Object.values(s.stages).flatMap(stage=>[...Object.values(stage.velocity),...meanNames.map(n=>stage.mean[n]),
      ...pressureNames.map(n=>stage.pressure[n]),...['innerBoundary','outerBoundary','innerZ','outerZ'].map(n=>stage.pressure.endpointTerms[n])]),
      s.potential.psi,s.potential.compactPsi,s.potential.rawDeltaBeta,s.potential.whole,
      ...s.bumps.coefficients.angular,...s.bumps.coefficients.axial,...Object.values(s.nonlinear.remainderDefects)],
    preliminary=materializeFactoredAuxiliarySourceClosure(materializer,roots,{maxExpressions:100000,onProgress:context.onProgress,cacheCheckpointEvery:48}),groups=new Map();
  for(const request of preliminary.exactInversePartials){
    const slow=request.orders.slice(0,3),maximumTorusOrder=request.orders[3]+request.orders[4],key=request.system+':'+slow.join(','),
      row=groups.get(key)??{system:request.system,slowOrders:slow,maximumTorusOrder:0,requests:[]};
    row.maximumTorusOrder=Math.max(row.maximumTorusOrder,maximumTorusOrder);row.requests.push(request);groups.set(key,row);
  }
  const derivativeQueries=[];
  for(const row of groups.values()){
    const definition=G.auxiliaryInverseSystem(row.system),old=s.temporal.derivativeQueries.find(q=>q.system===row.system&&
      q.slowOrders.every((n,j)=>n===row.slowOrders[j])&&q.maximumTorusOrder>=row.maximumTorusOrder);
    let body=definition.body;
    row.slowOrders.forEach((order,j)=>{for(let k=0;k<order;k++)body=G.derivative(body,[R,Z,T][j]);});
    if(old&&old.actualDifferentiatedSource!==body)fail('A reused temporal tail no longer has the exact same actual differentiated source.');
    const tail=old?old.tail:auxiliaryInverseTail(G,{body,Y,cutoff:1,derivativeOrder:row.maximumTorusOrder}),
      mean=old?old.exactHaarMean:actualFourierCoefficient(G,{body,Y,k:[0,0]}).C;
    derivativeQueries.push({system:row.system,slowOrders:row.slowOrders,maximumTorusOrder:row.maximumTorusOrder,
      actualDifferentiatedSource:body,exactHaarMean:mean,tail,requests:row.requests.map(p=>({orders:p.orders,body:p.body})),
      sourceDerivativesGeneratedBeforeSubstitution:true,actualTailAssignedToEveryRequestedPartial:true,
      reusedIdenticalEarlierSourceBound:!!old,
      applicationRule:'At each retained inverse application use this exact bound function at its complete original slow arguments before the enclosing radial/Haar integral.',
      numericalApplicationEnclosuresComputed:false});
    progress(context,'global-initial-mean-own-inverse-derivative-tail',G,{system:row.system,slowOrders:row.slowOrders,maximumTorusOrder:row.maximumTorusOrder,reused:!!old});
  }
  const tailRoots=derivativeQueries.flatMap(q=>[q.actualDifferentiatedSource,q.exactHaarMean,q.tail.upper,
      ...q.tail.sourceBound.faces.flatMap(f=>[f.derivative,f.first,f.second,f.mixed])]),
    closure=materializeFactoredAuxiliarySourceClosure(materializer,[...roots,...tailRoots],{maxExpressions:100000,onProgress:context.onProgress,cacheCheckpointEvery:48}),
    covered=closure.exactInversePartials.every(p=>derivativeQueries.some(q=>q.system===p.system&&
      q.slowOrders.every((n,j)=>n===p.orders[j])&&q.maximumTorusOrder>=p.orders[3]+p.orders[4])),
    checks=[{id:'post-temporal-and-post-moment-complete-source-derivatives',pass:closure.allRequestedSharedBodiesMaterialized&&closure.baseClosure.allRequestedSharedBodiesMaterialized},
      {id:'every-new-pressure-and-mean-inverse-partial-has-actual-tail',pass:covered&&derivativeQueries.every(q=>q.actualTailAssignedToEveryRequestedPartial)},
      {id:'all-original-labels-and-physical-tail-remainders-retained',pass:closure.allDeclaredCoverRowsRetained&&
        Object.values(s.stages).every(stage=>!stage.pressure.cutoffRemainderDeclaredZero&&!stage.pressure.endpointTerms.endpointTermsDeclaredZero)},
      {id:'actual-initial-mean-source-still-private-and-unchanged',pass:assertGlobalInitializedMean(s)}];
  if(checks.some(x=>!x.pass))fail('The complete temporal-before-moment derivative audit omitted an actual source operand or tail.');
  const released=materializer.releaseWorkingCaches();
  progress(context,'global-initial-mean-disposable-cache-release',G,released);
  const source=await globalInitializedMeanCertificate(s),definitions=G.captureFunctionDefinitions(),
    encoded=canonicalStringify({sourceGraph:source.graph,derivativeQueries,closure,nodes:G.nodes.slice(start),definitions}),
    result={schema:'MathScope.N6.GlobalActualInitializedMeanDerivativeAudit/1',source,derivativeQueries,closure,checks,materializationBudget,
      graph:{sha256:await sha256(encoded),nodeCount:G.nodes.length,deltaNodeCount:G.nodes.length-start,canonicalBytes:new TextEncoder().encode(encoded).length},
      actualSourceSequenceExecuted:true,everyNewInverseDerivativeTailMaterialized:true,
      fullNonzeroAngularResidualAttached:false,originalProp9_5ClassBoundsEstablished:false,
      initializedJ0:false,completeN6:false,numericalWholeFieldEnclosure:false,newLeanKernelProof:false};
  progress(context,'global-initial-mean-source-and-every-inverse-tail-audited',G);return result;
}
