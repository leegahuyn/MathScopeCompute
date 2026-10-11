import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {prepareActualOrderInduction} from '../actual-residual-order-induction-source.mjs';
import {attachActualBackgroundPhysicalSeminorms,assertActualBackgroundPhysicalSeminorms,actualBackgroundPhysicalSeminormCertificate,
  attachActualPhysicalCutoffSelector,assertActualPhysicalCutoffSelector} from '../actual-background-physical-seminorms.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

let prepared,norms,selector;
const source=()=>prepared??=prepareActualOrderInduction({order:2,maxNodes:1500000,maxDerivativeOrder:128});
const actual=()=>norms??=attachActualBackgroundPhysicalSeminorms(source(),{throughOrder:2,derivativeOrder:2});

test('actual source physical seminorms include both completed orders and the entire Cartesian axis',()=>{
  const r=actual(),G=r.G;
  assert.equal(assertActualBackgroundPhysicalSeminorms(r),true);
  assert.equal(r.rows.length,2);assert.equal(r.rows[0].components.length,12);
  assert(r.rows.every(row=>row.bounds.length===3&&row.radialCutoffCommutatorIncluded&&row.cartesianAxisRepresentativeUsed));
  assert.equal(r.domain.cartesianBoxProfileRange[0],G.zero);
  assert.equal(r.domain.cartesianBoxProfileRange[1],G.mul(G.q(2),source().bootstrap.orderOne.Xb));
  for(const row of r.rows)for(const bound of row.bounds)assert.equal(G.freeCoordinates(bound).size,0);
  assert.equal(r.scope.numericalSeminormEvaluation,false);
});

test('the source exponent loss is independent of n and includes every physical tuple component',()=>{
  const r=actual(),G=r.G,{A}=G.core,h=G.parameter('h');
  for(const row of r.rows){
    assert.equal(row.components.find(x=>x.name==='potential_x1').baseLoss,h);
    assert.equal(row.components.find(x=>x.name==='pressure').baseLoss,G.mul(G.q(2),A));
    assert.equal(row.components.find(x=>x.name==='extra_stream_x1').cutoff,'extra');
    assert.equal(row.components.find(x=>x.name==='extra_stream_x2').baseLoss,G.q(1,2));
    assert.equal(row.exponentGain,G.mul(G.q(2*row.order),h));
    row.physicalLosses.forEach((value,m)=>assert.equal(sourceGraphRationalIdentity(G,G.sub(value,G.add(G.mul(G.q(2),A),G.q(m)))).pass,true));
  }
  assert.deepEqual(r.rows[0].physicalLosses,r.rows[1].physicalLosses);
});

test('actual FTC constants retain all eight faces and remain finite source expressions',()=>{
  const r=actual(),G=r.G;
  assert(r.ftcRows.length>0);
  for(const row of r.ftcRows){
    assert.equal(row.faces.length,8);assert.equal(row.sourceAuthenticated,false);
    assert.equal(row.finiteExactIntegral,true);assert.equal(G.freeCoordinates(row.bound).size,0);
  }
  assert.equal(r.scope.actualSourceAnalyticLeanTheorem,false);
});

test('higher stress uses its authenticated original interior support, with n=1 boundary work excluded',()=>{
  const r=actual(),G=r.G;
  assert.equal(r.supportOrder.pass,true);assert(Object.values(r.supportOrder.expressionChecks).every(Boolean));
  assert.equal(r.weightedStress.length,1);const w=r.weightedStress[0];
  assert.equal(w.order,2);assert.equal(w.orderOneIncluded,false);
  assert.deepEqual(w.compactSupport,[r.supportOrder.endpoints.Xminus,r.supportOrder.endpoints.Xplus]);
  for(const c of w.components){
    assert.equal(c.sourceRoot,source().records[2].stress[c.name]);assert.equal(c.jets.length,6);
    for(const j of c.jets){assert.equal(j.faces.length,4);assert.equal(G.freeCoordinates(j.bound).size,0);}
  }
  assert.equal(r.scope.orderOneWeightedBoundaryEstimateCompleted,false);
});

test('copied, relabelled or altered norm programs cannot certify the actual source',()=>{
  const r=actual();
  assert.throws(()=>assertActualBackgroundPhysicalSeminorms({...r}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const original=r.ftcRows[0].bound;r.ftcRows[0].bound=r.G.one;
  assert.throws(()=>assertActualBackgroundPhysicalSeminorms(r),{code:'INVALID_SOURCE_CONSTRUCTION'});r.ftcRows[0].bound=original;
  const flag=r.program.scope.fullPhysicalResidualAndFlatErrorPackageComplete;r.program.scope.fullPhysicalResidualAndFlatErrorPackageComplete=true;
  assert.throws(()=>assertActualBackgroundPhysicalSeminorms(r),{code:'INVALID_SOURCE_CONSTRUCTION'});r.program.scope.fullPhysicalResidualAndFlatErrorPackageComplete=flag;
  assert.equal(assertActualBackgroundPhysicalSeminorms(r),true);
});

test('the stronger selector retains normalized clauses, physical bounds, and higher weighted stress bounds',()=>{
  selector=attachActualPhysicalCutoffSelector(source());assert.equal(assertActualPhysicalCutoffSelector(selector),true);
  assert.equal(selector.rows.length,2);assert.equal(selector.summationDomain.q0,'1');
  assert(selector.rows.every(r=>r.diagonalRequest.throughOrder===r.order&&r.diagonalRequest.derivativeOrder===r.order));
  assert.equal(selector.rows[0].constraints.length,2);assert.equal(selector.rows[1].constraints.length,6);
  assert(selector.rows[1].constraints.some(c=>c.kind==='normalized-higher-stress-over-zeta'));
  assert(selector.rows.every(r=>r.normalized.length>0));
  assert.equal(selector.actualCurrentBackgroundChanged,false);assert.equal(selector.fullOriginalProposition55Certified,false);
  const original=selector.rows[1].logScale;selector.rows[1].logScale=selector.G.one;
  assert.throws(()=>assertActualPhysicalCutoffSelector(selector),{code:'INVALID_SOURCE_CONSTRUCTION'});selector.rows[1].logScale=original;
  assert.equal(assertActualPhysicalCutoffSelector(selector),true);
});

test('appended source work preserves a sealed finite program and certificate hash',async()=>{
  const r=actual(),before=await actualBackgroundPhysicalSeminormCertificate(r),encoded=canonicalStringify(r.program);
  r.G.fresh('source_work_after_physical_norm_certificate');
  const after=await actualBackgroundPhysicalSeminormCertificate(r);
  assert.equal(before.graph.sha256,after.graph.sha256);assert.equal(encoded,canonicalStringify(r.program));
  assert.equal(before.graph.nodeCount,r.program.nodes.length);assert.equal(before.scope.newCanonicalCutoffsAppliedToBackground,false);
  assert.equal(before.scope.fullPhysicalResidualAndFlatErrorPackageComplete,false);
  if(process.env.M2_PHYSICAL_NORM_EVIDENCE){
    const {G,...cutoffData}=selector;
    await writeFile(process.env.M2_PHYSICAL_NORM_EVIDENCE,JSON.stringify({schema:'MathScope.ActualPhysicalSeminormSourceRun/1',
      certificate:before,selector:cutoffData,sourceRequest:{order:2,maxNodes:1500000,maxDerivativeOrder:128},
      meaning:'A genuine source-derived finite certificate. The adjacent TAP and runner record determine the test run outcome; this file alone is not a test summary.'},null,2)+'\n');
  }
});

test('supplied bounds, missing source prefixes and unsupported derivative budgets fail explicitly',()=>{
  assert.throws(()=>attachActualBackgroundPhysicalSeminorms(source(),{bound:1}),{code:'INVALID_INPUT'});
  assert.throws(()=>attachActualBackgroundPhysicalSeminorms(source(),{throughOrder:3}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>attachActualBackgroundPhysicalSeminorms(source(),{derivativeOrder:17}),{code:'RESOURCE_LIMIT'});
});

