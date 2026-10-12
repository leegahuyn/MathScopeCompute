import test from 'node:test';
import assert from 'node:assert/strict';
import {compareFiniteCandidates,compareCandidateRecord} from '../p8/candidate-search.mjs';
const c=(id,matrix,extra={})=>({id,matrix,...extra});
const pair=(A,B,extra={})=>({A:c('A',A),B:c('B',B),...extra});

test('same diagonal projection still distinguishes nilpotent rank from zero matrix',()=>{
  const result=compareFiniteCandidates(pair([['0','1'],['0','0']],[['0','0'],['0','0']]));
  assert.equal(result.status,'DISTINGUISHED');assert.deepEqual(result.differences,['rank','selfAdjoint']);
  assert.deepEqual(result.candidates[0].characteristicPolynomial,['0','0','1']);
  assert.equal(result.counterexample.dimension,2);assert.equal(result.counterexample.searched,3);
});
test('diagonal and rational similarity have identical finite invariants without proving operator equality',()=>{
  const result=compareFiniteCandidates(pair([['1','0'],['0','2']],[['1','1/3'],['0','2']]));
  assert.deepEqual(result.candidates[0].characteristicPolynomial,['2','-3','1']);
  assert.deepEqual(result.candidates[0].fredholmPolynomial,['1','-3','2']);
  assert.deepEqual(result.candidates[0].traceMoments.slice(0,3),[{order:1,value:'3'},{order:2,value:'5'},{order:3,value:'9'}]);
  assert.deepEqual(result.differences,['selfAdjoint']);assert.equal(result.scope.operatorEqualityProved,false);
});
test('rational matrix invariants and repeated exact eigenvalue multiplicities remain exact',()=>{
  const A=c('A',[['1/2','0'],['0','1/2']],{eigenvalueTargets:[{value:'1/2',multiplicity:2}]}),B=c('B',[['1/2','0'],['0','1/2']],{eigenvalueTargets:[{value:'1/2',multiplicity:1}]});
  const result=compareFiniteCandidates({A,B});
  assert.equal(result.candidates[0].trace,'1');assert.equal(result.candidates[0].determinant,'1/4');
  assert.deepEqual(result.candidates[0].characteristicPolynomial,['1/4','-1','1']);
  assert.equal(result.candidates[0].coverage.status,'PASS');assert.equal(result.candidates[1].coverage.status,'FAIL');
  assert.equal(result.candidates[1].coverage.entries[0].actualMultiplicity,2);
});
test('complex eigenvalues are not silently filled by real rational targets',()=>{
  const A=c('A',[['0','-1'],['1','0']],{eigenvalueTargets:[]});
  const result=compareFiniteCandidates({A,B:A});
  assert.deepEqual(result.candidates[0].characteristicPolynomial,['1','0','1']);
  assert.equal(result.candidates[0].coverage.status,'FAIL');
  assert.equal(result.candidates[0].coverage.coveredMultiplicity,0);
});
test('reflection compares exact polynomial identity including its sign and center',()=>{
  const A=c('A',[['-1','0'],['0','1']],{reflection:{center:'0',sign:'1'}}),B=c('B',[['-1','0'],['0','1']],{reflection:{center:'1',sign:'1'}});
  const result=compareFiniteCandidates({A,B});
  assert.equal(result.candidates[0].reflection.status,'PASS');assert.equal(result.candidates[1].reflection.status,'FAIL');
});
test('determinant quotient preserves poles and formal exponential normalization',()=>{
  const A=c('A',[['1']],{normalization:{scalar:'2',exponentialLinear:'3'}}),B=c('B',[['2']],{normalization:{scalar:'1',exponentialLinear:'1'}});
  const result=compareFiniteCandidates({A,B,probes:['0','1/2']});
  assert.equal(result.determinantNormalizationQuotient[0].rationalQuotient,'2');
  assert.equal(result.determinantNormalizationQuotient[1].status,'DENOMINATOR_ZERO');
  assert.equal(result.determinantNormalizationQuotient[1].rationalQuotient,null);
  assert.equal(result.determinantNormalizationQuotient[1].exponentialExponent,'1');
});
test('minimal witness replays and its stated principal-compression search is bounded',()=>{
  const result=compareFiniteCandidates(pair([['1','0','0'],['0','2','0'],['0','0','3']],[['1','0','0'],['0','2','0'],['0','0','4']]));
  assert.equal(result.counterexample.dimension,1);assert.deepEqual(result.counterexample.indices,[2]);
  assert.equal(compareFiniteCandidates(pair(result.counterexample.matrices.A,result.counterexample.matrices.B)).status,'DISTINGUISHED');
});
test('malformed, floating-point, oversized and authority-bearing input is rejected',()=>{
  const valid=pair([['1']],[['1']]);
  for(const bad of [ {...valid,formalComplete:true},pair([[1]],[['1']]),pair([['1e2']],[['1']]),pair([['1/0']],[['1']]),pair([[String(2n**257n)]],[['1']]),pair([['1','0']],[['1']]),{...valid,minimize:'yes'}, {...valid,A:{...valid.A,eigenvalueTargets:[{value:'1',multiplicity:1},{value:'1',multiplicity:1}]}}])assert.throws(()=>compareFiniteCandidates(bad));
});
test('records bind deterministic exact results without mutating input or closing research bridges',async()=>{
  const input=pair([['2','0'],['0','3']],[['2','0'],['0','3']]),before=JSON.stringify(input);
  const a=await compareCandidateRecord(input),b=await compareCandidateRecord(input);
  assert.equal(a.resultSHA256,b.resultSHA256);assert.equal(JSON.stringify(input),before);
  assert.equal(a.result.status,'FINITE_INVARIANTS_EQUAL');assert.equal(a.result.unresolvedBridges.length,7);
  assert.ok(a.result.unresolvedBridges.every(x=>x.status==='RESEARCH_OPEN'&&x.proofExecuted===false));
  assert.equal(a.result.scope.formalLeanProofIssued,false);assert.equal(a.result.scope.wholeM3Complete,false);
});
