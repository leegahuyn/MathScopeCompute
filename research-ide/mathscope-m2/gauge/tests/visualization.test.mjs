import test from 'node:test';
import assert from 'node:assert/strict';
import {getExamples,run} from '../index.mjs';
import {canonicalStringify,sha256} from '../../../mathscope-m0/contracts.mjs';
import {makeM2Visualization,listM2Panels} from '../../visualization/m2-views.mjs';
import {makeVisualization,compareVisualizations,sealObservationIdentity} from '../../visualization/observations.mjs';
import {SourceBoundScene} from '../../visualization/renderer.mjs';

const fixtures=new Map();
const actualSource=(job,path)=>path.replace(/\[(\d+)\]/g,'.$1').split('.').reduce((v,k)=>v?.[k],job);
async function jobFor(e){
  const result=await run(e.request.kind,e.request.input),{executionMetrics,...body}=result;
  return {id:e.id,request:e.request,status:result.status,result,inputHash:await sha256(e.request),resultHash:await sha256(result),mathematicalHash:await sha256(body)};
}

test('all eight actual gauge examples bind finite views, complete exact tables and real model/sample/observation hashes',async()=>{
  for(const e of getExamples()){
    const job=await jobFor(e);fixtures.set(e.id,job);
    const before=canonicalStringify(job),view=makeM2Visualization(job,{maxPoints:31,maxRows:19});
    assert.equal(view.state,'READY',e.id);assert.ok(view.table.rows.length,e.id);
    for(const key of ['sourceHash','modelHash','sampleHash','observationHash'])assert.match(view.binding[key],/^[0-9a-f]{64}$/,e.id+' '+key);
    assert.equal(view.binding.calculationStatus,job.status);assert.equal(view.binding.formalPass,false);
    for(const p of view.scene.points){assert.ok(p.pos.every(Number.isFinite),e.id);assert.notEqual(actualSource(job,p.sourcePath),undefined,e.id+' '+p.sourcePath);}
    for(const path of view.table.sourcePaths)assert.notEqual(actualSource(job,path),undefined,e.id+' table '+path);
    assert.equal(canonicalStringify(job),before,e.id+' adapter does not change computation');
  }
});

test('lattice slice displays actual four-coordinates and binds each scalar directly to measurements.sites',()=>{
  const job=fixtures.get('m2-bpst-lattice'),view=makeM2Visualization(job,{maxPoints:13,maxRows:11});
  assert.equal(view.kind,'SPATIAL_3D');assert.equal(view.scene.equalScale,true);
  assert.deepEqual(view.axisMetadata.map(a=>a.type),Array(3).fill('PHYSICAL_SPACE_COORDINATE'));
  assert.equal(view.observation.sourceDimension,4);assert.equal(view.observation.fixedCoordinate.type,'EUCLIDEAN_TIME');
  assert.equal(view.observation.fixedCoordinate.value,-.5);
  assert.equal(view.observation.reconstructionAllowed,false);
  for(const [i,path] of view.table.sourcePaths.entries()){
    const source=actualSource(job,path),row=view.table.rows[i];
    assert.deepEqual(row.slice(2,6),source.coordinate4);assert.equal(row[6],source.actionDensity);
  }
  for(const p of view.scene.points)assert.equal(actualSource(job,p.sourcePath),p.value);
  assert.equal(view.table.totalRows,27);assert.equal(view.table.truncated,true);
});

test('algorithm histories and spacing/error pairs never acquire a spatial interpretation from a gauge prefix',()=>{
  const reference=fixtures.get('m2-su2-haar-reference'),refinement=fixtures.get('m2-bpst-refinement');
  assert.equal(makeVisualization(reference).kind,'RELATION_3D');
  assert.equal(makeVisualization(refinement).kind,'RELATION_3D');
  const a=makeM2Visualization(reference,{maxPoints:23,maxRows:7}),b=makeM2Visualization(refinement);
  assert.equal(a.kind,'SERIES');assert.deepEqual(a.axisMetadata.map(x=>x.type),['ALGORITHM_ITERATION','OBSERVABLE']);
  assert.equal(a.observation.physicalDimension,0);assert.equal(a.table.totalRows,12000);
  assert.equal(a.scene.points[0].sourceIndex,0);assert.equal(a.scene.points.at(-1).sourceIndex,11999);
  assert.equal(b.kind,'SERIES');assert.deepEqual(b.axisMetadata.map(x=>[x.type,x.physicalDimension]),[['PHYSICAL_LENGTH',1],['NUMERIC_ERROR',-2]]);
  assert.equal(b.observation.physicalDimension,0);assert.deepEqual(b.observation.fixedPhysicalPoint,[.2,-.3,.1,.4]);
});

test('declared NS axis.kind and time units prevent mixed r,z,tau data from becoming Euclidean spatial geometry',()=>{
  const job={id:'typed-axis-contract',request:{kind:'ns.benchmark'},status:'COMPLETED',result:{status:'COMPLETED',visualization:{points:[{pos:[1,2,.5],value:3}],axes:[{label:'r',kind:'PHYSICAL',unit:'m'},{label:'z',kind:'PHYSICAL',unit:'m'},{label:'tau',kind:'PHYSICAL',unit:'time'}]}}};
  const view=makeVisualization(job);
  assert.equal(view.kind,'RELATION_3D');assert.equal(view.scene.equalScale,false);
  assert.deepEqual(view.axisMetadata.map(a=>a.type),['PHYSICAL_COORDINATE','PHYSICAL_COORDINATE','PHYSICAL_TIME']);
  assert.deepEqual(view.observation.coordinateTypes,view.axisMetadata.map(a=>a.type));
  job.result.visualization.axes=[{label:'x',type:'PHYSICAL_SPACE_COORDINATE',unit:'m'},{label:'y',type:'PHYSICAL_SPACE_COORDINATE',unit:'m'},{label:'z',type:'PHYSICAL_SPACE_COORDINATE',unit:'m'}];
  assert.equal(makeVisualization(job).kind,'SPATIAL_3D');
  job.result.visualization.axes[2].unit='cm';assert.equal(makeVisualization(job).kind,'RELATION_3D','different unconverted length units do not share an equal-scale physical scene');
});

test('burn-in and measurement are separate source-bound series; thinning and effective sample limitations stay visible',()=>{
  const job=fixtures.get('m2-su2-wilson-ensemble'),r=job.result;
  assert.equal(job.status,'PARTIAL');
  for(const panel of listM2Panels(job).filter(p=>p.id!=='main')){
    const view=makeM2Visualization(job,{panel:panel.id,maxPoints:31,maxRows:17});
    assert.equal(view.state,'READY');assert.equal(view.binding.calculationStatus,'PARTIAL');assert.equal(view.kind,'SERIES');
    assert.equal(view.binding.sourceHash,r.historyHash);assert.notEqual(view.binding.sourceHash,r.sourceHash);
    assert.equal(view.binding.configurationHash,r.sourceHash);assert.equal(view.binding.ensembleHash,r.ensembleHash);
    assert.notEqual(view.binding.observationHash,r.visualization.observationHash);
    assert.equal(view.table.totalRows,256);assert.equal(view.table.rows.length,17);
    assert.match(view.description,/ESS=/);assert.match(view.description,/구간 미산정/);
    assert.deepEqual(view.chart.series.map(s=>s.phase),['BURN_IN','MEASUREMENT','BURN_IN','MEASUREMENT']);
    for(const s of view.chart.series){
      assert.ok(s.points.every(p=>p.phase===s.phase));
      assert.deepEqual(s.dash,s.phase==='BURN_IN'?[6,4]:[]);
      assert.ok(s.points.every(p=>p.retention===(s.phase==='BURN_IN'?'EXCLUDED_BURN_IN':'RETAINED')));
      for(const p of s.points)assert.equal(actualSource(job,p.sourcePath),p.sourceValue);
    }
    assert.equal(view.chart.series[0].color,view.chart.series[1].color);
    assert.notEqual(view.chart.series[0].color,view.chart.series[2].color);
  }
});

test('view slice/LOD changes preserve model, source, sample and history identities while changing the slice observation',async()=>{
  const original=fixtures.get('m2-su2-wilson-ensemble'),e=structuredClone(getExamples().find(x=>x.id===original.id));
  e.id='same-ensemble-other-x4';e.request.input.view={...e.request.input.view,timeSlice:1,stride:2};
  const other=await jobFor(e),a=original.result,b=other.result;
  for(const key of ['modelHash','sourceHash','sampleHash','ensembleHash','historyHash'])assert.equal(a[key],b[key],key);
  assert.notEqual(a.visualization.observationHash,b.visualization.observationHash);
  assert.equal(a.charts[0].observationHash,b.charts[0].observationHash);
  assert.equal(compareVisualizations(original,other).status,'OBSERVATION_CONTRACT_DIFFERS');
  const v1=makeM2Visualization(original,{panel:'wilson-action-history',maxPoints:11}),v2=makeM2Visualization(original,{panel:'wilson-action-history',maxPoints:99});
  assert.equal(v1.binding.observationHash,v2.binding.observationHash);assert.equal(v1.binding.sourceHash,v2.binding.sourceHash);
  const identity=await sealObservationIdentity(original);assert.match(identity.sampleHash,/^[0-9a-f]{64}$/);assert.equal(identity.modelHash,a.modelHash);
});

test('open-boundary incomplete curvature stays an explicit empty observation with source rows and null values',async()=>{
  const e=structuredClone(getExamples()[0]);e.id='open-incomplete';
  e.request.input={...e.request.input,lattice:{...e.request.input.lattice,spatialBoundary:'OPEN',temporalBoundary:'OPEN'},measurement:'CLOVER',view:{timeSlice:0,stride:1,quantity:'curvatureEnergyDensity'}};
  const job=await jobFor(e),view=makeM2Visualization(job);
  assert.equal(view.state,'READY');assert.equal(view.kind,'TABLE');assert.equal(view.emptyState.status,'NO_COMPLETE_STENCIL');
  assert.equal(view.scene.points.length,0);assert.equal(view.table.rows.length,8);
  assert.ok(view.table.rows.every(row=>row[6]===null&&row[7]==='INCOMPLETE'));
  assert.match(view.description,/미확정/);assert.match(view.binding.observationHash,/^[0-9a-f]{64}$/);
});

test('deterministic beta-zero action does not acquire a zero ESS or confidence interval in its chart label',async()=>{
  const e=structuredClone(getExamples().find(x=>x.id==='m2-su2-wilson-ensemble'));e.id='beta-zero-view';e.request.input.beta=0;
  const job=await jobFor(e),view=makeM2Visualization(job,{panel:'wilson-action-history'});
  assert.ok(job.result.replicas.every(r=>r.statistics.action.effectiveSampleSize===null));
  assert.match(view.description,/ESS=미확정/);assert.match(view.description,/DETERMINISTIC_OBSERVABLE/);
  assert.doesNotMatch(view.description,/ESS=0(?:,|\.)/);
});

function fakeCanvas(){
  const calls=[],attributes={},context=new Proxy({calls},{get(target,key){if(key in target)return target[key];return (...args)=>{assert.ok(args.every(x=>typeof x!=='number'||Number.isFinite(x)),String(key)+' nonfinite canvas command');calls.push([key,...args]);};},set(target,key,value){target[key]=value;return true;}});
  return {calls,attributes,dataset:{},getContext:()=>context,getBoundingClientRect:()=>({width:760,height:420,left:0,top:0}),addEventListener(){},setAttribute(key,value){attributes[key]=value;},setPointerCapture(){},hasPointerCapture:()=>false};
}

test('actual gauge views paint finite Canvas commands; switching to legacy data clears every stale source identity',()=>{
  globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.devicePixelRatio=1;
  const canvas=fakeCanvas(),scene=new SourceBoundScene(canvas);
  for(const job of fixtures.values())for(const panel of listM2Panels(job)){
    const before=canonicalStringify(job),view=makeM2Visualization(job,{panel:panel.id,maxPoints:31});
    scene.setVisualization(view);assert.equal(canvas.dataset.renderReady,'true');assert.equal(canvas.dataset.sourceHash,view.binding.sourceHash);
    assert.equal(canvas.dataset.observationHash,view.binding.observationHash);assert.equal(canvas.dataset.sourceJobId,job.id);
    const p=scene.projected[0];if(p){scene.pick({clientX:p.xy[0],clientY:p.xy[1]});assert.ok(canvas.dataset.selectedSourcePath);}
    scene.camera('left');assert.equal(canonicalStringify(job),before);
  }
  scene.set({points:[{pos:[0,0,0]}],lines:[],arrows:[],axes:['x','y','z']});
  for(const key of ['sourceJobId','sourceHash','modelHash','sampleHash','observationHash','inputHash','resultHash','ensembleHash','historyHash','configurationHash','selectedSourcePath','visualizationState','observationKind'])assert.equal(canvas.dataset[key],undefined,key+' must be cleared');
  assert.equal(scene.presentation,null);assert.equal(scene.lastPicked,null);scene.destroy();
});
