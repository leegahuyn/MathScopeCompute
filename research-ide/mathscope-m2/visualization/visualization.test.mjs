import test from 'node:test';
import assert from 'node:assert/strict';
import {listExamples,executeDomain,requestHash} from '../../mathscope-m1/core/registry.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {makeVisualization,numericValue,scalarText,sampleIndices,traceBasis,primeTiles,compareVisualizations,sealObservationIdentity} from './observations.mjs';
import {SourceBoundScene} from './renderer.mjs';
import fs from 'node:fs';

const fixtures=new Map();
let completeInventoryVerified=false;
test('all 59 shipped M1 computations have truthful source-bound observations, including the 26 formerly empty results',async()=>{
  const examples=await listExamples();assert.equal(examples.length,59);let formerlyEmpty=0;
  for(const e of examples){
    const started=Date.now(),result=await executeDomain(e.request,{checkCancelled(){if(Date.now()-started>60000)throw Error('M1 verification time budget exceeded');}});
    const job={id:e.id,request:e.request,inputHash:await requestHash(e.request),result,status:result.status,resultHash:await sha256(result)},before=await sha256(result);
    fixtures.set(e.id,job);
    const view=makeVisualization(job),raw=result.visualization||result.values?.visualization;
    if(!raw?.points?.length&&!raw?.lines?.length&&!raw?.arrows?.length)formerlyEmpty++;
    assert.equal(view.state,'READY',e.id);assert.ok(view.table.rows.length>0,e.id+' must have an actual value table');
    assert.ok(view.binding.sourceHash,e.id+' source identity');assert.equal(view.binding.inputHash,job.inputHash,e.id);assert.equal(view.binding.resultHash,job.resultHash,e.id);
    for(const p of view.scene.points)assert.ok(p.pos.length===3&&p.pos.every(Number.isFinite),e.id+' finite point');
    for(const l of view.scene.lines)assert.ok(l.points.every(p=>p.length===3&&p.every(Number.isFinite)),e.id+' finite line');
    for(const a of view.scene.arrows)assert.ok(a.pos.every(Number.isFinite)&&a.vector.every(Number.isFinite),e.id+' finite vector');
    assert.equal(await sha256(result),before,e.id+' rendering must not change result');assert.equal(view.binding.formalPass,false,e.id);
  }
  assert.equal(formerlyEmpty,26);
  completeInventoryVerified=true;
},{timeout:120000});

test('exact large integers, rational coordinates and typed Float64 are admitted without fabricating a real p-adic scalar',()=>{
  assert.equal(scalarText('18446744069414584321'),'18446744069414584321');
  assert.equal(numericValue({kind:'FLOAT64',value:9007199254740992}),9007199254740992);
  assert.equal(numericValue('3/2'),1.5);assert.equal(numericValue({kind:'RATIONAL',numerator:'-7',denominator:'2'}),-3.5);
  assert.ok(Number.isNaN(numericValue({kind:'PADIC_BALL',residue:'27',p:'3',digits:4})));
  assert.ok(Number.isNaN(numericValue({sign:1,logAbs:1000})));assert.ok(Number.isNaN(numericValue('1e400')));assert.ok(Number.isNaN(numericValue('1e-400')));
  const v=makeVisualization(fixtures.get('prime-large-certificate'));assert.equal(v.table.rows[0][0],'18446744069414584321');assert.match(v.chart.nodes[0].label,/18446744069414584321/);
});

test('stale inputs, no result, unsupported and failed calculations clear previous geometry',()=>{
  const source=fixtures.get('su3-bpst');
  const mismatch=makeVisualization(source,{currentEditorMatches:false});assert.equal(mismatch.state,'INPUT_CHANGED');assert.equal(mismatch.scene.points.length,0);assert.equal(mismatch.chart,null);
  assert.equal(makeVisualization(source,{currentRequest:{...source.request,input:{}}}).state,'INPUT_CHANGED');
  assert.equal(makeVisualization(null).state,'NOT_RUN');assert.equal(makeVisualization({...source,result:null,status:'RUNNING'}).state,'WAITING');
  for(const status of['FAILED','UNSUPPORTED','PRECISION_REQUIRED','CANCELLED','BUDGET_EXCEEDED']){const view=makeVisualization({...source,status,result:{...source.result,status,message:'explicit boundary'}});assert.equal(view.state,status);assert.equal(view.scene.points.length,0);assert.equal(view.scene.lines.length,0);assert.equal(view.description,'explicit boundary');}
});

test('LOD spans the full source array, preserves source indices and never mutates sample hashes',async()=>{
  const j=fixtures.get('prime-million'),n=j.result.visualization.points.length,view=makeVisualization(j,{maxPoints:61,maxRows:23});
  assert.equal(view.scene.points.length,61);assert.equal(view.scene.points[0].sourceIndex,0);assert.equal(view.scene.points.at(-1).sourceIndex,n-1);assert.equal(view.table.rows.length,23);
  assert.equal(view.table.rows[0][0],'0');assert.equal(view.table.rows.at(-1)[0],String(n-1));assert.equal(view.lod.changesComputation,false);
  assert.deepEqual(sampleIndices(100,4),[0,33,66,99]);
  const identity=await sealObservationIdentity(fixtures.get('su3-bpst')),view2=makeVisualization(fixtures.get('su3-bpst'),{maxPoints:17,observationIdentity:identity});
  assert.match(identity.sampleHash,/^[0-9a-f]{64}$/);assert.match(identity.observationHash,/^[0-9a-f]{64}$/);assert.notEqual(identity.sampleHash,identity.modelHash);
  assert.equal(view2.binding.sampleHash,identity.sampleHash);assert.equal(view2.binding.displayTransformHash,identity.displayTransformHash);
});

test('invalid line vertices split segments instead of drawing a fictional bridge; exact coordinate cells survive',()=>{
  const result={status:'COMPLETED',visualization:{points:[{pos:['1/3',{kind:'FLOAT64',value:2},3],value:'7/2'},{pos:[1,'not a number',0]}],lines:[{points:[[0,0,0],[1,1,0],[null,2,0],[3,3,0],[4,4,0]]}],axes:['x','y','z']}},j={id:'typed',request:{kind:'ns.axis-series'},status:'COMPLETED',inputHash:'exact-input',result};
  const view=makeVisualization(j);assert.equal(view.scene.points.length,1);assert.equal(view.scene.points[0].pos[0],1/3);assert.equal(view.table.rows[0][1],'1/3');assert.equal(view.scene.lines.length,2);assert.equal(view.lod.invalidCoordinates,2);assert.deepEqual(view.scene.lines[0].points.at(-1),[1,1,0]);assert.deepEqual(view.scene.lines[1].points[0],[3,3,0]);
});

test('prime tiles retain exact disjoint boundaries and visibly mark uncomputed ranges',()=>{
  const j=fixtures.get('prime-million'),atlas=primeTiles(j,{a:'0',b:'1000010'});assert.equal(atlas.tiles[0].status,'UNCOMPUTED');assert.equal(atlas.tiles[0].primeCount,null);assert.equal(atlas.tiles.at(-1).status,'UNCOMPUTED');
  const exact=atlas.tiles.filter(t=>t.status==='COMPUTED_EXACT');assert.equal(exact.reduce((s,t)=>s+t.primeCount,0),78498);
  for(let i=1;i<exact.length;i++)assert.equal(BigInt(exact[i-1].b)+1n,BigInt(exact[i].a));
});

test('complex basis trace returns exact outgoing maps and existing invariants',()=>{
  const j=fixtures.get('p1-p3'),t=traceBasis(j,0,1);assert.equal(t.ok,true);assert.equal(t.basis.id,'U0:function:1');assert.ok(t.differential.length);assert.ok(t.frobenius.length);assert.equal(t.inputHash,j.inputHash);assert.deepEqual(t.computedInvariants,j.result.results.smith.cohomology);assert.equal(traceBasis(j,99,0).status,'INVALID_BASIS');
  assert.equal(makeVisualization(fixtures.get('point-p3')).axisMetadata[0].type,'COHOMOLOGICAL_DEGREE');
});

test('cohomological degree is linear while explicitly stored logarithms retain their transform',()=>{
  const source=fixtures.get('p1-p3'),v=makeVisualization(source);assert.match(v.axisMetadata[0].label,/cohomological/);assert.equal(v.axisMetadata[0].scale,'linear');assert.equal(v.axisMetadata[0].transform,'identity');
  const modified=structuredClone(source);modified.result.visualization.axes=[{label:'log2(N)',type:'LOG_COUNT'},'log |tail|','cohomological degree'];const a=makeVisualization(modified).axisMetadata;
  assert.equal(a[0].scale,'stored-log');assert.equal(a[1].scale,'stored-log');assert.equal(a[2].scale,'linear');assert.deepEqual(makeVisualization(modified).scene.points.map(p=>p.pos),v.scene.points.map(p=>p.pos));
});

test('paired observations use one physical frame and color range and reject incompatible projection contracts',()=>{
  const a=fixtures.get('delta-assumed_bound'),b=structuredClone(a);b.id='same-field-independent-job';
  const comparison=compareVisualizations(a,b);assert.equal(comparison.ok,true);assert.equal(comparison.physicalFieldUnchanged,true);assert.deepEqual(comparison.left.scene.bounds,comparison.right.scene.bounds);assert.deepEqual(comparison.left.color.range,comparison.right.color.range);
  b.result.observation={...b.result.observation,slice:1};assert.equal(compareVisualizations(a,b).status,'OBSERVATION_CONTRACT_DIFFERS');
  const projection=makeVisualization(fixtures.get('g2-projection'));assert.equal(projection.observation.sourceDimension,4);assert.equal(projection.observation.nonInjective,true);assert.equal(projection.observation.reconstructionAllowed,false);assert.equal(projection.observation.kind,'LINEAR_PROJECTION');
});

function fakeCanvas(){
  const calls=[],listeners=new Map(),context=new Proxy({calls},{get(target,key){if(key in target)return target[key];return (...args)=>{assert.ok(args.every(a=>typeof a!=='number'||Number.isFinite(a)),`canvas ${String(key)} received a non-finite argument`);calls.push([key,...args]);};},set(target,key,value){target[key]=value;return true;}});
  return {ctx:context,calls,listeners,dataset:{},getContext:()=>context,getBoundingClientRect:()=>({width:760,height:420,left:0,top:0}),addEventListener:(name,fn)=>listeners.set(name,fn),setAttribute(){},setPointerCapture(){},hasPointerCapture:()=>false};
}

test('all chart families paint finite canvas commands; camera changes only presentation revision and exact source selection is retained',()=>{
  globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.devicePixelRatio=1;
  const representatives=['su3-bpst','prime-million','finite-spectrum','prime-large-certificate','algebra-G2','ns-heat-interval','ns-independent-checks','derived-reduction'];
  for(const id of representatives){const j=fixtures.get(id),before=canonicalStringify(j),canvas=fakeCanvas(),scene=new SourceBoundScene(canvas);scene.setVisualization(makeVisualization(j));assert.equal(canvas.dataset.renderReady,'true',id);assert.ok(canvas.calls.length,id);const revision=scene.representationRevision;scene.camera('left');assert.ok(scene.representationRevision>revision,id);assert.equal(canonicalStringify(j),before,id);assert.equal(canvas.dataset.inputHash,j.inputHash);assert.ok(['NOT_REQUESTED','UNAVAILABLE'].includes(canvas.dataset.gpuPath));assert.match(scene.getMetrics().renderer,/^CPU_/);scene.destroy();}
  const canvas=fakeCanvas(),scene=new SourceBoundScene(canvas);scene.setVisualization(makeVisualization(fixtures.get('algebra-SU3')));const point=scene.projected[0];scene.pick({clientX:point.xy[0],clientY:point.xy[1]});assert.match(scene.lastPicked.sourcePath,/cartan\[0\]\[0\]/);assert.equal(scene.lastPicked.value,2);
});

test.after(async()=>{
  if(!completeInventoryVerified)return;
  const inventory=[...fixtures.values()].map(job=>{const v=makeVisualization(job),raw=job.result.visualization||job.result.values?.visualization;return {id:job.id,oldEmpty:!raw?.points?.length&&!raw?.lines?.length&&!raw?.arrows?.length,kind:v.kind,state:v.state,points:v.scene.points.length,lines:v.scene.lines.length,arrows:v.scene.arrows.length,rows:v.table.rows.length,totalRows:v.table.totalRows,finite:v.scene.points.every(p=>p.pos.every(Number.isFinite)),sourceBound:v.binding.inputHash===job.inputHash&&v.binding.resultHash===job.resultHash,coordinateTypes:v.axisMetadata.map(a=>a.type),units:v.axisMetadata.map(a=>a.unit),inputHash:job.inputHash,resultHash:job.resultHash,sourceHash:v.binding.sourceHash,modelHash:v.binding.modelHash};});
  const sourceSHA256={};for(const path of ['observations.mjs','renderer.mjs','m2-views.mjs','observation-panels.mjs','webgl-marks.mjs','m1-controls.mjs'])sourceSHA256[path]=await sha256(fs.readFileSync(new URL(path,import.meta.url),'utf8'));
  fs.writeFileSync(new URL('./evidence/adapted-inventory.json',import.meta.url),JSON.stringify(inventory,null,2));
  fs.writeFileSync(new URL('./evidence/source-hashes.json',import.meta.url),JSON.stringify({generatedAt:new Date().toISOString(),sourceSHA256,inventoryCount:inventory.length,formerlyEmpty:inventory.filter(x=>x.oldEmpty).length,verification:'All 59 M1 computations executed by the current visualization test with finite geometry, nonempty exact tables and unchanged source hashes. Browser coverage is separately recorded.'},null,2));
});
