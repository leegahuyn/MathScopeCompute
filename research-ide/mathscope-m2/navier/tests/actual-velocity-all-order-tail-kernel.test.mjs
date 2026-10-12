import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {physicalPositiveJetCalculus,positiveSourceDiagonalTailArithmetic} from '../actual-velocity-all-order-tail.mjs';
import {sourceNormalizedCutoffWeights} from '../actual-residual-order-induction-kernels.mjs';

test('the positive physical Leibniz calculus executes a genuine order17 query without a theorem cap16',()=>{
  const G=new ActualConvergentExpressions(),C=physicalPositiveJetCalculus(G),
    f=C.fn((e,x,y,s)=>x+y+s?G.zero:G.q(2n**BigInt(e))),g=C.fn((e,x,y,s)=>x+y+s?G.zero:G.q(3n**BigInt(e))),product=C.mul(f,g);
  // These are the exact jets at0 of exp(2t), exp(3t), exp(5t).
  assert.equal(product.get(17,0,0,0),G.q(5n**17n));
  assert.equal(product.get(0,0,0,0),G.one);assert.ok(C.usage().uniqueJetQueries>17);
});

test('mixed physical jet multiplication includes every four-coordinate binomial term',()=>{
  const G=new ActualConvergentExpressions(),C=physicalPositiveJetCalculus(G),
    profile=a=>C.fn((...o)=>G.q(o.reduce((p,n,j)=>p*a[j]**BigInt(n),1n))),
    f=profile([2n,3n,5n,7n]),g=profile([11n,13n,17n,19n]),p=C.mul(f,g),orders=[2,1,2,1];
  assert.equal(p.get(...orders),G.q(13n**2n*16n*22n**2n*26n));
  const shifted=C.shift(p,3);assert.equal(shifted.get(...orders),G.q(13n**2n*16n*22n**2n*26n**2n));
});

test('a finite jet request beyond its explicit work budget fails instead of dropping derivatives',()=>{
  const G=new ActualConvergentExpressions(),C=physicalPositiveJetCalculus(G,{maxJetRequests:1}),f=C.fn(()=>G.one);
  assert.equal(f.get(0,0,0,0),G.one);assert.equal(f.get(0,0,0,0),G.one);
  assert.throws(()=>f.get(1,0,0,0),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>C.fn(()=>G.one).get(-1,0,0,0),{code:'INVALID_INPUT'});
});

test('the actual source cutoff produces all order17 Euler weights and the extra potential derivative',()=>{
  const r=sourceNormalizedCutoffWeights({order:23,derivativeOrder:17});assert.equal(r.pass,true);assert.equal(r.weights.length,18);
  assert.equal(r.weights[17].polynomialInSourceH.length,18);assert.equal(r.weights[17].extraPotentialCutoffPolynomialInSourceH.length,18);
  assert.notDeepEqual(r.weights[17].polynomialInSourceH,r.weights[17].extraPotentialCutoffPolynomialInSourceH);
  assert.equal(r.scope.actualCoefficientNormMissing,true);
});

test('arbitrary fixed m summability keeps positive h and its exact dyadic sum, without declaring NS residual flatness',()=>{
  const r=positiveSourceDiagonalTailArithmetic({derivativeOrder:17,truncationOrder:20});
  assert.deepEqual(r.tail.dyadicFactor,{numerator:'1',denominator:'1048576'});assert.equal(r.tail.sourceHMultiplier,21);
  assert.equal(r.actualSourceAuthenticated,false);assert.equal(r.fullNavierStokesResidualFlatness,false);
  assert.throws(()=>positiveSourceDiagonalTailArithmetic({derivativeOrder:17,truncationOrder:16}),{code:'INVALID_INPUT'});
});
