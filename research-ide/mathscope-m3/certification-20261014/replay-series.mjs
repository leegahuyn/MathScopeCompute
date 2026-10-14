/** Offline optimization fork. Original producer and prior audit bytes are unchanged.
 * Base file: source-saved-quadratic-series-audit.mjs; SHA256 c5533368f07624d0deee0b4442bdfeb52d4c3da653cf003c86c5497911a8dc52.
 * No mathematical acceptance flags are promoted. */
/** Independent exact natural-series semantics for the saved quadratic gate.
 * A series denotes the infinite limit of the retained B.14/B.15 recurrence,
 * never a finite approximant. Termwise/chain differentiation is conditional
 * on the SAME_DATUM_ANALYTIC_AXIS B_rho existence, norm and analytic-domain
 * premises. No source derivative routine or PASS bit establishes them.
 */
import {createHash} from 'node:crypto';
import {assertSavedInitializedSource,savedInitializedSourceProgram} from '../navier/source-saved-initialized-authority.mjs';
import {assertIndependentMeanReader} from './replay-reader.mjs';

const seals=new WeakMap(),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const digest=x=>createHash('sha256').update(x).digest('hex');
const fail=(message,code='INVALID_NATURAL_SERIES_AUDIT')=>{throw Object.assign(new Error(message),{code});};
const require=(ok,message)=>{if(!ok)fail(message);};
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const sourceOperation='actual_natural_series',independentOperation='independent_exact_natural_series';
const components=['Phi','u','average'];
const names=['h','Lambda','A','D','d','L','Ustar','Hstar','Wstar','Zstar','chi','zeta','gSquared'];
const producers=freeze({
  'actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'actual-continuation-exact-core.mjs':'d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
  'actual-continuation-exact-tail.mjs':'fa569df96f7950e4c1d908405d8a30bcb73088b1e2d3af7a0baa047d4b2a3df0',
});

const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
const Q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);require(d!==0n,'A tail rational denominator is zero.');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return [n/g,d/g];};
const text=([n,d])=>d===1n?String(n):`${n}/${d}`;
const product=([a,b],[c,d])=>Q(a*c,b*d),divide=([a,b],[c,d])=>Q(a*d,b*c),minus=([a,b],[c,d])=>Q(a*d-c*b,b*d);
const power=(x,n)=>{let out=Q(1);for(let j=0;j<n;j++)out=product(out,x);return out;};
const factorial=n=>{let out=1n;for(let j=2;j<=n;j++)out*=BigInt(j);return out;};

/** Exact positive majorant. Its unproved coefficient-norm premise is explicit.
 * The decreasing ratio bound follows from m+k>=0, not a sampled sequence.
 */
export function naturalSeriesScaledTail(input={}){
  require(input&&Object.keys(input).every(k=>['degree','Y','radialOrder','etaOrder'].includes(k)),'Tail input cannot override the source norm, domain or acceptance.');
  const N=input.degree??8,k=input.radialOrder??0,m=input.etaOrder??0;
  require(integer(N)&&N<=10000&&integer(k)&&k<=12&&integer(m)&&m<=12&&N>=k,'Use N>=k, N<=10000 and exact finite derivative orders <=12.');
  const raw=input.Y??'41/10';require(typeof raw==='string'&&/^\d+(?:\/\d+)?$/.test(raw),'Y must be an exact nonnegative rational.');
  const [a,b='1']=raw.split('/'),Y=Q(a,b);require(Y[0]<=5n*Y[1],'The majorant uses 0<=Y<=5.');
  const n=N+1,ratio=product(divide(Y,Q(20)),Q(N+2+m,N+2-k));
  if(ratio[0]>=ratio[1])fail('Increase N until the complete positive tail ratio is below one.','INSUFFICIENT_DEGREE');
  const falling=factorial(n)/factorial(n-k),binomial=factorial(n+m)/(factorial(m)*factorial(n));
  const first=product(Q(factorial(m)*binomial*falling,BigInt((m+1)**2)*20n**BigInt(n)*BigInt((n+1)**2)),power(Y,n-k));
  const bound=divide(first,minus(Q(1),ratio));
  return freeze({schema:'MathScope.IndependentNaturalSeriesScaledTail/1',degree:N,Y:text(Y),radialOrder:k,etaOrder:m,
    firstTerm:text(first),ratioUpper:text(ratio),scaledTailUpper:text(bound),scale:'Q*rho^(-etaOrder)',
    coefficientNormRequired:'||(Phi,u)||_B_rho <= Q',coefficientNormProved:false,
    exactRatioIdentity:'a_(n+1)/a_n=(Y/20)*(n+m+1)/(n+1-k)*((n+1)/(n+2))^2',
    ratioBoundDecreasesBecauseMPlusKNonnegative:m+k>=0,finiteCoefficientEvaluationErrorIncluded:false,
    wholeFunctionNumericallyEvaluated:false,originalN602Complete:false});
}

function makeRule({node,core},authentication=null){
  require(typeof node==='function'&&core&&integer(core.eta)&&names.every(k=>integer(core[k])),'Retain the formal eta and every continuous natural recurrence input.');
  const base=freeze(Object.fromEntries(['eta',...names].map(k=>[k,core[k]])));
  const take=id=>{require(integer(id),'Source operands are exact nonnegative node IDs.');const n=node(id);require(n&&typeof n.op==='string'&&Array.isArray(n.args),'A natural source operand is missing.');return n;};
  require(take(base.eta).op==='coordinate','The source natural coefficient parameter must be a coordinate.');
  // Independent primitive capture walk. Bindings are checked again at import.
  // A source signature, dependency cache or serialized freeCoordinates is never
  // sufficient to claim that the actual coefficient body captures only eta.
  const inspected=new Map(),active=new Set(),supportCache=new Map();
  function support(id){
    if(supportCache.has(id))return supportCache.get(id);if(active.has(id))fail('A natural coefficient input is cyclic.','DEPENDENCY_CYCLE');active.add(id);
    const n=take(id),a=n.args;inspected.set(id,structuredClone(n));let out=new Set();
    const union=x=>{for(const c of support(x))out.add(c);};
    if(n.op==='coordinate')out.add(id);
    else if(['rational','source_parameter'].includes(n.op)){}
    else if(['add','multiply','smooth_piecewise'].includes(n.op))a.forEach(union);
    else if(['inverse','sqrt_positive','exp','log_positive','sine','cosine','integer_power','source_step_derivative'].includes(n.op))union(a[0]);
    else if(n.op==='definite_integral'){union(a[0]);out.delete(a[1]);union(a[2]);union(a[3]);}
    else fail(`The actual natural recurrence input contains unreviewed ${n.op} at source node ${id}.`,'UNRESOLVED_NATURAL_INPUT_CLOSURE');
    active.delete(id);supportCache.set(id,out);return out;
  }
  for(const k of names)require([...support(base[k])].every(id=>id===base.eta),'The actual natural coefficient input has an undeclared captured coordinate.');
  const definitionSHA256=hash({core:base,reviewedProducers:authentication?.producers??[],equations:['B.14','B.15','SAME_DATUM_ANALYTIC_AXIS (18)-(20)']});
  const readers=new WeakMap();
  const state=G=>{
    assertIndependentMeanReader(G,authentication?{expectedSourceNode:node}:undefined);
    if(!readers.has(G)){
      for(const [id,n] of inspected)G.assertSourceNodeBinding(id,n);
      const originalEta=G.importSource(base.eta),formalEta=G.put('coordinate',[`independent-natural-bound-eta:${definitionSHA256}:${G.nodes.length}`]);
      // eta is a local coefficient parameter. Renaming avoids capture when a
      // nonlinear actual eta argument contains that original source coordinate.
      const fields=Object.fromEntries(names.map(k=>[k,G.substitute(G.importSource(base[k]),originalEta,formalEta)]));
      readers.set(G,{formalEta,fields,calls:new Map(),rows:[],partialRows:[],coefficientCache:new Map(),stops:[]});
    }
    return readers.get(G);
  };
  const validate=(component,k,m)=>{require(components.includes(component)&&integer(k)&&k<=12&&integer(m)&&m<=12,'Retain a real natural component and supported finite derivative orders.');};
  function mint(G,component,Y,eta,k,m,parent=null,sourceId=null){
    validate(component,k,m);require(integer(Y)&&integer(eta),'Retain both complete actual natural arguments.');const s=state(G);
    const args=[component,Y,eta,k,m,s.formalEta,names.map(name=>s.fields[name])],id=G.put(independentOperation,args);
    const previous=s.calls.get(id),raw=JSON.stringify({op:independentOperation,args});
    if(previous)require(previous.serialized===raw,'A retained natural limit tuple changed.');
    else s.calls.set(id,{component,Y,eta,k,m,serialized:raw,derivedFrom:parent,sourceCalls:[]});
    const row=s.calls.get(id);if(sourceId!==null&&!row.sourceCalls.some(r=>r.sourceId===sourceId))row.sourceCalls.push({sourceId,node:structuredClone(take(sourceId)),actualSourceTupleAuthenticated:!!authentication});
    return id;
  }
  const call=(G,id)=>{const s=state(G),r=s.calls.get(id);require(r&&JSON.stringify(G.nodes[id])===r.serialized,'Only the unchanged independently minted exact natural limit can be audited.');return r;};
  const hypothesis=(G,r)=>{
    const s=state(G);G.registerDomainHypothesis({kind:'EXACT_NATURAL_SERIES_ANALYTIC_DOMAIN',definitionSHA256,
      sourceCalls:structuredClone(r.sourceCalls),component:r.component,actualY:r.Y,actualEta:r.eta,radialOrder:r.k,etaOrder:r.m,
      definingCoreSourceTuple:base,independentCoreOperandTuple:names.map(k=>s.fields[k]),formalCoefficientEta:s.formalEta,
      limitDefinition:'Limit_N sum_(n=k)^N (n)_k*d_eta^m(component_n)(eta)*Y^(n-k), with full B.14/B.15 recurrence',
      fixedPointExistenceRequired:true,coefficientNormRequired:'||(Phi,u)||_B_rho <= Q',rhoPositiveRequired:true,
      commonComplexParameterNeighborhoodRequired:true,actualArgumentsInAnalyticDomainRequired:true,
      termwiseDifferentiationJustifiedOnlyUnderThesePremises:true,finitePartialSumIsNotExactLimit:true,
      allPremisesDischarged:false,provedByThisAudit:false});
  };
  const importCall=(G,id)=>{
    const n=take(id);require(n.op===sourceOperation&&n.args.length===5,'Use a complete original actual_natural_series call.');
    if(authentication)G.assertSourceNodeBinding(id,n);const [c,y,e,k,m]=n.args;validate(c,k,m);
    return mint(G,c,G.importSource(y),G.importSource(e),k,m,null,id);
  };
  function differentiate(G,id,variable){
    const r=call(G,id),s=state(G);require(integer(variable)&&G.nodes[variable]?.op==='coordinate','Use an independent differentiation coordinate.');
    hypothesis(G,r);const dy=G.derivative(r.Y,variable),de=G.derivative(r.eta,variable);
    if(dy!==G.zero&&r.k===12||de!==G.zero&&r.m===12){s.stops.push({sourceCalls:structuredClone(r.sourceCalls),root:id,variable,code:'NATURAL_DERIVATIVE_ORDER_LIMIT',derivativeReturned:false});fail('The next exact natural derivative exceeds order twelve; it cannot be replaced by zero.','NATURAL_DERIVATIVE_ORDER_LIMIT');}
    const out=G.add(dy===G.zero?G.zero:G.mul(dy,mint(G,r.component,r.Y,r.eta,r.k+1,r.m,{ancestorRoot:id})),de===G.zero?G.zero:G.mul(de,mint(G,r.component,r.Y,r.eta,r.k,r.m+1,{ancestorRoot:id})));
    s.rows.push({root:id,variable,actualY:r.Y,actualEta:r.eta,dy,de,result:out,fullTwoArgumentChainRule:true,conditionalOnOriginalAnalyticDomain:true});return out;
  }
  function substitute(G,id,bound,value){const r=call(G,id);if(bound===value)return id;const y=G.substitute(r.Y,bound,value),e=G.substitute(r.eta,bound,value);if(y===r.Y&&e===r.eta)return id;return mint(G,r.component,y,e,r.k,r.m,{ancestorRoot:id,sourceAuthenticatedTuple:false});}

  /** Separate exact finite expression, explicitly marked as an approximant.
   * Recurrence and derivatives are generated using the independent reader.
   * The immutable producer is only inspected and byte-bound, never called.
   */
  function coefficients(G,N){
    const s=state(G);require(integer(N)&&N<=12,'The independent finite recurrence uses N<=12.');if(s.coefficientCache.has(N))return s.coefficientCache.get(N);
    const f=s.fields,e=s.formalEta,invLambda=G.inv(f.Lambda),invL=G.inv(f.L),phi=[G.one],u=[G.zero],R1=[],R2=[];
    const convolution=(a,b,n)=>G.add(...Array.from({length:n+1},(_,k)=>G.mul(a[k]??G.zero,b[n-k]??G.zero)));
    const derivative=rows=>rows.map(x=>G.derivative(x,e)),dot=rows=>rows.map((x,k)=>G.mul(G.q(k),x));
    for(let n=0;n<N;n++){
      const avg=u.map((x,k)=>G.div(x,G.q(k+1))),Wcorr=avg.map(x=>G.sub(G.neg(G.mul(G.q(2),f.D,e,x)),G.mul(f.d,G.derivative(x,e))));
      const W=Wcorr.map((x,k)=>G.add(G.mul(invLambda,x),k===0?f.Wstar:G.zero)),U=u.map((x,k)=>G.add(G.mul(invLambda,x),k===0?f.Ustar:G.zero)),H=u.map((x,k)=>G.add(G.mul(invLambda,f.d,x),k===0?f.Hstar:G.zero));
      const pref=Array.from({length:n+1},(_,k)=>G.add(W[k],G.mul(f.h,G.sub(k===0?G.one:G.zero,G.mul(G.q(2),e,U[k]))),G.mul(f.d,u[k],f.zeta)));
      const r1=G.mul(invL,G.add(convolution(pref,phi,n),convolution(W,dot(phi),n),convolution(H,derivative(phi),n)));
      const p=[G.zero,...Array.from({length:n},(_,k)=>G.div(G.mul(f.gSquared,convolution(phi,phi,k)),G.q(k+1)))];
      const alpha=G.add(G.mul(f.A,G.sub(G.one,G.mul(G.q(4),e,f.Ustar))),G.mul(G.q(4),f.d));
      const r2=G.mul(invL,G.add(G.mul(alpha,u[n]),G.neg(G.mul(G.q(2),f.A,e,invLambda,convolution(u,u,n))),convolution(W,dot(u),n),G.mul(f.Hstar,G.derivative(u[n],e)),G.mul(f.d,invLambda,convolution(u,derivative(u),n)),G.neg(G.mul(G.q(4),f.A,e,p[n])),G.mul(f.d,G.derivative(p[n],e)),G.neg(G.mul(G.q(2*n),e,p[n]))));
      R1.push(r1);R2.push(r2);phi.push(G.div(G.add(G.neg(G.mul(f.chi,phi[n])),G.mul(invLambda,r1)),G.q(2*(n+1)*(n+2))));
      u.push(G.div(G.add(n===0?G.neg(G.mul(invL,f.Zstar)):G.zero,G.mul(invLambda,r2)),G.q(2*(n+1)**2)));
    }
    const out=freeze({Phi:phi,u,average:u.map((x,k)=>G.div(x,G.q(k+1))),R1,R2});s.coefficientCache.set(N,out);return out;
  }
  function finitePartialSum(G,id,N){
    const r=call(G,id),s=state(G);require(integer(N)&&N>=r.k&&N<=12,'A finite partial sum must include the full requested derivative.');hypothesis(G,r);
    const rows=coefficients(G,N)[r.component];let out=G.zero;
    for(let n=r.k;n<=N;n++){let coefficient=rows[n];for(let j=0;j<r.m;j++)coefficient=G.derivative(coefficient,s.formalEta);coefficient=G.substitute(coefficient,s.formalEta,r.eta);const falling=factorial(n)/factorial(n-r.k);out=G.add(out,G.mul(G.q(falling),coefficient,G.pow(r.Y,n-r.k)));}
    s.partialRows.push({root:id,degree:N,result:out,coefficientRecurrenceFullyRetained:true,originalDerivativeRoutineCalled:false,exactFiniteExpression:true,finitePartialSumIsNotExactLimit:true,analyticTailAndEvaluationErrorsStillRequired:true});return out;
  }
  function sourceClosure(id){const n=take(id);require(n.op===sourceOperation&&n.args.length===5,'Use an actual natural source call for the closure audit.');validate(n.args[0],n.args[3],n.args[4]);return freeze({primitiveBodyClosureProved:true,actualArgumentSourceNodes:[n.args[1],n.args[2]],actualCoefficientBodyCoordinateSupport:[base.eta],sourceBodyAnalyticClassProved:false,definitionSHA256});}
  const diagnostics=G=>{
    // Diagnostics must remain readable after RESOURCE_LIMIT, including when
    // this rule was attached but never imported. Checking the private reader
    // seal/provider is read-only; initializing state would bind source nodes,
    // consume more work and conceal the original recorded stop.
    assertIndependentMeanReader(G,authentication?{expectedSourceNode:node}:undefined);
    const observed=readers.get(G),s=observed??{calls:new Map(),rows:[],partialRows:[],stops:[]};
    return {sourceOperation,independentOperation,sourceCapabilityBound:!!authentication,readerInitialized:!!observed,
    definitionSHA256,definingCoreSourceTuple:base,primitiveSourceInputCount:inspected.size,
    primitiveSourceInputsSHA256:hash([...inspected].sort(([a],[b])=>a-b)),reviewedProducerBindings:structuredClone(authentication?.producers??[]),
    calls:[...s.calls].map(([id,r])=>({id,...structuredClone(r)})),derivativeRows:structuredClone(s.rows),finitePartialRows:structuredClone(s.partialRows),stops:structuredClone(s.stops),
    completeNaturalRecurrenceRetained:true,originalDerivativeRoutineCalled:false,sourcePassBitsUsedAsProof:false,
    finiteApproximantUsedAsExactRoot:false,coefficientNormProved:false,sourceAnalyticDomainProved:false,
    newLeanKernelProof:false,originalN601Complete:false,originalN602Complete:false,completeN6:false,wholeM3Complete:false,
    existingWholeMeanAuditAutomaticallyExtended:false};};
  return freeze({sourceOperation,independentOperation,importCall,differentiate,substitute,sourceClosure,finitePartialSum,diagnostics});
}

/** Explicit unauthenticated adversarial kernel; fixture fields gain no authority. */
export function createNaturalSeriesAuditRule(options){require(options&&Object.keys(options).every(k=>['node','core'].includes(k)),'No caller domain/completion override is accepted.');return makeRule(options);}
/** Uses only the exact private saved source capability and immutable producers. */
export function attachSavedNaturalSeriesAuditAuthority(...args){
  require(args.length===1,'No caller equation, root, norm or completion override is accepted.');const [capability]=args;assertSavedInitializedSource(capability);
  const source=savedInitializedSourceProgram(capability),fixed=source.definitionCollections.filter(x=>x.namespace.endsWith('.fixed'));
  require(fixed.length===1&&fixed[0].value.core&&fixed[0].value.naturalKernel,'The complete saved natural definition must be unique.');
  const bindings=Object.entries(producers).map(([name,sha256])=>{const path='research-ide/mathscope-m2/navier/'+name,body=source.sourceText(path);require(digest(body)===sha256,'Changed natural producer bytes need a new recurrence review: '+path);return {path,sha256,bytes:Buffer.byteLength(body)};});
  const rule=makeRule({node:source.node,core:fixed[0].value.core},{capability,producers:bindings});seals.set(rule,capability);return rule;
}
export function assertSavedNaturalSeriesAuditAuthority(rule,capability){assertSavedInitializedSource(capability);require(seals.get(rule)===capability&&Object.isFrozen(rule),'Use the private exact same saved natural source authority.');return true;}
