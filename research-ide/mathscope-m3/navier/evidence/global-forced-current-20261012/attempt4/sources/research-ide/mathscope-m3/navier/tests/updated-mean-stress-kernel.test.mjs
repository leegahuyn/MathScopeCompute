import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {originalFullMeanOperators} from '../source-full-mean-equations.mjs';
import {reconstructUpdatedFullMeanPressure,exactNormalizedHaar} from '../source-updated-mean-pressure.mjs';
import {reconstructUpdatedMeanStress,exactHaarDerivativeFaces} from '../source-updated-mean-stress.mjs';
import {integratePolynomialControl,polynomialControlEqual as equal} from './exact-polynomial-integral-control.mjs';

function setup(){
  const G=new AuxiliarySourceExpressions(new ActualConvergentExpressions()),q=(n,d=1)=>G.q(n,d),
    [R,Z,T,...Y]=['R','Z','T','y0','y1'].map(n=>G.fresh(n)),phi=G.mul(q(1,3),G.pow(R,3)),
    geometry={R,Z,T,Y,vr:[q(2),q(-3)],vt:[q(3),G.one],epsilon:q(2,7),ci:q(11,5),
      radialPrimitive:phi,radialFast:G.derivative(phi,R),innerRadius:G.one,outerRadius:q(2)},
    background={b:G.mul(G.pow(R,3),Z),V:G.mul(G.pow(R,3),T),G:G.mul(G.pow(R,3),Z,T)},
    velocity={beta:G.mul(G.pow(R,3),Y[0],T),v:G.mul(G.pow(R,3),Y[1],G.pow(Z,2),G.pow(T,2)),
      gamma:G.mul(G.pow(R,3),Y[0],Y[1],G.pow(Z,2),G.pow(T,3))},
    covariance=Object.fromEntries(['rr','rtheta','rz','thetatheta','thetaz','zz'].map((n,j)=>
      [n,G.mul(q(j+1),G.pow(R,4),G.add(Y[0],G.mul(T,Y[1])))])),
    stress=[G.mul(G.pow(R,3),Z),G.mul(G.pow(R,3),T)],
    input={geometry,background,velocity,covariance,stress,rho:G.add(G.one,G.mul(R,Z)),chi:G.mul(R,G.add(G.one,G.mul(Z,T)))},
    stage=reconstructUpdatedFullMeanPressure(G,input),target=reconstructUpdatedMeanStress(G,{geometry,stage});
  return {G,q,R,Z,T,Y,geometry,input,stage,target};
}

test('updated stress binds all latest full mean equations, covariance, old stress and pressure',()=>{
  const {G,stage,target,geometry}=setup();assert.ok(target.checks.every(x=>x.pass));
  for(const n of ['P','Jtheta','Jz','Etheta','Ez'])assert.equal(target.meanInput[n],stage.mean[n]);
  assert.equal(target.meanInput.pressure,stage.pressure.value);assert.equal(target.meanInput.fullOriginalStress,stage.mean.fullOriginalStress);
  assert.equal(target.meanInput.fullCovariance,stage.mean.fullAngularCovariance);
  assert.equal(target.targets[0],G.mul(geometry.epsilon,G.derivative(stage.mean.Jtheta,geometry.Z)));
  assert.equal(target.targets[1],G.mul(geometry.epsilon,G.derivative(G.add(stage.mean.Jz,G.mul(target.cRho,stage.mean.P)),geometry.Z)));
  assert.equal(target.sourceAuthenticated,false);assert.equal(target.completeFourStepCycle,false);
  assert.equal(target.genericConservationPeriodicityAndShellSupportAssumed,false);
});

test('both weighted compact stress primitives agree with independent polynomial integration and keep their actual cutoff errors',()=>{
  const {G,R,geometry,target}=setup(),{De}=originalFullMeanOperators(G,geometry);
  for(const row of target.rows){
    const value=integratePolynomialControl(G,row.value),actual=De(value,row.weight);
    assert.equal(equal(G,actual,row.expectedDivergence),true,row.name);
    assert.equal(equal(G,actual,row.weightedDivergence),true,row.name);
    assert.equal(equal(G,row.cutoffRemainder,G.zero),false,row.name+' cutoff is nonzero in the generic control');
    assert.equal(equal(G,actual,G.neg(row.source)),false,row.name+' omission must fail');
    assert.equal(equal(G,row.integrals.whole,row.exactLinearity.expandedWhole),true,row.name);
    assert.equal(row.cutoffRemainderDeclaredZero,false);assert.equal(row.compactSupportEstablished,false);
    assert.equal(G.freeCoordinates(row.integrals.whole).has(R),false);
  }
});

test('integrated mean compatibility retains every nonzero conservation, radial endpoint and torus face term',()=>{
  const {G,target}=setup();
  for(const row of target.rows){
    const c=row.compatibility;
    assert.equal(equal(G,c.difference,c.remainder),true,row.name+' complete integrated momentum identity');
    for(const name of ['slowTime','axialViscosity','radialBoundary','fastTimeFaces','radialTorusFaces']){
      assert.equal(equal(G,c.terms[name],G.zero),false,row.name+' '+name+' is retained');
      assert.equal(equal(G,c.difference,G.sub(c.remainder,c.terms[name])),false,row.name+' missing '+name);
    }
    assert.equal(c.boundaryOrMomentRemaindersDeclaredZero,false);
  }
  const z=target.rows[1].compatibility;
  assert.equal(equal(G,z.terms.pressureMoment,G.zero),false);
  assert.equal(equal(G,z.difference,G.sub(z.remainder,z.terms.pressureMoment)),false);
});

test('rho normalization and the moving c_rho times P product remain explicit independent conditions',()=>{
  const {G,Z,geometry,stage,target}=setup();
  assert.equal(equal(G,target.rhoMass,G.one),false);
  for(const row of target.rows){
    assert.equal(equal(G,row.integrals.whole,G.sub(row.moment,row.target)),false,'rho mass cannot silently become1');
    assert.equal(equal(G,row.integrals.whole,G.sub(row.moment,G.mul(target.rhoMass,row.target))),true);
  }
  const dropped=G.mul(geometry.epsilon,G.add(G.derivative(stage.mean.Jz,Z),G.mul(target.cRho,G.derivative(stage.mean.P,Z))));
  assert.equal(equal(G,target.targets[1],dropped),false,'partial_Z c_rho term is nonzero');
});

test('Haar derivative FTC verifies both faces and does not grant periodicity to arbitrary inputs',()=>{
  const G=new AuxiliarySourceExpressions(new ActualConvergentExpressions()),Y=[G.fresh('y0'),G.fresh('y1')],
    body=G.mul(G.pow(Y[0],3),G.add(Y[1],G.pow(Y[1],2)));
  for(const j of [0,1]){
    const face=exactHaarDerivativeFaces(G,body,Y,j);
    assert.equal(equal(G,face.value,exactNormalizedHaar(G,G.derivative(body,Y[j]),Y)),true);
    assert.equal(equal(G,face.value,G.zero),false);assert.equal(face.periodicFacesDeclaredEqual,false);
  }
  const matched=G.mul(Y[0],G.sub(G.one,Y[0]),G.pow(Y[1],2)),face=exactHaarDerivativeFaces(G,matched,Y,0);
  assert.equal(equal(G,face.value,G.zero),true,'matching faces cancel as a verified polynomial consequence');
});

test('a subsequent velocity update produces new complete residual targets and different stress primitives',()=>{
  const {G,R,Z,T,input,stage,target}=setup(),velocity={...input.velocity,v:G.add(input.velocity.v,G.mul(G.pow(R,3),Z,T)),
      gamma:G.add(input.velocity.gamma,G.mul(G.pow(R,3),G.pow(Z,2),T))},
    nextStage=reconstructUpdatedFullMeanPressure(G,{...input,velocity,tag:'subsequent_mean_pressure'}),
    next=reconstructUpdatedMeanStress(G,{geometry:input.geometry,stage:nextStage,tag:'subsequent_mean_stress'});
  assert.notEqual(next.meanInput.P,stage.mean.P);assert.notEqual(next.meanInput.Ez,stage.mean.Ez);
  for(let j=0;j<2;j++)assert.equal(equal(G,next.Sigma[j],target.Sigma[j]),false,'the actual updated stress changes');
  assert.equal(next.allPressureAndNonlinearMeanTermsRetained,true);
});

test('incomplete/stale mean pressure rows and moving outer limits are rejected by the original stress geometry',()=>{
  const {G,Z,Y,geometry,stage}=setup();
  assert.throws(()=>reconstructUpdatedMeanStress(G,{geometry,stage:{...stage,mean:{...stage.mean,Ez:G.zero}}}),{code:'INVALID_INPUT'});
  assert.throws(()=>reconstructUpdatedMeanStress(G,{geometry:{...geometry,outerRadius:G.add(geometry.outerRadius,Z)},stage}),{code:'INVALID_INPUT'});
  assert.throws(()=>reconstructUpdatedMeanStress(G,{geometry:{...geometry,ci:G.add(geometry.ci,Y[0])},stage}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactHaarDerivativeFaces(G,G.one,[Y[0],Y[0]],0),{code:'INVALID_INPUT'});
});
