import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const dir=dirname(fileURLToPath(import.meta.url));
const read=(name)=>readFileSync(resolve(dir,'..',name),'utf8');
const js=read('m3-remaining-eight-v107.js');
const css=read('m3-remaining-eight-v107.css');
const html=read('m3-remaining-eight-v107.html');
const ids=['N6-01','N6-02','N6-07','N6-08','N7-04','N7-05','N7-06','N8-05'];

class E {
  constructor(tag='div') {
    this.tagName=tag;this.children=[];this.dataset={};this.attributes={};
    this.events={};this.textContent='';this.value='';this.open=false;
  }
  setAttribute(key,value){this.attributes[key]=String(value);}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];}
  addEventListener(type,callback){this.events[type]=callback;}
  querySelector(selector){return selector==='.m3-boundary'?this.anchor:null;}
  click(){if(this.events.click)this.events.click({target:this});}
  showModal(){this.open=true;}
  close(){this.open=false;}
}

function mockDOM() {
  const el=new Map();
  for(const id of ['ms-m3eight-dialog','ms-m3eight-launch','ms-m3eight-nav',
    'ms-m3eight-title','ms-m3eight-description','ms-m3eight-original',
    'ms-m3eight-controls','ms-m3eight-svg','ms-m3eight-metrics',
    'ms-m3eight-warning','ms-m3eight-checks','ms-m3eight-links',
    'ms-m3eight-close','mathscopeResearchM3','ms-m4-data'])el.set(id,new E());
  const criteria=ids.map(id=>({
    taskId:id,title:'Original criterion '+id,
    exactCriterion:'Preserve the original mathematical acceptance criterion for '+id,
    requiredChecks:['UNRESOLVED_SOURCE_GATE_'+id],
    links:[{label:'Versioned source review',url:'https://github.com/leegahuyn/MathScopeCompute/blob/main/README.md'}]
  }));
  el.get('ms-m4-data').textContent=JSON.stringify({m3Accepted:56,m3Total:64,criteria});
  el.get('mathscopeResearchM3').anchor=new E();
  const document={
    documentElement:{dataset:{}},
    getElementById:(id)=>el.get(id)??null,
    createElement:(tag)=>new E(tag),
    createElementNS:(_ns,tag)=>new E(tag),
    createTextNode:(text)=>({textContent:text})
  };
  return {el,document};
}
test('Deployed CSS and HTML expose eight-gate modal without replacing existing MathScope',()=>{
  assert.match(html,/ms-m3eight-dialog/);
  assert.match(html,/ms-m3eight-launch/);
  assert.match(css,/@media\s*\(max-width:690px\)/);
  assert.match(html,/56\/64/);
  assert.doesNotMatch(html,/>64\/64</);
});
test('Deployed JavaScript parses and includes exactly the eight original pending gates',()=>{
  assert.doesNotThrow(()=>new Function('document',js));
  for(const id of ids)assert.ok(js.includes("'"+id+"'"),'missing '+id);
  assert.match(js,/공식 판정: OPEN/);
  assert.doesNotMatch(js,/wholeM3Complete\s*:\s*true/);
});
test('All eight selectable views render finite SVG figures and preserve OPEN evidence',()=>{
  const {el,document}=mockDOM();
  new Function('document',js)(document);
  const tabs=el.get('ms-m3eight-nav').children;
  assert.equal(tabs.length,8);
  for(let i=0;i<8;i++){
    tabs[i].click();
    assert.equal(tabs[i].attributes['aria-selected'],'true');
    assert.ok(el.get('ms-m3eight-svg').children.length>=8,'empty figure '+ids[i]);
    assert.ok(el.get('ms-m3eight-controls').children.length>=3,'missing controls '+ids[i]);
    assert.ok(el.get('ms-m3eight-metrics').textContent.length>20,'missing diagnostic '+ids[i]);
    assert.match(el.get('ms-m3eight-original').textContent,/원문 기준/);
    assert.match(el.get('ms-m3eight-warning').textContent,/공식 판정: OPEN/);
    assert.ok(el.get('ms-m3eight-checks').children.length>=1);
  }
  el.get('ms-m3eight-launch').click();
  assert.equal(el.get('ms-m3eight-dialog').open,true);
  el.get('ms-m3eight-close').click();
  assert.equal(el.get('ms-m3eight-dialog').open,false);
});
test('Parameter changes re-render the current bounded figure without changing proof gate',()=>{
  const {el,document}=mockDOM();
  new Function('document',js)(document);
  const tabs=el.get('ms-m3eight-nav').children;
  for(let i=0;i<tabs.length;i++){
    tabs[i].click();
    const sliders=el.get('ms-m3eight-controls').children.filter(x=>x.tagName==='input');
    assert.equal(sliders.length,1);
    const slider=sliders[0];
    const next=Math.min(Number(slider.attributes.max),Number(slider.value)+Number(slider.attributes.step));
    slider.value=String(next);
    assert.doesNotThrow(()=>slider.events.input());
    assert.match(el.get('ms-m3eight-warning').textContent,/OPEN/);
  }
});
