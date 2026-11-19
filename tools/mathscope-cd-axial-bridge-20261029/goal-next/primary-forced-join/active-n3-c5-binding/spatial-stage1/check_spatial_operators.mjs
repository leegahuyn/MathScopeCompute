/** Check the candidate tensor operators using the actual original differential kernel. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {covariantGradient, originalCurlPlusDirect, originalSpatialJetAtoms} from './stage1_spatial_ingress.mjs';

const [navier, archivedControl] = process.argv.slice(2);
const load = path => import(pathToFileURL(resolve(navier, path)).href);
const {ActualConvergentExpressions} = await load('../../mathscope-m2/navier/actual-continuation-exact-functions.mjs');
const {originalCylindricalDifferentialOperators} = await load('source-harmonic-assembly.mjs');
const {createQuadraticSourceVerifier} = await load('source-quadratic-identity.mjs');
const G = new ActualConvergentExpressions();
const [R, Z, T, theta, y0, y1] = ['R','Z','T','theta','y0','y1'].map(label => G.fresh(label));
const epsilon = G.q(1, 2), radialFast = G.q(7);
const geometry = {R, Z, T, theta, Y: [y0, y1], epsilon, radialFast,
  vr:[G.one, G.q(2)], vt:[G.q(3), G.q(4)], ci:G.one};
const op = originalCylindricalDifferentialOperators(G, geometry);
const equal = (left, right) => assert.ok(createQuadraticSourceVerifier(G)(G.sub(left, right)).pass);
const tensorEqual = (left, right) => left.flat().forEach((root,index) => equal(root,right.flat()[index]));
const zero = G.zero, one = G.one;

// A constant Cartesian field has identically zero covariant derivative.
const east = [G.cosine(theta), G.neg(G.sine(theta)), zero];
tensorEqual(covariantGradient(G, op, east), Array(3).fill([zero,zero,zero]));

// Solid rotation: ∇_r(R e_θ)=e_θ and ∇_θ(R e_θ)=-e_r.
const rotation = [zero, R, zero];
tensorEqual(covariantGradient(G, op, rotation), [[zero,G.q(-1),zero],[one,zero,zero],[zero,zero,zero]]);

// The source z-direction costs ε and radial derivatives retain the Y chain.
const potential = [zero, G.add(Z,y0), zero];
const swirl = G.q(5);
const actual = originalCurlPlusDirect(G, op, potential, swirl);
tensorEqual(actual, [G.neg(epsilon), swirl, G.add(radialFast, G.div(potential[1], R))]);
assert.throws(() => equal(actual[0], epsilon), assert.AssertionError);
const direct = G.mul(R, G.add(G.pow(R, 2), Z, y0));
const atoms = originalSpatialJetAtoms(G, op, [zero, zero, G.pow(Z, 2)], direct);
assert.equal(atoms.length, 33);
if (archivedControl) {
  const archive = JSON.parse(await readFile(archivedControl));
  assert.equal(archive.status, 'VERIFIED_ARCHIVED_N1_TYPED_OWN_REFERENCE_SCALE_AND_ROW_MAPS');
  assert.deepEqual(atoms.map(row => row.label).sort(), archive.originalSpatialJetLabels);
}
const atom = label => atoms.find(row => row.label === label);
equal(atom('A2@0,0,1,0').root, G.mul(G.q(2), epsilon, Z));
equal(atom('A2@0,0,2,0').root, G.mul(G.q(2), G.pow(epsilon, 2)));
equal(atom('b@1,0,0').root, G.div(G.add(G.mul(G.q(2),R),radialFast),G.mul(G.q(2),R)));
equal(atom('b@0,1,0').root, epsilon);
assert.equal(atom('b@1,0,0').multiplier, 'Q^(-A-3/2)');
assert.equal(atom('A2@0,0,2,0').multiplier, 'Q^(1/2-A-2/2)');
console.log('PASS original covariant gradient, radial Y chain, curl sign and exact 33-slot derivative shape');
