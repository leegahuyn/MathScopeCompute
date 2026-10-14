/** Exact quotient-polynomial reduction using same-argument source sine/cosine.
 * An unrelated phase never enters a relation. Source argument existence and
 * original denominator domains remain separate from this entire identity.
 */
import {rational as Q,qadd,qmul,qtext} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {hashJSON,requireResidual} from './residual-source.mjs';
const decode=key=>key?key.split(',').map(s=>s.split(':').map(Number)):[];
const encode=powers=>[...powers].filter(([,p])=>p).sort(([a],[b])=>a-b).map(pair=>pair.join(':')).join(',');
const readQ=text=>{const [n,d='1']=text.split('/');return Q(n,d);};
function choose(n,k){let out=1n;for(let j=1;j<=k;j++)out=out*BigInt(n-j+1)/BigInt(j);return out;}
export function reduceSourceTrigNumerator({node,atomicSourceIDs,numerator,maxTerms=10000,maxProducts=2000000}){
  const phases=new Map();for(const id of atomicSourceIDs){const n=node(id);if(!['sine','cosine'].includes(n.op))continue;requireResidual(n.args.length===1&&Number.isSafeInteger(n.args[0]),'Malformed original trigonometric source atom.');const phase=n.args[0];if(!phases.has(phase))phases.set(phase,{sine:[],cosine:[]});phases.get(phase)[n.op].push(id);}
  const aliases=new Map(),relations=[];
  for(const [phase,pair]of phases){const sine=pair.sine.sort((a,b)=>a-b),cosine=pair.cosine.sort((a,b)=>a-b);for(const ids of [sine,cosine])for(const id of ids)aliases.set(id,ids[0]);
    if(sine.length&&cosine.length)relations.push({argumentSourceNode:phase,argumentNode:structuredClone(node(phase)),argumentNodeSHA256:hashJSON(node(phase)),sineSourceNode:sine[0],cosineSourceNode:cosine[0],sourceSineBodies:sine.map(id=>({sourceNode:id,node:structuredClone(node(id)),nodeSHA256:hashJSON(node(id))})),sourceCosineBodies:cosine.map(id=>({sourceNode:id,node:structuredClone(node(id)),nodeSHA256:hashJSON(node(id))})),
      mathematicalRelation:'sin(argument)^2+cos(argument)^2=1',status:'PROVED',proofMethod:'ENTIRE_TRIGONOMETRIC_IDENTITY_WITH_EXACT_SAME_SOURCE_ARGUMENT',sourceArgumentDefinednessProved:false});
  }
  let products=0,terms=new Map();const insert=(out,key,value)=>{const sum=qadd(out.get(key)??Q(0),value);if(sum[0])out.set(key,sum);else out.delete(key);if(out.size>maxTerms)throw Object.assign(new Error('Exact source trig quotient monomial limit.'),{code:'RESOURCE_LIMIT'});};
  for(const term of numerator){const powers=new Map();for(const [id,power]of decode(term.monomial)){const canonical=aliases.get(id)??id;powers.set(canonical,(powers.get(canonical)??0)+power);}insert(terms,encode(powers),readQ(term.coefficient));}
  for(const relation of relations){const next=new Map();for(const [key,value]of terms){const powers=new Map(decode(key)),p=powers.get(relation.cosineSourceNode)??0,k=Math.floor(p/2);if(k===0){insert(next,key,value);continue;}powers.set(relation.cosineSourceNode,p%2);
      for(let j=0;j<=k;j++){if(++products>maxProducts)throw Object.assign(new Error('Exact source trig quotient product limit.'),{code:'RESOURCE_LIMIT'});const row=new Map(powers);row.set(relation.sineSourceNode,(row.get(relation.sineSourceNode)??0)+2*j);insert(next,encode(row),qmul(value,Q((j%2?-1n:1n)*choose(k,j))));}
    }terms=next;
  }
  return {schema:'MathScope.N6.SameArgumentSourceTrigQuotient/1',inputMonomials:numerator.length,reducedMonomials:terms.size,relations,exactSameBodyAliases:[...aliases],productsUsed:products,
    numerator:[...terms].map(([monomial,coefficient])=>({monomial,coefficient:qtext(coefficient)})),quotientNumeratorZero:terms.size===0,
    unrelatedAnglesMerged:false,sourceArgumentDefinednessProved:false,nonzeroDenominatorHypothesesDischarged:false,actualSourcePDEVerified:false,originalN601Complete:false,originalN602Complete:false};
}
