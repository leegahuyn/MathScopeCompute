import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualPulseSensitivityExpressions} from '../actual-pulse-sensitivity-kernel.mjs';
import {covarianceIntegralFirstDerivative,covarianceInverseFirstDerivative,prepareActualCovarianceSensitivityProgram,assertActualCovarianceSensitivityProgram} from '../actual-covariance-sensitivity.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

const graph=()=>new ActualPulseSensitivityExpressions(new ActualConvergentExpressions(),{maxNodes:3000000});
const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:40000}).pass;
// Independent interpreter for the small analytic controls below only. A
// source parameter/solution operation is never treated as a numeric value.
function number(G,root,env){
  const ev=(id,values)=>{
    const {op,args}=G.nodes[id];
    if(op==='rational')return Number(args[0])/Number(args[1]);
    if(op==='coordinate'){assert.ok(Object.hasOwn(values,args[0]));return values[args[0]];}
    if(op==='add')return ev(args[0],values)+ev(args[1],values);
    if(op==='multiply')return ev(args[0],values)*ev(args[1],values);
    if(op==='inverse')return 1/ev(args[0],values);
    if(op==='integer_power')return ev(args[0],values)**args[1];
    if(op==='exp')return Math.exp(ev(args[0],values));
    if(op==='maximum')return Math.max(...args.map(x=>ev(x,values)));
    if(op==='definite_integral')return simpson(x=>ev(args[0],{...values,[G.nodes[args[1]].args[0]]:x}),ev(args[2],values),ev(args[3],values));
    throw Error('Unsupported control operation: '+op);
  };
  const result=ev(root,env);assert.ok(Number.isFinite(result));return result;
}
function simpson(f,a,b,n=512){let sum=f(a)+f(b);const h=(b-a)/n;for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(a+i*h);return sum*h/3;}
const d5=(f,a,h=1e-4)=>(f(a-2*h)-8*f(a-h)+8*f(a+h)-f(a+2*h))/(12*h);

test('nonconstant covariance integrals retain factor, cutoff, amplitude and moving endpoint derivatives',()=>{
  const G=graph(),v=G.fresh('independent_time'),a=G.fresh('independent_parameter');
  const amplitude=[G.add(G.one,G.mul(a,v)),G.add(G.pow(a,2),G.pow(v,2)),G.add(a,v)];
  const cutoff=G.add(G.one,G.div(G.mul(a,v),G.q(10))),factor=G.add(G.one,G.pow(a,2)),left=G.div(a,G.q(7)),right=G.add(G.one,G.div(a,G.q(3)));
  const result=covarianceIntegralFirstDerivative(G,{amplitude,cutoff,factor,variable:v,parameter:a,left,right});
  assert.notEqual(result.factorDerivative,G.zero);assert.notEqual(result.cutoffDerivative,G.zero);
  assert.notEqual(result.leftDerivative,G.zero);assert.notEqual(result.rightDerivative,G.zero);
  const env={[G.nodes[a].args[0]]:0.4};
  for(const row of result.rows){
    const j=row.index,integral=x=>(1+x*x)*simpson(t=>{
      const values=[1+x*t,x*x+t*t,x+t],psi=1+x*t/10;return psi*psi*values[0]*values[j];
    },x/7,1+x/3);
    assert.ok(Math.abs(number(G,row.derivative,env)-d5(integral,0.4))<2e-8);
    assert.ok(row.productCheck.pass&&row.leibnizCheck.pass);
    const omittedEndpoints=G.sub(row.derivative,G.mul(factor,G.sub(row.upperBoundary,row.lowerBoundary)));
    assert.equal(equal(G,row.derivative,omittedEndpoints),false);
    assert.equal(equal(G,row.derivative,G.mul(factor,row.interior)),false);
  }
  assert.equal(result.sourceAuthenticated,false);
});

test('fixed endpoints do not erase parameter derivatives of nonconstant time amplitudes',()=>{
  const G=graph(),v=G.fresh('fixed_v'),a=G.fresh('fixed_a');
  const exponential=G.exp(G.mul(a,v)),result=covarianceIntegralFirstDerivative(G,{amplitude:[exponential,G.mul(v,exponential),G.mul(a,exponential)],
    cutoff:G.one,factor:G.q(1,2),variable:v,parameter:a,left:G.zero,right:G.one});
  assert.equal(result.leftDerivative,G.zero);assert.equal(result.rightDerivative,G.zero);
  for(const row of result.rows){
    assert.equal(row.upperBoundary,G.zero);assert.equal(row.lowerBoundary,G.zero);
    const expected=x=>0.5*simpson(t=>Math.exp(2*x*t)*(row.index===1?t:row.index===2?x:1),0,1);
    assert.ok(Math.abs(number(G,row.derivative,{[G.nodes[a].args[0]]:0.3})-d5(expected,0.3))<2e-9);
  }
});

test('a nonconstant H and target match an independent numerical inverse derivative, including Ha*y',()=>{
  const G=graph(),a=G.fresh('inverse_a'),H=[[G.add(G.q(2),a),G.pow(a,2)],[a,G.add(G.q(3),a)]],T=[G.add(G.one,G.pow(a,2)),G.exp(a)];
  const inverse=covarianceInverseFirstDerivative(G,{matrix:H,target:T,parameter:a});
  const independent=x=>{const det=(2+x)*(3+x)-x*x*x,b=[1+x*x,Math.exp(x)];return [((3+x)*b[0]-x*x*b[1])/det,(-x*b[0]+(2+x)*b[1])/det];};
  const env={[G.nodes[a].args[0]]:0.4};
  for(let j=0;j<2;j++){
    assert.ok(Math.abs(number(G,inverse.weightDerivative[j],env)-d5(x=>independent(x)[j],0.4))<1e-9);
    const missingHa=G.div(G.add(...inverse.adjugate[j].map((x,k)=>G.mul(x,inverse.targetDerivative[k]))),inverse.determinant);
    assert.equal(equal(G,inverse.weightDerivative[j],missingHa),false);
    assert.ok(Math.abs(number(G,inverse.weightDerivative[j],env)-number(G,missingHa,env))>1e-3);
  }
  assert.equal(inverse.domain.nonzeroDeterminantProved,false);assert.equal(inverse.domain.positiveWeightsProved,false);
  assert.equal(inverse.squareRootsConstructed,false);assert.equal(inverse.sourceAuthenticated,false);
});

test('actual differentiated H integrals feed the inverse derivative with a nonconstant target',()=>{
  const G=graph(),v=G.fresh('composed_v'),a=G.fresh('composed_a');
  const first=covarianceIntegralFirstDerivative(G,{amplitude:[G.one,G.add(G.q(2),G.mul(a,v)),G.mul(a,v)],cutoff:G.one,factor:G.one,variable:v,parameter:a,left:G.zero,right:G.one});
  const second=covarianceIntegralFirstDerivative(G,{amplitude:[G.one,G.pow(a,2),G.add(G.q(3),G.mul(a,v))],cutoff:G.one,factor:G.one,variable:v,parameter:a,left:G.zero,right:G.one});
  const matrix=[[first.rows[0].original,second.rows[0].original],[first.rows[1].original,second.rows[1].original]],target=[G.add(G.one,a),G.pow(a,2)];
  const inverse=covarianceInverseFirstDerivative(G,{matrix,target,parameter:a});
  assert.ok(equal(G,inverse.matrixDerivative[0][0],G.q(1,2)));
  assert.ok(equal(G,inverse.matrixDerivative[0][1],G.mul(G.q(2),a)));
  assert.ok([...inverse.valueChecks,...inverse.derivativeChecks,...inverse.directChecks].every(x=>x.pass));
});

test('factorial derivative-integral bounds enclose an independent exponential example and have no fixed floor',()=>{
  const G=graph(),v=G.fresh('tail_v'),a=G.fresh('tail_a');
  const system=G.definePulseFirstVariation({name:'independent diagonal analytic control',variable:v,parameters:[a],parameter:a,
    matrix:[[a,G.zero],[G.zero,G.zero]],initial:[G.one,G.zero],left:G.zero,length:G.one,
    matrixNorm:G.one,matrixDerivativeNorm:G.one,initialNorm:G.one,initialDerivativeNorm:G.zero,leftDerivativeNorm:G.zero});
  const B=[[G.add(G.one,a),G.zero],[v,G.one],[G.add(a,v),G.q(2)]],env={[G.nodes[a].args[0]]:0.5};
  const exact=2*(1+0.5)*simpson(t=>Math.exp(t),0,1)+2*(1+0.5)**2*simpson(t=>t*Math.exp(t),0,1);
  let previous=Infinity;
  for(const terms of [4,8,12]){
    const partial=G.pulseSensitivityPartialSum(system,{terms}),amplitude=B.map(row=>G.add(...row.map((x,j)=>G.mul(x,partial.values[j]))));
    const finite=covarianceIntegralFirstDerivative(G,{amplitude,cutoff:G.one,factor:G.one,variable:v,parameter:a,left:G.zero,right:G.one});
    // On 0<=a<=1/2,0<=v<=1: ||B||inf<=4, ||B_a||inf<=1,
    // ||(w,s)||, ||(w_N,s_N)|| <= exp(2). Independently evaluate
    // both the exact integral derivative and this proven product bound.
    const bound=4*4*5*Math.exp(2)*number(G,partial.tail,env);
    const actualError=Math.abs(number(G,finite.rows[2].derivative,env)-exact);
    assert.ok(bound>0&&bound<previous);assert.ok(actualError<=bound+1e-10);previous=bound;
  }
});

test('invalid geometry, singular matrices and caller-authored source derivatives are rejected',()=>{
  const G=graph(),v=G.fresh('invalid_v'),a=G.fresh('invalid_a'),input={amplitude:[G.one,a,v],cutoff:G.one,factor:G.one,variable:v,parameter:a,left:G.zero,right:G.one};
  assert.throws(()=>covarianceIntegralFirstDerivative(G,{...input,factor:v}),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>covarianceIntegralFirstDerivative(G,{...input,left:v}),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>covarianceIntegralFirstDerivative(G,{...input,parameter:v}),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>covarianceIntegralFirstDerivative(G,{...input,amplitudeDerivative:[0,0,0]}),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>covarianceInverseFirstDerivative(G,{matrix:[[G.one,G.one],[G.one,G.one]],target:[G.one,G.one],parameter:a}),e=>e.code==='SINGULAR_COVARIANCE');
  assert.throws(()=>covarianceInverseFirstDerivative(G,{matrix:[[G.one,G.zero],[G.zero,G.one]],target:[G.one,G.one],parameter:a,matrixDerivative:[[0,0],[0,0]]}),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>assertActualCovarianceSensitivityProgram({scope:{actualSourceFirstCovarianceDerivativeConstructed:true}}),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
  for(const forged of [{matrix:[[1,0],[0,1]]},{target:[1,1]},{matrixDerivativeNorm:1},{ellExact:'2'},{terms:1},{slowCoordinate:'Xrep'}])assert.throws(()=>prepareActualCovarianceSensitivityProgram(forged));
});
