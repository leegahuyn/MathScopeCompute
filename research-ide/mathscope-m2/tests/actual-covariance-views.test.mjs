import test from 'node:test';
import assert from 'node:assert/strict';
import {run,validateRequest} from '../navier/index.mjs';
import {actualSourcePanels} from '../visualization/actual-source-panels.mjs';
import {makeM2Visualization} from '../visualization/m2-views.mjs';
import {SourceBoundScene} from '../visualization/renderer.mjs';

const request={kind:'ns.actual-covariance-matching',input:{y:2.5,cells:256,cutoffCells:256,bits:512}};
const result=await run(request.kind,request.input);
const job={id:'actual-covariance-view',request,result,status:result.status,inputHash:'actual-covariance-input',resultHash:result.resultHash};
const get=(path)=>path.replace(/\[\*\]/g,'[0]').replace(/\[(\d+)\]/g,'.$1').split('.').reduce((v,k)=>v?.[k],job);
const panels=actualSourcePanels(job);

function tableBinding(table){
  assert.equal(table.rows.length,table.sourcePaths.length);
  table.rows.forEach((row,i)=>{
    assert.notEqual(get(table.sourcePaths[i]),undefined,table.sourcePaths[i]);
    assert.equal(row.length,table.columns.length);
    row.forEach((value,j)=>{const path=table.cellSourcePaths?.[i]?.[j];if(path)assert.deepEqual(value,get(path),path);});
  });
}

test('eight covariance views retain every exact table, endpoint, axis and job binding without mutating the actual result',()=>{
  assert.equal(result.status,'PARTIAL');assert.equal(panels.length,8);assert.equal(new Set(panels.map(p=>p.id)).size,8);
  const before=JSON.stringify(job);
  for(const panel of panels){
    for(const point of panel.scene.points){
      assert(point.pos.every(Number.isFinite));assert.deepEqual(point.value,get(point.sourcePath),point.sourcePath);
      if(point.xSourcePath)assert.equal(point.x,get(point.xSourcePath),point.xSourcePath);
      if(point.displaySourcePath)assert.deepEqual(point.displayEnclosure,get(point.displaySourcePath));
    }
    tableBinding(panel.table);panel.relatedTables.forEach(tableBinding);
    panel.axisMetadata.forEach(a=>assert.notEqual(get(a.sourceField),undefined,a.sourceField));
    panel.details.forEach(d=>assert.notEqual(get(d.sourcePath),undefined,d.sourcePath));
    const view=makeM2Visualization(job,{panel:panel.id});
    assert.equal(view.state,'READY');assert.equal(view.binding.panelId,panel.id);assert.equal(view.binding.inputHash,job.inputHash);
    assert.equal(view.binding.resultHash,job.resultHash);assert.equal(view.binding.sourceHash,result.sourceHash);
  }
  assert.equal(JSON.stringify(job),before);
});

test('actual covariance views preserve the positive inverse, two physical signs, heat correction and strictly nonzero quadrature tail',()=>{
  const data=result.results,match=data.localMatch,cov=match.pulseCovariance;
  const main=panels.find(p=>p.id==='main');assert.equal(main.chart.items.length,2);
  assert(main.chart.items.every(p=>p.lower>0&&p.upper<4));
  assert.deepEqual(main.chart.items[0].value,main.chart.items[1].value);
  const matrix=panels.find(p=>p.id==='actual-covariance-matrix').chart.items;
  assert(matrix.slice(0,3).every(p=>p.lower>0));assert(matrix[3].upper<0);
  assert(cov.integrals.tail.absoluteUpper>0);
  const target=panels.find(p=>p.id==='actual-covariance-target').chart.items;
  assert(target[0].lower<1&&target[0].upper>1);assert.deepEqual(target[1].value,[0,0]);
  assert.equal(data.physicalIdentity.globalIdentityAtThisActualPointVerified,true);
  assert.deepEqual(data.physicalIdentity.exactResidual,[0,0]);
  assert.equal(cov.parity.sameSlowBoxCount,1);assert.equal(cov.parity.signRectangles,2);
  assert.equal(cov.parity.oppositeSignsIncludedAsSeparateBoxes,false);
});

test('source point verification cannot become a whole-annulus or whole-package acceptance in any panel',()=>{
  for(const panel of panels){
    assert.equal(panel.observation.actualSourceTarget,true);
    assert.equal(panel.observation.actualPointwiseEquation730,true);
    assert.equal(panel.observation.wholeAnnulusCovarianceMatched,false);
    assert.equal(panel.observation.sourceUniformQStarCertified,false);
    assert.equal(panel.observation.globalOriginalCriteriaComplete,false);
  }
  assert.equal(result.scope.fullSameProfileN5,false);assert.equal(result.scope.wholeAnnulusCovarianceMatched,false);
  assert.equal(result.scope.sourceUniformQStarCertified,false);assert(result.blockers.length>0);
  assert.equal(result.precisionLedger.arithmeticBits,53);assert.equal(result.precisionLedger.targetEnclosureExponent,512);
  assert.equal(result.precisionLedger.wholeResultArbitraryPrecision,false);
});

test('all covariance panels render finite canvas geometry at narrow and wide widths while retaining precise tables',()=>{
  const previous=globalThis.ResizeObserver;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  try{for(const width of [360,960]){
    const calls=[],style={},ctx=new Proxy({},{get:(o,k)=>o[k]??((...a)=>{if(['moveTo','lineTo','arc','fillRect','strokeRect','fillText'].includes(k))calls.push([k,...a]);}),set:(o,k,v)=>(o[k]=v,true)});
    const canvas={style,dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({width,height:Math.max(420,parseFloat(style.minHeight)||0),left:0,top:0}),addEventListener(){},setAttribute(){},setPointerCapture(){},hasPointerCapture:()=>false};
    const scene=new SourceBoundScene(canvas);
    for(const panel of panels){calls.length=0;scene.setVisualization({...panel,state:'READY',binding:{jobId:job.id}});assert(calls.length>0,panel.id);for(const c of calls)for(const v of c.slice(1))if(typeof v==='number')assert(Number.isFinite(v),panel.id+' nonfinite '+c[0]);}
    scene.destroy();
  }}finally{if(previous)globalThis.ResizeObserver=previous;else delete globalThis.ResizeObserver;}
});

test('display subsampling preserves full integral results and stale or failed requests hide prior source covariance',()=>{
  const before=JSON.stringify(result),small=actualSourcePanels(job,{maxPoints:7,maxRows:9});
  const density=small.find(p=>p.id==='actual-covariance-density');assert(density.scene.points.length<=7);assert.equal(density.lod.originalPoints,512);
  assert.equal(density.table.totalRows,256);assert.equal(density.table.truncated,true);assert(density.table.rows.length<=9);
  assert.equal(JSON.stringify(result),before);
  assert.deepEqual(actualSourcePanels(job,{currentEditorMatches:false}),[]);
  for(const status of ['FAILED','CANCELLED','PRECISION_REQUIRED'])assert.deepEqual(actualSourcePanels({...job,status}),[]);
});

test('foreign targets, modified source scales, invalid quadrature and unsupported precision fail before any covariance computation',()=>{
  for(const input of [{target:[1,0]},{h:.01},{sourceProfile:'other-profile'},{cells:100},{cutoffCells:32},{y:5},{bits:4097}])assert.equal(validateRequest({kind:request.kind,input}).ok,false,JSON.stringify(input));
  for(const precision of [{mode:'DIRECTED_BIGINT',bits:256},{bits:128}])assert.equal(validateRequest({...request,precision}).ok,false,JSON.stringify(precision));
  assert.equal(validateRequest({...request,budget:{maxOperations:10}}).ok,false);
});
