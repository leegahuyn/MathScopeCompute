import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {openSavedInitializedSource,savedInitializedSourceProgram} from '../navier/source-saved-initialized-authority.mjs';
import {attachSavedNaturalSeriesAuditAuthority} from '../certification-20261014/replay-series.mjs';
import {auditMeanCaptureContinuation} from './mean_capture.mjs';
const args=process.argv.slice(2),at=name=>{const i=args.indexOf(name);if(i<0||!args[i+1])throw new Error('Provide '+name);return resolve(args[i+1]);};
const artifacts=at('--artifacts'),output=at('--output');await mkdir(output,{recursive:true});
const sha=raw=>createHash('sha256').update(raw).digest('hex'),save=(name,x)=>writeFile(resolve(output,name),JSON.stringify(x,null,2)+'\n');
const pinned=async(path,pin)=>{const raw=await readFile(path);if(sha(raw)!==pin)throw Object.assign(new Error('Changed first cloud artifact: '+path),{code:'CHANGED_FIRST_CLOUD_ARTIFACT'});return {json:JSON.parse(raw),sha256:pin,bytes:raw.length};};
await save('mean-capture-started.json',{sourceCommit:process.env.GITHUB_SHA??null,priorRun:38500114302,heavyMeanReplayRepeated:false,originalN601Complete:false,originalN602Complete:false});
try{
  const folder=resolve(artifacts,'mean-proof-mean-38500114302'),mean=await pinned(resolve(folder,'original-mean-result.json'),'76dbdd374189a0f4a1da5e3f331883bda6c97cfc7e5153d8aac1f26c4f7ee738'),prior=await pinned(resolve(folder,'mean-functional-equivalence.json'),'3ac8514cec70b9dd844fcfdee48be5be05e64321a44c88d43a8da09a88095ded');
  const receipt=JSON.parse(await readFile(resolve(folder,'receipt.json')));
  if(receipt.sourceCommit!=='ba87dc9c09567c9a486d424ffb3e63a7eb04a12d')throw new Error('Changed first cloud source commit.');
  for(const [name,record]of [['original-mean-result.json',mean],['mean-functional-equivalence.json',prior]]){const member=receipt.members.find(x=>x.path===name);if(member?.sha256!==record.sha256||member?.bytes!==record.bytes)throw new Error('Changed first cloud member receipt.');}
  const cap=await openSavedInitializedSource(),source=savedInitializedSourceProgram(cap),definitions={};
  if(JSON.stringify(mean.json.source)!==JSON.stringify(cap.source)||JSON.stringify(prior.json.source)!==JSON.stringify(cap.source))throw new Error('First cloud artifacts and immutable source differ.');
  for(const record of source.definitionCollections){const name=record.namespace.split('.').at(-1);if(definitions[name])throw new Error('Ambiguous original registry '+name);definitions[name]=record.value;}
  const result=auditMeanCaptureContinuation({mean:mean.json,prior:prior.json,definitions,sourceNode:source.node,naturalRule:attachSavedNaturalSeriesAuditAuthority(cap)});
  result.inputAuthentication={priorRun:38500114302,sourceCommit:receipt.sourceCommit,originalMeanSHA256:mean.sha256,priorFunctionalSHA256:prior.sha256,immutableSourceReopened:true,all155OriginalSourceBytesVerified:cap.verification.all155OriginalSourceBytesVerified,fullParentUncompressedStreamVerified:cap.verification.fullParentUncompressedStreamVerified};
  await save('mean-capture-result.json',result);console.log(JSON.stringify({status:result.status,captureStatus:result.capture.status,sourceNodes:result.capture.sourceNodes,unknownBoundaries:result.capture.unknownBoundaryCount,analyticPremisesProved:false,originalN601Complete:false,originalN602Complete:false}));
  if(!result.capture.complete)process.exitCode=2;
}catch(error){await save('mean-capture-failure.json',{status:'UNRESOLVED',code:error.code??null,message:error.message,stack:error.stack,originalN601Complete:false,originalN602Complete:false});throw error;}
