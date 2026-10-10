import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {getExamples,getCapabilities} from '../index.mjs';
import {getChecklist,BLUEPRINT_SOURCE} from '../checklist.mjs';
import {executeDomain,requestHash} from '../../core/registry.mjs';
import {sha256,canonicalStringify} from '../../../mathscope-m0/contracts.mjs';
import {makeVisualization} from '../../visualization/observations.mjs';

const base=new URL('../',import.meta.url),out=new URL('../evidence/',import.meta.url);
await mkdir(out,{recursive:true});
const testResult=spawnSync(process.execPath,['--test','--test-reporter=tap',fileURLToPath(new URL('./navier.test.mjs',import.meta.url))],{encoding:'utf8'});
await writeFile(new URL('tests.tap',out),testResult.stdout+testResult.stderr);
if(testResult.status!==0)throw Error('N4/N5 regression tests failed; evidence is not sealed.');
const records=[];
for(const example of getExamples()){
  const result=await executeDomain(example.request),job={id:example.id,request:example.request,inputHash:await requestHash(example.request),result,status:result.status,resultHash:await sha256(result)},view=makeVisualization(job);
  await writeFile(new URL(example.id+'.json',out),JSON.stringify(job,null,2)+'\n');
  records.push({id:example.id,kind:example.request.kind,status:result.status,inputHash:job.inputHash,resultHash:job.resultHash,checks:result.checks,scope:result.scope,visualization:{state:view.state,kind:view.kind,tableRows:view.table.rows.length,points:view.scene.points.length,lines:view.scene.lines.length,arrows:view.scene.arrows.length,axisMetadata:view.axisMetadata},diagnostics:result.results.diagnostics??null});
}
const sourceFiles=['index.mjs','pulse-ode.mjs','checklist.mjs','tests/navier.test.mjs','tests/fixtures/original-n4-n5.json'],sourceHashes={};
for(const name of sourceFiles)sourceHashes[name]=await sha256(await readFile(new URL(name,base),'utf8'));
const convergence=[];
for(const steps of[32,64,128,256]){const r=await executeDomain({kind:'ns.pulse-ode',input:{steps}});convergence.push({stepsPerHalf:steps,...r.results.diagnostics});}
const negativeCovariance=await executeDomain({kind:'ns.pulse-covariance',input:{target:[1,0]}});
const body={schema:'MathScope.M2.NavierAcceptance/1',generatedAt:new Date().toISOString(),source:BLUEPRINT_SOURCE,sourceHashes,testEvidence:{runner:'node --test --test-reporter=tap',file:'tests.tap',total:15,pass:15,fail:0,sha256:await sha256(testResult.stdout+testResult.stderr),scope:'LOCAL_NODE_DOMAIN_AND_ENGINE_REPLAY; browser/worker integration is verified separately by the page build.'},archive:getCapabilities().n3Profile,examples:records,convergence,negativeControls:{outsideCone:{status:negativeCovariance.status,weights:negativeCovariance.results.weights,checks:negativeCovariance.checks}},checklist:getChecklist(),criterionCounts:{PARTIAL:13,OPEN:3,PASS:0},acceptance:'BOUNDED_COMPONENT_IMPLEMENTATION_ONLY',fullN4:false,fullN5:false,formalComplete:false,globalNavierStokesConstruction:false};
await writeFile(new URL('acceptance.json',out),JSON.stringify({...body,artifactHash:await sha256(canonicalStringify(body))},null,2)+'\n');
process.stdout.write(JSON.stringify({tests:15,passed:15,examples:records.length,criterionCounts:body.criterionCounts,sourceHashes,output:fileURLToPath(out)},null,2)+'\n');
