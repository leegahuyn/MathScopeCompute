import test from 'node:test';
import assert from 'node:assert/strict';
import {actualLeadingEnlargedC2,actualExteriorHeatC2Arithmetic,importActualPositiveNorm} from '../actual-leading-enlarged-c2.mjs';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';

const actual=actualLeadingEnlargedC2();
test('enlarged C2 derives from actual same-source fields and full terminal heat',()=>{
  assert.equal(actual.pass,true);assert.ok(Object.values(actual.checks).every(Boolean));
  assert.equal(actual.actualExterior.positiveEtaIndependentAmplitude,true);
  assert.match(actual.actualExterior.heightMeaning,/not to Aext alone/);
});
test('the inner, closed annulus and terminal heat regions cover the stated domain',()=>{
  assert.deepEqual(actual.bounds.F0.domain.X,['Xa/2','2*Xb']);
  assert.deepEqual(actual.regions.map(x=>x.interval),[['Xa/2','Xplus'],['Xa','Xb'],['Xb','2*Xb']]);
  assert.match(actual.bounds.F0.derivativeConvention,/total order<=2/);
});
test('the heat norm is a continuous Gamma-moment and chain-rule computation',()=>{
  const a=actualExteriorHeatC2Arithmetic();
  assert.deepEqual(a.gammaDerivativeUpper,[1,2,12]);
  assert.deepEqual(Object.values(a.field),[1,6,8,72,120,200]);
  assert.ok(a.pass);assert.equal(2*Math.max(...Object.values(a.field)),400);
});
test('missing mixed-chain and power-prefactor terms are detected',()=>{
  const a=actualExteriorHeatC2Arithmetic(),{H}= {H:a.gammaDerivativeUpper};
  assert.notEqual(H[2]*a.heatArgumentJets.y*a.heatArgumentJets.eta,a.heat.yeta);
  assert.notEqual(a.heat.yy,a.field.yy);
  assert.notEqual(a.heat.etaeta,0);
});
test('physical derivatives retain the lower falling-Euler term',()=>{
  assert.match(actual.physicalConversion,/Dy\^2-Dy/);
  assert.equal(3**2-3,3*(3-1));assert.notEqual(3**2,3*(3-1));
});
test('all norm operands can be imported without a field-value oracle',()=>{
  const G=new ActualSourceExpressions(),id=importActualPositiveNorm(G,actual.normProgram,actual.roots.F0OrdinaryC2);
  assert.ok(G.nodes[id]);assert.ok(G.nodes.every(n=>!['coordinate','definite_integral','source_norm','source_field'].includes(n.op)));
  assert.throws(()=>importActualPositiveNorm(G,{nodes:[{op:'source_norm',args:['unknown']}]},0),/explicit arithmetic/);
});
test('caller-supplied bounds, source mutation and cancellation are rejected',()=>{
  for(const v of [null,{F0:1},{R:10},{sourceProfile:'fixture'}])assert.throws(()=>actualLeadingEnlargedC2(v));
  assert.throws(()=>actualLeadingEnlargedC2({},{checkCancelled(){throw Error('cancelled');}}),/cancelled/);
});
test('enlarged finite leading C2 is not a completed covariance or all-order heat claim',()=>{
  assert.equal(actual.scope.actualEnlargedAnnulusLeadingC2Bounded,true);
  for(const key of ['arbitraryGlobalF0AllOrders','completedPositiveOrderBackgroundBoundedHere','actualGeneralProjectedODEBuiltHere','actualUniformHColumnsCertified','sourceUniformQStarCertified','originalN506Complete'])assert.equal(actual.scope[key],false);
});
