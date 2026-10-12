import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {rational,readRational,qcompare,qsub,qadd,qtext} from '../../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';
import {widenSourceInterval,prepareActualSourceNearTerminal,assertActualSourceNearTerminal,actualSourceNearTerminalCertificate} from '../source-near-terminal.mjs';

let promise,lastMemoryCheck=0;
function observe(extra={}){
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,
    rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  process.stdout.write('# N8_NEAR_TERMINAL '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes})+'\n');
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)
    throw Object.assign(Error('The owned source process exceeded its memory gate.'),{code:'RESOURCE_LIMIT'});
}
function source(){return promise??=Promise.resolve().then(()=>{
  observe({stage:'n8-near-terminal-source-start'});
  return prepareActualSourceNearTerminal({}, {onProgress:observe,checkCancelled:()=>{
    if(Date.now()-lastMemoryCheck>1000){lastMemoryCheck=Date.now();observe({stage:'n8-near-terminal-memory-checkpoint'});}
  }});
});}

test('kernel: exact interval widening uses both endpoints and never substitutes a midpoint',()=>{
  const r=widenSourceInterval({lower:'1/3',upper:'2/3'},'1/8',128);
  assert.equal(r.lower,'5/24');assert.equal(r.upper,'19/24');assert.equal(r.remainderAbsUpper,'1/8');
  assert.ok(r.displayEnclosure[0]<=5/24);assert.ok(r.displayEnclosure[1]>=19/24);assert.equal(r.midpointUsed,false);
  const negative=widenSourceInterval({lower:'-4',upper:'-4'},'1/4');
  assert.equal(negative.lower,'-17/4');assert.equal(negative.upper,'-15/4');
  for(const [interval,error,bits]of [[{lower:'2',upper:'1'},'0',256],[{lower:'0',upper:'1'},'-1',256],[{lower:'0',upper:'1'},'0',64]])
    assert.throws(()=>widenSourceInterval(interval,error,bits));
});

test('kernel: caller field values, changed constants and fabricated localization cannot enter the source path',async()=>{
  for(const input of [{h:0},{velocity:[0,0,0]},{X:2},{s:20},{decimalTaus:['0']},{depths:[0,0]},{bits:64}])
    await assert.rejects(prepareActualSourceNearTerminal(input));
  await assert.rejects(prepareActualSourceNearTerminal({}, {localization:{}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('source: the same authenticated common6 localization supplies every near-terminal observation',async()=>{
  const p=await source();assert.equal(assertActualSourceNearTerminal(p),true);
  assert.equal(p.sourceBinding.common6FamilyGraph.sha256,'bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219');
  assert.ok(p.checks.every(row=>row.pass));assert.equal(p.localizationBinding.sourceCutoffConstructed,true);
  assert.equal(p.scope.actualThreeComponentNormalizedEnclosures,true);
  assert.equal(p.scope.fullN6FinalFieldConstructed,false);assert.equal(p.scope.originalN804CriterionComplete,false);
});

test('source: full leading U, M and radial velocity reduce through their actual source branches',async()=>{
  const p=await source(),binding=p.leadingBinding;
  assert.ok(Object.values(binding.parameterChecks).every(Boolean));assert.ok(binding.checks.every(row=>row.pass));
  assert.ok(binding.exactChecks.U.pass&&binding.exactChecks.M.pass&&binding.exactChecks.VOverX.pass&&binding.exactChecks.etaZero.pass);
  assert.equal(binding.noncoreMassIntegralsDiscarded,false);assert.equal(binding.fullLeadingFunctionReplacedByToy,false);
  assert.ok([0,1].every(j=>binding.trace.some(row=>row.bump===j)));
  assert.equal(binding.sourceRoots.globalM,p.localization.inner.family.prepared.bootstrap.finalM);
  assert.equal(binding.sourceRoots.globalVOverX,p.localization.inner.family.prepared.bootstrap.finalv);
});

test('source: fresh core distinguishes U divided by positive j0 from ordinary average eta derivative',async()=>{
  const p=await source(),core=p.leading.freshCore;
  assert.deepEqual(core.request.eta,{kind:'J_SCALED',value:'0'});assert.equal(core.request.etaOrder,1);
  assert.equal(core.axial.actualValues[0].normalization,'DIVIDE_BY_POSITIVE_J0');
  assert.equal(core.axial.actualValues[1].normalization,'ORDINARY_ETA_DERIVATIVE');
  assert.ok(qcompare(readRational(p.leading.intervals.radial.upper),rational(-3))<0);
  assert.ok(qcompare(readRational(p.leading.intervals.azimuthal.lower),rational(1,2))>0);
  assert.ok(qcompare(readRational(p.leading.intervals.axial.lower),rational(3,4))>0);
  assert.equal(core.scope.positiveBanachErrorRetained,true);assert.equal(core.scope.actualPressureAnalyticErrorRetained,true);
});

test('source: all three components share one exact positive tau and their own complete interval',async()=>{
  const p=await source();assert.deepEqual(p.rows.map(row=>row.depth),[0,2,4,8,12]);
  for(const row of p.rows){
    assert.equal(row.primaryTime.name,'s=-log(tau)');assert.equal(row.tau.exactSign,'POSITIVE');
    assert.equal(row.samePointAndTimeForAllComponents,true);assert.equal(row.unitLocalizationPlateau,true);
    assert.equal(row.underflowReplacedByZero,false);assert.equal(row.tau.binary64,null);assert.equal(row.time.binary64,null);
    assert.deepEqual(row.components.map(c=>c.name),['radial','azimuthal','axial']);
    const error=rational(1,1n<<BigInt(row.depth+2));
    for(const component of row.components){
      assert.equal(component.interval.lower,qtext(qsub(readRational(component.leadingInterval.lower),error)));
      assert.equal(component.interval.upper,qtext(qadd(readRational(component.leadingInterval.upper),error)));
      assert.equal(component.interval.remainderAbsUpper,qtext(error));assert.equal(component.interval.midpointUsed,false);
      assert.equal(component.physicalVelocity.binary64,null);
    }
  }
});

test('source: the separate radial 3h bound and normalized-then-physical scaling are retained',async()=>{
  const p=await source(),G=p.G,{h,A,C,eScale,j0,radialScale}=p.constants,block=p.tail.actualFiniteBlock;
  assert.equal(block.derivativeOrder,0);assert.equal(block.physicalRadialNormalizedBound.coefficient,C);
  assert.equal(block.physicalRadialNormalizedBound.power,G.mul(G.q(3),h));
  assert.equal(block.tangentialAxialBound.power,G.mul(G.q(2),h));
  assert.equal(block.scope.unboundedDiagonalInductionCertified,false);
  assert.equal(p.tail.actualPrivateAllOrderSourceInductionConsumed,true);
  assert.deepEqual(block.finite.map(row=>row.order),[1,2]);assert.equal(block.tailStarts,3);
  for(const row of p.rows){
    const s=row.primaryTime.s;assert.equal(row.commonPhysicalScale,G.exp(G.mul(A,s)));
    assert.equal(row.components[0].normalizedVelocity.positiveScale,G.mul(G.exp(G.neg(G.mul(h,s))),radialScale));
    assert.equal(row.components[1].normalizedVelocity.positiveScale,eScale);assert.equal(row.components[2].normalizedVelocity.positiveScale,j0);
    for(const component of row.components)
      assert.equal(component.physicalVelocity.positiveScale,G.mul(row.commonPhysicalScale,component.normalizedVelocity.positiveScale));
  }
});

test('source: prescribed decimals are exact initial zeros while nonzero inner-path observations keep the final-field dependency',async()=>{
  const p=await source();assert.deepEqual(p.decimalSamples.slice(0,4).map(row=>row.input),['1e-2','1e-4','1e-8','1e-12']);
  for(const row of p.decimalSamples){
    assert.equal(row.primaryTime.name,'s=-log(tau)');assert.equal(row.localizedZeroBranchEvaluated,true);
    assert.deepEqual(row.normalizedVelocity.components,['0','0','0']);assert.deepEqual(row.physicalVelocity.components,['0','0','0']);
    assert.equal(row.physicalScalingAppliedAfterNormalizedEvaluation,true);assert.equal(row.missingSourceValuesSetToZero,false);
  }
  assert.equal(p.decimalSamples.at(-1).displayTimeRoundedToOne,true);assert.equal(p.decimalSamples.at(-1).displayTau,null);
  assert.equal(p.claims.finalLocalizedVelocity.sameOriginalFinalN6InstanceConstructed,false);
  assert.equal(p.claims.finalLocalizedVelocity.dependencies.length,2);assert.equal(p.scope.allSpaceSourceVelocityEvaluator,false);
  assert.equal(p.scope.pressureEvaluated,false);assert.equal(p.scope.fullLocalizedForceConstructed,false);
});

test('source: removing the radial scale or a tail cannot acquire source authority',async()=>{
  const p=await source();assert.throws(()=>assertActualSourceNearTerminal({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,key,value]of [[p.rows[0].components[0].normalizedVelocity,'positiveScale',p.G.one],
    [p.tail.actualFiniteBlock.physicalRadialNormalizedBound,'power',p.G.mul(p.G.q(2),p.constants.h)],
    [p.scope,'fullN6FinalFieldConstructed',true]]){
    const previous=object[key];object[key]=value;
    try{assert.throws(()=>assertActualSourceNearTerminal(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[key]=previous;}
  }
  assert.equal(assertActualSourceNearTerminal(p),true);
});

test('source: full exact observation program and unexecuted obligations survive export',async()=>{
  const p=await source(),record=await actualSourceNearTerminalCertificate(p),program=record.formulaProgram;
  assert.equal(record.verification.checksPass,true);assert.equal(program.primaryTimeVariable,'s=-log(tau)');
  assert.equal(program.allSelectedObservationRootsHaveNoFreeCoordinates,true);assert.equal(program.underflowReplacedByZero,false);
  for(const row of record.rows){
    assert.equal(program.sourceNodeIds[program.roots['s_'+row.depth]],row.primaryTime.s);
    assert.equal(program.sourceNodeIds[program.roots['tau_'+row.depth]],row.tau.expression);
    for(const component of row.components)
      assert.equal(program.sourceNodeIds[program.roots['physical_'+component.name+'_'+row.depth]],component.physicalVelocity.positiveScale);
  }
  assert.equal(record.scope.newLeanKernelProof,false);assert.equal(record.scope.wholeM3Complete,false);
  if(process.env.M3_N8_NEAR_TERMINAL_EVIDENCE)writeFileSync(process.env.M3_N8_NEAR_TERMINAL_EVIDENCE,JSON.stringify(record,null,2)+'\n');
  observe({stage:'n8-near-terminal-certificate-written'});
});
