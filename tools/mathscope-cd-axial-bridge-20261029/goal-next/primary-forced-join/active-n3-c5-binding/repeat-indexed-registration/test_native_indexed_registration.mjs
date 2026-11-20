import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const runtime = process.argv[2];
const output = process.argv[3];
if (!runtime || !output) throw new Error('Usage: node test_native_indexed_registration.mjs ORIGINAL_RESEARCH_IDE OUTPUT_JSON');

const modulePaths = {
  continuation: 'mathscope-m2/navier/actual-continuation-exact-functions.mjs',
  auxiliary: 'mathscope-m3/navier/source-auxiliary-expressions.mjs',
  coupled: 'mathscope-m3/navier/source-coupled-expressions.mjs',
  repeat: 'mathscope-m3/post-signed-20261023/source-postfive-repeat-forced.mjs',
  rationalIdentity: 'mathscope-m3/navier/source-quadratic-identity.mjs',
};
const expectedSHA256 = {
  continuation: '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  auxiliary: 'e456b4511adcc997b64267b2229422618b6139955e0c9083f2b83f4739600463',
  coupled: '5f83192211b649526a2616421a68c9e53004ace96776243e55e37b0a6973cf39',
  repeat: '4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7',
  rationalIdentity: '696ff2202a9fb58e4de791a264fa23321fd81774f1f1a4f8336803d6a10b5bcd',
};
const modules = {};
const sourceSHA256 = {};
for (const [name, relativePath] of Object.entries(modulePaths)) {
  const path = resolve(runtime, relativePath);
  sourceSHA256[name] = createHash('sha256').update(await readFile(path)).digest('hex');
  assert.equal(sourceSHA256[name], expectedSHA256[name], name + ' source bytes changed');
  modules[name] = await import(pathToFileURL(path));
}

const base = new modules.continuation.ActualConvergentExpressions();
const auxiliary = new modules.auxiliary.AuxiliarySourceExpressions(base);
const G = new modules.coupled.SourceCoupledExpressions(auxiliary);
assert.equal(modules.coupled.assertSourceCoupledExpressions(G, auxiliary), true);
assert.equal(new modules.coupled.SourceCoupledExpressions(auxiliary), G);
const [R, Z, T, ell, Y0, Y1, theta] =
  ['R', 'Z', 'T', 'ell', 'Y0', 'Y1', 'theta'].map(name => G.fresh(name));
const parameters = [R, Z, T, ell, Y0, Y1, theta];
const directions = [R, Z, T, Y0, Y1, theta];
const localDirections = [0, 1, 2, 8, 9, 14];
const local = Array.from({length: 16}, (_, i) => G.fresh('local_' + i));
const [r, z, t] = local;
const ratio = local[15];

const verify = modules.rationalIdentity.createQuadraticSourceVerifier(G);
const seed = G.defineExpressionFunction({name:'MechanicsPreviousOwnedBody', parameters:[R], body:R});
const seedValue = G.expressionValue(seed, [R]);
assert.ok(seedValue > 0);
const before = G.captureFunctionDefinitions();

const names = ['repeatVelocityRFixture','repeatVelocityThetaFixture','repeatVelocityZFixture','repeatPressureFixture'];
const signs = [1, -1];
const grid = [-1, 0, 1];
const boxes = grid.flatMap(b => grid.flatMap(i => grid.flatMap(j => grid.map(k => [b,i,j,k]))));
const fields = [];

function specification(name, scalePower) {
  const systems = new Map(signs.map(sign => {
    // Analytic control for testing that the scale and time pullback are
    // differentiated inside the local capsule; this is a fixture body.
    const pulledT = G.mul(ratio, t);
    const polynomial = G.add(r, z, local[8], local[9], local[14], G.mul(pulledT,pulledT,pulledT));
    const body = G.mul(G.q(sign), G.pow(ratio, scalePower), polynomial);
    const system = G.defineExpressionFunction({name:name+'_'+sign, parameters:local, body});
    return [sign, system];
  }));
  const rows = boxes.flatMap(([b,i,j,k]) => signs.map(sign => {
    const values = [R,Z,T,G.q(b),G.q(i),G.q(j),G.q(k),ell,Y0,Y1,
      G.q(i+sign),G.q(j-sign),G.q(k+sign),G.q(b-sign),theta,G.q(b+2)];
    const guards = [[R,G.q(1),G.q(5)],[Z,G.q(i-2),G.q(i+2)],[T,G.q(j-2),G.q(j+2)],
      [Y0,G.q(k-2),G.q(k+2)],[Y1,G.q(b-2),G.q(b+2)]];
    return {
      localSystem:systems.get(sign), values,
      derivativeMaps:localDirections.map(parameter => [{parameter,coefficient:G.one}]),
      coefficient:G.one, guards,
      label:{key:[b,i,j,k].join(':'),sign,countBoxOnce:true},
    };
  }));
  return {name,parameters,directions,rows,sourceRecipe:{mechanicsFixture:true,scalePower}};
}

for (const [i, name] of names.entries()) {
  const scalePower = i === 3 ? 2 : 1;
  const input = specification(name, scalePower);
  const definition = G.definePeriodicIndexedField(input);
  const registered = G.periodicIndexedSystem(definition);
  assert.deepEqual(registered.parameters, parameters);
  assert.deepEqual(registered.directions, directions);
  assert.deepEqual(registered.directionParameterIndices, [0,1,2,4,5,6]);
  assert.equal(registered.rows.length, 162);
  assert.equal(registered.constantChartFactorsChecked, true);
  assert.equal(registered.sourceAuthenticated, false);
  const retained = registered.rows.map(({localBody,localParameters,...row}) => {
    const system = G.expressionSystem(row.localSystem);
    assert.equal(localBody, system.body);
    assert.deepEqual(localParameters, system.parameters);
    return row;
  });
  assert.deepEqual(retained, input.rows);

  const order = [0,0,2,0,0,0];
  const root = G.periodicIndexedValue(definition, parameters, order);
  assert.deepEqual(G.nodes[root].args, [definition, parameters, order]);
  const program = G.materializePeriodicIndexedField(definition, order);
  assert.equal(program.terms.length, 162);
  assert.equal(program.allDeclaredRowsRetained, true);
  assert.equal(program.fullMixedLocalBodiesMaterialized, true);
  assert.equal(program.localBodies.length, 2);
  assert.equal(program.labelsDifferentiated, false);
  assert.equal(program.torusNearestCopyDifferentiated, false);
  const exactLocalOrder = local.map((_,i) => i === 2 ? 2 : 0);
  for (const [j, term] of program.terms.entries()) {
    const row = input.rows[j];
    assert.deepEqual(term.values, row.values);
    assert.deepEqual(term.guards, row.guards);
    assert.equal(term.derivatives.length, 1);
    assert.deepEqual(term.derivatives[0].orders, exactLocalOrder);
    assert.equal(term.derivatives[0].coefficient, G.one);
    let body = term.value;
    for (const [coordinate,left,right] of [...row.guards].reverse()) {
      assert.equal(G.nodes[body].op, 'smooth_piecewise');
      const [arg, lower, upper, below, inside, above] = G.nodes[body].args;
      assert.deepEqual([arg,lower,upper,below,above], [coordinate,left,right,G.zero,G.zero]);
      body = inside;
    }
    assert.equal(body, term.unguarded);

    const materialized = G.materializeExpressionFunction(row.localSystem, row.values, exactLocalOrder);
    const ratioValue = boxes[Math.floor(j/2)][0] + 2;
    const expected = G.mul(G.q(6 * row.label.sign * ratioValue ** (3 + scalePower)), T);
    assert.equal(verify(G.sub(materialized,expected)).pass,true);
  }
  fields.push({id:definition,name,rows:162,checkedTimeSecondDerivatives:162,guardTriplesPerRow:5});
}
assert.equal(G.functionDefinitionsUnchanged(before), true);
assert.equal(G.expressionSystem(seed).body, R);

const control = specification('RejectedFixture', 1);
const controlsBefore = G.captureFunctionDefinitions();
const broken = changes => ({...control,rows:[{...control.rows[0],...changes}]});
const unbound = G.fresh('field-local-unbound-control');
const unboundValues = [...control.rows[0].values];
unboundValues[3] = unbound;
assert.throws(() => G.definePeriodicIndexedField(broken({values:unboundValues})),
  /Retain each joint local body/);
assert.throws(() => G.definePeriodicIndexedField(broken({localSystem:'coupled-expression:999999'})),
  /Unknown joint defining body/);
assert.throws(() => G.definePeriodicIndexedField(broken({coefficient:R})),
  /direction-dependent coefficient/);
const movingMap = structuredClone(control.rows[0].derivativeMaps);
movingMap[2][0].coefficient = T;
assert.throws(() => G.definePeriodicIndexedField(broken({derivativeMaps:movingMap})),
  /direction-dependent coefficient/);
assert.throws(() => modules.repeat.constructPostFiveRepeatForcing({G,five:{}}),
  {code:'INVALID_POSTFIVE_3D_SOURCE_SEAL'});
const controlsAfter = G.captureFunctionDefinitions();
assert.deepEqual(controlsAfter.counts, controlsBefore.counts);
assert.equal(controlsAfter.definitions, controlsBefore.definitions);

const result = {
  schema:'MathScope.C135.NativeIndexedRegistrationMechanics/1',
  status:'NATIVE_MECHANICS_FIXTURE_PASS_ACTIVE_BINDING_OPEN',
  nodeVersion:process.versions.node,
  nodeCount:G.nodes.length,
  sourceSHA256,
  fields,
  installedRows:fields.reduce((count,field) => count+field.rows,0),
  prefixPreserved:true,
  originalRegistryHydrated:false,
  activeRepeatFieldsRegistered:false,
  rejectionControls:['unboundFieldOperand','unknownLocalOwner','movingOuterCoefficient','movingDerivativeMap','unsealedPostFive'],
  release:'HOLD',
};
await writeFile(resolve(output), JSON.stringify(result,null,2)+'\n', 'utf8');
