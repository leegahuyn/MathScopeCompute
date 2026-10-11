import test from 'node:test';
import assert from 'node:assert/strict';
import {allOrderMixedGaussianJetPowerAudit,stableMixedVolterraPowerRecurrence} from '../actual-all-order-gaussian-jet-kernel.mjs';
import {homogeneousPulseGaussianPowerAudit} from '../actual-pulse-gaussian-power-kernel.mjs';

test('the original frame operation DAG retains nonzero slow profile derivatives',()=>{
 const p=allOrderMixedGaussianJetPowerAudit({order:3}),old=homogeneousPulseGaussianPowerAudit({order:3});
 assert.equal(p.pass,true);assert.equal(p.rows.length,old.rows.length);
 for(const name of ['original F','original F_R','original G_R']){
  assert.deepEqual(old.rows.find(r=>r.label===name).powers,[1,null,null,null,null]);
  assert.deepEqual(p.rows.find(r=>r.label===name).powers,[1,1,1,1,1]);
 }
 assert.equal(p.rows.find(r=>r.label==='original n_0').powers[3]>0,true);
 assert.equal(old.rows.find(r=>r.label==='original n_0').powers[3],null);
 for(let j=0;j<=3;j++)assert.ok(p.powers.t[j]>=old.powers.t[j]);
});

test('Duhamel length is necessary for an actual slow-sensitive homogeneous ODE',()=>{
 // w'=z*w, w(0)=1 at z=0, 0<=v<=S=4, |z|<=1/S.
 // Propagator <=e; d_z^m w at v=S is S^m, so a missing length
 // factor would incorrectly bound the first derivative by one at W=1.
 const p=stableMixedVolterraPowerRecurrence({matrixPowers:[0,0,null,null],order:3});
 assert.equal(p.rows[0].slowPower,1);assert.equal(p.rows[0].integrationLengthPower,1);
 const B=2,S=4,W=Math.E;
 for(let m=0;m<=3;m++)assert.ok(S**m<=W**(m+1)*(B*S)**p.powers[m]);
 assert.ok(S>1);assert.equal(p.exponentialInBandIntroduced,false);
});

test('mixed derivative subset coefficients keep the entire product rule',()=>{
 const p=stableMixedVolterraPowerRecurrence({matrixPowers:[2,3,4,5],order:3});
 assert.deepEqual(p.rows[2].slowTerms.map(r=>r.binomial),['3','3','1']);
 assert.deepEqual(p.rows[2].fastTerms.map(r=>r.binomial),['1','2','1']);
 assert.ok(p.rows[2].slowTerms.every(r=>r.solutionOrder<3));
 assert.ok(p.rows[2].fastTerms.every(r=>r.solutionOrder<3));
});

test('arbitrary finite order uses a resource budget and the same analytic threshold',()=>{
 const p=allOrderMixedGaussianJetPowerAudit({order:17,maxWork:20000});
 assert.equal(p.powers.t.length,18);assert.ok(p.powers.t.every(Number.isSafeInteger));
 assert.equal(p.orderDependentQThresholdRequired,false);assert.equal(p.sourceAuthenticated,false);
 assert.throws(()=>allOrderMixedGaussianJetPowerAudit({order:17,maxWork:4}));
});

test('no caller field, derivative or source completion flag is accepted',()=>{
 for(const extra of [{sourceAuthenticated:true},{matrixPowers:[0]},{C:0},{initialSlowDerivative:0}])
  assert.throws(()=>allOrderMixedGaussianJetPowerAudit({order:2,...extra}));
 assert.throws(()=>stableMixedVolterraPowerRecurrence({matrixPowers:[0],order:2}));
});
