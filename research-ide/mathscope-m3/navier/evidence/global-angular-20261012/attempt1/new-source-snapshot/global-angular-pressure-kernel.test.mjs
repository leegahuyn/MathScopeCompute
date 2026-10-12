import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {originalAngularNormalizationLedger,originalHomogeneousPrimaryPressure,attachGlobalInitialAngularState,assertGlobalInitialAngularState} from '../source-global-angular.mjs';
const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b)).pass;

test('the original homogeneous primary retains nonzero physical pressure and the moving-normal term',()=>{
  const G=new ActualConvergentExpressions(),q=n=>G.q(n),input={normal:[q(1),q(2),q(3)],nPrime:[q(-2),G.zero,q(-1)],
    K:[[G.zero,q(-6),G.zero],[q(8),G.zero,G.zero],[q(5),G.zero,G.zero]],k:q(5),amplitude:[q(2),q(-1),G.zero]},
    actual=originalHomogeneousPrimaryPressure(G,input),omitted=originalHomogeneousPrimaryPressure(G,{...input,nPrime:[G.zero,G.zero,G.zero]});
  assert.equal(equal(G,actual.value.imaginary,G.q(36,35)),true);
  assert.equal(actual.value.real,G.zero);assert.equal(actual.identity.pass,true);
  assert.equal(equal(G,actual.value.imaginary,omitted.value.imaginary),false);
  assert.equal(actual.homogeneousPrimaryNotForcedInverse,true);assert.equal(actual.sourceAuthenticated,false);
  assert.equal(actual.pressureOmitted,false);assert.equal(actual.cutoffTangencyPremiseRequired,true);
  assert.throws(()=>originalHomogeneousPrimaryPressure(G,{...input,nPrime:undefined}),{code:'INVALID_INPUT'});
});

test('each original physical residual route has exponent 2A+1/2 with h symbolic',()=>{
  const ledger=originalAngularNormalizationLedger();assert.equal(ledger.checks.length,6);assert.equal(ledger.pass,true);
  for(const row of ledger.checks){assert.deepEqual(row.twiceExponent,[3,4]);assert.equal(row.pass,true);}
  assert.equal(ledger.epsilonRatio,'epsilon_ref/epsilon_label=ratio^h');assert.equal(ledger.binary64SourceH,false);
  assert.equal(ledger.sourceAuthenticated,false);
});

test('generic pressure or serialized flags cannot obtain the private original all-label angular seal',()=>{
  assert.throws(()=>attachGlobalInitialAngularState({scope:{actualAllAuxiliaryModesRetained:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertGlobalInitialAngularState({scope:{actualOriginalInitialAngularFieldConstructed:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
