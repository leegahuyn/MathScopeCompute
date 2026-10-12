import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualPulseThirdJetExpressions,differentiatedThirdScalarJet} from '../actual-pulse-third-jet-kernel.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {exactThirdHarmonicPotentialJets} from '../actual-harmonic-third-jet-kernel.mjs';
import {prepareActualTerminalHarmonicThirdJets,attachActualTerminalHarmonicThirdJets,assertActualTerminalHarmonicThirdJets} from '../actual-terminal-harmonic-third-jets.mjs';

function fixture(){const G=new ActualPulseThirdJetExpressions(new ActualConvergentExpressions()),R=G.fresh('harmonic_R'),Z=G.fresh('harmonic_Z'),T=G.fresh('harmonic_T');return{G,R,Z,T,directions:[R,Z,T]};}
const same=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:50000}).pass;
const row=(p,alpha)=>p.jets.find(j=>j.orders.join(',')===alpha.join(','));

test('all120 real harmonic roots bind the retained nonlinear phase and coefficient bodies',()=>{
  const{G,R,Z,T,directions}=fixture(),phase=G.add(G.mul(R,Z,T),G.pow(R,3),G.mul(Z,T),G.pow(T,2)),coefficient=[G.add(G.one,G.pow(R,2),G.mul(Z,T)),G.add(G.q(2),G.mul(R,Z),G.pow(T,3)),G.add(G.q(3),G.mul(G.pow(R,2),Z),G.mul(R,Z,T))];
  const p=exactThirdHarmonicPotentialJets(G,{coefficient,phase,k:G.q(3),directions});
  assert.equal(p.jets.length,20);assert.equal(p.jets.flatMap(j=>j.roots).length*2,120);assert.equal(p.phaseRecurrenceChecks.length,30);assert.equal(p.recurrenceChecks.length,90);
  assert.ok(p.phaseRecurrenceChecks.every(c=>c.real.pass&&c.imaginary.pass));assert.ok(p.recurrenceChecks.every(c=>c.real.pass&&c.imaginary.pass));
  assert.ok(p.jets.every(j=>j.checks.every(c=>c.pass&&c.real.bodyDerivativeBinding&&c.imaginary.bodyDerivativeBinding)));
  assert.equal(p.sourceAuthenticated,false);assert.equal(p.numericalEnclosureEvaluated,false);assert.equal(p.actualPhysicalSecondVelocityDerivativesConstructed,false);
  assert.equal(p.finiteApproximationSubstitutedForExactBody,false);
});

test('linear phase and constant vector have the exact independent powers of i*k in all mixed orders',()=>{
  const{G,R,Z,T,directions}=fixture(),coefficient=[G.q(2),G.q(-3),G.q(5)],gradient=[1,2,-3],phase=G.add(R,G.mul(G.q(2),Z),G.mul(G.q(-3),T)),k=G.q(7),p=exactThirdHarmonicPotentialJets(G,{coefficient,phase,k,directions});
  const powers=[[0,1],[-1,0],[0,-1],[1,0]];
  for(const jet of p.jets){
    const d=jet.degree,scalar=gradient.reduce((n,g,j)=>n*g**jet.orders[j],7**d);
    for(let c=0;c<3;c++)for(const[part,at]of [['real',0],['imaginary',1]])assert.equal(same(G,jet.coefficients[c][part],G.mul(coefficient[c],G.q(scalar*powers[d][at]))),true);
  }
  const value=p.jets[0];assert.equal(value.roots[0].real,G.neg(G.mul(coefficient[0],G.sine(G.mul(k,phase)))));assert.equal(value.roots[0].imaginary,G.mul(coefficient[0],G.cosine(G.mul(k,phase))));
});

test('repeated third phase and coefficient terms have the independent one-dimensional coefficients',()=>{
  const{G,R}=fixture(),directions=[R],C=G.add(G.q(2),R,G.pow(R,2)),phase=G.add(G.pow(R,2),G.pow(R,3)),k=G.q(2),p=exactThirdHarmonicPotentialJets(G,{coefficient:[C,G.zero,G.one],phase,k,directions}),at=row(p,[3]).coefficients[0];
  const ph1=G.add(G.mul(G.q(2),R),G.mul(G.q(3),G.pow(R,2))),ph2=G.add(G.q(2),G.mul(G.q(6),R)),ph3=G.q(6),c1=G.add(G.one,G.mul(G.q(2),R)),c2=G.q(2);
  const real=G.add(G.neg(G.mul(k,C,ph3)),G.neg(G.mul(G.q(3),k,c1,ph2)),G.neg(G.mul(G.q(3),k,c2,ph1)),G.mul(G.pow(k,3),C,G.pow(ph1,3)));
  const imaginary=G.neg(G.add(G.mul(G.q(3),G.pow(k,2),c1,G.pow(ph1,2)),G.mul(G.q(3),G.pow(k,2),C,ph1,ph2)));
  assert.equal(same(G,at.real,real),true);assert.equal(same(G,at.imaginary,imaginary),true);
  for(const omitted of [G.mul(k,C,ph3),G.mul(G.q(3),k,c1,ph2),G.mul(G.q(3),k,c2,ph1),G.mul(G.pow(k,3),C,G.pow(ph1,3))])assert.equal(same(G,at.real,G.add(real,omitted)),false);
  assert.equal(same(G,at.imaginary,G.add(imaginary,G.mul(G.q(2),G.pow(k,2),C,ph1,ph2))),false);
});

test('the fully mixed RZT jet retains every distinct second-phase pairing and coefficient derivative',()=>{
  const{G,R,Z,T,directions}=fixture(),C=G.add(G.mul(G.pow(R,2),Z),G.mul(Z,G.pow(T,2)),G.mul(R,Z,T)),phase=G.add(G.mul(R,Z),G.mul(Z,T),G.mul(T,R),G.mul(R,Z,T)),k=G.q(5),p=exactThirdHarmonicPotentialJets(G,{coefficient:[C,G.one,G.zero],phase,k,directions});
  const cR=G.add(G.mul(G.q(2),R,Z),G.mul(Z,T)),cZ=G.add(G.pow(R,2),G.pow(T,2),G.mul(R,T)),cT=G.add(G.mul(G.q(2),Z,T),G.mul(R,Z)),cRZ=G.add(G.mul(G.q(2),R),T),cRT=Z,cZT=G.add(G.mul(G.q(2),T),R),
    phR=G.add(Z,T,G.mul(Z,T)),phZ=G.add(R,T,G.mul(R,T)),phT=G.add(Z,R,G.mul(R,Z)),phRZ=G.add(G.one,T),phRT=G.add(G.one,Z),phZT=G.add(G.one,R);
  const real=G.add(G.neg(G.mul(k,G.add(G.mul(cRZ,phT),G.mul(cRT,phZ),G.mul(cZT,phR),G.mul(cR,phZT),G.mul(cZ,phRT),G.mul(cT,phRZ),C))),G.mul(G.pow(k,3),C,phR,phZ,phT));
  const imaginary=G.sub(G.one,G.mul(G.pow(k,2),G.add(G.mul(cR,phZ,phT),G.mul(cZ,phR,phT),G.mul(cT,phR,phZ),G.mul(C,G.add(G.mul(phRZ,phT),G.mul(phRT,phZ),G.mul(phZT,phR))))));
  const actual=row(p,[1,1,1]).coefficients[0];assert.equal(same(G,actual.real,real),true);assert.equal(same(G,actual.imaginary,imaginary),true);
  assert.equal(same(G,actual.real,G.add(real,G.mul(k,cR,phZT))),false);assert.equal(same(G,actual.imaginary,G.add(imaginary,G.mul(G.pow(k,2),C,phZT,phR))),false);
});

test('exact cutoff, positive square root and integral coefficient shares materialize all original harmonic derivatives',()=>{
  const{G,R,Z,T,directions}=fixture(),v=G.fresh('harmonic_integral_time'),integral=G.integral(G.exp(G.add(G.mul(R,v),G.mul(Z,T))),v,G.zero,G.one),C=G.mul(G.sqrt(G.add(G.one,G.pow(R,2))),G.step(G.div(G.sub(Z,T),G.q(4))),integral),phase=G.add(G.sine(R),G.mul(Z,T),G.pow(T,3));
  const p=exactThirdHarmonicPotentialJets(G,{coefficient:[C,G.mul(G.exp(Z),integral),G.step(T)],phase,k:G.exp(G.q(2)),directions});
  assert.ok(p.phaseBinding.checks.every(c=>c.pass));assert.ok(p.coefficientBindings.every(b=>b.checks.every(c=>c.pass)&&b.unspecifiedOracle===false));
  for(let c=0;c<3;c++)for(const part of ['real','imaginary']){
    const independent=differentiatedThirdScalarJet(G,p.originalBodies[c][part],directions);
    for(let at=0;at<20;at++)assert.equal(p.jets[at].roots[c][part],independent.roots[at]);
  }
});

test('a variable carrier or supplied derivative arrays cannot enter the frozen-k recurrence',()=>{
  const{G,R,Z,T,directions}=fixture(),input={coefficient:[G.one,G.zero,G.one],phase:G.mul(R,Z,T),k:G.q(2),directions};
  assert.throws(()=>exactThirdHarmonicPotentialJets(G,{...input,k:G.add(G.one,R)}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactThirdHarmonicPotentialJets(G,{...input,phaseJets:[G.zero]}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactThirdHarmonicPotentialJets(G,{...input,directions:[R,R,T]}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactThirdHarmonicPotentialJets(G,{...input,coefficient:[G.one,G.zero]}),{code:'INVALID_INPUT'});
});

test('generic harmonic reports and copied certificate flags cannot authenticate an actual terminal member',()=>{
  const{G,R,directions}=fixture(),generic=exactThirdHarmonicPotentialJets(G,{coefficient:[R,G.one,G.zero],phase:R,k:G.one,directions});
  assert.throws(()=>attachActualTerminalHarmonicThirdJets(generic),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualTerminalHarmonicThirdJets({G,scope:{actualAllThirdSlowHarmonicJets:true},pass:true}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>prepareActualTerminalHarmonicThirdJets({terms:2}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>prepareActualTerminalHarmonicThirdJets({phase:R}),{code:'INVALID_INPUT'});
});
