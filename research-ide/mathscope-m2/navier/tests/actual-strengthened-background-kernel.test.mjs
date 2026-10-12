import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {originalLeadingMomentStressIdentity,physicalSourceChartDerivatives,physicalMonomialDerivativeWords,momentumDifferenceIdentity,finiteActualResidualIndexLedger,reduceLiteralZeroDerivatives} from '../actual-strengthened-background-kernels.mjs';
import {assertActualStrengthenedBackground} from '../actual-strengthened-background.mjs';
import {assertActualFiniteResidualBridge,actualPositiveStressFTC} from '../actual-background-residual-bridge.mjs';

test('original leading moment stress cancels arbitrary independent F/U jets, with both physical shears and the original sign',()=>{
  const r=originalLeadingMomentStressIdentity();
  assert.equal(r.pass,true);assert.equal(r.checks.theta.pass,true);assert.equal(r.checks.axial.pass,true);
  assert.equal(r.negativeControls.missingShear.pass,false);assert.equal(r.negativeControls.wrongBackwardSign.pass,false);
  assert.equal(r.allSourceCoefficientsSupplied,false);assert.equal(r.leadingAxialViscosityExcluded,true);
});

test('the nonlinear residual difference is a formal identity of independent smooth jets and retains the quadratic tail',()=>{
  const r=momentumDifferenceIdentity();assert.equal(r.pass,true);assert.equal(r.allSmoothJetsAreIndependent,true);
  assert.ok(r.independentFormalJetCount>50);assert.ok(r.checks.every(c=>c.pass));assert.equal(r.omittedQuadratic.pass,false);
  assert.equal(r.actualInfiniteTailCertified,false);assert.deepEqual(r.requiredDerivativeOrders,{velocity:2,pressure:1,stress:1});
});

test('literal all-zero piecewise derivatives vanish under the integral; compact nonzero primitives do not',()=>{
  const G=new ActualConvergentExpressions(),X=G.fresh('literal_X'),eta=G.fresh('literal_eta'),t=G.fresh('literal_t'),
    system=G.defineExpressionFunction({name:'independent_density',parameters:[X,eta],body:G.add(X,G.pow(eta,2)),derivativeLimits:[3,3]}),
    raw=G.expressionValue(system,[X,eta]),support=G.choose(X,G.one,G.q(3),G.zero,raw,G.zero),density=G.mul(G.q(2),X,support),
    integrand=G.substitute(density,X,t),integral=G.integral(integrand,t,G.one,X),denominator=G.mul(G.q(2),X),forward=G.neg(G.div(integral,denominator)),
    derivative=G.derivative(G.mul(denominator,forward),X),reduced=reduceLiteralZeroDerivatives(G,derivative,{atomicNodes:[raw,integral,density]}),
    interior=G.substitute(reduced.value,support,raw),expected=G.mul(G.q(2),X,raw);
  assert.equal(sourceGraphRationalIdentity(G,G.add(G.substitute(derivative,support,raw),expected),{atomicNodes:[raw,integral]}).pass,false,'raw AD deliberately keeps the zero piecewise integral');
  assert.equal(sourceGraphRationalIdentity(G,G.add(interior,expected),{atomicNodes:[raw,integral]}).pass,true);
  assert.ok(reduced.trace.some(r=>r.operation==='definite_integral'));
  assert.notEqual(reduceLiteralZeroDerivatives(G,integral).value,G.zero);
  assert.equal(reduced.nonzeroCompactPrimitiveReplaced,false);
});

test('physical chart derivatives have the correct q, eta and transverse-coordinate terms',()=>{
  const G=new ActualConvergentExpressions(),q=G.fresh('chart_q'),x1=G.fresh('chart_y1'),x2=G.fresh('chart_y2'),eta=G.fresh('chart_eta'),
    {operators,D}=physicalSourceChartDerivatives(G,{q,x1,x2,eta}),power=a=>G.exp(G.mul(a,G.log(q))),
    physical=[G.mul(power(G.q(1,2)),x1),G.mul(power(G.q(1,2)),x2),G.mul(power(D),eta),G.neg(G.mul(q,G.sub(G.one,G.pow(eta,2))))],names=['x1','x2','z','t'];
  // All q powers are homogeneous. Setting q=1 after differentiation checks
  // their profile coefficients without assuming q is constant in calculus.
  for(let j=0;j<4;j++)for(let k=0;k<4;k++){
    const derivative=G.substitute(operators[names[j]](physical[k]),q,G.one);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(derivative,j===k?G.one:G.zero)).pass,true,names[j]+' '+k);
  }
});

test('every physical derivative word through two equals direct differentiation with each exact loss retained',()=>{
  const G=new ActualConvergentExpressions(),q=G.fresh('word_q'),x1=G.fresh('word_y1'),x2=G.fresh('word_y2'),eta=G.fresh('word_eta'),
    h=G.parameter('h'),exponent=G.add(G.q(3,2),G.mul(G.q(7),h)),
    body=G.add(G.q(3),G.mul(x1,eta),G.mul(G.pow(x1,2),x2),G.mul(G.pow(eta,3),x2)),
    original=G.mul(G.exp(G.mul(exponent,G.log(q))),body),chart=physicalSourceChartDerivatives(G,{q,x1,x2,eta}),
    r=physicalMonomialDerivativeWords(G,{body,exponent,x1,x2,eta,derivativeOrder:2,maxWords:21});
  assert.equal(r.rows.length,21);assert.equal(r.earlierBoundsDifferentiated,false);
  for(const row of r.rows){
    let direct=original;for(const name of row.word)direct=chart.operators[name](direct);
    direct=G.substitute(direct,q,G.one);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(direct,row.body)).pass,true,row.word.join(','));
  }
  assert.throws(()=>physicalMonomialDerivativeWords(G,{body,exponent,x1,x2,eta,derivativeOrder:2,maxWords:20}),{code:'RESOURCE_LIMIT'});
});

test('curl of the actual stream form needs the extra derivative of the time cutoff',()=>{
  const G=new ActualConvergentExpressions(),q=G.fresh('potential_q'),x1=G.fresh('potential_y1'),x2=G.fresh('potential_y2'),eta=G.fresh('potential_eta'),
    h=G.parameter('h'),A=G.add(G.q(1,2),h),D=G.sub(G.q(1,2),h),d=G.sub(G.one,G.pow(eta,2)),L=G.sub(G.one,G.mul(G.q(2),h,G.pow(eta,2))),
    X=G.div(G.add(G.pow(x1,2),G.pow(x2,2)),G.q(2)),average=G.add(G.q(2),X,G.pow(eta,2)),U=G.add(G.q(2),G.mul(G.q(2),X),G.pow(eta,2)),
    gain=G.mul(G.q(2),h),chi=G.add(G.one,G.pow(q,2)),extra=G.mul(q,G.derivative(chi,q)),
    v=G.div(G.sub(G.sub(G.mul(G.q(2),eta,U),G.mul(G.q(2),eta,G.add(D,gain),average)),G.mul(d,G.derivative(average,eta))),L),
    power=a=>G.exp(G.mul(a,G.log(q))),factor=G.mul(power(G.sub(gain,h)),chi,average,G.q(1,2)),potential=[G.neg(G.mul(x2,factor)),G.mul(x1,factor),G.zero],
    {operators:o}=physicalSourceChartDerivatives(G,{q,x1,x2,eta}),curl=[G.neg(o.z(potential[1])),o.z(potential[0]),G.sub(o.x1(potential[1]),o.x2(potential[0]))],
    radial=G.mul(power(G.sub(gain,G.q(1,2))),G.sub(G.mul(chi,v,G.q(1,2)),G.div(G.mul(eta,extra,average),L))),
    expected=[G.mul(x1,radial),G.mul(x2,radial),G.mul(power(G.sub(gain,A)),chi,U)];
  for(let j=0;j<3;j++)assert.equal(sourceGraphRationalIdentity(G,G.substitute(G.sub(curl[j],expected[j]),q,G.one)).pass,true);
  const omitted=G.mul(x1,power(G.sub(gain,G.q(1,2))),chi,v,G.q(1,2));
  assert.equal(sourceGraphRationalIdentity(G,G.substitute(G.sub(curl[0],omitted),q,G.one)).pass,false);
});

test('the complete finite residual ledger includes both ordered products and every axial-viscosity shift',()=>{
  for(const N of [1,2,3,7,37]){
    const r=finiteActualResidualIndexLedger({truncationOrder:N});assert.equal(r.pass,true);assert.equal(r.theta.length,N);assert.equal(r.radial.length,N+1);
    for(const row of r.theta){
      const expected=[];for(let i=0;i<=N;i++)for(let j=0;j<=N;j++)if(i+j===row.order)expected.push([i,j]);
      assert.deepEqual(row.orderedPairs,expected);assert.equal(row.axialViscosityOfOrder,row.order===N+1?N:null);
    }
    assert.equal(r.radial[0].omega.axialViscosityOfOrder,N-1);
    assert.equal(r.radial.at(-1).omega.order,2*N);
    assert.equal(r.minimumIncrement.integerMultiplier,2*(N+1));assert.equal(r.retainedCoefficientCancellationProved,false);
  }
});

test('generic algebra, copied receipts and supplied scope flags never authenticate an actual source bridge',()=>{
  assert.throws(()=>assertActualStrengthenedBackground({scope:{wholeGN4Complete:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualFiniteResidualBridge({...finiteActualResidualIndexLedger(),scope:{wholeGN4Complete:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>actualPositiveStressFTC({records:[],pass:true}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
