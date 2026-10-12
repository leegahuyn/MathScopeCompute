import test from 'node:test';
import assert from 'node:assert/strict';
import {compileActualOuterAxialProgram} from '../actual-global-source-outer.mjs';
import {numericalExponentialArithmetic} from '../actual-numerical-exponential-arithmetic.mjs';
import {evaluateClosedArithmeticDefinitions} from '../actual-closed-parameter-arithmetic.mjs';
import {originalA13IntegralSourceAudit,assertOriginalA13IntegralSourceAudit,encloseRepresentedOriginalA13Integrals} from '../actual-original-a13-numerical-enclosure.mjs';

const original=compileActualOuterAxialProgram({etaDerivativeOrder:0});
const input=()=>({nodes:original.nodes.map((node,id)=>({id,node:structuredClone(node)})),
  rootNames:{A13SteepIntegral:239,A13FlattenIntegral:257,A13TerminalIntegral:275,
    Qb:original.roots.Qb,Qp:original.roots.Qp,terminalWait:original.roots.terminalWait},
  profileDefinitions:structuredClone(original.parametersExactExpressions)});

test('complete original three A.13 integrals and integrating-factor Qb/Qp/wait are bound literally',()=>{
  const source=input(),before=JSON.stringify(source),a=originalA13IntegralSourceAudit(source);
  assert.equal(a.checks.length,10);assert.ok(a.checks.every(x=>x.pass));
  assert.equal(a.sourceClosure.complete,true);assert.ok(a.sourceClosure.nodeCount>30);
  assert.equal(a.sourceAuthenticated,false);assert.equal(a.parentGraphAuthenticationRequired,true);
  assert.equal(a.sourceGraphRewritten,false);assert.equal(JSON.stringify(source),before);
  assert.equal(assertOriginalA13IntegralSourceAudit(a),true);
});

test('strictly positive original h produces three closed numerical integral intervals without a zero substitution',()=>{
  const N=numericalExponentialArithmetic(),p=evaluateClosedArithmeticDefinitions(original.parametersExactExpressions,N,{names:['h']}),
    a=originalA13IntegralSourceAudit(input()),r=encloseRepresentedOriginalA13Integrals(a,N,p.values);
  assert.deepEqual(r.rows[0].numericalInterval,{lower:{rational:'1/4'},upper:{rational:'3'}});
  assert.deepEqual(r.rows[1].numericalInterval,{lower:{rational:'1/4'},upper:{rational:'3/2'}});
  assert.equal(r.rows[2].root,original.roots.Qp);
  assert.equal(N.compareEndpoints(r.rows[2].numericalInterval.lower,{rational:'0'}),1);
  assert.equal(r.sourceAuthenticated,false);assert.equal(r.zeroSubstitutionUsed,false);
  assert.ok(r.rows.every(x=>x.originalIntegralValueRelativeToleranceGuaranteed===false));
  const wrong=new Map(p.values);wrong.set('h',N.point('1/8192'));
  assert.throws(()=>encloseRepresentedOriginalA13Integrals(a,N,wrong),/original positive h/);
  wrong.set('h',N.zero());assert.throws(()=>encloseRepresentedOriginalA13Integrals(a,N,wrong),/original positive h/);
});

test('missing body, omitted original derivative/factor, moved endpoint and changed profile are rejected',()=>{
  const missing=input();missing.nodes=missing.nodes.filter(x=>x.id!==238);
  assert.throws(()=>originalA13IntegralSourceAudit(missing),/absent/);
  const primitive=input();primitive.nodes.find(x=>x.id===239).node.args[0]=1;
  assert.throws(()=>originalA13IntegralSourceAudit(primitive),/identity failed/);
  const terminal=input();terminal.nodes.find(x=>x.id===275).node.args[3]=1;
  assert.throws(()=>originalA13IntegralSourceAudit(terminal),/identity failed/);
  const changed=input();changed.profileDefinitions.h={integer:0};
  assert.throws(()=>originalA13IntegralSourceAudit(changed),/pinned parameter/);
  const missingQb=input();missingQb.nodes=missingQb.nodes.filter(x=>x.id!==original.roots.Qb);
  assert.throws(()=>originalA13IntegralSourceAudit(missingQb),/absent/);
  const opaque=input();opaque.nodes.find(x=>x.id===238).node={op:'caller_opaque_integrand',args:[]};
  assert.throws(()=>originalA13IntegralSourceAudit(opaque),/opaque body/);
});

test('a forged pass flag, cloned private audit, or mutation cannot issue represented source bounds',()=>{
  const N=numericalExponentialArithmetic(),p=evaluateClosedArithmeticDefinitions(original.parametersExactExpressions,N,{names:['h']}),
    a=originalA13IntegralSourceAudit(input());
  assert.throws(()=>encloseRepresentedOriginalA13Integrals({pass:true,representedIntegralBoundsProved:true},N,p.values),/private audit/);
  assert.throws(()=>assertOriginalA13IntegralSourceAudit(structuredClone(a)),/private audit/);
  a.integrals[0].body=1;
  assert.throws(()=>encloseRepresentedOriginalA13Integrals(a,N,p.values),/private audit/);
});
