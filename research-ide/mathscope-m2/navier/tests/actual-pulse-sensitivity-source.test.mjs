import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareActualPulseSensitivityProgram,assertActualPulseSensitivityProgram} from '../actual-pulse-sensitivity.mjs';
import {assertActualCovarianceOperator} from '../actual-covariance-source-operator.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

const prepared=prepareActualPulseSensitivityProgram({ellExact:'1',slowCoordinate:'R',terms:0}),{G}=prepared;
test('both actual source pulse signs preserve their coefficient body and add the nonzero first slow derivative',()=>{
  assert.equal(assertActualPulseSensitivityProgram(prepared),true);assert.equal(assertActualCovarianceOperator(prepared.operator),true);
  assert.equal(prepared.rows.length,2);assert.ok(prepared.checks.every(c=>c.pass));
  for(const row of prepared.rows){
    const old=prepared.operator.families.find(f=>f.sign===row.sign),sys=G.pulseSensitivitySystems[row.system];
    assert.deepEqual(row.matrix,old.frame.wMatrix);assert.deepEqual(sys.initial,[G.one,G.zero]);assert.deepEqual(row.variationInitial,[G.zero,G.zero]);
    assert.ok(row.matrixDerivative.flat().some(x=>x!==G.zero));assert.equal(row.bounds.suppliedConstant,false);
    assert.equal(G.freeCoordinates(row.bounds.matrixDerivativeNorm).size,0);assert.ok(row.bounds.rows.length>200);
    assert.ok(row.bounds.rows.some(r=>r.rule==='ordinary two-term Leibniz rule'));
    assert.ok(row.bounds.rows.some(r=>r.rule.includes('denominator')));
  }
});
test('the original full moving-basis amplitude is differentiated, including its nonconstant left datum',()=>{
  for(const row of prepared.rows){
    assert.ok(row.endpoints[0].amplitudeDerivative.some(x=>x!==G.zero));
    const family=prepared.operator.families.find(f=>f.sign===row.sign),a=prepared.operator.coordinates.R;
    for(let i=0;i<3;i++){
      const expected=G.mul(family.P,G.add(...family.frame.B[i].map((b,j)=>G.add(G.mul(G.derivative(b,a),row.w[j]),G.mul(b,row.wDerivative[j])))));
      assert.ok(sourceGraphRationalIdentity(G,G.sub(row.amplitudeDerivative[i],expected),{atomicNodes:[family.P,...row.w,...row.wDerivative,...family.frame.B.flat(),...row.basisDerivative.flat()],maxTerms:40000}).pass);
    }
    assert.equal(row.referenceEnvelopeDerivative,G.zero);
    assert.notEqual(row.finite.tail,G.zero);assert.notEqual(row.amplitudeDerivativeTail,G.zero);
    assert.ok(sourceGraphRationalIdentity(G,G.sub(row.amplitudeDerivativeTail,G.mul(family.P,G.add(row.bounds.basisNorm,row.bounds.basisDerivativeNorm),row.finite.tail)),{atomicNodes:[family.P,row.bounds.basisNorm,row.bounds.basisDerivativeNorm,row.finite.tail]}).pass);
    assert.equal(row.finite.finiteSumIsExactSolution,false);
  }
});
test('the source graph stays unchanged and the source certificate rejects matrix, initial and graph forgeries',()=>{
  const original=canonicalStringify(prepared.operator.program);
  assert.equal(assertActualCovarianceOperator(prepared.operator),true);
  assert.throws(()=>assertActualPulseSensitivityProgram(structuredClone({request:prepared.request,rows:prepared.rows})),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
  const row=prepared.rows[0],system=G.pulseSensitivitySystems[row.system],entry=system.matrixDerivative[0][0];
  system.matrixDerivative[0][0]=G.zero;assert.throws(()=>assertActualPulseSensitivityProgram(prepared),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');system.matrixDerivative[0][0]=entry;
  const initial=system.augmentedInitial[2];system.augmentedInitial[2]=G.one;assert.throws(()=>assertActualPulseSensitivityProgram(prepared),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');system.augmentedInitial[2]=initial;
  const root=row.bounds.matrixDerivativeNorm,oldNode=G.nodes[root];G.nodes[root]={op:'rational',args:['0','1']};assert.throws(()=>assertActualPulseSensitivityProgram(prepared),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');G.nodes[root]=oldNode;
  assert.equal(assertActualPulseSensitivityProgram(prepared),true);assert.equal(canonicalStringify(prepared.operator.program),original);
});
test('only actual first local slow derivatives are accepted, with cancellation and resource failure explicit',()=>{
  for(const input of [null,[],{matrix:[[0,0],[0,0]]},{derivativeOrder:2},{slowCoordinate:'Xrep'},{sourceProfile:'toy'},{terms:1},{terms:3},{anchorOrder:1},{ellExact:'2'},{ellExact:'0'},{ellExact:'1',anchorOrder:1},{fullSameProfileN5:true}])assert.throws(()=>prepareActualPulseSensitivityProgram(input));
  assert.throws(()=>prepareActualPulseSensitivityProgram({ellExact:'1'},{checkCancelled(){throw Error('cancelled');}}),/cancelled/);
  assert.throws(()=>G.derivative(prepared.rows[0].wDerivative[0],prepared.operator.coordinates.R),e=>e.code==='UNSUPPORTED');
  assert.equal(prepared.scope.fullSameProfileN5,false);assert.equal(prepared.scope.actualSourceFullCurlComplete,false);
});
