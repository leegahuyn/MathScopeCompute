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
export function auditExpressionFreeCoordinates({node,roots,definitions,forbidden,registries={},maxWork=200000}){
  check(typeof node==='function'&&Array.isArray(roots)&&roots.length>0&&roots.every(integer),'Explicit roots and a graph reader are required.');
  check(Array.isArray(definitions)&&Array.isArray(forbidden)&&forbidden.length>0&&forbidden.every(integer),'Explicit definitions and coordinate ids are required.');
  if(!integer(maxWork)||maxWork<1||maxWork>200000)fail('Choose a bounded work budget between 1 and 200000.','RESOURCE_LIMIT');
  const cache=new Map(),active=new Set(),visited=new Set(),accessed=new Set(),unknown=new Map(),named=new Map(),histogram={};
  check(registries&&typeof registries==='object'&&!Array.isArray(registries),'Optional definition registries must be an object.');
  for(const value of Object.values(registries))check(Array.isArray(value),'Every provided operator registry must be an array.');
  let work=0,stopReason=null;
  const tick=()=>{if(++work>maxWork)fail('Independent dependency traversal exhausted its declared work budget.','RESOURCE_LIMIT');};
  const take=id=>{check(integer(id),'A graph child must be a nonnegative node id.');accessed.add(id);const n=node(id);check(n&&typeof n.op==='string'&&Array.isArray(n.args),'A graph node is missing or malformed.');return n;};
  const union=sets=>{const out=new Set();for(const s of sets)for(const x of s)out.add(x);return out;};
  const parameters=xs=>check(Array.isArray(xs)&&new Set(xs).size===xs.length&&xs.every(x=>take(x).op==='coordinate'),'Every formal parameter must be a distinct actual coordinate.');
  const substituteSupport=(support,formals,values)=>{
    parameters(formals);check(Array.isArray(values)&&values.length===formals.length&&values.every(integer),'Use a complete simultaneous argument tuple.');
    const out=new Set();
    for(const x of support){const at=formals.indexOf(x);if(at<0)out.add(x);else for(const y of read(values[at]))out.add(y);}
    return out;
  };
  const expressionDefinition=id=>id<0?definitions[-1-id]:registries.expression?.[id];
  const recordDefinition=(kind,index,d,body)=>{
    const formals=new Set(d.parameters);
    named.set(kind+':'+index,{kind,index,name:d.name,body:d.body,parameters:[...d.parameters],
      capturedCoordinates:[...body].filter(x=>typeof x==='number'&&!formals.has(x)),
      unresolvedBodyTokens:[...body].filter(x=>typeof x==='string')});
  };
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
    }else if(n.op==='m3_aux_expression_partial'||n.op==='actual_expression_partial'){
      check(a.length===3&&Number.isSafeInteger(a[0])&&Array.isArray(a[1])&&Array.isArray(a[2])&&
        (n.op==='m3_aux_expression_partial'?a[0]<0:a[0]>=0),'Malformed named expression call.');
      const d=expressionDefinition(a[0]);
      check(d&&integer(d.body)&&Array.isArray(d.parameters)&&d.parameters.length===a[1].length&&a[2].length===a[1].length&&a[2].every(integer),'An expression definition or its derivative arity is invalid.');
      const body=read(d.body);out=substituteSupport(body,d.parameters,a[1]);recordDefinition(n.op,a[0],d,body);
    }else if(n.op==='m3_aux_indexed_partial'){
      const d=registries.fieldDefinitions?.[a[0]];
      check(a.length===3&&integer(a[0])&&d&&Array.isArray(d.rows)&&d.rows.length>0&&
        Array.isArray(d.directions)&&Array.isArray(d.directionParameterIndices)&&
        Array.isArray(a[2])&&a[2].length===d.directions.length&&a[2].every(integer),'An indexed field needs its actual finite row definition and derivative directions.');
      parameters(d.parameters);
      check(same(d.directionParameterIndices,d.directions.map(x=>d.parameters.indexOf(x)))&&d.directionParameterIndices.every(integer),'The indexed directions must refer to declared parameters.');
      const body=new Set();
      for(const row of d.rows){
        tick();const local=expressionDefinition(row.localSystem);
        check(local&&row.localBody===local.body&&same(row.localParameters,local.parameters)&&Array.isArray(row.derivativeMaps)&&
          row.derivativeMaps.length===d.directions.length&&Array.isArray(row.guards),'Keep each actual local defining body, Jacobian and guard.');
        const support=substituteSupport(read(local.body),local.parameters,row.values);
        const operands=[row.coefficient];
        for(const map of row.derivativeMaps){check(Array.isArray(map),'A derivative map must be an array.');for(const term of map){
          check(integer(term.parameter)&&term.parameter<local.parameters.length,'A Jacobian parameter is outside its original local tuple.');operands.push(term.coefficient);}}
        for(const guard of row.guards){check(Array.isArray(guard)&&guard.length===3,'A full guard must retain its coordinate and both endpoints.');operands.push(...guard);}
        for(const x of union([support,...operands.map(read)]))body.add(x);
      }
      out=substituteSupport(body,d.parameters,a[1]);recordDefinition(n.op,a[0],d,body);
    }else if(n.op==='m3_aux_inverse_partial'){
      const d=registries.inverseDefinitions?.[a[0]];
      check(a.length===3&&integer(a[0])&&d&&integer(d.body)&&Array.isArray(d.Y)&&d.Y.length===2&&new Set(d.Y).size===2&&
        Array.isArray(d.directions)&&Array.isArray(a[2])&&a[2].length===d.directions.length&&a[2].every(integer)&&
        d.operator==='(sqrt(2)-1)*partial_y0+partial_y1'&&d.finiteSumDeclaredEqualToLimit===false,
        'Retain the actual fixed Fourier inverse and its original body; no finite truncation can replace its limit.');
      parameters(d.parameters);parameters(d.Y);
      check(d.Y.every(y=>d.parameters.includes(y)&&d.directions.includes(y))&&
        same(d.directionParameterIndices,d.directions.map(x=>d.parameters.indexOf(x)))&&d.directionParameterIndices.every(integer),
        'The Fourier and derivative coordinates must be the actual declared arguments.');
      // On the domain where the original fixed zero-mode inverse exists,
      // it may depend on either output torus coordinate and every source
      // body coordinate. This is an over-approximation, NOT a tail proof.
      const body=union([read(d.body),new Set(d.Y)]);
      out=substituteSupport(body,d.parameters,a[1]);recordDefinition(n.op,a[0],d,body);
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
  for(const id of [...accessed].sort((a,b)=>a-b))selectedHash.update(JSON.stringify([id,take(id)])+'\n');
  const resolved=stopReason===null&&rows.length===roots.length&&rows.every(r=>r.unresolvedTokens.length===0),
    independent=resolved&&rows.every(r=>r.forbiddenCoordinates.length===0);
  return {schema:'MathScope.N6.IndependentExpressionFreeCoordinates/2',
    status:independent?'INDEPENDENCE_VERIFIED':resolved?'DEPENDENCE_NOT_EXCLUDED':'UNRESOLVED',
    independent,roots:[...roots],forbidden:[...forbidden],rows,stopReason,
    budget:{maxWork,workUsed:work},visitedNodeCount:visited.size,accessedNodeIds:[...accessed].sort((a,b)=>a-b),selectedNodesSHA256:selectedHash.digest('hex'),
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
  const registries={};
  for(const kind of ['expression','fieldDefinitions','inverseDefinitions']){
    const found=source.definitionCollections.filter(r=>r.namespace.endsWith('.'+kind));
    check(found.length===1,'Every original operator registry must be uniquely source-bound: '+kind);registries[kind]=found[0].value;
  }
  const analysis=auditExpressionFreeCoordinates({node:source.node,roots,definitions:registry[0].value,registries,forbidden:Y,maxWork:input.maxWork??200000});
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
