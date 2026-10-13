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
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
// The limit dependency rules below are proofs about these inspected producer
// bytes. A changed recurrence/branch producer must be reviewed again, even if
// its serialized pass bits and function signatures have stayed the same.
const PRODUCERS=Object.freeze({
  'actual-continuation-exact-core.mjs':'d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
  'actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'actual-continuation-exact-b8.mjs':'1e0d6586a60ee5aa3d5315c40f624ebb9e8a4925a00117818d41d6697fc67baf',
  'actual-continuation-exact-global.mjs':'497e18fc52c10b9eb482bdb6cc18b406c02f453dc19663ba5535c13a41ec015f',
  'actual-continuation-exact-heat.mjs':'c999b45a6d1e18226c80fb9866b6743553f1859c67dffa39490cd25f7e13d172',
  'actual-covariance-volterra.mjs':'b5f4b9f6e7eb4dde5259bd2df319c8c56882748b2a41a353a5627c7b91ccbdc7',
  'source-global-expressions.mjs':'89904bd7441a57cf634ff7b4c579e9ee7688868d14eafd999e44f41f74f0c2d1'});
const NATURAL_SEEDS=Object.freeze(['h','j0','Lambda','sigmaStar','CSelected','A','D','d','L','Ustar','Hstar','Wstar','Zstar','chi','zeta','psi','g','gSquared','P0','P0OverPstarSquared']);

/** Unauthenticated mathematical kernel, also used for adversarial tests.
 * Free coordinate sets are conservative over-approximations. Opaque
 * tokens are never removed by integration or parameter substitution.
 * A result is not a private source certificate.
 */
export function auditExpressionFreeCoordinates({node,roots,definitions,forbidden,registries={},maxWork=200000}){
  check(typeof node==='function'&&Array.isArray(roots)&&roots.length>0&&roots.every(integer),'Explicit roots and a graph reader are required.');
  check(Array.isArray(definitions)&&Array.isArray(forbidden)&&forbidden.length>0&&forbidden.every(integer),'Explicit definitions and coordinate ids are required.');
  if(!integer(maxWork)||maxWork<1||maxWork>200000)fail('Choose a bounded work budget between 1 and 200000.','RESOURCE_LIMIT');
  const cache=new Map(),active=new Set(),visited=new Set(),accessed=new Set(),unknown=new Map(),named=new Map(),histogram={},operatorDefinitions=new Map(),operatorSupport=new Map();
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
  const fixedSupport=(kind,index,d,parameters,operands,rule,extra={})=>{
    const k=kind+':'+index;
    if(operatorSupport.has(k))return operatorSupport.get(k);
    parameters.forEach(id=>check(take(id).op==='coordinate','An exact operator parameter must be a coordinate.'));
    check(new Set(parameters).size===parameters.length&&Array.isArray(operands)&&operands.every(integer),'Keep all actual defining operands and distinct parameters.');
    const support=union(operands.map(read));
    operatorDefinitions.set(k,{kind,index,name:d.name,parameters:[...parameters],definingOperands:[...operands],
      definitionSHA256:hash(d),rule,capturedCoordinates:[...support].filter(x=>typeof x==='number'&&!parameters.includes(x)),
      unresolvedBodyTokens:[...support].filter(x=>typeof x==='string'),...extra});
    operatorSupport.set(k,support);return support;
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
    }else if(n.op==='actual_natural_series'){
      const d=registries.naturalDefinitions?.[0];
      check(a.length===5&&['Phi','u','average'].includes(a[0])&&integer(a[1])&&integer(a[2])&&integer(a[3])&&integer(a[4])&&
        d&&Array.isArray(d.parameters)&&d.parameters.length===1&&integer(d.radialParameter)&&
        !d.parameters.includes(d.radialParameter)&&take(d.radialParameter).op==='coordinate'&&
        same(d.seedNames,NATURAL_SEEDS)&&Array.isArray(d.seedRoots)&&d.seedRoots.length===NATURAL_SEEDS.length&&
        same(d.initial,[1,0,0])&&d.recurrenceProducerSHA256===PRODUCERS['actual-continuation-exact-core.mjs'],
        'The natural limit needs the complete actual seed bodies and the inspected nonlinear recurrence, including its original constant axis datum.');
      // Induction on coefficient index: the reviewed recurrence uses only
      // these seeds, earlier coefficients, finite convolutions, rational
      // operations and eta derivatives. The seeds at index zero are 1,0,0.
      // None of those operations introduces a free coordinate. Multiplying
      // by radial powers and taking the original limit adds only its radial
      // argument. Fixed radial/eta partials preserve this support on their
      // original domain. We do not assert existence/smoothness of that domain.
      const body=fixedSupport(n.op,0,d,d.parameters,d.seedRoots,'Coefficient-index induction from 1,0,0; eta differentiation and the exact radial-series limit preserve seed support.',
        {seedNames:[...d.seedNames],initial:[...d.initial],finiteSeriesSubstitutedForLimit:false});
      out=union([substituteSupport(body,d.parameters,[a[2]]),read(a[1])]);
    }else if(n.op==='actual_quadratic_root'){
      const d=registries.quadratic?.[a[0]],size=d?.rhs?.length;
      check(a.length===3&&integer(a[0])&&integer(a[1])&&integer(a[2])&&d&&integer(size)&&size>=1&&size<=5&&a[1]<size&&
        Array.isArray(d.linear)&&d.linear.length===size&&d.linear.every(r=>Array.isArray(r)&&r.length===size)&&
        Array.isArray(d.quadraticDiagonal)&&d.quadraticDiagonal.length===size&&d.quadraticDiagonal.every(r=>Array.isArray(r)&&r.length===size)&&
        Array.isArray(d.preconditioner)&&d.preconditioner.length===size&&d.preconditioner.every(r=>Array.isArray(r)&&r.length===size)&&
        Array.isArray(d.seed)&&d.seed.length===size&&d.branch==='zero-seeded contraction limit',
        'Keep the complete quadratic equation, preconditioner, initial iterate and selected limit branch.');
      check(d.seed.every(id=>{const q=take(id);return q.op==='rational'&&q.args[0]==='0';}),'The retained contraction branch must start from the actual zero vector.');
      const operands=[...d.linear.flat(),...d.quadraticDiagonal.flat(),...d.rhs,d.scale,...d.preconditioner.flat(),d.rootRadius,d.lipschitzUpper,...d.seed];
      const body=fixedSupport(n.op,a[0],d,[d.eta],operands,'Every iterate z <- z-B(Az+scale*Qdiag*z^2-rhs) uses the retained zero seed and full equation; its selected limit cannot add coordinates.',
        {dimension:size,initialIterate:[...d.seed],selectedBranch:d.branch,finiteIterateSubstitutedForRoot:false});
      out=substituteSupport(body,[d.eta],[a[2]]);
    }else if(n.op==='actual_monotone_root'){
      const d=registries.monotone?.[a[0]];
      check(integer(a[0])&&d&&Array.isArray(d.parameters)&&a.length===d.parameters.length+1&&
        integer(d.variable)&&take(d.variable).op==='coordinate'&&!d.parameters.includes(d.variable),
        'A monotone limit needs its original equation, root binder, all parameters and full bracket.');
      parameters(d.parameters);
      const operands=[d.body,d.left,d.right,d.derivativeLower,d.derivativeUpper],
        body=fixedSupport(n.op,a[0],d,[d.variable,...d.parameters],operands,
          'The selected root is the bracketed iteration z <- z-F(z)/M, starting at (left+right)/2. Only the equation root coordinate is bound; both endpoints and derivative bounds remain.');
      // The root variable is local to F, never a binder in a moving bracket.
      const support=new Set(read(d.body));support.delete(d.variable);
      for(const x of union(operands.slice(1).map(read)))support.add(x);
      out=substituteSupport(support,d.parameters,a.slice(1));
    }else if(n.op==='actual_background_picard'||n.op==='actual_background_even_profile'){
      const d=registries.picard?.[a[0]],even=n.op==='actual_background_even_profile';
      check(a.length===(even?6:5)&&integer(a[0])&&integer(a[1])&&a[1]<(even?4:6)&&a.slice(2).every(integer)&&d&&
        same(d.diagonal,[0,0,2,0,3,1])&&same(d.zeroAxisDatum,[0,0,0,0,0,0])&&
        Array.isArray(d.A0)&&d.A0.length===6&&d.A0.every(r=>Array.isArray(r)&&r.length===6)&&
        Array.isArray(d.A1)&&d.A1.length===6&&d.A1.every(r=>Array.isArray(r)&&r.length===6)&&
        Array.isArray(d.forcing)&&d.forcing.length===6&&Array.isArray(d.radialDomain)&&d.radialDomain.length===2,
        'An even/Picard profile needs all six defining rows, the original singular diagonal and zero axis datum.');
      const tailKeys=['sourceBound','sourceStrip','solutionStrip','loss','Kcondition','Kprecision','K','error','target'];
      const extra=[...Object.values(d.sourceLeading??{}),...d.radialDomain,
        ...tailKeys.filter(k=>d.tail?.[k]!==undefined).map(k=>d.tail[k]),
        ...(typeof d.solutionNorm==='number'?[d.solutionNorm]:['commonCollar','naturalExtensionToY5'].filter(k=>d.solutionNorm?.[k]!==undefined).map(k=>d.solutionNorm[k]))];
      const operands=[...d.A0.flat(),...d.A1.flat(),...d.forcing,...extra],body=fixedSupport(n.op,a[0],d,[d.xi,d.eta],operands,
        'Starting with the fixed zero axis datum, Gf and each G(A0+A1*d_eta) iterate use all six actual coefficient/forcing rows. The original limit and even composition xi=sqrt(X) preserve support.',
        {singularDiagonal:[...d.diagonal],zeroAxisDatum:[...d.zeroAxisDatum],definingRowCount:6,finitePicardSumSubstitutedForSolution:false});
      out=union([substituteSupport(body,[d.xi,d.eta],[a[2],a[3]]),read(a[2])]);
    }else if(n.op==='actual_covariance_volterra'){
      const d=registries.covariance?.[a[0]];
      check(a.length===4&&integer(a[0])&&integer(a[1])&&a[1]<2&&integer(a[2])&&Array.isArray(a[3])&&d&&
        Array.isArray(d.parameters)&&a[3].length===d.parameters.length&&integer(d.variable)&&!d.parameters.includes(d.variable)&&
        Array.isArray(d.matrix)&&d.matrix.length===2&&d.matrix.every(r=>Array.isArray(r)&&r.length===2)&&Array.isArray(d.initial)&&d.initial.length===2,
        'The actual Volterra limit needs its full noncommutative matrix, time coordinate, norm/length, every parameter and complete initial datum.');
      const operands=[...d.matrix.flat(),...d.initial,d.normUpper,d.length],body=fixedSupport(n.op,a[0],d,[d.variable,...d.parameters],operands,
        'Each ordered-integral term uses the retained full matrix and datum. Integration binds the original internal time only; evaluation adds its actual output time. The exact limit preserves that support.',
        {initial:[...d.initial],matrix:d.matrix.map(r=>[...r]),finiteVolterraSumSubstitutedForSolution:false});
      out=substituteSupport(union([body,new Set([d.variable])]),[d.variable,...d.parameters],[a[2],...a[3]]);
    }else if(n.op==='m3_global_indexed_partial'){
      const d=registries.m3GlobalFields?.[a[0]];
      check(a.length===3&&integer(a[0])&&d&&Array.isArray(d.rows)&&d.rows.length>0&&
        Array.isArray(d.directions)&&d.directions.length===3&&Array.isArray(d.directionParameterIndices)&&
        Array.isArray(a[2])&&a[2].length===3&&a[2].every(integer)&&
        d.sourceRecipe?.completeCandidateCount===d.rows.length,
        'Keep every row of the actual complete global candidate cover and its fixed-label chart directions.');
      parameters(d.parameters);
      check(same(d.directionParameterIndices,d.directions.map(x=>d.parameters.indexOf(x)))&&d.directionParameterIndices.every(integer),'Global indexed directions must be original declared parameters.');
      const key=n.op+':'+a[0];let body=operatorSupport.get(key);
      if(!body){body=new Set();const operands=[];
        for(const row of d.rows){
          tick();const local=registries.expression?.[row.localSystem];
          check(integer(row.localSystem)&&local&&row.localBody===local.body&&same(row.localParameters,local.parameters)&&
            Array.isArray(row.localDirectionIndices)&&row.localDirectionIndices.length===3&&new Set(row.localDirectionIndices).size===3&&
            row.localDirectionIndices.every(j=>integer(j)&&j<local.parameters.length)&&
            Array.isArray(row.derivativeScales)&&row.derivativeScales.length===3&&Array.isArray(row.guards),
            'Every global row needs its actual local body, full argument tuple, Jacobian scales and guards.');
          const support=substituteSupport(read(local.body),local.parameters,row.values),extra=[row.coefficient,...row.derivativeScales];
          for(const guard of row.guards){check(Array.isArray(guard)&&guard.length===3,'A global guard must retain its coordinate and both endpoints.');extra.push(...guard);}
          operands.push(local.body,...row.values,...extra);
          for(const x of union([support,...extra.map(read)]))body.add(x);
        }
        operatorDefinitions.set(key,{kind:n.op,index:a[0],name:d.name,parameters:[...d.parameters],
          definingOperands:operands,definitionSHA256:hash(d),definingRowCount:d.rows.length,
          rule:'Inspect each fixed-label actual local defining body, all arguments, coefficient, three Jacobian scales and every complete guard; sum the entire retained cover.',
          capturedCoordinates:[...body].filter(x=>typeof x==='number'&&!d.parameters.includes(x)),
          unresolvedBodyTokens:[...body].filter(x=>typeof x==='string'),labelsDifferentiated:false});operatorSupport.set(key,body);
      }
      out=substituteSupport(body,d.parameters,a[1]);
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
  return {schema:'MathScope.N6.IndependentExpressionFreeCoordinates/3',
    status:independent?'INDEPENDENCE_VERIFIED':resolved?'DEPENDENCE_NOT_EXCLUDED':'UNRESOLVED',
    independent,roots:[...roots],forbidden:[...forbidden],rows,stopReason,
    budget:{maxWork,workUsed:work},visitedNodeCount:visited.size,accessedNodeIds:[...accessed].sort((a,b)=>a-b),selectedNodesSHA256:selectedHash.digest('hex'),
    operationHistogram:histogram,unknownOperations:[...unknown.values()],namedDefinitions:[...named.values()],
    exactOperatorDefinitions:[...operatorDefinitions.values()],selectedOperatorDefinitionsSHA256:hash([...operatorDefinitions.values()]),
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
  const collection=kind=>{
    const found=source.definitionCollections.filter(r=>r.namespace.endsWith('.'+kind));
    check(found.length===1,'Every original operator registry must be uniquely source-bound: '+kind);return found[0].value;
  };
  for(const kind of ['expression','fieldDefinitions','inverseDefinitions','monotone','picard','m3GlobalFields']){
    const found=source.definitionCollections.filter(r=>r.namespace.endsWith('.'+kind));
    check(found.length===1,'Every original operator registry must be uniquely source-bound: '+kind);registries[kind]=found[0].value;
  }
  const producerBindings=Object.entries(PRODUCERS).map(([name,sha256])=>{
    const path='research-ide/'+(name==='source-global-expressions.mjs'?'mathscope-m3':'mathscope-m2')+'/navier/'+name,
      text=source.sourceText(path),observed=createHash('sha256').update(text).digest('hex');
    check(observed===sha256,'The exact limit dependency rule needs a fresh review for changed producer bytes: '+path);
    return {path,sha256,bytes:Buffer.byteLength(text)};
  });
  const fixed=collection('fixed'),core=fixed.core,kernel=fixed.naturalKernel;
  check(core&&takeCoordinate(source,core.eta)&&takeCoordinate(source,core.Y)&&kernel&&
    kernel.actualPressureRoot===core.P0&&kernel.actualPositiveGRoot===core.g&&
    kernel.coefficientImplementation==='actual-continuation-exact-core.mjs:prepareActualNaturalCoreProgram'&&
    kernel.implementation==='actual-continuation-exact-functions.mjs:materializeActualNaturalSeries',
    'The original nonlinear recurrence must keep its actual full pressure, positive g and declared formal coordinates.');
  registries.naturalDefinitions=[{name:'ActualSameN3NaturalRecurrence',parameters:[core.eta],radialParameter:core.Y,
    seedNames:[...NATURAL_SEEDS],seedRoots:NATURAL_SEEDS.map(k=>core[k]),initial:[1,0,0],
    recurrenceProducerSHA256:PRODUCERS['actual-continuation-exact-core.mjs']}];
  const zero=0;check(source.node(zero).op==='rational'&&source.node(zero).args[0]==='0','Keep the actual graph zero for every initial iterate.');
  const branches={ActualSameN3B8:'actual-continuation-exact-b8.mjs',ActualSameN3C2I1:'actual-continuation-exact-global.mjs',ActualSameN3C2I2Heat:'actual-continuation-exact-heat.mjs'};
  registries.quadratic=collection('quadratic').map(d=>{
    check(branches[d.name]&&Array.isArray(d.rhs),'An unreviewed quadratic branch cannot be silently substituted.');
    return {...d,eta:core.eta,seed:Array(d.rhs.length).fill(zero),branch:'zero-seeded contraction limit',
      branchProducerSHA256:PRODUCERS[branches[d.name]]};
  });
  registries.covariance=[];
  for(const pulse of collection('m3GlobalPulses')){
    check(integer(pulse.covariance)&&registries.covariance[pulse.covariance]===undefined&&typeof pulse.originalDefinition==='string',
      'Each covariance limit must have a unique original defining equation.');
    const d=JSON.parse(pulse.originalDefinition);
    check(pulse.variable===d.variable&&same(pulse.parameters,d.parameters)&&same(pulse.matrix,d.matrix)&&same(pulse.initial,d.initial)&&
      pulse.length===d.length&&same(d.initial,[1,0])&&pulse.left===zero,
      'Retain the unchanged original covariance matrix, time, complete parameters and e1 initial datum.');
    registries.covariance[pulse.covariance]=d;
  }
  check(registries.covariance.length>0&&registries.covariance.every(Boolean),'No original covariance index may be omitted.');
  const analysis=auditExpressionFreeCoordinates({node:source.node,roots,definitions:registry[0].value,registries,forbidden:Y,maxWork:input.maxWork??200000});
  const result=freeze({schema:'MathScope.N6.SavedFiveFastTimeAudit/2',source:structuredClone(capability.source),
    sourceBinding:{identities,Y:[...Y],oldFullPressure:before.pressure.value,newFullPressure:after.pressure.value,
      oldA0:before.pressure.cutoffRemainder,newA0:after.pressure.cutoffRemainder,
      retainedNonlinearRemainders:structuredClone(source.actualRoots.retainedRemainderDefects),reviewedLimitProducerBindings:producerBindings},analysis,
    status:analysis.status,scope:{newIndependentFastTimeZeroCheck:analysis.independent,
      fastTimeStatement:analysis.independent?'Each retained increment is independent of both fast coordinates on its original domain; hence ci*N(delta)=0 there.':null,
      originalNoAuxiliaryFlagTrusted:false,actualWholeMeanDifferenceRecomputed:false,
      smoothnessOrDomainProved:false,leanKernelChecked:false,fastTimeIntegratedIntoMeanNormCertificate:false,
      initialHaarAndPositiveIBPCutoffCompositionApplied:false,completeInitialTupleClassCertified:false,
      originalN601Complete:false,originalN602Complete:false,completeN6:false,wholeM3Complete:false}});
  seals.add(result);return result;
}
function takeCoordinate(source,id){return integer(id)&&source.node(id).op==='coordinate';}
export function assertSavedFiveFastTimeAudit(result){check(seals.has(result)&&Object.isFrozen(result),'A copied, serialized or modified record is not private source authority.');return true;}
