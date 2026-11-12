import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [tree, out] = process.argv.slice(2);
assert(tree && out);
const source = name => import(pathToFileURL(resolve(tree, 'research-ide/mathscope-m2/navier', name)).href);
const [{actualLeadingAllOrderJets}, {traceExactArithmeticDependencies}] = await Promise.all([
  source('actual-leading-all-order-jets.mjs'),
  source('actual-common-selection-arithmetic-trace.mjs'),
]);
const data = actualLeadingAllOrderJets({radialOrder: 10, etaOrder: 10});
assert(data.pass && data.checks.every(row => row.pass));
assert.equal(data.derivativeConvention, 'ordinary physical X and ordinary eta');
assert.deepEqual(data.bounds.F0active.domain.X, ['0', 'Xplus=Xv*exp(1)']);
assert.deepEqual(data.bounds.U0.domain, {X: ['0', 'infinity'], eta: ['-1', '1'], exactZeroAfter: 'Xv'});
assert.deepEqual(data.bounds.F0active.domain.eta, ['-1', '1']);
const roots = {F0Active: data.bounds.F0active.root, U0Global: data.bounds.U0.root};
const trace = traceExactArithmeticDependencies({nodes: data.normProgram.nodes}, roots);
assert.deepEqual(trace.nonArithmeticBoundaries, []);
const receipt = {
  schema: 'MathScope.N7.LeadingActiveC10Arithmetic/1', sourceProfile: data.parameterExpressionSHA256,
  sourceFunctions: data.sourceFunctionIdentity, derivativeConvention: data.derivativeConvention,
  requested: {radialOrder: 10, etaOrder: 10}, bounds: data.bounds, trace, release: 'HOLD',
};
await writeFile(out, JSON.stringify(receipt) + '\n');
console.log('PASS original active leading F0 and global U0 through C10', trace.nodeCount);
