/** Exact binder equality for the reviewed primitive expression grammar.
 * Bound coordinates use de Bruijn distances; endpoints remain outside the
 * integrand scope. Unknown function/limit bodies reject comparison. Hashes
 * are diagnostics only: equality compares complete canonical trees.
 */
import {createHash} from 'node:crypto';
const primitives=new Set(['add','multiply','maximum','smooth_piecewise','inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling']);
export function primitiveAlphaForm(nodes,root,{maxWork=100000}={}){
  if(!Number.isSafeInteger(maxWork)||maxWork<1)throw new TypeError('Finite alpha comparison budget required.');
  let work=0;const cache=new Map(),active=new Set();
  const visit=(id,scope)=>{
    if(++work>maxWork)throw Object.assign(new Error('Alpha comparison budget exhausted'),{code:'RESOURCE_LIMIT'});
    const key=JSON.stringify([id,scope]);if(cache.has(key))return cache.get(key);
    if(active.has(key))throw new TypeError('Cyclic expression');active.add(key);
    const n=nodes[id];if(!n||typeof n.op!=='string'||!Array.isArray(n.args))throw new TypeError('Missing scalar node');
    const a=n.args;let form;
    if(n.op==='coordinate'){
      const k=scope.lastIndexOf(id);form=k>=0?['bound',scope.length-1-k]:['free',a[0]];
    }else if(['rational','source_parameter'].includes(n.op))form=[n.op,...a];
    else if(n.op==='definite_integral'){
      if(nodes[a[1]]?.op!=='coordinate')throw new TypeError('Integral binder must be a coordinate');
      form=[n.op,visit(a[0],[...scope,a[1]]),visit(a[2],scope),visit(a[3],scope)];
    }else if(['integer_power','source_step_derivative'].includes(n.op))form=[n.op,visit(a[0],scope),a[1]];
    else if(primitives.has(n.op))form=[n.op,...a.map(x=>visit(x,scope))];
    else throw Object.assign(new Error('Unreviewed bound-variable semantics: '+n.op),{code:'UNRESOLVED_ALPHA_OPERATOR',node:id,operation:n.op});
    active.delete(key);cache.set(key,form);return form;
  };
  const canonical=JSON.stringify(visit(root,[]));return {canonical,sha256:createHash('sha256').update(canonical).digest('hex'),work,unknownOperatorsMerged:false};
}
export function primitiveAlphaEquivalent(nodes,a,b,options){
  const left=primitiveAlphaForm(nodes,a,options),right=primitiveAlphaForm(nodes,b,options);
  return {equivalent:left.canonical===right.canonical,leftSHA256:left.sha256,rightSHA256:right.sha256,primitiveGrammarOnly:true};
}
