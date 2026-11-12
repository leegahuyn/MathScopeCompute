import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream,readFileSync} from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {canonicalHash,makeSnapshot} from './large_pack.mjs';
import {pinRuntime} from '../compact-lookup/pin_runtime.mjs';

const [runtime,file,countArg]=process.argv.slice(2),count=Number(countArg);
assert(runtime&&file&&Number.isSafeInteger(count)&&count>0&&global.gc);
await pinRuntime(runtime);
assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),'9b2e16a14fe0daf81e4325d05eb5966d74164e34b537da1fb3abc4d95754751c');
const {canonicalStringify}=await import(pathToFileURL(resolve(runtime,'research-ide/mathscope-m0/contracts.mjs')).href);
const nodes=[],h=createHash('sha256');h.update('[');let header=null,n=0;
for await(const line of createInterface({input:createReadStream(file).pipe(createGunzip()),crlfDelay:Infinity})){
  if(!header){header=JSON.parse(line);continue;}
  const node=JSON.parse(line);nodes.push(node);if(n)h.update(',');h.update(canonicalStringify(node));n++;
  if(n===count)break;
}
assert.equal(n,Math.min(count,header.node_count));h.update(']');const oracle=h.digest('hex');
global.gc();const before=process.memoryUsage(),start=Date.now();
const snapshot=makeSnapshot({schema:'source-prefix',nodes},canonicalStringify);
assert(snapshot.verify(nodes,snapshot.program));
const canonical=canonicalHash(snapshot.program.nodes);assert.equal(canonical.sha256,oracle);
global.gc();const after=process.memoryUsage();
console.log(JSON.stringify({status:'PASS_ORIGINAL_ARCHIVED_CANONICAL_NODE_SNAPSHOT',count:n,bytes:canonical.bytes,
  canonicalSHA256:canonical.sha256,preSnapshotHeap:before.heapUsed,postSnapshotHeap:after.heapUsed,
  snapshotHeapDelta:after.heapUsed-before.heapUsed,rss:after.rss,elapsedMs:Date.now()-start,
  scope:'Archived source node prefix only; no patched native source seal.',release:'HOLD'}));
