import assert from 'node:assert/strict';

function expressionApplication(G, root) {
  const node = G.nodes[root];
  assert.equal(node?.op, 'm3_coupled_expression_partial',
    'Signed stress must retain its original coupled expression application');
  const [system, values, orders] = node.args;
  const {id, ...definition} = G.expressionSystem(system);
  assert.equal(id, system);
  assert.ok(G.nodes[definition.body],
    'Signed stress expression requires its original registered body');
  assert.equal(values.length, definition.parameters.length);
  assert.equal(orders.length, definition.parameters.length);
  return {definition, values, orders};
}

/** Compare the two authenticated constructions of the same after-Forced stress.
 * The original Signed constructor registers fresh shared applications.
 */
export function matchLatestSignedStress(G, signedSigma, announcedSigma, inverseSigma) {
  assert.equal(announcedSigma.length, 2);
  assert.deepEqual(inverseSigma, signedSigma, 'Signed inverse must use the authenticated Signed stress');
  return announcedSigma.map((announcedRoot, component) => {
    const signedRoot = signedSigma[component];
    const announced = expressionApplication(G, announcedRoot);
    const signed = expressionApplication(G, signedRoot);
    assert.deepEqual(signed, announced,
      'The registered stress body, formal parameters, actual arguments and derivative orders must agree');
    return {announcedRoot, signedRoot, body: signed.definition.body,
      formalParameters: signed.definition.parameters, actualArguments: signed.values,
      derivativeOrders: signed.orders};
  });
}
