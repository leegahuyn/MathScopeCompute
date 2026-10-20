/** Finite positive scalar calculus with closed source-result leaves.
 * This data structure carries no source authority; a private consumer
 * binds each selected call and its exact input source separately.
 */
import {rational,qadd,qmul,qpow} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_SOURCE_NORM_SCALAR'});};
export class DeferredSourceNormScalars{
  constructor({maxNodes=200000,prefix=[]}={}){
    if(!Number.isSafeInteger(maxNodes)||maxNodes<1||!Array.isArray(prefix)||prefix.length>maxNodes)fail('Use a finite positive scalar representation budget.');
    this.maxNodes=maxNodes;this.nodes=structuredClone(prefix);this.memo=new Map();
    for(const [id,n]of this.nodes.entries())this.memo.set(canonicalStringify([n.op,n.args]),id);
    this.zero=this.q(0);this.one=this.q(1);
  }
  emit(op,args){const key=canonicalStringify([op,args]);if(this.memo.has(key))return this.memo.get(key);
    if(this.nodes.length>=this.maxNodes)fail('The complete scalar norm exceeded its finite node budget.');
    const id=this.nodes.length;this.nodes.push({op,args});this.memo.set(key,id);return id;}
  require(id){if(!Number.isSafeInteger(id)||!this.nodes[id])fail('A scalar root is outside the complete norm graph.');return id;}
  q(n,d=1){const r=rational(n,d);if(r[0]<0n)fail('A norm scalar must be nonnegative.');return this.emit('rational',r.map(String));}
  value(id){const n=this.nodes[this.require(id)];return n.op==='rational'?n.args.map(BigInt):null;}
  isq(id){return this.nodes[this.require(id)].op==='rational';}
  fraction(id){const q=this.value(id);if(!q)fail('This scalar is not an exact rational.');return q;}
  pair(op,a,b){this.require(a);this.require(b);const x=this.value(a),y=this.value(b);
    if(x&&y)return this.q(...(op==='add'?qadd(x,y):qmul(x,y)));
    if(op==='add'){if(a===this.zero)return b;if(b===this.zero)return a;}
    else{if(a===this.zero||b===this.zero)return this.zero;if(a===this.one)return b;if(b===this.one)return a;}
    return this.emit(op,[a,b].sort((a,b)=>a-b));}
  add(...xs){return xs.reduce((a,b)=>this.pair('add',a,b),this.zero);}
  mul(...xs){return xs.reduce((a,b)=>this.pair('multiply',a,b),this.one);}
  pow(id,p){this.require(id);if(!Number.isSafeInteger(p))fail('A scalar exponent must be an exact finite integer.');
    if(p===0)return this.one;if(p===1)return id;const q=this.value(id);return q?this.q(...qpow(q,p)):this.emit('integer_power',[id,p]);}
  sqrt(id){this.require(id);return id===this.zero||id===this.one?id:this.emit('sqrt_positive',[id]);}
  maximum(...xs){xs.forEach(x=>this.require(x));if(!xs.length)fail('Retain every maximum input.');const ids=[...new Set(xs)].sort((a,b)=>a-b);
    return ids.length===1?ids[0]:this.emit('maximum',ids);}
  select(call,path){if(!Number.isSafeInteger(call)||call<0||!Array.isArray(path)||!path.length||
    path.some(k=>typeof k!=='string'&&(!Number.isSafeInteger(k)||k<0)))fail('Select an exact scalar component of a closed producer call.');
    return this.emit('source_norm_result',[call,structuredClone(path)]);}
  freeCoordinates(id){this.require(id);return new Set();}
}
