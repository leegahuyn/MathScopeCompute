/** Numerical intervals for the original pre-localization slow field. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {load, sha, sourceArithmetic} from '../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [tree, traceFile, historicalFile, slowFile, thresholdFile, out, method] = process.argv.slice(2);
assert(tree && traceFile && historicalFile && slowFile && thresholdFile && out);

const trace = await load(traceFile, 'f9e24dca75ac06a914846a34f3a31cadfbced5a29684df7023e050875441726d');
const historical = await load(historicalFile, '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0');
const slow = await load(slowFile, '3e3bd5d76fcdac202d2d4da51ca490ddc8dd5d020c1a57aed6a2ecd7985a3a69');
const thresholds = await load(thresholdFile, 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
assert.deepEqual(trace.definitions, historical.definitions);
assert.equal(thresholds.inputSHA256, '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0');
assert.equal(trace.highNormReceiptSHA256, slow.pins.high);
assert.equal(trace.leadingProgramSHA256, slow.sourceNormFactors.L_FGraphSHA256);
assert.equal(trace.main.roots.L_U, slow.sourceNormFactors.L_U);
assert.equal(trace.leadingF.roots.L_F, slow.sourceNormFactors.L_F);
assert.deepEqual(Object.keys(trace.main.roots).filter(x => x.startsWith('H_')).sort(),
  Object.values(slow.sourceNormFactors.unabsorbed).map(x => 'H_' + x).sort());

const {N, evaluateClosedArithmeticDefinitions, tracedArithmeticEvaluator} =
  await sourceArithmetic(tree, thresholds.sourcePins, method);
const names = [...new Set([...trace.main.sourceParameters, ...trace.leadingF.sourceParameters])];
const parameters = evaluateClosedArithmeticDefinitions(trace.definitions, N, {names}).values;
const B = N.fromClosed(thresholds.thresholds['10']);
const logInvTau0 = N.add(B, N.log(N.point('32')));
assert.equal(N.compareEndpoints(N.toClosed(logInvTau0).lower, {rational: '0'}), 1);

const result = {
  schema: 'MathScope.N7.NumericalAnnularSlowJetIntervals/1',
  status: 'INCOMPLETE',
  scope: 'Original pre-localization slow field on the certified annulus and whole-K time slab.',
  traceSHA256: sha(await readFile(traceFile)),
  logInvTau0: N.toClosed(logInvTau0),
  ...(method ? {arithmeticMethod: method} : {}),
  factors: {}, atoms: {}, finalJets: '0/67', release: 'HOLD',
};
async function save() {
  result.arithmetic = N.report();
  await writeFile(out, JSON.stringify(result, null, 2) + '\n');
}
await save();

const boundaryIds = trace.main.nonArithmeticBoundaries.map(row => row.id);
assert.deepEqual(boundaryIds, [239, 257, 275]);
const boundaries = new Map(boundaryIds.map(id => [id, N.fromClosed(historical.boundaryIntervals[id])]));
const main = tracedArithmeticEvaluator(trace.main, N, {parameters, boundaries});
const leading = tracedArithmeticEvaluator(trace.leadingF, N, {parameters});
const norms = new Map();
for (const name of ['h', 'Rstar', 'K', 'L_U', 'L_F', 'H_212882', 'H_212886', 'H_212893', 'H_212905']) {
  const useLeading = name === 'L_F';
  const root = (useLeading ? trace.leadingF : trace.main).roots[name];
  const value = (useLeading ? leading : main).value(root);
  const interval = N.toClosed(value);
  assert.equal(N.compareEndpoints(interval.lower, {rational: '0'}), 1, name);
  norms.set(name, value);
  result.factors[name] = {root, interval};
  await save();
  console.log('PASS source norm arithmetic', name, root);
}

const h = norms.get('h');
const Rstar = norms.get('Rstar');
const factorValues = new Map([
  ['1', N.one()], ['L_U', norms.get('L_U')], ['L_F^2', N.pow(norms.get('L_F'), 2)], ['K', norms.get('K')],
]);
function factor(name) {
  if (factorValues.has(name)) return factorValues.get(name);
  const match = /^(?:(H_\d+)\*)?tau0\^\((\d+)\*h\)$/.exec(name);
  assert(match, name);
  const [, norm, order] = match;
  const decay = N.exp(N.neg(N.mul(N.mul(N.point(order), h), logInvTau0)));
  const value = norm ? N.mul(norms.get(norm), decay) : decay;
  factorValues.set(name, value);
  return value;
}

function affineH(text) {
  let a = N.zero();
  let b = N.zero();
  const terms = text.replaceAll(' ', '').match(/[+-]?[^+-]+/g);
  assert(terms && terms.join('') === text.replaceAll(' ', ''), text);
  for (const term of terms) {
    if (term.endsWith('h')) {
      const coefficient = term.slice(0, -1).replace(/\*$/, '');
      const signed = coefficient === '' || coefficient === '+' ? '1' : coefficient === '-' ? '-1' : coefficient;
      b = N.add(b, N.point(signed));
    } else {
      a = N.add(a, N.point(term));
    }
  }
  return N.add(a, N.mul(b, h));
}

let zeroAtoms = 0;
for (const [name, row] of Object.entries(slow.slowFieldAtomIntervals)) {
  if (row.exactInterval) {
    assert.deepEqual(row.exactInterval, ['0', '0']);
    result.atoms[name] = N.toClosed(N.zero());
    zeroAtoms++;
    continue;
  }
  let normalized = N.zero();
  for (const {coefficient, RstarPower, factor: key} of [...row.leadingTerms, ...row.positiveTerms]) {
    const term = N.mul(N.mul(N.point(coefficient), N.pow(Rstar, RstarPower)), factor(key));
    normalized = N.add(normalized, term);
  }
  const physical = N.mul(normalized, N.exp(N.mul(affineH(row.tau0ReciprocalPower), logInvTau0)));
  const interval = N.toClosed(physical);
  assert.equal(N.compareEndpoints(interval.upper, {rational: '0'}), 1, name);
  result.atoms[name] = {
    lower: N.toClosed(N.neg(physical)).lower, upper: interval.upper,
    normalizedUpper: N.toClosed(normalized).upper, tau0ReciprocalPower: row.tau0ReciprocalPower,
  };
}
assert.equal(Object.keys(result.atoms).length, 67);
assert.equal(zeroAtoms, 19);
result.status = 'VERIFIED_ORIGINAL_ANNULAR_SLOW_FIELD_NUMERICAL_INTERVALS';
result.verifiedSlowAtoms = 67;
result.exactZeroAtoms = zeroAtoms;
result.trace = {main: main.report(), leading: leading.report()};
await save();
console.log('PASS original slow-field intervals', 67, 'exact zero', zeroAtoms);
