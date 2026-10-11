import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {encloseTerminalStepJet,terminalFieldSlowJetIdentityAudit,attachActualTerminalFieldScaledEnclosure,assertActualTerminalFieldScaledEnclosure,prepareActualTerminalFieldScaledEnclosure} from '../actual-terminal-field-scaled-enclosure.mjs';
import {readRational as read,qcompare,qsub,rational as Q} from '../actual-continuation-arithmetic.mjs';

const reference=JSON.parse(readFileSync(new URL('../research/evidence/terminal-field-20261011/decimal-step-reference.json',import.meta.url),'utf8'));
const decimal=s=>{let[body,p='0']=s.toLowerCase().split('e');const negative=body.startsWith('-');if(negative)body=body.slice(1);const[a,b='']=body.split('.');let n=BigInt(a+b),d=10n**BigInt(b.length),exponent=BigInt(p);if(exponent>=0)n*=10n**exponent;else d*=10n**(-exponent);return Q(negative?-n:n,d);};

test('complete terminal integrand derivatives and exact h factor pass rational audit',()=>{
  const p=terminalFieldSlowJetIdentityAudit(new ActualSourceExpressions());
  assert.equal(p.checks.length,10);assert.ok(p.checks.every(c=>c.pass));assert.equal(p.sourceAuthenticated,false);
  assert.ok(p.checks.some(c=>c.id==='TT-retains-exact-positive-h-factor'));
});

test('dropping either radial curvature or the full-F axial curvature is rejected',()=>{
  const p=terminalFieldSlowJetIdentityAudit(new ActualSourceExpressions());
  assert.equal(p.negativeControls.length,2);assert.ok(p.negativeControls.every(c=>c.correctlyRejected&&!c.check.pass));
});

test('192-bit step intervals contain independent 180-digit Decimal evaluations',()=>{
  const p=encloseTerminalStepJet();assert.equal(reference.precisionDigits,200);
  for(const key of ['exp','sigma','first','second']){
    const v=decimal(reference.values[key]);assert.ok(qcompare(read(p[key].lower),v)<0,key+' lower');assert.ok(qcompare(v,read(p[key].upper))<0,key+' upper');
  }
  assert.equal(p.arithmetic.binary64UsedForDecisions,false);assert.equal(p.sourceAuthenticated,false);
});

test('the terminal step and both derivatives are nonzero and their full tails retained',()=>{
  const p=encloseTerminalStepJet();
  for(const key of ['exp','sigma','first','second'])assert.ok(qcompare(read(p[key].lower),Q(0))>0);
  assert.ok(qcompare(read(p.normalized.c.upper),Q(0))<0);
  assert.ok(qcompare(read(p.proof.positiveTaylorRemainderUpper),Q(0))>0);
  assert.equal(p.proof.rangeReductionShifts,9);assert.equal(p.proof.reducedArgument,'6/49');
});

test('512-bit step intervals refine the executed 192-bit intervals',()=>{
  const a=encloseTerminalStepJet(),b=encloseTerminalStepJet({precisionBits:512});
  for(const key of ['exp','sigma','first','second']){
    assert.ok(qcompare(read(a[key].lower),read(b[key].lower))<=0);
    assert.ok(qcompare(read(b[key].upper),read(a[key].upper))<=0);
    assert.ok(qcompare(qsub(read(b[key].upper),read(b[key].lower)),Q(1,10n**140n))<0);
  }
});

test('unattainable precision and caller replacement of the source witness fail before construction',()=>{
  for(const input of [{h:0},{B:1},{ellExact:'1'},{witness:'other'},{m3MayStart:true},[]])assert.throws(()=>prepareActualTerminalFieldScaledEnclosure(input),{code:'INVALID_INPUT'});
  assert.throws(()=>prepareActualTerminalFieldScaledEnclosure({precisionBits:96}),{code:'PRECISION_REQUIRED'});
  assert.throws(()=>prepareActualTerminalFieldScaledEnclosure({tolerance:1e-15}),{code:'INVALID_INPUT'});
  assert.throws(()=>encloseTerminalStepJet({precisionBits:53}),{code:'INVALID_INPUT'});
});

test('generic numerical or copied reports cannot authenticate complete source F',()=>{
  assert.throws(()=>attachActualTerminalFieldScaledEnclosure(encloseTerminalStepJet()),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualTerminalFieldScaledEnclosure({pass:true}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
