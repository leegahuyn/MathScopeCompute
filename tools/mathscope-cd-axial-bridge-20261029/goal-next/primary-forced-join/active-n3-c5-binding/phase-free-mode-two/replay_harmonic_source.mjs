/** Replay the original harmonic PDE on exact rational amplitude jets. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [original, output] = process.argv.slice(2);
assert(original && output && process.argv.length === 4);
const sources = {
  harmonic: ['mathscope-m3/navier/source-harmonic-assembly.mjs',
    '339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20'],
  graph: ['mathscope-m2/navier/actual-global-source-expressions.mjs',
    'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3'],
  rational: ['mathscope-m3/navier/source-quadratic-identity.mjs',
    '696ff2202a9fb58e4de791a264fa23321fd81774f1f1a4f8336803d6a10b5bcd'],
};
const sourceSHA256 = Object.fromEntries(Object.keys(sources).map(name => [name, null]));
const load = async (name) => {
  const [relative, expected] = sources[name];
  const location = resolve(original, relative);
  const bytes = await readFile(location);
  const digest = createHash('sha256').update(bytes).digest('hex');
  assert.equal(digest, expected, name);
  sourceSHA256[name] = digest;
  return import(pathToFileURL(location).href);
};
const [{exactAngularHarmonicPDE, originalCylindricalDifferentialOperators, exactHarmonicComplexAlgebra},
  {ActualSourceExpressions}, {createQuadraticSourceVerifier}] =
  await Promise.all(['harmonic', 'graph', 'rational'].map(load));

// The fixtures use only the rational expression fragment. Its coordinates
// are exactly the leaves of the arithmetic operand graph.
class RationalFixtureGraph extends ActualSourceExpressions {
  freeCoordinates(id) {
    const {op, args} = this.nodes[id];
    if (op === 'coordinate') return new Set([id]);
    if (op === 'rational') return new Set();
    if (op === 'add' || op === 'multiply') {
      return new Set(args.flatMap(x => [...this.freeCoordinates(x)]));
    }
    assert(['inverse', 'integer_power'].includes(op), op);
    return this.freeCoordinates(args[0]);
  }
}

const G = new RationalFixtureGraph();
const C = exactHarmonicComplexAlgebra(G);
const {add, mul, sub, pow, inv, q} = Object.fromEntries(
  ['add', 'mul', 'sub', 'pow', 'inv', 'q'].map(name => [name, G[name].bind(G)]),
);
const [R, Z, T, theta, Y1, Y2] =
  ['R', 'Z', 'T', 'theta', 'Y1', 'Y2'].map(name => G.var(name));
const epsilon = q(3, 5), k = q(7), inverseRadius = inv(R);
const geometry = {
  R, Z, T, theta, epsilon, radialFast: add(pow(R, 2), Y1),
  Y: [Y1, Y2], vr: [q(2, 3), q(-1, 4)], vt: [q(1, 3), q(2, 5)], ci: q(3, 4),
};
const D = originalCylindricalDifferentialOperators(G, geometry);
const phase = add(theta, mul(R, Z), mul(Y1, Y2), mul(T, Y2));
const phaseGradient = [D.Dr(phase), D.angular(phase), D.Dz(phase)];
const dr = value => C.derivative(value, D.Dr);
const dz = value => C.derivative(value, D.Dz);
const withPhase = (value, derivative, normal) =>
  C.add(derivative(value), C.imaginary(mul(k, normal), value));
const angular = value => C.imaginary(mul(k, phaseGradient[1]), value);
const hradial = value => withPhase(value, dr, phaseGradient[0]);
const haxial = value => withPhase(value, dz, phaseGradient[2]);
const curl = ([r, t, z]) => [
  C.sub(angular(z), haxial(t)),
  C.sub(haxial(r), hradial(z)),
  C.sub(C.add(hradial(t), C.scale(inverseRadius, t)), angular(r)),
];
const velocity = [
  C.value(add(mul(R, Y1), Z), add(mul(Z, Y2), T)),
  C.value(add(mul(R, Z), Y2), mul(Y2, T)),
  C.value(add(pow(Z, 2), Y1), add(mul(R, T), Y2)),
];
const pressure = C.value(mul(R, Z), Y1);
const verifier = createQuadraticSourceVerifier(G, {maxTerms: 180000});
const parts = ['real', 'imaginary'];
const checkPair = (a, b) => parts.map(part => verifier(sub(a[part], b[part])).pass);
const checkZero = value => checkPair(value, C.zero);
const mode = (rows, m) => rows.find(row => row.m === m).value;

function checkFixture(input, expectSolenoidal) {
  const [r, t, z] = input;
  const rows = [
    {m: 0, velocity, pressure},
    {m: 1, velocity: input, pressure},
    {m: -1, velocity: input.map(C.conjugate), pressure: C.conjugate(pressure)},
  ];
  const actual = exactAngularHarmonicPDE(G, {geometry, phase, k, rows});
  const raw = mode(actual.quadratic, 2);
  assert.deepEqual(mode(actual.conservativeResidual, 2), raw);
  const defect = mode(actual.divergence, 1);
  const carrier = C.imaginary(k, C.add(...input.map((value, j) =>
    C.scale(phaseGradient[j], value))));
  const amplitudeDivergence = C.add(dr(r), C.scale(inverseRadius, r), dz(z));
  const divergenceBinding = checkPair(defect, C.add(amplitudeDivergence, carrier));
  const amplitudeOnly = [
    C.sub(C.sub(C.mul(z, dz(r)), C.mul(r, dz(z))),
          C.scale(inverseRadius, C.add(C.mul(r, r), C.mul(t, t)))),
    C.sub(C.add(C.mul(r, dr(t)), C.mul(z, dz(t))), C.mul(t, C.add(dr(r), dz(z)))),
    C.sub(C.sub(C.mul(r, dr(z)), C.mul(z, dr(r))), C.scale(inverseRadius, C.mul(r, z))),
  ];
  const corrected = amplitudeOnly.map((value, j) =>
    C.add(value, C.scale(q(2), C.mul(input[j], defect))));
  const correctedIdentity = raw.flatMap((value, j) => checkPair(value, corrected[j]));
  const amplitudeOnlyIdentity = raw.flatMap((value, j) => checkPair(value, amplitudeOnly[j]));
  const divergenceZero = checkZero(defect);
  assert(divergenceBinding.every(Boolean) && correctedIdentity.every(Boolean));
  assert.equal(divergenceZero.every(Boolean), expectSolenoidal);
  assert.equal(amplitudeOnlyIdentity.every(Boolean), expectSolenoidal);
  const wrongConnection = C.add(amplitudeOnly[0],
    C.scale(q(2), C.scale(inverseRadius, C.mul(t, t))));
  if (expectSolenoidal) assert(!checkPair(raw[0], wrongConnection).every(Boolean));
  return {divergenceBinding, correctedIdentity, amplitudeOnlyIdentity, divergenceZero,
    incorrectConnectionRejected: expectSolenoidal};
}

const general = checkFixture(velocity, false);
const harmonicCurl = checkFixture(curl(velocity), true);
const result = {
  schema: 'MathScope.OriginalModeTwoKernelExactControls/1',
  sourceSHA256, graphNodes: G.nodes.length, general, harmonicCurl,
  scope: 'Original executable harmonic operator evaluated on manufactured polynomial amplitudes. '
    + 'Native amplitude analyticity and the physical fixed-label assumptions are required on the actual source.',
};
await writeFile(output, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({graphNodes: result.graphNodes, exactComplexIdentities: 12,
  noDefectAndWrongConnectionControls: true}));
