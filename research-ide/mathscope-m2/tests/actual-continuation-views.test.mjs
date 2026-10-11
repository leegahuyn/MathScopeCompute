import test from 'node:test';
import assert from 'node:assert/strict';
import {actualContinuationPanels} from '../visualization/actual-continuation-panels.mjs';
import {listM2Panels} from '../visualization/m2-views.mjs';
import {validateRequest,getExamples} from '../navier/index.mjs';
import {executeDomain} from '../core/registry.mjs';
import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';

// Rendering fixtures are not executed mathematical evidence or source tokens.
const box=(lower,upper)=>({lower,upper});
function massFixture(){
  const data={schema:'MathScope.ActualCutoffMassEnclosure/1',status:'COMPLETED',pass:true,sourceProfile:'display-only-fixture',parameterExpressionSHA256:'display-only',
    checks:[],sourceProgram:{sha256:'display-only-original'},bindingProgram:{sha256:'display-only-binding'},
    values:{normalizedTransverseMass:box('9/10','91/100'),transverseMass:box('9/100','91/1000'),normalizedLongitudinalSquareMass:box('54/100','55/100'),
      longitudinalSquareMass:{scaleEnclosure:box('1/100','11/1000'),absoluteEnclosure:box('54/10000','605/100000')}},
    sigmaIntegral:{errorBudget:{toleranceMet:true,rounding:'1/100000000',quadrature:'1/1000000'}},
    scope:{actualSourceCutoffFactorsNumericallyEnclosed:true,wholeGNUMComplete:false,hNumericallyReplacedByZero:false,actualSlowPulseDerivativeNumericallyEnclosed:false}};
  return {status:'COMPLETED',request:{kind:'ns.actual-cutoff-masses',input:{ellExact:'1'}},result:{status:'COMPLETED',results:data}};
}
function bandFixture(){
  return {status:'COMPLETED',request:{kind:'ns.actual-band-admissibility',input:{ellExact:'1'}},result:{status:'COMPLETED',results:{
    schema:'MathScope.ActualCovarianceBandAdmissibilityCertificate/1',pass:true,checks:[],sourceBinding:{sourceProfile:'display-only-fixture',parameterExpressionSHA256:'display-only'},
    graph:{sha256:'display-only'},decision:{uniformTheoremNonmembershipProved:true,actualDeterminantSign:'UNKNOWN',actualWeightSigns:['UNKNOWN','UNKNOWN'],m3MayStart:false},
    proof:{positiveH:{strictRange:'0<h<2^-4096',zeroSubstitutionUsed:false},signBoundary:'A domain exclusion alone is not a weight-sign proof.'}}}};
}
const read=(job,path)=>path.split('.').reduce((v,k)=>v?.[k],job);

test('all displayed interval endpoints and decision values bind exact result paths',()=>{
  for(const fixture of [massFixture(),bandFixture()])for(const p of actualContinuationPanels(fixture)){
    for(let i=0;i<p.table.rows.length;i++)for(let j=0;j<p.table.rows[i].length;j++){
      const path=p.table.cellSourcePaths[i][j];if(path!==null)assert.deepEqual(p.table.rows[i][j],read(fixture,path));
    }
    assert.equal(p.scene.points.length,0);assert.equal(p.observation.numericalSensitivityQuadrature,false);
    assert.equal(p.observation.globalPhysicalResidualCertified,false);assert.equal(p.observation.flatErrorCertified,false);
    assert.equal(p.observation.positiveWeightsOfExercisedMemberCertified,false);
  }
});

test('the installed M2 view exposes three cutoff panels and two domain panels without changing source values',()=>{
  for(const [job,count]of [[massFixture(),3],[bandFixture(),2]]){
    const before=canonicalStringify(job),panels=actualContinuationPanels(job);
    assert.equal(panels.length,count);assert.equal(listM2Panels(job).length,count);
    assert.equal(canonicalStringify(job),before);
  }
});

test('stale editor values, failed runs, absent bounds and unverified inner results are not displayed as current evidence',()=>{
  const job=massFixture();
  assert.deepEqual(actualContinuationPanels(job,{currentEditorMatches:false}),[]);
  assert.deepEqual(actualContinuationPanels(job,{currentRequest:{...job.request,input:{ellExact:'2'}}}),[]);
  for(const field of ['status','result.status']){
    const copy=structuredClone(job);if(field==='status')copy.status='FAILED';else copy.result.status='FAILED';
    assert.deepEqual(actualContinuationPanels(copy),[]);
  }
  const noPass=structuredClone(job);noPass.result.results.pass=false;assert.deepEqual(actualContinuationPanels(noPass),[]);
  const noBounds=structuredClone(job);delete noBounds.result.results.values;assert.deepEqual(actualContinuationPanels(noBounds),[]);
});

test('display reduction selects existing rows without modifying exact rational bounds or source hashes',()=>{
  const job=massFixture(),before=canonicalStringify(job),panels=actualContinuationPanels(job,{maxRows:2});
  assert.equal(panels[0].table.rows.length,2);assert.equal(panels[0].table.truncated,true);
  assert.equal(panels[0].table.totalRows,5);assert.equal(panels[0].table.exactValuesUnabridged,true);
  assert.equal(canonicalStringify(job),before);
});

test('new examples declare genuine interval precision or exact domain arithmetic, with actionable invalid-input states',async()=>{
  const examples=getExamples().filter(e=>['ns.actual-cutoff-masses','ns.actual-band-admissibility'].includes(e.request.kind));
  assert.equal(examples.length,2);for(const e of examples)assert.equal(validateRequest(e.request).ok,true);
  const mass=examples.find(e=>e.request.kind==='ns.actual-cutoff-masses').request;
  assert.equal(validateRequest({...mass,input:{...mass.input,tolerance:0.01}}).code,'INVALID_INPUT');
  assert.equal(validateRequest({...mass,input:{...mass.input,maxCells:7}}).code,'INVALID_INPUT');
  assert.equal(validateRequest({...mass,input:{...mass.input,tolerance:'1/'+(1n<<200n)}}).code,'PRECISION_REQUIRED');
  assert.equal(validateRequest({...mass,precision:{mode:'DIRECTED_BIGINT',bits:128}}).code,'INVALID_INPUT');
  assert.equal(validateRequest({...mass,precision:{mode:'FLOAT64'}}).code,'PRECISION_REQUIRED');
  assert.equal(validateRequest({...mass,input:{...mass.input,ellExact:'2'}}).code,'BUDGET_EXCEEDED');
  assert.equal(validateRequest({...mass,input:{...mass.input,h:0}}).code,'INVALID_INPUT');
  for(const ellExact of [null,1,false,{},'bad']){
    const invalid={...mass,input:{...mass.input,ellExact}};
    assert.equal(validateRequest(invalid).code,'INVALID_INPUT');
    const result=await executeDomain(invalid);
    assert.equal(result.status,'FAILED');assert.equal(result.contractReport.code,'INVALID_INPUT');
  }
  const overBudget={...mass,input:{...mass.input,tolerance:'1/'+'9'.repeat(33000)}};
  assert.equal(validateRequest(overBudget).code,'BUDGET_EXCEEDED');
  assert.equal((await executeDomain(overBudget)).status,'BUDGET_EXCEEDED');
  const band=examples.find(e=>e.request.kind==='ns.actual-band-admissibility').request;
  assert.equal(validateRequest({...band,precision:{mode:'DIRECTED_BIGINT',bits:192}}).code,'PRECISION_REQUIRED');
});
