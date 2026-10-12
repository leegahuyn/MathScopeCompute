import test from 'node:test';
import assert from 'node:assert/strict';
import {run,validateRequest} from '../navier/index.mjs';
import {actualSourcePanels} from '../visualization/actual-source-panels.mjs';
import {makeM2Visualization} from '../visualization/m2-views.mjs';
import {SourceBoundScene} from '../visualization/renderer.mjs';

const requests=[
  {kind:'ns.actual-picard-acceptance',input:{tailBits:128}},
  {kind:'ns.actual-pulse-amplitude',input:{steps:64,sign:1}},
  {kind:'ns.actual-continuation',input:{eta:'1/4',XInterval:['1','100'],bits:192}},
];
const jobs=await Promise.all(requests.map(async request=>{const result=await run(request.kind,request.input);return {id:request.kind,request,result,status:result.status,inputHash:'input-'+request.kind,resultHash:result.resultHash};}));
const get=(job,path)=>path.replace(/\[\*\]/g,'[0]').replace(/\[(\d+)\]/g,'.$1').split('.').reduce((v,k)=>v?.[k],job);

function tableBinding(job,t){
  assert.equal(t.rows.length,t.sourcePaths.length);
  t.rows.forEach((r,i)=>{assert.notEqual(get(job,t.sourcePaths[i]),undefined,t.sourcePaths[i]);assert.equal(r.length,t.columns.length);r.forEach((v,j)=>{const p=t.cellSourcePaths?.[i]?.[j];if(p)assert.deepEqual(v,get(job,p),p);});});
}

test('new finite acceptance and actual continuation panels resolve every mark, endpoint and exact table cell to retained source data',()=>{
  for(const job of jobs){
    const before=JSON.stringify(job),panels=actualSourcePanels(job);
    assert.equal(panels.length,job.request.kind==='ns.actual-pulse-amplitude'?6:job.request.kind==='ns.actual-continuation'?5:4);
    for(const panel of panels){
      for(const p of panel.scene.points){assert(p.pos.every(Number.isFinite));assert.deepEqual(p.value,get(job,p.sourcePath),p.sourcePath);if(p.xSourcePath)assert.equal(p.x,get(job,p.xSourcePath));}
      tableBinding(job,panel.table);for(const t of panel.relatedTables)tableBinding(job,t);
      for(const a of panel.axisMetadata)assert.notEqual(get(job,a.sourceField),undefined,a.sourceField);
      for(const d of panel.details)assert.notEqual(get(job,d.sourcePath),undefined,d.sourcePath);
      const merged=makeM2Visualization(job,{panel:panel.id});assert.equal(merged.state,'READY');assert.equal(merged.binding.sourceHash,job.result.sourceHash);assert.equal(merged.binding.panelId,panel.id);
    }
    assert.equal(JSON.stringify(job),before,'view adapters must not mutate a mathematical result');
  }
});

test('actual amplitude view preserves original left datum, nonunit midpoint and both nonzero logarithmic tails',()=>{
  const job=jobs[1],d=job.result.results,panels=actualSourcePanels(job),main=panels[0];
  assert.deepEqual(main.scene.points[0].value,[1,1]);
  const middle=main.scene.points[32].value;assert(middle[0]>.35&&middle[1]<.36);assert.equal(d.initial.midpointUnitSeedUsed,false);
  const log=panels.find(p=>p.id==='actual-amplitude-log');assert.equal(log.chart.series.length,3);
  assert(log.chart.series[0].points[0].y<-.3&&log.chart.series[0].points.at(-1).y<-.3);
  assert(d.rows.every(r=>r.actualAmplitude.P.positive&&r.actualAmplitude.P.underflowIsNotZero));
  const normal=panels.find(p=>p.id==='actual-amplitude-normal');assert.equal(normal.chart.series.length,3);
  assert(normal.chart.series[1].points.every(p=>p.y<0));assert(normal.chart.series[2].points.every(p=>p.y>0));
  assert.equal(d.scope.actualT0CovarianceMatched,false);assert.equal(job.result.scope.fullSameProfileN5,false);
});

test('the negative family changes the physical axial sign while retaining positive radial amplitude and input binding',async()=>{
  const request={kind:'ns.actual-pulse-amplitude',input:{sign:-1,steps:16}},result=await run(request.kind,request.input),job={id:'negative-family',request,result,status:result.status,inputHash:'negative-input',resultHash:result.resultHash};
  const p=actualSourcePanels(job).find(p=>p.id==='actual-amplitude-components');
  assert(p.chart.series[0].points.every(p=>p.y>0));assert(p.chart.series[1].points.every(p=>p.y>0));assert(p.chart.series[2].points.every(p=>p.y<0));
  assert.equal(makeM2Visualization(job,{panel:p.id}).binding.inputHash,'negative-input');
});

test('all new numeric panels render finite geometry at mobile and desktop widths, including tiny normal enclosures',()=>{
  const previous=globalThis.ResizeObserver;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  try{for(const width of [360,960]){
    const calls=[],style={},ctx=new Proxy({},{get:(o,k)=>o[k]??((...a)=>{if(['moveTo','lineTo','arc','fillRect','strokeRect','fillText'].includes(k))calls.push([k,...a]);}),set:(o,k,v)=>(o[k]=v,true)});
    const canvas={style,dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({width,height:Math.max(420,parseFloat(style.minHeight)||0),left:0,top:0}),addEventListener(){},setAttribute(){},setPointerCapture(){},hasPointerCapture:()=>false};
    const scene=new SourceBoundScene(canvas);
    for(const job of jobs)for(const panel of actualSourcePanels(job)){calls.length=0;scene.setVisualization({...panel,state:'READY',binding:{jobId:job.id}});for(const c of calls)for(const v of c.slice(1))if(typeof v==='number')assert(Number.isFinite(v),panel.id+' nonfinite canvas '+c[0]);}
    scene.destroy();
  }}finally{if(previous)globalThis.ResizeObserver=previous;else delete globalThis.ResizeObserver;}
});

test('stale editor and failed job cannot expose a previous finite acceptance panel',()=>{
  for(const job of jobs){assert.deepEqual(actualSourcePanels(job,{currentEditorMatches:false}),[]);for(const status of ['FAILED','CANCELLED','PRECISION_REQUIRED'])assert.deepEqual(actualSourcePanels({...job,status}),[]);}
});

test('invalid exact cells, fabricated pulse scales and unsupported families fail before execution',()=>{
  for(const request of [
    {kind:'ns.actual-pulse-amplitude',input:{sign:0}},
    {kind:'ns.actual-pulse-amplitude',input:{steps:20}},
    {kind:'ns.actual-pulse-amplitude',input:{h:.01}},
    {kind:'ns.actual-picard-acceptance',input:{Cn:1}},
    {kind:'ns.actual-continuation',input:{XInterval:['100','1']}},
    {kind:'ns.actual-continuation',input:{XInterval:['1','111']}},
    {kind:'ns.actual-continuation',input:{eta:'2'}},
    {kind:'ns.actual-continuation',input:{bits:192},precision:{bits:256}},
  ])assert.equal(validateRequest(request).ok,false,JSON.stringify(request));
});
