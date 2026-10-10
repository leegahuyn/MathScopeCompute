import test from 'node:test';
import assert from 'node:assert/strict';
import {SourceBoundScene} from '../visualization/renderer.mjs';

const endpoints=[{label:'X₋'},{label:'X₊'},{label:'X_b'}];
const rows=[
  {label:'n1 Tθ',fromIndex:0,toIndex:2,verified:true,sourcePath:'result.results.supportRows[0]'},
  {label:'n1 Tz',fromIndex:0,toIndex:1,verified:true,sourcePath:'result.results.supportRows[1]'},
  {label:'n2 Tθ',fromIndex:0,toIndex:1,verified:true,sourcePath:'result.results.supportRows[2]'},
  {label:'n2 Tz',fromIndex:0,toIndex:1,verified:true,sourcePath:'result.results.supportRows[3]'}
];

function render(width,sourceRows=rows){
  const previous=globalThis.ResizeObserver;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  const calls=[],style={},ctx=new Proxy({},{get:(o,k)=>o[k]??((...args)=>{if(['moveTo','lineTo','arc','fillRect','fillText'].includes(k))calls.push([k,...args]);}),set:(o,k,v)=>(o[k]=v,true)});
  const canvas={style,dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({width,height:Math.max(350,parseFloat(style.minHeight)||0),left:0,top:0}),addEventListener(){},setAttribute(){},setPointerCapture(){},hasPointerCapture:()=>false};
  try{
    const scene=new SourceBoundScene(canvas);
    scene.setVisualization({state:'READY',kind:'ORDERED_SUPPORTS',title:'응력 지지구간',description:'원본 끝점 순서',chart:{kind:'ORDERED_SUPPORTS',endpoints,rows:sourceRows},scene:{points:[],lines:[],arrows:[],axes:[]},binding:{jobId:'support-layout-proof',inputHash:'input',resultHash:'result',sourceHash:'source'}});
    const projected=structuredClone(scene.projected);scene.destroy();return {calls,projected,canvas};
  }finally{if(previous)globalThis.ResizeObserver=previous;else delete globalThis.ResizeObserver;}
}

test('ordered support drawing retains symbolic endpoints and makes the distinct order-one angular endpoint visible',()=>{
  for(const width of [360,960]){
    const {calls,projected,canvas}=render(width);
    assert.equal(canvas.dataset.renderReady,'true');
    assert.equal(canvas.dataset.renderer,'CPU_CANVAS2D_ORDERED_SUPPORTS');
    assert.equal(projected.length,8);
    for(const endpoint of endpoints)assert(calls.some(c=>c[0]==='fillText'&&c[1]===endpoint.label));
    const ends=rows.map(row=>projected.filter(p=>p.sourcePath===row.sourcePath).sort((a,b)=>a.pos[0]-b.pos[0]).at(-1));
    assert(ends[0].xy[0]>ends[1].xy[0]);
    assert.equal(ends[1].xy[0],ends[2].xy[0]);assert.equal(ends[2].xy[0],ends[3].xy[0]);
    assert(calls.some(c=>c[0]==='fillText'&&String(c[1]).includes('물리 거리나 응력 크기')));
    for(const call of calls)for(const value of call.slice(1))if(typeof value==='number')assert(Number.isFinite(value));
  }
});

test('support labels, row selection and metadata preserve the source instead of parsing enormous physical coordinates',()=>{
  const before=JSON.stringify(rows),{projected,canvas}=render(360);
  assert.equal(JSON.stringify(rows),before);
  for(const row of rows){const marks=projected.filter(p=>p.sourcePath===row.sourcePath);assert.equal(marks.length,2);assert(marks.every(p=>p.label.includes(row.label)&&p.label.includes('≤ X ≤')));}
  assert.equal(canvas.dataset.inputHash,'input');assert.equal(canvas.dataset.resultHash,'result');assert.equal(canvas.dataset.sourceHash,'source');
  assert(projected.every(p=>Number.isSafeInteger(p.pos[0])&&Number.isSafeInteger(p.pos[1])));
});

test('unproved or invalid endpoint indexes do not create a fabricated support segment',()=>{
  for(const row of [{fromIndex:-1,toIndex:2},{fromIndex:0,toIndex:3},{fromIndex:2,toIndex:1},{fromIndex:NaN,toIndex:1},{fromIndex:.5,toIndex:1}]){
    const {projected}=render(360,[{label:'invalid',sourcePath:'unproved',...row}]);assert.equal(projected.length,0);
  }
});
