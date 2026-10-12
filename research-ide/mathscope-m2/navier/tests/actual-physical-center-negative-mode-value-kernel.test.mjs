import test from 'node:test';
import assert from 'node:assert/strict';
import {enclosePhysicalCenterNegativeModeValues} from '../actual-physical-center-negative-mode-value-kernel.mjs';
import {rational as Q,readRational,qcompare,qmul,qdiv,qpow,qtext} from '../actual-continuation-arithmetic.mjs';

const fixture=()=>({
  centers:[{lower:'1/3',upper:'3/8'},{lower:'7/20',upper:'9/25'}],
  originalBindings:[{sign:1,centerRoot:11,negativeModeRoot:12},{sign:-1,centerRoot:21,negativeModeRoot:22}],
  controls:{precisionBits:192,tolerance:'1/1000000000000'}
});
const run=(f,context={})=>enclosePhysicalCenterNegativeModeValues(f.centers,f.originalBindings,f.controls,context);
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const invalid=f=>assert.throws(()=>run(f),{code:'INVALID_INPUT'});

test('exact source power arithmetic gives a nonzero raw mode radius for both sign families',()=>{
  const result=run(fixture());
  assert.equal(result.rows.length,2);assert.equal(result.proof.exponentIdentity.radiusExponent,'97793');
  assert.equal(result.proof.exponentIdentity.remainingPower,'764');
  assert.equal(128n*(1024n-260n)+1n,BigInt(result.proof.exponentIdentity.radiusExponent));
  assert.deepEqual(result.rows.map(r=>[r.rowKey,r.sourceRoot,r.originalCenterRoot]),[['wMinus:1:1:VALUE',12,11],['wMinus:-1:1:VALUE',22,21]]);
  for(const row of result.rows){
    assert.equal(row.exactAbsoluteBound.denominatorPowerOfTwo,97793);
    assert.equal(row.positiveErrorRadius,qtext(Q(1,1n<<192n)));
    assert.equal(row.width,qtext(Q(1,1n<<191n)));
    assert.equal(row.normalization.exactFactor,'1');assert.equal(row.normalization.normalizedRadialPower,0);
    assert.equal(row.identicallyZeroClaimed,false);assert.equal(row.sourceAuthenticated,false);
  }
  assert(result.checks.every(r=>r.pass));assert.equal(result.sourceAuthenticated,false);
  assert.equal(result.arithmetic.giantAnalyticRadiusDenominatorConstructed,false);
});

test('independent exact cone endpoint examples of either sign lie inside the analytic and directed bounds',()=>{
  const f=fixture(),out=run(f),analytic=Q(1,1n<<97793n);
  // Exercise the original power quotient rather than the helper exponent.
  // This tiny exact fixture intentionally constructs the denominator once.
  for(const base of[1n<<128n,1n<<129n]){
    const B=Q(base),S=qpow(B,1024),ratio=qdiv(qpow(B,260),S);
    for(let i=0;i<2;i++)for(const sign of[-1,1]){
      const magnitude=qmul(readRational(f.centers[i].upper),ratio),value=qmul(Q(sign),magnitude),row=out.rows[i];
      assert(qcompare(magnitude,analytic)<0);
      assert(qcompare(readRational(row.directedInterval.lower),value)<0);
      assert(qcompare(value,readRational(row.directedInterval.upper))<0);
    }
  }
});

test('exact center endpoint validation rejects missing positivity, half-bound and endpoint type changes',()=>{
  for(const box of[{lower:'0',upper:'1/3'},{lower:'-1/10',upper:'1/3'},{lower:'1/3',upper:'1/2'},
    {lower:'1/3',upper:'2/3'},{lower:'3/8',upper:'1/3'},{lower:0.3,upper:'1/3'},
    {lower:'1/3',upper:{rational:'3/8'}},{lower:'1/3',upper:'NaN'}]){
    const f=fixture();f.centers[0]=box;invalid(f);
  }
  const display=fixture();display.centers[0].displayEnclosure=[-Infinity,Infinity];
  assert.equal(run(display).pass,true); // Exact strings alone decide.
});

test('duplicate signs, aliased components, mismatched lengths and source authority injection are rejected',()=>{
  for(const mutate of[
    f=>{f.originalBindings[1].sign=1;},f=>{f.originalBindings[1].negativeModeRoot=12;},
    f=>{f.originalBindings[0].negativeModeRoot=11;},f=>{f.originalBindings[1].centerRoot=-1;},
    f=>{f.originalBindings[1].centerRoot='21';},f=>{f.originalBindings[1].sign=0;},
    f=>{f.originalBindings[0].sourceAuthenticated=true;},f=>{f.originalBindings.pop();},f=>{f.centers.pop();},
    f=>{f.centers.push(f.centers[0]);},f=>{f.controls.conePower=259;},f=>{f.controls.sourceAuthenticated=true;}]){
    const f=fixture();mutate(f);invalid(f);
  }
});

test('outward bounds use every permitted precision and exact tolerance comparison',()=>{
  for(const bits of[192,256,384,512]){
    const f=fixture();f.controls.precisionBits=bits;f.controls.tolerance=qtext(Q(2,1n<<BigInt(bits)));
    const result=run(f);assert.equal(result.rows[0].width,f.controls.tolerance);
    assert.equal(result.arithmetic.largestConstructedDyadicDenominatorExponent,bits);
    assert(BigInt(bits)<BigInt(result.proof.exponentIdentity.radiusExponent));
    f.controls.tolerance=qtext(Q(1,1n<<BigInt(bits)));
    assert.throws(()=>run(f),{code:'PRECISION_REQUIRED'});
  }
  for(const controls of[{precisionBits:191},{precisionBits:513},{precisionBits:'192'},{tolerance:1},{tolerance:'0'},{tolerance:'1/99'}]){
    const f=fixture();f.controls=controls;invalid(f);
  }
});

test('input objects stay unchanged, results do not alias them, and source scope stays conditional',()=>{
  const f=freeze(fixture()),before=JSON.stringify(f),progress=[],result=run(f,{onProgress:x=>progress.push(x)});
  assert.equal(JSON.stringify(f),before);assert.equal(progress.length,2);
  result.rows[0].positiveCenterInterval.lower='0';result.rows[0].originalCenterRoot=999;
  assert.equal(JSON.stringify(f),before);
  assert.equal(result.scope.actualSourcePointAuthenticated,false);assert.equal(result.scope.actualSourceGraphReconstructed,false);
  assert.equal(result.scope.privateSourceTokenCreated,false);assert.equal(result.scope.wholeGNUMComplete,false);
  assert.equal(result.scope.valueRowsAdded,2);assert.equal(result.scope.existingDerivativeRowCountChanged,false);
  assert.equal(result.precision.relativeErrorGuaranteed,false);assert.equal(result.sourceRequirements.originalRootIDsAloneAuthenticateNothing,true);
});

test('cancellation is honored before and after the exact finite postprocessing',()=>{
  for(const stopAt of[1,2]){
    let calls=0;
    assert.throws(()=>run(fixture(),{checkCancelled:()=>{calls++;if(calls===stopAt)throw Object.assign(Error('cancelled'),{code:'CANCELLED'});}}),{code:'CANCELLED'});
    assert.equal(calls,stopAt);
  }
});
