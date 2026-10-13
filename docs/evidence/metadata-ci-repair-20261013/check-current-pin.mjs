import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {implementationPin} from '../../../research-ide/mathscope-m3/navier/implementation-pin.mjs';
import {inheritedSource} from '../../../research-ide/mathscope-m3/navier/source-inheritance.mjs';

// Run from the repository root. This reproduces the unchanged CI pin gate and
// additionally authenticates every original saved-source capture row.
const sha=x=>createHash('sha256').update(x).digest('hex');
const stable=x=>Array.isArray(x)?'['+x.map(stable).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x);
const expected=fs.readdirSync('research-ide/mathscope-m3/navier').filter(n=>n.endsWith('.mjs')&&n!=='implementation-pin.mjs').sort();
assert.deepEqual(implementationPin.files.map(r=>r.path),expected.map(n=>'research-ide/mathscope-m3/navier/'+n));
for(const row of implementationPin.files){const raw=fs.readFileSync(row.path);assert.equal(raw.length,row.bytes,row.path);assert.equal(sha(raw),row.sha256,row.path);}
assert.equal(sha(stable(implementationPin.files)),implementationPin.sha256);
const {sourceFileChecks,...small}=JSON.parse(fs.readFileSync('research-ide/mathscope-m3/navier/source-inheritance.json','utf8'));
small.sourceFileCheckCount=sourceFileChecks.length;
assert.deepEqual(inheritedSource,small);
const capture=JSON.parse(fs.readFileSync('research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291/source-bytes-before.json','utf8'));
assert.equal(capture.files.length,155);
assert.equal(capture.files.some(r=>r.path.endsWith('/implementation-pin.mjs')),false);
for(const row of capture.files){const raw=fs.readFileSync(row.path);assert.equal(raw.length,row.bytes,row.path);assert.equal(sha(raw),row.sha256,row.path);}
console.log(JSON.stringify({status:'PASS',implementationFiles:implementationPin.files.length,implementationSHA256:implementationPin.sha256,old155CapturedSourceFilesMatched:true,implementationPinInOld155Capture:false,inheritedM2MetadataUnchanged:true}));
