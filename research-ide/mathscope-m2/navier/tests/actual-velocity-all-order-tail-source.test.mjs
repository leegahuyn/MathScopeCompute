import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {prepareActualGlobalPositivePrimitives,actualGlobalPositivePrimitivesCertificateFromProgram} from '../actual-global-positive-primitives.mjs';
import {attachActualVelocityDiagonalSelector,assertActualVelocityDiagonalSelector,attachActualVelocityPhysicalSeminorms,assertActualVelocityPhysicalSeminorms,actualVelocityPhysicalSeminormCertificate,actualVelocityDiagonalSelectorCertificate} from '../actual-velocity-all-order-tail.mjs';

let primitives,selector,failure,constructions=0;
const progress=e=>console.log('# SOURCE_PROGRESS '+JSON.stringify({...e,at:new Date().toISOString(),rssBytes:process.memoryUsage().rss}));
const source=()=>{
  if(failure)throw failure;if(selector)return selector;
  try{constructions++;progress({phase:'original-velocity-constructor-start'});
    primitives=prepareActualGlobalPositivePrimitives({order:2,maxNodes:2000000},{onProgress:progress});
    return selector=attachActualVelocityDiagonalSelector(primitives,{throughOrder:2},{onProgress:progress});
  }catch(error){failure=error;throw error;}
};

test('one actual original n1/n2 prefix supplies every velocity/potential source norm and diagonal cutoff condition',()=>{
  const r=source();assert.equal(constructions,1);assert.equal(r.rows.length,2);assert.equal(r.norms.length,2);
  for(let n=1;n<=2;n++){
    const row=r.rows[n-1],norm=r.norms[n-1];assert.equal(row.order,n);assert.equal(row.clauses.length,n+1);
    assert.equal(norm.request.derivativeOrder,n);assert.equal(norm.request.throughOrder,n);
    assert.equal(norm.scope.mathematicalDerivativeOrderCap,null);assert.equal(norm.scope.pressureOrStressSeminormsClaimed,false);
    assert.equal(norm.scope.actualSourceMassIdentitiesUsed,true);assert.equal(norm.rows[n-1].components.length,9);
    assert.equal(row.unchangedActualCoefficientRoots.M,primitives.prepared.records[n].global.M);
  }
});

test('every generated actual profile bound retains all eight literal FTC faces and no free coordinate',()=>{
  const r=source(),G=r.G;let count=0;
  for(const norm of r.norms)for(const ftc of norm.ftcRows){count++;
    assert.equal(ftc.faces.length,8);assert.equal(ftc.decimalEvaluation,false);assert.equal(G.freeCoordinates(ftc.bound).size,0);
    assert.deepEqual(ftc.coordinates,norm.domain.cartesianProfileBox.coordinates);
  }
  assert.ok(count>=100);
  for(const norm of r.norms)for(const row of norm.rows){
    assert.equal(row.components.filter(c=>c.cutoff==='extra').length,2);
    assert.ok(row.components.every(c=>c.byOrder.length===norm.request.derivativeOrder+1));
    assert.equal(row.gain,G.mul(G.q(2*row.order),G.parameter('h')));
  }
});

test('the separate diagonal sequence preserves original c_n and executes every actual m<=n clause',()=>{
  const r=source(),G=r.G;
  for(const row of r.rows){
    const maximum=G.nodes[row.logScale];assert.equal(maximum.op,'maximum');
    assert.deepEqual(maximum.args,[row.historicalLogScale,row.doubling,...row.clauses.map(c=>c.requiredLog)]);
    assert.equal(row.scale,G.exp(row.logScale));assert.equal(G.freeCoordinates(row.scale).size,0);
    for(const clause of row.clauses)assert.equal(clause.bound,r.norms[row.order-1].rows[row.order-1].bounds[clause.derivativeOrder]);
  }
  assert.equal(r.actualHistoricalBackgroundChanged,false);assert.equal(r.scope.actualRuntimeCutoffsReplaced,false);
  assert.equal(r.scope.sourceBoundArbitraryFixedMVelocityPotentialSummation,true);assert.equal(r.scope.pressureStressOrResidualTheoremComplete,false);
});

test('the actual selected scales enter all nine authentic source terms and the original extra radial commutator',()=>{
  const r=source(),G=r.G,{q,y1,y2,eta}=r.coordinates,cutoff=G.expressionSystems[r.cutoff.system],body=G.nodes[cutoff.body];
  assert.equal(cutoff.body,r.cutoff.body);assert.deepEqual(cutoff.parameters,[r.cutoff.coordinate]);
  assert.equal(body.op,'smooth_piecewise');assert.deepEqual(body.args.slice(0,4),[r.cutoff.coordinate,G.q(1,2),G.one,G.one]);
  assert.equal(body.args[5],G.zero);assert.equal(r.cutoff.squareSpatialSeedSubstituted,false);
  for(const row of r.rows){
    const a=row.application;assert.equal(a.sigma,G.mul(row.scale,q));assert.equal(a.chi,G.expressionValue(r.cutoff.system,[a.sigma]));
    assert.equal(a.extra,G.mul(a.sigma,G.expressionValue(r.cutoff.system,[a.sigma],[1])));assert.equal(a.selectedComponents.length,9);
    for(const c of a.selectedComponents){
      assert.equal(c.profile,G.simultaneousSubstitute(c.sourceNormBody,c.sourceCoordinates,[y1,y2,eta]));
      assert.deepEqual(c.sourceRoots,r.norms[row.order-1].rows[row.order-1].components.find(x=>x.name===c.name).sourceRoots);
      assert.equal(c.value,G.mul(c.prefactor,c.cutoffFactor,c.profile));
      assert.equal(c.cutoffFactor,c.cutoffKind==='extra'?a.extra:a.chi);
      assert.ok([...G.freeCoordinates(c.value)].every(v=>[q,y1,y2,eta].includes(v)));
    }
    const ordinaryX=a.selectedComponents.filter(c=>['angular_x1','radial_x1'].includes(c.name)).map(c=>c.value),extra=a.selectedComponents.find(c=>c.name==='extra_stream_x1').value;
    assert.notEqual(extra,G.zero);assert.notEqual(G.add(...ordinaryX,extra),G.add(...ordinaryX));
  }
  assert.equal(r.scope.actualFiniteSelectedTupleConstructed,true);assert.equal(r.finiteTuple.leadingOrderIncluded,false);
  assert.equal(r.finiteTuple.allUnconstructedHigherTermsSetToZero,false);assert.equal(r.scope.finitePrefixClaimedAsWholeBackground,false);
});

test('a real order17 request still enforces its declared materialization budget instead of promoting the generic control',()=>{
  source();assert.throws(()=>attachActualVelocityPhysicalSeminorms(primitives,{throughOrder:1,derivativeOrder:17,maxProfileJets:1}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>attachActualVelocityPhysicalSeminorms(primitives,{bound:1}),{code:'INVALID_INPUT'});
  assert.equal(primitives.scope.wholeGN4Complete,false);
});

test('unchanged live source seals reject injected physical bounds and edited diagonal completion flags',()=>{
  const r=source(),norm=r.norms[1];assert.throws(()=>assertActualVelocityDiagonalSelector({...r}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const bound=norm.rows[1].bounds[0];norm.rows[1].bounds[0]=norm.G.zero;
  assert.throws(()=>assertActualVelocityPhysicalSeminorms(norm),{code:'INVALID_SOURCE_CONSTRUCTION'});norm.rows[1].bounds[0]=bound;
  const flag=r.scope.pressureStressOrResidualTheoremComplete;r.scope.pressureStressOrResidualTheoremComplete=true;
  assert.throws(()=>assertActualVelocityDiagonalSelector(r),{code:'INVALID_SOURCE_CONSTRUCTION'});r.scope.pressureStressOrResidualTheoremComplete=flag;
  assert.equal(assertActualVelocityDiagonalSelector(r),true);
});

test('fixed source tuple and norm receipts survive append-only work and all residual/Lean/M3 gates remain closed',async()=>{
  const r=source(),certificates=[];for(const norm of r.norms)certificates.push(await actualVelocityPhysicalSeminormCertificate(norm));
  const primitive=await actualGlobalPositivePrimitivesCertificateFromProgram(primitives),selection=await actualVelocityDiagonalSelectorCertificate(r);r.G.fresh('after_actual_velocity_tail_receipt');
  for(let j=0;j<r.norms.length;j++)assert.equal((await actualVelocityPhysicalSeminormCertificate(r.norms[j])).graph.sha256,certificates[j].graph.sha256);
  assert.equal((await actualGlobalPositivePrimitivesCertificateFromProgram(primitives)).graph.sha256,primitive.graph.sha256);
  assert.equal((await actualVelocityDiagonalSelectorCertificate(r)).graph.sha256,selection.graph.sha256);
  assert.equal(selection.schema,'MathScope.ActualVelocityDiagonalSelectorCertificate/1');
  assert.equal(r.scope.wholeGN4Complete,false);assert.equal(r.scope.newLeanKernelProof,false);assert.equal(r.scope.m3MayStart,false);
  if(process.env.M2_VELOCITY_TAIL_EVIDENCE){
    await writeFile(process.env.M2_VELOCITY_TAIL_EVIDENCE,JSON.stringify({schema:'MathScope.ActualVelocityAllOrderTailSourceRun/1',sourceConstructions:constructions,
      originalPrimitiveGraph:primitive.graph,selection,normCertificates:certificates,actualExecutedDerivativeOrders:[1,2],genericOrder17IsNotActualWholeSourceEvaluation:true,
      currentRSSBytes:process.memoryUsage().rss},null,2)+'\n');
  }
});
