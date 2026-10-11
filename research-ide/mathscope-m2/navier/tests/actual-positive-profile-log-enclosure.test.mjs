import test from 'node:test';
import assert from 'node:assert/strict';
import {encloseActualPositiveProfileLogs,assertActualPositiveProfileLogs,actualPositiveProfileLogCertificate,positiveProfileTowerErrorAudit,numericalExponentialInterval,numericalEndpointIsClosed} from '../actual-positive-profile-log-enclosure.mjs';
import {readRational,qcompare,rational as Q} from '../actual-continuation-arithmetic.mjs';

const promise=encloseActualPositiveProfileLogs();
test('the original positive profile formulas bind before numerical evaluation',async()=>{
  const p=await promise;assert.equal(p.pass,true);assert.equal(p.sourceBinding.checks.length,24);assert.ok(p.sourceBinding.checks.every(x=>x.pass));
  assert.deepEqual(p.sourceBinding.originalH,{exp:{product:[{integer:-8002},{ref:'T'}]}});
  assert.deepEqual(p.sourceBinding.originalT,{sum:[{exp:{ref:'Md'}},{integer:10}]});
  assert.match(p.sourceBinding.evaluatedParameterDefinitionSHA256,/^[a-f0-9]{64}$/);assert.equal(assertActualPositiveProfileLogs(p),true);
});
test('all fifteen absolute intervals have numerical endpoints and positive lower bounds',async()=>{
  const p=await promise;assert.equal(p.rows.length,15);
  for(const r of p.rows){assert.equal(numericalEndpointIsClosed(r.interval.lower),true);assert.equal(numericalEndpointIsClosed(r.interval.upper),true);
    assert.equal(r.interval.strictlyPositiveLower,true);assert.equal(r.interval.originalValueRelativeErrorGuaranteed,false);
    assert.ok(qcompare(readRational(r.logCoordinateWidth),readRational(r.logCoordinateTolerance))<=0);assert.ok(qcompare(readRational(r.logCoordinateWidth),Q(0))>0);}
  assert.equal(numericalEndpointIsClosed({parameter:'h'}),false);assert.equal(numericalEndpointIsClosed({root:3}),false);
  assert.equal(numericalEndpointIsClosed({integral:['original density']}),false);
});
test('small positive towers reverse the seed endpoint order without a zero endpoint',()=>{
  const p=numericalExponentialInterval({height:2,small:true,coordinate:{lower:'7',upper:'8'}});
  assert.deepEqual(p.lower,{exp:{neg:{exp:{rational:'8'}}}});assert.deepEqual(p.upper,{exp:{neg:{exp:{rational:'7'}}}});
  const big=numericalExponentialInterval({height:3,coordinate:{lower:'7',upper:'8'}});
  assert.deepEqual(big.lower,{exp:{exp:{exp:{rational:'7'}}}});assert.deepEqual(big.upper,{exp:{exp:{exp:{rational:'8'}}}});
  assert.throws(()=>numericalExponentialInterval({height:2,small:true,coordinate:{lower:'8',upper:'7'}}),/reversed/);
});
test('the exact source exponent arithmetic and every finite dominance inequality hold',()=>{
  const p=positiveProfileTowerErrorAudit();assert.equal(p.pass,true);assert.ok(p.checks.every(x=>x.pass));
  assert.equal(p.reserveExponent,4096);assert.equal(p.M,1048576);
  assert.equal(p.relativeAccuracyOfOriginalTowerValueClaimed,false);
});
test('regular constants use directed intervals while source geometry membership remains separate',async()=>{
  const p=await promise,lo=readRational(p.regular.sqrt2.lower),hi=readRational(p.regular.sqrt2.upper);
  assert.ok(lo[0]*lo[0]<2n*lo[1]*lo[1]);assert.ok(hi[0]*hi[0]>2n*hi[1]*hi[1]);
  assert.equal(p.scope.regularGeometryConstantsNeedOwnBandBinding,true);
  for(const k of ['actualEllNumericallyEnclosed','actualCiLsEpsilonNumericallyEnclosed','actualTargetTauNumericallyEnclosed','wholeGNUMComplete','M3Started'])assert.equal(p.scope[k],false);
});
test('fake source parameters, copied certificates and mutated endpoints cannot authenticate',async()=>{
  await assert.rejects(encloseActualPositiveProfileLogs({h:0}),/Only/);await assert.rejects(encloseActualPositiveProfileLogs({sourceProfile:'other'}),/Only/);
  const p=await promise,copy=actualPositiveProfileLogCertificate(p);assert.throws(()=>assertActualPositiveProfileLogs(copy),/private/);
  const original=p.rows[1].interval.lower;p.rows[1].interval.lower={rational:'0'};
  assert.throws(()=>assertActualPositiveProfileLogs(p),/private/);p.rows[1].interval.lower=original;assert.equal(assertActualPositiveProfileLogs(p),true);
});
test('a requested logarithm accuracy below the directed arithmetic budget is rejected',async()=>{
  await assert.rejects(encloseActualPositiveProfileLogs({precisionBits:96,logCoordinateTolerance:'1/'+String(10n**90n)}),/wider than requested/);
});
