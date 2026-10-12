import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {AuxiliarySourceExpressions,assertAuxiliaryFacade} from '../source-auxiliary-expressions.mjs';

const equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:180000}).pass;
function sample(){
  const base=new ActualConvergentExpressions(),G=new AuxiliarySourceExpressions(base),q=(n,d=1)=>G.q(n,d),
    [R,Z,T,Y0,Y1,ell,r,z,t,xi,v,j]=['R','Z','T','Y0','Y1','ell','r','z','t','xi','v','j'].map(x=>G.fresh(x)),
    parameters=[R,Z,T,ell,Y0,Y1],directions=[R,Z,T,Y0,Y1],localParameters=[r,z,t,j,xi,v],
    body=G.add(G.mul(j,G.pow(r,2),xi,v),G.mul(r,z,t),G.mul(G.pow(xi,2),G.pow(v,3))),
    local=G.defineExpressionFunction({name:'actual polynomial control body',parameters:localParameters,body}),
    rows=[-1,0,1].map(n=>({localSystem:local,
      values:[G.mul(q(2),R),G.mul(q(3),Z),G.mul(q(5),T),G.add(ell,q(n)),G.add(G.mul(q(3),Y0),Y1),G.add(Y0,G.mul(q(2),Y1))],
      coefficient:q(n+2),derivativeMaps:[[{parameter:0,coefficient:q(2)}],[{parameter:1,coefficient:q(3)}],[{parameter:2,coefficient:q(5)}],
        [{parameter:4,coefficient:q(3)},{parameter:5,coefficient:G.one}],[{parameter:4,coefficient:G.one},{parameter:5,coefficient:q(2)}]],label:{integer:n}})),
    field=G.definePeriodicIndexedField({name:'whole polynomial torus-control cover',parameters,directions,rows}),
    value=G.periodicIndexedValue(field,parameters),direct=G.add(...rows.map(row=>G.mul(row.coefficient,G.simultaneousSubstitute(body,localParameters,row.values))));
  return {base,G,q,R,Z,T,Y0,Y1,ell,r,z,t,xi,v,j,parameters,directions,body,local,rows,field,value,direct};
}
function unfold(G,root){
  const cache=new Map();
  const visit=id=>{
    if(cache.has(id))return cache.get(id);const {op,args}=G.nodes[id];let out=id;
    if(op==='m3_aux_expression_partial')out=visit(G.materializeExpressionFunction(...args));
    else if(op==='m3_aux_indexed_partial'){
      const s=G.periodicIndexedSystem(args[0]),m=G.materializePeriodicIndexedField(args[0],args[2]);
      out=visit(G.simultaneousSubstitute(m.body,s.parameters,args[1]));
    }else if(op==='add')out=G.add(...args.map(visit));
    else if(op==='multiply')out=G.mul(...args.map(visit));
    else if(op==='inverse')out=G.inv(visit(args[0]));
    else if(op==='integer_power')out=G.pow(visit(args[0]),args[1]);
    else if(op==='definite_integral')out=G.integral(visit(args[0]),args[1],visit(args[2]),visit(args[3]));
    cache.set(id,out);return out;
  };return visit(root);
}

test('the same original graph is extended additively without transplanting its private function definitions',()=>{
  const base=new ActualConvergentExpressions(),before=JSON.stringify(base.nodes),count=base.nodes.length,definitions=base.captureFunctionDefinitions(),
    G=new AuxiliarySourceExpressions(base),x=G.fresh('x'),y=G.fresh('y'),body=G.mul(x,y),root=G.share(body,[x,y],'new actual body');
  assert.equal(G.nodes,base.nodes);assert.equal(G.baseGraph,base);assert.equal(assertAuxiliaryFacade(G,base),true);
  assert.equal(new AuxiliarySourceExpressions(base),G);assert.equal(new AuxiliarySourceExpressions(G),G);
  assert.equal(JSON.stringify(base.nodes.slice(0,count)),before);assert.equal(base.functionDefinitionsUnchanged(definitions),true);
  assert.equal(G.nodes[root].op,'m3_aux_expression_partial');assert.equal(G.materializeExpressionFunction(...G.nodes[root].args),body);
  assert.throws(()=>assertAuxiliaryFacade({...G},base),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('mixed slow and both auxiliary derivatives match independent differentiation after a nontrivial affine map',()=>{
  const s=sample(),{G,directions}=s,orders=[1,0,0,2,1];let direct=s.direct,value=s.value;
  orders.forEach((n,j)=>{for(let k=0;k<n;k++){direct=G.derivative(direct,directions[j]);value=G.derivative(value,directions[j]);}});
  assert.equal(value,G.periodicIndexedValue(s.field,s.parameters,orders));
  assert.equal(equal(G,unfold(G,value),direct),true);
  const m=G.materializePeriodicIndexedField(s.field,orders);
  assert.equal(m.terms.length,3);assert.equal(m.allDeclaredRowsRetained,true);assert.equal(m.labelsDifferentiated,false);
  assert.ok(m.terms.every(x=>x.derivatives.length===4));assert.equal(m.torusNearestCopyDifferentiated,false);
  assert.equal(equal(G,unfold(G,value),G.sub(direct,G.one)),false);
  assert.throws(()=>G.derivative(value,s.ell),{code:'UNSUPPORTED'});
});

test('the radial translated integral keeps both auxiliary chain terms and its moving endpoint',()=>{
  const s=sample(),{G,R,Y0,Y1}=s,r=G.fresh('integration_r'),phi=G.pow(R,3),shift=G.sub(G.substitute(phi,R,r),phi),
    translated=G.simultaneousSubstitute(s.value,[R,Y0,Y1],[r,G.add(Y0,shift),G.sub(Y1,shift)]),
    integral=G.integral(translated,r,G.one,R),d=G.derivative(integral,R),
    sourceDerivative=G.sub(G.derivative(s.value,Y0),G.derivative(s.value,Y1)),
    translatedDerivative=G.simultaneousSubstitute(sourceDerivative,[R,Y0,Y1],[r,G.add(Y0,shift),G.sub(Y1,shift)]),
    expected=G.sub(s.value,G.mul(G.derivative(phi,R),G.integral(translatedDerivative,r,G.one,R)));
  // Unfolding gives an independent exact polynomial integral, including
  // the parameter-dependent endpoint and both translated torus axes.
  assert.equal(equal(G,unfold(G,d),unfold(G,expected)),true);
  const omitted=G.sub(s.value,G.mul(G.derivative(phi,R),G.integral(G.simultaneousSubstitute(G.derivative(s.value,Y0),[R,Y0,Y1],
    [r,G.add(Y0,shift),G.sub(Y1,shift)]),r,G.one,R)));
  assert.equal(equal(G,unfold(G,d),unfold(G,omitted)),false);
});

test('all requested derivatives retain outer inactive-label guards before evaluating the local body',()=>{
  const s=sample(),{G,R}=s,field=G.definePeriodicIndexedField({name:'guarded source control',parameters:s.parameters,directions:s.directions,
    rows:s.rows.map(row=>({...row,guards:[[R,G.zero,G.one]]}))});
  for(const orders of [[0,0,0,0,0],[1,0,0,0,0],[0,0,0,1,2]]){
    const m=G.materializePeriodicIndexedField(field,orders);
    for(const row of m.terms){const n=G.nodes[row.value];assert.equal(n.op,'smooth_piecewise');assert.equal(n.args[3],G.zero);assert.equal(n.args[5],G.zero);
      assert.equal(G.substitute(row.value,R,G.q(-1)),G.zero);}
  }
  const singularInside=G.mul(s.value,G.inv(G.add(R,G.one))),guard=G.choose(R,G.zero,G.one,G.zero,singularInside,G.zero);
  assert.equal(G.substitute(guard,R,G.q(-1)),G.zero,'the unused inverse of zero must never be evaluated');
});

test('an auxiliary source integral substitution renames its bound coordinate without capturing the caller coordinate',()=>{
  const s=sample(),{G,R,Y0,Y1}=s,u=G.fresh('capture_control_u'),body=G.mul(s.value,u),
    integral=G.integral(body,u,G.zero,G.one),substituted=G.substitute(integral,Y0,u),node=G.nodes[substituted];
  assert.equal(node.op,'definite_integral');assert.notEqual(node.args[1],u);
  assert.equal(G.freeCoordinates(substituted).has(u),true);
  const expected=G.mul(G.q(1,2),G.substitute(s.value,Y0,u));
  assert.equal(equal(G,unfold(G,substituted),unfold(G,expected)),true);
  assert.equal(G.freeCoordinates(substituted).has(R),true);assert.equal(G.freeCoordinates(substituted).has(Y1),true);
});

test('exact inverse operation carries the whole body, commutes in requested derivatives and keeps the infinite limit distinct',()=>{
  const s=sample(),{G}=s,inverse=G.defineAuxiliaryInverse({name:'whole-source inverse control',body:s.value,Y:[s.Y0,s.Y1],parameters:s.parameters,directions:s.directions}),
    root=G.auxiliaryInverseValue(inverse,s.parameters),a=G.derivative(G.derivative(root,s.Z),s.Y0),b=G.derivative(G.derivative(root,s.Y0),s.Z),definition=G.auxiliaryInverseSystem(inverse);
  assert.equal(a,b);assert.equal(definition.body,s.value);assert.equal(definition.finiteSumDeclaredEqualToLimit,false);assert.equal(definition.sourceAuthenticated,false);
  assert.equal(G.freeCoordinates(root).has(s.Y1),true);assert.throws(()=>G.derivative(root,s.ell),{code:'UNSUPPORTED'});
  assert.throws(()=>G.auxiliaryInverseValue(inverse,s.parameters,[0,0,0,13,0]),{code:'RESOURCE_LIMIT'});
  const snapshot=G.captureFunctionDefinitions();assert.equal(G.functionDefinitionsUnchanged(snapshot),true);
  assert.equal(Object.isFrozen(definition),true);assert.throws(()=>{definition.body=G.zero;},TypeError);
});
