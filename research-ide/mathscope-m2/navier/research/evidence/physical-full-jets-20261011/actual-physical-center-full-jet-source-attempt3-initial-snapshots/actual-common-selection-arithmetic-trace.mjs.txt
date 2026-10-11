/** A read-only exact dependency trace of the SAME actual selector.
 * This is diagnostic source data for a subsequent numerical proof, not a
 * numeric enclosure, positivity proof, or permission to evaluate an opaque
 * integral/implicit value as zero. No graph node is appended or rewritten.
 */
import {assertActualCommonAdmissibleFamily} from './actual-common-admissible-family.mjs';
import {getPinnedSourceProfile} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const leaf=new Set(['rational','source_parameter']),unary=new Set(['inverse','exp','log_positive','sqrt_positive','ceiling','floor']);
const variadic=new Set(['add','multiply','maximum']);

export function traceExactArithmeticDependencies(G,roots,{maxNodes=250000}={}){
  if(!G||!Array.isArray(G.nodes)||!roots||typeof roots!=='object'||Array.isArray(roots)||!Number.isSafeInteger(maxNodes)||maxNodes<1)
    fail('INVALID_INPUT','Use an existing exact graph, named roots and a finite read-only node budget.');
  for(const [name,id]of Object.entries(roots))if(!name||!Number.isSafeInteger(id)||!G.nodes[id])
    fail('INVALID_INPUT','Every trace root must be an existing exact expression.');
  const visited=new Map(),boundaries=new Map(),parameters=new Set(),counts={},stack=Object.values(roots);
  while(stack.length){
    const id=stack.pop();if(visited.has(id))continue;
    if(visited.size>=maxNodes)fail('RESOURCE_LIMIT','The exact arithmetic trace exceeded its node budget; no incomplete enclosure is issued.');
    const original=G.nodes[id],node=structuredClone(original),{op,args}=node;
    if(!Array.isArray(args))fail('INVALID_SOURCE_CONSTRUCTION','An exact source node lost its operand tuple.');
    visited.set(id,{id,node});counts[op]=(counts[op]??0)+1;
    let children;
    if(leaf.has(op)){children=[];if(op==='source_parameter')parameters.add(args[0]);}
    else if(unary.has(op))children=[args[0]];
    else if(op==='integer_power')children=[args[0]];
    else if(variadic.has(op))children=args;
    else{boundaries.set(id,{id,node,reason:'Non-arithmetic original node retained without evaluation or a supplied bound.'});children=[];}
    for(const child of children){if(!Number.isSafeInteger(child)||!G.nodes[child])fail('INVALID_SOURCE_CONSTRUCTION','An arithmetic node refers to a missing operand.');stack.push(child);}
  }
  const summaries=Object.fromEntries(Object.entries(roots).map(([name,root])=>{
    const seen=new Set(),todo=[root],stops=[];
    while(todo.length){const id=todo.pop();if(seen.has(id))continue;seen.add(id);const{op,args}=visited.get(id).node;
      if(boundaries.has(id)){stops.push(id);continue;}
      if(unary.has(op)||op==='integer_power')todo.push(args[0]);else if(variadic.has(op))todo.push(...args);
    }
    return [name,{root,reachableArithmeticAndBoundaryNodes:seen.size,nonArithmeticBoundaries:stops.sort((a,b)=>a-b),
      pureArithmeticAboveSourceParameters:stops.length===0,sourceParameterValuesNotEvaluated:true}];
  }));
  return {schema:'MathScope.ExactArithmeticDependencyTrace/1',roots:structuredClone(roots),summaries,
    nodes:[...visited.values()].sort((a,b)=>a.id-b.id),nonArithmeticBoundaries:[...boundaries.values()].sort((a,b)=>a.id-b.id),
    sourceParameters:[...parameters].sort(),operationCounts:counts,nodeCount:visited.size,originalGraphNodeCount:G.nodes.length,
    readOnly:true,sourceAuthenticated:false,numericalEnclosureIssued:false,opaqueValuesReplaced:false};
}

export async function actualCommonSelectionArithmeticTrace(family,options={}){
  assertActualCommonAdmissibleFamily(family);
  if(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(k=>k!=='maxNodes'))
    fail('INVALID_INPUT','Only an arithmetic-trace node budget may be supplied.');
  const {G}=family,threshold=family.uniformCovariance.threshold,first=family.selector.rows[0],
    roots={Bnorm:family.constants.Bnorm,E:family.constants.E,Sminimum:threshold.Sminimum,ellMinimum:family.selector.ellMinimum,
      ellA:family.selector.ellA,firstLogScale:first.logScale,firstSmallBandClause:first.smallBand,firstHistoricalLogScale:first.historicalLogScale,
      originalFrequencyMinimum:threshold.frequencyMinimum};
  for(const [j,c]of first.constraints.entries()){roots['firstClause_'+j+'_bound']=c.bound;roots['firstClause_'+j+'_requiredLog']=c.requiredLog;}
  for(const [j,c]of threshold.conditions.entries())roots['thresholdCondition_'+j]=c.lower;
  for(const r of family.prepared.records.slice(1,3))for(const kind of['actual','auxiliary']){
    roots['original_'+kind+'_n'+r.order+'_C']=r.norm[kind].C;
    roots['original_'+kind+'_n'+r.order+'_solutionNorm']=r.norm[kind].solutionNorm;
  }
  const trace=traceExactArithmeticDependencies(G,roots,options),profile=getPinnedSourceProfile(),
    profileDefinitions=structuredClone(profile.parametersExactExpressions),arithmeticDataSHA256=await sha256(canonicalStringify(trace));
  return {schema:'MathScope.ActualCommonSelectionArithmeticTrace/1',sourceBinding:{sourceProfile:family.request.sourceProfile,
    parameterExpressionSHA256:family.sourceBinding.parameterExpressionSHA256,samePrivateFamily:true,readOnly:true,
    familyGraphNodeCount:family.program.nodes.length,sourcePrefixUnmodified:true},
    arithmeticDataSHA256,trace,profileDefinitions,
    selectorRows:first.constraints.map((c,j)=>({traceIndex:j,kind:c.kind,derivativeOrder:c.derivativeOrder,bound:c.bound,requiredLog:c.requiredLog})),
    scope:{actualSelectorDependenciesRecorded:true,actualNumericBnormBound:false,actualNumericEll:false,actualNumericalCiLsEpsilon:false,
      noSourceParameterOrIntegralReplaced:true,wholeGNUMComplete:false,M3Started:false}};
}
