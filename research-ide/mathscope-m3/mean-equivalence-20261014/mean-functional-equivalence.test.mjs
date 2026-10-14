import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compareSavedMeanFunctionalEquivalence,inspectMeanDefiningCaptures} from './mean-functional-equivalence.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function fixture(){
  const definitions={expressionDefinitions:[{name:'fixture',body:80,parameters:[90],derivativeLimits:[2]}]};
  const nodes=[{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},{op:'coordinate',args:['a']},{op:'coordinate',args:['b']},
    {op:'independent_defined_partial',args:['m3_aux_expression_partial',-1,[2],[1],[]]},{op:'independent_defined_partial',args:['m3_aux_expression_partial',-1,[3],[1],[]]},
    {op:'definite_integral',args:[4,2,0,1]},{op:'definite_integral',args:[5,3,0,1]}];
  const checkpoint={completeReviewedOperandCheckpoint:true,reviewedOperandRows:nodes.map((node,independentNode)=>({independentNode,node,nodeSHA256:hash(node),originalSourceNodes:[]}))};
  const numerator=[{monomial:'6:1',coefficient:'1'},{monomial:'7:1',coefficient:'-1'}];
  const comparison={pass:false,numeratorMonomials:2,numerator:{retained:numerator,omitted:false}};
  const mean={source:{fixture:true},replayStrategy:'original',allOriginalMaximumValuesRetained:true,rows:{retained:['temporal','moments'].map(stage=>({stage,comparisons:Object.fromEntries(['Etheta','Ez','gr','pressureZ'].map(key=>[key,structuredClone(comparison)]))}))},remainingAtomCheckpoints:['temporal','moments'].map(stage=>({stage,checkpoint:structuredClone(checkpoint)}))};
  return {mean,definitions};
}
test('defined-expression eight identities stay conditional and unauthenticated in fixtures',()=>{
  const f=fixture(),result=compareSavedMeanFunctionalEquivalence(f.mean,{definitions:f.definitions});assert.equal(result.matchedComparisons,8);assert.equal(result.actualPrivateSourceAudit,false);assert.equal(result.actualMathematicalIdentitiesCertified,false);assert.equal(result.scope.originalN601Complete,false);assert.equal(result.scope.originalN602Complete,false);assert.equal(result.scope.allSourceOperatorsWellDefinedProved,false);assert.equal(result.capture.status,'SOURCE_PROVIDER_REQUIRED');
});
test('changed actual numerator coefficient remains a nonzero equation',()=>{
  const f=fixture();f.mean.rows.retained[0].comparisons.pressureZ.numerator.retained[1].coefficient='-2';const result=compareSavedMeanFunctionalEquivalence(f.mean,{definitions:f.definitions});assert.equal(result.matchedComparisons,7);assert.equal(result.rows[0].comparisons.pressureZ.pass,false);
});
test('omitted numerator, conditional maximum and completion overrides are rejected',()=>{
  const f=fixture();f.mean.rows.retained[0].comparisons.pressureZ.numerator.omitted=true;assert.throws(()=>compareSavedMeanFunctionalEquivalence(f.mean,{definitions:f.definitions}),e=>e.code==='INCOMPLETE_REMAINING_NUMERATOR');
  const g=fixture();g.mean.replayStrategy='conditional';assert.throws(()=>compareSavedMeanFunctionalEquivalence(g.mean,{definitions:g.definitions}),e=>e.code==='ORIGINAL_OPERANDS_REQUIRED');
  for(const override of [{actualPrivateSourceAudit:true},{completeN6:true},{sourceCaptureRules:[]}])assert.throws(()=>compareSavedMeanFunctionalEquivalence(fixture().mean,{definitions:fixture().definitions,...override}),e=>e.code==='INVALID_EQUIVALENCE_SCOPE');
});
test('copied capability cannot grant original source authority',()=>{
  const f=fixture();assert.throws(()=>compareSavedMeanFunctionalEquivalence(f.mean,{capability:{source:f.mean.source}}));
});
test('actual unknown defining operator remains an explicit capture stop',()=>{
  const nodes={80:{op:'opaque_limit',args:[91]},91:{op:'coordinate',args:['fresh']}};
  const result=inspectMeanDefiningCaptures({sourceNode:id=>nodes[id],definitions:{},operatorBindings:[{kind:'fixture',index:0,definition:{body:80,parameters:[]}}],freshBinderSourceIDs:[91]});
  assert.equal(result.status,'HIDDEN_DEFINITION_CAPTURE_OPEN');assert.equal(result.allHiddenCaptureClosureProved,false);assert.equal(result.unknownBoundaries[0].sourceNode,80);
});
test('explicit same-name hidden capture is witnessed with actual node IDs',()=>{
  const nodes={80:{op:'coordinate',args:['fresh']},91:{op:'coordinate',args:['fresh']}};
  const result=inspectMeanDefiningCaptures({sourceNode:id=>nodes[id],definitions:{},operatorBindings:[{kind:'fixture',index:0,definition:{body:80,parameters:[]}}],freshBinderSourceIDs:[91]});assert.equal(result.status,'CAPTURE_WITNESS_FOUND');assert.equal(result.allHiddenCaptureClosureProved,false);assert.equal(result.captureWitnesses[0].sourceNode,80);
});
