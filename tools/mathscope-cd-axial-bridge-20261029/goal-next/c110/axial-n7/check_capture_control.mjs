import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const [original, input, expectedLog] = process.argv.slice(2);
const [source, bytes, log] = await Promise.all([
  readFile(original), readFile(input), readFile(expectedLog, 'utf8'),
]);
const sha = value => createHash('sha256').update(value).digest('hex');
assert.equal(sha(source), 'efebfbcfb124f5bed96bf13435333cb784a0d5cab319303a0244c788ce1bed59');
const {explicitPrimitiveBodyIdentity} = await import(pathToFileURL(original).href);
const payload = JSON.parse(bytes);
const {left,right,nodes,expressionSystems,freeCoordinates,atomicNodes} = payload;
const graph = {nodes,expressionSystems, freeCoordinates: id => freeCoordinates[id]};
const digest = sha(bytes);
const results = log.trim().split(/\r?\n/).map(line => JSON.parse(line));
const history = results.filter(row => row.diagnostic==='fallback-input' && row.inputSHA256===digest);
const expected = results.filter(row => row.diagnostic==='fallback-result' && row.inputSHA256===digest);
assert.equal(history.length, 1);
assert.equal(expected.length, 1);
assert.throws(() => explicitPrimitiveBodyIdentity(graph,left,right,{atomicNodes,maxVisits:history[0].historicalLimit}),
              {code:'RESOURCE_LIMIT'});
const result = explicitPrimitiveBodyIdentity(graph,left,right,
  {atomicNodes,maxVisits:expected[0].visited+1});
for (const key of ['left','right','normalForms','visited','canonicalNodeCount','pass']) {
  assert.deepEqual(result[key], expected[0][key], key);
}
const identical = explicitPrimitiveBodyIdentity(graph,left,left,{atomicNodes});
assert.equal(identical.pass, true);
console.log(JSON.stringify({status:'PASS_ORIGINAL_LIMIT_AND_SAME_EXACT_FALLBACK_RESULT',
  inputSHA256:digest, sourceNodes:nodes.length, limit:history[0].historicalLimit,
  comparisonPass:result.pass, visited:result.visited, coordinatePreserving:true}));
