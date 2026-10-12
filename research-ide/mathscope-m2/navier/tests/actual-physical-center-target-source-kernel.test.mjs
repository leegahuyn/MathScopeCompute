import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualInductionExpressions} from '../actual-residual-order-induction-expressions.mjs';
import {compileActualStressDirectionProgram} from '../actual-stress-direction-program.mjs';
import {copyOuterFactorProgram} from '../actual-outer-covariance-flat-extension.mjs';
import {physicalTargetEndpointScheduleAudit,physicalTargetOuterScaleBindingAudit,
  attachActualPhysicalCenterTargetEnclosure,assertActualPhysicalCenterTargetEnclosure} from '../actual-physical-center-target-enclosure.mjs';

const fixture=()=>new ActualInductionExpressions(new ActualConvergentExpressions());

test('all twelve original endpoint increments retain their source step arguments',()=>{
  const G=fixture(),a=physicalTargetEndpointScheduleAudit(G),Tf=G.parameter('Tf');
  assert.equal(a.pass,true);assert.equal(a.rows.length,12);assert.ok(a.rows.every(r=>r.pass));
  assert.equal(a.retainedInterpolationStep,G.step(G.div(Tf,Tf)));
  assert.notEqual(a.retainedInterpolationStep,a.retainedSigmaOne,'The two equivalent but different original nodes are retained.');
  assert.equal(a.interpolationArgumentIdentity.pass,true);assert.equal(a.sourceAuthenticated,false);
});

test('a changed original endpoint or omitted terminal log factor cannot pass the endpoint audit',()=>{
  const G=fixture(),row=G.outer.stages.find(r=>r.id==='interpolation'),old=row.logAEnd;
  row.logAEnd=G.add(old,G.one);assert.equal(physicalTargetEndpointScheduleAudit(G).pass,false);row.logAEnd=old;
  const terminal=G.outer.stages.at(-1),original=terminal.logAEnd;
  terminal.logAEnd=G.add(terminal.logAStart,G.neg(G.mul(G.add(G.q(1,2),G.parameter('h')),G.q(3))));
  assert.equal(physicalTargetEndpointScheduleAudit(G).pass,false);terminal.logAEnd=original;
  const start=row.logAStart;row.logAStart=G.add(start,G.one);row.logAEnd=G.add(old,G.one);
  assert.equal(physicalTargetEndpointScheduleAudit(G).pass,false,'Matching increments alone do not authenticate a broken endpoint chain.');
  row.logAStart=start;row.logAEnd=old;
  assert.equal(physicalTargetEndpointScheduleAudit(G).pass,true);
});

test('the independent outer source copy binds Xb, EpowB, rho and both original quarter Laplace kernels',()=>{
  const G=fixture(),program=compileActualStressDirectionProgram({derivativeOrder:0}),delta=G.fresh('target_fixture_delta'),eta=G.fresh('target_fixture_eta'),
    outer=copyOuterFactorProgram(G,program,delta,eta),a=physicalTargetOuterScaleBindingAudit(G,outer);
  assert.equal(a.pass,true);assert.equal(a.sourceAuthenticated,false);assert.equal(a.checks.length,3);assert.equal(a.kernels.length,2);
  assert.ok(a.checks.every(r=>r.pass));assert.ok(a.kernels.every(r=>r.m===-3));
  const actual=G.simultaneousSubstitute(outer.roots.outerTheta,[delta,eta],[G.q(1,4),G.zero]);
  assert.equal(G.freeCoordinates(actual).size,0);assert.notEqual(actual,G.zero);
  const original=outer.roots.EpowB;outer.roots.EpowB=G.add(original,G.one);
  assert.equal(physicalTargetOuterScaleBindingAudit(G,outer).pass,false);outer.roots.EpowB=original;
  const kernel=a.kernels[0],m=kernel.m;kernel.m=-2;
  assert.equal(physicalTargetOuterScaleBindingAudit(G,outer).pass,false);kernel.m=m;
  assert.equal(physicalTargetOuterScaleBindingAudit(G,outer).pass,true);
});

test('a small source fixture or copied success flags cannot mint the private new physical target certificate',async()=>{
  const forged={G:fixture(),scope:{sameActualPhysicalCenter:true,actualTargetRegularCoefficientNumericallyEnclosed:true},checks:[{pass:true}]};
  assert.throws(()=>assertActualPhysicalCenterTargetEnclosure(forged),{code:'INVALID_SOURCE_CONSTRUCTION'});
  await assert.rejects(attachActualPhysicalCenterTargetEnclosure(forged),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>physicalTargetOuterScaleBindingAudit(forged.G,{}),{code:'INVALID_INPUT'});
});
