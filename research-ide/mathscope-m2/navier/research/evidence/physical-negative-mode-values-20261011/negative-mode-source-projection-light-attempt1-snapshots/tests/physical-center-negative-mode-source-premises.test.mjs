/** Read-only projection tests against the three immutable, already written
 * source4 attachments. These tests do not run a source constructor, verify
 * its final exit status, or confer the private/source authentication token.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {projectPhysicalCenterNegativeModePremises,assertPhysicalCenterNegativeModeJetAliases} from './physical-center-negative-mode-source-premises.mjs';

const evidence='../research/evidence/physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt4-',
  expected={
    'physical-value-certificate':'f5f172ac9cde85427a537e5814615dacdf36833f2a20f3c6b5f6b7e176b6733c',
    'complete-derivative-source-bounds':'0c125871710131101d5ccb4f8d8ed408f68324c21d3cb12be1ec860de730329c',
    'finite-bodies-certificate':'261c740d78ce36129b422467bd61ec6864cd79b589ddda4a1f5d8ed557a0dcae'
  },read=name=>{
    const bytes=readFileSync(new URL(evidence+name+'.json',import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected[name]);
    return JSON.parse(bytes.toString('utf8'));
  },physical=read('physical-value-certificate'),partial=read('complete-derivative-source-bounds'),bodies=read('finite-bodies-certificate'),
  take=(object,keys)=>Object.fromEntries(keys.map(key=>[key,object[key]])),freeze=x=>{
    if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;
  };

// Keep the actual consumed fields and their original values; the large
// unused graph/program summaries are irrelevant to this projection test.
const SOURCE4=freeze({
  physical:{...take(physical,['schema','pass','checks']),
    point:{originalTorusMapBinding:physical.point.originalTorusMapBinding},
    sourceBounds:take(physical.sourceBounds,['pass','sourceAuthenticated','checks','contract','roots','derivation']),
    numerics:{pass:physical.numerics.pass,absolute:{errorAudit:physical.numerics.absolute.errorAudit,values:{center:physical.numerics.absolute.values.center}},
      values:{centers:physical.numerics.values.centers}},
    rows:physical.rows.map(row=>take(row,['sign','system','center','checks'])),roots:{actualCenters:physical.roots.actualCenters}},
  full:{sourceBounds:{roots:partial.data.roots,proof:{sharpErrors:{wholeInitialLayer:{source:partial.data.proof.sharpErrors.wholeInitialLayer.source}}}}},
  bodies:{families:bodies.families.map(row=>take(row,['sign','checks']))},
  certificate:{path:'research-ide/mathscope-m2/navier/research/evidence/physical-full-jets-20261011/actual-physical-center-full-jet-source-attempt4-physical-value-certificate.json',
    sha256:expected['physical-value-certificate']}
});
const fixture=()=>structuredClone(SOURCE4),project=f=>projectPhysicalCenterNegativeModePremises(f.physical,f.certificate,f.physical.point.originalTorusMapBinding),
  aliases=f=>assertPhysicalCenterNegativeModeJetAliases(f.physical,f.full,f.bodies),
  rejects=(mutate,operation=project)=>{const f=fixture();mutate(f);assert.throws(()=>operation(f));};

test('actual source4 written attachments are read by fixed hashes without promoting their completion status',()=>{
  assert.equal(partial.schema,'MathScope.ObservedPartialPhysicalSourceAttachment/1');
  assert.equal(partial.originalSameProcess,true);assert.equal(partial.finalSourcePassRequired,true);
  assert.equal(partial.standaloneCompletionClaim,false);assert.equal(partial.data.sourceAuthenticated,true);
  assert.equal(physical.scope.oldPointCertificateTransplanted,false);
  assert.equal(physical.point.originalTorusMapBinding.comparison.oldMissingFactorAccepted,false);
  assert.equal(physical.point.originalTorusMapBinding.roots.actualDr,physical.point.originalPhysicalMap.dr);
  assert.equal(physical.point.originalTorusMapBinding.roots.dr,physical.point.inverse.input.dr);
});

test('positive projection retains the actual two coupled roots, exact cone powers and no-created-authority scope',()=>{
  const result=project(fixture());
  assert.deepEqual(result.originalBindings,[{sign:1,centerRoot:631248,negativeModeRoot:631249},{sign:-1,centerRoot:649606,negativeModeRoot:649607}]);
  assert.deepEqual(result.boundRoots,{B:300170,S:622784,h:9});
  assert.deepEqual(result.exactPowers,{base:128,scale:1024,cone:260,centerHalf:1,radius:97793});
  assert.deepEqual(result.sourceCenterIntervals,physical.numerics.values.centers.map(({lower,upper})=>({lower,upper})));
  assert.equal(result.normalization,'RAW_ORIGINAL_COUPLED_COMPONENT_WITHOUT_AC_U_A0_OR_RADIAL_FACTOR');
  assert.equal(result.sourceAuthorityCreatedByProjection,false);assert.equal(result.completedObservedSourceProcessRequired,true);
  assert.equal(result.numericalErrorAudit.sourceAuthenticated,false);
  assert.notEqual(result.sourceAuthenticated,true);
});

test('actual full-jet bounds and both original variation families retain the same physical cone and center aliases',()=>{
  const f=fixture();assert.doesNotThrow(()=>aliases(f));
  assert.deepEqual(f.full.sourceBounds.proof.sharpErrors.wholeInitialLayer.source,f.physical.sourceBounds.derivation);
  assert.equal(bodies.sourceBinding.sameOriginalPhysicalPointAndBand,true);
  assert.equal(bodies.sourceBinding.rawSourceMatrixAndUnitDatumPreserved,true);
  for(const family of bodies.families)assert.equal(family.checks.find(row=>row.id==='new-covariance-center-equals-the-private-physical-value').pass,true);
});

test('changed scalar powers, h profile, or textual cone premise are rejected',()=>{
  for(const [key,value]of [['basePower',127],['scalePower',1023],['conePower',261],['basePower','128']])
    rejects(f=>{f.physical.numerics.absolute.errorAudit.parameters[key]=value;});
  for(const mutate of[
    f=>{f.physical.sourceBounds.derivation.cone=f.physical.sourceBounds.derivation.cone.replace('B^260/S','B^259/S');},
    f=>{f.physical.sourceBounds.derivation.band=f.physical.sourceBounds.derivation.band.replace('S>=B^1024','S>=B^1023');},
    f=>{f.physical.sourceBounds.derivation.base='B>=2^127 and B>=Renv^4096.';},
    f=>{f.physical.numerics.absolute.errorAudit.premises.fullSolution='uncoupled reference w_minus=0';},
    f=>{f.physical.sourceBounds.contract.notNumericallyReplaced=false;},
    f=>{f.physical.sourceBounds.contract.positive=false;},
    f=>{f.physical.sourceBounds.contract.parameterExpressionSHA256='0'.repeat(64);},
    f=>{f.physical.sourceBounds.roots.h++;}
  ])rejects(mutate);
});

test('the exact original audit field names are required, rather than an invented sourceAuthenticated flag',()=>{
  const original=physical.numerics.absolute.errorAudit;
  assert.equal(Object.hasOwn(original,'sourceAuthenticated'),false);
  assert.equal(original.actualSourceAuthenticated,false);assert.equal(original.premises.sourceAuthenticated,false);
  rejects(f=>{delete f.physical.numerics.absolute.errorAudit.actualSourceAuthenticated;f.physical.numerics.absolute.errorAudit.sourceAuthenticated=false;});
  rejects(f=>{f.physical.numerics.absolute.errorAudit.actualSourceAuthenticated=true;});
  rejects(f=>{f.physical.numerics.absolute.errorAudit.premises.sourceAuthenticated=true;});
});

test('mismatched actualCenters, duplicate original roots and changed family order or sign are rejected',()=>{
  for(const mutate of[
    f=>{f.physical.roots.actualCenters[0]++;},
    f=>{f.physical.rows[0].center.a=f.physical.rows[1].center.a;},
    f=>{f.physical.rows[0].center.other=f.physical.rows[0].center.a;},
    f=>{f.physical.rows[1].center.other=f.physical.rows[0].center.other;},
    f=>{f.physical.rows[0].center.other='631249';},
    f=>{f.physical.rows[0].sign=-1;},f=>{f.physical.rows.reverse();},
    f=>{f.physical.rows[0].system=1;},f=>{f.physical.rows.pop();}
  ])rejects(mutate);
});

test('omitted uniform source cone premises and original coupled-family checks cannot pass through a shorter all-true list',()=>{
  for(const id of ['same-recursive-source-scale-and-band-integer','same-huge-band-and-source-C2-base','source-Gaussian-and-Riccati-premises-are-uniform']){
    rejects(f=>{f.physical.sourceBounds.checks=f.physical.sourceBounds.checks.filter(row=>row.id!==id);});
    rejects(f=>{f.physical.sourceBounds.checks.find(row=>row.id===id).pass=false;});
  }
  for(const id of ['same-original-coupled-system-and-unit-initial-data','new-point-full-centers-and-original-moving-frame',
    'complete-original-moving-pressure-basis-and-damping-at-new-point','new-source-integrals-and-inverse-weights-are-fully-substituted'])
    rejects(f=>{f.physical.rows[1].checks=f.physical.rows[1].checks.filter(row=>row.id!==id);});
});

test('changed source B/S/L aliases, cone derivation, or missing original center alias fail independently',()=>{
  for(const key of ['B','S','L'])rejects(f=>{f.full.sourceBounds.roots[key]++;},aliases);
  rejects(f=>{f.full.sourceBounds.proof.sharpErrors.wholeInitialLayer.source.cone='reference-only';},aliases);
  rejects(f=>{f.bodies.families.reverse();},aliases);
  rejects(f=>{f.bodies.families[1].checks=f.bodies.families[1].checks.filter(row=>row.id!=='new-covariance-center-equals-the-private-physical-value');},aliases);
  rejects(f=>{f.bodies.families[1].checks.find(row=>row.id==='new-covariance-center-equals-the-private-physical-value').pass=false;},aliases);
});

test('exact center positivity and upper half-bound are enforced after checking the two source interval views',()=>{
  rejects(f=>{f.physical.numerics.values.centers[0].upper='1/2';});
  for(const box of [{lower:'0',upper:'1/3'},{lower:'1/3',upper:'1/2'},{lower:'2/5',upper:'1/3'}])
    rejects(f=>{f.physical.numerics.values.centers=[structuredClone(box),structuredClone(box)];f.physical.numerics.absolute.values.center=structuredClone(box);});
  rejects(f=>{f.physical.point.originalTorusMapBinding.comparison.allSixExpectedBodiesMatched=false;});
  rejects(f=>{f.physical.point.originalTorusMapBinding.comparison.oldMissingFactorAccepted=true;});
  assert.throws(()=>projectPhysicalCenterNegativeModePremises(SOURCE4.physical,SOURCE4.certificate,{...SOURCE4.physical.point.originalTorusMapBinding,roots:{dr:0}}));
});

test('projection and alias validation leave the immutable evidence untouched and return independent data',()=>{
  const before=JSON.stringify(SOURCE4),result=project(SOURCE4);aliases(SOURCE4);
  result.originalBindings[0].negativeModeRoot=0;result.sourceCenterIntervals[0].lower='0';
  result.sourceBoundsChecks[0].pass=false;result.numericalErrorAudit.parameters.basePower=0;
  assert.equal(JSON.stringify(SOURCE4),before);
  assert.equal(result.sourceAuthorityCreatedByProjection,false);
  assert.equal(result.completedObservedSourceProcessRequired,true);
});
