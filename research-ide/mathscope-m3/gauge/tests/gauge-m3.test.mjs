import test from 'node:test';
import assert from 'node:assert/strict';
import {runGaugeM3,finiteTransferCertificate,inspectFieldSelection,discreteScalarObservation,effectiveMass,gevp,convertLatticeMass,connectedCorrelators,registerAssumptions,projectionClaimContract,projectionCounterexample,revisionImpact,exportGaugeSession,importGaugeSession,replayGaugeSession,auditProofSources} from '../index.mjs';
import {sha256} from '../contracts.mjs';
import {PINNED_GAUGE_SOURCES} from '../proof-data.mjs';

test('Y5-01 declared bounds preserve field hashes; units preserve physical source',async()=>{
 for(const mode of ['DECLARED_LOWER_BOUND','UNITS_RESCALING']){
  const r=await runGaugeM3({kind:'field-family',mode,deltas:[1,2],sampleCount:3});assert.equal(r.states[0].sourceHash,r.states[1].sourceHash);assert.deepEqual(r.states[0].probe.A,r.states[1].probe.A);assert.equal(r.states[0].spectral,null);
 }
 const a=await runGaugeM3({kind:'field-family',mode:'DECLARED_LOWER_BOUND',deltas:[1,2],sampleCount:3});assert.notEqual(a.states[0].assumptionHash,a.states[1].assumptionHash);
 const b=await runGaugeM3({kind:'field-family',mode:'DECLARED_LOWER_BOUND',deltas:[3,4],sampleCount:3});assert.equal(a.original.sourceHash,b.original.sourceHash);assert.deepEqual(a.original.sampleHashes,b.original.sampleHashes);assert.equal(a.representation.observationHash,b.representation.observationHash);assert.notEqual(a.assumptionRevisionHash,b.assumptionRevisionHash);
 const u=await runGaugeM3({kind:'field-family',mode:'UNITS_RESCALING',deltas:[1,2],sampleCount:3});assert.equal(u.states[0].sampleHash,u.states[1].sampleHash);assert.equal(u.states[1].displaySamples[13].value/u.states[0].displaySamples[13].value,16);assert.deepEqual(u.states[1].displaySamples[0].position,u.states[0].displaySamples[0].position.map(x=>x/2));
 await assert.rejects(runGaugeM3({kind:'field-family',deltas:[0]}),{code:'INVALID_PARAMETER'});
 await assert.rejects(runGaugeM3({kind:'field-family',energyUnit:''}),{code:'MISSING_PROVENANCE'});
 await assert.rejects(runGaugeM3({kind:'field-family',mode:'EMPIRICAL_ENSEMBLE_ESTIMATE'}),{code:'DELTA_MODE'});
});
test('Y5-02 actual full-basis perturbation changes A/F, scales and off-shell residual',async()=>{
 const r=await runGaugeM3({kind:'field-family',deltas:[1,2],epsilon:.1,sampleCount:3});assert.notEqual(r.states[0].sourceHash,r.states[1].sourceHash);assert.notDeepEqual(r.states[0].probe.A,r.states[1].probe.A);assert.notDeepEqual(r.states[0].probe.F,r.states[1].probe.F);assert.equal(r.states[0].rho,2*r.states[1].rho);assert.ok(r.states.every(s=>s.probe.equations.yangMillsFrobenius>1e-6));
});
test('Y5-03 positive finite spectral envelope and sign rejection',async()=>{
 const r=await runGaugeM3({kind:'finite-spectrum',delta:1,offsets:[0,1,3],weights:[1,.4,.2]});assert.equal(r.exactGapInDefinedModel,1);assert.ok(r.samples.every(s=>s.correlation<=s.upperBound+1e-14));assert.equal(r.fieldSpectrumConnection.quantumYMReconstruction,false);
 await assert.rejects(runGaugeM3({kind:'finite-spectrum',weights:[1,-1,2]}),{code:'POSITIVE_CHANNEL_WEIGHTS'});await assert.rejects(runGaugeM3({kind:'finite-spectrum',offsets:[-1,0,1]}),{code:'SPECTRAL_OFFSETS'});
});
test('Y5-03 / Y5-04 hbar restores energy units and a missing overlap does not remove a level',async()=>{
 const r=await runGaugeM3({kind:'finite-spectrum',delta:2,offsets:[0,1,2],weights:[1,0,0],hbar:2,at:.25,timeCount:9});assert.ok(Math.abs(r.effectiveMass[0].logEffectiveMass-2)<1e-12);assert.equal(r.effectiveMass[1].time,.25);
 const absent=await runGaugeM3({kind:'finite-spectrum',delta:1,offsets:[0,2],weights:[0,1],hbar:2});assert.equal(absent.exactGapInDefinedModel,1);assert.equal(absent.declaredDeltaIsExactGap,true);assert.equal(absent.canonicalChannelObservesDeclaredDelta,false);assert.equal(absent.observedChannelMinimum,3);
});
test('Y5-03 periodic image uses canonical weights independently of edited GEVP vectors',async()=>{
 const r=await runGaugeM3({kind:'finite-spectrum',delta:1,offsets:[0,1],weights:[1,.5],operatorVectors:[[2,3]],at:.5,timeCount:5,periodicTime:2});
 for(const p of r.samples){const forward=Math.exp(-p.time)+.5*Math.exp(-2*p.time),backward=Math.exp(-(2-p.time))+.5*Math.exp(-2*(2-p.time));assert.ok(Math.abs(p.displayCorrelation-forward-backward)<1e-14);assert.ok(Math.abs(p.periodicImageTerm-backward)<1e-14);assert.notEqual(p.correlationMatrix[0][0],p.displayCorrelation);}
});
test('Y5-04 / Y6-06 center densities scale by 16 and analytic marginal by 8 with one color scale',async()=>{
 const slice=await runGaugeM3({kind:'field-family',deltas:[1,2],sampleCount:3});const center=13;assert.ok(Math.abs(slice.states[1].points[center].value/slice.states[0].points[center].value-16)<1e-10);assert.equal(slice.classicalAction.values[0],slice.classicalAction.values[1]);
 const margin=await runGaugeM3({kind:'field-family',deltas:[1,2],sampleCount:3,observation:'INFINITE_BPST_MARGINAL'});assert.ok(Math.abs(margin.states[1].points[center].value/margin.states[0].points[center].value-8)<1e-10);assert.equal(slice.representation.sharedScale.max,Math.max(...slice.states.flatMap(s=>s.points.map(p=>p.value))));assert.equal(slice.quantumHamiltonianScaling.status,'NOT_INFERRED');
});
test('Y5-04 independently sourced lattice-to-physical mass conversion',()=>{
 const scale={atPhysical:.1,hbarC:.2,energyUnit:'E',lengthUnit:'L',sourceId:'independent-scale',sourceHash:'a'.repeat(64),independentOfTarget:true};assert.equal(convertLatticeMass(.5,scale).value,1);assert.throws(()=>convertLatticeMass(.5,{...scale,independentOfTarget:false}),{code:'INDEPENDENT_SCALE'});
});
test('Y5-05 / Y5-06 new seeded Wilson chains replay and raw connected correlations recompute',async()=>{
 const request={kind:'ensemble-family',calibration:[{delta:1,beta:.4},{delta:2,beta:.8}],sampler:{samples:32,burnIn:8,maxLag:16},bootstrap:{replicates:32,binSize:8},seed:'m3-regression-new-chains'};
 const r=await runGaugeM3(request);assert.notEqual(r.calibration[0].sampleHash,r.calibration[1].sampleHash);assert.notEqual(r.calibration[0].modelHash,r.calibration[1].modelHash);
 for(const row of r.calibration){
  assert.deepEqual(row.replicas.map(x=>x.start),['COLD','HOT_HAAR']);assert.ok(row.replicas.every(x=>x.proposals>0&&x.accepted>0&&x.finalConfiguration.links.length>0));
  const samples=row.replicas.flatMap(x=>x.samples),Nt=row.lattice.Nt,mean=samples.flatMap(x=>x.operators).reduce((s,x)=>s+x[0],0)/(samples.length*Nt);
  const oracle=Array.from({length:Nt},(_,lag)=>samples.reduce((s,x)=>s+x.operators.reduce((v,p,t)=>v+p[0]*x.operators[(t+lag)%Nt][0],0),0)/(samples.length*Nt)-mean*mean);
  oracle.forEach((v,t)=>assert.ok(Math.abs(v-row.correlator.matrices[t][0][0])<1e-13));assert.deepEqual(connectedCorrelators(samples,Nt).matrices,row.correlator.matrices);
  assert.ok(row.targetComparison.every(x=>x.targetEqualityForced===false));assert.equal(row.continuumGap,'OPEN_CONTINUUM');
 }
 const bundle=await exportGaugeSession(r);assert.equal((await replayGaugeSession(bundle)).status,'MATCH');
 await assert.rejects(runGaugeM3({...request,scaleSetting:{kind:'EXTERNAL_MEASURED_SCALE',independentOfTarget:true,sourceId:'declared-measurement',sourceHash:'a'.repeat(64),spacingInPhysicalUnits:.1,hbarC:.2,physicalEnergyUnit:'E',physicalLengthUnit:'L',beta:.4}}),{code:'SCALE_MODEL_MISMATCH'});
});
test('Y5-06 nonpositive correlators and invalid acosh arguments remain invalid',()=>{
 const a=effectiveMass([1,-.2,.1,0],.5,{periodic:true});assert.equal(a[1].coshEffectiveMass,null);assert.equal(a[1].coshStatus,'NONPOSITIVE_CORRELATION');
 const b=effectiveMass([1,2,1],1);assert.equal(b[1].coshArgument,.5);assert.equal(b[1].coshEffectiveMass,null);assert.equal(b[1].coshStatus,'INVALID_ACOSH_ARGUMENT');
});
test('Y5-07 GEVP recovers known finite energies and refuses a singular reference',()=>{
 const g=gevp([[Math.exp(-.5),0],[0,Math.exp(-1)]],[[1,0],[0,1]],.5);assert.ok(Math.abs(g.energies[0]-1)<1e-12);assert.ok(Math.abs(g.energies[1]-2)<1e-12);assert.equal(gevp([[1,0],[0,0]],[[1,0],[0,0]],1).status,'SINGULAR_OR_NONPOSITIVE_REFERENCE');
});
test('Y5-07 / Y7-03 exact transfer controls every nonvacuum mode including degenerate vacuum',async()=>{
 const r=await finiteTransferCertificate();assert.equal(r.checks.fullVacuumRemoved,true);assert.equal(r.gap.conservativeExactRationalLower,'1/2');
 await assert.rejects(finiteTransferCertificate({diagonal:['1','1','1/2'],vacuumIndices:[0]}),{code:'INCOMPLETE_VACUUM_SPACE'});
 const d=await finiteTransferCertificate({diagonal:['1','1','1/2'],vacuumIndices:[0,1]});assert.equal(d.vacuumDimension,2);
 assert.match(d.scope,/C\^3/);
 await assert.rejects(finiteTransferCertificate({ratioUpper:'1'}),{code:'TRANSFER_POSITIVITY'});
 await assert.rejects(finiteTransferCertificate({at:'0'}),{code:'TRANSFER_POSITIVITY'});
 await assert.rejects(finiteTransferCertificate({ratioUpper:'1/3'}),{code:'RATIO_BOUND_REJECTED'});
});
test('Y6-01 selection returns original 4D coordinates and actual A/F',async()=>{
 const r=await runGaugeM3({kind:'field-family',deltas:[1],sampleCount:3,slice:.25});const s=inspectFieldSelection(r,0,13);assert.deepEqual(s.coordinate,[0,0,0,.25]);assert.equal(s.original.A.length,4);assert.equal(s.original.F.length,4);assert.equal(s.sourceHash,r.states[0].sourceHash);
});
test('Y6-02 / Y6-03 BPST slice, finite marginal, tail and average retain exact semantics',async()=>{
 const slice=await runGaugeM3({kind:'field-family',deltas:[1],sampleCount:3});assert.ok(slice.states[0].points.every(p=>Math.abs(p.value-p.reference)<1e-12));
 const m=await runGaugeM3({kind:'field-family',deltas:[1],sampleCount:3,observation:'MARGINAL',panels:64});const p=m.states[0].points[13];assert.ok(p.reference.absoluteFiniteQuadratureError<1e-8);assert.ok(p.error.tail.omittedPositiveTailEstimate<=p.error.tail.upperBoundFloat);assert.equal(p.unit,'ell0^-3');
 assert.equal(discreteScalarObservation([1,2,3],.5,'MARGINAL').value,3);assert.equal(discreteScalarObservation([1,2,3],.5,'AVERAGE').value,2);assert.equal(discreteScalarObservation([1,2,3],.5,'ENSEMBLE_MEAN').axis,'CONFIGURATION_INDEX');
});
test('Y6-04 / Y6-05 gauge-invariant density, 4D loop distinction and separate flow observation',async()=>{
 const base=await runGaugeM3({kind:'field-family',deltas:[1],sampleCount:3}),flow=await runGaugeM3({kind:'field-family',deltas:[1],sampleCount:3,flowTime:.2});const s=base.states[0];assert.ok(s.gaugeCheck.pass);assert.ok(s.gaugeCheck.componentChange>1e-5);assert.ok(s.loop.notIdenticalInGeneral);assert.equal(s.sourceHash,flow.states[0].sourceHash);assert.notEqual(s.flow.derivedObservationHash,flow.states[0].flow.derivedObservationHash);assert.equal(flow.states[0].flow.sourceOverwritten,false);
 await assert.rejects(runGaugeM3({kind:'field-family',epsilon:.1,flowTime:1}),{code:'GENERAL_FLOW_NOT_IMPLEMENTED'});
});
test('Y6-07 distinct real 4D sources have the same whole scalar slice; unsupported transfer rejected',async()=>{
 const r=await projectionCounterexample();assert.equal(r.sliceMaximumDifference,0);assert.ok(r.offSlice.different);assert.notEqual(r.sourceA.hash,r.sourceB.hash);
 assert.throws(()=>projectionClaimContract({claimType:'CONDITIONAL_4D_PROPERTY',domain:'R4',observable:'q',projection:'first-three'}),{code:'FIBRE_OR_RECONSTRUCTION_REQUIRED'});
 assert.throws(()=>projectionClaimContract({claimType:'CONDITIONAL_GAP_TRANSFER',domain:'R4',observable:'q',projection:'first-three',spectrumInclusion:{direction:'OBSERVED_SUBSET_ORIGINAL'}}),{code:'FULL_SPECTRUM_INCLUSION_REQUIRED'});
});
test('Y6-08 / Y7-08 replay actually recomputes; rehashed false data cannot gain authority',async()=>{
 const r=await runGaugeM3({kind:'field-family',deltas:[1],sampleCount:3}),bundle=await exportGaugeSession(r,{selectedState:0,selectedPoint:13});assert.equal((await importGaugeSession(bundle)).proofVerified,false);assert.equal((await replayGaugeSession(bundle)).status,'MATCH');
 const tampered=structuredClone(bundle);tampered.payload.result.states[0].points[0].value+=1;await assert.rejects(importGaugeSession(tampered),{code:'SESSION_HASH_MISMATCH'});tampered.payloadHash=await sha256(tampered.payload);assert.equal((await replayGaugeSession(tampered)).status,'MISMATCH');
 const old={mode:'EXPLICIT_EFFECTIVE_MODEL',deltas:[1],camera:0};assert.equal(revisionImpact(old,{...old,camera:1}).proofStale,false);assert.equal(revisionImpact(old,{...old,deltas:[2]}).proofStale,true);assert.equal(revisionImpact({mode:'DECLARED_LOWER_BOUND',deltas:[1]},{mode:'DECLARED_LOWER_BOUND',deltas:[2]}).originalFieldStale,false);
});
test('Y7-01 / Y7-02 preserved exact sources and new kernel audit distinguish user axioms',async()=>{
 const r=await auditProofSources();assert.equal(r.status,'PINNED_KERNEL_AUDIT_MATCH');assert.equal(r.legacyCoreTen.axiomFreeCount,10);assert.equal(r.audit.newFiniteCustomAxiomCount,0);assert.ok(r.audit.commands.every(c=>c.expectedOutcomeObserved));assert.equal(r.audit.commands.filter(c=>c.expected==='REJECT').length,10);assert.equal(r.newKernelExecution,false);
 const source=PINNED_GAUGE_SOURCES.find(s=>s.path.endsWith('FiniteSpectral.lean'));assert.equal((await auditProofSources({[source.path]:source.content+'\n-- changed\n'})).status,'UNVERIFIED_SOURCE_CHANGED');
 assert.equal(r.realFiniteKernel.status,'KERNEL_CHECKED_REAL_FINITE_SCOPES');assert.equal(r.realFiniteKernel.targets.length,8);assert.equal(r.realFiniteKernel.hypothesisRemovalControls.length,9);assert.ok(r.realFiniteKernel.hypothesisRemovalControls.every(c=>c.expectedRejectionObserved));assert.deepEqual(r.realFiniteKernel.customAxioms,[]);assert.equal(r.realFiniteKernel.environment.importedModuleCount,3439);assert.equal(r.realFiniteKernel.newBrowserKernelExecution,false);
 const realSource=PINNED_GAUGE_SOURCES.find(s=>s.path.endsWith('RealSpectralBridge.lean')),realChanged=await auditProofSources({[realSource.path]:realSource.content+'\n-- changed\n'});assert.equal(realChanged.realFiniteKernel.status,'UNVERIFIED_SOURCE_CHANGED');assert.equal(realChanged.finiteKernelStatus,'FRESH_KERNEL_FINITE_AND_EXPLICIT_CONDITIONAL_PASS');
});
test('Y7-04 typed assumption registry rejects an existing positive energy below Delta and broad axioms',async()=>{
 const a={id:'gap1',semanticType:'DECLARED_GAP',modelId:'finite',group:'SU2',energyUnit:'ell0^-1',delta:1,quantifier:'FIXED_MODEL_FIXED_DELTA',origin:'USER',sourceRevision:'r1',sourceHash:'f'.repeat(64)};
 await assert.rejects(registerAssumptions([a],[{modelId:'finite',energyUnit:'ell0^-1',positiveEnergies:[.5,1]}]),{code:'CONFLICTING_GAP_ASSUMPTION'});
 await assert.rejects(registerAssumptions([{...a,semanticType:'ALL_PROPOSITIONS_TRUE'}]),{code:'BROAD_AXIOM_FORBIDDEN'});
 const r=await registerAssumptions([a],[{modelId:'finite',energyUnit:'ell0^-1',positiveEnergies:[1,2]}]);assert.equal(r.automaticExistenceTheorem,false);assert.deepEqual(r.conditionalConclusionRequires,['gap1']);
 await assert.rejects(registerAssumptions([{...a,semanticType:'UNIQUE_VACUUM'}]),{code:'SEMANTIC_QUANTIFIER_MISMATCH'});
 await assert.rejects(registerAssumptions([{...a,dependsOn:['missing']}]),{code:'MISSING_ASSUMPTION_DEPENDENCY'});
 await assert.rejects(registerAssumptions([{...a,dependsOn:['gap2']},{...a,id:'gap2',dependsOn:['gap1']}]),{code:'CYCLIC_ASSUMPTION_DEPENDENCY'});
});
test('Y7-06 / Y7-07 all continuum obligations stay open after finite success',async()=>{
 const r=await runGaugeM3({kind:'proof-audit'});assert.ok(r.continuumObligations.every(o=>o.status==='OPEN_CONTINUUM'));assert.equal(r.proofBoundary.clayProblemSolved,false);assert.equal(r.continuumGap,'OPEN_CONTINUUM');
 const ids=r.continuumObligations.map(o=>o.id);for(const required of ['YM-OS-OBSERVABLES','YM-OS-REGULARITY','YM-OS-EUCLIDEAN-SYMMETRY','YM-OS-POSITIVITY','YM-OS-CLUSTERING','YM-VACUUM','YM-OS-RECONSTRUCTION','YM-QFT-AXIOMS'])assert.ok(ids.includes(required));
});
