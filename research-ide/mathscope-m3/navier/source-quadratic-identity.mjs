/** Exact rational identities over Q(sqrt(2)). The distinguished radical
 * must be the graph's literal positive square root of the rational 2.
 * Every other analytic/source expression remains its actual opaque atom.
 * This adds no equation for an arbitrary caller operand or numerical value.
 */
import {rational as Q,qadd,qmul,qdiv,qtext} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
const fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});};
const F=(a=Q(0),b=Q(0))=>[a,b],nonzero=a=>a[0][0]!==0n||a[1][0]!==0n,
  addF=(a,b)=>F(qadd(a[0],b[0]),qadd(a[1],b[1])),
  multiplyF=(a,b)=>F(qadd(qmul(a[0],b[0]),qmul(Q(2),qmul(a[1],b[1]))),qadd(qmul(a[0],b[1]),qmul(a[1],b[0]))),
  inverseF=a=>{const norm=qadd(qmul(a[0],a[0]),qmul(Q(-2),qmul(a[1],a[1])));
    if(!norm[0])fail('The exact quadratic coefficient field cannot invert zero.');
    return F(qdiv(a[0],norm),qdiv(qmul(Q(-1),a[1]),norm));},
  textF=a=>qtext(a[0])+'+('+qtext(a[1])+')*sqrt(2)';

export function createQuadraticSourceVerifier(G,{atomicNodes=[],maxTerms=30000,maxProducts=3000000}={}){
  if(!Number.isSafeInteger(maxTerms)||maxTerms<1||!Number.isSafeInteger(maxProducts)||maxProducts<1)
    fail('Declare finite exact quadratic verification budgets.','RESOURCE_LIMIT');
  const radical=G.sqrt(G.q(2));
  if(G.nodes[radical]?.op!=='sqrt_positive'||G.nodes[radical].args[0]!==G.q(2))
    fail('The quadratic relation belongs only to the literal original positive sqrt(2).');
  const fixed=new Set(atomicNodes),cache=new Map(),factors=new Map(),atoms=new Set(),denominators=new Set();let products=0;
  const decode=key=>key?key.split(',').map(s=>s.split(':').map(Number)):[],
    encode=terms=>[...terms].filter(([,n])=>n).sort(([a],[b])=>a-b).map(row=>row.join(':')).join(','),
    constant=x=>nonzero(x)?new Map([['',x]]):new Map(),one=()=>constant(F(Q(1))),
    unit=()=>({n:one(),d:new Map()}),zero=()=>({n:new Map(),d:new Map()}),
    bounded=p=>{if(p.size>maxTerms)fail('Exact quadratic numerator exceeded its monomial budget.','RESOURCE_LIMIT');return p;},
    addPoly=(a,b)=>{const out=new Map(a);for(const [key,value]of b){const sum=addF(out.get(key)??F(),value);if(nonzero(sum))out.set(key,sum);else out.delete(key);}return bounded(out);},
    scalePoly=(a,c)=>nonzero(c)?new Map([...a].map(([key,value])=>[key,multiplyF(value,c)])):new Map(),
    multiplyPoly=(a,b)=>{
      if(!a.size||!b.size)return new Map();const out=new Map();
      for(const [ka,va]of a)for(const [kb,vb]of b){
        if(++products>maxProducts)fail('Exact quadratic verification exceeded its product budget.','RESOURCE_LIMIT');
        const powers=new Map(decode(ka));for(const [id,n]of decode(kb))powers.set(id,(powers.get(id)??0)+n);
        const key=encode(powers),value=addF(out.get(key)??F(),multiplyF(va,vb));if(nonzero(value))out.set(key,value);else out.delete(key);
      }return bounded(out);
    },
    powerPoly=(a,n)=>{let out=one(),base=a;while(n){if(n%2)out=multiplyPoly(out,base);n=Math.floor(n/2);if(n)base=multiplyPoly(base,base);}return out;},
    polynomialKey=p=>[...p].sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>key+'='+textF(value)).join(';'),
    register=p=>{const key=polynomialKey(p);if(!factors.has(key))factors.set(key,p);return key;},
    factorProduct=d=>{let out=one();for(const [key,n]of d)out=multiplyPoly(out,powerPoly(factors.get(key),n));return out;},
    merge=(a,b,rule)=>{const out=new Map(a);for(const [key,n]of b)out.set(key,rule(out.get(key)??0,n));return out;};
  const split=p=>{
    if(!p.size)fail('An exact quadratic identity attempted to invert the zero polynomial.');
    let common=null;for(const [key]of p){const row=new Map(decode(key));if(common===null)common=row;else for(const [id,n]of common){
      const k=Math.min(n,row.get(id)??0);if(k)common.set(id,k);else common.delete(id);}}
    const primitive=new Map([...p].map(([key,value])=>{const row=new Map(decode(key));for(const [id,n]of common)row.set(id,(row.get(id)??0)-n);return [encode(row),value];})),
      coefficient=[...primitive].sort(([a],[b])=>a.localeCompare(b))[0][1],normalized=scalePoly(primitive,inverseF(coefficient)),d=new Map();
    for(const [id,n]of common)d.set(register(new Map([[id+':1',F(Q(1))]])),n);
    if(normalized.size!==1||!normalized.has(''))d.set(register(normalized),1);
    return {coefficient,d};
  };
  const reduce=value=>{
    if(!value.n.size)return zero();if(!value.d.size)return value;
    const s=split(value.n),remaining=new Map(s.d),denominator=new Map(value.d);let changed=false;
    for(const [key,n]of remaining){const k=Math.min(n,denominator.get(key)??0);if(!k)continue;changed=true;
      if(n===k)remaining.delete(key);else remaining.set(key,n-k);
      if(denominator.get(key)===k)denominator.delete(key);else denominator.set(key,denominator.get(key)-k);}
    return changed?{n:scalePoly(factorProduct(remaining),s.coefficient),d:denominator}:value;
  },multiply=(a,b)=>reduce({n:multiplyPoly(a.n,b.n),d:merge(a.d,b.d,(x,y)=>x+y)}),
    add=(a,b)=>{
      if(!a.n.size)return b;if(!b.n.size)return a;const d=merge(a.d,b.d,Math.max),left=new Map(),right=new Map();
      for(const [key,n]of d){if(n>(a.d.get(key)??0))left.set(key,n-(a.d.get(key)??0));if(n>(b.d.get(key)??0))right.set(key,n-(b.d.get(key)??0));}
      return reduce({n:addPoly(multiplyPoly(a.n,factorProduct(left)),multiplyPoly(b.n,factorProduct(right))),d});
    },inverse=a=>{const s=split(a.n);return reduce({n:scalePoly(factorProduct(a.d),inverseF(s.coefficient)),d:s.d});},
    power=(a,n)=>{if(!Number.isSafeInteger(n)||Math.abs(n)>1000000)fail('Exact quadratic power exceeded its finite budget.','RESOURCE_LIMIT');
      if(n<0)return power(inverse(a),-n);let out=unit(),base=a;while(n){if(n%2)out=multiply(out,base);n=Math.floor(n/2);if(n)base=multiply(base,base);}return out;},
    atom=id=>{atoms.add(id);return {n:new Map([[id+':1',F(Q(1))]]),d:new Map()};};
  const visit=id=>{
    if(cache.has(id))return cache.get(id);const node=G.nodes[id];if(!node)fail('An exact quadratic source operand is missing.');
    const {op,args}=node;let value;
    if(op==='rational')value={n:constant(F(Q(...args))),d:new Map()};
    else if(id===radical)value={n:constant(F(Q(0),Q(1))),d:new Map()};
    else if(fixed.has(id))value=atom(id);
    else if(op==='add')value=args.map(visit).reduce(add,zero());
    else if(op==='multiply')value=args.map(visit).reduce(multiply,unit());
    else if(op==='inverse'){denominators.add(args[0]);value=inverse(visit(args[0]));}
    else if(op==='integer_power'){if(args[1]<0)denominators.add(args[0]);value=power(visit(args[0]),args[1]);}
    else value=atom(id);
    cache.set(id,value);return value;
  };
  return expression=>{
    const value=visit(expression);
    return {schema:'MathScope.N6.ExactQuadraticSourceRationalIdentity/1',expression,pass:value.n.size===0,
      arithmetic:'Exact BigInt Q(sqrt(2)) polynomial numerator with factored least-common denominator.',
      originalRadical:{node:radical,square:G.q(2),positive:true,onlyDeclaredAlgebraicRelation:'sqrt(2)^2=2'},
      numeratorMonomials:value.n.size,denominatorFactors:value.d.size,
      numerator:[...value.n].slice(0,20).map(([monomial,coefficient])=>({monomial,coefficient:textF(coefficient)})),
      sourceAtomicNodes:[...fixed],actualAtomicOperandCount:atoms.size,denominatorOperands:[...denominators],
      nonzeroSourceDenominatorProofRequired:true,otherSourceRelationsAssumed:false,
      analyticOperandsReplacedByNumericalValues:false,productsUsed:products,maxProducts,maxTerms};
  };
}
