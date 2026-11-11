import assert from 'node:assert/strict';
import test from 'node:test';
import { ActualConvergentExpressions } from '../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import { createQuadraticSourceVerifier } from '../navier/source-quadratic-identity.mjs';
import { exactHarmonicComplexAlgebra } from '../navier/source-harmonic-assembly.mjs';
import { repeatForcedCoefficients } from './source-postfive-repeat-forced.mjs';

function fixture() {
  const G = new ActualConvergentExpressions();
  const [R, Z, T, theta, xi, v] = ['R', 'Z', 'T', 'theta', 'xi', 'v'].map(name => G.fresh(name));
  const geometry = { R, Z, T, theta, xi, v, epsilon: G.q(1, 2), radialFast: G.one };
  const C = exactHarmonicComplexAlgebra(G);
  const radial = z => [z, C.zero, C.zero];
  const mode = (m, z, pressure = C.zero) => [
    { m, velocity: radial(z), pressure },
    { m: -m, velocity: radial(C.conjugate(z)), pressure: C.conjugate(pressure) }
  ];
  const mean = { m: 0, velocity: radial(C.value(R)), pressure: C.value(G.mul(R, Z)) };
  const waves = [...mode(1, C.value(G.q(2)), C.value(Z)), ...mode(2, C.value(G.q(3), G.one))];
  const flat = [
    { m: 1, terms: [
      { family: 'primary', value: radial(C.value(G.one)) },
      { family: 'remaining', value: radial(C.value(G.q(4), G.q(7))) },
      { family: 'derivative', value: radial(C.value(G.q(-2))) },
      { family: 'signed', value: radial(C.value(G.q(5))) }
    ] },
    { m: 2, terms: [
      { family: 'remaining', value: radial(C.value(G.q(6))) },
      { family: 'derivative', value: radial(C.value(G.zero, G.q(-2))) }
    ] }
  ];
  return { G, input: { geometry, phase: theta, k: G.q(3), mean, waves, flat } };
}

test('preserves the complete quadratic modes and subtracts only the matching flat terms', () => {
  const { G, input } = fixture();
  const result = repeatForcedCoefficients(G, input);
  const verify = createQuadraticSourceVerifier(G);
  const equal = (a, b) => assert.ok(verify(G.sub(a, b)).pass);
  assert.deepEqual(result.raw.generatedModes, [-4, -3, -2, -1, 0, 1, 2, 3, 4]);
  assert.deepEqual(result.positive.map(row => [row.m, row.terms.length]), [[1, 4], [2, 2], [3, 0], [4, 0]]);
  const [one, two, three, four] = result.positive;
  equal(one.subtraction[0].real, G.q(8));
  equal(one.subtraction[0].imaginary, G.q(7));
  equal(two.subtraction[0].real, G.q(6));
  equal(two.subtraction[0].imaginary, G.q(-2));
  for (const [row, re, im] of [[three, 12, 4], [four, 8, 6]]) {
    equal(row.supported[0].real, G.div(G.q(re), input.geometry.R));
    equal(row.supported[0].imaginary, G.div(G.q(im), input.geometry.R));
  }
});

test('rejects a missing mode and a lost imaginary conjugate', () => {
  const { G, input } = fixture();
  assert.throws(() => repeatForcedCoefficients(G, { ...input, waves: input.waves.slice(0, 3) }));
  const wrong = input.waves.map(row => row.m === -2 ?
    { ...row, velocity: [input.waves.find(other => other.m === 2).velocity[0], ...row.velocity.slice(1)] } : row);
  assert.throws(() => repeatForcedCoefficients(G, { ...input, waves: wrong }), /raw Fourier conjugacy/);
});
