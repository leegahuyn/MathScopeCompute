import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {originalFreshMeanClassDerivativeDemand,composeOriginalFreshMeanDefectRows,
  composeOriginalFiveMomentRemainderRows,composeOriginalFiveMapClassRows} from '../source-fresh-mean-class-kernel.mjs';
import {exactFullAuxiliaryMeanPDE,exactFullMeanMomentRemainders} from '../source-full-mean-equations.mjs';
import {radialFactorial} from '../source-radial-class-kernel.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';

const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),B=q(2),
  norm=(constant,epsilonExponent,weight='zeta',pole=2,power=3)=>({constant:q(constant),epsilonExponent,weight,pole,power,gaussian:'1'}),
  rows=(length,fields)=>Array.from({length},(_,order)=>({order,...Object.fromEntries(Object.entries(fields).map(([key,f])=>
    [key,{...f,constant:G.mul(f.constant,q(2n**BigInt(order)))}]))})),
  backgroundRows=rows(7,{b:norm(128,'1','1',0,0),V:norm(128,'0','1',0,0),G:norm(128,'0','1',0,0)}),
  velocityRows=rows(8,{beta:norm(128,'2-kappa_s'),v:norm(128,'1-kappa_s'),gamma:norm(128,'1-kappa_s')}),
  covarianceRows=rows(7,Object.fromEntries(['rr','rtheta','rz','thetatheta','thetaz','zz'].map(k=>[k,norm(256,'1')]))),
  radialDerivativeBounds=Array.from({length:9},(_,j)=>G.mul(q(radialFactorial(j+4)),G.pow(B,j+4))),
  fixed={radiusBase:B,radialDerivativeBounds,wholeHaarProjection:q(1024),projectionPole:32,maxWork:200000},
  input={order:2,backgroundRows,velocityRows,covarianceRows,...fixed},fixtures={};

test('fresh mean demands keep complete beta viscosity and all three fresh five-map target derivatives',()=>{
  fixtures.demands=Array.from({length:21},(_,order)=>originalFreshMeanClassDerivativeDemand({order}));
  for(const [m,r]of fixtures.demands.entries()){
    assert.equal(r.requiredVelocityOrder,m+2);assert.equal(r.requiredBackgroundOrder,m+1);
    assert.equal(r.requiredCovarianceOrder,m+1);assert.equal(r.requiredFiveMapInputDefectOrder,m+1);
    assert.equal(r.requiredPreFiveVelocityOrder,m+5);assert.equal(r.requiredInitializedInputDefectOrder,m+3);
    assert.equal(r.fullPressureMomentInsideJz,true);assert.equal(r.sourceAuthenticated,false);
  }
  for(const bad of [{order:-1},{order:1.2},{order:Number.MAX_SAFE_INTEGER},{order:0,completeN6:true}])
    assert.throws(()=>originalFreshMeanClassDerivativeDemand(bad));
});

test('all five complete gr groups and both old/new flux products precede the three actual scalar moments',()=>{
  fixtures.fresh=composeOriginalFreshMeanDefectRows(G,input);
  for(const [m,r]of fixtures.fresh.rows.entries()){
    assert.equal(r.order,m);assert.deepEqual(Object.keys(r.grTerms),['time','radial','axial','centrifugal','viscous']);
    assert.deepEqual(Object.keys(r.fluxThetaTerms),['backgroundAxial','backgroundAngular','completeMeanQuadratic','completeCovariance']);
    assert.deepEqual(Object.keys(r.fluxZTerms),['backgroundAxial','completeMeanSquare','completeCovariance']);
    assert.equal(r.gr.epsilonExponent,'1-kappa_s');assert.equal(r.gr.epsilonExponentExact,'99999/100000');
    assert.equal(r.grTerms.time.epsilonExponent,'2-kappa_s');
    assert.equal(r.grTerms.viscous.epsilonExponent,'3-3*kappa_s');
    assert.equal(r.gr.weight,'zeta');assert.equal(r.defects.P.weight,'1');assert.equal(r.defects.P.pole,0);
    assert.equal(r.defects.Jz.constant,G.add(r.JzParts.axialMoment.constant,r.JzParts.pressureMoment.constant));
    assert.equal(r.pressureMomentDiscarded,false);
  }
  assert.equal(fixtures.fresh.fullSixComponentCovarianceInputRetained,true);
  assert.equal(fixtures.fresh.sourceAuthenticated,false);assert.equal(fixtures.fresh.actualInputSourceClassesCertified,false);
});

test('insufficient covariance, velocity, radial coefficient or actual pole budget is rejected',()=>{
  for(const changed of [
    {...input,velocityRows:velocityRows.slice(0,4)},
    {...input,covarianceRows:covarianceRows.slice(0,3)},
    {...input,backgroundRows:backgroundRows.slice(0,3)},
    {...input,radialDerivativeBounds:radialDerivativeBounds.slice(0,3)},
    {...input,projectionPole:1},
    {...input,maxWork:5}
  ])assert.throws(()=>composeOriginalFreshMeanDefectRows(G,changed),{code:'RESOURCE_LIMIT'});
});

test('open or negative norms and a missing entire covariance component grant no conditional bound',()=>{
  const bad=structuredClone(velocityRows),x=G.fresh('forbidden_mean_norm_coordinate');bad[0].v.constant=x;
  assert.throws(()=>composeOriginalFreshMeanDefectRows(G,{...input,velocityRows:bad}),{code:'INVALID_INPUT'});
  bad[0].v.constant=q(-1);assert.throws(()=>composeOriginalFreshMeanDefectRows(G,{...input,velocityRows:bad}),{code:'INVALID_INPUT'});
  const missing=structuredClone(covarianceRows);delete missing[0].rtheta;
  assert.throws(()=>composeOriginalFreshMeanDefectRows(G,{...input,covarianceRows:missing}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>composeOriginalFreshMeanDefectRows(G,{...input,sourceAuthenticated:true}),{code:'INVALID_INPUT'});
});

test('the actual five-row nonlinear remainder keeps every old mean interaction and reaches its conservative source gain',()=>{
  fixtures.remainder=composeOriginalFiveMomentRemainderRows(G,{order:2,backgroundRows,previousRows:velocityRows,
    incrementRows:velocityRows,...fixed});
  for(const row of fixtures.remainder.rows){
    assert.deepEqual(Object.keys(row.terms),['time','radial','axial','angular','viscous']);
    assert.equal(row.Rg.epsilonExponent,'2-2*kappa_s');
    assert.equal(row.Rg.epsilonExponentExact,'99999/50000');
    assert.equal(row.defects.P.epsilonExponent,'2-2*kappa_s');
    assert.equal(row.defects.Jtheta.epsilonExponent,'2-2*kappa_s');
    assert.equal(row.defects.Jz.epsilonExponent,'2-2*kappa_s');
    assert.equal(row.exactCurrentDefectsEqualTheseRemaindersRequiresActualFiveRows,true);
    assert.equal(row.noNewNonlinearDefectDeclaredZero,true);
    assert.equal(row.defects.Jz.constant,G.add(row.JzParts.axial.constant,row.JzParts.pressure.constant));
  }
  assert.equal(fixtures.remainder.actualFiveRowCancellationRequired,true);assert.equal(fixtures.remainder.originalProp9_5Certified,false);
});

test('a large actual old mean norm remains in the new nonlinear defect constant',()=>{
  const changed=structuredClone(velocityRows);for(const r of changed)r.v.constant=G.mul(q(1000),r.v.constant);
  const actual=composeOriginalFiveMomentRemainderRows(G,{order:2,backgroundRows,previousRows:changed,incrementRows:velocityRows,...fixed});
  assert.notEqual(actual.rows[0].terms.angular.constant,fixtures.remainder.rows[0].terms.angular.constant);
  assert.notEqual(actual.rows[0].defects.Jz.constant,fixtures.remainder.rows[0].defects.Jz.constant);
  fixtures.changedOldMean=actual;
});

test('fixed five-map consumes complete fresh P/J norms with retained beta derivative and epsilon gain',()=>{
  const defectRows=composeOriginalFreshMeanDefectRows(G,{...input,order:3}).rows,
    operatorRows=Array.from({length:3},(_,order)=>({order,requiredTargetDerivativeOrder:order+1,sPolynomialPower:0,
      componentBounds:{v:q(11+order),gamma:q(13+order),psi:q(17+order),betaOverEpsilon:q(19+order)}}));
  fixtures.fiveInput={defectRows,operatorRows};fixtures.five=composeOriginalFiveMapClassRows(G,{order:2,defectRows,operatorRows,maxWork:10000});
  for(const [m,r]of fixtures.five.rows.entries()){
    assert.equal(r.inputOrder,m+1);assert.equal(r.allThreeFreshInputNorms.length,3);
    assert.equal(r.fields.v.epsilonExponent,'1-kappa_s');assert.equal(r.fields.beta.epsilonExponent,'2-kappa_s');
    assert.equal(r.fields.v.weight,'zeta');assert.equal(r.fields.beta.pole,0);
    assert.equal(r.combinedInput.constant,G.add(...['P','Jtheta','Jz'].map(k=>defectRows[m+1].defects[k].constant)));
    assert.equal(r.fields.beta.constant,G.mul(r.combinedInput.constant,operatorRows[m].componentBounds.betaOverEpsilon));
  }
  assert.equal(fixtures.five.sourceAuthenticated,false);assert.equal(fixtures.five.actualCurrentInputClassCertified,false);
});

test('five-map rejects stale derivative rows, omitted Jz, wrong fixed map demands and a missing target tail',()=>{
  const {defectRows,operatorRows}=fixtures.fiveInput,missing=structuredClone(defectRows);delete missing[1].defects.Jz;
  const changed=structuredClone(operatorRows);changed[0].requiredTargetDerivativeOrder=0;
  for(const p of [{defectRows:missing,operatorRows},{defectRows,operatorRows:changed},
    {defectRows:defectRows.slice(0,3),operatorRows},{defectRows,operatorRows:operatorRows.slice(0,2)}])
    assert.throws(()=>composeOriginalFiveMapClassRows(G,{order:2,...p}));
});

test('exact fixture source retains independent slow and both torus dependence, all full gr and nonlinear moment terms',()=>{
  const R=G.fresh('fresh_fixture_R'),Z=G.fresh('fresh_fixture_Z'),T=G.fresh('fresh_fixture_T'),
    Y=[G.fresh('fresh_fixture_Y0'),G.fresh('fresh_fixture_Y1')],
    geometry={R,Z,T,Y,epsilon:G.one,ci:G.one,radialFast:G.mul(q(3),G.pow(R,2)),
      vr:[G.one,G.sub(G.one,G.sqrt(q(2)))],vt:[G.sub(G.sqrt(q(2)),G.one),G.one]},
    background={b:G.add(R,G.mul(Z,T)),V:G.add(G.one,G.pow(R,2)),G:G.add(G.mul(R,Z),G.pow(T,2))},
    previous={beta:G.mul(G.pow(R,2),G.add(G.one,G.mul(Z,T)),G.add(G.one,Y[0],G.pow(Y[1],2))),
      v:G.mul(G.add(R,G.pow(Z,2)),G.add(G.one,T,G.mul(Y[0],Y[1]))),
      gamma:G.mul(G.add(G.one,G.mul(R,Z)),G.add(G.one,G.pow(T,2),G.pow(Y[0],2),Y[1]))},
    increment={beta:G.add(G.mul(R,G.add(G.one,Z),T,G.add(G.one,G.pow(Y[0],2))),G.pow(Y[1],2)),
      v:G.add(G.mul(G.sub(R,Z),G.add(G.one,G.mul(T,Y[0]))),Y[1]),
      gamma:G.mul(G.add(R,T),G.add(G.one,G.mul(Z,Y[1])))},
    covariance={rr:G.mul(G.pow(R,2),G.add(G.one,Y[0],G.pow(Y[1],2))),
      rtheta:G.mul(G.add(R,Z),G.add(G.one,T,Y[0])),rz:G.mul(G.add(G.one,R),G.add(G.one,Z,T,Y[1])),
      thetatheta:G.add(G.pow(R,3),G.pow(Z,2),G.pow(Y[0],2)),
      thetaz:G.mul(G.add(G.one,R,T),G.add(G.one,Y[0],Y[1])),zz:G.mul(G.add(G.one,G.pow(R,2)),G.add(G.one,G.pow(T,2),G.mul(Y[0],Y[1])))},
    fresh=exactFullAuxiliaryMeanPDE(G,{geometry,background,velocity:previous,covariance,stress:[G.zero,G.zero]}),
    remainder=exactFullMeanMomentRemainders(G,{geometry,background,previous,increment}),
    next=exactFullAuxiliaryMeanPDE(G,{geometry,background,velocity:Object.fromEntries(['beta','v','gamma'].map(k=>[k,G.add(previous[k],increment[k])])),covariance,stress:[G.zero,G.zero]}),
    verify=createFactoredRationalVerifier(G,{maxTerms:30000,maxProducts:1000000}),
    difference=G.sub(G.sub(next.gr,fresh.gr),remainder.linear.PIntegrand),
    identity=verify(G.sub(difference,remainder.Rg));
  assert.equal(identity.pass,true);
  for(const row of Object.values(remainder.terms))assert.equal(verify(row).pass,false);
  for(const y of Y)assert.equal(G.dependsOn(fresh.gr,y),true);
  fixtures.source={geometry,background,previous,increment,covariance,fresh,remainder,next,difference,identity,
    domain:{R:['1','2'],Z:['-1','1'],T:['-1','1'],Y0:['-1','1'],Y1:['-1','1'],epsilon:'1',ci:'1'},
    originalCurrentReplacedByFixture:false,fixtureNormsGrantNoActualSourceAuthority:true};
});

after(async()=>{
  if(process.env.MATHSCOPE_FRESH_MEAN_CLASS_DIRECTORY){
    const payload={schema:'MathScope.N6.FreshMeanClassKernelFixtures/1',fixtures,inputs:{backgroundRows,velocityRows,covarianceRows,fixed},
      program:G.pack({}),actualCurrentAttachmentExecuted:false,sourceAuthenticated:false,completeN6:false};
    await writeFile(process.env.MATHSCOPE_FRESH_MEAN_CLASS_DIRECTORY+'/fresh-mean-class-kernel.json',JSON.stringify(payload,null,2)+'\n');
  }
});
