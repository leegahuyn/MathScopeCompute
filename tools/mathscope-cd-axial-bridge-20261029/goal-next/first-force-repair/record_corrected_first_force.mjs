import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { exportOriginalSourceGraph } from '../post-signed-20261023/export_original_source_graph.mjs';

const parts = ['real', 'imaginary'];

export async function recordCorrectedFirstForce({ rawGraph, initial, forced, dir, commit, pr30Commit }) {
  const G = forced.G;
  assert.equal(G.nodes, rawGraph.nodes);
  assert.equal(initial.templates.length, 10);
  assert.equal(forced.templates.length, 10);
  const rows = [];
  for (const t of forced.templates) {
    const previous = initial.templates.find(row => row.key === t.key);
    assert.ok(previous);
    assert.equal(t.rawInitializedWaveResidual, previous.waveResidual);
    assert.equal(t.primaryFlatResidual, previous.primaryFlatResidual);
    assert.equal(t.originalSourceRows, previous.nonzeroAngularForcing);
    assert.deepEqual(t.forced.map(f => f.m), [1, 2]);
    for (const f of t.forced) {
      const raw = t.rawInitializedWaveResidual.find(row => row.m === f.m).value;
      const primary = t.primaryFlatResidual.find(row => row.m === f.m)?.value;
      const supported = t.originalSourceRows.find(row => row.m === f.m).value;
      let changed = 0;
      const components = raw.flatMap((z, j) => parts.map(part => {
        const primaryRoot = primary?.[j][part] ?? G.zero;
        const sourceRoot = G.sub(z[part], primaryRoot);
        const pullback = f.pullback[j][part];
        assert.equal(sourceRoot, supported[j][part]);
        assert.equal(sourceRoot, f.inputRoots[j][part]);
        assert.equal(sourceRoot, pullback.body);
        assert.equal(pullback.mapped, f.signedSolutions[0].pathSource[j][part]);
        assert.ok(pullback.check.pass);
        if (pullback.system !== undefined) {
          assert.equal(G.expressionSystem(pullback.system).body, sourceRoot);
        } else {
          assert.equal(sourceRoot, G.zero);
        }
        changed += Number(z[part] !== sourceRoot);
        return { j, part, raw: z[part], primary: primaryRoot, supported: sourceRoot,
          mapped: pullback.mapped, system: pullback.system ?? null };
      }));
      assert.ok(f.m === 1 ? changed > 0 : changed === 0);
      assert.ok(f.checks.every(check => check.pass));
      assert.ok(t.support.checks.every(check => check.pass));
      rows.push({ key: t.key, m: f.m, changed, components,
        system: f.inverse.system, output: f.inverse.velocity, pressure: f.inverse.pressure });
    }
  }
  assert.equal(rows.length, 20);
  const physicalResidual = forced.global.direct.conservativeResidual;
  assert.equal(physicalResidual.length, 3);
  const roots = new Set(physicalResidual);
  for (const row of rows) {
    for (const c of row.components) {
      for (const k of ['raw', 'primary', 'supported', 'mapped']) roots.add(c[k]);
    }
    for (const z of [...row.output, row.pressure]) {
      for (const part of parts) roots.add(z[part]);
    }
  }
  const snapshot = await exportOriginalSourceGraph(rawGraph, {
    dir, roots: [...roots], definitionGraph: G, sourceCommit: commit, pr30Commit,
    scope: 'REPAIRED_FIRST_FORCED_ONLY'
  });
  assert.equal(snapshot.function_registry_capture_kind, 'EXTENDED_COUPLED_FACADE');
  const receipt = {
    commit, scope: snapshot.scope, positiveSystems: rows.length,
    components: rows.reduce((n, row) => n + row.components.length, 0),
    physicalResidual, rows, snapshot,
    correctedSignedTemporalFiveMap: 'OPEN', uniformClassBounds: 'OPEN',
    finalJets: 0, release: 'HOLD'
  };
  writeFileSync(dir + '/corrected-first-force.json', JSON.stringify(receipt, null, 2) + '\n');
  return { systems: receipt.positiveSystems, components: receipt.components,
    graphNodeCount: snapshot.node_count, definitionsSha256: snapshot.definitions_sha256 };
}
