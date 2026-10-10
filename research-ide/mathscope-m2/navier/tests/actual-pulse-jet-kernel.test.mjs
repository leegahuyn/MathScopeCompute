import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualPulseJetExpressions} from '../actual-pulse-jet-kernel.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';

const graph=()=>new ActualPulseJetExpressions(new ActualConvergentExpressions(),{maxNodes:3000000});
const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:50000}).pass;
const matrixVector=(G,A,w)=>A.map(row=>G.add(...row.map((x,j)=>G.mul(x,w[j]))));
function data(G,count=3){
  const v=G.fresh('jet_control_v'),a=G.fresh('jet_control_R'),b=G.fresh('jet_control_Z'),c=G.fresh('jet_control_T');
  const parameters=[a,b,c],directions=parameters.slice(0,count),vector=x=>Array(count).fill(x),square=x=>Array.from({length:count},()=>vector(x));
  return {name:'Independent polynomial control; not an actual NS source certificate',variable:v,parameters,directions,
    matrix:[[G.add(G.mul(a,v),G.mul(b,c)),G.add(G.one,G.mul(a,b),G.mul(c,G.pow(v,2)))],
      [G.add(v,G.pow(b,2)),G.add(G.neg(G.div(a,G.q(2))),G.pow(c,2),G.mul(a,b,v))]],
    initial:[G.add(G.one,a,G.mul(a,b),G.pow(c,2)),G.add(G.pow(a,2),G.mul(b,c))],
    left:G.zero,length:G.one,matrixNorm:G.q(10),matrixFirstNorms:vector(G.q(8)),matrixSecondNorms:square(G.q(8)),matrixTimeNorm:G.q(12),
    initialNorm:G.q(5),initialFirstNorms:vector(G.q(4)),initialSecondNorms:square(G.q(2)),leftFirstNorms:vector(G.zero),leftSecondNorms:square(G.zero)};
}

// Independent numeric interpreter restricted to small polynomial/analytic
// controls. It refuses source parameters, integrals and solution nodes.
function numeric(G,root,coordinates={}){
  const cache=new Map();
  const ev=id=>{
    if(cache.has(id))return cache.get(id);const {op,args}=G.nodes[id];let out;
    if(op==='rational')out=Number(args[0])/Number(args[1]);
    else if(op==='coordinate')out=coordinates[args[0]];
    else if(op==='add')out=ev(args[0])+ev(args[1]);
    else if(op==='multiply')out=ev(args[0])*ev(args[1]);
    else if(op==='inverse')out=1/ev(args[0]);
    else if(op==='integer_power')out=ev(args[0])**args[1];
    else if(op==='exp')out=Math.exp(ev(args[0]));
    else if(op==='maximum')out=Math.max(...args.map(ev));
    else throw Error('Not an independent numeric control operand: '+op);
    assert.ok(Number.isFinite(out));cache.set(id,out);return out;
  };
  return ev(root);
}

test('three slow directions produce all 20 genuine jet components and the repeated-direction factor two',()=>{
  const G=graph(),d=data(G),id=G.definePulseSecondVariation(d),s=G.pulseJetSystems[id],[a,b,c]=d.directions,v=d.variable;
  assert.equal(s.dimension,20);
  assert.deepEqual(s.blocks.map(x=>x.orders),[[0,0,0],[1,0,0],[0,1,0],[0,0,1],[2,0,0],[1,1,0],[1,0,1],[0,2,0],[0,1,1],[0,0,2]]);
  assert.deepEqual(s.matrixFirst[0],[[v,b],[G.zero,G.add(G.q(-1,2),G.mul(b,v))]]);
  assert.deepEqual(s.matrixSecond[0][1],[[G.zero,G.one],[G.zero,v]]);
  assert.deepEqual(s.matrixSecond[1][0],s.matrixSecond[0][1]);
  assert.equal(s.matrixSecond[2][2][1][1],G.q(2));
  for(let i=0;i<3;i++)for(let r=0;r<2;r++)for(let k=0;k<2;k++)
    assert.ok(equal(G,s.augmentedMatrix[s.secondBlocks[i][i]+r][s.firstBlocks[i]+k],G.mul(G.q(2),s.matrixFirst[i][r][k])));
  assert.ok(s.matrixTime.flat().some(x=>x!==G.zero));
  assert.equal(s.initialFirst[0][0],G.add(G.one,b));
  assert.equal(s.initialSecond[0][1][0],G.one);
  assert.equal(s.sourceNormAuthenticated,false);
  assert.equal(s.thirdSlowDerivativeSupported,false);
  assert.ok([a,b,c].every(x=>s.parameters.includes(x)));
});

test('every fixed-left mixed jet agrees with independent differentiation of noncommuting ordered integrals',()=>{
  const G=graph(),d=data(G),id=G.definePulseSecondVariation(d),s=G.pulseJetSystems[id];
  // The coefficient matrices at different times do not commute. A plain
  // exp(integral M) or a commutative product recurrence fails this control.
  const M0=d.matrix.map(r=>r.map(x=>G.substitute(x,d.variable,G.zero))),M1=d.matrix.map(r=>r.map(x=>G.substitute(x,d.variable,G.one)));
  assert.equal(equal(G,G.add(...M0[0].map((x,k)=>G.mul(x,M1[k][1]))),G.add(...M1[0].map((x,k)=>G.mul(x,M0[k][1])))),false);
  let term=[...d.initial],sum=[...term];
  for(let n=0;n<=3;n++){
    const partial=G.pulseJetPartialSum(id,{terms:n});
    for(const block of s.blocks)for(let k=0;k<2;k++){
      let expected=sum[k];for(let i=0;i<d.directions.length;i++)for(let q=0;q<block.orders[i];q++)expected=G.derivative(expected,d.directions[i]);
      assert.ok(equal(G,partial.values[block.offset+k],expected),'ordered term '+n+', block '+block.label+', component '+k);
    }
    assert.equal(partial.finiteJetSumEqualsDerivativeOfFiniteValueSum,true);
    const t=G.fresh('independent_jet_ordered_time'),at=x=>G.substitute(x,d.variable,t);
    term=d.matrix.map(row=>G.integral(G.add(...row.map((x,j)=>G.mul(at(x),at(term[j])))),t,d.left,d.variable));
    sum=sum.map((x,j)=>G.add(x,term[j]));
  }
});

test('omitting M_ij, one repeated forcing, or a nonconstant datum has an exactly failing control',()=>{
  const G=graph(),d=data(G),id=G.definePulseSecondVariation(d),s=G.pulseJetSystems[id],partial=G.pulseJetPartialSum(id,{terms:1});
  const i=0,j=1,offset=s.secondBlocks[i][j],time=G.fresh('omission_time'),at=x=>G.substitute(x,d.variable,time);
  const omittedMatrix=G.integral(G.add(...s.matrixSecond[i][j][0].map((x,k)=>G.mul(at(x),d.initial[k]))),time,G.zero,d.variable);
  assert.equal(equal(G,G.sub(partial.values[offset],omittedMatrix),partial.values[offset]),false);
  const repeated=s.secondBlocks[0][0],omittedRepeated=G.integral(G.add(...s.matrixFirst[0][0].map((x,k)=>G.mul(at(x),s.variationFirstInitial[0][k]))),time,G.zero,d.variable);
  assert.equal(equal(G,G.sub(partial.values[repeated],omittedRepeated),partial.values[repeated]),false);
  assert.equal(equal(G,partial.values[offset],G.sub(partial.values[offset],s.initialSecond[0][1][0])),false);
});

function movingNilpotent(){
  const G=graph(),d=data(G,2),[a,b]=d.directions,v=d.variable;
  const left=G.div(G.add(G.pow(a,2),G.mul(a,b),G.pow(b,2)),G.q(8));
  const q=G.add(G.mul(a,v),G.mul(b,G.pow(v,2)),G.mul(a,b));
  const initial=[G.add(G.one,G.pow(a,2),G.mul(a,b)),G.add(G.one,a,G.pow(b,2))];
  const matrix=[[G.zero,q],[G.zero,G.zero]];
  const input={...d,matrix,initial,left,leftFirstNorms:[G.one,G.one],leftSecondNorms:[[G.one,G.one],[G.one,G.one]]};
  const id=G.definePulseSecondVariation(input),s=G.pulseJetSystems[id];
  const primitive=t=>G.add(G.div(G.mul(a,G.pow(t,2)),G.q(2)),G.div(G.mul(b,G.pow(t,3)),G.q(3)),G.mul(a,b,t));
  const exact=[G.add(initial[0],G.mul(initial[1],G.sub(primitive(v),primitive(left)))),initial[1]];
  const right=G.add(G.q(1,2),G.div(a,G.q(3)),G.div(G.pow(b,2),G.q(5)),G.div(G.mul(a,b),G.q(7)));
  return {G,input,id,s,a,b,v,left,right,exact};
}

test('a time-dependent nilpotent analytic solution verifies every first/second moving-left jet',()=>{
  const {G,input,id,s,v,left,exact}=movingNilpotent(),partial=G.pulseJetPartialSum(id,{terms:1});
  assert.equal(partial.finiteJetSumEqualsDerivativeOfFiniteValueSum,false);
  for(const block of s.blocks)for(let k=0;k<2;k++){
    let expected=exact[k];for(let i=0;i<input.directions.length;i++)for(let q=0;q<block.orders[i];q++)expected=G.derivative(expected,input.directions[i]);
    assert.ok(equal(G,partial.values[block.offset+k],expected),block.label+'/'+k);
    assert.ok(equal(G,s.augmentedInitial[block.offset+k],G.substitute(expected,v,left)),block.label+' initial/'+k);
  }
});

test('the full moving-evaluation endpoint Hessian retains M_v, mixed RHS terms and endpoint acceleration',()=>{
  const {G,input,id,s,a,b,v,right,exact}=movingNilpotent();
  const at=x=>G.substitute(x,v,right),value=k=>G.pulseJetValue(id,k,right,input.parameters);
  const w=[value(0),value(1)],si=[value(s.firstBlocks[0]),value(s.firstBlocks[0]+1)],sj=[value(s.firstBlocks[1]),value(s.firstBlocks[1]+1)];
  const A=s.matrix.map(r=>r.map(at)),Ai=s.matrixFirst[0].map(r=>r.map(at)),Aj=s.matrixFirst[1].map(r=>r.map(at)),Av=s.matrixTime.map(r=>r.map(at));
  const rhs=matrixVector(G,A,w),ri=matrixVector(G,Ai,w).map((x,k)=>G.add(x,matrixVector(G,A,si)[k])),rj=matrixVector(G,Aj,w).map((x,k)=>G.add(x,matrixVector(G,A,sj)[k]));
  const rvv=matrixVector(G,Av,w).map((x,k)=>G.add(x,matrixVector(G,A,rhs)[k]));
  const bi=G.derivative(right,a),bj=G.derivative(right,b),bij=G.derivative(bi,b);
  for(let k=0;k<2;k++){
    const differentiated=G.derivative(G.derivative(value(k),a),b);
    const expected=G.add(value(s.secondBlocks[0][1]+k),G.mul(ri[k],bj),G.mul(rj[k],bi),G.mul(rvv[k],bi,bj),G.mul(rhs[k],bij));
    assert.ok(equal(G,differentiated,expected));
  }
  // Separately compare the same chain to the explicit polynomial solution,
  // so merely repeating an incorrect implementation formula cannot pass.
  const finite=G.pulseJetPartialSum(id,{terms:1,time:right});
  const fw=finite.values.slice(0,2),fsi=finite.values.slice(s.firstBlocks[0],s.firstBlocks[0]+2),fsj=finite.values.slice(s.firstBlocks[1],s.firstBlocks[1]+2);
  const fr=matrixVector(G,A,fw),fri=matrixVector(G,Ai,fw).map((x,k)=>G.add(x,matrixVector(G,A,fsi)[k])),frj=matrixVector(G,Aj,fw).map((x,k)=>G.add(x,matrixVector(G,A,fsj)[k]));
  const frvv=matrixVector(G,Av,fw).map((x,k)=>G.add(x,matrixVector(G,A,fr)[k]));
  const total=G.add(finite.values[s.secondBlocks[0][1]],G.mul(fri[0],bj),G.mul(frj[0],bi),G.mul(frvv[0],bi,bj),G.mul(fr[0],bij));
  assert.ok(equal(G,total,G.derivative(G.derivative(at(exact[0]),a),b)));
  assert.equal(equal(G,finite.values[s.secondBlocks[0][1]],G.derivative(G.derivative(at(exact[0]),a),b)),false);
  for(const omitted of [G.mul(frvv[0],bi,bj),G.mul(fri[0],bj),G.mul(fr[0],bij)])assert.equal(equal(G,G.sub(total,omitted),total),false);
});

test('a diagonal exponential initial-boundary check detects an omitted M squared as well as M_v',()=>{
  const G=graph(),d=data(G,2),[a,b]=d.directions,v=d.variable,left=G.div(G.add(G.pow(a,2),G.mul(a,b)),G.q(5));
  const lambda=G.add(G.mul(a,v),b),initial=[G.add(G.one,G.mul(a,b)),G.zero];
  const id=G.definePulseSecondVariation({...d,matrix:[[lambda,G.zero],[G.zero,G.zero]],initial,left,leftFirstNorms:[G.one,G.one],leftSecondNorms:[[G.one,G.one],[G.one,G.one]]});
  const s=G.pulseJetSystems[id],primitive=t=>G.add(G.div(G.mul(a,G.pow(t,2)),G.q(2)),G.mul(b,t));
  const exponent=G.sub(primitive(v),primitive(left)),exact=G.mul(initial[0],G.exp(exponent));
  const boundaryExponent=G.substitute(exponent,v,left);
  assert.ok(equal(G,boundaryExponent,G.zero));
  // The arithmetic identity checker deliberately treats exp as an atom.
  // First prove this exponent exactly zero, then apply exp(0)=1 explicitly.
  const rawBoundary=G.substitute(G.derivative(G.derivative(exact,a),b),v,left);
  const exactBoundary=G.substitute(rawBoundary,G.exp(boundaryExponent),G.one);
  assert.ok(equal(G,s.variationSecondInitial[0][1][0],exactBoundary));
  const A=s.matrixAtLeft,Av=s.matrixTime.map(r=>r.map(x=>G.substitute(x,v,left))),M2g=matrixVector(G,A,matrixVector(G,A,initial)),Mvg=matrixVector(G,Av,initial);
  for(const omitted of [G.mul(M2g[0],s.leftFirst[0],s.leftFirst[1]),G.mul(Mvg[0],s.leftFirst[0],s.leftFirst[1]),G.mul(s.initialRhs[0],s.leftSecond[0][1])])
    assert.equal(equal(G,G.add(s.variationSecondInitial[0][1][0],omitted),exactBoundary),false);
});

test('the actual augmented block-row norm and a nonzero factorial tail enclose an analytic Hessian',()=>{
  const G=graph(),d=data(G,1),a=d.directions[0],v=d.variable;
  const id=G.definePulseSecondVariation({...d,matrix:[[a,G.zero],[G.zero,G.zero]],initial:[G.add(G.one,a,G.pow(a,2)),G.zero],
    matrixNorm:G.q(1,2),matrixFirstNorms:[G.one],matrixSecondNorms:[[G.zero]],matrixTimeNorm:G.zero,
    initialNorm:G.q(7,4),initialFirstNorms:[G.q(2)],initialSecondNorms:[[G.q(2)]]});
  const s=G.pulseJetSystems[id];
  assert.equal(numeric(G,s.bounds.augmentedMatrixNorm),2.5);
  assert.equal(numeric(G,s.bounds.augmentedInitialNorm),2);
  const env={[G.nodes[a].args[0]]:0.25,[G.nodes[v].args[0]]:0.6};
  const exact=Math.exp(0.25*0.6)*(2+2*0.6*(1+2*0.25)+0.6**2*(1+0.25+0.25**2));
  let previous=Infinity;
  for(const terms of [4,8,12]){
    const p=G.pulseJetPartialSum(id,{terms}),bound=numeric(G,p.tail,env),computed=numeric(G,p.values[s.secondBlocks[0][0]],env);
    assert.ok(bound>0&&bound<previous);assert.ok(Math.abs(exact-computed)<=bound);previous=bound;
    assert.equal(p.finiteSumIsExactSolution,false);assert.equal(p.sourceNormAuthenticated,false);
  }
  const d3=data(G),id3=G.definePulseSecondVariation({...d3,matrixNorm:G.q(2),matrixFirstNorms:[G.one,G.q(2),G.q(3)],
    matrixSecondNorms:[[G.q(4),G.q(5),G.q(6)],[G.q(5),G.q(7),G.q(8)],[G.q(6),G.q(8),G.q(9)]]});
  assert.equal(numeric(G,G.pulseJetSystems[id3].bounds.augmentedMatrixNorm),17);
});

test('binding keeps the original covariance root and gives symmetric second derivatives without redirectable aliases',()=>{
  const G=graph(),d=data(G),covariance=G.defineCovarianceVolterra({name:'Explicit control original',variable:d.variable,parameters:d.parameters,matrix:d.matrix,normUpper:d.matrixNorm,length:d.length});
  const id=G.definePulseSecondVariation({...d,initial:[G.one,G.zero],initialFirstNorms:Array(3).fill(G.zero),initialSecondNorms:Array.from({length:3},()=>Array(3).fill(G.zero))});
  assert.equal(G.bindOriginalCovarianceJet(covariance,id),true);
  const original=G.covarianceValue(covariance,0,d.variable,d.parameters),s=G.pulseJetSystems[id],[a,b]=d.directions;
  assert.equal(G.pulseJetValue(id,0,d.variable,d.parameters),original);
  assert.equal(G.derivative(original,a),G.pulseJetValue(id,s.firstBlocks[0],d.variable,d.parameters));
  assert.equal(G.derivative(G.derivative(original,a),b),G.derivative(G.derivative(original,b),a));
  const aliases=G.pulseJetAliases;aliases.set(covariance,9999);
  assert.equal(G.pulseJetAliases.get(covariance),id);
  assert.equal(G.derivative(original,a),G.pulseJetValue(id,s.firstBlocks[0],d.variable,d.parameters));
  assert.throws(()=>G.bindOriginalCovarianceJet(covariance,id),e=>e.code==='INVALID_INPUT');
  const packed=G.pack({w:original},{pulseJetKernel:{sourceNormAuthenticated:true}});
  assert.equal(packed.pulseJetKernel.sourceNormAuthenticated,false);
  assert.equal(packed.pulseJetKernel.secondSlowDerivativeSupported,true);
});

test('unsupported slow orders, undeclared dependencies, absent bounds and forged copies fail explicitly',()=>{
  const G=graph(),d=data(G,2),id=G.definePulseSecondVariation(d),s=G.pulseJetSystems[id];
  const value=G.pulseJetValue(id,s.secondBlocks[0][1],d.variable,d.parameters);
  assert.throws(()=>G.derivative(value,d.directions[0]),e=>e.code==='UNSUPPORTED');
  assert.throws(()=>G.derivative(value,d.parameters[2]),e=>e.code==='UNSUPPORTED');
  assert.ok(equal(G,G.derivative(value,d.variable),G.pulseJetRhs(id,s.secondBlocks[0][1],d.variable,d.parameters)));
  assert.throws(()=>G.pulseJetPartialSum(id,{terms:33}),e=>e.code==='RESOURCE_LIMIT');
  assert.throws(()=>G.definePulseSecondVariation({...d,matrixFirst:[[]]}),e=>e.code==='INVALID_INPUT');
  const {matrixTimeNorm,...missing}=d;assert.throws(()=>G.definePulseSecondVariation(missing),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>G.definePulseSecondVariation({...d,matrixNorm:d.variable}),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>G.definePulseSecondVariation({...d,matrixNorm:G.q(-1)}),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>G.definePulseSecondVariation({...d,matrixSecondNorms:[[G.one,G.zero],[G.one,G.one]]}),e=>e.code==='INVALID_INPUT');
  const hidden=G.fresh('not_declared');assert.throws(()=>G.definePulseSecondVariation({...d,matrix:[[hidden,G.zero],[G.zero,G.zero]]}),e=>e.code==='INVALID_INPUT');
  assert.throws(()=>{s.matrixFirst[0][0][0]=G.zero;},TypeError);
  assert.throws(()=>{G.pulseJetPartialSum(id,{terms:0}).tail=G.zero;},TypeError);
  const copied=new ActualPulseJetExpressions(G,{maxNodes:3000000});
  assert.throws(()=>copied.assertPulseSecondVariation(id),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
  assert.throws(()=>copied.pulseJetPartialSum(id),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
  G.pulseJetSystems[id]=structuredClone(s);
  assert.throws(()=>G.assertPulseSecondVariation(id),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
});

test('a covariance binding rejects a changed original matrix or a replaced live descriptor',()=>{
  const G=graph(),d=data(G),covariance=G.defineCovarianceVolterra({name:'Explicit original',variable:d.variable,parameters:d.parameters,matrix:d.matrix,normUpper:d.matrixNorm,length:d.length});
  const wrong=G.definePulseSecondVariation({...d,matrix:[[G.one,G.zero],[G.zero,G.zero]],initial:[G.one,G.zero]});
  assert.throws(()=>G.bindOriginalCovarianceJet(covariance,wrong),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
  const id=G.definePulseSecondVariation({...d,initial:[G.one,G.zero]});
  const original=G.covarianceSystems[covariance];G.covarianceSystems[covariance]=structuredClone(original);
  assert.throws(()=>G.bindOriginalCovarianceJet(covariance,id),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
  assert.throws(()=>G.covarianceValue(covariance,0,d.variable,d.parameters),e=>e.code==='INVALID_SOURCE_CONSTRUCTION');
});

test('a frozen piecewise carrier has an exact zero slow derivative even when inherited AD cached a zero-branch expression',()=>{
  const base=new ActualConvergentExpressions(),a=base.fresh('local_slow_coordinate'),label=base.fresh('frozen_label');
  const carrier=base.choose(label,base.q(-1),base.one,base.q(-1),base.one,base.q(2));
  const unsimplified=base.derivative(carrier,a);
  assert.notEqual(unsimplified,base.zero); // an all-zero branch node, not a nonzero mathematical derivative
  assert.equal(base.dependsOn(carrier,a),false);
  const G=new ActualPulseJetExpressions(base);
  assert.equal(G.derivative(carrier,a),G.zero);
  assert.equal(G.derivative(G.mul(carrier,a),a),carrier);
});
