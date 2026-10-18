import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {recordedSourceIterationDecay} from '../overlay/research-ide/mathscope-m3/navier/source-iteration-decay.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const x=await recordedSourceIterationDecay({stageCount:3,order:3,maxWork:100000});
fs.writeFileSync(path.join(root,'EXISTING_ITERATION_PROGRAM_REPLAY.json'),JSON.stringify(x,null,2)+'\n');
console.log(JSON.stringify({status:x.status,exponentChecks:x.program.algebra.checks.length,checks:x.checks.every(c=>c.pass),sourceDomain:x.sourceDomain}));
