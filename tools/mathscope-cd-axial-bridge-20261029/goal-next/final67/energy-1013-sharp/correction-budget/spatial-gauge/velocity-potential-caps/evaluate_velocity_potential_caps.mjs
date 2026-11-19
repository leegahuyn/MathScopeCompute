/** Evaluate the four sufficient first-derivative thresholds on the original scale. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [goal, runtime, historical, output] = process.argv.slice(2);
assert.equal(process.argv.length, 6);
const common = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/';
const helper = resolve(goal, common + 'evaluate_mean_bulk_energy.mjs');
const helperPin = '61d4d23e7ec003206758c861a2e464791730dc6f14b648d3b5eb721418f59f7b';
assert.equal(createHash('sha256').update(await readFile(helper)).digest('hex'), helperPin);
const {prepareMeanBulkEnergy} = await import(pathToFileURL(helper).href);
const {N, q, closed, hLogTau, Xb, load, pins} = await prepareMeanBulkEnergy(
  goal, runtime, historical, resolve(goal, common + 'weighted-velocity-coefficients.json'),
);
const kPin = '0e1984e6f872e9a167b7920d31a55b4888a807c359a0c38dbff9f8f8af5f4acb';
const kReceipt = await load(resolve(goal,
  'primary-forced-join/active-n3-c5-binding/norm-leading/n3-whole-k.json'), kPin);
const comparison = (lhs, rhs) => {
  const result = N.compareEndpoints(lhs, rhs);
  assert.ok([-1, 0, 1].includes(result), 'directed comparison is inconclusive');
  return result;
};
const logXb = N.log(Xb), log2 = N.log(q(2)), log480 = N.log(q(480));
const H = N.neg(hLogTau);
const dTimes120 = N.exp(N.add(hLogTau, N.log(q(120))));
assert.equal(comparison(closed(dTimes120).upper, {rational: '1'}), -1);
const rawUpper = kReceipt.enclosure.upper;
const rawUpperInterval = N.fromClosed({lower: rawUpper, upper: rawUpper});
const logKUpper = closed(N.log(rawUpperInterval)).upper;
const stages = [1, 2, 3, 4].map(stage => {
  const base = N.sub(N.sub(N.mul(q(stage + '/10'), H), N.mul(q(2), logXb)), N.mul(q(21), log2));
  const quarter = N.sub(base, N.mul(q(2), log2));
  const gauge = N.sub(base, log480);
  const logCaps = {
    U0: N.add(quarter, N.mul(q('1/2'), H)),
    U1: quarter,
    A0: N.add(gauge, N.mul(q(2), H)),
    A1: N.add(gauge, N.mul(q('3/2'), H)),
  };
  const caps = Object.fromEntries(Object.entries(logCaps).map(([name, logCap]) => {
    const endpoint = closed(logCap).lower;
    assert.equal(comparison(endpoint, {rational: '0'}), 1);
    return [name, {log: closed(logCap), value: closed(N.exp(logCap)),
      comparisonOfBenchmarkLogKUpperToCapLower: comparison(logKUpper, endpoint)}];
  }));
  return {stage, caps, actualWeightedUniformEndpointsCertified: 0};
});

const report = {
  schema: 'MathScope.N7.DirectedUncutVelocityPotentialCaps/1',
  status: 'VERIFIED_EXACT_SOURCE_SCALE_FOUR_WEIGHTED_AMPLITUDE_THRESHOLDS',
  sourcePins: {helper: helperPin, ...pins, benchmarkK: kPin},
  hLogTau: closed(hLogTau), Xb: closed(Xb), dTimes120: closed(dTimes120),
  dTimes120StrictlyBelowOne: true, stages,
  benchmarkInterpretation: 'Only a scale comparison to a pre-existing coarse K endpoint. That endpoint has not been identified as a sharp-weighted bound for any whole correction component.',
  scope: 'Sufficient caps only. No numerical correction enclosure has been assigned.',
  N706: 'OPEN', N805: 'OPEN', finalJets: 0, release: 'HOLD',
  arithmetic: N.report(),
};
await writeFile(output, JSON.stringify(report, null, 2) + '\n', {flag:'wx'});
console.log(JSON.stringify(stages.map(({stage, caps}) => [stage,
  Object.fromEntries(Object.entries(caps).map(([name, x]) => [name, x.comparisonOfBenchmarkLogKUpperToCapLower]))])));
