import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {exactCylindricalHarmonicCurl} from '../../../mathscope-m2/navier/actual-full-curl.mjs';
import {exactHarmonicComplexAlgebra,completeAngularHarmonicConvolution,originalCylindricalDifferentialOperators,
  exactAngularHarmonicPDE,exactAngularResidualUpdate,reconstructAngularHarmonics,exactRealCylindricalPDE} from '../source-harmonic-assembly.mjs';

const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:200000}).pass;
const vectorAt=(rows,m,G)=>rows.find(row=>row.m===m)?.value??[0,1,2].map(()=>({real:G.zero,imaginary:G.zero}));

export function harmonicFixture(){
  const G=new ActualConvergentExpressions(),[R,Z,T,theta,xi,v]=['R','Z','T','theta','xi','v'].map(name=>G.fresh(name)),
    epsilon=G.q(2,5),radialFast=G.add(G.one,G.pow(R,2)),geometry={R,Z,T,theta,xi,v,epsilon,radialFast},
    k=G.q(3),phase=G.add(G.mul(G.q(2),theta),G.mul(R,Z),G.mul(G.q(3),v),G.neg(G.mul(T,Z))),C=exactHarmonicComplexAlgebra(G),
    pair=(m,velocity,pressure)=>[{m,velocity,pressure},{m:-m,velocity:velocity.map(C.conjugate),pressure:C.conjugate(pressure)}],
    previous=[{m:0,velocity:[C.value(G.mul(R,Z)),C.value(G.add(G.pow(R,2),G.mul(T,xi))),C.value(G.mul(R,v))],pressure:C.value(G.mul(R,Z,T))},
      ...pair(1,[C.value(G.mul(R,xi),G.div(Z,G.q(7))),C.value(G.mul(Z,T),G.div(v,G.q(5))),C.value(G.div(R,G.q(5)),G.mul(xi,T))],
        C.value(G.div(G.mul(R,T),G.q(3)),G.div(G.mul(Z,xi),G.q(5))))],
    increment=[{m:0,velocity:[C.value(G.mul(Z,v)),C.value(G.mul(T,v)),C.value(G.mul(R,xi))],pressure:C.value(G.mul(R,xi,T))},
      ...pair(2,[C.value(G.mul(R,T),G.div(xi,G.q(2))),C.value(G.mul(Z,xi),G.div(T,G.q(3))),C.value(G.mul(Z,v),G.div(R,G.q(11)))],
        C.value(G.mul(Z,T),G.div(G.mul(R,xi),G.q(7))))],
    oldFlatResidual=[{m:0,value:[C.value(G.add(G.one,G.mul(R,Z))),C.value(G.mul(G.q(2),T,v)),C.value(G.mul(G.q(3),xi,Z))]}];
  return {G,C,geometry,k,phase,previous,increment,oldFlatResidual,coordinates:{R,Z,T,theta,xi,v}};
}

test('the whole finite convolution includes every sparse m+n and never silently truncates a large harmonic',()=>{
  const G=new ActualConvergentExpressions(),C=exactHarmonicComplexAlgebra(G),left=[-5,-2,0,2,5].map(m=>({m,value:C.value(G.q(m+6),G.q(m))})),
    right=[-4,0,4].map(m=>({m,value:C.value(G.q(m+5),G.q(1-m))})),result=completeAngularHarmonicConvolution(G,{left,right}),
    modes=[...new Set(left.flatMap(a=>right.map(b=>a.m+b.m)))].sort((a,b)=>a-b);
  assert.deepEqual(result.generatedModes,modes);assert.equal(result.productsComputed,15);assert.equal(result.maximumHarmonic,9);
  for(const row of result.rows){const pairs=left.flatMap(a=>right.filter(b=>a.m+b.m===row.m).map(b=>[a,b])),
    expected={real:pairs.reduce((s,[a,b])=>s+BigInt(a.m+6)*BigInt(b.m+5)-BigInt(a.m)*BigInt(1-b.m),0n),
      imaginary:pairs.reduce((s,[a,b])=>s+BigInt(a.m+6)*BigInt(1-b.m)+BigInt(a.m)*BigInt(b.m+5),0n)};
    for(const part of ['real','imaginary'])assert.equal(equal(G,row.value[part],G.q(expected[part])),true);}
  assert.deepEqual(result.discardedModes,[]);assert.equal(result.infiniteInputTailCertified,false);assert.equal(result.sourceAuthenticated,false);
  assert.throws(()=>completeAngularHarmonicConvolution(G,{left,right,cutoff:2}),{code:'INVALID_INPUT'});
  assert.throws(()=>completeAngularHarmonicConvolution(G,{left:[{m:Number.MAX_SAFE_INTEGER,value:C.value(G.one)}],right:[{m:1,value:C.value(G.one)}]}),{code:'RESOURCE_LIMIT'});
  const many=Array.from({length:130},(_,m)=>({m,value:C.value(G.one)}));
  assert.throws(()=>completeAngularHarmonicConvolution(G,{left:many,right:many}),{code:'RESOURCE_LIMIT'});
});

test('direct and decomposed full residual updates coincide coefficientwise with updated pressure, old flat and new quadratic terms',()=>{
  const f=harmonicFixture(),{G}=f,result=exactAngularResidualUpdate(G,{geometry:f.geometry,k:f.k,phase:f.phase,
    previous:f.previous,increment:f.increment,oldFlatResidual:f.oldFlatResidual});
  assert.deepEqual(result.direct.map(r=>r.m),[-4,-3,-2,-1,0,1,2,3,4]);
  for(const row of result.defect)for(const value of row.value)for(const part of ['real','imaginary'])assert.equal(equal(G,value[part],G.zero),true);
  for(const m of [-4,4])assert.ok(vectorAt(result.newQuadraticRemainder,m,G).some(x=>!equal(G,x.real,G.zero)||!equal(G,x.imaginary,G.zero)));
  assert.equal(result.updatedPressure.find(x=>x.m===2).value.real,f.increment.find(x=>x.m===2).pressure.real);
  assert.equal(result.oldFlatResidual[0].value[0].real,f.oldFlatResidual[0].value[0].real);
  assert.equal(result.oldFlatResidualRetained,true);assert.equal(result.newQuadraticRemainderRetained,true);assert.equal(result.flatResidualClassBoundCertified,false);
  const stale=exactAngularHarmonicPDE(G,{geometry:f.geometry,k:f.k,phase:f.phase,rows:result.updated.map(row=>({...row,pressure:f.previous.find(old=>old.m===row.m)?.pressure??f.C.zero}))});
  assert.ok(stale.conservativeResidual.some(row=>row.value.some((x,j)=>['real','imaginary'].some(part=>!equal(G,x[part],vectorAt(result.direct,row.m,G)[j][part])))));
  assert.throws(()=>exactAngularResidualUpdate(G,{geometry:f.geometry,k:f.k,phase:f.phase,previous:f.previous,increment:f.increment}),{code:'INVALID_INPUT'});
});

test('the exact full curl is divergence free and the conservative/advective difference retains its full cylindrical connection',()=>{
  const f=harmonicFixture(),{G,C,geometry:g,phase,k}=f,{R,Z,T,xi,v}=g,D=originalCylindricalDifferentialOperators(G,g),
    normal=[D.Dr(phase),D.angular(phase),D.Dz(phase)],potential=[G.mul(R,xi),G.mul(Z,T,v),G.mul(R,Z)],
    curl=exactCylindricalHarmonicCurl(G,{R,Z,xi,epsilon:g.epsilon,radialFast:g.radialFast,k,normal,potential}),
    positive=curl.fullCoefficient.map(x=>C.scale(G.q(1,2),x)),rows=[{m:1,velocity:positive,pressure:C.value(G.mul(R,T),G.mul(Z,xi))},
      {m:-1,velocity:positive.map(C.conjugate),pressure:C.value(G.mul(R,T),G.neg(G.mul(Z,xi)))}],
    actual=exactAngularHarmonicPDE(G,{geometry:g,phase,k,rows});
  for(const row of actual.divergence)for(const part of ['real','imaginary'])assert.equal(equal(G,row.value[part],G.zero),true);
  for(const row of actual.conservativeResidual)for(let j=0;j<3;j++)for(const part of ['real','imaginary'])
    assert.equal(equal(G,row.value[j][part],vectorAt(actual.advectiveResidual,row.m,G)[j][part]),true);
  const wrongRows=rows.map(row=>({...row,velocity:row.velocity.map((x,j)=>j===2?C.sub(x,C.value(G.div(potential[1],R))):x)})),
    wrong=exactAngularHarmonicPDE(G,{geometry:g,phase,k,rows:wrongRows});
  assert.ok(wrong.divergence.some(row=>!equal(G,row.value.real,G.zero)||!equal(G,row.value.imaginary,G.zero)));
  assert.equal(actual.incompressibilityAssumed,false);assert.equal(actual.originalSourceAuthenticated,false);
});

test('the common-torus coefficient calculus retains both fast directions, original slow time and viscosity connections',()=>{
  const f=harmonicFixture(),{G,C,geometry:g,k}=f,Y=[g.xi,g.v],common={R:g.R,Z:g.Z,T:g.T,theta:g.theta,Y,vr:[G.one,G.q(-2)],vt:[G.q(3),G.one],
    epsilon:g.epsilon,radialFast:g.radialFast,ci:G.q(7,3)},
    phase=G.add(G.mul(G.q(2),g.theta),G.mul(g.R,g.Z),G.mul(g.T,g.v)),
    actual=exactAngularHarmonicPDE(G,{geometry:common,phase,k,rows:f.previous}),
    wrongTime=exactAngularHarmonicPDE(G,{geometry:{...common,ci:G.zero},phase,k,rows:f.previous}),
    wrongFast=exactAngularHarmonicPDE(G,{geometry:{...common,vr:[G.one,G.zero]},phase,k,rows:f.previous});
  for(const wrong of [wrongTime,wrongFast])assert.ok(actual.conservativeResidual.some(row=>row.value.some((x,j)=>['real','imaginary'].some(part=>
    !equal(G,x[part],vectorAt(wrong.conservativeResidual,row.m,G)[j][part])))));
  assert.throws(()=>exactAngularHarmonicPDE(G,{geometry:common,phase,k:G.add(k,g.T),rows:f.previous}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactAngularHarmonicPDE(G,{geometry:common,phase:G.pow(g.theta,2),k,rows:f.previous}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactAngularHarmonicPDE(G,{geometry:common,phase,k,rows:[{m:1,velocity:[C.value(g.theta),C.zero,C.zero],pressure:C.zero}]}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactAngularHarmonicPDE(G,{geometry:common,phase,k,rows:f.previous.map(row=>({m:row.m,velocity:row.velocity}))}),{code:'INVALID_INPUT'});
});

test('independent real-space PDE artifacts retain nonzero pressure, all connections and phase multipliers',()=>{
  const f=harmonicFixture(),{G}=f,update=exactAngularResidualUpdate(G,{geometry:f.geometry,k:f.k,phase:f.phase,
    previous:f.previous,increment:f.increment,oldFlatResidual:f.oldFlatResidual}),
    reconstructed=reconstructAngularHarmonics(G,{geometry:f.geometry,k:f.k,phase:f.phase,rows:update.updated}),
    real=exactRealCylindricalPDE(G,{geometry:f.geometry,velocity:reconstructed.velocity,pressure:reconstructed.pressure}),
    harmonic=exactAngularHarmonicPDE(G,{geometry:f.geometry,k:f.k,phase:f.phase,rows:update.updated}),
    allModes=[...new Set([...harmonic.generatedModes,...update.updated.map(r=>r.m)])],
    argumentsByMode=allModes.map(m=>({m,argument:G.mul(f.k,G.q(m),f.phase)})),
    artifact={schema:'MathScope.N6.FiniteHarmonicIndependentControl/1',nodes:G.nodes,geometry:f.geometry,phase:f.phase,k:f.k,
      coordinates:f.coordinates,inputRows:update.updated,argumentsByMode,harmonic,real,update,
      scope:{actualSourceField:false,originalFinalN6:false,allCorrectionStages:false}};
  assert.equal(real.angularConvolutionUsed,false);assert.equal(real.allCylindricalConnectionsRetained,true);
  assert.ok(real.pressureGradient.some(x=>!equal(G,x,G.zero)));
  assert.equal(harmonic.maximumHarmonic,4);
  if(process.env.MATHSCOPE_HARMONIC_ARTIFACT)writeFileSync(process.env.MATHSCOPE_HARMONIC_ARTIFACT,JSON.stringify(artifact));
});
