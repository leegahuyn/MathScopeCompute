import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './generic-signed-162-indexed.test.mjs';
import {assembleSigned162Candidate} from '../navier/generic-signed-162-indexed.mjs';
import {auditSigned162SuccessorFacts} from '../navier/source-signed-162-successor-audit.mjs';

// Faithful native SourceCoupledExpressions contract:
// the field definition is a STRING handle and registered guards are cloned;
// only the application of that definition is a numeric AST node.
function actualHandleFixture(){
  const x=fixture(),G=x.G;
  G.definePeriodicIndexedField=input=>{
    const id='coupled-field:'+G.indexed.size;
    G.indexed.set(id,{...structuredClone(input),id});
    return id;
  };
  G.periodicIndexedValue=(id,params)=>G.addNode('m3_coupled_indexed_partial',[id,[...params],[0,0,0,0,0]]);
  const result=assembleSigned162Candidate(x.candidate,x.services);
  return {x,result};
}
const mustFail=(fn,code)=>assert.throws(fn,e=>e?.code===code,code);

test('native coupled-field:string definition and numeric applied roots retain all 1620 real-style rows',()=>{
  const {x,result}=actualHandleFixture(),a=auditSigned162SuccessorFacts(result);
  assert.equal(a.allIndexedRows,1620);
  assert.equal(a.indexedFields.length,10);
  assert.equal(new Set(a.indexedFields.map(f=>f.field)).size,10);
  assert.ok(a.indexedFields.every(f=>/^coupled-field:\d+$/.test(f.field)));
  assert.ok(a.indexedFields.every(f=>x.G.nodes[f.root].args[0]===f.field));
  assert.equal(a.sourcePrivateAuthorityIssued,false);
});
test('native cloned guard arrays pass equality by original values, not JS identity',()=>{
  const {x,result}=actualHandleFixture(),f=result.indexed.velocity[0];
  assert.notEqual(x.G.indexed.get(f.field).rows[0].guards,x.cover.rows[0].guards);
  assert.deepEqual(x.G.indexed.get(f.field).rows[0].guards,x.cover.rows[0].guards);
  assert.equal(auditSigned162SuccessorFacts(result).allIndexedRows,1620);
});
test('forged native definition token never obtains a Signed private seal',()=>{
  const {result}=actualHandleFixture();
  result.indexed.velocity[0].field='coupled-field:987654';
  mustFail(()=>auditSigned162SuccessorFacts(result),'MISMATCHED_NATIVE_SIGNED_FIELD');
});
test('native field application bound to a different valid token is rejected',()=>{
  const {x,result}=actualHandleFixture(),f=result.indexed.velocity[0];
  x.G.nodes[f.root].args[0]=result.indexed.velocity[1].field;
  mustFail(()=>auditSigned162SuccessorFacts(result),'MISMATCHED_NATIVE_SIGNED_FIELD');
});
test('native registered definition must hold its same-string registry ID',()=>{
  const {x,result}=actualHandleFixture(),f=result.indexed.angularPressure;
  x.G.indexed.get(f.field).id='coupled-field:bogus';
  mustFail(()=>auditSigned162SuccessorFacts(result),'MISMATCHED_NATIVE_SIGNED_FIELD');
});
test('native cloned guard tampering is detected',()=>{
  const {x,result}=actualHandleFixture(),f=result.indexed.velocity[1];
  x.G.indexed.get(f.field).rows[1].guards[0].sourceGuard=999;
  mustFail(()=>auditSigned162SuccessorFacts(result),'SIGNED_ROW_PROVENANCE_MISMATCH');
});
test('native local derivative mapping tampering is detected',()=>{
  const {x,result}=actualHandleFixture(),f=result.indexed.covariance.rr;
  x.G.indexed.get(f.field).rows[37].derivativeMaps[2][0].parameter=999;
  mustFail(()=>auditSigned162SuccessorFacts(result),'SIGNED_ROW_PROVENANCE_MISMATCH');
});
test('legacy synthetic numeric-definition fixtures retain compatibility',()=>{
  const x=fixture(),r=assembleSigned162Candidate(x.candidate,x.services);
  assert.equal(auditSigned162SuccessorFacts(r).allIndexedRows,1620);
});
