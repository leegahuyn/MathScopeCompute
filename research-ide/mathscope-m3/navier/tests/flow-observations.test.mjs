import test from 'node:test';
import assert from 'node:assert/strict';
import {fourierSpace,integrateGalerkin} from '../galerkin.mjs';
import {angularVelocityZ,buildFlowObservations,computeFlowPaths,coefficientHistory,flowEnergyObservation} from '../flow-observations.mjs';

const T=2*Math.PI;
const tg=integrateGalerkin({cutoff:2,endTime:.5});

test('saved accepted states preserve endpoints and do not change the integrator',()=>{
  const without=integrateGalerkin({cutoff:2,endTime:.5,storeStates:false});
  assert.deepEqual(tg.final,without.final);
  assert.equal(tg.stateHistory.frames.length,tg.acceptedSteps+1);
  assert.deepEqual(tg.stateHistory.frames[0].coefficients,tg.initial);
  assert.deepEqual(tg.stateHistory.frames.at(-1).coefficients,tg.final);
  assert.equal(computeFlowPaths(without).status,'STREAMLINES_ONLY_MISSING_TIME_STATES');
  assert.ok(computeFlowPaths(without).paths.every(p=>p.kind==='INSTANTANEOUS_STREAMLINE'));
});

test('RK4 streamline and particle path match independently solvable Taylor-Green axis motion',()=>{
  const S=fourierSpace(2),at=6*S.index.get('1,1,0')+1,frames=tg.stateHistory.frames;
  // At x2=x3=0 the ODE is x1'=a(t)sin(x1). Its separable exact solution
  // depends only on the integral of a(t), also for the recorded linear interpolant.
  const integral=frames.slice(1).reduce((s,f,i)=>s+(f.time-frames[i].time)*(-4*f.coefficients[at]-4*frames[i].coefficients[at])/2,0);
  const expectedParticle=2*Math.atan(Math.tan(Math.PI/8)*Math.exp(integral));
  const expectedStream=2*Math.atan(Math.tan(Math.PI/8)*Math.exp(-4*tg.final[at]*tg.lastResolvedTime));
  const paths=computeFlowPaths(tg,{seeds:[[Math.PI/4,0,0]]}).paths;
  const particle=paths.find(p=>p.kind==='PARTICLE_PATH'),stream=paths.find(p=>p.kind==='INSTANTANEOUS_STREAMLINE');
  assert.ok(Math.abs(particle.points.at(-1).unwrappedPosition[0]-expectedParticle)<1e-9);
  assert.ok(Math.abs(stream.points.at(-1).unwrappedPosition[0]-expectedStream)<1e-9);
  assert.ok(expectedParticle-expectedStream>.08);
  assert.ok(stream.points.every(p=>p.time===tg.lastResolvedTime));
  assert.equal(particle.points[0].time,0);
  assert.equal(particle.points.at(-1).time,tg.lastResolvedTime);
  assert.equal(particle.refinement.rigorousErrorEnclosure,false);
});

test('angular velocity uses the declared axis and leaves the axis undefined',()=>{
  assert.equal(angularVelocityZ([1,0,0],[0,2,0]).value,2);
  assert.equal(angularVelocityZ([2,1,4],[0,3,0],[1,1,0]).value,3);
  const axis=angularVelocityZ([0,0,7],[0,2,1]);
  assert.equal(axis.value,null);assert.equal(axis.status,'UNDEFINED_ON_AXIS');assert.equal(axis.isVorticity,false);
});

test('core and global integrals have independent quadrature and Parseval checks',()=>{
  const e=flowEnergyObservation(tg);
  assert.ok(e.global.parsevalDifference<1e-13);
  assert.ok(Math.abs(e.global.spatialMean-.25*Math.exp(-2))<3e-6);
  assert.ok(Math.abs(e.core.fine.integral/e.global.integral-1/8)<1e-12);
  assert.notEqual(e.global.scope,e.core.scope);
  assert.equal(e.core.rigorousErrorEnclosure,false);
  assert.equal(e.originalPaperWholeSpaceEnergy,false);
});

test('constant mean flow preserves unwrapped trajectories across periodic seams',()=>{
  const S=fourierSpace(1),u=[...S.zero()];u[6*S.meanIndex]=1;
  const run=integrateGalerkin({cutoff:1,initial:u,endTime:.1});
  const o=buildFlowObservations(run,{seeds:[[T-.01,.5,.5]]});
  for(const p of o.paths){const last=p.points.at(-1);assert.ok(Math.abs(last.unwrappedPosition[0]-(T+.09))<1e-12);assert.ok(Math.abs(last.position[0]-.09)<1e-12);}
  assert.ok(Math.abs(o.energy.global.integral-T**3/2)<1e-12);
  assert.equal(o.contract.coordinateSystems.periodic_box.scale,1/T);
  assert.equal(o.contract.automaticSpatialFit,false);
  assert.equal(o.contract.automaticVectorNormalization,false);
});

test('changed endpoints, missing interval and unordered accepted states are rejected',()=>{
  for(const change of [r=>r.stateHistory.frames[0].coefficients[0]=1,r=>r.stateHistory.frames[0].time=.1,r=>r.stateHistory.frames[1].time=0]){
    const r=structuredClone(tg);change(r);assert.throws(()=>coefficientHistory(r));
  }
  assert.throws(()=>buildFlowObservations(tg,{coreBounds:[[-1,1],[0,1],[0,1]]}));
});

test('bounded frame decimation is explicit and retains the actual time endpoints',()=>{
  const r=integrateGalerkin({cutoff:2,endTime:.2,initialStep:.01,fixedStep:true,maxStateFrames:4});
  assert.equal(r.stateHistory.status,'DECIMATED_ACCEPTED_STATES');
  assert.ok(r.stateHistory.frames.length<=4);assert.ok(r.stateHistory.discardedFrames>0);
  assert.equal(r.stateHistory.frames[0].time,0);assert.equal(r.stateHistory.frames.at(-1).time,r.lastResolvedTime);
  const p=computeFlowPaths(r);assert.equal(p.status,'EXECUTED_BOTH_PATH_TYPES');
  assert.equal(p.timeStates.rigorousTemporalEnclosure,false);
});
