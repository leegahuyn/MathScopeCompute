import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualPulseThirdJetExpressions,differentiatedThirdScalarJet} from '../actual-pulse-third-jet-kernel.mjs';
import {retainedThirdBodyBinding,instantiateRetainedThirdBodies,retainedCommonDenominatorIdentity} from '../actual-third-jet-algebra.mjs';
import {scalarThirdProductAudit,vectorThirdAmplitudeAudit,covarianceThirdInverseAudit,positiveSqrtThirdAudit,prepareActualTerminalPotentialThirdJets,attachActualTerminalPotentialThirdJets,assertActualTerminalPotentialThirdJets} from '../actual-terminal-potential-third-jets.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {ActualCovarianceExpressions} from '../actual-covariance-volterra.mjs';
import {normalizeEqualPiecewiseBranches} from '../actual-full-curl.mjs';

function fixture(){const G=new ActualPulseThirdJetExpressions(new ActualConvergentExpressions()),R=G.fresh('R'),Z=G.fresh('Z'),T=G.fresh('T');return{G,R,Z,T,directions:[R,Z,T]};}
const same=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:30000}).pass;
const row=(jet,orders)=>jet.indices.findIndex(a=>JSON.stringify(a)===JSON.stringify(orders));

test('every shared third jet materializes to its original improper-free integral and cutoff body',()=>{
  const{G,R,Z,T,directions}=fixture(),v=G.fresh('bound_integral_time'),body=G.mul(G.step(G.div(G.sub(R,T),G.q(4))),G.integral(G.exp(G.add(G.mul(R,v),G.mul(Z,T))),v,G.zero,G.one));
  const binding=retainedThirdBodyBinding(G,body,directions),definition=G.expressionSystems[binding.system];
  assert.equal(definition.body,body);assert.equal(definition.unspecifiedOracle,false);assert.equal(binding.checks.length,20);assert.ok(binding.checks.every(c=>c.pass));
  assert.equal(binding.sourceAuthenticated,false);assert.equal(binding.unspecifiedOracle,false);
  for(let i=0;i<20;i++)assert.equal(instantiateRetainedThirdBodies(G,binding.roots[i],[binding]),binding.directRoots[i]);
  const constant=retainedThirdBodyBinding(G,G.exp(G.q(2)),directions);assert.equal(constant.system,null);assert.ok(constant.directRoots.slice(1).every(x=>x===G.zero));
});

test('multi-factor product audits retain third repeated and fully mixed Leibniz terms',()=>{
  const{G,R,Z,T,directions}=fixture(),factors=[G.add(G.one,G.mul(R,Z)),G.add(G.q(2),G.mul(R,T),G.pow(Z,2)),G.add(G.q(3),G.mul(Z,T),G.pow(R,3))];
  const p=scalarThirdProductAudit(G,{factors,directions});assert.equal(p.checks.length,20);assert.ok(p.checks.every(c=>c.pass&&c.bodyDerivativeBinding));
  for(let i=0;i<20;i++)assert.ok(same(G,p.roots[i],p.expanded[i]));
  const rrr=row(p,[3,0,0]),omission=G.mul(G.q(6),factors[0],factors[1]);
  assert.equal(same(G,G.sub(p.expanded[rrr],omission),p.roots[rrr]),false);
  assert.equal(p.sourceAuthenticated,false);
});

test('a moving three-by-two basis keeps every third B and w product under the actually frozen envelope',()=>{
  const{G,R,Z,T,directions}=fixture(),frozen=G.fresh('frozen_reference'),P=G.exp(frozen),B=[[G.add(G.one,G.pow(R,3)),G.mul(Z,T)],[G.add(R,T),G.pow(Z,2)],[G.mul(R,Z,T),G.add(G.one,G.pow(T,3))]],w=[G.add(G.one,G.mul(R,Z),G.pow(T,2)),G.add(G.q(2),G.pow(R,3),G.mul(Z,T))];
  const p=vectorThirdAmplitudeAudit(G,{matrix:B,vector:w,envelope:P,directions});assert.equal(p.jets.length,20);assert.ok(p.jets.every(j=>j.checks.every(c=>c.pass)));
  for(const j of p.jets)for(let k=0;k<3;k++)assert.ok(same(G,j.roots[k],j.expanded[k]));
  const third=p.jets.find(j=>j.orders.join(',')==='3,0,0'),omission=G.mul(P,G.q(6),w[0]);assert.equal(same(G,G.sub(third.expanded[0],omission),third.roots[0]),false);
  assert.throws(()=>vectorThirdAmplitudeAudit(G,{matrix:B,vector:w,envelope:G.exp(R),directions}),{code:'INVALID_INPUT'});
});

test('all forty actual inverse derivatives equal independently chosen polynomial weights',()=>{
  const{G,R,Z,T,directions}=fixture(),H=[[G.add(G.q(3),R),Z],[T,G.add(G.q(2),R)]],known=[G.add(G.one,G.pow(R,3),G.mul(R,Z,T),G.mul(G.pow(Z,2),T)),G.add(G.q(2),G.mul(G.pow(R,2),Z),G.pow(T,3))],target=H.map(r=>G.add(...r.map((x,j)=>G.mul(x,known[j]))));
  const p=covarianceThirdInverseAudit(G,{matrix:H,target,directions}),knownJets=known.map(x=>differentiatedThirdScalarJet(G,x,directions));
  assert.equal(p.checks.length,40);assert.ok(p.checks.every(c=>c.pass&&c.bodyDerivativeBinding));
  for(let i=0;i<20;i++)for(let j=0;j<2;j++)assert.equal(retainedCommonDenominatorIdentity(G,p.weightJets[i][j],knownJets[j].roots[i],{denominators:[p.determinant]}).pass,true);
  assert.ok(p.checks.filter(c=>c.orders.reduce((s,n)=>s+n,0)===3).every(c=>c.algebra.commonPowers[0]<=4));
  assert.equal(p.determinantNonzeroRequired,true);assert.equal(p.sourceAuthenticated,false);assert.equal(p.numericalInverseEvaluated,false);
});

test('all positive square-root jets retain the interior multi-indices, including both repeated third terms',()=>{
  const{G,R,Z,T,directions}=fixture(),positiveLocal=G.add(G.q(3),R,G.mul(Z,T),G.mul(R,Z),G.pow(R,3)),value=G.pow(positiveLocal,2),p=positiveSqrtThirdAudit(G,{value,directions});
  const known=differentiatedThirdScalarJet(G,positiveLocal,directions);assert.equal(p.checks.length,19);assert.ok(p.checks.every(c=>c.pass&&c.bodyDerivativeBinding));
  for(let i=0;i<20;i++){
    const actual=G.substitute(p.roots[i],p.sigma,positiveLocal);
    assert.equal(retainedCommonDenominatorIdentity(G,actual,known.roots[i],{denominators:[positiveLocal]}).pass,true);
  }
  const rrr=p.checks.find(c=>c.orders.join(',')==='3,0,0');assert.equal(rrr.middleSubindexCount,2);
  const rzt=p.checks.find(c=>c.orders.join(',')==='1,1,1');assert.equal(rzt.middleSubindexCount,6);
  assert.equal(p.endpointsExcludedFromMiddleSum,true);assert.equal(p.positiveValueDomainRequired,true);assert.equal(p.sourceAuthenticated,false);
});

test('the common denominator audit rejects an omitted inverse term and unlisted denominators',()=>{
  const{G,R,Z}=fixture(),d=G.add(G.q(3),G.mul(R,Z)),a=G.div(R,d),b=G.div(Z,G.pow(d,2));
  const correct=G.div(G.add(G.mul(R,d),Z),G.pow(d,2));
  assert.equal(retainedCommonDenominatorIdentity(G,G.add(a,b),correct,{denominators:[d]}).pass,true);
  assert.equal(retainedCommonDenominatorIdentity(G,a,correct,{denominators:[d]}).pass,false);
  assert.throws(()=>retainedCommonDenominatorIdentity(G,G.add(a,b),correct),{code:'INVALID_INPUT'});
});

test('missing third target or H terms change the exact inverse equation',()=>{
  const{G,R,Z,T,directions}=fixture(),H=[[G.add(G.q(2),G.pow(R,3)),G.zero],[G.zero,G.q(3)]],target=[G.add(G.one,G.mul(R,Z,T),G.pow(R,3)),G.add(G.one,G.pow(T,3))],p=covarianceThirdInverseAudit(G,{matrix:H,target,directions}),at=row(p,[3,0,0]);
  const full=G.add(G.mul(H[0][0],p.weightJets[at][0]),G.mul(G.q(3),p.matrixJet.matrices[row(p,[1,0,0])][0][0],p.weightJets[row(p,[2,0,0])][0]),G.mul(G.q(3),p.matrixJet.matrices[row(p,[2,0,0])][0][0],p.weightJets[row(p,[1,0,0])][0]),G.mul(G.q(6),p.weights[0]));
  assert.equal(retainedCommonDenominatorIdentity(G,full,p.targetJets[at][0],{denominators:[p.determinant]}).pass,true);
  assert.equal(retainedCommonDenominatorIdentity(G,G.sub(full,G.mul(G.q(6),p.weights[0])),p.targetJets[at][0],{denominators:[p.determinant]}).pass,false);
  assert.equal(retainedCommonDenominatorIdentity(G,full,G.zero,{denominators:[p.determinant]}).pass,false);
});

test('generic algebra and forged objects cannot acquire actual terminal source authority',()=>{
  const{G,directions}=fixture();
  assert.throws(()=>covarianceThirdInverseAudit(G,{matrix:[[G.one,G.one],[G.one,G.one]],target:[G.one,G.one],directions}),{code:'SINGULAR_COVARIANCE'});
  assert.throws(()=>assertActualTerminalPotentialThirdJets({G,scope:{actualSelectedSmallQTerminalSource:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>attachActualTerminalPotentialThirdJets({G}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>prepareActualTerminalPotentialThirdJets({terms:2}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>prepareActualTerminalPotentialThirdJets({matrix:[[G.one,G.zero],[G.zero,G.one]]}),{code:'INVALID_INPUT'});
  assert.throws(()=>scalarThirdProductAudit(G,{factors:[],directions}),{code:'INVALID_INPUT'});
});

test('the frozen-carrier all-zero branch normalizes exactly in the original phase-gradient identity',()=>{
  const base=new ActualCovarianceExpressions(new ActualConvergentExpressions()),R=base.fresh('phase_R'),Z=base.fresh('phase_Z'),T=base.fresh('phase_T'),v=base.fresh('phase_v'),theta=base.fresh('phase_theta'),rep=base.fresh('frozen_label');
  const epsilon=base.exp(base.q(-2)),p=base.choose(rep,base.q(-1),base.one,base.q(-2),base.one,base.q(2)),pz=base.q(3),x0=base.q(4),F=base.share(base.add(base.pow(R,2),base.mul(Z,T)),[R,Z,T],'original phase field');
  const speed=base.mul(p,F),HR=base.derivative(speed,R),HZ=base.derivative(speed,Z),normal=[base.sub(x0,base.mul(v,HR)),base.div(p,R),base.sub(pz,base.mul(epsilon,v,HZ))],phase=base.sub(base.add(base.mul(p,theta),base.div(base.mul(pz,Z),epsilon),base.mul(x0,R)),base.mul(v,speed));
  const G=new ActualPulseThirdJetExpressions(base),gradient=[G.derivative(phase,R),G.div(G.derivative(phase,theta),R),G.mul(epsilon,G.derivative(phase,Z))];
  assert.equal(same(G,gradient[0],normal[0]),false);
  const before=JSON.stringify(G.nodes.slice(0,base.nodes.length));
  for(let j=0;j<3;j++){
    const normalized=normalizeEqualPiecewiseBranches(G,G.sub(gradient[j],normal[j]));
    assert.equal(sourceGraphRationalIdentity(G,normalized.normalized).pass,true);
    if(j===0)assert.ok(normalized.identities.some(x=>x.normalized===G.zero));
  }
  assert.equal(JSON.stringify(G.nodes.slice(0,base.nodes.length)),before);
  const wrong=normalizeEqualPiecewiseBranches(G,G.sub(gradient[2],base.div(normal[2],epsilon)));
  assert.equal(sourceGraphRationalIdentity(G,wrong.normalized).pass,false);
});
