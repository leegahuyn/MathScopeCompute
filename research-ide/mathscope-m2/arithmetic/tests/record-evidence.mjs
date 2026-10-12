// Run domain acceptance, verify original text preservation, then write source-bound evidence.
// This utility does not build the shared worker, commit, push or deploy.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {getExamples,getCapabilities,getChecklist,runJob,VERSION} from '../index.mjs';

const domain=fileURLToPath(new URL('../',import.meta.url)),repo=path.resolve(domain,'../../..'),evidence=path.join(domain,'evidence'),tests=(await readdir(path.join(domain,'tests'))).filter(x=>x.endsWith('.test.mjs')).sort().map(x=>path.relative(repo,path.join(domain,'tests',x)));
const testCommand=[process.execPath,'--test','--test-reporter=tap',...tests],test=spawnSync(testCommand[0],testCommand.slice(1),{cwd:repo,encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024}),output=(test.stdout??'')+(test.stderr??'');
await writeFile(path.join(evidence,'test-output.txt'),output);
const executed=Number(output.match(/^# tests (\d+)/m)?.[1]??0),passed=Number(output.match(/^# pass (\d+)/m)?.[1]??0),failed=Number(output.match(/^# fail (\d+)/m)?.[1]??-1);
if(test.status!==0||executed===0||failed!==0||passed!==executed)throw new Error('Arithmetic acceptance tests failed; successful evidence was not regenerated.');
const originalBytes=await readFile(path.resolve(domain,'../evidence/original-m2-criteria.json')),original=JSON.parse(originalBytes),checklist=getChecklist();
const flatten=value=>Array.isArray(value)?value.flatMap(flatten):value&&typeof value==='object'?[...(value.id&&value.criteria?[value]:[]),...Object.values(value).flatMap(flatten)]:[];
const candidates=flatten(original);let originalRows=candidates.filter(x=>/^P[456]-\d\d$/.test(x.id));
if(originalRows.length!==24)throw new Error('Cannot find exactly 24 original arithmetic criteria.');
for(const c of checklist){const x=originalRows.find(x=>x.id===c.id);if(!x||x.criteria!==c.criteria||x.title!==c.title||Number(x.sourcePage??x.page)!==c.sourcePage)throw new Error('Original criterion changed: '+c.id);}
const sha=data=>createHash('sha256').update(data).digest('hex'),write=async(name,data)=>writeFile(path.join(evidence,name),JSON.stringify(data,null,2)+'\n');
const examples=[];
for(const ex of getExamples()){
 const r=await runJob(ex.request);if(r.status!=='COMPLETED'||!r.checks.every(c=>c.pass)||!r.visualization.points?.length)throw new Error('Example acceptance failed: '+ex.id);
 await write(ex.id+'.json',r);examples.push({id:ex.id,status:r.status,resultHash:r.resultHash,sourceHash:r.provenance.sourceHash,displayPointCount:r.visualization.points.length,checks:r.checks});
}
await write('capabilities.json',getCapabilities());
const sourceFiles={};for(const f of [...(await readdir(domain)).filter(x=>x.endsWith('.mjs')||x==='README.md'),...(await readdir(path.join(domain,'tests'))).filter(x=>x.endsWith('.mjs')).map(x=>'tests/'+x)].sort())sourceFiles[f]=sha(await readFile(path.join(domain,f)));
const counts={total:checklist.length,pass:checklist.filter(x=>x.status==='PASS').length,partial:checklist.filter(x=>x.status==='PARTIAL').length};
await write('acceptance.json',{schema:'MathScope.M2.ArithmeticAcceptance/2',version:VERSION,completedAt:new Date().toISOString(),scope:'Original 24 P4–P6 criteria, preserved verbatim; actual standard objects, exact observations and checked external theorem applications',testCommand:'node --test research-ide/mathscope-m2/arithmetic/tests/*.test.mjs',tests:{executed,passed,failed,exitCode:test.status,output:'test-output.txt'},originalCriteria:{path:'../evidence/original-m2-criteria.json',sha256:sha(originalBytes),verbatimTextAndPagesVerified:true},criteria:counts,sourceFiles,examples,checklist,remainingObligations:[],browserVerification:'SEPARATE_PARENT_RELEASE_AUDIT_REQUIRED',formalComplete:false,entireM2Complete:false});
console.log(JSON.stringify({version:VERSION,tests:{executed,passed,failed},criteria:counts,examples:examples.length,statuses:Object.fromEntries(['COMPLETED','PARTIAL'].map(status=>[status,examples.filter(x=>x.status===status).length])),verbatimTextAndPagesVerified:true}));
