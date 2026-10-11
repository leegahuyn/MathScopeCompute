import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {readRational,rational as Q,qcompare,qsub,directedArithmetic} from '../actual-continuation-arithmetic.mjs';
import {centeredPulseNumericalRequest,encloseGaussianWholeMass,centeredGaussianErrorAudit,centeredColumnScalingAudit,centeredReferenceGaussianBinding,encloseCenteredPulseCoefficients} from '../actual-centered-pulse-enclosure-kernel.mjs';

const within=(x,lo,hi)=>qcompare(readRational(x.lower),readRational(lo))>=0&&qcompare(readRational(x.upper),readRational(hi))<=0;
function fixture(sign=1){
  const G=new ActualConvergentExpressions(),v=G.fresh('center_v'),L=G.fresh('center_L'),u=G.fresh('center_u'),lambda0=G.fresh('center_lambda0'),
    s=G.mul(G.q(sign),u,G.add(G.q(1,2),G.div(v,L))),r0=G.sqrt(G.add(G.one,G.pow(u,2))),root=G.sqrt(G.add(G.one,G.pow(s,2))),
    input={variable:v,length:L,u,lambda0,lambda:G.div(lambda0,root),dref:G.div(G.mul(lambda0,G.add(G.one,G.pow(s,2))),G.pow(r0,3)),sign};
  return {G,input};
}

test('Machin signed-series remainder and exact square root give a directed Gaussian whole mass',()=>{
  const p=encloseGaussianWholeMass({precisionBits:192});assert.equal(p.pass,true);assert.equal(p.sourceAuthenticated,false);
  assert.equal(p.proof.tanDouble,'5/12');assert.equal(p.proof.tanQuadruple,'120/119');assert.equal(p.proof.tanDifference,'1');
  assert.ok(p.proof.series.every(x=>x.terms>0&&qcompare(readRational(x.nextTerm),Q(0))>0));
  assert.ok(within(p.pi,'3141592653589793238462643383279502884197/1000000000000000000000000000000000000000','3141592653589793238462643383279502884198/1000000000000000000000000000000000000000'));
  assert.ok(within(p.mass,'1772453850905516027298167483341145182797/1000000000000000000000000000000000000000','1772453850905516027298167483341145182798/1000000000000000000000000000000000000000'));
  assert.ok(qcompare(qsub(readRational(p.mass.upper),readRational(p.mass.lower)),Q(1,1n<<160n))<0);
});

test('higher directed precision narrows the same exact Gaussian without using external decimals',()=>{
  const coarse=encloseGaussianWholeMass({precisionBits:96}),fine=encloseGaussianWholeMass({precisionBits:256});
  assert.ok(qcompare(readRational(fine.mass.lower),readRational(coarse.mass.lower))>0);
  assert.ok(qcompare(readRational(fine.mass.upper),readRational(coarse.mass.upper))<0);
  assert.equal(fine.arithmetic.binary64UsedForDecisions,false);
});

test('the full signed reference lambda and damping determine the center curvature in both families',()=>{
  for(const sign of [1,-1]){
    const {G,input}=fixture(sign),p=centeredReferenceGaussianBinding(G,input);
    assert.equal(p.pass,true);assert.equal(p.checks.length,5);assert.ok(p.checks.every(x=>x.pass));
    assert.notEqual(p.roots.rho,G.zero);assert.notEqual(p.roots.derivative,G.zero);assert.notEqual(p.roots.g,G.zero);
    assert.equal(p.roots.derivative,G.derivative(G.sub(input.lambda,input.dref),input.variable));
    assert.equal(p.positiveSquareRootRule.argumentIdentity.pass,true);
    assert.ok(!sourceGraphRationalIdentity(G,p.roots.rhoAtCenter).pass,'the rational helper must not silently assert a positive sqrt identity');
  }
});

test('omitting actual damping or supplying a pulse-dependent frozen scale is rejected',()=>{
  const {G,input}=fixture();assert.throws(()=>centeredReferenceGaussianBinding(G,{...input,dref:G.zero}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>centeredReferenceGaussianBinding(G,{...input,sign:0}),{code:'INVALID_INPUT'});
  assert.throws(()=>centeredReferenceGaussianBinding(G,{...input,curvature:G.one}),{code:'INVALID_INPUT'});
  const z={...input,lambda0:input.variable},s=G.mul(z.u,G.add(G.q(1,2),G.div(z.variable,z.length))),root=G.sqrt(G.add(G.one,G.pow(s,2))),r0=G.sqrt(G.add(G.one,G.pow(z.u,2)));
  z.lambda=G.div(z.lambda0,root);z.dref=G.div(G.mul(z.lambda0,G.add(G.one,G.pow(s,2))),G.pow(r0,3));
  assert.throws(()=>centeredReferenceGaussianBinding(G,z),{code:'INVALID_INPUT'});
});

test('the real Gaussian core, original plateau and two omitted tails fit positive exact budgets',()=>{
  const p=centeredGaussianErrorAudit();assert.equal(p.pass,true);assert.ok(p.rows.every(x=>x.pass));
  assert.equal(p.parameters.centralRadius,64);assert.equal(p.parameters.scalePower,1024);
  for(const name of ['coreAbsoluteUpper','actualOmittedTailUpper','referenceOmittedTailUpper','completeMassRadius','componentAndMatrixRadius'])assert.ok(qcompare(readRational(p.parameters[name],200000),Q(0))>0);
  assert.equal(p.actualSourceAuthenticated,false);assert.match(p.method.center,/neither/);assert.match(p.method.scalarGrowth,/3\*B\^256\/S/);
});

test('different actual center scales cancel quadratically and linear column scaling is a negative control',()=>{
  const p=centeredColumnScalingAudit({H:[['4','9'],['4','-9']],target:['2','0'],centerScales:['2','3']});
  assert.equal(p.pass,true);assert.equal(p.positiveWeights,true);assert.deepEqual(p.weights,['1/4','1/9']);assert.deepEqual(p.normalizedWeights,['1','1']);
  assert.equal(p.incorrectLinearColumnScaleRejected,true);assert.equal(p.sourceAuthenticated,false);
  assert.throws(()=>centeredColumnScalingAudit({H:[['4','9'],['4','-9']],target:['2','0'],centerScales:['-2','3']}),{code:'INVALID_INPUT'});
  assert.throws(()=>centeredColumnScalingAudit({H:[['1','2'],['2','4']],target:['1','1'],centerScales:['2','3']}),{code:'INVALID_INPUT'});
});

test('whole cutoff, Gaussian and inverse propagation give nontrivial signed normalized wave intervals',()=>{
  const p=encloseCenteredPulseCoefficients();assert.equal(p.pass,true);assert.equal(p.rows.length,14);assert.ok(p.rows.every(r=>r.toleranceMet));
  assert.ok(within(p.values.normalizedMass,'2015/1000','2016/1000'));
  assert.ok(p.values.normalizedInverseWeight.every(r=>within(r,'248/1000','249/1000')));
  assert.ok(p.values.normalizedWeightedAmplitude.every(r=>within(r,'498/1000','499/1000')));
  assert.ok(qcompare(readRational(p.values.normalizedCovarianceZ[0].lower),Q(0))>0);
  assert.ok(qcompare(readRational(p.values.normalizedCovarianceZ[1].upper),Q(0))<0);
  assert.ok(qcompare(readRational(p.stability.normalizedDeterminant.lower),Q(19,10))>0);
  assert.equal(p.errorBudget.positiveTinyRemaindersRetained,true);assert.equal(p.errorBudget.outwardNonlinearPropagation,true);
  assert.equal(p.sigmaIntegral.sourceAuthenticated,false);assert.equal(p.sourceAuthenticated,false);assert.equal(p.wholeGNUMComplete,false);
  assert.ok(qcompare(readRational(p.errorBudget.cutoffRequestedWidth),Q(1,128000000000000n))===0);
});

test('rounded input bounds, unsupported precisions, forged source flags and exhausted quadrature are never accepted',()=>{
  for(const input of [{tolerance:1e-12},{precisionBits:53},{precisionBits:192.5},{maxCutoffCells:7},{sourceAuthenticated:true},{tolerance:'0'},{tolerance:'1/10'}])
    assert.throws(()=>centeredPulseNumericalRequest(input),{code:'INVALID_INPUT'});
  assert.throws(()=>centeredPulseNumericalRequest({precisionBits:96,tolerance:'1/1000000000000000000000000000000'}),{code:'PRECISION_REQUIRED'});
  assert.throws(()=>encloseCenteredPulseCoefficients({maxCutoffCells:4}),{code:'RESOURCE_LIMIT'});
  const A=directedArithmetic(96);assert.throws(()=>A.sqrt(A.point(-1)),{code:'PRECISION_REQUIRED'});assert.throws(()=>A.div(A.one(),[-1n,1n]),{code:'PRECISION_REQUIRED'});
  assert.deepEqual(A.small(8192),[0n,1n]);
});
