import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualCenteredSlowJetExpressions,defineCenteredFullSecondVariation,centeredSecondScalarJet} from '../actual-centered-slow-jet-enclosure-kernel.mjs';
import {prepareActualCenteredPulseFullJetEnclosure,attachActualCenteredPulseFullJetEnclosure} from '../actual-centered-pulse-full-jet-enclosure.mjs';
import {disposableThirdJetCacheCopy} from '../actual-third-jet-ftc.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {readRational,qcompare,rational as Q} from '../actual-continuation-arithmetic.mjs';
import {centeredPositiveQuadraticReduction,centeredWholeTimeReferenceFrameAudit,centeredWholeTimeSlowSlopeAudit,centeredFastStabilityPowerAudit,
  centeredFastWeightedProductAudit,centeredUncenteredJetIdentityAudit,centeredUncenteredJetErrorAudit,
  centeredNormalizedAmplitudePowerAudit,centeredNormalizedAmplitudeReferenceAudit,encloseCenteredThreeComponentJetCoefficients,
  encloseCenteredFastJetCoefficients,enclosePulseCenterLogSlopes,encloseCenterCovarianceSlowJetCoefficients} from '../actual-centered-fast-jet-enclosure-kernel.mjs';

const graph=()=>new ActualCenteredSlowJetExpressions(new ActualConvergentExpressions()),
  interval=(a,b=a)=>({lower:a,upper:b}),weightedCenters=[interval('1/2'),interval('1/2')],
  controls={precisionBits:192,tolerance:'1/1000000000000',weightedCenters};

test('the exact quadratic root relation is required and a changed radicand is rejected',()=>{
  const G=graph(),r=G.fresh('sqrt_r'),x=G.fresh('sqrt_x'),D=G.add(G.one,G.pow(x,2)),expr=G.mul(G.add(G.one,r),G.sub(G.pow(r,2),D));
  assert.equal(centeredPositiveQuadraticReduction(G,expr,r,D).pass,true);
  assert.equal(centeredPositiveQuadraticReduction(G,expr,r,G.add(D,G.one)).pass,false);
  assert.throws(()=>centeredPositiveQuadraticReduction(G,G.inv(r),r,D),{code:'INVALID_INPUT'});
  assert.throws(()=>centeredPositiveQuadraticReduction(G,expr,r,r),{code:'INVALID_INPUT'});
});

test('both full matrices reduce to the reference on the entire time interval, with the positive root constraint',()=>{
  const r=centeredWholeTimeReferenceFrameAudit(graph());assert.equal(r.pass,true);assert.equal(r.rows.length,2);
  assert.ok(r.rows.every(row=>row.checks.length===4&&row.checks.every(c=>c.pass&&c.check.reduction.pass)&&row.normalSquare.pass));
  assert.equal(r.sourceAuthenticated,false);assert.equal(r.actualMatrixReplaced,false);assert.match(r.identity,/entire/);
});

test('the full-time first variation includes the original damping derivative',()=>{
  const r=centeredWholeTimeSlowSlopeAudit(graph());assert.equal(r.pass,true);
  assert.ok(r.rows.every(row=>row.check.pass&&row.normalSquare.pass&&row.squareRelation.pass&&row.negativeControl.correctlyRejected));
  assert.equal(r.integration.limitIA,'log(2)/3');assert.equal(r.integration.limitIB,'log(2)/3-7/72');
  assert.equal(r.sourceAuthenticated,false);
});

test('the exact primitive gives the seven-seventy-seconds transport coefficient',()=>{
  const G=graph(),t=G.fresh('integral_t'),logTwo=G.log(G.q(2)),primitive=G.add(G.div(G.log(t),G.q(3)),G.div(G.one,G.mul(G.q(6),t)),
    G.mul(G.q(2,9),G.pow(t,3)),G.mul(G.q(-1,6),G.pow(t,2))),
    integrand=G.add(G.div(G.sub(t,G.q(1,2)),G.mul(G.q(3),G.pow(t,2))),G.mul(G.q(2,3),G.sub(t,G.q(1,2)),t)),
    d=sourceGraphRationalIdentity(G,G.sub(G.derivative(primitive,t),integrand));
  assert.equal(d.pass,true);
  const upper=G.substitute(primitive,t,G.one),lower=G.substitute(primitive,t,G.q(1,2)),
    replaced=G.substitute(G.sub(upper,lower),G.log(G.q(1,2)),G.neg(logTwo)),expected=G.sub(G.div(logTwo,G.q(3)),G.q(7,72));
  assert.equal(sourceGraphRationalIdentity(G,G.sub(replaced,expected),{atomicNodes:[logTwo]}).pass,true);
});

test('stable center estimates retain nonzero initial derivatives and every mixed term',()=>{
  const r=centeredFastStabilityPowerAudit();assert.ok(r.checks.every(c=>c.pass));assert.equal(r.actualMatrixOrInitialLayerDiscarded,false);
  assert.match(r.initialLayer.initialValues,/need not be zero/);assert.match(r.initialLayer.proof,/S\^-4/);
  assert.ok(qcompare(readRational(r.positiveNormalizedError),Q(0))>0);
  const rows=Object.fromEntries(r.rows.map(row=>[row.id,row]));assert.equal(rows.center_ratio_v.denominatorPower,2);assert.equal(rows.center_mixed_ratio_iv.denominatorPower,1);
});

test('complete mixed fast products materialize every source derivative and retain the repeated coefficient2',()=>{
  const G=graph(),[R,Z,T,v]=['pR','pZ','pT','pv'].map(k=>G.fresh(k)),weight=G.exp(G.add(G.mul(R,v),G.mul(Z,T))),
    radial=G.add(G.mul(G.pow(v,2),R),G.mul(Z,v),G.exp(G.mul(T,v))),r=centeredFastWeightedProductAudit(G,{weight,radial,directions:[R,Z,T],variable:v});
  assert.equal(r.rows.length,5);assert.ok(r.rows.every(c=>c.pass&&c.bodyDerivativeBinding));assert.ok(r.bindings.every(b=>b.checks.every(c=>c.pass)));
  assert.equal(r.repeatedDerivativeCoefficient,2);assert.equal(r.sourceAuthenticated,false);
  const vv=r.rows.find(x=>x.id==='vv'),omitted=G.sub(vv.expected,G.mul(G.q(2),r.bindings[0].formal[1],r.bindings[1].formal[1]));
  assert.equal(sourceGraphRationalIdentity(G,G.sub(vv.formal,omitted),{maxTerms:10000}).pass,false);
  assert.throws(()=>centeredFastWeightedProductAudit(G,{weight,radial,directions:[R,Z,T],variable:T}),{code:'INVALID_INPUT'});
});

test('uncentered covariance and inverse jets retain all moving-center terms and inverse signs',()=>{
  const G=graph(),[R,Z,T]=['aR','aZ','aT'].map(k=>G.fresh(k)),center=G.exp(G.add(G.pow(R,2),G.mul(Z,T))),
    H=G.mul(G.pow(center,2),G.add(G.q(2),G.mul(R,Z),G.pow(T,2))),y=G.div(G.add(G.q(3),G.exp(G.mul(R,T)),Z),G.pow(center,2)),
    r=centeredUncenteredJetIdentityAudit(G,{center,values:[{kind:'H',body:H},{kind:'y',body:y}],directions:[R,Z,T]});
  assert.equal(r.rows.length,2);assert.ok(r.rows.every(x=>x.checks.length===9&&x.checks.every(c=>c.pass&&c.bodyDerivativeBinding)));
  assert.equal(r.sourceAuthenticated,false);assert.equal(r.originalTargetInsideWeightRetained,true);
  assert.equal(centeredUncenteredJetErrorAudit().pass,true);assert.match(centeredUncenteredJetErrorAudit().logErrors,/not zero/);
});

test('frozen positive normalizers preserve all ten actual integral and inverse jets under exact body materialization',()=>{
  const G=graph(),[R,Z,T,v]=['scaleR','scaleZ','scaleT','scalev'].map(k=>G.fresh(k)),directions=[R,Z,T],
    a=G.exp(G.add(R,G.mul(Z,T))),H=G.integral(G.exp(G.add(G.mul(R,v),Z,G.mul(T,G.pow(v,2)))),v,G.zero,G.one),
    y=G.div(G.add(G.q(2),G.exp(G.mul(R,Z)),T),H),scale=G.exp(G.log(G.q(7))),m=G.sqrt(G.q(3)),tau=G.exp(G.q(-2)),
    scaledH=G.div(H,G.mul(scale,m)),scaledY=G.div(G.mul(y,m),tau),
    r=centeredUncenteredJetIdentityAudit(G,{center:a,values:[{kind:'H',body:scaledH},{kind:'y',body:scaledY}],directions}),
    hJets=centeredSecondScalarJet(G,H,directions),yJets=centeredSecondScalarJet(G,y,directions);
  for(let at=0;at<10;at++){
    assert.equal(r.rows[0].bodyBinding.directRoots[at],G.div(hJets.roots[at],G.mul(scale,m)));
    assert.equal(r.rows[1].bodyBinding.directRoots[at],G.div(G.mul(yJets.roots[at],m),tau));
  }
  assert.ok(r.rows.every(row=>row.checks.every(c=>c.pass&&c.bodyDerivativeBinding)));
});

test('source API rejects caller-supplied premises, unattainable precision and copied reports before an actual-source construction',()=>{
  assert.throws(()=>prepareActualCenteredPulseFullJetEnclosure({matrix:[[0,1],[0,0]]}),{code:'INVALID_INPUT'});
  assert.throws(()=>prepareActualCenteredPulseFullJetEnclosure({sourceProfile:'unbound-source'}));
  assert.throws(()=>prepareActualCenteredPulseFullJetEnclosure({precisionBits:192,tolerance:'1/1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'}));
  assert.throws(()=>attachActualCenteredPulseFullJetEnclosure({centered:{}},{centered:{}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('the complete two-channel log equation has zero parameter initial datum and copied descriptors have no private jet authority',()=>{
  const G=graph(),[R,Z,T,v]=['log_R','log_Z','log_T','log_v'].map(k=>G.fresh(k)),directions=[R,Z,T],
    M=[[G.add(R,G.mul(Z,v)),G.add(G.one,G.mul(R,T))],[G.add(T,G.mul(R,v)),G.add(G.q(-3),G.mul(R,Z))]],
    system=G.defineCovarianceVolterra({name:'full log control',variable:v,parameters:directions,matrix:M,normUpper:G.q(100),length:G.one}),
    variation=defineCenteredFullSecondVariation(G,{name:'full log second control',originalSystem:system,directions}),
    w=[0,1].map(j=>G.covarianceValue(system,j,v,directions)),q=G.log(w[0]),rhs=G.add(M[0][0],G.mul(M[0][1],G.div(w[1],w[0]))),
    check=sourceGraphRationalIdentity(G,G.sub(G.derivative(q,v),rhs),{atomicNodes:[...M.flat(),...w],maxTerms:10000});
  assert.equal(check.pass,true);for(const d of directions)assert.equal(G.substitute(G.derivative(q,d),v,G.zero),G.zero);
  const original=JSON.stringify(G.nodes),copy=new ActualCenteredSlowJetExpressions(disposableThirdJetCacheCopy(G));
  assert.throws(()=>copy.assertPulseSecondVariation(variation.system),{code:'INVALID_SOURCE_CONSTRUCTION'});
  G.fresh('later_append_keeps_private_aliases');assert.equal(JSON.stringify(G.nodes.slice(0,JSON.parse(original).length)),original);
  assert.equal(G.assertPulseSecondVariation(variation.system),true);
});

test('the separate moving-amplitude ledger preserves axial orientation and nonzero time derivatives',()=>{
  const G=graph(),r=centeredNormalizedAmplitudeReferenceAudit(G),p=centeredNormalizedAmplitudePowerAudit();
  assert.ok(r.rows.every(row=>row.pass&&row.checks.length===6&&row.retainedTimeDerivatives.flat().some(x=>x!==G.zero)));
  assert.equal(p.maximumPower,1132);assert.ok(p.checks.every(c=>c.pass));assert.equal(p.originalMovingFrameDerivativesSetToZero,false);
  const a=encloseCenteredThreeComponentJetCoefficients(controls);assert.equal(a.rows.length,66);
  assert.equal(a.rows.filter(x=>x.kind==='fast').length,30);assert.equal(a.rows.filter(x=>x.kind==='slow').length,36);
  for(const row of a.rows.filter(r=>r.derivative==='vv'))assert.ok(qcompare(readRational(row.sign===-1&&row.component===2?row.interval.lower:row.interval.upper),Q(0))*(row.sign===-1&&row.component===2?1:-1)>0);
  assert.equal(a.sourceAuthenticated,false);assert.equal(a.actualFullCurlNumericallyEnclosed,false);
});

test('ten fast and slow-fast coefficients separate the actual comparison signs with positive remainders',()=>{
  const r=encloseCenteredFastJetCoefficients(controls);assert.equal(r.rows.length,10);assert.ok(r.rows.every(x=>x.nonzeroRemainderRetained&&x.toleranceMet));
  for(const row of r.rows){const lo=readRational(row.interval.lower),hi=readRational(row.interval.upper);
    if(['vv','Tv'].includes(row.derivative))assert.ok(qcompare(hi,Q(0))<0);
    else if(row.derivative==='Rv')assert.ok(qcompare(lo,Q(0))>0);
    else assert.ok(qcompare(lo,Q(0))<0&&qcompare(hi,Q(0))>0);
  }
  assert.equal(r.sourceAuthenticated,false);assert.equal(r.wholeGNUMComplete,false);
});

test('center log slopes are integrated values, distinct from the endpoint slopes',()=>{
  const r=enclosePulseCenterLogSlopes(controls),R=r.rows.find(row=>row.direction==='R'),T=r.rows.find(row=>row.direction==='T');
  assert.ok(qcompare(readRational(R.coefficient.lower),Q(-61,1000))>0&&qcompare(readRational(R.coefficient.upper),Q(-60,1000))<0);
  assert.ok(qcompare(readRational(T.coefficient.upper),Q(0))<0);assert.equal(r.sourceAuthenticated,false);
  assert.match(r.formula,/7\/72/);assert.equal(r.errorBudget.noOriginalCenterOrSlowDerivativeSetToZero,true);
});

test('all72 original center, four covariance-entry and inverse-weight slow jets preserve the center factors',()=>{
  const r=encloseCenterCovarianceSlowJetCoefficients({...controls,absoluteCenters:[interval('1/3'),interval('1/3')],
    absoluteH:[[interval('1/4'),interval('1/4')],[interval('1/4'),interval('-1/4')]],absoluteWeights:[interval('2'),interval('2')]});
  assert.equal(r.rows.length,72);assert.equal(r.rows.filter(x=>x.quantity==='a').length,18);assert.equal(r.rows.filter(x=>x.quantity==='H').length,36);assert.equal(r.rows.filter(x=>x.quantity==='y').length,18);
  assert.ok(r.rows.every(x=>x.toleranceMet&&x.nonzeroRemainderRetained));
  for(const row of r.rows.filter(x=>x.derivative==='R')){
    const negative=row.quantity==='a'||row.quantity==='H'&&!(row.component===1&&row.sign===-1);
    assert.ok(qcompare(readRational(negative?row.interval.upper:row.interval.lower),Q(0))*(negative?-1:1)>0);
  }
  assert.equal(r.errorBudget.exactPositiveGeometryScalesNumericallyEvaluated,false);assert.equal(r.sourceAuthenticated,false);
  assert.throws(()=>encloseCenterCovarianceSlowJetCoefficients({...controls,absoluteCenters:[interval('0'),interval('1/3')],absoluteH:[[interval('1/4'),interval('1/4')],[interval('1/4'),interval('-1/4')]],absoluteWeights:[interval('2'),interval('2')]}),{code:'INVALID_INPUT'});
});
