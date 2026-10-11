import test from 'node:test';
import assert from 'node:assert/strict';
import {recomputePhysicalCenterUnscaledDerivativeBounds as recompute} from '../actual-physical-center-unscaled-numerics.mjs';
import {numericalExponentialArithmetic,closedNumericalExponentialEndpoint} from '../actual-numerical-exponential-arithmetic.mjs';
import {readRational,qsub,qtext} from '../actual-continuation-arithmetic.mjs';

const closed=(lower,upper=lower)=>({lower:{rational:lower},upper:{rational:upper}});
function fixture({coefficient=['1','1'],scale=closed('2','3'),coordinate={lower:'2',upper:'3'},coordinateDefinition='value',derivative='R',sign=1,sourceRoot=17}={}){
  const row={quantity:'pulse',sign,component:0,derivative,order:1,directedInterval:{lower:coefficient[0],upper:coefficient[1]},
    width:qtext(qsub(readRational(coefficient[1]),readRational(coefficient[0]))),toleranceMet:true};
  row.rowKey=[row.quantity,row.sign??'physical',row.component,row.derivative].join(':');
  const width=qtext(qsub(readRational(coordinate.upper),readRational(coordinate.lower))),
    installed={quantity:row.quantity,sign:row.sign,component:0,derivative,rowKey:row.rowKey,sourceRoot,positiveExactScale:sourceRoot,
      interval:{...structuredClone(scale),coordinateDefinition,coordinate:structuredClone(coordinate),coordinateWidth:width,toleranceMet:true},
      coordinateDefinition,coordinate,logCoordinateWidth:width,toleranceMet:true,actualScaleRecipeBound:true};
  return {numericalRows:[row],originalBindings:[{rowKey:row.rowKey,positiveExactScale:sourceRoot}],installedScaleRows:[installed],controls:{precisionBits:192,tolerance:'8'}};
}
const run=(f,context={})=>recompute(f.numericalRows,f.originalBindings,f.installedScaleRows,f.controls,context);
const invalid=f=>assert.throws(()=>run(f),{code:'INVALID_INPUT'});
const freeze=x=>{if(x&&typeof x==='object'){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;};

test('exact rational positive, negative, crossing and zero products retain every endpoint',()=>{
  const cases=[{coefficient:['2/3','4/3'],expected:closed('4/3','4')},
    {coefficient:['-4/3','-2/3'],expected:closed('-4','-4/3')},
    {coefficient:['-2','3'],expected:closed('-6','9')},
    {coefficient:['0','0'],expected:closed('0')}];
  for(const c of cases){const r=run(fixture(c));assert.equal(r.pass,true);assert.deepEqual(r.rows[0].rawDerivativeInterval,c.expected);}
});

test('astronomically huge and small scales retain signed closed endpoints without underflow',()=>{
  const huge={exp:{exp:{rational:'1000'}}},tiny={exp:{neg:{exp:{rational:'1000'}}}},N=numericalExponentialArithmetic({precisionBits:256});
  for(const[point,definition]of[[huge,'log^2(value)'],[tiny,'log^1(-log(value))']]){
    for(const s of['1','-1']){
      const f=fixture({coefficient:[s,s],scale:{lower:point,upper:point},coordinate:{lower:'1000',upper:'1000'},coordinateDefinition:definition}),r=run(f),out=r.rows[0].rawDerivativeInterval;
      const expected=s==='1'?point:{neg:point};
      assert.deepEqual(out,{lower:expected,upper:expected});
      assert(closedNumericalExponentialEndpoint(out.lower)&&closedNumericalExponentialEndpoint(out.upper));
      assert.equal(N.compareEndpoints(out.lower,{rational:'0'}),s==='1'?1:-1);
      assert.equal(r.arithmetic.sourceIntegralOrParameterEvaluated,false);
      assert.equal(r.arithmetic.precisionBits,384);assert(r.arithmetic.memoEntries<=30000);
    }
  }
});

test('row order is the fresh coefficient order and equal roots may serve distinct typed keys',()=>{
  const a=fixture({derivative:'R',sign:-1}),b=fixture({derivative:'Z',sign:null}),f={
    numericalRows:[a.numericalRows[0],b.numericalRows[0]],originalBindings:[b.originalBindings[0],a.originalBindings[0]],
    installedScaleRows:[b.installedScaleRows[0],a.installedScaleRows[0]],controls:a.controls};
  const r=run(f);assert.deepEqual(r.rows.map(x=>x.rowKey),f.numericalRows.map(x=>x.rowKey));
  assert.match(r.rows[1].rowKey,/:physical:/);assert.equal(r.rows[0].sourceRoot,r.rows[1].sourceRoot);
});

test('all input layers remain unchanged and outputs do not alias installed or coefficient intervals',()=>{
  const f=freeze(fixture()),before=JSON.stringify(f),progress=[],r=run(f,{onProgress:x=>progress.push(x)});
  assert.equal(JSON.stringify(f),before);assert.equal(progress.length,2);
  r.rows[0].positiveScaleInterval.lower.rational='999';
  r.rows[0].scaledCoefficientInterval.lower='999';r.rows[0].positiveScaleCoordinate.coordinate.lower='999';
  assert.equal(JSON.stringify(f),before);assert.equal(r.sourceAuthenticated,false);
  assert.equal(r.scope.privateSourceTokenCreated,false);assert.equal(r.scope.actualSourceGraphReconstructed,false);
  assert.equal(r.arithmetic.installedPositiveIntervalsRecomputed,false);assert(r.checks.every(c=>c.pass));
  assert.equal(r.precision.rawDerivativeRelativeToleranceGuaranteed,false);assert.equal(r.precision.rawDerivativeAbsoluteWidthRequested,false);
  assert.equal(r.sourceRequirements.installedCoordinateToEndpointRelationMustBeAuthenticatedByWrapper,true);
});

test('duplicates, missing rows, incorrect keys and mismatched source roots are rejected',()=>{
  for(const name of['numericalRows','originalBindings','installedScaleRows']){
    const f=fixture();f[name].push(structuredClone(f[name][0]));invalid(f);
    const empty=fixture();empty[name]=[];invalid(empty);
  }
  for(const mutate of[
    f=>{f.installedScaleRows[0].sourceRoot++;},f=>{f.installedScaleRows[0].positiveExactScale++;},
    f=>{f.originalBindings[0].positiveExactScale=-1;},f=>{f.numericalRows[0].rowKey='incorrect';},
    f=>{f.installedScaleRows[0].derivative='Z';},f=>{f.installedScaleRows[0].sign=0;},
    f=>{f.numericalRows[0].component=3;},f=>{f.originalBindings[0].rowKey='missing-key';}]){
    const f=fixture();mutate(f);invalid(f);
  }
});

test('reversed, nonpositive and caller-changed endpoint types fail before any successful product',()=>{
  const cycle={};cycle.exp=cycle;
  const invalidEndpoints=['2',2,{rational:2},{rational:'2',extra:true},{parameter:'h'},{integral:17},{exp:'2'},cycle];
  for(const endpoint of invalidEndpoints){const f=fixture();f.installedScaleRows[0].interval.lower=endpoint;invalid(f);}
  for(const box of[closed('4','3'),closed('0','3'),closed('-1','3'),closed('-3','-2')]){
    const f=fixture();Object.assign(f.installedScaleRows[0].interval,box);invalid(f);
  }
  for(const mutate of[
    f=>{f.numericalRows[0].directedInterval.lower={rational:'1'};},
    f=>{f.numericalRows[0].directedInterval.upper=1;},
    f=>{f.numericalRows[0].directedInterval.lower='2';},
    f=>{f.numericalRows[0].width='2';}]){const f=fixture();mutate(f);invalid(f);}
});

test('exact coordinate metadata is checked and narrower installed precision requires new evidence',()=>{
  for(const mutate of[
    f=>{f.installedScaleRows[0].logCoordinateWidth='0';},
    f=>{f.installedScaleRows[0].coordinate.lower='4';},
    f=>{f.installedScaleRows[0].interval.coordinateWidth='0';},
    f=>{f.installedScaleRows[0].interval.coordinate.lower='0';},
    f=>{f.installedScaleRows[0].coordinateDefinition='caller_function(value)';},
    f=>{f.installedScaleRows[0].actualScaleRecipeBound=false;},
    f=>{f.installedScaleRows[0].toleranceMet=false;}]){const f=fixture();mutate(f);invalid(f);}
  const scaleTooWide=fixture();scaleTooWide.controls.tolerance='1/2';assert.throws(()=>run(scaleTooWide),{code:'PRECISION_REQUIRED'});
  const coefficientTooWide=fixture({coefficient:['0','1'],scale:closed('2'),coordinate:{lower:'2',upper:'2'}});
  coefficientTooWide.controls.tolerance='1/2';assert.throws(()=>run(coefficientTooWide),{code:'PRECISION_REQUIRED'});
  const boundary=fixture();boundary.controls.tolerance='1';assert.equal(run(boundary).pass,true);
});

test('finite row and control budgets and cancellation are explicit',()=>{
  const many=fixture();many.numericalRows=Array.from({length:271},()=>many.numericalRows[0]);invalid(many);
  for(const controls of[{tolerance:1},{tolerance:'0'},{precisionBits:513},{maxOperations:100000000},{sourceAuthenticated:true}]){
    const f=fixture();f.controls=controls;invalid(f);
  }
  let checked=0;assert.throws(()=>run(fixture(),{checkCancelled:()=>{checked++;throw Object.assign(Error('cancelled'),{code:'CANCELLED'});}}),{code:'CANCELLED'});
  assert.equal(checked,1);
});

test('original slow R and Rv directional normalization is preserved rather than relabeled as an ordinary partial',()=>{
  for(const[d,power]of[['R',1],['RR',2],['Rv',1],['TZ',0]]){
    const r=run(fixture({derivative:d})).rows[0];
    assert.equal(r.originalBoundQuantity,'normalizedDirectionDerivative');assert.equal(r.normalizedRadialPower,power);
    assert.equal(r.ordinaryPartialDerivativeInterpretationClaimed,false);assert.match(r.derivativeInterpretation,/does not divide out Rsharp/);
  }
  const f=fixture({derivative:'rtheta',sign:null});
  f.numericalRows[0].quantity=f.installedScaleRows[0].quantity='physicalCurl';
  const k='physicalCurl:physical:0:rtheta';
  f.numericalRows[0].rowKey=f.originalBindings[0].rowKey=f.installedScaleRows[0].rowKey=k;
  const r=run(f).rows[0];assert.equal(r.originalBoundQuantity,'physicalValue');assert.match(r.derivativeInterpretation,/frame and Hessian connections/);
});
