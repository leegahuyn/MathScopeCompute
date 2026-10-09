import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {runControlledContinuation,getContinuationExamples} from './controlled-continuation.mjs';
import {runAdmissibleLoop,getLoopExamples} from './admissible-loop.mjs';
const dir=fileURLToPath(new URL('.',import.meta.url)),examples=[];
for(const example of getContinuationExamples()){
  const request={...example.request,input:{...example.request.input,samples:81}};
  examples.push({id:example.id,request,result:await runControlledContinuation(request.input,request.budget)});
}
for(const example of getLoopExamples())examples.push({id:example.id,request:example.request,result:runAdmissibleLoop(example.request.input,example.request.budget)});
const sourceHashes=Object.fromEntries(['controlled-continuation.mjs','admissible-loop.mjs','generate-continuation-loop-evidence.mjs'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(dir+name)).digest('hex')]));
fs.writeFileSync(dir+'continuation-loop-examples.json',JSON.stringify({schema:'MathScope.NavierSourceConstructionExamples/1',sourceHashes,examples,fullProfileCertified:false},null,2)+'\n');
console.log(JSON.stringify(examples.map(e=>({id:e.id,status:e.result.status})),null,2));
