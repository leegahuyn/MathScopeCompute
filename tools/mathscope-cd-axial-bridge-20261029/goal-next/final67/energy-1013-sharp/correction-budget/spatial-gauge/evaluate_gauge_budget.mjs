/** Replay the actual initialized annulus in the same affine energy scale. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [goal, runtime, historicalPath, polynomialPath, output, directPath, gaugePath] = process.argv.slice(2);
const {load, sourceArithmetic} = await import(pathToFileURL(resolve(goal,
  'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
assert.ok(output && process.argv.length <= 9);
const directPin = '7c86fed21f4659e56c0679be522b2f419180d0bbbbbbafaa61251bf4456c0dbb';
const gaugePin = '4bb22ec082cc23f6bc1211f5e2efd2c7dc416895206e56e09a2f0df8ffca2887';
const gauge = gaugePath ? await load(gaugePath, gaugePin) : null;
const phasePin = 'de87c70b3f9b035ea2cdbca962bf44707988d95343fdb8e32e409596617b5260';
const phaseProof = gaugePath ? await load(resolve(dirname(gaugePath), 'spatial-phase-source.json'), phasePin) : null;
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
const direct = directPath ? await load(directPath, directPin) : null;
if (direct) {
  assert.notEqual(resolve(output), resolve(directPath));
  assert.equal(direct.initializedReplaySHA256, pins.initial);
  assert.equal(direct.status, 'DIRECTED_ORIGINAL_SPATIAL_RADIAL_ATOM');
  assert.equal(direct.sourceSHA256, initial.source.sourceSHA256);
  assert.equal(direct.dyadicOffsetAboveTau0Band, 2);
  const expectedPowers = {'b@0,0,0': [2, 1], 'b@1,0,0': [4, 1], 'b@0,1,0': [3, 0]};
  assert.deepEqual(Object.keys(direct.spatialDirectFactors), Object.keys(expectedPowers));
  for (const [atom, factor] of Object.entries(direct.spatialDirectFactors)) {
    assert.equal(factor.sourceRoot, initial.atoms[atom].sourceRoot);
    assert.deepEqual(factor.reciprocalTau0Power, expectedPowers[atom]);
  }
}
if (gauge) {
  assert.equal(gauge.status, 'DIRECTED_ORIGINAL_30_SPATIAL_GAUGE_FACTORS');
  assert.equal(gauge.initializedReplaySHA256, pins.initial);
  assert.equal(gauge.sourceSHA256, initial.source.sourceSHA256);
  assert.equal(gauge.dyadicOffsetAboveTau0Band, 2);
  assert.equal(Object.keys(gauge.factors).length, 30);
  assert.equal(phaseProof.status, 'VERIFIED_LITERAL_SOURCE_NORMALIZED_SPATIAL_PHASE');
}
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
const partsByVariable = new Map();
if (direct) {
  for (const [atom, factor] of Object.entries(direct.spatialDirectFactors)) {
    const [a, b] = factor.reciprocalTau0Power;
    const exponent = N.add(q(`${a}/2`), N.mul(q(b), h));
    const index = polynomial.variables.indexOf(atom);
    assert.ok(index >= 0);
    partsByVariable.set(index, [
      {value: upperAsPoint(factor.slowBackgroundUpper), a: 0, b: 0, source: 'slow-background'},
      // exp[(ell+17)*exponent*log(2)] = 4^exponent tau0^(-exponent).
      {value: N.mul(upperAsPoint(factor.normalizedMeanSpatialUpper),
        N.exp(N.mul(exponent, N.log(q(4))))), a: -a, b: -b, source: 'initialized-mean'},
    ]);
  }
}
const activeTerms = [];
if (gauge) {
  const factoredPart = (upper, powers, source) => {
    const [a, b] = powers;
    const exponent = N.add(q(`${a}/2`), N.mul(q(b), h));
    return {value: N.mul(upperAsPoint(upper), N.exp(N.mul(exponent, N.log(q(4))))),
      a: -a, b: -b, source};
  };
  for (const [atom, factor] of Object.entries(gauge.factors)) {
    const [x, y, z, t] = atom.split('@')[1].split(',').map(Number);
    assert.equal(t, 0);
    assert.equal(factor.sourceRoot, initial.atoms[atom].sourceRoot);
    assert.deepEqual(factor.meanReciprocalTau0Power, [x+y+z, 1-z]);
    assert.deepEqual(factor.primaryReciprocalTau0Power, [x+y+z, z === 0 ? 0 : -z]);
    assert.deepEqual(factor.adaptedPrimaryReciprocalTau0Power, [x+y+z, 0]);
    const index = polynomial.variables.indexOf(atom);
    assert.ok(index >= 0);
    const parts = [
      {value: upperAsPoint(factor.slowBackgroundUpper), a: 0, b: 0, source: 'slow-background'},
      factoredPart(factor.normalizedMeanSpatialUpper, factor.meanReciprocalTau0Power, 'initialized-mean'),
      factoredPart(factor.normalizedAdaptedPrimaryUpper, factor.adaptedPrimaryReciprocalTau0Power, 'initialized-primary'),
    ].filter(part => N.compareEndpoints(closed(part.value).upper, zero) !== 0);
    partsByVariable.set(index, parts);
  }
}
const evaluateTerm = (term, weightA, component, directFactor) => {
  const monomials = term.powers.map(([index, exponent]) =>
    [directFactor?.index === index ? directFactor.part : inputs[index], exponent]);
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
    upper: closed(value).upper, ...(directFactor ? {directSource: directFactor.part.source,
      directAtom: polynomialVariables[directFactor.index]} : {})});
  return value;
};
const evaluate = (polynomial, weightA, component) => sum(polynomial.flatMap(term => {
  const split = term.powers.filter(([index]) => partsByVariable.has(index));
  if (!split.length) return [evaluateTerm(term, weightA, component)];
  assert.equal(split.length, 1);
  const [[index, degree]] = split;
  assert.equal(degree, 1);
  return partsByVariable.get(index).map(part => evaluateTerm(term, weightA, component, {index, part}));
}));
const polynomialVariables = polynomial.variables;
const velocity = polynomial.outputs.velocity.map((row,i) => evaluate(row, 1, `velocity/${i}`));
const gradient = polynomial.outputs.velocity_gradient.flat().map((row,i) => evaluate(row, 2, `gradient/${i}`));
assert.equal(velocity.length, 3);
assert.equal(gradient.length, 9);
const measureOverTau = N.mul(q(32), Xb);
const energyOverTau = (velocityBounds, gradientBounds) => N.mul(measureOverTau,
  N.add(sum(velocityBounds.map(x => N.pow(x, 2))), N.mul(q(2), sum(gradientBounds.map(x => N.pow(x, 2))))));
const energyPlusDissipationOverTau = energyOverTau(velocity, gradient);
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
let directDiagnostics;
if (direct) {
  const otherTerms = activeTerms.filter(term => term.directSource !== 'initialized-mean');
  const otherBounds = (kind, size) => Array.from({length: size}, (_, i) =>
    sum(otherTerms.filter(term => term.component === `${kind}/${i}`).map(term => upperAsPoint(term.upper))));
  const complementUpper = closed(energyOverTau(otherBounds('velocity', 3), otherBounds('gradient', 9))).upper;
  const largestOtherTerm = otherTerms.reduce((current, candidate) =>
    N.compareEndpoints(candidate.upper, current.upper) === 1 ? candidate : current);
  directDiagnostics = {
    directFactorizationSHA256: directPin,
    otherTerms: otherTerms.length,
    largestOtherTerm,
    complementEnvelopeUpper: complementUpper,
    complementEnvelopeBudgetComparison: N.compareEndpoints(complementUpper, closed(budgetLowerOverTau).lower),
  };
}
let gaugeDiagnostics;
if (gauge) {
  const collect = (rows, kind, size) => Array.from({length: size}, (_, i) =>
    sum(rows.filter(term => term.component === `${kind}/${i}`).map(term => upperAsPoint(term.upper))));
  const componentBounds = ['slow-background', 'initialized-mean', 'initialized-primary'].map(name => {
    const rows = activeTerms.filter(term => term.directSource === name);
    const upper = closed(energyOverTau(collect(rows, 'velocity', 3), collect(rows, 'gradient', 9))).upper;
    const largestTerm = rows.reduce((current, candidate) =>
      N.compareEndpoints(candidate.upper, current.upper) === 1 ? candidate : current);
    return {name, terms: rows.length, upper, largestTerm,
      budgetComparison: N.compareEndpoints(upper, closed(budgetLowerOverTau).lower)};
  });
  gaugeDiagnostics = {gaugeFactorizationSHA256: gaugePin, normalizedPhaseProofSHA256: phasePin, componentBounds};
}
const report = {
  schema: 'MathScope.N7.ActualInitializedAnnularBudgetReadback/1', sourcePins: pins,
  status: comparison <= 0 ? 'VERIFIED_INITIALIZED_ANNULAR_BUDGET' : 'DIRECTED_INITIALIZED_ANNULAR_UPPER_TOO_WIDE',
  comparison, terms: activeTerms.length, largestTerm, velocityUpper: velocity.map(x => closed(x).upper),
  normalizedGradientUpper: gradient.map(x => closed(x).upper),
  twiceEnergyAndDissipationUpperDividedByTau0: closed(energyPlusDissipationOverTau).upper,
  budgetLowerDividedByTau0: closed(budgetLowerOverTau).lower,
  scope: 'Initial field only. Above-budget upper endpoints are inconclusive. Final annular field and N7-06 remain open.',
  arithmetic: N.report(), finalJets: 0, release: 'HOLD',
  ...directDiagnostics,
  ...gaugeDiagnostics,
};
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({status: report.status, comparison, terms: report.terms, largestTerm: largestTerm.factors}));
