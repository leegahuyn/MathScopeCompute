import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {certifyCutoffPrefix,evaluateLocalPotentialSum,smoothPotentialCutoff} from '../source-gluing.mjs';
import {defaultTailJet,evaluatePulseCutoffRemainder} from '../source-tail.mjs';
import {runJob} from '../index.mjs';
import {executeDomain} from '../../core/registry.mjs';

const makeSum=(log2q=-3.5)=>evaluateLocalPotentialSum({log2a:[2,3,4],log2qRange:[log2q,log2q+.125],log2q,potentials:[[1,2,3],[2,-1,1],[3,0,4]]});
const disjoint=(a,b)=>a[1]<b[0]||b[1]<a[0];

test('a complete compact cutoff prefix excludes every higher doubling continuation, including exact boundary equality',()=>{
  for(const lo of[-4,-3.75,-.5]){const c=certifyCutoffPrefix([2,3,4],[lo,0]);assert.equal(c.prefixComplete,true);assert.equal(c.omittedHigherOrdersAreZero,true);assert.equal(c.proof.doesNotNeedUnseenCoefficientValues,true);assert.equal(c.uncutSeriesConvergenceClaimed,false);}
  const boundary=certifyCutoffPrefix([2,3,4],[-4,-4]);assert.equal(boundary.lastCutoffAtQMin.sign,0);assert.deepEqual(boundary.activePositiveOrders,[1,2]);
  const missing=certifyCutoffPrefix([2,3,4],[-4.000000000000001,-4]);assert.equal(missing.prefixComplete,false);assert.equal(missing.omittedHigherOrdersAreZero,false);assert.equal(missing.requestMorePrefix.requiredLastLog2aAtLeast,5);
  assert.throws(()=>certifyCutoffPrefix([2,3,3],[-4,-3]),/doubling/);assert.throws(()=>certifyCutoffPrefix([2,3,4],[-Infinity,-4]),/finite/);
});

test('the actual locally finite potential sum includes a C-infinity collar and differs from the uncut formal prefix',()=>{
  const s=makeSum();assert.equal(s.activity.prefixComplete,true);assert.equal(s.summands[1].cutoff.region,'C_INFINITY_COLLAR');assert.equal(s.summands[2].cutoff.region,'OFF');assert.ok(s.localSum.value[0][0]>2&&s.localSum.value[0][1]<3);assert.ok(disjoint(s.localSum.value[0],s.uncutFiniteFormalTruncation.value[0]));assert.equal(s.sourceInstanceCertified,false);assert.equal(s.allUnseenCoefficientsReplacedByZero,false);assert.ok(s.summands.every(row=>row.sourcePath.startsWith('results.localPotentialSum.inputPotentials[')));
  assert.deepEqual(smoothPotentialCutoff(-1).interval,[1,1]);assert.deepEqual(smoothPotentialCutoff(0).interval,[0,0]);assert.ok(smoothPotentialCutoff(-.5).strictlyBetweenZeroAndOne);
});

test('an exhausted prefix refuses a locally finite total instead of silently dropping active unseen coefficients',()=>{
  const s=makeSum(-8);assert.equal(s.activity.prefixComplete,false);assert.equal(s.localSum,null);assert.ok(s.finiteCutoffPrefixValue.length===3);
  const extended=evaluateLocalPotentialSum({log2a:[2,3,4,5,6,7,8],log2qRange:[-8,-7.875],log2q:-8,potentials:[[1,2,3],[2,-1,1],[3,0,4],[100,0,0],[100,0,0],[100,0,0],[100,0,0]]});assert.equal(extended.activity.prefixComplete,true);assert.ok(extended.localSum.value[0][0]>s.finiteCutoffPrefixValue[0][1]+250);
});

test('all forcing, amplitude and cutoff derivative terms are evaluated as complex interval residuals',()=>{
  for(const m of[0,2,4,8]){const t=evaluatePulseCutoffRemainder(defaultTailJet(m));assert.equal(t.rows.length,m+1);assert.equal(t.allTermsRetained,true);assert.equal(t.sourceInstanceCertified,false);assert.equal(t.allOrderSourceCertificate,false);assert.equal(t.rows.at(-1).sourcePaths.cutoff.length,m+2);assert.ok(t.rows.every(row=>row.residual.length===3&&row.componentAbsUpper.every(Number.isFinite)));}
});

test('omitting psi-prime, forcing or the highest cutoff derivative fails meaningful residual controls',()=>{
  const input=defaultTailJet(),full=evaluatePulseCutoffRemainder(input),noPrime=evaluatePulseCutoffRemainder(input,{omitPsiPrime:true}),noForcing=evaluatePulseCutoffRemainder(input,{omitForcing:true});assert.equal(noPrime.allTermsRetained,false);assert.equal(noForcing.allTermsRetained,false);assert.ok(disjoint(full.rows[0].residual[0].re,noPrime.rows[0].residual[0].re));assert.ok(disjoint(full.rows[0].residual[1].re,noForcing.rows[0].residual[1].re));
  const bad=structuredClone(input);bad.psiDerivatives.pop();assert.throws(()=>evaluatePulseCutoffRemainder(bad),/last derivative/);
  const malformed=structuredClone(input);malformed.forcingDerivatives[0][0]={re:[0,1],formalPass:true};assert.throws(()=>evaluatePulseCutoffRemainder(malformed),/re\/im/);
});

test('independent exact polynomial derivatives and high-precision cutoff sums enclose every computed component',()=>{
  const sums=[-.75,-.5,-.25].map(x=>makeSum(-4+x+1)),tails=[0,2,4].map(m=>evaluatePulseCutoffRemainder(defaultTailJet(m))),r=spawnSync('python',[fileURLToPath(new URL('./source-contract-independent.py',import.meta.url))],{input:JSON.stringify({sums,tails}),encoding:'utf8'});assert.equal(r.status,0,r.stderr);const data=JSON.parse(r.stdout);assert.equal(data.pass,true);assert.ok(data.total>=70);
});

test('domain results distinguish conditional operator acceptance from actual source instance certification',async()=>{
  const cutoff=await runJob({kind:'ns.background-cutoffs',input:{}});assert.equal(cutoff.status,'COMPLETED');assert.equal(cutoff.results.constantLedger.operatorCertificate,true);assert.equal(cutoff.results.constantLedger.sourceDerivativeBoundsVerified,false);assert.equal(cutoff.results.constantLedger.sourceInstanceCertified,false);assert.equal(cutoff.results.localPotentialSum.activity.prefixComplete,true);assert.equal(cutoff.results.tailContract.allOrderSourceCertificate,false);
  const exhausted=await runJob({kind:'ns.background-cutoffs',input:{log2q:-10000}});assert.equal(exhausted.status,'PARTIAL');assert.equal(exhausted.results.localPotentialSum.localSum,null);
  const tail=await runJob({kind:'ns.pulse-tail',input:{}});assert.equal(tail.status,'COMPLETED');assert.equal(tail.results.cutoffRemainder.allTermsRetained,true);assert.equal(tail.results.envelopeLedger.sourceInstanceCertified,false);assert.equal(tail.results.envelopeLedger.finiteJetValuesDoNotProveTheEnvelope,true);assert.equal(tail.scope.globalNavierStokesConstruction,false);
  const short=await runJob({kind:'ns.pulse-tail',input:{count:1}});assert.equal(short.status,'PARTIAL');assert.equal(short.results.uniformAfterThreshold,null);
  for(const request of [{kind:'ns.background-cutoffs',input:{sourceConstantsCertified:true}},{kind:'ns.pulse-tail',input:{sourceGaussianCertified:true}},{kind:'ns.background-cutoffs',input:{potentials:[[1,2]]}},{kind:'ns.pulse-tail',input:{residualJet:{derivativeOrder:1,psiDerivatives:[1]}}}])assert.equal((await runJob(request)).status,'FAILED');
});

test('new source observation, harmonic and conditional operators replay with stable source result hashes',async()=>{
  for(const kind of ['ns.source-core-charts','ns.pulse-curl','ns.background-cutoffs','ns.pulse-tail']){const a=await executeDomain({kind,input:{}}),b=await executeDomain({kind,input:{}});assert.equal(a.resultHash,b.resultHash,kind);assert.ok(a.checks.every(c=>c.pass),kind);}
});
