import assert from 'node:assert/strict';

export function validateLive({family,band,current,target,primary}) {
  assert.strictEqual(band.family,family);
  assert.strictEqual(current.band,band);
  assert.strictEqual(target.family,family);
  assert.strictEqual(primary.current,current);
  assert.strictEqual(primary.target,target);
  assert.equal(family.request.throughOrder,2);
  assert.equal(family.request.derivativeOrder,5);
  assert.equal(band.window.coefficientOrder,1);
  assert.equal(target.request.derivativeOrder,3);
  assert.equal(primary.request.order,2);
  assert.equal(primary.bounds.backgroundRow.derivativeOrder,3);
  assert.equal(primary.bounds.backgroundRow.backgroundDerivativeOrder,5);
  assert.deepEqual(primary.bounds.targetRows.map(x=>x.derivativeOrder),[0,1,2,3]);
  assert.deepEqual(primary.bounds.targetRows.map(x=>x.pole),[3,6,9,12]);
  assert.equal(primary.sourcePulseBindings.length,2);
  assert.ok(primary.sourcePulseBindings.every(x=>x.binding.pass&&x.sourceAmplitudeBodyMatches&&x.sameOriginalTimeCutoff&&x.originalInitialData));
  assert.ok(primary.checks.length>0&&primary.checks.every(x=>x.pass));
  assert.equal(primary.scope.actualFiniteDerivativeOrder,2);
  assert.equal(primary.scope.actualOriginalPrimaryWOneHalfClassCertified,true);
  assert.equal(primary.scope.actualOriginalPrimaryPressureWOneClassCertified,true);
  assert.equal(primary.scope.actualForcedInputWClassCertified,false);
  assert.equal(primary.scope.completeN6,false);
  assert.equal(primary.scope.newLeanKernelProof,false);
}

export function validateDegree(p) {
  const pairs=x=>x.map(({power,pole})=>[power,pole]);
  assert.deepEqual(p.derivativeOrders,{output:2,amplitudeAndTarget:3,background:5});
  assert.deepEqual(pairs(p.weighted.amplitude),[[84,2],[445,6],[851,12],[1257,18]]);
  assert.deepEqual(pairs(p.weighted.curl),[[472,6],[881,12],[1287,18]]);
  assert.deepEqual(pairs(p.pressure),[[111,2],[473,6],[880,12]]);
  assert.equal(p.sourceAuthenticated,false);
  assert.equal(p.weighted.actualTargetPoleBoundsProvedHere,false);
}
