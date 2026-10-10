/** Exact additive/multiplicative identities in a source graph.
 * Transcendental and integral operands stay distinct opaque indeterminates.
 * This verifier proves polynomial cancellation, never their analytic values.
 */
import {rational as Q,qadd,qmul,qdiv,qpow,qtext,fail} from './actual-continuation-arithmetic.mjs';

export function sourceGraphPolynomialIdentity(G,expression,{maxTerms=10000}={}){
  const cache=new Map(),atoms=new Set();
  const decode=k=>new Map(k?k.split(',').map(s=>s.split(':').map(Number)):[]);
  const key=m=>[...m].filter(([,v])=>v).sort((a,b)=>a[0]-b[0]).map(a=>a.join(':')).join(',');
  const add=(a,b)=>{const c=new Map(a);for(const[k,v]of b){const w=qadd(c.get(k)??Q(0),v);if(w[0])c.set(k,w);else c.delete(k);}if(c.size>maxTerms)fail('RESOURCE_LIMIT','Exact source polynomial verification exceeded its term budget.');return c;};
  const mul=(a,b)=>{let c=new Map();for(const[ka,va]of a)for(const[kb,vb]of b){const m=decode(ka);for(const[k,v]of decode(kb))m.set(k,(m.get(k)??0)+v);c=add(c,new Map([[key(m),qmul(va,vb)]]));}return c;};
  const unit=v=>v[0]?new Map([['',v]]):new Map();
  const atom=(id,p=1)=>{atoms.add(id);return new Map([[id+':'+p,Q(1)]]);};
  const power=(p,n)=>{if(n===0)return unit(Q(1));if(n<0){if(p.size===0)fail('INVALID_SOURCE_CONSTRUCTION','The actual polynomial identity contains a negative power of zero.');if(p.size!==1)return null;const[[k,v]]=[...p];return new Map([[key(new Map([...decode(k)].map(([i,j])=>[i,j*n]))),qpow(v,n)]]);}let r=unit(Q(1)),b=p;while(n){if(n%2)r=mul(r,b);n=Math.floor(n/2);if(n)b=mul(b,b);}return r;};
  function visit(id){if(cache.has(id))return cache.get(id);const {op,args}=G.nodes[id];let p;
    if(op==='rational')p=unit(Q(...args));
    else if(op==='add')p=add(visit(args[0]),visit(args[1]));
    else if(op==='multiply')p=mul(visit(args[0]),visit(args[1]));
    else if(op==='integer_power')p=power(visit(args[0]),args[1])??atom(id);
    else if(op==='inverse')p=power(visit(args[0]),-1)??atom(id);
    else p=atom(id);
    cache.set(id,p);return p;
  }
  const polynomial=visit(expression);
  return {schema:'MathScope.SourceGraphPolynomialIdentity/1',expression,arithmetic:'exact BigInt rational Laurent polynomials; every analytic/integral operand is a distinct indeterminate',remainingMonomials:polynomial.size,
    residual:[...polynomial].slice(0,20).map(([monomial,coefficient])=>({monomial,coefficient:qtext(coefficient)})),atomicOperandCount:atoms.size,analyticValuesReplaced:false,pass:polynomial.size===0};
}

/** Exact rational-function cancellation on the actual matrix/rhs graph.
 * The listed source moment bodies are independent atoms, shared everywhere
 * they occur. General inverses are handled by clearing their denominators;
 * nonvanishing is a separate continuous-matrix/positive-scale obligation.
 */
export function sourceGraphRationalIdentity(G,expression,{atomicNodes=[],maxTerms=20000}={}){
  const fixed=new Set(atomicNodes),cache=new Map(),denominators=new Set(),atoms=new Set();
  const decode=k=>new Map(k?k.split(',').map(s=>s.split(':').map(Number)):[]),key=m=>[...m].filter(([,v])=>v).sort((a,b)=>a[0]-b[0]).map(a=>a.join(':')).join(',');
  const constant=v=>v[0]?new Map([['',v]]):new Map(),one=()=>constant(Q(1));
  const add=(a,b)=>{const c=new Map(a);for(const[k,v]of b){const w=qadd(c.get(k)??Q(0),v);if(w[0])c.set(k,w);else c.delete(k);}if(c.size>maxTerms)fail('RESOURCE_LIMIT','Actual rational identity exceeded its exact polynomial term budget.');return c;};
  const mul=(a,b)=>{let c=new Map();for(const[ka,va]of a)for(const[kb,vb]of b){const m=decode(ka);for(const[k,v]of decode(kb))m.set(k,(m.get(k)??0)+v);c=add(c,new Map([[key(m),qmul(va,vb)]]));}return c;};
  const equal=(a,b)=>a.size===b.size&&[...a].every(([k,v])=>{const w=b.get(k);return w&&v[0]===w[0]&&v[1]===w[1];});
  const product=(a,b)=>({n:mul(a.n,b.n),d:mul(a.d,b.d)});
  const sum=(a,b)=>equal(a.d,b.d)?{n:add(a.n,b.n),d:a.d}:{n:add(mul(a.n,b.d),mul(b.n,a.d)),d:mul(a.d,b.d)};
  const power=(a,n)=>{if(n<0){if(a.n.size===0)fail('INVALID_SOURCE_CONSTRUCTION','The actual identity contains a negative power of zero.');denominators.add('negative power');return power({n:a.d,d:a.n},-n);}let r={n:one(),d:one()},b=a;while(n){if(n%2)r=product(r,b);n=Math.floor(n/2);if(n)b=product(b,b);}return r;};
  const atom=id=>{atoms.add(id);return {n:new Map([[id+':1',Q(1)]]),d:one()};};
  function visit(id){if(cache.has(id))return cache.get(id);const{op,args}=G.nodes[id];let r;
    if(op==='rational')r={n:constant(Q(...args)),d:one()};
    else if(fixed.has(id))r=atom(id);
    else if(op==='add')r=sum(visit(args[0]),visit(args[1]));
    else if(op==='multiply')r=product(visit(args[0]),visit(args[1]));
    else if(op==='inverse'){const a=visit(args[0]);if(a.n.size===0)fail('INVALID_SOURCE_CONSTRUCTION','The actual identity contains a zero denominator.');denominators.add(args[0]);r={n:a.d,d:a.n};}
    else if(op==='integer_power')r=power(visit(args[0]),args[1]);
    else r=atom(id);
    cache.set(id,r);return r;
  }
  const result=visit(expression);if(result.d.size===0)fail('INVALID_SOURCE_CONSTRUCTION','The cleared actual identity has the zero denominator polynomial.');return {schema:'MathScope.ActualGraphRationalIdentity/1',expression,arithmetic:'Exact BigInt rational functions of the retained actual source operands, with explicit denominator clearing.',
    sourceAtomicNodes:[...fixed],actualAtomicOperandCount:atoms.size,denominatorOperands:[...denominators],nonzeroDenominatorProofRequired:true,
    numeratorMonomials:result.n.size,denominatorMonomials:result.d.size,analyticOperandsReplacedByNumericalValues:false,pass:result.n.size===0&&result.d.size>0};
}

/** Check the actual exterior heat chain coefficient, and keep H and H'
 * symbolic. Omitting the eta derivative is an explicit failing control. */
export function actualHeatExteriorIdentity(G,{X,eta,argument,amplitude,exponent}){
  const q=(n,d=1)=>G.q(n,d),d=G.sub(G.one,G.pow(eta,2));
  if(G.derivative(amplitude,eta)!==G.zero||G.derivative(exponent,eta)!==G.zero)fail('INVALID_SOURCE_CONSTRUCTION','The heat amplitude and homogeneity exponent must be independent of eta.');
  const coefficient=G.add(G.mul(q(-2),eta,X,G.derivative(argument,X)),G.mul(d,G.derivative(argument,eta))),check=sourceGraphPolynomialIdentity(G,coefficient);
  const omittedEta=sourceGraphPolynomialIdentity(G,G.mul(q(-2),eta,X,G.derivative(argument,X)));
  if(!check.pass||omittedEta.pass)fail('INTERNAL_VALIDATION','The actual heat chain rule or its negative control failed.');
  return {schema:'MathScope.ActualExteriorHeatIdentity/1',argument,amplitude,exponent,amplitudeEtaDerivative:G.zero,
    quantity:'Z_b [C*X^b*H(zeta)]',heatFunctionAndDerivativeKeptSymbolic:true,
    identity:'2*eta*(b*F-X*F_X)+d*F_eta = C*X^b*H_prime(zeta)*[-2*eta*X*zeta_X+d*zeta_eta]',
    chainCoefficient:coefficient,check,negativeControl:{omitted:'d*zeta_eta',check:omittedEta,correctlyRejected:!omittedEta.pass},pass:true};
}
