import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [baseline,compact]=process.argv.slice(2);assert(baseline&&compact);
const [a,b]=await Promise.all([baseline,compact].map(async p=>JSON.parse(await readFile(p))));
assert.equal(a.mode,'baseline');assert.equal(b.mode,'compact');
for(const k of ['status','nodes','graphSHA256','programSHA256','rowsSHA256','rootsSHA256','checks','sourceGraphMutationRejected','normRowMutationRejected','release'])
  assert.deepEqual(a[k],b[k],k);
assert.equal(a.status,'PASS_UNCHANGED_NATIVE_C2_ISSUER_AND_WEAKMAP_SEAL');
assert(a.checks.every(x=>x.pass));assert(a.sourceGraphMutationRejected&&a.normRowMutationRejected);
console.log(JSON.stringify({status:'PASS_ORIGINAL_PRIVATE_C2_SEAL_AND_GRAPH_PARITY',nodes:a.nodes,
  graphSHA256:a.graphSHA256,programSHA256:a.programSHA256,checks:a.checks.length,
  sourceGraphMutationRejected:true,normRowMutationRejected:true,scope:'C2 only; no complete C8, M3 gate or live-family result',release:'HOLD'}));
