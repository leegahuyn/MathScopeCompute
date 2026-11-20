import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const [runtime,expanded,registry,out]=process.argv.slice(2);
function pinned(path,expected){
  const data=readFileSync(path);
  assert.equal(createHash('sha256').update(data).digest('hex'),expected);
  return data;
}
pinned(runtime,'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311');
const graph=JSON.parse(pinned(expanded,'797b0331d34b8e1011c7e5c0e993e3cd2e0fdc864b410085c69c126e14b971b7'));
const registryBase=JSON.parse(pinned(registry,'62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce')).base.base;
const {ActualConvergentExpressions}=await import(pathToFileURL(runtime).href);
const expressionSystems=JSON.parse(registryBase.expression);
const picardSystems=JSON.parse(registryBase.picard);
const axisNodes=[16287162,16702702,17179526];
const all=new Map(graph.nodes);
const largestRequiredBody=123641;
const G=new ActualConvergentExpressions();
G.nodes=[];
G.lookup=new Map();
for(const [id,node] of graph.nodes){
  if(id>largestRequiredBody)break;
  G.nodes[id]=node;
  G.lookup.set(JSON.stringify([node.op,node.args]),id);
}
assert.equal(G.nodes[0].op,'rational');
assert.deepEqual(G.nodes[0].args,['0','1']);
G.expressionSystems=expressionSystems;
G.picardSystems=picardSystems;
G.monotoneSystems=JSON.parse(registryBase.monotone);
G.quadraticSystems=JSON.parse(registryBase.quadratic);
G.serial=2000000;
const results=axisNodes.map(id=>{
  assert.equal(all.get(id).op,'actual_expression_partial');
  const [definition,arguments_,orders]=all.get(id).args;
  assert.deepEqual(arguments_,[0,20]);
  assert.deepEqual(orders,[0,0]);
  const {body,name,parameters}=expressionSystems[definition];
  assert.deepEqual(parameters,[4756,2]);
  const actual=G.materializeExpressionFunction(definition,arguments_,orders);
  assert.equal(actual,G.zero);
  return {id,definition,name,body,parameters,arguments:arguments_,orders,result:G.nodes[actual]};
});
writeFileSync(out,JSON.stringify({schema:'MathScope.C143.OriginalNativeAxisPressureReplay/1',results,release:'HOLD'},null,2)+'\n');
