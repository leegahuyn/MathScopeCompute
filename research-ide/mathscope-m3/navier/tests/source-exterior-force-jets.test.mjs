import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {prepareActualExteriorForceJets,assertActualExteriorForceJets,actualExteriorForceJetsCertificate} from '../source-exterior-force-jets.mjs';
import {assertActualSourceLocalizationDomain,actualSourceLocalizationDomainCertificate} from '../source-localization-domain.mjs';

let sourcePromise,lastMemoryCheck=0;
function observe(extra={}){
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  process.stdout.write('# N7_EXTERIOR '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes})+'\n');
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)throw Object.assign(Error('The owned N7 process exceeded its memory gate.'),{code:'RESOURCE_LIMIT'});
}
function source(){return sourcePromise??=Promise.resolve().then(()=>{
  observe({stage:'n7-original-source-domain-and-exterior-start'});
  return prepareActualExteriorForceJets({orders:[0,1,2,3,4]},{onProgress:observe,checkCancelled:()=>{
    if(Date.now()-lastMemoryCheck>1000){lastMemoryCheck=Date.now();observe({stage:'n7-original-source-memory-checkpoint'});}
  }});
});}

test('reconstruct the original matched heat coefficient and source-bound terminal exterior forces',async()=>{
  const r=await source(),{G,localization}=r,heat=localization.inner.family.prepared.bootstrap.actualHeat;
  assert.equal(assertActualExteriorForceJets(r),true);assert.ok(r.checks.every(row=>row.pass));
  assert.equal(r.constants.originalExteriorAmplitude,heat.heat.exteriorAmplitude);
  assert.equal(r.constants.Xheat,heat.heat.Xb);assert.deepEqual(r.request.orders,[0,1,2,3,4]);
  assert.equal(r.sourceBinding.parameterExpressionSHA256,localization.sourceBinding.parameterExpressionSHA256);
  assert.equal(r.scope.originalHeatRestrictionOnly,true);assert.equal(r.scope.wholeFinalN6FieldConstructed,false);
  assert.equal(r.scope.actualNonzeroForceDivergenceConstructed,true);
  assert.ok(r.rows.every(row=>row.actualSourceAmplitudeUsed&&!row.numericalGlobalFieldFilledIn));
  observe({stage:'n7-original-source-exterior-and-domain-constructed',nodes:G.nodes.length});
});

test('the same common6 threshold instantiates all fixed Lemma9.7 domain prerequisites and the strict support margin',async()=>{
  const r=await source(),d=r.domainBridge,G=r.G;
  assert.equal(assertActualSourceLocalizationDomain(d),true);assert.equal(d.checks.length,12);assert.ok(d.checks.every(row=>row.pass));
  assert.equal(d.constants.qBig,r.localization.constants.qStar);assert.equal(d.constants.domainRatio,'1/64');
  assert.equal(d.constants.supportRatio,G.q(1,4));assert.equal(d.constants.strictSupportGap,G.q(1,4));
  assert.equal(d.initialPrerequisites.length,5);assert.ok(d.fixedMeanMap.checks.every(row=>row.pass));
  assert.equal(d.fixedMeanMap.source.actualImportedSourceExecuted,true);assert.equal(d.fixedMeanMap.exactSource.lambdaPositive,true);
  assert.equal(d.domainProof.sourceTheoremAppliedToExecutedInitialPremises,true);
  assert.equal(d.domainProof.unknownHistoricalGammaValueUsed,false);assert.equal(d.scope.fullN6FinalPotentialsConstructed,false);
  assert.equal(d.cutoffConclusions.actualNonzeroFinalN6FieldValuesComputed,false);
});

test('every actual finite jet keeps its improper pressure tail, tiny h, all cutoff terms and force divergence',async()=>{
  const r=await source(),G=r.G,h=r.constants.h,equal=(a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{atomicNodes:[h]}).pass;
  for(const row of r.rows){
    const x=row.expressions;
    assert.equal(equal(x.thetaNormalized,G.neg(G.mul(G.q(64),G.add(h,G.q(row.order))))),true);
    assert.equal(equal(G.add(x.lapPressureNormalized,x.divDivNormalized),x.divergenceNormalized),true);
    assert.equal(equal(x.radialNormalized,G.zero),false);assert.equal(equal(x.thetaNormalized,G.zero),false);
    assert.equal(row.midpoint.normalizedTheta.tinyHRetained,true);
    assert.equal(row.midpoint.normalizedDivergence.sign,'STRICTLY_NEGATIVE');
    assert.match(row.pressureJet,/integral_r\^infinity/);
  }
  assert.equal(r.cutoff.sourceCutoffChanged,false);assert.equal(r.cutoff.cutoffTermsDiscarded,false);
  assert.equal(r.globalExtension.forceAfterTerminalTimeConstructed,false);
  assert.equal(r.globalExtension.exteriorRowsSubstitutedForWholeFj,false);
  assert.equal(r.initialZeroBranch.activeNearTerminalWholeKEnergyComputed,false);
});

test('copied domain receipts and omitted premises, pressure terms or negative divergence cannot acquire source authority',async()=>{
  const r=await source(),d=r.domainBridge;
  assert.throws(()=>assertActualExteriorForceJets({...r}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualSourceLocalizationDomain({...d}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const premise=d.initialPrerequisites.pop();
  try{assert.throws(()=>assertActualSourceLocalizationDomain(d),{code:'INVALID_SOURCE_CONSTRUCTION'});}
  finally{d.initialPrerequisites.push(premise);}
  const saved=d.constants.supportRatio;try{d.constants.supportRatio=r.G.q(3,4);assert.throws(()=>assertActualSourceLocalizationDomain(d),{code:'INVALID_SOURCE_CONSTRUCTION'});}
  finally{d.constants.supportRatio=saved;}
  const pressure=r.rows[0].expressions.pressure;
  try{r.rows[0].expressions.pressure=r.G.zero;assert.throws(()=>assertActualExteriorForceJets(r),{code:'INVALID_SOURCE_CONSTRUCTION'});}
  finally{r.rows[0].expressions.pressure=pressure;}
  const sign=r.rows[0].midpoint.normalizedDivergence.sign;
  try{r.rows[0].midpoint.normalizedDivergence.sign='ZERO';assert.throws(()=>assertActualExteriorForceJets(r),{code:'INVALID_SOURCE_CONSTRUCTION'});}
  finally{r.rows[0].midpoint.normalizedDivergence.sign=sign;}
  assert.equal(assertActualExteriorForceJets(r),true);
});

test('export the exact original scalar force program and separately scoped final-domain prerequisite certificate',async()=>{
  const r=await source(),certificate=await actualExteriorForceJetsCertificate(r),domain=await actualSourceLocalizationDomainCertificate(r.domainBridge);
  assert.equal(certificate.verification.checksPass,true);assert.equal(domain.verification.checksPass,true);
  assert.equal(certificate.verification.actualFinalN6FieldsNumericallyEvaluated,false);assert.equal(certificate.verification.globalForceExtensionExecuted,false);
  assert.equal(certificate.scope.wholeKEnergyNearTerminalComputed,false);assert.equal(certificate.scope.wholeM3Complete,false);
  assert.equal(domain.scope.criterionAssessmentEdited,false);
  assert.ok(certificate.formulaProgram.nodes.length>29000);
  if(process.env.M3_N7_EXTERIOR_EVIDENCE)writeFileSync(process.env.M3_N7_EXTERIOR_EVIDENCE,JSON.stringify(certificate,null,2)+'\n');
  if(process.env.M3_N7_DOMAIN_EVIDENCE)writeFileSync(process.env.M3_N7_DOMAIN_EVIDENCE,JSON.stringify(domain,null,2)+'\n');
  observe({stage:'n7-original-source-exterior-and-domain-certificates-written'});
});
