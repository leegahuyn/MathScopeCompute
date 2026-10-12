import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {exactFiveMomentCoefficients,exactAuxiliaryMeanPDE,exactMeanMomentRemainders,attachGlobalMomentCurrent} from '../source-global-moment.mjs';

const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:180000}).pass;
function fixture(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),R=G.fresh('test_r'),Z=G.fresh('test_z'),T=G.fresh('test_t'),
    background={b:G.add(q(2),G.mul(R,Z)),V:G.add(R,G.mul(Z,T)),G:G.add(G.mul(R,T),G.pow(Z,2))},
    previous={beta:G.add(G.pow(R,2),Z,T),v:G.add(G.mul(R,Z),G.pow(T,2)),gamma:G.add(G.mul(R,T),Z)},
    increment={beta:G.add(G.mul(R,Z,T),G.pow(Z,2)),v:G.add(G.pow(R,2),G.mul(Z,T)),gamma:G.add(G.mul(R,Z),G.pow(T,2))},
    covariance=Object.fromEntries(['rr','rtheta','rz','thetatheta','thetaz','zz'].map((n,j)=>[n,G.add(G.mul(q(j+1),R,Z),G.mul(q(j+2),T),G.pow(R,2))])),
    epsilon=q(1,7),stress=[G.add(G.pow(R,2),Z),G.add(G.mul(R,Z),T)],pressure=G.add(G.mul(R,Z),G.pow(T,2));
  return {G,q,coordinates:{R,Z,T},epsilon,background,previous,increment,covariance,stress,pressure};
}

test('exact five-row solve agrees with independent rational Gaussian elimination for signed actual-shaped targets',()=>{
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),input={angularNodes:[q(3),q(1,2),q(1)],
    angularFactors:[q(7),q(11),q(-13)],angularTargets:[G.zero,q(-17),q(19)],
    axialNode:q(2),axialRatio:q(3,4),axialFactors:[q(5),q(23)],axialTarget:q(-29)},
    out=exactFiveMomentCoefficients(G,input);
  assert.equal(out.checks.length,5);assert.ok(out.checks.every(x=>x.pass));assert.equal(out.sourceAuthenticated,false);
  // Solve the block matrix by ordinary row elimination, without using
  // geometric nodes, a Lagrange formula or the factored axial inverse.
  const rows=[...out.angularMatrix.map(row=>[...row,G.zero,G.zero]),
    ...out.axialMatrix.map(row=>[G.zero,G.zero,G.zero,...row])],rhs=[...input.angularTargets,G.zero,input.axialTarget],
    augmented=rows.map((row,i)=>[...row,rhs[i]]);
  for(let k=0;k<5;k++){
    const pivot=augmented[k][k];assert.notEqual(pivot,G.zero);
    augmented[k]=augmented[k].map(x=>G.div(x,pivot));
    for(let i=0;i<5;i++)if(i!==k){const factor=augmented[i][k];augmented[i]=augmented[i].map((x,j)=>G.sub(x,G.mul(factor,augmented[k][j])));}
  }
  [...out.angular,...out.axial].forEach((x,j)=>assert.equal(equal(G,x,augmented[j][5]),true));
  assert.ok(out.angular.some(x=>x!==G.zero));assert.ok(out.axial.every(x=>x!==G.zero));
  const droppedAxialGap=G.div(input.axialTarget,input.axialFactors[1]);
  assert.equal(equal(G,out.axial[0],droppedAxialGap),false);
});

test('symbolic original-scale row factors remain exact and no small positive axial gap is rounded away',()=>{
  const G=new ActualConvergentExpressions(),z=[0,1,2].map(j=>G.fresh('z'+j)),f=[0,1,2].map(j=>G.fresh('factor'+j)),
    P=G.fresh('P'),Jz=G.fresh('Jz'),Jtheta=G.fresh('Jtheta'),lambda=G.parameter('lambda'),d=G.q(1,5),
    ratio=G.exp(G.mul(G.q(-2),d,lambda)),out=exactFiveMomentCoefficients(G,{angularNodes:z,angularFactors:f,angularTargets:[G.zero,G.neg(P),G.neg(Jz)],
      axialNode:G.exp(d),axialRatio:ratio,axialFactors:[G.fresh('mu1'),G.fresh('amu')],axialTarget:G.neg(Jtheta)});
  assert.ok(out.checks.every(x=>x.pass));assert.equal(out.gap,G.sub(G.one,ratio));assert.notEqual(out.gap,G.zero);
  assert.equal(out.binary64ExponentialsSubtracted,false);assert.equal(out.sourceLambdaReplaced,false);
  assert.equal(G.nodes[ratio].op,'exp');assert.equal(G.nodes[lambda].args[0],'lambda');
});

test('the expanded mean equations equal independent full conservative cylindrical equations minus their original background',()=>{
  const f=fixture(),{G,q,coordinates:{R,Z,T},epsilon,background:b,previous:mean,covariance:W,stress,pressure}=f,
    dr=x=>G.derivative(x,R),dz=x=>G.mul(epsilon,G.derivative(x,Z)),dt=x=>G.neg(G.mul(epsilon,G.derivative(x,T))),
    divergenceFlux=(x,n)=>G.div(dr(G.mul(G.pow(R,n),x)),G.pow(R,n)),
    lap=x=>G.add(G.div(dr(G.mul(R,dr(x))),R),dz(dz(x))),
    full=(u,W,pm)=>({
      r:G.add(dt(u.r),divergenceFlux(G.add(G.pow(u.r,2),W.rr),1),dz(G.add(G.mul(u.r,u.z),W.rz)),
        G.neg(G.div(G.add(G.pow(u.theta,2),W.thetatheta),R)),G.neg(G.mul(epsilon,G.sub(lap(u.r),G.div(u.r,G.pow(R,2)))))),
      theta:G.add(dt(u.theta),divergenceFlux(G.add(G.mul(u.r,u.theta),W.rtheta),2),dz(G.add(G.mul(u.z,u.theta),W.thetaz)),
        G.neg(G.mul(epsilon,G.sub(lap(u.theta),G.div(u.theta,G.pow(R,2)))))),
      z:G.add(dt(u.z),divergenceFlux(G.add(G.mul(u.r,u.z),W.rz),1),dz(G.add(G.pow(u.z,2),W.zz,pm)),G.neg(G.mul(epsilon,lap(u.z))))}),
    zero=Object.fromEntries(Object.keys(W).map(k=>[k,G.zero])),base=full({r:b.b,theta:b.V,z:b.G},zero,G.zero),
    total=full({r:G.add(b.b,mean.beta),theta:G.add(b.V,mean.v),z:G.add(b.G,mean.gamma)},W,pressure),
    out=exactAuxiliaryMeanPDE(G,{...f,velocity:mean});
  assert.equal(equal(G,out.gr,G.neg(G.sub(total.r,base.r))),true);
  assert.equal(equal(G,out.Etheta,G.sub(G.sub(total.theta,base.theta),divergenceFlux(stress[0],2))),true);
  assert.equal(equal(G,out.Ez,G.sub(G.sub(total.z,base.z),divergenceFlux(stress[1],1))),true);
  assert.equal(out.allBackgroundAndSixCovarianceTermsRetained,true);assert.equal(out.fullNonzeroAuxiliaryResidualConstructed,false);
  assert.equal(equal(G,out.gr,G.add(G.neg(G.sub(total.r,base.r)),G.div(W.thetatheta,R))),false);
});

test('all old/new products in (8.26)-(8.27) survive and their deletion is detected on independent nonconstant fields',()=>{
  const f=fixture(),{G,q,coordinates:{R},previous,increment,background}=f,
    before=exactAuxiliaryMeanPDE(G,{...f,velocity:previous}),
    after=exactAuxiliaryMeanPDE(G,{...f,velocity:Object.fromEntries(Object.keys(previous).map(n=>[n,G.add(previous[n],increment[n])]))}),
    remainders=exactMeanMomentRemainders(G,f),observed=G.sub(G.sub(after.gr,before.gr),remainders.linear.PIntegrand);
  assert.equal(equal(G,observed,remainders.Rg),true);
  for(const term of Object.values(remainders.terms)){
    assert.notEqual(term,G.zero);assert.equal(equal(G,observed,G.sub(remainders.Rg,term)),false);
  }
  assert.equal(equal(G,G.sub(G.sub(after.fluxTheta,before.fluxTheta),remainders.linear.JthetaIntegrand),remainders.JthetaIntegrand),true);
  assert.equal(equal(G,G.sub(after.fluxZ,before.fluxZ),G.add(G.mul(q(2),R,background.G,increment.gamma),remainders.JzVelocityIntegrand)),true);
  for(const term of [G.mul(previous.gamma,increment.v),G.mul(previous.v,increment.gamma),G.mul(increment.gamma,increment.v)])
    assert.equal(equal(G,remainders.JthetaIntegrand,G.sub(remainders.JthetaIntegrand,G.mul(G.pow(R,2),term))),false);
  assert.equal(remainders.nonlinearRemaindersDeclaredZero,false);assert.equal(remainders.allOldNewAndQuadraticTermsRetained,true);
});

test('a zero old mean still leaves the newly generated quadratic angular and axial remainders',()=>{
  const f=fixture(),{G,coordinates:{R},increment}=f,previous={beta:G.zero,v:G.zero,gamma:G.zero},out=exactMeanMomentRemainders(G,{...f,previous});
  assert.equal(equal(G,out.terms.angular,G.div(G.pow(increment.v,2),R)),true);
  assert.equal(equal(G,out.JthetaIntegrand,G.mul(G.pow(R,2),increment.gamma,increment.v)),true);
  assert.equal(equal(G,out.JzVelocityIntegrand,G.mul(R,G.pow(increment.gamma,2))),true);
  assert.notEqual(out.terms.angular,G.zero);assert.notEqual(out.JzVelocityIntegrand,G.zero);
});

test('a receipt, generic supplied targets and incomplete fields cannot become original global moment authority',()=>{
  const G=new ActualConvergentExpressions();
  for(const fake of [{},{G,mean:{P:G.one,Jtheta:G.one,Jz:G.one}},
    {scope:{actualOriginalFullCoverMeanConstructed:true,initializedJ0:true}}])
    assert.throws(()=>attachGlobalMomentCurrent(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>exactAuxiliaryMeanPDE(G,{coordinates:{R:G.one,Z:G.one,T:G.one}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>exactFiveMomentCoefficients(G,{angularNodes:[G.one]}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});
