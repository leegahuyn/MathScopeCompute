import test from 'node:test';
import assert from 'node:assert/strict';
import {makeFiniteCertificate,validateFiniteCertificate,exportLeanCertificate,canonical} from '../finite-certificates.mjs';
test('finite prime-field count preserves all affine points and the infinity point',()=>{
  const r=makeFiniteCertificate(); assert.equal(r.data.pointCount,'8'); assert.equal(r.data.affinePoints.length,7);
  assert.deepEqual(r.data.traces,['2','-2','-6','22','-14','-82','234']);
  assert.equal(validateFiniteCertificate(r).valid,true); assert.equal(r.formalLeanProofIssued,false);
  assert.equal(r.data.euler.analyticTailBound,null);
});
test('all admitted primes recompute exact finite witnesses',()=>{
  for(const p of ['3','5','7']) for(const traceLength of [3,7,8])assert.equal(validateFiniteCertificate(makeFiniteCertificate({prime:p,traceLength})).valid,true);
});
test('mathematical omissions, coefficient changes and authority promotion fail closed',()=>{
  const mutations=[r=>r.data.affinePoints.pop(),r=>r.data.pointCount='7',r=>r.data.curve.projectiveInfinityCount='0',r=>r.data.traces[2]='-5',r=>r.data.matrix.entries[1]='5',r=>r.data.reconstruction.bounds[1]='3',r=>r.data.reconstruction.candidates[1]=[],r=>r.data.euler.factor[1]='-2',r=>r.data.euler.productPrefix[1]='1',r=>r.data.euler.analyticTailBound='0',r=>r.scope.globalRHProved=true,r=>r.formalLeanProofIssued=true,r=>r.data.extra='pretend'];
  for(const mutate of mutations){const r=makeFiniteCertificate();mutate(r);assert.equal(validateFiniteCertificate(r).valid,false);assert.throws(()=>exportLeanCertificate(r));}
});
test('closed resource bounds and canonical exact strings prevent Lean injection',()=>{
  for(const input of [{prime:'5\naxiom bad : False',traceLength:7},{prime:'05',traceLength:7},{prime:5,traceLength:7},{prime:'11',traceLength:7},{prime:'5',traceLength:100},{prime:'5',traceLength:7,extra:0}]) assert.throws(()=>makeFiniteCertificate(input));
  for(const value of [NaN,Infinity,1.5,undefined,1n])assert.throws(()=>canonical(value));
});
test('Lean export is deterministic, does not claim compilation and does not mutate record',()=>{
  const r=makeFiniteCertificate(), before=canonical(r), source=exportLeanCertificate(r);
  assert.equal(source,exportLeanCertificate(r)); assert.equal(canonical(r),before);
  assert.match(source,/point_count_certificate/); assert.match(source,/trace_matrix_certificate/);
  assert.doesNotMatch(source,/\b(?:sorry|admit|native_decide|axiom)\b/);
  assert.match(source,/must still compile/);
});
