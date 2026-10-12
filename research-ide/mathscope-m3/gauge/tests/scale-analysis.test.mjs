import test from 'node:test';
import assert from 'node:assert/strict';
import {crossing,fitPeriodicCosh,compareLimits} from '../scale-analysis.mjs';
import {finiteWilsonVacuumAudit,vacuumNegativeControls,vacuumDifferenceCorrelators} from '../vacuum.mjs';
import {studyModel,normalizeStudy} from '../scale-study.mjs';
import {effectiveMass} from '../spectral.mjs';

test('SU2 reference crossing rejects absent or multiple crossings and does not adjust the target threshold',()=>{
 assert.equal(crossing([{t:0,t2E:0},{t:1,t2E:.2}]).value,.5);
 assert.equal(crossing([{t:0,t2E:0},{t:1,t2E:.05}]).value,null);
 assert.equal(crossing([{t:0,t2E:0},{t:1,t2E:.2},{t:2,t2E:.05},{t:3,t2E:.2}]).status,'MULTIPLE_CROSSINGS_UNRESOLVED');
});
test('periodic cosh fit recovers a known independent curve and rejects nonpositive values without abs or clipping',()=>{
 const Nt=16,m=.72,A=.3,data=Array.from({length:Nt},(_,t)=>A*(Math.exp(-m*t)+Math.exp(-m*(Nt-t)))),errors=data.map(()=>.001),fit=fitPeriodicCosh(data,errors,Nt,[1,5]);assert.equal(fit.status,'FINITE_WINDOW_FIT_ACCEPTABLE');assert.ok(Math.abs(fit.mass-m)<1e-7);
 const bad=data.slice();bad[3]=-.01;assert.equal(fitPeriodicCosh(bad,errors,Nt,[1,5]).mass,null);assert.equal(bad[3],-.01);
 const acosh=effectiveMass([2,3,2],1,{periodic:true});assert.equal(acosh[1].coshEffectiveMass,null);assert.equal(acosh[1].coshStatus,'INVALID_ACOSH_ARGUMENT');
});
test('finite pure-Wilson vacuum applicability cannot be promoted for a restricted sector, fermion factor, negative beta or extra action',async()=>{
 const model=studyModel({beta:2.3,Ns:6,Nt:12}),ok=await finiteWilsonVacuumAudit(model);assert.equal(ok.uniqueVacuumEstablished,true);assert.equal(ok.newLeanKernelRun,false);assert.equal(ok.thermal.excitedWeightBound.status,'VACUOUS_FOR_VACUUM_ISOLATION');assert.equal(ok.finiteGap.uniformInVolume,false);
 for(const bad of [{...model,sectorRestrictions:['fixed-topology']},{...model,fermions:true},{...model,beta:-1},{...model,extraTerms:['theta']},{...model,representationCutoff:8}]){const r=await finiteWilsonVacuumAudit(bad);assert.equal(r.status,'NOT_APPLICABLE');assert.equal(r.uniqueVacuumEstablished,false);}
});
test('full vacuum difference removes a whole degenerate zero-energy block and preserves the positive-energy multiplier',()=>{
 assert.ok(vacuumNegativeControls().every(c=>c.passed));const Nt=12,E=.7,A=.3,offset=12,raw=Array.from({length:Nt},(_,t)=>[[offset+A*(Math.exp(-E*t)+Math.exp(-E*(Nt-t)))]]),r=vacuumDifferenceCorrelators(raw);
 for(const p of r.rows.filter(p=>p.lag>=2&&p.lag<=Nt-2)){const t=p.lag,expected=2*(Math.cosh(E)-1)*A*(Math.exp(-E*t)+Math.exp(-E*(Nt-t)));assert.ok(Math.abs(p.matrix[0][0]-expected)<1e-13);}
});
test('thermal transitions can fall below the global ground gap: no unconditional effective-mass inequality is asserted',()=>{
 const E=[0,1,1.1],Nt=8,O=[[0,.001,0],[.001,0,100],[0,100,0]],Z=E.reduce((s,e)=>s+Math.exp(-Nt*e),0),C=Array.from({length:Nt},(_,t)=>E.reduce((s,em,m)=>s+E.reduce((v,en,n)=>v+Math.exp(-(Nt-t)*em-t*en)*O[m][n]**2/Z,0),0)),mass=effectiveMass(C,1,{periodic:true});assert.ok(mass[3].coshEffectiveMass<.11);assert.ok(mass[3].coshEffectiveMass<E[1]);
});
test('reference scale beta and fixed quantities cannot silently change while comparing limits',()=>{
 assert.throws(()=>normalizeStudy({models:[{id:'bad',role:'CALIBRATION',targetDelta:1,beta:2.2,Ns:4,Nt:8,referenceScaleId:'reference-beta2.1'}]}),/exactly the same bare beta/);
 const row={id:'a',role:'T_SWEEP',beta:2.3,Ns:6,Nt:12,targetDelta:1,referenceScaleId:'s',scale:{aOverSqrtT0:1.3},channel:{referenceMass:{value:1.2,uncertainty:{standardError:.1}}},chainHashes:['first','second']},r=compareLimits([row,{...row,id:'b',Nt:16,beta:2.4}]);assert.equal(r.temporal.status,'MISMATCHED_SWEEP');assert.equal(r.spacing.extrapolation.status,'EXTRAPOLATION_WITHHELD');assert.equal(r.continuumGap.claim,false);
});
