import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {GlobalSourceExpressions} from '../source-global-expressions.mjs';
import {AuxiliarySourceExpressions} from '../source-auxiliary-expressions.mjs';
import {exactMultiIndexComposition} from '../source-factored-composition.mjs';
import {exactMultiIndexLeibniz,createFactoredAuxiliaryMaterializer,materializeFactoredAuxiliarySourceClosure} from '../source-factored-auxiliary-closure.mjs';
import {integratePolynomialControl} from './exact-polynomial-integral-control.mjs';

const graph=()=>new AuxiliarySourceExpressions(new GlobalSourceExpressions(new ActualConvergentExpressions(),{maxNodes:250000}),{maximumOrder:16}),
  equal=(G,a,b)=>sourceGraphRationalIdentity(G,G.sub(a,b),{maxTerms:180000}).pass,
  native=(G,b,vars,alpha)=>{alpha.forEach((n,j)=>{for(let k=0;k<n;k++)b=G.derivative(b,vars[j]);});return b;};
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;},
  Q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert.notEqual(d,0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];},
  add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]),
  neg=a=>[-a[0],a[1]],inv=a=>Q(a[1],a[0]),pow=(a,n)=>n<0?pow(inv(a),-n):Q(a[0]**BigInt(n),a[1]**BigInt(n)),
  factorial=n=>{let q=1n;for(let j=2;j<=n;j++)q*=BigInt(j);return q;},
  choose=(n,k)=>{let q=Q(1);for(let j=0;j<k;j++)q=mul(q,Q(n-j,j+1));return q;};

// Independent truncated polynomial convolution. Its analytic coefficients
// are the defining Taylor series at0/1, not the production derivative rules.
function polynomials(limit){
  const plus=(a,b)=>{const out=new Map(a);for(const [k,c]of b){const q=add(out.get(k)??Q(0),c);if(q[0])out.set(k,q);else out.delete(k);}return out;},
    times=(a,b)=>{let out=new Map();for(const [ka,c]of a)for(const[kb,d]of b){const ea=ka.split(',').map(Number),eb=kb.split(',').map(Number),
      e=ea.map((n,j)=>n+eb[j]);if(e.every((n,j)=>n<=limit[j]))out=plus(out,new Map([[e.join(','),mul(c,d)]]));}return out;},
    scale=(a,c)=>new Map([...a].map(([k,v])=>[k,mul(v,c)]).filter(([_,v])=>v[0])),
    power=(a,n)=>{let b=new Map([['0,0',Q(1)]]);for(let j=0;j<n;j++)b=times(b,a);return b;},
    series=(h,coefficient)=>{let out=new Map(),term=new Map([['0,0',Q(1)]]);for(let k=0;k<=limit[0]+limit[1];k++){
      out=plus(out,scale(term,coefficient(k)));term=times(term,h);}return out;};
  return {plus,times,power,series};
}
function rationalValue(G,root,coordinates){
  const memo=new Map(),read=id=>{
    if(memo.has(id))return memo.get(id);const{op,args}=G.nodes[id];let out;
    if(op==='rational')out=Q(...args);
    else if(op==='coordinate'){assert.ok(coordinates.has(id),'every exact evaluation coordinate is assigned');out=coordinates.get(id);}
    else if(op==='add')out=args.map(read).reduce(add,Q(0));
    else if(op==='multiply')out=args.map(read).reduce(mul,Q(1));
    else if(op==='inverse')out=inv(read(args[0]));
    else if(op==='integer_power')out=pow(read(args[0]),args[1]);
    else if(op==='exp'||op==='sine'||op==='cosine'){
      assert.deepEqual(read(args[0]),Q(0),'this independent control evaluates analytic atoms only at exact0');
      out=Q(op==='sine'?0:1);
    }else if(op==='log_positive'||op==='sqrt_positive'){
      assert.deepEqual(read(args[0]),Q(1),'this independent control evaluates log/sqrt atoms only at exact1');
      out=Q(op==='log_positive'?0:1);
    }else assert.fail('unsupported independent rational control '+op);
    memo.set(id,out);return out;
  };return read(root);
}
const polynomialDerivative=(G,p,vars,alpha)=>G.add(...[...p].map(([k,c])=>{
  const e=k.split(',').map(Number);if(e.some((n,j)=>n<alpha[j]))return G.zero;
  for(let j=0;j<alpha.length;j++)for(let n=0;n<alpha[j];n++)c=mul(c,Q(e[j]-n));
  return G.mul(G.q(...c),...vars.map((v,j)=>G.pow(v,e[j]-alpha[j])));
}));

test('all mixed analytic composition derivatives match independent exact Taylor convolutions',()=>{
  const G=graph(),vars=['x','y'].map(n=>G.fresh(n)),[x,y]=vars,D=exactMultiIndexComposition(G),limit=[4,3],P=polynomials(limit),
    h=G.add(x,G.mul(G.q(2),y),G.mul(G.q(3),x,y),G.mul(G.q(2),G.pow(x,2)),G.neg(G.pow(y,2))),
    hp=new Map([['1,0',Q(1)],['0,1',Q(2)],['1,1',Q(3)],['2,0',Q(2)],['0,2',Q(-1)]]),u=G.add(G.one,h),
    families=[
      {body:G.exp(h),c:k=>Q(1,factorial(k))},
      {body:G.sine(h),c:k=>k%2?Q((-1n)**BigInt((k-1)/2),factorial(k)):Q(0)},
      {body:G.cosine(h),c:k=>k%2?Q(0):Q((-1n)**BigInt(k/2),factorial(k))},
      {body:G.inv(u),c:k=>Q((-1n)**BigInt(k))},
      {body:G.log(u),c:k=>k?Q((-1n)**BigInt(k-1),k):Q(0)},
      {body:G.sqrt(u),c:k=>{let q=Q(1);for(let j=0;j<k;j++)q=mul(q,Q(1-2*j,2*(j+1)));return q;}},
      {body:G.pow(u,5),c:k=>k<=5?choose(5,k):Q(0)}
    ];
  let comparisons=0;
  for(const row of families){const coefficients=P.series(hp,row.c);
    for(let a=0;a<=limit[0];a++)for(let b=0;b<=limit[1];b++){
      const expected=mul(coefficients.get(a+','+b)??Q(0),Q(factorial(a)*factorial(b))),actual=D.derivative(row.body,vars,[a,b]);
      assert.deepEqual(rationalValue(G,actual,new Map([[x,Q(0)],[y,Q(0)]])),expected,G.nodes[row.body].op+':'+[a,b]);comparisons++;
    }
  }
  assert.equal(comparisons,140);assert.ok(D.statistics.compositionSummands>0);assert.equal(D.sourceAuthenticated,false);
});

test('nonlinear complete shared-function pullbacks retain every argument and mixed source partial',()=>{
  const G=graph(),[x,y,u,v]=['x','y','u','v'].map(n=>G.fresh(n)),vars=[x,y],D=exactMultiIndexComposition(G),P=polynomials([12,12]),
    fp=G.add(G.mul(G.pow(u,3),G.pow(v,2)),G.mul(G.q(2),u,G.pow(v,4))),
    g=G.add(x,G.mul(x,y)),h=G.add(G.one,G.pow(y,2)),gp=new Map([['1,0',Q(1)],['1,1',Q(1)]]),hp=new Map([['0,0',Q(1)],['0,2',Q(1)]]),
    expected=P.plus(P.times(P.power(gp,3),P.power(hp,2)),P.times(new Map([['0,0',Q(2)]]),P.times(gp,P.power(hp,4))));
  for(const owner of [G.baseGraph,G]){
    const system=owner.defineExpressionFunction({name:'complete nonlinear argument control',parameters:[u,v],body:fp}),root=G.expressionValue(system,[g,h]);
    for(const alpha of [[0,0],[1,1],[2,2],[3,3],[4,1]]){
      const actual=integratePolynomialControl(G,D.derivative(root,vars,alpha));
      assert.equal(equal(G,actual,polynomialDerivative(G,expected,vars,alpha)),true,owner===G?'auxiliary':'original');
    }
  }
  assert.equal(D.everyFunctionArgumentRetained,true);
});

test('positive polynomial powers retain exact derivatives at zero without a new inverse premise',()=>{
  const G=graph(),[x,y]=['x','y'].map(n=>G.fresh(n)),vars=[x,y],D=exactMultiIndexComposition(G),root=G.pow(G.add(x,G.pow(y,2)),3),
    before=G.nodes.length,answer=D.derivative(root,vars,[1,4]);
  assert.equal(equal(G,answer,G.q(72)),true);
  assert.ok(G.nodes.slice(before).every(n=>n.op!=='inverse'));
  assert.equal(equal(G,D.derivative(root,vars,[4,0]),G.zero),true);
  assert.equal(D.positivePolynomialPowersRequireNoNonzeroPremise,true);
});

test('original smooth step joins and both moving integral endpoints retain the complete exact rules',()=>{
  const G=graph(),[x,y,t]=['x','y','t'].map(n=>G.fresh(n)),vars=[x,y],D=exactMultiIndexComposition(G),
    step=G.step(G.add(G.mul(x,y),G.pow(y,2)),1),
    integral=G.integral(G.add(G.pow(t,2),G.mul(x,y)),t,G.mul(x,y),G.add(x,G.pow(y,2))),
    closed=G.add(G.mul(G.q(1,3),G.sub(G.pow(G.add(x,G.pow(y,2)),3),G.pow(G.mul(x,y),3))),
      G.mul(x,y,G.sub(G.add(x,G.pow(y,2)),G.mul(x,y)))),
    fixed=G.integral(G.mul(G.pow(x,3),G.pow(y,2),G.pow(t,2)),t,G.zero,G.one);
  for(const alpha of [[2,0],[1,1],[2,1]])assert.equal(equal(G,D.derivative(step,vars,alpha),native(G,step,vars,alpha)),true);
  assert.equal(equal(G,D.derivative(integral,vars,[2,2]),native(G,closed,vars,[2,2])),true);
  assert.equal(equal(G,integratePolynomialControl(G,D.derivative(fixed,vars,[2,1])),G.mul(G.q(4),x,y)),true);
  assert.equal(D.derivative(G.integral(G.pow(x,2),x,G.zero,G.one),vars,[1,0]),G.zero,'bound-coordinate shadowing is retained');
  const branches=G.choose(x,G.zero,G.one,G.zero,G.pow(G.add(x,y),4),G.zero),derived=D.derivative(branches,vars,[2,1]);
  assert.equal(G.nodes[derived].op,'smooth_piecewise');assert.deepEqual(G.nodes[derived].args.slice(0,3),[x,G.zero,G.one]);
  assert.equal(equal(G,G.nodes[derived].args[4],G.mul(G.q(24),G.add(x,y))),true);
});

test('retained source derivatives and all definitions survive scratch release with unchanged exact results',()=>{
  const G=graph(),vars=['x','y'].map(n=>G.fresh(n)),[x,y]=vars,body=G.exp(G.mul(x,y)),D=exactMultiIndexComposition(G),
    old=native(G,body,vars,[1,1]);D.retain(body,vars,[1,1],old);
  const count=G.nodes.length,definitions=G.captureFunctionDefinitions(),methods=[G.derivative,G.materializeExpressionFunction];
  assert.equal(D.derivative(body,vars,[1,1]),old);assert.equal(G.nodes.length,count);
  const more=D.derivative(body,vars,[3,2]);D.retain(body,vars,[3,2],more);const nodes=JSON.stringify(G.nodes),release=D.releaseScratch();
  assert.ok(release.releasedScratchEntries>0);assert.equal(D.derivative(body,vars,[3,2]),more);
  assert.equal(JSON.stringify(G.nodes),nodes);assert.equal(G.functionDefinitionsUnchanged(definitions),true);
  assert.deepEqual([G.derivative,G.materializeExpressionFunction],methods);
  assert.equal(equal(G,D.derivative(body,vars,[2,2]),native(G,body,vars,[2,2])),true);
});

test('shared mixed composition reduces the exact graph of a fixed high mixed derivative',()=>{
  const run=factory=>{
    const G=graph(),vars=['x','y'].map(n=>G.fresh(n)),[x,y]=vars,h=G.add(x,G.mul(x,y),G.pow(y,2)),
      body=G.mul(G.exp(h),G.inv(G.add(G.one,h))),start=G.nodes.length,D=factory(G),root=D.derivative(body,vars,[4,3]);
    return {nodes:G.nodes.length-start,value:rationalValue(G,root,new Map([[x,Q(0)],[y,Q(0)]])),statistics:D.statistics};
  },old=run(exactMultiIndexLeibniz),next=run(exactMultiIndexComposition);
  assert.deepEqual(next.value,old.value);assert.notEqual(next.value[0],0n);
  assert.ok(next.nodes<old.nodes,JSON.stringify({old:old.nodes,next:next.nodes}));
  console.log('# FACTORED_COMPOSITION '+JSON.stringify({oldNodes:old.nodes,newNodes:next.nodes,
    exactValue:next.value.map(String),allDerivativesRetained:true,sourceAuthenticated:false}));
});

test('the additive composition mode closes every original shared body behind complete indexed source rows',()=>{
  const G=graph(),[x,y,ell,r,v,u,w]=['x','y','ell','r','v','u','w'].map(n=>G.fresh(n)),
    original=G.baseGraph.defineExpressionFunction({name:'retained original mixed source',parameters:[u,w],
      body:G.add(G.pow(u,3),G.mul(u,G.pow(w,2)))}),
    source=G.mul(G.exp(G.mul(r,v)),G.expressionValue(original,[G.add(r,G.pow(v,2)),G.mul(r,v)])),
    local=G.defineExpressionFunction({name:'actual shared composition control',parameters:[r,v],body:source}),
    rows=[1,2,3].map(n=>({localSystem:local,values:[G.mul(G.q(n),x),G.add(y,ell)],
      derivativeMaps:[[{parameter:0,coefficient:G.q(n)}],[{parameter:1,coefficient:G.one}]],
      coefficient:G.one,guards:[[ell,G.q(-1),G.one]],label:{sourceCopy:n}})),
    field=G.definePeriodicIndexedField({name:'all original source rows',parameters:[x,y,ell],directions:[x,y],rows}),
    M=createFactoredAuxiliaryMaterializer(G,{compositionSharing:true,retainExpandedRows:false}),
    root=G.periodicIndexedValue(field,[x,y,ell],[2,1]),closure=materializeFactoredAuxiliarySourceClosure(M,[root],{cacheCheckpointEvery:1});
  assert.equal(closure.allRequestedSharedBodiesMaterialized,true);assert.equal(closure.baseClosure.allRequestedSharedBodiesMaterialized,true);
  assert.equal(closure.indexedPartials[0].rows,3);assert.ok(closure.baseClosure.partials.some(p=>p.system===original&&p.orders.some(n=>n>0)));
  assert.equal(closure.exactLeibnizProgram.exactMixedCompositionSharing,true);assert.equal(closure.sourceAuthenticated,false);
  const actual=integratePolynomialControl(G,M.own(local,[2,1])),expected=integratePolynomialControl(G,native(G,source,[r,v],[2,1]));
  assert.equal(equal(G,actual,expected),true);assert.ok(M.cacheReleases.length>0);
});

test('derivative and source-operation resource errors propagate instead of silently assigning zero',()=>{
  const G=graph(),x=G.fresh('x'),D=exactMultiIndexComposition(G,{maximumOrder:8});
  assert.throws(()=>D.derivative(x,[x],[9]),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>D.derivative(x,[x,x],[1,1]),{code:'RESOURCE_LIMIT'});
  const unknown=G.node('source_unknown_derivative',[x]);assert.throws(()=>D.derivative(unknown,[x],[1]));
  assert.equal(D.omittedDerivativesSetToZero,false);assert.equal(D.sourceGraphMethodsChanged,false);
});
