import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualCovarianceExpressions} from '../actual-covariance-volterra.mjs';
import {actualOperatorPowerAudit,positiveParameterRange} from '../actual-covariance-operator-bounds.mjs';
import {covariancePositiveRootProgram} from '../actual-covariance-source-certificate.mjs';
import {covarianceKernelFixture} from './actual-covariance-source-fixture.mjs';

const fixture=covarianceKernelFixture();
const value=(nodes,id,env={},cache=new Map())=>{
  if(cache.has(id))return cache.get(id);const {op,args:a}=nodes[id],v=x=>value(nodes,x,env,cache);let r;
  if(op==='rational')r=Number(a[0])/Number(a[1]);else if(op==='coordinate')r=env[id];
  else if(op==='add')r=a.reduce((s,x)=>s+v(x),0);else if(op==='multiply')r=a.reduce((s,x)=>s*v(x),1);
  else if(op==='inverse')r=1/v(a[0]);else if(op==='integer_power')r=v(a[0])**a[1];else if(op==='sqrt_positive')r=Math.sqrt(v(a[0]));
  else if(op==='exp')r=Math.exp(v(a[0]));else if(op==='log_positive')r=Math.log(v(a[0]));else if(op==='maximum')r=Math.max(...a.map(v));else throw Error(op);
  if(!Number.isFinite(r))throw Error('Nonfinite independent fixture');cache.set(id,r);return r;
};
const qnumber=x=>{const a=x.split('/');return Number(a[0])/Number(a[1]??1);};
const fresh=()=>new ActualCovarianceExpressions(new ActualConvergentExpressions());
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),mv=(a,v)=>a.map(r=>dot(r,v)),mm=(a,b)=>a.map(r=>b[0].map((_,j)=>dot(r,b.map(x=>x[j]))));

test('twelve actual moving-frame expression fixtures preserve the constrained pressure system',()=>{
  for(const c of fixture.matrixCases){const env={[c.vNode]:qnumber(c.vValue)},v=id=>value(fixture.nodes,id,env),f=c.frame,n=f.n.map(v),np=f.nPrime.map(v),A=f.Aphi.map(r=>r.map(v));
    for(let j=0;j<3;j++)assert(Math.abs(dot(n,A.map(r=>r[j]))+np[j])<2e-12);
    const B=f.B.map(r=>r.map(v)),left=f.Bleft.map(r=>r.map(v)),I=mm(left,B);
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)assert(Math.abs(I[i][j]-(i===j?1:0))<2e-12);
    for(const col of [B.map(r=>r[0]),B.map(r=>r[1])])assert(Math.abs(dot(n,col))<2e-12);
  }
});
test('the actual Bprime includes both Uprime J and U Jprime, and survives an independent centered difference',()=>{
  for(const c of fixture.matrixCases){const at=qnumber(c.vValue),eps=1e-5,ev=(id,x)=>value(fixture.nodes,id,{[c.vNode]:x});
    for(let i=0;i<3;i++)for(let j=0;j<2;j++){
      const root=c.frame.B[i][j],numerical=(ev(root,at+eps)-ev(root,at-eps))/(2*eps),actual=ev(c.frame.BPrime[i][j],at);
      assert(Math.abs(numerical-actual)<2e-8);
    }
  }
});
test('dropping Bprime produces a measurable failure of the original three-component equation',()=>{
  for(const c of fixture.matrixCases){const v=id=>value(fixture.nodes,id,{[c.vNode]:qnumber(c.vValue)}),f=c.frame,B=f.B.map(r=>r.map(v)),Bp=f.BPrime.map(r=>r.map(v)),L=f.Bleft.map(r=>r.map(v)),A=f.Aphi.map(r=>r.map(v));
    const z=[.6,1/7],expected=mv(A,mv(B,z)),bad=mv(Bp,z).map((x,i)=>x+mv(B,mv(mm(L,mm(A,B)),z))[i]);
    assert(Math.max(...bad.map((x,i)=>Math.abs(x-expected[i])))>1e-8);
  }
});
test('constant-coefficient finite Volterra terms match independent matrix powers at every displayed order',()=>{
  const c=fixture.volterraCases[0],M=c.matrixPolynomials.map(row=>row.map(p=>qnumber(p[0]))),v=qnumber(c.vValue);let term=[1,0],sum=[1,0];
  for(const row of c.rows){if(row.terms){term=mv(M,term).map(x=>x*v/row.terms);sum=sum.map((x,i)=>x+term[i]);}
    for(let i=0;i<2;i++)assert(Math.abs(value(fixture.nodes,row.values[i],{[c.vNode]:v})-sum[i])<3e-15);
    assert(value(fixture.nodes,row.tail)>0);assert.equal(row.finiteSumClaimedExact,false);
  }
});
test('a hidden coefficient coordinate cannot disappear from a Volterra operation',()=>{
  const G=fresh(),v=G.fresh('v'),p=G.fresh('hidden');
  assert.throws(()=>G.defineCovarianceVolterra({name:'bad',variable:v,parameters:[],matrix:[[p,G.one],[G.zero,G.zero]],normUpper:G.one,length:G.one}),e=>e.code==='INVALID_INPUT');
});
test('the Volterra norm and interval length cannot depend on time or undeclared coordinates',()=>{
  const G=fresh(),v=G.fresh('v'),p=G.fresh('hidden'),base={name:'bad',variable:v,parameters:[],matrix:[[G.zero,G.one],[G.zero,G.zero]],normUpper:G.one,length:G.one};
  assert.throws(()=>G.defineCovarianceVolterra({...base,normUpper:v}),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>G.defineCovarianceVolterra({...base,length:p}),e=>e.code==='INVALID_INPUT');
});
test('copying a graph preserves actual Volterra systems and its exact time derivative',()=>{
  const G=fresh(),v=G.fresh('v'),p=G.fresh('parameter'),sys=G.defineCovarianceVolterra({name:'copy',variable:v,parameters:[p],matrix:[[p,G.one],[G.zero,p]],normUpper:G.q(3),length:G.one});
  const w=G.covarianceValue(sys,0,v,[p]),H=new ActualCovarianceExpressions(G);
  assert.deepEqual(H.covarianceSystems,G.covarianceSystems);assert.deepEqual([...H.freeCoordinates(w)].sort(),[v,p].sort());
  assert.equal(H.derivative(w,v),H.covarianceRhs(sys,0,v,[p]));assert.throws(()=>H.derivative(w,p),e=>e.code==='UNSUPPORTED');
  assert.equal(H.covarianceValue(sys,0,H.zero,[p]),H.one);assert.equal(H.covarianceValue(sys,1,H.zero,[p]),H.zero);
});
test('missing parameter values and excessive truncation orders fail instead of claiming zero tails',()=>{
  const G=fresh(),v=G.fresh('v'),p=G.fresh('p'),sys=G.defineCovarianceVolterra({name:'test',variable:v,parameters:[p],matrix:[[p,G.zero],[G.zero,p]],normUpper:G.one,length:G.one});
  assert.throws(()=>G.covariancePartialSum(sys,{terms:33}),e=>e.code==='RESOURCE_LIMIT');
  assert.throws(()=>G.covariancePartialSum(sys,{terms:1,values:[]}),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>G.covarianceValue(sys,0,v,[]),e=>e.code==='INVALID_INPUT');
});
test('interval range propagation handles signed multiplication and reversed positive reciprocals',()=>{
  const G=fresh(),p=G.fresh('positive'),root=G.mul(G.q(-2),p),reciprocal=G.inv(p),ranges=positiveParameterRange(G,[root,reciprocal],p,G.one,G.q(4)).ranges;
  assert.deepEqual(ranges.map(a=>a.map(x=>value(G.nodes,x))),[[-8,-2],[.25,1]]);
});
test('fixed threshold projections alpha-rename bound variables and reject display coordinates',()=>{
  const a=fresh(),b=fresh(),x=a.fresh('old_name'),y=b.fresh('different_name');
  const ra=a.integral(a.exp(a.neg(x)),x,a.zero,a.one),rb=b.integral(b.exp(b.neg(y)),y,b.zero,b.one);
  assert.deepEqual(covariancePositiveRootProgram(a,{bound:ra}),covariancePositiveRootProgram(b,{bound:rb}));
  assert.throws(()=>covariancePositiveRootProgram(a,{bound:x}),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
});
test('the executed power ledger explicitly dominates every actual moving term',()=>{
  const a=actualOperatorPowerAudit();assert.equal(a.pass,true);assert.equal(a.rows.length,188);
  assert.deepEqual(a.computed,{operatorError:69,dampingError:21,unitFrameError:29,slopeError:29});
  assert.equal(a.unconditional.at(-1).upperPower,40);assert.equal(a.movingNormalIncluded,true);assert.equal(a.movingBasisIncluded,true);
});
