import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareActualPhysicalFullCurlProgram,assertActualPhysicalFullCurlProgram,actualPhysicalFullCurlCertificateFromProgram} from '../actual-physical-full-curl.mjs';
import {assertActualFullCurlProgram} from '../actual-full-curl.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

// Genuine source construction, once. This is a large graph; coordinate its
// execution with other source/Worker tests. No toy source can enter here.
const start=performance.now(),p=prepareActualPhysicalFullCurlProgram({ellExact:'1',terms:0},{
  onProgress:row=>console.error(JSON.stringify({schema:'MathScope.PhysicalCurlSourceProgress/1',elapsedMs:performance.now()-start,...row}))
}),{G,operator:o}=p;
const same=(a,b,atoms=[])=>sourceGraphRationalIdentity(G,G.sub(a,b),{atomicNodes:atoms,maxTerms:40000}).pass;
const stage=(name)=>console.error(JSON.stringify({schema:'MathScope.PhysicalCurlSourceTestProgress/1',elapsedMs:performance.now()-start,stage:name}));

test('physical source binds the original slow cutoff, both sign rectangles and actual curl',()=>{
  stage('test-source-bindings-start');
  assert.equal(assertActualPhysicalFullCurlProgram(p),true);assert.equal(assertActualFullCurlProgram(p.local),true);
  stage('test-source-bindings-seals-done');
  assert.ok(p.checks.every(c=>c.pass));assert.equal(p.rows.length,2);assert.equal(p.assembly.candidateCount,81);
  assert.equal(p.geometry.palette.paletteSize,2250);
  for(const row of p.rows){
    const original=p.local.rows.find(r=>r.sign===row.sign);
    assert.ok(row.joined.checks.every(c=>c.pass));assert.ok(row.joined.full.divergence.checks.every(c=>c.pass));
    const atoms=[p.slowCutoff.value,...original.curl.potential];
    assert.ok(row.joined.full.potential.every((x,j)=>same(x,G.mul(p.slowCutoff.value,original.curl.potential[j]),atoms)));
    assert.ok(row.joined.commutator.some(x=>x!==G.zero));
  }
  assert.equal(p.slowCutoff.actualDerivativeBodiesMaterialized,true);
  assert.equal(p.slowCutoff.derivativesOfIntegerReselectionUsed,false);
  assert.deepEqual(p.slowCutoff.materializedFirstDerivatives,p.slowCutoff.firstBodyDerivatives);
  stage('test-source-bindings-done');
});

test('original physical map eliminates auxiliary coordinates and keeps conjugate factors and pressure',()=>{
  stage('test-conjugates-start');
  const half=G.q(1,2);
  for(const row of p.rows){
    const positive=row.conjugates[0],negative=row.conjugates[1];
    assert.equal(positive.harmonic,1);assert.equal(negative.harmonic,-1);
    for(let j=0;j<3;j++){
      assert.equal(same(positive.velocity[j].real,G.mul(half,row.joined.full.leading[j])),true);
      assert.equal(same(positive.velocity[j].imaginary,G.neg(negative.velocity[j].imaginary)),true);
      assert.equal(same(positive.potential[j].imaginary,G.neg(negative.potential[j].imaginary)),true);
    }
    stage('test-conjugates-velocity-'+row.sign+'-done');
    assert.equal(same(positive.pressure.imaginary,G.neg(negative.pressure.imaginary)),true);
    const pressureNode=G.nodes[row.pressureImaginary];assert.equal(pressureNode.op,'actual_expression_partial');
    assert.equal(G.expressionSystems[pressureNode.args[0]].body,row.rawPressureImaginary);
    stage('test-conjugates-pressure-'+row.sign+'-done');
    const f=o.families.find(r=>r.sign===row.sign);assert.equal(row.originalPhaseDefect,f.fullEikonalRemainder);
    assert.deepEqual(row.originalPressureImaginaryRow,f.frame.pressureImaginaryRow);
    for(const root of [...row.physicalPotential,...row.physicalVelocity,row.physicalPressure]){
      const free=G.freeCoordinates(root);assert.equal(free.has(o.cutoffs.xi),false);assert.equal(free.has(o.coordinates.v),false);
      assert.ok(p.auxiliary.Yi.every(y=>!free.has(y)));
    }
  }
  stage('test-conjugates-done');
});

test('one actual member is not copied to other candidates or promoted to positive/global residual',()=>{
  stage('test-domain-start');
  assert.equal(p.assembly.actualPulseInstancesGenerated,1);assert.equal(p.assembly.otherCandidatePulsesMaterialized,false);
  assert.equal(p.assembly.paletteSeparationExercisedBandCertified,false);
  for(const key of ['actualAllLabelPulseFamilyConstructed','exercisedBandPositiveWeightsCertified','globalDivergenceCertified','allFixedOrderFlatExtensionsCertified','fullPhysicalResidualAndFlatErrorPackageComplete','numericalPhysicalVelocityEnclosed','actualSourceAnalyticLeanTheorem'])assert.equal(p.scope[key],false,key);
  assert.equal(p.domain.positiveWeightDomainMembershipCertified,false);
  stage('test-domain-done');
});

test('source guard refuses copies, edited commutator rows and altered compiler metadata',()=>{
  stage('test-tamper-start');
  assert.throws(()=>assertActualPhysicalFullCurlProgram({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const old=p.rows[0].joined.commutator[0];p.rows[0].joined.commutator[0]=G.zero;
  assert.throws(()=>assertActualPhysicalFullCurlProgram(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
  p.rows[0].joined.commutator[0]=old;assert.equal(assertActualPhysicalFullCurlProgram(p),true);
  const compiler=p.program.compiler;p.program.compiler='external-injected-compiler';
  assert.throws(()=>assertActualPhysicalFullCurlProgram(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
  p.program.compiler=compiler;assert.equal(assertActualPhysicalFullCurlProgram(p),true);
  stage('test-tamper-done');
});

test('compact physical source certificate records the actual source graph and precise scope',async()=>{
  stage('test-certificate-start');
  const receipt=await actualPhysicalFullCurlCertificateFromProgram(p);
  assert.equal(receipt.pass,true);assert.equal(receipt.physicalRows.length,6);assert.equal(receipt.divergenceRows.length,2);
  assert.ok(receipt.divergenceRows.every(r=>!r.domainMembershipCertified&&r.premises.every(c=>c.pass)));
  assert.match(receipt.graph.sha256,/^[a-f0-9]{64}$/);
  console.log(JSON.stringify({schema:'MathScope.ActualPhysicalFullCurlSourceExecution/1',pass:true,elapsedMs:performance.now()-start,
    nodeCount:receipt.graph.nodeCount,graphBytes:receipt.graph.serializedProgramBytes,sha256:receipt.graph.sha256,
    peakRSSBytes:process.resourceUsage().maxRSS*1024,checks:receipt.checks,scope:receipt.scope,domain:receipt.domain,receipt}));
  stage('test-certificate-done');
});
