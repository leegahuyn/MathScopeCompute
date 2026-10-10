import test from 'node:test';
import assert from 'node:assert/strict';
import {SourceBoundScene} from '../visualization/renderer.mjs';

test('nine interval observations remain selectable and clear of their endpoint labels and footer at mobile and desktop widths',()=>{
  const old=globalThis.ResizeObserver;
  globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  try{
    for(const [width,baseHeight] of [[360,320],[596,385],[960,420]]){
      const text=[],style={},ctx=new Proxy({},{get:(o,k)=>o[k]??((...a)=>{if(k==='fillText')text.push(a);}),set:(o,k,v)=>(o[k]=v,true)});
      const canvas={style,dataset:{},getContext:()=>ctx,getBoundingClientRect:()=>({width,height:Math.max(baseHeight,parseFloat(style.minHeight)||0),left:0,top:0}),addEventListener(){},setAttribute(){},setPointerCapture(){},hasPointerCapture:()=>false};
      const items=Array.from({length:9},(_,i)=>({label:'mixed derivative '+i,lower:i+.25,midpoint:i+.5,upper:i+.75,sourcePath:'result.rows['+i+']'}));
      const view={kind:'INTERVALS',state:'READY',title:'Actual mixed derivatives',description:'Retained exact intervals',chart:{kind:'INTERVALS',items},scene:{points:[],lines:[],arrows:[]},binding:{jobId:'layout',inputHash:'input',resultHash:'result'}};
      const before=JSON.stringify(view),scene=new SourceBoundScene(canvas);
      scene.setVisualization(view);
      assert.equal(scene.projected.length,9);
      assert.deepEqual(scene.projected.map(p=>p.sourcePath),items.map(p=>p.sourcePath));
      const footer=text.find(t=>t[0].startsWith('Independent row scales'));
      assert(footer);
      const endpoints=text.filter(t=>/^\d+\.\d+$/.test(t[0]));
      assert.equal(endpoints.length,18);
      assert(Math.max(...endpoints.map(t=>t[2]))<=footer[2]-20,'last endpoint label overlaps footer');
      for(let i=1;i<scene.projected.length;i++)assert(scene.projected[i].xy[1]-scene.projected[i-1].xy[1]>=30,'interval rows are too close');
      assert.equal(JSON.stringify(view),before);
      scene.setVisualization({...view,kind:'STATE',chart:null,description:'Waiting'});
      assert.equal(style.minHeight,'','interval height must not persist on a different panel');
      scene.destroy();
    }
  }finally{if(old)globalThis.ResizeObserver=old;else delete globalThis.ResizeObserver;}
});
