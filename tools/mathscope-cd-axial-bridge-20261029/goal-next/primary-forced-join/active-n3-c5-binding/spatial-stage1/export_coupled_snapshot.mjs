/** Export the exact shared node stream with its extended definition owner. */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const ACTIVE_SOURCE_EXPORT_MAX_NODES = 35_000_000;

export async function exportCoupledSnapshot(navier, definitionGraph, options) {
  const rawGraph = definitionGraph.baseGraph;
  assert.ok(rawGraph && rawGraph !== definitionGraph, 'Use the separate original node-stream owner.');
  assert.strictEqual(rawGraph.nodes, definitionGraph.nodes, 'Both owners must share the exact original node array.');
  assert.ok(rawGraph.nodes.length <= ACTIVE_SOURCE_EXPORT_MAX_NODES, 'Original node stream exceeds the explicit export budget.');
  const sourceModule = resolve(navier,'../post-signed-20261023/export_original_source_graph.mjs');
  const {exportOriginalSourceGraph} = await import(pathToFileURL(sourceModule).href);
  const snapshot = await exportOriginalSourceGraph(rawGraph, {
    ...options, definitionGraph,maxNodes:ACTIVE_SOURCE_EXPORT_MAX_NODES,
  });
  assert.equal(snapshot.function_registry_capture_kind,'EXTENDED_COUPLED_FACADE');
  assert.equal(snapshot.extended_coupled_registry_included,true);
  return snapshot;
}
