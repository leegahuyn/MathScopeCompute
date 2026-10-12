import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {prepareActualTerminalFieldScaledEnclosure,assertActualTerminalFieldScaledEnclosure,actualTerminalFieldScaledEnclosureCertificateFromProgram} from '../actual-terminal-field-scaled-enclosure.mjs';
import {readRational as read,rational as Q,qcompare,qsub} from '../actual-continuation-arithmetic.mjs';

let p,certificate;const began=performance.now();
before(()=>{p=prepareActualTerminalFieldScaledEnclosure();});
after(async()=>{
  if(!p)return;
  certificate=await actualTerminalFieldScaledEnclosureCertificateFromProgram(p);
  if(process.env.MATHSCOPE_TERMINAL_FIELD_OUTPUT)writeFileSync(process.env.MATHSCOPE_TERMINAL_FIELD_OUTPUT,JSON.stringify({certificate,elapsedMs:performance.now()-began,peakRSSBytes:process.resourceUsage().maxRSS*1024},null,2)+'\n');
});

test('the original private complete F and all source bindings are retained',()=>{
  assert.equal(p.checks.length,10);assert.ok(p.checks.every(r=>r.pass));
  assert.equal(p.roots.originalCompletedFAtWitness,p.source.roots.actualCompletedFAtWitness);
  assert.equal(p.roots.originalLeadingFAtWitness,p.source.roots.actualLeadingFAtWitness);
  assert.equal(p.roots.h,p.G.parameter('h'));
});

test('the complete field has one value and all nine slow jets at the exact witness',()=>{
  assert.deepEqual(Object.keys(p.roots.witnessJets),['F','R','Z','T','RR','RZ','RT','ZZ','ZT','TT']);
  assert.ok(Object.values(p.roots.witnessJets).every(root=>p.G.freeCoordinates(root).size===0));
  assert.equal(p.roots.B===p.G.zero,false);assert.equal(p.roots.B===p.G.one,false);
});

test('every complete coefficient meets the requested exact width and sign',()=>{
  const expected={F:'POSITIVE',R:'NEGATIVE',Z:'ZERO',T:'NEGATIVE',RR:'POSITIVE',RZ:'ZERO',RT:'POSITIVE',ZZ:'NEGATIVE',ZT:'ZERO',TT:'NEGATIVE'};
  for(const row of p.numerics.rows){
    assert.equal(row.sign,expected[row.id]);
    assert.ok(qcompare(qsub(read(row.coefficient.upper),read(row.coefficient.lower)),read(p.request.tolerance))<=0);
    assert.equal(row.sourceFactorSetToZero,false);
  }
});

test('full F has a nonzero ZZ curvature although the heat factor has exact zero ZZ',()=>{
  assert.equal(p.heatEnclosure.roots.witnessSlowJets.ZZ,p.G.zero);
  assert.notEqual(p.roots.witnessJets.ZZ,p.G.zero);
  const zz=p.numerics.rows.find(r=>r.id==='ZZ');assert.ok(qcompare(read(zz.coefficient.upper),Q(0))<0);
  assert.ok(qcompare(read(zz.coefficient.lower),Q(-1,100))>0);
  for(const id of ['Z','RZ','ZT'])assert.equal(p.roots.witnessJets[id],p.G.zero);
});

test('the positive source h in TT is factored exactly before numerical cancellation',()=>{
  assert.equal(p.roots.exactPositiveFactors.TT,p.G.mul(p.roots.B,p.roots.h));
  const tt=p.numerics.rows.find(r=>r.id==='TT');assert.equal(tt.sign,'NEGATIVE');assert.equal(tt.exactPositiveFactor,'B*h/T^2');
  assert.ok(qcompare(read(tt.coefficient.upper),Q(0))<0);
  assert.ok(qcompare(read(tt.coefficient.lower),Q(-1,100))>0);
  assert.equal(p.roots.exactPositiveFactors.T,p.G.mul(p.roots.B,p.roots.h));
  assert.equal(p.roots.exactPositiveFactors.ZZ,p.G.mul(p.roots.B,p.roots.h));
});

test('complete heat remainders and nonzero terminal step derivatives enter the final budget',()=>{
  assert.equal(p.numerics.errorBudget.allArithmeticAndElementaryTailsIncluded,true);
  assert.ok(qcompare(read(p.numerics.step.first.lower),Q(0))>0);
  assert.ok(qcompare(read(p.numerics.step.second.lower),Q(0))>0);
  assert.ok(p.numerics.heatMoments.errorBudget.includesAllImproperTail);
  assert.ok(p.proof.identityAudit.negativeControls.every(c=>c.correctlyRejected));
});

test('scaled terminal coefficients do not promote unrelated domain, covariance, Lean or M3 gates',()=>{
  assert.equal(p.scope.actualCompleteTerminalFAndNineSlowJetsBound,true);
  for(const key of ['unscaledHighRelativePrecision','wholeDomainFNumericallyEnclosed','actualPulseVolterraJetsEnclosed','wholeCovarianceHEnclosed','determinantOrWeightsEnclosed','wholeGNUMComplete','newLeanKernelProof','m3MayStart'])assert.equal(p.scope[key],false);
  assert.equal(p.sourceBinding.originalGammaMembershipForEllOne,false);
});

test('edited numerical coefficients and copied construction objects lose source authority',()=>{
  const row=p.numerics.rows[0],old=row.coefficient.lower;row.coefficient.lower='0';
  assert.throws(()=>assertActualTerminalFieldScaledEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});row.coefficient.lower=old;
  assert.throws(()=>assertActualTerminalFieldScaledEnclosure({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.equal(assertActualTerminalFieldScaledEnclosure(p),true);
});
