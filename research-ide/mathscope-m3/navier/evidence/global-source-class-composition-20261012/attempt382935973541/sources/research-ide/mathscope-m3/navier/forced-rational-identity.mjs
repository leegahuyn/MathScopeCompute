/** Exact rational identities with a factored common denominator.
 *
 * The old general checker multiplies different denominators when adding
 * fractions. On a shared composite normal this can grow unnecessarily as
 * n_squared appears many times. This additive checker uses their factor
 * least common multiple. It expands actual rational bodies consistently;
 * an actual source subexpression is never assigned an unrelated value.
 */
import {rational as Q,qadd,qmul,qdiv,qpow,qtext} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
const fail=(message,code='INVALID_SOURCE_CONSTRUCTION')=>{throw Object.assign(new Error(message),{code});};

export function createFactoredRationalVerifier(G,{atomicNodes=[],maxTerms=30000,maxProducts=3000000}={}){
  if(!Number.isSafeInteger(maxTerms)||maxTerms<1||!Number.isSafeInteger(maxProducts)||maxProducts<1)
    fail('Use finite exact rational-verification budgets.','RESOURCE_LIMIT');
  const fixed=new Set(atomicNodes),cache=new Map(),factors=new Map(),atoms=new Set(),nonzeroOperands=new Set();let products=0;
  const decode=key=>key?key.split(',').map(s=>s.split(':').map(Number)):[],
    encode=terms=>[...terms].filter(([,power])=>power).sort(([a],[b])=>a-b).map(row=>row.join(':')).join(','),
    constant=x=>x[0]?new Map([['',x]]):new Map(),one=()=>constant(Q(1)),
    unit=()=>({n:one(),d:new Map()}),zero=()=>({n:new Map(),d:new Map()}),
    bounded=p=>{if(p.size>maxTerms)fail('Exact factored rational verification exceeded its monomial budget.','RESOURCE_LIMIT');return p;},
    addPoly=(a,b)=>{const out=new Map(a);for(const [key,value]of b){const sum=qadd(out.get(key)??Q(0),value);if(sum[0])out.set(key,sum);else out.delete(key);}return bounded(out);},
    scalePoly=(a,c)=>c[0]?new Map([...a].map(([key,value])=>[key,qmul(value,c)])):new Map(),
    mulPoly=(a,b)=>{
      if(!a.size||!b.size)return new Map();const out=new Map();
      for(const [ka,va]of a)for(const [kb,vb]of b){
        if(++products>maxProducts)fail('Exact factored rational verification exceeded its product budget.','RESOURCE_LIMIT');
        const powers=new Map(decode(ka));for(const [id,power]of decode(kb))powers.set(id,(powers.get(id)??0)+power);
        const key=encode(powers),value=qadd(out.get(key)??Q(0),qmul(va,vb));if(value[0])out.set(key,value);else out.delete(key);
      }return bounded(out);
    },
    powPoly=(a,n)=>{let out=one(),base=a;while(n){if(n%2)out=mulPoly(out,base);n=Math.floor(n/2);if(n)base=mulPoly(base,base);}return out;},
    polynomialKey=p=>[...p].sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>key+'='+qtext(value)).join(';'),
    register=p=>{const key=polynomialKey(p);if(!factors.has(key))factors.set(key,p);return key;},
    factorProduct=d=>{let out=one();for(const [key,n]of d)out=mulPoly(out,powPoly(factors.get(key),n));return out;},
    merge=(a,b,rule)=>{const out=new Map(a);for(const [key,n]of b)out.set(key,rule(out.get(key)??0,n));return out;};
  const splitNumerator=p=>{
    if(!p.size)fail('A rational identity attempted to invert the zero polynomial.');
    let common=null;for(const [key]of p){const row=new Map(decode(key));if(common===null)common=row;else for(const [id,power]of common){const v=Math.min(power,row.get(id)??0);if(v)common.set(id,v);else common.delete(id);}}
    const primitive=new Map([...p].map(([key,value])=>{const row=new Map(decode(key));for(const [id,power]of common)row.set(id,(row.get(id)??0)-power);return [encode(row),value];})),
      coefficient=[...primitive].sort(([a],[b])=>a.localeCompare(b))[0][1],normalized=scalePoly(primitive,qdiv(Q(1),coefficient)),d=new Map();
    for(const [id,power]of common)d.set(register(new Map([[id+':1',Q(1)]])),power);
    if(normalized.size!==1||!normalized.has(''))d.set(register(normalized),1);
    return {coefficient,d};
  };
  const reduce=value=>{
    if(!value.n.size)return zero();if(!value.d.size)return value;
    // Cancel exact common monomial factors and an entire common primitive
    // numerator when available. No guessed numerical GCD is used.
    const split=splitNumerator(value.n),remaining=new Map(split.d),denominator=new Map(value.d);let changed=false;
    for(const [key,n]of remaining){const cancel=Math.min(n,denominator.get(key)??0);if(!cancel)continue;changed=true;
      if(n===cancel)remaining.delete(key);else remaining.set(key,n-cancel);
      if(denominator.get(key)===cancel)denominator.delete(key);else denominator.set(key,denominator.get(key)-cancel);
    }
    return changed?{n:scalePoly(factorProduct(remaining),split.coefficient),d:denominator}:value;
  };
  const multiply=(a,b)=>reduce({n:mulPoly(a.n,b.n),d:merge(a.d,b.d,(x,y)=>x+y)}),
    add=(a,b)=>{
      if(!a.n.size)return b;if(!b.n.size)return a;
      const d=merge(a.d,b.d,Math.max),left=new Map(),right=new Map();
      for(const [key,n]of d){if(n>(a.d.get(key)??0))left.set(key,n-(a.d.get(key)??0));if(n>(b.d.get(key)??0))right.set(key,n-(b.d.get(key)??0));}
      return reduce({n:addPoly(mulPoly(a.n,factorProduct(left)),mulPoly(b.n,factorProduct(right))),d});
    },
    inverse=a=>{const split=splitNumerator(a.n);return reduce({n:scalePoly(factorProduct(a.d),qdiv(Q(1),split.coefficient)),d:split.d});},
    power=(a,n)=>{if(!Number.isSafeInteger(n)||Math.abs(n)>1000000)fail('An integer power exceeded the exact verification budget.','RESOURCE_LIMIT');if(n<0)return power(inverse(a),-n);
      let out=unit(),base=a;while(n){if(n%2)out=multiply(out,base);n=Math.floor(n/2);if(n)base=multiply(base,base);}return out;},
    atom=id=>{atoms.add(id);return {n:new Map([[id+':1',Q(1)]]),d:new Map()};};
  const visit=id=>{
    if(cache.has(id))return cache.get(id);const node=G.nodes[id];if(!node)fail('An exact rational operand is absent from the source graph.');
    const {op,args}=node;let result;
    if(op==='rational')result={n:constant(Q(...args)),d:new Map()};
    else if(fixed.has(id))result=atom(id);
    else if(op==='add')result=args.map(visit).reduce(add,zero());
    else if(op==='multiply')result=args.map(visit).reduce(multiply,unit());
    else if(op==='inverse'){nonzeroOperands.add(args[0]);result=inverse(visit(args[0]));}
    else if(op==='integer_power'){if(args[1]<0)nonzeroOperands.add(args[0]);result=power(visit(args[0]),args[1]);}
    else result=atom(id);
    cache.set(id,result);return result;
  };
  return expression=>{
    const value=visit(expression);
    return {schema:'MathScope.N6.FactoredSourceRationalIdentity/1',expression,pass:value.n.size===0,
      arithmetic:'Exact BigInt rational polynomial numerator and factored least-common denominator; all source rational bodies retained.',
      numeratorMonomials:value.n.size,denominatorFactors:value.d.size,
      numerator:[...value.n].slice(0,20).map(([monomial,coefficient])=>({monomial,coefficient:qtext(coefficient)})),
      sourceAtomicNodes:[...fixed],actualAtomicOperandCount:atoms.size,nonzeroDenominatorProofRequired:true,
      denominatorOperands:[...nonzeroOperands],analyticOperandsReplacedByNumericalValues:false,
      compositeSourceOperandsArtificiallyIndependent:false,productsUsed:products,maxProducts,maxTerms};
  };
}
