import test from 'node:test';
import assert from 'node:assert/strict';
import {numericalExponentialArithmetic} from '../actual-numerical-exponential-arithmetic.mjs';
import {encloseFirstSelectorFromUpperComparisons,positiveBandGeometricIntervals,finiteJetPositiveScaleRecipe,finiteJetClosedNumericalScale} from '../actual-positive-geometric-scale-kernel.mjs';
import {rational as Q,readRational,qcompare,qmul,qdiv} from '../actual-continuation-arithmetic.mjs';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {attachActualCommonPositiveScaleEnclosure,projectActualCommonPositiveScaleEnclosure} from '../actual-common-positive-scale-enclosure.mjs';

test('first selector retains a dominating history and all eight finite upper clauses',()=>{
  const N=numericalExponentialArithmetic({precisionBits:256}),log2=N.log(N.point(2)),
    r=encloseFirstSelectorFromUpperComparisons(N,{ellMinimum:N.point(8),historicalLogScale:N.mul(N.point(100),log2),upperRequiredLogs:Array(8).fill(N.point(1))}),
    b=N.regularBounds(r.ell);
  assert(qcompare(readRational(b.lower),Q(20))<=0);assert(qcompare(readRational(b.upper),Q(102))>=0);
  assert.equal(r.sourceAuthenticated,false);
  assert.throws(()=>encloseFirstSelectorFromUpperComparisons(N,{ellMinimum:N.point(8),historicalLogScale:N.one(),upperRequiredLogs:Array(7).fill(N.one())}),{code:'INVALID_INPUT'});
});

test('palette correlation and positive rounded-frequency bounds enclose a regular exact control',()=>{
  const N=numericalExponentialArithmetic({precisionBits:256}),v=x=>N.point(x),r=positiveBandGeometricIntervals(N,{ell:v(100),h:v('1/100'),u:v(4),F:v('1/4'),gamma:v('1/8'),g:v('1/32'),tau:v('1/16'),Ac:v(4),profileRadius:v(16),sigmaIntegral:v('1/3')}),
    e=N.regularBounds(r.epsilon),k=N.regularBounds(r.k),c=N.regularBounds(r.ci),L=N.regularBounds(r.Ls);
  assert(qcompare(readRational(e.lower),Q(1,2))<=0&&qcompare(readRational(e.upper),Q(1,2))>=0);
  assert(qcompare(readRational(k.lower),Q(2))<=0&&qcompare(readRational(k.upper),Q(2))>=0);
  assert(qcompare(readRational(c.upper),Q(1,10000))>=0);
  assert(qcompare(readRational(L.lower),Q(20000,17179869184n))<=0);
  for(const name of['Q','epsilon','k','ci','Ls','Bs','J','massScale','A0'])assert(N.compareEndpoints(N.toClosed(r[name]).lower,{rational:'0'})===1);
  assert.deepEqual(N.toClosed(r.etaBeta),{lower:{rational:'1/1073741824'},upper:{rational:'1'}});
});

test('finite-jet recipes keep mixed factors, angular scale and the actual frequency',()=>{
  const G=new ActualSourceExpressions(),p=n=>G.var(n),O={one:()=>G.one,mul:(...x)=>G.mul(...x),div:(a,b)=>G.div(a,b),sqrt:x=>G.sqrt(x),pow:(x,n)=>G.pow(x,n)},
    s={g:p('g'),Ls:p('Ls'),Ac:p('Ac'),u:p('u'),A0:p('A0'),massScale:p('m'),tau:p('tau'),k:p('k'),V:[p('V0'),p('V1'),p('V2')],
      Omega:{r:p('or'),z:p('oz'),t:p('ot'),theta:p('oa')},coordinateScales:{r:p('cr'),z:p('cz'),t:p('ct'),theta:p('ca')}};
  assert.equal(finiteJetPositiveScaleRecipe(O,s,{quantity:'weightedPulse',component:1,order:2,derivative:'RT'}),G.mul(G.mul(s.Ac,s.A0),G.mul(s.g,s.Ls)));
  assert.equal(finiteJetPositiveScaleRecipe(O,s,{quantity:'weightedPulse',component:2,order:2,derivative:'Tv'}),G.mul(s.u,s.A0,s.g));
  assert.equal(finiteJetPositiveScaleRecipe(O,s,{quantity:'H',component:1,order:2,derivative:'ZZ'}),G.mul(s.u,s.massScale,G.pow(G.mul(s.g,s.Ls),2)));
  const row={quantity:'physicalCurl',component:2,order:2,directions:['theta','r']},actual=finiteJetPositiveScaleRecipe(O,s,row);
  assert.equal(actual,G.mul(s.V[2],G.pow(s.k,2),s.Omega.theta,s.Omega.r,s.coordinateScales.theta,s.coordinateScales.r));
  assert.notEqual(actual,G.mul(s.V[2],s.Omega.theta,s.Omega.r,s.coordinateScales.theta,s.coordinateScales.r));
  assert.throws(()=>finiteJetPositiveScaleRecipe(O,s,{...row,directions:['unknown','r']}),{code:'INVALID_INPUT'});
});

test('plain records cannot manufacture a private actual numerical-scale attachment',()=>{
  assert.throws(()=>attachActualCommonPositiveScaleEnclosure({p:{}},{physicalCenter:{}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>projectActualCommonPositiveScaleEnclosure({pass:true,sourceAuthenticated:true,rows:[]}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('all physical time/angular/spatial monomials enclose independently formed finite source factors',()=>{
  const N=numericalExponentialArithmetic({precisionBits:256,maxOperations:1000000}),q=x=>N.point(x),mul=(...x)=>x.reduce((a,b)=>N.mul(a,b),N.one()),
    u=q(4),F=q('1/4'),gamma=q('1/8'),Ac=mul(gamma,N.sqrt(q(17))),h=q('1/100'),ell=q(100),r0=q('1/17179869184'),L=mul(q(20000),r0),tau=q('1/16'),
    lambda=mul(q(2),F,gamma),g=N.div(mul(q(3),lambda,N.pow(u,2)),N.pow(N.sqrt(q(17)),3)),
    s=positiveBandGeometricIntervals(N,{ell,h,u,F,gamma,g,tau,Ac,profileRadius:q(16),sigmaIntegral:q('1/3')}),
    Qband=N.pow(q(2),-100),epsilon=q('1/2'),k=q(2),Bs=N.sqrt(N.div(lambda,mul(epsilon,N.pow(k,2),N.pow(N.sqrt(q(17)),3)))),
    R=q(16),gabs=mul(q(2),F,N.add(N.one(),N.pow(gamma,2))),pTilde=N.div(mul(R,Bs,u),mul(L,gabs)),
    m=N.div(N.pow(r0,2),N.sqrt(mul(g,L))),A0=N.sqrt(N.div(tau,m)),A=N.add(q('1/2'),h),
    V0=mul(N.exp(mul(N.neg(A),N.log(Qband))),N.sqrt(epsilon),A0),
    exact={g,Ls:L,Ac,u,A0,massScale:m,tau,k,V:[V0,mul(Ac,V0),mul(u,V0)],Omega:{r:mul(Bs,u),z:Bs,t:mul(pTilde,F),theta:N.div(pTilde,R)},
      coordinateScales:{r:N.inverse(N.sqrt(Qband)),z:N.inverse(N.sqrt(Qband)),t:N.exp(mul(N.neg(N.add(N.one(),h)),N.log(Qband))),theta:N.inverse(N.sqrt(Qband))}},
    O={one:()=>N.one(),mul,div:(a,b)=>N.div(a,b),sqrt:x=>N.sqrt(x),pow:(x,n)=>N.pow(x,n)},directions=['r','z','t','theta'];
  let count=0;for(let c=0;c<3;c++)for(const ds of [...directions.map(x=>[x]),...directions.flatMap((x,i)=>directions.slice(i).map(y=>[x,y]))]){
    const row={quantity:'physicalCurl',component:c,derivative:ds.join(''),directions:ds,order:ds.length},actual=N.regularBounds(finiteJetPositiveScaleRecipe(O,exact,row)),outer=N.regularBounds(finiteJetClosedNumericalScale(N,s,row));
    assert(qcompare(readRational(outer.lower),readRational(actual.lower))<=0,JSON.stringify(row)+' lower');
    assert(qcompare(readRational(outer.upper),readRational(actual.upper))>=0,JSON.stringify(row)+' upper');count++;
  }
  assert.equal(count,42);
});
