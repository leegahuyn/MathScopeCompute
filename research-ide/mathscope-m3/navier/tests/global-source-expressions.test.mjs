import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {GlobalSourceExpressions,downwardMultiIndices} from '../source-global-expressions.mjs';

const graph=()=>new GlobalSourceExpressions(new ActualConvergentExpressions(),{maxNodes:400000,maximumSlowOrder:8});
const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:160000}).pass;
const derivative=(G,body,directions,alpha)=>{for(let j=0;j<alpha.length;j++)for(let n=0;n<alpha[j];n++)body=G.derivative(body,directions[j]);return body;};
function data(G,{nilpotent=false}={}){
  const v=G.fresh('v'),a=G.fresh('a'),b=G.fresh('b'),c=G.fresh('c'),label=G.fresh('fixed_label'),parameters=[a,b,c,label],
    lower=G.add(G.mul(G.pow(a,3),v),G.mul(a,b,c),G.mul(G.pow(v,2),b)),
    matrix=nilpotent?[[G.zero,G.zero],[lower,G.zero]]:
      [[G.add(G.mul(a,v),b),G.add(G.pow(a,2),G.mul(v,c))],[lower,G.add(c,G.mul(a,b,v))]],
    covariance=G.defineCovarianceVolterra({name:'exact independent polynomial control',variable:v,parameters,matrix,normUpper:G.q(10000),length:G.one}),
    pulse=G.bindGlobalPulseDerivatives(covariance,{directions:[a,b,c]});
  return {v,a,b,c,label,parameters,directions:[a,b,c],matrix,covariance,pulse,lower};
}

test('sparse downward closure retains the exact mixed/repeated coefficients of a noncommuting ODE',()=>{
  const G=graph(),d=data(G),alpha=[2,1,0],jet=G.materializeGlobalPulseJet(d.pulse,alpha),
    M0=d.matrix.map(row=>row.map(x=>G.substitute(x,d.v,G.zero))),M1=d.matrix.map(row=>row.map(x=>G.substitute(x,d.v,G.one)));
  const product=(A,B)=>G.add(...A[0].map((x,j)=>G.mul(x,B[j][1])));
  assert.equal(equal(G,product(M0,M1),product(M1,M0)),false);
  assert.deepEqual(new Set(jet.multiIndices.map(a=>a.join(','))),new Set(['0,0,0','1,0,0','2,0,0','0,1,0','1,1,0','2,1,0']));
  assert.equal(jet.dimension,12);assert.equal(downwardMultiIndices([3,0,0]).length,4);
  const row=jet.rows.find(r=>r.orders.join(',')==='2,1,0'),block=row.blocks.find(b=>b.orders.join(',')==='1,1,0');
  assert.equal(block.scale,G.q(2));
  for(const coeff of jet.coefficients)for(let i=0;i<2;i++)for(let j=0;j<2;j++)
    assert.ok(equal(G,coeff.matrix[i][j],derivative(G,d.matrix[i][j],d.directions,coeff.orders)));
  assert.equal(jet.sourceAuthenticated,false);
});

test('independently differentiated ordered matrix products match the mixed jets through two full noncommuting terms',()=>{
  const G=graph(),d=data(G),alpha=[2,1,0];let term=[G.one,G.zero],sum=[...term];
  for(let n=0;n<=2;n++){
    const actual=G.globalPulsePartialSum(d.pulse,{orders:alpha,terms:n});
    for(let j=0;j<2;j++)assert.ok(equal(G,actual.values[j],derivative(G,sum[j],d.directions,alpha)),'term '+n+' component '+j);
    const tau=G.fresh('independent_ordered_time'),at=x=>G.substitute(x,d.v,tau);
    term=d.matrix.map(row=>G.integral(G.add(...row.map((m,j)=>G.mul(at(m),at(term[j])))),tau,G.zero,d.v));
    sum=sum.map((x,j)=>G.add(x,term[j]));
  }
});

test('fourth moving-time derivative equals an independent exact nilpotent solution, including every endpoint chain term',()=>{
  const G=graph(),d=data(G,{nilpotent:true}),primitive=G.add(G.div(G.mul(G.pow(d.a,3),G.pow(d.v,2)),G.q(2)),
    G.mul(d.a,d.b,d.c,d.v),G.div(G.mul(G.pow(d.v,3),d.b),G.q(3))),
    end=G.add(G.q(1,2),G.div(G.pow(d.a,2),G.q(13)),G.div(G.mul(d.a,d.b),G.q(17))),
    exact=G.substitute(primitive,d.v,end);
  let actual=G.covarianceValue(d.covariance,1,end,d.parameters);
  for(let n=0;n<4;n++)actual=G.derivative(actual,d.a);
  const leaves=G.nodes.map((node,id)=>({node,id})).filter(({node})=>node.op==='m3_global_pulse_jet'||node.op==='actual_covariance_volterra');
  for(const {node,id}of leaves){
    if(node.op==='actual_covariance_volterra'&&node.args[0]!==d.covariance)continue;
    const [,component,time,values]=node.args,alpha=node.op==='m3_global_pulse_jet'?node.args[4]:[0,0,0],
      body=derivative(G,component===0?G.one:primitive,d.directions,alpha);
    actual=G.substitute(actual,id,G.simultaneousSubstitute(body,[d.v,...d.parameters],[time,...values]));
  }
  assert.ok(equal(G,actual,derivative(G,exact,d.directions,[4,0,0])));
  const fixed=G.globalPulsePartialSum(d.pulse,{orders:[4,0,0],terms:1,time:end});
  assert.equal(equal(G,fixed.values[1],derivative(G,exact,d.directions,[4,0,0])),false);
});

test('every requested coefficient norm binds the actual time derivative and an exact factorial-tail producer',()=>{
  const G=graph(),d=data(G),jet=G.materializeGlobalPulseJet(d.pulse,[1,1,1]);
  for(const coefficient of jet.coefficients)for(const entry of coefficient.norm.entries.flat()){
    assert.equal(entry.originalTimeDerivative,G.derivative(entry.originalExpression,d.v));
    assert.equal(entry.actualBodyBinding,true);assert.equal(entry.actualTimeDerivativeBinding,true);
    assert.equal(G.freeCoordinates(entry.upper).has(d.v),false);
  }
  const sum=G.globalPulsePartialSum(d.pulse,{orders:[1,1,1],terms:1});
  assert.notEqual(sum.tail,G.zero);assert.equal(sum.tailTendsToZero,true);assert.equal(sum.finiteSumIsExactSolution,false);
  assert.equal(jet.fullSourceAllOrderClassBound,false);
});

test('frozen-label differentiation, supplied matrix jets, modified source ODE and copied custom authority fail',()=>{
  const G=graph(),d=data(G),w=G.covarianceValue(d.covariance,0,d.v,d.parameters);
  assert.throws(()=>G.bindGlobalPulseDerivatives(d.covariance,{directions:d.directions,matrixDerivatives:[]}),{code:'INVALID_INPUT'});
  assert.throws(()=>G.derivative(w,d.label),{code:'UNSUPPORTED'});
  assert.throws(()=>G.globalPulseJetValue(d.pulse,0,d.v,d.parameters,[9,0,0]),{code:'RESOURCE_LIMIT'});
  const old=G.covarianceSystems[d.covariance];G.covarianceSystems[d.covariance]={...old,matrix:[[G.one,G.zero],[G.zero,G.zero]]};
  try{assert.throws(()=>G.globalPulseSystem(d.pulse),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{G.covarianceSystems[d.covariance]=old;}
  const derivativeRoot=G.derivative(w,d.a),copy=new GlobalSourceExpressions(G,{maxNodes:400000});
  assert.throws(()=>copy.derivative(derivativeRoot,d.a),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('an exact indexed body keeps all rows and differentiates fixed local coordinates before any label selection',()=>{
  const G=graph(),R=G.fresh('R'),Z=G.fresh('Z'),T=G.fresh('T'),ell=G.fresh('ell'),r=G.fresh('r'),z=G.fresh('z'),t=G.fresh('t'),j=G.fresh('j'),
    body=G.add(G.mul(j,G.pow(r,3)),G.mul(r,z,t)),local=G.defineExpressionFunction({name:'polynomial local control',parameters:[r,z,t,j],body}),
    rows=[-1,0,1].map(n=>({localSystem:local,values:[G.mul(G.q(2),R),G.mul(G.q(3),Z),G.mul(G.q(5),T),G.add(ell,G.q(n))],
      localDirectionIndices:[0,1,2],coefficient:G.q(n+2),derivativeScales:[G.q(2),G.q(3),G.q(5)],label:n})),
    field=G.defineGlobalIndexedField({name:'generic complete finite cover',parameters:[R,Z,T,ell],directions:[R,Z,T],rows}),
    value=G.globalIndexedValue(field,[R,Z,T,ell]),actual=G.materializeGlobalIndexedField(field,[2,0,0]),
    direct=G.add(...rows.map(row=>G.mul(row.coefficient,G.simultaneousSubstitute(body,[r,z,t,j],row.values))));
  assert.equal(G.derivative(G.derivative(value,R),R),G.globalIndexedValue(field,[R,Z,T,ell],[2,0,0]));
  let materialized=actual.body;
  for(const term of actual.terms){const node=G.nodes[term.localValue];materialized=G.substitute(materialized,term.localValue,G.materializeExpressionFunction(...node.args));}
  assert.ok(equal(G,materialized,G.derivative(G.derivative(direct,R),R)));
  assert.equal(actual.terms.length,3);assert.equal(actual.localBodies.length,1);assert.equal(actual.labelsDifferentiated,false);
  assert.equal(G.globalIndexedSystem(field).sourceAuthenticated,false);
  assert.throws(()=>G.derivative(value,ell),{code:'UNSUPPORTED'});
  const omitted=G.sub(materialized,G.mul(G.q(2),G.q(4),G.q(6),ell,G.mul(G.q(2),R)));
  assert.equal(equal(G,omitted,materialized),false);
});

test('radial primitives retain the complete indexed operation and its exact FTC/moving-parameter derivative',()=>{
  const G=graph(),R=G.fresh('R'),Z=G.fresh('Z'),T=G.fresh('T'),ell=G.fresh('ell'),r=G.fresh('r'),z=G.fresh('z'),t=G.fresh('t'),
    body=G.mul(r,z),local=G.defineExpressionFunction({name:'primitive control',parameters:[r,z,t],body}),
    field=G.defineGlobalIndexedField({name:'entire radial body',parameters:[R,Z,T,ell],directions:[R,Z,T],rows:[
      {localSystem:local,values:[R,Z,T],localDirectionIndices:[0,1,2],coefficient:G.one,derivativeScales:[G.one,G.one,G.one],label:0}]}),
    v=G.globalIndexedValue(field,[R,Z,T,ell]),u=G.fresh('bound_radial_variable'),integrand=G.substitute(v,R,u),primitive=G.integral(integrand,u,G.one,R);
  assert.equal(G.nodes[integrand].op,'m3_global_indexed_partial');
  assert.ok(equal(G,G.derivative(primitive,R),v));
  const dz=G.derivative(primitive,Z),expected=G.integral(G.substitute(G.globalIndexedValue(field,[R,Z,T,ell],[0,1,0]),R,u),u,G.one,R);
  assert.ok(equal(G,dz,expected));
  assert.equal(G.nodes[primitive].args[2],G.one);assert.equal(G.nodes[primitive].args[3],R);
});

test('an inactive indexed candidate short-circuits before an undefined local body at every retained derivative',()=>{
  const G=graph(),R=G.fresh('R'),Z=G.fresh('Z'),T=G.fresh('T'),ell=G.fresh('ell'),r=G.fresh('r'),z=G.fresh('z'),t=G.fresh('t'),
    local=G.defineExpressionFunction({name:'strictly positive local domain',parameters:[r,z,t],body:G.log(r)}),
    field=G.defineGlobalIndexedField({name:'outer guard control',parameters:[R,Z,T,ell],directions:[R,Z,T],rows:[
      {localSystem:local,values:[R,Z,T],localDirectionIndices:[0,1,2],coefficient:G.one,derivativeScales:[G.one,G.one,G.one],
        guards:[[R,G.zero,G.one]],label:0}]});
  for(const orders of [[0,0,0],[1,0,0],[2,0,0]]){
    const materialized=G.materializeGlobalIndexedField(field,orders),term=materialized.terms[0],n=G.nodes[term.value];
    assert.equal(n.op,'smooth_piecewise');assert.equal(n.args[0],R);assert.equal(n.args[3],G.zero);assert.equal(n.args[5],G.zero);
    assert.equal(n.args[4],term.unguarded);assert.equal(term.guardLayers.length,1);
    // Exact selection of the inactive branch makes no call to log(-1),
    // the derivative local function or its inverse-power singularity.
    assert.equal(G.substitute(term.value,R,G.q(-1)),G.zero);
  }
});
