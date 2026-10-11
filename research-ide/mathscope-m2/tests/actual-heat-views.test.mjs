import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {actualHeatPanels} from '../visualization/actual-heat-panels.mjs';
import {listM2Panels} from '../visualization/m2-views.mjs';
import {getExamples,validateRequest} from '../navier/index.mjs';
import {executeDomain} from '../core/registry.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';

// The stored source certificate is a rendering fixture here. Reading it does
// not execute or authenticate a new source computation or issue a source token.
const receipt=JSON.parse(fs.readFileSync(new URL('../navier/research/evidence/actual-heat-20261011/actual-heat-scaled-enclosure-source-attempt1.json',import.meta.url),'utf8'));
const example=getExamples().find(e=>e.request.kind==='ns.actual-heat-scaled-enclosure');
const fixture=()=>({status:'COMPLETED',request:structuredClone(example.request),result:{status:'COMPLETED',results:structuredClone(receipt.certificate)}});
const read=(object,path)=>path.split('.').reduce((v,k)=>v?.[k],object);

test('the heat request declares directed coefficient precision and forbids replacement source parameters',()=>{
  assert.ok(example);assert.equal(validateRequest(example.request).ok,true);
  assert.equal(example.request.precision.mode,'DIRECTED_BIGINT');
  assert.equal(example.request.input.precisionBits,192);
  for(const [key,value] of [['h',0],['argument','1/64'],['ellExact','1'],['witness',{}],['m3MayStart',true]]){
    assert.equal(validateRequest({...example.request,input:{...example.request.input,[key]:value}}).code,'INVALID_INPUT');
  }
  const precision=validateRequest(example.request).precision;
  assert.equal(precision.actualHeatFactorAndNineSlowJetsEnclosed,true);
  assert.equal(precision.actualSlowPulseDerivativeNumericallyEnclosed,false);
  assert.equal(precision.rawRelativePrecisionClaimed,false);
});

test('invalid heat controls fail in preflight with actionable statuses before a large source allocation',async()=>{
  for(const change of [{tolerance:null},{tolerance:0.001},{tolerance:'0'},{tolerance:'2'},
    {maxTerms:0},{maxTerms:257},{maxTerms:null},{precisionBits:95},{precisionBits:null}]){
    const request={...example.request,input:{...example.request.input,...change}};
    assert.equal(validateRequest(request).code,'INVALID_INPUT');
    assert.equal((await executeDomain(request)).status,'FAILED');
  }
  const inadequate={...example.request,input:{...example.request.input,tolerance:'1/'+(1n<<200n)}};
  assert.equal(validateRequest(inadequate).code,'PRECISION_REQUIRED');
  assert.equal((await executeDomain(inadequate)).status,'PRECISION_REQUIRED');
  assert.equal(validateRequest({...example.request,precision:{mode:'FLOAT64'}}).code,'PRECISION_REQUIRED');
  assert.equal(validateRequest({...example.request,precision:{mode:'DIRECTED_BIGINT',bits:256}}).code,'INVALID_INPUT');
  const oversized={...example.request,input:{...example.request.input,tolerance:'1/'+'9'.repeat(33000)}};
  assert.equal(validateRequest(oversized).code,'BUDGET_EXCEEDED');
  assert.equal((await executeDomain(oversized)).status,'BUDGET_EXCEEDED');
});

test('four installed panels retain exact heat bounds, positive factors and source error values',()=>{
  const job=fixture(),before=canonicalStringify(job),panels=actualHeatPanels(job);
  assert.equal(panels.length,4);assert.equal(listM2Panels(job).length,4);
  let boundCells=0,displayLabels=0;
  for(const p of panels){
    assert.equal(p.scene.points.length,0);assert.equal(p.observation.numericalHeatFactorAndNineSlowJetsEnclosed,true);
    assert.equal(p.observation.wholePulseNumericalDerivativesEnclosed,false);
    assert.equal(p.observation.positiveWeightsOfExercisedMemberCertified,false);
    assert.equal(p.observation.globalPhysicalResidualCertified,false);
    for(let i=0;i<p.table.rows.length;i++)for(let j=0;j<p.table.rows[i].length;j++){
      const path=p.table.cellSourcePaths[i][j];
      if(path){assert.deepEqual(p.table.rows[i][j],read(job,path));boundCells++;}
      else {assert.equal(j,0);displayLabels++;}
    }
  }
  assert.equal(boundCells,95+Object.keys(job.result.results.scope).length);
  assert.equal(displayLabels,Object.keys(job.result.results.scope).length);
  assert.equal(canonicalStringify(job),before);
});

test('a stale editor, failed source or incomplete interval does not produce a current heat panel',()=>{
  const job=fixture();
  assert.deepEqual(actualHeatPanels(job,{currentEditorMatches:false}),[]);
  assert.deepEqual(actualHeatPanels(job,{currentRequest:{...job.request,input:{...job.request.input,precisionBits:256}}}),[]);
  const variants=[j=>j.status='FAILED',j=>j.result.status='PARTIAL',j=>j.result.results.pass=false,
    j=>j.result.results.checks[0].pass=false,j=>delete j.result.results.numerics.rows[0].coefficient.upper,
    j=>delete j.result.results.numerics.moments.coefficients.D1.remainderAbsoluteUpper];
  for(const change of variants){const copy=structuredClone(job);change(copy);assert.deepEqual(actualHeatPanels(copy),[]);}
});

test('the error panel shows actual separate bounds and the entire source remains unchanged when rows are reduced',()=>{
  const job=fixture(),before=canonicalStringify(job),panels=actualHeatPanels(job),errors=panels.find(p=>p.id==='heat-error-budget');
  assert.equal(errors.table.rows.length,3);
  for(let i=0;i<3;i++){
    const c=job.result.results.numerics.moments.coefficients['D'+i];
    assert.deepEqual(errors.table.rows[i],['D'+i,1,c.remainderAbsoluteUpper,c.arithmeticAndParameterWidth,c.totalWidth]);
  }
  const reduced=actualHeatPanels(job,{maxRows:2});assert.equal(reduced[0].table.totalRows,10);
  assert.equal(reduced[0].table.rows.length,2);assert.equal(reduced[0].table.truncated,true);
  assert.equal(reduced[0].table.exactValuesUnabridged,true);assert.equal(canonicalStringify(job),before);
});
