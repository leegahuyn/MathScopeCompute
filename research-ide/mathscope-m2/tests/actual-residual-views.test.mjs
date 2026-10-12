import test from 'node:test';
import assert from 'node:assert/strict';
import {run,validateRequest} from '../navier/index.mjs';
import {actualSourcePanels} from '../visualization/actual-source-panels.mjs';
import {makeM2Visualization} from '../visualization/m2-views.mjs';
import {SourceBoundScene} from '../visualization/renderer.mjs';

const request={kind:'ns.actual-residual-order',input:{bits:128,mesh:8,maxDerivativeOrder:2,timeIndices:[4,8,12,16]}};
const result=await run(request.kind,request.input);
const job={id:'actual-fixed-residual-view',request,result,status:result.status,inputHash:'actual-residual-input',resultHash:result.resultHash};
const get=path=>path.replace(/\[\*\]/g,'[0]').replace(/\[(\d+)\]/g,'.$1').split('.').reduce((v,k)=>v?.[k],job);
const panels=actualSourcePanels(job);
const number=value=>{const [a,b='1']=value.split('/');return Number(a)/Number(b);};

function tableBinding(table){
  assert.equal(table.rows.length,table.sourcePaths.length);
  table.rows.forEach((row,i)=>{
    assert.notEqual(get(table.sourcePaths[i]),undefined,table.sourcePaths[i]);
    assert.equal(row.length,table.columns.length);
    row.forEach((value,j)=>{const path=table.cellSourcePaths?.[i]?.[j];if(path)assert.deepEqual(value,get(path),path);});
  });
}

test('all seven residual panels resolve to the exact retained source and preserve job, input and result bindings',()=>{
  assert.equal(panels.length,7);assert.equal(new Set(panels.map(p=>p.id)).size,7);
  const before=JSON.stringify(job);
  for(const panel of panels){
    for(const point of panel.scene.points){
      assert(point.pos.every(Number.isFinite));assert.deepEqual(point.value,get(point.sourcePath),point.sourcePath);
      if(point.xSourcePath)assert.equal(point.x,get(point.xSourcePath));
      if(point.displaySourcePath)assert.deepEqual(point.displayEnclosure,get(point.displaySourcePath));
    }
    tableBinding(panel.table);panel.relatedTables.forEach(tableBinding);
    panel.axisMetadata.forEach(a=>assert.notEqual(get(a.sourceField),undefined,a.sourceField));
    panel.details.forEach(d=>assert.notEqual(get(d.sourcePath),undefined,d.sourcePath));
    const view=makeM2Visualization(job,{panel:panel.id});assert.equal(view.state,'READY');
    assert.equal(view.binding.panelId,panel.id);assert.equal(view.binding.inputHash,job.inputHash);
    assert.equal(view.binding.resultHash,job.resultHash);assert.equal(view.binding.sourceHash,result.sourceHash);
  }
  assert.equal(JSON.stringify(job),before);
});

test('the order chart plots one-sided bounds in log2, not invented norm values, and keeps exact q and positive physical scales',()=>{
  const main=panels[0];assert.equal(main.chart.series.length,2);
  assert(main.chart.series[0].label.includes('≥'));assert(main.chart.series[1].label.includes('≤'));
  for(const series of main.chart.series)for(const p of series.points){
    assert.equal(p.y,Math.log2(number(get(p.sourcePath))));
    assert.equal(p.displayTransform,'LOG2_OF_RETAINED_EXACT_ONE_SIDED_BOUND');
  }
  for(const r of result.results.timeRows){
    assert(number(r.N0NormLowerExact)>19);assert(number(r.N1NormUpperExact)<=1/16);
    assert.equal(r.qBinary64,null);assert.equal(r.qStrictlyPositive,true);
    assert.equal(r.commonPositivePhysicalScale,'q^(-3/2)*residualWitnessScale');
    assert.equal(r.intervalCentersAreNotComputedNormValues,true);
    assert(number(r.actualNormRatioUpperExact)<1);
  }
  assert.equal(main.observation.actualNormBoundsNotExactNormValues,true);
});

test('component intervals keep the nonzero pressure witness and axial residual without mixing their physical normalizations',()=>{
  const p=panels.find(p=>p.id==='actual-residual-components');assert.equal(p.chart.items.length,6);
  for(const item of p.chart.items){assert.deepEqual(item.value,get(item.sourcePath));assert(item.lower<=item.upper);}
  const rows=result.results.pointRows;
  assert(rows.filter(r=>r.N===0&&r.component==='radial').every(r=>r.displayEnclosure[0]>19));
  assert(rows.filter(r=>r.N===1&&r.component==='z').every(r=>r.displayEnclosure[0]>4));
  assert(rows.every(r=>r.XStrictlyPositive&&r.XBinary64===null&&r.physicalScale.positive&&r.physicalScale.parameterUnderflowNotSubstituted));
  assert.equal(p.table.totalRows,48);
  assert.equal(result.results.sourceErrorLedger.smallParameters.actualHPositive,true);
  assert.equal(result.results.scope.finitePolynomialTreatedAsFullSolution,false);
});

test('precision and grid tables preserve the same source domain, all exact endpoints, and the independent analytic error floor',()=>{
  const ref=result.results.refinement;
  assert.deepEqual(ref.precision.map(r=>r.bits),[96,128,192]);
  assert.deepEqual(ref.meshes.map(r=>r.mesh),[4,8,16,32]);
  assert(ref.precision.every(r=>r.XExact==='residualXUnit'&&r.analyticBudgetBits===160));
  assert(ref.meshes.every(r=>r.XMaxExact==='4*residualXUnit'&&r.sourceNormBoundUsesWholeDomain));
  assert.equal(ref.locationDependsOnArithmeticBits,false);assert.equal(ref.locationDependsOnMesh,false);assert.equal(ref.locationDependsOnQ,false);
  assert.equal(panels.find(p=>p.id==='actual-residual-precision').table.totalRows,18);
  assert.equal(result.precisionLedger.arithmeticBits,128);assert.equal(result.precisionLedger.displayArithmetic,'OUTWARD_BINARY64_FOR_DISPLAY_ONLY');
  for(const p of panels){assert.equal(p.observation.domainFixedAcrossOrderMeshAndPrecision,true);assert.equal(p.observation.globalOriginalCriteriaComplete,false);assert.equal(p.observation.wholeProfileResidualComplete,false);}
});

test('all residual panels draw finite geometry on narrow and wide layouts and retain exact tables',()=>{
  const previous=globalThis.ResizeObserver;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  try{for(const width of [360,960]){
    const calls=[],style={},ctx=new Proxy({},{get:(o,k)=>o[k]??((...a)=>{if(['moveTo','lineTo','arc','fillRect','strokeRect','fillText'].includes(k))calls.push([k,...a]);}),set:(o,k,v)=>(o[k]=v,true)});
    const canvas={style,dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({width,height:Math.max(420,parseFloat(style.minHeight)||0),left:0,top:0}),addEventListener(){},setAttribute(){},setPointerCapture(){},hasPointerCapture:()=>false};
    const scene=new SourceBoundScene(canvas);
    for(const panel of panels){
      calls.length=0;scene.setVisualization({...panel,state:'READY',binding:{jobId:job.id}});assert(calls.length>0,panel.id);
      for(const c of calls)for(const v of c.slice(1))if(typeof v==='number')assert(Number.isFinite(v),panel.id+' nonfinite '+c[0]);
      if(panel.id==='main'){
        const axisLabel=calls.find(c=>c[0]==='fillText'&&c[1]===panel.chart.yLabel);
        const legends=calls.filter(c=>c[0]==='fillText'&&/^N=[01] norm/.test(c[1]));
        assert(axisLabel&&legends.length===2,'norm axis and both bound legends must be visible');
        assert(legends.every(c=>axisLabel[3]-c[3]>=16),'bound legends and vertical-axis text need separate readable lines');
      }
    }
    scene.destroy();
  }}finally{if(previous)globalThis.ResizeObserver=previous;else delete globalThis.ResizeObserver;}
});

test('stale and failed requests hide prior residuals while display budgets preserve all source values',()=>{
  const before=JSON.stringify(result),small=actualSourcePanels(job,{maxPoints:3,maxRows:5});
  assert(small[0].scene.points.length<=3);assert.equal(small[0].lod.originalPoints,8);
  const component=small.find(p=>p.id==='actual-residual-components');assert.equal(component.table.totalRows,48);assert.equal(component.table.truncated,true);
  assert.equal(JSON.stringify(result),before);
  assert.deepEqual(actualSourcePanels(job,{currentEditorMatches:false}),[]);
  for(const status of ['FAILED','CANCELLED','PRECISION_REQUIRED'])assert.deepEqual(actualSourcePanels({...job,status}),[]);
});

test('source substitution, unsupported grids and precision, invalid q indices and insufficient budgets fail preflight',()=>{
  for(const input of [{h:0},{sourceProfile:'other-profile'},{Cnm:1},{mesh:5},{bits:95},{bits:513},{timeIndices:[4,4]},{timeIndices:[8,4]},{timeIndices:[]},{timeIndices:[257]}])assert.equal(validateRequest({kind:request.kind,input}).ok,false,JSON.stringify(input));
  for(const precision of [{mode:'FLOAT64'},{mode:'FORMAL'},{mode:'DIRECTED_BIGINT',bits:192}])assert.equal(validateRequest({...request,precision}).ok,false,JSON.stringify(precision));
  assert.equal(validateRequest({...request,precision:{mode:'DIRECTED_BIGINT',bits:128}}).ok,true);
  assert.equal(validateRequest({...request,budget:{maxOperations:10}}).ok,false);
});
