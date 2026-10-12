import test from 'node:test';
import assert from 'node:assert/strict';
import {enclosePhysicalCenterJetCoefficients} from '../actual-physical-center-slow-slope-kernel.mjs';
import {enclosePhysicalCompleteCurlJetCoefficients} from '../actual-physical-center-full-curl-jet-kernel.mjs';
import {rational as Q,readRational,qadd,qsub,qmul,qcompare} from '../actual-continuation-arithmetic.mjs';

// Deliberately distinct signed conditional values expose component/sign
// swaps in the public join. This fixture does not construct a source point.
const point=x=>({lower:x,upper:x}),mu={R:point('4/5'),Z:point('0'),T:point('-1/10')},
  nu={R:point('-1/20'),Z:point('0'),T:point('-1/30')},
  values={weightedCylindrical:[['2/5','1/2','3/5'].map(point),['9/20','11/20','-13/20'].map(point)],
    centers:['1/3','3/8'].map(point),covariance:[['1/4','3/8'].map(point),['1/3','-2/5'].map(point)],weights:['2','3'].map(point)},
  request={precisionBits:192,tolerance:'1/1000000000000'},
  key=r=>[r.quantity,r.sign??'physical',r.component,r.derivative??r.direction??r.directions.join('')].join(':'),
  paired=()=>{
    const pulse=enclosePhysicalCenterJetCoefficients({...request,mu,nu,values}),physical=enclosePhysicalCompleteCurlJetCoefficients({...request,velocityCoefficients:values.weightedCylindrical[0]});
    return {pulse,physical,rows:[...pulse.rows,...physical.rows.map(r=>({...r,quantity:'physicalCurl'}))]};
  },slow=['R','Z','T','RR','RZ','RT','ZZ','ZT','TT'],fast=['v','vv','Rv','Zv','Tv'];

test('the public join has exactly the independently enumerated 228 pulse and 42 physical derivative keys',()=>{
  const {pulse,physical,rows}=paired(),actual=new Set(rows.map(key)),expected=new Set(),
    add=(quantity,sign,component,derivative)=>expected.add([quantity,sign,component,derivative].join(':'));
  for(const sign of [1,-1]){
    for(const component of [0,1,2]){
      for(const derivative of slow){add('weightedPulse',sign,component,derivative);add('pulse',sign,component,derivative);}
      for(const derivative of fast)add('weightedPulse',sign,component,derivative);
    }
    for(const derivative of slow){add('a',sign,0,derivative);add('wMinus',sign,1,derivative);add('y',sign,0,derivative);
      add('H',sign,0,derivative);add('H',sign,1,derivative);}
  }
  const physicalDerivatives=['r','z','t','theta','rr','rz','rt','rtheta','zz','zt','ztheta','tt','ttheta','thetatheta'];
  for(const component of [0,1,2])for(const derivative of physicalDerivatives)add('physicalCurl','physical',component,derivative);
  assert.equal(pulse.rows.length,228);assert.equal(physical.rows.length,42);assert.equal(rows.length,270);assert.equal(actual.size,270);
  assert.deepEqual([...actual].sort(),[...expected].sort());
  assert.equal(pulse.sourceAuthenticated,false);assert.equal(physical.sourceAuthenticated,false);
  assert.equal(pulse.wholeGNUMComplete,false);assert.equal(physical.wholeGNUMComplete,false);
});

test('every joined conditional interval contains the independently computed signed principal coefficient',()=>{
  const {rows}=paired(),rationalBox=x=>readRational(x.lower),M=Object.fromEntries(Object.entries(mu).map(([k,v])=>[k,rationalBox(v)])),
    N=Object.fromEntries(Object.entries(nu).map(([k,v])=>[k,rationalBox(v)])),phaseSign={r:1,z:-1,t:-1,theta:1};
  for(const row of rows){
    let center=Q(0);const family=row.sign===-1?1:0,derivative=row.derivative,component=row.component,
      W=rationalBox(values.weightedCylindrical[family][component]??values.weightedCylindrical[family][0]);
    if(row.quantity==='physicalCurl'){
      if(row.order===2)center=qmul(Q(-phaseSign[row.directions[0]]*phaseSign[row.directions[1]]),rationalBox(values.weightedCylindrical[0][component]));
    }else if(row.quantity==='weightedPulse'){
      if(derivative==='vv')center=qmul(Q(-1),W);
      else if(derivative.length===2&&derivative[1]==='v')center=qmul(M[derivative[0]],W);
      else if(derivative.length===2)center=qmul(Q(-1),qmul(W,qmul(M[derivative[0]],M[derivative[1]])));
    }else if(row.quantity!=='wMinus'){
      const factor=derivative.length===1?N[derivative]:qmul(N[derivative[0]],N[derivative[1]]);
      if(row.quantity==='a'||row.quantity==='pulse')center=qmul(rationalBox(values.centers[family]),factor);
      if(row.quantity==='pulse'&&component===2&&row.sign===-1)center=qmul(Q(-1),center);
      if(row.quantity==='H')center=qmul(Q(row.order===1?2:4),qmul(rationalBox(values.covariance[component][family]),factor));
      if(row.quantity==='y')center=qmul(Q(row.order===1?-2:4),qmul(rationalBox(values.weights[family]),factor));
    }
    const interval=row.coefficient??row.interval;
    assert.ok(qcompare(readRational(interval.lower),center)<0,'strict positive error below '+key(row));
    assert.ok(qcompare(readRational(interval.upper),center)>0,'strict positive error above '+key(row));
  }
});

test('both error reserves are positive and every published width equals its actual directed endpoint width',()=>{
  const {pulse,physical,rows}=paired();assert.ok(qcompare(readRational(pulse.errorBudget.positiveRadius),Q(0))>0);
  assert.ok(qcompare(readRational(physical.positiveRemainder),Q(0))>0);
  assert.equal(qcompare(readRational(pulse.errorBudget.positiveRadius),Q(1,1n<<560n)),0);
  assert.equal(qcompare(readRational(physical.positiveRemainder),Q(1,1n<<512n)),0);
  for(const row of rows){const interval=row.coefficient??row.interval,width=qsub(readRational(interval.upper),readRational(interval.lower));
    assert.equal(qcompare(width,readRational(row.width)),0,key(row));assert.ok(qcompare(width,readRational(request.tolerance))<=0,key(row));
    assert.ok(qcompare(width,Q(0))>0,key(row));assert.equal(row.toleranceMet,true);}
  const angular=physical.second.filter(r=>r.directions.includes('theta'));
  assert.equal(angular.length,12);assert.ok(angular.every(r=>r.includesCylindricalFrameConnection));
  assert.equal(angular.filter(r=>r.includesAngularDirectionConnection).length,3);
});

test('changing the signed H column or omitting the frozen-coordinate conditioning cannot enter the generic join',()=>{
  const changed=structuredClone(values);changed.covariance[1][1]=point('2/5');
  assert.throws(()=>enclosePhysicalCenterJetCoefficients({...request,mu,nu,values:changed}),{code:'INVALID_INPUT'});
  assert.throws(()=>enclosePhysicalCenterJetCoefficients({...request,mu:{R:mu.R,T:mu.T},nu,values}),{code:'INVALID_INPUT'});
  assert.throws(()=>enclosePhysicalCenterJetCoefficients({...request,mu,nu,values,sourceAuthenticated:true}),{code:'INVALID_INPUT'});
});
