import test from 'node:test';
import assert from 'node:assert/strict';
import {recomputePhysicalCenterRuntimeNumerics,physicalCenterRuntimeNumericalRequest} from '../actual-physical-center-runtime-numerics.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';
import {SOURCE_PROFILE_ID} from '../source-profile.mjs';
import {rational as Q,readRational,qcompare,qsub} from '../actual-continuation-arithmetic.mjs';

let baselinePromise;
const baseline=()=>baselinePromise??=(async()=>{
  const progress=[],start=performance.now(),result=await recomputePhysicalCenterRuntimeNumerics({}, {onProgress:r=>progress.push(r)});
  return {result,progress,elapsedMs:performance.now()-start};
})();

test('a fresh default pipeline recomputes every numerical prerequisite and all270 coefficient rows',async t=>{
  const {result:r,progress,elapsedMs}=await baseline();
  assert.equal(r.pass,true);assert.equal(r.rows.length,270);assert.equal(new Set(r.rows.map(x=>x.rowKey)).size,270);
  assert.equal(r.valueEnclosures.rows.length,25);assert.equal(r.slopes.rows.length,6);
  assert.equal(r.pulse.rows.length,228);assert.equal(r.physical.rows.length,42);assert.equal(r.positiveProfile.rows.length,15);
  assert.equal(progress.length,6);assert.match(progress[0].stage,/cutoff-absolute-center/);assert.match(progress.at(-1).stage,/all270/);
  assert.ok(r.checks.every(x=>x.pass));assert.ok(r.cutoff.cells<=r.request.maxCutoffCells);assert.ok(r.targetCoefficient.cells<=r.request.maxTargetCells);
  assert.ok(r.cutoff.errorBudget);assert.ok(r.absoluteCenter.errorBudget.nonzeroSubUlpRemainderRoundedUp);
  assert.equal(r.targetCoefficient.proof.positiveInfiniteTailRetained,true);
  assert.equal(r.positiveProfile.authority,'MATCHED_FIXED_PROFILE_DEFINITIONS_ONLY');
  t.diagnostic(JSON.stringify({run:'default-fresh-runtime-numerics',elapsedMs,peakRSSBytes:process.resourceUsage().maxRSS*1024,
    cutoffCells:r.cutoff.cells,targetCells:r.targetCoefficient.cells,rows:r.rows.length,actualSourceConstructorExecuted:false}));
});

test('all exact final widths and positive normalizers have the public270-row rendering contract',async()=>{
  const {result:r}=await baseline(),expected=['rtheta','ztheta','ttheta','thetatheta'];
  for(const x of r.rows){
    assert.equal(x.rowKey,[x.quantity,x.sign??'physical',x.component,x.derivative].join(':'));
    assert.equal(typeof x.scaleDescription,'string');assert.ok(x.scaleDescription.length>20);
    assert.equal(qcompare(qsub(readRational(x.directedInterval.upper),readRational(x.directedInterval.lower)),readRational(x.width)),0);
    assert.ok(qcompare(readRational(x.width),readRational(r.request.tolerance))<=0);
    assert.ok(qcompare(readRational(x.positiveErrorRadius),Q(0))>0);assert.equal(x.toleranceMet,true);
  }
  const additional=[...r.valueEnclosures.rows.map(x=>({interval:x.interval,width:x.width,tolerance:x.tolerance})),
    ...r.slopes.rows.map(x=>({interval:x.interval,width:x.width,tolerance:r.slopes.request.tolerance})),
    ...r.positiveProfile.rows.map(x=>({interval:x.logCoordinateInterval,width:x.logCoordinateWidth,tolerance:x.logCoordinateTolerance})),
    {interval:r.targetCoefficient.actualCoefficientIfSourcePremisesBound,width:r.targetCoefficient.absoluteWidth,tolerance:r.request.tolerance}];
  assert.equal(additional.length,47);
  for(const x of additional){
    assert.equal(qcompare(qsub(readRational(x.interval.upper),readRational(x.interval.lower)),readRational(x.width)),0);
    assert.ok(qcompare(readRational(x.width),readRational(x.tolerance))<=0);
  }
  for(const d of expected)assert.equal(r.rows.filter(x=>x.quantity==='physicalCurl'&&x.derivative===d).length,3);
  assert.ok(r.rows.filter(x=>x.quantity==='H').every(x=>x.scaleDescription.includes('massScale')));
  assert.ok(r.rows.filter(x=>x.quantity==='y').every(x=>x.scaleDescription.includes('tau/massScale')));
  assert.ok(r.rows.filter(x=>x.quantity==='physicalCurl').every(x=>x.scaleDescription.includes('Q^(-A)')));
});

test('a second run is byte reproducible after discarding poisoned prior intervals and fires every fresh stage',async()=>{
  const {result:old}=await baseline(),expected=canonicalStringify(old),original=old.rows[0].directedInterval.lower,progress=[];
  try{
    old.rows[0].directedInterval.lower='123';
    const fresh=await recomputePhysicalCenterRuntimeNumerics({}, {onProgress:r=>progress.push(r)});
    assert.equal(canonicalStringify(fresh),expected);assert.notEqual(fresh,old);assert.notEqual(fresh.cutoff,old.cutoff);
    assert.notEqual(fresh.values,old.values);assert.equal(progress.length,6);assert.equal(fresh.arithmetic.priorReceiptUsedAsNumericalInput,false);
  }finally{old.rows[0].directedInterval.lower=original;}
});

test('new arithmetic controls are propagated to cutoff center slopes target and all profile logarithms',async t=>{
  const {result:old}=await baseline(),start=performance.now(),fresh=await recomputePhysicalCenterRuntimeNumerics({precisionBits:256,tolerance:'1/100000000'});
  assert.equal(fresh.request.precisionBits,256);assert.equal(fresh.request.tolerance,'1/100000000');
  for(const p of [fresh.cutoff,fresh.absoluteCenter,fresh.slopes,fresh.pulse,fresh.physical,fresh.targetCoefficient,fresh.positiveProfile])
    assert.equal(p.arithmetic.bits,256);
  assert.notDeepEqual(fresh.positiveProfile.rows[0].logCoordinateInterval,old.positiveProfile.rows[0].logCoordinateInterval);
  assert.notDeepEqual(fresh.rows[0].directedInterval,old.rows[0].directedInterval);
  assert.ok(fresh.rows.every(x=>qcompare(readRational(x.width),readRational(fresh.request.tolerance))<=0));
  assert.ok(qcompare(readRational(fresh.precisionAllocation.valueWidth),readRational(fresh.request.tolerance))<0);
  t.diagnostic(JSON.stringify({run:'changed-controls-fresh-runtime-numerics',elapsedMs:performance.now()-start,
    peakRSSBytes:process.resourceUsage().maxRSS*1024,precisionBits:256,cutoffCells:fresh.cutoff.cells,targetCells:fresh.targetCoefficient.cells}));
});

test('the pure pipeline cannot claim an original graph source point unscaled accuracy or M2 completion',async()=>{
  const {result:r}=await baseline();
  assert.equal(r.sourceAuthenticated,false);assert.equal(r.runtimeReconstructedFullSourceGraph,false);
  for(const name of ['sourceAuthenticated','actualSourcePointAuthenticated','runtimeReconstructedFullSourceGraph','originalUnscaledRelativeAccuracyClaimed',
    'remainingSelectorAndPaletteScalesNumericallyClosed','wholeGNUMComplete','userRequestedM2Complete','M3Started'])assert.equal(r.scope[name],false);
  assert.equal(r.arithmetic.callerIntervalsAccepted,false);assert.equal(r.arithmetic.everyNumericalPrerequisiteRecomputed,true);
  assert.equal(r.scope.originalPointAndPositiveNormalizersRequireExternalEvidence,true);assert.equal(r.positiveProfile.actualSourcePointAuthenticated,false);
  assert.equal(r.positiveProfile.scope.originalValueRelativeToleranceGuaranteed,false);assert.equal(r.targetCoefficient.scope.actualTauAbsoluteScaleEnclosed,false);
});

test('request preflight refuses injected source data unsupported precision and impossible positive-tail accuracy',()=>{
  const bad=[{values:{}},{certificate:{}},{sourceAuthenticated:true},{point:{}},{sourceProfile:SOURCE_PROFILE_ID+'-changed'},
    {precisionBits:191},{precisionBits:513},{precisionBits:192.5},{tolerance:1e-12},{tolerance:'0'},{tolerance:'1/10'},
    {maxCutoffCells:3},{maxCutoffCells:8192},{maxTargetCells:8},{maxTargetCells:17}];
  for(const x of bad)assert.throws(()=>physicalCenterRuntimeNumericalRequest(x),{code:'INVALID_INPUT'});
  assert.throws(()=>physicalCenterRuntimeNumericalRequest({precisionBits:512,tolerance:'1/'+String(1n<<122n)}),{code:'PRECISION_REQUIRED'});
  assert.throws(()=>physicalCenterRuntimeNumericalRequest({precisionBits:192,tolerance:'1/'+String(1n<<150n)}),{code:'PRECISION_REQUIRED'});
});

test('finite quadrature exhaustion and cancellation fail without a partial successful certificate',async()=>{
  await assert.rejects(recomputePhysicalCenterRuntimeNumerics({maxCutoffCells:4}),{code:'RESOURCE_LIMIT'});
  let checks=0;
  await assert.rejects(recomputePhysicalCenterRuntimeNumerics({}, {checkCancelled:()=>{checks++;throw Object.assign(Error('cancelled'),{code:'CANCELLED'});}}),{code:'CANCELLED'});
  assert.equal(checks,1);
});
