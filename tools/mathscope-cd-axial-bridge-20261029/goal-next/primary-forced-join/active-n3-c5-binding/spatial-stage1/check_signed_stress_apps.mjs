/** Exercise both registrations and rejected changes using the original graph API. */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {matchLatestSignedStress} from './match_signed_stress.mjs';

const [navier] = process.argv.slice(2);
const load = path => import(pathToFileURL(resolve(navier, path)).href);
const {ActualConvergentExpressions} = await load('../../mathscope-m2/navier/actual-continuation-exact-functions.mjs');
const {AuxiliarySourceExpressions} = await load('source-auxiliary-expressions.mjs');
const {SourceCoupledExpressions} = await load('source-coupled-expressions.mjs');
const G = new SourceCoupledExpressions(new AuxiliarySourceExpressions(new ActualConvergentExpressions()));
const first = G.fresh('first');
const second = G.fresh('second');
const shifted = G.fresh('shifted');
const bodies = [G.add(first, second), G.mul(first, second)];
const parameters = [first, second];
const derivativeLimits = [2, 2];

const name = j => 'ActualLatestMeanSigma_after-forced_' + j;
const make = (j, options = {}) => {
  const system = G.defineExpressionFunction({name: name(j), parameters, body: bodies[j],
    derivativeLimits, ...options.definition});
  return G.expressionValue(system, options.values || parameters, options.orders);
};
const initial = bodies.map((_, j) => make(j));
const fresh = bodies.map((_, j) => make(j));
assert.notDeepEqual(initial, fresh);
const equality = matchLatestSignedStress(G, fresh, initial, [...fresh]);
assert.deepEqual(equality.map(row => row.body), bodies);
assert.equal(matchLatestSignedStress(G, initial, initial, initial).length, 2);

const controls = [
  ['changedBody', make(0, {definition:{body:G.sub(first, second)}})],
  ['changedFormals', make(0, {definition:{parameters:[second, first]}})],
  ['changedActuals', make(0, {values:[shifted, second]})],
  ['changedDerivative', make(0, {orders:[1, 0]})],
  ['changedDerivativeLimit', make(0, {definition:{derivativeLimits:[3, 2]}})],
  ['wrongOperation', bodies[0]],
];
for (const [label, root] of controls) {
  const altered = [root, fresh[1]];
  assert.throws(() => matchLatestSignedStress(G, altered, initial, altered), assert.AssertionError, label);
}
assert.throws(() => matchLatestSignedStress(G, fresh, initial, initial), assert.AssertionError);
console.log(JSON.stringify({status:'VERIFIED_DUPLICATE_ORIGINAL_COUPLED_EXPRESSION_APPLICATION_CONTROLS',
  checkedComponents:equality.length, distinctRegistrationIDs:true,
  controlsRejected:[...controls.map(([label]) => label), 'wrongSignedInverseOperand'],
  activeN3ApplicationReadback:'OPEN', release:'HOLD'}));
