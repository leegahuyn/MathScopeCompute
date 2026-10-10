import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {exactUnitIntervalPolynomial,covarianceConePolynomialAudit,certifyCovariancePerturbationBox,exactFrozenPulsePrincipalOperator,actualCovarianceUniformSourceCertificate} from '../actual-covariance-uniform.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const input={R:2,F:3,FR:'-2',FZ:'1/3',G:1,GR:'2/5',GZ:'-1/7',p:'1/2',pz:'-2/3',epsilon:'1/4',k:2,x0:'7/4',v:'3/5',forcing:['1/3','-2/7','5/11']};
const quarterBox=()=>({kappa:'1/4',targetSlope:['-63/64','63/64'],columnErrors:Array.from({length:2},()=>Array.from({length:2},()=>['-1/512','1/512']))});

test('the source cone uses unchanged accepted source bytes and explicit parameters',()=>{
  const r=actualCovarianceUniformSourceCertificate();assert.equal(r.pass,true);assert.equal(r.checks.length,6);
  const sources=[r.sourceBindings.assembly,...r.sourceBindings.sourceFiles];
  for(const source of sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,source.path))).digest('hex'),source.sha256,source.path);
  assert.deepEqual(r.parameters.kappa.expression,{power:[{ref:'C12EnvelopeR'},-10]});
  assert.equal(r.parameters.kappa.binary64,null);assert.equal(r.parameters.kappa.positiveUnderflowNotZero,true);
  assert.equal(r.actualMeanPatchSecondJets.uniformOverEntireBox,true);
  assert.deepEqual(r.actualMeanPatchSecondJets.domain,{y:[0,5],eta:[-1,1],s:[.5,2]});
});

test('continuous Bernstein proof computes all eight margins, without samples',()=>{
  const a=covarianceConePolynomialAudit();assert.equal(a.pass,true);assert.equal(a.proofs.length,8);
  for(const p of a.proofs){assert.equal(p.certificate.finiteSamplingUsed,false);assert.equal(p.certificate.strictlyPositive,true);}
  const p=a.proofs.find(p=>p.id==='source-cone-margin-after-u-choice').certificate;
  assert.deepEqual(p.powerCoefficients,['1/4','-15/64','1/8']);
  assert.deepEqual(p.bernsteinCoefficients,['1/4','17/128','9/64']);
  assert.deepEqual(a.positiveInverseBounds,['kappa/64','2']);
});

test('nonpositive polynomial and excessive analytic perturbations are detected',()=>{
  assert.equal(exactUnitIntervalPolynomial(['1','-3']).nonnegative,false);
  assert.equal(covarianceConePolynomialAudit({columnErrorDivisor:4}).pass,false);
  assert.equal(covarianceConePolynomialAudit({freezeErrorDivisor:4}).pass,false);
  assert.equal(covarianceConePolynomialAudit({freezeErrorDivisor:8}).pass,false);
});

test('the exact interval inverse encloses an entire independent-error family',()=>{
  const r=certifyCovariancePerturbationBox(quarterBox());assert.equal(r.pass,true);
  assert.deepEqual(r.determinant,['261121/131072','263169/131072']);
  assert.deepEqual(r.normalizedPositiveWeights,[['1540/263169','260604/261121'],['1540/263169','260604/261121']]);
  assert.equal(r.scope.allMatricesAndTargetsInSuppliedBox,true);assert.equal(r.scope.finiteSamplingUsed,false);
});

test('positive matrix alone does not certify an out-of-cone target or wrong error budget',()=>{
  const a=quarterBox();a.targetSlope=['-2','2'];const ar=certifyCovariancePerturbationBox(a);assert.equal(ar.pass,false);
  assert.equal(ar.checks.find(c=>c.id==='target-inside-frozen-source-cone').pass,false);
  const b=quarterBox();b.columnErrors[1][1]=['-1','1'];assert.equal(certifyCovariancePerturbationBox(b).pass,false);
  const c=quarterBox();c.columnErrors=[[['-1','-1'],['-1','-1']],[['0','0'],['0','0']]];
  const cr=certifyCovariancePerturbationBox(c);assert.equal(cr.pass,false);assert.equal(cr.normalizedPositiveWeights,null);
});

test('principal system retains moving normal, forcing, connections, pressure and shear energy',()=>{
  const r=exactFrozenPulsePrincipalOperator(input);assert.equal(r.pass,true);assert.equal(r.checks.length,8);
  assert.deepEqual(r.nPrime,['19/15','0','-11/168']);
  assert.deepEqual(r.residuals.constraintRow,['0','0','0']);
  assert.deepEqual(r.residuals.forcingProjectionRow,['0','0','0']);
  assert.deepEqual(r.residuals.principalEquation,['0','0','0']);assert.equal(r.residuals.energy,'0');
  assert.equal(r.pressure.includesProjectedForcing,true);
});

test('omitting the moving normal fails even though its contribution is invisible to energy',()=>{
  const r=exactFrozenPulsePrincipalOperator(input,{omitMovingNormal:true});assert.equal(r.pass,false);
  assert.deepEqual(r.residuals.constraintRow,['19/15','0','-11/168']);
  assert.equal(r.residuals.energy,'0');
  assert.equal(r.checks.find(c=>c.id==='moving-normal-constraint-row-identity').pass,false);
});

test('omitting cylindrical connections and incompatible initial data are rejected',()=>{
  const a=exactFrozenPulsePrincipalOperator(input,{omitCylindricalConnections:true});assert.equal(a.pass,false);
  assert.equal(a.checks.find(c=>c.id==='original-connection-entries-retained').pass,false);
  const b=exactFrozenPulsePrincipalOperator({...input,amplitude:[1,0,0]});assert.equal(b.pass,false);
  assert.equal(b.checks.find(c=>c.id==='given-amplitude-satisfies-constraint').pass,false);
});

test('source-independent algebra never authenticates a supplied field or a global covariance',()=>{
  const r=actualCovarianceUniformSourceCertificate();
  assert.equal(r.status,'PARTIAL');assert.equal(r.scope.originalN506Complete,false);
  assert.equal(r.scope.sourceUniformQStarCertified,false);assert.equal(r.scope.wholeAnnulusEquation730Verified,false);
  assert.equal(r.scope.allLabelsEnumerationRequired,false);assert.equal(r.scope.allDerivativeOrdersRequiredForThisValueSubclaim,false);
  assert.equal(r.dependencies.length,5);assert.equal(r.dependencies.every(d=>d.available===false),true);
  assert.equal(certifyCovariancePerturbationBox(quarterBox()).scope.sourceFieldBinding,false);
  assert.equal(exactFrozenPulsePrincipalOperator(input).scope.sourceFieldBinding,false);
  assert.throws(()=>actualCovarianceUniformSourceCertificate({actualGlobalBound:true}));
  assert.throws(()=>exactFrozenPulsePrincipalOperator({...input,sourceProfile:r.profileId}));
});

test('malformed, singular, nonperiodic and imprecise inputs cannot pass',()=>{
  for(const patch of [{R:0},{p:0},{k:'1/2'},{p:'1/3'},{R:1.25}])assert.throws(()=>exactFrozenPulsePrincipalOperator({...input,...patch}));
  for(const kappa of ['0','-1','2'])assert.throws(()=>certifyCovariancePerturbationBox({...quarterBox(),kappa}));
  assert.throws(()=>certifyCovariancePerturbationBox({...quarterBox(),targetSlope:['2','1']}));
  assert.throws(()=>actualCovarianceUniformSourceCertificate({sourceProfile:'unaccepted-profile'}));
});

test('receipts are deterministic and cancellation is honored',()=>{
  assert.deepEqual(actualCovarianceUniformSourceCertificate(),actualCovarianceUniformSourceCertificate());
  const stop={checkCancelled(){throw Object.assign(Error('cancelled'),{code:'CANCELLED'});}};
  assert.throws(()=>actualCovarianceUniformSourceCertificate({},stop),{code:'CANCELLED'});
  assert.throws(()=>certifyCovariancePerturbationBox(quarterBox(),stop),{code:'CANCELLED'});
  assert.throws(()=>exactFrozenPulsePrincipalOperator(input,{},stop),{code:'CANCELLED'});
});
