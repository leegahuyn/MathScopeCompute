/** Read-only V8 diagnostics for a worker already started with --inspect.
 * Run this client in the SAME exec/network namespace as its worker.
 * No MathScope source module or mathematical graph is imported or changed.
 * Usage: node this-file ws://127.0.0.1:PORT/ID output-prefix expected-file seconds
 */
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [endpoint,prefix,expectedFile='',secondsText='5']=process.argv.slice(2);
const seconds=Number(secondsText);
if(!/^ws:\/\/127\.0\.0\.1:\d+\/[\w-]+$/.test(endpoint??'')||!prefix||
  !Number.isFinite(seconds)||seconds<0.1||seconds>10)
  throw new Error('Use a loopback inspector endpoint, output prefix, expected worker file, and 0.1..10 seconds.');

const socket=new WebSocket(endpoint),requests=new Map(),events=[],scripts=new Map();
let nextID=1,paused=false,lastPause=null,pauseWaiter=null;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function request(method,params={}){
  const id=nextID++;
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{requests.delete(id);reject(new Error('Inspector timeout: '+method));},10000);
    requests.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));
  });
}
socket.addEventListener('message',event=>{
  let packet;try{packet=JSON.parse(String(event.data));}catch{return;}
  if(packet.id!==undefined){
    const pending=requests.get(packet.id);if(!pending)return;
    requests.delete(packet.id);clearTimeout(pending.timeout);
    if(packet.error)pending.reject(Object.assign(new Error(packet.error.message),{inspectorError:packet.error}));
    else pending.resolve(packet.result??{});
    return;
  }
  if(packet.method==='Debugger.scriptParsed')scripts.set(packet.params.scriptId,packet.params.url);
  if(packet.method==='Debugger.paused'){
    paused=true;lastPause=packet.params;pauseWaiter?.(packet.params);pauseWaiter=null;
  }
  if(packet.method==='Debugger.resumed')paused=false;
  if(['Debugger.paused','Debugger.resumed'].includes(packet.method))events.push({at:new Date().toISOString(),...packet});
});
await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Inspector WebSocket connection timed out.')),10000);
  socket.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
  socket.addEventListener('error',event=>{clearTimeout(timer);reject(new Error('Inspector WebSocket error: '+event.message));},{once:true});
});

const report={schema:'MathScope.ReadOnlyNodeInspectorDiagnostic/1',startedAt:new Date().toISOString(),
  requestedSamplingSeconds:seconds,expectedWorkerFile:expectedFile?resolve(expectedFile):null,
  mathematicalModulesImported:false,mathematicalObjectsEvaluated:false,sourceOrProofChanged:false,
  processMetadataRead:true,debuggerPauseResumed:false};
const evaluateMetadata=async()=>{
  const result=await request('Runtime.evaluate',{
    expression:'({pid:process.pid,hostPid:process.getBuiltinModule("fs").readlinkSync("/proc/self"),argv:process.argv,execArgv:process.execArgv,testContext:process.env.NODE_TEST_CONTEXT??null,memory:process.memoryUsage(),heap:process.getBuiltinModule("v8").getHeapStatistics(),uptime:process.uptime()})',
    returnByValue:true,generatePreview:false,
  });
  if(result.exceptionDetails)throw new Error('Worker metadata evaluation failed: '+JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
try{
  report.before=await evaluateMetadata();
  const actualScripts=report.before.argv.slice(1).map(value=>resolve(value));
  report.isExpectedTestWorker=Boolean(report.before.testContext)&&
    (!expectedFile||actualScripts.includes(resolve(expectedFile)))&&!report.before.execArgv.includes('--test');
  if(!report.isExpectedTestWorker){
    report.status='SKIPPED_NON_WORKER';
  }else{
    await request('Profiler.enable');
    await request('Profiler.setSamplingInterval',{interval:1000});
    await request('Profiler.start');
    await sleep(seconds*1000);
    const {profile}=await request('Profiler.stop');
    await writeFile(prefix+'.cpuprofile',JSON.stringify(profile)+'\n');
    report.profilePath=prefix+'.cpuprofile';
    report.profile={nodeCount:profile.nodes.length,sampleCount:profile.samples?.length??0,
      startTime:profile.startTime,endTime:profile.endTime};
    await request('Debugger.enable');
    const pausedEvent=new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{pauseWaiter=null;reject(new Error('Debugger pause event timed out.'));},10000);
      pauseWaiter=value=>{clearTimeout(timer);resolve(value);};
    });
    await request('Debugger.pause');
    const pause=await pausedEvent;
    report.pausedStack={reason:pause.reason,callFrames:pause.callFrames.map(frame=>({
      functionName:frame.functionName,url:frame.url||scripts.get(frame.location.scriptId)||'',
      location:frame.location,functionLocation:frame.functionLocation,
    }))};
    await request('Debugger.resume');report.debuggerPauseResumed=true;
    report.after=await evaluateMetadata();
    report.status='CAPTURED';
  }
}catch(error){
  report.status='DIAGNOSTIC_FAILED';report.error={name:error.name,message:error.message,stack:error.stack};
  process.exitCode=1;
}finally{
  if(paused){
    try{await request('Debugger.resume');report.debuggerPauseResumed=true;}
    catch(error){report.resumeError=error.message;process.exitCode=1;}
  }
  report.finishedAt=new Date().toISOString();report.pauseEvents=events;
  if(lastPause)report.pausedAtLeastOnce=true;
  await writeFile(prefix+'.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,path:prefix+'.json',hostPid:report.before?.hostPid,
    localPid:report.before?.pid,testContext:report.before?.testContext,debuggerPauseResumed:report.debuggerPauseResumed}));
  socket.close();
}
