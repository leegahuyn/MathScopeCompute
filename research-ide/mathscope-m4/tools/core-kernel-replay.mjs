import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, join, dirname, relative } from 'node:path';
import {createM4ProofJob} from '../proof-jobs.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const arg=n=>{const i=process.argv.indexOf(n);return i<0?null:process.argv[i+1];};
const lean=arg('--lean');
if(!lean) throw new Error('--lean must identify an installed executable; no installation or toolchain substitution occurs.');
const out=resolve(root,arg('--out')||'research-ide/mathscope-m4/evidence/core-kernel-20261014-attempt2');
if(!relative(join(root,'research-ide/mathscope-m4/evidence'),out)||relative(join(root,'research-ide/mathscope-m4/evidence'),out).startsWith('..')) throw new Error('Output must be a new evidence subdirectory.');
await mkdir(out,{recursive:true});
if((await readdir(out)).length) throw new Error('Existing evidence may not be overwritten.');
const hash=b=>createHash('sha256').update(b).digest('hex');
const compiled=join(out,'compiled');
const receipt={schemaVersion:'mathscope.m4.core-kernel-replay/1',startedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),platform:process.platform,nodeVersion:process.version,mathlibCommit:null,usesMathlib:false,environment:{},sources:[],executions:[],targets:[],negativeControls:[],scope:'New exact integer finite fixtures and precision-metric uniform-limit theorem. Core toolchain is recorded separately from historical Linux/mathlib pins.',grantsM4FinalAcceptance:false,publicationConfirmed:false,exitCode:1};
const save=()=>writeFile(join(out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
function run(name,args) {
 const t=performance.now();
 const r=spawnSync(lean,args,{cwd:out,encoding:'utf8',timeout:60000,maxBuffer:2000000,env:{...process.env,LEAN_PATH:compiled}});
 const log=(r.stdout||'')+(r.stderr||'');
 return {name,args,log,exitCode:r.status,errorCode:r.error?.code||null,elapsedMilliseconds:Math.round(performance.now()-t),warnings:log.split('\n').filter(x=>x.includes('warning:'))};
}
async function execute(name,args) {
 const r=run(name,args);const logPath=name+'.log';await writeFile(join(out,logPath),r.log);
 receipt.executions.push({...r,log:undefined,logPath,logSha256:hash(Buffer.from(r.log))});await save();return r;
}
async function source(path,bytes) {
 await mkdir(dirname(join(out,'sources',path)),{recursive:true});
 await writeFile(join(out,'sources',path),bytes);receipt.sources.push({path,sha256:hash(bytes),bytes:bytes.length});
}
try {
 const version=await execute('lean-version',['--version']);if(version.exitCode!==0)throw new Error('LEAN_VERSION_FAILED');
 receipt.environment={leanVersion:version.log.trim(),leanCommit:version.log.match(/commit ([0-9a-f]{40})/)?.[1]||null,executableSha256:hash(await readFile(lean))};
 for(const module of ['Defs','Finite']) await source(`MathScope/M0/${module}.lean`,execFileSync('git',['show',`${receipt.sourceCommit}:research-ide/mathscope-m0/lean/MathScope/M0/${module}.lean`],{cwd:root}));
 for(const module of ['Defs','Finite','Analytic','Comparison','Conditional','Open']) await source(`MathScope/M4/${module}.lean`,await readFile(join(root,`research-ide/mathscope-m4/lean/MathScope/M4/${module}.lean`)));
 receipt.generatedProofJob=await createM4ProofJob();
 await source('MathScope/M4/Generated.lean',Buffer.from(receipt.generatedProofJob.sources[0].content));
 const checks=[['NegativeFalse','import Init\nexample : (0 : Nat) = 1 := by rfl\n','rfl'],['NegativePrime','import MathScope.M4.Defs\nexample : MathScope.M4.primeTrial 21 = true := by decide\n','decide']];
 for(const [name,text]of checks)await source(name+'.lean',Buffer.from(text));
 for(const entry of receipt.sources.filter(x=>/MathScope\//.test(x.path))) {
  const olean=join(compiled,entry.path.replace('.lean','.olean'));await mkdir(dirname(olean),{recursive:true});
  const r=await execute('compile-'+entry.path.replaceAll('/','-').replace('.lean',''),['--memory=512','--threads=1','-o',olean,'sources/'+entry.path]);
  if(r.exitCode!==0)throw new Error(`COMPILE_FAILED:${entry.path}:${r.errorCode||r.exitCode}`);
  if(r.warnings.length||/sorryAx|declaration uses.*sorry/.test(r.log))throw new Error(`WARNING_OR_SORRY:${entry.path}`);
  receipt.executions.at(-1).compiledSha256=hash(await readFile(olean));
  for(const m of r.log.matchAll(/'(MathScope\.[^']+)' (?:does not depend on any axioms|depends on axioms:\s*\[([^\]]*)\])/g)) {
   const axioms=(m[2]||'').split(',').map(x=>x.trim()).filter(Boolean).sort();
   const conditional=m[1].startsWith('MathScope.M4.Conditional.');
   const userAxioms=axioms.filter(x=>!['propext','Classical.choice','Quot.sound'].includes(x));
   if(!conditional&&userAxioms.length)throw new Error('UNCONDITIONAL_USER_AXIOM:'+m[1]);
   const typeStart=r.log.lastIndexOf(m[1],m.index-1);
   const targetType=r.log.slice(typeStart,m.index).trim();
   receipt.targets.push({target:m[1],targetType,axioms,userAxioms,grade:conditional?'USER_AXIOM_CONDITIONAL':'CORE_KERNEL_VERIFIED',logPath:receipt.executions.at(-1).logPath});
  }
  await save();
 }
 for(const [name,,reason] of checks){const r=await execute(name,['--memory=512','--threads=1','sources/'+name+'.lean']);const expected=r.exitCode===1&&r.log.includes(reason)&&!r.log.includes('unknown module prefix');receipt.negativeControls.push({name,exitCode:r.exitCode,rejectedForExpectedReason:expected});if(!expected)throw new Error('NEGATIVE_CONTROL_BAD:'+name);}
 const files=receipt.sources.filter(x=>x.path.startsWith('MathScope/M4/')&&!x.path.includes('Conditional'));
 for(const f of files){const text=await readFile(join(out,'sources',f.path),'utf8');if(/^import.*(?:Conditional|Open)/m.test(text)&&!f.path.endsWith('Open.lean'))throw new Error('OPEN_CONDITIONAL_IMPORT');if(/^axiom\b/m.test(text)||/\b(?:sorry|admit)\b/.test(text))throw new Error('UNCONDITIONAL_SOURCE_AXIOM');}
 receipt.status='NEW_CORE_FINITE_AND_UNIFORM_LIMIT_KERNEL_VERIFIED';receipt.exitCode=0;
} catch(error) {receipt.status='NEW_CORE_KERNEL_FAILED';receipt.failure=String(error.message);}
receipt.finishedAt=new Date().toISOString();await save();
console.log(JSON.stringify({status:receipt.status,targets:receipt.targets.length,negativeControls:receipt.negativeControls,failure:receipt.failure||null,out},null,2));process.exitCode=receipt.exitCode;
