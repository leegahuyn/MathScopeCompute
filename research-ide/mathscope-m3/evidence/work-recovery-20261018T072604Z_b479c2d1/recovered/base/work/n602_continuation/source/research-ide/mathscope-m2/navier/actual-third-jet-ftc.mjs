/** Compact exact FTC expressions for a retained coefficient body.
 * All bodies and actual pulse-time derivatives are constructed and checked.
 * Only substitution into that already specified body is shared. The
 * resulting integral is the same functional bound, never quadrature.
 */
import {actualPulseTimeFTCNorm} from './actual-pulse-jet-source.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const cache=new WeakMap(),freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
export function retainedThirdMatrixFTCNorm(G,matrix,options){
  const {variable,length,parameters}=options??{};
  if(!Array.isArray(matrix)||!matrix.length||!matrix[0]?.length||matrix.some(row=>row?.length!==matrix[0].length||row.some(x=>!G.nodes[x])))fail('INVALID_INPUT','Supply a retained rectangular coefficient matrix.');
  let entriesByKey=cache.get(G);if(!entriesByKey){entriesByKey=new Map();cache.set(G,entriesByKey);}
  const entries=matrix.map(row=>row.map(expression=>{
    const key=JSON.stringify([expression,variable,length,parameters]);if(entriesByKey.has(key))return entriesByKey.get(key);
    const actualTimeDerivative=G.derivative(expression,variable),bodyParameters=[variable,...parameters];let system=null,sharedExpression=expression,sharedTimeDerivative=actualTimeDerivative;
    if(!G.isq(expression)){
      system=G.defineExpressionFunction({name:'ActualThirdFTCBody_'+expression,parameters:bodyParameters,body:expression});
      sharedExpression=G.expressionValue(system,bodyParameters);sharedTimeDerivative=G.derivative(sharedExpression,variable);
      if(G.materializeExpressionFunction(...G.nodes[sharedExpression].args)!==expression||G.materializeExpressionFunction(...G.nodes[sharedTimeDerivative].args)!==actualTimeDerivative)
        fail('INTERNAL_VALIDATION','A compact FTC coefficient failed its original value/time-derivative materialization.');
    }
    const bound=actualPulseTimeFTCNorm(G,sharedExpression,options),entry=freeze({...bound,originalExpression:expression,originalTimeDerivative:actualTimeDerivative,
      sharedDefinition:system,sharedExpression,sharedTimeDerivative,bodyParameters,actualBodyBinding:true,actualTimeDerivativeBinding:true,
      originalInitialSubstitutionRecipeRetained:true,sharedFunctionUnspecifiedOracle:false});entriesByKey.set(key,entry);return entry;
  }));
  const rowSums=entries.map(row=>G.add(...row.map(x=>x.upper))),upper=G.maximum(...rowSums);
  return freeze({matrix:matrix.map(row=>[...row]),entries,rowSums,upper,norm:'induced infinity norm',compactExactBodySubstitution:true,allOriginalTimeDerivativeBodiesGenerated:true,
    sourceAuthenticated:false,numericalIntegralEvaluated:false});
}

// These maps only memoize operations whose complete definitions and nodes
// are retained separately. Neither the intern lookup nor any function,
// source parameter, node, Volterra system or private seal is removed.
const memoKeys=['derivatives','substitutions','freeCoordinateCache','dependencyCache','polynomialCache','pointDerivativeCache','quadraticDerivativeCache',
  'monotoneDerivativeCache','picardDerivativeCache','naturalAxisCache','expressionMaterializations','covariancePartialSums'];
export function disposableThirdJetCacheCopy(base){
  const view={...base};for(const key of memoKeys)if(view[key] instanceof Map)view[key]=new Map();return view;
}
export function clearDisposableThirdJetCaches(graph){
  const rows=[];for(const key of memoKeys)if(graph?.[key] instanceof Map){rows.push({name:key,entries:graph[key].size});graph[key].clear();}
  return {rows,nodeCount:graph.nodes.length,internLookupRetained:true,functionAndVolterraDefinitionsRetained:true,formulasChanged:false};
}
