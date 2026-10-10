import test from 'node:test';
import assert from 'node:assert/strict';
import {listExamples,executeDomain,validateDomainRequest} from '../core/registry.mjs';
import {listM2Panels,makeM2Visualization} from '../visualization/m2-views.mjs';
import {actualSensitivityPanels} from '../visualization/actual-sensitivity-panels.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const example=(await listExamples()).find(e=>e.id==='ns-m2-actual-pulse-sensitivity');
const result=await executeDomain(example.request),job={id:example.id,request:example.request,result,status:result.status,inputHash:await sha256(example.request),resultHash:await sha256(result)};
const get=path=>path.replace(/\[(\d+)\]/g,'.$1').split('.').reduce((v,k)=>v?.[k],job);

test('actual first-variation tables retain every expression and bind to the current source result',()=>{
  assert.equal(result.status,'COMPLETED',result.message);
  const before=canonicalStringify(job),panels=listM2Panels(job);assert.equal(panels.length,4);
  for(const p of panels){
    assert.equal(p.scene.points.length,0,'expression IDs must not become numerical values');
    assert.equal(p.observation.numericalSensitivityQuadrature,false);
    for(const t of [p.table,...p.relatedTables])for(const [i,row]of t.rows.entries()){
      assert.notEqual(get(t.sourcePaths[i]),undefined);
      assert.equal(row.length,t.columns.length);
      row.forEach((value,j)=>{const path=t.cellSourcePaths[i][j];if(path)assert.deepEqual(value,get(path),path);});
    }
    const v=makeM2Visualization(job,{panel:p.id});assert.equal(v.state,'READY');
    assert.equal(v.binding.inputHash,job.inputHash);assert.equal(v.binding.resultHash,job.resultHash);assert.equal(v.binding.sourceHash,result.sourceHash);
  }
  assert.equal(canonicalStringify(job),before);
  assert.equal(result.scope.actualSourceFirstSlowDerivativeConstructed,true);
  assert.equal(result.scope.actualSourceFullCurlComplete,false);assert.equal(result.scope.fullSameProfileN5,false);
  assert(new TextEncoder().encode(before).length<8*1024*1024);
});

test('input and execution changes cannot retain a previous derivative certificate as a current chart',()=>{
  assert.deepEqual(actualSensitivityPanels(job,{currentEditorMatches:false}),[]);
  const changed=makeM2Visualization(job,{currentRequest:{...example.request,input:{...example.request.input,slowCoordinate:'Z'}}});
  assert.equal(changed.state,'INPUT_CHANGED');assert.equal(changed.scene.points.length,0);
  for(const status of ['FAILED','CANCELLED','UNSUPPORTED','PRECISION_REQUIRED','BUDGET_EXCEEDED']){
    assert.deepEqual(actualSensitivityPanels({...job,status}),[]);
    assert.equal(makeM2Visualization({...job,status}).kind,'STATE');
  }
  const shortened=actualSensitivityPanels(job,{maxRows:2});assert.equal(shortened[0].table.rows.length,2);assert.equal(shortened[0].table.totalRows,6);
});

test('first-variation preflight rejects unsupported derivatives, substituted sources and insufficient budgets',async()=>{
  const q=example.request;
  assert.equal((await validateDomainRequest({...q,input:{...q.input,derivativeOrder:2}})).code,'UNSUPPORTED');
  assert.equal((await validateDomainRequest({...q,input:{...q.input,slowCoordinate:'theta'}})).code,'UNSUPPORTED');
  assert.equal((await validateDomainRequest({...q,input:{...q.input,matrix:[[1,0],[0,1]]}})).ok,false);
  assert.equal((await validateDomainRequest({...q,precision:{mode:'DIRECTED_BIGINT',bits:192}})).code,'PRECISION_REQUIRED');
  for(const input of [{...q.input,terms:1},{...q.input,ellExact:'2'}])assert.equal((await validateDomainRequest({...q,input})).code,'BUDGET_EXCEEDED');
  for(const budget of [{maxItems:1},{maxOperations:1}])assert.equal((await validateDomainRequest({...q,budget})).code,'BUDGET_EXCEEDED');
});
