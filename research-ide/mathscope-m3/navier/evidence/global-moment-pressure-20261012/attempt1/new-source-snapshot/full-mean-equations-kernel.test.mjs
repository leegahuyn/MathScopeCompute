import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {exactAuxiliaryMeanPDE} from '../source-global-moment.mjs';
import {exactFullAuxiliaryMeanPDE,exactFullMeanMomentRemainders} from '../source-full-mean-equations.mjs';

const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:200000}).pass;
function control(){
  const G=new ActualConvergentExpressions(),q=n=>G.q(n),[R,Z,T,y0,y1]=['R','Z','T','y0','y1'].map(n=>G.fresh(n)),Y=[y0,y1],
    epsilon=G.q(2,5),ci=G.q(7,3),radialFast=G.pow(R,2),vr=[G.one,G.q(-2)],vt=[G.q(3),G.one],
    geometry={R,Z,T,Y,vr,vt,epsilon,ci,radialFast},
    background={b:G.mul(R,Z),V:G.add(G.pow(R,2),T),G:G.mul(R,T)},
    velocity={beta:G.mul(R,y0,T),v:G.add(G.mul(Z,y1),G.pow(y0,2)),gamma:G.mul(R,Z,y0,y1)},
    covariance=Object.fromEntries(['rr','rtheta','rz','thetatheta','thetaz','zz'].map((name,j)=>[name,G.add(G.mul(q(j+1),R,y0),G.mul(Z,y1,T))])),
    stress=[G.mul(R,Z),G.mul(G.pow(R,2),T)],pressure=G.mul(R,Z,y0,y1),input={geometry,background,velocity,covariance,stress,pressure};
  return {G,q,R,Z,T,Y,...input,input};
}

test('all full angular-mean equations equal independent complete conservative cylindrical momentum minus its background',()=>{
  const s=control(),{G,q,R,Z,T,Y,geometry:g,background:b,velocity:u,covariance:W,stress,pressure}=s,
    Dr=f=>G.add(G.derivative(f,R),G.mul(g.radialFast,G.sub(G.derivative(f,Y[0]),G.mul(q(2),G.derivative(f,Y[1]))))),
    Dz=f=>G.mul(g.epsilon,G.derivative(f,Z)),time=f=>G.add(G.neg(G.mul(g.epsilon,G.derivative(f,T))),
      G.mul(g.ci,G.add(G.mul(q(3),G.derivative(f,Y[0])),G.derivative(f,Y[1])))),
    lap=f=>G.add(Dr(Dr(f)),G.div(Dr(f),R),Dz(Dz(f))),
    momentum=([r,v,z],w)=>[
      G.add(time(r),Dr(G.add(G.pow(r,2),w.rr)),G.div(G.add(G.pow(r,2),w.rr),R),Dz(G.add(G.mul(r,z),w.rz)),
        G.neg(G.div(G.add(G.pow(v,2),w.thetatheta),R)),G.neg(G.mul(g.epsilon,G.sub(lap(r),G.div(r,G.pow(R,2)))))),
      G.add(time(v),Dr(G.add(G.mul(r,v),w.rtheta)),G.div(G.mul(q(2),G.add(G.mul(r,v),w.rtheta)),R),Dz(G.add(G.mul(v,z),w.thetaz)),
        G.neg(G.mul(g.epsilon,G.sub(lap(v),G.div(v,G.pow(R,2)))))),
      G.add(time(z),Dr(G.add(G.mul(r,z),w.rz)),G.div(G.add(G.mul(r,z),w.rz),R),Dz(G.add(G.pow(z,2),w.zz)),G.neg(G.mul(g.epsilon,lap(z))))],
    total=momentum([G.add(b.b,u.beta),G.add(b.V,u.v),G.add(b.G,u.gamma)],W),
    base=momentum([b.b,b.V,b.G],Object.fromEntries(Object.keys(W).map(n=>[n,G.zero]))),
    direct=[G.neg(G.sub(total[0],base[0])),G.sub(G.sub(total[1],base[1]),G.add(Dr(stress[0]),G.div(G.mul(q(2),stress[0]),R))),
      G.sub(G.add(G.sub(total[2],base[2]),Dz(pressure)),G.add(Dr(stress[1]),G.div(stress[1],R)))],
    actual=exactFullAuxiliaryMeanPDE(G,s.input);
  [actual.gr,actual.Etheta,actual.Ez].forEach((root,j)=>assert.equal(equal(G,root,direct[j]),true));
  const noFastTime=exactFullAuxiliaryMeanPDE(G,{...s.input,geometry:{...g,ci:G.zero}});
  assert.equal(equal(G,actual.Etheta,noFastTime.Etheta),false);assert.equal(equal(G,actual.gr,noFastTime.gr),false);
  const noSecondAuxiliary=exactFullAuxiliaryMeanPDE(G,{...s.input,geometry:{...g,vr:[G.one,G.zero]}});
  assert.equal(equal(G,actual.Ez,noSecondAuxiliary.Ez),false);
});

test('the full (8.26)-(8.27) difference retains every old/new and quadratic product on a nonzero auxiliary control',()=>{
  const s=control(),{G,R,Z,T,Y,velocity:old}=s,increment={beta:G.mul(R,Y[1]),v:G.mul(T,Y[0],Y[1]),gamma:G.mul(Z,G.pow(Y[0],2))},
    current=exactFullAuxiliaryMeanPDE(G,s.input),next=exactFullAuxiliaryMeanPDE(G,{...s.input,
      velocity:Object.fromEntries(Object.entries(old).map(([n,x])=>[n,G.add(x,increment[n])]))}),
    remainder=exactFullMeanMomentRemainders(G,{geometry:s.geometry,background:s.background,previous:old,increment});
  assert.equal(equal(G,G.sub(G.sub(next.gr,current.gr),remainder.linear.PIntegrand),remainder.Rg),true);
  assert.equal(equal(G,G.sub(G.sub(next.fluxTheta,current.fluxTheta),remainder.linear.JthetaIntegrand),remainder.JthetaIntegrand),true);
  const expectedZ=G.add(G.mul(G.q(2),R,s.background.G,increment.gamma),remainder.JzVelocityIntegrand);
  assert.equal(equal(G,G.sub(next.fluxZ,current.fluxZ),expectedZ),true);
  for(const term of Object.values(remainder.terms))assert.equal(equal(G,remainder.Rg,G.sub(remainder.Rg,term)),false);
});

test('an auxiliary-independent tuple reduces exactly to the full existing zero-mode equations',()=>{
  const s=control(),{G,R,Z,T}=s,velocity={beta:G.mul(R,Z),v:G.mul(R,T),gamma:G.mul(Z,T)},
    W=Object.fromEntries(Object.keys(s.covariance).map((n,j)=>[n,G.mul(G.q(j+1),R,Z,T)])),pressure=G.mul(R,G.pow(Z,2)),
    full=exactFullAuxiliaryMeanPDE(G,{...s.input,velocity,covariance:W,pressure}),
    zero=exactAuxiliaryMeanPDE(G,{coordinates:{R,Z,T},epsilon:s.geometry.epsilon,background:s.background,velocity,covariance:W,stress:s.stress,pressure});
  for(const name of ['gr','Etheta','Ez','fluxTheta','fluxZ','divergence'])assert.equal(equal(G,full[name],zero[name]),true);
  assert.equal(full.sourceAuthenticated,false);assert.equal(full.fullNonzeroAngularPDEConstructed,false);
});

test('missing original operator factors or one covariance component are rejected',()=>{
  const s=control();assert.throws(()=>exactFullAuxiliaryMeanPDE(s.G,{...s.input,geometry:{...s.geometry,ci:undefined}}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactFullAuxiliaryMeanPDE(s.G,{...s.input,covariance:{...s.covariance,thetaz:undefined}}),{code:'INVALID_INPUT'});
});
