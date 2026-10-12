/** Exact finite multi-index Leibniz sharing for later source derivatives.
 *
 * A product derivative is assembled once with the full integer binomial
 * coefficients. It is the same derivative of the unchanged defining body,
 * with repeated differentiations of the same product collected before any
 * source argument is substituted. No original operation or derivative is
 * changed. Unknown elementary/implicit operations use their actual first
 * derivative and propagate every unsupported/resource exception.
 *
 * Retained closures are only a reuse mechanism. The private source caller
 * must authenticate them and the graph prefix before passing them here.
 * This generic kernel confers no paper-source or all-order class authority.
 */
import {assertAuxiliaryFacade} from './source-auxiliary-expressions.mjs';
import {clearDisposableThirdJetCaches} from '../../mathscope-m2/navier/actual-third-jet-ftc.mjs';

const fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});},
  total=a=>a.reduce((s,n)=>s+n,0),key=a=>a.join(','),primitive=new Set(['rational','source_parameter','coordinate']),
  unary=new Set(['inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling']),
  custom=new Set(['m3_aux_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial']);
const choose=(n,k)=>{let c=1n;for(let j=1;j<=k;j++)c=c*BigInt(n-j+1)/BigInt(j);return c;};
const equalArrays=(a,b)=>a.length===b.length&&a.every((n,j)=>n===b[j]);
function children({op,args}){
  if(primitive.has(op))return [];
  if(unary.has(op)||op==='integer_power'||op==='source_step_derivative')return [args[0]];
  if(op==='definite_integral')return [args[0],args[2],args[3]];
  if(custom.has(op)||op==='actual_expression_partial'||op==='m3_global_indexed_partial')return args[1];
  if(op==='m3_global_pulse_jet'||op==='actual_covariance_volterra')return [args[2],...args[3]];
  return args.filter(Number.isSafeInteger);
}

export function exactMultiIndexLeibniz(G,{maximumOrder=16}={}){
  if(!Number.isSafeInteger(maximumOrder)||maximumOrder<1||maximumOrder>32)
    fail('Declare an explicit finite exact derivative order from1 through32.','RESOURCE_LIMIT');
  const byVariables=new Map(),retainedByVariables=new Map(),splits=new Map(),statistics={newDerivativeBodies:0,productSummands:0,retainedBodies:0,firstDerivativeFallbacks:0,
    scratchReleases:0,releasedScratchEntries:0};
  const split=alpha=>{
    const k=key(alpha);if(splits.has(k))return splits.get(k);
    let rows=[{beta:[],coefficient:1n}];
    for(const n of alpha)rows=rows.flatMap(row=>Array.from({length:n+1},(_,j)=>({beta:[...row.beta,j],coefficient:row.coefficient*choose(n,j)})));
    splits.set(k,rows);return rows;
  };
  const variablesCache=variables=>{const k=key(variables);if(!byVariables.has(k))byVariables.set(k,new Map());return byVariables.get(k);};
  const validate=(body,variables,alpha)=>{
    if(!G.nodes[body]||!Array.isArray(variables)||!variables.length||new Set(variables).size!==variables.length||
      variables.some(x=>G.nodes[x]?.op!=='coordinate')||!Array.isArray(alpha)||alpha.length!==variables.length||
      alpha.some(n=>!Number.isSafeInteger(n)||n<0)||total(alpha)>maximumOrder)
      fail('Differentiate an existing body in distinct original coordinates within the declared finite multi-index.','RESOURCE_LIMIT');
  };
  const derivative=(body,variables,alpha)=>{
    validate(body,variables,alpha);const cache=variablesCache(variables),retained=retainedByVariables.get(key(variables));
    const D=(id,a)=>{
      if(total(a)===0)return id;const k=id+':'+key(a);if(retained?.has(k))return retained.get(k);if(cache.has(k))return cache.get(k);
      if(a.some((n,j)=>n&&!G.dependsOn(id,variables[j]))){cache.set(k,G.zero);return G.zero;}
      if(statistics.newDerivativeBodies%1024===0)G.checkCancelled?.();
      const {op,args}=G.nodes[id];let out;
      if(op==='add')out=G.add(...args.map(x=>D(x,a)));
      else if(op==='multiply'){
        if(args.length!==2)fail('The original scalar product node must retain both operands.');
        const terms=[];
        for(const row of split(a)){
          const l=D(args[0],row.beta);if(l===G.zero)continue;
          const r=D(args[1],a.map((n,j)=>n-row.beta[j]));if(r===G.zero)continue;
          terms.push(G.mul(G.q(row.coefficient),l,r));statistics.productSummands++;
        }out=G.add(...terms);
      }else if(op==='smooth_piecewise')out=G.choose(args[0],args[1],args[2],...args.slice(3).map(x=>D(x,a)));
      else{
        const j=a.findIndex(n=>n>0),rest=[...a];rest[j]--;
        // This is the retained operation's actual derivative, not an
        // invented opaque higher derivative or caller-supplied value.
        const first=G.derivative(id,variables[j]);statistics.firstDerivativeFallbacks++;
        out=D(first,rest);
      }
      cache.set(k,out);statistics.newDerivativeBodies++;return out;
    };return D(body,alpha);
  };
  const retain=(body,variables,alpha,value)=>{
    validate(body,variables,alpha);if(!G.nodes[value])fail('A retained actual derivative body is missing.');
    const cache=variablesCache(variables),v=key(variables),k=body+':'+key(alpha);
    if(!retainedByVariables.has(v))retainedByVariables.set(v,new Map());const retained=retainedByVariables.get(v);
    if(cache.has(k)&&cache.get(k)!==value||retained.has(k)&&retained.get(k)!==value)
      fail('Two retained source closures disagree on an identical derivative body.');
    if(!retained.has(k)){retained.set(k,value);statistics.retainedBodies++;}cache.delete(k);
  };
  const releaseScratch=()=>{
    let entries=0;for(const cache of byVariables.values()){entries+=cache.size;cache.clear();}
    // These maps memoize intermediate algebra only. Every completed own
    // derivative remains in retainedByVariables, and no source node,
    // intern entry, operator definition or requested multi-index changes.
    statistics.scratchReleases++;statistics.releasedScratchEntries+=entries;
    return {releasedScratchEntries:entries,retainedDerivativeBodies:statistics.retainedBodies,
      sourceNodesAndDefinitionsRetained:true,derivativeOrdersChanged:false};
  };
  return {derivative,retain,releaseScratch,statistics,maximumOrder,sourceAuthenticated:false,
    identity:'D^alpha(f*g)=sum_(beta<=alpha) binomial(alpha,beta)*D^beta(f)*D^(alpha-beta)(g)',
    everyIntegerLeibnizCoefficientRetained:true,omittedDerivativesSetToZero:false,sourceGraphMethodsChanged:false};
}

export function declareInitializedMeanMaterializationBudget(G,maximumTotalNodes=6500000){
  assertAuxiliaryFacade(G,G.baseGraph);const previous=G.baseGraph.maxNodes;
  if(!Number.isSafeInteger(maximumTotalNodes)||maximumTotalNodes<previous||maximumTotalNodes<G.nodes.length||maximumTotalNodes>6500000)
    fail('Declare the separate initialized-mean audit resource ceiling at most6.5million nodes.','RESOURCE_LIMIT');
  G.baseGraph.maxNodes=maximumTotalNodes;
  return {previousMaximumNodes:previous,maximumTotalNodes,sourceNodeCountAtDeclaration:G.nodes.length,
    mathematicalSourceChanged:false,finiteDerivativeOrdersTruncated:false,resourceLimitIsNotAMathematicalBound:true};
}

export function createFactoredAuxiliaryMaterializer(G,{retainedClosures=[],maximumOrder=16,retainExpandedRows=true}={}){
  if(typeof retainExpandedRows!=='boolean')fail('Declare whether complete rows are stored explicitly or by their exact source indices.');
  assertAuxiliaryFacade(G,G.baseGraph);const engine=exactMultiIndexLeibniz(G,{maximumOrder}),ownBodies=new Map(),programs=new Map(),pulseBindings=new Map();
  const retain=row=>{
    const s=G.expressionSystem(row.system),orders=row.orders;
    if(!Array.isArray(orders)||orders.length!==s.parameters.length||!G.nodes[row.body]||
      row.parameters&&!equalArrays(row.parameters,s.parameters)||[...G.freeCoordinates(row.body)].some(x=>!s.parameters.includes(x)))
      fail('An inherited source derivative must keep its unchanged body and full own-coordinate tuple.');
    const k=row.system+':'+key(orders);
    if(ownBodies.has(k)&&ownBodies.get(k)!==row.body)fail('Inherited source derivative bodies disagree.');
    if(!ownBodies.has(k)){ownBodies.set(k,row.body);engine.retain(s.body,s.parameters,orders,row.body);}
  };
  const inherit=closure=>{
    if(!closure||!closure.allRequestedSharedBodiesMaterialized)fail('Only a completed retained source derivative closure can be reused.');
    for(const row of closure.expressions??closure.partials??[])retain(row);
    for(const field of closure.indexedPartials??[])for(const row of field.localBodies??[])retain(row);
    for(const block of closure.pulseBlocks??[]){const p=G.baseGraph.globalPulseSystem(block.pulse);pulseBindings.set(p.covariance,block.pulse);}
    if(closure.baseClosure)inherit(closure.baseClosure);
  };
  retainedClosures.forEach(inherit);
  const own=(system,orders=null)=>{
    const s=G.expressionSystem(system);orders??=s.parameters.map(()=>0);
    G.expressionValue(system,s.parameters,orders);const k=system+':'+key(orders);
    if(ownBodies.has(k))return ownBodies.get(k);
    const body=engine.derivative(s.body,s.parameters,orders);
    if([...G.freeCoordinates(body)].some(x=>!s.parameters.includes(x)))fail('A factored actual derivative introduced an undeclared coordinate.');
    ownBodies.set(k,body);engine.retain(s.body,s.parameters,orders,body);return body;
  };
  const indexed=(field,orders=null)=>{
    const s=G.periodicIndexedSystem(field);orders??=s.directions.map(()=>0);G.checkOrders(orders,s.directions.length);
    const k=field+':'+key(orders);if(programs.has(k))return programs.get(k);
    const localBodies=new Map(),operands=new Set(),derivativePlans=new Map(),terms=s.rows.map((row,index)=>{
      const d=G.expressionSystem(row.localSystem);
      if(d.body!==row.localBody||!equalArrays(d.parameters,row.localParameters))fail('The actual indexed row lost its original defining body.');
      const planKey=JSON.stringify([row.localSystem,row.derivativeMaps]);let derivatives=derivativePlans.get(planKey);
      if(!derivatives){let expansion=new Map([[key(row.localParameters.map(()=>0)),G.one]]);
      orders.forEach((n,j)=>{for(let h=0;h<n;h++){
        const next=new Map();for(const [old,c]of expansion)for(const map of row.derivativeMaps[j]){
          const a=old.split(',').map(Number);a[map.parameter]++;const key0=key(a),term=G.mul(c,map.coefficient);
          next.set(key0,G.add(next.get(key0)??G.zero,term));
        }expansion=next;
      }});
      derivatives=[...expansion].map(([a,c])=>{
        const alpha=a.split(',').map(Number),localKey=row.localSystem+':'+a;
        if(!localBodies.has(localKey))localBodies.set(localKey,{system:row.localSystem,orders:alpha,
          body:own(row.localSystem,alpha),actualBodyDifferentiatedBeforeMapping:true,exactMultiIndexLeibnizSharing:true});
        operands.add(c);return {orders:alpha,coefficient:c};
      });derivativePlans.set(planKey,derivatives);}
      [...row.values,row.coefficient,...row.guards.flat()].forEach(x=>operands.add(x));
      return {row:index,label:row.label,localSystem:row.localSystem,values:row.values,coefficient:row.coefficient,guards:row.guards,derivatives};
    }),groups=new Map();
    for(const row of terms){const key0=JSON.stringify([row.localSystem,row.derivatives]),group=groups.get(key0)??{
      localSystem:row.localSystem,derivatives:row.derivatives,sourceRows:[]};group.sourceRows.push(row.row);groups.set(key0,group);}
    const result={field,orders:[...orders],body:G.periodicIndexedValue(field,s.parameters,orders),parameters:s.parameters,
      ...(retainExpandedRows?{terms}:{}),sourceRowCount:s.rows.length,expandedRowsRetained:retainExpandedRows,
      localBodies:[...localBodies.values()],actualSourceOperands:[...operands],allDeclaredRowsRetained:terms.length===s.rows.length,
      compactProgram:{sourceField:field,orders:[...orders],groups:[...groups.values()],sourceRowCount:s.rows.length,
        allOriginalRowsReferencedOnce:[...groups.values()].reduce((n,g)=>n+g.sourceRows.length,0)===s.rows.length,
        groupingRule:'Only identical original local systems and complete derivative-coefficient arrays are grouped; every source row remains.'},
      sourceAuthenticated:false};programs.set(k,result);return result;
  };
  const cacheReleases=[],releaseWorkingCaches=()=>{
    const row={own:engine.releaseScratch(),base:clearDisposableThirdJetCaches(G.baseGraph),
      retainedOwnBodies:ownBodies.size,retainedIndexedPrograms:programs.size,
      allSourceRowsAndLocalBodiesRetained:true};cacheReleases.push(row);return row;
  };
  return {G,engine,own,indexed,pulseBindings,releaseWorkingCaches,cacheReleases,
    retainExpandedRows,retainedClosureCount:retainedClosures.length,sourceAuthenticated:false};
}

function baseClosure(materializer,roots,{maxExpressions,onProgress,cacheCheckpointEvery}){
  const {G,own}=materializer,B=G.baseGraph,visited=new Set(),stack=[...roots],partials=new Map(),indexed=new Map(),pulseBlocks=new Map(),limits=new Map(),
    allArguments=new Set(['add','multiply','inverse','exp','log_positive','sqrt_positive','sine','cosine','ceiling','maximum','smooth_piecewise']);
  while(stack.length){
    const id=stack.pop();if(visited.has(id))continue;visited.add(id);const node=G.nodes[id];if(!node)fail('An actual base source node is missing.');
    const {op,args}=node;let next=[];
    if(primitive.has(op)){}
    else if(op==='integer_power'||op==='source_step_derivative')next=[args[0]];
    else if(allArguments.has(op))next=args;
    else if(op==='definite_integral')next=[args[0],args[2],args[3]];
    else if(op==='actual_expression_partial'){
      const [system,values,orders]=args,k=system+':'+key(orders),s=G.expressionSystem(system);
      if(G.expressionValue(system,values,orders)!==id)fail('An original source derivative lost its actual arguments.');
      let row=partials.get(k);if(!row){
        if(partials.size>=maxExpressions)fail('The complete factored base closure exhausted its declared derivative budget.','RESOURCE_LIMIT');
        row={system,orders:[...orders],parameters:s.parameters,body:own(system,orders),applicationsChecked:0,actualBodyGenerated:true};partials.set(k,row);
        if(partials.size%250===0){
          if(cacheCheckpointEvery)materializer.releaseWorkingCaches();
          onProgress?.({stage:'global-initial-mean-factored-base-derivative',functions:partials.size,nodeCount:G.nodes.length,remainingTraversalStack:stack.length});
        }
      }row.applicationsChecked++;next=[...values,row.body];
    }else if(op==='m3_global_indexed_partial'){
      const [field,values,orders]=args,k=field+':'+key(orders);let row=indexed.get(k);
      if(!row){row=B.materializeGlobalIndexedField(field,orders);indexed.set(k,row);}next=[...values,row.body];
    }else if(op==='m3_global_pulse_jet'||op==='actual_covariance_volterra'){
      limits.set(op,(limits.get(op)??0)+1);next=[args[2],...args[3]];
      // Every original covariance in this initialized-current closure is
      // either explicitly bound to the current source pulse or retains its
      // original matrix/initial/length definition.
      const pulse=op==='m3_global_pulse_jet'?args[0]:materializer.pulseBindings.get(args[0]);
      if(pulse!==undefined){
        const alpha=op==='m3_global_pulse_jet'?args[4]:[0,0,0],k=pulse+':'+key(alpha);let block=pulseBlocks.get(k);
        if(!block){block=B.materializeGlobalPulseJet(pulse,alpha);pulseBlocks.set(k,block);
          next.push(...block.coefficients.flatMap(c=>[...c.matrix.flat(),c.norm.upper]),block.matrixNorm,block.intervalLength);}
      }else{
        const s=B.covarianceSystems[args[0]];if(!s)fail('A retained original covariance lost its complete defining system.');
        next.push(...s.matrix.flat(),...s.initial,s.normUpper,s.length);
      }
    }else if(op==='actual_natural_series'){limits.set(op,(limits.get(op)??0)+1);next=[args[1],args[2]];}
    else if(op==='actual_background_picard'||op==='actual_background_even_profile'){
      limits.set(op,(limits.get(op)??0)+1);const s=B.picardSystems[args[0]];if(!s)fail('An actual background Picard source is missing.');
      next=[args[2],args[3],...s.A0.flat(),...s.A1.flat(),...s.forcing];
    }else if(op==='actual_quadratic_root')next=[args[2]];
    else if(op==='actual_monotone_root'){
      const s=B.monotoneSystems[args[0]];if(!s)fail('An actual monotone source equation is missing.');
      next=[...args.slice(1),s.body,s.left,s.right,s.derivativeLower,s.derivativeUpper];
    }else fail('No exact factored base closure is defined for '+op+'.','UNSUPPORTED');
    stack.push(...next);
  }
  return {schema:'MathScope.N6.GlobalFactoredActualDerivativeClosure/1',roots:[...roots],visitedNodes:visited.size,partials:[...partials.values()],
    indexedPartials:[...indexed.values()].map(x=>({field:x.field,orders:x.orders,body:x.body,rows:x.terms.length,localBodies:x.localBodies,
      allDeclaredRowsRetained:x.allDeclaredRowsRetained,labelsDifferentiated:x.labelsDifferentiated})),
    pulseBlocks:[...pulseBlocks.values()].map(x=>({pulse:x.pulse,orders:x.requestedOrders,dimension:x.dimension,matrixNorm:x.matrixNorm,
      allCoefficientAndTimeDerivativeBodiesGenerated:x.allCoefficientAndTimeDerivativeBodiesGenerated})),exactLimits:Object.fromEntries(limits),
    allRequestedSharedBodiesMaterialized:true,allActualApplicationArgumentsRetained:true,sourceAuthenticated:false,
    finiteApproximationReplacesExactLimit:false,allOrderSourceClassBoundClaimed:false};
}

export function materializeFactoredAuxiliarySourceClosure(materializer,roots,{maxExpressions=100000,onProgress,cacheCheckpointEvery=0}={}){
  const {G,own,indexed}=materializer;assertAuxiliaryFacade(G,G.baseGraph);
  if(!Array.isArray(roots)||roots.some(x=>!G.nodes[x])||!Number.isSafeInteger(maxExpressions)||maxExpressions<1||maxExpressions>100000||
    !Number.isSafeInteger(cacheCheckpointEvery)||cacheCheckpointEvery<0||cacheCheckpointEvery>1000)
    fail('Declare existing complete source roots and a finite derivative-program budget.','INVALID_INPUT');
  const stack=[...roots],visited=new Set(),baseRoots=new Set(),expressions=new Map(),fields=new Map(),inverses=new Map();
  while(stack.length){
    G.checkCancelled?.();const id=stack.pop();if(visited.has(id))continue;visited.add(id);
    if(!G.extended(id)){baseRoots.add(id);continue;}const {op,args}=G.nodes[id];let next;
    if(op==='m3_aux_expression_partial'){
      const [system,values,orders]=args,k=system+':'+key(orders);let row=expressions.get(k);
      if(G.expressionValue(system,values,orders)!==id)fail('A factored auxiliary application lost its full argument tuple.');
      if(!row){const s=G.expressionSystem(system);row={system,orders:[...orders],parameters:s.parameters,body:own(system,orders),
        applicationsChecked:0,actualBodyGenerated:true};expressions.set(k,row);}row.applicationsChecked++;next=[...values,row.body];
    }else if(op==='m3_aux_indexed_partial'){
      const [system,values,orders]=args,k=system+':'+key(orders);let row=fields.get(k);
      if(G.periodicIndexedValue(system,values,orders)!==id)fail('A complete common-torus application lost an original argument.');
      if(!row){
        onProgress?.({stage:'global-initial-mean-factored-indexed-derivative-begin',field:system,orders,
          completedIndexedPrograms:fields.size,remainingTraversalStack:stack.length,nodeCount:G.nodes.length});
        row=indexed(system,orders);fields.set(k,row);
        if(cacheCheckpointEvery&&fields.size%cacheCheckpointEvery===0){
          const release=materializer.releaseWorkingCaches();onProgress?.({stage:'global-initial-mean-disposable-cache-release',
            ...release,completedIndexedPrograms:fields.size,nodeCount:G.nodes.length});
        }
        onProgress?.({stage:'global-initial-mean-factored-all162-derivative',field:system,orders,rows:row.sourceRowCount,
          completedIndexedPrograms:fields.size,remainingTraversalStack:stack.length,nodeCount:G.nodes.length});
      }next=[...values,...row.actualSourceOperands,...row.localBodies.map(x=>x.body)];
    }else if(op==='m3_aux_inverse_partial'){
      const [system,values,orders]=args,k=system+':'+key(orders),s=G.auxiliaryInverseSystem(system);
      if(G.auxiliaryInverseValue(system,values,orders)!==id)fail('An original exact Fourier limit lost an argument.');
      if(!inverses.has(k))inverses.set(k,{system,orders:[...orders],body:s.body,parameters:s.parameters,Y:s.Y,
        exactInfiniteLimitRetained:true,finiteTailProducer:s.tailProducer,sourceTailMustBeExecutedSeparately:true});next=[...values,s.body];
    }else next=children(G.nodes[id]);
    if(expressions.size+fields.size>maxExpressions)fail('The complete auxiliary factored closure exhausted its declared budget.','RESOURCE_LIMIT');
    stack.push(...next);
  }
  if(cacheCheckpointEvery)materializer.releaseWorkingCaches();
  const base=baseClosure(materializer,[...baseRoots],{maxExpressions,onProgress,cacheCheckpointEvery});
  return {schema:'MathScope.N6.ActualFactoredAuxiliaryDerivativeClosure/1',roots:[...roots],visitedNodes:visited.size,
    expressions:[...expressions.values()],indexedPartials:[...fields.values()].map(row=>({field:row.field,orders:row.orders,body:row.body,
      rows:row.sourceRowCount,localBodies:row.localBodies,allDeclaredRowsRetained:row.allDeclaredRowsRetained,labelsDifferentiated:false,
      torusNearestCopyDifferentiated:false,finiteSummandProgram:row.compactProgram,actualSourceOperands:row.actualSourceOperands,
      completeFiniteSumExpanded:false,allActualLocalDerivativesMaterialized:true})),exactInversePartials:[...inverses.values()],baseClosure:base,
    exactLeibnizProgram:{identity:materializer.engine.identity,statistics:{...materializer.engine.statistics},
      inheritedCompletedClosures:materializer.retainedClosureCount,allIntegerCoefficientsRetained:true,
      expandedRowStorageRetained:materializer.retainExpandedRows,exactOriginalRowReferencesRetained:true,
      cacheReleases:materializer.cacheReleases},
    allRequestedSharedBodiesMaterialized:true,allDeclaredCoverRowsRetained:[...fields.values()].every(x=>x.allDeclaredRowsRetained),
    exactFourierLimitsRequireTheirActualTail:inverses.size>0,numericalValuesOrEnclosures:false,finiteApproximationsReplacedInfiniteSolutions:false,
    allOrderSourceClassBoundClaimed:false,sourceAuthenticated:false,sourceGraphOrFrozenCalculusModified:false};
}
