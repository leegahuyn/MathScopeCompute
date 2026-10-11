import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {rectangularSourceFTC} from '../actual-background-physical-seminorms.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {sourceAllOrderCutoffJets} from '../actual-residual-order-induction-kernels.mjs';
import {firstSelectorCartesianRadialBound,firstSelectorFTCUpperFaces,firstSelectorStressMajorants,firstSelectorFlatGaussianBounds,firstSelectorOuterHeatMajorant,firstSelectorTerminalBMajorant} from '../actual-common-first-selector-ftc-upper-bounds-kernel.mjs';
import {copyFirstSelectorPositiveBounds,firstSelectorMonotoneUpper,attachActualCommonFirstSelectorFTCUpperBounds,assertActualCommonFirstSelectorFTCUpperBounds,assertFirstSelectorArithmeticTraceUnchanged,projectActualCommonFirstSelectorFTCUpperBounds} from '../actual-common-first-selector-ftc-upper-bounds.mjs';

test('the exact quadratic Cartesian chain includes repeated and mixed derivative contractions',()=>{
  const G=new ActualConvergentExpressions(),x=G.fresh('first_ftc_x'),y=G.fresh('first_ftc_y'),X=G.div(G.add(G.pow(x,2),G.pow(y,2)),G.q(2)),f=G.pow(X,3),
    raw=G.derivative(G.derivative(G.derivative(f,x),x),y),
    value=G.simultaneousSubstitute(raw,[x,y],[G.q(2),G.q(2)]),
    bound=firstSelectorCartesianRadialBound(G,(r,k)=>{assert.equal(k,0);return [G.q(64),G.q(48),G.q(24),G.q(6)][r];},{xOrder:2,yOrder:1,radius:G.q(2)});
  assert.equal(sourceGraphRationalIdentity(G,G.sub(value,bound)).pass,true);
});

test('FTC face inequalities retain all side lengths and refuse a missing face',()=>{
  const G=new ActualConvergentExpressions(),x=G.fresh('first_ftc_axis'),eta=G.fresh('first_ftc_eta'),f=G.mul(x,eta),
    source=rectangularSourceFTC(G,{body:f,coordinates:[x,eta],lower:[G.zero,G.q(-1)],upper:[G.q(3),G.one]}),
    upper=firstSelectorFTCUpperFaces(G,source,o=>G.q(o[0]?1:3));
  assert.equal(upper.faces.length,4);assert.equal(upper.sourceAuthenticated,false);
  assert.deepEqual(upper.faces.map(f=>f.mask),[0,1,2,3]);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(upper.faces[3].volume,G.q(6))).pass,true);
  assert.throws(()=>firstSelectorFTCUpperFaces(G,{...source,faces:source.faces.slice(1)},()=>G.one),{code:'INVALID_INPUT'});
});

test('the first stress FTC consumes genuine fifth profile derivatives through radial viscosity',()=>{
  const G=new ActualSourceExpressions(),requests=[],positive={get(r,k){requests.push([r,k]);if(r+k>5)throw Error('unproved derivative');return G.q(3);}},leading={get:()=>G.q(5)},
    bounds=firstSelectorStressMajorants(G,{F0:leading,U0:leading,F1:positive,U1:positive,Pi1:positive,Xupper:G.q(8),Xlower:G.q(1,4),h:G.q(1,1024)});
  bounds.theta.get(3,1);bounds.z.get(2,2);
  assert.ok(requests.some(([r,k])=>r===4&&k===1));assert.ok(requests.some(([r,k])=>r===3&&k===2));
  assert.ok(requests.every(([r,k])=>r+k<=5));assert.equal(bounds.sourceAuthenticated,false);
});

test('flat and full Gamma terminal bounds retain endpoint poles and differentiated factor terms',()=>{
  const G=new ActualSourceExpressions(),flat=firstSelectorFlatGaussianBounds(5),step=sourceAllOrderCutoffJets({order:7}),
    outer=firstSelectorOuterHeatMajorant(G,{C:G.q(4),Xa:G.q(1,4),stepBounds:step.activation.ordinaryDerivativeBounds}),
    terminal=firstSelectorTerminalBMajorant(G,{C:G.q(4),rho:G.q(1,1024),stepBounds:step.activation.ordinaryDerivativeBounds});
  assert.deepEqual(flat.rows[1].polynomial,[[-3,'8']]);assert.ok(flat.rows[2].polynomial.some(([p,c])=>p===-4&&c==='-24'));
  assert.ok(terminal.get(2,1)>=0);assert.ok(terminal.get(1,2)>=0);assert.equal(outer.sourceAuthenticated,false);assert.equal(terminal.sourceAuthenticated,false);
  assert.throws(()=>terminal.get(2,2),{code:'RESOURCE_LIMIT'});assert.ok(terminal.proof.includes('f_second'));
});

test('new sibling arithmetic is copied by typed operands despite colliding integer IDs',()=>{
  const source=new ActualSourceExpressions(),target=new ActualSourceExpressions(),prefix=source.nodes.length;
  assert.equal(target.nodes.length,prefix);target.q(999);target.q(888);
  const base=source.q(7),power=source.pow(base,3),result=copyFirstSelectorPositiveBounds(source,target,prefix,{power});
  assert.notEqual(result.roots.power,power);assert.equal(target.nodes[result.roots.power].op,'integer_power');
  const row=result.rows.find(r=>r.operation==='integer_power');assert.deepEqual(row.children,[base]);assert.equal(row.integerMetadata,3);
  source.nodes[0]={op:'rational',args:['9','1']};
  assert.throws(()=>copyFirstSelectorPositiveBounds(source,target,prefix,{changed:0}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('a monotone comparison preserves the original formula and rejects inverse order reversal',()=>{
  const G=new ActualSourceExpressions(),s=G.var('original_ftc_face'),b=G.add(G.one,G.mul(G.q(3),s)),before=JSON.stringify(G.nodes[b]),
    lifted=firstSelectorMonotoneUpper(G,b,new Map([[s,G.q(10)]]));
  assert.equal(JSON.stringify(G.nodes[b]),before);assert.equal(lifted.originalRoot,b);assert.equal(lifted.changed,true);
  assert.equal(G.fraction(lifted.upperRoot)[0],31n);assert.deepEqual(lifted.usedFaceRoots,[s]);
  assert.throws(()=>firstSelectorMonotoneUpper(G,G.inv(s),new Map([[s,G.q(10)]])),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.equal(lifted.sourceAuthenticated,false);
});

test('caller records and booleans cannot authenticate first-selector source upper bounds',()=>{
  assert.throws(()=>attachActualCommonFirstSelectorFTCUpperBounds({}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualCommonFirstSelectorFTCUpperBounds({pass:true,sourceAuthenticated:true}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>projectActualCommonFirstSelectorFTCUpperBounds({pass:true,sourceAuthenticated:true}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('the actual consumed upper DAG rejects a changed new node beyond the predecessor prefix',()=>{
  const G=new ActualSourceExpressions(),x=G.var('upper_dag_scalar'),root=G.add(x,G.q(9)),trace={nodes:[{id:root,node:structuredClone(G.nodes[root])}]};
  assert.equal(assertFirstSelectorArithmeticTraceUnchanged(G,trace),true);
  const original=G.nodes[root];G.nodes[root]={op:'add',args:[x,G.q(1)]};
  assert.throws(()=>assertFirstSelectorArithmeticTraceUnchanged(G,trace),{code:'INVALID_SOURCE_CONSTRUCTION'});
  G.nodes[root]=original;assert.equal(assertFirstSelectorArithmeticTraceUnchanged(G,trace),true);
});
