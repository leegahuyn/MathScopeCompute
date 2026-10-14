import test from 'node:test';
import assert from 'node:assert/strict';
import {coordinateSupport,closePrimitiveSelectorJets,createFixedLabelDerivative,expandFixedLabelDerivativeWord,auditActualIndexedMaps,applyCartesianLeafClosure} from './cartesian-closure.mjs';
const witnesses=nodes=>nodes.map((node,sourceNode)=>({sourceNode,node}));
const request=(base,coordinates=[1])=>({base,orderedDifferentiationCoordinates:coordinates,result:99});

test('fixed-parameter ceiling jets close even at an integer selector value',()=>{
  const p=[{op:'rational',args:['0','1']},{op:'coordinate',args:['x',5]},
    {op:'source_parameter',args:['h',9]},{op:'ceiling',args:[2]}];
  const r=closePrimitiveSelectorJets(p,[request(3),request(3,[1,1])]);
  assert.equal(r.closed.length,2);assert.equal(r.open.length,0);assert.equal(r.closed[0].exactValue,'0');
  assert.equal(r.unknownFunctionsReplacedByZero,false);assert.equal(r.allSourceExistenceProved,false);
});

test('varying ceiling cannot use fixed-parameter proof',()=>{
  const p=[{op:'rational',args:['0','1']},{op:'coordinate',args:['x',5]},{op:'ceiling',args:[1]}];
  const r=closePrimitiveSelectorJets(p,[request(2)]);assert.equal(r.closed.length,0);assert.equal(r.open.length,1);
});

test('a hidden function inside selector remains an unresolved capture boundary',()=>{
  const p=[{op:'rational',args:['0','1']},{op:'coordinate',args:['x',5]},
    {op:'actual_opaque_value',args:[23,'actual_natural_series']},{op:'ceiling',args:[2]}];
  const r=closePrimitiveSelectorJets(p,[request(3)]);assert.equal(r.closed.length,0);
  assert.deepEqual(r.open[0].syntacticSupport.unreviewed,[2]);
});

test('integral binders bind the body but do not bind endpoint coordinates',()=>{
  const p=[{op:'rational',args:['1','1']},{op:'coordinate',args:['x']},{op:'coordinate',args:['t']},
    {op:'multiply',args:[1,2]},{op:'definite_integral',args:[3,2,0,2]}];
  const s=coordinateSupport({node:id=>p[id]})(4);assert.deepEqual(s.coordinates,[1,2]);
});

test('independent primitive product derivative retains the exact factor',()=>{
  const ns=witnesses([{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},
    {op:'coordinate',args:['x']},{op:'integer_power',args:[2,2]},{op:'rational',args:['2','1']},
    {op:'multiply',args:[4,2]}]);
  const c=createFixedLabelDerivative({sourceNodes:ns});assert.equal(c.compareDerivative(3,2,5).pass,true);
  assert.equal(c.compareDerivative(3,2,2).pass,false);
});

test('a label can be frozen only in the conditional row-interior calculation',()=>{
  const ns=witnesses([{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},
    {op:'coordinate',args:['x']},{op:'ceiling',args:[2]},{op:'multiply',args:[2,3]}]);
  const frozen=createFixedLabelDerivative({sourceNodes:ns,frozenLabels:[3]}),ordinary=createFixedLabelDerivative({sourceNodes:ns});
  assert.equal(frozen.compareDerivative(4,2,3).pass,true);
  const unresolved=ordinary.compareDerivative(4,2,3);assert.equal(unresolved.pass,false);
  assert.equal(unresolved.independentUncomputedDerivativeAtoms.length,1);
});

test('opaque analytic derivative is retained and never silently zeroed',()=>{
  const ns=witnesses([{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},
    {op:'coordinate',args:['x']},{op:'actual_natural_series',args:['Phi',2,2,0,0]}]);
  const c=createFixedLabelDerivative({sourceNodes:ns}),r=c.compareDerivative(3,2,0);
  assert.equal(r.pass,false);assert.equal(r.independentUncomputedDerivativeAtoms.length,1);
});

test('second derivative word retains both mixed chart products',()=>{
  const ns=witnesses([{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},
    {op:'coordinate',args:['x']},{op:'rational',args:['3','1']},{op:'rational',args:['5','1']}]);
  const r=expandFixedLabelDerivativeWord({derivativeMaps:[[{parameter:0,coefficient:3},{parameter:1,coefficient:4}]]},[0,0],2,{sourceNodes:ns,directions:[2]});
  assert.equal(r.length,3);const mixed=r.find(x=>x.localDerivativeOrders.join(',')==='1,1');
  assert.deepEqual(mixed.coefficientProducts,[{sourceCoefficientIDs:[3,4],exactMultiplicity:'2'}]);
});

test('an invalid local parameter cannot be smuggled into a derivative map',()=>{
  const ns=witnesses([{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},{op:'coordinate',args:['x']}]);
  assert.throws(()=>expandFixedLabelDerivativeWord({derivativeMaps:[[{parameter:5,coefficient:1}]]},[0],2,{sourceNodes:ns,directions:[2]}),/Invalid actual local parameter/);
});

test('a variable chart coefficient cannot omit second-word Leibniz terms',()=>{
  const ns=witnesses([{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},
    {op:'coordinate',args:['x']},{op:'rational',args:['2','1']},{op:'multiply',args:[2,3]}]);
  assert.throws(()=>expandFixedLabelDerivativeWord({derivativeMaps:[[{parameter:0,coefficient:4}]]},[0,0],1,{sourceNodes:ns,directions:[2]}),/Leibniz terms/);
});

test('missing chart-constancy authority is rejected',()=>{
  assert.throws(()=>expandFixedLabelDerivativeWord({derivativeMaps:[[{parameter:0,coefficient:4}]]},[0,0],1),/constancy check/);
});

test('an incomplete actual indexed cover is rejected before chart tests',()=>{
  assert.throws(()=>auditActualIndexedMaps([], [{key:'fieldDefinitions:6',definition:{rows:[]}}]),/162-row/);
});

test('applied primitive closure rewrites PDE roots and retains every other unknown jet',()=>{
  const p=[{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},
    {op:'coordinate',args:['x',5]},{op:'source_parameter',args:['h',9]},
    {op:'ceiling',args:[3]},{op:'unresolved_total_source_jet',args:[4,[2]]},
    {op:'actual_opaque_value',args:[123,'actual_natural_series']},
    {op:'unresolved_total_source_jet',args:[6,[2]]},{op:'add',args:[5,7]}];
  const c={scalarProgram:p,diagnostics:{unresolvedActualJetRequests:[{...request(4,[2]),result:5},{...request(6,[2]),result:7}],conditionalDomainHypotheses:[{kind:'OPEN'}]},
    advectiveResidual:[8]},r=applyCartesianLeafClosure(c);
  assert.equal(r.remainingOriginalRequests.length,1);assert.equal(r.closedSelectorResults.length,1);
  assert.equal(r.scalarProgram[r.advectiveResidual[0]].op,'unresolved_total_source_jet');
  assert.equal(r.domainHypotheses.length,1);assert.equal(r.actualCartesianPDEVerified,false);
});
