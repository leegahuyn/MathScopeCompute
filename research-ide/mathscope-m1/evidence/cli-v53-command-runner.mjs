/** Actual fixed-example CLI invocations for the M1 1.2.0 release audit.
 * Artifact-only driver: no domain or CLI source is modified.
 */
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(new URL('../..',import.meta.url).pathname);
const evidence=resolve(root,'mathscope-m1/evidence');
const hash=x=>createHash('sha256').update(x).digest('hex');
const cli=resolve(root,'mathscope-m1/cli.mjs');
const manifest=JSON.parse(await readFile(resolve(root,'mathscope-m1/build-manifest.json'),'utf8'));
const report={schema:'MathScope.M1.CliV53CommandRecord/1',nodeVersion:process.version,
  startedAt:new Date().toISOString(),cwd:root,cliSourceSha256:hash(await readFile(cli)),
  build:{workerSha256:manifest.workerSha256,bundleSha256:manifest.bundleSha256},commands:[]};
await writeFile(resolve(evidence,'cli-v53-build-snapshot.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
async function run(id,args,expectedExit){
  const start=new Date().toISOString();
  const {stdout,stderr,exitCode,signal}=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[cli,...args],{cwd:root,shell:false,stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';
    child.stdout.setEncoding('utf8').on('data',s=>stdout+=s);
    child.stderr.setEncoding('utf8').on('data',s=>stderr+=s);
    child.on('error',reject);child.on('close',(exitCode,signal)=>resolve({stdout,stderr,exitCode,signal}));
  });
  const out='cli-v53-'+id+'.stdout.log',err='cli-v53-'+id+'.stderr.log';
  await writeFile(resolve(evidence,out),stdout,{flag:'wx'});await writeFile(resolve(evidence,err),stderr,{flag:'wx'});
  report.commands.push({id,command:['node','mathscope-m1/cli.mjs',...args],startedAt:start,finishedAt:new Date().toISOString(),
    exitCode,expectedExit,exitMatches:exitCode===expectedExit,signal,stdoutFile:out,stderrFile:err,
    stdoutSha256:hash(stdout),stderrSha256:hash(stderr)});
  await writeFile(resolve(evidence,'cli-v53-commands.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({id,exitCode,expectedExit}));
}
await run('gluing',['run','ns-source-inner-gluing','--out','mathscope-m1/evidence/cli-v53-gluing-run'],2);
await run('pressure',['run','ns-source-pressure-bounds','--out','mathscope-m1/evidence/cli-v53-pressure-run'],0);
await run('axis',['run','ns-axis-source-exact-bounds','--out','mathscope-m1/evidence/cli-v53-axis-run'],0);
await run('existing-output-refusal',['run','ns-source-inner-gluing','--out','mathscope-m1/evidence/cli-v53-gluing-run'],1);
await run('unknown-example-refusal',['run','not-an-installed-example','--out','mathscope-m1/evidence/cli-v53-unknown-must-not-exist'],1);
await run('arbitrary-request-refusal',['run','ns-source-inner-gluing','--request','mathscope-m1/evidence/cli-v53-gluing-run/request.json'],1);
report.finishedAt=new Date().toISOString();
report.status=report.commands.every(c=>c.exitMatches)?'PASS':'FAIL';
await writeFile(resolve(evidence,'cli-v53-commands.json'),JSON.stringify(report,null,2)+'\n');
if(report.status!=='PASS')process.exitCode=1;
