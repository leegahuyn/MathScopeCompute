import {writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {verifyHostedKernelReplay,verifyCoreKernelReplay} from './kernel-evidence.mjs';
import {buildFormalClaims,M4_OPEN_RESEARCH} from './formal-claims.mjs';
const hosted=[];
for(const id of ['38394604031','38394614544']){const r=await verifyHostedKernelReplay(id);hosted.push(r);}
const core=await verifyCoreKernelReplay();
const report={schemaVersion:'mathscope.m4.public-formal-audit/1',readbackAt:new Date().toISOString(),verified:hosted.every(x=>x.verified)&&core.verified,hostedKernelReadbacks:hosted,newCoreKernelReadback:core,claims:core.verified?buildFormalClaims(core):[],openResearch:M4_OPEN_RESEARCH,originalCriteriaFinalAcceptance:'UNCONFIRMED',grantsM4FinalAcceptance:false,publicationConfirmed:false,scope:'Two dated official Lean4.34.1/mathlib successes and fresh Lean4.34.0-rc2 core targets have exact raw evidence. Core precision-metric theorem is not a real norm, derivative, continuum construction, RH or BSD proof.'};
const i=process.argv.indexOf('--out');if(i>=0){const path=process.argv[i+1];await mkdir(dirname(path),{recursive:true});await writeFile(path,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({verified:report.verified,hosted:hosted.map(x=>({runId:x.runId,status:x.status,targets:x.targets?.length})),core:core.status,claims:report.claims.length},null,2));process.exitCode=report.verified?0:1;
