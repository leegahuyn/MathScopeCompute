import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {originalIterationDecayRecipe,verifyOriginalIterationDecay,originalPhysicalIterationLosses,
  originalIterationDependencyProgram,originalIterationDecayProgram} from '../source-iteration-decay.mjs';
import {rational as q,readRational as read,qadd,qsub,qmul,qcompare,qtext}
  from '../../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';

const evalAffine=(a,x)=>qadd(read(a.constant),qmul(read(a.slope),x));

if(process.env.MATHSCOPE_ITERATION_DECAY_ARTIFACT){
  const artifact={schema:'MathScope.N6.ExactIterationDegreeAlgebraArtifact/1',
    decay:verifyOriginalIterationDecay(originalIterationDecayRecipe()),
    physical:Array.from({length:17},(_,order)=>originalPhysicalIterationLosses({order})),
    dependency:originalIterationDependencyProgram({stageCount:3,order:2,maxWork:100000}),
    sourceClassPremisesDischarged:false,actualInitialClassConstructed:false,allFiniteActualFieldsConstructed:false,completeN6:false};
  writeFileSync(process.env.MATHSCOPE_ITERATION_DECAY_ARTIFACT,JSON.stringify(artifact,null,2)+'\n');
}

test('the exact all-stage proof retains the original initial orders and strictly positive gains',()=>{
  const p=verifyOriginalIterationDecay(originalIterationDecayRecipe());
  assert.equal(p.allNonnegativeStagesByAffineInduction,true);
  assert.deepEqual(p.originalInitialOrders,{B0:'7/10',C0Star:'6/5'});
  assert.equal(p.sigma.constant,'1/5');assert.equal(p.sigma.slope,'1/10');
  assert.ok(p.checks.length>=40);
  for(const r of p.checks){
    assert.equal(r.pass,true);assert.ok(qcompare(read(r.margin.slope),q(0))>=0);
    assert.ok(qcompare(read(r.margin.constant),q(0))>=(r.strict?1:0));
    for(const j of [0n,1n,13n,1n<<70n]){
      const left=evalAffine(r.left,q(j)),right=evalAffine(r.right,q(j)),margin=evalAffine(r.margin,q(j));
      assert.equal(qtext(qsub(left,right)),qtext(margin));
    }
  }
  assert.equal(p.sourceClassPremisesDischarged,false);assert.equal(p.noBackgroundFlatResidualDropped,true);
});

test('removing a forced pressure, old-wave, or complete updated mean term is rejected before exponent comparison',()=>{
  for(const change of [r=>r.forcedErrors.splice(1,1),r=>r.pressure.fullUpdatedFields=false,
    r=>r.signedCovariance.pop(),r=>r.flatRemainders.base='0',r=>r.temporalErrors.pop(),
    r=>r.operatorOrder.reverse(),r=>r.kappa='0',r=>r.gain='1/5']){
    const recipe=originalIterationDecayRecipe();change(recipe);
    assert.throws(()=>verifyOriginalIterationDecay(recipe),{code:'INVALID_ITERATION_PROOF'});
  }
});

test('the paper physical losses are independent of the stage and dominate both endpoints of the original h interval',()=>{
  for(const m of [0,1,2,7,23]){
    const p=originalPhysicalIterationLosses({order:m});assert.equal(p.commonQPowerLossIndependentOfStage,true);
    assert.equal(p.constantsAndLogPowersMayDependOnStage,true);assert.equal(p.logPowersSetToZero,false);
    for(const h of [q(0),q(1,16),q(1,1n<<100n)]){
      const A=qadd(q(1,2),h),st=qadd(q(1),qmul(q(3,2),h));
      assert.equal(qtext(evalAffine(p.ell,h)),qtext(qadd(qmul(q(2),A),qmul(q(m+1),st))));
      assert.equal(qtext(evalAffine(p.K,h)),qtext(qadd(qadd(qmul(q(2),A),q(1,2)),qmul(q(m+2),st))));
      for(const c of p.checks)assert.ok(qcompare(evalAffine(c.left,h),evalAffine(c.right,h))>=0);
    }
  }
});

test('the finite dependency DAG retains newly computed pressure and current defects at every mean operation',()=>{
  const p=originalIterationDependencyProgram({stageCount:3,order:2,maxWork:100000});
  // Check the actual acyclic references rather than trusting a completion flag.
  const nodes=p.nodes??p.graph?.nodes;assert.ok(Array.isArray(nodes));
  const seen=new Set();
  for(const n of nodes){for(const edge of n.inputs)assert.ok(seen.has(edge.input));assert.ok(!seen.has(n.id));seen.add(n.id);}
  assert.ok(nodes.some(n=>n.id.includes('new-defects')));
  assert.ok(nodes.some(n=>n.operation==='fixed-zero-mean-torus-inverse'&&n.inputs.some(e=>e.additionalDerivatives===4)));
  assert.ok(nodes.some(n=>n.operation==='fixed-supported-radial-inverse'));
  assert.ok(nodes.some(n=>n.operation==='full-quadratic-mean-and-two-derivatives'));
});

test('finite order and stage requests cannot imply unexecuted source-class authority',()=>{
  const p=originalIterationDecayProgram({stageCount:2,order:1,maxWork:100000});
  assert.equal(p.sourceAuthenticated,false);
  assert.throws(()=>originalIterationDecayProgram({stageCount:2,order:1,complete:true}));
  assert.throws(()=>originalIterationDependencyProgram({stageCount:1000,order:1000,maxWork:1}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>originalPhysicalIterationLosses({order:-1}),{code:'RESOURCE_LIMIT'});
});
