import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {originalInitialMeanResidualDemand,exactCompleteInitialMeanResidual,
  exactInitialMeanResidualJet,initialMeanResidualMajorants} from '../source-initial-residual-class-kernel.mjs';
import {originalTemporalClassDerivativeDemand,originalCommonCiUpperFactorization,
  originalRawTemporalCutoffMajorant,composeOriginalTemporalClassRows} from '../source-temporal-class-kernel.mjs';
import {attachGlobalInitialResidualClass,assertGlobalInitialResidualClass} from '../source-global-initial-residual-class.mjs';
import {attachGlobalTemporalClass,assertGlobalTemporalClass} from '../source-global-temporal-class-majorants.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {radialFactorial} from '../source-radial-class-kernel.mjs';

const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),
  R=G.fresh('initial_fixture_R'),Z=G.fresh('initial_fixture_Z'),T=G.fresh('initial_fixture_T'),
  Y=[G.fresh('initial_fixture_Y0'),G.fresh('initial_fixture_Y1')],directions=[R,Z,T,...Y],
  polynomial=(v,n)=>G.add(...Array.from({length:n+1},(_,j)=>G.pow(v,j))),
  common=G.mul(polynomial(Z,3),polynomial(T,3),polynomial(Y[0],3),polynomial(Y[1],3)),
  W={rtheta:G.mul(G.pow(R,5),common),thetaz:G.mul(q(2),G.pow(R,4),common),
    rz:G.mul(q(3),G.pow(R,4),common),zz:G.mul(G.pow(R,6),common)},
  stress=[G.mul(G.pow(R,4),polynomial(Z,3),polynomial(T,3)),
    G.mul(q(2),G.pow(R,3),polynomial(Z,3),polynomial(T,3))],
  pressureBody=G.mul(G.pow(R,3),common),pressureZ=G.derivative(pressureBody,Z),
  input={R,Z,T,Y,W,stress,pressureZ,epsilon:q(1,2),radialFast:G.mul(q(3),G.pow(R,2))},fixtures={},
  indices=m=>{const out=[];const next=(a,left)=>{if(a.length===4){for(let j=0;j<=left;j++)out.push([...a,j]);return;}
    for(let j=0;j<=left;j++)next([...a,j],left-j);};next([],m);return out;};

test('all finite initial and temporal derivative demands retain slow time and complete positive-IBP inputs',()=>{
  fixtures.initialDemands=Array.from({length:17},(_,order)=>originalInitialMeanResidualDemand({order}));
  fixtures.temporalDemands=[];
  for(let m=0;m<=12;m++)for(let p=0;p<=4;p++){
    const d=originalTemporalClassDerivativeDemand({order:m,ibpOrder:p});fixtures.temporalDemands.push(d);
    assert.equal(d.requiredResidualPairOrder,p===0?m+5:m+2*p+8);
    assert.equal(d.requiredDesiredVelocityOrder,d.requiredResidualPairOrder-4);
    assert.equal(d.requiredFixedRadialOutputOrder,m+1);assert.equal(d.requiredCutoffDerivativeOrder,m+2);
  }
  for(const d of fixtures.initialDemands){assert.equal(d.requiredPressureOrder,d.order+1);assert.equal(d.requiredCommonYCovarianceOrder,d.order+2);
    assert.equal(d.requiredBackgroundSlowOrder,d.order+5);assert.equal(d.requiredTargetWeightedOrder,d.order+3);}
  for(const bad of [{order:-1},{order:1.5},{ibpOrder:-1},{norm:3},{order:Number.MAX_SAFE_INTEGER}])
    assert.throws(()=>originalTemporalClassDerivativeDemand(bad));
});

test('the initial residual binds all four covariance fields, both exact stresses and full pressureZ',()=>{
  const s=exactCompleteInitialMeanResidual(G,input);fixtures.initial=s;
  assert.equal(s.rows.length,2);assert.equal(s.originalStressAuxiliaryIndependent,true);
  assert.equal(s.roots.Etheta===s.roots.Ez,false);assert.equal(s.pressureZ,pressureZ);
  assert.ok(s.rows.every(r=>Object.keys(r.terms).length===8));assert.ok(s.rows.every(r=>r.terms.stressFastRadial===G.zero));
  assert.notEqual(s.rows[1].terms.pressure,G.zero);assert.equal(s.sourceAuthenticated,false);
});

test('all56 five-coordinate initial residual jets execute every coefficient product and both source components',()=>{
  fixtures.jets=indices(3).map(orders=>exactInitialMeanResidualJet(G,input,{orders,maxWork:100000}));
  assert.equal(fixtures.jets.length,56);
  for(const j of fixtures.jets){assert.equal(j.rows.length,2);assert.equal(j.coefficients.length,j.orders[0]+1);
    assert.ok(j.rows.every(r=>r.identity.pass));assert.equal(j.requiredPressureOrder,j.order+1);}
});

test('omitting pressure, either original stress or an irrational torus direction fails the complete residual identity',()=>{
  const s=fixtures.initial,verify=createFactoredRationalVerifier(G,{maxTerms:100000,maxProducts:1000000}),
    bad=[{component:'Ez',value:G.sub(s.roots.Ez,s.rows[1].terms.pressure)},
      ...s.rows.map(r=>({component:r.name,value:G.add(r.value,r.terms.stressSlowRadial,r.terms.stressConnection)})),
      {component:'Etheta',value:G.sub(s.roots.Etheta,G.mul(input.radialFast,s.vr[1],G.derivative(W.rtheta,Y[1])))}];
  fixtures.negatives=bad.map(r=>({...r,difference:G.sub(s.roots[r.component],r.value)}));
  assert.ok(fixtures.negatives.every(r=>!verify(r.difference).pass));
});

test('a stress with auxiliary dependence is retained explicitly and cannot claim the source independence premise',()=>{
  const changed=exactCompleteInitialMeanResidual(G,{...input,stress:[G.mul(stress[0],G.add(G.one,Y[1])),stress[1]]});
  assert.equal(changed.originalStressAuxiliaryIndependent,false);assert.notEqual(changed.rows[0].terms.stressFastRadial,G.zero);
  assert.notEqual(changed.roots.Etheta,fixtures.initial.roots.Etheta);fixtures.changedStress=changed;
  for(const bad of [{...input,epsilon:T},{...input,radialFast:G.mul(input.radialFast,Z)},
    {...input,Y:[Y[0],Y[0]]},{...input,stress:[stress[0]]}])assert.throws(()=>exactCompleteInitialMeanResidual(G,bad));
});

test('the initial full norm envelope retains exact Leibniz, stress and pressure coefficients',()=>{
  const B=q(2),norm=q(1000000000),bounds=Array.from({length:7},(_,j)=>G.mul(q(radialFactorial(j+4)),G.pow(B,j+4)));
  fixtures.normDomain={R:['1','2'],others:['-1','1'],covarianceNorm:norm,stressNorm:norm,pressureNorm:norm,pressureBody};
  fixtures.majorants=Array.from({length:5},(_,order)=>initialMeanResidualMajorants(G,{order,radiusBase:B,
    directPowerDerivativeBounds:bounds,covarianceNorm:norm,stressNorm:norm,pressureDerivativeNorm:norm,maxWork:1000}));
  for(const r of fixtures.majorants){assert.equal(r.outputEpsilonExponent,'1-kappa_s');assert.equal(r.originalPressureContributionExponent,'2-kappa_s');
    assert.equal(r.fields.Ez.terms.pressure,norm);assert.equal(r.originalStressContributionExponent,'1');assert.equal(r.sourceAuthenticated,false);}
  for(const bad of [q(-1),R])assert.throws(()=>initialMeanResidualMajorants(G,{order:0,radiusBase:B,directPowerDerivativeBounds:bounds,
    covarianceNorm:bad,stressNorm:norm,pressureDerivativeNorm:norm}));
});

test('the exact common-ci upper bound keeps the original fixed floor index and all three positive factors',()=>{
  const ell=G.fresh('initial_temporal_fixed_ell'),r=originalCommonCiUpperFactorization(G,{ell});fixtures.ci=r;
  assert.equal(r.identity.pass,true);assert.equal(r.upperConstant,G.one);assert.equal(r.factors.length,3);
  assert.equal(r.continuousSSubstitutedForReferenceBand,false);assert.equal(r.h,G.parameter('h'));
  assert.deepEqual(r.requiredDomain,['ell_ref-2>=8','0<=defect<1','Tg>1','h>0']);
});

test('unimproved temporal A1 keeps all six fixed constants and complete3^m product distributions',()=>{
  fixtures.rawCutoff=Array.from({length:9},(_,order)=>originalRawTemporalCutoffMajorant(G,{order,
    outputPrefactor:q(2),outputComposition:q(3),cutoffDerivative:q(5),wholeIntegral:q(7),middleZetaInverse:q(11),transformedSource:q(13)}));
  for(const r of fixtures.rawCutoff){assert.equal(r.productCoefficientSum,String(3n**BigInt(r.order)));assert.equal(r.factors.length,6);
    assert.equal(r.positiveIBPGainUsed,false);assert.equal(r.addedSPower,0);assert.equal(r.sourceDerivativeOrder,r.order);}
});

test('full temporal products retain radial epsilon, both slow time terms, and the nonzero fast A1 defect',()=>{
  const field=(constant,power,pole)=>({constant:q(constant),power,pole,epsilonExponent:'1-kappa_s',weight:'zeta',gaussian:'1'}),
    desiredRows=Array.from({length:6},(_,order)=>({order,v:field(2+order,3+order,4+order),gammaDesired:field(7+order,5+order,6+order)})),
    radialRows=Array.from({length:6},(_,order)=>({order,primitiveConstant:q(11+order),rawCutoffConstant:q(17+order)})),
    c=composeOriginalTemporalClassRows(G,{order:4,desiredRows,radialRows});fixtures.temporal=c;
  fixtures.temporalInputs={desiredRows,radialRows};
  for(const r of c.rows){assert.equal(r.fields.beta.epsilonExponent,'2-kappa_s');assert.equal(r.fields.slowTimeAngular.epsilonExponent,'2-kappa_s');
    assert.equal(r.fields.slowTimeAxial.epsilonExponent,'2-kappa_s');assert.equal(r.fields.fastTimeAxialCutoff.epsilonExponent,'1-kappa_s');
    assert.equal(Object.keys(r.fields).length,9);assert.equal(r.rawCutoffDeclaredZero,false);assert.equal(r.fullGammaIsDesiredMinusActualA1,true);}
  assert.equal(c.flatA1InferredFromUnimprovedNorm,false);assert.equal(c.sourceAuthenticated,false);
  assert.throws(()=>composeOriginalTemporalClassRows(G,{order:5,desiredRows,radialRows}),{code:'RESOURCE_LIMIT'});
  const bad=structuredClone(desiredRows);bad[1].gammaDesired.epsilonExponent='2-kappa_s';
  assert.throws(()=>composeOriginalTemporalClassRows(G,{order:4,desiredRows:bad,radialRows}));
});

test('source attachments reject fixtures, copied source records and supplied completion claims before constructing norms',()=>{
  for(const fake of [{},{sourceAuthenticated:true},{scope:{actualCompleteInitialN6TupleClassCertified:true}}]){
    assert.throws(()=>attachGlobalInitialResidualClass(fake,{}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>assertGlobalInitialResidualClass(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>attachGlobalTemporalClass(fake,{}, {},{}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>assertGlobalTemporalClass(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
  }
});

after(async()=>{
  if(process.env.MATHSCOPE_INITIAL_TEMPORAL_CLASS_DIRECTORY)
    await writeFile(process.env.MATHSCOPE_INITIAL_TEMPORAL_CLASS_DIRECTORY+'/initial-temporal-class-kernel.json',JSON.stringify({
      schema:'MathScope.N6.InitialTemporalClassKernelFixture/1',fixtures,program:G.pack({R,Z,T,Y}),
      sourceAuthenticated:false,actualPrivateCurrentAttachmentExecuted:false,completeInitialTupleClass:false,completeN6:false},null,2)+'\n');
});
