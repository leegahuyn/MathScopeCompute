import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {actualTerminalFieldPanels} from '../visualization/actual-terminal-field-panels.mjs';
import {listM2Panels,makeM2Visualization} from '../visualization/m2-views.mjs';
import {getExamples,validateRequest} from '../navier/index.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';

// This completed certificate is ONLY a rendering fixture. Reading the saved
// source receipt neither reruns the source nor creates a private certificate.
const receipt=JSON.parse(fs.readFileSync(new URL('../navier/research/evidence/terminal-field-20261011/source-attempt-2-certificate.json',import.meta.url),'utf8'));
const example=getExamples().find(e=>e.request.kind==='ns.actual-terminal-field-scaled-enclosure');
const fixture=()=>({id:'terminal-field-rendering-fixture',status:'COMPLETED',request:structuredClone(example.request),
  result:{status:'COMPLETED',results:structuredClone(receipt.certificate),precisionLedger:validateRequest(example.request).precision}});
const read=(object,path)=>path.split('.').reduce((value,key)=>value?.[key],object);

test('four terminal tables preserve every exact coefficient, factor, error and scope source cell',()=>{
  const job=fixture(),before=canonicalStringify(job),panels=actualTerminalFieldPanels(job);
  assert.equal(panels.length,4);assert.deepEqual(listM2Panels(job).map(p=>p.id),panels.map(p=>p.id));
  let cells=0,labels=0;
  for(const p of panels){
    assert.equal(p.kind,'TABLE');assert.equal(p.scene.points.length,0);assert.equal(p.relatedTables.length,0);
    assert.equal(p.observation.numericalCompleteTerminalFAndNineSlowJetsEnclosed,true);
    assert.equal(p.observation.originalPositiveAmplitudeRetained,true);assert.equal(p.observation.rawAbsoluteRationalEnclosures,true);
    for(const key of ['rawRelativePrecisionClaimed','wholeDomainFNumericallyEnclosed','wholePulseNumericalDerivativesEnclosed',
      'wholeCovarianceNumericallyEnclosed','positiveWeightsOfExercisedMemberCertified','globalPhysicalResidualCertified','wholeM2Complete','m3MayStart','kernelProofVerifiedByThisView'])assert.equal(p.observation[key],false);
    for(let i=0;i<p.table.rows.length;i++)for(let j=0;j<p.table.rows[i].length;j++){
      const path=p.table.cellSourcePaths[i][j];
      if(path){assert.deepEqual(p.table.rows[i][j],read(job,path));cells++;}
      else {assert.equal(j,0);labels++;}
    }
    const view=makeM2Visualization(job,{panel:p.id,currentRequest:job.request});
    assert.equal(view.state,'READY');assert.equal(view.id,p.id);assert.deepEqual(view.table.rows,p.table.rows);
    assert.equal(view.binding.jobId,job.id);assert.equal(view.binding.currentEditorMatches,true);
  }
  assert.equal(cells,100+17+Object.keys(job.result.results.scope).length);
  assert.equal(labels,17+Object.keys(job.result.results.scope).length);
  assert.equal(canonicalStringify(job),before);
});

test('complete field ZZ stays nonzero and original rational bounds are never rounded for display',()=>{
  const job=fixture(),data=job.result.results,n=data.numerics,panels=actualTerminalFieldPanels(job),
    coefficients=panels[0].table,scales=panels[1].table;
  assert.deepEqual(coefficients.rows.map(row=>row[0]),['F','R','Z','T','RR','RZ','RT','ZZ','ZT','TT']);
  const i=n.rows.findIndex(row=>row.id==='ZZ');assert.equal(scales.rows[i][1],'B*h');assert.equal(scales.rows[i][3],'NEGATIVE');
  assert.notEqual(coefficients.rows[i][1],'0');assert.notEqual(coefficients.rows[i][2],'0');
  assert.equal(scales.rows[i][5],'0');assert.notEqual(scales.rows[i][4],'0');
  for(const id of ['Z','RZ','ZT']){
    const row=n.rows.find(row=>row.id===id);assert.equal(row.sign,'ZERO');assert.deepEqual(row.coefficient,{lower:'0',upper:'0'});
  }
  assert.ok(scales.rows.some(row=>typeof row[4]==='string'&&row[4].length>1000));
  for(let i=0;i<scales.rows.length;i++)for(let j=0;j<scales.rows[i].length;j++)assert.equal(panels[1].chart.rows[i][j],scales.rows[i][j]===null?'—':String(scales.rows[i][j]));
  const errors=panels[2].table;
  assert.equal(errors.rows[0][1],data.request.tolerance);
  assert.equal(errors.rows[1][1],job.result.precisionLedger.heatCoefficientTolerance);
  assert.equal(errors.rows[2][1],job.result.precisionLedger.heatMomentTolerance);
  assert.equal(errors.rows[6][1],n.step.proof.positiveTaylorRemainderUpper);
});

test('stale, failed, weakened or incomplete receipts cannot produce current terminal source tables',()=>{
  const job=fixture();assert.deepEqual(actualTerminalFieldPanels(job,{currentEditorMatches:false}),[]);
  const other={...job.request,input:{...job.request.input,tolerance:'1/1000'}};
  assert.deepEqual(actualTerminalFieldPanels(job,{currentRequest:other}),[]);
  assert.equal(makeM2Visualization(job,{currentRequest:other,panel:'terminal-field-coefficient-intervals'}).state,'INPUT_CHANGED');
  const changes=[j=>j.status='FAILED',j=>j.result.status='PARTIAL',j=>j.result.results.pass=false,
    j=>j.result.results.checks=[],j=>j.result.results.checks[0].pass=false,
    j=>delete j.result.results.numerics.rows[0].coefficient.upper,j=>delete j.result.results.numerics.rows[1].rawAbsoluteEnclosure,
    j=>j.result.results.numerics.rows[1].sourceFactorSetToZero=true,j=>j.result.results.numerics.rows[1].id='ZZ',
    j=>delete j.result.results.numerics.heatMoments.coefficients.D1.arithmeticAndParameterWidth,
    j=>delete j.result.results.numerics.step.proof.positiveTaylorRemainderUpper,
    j=>j.result.results.numerics.errorBudget.allArithmeticAndElementaryTailsIncluded=false,
    j=>j.result.results.scope.exactOriginalPositiveAmplitudeRetained=false,j=>j.result.results.scope.m3MayStart=true];
  for(const change of changes){const copy=structuredClone(job);change(copy);assert.deepEqual(actualTerminalFieldPanels(copy),[]);}
});

test('deterministic row reduction retains its endpoint paths and never truncates exact numbers',()=>{
  const job=fixture(),before=canonicalStringify(job),panels=actualTerminalFieldPanels(job,{maxRows:2});
  assert.equal(panels.length,4);
  for(const panel of panels){
    assert.equal(panel.table.rows.length,2);assert.equal(panel.table.truncated,true);assert.equal(panel.table.exactValuesUnabridged,true);
    for(let i=0;i<2;i++)for(let j=0;j<panel.table.rows[i].length;j++){
      const path=panel.table.cellSourcePaths[i][j];if(path)assert.deepEqual(panel.table.rows[i][j],read(job,path));
    }
  }
  assert.deepEqual(panels[0].table.rows.map(row=>row[0]),['F','TT']);assert.equal(panels[0].table.totalRows,10);
  assert.equal(canonicalStringify(job),before);
});
