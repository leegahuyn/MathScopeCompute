/** Build-time projection only. The caller must first verify the immutable
 * physical certificate hash and completed observed original source process.
 * This projection does not create source authority from serialized data.
 */
import assert from 'node:assert/strict';
import {SOURCE_PROFILE_ID,sourceExponentContract} from '../source-profile.mjs';
import {readRational,qcompare,rational as Q} from '../actual-continuation-arithmetic.mjs';

const allPassed=rows=>Array.isArray(rows)&&rows.length>0&&rows.every(row=>row.pass===true);
const requiredBoundChecks=['same-recursive-source-scale-and-band-integer','same-huge-band-and-source-C2-base',
  'source-Gaussian-and-Riccati-premises-are-uniform'];
const requiredFamilyChecks=['same-original-coupled-system-and-unit-initial-data','new-point-full-centers-and-original-moving-frame',
  'complete-original-moving-pressure-basis-and-damping-at-new-point','new-source-integrals-and-inverse-weights-are-fully-substituted'];

export function projectPhysicalCenterNegativeModePremises(physicalCenter,certificate,originalTorusMap){
  assert.equal(physicalCenter.schema,'MathScope.ActualCommonPhysicalCenterCertificate/1');
  assert.equal(physicalCenter.pass,true);assert.ok(allPassed(physicalCenter.checks));
  assert.match(certificate.sha256,/^[a-f0-9]{64}$/);assert.equal(typeof certificate.path,'string');
  assert.deepEqual(physicalCenter.point.originalTorusMapBinding,originalTorusMap);
  assert.equal(originalTorusMap.comparison.allSixExpectedBodiesMatched,true);
  assert.equal(originalTorusMap.comparison.oldMissingFactorAccepted,false);
  const bounds=physicalCenter.sourceBounds,contract=sourceExponentContract();
  assert.equal(bounds.pass,true);assert.equal(bounds.sourceAuthenticated,true);assert.ok(allPassed(bounds.checks));
  assert.equal(bounds.contract.profileId,SOURCE_PROFILE_ID);
  assert.equal(bounds.contract.parameterExpressionSHA256,contract.parameterExpressionSHA256);
  assert.equal(bounds.contract.positive,true);assert.equal(bounds.contract.notNumericallyReplaced,true);
  assert.equal(bounds.roots.h,originalTorusMap.roots.h);
  for(const name of ['B','S'])assert.ok(Number.isSafeInteger(bounds.roots[name])&&bounds.roots[name]>=0);
  for(const id of requiredBoundChecks)assert.equal(bounds.checks.find(row=>row.id===id)?.pass,true,id);
  assert.ok(bounds.derivation.base.startsWith('B>=2^128 and B>=Renv^4096.'));
  assert.ok(bounds.derivation.band.includes('S>=B^1024'));
  assert.equal(bounds.derivation.cone,'The actual moving-frame and damping errors are at most B^256/S. The SAME invariant cone gives w_plus>0 and |w_minus/w_plus|<=B^260/S<=B^-764.');
  assert.equal(physicalCenter.numerics.pass,true);
  const errorAudit=physicalCenter.numerics.absolute.errorAudit;
  assert.equal(errorAudit.schema,'MathScope.AdiabaticPulseCenterErrorAudit/1');
  assert.ok(allPassed(errorAudit.checks));assert.equal(errorAudit.actualSourceAuthenticated,false);
  assert.equal(errorAudit.premises.sourceAuthenticated,false);
  for(const [key,value]of Object.entries({basePower:128,scalePower:1024,conePower:260}))assert.equal(errorAudit.parameters[key],value);
  assert.equal(errorAudit.premises.B,'B>=2^128 and B>=Renv^4096');
  assert.equal(errorAudit.premises.S,'S=ell^2>=B^1024');
  assert.equal(errorAudit.premises.fullSolution,'w(0)=(1,0), w_plus>0, |w_minus/w_plus|<=B^260/S for the same actual Volterra system.');
  assert.deepEqual(physicalCenter.rows.map(row=>row.sign),[1,-1]);
  assert.deepEqual(physicalCenter.rows.map(row=>row.system),[0,1]);
  assert.equal(physicalCenter.rows[0].center.v0,physicalCenter.rows[1].center.v0);
  const centers=physicalCenter.numerics.values.centers;
  assert.equal(centers.length,2);
  const seenRoots=new Set(),originalBindings=physicalCenter.rows.map((row,i)=>{
    assert.ok(allPassed(row.checks));
    for(const id of requiredFamilyChecks)assert.equal(row.checks.find(check=>check.id===id)?.pass,true,id);
    const binding={sign:row.sign,centerRoot:row.center.a,negativeModeRoot:row.center.other};
    assert.equal(binding.centerRoot,physicalCenter.roots.actualCenters[i]);
    assert.deepEqual(centers[i],physicalCenter.numerics.absolute.values.center);
    for(const value of [binding.centerRoot,binding.negativeModeRoot]){
      assert.ok(Number.isSafeInteger(value)&&value>=0);assert.equal(seenRoots.has(value),false);seenRoots.add(value);
    }
    const lo=readRational(centers[i].lower),hi=readRational(centers[i].upper);
    assert.ok(qcompare(lo,Q(0))>0&&qcompare(lo,hi)<=0&&qcompare(hi,Q(1,2))<0);
    return binding;
  });
  return {schema:'MathScope.PinnedPhysicalCenterNegativeModePremises/1',certificate:{...certificate},
    profileId:SOURCE_PROFILE_ID,parameterExpressionSHA256:contract.parameterExpressionSHA256,
    sameOriginalTorusMap:true,originalDrRoot:originalTorusMap.roots.dr,
    boundRoots:{B:bounds.roots.B,S:bounds.roots.S,h:bounds.roots.h},
    originalBindings,sourceCenterIntervals:centers.map(({lower,upper})=>({lower,upper})),
    evaluation:{originalFastCenterRoot:physicalCenter.rows[0].center.v0,fastCoordinate:'v=Ls/2',
      slowCoordinates:'The same new physical-center slow coordinates and permitted representative.',
      negativeFamilyActualCompositeFastValueClaimed:false},
    derivation:Object.fromEntries(['base','band','cone'].map(key=>[key,bounds.derivation[key]])),
    sourceBoundsChecks:structuredClone(bounds.checks),
    familyChecks:physicalCenter.rows.map(row=>({sign:row.sign,checks:structuredClone(row.checks)})),
    exactPowers:{base:128,scale:1024,cone:260,centerHalf:1,radius:97793},
    numericalErrorAudit:{parameters:structuredClone(errorAudit.parameters),premises:structuredClone(errorAudit.premises),sourceAuthenticated:false},
    sourcePaths:{bounds:['sourceBounds.roots.B','sourceBounds.roots.S','sourceBounds.derivation.base','sourceBounds.derivation.band','sourceBounds.derivation.cone'],
      families:physicalCenter.rows.map((row,i)=>({sign:row.sign,center:'rows.'+i+'.center.a',negativeMode:'rows.'+i+'.center.other',checks:'rows.'+i+'.checks',
        centerInterval:'numerics.values.centers.'+i}))},
    normalization:'RAW_ORIGINAL_COUPLED_COMPONENT_WITHOUT_AC_U_A0_OR_RADIAL_FACTOR',
    sourceAuthorityCreatedByProjection:false,completedObservedSourceProcessRequired:true};
}

export function assertPhysicalCenterNegativeModeJetAliases(physicalCenter,certificate,bodies){
  const sourceBounds=certificate.sourceBounds;
  assert.equal(sourceBounds.roots.B,physicalCenter.sourceBounds.roots.B);
  assert.equal(sourceBounds.roots.S,physicalCenter.sourceBounds.roots.S);
  assert.equal(sourceBounds.roots.L,physicalCenter.sourceBounds.roots.Ls);
  assert.deepEqual(sourceBounds.proof.sharpErrors.wholeInitialLayer.source,physicalCenter.sourceBounds.derivation);
  assert.equal(bodies.families.length,2);
  for(const [i,family]of bodies.families.entries()){
    assert.equal(family.sign,physicalCenter.rows[i].sign);
    assert.equal(family.checks.find(row=>row.id==='new-covariance-center-equals-the-private-physical-value')?.pass,true);
  }
}
