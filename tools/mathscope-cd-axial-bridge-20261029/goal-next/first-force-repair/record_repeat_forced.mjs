import { writeFileSync } from 'node:fs';
import { constructPostFiveRepeatInverses } from '../post-signed-20261023/source-postfive-repeat-forced.mjs';
import { exportOriginalSourceGraph } from '../post-signed-20261023/export_original_source_graph.mjs';

const parts = ['real', 'imaginary'];
const vectorRoots = vector => vector.flatMap(z => parts.map(part => z[part]));

export async function recordPostFiveRepeatForced({ rawGraph, full, context, dir, commit, pr30Commit }) {
  const result = constructPostFiveRepeatInverses(full, context);
  const templates = result.templates.map(({ template, rows, rawSupport }) => ({
    key: template.key, phase: template.phase, sign: template.sign, difference: template.levelDifference,
    rows, rawSupport
  }));
  const roots = new Set(full.residual.conservative);
  for (const t of templates) {
    for (const row of t.rows) {
      for (const id of vectorRoots([...row.raw, ...row.subtraction, ...row.supported, ...row.guarded])) roots.add(id);
    }
  }
  for (const row of result.systems) {
    for (const id of vectorRoots([...row.positive.velocity, row.positive.pressure])) roots.add(id);
  }
  const snapshot = await exportOriginalSourceGraph(rawGraph, {
    definitionGraph: result.G, dir, roots: [...roots], sourceCommit: commit, pr30Commit,
    scope: 'POST_FIVE_REPEAT_FORCED_CONDITIONAL_SOURCE',
    maxNodes: 6500000
  });
  const receipt = { schema: 'MathScope.N6.PostFiveRepeatForcedCandidate/1',
    commit, precedingConservativeResidual: full.residual.conservative,
    registeredPositiveSystems: result.systems.length, fields: result.fields, mean: result.mean,
    templates, systems: result.systems, scope: result.scope, snapshot };
  writeFileSync(dir + '/post-five-repeat-forced-candidate.json', JSON.stringify(receipt, null, 2) + '\n');
  return { systems: result.systems.length, nodeCount: snapshot.node_count, scope: receipt.scope };
}
