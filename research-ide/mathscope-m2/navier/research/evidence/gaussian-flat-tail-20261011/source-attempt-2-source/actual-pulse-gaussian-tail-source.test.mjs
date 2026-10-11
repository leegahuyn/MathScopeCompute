import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareActualPulseGaussianTail,assertActualPulseGaussianTail,actualPulseGaussianTailCertificateFromProgram} from '../actual-pulse-gaussian-tail.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {normalizedHomogeneousPulseBinding} from '../actual-pulse-gaussian-power-kernel.mjs';

const start=performance.now(),p=prepareActualPulseGaussianTail({}, {onProgress:row=>console.log(JSON.stringify(row))}),G=p.G;

test('both tails retain the original admissible pulse, nonzero initial datum and exact stable envelope',()=>{
  assert.equal(assertActualPulseGaussianTail(p),true);assert.ok(p.checks.every(c=>c.pass));
  assert.equal(p.rows.length,2);
  for(const [i,r]of p.rows.entries()){
    assert.deepEqual(r.originalAmplitude,p.source.families[i].t);assert.equal(r.originalP,p.source.families[i].P);
    assert.deepEqual(r.actualSourceInitial,[G.one,G.zero]);assert.ok(r.binding.checks.every(c=>c.pass));
    assert.ok(r.envelopeSlowIndependent.every(c=>c.independent));assert.equal(r.finiteDisplayApproximationUsed,false);
  }
});

test('every original localization residual component retains psi-prime and both temporal derivatives',()=>{
  for(const r of p.rows)for(const c of r.components){
    assert.equal(c.rows.length,3);assert.equal(c.psiJets.length,4);assert.ok(c.rows.every(j=>j.identity.pass&&j.forcingTail===G.zero));
    assert.notEqual(c.rows[0].direct,G.zero);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(c.rows[0].direct,G.mul(G.derivative(p.source.cutoffs.psi,p.coordinates.v),c.amplitudeJets[0])),{atomicNodes:c.amplitudeJets}).pass,true);
    assert.equal(c.arbitraryForcingZeroExtensionRequiresItsOwnBoundaryHypothesis,true);
  }
});

test('actual stable constants stay independent of band coordinates and keep strictly positive exact scales',()=>{
  const b=p.bounds;
  assert.equal(b.W,G.exp(G.mul(G.add(G.mul(G.q(2),b.E),b.Ed),b.Lmax)));
  assert.equal(b.E,G.pow(p.source.constants.Bnorm,256));assert.equal(b.gaussianIdentity.pass,true);
  assert.equal(G.freeCoordinates(b.a).size,0);assert.notEqual(b.a,G.zero);assert.notEqual(b.gaussianAtCutoff,G.zero);
  assert.equal(p.source.constants.h,G.parameter('h'));assert.equal(b.powerAudit.allFiniteOrdersUseSameSourceThreshold,true);
  assert.ok(b.cutoffBounds.rows.every(r=>G.freeCoordinates(r.coefficient).size===0));
});

test('the full integer mesh has its actual ell18 count while local candidates retain both signs once',()=>{
  const g=p.geometry;
  assert.equal(g.actualPartition.labels.length,81);assert.equal(g.maximumPositiveSlowLabelsAtPoint,16);assert.equal(g.maximumSignedLabelsAtPoint,32);
  assert.equal(g.meshCountPower,18);assert.equal(g.signedBoxCountCoefficient,G.mul(G.q(2),g.boxCountCoefficient));
  assert.ok(g.actualPartition.labels.every(r=>r.countInGlobalSum===1&&r.signs.length===2));
  assert.equal(g.auxiliary.palette.commonToAllBandsAndLabels,true);
  assert.equal(g.sameLabelNonlinearProductsRetained,true);
});

test('the positive infinite Gaussian tail and flat bound do not become all-label physical completion',()=>{
  assert.ok(p.bounds.flat.checks.every(c=>c.pass));assert.ok(p.bounds.meshSum.checks.every(c=>c.pass));assert.notEqual(p.bounds.meshSum.roots.tail,G.zero);
  assert.equal(p.scope.actualTerminalFastDerivativeGaussianBound,true);
  for(const key of ['allLabelAmplitudeBoundsAuthenticated','actualSlowDerivativeGaussianBounds','covarianceWeightDerivativesInTail','physicalPullbackDerivativeLossesIncluded','globalPhysicalResidualFlatness','wholeGN5Complete','wholeGNUMComplete','m3MayStart'])assert.equal(p.scope[key],false);
});

test('dropping the actual damped channel is rejected independently of the power-bound ledger',()=>{
  const f=p.source.families[0],m=f.frame.wMatrix.map(row=>[...row]);m[1][1]=G.add(m[1][1],G.mul(G.q(2),f.frame.reference.lambda));
  assert.throws(()=>normalizedHomogeneousPulseBinding(G,{v:p.coordinates.v,length:p.source.geometry.Ls,lambda:f.frame.reference.lambda,dref:f.frame.reference.dref,damping:f.frame.actualDamping,
    projected:f.frame.projected,error:f.frame.projectedError,matrix:m,P:f.P,initial:[G.one,G.zero]}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('copied or promoted certificates fail the private source seal',()=>{
  assert.throws(()=>assertActualPulseGaussianTail({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  p.scope.globalPhysicalResidualFlatness=true;assert.throws(()=>assertActualPulseGaussianTail(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.scope.globalPhysicalResidualFlatness=false;
  const old=p.bounds.a;p.bounds.a=G.zero;assert.throws(()=>assertActualPulseGaussianTail(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.bounds.a=old;
  assert.equal(assertActualPulseGaussianTail(p),true);
});

test('later independent graph appends leave the fixed compiler hash and source receipt unchanged',async()=>{
  const before=await actualPulseGaussianTailCertificateFromProgram(p);G.fresh('independent_after_gaussian_tail');
  assert.deepEqual(await actualPulseGaussianTailCertificateFromProgram(p),before);
  const path=process.env.M2_GAUSSIAN_TAIL_EVIDENCE;
  if(path)fs.writeFileSync(path,JSON.stringify({schema:'MathScope.ActualPulseGaussianTailSourceRun/1',at:new Date().toISOString(),certificate:before,elapsedSeconds:(performance.now()-start)/1000,peakRSSBytes:process.resourceUsage().maxRSS*1024,pass:true},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({sourceGraph:before.sourceGraph.sha256,graph:before.graph.sha256,nodeCount:before.graph.nodeCount,bytes:before.graph.canonicalBytes,internalChecks:before.checks.length,pass:true}));
});
