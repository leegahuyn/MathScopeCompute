/** Source assertions for the parent's ONE combined family/physical run.
 * No source construction occurs at import time or in these validators.
 */
import assert from 'node:assert/strict';
import {assertActualBackgroundResidualFlatness} from '../actual-background-residual-flatness.mjs';
import {assertActualCommonBandBackgroundResidual} from '../actual-common-band-background-residual.mjs';

export function validateActualBackgroundResidualFlatness(theorem){
  const checks=[],check=(id,action)=>{action();checks.push({id,pass:true});},p=theorem,G=p.G;
  check('private-original-family-and-finite-source',()=>{
    assert.equal(assertActualBackgroundResidualFlatness(p),true);
    assert.equal(p.finite.positiveStress,p.family.source.pressureStressSeminorms.positiveStress);
    assert.equal(p.finite.sourceCopy.sourceSealedNodePrefixUnchanged,true);
    assert.equal(p.finite.sourceCopy.positiveAndHighCoefficientsBuiltBeforeCopy,true);
    assert.throws(()=>assertActualBackgroundResidualFlatness({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  });
  check('one-recursive-scale-for-every-actual-physical-clause',()=>{
    assert.equal(p.sameSequence.rows.length,p.family.selector.rows.length);
    for(const row of p.sameSequence.rows){
      const source=p.family.selector.rows[row.order-1];
      assert.equal(row.scale,source.scale);assert.equal(row.logScale,source.logScale);
      assert.equal(row.previousLogScale,source.previousLogScale);
      assert.equal(row.clauses.length,2*(row.order+1));
      for(const c of row.clauses){
        assert.equal(c.actualBound,c.sourceClause.bound);assert.equal(c.actualRequiredLog,c.sourceClause.requiredLog);
        assert.ok(G.nodes[row.logScale].args.includes(c.actualRequiredLog));
      }
      assert.equal(row.originalRadialCommutatorIncluded,true);assert.equal(row.pressureAndBothStressComponentsIncluded,true);
    }
    assert.equal(p.sameSequence.sameActualScaleAtEveryUse,true);assert.equal(p.sameSequence.noSecondResidualSelector,true);
  });
  check('actual-leading-primitives-axis-pressure-and-both-shears',()=>{
    assert.equal(p.leadingBinding.primitives.length,10);assert.equal(p.leadingBinding.stresses.length,2);
    for(const r of p.leadingBinding.primitives)assert.equal(r.check.pass,true);
    for(const r of p.leadingBinding.stresses)assert.equal(r.check.pass,true);
    assert.equal(p.leadingBinding.fullHeatAndI2Retained,true);assert.equal(p.leadingBinding.originalPressureAxisRetained,true);
    assert.equal(p.leadingBinding.bothShearsRetained,true);
  });
  check('actual-continuity-and-mass-before-cutoff-commutator-cancellation',()=>{
    const source=p.finite.positiveStress;
    assert.equal(p.continuity.rows.length,source.moments.continuity.length);
    for(const row of p.continuity.rows){
      assert.equal(row.sourceProof,source.moments.continuity[row.order-1]);
      assert.equal(row.originalContinuityDefect,row.sourceProof.originalContinuityDefect);
      assert.equal(row.actualMassPrimitive,source.moments.pressure.primitives.rows[row.order-1].mass.source);
    }
    assert.ok(Object.values(p.continuity.kernel.negativeControls).every(r=>r.pass===false));
    assert.equal(p.continuity.sourceLeadingContinuity,true);
  });
  check('every-high-order-pair-and-fixed-derivative-source-constant',()=>{
    const finite=p.finite,N=finite.request.truncationOrder;
    assert.equal(finite.coefficients.rows.length,2*N+2);assert.equal(finite.tail.rows.length,N+1);
    assert.equal(finite.ledger.checks.allOrderedPairsExactlyOnce,true);
    assert.equal(finite.ledger.checks.shiftedOmegaAllOrderedPairsExactlyOnce,true);
    assert.equal(finite.tail.lossIndependentOfTruncationOrder,true);
    for(const row of finite.coefficients.rows.filter(r=>r.order<=N)){
      assert.equal(row.cancellation.pass,true);assert.equal(row.retainedActualDefectsNotDefinedAsZero,true);
    }
    for(const root of [finite.tail.bound,finite.partialVelocity.bound,p.geometry.momentumDifferenceConstant])
      assert.equal(G.freeCoordinates(root).size,0);
  });
  check('positive-h-universal-comparison-without-fabricated-large-J-data',()=>{
    assert.equal(p.arithmetic.marginCheck.pass,true);assert.equal(p.arithmetic.hReplacedByZero,false);
    assert.equal(p.sameSequence.positiveH.positive,true);
    assert.equal(p.proof.comparison.missingFiniteConstantInvented,false);
    assert.equal(p.proof.comparison.executedFiniteIndexNotAssertedEqualToSymbolicJ,true);
    assert.equal(p.proof.comparison.executedFiniteComparisonIndex,p.request.truncationOrder);
    assert.equal(p.proof.comparison.D_m,p.geometry.momentumDifferenceConstant);
    assert.equal(p.scope.allFixedOrdersBySourceInduction,true);assert.equal(p.scope.allInfiniteGraphsLiterallyExecuted,false);
    assert.equal(p.scope.actualBandResidualAttached,false);assert.equal(p.scope.wholeGN4Complete,false);
  });
  return {schema:'MathScope.ActualBackgroundResidualFlatnessSourceAssertions/1',checks,pass:true,
    sourceConstructionsPerformedByValidator:0,executedFiniteOrder:p.request.truncationOrder,
    executedDerivativeOrder:p.request.derivativeOrder,requestedDecayOrder:p.request.decayOrder};
}

export function validateActualCommonBandBackgroundResidual(result){
  const checks=[],check=(id,action)=>{action();checks.push({id,pass:true});},p=result,G=p.G;
  check('same-private-physical-graph-family-and-band',()=>{
    assert.equal(assertActualCommonBandBackgroundResidual(p),true);
    assert.equal(p.G,p.physical.G);assert.equal(p.family,p.physical.family);
    assert.equal(p.family,p.theorem.family);assert.equal(p.band,p.physical.band);
    assert.equal(p.sourceBinding.noSiblingGraphIDsTransplanted,true);
    assert.throws(()=>assertActualCommonBandBackgroundResidual({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  });
  check('complete-original-band-tuple-and-actual-cutoff-derivative',()=>{
    assert.equal(p.tupleBinding.rows.length,p.band.background.rows.length);
    for(const row of p.tupleBinding.rows){
      const actual=p.band.background.rows.find(r=>r.order===row.order);
      assert.equal(row.originalChi,actual.chi);assert.equal(row.originalEulerChi,actual.extra);
      assert.equal(row.sameScale,p.family.selector.rows[row.order-1].scale);
    }
    assert.equal(p.tupleBinding.radialCheck.pass,true);
    assert.ok(Object.values(p.tupleBinding.sumChecks).every(r=>r.pass));
    assert.equal(p.tupleBinding.actualBandTailExclusion,p.band.background.omittedTail);
  });
  check('original-stress-and-its-complete-physical-derivatives-retained',()=>{
    assert.deepEqual(p.stress.sourceLeading,p.family.leading.raw);
    assert.equal(p.stress.sourcePositive.length,p.band.background.rows.length);
    assert.equal(p.stress.physical.length,2);assert.equal(p.stress.divergence.length,3);
    assert.equal(p.stress.actualDerivativesComputed,true);
    assert.equal(p.leading.primitiveRows.length,8);assert.equal(p.leading.rawDefects.length,2);
    assert.ok(p.leading.primitiveRows.every(r=>r.check.pass));assert.ok(p.leading.fluxChecks.every(r=>r.pass));
    assert.ok(p.leading.checks.every(r=>r.pass));assert.equal(p.leading.actualDefectsNotDefinedAsZero,true);
  });
  check('E-B-is-the-original-physical-NS-plus-original-stress-divergence',()=>{
    assert.deepEqual(p.residual.actualBackgroundNS,p.physical.residual.background);
    assert.deepEqual(p.residual.actualStressDivergence,p.stress.divergence);
    assert.equal(p.residual.values.length,3);
    for(let j=0;j<3;j++)assert.equal(p.residual.values[j],G.add(p.physical.residual.background[j],p.stress.divergence[j]));
    assert.ok(p.residual.momentumChecks.every(r=>r.pass));
    assert.equal(p.residual.definedAsZero,false);assert.equal(p.residual.actualExpressionRetained,true);
  });
  check('same-sequence-all-fixed-order-flatness-and-precise-NS-scope',()=>{
    assert.equal(p.flatness.theorem.sourceComparisonIndex,p.flatness.arithmetic.comparisonOrder);
    assert.equal(p.flatness.theorem.D_m,p.flatness.geometry.momentumDifferenceConstant);
    assert.equal(p.flatness.externalFiniteEvidence.actualCoefficientCancellation,true);
    assert.equal(p.flatness.externalFiniteEvidence.actualTailBound,true);
    assert.equal(p.scope.actualBandRootAndUniversalSourceInductionBothBound,true);
    assert.equal(p.scope.wholeGN4Complete,true);assert.equal(p.scope.allBandsLiterallyExecuted,false);
    assert.equal(p.scope.totalUncorrectedNSResidualDeclaredFlat,false);
    assert.equal(p.scope.wholeM2Complete,false);assert.equal(p.scope.m3MayStart,false);
  });
  return {schema:'MathScope.ActualCommonBandBackgroundResidualSourceAssertions/1',checks,pass:true,
    sourceConstructionsPerformedByValidator:0,physicalGraphOwnedBySameActualPhysicalCurl:true};
}
