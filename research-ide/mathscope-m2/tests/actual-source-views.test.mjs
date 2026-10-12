import test from 'node:test';
import assert from 'node:assert/strict';
import {actualBackgroundConstruction} from '../navier/actual-background.mjs';
import {actualMeanPatchPulseConstruction} from '../navier/actual-pulse-construction.mjs';
import {actualSourcePanels} from '../visualization/actual-source-panels.mjs';
import {SourceBoundScene,renderObservationTable} from '../visualization/renderer.mjs';

const makeJob=(kind,data,id=kind)=>({id,status:'PARTIAL',inputHash:'input-'+id,resultHash:'result-'+id,request:{kind,input:{}},result:{status:'PARTIAL',sourceHash:'retained-source-'+id,results:data}});
const background=makeJob('ns.actual-background',actualBackgroundConstruction());
const pulse=makeJob('ns.actual-mean-pulse',actualMeanPatchPulseConstruction());
const get=(job,path)=>path.replace(/\[\*\]/g,'[0]').replace(/\[(\d+)\]/g,'.$1').split('.').reduce((v,k)=>v?.[k],job);
const deepFreeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.freeze(x);for(const v of Object.values(x))deepFreeze(v);}return x;};
deepFreeze(background);deepFreeze(pulse);

function checkFiniteGeometry(panel){
  for(const p of panel.scene.points)assert(p.pos.length===3&&p.pos.every(Number.isFinite),panel.id+' finite mark');
  for(const s of panel.chart.series||[])for(const p of s.points)assert([p.x,p.y].every(Number.isFinite));
  for(const p of panel.chart.items||[])assert([p.lower,p.upper,p.midpoint].every(Number.isFinite));
  assert.equal(panel.scene.lines.length,0);assert.equal(panel.scene.arrows.length,0);
  assert.equal(panel.lod.displayedPoints,panel.scene.points.length);assert.equal(panel.lod.changesComputation,false);
}

function checkTable(job,table){
  assert.equal(table.rows.length,table.sourcePaths.length);assert.equal(table.rows.length,table.cellSourcePaths.length);
  assert.equal(table.exactValuesUnabridged,true);assert.equal(table.cellLayout.overflowWrap,'anywhere');
  table.rows.forEach((r,i)=>{
    assert.notEqual(get(job,table.sourcePaths[i]),undefined,table.sourcePaths[i]);
    assert.equal(r.length,table.columns.length);
    r.forEach((v,j)=>{const p=table.cellSourcePaths[i][j];if(p)assert.deepEqual(v,get(job,p),p);});
  });
}

test('both actual constructors produce complete additive panel families without changing source data',()=>{
  for(const [job,count]of [[background,4],[pulse,6]]){
    const before=JSON.stringify(job),panels=actualSourcePanels(job);assert.equal(panels.length,count);assert.equal(panels[0].id,'main');
    assert.equal(new Set(panels.map(p=>p.id)).size,count);
    for(const p of panels){assert(p.title&&p.description);assert(p.table.rows.length);assert.equal(p.sourceRoot,'result.results');assert.equal(p.observation.globalOriginalCriteriaComplete,false);assert.equal(p.observation.reconstructionAllowed,false);assert.equal(p.observation.physicalDimension,0);assert.equal(p.binding,undefined,'job/hash binding belongs to the parent adapter');checkFiniteGeometry(p);}
    assert.equal(JSON.stringify(job),before);
  }
});

test('every displayed mark and every exact table cell resolves to its actual result field',()=>{
  for(const job of [background,pulse])for(const panel of actualSourcePanels(job)){
    for(const p of panel.scene.points){assert.match(p.sourcePath,/^result\.results\./);assert.deepEqual(p.value,get(job,p.sourcePath),p.sourcePath);if(p.displaySourcePath)assert.deepEqual(p.displayEnclosure,get(job,p.displaySourcePath));}
    for(const s of panel.chart.series||[])for(const p of s.points){assert.deepEqual(p.value,get(job,p.sourcePath));if(p.xSourcePath)assert.equal(p.x,get(job,p.xSourcePath));}
    checkTable(job,panel.table);for(const t of panel.relatedTables)checkTable(job,t);
    for(const a of panel.axisMetadata){assert.match(a.sourceField,/^result\.results\./);assert.notEqual(get(job,a.sourceField),undefined,a.sourceField);}
    for(const d of panel.details)assert.notEqual(get(job,d.sourcePath),undefined,d.sourcePath);
  }
});

test('axis derivatives are three independent intervals with exact fractions and no fabricated curve',()=>{
  const p=actualSourcePanels(background)[0];assert.equal(p.kind,'INTERVALS');assert.equal(p.chart.items.length,3);assert.equal(p.chart.series,undefined);
  assert.deepEqual(p.chart.items.map(x=>x.label),['phi_1′ norm','U_1′ norm','Pi_1′ norm']);
  assert(p.table.rows[0][2].length>500,'large exact rational endpoints remain whole');assert(p.chart.items.every(x=>x.midpoint>=x.lower&&x.midpoint<=x.upper));
  assert.equal(background.result.results.axisObservations.domain.actualNonzeroRadiusSamples,false);
});

test('positive-radius enclosures show all 15 samples by component and retain exact positive radii',()=>{
  const p=actualSourcePanels(background).find(p=>p.id==='actual-core-points');
  assert.equal(p.scene.points.length,15);assert.equal(p.chart.series.length,3);assert(p.chart.series.every(s=>s.points.length===5&&s.connect===false));
  assert.deepEqual(p.chart.series[0].points.map(x=>x.x),[1,2,3,4,5]);
  assert.equal(p.observation.positiveRadiusNotReplacedByZero,true);assert.equal(p.observation.rawFunctionValueDisplayed,false);
  for(const row of p.table.rows){assert.match(row[2],/observationXUnit/);assert.match(row[3],/logObservationSolutionNorm/);assert.match(row[4],/X_i/);assert.match(row[7],/^1\/2\^128$/);}
});

test('bits changes the exact observation locations and is never presented as fixed-point convergence',()=>{
  const alternate=makeJob('ns.actual-background',actualBackgroundConstruction({bits:256}),'new-location');
  const a=actualSourcePanels(background).find(p=>p.id==='actual-core-points'),b=actualSourcePanels(alternate).find(p=>p.id==='actual-core-points');
  assert.notEqual(a.observation.locationScaleBits,b.observation.locationScaleBits);assert.notEqual(a.table.rows[0][3],b.table.rows[0][3]);
  assert.equal(b.observation.precisionChangesObservationPoint,true);assert.equal(b.observation.fixedPointRefinement,false);assert.match(b.description,/관측 위치 자체가 바뀝니다/);assert.match(b.description,/정밀도 정련.*아닙니다/);
  checkTable(alternate,b.table);checkFiniteGeometry(b);
});

test('Imean moment contributions preserve both signs and distinguish local contributions from total debts',()=>{
  const p=actualSourcePanels(background).find(p=>p.id==='actual-moment-contributions');
  assert.equal(p.chart.items.length,2);assert(p.chart.items[0].lower>0);assert.equal(p.chart.items[1].lower,-1.25);
  assert.deepEqual(p.table.rows.map(r=>r[2]),['1-exp(-5)','-5/4']);assert.match(p.description,/전체 모멘트 debt.*뜻은 아닙니다/);
  const scope=p.relatedTables[0].rows.find(r=>r[0]==='원래 N4 완료 판정')[1];assert.equal(scope.actualTotalMomentDebtsClosed,false);assert.equal(scope.nextOrderSourceAllowed,false);
});

test('majorant and local pulse bounds display actual expressions with false execution/global flags intact',()=>{
  const m=actualSourcePanels(background).find(p=>p.id==='actual-background-majorant');assert.equal(m.kind,'TABLE');assert.equal(m.scene.points.length,0);
  assert(m.table.rows.some(r=>r[0]==='C1'&&r[1].quotient));assert(m.table.rows.some(r=>r[0]==='실제 K개 합 수치 실행'&&r[1]===false));
  const p=actualSourcePanels(pulse).find(p=>p.id==='actual-pulse-bounds');assert.equal(p.kind,'TABLE');assert(p.table.rows.some(r=>r[1]==='C12EnvelopeR^100'));
  const scope=p.relatedTables[0];assert.equal(scope.rows.find(r=>r[0]==='국소 값 비교')[1],true);assert.equal(scope.rows.find(r=>r[0]==='진폭 수치 적분 실행')[1],false);assert.equal(scope.rows.find(r=>r[0]==='모든 slow 도함수 Gaussian')[1],false);assert.equal(scope.rows.find(r=>r[0]==='원래 N5-05 전역 완료')[1],false);
});

test('all 20 slow multiindices are displayed separately for F V b and exactly zero G',()=>{
  const panels=actualSourcePanels(pulse).slice(0,4),keys=['normalizedFInterval','normalizedVInterval','normalizedRadialInterval','GInterval'];
  for(let k=0;k<4;k++){
    const p=panels[k];assert.equal(p.table.totalRows,20);assert.equal(p.scene.points.length,60);assert(p.chart.series.every(s=>s.connect===false));
    assert.equal(p.observation.coordinateFrame,'BAND_CHART_Q_FIXED');assert.equal(p.observation.restoredQuantitiesArePhysicalCartesian,false);assert.equal(p.observation.normalizationIsComponentSpecific,true);
    for(const mark of p.scene.points){const i=mark.sourceIndex,b=pulse.result.results.meanPatch.jets[i][keys[k]];assert(mark.y>=b[0]&&mark.y<=b[1]);assert.equal(get(pulse,mark.sourceMultiIndexPath).length,3);}
  }
  assert(panels[3].scene.points.every(p=>p.y===0));assert(panels[3].table.rows.every(r=>r[1]===0&&r[2]===0));
  assert(panels[2].scene.points.find(p=>p.sourceIndex===0).y<0,'actual radial background is not dropped');
});

test('reference log envelope remains distinct from actual integrated amplitude and retains left datum scale',()=>{
  const p=actualSourcePanels(pulse).find(p=>p.id==='actual-reference-envelope');assert.equal(p.chart.series.length,2);assert.deepEqual(p.chart.series.map(s=>s.points.length),[33,33]);
  assert.equal(p.observation.referenceOnly,true);assert.equal(p.observation.actualAmplitudePointValuesEvaluated,false);assert.equal(p.observation.kind,'NORMALIZED_REFERENCE_LOG_ENVELOPE');
  assert(p.chart.series[1].dash.length);assert.match(p.description,/수치 적분한 결과는 아닙니다/);
  const initial=p.relatedTables[0].rows[0][1];assert.deepEqual(initial.frameCoordinates,['P(0)','0']);assert.equal(initial.positiveLogScale.binary64,null);assert.equal(initial.positiveLogScale.strictlyPositive,true);
  assert.equal(p.chart.series[0].points[16].y,0);assert(p.chart.series[0].points[0].y<0);
});

test('finite LOD independently limits marks and exact rows while retaining source paths',()=>{
  for(const job of [background,pulse])for(const p of actualSourcePanels(job,{maxPoints:5,maxRows:7})){
    assert(p.scene.points.length<=5);assert(p.table.rows.length<=7);checkFiniteGeometry(p);checkTable(job,p.table);
    assert.equal(p.table.truncated,p.table.totalRows>p.table.rows.length);
    if(p.lod.originalPoints>5)assert(p.lod.originalPoints>p.lod.displayedPoints);
  }
});

test('invalid display intervals do not become zero marks or a connected bridge',()=>{
  const b=structuredClone(background);b.result.results.axisObservations.samples[1].displayEnclosure=[NaN,Infinity];
  const main=actualSourcePanels(b)[0];assert.equal(main.scene.points.length,2);assert.equal(main.lod.invalidCoordinates,1);checkFiniteGeometry(main);assert.match(main.table.rows[1][4][0],/미표시/);
  const j=structuredClone(pulse);j.result.results.growingDatum.rows[16].normalizedLogPInterval=[NaN,NaN];
  const p=actualSourcePanels(j).find(p=>p.id==='actual-reference-envelope');checkFiniteGeometry(p);assert.equal(p.lod.invalidCoordinates,1);
  const sourceRuns=p.chart.series.filter(s=>s.label==='원문 기준 log P');assert.equal(sourceRuns.length,2);assert(sourceRuns[0].points.at(-1).sourceIndex<16);assert(sourceRuns[1].points[0].sourceIndex>16);
});

test('unavailable or stale jobs and other schema/kinds do not expose these actual-source panels',()=>{
  assert.deepEqual(actualSourcePanels(null),[]);assert.deepEqual(actualSourcePanels(pulse,{currentEditorMatches:false}),[]);
  assert.deepEqual(actualSourcePanels({...pulse,status:'FAILED'}),[]);assert.deepEqual(actualSourcePanels({...pulse,result:{...pulse.result,status:'UNSUPPORTED'}}),[]);
  assert.deepEqual(actualSourcePanels({...pulse,request:{kind:'ns.pulse-ode'}}),[]);assert.deepEqual(actualSourcePanels({...background,result:{results:{schema:'different'}}}),[]);
});

function fakeCanvas(width,height){
  const calls=[],ctx=new Proxy({calls},{get(t,key){if(key in t)return t[key];return (...args)=>{assert(args.every(a=>typeof a!=='number'||Number.isFinite(a)),String(key)+' received nonfinite Canvas argument');calls.push([key,...args]);};},set(t,k,v){t[k]=v;return true;}});
  return {ctx,calls,dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({width,height,left:0,top:0}),addEventListener(){},setAttribute(){},setPointerCapture(){},hasPointerCapture:()=>false};
}

test('all additive panels render finite Canvas commands at mobile and desktop sizes',()=>{
  const previous=globalThis.ResizeObserver;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  try{for(const job of [background,pulse])for(const panel of actualSourcePanels(job))for(const [width,height]of[[360,420],[960,520]]){
    const canvas=fakeCanvas(width,height),scene=new SourceBoundScene(canvas);scene.setVisualization({...panel,state:'READY',binding:{jobId:job.id,inputHash:job.inputHash,resultHash:job.resultHash,sourceHash:job.result.sourceHash}});
    assert.equal(canvas.dataset.renderReady,'true',panel.id);assert(canvas.calls.length);assert.equal(canvas.dataset.sourceJobId,job.id);assert.equal(canvas.dataset.inputHash,job.inputHash);
    for(const mark of scene.projected){assert(mark.xy.every(Number.isFinite));if(mark.sourcePath)assert.notEqual(get(job,mark.sourcePath),undefined);}
    scene.destroy();
  }}finally{if(previous)globalThis.ResizeObserver=previous;else delete globalThis.ResizeObserver;}
});

test('exact giant fractions wrap in the existing HTML table without shortening their text',()=>{
  const doc={createElement(tag){return {tagName:tag.toUpperCase(),style:{},dataset:{},children:[],append(...nodes){this.children.push(...nodes);},replaceChildren(){this.children=[];},setAttribute(){}};}};
  const body=doc.createElement('tbody');body.ownerDocument=doc;body.closest=()=>null;
  const p=actualSourcePanels(background)[0];renderObservationTable(null,body,p);
  const td=body.children[0].children[2];assert.equal(td.textContent,p.table.rows[0][2]);assert(td.textContent.length>500);assert.equal(td.style.overflowWrap,'anywhere');
});
