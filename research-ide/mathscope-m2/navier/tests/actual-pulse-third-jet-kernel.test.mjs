import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualPulseThirdJetExpressions,thirdJetIndices,thirdJetBinomial} from '../actual-pulse-third-jet-kernel.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {disposableThirdJetCacheCopy,clearDisposableThirdJetCaches} from '../actual-third-jet-ftc.mjs';

const graph=()=>new ActualPulseThirdJetExpressions(new ActualConvergentExpressions(),{maxNodes:3000000});
const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:100000}).pass;
const mv=(G,A,w)=>A.map(row=>G.add(...row.map((x,j)=>G.mul(x,w[j]))));
function data(G,count=3){
  const v=G.fresh('third_test_v'),a=G.fresh('third_test_R'),b=G.fresh('third_test_Z'),c=G.fresh('third_test_T'),parameters=[a,b,c],directions=parameters.slice(0,count);
  return {name:'noncommuting independent polynomial control',variable:v,parameters,directions,left:G.zero,length:G.one,
    matrix:[[G.add(G.mul(G.pow(a,3),v),G.mul(a,b,c)),G.add(b,G.mul(v,c,G.pow(a,2)))],[G.add(v,G.mul(a,b)),G.add(G.pow(c,2),G.mul(a,G.pow(v,2)))]],
    initial:[G.add(G.one,G.pow(a,3),G.mul(G.pow(b,2),c),G.mul(a,b,c)),G.add(G.mul(G.pow(a,2),b),G.pow(c,3))]};
}
const differentiate=(G,root,directions,orders)=>{for(let i=0;i<orders.length;i++)for(let n=0;n<orders[i];n++)root=G.derivative(root,directions[i]);return root;};

test('all 20 multi-indices give 40 components and third repeated/mixed binomial factors',()=>{
  const G=graph(),d=data(G),id=G.definePulseThirdVariation(d),s=G.pulseThirdJetSystems[id],[a,b,c]=d.directions,v=d.variable;
  assert.equal(s.dimension,40);assert.equal(s.blocks.length,20);assert.equal(s.blocks.filter(b=>b.degree===3).length,10);
  const offset=orders=>G.thirdJetComponent(id,0,orders),matrix=orders=>s.matrixJet.matrices[offset(orders)/2];
  assert.equal(matrix([3,0,0])[0][0],G.mul(G.q(6),v));assert.equal(matrix([1,1,1])[0][0],G.one);
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){
    assert.ok(equal(G,s.augmentedMatrix[offset([3,0,0])+i][offset([2,0,0])+j],G.mul(G.q(3),matrix([1,0,0])[i][j])));
    assert.ok(equal(G,s.augmentedMatrix[offset([3,0,0])+i][offset([1,0,0])+j],G.mul(G.q(3),matrix([2,0,0])[i][j])));
    assert.ok(equal(G,s.augmentedMatrix[offset([2,0,1])+i][offset([1,0,1])+j],G.mul(G.q(2),matrix([1,0,0])[i][j])));
    assert.ok(equal(G,s.augmentedMatrix[offset([2,0,1])+i][offset([1,0,0])+j],G.mul(G.q(2),matrix([1,0,1])[i][j])));
  }
  assert.equal(s.augmentedInitial[offset([1,1,1])],G.one);assert.equal(s.augmentedInitial[offset([3,0,0])],G.q(6));
  assert.equal(thirdJetBinomial([2,0,1],[1,0,1]),2);assert.equal(thirdJetBinomial([3,0,0],[2,0,0]),3);
  assert.equal(s.sourceAuthenticated,false);assert.equal(s.fixedLeftEndpoint,true);
});

test('third jets are independent derivatives of ordered integrals with noncommuting matrices',()=>{
  const G=graph(),d=data(G),id=G.definePulseThirdVariation(d),s=G.pulseThirdJetSystems[id];
  const M0=d.matrix.map(row=>row.map(x=>G.substitute(x,d.variable,G.zero))),M1=d.matrix.map(row=>row.map(x=>G.substitute(x,d.variable,G.one)));
  assert.equal(equal(G,G.add(...M0[0].map((x,k)=>G.mul(x,M1[k][1]))),G.add(...M1[0].map((x,k)=>G.mul(x,M0[k][1])))),false);
  let term=[...d.initial],sum=[...term];
  for(let n=0;n<=2;n++){
    const p=G.pulseThirdJetPartialSum(id,{terms:n});
    for(const block of s.blocks)for(let k=0;k<2;k++)assert.ok(equal(G,p.values[block.offset+k],differentiate(G,sum[k],d.directions,block.orders)),'ordered term '+n+' / '+block.orders+' / '+k);
    const tau=G.fresh('independent_third_ordered_time'),at=x=>G.substitute(x,d.variable,tau);
    term=d.matrix.map(row=>G.integral(G.add(...row.map((x,k)=>G.mul(at(x),at(term[k])))),tau,G.zero,d.variable));sum=sum.map((x,k)=>G.add(x,term[k]));
  }
});

test('all matrix/time FTC bodies and the actual augmented row norm are retained',()=>{
  const G=graph(),d=data(G),id=G.definePulseThirdVariation(d),s=G.pulseThirdJetSystems[id];
  assert.equal(s.bounds.matrixNorms.length,20);
  for(const[at,norm]of s.bounds.matrixNorms.entries())for(let i=0;i<2;i++)for(let j=0;j<2;j++){
    const e=norm.entries[i][j];assert.equal(e.expression,s.matrixJet.matrices[at][i][j]);assert.equal(e.timeDerivative,G.derivative(e.expression,d.variable));
    assert.equal(G.freeCoordinates(e.upper).has(d.variable),false);assert.equal(e.sourceAuthenticated,false);assert.equal(e.numericalIntegralEvaluated,false);
  }
  const aaa=G.thirdJetComponent(id,0,[3,0,0])/2,at=alpha=>s.bounds.matrixNorms[G.thirdJetComponent(id,0,alpha)/2].upper;
  assert.ok(equal(G,s.bounds.blockRowNorms[aaa],G.add(at([0,0,0]),G.mul(G.q(3),at([1,0,0])),G.mul(G.q(3),at([2,0,0])),at([3,0,0]))));
  const p=G.pulseThirdJetPartialSum(id,{terms:1});assert.equal(p.tailAppliesToAll40Components,true);assert.notEqual(p.tail,G.zero);
  assert.equal(p.tailTendsToZero,true);assert.equal(p.finiteSumIsExactSolution,false);assert.equal(p.numericalIntegralEvaluated,false);
});

test('missing third coefficient, repeated forcing or nonconstant datum fails a concrete control',()=>{
  const G=graph(),d=data(G),id=G.definePulseThirdVariation(d),s=G.pulseThirdJetSystems[id],p=G.pulseThirdJetPartialSum(id,{terms:1}),aaa=G.thirdJetComponent(id,0,[3,0,0]),a=G.thirdJetComponent(id,0,[1,0,0]);
  const tau=G.fresh('omitted_third_integral'),at=x=>G.substitute(x,d.variable,tau),third=s.matrixJet.matrices[aaa/2],second=s.matrixJet.matrices[G.thirdJetComponent(id,0,[2,0,0])/2];
  const missingM3=G.integral(G.add(...third[0].map((x,k)=>G.mul(at(x),d.initial[k]))),tau,G.zero,d.variable);
  const missingBinomial=G.integral(G.add(...second[0].map((x,k)=>G.mul(at(x),s.augmentedInitial[a+k]))),tau,G.zero,d.variable);
  for(const omitted of[missingM3,missingBinomial,s.augmentedInitial[aaa]])assert.equal(equal(G,G.sub(p.values[aaa],omitted),p.values[aaa]),false);
});

test('an exact nilpotent solution verifies the full third moving-evaluation endpoint chain',()=>{
  const G=graph(),d=data(G),[a,b,c]=d.directions,v=d.variable;
  const q=G.add(G.mul(a,G.pow(v,2)),G.mul(b,v),G.mul(G.pow(a,2),c)),initial=[G.add(G.one,a,G.mul(a,b)),G.add(G.one,G.pow(a,3))];
  const id=G.definePulseThirdVariation({...d,matrix:[[G.zero,q],[G.zero,G.zero]],initial}),s=G.pulseThirdJetSystems[id],primitive=G.add(G.div(G.mul(a,G.pow(v,3)),G.q(3)),G.div(G.mul(b,G.pow(v,2)),G.q(2)),G.mul(G.pow(a,2),c,v));
  const exact=[G.add(initial[0],G.mul(initial[1],primitive)),initial[1]],right=G.add(G.q(1,2),G.div(G.pow(a,3),G.q(7)),G.div(G.mul(a,b),G.q(9))),at=x=>G.substitute(x,v,right);
  const finite=G.pulseThirdJetPartialSum(id,{terms:1});
  for(const block of s.blocks)for(let k=0;k<2;k++)assert.ok(equal(G,finite.values[block.offset+k],differentiate(G,exact[k],d.directions,block.orders)));
  let chain=G.derivative(G.derivative(G.derivative(G.pulseThirdJetValue(id,0,right,d.parameters),a),a),a);
  // Replace each exact solution-jet leaf by the independently known
  // nilpotent polynomial solution, after differentiating the moving endpoint.
  const leaves=G.nodes.map((n,i)=>({n,i})).filter(({n})=>n.op==='actual_pulse_third_jet_volterra'&&n.args[0]===id);
  for(const{n,i}of leaves){
    const[,component,time,values]=n.args,block=s.blocks[Math.floor(component/2)],body=differentiate(G,exact[component%2],d.directions,block.orders);
    chain=G.substitute(chain,i,G.simultaneousSubstitute(body,[v,...d.parameters],[time,...values]));
  }
  const expected=G.derivative(G.derivative(G.derivative(at(exact[0]),a),a),a);
  assert.ok(equal(G,chain,expected));
  const omitted=G.mul(at(G.derivative(exact[0],v)),G.derivative(G.derivative(G.derivative(right,a),a),a));
  assert.equal(equal(G,G.sub(chain,omitted),expected),false);
  assert.equal(equal(G,G.substitute(finite.values[G.thirdJetComponent(id,0,[3,0,0])],v,right),expected),false);
});

test('the alias preserves the original full covariance and all symmetric third slow orders',()=>{
  const G=graph(),d=data(G),cov=G.defineCovarianceVolterra({name:'original control',variable:d.variable,parameters:d.parameters,matrix:d.matrix,normUpper:G.q(100),length:d.length});
  const id=G.definePulseThirdVariation({...d,initial:[G.one,G.zero]});G.bindOriginalCovarianceThirdJet(cov,id);
  const w=G.covarianceValue(cov,0,d.variable,d.parameters),[a,b,c]=d.directions;
  assert.equal(G.pulseThirdJetValue(id,0,d.variable,d.parameters),w);
  const abc=G.derivative(G.derivative(G.derivative(w,a),b),c),cba=G.derivative(G.derivative(G.derivative(w,c),b),a);
  assert.equal(abc,cba);assert.equal(abc,G.pulseThirdJetValue(id,G.thirdJetComponent(id,0,[1,1,1]),d.variable,d.parameters));
  const copy=G.pulseThirdJetAliases;copy.set(cov,999);assert.equal(G.pulseThirdJetAliases.get(cov),id);
  assert.equal(G.derivative(abc,d.variable),G.pulseThirdJetRhs(id,G.thirdJetComponent(id,0,[1,1,1]),d.variable,d.parameters));
  assert.throws(()=>G.derivative(abc,a),{code:'UNSUPPORTED'});
});

test('missing geometry, moving initial endpoint, supplied derivative bodies and fourth orders fail',()=>{
  const G=graph(),d=data(G),id=G.definePulseThirdVariation(d),s=G.pulseThirdJetSystems[id],hidden=G.fresh('undeclared_third');
  for(const bad of[{...d,matrixThird:[]},{...d,matrixNorms:[]},{...d,matrix:[[hidden,G.zero],[G.zero,G.zero]]},{...d,initial:[d.variable,G.zero]},{...d,length:G.q(-1)}])assert.throws(()=>G.definePulseThirdVariation(bad),{code:'INVALID_INPUT'});
  assert.throws(()=>G.definePulseThirdVariation({...d,left:d.parameters[0]}),{code:'UNSUPPORTED'});
  assert.throws(()=>G.thirdJetComponent(id,0,[4,0,0]),{code:'UNSUPPORTED'});
  assert.throws(()=>G.pulseThirdJetPartialSum(id,{terms:33}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>thirdJetIndices(4),{code:'INVALID_INPUT'});assert.throws(()=>thirdJetBinomial([1,1,1],[2,0,0]),{code:'INVALID_INPUT'});
  assert.throws(()=>{s.augmentedMatrix[0][0]=G.zero;},TypeError);
});

test('cloned systems cannot copy private jet authority and changed original definitions are rejected',()=>{
  const G=graph(),d=data(G),cov=G.defineCovarianceVolterra({name:'original',variable:d.variable,parameters:d.parameters,matrix:d.matrix,normUpper:G.one,length:d.length}),id=G.definePulseThirdVariation({...d,initial:[G.one,G.zero]});
  const copy=new ActualPulseThirdJetExpressions(G);assert.throws(()=>copy.assertPulseThirdVariation(id),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const original=G.covarianceSystems[cov];G.covarianceSystems[cov]=structuredClone(original);
  assert.throws(()=>G.bindOriginalCovarianceThirdJet(cov,id),{code:'INVALID_SOURCE_CONSTRUCTION'});G.covarianceSystems[cov]=original;
  G.bindOriginalCovarianceThirdJet(cov,id);const old=G.pulseThirdJetSystems[id];G.pulseThirdJetSystems[id]=structuredClone(old);
  assert.throws(()=>G.assertPulseThirdVariation(id),{code:'INVALID_SOURCE_CONSTRUCTION'});G.pulseThirdJetSystems[id]=old;
  const p=G.pack({w:G.covarianceValue(cov,0,d.variable,d.parameters)},{pulseThirdJetKernel:{sourceAuthenticated:true}});
  assert.equal(p.pulseThirdJetKernel.sourceAuthenticated,false);assert.equal(p.pulseThirdJetKernel.derivativeOrder,3);
});

test('compact FTC shares retain every actual coefficient, v derivative and endpoint substitution',()=>{
  const G=graph(),d=data(G),plain=G.definePulseThirdVariation(d);G.thirdJetCompactFTC=true;
  const compact=G.definePulseThirdVariation({...d,name:'same original bodies, compact FTC substitutions'}),s=G.pulseThirdJetSystems[compact];
  assert.deepEqual(s.matrixJet,G.pulseThirdJetSystems[plain].matrixJet);assert.deepEqual(s.augmentedMatrix,G.pulseThirdJetSystems[plain].augmentedMatrix);
  for(let a=0;a<20;a++)for(let i=0;i<2;i++)for(let j=0;j<2;j++){
    const e=s.bounds.matrixNorms[a].entries[i][j];assert.equal(e.originalExpression,s.matrixJet.matrices[a][i][j]);assert.equal(e.originalTimeDerivative,G.derivative(e.originalExpression,d.variable));
    assert.equal(e.actualBodyBinding,true);assert.equal(e.actualTimeDerivativeBinding,true);assert.equal(e.sourceAuthenticated,false);assert.equal(e.numericalIntegralEvaluated,false);
    if(e.sharedDefinition!==null){
      const def=G.expressionSystems[e.sharedDefinition];assert.equal(def.body,e.originalExpression);assert.equal(def.unspecifiedOracle,false);
      assert.equal(G.materializeExpressionFunction(e.sharedDefinition,[G.zero,...d.parameters]),G.substitute(e.originalExpression,d.variable,G.zero));
      const orders=def.parameters.map((_,i)=>i===0?1:0);
      assert.equal(G.materializeExpressionFunction(e.sharedDefinition,[e.integrationVariable,...d.parameters],orders),G.substitute(e.originalTimeDerivative,d.variable,e.integrationVariable));
    }
  }
});

test('discarding operation memoizations preserves all source nodes, definitions and recomputed exact roots',()=>{
  const G=graph(),d=data(G),body=G.mul(G.exp(d.parameters[0]),G.pow(d.variable,3)),derivative=G.derivative(body,d.parameters[0]),system=G.defineExpressionFunction({name:'cache preservation body',parameters:[d.variable,...d.parameters],body});
  const materialized=G.materializeExpressionFunction(system,[d.variable,...d.parameters],[1,1,0,0]),before=JSON.stringify(G.nodes),definitions=G.captureFunctionDefinitions();
  const view=disposableThirdJetCacheCopy(G);assert.equal(view.derivatives.size,0);assert.ok(G.derivatives.size>0);assert.equal(view.lookup,G.lookup);assert.equal(view.nodes,G.nodes);
  const receipt=clearDisposableThirdJetCaches(G);assert.ok(receipt.rows.some(r=>r.entries>0));assert.equal(receipt.formulasChanged,false);assert.equal(G.derivatives.size,0);
  assert.equal(JSON.stringify(G.nodes),before);assert.equal(G.functionDefinitionsUnchanged(definitions),true);
  assert.equal(G.derivative(body,d.parameters[0]),derivative);assert.equal(G.materializeExpressionFunction(system,[d.variable,...d.parameters],[1,1,0,0]),materialized);assert.equal(JSON.stringify(G.nodes),before);
});
