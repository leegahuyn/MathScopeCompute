import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createFunctionalAlphaNormalizer} from './alpha-functional-equivalence.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const def=(body=80)=>({name:'same-name-is-not-identity',body,parameters:[90],derivativeLimits:[2]});
function fixture(){
  const nodes=[{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},{op:'coordinate',args:['sameName']},{op:'coordinate',args:['sameName']},{op:'coordinate',args:['outer']},
    {op:'independent_defined_partial',args:['m3_aux_expression_partial',-1,[2],[1],[]]},
    {op:'independent_defined_partial',args:['m3_aux_expression_partial',-1,[3],[1],[]]},
    {op:'definite_integral',args:[5,2,0,1]},{op:'definite_integral',args:[6,3,0,1]}];
  return {nodes,definitions:{expressionDefinitions:[def(),def(81)],monotone:[{body:80,variable:91,parameters:[90],left:0,right:1,derivativeLower:1,derivativeUpper:1}]}};
}
const normalizer=(f,more={})=>createFunctionalAlphaNormalizer({rows:f.nodes.map((node,independentNode)=>({independentNode,node,nodeSHA256:hash(node),originalSourceNodes:[]})),definitions:f.definitions,...more});
test('actual defining body/formals/orders are retained while integral binders normalize',()=>{
  const f=fixture(),g=normalizer(f);assert.equal(g.visit(7),g.visit(8));const d=g.diagnostics();assert.equal(d.sameNameReplacementUsed,false);assert.equal(d.hashOnlyEqualityUsed,false);assert.equal(d.functionExistenceProved,false);assert.equal(d.allHiddenCaptureClosureProved,false);assert.ok(d.integralProofs.some(x=>x.leftCheckpointIntegral===8&&x.rightCheckpointIntegral===7));
});
test('same name on distinct free coordinates does not establish equality',()=>{const g=normalizer(fixture());assert.notEqual(g.visit(2),g.visit(3));});
test('same name with different defining body/registry does not establish equality',()=>{const f=fixture();f.nodes[6].args[1]=-2;const g=normalizer(f);assert.notEqual(g.visit(7),g.visit(8));});
test('different derivative orders or explicit captured coordinates cannot merge',()=>{
  for(const change of [n=>n.args[3]=[2],n=>n.args[4]=[4]]){const f=fixture();change(f.nodes[6]);const g=normalizer(f);assert.notEqual(g.visit(7),g.visit(8));}
});
test('integral endpoints remain outside binder scope',()=>{const f=fixture();f.nodes[7].args[3]=2;f.nodes[8].args[3]=3;const g=normalizer(f);assert.notEqual(g.visit(7),g.visit(8));});
test('different implicit source calls remain different branches',()=>{
  const f=fixture();f.nodes.push({op:'independent_implicit_monotone_root',args:[100,0,[4]]},{op:'independent_implicit_monotone_root',args:[101,0,[4]]});const g=normalizer(f);assert.notEqual(g.visit(9),g.visit(10));
});
test('unknown defining operators and missing registries stop',()=>{
  const f=fixture();f.nodes.push({op:'opaque_limit',args:[2]});assert.throws(()=>normalizer(f).visit(9),e=>e.code==='UNREVIEWED_FUNCTIONAL_ALPHA_OPERATOR');f.definitions.expressionDefinitions=[];assert.throws(()=>normalizer(f).visit(7),e=>e.code==='UNBOUND_DEFINITION');
});
test('changed checkpoint bytes reject before normalization',()=>{
  const f=fixture(),rows=f.nodes.map((node,independentNode)=>({independentNode,node,nodeSHA256:hash(node),originalSourceNodes:[]}));rows[5].nodeSHA256='0'.repeat(64);assert.throws(()=>createFunctionalAlphaNormalizer({rows,definitions:f.definitions}),e=>e.code==='CHANGED_CHECKPOINT_NODE');
});
test('actual implicit argument mutation is rejected, even with same op/index',()=>{
  const f=fixture();f.nodes.push({op:'independent_implicit_monotone_root',args:[100,0,[4]]});const rows=f.nodes.map((node,independentNode)=>({independentNode,node,nodeSHA256:hash(node),originalSourceNodes:independentNode===4?[90]:[]}));
  const make=arg=>createFunctionalAlphaNormalizer({rows,definitions:f.definitions,sourceNode:id=>id===100?{op:'actual_monotone_root',args:[0,arg]}:{op:'coordinate',args:['p']}});
  assert.doesNotThrow(()=>make(90).visit(9));assert.throws(()=>make(92).visit(9),e=>e.code==='CHANGED_ACTUAL_OPERATOR');
});
test('positive algebraic reordering inside a body is checked exactly',()=>{
  const f=fixture();f.nodes.push({op:'add',args:[5,1]},{op:'add',args:[1,6]},{op:'definite_integral',args:[9,2,0,1]},{op:'definite_integral',args:[10,3,0,1]});const g=normalizer(f);assert.equal(g.visit(11),g.visit(12));
});
test('work limits remain explicit source stops',()=>assert.throws(()=>normalizer(fixture(),{maxWork:4}).visit(7),e=>e.code==='RESOURCE_LIMIT'));
