import test from 'node:test';
import assert from 'node:assert/strict';
import {runGaugeM3} from '../../gauge/index.mjs';
import {canonical} from '../../gauge/contracts.mjs';
import {buildGaugeStudyPanels} from '../gauge-study-view.mjs';
const actual=await runGaugeM3({kind:'ensemble-study',recordId:'su2-production-v1'});

test('five separate unit-labelled panels map every actual archive observation without mutating the result',()=>{
 const original=canonical(actual),panels=buildGaugeStudyPanels(actual);assert.equal(canonical(actual),original);assert.deepEqual(panels.map(p=>p.id),['connected-c00','independent-t0','spacing-a2','spatial-L','temporal-T']);
 for(const panel of panels){assert.equal(panel.newNumericalExecution,false);assert.equal(panel.continuumPositiveLowerBound,null);assert.ok(panel.xLabel&&panel.yLabel);assert.ok(panel.notes.some(n=>n.includes('95% percentile')));}
 const c=panels[0];assert.equal(c.series.length,7);
 for(const series of c.series){const row=actual.calibration.find(r=>r.id===series.points[0].rowId);assert.equal(series.points.length,row.correlator.rows.length);for(const p of series.points){const raw=row.correlator.rows.find(r=>r.lag===p.lag);assert.equal(p.x,raw.time);assert.equal(p.y,raw.matrix[0][0]);const u=row.channel.operatorChannels[0].correlator.find(r=>r.lag===p.lag).uncertainty;assert.equal(p.lower,u.lower);assert.equal(p.upper,u.upper);}}
 assert.ok(c.series.some(s=>s.points.some(p=>p.y<0)),'actual negative correlators remain on the plotted axis');
 const flows=panels[1];assert.equal(flows.series.length,3);for(const series of flows.series){const ref=actual.scaleStudy.references.find(r=>r.id===series.points[0].referenceId);assert.deepEqual(series.points.map(p=>[p.x,p.y]),ref.analysis.curve.map(p=>[p.t,p.t2E]));}assert.deepEqual(flows.referenceLines,[{axis:'y',value:.1,label:'정의 c=0.1 · 관측값 아님'}]);
});

test('observed mass intervals, source reuse and conditional fit predictions retain their distinct meanings',()=>{
 const panels=buildGaugeStudyPanels(actual),spacing=panels[2],fit=actual.limitComparison.spacing.extrapolation,observed=spacing.series.find(s=>s.kind==='OBSERVED');assert.equal(observed.points.length,3);
 for(const p of observed.points){const row=actual.limitComparison.spacing.rows.find(r=>r.id===p.rowId);assert.equal(p.x,row.a*row.a);assert.equal(p.y,row.mass);assert.equal(p.lower,row.uncertainty.lower);assert.equal(p.upper,row.uncertainty.upper);}
 const predictions=spacing.series.find(s=>s.kind==='CONDITIONAL_FIT');assert.equal(predictions.dataOrigin,'PREDICTIONS_FROM_RECORDED_FIT_PARAMETERS');assert.equal(predictions.points[0].x,0);for(const p of predictions.points){assert.equal(p.y,fit.intercept+fit.slope*p.x);assert.equal(p.prediction,true);assert.equal(p.lower,undefined);}
 for(const p of panels.slice(3)){assert.equal(p.series[0].points.length,2);const base=p.series[0].points.find(p=>p.sourceRowId==='a-beta230');assert.ok(base);assert.deepEqual(base.chainHashes,actual.calibration.find(c=>c.id==='a-beta230').chainHashes);assert.ok(p.notes.some(n=>n.includes('미해결(null)')));}
 assert.ok(spacing.notes.some(n=>n.includes('INSUFFICIENT_EFFECTIVE_SAMPLES')));assert.ok(spacing.notes.some(n=>n.includes('production-a-coarse-attempt1')));assert.ok(spacing.notes.some(n=>n.includes('큰 격자 척도 정의 차이')));
});

test('withheld fits and missing masses stay missing; target edits do not move observed points',()=>{
 const changed=structuredClone(actual),original=buildGaugeStudyPanels(actual);for(const row of changed.calibration)row.targetDelta=9;
 const retargeted=buildGaugeStudyPanels(changed);for(let i=0;i<original.length;i++)assert.deepEqual(retargeted[i].series.map(s=>s.points),original[i].series.map(s=>s.points));
 changed.limitComparison.spacing.extrapolation={status:'EXTRAPOLATION_WITHHELD',reason:'insufficient valid data',assumptions:[]};changed.limitComparison.spacing.rows[0].mass=null;
 const panels=buildGaugeStudyPanels(changed),spacing=panels[2];assert.equal(spacing.series.length,1);assert.equal(spacing.series[0].points.length,2);assert.equal(spacing.missing[0].reason,'CHANNEL_MASS_UNRESOLVED');assert.equal(spacing.missing[0].mass,null);assert.ok(spacing.notes.some(n=>n.includes('EXTRAPOLATION_WITHHELD')));
});

test('a declared fit or comparison cannot silently switch away from the original measured rows',()=>{
 const wrong=structuredClone(actual);wrong.limitComparison.spacing.extrapolation.data[0].mass=99;assert.throws(()=>buildGaugeStudyPanels(wrong),/fit window/);
 const mismatch=structuredClone(actual);mismatch.limitComparison.spatial.rows[0].mass=99;assert.throws(()=>buildGaugeStudyPanels(mismatch),/differs from its original/);
 assert.deepEqual(buildGaugeStudyPanels({kind:'field-family'}),[]);
});
