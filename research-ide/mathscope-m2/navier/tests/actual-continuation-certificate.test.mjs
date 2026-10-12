import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareActualBackgroundMomentCertificate,actualBackgroundMomentCertificate} from '../actual-continuation-exact-certificate.mjs';
import {assertActualFirstOrderCompleted} from '../actual-continuation-exact-order-one.mjs';
import {assertActualSecondOrderCompleted} from '../actual-continuation-exact-order-two.mjs';
import {checkActualExteriorZeros} from '../actual-continuation-exact-support.mjs';
import {sourceGraphPolynomialIdentity,sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {canonicalStringify,sha256} from '../../../mathscope-m0/contracts.mjs';

const prepared=prepareActualBackgroundMomentCertificate(),{G,program,certificate:c,first,second}=prepared;
const initialProgramText=canonicalStringify(program),initialBytes=new TextEncoder().encode(initialProgramText).length,initialNodes=G.nodes.length;
const {X,eta}=second.constants;

test('the exact receipt preserves the immutable original N4-04 text and finite acceptance scope',()=>{
  const archive=JSON.parse(readFileSync(new URL('../../evidence/original-m2-criteria.json',import.meta.url),'utf8'));
  const find=o=>{if(o?.id==='N4-04')return o;if(o&&typeof o==='object')for(const v of Object.values(o)){const r=find(v);if(r)return r;}return null;};
  const row=find(archive);assert.ok(row);
  assert.equal(c.originalCriterion.title,row.title);assert.equal(c.originalCriterion.text,row.criteria);assert.equal(c.originalCriterion.sourcePage,row.sourcePage);
  assert.deepEqual(c.originalCriterion.testedActualOrders,[1,2]);assert.equal(c.scope.originalN404Complete,true);
  assert.equal(c.scope.allOrdersConstructed,false);assert.equal(c.scope.globalSignedMomentValuesNumericallyEnclosed,false);
  assert.equal(c.scope.globalNumericStressResidualEvaluated,false);assert.equal(c.scope.completeFormalNSTheoremClaimed,false);
});

test('all ten identities use nonzero actual incoming operands and continuous inverse corrections',()=>{
  assert.equal(c.momentIdentities.length,10);
  for(const row of c.momentIdentities){
    assert.match(row.label,/n=[12].*∫/);assert.equal(row.exactResidual,'0');assert.equal(row.verified,true);
    assert.notEqual(row.rawDebtRoot,G.zero);assert.notEqual(row.correctionRoot,G.zero);
    assert.equal(row.identityProof.numeratorMonomials,0);assert.ok(row.identityProof.denominatorMonomials>0);
    assert.equal(row.identityProof.nonzeroDenominatorProofRequired,true);
    assert.equal(program.roots[row.sourcePath.slice('graph.roots.'.length)],row.correctedResidualRoot);
    const omitted=sourceGraphRationalIdentity(G,row.rawDebtRoot,{atomicNodes:[row.rawDebtRoot]});assert.equal(omitted.pass,false);
  }
  assert.ok(Object.values(c.continuousInverse.proof.checks).every(Boolean));
  assert.match(c.continuousInverse.U.determinantLower,/\d/);assert.match(c.continuousInverse.E.determinantAbsoluteLower,/\d/);
});

test('actual second-order source retains the finalized lower cutoff and complete global nonlinear integrals',()=>{
  const r=second.completedOrderTwo.program,m=r.momentRepair,inner=r.innerOrderTwo;
  assert.equal(inner.uncutPicardLowerUsedBeyondCutoff,false);
  assert.deepEqual(inner.lowerCutoff,[first.orderOne.Xkeep,first.orderOne.Xcut]);
  assert.equal(m.finalizedGlobalLowerFieldsUsed,true);assert.equal(m.knownNonlinearMomentsRestrictedToCore,false);
  assert.equal(m.lowerViscosityShiftRetained,true);assert.equal(m.knownLowerIntegrands.length,3);
  for(const id of [m.globalOmegaPressure,m.globalOmegaFlux,...m.knownLowerIntegrals])assert.notEqual(id,G.zero);
  assert.equal(second.secondInner.lambda2,G.mul(G.q(4),G.parameter('h')));
});

test('both actual Picard systems imply their original six inner identities and reject a missing known force',()=>{
  assert.equal(c.innerProofs.length,2);
  for(const proof of c.innerProofs){
    assert.equal(Object.keys(proof.checks).length,6);assert.ok(Object.values(proof.checks).every(p=>p.pass));
    assert.ok(Object.values(proof.sourceChecks).every(Boolean));
    assert.equal(proof.negativeControl.correctlyRejected,true);assert.equal(proof.negativeControl.check.pass,false);
    assert.equal(proof.commonASquared,first.inner.aSquared);
    assert.equal(proof.finitePicardIterateCertifiedAsSolution,false);
  }
});

test('the full pre-heat integration constant, all angular corrections and the actual heat tail are retained',()=>{
  const p=c.conservation.leadingAngularProof;
  assert.equal(p.pass,true);assert.equal(p.constantOfIntegrationIncluded,true);assert.equal(p.heatChangeAloneUsedAsWholeMoment,false);
  assert.notEqual(p.originalRoot,p.heatChangeAndI2);assert.notEqual(p.beforeHeatBody,G.zero);
  assert.equal(p.correctionHistories.B8.actualIncoming,second.originalLeading.pre.discrepancy[1]);
  assert.equal(p.correctionHistories.I1.actualIncoming,second.originalLeading.actualDebts[1]);
  assert.equal(p.terminal.Qp,G.outer.roots.Qp);assert.equal(p.terminal.wait,G.outer.roots.terminalWait);
  assert.ok(Object.values(p.terminal.sourceChecks).every(Boolean));assert.equal(p.terminal.terminalODE.pass,true);
  assert.equal(p.analyticRewrite.verified,true);assert.equal(p.analyticRewrite.argumentIdentity.pass,true);
  assert.ok(Object.values(p.negativeControls).every(v=>v.pass===false));
});

test('the four support rows bind actual endpoints and executed inner, exterior and conservative identities',()=>{
  assert.deepEqual(c.supportRows.map(r=>[r.order,r.component,r.toSymbol]),[[1,'theta','Xb'],[1,'z','Xplus'],[2,'theta','Xplus'],[2,'z','Xplus']]);
  for(const row of c.supportRows){
    assert.equal(row.fromRoot,first.orderOne.Xminus);assert.equal(row.toRoot,row.toSymbol==='Xb'?first.orderOne.Xb:first.orderOne.Xplus);
    assert.equal(row.verified,true);assert.equal(row.evidence.conservativeReducedRoot,G.zero);
    assert.equal(row.evidence.innerPDEVerified,true);assert.equal(row.evidence.sourceOrderVerified,true);
    assert.ok(row.evidence.exteriorTermChecks.every(r=>r.zero));assert.match(row.positionMeaning,/not physical X/);
    assert.equal(G.substitute(row.stressRoot,X,row.fromRoot),G.zero);assert.equal(G.substitute(row.stressRoot,X,row.toRoot),G.zero);
  }
  assert.equal(c.conservation.totals.length,2);assert.ok(c.conservation.totals.every(r=>r.thetaReduced===G.zero&&r.zReduced===G.zero));
  assert.ok(c.conservation.rewriteTrace.length>=20);assert.ok(c.conservation.rewriteTrace.some(r=>r.etaOrder===2));
});

test('compact integrand support is not mistaken for a zero indefinite primitive and copied order proofs fail',()=>{
  const proof=second.stressTwo.supportOrder,t=G.fresh('manufactured_nonzero_prefix'),body=G.choose(t,G.zero,G.one,G.zero,G.step(t),G.zero),prefix=G.integral(body,t,G.zero,X);
  const control=checkActualExteriorZeros(G,[prefix],proof);
  assert.equal(control.pass,false);assert.equal(control.compactIntegrandMistakenForZeroPrimitive,false);
  assert.throws(()=>checkActualExteriorZeros(G,[second.stressTwo.angular],{...proof}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('the Pi2 field graph and reconstructed pressure integrand have the same exact axis derivative',()=>{
  const r=second.orderTwo,actual=G.substitute(G.derivative(r.Pi2,X),X,G.zero),manual=G.substitute(r.pressureDerivative,X,G.zero);
  assert.notEqual(actual,G.zero);assert.notEqual(manual,G.zero);
  assert.equal(sourceGraphPolynomialIdentity(G,G.sub(actual,manual)).pass,true);
  // The n=2 first pressure jet cancels for the actual source; unlike n=1,
  // a nonzero node identifier is not evidence of a nonzero mathematical jet.
  assert.equal(sourceGraphPolynomialIdentity(G,manual).pass,true);
  assert.equal(sourceGraphPolynomialIdentity(G,G.sub(actual,G.add(manual,G.one))).pass,false);
  const dU=G.substitute(G.derivative(r.U2,X),X,G.zero),ddM=G.substitute(G.derivative(G.derivative(r.M2,X),X),X,G.zero);
  assert.equal(sourceGraphPolynomialIdentity(G,G.sub(ddM,dU)).pass,true);
});

test('the live induction gates reject incomplete, copied and mutated function definitions',()=>{
  assert.equal(assertActualFirstOrderCompleted(second.completedOrderOne).nextOrder,2);
  assert.equal(assertActualSecondOrderCompleted(second.completedOrderTwo).nextOrder,3);
  assert.throws(()=>assertActualSecondOrderCompleted({...second.completedOrderTwo}),{code:'PREVIOUS_ORDER_INCOMPLETE'});
  assert.throws(()=>assertActualSecondOrderCompleted(second.completedOrderTwo.preparedSecondInner),{code:'PREVIOUS_ORDER_INCOMPLETE'});
  const system=second.orderTwo.momentSystems[0],old=G.expressionSystems[system].body;
  G.expressionSystems[system].body=G.zero;
  assert.throws(()=>assertActualSecondOrderCompleted(second.completedOrderTwo),{code:'PREVIOUS_ORDER_INCOMPLETE'});
  G.expressionSystems[system].body=old;
  assert.equal(assertActualSecondOrderCompleted(second.completedOrderTwo).nextOrder,3);
  assert.ok(c.sourceGates.every(r=>r.pass));assert.equal(c.sourceGates[1].actualNextSourceGenerated,false);
});

test('shared actual integrands have retained bodies and public input cannot inject a field or completion flag',()=>{
  for(const system of program.expressionSystems){
    assert.equal(system.unspecifiedOracle,false);assert.ok(G.nodes[system.body]);
    assert.ok([...G.freeCoordinates(system.body)].every(id=>system.parameters.includes(id)));
  }
  assert.throws(()=>prepareActualBackgroundMomentCertificate({momentsComplete:true}),{code:'INVALID_INPUT'});
  assert.throws(()=>prepareActualBackgroundMomentCertificate({sourceProfile:'different-profile'}));
  assert.throws(()=>prepareActualBackgroundMomentCertificate({etaOrder:3}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>prepareActualBackgroundMomentCertificate({}, {checkCancelled(){throw Object.assign(Error('cancelled'),{code:'CANCELLED'});}}),{code:'CANCELLED'});
});

test('the public compact receipt hashes a deterministic replay of the whole exact program within the transport cap',async()=>{
  const publicResult=await actualBackgroundMomentCertificate();
  assert.equal(publicResult.pass,true);assert.ok(publicResult.checks.every(r=>r.pass));
  assert.equal(publicResult.graph.sha256,await sha256(initialProgramText));
  assert.equal(publicResult.graph.nodeCount,initialNodes);assert.equal(publicResult.graph.serializedProgramBytes,initialBytes);
  assert.ok(new TextEncoder().encode(JSON.stringify(publicResult)).length<128*1024);
  assert.equal(publicResult.graph.graphIncludedInReceipt,false);
  assert.equal(publicResult.arithmetic.observedNumericDebtValues,false);assert.equal(publicResult.arithmetic.finiteIteratesUsedAsRoot,false);
  assert.deepEqual(publicResult.graph.input,{sourceProfile:publicResult.profileId,terms:0,bits:128,etaOrder:2,heatIterations:0});
});
