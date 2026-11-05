// Verifies source-referenced bytes; does not certify their mathematical claims.
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const repo=process.env.MATHSCOPE_REPO ?? 'C:/Users/사용자/Documents/Codex/2026-10-24/referenced-chatgpt-conversation-this-is-an/work/MathScopeCompute';
const reference=process.env.MATHSCOPE_REFERENCE_REPO ?? 'C:/Users/사용자/Documents/Codex/2026-10-15/task/MathScopeCompute';
const commit='origin/mathscope-cd-lean-three-gates-20261027';
const modules=['research-ide/mathscope-m2/navier/actual-background-majorant.mjs','research-ide/mathscope-m2/navier/actual-background-data.mjs'];
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
for(const f of modules)assert.equal(git(repo,'hash-object',f),git(reference,'rev-parse',`${commit}:${f}`));
const {actualBackgroundMajorant}=await import(pathToFileURL(path.join(repo,modules[0])).href);
const record=actualBackgroundMajorant({order:1,bits:128});
assert.equal(record.scope.numericalPicardTruncationCompleted,false);
assert.equal(record.picard.truncationActuallyEvaluated,false);
const inputs=[];
for(const [key,v] of Object.entries(record.sourceInputs)){
 const sourcePath='research-ide/'+v.path;
 let bytes;
 try {bytes=execFileSync('git',['show',`${commit}:${sourcePath}`],{cwd:reference,maxBuffer:32*1024*1024});}
 catch(e){inputs.push({key,path:sourcePath,expected:v.sha256,status:'MISSING_IN_PINNED_COMMIT'});continue;}
 const got=createHash('sha256').update(bytes).digest('hex');
 inputs.push({key,path:sourcePath,expected:v.sha256,actual:got,expectedBytes:v.bytes,actualBytes:bytes.length,status:got===v.sha256&&bytes.length===v.bytes?'MATCH':'MISMATCH'});
}
const result={sourceCommit:git(reference,'rev-parse',commit),moduleBlobs:Object.fromEntries(modules.map(f=>[f,git(repo,'hash-object',f)])),inputs,
 allReferencedSourceBytesMatch:inputs.every(x=>x.status==='MATCH'),scope:'Hash checks only, not proof of mathematical validity, original uploaded-PDF identity, analytic norm bounds, or actual Picard numerical evaluation.',
 sourceTruncationActuallyEvaluated:record.picard.truncationActuallyEvaluated};
const out=path.join(path.dirname(fileURLToPath(import.meta.url)),'majorant-source-provenance.json');fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
