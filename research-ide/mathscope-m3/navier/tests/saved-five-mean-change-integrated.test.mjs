import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {openSavedInitializedSource} from '../source-saved-initialized-authority.mjs';
import {attachSavedInitializedNormFamily,constructSavedInitializedNormProgram} from '../source-saved-initialized-norm-family.mjs';
import {attachSavedInitializedCutoffAuthority} from '../source-saved-initialized-cutoff-norms.mjs';
import {attachSavedFiveMeanChangeNorms,assertSavedFiveMeanChangeNorms} from '../source-saved-five-mean-change-norms.mjs';
import {auditSavedFiveFastTime,assertSavedFiveFastTimeAudit} from '../source-saved-five-fast-time-audit.mjs';
import {attachSavedFiveMeanChangeIntegrated,assertSavedFiveMeanChangeIntegrated,savedFiveMeanChangeIntegratedCertificate} from '../source-saved-five-mean-change-integrated.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

let pending;
const lossless=x=>x===undefined?['undefined']:x===null||typeof x!=='object'?x:
  Array.isArray(x)?['array',x.map(lossless)]:['object',Object.keys(x).sort().map(k=>[k,lossless(x[k])])];
const encoded=x=>JSON.stringify(lossless(x)),observations=[],hash=x=>createHash('sha256').update(encoded(x)).digest('hex');
async function setup(){
  if(!pending)pending=(async()=>{
    const cap=await openSavedInitializedSource(),family=attachSavedInitializedNormFamily(cap),
      cutoff=await attachSavedInitializedCutoffAuthority(family),parent=constructSavedInitializedNormProgram(family,{order:4}),
      norm=attachSavedFiveMeanChangeNorms(cap,parent,cutoff,{order:2}),audit=auditSavedFiveFastTime(cap,cutoff);
    return {cap,cutoff,parent,norm,audit};
  })();
  return pending;
}
const integrate=(s,input={})=>attachSavedFiveMeanChangeIntegrated(s.cap,s.cutoff,s.norm,s.audit,input);

test('actual C0 and C2 integrations match the same source, whole increments and fast coordinates',async()=>{
  const s=await setup(),oldNorm=canonicalStringify(s.norm),oldAudit=encoded(s.audit);
  for(const order of [0,2]){
    const r=integrate(s,{order});assert.equal(assertSavedFiveMeanChangeIntegrated(r),true);
    assert.equal(r.source.sourceNodePrefixSHA256,s.cap.source.sourceNodePrefixSHA256);
    assert.deepEqual(r.sourceBinding.geometry,s.cutoff.bodies.geometry);
    assert.deepEqual(r.sourceBinding.incrementRoots,s.audit.analysis.roots);
    for(const name of ['beta','v','gamma']){
      assert.deepEqual(r.sourceBinding.identities[name],Object.fromEntries(['previous','increment','updated'].map(k=>[k,s.audit.sourceBinding.identities[name][k]])));
      assert.equal(r.sourceBinding.identities[name].increment,s.norm.sourceBinding.increment[name]);
    }
    assert.equal(r.rows.length,order+1);
    assert.equal(r.dependencyDigests.meanChangeNormSHA256,hash(s.norm));
    assert.equal(r.dependencyDigests.fastTimeAuditSHA256,hash(s.audit));
    observations.push(await savedFiveMeanChangeIntegratedCertificate(r));
  }
  assert.equal(canonicalStringify(s.norm),oldNorm);assert.equal(encoded(s.audit),oldAudit);
  assert.equal(assertSavedFiveMeanChangeNorms(s.norm),true);assert.equal(assertSavedFiveFastTimeAudit(s.audit),true);
});

test('integrated rows retain all 19 products, four slow groups and historical uncancelled rows',async()=>{
  const s=await setup(),r=integrate(s);
  for(const row of r.rows){
    assert.deepEqual(row.originalSlowNormRow,s.norm.rows[row.order]);
    assert.equal(Object.values(row.originalSlowNormRow.fluxProducts).reduce((n,group)=>n+Object.keys(group).length,0),19);
    assert.deepEqual(Object.keys(row.originalSlowNormRow.thetaTerms).sort(),['axial','radial','slowTime','viscous']);
    assert.deepEqual(Object.keys(row.originalSlowNormRow.zTerms).sort(),['axial','radial','slowTime','viscous']);
    assert.equal(row.originalSlowNormRow.fastTimeCancellationApplied,false);
    assert.equal(row.originalSlowNormRow.actualCutoffFlatnessInferred,false);
    assert.deepEqual(row.Etheta,s.norm.rows[row.order].Etheta);assert.deepEqual(row.Ez,s.norm.rows[row.order].Ez);
    assert.equal(row.fastTime.Etheta.exactZero,'0');assert.equal(row.fastTime.Ez.exactZero,'0');
    assert.equal(row.fastTime.Etheta.increment,s.norm.sourceBinding.increment.v);
    assert.equal(row.fastTime.Ez.increment,s.norm.sourceBinding.increment.gamma);
    assert.equal(row.fastTime.allExistingMixedPartialsThroughOrder,2);
    assert.equal(row.fastTime.conditionalOnOriginalDifferentiableOperatorDomain,true);
    assert.equal(row.originalDomainFastCancellationApplied,true);
    assert.equal(row.actualCutoffFlatnessInferred,false);
  }
  assert.deepEqual(r.dependencies.unchangedMeanChangeNorm,s.norm);
  assert.deepEqual(r.dependencies.unchangedIndependentFastTimeAudit,s.audit);
  assert.equal(r.dependencies.unchangedMeanChangeNorm.scope.newIndependentFastTimeZeroCheck,false);
  assert.equal(r.dependencies.unchangedIndependentFastTimeAudit.scope.fastTimeIntegratedIntoMeanNormCertificate,false);
});

test('the full old/new pressure, A0 endpoints and nonzero remainder identities remain bound',async()=>{
  const s=await setup(),r=integrate(s),p=r.sourceBinding.pressureDifference;
  assert.deepEqual(p,s.norm.sourceBinding.pressureDifference);
  assert.equal(p.old,s.audit.sourceBinding.oldFullPressure);assert.equal(p.new,s.audit.sourceBinding.newFullPressure);
  assert.notEqual(p.old,p.new);assert.equal(p.oldA0,s.audit.sourceBinding.oldA0);assert.equal(p.newA0,s.audit.sourceBinding.newA0);
  assert.deepEqual(p.oldEndpointTerms,s.norm.sourceBinding.pressureDifference.oldEndpointTerms);
  assert.deepEqual(p.newEndpointTerms,s.norm.sourceBinding.pressureDifference.newEndpointTerms);
  assert.deepEqual(r.sourceBinding.retainedNonlinearRemainders,s.cap.actualRoots.retainedRemainderDefects);
  assert.equal(r.demand.requiredIncrementVelocityOrder,4);
  assert.equal(r.demand.requiredFastTimeIncrementOrder,3);
  assert.equal(s.norm.parentNormRequest.order,4);
});

test('copied capabilities, cutoff, norm and passed audit records cannot issue private integration',async()=>{
  const s=await setup();
  for(const key of ['cap','cutoff','norm','audit'])assert.throws(()=>integrate({...s,[key]:structuredClone(s[key])}));
  for(const fake of [{status:'INDEPENDENCE_VERIFIED',analysis:{independent:true}},
    {...structuredClone(s.audit),pass:true},
    {source:s.cap.source,scope:{newIndependentFastTimeZeroCheck:true},status:'INDEPENDENCE_VERIFIED'}])
    assert.throws(()=>integrate({...s,audit:fake}));
});

test('mutated source hashes, actual roots, geometry and whole pressures invalidate the inherited authority',async()=>{
  const s=await setup(),changes=[
    n=>{n.source.sourceNodePrefixSHA256='0'.repeat(64);},
    n=>{n.sourceBinding.increment.v=0;},
    n=>{n.sourceBinding.velocityIdentities.gamma.increment=0;},
    n=>{n.sourceBinding.previous.v=n.sourceBinding.updated.v;},
    n=>{n.sourceBinding.geometry.Y=[0,1];},
    n=>{n.sourceBinding.geometry.ci=0;},
    n=>{n.sourceBinding.pressureDifference.old=n.sourceBinding.pressureDifference.new;},
    n=>{n.sourceBinding.pressureDifference.newA0=0;},
    n=>{n.sourceBinding.pressureDifference.oldEndpointTerms=[];},
    n=>{n.scope.newIndependentFastTimeZeroCheck=true;},
    n=>{n.rows[0].Etheta.constant=0;}];
  for(const change of changes){
    const norm=attachSavedFiveMeanChangeNorms(s.cap,s.parent,s.cutoff,{order:2});change(norm);
    assert.throws(()=>integrate({...s,norm}));
  }
});

test('insufficient output order and caller proof or completion overrides are rejected',async()=>{
  const s=await setup(),short=attachSavedFiveMeanChangeNorms(s.cap,s.parent,s.cutoff,{order:0});
  assert.throws(()=>integrate({...s,norm:short},{order:1}),{code:'RESOURCE_LIMIT'});
  for(const order of [-1,0.5,3,Number.MAX_SAFE_INTEGER,NaN])assert.throws(()=>integrate(s,{order}),{code:'RESOURCE_LIMIT'});
  for(const input of [{order:0,pass:true},{order:0,completeN6:true},{order:0,norm:0},{order:0,pressure:0},
    {order:0,sourceHash:s.cap.source.sourceNodePrefixSHA256},{order:0,proof:'caller says fast time is zero'}])
    assert.throws(()=>integrate(s,input),{code:'INVALID_SAVED_FIVE_MEAN_INTEGRATION'});
});

test('a genuinely budget-exhausted private actual audit cannot close the fast term',async()=>{
  const s=await setup(),audit=auditSavedFiveFastTime(s.cap,s.cutoff,{maxWork:1});
  assert.equal(assertSavedFiveFastTimeAudit(audit),true);
  assert.equal(audit.analysis.stopReason,'RESOURCE_LIMIT');assert.equal(audit.scope.newIndependentFastTimeZeroCheck,false);
  assert.throws(()=>integrate({...s,audit}),{code:'INVALID_SAVED_FIVE_MEAN_INTEGRATION'});
});

test('copied integrated certificates and modified attached scopes never become private authority',async()=>{
  const s=await setup(),r=integrate(s),certificate=await savedFiveMeanChangeIntegratedCertificate(r);
  assert.deepEqual(certificate.program,r);assert.match(certificate.graph.sha256,/^[a-f0-9]{64}$/);
  assert.equal(certificate.encoding.inheritedUndefinedPropertiesPreserved,true);
  assert.equal(createHash('sha256').update(JSON.stringify(certificate.losslessProgram)).digest('hex'),certificate.graph.sha256);
  const decode=x=>x===null||typeof x!=='object'?x:x[0]==='undefined'?undefined:
    x[0]==='array'?x[1].map(decode):Object.fromEntries(x[1].map(([k,v])=>[k,decode(v)]));
  assert.deepEqual(decode(certificate.losslessProgram),r);
  assert.equal(certificate.serializedCertificateIsNotPrivateSourceAuthority,true);
  assert.throws(()=>assertSavedFiveMeanChangeIntegrated(certificate.program),{code:'INVALID_SAVED_FIVE_MEAN_INTEGRATION'});
  for(const change of [v=>{v.scope.completeN6=true;},v=>{v.sourceBinding.pressureDifference.old=0;},
    v=>{v.sourceBinding.identities.v.increment=0;},v=>{v.rows[0].fastTime.Etheta.exactZero='1';}]){
    const copied=structuredClone(r);change(copied);
    assert.throws(()=>assertSavedFiveMeanChangeIntegrated(copied),{code:'INVALID_SAVED_FIVE_MEAN_INTEGRATION'});
  }
  assert.throws(()=>{r.scope.wholeM3Complete=true;},TypeError);
});

test('integration authority rechecks an original dependency after construction',async()=>{
  const s=await setup(),norm=attachSavedFiveMeanChangeNorms(s.cap,s.parent,s.cutoff,{order:0}),r=integrate({...s,norm});
  assert.equal(assertSavedFiveMeanChangeIntegrated(r),true);
  norm.sourceBinding.pressureDifference.new=norm.sourceBinding.pressureDifference.old;
  assert.throws(()=>assertSavedFiveMeanChangeIntegrated(r));
});

test('domain, source class, numerical norms and N6 M3 M4 completion remain uncertified',async()=>{
  const s=await setup(),r=integrate(s);
  assert.equal(r.scope.fastTimeIntegratedIntoMeanNormCertificate,true);
  assert.equal(r.scope.originalDomainFastCancellationApplied,true);
  assert.equal(r.calculus.premisesReprovedByThisAttachment,false);
  assert.equal(r.calculus.independentWholeSavedMeanDifferenceRecomputed,false);
  assert.equal(r.calculus.domainExistenceOrSourceClassCertified,false);
  assert.equal(r.calculus.newLeanProof,false);
  for(const key of ['historicalDependencyScopeRewritten','numericalNorms','sourceNormValuesNumericallyEvaluated',
    'smoothnessOrDomainProved','originalDomainExistenceProved','actualWholeMeanDifferenceRecomputed','leanKernelChecked',
    'initialHaarAndPositiveIBPCutoffCompositionApplied','actualHighOrderDerivativeBodiesMaterialized',
    'completeInitialTupleClassCertified','originalN601Complete','originalN602Complete','completeN6','wholeM3Complete','M4Accepted'])
    assert.equal(r.scope[key],false,key);
});

after(async()=>{
  if(process.env.M3_SAVED_FIVE_INTEGRATED_EVIDENCE&&observations.length)await writeFile(process.env.M3_SAVED_FIVE_INTEGRATED_EVIDENCE,
    JSON.stringify({schema:'MathScope.N6.SavedFiveMeanIntegratedObserved/1',certificates:observations,
      originalOperatorDomainAndSourceClassUncertified:true,numericalNorms:false,wholeM3Complete:false,M4Accepted:false},null,2)+'\n',{flag:'wx'});
});
