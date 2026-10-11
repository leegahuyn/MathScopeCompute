import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../actual-continuation-exact-functions.mjs';
import {ActualInnerCovarianceExpressions} from '../../../actual-inner-covariance-flat-extension.mjs';
import {compileActualStressDirectionProgram} from '../../../actual-stress-direction-program.mjs';
import {copyInnerFactorProgram,innerActivationSourceIdentity} from '../../../actual-inner-flat-kernel.mjs';
import {sourceGraphRationalIdentity} from '../../../actual-continuation-exact-identities.mjs';

test('every newly used source test helper runs on the same exact copied activation fixture',()=>{
  const G=new ActualInnerCovarianceExpressions(new ActualConvergentExpressions());
  const width=G.parameter('t1');G.inv(width);
  const y=G.fresh('source_helper_smoke_y'),eta=G.fresh('source_helper_smoke_eta');
  const sourceActivation=copyInnerFactorProgram(G,compileActualStressDirectionProgram({derivativeOrder:0}),y,eta).roots.innerFactor;
  const activation=innerActivationSourceIdentity(G,{sourceActivation,y,width,kappa:G.parameter('kappa0')});
  const f={sourceActivation,normalizedDistance:G.div(y,width),squareSeedIdentity:{sourceFactorExactOriginalStepIdentity:activation,actualOriginalStep:activation.originalStep}};
  assert.equal(activation.sourceActivation,f.sourceActivation);
  assert.equal(activation.expected,G.mul(G.sub(G.one,G.parameter('kappa0')),G.step(G.div(y,G.parameter('t1')))));
  assert.equal(sourceGraphRationalIdentity(G,G.sub(activation.argument,f.normalizedDistance)).pass,true);
  assert.equal(activation.sameOriginalStepAndDerivativeOrder,true);assert.equal(activation.congruenceProved,true);
  assert.equal(activation.coefficientIdentity.pass,true);assert.equal(activation.normalizedIdentity.pass,true);
  assert.equal(f.squareSeedIdentity.sourceFactorExactOriginalStepIdentity.pass,true);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(f.sourceActivation,f.squareSeedIdentity.actualOriginalStep),{atomicNodes:[f.squareSeedIdentity.actualOriginalStep]}).pass,false);
});
