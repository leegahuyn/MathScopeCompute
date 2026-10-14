/** Recheck the actual saved eight mean numerator equations after semantic
 * integral-binder normalization. The underlying operator existence/domain
 * assertions remain separate from congruence of their immutable definitions.
 */
import {createHash} from 'node:crypto';
import {createFunctionalAlphaNormalizer,definingRegistry} from './alpha-functional-equivalence.mjs';
import {assertSavedInitializedSource,savedInitializedSourceProgram} from '../navier/source-saved-initialized-authority.mjs';
import {assertSavedWholeMeanConditionalAudit} from '../certification-20261014/replay-mean.mjs';
import {attachSavedNaturalSeriesAuditAuthority,assertSavedNaturalSeriesAuditAuthority} from '../certification-20261014/replay-series.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const stop=(code,message,extra={})=>Object.assign(new Error(message),{code,...extra});
const unpack=x=>Array.isArray(x)?x:x?.retained;
const primitive=new Set(['add','multiply','maximum','smooth_piecewise']);
const unary=new Set(['inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling','integer_power','source_step_derivative']);

/** Expand exact defining graph edges for the particular fresh radial binders.
 * Unknown recurrence/limit operators produce explicit closure boundaries.
 * This verifies stored syntax/captures only; it cannot prove convergence.
 */
export function inspectMeanDefiningCaptures({sourceNode,definitions,operatorBindings,freshBinderSourceIDs,maxNodes=500000,maxWork=2000000,sourceCaptureRules=[]}){
  if(typeof sourceNode!=='function')return {status:'SOURCE_PROVIDER_REQUIRED',complete:false,sourceGraphExpanded:false,unknownBoundaries:[],allAnalyticDomainsProved:false};
  const targets=new Set(freshBinderSourceIDs),names=new Map(freshBinderSourceIDs.map(id=>[sourceNode(id)?.args?.[0],id])),seen=new Set(),seenDefs=new Set(),queue=[],boundaries=[],matches=[],registryRows=[],ops={},digest=createHash('sha256');let work=0,limited=null;
  const register=(key,d)=>{if(seenDefs.has(key))return;seenDefs.add(key);registryRows.push({key,definitionSHA256:hash(d),body:d.body??null,parameters:d.parameters??[]});};
  for(const b of operatorBindings){const d=b.definition;if(Number.isSafeInteger(d.body))queue.push(d.body);else boundaries.push({kind:'DEFINITION_BODY_NOT_SCALAR',binding:b.kind+':'+b.index});register(b.kind+':'+b.index,d);}
  const child=(id,n)=>{
    const a=n.args;if(['rational','source_parameter'].includes(n.op))return [];
    if(n.op==='coordinate'){if(targets.has(id)||names.has(a[0]))matches.push({sourceNode:id,name:a[0],targetSourceNode:names.get(a[0]),sameNameCaptureWouldBeUnsafe:true});return [];}
    if(primitive.has(n.op))return a;if(unary.has(n.op))return a.slice(0,1);if(n.op==='definite_integral')return a;
    if(['m3_aux_expression_partial','actual_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial','m3_global_indexed_partial'].includes(n.op)){
      const {name,index,definition:d}=definingRegistry(definitions,n.op,a[0]);register(name+':'+index,d);const out=[...a[1],...d.parameters??[]];
      if(Number.isSafeInteger(d.body))out.push(d.body);
      else if(Array.isArray(d.rows)){
        for(const row of d.rows){out.push(row.coefficient,row.localBody,...row.localParameters,...row.values,...row.guards.flat());
          if(Array.isArray(row.derivativeMaps)){for(const line of row.derivativeMaps)for(const entry of line)out.push(entry.coefficient);}
          else if(Array.isArray(row.derivativeScales))out.push(...row.derivativeScales);
          else boundaries.push({sourceNode:id,operation:n.op,definition:name+':'+index,reason:'No complete derivative map/scales in actual indexed row'});
          if(Number.isSafeInteger(row.label?.Q))out.push(row.label.Q);if(Number.isSafeInteger(row.label?.ell))out.push(row.label.ell);if(Array.isArray(row.label?.grid))out.push(...row.label.grid);
        }
      }else boundaries.push({sourceNode:id,operation:n.op,definition:name+':'+index,reason:'Complete indexed/limit defining body grammar is unavailable'});
      return out;
    }
    if(n.op==='actual_monotone_root'){
      const d=definitions.monotone?.[a[0]];if(!d)throw stop('UNBOUND_DEFINITION','Missing actual monotone registry',{sourceNode:id});register('monotone:'+a[0],d);
      return [...a.slice(1),...d.parameters,d.variable,d.body,d.left,d.right,d.derivativeLower,d.derivativeUpper];
    }
    if(n.op==='actual_quadratic_root'){
      const d=definitions.quadratic?.[a[0]];if(!d)throw stop('UNBOUND_DEFINITION','Missing actual quadratic registry',{sourceNode:id});register('quadratic:'+a[0],d);
      return [a[2],...d.linear.flat(),...d.quadraticDiagonal.flat(),...d.rhs,d.scale,...d.preconditioner.flat(),d.rootRadius,d.lipschitzUpper];
    }
    const rule=sourceCaptureRules.find(r=>r.sourceOperation===n.op);
    if(rule?.sourceClosure){const closure=rule.sourceClosure(id);if(closure.primitiveBodyClosureProved)return closure.actualArgumentSourceNodes;}
    boundaries.push({sourceNode:id,operation:n.op,exactNode:n,nodeSHA256:hash(n),reason:'Hidden coefficient/core/limit capture grammar not independently certified here'});
    if(n.op==='actual_natural_series')return a.slice(1,3);
    if(n.op==='actual_background_even_profile')return a.slice(2,4);
    return [];
  };
  while(queue.length){if(++work>maxWork||seen.size>=maxNodes){limited={code:'RESOURCE_LIMIT',maxWork,maxNodes,work,retainedSourceNodes:seen.size};break;}
    const id=queue.pop();if(seen.has(id))continue;if(!Number.isSafeInteger(id)||id<0)throw new TypeError('A source metadata value was used as a scalar');
    const n=sourceNode(id);if(!n?.op||!Array.isArray(n.args))throw stop('MISSING_SOURCE_NODE','A defining node is absent',{sourceNode:id});seen.add(id);ops[n.op]=(ops[n.op]??0)+1;digest.update(JSON.stringify([id,n])+'\n');queue.push(...child(id,n));
  }
  return {status:limited?'RESOURCE_LIMIT':matches.length?'CAPTURE_WITNESS_FOUND':boundaries.length?'HIDDEN_DEFINITION_CAPTURE_OPEN':'FRESH_BINDER_CAPTURE_ABSENCE_CERTIFIED',sourceGraphExpanded:true,complete:!limited&&!boundaries.length,allReachableReviewedNodesExcludeFreshBinders:!limited&&!matches.length,allHiddenCaptureClosureProved:!limited&&!boundaries.length&&!matches.length,sourceNodes:seen.size,work,operatorCounts:ops,expandedDefinitionCount:registryRows.length,expandedDefinitions:registryRows,expandedOrderedNodeSHA256:digest.digest('hex'),freshBinderSourceIDs,captureWitnesses:matches,unknownBoundaryCount:boundaries.length,unknownBoundaries:boundaries.slice(0,40),unknownBoundariesSHA256:hash(boundaries),limitStop:limited,allAnalyticDomainsProved:false};
}

export function compareSavedMeanFunctionalEquivalence(mean,input={}){
  if(!input||Object.keys(input).some(k=>!['definitions','sourceNode','capability','stages'].includes(k)))throw stop('INVALID_EQUIVALENCE_SCOPE','No authority/completion overrides are accepted');
  let {definitions,sourceNode,capability,stages=['temporal','moments']}=input;let actualPrivateSourceAudit=false,sourceCaptureRules=[];
  if(capability){assertSavedInitializedSource(capability);assertSavedWholeMeanConditionalAudit(mean);const source=savedInitializedSourceProgram(capability),actual={};
    if(JSON.stringify(mean.source)!==JSON.stringify(capability.source))throw stop('SOURCE_AUTHORITY_MISMATCH','Mean audit and exact source authority differ');
    for(const record of source.definitionCollections){const name=record.namespace.split('.').at(-1);if(['expressionDefinitions','expression','fieldDefinitions','inverseDefinitions','m3GlobalFields','monotone','quadratic'].includes(name)){if(actual[name])throw stop('AMBIGUOUS_DEFINITION','Actual registry repeated');actual[name]=record.value;}}
    if(sourceNode&&sourceNode!==source.node)throw stop('SOURCE_AUTHORITY_MISMATCH','Use the unchanged actual provider');
    if(definitions&&JSON.stringify(definitions)!==JSON.stringify(actual))throw stop('SOURCE_AUTHORITY_MISMATCH','Use the unchanged actual registry collections');
    definitions=actual;sourceNode=source.node;actualPrivateSourceAudit=true;
    const natural=attachSavedNaturalSeriesAuditAuthority(capability);assertSavedNaturalSeriesAuditAuthority(natural,capability);sourceCaptureRules=[natural];
  }
  if(!Array.isArray(stages)||stages.some(x=>!['temporal','moments'].includes(x))||new Set(stages).size!==stages.length)throw new TypeError('Distinct actual stages required');
  if(mean.replayStrategy!=='original'||mean.allOriginalMaximumValuesRetained!==true)throw stop('ORIGINAL_OPERANDS_REQUIRED','Use the source mean retaining every original maximum');
  const stageRows=unpack(mean.rows),rows=[],stops=[],bindingRecords=[],freshBinderIDs=new Set();
  if(!Array.isArray(stageRows)||stageRows.length!==2)throw new TypeError('Both actual source stages are required');
  for(const stage of stages){const original=stageRows.find(r=>r.stage===stage),checkpoint=mean.remainingAtomCheckpoints.find(r=>r.stage===stage)?.checkpoint;
    if(!original||!checkpoint?.completeReviewedOperandCheckpoint)throw stop('INCOMPLETE_CHECKPOINT','Actual remaining operand closure is incomplete',{stage});
    try{
      const G=createFunctionalAlphaNormalizer({rows:checkpoint.reviewedOperandRows,definitions,sourceNode}),comparisons={};
      for(const [field,old]of Object.entries(original.comparisons)){
        if(old.pass){comparisons[field]={pass:true,originalSourceVerifierPass:true,originalExactComparison:old,newAtomicEqualitiesRequired:false};continue;}
        const terms=unpack(old.numerator);if(!Array.isArray(terms)||old.numerator.omitted||terms.length!==old.numeratorMonomials)throw stop('INCOMPLETE_REMAINING_NUMERATOR','Retained actual numerator is incomplete',{stage,field});
        let expression=G.q(0);for(const term of terms){const [n,d='1']=term.coefficient.split('/');let product=G.q(n,d);
          for(const factor of term.monomial.split(',').filter(Boolean)){const [node,power]=factor.split(':').map(Number);product=G.mul(product,G.pow(G.visit(node),power));}expression=G.add(expression,product);
        }
        const proof=G.verify(expression);comparisons[field]={pass:proof.pass,originalSourceVerifierPass:false,originalNumeratorSHA256:hash(terms),originalNumeratorTerms:terms,proof,newAtomicEqualitiesRequired:true,allDenominatorConditionsRemainOpen:true};
      }
      const diagnostics=G.diagnostics();bindingRecords.push(...diagnostics.operatorBindings);
      for(const row of checkpoint.reviewedOperandRows)if(row.node.op==='coordinate'&&row.originalSourceNodes.some(x=>x>3613993)&&row.node.args[0].startsWith('n6_shifted_radial_'))for(const id of row.originalSourceNodes)freshBinderIDs.add(id);
      rows.push({stage,comparisons,integralEqualities:diagnostics.integralProofs,definingOperatorBindings:diagnostics.operatorBindings,normalization:{work:diagnostics.work,scalarNodes:diagnostics.scalarNodes,sameNameReplacementUsed:false,hashOnlyEqualityUsed:false,allFreeCoordinateIdentitiesRetained:true,allOriginalMaximumValuesRetained:true}});
    }catch(error){if(['RESOURCE_LIMIT','INCOMPLETE_CHECKPOINT','UNREVIEWED_FUNCTIONAL_ALPHA_OPERATOR','UNBOUND_DEFINITION','UNBOUND_IMPLICIT_BRANCH','AMBIGUOUS_FREE_COORDINATE'].includes(error.code))stops.push({stage,code:error.code,message:error.message,node:error.node??null,operation:error.operation??null});else throw error;}
  }
  let capture;try{capture=inspectMeanDefiningCaptures({sourceNode,definitions,operatorBindings:bindingRecords,freshBinderSourceIDs:[...freshBinderIDs],sourceCaptureRules});}catch(error){
    if(!['RESOURCE_LIMIT','UNBOUND_DEFINITION','UNRESOLVED_NATURAL_INPUT_CLOSURE','NATURAL_DERIVATIVE_ORDER_LIMIT'].includes(error.code))throw error;
    capture={status:'DEFINITION_EXPANSION_STOP',complete:false,allHiddenCaptureClosureProved:false,code:error.code,message:error.message,sourceNode:error.sourceNode??null,allAnalyticDomainsProved:false};
  }
  const matched=rows.reduce((count,row)=>count+Object.values(row.comparisons).filter(c=>c.pass).length,0),all=stages.length===2&&matched===8&&!stops.length;
  return {schema:'MathScope.N6.ActualSavedMeanFunctionalEquivalence/1',status:all?'DEFINED_SOURCE_FUNCTIONAL_MEAN_IDENTITIES_8_OF_8_ANALYTIC_PREMISES_OPEN':'SOURCE_FUNCTIONAL_MEAN_EQUIVALENCE_UNRESOLVED',source:mean.source,actualPrivateSourceAudit,matchedComparisons:matched,formalDefinedExpressionComparisonsMatched:matched,totalComparisons:8,sourceFunctionalCongruenceMatched:all,actualMathematicalIdentitiesCertified:false,rows,capture,stops,definitionExpansionActuallyPerformed:capture.sourceGraphExpanded===true,scope:{actualTemporalAndMomentsRoots:actualPrivateSourceAudit,allOriginalMaximumValuesRetained:true,oldProducerModified:false,originalDerivativeRoutineCalled:false,sameNameAtomReplacementUsed:false,hiddenDefinitionCaptureClosureProved:capture.allHiddenCaptureClosureProved===true,allSourceOperatorsWellDefinedProved:false,allImplicitRootDomainHypothesesProved:false,allIntegralLeibnizHypothesesProved:false,allNaturalLimitNormHypothesesProved:false,sourceNormAndClassCertified:false,wholeCartesianPDECertified:false,originalN601Complete:false,originalN602Complete:false,completeN6:false,originalCountsChanged:false},limitation:'Exact congruence of unchanged saved defining operators and integrals, with actual registry/body/formal/order/capture identities retained. It proves the eight numerator identities as defined expressions conditional on complete captured tuples and well-defined source operators. Actual existence/smoothness, all denominator/Leibniz/implicit/limit domains, support/class bounds and whole Cartesian PDE remain separate proof obligations. Serialized input alone cannot recreate private source authority.'};
}
