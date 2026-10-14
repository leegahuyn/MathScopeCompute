import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {openSavedInitializedSource} from '../navier/source-saved-initialized-authority.mjs';
import {attachSavedInitializedNormFamily} from '../navier/source-saved-initialized-norm-family.mjs';
import {attachSavedInitializedCutoffAuthority} from '../navier/source-saved-initialized-cutoff-norms.mjs';
import {auditSavedWholeMeanConditional} from './replay-mean.mjs';
const at=process.argv.indexOf('--output'),out=resolve(process.argv[at+1]??'mean-evidence');await mkdir(out,{recursive:true});
await writeFile(resolve(out,'started.json'),JSON.stringify({schema:'MathScope.N6.OptimizedMeanAttempt/1',startedAt:new Date().toISOString(),maxWork:5000000,maxNodes:800000,sourceCommit:process.env.GITHUB_SHA,originalN601Complete:false,originalN602Complete:false},null,2)+'\n');
try{
  const cap=await openSavedInitializedSource(),family=await attachSavedInitializedNormFamily(cap),cutoff=await attachSavedInitializedCutoffAuthority(family);
  for(const maximumMode of ['conditional','original']){
    const result=await auditSavedWholeMeanConditional(cap,cutoff,{maxWork:5000000,maxNodes:800000,maxTerms:30000,maxProducts:2000000,maximumMode});
    await writeFile(resolve(out,maximumMode==='original'?'original-mean-result.json':'mean-result.json'),JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify({maximumMode,status:result.status,comparisons:result.rows.retained.map(r=>({stage:r.stage,pass:Object.fromEntries(Object.entries(r.comparisons).map(([k,c])=>[k,c.pass]))})),stops:result.stops,scope:result.scope}));
  }
}catch(error){
  await writeFile(resolve(out,'implementation-failure.json'),JSON.stringify({code:error.code??null,message:error.message,stack:error.stack,sourceStack:error.actualSourceImportStack??[],status:'UNRESOLVED',originalN601Complete:false,originalN602Complete:false},null,2)+'\n');throw error;
}
