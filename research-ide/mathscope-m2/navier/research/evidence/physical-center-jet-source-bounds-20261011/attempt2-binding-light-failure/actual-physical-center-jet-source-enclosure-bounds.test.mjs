import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {physicalCenterFactoredHeatSlopeBodies} from '../actual-physical-center-slow-slope-enclosure.mjs';
import {directedArithmetic} from '../actual-continuation-arithmetic.mjs';
import {physicalCenterCopiedOperandAudit,physicalCenterCompleteHeatFiveJetAudit,physicalCenterNumericalJetConditioning,
  bindActualPhysicalCenterFullJetSourceBounds} from '../actual-physical-center-jet-source-enclosure-bounds.mjs';

test('source binding rejects forged or mixed private predecessors before reading their graph',()=>{
  assert.throws(()=>bindActualPhysicalCenterFullJetSourceBounds({}, {}, {}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const p={G:{nodes:[]}},b={physicalCenter:p,G:{nodes:[]}},s={p,physicalCenter:p,G:p.G},t={p,G:p.G};
  assert.throws(()=>bindActualPhysicalCenterFullJetSourceBounds(b,s,t),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>bindActualPhysicalCenterFullJetSourceBounds(b,{...s,p:{}},t),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('copied operands reject appended sibling roots and changed bytes even at an equal integer ID',()=>{
  const G=new ActualConvergentExpressions(),x=G.fresh('copied_source_x'),original={nodes:structuredClone(G.nodes)},count=G.nodes.length;
  assert.equal(physicalCenterCopiedOperandAudit(G,original,count,[x]).sourceAuthenticated,false);
  const sibling=G.fresh('new_sibling_root');original.nodes.push(structuredClone(G.nodes[sibling]));
  assert.throws(()=>physicalCenterCopiedOperandAudit(G,original,count,[sibling]),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const changed={nodes:structuredClone(original.nodes)};changed.nodes[x].args=['changed_original_coordinate'];
  assert.throws(()=>physicalCenterCopiedOperandAudit(G,changed,count,[x]),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('the fifth complete heat derivative retains the full Gamma tail and falling-sign rising product',()=>{
  const G=new ActualConvergentExpressions(),h=G.parameter('h'),v=G.fresh('heat_original_compact_variable'),u=G.div(v,G.sub(G.one,v)),
    density=G.mul(G.exp(G.add(G.neg(u),G.mul(h,G.log(u)))),G.pow(G.sub(G.one,v),-2)),gamma=G.integral(density,v,G.zero,G.one),
    local=physicalCenterFactoredHeatSlopeBodies(G,{h,gamma,density,variable:v,u}),a=physicalCenterCompleteHeatFiveJetAudit(G,local);
  assert.equal(a.pass,true);assert.equal(a.sourceAuthenticated,false);assert.equal(a.rows.length,5);
  assert.equal(a.originalGamma,gamma);assert.equal(a.lower,G.zero);assert.equal(a.upper,G.one);
  assert.ok(a.rows.every(r=>r.identity.pass));
  const r=a.rows[4],expectedRising=G.mul(h,G.add(h,G.one),G.add(h,G.q(2)),G.add(h,G.q(3)),G.add(h,G.q(4)));
  assert.equal(r.rising,expectedRising);assert.equal(r.expected,G.neg(G.mul(expectedRising,r.integrand)));
  const altered={...local,roots:{...local.roots,body:G.add(local.roots.body,local.coordinates.z)}};
  assert.throws(()=>physicalCenterCompleteHeatFiveJetAudit(G,altered),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

const box=x=>({lower:x,upper:x});
test('directed centering conditions each actual column using its own independent center',()=>{
  // Distinct centers but exactly the same well-conditioned centered H.
  const values={centers:[box('3/8'),box('7/16')],weights:[box('16/9'),box('64/49')],
    covariance:[[box('9/32'),box('49/128')],[box('9/32'),box('-49/128')]]};
  const a=physicalCenterNumericalJetConditioning(values,256),A=directedArithmetic(256);
  assert.equal(a.pass,true);assert.equal(a.sourceAuthenticated,false);assert.ok(a.checks.every(c=>c.pass));
  assert.deepEqual(a.H.map(row=>row.map(x=>A.unpack(x))),[[A.unpack(box('2')),A.unpack(box('2'))],[A.unpack(box('2')),A.unpack(box('-2'))]]);
  assert.ok(a.Y.every(x=>A.unpack(x)[0]<=A.S/4n&&A.unpack(x)[1]>=A.S/4n));
});

test('conditioning rejects a singular second row and unseparated actual weights',()=>{
  const values={centers:[box('3/8'),box('3/8')],weights:[box('16/9'),box('16/9')],
    covariance:[[box('9/32'),box('9/32')],[box('9/32'),box('-9/32')]]};
  const singular=structuredClone(values);singular.covariance[1][1]=box('9/32');
  assert.throws(()=>physicalCenterNumericalJetConditioning(singular,256));
  const wide=structuredClone(values);wide.weights[0]={lower:'1/8',upper:'4'};
  assert.throws(()=>physicalCenterNumericalJetConditioning(wide,256),{code:'PRECISION_REQUIRED'});
});
