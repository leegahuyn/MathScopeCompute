import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualPulseJetExpressions} from '../actual-pulse-jet-kernel.mjs';
import {actualPulseTimeFTCNorm,actualPulseMatrixFTCNorm,actualPulseJetFTCNorms} from '../actual-pulse-jet-source.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

const graph=()=>new ActualPulseJetExpressions(new ActualConvergentExpressions());
const same=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b)).pass;

// A small-control Simpson interpreter checks algebra against independent
// scalar values. Its decimal integrals are diagnostics, not source enclosures.
function diagnostic(G,id,env){
  const {op,args}=G.nodes[id],ev=x=>diagnostic(G,x,env);
  if(op==='rational')return Number(args[0])/Number(args[1]);
  if(op==='coordinate'){assert.ok(Object.hasOwn(env,id));return env[id];}
  if(op==='add')return ev(args[0])+ev(args[1]);
  if(op==='multiply')return ev(args[0])*ev(args[1]);
  if(op==='inverse')return 1/ev(args[0]);
  if(op==='integer_power')return ev(args[0])**args[1];
  if(op==='sqrt_positive')return Math.sqrt(ev(args[0]));
  if(op==='exp')return Math.exp(ev(args[0]));
  if(op==='maximum')return Math.max(...args.map(ev));
  if(op==='definite_integral'){
    const [body,v,l,r]=args,left=ev(l),right=ev(r),n=256,h=(right-left)/n;
    const f=t=>diagnostic(G,body,{...env,[v]:t});let out=f(left)+f(right);
    for(let i=1;i<n;i++)out+=(i%2?4:2)*f(left+i*h);return out*h/3;
  }
  throw Error('Not an independent scalar control: '+op);
}

test('the FTC envelope differentiates its retained coefficient and binds its actual integration coordinate',()=>{
  const G=graph(),v=G.fresh('ftc_v'),a=G.fresh('ftc_a'),b=G.fresh('ftc_b'),f=G.add(G.mul(a,G.pow(v,2)),G.mul(b,v),G.mul(a,b));
  const u=actualPulseTimeFTCNorm(G,f,{variable:v,length:G.one,parameters:[a,b]});
  assert.equal(u.expression,f);assert.ok(same(G,u.timeDerivative,G.add(G.mul(G.q(2),a,v),b)));
  assert.equal(u.valueAtZero,G.mul(a,b));assert.equal(G.nodes[u.integral].op,'definite_integral');
  assert.ok(!G.freeCoordinates(u.upper).has(v));assert.deepEqual([...G.freeCoordinates(u.upper)].sort((a,b)=>a-b),[a,b]);
  assert.equal(u.integrand,G.sqrt(G.add(G.one,G.pow(G.substitute(u.timeDerivative,v,u.integrationVariable),2))));
  assert.equal(u.sourceAuthenticated,false);assert.equal(u.numericalIntegralEvaluated,false);
  assert.equal(u.envelopeContinuousOnDeclaredJointContinuousDomain,true);
  for(const [av,bv]of [[-2,1],[0,0],[1,-3],[2,4]]){
    const bound=diagnostic(G,u.upper,{[a]:av,[b]:bv});
    for(const time of [0,0.1,0.25,0.5,0.8,1])assert.ok(Math.abs(av*time*time+bv*time+av*bv)<=bound);
  }
});

test('constant coefficients reduce exactly and smoothing never creates a zero denominator at a zero derivative',()=>{
  const G=graph(),v=G.fresh('ftc_v'),a=G.fresh('ftc_a'),L=G.q(3,4),options={variable:v,length:L,parameters:[a]};
  const zero=actualPulseTimeFTCNorm(G,G.zero,options),constant=actualPulseTimeFTCNorm(G,a,options);
  assert.equal(zero.timeDerivative,G.zero);assert.equal(zero.integrand,G.one);assert.equal(zero.integral,L);
  assert.equal(zero.upper,G.add(G.one,L));
  assert.equal(constant.upper,G.add(G.sqrt(G.add(G.one,G.pow(a,2))),L));
  assert.equal(G.derivative(zero.upper,a),G.zero);
  assert.ok(Number.isFinite(diagnostic(G,G.derivative(constant.upper,a),{[a]:0})));
});

test('rectangular matrix row sums bound the induced infinity norm and keep parameter dependence',()=>{
  const G=graph(),v=G.fresh('ftc_v'),a=G.fresh('ftc_a'),A=[[a,G.mul(a,v)],[G.zero,G.one],[G.pow(v,2),G.add(a,v)]];
  const u=actualPulseMatrixFTCNorm(G,A,{variable:v,length:G.one,parameters:[a]});
  assert.equal(u.entries.length,3);assert.equal(u.rowSums.length,3);assert.equal(G.nodes[u.upper].op,'maximum');
  for(let i=0;i<3;i++)assert.ok(same(G,u.rowSums[i],G.add(...u.entries[i].map(x=>x.upper))));
  for(const av of [-3,0,2])for(const time of [0,0.2,0.6,1]){
    const maxRow=Math.max(...A.map(row=>row.reduce((s,x)=>s+Math.abs(diagnostic(G,x,{[a]:av,[v]:time})),0)));
    assert.ok(maxRow<=diagnostic(G,u.upper,{[a]:av}));
  }
  assert.ok(G.freeCoordinates(u.upper).has(a));assert.ok(!G.freeCoordinates(u.upper).has(v));
  assert.equal(u.sourceAuthenticated,false);
});

test('hidden coordinates, time-dependent interval lengths, caller derivatives, and source claims are rejected',()=>{
  const G=graph(),v=G.fresh('ftc_v'),a=G.fresh('ftc_a'),hidden=G.fresh('ftc_hidden'),options={variable:v,length:G.one,parameters:[a]};
  assert.throws(()=>actualPulseTimeFTCNorm(G,hidden,options),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>actualPulseTimeFTCNorm(G,a,{...options,length:v}),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>actualPulseTimeFTCNorm(G,a,{...options,length:G.q(-1)}),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>actualPulseTimeFTCNorm(G,a,{...options,timeDerivative:G.zero}),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>actualPulseMatrixFTCNorm(G,[[a],[a,a]],options),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>actualPulseJetFTCNorms(G,{families:[]},{}),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
  const u=actualPulseTimeFTCNorm(G,a,options);assert.throws(()=>{u.upper=G.zero;},TypeError);
  assert.equal(actualPulseTimeFTCNorm(G,a,options),u);
});
