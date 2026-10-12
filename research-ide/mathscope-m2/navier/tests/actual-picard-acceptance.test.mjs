import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildActualPicardAcceptance,verifyActualPicardAcceptance,verifyPicardDerivativeBlock,ACTUAL_PICARD_CRITERION,ACTUAL_PICARD_SOURCE_BINDINGS} from '../actual-picard-acceptance.mjs';

const base=new URL('../../',import.meta.url),navier=new URL('../',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const certificate=buildActualPicardAcceptance({bits:128});
const copy=()=>structuredClone(certificate);

test('original criterion text and all mathematical inputs are bound to their exact retained bytes',()=>{
  const criteriaBytes=readFileSync(new URL(ACTUAL_PICARD_CRITERION.retainedCriteriaPath,base));
  assert.equal(sha(criteriaBytes),ACTUAL_PICARD_CRITERION.retainedCriteriaSHA256);
  const original=JSON.parse(criteriaBytes),criterion=original.packages.N4.criteria.find(x=>x.id==='N4-03');
  for(const key of ['id','title','criteria','sourcePage'])assert.equal(ACTUAL_PICARD_CRITERION[key],criterion[key]);
  assert.equal(original.sourceSHA256,ACTUAL_PICARD_CRITERION.sourceSHA256);
  for(const input of ACTUAL_PICARD_SOURCE_BINDINGS){const b=readFileSync(new URL(input.path,base));assert.equal(b.length,input.bytes);assert.equal(sha(b),input.sha256);}
  for(const input of Object.values(certificate.sourceInputs)){const b=readFileSync(new URL(input.path,new URL('../../../',import.meta.url)));assert.equal(b.length,input.bytes);assert.equal(sha(b),input.sha256);}
});

test('actual n=1 finite acceptance is connected to the original six-component system and real source recurrence',()=>{
  const c=certificate,v=verifyActualPicardAcceptance(c);
  assert.equal(v.pass,true);assert.equal(v.checks.length,15);assert.equal(c.acceptance.status,'PASS');
  assert.equal(c.originalSystem.n,1);assert.deepEqual(c.normalizedSystem.diagonalCPowers,[-1,0,0,0,-1,0]);
  assert.deepEqual(c.originalSystem.axisDatum,[0,0,0,0,0,0]);
  for(const n of Object.values(c.sourceJetWitness.zeroAxisNodeValues))assert.deepEqual(n,{op:'rational',args:['0','1']});
  assert.equal(c.sourceJetWitness.radialDegree,2);assert.equal(c.sourceJetWitness.nodeCount,754);
  assert.equal(c.sourceJetWitness.scope.nextOrderSourceAllowed,false);
  assert.deepEqual(c.normalizedSystem.forcing,['0','0','0','-xi*omegaOverX','-2*ZZF0','-2*ZZU0+2*eta*X*omegaOverX/L']);
});

test('A1 has the required structural nilpotence under arbitrary diagonal Green kernels',()=>{
  const A1=certificate.normalizedSystem.A1,block=verifyPicardDerivativeBlock(A1);
  assert.equal(block.pass,true);assert.deepEqual(block.twoStepPaths,[]);
  for(let i=0;i<6;i++)for(let j=0;j<6;j++)for(let k=0;k<6;k++)assert.ok(A1[i][k]==='0'||A1[k][j]==='0');
  const forged=structuredClone(A1);forged[0][4]='eta';
  const no=verifyPicardDerivativeBlock(forged);assert.equal(no.pass,false);assert.ok(no.twoStepPaths.length>0);
  assert.equal(verifyPicardDerivativeBlock([[0]]).pass,false);
});

test('strip loss and common collar are exact expressions independent of requested precision',()=>{
  const a=buildActualPicardAcceptance({bits:16}),b=buildActualPicardAcceptance({bits:63});
  assert.deepEqual(a.majorant.commonInterval,b.majorant.commonInterval);
  assert.deepEqual(a.majorant.analyticStrip,b.majorant.analyticStrip);
  assert.deepEqual(a.majorant.derivedConstants.C1,b.majorant.derivedConstants.C1);
  assert.equal(a.majorant.commonInterval.X[1],'Xa*exp(t1/16)');
  assert.equal(a.majorant.analyticStrip.loss,'delta/8');
  assert.equal(a.majorant.analyticStrip.nonvanishingPhiLower,'63/256');
  assert.equal(a.tailProof.targetExact,'1/2^16');assert.equal(b.tailProof.targetExact,'1/2^63');
  assert.notDeepEqual(a.pointEnclosures.derivedExpressions.observationXUnit,b.pointEnclosures.derivedExpressions.observationXUnit);
  assert.equal(b.pointEnclosures.scope.precisionChangesObservationPoint,true);
  assert.equal(b.pointEnclosures.scope.N4_05_ResidualEvidence,false);
});

test('executed finite observations keep actual-source uncertainty and positive radii',()=>{
  assert.equal(certificate.axisObservations.samples.length,3);assert.equal(certificate.pointEnclosures.samples.length,15);
  for(const r of certificate.axisObservations.samples){assert.notEqual(r.normalizedInterval.width,'0');assert.equal(r.sourceHash.length,64);}
  for(const r of certificate.pointEnclosures.samples){
    assert.equal(r.XStrictlyPositive,true);assert.equal(r.XBinary64,null);
    assert.equal(r.observationKind,'ACTUAL_NONZERO_RADIUS_NORMALIZED_DIFFERENCE_QUOTIENT');
    assert.equal(r.analyticRemainderUpperExact,'1/2^128');
    assert.equal(r.rawFunctionValueNotDisplayed,true);
  }
  assert.ok(certificate.axisObservations.samples[0].value>0);
  assert.ok(certificate.axisObservations.samples[2].value<0);
});

test('forged source, incomplete forcing, incorrect strip, shrunken radius and too-small K are rejected',()=>{
  const mutations=[
    c=>c.parameterExpressionSHA256='0'.repeat(64),
    c=>c.sourceBindings[0].sha256='0'.repeat(64),
    c=>c.originalSystem.A0[0][4]='0',
    c=>c.normalizedSystem.A0[3][0]='4*xi*F0/C',
    c=>c.normalizedSystem.forcing[5]='-2*ZZU0',
    c=>c.normalizedSystem.A1[0][4]='1',
    c=>c.majorant.derivedConstants.C1={integer:'1'},
    c=>c.majorant.derivedConstants.delta={integer:'0'},
    c=>c.majorant.derivedConstants.cauchyRadiusLoss={ref:'delta'},
    c=>c.majorant.commonInterval.X[1]='Xa',
    c=>c.majorant.derivedConstants.truncationIndex={integer:'1'},
    c=>c.tailProof.targetExact='0',
    c=>c.sourceJetWitness.zeroAxisNodeValues.U.args[0]='1',
    c=>c.axisObservations.samples[0].normalizedInterval.lower='0',
    c=>c.pointEnclosures.samples[0].XBinary64=0,
  ];
  for(const mutate of mutations){const c=copy();mutate(c);assert.equal(verifyActualPicardAcceptance(c).pass,false);}
});

test('finite acceptance rejects fabricated K-term execution, higher-order, residual and package completion claims',()=>{
  for(const mutate of [
    c=>c.majorant.picard.truncationActuallyEvaluated=true,
    c=>c.tailProof.truncationActuallyEvaluated=true,
    c=>c.scope.numericalKTermSumExecuted=true,
    c=>c.scope.higherBackgroundOrdersFinalized=true,
    c=>c.scope.globalFiveMomentRepairComplete=true,
    c=>c.scope.N4_05ResidualDecayComplete=true,
    c=>c.scope.fullN4PackageComplete=true,
    c=>c.scope.fullM2PackageComplete=true,
    c=>c.acceptance.packageGateSatisfied=true,
    c=>c.acceptance.proofKind='NEW LEAN PROOF EXECUTED',
  ]){const c=copy();mutate(c);assert.equal(verifyActualPicardAcceptance(c).pass,false);}
  assert.equal(certificate.scope.newLeanKernelExecution,false);
});

test('unavailable orders, alternate sources and caller majorants cannot enter an actual-source certificate',()=>{
  for(const input of [null,[],{order:2},{profileId:'a convenient fixture'},{bits:0},{bits:16.5},{bits:4097},{Cn:1},{radius:1},{sourceStrip:1},{sourceJet:{}}])assert.throws(()=>buildActualPicardAcceptance(input));
  assert.equal(verifyActualPicardAcceptance(null).pass,false);
  assert.equal(verifyActualPicardAcceptance({schema:'fabricated'}).pass,false);
});
