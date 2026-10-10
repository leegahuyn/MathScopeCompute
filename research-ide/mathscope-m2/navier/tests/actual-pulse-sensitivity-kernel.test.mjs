import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualPulseSensitivityExpressions} from '../actual-pulse-sensitivity-kernel.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

const graph=()=>new ActualPulseSensitivityExpressions(new ActualConvergentExpressions(),{maxNodes:3000000});
function data(G,{moving=false,initial=true}={}){
  const v=G.fresh('test_v'),a=G.fresh('test_a');
  return {name:'explicit algebra control, not the N3 source',variable:v,parameters:[a],parameter:a,
    matrix:[[G.mul(a,v),G.add(G.one,a)],[v,G.neg(G.div(a,G.q(2)))]],
    initial:initial?[G.add(G.one,a),G.pow(a,2)]:[G.one,G.zero],left:moving?G.div(a,G.q(4)):G.zero,length:G.one,
    matrixNorm:G.q(8),matrixDerivativeNorm:G.q(4),initialNorm:G.q(2),initialDerivativeNorm:G.q(2),leftDerivativeNorm:moving?G.q(1,4):G.zero};
}
const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:40000}).pass;
// Deliberately independent small-control interpreter. Source parameters and
// unresolved solution/integral operations are not accepted as numbers.
const numeric=(G,root,coordinates={})=>{
  const memo=new Map(),ev=id=>{if(memo.has(id))return memo.get(id);const {op,args}=G.nodes[id];let x;
    if(op==='rational')x=Number(args[0])/Number(args[1]);else if(op==='coordinate')x=coordinates[args[0]];
    else if(op==='add')x=ev(args[0])+ev(args[1]);else if(op==='multiply')x=ev(args[0])*ev(args[1]);
    else if(op==='inverse')x=1/ev(args[0]);else if(op==='integer_power')x=ev(args[0])**args[1];
    else if(op==='exp')x=Math.exp(ev(args[0]));else if(op==='maximum')x=Math.max(...args.map(ev));
    else throw Error('Independent control is not a numeric source interpreter: '+op);
    assert.ok(Number.isFinite(x));memo.set(id,x);return x;};return ev(root);
};

test('the augmented system actually differentiates every coefficient and the parameter-dependent datum',()=>{
  const G=graph(),d=data(G),id=G.definePulseFirstVariation(d),s=G.pulseSensitivitySystems[id];
  assert.deepEqual(s.matrixDerivative,[[d.variable,G.one],[G.zero,G.q(-1,2)]]);
  assert.deepEqual(s.initialDerivative,[G.one,G.mul(G.q(2),d.parameter)]);
  assert.deepEqual(s.augmentedMatrix.slice(2),s.matrixDerivative.map((r,j)=>[...r,...d.matrix[j]]));
  assert.equal(s.sourceNormAuthenticated,false);assert.equal(s.secondSlowDerivativeSupported,false);
});

test('noncommuting time-dependent polynomial coefficients agree with independent differentiation of each ordered-integral partial sum',()=>{
  const G=graph(),d=data(G),id=G.definePulseFirstVariation(d);let term=[...d.initial],sum=[...term];
  for(let n=0;n<=5;n++){
    const partial=G.pulseSensitivityPartialSum(id,{terms:n});
    for(let j=0;j<2;j++){assert.ok(equal(G,partial.values[j],sum[j]));assert.ok(equal(G,partial.values[j+2],G.derivative(sum[j],d.parameter)));}
    const t=G.fresh('independent_integral_time'),at=x=>G.substitute(x,d.variable,t);
    term=d.matrix.map(row=>G.integral(G.add(...row.map((x,j)=>G.mul(at(x),at(term[j])))),t,G.zero,d.variable));sum=sum.map((x,j)=>G.add(x,term[j]));
  }
});

test('omitting matrix dependence or initial dependence gives an exact failing control',()=>{
  const G=graph(),d=data(G),id=G.definePulseFirstVariation(d),partial=G.pulseSensitivityPartialSum(id,{terms:2});
  const Ma=d.matrix.map(r=>r.map(x=>G.derivative(x,d.parameter))),ga=d.initial.map(x=>G.derivative(x,d.parameter));
  // Deliberately wrong recurrences change only the named dependency. Both
  // retain the same noncommuting M and the same original initial datum g.
  const wrong=({omitMatrix=false,omitInitial=false})=>{
    let w=[...d.initial],s=omitInitial?[G.zero,G.zero]:[...ga],total=[...s];
    for(let n=1;n<=2;n++){
      const t=G.fresh('omission_control_time'),at=x=>G.substitute(x,d.variable,t);
      const wn=d.matrix.map(row=>G.integral(G.add(...row.map((x,j)=>G.mul(at(x),at(w[j])))),t,G.zero,d.variable));
      const sn=d.matrix.map((row,i)=>G.integral(G.add(...row.map((x,j)=>G.add(G.mul(at(x),at(s[j])),omitMatrix?G.zero:G.mul(at(Ma[i][j]),at(w[j]))))),t,G.zero,d.variable));
      w=wn;s=sn;total=total.map((x,j)=>G.add(x,s[j]));
    }
    return total;
  };
  for(const mismatch of [wrong({omitMatrix:true}),wrong({omitInitial:true})])
    assert.equal(equal(G,partial.values[2],mismatch[0]),false);
});

test('a moving initial endpoint retains its exact boundary correction',()=>{
  const G=graph(),d=data(G,{moving:true}),id=G.definePulseFirstVariation(d),s=G.pulseSensitivitySystems[id];
  assert.equal(s.leftDerivative,G.q(1,4));
  for(let j=0;j<2;j++){
    const Ma=d.matrix[j].map(x=>G.substitute(x,d.variable,d.left));
    const rhs=G.add(...Ma.map((x,k)=>G.mul(x,d.initial[k])));
    assert.ok(equal(G,s.variationInitial[j],G.sub(G.derivative(d.initial[j],d.parameter),G.mul(rhs,G.q(1,4)))));
    assert.equal(equal(G,s.variationInitial[j],s.initialDerivative[j]),false);
  }
});

test('the endpoint chain rule is exact for a solvable nilpotent system with moving data and both endpoints',()=>{
  const G=graph(),d=data(G,{moving:true}),a=d.parameter,v=d.variable;
  const matrix=[[G.zero,a],[G.zero,G.zero]],initial=[G.add(G.one,a),G.one],left=G.div(a,G.q(4)),right=G.add(G.q(1,2),G.div(a,G.q(2)));
  const id=G.definePulseFirstVariation({...d,matrix,initial,left,matrixNorm:G.one,matrixDerivativeNorm:G.one,initialDerivativeNorm:G.one}),s=G.pulseSensitivitySystems[id];
  const exact=[G.add(initial[0],G.mul(a,G.sub(v,left))),G.one],partial=G.pulseSensitivityPartialSum(id,{terms:2});
  for(let j=0;j<2;j++)assert.ok(equal(G,partial.values[j],exact[j]));
  const sensitivityAt=G.substitute(partial.values[2],v,right),rhsAt=G.mul(a,G.one),total=G.add(sensitivityAt,G.mul(rhsAt,G.derivative(right,a)));
  assert.ok(equal(G,total,G.derivative(G.substitute(exact[0],v,right),a)));
  assert.equal(equal(G,sensitivityAt,G.derivative(G.substitute(exact[0],v,right),a)),false);
  const full=G.pulseSensitivityValue(id,0,right,[a]),derivative=G.derivative(full,a);
  const expected=G.add(G.pulseSensitivityValue(id,2,right,[a]),G.mul(G.q(1,2),G.pulseSensitivityRhs(id,0,right,[a])));
  assert.ok(equal(G,derivative,expected));assert.equal(s.leftDerivative,G.q(1,4));
});

test('the four-component factorial bound is nonzero, decreases eventually and encloses an analytic exponential variation',()=>{
  const G=graph(),d=data(G),a=d.parameter,v=d.variable;
  const id=G.definePulseFirstVariation({...d,matrix:[[a,G.zero],[G.zero,G.zero]],initial:[G.add(G.one,a),G.zero],matrixNorm:G.one,matrixDerivativeNorm:G.one,initialNorm:G.q(2),initialDerivativeNorm:G.one});
  const env={[G.nodes[a].args[0]]:0.5,[G.nodes[v].args[0]]:0.75};
  let previous=Infinity;
  for(const n of [4,8,12]){
    const partial=G.pulseSensitivityPartialSum(id,{terms:n}),bound=numeric(G,partial.tail,env),computed=numeric(G,partial.values[2],env),exact=Math.exp(0.375)*(1+1.5*0.75);
    assert.ok(bound>0&&bound<previous);assert.ok(Math.abs(exact-computed)<=bound);previous=bound;
  }
});

test('unbound variables, unsupported orders, negative bounds and mutation cannot silently certify a sensitivity',()=>{
  const G=graph(),d=data(G),id=G.definePulseFirstVariation(d),value=G.pulseSensitivityValue(id,2,d.variable,[d.parameter]);
  assert.throws(()=>G.derivative(value,d.parameter),e=>e.code==='UNSUPPORTED');
  assert.throws(()=>G.pulseSensitivityPartialSum(id,{terms:33}),e=>e.code==='RESOURCE_LIMIT');
  assert.throws(()=>G.definePulseFirstVariation({...d,matrixNorm:G.q(-1)}));
  const hidden=G.fresh('hidden');assert.throws(()=>G.definePulseFirstVariation({...d,matrix:[[hidden,G.zero],[G.zero,G.zero]]}));
  G.pulseSensitivitySystems[id].matrixDerivative[0][0]=G.zero;
  assert.throws(()=>G.assertPulseFirstVariation(id),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
  assert.throws(()=>G.pulseSensitivityPartialSum(id),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
});
