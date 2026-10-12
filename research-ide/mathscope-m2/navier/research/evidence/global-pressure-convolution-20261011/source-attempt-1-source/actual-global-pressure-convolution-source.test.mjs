import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {prepareActualGlobalPressureConvolution,assertActualGlobalPressureConvolution,actualGlobalPressureConvolutionCertificate} from '../actual-global-pressure-convolution.mjs';
let prepared,failure,count=0;
const progress=e=>console.log('# SOURCE_PROGRESS '+JSON.stringify({...e,at:new Date().toISOString(),rssBytes:process.memoryUsage().rss}));
const source=()=>{if(failure)throw failure;if(prepared)return prepared;
  try{count++;progress({phase:'actual-pressure-constructor-start'});return prepared=prepareActualGlobalPressureConvolution({order:2,maxNodes:2000000},{onProgress:progress});}
  catch(error){failure=error;throw error;}};

test('the actual original leading-stream proof and positive induction share the unchanged original prefix',()=>{
  const p=source();assert.equal(count,1);assert.equal(p.sourceBinding.sourceMassAndContinuityAuthenticated,true);
  assert.ok(p.sourceBinding.commonOriginalNodeCount>10000);assert.equal(p.sourceBinding.newAuditNodeIdsInterchanged,false);
  assert.equal(p.stream.scope.actualGlobalLeadingMassPrimitiveIdentity,true);
});

test('both actual common-core branches identify every leading F/U/v source representative',()=>{
  const p=source(),r=p.leadingRestrictions;assert.equal(r.cases.length,2);
  for(const c of r.cases){assert.equal(c.rows.length,3);for(const x of c.rows){assert.equal(x.check.pass,true);assert.ok(x.reduced.trace.length>0);}}
  assert.equal(r.commonCore.pass,true);assert.equal(r.commonCore.domain[1],p.primitives.prepared.bootstrap.inner.aSquared);
});

test('the actual full Ipos leading F equals the original reserved power with lambda and radius retained',()=>{
  const p=source(),r=p.leadingRestrictions.ipos;assert.equal(r.pass,true);assert.equal(r.selectedCheck.pass,true);
  assert.equal(r.densityCheck.pass,true);assert.equal(r.amplitudeCheck.pass,true);assert.equal(r.sourceAmplitudeCheck.pass,true);
  assert.equal(r.fullHeatAndAllCorrectionRootsRetained,true);assert.equal(r.positiveCovarianceWeightsAssumed,false);
  assert.equal(r.generic.negativeControls.omittedRadiusDivision.pass,false);assert.equal(r.generic.negativeControls.omittedLambda.pass,false);
});

test('the live source seal rejects injected completion and the scoped fixed receipt survives append-only work',async()=>{
  const p=source();assert.throws(()=>assertActualGlobalPressureConvolution({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const saved=p.scope.wholeGN4Complete;p.scope.wholeGN4Complete=true;assert.throws(()=>assertActualGlobalPressureConvolution(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.scope.wholeGN4Complete=saved;
  const certificate=await actualGlobalPressureConvolutionCertificate(p);p.G.fresh('after_pressure_restriction_certificate');
  assert.equal((await actualGlobalPressureConvolutionCertificate(p)).graph.sha256,certificate.graph.sha256);
  assert.equal(certificate.scope.wholeGN4Complete,false);assert.equal(certificate.scope.newLeanKernelProof,false);assert.equal(certificate.scope.m3MayStart,false);
  if(process.env.M2_GLOBAL_PRESSURE_EVIDENCE)await writeFile(process.env.M2_GLOBAL_PRESSURE_EVIDENCE,JSON.stringify({certificate,sourceConstructions:count,actualExecutedPositiveOrders:[1,2],currentRSSBytes:process.memoryUsage().rss},null,2)+'\n');
});
