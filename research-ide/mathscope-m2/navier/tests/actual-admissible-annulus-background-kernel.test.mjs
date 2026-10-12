import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {sourceNormalizedCutoffWeights} from '../actual-residual-order-induction-kernels.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';
import {cutoffEulerScaleIdentityAudit,oneActiveAdmissibleBandArithmetic,attachActualAdmissibleAnnulusBackground,
  assertActualAdmissibleAnnulusBackground,prepareActualAdmissibleAnnulusBackground,explicitAnnulusCoefficientRoots} from '../actual-admissible-annulus-background.mjs';

test('source coefficient snapshots retain all six roots and exclude optional implementation metadata',()=>{
  const G=new ActualConvergentExpressions(),record={F:G.one,U:G.q(2),M:G.q(3),average:G.q(4),Pi:G.q(5),v:G.q(6),
    localBodies:undefined,unrelated:{optional:undefined}},roots=explicitAnnulusCoefficientRoots(G,record);
  assert.deepEqual(Object.keys(roots),['F','U','M','average','Pi','v']);
  for(const name of Object.keys(roots))assert.equal(roots[name],record[name]);
  assert.doesNotThrow(()=>canonicalStringify(roots));
  assert.throws(()=>canonicalStringify(record),/unsupported JSON value/);
  assert.throws(()=>explicitAnnulusCoefficientRoots(G,{...record,Pi:undefined}),{code:'INVALID_INPUT'});
  assert.throws(()=>explicitAnnulusCoefficientRoots(G,{...record,v:G.nodes.length}),{code:'INVALID_INPUT'});
  assert.throws(()=>assertActualAdmissibleAnnulusBackground(roots),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('the original linear-seed cutoff Euler identity retains the exponent and the extra stream derivative',()=>{
  const G=new ActualConvergentExpressions(),a=cutoffEulerScaleIdentityAudit(G,{order:4});
  assert.equal(a.pass,true);assert.equal(a.rows.length,5);assert.ok(a.rows.every(r=>r.identity.pass&&r.extraIdentity.pass));
  assert.deepEqual(a.negativeControls,{missingPositiveSourceExponentRejected:true,missingExtraStreamCutoffDerivativeRejected:true});
  assert.equal(a.noScaleFactorInEulerBound,true);assert.equal(a.ordinaryQDerivativeClaimedScaleIndependent,false);assert.equal(a.sourceAuthenticated,false);
  const row=G.nodes[a.cutoff.body];assert.equal(row.op,'smooth_piecewise');assert.equal(row.args[1],G.q(1,2));assert.equal(row.args[2],G.one);
  assert.equal(row.args[3],G.one);assert.equal(row.args[5],G.zero);
});

test('the second Euler jet has the independently known nu squared and 2nu plus one coefficients',()=>{
  const G=new ActualConvergentExpressions(),a=cutoffEulerScaleIdentityAudit(G,{order:2}),{q,scale,nu}=a.coordinates,x=G.mul(scale,q),
    p=G.exp(G.mul(nu,G.log(q))),c=G.expressionValue(a.cutoff.system,[x]),d=G.expressionValue(a.cutoff.system,[x],[1]),dd=G.expressionValue(a.cutoff.system,[x],[2]),
    expected=G.mul(p,G.add(G.mul(G.pow(nu,2),c),G.mul(G.add(G.mul(G.q(2),nu),G.one),x,d),G.mul(G.pow(x,2),dd))),
    missingStirling=G.mul(p,G.add(G.mul(G.pow(nu,2),c),G.mul(G.mul(G.q(2),nu),x,d),G.mul(G.pow(x,2),dd)));
  assert.equal(sourceGraphRationalIdentity(G,G.sub(a.rows[2].direct,expected),{atomicNodes:[p]}).pass,true);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(a.rows[2].direct,missingStirling),{atomicNodes:[p]}).pass,false);
});

test('the actual shape weights do not contain an old or enlarged cutoff scale',()=>{
  const p=sourceNormalizedCutoffWeights({order:2,derivativeOrder:3});
  assert.equal(p.pass,true);assert.equal(p.weights.length,4);
  for(const r of p.weights){assert.equal(r.polynomialInSourceH.length,r.eulerOrder+1);assert.equal(r.extraPotentialCutoffPolynomialInSourceH.length,r.eulerOrder+1);}
  assert.equal(p.weights[3].polynomialInSourceH[3],'64');
  assert.notEqual(p.weights[0].extraPotentialCutoffPolynomialInSourceH[0],'0');
  assert.equal(p.scope.completeScheduleSelected,false);
});

test('one actual dyadic band is below qStar and contains exactly the first plateau term',()=>{
  const p=oneActiveAdmissibleBandArithmetic();assert.equal(p.pass,true);assert.equal(p.firstCutoffPlateau,true);assert.equal(p.allOrdersFromTwoOff,true);
  assert.deepEqual(p.firstScaleTimesPhysicalQBounds,['1/16','1/2']);assert.equal(p.secondScaleTimesPhysicalQLower,'1');
  assert.equal(p.selectedEllBuffer,12);assert.equal(p.qStarRatioUpper,'1/128');assert.equal(p.sourceAuthenticated,false);
});

test('mere doubling cannot justify dropping the second term on the same full dyadic band',()=>{
  for(const ratio of ['2','8','15']){const p=oneActiveAdmissibleBandArithmetic({secondScaleFactor:ratio});assert.equal(p.allOrdersFromTwoOff,false);assert.equal(p.pass,false);}
  assert.equal(oneActiveAdmissibleBandArithmetic({secondScaleFactor:'32'}).pass,true);
  assert.equal(oneActiveAdmissibleBandArithmetic({firstDyadicBuffer:0}).wholeBandBelowSourceQStar,false);
});

test('nonpositive scale ratios and invalid finite budgets are rejected',()=>{
  for(const ratio of ['0','-1'])assert.throws(()=>oneActiveAdmissibleBandArithmetic({secondScaleFactor:ratio}),{code:'INVALID_INPUT'});
  assert.throws(()=>oneActiveAdmissibleBandArithmetic({firstDyadicBuffer:-1}),{code:'INVALID_INPUT'});
  assert.throws(()=>cutoffEulerScaleIdentityAudit(new ActualConvergentExpressions(),{order:9}),{code:'INVALID_INPUT'});
});

test('generic scale receipts and caller completion flags cannot authenticate an actual annulus background',()=>{
  assert.throws(()=>attachActualAdmissibleAnnulusBackground({pass:true}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualAdmissibleAnnulusBackground({scope:{actualNewPositiveWeightsProved:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const input of [{b1:'100'},{ell:'200'},{sourceNorm:1},{coefficient:1},{wholeGPOSComplete:true},{derivativeOrder:3},[]])
    assert.throws(()=>prepareActualAdmissibleAnnulusBackground(input),e=>['INVALID_INPUT','RESOURCE_LIMIT'].includes(e.code));
});
