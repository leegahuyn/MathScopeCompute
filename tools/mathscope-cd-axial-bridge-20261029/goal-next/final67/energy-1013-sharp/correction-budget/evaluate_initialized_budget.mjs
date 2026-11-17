/** Replay the actual initialized annulus in the same affine energy scale. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sourceArithmetic} from '../../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

const [goal, runtime, historicalPath, polynomialPath, output] = process.argv.slice(2);
assert.ok(output);
const pins = {
  thresholds: 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf',
  historical: '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0',
  fixed: '9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c',
  background: '4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966',
  initial: '9dcc5ad21169fe7462bd76f588d994126f0beaef5fdfc4e6ab4657e056371b34',
  polynomial: '1f02933c4a09f96efca99188fba2731526df81459deb1deb3c249433b73295f7',
};
const files = {
  thresholds: resolve(goal, 'whole-k-selector-scales/historical-scale-arithmetic-result.json'),
  historical: historicalPath, polynomial: polynomialPath,
  fixed: resolve(goal, 'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json'),
  background: resolve(goal, 'whole-k-annular-wrz-norm/numerical/background-c8-complete.json'),
  initial: resolve(goal, 'whole-k-annular-initial/numerical/stage-zero-complete-numerical.json'),
};
const {thresholds, historical, fixed, background, initial, polynomial} = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, file]) => [key, await load(file, pins[key])])),
);
assert.equal(initial.status, 'VERIFIED_ALL_67_ORIGINAL_INITIALIZED_STAGE_ZERO_NUMERICAL_INTERVALS');
assert.equal(polynomial.schema, 'MathScope.Annular.ExactOriginal67Plus13LocalizationPolynomial/1');
assert.equal(Object.keys(initial.atoms).length, 67);
assert.ok(17n*16n < 33n*9n); // Physical |eta|² <=17/33 < (3/4)^2.
const {N, evaluateClosedArithmeticDefinitions} = await sourceArithmetic(runtime, thresholds.sourcePins, 'coarse-upper');
const q = value => N.point(String(value));
const closed = value => N.toClosed(value);
const zero = {rational: '0'};
const upperAsPoint = value => N.fromClosed({lower: value, upper: value});
const sum = values => values.reduce((a, b) => N.add(a, b), N.zero());
const {values} = evaluateClosedArithmeticDefinitions(historical.definitions, N, {names: ['h']});
const h = values.get('h'), Xb = N.fromClosed(background.Xb);
const ell = N.fromClosed(fixed.hostedOriginal[617432]);
const logTau = N.neg(N.mul(N.add(ell, q(15)), N.log(q(2))));
const hLogTau = N.mul(h, logTau);
const tpow = (a, b) => N.exp(N.add(N.mul(q(`${a}/2`), logTau), N.mul(q(b), hLogTau)));
assert.equal(N.compareEndpoints(closed(h).lower, zero), 1);
assert.equal(N.compareEndpoints(closed(h).upper, {rational: '1/64'}), -1);

const transverse = N.mul(q(2), N.sqrt(Xb));
const constants = [
  [1, 0, 0], [20, -1, 1], [692, -2, 2],
]; // At most two axial derivatives appear in the spatial energy stencil.
const inputs = polynomial.variables.map((name, index) => {
  if (index < 2) return {value: transverse, a: 1, b: 0};
  if (name.startsWith('C@')) {
    const [x, z, t] = name.slice(2).split(',').map(Number);
    if (x !== 0) return {zero: true};
    if (t !== 0 || !constants[z]) return {unsupported: true};
    const [v, a, b] = constants[z];
    return {value: q(v), a, b};
  }
  const atom = initial.atoms[name];
  assert.ok(atom, name);
  return {value: upperAsPoint(atom.upper), a: 0, b: 0};
});
const activeTerms = [];
const evaluate = (polynomial, weightA, component) => sum(polynomial.map(term => {
  const monomials = term.powers.map(([index, exponent]) => [inputs[index], exponent]);
  assert.ok(monomials.every(([item]) => !item.unsupported), 'The energy stencil must be spatial.');
  if (monomials.some(([item]) => item.zero)) return N.zero();
  let a = weightA, b = 1;
  let coefficient = q(term.coefficient.replace(/^-/, ''));
  for (const [item, exponent] of monomials) {
    a += item.a * exponent;
    b += item.b * exponent;
    coefficient = N.mul(coefficient, N.pow(item.value, exponent));
  }
  const value = N.mul(coefficient, tpow(a, b));
  activeTerms.push({component, tauExponent: [a,b], factors: term.powers.map(([id,k]) => [polynomialVariables[id],k]),
    upper: closed(value).upper});
  return value;
}));
const polynomialVariables = polynomial.variables;
const velocity = polynomial.outputs.velocity.map((row,i) => evaluate(row, 1, `velocity/${i}`));
const gradient = polynomial.outputs.velocity_gradient.flat().map((row,i) => evaluate(row, 2, `gradient/${i}`));
assert.equal(velocity.length, 3);
assert.equal(gradient.length, 9);
const measureOverTau = N.mul(q(32), Xb);
const energyPlusDissipationOverTau = N.mul(measureOverTau,
  N.add(sum(velocity.map(x => N.pow(x, 2))), N.mul(q(2), sum(gradient.map(x => N.pow(x, 2))))));
const fourA = N.add(q(2), N.mul(q(4), h));
const budgetLowerOverTau = N.mul(q(`1/${1n<<26n}`),
  N.exp(N.sub(N.sub(N.mul(q(-2), hLogTau), N.mul(fourA, N.log(Xb))), N.log(fourA))));
const comparison = N.compareEndpoints(closed(energyPlusDissipationOverTau).upper,
  closed(budgetLowerOverTau).lower);
assert.notEqual(comparison, null);
const largestTerm = activeTerms.reduce((current, candidate) => {
  const order = N.compareEndpoints(candidate.upper, current.upper);
  assert.notEqual(order, null);
  return order > 0 ? candidate : current;
});
const report = {
  schema: 'MathScope.N7.ActualInitializedAnnularBudgetReadback/1', sourcePins: pins,
  status: comparison <= 0 ? 'VERIFIED_INITIALIZED_ANNULAR_BUDGET' : 'DIRECTED_INITIALIZED_ANNULAR_UPPER_TOO_WIDE',
  comparison, terms: activeTerms.length, largestTerm, velocityUpper: velocity.map(x => closed(x).upper),
  normalizedGradientUpper: gradient.map(x => closed(x).upper),
  twiceEnergyAndDissipationUpperDividedByTau0: closed(energyPlusDissipationOverTau).upper,
  budgetLowerDividedByTau0: closed(budgetLowerOverTau).lower,
  scope: 'Initial field only. Above-budget upper endpoints are inconclusive. Final annular field and N7-06 remain open.',
  arithmetic: N.report(), finalJets: 0, release: 'HOLD',
};
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({status: report.status, comparison, terms: report.terms, largestTerm: largestTerm.factors}));
