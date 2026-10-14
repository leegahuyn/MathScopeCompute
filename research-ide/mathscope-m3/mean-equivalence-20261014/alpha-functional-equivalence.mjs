/** Binder-aware congruence for immutable saved defining operators.
 * Equality uses complete constructor keys, never names or hash equality alone.
 * A named derivative retains its exact registry/body/formals/orders/captures.
 * No existence, smoothness, implicit-root domain or limit norm is certified.
 */
import {createHash} from 'node:crypto';
import {createFactoredRationalVerifier} from '../navier/forced-rational-identity.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const error=(code,message,extra={})=>Object.assign(new Error(message),{code,...extra});
const kinds={m3_aux_expression_partial:'expressionDefinitions',actual_expression_partial:'expression',m3_aux_indexed_partial:'fieldDefinitions',m3_aux_inverse_partial:'inverseDefinitions',m3_global_indexed_partial:'m3GlobalFields'};
const primitives=new Set(['maximum','smooth_piecewise','sqrt_positive','exp','log_positive','sine','cosine','ceiling']);
export function definingRegistry(definitions,kind,index){
  const name=kinds[kind],at=kind==='m3_aux_expression_partial'?-1-index:index,d=definitions[name]?.[at];
  if(!name||!Number.isSafeInteger(at)||at<0||!d)throw error('UNBOUND_DEFINITION','The exact defining registry is missing',{kind,index});
  return {name,index:at,definition:d};
}
export function definitionCollections(header){
  const result={};const visit=x=>{for(const [key,value]of Object.entries(x)){
    if(key==='base'&&value&&typeof value==='object')visit(value);
    else if(typeof value==='string'){let d;try{d=JSON.parse(value);}catch{continue;}
      if(result[key])throw error('AMBIGUOUS_DEFINITION','Duplicate actual registry '+key);result[key]=d;}
  }};visit(header.definitions);return result;
}
export function createFunctionalAlphaNormalizer({rows,definitions,sourceNode,maxWork=300000,maxTerms=30000,maxProducts=2000000}={}){
  if(!Array.isArray(rows)||!definitions||!Number.isSafeInteger(maxWork)||maxWork<1)throw new TypeError('Explicit checkpoint, actual registries and finite budget required');
  const original=new Map(),binding=new Map();for(const row of rows){
    if(!Number.isSafeInteger(row.independentNode)||original.has(row.independentNode)||!row.node?.op||!Array.isArray(row.node.args))throw new TypeError('Malformed/duplicate checkpoint');
    if(row.nodeSHA256!==sha(row.node))throw error('CHANGED_CHECKPOINT_NODE','An operand checkpoint byte identity changed',{node:row.independentNode});
    original.set(row.independentNode,row.node);binding.set(row.independentNode,row.originalSourceNodes??[]);
  }
  const nodes=[],intern=new Map(),cache=new Map(),active=new Set(),integrals=new Map(),operatorBindings=new Map(),integralProofs=[],requiredDomains=new Map();let work=0;
  const tick=()=>{if(++work>maxWork)throw error('RESOURCE_LIMIT','Functional alpha work budget exceeded',{work,maxWork});};
  const put=(op,args)=>{tick();const key=JSON.stringify([op,args]);if(intern.has(key))return intern.get(key);const id=nodes.length;nodes.push({op,args});intern.set(key,id);return id;};
  const q=(a,b='1')=>{let n=BigInt(a),d=BigInt(b);if(!d)throw new TypeError('Zero rational denominator');if(d<0n){n=-n;d=-d;}let x=n<0n?-n:n,y=d;while(y)[x,y]=[y,x%y];return put('rational',[String(n/x),String(d/x)]);};
  const zero=q(0),one=q(1),neg=x=>mul(q(-1),x),sub=(a,b)=>a===b?zero:add(a,neg(b));
  const join=(op,xs)=>{const pending=[...xs],values=[];let num=op==='add'?0n:1n,den=1n;
    while(pending.length){const id=pending.pop(),n=nodes[id];if(n.op===op)pending.push(...n.args);
      else if(n.op==='rational'){const [a,b]=n.args.map(BigInt);if(op==='add'){num=num*b+a*den;den*=b;}else{num*=a;den*=b;}}
      else values.push(id);
    }
    if(op==='multiply'&&num===0n)return zero;const c=q(num,den);
    if(op==='add'?c!==zero:c!==one)values.push(c);values.sort((a,b)=>a-b);
    return values.length===0?(op==='add'?zero:one):values.length===1?values[0]:put(op,values);
  };
  const add=(...xs)=>join('add',xs),mul=(...xs)=>join('multiply',xs);
  const verifier=createFactoredRationalVerifier({nodes},{maxTerms,maxProducts});
  const sourceCheck=(id,op,index,values)=>{if(!sourceNode)return;const n=sourceNode(id);
    if(!n||n.op!==op||n.args[0]!==index||n.args.length!==values.length+1||values.some((value,j)=>!binding.get(value)?.includes(n.args[j+1])))throw error('CHANGED_ACTUAL_OPERATOR','The complete original call/branch/actual argument tuple changed',{sourceNode:id,expectedOperation:op,expectedIndex:index});
  };
  const visit=(id,scope=[])=>{
    tick();const key=JSON.stringify([id,scope]);if(cache.has(key))return cache.get(key);if(active.has(key))throw error('DEPENDENCY_CYCLE','Cyclic checkpoint');active.add(key);
    const n=original.get(id);if(!n)throw error('INCOMPLETE_CHECKPOINT','A real operand is absent',{node:id});const a=n.args;let out;
    if(n.op==='rational')out=q(...a);
    else if(n.op==='coordinate'){
      const at=scope.lastIndexOf(id),ids=binding.get(id);
      if(at>=0)out=put('coordinate',['bound-distance:'+String(scope.length-1-at)]);
      else{if(ids.length>1)throw error('AMBIGUOUS_FREE_COORDINATE','Distinct original free coordinate IDs were interned',{node:id,sourceIds:ids});out=put('coordinate',[ids.length?'source-coordinate:'+ids[0]:'independent-free-coordinate:'+id]);}
    }else if(n.op==='source_parameter')out=put(n.op,a);
    else if(n.op==='add')out=add(...a.map(x=>visit(x,scope)));
    else if(n.op==='multiply')out=mul(...a.map(x=>visit(x,scope)));
    else if(n.op==='inverse'){const x=visit(a[0],scope);requiredDomains.set('nonzero:'+x,{kind:'NONZERO_DENOMINATOR',normalizedOperand:x,proved:false});out=put(n.op,[x]);}
    else if(['integer_power','source_step_derivative'].includes(n.op))out=put(n.op,[visit(a[0],scope),a[1]]);
    else if(primitives.has(n.op))out=put(n.op,a.map(x=>visit(x,scope)));
    else if(n.op==='independent_defined_partial'){
      const [kind,index,values,orders,captured]=a,{name,index:at,definition:d}=definingRegistry(definitions,kind,index);
      if(!Array.isArray(d.parameters)||d.parameters.length!==values.length||!Array.isArray(orders)||!Array.isArray(captured)||new Set(d.parameters).size!==d.parameters.length)throw error('INVALID_DEFINING_SIGNATURE','Original formal parameters or captured operands changed',{node:id});
      const directions=['m3_aux_expression_partial','actual_expression_partial'].includes(kind)?d.parameters.map((_,i)=>i):d.directionParameterIndices;
      if(!Array.isArray(directions)||directions.length!==orders.length||orders.some((x,j)=>!Number.isSafeInteger(x)||x<0||d.derivativeLimits&&x>d.derivativeLimits[j]))throw error('INVALID_DERIVATIVE_ORDER','Named derivative order/direction changed',{node:id});
      // The entire immutable defining record is retained in the equality key.
      // Hashes below are only readable diagnostics, not the equality criterion.
      const record=JSON.stringify(d),token=[kind,index,name,at,record,d.parameters,directions];
      operatorBindings.set(kind+':'+index,{kind,index,registry:name,registryIndex:at,body:d.body??null,bodyRootNodeSHA256:sourceNode&&Number.isSafeInteger(d.body)?sha(sourceNode(d.body)):null,definition:d,definitionSHA256:sha(d),formalParameters:d.parameters,directionParameterIndices:directions,captureClosureRequired:true});
      for(const originalID of binding.get(id)){const sn=sourceNode?.(originalID);if(sn&&(sn.op!==kind||sn.args[0]!==index||JSON.stringify(sn.args[2])!==JSON.stringify(orders)||!Array.isArray(sn.args[1])||sn.args[1].length!==values.length||values.some((value,j)=>!binding.get(value)?.includes(sn.args[1][j]))))throw error('CHANGED_ACTUAL_OPERATOR','Actual complete named derivative argument/order binding changed',{node:id,sourceNode:originalID});}
      out=put('functional_defined_partial',[token,values.map(x=>visit(x,scope)),orders,captured.map(x=>visit(x,scope))]);
    }else if(n.op==='independent_implicit_monotone_root'){
      const [call,index,values]=a,d=definitions.monotone?.[index];if(!d||!Array.isArray(d.parameters)||d.parameters.length!==values.length)throw error('UNBOUND_IMPLICIT_BRANCH','Actual implicit registry or complete argument tuple absent',{node:id});sourceCheck(call,'actual_monotone_root',index,values);
      operatorBindings.set('monotone:'+index,{kind:'actual_monotone_root',index,sourceCall:call,exactSourceCall:sourceNode?sourceNode(call):null,definition:d,definitionSHA256:sha(d),body:d.body,bodyRootNodeSHA256:sourceNode?sha(sourceNode(d.body)):null,formalParameters:d.parameters,rootVariable:d.variable,captureAndBranchDomainRequired:true});
      out=put('functional_implicit_monotone_root',[call,index,JSON.stringify(d),values.map(x=>visit(x,scope))]);
    }else if(n.op==='definite_integral'){
      if(original.get(a[1])?.op!=='coordinate')throw new TypeError('Actual integral binder is not a coordinate');
      const body=visit(a[0],[...scope,a[1]]),left=visit(a[2],scope),right=visit(a[3],scope),bucket=JSON.stringify([left,right,scope.length]),previous=integrals.get(bucket)??[];
      for(const candidate of previous){if(body===candidate.body){out=candidate.id;integralProofs.push({leftCheckpointIntegral:id,rightCheckpointIntegral:candidate.originalID,leftBody:a[0],rightBody:candidate.originalBody,completeNormalizedBodyConstructorsEqual:true,scopeDepth:scope.length,endpointsExactlyEqual:true,validIntegralsRequired:true});break;}
        const proof=verifier(sub(body,candidate.body));if(proof.pass){out=candidate.id;integralProofs.push({leftCheckpointIntegral:id,rightCheckpointIntegral:candidate.originalID,leftBody:a[0],rightBody:candidate.originalBody,proof,scopeDepth:scope.length,endpointsExactlyEqual:true,validIntegralsRequired:true});break;}
      }
      if(out===undefined){out=put('definite_integral',[body,put('coordinate',['integral-local-bound-zero']),left,right]);previous.push({id:out,body,originalID:id,originalBody:a[0]});integrals.set(bucket,previous);}
    }else throw error('UNREVIEWED_FUNCTIONAL_ALPHA_OPERATOR','No complete semantic equality rule for '+n.op,{node:id,operation:n.op});
    active.delete(key);cache.set(key,out);return out;
  };
  return {nodes,visit,q,add,mul,sub,pow:(x,n)=>n===0?one:n===1?x:put('integer_power',[x,n]),verify:verifier,diagnostics:()=>({work,maxWork,scalarNodes:nodes.length,operatorBindings:[...operatorBindings.values()],integralProofs,domainRequirements:[...requiredDomains.values()],sameNameReplacementUsed:false,hashOnlyEqualityUsed:false,implicitBranchesIdentifiedByCallRegistryAndArguments:true,actualSourceProviderAttached:typeof sourceNode==='function',functionExistenceProved:false,allHiddenCaptureClosureProved:false})};
}
