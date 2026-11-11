import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { prepareActualExteriorForceJets, assertActualExteriorForceJets,
  actualExteriorForceJetsCertificate } from './source/research-ide/mathscope-m3/navier/source-exterior-force-jets.mjs';
import { assertActualSourceLocalizationDomain,
  actualSourceLocalizationDomainCertificate } from './source/research-ide/mathscope-m3/navier/source-localization-domain.mjs';
import { sourceGraphRationalIdentity } from './source/research-ide/mathscope-m2/navier/actual-continuation-exact-identities.mjs';

const output = process.argv[2];
assert(output, 'Usage: node force_cases.mjs OUTPUT');
let peakRss = 0;
function memory() {
  peakRss = Math.max(peakRss, process.memoryUsage().rss);
  if (peakRss > 13 * 1024 ** 3 / 2) throw new Error('R1-06 exterior replay memory budget exceeded');
}
const force = await prepareActualExteriorForceJets({orders: [0, 1, 2, 3, 4]}, {
  onProgress(info) {
    memory();
    console.log(JSON.stringify({sourceProgress: info.stage ?? info.id ?? 'source stage'}));
  },
  checkCancelled: memory,
});
const { G, domainBridge: domain } = force;
const forceBefore = await actualExteriorForceJetsCertificate(force);
const domainBefore = await actualSourceLocalizationDomainCertificate(domain);
assert.equal(forceBefore.verification.checksPass, true);
assert.equal(domainBefore.verification.checksPass, true);
assert.equal(force.scope.originalHeatRestrictionOnly, true);
assert.equal(force.scope.wholeFinalN6FieldConstructed, false);
assert.equal(force.scope.wholeKEnergyNearTerminalComputed, false);
assert.equal(domain.constants.supportRatio, G.q(1, 4));
assert.equal(domain.constants.strictSupportGap, G.q(1, 4));
assert.equal(force.rows[0].midpoint.normalizedDivergence.sign, 'STRICTLY_NEGATIVE');
const originalPressure = force.rows[0].expressions.pressure;
assert.equal(sourceGraphRationalIdentity(G, originalPressure).pass, false);

const controls = [];
function checkMutation(label, target, key, changed, readBack, explanation, message) {
  const original = target[key];
  try {
    target[key] = changed;
    assert.throws(readBack, error => {
      assert.equal(error.code, 'INVALID_SOURCE_CONSTRUCTION');
      assert.equal(error.message, message);
      controls.push({ label, original, changed, code: error.code, runtimeReason: error.message, explanation });
      return true;
    });
  } finally {
    target[key] = original;
  }
  assert.equal(readBack(), true);
}
checkMutation('omit_original_improper_pressure_term', force.rows[0].expressions, 'pressure', G.zero,
  () => assertActualExteriorForceJets(force),
  'The first original N7 force row has a nonzero pressure term. Setting it to zero invalidates the bound exterior-force record.',
  'Use the unchanged privately constructed original heat-exterior force jets.');
checkMutation('replace_original_cutoff_support_ratio', domain.constants, 'supportRatio', G.q(3, 4),
  () => assertActualSourceLocalizationDomain(domain),
  'The validated cutoff support is q ≤ qBig/4 with a strict margin below qBig/2. A ratio of 3/4 is outside that domain bound.',
  'Use the unchanged source-bound domain bridge; omitted premises and copied records are not source authority.');
const forceAfter = await actualExteriorForceJetsCertificate(force);
const domainAfter = await actualSourceLocalizationDomainCertificate(domain);
assert.deepEqual(forceAfter, forceBefore);
assert.deepEqual(domainAfter, domainBefore);
memory();

await writeFile(output, JSON.stringify({
  schema: 'MathScope.M4.R106.SourceForceCutoffReplay/1',
  status: 'PASS',
  controls,
  preserved: {
    forceGraph: forceBefore.graph,
    domainGraph: domainBefore.graph,
    exactCertificateEquality: true,
    forceOrders: force.request.orders,
    signOfFirstRowDivergence: force.rows[0].midpoint.normalizedDivergence.sign,
    pressureExpressionNode: originalPressure,
    cutoffSupport: domain.cutoffConclusions.support,
  },
  scope: { originalHeatExterior: true, sameSourceCutoffDomain: true,
    finalFieldNumericallyEvaluated: false, wholeGlobalForce: false, wholeKEnergy: false },
  peakRssBytes: peakRss,
}, null, 2) + '\n', 'utf8');
for (const control of controls) console.log(JSON.stringify(control));
