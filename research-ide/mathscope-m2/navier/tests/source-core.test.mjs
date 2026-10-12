import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {getSourceCoreObservations,verifySourceCoreObservation,getPinnedCoreEvaluationRows,exactCoreIntervalToBinary64} from '../source-core-observations.mjs';
import {PINNED_CORE} from '../source-core-data.mjs';
import {sha256} from '../../../mathscope-m0/contracts.mjs';
import {runJob} from '../index.mjs';

test('actual core data is byte-bound to the accepted assembly and every original interval',async()=>{
  for(const key of ['assembly','acceptedCore'])assert.equal(await sha256(await readFile(new URL('../../../'+PINNED_CORE[key].path,import.meta.url),'utf8')),PINNED_CORE[key].sha256);
  const original=JSON.parse(await readFile(new URL('../../../'+PINNED_CORE.acceptedCore.path,import.meta.url),'utf8'));
  assert.equal(PINNED_CORE.rows.length,75);
  for(const row of PINNED_CORE.rows){const source=original.evaluations[row.sourceIndex];assert.deepEqual(row.sameInfiniteCoreInterval,source.sameInfiniteCoreInterval);assert.equal(row.quantity,source.quantity);assert.equal(row.Y,source.Y);assert.equal(row.analyticErrorIncluded,true);const b=exactCoreIntervalToBinary64(row.sameInfiniteCoreInterval);assert.ok(b[0]<=row.decimalDisplayOnly[0]&&b[1]>=row.decimalDisplayOnly[1]);}
  assert.equal(PINNED_CORE.sourceClaimBoundary.actualInfiniteCoreEvaluationsEnclosed,true);assert.equal(PINNED_CORE.wholeProfileFieldEvaluator,false);
});

test('each source chart independently restores the same q,Y and actual physical swirl, including the upper band limit',()=>{
  for(const ell of [8,16,511,900]){const data=getSourceCoreObservations({ell});assert.ok(data.verification.pass);assert.equal(data.samples.length,5);assert.equal(data.domain.pulseQStarCertified,false);for(const sample of data.samples){const [a,b]=sample.chartPair;assert.notEqual(a.ell,b.ell);assert.notEqual(a.QExact,b.QExact);assert.notEqual(a.TExact,b.TExact);assert.equal(a.restoredYExact,sample.sourceY);assert.equal(b.restoredYExact,sample.sourceY);assert.equal(a.restoredQExact,b.restoredQExact);if(sample.sourceY!=='0'){assert.notDeepEqual(a.chartNormalizedVelocityInterval,b.chartNormalizedVelocityInterval,'The two chart fields are actually transformed, not copied.');assert.equal(sample.physicalSwirl.binary64,null);assert.equal(sample.physicalSwirl.underflowNotZero,true);assert.match(sample.physicalPoint.r.exact,/Lambda/);}else assert.equal(sample.physicalSwirl.exactExpression,'0');}}
});

test('source interval, receipt, coordinate and physical scale mutations fail the overlap verifier',()=>{
  const baseline=getSourceCoreObservations();const changes=[
    x=>x.provenance.acceptedCore.sha256='0'.repeat(64),
    x=>x.samples[1].sourceY='2',
    x=>x.samples[1].sourcePhiInterval.lower='0',
    x=>x.samples[1].chartPair[1].QExact=x.samples[1].chartPair[0].QExact,
    x=>x.samples[1].chartPair[1].TExact='1',
    x=>x.samples[1].chartPair[1].lambdaR2Exact='5',
    x=>x.samples[1].chartPair[1].physicalScale.TChartVelocityExponent=['0','0'],
    x=>x.samples[1].chartPair[1].physicalScale.QVelocityExponent=['0','0'],
    x=>x.samples[1].chartPair[1].chartNormalizedVelocityInterval=[...x.samples[1].sourcePhiDisplayEnclosure],
    x=>x.samples[1].physicalPoint.r.binary64=0,
    x=>x.samples[1].chartPair[1].frozenLabels.k=1,
  ];
  for(const mutate of changes){const bad=structuredClone(baseline);mutate(bad);assert.equal(verifySourceCoreObservation(bad).pass,false);}
});

test('independent exact rational and 400-digit physical field reconstruction agrees in both chart directions',()=>{
  const observations=[8,16,900].map(ell=>getSourceCoreObservations({ell}));const result=spawnSync('python',[fileURLToPath(new URL('./source-core-independent.py',import.meta.url))],{input:JSON.stringify({observations}),encoding:'utf8'});assert.equal(result.status,0,result.stderr);const data=JSON.parse(result.stdout);assert.equal(data.pass,true);assert.ok(data.total>=150);
});

test('the actual core observations are attached to dyadic output and have a visible dedicated source example',async()=>{
  const core=await runJob({kind:'ns.source-core-charts',input:{ell:16},precision:{mode:'OUTWARD_FLOAT64'}}),dyadic=await runJob({kind:'ns.dyadic-charts',input:{ellStart:8,count:2}});assert.equal(core.status,'COMPLETED');assert.equal(core.results.verification.pass,true);assert.equal(core.visualization.points.length,10);assert.equal(core.visualization.axes[0].kind,'SOURCE_COORDINATE');assert.equal(core.visualization.axes[1].kind,'NORMALIZED_FIELD_INTERVAL');assert.equal(dyadic.results.actualCoreOverlap.verification.pass,true);assert.equal(dyadic.results.leadingFieldNumericallyEvaluated,'ACCEPTED_ETA_ZERO_CORE_SAMPLES_ONLY');
  const invalid=await runJob({kind:'ns.source-core-charts',input:{ell:901}}),fake=await runJob({kind:'ns.source-core-charts',input:{h:.001}});assert.equal(invalid.status,'FAILED');assert.equal(fake.status,'FAILED');
  assert.throws(()=>getPinnedCoreEvaluationRows({quantity:'global-Phi'}),/not recorded/);assert.throws(()=>getPinnedCoreEvaluationRows({derivativeOrder:3}),/orders 0, 1 and 2/);
});
