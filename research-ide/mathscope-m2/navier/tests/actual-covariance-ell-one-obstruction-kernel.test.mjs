import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {ellOneCovarianceObstructionArithmetic,ellOneCovarianceReducedODEAudit,ellOneSourceScalarIdentity,attachActualEllOneCovarianceObstruction,assertActualEllOneCovarianceObstruction,prepareActualEllOneCovarianceObstruction} from '../actual-covariance-ell-one-obstruction.mjs';

test('exact rational bounds retain strict margins and no actual-source claim',()=>{
  const a=ellOneCovarianceObstructionArithmetic();assert.equal(a.pass,true);assert.ok(a.rows.every(x=>x.pass));
  assert.equal(a.rows[0].upper,'16385/131072');assert.equal(a.rows[1].upper,'17/262144');
  assert.equal(a.actualSourceAuthenticated,false);assert.equal(a.heatAndHNumericallyEvaluated,false);
});

test('the actual moving-frame constructor reduces to the stated closed ODE',()=>{
  const a=ellOneCovarianceReducedODEAudit(new ActualSourceExpressions());assert.ok(a.checks.every(x=>x.pass));
  assert.equal(a.checks.length,10);assert.equal(a.sourceBoundByCaller,false);
  assert.equal(a.negativeControl.correctlyRejected,true);assert.equal(a.negativeControl.check.pass,false);
});

test('source scalar comparison handles bound integral alpha renaming',()=>{
  const G=new ActualSourceExpressions(),x=G.fresh('x'),y=G.fresh('y'),a=G.parameter('h');
  const left=G.integral(G.mul(G.exp(G.neg(x)),G.pow(x,2),a),x,G.zero,G.one);
  const right=G.integral(G.mul(a,G.mul(G.pow(y,2),G.exp(G.neg(y)))),y,G.zero,G.one);
  assert.equal(ellOneSourceScalarIdentity(G,left,right).pass,true);
});

test('source scalar comparison rejects changed signs, limits and free variables',()=>{
  const G=new ActualSourceExpressions(),x=G.fresh('x'),y=G.fresh('y'),z=G.fresh('z');
  const a=G.integral(G.mul(x,z),x,G.zero,G.one),b=G.integral(G.mul(y,z),y,G.zero,G.one);
  assert.equal(ellOneSourceScalarIdentity(G,a,b).pass,true);
  assert.equal(ellOneSourceScalarIdentity(G,a,G.neg(b)).pass,false);
  assert.equal(ellOneSourceScalarIdentity(G,a,G.integral(G.mul(y,z),y,G.zero,G.q(2))).pass,false);
  assert.equal(ellOneSourceScalarIdentity(G,a,G.integral(G.mul(y,x),y,G.zero,G.one)).pass,false);
});

test('generic data and copied-looking objects cannot certify an actual obstruction',()=>{
  assert.throws(()=>attachActualEllOneCovarianceObstruction({decision:{uniformTheoremNonmembershipProved:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualEllOneCovarianceObstruction({proof:'all tests passed'}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('caller fields, coordinates, bands and completion flags are rejected before source construction',()=>{
  for(const input of [{F:1},{h:0},{ellExact:'1'},{delta:'1/4'},{wholeGPOSComplete:true},[]])
    assert.throws(()=>prepareActualEllOneCovarianceObstruction(input),{code:'INVALID_INPUT'});
});
