import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {allFiniteResidualLedger,originalCutoffStreamContinuityIdentity,originalBackgroundFlatnessArithmetic,physicalStressGeometryMajorants} from '../actual-background-residual-flatness-kernel.mjs';
import {assertActualFiniteGlobalResidual} from '../actual-global-finite-residual.mjs';
import {originalCartesianCylindricalMomentumIdentity,originalProfileMomentumScalingIdentity} from '../actual-background-residual-flatness-cartesian.mjs';

test('independent Cartesian momentum retains centrifugal, basis connection and cylindrical stress factors',()=>{
  const r=originalCartesianCylindricalMomentumIdentity();assert.equal(r.pass,true);assert.equal(r.checks.length,3);
  assert.ok(r.checks.every(c=>c.pass));assert.equal(r.circle.pass,true);assert.ok(r.connections.every(c=>c.pass));
  assert.ok(Object.values(r.negativeControls).every(c=>!c.pass));assert.equal(r.allFieldsIndependent,true);assert.equal(r.sourceAuthenticated,false);
});

test('indeterminate original source scaling keeps every radial half and both axial viscosity shifts',()=>{
  const r=originalProfileMomentumScalingIdentity();assert.equal(r.pass,true);
  assert.equal(Object.keys(r.checks).length,8);assert.equal(Object.keys(r.chartChecks).length,6);
  assert.ok([...Object.values(r.checks),...Object.values(r.chartChecks),...Object.values(r.exponentChecks)].every(c=>c.pass));
  assert.ok(Object.values(r.negativeControls).every(c=>!c.pass));assert.equal(r.allOriginalHalfAndConnectionFactorsRetained,true);
});

test('every ordered finite product and shifted radial product occurs once through arbitrary N=17',()=>{
  const N=17,p=allFiniteResidualLedger({truncationOrder:N}),ordinary=new Set(),radial=new Set();
  for(const r of p.rows){
    for(const [i,j]of r.orderedPairs){assert.equal(i+j,r.order);ordinary.add(i+':'+j);}
    for(const [i,j]of r.omega?.orderedPairs??[]){assert.equal(i+j+1,r.order);radial.add(i+':'+j);}
  }
  assert.equal(ordinary.size,(N+1)**2);assert.equal(radial.size,(N+1)**2);
  for(let i=0;i<=N;i++)for(let j=0;j<=N;j++){assert.ok(ordinary.has(i+':'+j));assert.ok(radial.has(i+':'+j));}
  assert.equal(p.rows[N+1].tangentialAxialViscosity,N);assert.equal(p.rows[N+2].omega.axialViscosity,N);
  assert.equal(p.mathematicalTruncationOrderCap,null);assert.equal(p.sourceAuthenticated,false);
});

test('the original radial cutoff commutator is necessary and both source defects remain explicit',()=>{
  const r=originalCutoffStreamContinuityIdentity();assert.equal(r.check.pass,true);
  assert.deepEqual(Object.keys(r.negativeControls),['omittedRadialCommutator','unprovedMassPrimitive','unprovedSourceContinuity']);
  for(const c of Object.values(r.negativeControls))assert.equal(c.pass,false);
  assert.equal(r.sourceContinuityOrMassAuthenticated,false);
});

test('exact positive h and the ceiling comparison index handle m=17 and arbitrary requested decay',()=>{
  const G=new ActualConvergentExpressions(),r=originalBackgroundFlatnessArithmetic(G,{derivativeOrder:17,decayOrder:31});
  assert.equal(r.marginCheck.pass,true);assert.equal(r.requiredTupleDerivativeOrder,19);
  assert.equal(r.positiveHRequired,true);assert.equal(r.hReplacedByZero,false);
  assert.equal(G.nodes[r.comparisonOrder].op,'maximum');
  assert.ok(G.nodes.some(n=>n.op==='ceiling'));assert.equal(r.genericMomentumDifference.pass,true);
  assert.equal(r.genericMomentumDifference.omittedQuadratic.pass,false);
});

test('stress geometry retains every coefficient and a complete unrestricted derivative recurrence',()=>{
  const G=new ActualConvergentExpressions(),r=physicalStressGeometryMajorants(G,{derivativeOrder:17,sourceXminus:G.parameter('Xa')});
  assert.equal(r.rows.length,18);assert.deepEqual(r.initialCoefficientSums,{degreeZero:'6',degreeOne:'5'});
  assert.deepEqual(r.rows.slice(0,3).map(v=>[v.degreeZeroCoefficient,v.degreeOneCoefficient]),[['6','5'],['30','22'],['252','190']]);
  assert.ok(r.rows.every(row=>G.freeCoordinates(row.bound).size===0));
  assert.equal(r.mathematicalDerivativeOrderCap,null);assert.equal(r.sourceAuthenticated,false);
  assert.throws(()=>physicalStressGeometryMajorants(G,{derivativeOrder:17,sourceXminus:G.parameter('Xa'),maxWork:1}),{code:'RESOURCE_LIMIT'});
});

test('resource failure and generic algebra cannot manufacture an actual global source residual',()=>{
  assert.throws(()=>allFiniteResidualLedger({truncationOrder:17,maxPairs:5}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>allFiniteResidualLedger({truncationOrder:0}),{code:'INVALID_INPUT'});
  assert.throws(()=>assertActualFiniteGlobalResidual({ledger:allFiniteResidualLedger(),scope:{actualFullFiniteResidualCoefficientCancellation:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
