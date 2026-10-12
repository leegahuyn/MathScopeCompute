import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {materializeActualAuxiliaryFunctionAtOwnCoordinates as own,
  materializeActualCommonTorusDerivative as indexed} from '../source-auxiliary-derivative-closure.mjs';

const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:100000}).pass;
const coordinateCount=G=>G.nodes.filter(n=>n.op==='coordinate').length;
function fixture(){
  const base=new ActualConvergentExpressions(),G=new AuxiliarySourceExpressions(base,{maximumOrder:16}),
    [R,Z,T,Y0,Y1,ell,r,z,t,xi,v,j]=['R','Z','T','Y0','Y1','ell','r','z','t','xi','v','j'].map(x=>G.fresh(x)),
    parameters=[R,Z,T,ell,Y0,Y1],directions=[R,Z,T,Y0,Y1],locals=[r,z,t,j,xi,v],
    body=G.add(G.mul(j,G.pow(r,2),G.pow(xi,4),G.pow(v,3)),G.mul(r,z,t,G.pow(v,5))),
    local=G.defineExpressionFunction({name:'full mixed polynomial source',parameters:locals,body}),
    rows=[-1,0,1].map(n=>({localSystem:local,
      values:[G.mul(G.q(2),R),G.mul(G.q(3),Z),G.mul(G.q(5),T),G.add(ell,G.q(n)),
        G.add(G.mul(G.q(3),Y0),Y1),G.add(Y0,G.mul(G.q(2),Y1))],coefficient:G.q(n+2),
      derivativeMaps:[[{parameter:0,coefficient:G.q(2)}],[{parameter:1,coefficient:G.q(3)}],[{parameter:2,coefficient:G.q(5)}],
        [{parameter:4,coefficient:G.q(3)},{parameter:5,coefficient:G.one}],
        [{parameter:4,coefficient:G.one},{parameter:5,coefficient:G.q(2)}]],label:{integer:n}})),
    field=G.definePeriodicIndexedField({name:'complete affine source control',parameters,directions,rows}),
    direct=G.add(...rows.map(row=>G.mul(row.coefficient,G.simultaneousSubstitute(body,locals,row.values))));
  return {base,G,R,Z,T,Y0,Y1,ell,parameters,directions,locals,body,local,rows,field,direct};
}
function unfold(G,id){
  const memo=new Map(),visit=x=>{
    if(memo.has(x))return memo.get(x);const {op,args}=G.nodes[x];let result=x;
    if(op==='m3_aux_expression_partial'){
      const s=G.expressionSystem(args[0]);result=visit(G.simultaneousSubstitute(own(G,args[0],args[2]),s.parameters,args[1]));
    }else if(op==='add')result=G.add(...args.map(visit));
    else if(op==='multiply')result=G.mul(...args.map(visit));
    else if(op==='integer_power')result=G.pow(visit(args[0]),args[1]);
    else if(op==='inverse')result=G.inv(visit(args[0]));
    else if(op==='smooth_piecewise')result=G.choose(...args.map(visit));
    memo.set(x,result);return result;
  };return visit(id);
}

test('own-coordinate mixed derivatives equal the actual defining derivative without alpha-renaming or changing frozen methods',()=>{
  const s=fixture(),{G}=s,methods=[G.materializeExpressionFunction,G.simultaneousSubstitute],definitions=G.captureFunctionDefinitions(),
    before=coordinateCount(G),orders=[1,0,0,0,2,3];let expected=s.body;
  orders.forEach((n,j)=>{for(let k=0;k<n;k++)expected=G.derivative(expected,s.locals[j]);});
  const actual=own(G,s.local,orders);
  assert.equal(actual,expected);assert.equal(coordinateCount(G),before);
  assert.equal(own(G,s.local,orders),actual);assert.deepEqual([G.materializeExpressionFunction,G.simultaneousSubstitute],methods);
  assert.equal(G.functionDefinitionsUnchanged(definitions),true);
  assert.equal(equal(G,actual,G.add(expected,G.one)),false);
});

test('the complete high mixed torus chain rule agrees with independently mapped polynomial differentiation and the captured calculus',()=>{
  const s=fixture(),{G}=s,orders=[1,0,0,2,2];let expected=s.direct;
  orders.forEach((n,j)=>{for(let k=0;k<n;k++)expected=G.derivative(expected,s.directions[j]);});
  const before=coordinateCount(G),result=indexed(G,s.field,orders);
  assert.equal(coordinateCount(G),before);assert.equal(result.terms.length,3);
  assert.ok(result.terms.every(row=>row.derivatives.length===5));
  assert.equal(equal(G,unfold(G,result.body),expected),true);
  const original=G.materializePeriodicIndexedField(s.field,orders);
  assert.equal(equal(G,unfold(G,result.body),unfold(G,original.body)),true);
  assert.deepEqual(result.localBodies.map(row=>row.orders),original.localBodies.map(row=>row.orders));
});

test('all source rows and both torus columns remain present with inactive guards before every derivative application',()=>{
  const s=fixture(),{G,R}=s,guarded=G.definePeriodicIndexedField({name:'guarded complete control',parameters:s.parameters,
    directions:s.directions,rows:s.rows.map(row=>({...row,guards:[[R,G.zero,G.one]]}))}),
    broken=G.definePeriodicIndexedField({name:'missing torus column negative control',parameters:s.parameters,directions:s.directions,
      rows:s.rows.map(row=>({...row,derivativeMaps:row.derivativeMaps.map((map,i)=>i===4?map.slice(0,1):map)}))}),
    orders=[0,0,0,1,2],result=indexed(G,guarded,orders),full=indexed(G,s.field,orders),wrong=indexed(G,broken,orders);
  assert.equal(result.allDeclaredRowsRetained,true);assert.equal(result.torusNearestCopyDifferentiated,false);
  assert.ok(result.localBodies.every(row=>row.actualBodyDifferentiatedBeforeMapping));
  for(const row of result.terms){
    assert.equal(G.nodes[row.value].op,'smooth_piecewise');assert.equal(G.substitute(row.value,R,G.q(-1)),G.zero);
    assert.equal(G.substitute(row.value,R,G.q(2)),G.zero);
  }
  assert.equal(equal(G,unfold(G,full.body),unfold(G,wrong.body)),false);
});

test('unsupported derivatives and unauthenticated facades fail instead of returning zero',()=>{
  const s=fixture(),{G}=s;
  assert.throws(()=>own(G,s.local,[0,0,0,0,17,0]),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>indexed(G,s.field,[0,0,0,17,0]),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>indexed({...G},s.field,[0,0,0,0,0]),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const original=s.base.defineExpressionFunction({name:'retained original positive system',parameters:s.locals,body:s.body,
    derivativeLimits:s.locals.map(()=>8)}),orders=[1,0,0,0,2,1];
  assert.equal(own(G,original,orders),s.base.materializeExpressionFunction(original,s.locals,orders));
});
