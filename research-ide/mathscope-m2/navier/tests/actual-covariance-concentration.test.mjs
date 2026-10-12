import test from 'node:test';
import assert from 'node:assert/strict';
import {covarianceConcentrationRecipe,covarianceConcentrationScalarAudit} from '../actual-covariance-concentration.mjs';
import {rational as Q,qadd as add,qsub as sub,qmul as mul,qdiv as div,qcompare as cmp,qneg as neg,qpow as pow} from '../actual-continuation-arithmetic.mjs';

// A small independent expression recorder. It is deliberately a lemma
// fixture, not a replacement for the actual background field producer.
class Graph{
  nodes=[];
  node(op,args){const id=this.nodes.length;this.nodes.push({op,args});return id;}
  q(n,d=1){return this.node('q',[String(n),String(d)]);}
  one=this.q(1);
  add(...ids){return this.node('add',ids);}mul(...ids){return this.node('mul',ids);}
  div(a,b){return this.node('div',[a,b]);}inv(a){return this.node('inv',[a]);}
  pow(a,n){return this.node('pow',[a,n]);}sqrt(a){return this.node('sqrt',[a]);}
  exp(a){return this.node('exp',[a]);}log(a){return this.node('log',[a]);}
  neg(a){return this.node('neg',[a]);}maximum(...a){return this.node('max',a);}
  ceiling(a){return this.node('ceil',[a]);}
  value(id){const {op,args:a}=this.nodes[id],v=i=>this.value(i);switch(op){
    case'q':return Number(a[0])/Number(a[1]);case'add':return a.reduce((s,i)=>s+v(i),0);case'mul':return a.reduce((s,i)=>s*v(i),1);
    case'div':return v(a[0])/v(a[1]);case'inv':return 1/v(a[0]);case'pow':return v(a[0])**a[1];case'sqrt':return Math.sqrt(v(a[0]));
    case'exp':return Math.exp(v(a[0]));case'log':return Math.log(v(a[0]));case'neg':return-v(a[0]);case'max':return Math.max(...a.map(v));case'ceil':return Math.ceil(v(a[0]));default:throw Error(op);
  }}
}
const G=new Graph(),input=Object.fromEntries(Object.entries({h:[1,10000],kappa:[1,1],u:[2,1],lambdaLower:[1,1],lambdaUpper:[2,1],absoluteC0:[1,1],operatorError:[1,32],dampingError:[1,64],unitFrameError:[1,16],slopeError:[1,8],lengthRatioLower:[1,2],lengthRatioUpper:[2,1]}).map(([k,[a,b]])=>[k,G.q(a,b)])),recipe=covarianceConcentrationRecipe(G,input);
const abs=a=>a[0]<0n?neg(a):a;
const dot=(a,b)=>a.reduce((s,v,i)=>add(s,mul(v,b[i])),Q(0));

test('the continuum scalar inequalities pass exact rational arithmetic without certifying a source field',()=>{
  const a=covarianceConcentrationScalarAudit();assert.equal(a.pass,true);assert.equal(a.checks.length,12);
  assert(a.checks.every(c=>c.pass));assert.equal(a.sourceFieldCertificate,false);
  assert(cmp(pow(Q(5,4),3),Q(4))<0);assert(cmp(Q(7),Q(15))<0);
});

test('the graph recipe selects enough S for both actual-column error terms, while retaining all source premises',()=>{
  const S=G.value(recipe.selection.Sminimum),Lmin=G.value(input.lengthRatioLower),delta=G.value(input.kappa)/128;
  assert(recipe.selection.conditions.every(c=>S>=G.value(c.lower)));
  const err=G.value(recipe.mass.concentrationK)/Math.sqrt(Lmin*S)+G.value(recipe.columns.frameColumnK)/S;
  assert(err<=delta*(1+2e-15));assert.equal(recipe.scope.actualUniformHColumnsCertified,false);
  assert.equal(recipe.scope.sourceUniformQStarCertified,false);assert.equal(recipe.scope.originalN506Complete,false);
  assert.equal(recipe.premises.sourceBindingRequired,true);assert.equal(recipe.selection.additionalSourceConditionsMustBeMerged,true);
  assert.equal(recipe.selection.higherDerivativeOrdersChangeQStar,false);
});

test('the selected q-star remains an exact positive expression and is never stored as an underflowed zero',()=>{
  const root=G.nodes[recipe.selection.qStar];assert.equal(root.op,'exp');
  assert.equal(G.nodes[root.args[0]].op,'neg');
  assert(G.value(recipe.selection.ellMinimum)>=G.value(recipe.selection.frequencyBandMinimum));
  assert.equal(recipe.selection.activeBandBuffer,4);
  assert.equal(recipe.scope.numericQuadratureExecuted,false);
});

test('the Riccati cone signs hold algebraically on both boundaries, and an undersized cone can fail',()=>{
  for(const beta of [Q(0),Q(1,64),Q(1,2),Q(1)]){
    const upper=add(sub(Q(1),Q(8)),add(mul(Q(2),beta),mul(beta,beta)));
    assert(cmp(upper,Q(-4))<=0);assert(cmp(neg(upper),Q(4))>=0);
  }
  // Using beta=E/(4 lambdaFloor S) reverses the drift at small E/S.
  const bad=add(sub(Q(1),Q(1,2)),add(Q(1,128),Q(1,65536)));
  assert(cmp(bad,Q(0))>0);
  for(const r of [Q(-1,2),Q(-1,10),Q(0),Q(1,10),Q(1,2)]){
    const actual=abs(sub(div(sub(Q(1),r),add(Q(1),r)),Q(1)));
    assert(cmp(actual,mul(Q(4),abs(r)))<=0);
  }
});

test('independent rational frame arithmetic fits the normal and tangent normalized-column bounds',()=>{
  const N=[Q(-3,5),Q(4,5)],K=[Q(-4,5),Q(-3,5)],u=Q(24,7),sqrtU=Q(25,7),c0=Q(-2),Ac=mul(abs(c0),sqrtU);
  for(const t of [Q(-1,100),Q(0),Q(1,100)]){
    const cc=div(sub(Q(1),mul(t,t)),add(Q(1),mul(t,t))),ss=div(mul(Q(2),t),add(Q(1),mul(t,t)));
    const Na=N.map((v,i)=>add(mul(cc,v),mul(ss,K[i]))),Ka=K.map((v,i)=>sub(mul(cc,v),mul(ss,N[i])));
    const frame=add(abs(sub(Na[0],N[0])),abs(sub(Na[1],N[1])));
    for(const [s,sqrtS]of [[Q(15,8),Q(17,8)],[Q(24,7),Q(25,7)],[Q(35,12),Q(37,12)],[Q(40,9),Q(41,9)]])for(const r of [Q(-1,20),Q(0),Q(1,20)])for(const sign of [-1,1]){
      const slopeError=Q(1,1000),sa=add(mul(Q(sign),s),slopeError),dr=div(sub(Q(1),r),add(Q(1),r));
      const tangential=Na.map((v,i)=>add(neg(mul(sa,Ka[i])),mul(mul(mul(c0,sqrtS),dr),v)));
      const nrow=neg(div(dot(N,tangential),Ac)),krow=div(dot(K,tangential),u);
      const normalError=abs(sub(nrow,div(sqrtS,sqrtU))),tangentError=abs(add(krow,div(mul(Q(sign),s),u)));
      const normalBound=add(mul(Q(6),abs(r)),mul(add(Q(2),div(mul(Q(2),u),Ac)),frame));
      const tangentBound=add(div(slopeError,u),mul(add(Q(2),div(mul(Q(5),Ac),u)),frame));
      assert(cmp(normalError,normalBound)<=0);assert(cmp(tangentError,tangentBound)<=0);
      assert(cmp(abs(sub(div(sqrtS,sqrtU),Q(1))),div(abs(sub(s,u)),u))<=0);
    }
  }
  // The source c0 is negative. With the opposite sign the midpoint first
  // row is -1, so the stated ideal matrix would be false even at E=0.
  const midpointNormalRow=signedC0=>neg(div(mul(signedC0,sqrtU),Ac));
  assert.deepEqual(midpointNormalRow(c0),Q(1));
  assert.deepEqual(midpointNormalRow(neg(c0)),Q(-1));
  assert.equal(recipe.premises.negativeC0Required,true);
  assert.match(recipe.premises.parameters,/c0=-absoluteC0<0/);
  assert.equal(G.value(recipe.premises.c0Root),-G.value(input.absoluteC0));
});

test('both Gaussian mass bounds keep the support length and correct absolute first-moment factor',()=>{
  const a=G.value(recipe.mass.centralRadiusDenominator),cx=G.value(recipe.cone.amplitudeLower),Cx=G.value(recipe.cone.amplitudeUpper),c=G.value(recipe.gaussian.lower);
  assert.equal(G.value(recipe.mass.massLowerCoefficient),cx*cx/(15*a));
  assert.equal(G.value(recipe.mass.absoluteMomentUpper),Cx*Cx/(2*c));
  for(const gaussianRate of [Q(1,7),Q(1),Q(9,2)]){
    // d_t[-exp(-2ct²/L)/(4c)] = (t/L)exp(-2ct²/L).
    const coefficient=mul(div(Q(-1),mul(Q(4),gaussianRate)),mul(Q(-4),gaussianRate));assert.deepEqual(coefficient,Q(1));
    const bothHalfLines=mul(Q(2),div(Q(1),mul(Q(4),gaussianRate)));assert.deepEqual(bothHalfLines,div(Q(1),mul(Q(2),gaussianRate)));
    assert.notDeepEqual(bothHalfLines,div(Q(1),mul(Q(4),gaussianRate)),'dropping one half-line underestimates the moment');
  }
  assert.equal(recipe.mass.noGaussianLimitSubstituted,true);assert.equal(recipe.columns.angularHalfIncluded,true);assert.equal(recipe.columns.haarJacobianIncluded,true);
});

test('the frequency inequality uses a continuous band tail rather than a finite list of tested bands',()=>{
  // t=sqrt(ell)>=64/h: (h/4)t²-4t >=12t, which exceeds log(3).
  for(const h of [Q(1,2),Q(1,100),Q(1,1000000)]){
    const t=div(Q(64),h),left=sub(mul(div(h,Q(4)),mul(t,t)),mul(Q(4),t));
    assert.deepEqual(left,mul(Q(12),t));assert(cmp(left,Q(2))>0);
  }
  assert(recipe.selection.bandProof.includes('log(ell)<=sqrt(ell)'));
});

test('incomplete or substituted lemma records do not become source certificates',()=>{
  assert.throws(()=>covarianceConcentrationRecipe(G,{...input,complete:true}),/complete exact-expression constants/);
  const missing={...input};delete missing.lambdaLower;assert.throws(()=>covarianceConcentrationRecipe(G,missing));
  assert.throws(()=>covarianceConcentrationRecipe(G,{...input,operatorError:NaN}));
  assert.throws(()=>covarianceConcentrationRecipe(G,{...input,h:G.nodes.length+20}));
  const before=JSON.stringify(input);covarianceConcentrationRecipe(G,input);assert.equal(JSON.stringify(input),before);
});
