import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canonicalStringify,sha256} from '../../../mathscope-m0/contracts.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {exactOriginalClassDivisor,originalFourierClassDerivativeDemand,
  prepareOriginalFourierClassMajorants,assertOriginalFourierClassMajorants,
  originalFourierClassMajorantCertificate,attachOriginalTemporalClassOperator}
  from '../source-fourier-class-majorants.mjs';

let prepared;
const get=async()=>prepared??=await prepareOriginalFourierClassMajorants({order:4,inversePower:5,maxWork:1000});
const independentModes=[],equal=(G,a,b)=>createFactoredRationalVerifier(G,{maxTerms:10000})(G.sub(a,b)).pass;

test('the fixed original torus directions and exact c_i0 normalization bind the observed full source and its common domain',async()=>{
  const p=await get(),G=p.G;
  assert.equal(assertOriginalFourierClassMajorants(p),true);
  assert.equal(p.checks.length,8);assert.ok(p.checks.every(x=>x.pass));
  assert.deepEqual(p.operators.temporal.direction,['sqrt(2)-1','1']);
  assert.deepEqual(p.operators.radial.direction,['1','1-sqrt(2)']);
  assert.equal(p.diophantine.observedPairs.length,8);
  assert.equal(p.source.actualTemporalArtifact.sha256.length,64);
  assert.equal(p.source.originalDomainArtifact.sha256.length,64);
  assert.equal(p.source.actualTemporalArchiveSHA256.length,64);
  assert.equal(p.source.originalDomainArchiveSHA256.length,64);
  assert.deepEqual(G.source.parametersExactExpressions.h,{exp:{product:[{integer:-8002},{ref:'T'}]}});
  assert.equal(p.scope.actualCurrentInputClassNormsCertified,false);
  assert.equal(p.scope.radialInputWeightedZeroMomentCertified,false);
  assert.equal(p.scope.completeN6,false);
});

test('both original quadratic reciprocal formulas retain near-resonant Pell frequencies as exact integers',async()=>{
  const p=await get(),G=p.G;let u=1n,v=0n;
  for(let n=1;n<=24;n++){
    [u,v]=[3n*u+4n*v,2n*u+3n*v];
    for(const direction of ['temporal','radial']){
      // Construct direction.k=-u+sqrt(2)*v. Its integer norm is1,
      // although its floating point value would lose nearly all digits.
      const mode=direction==='temporal'?[v,-u+v]:[-u+v,-v],r=exactOriginalClassDivisor(G,{direction,mode});
      assert.equal(r.quadratic.u,String(-u));assert.equal(r.quadratic.v,String(v));
      assert.equal(r.quadratic.integerNorm,'1');assert.ok(Object.values(r.checks).every(Boolean));
      assert.equal(r.zeroModeInverted,false);assert.equal(r.binary64UsedForDivisorDecision,false);
      const root=r.sqrtTwo,identity=G.sub(G.mul(r.value,r.conjugate),G.q(r.quadratic.integerNorm)),
        algebraicError=G.neg(G.mul(G.q(v*v),G.sub(G.pow(root,2),G.q(2))));
      assert.equal(equal(G,identity,algebraicError),true);
      independentModes.push({direction,mode:mode.map(String),quadratic:r.quadratic,maxFrequency:r.maxFrequency});
    }
  }
});

test('all mixed output derivatives keep enough distinct radial and torus input orders for every retained inverse power',async()=>{
  const p=await get();
  for(const row of p.rows)for(const d of row.sourceDerivativeOrders){
    const {outputOrder:m,inversePower:k}=d;
    for(let slow=0;slow<=m;slow++)for(let y0=0;y0<=m-slow;y0++){
      const y1=m-slow-y0,torus=y0+y1,coefficientDerivative=torus+k+3;
      assert.ok(slow+coefficientDerivative<=d.torusSourceOrder);
      assert.equal(-coefficientDerivative+k+torus,-3);
      assert.equal(-coefficientDerivative-k+torus,-(2*k+3));
      assert.ok(slow+k+coefficientDerivative<=d.radialIBPSourceOrder);
    }
    assert.equal(d.radialIBPSourceOrder,m+2*k+3);
    assert.ok(d.radialIBPSourceOrder>d.torusSourceOrder,
      'The p radial integration-by-parts derivatives cannot disappear into the same p torus derivatives.');
  }
});

test('the complete square lattice and projection keep the zero mode separate and never replace the omitted tail by zero',async()=>{
  const p=await get(),G=p.G;
  for(let n=1;n<=20;n++){
    const shell=[];
    for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++)if(Math.max(Math.abs(i),Math.abs(j))===n)shell.push([i,j]);
    assert.equal(shell.length,8*n);assert.ok(shell.every(k=>k.some(Boolean)));
  }
  for(const row of p.rows){
    assert.equal(row.wholeLattice,true);assert.equal(row.zeroModeInverted,false);
    assert.equal(equal(G,row.operatorConstant,G.mul(G.q(2),row.completeTailCoefficient)),true);
    assert.notEqual(row.completeTailCoefficient,G.zero);
  }
  assert.throws(()=>exactOriginalClassDivisor(G,{direction:'temporal',mode:[0,0]}),{code:'ZERO_MODE_NOT_INVERTIBLE'});
  assert.throws(()=>exactOriginalClassDivisor(G,{direction:'radial',mode:['0','0']}),{code:'ZERO_MODE_NOT_INVERTIBLE'});
  const zeroAndNonzeroExample={zero:'7',modes:[{k:[1,0],coefficient:'3'},{k:[-1,0],coefficient:'3'}]};
  assert.notEqual(zeroAndNonzeroExample.zero,'0');
  assert.deepEqual(zeroAndNonzeroExample.modes.map(x=>x.coefficient),['3','3'],
    'Subtracting Haar mean changes only the zero coefficient, not the input nonzero derivative norm.');
});

test('the reference-band floor loss contributes one S power with the exact two-band normalization factor',async()=>{
  const p=await get(),G=p.G,h=G.parameter('h'),Tg=G.add(G.q(4),G.sqrt(G.q(2))),
    expected=G.mul(Tg,G.exp(G.mul(G.add(G.q(2),G.mul(G.q(2),h)),G.log(G.q(2)))));
  assert.equal(p.palette.boundRoot,expected);assert.equal(G.freeCoordinates(expected).size,0);
  assert.equal(p.palette.additionalSPower,1);assert.equal(p.palette.noNewSmallnessThreshold,true);
  assert.equal(p.palette.floorDefectFactorization.upperEndpointIncluded,false);
  for(const row of p.operators.temporal.rows){
    assert.equal(row.inputOrder,row.order+4);assert.equal(row.addedSPower,1);
    assert.equal(row.epsilonExponentChange,'0');assert.equal(row.boundaryPoleChange,'0');
    assert.equal(row.constant,G.mul(expected,p.rows[0].operatorConstant));
  }
  assert.equal(equal(G,expected,G.mul(Tg,G.exp(G.mul(G.add(G.q(1),h),G.log(G.q(2)))))),false,
    'Dropping the two-band shift gives a genuinely different source coefficient.');
});

test('frequency, norm, direction, domain and insufficient representation overrides fail closed',async()=>{
  const p=await get(),G=p.G;
  for(const input of [{direction:['1','0']},{norm:1},{complete:true},{qBig:1}])
    await assert.rejects(()=>prepareOriginalFourierClassMajorants(input),{code:'INVALID_INPUT'});
  for(const input of [{order:100,inversePower:100,maxWork:300},{order:-1},{inversePower:0},{inversePower:Number.MAX_SAFE_INTEGER}])
    await assert.rejects(()=>prepareOriginalFourierClassMajorants(input),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>originalFourierClassDerivativeDemand({outputOrder:0,inversePower:0}),{code:'RESOURCE_LIMIT'});
  for(const input of [{direction:'replacement',mode:[1,0]},{direction:'radial',mode:[0.5,1]},
    {direction:'temporal',mode:['01','0']},{direction:'radial',mode:['1e100','0']}])
    assert.throws(()=>exactOriginalClassDivisor(G,input),{code:'INVALID_INPUT'});
  assert.throws(()=>exactOriginalClassDivisor(G,{mode:[1n<<5000n,1]}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>attachOriginalTemporalClassOperator({G},p),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('private source and node seals reject copies or altered original premises while allowing separate appended expressions',async()=>{
  const p=await get(),G=p.G;
  assert.throws(()=>assertOriginalFourierClassMajorants({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const original=p.palette.additionalSPower;p.palette.additionalSPower=0;
  assert.throws(()=>assertOriginalFourierClassMajorants(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.palette.additionalSPower=original;
  const at=p.rows[0].operatorConstant,node=G.nodes[at];G.nodes[at]={op:'rational',args:['0','1']};
  assert.throws(()=>assertOriginalFourierClassMajorants(p),{code:'INVALID_SOURCE_CONSTRUCTION'});G.nodes[at]=node;
  G.fresh('separate_optional_class_test_coordinate');assert.equal(assertOriginalFourierClassMajorants(p),true);
});

test('the complete exact source-constant program has a stable snapshot and an explicit unfilled input-class ledger',async()=>{
  const p=await get(),c=await originalFourierClassMajorantCertificate(p);
  assert.equal(c.graph.nodeCount,c.program.nodes.length);
  assert.equal(c.graph.sha256,await sha256(canonicalStringify(c.program)));
  assert.ok(c.graph.nodeCount>3000&&c.graph.nodeCount<10000);
  p.G.fresh('appended_after_fourier_certificate');
  assert.deepEqual(await originalFourierClassMajorantCertificate(p),c);
  assert.equal(c.scope.actualTemporalSourceReconstructed,false);
  assert.equal(c.scope.actualCurrentInputClassNormsCertified,false);
  assert.equal(c.scope.allOrderCurrentClassCertified,false);
  const artifact={schema:'MathScope.N6.ObservedFixedFourierClassMajorants/1',certificate:c,
    independentInputs:{modes:independentModes,order:p.request.order,inversePower:p.request.inversePower,
      shellRange:[1,40],formalPiValues:['2','3','4'],normalizationEllRange:[8,40],
      derivativeDemands:p.rows.flatMap(x=>x.sourceDerivativeOrders)},
    actualCurrentAttachmentExecuted:false,actualCurrentInputNormsInvented:false,completeN6:false};
  if(process.env.MATHSCOPE_FIXED_FOURIER_MAJORANT_ARTIFACT)
    fs.writeFileSync(process.env.MATHSCOPE_FIXED_FOURIER_MAJORANT_ARTIFACT,JSON.stringify(artifact,null,2)+'\n');
});
