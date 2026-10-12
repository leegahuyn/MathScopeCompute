/** Execute the public examples, bind their exact source bytes, and save replayable data. */
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {runGaugeM3,getExamples,exportGaugeSession,replayGaugeSession,inspectFieldSelection,connectedCorrelators} from './index.mjs';
import {sha256} from './contracts.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..'),out=path.join(here,'evidence'),examplesDir=path.join(out,'examples');
await mkdir(examplesDir,{recursive:true});
const relative=p=>path.relative(repo,p).replaceAll(path.sep,'/');
const source=[];
for(const dir of [here,path.resolve(here,'../../mathscope-m1/gauge'),path.resolve(here,'../../mathscope-m2/gauge')]){
 for(const name of (await readdir(dir)).filter(x=>x.endsWith('.mjs')).sort()){
  const file=path.join(dir,name);source.push({path:relative(file),sha256:await sha256(await readFile(file,'utf8'))});
 }
}
const startedAt=new Date().toISOString(),started=Date.now(),rows=[];
for(const example of getExamples()){
 const t=Date.now(),result=await runGaugeM3(example.request,{maxMillis:180000}),file=path.join(examplesDir,example.id+'.json');
 assert.equal(result.status==='COMPLETED'||result.status==='EXACT_RATIONAL_FINITE_CERTIFICATE',true);
 assert.equal(result.proofBoundary.clayProblemSolved,false);
 assert.equal(result.continuumGap,'OPEN_CONTINUUM');
 await writeFile(file,JSON.stringify(result,null,2)+'\n');
 let selection=null;
 if(result.kind==='field-family'){
  const index=Math.floor(result.states[0].points.length/2),selected=inspectFieldSelection(result,0,index);
  assert.equal(selected.sourceHash,result.states[0].sourceHash);
  assert.equal(selected.observable.value,result.states[0].points[index].value);
  selection={state:0,index,coordinate:selected.coordinate,sourceHash:selected.sourceHash};
 }
 rows.push({id:example.id,request:example.request,status:result.status,resultHash:await sha256(result),sourceHash:result.sourceHash,file:relative(file),elapsedMillis:Date.now()-t,selection});
 console.log(`${example.id}: ${result.status}`);
}
const original=JSON.parse(await readFile(path.join(examplesDir,'y5-effective-su3.json'),'utf8'));
const session=await exportGaugeSession(original,{selectedState:0,selectedPoint:13});
const replay=await replayGaugeSession(session,{maxMillis:180000});assert.equal(replay.status,'MATCH');
await writeFile(path.join(out,'field-session.json'),JSON.stringify(session,null,2)+'\n');
const productionPath=path.join(out,'ensemble-production-attempt2.json'),production=JSON.parse(await readFile(productionPath,'utf8')),productionChecks=[];
for(const row of production.calibration){
 const saved=row.replicas.flatMap(r=>r.samples),recomputed=connectedCorrelators(saved,row.lattice.Nt);
 assert.deepEqual(recomputed.matrices,row.correlator.matrices);
 assert.equal(await sha256(saved),row.sampleHash);
 const mean=saved.flatMap(s=>s.operators).reduce((sum,p)=>sum+p[0],0)/(saved.length*row.lattice.Nt);
 let oracleResidual=0;
 for(let lag=0;lag<row.lattice.Nt;lag++){
  const disconnected=saved.reduce((sum,s)=>sum+s.operators.reduce((x,p,t)=>x+p[0]*s.operators[(t+lag)%row.lattice.Nt][0],0),0)/(saved.length*row.lattice.Nt);
  oracleResidual=Math.max(oracleResidual,Math.abs(disconnected-mean*mean-row.correlator.matrices[lag][0][0]));
 }
 assert.ok(oracleResidual<1e-12);
 productionChecks.push({targetDelta:row.targetDelta,beta:row.beta,sampleHash:row.sampleHash,sampleCount:saved.length,sourceHash:row.sourceHash,connectedRecompute:'EXACT_FLOAT64_REPLAY',independentMomentFormulaMaxResidual:oracleResidual,stationarity:row.quantitativeStatus,channelEffectiveSampleSize:row.replicas.map(r=>r.statistics.channel.effectiveSampleSize),targets:row.targetComparison});
}
const receipt={schema:'MathScope.M3.GaugeRuntimeAudit/1',status:'EXECUTED',startedAt,elapsedMillis:Date.now()-started,runtime:{node:process.version,platform:process.platform,arch:process.arch},source,sourceManifestHash:await sha256(source),examples:rows,sessionReplay:{status:replay.status,expectedHash:replay.expectedHash,actualHash:replay.actualHash,newExecution:replay.newExecution},productionRecomputation:{file:relative(productionPath),executionSourceRecord:relative(path.join(out,'source-production2/manifest.json')),rows:productionChecks},limits:['Source hashes bind these executions to the listed bytes.','The long production chains retain their own earlier exact source snapshot; this audit recomputes their recorded correlations, not their full Markov histories.','Generic kernel statements do not certify newly edited browser inputs.','Physical target calibration, matched continuum/volume studies, a general flow solver and any unobserved Real Mathlib run remain separate gates.']};
await writeFile(path.join(out,'runtime-audit.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,examples:rows.length,replay:replay.status,productionRows:productionChecks.length,elapsedMillis:receipt.elapsedMillis}));
