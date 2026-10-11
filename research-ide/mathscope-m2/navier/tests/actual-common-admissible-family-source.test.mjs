import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {prepareActualCommonAdmissibleFamily,assertActualCommonAdmissibleFamily,actualCommonAdmissibleFamilyCertificate,
  actualCommonAdmissibleBand,assertActualCommonAdmissibleBand} from '../actual-common-admissible-family.mjs';
import {actualCommonAdmissibleBandCertificate} from '../actual-common-admissible-band.mjs';
import {assertActualCommonTargetWeightedNorms,actualCommonTargetWeightedNormCertificate} from '../actual-common-target-weighted-norms.mjs';

let family,band,weighted,failure,bandFailure,targetFailure,count=0;
const progress=e=>console.log('# SOURCE_PROGRESS '+JSON.stringify({...e,at:new Date().toISOString(),rssBytes:process.memoryUsage().rss}));
const source=()=>{if(failure)throw failure;if(family)return family;try{
  count++;progress({stage:'common-source-constructor-start'});
  return family=prepareActualCommonAdmissibleFamily({throughOrder:2,derivativeOrder:3,maxNodes:5000000,maxProfileJets:60000,maxJetRequests:600000},{onProgress:progress});
}catch(e){failure=e;throw e;}};
const ownBand=()=>{if(bandFailure)throw bandFailure;try{return band??=actualCommonAdmissibleBand(source(),{maxNodes:5000000},{onProgress:progress});}catch(e){bandFailure=e;throw e;}};
const targetNorm=()=>{if(targetFailure)throw targetFailure;try{return weighted??=source().constructTargetWeightedNorms({derivativeOrder:2,maxNodes:5000000},{onProgress:progress});}catch(e){targetFailure=e;throw e;}};

test('one common source binds the full C3, velocity and complete pressure/stress families',()=>{
  const p=source();assert.equal(count,1);assert.equal(p.G,p.prepared.G);
  const {backgroundNorms:b,velocitySeminorms:v,pressureStressSeminorms:t}=p.source;
  assert.equal(b.G,p.G);assert.equal(v.G,p.G);assert.equal(t.G,p.G);assert.equal(v.primitives,t.positiveStress.moments.pressure.primitives);
  assert.equal(b.rows.length,4);assert.equal(b.gaussianRows.length,2);assert.equal(b.gaussianRows[1].backgroundDerivativeOrder,3);
  assert.equal(b.heatRegularity.fullPositiveHeatAndI2Preserved,true);assert.equal(t.scope.actualOrderOneWeightedEndpointSeminorms,true);
  assert.equal(v.request.derivativeOrder,2);assert.equal(t.request.derivativeOrder,2);
});
test('every m<=n condition enters the new common predecessor recurrence with the exact physical exponent',()=>{
  const p=source(),G=p.G;assert.equal(p.selector.rows.length,2);
  for(const row of p.selector.rows){assert.equal(row.constraints.length,(row.order+1)*(row.order===1?4:5));
    for(let m=0;m<=row.order;m++){
      const v=row.constraints.find(c=>c.kind==='velocity-potential-physical'&&c.derivativeOrder===m),
        t=row.constraints.find(c=>c.kind==='pressure-stress-physical'&&c.derivativeOrder===m);
      assert.equal(v.bound,p.source.velocitySeminorms.rows[row.order-1].bounds[m]);assert.equal(t.bound,p.source.pressureStressSeminorms.rows[row.order-1].bounds[m]);}
    for(const c of row.constraints)assert.equal(c.requiredLog,G.div(G.add(G.mul(G.q(row.order),G.log(G.q(2))),G.log(c.bound)),G.mul(G.q(row.order),p.constants.h)));
    assert.ok(G.nodes[row.logScale].args.includes(row.historicalLogScale));assert.ok(G.nodes[row.logScale].args.includes(row.growth));}
  assert.equal(p.selector.rows[1].growth,G.add(p.selector.rows[0].logScale,G.log(G.q(16))));
  assert.deepEqual(p.selector.rows[0].constraints.filter(c=>c.pole!==undefined).map(c=>c.pole),[3,6]);
});
test('the full original leading pressure and target live on the exact same source graph',()=>{
  const p=source(),G=p.G;assert.equal(p.leading.Pi,G.add(G.core.P0,p.leading.Cp));
  assert.equal(p.leading.F,p.prepared.records[0].global.F);assert.equal(p.leading.M,p.prepared.bootstrap.finalM);
  assert.equal(p.leading.bothShearTermsRetained,true);assert.deepEqual(p.roots.leadingTarget,p.leading.raw);
  for(const r of p.selector.rows)assert.equal(G.freeCoordinates(r.scale).size,0);
  assert.equal(p.uniformCovariance.inverse.determinantScaleLower,p.roots.determinantScaleLower);
  assert.equal(p.selector.anchorArithmetic.pass,true);assert.equal(p.sourceBinding.unknownHistoricalGammaMembership,'NOT_EVALUATED');
});
test('missing finite prefixes and forged common families cannot create a band',()=>{
  const p=source();assert.throws(()=>actualCommonAdmissibleBand({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>actualCommonAdmissibleBand(p,{ell:3}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>actualCommonAdmissibleBand(p,{ell:0}),{code:'INVALID_INPUT'});
  assert.throws(()=>p.constructTargetWeightedNorms({derivativeOrder:4}),{code:'RESOURCE_LIMIT'});
});
test('the default own admissible band keeps both original pulse matrices and all complete background components',()=>{
  const p=source(),b=ownBand();assert.equal(b.family,p);assert.equal(b.commonFamily,p);assert.notEqual(b.G,p.G);
  assert.equal(b.families.length,2);assert.equal(b.scope.actualBandInsideExplicitGamma,true);assert.equal(b.scope.actualPositiveWeightsOnDeclaredAdmissibleDomain,true);
  assert.equal(b.geometry.ell,p.selector.ellA);assert.equal(b.background.rows.length,2);
  assert.equal(b.background.rows[0].reducedChi,b.G.one);assert.equal(b.background.rows[1].reducedChi,b.G.zero);
  for(const name of ['F','G','b','pressure'])assert.ok(b.G.nodes[b.fields[name]]);
  assert.equal(b.background.completeRadialCutoffCommutatorRetained,true);assert.equal(b.background.pressureAxisDatumAndCentrifugalPrimitiveRetained,true);
  assert.equal(b.background.sourceLeadingRoots.Pi,p.leading.Pi);assert.equal(b.background.rows[0].sourceRoots.F,p.prepared.records[1].global.F);
  for(const f of b.families){assert.deepEqual(b.G.covarianceSystems[f.system].initial,[b.G.one,b.G.zero]);assert.ok(f.system>=0);
    assert.equal(f.phaseSpeed,b.G.add(b.G.mul(f.carrier.p,b.fields.F),b.G.mul(f.carrier.pz,b.fields.G)));
    assert.equal(f.fullEikonalRemainder,b.G.add(b.G.mul(b.fields.b,f.frame.n[0]),b.G.mul(b.geometry.epsilon,b.coordinates.v,b.G.sub(f.phaseDerivatives.T,b.G.mul(b.fields.G,f.phaseDerivatives.Z)))));}
});
test('both actual Haar covariance columns, their inverse and own fixed labels are retained',()=>{
  const b=ownBand(),G=b.G;assert.equal(b.target.inverseChecks.length,2);assert.ok(b.target.inverseChecks.every(x=>x.pass));
  assert.equal(b.meshLabels.length,3);assert.equal(b.cutoffs.actualOriginalCutoffs,true);
  for(const f of b.families)for(const [j,name]of [[1,'theta'],[2,'z']])assert.equal(f.covariance[name],G.mul(b.geometry.haarFactor,G.integral(G.mul(G.pow(b.cutoffs.psi,2),f.t[0],f.t[j]),b.coordinates.v,G.zero,b.geometry.Ls)));
  for(const root of [...Object.values(b.roots.witness.fields),...b.roots.witness.H.flat(),...b.roots.witness.target])assert.equal(G.freeCoordinates(root).size,0);
  assert.equal(b.sourceBinding.oldSelectedHOrPulseCopied,false);assert.equal(b.roots.witness.actualDomainWitness,true);
});
test('actual weighted target derivatives use regular original edge factors and the full middle target',()=>{
  const p=source(),w=targetNorm();assert.equal(w.family,p);assert.equal(w.request.derivativeOrder,2);
  assert.equal(w.ftcRows.length,36);assert.equal(w.rows.length,3);assert.deepEqual(w.rows.map(r=>r.pole),[3,6,9]);
  assert.equal(w.sourceBinding.innerNaturalSeriesRetained,true);assert.equal(w.factors.inner.activationIdentity.pass,true);assert.equal(w.factors.outer.XbIdentity.pass,true);
  assert.equal(w.factors.middle.zeta,p.roots.zeta);assert.deepEqual(w.factors.middle.shares.map(r=>r.body),p.leading.raw);
  for(const r of w.ftcRows){assert.equal(r.faces.length,4);assert.equal(w.G.freeCoordinates(r.bound).size,0);}
  for(const r of w.rows)assert.equal(w.G.freeCoordinates(r.N_m).size,0);
  assert.equal(w.scope.uniformInEllAndFrozenMeshLabels,true);assert.equal(w.scope.mathematicalDerivativeOrderCap,null);
});
test('original inverse/selector/norm mutation is rejected and issued programs are stable under append',async()=>{
  const p=source(),b=ownBand(),w=targetNorm();assert.throws(()=>assertActualCommonAdmissibleBand({...b}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualCommonTargetWeightedNorms({...w}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const old=p.selector.rows[1].growth;p.selector.rows[1].growth=p.G.zero;assert.throws(()=>assertActualCommonAdmissibleFamily(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.selector.rows[1].growth=old;
  const oldWeight=b.target.weights[0];b.target.weights[0]=b.G.zero;assert.throws(()=>assertActualCommonAdmissibleBand(b),{code:'INVALID_SOURCE_CONSTRUCTION'});b.target.weights[0]=oldWeight;
  const oldN=w.rows[2].N_m;w.rows[2].N_m=w.G.zero;assert.throws(()=>assertActualCommonTargetWeightedNorms(w),{code:'INVALID_SOURCE_CONSTRUCTION'});w.rows[2].N_m=oldN;
  const c=await actualCommonAdmissibleFamilyCertificate(p),bc=await actualCommonAdmissibleBandCertificate(b),wc=await actualCommonTargetWeightedNormCertificate(w);
  p.G.fresh('after_common_family_certificate');b.G.fresh('after_own_band_certificate');w.G.fresh('after_weighted_target_certificate');
  assert.equal((await actualCommonAdmissibleFamilyCertificate(p)).graph.sha256,c.graph.sha256);
  assert.equal((await actualCommonAdmissibleBandCertificate(b)).graph.sha256,bc.graph.sha256);
  assert.equal((await actualCommonTargetWeightedNormCertificate(w)).graph.sha256,wc.graph.sha256);
  for(const scope of [c.scope,bc.scope,wc.scope]){assert.equal(scope.wholeM2Complete,false);assert.equal(scope.M3Started,false);}
  if(process.env.M2_COMMON_FAMILY_EVIDENCE)await writeFile(process.env.M2_COMMON_FAMILY_EVIDENCE,JSON.stringify({family:c,band:bc,weightedTarget:wc,
    sourceConstructions:count,executedCommonNormPrefix:2,executedBackgroundSlowOrder:3,executedTargetWeightedOrder:2,currentRSSBytes:process.memoryUsage().rss},null,2)+'\n');
});
