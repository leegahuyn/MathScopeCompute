// One authentic source construction. Run separately from other source
// workers; this intentionally never builds several slow coordinates at once.
import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareActualCovarianceSensitivityProgram,assertActualCovarianceSensitivityProgram} from '../actual-covariance-sensitivity.mjs';
import {attachActualCovarianceTarget} from '../actual-covariance-source-target.mjs';
import {assertActualPulseSensitivityProgram} from '../actual-pulse-sensitivity.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

const started=performance.now(),prepared=prepareActualCovarianceSensitivityProgram({ellExact:'1',slowCoordinate:'R',derivativeOrder:1,terms:0}),{G,operator}=prepared;

test('the R derivative is attached to both original theta,z,mass integrals with all Haar and cutoff factors',()=>{
  assert.equal(assertActualCovarianceSensitivityProgram(prepared),true);
  assert.equal(assertActualPulseSensitivityProgram(prepared.pulse),true);
  assert.ok(prepared.checks.every(c=>c.pass));assert.equal(prepared.rows.length,2);
  for(const row of prepared.rows){
    const family=operator.families.find(f=>f.sign===row.sign);
    assert.equal(row.exact.factor,operator.geometry.haarFactor);assert.equal(row.exact.cutoff,operator.cutoffs.psi);
    assert.deepEqual(row.exact.amplitude,family.t);
    assert.equal(row.exact.factorDerivative,G.zero);assert.equal(row.exact.cutoffDerivative,G.zero);
    assert.equal(row.exact.leftDerivative,G.zero);assert.equal(row.exact.rightDerivative,G.zero);
    for(const integral of row.exact.rows){
      assert.equal(integral.original,family.covariance[integral.component]);
      assert.notEqual(integral.derivative,G.zero);
      assert.ok(integral.productCheck.pass&&integral.leibnizCheck.pass);
    }
  }
});

test('the original source first-variation norms give nonzero convergent covariance-derivative tails, including P squared',()=>{
  for(const row of prepared.rows){
    const f=operator.families.find(x=>x.sign===row.sign),tail=row.tail;
    assert.notEqual(tail.absoluteError,G.zero);assert.notEqual(tail.factorialTail,G.zero);
    assert.equal(tail.sourceDerived,true);assert.equal(tail.suppliedConstants,false);assert.equal(tail.errorTendsToZero,true);
    const expected=G.integral(G.mul(G.pow(operator.cutoffs.psi,2),G.pow(f.P,2)),operator.coordinates.v,G.zero,operator.geometry.Ls);
    assert.equal(tail.envelopeSquaredIntegral,expected);
    assert.equal(G.derivative(tail.envelopeSquaredIntegral,operator.coordinates.R),G.zero);
    assert.equal(row.finiteTerms,0);assert.ok(row.finiteDerivativeChecks.every(x=>x.pass));
    assert.equal(tail.numericalWholeIntegralEnclosure,false);
  }
});

test('the source target matches the existing full target builder after alpha-renaming only',()=>{
  // Existing target builder uses operator.G, which has an identical shared
  // prefix but a distinct extension. Compare the new target to that builder,
  // treating the authenticated common prefix as atoms. The only ignored
  // differences are shared-function labels and dummy integration names.
  const oldG=operator.G,commonCount=oldG.nodes.length,reference=attachActualCovarianceTarget(operator);
  const canonical=(graph,root)=>{
    const memo=new Map();
    function signature(id,bound=new Map()){
      if(bound.has(id))return ['bound',bound.get(id)];
      if(id<commonCount)return ['authenticated-common-source',id];
      const key=id+':'+JSON.stringify([...bound]);if(memo.has(key))return memo.get(key);
      const {op,args}=graph.nodes[id];let result;
      if(op==='rational'||op==='source_parameter')result=[op,...args];
      else if(op==='coordinate')result=[op,args[0]];
      else if(op==='definite_integral'){
        const next=new Map(bound);next.set(args[1],bound.size);
        result=[op,signature(args[0],next),signature(args[2],bound),signature(args[3],bound)];
      }else if(op==='actual_expression_partial'){
        const system=graph.expressionSystems[args[0]];
        result=[op,system.parameters,signature(system.body,bound),args[1].map(x=>signature(x,bound)),args[2]];
      }else if(['integer_power','source_step_derivative'].includes(op))result=[op,signature(args[0],bound),args[1]];
      else result=[op,...args.map(x=>signature(x,bound))];
      memo.set(key,result);return result;
    }
    return JSON.stringify(signature(root));
  };
  assert.equal(canonical(G,prepared.target.components[0]),canonical(oldG,reference.targetChart.components[0]));
  assert.equal(canonical(G,prepared.target.components[1]),canonical(oldG,reference.targetChart.components[1]));
  assert.equal(prepared.target.bothShearTermsRetained,true);
  assert.equal(assertActualCovarianceSensitivityProgram(prepared),true);
});

test('the actual inverse derivative retains Ha*y and never asserts ell=1 invertibility or positive square roots',()=>{
  const inverse=prepared.inverse;
  assert.ok([...inverse.valueChecks,...inverse.derivativeChecks,...inverse.directChecks].every(x=>x.pass));
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){
    assert.equal(sourceGraphRationalIdentity(G,G.sub(inverse.matrixDerivative[i][j],prepared.rows[j].exact.rows[i].derivative)).pass,true);
  }
  assert.equal(prepared.domain.exercisedMember.certifiedBandMembership,false);
  assert.equal(prepared.domain.exercisedMember.determinantNonzeroCertified,false);
  assert.equal(prepared.domain.exercisedMember.positiveWeightsCertified,false);
  assert.equal(prepared.scope.squareRootWeightsConstructed,false);
  assert.equal(prepared.scope.actualSourceFullCurlComplete,false);
  assert.equal(prepared.scope.fullPhysicalResidualAndFlatErrorPackageComplete,false);
  assert.equal(prepared.scope.newLeanKernelProof,false);
});

test('source derivative, scope and appended node mutations are rejected without altering the original source',()=>{
  const entry=prepared.inverse.matrixDerivative[0][0];prepared.inverse.matrixDerivative[0][0]=G.zero;
  assert.throws(()=>assertActualCovarianceSensitivityProgram(prepared),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');prepared.inverse.matrixDerivative[0][0]=entry;
  prepared.scope.positiveWeightsOfExercisedMemberCertified=true;
  assert.throws(()=>assertActualCovarianceSensitivityProgram(prepared),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');prepared.scope.positiveWeightsOfExercisedMemberCertified=false;
  const root=prepared.roots.weightDerivativePlus,old=G.nodes[root];G.nodes[root]={op:'rational',args:['0','1']};
  assert.throws(()=>assertActualCovarianceSensitivityProgram(prepared),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');G.nodes[root]=old;
  assert.equal(assertActualCovarianceSensitivityProgram(prepared),true);
  console.log(JSON.stringify({schema:'MathScope.ActualCovarianceSensitivityExecuted/1',elapsedMs:performance.now()-started,nodeCount:G.nodes.length,
    maxRSSKiB:process.resourceUsage().maxRSS,checks:prepared.checks.length,coordinate:'R',ellExact:'1',pass:true,scope:prepared.scope}));
});
