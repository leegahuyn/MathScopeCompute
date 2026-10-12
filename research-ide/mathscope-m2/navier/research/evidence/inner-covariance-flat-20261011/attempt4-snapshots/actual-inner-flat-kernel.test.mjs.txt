import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualSourceExpressions} from '../actual-global-source-expressions.mjs';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {compileActualStressDirectionProgram} from '../actual-stress-direction-program.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {readRational} from '../actual-continuation-arithmetic.mjs';
import {innerFlatSquareRootJets,innerEndpointStressAlgebra,innerActivationSourceIdentity,copyInnerFactorProgram} from '../actual-inner-flat-kernel.mjs';
import {prepareActualInnerCovarianceFlatExtension,attachActualInnerCovarianceFlatExtension,assertActualInnerCovarianceFlatExtension,ActualInnerCovarianceExpressions} from '../actual-inner-covariance-flat-extension.mjs';
import {ActualAnnulusCovarianceExpressions} from '../actual-admissible-annulus-covariance.mjs';

test('the inner scalar square-root jets retain the source width and exact derivative polynomials',()=>{
  const p=innerFlatSquareRootJets({jetOrder:4,vanishingOrder:6});
  assert.deepEqual(p.rows.map(r=>r.polynomial),[['1'],['1'],['1','-3'],['1','-9','12'],['1','-18','75','-60']]);
  assert.deepEqual(p.rows.map(r=>r.sourceWidthExponent),[0,-1,-2,-3,-4]);
  assert.deepEqual(p.rows.map(r=>r.singularNormalizedPower),[0,3,6,9,12]);
  assert.ok(p.rows.every(r=>r.exponentCheck));assert.equal(p.pass,true);assert.equal(p.actualSourceAuthenticated,false);
});

test('all first five ordinary derivatives agree and missing width or polynomial terms are rejected',()=>{
  const G=new ActualSourceExpressions(),y=G.fresh('inner_test_y'),width=G.fresh('inner_test_t1'),r=G.div(y,width),
    f=G.exp(G.neg(G.mul(G.q(1,2),G.pow(r,-2)))),rows=innerFlatSquareRootJets({jetOrder:5}).rows;
  let dy=f;
  for(const row of rows){
    if(row.order)dy=G.derivative(dy,y);
    const poly=G.add(...row.polynomial.map((x,j)=>G.mul(G.q(...readRational(x)),G.pow(r,2*j)))),
      expected=G.mul(G.pow(width,-row.order),f,G.pow(r,-3*row.order),poly);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(dy,expected),{atomicNodes:[f],maxTerms:100000}).pass,true);
    if(row.order===1)assert.equal(sourceGraphRationalIdentity(G,G.sub(dy,G.mul(f,G.pow(r,-3))),{atomicNodes:[f]}).pass,false);
    if(row.order===2)assert.equal(sourceGraphRationalIdentity(G,G.sub(dy,G.mul(G.pow(width,-2),f,G.pow(r,-6))),{atomicNodes:[f]}).pass,false);
  }
});

test('the same integer recurrence generates order sixteen and arbitrarily strong finite flat powers',()=>{
  const p=innerFlatSquareRootJets({jetOrder:16,vanishingOrder:32});
  assert.equal(p.rows.length,17);assert.equal(p.rows[16].polynomial.length,16);assert.equal(p.rows[16].polynomial[0],'1');
  assert.ok(p.rows.every(r=>r.exponentCheck));assert.equal(p.numericalSourceBounds,false);
  assert.throws(()=>innerFlatSquareRootJets({jetOrder:129}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>innerFlatSquareRootJets({vanishingOrder:-1}),{code:'INVALID_INPUT'});
});

test('the actual inner stress algebra has the regular endpoint and keeps the axial factor two',()=>{
  const G=new ActualSourceExpressions(),p=innerEndpointStressAlgebra(G);
  assert.equal(p.pass,true);assert.equal(p.checks.length,2);assert.ok(p.checks.every(c=>c.pass));
  assert.equal(p.negativeControl.correctlyRejected,true);assert.equal(p.sourceAuthenticated,false);
  assert.match(p.analyticPremise,/Ka limit/);
});

test('the exact original inner factor copy retains natural solutions, nonlinear differences and Ka bodies',()=>{
  const G=new ActualConvergentExpressions(),program=compileActualStressDirectionProgram({derivativeOrder:0}),
    y=G.fresh('inner_copy_y'),eta=G.fresh('inner_copy_eta'),copy=copyInnerFactorProgram(G,program,y,eta);
  assert.equal(copy.roots.Xa,G.parameter('Xa'));assert.equal(copy.roots.t1,G.parameter('t1'));
  assert.equal(copy.roots.innerFactor,G.mul(G.sub(G.one,G.parameter('kappa0')),G.step(G.div(y,G.parameter('t1')))));
  assert.ok(copy.operations.includes('actual_natural_series'));assert.ok(copy.operations.includes('definite_integral'));
  assert.equal(copy.kernels.length,program.innerKernels.length);assert.ok(copy.kernels.length>=7);
  assert.ok(copy.pairs.length>100);assert.equal(copy.sourceAuthenticatedByCopy,false);assert.equal(copy.analyticNaturalSeriesReplaced,false);
  for(const root of [copy.roots.innerTheta,copy.roots.innerZ])assert.ok([...G.freeCoordinates(root)].every(x=>x===y||x===eta));
  assert.notEqual(copy.roots.innerUOverFactor,G.zero);assert.notEqual(copy.roots.innerMDifferenceOverFactor,G.zero);
});

test('an unsupported factor operation and an absent natural component cannot silently become zero',()=>{
  const G=new ActualConvergentExpressions(),program=compileActualStressDirectionProgram({derivativeOrder:0}),
    y=G.fresh('bad_inner_y'),eta=G.fresh('bad_inner_eta'),bad=structuredClone(program);
  bad.nodes[bad.roots.innerTheta]={op:'caller_supplied_bound',args:[]};
  assert.throws(()=>copyInnerFactorProgram(G,bad,y,eta),{code:'UNSUPPORTED'});
  assert.throws(()=>copyInnerFactorProgram(G,{nodes:[]},y,eta),{code:'INVALID_INPUT'});
});

test('preexisting source operands may reorder a copied product but exact activation algebra retains the coefficient',()=>{
  const G=new ActualInnerCovarianceExpressions(new ActualConvergentExpressions()),program=compileActualStressDirectionProgram({derivativeOrder:0}),
    y=G.fresh('preexisting_inner_y'),eta=G.fresh('preexisting_inner_eta'),step=G.step(G.div(y,G.parameter('t1'))),
    copied=copyInnerFactorProgram(G,program,y,eta).roots.innerFactor,expected=G.mul(G.sub(G.one,G.parameter('kappa0')),step),
    originalNode=structuredClone(G.nodes[copied]);
  assert.notEqual(copied,expected);assert.equal(G.nodes[copied].op,'multiply');
  assert.equal(sourceGraphRationalIdentity(G,G.sub(copied,expected),{atomicNodes:[step]}).pass,true);
  assert.deepEqual(G.nodes[copied],originalNode);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(copied,step),{atomicNodes:[step]}).pass,false);
});

test('opaque source step arguments are identified only after exact argument congruence with the original width',()=>{
  const G=new ActualInnerCovarianceExpressions(new ActualConvergentExpressions()),program=compileActualStressDirectionProgram({derivativeOrder:0}),
    width=G.parameter('t1'),inversePreexisting=G.inv(width),y=G.fresh('nested_order_inner_y'),eta=G.fresh('nested_order_inner_eta'),
    sourceActivation=copyInnerFactorProgram(G,program,y,eta).roots.innerFactor,kappa=G.parameter('kappa0'),
    expected=G.mul(G.sub(G.one,kappa),G.step(G.div(y,width))),originalNode=structuredClone(G.nodes[sourceActivation]);
  assert.ok(inversePreexisting<y);
  assert.equal(sourceGraphRationalIdentity(G,G.sub(sourceActivation,expected)).pass,false);
  const p=innerActivationSourceIdentity(G,{sourceActivation,y,width,kappa});
  assert.equal(p.pass,true);assert.notEqual(p.originalStep,p.expectedStep);assert.equal(p.argumentIdentity.pass,true);assert.equal(p.congruenceProved,true);
  assert.equal(p.coefficientIdentity.pass,true);assert.equal(p.normalizedIdentity.pass,true);assert.deepEqual(G.nodes[sourceActivation],originalNode);
  assert.equal(innerActivationSourceIdentity(G,{sourceActivation:p.originalStep,y,width,kappa}).pass,false);
  assert.equal(innerActivationSourceIdentity(G,{sourceActivation,y,width:G.mul(G.q(2),width),kappa}).pass,false);
  const wrongOrder=G.mul(G.sub(G.one,kappa),G.node('source_step_derivative',[G.div(y,width),1]));
  assert.equal(innerActivationSourceIdentity(G,{sourceActivation:wrongOrder,y,width,kappa}).pass,false);
});

test('caller supplied H, fields, lower bounds or replayed positivity flags cannot authenticate this source',()=>{
  assert.throws(()=>attachActualInnerCovarianceFlatExtension({decision:{actualCompletedN1BackgroundRetained:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertActualInnerCovarianceFlatExtension({pass:true}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const request of [{ell:1},{H:[[1,0],[0,1]]},{WLower:1},{field:'leading'},{qStar:1},{wholeGPOSComplete:true},[]])
    assert.throws(()=>prepareActualInnerCovarianceFlatExtension(request),{code:'INVALID_INPUT'});
  assert.throws(()=>prepareActualInnerCovarianceFlatExtension({jetOrder:13}),{code:'RESOURCE_LIMIT'});
});

test('coordinate-set dependency agrees with the old recurrence including bound variables and exact Volterra values',()=>{
  const base=new ActualAnnulusCovarianceExpressions(new ActualConvergentExpressions()),y=base.fresh('dependency_y'),eta=base.fresh('dependency_eta'),v=base.fresh('dependency_v'),
    natural=base.natural('Phi',base.add(base.q(4),base.pow(y,2)),eta,1,2),
    shared=base.share(base.mul(base.exp(y),base.sine(eta)),[y,eta],'inner_dependency_fixture'),
    matrix=[[y,eta],[v,base.neg(y)]],sys=base.defineCovarianceVolterra({name:'DependencyFixture',variable:v,parameters:[y,eta],matrix,normUpper:base.q(128),length:base.one}),
    pulse=base.covarianceValue(sys,0,v,[y,eta]),
    roots=[base.integral(base.exp(base.mul(y,v)),v,base.zero,eta),base.integral(base.exp(base.mul(y,v)),v,base.zero,v),natural,shared,pulse,
      base.choose(y,base.zero,base.one,base.zero,base.mul(eta,pulse),base.one)],
    old=new ActualAnnulusCovarianceExpressions(base),fast=new ActualInnerCovarianceExpressions(base);
  for(const root of roots)for(const variable of [y,eta,v,base.mul(y,eta)])assert.equal(fast.dependsOn(root,variable),old.dependsOn(root,variable));
  for(const root of roots)assert.equal(fast.substitute(root,y,fast.add(eta,fast.one)),old.substitute(root,y,old.add(eta,old.one)));
  assert.deepEqual(fast.nodes,old.nodes);
  for(let j=0;j<1024;j++){const unused=fast.fresh('unrelated_bound_variable');for(const root of roots)assert.equal(fast.dependsOn(root,unused),false);}
  assert.ok((fast.dependencyCache?.size??0)<1000);assert.equal(fast.freeCoordinates(roots[0]).has(v),false);assert.equal(fast.freeCoordinates(roots[1]).has(v),true);
});
