import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {commonExteriorZeroAudit,commonCompletionSupportKernel,selectedAdmissibleBandArithmetic,prepareActualAdmissibleTerminalCovariance,attachActualAdmissibleTerminalCovariance,assertActualAdmissibleTerminalCovariance} from '../actual-admissible-terminal-covariance.mjs';

test('arbitrary-order completion bodies vanish by their exact common exterior branches',()=>{
  const p=commonCompletionSupportKernel(new ActualSourceExpressions());
  assert.equal(p.pass,true);assert.equal(p.rows.length,7);assert.ok(p.rows.every(x=>x.zero));
  assert.equal(p.arbitraryOrderAndInteriorBodies,true);assert.equal(p.actualSourceAuthenticated,false);
  assert.equal(p.finitePrefixExtrapolated,undefined);
});

test('support kernel rejects a bare compact primitive and a nonzero exterior change',()=>{
  const p=commonCompletionSupportKernel(new ActualSourceExpressions());
  assert.equal(p.negativeControls.length,2);assert.ok(p.negativeControls.every(x=>x.correctlyRejected));
  assert.equal(p.compactPrimitiveSetToZero,false);
});

test('a support endpoint must be in the separately supplied ordered set',()=>{
  const G=new ActualSourceExpressions(),X=G.fresh('X'),eta=G.fresh('eta'),left=G.q(1),right=G.q(2),inside=G.fresh('inside');
  const F=G.choose(X,left,right,inside,inside,G.zero);
  assert.equal(commonExteriorZeroAudit(G,{X,eta,endpoints:[right],roots:[F]}).pass,true);
  assert.equal(commonExteriorZeroAudit(G,{X,eta,endpoints:[G.q(3)],roots:[F]}).pass,false);
  assert.equal(commonExteriorZeroAudit(G,{X,eta,endpoints:[right],roots:[G.add(F,G.one)]}).pass,false);
});

test('the endpoint ordering and the source are not proved by the generic reducer',()=>{
  const G=new ActualSourceExpressions(),X=G.fresh('X'),eta=G.fresh('eta'),r=G.q(2),F=G.choose(X,G.one,r,G.one,G.one,G.zero);
  const p=commonExteriorZeroAudit(G,{X,eta,endpoints:[r],roots:[F]});
  assert.equal(p.endpointOrderProvedHere,false);assert.equal(p.actualSourceAuthenticated,false);
});

test('the exact selected-band buffer puts the entire q band eightfold below qstar',()=>{
  const p=selectedAdmissibleBandArithmetic();assert.equal(p.pass,true);assert.ok(p.rows.every(x=>x.pass));
  assert.equal(p.rows.find(x=>x.id==='whole-physical-band-qstar-ratio').pass,true);
  assert.equal(p.hugeDyadicIntegerMaterialized,false);assert.equal(p.actualSourceAuthenticated,false);
});

test('generic objects cannot issue an actual selected source certificate',()=>{
  assert.throws(()=>attachActualAdmissibleTerminalCovariance({sourceProfile:'actual',pass:true}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualAdmissibleTerminalCovariance({decision:{actualPositiveWeightsOnDeclaredTerminalDomain:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('external fields, bands, bounds, Gamma guesses and completion flags are rejected before construction',()=>{
  for(const input of [{F:1},{ellExact:'1000'},{ellMinimum:8},{qbig:'1e-100'},{sourceNorm:1},{wholeGPOSComplete:true},[]])
    assert.throws(()=>prepareActualAdmissibleTerminalCovariance(input),{code:'INVALID_INPUT'});
});
