import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {originalFullMeanOperators} from '../source-full-mean-equations.mjs';
import {originalMeanResidualChangeDemand,exactFullMeanResidualChange,composeOriginalMeanResidualChangeRows}
  from '../source-mean-residual-change-kernel.mjs';
import {attachOriginalInitializedNormAuthority,assertOriginalInitializedNormAuthority,originalInitializedNormSource}
  from '../source-initialized-norm-authority.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {radialFactorial} from '../source-radial-class-kernel.mjs';

const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),
  R=G.fresh('mean_change_R'),Z=G.fresh('mean_change_Z'),T=G.fresh('mean_change_T'),
  Y=[G.fresh('mean_change_Y0'),G.fresh('mean_change_Y1')],coordinates=[R,Z,T,...Y],
  polynomial=(c,radial)=>G.add(q(c),G.pow(R,radial),G.mul(q(c+1),G.pow(Z,2)),G.mul(q(c+2),G.pow(T,2)),
    G.mul(q(c+3),Y[0],T),G.mul(q(c+4),G.pow(Y[1],3)),G.mul(Y[0],Y[1],R)),
  geometry={R,Z,T,Y,vr:[G.one,G.sub(G.one,G.sqrt(q(2)))],vt:[G.sub(G.sqrt(q(2)),G.one),G.one],
    epsilon:q(1,2),ci:q(2,3),radialFast:G.mul(q(3),G.pow(R,2))},
  background={b:polynomial(1,2),V:polynomial(2,3),G:polynomial(3,2)},
  previous={beta:polynomial(4,3),v:polynomial(5,4),gamma:polynomial(6,3)},
  increment={beta:polynomial(7,2),v:polynomial(8,3),gamma:polynomial(9,4)},
  covariance=Object.fromEntries(['rr','rtheta','rz','thetatheta','thetaz','zz'].map((k,j)=>[k,polynomial(j+10,3)])),
  stress=[polynomial(17,2),polynomial(18,3)],previousPressure=polynomial(19,2),pressureIncrement=polynomial(20,4),
  source={geometry,background,previous,increment,covariance,stress,previousPressure,pressureIncrement},
  verify=createFactoredRationalVerifier(G,{maxTerms:100000,maxProducts:1000000}),fixtures={},
  norm=(c,power,pole,epsilonExponent,weight='zeta')=>({constant:q(c),power,pole,epsilonExponent,weight,gaussian:'1'}),
  n=6,backgroundRows=Array.from({length:n},(_,order)=>({order,
    b:norm(1000000000n+BigInt(order),0,0,'1','1'),V:norm(1000000000n+BigInt(order),0,0,'0','1'),G:norm(1000000000n+BigInt(order),0,0,'0','1')})),
  velocityRows=Array.from({length:n},(_,order)=>({order,beta:norm(1000000000n+BigInt(order),3+order,2+order,'2-kappa_s'),
    v:norm(1000000000n+BigInt(order),4+order,3+order,'1-kappa_s'),gamma:norm(1000000000n+BigInt(order),5+order,4+order,'1-kappa_s')})),
  pressureChangeRows=Array.from({length:n},(_,order)=>({order,pressure:norm(1000000000n+BigInt(order),7+order,6+order,'1-kappa_s')})),
  fixed={radiusBase:q(2),radialDerivativeBounds:Array.from({length:n},(_,j)=>G.mul(q(radialFactorial(j+4)),q(2n**BigInt(j+4)))),maxWork:200000},
  inputs={order:3,backgroundRows,previousRows:velocityRows,incrementRows:velocityRows,pressureChangeRows,...fixed};

test('the complete source derivative demand works for every selected finite order without a fixed twelve-order criterion',()=>{
  fixtures.demands=Array.from({length:50},(_,order)=>originalMeanResidualChangeDemand({order}));
  for(const d of fixtures.demands){assert.equal(d.requiredIncrementVelocityOrder,d.order+2);
    assert.equal(d.requiredPreviousVelocityOrder,d.order+1);assert.equal(d.requiredPressureChangeOrder,d.order+1);
    assert.equal(d.fastTimeCancellationRequiredSeparately,true);assert.equal(d.sourceAuthenticated,false);}
  for(const bad of [{order:-1},{order:1.5},{order:Number.MAX_SAFE_INTEGER},{source:true}])
    assert.throws(()=>originalMeanResidualChangeDemand(bad));
});

test('both complete original PDE differences equal all nineteen flux products and four slow groups plus fast time',()=>{
  fixtures.exact=exactFullMeanResidualChange(G,source);
  assert.equal(Object.values(fixtures.exact.productTerms).reduce((n,r)=>n+Object.keys(r).length,0),19);
  for(const r of fixtures.exact.rows){assert.equal(r.identity.pass,true);assert.equal(Object.keys(r.terms).length,4);
    assert.notEqual(r.fastTime,G.zero);assert.notEqual(r.slowChange,G.zero);}
  assert.equal(fixtures.exact.allPressureModesRetained,true);
  assert.equal(fixtures.exact.fastTemporalPartDeclaredCancelled,false);
  assert.equal(fixtures.exact.fastCutoffRemainderDeclaredZero,false);
});

test('all first and second coordinate jets preserve the exact full difference without removing any source term',()=>{
  fixtures.jets=[];
  for(const r of fixtures.exact.rows)for(let j=0;j<5;j++)for(let k=j;k<5;k++){
    const direct=G.derivative(G.derivative(r.direct,coordinates[j]),coordinates[k]),
      decomposed=G.derivative(G.derivative(r.fullChange,coordinates[j]),coordinates[k]),
      identity=verify(G.sub(direct,decomposed));
    fixtures.jets.push({component:r.name,orders:[j,k],direct,decomposed,identity});assert.equal(identity.pass,true);
  }
  assert.equal(fixtures.jets.length,30);
});

test('omitting any slow group, either fast time or the full pressure change is detectable',()=>{
  fixtures.omissions=[];
  for(const r of fixtures.exact.rows)for(const [name,term]of Object.entries({...r.terms,fastTime:r.fastTime})){
    assert.notEqual(term,G.zero);const wrong=G.sub(r.fullChange,term),difference=G.sub(r.direct,wrong),identity=verify(difference);
    fixtures.omissions.push({component:r.name,name,term,wrong,difference,identity});assert.equal(identity.pass,false);
  }
  const fullPressureTerm=G.mul(geometry.epsilon,G.derivative(pressureIncrement,Z));
  assert.notEqual(fullPressureTerm,G.zero);assert.equal(verify(fullPressureTerm).pass,false);
  fixtures.omissions.push({component:'Ez',name:'completePressureChange',term:fullPressureTerm});
});

test('the complete radial viscosity keeps the derivative of the variable fast multiplier',()=>{
  const O=originalFullMeanOperators(G,geometry),missing=G.mul(G.derivative(geometry.radialFast,R),O.L(increment.v)),
    exact=O.Dr(O.Dr(increment.v)),wrong=G.sub(exact,missing);
  fixtures.viscosity={exact,wrong,missing};assert.notEqual(missing,G.zero);
  assert.equal(verify(G.sub(exact,wrong)).pass,false);
});

test('full finite mean difference norms retain the exact epsilon gains and the unproved fast cutoff',()=>{
  fixtures.norms=composeOriginalMeanResidualChangeRows(G,inputs);
  for(const r of fixtures.norms.rows){
    assert.equal(r.Etheta.epsilonExponent,'2-3*kappa_s');assert.equal(r.Ez.epsilonExponent,'2-3*kappa_s');
    assert.equal(r.Etheta.epsilonExponentExact,'199997/100000');assert.equal(r.Ez.epsilonExponentExact,'199997/100000');
    assert.equal(r.uncancelledFastTime.Etheta.epsilonExponent,'1-kappa_s');
    assert.equal(r.uncancelledFastTime.Ez.epsilonExponent,'1-kappa_s');
    assert.equal(r.fastTimeCancellationApplied,false);assert.equal(r.actualCutoffFlatnessInferred,false);
    assert.equal(Object.values(r.fluxProducts).reduce((n,t)=>n+Object.keys(t).length,0),19);
    for(const f of [r.Etheta,r.Ez,...Object.values(r.thetaTerms),...Object.values(r.zTerms)])assert.equal(G.freeCoordinates(f.constant).size,0);
  }
  assert.equal(fixtures.norms.actualSourceClassPremisesEstablished,false);assert.equal(fixtures.norms.completeN6,false);
});

test('missing higher velocity, omitted pressure and arbitrary non-source norm factors are rejected',()=>{
  for(const input of [{...inputs,incrementRows:velocityRows.slice(0,5)},
    {...inputs,pressureChangeRows:pressureChangeRows.slice(0,4)},
    {...inputs,radiusBase:R},{...inputs,radialDerivativeBounds:[q(-1),...fixed.radialDerivativeBounds.slice(1)]},
    {...inputs,actualSourceClass:true}])assert.throws(()=>composeOriginalMeanResidualChangeRows(G,input));
});

test('initialized source capability rejects fixtures, copied receipts, supplied ids and arbitrary completion labels',()=>{
  for(const fake of [{},{sourceAuthenticated:true},{schema:'MathScope.N6.OriginalInitializedNormAuthority/1'},
    {scope:{actualInitializedSourceIdentityAuthenticated:true}},fixtures.exact]){
    assert.throws(()=>attachOriginalInitializedNormAuthority(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>assertOriginalInitializedNormAuthority(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>originalInitializedNormSource(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
  }
});

after(async()=>{
  const memory={rssBytes:process.memoryUsage().rss,maxRSSBytes:process.resourceUsage().maxRSS*1024};
  if(process.env.MATHSCOPE_MEAN_CHANGE_DIRECTORY)await writeFile(process.env.MATHSCOPE_MEAN_CHANGE_DIRECTORY+'/mean-residual-change-kernel.json',
    JSON.stringify({schema:'MathScope.N6.MeanResidualChangeKernelFixture/1',source,inputs,fixtures,program:G.pack({R,Z,T,Y}),memory,
      sourceAuthenticated:false,actualPrivateMeanClassAttachmentExecuted:false,completeInitialTupleClassCertified:false,completeN6:false},null,2)+'\n');
  assert.ok(memory.maxRSSBytes<=512*1024**2,'Actual Node peak must remain within the declared 512MiB RSS budget.');
});
