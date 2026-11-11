/** Check one LIVE private family/current/target/primary/initialized/forced chain.
 * The caller must pass native assert functions imported from the pinned modules.
 * Source IDs belong to the forced/current shared node array only.
 */
import assert from 'node:assert/strict';
export function assertLivePrimaryForcedJoin({family,current,target,primary,initial,forced,native}) {
  assert.ok(native && ['assertActualCommonAdmissibleFamily','assertActualCommonTargetWeightedNorms','assertGlobalCurrentState','assertGlobalPrimaryClassOperator','assertGlobalInitializedAngular','assertGlobalForcedCurrent'].every(k=>typeof native[k]==='function'));
  native.assertActualCommonAdmissibleFamily(family);native.assertGlobalCurrentState(current);
  native.assertActualCommonTargetWeightedNorms(target);native.assertGlobalPrimaryClassOperator(primary);
  native.assertGlobalInitializedAngular(initial);native.assertGlobalForcedCurrent(forced);
  assert.equal(family.request.throughOrder,2);assert.equal(family.request.derivativeOrder,5);
  assert.strictEqual(current.band.family,family);assert.equal(current.band.window.coefficientOrder,1);
  assert.strictEqual(target.family,family);assert.equal(target.request.derivativeOrder,3);
  assert.strictEqual(primary.current,current);assert.strictEqual(primary.target,target);assert.equal(primary.request.order,2);
  assert.equal(primary.bounds.backgroundRow.derivativeOrder,3);assert.equal(primary.bounds.backgroundRow.backgroundDerivativeOrder,5);
  assert.deepEqual(primary.bounds.targetRows.map(x=>x.derivativeOrder),[0,1,2,3]);assert.deepEqual(primary.bounds.targetRows.map(x=>x.pole),[3,6,9,12]);
  assert.equal(primary.scope.actualFiniteDerivativeOrder,2);assert.equal(primary.scope.actualForcedInputWClassCertified,false);assert.equal(primary.scope.completeN6,false);
  assert.strictEqual(forced.input,initial);
  assert.strictEqual(initial.mean.temporal.pressure.current,current);
  assert.strictEqual(forced.input.mean.temporal.pressure.current,current);
  const G=forced.G;assert.strictEqual(G.nodes,current.G.nodes);
  assert.equal(initial.templates.length,10);assert.equal(forced.templates.length,10);
  assert.equal(new Set(initial.templates.map(x=>x.key)).size,10);assert.equal(new Set(forced.templates.map(x=>x.key)).size,10);
  const expected=new Set(Array.from({length:5},(_,i)=>[`${i}:1`,`${i}:-1`]).flat());
  assert.deepEqual(new Set(initial.templates.map(x=>x.key)),expected);assert.deepEqual(new Set(forced.templates.map(x=>x.key)),expected);
  const systemIds=new Set(),rows=[];
  for(const t of forced.templates){
    const old=initial.templates.find(x=>x.key===t.key);assert.ok(old);
    assert.strictEqual(t.rawInitializedWaveResidual,old.waveResidual);
    assert.strictEqual(t.primaryFlatResidual,old.primaryFlatResidual);
    assert.strictEqual(t.originalSourceRows,old.nonzeroAngularForcing);
    assert.deepEqual(t.forced.map(x=>x.m),[1,2]);
    for(const f of t.forced){
      const raw=t.rawInitializedWaveResidual.find(x=>x.m===f.m)?.value;
      const primaryRow=t.primaryFlatResidual.find(x=>x.m===f.m)?.value;
      const supplied=t.originalSourceRows.find(x=>x.m===f.m)?.value;
      assert.ok(raw&&supplied&&raw.length===3&&supplied.length===3);
      assert.ok(f.checks.every(x=>x.pass)&&t.support.checks.every(x=>x.pass));
      assert.ok(!systemIds.has(f.inverse.system));systemIds.add(f.inverse.system);
      let changed=0;const components=[];
      for(let j=0;j<3;j++)for(const part of ['real','imaginary']){
        const p=primaryRow?.[j]?.[part]??G.zero,source=G.add(raw[j][part],G.mul(G.q(-1),p)),pull=f.pullback[j][part];
        assert.equal(source,supplied[j][part]);assert.equal(source,f.inputRoots[j][part]);assert.equal(source,pull.body);
        assert.equal(pull.mapped,f.bound.originalSource[j][part]);
        assert.equal(f.bound.wrappedSource[j][part],f.signedSolutions[0].pathSource[j][part]);
        assert.equal(pull.check.pass,true);
        if(pull.system!==undefined)assert.equal(G.expressionSystem(pull.system).body,source);else assert.equal(source,G.zero);
        if(p!==G.zero){assert.equal(f.m,1);assert.equal(part,'real');}
        changed+=Number(raw[j][part]!==source);components.push({j,part,raw:raw[j][part],primary:p,supported:source,mapped:pull.mapped,formalPathSource:f.bound.wrappedSource[j][part],expressionSystem:pull.system??null});
      }
      assert.ok(f.m===1?changed>0:changed===0);rows.push({key:t.key,m:f.m,system:f.inverse.system,changed,components});
    }
  }
  assert.equal(rows.length,20);assert.equal(rows.reduce((n,r)=>n+r.components.length,0),120);
  // The source constructors may use interned graph operations; recheck seals after this audit.
  native.assertGlobalCurrentState(current);native.assertActualCommonTargetWeightedNorms(target);
  native.assertGlobalPrimaryClassOperator(primary);native.assertGlobalInitializedAngular(initial);native.assertGlobalForcedCurrent(forced);
  return {scope:'SAME_LIVE_FAMILY_CURRENT_PRIMARY_AND_CORRECTED_FIRST_FORCED_BINDING_ONLY',
    backgroundOrder:5,targetOrder:3,primaryOrder:2,coefficientOrder:1,systems:20,components:120,rows,
    actualInputForcingWClassCertified:false,actualCompleteCurrentClassCertified:false,completeN6:false,newLeanKernelProof:false,release:'HOLD'};
}
