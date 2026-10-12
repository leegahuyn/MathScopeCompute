import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {runLatticeObservation,inspectLatticeSelection} from '../lattice-observation.mjs';
import {runWilsonFlow} from '../wilson-flow.mjs';

const lattice={Ns:2,Nt:4,as:.5,at:.5,spatialBoundary:'PERIODIC',temporalBoundary:'PERIODIC',lengthUnit:'ell0',origin:[0,0,0,0]};
const a={label:'configuration A',lattice,initial:{kind:'SEEDED_EXPONENTIAL',seed:'m3-discrete-a'}},b={label:'configuration B',lattice,initial:{kind:'SEEDED_EXPONENTIAL',seed:'m3-discrete-b'}};

test('Y6-02 actual lattice slice selection returns original links, coordinate and clover F',async()=>{
 const r=await runLatticeObservation({sources:[a],observation:'SLICE',timeIndex:2});const selected=await inspectLatticeSelection(r,0,0);
 assert.equal(r.states[0].points.length,8);assert.equal(selected.coordinate[3],1);assert.equal(selected.members.length,1);assert.equal(selected.members[0].positiveLinks.length,4);assert.equal(selected.members[0].F.length,6);assert.ok(selected.members[0].positiveLinks.every(l=>l.matrix.n===2));
 await assert.rejects(runLatticeObservation({sources:[a],timeIndex:.5}),{code:'INVALID_PARAMETER'});
 await assert.rejects(runLatticeObservation({sources:[{...a,expectedSourceHash:'f'.repeat(64)}]}),{code:'LATTICE_SOURCE_HASH_MISMATCH'});
});

test('Y6-03 discrete marginal includes at, average divides Nt, ensemble mean preserves configuration fibres',async()=>{
 const marginal=await runLatticeObservation({sources:[a],observation:'MARGINAL'}),average=await runLatticeObservation({sources:[a],observation:'AVERAGE'});
 marginal.states[0].points.forEach((p,i)=>assert.ok(Math.abs(p.value-lattice.at*lattice.Nt*average.states[0].points[i].value)<1e-12));assert.equal(marginal.states[0].points[0].unit,'ell0^-3');assert.equal(average.states[0].points[0].unit,'ell0^-4');
 const singles=await runLatticeObservation({sources:[a,b],observation:'SLICE'}),mean=await runLatticeObservation({sources:[a,b],observation:'ENSEMBLE_MEAN'});mean.states[0].points.forEach((p,i)=>assert.equal(p.value,(singles.states[0].points[i].value+singles.states[1].points[i].value)/2));
 const selected=await inspectLatticeSelection(mean,0,0);assert.equal(selected.members.length,2);assert.equal(selected.coordinate.kind,'CONFIGURATION_FIBRE');assert.ok(selected.members.every(m=>m.coefficient===.5));
 await assert.rejects(runLatticeObservation({sources:[a,{...b,beta:2}],observation:'ENSEMBLE_MEAN'}),{code:'ENSEMBLE_MODEL_MISMATCH'});
});

test('Y6-03 saved actual independent-chain links retain exact source identity in a new observation',async()=>{
 const saved=JSON.parse(await readFile(new URL('../evidence/ensemble-production-attempt2.json',import.meta.url),'utf8')),row=saved.calibration[0],sources=row.replicas.map(r=>({label:r.start,group:row.model.group,lattice:row.lattice,beta:row.beta,initial:{kind:'EXPLICIT_LINKS',links:r.finalConfiguration.links},expectedModelHash:row.modelHash,expectedSourceHash:r.finalConfiguration.sourceHash,provenance:{kind:'ACTUAL_WILSON_CHAIN_FINAL_CONFIGURATION',sampleHash:row.sampleHash,replica:r.replicaIndex,seed:r.seed}}));
 const r=await runLatticeObservation({sources,observation:'ENSEMBLE_MEAN',baseObservation:'MARGINAL'});assert.equal(r.source.records[0].sourceHash,row.replicas[0].finalConfiguration.sourceHash);assert.ok(r.states[0].points.every(p=>p.sourceMembers.length===2*row.lattice.Nt));
 await writeFile(new URL('../evidence/lattice-chain-marginal-mean.json',import.meta.url),JSON.stringify(r,null,2)+'\n');
});

test('Y6-05 nonstationary full Wilson flow decreases action, preserves source and commutes with gauge transformation',async()=>{
 const r=await runWilsonFlow({source:a,flowTime:.02,steps:16});assert.equal(r.flow.sourceOverwritten,false);assert.notEqual(r.flow.originalSourceHash,r.flow.flowedSourceHash);assert.ok(r.flow.originalLinkChange>1e-3);assert.ok(r.flow.flowedAction<r.flow.originalAction);
 assert.ok(r.flow.history.every((p,i)=>i===0||p.action<=r.flow.history[i-1].action+1e-10));assert.ok(r.flow.derivativeCheck.passed);assert.ok(r.flow.gaugeCovariance.passed);assert.ok(r.flow.gaugeCovariance.maximumRelativeLinkResidual<1e-10);assert.equal(r.states[0].interpretation,'ORIGINAL_UNFLOWED');assert.equal(r.states[1].interpretation,'NUMERICALLY_FLOWED');assert.equal(r.flow.error.certifiedGlobalError,false);
 const selected=await inspectLatticeSelection(r,1,0);assert.equal(selected.members[0].sourceHash,r.flow.flowedSourceHash);
 await writeFile(new URL('../evidence/wilson-flow-su2.json',import.meta.url),JSON.stringify(r,null,2)+'\n');
});

test('Y6-05 halving the Lie-Euler step improves the finite source comparison',async()=>{
 const coarse=await runWilsonFlow({source:a,flowTime:.01,steps:8}),fine=await runWilsonFlow({source:a,flowTime:.01,steps:16});assert.ok(fine.flow.error.maximumLinkDifference<coarse.flow.error.maximumLinkDifference);assert.ok(fine.flow.error.actionDifference<coarse.flow.error.actionDifference);
 await assert.rejects(runWilsonFlow({source:a,flowTime:2,steps:4}),{code:'FLOW_STEP_TOO_LARGE'});
});

test('Y6-04 / Y6-05 compact G2 uses its entire actual Lie metric and all 14 force directions',async()=>{
 const group={family:'G2',parameter:2,globalForm:'ADJOINT',representation:'REAL_7'},r=await runWilsonFlow({source:{group,lattice:{...lattice,Nt:2},label:'Full compact G2 links'},flowTime:.005,steps:4});
 assert.equal(r.source.records[0].links.find(Boolean).n,7);assert.equal(r.flow.derivativeCheck.rows.length,42);assert.ok(r.flow.derivativeCheck.passed);assert.ok(r.flow.gaugeCovariance.passed);assert.ok(r.flow.flowedAction<r.flow.originalAction);assert.equal(r.continuumGap,'OPEN_CONTINUUM');
 await writeFile(new URL('../evidence/wilson-flow-g2.json',import.meta.url),JSON.stringify(r,null,2)+'\n');
});

test('Y6-02 incomplete open clover stencils are explicit omissions, never zeros',async()=>{
 await assert.rejects(runLatticeObservation({sources:[{...a,lattice:{...lattice,Nt:2,spatialBoundary:'OPEN',temporalBoundary:'OPEN'}}],quantity:'topologicalDensity'}),{code:'NO_COMPLETE_OBSERVATION_STENCIL'});
});
