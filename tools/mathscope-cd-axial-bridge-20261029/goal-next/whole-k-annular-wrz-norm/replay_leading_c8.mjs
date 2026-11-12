import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [source,out]=process.argv.slice(2);
assert.ok(source&&out);
const name='research-ide/mathscope-m2/navier/actual-leading-all-order-jets.mjs';
const {actualLeadingAllOrderJets}=await import(pathToFileURL(resolve(source,name)).href);
const data=actualLeadingAllOrderJets({radialOrder:8,etaOrder:8});
assert.equal(data.pass,true);
assert.ok(data.checks.every(r=>r.pass));
assert.equal(data.totalTaylorOrder,16);
assert.deepEqual(data.bounds.U0.domain,{X:['0','infinity'],eta:['-1','1'],exactZeroAfter:'Xv'});
assert.deepEqual(data.bounds.F0active.domain.X,['0','Xplus=Xv*exp(1)']);
assert.equal(data.scope.fullGlobalF0DerivativeBound,false);
assert.equal(data.scope.positiveOrderCoefficientNormProduced,false);
const graph=data.normProgram.nodes;
const used=new Set();
const walk=i=>{
  if(used.has(i))return;
  const {op,args}=graph[i];
  used.add(i);
  if(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum'].includes(op))
    args.forEach(walk);
  else if(op==='integer_power')walk(args[0]);
  else assert.ok(['rational','source_parameter'].includes(op),op);
};
for(const field of ['U0','F0active','F0inner'])walk(data.normProgram.roots[field]);
const result={schema:'MathScope.N7.ActualLeadingAnnularWrzJetNormLeaves/1',input:{radialOrder:8,etaOrder:8},
  sourceParameterSHA256:data.parameterExpressionSHA256,
  sourceFunctionIdentity:data.sourceFunctionIdentity,rootProofs:data.rootProofs,
  graph:{nodeCount:graph.length,sha256:createHash('sha256').update(JSON.stringify(graph)).digest('hex')},
  normRoots:data.normProgram.roots,bounds:data.bounds,
  normClosure:Object.fromEntries([...used].sort((a,b)=>a-b).map(i=>[i,graph[i]])),
  sourceChecks:data.checks,sourceScope:data.scope};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log('PASS actual full leading U0 C8 and original F0 on [0,Xplus] C8 with exact source norm roots.');
console.log(JSON.stringify({source:data.sourceFunctionIdentity,normRoots:data.normProgram.roots,graph:result.graph}));
