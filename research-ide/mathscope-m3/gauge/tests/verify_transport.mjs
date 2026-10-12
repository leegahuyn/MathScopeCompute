/** Reproduce the observed publisher escape mutation and protect exact source bytes. */
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PINNED_GAUGE_SOURCES} from '../proof-data.mjs';

const here=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=s=>createHash('sha256').update(s).digest('hex');
const source=PINNED_GAUGE_SOURCES.find(s=>s.path==='mathscope-m3/p8/tools/audit_lean.py');
const observedMutation=source.content.replaceAll('\\ufeff','\ufeff');
assert.equal(sha(source.content),'df9b236d0f3fbd2f9c81ba5273945a500cffcf4514e51d971d8f439aafe07d33');
assert.equal(sha(observedMutation),'9c5337fbe10342d6e0bfc6b0619e3f8dae9e76a6d37b72c4ce21eb883d3fc6ea');
const module=await readFile(path.join(here,'proof-data.mjs'),'utf8');
const published=module.replace(/\\u([\da-f]{4})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
assert.equal(published,module,'The source transport still contains Unicode escapes a publisher can change.');
const checks=PINNED_GAUGE_SOURCES.map(s=>({path:s.path,expected:s.sha256,actual:sha(s.content)}));
assert.ok(checks.every(s=>s.actual===s.expected));
const receipt={schema:'MathScope.M3.GaugeSourceTransportAudit/1',status:'EXECUTED',
 moduleSha256:sha(module),transport:'UTF8_BASE64_THEN_EXACT_TEXT_SHA256',
 observedFailure:{pageVersion:87,sourcePath:source.path,mutation:'six literal ASCII characters backslash-u-f-e-f-f became one U+FEFF code point',correctSourceSha256:sha(source.content),publishedCorruptedSha256:sha(observedMutation),reproduced:true},
 publisherMutationSimulationPreservesModule:true,sourceChecks:checks,
 scope:'Encoding protects exact recorded bytes. No hash check is weakened and no new kernel execution is claimed.'};
await writeFile(path.join(here,'evidence/source-transport-audit.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,sources:checks.length,allSourceHashesMatch:true,observedFailureReproduced:true,publisherMutationSimulationPreservesModule:true}));
