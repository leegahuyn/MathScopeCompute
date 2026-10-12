import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {originalCoreRestrictionRecipe,verifyOriginalCoreSupportInduction,recordedSourceCoreRestriction,
  assertRecordedSourceCoreRestriction,sourceCoreRestrictionObservations} from '../source-core-restriction.mjs';
import {INNER_GROWTH_ARCHIVE} from '../source-inner-growth-evidence-data.mjs';

const changed=change=>{const recipe=originalCoreRestrictionRecipe();change(recipe);return recipe;},
  reject=change=>assert.throws(()=>verifyOriginalCoreSupportInduction(changed(change)),{code:'INVALID_SOURCE_RESTRICTION'});
let task;const source=()=>task??=recordedSourceCoreRestriction();

test('support induction checks all original operator classes while retaining unknown base and full radial moments',()=>{
  const proof=verifyOriginalCoreSupportInduction(originalCoreRestrictionRecipe());
  assert.equal(proof.pass,true);assert.equal(proof.sourceAuthenticated,false);assert.equal(proof.checks.length,21);
  assert.equal(new Set(proof.checks.map(x=>x.id)).size,proof.checks.length);assert.ok(proof.checks.every(x=>x.pass));
  assert.equal(proof.allFiniteCorrectionStagesZeroOnOpenCore,true);assert.equal(proof.globalNonzeroFieldConstructed,false);
  const moments=proof.trace.filter(x=>x.operator==='FULL_RADIAL_MOMENT');assert.ok(moments.length>=4);
  assert.ok(moments.every(x=>x.zeroOnOpenCore===false));
  const polynomial=proof.checks.find(x=>x.id==='literal-full-NS-increment-and-base-residual-separation').evidence;
  assert.ok(polynomial.baseResidualRetained.every(row=>row.length>0));assert.ok(polynomial.restrictedIncrement.every(row=>row.length===0));
  assert.ok(polynomial.fullIncrement.every(row=>row.some(term=>term.factors.length===2&&term.factors.every(x=>x.startsWith('du')))));
});

test('keeping the base residual inside supported pulse inputs is rejected by the exact differential polynomial',()=>{
  reject(r=>{r.residual.subtractUnchangedBaseResidual=false;});
  reject(r=>{r.residual.retainBaseFlatResidualSeparately=false;});
  reject(r=>{r.residual.fullQuadraticVelocityProducts=false;});
});

test('pulse propagation must fix every slow coordinate and retain the actual zero initial data',()=>{
  reject(r=>{r.pulse.fixedCoordinates=['Z','T','xi'];});
  reject(r=>{r.pulse.zeroInitialData=false;});
  reject(r=>{r.primary.guardBeforeBody=false;});
  reject(r=>{r.primary.radialZeroExtension=false;});
});

test('radial primitives preserve the core only with fixed physical q and a zero inner cutoff',()=>{
  reject(r=>{r.radial.qIndependentOfRadius=false;});
  reject(r=>{r.radial.fixedPhysicalZT=false;});
  reject(r=>{r.radial.path='r<=r_prime<infinity';});
  reject(r=>{r.radial.sourceZeroForEveryY=false;});
  reject(r=>{r.radial.innerCutoffValue='1';});
  reject(r=>{r.radial.torusShiftChangesOnlyY=false;});
  reject(r=>{r.radial.fullIntegralRetained=false;});
});

test('a spatial inverse or an arbitrary homogeneous Fourier mode cannot replace the original temporal inverse',()=>{
  reject(r=>{r.temporal.inverseCoordinates=['R','y0','y1'];});
  reject(r=>{r.temporal.fixedSlowCoordinates=['Z','T'];});
  reject(r=>{r.temporal.zeroFourierMode='arbitrary constant';});
  reject(r=>{r.temporal.exactLimit=false;});
});

test('signed division and moment potentials must keep the original annular zero extension and support hull',()=>{
  reject(r=>{r.signed.zeroExtensionBeforeDivisionOutside=false;});
  reject(r=>{r.signed.divideOnlyInsideOpenShell=false;});
  reject(r=>{r.signed.originalPositivePrimaryDenominator=false;});
  reject(r=>{r.moments.sourceProfilesInsideOriginalImean=false;});
  reject(r=>{r.moments.potentialHullInsideOriginalImean=false;});
  reject(r=>{r.moments.globalMomentsMayBeNonzero=false;});
});

test('an open collar crossing Xa and loss of a common stage support cannot prove the original core restriction',()=>{
  reject(r=>{r.core.openCollar=['1/4','5/4'];});
  reject(r=>{r.core.openCollar=['1/2','3/4'];});
  reject(r=>{r.summation.sameOpenZeroCollarForEveryStage=false;});
  reject(r=>{r.summation.includeFiniteInitialization=false;});
});

test('deleting a potential-cutoff commutator fails the literal Cartesian curl product identity',()=>{
  reject(r=>{r.summation.curlProducts[0].terms.pop();});
  reject(r=>{r.summation.curlProducts[1].terms[2].sign=-1;});
  reject(r=>{r.summation.applyCutoffOnPotentialsBeforeCurl=false;});
  reject(r=>{r.summation.scalarCutoffValuesOrStageConstantsUsed=true;});
});

test('verified original archive inputs give the same core and an analytic lower bound for every smaller positive tau',async()=>{
  const result=await source();assert.equal(assertRecordedSourceCoreRestriction(result),true);
  assert.equal(result.recordedOnly,true);assert.equal(result.newSupportProofExecuted,true);assert.equal(result.freshSourceConstructorExecuted,false);
  assert.ok(result.checks.every(x=>x.pass));assert.equal(result.exactScalarIdentities.XinEqualsXaHalf.pass,true);
  assert.equal(result.exactScalarIdentities.eLowerEqualsHalfEScale.pass,true);
  assert.ok(result.parameterSupport.integerChecks.every(x=>x.pass));
  assert.equal(result.sourceBinding.parameterExpressionSHA256,'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152');
  assert.equal(result.sourceDomain.qStar,INNER_GROWTH_ARCHIVE.certificate.localization.qStar);
  assert.equal(result.analyticGrowth.uniformThreshold.sourceRoot,INNER_GROWTH_ARCHIVE.certificate.rows[0].tau);
  assert.equal(result.analyticGrowth.uniformThreshold.on,'every 0<tau<=tau_*');
  assert.equal(result.analyticGrowth.divergenceAsTauDecreasesToZero,true);assert.equal(result.analyticGrowth.finitePlotUsedAsProof,false);
  for(const key of ['fullFinalN6FieldConstructed','nonzeroCorrectionFieldsConstructed','allSpaceVelocityEvaluator','wholeLocalizedForceConstructed','wholeKEnergyNearTerminalComputed','newLeanKernelProof','wholeM3Complete'])assert.equal(result.scope[key],false);
});

test('the bridge rejects replacement inputs and copied or changed proof results without altering historical records',async()=>{
  for(const input of [{recipe:originalCoreRestrictionRecipe()},{qStar:'1e-12'},{completeN6:true},{tau:0}])await assert.rejects(recordedSourceCoreRestriction(input),{code:'INVALID_INPUT'});
  const result=await source();assert.throws(()=>assertRecordedSourceCoreRestriction({...result}),{code:'INVALID_SOURCE_RESTRICTION'});
  const saved=result.coreIdentity.annularPotentialRestriction[0];result.coreIdentity.annularPotentialRestriction[0]='1';
  try{assert.throws(()=>sourceCoreRestrictionObservations(result),{code:'INVALID_SOURCE_RESTRICTION'});}finally{result.coreIdentity.annularPotentialRestriction[0]=saved;}
  assert.equal(assertRecordedSourceCoreRestriction(result),true);
  assert.equal(INNER_GROWTH_ARCHIVE.certificate.claims.originalLocalizedPath.status,'CONDITIONAL_ON_EXTERNAL_SOURCE_THEOREM_IDENTIFICATION');
  assert.equal(INNER_GROWTH_ARCHIVE.certificate.scope.originalCompleteN6FieldConstructed,false);
});

test('export the newly executed source support proof separately from immutable measurement receipts',async()=>{
  const result=await source(),observations=sourceCoreRestrictionObservations(result);
  assert.equal(observations.kind,'SOURCE_CORE_RESTRICTION_AND_ANALYTIC_GROWTH');assert.deepEqual(observations.samples,[]);assert.deepEqual(observations.curves,[]);
  assert.equal(observations.fullFinalN6FieldConstructed,false);assert.equal(observations.newSupportProofExecuted,true);
  assert.match(result.proofSHA256,/^[a-f0-9]{64}$/);
  if(process.env.M3_N7_CORE_RESTRICTION_EVIDENCE)await writeFile(process.env.M3_N7_CORE_RESTRICTION_EVIDENCE,JSON.stringify(result,null,2)+'\n');
});
