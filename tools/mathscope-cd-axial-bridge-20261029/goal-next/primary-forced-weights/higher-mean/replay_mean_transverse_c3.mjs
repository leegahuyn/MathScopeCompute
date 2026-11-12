/** Complete the archived zero-longitudinal transverse mean orders through C3. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [goal, hosted, chart, runtime, out] = process.argv.slice(2);
assert.equal(process.argv.length, 7, 'Use GOAL_NEXT HOSTED_GRAPH WHOLE_K_CHART ORIGINAL_RUNTIME OUTPUT.');
const sha = x => createHash('sha256').update(x).digest('hex');
const hashJSON = x => sha(JSON.stringify(x));
const script = resolve(goal, 'primary-forced-weights/higher-mean/replay_mean_longitudinal.mjs');
const text = await readFile(script, 'utf8');
assert.equal(sha(text), '4517767b31c710c8c498caa56818096ca1fd8962eb24471dc28d7b787df67602');
const sink = 'await writeFile(out, JSON.stringify(result, null, 2)';
const exportOriginal = "'rawWhole', 'ci0Inverse', 'through'];";
assert.equal(text.split(sink).length, 2);
assert.equal(text.split(exportOriginal).length, 2);
const names = ['old', 'result', 'P', 'q', 'mul', 'pow', 'plus', 'scale', 'product', 'range', 'choose', 'covJet',
  'covariance', 'leadingCurl', 'imaginaryCurl', 'earlyBounds', 'fixedOperator', 'ci0Inverse', 'T1', 'A1', 'shift', 'through'];
const moduleText = text.split(sink)[0].replace(exportOriginal, "'rawWhole', 'ci0Inverse', 'through', 'velocity'];") +
  `\nexport {${names.join(',')}};`;
const args = process.argv;
let retained;
try {
  process.argv = [args[0], script, goal, hosted, chart, runtime, 'positive-mean-output-disabled'];
  retained = await import('data:text/javascript;base64,' + Buffer.from(moduleText).toString('base64'));
} finally {
  process.argv = args;
}
const {old, result, P, q, mul, pow, plus, scale, product, range, choose, covJet, covariance, leadingCurl,
  imaginaryCurl, earlyBounds, fixedOperator, ci0Inverse, T1, A1, shift, through} = retained;
assert.equal(hashJSON(P.nodes), result.positive.graphSHA256);
assert.equal(result.positive.extensionCount, 10776);
const previousCount = P.nodes.length;

// The only extra source transverse covariance for L^3 of the inverse
// is W_L^6, reached by the radial term in L^5 of the true source.
const localSix = scale(q(1, 2), plus(...range(6).map(a => {
  const real = product(leadingCurl(a, 0), leadingCurl(6 - a, 0));
  const imag = product(imaginaryCurl(a, 0), imaginaryCurl(6 - a, 0));
  return scale(q(choose(6, a)), plus(real, imag));
})));
covariance[0][5] = covJet(5);
covariance[0][6] = localSix.map((x, j) => j >= 7 ? P.zero : mul(q(162), pow(q(4), j + 26), x));
const transverseRows = [1, 2, 3].map(l => {
  const direct = earlyBounds(l, 0);
  const loss = earlyBounds(l + 2, 0);
  const inverse = key => scale(ci0Inverse, plus(scale(q(85, 6), direct[key]), scale(q(85, 216), loss[key])));
  const desired = inverse('axial');
  const slowThrough = 3 - l;
  return {N: 0, L: l, slowThrough, inverseConsumesSourceL: [l, l + 2],
    roots: {betaWithoutEpsilon: through(shift(fixedOperator(T1, desired)), slowThrough),
      v: through(inverse('theta'), slowThrough), gamma: through(plus(desired, fixedOperator(A1, desired)), slowThrough)}};
});
assert(transverseRows.every(row => Object.values(row.roots).flat().every(id => id > 0 && P.nodes[id])));
// The old graph already constructed the complete pure-slow beta and
// gamma order-three operands. It lacks only a valid fresh P,Jz order-three
// row for the direct FiveMap v; in particular do not reuse its zero fill.
const pureSlow = {betaWithoutEpsilon: through(old.velocity.beta, 3), gamma: through(old.velocity.gamma, 3),
  v: through(old.velocity.v, 2)};
assert.deepEqual(pureSlow.betaWithoutEpsilon.slice(0, 3), old.output.roots.meanSpatialInputs.beta.M);
assert.deepEqual(pureSlow.gamma.slice(0, 3), old.output.roots.meanSpatialInputs.gamma.M);
assert.deepEqual(pureSlow.v, old.output.roots.meanSpatialInputs.v.M);

const extension = P.nodes.slice(previousCount);
const output = {status: 'VERIFIED_ARCHIVED_MEAN_TRANSVERSE_C3_CONDITIONAL_POSITIVE_BOUNDS', source: result.source,
  positive: {previousCount, previousSHA256: result.positive.graphSHA256,
    extensionCount: extension.length, extensionSHA256: hashJSON(extension), graphSHA256: hashJSON(P.nodes),
    transverseRows, pureSlow, W_L6: covariance[0][6], extension},
  remainingC2MeanWaveMeanLeaves: {component: 'v', onlyUnboundMeanType: 'pure slow order three of initialized v',
    native: {v: 3614791, temporalV: 1706624, fiveMapV: 3614767, freshP: 3614334, freshJz: 3614420,
      earlyAxialE: 643883, axialPressureDerivative: 643849, actualWrzZZ: 643048},
    route: 'fresh P,Jz C3 need Temporal beta C4; original T1 C5 is verified separately. E_z slow5 needs Wrz slow7 in the original shifted pressure, including the corresponding L^2 Fourier-loss input. Existing local potential slow7 provides complete curl only through slow6.'},
  finalJets: '0/67', release: 'HOLD'};
await writeFile(out, JSON.stringify(output, null, 2) + '\n');
console.log(`PASS archived N=0 mean L1–L3 and pure slow beta/gamma C3; ${extension.length} additional records.`);
