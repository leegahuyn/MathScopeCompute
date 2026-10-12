import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {GlobalSourceExpressions,materializeGlobalSourceClosure} from '../source-global-expressions.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {exactMultiIndexLeibniz,createFactoredAuxiliaryMaterializer,materializeFactoredAuxiliarySourceClosure,
  declareInitializedMeanMaterializationBudget} from '../source-factored-auxiliary-closure.mjs';

const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:180000}).pass;
const native=(G,body,vars,alpha)=>{for(let j=0;j<alpha.length;j++)for(let k=0;k<alpha[j];k++)body=G.derivative(body,vars[j]);return body;};
const graph=()=>new AuxiliarySourceExpressions(new GlobalSourceExpressions(new ActualConvergentExpressions(),{maxNodes:400000}),{maximumOrder:16});
const add=(a,b)=>{const c=new Map(a);for(const [p,v]of b)c.set(p,(c.get(p)??0n)+v);return c;};
const multiply=(a,b)=>{let out=new Map();for(const [p,c]of a)for(const [q,d]of b){
  const powers=p.split(',').map((n,j)=>Number(n)+Number(q.split(',')[j])).join(',');out=add(out,new Map([[powers,c*d]]));}return out;};
const power=(a,n)=>{let b=new Map([['0,0,0',1n]]);for(let j=0;j<n;j++)b=multiply(b,a);return b;};
function fromPolynomial(G,p,vars,alpha=[0,0,0]){
  const terms=[];for(const [powers,c]of p){const a=powers.split(',').map(Number);if(a.some((n,j)=>n<alpha[j]))continue;
    let factor=c;for(let j=0;j<3;j++)for(let k=0;k<alpha[j];k++)factor*=BigInt(a[j]-k);
    terms.push(G.mul(G.q(factor),...vars.map((v,j)=>G.pow(v,a[j]-alpha[j]))));
  }return G.add(...terms);
}

test('complete multi-index Leibniz derivatives agree with independently convolved polynomial coefficients',()=>{
  const G=graph(),vars=['x','y','z'].map(n=>G.fresh(n)),[x,y,z]=vars,D=exactMultiIndexLeibniz(G),
    a=new Map([['1,0,0',1n],['0,1,0',2n],['0,0,0',1n]]),b=new Map([['1,1,0',1n],['0,0,1',3n],['0,0,0',2n]]),
    polynomial=multiply(power(a,4),power(b,3)),body=G.mul(G.pow(G.add(x,G.mul(G.q(2),y),G.one),4),G.pow(G.add(G.mul(x,y),G.mul(G.q(3),z),G.q(2)),3));
  for(const alpha of [[0,0,0],[1,0,0],[0,1,0],[2,1,0],[1,2,1],[3,2,0],[2,2,2],[4,3,1],[8,0,0]])
    assert.equal(equal(G,D.derivative(body,vars,alpha),fromPolynomial(G,polynomial,vars,alpha)),true,alpha.join(','));
  const mixed=D.derivative(G.mul(G.pow(x,2),G.pow(x,3)),vars,[2,0,0]);
  assert.equal(equal(G,mixed,G.mul(G.q(20),G.pow(x,3))),true);
  assert.equal(equal(G,mixed,G.mul(G.q(8),G.pow(x,3))),false,'both cross binomial terms are essential');
  assert.ok(D.statistics.productSummands>0);assert.equal(D.sourceAuthenticated,false);
});

test('rational and analytic operations keep the retained exact first-derivative rules and complete mixed chains',()=>{
  const G=graph(),vars=['x','y'].map(n=>G.fresh(n)),[x,y]=vars,D=exactMultiIndexLeibniz(G),
    inner=G.add(G.one,G.mul(x,y),G.pow(y,2)),bodies=[G.inv(inner),G.exp(inner),G.sine(inner),G.cosine(inner),G.log(inner),G.sqrt(inner)];
  for(const body of bodies)for(const alpha of [[2,0],[1,1],[2,1]])
    assert.equal(equal(G,D.derivative(body,vars,alpha),native(G,body,vars,alpha)),true,G.nodes[body].op+':'+alpha);
  const t=G.fresh('integration_variable'),integral=G.integral(G.add(G.pow(t,2),G.mul(x,y)),t,G.mul(x,y),G.add(x,G.pow(y,2))),
    expected=G.add(G.mul(G.q(1,3),G.sub(G.pow(G.add(x,G.pow(y,2)),3),G.pow(G.mul(x,y),3))),
      G.mul(x,y,G.sub(G.add(x,G.pow(y,2)),G.mul(x,y))));
  // This polynomial has a nonzero contribution from BOTH moving endpoints.
  const integralBody=D.derivative(integral,vars,[2,2]),exactBody=D.derivative(expected,vars,[2,2]);
  assert.equal(equal(G,integralBody,exactBody),true);
  assert.equal(D.sourceGraphMethodsChanged,false);assert.equal(D.omittedDerivativesSetToZero,false);
});

test('all indexed rows, both affine torus columns and fixed guards survive exact local Leibniz sharing',()=>{
  const G=graph(),[R,Y0,Y1,ell,r,xi,v,j]=['R','Y0','Y1','ell','r','xi','v','j'].map(n=>G.fresh(n)),
    params=[R,ell,Y0,Y1],dirs=[R,Y0,Y1],locals=[r,xi,v,j],body=G.mul(j,G.pow(r,2),G.pow(G.add(xi,G.mul(G.q(2),v)),5)),
    local=G.defineExpressionFunction({name:'unchanged compact polynomial source',parameters:locals,body}),
    rows=[-1,0,1].map(n=>({localSystem:local,values:[G.mul(G.q(2),R),G.add(G.mul(G.q(3),Y0),Y1),G.add(Y0,G.mul(G.q(2),Y1)),G.add(ell,G.q(n))],
      derivativeMaps:[[{parameter:0,coefficient:G.q(2)}],[{parameter:1,coefficient:G.q(3)},{parameter:2,coefficient:G.one}],
        [{parameter:1,coefficient:G.one},{parameter:2,coefficient:G.q(2)}]],coefficient:G.q(n+2),guards:[[R,G.zero,G.q(5)]],label:{fixedInteger:n}})),
    field=G.definePeriodicIndexedField({name:'all source labels',parameters:params,directions:dirs,rows}),M=createFactoredAuxiliaryMaterializer(G),alpha=[1,2,1],program=M.indexed(field,alpha),
    assembled=G.add(...program.terms.map(row=>G.mul(row.coefficient,G.add(...row.derivatives.map(d=>G.mul(d.coefficient,
      G.simultaneousSubstitute(M.own(row.localSystem,d.orders),locals,row.values))))))),
    direct=G.add(...rows.map(row=>G.mul(row.coefficient,G.simultaneousSubstitute(body,locals,row.values))));
  assert.equal(equal(G,assembled,native(G,direct,dirs,alpha)),true);assert.equal(program.terms.length,3);
  assert.deepEqual(program.compactProgram.groups.flatMap(x=>x.sourceRows).sort(),[0,1,2]);
  assert.ok(program.terms.every(row=>row.guards.length===1));assert.ok(program.localBodies.every(row=>row.actualBodyDifferentiatedBeforeMapping));
  assert.equal(program.allDeclaredRowsRetained,true);assert.equal(program.sourceAuthenticated,false);
});

test('completed inherited own-coordinate derivatives are reused without modifying old methods or definitions',()=>{
  const G=graph(),[x,y]=['x','y'].map(n=>G.fresh(n)),body=G.mul(G.pow(x,4),G.pow(y,3)),
    system=G.defineExpressionFunction({name:'retained exact source body',parameters:[x,y],body}),orders=[2,1],
    old=G.materializeExpressionFunction(system,[x,y],orders),retained={allRequestedSharedBodiesMaterialized:true,
      expressions:[{system,orders,parameters:[x,y],body:old}],indexedPartials:[]},
    methods=[G.derivative,G.materializeExpressionFunction],definitions=G.captureFunctionDefinitions(),count=G.nodes.length,
    M=createFactoredAuxiliaryMaterializer(G,{retainedClosures:[retained]});
  assert.equal(M.own(system,orders),old);assert.equal(G.nodes.length,count);assert.deepEqual([G.derivative,G.materializeExpressionFunction],methods);
  assert.equal(G.functionDefinitionsUnchanged(definitions),true);assert.equal(M.retainedClosureCount,1);
  assert.equal(equal(G,M.own(system,[3,2]),native(G,body,[x,y],[3,2])),true);
  assert.throws(()=>createFactoredAuxiliaryMaterializer(G,{retainedClosures:[{...retained,allRequestedSharedBodiesMaterialized:false}]}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('complete factored closure retains original zero and nonzero variational pulse blocks and source integrals',()=>{
  const G=graph(),B=G.baseGraph,[R,Z,T,v,Y0,Y1]=['R','Z','T','v','Y0','Y1'].map(n=>G.fresh(n)),
    matrix=[[R,G.mul(v,Z)],[G.mul(R,T),G.add(Z,v)]],covariance=B.defineCovarianceVolterra({name:'original pulse control',variable:v,
      parameters:[R,Z,T],matrix,normUpper:G.q(10000),length:G.one}),pulse=B.bindGlobalPulseDerivatives(covariance,{directions:[R,Z,T]}),
    value=B.covarianceValue(covariance,1,v,[R,Z,T]),source=G.mul(G.pow(Y0,4),G.pow(Y1,3),value),
    system=G.defineExpressionFunction({name:'whole retained pulse source',parameters:[R,Z,T,v,Y0,Y1],body:source}),
    old=materializeGlobalSourceClosure(B,[value]),M=createFactoredAuxiliaryMaterializer(G,{retainedClosures:[old]}),
    root=G.expressionValue(system,[R,Z,T,v,Y0,Y1],[1,1,0,0,2,1]),closure=materializeFactoredAuxiliarySourceClosure(M,[value,root]);
  assert.ok(closure.baseClosure.pulseBlocks.some(b=>b.pulse===pulse&&b.orders.join(',')==='0,0,0'));
  assert.ok(closure.baseClosure.pulseBlocks.some(b=>b.pulse===pulse&&b.orders.join(',')==='1,1,0'));
  assert.ok(closure.baseClosure.pulseBlocks.every(b=>b.allCoefficientAndTimeDerivativeBodiesGenerated));
  assert.equal(closure.allRequestedSharedBodiesMaterialized,true);assert.equal(closure.sourceAuthenticated,false);
  assert.equal(closure.baseClosure.finiteApproximationReplacesExactLimit,false);
});

test('separate initialized-audit resource ceilings are explicit and unsupported derivatives never become zero',()=>{
  const G=graph(),x=G.fresh('x'),D=exactMultiIndexLeibniz(G,{maximumOrder:8}),before=JSON.stringify(G.nodes),definitions=G.captureFunctionDefinitions();
  G.baseGraph.maxNodes=5000000;const budget=declareInitializedMeanMaterializationBudget(G,6500000);
  assert.equal(budget.previousMaximumNodes,5000000);assert.equal(budget.maximumTotalNodes,6500000);assert.equal(JSON.stringify(G.nodes),before);
  assert.equal(G.functionDefinitionsUnchanged(definitions),true);assert.equal(budget.mathematicalSourceChanged,false);
  assert.throws(()=>declareInitializedMeanMaterializationBudget(G,6500001),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>D.derivative(x,[x],[9]),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>D.derivative(x,[x,x],[1,0]),{code:'RESOURCE_LIMIT'});
  const unsupported=G.node('source_unknown_derivative',[x]);assert.throws(()=>D.derivative(unsupported,[x],[1]));
});
