#!/usr/bin/env node
/** Fresh Node and shipped-Worker execution against saved public N8 observations.
 * Every source byte is checked before and after execution. Historical records
 * are internally checked, but source changes never become imported authority.
 */
import fs from 'node:fs/promises';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {Worker as NodeWorker} from 'node:worker_threads';
import {createHash,webcrypto} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {unpackN8Observation,n8MathematicalPayload,compareN8Mathematics,n8RunCategories} from './n8-reproduction-contract.mjs';

const defaults=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..');
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i+=2){
  if(!['--source-root','--observations-root','--output'].includes(args[i])||!args[i+1])throw Error('Use --source-root, --observations-root and --output with explicit paths.');
  options[args[i]]=args[i+1];
}
const root=path.resolve(options['--source-root']??defaults),m3=path.join(root,'research-ide/mathscope-m3'),
  observations=path.resolve(options['--observations-root']??path.join(m3,'evidence/all64-20261012/public-v99')),
  output=options['--output']&&path.resolve(options['--output']);
if(!output)throw Error('Choose a new output directory with --output; an observed attempt is never overwritten.');
if(existsSync(output))throw Error('The output directory already exists. Choose a new immutable attempt.');
await fs.mkdir(path.dirname(output),{recursive:true});await fs.mkdir(output);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),
  readJSON=async file=>JSON.parse(await fs.readFile(file,'utf8')),
  write=async(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n';await fs.writeFile(path.join(output,name),bytes);return {path:name,bytes:Buffer.byteLength(bytes),sha256:sha(bytes)};};
const startedAt=new Date().toISOString();let client;
const report={schema:'MathScope.N8.ObservedSelectedRunReproduction/1',startedAt,
  runStatus:'RUNNING',originalN808Complete:false,wholeM3Complete:false,
  importedAuthorityAdopted:false,artifactDirectory:output,checks:[],runs:[]};
try{
  const buildFile=path.join(m3,'web/extended-build-data.json'),bundleFile=path.join(m3,'web/extended-engine.bundle.js'),
    buildBytes=await fs.readFile(buildFile),bundleBytes=await fs.readFile(bundleFile),build=JSON.parse(buildBytes),
    worker=await import(pathToFileURL(path.join(m3,'web/extended-worker.mjs'))),
    {canonicalExtended,digestExtended,executeExtended,inspectExtendedRecord}=worker;
  if(await digestExtended(build.sourceBinding.files)!==build.sourceBinding.manifestSHA256)throw Error('The current build source manifest has changed.');
  const checkedSources=async()=>{
    const files=[];
    for(const row of build.sourceBinding.files){
      const file=path.resolve(root,'research-ide',row.path);
      if(!file.startsWith(path.join(root,'research-ide')+path.sep))throw Error('A build source path escaped the project.');
      const bytes=await fs.readFile(file),actual={path:row.path,bytes:bytes.length,sha256:sha(bytes)};
      if(actual.bytes!==row.bytes||actual.sha256!==row.sha256)throw Error('A source file differs from the shipped Worker: '+row.path);
      files.push(actual);
    }return files;
  };
  const sourcesBefore=await checkedSources(),verifierPaths=[fileURLToPath(import.meta.url),
    fileURLToPath(new URL('./n8-reproduction-contract.mjs',import.meta.url))],
    verifierSnapshot=async()=>Promise.all(verifierPaths.map(async file=>{const bytes=await fs.readFile(file);return {path:path.basename(file),bytes:bytes.length,sha256:sha(bytes)};})),
    verifiersBefore=await verifierSnapshot();
  const sourceSnapshot={schema:'MathScope.N8.ReproductionSourceSnapshot/1',files:sourcesBefore,
    sourceManifestSHA256:build.sourceBinding.manifestSHA256,build:{bytes:buildBytes.length,sha256:sha(buildBytes)},
    shippedWorkerBundle:{bytes:bundleBytes.length,sha256:sha(bundleBytes)},verifierSources:verifiersBefore};
  await write('source-before.json',sourceSnapshot);
  const git=(...command)=>{try{return execFileSync('git',command,{cwd:root,encoding:'utf8'}).trim();}catch{return null;}};
  let event={};if(process.env.GITHUB_EVENT_PATH)event=await readJSON(process.env.GITHUB_EVENT_PATH);
  report.environment={runtime:'NODE_FRESH_EXECUTION_AND_SHIPPED_STATIC_WORKER',node:process.version,
    v8:process.versions.v8,platform:process.platform,architecture:process.arch,osRelease:os.release(),
    pythonReference:'Executed separately by verify-selected-reference.py',
    hostedCI:process.env.GITHUB_ACTIONS==='true',githubRunId:process.env.GITHUB_RUN_ID??null,
    githubRunAttempt:process.env.GITHUB_RUN_ATTEMPT??null,githubWorkflow:process.env.GITHUB_WORKFLOW??null,
    runnerCommit:git('rev-parse','HEAD'),runnerTree:git('rev-parse','HEAD^{tree}'),
    pullRequestHead:event.pull_request?.head?.sha??null,
    mathematicalEnvironmentDeclaration:build.environment};
  report.release={edition:'v0.3.1',engineVersion:build.version,sourceManifestSHA256:build.sourceBinding.manifestSHA256,
    buildMetadataSHA256:sha(buildBytes),workerBundleSHA256:sha(bundleBytes),sourceFileCount:sourcesBefore.length,
    buildLogs:{reproduction:'receipt.json',sourceChecks:['source-before.json','source-after.json'],
      hostedBuildCheck:'CI artifact bundle-check.log; independently observed through GitHub before acceptance'}};
  function builtClient(){
    const blobs=new Map(),running=new Set();let sequence=0;
    class Blob{constructor(parts){this.source=parts.join('');}}
    class Worker{
      constructor(url){
        if(!blobs.has(url))throw Error('A shipped Worker source is missing.');
        const bridge="const {parentPort}=require('node:worker_threads');globalThis.crypto=require('node:crypto').webcrypto;globalThis.self=globalThis;self.postMessage=x=>parentPort.postMessage(x);parentPort.on('message',x=>self.onmessage({data:x}));\n";
        this.worker=new NodeWorker(bridge+blobs.get(url),{eval:true,resourceLimits:{maxOldGenerationSizeMb:256}});
        running.add(this.worker);this.worker.on('message',data=>this.onmessage?.({data}));
        this.worker.on('error',error=>this.onerror?.({message:error.message}));this.worker.on('exit',()=>running.delete(this.worker));
      }
      postMessage(value){this.worker.postMessage(value);}
      terminate(){return this.worker.terminate();}
    }
    const context={window:{},Blob,Worker,TextDecoder,atob,
      URL:{createObjectURL(blob){const id='observed-n8-worker:'+(++sequence);blobs.set(id,blob.source);return id;},revokeObjectURL(id){blobs.delete(id);}},
      crypto:webcrypto,setTimeout,clearTimeout};
    vm.runInNewContext(bundleBytes.toString('utf8'),context,{filename:'shipped-extended-engine.bundle.js'});
    return {engine:context.window.MathScopeM3ExtendedEngine,close:async()=>{await Promise.all([...running].map(w=>w.terminate()));}};
  }
  client=builtClient();
  const fixtures=[
    {id:'N8-flow',file:'flow-export.json',role:'SELECTED_RUN',absoluteTolerance:2e-12,relativeTolerance:2e-11},
    {id:'N8-source-core-refinement',file:'core-refinement-export.json',role:'SOURCE_FIXTURE',absoluteTolerance:0,relativeTolerance:0},
    {id:'N8-source-near-terminal',file:'near-terminal-run.json',role:'SOURCE_FIXTURE',absoluteTolerance:0,relativeTolerance:0}
  ];
  for(const fixture of fixtures){
    const raw=await fs.readFile(path.join(observations,fixture.file));
    if(raw.length>24*1024*1024)throw Error('An observed record exceeded the explicit 24 MiB budget.');
    const observed=unpackN8Observation(JSON.parse(raw));
    if(observed.resultDigest!==await digestExtended(observed.result))throw Error('The public observation result digest does not match '+fixture.id);
    if(canonicalExtended(observed.request.input)!==canonicalExtended(observed.result.input))throw Error('The public input/result binding differs for '+fixture.id);
    let inspection=null;
    if(observed.record){
      inspection=await inspectExtendedRecord(observed.record,build);
      if(!inspection.valid||!inspection.presentationVerified)throw Error('The exported camera/source presentation is invalid for '+fixture.id);
    }
    const current=await executeExtended(observed.request,build),shipped=await client.engine.run(observed.request);
    if(!shipped.ok)throw Error('The actual shipped Worker failed '+fixture.id+': '+JSON.stringify(shipped.error));
    const sameCurrentWorker=await digestExtended(current.result)===shipped.record.resultDigest;
    if(!sameCurrentWorker)throw Error('Direct Node and shipped Worker differ for '+fixture.id);
    const expectedPayload=n8MathematicalPayload(observed.result),actualPayload=n8MathematicalPayload(current.result),
      comparison=compareN8Mathematics(actualPayload,expectedPayload,fixture),
      replay=await client.engine.replay(shipped.record);
    if(!replay.ok||replay.replay?.status!=='MATCH')throw Error('Fresh shipped Worker replay failed for '+fixture.id);
    const categories=n8RunCategories(observed),freshArtifact=await write(fixture.id+'.json',current),
      row={id:fixture.id,role:fixture.role,observed:{file:fixture.file,bytes:raw.length,sha256:sha(raw),
        format:observed.format,sourceManifest:observed.sourceManifest,resultDigest:observed.resultDigest},
      current:{sourceManifest:build.sourceBinding.manifestSHA256,resultDigest:current.resultDigest,artifact:freshArtifact},
      sameSource:observed.sourceManifest===build.sourceBinding.manifestSHA256,
      inspection,executionMode:'FRESH_VALIDATED_INPUT_EXECUTION; historical authority is never adopted',
      categories,comparison,directNodeAndShippedWorkerExactMatch:sameCurrentWorker,shippedWorkerReplay:replay.replay,
      mathematicalPayloadSHA256:await digestExtended(actualPayload),pass:comparison.pass&&sameCurrentWorker};
    report.runs.push(row);console.log(JSON.stringify({id:row.id,pass:row.pass,sameSource:row.sameSource,
      comparedNumbers:comparison.numericValues,maxDifference:comparison.maxAbsoluteDifference,replay:replay.replay.status}));
  }
  const sourcesAfter=await checkedSources();
  const sameSources=canonicalExtended(sourcesBefore)===canonicalExtended(sourcesAfter)&&
    sha(await fs.readFile(buildFile))===sha(buildBytes)&&sha(await fs.readFile(bundleFile))===sha(bundleBytes)&&
    canonicalExtended(verifiersBefore)===canonicalExtended(await verifierSnapshot());
  await write('source-after.json',{...sourceSnapshot,files:sourcesAfter,unchanged:sameSources});
  report.checks=[{id:'source-files-and-shipped-build-unchanged',pass:sameSources},
    {id:'one-selected-run-and-two-original-source-fixtures-reproduced',pass:report.runs.length===3&&report.runs.every(row=>row.pass)},
    {id:'actual-shipped-worker-replayed-every-run',pass:report.runs.every(row=>row.shippedWorkerReplay.status==='MATCH')},
    {id:'every-named-metadata-category-is-present-for-selected-run',pass:report.runs.filter(row=>row.role==='SELECTED_RUN').every(row=>
      ['edition','source','constants','basis','domain','timeSchedule','quadrature','truncations','precision','tails','residual','energy','camera'].every(key=>key in row.categories))},
    {id:'source-fixture-energy-is-never-filled-by-periodic-model',pass:report.runs.filter(row=>row.role==='SOURCE_FIXTURE').every(row=>row.categories.energy.finitePeriodicEnergySubstituted===false)}];
  report.pass=report.checks.every(row=>row.pass);report.runStatus=report.pass?'PASS':'FAIL';
}catch(error){report.pass=false;report.runStatus='FAIL';report.error={name:error.name,message:error.message,stack:error.stack};}
finally{await client?.close();report.finishedAt=new Date().toISOString();await write('receipt.json',report);}
console.log(JSON.stringify({status:report.runStatus,receipt:path.join(output,'receipt.json'),runs:report.runs.length,
  sourceManifest:report.release?.sourceManifestSHA256,hostedCI:report.environment?.hostedCI??false}));
if(!report.pass)process.exitCode=1;
