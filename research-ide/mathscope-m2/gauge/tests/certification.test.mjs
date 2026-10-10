import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../../../mathscope-m1/gauge/matrix.mjs';
import {availableGroups,createGroup,fromCoordinates} from '../../../mathscope-m1/gauge/groups.mjs';
import {createField,evaluateJet} from '../../../mathscope-m1/gauge/fields.mjs';
import {getExamples,runJob,run,validateRequest} from '../index.mjs';
import {normalizeInput,SU2,rngFromSeed} from '../contracts.mjs';
import {createConfiguration,action,measure} from '../lattice.mjs';
import {qFromMatrix,qWilson,qLoop,qMultiply} from '../quaternion-oracle.mjs';
import {auditedTransport,auditedExponential,connectionEnclosure,smoothnessBounds,matrixNormUpper,piEnclosure} from '../transport-certificates.mjs';
import {su2Reference,characterEigenvalue,besselI,expEnclosure,nextUp,nextDown,sqrt,point,mul} from '../enclosures.mjs';
import {cubeSpinBasis,symmetricEigen} from '../transfer.mjs';
import {compareWithReference,referenceInterval} from '../reference.mjs';
import {splitRhat,topologyMobility,analyzeSeries} from '../statistics.mjs';
const example=id=>structuredClone(getExamples().find(e=>e.id===id).request),bpst=()=>example('m2-bpst-refinement').input.field;

test('directed elementary/transcendental enclosures retain tail, pi, beta=0 and invalid-domain distinctions',()=>{
  assert.ok(nextDown(1)<1&&nextUp(1)>1);assert.equal(nextUp(0),Number.MIN_VALUE);assert.ok(piEnclosure().lower<Math.PI&&piEnclosure().upper>Math.PI);
  for(const x of [-100,-20,-1,.001,1,20,100]){const r=expEnclosure(x);assert.ok(r.lower<=Math.exp(x)&&r.upper>=Math.exp(x),String(x));}
  assert.deepEqual(su2Reference(0).meanTrace,{lower:0,upper:0});assert.deepEqual(characterEigenvalue(2,0),{lower:0,upper:0});assert.throws(()=>characterEigenvalue(0,-1));assert.throws(()=>besselI(3,21));
  const r=besselI(4,6);assert.ok(r.tailUpper>0);assert.ok(r.upper>r.lower);
  for(const x of [1e-300,.01,1,2,1e100]){const r=sqrt(point(x));assert.ok(mul(point(r.lower),point(r.lower)).upper<=x);assert.ok(mul(point(r.upper),point(r.upper)).lower>=x);}assert.throws(()=>sqrt({lower:-1,upper:1}));
});
test('the real M1 source links receive separate finite-path, exponential, roundoff and boundary bounds',async()=>{
  const r=await runJob(example('m2-bpst-lattice')),c=r.numericalError.certificate;
  assert.equal(r.numericalError.certifiedErrorBound,true);assert.equal(c.certifiedLinkCount,r.lattice.activeLinks);assert.ok(c.pathIntegrationUpper>0);assert.ok(c.sourceEvaluationUpper>0);assert.ok(c.exponentialTruncationUpper>0);assert.ok(c.exponentialRoundoffUpper>0);assert.ok(c.productRoundoffUpper>0);assert.equal(c.boundaryRestrictionErrorUpper,0);assert.ok(c.maximumLinkErrorUpper>=c.pathIntegrationUpper);assert.equal(c.groupExactDataHash,r.model.groupExactDataHash);
});
test('all fourteen representations obtain their own true matrix coefficients and derivative norm bounds',()=>{
  const hashes=new Set();for(const descriptor of availableGroups()){
    const field=createField(createGroup(descriptor.spec),bpst()),x=[.2,-.3,.1,.4],y=[.325,-.3,.1,.4],r=auditedTransport(field,x,y,4),c=r.certificate;hashes.add(c.sourceSpecificGroup.exactDataHash);
    assert.equal(r.matrix.n,descriptor.matrixDimension);assert.equal(c.sourceSpecificGroup.id,descriptor.id);assert.ok(c.errorUpper>0&&Number.isFinite(c.errorUpper));
    const jet=evaluateJet(field,[.25,-.3,.1,.4],{order:2});for(let mu=0;mu<4;mu++){assert.ok(matrixNormUpper(jet.A[mu])<=c.sourceBounds.directionBounds[mu].A);for(let j=0;j<4;j++){assert.ok(matrixNormUpper(jet.dA[j][mu])<=c.sourceBounds.directionBounds[mu].first);for(let k=0;k<4;k++)assert.ok(matrixNormUpper(jet.ddA[k][j][mu])<=c.sourceBounds.directionBounds[mu].second);}}
  }assert.equal(hashes.size,14,'Every one of the fourteen installed representations binds its own exact source data.');
});
test('full-basis Fourier and Gaussian sources are really evaluated and enclosed, rather than borrowing BPST bounds',()=>{
  for(const kind of ['FULL_BASIS_TRIAL','BPST_PLUS_PERTURBATION'])for(const mode of ['FOURIER','GAUSSIAN_POLYNOMIAL']){
    const fs={...bpst(),kind,...(kind==='FULL_BASIS_TRIAL'?{rho:null,embedding:null}:{}),perturbation:{kind:mode,length:1.2,amplitude:.07,seed:'independent-full-basis-fixture',modes:mode==='FOURIER'?[{wave:[1,-2,1,0],parity:'SIN',phase:.3}]:[[1,1,0,0]]}},field=createField(createGroup(SU2),fs),x=[.2,-.3,.1,.4],y=[.25,-.3,.1,.4],r=auditedTransport(field,x,y,4);
    assert.equal(r.certificate.status,'DIRECTED_FLOAT64_ERROR_ENCLOSURE');assert.ok(r.certificate.sourceEvaluation>0);assert.ok(r.certificate.errorUpper<.1);
    const A=evaluateJet(field,x,{order:0}).A[0],enclosure=connectionEnclosure(field,x.map(v=>({lower:v,upper:v})),0);for(let k=0;k<A.re.length;k++){assert.ok(A.re[k]>=enclosure.re[k].lower-1e-14&&A.re[k]<=enclosure.re[k].upper+1e-14);assert.ok(A.im[k]>=enclosure.im[k].lower-1e-14&&A.im[k]<=enclosure.im[k].upper+1e-14);}
  }
});
test('both spacings, curvature, energy and noninteger topology converge, with conservative order separate from observed order',async()=>{
  for(const id of ['m2-bpst-refinement','m2-bpst-clover-anisotropic']){
    const r=await runJob(example(id));assert.equal(r.status,'COMPLETED');assert.ok(r.convergence.energyDensityDecrease&&r.convergence.topologyDensityDecrease);assert.equal(r.convergence.certifiedLocalContinuumError,true);assert.equal(r.convergence.certifiedGlobalContinuumError,false);assert.equal(r.topology.roundedCharge,null);assert.equal(r.topology.integerCertificate,'NOT_AVAILABLE');
    assert.ok(r.boundaryError.chargeTailUpper>0);assert.ok(r.boundaryError.energyTailUpper>r.boundaryError.chargeTailUpper);
    for(let i=1;i<r.levels.length;i++){assert.equal(r.levels[i].temporalSpacing*2,r.levels[i-1].temporalSpacing);assert.ok(r.levels[i].certificate.curvatureFrobeniusErrorUpper<r.levels[i-1].certificate.curvatureFrobeniusErrorUpper);assert.ok(r.levels[i].certificate.energyUpper<r.levels[i-1].certificate.energyUpper);}
    assert.ok(r.reference.closedBPST.energyAgreement<1e-12);assert.ok(r.reference.closedBPST.topologyAgreement<1e-14);
    if(id.includes('clover'))assert.ok(r.convergence.observedOrders.every(x=>x>1.9&&x<2.1));
  }
});
test('independent quaternion products reproduce matrix plaquettes and detect an intentionally reversed noncommutative multiplication',async()=>{
  const request=example('m2-su2-pure-gauge');request.input.initial={kind:'HOT_HAAR',seed:'independent-quaternion-comparison'};const c=await createConfiguration(normalizeInput(request.kind,request.input)),q=c.links.map(u=>u?qFromMatrix(u):null),r=qWilson(c.geometry,q),m=measure(c);
  assert.ok(Math.abs(r.action-action(c))<1e-11);assert.ok(Math.abs(r.meanPlaquette-m.meanPlaquette)<1e-12);
  const [a,b]=c.geometry.plaquettes[0].edges.map(e=>q[e.id]),correct=qMultiply(a,b),wrong=qMultiply(b,a);assert.ok(correct.some((v,i)=>Math.abs(v-wrong[i])>.01));
});
test('fixed-volume energy and real charge use all cells, decrease relative to an independent integral, and reject changed boxes',async()=>{
  const request=example('m2-bpst-fixed-volume'),r=await runJob(request);assert.equal(r.status,'COMPLETED');assert.equal(r.convergence.fixedPhysicalVolume,true);assert.equal(r.convergence.independentErrorIntervalsStrictlyDecrease,true);assert.equal(r.convergence.analyticBoundsDecrease,true);assert.equal(r.convergence.globalIntegerCharge,null);assert.equal(r.reference.pointCount,160000);
  assert.deepEqual(r.levels.map(l=>l.cellCount),[1,16,81]);assert.ok(r.reference.charge.lower>.17&&r.reference.charge.upper<.19);
  for(const row of r.levels){const n=row.cellsPerCoordinate;assert.equal(row.source.cells.length,n**4);assert.equal(row.source.links.filter(Boolean).length,4*n*(n+1)**3);assert.equal(row.source.links.length,4*(n+1)**4);assert.equal(row.certificate.sourceLinkCertificate.certifiedLinkCount,row.activeLinks);assert.ok(row.certificate.sourceLinkCertificate.exponentialRoundoffUpper>0);assert.ok(row.certificate.curvatureDensityPart.chargeUpper>0&&row.certificate.riemannQuadraturePart.chargeUpper>0);assert.ok(row.chargeError.upper<row.certificate.chargeErrorUpper);assert.ok(row.energyError.upper<row.certificate.energyErrorUpper);assert.ok(Math.abs(row.spatialSpacing*n-r.model.lengths[0])<1e-15);assert.ok(Math.abs(row.temporalSpacing*n-r.model.lengths[3])<1e-15);}
  const bad=structuredClone(request);bad.input.origin=[3.8,0,0,0];assert.equal(validateRequest(bad).ok,false);bad.input.origin=request.input.origin;bad.input.cellCounts=[1,1];assert.equal(validateRequest(bad).ok,false);
  const underresolved=structuredClone(request);underresolved.input.referencePanels=8;underresolved.input.cellCounts=[3,4];delete underresolved.budget;const partial=await runJob(underresolved);assert.equal(partial.status,'PARTIAL','An overly wide independent reference must not certify strict convergence.');
  let calls=0;await assert.rejects(()=>runJob(request,{checkCancelled(){if(++calls>3)throw Object.assign(Error('cancel quadrature'),{code:'CANCELLED'});}}),e=>e.code==='CANCELLED');
});
test('nonzero-beta 4D reference is independent, passes two starts and rejects a wrong distribution mean',async()=>{
  const r=await runJob(example('m2-su2-small-lattice-reference'));assert.equal(r.status,'COMPLETED');assert.equal(r.ensemble.diagnostics.equilibrium.passed,true);assert.ok(r.reference.meanTrace.lower<r.reference.meanTrace.upper);assert.equal(r.source.firstConfigurations[0].positiveLinks.filter(Boolean).length,32);assert.ok(r.comparisons.every(c=>c.passed));
  assert.equal(compareWithReference(.5,.001,r.reference.meanTrace).passed,false);assert.equal(compareWithReference(0,null,r.reference.meanTrace).passed,false);assert.equal(r.reference.actionInterval.lower<r.reference.actionInterval.upper,true);assert.equal(r.independentControls.pureGauge.passed,true);
  const underflow=referenceInterval({samples:256,plaquetteCount:24,sumWeight:1e-9,sumWeightedPlaquette:0,failureProbability:.001});assert.equal(underflow.status,'UNRESOLVED_SMALL_DENOMINATOR');assert.equal(underflow.meanTrace,null);
});
test('full-basis Lie Metropolis also meets an independent strong-coupling distribution reference',async()=>{
  const r=await runJob(example('m2-su2-lie-reference'));assert.equal(r.status,'COMPLETED');assert.equal(r.model.algorithm,'FULL_BASIS_LIE_METROPOLIS');assert.ok(r.statistics.effectiveSampleSize>=100);assert.equal(r.comparison.passed,true);assert.ok(r.certifiedReference.meanTrace.lower>0);
});
test('a long stalled or segregated history cannot acquire equilibrium or topology approval',async()=>{
  const constant=Array(2048).fill(.3),statistics=analyzeSeries(constant);assert.equal(topologyMobility(constant,statistics).passed,false);assert.equal(splitRhat([constant,constant]).status,'CONSTANT_WITHIN_CHAIN');
  const rng=rngFromSeed('separated-chains'),a=Array.from({length:512},()=>rng.normal()),b=Array.from({length:512},()=>10+rng.normal());assert.equal(splitRhat([a,b]).status,'SPLIT_RHAT_FAILED');
  const r=example('m2-su2-small-lattice-reference');r.kind='gauge.ensemble';delete r.input.oracleSamples;delete r.input.failureProbability;delete r.input.seed;r.input.sampler={algorithm:'FULL_BASIS_LIE_METROPOLIS',starts:['COLD','HOT_HAAR'],seed:'stalled-with-many-samples',samples:256,burnIn:1,stepSize:1e-6,maxLag:32};delete r.budget;
  const out=await runJob(r);assert.equal(out.status,'PARTIAL');assert.equal(out.diagnostics.equilibrium.passed,false);assert.ok(out.replicas.some(x=>!x.topologyDiagnostic.passed));
});
test('reflection positivity applies a real source theorem and records which generalizations are separately derived',async()=>{
  const request=example('m2-wilson-reflection-audit'),r=await runJob(request);assert.equal(r.reflectionPositivity.status,'EXTERNAL_THEOREM_APPLIED');assert.ok(r.reflectionPositivity.sourceTheorem.url.includes('desy.de'));assert.equal(r.reflectionPositivity.assumptions.length,6);assert.equal(r.reflectionPositivity.derivation.length,4);assert.equal(r.reflectionPositivity.newLeanKernelRun,false);
  const extended=structuredClone(request);extended.input.group=availableGroups().find(x=>x.id==='G2').spec;extended.input.lattice.spatialBoundary='OPEN';extended.input.lattice.at=.25;const g=await runJob(extended);assert.equal(g.reflectionPositivity.status,'ANALYTIC_EXTENSION_APPLIED');assert.ok(g.reflectionPositivity.extensionFromSource);
  for(const bad of [{beta:-1},{extraTerms:['IMPROVED_RECTANGLE']},{measure:'ARBITRARY_COORDINATE_LEBESGUE'},{observableAlgebra:'GAUGE_VARIANT_UNRESTRICTED'}]){const v=await runJob({...request,input:{...request.input,...bad}});assert.equal(v.status,'PARTIAL');assert.equal(v.reflectionPositivity.status,'NOT_APPLICABLE');assert.ok(v.blockers.length);assert.notEqual(v.modelHash,r.modelHash);}
});
test('the cube cutoff exhausts the exact low-spin Gauss sector and a periodic replacement is rejected',()=>{
  const input=example('m2-su2-cube-transfer-cutoff').input,cube=cubeSpinBasis(input.lattice);assert.equal(cube.certificate.admissibleAssignments.length,7);assert.equal(cube.certificate.firstPossibleOmittedWeight,6);assert.equal(cube.basis.filter(b=>b.totalSpinWeight===4).length,6);
  for(const b of cube.basis.slice(1))assert.equal(b.edgeTwoJ.filter(Boolean).length,4);assert.throws(()=>cubeSpinBasis({...input.lattice,spatialBoundary:'PERIODIC'}),/periodic/);
  assert.equal(validateRequest({kind:'gauge.transfer-cutoff',input:{...input,cutoffWeight:4}}).code,'UNSUPPORTED');
});
test('actual finite transfer matrix has explicit positivity, Gauss, unitary evolution and separate errors; underresolved requests stay partial',async()=>{
  const request=example('m2-su2-cube-transfer-cutoff'),r=await runJob(request),t=r.transferOperator;assert.equal(r.status,'COMPLETED');assert.equal(t.finiteMatrix.length,7);assert.ok(t.eigenvalues.every(x=>x>0));assert.equal(t.unitarity.euclideanTransferUnitary,false);assert.ok(t.unitarity.finiteRealTimeEvolution.maxUnitaryResidual<1e-12);assert.ok(r.errorBudget.operatorNorm.deterministicCutoffUpper>0);assert.ok(r.errorBudget.operatorNorm.independentCubatureUpper>r.errorBudget.operatorNorm.deterministicCutoffUpper);assert.ok(r.cutoff.gaugeResidual<1e-12);
  const bad=await runJob({...request,input:{...request.input,maxOperatorError:1e-5,quadratureSamples:256}});assert.equal(bad.status,'PARTIAL');assert.equal(bad.errorBudget.operatorNorm.withinRequestedBound,false);
  const corrupted=t.finiteMatrix.map(a=>a.slice());corrupted[0][0]=-1;assert.ok(symmetricEigen(corrupted).values.some(v=>v<0),'Negative weights cannot be accepted as a positive transfer matrix.');
});
test('new jobs preserve real model/sample identities, resource rejection and cancellation checkpoints',async()=>{
  for(const id of ['m2-wilson-reflection-audit','m2-su2-cube-transfer-cutoff','m2-su2-small-lattice-reference']){const request=example(id),r=await runJob(request);for(const key of ['sourceHash','sampleHash','modelHash'])assert.match(r[key],/^[a-f0-9]{64}$/);assert.equal(validateRequest({...request,budget:{maxOperations:1}}).code,'BUDGET_EXCEEDED');}
  let count=0;await assert.rejects(()=>runJob(example('m2-su2-cube-transfer-cutoff'),{checkCancelled(){if(++count>20)throw Object.assign(Error('cancel independent cubature'),{code:'CANCELLED'});}}),e=>e.code==='CANCELLED');
  const f=createField(createGroup(SU2),bpst());assert.throws(()=>auditedTransport(f,[3.9,0,0,0],[4.1,0,0,0],4),/window/);assert.throws(()=>auditedTransport(f,[0,0,0,0],[.1,.1,0,0],4),/coordinate-aligned/);
});
