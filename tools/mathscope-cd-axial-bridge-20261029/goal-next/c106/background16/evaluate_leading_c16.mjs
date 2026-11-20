/** Directed C16 coefficient enclosure on the actual early live slab. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [goal,work,activeFile,outerFile,chartFile,out] = process.argv.slice(2);
assert(out);
const hash = v => createHash('sha256').update(v).digest('hex');
async function json(file, pin = null) {
  const data = await readFile(file);
  const digest = hash(data);
  if (pin) assert.equal(digest,pin,file);
  return [JSON.parse(data), digest];
}
const [[active,activeSHA],[outer,outerSHA],[chart,chartSHA]] = await Promise.all(
  [activeFile,outerFile,chartFile].map(file=>json(file)));
const [[history,historySHA],[selection,selectionSHA],[slab,slabSHA]] = await Promise.all([
  json(resolve(work,'whole-k-prefix/historical-scale-arithmetic-input.json'),
    '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0'),
  json(resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json'),
    'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'),
  json(resolve(goal,'final67/local-background-c8/c8-slab.json'),
    'e26c62baf924c4209bbac2ebd944bd17a992bfe4599fd1a8fab2cb8c91d7c02b'),
]);
assert.deepEqual(active.requested,{radialOrder:16, etaOrder:16});
assert.equal(active.sourceProfile,outer.source.parameterExpressionSHA256);

assert.equal(active.bounds.F0active.domain.X[1],outer.domain.X[0]);
assert.deepEqual(active.bounds.F0active.domain.eta,outer.domain.eta);
assert.equal(outer.physicalRows.length,1071);
assert.equal(outer.domain.X[1],'infinity');
assert(outer.normalizedMaximum.startsWith('2^(-') && outer.maxBits < 5536);
assert.equal(chart.pointwiseCoefficientCap,'2^4803*Hc^323');
assert.equal(chart.totalDirections,969);

const {sourceArithmetic} = await import(pathToFileURL(resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
const {N,evaluateClosedArithmeticDefinitions,tracedArithmeticEvaluator} =
  await sourceArithmetic(resolve(work,'annular-numeric-24/pinned-original-runtime'),selection.sourcePins,'coarse-upper');
const names = [...new Set([...active.trace.sourceParameters,'h','Lambda','C12EnvelopeR'])];
const parameters = evaluateClosedArithmeticDefinitions(history.definitions,N,{names}).values;
const lead = tracedArithmeticEvaluator(active.trace,N,{parameters,maxNodeVisits:active.trace.nodeCount});
const ell = N.fromClosed(history.archivedEllMinimumInterval);
const H = N.mul(parameters.get('h'),N.mul(N.add(ell,N.point('15')),N.log(N.point('2'))));
const one = N.one();
const unitLower = N.toClosed(one).lower;
const leadActive = N.max([one,lead.value(active.trace.roots.F0Active),lead.value(active.trace.roots.U0Global)]);
const Renv = parameters.get('C12EnvelopeR');
const logLeading = N.toClosed(N.log(leadActive)).upper;
const leadingLogCapSign = N.compareEndpoints(logLeading,N.toClosed(N.div(H,N.pow(N.point('2'),300))).lower);
const rejectedTighterRenvPowerSign = N.compareEndpoints(logLeading,N.toClosed(N.pow(Renv,4096)).lower);
assert.equal(leadingLogCapSign,-1);
assert.equal(rejectedTighterRenvPowerSign,1);
const result={schema:'MathScope.C105.OriginalLeadingC16LiveDirected/1',order:16,activeSHA,outerSHA,chartSHA,
  leadCap:N.toClosed(leadActive),leadingLogCap:'H/2^300',leadingLogCapSign,rejectedTighterRenvPowerSign,
  exteriorBound:outer.physicalBound,originalActiveAxisIncluded:true,earlySlab:slab.scope??null,finalJets:0,release:'HOLD'};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({leadingLogCapSign,rejectedTighterRenvPowerSign,exteriorBound:outer.physicalBound}));
