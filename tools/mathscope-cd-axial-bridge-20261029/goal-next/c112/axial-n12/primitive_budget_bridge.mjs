import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const script = fileURLToPath(new URL('./check_primitive.py', import.meta.url));
const payload = fileURLToPath(new URL('./primitive-request.tmp.json', import.meta.url));

export function exactPythonPrimitiveFallback(G, left, right, atomicNodes, maxVisits) {
  const nodes = G.nodes;
  const bytes = Buffer.from(JSON.stringify({
    left, right, atomicNodes, nodes, expressionSystems: G.expressionSystems,
    freeCoordinates: nodes.map((_, id) => [...G.freeCoordinates(id)].sort((a,b) => a-b)),
  }));
  writeFileSync(payload, bytes);
  const digest = createHash('sha256').update(bytes).digest('hex');
  console.log(JSON.stringify({diagnostic:'fallback-input', left, right, sourceNodes:nodes.length,
    historicalLimit:maxVisits, inputSHA256:digest}));
  assert.ok(process.env.MATHSCOPE_AXIAL_PYTHON);
  const result = spawnSync(process.env.MATHSCOPE_AXIAL_PYTHON, ['-B', script, payload],
                            {encoding:'utf8', timeout:900_000, maxBuffer:4_000_000});
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  const row = JSON.parse(result.stdout);
  assert.deepEqual([row.left,row.right,row.inputSHA256], [left,right,digest]);
  console.log(JSON.stringify({diagnostic:'fallback-result', ...row}));
  return {schema:'MathScope.ExplicitPrimitiveBodyIdentity/1',
    left, right, normalForms:row.normalForms, pass:row.pass, visited:row.visited,
    canonicalNodeCount:row.canonicalNodeCount, sharingNamesIgnored:true, boundNamesIgnored:true,
    sourceValuesReplaced:false, derivativeOrMomentIdentityAssumed:false,
    independentIntegerReplay:row.inputSHA256};
}
