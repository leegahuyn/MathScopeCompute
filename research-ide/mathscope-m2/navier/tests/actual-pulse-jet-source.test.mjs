import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareActualPulseJetProgram,assertActualPulseJetProgram,actualPulseJetCertificateFromProgram,actualPulseJetFTCNorms} from '../actual-pulse-jet-source.mjs';
import {assertActualCovarianceOperator} from '../actual-covariance-source-operator.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

// One genuine source graph exercises all three first and six symmetric
// second directions together. Do not launch this worker with another source
// construction: the retained original function graph is intentionally large.
const started=performance.now(),prepared=prepareActualPulseJetProgram({ellExact:'1',terms:1}),{G,operator:o}=prepared;
const same=(a,b,atomicNodes=[])=>sourceGraphRationalIdentity(G,G.sub(a,b),{atomicNodes,maxTerms:40000}).pass;

test('both genuine signs retain the original source roots and all 20 jet components',()=>{
  assert.equal(assertActualPulseJetProgram(prepared),true);assert.equal(assertActualCovarianceOperator(o),true);
  assert.equal(prepared.rows.length,2);assert.ok(prepared.checks.every(c=>c.pass));
  for(const row of prepared.rows){
    const original=o.families.find(f=>f.sign===row.sign),s=G.pulseJetSystems[row.system];
    assert.deepEqual(row.matrix,original.frame.wMatrix);assert.deepEqual(s.initial,[G.one,G.zero]);
    assert.equal(s.dimension,20);assert.equal(row.derivatives.length,9);
    assert.deepEqual(row.derivatives.map(d=>d.coordinate),['R','Z','T','RR','RZ','RT','ZZ','ZT','TT']);
    assert.equal(G.pulseJetValue(row.system,0,o.coordinates.v,s.parameters),original.w[0]);
    assert.ok(row.matrixFirst.every(A=>A.flat().some(x=>x!==G.zero)));
    assert.ok(row.matrixSecond.flat().every(A=>A.flat().some(x=>x!==G.zero)));
    assert.ok(row.initialFirst.flat().every(x=>x===G.zero));assert.ok(row.initialSecond.flat(2).every(x=>x===G.zero));
    assert.ok(row.variationSecondInitial.flat(2).every(x=>x===G.zero));
  }
});

test('every original M/Mi/Mij/Mv and B/Bi/Bij has a retained derivative-based FTC envelope',()=>{
  for(const row of prepared.rows){
    assert.equal(row.bounds.sourceDerived,true);assert.equal(row.bounds.commonGlobalC3Constant,false);
    assert.equal(row.bounds.rows.length,21);
    assert.equal(row.bounds.rows.reduce((n,A)=>n+A.entries.flat().length,0),104);
    for(const A of row.bounds.rows){
      assert.ok(A.entries.flat().every(e=>e.timeDerivative===G.derivative(e.expression,o.coordinates.v)));
      for(const e of A.entries.flat()){
        assert.equal(e.sourceAuthenticated,false); // only the enclosing source adapter authenticates its inputs
        assert.equal(e.numericalIntegralEvaluated,false);
        assert.ok(!G.freeCoordinates(e.upper).has(o.coordinates.v));
        assert.ok([...G.freeCoordinates(e.upper)].every(c=>row.parameters.includes(c)));
        assert.equal(e.valueAtZero,G.substitute(e.expression,o.coordinates.v,G.zero));
        assert.equal(e.initialEnvelope,G.sqrt(G.add(G.one,G.pow(e.valueAtZero,2))));
      }
    }
    assert.ok(row.bounds.rows.some(A=>A.entries.flat().some(e=>G.nodes[e.integral].op==='definite_integral')));
    assert.ok(row.bounds.rows.some(A=>A.entries.flat().some(e=>G.freeCoordinates(e.upper).has(o.coordinates.R))));
  }
});

test('terms one contains the actual first ordered integrals and has nonzero genuine first/second derivative tails',()=>{
  for(const row of prepared.rows){
    const s=G.pulseJetSystems[row.system],p=row.finite;
    assert.equal(p.terms,1);assert.equal(p.rows.length,1);assert.equal(p.values.length,20);
    assert.ok(p.values.some(x=>G.nodes[x].op==='definite_integral'));assert.notEqual(p.tail,G.zero);
    assert.equal(p.finiteSumIsExactSolution,false);assert.equal(p.numericalWholeSourceEvaluation,false);
    assert.ok(row.derivatives.every(d=>d.checks.every(c=>c.pass)&&d.absoluteTail!==G.zero));
    const p0=G.pulseJetPartialSum(row.system,{terms:0});
    assert.deepEqual(p0.values,s.augmentedInitial);assert.notEqual(p0.tail,G.zero);
    // At fixed source left=0 and constant e1, a one-term jet contains
    // exactly the integral of the corresponding coefficient's first column.
    const t=G.fresh('source_one_term_check'),time=o.coordinates.v;
    for(let i=0;i<3;i++)for(let j=i;j<3;j++){
      const expected=G.integral(G.substitute(s.matrixSecond[i][j][0][0],time,t),t,G.zero,time);
      // Alpha-rename the local integration coordinate before comparing.
      const actual=p.values[s.secondBlocks[i][j]],node=G.nodes[actual];
      assert.equal(node.op,'definite_integral');
      const renamed=G.integral(G.substitute(node.args[0],node.args[1],t),t,node.args[2],node.args[3]);
      assert.equal(renamed,expected);
    }
  }
});

test('mixed amplitude jets keep all four product terms and the repeated basis term in their tail',()=>{
  for(const row of prepared.rows){
    const rr=row.derivatives.find(d=>d.coordinate==='RR'),rz=row.derivatives.find(d=>d.coordinate==='RZ'),b=row.bounds;
    assert.ok(same(rr.absoluteTail,G.mul(row.referenceEnvelope,G.add(b.basisSecondNorms[0][0],b.basisFirstNorms[0],b.basisFirstNorms[0],b.basisNorm),row.finite.tail),
      [row.referenceEnvelope,row.finite.tail,b.basisSecondNorms[0][0],b.basisFirstNorms[0],b.basisNorm]));
    assert.ok(same(rz.absoluteTail,G.mul(row.referenceEnvelope,G.add(b.basisSecondNorms[0][1],b.basisFirstNorms[0],b.basisFirstNorms[1],b.basisNorm),row.finite.tail),
      [row.referenceEnvelope,row.finite.tail,b.basisSecondNorms[0][1],b.basisFirstNorms[0],b.basisFirstNorms[1],b.basisNorm]));
    const left=row.endpoints.find(e=>e.name==='left');
    assert.ok(left.jets.find(d=>d.coordinate==='RR').amplitudeDerivative.some(x=>x!==G.zero));
    assert.ok(row.referenceEnvelopeFirst.every(x=>x===G.zero));
    assert.ok(row.endpoints.every(e=>e.timeFirst.every(x=>x===G.zero)&&e.jets.length===9));
  }
});

test('live seals reject copied source receipts, modified bounds, and modified graph nodes while preserving the original operator',()=>{
  const original=canonicalStringify(o.program),row=prepared.rows[0];
  assert.throws(()=>assertActualPulseJetProgram({...prepared}),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
  const stored=row.bounds;row.bounds={...stored,matrixNorm:G.zero};
  assert.throws(()=>assertActualPulseJetProgram(prepared),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');row.bounds=stored;
  const id=row.bounds.matrixNorm,node=G.nodes[id];G.nodes[id]={op:'rational',args:['0','1']};
  assert.throws(()=>assertActualPulseJetProgram(prepared),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');G.nodes[id]=node;
  assert.equal(assertActualPulseJetProgram(prepared),true);assert.equal(assertActualCovarianceOperator(o),true);
  assert.equal(canonicalStringify(o.program),original);
  // No new full graph copy is needed to test the source helper's binding.
  assert.throws(()=>actualPulseJetFTCNorms(o.G,o,o.families[0]),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
});

test('unsupported bands, display counts, caller derivatives and cancellation fail before constructing a source',()=>{
  for(const input of [null,[],{matrix:[[0,0],[0,0]]},{derivativeOrder:3},{slowCoordinate:'R'},{sourceProfile:'toy'},
    {terms:2},{terms:-1},{anchorOrder:1},{ellExact:'2'},{ellExact:'0'},{matrixSecondNorms:[[0]]},{fullSameProfileN5:true}])
    assert.throws(()=>prepareActualPulseJetProgram(input));
  assert.throws(()=>prepareActualPulseJetProgram({ellExact:'1'},{checkCancelled(){throw Error('cancelled');}}),/cancelled/);
  const row=prepared.rows[0],second=row.wSecond[0][0][0];
  assert.throws(()=>G.derivative(second,o.coordinates.R),e=>e.code==='UNSUPPORTED');
  assert.equal(prepared.scope.sourceGlobalC3Bound,false);assert.equal(prepared.scope.newLeanKernelProof,false);
  assert.equal(prepared.domain.exercisedMember.positiveWeightsCertified,false);
});

test('the authenticated certificate reports every first/second derivative and keeps numeric/global claims separate',async()=>{
  const receipt=await actualPulseJetCertificateFromProgram(prepared);
  assert.equal(receipt.pass,true);assert.equal(receipt.derivativeRows.length,54);assert.equal(receipt.endpointRows.length,54);
  assert.equal(receipt.equationRows.length,2);assert.ok(receipt.equationRows.every(r=>r.sourceJetAuditRowCount===104));
  assert.equal(receipt.convergence.terms,1);assert.equal(receipt.graph.sha256.length,64);
  assert.equal(receipt.scope.secondSlowDerivativeSupported,true);assert.equal(receipt.scope.mixedSlowDerivativeSupported,true);
  assert.equal(receipt.scope.numericalSensitivityQuadrature,false);assert.equal(receipt.scope.fullPhysicalResidualAndFlatErrorPackageComplete,false);
  console.log(JSON.stringify({schema:'MathScope.ActualPulseJetSourceTestReceipt/1',terms:1,allRZT:true,checks:receipt.checks.length,
    nodeCount:receipt.graph.nodeCount,graphBytes:receipt.graph.serializedProgramBytes,receiptBytes:Buffer.byteLength(JSON.stringify(receipt)),
    sha256:receipt.graph.sha256,elapsedMs:performance.now()-started,peakRSSBytes:process.resourceUsage().maxRSS*1024,pass:true}));
});
