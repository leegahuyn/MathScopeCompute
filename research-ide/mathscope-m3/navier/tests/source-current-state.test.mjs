import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {prepareActualCurrentMeanState,assertActualCurrentMeanState,actualCurrentMeanStateCertificate} from '../source-current-state.mjs';
import {attachActualCurrentPressure,assertActualCurrentPressure,actualCurrentPressureCertificate} from '../source-pressure.mjs';
import {ActualNavierHigherJetExpressions,actualHigherJetCertificate,assertActualNavierHigherJetExpressions} from '../source-higher-jets.mjs';
import {attachActualCurrentSignedStress,assertActualCurrentSignedStress,actualCurrentSignedStressCertificate} from '../source-signed-stress.mjs';

let state,certificate,pressureState,higherGraph;
const progress=e=>console.log('# N6_SOURCE '+JSON.stringify({...e,rssBytes:process.memoryUsage().rss}));

test('reconstruct the unchanged common6 full curl and calculate current mean defects',async()=>{
  state=prepareActualCurrentMeanState({}, {onProgress:progress});
  assert.equal(assertActualCurrentMeanState(state),true);
  assert.equal(state.checks.every(c=>c.pass),true);
  assert.equal(state.rows.length,2);
  assert.deepEqual(state.covariance.components,['rr','rtheta','rz','thetatheta','thetaz','zz']);
  assert.equal(state.mean.scope.actualFullCurlMeanDefectsConstructed,true);
  assert.equal(state.mean.scope.actualMeanPressureZeroModeConstructed,true);
  assert.equal(state.mean.scope.fullPressureConstructed,false);
  assert.equal(state.scope.initializedJ0,false);
  certificate=await actualCurrentMeanStateCertificate(state);
  const common6=JSON.parse(await readFile(new URL('../../../mathscope-m2/navier/research/evidence/common-physical-package-20261011/actual-common-physical-package-source-attempt6.json',import.meta.url)));
  assert.equal(certificate.physicalSource.graph.sha256,common6.certificates.physical.graph.sha256);
  assert.equal(certificate.physicalSource.graph.nodeCount,common6.certificates.physical.graph.nodeCount);
  assert.equal(certificate.source.parameterExpressionSHA256,'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152');
  if(process.env.M3_N6_CURRENT_EVIDENCE)await writeFile(process.env.M3_N6_CURRENT_EVIDENCE,JSON.stringify(certificate,null,2)+'\n');
});

test('the source state retains every full curl remainder and both original cutoff systems',()=>{
  assert.ok(state,'The source constructor must actually execute first.');
  const G=state.G;
  for(const [index,row] of state.rows.entries()){
    const source=state.physical.rows[index];
    assert.deepEqual(row.sourcePotential,source.coefficient);
    assert.ok(row.curl.remainder.some(x=>x!==G.zero));
    assert.equal(row.noFrequencySeparationAssumed,true);
    for(const component of state.covariance.components){
      assert.notEqual(row.fullMinusPrimaryAuxiliaryMean[component],undefined);
      assert.equal(G.nodes[row.angularMean[component]].op,'smooth_piecewise');
    }
    assert.equal(row.normalizedHaarJacobian,G.mul(state.physical.band.geometry.Dgeom,state.physical.band.geometry.ci));
  }
  assert.equal(state.covariance.angularMeanRepresentation.originalPalette.commonToAllBandsAndLabels,true);
  assert.equal(state.mean.residual.fullHigherStressRetained,true);
});

test('the pressure and P/J are current source expressions, with unsupported claims excluded',()=>{
  assert.ok(state);
  const G=state.G;
  for(const name of ['gr','P','Jtheta','Jz'])assert.ok(G.nodes[state.mean[name]]);
  assert.equal(state.mean.pressure.check.pass,true);
  assert.equal(state.mean.pressure.fullNonzeroAuxiliaryPressureConstructed,false);
  assert.equal(state.scope.numericalFullFieldValuesComputed,false);
  assert.equal(state.scope.completeN6,false);
  assert.equal(state.scope.allBandsAndLabelsAssembled,false);
  assert.equal(certificate.sourceExpressionValuesAreNumericalEnclosures,false);
});

test('a copied receipt or edited current pressure cannot acquire private source authority',()=>{
  assert.ok(state);
  assert.throws(()=>assertActualCurrentMeanState(certificate),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualCurrentMeanState({...state}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const old=state.mean.P;state.mean.P=state.G.zero;
  try{assert.throws(()=>assertActualCurrentMeanState(state),{code:'INVALID_SOURCE_CONSTRUCTION'});}
  finally{state.mean.P=old;}
  assert.equal(assertActualCurrentMeanState(state),true);
  assert.throws(()=>prepareActualCurrentMeanState({lambda:0}),{code:'INVALID_INPUT'});
});

test('reconstruct full pressure on the original auxiliary torus with its cutoff remainder',async()=>{
  assert.ok(state);
  const pressure=attachActualCurrentPressure(state,{onProgress:progress});
  pressureState=pressure;
  assert.equal(assertActualCurrentPressure(pressure),true);
  assert.equal(pressure.checks.every(c=>c.pass),true);
  assert.equal(pressure.scope.allAuxiliaryModesRetainedInPressure,true);
  assert.equal(pressure.scope.actualCurrentTangentialMeanResidualConstructed,true);
  assert.equal(pressure.scope.initializedJ0,false);
  assert.equal(pressure.pressure.cutoffRemainderDeclaredZero,false);
  assert.equal(pressure.checks.find(c=>c.id==='omitted-radial-cutoff-error-negative-control').pass,true);
  const record=await actualCurrentPressureCertificate(pressure);
  assert.throws(()=>assertActualCurrentPressure(record),{code:'INVALID_SOURCE_CONSTRUCTION'});
  if(process.env.M3_N6_PRESSURE_EVIDENCE)await writeFile(process.env.M3_N6_PRESSURE_EVIDENCE,JSON.stringify(record,null,2)+'\n');
});

test('generate fourth and fifth variations of both unchanged original pulse ODEs',async()=>{
  assert.ok(state);
  const G=new ActualNavierHigherJetExpressions(state,{maximumSlowOrder:5,onProgress:progress}),roots={};
  higherGraph=G;
  assert.equal(G.pulseThirdJetAliases.size,2);
  for(const [original,third]of G.pulseThirdJetAliases){
    const source=G.assertPulseThirdVariation(third),id=G.defineHigherVariation(third,5),s=G.higherSystem(id);
    assert.equal(s.order,5);
    assert.equal(s.dimension,112);
    assert.deepEqual(s.originalMatrix,G.covarianceSystems[original].matrix);
    assert.deepEqual(s.originalInitial,[G.one,G.zero]);
    assert.equal(s.matrixAndEveryTimeDerivativeMaterialized,true);
    assert.equal(s.matrixNorms.length,56);
    let fourth=G.covarianceValue(original,0,source.variable,source.parameters);
    for(let j=0;j<4;j++)fourth=G.derivative(fourth,source.directions[0]);
    const fifth=G.derivative(fourth,source.directions[2]);
    assert.equal(G.nodes[fourth].op,'actual_n6_pulse_higher_jet_volterra');
    assert.equal(G.nodes[fifth].op,'actual_n6_pulse_higher_jet_volterra');
    assert.deepEqual(s.blocks[Math.floor(G.nodes[fifth].args[1]/2)].orders,[4,0,1]);
    assert.equal(G.substitute(fifth,source.variable,G.zero),G.zero,'Every positive slow jet retains the original constant initial datum.');
    const alpha=s.blocks.find(b=>b.orders.join(',')==='4,0,0'),beta=s.blocks.find(b=>b.orders.join(',')==='1,0,0'),
      coefficient=s.blocks.findIndex(b=>b.orders.join(',')==='3,0,0');
    assert.equal(s.augmentedMatrix[alpha.offset][beta.offset],G.mul(G.q(4),s.matrices[coefficient][0][0]));
    const partial=G.pulseHigherPartialSum(id,{terms:1});
    assert.equal(partial.dimension,112);
    assert.equal(partial.finiteSumIsExactSolution,false);
    assert.equal(partial.tailTendsToZero,true);
    assert.notEqual(partial.tail,G.zero);
    assert.throws(()=>G.defineHigherVariation(third,6),{code:'RESOURCE_LIMIT'});
    roots['fourth_'+original]=fourth;roots['fifth_'+original]=fifth;roots['tail_'+original]=partial.tail;
  }
  const record=await actualHigherJetCertificate(G,roots);
  assert.equal(record.checks.every(c=>c.pass),true);
  assert.equal(record.scope.allOrderGlobalClassBounds,false);
  assert.deepEqual(G.pack(roots).pulseThirdJetAliases,[...G.pulseThirdJetAliases]);
  assert.equal(assertActualCurrentMeanState(state),true);
  assert.throws(()=>assertActualNavierHigherJetExpressions({...G}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const definition=G.expressionSystems[0],body=definition.body;
  definition.body=G.one;
  try{assert.throws(()=>assertActualNavierHigherJetExpressions(G),{code:'INVALID_SOURCE_CONSTRUCTION'});}
  finally{definition.body=body;}
  assert.equal(assertActualNavierHigherJetExpressions(G),true);
  if(process.env.M3_N6_HIGHER_JET_EVIDENCE)await writeFile(process.env.M3_N6_HIGHER_JET_EVIDENCE,JSON.stringify(record,null,2)+'\n');
});

test('apply the actual current signed target with fixed source amplitudes and full curl remainders',async()=>{
  assert.ok(state&&pressureState&&higherGraph);
  const result=attachActualCurrentSignedStress(state,pressureState,higherGraph,{onProgress:progress});
  assert.equal(assertActualCurrentSignedStress(result),true);
  assert.equal(result.checks.every(c=>c.pass),true);
  assert.equal(result.target.callerSuppliedTargetUsed,false);
  assert.equal(result.target.fullProductCRhoPInsideDerivative,true);
  assert.equal(result.inverse.originalPositiveAmplitudesRemainFixed,true);
  assert.equal(result.rows.length,2);
  for(const row of result.rows){
    assert.equal(row.materializedCurlBodies.allRequestedSharedBodiesMaterialized,true);
    assert.ok(row.materializedCurlBodies.partials.length>0);
    assert.equal(row.expansion.newIncrementSquareRetained,true);
    assert.equal(row.expansion.previousCorrectionRetained,true);
    assert.ok(row.curl.remainder.some(v=>v!==higherGraph.zero));
  }
  assert.equal(result.updated.meanPressure.check.pass,true);
  assert.equal(result.scope.globalBilinearIdentityClaimedForSingleMember,false);
  assert.equal(result.scope.initializedJ0,false);
  assert.equal(result.scope.completeN6,false);
  const record=await actualCurrentSignedStressCertificate(result);
  assert.throws(()=>assertActualCurrentSignedStress(record),{code:'INVALID_SOURCE_CONSTRUCTION'});
  if(process.env.M3_N6_SIGNED_EVIDENCE)await writeFile(process.env.M3_N6_SIGNED_EVIDENCE,JSON.stringify(record,null,2)+'\n');
});
