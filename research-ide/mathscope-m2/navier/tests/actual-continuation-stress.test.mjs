import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareActualFullLeadingProgram,actualHeatI2ContractionProof} from '../actual-continuation-exact-heat.mjs';
import {prepareActualOrderOneStressProgram} from '../actual-continuation-exact-stress.mjs';
import {actualHeatExteriorIdentity,sourceGraphPolynomialIdentity} from '../actual-continuation-exact-identities.mjs';
import {assertActualFirstOrderCompleted} from '../actual-continuation-exact-order-one.mjs';
import {evaluateSourceProgramDiagnostic as ev} from '../actual-global-source-expressions.mjs';

const full=prepareActualOrderOneStressProgram({terms:0,heatIterations:0}),{G,program:p,orderOne:r,actualHeat:heat}=full,{X,eta}=full.constants,H=heat.heat;
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);

test('the I2 source consumes the three complete actual heat debts and its unique continuous root',()=>{
  assert.equal(p.heat.tailTruncated,false);
  assert.deepEqual(p.I2.rhs,H.rhs);
  assert.equal(p.I2.meanUpperBoundUsedAsDebt,false);
  assert.equal(p.I2.finiteIterateDeclaredRoot,false);
  assert.equal(p.quadraticSystems[H.system].preconditionerIsExactContinuousInverse,true);
  assert.ok(Object.values(actualHeatI2ContractionProof().checks).every(Boolean));
  for(const id of H.values)assert.equal(G.nodes[id].op,'actual_quadratic_root');
  for(const id of [H.heatI,H.heatS,H.heatCp])assert.notEqual(id,G.zero);
  assert.equal(p.scope.actualOrderOneNumericStressValuesEnclosed,false);
});

test('all actual outer stage entry branches retain their function and one-sided jets at the shared join',()=>{
  const yy=G.fresh('join_coordinate');
  for(const stage of H.stageFields){
    const wrapper=G.substitute(stage.entryBranch,H.outerLogCoordinate,yy),f=G.substitute(stage.value,H.outerLogCoordinate,yy);
    assert.equal(G.substitute(wrapper,yy,stage.start),G.substitute(f,yy,stage.start),stage.id+' value');
    assert.equal(G.substitute(G.derivative(wrapper,yy),yy,stage.start),G.substitute(G.derivative(f,yy),yy,stage.start),stage.id+' derivative');
  }
  const first=G.substitute(H.outerE,H.outerLogCoordinate,H.stageFields[0].end);
  assert.notEqual(first,G.zero,'The first exact shared endpoint previously returned zero.');
});

test('eleven original stage joins agree in value and log-radius derivative in an independent finite diagnostic',()=>{
  // These substitutions only test the implemented formulas. The exact
  // same-source join proof is sigma(1-t)=1-sigma(t), integral sigma=1/2,
  // flat endpoint jets and angular bumps supported strictly inside a stage.
  const overrides={T:1,BOuter:1,lambda:.2,h:.001,Pstar:2,logP:Math.log(2),XR:10,Tf:2,co:.05,Md:Math.log(3)},yy=G.fresh('finite_join_coordinate');
  for(let j=0;j<H.stageFields.length-1;j++){
    const left=H.stageFields[j],right=H.stageFields[j+1],f=G.substitute(left.value,H.outerLogCoordinate,yy),g=G.substitute(right.value,H.outerLogCoordinate,yy);
    const le=G.substitute(f,yy,left.end),re=G.substitute(g,yy,right.start),ld=G.div(G.substitute(G.derivative(f,yy),yy,left.end),le),rd=G.div(G.substitute(G.derivative(g,yy),yy,right.start),re),pp=G.pack({le,re,ld,rd});
    for(const e of [0,1/3]){
      const at=name=>ev(pp,name,{coordinates:{eta:e},parameterOverrides:overrides,quadratureCells:64,maxOperations:4000000});
      const a=at('le'),b=at('re');assert.ok(a.value>0&&b.value>0);near(a.value/b.value,1,2e-9);near(at('ld').value,at('rd').value,2e-9);
      assert.equal(a.sameProfileCertificate,false);assert.equal(a.intervalCertified,false);
    }
  }
});

test('the actual Pi1 graph itself has the nonzero source axis slope, with exact constant-integral reduction',()=>{
  const actual=G.substitute(G.derivative(r.Pi1,X),X,G.zero),expected=G.substitute(G.mul(G.q(-1,2),full.inner.omegaOverX),X,G.zero);
  assert.notEqual(actual,G.zero);
  assert.equal(sourceGraphPolynomialIdentity(G,G.sub(actual,expected)).pass,true);
  const dropped=sourceGraphPolynomialIdentity(G,G.neg(expected));assert.equal(dropped.pass,false);
});

test('the streamfunction and F0F1 keep their higher analytic axis jets',()=>{
  const Ux=G.substitute(G.derivative(r.U1,X),X,G.zero),Mxx=G.substitute(G.derivative(G.derivative(r.M1,X),X),X,G.zero);
  assert.notEqual(Ux,G.zero);assert.equal(sourceGraphPolynomialIdentity(G,G.sub(Mxx,Ux)).pass,true);
  const productX=G.substitute(G.derivative(r.F0F1,X),X,G.zero),expected=G.mul(G.substitute(full.inner.F0,X,G.zero),G.substitute(G.derivative(r.F1,X),X,G.zero));
  assert.equal(sourceGraphPolynomialIdentity(G,G.sub(productX,expected)).pass,true);
});

test('actual heat exterior keeps H and its derivative, and the missing eta chain term is rejected',()=>{
  const identity=full.stress.exteriorIdentity;
  assert.equal(identity.pass,true);assert.equal(identity.check.remainingMonomials,0);assert.equal(identity.heatFunctionAndDerivativeKeptSymbolic,true);
  assert.equal(identity.negativeControl.correctlyRejected,true);assert.ok(identity.negativeControl.check.remainingMonomials>0);
  assert.equal(G.derivative(H.exteriorAmplitude,eta),G.zero);
  assert.equal(p.heat.exterior.arbitraryHeatFunctionReplacedByConstant,false);
  assert.throws(()=>actualHeatExteriorIdentity(G,{X,eta,argument:H.heatArgument,amplitude:G.mul(H.exteriorAmplitude,eta),exponent:H.exteriorExponent}));
});

test('signed stress primitives use the actual repaired functions and separate order-one component supports',()=>{
  assert.deepEqual(p.support.orderOneComponents,{theta:[r.Xminus,r.Xb],z:[r.Xminus,r.Xplus]});
  assert.equal(G.substitute(full.stress.Ttheta,X,r.Xb),G.zero);assert.equal(G.substitute(full.stress.Tz,X,r.Xplus),G.zero);
  assert.ok(Object.values(full.stress.sourceAssertions).every(Boolean));
  assert.equal(p.orderOneStress.conservativeCancellation.totalValuesAreAnalyticIdentitiesNotQuadratureResults,true);
  assert.equal(p.orderOneStress.totalResidualIntegrals.length,2);
  assert.equal(p.scope.originalN404Complete,false);
  assert.equal(p.support.laterOrderSupportImplementationPending,true);
  assert.equal(assertActualFirstOrderCompleted(full.completedOrderOne).nextOrder,2);
  assert.throws(()=>assertActualFirstOrderCompleted(full),/before requesting order two/);
});

test('full heat and stress inputs reject caller replacement debts and completion flags',()=>{
  assert.throws(()=>prepareActualFullLeadingProgram({heatI:'0'}));
  assert.throws(()=>prepareActualOrderOneStressProgram({momentsComplete:true}));
  assert.throws(()=>prepareActualOrderOneStressProgram({heatIterations:13}));
});
