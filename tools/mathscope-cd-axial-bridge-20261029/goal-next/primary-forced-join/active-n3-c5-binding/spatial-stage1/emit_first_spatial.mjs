/** Optional stage-one source snapshot. Leaves existing split artifacts separate. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {materializeActiveN3FirstSpatialIngress} from './stage1_spatial_ingress.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ORIGINAL_GUARD = 'research-ide/mathscope-m3/navier/source-global-current.mjs';
const GUARD_PIN = 'b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36';

export function firstSpatialMode(value = process.env.MATHSCOPE_FIRST_CORRECTION_SPATIAL_MODE) {
  const mode = value || 'full-source';
  assert.ok(['off', 'operands', 'full-source'].includes(mode), 'Invalid first correction spatial mode');
  return mode;
}

export async function emitFirstSpatial({navier, out, pde, mode, splitOutcome, referenceReceiptPath}) {
  assert.ok(firstSpatialMode(mode) !== 'off');
  assert.ok(['VERIFIED', 'FAILED'].includes(splitOutcome));
  const manifestPath = process.env.MATHSCOPE_FIRST_CYCLE_OVERLAY_MANIFEST;
  assert.ok(manifestPath);
  const source = JSON.parse(await readFile(manifestPath));
  assert.equal(source.schema, 'MathScope.PR30OriginalVerifiedStorageOverlays/1');
  const matches = source.files.filter(row => row.original === ORIGINAL_GUARD);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].sha256, GUARD_PIN);
  const result = await materializeActiveN3FirstSpatialIngress({
    navier, pde, referenceReceiptPath: referenceReceiptPath
      || resolve(HERE, '../hosted-44528954587/first-cycle.json'),
    originalGuardOverlayPath: resolve(dirname(manifestPath), matches[0].overlay),
    includeSpatialJetAtoms: mode === 'full-source',
  });
  const rootGroups = result.normalizedRoots;
  const operands = [...rootGroups.U, ...rootGroups.G_U.flat(), ...rootGroups.A, ...rootGroups.G_A.flat()];
  assert.equal(operands.length, 24);
  assert.ok(operands.every(id => Number.isSafeInteger(id) && id >= 0 && pde.G.nodes[id]));
  assert.equal(result.gaugeDifferenceRootsForIndependentCheck.length, 3);
  const output = join(out, 'first-correction-spatial-ingress.json');
  const record = {...result, mode, sameRunDirectSplitOutcome: splitOutcome, completeNativeExport: null};
  // Preserve this valid structural receipt even if the optional streamed export fails.
  await writeFile(output, JSON.stringify(record, null, 2) + '\n', {flag:'wx'});
  if (mode === 'full-source') {
    const exportPath = resolve(navier, '../post-signed-20261023/export_original_source_graph.mjs');
    const {exportOriginalSourceGraph} = await import(pathToFileURL(exportPath).href);
    const roots = [...new Set([...operands, ...result.gaugeDifferenceRootsForIndependentCheck,
      ...result.spatialJetAtoms.map(row => row.root),
      result.input.temporalDesiredAxial, ...result.input.temporalRawCenteredSources,
      result.input.fiveWhole, result.input.fiveCompactCandidate])];
    const snapshot = await exportOriginalSourceGraph(pde.G, {
      definitionGraph: pde.G, dir: join(out, 'first-correction-spatial-source'),
      roots, scope:'ACTIVE_N3_FIRST_CORRECTION_SPATIAL_INGRESS_NOT_NUMERICAL',
      sourceCommit: process.env.GITHUB_SHA || 'UNKNOWN_LOCAL_RUN',
      pr30Commit: pde.five.temporal.frontier.signed.source.sourceCommit,
    });
    assert.equal(snapshot.function_registry_capture_kind, 'EXTENDED_COUPLED_FACADE');
    assert.equal(snapshot.extended_coupled_registry_included, true);
    await writeFile(join(out, 'first-correction-spatial-export.json'),
      JSON.stringify({schema:'MathScope.N7.ActiveN3SpatialExport/1', snapshot,
        roots, preferredExistingIngress: 'first-correction-spatial-ingress.json',
        status:'VERIFIED_SOURCE_RECORD_EXPORT_NUMERICAL_ENDPOINTS_OPEN'}, null, 2) + '\n', {flag:'wx'});
  }
  return record;
}
