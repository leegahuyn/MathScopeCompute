import assert from 'node:assert/strict';

// The caller must inject the exact original functions, including an exported copy
// of the original private completeSourceField. This module does not authenticate
// those functions or claim that the resulting guarded fields are globally smooth.
// The live runner must pass the untouched result of the immediately preceding
// constructPostFiveRepeatInverses(pde) call: the candidate has no private seal.
export function buildRepeatIndexedIncrements({
  pde: full,
  repeat,
  reconstructAngularHarmonics,
  completeSourceField,
} = {}) {
  for (const [name, fn] of Object.entries({ reconstructAngularHarmonics, completeSourceField })) {
    assert.equal(typeof fn, 'function', `missing original helper: ${name}`);
  }
  assert.ok(full && full.G && full.five, 'actual full PostFive input required');
  assert.ok(repeat, 'immediately preceding repeat result required');
  const G = full.G;
  const before = G.captureFunctionDefinitions();
  assert.equal(repeat.G, G, 'repeat graph must be the original live graph');
  const forced = full.five.temporal.frontier.signed.constructed.originalForced;
  const initial = forced.input;
  assert.equal(forced.G, G);
  assert.equal(full.five.temporal.frontier.signed.input, forced);
  const parameters = initial.coordinates.localParameters;
  assert.equal(parameters.length, 16, 'original local angular slot count');
  assert.equal(new Set(parameters).size, 16, 'local slots must be distinct');
  const allowed = new Set(parameters);
  const checked = [];
  function checkRoot(root, label) {
    assert.ok(Number.isInteger(root) && root >= 0 && root < G.nodes.length,
      `${label}: invalid node root ${root}`);
    const missing = [...G.freeCoordinates(root)].filter(x => !allowed.has(x));
    assert.deepEqual(missing, [], `${label}: coordinates outside original local slots`);
    checked.push(label);
  }
  assert.equal(repeat.templates.length, 10);
  assert.equal(repeat.systems.length, 40);
  const templates = repeat.templates.map(x => x.template);
  assert.equal(new Set(templates.map(t => t.key)).size, 10);
  assert.equal(forced.templates.length, 10);
  for (const t of templates) {
    assert.equal(forced.templates.find(x => x.key === t.key), t,
      `${t.key}: original template identity`);
    assert.ok(t.lift && t.lift.geometry, `${t.key}: missing original lift`);
    for (const [name, root] of Object.entries({phase:t.phase, k:t.k,
      xi:t.lift.xi, v:t.lift.v})) checkRoot(root, `${t.key}.${name}`);
  }
  for (const sign of [0, 1]) {
    assert.deepEqual(templates.filter(t => t.signIndex === sign)
      .map(t => t.levelDifference).sort((a,b) => a-b), [0,1,2,3,4],
      `original five level choices for sign ${sign}`);
  }
  const table = new Map();
  for (const s of repeat.systems) {
    assert.ok(templates.some(t => t.key === s.key), `unknown key ${s.key}`);
    assert.ok([1,2,3,4].includes(s.m));
    const key = `${s.key}/${s.m}`;
    assert.ok(!table.has(key), `duplicate system ${key}`);
    table.set(key, s);
    assert.equal(s.positive.m, s.m);
    assert.equal(s.negative.m, -s.m);
    for (const side of ['positive','negative']) {
      const row = s[side];
      assert.equal(row.velocity.length, 3, `${key}.${side} velocity`);
      for (const [j, z] of [...row.velocity, row.pressure].entries()) {
        for (const part of ['real','imaginary']) checkRoot(z[part], `${key}.${side}[${j}].${part}`);
      }
    }
  }
  const resolved = templates.map(t => {
    const rows = [1,2,3,4].flatMap(m => {
      const s = table.get(`${t.key}/${m}`);
      assert.ok(s, `missing inverse ${t.key}/${m}`);
      return [s.positive, s.negative];
    });
    const reconstruction = reconstructAngularHarmonics(G,
      {geometry:t.lift.geometry, phase:t.phase, k:t.k, rows});
    assert.equal(reconstruction.velocity.length, 3);
    for (const [j, root] of [...reconstruction.velocity, reconstruction.pressure].entries())
      checkRoot(root, `${t.key}.reconstruction[${j}]`);
    return {...t, repeatReconstruction:reconstruction};
  });
  const fields = [0,1,2].map(j => completeSourceField(initial, resolved,
    `ActualPostFiveRepeatIncrementVelocity_${j}`, t => t.repeatReconstruction.velocity[j],
    {kind:'velocity'}));
  fields.push(completeSourceField(initial, resolved, 'ActualPostFiveRepeatIncrementPressure',
    t => t.repeatReconstruction.pressure, {kind:'pressure'}));
  assert.ok(G.functionDefinitionsUnchanged(before), 'pre-existing definitions changed');
  assert.equal(repeat.fields.length, 8);
  const old = G.periodicIndexedSystem(repeat.fields[0].field);
  const rowMap = ({values,guards,derivativeMaps,coefficient,label}) =>
    ({values,guards,derivativeMaps,coefficient,label});
  assert.equal(old.rows.length, 162);
  assert.ok(old.rows.every(row => row.guards.length === 5), 'original five guards per row');
  for (const [j, item] of repeat.fields.entries()) {
    const field = G.periodicIndexedSystem(item.field);
    assert.deepEqual(field.parameters, old.parameters, `old field ${j} parameters`);
    assert.deepEqual(field.directions, old.directions, `old field ${j} directions`);
    assert.deepEqual(field.rows.map(rowMap), old.rows.map(rowMap), `old field ${j} 162-row map`);
  }
  for (const [j, item] of fields.entries()) {
    const field = G.periodicIndexedSystem(item.field);
    assert.deepEqual(field.parameters, old.parameters, `field ${j} parameters`);
    assert.deepEqual(field.directions, old.directions, `field ${j} directions`);
    assert.deepEqual(field.rows.map(rowMap), old.rows.map(rowMap), `field ${j} original 162-row map`);
    assert.equal(item.contributions, 162);
  }
  return {fields:fields.map(({field,root}) => ({field,root})), coordinateChecks:checked,
    scope:{candidateRegistrationOnly:true, sourceAuthenticated:false,
      completeSecondForcedState:false, finalJets:0, release:'HOLD',
      physicalSupportAndFlatness:'OPEN', globalConservativeEquality:'OPEN'}};
}
