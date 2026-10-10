import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareActualFullCurlProgram,assertActualFullCurlProgram,actualFullCurlCertificateFromProgram} from '../actual-full-curl.mjs';
import {assertActualPulseJetProgram} from '../actual-pulse-jet-source.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

// One genuine all-direction source graph. Run serially with other large
// source workers. Tests neither tune the pinned h nor substitute a toy field.
const start=performance.now(),p=prepareActualFullCurlProgram({ellExact:'1',terms:0}),{G,operator:o}=p;

test('the real source curl retains both original waves including sqrt(epsilon) and every cutoff',()=>{
  assert.equal(assertActualFullCurlProgram(p),true);assert.equal(assertActualPulseJetProgram(p.jet),true);
  assert.equal(p.rows.length,2);assert.ok(p.checks.every(x=>x.pass));
  for(const row of p.rows){
    const f=o.families.find(f=>f.sign===row.sign);
    assert.deepEqual(row.originalAmplitude,f.t);assert.equal(row.phase,f.phase);
    const atoms=[G.sqrt(o.geometry.epsilon),row.sigma,o.cutoffs.chi,o.cutoffs.psi,...f.t];
    const equal=(a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{atomicNodes:atoms}).pass;
    assert.ok(row.weightedCutoffAmplitude.every((a,j)=>equal(a,G.mul(G.sqrt(o.geometry.epsilon),row.sigma,o.cutoffs.chi,o.cutoffs.psi,f.t[j]))));
    assert.equal(equal(row.weightedCutoffAmplitude[0],G.mul(row.sigma,o.cutoffs.chi,o.cutoffs.psi,f.t[0])),false,'omitting the original sqrt(epsilon) changes the source formula');
    assert.notEqual(row.transverseCutoffDerivative,G.zero);
    assert.ok(sourceGraphRationalIdentity(G,G.sub(row.curl.remainder[2],G.add(row.curl.radialDerivatives[1],G.div(row.curl.potential[1],o.coordinates.R)))).pass);
    assert.ok(row.phaseChecks.every(c=>c.pass));assert.ok(row.tangency.frameTangencyChecks.every(c=>c.pass));
    assert.ok(row.tangency.leadingChecks.every(c=>c.pass));
  }
});

test('original covariance and complete target derivatives feed the conditional square-root chain',()=>{
  assert.equal(p.target.bothShearTermsRetained,true);assert.equal(p.target.actualHeatPreparedPressureRetained,true);
  for(const row of p.rows){
    assert.equal(G.nodes[row.sigma].op,'sqrt_positive');assert.equal(G.nodes[row.sigma].args[0],row.weight);
    assert.ok(row.rootChecks.every(c=>c.pass));assert.notEqual(row.weightR,G.zero);assert.notEqual(row.weightZ,G.zero);
    assert.ok(row.curl.divergence.checks.every(c=>c.pass));
    assert.equal(row.curl.divergence.theorem,'MathScope.M2.Navier.full_cylindrical_curl_divergence');
  }
});

test('source local curl does not certify displayed-band positivity, global assembly or physical residual',()=>{
  assert.equal(p.scope.actualLocalFullCurlConstructed,true);assert.equal(p.scope.originalSqrtEpsilonWaveScaleRetained,true);
  assert.equal(p.scope.exercisedBandPositiveWeightsCertified,false);
  assert.equal(p.scope.actualGlobalSlowPartitionGluingComplete,false);
  assert.equal(p.scope.fullPhysicalResidualAndFlatErrorPackageComplete,false);
  assert.equal(p.scope.actualSourceAnalyticLeanTheorem,false);
  assert.equal(p.domain.exercisedBand.positiveWeightDomainMembershipCertified,false);
});

test('copied or amended curl receipts cannot become authenticated source programs',()=>{
  assert.throws(()=>assertActualFullCurlProgram({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const old=p.scope.exercisedBandPositiveWeightsCertified;p.scope.exercisedBandPositiveWeightsCertified=true;
  assert.throws(()=>assertActualFullCurlProgram(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.scope.exercisedBandPositiveWeightsCertified=old;
  assert.equal(assertActualFullCurlProgram(p),true);
});

test('compact full-curl receipt is reconstructible and binds its exact compiler and domain',async()=>{
  const receipt=await actualFullCurlCertificateFromProgram(p);
  assert.equal(receipt.pass,true);assert.equal(receipt.curlRows.length,6);assert.equal(receipt.divergenceRows.length,2);
  assert.match(receipt.graph.sha256,/^[a-f0-9]{64}$/);assert.equal(receipt.graph.graphIncluded,false);
  assert.ok(receipt.divergenceRows.every(r=>r.domainMembershipCertified===false&&r.premises.every(c=>c.pass)));
  const bytes=Buffer.byteLength(JSON.stringify(receipt));assert.ok(bytes<8*1024*1024);
  console.log(JSON.stringify({schema:'MathScope.ActualFullCurlSourceExecution/1',pass:true,sourceProfile:receipt.sourceProfile,
    elapsedMs:performance.now()-start,nodeCount:receipt.graph.nodeCount,graphBytes:receipt.graph.serializedProgramBytes,receiptBytes:bytes,
    sha256:receipt.graph.sha256,peakRSSBytes:process.resourceUsage().maxRSS*1024,sourceChecks:receipt.checks,scope:receipt.scope,domain:receipt.domain,receipt}));
});
