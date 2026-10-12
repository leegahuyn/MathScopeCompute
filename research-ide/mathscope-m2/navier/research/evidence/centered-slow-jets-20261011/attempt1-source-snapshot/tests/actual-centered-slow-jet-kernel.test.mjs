import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualPulseJetExpressions} from '../actual-pulse-jet-kernel.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {rational as Q,readRational,qcompare,qsub} from '../actual-continuation-arithmetic.mjs';
import {centeredNormalizedFullFrameAudit,centeredNormalizedFullFrame,centeredTerminalTargetPowerAudit} from '../actual-centered-slow-jet-source-bounds.mjs';
import {ActualCenteredSlowJetExpressions,terminalFiniteSlowFieldMajorant,terminalSlowMatrixPowerAudit,centeredSlowSlopeIdentityAudit,centeredRiccatiJetPowerAudit,centeredSlowJetErrorAudit,
  centeredSecondScalarJet,centeredSecondInverseSqrtAudit,centeredSecondProductAudit,defineCenteredFullSecondVariation,encloseCenteredSlowJetCoefficients} from '../actual-centered-slow-jet-enclosure-kernel.mjs';

const graph=()=>new ActualPulseJetExpressions(new ActualConvergentExpressions(),{maxNodes:3000000}),
  equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:60000}).pass,
  centerBoxes=[{lower:'1/2',upper:'1/2'},{lower:'1/2',upper:'1/2'}];

test('coordinate-set guards preserve bound integrals, shared bodies and Volterra jets without unrelated pair-cache entries',()=>{
  const G=new ActualCenteredSlowJetExpressions(new ActualConvergentExpressions()),R=G.fresh('cache_R'),Z=G.fresh('cache_Z'),v=G.fresh('cache_v'),
    body=G.mul(R,G.add(G.one,G.pow(v,2))),integral=G.integral(body,v,G.zero,G.one),shared=G.share(integral,[R,Z],'cache_actual_body'),
    system=G.defineCovarianceVolterra({name:'cache control',variable:v,parameters:[R,Z],matrix:[[R,Z],[G.one,R]],normUpper:G.q(4),length:G.one}),
    jet=defineCenteredFullSecondVariation(G,{name:'cache control second',originalSystem:system,directions:[R,Z]}),
    w=G.covarianceValue(system,0,v,[R,Z]),mixed=G.derivative(G.derivative(w,R),Z),roots=[integral,shared,w,mixed],
    beforeDependencies=G.dependencyCache?.size??0,beforeSubstitutions=G.substitutions.size;
  for(let j=0;j<256;j++){const unused=G.fresh('cache_unrelated_'+j);for(const root of roots){assert.equal(G.dependsOn(root,unused),false);assert.equal(G.substitute(root,unused,G.q(17)),root);assert.equal(G.derivative(root,unused),G.zero);}}
  assert.equal(G.dependencyCache?.size??0,beforeDependencies);assert.equal(G.substitutions.size,beforeSubstitutions);
  assert.equal(G.dependsOn(integral,v),false);assert.equal(G.dependsOn(w,v),true);assert.equal(G.dependsOn(shared,R),true);
  assert.ok(equal(G,G.substitute(integral,R,G.q(3)),G.integral(G.mul(G.q(3),G.add(G.one,G.pow(v,2))),v,G.zero,G.one)));
  assert.equal(G.substitute(body,body,G.q(7)),G.q(7));
  assert.equal(G.pulseJetSystems[jet.system].dimension,12);assert.equal(G.assertPulseJetCovariance(system).initial[0],G.one);
});

test('the entire pressure, basis connection and damping survive the time conversion in both signs',()=>{
  const G=graph(),r=centeredNormalizedFullFrameAudit(G);
  assert.equal(r.pass,true);assert.equal(r.checks.length,14);assert.ok(r.checks.every(c=>c.pass));
  assert.deepEqual(r.rows.map(x=>x.partChecks.length),[42,42]);
  for(const row of r.rows){
    assert.ok(row.partChecks.every(c=>c.pass));assert.equal(row.normalized.fullMovingPressureRetained,true);assert.equal(row.normalized.fullMovingBasisRetained,true);
    assert.ok(row.normalized.BPrime.flat().some(x=>x!==G.zero));assert.ok(row.normalized.nPrime.some(x=>x!==G.zero));
  }
  assert.ok(r.comparison.every(c=>c.check.pass&&c.normalSquareCheck.pass));
  assert.equal(r.sourceAuthenticated,false);assert.match(r.comparisonPolicy,/No actual source node is changed/);
  assert.throws(()=>centeredNormalizedFullFrame(G,{sign:0}),{code:'INVALID_INPUT'});
});

test('a complete comparison derivative detects an omitted original damping term and retains positive h',()=>{
  const r=centeredSlowSlopeIdentityAudit(graph());assert.equal(r.pass,true);assert.equal(r.checks.length,3);
  assert.ok(r.negativeControls.every(c=>c.correctlyRejected&&!c.check.pass));
  assert.match(r.exactHomogeneity,/\(1-2\*kappaU\)\*h/);assert.equal(r.actualMatrixReplacedByComparison,false);assert.equal(r.sourceAuthenticated,false);
});

test('finite field, original moving matrix, target integrals and whole-interval Riccati powers fit their explicit reserves',()=>{
  const field=terminalFiniteSlowFieldMajorant(),matrix=terminalSlowMatrixPowerAudit(),target=centeredTerminalTargetPowerAudit(),ratio=centeredRiccatiJetPowerAudit(),error=centeredSlowJetErrorAudit();
  assert.equal(field.rows.length,6);assert.equal(field.rows[5].ordinaryDerivativeUpper,'1178784498865381440');assert.ok(field.rows.every(c=>c.pass));
  assert.equal(field.allMixedCoefficientsCovered,true);assert.match(field.derivation.heat,/no improper tail is removed/);
  assert.equal(matrix.computedMaximumPower,3313);assert.equal(matrix.upperPower,3840);assert.match(matrix.conclusion,/M, D_i M, D_iD_j M/);
  assert.equal(target.maximumPower,248);assert.match(target.kernelProof,/1\/4,1\/16,1\/32/);assert.match(target.tauProof,/exp\(-64\)/);
  assert.equal(ratio.entireTimeInterval,true);assert.equal(ratio.centeredExpansionRestrictedToGaussianCore,false);assert.ok(ratio.checks.every(c=>c.pass));
  assert.equal(error.pass,true);assert.match(error.derivation.centeredLog,/ENTIRE/);assert.match(error.derivation.centeredLog,/outside the Gaussian core/);
  for(const name of ['originalPositiveCoreError','actualPolynomialTailUpper','completeIntegralJetError','propagatedWaveJetError'])assert.ok(qcompare(readRational(error.parameters[name],200000),Q(0))>0);
  for(const p of [field,matrix,target,ratio,error])assert.equal(p.sourceAuthenticated,false);
});

function inverseFixture(){
  const G=graph(),R=G.fresh('control_R'),Z=G.fresh('control_Z'),T=G.fresh('control_T'),directions=[R,Z,T],
    H=[[G.add(G.q(2),G.pow(R,2)),G.add(G.mul(R,Z),T)],[G.add(R,G.pow(T,2)),G.add(G.q(3),G.pow(Z,2))]],
    target=[G.add(G.one,G.pow(R,2),G.mul(Z,T)),G.add(G.q(2),G.mul(R,T))];
  return {G,R,Z,T,directions,H,target};
}

test('retained noncommuting H and nonconstant target give all20 inverse and18 positive-sqrt identities',()=>{
  const {G,R,Z,T,directions,H,target}=inverseFixture(),r=centeredSecondInverseSqrtAudit(G,{matrix:H,target,directions});
  assert.equal(r.indices.length,10);assert.equal(r.inverseChecks.length,20);assert.ok(r.inverseChecks.every(c=>c.pass&&c.bodyDerivativeBinding));
  assert.deepEqual(r.squareRoots.map(s=>s.checks.length),[9,9]);assert.ok(r.squareRoots.every(s=>s.pass&&s.bodyBinding.checks.every(c=>c.pass)));
  assert.ok(equal(G,G.add(G.mul(H[0][0],r.weights[0]),G.mul(H[0][1],r.weights[1])),target[0]));
  const mixedTarget=G.derivative(G.derivative(target[1],R),T);assert.equal(mixedTarget,G.one);
  assert.equal(equal(G,G.derivative(G.derivative(target[1],R),T),G.zero),false);
  const omitted=G.mul(G.q(2),G.derivative(r.squareRoots[0].sigma,R),G.derivative(r.squareRoots[0].sigma,Z));
  assert.equal(equal(G,omitted,G.zero),false);
  assert.equal(r.sourceAuthenticated,false);assert.equal(r.denominatorNonzeroRequired,true);assert.ok(r.squareRoots.every(s=>s.positiveWeightRequired));
  assert.throws(()=>centeredSecondInverseSqrtAudit(G,{matrix:[[G.one,G.one],[G.one,G.one]],target,directions}),{code:'SINGULAR_COVARIANCE'});
});

test('second weighted products materialize every direct AD root and reject an omitted repeated Leibniz term',()=>{
  const {G,R,Z,T,directions,H,target}=inverseFixture(),weights=centeredSecondInverseSqrtAudit(G,{matrix:H,target,directions}),
    factors=[weights.squareRoots[0].sigma,G.exp(G.mul(R,Z)),G.add(G.one,G.mul(R,T),G.pow(Z,2))],r=centeredSecondProductAudit(G,{factors,directions});
  assert.equal(r.roots.length,10);assert.ok(r.checks.every(c=>c.pass&&c.bodyDerivativeBinding));
  assert.deepEqual(r.roots,centeredSecondScalarJet(G,G.mul(...factors),directions).roots);
  const omitted=G.mul(G.q(2),G.derivative(factors[0],R),G.derivative(factors[1],R),factors[2]);
  assert.equal(equal(G,omitted,G.zero),false);assert.equal(r.sourceAuthenticated,false);
});

test('the original nonautonomous Volterra value is aliased to20 real variations with40 complete FTC bodies',()=>{
  const G=graph(),v=G.fresh('source_control_v'),R=G.fresh('source_control_R'),Z=G.fresh('source_control_Z'),T=G.fresh('source_control_T'),directions=[R,Z,T],
    M=[[G.add(G.mul(R,v),G.mul(Z,T)),G.add(G.one,G.mul(R,Z),G.pow(v,2))],[G.add(v,G.mul(R,T)),G.add(G.mul(R,Z,v),G.pow(T,2))]],
    system=G.defineCovarianceVolterra({name:'independent noncommuting control',variable:v,parameters:directions,matrix:M,normUpper:G.q(100),length:G.one}),
    original=structuredClone(G.covarianceSystems[system]),r=defineCenteredFullSecondVariation(G,{name:'full second control',originalSystem:system,directions}),
    s=G.pulseJetSystems[r.system],w=G.covarianceValue(system,0,v,directions);
  assert.equal(r.dimension,20);assert.equal(r.norms.length,10);assert.equal(r.norms.flatMap(n=>n.entries.flat()).length,40);
  assert.ok(r.norms.every(n=>n.entries.flat().every(e=>e.actualBodyBinding&&e.actualTimeDerivativeBinding)));
  assert.ok(r.timeNorm.entries.flat().every(e=>e.actualTimeDerivativeBinding));
  assert.deepEqual(G.covarianceSystems[system],original);assert.deepEqual(s.matrix,M);
  assert.equal(G.derivative(G.derivative(w,R),Z),G.pulseJetValue(r.system,s.secondBlocks[0][1],v,directions));
  assert.equal(G.derivative(G.derivative(w,T),T),G.pulseJetValue(r.system,s.secondBlocks[2][2],v,directions));
  const finite=G.pulseJetPartialSum(r.system,{terms:1}),firstOriginal=G.covariancePartialSum(system,{terms:1});
  for(const block of s.blocks){let expected=firstOriginal.values[0];for(let i=0;i<3;i++)for(let n=0;n<block.orders[i];n++)expected=G.derivative(expected,directions[i]);assert.ok(equal(G,finite.values[block.offset],expected));}
  assert.equal(r.sourceAuthenticated,false);assert.equal(r.FTCIntegralNumericallyEvaluated,false);assert.equal(r.exactOriginalValueAlias,true);
});

test('directed coefficients retain a nonzero mixed second derivative and a positive radius on every zero comparison',()=>{
  const p=encloseCenteredSlowJetCoefficients({weightedCenters:centerBoxes});assert.equal(p.pass,true);assert.equal(p.rows.length,18);
  for(const sign of [1,-1]){
    const rows=p.rows.filter(r=>r.sign===sign),rr=rows.find(r=>r.derivative==='RR'),rt=rows.find(r=>r.derivative==='RT'),tt=rows.find(r=>r.derivative==='TT');
    assert.ok(qcompare(readRational(rr.interval.lower),Q(-35,100))>0);assert.ok(qcompare(readRational(rr.interval.upper),Q(-34,100))<0);
    assert.ok(qcompare(readRational(rt.interval.lower),Q(4,10n**26n))>0);assert.ok(qcompare(readRational(rt.interval.upper),Q(5,10n**26n))<0);
    assert.ok(qcompare(readRational(tt.interval.upper),Q(0))<0);
    for(const row of rows){assert.ok(qcompare(readRational(row.width),Q(0))>0);assert.equal(row.nonzeroRemainderRetained,true);assert.equal(row.toleranceMet,true);}
    for(const row of rows.filter(r=>['R','Z','T','RZ','ZZ','ZT'].includes(r.derivative))){assert.ok(qcompare(readRational(row.interval.lower),Q(0))<0);assert.ok(qcompare(readRational(row.interval.upper),Q(0))>0);}
  }
  assert.equal(p.actualPositiveFactors.actualPositiveHReplacedByZero,false);assert.equal(p.arithmetic.binary64UsedForDecisions,false);
  assert.equal(p.sourceAuthenticated,false);assert.equal(p.actualFullCurlNumericalEnclosure,false);assert.equal(p.wholeGNUMComplete,false);
});

test('higher directed precision narrows the same signed second coefficients without discarding the analytic radius',()=>{
  const a=encloseCenteredSlowJetCoefficients({weightedCenters:centerBoxes}),b=encloseCenteredSlowJetCoefficients({precisionBits:256,tolerance:'1/1000000000000000000000000000000000000000000',weightedCenters:centerBoxes});
  for(const pair of ['RR','RT','TT']){
    const x=a.rows.find(r=>r.sign===1&&r.derivative===pair),y=b.rows.find(r=>r.sign===1&&r.derivative===pair);
    assert.ok(qcompare(readRational(y.interval.lower),readRational(x.interval.lower))>0);assert.ok(qcompare(readRational(y.interval.upper),readRational(x.interval.upper))<0);
  }
  assert.ok(qcompare(readRational(b.errorBudget.originalPositiveWaveJetRadius,200000),Q(0))>0);
});

test('invalid source assertions, decimal controls, zero weights and insufficient requested precision are rejected',()=>{
  for(const change of [{sourceAuthenticated:true},{precisionBits:53},{precisionBits:192.5},{tolerance:1e-12},{tolerance:'0'},{tolerance:'-1'},{tolerance:'1'},
    {weightedCenters:[{lower:'0',upper:'1/2'},centerBoxes[1]]}])assert.throws(()=>encloseCenteredSlowJetCoefficients({weightedCenters:centerBoxes,...change}),{code:'INVALID_INPUT'});
  assert.throws(()=>encloseCenteredSlowJetCoefficients({precisionBits:192,tolerance:'1/'+(10n**80n).toString(),weightedCenters:centerBoxes}),{code:'PRECISION_REQUIRED'});
});
