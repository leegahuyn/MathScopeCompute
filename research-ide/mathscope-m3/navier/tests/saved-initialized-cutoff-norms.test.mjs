import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {openSavedInitializedSource,savedInitializedSourceProgram} from '../source-saved-initialized-authority.mjs';
import {attachSavedInitializedNormFamily} from '../source-saved-initialized-norm-family.mjs';
import {originalSavedCutoffMinimumIBP,originalSavedCutoffDerivativeDemand,attachSavedInitializedCutoffAuthority,
  assertSavedInitializedCutoffAuthority,constructSavedInitializedCutoffNormProgram,assertSavedInitializedCutoffNormProgram,
  instantiateSavedInitializedCutoffNormProgram,assertSavedInitializedFiniteCutoffNormInstantiation,
  savedInitializedCutoffNormCertificate} from '../source-saved-initialized-cutoff-norms.mjs';

let pending;const records={};
async function setup(){
  if(!pending)pending=(async()=>{
    const cap=await openSavedInitializedSource(),source=savedInitializedSourceProgram(cap),family=attachSavedInitializedNormFamily(cap),
      authority=await attachSavedInitializedCutoffAuthority(family),requests=[{order:0,ibpOrder:1},{order:0,ibpOrder:49001},{order:13,ibpOrder:49001}],
      programs=requests.map(r=>constructSavedInitializedCutoffNormProgram(authority,r));
    return {cap,source,family,authority,programs};
  })();return pending;
}

test('the exact positive kappa gives the minimum finite IBP count without rounding',()=>{
  const wanted=[{numerator:149,denominator:100},{numerator:1,denominator:1},{numerator:0,denominator:1},
    {numerator:999995,denominator:1000000},{numerator:2,denominator:1},{numerator:14900001,denominator:10000000}],
    rows=wanted.map(originalSavedCutoffMinimumIBP);
  assert.deepEqual(rows.map(r=>r.ibpOrder),[49001,1,1,1,100001,49002]);
  assert.deepEqual(rows[0].resultExponent,{numerator:'149',denominator:'100'});
  for(const r of rows)assert.deepEqual(r.kappa,{numerator:'1',denominator:'100000'});
  for(const r of [{numerator:1.49},{denominator:0},{numerator:1,norm:2}])assert.throws(()=>originalSavedCutoffMinimumIBP(r));
  records.minimumRows=rows;
});

test('every finite output retains the complete original radial and temporal derivative demand',()=>{
  const rows=[];for(const m of [0,2,13,101])for(const p of [1,2,49001]){
    const d=originalSavedCutoffDerivativeDemand({order:m,ibpOrder:p});
    assert.equal(d.A1DesiredVelocityOrder,m+2*p+3);assert.equal(d.fastA1DesiredVelocityOrder,m+2*p+4);
    assert.equal(d.A0FullRadialSourceOrder,m+2*p+3);assert.equal(d.fastA1InitialResidualOrder,m+2*p+8);
    assert.equal(d.upstreamTargetWeightedOrder,m+2*p+16);assert.equal(d.upstreamBackgroundSlowOrder,m+2*p+18);
    assert.equal(d.fixedTemporalRadialOutputOrder,m+1);assert.equal(d.fixedPressureRadialOutputOrder,m);
    assert.equal(d.conservativeIntegerSPowerGain,p);assert.equal(d.allFiniteOrdersMaterialized,false);rows.push(d);
  }
  for(const r of [{ibpOrder:0},{ibpOrder:-1},{order:-1},{order:Number.MAX_SAFE_INTEGER},{norm:1},{pole:0}])
    assert.throws(()=>originalSavedCutoffDerivativeDemand(r));
  records.demandRows=rows;
});

test('actual T1 beta gamma and both complete A0 roots bind to the same immutable saved source',async()=>{
  const {cap,source,authority}=await setup();assert.equal(assertSavedInitializedCutoffAuthority(authority),true);
  assert.equal(authority.source.sourceNodePrefixSHA256,cap.source.sourceNodePrefixSHA256);
  assert.deepEqual(authority.actualRoots,cap.actualRoots);assert.equal(source.nodeCount,3615866);
  const b=authority.bodies;
  assert.deepEqual(b.temporal.velocity,cap.actualRoots.temporalVelocity);
  assert.equal(b.temporal.completePotentialAndAllRadialTorusTermsRetained,true);
  assert.equal(source.node(b.temporal.A1).op,'multiply');assert.equal(b.temporal.rawCutoffRemainderDeclaredZero,false);
  assert.equal(b.temporal.thetaDefinition.zeroMode,'The exact normalized Haar mean is projected out.');
  assert.equal(b.temporal.zDefinition.finiteSumDeclaredEqualToLimit,false);
  assert.equal(b.pressureRows[0].A0,cap.actualRoots.temporalPressure.cutoffRemainder);
  assert.equal(b.pressureRows[1].A0,cap.actualRoots.initializedPressure.cutoffRemainder);
  assert.notEqual(b.pressureRows[0].gr,b.pressureRows[1].gr);assert.notEqual(b.pressureRows[0].whole,b.pressureRows[1].whole);
  assert.equal(b.pressureRows[0].rho,b.pressureRows[1].rho);assert.equal(b.pressureRows[0].chiR,b.pressureRows[1].chiR);
  assert.equal(source.node(b.normalization.mass).op,'definite_integral');assert.equal(b.normalization.exactMass,'whole_R rho=1');
  assert.equal(authority.originalSourceFiles.length,7);assert.equal(authority.scope.actualWholeWeightedZeroMomentsAuthenticated,true);
  assert.equal(authority.scope.originalLiveFamilyRuntimeRecreated,false);
});

test('the selected small and original 49001-IBP programs use three closed typed source calls',async()=>{
  const {authority,programs}=await setup();
  for(const p of programs){
    assert.equal(assertSavedInitializedCutoffNormProgram(p),true);assert.equal(p.callGraph.calls.length,3);
    assert.ok(p.scalarProgram.nodes.length<100);assert.equal(p.callGraph.calls[0].producer,'initialized');
    assert.deepEqual(p.callGraph.calls.slice(1).map(c=>c.dependencies),[[0],[0]]);
    for(const output of Object.values(p.outputs)){
      assert.equal(p.scalarProgram.nodes[output.constant].type,'scalar');
      assert.equal(p.scalarProgram.nodes[output.power].type,'natural');assert.equal(p.scalarProgram.nodes[output.pole].type,'natural');
      assert.equal(output.cutoffDeclaredZero,false);assert.deepEqual(output.epsilonExponent,p.derivativeDemand.resultExponent);
    }
    assert.equal(p.outputs.A1.source.actualNode,authority.bodies.temporal.A1);
    assert.equal(p.outputs.fastA1.source.A1,authority.bodies.temporal.A1);
    assert.equal(p.outputs.fastA1.completeSourceDerivativeOrder,p.outputs.A1.completeSourceDerivativeOrder+1);
    assert.equal(p.outputs.postTemporalA0.source.actualNode,authority.bodies.pressureRows[0].A0);
    assert.equal(p.outputs.initializedA0.source.actualNode,authority.bodies.pressureRows[1].A0);
  }
  assert.deepEqual(programs[1].outputs.fastA1.epsilonExponent,{numerator:'149',denominator:'100'});
  assert.equal(programs[1].derivativeDemand.fastA1InitialResidualOrder,98010);
  assert.equal(programs[2].derivativeDemand.fastA1InitialResidualOrder,98023);
});

test('every deferred constant power and pole selects the actual producer schema at its required order',async()=>{
  const {programs}=await setup();
  for(const p of programs){
    const u=p.derivativeDemand.A0FullRadialSourceOrder;
    for(const n of p.scalarProgram.nodes){
      if(n.op!=='source_result')continue;const [call,path]=n.args;assert.ok([0,1,2].includes(call));
      assert.ok(path.every(x=>typeof x==='string'||Number.isSafeInteger(x)));
      if(call===0){assert.ok(['temporalProducts','freshProducts','fullUpdatedMean'].includes(path[0]));
        assert.ok([u,u+1].includes(path[2]));assert.equal(path.at(-1)==='constant'?'scalar':'natural',n.type);}
      else{assert.equal(n.type,'scalar');assert.equal(path.at(-1),'constant');}
    }
    assert.equal(p.callGraph.callerNormValuesOrSourceHashesAccepted,false);
    assert.equal(p.scope.actualFiniteTypedCutoffCompositionExecuted,true);
    assert.equal(p.scope.sameSourceAllFiniteNormRecipeBound,true);
    assert.equal(p.scope.allFiniteCutoffFlatnessByOriginalPositiveIBP,true);
    for(const key of ['originalLiveFamilyRuntimeRecreated','actualHighOrderSourceDerivativeBodiesMaterialized',
      'selectedInputNormProgramExecuted','selectedFixedRadialOperatorNormsExecuted','wholeInitialTangentialResidualClassCertified','completeN6'])
      assert.equal(p.scope[key],false);
  }
});

test('a small positive IBP executes the same-source input AST and both original fixed radial norm producers',async()=>{
  const {programs}=await setup(),finite=await instantiateSavedInitializedCutoffNormProgram(programs[0]);
  assert.equal(assertSavedInitializedFiniteCutoffNormInstantiation(finite),true);
  assert.equal(finite.upstreamProgram.request.order,5);assert.equal(finite.upstreamProgram.callGraph.calls.length,13);
  assert.equal(finite.upstreamProgram.scope.actualSavedSourceScalarNormCompositionExecuted,true);
  assert.deepEqual(finite.fixedRadialPrograms.map(p=>p.request.order),[1,0]);
  for(const r of finite.fixedRadialPrograms){assert.equal(r.request.ibpOrder,1);assert.ok(r.checks.every(c=>c.pass));
    assert.equal(r.source.parameterExpressionSHA256,finite.source.parameterExpressionSHA256);}
  assert.equal(finite.sourceResults.length,programs[0].scalarProgram.sourceResultNodeCount);
  assert.ok(finite.naturalResults.length>=12);assert.equal(finite.sourceNormNumbersInvented,false);
  assert.equal(finite.scope.actualFixedRadialOperatorProgramsExecuted,true);
  assert.equal(finite.scope.actualHighOrderSourceDerivativeBodiesMaterialized,false);
  records.finite=finite;
});

test('insufficient finite budgets fail before any high-order source expansion',async()=>{
  const {programs}=await setup();
  await assert.rejects(()=>instantiateSavedInitializedCutoffNormProgram(programs[1]),{code:'RESOURCE_LIMIT'});
  await assert.rejects(()=>instantiateSavedInitializedCutoffNormProgram(programs[0],{norm:1}));
  assert.equal(assertSavedInitializedCutoffNormProgram(programs[1]),true);
});

test('private source capabilities reject copies replacement roots and changed typed selectors',async()=>{
  const {cap,family,authority,programs}=await setup();
  for(const fake of [{},structuredClone(family),cap,{source:authority.source}])
    await assert.rejects(()=>attachSavedInitializedCutoffAuthority(fake));
  for(const fake of [{},structuredClone(authority),{...authority},family])
    assert.throws(()=>constructSavedInitializedCutoffNormProgram(fake));
  for(const fake of [{},structuredClone(programs[1]),{...programs[1]}])assert.throws(()=>assertSavedInitializedCutoffNormProgram(fake));
  const A1=authority.bodies.temporal.A1;authority.bodies.temporal.A1=0;
  assert.throws(()=>assertSavedInitializedCutoffAuthority(authority));authority.bodies.temporal.A1=A1;
  const p=programs[1],node=p.scalarProgram.nodes.find(n=>n.op==='source_result'),old=node.args[1].at(-1);
  node.args[1][node.args[1].length-1]='user_norm';assert.throws(()=>assertSavedInitializedCutoffNormProgram(p));
  node.args[1][node.args[1].length-1]=old;assert.equal(assertSavedInitializedCutoffNormProgram(p),true);
  for(const request of [{norm:1},{producer:()=>1},{pole:0},{ibpOrder:0}])assert.throws(()=>constructSavedInitializedCutoffNormProgram(authority,request));
  records.negativeControls={copiedFamily:4,copiedAuthority:4,copiedProgram:3,changedActualRoot:1,changedTypedSelector:1,callerNormInput:4};
});

test('lossless certificates preserve all actual bodies typed source calls and distinct execution scopes',async()=>{
  const {cap,authority,programs}=await setup(),certificates=await Promise.all(programs.map(savedInitializedCutoffNormCertificate));
  for(const [j,c]of certificates.entries()){
    assert.deepEqual(c.program,programs[j]);assert.equal(c.graph.producerCallCount,3);assert.match(c.graph.sha256,/^[0-9a-f]{64}$/);
    assert.equal(c.exactSameSourceDeferredNormExpressions,true);assert.equal(c.serializedCertificateIsNotPrivateSourceAuthority,true);
  }
  records.result={schema:'MathScope.N6.SavedInitializedCutoffObservedGate/1',source:cap,authority,certificates,
    minimumRows:records.minimumRows,demandRows:records.demandRows,finite:records.finite,negativeControls:records.negativeControls,
    selectedNodeBindings:authority.bodies.selectedNodeBindings,
    processObservation:{pid:process.pid,rssBytes:process.memoryUsage().rss,maxRSSBytes:process.resourceUsage().maxRSS*1024},
    actualSavedSourcePositiveCutoffBindingExecuted:true,actualSelectedFixedRadialNormProducersExecuted:!!records.finite,
    actualSourceAllFinitePositiveIBPRecipeBound:true,actualHighOrderSourceDerivativeBodiesMaterialized:false,
    originalPrivateFamilyRuntimeHydrated:false,wholeInitialTangentialResidualClassCertified:false,completeN6:false};
});

after(async()=>{
  if(process.env.MATHSCOPE_SAVED_CUTOFF_DIRECTORY&&records.result)await writeFile(
    process.env.MATHSCOPE_SAVED_CUTOFF_DIRECTORY+'/saved-initialized-cutoff-norms.json',JSON.stringify(records.result,null,2)+'\n',{flag:'wx'});
});
