import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {readRational,qcompare,rational as Q,qadd,qmul} from '../actual-continuation-arithmetic.mjs';
import {physicalCenterSlowSlopeNeighborhoodAudit,physicalCenterSlowSlopeIdentityAudit,enclosePhysicalCenterSlowSlopes,
  enclosePhysicalCenterJetCoefficients} from '../actual-physical-center-slow-slope-kernel.mjs';

const b=(lower,upper=lower)=>({lower,upper}),inside=(x,q)=>qcompare(readRational(x.lower),q)<=0&&qcompare(readRational(x.upper),q)>=0,
  fakeValues={weightedCylindrical:[[b('1/2'),b('1/2'),b('1/2')],[b('1/2'),b('1/2'),b('-1/2')]],
    centers:[b('1/3'),b('1/3')],covariance:[[b('1/4'),b('1/4')],[b('1/4'),b('-1/4')]],weights:[b('2'),b('2')]},
  controls={precisionBits:192,tolerance:'1/1000000000000'},mu={R:b('5/6'),Z:b('0'),T:b('-1/10000')},
  nu={R:b('-1/16'),Z:b('0'),T:b('-1/20000')};

test('the finite neighborhood proof retains strict positive h and the full Gamma moments',()=>{
  const a=physicalCenterSlowSlopeNeighborhoodAudit();assert.equal(a.pass,true);assert.equal(a.sourceAuthenticated,false);
  assert.ok(a.checks.every(x=>x.pass));assert.deepEqual(a.domain.delta,['3/16','5/16']);assert.deepEqual(a.domain.T,['15/16','17/16']);
  assert.equal(a.bounds.muNuDeltaAndTDerivativeAbsolute,'2^512');assert.equal(a.bounds.positiveTransferRadius,'2^-15000');
  assert.ok(qcompare(readRational(a.computed.logisticExponentUpper),Q(-38))<0);
  assert.match(a.proof.heat,/No infinite tail is omitted/);assert.match(a.proof.alpha,/3h\*u1\*u2/);
});

test('the arbitrary-time comparison identities keep the damping term and reject omitting1/T',()=>{
  const G=new ActualConvergentExpressions(),a=physicalCenterSlowSlopeIdentityAudit(G);
  assert.ok(a.checks.every(x=>x.pass));assert.equal(a.homogeneity.pass,true);assert.equal(a.negativeControl.correctlyRejected,true);
  const root=a.roots.mu.T,changed=G.substitute(root,a.coordinates.T,G.q(2)),atOne=G.substitute(root,a.coordinates.T,G.one),
    actual=sourceGraphRationalIdentity(G,G.sub(changed,G.div(atOne,G.q(2))),{maxTerms:12000});
  assert.equal(actual.pass,true);assert.equal(a.sourceAuthenticated,false);
});

test('new comparison intervals have the original nonzero signs and a positive displacement error',()=>{
  const a=enclosePhysicalCenterSlowSlopes(controls);assert.equal(a.rows.length,6);assert.equal(a.sourceAuthenticated,false);
  assert.ok(a.rows.every(x=>x.toleranceMet&&x.comparisonOnly));assert.ok(qcompare(readRational(a.mu.R.lower),Q(0))>0);
  for(const value of[a.mu.T,a.nu.R,a.nu.T])assert.ok(qcompare(readRational(value.upper),Q(0))<0);
  assert.ok(inside(a.mu.R,Q(5,6))===false);assert.ok(inside(a.mu.Z,Q(0)));assert.ok(inside(a.nu.Z,Q(0)));
  assert.equal(a.errorBudget.oldActualSolutionValueTransferred,false);assert.equal(a.errorBudget.actualODEErrorIncludedHere,false);
  assert.ok(qcompare(readRational(a.errorBudget.positiveDisplacementRadius),Q(0))>0);
  assert.ok(a.rows.filter(x=>x.direction!=='Z').every(x=>qcompare(readRational(x.width),Q(0))>0));
});

test('the conditional table has all228 unique required rows and no source authority',()=>{
  const p=enclosePhysicalCenterJetCoefficients({...controls,mu,nu,values:fakeValues});assert.equal(p.pass,true);assert.equal(p.rows.length,228);
  assert.deepEqual(Object.fromEntries(Object.entries(p.groups).map(([k,v])=>[k,v.length])),
    {weightedSlow:54,weightedFast:30,uncentered:72,rawPulseSlow:54,negativeModeSlow:18});
  assert.equal(new Set(p.rows.map(r=>[r.quantity,r.sign,r.component,r.derivative].join(':'))).size,228);
  assert.ok(p.rows.every(r=>r.toleranceMet&&r.nonzeroRemainderRetained&&!r.sourceAuthenticated));
  assert.equal(p.sourceAuthenticated,false);assert.equal(p.wholeGNUMComplete,false);
});

test('both signed axial weighted components and all mixed derivatives retain their signs',()=>{
  const p=enclosePhysicalCenterJetCoefficients({...controls,mu,nu,values:fakeValues}),row=(sign,d)=>p.rows.find(r=>r.quantity==='weightedPulse'&&r.sign===sign&&r.component===2&&r.derivative===d);
  assert.ok(inside(row(1,'RR').interval,Q(-25,72)));assert.ok(inside(row(-1,'RR').interval,Q(25,72)));
  assert.ok(inside(row(1,'Rv').interval,Q(5,12)));assert.ok(inside(row(-1,'Rv').interval,Q(-5,12)));
  assert.ok(inside(row(1,'vv').interval,Q(-1,2)));assert.ok(inside(row(-1,'vv').interval,Q(1,2)));
  assert.match(row(-1,'RR').exactScale,/u\*A0/);
});

test('actual a/H/y recurrence factors and the inverse first sign are preserved',()=>{
  const p=enclosePhysicalCenterJetCoefficients({...controls,mu,nu,values:fakeValues}),row=(quantity,d)=>p.rows.find(r=>r.quantity===quantity&&r.sign===1&&r.component===0&&r.derivative===d);
  assert.ok(inside(row('a','R').interval,Q(-1,48)));assert.ok(inside(row('a','RR').interval,Q(1,768)));
  assert.ok(inside(row('H','R').interval,Q(-1,32)));assert.ok(inside(row('H','RR').interval,Q(1,256)));
  assert.ok(inside(row('y','R').interval,Q(1,4)));assert.ok(inside(row('y','RR').interval,Q(1,32)));
});

test('raw source pulse slow derivatives retain component orientation and use the absolute center',()=>{
  const p=enclosePhysicalCenterJetCoefficients({...controls,mu,nu,values:fakeValues}),r=p.rows.find(r=>r.quantity==='pulse'&&r.sign===-1&&r.component===2&&r.derivative==='RT');
  assert.ok(inside(r.interval,Q(-1,960000)));assert.equal(r.exactScale,'u*(g*Ls)^2');
  assert.ok(p.rows.filter(r=>r.quantity==='pulse').every(r=>r.strictlyPositiveRemainder!=='0'));
});

test('the negative mode is enclosed with a positive radius, not assigned a zero derivative',()=>{
  const p=enclosePhysicalCenterJetCoefficients({...controls,mu,nu,values:fakeValues}),rows=p.groups.negativeModeSlow;
  assert.equal(rows.length,18);assert.ok(rows.every(r=>qcompare(readRational(r.interval.lower),Q(0))<0&&qcompare(readRational(r.interval.upper),Q(0))>0));
  assert.match(p.errorBudget.negativeMode,/q_ij/);assert.match(p.errorBudget.negativeMode,/initial layer/);
});

test('conditional slope changes change the table and are never authenticated by generic arithmetic',()=>{
  const p=enclosePhysicalCenterJetCoefficients({...controls,mu,nu,values:fakeValues}),changed=enclosePhysicalCenterJetCoefficients({...controls,mu:{...mu,R:b('1/2')},nu,values:fakeValues}),
    first=p.rows.find(r=>r.quantity==='weightedPulse'&&r.sign===1&&r.component===0&&r.derivative==='RR'),
    second=changed.rows.find(r=>r.quantity==='weightedPulse'&&r.sign===1&&r.component===0&&r.derivative==='RR');
  assert.notDeepEqual(first.interval,second.interval);assert.ok(inside(second.interval,Q(-1,8)));
  assert.equal(changed.sourceAuthenticated,false);
});

test('source-like inputs, bad conditioning, floating widths and excessive widths fail',()=>{
  assert.throws(()=>enclosePhysicalCenterSlowSlopes({...controls,h:'0'}),{code:'INVALID_INPUT'});
  assert.throws(()=>enclosePhysicalCenterSlowSlopes({...controls,tolerance:1e-12}),{code:'INVALID_INPUT'});
  assert.throws(()=>enclosePhysicalCenterSlowSlopes({...controls,tolerance:'1/'+(1n<<600n)}),{code:'PRECISION_REQUIRED'});
  assert.throws(()=>enclosePhysicalCenterJetCoefficients({...controls,mu:{...mu,R:b('2')},nu,values:fakeValues}),{code:'INVALID_INPUT'});
  assert.throws(()=>enclosePhysicalCenterJetCoefficients({...controls,mu,nu,values:{...fakeValues,weights:[b('0'),b('2')]}}),{code:'INVALID_INPUT'});
  assert.throws(()=>enclosePhysicalCenterJetCoefficients({...controls,mu,nu,values:{...fakeValues,weightedCylindrical:[[b('1/4','3/4'),b('1/2'),b('1/2')],fakeValues.weightedCylindrical[1]]}}),{code:'PRECISION_REQUIRED'});
});
