import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const controllerSource=fs.readFileSync(new URL('../web/p7-visual-controller.js',import.meta.url),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
const binding={schema:'source/1',files:{'cli.py':'source-a','p7/elliptic_analytic.py':'analytic-a'}};
const differentBinding={schema:'source/1',files:{'cli.py':'source-b','p7/elliptic_analytic.py':'analytic-a'}};

function record(kind,model,tag,archived=true){
  return {
    schema:'MathScope.M3.P7Execution/1',request:{kind,input:model?{model}:{}},
    execution:{status:'COMPLETED'},sourceBinding:plain(binding),
    inputSHA256:'input-'+tag,recordSHA256:'record-'+tag,
    result:{model:model?{label:model}:undefined,scope:{universalBSDProved:false,universalRHProved:false}},
    serializedAuthority:'UNTRUSTED_REQUIRES_REEXECUTION',formalLeanProofIssued:false,wholeP7Complete:false,wholeM3Complete:false,
    ...(archived?{visualSource:{mode:'ARCHIVED_EXAMPLE',current:false,title:tag,archiveURL:'https://github.com/leegahuyn/MathScopeCompute/blob/p7/evidence/'+tag+'.json.gz'}}:{})
  };
}
const seedRecords=()=>[
  record('p7.elliptic_analytic','11a1','central-11'),
  record('p7.elliptic_analytic','37a1','central-37'),
  record('p7.elliptic_local','37a1','local-37'),
  record('p7.explicit_formula',null,'explicit')
];

function element(){
  const handlers=new Map();
  return {textContent:'',value:'',hidden:false,disabled:false,children:[],handlers,
    append(child){this.children.push(child);},replaceChildren(...children){this.children=children;},
    removeAttribute(name){delete this[name];},addEventListener(name,handler){handlers.set(name,handler);},
    click(){handlers.get('click')?.({});}
  };
}

function setup({initialRecord=null,capabilities={sourceBinding:binding},records=seedRecords(),query='P7-06'}={}){
  const archive={records:plain(records),capabilities:{sourceBinding:plain(binding)}};
  const initialArchiveText=JSON.stringify(archive);
  const elements=new Map();
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  get('p7-visual-seeds').textContent=initialArchiveText;
  const events=new Map(),buildCalls=[],loads=[];
  let snapshot={revision:0,busy:false,capabilities,record:initialRecord};
  const renderer={setModel(){},clear(){},setCriterion(){},audit(){return {canvasCount:1};}};
  const location={href:'https://example.test/v0.3.1.html?p7='+query+'#research-m3'};
  const window={
    MathScopeP7VisualModels:{build(input){buildCalls.push(input);return {status:'DISPLAY_ONLY'};}},
    MathScopeP7Visualization:{mount(){return renderer;}},
    MathScopeP7Workspace:{snapshot:()=>snapshot,loadRequest:request=>{loads.push(plain(request));return {ok:true};},run(){throw Error('Controller must not auto-run a backend');}},
    addEventListener(name,callback){events.set(name,callback);}
  };
  vm.runInNewContext(controllerSource,{window,document:{getElementById:get,createElement:()=>element()},URL,location,history:{replaceState(_a,_b,url){location.href=String(url);}}},{timeout:1000});
  const emit=changes=>{snapshot={...snapshot,...changes};events.get('mathscope:p7-state')({detail:snapshot});};
  return {window,get,loads,archiveText:()=>get('p7-visual-seeds').textContent,initialArchiveText,emit,
    latest:()=>buildCalls.at(-1),calls:()=>buildCalls.length,audit:()=>plain(window.MathScopeP7VisualController.audit())};
}
const currents=h=>h.latest().records.filter(r=>r.visualSource?.current===true);

test('current 37a1 replaces only its archived analytic record; archived 11a1 and local data remain',()=>{
  const live=record('p7.elliptic_analytic','37a1','live-37',false),before=JSON.stringify(live);
  const h=setup({initialRecord:live});
  const records=h.latest().records;
  assert.equal(currents(h).length,1);
  assert.equal(currents(h)[0].recordSHA256,'record-live-37');
  assert.equal(currents(h)[0].visualSource.mode,'CURRENT_SERVER_RESULT');
  assert.equal(records.some(r=>r.recordSHA256==='record-central-37'),false);
  assert.equal(records.find(r=>r.recordSHA256==='record-central-11').visualSource.current,false);
  assert.equal(records.find(r=>r.recordSHA256==='record-local-37').visualSource.current,false);
  assert.equal(h.audit().currentResults,1);
  assert.equal(h.audit().archivedExamples,1);
  assert.equal(JSON.stringify(live),before,'Adding display metadata must not mutate the workspace record');
  assert.equal(h.archiveText(),h.initialArchiveText);
});

test('disconnect and source change both remove current authority and restore the archived record',()=>{
  const live=record('p7.elliptic_analytic','37a1','live-37',false);
  const h=setup({initialRecord:live});
  h.emit({capabilities:null});
  assert.equal(currents(h).length,0);
  assert.equal(h.latest().records.some(r=>r.recordSHA256==='record-central-37'),true);
  assert.equal(h.get('p7v-load-request').disabled,true);
  // Retained record A after failed reconnect followed by capabilities B is stale.
  h.emit({capabilities:{sourceBinding:differentBinding}});
  assert.equal(currents(h).length,0);
  assert.equal(h.audit().currentResults,0);
  assert.match(h.get('p7v-source-state').textContent,/현재 입력의 새 계산 결과 없음/);
  assert.equal(h.archiveText(),h.initialArchiveText);
});

test('equal source bindings compare canonically; object insertion order does not reject a current record',()=>{
  const live=record('p7.elliptic_analytic','37a1','live-37',false);
  const reordered={files:{'p7/elliptic_analytic.py':'analytic-a','cli.py':'source-a'},schema:'source/1'};
  const h=setup({initialRecord:live,capabilities:{sourceBinding:reordered}});
  assert.equal(currents(h).length,1);
  h.emit({capabilities:{}});
  assert.equal(currents(h).length,0,'Missing current source binding is not a match');
});

test('edited input clears the current record without deleting or relabelling saved examples',()=>{
  const h=setup({initialRecord:record('p7.elliptic_analytic','37a1','live-37',false)});
  const before=h.calls();
  h.emit({revision:1,record:null});
  assert.ok(h.calls()>before);
  assert.equal(currents(h).length,0);
  assert.equal(h.latest().records.length,4);
  assert.ok(h.latest().records.every(r=>r.visualSource.mode==='ARCHIVED_EXAMPLE'&&r.visualSource.current===false));
  assert.equal(h.archiveText(),h.initialArchiveText);
  assert.equal(h.audit().proofStatusPromoted,false);
});

test('failed or in-progress execution cannot replace a completed archive example',()=>{
  for(const status of ['FAILED','RUNNING','TIMEOUT','CANCELLED']){
    const live=record('p7.elliptic_analytic','37a1','live-37',false);live.execution.status=status;
    const h=setup({initialRecord:live});
    assert.equal(currents(h).length,0,status);
    assert.equal(h.latest().records.some(r=>r.recordSHA256==='record-central-37'),true,status);
  }
});

test('tab navigation is display-only; request loading happens only after an explicit button click',()=>{
  const h=setup();
  for(let n=1;n<=8;n++)h.window.MathScopeP7VisualController.selectCriterion('P7-0'+n);
  assert.equal(h.loads.length,0);
  h.window.MathScopeP7VisualController.selectCriterion('P7-06');
  const before=plain(h.latest().records);
  h.get('p7v-run-source').value='0';
  h.get('p7v-load-request').click();
  assert.equal(h.loads.length,1);
  assert.deepEqual(h.loads[0],{kind:'p7.elliptic_analytic',input:{model:'11a1'}});
  assert.deepEqual(plain(h.latest().records),before);
  assert.equal(h.archiveText(),h.initialArchiveText);
  const criterion=h.audit().criterion;
  h.window.MathScopeP7VisualController.selectCriterion('P7-99');
  assert.equal(h.audit().criterion,criterion);
});

test('standalone zero results and explicit-formula zero archives both remain selectable in P7-03',()=>{
  const h=setup({initialRecord:record('p7.zeta_zeros',null,'fresh-zero',false),query:'P7-03'});
  assert.equal(h.audit().currentResults,1);
  assert.equal(h.audit().archivedExamples,1);
  assert.equal(h.get('p7v-run-source').children.length,2);
  assert.ok(h.latest().records.some(r=>r.request.kind==='p7.explicit_formula'));
});

test('original-record links use the archived GitHub reference and reject unrelated URLs',()=>{
  const h=setup();
  assert.equal(h.get('p7v-original-record').hidden,false);
  assert.match(h.get('p7v-original-record').href,/central-11\.json\.gz$/);
  const unsafe=seedRecords();unsafe[0].visualSource.archiveURL='javascript:alert(1)';
  const bad=setup({records:unsafe});
  assert.equal(bad.get('p7v-original-record').hidden,true);
  assert.equal(bad.get('p7v-original-record').href,undefined);
});
