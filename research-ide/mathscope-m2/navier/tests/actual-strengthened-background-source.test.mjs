import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {prepareActualStrengthenedBackground,assertActualStrengthenedBackground,actualStrengthenedPhysicalMomentum,actualStrengthenedBackgroundCertificateFromProgram} from '../actual-strengthened-background.mjs';
import {attachActualFiniteResidualBridge,assertActualFiniteResidualBridge,actualFiniteResidualBridgeCertificateFromProgram} from '../actual-background-residual-bridge.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

let prepared,preparationFailure,bridge,bridgeFailure,momentum,constructions=0;
const progress=event=>console.log('# SOURCE_PROGRESS '+JSON.stringify({...event,rssBytes:process.memoryUsage().rss,at:new Date().toISOString()}));
const source=()=>{
  if(preparationFailure)throw preparationFailure;
  if(prepared)return prepared;
  constructions++;
  try{return prepared=prepareActualStrengthenedBackground({order:2,anchorOrder:1,derivativeOrder:1,maxNodes:2000000},{onProgress:progress});}
  catch(error){preparationFailure=error;throw error;}
};
const residual=()=>{
  if(bridgeFailure)throw bridgeFailure;
  if(bridge)return bridge;
  try{return bridge=attachActualFiniteResidualBridge(source().prepared,{truncationOrder:2,derivativeOrder:1,maxWords:21},{onProgress:progress});}
  catch(error){bridgeFailure=error;throw error;}
};

test('a new actual background applies the strengthened scales and retains the historical source independently',()=>{
  const r=source(),G=r.G;assert.equal(assertActualStrengthenedBackground(r),true);assert.equal(constructions,1);
  assert.equal(r.rows.length,2);assert.equal(r.selection.rows.length,2);
  for(const [j,row]of r.selection.rows.entries()){
    assert.equal(row.historicalScale,r.historical.rows[j].scale);
    assert.equal(row.historicalLogScale,r.historical.rows[j].logScale);
    const maximum=G.nodes[row.logScale];assert.equal(maximum.op,'maximum');
    assert.deepEqual(maximum.args,[row.historicalLogScale,row.candidateLogScale,row.doubling]);
    assert.equal(row.scale,G.exp(row.logScale));assert.equal(G.freeCoordinates(row.scale).size,0);
    assert.equal(r.rows[j].sigma,G.mul(row.scale,r.coordinates.q));
    assert.equal(r.rows[j].actualSourceRoots.Pi,r.prepared.records[j+1].global.Pi);
  }
  assert.equal(r.selection.oldAndNewBackgroundsIdentified,false);assert.equal(r.scope.historicalBackgroundReplaced,false);
});

test('the compact anchor band has the complete possible active prefix for every doubling continuation',()=>{
  const r=source(),G=r.G,a=r.selection.rows[0].scale;
  assert.deepEqual(r.band.q,[G.div(G.q(1,4),a),G.div(G.q(1,2),a)]);
  assert.equal(r.band.potentiallyActiveLastOrder,2);assert.equal(r.band.allLaterInactiveFrom,3);
  assert.equal(r.band.completeForEveryDoublingContinuation,true);assert.equal(r.band.unconstructedHigherCoefficientsAssumedZero,false);
  assert.equal(r.sourceProofs.support.pass,true);
  assert.equal(r.sourceProofs.support.rows[0].stress.thetaEndsAtXb,true);
  assert.equal(r.sourceProofs.n1Weighted.oldC1DerivativeRootsNotReusedAtNewA1,true);
});

test('actual pressure and both signed stress components enter the full physical momentum',()=>{
  const r=source(),G=r.G;momentum=actualStrengthenedPhysicalMomentum(r);
  assert.equal(momentum.rows.length,3);assert.equal(momentum.sourceAuthenticated,true);
  assert.deepEqual(momentum.velocity,r.cartesian.velocity);assert.equal(momentum.pressure,r.cartesian.pressure);
  for(const row of momentum.rows){
    assert.equal(row.value,G.add(row.time,row.diffusion,row.pressureGradient,row.transport,row.stress));
    assert.notEqual(row.time,G.zero);assert.notEqual(row.diffusion,G.zero);
  }
  assert.equal(momentum.actualCutoffBodiesRetained,true);assert.equal(momentum.declaredZero,false);assert.equal(momentum.flatErrorBoundProved,false);
});

test('every actual positive stress primitive has its literal FTC derivative and original backward sign',()=>{
  const r=residual();assert.equal(assertActualFiniteResidualBridge(r),true);
  assert.equal(r.stressFTC.rows.length,4);
  for(const row of r.stressFTC.rows){
    assert.equal(row.densityCheck.pass,true);assert.equal(row.primitiveCheck.pass,true);assert.equal(row.check.pass,true);
    assert.equal(row.negativeWrongSign.pass,false);assert.equal(row.fixedLabelEndpoints,true);assert.equal(row.globalGluingProvedByThisFTC,false);
  }
  const [theta1,z1,theta2,z2]=r.stressFTC.rows;
  assert.notEqual(theta1.openDomain[1],z1.openDomain[1]);assert.deepEqual(theta2.openDomain,z2.openDomain);
});

test('all actual finite residual coefficients are retained and the complete high-order tail has source FTC constants',()=>{
  const r=residual(),G=r.G;assert.equal(r.coefficients.rows.length,6);assert.equal(r.tailBounds.rows.length,3);
  assert.deepEqual(r.retainedObligations.map(r=>r.order),[0,1,2]);assert.ok(r.retainedObligations.every(r=>r.declaredZero===false));
  assert.deepEqual(r.tailBounds.rows.map(r=>r.order),[3,4,5]);assert.equal(r.tailBounds.ftcRows.length,75);
  for(const row of r.tailBounds.ftcRows){assert.equal(row.faces.length,8);assert.equal(G.freeCoordinates(row.bound).size,0);assert.equal(row.decimalEvaluation,false);}
  assert.equal(r.tailBounds.gain,G.mul(G.q(6),G.parameter('h')));
  assert.equal(sourceGraphRationalIdentity(G,G.sub(r.tailBounds.loss,G.add(G.mul(G.q(2),G.core.A),G.q(2)))).pass,true);
  assert.equal(r.tailBounds.retainedDefectsIncludedInThisBound,false);assert.equal(r.tailBounds.fullFiniteResidualBoundEstablished,false);
});

test('source seals reject changed scales, completion flags, a copied result and a supplied tail bound',()=>{
  const b=source(),r=residual();
  assert.throws(()=>assertActualStrengthenedBackground({...b}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualFiniteResidualBridge({...r}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const scale=b.rows[0].selectedScale;b.rows[0].selectedScale=b.G.one;
  assert.throws(()=>assertActualStrengthenedBackground(b),{code:'INVALID_SOURCE_CONSTRUCTION'});b.rows[0].selectedScale=scale;
  const bound=r.tailBounds.bound;r.tailBounds.bound=r.G.one;
  assert.throws(()=>assertActualFiniteResidualBridge(r),{code:'INVALID_SOURCE_CONSTRUCTION'});r.tailBounds.bound=bound;
  const flag=r.program.scope.fullPhysicalResidualAndFlatErrorPackageComplete;r.program.scope.fullPhysicalResidualAndFlatErrorPackageComplete=true;
  assert.throws(()=>assertActualFiniteResidualBridge(r),{code:'INVALID_SOURCE_CONSTRUCTION'});r.program.scope.fullPhysicalResidualAndFlatErrorPackageComplete=flag;
  assert.equal(assertActualStrengthenedBackground(b),true);assert.equal(assertActualFiniteResidualBridge(r),true);
});

test('fixed graph hashes survive later source appends and neither receipt opens M3',async()=>{
  const b=source(),r=residual(),before=await actualStrengthenedBackgroundCertificateFromProgram(b),residualBefore=await actualFiniteResidualBridgeCertificateFromProgram(r),encoded=canonicalStringify(b.program);
  b.G.fresh('after_actual_strengthened_and_residual_certificates');
  assert.equal((await actualStrengthenedBackgroundCertificateFromProgram(b)).graph.sha256,before.graph.sha256);
  assert.equal((await actualFiniteResidualBridgeCertificateFromProgram(r)).graph.sha256,residualBefore.graph.sha256);
  assert.equal(canonicalStringify(b.program),encoded);
  assert.equal(before.scope.wholeGN4Complete,false);assert.equal(residualBefore.scope.wholeGN4Complete,false);
  assert.equal(before.scope.m3MayStart,false);assert.equal(residualBefore.scope.m3MayStart,false);
  if(process.env.M2_STRENGTHENED_BACKGROUND_EVIDENCE)await writeFile(process.env.M2_STRENGTHENED_BACKGROUND_EVIDENCE,JSON.stringify({
    schema:'MathScope.ActualStrengthenedBackgroundSourceRun/1',sourceConstructions:constructions,
    background:before,residual:residualBefore,physicalMomentum:{schema:momentum.schema,values:momentum.values,sourceAuthenticated:true,declaredZero:false,flatErrorBoundProved:false},
    compilerRequests:{background:{order:2,anchorOrder:1,derivativeOrder:1,maxNodes:2000000},residual:{truncationOrder:2,derivativeOrder:1,maxWords:21}},
    currentRSSBytes:process.memoryUsage().rss,meaning:'Exact source expressions and scope, with the adjacent TAP/process record determining the observed test outcome.'
  },null,2)+'\n');
});
