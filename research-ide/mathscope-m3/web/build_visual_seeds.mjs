// Produce display extracts from actual archived executions; never manufacture runs.
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url)),m3=path.dirname(root);
const context=vm.createContext({});
vm.runInContext(readFileSync(path.join(root,'p7-visual-models.js'),'utf8'),context);
const models=context.MathScopeP7VisualModels;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':value!==null&&typeof value==='object'?'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}':JSON.stringify(value);
const args=process.argv.slice(2),options={check:false,source:path.join(root,'p7-visual-seed-source.json'),output:path.join(root,'p7-visual-seeds.json')};
for(let i=0;i<args.length;i++){
  if(args[i]==='--check')options.check=true;
  else if(['--source','--output'].includes(args[i])&&args[i+1])options[args[i].slice(2)]=path.resolve(args[++i]);
  else throw Error('Use --check, --source <pinned source configuration>, or --output <file>.');
}
function withinM3(relative){
  if(typeof relative!=='string'||path.isAbsolute(relative)||relative.includes('\0'))throw Error('Expected a relative M3 artifact path.');
  const result=path.resolve(m3,relative);
  if(!result.startsWith(m3+path.sep))throw Error('Artifact path leaves the M3 source directory.');
  return result;
}
function pinnedBytes(commit,relative){
  // Archive links must point to bytes that actually exist at the immutable
  // commit. A working copy hash or a future branch URL is not that evidence.
  const local=readFileSync(withinM3(relative));
  const pinned=execFileSync('git',['show',commit+':research-ide/mathscope-m3/'+relative],{cwd:m3,maxBuffer:32*1024*1024});
  if(!local.equals(pinned))throw Error('Local and immutable archive bytes differ: '+relative);
  return local;
}
function freshArchive(config){
  if(config.schema!=='MathScope.M3.P7VisualSeedSource/1'||!/^[0-9a-f]{40}$/.test(config.archiveCommit))throw Error('A pinned P7 visual source configuration is required.');
  const manifestBytes=pinnedBytes(config.archiveCommit,config.manifest);
  if(sha(manifestBytes)!==config.manifestSHA256)throw Error('The frozen CLI manifest digest differs.');
  const manifest=JSON.parse(manifestBytes),epoch=sha(canonical(manifest.sourceBinding));
  if(manifest.schema!=='MathScope.M3.P7FrozenExecutionRelease/1'||manifest.status!=='PASS'||manifest.sourceUnchanged!==true||manifest.allKindsCovered!==true||epoch!==config.sourceEpochSHA256||epoch!==manifest.sourceEpochSHA256)throw Error('The source epoch or observed CLI release is incomplete.');
  if(!Array.isArray(manifest.runs)||manifest.runs.length<1||manifest.runs.length>32)throw Error('The displayed archive must contain 1..32 actual executions.');
  const sourceFiles=[],kinds=new Set(),ids=new Set(),records=manifest.runs.map(row=>{
    if(ids.has(row.id)||row.passed!==true||row.replayStatus!=='MATCH'||row.freshReplayExecuted!==true||row.processes?.length!==2||row.processes.some(p=>p.observedExitCode!==0))throw Error('An archived run lacks a successful fresh process replay: '+row.id);
    ids.add(row.id);kinds.add(row.kind);
    const relative=path.posix.join(path.posix.dirname(config.manifest),row.artifact.path);
    const bytes=pinnedBytes(config.archiveCommit,relative),raw=gunzipSync(bytes),full=JSON.parse(raw);
    if(sha(bytes)!==row.artifact.sha256||bytes.length!==row.artifact.bytes||full.recordSHA256!==row.recordSHA256||full.mathematicalSHA256!==row.mathematicalSHA256||full.inputSHA256!==row.inputSHA256||full.request?.kind!==row.kind||full.execution?.status!=='COMPLETED'||canonical(full.sourceBinding)!==canonical(manifest.sourceBinding))throw Error('The archived original differs from the observed CLI manifest: '+row.id);
    const replayRelative=path.posix.join(path.posix.dirname(config.manifest),row.replay.path);
    const replayBytes=pinnedBytes(config.archiveCommit,replayRelative),replay=JSON.parse(gunzipSync(replayBytes));
    if(sha(replayBytes)!==row.replay.sha256||replay.status!=='MATCH'||replay.previousRecordSHA256!==row.recordSHA256||replay.fresh?.recordSHA256!==row.replayFreshRecordSHA256||replay.fresh?.mathematicalSHA256!==row.mathematicalSHA256||replay.fresh?.execution?.status!=='COMPLETED'||canonical(replay.fresh?.sourceBinding)!==canonical(manifest.sourceBinding))throw Error('The actual fresh replay differs from its archived receipt: '+row.id);
    const archiveURL='https://github.com/leegahuyn/MathScopeCompute/blob/'+config.archiveCommit+'/research-ide/mathscope-m3/'+relative;
    full.visualSource={mode:'ARCHIVED_EXAMPLE',archiveURL,title:row.title,current:false};
    full.visualArchive={archiveReference:archiveURL};
    const compact=models.compactRecord(full);
    sourceFiles.push({id:row.id,path:relative,gzipSHA256:sha(bytes),recordSHA256:full.recordSHA256,mathematicalSHA256:full.mathematicalSHA256,replayPath:replayRelative,replayGzipSHA256:sha(replayBytes),replayStatus:'MATCH',compactBytes:Buffer.byteLength(JSON.stringify(compact)),fullBytes:raw.length});
    return compact;
  });
  if(canonical([...kinds].sort())!==canonical(manifest.expectedKinds))throw Error('The archive does not cover the exact declared CLI kinds.');
  return {records,sourceFiles,sourceCommit:config.archiveCommit,sourceEpochSHA256:epoch,sourceBinding:manifest.sourceBinding,executionManifest:{path:config.manifest,sha256:config.manifestSHA256,archiveCommit:config.archiveCommit,completedRuns:manifest.completedRunCount,freshReplayCount:manifest.runs.length,coveredKinds:[...kinds].sort(),localProcessReceipt:true,ciReceipt:false}};
}
function legacyArchive(){
// The original seven records remain available when no new pinned source
// configuration is present. They are never relabeled with a newer epoch.
const names=['elliptic-local','zeta-2','explicit-psi','operator-reference','central-11a1','central-37a1','taylor-zeta'];
const titles={'elliptic-local':'37a1 · 소수별 인자와 유리점','zeta-2':'ζ(2) · 미분과 복소 구간','explicit-psi':'ψ(10.5) · T=30 영점·명시적 공식','operator-reference':'ℓ² 대각 연산자 · 유한 계약','central-11a1':'11a1 · 중심값과 해석적 랭크','central-37a1':'37a1 · 중심값과 해석적 랭크','taylor-zeta':'ζ · 유한 변위 Taylor 나머지'};
const commit='bffb0db10934dc21ade349c76df7e911c34a9e55';
const sourceFiles=[];
const records=names.map(name=>{
  const relative='evidence/resume-20261012/attempt2/'+name+'.json.gz';
  const bytes=readFileSync(path.join(m3,relative)),full=JSON.parse(gunzipSync(bytes));
  const archiveURL='https://github.com/leegahuyn/MathScopeCompute/blob/'+commit+'/research-ide/mathscope-m3/'+relative;
  full.visualSource={mode:'ARCHIVED_EXAMPLE',archiveURL,title:titles[name],current:false};
  full.visualArchive={archiveReference:archiveURL};
  const compact=models.compactRecord(full);
  sourceFiles.push({path:relative,gzipSHA256:createHash('sha256').update(bytes).digest('hex'),recordSHA256:full.recordSHA256,compactBytes:Buffer.byteLength(JSON.stringify(compact)),fullBytes:gunzipSync(bytes).length});
  return compact;
});
return {records,sourceFiles,sourceCommit:commit};
}
const selected=existsSync(options.source)?freshArchive(JSON.parse(readFileSync(options.source,'utf8'))):legacyArchive();
const {records,sourceFiles}=selected;
const progress=JSON.parse(readFileSync(path.join(m3,'P7_PROGRESS.json'),'utf8'));
const payload={schema:'MathScope.M3.P7VisualArchive/1',...selected,authority:'DISPLAY_EXTRACTS_ONLY_ORIGINAL_RECORDS_REQUIRE_REEXECUTION',currentLiveVerification:false,proofStatusPromoted:false,adapterSourceSHA256:sha(readFileSync(path.join(root,'p7-visual-models.js'))),capabilities:{criteria:progress.criteria}};
const content=JSON.stringify(payload,null,2)+'\n';
const modelSummary=Array.from({length:8},(_,i)=>{const criterion='P7-0'+(i+1),m=models.build({criterion,records,capabilities:payload.capabilities});return {criterion,points:m.points.length,lines:m.lines.length,enclosures:m.enclosures.length,rows:m.table.rows.length,status:m.status};});
if(modelSummary.some(row=>row.status!=='RECORDED_EVIDENCE_VISUALIZED'||row.rows===0))throw Error('One of the eight original P7 panels has no actual archived data.');
if(options.check){if(!existsSync(options.output)||readFileSync(options.output,'utf8')!==content)throw Error('The generated P7 visual archive is stale.');}
else writeFileSync(options.output,content);
console.log(JSON.stringify({bytes:Buffer.byteLength(content),sha256:sha(content),sourceCommit:selected.sourceCommit,sourceEpochSHA256:selected.sourceEpochSHA256??null,checkOnly:options.check,sourceFiles,models:modelSummary},null,2));
