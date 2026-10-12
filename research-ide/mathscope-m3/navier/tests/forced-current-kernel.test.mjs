import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {GlobalSourceExpressions} from '../source-global-expressions.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {SourceCoupledExpressions} from '../source-coupled-expressions.mjs';
import {exactHarmonicComplexAlgebra,exactAngularResidualUpdate} from '../source-harmonic-assembly.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {exactAngularWaveCovariance,exactAngularSourceSupportIdeal,attachGlobalForcedCurrent} from '../source-global-forced-current.mjs';

function fixture(){
  const base=new GlobalSourceExpressions(new ActualConvergentExpressions(),{maxNodes:500000,maximumSlowOrder:16}),
    G=new SourceCoupledExpressions(new AuxiliarySourceExpressions(base,{maximumOrder:16})),
    [R,Z,T,theta,x,y]=['R','Z','T','theta','x','y'].map(n=>G.fresh(n)),C=exactHarmonicComplexAlgebra(G),
    geometry={R,Z,T,theta,Y:[x,y],vr:[G.one,G.zero],vt:[G.zero,G.one],epsilon:G.q(2,5),ci:G.q(3,2),radialFast:G.add(G.one,R)},
    parameters=[R,Z,T,x,y],share=(body,name)=>G.share(body,parameters,name),
    positive={m:1,velocity:[C.value(share(G.mul(R,x),'wave_r_real'),share(G.add(Z,y),'wave_r_imag')),
      C.value(share(G.mul(T,x),'wave_t_real'),share(G.mul(R,y),'wave_t_imag')),
      C.value(share(G.add(R,T,x),'wave_z_real'),share(G.mul(Z,y),'wave_z_imag'))],
      pressure:C.value(share(G.mul(R,Z),'wave_p_real'),share(G.mul(T,x,y),'wave_p_imag'))},
    negative={m:-1,velocity:positive.velocity.map(C.conjugate),pressure:C.conjugate(positive.pressure)},
    previous=[{m:0,velocity:[C.value(G.mul(R,G.exp(Z))),C.value(G.add(T,G.sine(x))),C.value(G.mul(Z,y))],pressure:C.value(G.exp(G.add(R,Z))) }],
    phase=G.add(theta,R,Z,G.neg(G.mul(y,T))),k=G.q(2),oldFlat=[{m:0,value:[C.value(G.exp(R)),C.value(G.exp(Z)),C.value(G.exp(T))]}],
    update=exactAngularResidualUpdate(G,{geometry,phase,k,previous,increment:[positive,negative],oldFlatResidual:oldFlat}),
    at=m=>update.oldResidual.find(r=>r.m===m)?.value??[C.zero,C.zero,C.zero],
    forcing=update.direct.filter(r=>r.m!==0).map(r=>({m:r.m,value:r.value.map((z,j)=>C.sub(z,at(r.m)[j]))})),
    systems=[...positive.velocity,positive.pressure].flatMap(z=>[z.real,z.imaginary].map(n=>G.nodes[n].args[0]));
  return {G,C,R,Z,T,theta,x,y,positive,negative,previous,update,forcing,systems};
}

test('the complete new angular covariance retains both modes and every conjugate cross component',()=>{
  const {G,C,theta,positive,negative,x,y}=fixture(),second={m:2,velocity:[C.value(x,y),C.value(y,G.one),C.value(G.one,G.neg(x))],pressure:C.zero},
    rows=[negative,positive,second,{m:-2,velocity:second.velocity.map(C.conjugate),pressure:C.zero}],result=exactAngularWaveCovariance(G,{rows,theta}),
    verify=createFactoredRationalVerifier(G),expected=G.mul(G.q(2),G.add(G.pow(positive.velocity[0].real,2),G.pow(positive.velocity[0].imaginary,2),G.pow(x,2),G.pow(y,2)));
  assert.equal(verify(G.sub(result.values.rr,expected)).pass,true);assert.deepEqual(result.modes,[-2,-1,1,2]);
  assert.ok(result.checks.every(x=>x.pass));assert.ok(Object.values(result.contributions).every(rows=>rows.length===4));
  const omitted=exactAngularWaveCovariance(G,{rows:[positive,negative],theta});assert.equal(verify(G.sub(result.values.rr,omitted.values.rr)).pass,false);
  assert.equal(result.sourceAuthenticated,false);assert.equal(result.originalNonzeroIntegerCarrierStillRequired,true);
});

test('the actual emitted forcing is zero when every primary jet is zero while the entire nonzero mean remains',()=>{
  const f=fixture(),proof=exactAngularSourceSupportIdeal(f.G,{rows:f.forcing,waveSystems:f.systems});
  assert.ok(proof.checks.every(x=>x.pass));assert.ok(proof.waveJets.some(r=>r.orders.reduce((a,b)=>a+b,0)===2));
  assert.equal(proof.wholeMeanCoefficientKept,true);assert.equal(proof.sourcePressureWaveJetsKept,true);
  const wrong=structuredClone(f.forcing);wrong[0].value[0].real=f.G.add(wrong[0].value[0].real,f.G.one);
  assert.throws(()=>exactAngularSourceSupportIdeal(f.G,{rows:wrong,waveSystems:f.systems}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('missing conjugates, zero angular modes and serialized current flags cannot replace the actual original source',()=>{
  const {G,positive,negative,theta}=fixture();
  assert.throws(()=>exactAngularWaveCovariance(G,{rows:[positive],theta}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactAngularWaveCovariance(G,{rows:[positive,{...negative,m:0}],theta}),{code:'INVALID_INPUT'});
  assert.throws(()=>attachGlobalForcedCurrent({G,scope:{actualInitializedMeanAngularSourceConstructed:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
