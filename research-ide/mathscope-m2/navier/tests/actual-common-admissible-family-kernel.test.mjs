import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualInductionExpressions} from '../actual-residual-order-induction-expressions.mjs';
import {commonRecursiveSelector,assertActualCommonAdmissibleFamily,assertActualCommonAdmissibleBand} from '../actual-common-admissible-family.mjs';
import {weightedGaussianDerivativeRules,assertActualCommonTargetWeightedNorms,retainedOuterTargetFactorEvidence} from '../actual-common-target-weighted-norms.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {compileActualStressDirectionProgram} from '../actual-stress-direction-program.mjs';
import {copyInnerFactorProgram,innerActivationSourceIdentity} from '../actual-inner-flat-kernel.mjs';
import {copyOuterFactorProgram} from '../actual-outer-covariance-flat-extension.mjs';
import {ellOneSourceScalarIdentity} from '../actual-covariance-ell-one-obstruction.mjs';
import {compactCoefficientSourceFTC,assertActualCompactAllBandBackgroundNorms} from '../actual-compact-all-band-background-norms.mjs';
import {rectangularSourceFTC} from '../actual-background-physical-seminorms.mjs';

const fixture=()=>new ActualInductionExpressions(new ActualConvergentExpressions());
test('the common recurrence keeps the NEW predecessor, factor16 and all actual-style norm clauses',()=>{
  const G=fixture(),ellMinimum=G.q(100),historicalRows=[1,2,3].map(n=>({order:n,logScale:G.q(n),scale:G.exp(G.q(n))})),
    clauses=[1,2,3].map(n=>Array.from({length:n+1},(_,m)=>({kind:'fixture-only',derivativeOrder:m,bound:G.q(100+n+m)}))),
    p=commonRecursiveSelector(G,{historicalRows,clauses,ellMinimum});
  assert.equal(p.sourceAuthenticated,false);assert.equal(p.rows.length,3);
  assert.equal(p.rows[1].growth,G.add(p.rows[0].logScale,G.log(G.q(16))));
  assert.equal(p.rows[2].growth,G.add(p.rows[1].logScale,G.log(G.q(2))));
  assert.notEqual(p.rows[1].growth,G.add(historicalRows[0].logScale,G.log(G.q(16))));
  for(const r of p.rows){assert.equal(r.constraints.length,r.order+1);
    for(const c of r.constraints)assert.equal(c.requiredLog,G.div(G.add(G.mul(G.q(r.order),G.log(G.q(2))),G.log(c.bound)),G.mul(G.q(r.order),G.parameter('h'))));}
});
test('missing predecessors, missing clauses and forged private source flags are rejected',()=>{
  const G=fixture();assert.throws(()=>commonRecursiveSelector(G,{historicalRows:[{order:2,logScale:G.one}],clauses:[[]],ellMinimum:G.one}),{code:'INVALID_INPUT'});
  const forged={G,scope:{sameCommonAllOrderRecursiveSelectorDefined:true,actualOwnBandTwoSignH:true,actualSameSourceWeightedTargetJets:true}};
  for(const fn of [assertActualCommonAdmissibleFamily,assertActualCommonAdmissibleBand,assertActualCommonTargetWeightedNorms])assert.throws(()=>fn(forged),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
test('every Gaussian/Laurent derivative equals independent actual AD through order5',()=>{
  const G=fixture(),t=G.fresh('weighted_gaussian_test_distance'),a=G.q(7,3),gaussian=G.exp(G.neg(G.div(a,G.pow(t,2))));
  for(const initialPole of [0,3]){const p=weightedGaussianDerivativeRules(G,{a,initialPole,order:5});let direct=G.mul(gaussian,G.pow(t,-initialPole));
    for(const row of p.rows){const expected=G.mul(gaussian,G.add(...row.signed.map(r=>G.mul(r.coefficient,G.pow(t,r.power)))));
      assert.equal(sourceGraphRationalIdentity(G,G.sub(direct,expected),{atomicNodes:[gaussian],maxTerms:30000}).pass,true,initialPole+':'+row.order);
      assert.ok(row.signed.every(r=>r.power>=-row.pole&&r.power<=0));direct=G.derivative(direct,t);}
    const wrong=G.mul(gaussian,G.pow(t,-initialPole-1));
    assert.equal(sourceGraphRationalIdentity(G,G.sub(wrong,G.derivative(G.mul(gaussian,G.pow(t,-initialPole)),t)),{atomicNodes:[gaussian]}).pass,false);}
});
test('the exact log-to-X Stirling coefficients retain all lower derivatives',()=>{
  const G=fixture(),p=weightedGaussianDerivativeRules(G,{a:G.one,initialPole:3,order:6});
  assert.deepEqual(p.unsignedFirstStirling[3],['0','2','3','1']);
  assert.deepEqual(p.unsignedFirstStirling[5],['0','24','50','35','10','1']);
  assert.equal(p.rows[6].pole,21);assert.equal(p.mathematicalOrderCap,null);
  assert.throws(()=>weightedGaussianDerivativeRules(G,{a:G.one,initialPole:-1}),{code:'INVALID_INPUT'});
});
test('actual factor-copy and scalar-identity helpers are smoke tested before any full source run',()=>{
  const G=fixture(),p=compileActualStressDirectionProgram({derivativeOrder:0}),y=G.fresh('copy_smoke_y'),eta=G.fresh('copy_smoke_eta'),delta=G.fresh('copy_smoke_delta'),
    inner=copyInnerFactorProgram(G,p,y,eta),outer=copyOuterFactorProgram(G,p,delta,eta),
    identity=innerActivationSourceIdentity(G,{sourceActivation:inner.roots.innerFactor,y,width:G.parameter('t1'),kappa:G.parameter('kappa0')}),
    terminal=G.outer.stages.find(s=>s.id==='terminal'),Xb=G.mul(G.parameter('XR'),G.exp(terminal.end));
  assert.equal(identity.pass,true);assert.equal(ellOneSourceScalarIdentity(G,outer.roots.Xb,Xb).pass,true);
  assert.equal(inner.operations.includes('actual_natural_series'),true);assert.ok(outer.roots.gamma);
  const outerEvidence=retainedOuterTargetFactorEvidence(outer);assert.equal(typeof outer.copy,'function');
  assert.equal(Object.hasOwn(outerEvidence,'copy'),false);assert.deepEqual(outerEvidence.roots,outer.roots);
  assert.deepEqual(outerEvidence.pairs,outer.pairs);assert.deepEqual(outerEvidence.sourceKernels,outer.sourceKernels);
  assert.doesNotThrow(()=>canonicalStringify(G.pack({inner:inner.roots,outer:outer.roots},{factors:{inner,outer:outerEvidence}})));
  assert.throws(()=>canonicalStringify({factors:{outer}}),/unsupported JSON value/);
  const body=inner.roots.innerTheta,system=G.defineExpressionFunction({name:'ReversedFTCActualFactorSmoke',parameters:[y,eta],body,derivativeLimits:[3,3]}),
    reverse=G.fresh('copy_smoke_reverse'),width=G.div(G.parameter('t1'),G.q(4)),at=G.expressionValue(system,[G.sub(width,reverse),eta]),
    ftc=rectangularSourceFTC(G,{body:at,coordinates:[reverse,eta],lower:[G.zero,G.q(-1)],upper:[width,G.one]});
  assert.equal(G.materializeExpressionFunction(system,[y,eta]),body);assert.equal(ftc.faces.length,4);assert.equal(G.freeCoordinates(ftc.bound).size,0);
  assert.equal(ftc.sourceAuthenticated,false);assert.notEqual(ftc.faces[0].upperBound,G.zero);
});

test('compact C3 coefficient FTC shares the literal body and materializes every anchored face derivative',()=>{
  const G=fixture(),s=G.fresh('compact_s'),X=G.fresh('compact_X'),eta=G.fresh('compact_eta'),h=G.parameter('h'),
    coordinates=[s,X,eta],body=G.div(G.mul(G.exp(G.mul(h,G.log(s))),G.sqrt(G.mul(G.q(2),X)),G.add(G.one,G.pow(eta,3))),G.sub(G.one,G.mul(G.q(2),h,G.pow(eta,2)))),
    ftc=compactCoefficientSourceFTC(G,{body,coordinates,lower:[G.q(1,2),G.one,G.q(-1)],upper:[G.q(2),G.q(7),G.one],name:'CompactCoefficientExactFixture'});
  assert.equal(ftc.zeroOrderMaterialization,body);assert.equal(ftc.actualCoefficientRoot,body);
  assert.equal(G.expressionSystems[ftc.actualCoefficientSystem].body,body);assert.equal(ftc.faces.length,8);assert.equal(ftc.sourceAuthenticated,false);
  for(const face of ftc.faces){let actual=body;for(const x of face.selectedCoordinates)actual=G.derivative(actual,x);
    const node=G.nodes[face.derivative];assert.equal(node.op,'actual_expression_partial');
    assert.equal(G.materializeExpressionFunction(...node.args),actual,'face '+face.mask);
  }
  assert.equal(G.freeCoordinates(ftc.bound).size,0);
  assert.throws(()=>assertActualCompactAllBandBackgroundNorms({G,scope:{actualCompactCoefficientBodySharing:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const wrong=G.add(body,G.one);assert.notEqual(G.materializeExpressionFunction(ftc.actualCoefficientSystem,coordinates),wrong);
  const undeclared=G.fresh('undeclared_compact_coordinate');
  assert.throws(()=>compactCoefficientSourceFTC(G,{body:G.add(body,undeclared),coordinates,lower:ftc.lower,upper:ftc.upper}),{code:'INVALID_INPUT'});
});
