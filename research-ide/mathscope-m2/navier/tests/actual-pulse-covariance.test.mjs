import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {actualMeanPulseCovariance,actualPulseTransverseMass,observeActualPulseGaussianCenter} from '../actual-pulse-covariance-integrals.mjs';
import {uniformSupportPalette} from '../source-support.mjs';

const covers=(z,x)=>z[0]<=x&&x<=z[1],overlap=(a,b)=>Math.max(a[0],b[0])<=Math.min(a[1],b[1]),width=z=>z[1]-z[0];
const allFinite=x=>{if(typeof x==='number')assert(Number.isFinite(x));else if(x&&typeof x==='object')Object.values(x).forEach(allFinite);};

test('new covariance uses the independently frozen actual phase and amplitude modules unchanged',async()=>{
  const m=JSON.parse(await readFile(new URL('../actual-pulse-amplitude-manifest.json',import.meta.url),'utf8'));
  for(const path of['actual-pulse-amplitude-phase.mjs','actual-pulse-amplitude-integrator.mjs']){
    const expected=m.artifacts.find(x=>x.path===path),bytes=await readFile(new URL('../'+path,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected.sha256,path);
  }
  const r=actualMeanPulseCovariance({cells:64});assert(r.pass);assert.equal(r.profileId,'same-profile-2026-10-10.3');
  assert.equal(r.sourceHash,'184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd');
  assert.equal(r.phaseProgram.parametersExactExpressions.h.exp.product[0].integer,-8002);
  const palette=uniformSupportPalette();assert(palette.pass);assert.equal(palette.r0,2**-34);assert.equal(r.transverseMass.r0Exact,'2^-34');
});

test('Gaussian center encloses the original source-dependent displacement and full left-to-center evolution',()=>{
  for(const w of[[-8,-8],[-1,1],[0,0],[8,8],[-8,8]]){
    const r=observeActualPulseGaussianCenter({w});assert(r.sourceInstanceCertified);assert(r.sourceDependentDisplacementRetained);assert(covers(r.aInterval,1));
    assert(covers(r.radialOverP,Math.SQRT1_2/2));assert(covers(r.thetaOverSqrtLambdaUStarP,Math.SQRT1_2/2));assert(covers(r.radialThetaProduct,.125));assert(covers(r.radialZPlusProduct,.125));
    assert(r.fullInitialToRequestedPointTransfer.liouvilleStep[0]>.69);assert(r.fullInitialToRequestedPointTransfer.potentialWholePath[0]>.24);
    assert.equal(r.inverseSqrtGrowth.strictlyPositive,true);assert.equal(r.inverseSqrtGrowth.interval[0],0);assert(r.inverseSqrtGrowth.interval[1]>0);
    assert.equal(r.phaseProgram.representative.y,2.5);
  }
});

test('explicit transverse cutoff has a certified positive mass from monotone source-step quadrature',()=>{
  const a=actualPulseTransverseMass({cells:128}),b=actualPulseTransverseMass({cells:256}),c=actualPulseTransverseMass({cells:512});
  for(const r of[a,b,c]){
    assert(r.pass);assert(r.smoothCompactSupportInsideOriginalRectangle);assert(r.oneTransverseCoordinate);
    assert(r.stepSquaredIntegral[0]>.25&&r.stepSquaredIntegral[1]<.5);
    assert(r.normalizedMass[0]>1.125&&r.normalizedMass[1]<1.25);
    assert(Math.abs(width(r.stepSquaredIntegral)-1/r.cells)<1e-11);
    assert.equal(r.rows[0].sourcePath,'result.results.transverseMass.rows[0]');
  }
  assert(a.normalizedMass[0]<b.normalizedMass[0]&&b.normalizedMass[0]<c.normalizedMass[0]);
  assert(a.normalizedMass[1]>b.normalizedMass[1]&&b.normalizedMass[1]>c.normalizedMass[1]);
});

test('actual Gaussian-coordinate rectangle sums shrink toward an independent integral probe',()=>{
  const exactLimit=Math.sqrt(Math.PI/3)/8;let previous;
  for(const cells of[64,128,256,512]){
    const r=actualMeanPulseCovariance({cells});assert(r.pass);assert.equal(r.rows.length,cells);
    for(const key of['A','B'])assert(covers(r.integrals[key],exactLimit));
    if(previous){assert(previous.integrals.A[0]<r.integrals.A[0]);assert(previous.integrals.A[1]>r.integrals.A[1]);assert(Math.abs(width(previous.integrals.A)/width(r.integrals.A)-2)<1e-9);}
    previous=r;
  }
  assert.equal(previous.gaussian.uniformPulseGridUsedAsQuadrature,false);
  // A finite operator diagnostic exhibits the unresolved-width error of a
  // uniform a-grid. It is not a replacement source parameter.
  const G=2**40,N=64;let wrong=0;
  for(let j=0;j<=N;j++){const a=.5+j/N;wrong+=(j===0||j===N?.5:1)*.125*Math.exp(-3*G*(a-1)**2)/N*Math.sqrt(G);}
  assert(wrong>1000);assert(!covers(previous.integrals.A,wrong));
});

test('whole-cell integral bounds and point observations are source-bound and finite',()=>{
  const r=actualMeanPulseCovariance({cells:128});
  for(const row of r.rows){
    assert.equal(row.sourcePath,`result.results.rows[${row.index}]`);assert(row.wInterval[0]<=row.wMidpoint&&row.wMidpoint<=row.wInterval[1]);
    assert(covers(row.midpointThetaIntegrand,.125*Math.exp(-3*row.wMidpoint**2)));assert(covers(row.midpointZIntegrand,.125*Math.exp(-3*row.wMidpoint**2)));
    assert(row.thetaIntegral[0]>=0&&row.zIntegral[0]>=0);assert(row.P2Bounds[1]<=1);
  }
  assert.equal(r.centerAmplitude.sourcePath,'result.results.centerAmplitude');allFinite(r);
});

test('source time cutoff and nonzero tail remain separate from central quadrature',()=>{
  const r=actualMeanPulseCovariance({cells:64});assert(r.cutoffs.psiCentralExactlyOne);assert(r.cutoffs.smoothCompactSupport);
  assert(r.cutoffs.psi.includes('3/10'));assert.deepEqual(r.cutoffs.psiTailBounds,[0,1]);
  const t=r.integrals.tail;assert(t.tailNotSetToZero);assert(t.absoluteUpper>0&&t.absoluteUpper<1e-12);assert(covers([0,t.absoluteUpper],16*Math.exp(-32)));
  assert(r.integrals.A[0]<r.integrals.centralA[0]);assert(r.integrals.A[1]>r.integrals.centralA[1]);
  assert.equal(r.gaussian.deltaNotReplacedByZero,true);assert.equal(r.gaussian.derivatives.f3AbsoluteUpper,32);
});

test('angular half, one transverse mass, and Haar covering count yield the original common factor',()=>{
  const r=actualMeanPulseCovariance({cells:512}),mass=(r.transverseMass.normalizedMass[0]+r.transverseMass.normalizedMass[1])/2,jac=4-2*Math.SQRT2,C=jac*mass;
  assert(covers(r.covariance.common.coefficientInterval,C));assert(!covers(r.covariance.common.coefficientInterval,2*C));assert(!covers(r.covariance.common.coefficientInterval,C/14));assert(!covers(r.covariance.common.coefficientInterval,jac*mass*mass));
  assert.equal(r.haar.angularAverageExact,'1/2');assert.equal(r.haar.normalizedCoveringFactor,'1');assert.equal(r.haar.transverseMassCount,1);assert.equal(r.haar.exactCancellation,'c_i*Ls=2*r0');
  assert.equal(r.covariance.common.remainingScale.binary64,null);assert(r.covariance.common.remainingScale.strictlyPositive);assert(r.covariance.common.remainingScale.underflowIsNotZero);
});

test('two exact sign families give a nonzero determinant with the anisotropic source scale retained',()=>{
  const r=actualMeanPulseCovariance({cells:256}),H=r.covariance.normalizedMatrix;
  assert(r.parity.exact);assert.deepEqual(H[0][0],H[0][1]);assert.deepEqual(H[1][0],[-H[1][1][1],-H[1][1][0]]);
  assert(r.covariance.determinant.absoluteNormalizedByCommonSquaredSqrtLambda[0]>0);assert(r.covariance.determinant.absoluteNormalizedByBaseScaleSquaredSqrtLambda[0]>0);
  assert(r.covariance.normalization[0].includes('sqrt(lambda)'));assert(!r.covariance.normalization[1].includes('sqrt(lambda)'));
  assert.equal(r.parity.sameSlowBoxCount,1);assert.equal(r.parity.signRectangles,2);assert.equal(r.parity.oppositeSignsIncludedAsSeparateBoxes,false);
});

test('actual T0, weights and global assembly cannot be silently filled by a target fixture',()=>{
  const r=actualMeanPulseCovariance({cells:64});assert.equal(r.status,'PARTIAL');assert.equal(r.covariance.actualSourceTargetSupplied,false);
  for(const key of['actualT0TargetSupplied','positiveWeightsMatched','globalSquaredPartitionMatched','slowNeighborhoodCovarianceCertified','fullCurlCovarianceCorrectionIncluded','allOriginalN5PackageComplete','newLeanKernelProof'])assert.equal(r.scope[key],false,key);
  assert.equal(r.scope.actualHomogeneousPulseCovarianceEnclosed,true);
  for(const input of[null,[],{y:0},{y:5},{y:NaN},{sourceProfile:'toy'},{cells:32},{cells:96},{cells:1024},{cutoffCells:1},{target:[1,0]},{sign:1},{h:.01},{lambda:0},{omitAngularHalf:true},{omitTail:true},{precision:{bits:512}}])assert.throws(()=>actualMeanPulseCovariance(input));
  for(const input of[{w:[-9,0]},{w:[1,0]},{w:[0,Infinity]},{w:0},{h:0},{y:5}])assert.throws(()=>observeActualPulseGaussianCenter(input));
});

test('actual covariance replay is deterministic and cancellation remains responsive',()=>{
  const a=actualMeanPulseCovariance({y:1.25,cells:64}),b=actualMeanPulseCovariance({y:1.25,cells:64});assert.deepEqual(a,b);assert.equal(a.phaseProgram.representative.yExact,'5/4');
  let count=0;assert.throws(()=>actualMeanPulseCovariance({cells:512},{checkCancelled(){if(++count>8)throw Object.assign(Error('cancelled'),{code:'CANCELLED'});}}),e=>e.code==='CANCELLED');
});
