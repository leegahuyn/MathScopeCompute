import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getChecklist} from '../index.mjs';

const gaugeRoot=fileURLToPath(new URL('../',import.meta.url));
const researchRoot=path.resolve(gaugeRoot,'../..');
const receiptPath='mathscope-m2/gauge/evidence/criterion-completion.json';
const receipt=JSON.parse(fs.readFileSync(path.join(researchRoot,receiptPath),'utf8'));
const original=JSON.parse(fs.readFileSync(path.join(researchRoot,'mathscope-m2/evidence/original-m2-criteria.json'),'utf8'));
const normalizedReceiptPath=p=>path.relative(researchRoot,path.resolve(gaugeRoot,p)).split(path.sep).join('/');

test('all sixteen gauge criteria inherit their own existing evidence without changing status or scope',()=>{
  const expectedIds=['Y3','Y4'].flatMap(group=>original.packages[group].criteria.map(row=>row.id));
  const rows=getChecklist();
  assert.equal(rows.length,16);
  assert.deepEqual(rows.map(row=>row.id),expectedIds);
  assert.deepEqual(receipt.criteria.map(row=>row.id),expectedIds);
  for(const row of rows){
    const prior=receipt.criteria.find(candidate=>candidate.id===row.id);
    assert.equal(row.status,prior.status,row.id);
    assert.equal(row.status,'IMPLEMENTED_FINITE_SCOPE',row.id);
    assert.equal(row.detail,prior.detail,row.id);
    assert.equal(row.implementedScope,prior.detail,row.id);
    assert.equal(row.evidencePathBase,'research-ide');
    assert.deepEqual(row.inheritedFrom,{path:receiptPath,criterionId:row.id,status:prior.status,newExecution:false});
    assert.match(row.testStatus,/승계/);
    assert.match(row.testStatus,/새 수치 검사 또는 Lean 실행이 아닙니다/);
    assert.equal(row.evidencePaths[0],receiptPath);
    assert.equal(new Set(row.evidencePaths).size,row.evidencePaths.length,row.id);
    for(const originalPath of prior.evidencePaths){
      assert(row.evidencePaths.includes(normalizedReceiptPath(originalPath)),`${row.id}: missing original evidence ${originalPath}`);
    }
    for(const evidencePath of row.evidencePaths){
      assert.equal(path.posix.isAbsolute(evidencePath),false,evidencePath);
      assert.equal(evidencePath.split('/').includes('..'),false,evidencePath);
      assert(fs.statSync(path.join(researchRoot,evidencePath)).isFile(),`${row.id}: missing evidence ${evidencePath}`);
    }
  }
  assert(rows.find(row=>row.id==='Y3-04').evidencePaths.includes('mathscope-m1/gauge/lean/transport-audit.log'));
});

test('a consumer cannot change inherited checklist evidence for a later reader',()=>{
  const initial=getChecklist();
  initial[0].evidencePaths.length=0;
  initial[0].inheritedFrom.newExecution=true;
  initial[0].status='PASS';
  const next=getChecklist()[0];
  assert.equal(next.evidencePaths[0],receiptPath);
  assert.equal(next.inheritedFrom.newExecution,false);
  assert.equal(next.status,'IMPLEMENTED_FINITE_SCOPE');
});
