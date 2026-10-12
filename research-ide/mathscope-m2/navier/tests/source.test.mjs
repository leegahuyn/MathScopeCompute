import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {coefficientIdentityAudit,sourceDimensionAudit,sourceCutoffCurlAudit,finiteBackgroundResidual} from '../source-algebra.mjs';
import {getPinnedSourceProfile,sourceExponentContract,validateParameterGraph,SOURCE_PROFILE_ID} from '../source-profile.mjs';
import {sourceDyadicObservation,sourceBandParameters,sourceTorusGeometry,torusExactIdentityAudit,evaluatedDerivativeContract,applyEvaluatedDerivatives} from '../source-geometry.mjs';
import {sourceSupportAllocation,uniformSupportPalette} from '../source-support.mjs';
import {sourcePicardSystem,picardTailBound,sourceMomentOperator} from '../source-background.mjs';
import {integrateAffineTangentPulse} from '../pulse-ode.mjs';
import {referenceGaussianEnvelope} from '../source-envelope.mjs';
import {runJob} from '../index.mjs';
import {executeDomain} from '../../core/registry.mjs';
import {createM2Engine} from '../../core/engine.mjs';

const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=x=>Math.hypot(...x),add=(a,b)=>a.map((x,i)=>x+b[i]),scale=(a,s)=>a.map(x=>x*s),mv=(A,x)=>A.map(row=>dot(row,x));

test('all six original archive inputs are hash bound; the full parameter graph retains the actual h and lambda',async()=>{
  const p=getPinnedSourceProfile();assert.equal(p.id,SOURCE_PROFILE_ID);assert.equal(p.globalNumericalEvaluator,false);assert.equal(p.m2HigherCoefficientsInArchive,false);
  for(const source of Object.values(p.inputs)){const file=await readFile(new URL('../../../'+source.path,import.meta.url));assert.equal(file.length,source.bytes);assert.equal(createHash('sha256').update(file).digest('hex'),source.sha256);}
  const graph=validateParameterGraph();assert.equal(graph.ok,true);assert.ok(graph.parameters>50);assert.deepEqual(p.parametersExactExpressions.h,{exp:{product:[{integer:-8002},{ref:'T'}]}});assert.deepEqual(p.parametersExactExpressions.lambda,{exp:{product:[{integer:-1000},{ref:'T'}]}});
  const h=sourceExponentContract();assert.equal(h.positive,true);assert.equal(h.zeroIsEnclosureEndpointOnly,true);assert.equal(h.notNumericallyReplaced,true);assert.equal(h.binary64Enclosure[0],0);
  const clone=getPinnedSourceProfile();clone.id='tampered';assert.equal(getPinnedSourceProfile().id,SOURCE_PROFILE_ID);
});

test('independent Python physical q Taylor jets and Decimal checks confirm the exact PDE, support, Jacobian, moment and tail computations',()=>{
  const input={residual:finiteBackgroundResidual(2),support:uniformSupportPalette(),geometry:sourceTorusGeometry(),moments:sourceMomentOperator(),picardTail:picardTailBound()},r=spawnSync('python',[fileURLToPath(new URL('./source-independent-checks.py',import.meta.url))],{input:JSON.stringify(input),encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);const evidence=JSON.parse(r.stdout);assert.equal(evidence.pass,true);assert.equal(evidence.pdeExactMatches,16);assert.equal(evidence.total,40);assert.ok(evidence.checks.every(c=>c.pass));
});

test('source coefficient and dimension checks reject omitted shifts, cylindrical terms, axis pressure substitution and h substitution',()=>{
  assert.equal(sourceDimensionAudit().pass,true);assert.equal(sourceDimensionAudit({pressureKind:'AXIS_TRACE_ONLY'}).pass,false);assert.equal(sourceDimensionAudit({parameterBinding:'SUPPLIED_H_0.005'}).pass,false);
  assert.equal(coefficientIdentityAudit(2).pass,true);
  for(const negativeControl of['omit-axial-viscosity','omit-pressure-shift','omit-cylindrical-connection']){const audit=coefficientIdentityAudit(2,{negativeControl});assert.equal(audit.pass,false,negativeControl);assert.ok(audit.orders.some(o=>Object.values(o.equations).some(e=>e.difference.length)));}
});

test('source q-dependent cutoff has exact zero divergence and its omitted chi-prime correction fails',()=>{
  for(const n of[1,2,4]){const good=sourceCutoffCurlAudit(n),bad=sourceCutoffCurlAudit(n,{omitCutoffDerivative:true});assert.equal(good.pass,true);assert.equal(good.divergenceZero,true);assert.equal(good.radialFormulaMatches,true);assert.equal(good.angularCutoffPreservesDivergence,true);assert.equal(bad.pass,false);assert.equal(bad.divergenceZero,false);assert.ok(bad.divergenceTerms.length>0);}
});

test('the full six-component Picard system records regular coefficients, common domain and a genuine two-parity infinite tail',()=>{
  const first=sourcePicardSystem(1),eighth=sourcePicardSystem(8);assert.deepEqual(first.axisDatum,[0,0,0,0,0,0]);assert.deepEqual(first.singularDiagonal,[0,0,2,0,3,1]);assert.deepEqual(first.commonDomain,eighth.commonDomain);assert.equal(first.blockCertificate.allDiagonalKernelProductsVanish,true);assert.equal(first.A1[4][0],'2*(D*eta+d*U0)/L');assert.equal(first.A1[5][3],'2*d/L');assert.ok(first.A0[5][0].includes('C^2'));
  const a=picardTailBound({terms:16}),b=picardTailBound({terms:32});assert.ok(b.logTailBound[1]<a.logTailBound[0]);assert.equal(a.sourceCnBoundProven,false);assert.equal(a.actualProfileSolutionEnclosed,false);assert.equal(a.commonIntervalUnchanged,true);assert.ok(a.parityRatioUpper[1]<1);
  assert.throws(()=>picardTailBound({Cn:1e4,terms:16}),{code:'PRECISION_REQUIRED'});assert.throws(()=>picardTailBound({rho:.25,rhoPrime:.5}),{code:'INVALID_INPUT'});
});

test('the five-moment operator retains actual lambda and Ipos, proves invertibility, separates n=1 support and guards reuse',()=>{
  for(const n of[1,2]){const r=sourceMomentOperator({n});assert.equal(r.pass,true);assert.equal(r.lambda.strictlyPositive,true);assert.equal(r.lambda.lowerEndpointIsNotSubstitution,true);assert.equal(r.rowTransform.noLambdaZeroSubstitution,true);assert.ok(r.uSolve.determinant[0]>0);assert.ok(r.eSolve.determinant[0]>0);assert.equal(r.actualMomentCorrectionsApplied,false);assert.equal(r.nextOrderAllowed,false);assert.equal(r.stressSupport.n1,'[X_minus,X_b]');assert.equal(r.stressSupport.nAtLeast2,'[X_minus,X_plus]');assert.equal(r.bumps.length,5);}
  const zero=sourceMomentOperator({normalizedDebts:[0,0,0,0,0]});for(const b of[...zero.uSolve.solution,...zero.eSolve.solution])assert.ok(b[0]<=0&&b[1]>=0);assert.equal(zero.actualMomentCorrectionsApplied,false,'A zero operator probe is not a repaired actual source.');
});

test('the finite physical residual keeps all exact monomials while refusing an uncomputed actual norm or tail',()=>{
  const r=finiteBackgroundResidual(2);assert.equal(r.coefficientIdentityAudit.pass,true);assert.equal(r.CNm,null);assert.equal(r.Km,null);assert.equal(r.verifiedTailBound,false);assert.equal(r.orderRefinementIsNumericalResidualDecay,false);assert.equal(r.actualProfileCoefficientsEvaluated,false);assert.equal(r.actualStressAssembled,false);for(const c of Object.values(r.components)){assert.ok(c.length>=3);assert.ok(c.every(x=>x.termCount===x.terms.length));}
});

test('actual-h band labels survive rounding epsilon to a displayed one; source substitution and q=0 are rejected',()=>{
  for(const ell of[8,16,64,256,900]){const b=sourceBandParameters(ell);assert.equal(b.carrier.k,2);assert.equal(b.epsilon.strictlyLessThanOne,true);assert.equal(b.epsilon.notRoundedToAnExactOne,true);assert.equal(b.covering.frozen,true);assert.equal(Math.floor(b.covering.indexInterval[0]),Math.floor(b.covering.indexInterval[1]));}
  const r=sourceDyadicObservation({ellStart:32,count:5,T:0,Z:.2});assert.ok(r.rows.every(x=>x.tau===0&&x.oneSidedTimeBoundary));assert.equal(r.leadingFieldNumericallyEvaluated,false);
  assert.throws(()=>sourceDyadicObservation({sourceProfile:SOURCE_PROFILE_ID,h:.005}),{code:'INVALID_INPUT'});assert.throws(()=>sourceDyadicObservation({T:0,Z:0}),{code:'UNSUPPORTED'});assert.throws(()=>sourceDyadicObservation({ellStart:900,count:2}),{code:'PRECISION_REQUIRED'});
});

test('exact quadratic-field dual/covering identities enforce every evaluated chain-rule term and correct normalized Haar',()=>{
  const good=torusExactIdentityAudit();assert.equal(good.pass,true);assert.equal(good.chainRule.time_v,1);assert.equal(good.haar.fullCoveringFactor,'1');assert.equal(torusExactIdentityAudit({omitFastChainRule:true}).pass,false);assert.equal(torusExactIdentityAudit({wrongGlobalHaarFactor:true}).pass,false);
  const c=evaluatedDerivativeContract(16,1),r=applyEvaluatedDerivatives(c,{R:0,Z:0,T:0,theta:0,Y1:0,Y2:1});assert.ok(r.time[0]>0);assert.ok(r.Dr[1]<0);assert.throws(()=>applyEvaluatedDerivatives(c,{R:1,Z:2,T:3}),{code:'INVALID_INPUT'});
  const onlySlow=applyEvaluatedDerivatives(c,{R:1,Z:0,T:0,theta:0,Y1:0,Y2:0});assert.ok(onlySlow.Dr[0]<=1&&onlySlow.Dr[1]>=1);
});

test('the uniform all-band palette handles very large exact labels and exposes the modulus-4 negative control',()=>{
  const huge='10000000000000000000000000000000000000000',r=sourceSupportAllocation([{id:'a',ell:huge,grid:[huge,0,0],sign:1},{id:'b',ell:huge,grid:[huge,0,4],sign:1},{id:'c',ell:huge,grid:[huge,0,0],sign:-1}]);assert.equal(r.palette.commonToAllBandsAndLabels,true);assert.equal(r.allActivePairsCoveredByUniformProof,true);assert.ok(r.pairChecks.every(x=>x.differentColors&&x.auxiliarySupportsDisjoint));assert.equal(r.distinctSlowBoxes,2);assert.equal(r.rectangles[0].ell,huge);
  assert.throws(()=>sourceSupportAllocation([{ell:16,grid:[0,0,0],sign:1},{ell:16,grid:[0,0,0],sign:1}]),{code:'INVALID_INPUT'});assert.throws(()=>sourceSupportAllocation([{id:'legacy',slow:[0,1]}]),{code:'INVALID_INPUT'});
});

function directCartesian(options,end){
  const N=8192,h=(end-options.midpoint)/N;let t=options.initial.slice();
  const rhs=(v,x)=>{const n=add(options.normalAtMidpoint,scale(options.normalDerivative,v-options.midpoint)),Kx=mv(options.matrix,x),n2=dot(n,n);return add(add(scale(Kx,-1),scale(n,(dot(n,Kx)-dot(options.normalDerivative,x))/n2)),scale(x,-options.dampingCoefficient*n2));};
  for(let j=0;j<N;j++){const v=options.midpoint+j*h,k1=rhs(v,t),k2=rhs(v+h/2,add(t,scale(k1,h/2))),k3=rhs(v+h/2,add(t,scale(k2,h/2))),k4=rhs(v+h,add(t,scale(k3,h)));t=add(t,scale(add(add(k1,scale(add(k2,k3),2)),k4),h/6));}return t;
}
test('full three-component affine phase normal agrees with an independent Cartesian ODE and retains FZ/GZ',async()=>{
  const n=[.4,1.2,-.7],raw=[1.2,-.4,0],options={matrix:[[0,-2,0],[-1,0,0],[.4,0,0]],normalAtMidpoint:n,normalDerivative:[.3,0,.12],midpoint:2,length:1.2,steps:128,dampingCoefficient:.4,initial:scale(raw,1/norm(raw))},r=integrateAffineTangentPulse(options);
  for(const row of[r.rows[0],r.rows.at(-1)]){const independent=directCartesian(options,row.v),actual=scale(row.t,Math.exp(row.logScale));assert.ok(norm(add(actual,scale(independent,-1)))/norm(independent)<1e-8);assert.ok(Math.abs(dot(add(n,scale(options.normalDerivative,row.v-2)),row.t))<1e-13);}
  assert.equal(r.method.retainsAxialNormalDerivative,true);
  const job=await runJob({kind:'ns.pulse-ode',input:{FZ:.2,GZ:-.15,GR:.4}});assert.equal(job.results.phaseContract.allThreeNormalComponentsRetained,true);assert.equal(job.results.phaseContract.missingAxialDerivativeWouldChangeNormal,true);assert.ok(job.checks.every(x=>x.pass));assert.equal(job.results.diagnostics.rigorousSolutionErrorBound,null);
});

test('new source requests reject incomplete gradients, replacement profiles, false precision and insufficient budgets',async()=>{
  for(const [request,status]of[[{kind:'ns.torus-derivatives',input:{gradient:{R:1}}},'FAILED'],[{kind:'ns.background-moments',input:{normalizedDebts:[0]}},'FAILED'],[{kind:'ns.background-picard',input:{rho:.1,rhoPrime:.2}},'FAILED'],[{kind:'ns.background-picard',input:{Cn:1e4,terms:16}},'PRECISION_REQUIRED'],[{kind:'ns.dyadic-charts',input:{sourceProfile:SOURCE_PROFILE_ID,h:.005}},'FAILED'],[{kind:'ns.pulse-support',input:{sourceProfile:'toy-replacement'}},'UNSUPPORTED'],[{kind:'ns.background-moments',input:{},precision:{mode:'FORMAL'}},'PRECISION_REQUIRED'],[{kind:'ns.background-residual',input:{},budget:{maxOperations:1}},'BUDGET_EXCEEDED']])assert.equal((await executeDomain(request)).status,status);
});

test('source Bs squared and the reference Gaussian bound are correct without promoting the local pulse to a source Gaussian theorem',async()=>{
  const result=await runJob({kind:'ns.pulse-ode',input:{}}),p=result.results.parameters;
  assert.ok(Math.abs(p.Bs*p.Bs-p.lambda0/(p.eps*p.k*p.k*(1+p.u*p.u)**1.5))<1e-15);
  const oldWrongBs=2*p.lambda0/(p.eps*p.k*p.k*(1+p.u*p.u)**1.5);assert.ok(Math.abs(oldWrongBs-p.Bs)>.01);
  for(const u of[.2,1,2,5]){const e=referenceGaussianEnvelope({lambda0:.75,u,length:8,samples:64});assert.equal(e.pass,true);assert.equal(e.proof.proofUsesFiniteSampling,false);assert.ok(e.gaussianConstant[0]>0);assert.equal(e.actualPulseComparisonCertified,false);assert.equal(e.actualPulseGaussianBound,null);assert.equal(e.rows[32].logP,0);assert.ok(e.rows[0].logP<0&&e.rows.at(-1).logP<0);for(const row of e.rows)assert.ok(row.logP<=row.gaussianLogUpper+1e-12);}
  assert.match(result.results.initialConditionRole,/not yet linked/);assert.equal(result.results.referenceEnvelope.actualPulseGaussianBound,null);
});

test('source-bound operator receipts replay and cannot elevate imported evidence or change exact labels',async()=>{
  const engine=createM2Engine({local:true});try{
    for(const request of[{kind:'ns.pulse-support',input:{}},{kind:'ns.background-moments',input:{n:2}}]){const s=await engine.submit(request),j=await engine.wait(s.id),bundle=await engine.exportBundle(j.id),r=await engine.replay(bundle);assert.equal(r.status,'MATCH');assert.equal(r.importedEvidenceTrusted,false);assert.equal(r.artifactBytesMatch,true);}
  }finally{engine.dispose();}
});
