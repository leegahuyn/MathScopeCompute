/** Exact source-tail comparison and all supported derivative orders. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const [runtime, reachedPath, rangePath, sourceProofPath, outputPath] = process.argv.slice(2);
assert.equal(process.argv.length, 7);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const readPinned = async (path, pin) => {
  const bytes = await readFile(path);
  assert.equal(sha(bytes), pin, path);
  return bytes;
};
const pins = {
  tail: 'fa569df96f7950e4c1d908405d8a30bcb73088b1e2d3af7a0baa047d4b2a3df0',
  profile: '4578d632c3da8c6994557bcb4e78babf4dcede1e4893252c6a8ae2e342426133',
  profileData: 'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a',
  arithmetic: '5b889de71fdb464e1ad0b1b17a4d5d0a7d6fb9a17a9a3e57379fd566cfd8fbea',
  numerics: 'a406401c5a0e024e94d58cce0d7e6bdaa6b35488f22fd0ead4bf87222416c62c',
  reached: '1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc',
  range: '90cd613bc4d94bba7205e189f2410b92f9e509e820ee750e0026cb28e8152e24',
  proof: '1923770e721cd73d569150eec19eb8cf78a645b86207b6be90cb97aabb547920',
};
const imports = {
  tail: resolve(runtime, 'mathscope-m2/navier/actual-continuation-exact-tail.mjs'),
  profile: resolve(runtime, 'mathscope-m2/navier/source-profile.mjs'),
  profileData: resolve(runtime, 'mathscope-m2/navier/source-profile-data.mjs'),
  arithmetic: resolve(runtime, 'mathscope-m2/navier/actual-continuation-arithmetic.mjs'),
  numerics: resolve(runtime, 'mathscope-m1/navier/numerics.mjs'),
};
await Promise.all(Object.entries(imports).map(([key, path]) => readPinned(path, pins[key])));
const reached = JSON.parse(await readPinned(reachedPath, pins.reached));
const range = JSON.parse(await readPinned(rangePath, pins.range));
const proof = (await readPinned(sourceProofPath, pins.proof)).toString();
assert(proof.includes('all fixed derivative orders') && proof.includes('same infinite solution'));
assert.equal(reached.calls.length, 597);
assert.equal(range.newly.length, reached.calls.length);
assert.deepEqual(range.newly.map(x => x.id), reached.calls.map(x => x.id));
const census = new Map();
for (const row of reached.calls) {
  assert(Number.isSafeInteger(row.radialOrder) && row.radialOrder >= 0 && row.radialOrder <= 12);
  assert(Number.isSafeInteger(row.etaOrder) && row.etaOrder >= 0 && row.etaOrder <= 12);
  const key = row.radialOrder + ',' + row.etaOrder;
  census.set(key, (census.get(key) ?? 0) + 1);
}
const {actualNaturalScaledTail, actualNaturalRefinementModulus} = await import(pathToFileURL(imports.tail));
const parse = text => {
  const [numerator, denominator = '1'] = text.split('/');
  return [BigInt(numerator), BigInt(denominator)];
};
const tailRows = [];
for (const degree of [256, 512]) {
  for (let k = 0; k <= 12; k++) {
    for (let m = 0; m <= 12; m++) {
      const tail = actualNaturalScaledTail({degree, Y: '5', radialOrder: k, etaOrder: m});
      const [numerator, denominator] = parse(tail.scaledTailUpper);
      const [ratioNumerator, ratioDenominator] = parse(tail.ratioUpper);
      assert(0n <= numerator && numerator * (2n ** BigInt(degree)) <= denominator);
      assert(0n <= ratioNumerator && ratioNumerator < ratioDenominator);
      tailRows.push({degree, radialOrder: k, etaOrder: m, tailAtMostTwoToMinusDegree: true});
    }
  }
}
let originalRejectsEtaFive = false;
try {
  actualNaturalRefinementModulus({bits: 128, radialOrder: 1, etaOrder: 5});
} catch (error) {
  assert.equal(error.code, 'RESOURCE_LIMIT');
  originalRejectsEtaFive = true;
}
assert(originalRejectsEtaFive);
const induction = {
  baseIndex: 257,
  degree: 24,
  basePolynomialBelowTwoPower: 269n ** 24n < 2n ** 257n,
  successivePolynomialRatioBelowTwo: 270n ** 24n < 2n * 269n ** 24n,
  failedSmallBaseControl: 13n ** 24n > 2n,
  fourMillionBelowTwoPower22: 4000000n < 2n ** 22n,
  exponentialConversionSlack: 128040 + 282 < 131072,
};
assert(Object.values(induction).slice(2).every(Boolean));
assert(256n * 10n < 41n * 63n); // Original Y bound 256/63 is inside 41/10 < 5.
const orderRows = [...census].map(([key, calls]) => {
  const [k, m] = key.split(',').map(Number);
  return {radialOrder: k, etaOrder: m, calls,
    retainedDegreeFormula: 'ceil(' + ((m + 1) * 131072) + '*T)+bits',
    sourceSimpleModulusSupported: k <= 4 && m <= 4};
});
const result = {
  schema: 'MathScope.Y.ActualN4NaturalDerivativeTailModulus/1',
  status: 'CONDITIONAL_ORIGINAL_NATURAL_ALL_SUPPORTED_DERIVATIVE_MODULUS',
  pins, sourceProfile: 'same-profile-2026-10-10.3', sourceNaturalCalls: 597,
  sourceOrderCensus: orderRows,
  previouslyUnsupportedSourceCalls: orderRows.filter(row => !row.sourceSimpleModulusSupported)
    .reduce((sum, row) => sum + row.calls, 0),
  maximumRadialOrder: 3, maximumEtaOrder: 5, induction, originalRejectsEtaFive,
  originalTailComparisons: {degrees: [256, 512], derivativeGrid: [13, 13], exactComparisons: tailRows.length,
    allTailAtMostTwoToMinusDegree: tailRows.every(row => row.tailAtMostTwoToMinusDegree)},
  modulus: {domain: '0<=Y<=5 and eta in the admitted real coefficient strip',
    supportedRadialOrder: [0, 12], supportedEtaOrder: [0, 12],
    degree: 'N=ceil((m+1)*131072*T)+bits', bits: 'any positive integer', sourceT: 'T>=1',
    lowerDegree: 256, tail: 'Q*rho^(-m)*2^(-N)<=2^(-bits)',
    premises: ['same original nonlinear B_rho fixed point and coefficient bound ||(Phi,u)||_rho<=Q',
      'rho^(-1)<=Q', 'Q=2^260*4000000*exp(64020*T)<2^(131072*T)',
      'source finite coefficient producer equals the coefficients of that same limit']},
  proof: [
    'For n>=257 and 0<=k,m<=12, m!*binomial(n+m,m)*(n)_k <= (n+12)^(m+k) <= (n+12)^24.',
    'At n=257, 269^24<2^257. For every later n, ((n+13)/(n+12))^24 <= (270/269)^24<2, so induction gives (n+12)^24<=2^n.',
    'The original coefficient norm majorizes every omitted derivative term by Q*rho^(-m)*2^n*5^(n-k)/20^n <= Q*rho^(-m)*2^(-n).',
    'Summing n>N gives Q*rho^(-m)*2^(-N). N>=256 and rho^(-1)<=Q give tail <= Q^(m+1)*2^(-N).',
    'The pinned source Q logarithmic bound and the stated symbolic degree imply the last quantity is <=2^(-bits).',
  ],
  scope: 'Exact extension of the original sufficient radial tail modulus, conditional on the original nonlinear coefficient-space theorem and actual argument domain. The source calls with eta order five are covered by the formula. It does not evaluate their finite coefficients, prove every native frame physical, construct Picard/Forced limit semantics, or certify final fields.',
  actualDegreeMaterialized: false, finiteCoefficientEvaluationErrorsIncluded: false,
  globalY: 'OPEN', finalJets: 0, release: 'HOLD',
};
await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({status: result.status, sourceNaturalCalls: result.sourceNaturalCalls,
  previouslyUnsupportedSourceCalls: result.previouslyUnsupportedSourceCalls,
  exactNativeTailComparisons: tailRows.length, originalRejectsEtaFive}));
