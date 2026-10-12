import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualCovarianceExpressions} from '../actual-covariance-volterra.mjs';
import {actualMovingPulseFrame} from '../actual-covariance-matrix.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {ellOneSourceScalarIdentity} from '../actual-covariance-ell-one-obstruction.mjs';
import {rational as Q,readRational,qcompare,qsub,directedArithmetic} from '../actual-continuation-arithmetic.mjs';
import {adiabaticProjectedDiagonalAudit,adiabaticTransportIdentityAudit,adiabaticPulseCenterErrorAudit,adiabaticPulseCenterControls,encloseAdiabaticPulseCenters,adiabaticExactBranchNormalizer,adiabaticReplaceExactOperands} from '../actual-adiabatic-pulse-center-kernel.mjs';

function roundedFixture(){
  const G=new ActualCovarianceExpressions(new ActualConvergentExpressions()),q=(n,d=1)=>G.q(n,d),R=G.fresh('rounding_slow_R'),Z=G.fresh('rounding_slow_Z'),
    rep=G.fresh('rounding_frozen_representative'),k=G.fresh('rounding_frozen_frequency'),scaled=G.mul(k,G.pow(rep,2)),
    rounded=G.neg(G.ceiling(G.neg(G.add(scaled,q(1,2))))),fallback=G.choose(scaled,G.zero,G.zero,q(-1),G.one,G.one),
    nonzero=G.choose(rounded,q(-1,2),q(1,2),rounded,fallback,rounded),p=G.div(nonzero,k),
    F=G.share(G.add(G.pow(R,-4),G.pow(Z,2)),[R,Z],'rounding_shared_F'),axial=G.share(G.mul(R,G.pow(Z,2)),[R,Z],'rounding_shared_G'),
    pz=G.fresh('rounding_frozen_pz'),phase=G.add(G.mul(p,F),G.mul(pz,axial)),HR=G.derivative(phase,R),HZ=G.derivative(phase,Z),FR=G.derivative(F,R),GR=G.derivative(axial,R);
  return {G,q,R,Z,rep,k,p,pz,F,axial,phase,HR,HZ,FR,GR};
}

test('the original frozen rounding derivative has exact all-zero branches, and a changed middle branch is retained',()=>{
  const f=roundedFixture(),{G,R,p,HR,FR,pz,GR}=f,dp=G.derivative(p,R),expected=G.add(G.mul(p,FR),G.mul(pz,GR)),
    before=JSON.stringify(G.nodes),count=G.nodes.length,n=adiabaticExactBranchNormalizer(G),normal=n.normalize;
  assert.equal(G.freeCoordinates(p).has(R),false);assert.notEqual(dp,G.zero);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(HR,expected),{atomicNodes:[p,pz,FR,GR]}).pass,false);
  assert.equal(normal(dp),G.zero);assert.equal(sourceGraphRationalIdentity(G,G.sub(normal(HR),normal(expected)),{atomicNodes:[normal(p),pz,FR,GR]}).pass,true);
  const changed=G.choose(G.fresh('rounding_nonconstant_condition'),G.zero,G.one,G.zero,G.one,G.zero);
  assert.notEqual(normal(changed),G.zero);assert.equal(normal(changed),changed);
  assert.equal(JSON.stringify(G.nodes.slice(0,count)),before);
  const receipt=n.receipt([dp,HR,expected,changed]);assert.ok(receipt.collapses.length>0);assert.ok(receipt.collapses.every(c=>c.normalizedBranches.every(b=>b===c.result)));
  assert.equal(receipt.roundingValuesChanged,false);assert.equal(receipt.sourceAuthenticated,false);assert.equal(receipt.approximateOrDomainBasedZeroUsed,false);
});

test('the entire original rounded moving matrix rebinds after exact zero-join congruence, including Bprime and nested operands',()=>{
  const f=roundedFixture(),{G:old,q,R,Z,rep,k,p,pz,F,FR,GR,HR,HZ}=f,at=x=>old.simultaneousSubstitute(x,[R,Z],[rep,old.zero]),
    v=old.fresh('rounding_pulse_v'),gabs=old.neg(old.mul(rep,at(FR))),lambda0=old.sqrt(old.mul(q(2),at(F),old.sub(gabs,old.mul(q(2),at(F))))),
    input={F:at(F),FR:at(FR),GR:at(GR),R:rep,epsilon:old.fresh('rounding_positive_epsilon'),k,p,pz,
      x0:old.fresh('rounding_frozen_x0'),v,Ls:old.fresh('rounding_length'),u:old.fresh('rounding_positive_u'),c0:old.neg(old.div(lambda0,old.mul(q(2),at(F)))),lambda0,HR:at(HR),HZ:at(HZ),sign:1},
    retained=actualMovingPulseFrame(old,input),before=JSON.stringify(old.nodes),count=old.nodes.length;
  class Guarded extends ActualCovarianceExpressions{derivative(id,variable){if(!this.dependsOn(id,variable))return this.zero;return super.derivative(id,variable);}}
  const G=new Guarded(old),n=adiabaticExactBranchNormalizer(G),normal=n.normalize,
    clean=Object.fromEntries(Object.entries(input).map(([name,value])=>[name,name==='sign'?value:normal(value)])),regenerated=actualMovingPulseFrame(G,clean);
  for(let i=0;i<2;i++)for(let j=0;j<2;j++)assert.equal(ellOneSourceScalarIdentity(G,normal(retained.wMatrix[i][j]),normal(regenerated.wMatrix[i][j])).pass,true);
  const formal={F:G.fresh('exact_F'),gamma:G.fresh('exact_gamma'),Bs:G.fresh('exact_Bs'),b:G.fresh('exact_b'),R:G.fresh('exact_R'),epsilon:G.fresh('exact_epsilon'),k:G.fresh('exact_k'),u:G.fresh('exact_u'),Ls:G.fresh('exact_Ls'),v:G.fresh('exact_v')},
    fg=G.mul(G.q(2),formal.F,G.add(G.one,G.pow(formal.gamma,2))),formalInput={F:formal.F,FR:G.neg(G.div(fg,formal.R)),GR:G.zero,R:formal.R,epsilon:formal.epsilon,k:formal.k,
      p:G.mul(formal.R,formal.Bs,formal.b),pz:G.neg(formal.Bs),x0:G.mul(G.q(1,2),formal.Bs,formal.u),v:formal.v,Ls:formal.Ls,u:formal.u,c0:G.neg(formal.gamma),lambda0:G.mul(G.q(2),formal.F,formal.gamma),HR:G.neg(G.mul(formal.Bs,fg,formal.b)),HZ:G.zero,sign:1},
    pairs=Object.keys(clean).filter(k=>k!=='sign').map(k=>[clean[k],formalInput[k]]),expected=actualMovingPulseFrame(G,formalInput);
  for(let i=0;i<2;i++)for(let j=0;j<2;j++)assert.equal(ellOneSourceScalarIdentity(G,normal(adiabaticReplaceExactOperands(G,normal(retained.wMatrix[i][j]),pairs)),normal(expected.wMatrix[i][j])).pass,true);
  assert.equal(JSON.stringify(old.nodes),before);assert.equal(JSON.stringify(G.nodes.slice(0,count)),before);
  assert.throws(()=>adiabaticReplaceExactOperands(G,G.one,[[G.one,G.zero],[G.one,G.q(2)]]),{code:'INVALID_INPUT'});
});

test('the actual moving-pressure and moving-basis diagonal reduce exactly for arbitrary finite tangent tilt',()=>{
  const p=adiabaticProjectedDiagonalAudit(new ActualConvergentExpressions());
  assert.equal(p.pass,true);assert.equal(p.checks.length,5);assert.ok(p.checks.every(c=>c.pass));
  assert.ok(p.negativeControls.every(c=>c.correctlyRejected&&!c.check.pass));
  assert.equal(p.squareRootRule.allFiniteRealB,true);assert.equal(p.sourceAuthenticated,false);
  assert.match(p.identity,/damping-dref/);assert.equal(p.noPressureOrBasisTermDropped,true);
});

test('both signs have the same exact positive three-quarter-power center transport',()=>{
  const p=adiabaticTransportIdentityAudit(new ActualConvergentExpressions());
  assert.equal(p.pass,true);assert.equal(p.rows.length,2);assert.ok(p.rows.every(r=>r.check.pass));
  assert.ok(p.rows.every(r=>r.negativeControl.correctlyRejected));assert.equal(p.exactAntiderivative,true);assert.equal(p.sourceAuthenticated,false);
});

test('rounding, finite-length diagonal, fast-channel coupling and finite-u remainders are all positive',()=>{
  const p=adiabaticPulseCenterErrorAudit();assert.equal(p.pass,true);assert.ok(p.checks.every(r=>r.pass));
  for(const k of ['diagonalLogUpper','couplingLogUpper','halfLogUpper','referenceCorrectionUpper','absoluteCenterRadius'])assert.ok(qcompare(readRational(p.parameters[k],200000),Q(0))>0);
  assert.equal(p.parameters.scalePower,1024);assert.equal(p.parameters.offDiagonalPower,256);assert.equal(p.parameters.conePower,260);
  assert.match(p.premises.carrier,/k>S\^8/);assert.match(p.derivation.scalar,/B\^516\/S/);assert.equal(p.actualSourceAuthenticated,false);
});

test('directed square roots and a nonzero outward-rounded analytic remainder enclose the absolute center',()=>{
  const p=encloseAdiabaticPulseCenters();assert.equal(p.pass,true);assert.equal(p.rows.length,3);
  assert.ok(qcompare(readRational(p.values.center.lower),Q(3535533905932737n,10000000000000000n))>0);
  assert.ok(qcompare(readRational(p.values.center.upper),Q(3535533905932739n,10000000000000000n))<0);
  assert.ok(qcompare(readRational(p.values.centerSquared.lower),Q(1,8))<0);assert.ok(qcompare(readRational(p.values.centerSquared.upper),Q(1,8))>0);
  assert.ok(qcompare(readRational(p.values.inverseCenterSquared.lower),Q(8))<0);assert.ok(qcompare(readRational(p.values.inverseCenterSquared.upper),Q(8))>0);
  for(const r of p.rows)assert.ok(qcompare(readRational(r.width),readRational(p.request.tolerance))<=0);
  assert.equal(p.errorBudget.exactIntegratedTransportUsed,true);assert.equal(p.errorBudget.nonzeroSubUlpRemainderRoundedUp,true);
  assert.equal(p.sourceAuthenticated,false);assert.equal(p.wholeGNUMComplete,false);
  assert.notEqual(p.values.center.lower,p.reference.lower);assert.notEqual(p.values.center.upper,p.reference.upper);
});

test('increasing the directed precision narrows the same center and both inverse-square bounds',()=>{
  const a=encloseAdiabaticPulseCenters({precisionBits:96,tolerance:'1/10000000000000000000'}),b=encloseAdiabaticPulseCenters({precisionBits:256,tolerance:'1/10000000000000000000000000000000000000000000000000000000'});
  for(const k of ['center','centerSquared','inverseCenterSquared']){
    assert.ok(qcompare(readRational(b.values[k].lower),readRational(a.values[k].lower))>0);
    assert.ok(qcompare(readRational(b.values[k].upper),readRational(a.values[k].upper))<0);
  }
  assert.equal(b.arithmetic.binary64UsedForDecisions,false);
});

test('no user amplitude, source flag, numeric tolerance or zero-containing inverse is accepted',()=>{
  for(const input of [{center:1},{sourceAuthenticated:true},{precisionBits:53},{precisionBits:192.5},{tolerance:1e-12},{tolerance:'0'},{tolerance:'-1'},{tolerance:'1'}])assert.throws(()=>adiabaticPulseCenterControls(input),{code:'INVALID_INPUT'});
  assert.throws(()=>adiabaticPulseCenterControls({precisionBits:96,tolerance:'1/10000000000000000000000000000000000000000'}),{code:'PRECISION_REQUIRED'});
  const A=directedArithmetic(192);assert.deepEqual(A.small(8192),[0n,1n]);assert.throws(()=>A.div(A.one(),[-1n,1n]),{code:'PRECISION_REQUIRED'});
});
