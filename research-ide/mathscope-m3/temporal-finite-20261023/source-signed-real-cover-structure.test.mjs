import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../tests/generic-signed-162-indexed.test.mjs';
import {assembleSigned162Candidate} from '../navier/generic-signed-162-indexed.mjs';
import {auditSigned162SuccessorFacts} from '../navier/source-signed-162-successor-audit.mjs';
const fresh=()=>{const x=fixture();return {x,result:assembleSigned162Candidate(x.candidate,x.services)};};
function input(result){const p=result.originalForced.input.mean.temporal.pressure;return {p,cover:p.cover};}
function authenticShape(result){const {p,cover}=input(result);
  const text='For each fixed physical label differentiate complete local body before finite cover relabeling';
  p.current.assembly={...(p.current.assembly??{}),
    derivativeRule:text,allMixedLocalDerivativesRetainFlatJoins:true,sourceCrossTermsZero:true};
  cover.proof.localFinitenessAndFlatJoins=text;return {p,cover};}
test('real original source stores authenticated covering flat joins as the exact derivative-rule string, not boolean',()=>{
  const {result}=fresh();authenticShape(result);
  const a=auditSigned162SuccessorFacts(result);
  assert.equal(a.allIndexedRows,1620);assert.equal(a.labels,81);
});
test('the real-source derivative rule cannot be replaced with a different string',()=>{
  const {result}=fresh(),{cover}=authenticShape(result);
  cover.proof.localFinitenessAndFlatJoins='forged unsupported rule';
  assert.throws(()=>auditSigned162SuccessorFacts(result),{code:'INVALID_ORIGINAL_81_COVER'});
});
test('original mixed flat join flag is not optional',()=>{
  const {result}=fresh(),{p}=authenticShape(result);
  p.current.assembly.allMixedLocalDerivativesRetainFlatJoins=false;
  assert.throws(()=>auditSigned162SuccessorFacts(result),{code:'INVALID_ORIGINAL_81_COVER'});
});
test('original disjointness is not optional',()=>{
  const {result}=fresh(),{p}=authenticShape(result);
  p.current.assembly.sourceCrossTermsZero=false;
  assert.throws(()=>auditSigned162SuccessorFacts(result),{code:'INVALID_ORIGINAL_81_COVER'});
});
