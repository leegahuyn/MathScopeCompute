import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {originalSourceRadialPhase,assertOriginalSourceTorusMap} from '../source-radial-phase-exponent.mjs';
import {exactInversePhysicalTorusCenter} from '../actual-physical-center-kernel.mjs';

test('the original palette floor yields the full kappa gain, and the omitted factor loses half',()=>{
  const G=new ActualConvergentExpressions(),s=originalSourceRadialPhase(G),
    logQ=G.fresh('radial_gain_log_Q'),logS=G.fresh('radial_gain_log_S'),theta=G.fresh('radial_gain_floor_error'),
    logLambda=G.log(s.Lambda),logTg=G.log(s.Tg),
    index=G.sub(G.div(G.sub(G.neg(G.mul(G.add(G.one,s.h),logQ)),logS),logTg),theta),
    logMultiplier=dr=>G.add(G.mul(index,logLambda),G.mul(G.div(dr,G.q(2)),logQ)),
    originalBound=G.sub(G.sub(G.neg(G.mul(theta,logLambda)),G.mul(s.kappa,s.h,logQ)),G.mul(s.rho,logS)),
    oldDr=G.sub(G.mul(G.q(2),G.add(G.one,s.h),s.rho),G.mul(s.h,s.kappa)),
    oldDefect=G.mul(G.q(1,2),s.h,s.kappa,logQ),
    identity=x=>sourceGraphRationalIdentity(G,x,{maxTerms:10000});
  assert.equal(identity(G.sub(logMultiplier(s.dr),originalBound)).pass,true);
  assert.equal(identity(G.sub(logMultiplier(oldDr),originalBound)).pass,false);
  assert.equal(identity(G.sub(G.sub(logMultiplier(oldDr),originalBound),oldDefect)).pass,true);
});

test('the original equation binding and inverse consume the same literal radial root',()=>{
  const G=new ActualConvergentExpressions(),s=originalSourceRadialPhase(G),
    binding=assertOriginalSourceTorusMap(G,{h:s.h,Tg:s.Tg,physicalMap:s}),sqrt2=G.sqrt(G.q(2)),
    inverse=exactInversePhysicalTorusCenter(G,{Q:G.q(1,16),Lambda:s.Lambda,Tg:s.Tg,paletteIndex:G.q(3),dr:s.dr,
      Dgeom:G.sub(G.q(4),G.mul(G.q(2),sqrt2)),
      basis:[[G.one,G.sub(G.one,sqrt2)],[G.sub(sqrt2,G.one),G.one]],
      center:[G.q(1,1048576),G.zero],anchorYi:[G.q(11,3),G.q(7,2)]});
  assert.equal(inverse.input.dr,binding.roots.actualDr);
  assert.equal(binding.comparison.allSixExpectedBodiesMatched,true);
  assert.equal(binding.parameterBindings.strictPositiveSourceRetained,true);
  assert.equal(inverse.physicalSourceMembershipProvedHere,false);
  assert.equal(binding.scope.fullPhysicalGraphExecutionProved,false);
  assert.deepEqual(JSON.parse(JSON.stringify(binding)),binding);
});
