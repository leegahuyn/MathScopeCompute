import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {ForcedPulseExpressions,assertForcedPulseFacade,forcedAngularInverse,assertForcedAngularInverse,
  forcedAngularCutoff,forcedAngularHarmonics,materializeForcedPulseClosure} from '../source-forced-pulse.mjs';
import {originalForcedPulsePath} from '../source-forced-pulse.mjs';

const graph=()=>new ForcedPulseExpressions(new ActualConvergentExpressions()),
  qcomplex=(G,real=G.zero,imaginary=G.zero)=>({real,imaginary}),parts=['real','imaginary'],
  eq=(G,a,b,atoms=[])=>sourceGraphRationalIdentity(G,G.sub(a,b),{atomicNodes:atoms,maxTerms:160000}).pass,
  derivative=(G,x,coordinates,orders)=>{for(let j=0;j<orders.length;j++)for(let n=0;n<orders[j];n++)x=G.derivative(x,coordinates[j]);return x;};
function moving(){
  const G=graph(),v=G.fresh('pulse_v'),a=G.fresh('slow_a'),b=G.fresh('slow_b'),ell=G.fresh('frozen_label'),
    n=[G.add(a,v),G.one,G.add(G.q(2),G.mul(b,v))],
    K=[[G.zero,G.q(-2),G.zero],[G.add(G.q(3),a),G.zero,G.zero],[G.add(G.one,b),G.zero,G.zero]],
    forcing=[qcomplex(G,G.add(a,G.pow(v,2)),G.add(G.one,b)),qcomplex(G,G.mul(a,v),G.sub(v,b)),qcomplex(G,G.add(G.q(-1),b),G.pow(v,2))],
    input={variable:v,parameters:[a,b,ell],directions:[a,b],length:G.one,n,K,k:G.q(3),epsilon:G.q(1,10),forcing,m:2};
  return {G,v,a,b,ell,input};
}
function nilpotent(){
  const G=graph(),v=G.fresh('pulse_v'),a=G.fresh('slow_a'),b=G.fresh('slow_b'),c=G.fresh('slow_c'),ell=G.fresh('fixed_label'),
    matrix=[[G.zero,G.mul(a,v),G.zero],[G.zero,G.zero,b],[G.zero,G.zero,G.zero]],
    forcing=[qcomplex(G,G.mul(c,v),G.mul(a,G.pow(v,2))),qcomplex(G,G.mul(G.pow(a,2),v),c),qcomplex(G,c,G.mul(b,v))],
    parameters=[a,b,c,ell],directions=[a,b,c],
    system=G.defineForcedPulse({name:'independent noncommuting polynomial control',variable:v,parameters,directions,length:G.one,matrix,forcing}),
    exact=[
      qcomplex(G,G.add(G.mul(G.q(1,2),c,G.pow(v,2)),G.mul(G.q(1,8),G.pow(a,3),G.pow(v,4)),G.mul(G.q(1,8),a,b,c,G.pow(v,4))),
        G.add(G.mul(G.q(1,3),a,G.pow(v,3)),G.mul(G.q(1,3),a,c,G.pow(v,3)),G.mul(G.q(1,30),a,G.pow(b,2),G.pow(v,5)))),
      qcomplex(G,G.add(G.mul(G.q(1,2),G.pow(a,2),G.pow(v,2)),G.mul(G.q(1,2),b,c,G.pow(v,2))),
        G.add(G.mul(c,v),G.mul(G.q(1,6),G.pow(b,2),G.pow(v,3)))),
      qcomplex(G,G.mul(c,v),G.mul(G.q(1,2),b,G.pow(v,2)))
    ];
  return {G,v,a,b,c,ell,matrix,forcing,parameters,directions,system,exact};
}
function substituteExact(G,root,s){
  const cache=new Map();
  const visit=id=>{
    if(cache.has(id))return cache.get(id);const {op,args}=G.nodes[id];let out=id;
    if(op==='m3_forced_pulse_partial'){
      assert.equal(args[0],s.system);const [,part,component,time,values,orders]=args;
      out=G.simultaneousSubstitute(derivative(G,s.exact[component][part],s.directions,orders),[s.v,...s.parameters],[time,...values]);
    }else if(op==='add')out=G.add(...args.map(visit));
    else if(op==='multiply')out=G.mul(...args.map(visit));
    else if(op==='integer_power')out=G.pow(visit(args[0]),args[1]);
    else if(op==='inverse')out=G.inv(visit(args[0]));
    else if(op==='definite_integral')out=G.integral(visit(args[0]),args[1],visit(args[2]),visit(args[3]));
    cache.set(id,out);return out;
  };return visit(root);
}

test('full moving normal, unprojected normal forcing, harmonic damping and complex pressure cancel exactly',()=>{
  const s=moving(),r=forcedAngularInverse(s.G,s.input);
  assert.equal(r.identities.checks.length,14);assert.ok(r.identities.checks.every(x=>x.pass));
  assert.deepEqual(r.normal.derivative,s.input.n.map(x=>s.G.derivative(x,s.v)));
  assert.equal(r.scope.sourceAuthenticated,false);assert.equal(r.scope.exactZeroDataForcedSolutionDefined,true);
  assert.equal(r.scope.nonzeroFullFinalN6FieldConstructed,false);
  assert.equal(r.scope.commonAllBandEnvelopeBoundCertified,false);
  assert.ok(r.limit.allActualMatrixSourceAndTimeDerivativeBodiesGenerated);
  assert.equal(assertForcedAngularInverse(r),true);
  if(process.env.MATHSCOPE_FORCED_PULSE_ALGEBRA_ARTIFACT)writeFileSync(process.env.MATHSCOPE_FORCED_PULSE_ALGEBRA_ARTIFACT,
    JSON.stringify({schema:'MathScope.N6.ForcedPulseIndependentAlgebraControl/1',coordinates:{v:s.v,a:s.a,b:s.b,ell:s.ell},
      input:r.input,normal:r.normal,K:r.K,k:r.k,epsilon:r.epsilon,damping:r.damping,Aphi:r.Aphi,matrix:r.matrix,
      source:r.source,projectedSource:r.projectedSource,velocity:r.velocity,pressure:r.pressure,rhs:r.rhs,identities:r.identities,
      sourceAuthenticated:false,nodes:s.G.nodes},null,2)+'\n');
});

test('a pure normal source gives zero forced velocity and nonzero algebraic pressure; projection alone is insufficient',()=>{
  const G=graph(),v=G.fresh('v'),a=G.fresh('a'),n=[G.zero,G.one,G.zero],
    forcing=[qcomplex(G),qcomplex(G,G.add(a,v),G.one),qcomplex(G)],
    r=forcedAngularInverse(G,{variable:v,parameters:[a],directions:[a],length:G.one,n,K:Array.from({length:3},()=>[G.zero,G.zero,G.zero]),
      k:G.q(2),epsilon:G.q(1,5),forcing,m:3});
  assert.ok(r.velocity.every(z=>parts.every(p=>z[p]===G.zero)));
  assert.equal(eq(G,r.pressure.real,G.q(-1,6)),true);
  assert.equal(eq(G,r.pressure.imaginary,G.div(G.add(a,v),G.q(6))),true);
  assert.notEqual(r.pressure.imaginary,G.zero);assert.equal(r.pressureNumerator.real,forcing[1].real);
});

test('noncommuting ordered source integrals reproduce an independently derived nilpotent solution exactly',()=>{
  const s=nilpotent(),{G}=s,M0=s.matrix.map(row=>row.map(x=>G.substitute(x,s.v,G.zero))),M1=s.matrix.map(row=>row.map(x=>G.substitute(x,s.v,G.one))),
    product=(A,B)=>G.add(...A[0].map((x,j)=>G.mul(x,B[j][2])));
  assert.equal(eq(G,product(M0,M1),product(M1,M0)),false);
  const partial=G.forcedPulsePartialSum(s.system,{terms:3});
  for(let j=0;j<3;j++)for(const part of parts){
    assert.ok(eq(G,partial.velocity[j][part],s.exact[j][part]),'component '+j+' '+part);
    const rhs=G.add(...s.matrix[j].map((x,k)=>G.mul(x,s.exact[k][part])),s.forcing[j][part]);
    assert.ok(eq(G,G.derivative(s.exact[j][part],s.v),rhs));
    assert.ok(eq(G,G.substitute(s.exact[j][part],s.v,G.zero),G.zero));
  }
  assert.equal(partial.finiteSumIsExactSolution,false,'generic limit is never replaced by this special nilpotent control');
  assert.notEqual(partial.tail,G.zero);assert.equal(partial.matrixProductsKeptInTimeOrder,true);
  if(process.env.MATHSCOPE_FORCED_PULSE_POLYNOMIAL_ARTIFACT)writeFileSync(process.env.MATHSCOPE_FORCED_PULSE_POLYNOMIAL_ARTIFACT,
    JSON.stringify({schema:'MathScope.N6.ForcedPulseIndependentPolynomialControl/1',coordinates:{v:s.v,a:s.a,b:s.b,c:s.c,ell:s.ell},
      matrix:s.matrix,forcing:s.forcing,exact:s.exact,partial,definition:G.forcedPulseSystem(s.system),nodes:G.nodes},null,2)+'\n');
});

test('every mixed and repeated parameter jet differentiates the actual source as well as all lower matrix blocks',()=>{
  const s=nilpotent(),{G}=s,orders=[2,1,0],block=G.materializeForcedPulseJet(s.system,orders),partial=G.forcedPulsePartialSum(s.system,{orders,terms:3});
  assert.equal(block.dimensionPerRealPart,18);assert.equal(block.complexParts,2);
  const row=block.rows.find(row=>row.orders.join(',')==='2,1,0'),mixed=row.blocks.find(b=>b.orders.join(',')==='1,1,0');
  assert.equal(mixed.scale,G.q(2));
  for(const c of block.coefficients)for(let j=0;j<3;j++)for(const part of parts)
    assert.ok(eq(G,c.forcing[j][part],derivative(G,s.forcing[j][part],s.directions,c.orders)));
  for(let j=0;j<3;j++)for(const part of parts)assert.ok(eq(G,partial.velocity[j][part],derivative(G,s.exact[j][part],s.directions,orders)));
  const first=G.forcedPulseRhs(s.system,'real',2,s.v,s.parameters,[0,0,1]);
  assert.equal(eq(G,substituteExact(G,first,s),G.one),true,'the differentiated forcing cannot be omitted');
});

test('moving evaluation time retains all endpoint chain terms and zero-data parameter derivatives',()=>{
  const s=nilpotent(),{G}=s,end=G.add(G.q(1,2),G.div(G.pow(s.a,2),G.q(13)),G.div(G.mul(s.a,s.b),G.q(17))),
    original=G.forcedPulseValue(s.system,'real',0,end,s.parameters),orders=[3,0,0],
    actual=derivative(G,original,s.directions,orders),expected=derivative(G,G.substitute(s.exact[0].real,s.v,end),s.directions,orders);
  assert.ok(eq(G,substituteExact(G,actual,s),expected));
  assert.equal(eq(G,G.forcedPulsePartialSum(s.system,{orders,terms:3,time:end}).velocity[0].real,expected),false,
    'a fixed-time parameter jet cannot replace a derivative at a moving endpoint');
  for(const alpha of [[0,0,0],[1,2,0],[0,0,3]])for(const part of parts)for(let j=0;j<3;j++)
    assert.equal(G.forcedPulseValue(s.system,part,j,G.zero,s.parameters,alpha),G.zero);
});

test('FTC bounds use actual matrix/source/time derivative bodies and every finite sum retains its own nonzero factorial tail',()=>{
  const s=nilpotent(),{G}=s,block=G.materializeForcedPulseJet(s.system,[1,1,1]);
  for(const c of block.coefficients){
    const entries=[...c.matrixEntries.flat(),...c.forcingEntries.flatMap(z=>parts.map(p=>z[p]))];
    for(const e of entries){
      assert.equal(e.timeDerivative,G.derivative(e.expression,s.v));
      assert.equal(e.valueAtZero,G.substitute(e.expression,s.v,G.zero));
      assert.equal(G.freeCoordinates(e.upper).has(s.v),false);assert.equal(e.numericalIntegralEvaluated,false);
    }
  }
  for(const terms of [0,1,2,3]){
    const p=G.forcedPulsePartialSum(s.system,{orders:[1,1,1],terms}),z=G.mul(p.matrixNorm,p.length),
      factorial=n=>{let f=1n;for(let j=2;j<=n;j++)f*=BigInt(j);return f;},
      expected=G.mul(p.forcingNorm,p.length,G.exp(z),G.pow(z,terms),G.q(1,factorial(terms+1)));
    assert.equal(p.tail,expected);assert.notEqual(p.tail,G.zero);assert.equal(p.omittedTermsDeclaredZero,false);
  }
});

test('principal pulse cutoff retains both (1-psi)f and psi-prime t, even for a normal source',()=>{
  const s=moving(),r=forcedAngularInverse(s.G,s.input),{G}=s,psi=G.pow(s.v,2),c=forcedAngularCutoff(r,{psi});
  assert.ok(c.checks.every(x=>x.pass));assert.equal(c.principalCutoffResidualDeclaredZero,false);
  const omittedSource=G.mul(c.dpsi,r.velocity[0].real),omittedDerivative=G.mul(G.sub(G.one,psi),r.source[0].real);
  assert.equal(eq(G,c.expected[0].real,omittedSource),false);assert.equal(eq(G,c.expected[0].real,omittedDerivative),false);
});

test('missing pressure normal source, moving-normal term, and the higher harmonic square each fail a substantive identity',()=>{
  const s=moving(),r=forcedAngularInverse(s.G,s.input),{G}=s,n=r.normal.value,
    velocityAtoms=r.velocity.flatMap(z=>parts.map(p=>z[p])),
    normalF=G.add(...n.map((x,j)=>G.mul(x,r.source[j].real))),
    missingPressureNormal=G.div(G.mul(n[0],normalF),r.normal.squared),
    missingMovingNormal=G.add(...r.normal.derivative.map((x,j)=>G.mul(x,r.velocity[j].real))),
    wrongHarmonic=G.mul(G.q(s.input.m**2-1),r.damping,r.velocity[0].real);
  assert.equal(eq(G,missingPressureNormal,G.zero,velocityAtoms),false);
  assert.equal(eq(G,missingMovingNormal,G.zero,velocityAtoms),false);
  assert.equal(eq(G,wrongHarmonic,G.zero,velocityAtoms),false);
});

test('every positive and negative harmonic is preserved, with exact conjugate pressure and no zero-mode inversion',()=>{
  const s=moving(),{G}=s,{m,forcing,...common}=s.input,
    modes=[1,3].flatMap(m=>[{m,forcing},{m:-m,forcing:forcing.map(z=>({real:z.real,imaginary:G.neg(z.imaginary)}))}]),
    out=forcedAngularHarmonics(G,{...common,modes});
  assert.deepEqual(out.fullInputModeSet,[-3,-1,1,3]);assert.equal(out.modes.length,4);assert.equal(out.pairs.length,2);
  for(const p of out.pairs){
    const positive=out.modes.find(x=>x.m===p.m),negative=out.modes.find(x=>x.m===-p.m);
    assert.equal(negative.pressure.real,positive.pressure.real);assert.equal(negative.pressure.imaginary,G.neg(positive.pressure.imaginary));
    assert.ok(p.sourceConjugacyChecks.every(x=>x.pass));
  }
  assert.equal(out.zeroAngularMeanInverted,false);assert.equal(out.missingHarmonicAssumedZero,false);
  assert.throws(()=>forcedAngularHarmonics(G,{...common,modes:modes.slice(1)}),{code:'INVALID_INPUT'});
  assert.throws(()=>forcedAngularHarmonics(G,{...common,modes:[{m:0,forcing}]}),{code:'INVALID_INPUT'});
});

test('shared forced derivatives and a radial integral retain complete limit definitions, all jet tails, and bound-variable hygiene',()=>{
  const s=nilpotent(),{G}=s,t=G.forcedPulseValue(s.system,'real',0,s.v,s.parameters),shared=G.share(t,[s.v,...s.parameters],'retained actual forced body'),
    da=G.derivative(shared,s.a),body=G.materializeExpressionFunction(...G.nodes[da].args),
    integralVariable=G.fresh('source_radial_primitive'),integrand=G.mul(body,integralVariable),
    integral=G.integral(integrand,integralVariable,G.zero,G.one),changed=G.substitute(integral,s.a,integralVariable);
  assert.equal(eq(G,body,G.derivative(t,s.a)),true);
  assert.notEqual(G.nodes[changed].args[1],integralVariable);assert.equal(G.freeCoordinates(changed).has(integralVariable),true);
  const closure=materializeForcedPulseClosure(G,[G.derivative(da,s.b)]);
  assert.ok(closure.jets.some(j=>j.orders.join(',')==='1,1,0'));
  assert.equal(closure.everyRequestedForcedDerivativeHasActualSourceAndTail,true);
  assert.equal(closure.inheritedSourceClosureVerifiedHere,false);assert.equal(closure.sourceAuthenticated,false);
});

test('changed source data, frozen derivatives, supplied bounds/data, missing complex components and copied authority are rejected',()=>{
  const s=moving(),r=forcedAngularInverse(s.G,s.input),{G}=s;
  assert.throws(()=>assertForcedAngularInverse({...r}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const old=r.source;r.source=old.map(z=>({...z,real:G.zero}));
  assert.throws(()=>assertForcedAngularInverse(r),{code:'INVALID_SOURCE_CONSTRUCTION'});r.source=old;
  assert.equal(assertForcedAngularInverse(r),true);
  assert.throws(()=>G.derivative(r.velocity[0].real,s.ell),{code:'UNSUPPORTED'});
  assert.throws(()=>forcedAngularInverse(G,{...s.input,forcing:s.input.forcing.slice(0,2)}),{code:'INVALID_INPUT'});
  assert.throws(()=>forcedAngularInverse(G,{...s.input,m:0}),{code:'INVALID_INPUT'});
  assert.throws(()=>G.defineForcedPulse({...G.forcedPulseSystem(r.system),initial:[G.one,G.zero,G.zero]}),{code:'INVALID_INPUT'});
  assert.throws(()=>G.forcedPulseValue(r.system,'real',0,s.v,s.input.parameters,[17,0]),{code:'RESOURCE_LIMIT'});
  const zeroNormal=[G.zero,G.zero,G.zero];assert.throws(()=>forcedAngularInverse(G,{...s.input,n:zeroNormal}),{code:'INVALID_INPUT'});
  assert.throws(()=>forcedAngularInverse(G,{...s.input,normUpper:G.one}),{code:'INVALID_INPUT'});
});

test('new expressions append to the same upstream graph without changing its original prefix or definitions',()=>{
  const base=new ActualConvergentExpressions(),count=base.nodes.length,before=JSON.stringify(base.nodes),snapshot=base.captureFunctionDefinitions(),
    G=new ForcedPulseExpressions(base),v=G.fresh('v'),a=G.fresh('a'),forcing=[qcomplex(G,a),qcomplex(G),qcomplex(G)],
    id=G.defineForcedPulse({variable:v,parameters:[a],directions:[a],length:G.one,matrix:Array.from({length:3},()=>[G.zero,G.zero,G.zero]),forcing});
  G.forcedPulsePartialSum(id,{terms:1});assert.equal(assertForcedPulseFacade(G,base),true);
  assert.equal(new ForcedPulseExpressions(base),G);assert.equal(new ForcedPulseExpressions(G),G);assert.equal(G.nodes,base.nodes);
  assert.equal(JSON.stringify(base.nodes.slice(0,count)),before);assert.equal(base.functionDefinitionsUnchanged(snapshot),true);
  assert.throws(()=>assertForcedPulseFacade({...G},base),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.equal(Object.isFrozen(G.forcedPulseSystem(id)),true);
  assert.throws(()=>{G.forcedPulseSystem(id).forcing[0].real=G.zero;},TypeError);
});

test('the original common-torus pulse path fixes the slow and transverse point and preserves distinct preimages',()=>{
  const G=graph(),Y=[G.fresh('H0'),G.fresh('H1')],w=G.fresh('path_w'),R=G.fresh('fixed_slow_R'),ci=G.q(1,7),Tg=G.q(3),
    b=G.sub(G.sqrt(G.q(2)),G.one),squared=G.add(G.one,G.pow(b,2)),
    pulse=G.add(G.div(G.mul(G.q(9),G.add(G.mul(b,Y[0]),Y[1])),G.mul(ci,squared)),R),
    path=originalForcedPulsePath(G,{Y,w,pulse,ci,Tg,levelDifference:2}),
    source=G.add(G.mul(R,G.pow(Y[0],2)),G.pow(Y[1],3)),pulled=G.simultaneousSubstitute(source,Y,path.Hw);
  assert.equal(path.checks.length,8);assert.ok(path.checks.every(x=>x.pass));
  assert.equal(eq(G,G.substitute(pulled,w,pulse),source),true);
  assert.equal(path.preimagesIdentified,false);assert.equal(path.slowPointMovesAlongPath,false);
  assert.equal(G.freeCoordinates(pulled).has(R),true);assert.equal(path.sourceAuthenticated,false);
});

test('an omitted common-cover pulse scale is rejected instead of changing the source path',()=>{
  const G=graph(),Y=[G.fresh('H0'),G.fresh('H1')],w=G.fresh('w'),b=G.sub(G.sqrt(G.q(2)),G.one),
    ci=G.q(1,7),Tg=G.q(3),bad=G.div(G.add(G.mul(b,Y[0]),Y[1]),G.mul(ci,G.add(G.one,G.pow(b,2))));
  assert.throws(()=>originalForcedPulsePath(G,{Y,w,pulse:bad,ci,Tg,levelDifference:2}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>originalForcedPulsePath(G,{Y,w,pulse:bad,ci:G.add(ci,w),Tg,levelDifference:0}),{code:'INVALID_INPUT'});
});
