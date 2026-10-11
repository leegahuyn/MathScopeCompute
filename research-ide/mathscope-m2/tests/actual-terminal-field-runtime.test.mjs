import test from 'node:test';
import assert from 'node:assert/strict';
import {getExamples,validateRequest} from '../navier/index.mjs';
import {M2_VERSION,executeDomain,listCapabilities,listExamples} from '../core/registry.mjs';
import {readRational,qcompare,qdiv,rational as Q,qtext} from '../navier/actual-continuation-arithmetic.mjs';

const KIND='ns.actual-terminal-field-scaled-enclosure',example=getExamples().find(e=>e.request.kind===KIND);

test('the installed terminal field entry declares its complete directed coefficient scope',async()=>{
  assert.equal(M2_VERSION,'0.3.11');assert.ok(example);assert.equal(example.request.precision.mode,'DIRECTED_BIGINT');
  assert.equal(example.request.input.precisionBits,192);assert.equal(example.request.budget.maxMillis,60000);
  const p=validateRequest(example.request);assert.equal(p.ok,true);assert.equal(p.precision.actualCompleteTerminalFAndNineSlowJetsEnclosed,true);
  assert.equal(p.precision.originalPositiveAmplitudeRetained,true);assert.equal(p.precision.originalPositiveHRetained,true);
  assert.equal(p.precision.rawRelativePrecisionClaimed,false);assert.equal(p.precision.actualWholeDomainFNumericallyEnclosed,false);
  assert.equal(p.precision.actualWholeCovarianceNumericallyEnclosed,false);assert.equal(p.precision.actualSlowPulseDerivativeNumericallyEnclosed,false);
  assert.equal(p.precision.wholeM2Complete,false);assert.equal(p.precision.m3MayStart,false);
  const capabilities=await listCapabilities(),installed=await listExamples();
  assert.ok(capabilities.domains.ns.kinds.includes(KIND));assert.ok(installed.some(e=>e.request.kind===KIND));
  assert.equal(capabilities.domains.ns.terminalFieldNumericalExtension.version,'0.3.11');
  assert.equal(capabilities.domains.ns.terminalFieldNumericalExtension.heatToleranceDivisor,'1048576');
  assert.equal(capabilities.domains.ns.fullN4,false);assert.equal(capabilities.domains.ns.fullN5,false);
});

test('field precision uses bits minus48 and exactly nested heat and moment tolerances',()=>{
  for(const bits of [96,192,512]){
    const tolerance='1/'+(1n<<BigInt(bits-48)),request={...example.request,input:{...example.request.input,precisionBits:bits,tolerance},precision:{mode:'DIRECTED_BIGINT',bits}},
      p=validateRequest(request);assert.equal(p.ok,true);
    assert.equal(p.precision.minimumWidthTolerance,tolerance);
    assert.equal(p.precision.heatCoefficientTolerance,qtext(qdiv(readRational(tolerance),Q(1n<<20n))));
    assert.equal(p.precision.heatMomentTolerance,qtext(qdiv(readRational(p.precision.heatCoefficientTolerance),Q(64))));
    const nestedFloor=Q(1,1n<<BigInt(bits-16));
    assert.ok(qcompare(readRational(p.precision.heatCoefficientTolerance),nestedFloor)>=0);
    assert.ok(qcompare(readRational(p.precision.heatMomentTolerance),nestedFloor)>=0);
    const narrower={...request,input:{...request.input,tolerance:'1/'+(1n<<BigInt(bits-47))}};
    assert.equal(validateRequest(narrower).code,'PRECISION_REQUIRED');
  }
  const implicitBits={kind:KIND,input:{tolerance:'1/'+(1n<<48n)},precision:{mode:'AUTO',bits:96}};
  assert.equal(validateRequest(implicitBits).precision.arithmeticBits,96);
  assert.equal(validateRequest({...example.request,precision:{mode:'FLOAT64'}}).code,'PRECISION_REQUIRED');
  assert.equal(validateRequest({...example.request,precision:{mode:'DIRECTED_BIGINT',bits:256}}).code,'INVALID_INPUT');
});

test('invalid or infeasible terminal requests stop before any source allocation',async()=>{
  let sourceChecks=0;const context={checkCancelled(){sourceChecks++;}};
  for(const change of [{tolerance:null},{tolerance:0.001},{tolerance:'0'},{tolerance:'2'},{maxTerms:0},{maxTerms:257},
    {maxTerms:null},{precisionBits:95},{precisionBits:513},{precisionBits:null},
    {h:0},{B:1},{argument:'1/64'},{ellExact:'1'},{witness:{}},{heatTolerance:'1/1000'},{m3MayStart:true}]){
    const request={...example.request,input:{...example.request.input,...change}};
    assert.equal(validateRequest(request).code,'INVALID_INPUT');
    assert.equal((await executeDomain(request,context)).status,'FAILED');
  }
  const cases=[
    [{...example.request,input:{...example.request.input,tolerance:'1/'+(1n<<145n)}},'PRECISION_REQUIRED'],
    [{...example.request,input:{...example.request.input,tolerance:'1/'+'9'.repeat(33000)}},'BUDGET_EXCEEDED'],
    [{...example.request,budget:{...example.request.budget,maxOperations:49999999}},'BUDGET_EXCEEDED']
  ];
  for(const [request,status]of cases){assert.equal(validateRequest(request).code,status);assert.equal((await executeDomain(request,context)).status,status);}
  assert.equal(sourceChecks,0);
});

test('a valid worker-domain envelope reaches the cancellation gate without executing the source',async()=>{
  let checks=0;await assert.rejects(executeDomain(example.request,{checkCancelled(){checks++;throw Object.assign(Error('Pre-allocation test cancellation'),{code:'CANCELLED'});}}),{code:'CANCELLED'});
  assert.equal(checks,1);
  // A successful actual worker execution is a separate, explicitly measured
  // source run after rebuilding. No private source token is issued here.
});
