import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {exactPhysicalVelocityJets,physicalCoordinateTuple} from '../actual-physical-jet-kernel.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {prepareActualTerminalPhysicalVelocityJets,attachActualTerminalPhysicalVelocityJets,assertActualTerminalPhysicalVelocityJets} from '../actual-terminal-physical-velocity-jets.mjs';

const same=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:100000}).pass;
function fixture(){const G=new ActualConvergentExpressions(),coordinates=Object.fromEntries(['R','Z','T','theta','xi','v'].map(n=>[n,G.fresh('physical_'+n)]));return {G,...coordinates,coordinates};}

function cartesianExample(){
  const f=fixture(),{G,R,Z,T,theta,xi,v,coordinates}=f,epsilon=G.q(2),c=G.cosine(theta),s=G.sine(theta),
    X=G.fresh('reference_x'),Y=G.fresh('reference_y'),z=G.fresh('reference_z'),t=G.fresh('reference_t'),
    body=(x,y,z,xi,T,v)=>[
      G.add(G.mul(G.pow(x,2),y),G.mul(G.pow(xi,2),z),G.mul(v,x,y),G.mul(T,G.pow(z,2))),
      G.add(G.mul(G.pow(y,2),z),G.mul(xi,x,z),G.mul(G.pow(v,2),y),G.mul(T,G.pow(x,2))),
      G.add(G.mul(G.pow(z,2),x),G.mul(xi,G.pow(y,2)),G.mul(v,x,z),G.mul(T,y,z),G.mul(xi,v,T))],
    pressureBody=(x,y,z,xi,T,v)=>G.add(G.pow(xi,2),G.mul(x,y,z),G.mul(T,v),G.mul(z,G.pow(v,2))),
    A=body(G.mul(R,c),G.mul(R,s),G.div(Z,epsilon),xi,T,v),
    potential=[G.add(G.mul(c,A[0]),G.mul(s,A[1])),G.sub(G.mul(c,A[1]),G.mul(s,A[0])),A[2]],
    pressure=pressureBody(G.mul(R,c),G.mul(R,s),G.div(Z,epsilon),xi,T,v),radialFast=G.mul(G.q(4),G.pow(R,3)),
    p=exactPhysicalVelocityJets(G,{...coordinates,epsilon,radialFast,potential,pressure}),
    referenceXi=G.add(G.one,G.pow(G.add(G.pow(X,2),G.pow(Y,2)),2)),referenceT=G.sub(G.q(5),G.mul(epsilon,t)),
    referencePotential=body(X,Y,z,referenceXi,referenceT,t),axes=[X,Y,z],derivative=(a,j)=>G.derivative(a,axes[j]),
    velocity=[G.sub(derivative(referencePotential[2],1),derivative(referencePotential[1],2)),G.sub(derivative(referencePotential[0],2),derivative(referencePotential[2],0)),G.sub(derivative(referencePotential[1],0),derivative(referencePotential[0],1))],
    gradient=velocity.map(x=>axes.map(a=>G.derivative(x,a))),pairs=[[0,0],[0,1],[0,2],[1,1],[1,2],[2,2]],
    hessian=velocity.map((x,j)=>pairs.map(([a,b])=>G.derivative(gradient[j][a],axes[b]))),time=velocity.map(x=>G.derivative(x,t)),
    referencePressure=pressureBody(X,Y,z,referenceXi,referenceT,t),pressureGradient=axes.map(a=>G.derivative(referencePressure,a));
  const point=(r,Zvalue,tvalue)=>{
    const rr=G.q(r),zz=G.q(Zvalue),tt=G.q(tvalue),values=[rr,zz,G.sub(G.q(5),G.mul(epsilon,tt)),G.zero,G.add(G.one,G.pow(rr,4)),tt];
    return {actual:x=>G.simultaneousSubstitute(x,[R,Z,T,theta,xi,v],values),reference:x=>G.simultaneousSubstitute(x,[X,Y,z,t],[rr,G.zero,G.div(zz,epsilon),tt])};
  };
  return {...f,p,epsilon,radialFast,potential,pressure,reference:{velocity,gradient,hessian,time,pressureGradient},point};
}

test('physical curl, all first and second spatial jets, time and pressure match independent Cartesian polynomial differentiation',()=>{
  const{G,p,reference,point}=cartesianExample();
  assert.deepEqual(p.counts,{velocity:3,gradient:9,symmetricHessian:18,time:3,pressureGradient:3,usedBodyPartials:p.counts.usedBodyPartials,maxPotentialDerivativeOrderUsed:3,spaceTimePotentialPartialUsed:true});
  for(const values of [[1,2,1],[2,3,2],[3,-1,1]]){
    const at=point(...values);
    for(const name of ['velocity','gradient','hessian','time','pressureGradient']){
      const actual=p.roots[name].flat(),expected=reference[name].flat();
      assert.equal(actual.length,expected.length);
      for(let j=0;j<actual.length;j++)assert.equal(same(G,at.actual(actual[j]),at.reference(expected[j])),true,name+' '+j+' at '+values);
    }
  }
  assert.equal(p.checks.length,19);assert.ok(p.checks.every(c=>c.pass));
  assert.ok(p.potentialBindings.every(b=>b.originalBodyBound&&b.partials.every(c=>c.pass&&c.direct===c.materialized)));
  assert.ok(p.pressureBinding.partials.every(c=>c.order<=1));assert.ok(p.radialFastBinding.partials.some(c=>c.order===2));
});

test('omitting radialFast, its derivatives, basis connection or fast time changes the genuine independent result',()=>{
  const{G,p,R,T,theta,xi,v,coordinates,potential,pressure,epsilon,point}=cartesianExample(),at=point(2,3,1),
    missingFast=exactPhysicalVelocityJets(G,{...coordinates,potential,pressure,epsilon,radialFast:G.zero}),
    frozenFast=exactPhysicalVelocityJets(G,{...coordinates,potential,pressure,epsilon,radialFast:G.q(32)});
  assert.ok(p.roots.velocity.some((x,j)=>!same(G,at.actual(x),at.actual(missingFast.roots.velocity[j]))));
  assert.ok(p.roots.hessian.flat().some((x,j)=>!same(G,at.actual(x),at.actual(frozenFast.roots.hessian.flat()[j]))));
  const Dr=x=>G.add(G.derivative(x,R),G.mul(G.q(4),G.pow(R,3),G.derivative(x,xi))),
    missingConnection=G.sub(Dr(potential[1]),G.div(G.derivative(potential[0],theta),R)),
    connectionDefect=G.sub(p.roots.velocity[2],missingConnection);
  assert.equal(same(G,at.actual(connectionDefect),at.actual(G.div(potential[1],R))),true);
  assert.equal(same(G,at.actual(connectionDefect),G.zero),false);
  const omittedFastTime=p.roots.velocity.map(x=>G.neg(G.mul(epsilon,G.derivative(x,T))));
  assert.ok(p.roots.time.some((x,j)=>!same(G,at.actual(x),at.actual(omittedFastTime[j]))));
  assert.ok(p.roots.velocity.some(x=>!same(G,at.actual(G.derivative(x,v)),G.zero)));
});

test('retained nonpolynomial and moving integral bodies supply every requested mixed fast/slow partial',()=>{
  const {G,R,Z,T,theta,xi,v,coordinates}=fixture(),tau=G.fresh('physical_integral_time'),
    integral=G.integral(G.exp(G.add(G.mul(tau,R),G.mul(T,Z))),tau,G.zero,v),phase=G.add(G.mul(R,Z),theta,G.mul(xi,v)),
    cutoff=G.mul(G.step(G.sub(G.one,G.pow(xi,2))),G.step(v)),amplitude=G.mul(G.sqrt(G.add(G.one,G.pow(R,2))),integral,cutoff),
    potential=[G.mul(amplitude,G.sine(phase)),G.mul(G.exp(Z),amplitude),G.mul(G.cosine(phase),integral)],pressure=G.mul(cutoff,integral,G.cosine(phase)),
    p=exactPhysicalVelocityJets(G,{...coordinates,epsilon:G.q(1,3),radialFast:G.exp(R),potential,pressure});
  assert.ok(p.checks.every(c=>c.pass));assert.ok(p.potentialBindings.every(b=>b.originalBodyBound&&b.partials.every(c=>c.pass)));
  const has=(b,a,baxis)=>b.partials.some(p=>p.orders[b.parameters.indexOf(a)]>0&&p.orders[b.parameters.indexOf(baxis)]>0);
  assert.ok(p.potentialBindings.some(b=>has(b,R,xi)));assert.ok(p.potentialBindings.some(b=>has(b,Z,v)));
  assert.equal(p.counts.maxPotentialDerivativeOrderUsed,3);assert.equal(p.unrequestedHigherJetsDeclaredZero,false);
  assert.equal(p.sourceAuthenticated,false);assert.equal(p.physicalMapAuthenticated,false);assert.equal(p.actualSourceRegularityProved,false);
  assert.equal(p.numericalEnclosureEvaluated,false);assert.equal(p.globalResidualProved,false);assert.equal(p.finiteApproximationSubstitutedForExactBody,false);
});

test('invalid geometry and caller derivative arrays cannot enter the physical derivative construction',()=>{
  const{G,R,Z,T,coordinates}=fixture(),input={...coordinates,epsilon:G.q(2),radialFast:G.pow(R,2),potential:[R,Z,T],pressure:G.mul(R,Z)};
  assert.throws(()=>exactPhysicalVelocityJets(G,{...input,epsilon:G.add(G.one,T)}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactPhysicalVelocityJets(G,{...input,radialFast:G.add(R,Z)}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactPhysicalVelocityJets(G,{...input,potentialJets:[G.zero]}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactPhysicalVelocityJets(G,{...input,pressureGradient:[G.zero]}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactPhysicalVelocityJets(G,{...input,v:T}),{code:'INVALID_INPUT'});
});

test('generic physical identities and caller flags cannot authenticate or replace an actual source',()=>{
  const{G,R,Z,T,coordinates}=fixture(),p=exactPhysicalVelocityJets(G,{...coordinates,epsilon:G.one,radialFast:R,potential:[R,Z,T],pressure:G.zero});
  assert.throws(()=>attachActualTerminalPhysicalVelocityJets(p),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualTerminalPhysicalVelocityJets({G,pass:true,scope:{actualPhysicalSecondVelocityDerivativesConstructed:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>prepareActualTerminalPhysicalVelocityJets({terms:2}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>prepareActualTerminalPhysicalVelocityJets({positiveWeights:true}),{code:'INVALID_INPUT'});
  assert.throws(()=>prepareActualTerminalPhysicalVelocityJets({radialFast:R}),{code:'INVALID_INPUT'});
});

test('source representative metadata stays in the actual bodies without entering the strict six-coordinate operator tuple',()=>{
  const{G,R,Z,T,coordinates}=fixture(),Xrep=G.fresh('physical_fixed_representative'),record={...coordinates,Xrep,sourceLabel:'fixed'},tuple=physicalCoordinateTuple(G,record),
    input={epsilon:G.one,radialFast:R,potential:[G.mul(R,Xrep),Z,T],pressure:G.mul(Xrep,Z)};
  assert.deepEqual(Object.keys(tuple),['R','Z','T','theta','xi','v']);assert.deepEqual(tuple,coordinates);
  assert.throws(()=>exactPhysicalVelocityJets(G,{...record,...input}),{code:'INVALID_INPUT'});
  const p=exactPhysicalVelocityJets(G,{...tuple,...input});assert.equal(p.pass,true);
  assert.ok(p.potentialBindings.some(b=>b.parameters.includes(Xrep)));
  for(const b of [...p.potentialBindings,p.pressureBinding])if(b.parameters.includes(Xrep)){
    assert.equal(b.derivativeLimits[b.parameters.indexOf(Xrep)],0);assert.ok(b.partials.every(c=>c.orders[b.parameters.indexOf(Xrep)]===0));
  }
  assert.throws(()=>physicalCoordinateTuple(G,{...record,R:G.one}),{code:'INVALID_INPUT'});
});
