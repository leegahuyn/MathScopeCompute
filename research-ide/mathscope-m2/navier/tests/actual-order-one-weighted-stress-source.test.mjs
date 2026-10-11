import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {prepareActualOrderOneWeightedStress,attachActualOrderOneWeightedStress,assertActualOrderOneWeightedStress,
  actualOrderOneWeightedStressCertificateFromProgram} from '../actual-order-one-weighted-stress.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

let value,sourceError;const stages=[],started=performance.now();
const actual=()=>{
  if(sourceError)throw sourceError;if(value)return value;
  try{return value=prepareActualOrderOneWeightedStress({derivativeOrder:2,maxNodes:1500000},{onProgress:p=>{
    const row={...p,elapsedMs:performance.now()-started};stages.push(row);console.log('WEIGHTED_STRESS_STAGE '+JSON.stringify(row));
  }});}catch(error){sourceError=error;throw error;}
};

test('the actual n=1 stress, full heat and backward support identities bind before every bound',()=>{
  const r=actual(),G=r.G,original=r.prepared.bootstrap;
  assert.equal(assertActualOrderOneWeightedStress(r),true);
  assert.equal(r.sourceBinding.originalRoots.Ttheta,original.stress.Ttheta);
  assert.equal(r.sourceBinding.originalRoots.Tz,original.stress.Tz);
  assert.equal(r.sourceBinding.originalRoots.thetaBackward,original.stress.thetaBackward);
  assert.equal(r.sourceBinding.originalRoots.heatF,original.actualHeat.heat.exteriorF);
  assert(r.checks.every(c=>c.pass));assert.equal(r.domain.terminalDeltaEqualsGlobalDelta,true);
  assert.equal(r.domain.terminal[0],G.mul(original.actualHeat.heat.Xb,G.exp(G.q(-1,4))));
  assert.equal(r.scope.actualPositiveWeightsAssumed,false);
});

test('the actual differentiated terminal factor gives six complete FTC norms and materialized first jets',()=>{
  const r=actual(),G=r.G,t=r.terminal;
  assert.equal(t.factorization.check.pass,true);assert.equal(t.factorization.negativeControl.check.pass,false);
  assert.equal(t.terminalNorms.length,6);
  for(const row of t.terminalNorms){assert.equal(row.faces.length,4);assert.equal(G.freeCoordinates(row.bound).size,0);}
  const call=G.nodes[t.B],system=G.expressionSystems[call.args[0]];
  assert.equal(system.body,t.Bbody);
  assert.equal(G.materializeExpressionFunction(call.args[0],[t.delta,r.prepared.bootstrap.constants.eta],[1,0]),G.derivative(t.Bbody,t.delta));
  assert.equal(G.materializeExpressionFunction(call.args[0],[t.delta,r.prepared.bootstrap.constants.eta],[0,1]),G.derivative(t.Bbody,r.prepared.bootstrap.constants.eta));
  const factorSystem=G.nodes[t.factor].args[0],rho=G.mul(G.parameter('co'),G.parameter('h')),a0=G.div(rho,G.exp(G.q(-1)));
  for(const [j,multiplier]of [[0,G.one],[1,G.one],[2,G.q(5,2)]]){
    const atEndpoint=G.materializeExpressionFunction(factorSystem,[G.zero],[j]);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(atEndpoint,G.mul(multiplier,a0))).pass,true);
  }
  assert.equal(t.primitiveBounds.find(x=>x.deltaOrder===0&&x.etaOrder===0).pole,3);
  assert.equal(t.stressDeltaBounds.find(x=>x.deltaOrder===2&&x.etaOrder===0).pole,9);
});

test('the true inner interval and terminal collar give every requested global weighted coefficient',()=>{
  const r=actual(),G=r.G;
  assert.equal(r.interior.length,12);assert.equal(r.weightedRows.length,6);
  for(const row of r.interior){
    assert.equal(row.faces.length,4);assert.equal(row.lower[0],r.sourceBinding.support.endpoints.Xminus);assert.equal(row.upper[0],r.terminal.Xedge);
    assert.equal(G.freeCoordinates(row.bound).size,0);assert.equal(row.sourceRoot,r.sourceBinding.originalRoots[row.component==='theta'?'Ttheta':'Tz']);
  }
  for(const row of r.weightedRows){assert.equal(row.pole,3+3*row.radialOrder);assert.equal(row.terminalZIdenticallyZero,true);assert.equal(G.freeCoordinates(row.bound).size,0);}
  assert.equal(r.scope.actualRequestedOrderOneWeightedEstimateEstablished,true);
  assert.equal(r.scope.wholeGN4Complete,false);assert.equal(r.scope.fullPhysicalResidualAndFlatErrorPackageComplete,false);assert.equal(r.scope.m3MayStart,false);
});

test('the n=1 cutoff uses the unchanged first diagonal recipe and includes q Euler derivatives',()=>{
  const r=actual(),G=r.G,c=r.cutoff;
  assert.deepEqual(c.sourceNormRequest,{throughOrder:1,derivativeOrder:1});
  assert.equal(c.c1,r.c1Prefix.rows[0].scale);assert.equal(c.logC1,r.c1Prefix.rows[0].logScale);
  assert.equal(c.weightedConstantsAddedToSelector,false);assert.equal(c.otherCutoffScalesChanged,false);
  assert.equal(c.qFactorJets.length,3);assert.equal(c.normalizedRows.length,10);
  for(const row of c.normalizedRows){assert.equal(G.freeCoordinates(row.bound).size,0);assert(G.nodes[row.actualDerivatives.theta]&&G.nodes[row.actualDerivatives.z]);}
  assert.notEqual(c.qFactorJets[1],G.zero);assert.equal(r.scope.historicalBackgroundChanged,false);
});

test('copied, edited, or supplied bounds never become authentic first-order weighted source evidence',()=>{
  const r=actual();
  assert.throws(()=>assertActualOrderOneWeightedStress({...r}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const saved=r.weightedRows[0].bound;r.weightedRows[0].bound=r.G.one;
  assert.throws(()=>assertActualOrderOneWeightedStress(r),{code:'INVALID_SOURCE_CONSTRUCTION'});r.weightedRows[0].bound=saved;
  const flag=r.program.scope.wholeGN4Complete;r.program.scope.wholeGN4Complete=true;
  assert.throws(()=>assertActualOrderOneWeightedStress(r),{code:'INVALID_SOURCE_CONSTRUCTION'});r.program.scope.wholeGN4Complete=flag;
  assert.equal(assertActualOrderOneWeightedStress(r),true);
  assert.throws(()=>attachActualOrderOneWeightedStress(r.prepared,{norm:1}),{code:'INVALID_INPUT'});
  assert.throws(()=>attachActualOrderOneWeightedStress(r.prepared,{derivativeOrder:9}),{code:'RESOURCE_LIMIT'});
});

test('the compact certificate fixes its source graph and preserves all mathematical limits after later appends',async()=>{
  const r=actual(),before=await actualOrderOneWeightedStressCertificateFromProgram(r),packed=canonicalStringify(r.program);
  r.G.fresh('after_actual_n1_weighted_certificate');
  const after=await actualOrderOneWeightedStressCertificateFromProgram(r);
  assert.equal(before.graph.sha256,after.graph.sha256);assert.equal(canonicalStringify(r.program),packed);
  assert.equal(before.graph.nodeCount,r.program.nodes.length);assert.equal(before.scope.newLeanKernelProof,false);assert.equal(before.scope.numericalStressEnclosures,false);
  if(process.env.M2_N1_WEIGHTED_EVIDENCE)await writeFile(process.env.M2_N1_WEIGHTED_EVIDENCE,JSON.stringify({schema:'MathScope.ActualOrderOneWeightedStressSourceRun/1',
    certificate:before,stages,peakRSSBytes:process.resourceUsage().maxRSS*1024,elapsedMs:performance.now()-started,
    meaning:'One genuine source construction. The accompanying process record and TAP determine completion; this file is not an independent source theorem.'},null,2)+'\n');
});
