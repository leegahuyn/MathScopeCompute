import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {shiftedRadialIntegrals} from '../source-pressure.mjs';
import {ActualInductionExpressions} from '../../../mathscope-m2/navier/actual-residual-order-induction-expressions.mjs';
import {normalizePressureMeanIntegral} from '../source-signed-stress.mjs';

test('a radial translation cancels inside analytic arguments by a proved endpoint identity',()=>{
  const G=new ActualConvergentExpressions(),R=G.fresh('R'),Y=[G.fresh('Y1'),G.fresh('Y2')],r=G.fresh('inner');
  const body=G.add(G.sine(G.add(R,Y[0])),G.mul(G.exp(R),G.cosine(Y[1])),
    G.integral(G.exp(G.mul(r,R)),r,G.zero,G.one));
  const result=shiftedRadialIntegrals(G,{body,R,Y,radialPrimitive:G.exp(R),
    vr:[G.one,G.sub(G.one,G.sqrt(G.q(2)))],innerRadius:G.one,outerRadius:G.q(2),tag:'analytic_regression'});
  assert.notEqual(result.rawEndpoint,body,'The actual inherited unsimplified endpoint must exercise the regression.');
  assert.equal(result.endpointShiftCheck.pass,true);
  assert.equal(result.endpoint,body);
  assert.equal(result.endpointCheck.pass,true);
  assert.equal(result.sourceAuthenticated,false,'A generic analytic identity cannot acquire private Navier source authority.');
  assert.notEqual(result.whole,G.zero);
  assert.equal(G.freeCoordinates(result.whole).has(result.radialVariable),false);
  assert.equal(G.freeCoordinates(result.whole).has(R),true,'The shifted whole integral still depends on its base point.');
});

test('zero pressure mean follows from actual defining integrals, with no supplied zero moment',()=>{
  const G=new ActualInductionExpressions(new ActualConvergentExpressions()),R=G.fresh('R'),Z=G.fresh('Z'),r=G.fresh('integration_r'),
    lo=G.one,hi=G.q(2),integral=body=>G.integral(G.substitute(body,R,r),r,lo,hi),
    gr=G.share(G.mul(G.exp(R),G.add(G.one,G.pow(Z,2))),[R,Z],'radial_source'),P=G.share(integral(gr),[Z],'pressure_defect'),
    unnormalized=G.div(G.sine(R),G.q(3)),rhoMass=integral(unnormalized),rho=G.div(unnormalized,rhoMass),
    source=G.sub(gr,G.mul(rho,P)),totalSource=integral(source),state={mean:{gr,P,pressure:{source,totalSource},
      geometry:{R,radialVariable:r,innerRadius:lo,outerRadius:hi,unnormalized,rhoMass}}};
  const proof=normalizePressureMeanIntegral(G,state);
  assert.equal(proof.check.pass,true);
  assert.equal(proof.sourceAuthenticated,false);
  assert.equal(proof.retainedIntegral,totalSource);
  assert.ok(proof.steps.some(s=>s.rule==='radial-independent scalar factor'));
  const unrelated=G.share(G.add(integral(gr),G.one),[Z],'wrong_defect');
  assert.throws(()=>normalizePressureMeanIntegral(G,{mean:{...state.mean,P:unrelated}}),/original full radial integral/);
});

test('endpoint reduction preserves a compact piecewise body and its shared source parameters',()=>{
  const G=new ActualConvergentExpressions(),R=G.fresh('R'),Y=[G.fresh('Y1'),G.fresh('Y2')],a=G.fresh('a');
  const body=G.choose(R,G.one,G.q(2),G.zero,G.mul(a,G.sine(Y[0]),G.cosine(Y[1])),G.zero);
  const result=shiftedRadialIntegrals(G,{body,R,Y,radialPrimitive:G.pow(R,2),vr:[G.one,G.q(3)],
    innerRadius:G.one,outerRadius:G.q(2),tag:'guard_regression'});
  assert.equal(result.endpointCheck.pass,true);
  assert.equal(result.endpoint,body);
  assert.equal(G.substitute(result.endpoint,R,G.q(3)),G.zero);
  assert.equal(G.freeCoordinates(result.whole).has(a),true);
});
