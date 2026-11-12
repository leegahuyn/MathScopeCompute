/** Evaluate the differentiated archived mode-one source after its exact cancellations. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {load, sha, sourceArithmetic} from '../../whole-k-annular-initial/numerical/source_arithmetic.mjs';

assert.equal(process.argv.length, 7, 'Use GOAL_NEXT, ARITHMETIC_RUNTIME, REGULAR_C2, RADIAL_C3, OUTPUT.');
const [goal, runtime, regularPath, radialPath, output] = process.argv.slice(2);
assert(![regularPath, radialPath].some(path => resolve(path) === resolve(output)));

const inputs = {
  ledger: ['primary-forced-weights/higher-mode-one/mode-one-valuation.json', '62d2ba143b1257af8d80e2b184851ae4441d30bf197491fe00fd946473b8652c'],
  wave: ['primary-forced-weights/mixed-wave/mixed-wave-c4-numerical.json', 'dc58aa3deb6f3b9fba10eae0f9081f1d6af56d67e2dfc98ce698240da3f86b3e'],
  cross: ['primary-forced-weights/mixed-wave/archived-cross-c2-numerical.json', '9dbeedd3b4b28b1b4770c08cece5bfd6e6002308efec72033911680745720f5a'],
  slow: ['primary-forced-weights/slow-nine/pointwise-norms.json', '1c7b4fdef5a1757f94e4f46b24a4dc1bf6c202c15b22528e1e820ff851dba39c'],
  fixed: ['whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json', '9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'],
  thresholds: ['whole-k-selector-scales/historical-scale-arithmetic-result.json', 'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'],
};
const {ledger, wave, cross, slow, fixed, thresholds} = Object.fromEntries(await Promise.all(
  Object.entries(inputs).map(async ([name, [path, hash]]) => [name, await load(resolve(goal, path), hash)])));
const [regularRaw, radialRaw] = await Promise.all([readFile(regularPath), readFile(radialPath)]);
const regularPin = '282ba94a43e9f9bb116a6d80d8fc3c7f33cc488311b421de337ad07d5e3fb3e4';
const radialPin = '9bb296072c08e05e4062e658cc841f4e49b72a6f18ec722a907a7cef6afcc416';
assert.equal(sha(regularRaw), regularPin);
assert.equal(sha(radialRaw), radialPin);
const regular = JSON.parse(regularRaw);
const radial = JSON.parse(radialRaw);
assert.equal(regular.schema, 'MathScope.ArchivedForcedModeOneRegularC2/1');
assert.deepEqual(regular.source, ledger.archive);
assert.deepEqual(regular.axes, ['R', 'Z', 'T', 'xi', 'v']);
assert.equal(regular.epsilonUnits, 100000);
assert.equal(cross.originalCycle, wave.originalGraphSHA256);
assert.equal(radial.source.graphSHA256, wave.originalGraphSHA256);
assert.equal(radial.source.registrySHA256, wave.registrySHA256);
assert.equal(radial.status, 'VERIFIED_ARCHIVED_RADIAL_B_OVER_EPSILON_C3_DIRECTED_UPPER');
assert.equal(radial.rows.length, 20);
assert.equal(cross.originalFirstForced, regular.source.graphSHA256);
assert.deepEqual(wave.domain, cross.domain);
assert.deepEqual(slow.domain, cross.domain);
assert.deepEqual(radial.domain, cross.domain);
assert.deepEqual(wave.appliedBounds.exponents, {real: 50000, imaginary: 99999, pressure: 100000});
assert.deepEqual(cross.epsilonPowers, {real: 149998, imaginary: 99999});
assert.equal(cross.retainedEnvelope, 'sqrt(zeta) delta_*^(-96) P(v)');
assert.deepEqual(wave.domain.q, ['qBig/64', 'qBig/16']);

const {N} = await sourceArithmetic(runtime, thresholds.sourcePins, 'coarse-upper');
const q = x => N.point(String(x));
const zero = {rational: '0'};
const positive = upper => N.fromClosed({lower: zero, upper});
const upper = value => N.toClosed(value).upper;
const mul = (...xs) => xs.reduce((a, b) => N.mul(a, b), q(1));
const add = (...xs) => xs.reduce((a, b) => N.add(a, b), q(0));
const hosted = id => N.fromClosed(fixed.hostedOriginal[id]);
const R = hosted(216823), r0 = hosted(300171), kappa = hosted(617289);
const Rbound = mul(q(2), R);
const u = mul(q(2), N.inverse(kappa));
const ellPlus17 = add(hosted(617432), q(17));
const length = mul(q(2), r0, add(q(4), N.sqrt(q(2))), N.pow(ellPlus17, 2));
const carrier = add(q(1), mul(add(R, q(1)), N.pow(R, 42), add(q(1),
  mul(u, N.pow(R, 31), N.inverse(mul(q(4), r0))), mul(q('1/2'), u))));
const aFast = mul(q(4), N.pow(R, 3), N.exp(mul(q('1/100000'), hosted(9), ellPlus17, hosted(127))));
const aFactors = [1, 1, 2, 6].map((factorial, j) => mul(aFast, q(4 ** j * factorial), N.pow(Rbound, j)));
const scalar = new Map([
  ['eps', [q(1), 100000, null]], ['k', [q(2), -50000, null]],
  ['R', [Rbound, 0, null]], ['v', [length, 0, null]],
  ...['p', 'pz', 'x0'].map(name => [name, [carrier, 0, null]]),
]);
const background = {F: positive(slow.backgroundC9.F.upper), G: positive(slow.backgroundC9.G.upper), B: positive(radial.uniformC3)};
const index = orders => orders.join('');
const byIndex = new Map(wave.appliedBounds.rows.map(row => [index(row.orders), row]));
assert.equal(byIndex.size, 126);
const bounds = new Map(scalar);
function boundAtom(atom) {
  if (bounds.has(atom)) return bounds.get(atom);
  let result;
  if (/^iR[1-9]$/.test(atom)) {
    result = [N.pow(Rbound, Number(atom.slice(2))), 0, null];
  } else {
    const match = /^([FGBaP]|[LJ][012])@([0-4]{5})$/.exec(atom);
    assert(match, atom);
    const [, family, orders] = match;
    const degree = [...orders].reduce((sum, n) => sum + Number(n), 0);
    if (Object.hasOwn(background, family)) {
      assert(orders.endsWith('00') && degree <= (family === 'B' ? 3 : 4), atom);
      result = [background[family], 0, null];
    } else if (family === 'a') {
      assert(orders.endsWith('0000') && degree <= 3, atom);
      result = [aFactors[degree], -1, null];
    } else {
      const row = byIndex.get(orders);
      assert(row, atom);
      const kind = {L: 'real', J: 'imaginary', P: 'pressure'}[family[0]];
      const root = kind === 'pressure' ? row.pressure : row[kind][Number(family[1])];
      const endpoint = wave.appliedBounds.upperEndpoints[root];
      assert(endpoint, atom);
      result = [positive(endpoint), wave.appliedBounds.exponents[kind], row.poles[kind]];
    }
  }
  bounds.set(atom, result);
  return result;
}

const terms = new Map();
function boundMonomial(atoms) {
  const key = atoms.join('*');
  if (terms.has(key)) return terms.get(key);
  const factors = atoms.map(boundAtom);
  const weighted = factors.filter(([, , pole]) => pole !== null);
  assert.equal(weighted.length, 1, key);
  const result = {
    magnitude: mul(...factors.map(([magnitude]) => magnitude)),
    power: factors.reduce((sum, [, power]) => sum + power, 0),
    pole: weighted[0][2],
  };
  terms.set(key, result);
  return result;
}

const expected = ledger.jets.filter(({total}) => total <= 2);
assert.equal(regular.rows.length, 21);
assert.deepEqual(regular.rows.map(({orders}) => orders), expected.map(({orders}) => orders));
assert.deepEqual(regular.rows.map(({orders}) => orders), cross.derivativeCoverage.outputs.map(({orders}) => orders));
const absolute = x => x < 0n ? -x : x;
const results = regular.rows.map(({orders, components}, rowIndex) => {
  assert.equal(components.length, 3);
  const sourceRow = expected[rowIndex];
  const crossBound = positive(cross.upperByOrder[sourceRow.total]);
  return {
    orders,
    components: components.map((component, j) => {
      assert.equal(new Set(component.map(([atoms]) => atoms.join('*'))).size, component.length);
      return ['real', 'imaginary'].map((name, part) => {
        const partRows = component.filter(row => BigInt(row[part + 1]) !== 0n);
        const count = partRows.reduce((sum, row) => sum + absolute(BigInt(row[part + 1])), 0n);
        const reduced = sourceRow.reduced[j][part], crossPart = sourceRow.meanWave[j][part];
        assert(cross.epsilonPowers[name] >= reduced.minEpsilonUnits);
        assert.equal(partRows.length + crossPart.terms, reduced.terms);
        assert.equal(count + BigInt(crossPart.coefficientSum), BigInt(reduced.coefficientSum));
        const monomials = partRows.map(([atoms]) => boundMonomial(atoms));
        assert(monomials.every(({power}) => power >= reduced.minEpsilonUnits));
        const pole = Math.max(96, ...monomials.map(({pole}) => pole));
        const regularBound = mul(q(count), N.max(monomials.map(({magnitude}) => magnitude)));
        const endpoint = upper(add(regularBound, crossBound));
        assert.equal(N.compareEndpoints(endpoint, zero), 1);
        return {part: name, epsilonPower: reduced.minEpsilonUnits,
          pole, regularTerms: partRows.length, regularUpper: upper(regularBound), upper: endpoint};
      });
    }),
  };
});
const receipt = {
  schema: 'MathScope.ArchivedFirstForcedModeOneC2Numerical/1',
  status: 'CONDITIONAL_DIRECTED_UPPER_ENDPOINTS_FOR_ORIGINAL_ARCHIVED_FIRST_FORCED_MODE_ONE_C2',
  inputPins: {...inputs, regularProgram: regularPin, radial: radialPin},
  profileInputDomain: wave.domain, source: regular.source, denominator: 100000,
  application: {
    nativeArchivedN1: 'b_2 q >= 1 with b_2 qBig = 16, hence q >= qBig/16',
    physicalWholeKInterior: 'q < qBig/16',
    coversPhysicalWholeKInterior: false,
    transferBeyondProfileInputDomainProved: false,
  },
  retainedEnvelope: 'sqrt(zeta) delta_*^(-pole) P(v)',
  derivativeCoverage: {indices: results.length, components: 3, complexParts: 2, distinctMonomials: terms.size},
  scope: 'Archived phase-free fundamental mode after the exact primary-cut subtraction, conditional on the matched operand bounds and original admitted fixed-label pulse and smooth-join premises. No application to the physical whole-K interior follows.',
  results, arithmetic: N.report(),
};
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({status: receipt.status, ...receipt.derivativeCoverage, sha256: sha(await readFile(output))}));
