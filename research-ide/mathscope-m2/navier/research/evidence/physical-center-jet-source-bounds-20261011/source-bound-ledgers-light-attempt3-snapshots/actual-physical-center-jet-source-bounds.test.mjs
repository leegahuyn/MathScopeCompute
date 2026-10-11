import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {rational as Q,qmul,qdiv,qadd,qsub,qcompare,readRational} from '../actual-continuation-arithmetic.mjs';
import {terminalFiniteSlowFieldMajorant} from '../actual-centered-slow-jet-enclosure-kernel.mjs';
import {physicalCenterCompleteCurlErrorPowerAudit} from '../actual-physical-center-full-curl-jet-kernel.mjs';
import {physicalCenterFiniteFieldMajorant,physicalCenterOriginalPartitionBoundAudit,physicalCenterFinitePrimitivePowerAudit,
  physicalCenterWeightedJetPowerAudit,physicalCenterOriginalPhaseJetAudit,physicalCenterPhasePowerAudit,
  physicalCenterJetSourceBoundAudit} from '../actual-physical-center-jet-source-bounds.mjs';

test('the expanded field uses the actual new box and dominates the old literal-center majorant',()=>{
  const a=physicalCenterFiniteFieldMajorant(),old=terminalFiniteSlowFieldMajorant();
  assert.equal(a.pass,true);assert.equal(a.sourceAuthenticated,false);assert.deepEqual(a.domain.delta,['3/16','5/16']);
  assert.deepEqual(a.domain.Tsharp,['15/16','17/16']);assert.equal(a.rows.length,6);
  for(let j=1;j<=5;j++)assert.ok(qcompare(readRational(a.rows[j].ordinaryDerivativeUpper),readRational(old.rows[j].ordinaryDerivativeUpper))>0);
  // The independent first-order product has radial4, step256, heat8.
  assert.equal(a.rows[1].ordinaryDerivativeUpper,String(4+256+8));
  assert.equal(a.rows[5].ordinaryDerivativeUpper,'160382079967680232221120');
  assert.equal(a.positiveHReplacedByZero,false);assert.equal(a.oldPointNumericalJetsUsed,false);
});

test('the original partition bound retains a positive selected-label numerator and all denominator derivatives',()=>{
  const a=physicalCenterOriginalPartitionBoundAudit();assert.equal(a.pass,true);assert.ok(a.checks.every(x=>x.pass));
  assert.equal(a.positiveSingleFactorLower,'2^-18');assert.equal(a.positiveFourFactorLower,'2^-72');
  assert.ok(a.computed.inverseDenominatorDerivatives.length===4&&a.computed.normalizedBumpDerivatives.length===3);
  for(const r of a.computed.stepOrdinaryDerivativeMajorants.slice(1))assert.ok(qcompare(readRational(r),Q(1n<<64n))<0);
  assert.deepEqual(a.provedStrongerByOrder,[{order:0,B:0,S:0},{order:1,B:1,S:3},{order:2,B:1,S:6}]);
  assert.equal(a.sourceAuthenticated,false);
});

test('expanded target and complete C geometry are separately bounded from the final matrix',()=>{
  const a=physicalCenterFinitePrimitivePowerAudit();assert.equal(a.pass,true);
  assert.equal(a.matrix.computedMaximumPower,3313);assert.equal(a.amplitude.maximumPower,1132);
  assert.equal(a.coefficientGeometryPower,1057);assert.ok(a.target.maximumPower<512);
  assert.match(a.target.tauProof,/1024\/9<128/);assert.match(a.target.tauProof,/s\^\(-1-h\)/);
  assert.match(a.target.chartProof,/both theta\/axial shear terms/);
  assert.equal(a.oldLiteralCenterValueReused,false);assert.equal(a.sourceAuthenticated,false);
});

test('the new-center H sign boxes directly imply finite inverse and positive sqrt conditioning',()=>{
  const a=physicalCenterWeightedJetPowerAudit();assert.deepEqual(a.computedConditioning,{
    centeredDeterminantLower:'1/2',centeredEntryUpper:'8',centeredInverseInfinityUpper:'32',centeredWeightLower:'1/16',centeredWeightUpper:'1'});
  // Check the endpoint matrices independently. Their second rows have
  // opposite signs; changing that sign may produce a singular matrix.
  const values=[Q(1,8),Q(1,2)],centers=[Q(1,4),Q(1,2)];
  for(const h00 of values)for(const h01 of values)for(const h10 of values)for(const h11abs of values)
    for(const ap of centers)for(const am of centers){
      const pp=qmul(ap,ap),pm=qmul(am,am),K=[[qdiv(h00,pp),qdiv(h01,pm)],[qdiv(h10,pp),qdiv(qmul(Q(-1),h11abs),pm)]],
        absdet=qsub(qmul(K[0][1],K[1][0]),qmul(K[0][0],K[1][1])),
        row0=qdiv(qadd(qmul(Q(-1),K[1][1]),K[0][1]),absdet),row1=qdiv(qadd(K[1][0],K[0][0]),absdet);
      assert.ok(qcompare(absdet,Q(1,2))>=0);assert.ok(qcompare(row0,Q(32))<=0&&qcompare(row1,Q(32))<=0);
    }
  const sameSignDet=qsub(qmul(Q(1,8),Q(1,8)),qmul(Q(1,8),Q(1,8)));
  assert.equal(qcompare(sameSignDet,Q(0)),0);assert.equal(a.numericalJetValuesUsedToProveTheirOwnErrors,false);
});

function phaseFixture(){
  const G=new ActualConvergentExpressions(),x=Object.fromEntries(['R','Z','T','v','theta','xi','p','pz','x0','epsilon'].map(n=>[n,G.fresh('phase_bound_'+n)])),
    F=G.add(G.mul(x.R,x.T),G.pow(x.Z,2),G.mul(G.pow(x.T,2),x.Z),G.pow(x.R,3)),
    axial=G.add(G.mul(x.R,x.Z),G.pow(x.T,2)),speed=G.add(G.mul(x.p,F),G.mul(x.pz,axial)),
    phase=G.sub(G.add(G.mul(x.p,x.theta),G.div(G.mul(x.pz,x.Z),x.epsilon),G.mul(x.x0,x.R)),G.mul(x.v,speed));
  return {G,input:{...x,speed,phase}};
}

test('all original first and second phase formulas retain axial speed, epsilon and the repeated time coefficient',()=>{
  const {G,input}=phaseFixture(),a=physicalCenterOriginalPhaseJetAudit(G,input);
  assert.equal(a.first.length,4);assert.equal(a.second.length,10);assert.ok(a.checks.every(x=>x.pass));
  assert.equal(a.xiDerivative,G.zero);assert.notEqual(a.H2.ZZ,G.zero);assert.notEqual(a.H2.TT,G.zero);
  const timeTime=a.second.find(r=>r.directions==='tt'),missingOne=G.sub(timeTime.expected,G.mul(input.epsilon,a.H.T)),
    control=sourceGraphRationalIdentity(G,G.sub(timeTime.original,missingOne),{maxTerms:18000});
  assert.equal(control.pass,false);assert.equal(a.fullAxialSpeedRetained,true);assert.equal(a.sourceAuthenticated,false);
  const angular=a.second.find(r=>r.directions==='thetatheta');assert.notEqual(angular.connection,G.zero);
  const omittedConnection=sourceGraphRationalIdentity(G,G.sub(angular.original,angular.connection),{maxTerms:18000});
  assert.equal(omittedConnection.pass,true);assert.notEqual(angular.original,G.zero);assert.equal(a.angularHessianConnectionRetained,true);
});

test('wrong full phase and slow-dependent frozen carriers are rejected before any source claim',()=>{
  const {G,input}=phaseFixture();
  assert.throws(()=>physicalCenterOriginalPhaseJetAudit(G,{...input,phase:G.add(input.phase,input.R)}),{code:'INTERNAL_VALIDATION'});
  assert.throws(()=>physicalCenterOriginalPhaseJetAudit(G,{...input,p:input.R}),{code:'INVALID_INPUT'});
  assert.throws(()=>physicalCenterOriginalPhaseJetAudit(G,{...input,speed:G.add(input.speed,input.v)}),{code:'INVALID_INPUT'});
  assert.throws(()=>physicalCenterOriginalPhaseJetAudit(G,{...input,phase:G.add(input.phase,input.xi)}),{code:'INTERNAL_VALIDATION'});
});

test('pulse-length inverse stays visible and all finite bounds match the conditional full-curl interface',()=>{
  const a=physicalCenterJetSourceBoundAudit(),kernel=physicalCenterCompleteCurlErrorPowerAudit(),phase=physicalCenterPhasePowerAudit();
  assert.equal(a.pass,true);assert.equal(a.sourceAuthenticated,false);assert.equal(a.wholeGNUMComplete,false);
  assert.equal(phase.inversePulseLengthHiddenInScalarPremise,false);assert.deepEqual(phase.inverseRawTimePhaseScale,{B:1,S:1});
  assert.match(phase.exactTimeSecond,/2\*epsilon/);assert.match(phase.exactTimeSecond,/epsilon\^2/);
  assert.deepEqual(phase.provedStrongerNormalizedSecondPower,{B:1,S:2});assert.match(phase.exactAngularSecond,/L\^2<=S\^2/);
  for(const premise of a.sourcePremises){const k=kernel.rows.find(r=>r.id===premise.id);assert.ok(k);assert.equal(premise.B,k.B);assert.equal(premise.S,k.S);}
  assert.equal(a.weighted.provedStrongerPower.S,2);assert.ok(a.bindingObligations.length>=10);
  assert.equal(a.oldPointJetTransplantAllowed,false);
});

test('fixed scalar implications reject fabricated source flags and caller supplied upper bounds',()=>{
  for(const f of [physicalCenterFiniteFieldMajorant,physicalCenterOriginalPartitionBoundAudit,physicalCenterFinitePrimitivePowerAudit,
    physicalCenterWeightedJetPowerAudit,physicalCenterPhasePowerAudit,physicalCenterJetSourceBoundAudit]){
    assert.throws(()=>f({sourceAuthenticated:true}),{code:'INVALID_INPUT'});
    assert.throws(()=>f({B:1,maximumPower:0}),{code:'INVALID_INPUT'});
  }
});
