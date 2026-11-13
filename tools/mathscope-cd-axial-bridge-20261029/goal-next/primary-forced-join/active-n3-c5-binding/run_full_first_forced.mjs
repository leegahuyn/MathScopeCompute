import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';

export async function runFullFirstForced({load, initial, binding, context, out}) {
  const source = await load('source-global-forced-current.mjs');
  const checkpoints = [];
  const path = join(out, 'full-first-forced-progress.json');
  const save = () => writeFile(path, JSON.stringify(checkpoints, null, 2) + '\n');
  const result = await source.attachGlobalForcedCurrentWithCheckpoints(initial, {
    ...context,
    async onSourceCheckpoint(event) {
      context.checkCancelled();
      assert.equal(event.G, initial.G);
      const row = {kind: event.kind, key: event.key ?? null, nodes: event.G.nodes.length,
        rssBytes: process.memoryUsage().rss};
      checkpoints.push(row);
      await save();
      console.log(JSON.stringify(row));
    },
  });
  assert.equal(source.assertGlobalForcedCurrent(result), true);
  assert.equal(result.input, initial);
  assert.equal(result.G, initial.G);
  assert.equal(result.assembly.allOriginalSourceLabels, 81);
  assert.equal(result.assembly.signedSourceContributions, 162);
  assert.equal(result.assembly.exactPositiveSourceSystems, 20);
  assert.equal(result.assembly.exactNegativeConjugateSolutionRoutes, 20);
  assert.ok(result.checks.every(({pass}) => pass));
  const rows = result.templates.flatMap(template => {
    const old = initial.templates.find(row => row.key === template.key);
    assert.ok(old);
    return template.forced.map(f => binding.bindForcedTemplate(old, f));
  });
  assert.equal(new Set(rows.map(row => row.system)).size, 20);
  assert.equal(new Set(rows.map(row => row.key)).size, 10);
  return {nodes: result.G.nodes.length, checks: result.checks, assembly: {
    allOriginalSourceLabels: result.assembly.allOriginalSourceLabels,
    signedSourceContributions: result.assembly.signedSourceContributions,
    exactPositiveSourceSystems: result.assembly.exactPositiveSourceSystems,
    exactNegativeConjugateSolutionRoutes: result.assembly.exactNegativeConjugateSolutionRoutes,
  }, rows, roots: {velocity: result.global.velocity, pressure: result.global.pressure,
    physicalResidual: result.global.direct.conservativeResidual}, scope: result.scope};
}
