import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {openSavedInitializedSource} from '../navier/source-saved-initialized-authority.mjs';
import {attachSavedInitializedNormFamily} from '../navier/source-saved-initialized-norm-family.mjs';
import {attachSavedInitializedCutoffAuthority} from '../navier/source-saved-initialized-cutoff-norms.mjs';
import {auditSavedWholeMeanConditional} from '../certification-20261014/replay-mean.mjs';
import {compareSavedMeanFunctionalEquivalence} from './mean-functional-equivalence.mjs';
import {exportInitialFiniteWitness} from './initial-finite-source.mjs';
const at=process.argv.indexOf('--output');if(at<0||!process.argv[at+1])throw new Error('Provide --output DIR');
const output=resolve(process.argv[at+1]);await mkdir(output,{recursive:true});
const save=async(name,result)=>writeFile(resolve(output,name),JSON.stringify(result,null,2)+'\n');
await save('started.json',{schema:'MathScope.N6.ActualMeanEquivalenceRun/1',startedAt:new Date().toISOString(),sourceCommit:process.env.GITHUB_SHA??null,allOriginalMaximumValuesRetained:true,originalN601Complete:false,originalN602Complete:false});
try{
  const cap=await openSavedInitializedSource();await exportInitialFiniteWitness(cap,output);
  const family=await attachSavedInitializedNormFamily(cap),cutoff=await attachSavedInitializedCutoffAuthority(family);
  // One complete original source read; the independently reconstructed means
  // and subsequent body/capture inspection share this immutable provider.
  const mean=await auditSavedWholeMeanConditional(cap,cutoff,{maxWork:5000000,maxNodes:800000,maxTerms:30000,maxProducts:2000000,maximumMode:'original'});
  await save('original-mean-result.json',mean);
  const result=compareSavedMeanFunctionalEquivalence(mean,{capability:cap});await save('mean-functional-equivalence.json',result);
  console.log(JSON.stringify({status:result.status,matched:result.matchedComparisons,total:8,capture:result.capture.status,sourceNodesExpanded:result.capture.sourceNodes,actualPrivateSourceAudit:result.actualPrivateSourceAudit,stops:result.stops,originalN601Complete:false,originalN602Complete:false}));
}catch(error){await save('implementation-failure.json',{status:'UNRESOLVED',code:error.code??null,message:error.message,stack:error.stack,sourceNode:error.sourceNode??null,originalN601Complete:false,originalN602Complete:false});throw error;}
