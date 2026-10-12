import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualCovarianceExpressions} from '../actual-covariance-volterra.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {qcompare,rational} from '../actual-continuation-arithmetic.mjs';
import {originalPulseTimeCutoff,differentiatedOriginalPulseTail,originalPulseTimeCutoffBounds,gaussianFlatSummabilityRecipe} from '../actual-gaussian-flat-tail-kernel.mjs';

const same=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:100000}).pass;
const fixture=()=>{const G=new ActualConvergentExpressions(),v=G.fresh('test_tail_v'),L=G.fresh('test_tail_L');return {G,v,L};};

test('the original two-sided temporal cutoff retains its true plateau and both transition regions',()=>{
  const {G,v,L}=fixture(),p=originalPulseTimeCutoff(G,v,L),scaled=G.div(G.mul(G.q(20),v),L);
  assert.equal(p.psi,G.mul(G.step(G.sub(scaled,G.q(4))),G.step(G.sub(G.q(16),scaled))));
  assert.deepEqual(p.plateau,['1/4','3/4']);assert.deepEqual(p.support,['1/5','4/5']);
  for(const [n,d,value]of [[0,1,0],[1,5,0],[1,4,1],[1,2,1],[3,4,1],[4,5,0],[1,1,0]]){
    const at=G.simultaneousSubstitute(p.psi,[v,L],[G.q(n,d),G.one]),node=G.nodes[at];
    assert.equal(node.op,'multiply');
    const endpointValues=node.args.map(id=>{
      const step=G.nodes[id];assert.equal(step.op,'source_step_derivative');assert.equal(step.args[1],0);
      const argument=G.fraction(step.args[0]);
      if(qcompare(argument,rational(0))<=0)return 0;
      if(qcompare(argument,rational(1))>=0)return 1;
      assert.fail('This endpoint test must not replace an interior smooth step by a guessed value.');
    });
    assert.equal(endpointValues.reduce((a,b)=>a*b,1),value);
  }
});

test('the actual product rule through fourth order retains forcing, psi-prime and every last cutoff derivative',()=>{
  const {G,v,L}=fixture(),psi=originalPulseTimeCutoff(G,v,L).psi,f=G.add(G.exp(v),G.pow(v,3)),t=G.add(G.one,G.pow(v,2),G.pow(v,4)),p=differentiatedOriginalPulseTail(G,{v,length:L,psi,forcing:f,amplitude:t,order:4});
  assert.equal(p.rows.length,5);assert.equal(p.psiJets.length,6);assert.ok(p.rows.every(r=>r.identity.pass));
  const expectedSecond=G.add(G.mul(G.sub(G.one,psi),G.add(G.exp(v),G.mul(G.q(6),v))),G.mul(G.q(-2),p.psiJets[1],G.add(G.exp(v),G.mul(G.q(3),G.pow(v,2)))),G.neg(G.mul(p.psiJets[2],f)),G.mul(p.psiJets[1],G.add(G.q(2),G.mul(G.q(12),G.pow(v,2)))),G.mul(G.q(2),p.psiJets[2],G.add(G.mul(G.q(2),v),G.mul(G.q(4),G.pow(v,3)))),G.mul(p.psiJets[3],t));
  assert.equal(same(G,p.rows[2].direct,expectedSecond),true);
  assert.equal(same(G,p.rows[2].direct,p.rows[2].forcingTail),false);
  assert.equal(same(G,p.rows[2].direct,p.rows[2].cutoffDerivativeTail),false);
  assert.equal(same(G,p.rows[2].direct,G.sub(expectedSecond,G.mul(p.psiJets[3],t))),false);
  assert.equal(p.actualAmplitudeGaussianBoundDerived,false);
});

test('a zero original source still retains the nonzero localization residual',()=>{
  const {G,v,L}=fixture(),psi=originalPulseTimeCutoff(G,v,L).psi,t=G.exp(v),p=differentiatedOriginalPulseTail(G,{v,length:L,psi,forcing:G.zero,amplitude:t,order:2});
  assert.ok(p.rows.every(r=>r.forcingTail===G.zero));assert.notEqual(p.rows[0].direct,G.zero);
  assert.equal(same(G,p.rows[0].direct,G.mul(G.derivative(psi,v),t)),true);
});

test('shared full Volterra amplitude jets materialize to their unchanged rational source body',()=>{
  const G=new ActualCovarianceExpressions(new ActualConvergentExpressions()),v=G.fresh('shared_tail_v'),L=G.fresh('shared_tail_L'),
    system=G.defineCovarianceVolterra({name:'retained generic varying matrix',variable:v,parameters:[L],matrix:[[v,G.one],[G.zero,G.q(-1)]],normUpper:G.add(L,G.q(2)),length:L}),
    w=G.covarianceValue(system,0,v,[L]),amplitude=G.div(G.mul(G.exp(v),w),G.add(G.one,G.pow(v,2))),parameters=[v,L],
    shared=G.share(amplitude,parameters,'retained_tail_fixture'),bodySystem=G.nodes[shared].args[0],
    psi=originalPulseTimeCutoff(G,v,L).psi,p=differentiatedOriginalPulseTail(G,{v,length:L,psi,forcing:G.zero,amplitude:shared,order:2});
  const rawJets=[amplitude];
  for(let m=0;m<=2;m++){
    if(m)rawJets.push(G.derivative(rawJets.at(-1),v));
    const orders=[m,0];assert.equal(p.amplitudeJets[m],G.expressionValue(bodySystem,parameters,orders));
    assert.equal(G.materializeExpressionFunction(bodySystem,parameters,orders),rawJets[m]);
  }
  const direct=G.derivative(G.derivative(G.mul(p.psiJets[1],amplitude),v),v),
    expected=G.add(G.mul(p.psiJets[3],rawJets[0]),G.mul(G.q(2),p.psiJets[2],rawJets[1]),G.mul(p.psiJets[1],rawJets[2]));
  assert.equal(same(G,direct,expected),true);
  assert.equal(same(G,direct,G.sub(expected,G.mul(p.psiJets[3],rawJets[0]))),false);
  assert.equal(G.expressionSystems[bodySystem].body,amplitude);
  assert.equal(G.expressionSystems[bodySystem].unspecifiedOracle,false);
});

test('the true smooth-step FTC bounds have no band or representative coordinate',()=>{
  const {G}=fixture(),p=originalPulseTimeCutoffBounds(G,{order:5});
  assert.equal(p.rows.length,7);assert.equal(p.sigmaJets.length,8);
  for(const r of p.rows)assert.equal(G.freeCoordinates(r.coefficient).size,0);
  const first=G.mul(G.q(40),p.stepBounds[1]);assert.equal(same(G,p.rows[1].coefficient,first),true);
  assert.equal(p.rows[6].lengthPower,-6);assert.equal(p.numericalQuadratureExecuted,false);
});

test('Gaussian summability retains a positive infinite tail and the q-normalization buffer',()=>{
  const {G}=fixture(),p=gaussianFlatSummabilityRecipe(G,{gaussian:G.q(1,1000),polynomialOrder:18,powerLoss:12,flatOrder:9,firstBand:G.q(8)});
  assert.ok(p.checks.every(x=>x.pass));assert.notEqual(p.roots.tail,G.zero);
  const linear=G.add(G.q(18),G.mul(G.q(21),G.log(G.q(2)))),constant=G.mul(G.exp(G.mul(G.q(9),G.log(G.q(2)))),G.exp(G.mul(G.q(500),G.pow(linear,2))));
  assert.equal(same(G,p.roots.constant,constant),true);
  assert.equal(same(G,p.roots.ratio,G.exp(G.q(-17,2000))),true);
  assert.equal(p.thresholdDependsOnFlatOrder,false);assert.equal(p.actualGlobalResidualFlatnessProved,false);
});

test('positive Gaussian and original cutoff premises cannot be replaced by input flags or jet arrays',()=>{
  const {G,v,L}=fixture(),psi=originalPulseTimeCutoff(G,v,L).psi,input={v,length:L,psi,forcing:G.one,amplitude:G.exp(v)};
  assert.throws(()=>differentiatedOriginalPulseTail(G,{...input,psi:G.one}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>differentiatedOriginalPulseTail(G,{...input,psiJets:[G.zero]}),{code:'INVALID_INPUT'});
  assert.throws(()=>differentiatedOriginalPulseTail(G,{...input,order:20,maxWork:20}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>differentiatedOriginalPulseTail(G,{...input,length:v}),{code:'INVALID_INPUT'});
  assert.throws(()=>gaussianFlatSummabilityRecipe(G,{gaussian:G.zero,firstBand:G.q(8)}),{code:'INVALID_INPUT'});
  assert.throws(()=>gaussianFlatSummabilityRecipe(G,{gaussian:G.one,firstBand:G.q(3,2)}),{code:'INVALID_INPUT'});
  assert.throws(()=>gaussianFlatSummabilityRecipe(G,{gaussian:G.one,firstBand:G.q(8),flatOrder:-1}),{code:'INVALID_INPUT'});
});
