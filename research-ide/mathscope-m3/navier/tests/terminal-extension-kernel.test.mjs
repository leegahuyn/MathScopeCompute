import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {originalTerminalCutoffMajorants,terminalCutoffProductRule,differentiatedTerminalCutoffConstant,
  exactTerminalExtensionSchedule,differentiatedTerminalExtensionTail,terminalExtensionJoiningIdentity} from '../terminal-extension-kernel.mjs';

const fixtureNorms=Array.from({length:13},(_,j)=>({j,norms:Array.from({length:Math.floor(j/2)+1},(_,a)=>
  ({a,bound:String((BigInt(j)+1n)**BigInt(a+1))+'/'+String(a+1)}))}));
const hugeNorms=Array.from({length:5},(_,j)=>({j,norms:Array.from({length:Math.floor(j/2)+1},(_,a)=>
  ({a,bound:j===4&&a===2?'1'+'0'.repeat(160):'1'}))}));
const artifact={schema:'MathScope.N7.TerminalExtensionKernelObservedArtifact/1',
  cutoff:originalTerminalCutoffMajorants(16),schedule:exactTerminalExtensionSchedule({norms:fixtureNorms}),
  hugeSchedule:exactTerminalExtensionSchedule({norms:hugeNorms}),
  productRules:Array.from({length:10},(_,j)=>Array.from({length:10},(_,m)=>terminalCutoffProductRule(j,m))).flat(),
  joining:Array.from({length:17},(_,m)=>terminalExtensionJoiningIdentity(m)),
  tails:[{spatialOrder:2,timeOrder:3,firstOmittedOrder:4},{spatialOrder:0,timeOrder:0,firstOmittedOrder:0},
    {spatialOrder:4,timeOrder:2,firstOmittedOrder:16}].map(differentiatedTerminalExtensionTail),
  originalSourceNormsInvented:false,sourceAuthenticated:false,globalTerminalForceConstructed:false,
  originalN704Complete:false,originalN705Complete:false,wholeM3Complete:false};

test('the actual flat cutoff recipe has a positive full denominator and exact derivative majorants',()=>{
  const b=artifact.cutoff;
  assert.equal(b.recipe.chi0,'chi(s)*chi(-s)');assert.equal(b.recipe.support,'[-1,1]');
  assert.deepEqual(b.rows.slice(0,3).map(r=>r.phiDerivativeUpper),['1','2','36']);
  assert.deepEqual(b.rows[2].phiPolynomial,['0','0','0','-2','1']);
  assert.equal(b.rows[0].chi0DerivativeUpper,'1');assert.equal(b.rows[1].chi0DerivativeUpper,'1368');
  assert.match(b.induction.denominatorLower,/1\/9/);assert.equal(b.sourceFieldNormsConstructed,false);
});

test('every surviving cutoff derivative and factorial is retained for j smaller and larger than m',()=>{
  assert.deepEqual(terminalCutoffProductRule(0,3).terms,[{cutoffDerivative:3,coefficient:'1',bPower:3,sigmaPower:0}]);
  assert.deepEqual(terminalCutoffProductRule(3,2).terms,[
    {cutoffDerivative:0,coefficient:'1',bPower:0,sigmaPower:1},
    {cutoffDerivative:1,coefficient:'1',bPower:1,sigmaPower:2},
    {cutoffDerivative:2,coefficient:'1/6',bPower:2,sigmaPower:3}]);
  assert.equal(differentiatedTerminalCutoffConstant(2,1).value,'685');
  for(const p of artifact.productRules)for(const t of p.terms)assert.equal(t.bPower-t.sigmaPower,p.supportPower);
});

test('all separate mixed derivative constraints determine the minimal increasing integer schedule',()=>{
  const s=artifact.schedule;assert.equal(s.rows[0].b,'1');
  for(const r of s.rows){
    const d=Math.floor(r.j/2),expected=r.j===0?0:(d+1)*(d+2)/2;
    assert.equal(r.checks.length,expected);assert.equal(r.requiredPairCount,expected);
    assert.equal(r.minimality.pass,true);assert.ok(r.checks.every(c=>c.pass));
    if(r.j)assert.ok(BigInt(r.b)>BigInt(s.rows[r.j-1].b));
  }
  assert.equal(s.suppliedNormsAreExplicitPremises,true);assert.equal(s.sourceNormsAuthenticated,false);
  assert.equal(s.globalTerminalJetsAuthenticated,false);assert.equal(s.allOrderCompletion,false);
});

test('large spatial derivative norms cannot be dropped or rounded into a machine-number cutoff',()=>{
  const altered=structuredClone(hugeNorms);altered[4].norms[2].bound='1';
  const small=exactTerminalExtensionSchedule({norms:altered}),large=artifact.hugeSchedule;
  assert.ok(BigInt(large.rows[4].b)>10n**30n);assert.ok(BigInt(large.rows[4].b)>BigInt(small.rows[4].b));
  assert.equal(large.rows[4].checks.find(x=>x.a===2&&x.m===0).jetNormUpper,'1'+'0'.repeat(160));
  assert.equal(large.rows[4].minimality.pass,true);
});

test('missing, duplicate, nonfinite or forged norm positions are rejected before an extension is claimed',()=>{
  for(const mutate of [n=>n[4].norms.pop(),n=>n[4].norms.push(n[4].norms[0]),n=>n[2].norms[0].bound=Infinity,
    n=>n[2].norms[0].bound='-1',n=>n[2].norms[0].bound='1/0',n=>n[2].j=8]){
    const bad=structuredClone(fixtureNorms);mutate(bad);assert.throws(()=>exactTerminalExtensionSchedule({norms:bad}));
  }
  assert.throws(()=>originalTerminalCutoffMajorants(65),{code:'RESOURCE_LIMIT'});
});

test('differentiated tails retain finite exceptions and the all-future source obligations',()=>{
  assert.deepEqual(artifact.tails[0].finiteExceptionalOrders,[4,5,6,7,8,9]);
  assert.equal(artifact.tails[0].geometricTailUpper,'1/512');
  assert.deepEqual(artifact.tails[1].finiteExceptionalOrders,[0]);
  for(const tail of artifact.tails){assert.equal(tail.everyFutureSourceNormAndCutoffConstraintRequired,true);
    assert.equal(tail.infiniteConvergenceEstablishedByFiniteData,false);}
});

test('Taylor jets match exactly at zero while compatibility with the actual left-hand force remains explicit',()=>{
  for(const j of [...artifact.joining,terminalExtensionJoiningIdentity(64)]){
    assert.ok(j.rows.every(x=>x.pass));assert.equal(j.allOrderSourceCompatibilityConstructed,false);
    assert.equal(j.velocityExtendedPastOne,false);assert.match(j.leftHandDependency,/10\.6/);
  }
  if(process.env.MATHSCOPE_N7_EXTENSION_ARTIFACT)writeFileSync(process.env.MATHSCOPE_N7_EXTENSION_ARTIFACT,JSON.stringify(artifact,null,2)+'\n');
});
