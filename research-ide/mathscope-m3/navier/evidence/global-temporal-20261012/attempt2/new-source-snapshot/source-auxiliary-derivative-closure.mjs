/** Exact derivative closure without expanding an identity substitution.
 *
 * The earlier, captured auxiliary calculus remains unchanged. This new
 * consumer differentiates every retained defining body at its OWN formal
 * coordinates. Arbitrary physical applications remain shared operations,
 * with all their arguments retained. This is the same exact chain rule;
 * it does not replace source derivatives, integrals or Fourier limits by
 * values or unproved bounds.
 */
import {assertAuxiliaryFacade} from './source-auxiliary-expressions.mjs';
import {materializeGlobalSourceClosure} from './source-global-expressions.mjs';

const caches=new WeakMap(),fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});};
const custom=new Set(['m3_aux_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial']);
const unary=new Set(['inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling']);
const primitive=new Set(['rational','source_parameter','coordinate']);
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const ownCache=G=>{assertAuxiliaryFacade(G,G.baseGraph);if(!caches.has(G))caches.set(G,{expressions:new Map(),fields:new Map()});return caches.get(G);};
function children({op,args}){
  if(primitive.has(op))return [];
  if(unary.has(op)||op==='integer_power'||op==='source_step_derivative')return [args[0]];
  if(op==='definite_integral')return [args[0],args[2],args[3]];
  if(custom.has(op)||op==='actual_expression_partial'||op==='m3_global_indexed_partial')return args[1];
  if(op==='m3_global_pulse_jet'||op==='actual_covariance_volterra')return [args[2],...args[3]];
  return args.filter(x=>Number.isSafeInteger(x));
}

/** Differentiate the mandatory defining body; the identity map requires
 * no alpha-renaming. No arbitrary argument application is evaluated here.
 */
export function materializeActualAuxiliaryFunctionAtOwnCoordinates(G,system,orders=null){
  const cache=ownCache(G).expressions,s=G.expressionSystem(system),
    node=G.expressionValue(system,s.parameters,orders),actualOrders=G.nodes[node].args[2],key=system+':'+actualOrders.join(',');
  if(cache.has(key))return cache.get(key);
  let body=s.body;
  actualOrders.forEach((n,j)=>{for(let k=0;k<n;k++)body=G.derivative(body,s.parameters[j]);});
  if([...G.freeCoordinates(body)].some(x=>!s.parameters.includes(x)))
    fail('An actual derivative introduced an undeclared free coordinate.');
  cache.set(key,body);return body;
}

/** Complete constant-chart chain rule, with each fixed-label body
 * differentiated before the original guard and coordinate map.
 */
export function materializeActualCommonTorusDerivative(G,field,orders=null){
  const cache=ownCache(G).fields,s=G.periodicIndexedSystem(field);orders??=s.directions.map(()=>0);
  G.checkOrders(orders,s.directions.length);const key=field+':'+orders.join(',');
  if(cache.has(key))return cache.get(key);
  const localBodies=new Map(),terms=s.rows.map((row,index)=>{
    const definition=G.expressionSystem(row.localSystem);
    if(definition.body!==row.localBody||definition.parameters.length!==row.localParameters.length||
      definition.parameters.some((x,j)=>x!==row.localParameters[j]))fail('A common-torus row lost its retained defining body or coordinates.');
    let expansion=new Map([[row.localParameters.map(()=>0).join(','),G.one]]);
    orders.forEach((n,j)=>{for(let k=0;k<n;k++){
      const next=new Map();for(const [old,coefficient]of expansion)for(const derivative of row.derivativeMaps[j]){
        const alpha=old.split(',').map(Number);alpha[derivative.parameter]++;
        const index=alpha.join(','),value=G.mul(coefficient,derivative.coefficient);
        next.set(index,G.add(next.get(index)??G.zero,value));
      }expansion=next;
    }});
    const derivatives=[...expansion].map(([ordersText,coefficient])=>{
      const localOrders=ordersText.split(',').map(Number),cacheKey=row.localSystem+':'+ordersText;
      if(!localBodies.has(cacheKey))localBodies.set(cacheKey,{system:row.localSystem,orders:localOrders,
        body:materializeActualAuxiliaryFunctionAtOwnCoordinates(G,row.localSystem,localOrders),actualBodyDifferentiatedBeforeMapping:true});
      return {orders:localOrders,coefficient,value:G.expressionValue(row.localSystem,row.values,localOrders)};
    }),unguarded=G.mul(row.coefficient,G.add(...derivatives.map(d=>G.mul(d.coefficient,d.value)))),guards=[];
    let value=unguarded;
    for(const [coordinate,left,right]of row.guards){
      const body=value;value=G.choose(coordinate,left,right,G.zero,body,G.zero);guards.push({coordinate,left,right,body,value});
    }
    return {row:index,label:row.label,derivatives,unguarded,guards,value};
  }),result=freeze({field,orders:[...orders],parameters:s.parameters,body:G.add(...terms.map(x=>x.value)),terms,localBodies:[...localBodies.values()],
    completeDeclaredRowCount:s.rows.length,allDeclaredRowsRetained:terms.length===s.rows.length,
    labelsDifferentiated:false,torusNearestCopyDifferentiated:false,finiteBodyReplacesAnInfiniteSpatialMesh:false,
    materializationRule:'Actual mixed derivatives at their unchanged defining coordinates; every original argument and affine chart coefficient remains in the shared application.',
    sourceAuthenticated:false});
  cache.set(key,result);return result;
}

export function materializeExactAuxiliarySourceClosure(G,roots,{maxExpressions=60000,onProgress}={}){
  ownCache(G);
  if(!Array.isArray(roots)||roots.some(x=>!G.nodes[x])||!Number.isSafeInteger(maxExpressions)||maxExpressions<1||maxExpressions>100000)
    fail('Declare existing source roots and a finite complete derivative closure budget.','INVALID_INPUT');
  const stack=[...roots],visited=new Set(),baseRoots=new Set(),expressions=new Map(),fields=new Map(),inverses=new Map();
  while(stack.length){
    G.checkCancelled?.();const id=stack.pop();if(visited.has(id))continue;visited.add(id);
    if(!G.extended(id)){baseRoots.add(id);continue;}
    const {op,args}=G.nodes[id];let next;
    if(op==='m3_aux_expression_partial'){
      const [system,values,orders]=args,key=system+':'+orders.join(',');let row=expressions.get(key);
      if(G.expressionValue(system,values,orders)!==id)fail('A shared auxiliary derivative lost its exact arguments.');
      if(!row){
        if(expressions.size+fields.size>=maxExpressions)fail('The complete auxiliary source derivative closure exceeded its declared budget.','RESOURCE_LIMIT');
        const s=G.expressionSystem(system),body=materializeActualAuxiliaryFunctionAtOwnCoordinates(G,system,orders);
        row={system,orders:[...orders],parameters:[...s.parameters],body,applicationsChecked:0,actualBodyGenerated:true};expressions.set(key,row);
      }
      row.applicationsChecked++;next=[...values,row.body];
    }else if(op==='m3_aux_indexed_partial'){
      const [system,values,orders]=args,key=system+':'+orders.join(',');let row=fields.get(key);
      if(G.periodicIndexedValue(system,values,orders)!==id)fail('A common-torus derivative lost its exact arguments.');
      if(!row){
        if(expressions.size+fields.size>=maxExpressions)fail('The complete auxiliary source derivative closure exceeded its declared budget.','RESOURCE_LIMIT');
        row=materializeActualCommonTorusDerivative(G,system,orders);fields.set(key,row);
        onProgress?.({stage:'global-source-common-torus-indexed-derivative',field:system,orders,rows:row.terms.length,nodeCount:G.nodes.length,
          identitySubstitutionsExpanded:false});
      }
      next=[...values,row.body,...row.localBodies.map(x=>x.body)];
    }else if(op==='m3_aux_inverse_partial'){
      const [system,values,orders]=args,key=system+':'+orders.join(','),s=G.auxiliaryInverseSystem(system);
      if(G.auxiliaryInverseValue(system,values,orders)!==id)fail('An exact Fourier inverse derivative lost its actual arguments.');
      if(!inverses.has(key))inverses.set(key,{system,orders:[...orders],body:s.body,parameters:s.parameters,Y:s.Y,
        exactInfiniteLimitRetained:true,finiteTailProducer:s.tailProducer,sourceTailMustBeExecutedSeparately:true});
      next=[...values,s.body];
    }else next=children(G.nodes[id]);
    stack.push(...next);
  }
  onProgress?.({stage:'global-source-common-torus-base-derivative-closure',newExpressions:expressions.size,newIndexed:fields.size,
    baseRoots:baseRoots.size,nodeCount:G.nodes.length,identitySubstitutionsExpanded:false});
  const baseClosure=materializeGlobalSourceClosure(G.baseGraph,[...baseRoots],{maxExpressions,onProgress});
  return {schema:'MathScope.N6.ActualAuxiliaryDerivativeClosure/1',roots:[...roots],visitedNodes:visited.size,
    expressions:[...expressions.values()],indexedPartials:[...fields.values()].map(row=>({field:row.field,orders:row.orders,body:row.body,
      rows:row.terms.length,localBodies:row.localBodies,allDeclaredRowsRetained:row.allDeclaredRowsRetained,
      labelsDifferentiated:row.labelsDifferentiated,torusNearestCopyDifferentiated:row.torusNearestCopyDifferentiated})),
    exactInversePartials:[...inverses.values()],baseClosure,allRequestedSharedBodiesMaterialized:true,
    allDeclaredCoverRowsRetained:[...fields.values()].every(row=>row.allDeclaredRowsRetained),
    exactFourierLimitsRequireTheirActualTail:inverses.size>0,numericalValuesOrEnclosures:false,
    finiteApproximationsReplacedInfiniteSolutions:false,allOrderSourceClassBoundClaimed:false,sourceAuthenticated:false,
    identitySubstitutionsExpanded:false,sourceGraphOrFrozenCalculusModified:false};
}
