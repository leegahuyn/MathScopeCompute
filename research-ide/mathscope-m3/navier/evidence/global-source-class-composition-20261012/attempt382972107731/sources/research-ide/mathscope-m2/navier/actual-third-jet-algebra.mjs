/** Exact algebra audits on fully specified body shares.
 * A share is never an oracle: every generated derivative is materialized
 * and compared with direct AD of the retained body. The local symbols
 * only prevent a rational identity checker from repeatedly expanding an
 * already retained integral or common denominator.
 */
import {differentiatedThirdScalarJet} from './actual-pulse-third-jet-kernel.mjs';
import {sourceGraphPolynomialIdentity} from './actual-continuation-exact-identities.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const bindings=new WeakMap(),freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
export function retainedThirdBodyBinding(G,body,directions){
  let cache=bindings.get(G);if(!cache){cache=new Map();bindings.set(G,cache);}
  const key=JSON.stringify([body,directions]);if(cache.has(key))return cache.get(key);
  const direct=differentiatedThirdScalarJet(G,body,directions),free=G.freeCoordinates(body),parameters=[...directions.filter(x=>free.has(x)),...[...free].filter(x=>!directions.includes(x)).sort((a,b)=>a-b)];
  const system=parameters.length?G.defineExpressionFunction({name:'RetainedThirdAuditBody_'+body,parameters,body}):null,value=system===null?body:G.expressionValue(system,parameters),formal=differentiatedThirdScalarJet(G,value,directions);
  const materialized=formal.roots.map(id=>G.nodes[id].op==='actual_expression_partial'&&G.nodes[id].args[0]===system?G.materializeExpressionFunction(...G.nodes[id].args):id);
  const checks=direct.indices.map((orders,i)=>({orders,retained:direct.roots[i],materialized:materialized[i],pass:direct.roots[i]===materialized[i]}));
  if(checks.some(x=>!x.pass))fail('INTERNAL_VALIDATION','A fully specified third-jet share failed to materialize to its retained body derivative.');
  const result=freeze({body,system,parameters,value,indices:direct.indices,roots:formal.roots,directRoots:direct.roots,materialized,checks,pass:true,unspecifiedOracle:false,sourceAuthenticated:false});
  cache.set(key,result);return result;
}

/** Only the newly declared audit shares are expanded. Original analytic
 * source operations remain the exact operations they already were. */
export function instantiateRetainedThirdBodies(G,expression,bodyBindings){
  const local=new Set(bodyBindings.map(b=>b.system).filter(x=>x!==null)),cache=new Map();
  function visit(id){
    if(cache.has(id))return cache.get(id);const n=G.nodes[id];let value=id;
    if(n.op==='actual_expression_partial'&&local.has(n.args[0]))value=G.materializeExpressionFunction(...n.args);
    else if(n.op==='add')value=G.add(...n.args.map(visit));
    else if(n.op==='multiply')value=G.mul(...n.args.map(visit));
    else if(n.op==='inverse')value=G.inv(visit(n.args[0]));
    else if(n.op==='integer_power')value=G.pow(visit(n.args[0]),n.args[1]);
    else if(n.op==='sqrt_positive')value=G.sqrt(visit(n.args[0]));
    cache.set(id,value);return value;
  }
  return visit(expression);
}

/** Clear a finite list of common, retained nonzero denominators once.
 * Addition uses componentwise maximum powers, not their repeated product.
 * The final exact polynomial identity expands the ORIGINAL denominator
 * bodies. No relation between invented independent symbols is assumed. */
export function retainedCommonDenominatorIdentity(G,left,right,{denominators=[],maxTerms=160000}={}){
  if(!Array.isArray(denominators)||new Set(denominators).size!==denominators.length||denominators.some(x=>!G.nodes[x]))fail('INVALID_INPUT','Use distinct retained common denominator bodies.');
  const count=denominators.length,zeros=()=>Array(count).fill(0),cache=new Map(),powers=new Map(),power=(id,n)=>{const k=id+':'+n;if(!powers.has(k))powers.set(k,G.pow(id,n));return powers.get(k);};
  const fraction=(n,p=zeros())=>({n,p}),scale=(n,p)=>G.mul(n,...p.map((k,j)=>power(denominators[j],k))),sum=(a,b)=>{
    const p=a.p.map((x,i)=>Math.max(x,b.p[i]));return fraction(G.add(scale(a.n,p.map((x,i)=>x-a.p[i])),scale(b.n,p.map((x,i)=>x-b.p[i]))),p);
  },product=(a,b)=>fraction(G.mul(a.n,b.n),a.p.map((x,i)=>x+b.p[i])),raise=(a,n)=>fraction(power(a.n,n),a.p.map(x=>x*n));
  function reciprocal(id){
    const at=denominators.indexOf(id);if(at>=0){const p=zeros();p[at]=1;return fraction(G.one,p);}
    const n=G.nodes[id];
    if(n.op==='rational')return fraction(G.inv(id));
    if(n.op==='multiply')return product(reciprocal(n.args[0]),reciprocal(n.args[1]));
    if(n.op==='integer_power')return raise(reciprocal(n.args[0]),n.args[1]);
    if(n.op==='inverse')return visit(n.args[0]);
    fail('INVALID_INPUT','An unlisted denominator appeared in the retained common-denominator identity.');
  }
  function visit(id){
    if(cache.has(id))return cache.get(id);const n=G.nodes[id];let value;
    if(n.op==='add')value=sum(visit(n.args[0]),visit(n.args[1]));
    else if(n.op==='multiply')value=product(visit(n.args[0]),visit(n.args[1]));
    else if(n.op==='inverse')value=reciprocal(n.args[0]);
    else if(n.op==='integer_power')value=raise(visit(n.args[0]),n.args[1]);
    else value=fraction(id);
    cache.set(id,value);return value;
  }
  const difference=G.sub(left,right),cleared=visit(difference),check=sourceGraphPolynomialIdentity(G,cleared.n,{maxTerms});
  return {schema:'MathScope.RetainedCommonDenominatorIdentity/1',left,right,expression:difference,denominators:[...denominators],commonPowers:cleared.p,
    clearedNumerator:cleared.n,check,pass:check.pass,nonzeroDenominatorsRequired:denominators.length>0,
    originalDenominatorBodiesExpanded:true,sourceFunctionsMaterializedToTheirBodies:true,numericalValuesUsed:false,sourceAuthenticated:false};
}
