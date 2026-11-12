import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {compactFromLegacy,compactDerivativesFromLegacy} from './compact_lookup.mjs';
import {pinRuntime} from './pin_runtime.mjs';

const [runtime]=process.argv.slice(2);assert(runtime,'Provide ORIGINAL_PRIMARY_RUNTIME');
await pinRuntime(runtime);
const navier=resolve(runtime,'research-ide/mathscope-m2/navier');
const imp=name=>import(pathToFileURL(resolve(navier,name)).href);
const {ActualConvergentExpressions}=await imp('actual-continuation-exact-functions.mjs');
const {ActualInductionExpressions}=await imp('actual-residual-order-induction-expressions.mjs');
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function build(optimized){
  const base=new ActualConvergentExpressions();
  const prefix=sha(base.nodes),oldSize=base.lookup.size;
  if(optimized){base.lookup=compactFromLegacy(base.lookup);base.derivatives=compactDerivativesFromLegacy(base.derivatives);}
  assert.equal(base.lookup.size,oldSize);
  const x=base.fresh('parity_x'),t=base.fresh('parity_t'),z=base.fresh('parity_z');
  const expression=base.exp(base.mul(x,t)),integral=base.integral(expression,t,base.zero,base.one);
  // This substitution must alpha-rename its binder because t is free in the new argument.
  const substituted=base.substitute(integral,x,t);
  assert(base.dependsOn(substituted,t));
  const derivative=base.derivative(substituted,t),mixed=base.derivative(derivative,t);
  const sys=base.defineExpressionFunction({name:'ActualLookupParity',parameters:[x,z],body:base.mul(x,z),derivativeLimits:[2,2]});
  const root=base.expressionValue(sys,[x,z],[1,0]);
  assert.equal(base.materializeExpressionFunction(sys,[x,z],[1,0]),z);
  const beforeClone=sha(base.nodes),beforeDefs=sha(base.captureFunctionDefinitions());
  // Original induction constructor sees CompactLookup as Map and executes new Map(value).
  const child=new ActualInductionExpressions(base,{maxNodes:Math.max(100000,base.nodes.length+10000),maxDerivativeOrder:128});
  assert(child.lookup instanceof Map && !(child.lookup.constructor.name==='CompactLookup'));
  assert.deepEqual([...base.lookup],[...child.lookup]);
  const childRoot=child.add(mixed,root), childAgain=child.add(root,mixed);
  assert.equal(childRoot,childAgain);
  return {prefix,beforeClone,beforeDefs,childNodes:sha(child.nodes),childDefs:sha(child.captureFunctionDefinitions()),
    nodeCount:base.nodes.length,childNodeCount:child.nodes.length,ids:[x,t,z,integral,substituted,derivative,mixed,sys,root,childRoot],
    alphaRenameRetained:true,cloneUsesOriginalMap:true};
}
const original=build(false),optimized=build(true);assert.deepEqual(optimized,original);
console.log(JSON.stringify({status:'PASS_ORIGINAL_CONVERGENT_INDUCTION_GRAPH_PARITY',...original,
  limitations:'This executes constructors and adversarial elementary/shared/integral operations; it is not an actual C8 native seal or all-module proof.',release:'HOLD'}));
