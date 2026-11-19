import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime, output] = process.argv.slice(2);
assert.ok(runtime && output, 'original runtime and new receipt are required');
const compiler = resolve(runtime, 'research-ide/mathscope-m2/navier/actual-residual-order-induction-source.mjs');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const compilerSHA = sha(await readFile(compiler));
assert.equal(compilerSHA, '30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047');
const {prepareActualOrderInduction, assertActualOrderInduction} = await import(pathToFileURL(compiler).href);
const prepared = prepareActualOrderInduction({order: 3, maxNodes: 3_000_000});
assert.ok(assertActualOrderInduction(prepared));
assert.equal(prepared.G.nodes.length, 123870);
const hash = createHash('sha256');
for (const node of prepared.G.nodes) hash.update(JSON.stringify(node) + '\n');
const prefixSHA = hash.digest('hex');
assert.equal(prefixSHA, 'ae216216f5076bd6d8c4d5a61f34af1979141af5f13b591c6de371bc0a672d9e');

const prefixRows = prepared.records.slice(0, 4).map(({global}, order) => ({
  order, F: global.F, G: global.U,
}));
assert.deepEqual(prefixRows.map(row => row.order), [0, 1, 2, 3]);
const coordinates = {X: prepared.bootstrap.constants.X, eta: prepared.bootstrap.constants.eta};
assert.deepEqual(coordinates, {X: 4756, eta: 2});
const result = {
  schema: 'MathScope.C89.OriginalBackgroundCoefficientRoles/1',
  compilerSHA, prefixSHA, sourceCount: prepared.G.nodes.length,
  parameterExpressionSHA: prepared.program.parameterExpressionSHA256,
  coordinates, prefixRows,
};
await writeFile(output, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(result));
