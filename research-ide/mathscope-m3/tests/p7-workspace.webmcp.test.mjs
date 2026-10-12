import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source=await fs.readFile(new URL('../web/workspace.js',import.meta.url),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));

// The real workspace, original run()/render() and registered callbacks execute
// unchanged. Only DOM, WebMCP registration and deferred HTTP are local fixtures;
// these checks make no claim of native-browser or mathematical execution.
async function harness({webmcp=true,examples=null}={}){
  class Target{
    handlers=new Map();
    addEventListener(name,fn){const list=this.handlers.get(name)||[];list.push(fn);this.handlers.set(name,list);}
    emit(name,props={}){return (this.handlers.get(name)||[]).map(fn=>fn({type:name,...props}));}
  }
  class Element extends Target{
    constructor(tag='div'){super();this.tag=tag;this.dataset={};this.value='';this.textContent='';this.children=[];this.hidden=false;this.disabled=false;this.attributes={};this.classList={toggle(){}};}
    append(...children){for(const child of children){this.children.push(child);if(this.tag==='select'&&!this.value)this.value=child.value;}}
    replaceChildren(...children){this.children=[];if(this.tag==='select')this.value='';this.append(...children);}
    setAttribute(name,value){this.attributes[name]=value;}
    focus(){this.focused=true;}
    click(){this.emit('click');}
  }
  const elements=new Map(),root=new Element(),nav=new Element('button'),document=new Target(),window=new Target(),tools=[],requests=[],timers=new Map();let timerId=0,failBusyDispatch=false;
  const element=id=>{if(!elements.has(id))elements.set(id,new Element(id==='m3-example'?'select':'div'));return elements.get(id);};
  root.querySelector=selector=>{assert.equal(selector,'.m3-boundary strong');return element('m3-boundary-summary');};
  document.getElementById=id=>id==='mathscopeResearchM3'?root:element(id);document.createElement=tag=>new Element(tag);document.createTextNode=text=>Object.assign(new Element('text'),{textContent:text});document.querySelector=()=>nav;document.querySelectorAll=selector=>selector==='.view[data-view]'?[root]:[nav];
  if(webmcp)document.modelContext={async registerTool(definition,{signal}){tools.push({definition,signal});}};
  window.dispatchEvent=event=>{if(failBusyDispatch&&event.detail?.busy){failBusyDispatch=false;throw Error('fixture UI dispatch failed');}window.emit(event.type,event);};
  const capabilities={kinds:['p7.zeta_em','p7.elliptic_complex'],examples:examples??[{id:'slow-example',title:'Long compute fixture',request:{kind:'p7.zeta_em',input:{real:'1/2',imag:'14'}}},{id:'other-example',request:{kind:'p7.elliptic_complex',input:{curve:'37a1'}}}],sourceBinding:{schema:'SYNTHETIC_WORKSPACE_TEST_ONLY',manifestSHA256:'fixture-source'},wholeP7Complete:false,progress:{criteria:[]}};
  const response=(value,ok=true)=>({ok,json:async()=>value});
  const fetch=(url,options)=>{
    if(url.endsWith('/capabilities'))return Promise.resolve(response(plain(capabilities)));
    let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});const request={url,options,resolve:value=>resolve(response(value)),reject,resolveHTTPFailure:message=>resolve(response({detail:message},false))};requests.push(request);
    options.signal.addEventListener('abort',()=>reject(Object.assign(Error('fixture aborted'),{name:'AbortError'})));return promise;
  };
  const location={hash:'#research-m3'},historyCalls=[],context=vm.createContext({window,document,fetch,location,history:{replaceState(...args){historyCalls.push(args);location.hash=args[2];}},TextEncoder,AbortController,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},URL:{revokeObjectURL(){},createObjectURL(){return 'blob:synthetic-test-only';}},Blob});
  vm.runInContext(source,context,{timeout:2000});const settle=()=>new Promise(setImmediate);await settle();
  const tool=name=>{const item=tools.findLast(row=>row.definition.name==='mathscope.research_m3.'+name&&!row.signal.aborted);assert.ok(item,'registered tool '+name);return item.definition;};
  const call=async(name,input={},options={})=>plain(await tool(name).execute(input,options));
  const complete=(index=0,overrides={})=>{const request=requests[index],body=JSON.parse(request.options.body),value={schema:'MathScope.M3.P7Execution/1',request:body,execution:{status:'COMPLETED',elapsedSeconds:14.9},sourceBinding:plain(capabilities.sourceBinding),serializedAuthority:'UNTRUSTED_REQUIRES_REEXECUTION',formalLeanProofIssued:false,wholeP7Complete:false,wholeM3Complete:false,inputSHA256:'synthetic-input-'+index,recordSHA256:'synthetic-record-'+index,mathematicalSHA256:'synthetic-result-'+index,result:{status:'SYNTHETIC_TEST_ONLY'},...overrides};request.resolve(value);return value;};
  return {root,window,document,context,capabilities,tools,requests,timers,historyCalls,settle,tool,call,complete,element:id=>element('m3-'+id),snapshot:()=>plain(window.MathScopeP7Workspace.snapshot()),failNextBusyDispatch(){failBusyDispatch=true;},activeTools:()=>tools.filter(row=>!row.signal.aborted)};
}

test('five registrations preserve the four existing contracts and need only registration support',async()=>{
  const h=await harness();assert.equal(h.activeTools().length,5);assert.equal(h.document.modelContext.getTools,undefined);
  const empty={type:'object',properties:{},additionalProperties:false},example={type:'object',properties:{exampleId:{type:'string',minLength:1,maxLength:160}},required:['exampleId'],additionalProperties:false};
  for(const name of ['status','replay_current','export_record'])assert.deepEqual(plain(h.tool(name).inputSchema),empty);
  assert.deepEqual(plain(h.tool('run_example').inputSchema),example);assert.deepEqual(plain(h.tool('start_example').inputSchema),example);assert.equal(h.tool('start_example').annotations.readOnlyHint,false);assert.equal(h.tool('start_example').annotations.untrustedContentHint,true);
  const status=await h.call('status');assert.equal(status.busy,false);assert.equal(status.current,null);assert.equal(status.activeStart,null);assert.equal(status.wholeP7Complete,false);assert.equal(status.wholeM3Complete,false);assert.deepEqual((await h.call('export_record')).status,'NO_RECORD');
  const legacy=h.call('run_example',{exampleId:'slow-example'});await h.settle();assert.equal(h.requests.length,1);assert.equal(h.snapshot().busy,true);h.complete();const done=await legacy;assert.equal(done.status,'COMPLETED');assert.equal((await h.call('status')).activeStart,null);
  const unsupported=await harness({webmcp:false});assert.equal(unsupported.tools.length,0);assert.ok(unsupported.element('webmcp').textContent.includes('미지원'));const [uiRun]=unsupported.element('run').emit('click');assert.equal(unsupported.requests.length,1);unsupported.complete();assert.equal((await uiRun).status,'COMPLETED');assert.equal(unsupported.snapshot().record.execution.status,'COMPLETED');
});

test('start returns while HTTP is still pending, blocks overlap and only later reports actual completion',{timeout:3000},async()=>{
  const h=await harness(),started=await h.call('start_example',{exampleId:'slow-example'});assert.equal(started.status,'RUNNING');assert.equal(started.executionTicket,'p7-start-1');assert.equal(started.ticketScope,'CURRENT_DOCUMENT_NOT_SERVER_JOB');assert.equal(started.pollTool,'mathscope.research_m3.status');assert.equal(started.wholeP7Complete,false);assert.equal(h.requests.length,1);
  const call=h.requests[0];assert.equal(call.url,'https://mathscope-compute.onrender.com/v1/p7/run');assert.equal(call.options.credentials,'omit');assert.deepEqual(JSON.parse(call.options.body),h.capabilities.examples[0].request);
  const pending=await h.call('status');assert.equal(pending.busy,true);assert.equal(pending.current,null);assert.equal(pending.activeStart.status,'RUNNING');assert.equal(pending.activeStart.outcome,null);assert.equal(pending.activeStart.finishedAt,null);
  assert.equal((await h.call('start_example',{exampleId:'other-example'})).status,'BUSY');assert.equal((await h.call('run_example',{exampleId:'other-example'})).status,'BUSY');assert.equal(h.context.window.MathScopeP7Workspace.loadRequest(h.capabilities.examples[1].request).status,'BUSY');assert.equal(h.requests.length,1);
  const original=h.complete();await h.settle();const settled=await h.call('status');assert.equal(settled.busy,false);assert.equal(settled.activeStart.executionTicket,started.executionTicket);assert.equal(settled.activeStart.status,'COMPLETED');assert.equal(settled.activeStart.outcome.recordSHA256,original.recordSHA256);assert.equal(settled.activeStart.currentRecordMatchesTicket,true);assert.ok(settled.activeStart.finishedAt);assert.equal(settled.current.recordSHA256,original.recordSHA256);assert.ok(h.element('result-status').textContent.startsWith('COMPLETED'));assert.equal(JSON.parse((await h.call('export_record')).json).recordSHA256,original.recordSHA256);
});

test('wrong input, pre-cancelled calls and unsaved edits have no run or replacement effects',async()=>{
  const h=await harness(),initial=h.element('input').value;
  for(const input of [null,[],{},'slow-example',{exampleId:''},{exampleId:123},{exampleId:'x'.repeat(161)},{exampleId:'slow-example',confirmed:true}])assert.equal((await h.call('start_example',input)).status,'INVALID_INPUT');
  assert.equal((await h.call('start_example',{exampleId:'unknown'})).status,'UNKNOWN_EXAMPLE');const controller=new AbortController();controller.abort();assert.equal((await h.call('start_example',{exampleId:'slow-example'},{signal:controller.signal})).status,'NOT_STARTED');assert.equal(h.requests.length,0);assert.equal(h.element('input').value,initial);assert.equal(h.historyCalls.length,0);
  const edited='{"kind":"p7.zeta_em","input":{"real":"17/9","note":"my unsaved work"}}';h.element('input').value=edited;h.element('input').emit('input');assert.equal((await h.call('start_example',{exampleId:'slow-example'})).status,'UNSAVED_INPUT_PRESERVED');assert.equal((await h.call('run_example',{exampleId:'slow-example'})).status,'UNSAVED_INPUT_PRESERVED');assert.equal(h.element('input').value,edited);assert.equal(h.requests.length,0);assert.equal((await h.call('status')).activeStart,null);
});

test('HTTP failure and an unexpected run rejection settle tickets and update the visible failure',async()=>{
  const h=await harness();await h.call('start_example',{exampleId:'slow-example'});h.requests[0].resolveHTTPFailure('fixture compute unavailable');await h.settle();const failed=await h.call('status');assert.equal(failed.busy,false);assert.equal(failed.current,null);assert.equal(failed.activeStart.status,'FAILED');assert.equal(failed.activeStart.outcome.ok,false);assert.equal(failed.activeStart.currentRecordMatchesTicket,false);assert.ok(h.element('status').textContent.includes('fixture compute unavailable'));assert.equal(h.element('status').dataset.error,'true');
  const unexpected=await harness();unexpected.failNextBusyDispatch();await unexpected.call('start_example',{exampleId:'slow-example'});await unexpected.settle();const observed=await unexpected.call('status');assert.equal(observed.busy,false);assert.equal(observed.current,null);assert.equal(observed.activeStart.status,'FAILED');assert.equal(unexpected.requests.length,0);assert.ok(unexpected.element('status').textContent.includes('fixture UI dispatch failed'));assert.equal(unexpected.element('status').dataset.error,'true');
});

test('input revisions, source mismatches and server unresolved states are never relabelled complete',async()=>{
  const stale=await harness();await stale.call('start_example',{exampleId:'slow-example'});stale.element('input').value='{"kind":"p7.zeta_em","input":{"real":"9"}}';stale.element('input').emit('input');stale.complete();await stale.settle();const a=await stale.call('status');assert.equal(a.activeStart.status,'STALE');assert.equal(a.activeStart.outcome.ok,false);assert.equal(a.current,null);assert.equal(a.editorHasUnsavedEdits,true);
  const changed=await harness();await changed.call('start_example',{exampleId:'slow-example'});changed.complete(0,{sourceBinding:{schema:'DIFFERENT_SOURCE'}});await changed.settle();const b=await changed.call('status');assert.equal(b.activeStart.status,'FAILED');assert.equal(b.current,null);assert.ok(changed.element('status').textContent.includes('소스가 실행 중 바뀌었습니다'));
  const unresolved=await harness();await unresolved.call('start_example',{exampleId:'slow-example'});unresolved.complete(0,{execution:{status:'UNRESOLVED',elapsedSeconds:90},result:null});await unresolved.settle();const c=await unresolved.call('status');assert.equal(c.activeStart.status,'UNRESOLVED');assert.equal(c.current.execution.status,'UNRESOLVED');assert.equal(c.wholeP7Complete,false);assert.equal(c.wholeM3Complete,false);
  const invalid=await harness({examples:[{id:'bad-example',request:{kind:'unsupported',input:{}}}]});assert.equal((await invalid.call('start_example',{exampleId:'bad-example'})).status,'INVALID_REQUEST');assert.equal(invalid.requests.length,0);assert.equal((await invalid.call('status')).activeStart,null);
});

test('a completed ticket remains distinct from later input and later execution tickets',async()=>{
  const h=await harness(),first=await h.call('start_example',{exampleId:'slow-example'});h.complete();await h.settle();h.element('input').emit('input');const cleared=await h.call('status');assert.equal(cleared.activeStart.status,'COMPLETED');assert.equal(cleared.activeStart.currentRecordMatchesTicket,false);assert.equal(cleared.current,null);
  h.element('load').emit('click');const next=await h.call('start_example',{exampleId:'other-example'});assert.notEqual(next.executionTicket,first.executionTicket);assert.equal(next.executionTicket,'p7-start-2');assert.equal(h.requests.length,2);const current=await h.call('status');assert.equal(current.activeStart.exampleId,'other-example');assert.equal(current.activeStart.outcome,null);h.complete(1);await h.settle();assert.equal((await h.call('status')).activeStart.currentRecordMatchesTicket,true);
});

test('registration cleanup does not invent cancellation and an actual HTTP timeout stays uncertain',async()=>{
  const h=await harness(),started=await h.call('start_example',{exampleId:'slow-example'});h.window.emit('pagehide');assert.equal(h.activeTools().length,0);assert.equal(h.requests[0].options.signal.aborted,false);h.window.emit('pageshow',{persisted:true});await h.settle();assert.equal(h.activeTools().length,5);assert.equal((await h.call('status')).activeStart.executionTicket,started.executionTicket);assert.equal((await h.call('status')).activeStart.status,'RUNNING');
  assert.equal(h.timers.size,1);const timer=[...h.timers.values()][0];assert.equal(timer.ms,110000);timer.fn();await h.settle();const ended=await h.call('status');assert.equal(ended.activeStart.status,'FAILED');assert.equal(ended.busy,false);assert.equal(ended.current,null);assert.ok(ended.activeStart.outcome.message.includes('서버 실행이 종료되었다고 단정할 수 없습니다'));assert.equal(h.requests.length,1);assert.equal(h.timers.size,0);
});
