import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fourierSpace,integrateGalerkin} from '../../navier/galerkin.mjs';
import {buildFlowObservations} from '../../navier/flow-observations.mjs';
import {deriveExtendedScene,deriveExtendedViewContract,validateExtendedView} from '../extended-view-contract.mjs';

const run=integrateGalerkin({cutoff:2,endTime:.5}),observations=buildFlowObservations(run);
const result={package:'N8',results:run,observations},resultDigest=createHash('sha256').update(JSON.stringify(result)).digest('hex');
const record={result,resultDigest},view={camera:{yaw:-.56,pitch:.44,zoom:1},lod:250,state:'all',selected:'0:13'};

test('physical and periodic-box displays share exact samples and a fixed full domain',()=>{
  const p=deriveExtendedScene(record,view),n=deriveExtendedScene(record,{...view,coordinateSystem:'periodic_box'});
  assert.deepEqual(p.displayBounds,[[0,2*Math.PI],[0,2*Math.PI],[0,2*Math.PI]]);
  assert.deepEqual(n.displayBounds,[[0,1],[0,1],[0,1]]);
  assert.deepEqual(p.sourceBounds[2],[0,0]);
  assert.deepEqual(n.points[13].sourcePosition,p.points[13].position);
  n.points[13].position.forEach((x,i)=>assert.equal(x,p.points[13].position[i]/(2*Math.PI)));
  n.points[13].velocity.forEach((x,i)=>assert.equal(x,p.points[13].velocity[i]/(2*Math.PI)));
  assert.equal(createHash('sha256').update(JSON.stringify(result)).digest('hex'),resultDigest);
});

test('angular-velocity colors preserve undefined axis values and physical velocity arrows',()=>{
  const scene=deriveExtendedScene(record,{...view,observable:'angular_velocity'});
  assert.equal(scene.points[0].value,null);assert.equal(scene.points[0].valueStatus,'UNDEFINED_ON_AXIS');
  assert.deepEqual(scene.points[13].velocity,observations.samples[13].velocity);
  assert.equal(scene.points[13].value,observations.samples[13].angularVelocity.value);
  const contract=deriveExtendedViewContract(record,{...view,observable:'angular_velocity'});
  assert.deepEqual(contract.undefinedSourceIds,['0:0']);assert.equal(contract.vectorMultiplier,.3);
  assert.equal(contract.vectorNormalization,'NONE');
});

test('both displayed path types keep parameter semantics and actual coefficient source',()=>{
  const scene=deriveExtendedScene(record,{...view,flowPaths:'both'}),contract=deriveExtendedViewContract(record,{...view,flowPaths:'both'});
  assert.equal(scene.paths.length,4);assert.equal(contract.flowPaths.length,4);
  for(const path of scene.paths){const original=observations.paths.find(p=>p.id===path.id);assert.equal(path.points.length,original.points.length);assert.deepEqual(path.points.at(-1).sourcePosition,original.points.at(-1).position);}
  assert.ok(contract.flowPaths.some(p=>p.coefficientSource==='results.stateHistory.frames'));
  assert.ok(contract.flowPaths.some(p=>p.fieldTime===run.lastResolvedTime));
  assert.equal(contract.energyScope.global,'FULL_PERIODIC_BOX');assert.equal(contract.energyScope.core,'SELECTED_BOX_SUBREGION');
});

test('periodic path transforms retain physical sources and scale velocity and unwrapped motion together',()=>{
  const tau=2*Math.PI,S=fourierSpace(1),initial=[...S.zero()];initial[6*S.meanIndex]=1;
  const constantRun=integrateGalerkin({cutoff:1,initial,endTime:.1});
  const original={package:'N8',results:constantRun,observations:buildFlowObservations(constantRun,{seeds:[[tau-.01,.5,.5]]})};
  const sourceDigest=createHash('sha256').update(JSON.stringify(original)).digest('hex');
  const fixed={result:original,resultDigest:sourceDigest};
  const physical=deriveExtendedScene(fixed,{...view,flowPaths:'both'}),box=deriveExtendedScene(fixed,{...view,flowPaths:'both',coordinateSystem:'periodic_box'});
  assert.equal(box.paths.length,2);
  for(const path of box.paths){
    const source=original.observations.paths.find(p=>p.id===path.id),physicalPath=physical.paths.find(p=>p.id===path.id);
    assert.deepEqual(path.parameter,source.parameter);assert.equal(path.coefficientSource,source.coefficientSource);
    for(let i=0;i<path.points.length;i++){
      const p=path.points[i],q=source.points[i];
      assert.deepEqual(p.sourcePosition,q.position);assert.deepEqual(p.sourceVelocity,q.velocity);assert.deepEqual(p.sourceUnwrappedPosition,q.unwrappedPosition);
      assert.notEqual(p.sourcePosition,q.position);assert.notEqual(p.sourceVelocity,q.velocity);assert.notEqual(p.sourceUnwrappedPosition,q.unwrappedPosition);
      assert.deepEqual(physicalPath.points[i].position,q.position);assert.deepEqual(physicalPath.points[i].velocity,q.velocity);assert.deepEqual(physicalPath.points[i].unwrappedPosition,q.unwrappedPosition);
      for(let j=0;j<3;j++){
        assert.ok(Math.abs(p.position[j]-q.position[j]/tau)<1e-15);
        assert.ok(Math.abs(p.unwrappedPosition[j]-q.unwrappedPosition[j]/tau)<1e-15);
      }
      assert.deepEqual(p.velocity,[1/tau,0,0]);assert.equal(p.parameter,q.parameter);assert.equal(p.time,q.time);
      assert.equal(p.sourceVelocityUnit,'model_length/model_time');assert.equal(p.velocityUnit,'box_length/model_time');
    }
    const last=path.points.at(-1);
    assert.ok(last.unwrappedPosition[0]>1);assert.ok(last.position[0]<.02);
    assert.ok(Math.abs(last.unwrappedPosition[0]-last.position[0]-1)<1e-14);
    assert.ok(Math.abs(last.unwrappedPosition[0]-path.points[0].unwrappedPosition[0]-.1/tau)<1e-14);
  }
  assert.equal(createHash('sha256').update(JSON.stringify(original)).digest('hex'),sourceDigest);
});

test('the rendered table distinguishes physical velocity, display velocity and angular-value units',()=>{
  // Execute the actual table function with minimal DOM cells, so this catches a
  // mislabeled rendered column even when the scene's numerical transform is right.
  const source=readFileSync(new URL('../extended-workspace.js',import.meta.url),'utf8');
  const start=source.indexOf('function renderTable(){'),end=source.indexOf('function renderVisual(){',start);
  assert.ok(start>=0&&end>start);
  const makeTable=new Function('out','el','pretty','visibleGroups','currentView','select','model','short','show',source.slice(start,end)+'; return renderTable;');
  for(const coordinateSystem of ['physical','periodic_box'])for(const observable of ['value','angular_velocity']){
    const settings={...view,coordinateSystem,observable},scene=deriveExtendedScene(record,settings),table={children:[],replaceChildren(){this.children=[];},append(node){this.children.push(node);}};
    const el=(tag,text)=>({tag,text:text??'',children:[],append(...nodes){this.children.push(...nodes);},addEventListener(){}});
    makeTable(()=>table,el,JSON.stringify,()=>scene.visible,()=>settings,()=>{},{curves:[]},String,()=>{})();
    assert.equal(table.children.length,observations.samples.length);
    for(const i of [0,13]){
      const cells=table.children[i].children,values=JSON.parse(cells[2].text),units=JSON.parse(cells[3].text),p=observations.samples[i];
      const scale=coordinateSystem==='periodic_box'?1/(2*Math.PI):1;
      assert.deepEqual(values.sourceVelocity,p.velocity);
      assert.deepEqual(values.displayVelocity,p.velocity.map(x=>x*scale));
      assert.equal(values.displayedValue,observable==='angular_velocity'?p.angularVelocity.value:p.speed*scale);
      assert.equal(values.status,observable==='angular_velocity'?p.angularVelocity.status:'DEFINED');
      assert.equal(units.sourceVelocity,'model_length/model_time');
      assert.equal(units.displayVelocity,coordinateSystem==='periodic_box'?'box_length/model_time':'model_length/model_time');
      assert.equal(units.displayedValue,observable==='angular_velocity'?'1/model_time':units.displayVelocity);
    }
  }
  assert.equal(createHash('sha256').update(JSON.stringify(result)).digest('hex'),resultDigest);
});

test('camera and LOD never alter source positions, energy or result digest',()=>{
  const a=deriveExtendedViewContract(record,view),b=deriveExtendedViewContract(record,{...view,camera:{yaw:1,pitch:-1,zoom:3},lod:1000});
  assert.deepEqual(a.displayBounds,b.displayBounds);assert.deepEqual(a.commonColorRange,b.commonColorRange);
  assert.equal(a.basedOnResultDigest,b.basedOnResultDigest);assert.equal(b.mathematicalSourceChanged,false);
  assert.equal(b.proofAuthority,'NONE_VIEW_ONLY');
});

test('undeclared transforms, invented paths and source identifiers are rejected',()=>{
  assert.throws(()=>validateExtendedView({...view,coordinateSystem:'original_paper_core'}),/coordinate system/);
  assert.throws(()=>deriveExtendedViewContract(record,{...view,selected:'0:999'}),/absent/);
  const plain={result:{states:[{points:[{position:[0,0,0],value:1,unit:'a'}]}]},resultDigest};
  assert.throws(()=>deriveExtendedViewContract(plain,{...view,selected:'0:0',coordinateSystem:'periodic_box'}),/absent/);
  assert.throws(()=>deriveExtendedViewContract(plain,{...view,selected:'0:0',flowPaths:'particles'}),/absent/);
  assert.throws(()=>deriveExtendedViewContract(plain,{...view,selected:'0:0',observable:'angular_velocity'}),/absent/);
  assert.equal(deriveExtendedScene(plain,{...view,selected:'0:0'}).points[0].value,1);
});
