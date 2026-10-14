/** Offline optimization fork. Original producer and prior audit bytes are unchanged.
 * Base file: source-saved-quadratic-implicit-derivatives.mjs; SHA256 b8b137688d33a19f66de7c2e6215a1e54698ad3ff5b9a2d565edaedb8f17e126.
 * No mathematical acceptance flags are promoted. */
/** Independent implicit differentiation of a retained quadratic root.
 * The continuous equation, every coefficient/capture, and the selected
 * zero-seeded branch remain explicit. No original derivative routine,
 * historical PASS flag, approximate inverse or finite root iterate is used.
 * Existence, differentiability and a nonzero continuous Jacobian are domain
 * hypotheses. This module does not discharge an original N6 criterion.
 */
import {createHash} from 'node:crypto';
import {assertSavedInitializedSource,savedInitializedSourceProgram} from '../navier/source-saved-initialized-authority.mjs';
import {assertIndependentMeanReader} from './replay-reader.mjs';
import {createFactoredRationalVerifier} from '../navier/forced-rational-identity.mjs';

const operation='actual_quadratic_root',independentOperation='independent_implicit_quadratic_root';
const seals=new WeakMap(),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const bytesHash=x=>createHash('sha256').update(x).digest('hex');
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const fail=(message,code='INVALID_QUADRATIC_IMPLICIT_DERIVATIVE')=>{throw Object.assign(new Error(message),{code});};
const require=(ok,message)=>{if(!ok)fail(message);};
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const BRANCH='zero-seeded contraction limit';
const PRODUCERS=freeze({
  'actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'actual-continuation-exact-b8.mjs':'1e0d6586a60ee5aa3d5315c40f624ebb9e8a4925a00117818d41d6697fc67baf',
  'actual-continuation-exact-global.mjs':'497e18fc52c10b9eb482bdb6cc18b406c02f453dc19663ba5535c13a41ec015f',
  'actual-continuation-exact-heat.mjs':'c999b45a6d1e18226c80fb9866b6743553f1859c67dffa39490cd25f7e13d172',
});
const BRANCH_PRODUCERS=freeze({ActualSameN3B8:'actual-continuation-exact-b8.mjs',ActualSameN3C2I1:'actual-continuation-exact-global.mjs',ActualSameN3C2I2Heat:'actual-continuation-exact-heat.mjs'});

function makeRule({node,systems,eta,seedNode,branch},authentication=null){
  require(typeof node==='function'&&Array.isArray(systems)&&systems.length>0&&integer(eta)&&integer(seedNode),'Keep explicit equation registries, graph reader, formal eta and initial seed.');
  require(branch===BRANCH,'An unsupported root branch cannot receive this derivative rule.');
  const take=id=>{require(integer(id),'A defining quadratic operand must be an actual node ID.');const n=node(id);require(n&&typeof n.op==='string'&&Array.isArray(n.args),'A defining quadratic node is missing.');return n;};
  require(take(eta).op==='coordinate','The original quadratic parameter must be a coordinate.');
  const zero=take(seedNode);require(zero.op==='rational'&&zero.args[0]==='0'&&zero.args[1]!=='0','The selected contraction branch starts from the actual zero vector.');
  const definitions=freeze(structuredClone(systems));
  for(const d of definitions){
    const size=d?.rhs?.length;
    require(integer(size)&&size>=1&&size<=5&&['linear','quadraticDiagonal','preconditioner'].every(k=>Array.isArray(d[k])&&d[k].length===size&&d[k].every(r=>Array.isArray(r)&&r.length===size)),'Keep the entire square continuous quadratic system and its branch preconditioner.');
    [...d.linear.flat(),...d.quadraticDiagonal.flat(),...d.rhs,d.scale,...d.preconditioner.flat(),d.rootRadius,d.lipschitzUpper].forEach(take);
  }
  const readers=new WeakMap();
  const state=G=>{
    assertIndependentMeanReader(G,authentication?{expectedSourceNode:node}:undefined);
    require(typeof G.registerDomainHypothesis==='function','The independent reader must retain every unproved implicit-domain obligation.');
    if(!readers.has(G))readers.set(G,{contexts:new Map(),calls:new Map(),derivatives:new Map(),activeImports:new Set(),rows:[],stops:[]});
    return readers.get(G);
  };
  const bind=G=>{const s=state(G);if(authentication){G.assertSourceNodeBinding(eta,take(eta));G.assertSourceNodeBinding(seedNode,take(seedNode));}return s;};
  const bindNode=(G,id)=>{if(authentication)G.assertSourceNodeBinding(id,take(id));};
  const operands=(d)=>[...d.linear.flat(),...d.quadraticDiagonal.flat(),...d.rhs,d.scale,...d.preconditioner.flat(),...Array(d.rhs.length).fill(seedNode),d.rootRadius,d.lipschitzUpper];
  const unpack=(d,flat)=>{
    const n=d.rhs.length;let at=0;
    const matrix=()=>Array.from({length:n},()=>flat.slice(at,at+=n));
    const linear=matrix(),quadraticDiagonal=matrix(),rhs=flat.slice(at,at+=n),scale=flat[at++],preconditioner=matrix(),seed=flat.slice(at,at+=n),rootRadius=flat[at++],lipschitzUpper=flat[at++];
    require(at===flat.length,'The full equation and branch operand tuple was truncated.');
    return {linear,quadraticDiagonal,rhs,scale,preconditioner,seed,rootRadius,lipschitzUpper};
  };
  const context=(G,index,actualEta,flat,sourceCall=null,parent=null)=>{
    const s=state(G),d=definitions[index];require(d&&integer(actualEta)&&Array.isArray(flat)&&flat.every(integer),'Keep the complete actual quadratic argument and defining tuple.');
    const key=JSON.stringify([index,actualEta,flat]);
    if(!s.contexts.has(key))s.contexts.set(key,{index,actualEta,flat:freeze([...flat]),fields:unpack(d,flat),sourceCalls:[],derivedFrom:parent,definitionSHA256:hash(d)});
    const out=s.contexts.get(key);
    if(sourceCall&&!out.sourceCalls.some(x=>x.sourceId===sourceCall.sourceId))out.sourceCalls.push(freeze(structuredClone(sourceCall)));
    return out;
  };
  const root=(G,c,component)=>{
    const s=state(G);require(integer(component)&&component<definitions[c.index].rhs.length,'A quadratic component is outside the original vector equation.');
    const args=freeze([c.index,component,c.actualEta,c.flat]),id=G.put(independentOperation,args),serialized=JSON.stringify({op:independentOperation,args});
    const previous=s.calls.get(id);if(previous)require(previous.serialized===serialized,'An independent root lost its defining equation tuple.');
    else s.calls.set(id,{context:c,component,serialized});return id;
  };
  function importCall(G,sourceId){
    const s=bind(G),n=take(sourceId);bindNode(G,sourceId);
    require(n.op===operation&&n.args.length===3&&n.args.every(integer),'Use a complete actual quadratic source call.');
    const [index,component,actualEta]=n.args,d=definitions[index];require(d&&component<d.rhs.length,'The actual call lost its original quadratic equation.');
    if(s.activeImports.has(sourceId))fail('A quadratic defining equation recursively contains its own selected root.','DEPENDENCY_CYCLE');
    s.activeImports.add(sourceId);
    try{
      bindNode(G,actualEta);const formal=G.importSource(eta),argument=G.importSource(actualEta);
      const flat=operands(d).map(id=>{bindNode(G,id);const body=G.importSource(id);return formal===argument?body:G.substitute(body,formal,argument);});
      const c=context(G,index,argument,flat,{sourceId,sourceCall:structuredClone(n),sourceDefinitionSHA256:hash(d),actualSourceTupleAuthenticated:!!authentication});
      return root(G,c,component);
    }finally{s.activeImports.delete(sourceId);}
  }
  const call=(G,id)=>{const s=bind(G),r=s.calls.get(id);require(r&&JSON.stringify(G.nodes[id])===r.serialized,'Only an unchanged root minted from this exact equation/branch tuple can be differentiated.');return r;};
  const determinant=(G,m)=>m.length===0?G.one:m.length===1?m[0][0]:G.add(...m[0].map((v,j)=>v===G.zero?G.zero:G.mul(G.q(j%2?-1:1),v,determinant(G,m.slice(1).map(row=>row.filter((_,k)=>k!==j))))));
  function differentiate(G,id,variable){
    const r=call(G,id),s=state(G),key=`${id}:${variable}`;require(integer(variable)&&G.nodes[variable]?.op==='coordinate','Use an explicit independent differentiation coordinate.');
    if(s.derivatives.has(key))return s.derivatives.get(key);
    const c=r.context,f=c.fields,n=f.rhs.length,z=Array.from({length:n},(_,j)=>root(G,c,j));
    const jacobian=f.linear.map((row,i)=>row.map((a,j)=>G.add(a,G.mul(G.q(2),f.scale,f.quadraticDiagonal[i][j],z[j])))),det=determinant(G,jacobian);
    // Exact zero is a rejection. A nonzero polynomial result is NOT a proof
    // that this continuous Jacobian is nonzero on the original source domain.
    const exactZero=det===G.zero||createFactoredRationalVerifier(G,{maxTerms:5000,maxProducts:100000})(det).pass;
    if(exactZero)fail('The retained continuous quadratic Jacobian is exactly singular.','SINGULAR_IMPLICIT_ROOT');
    G.registerDomainHypothesis({kind:'IMPLICIT_QUADRATIC_ROOT_DOMAIN',operation:independentOperation,system:c.index,definitionSHA256:c.definitionSHA256,
      selectedBranch:BRANCH,actualEta:c.actualEta,completeEquationAndBranchOperandTuple:[...c.flat],sourceCalls:structuredClone(c.sourceCalls),
      zeroInitialVector:[...f.seed],rootRadius:f.rootRadius,lipschitzUpper:f.lipschitzUpper,preconditioner:f.preconditioner.map(x=>[...x]),
      originalBranchExistsAndIsDifferentiableRequired:true,continuousJacobianNonzeroRequired:true,jacobian:jacobian.map(x=>[...x]),determinant:det,
      equationAtSelectedRootRequired:true,preconditionerUsedAsContinuousJacobian:false,provedByThisAudit:false});
    let forcing;
    try{
      const ds=G.derivative(f.scale,variable);
      forcing=f.rhs.map((b,i)=>G.sub(G.derivative(b,variable),G.add(...z.map((value,j)=>G.add(
        G.mul(G.derivative(f.linear[i][j],variable),value),
        G.mul(ds,f.quadraticDiagonal[i][j],G.pow(value,2)),
        G.mul(f.scale,G.derivative(f.quadraticDiagonal[i][j],variable),G.pow(value,2)))))));
    }catch(error){s.stops.push({root:id,system:c.index,component:r.component,variable,code:error.code??'ERROR',reason:error.message,completeJacobianConstructed:true,derivativeReturned:false});throw error;}
    const numerator=determinant(G,jacobian.map((row,i)=>row.map((value,j)=>j===r.component?forcing[i]:value))),out=G.div(numerator,det);
    s.rows.push({root:id,system:c.index,component:r.component,variable,actualEta:c.actualEta,definitionSHA256:c.definitionSHA256,
      fullCoefficientDerivativesRetained:true,forcing:[...forcing],jacobian:jacobian.map(x=>[...x]),numerator,determinant:det,result:out,
      equation:'J*z_direction = rhs_direction - A_direction*z - scale_direction*Qdiag*z^2 - scale*Qdiag_direction*z^2',
      conditionalOnOriginalDomain:true,nonzeroJacobianProved:false});s.derivatives.set(key,out);return out;
  }
  function substitute(G,id,bound,value){
    const r=call(G,id),c=r.context;require(integer(bound)&&integer(value),'Use explicit independent substitution operands.');
    if(bound===value)return id;
    const actualEta=G.substitute(c.actualEta,bound,value),flat=c.flat.map(x=>G.substitute(x,bound,value));
    if(actualEta===c.actualEta&&flat.every((x,j)=>x===c.flat[j]))return id;
    // These are internally derived equation arguments, not a new actual
    // source call. Every capture and branch operand is substituted too.
    return root(G,context(G,c.index,actualEta,flat,null,{ancestorRoot:id,ancestorSourceCalls:structuredClone(c.sourceCalls),sourceAuthenticatedTuple:false}),r.component);
  }
  const diagnostics=G=>{
    const s=state(G);return {operation,independentOperation,sourceCapabilityBound:!!authentication,quadraticRegistrySHA256:hash(definitions),
      reviewedProducerBindings:structuredClone(authentication?.producers??[]),
      definitionBindings:definitions.map((d,index)=>({index,name:d.name,dimension:d.rhs.length,definitionSHA256:hash(d),selectedBranch:BRANCH,zeroSeedSourceNode:seedNode,
        allContinuousEquationOperands:operands(d),branchProducer:authentication?.branchBindings[index]??null})),
      calls:[...s.calls].map(([id,r])=>({id,system:r.context.index,component:r.component,actualEta:r.context.actualEta,
        completeEquationAndBranchOperandTuple:[...r.context.flat],sourceCalls:structuredClone(r.context.sourceCalls),derivedFrom:structuredClone(r.context.derivedFrom),
        actualSourceTupleAuthenticated:!!authentication&&r.context.sourceCalls.length>0&&r.context.derivedFrom===null})),
      derivativeRows:structuredClone(s.rows),stops:structuredClone(s.stops),originalDerivativeRoutineCalled:false,originalPassBitsUsedAsProof:false,
      numericIterateUsedAsRoot:false,continuousMatrixReplacedByPreconditioner:false,sourceDomainAndClassProved:false,nonsingularityProved:false,
      uniformAllOrderClassProved:false,newLeanKernelProof:false,originalN601Complete:false,originalN602Complete:false,completeN6:false,wholeM3Complete:false,wholeM4Complete:false};
  };
  return freeze({sourceOperation:operation,independentOperation,importCall,differentiate,substitute,diagnostics});
}

/** Unauthenticated mathematical kernel for explicit adversarial fixtures. */
export function createQuadraticImplicitDerivativeRule(options){
  require(options&&typeof options==='object'&&!Array.isArray(options)&&Object.keys(options).every(k=>['node','systems','eta','seedNode','branch'].includes(k)),'Only explicit unauthenticated equation/branch inputs are allowed.');
  return makeRule(options);
}

/** Attach only the original immutable source, without caller equation/root overrides. */
export function attachSavedQuadraticDerivativeAuthority(...args){
  require(args.length===1,'No caller root, equation, seed, branch or completion override is accepted.');
  const [capability]=args;assertSavedInitializedSource(capability);const source=savedInitializedSourceProgram(capability);
  const collection=kind=>{const rows=source.definitionCollections.filter(x=>x.namespace.endsWith('.'+kind));require(rows.length===1,'The saved quadratic definition registry must be unique: '+kind);return rows[0].value;};
  const systems=collection('quadratic'),fixed=collection('fixed');require(systems.length===3&&fixed.core&&integer(fixed.core.eta),'Retain all three original quadratic systems and their fixed formal eta.');
  const producers=Object.entries(PRODUCERS).map(([name,sha256])=>{const path='research-ide/mathscope-m2/navier/'+name,text=source.sourceText(path);require(bytesHash(text)===sha256,'Changed quadratic producer bytes need a separate branch/equation review: '+path);return {path,sha256,bytes:Buffer.byteLength(text)};});
  const branchBindings=systems.map((d,index)=>{require(Object.hasOwn(BRANCH_PRODUCERS,d.name),'The actual quadratic branch has not been reviewed.');return {index,name:d.name,producer:'research-ide/mathscope-m2/navier/'+BRANCH_PRODUCERS[d.name],producerSHA256:PRODUCERS[BRANCH_PRODUCERS[d.name]],selectedBranch:BRANCH,seedSourceNode:0,definitionSHA256:hash(d)};});
  const rule=makeRule({node:source.node,systems,eta:fixed.core.eta,seedNode:0,branch:BRANCH},{capability,branchBindings,producers});
  seals.set(rule,capability);return rule;
}
export function assertSavedQuadraticDerivativeAuthority(rule,capability){
  assertSavedInitializedSource(capability);require(seals.get(rule)===capability&&Object.isFrozen(rule),'Use the private quadratic adapter for the same exact saved source, not a copied rule or status record.');return true;
}
