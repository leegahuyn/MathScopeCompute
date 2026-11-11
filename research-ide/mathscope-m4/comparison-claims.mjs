import { readFile } from 'node:fs/promises';
import { checkTheoremAdapter } from '../mathscope-m1/core/theorem-adapters.mjs';
import { CORE_RUN, isVerifiedM4KernelReadback } from './kernel-evidence.mjs';

const { comparisonRegistry } = JSON.parse(await readFile(
  new URL('./analytic-obligations.json', import.meta.url), 'utf8',
));
const registry = new Map(comparisonRegistry.map(row => [row.id, row]));

const REFERENCE_IDS = Object.freeze({
  'M4.REFERENCE.PRISM': 'S01',
  'M4.REFERENCE.TRACE_FORMULA': 'S07',
  'M4.REFERENCE.BSD_KNOWN_CASES': 'BSD-GZK-ANALYTIC-RANK-LE1',
  'M4.REFERENCE.NS_ORIGINAL': 'NS-PAPER',
});
const ADAPTER_ID = 'M4.ADAPTER.UNIFORM_CONTINUITY';
const ADAPTER = 'MathScope.M4.Comparison.uniform_continuity_adapter';
const UPSTREAM = 'MathScope.M4.Analytic.uniform_limit_uniformly_continuous';

function referenceClaim(id) {
  const definition = registry.get(id);
  if (definition?.status !== 'THEOREM REFERENCE' || definition.leanImport !== null) {
    throw new Error('Reference is outside the reviewed comparison scope: ' + id);
  }
  const result = checkTheoremAdapter({ role: 'THEOREM_REFERENCE', referenceId: REFERENCE_IDS[id] });
  if (!result.ok) throw new Error('Missing comparison reference: ' + id);
  const { id: referenceId, title, url, locator, scope } = result.reference;
  return { id, label: title, classification: 'THEOREM REFERENCE',
    reference: { referenceId, url, locator, scope }, kernel: null };
}

function exportedClaim(readback) {
  const label = 'Precision 공간의 균등연속 비교 정리';
  const pending = { id: ADAPTER_ID, label, classification: 'KERNEL EVIDENCE REQUIRED',
    reference: null, kernel: null };
  const definition = registry.get(ADAPTER_ID);
  if (!isVerifiedM4KernelReadback(readback) || readback.receiptSha256 !== CORE_RUN.receiptSha256 ||
      definition?.status !== 'EXPORTED_LEAN_TARGET' || definition.module !== 'MathScope.M4.Comparison' ||
      definition.target !== ADAPTER || definition.upstreamTarget !== UPSTREAM ||
      'research-ide/mathscope-m4/' + definition.kernelEvidence !== CORE_RUN.directory + '/receipt.json') {
    return pending;
  }
  const adapter = readback.targets.find(row => row.target === ADAPTER);
  const upstream = readback.targets.find(row => row.target === UPSTREAM);
  if (!adapter || !upstream || !adapter.targetType.startsWith(ADAPTER + ' ') ||
      !upstream.targetType.startsWith(UPSTREAM + ' ') ||
      adapter.targetType.slice(ADAPTER.length) !== upstream.targetType.slice(UPSTREAM.length) ||
      adapter.userAxioms.length || upstream.userAxioms.length) return pending;
  return { id: ADAPTER_ID, label, classification: 'EXPORTED LEAN TARGET',
    reference: null,
    kernel: {
      module: definition.module, target: ADAPTER, targetType: adapter.targetType,
      upstreamModule: 'MathScope.M4.Analytic', upstreamTarget: UPSTREAM,
      upstreamTargetType: upstream.targetType, grade: adapter.grade, axioms: [...adapter.axioms],
      receiptSha256: readback.receiptSha256, executedAt: readback.executedAt,
      currentKernelExecuted: readback.currentKernelExecuted,
    },
  };
}

export function buildM4ComparisonView(readback) {
  return [...Object.keys(REFERENCE_IDS).map(referenceClaim), exportedClaim(readback)];
}
