import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {originalPhysicalResidualAlgebraAudit,exactCovarianceResidualExpansion,exactSignedCovarianceInverse,exactPhysicalMomentumSplit} from '../actual-physical-residual-algebra.mjs';

test('independent full covariance and physical momentum expansions retain all defects',()=>{
 const p=originalPhysicalResidualAlgebraAudit();assert.equal(p.pass,true);
 assert.ok(p.covariance.checks.every(c=>c.pass));assert.ok(p.momentum.checks.every(c=>c.pass));
 assert.ok(p.covariance.diagnosticOmissions.withoutSquare.every(c=>!c.pass));
 assert.ok(p.covariance.diagnosticOmissions.withoutEarlier.every(c=>!c.pass));
 assert.ok(p.signed.diagnosticOmissions.omittedHalf.every(c=>!c.pass));
 assert.equal(p.actualResidualFlatnessProved,false);
});

test('signed increments use the fixed positive background amplitudes and retain their square',()=>{
 const G=new ActualConvergentExpressions(),q=n=>G.q(n),p=exactSignedCovarianceInverse(G,{H:[[q(1),q(1)],[q(-1),q(1)]],amplitudes:[q(2),q(3)],epsilon:q(1),target:[q(-4),q(2)]});
 assert.ok(p.checks.every(c=>c.pass));assert.notEqual(p.square[0],G.zero);
 assert.equal(p.targetMayHaveEitherSign,true);assert.equal(p.originalPositiveAmplitudesRemainFixed,true);
});

test('pure new velocity keeps a nonzero same-label square even without earlier fields',()=>{
 const G=new ActualConvergentExpressions(),q=n=>G.q(n),z=[G.zero,G.zero,G.zero],P=[q(2),q(3),q(5)],p=exactCovarianceResidualExpansion(G,{primary:z,previous:z,linearIncrement:P,curlRemainder:z,target:[G.zero,G.zero]});
 assert.deepEqual(p.newSquare,[q(6),q(10)]);assert.ok(p.checks.every(c=>c.pass));
});

test('Cartesian convection uses derivative direction as the second gradient index',()=>{
 const G=new ActualConvergentExpressions(),q=n=>G.q(n),z=[q(0),q(0),q(0)],Z=[z,z,z],u=[q(2),q(3),q(5)],w=[q(7),q(11),q(13)],Dw=[[q(1),q(2),q(3)],[q(4),q(5),q(6)],[q(7),q(8),q(9)]],
 p=exactPhysicalMomentumSplit(G,{background:u,backgroundGradient:Z,backgroundTime:z,backgroundLaplacian:z,backgroundPressureGradient:z,wave:w,waveGradient:Dw,waveTime:z,waveLaplacian:z,wavePressureGradient:z});
 assert.deepEqual(p.backgroundTransportsWave,[q(23),q(53),q(83)]);assert.deepEqual(p.waveSelfAdvection,[q(68),q(161),q(254)]);
 assert.ok(p.checks.every(c=>c.pass));
});

test('incomplete operands and injected completion flags are rejected',()=>{
 const G=new ActualConvergentExpressions();assert.throws(()=>exactPhysicalMomentumSplit(G,{}));
 assert.throws(()=>exactCovarianceResidualExpansion(G,{sourceAuthenticated:true}));
 assert.throws(()=>exactSignedCovarianceInverse(G,{H:[[G.one]]}));
});
