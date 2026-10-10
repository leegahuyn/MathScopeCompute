import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {ACTUAL_PULSE_BINDINGS,actualPulseScalarThreshold,actualPulseConeChoice,getActualPulsePrerequisites} from '../actual-pulse-source.mjs';
import {actualMeanPatchDefinitions,evaluateActualMeanPatchJet,boundActualMeanPatchJets} from '../actual-pulse-meanpatch.mjs';
import {actualMeanPatchPhaseBounds,actualLeftGrowingDatum,actualMeanPatchPulseConstruction,nearestNonzeroPulseInteger} from '../actual-pulse-construction.mjs';

const root=new URL('../../../',import.meta.url);
const covers=(a,x)=>a[0]<=x&&x<=a[1],overlaps=(a,b)=>Math.max(a[0],b[0])<=Math.min(a[1],b[1]);

test('every actual source definition is byte-bound to the accepted N3 chain',async()=>{
  for(const source of [ACTUAL_PULSE_BINDINGS.assembly,...ACTUAL_PULSE_BINDINGS.sourceFiles]){
    const bytes=await readFile(new URL(source.path,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256,source.path);
  }
  const assembly=JSON.parse(await readFile(new URL(ACTUAL_PULSE_BINDINGS.assembly.path,root),'utf8'));
  assert.equal(assembly.parameterExpressionSHA256,ACTUAL_PULSE_BINDINGS.parameterExpressionSHA256);
  assert.deepEqual(assembly.attachedAnalyticConclusions.preservedReservedPatches,['Ipos','Imean']);
  assert.deepEqual(assembly.parametersExactExpressions.h,{exp:{product:[{integer:-8002},{ref:'T'}]}});
});

test('actual epsilon threshold proves all later bands and does not call it global q_star',()=>{
  const r=actualPulseScalarThreshold();assert.equal(r.pass,true);assert.equal(r.theorem.usesFiniteSampling,false);assert.equal(r.qStarCertified,false);
  assert.equal(r.definitions.ellScalarExact,'ceil(h^(-4))');assert.equal(r.checks.find(x=>x.id==='finite-observation-window-excluded').pass,true);
  assert(BigInt(r.checks.find(x=>x.id==='endpoint-log-majorant-negative').exactNumerator)<0n);
  assert.throws(()=>actualPulseScalarThreshold({sourceProfile:'toy'}));
});

test('u_star is fixed from the real source cone margin with positive symbolic inverse',()=>{
  const r=actualPulseConeChoice();assert.equal(r.frozenPointConeCertified,true);assert.equal(r.uStarExact,'2*C12EnvelopeR^10');assert.equal(r.strictlyPositive,true);assert.equal(r.zeroIsEnclosureEndpointOnly,true);
  for(const [n,d]of[[1n,1n],[1n,2n],[1n,10000n]]){
    // 1/2-k/(4+k²)-1/4 >= 0, with a positive common denominator.
    assert(4n*d*d+n*n-4n*n*d>=0n);
  }
  assert.equal(r.slowNeighborhoodConeCertified,false);
});

test('actual mean-patch logarithmic normalizations retain its nonzero radial moment',()=>{
  const r=actualMeanPatchDefinitions();assert.equal(r.exact.U,'0');assert.equal(r.exact.radialV0,'-mConst');assert.equal(r.exact.b,'-epsilon*mConst/R');
  assert.equal(r.exact.logKmeanCollected,'-(59997/2)*T+33/10+(15/2-60000*T)*lambda');
  assert.equal(r.exact.mConstBounds[0],'4*XR*exp(1)');assert.equal(r.cumulativeStressEvaluated,false);assert.equal(r.actualPulseIntegrated,false);
});

test('source field value and slow zeroth jet use consistent E/F/R normalization',()=>{
  for(const eta of[-1,-.25,0,.25,1]){
    const r=evaluateActualMeanPatchJet({y:2.5,eta,s:1});
    assert(overlaps(r.normalizedValues.EOverKmean,r.normalizedValues.VOverKmean));
    assert.equal(r.coordinateFrame,'BAND_CHART_Q_FIXED');assert.equal(r.restoredQuantitiesArePhysicalCartesian,false);
    assert(overlaps(r.normalizedValues.FOverFscale,r.jets[0].normalizedFInterval));
    const f=Math.exp(-2.5)/(1+eta*eta);assert(covers(r.normalizedValues.FOverFscale,f));
    assert(!covers(r.normalizedValues.FOverFscale,Math.exp(-1.25)/(1+eta*eta)),'The E normalization must not replace the F normalization.');
    assert(r.normalizedValues.bOverRadialScale[1]<0);assert.equal(r.radialVelocityExactlyZero,false);
  }
});

test('ordinary axial/time jets remain defined at eta endpoints with one-sided time data',()=>{
  for(const eta of[-1,1]){
    const r=evaluateActualMeanPatchJet({eta,s:2,order:3});assert(r.implicitCoordinateDenominator[0]>0);assert.equal(r.jets.length,20);
    for(const row of r.jets){assert(row.normalizedFInterval.every(Number.isFinite));assert.deepEqual(row.GInterval,[0,0]);}
    assert(r.coordinates.TChartInterval[0]<=0&&r.coordinates.TChartInterval[1]>=0);
  }
});

test('uniform whole-box intervals enclose separately evaluated actual local derivatives',()=>{
  const b=boundActualMeanPatchJets(3);assert.equal(b.uniformOverEntireBox,true);assert.equal(b.usesFiniteSampling,false);assert.equal(b.pass,true);
  for(const input of[{y:.25,eta:-1,s:.5},{y:4.75,eta:1,s:2},{y:1.25,eta:.375,s:.75}]){
    const r=evaluateActualMeanPatchJet(input);r.jets.forEach((v,i)=>{assert(b.perDerivative[i].F[0]<=v.normalizedFInterval[0]);assert(b.perDerivative[i].F[1]>=v.normalizedFInterval[1]);});
  }
});

test('selected local domain and every source exponent absorption are explicit',()=>{
  const r=actualMeanPatchPhaseBounds();assert.equal(r.pass,true);assert.equal(r.fixedM,'C12EnvelopeR^100');assert.equal(r.threshold.ellLocalExact,'ceil(C12EnvelopeR^10000*h^-4)');
  assert.equal(r.domain.sourcePatch,'Imean only');assert.equal(r.globalPhaseCertified,false);assert.equal(r.actualNonlinearBackgroundOutsidePatchConstructed,false);
  assert(r.checks.filter(c=>c.terms).every(c=>c.uniform===true));assert(r.budgets.some(x=>x.object.includes('B_prime')));
});

test('source growing datum is at the left endpoint and preserves nonzero log scale',()=>{
  const d=actualLeftGrowingDatum({samples:40});assert.equal(d.pass,true);assert.deepEqual(d.initial.dividedByP0,[1,0]);assert.equal(d.initial.midpointUnitSeedUsed,false);
  assert.equal(d.observationKind,'NORMALIZED_REFERENCE_LOG_ENVELOPE');
  assert.equal(d.initial.positiveLogScale.binary64,null);assert.equal(d.initial.positiveLogScale.strictlyPositive,true);assert(d.initial.logP0CoefficientInterval[1]<0);
  assert.deepEqual(d.rows[20].normalizedLogPInterval,[0,0]);assert(d.rows.at(-1).normalizedLogPInterval[1]<0);assert(d.referenceGaussianCoefficient[0]>0);
  assert.equal(d.actualAmplitudePointValuesEvaluated,false);assert.equal(d.normalizedEvolution.allDampingTermsRetained,true);
});

test('angular rounding is nonzero and has the correct weaker bound near zero',()=>{
  for(const x of[-8.5,-1.5,-.51,-.49,-.01,.01,.49,.51,1.5,8.5]){const n=nearestNonzeroPulseInteger(x);assert(Number.isSafeInteger(n)&&n!==0);assert(Math.abs(n-x)<=1);}
  assert.equal(nearestNonzeroPulseInteger(.01),1);assert.equal(nearestNonzeroPulseInteger(-.01),-1);assert(Math.abs(nearestNonzeroPulseInteger(.01)-.01)>.5);
  assert.throws(()=>nearestNonzeroPulseInteger(0));assert.throws(()=>nearestNonzeroPulseInteger(Infinity));
});

test('local analytic value comparison cannot promote the missing global construction',()=>{
  const r=actualMeanPatchPulseConstruction();assert(r.checks.every(c=>c.pass));assert.equal(r.status,'PARTIAL');
  assert.equal(r.growingComparison.actualLocalValueComparisonProved,true);assert.equal(r.growingComparison.actualAmplitudeNumericallyIntegrated,false);
  assert.equal(r.growingComparison.allSlowDerivativeGaussianBoundsCertified,false);assert.equal(r.scope.globalCovarianceMatched,false);
  assert.equal(r.scope.globalPhaseCertified,false);assert.equal(r.scope.allOriginalN5CriteriaComplete,false);
  assert(getActualPulsePrerequisites().missing.some(x=>x.id==='actual-stress-covariance'));
});

test('wrong source, outside patch, made-up certification fields and nonfinite requests fail',()=>{
  for(const input of[{h:0},{lambda:.01},{sourceProfile:'a different profile'},{y:0},{y:5},{eta:1.1},{s:0},{order:4},{y:NaN},{globalPhaseCertified:true}])assert.throws(()=>actualMeanPatchPulseConstruction(input),JSON.stringify(input));
  assert.throws(()=>actualLeftGrowingDatum({samples:1}));
});

test('actual source construction replay is deterministic and serializes no nonfinite values',()=>{
  const a=actualMeanPatchPulseConstruction({y:1.25,eta:.125,s:.75}),b=actualMeanPatchPulseConstruction({y:1.25,eta:.125,s:.75});
  assert.deepEqual(a,b);const json=JSON.stringify(a);assert(!json.includes('Infinity'));assert(!json.includes('NaN'));assert(json.includes('PARTIAL'));
});
