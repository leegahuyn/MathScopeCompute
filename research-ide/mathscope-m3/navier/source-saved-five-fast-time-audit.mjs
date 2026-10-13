/** Independent, fail-closed free-coordinate audit of the saved five-map.
 * This does not trust the old freeCoordinates() implementation or its
 * recorded pass bit. Named expression bodies are inspected, not just
 * their argument lists. Unknown operations cannot produce a proof.
 * No whole mean equation, differentiability class or N6 item is closed.
 */
import {createHash} from 'node:crypto';
import {assertSavedInitializedSource,savedInitializedSourceProgram} from './source-saved-initialized-authority.mjs';
import {assertSavedInitializedCutoffAuthority} from './source-saved-initialized-cutoff-norms.mjs';

const seals=new WeakSet(),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=(message,code='INVALID_FAST_TIME_AUDIT')=>{throw Object.assign(new Error(message),{code});};
const check=(yes,message)=>{if(!yes)fail(message);};
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const integer=x=>Number.isSafeInteger(x)&&x>=0;

/** Unauthenticated mathematical kernel, also used for adversarial tests.
 * Free coordinate sets are conservative over-approximations. Opaque
 * tokens are never removed by integration or parameter substitution.
 * A result is not a private source certificate.
 */
export function auditExpressionFreeCoordinates({node,roots,definitions,forbidden,maxWork=200000}){
  check(typeof node==='function'&&Array.isArray(roots)&&roots.length>0&&roots.every(integer),'Explicit roots and a graph reader are required.');
  check(Array.isArray(definitions)&&Array.isArray(forbidden)&&forbidden.length>0&&forbidden.every(integer),'Explicit definitions and coordinate ids are required.');
  if(!integer(maxWork)||maxWork<1||maxWork>200000)fail('Choose a bounded work budget between 1 and 200000.','RESOURCE_LIMIT');
  const cache=new Map(),active=new Set(),visited=new Set(),unknown=new Map(),named=new Map(),histogram={};
  let work=0,stopReason=null;
  const tick=()=>{if(++work>maxWork)fail('Independent dependency traversal exhausted its declared work budget.','RESOURCE_LIMIT');};
  const take=id=>{check(integer(id),'A graph child must be a nonnegative node id.');const n=node(id);check(n&&typeof n.op==='string'&&Array.isArray(n.args),'A graph node is missing or malformed.');return n;};
  const union=sets=>{const out=new Set();for(const s of sets)for(const x of s)out.add(x);return out;};
  const read=id=>{
    if(cache.has(id))return cache.get(id);
    tick();if(active.has(id))fail('Cyclic expression or definition dependency.','DEPENDENCY_CYCLE');
    active.add(id);visited.add(id);
    const n=take(id),a=n.args;histogram[n.op]=(histogram[n.op]??0)+1;
    let out;
    if(n.op==='coordinate')out=new Set([id]);
    else if(n.op==='rational'||n.op==='source_parameter')out=new Set();
    else if(['add','multiply','maximum','smooth_piecewise'].includes(n.op))out=union(a.map(read));
    else if(['inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling','integer_power','source_step_derivative'].includes(n.op)){
      check(a.length>=1,'A unary expression is missing its operand.');out=new Set(read(a[0]));
    }else if(n.op==='definite_integral'){
      check(a.length===4&&take(a[1]).op==='coordinate','An integral must have an actual coordinate binder.');
      out=new Set(read(a[0]));out.delete(a[1]);
      for(const x of union([read(a[2]),read(a[3])]))out.add(x);
    }else if(n.op==='m3_aux_expression_partial'){
      check(a.length===3&&Number.isSafeInteger(a[0])&&a[0]<0&&Array.isArray(a[1])&&Array.isArray(a[2]),'Malformed named expression call.');
      const index=-1-a[0],d=definitions[index];
      check(d&&Array.isArray(d.parameters)&&integer(d.body)&&d.parameters.length===a[1].length&&a[2].length===a[1].length&&a[2].every(integer)&&new Set(d.parameters).size===d.parameters.length,'An expression definition or its derivative arity is invalid.');
      const body=read(d.body),formals=new Set(d.parameters);out=new Set();
      for(const x of body){
        const at=d.parameters.indexOf(x);
        if(at>=0){for(const y of read(a[1][at]))out.add(y);}
        else out.add(x);
      }
      named.set(index,{index,name:d.name,body:d.body,parameters:[...d.parameters],
        capturedCoordinates:[...body].filter(x=>typeof x==='number'&&!formals.has(x)),
        unresolvedBodyTokens:[...body].filter(x=>typeof x==='string')});
    }else{
      const token='UNSUPPORTED:'+n.op+':'+id;
      out=new Set([token]);unknown.set(id,{id,op:n.op,args:structuredClone(a)});
    }
    active.delete(id);cache.set(id,out);return out;
  };
  const rows=[];
  try{
    for(const root of roots){const s=read(root);rows.push({root,freeCoordinates:[...s].filter(x=>typeof x==='number').sort((a,b)=>a-b),
      unresolvedTokens:[...s].filter(x=>typeof x==='string').sort(),forbiddenCoordinates:forbidden.filter(x=>s.has(x))});}
  }catch(error){
    if(!['RESOURCE_LIMIT','DEPENDENCY_CYCLE'].includes(error.code))throw error;
    stopReason=error.code;
  }
  const selectedHash=createHash('sha256');
  for(const id of [...visited].sort((a,b)=>a-b))selectedHash.update(JSON.stringify([id,take(id)])+'\n');
  const resolved=stopReason===null&&rows.length===roots.length&&rows.every(r=>r.unresolvedTokens.length===0),
    independent=resolved&&rows.every(r=>r.forbiddenCoordinates.length===0);
  return {schema:'MathScope.N6.IndependentExpressionFreeCoordinates/1',
    status:independent?'INDEPENDENCE_VERIFIED':resolved?'DEPENDENCE_NOT_EXCLUDED':'UNRESOLVED',
    independent,roots:[...roots],forbidden:[...forbidden],rows,stopReason,
    budget:{maxWork,workUsed:work},visitedNodeCount:visited.size,selectedNodesSHA256:selectedHash.digest('hex'),
    operationHistogram:histogram,unknownOperations:[...unknown.values()],namedDefinitions:[...named.values()],
    sourceAuthenticated:false,oldFreeCoordinateRoutineCalled:false,oldRecordedPassBitRead:false,
    negativeResultIsNotACounterexample:true};
}

function actualIncrement(source,updated,previous){
  const memo=new Map();
  const terms=id=>{if(memo.has(id))return memo.get(id);const n=source.node(id);
    const out=n.op==='rational'&&n.args[0]==='0'?[]:n.op==='add'?n.args.flatMap(terms):[id];memo.set(id,out);return out;};
  const old=terms(previous),rest=[...terms(updated)];
  for(const id of old){const at=rest.indexOf(id);check(at>=0,'The updated mean has lost an original summand.');rest.splice(at,1);}
  check(rest.length===1,'The complete saved increment must be one retained summand.');
  return {previous,increment:rest[0],updated,oldTerms:[...old],newTerms:[...terms(updated)]};
}

/** Source binding accepts only the two private original authorities. */
export function auditSavedFiveFastTime(capability,cutoff,input={}){
  assertSavedInitializedSource(capability);assertSavedInitializedCutoffAuthority(cutoff);
  check(input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).every(k=>k==='maxWork'),'Only a finite work budget may be supplied.');
  const source=savedInitializedSourceProgram(capability),before=source.mean.stages.temporal,after=source.mean.stages.moments;
  check(same(cutoff.source,capability.source)&&same(cutoff.actualRoots,source.actualRoots),'The cutoff must belong to the same exact saved source.');
  check(cutoff.bodies.pressureRows[0].pressure===before.pressure.value&&cutoff.bodies.pressureRows[1].pressure===after.pressure.value,'Both complete latest pressure bodies must remain bound.');
  check(source.mean.nonlinear.remaindersDeclaredZero===false,'The original nonzero remainders must remain.');
  const registry=source.definitionCollections.filter(r=>r.namespace.endsWith('.expressionDefinitions'));
  check(registry.length===1,'The actual expression definition registry must be unique.');
  const identities=Object.fromEntries(['beta','v','gamma'].map(k=>[k,actualIncrement(source,after.velocity[k],before.velocity[k])])),
    roots=Object.values(identities).map(r=>r.increment),Y=cutoff.bodies.geometry.Y;
  check(Array.isArray(Y)&&Y.length===2&&Y.every(id=>source.node(id).op==='coordinate'),'Two actual fast torus coordinates are required.');
  check(identities.beta.increment===source.mean.potential.deltaBeta&&identities.gamma.increment===source.mean.potential.gammaDesired,'Keep the original potential and axial increments.');
  const analysis=auditExpressionFreeCoordinates({node:source.node,roots,definitions:registry[0].value,forbidden:Y,maxWork:input.maxWork??200000});
  const result=freeze({schema:'MathScope.N6.SavedFiveFastTimeAudit/1',source:structuredClone(capability.source),
    sourceBinding:{identities,Y:[...Y],oldFullPressure:before.pressure.value,newFullPressure:after.pressure.value,
      oldA0:before.pressure.cutoffRemainder,newA0:after.pressure.cutoffRemainder,
      retainedNonlinearRemainders:structuredClone(source.actualRoots.retainedRemainderDefects)},analysis,
    status:analysis.status,scope:{newIndependentFastTimeZeroCheck:analysis.independent,
      fastTimeStatement:analysis.independent?'Each retained increment is independent of both fast coordinates on its original domain; hence ci*N(delta)=0 there.':null,
      originalNoAuxiliaryFlagTrusted:false,actualWholeMeanDifferenceRecomputed:false,
      smoothnessOrDomainProved:false,leanKernelChecked:false,fastTimeIntegratedIntoMeanNormCertificate:false,
      initialHaarAndPositiveIBPCutoffCompositionApplied:false,completeInitialTupleClassCertified:false,
      originalN601Complete:false,originalN602Complete:false,completeN6:false,wholeM3Complete:false}});
  seals.add(result);return result;
}
export function assertSavedFiveFastTimeAudit(result){check(seals.has(result)&&Object.isFrozen(result),'A copied, serialized or modified record is not private source authority.');return true;}
