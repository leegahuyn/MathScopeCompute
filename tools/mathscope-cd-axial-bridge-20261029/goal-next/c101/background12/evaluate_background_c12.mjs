/** Directed C12 coefficient enclosure on the actual early live slab. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [goal,work,traceFile,activeFile,outerFile,chartFile,out] = process.argv.slice(2);
assert(out);
const hash = v => createHash('sha256').update(v).digest('hex');
async function json(file, pin = null) {
  const data = await readFile(file);
  const digest = hash(data);
  if (pin) assert.equal(digest,pin,file);
  return [JSON.parse(data), digest];
}
const [[trace,traceSHA],[active,activeSHA],[outer,outerSHA],[chart,chartSHA]] = await Promise.all(
  [traceFile,activeFile,outerFile,chartFile].map(file=>json(file)));
const [[history,historySHA],[selection,selectionSHA],[slab,slabSHA]] = await Promise.all([
  json(resolve(work,'whole-k-prefix/historical-scale-arithmetic-input.json'),
    '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0'),
  json(resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json'),
    'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'),
  json(resolve(goal,'final67/local-background-c8/c8-slab.json'),
    'e26c62baf924c4209bbac2ebd944bd17a992bfe4599fd1a8fab2cb8c91d7c02b'),
]);
assert.equal(trace.originalPrefix,123870);
assert.equal(trace.derivativeOrder,12);
assert.deepEqual(trace.finite.map(v=>[v.n,v.normalizedEulerWeights,v.mixedProfileOrders]),
  [[1,13,91],[2,13,91],[3,13,91]]);
assert.deepEqual(active.requested,{radialOrder:12, etaOrder:12});
assert.equal(active.sourceProfile,outer.source.parameterExpressionSHA256);
assert.equal(active.sourceProfile,trace.sourceParameterExpressionSHA256);
assert.equal(active.bounds.F0active.domain.X[1],outer.domain.X[0]);
assert.deepEqual(active.bounds.F0active.domain.eta,outer.domain.eta);
assert.equal(outer.physicalRows.length,637);
assert.equal(outer.domain.X[1],'infinity');
assert(outer.normalizedMaximum.startsWith('2^(-') && outer.maxBits < 5536);
assert.equal(chart.pointwiseCoefficientCap,'2^2699*Hc^195');
assert.equal(chart.totalDirections,455);

const {sourceArithmetic} = await import(pathToFileURL(resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
const {N,evaluateClosedArithmeticDefinitions,tracedArithmeticEvaluator} =
  await sourceArithmetic(resolve(work,'annular-numeric-24/pinned-original-runtime'),selection.sourcePins,'coarse-upper');
const names = [...new Set([...trace.trace.sourceParameters, ...active.trace.sourceParameters,'h','Lambda','C12EnvelopeR'])];
const parameters = evaluateClosedArithmeticDefinitions(history.definitions,N,{names}).values;
const bounds = new Map();
assert.deepEqual(trace.trace.nonArithmeticBoundaries.map(v=>v.id),[239,257,275]);
for (const row of trace.trace.nonArithmeticBoundaries) {
  assert.deepEqual(row.node,history.nodes.find(v=>v.id===row.id).node);
  bounds.set(row.id,N.fromClosed(history.boundaryIntervals[row.id]));
}
const ev = tracedArithmeticEvaluator(trace.trace,N,{parameters,boundaries:bounds,maxNodeVisits:trace.trace.nodeCount});
const lead = tracedArithmeticEvaluator(active.trace,N,{parameters,maxNodeVisits:active.trace.nodeCount});
const ell = N.fromClosed(history.archivedEllMinimumInterval);
const H = N.mul(parameters.get('h'),N.mul(N.add(ell,N.point('15')),N.log(N.point('2'))));
const one = N.one();
const unitLower = N.toClosed(one).lower;
const positive = trace.finite.map(row=>{
  const envelope = N.max([ev.value(row.E),ev.value(row.U)]);
  const weighted = N.mul(envelope,N.mul(N.point('2'),N.exp(N.mul(N.point(String(-2*row.n)),H))));
  const comparison = N.compareEndpoints(N.toClosed(weighted).upper,unitLower);
  assert.equal(comparison,-1);
  return {n:row.n,profileEnvelope:N.toClosed(envelope),weighted:N.toClosed(weighted),comparison};
});
const leadActive = N.max([one,lead.value(active.trace.roots.F0Active),lead.value(active.trace.roots.U0Global)]);
const Renv = parameters.get('C12EnvelopeR');
const logLeading = N.toClosed(N.log(leadActive)).upper;
const leadingLogCapSign = N.compareEndpoints(logLeading,N.toClosed(N.div(H,N.pow(N.point('2'),300))).lower);
const rejectedTighterRenvPowerSign = N.compareEndpoints(logLeading,N.toClosed(N.pow(Renv,4096)).lower);
assert.equal(leadingLogCapSign,-1);
assert.equal(rejectedTighterRenvPowerSign,1);
const Hc = N.max([N.point('2'),parameters.get('Lambda'),Renv]);
const chartMultiplier = N.mul(N.pow(N.point('2'),2699),N.pow(Hc,195));
const total = N.mul(chartMultiplier,N.add(leadActive,...positive.map(row=>N.fromClosed(row.weighted))));
const upper = N.toClosed(total).upper;
const gate = slab.gates.smallGrowth128;
const comparison = N.compareEndpoints(upper,gate.lower);
assert.equal(comparison,-1);
const receipt={
  schema:'MathScope.C101.OriginalC12LiveBackgroundDirected/1',
  status:'VERIFIED_DIRECTED_ORIGINAL_C12_BOUND_CONDITIONAL_LIVE_SOURCE_REALIZATION',
  inputs:{traceSHA,activeSHA,outerSHA,chartSHA,historySHA,selectionSHA,slabSHA},
  originalPrefix:trace.originalPrefix,traceNodeCount:trace.trace.nodeCount,
  fixedBoundaries:[239,257,275],derivativeOrder:12,positive,
  leading:{activePlusOuterCap:N.toClosed(leadActive),outerNormalizedMaximum:outer.normalizedMaximum,
    inwardEtaEndpoints:true,outerPhysicalRows:outer.physicalRows.length,leadingLogCap:"H/2^300",leadingLogCapSign,rejectedTighterRenvPowerSign},
  comparison:{upper,gate,sign:comparison},
  use:'Original physical F/G pointwise on the same admitted qBig/64 <= q < qBig/16 slab, with the original leading chart, profile, and real flat joins. Positive orders n>=4 vanish there, including the b4 q=1 flat edge as in C10. No native integrated FTC or interpolated higher path is inferred.',
  finalJets:0,release:'HOLD',
};
await writeFile(out,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({traceNodes:trace.trace.nodeCount,weightedComparisons:positive.map(row=>row.comparison),
  combinedComparison:comparison,leadingExterior:outer.normalizedMaximum}));
