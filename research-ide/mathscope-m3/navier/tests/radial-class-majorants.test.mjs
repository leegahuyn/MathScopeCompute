import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {canonicalStringify,sha256} from '../../../mathscope-m0/contracts.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {radialFactorial,radialBinomial,radialBellMajorants,radialChangeOfVariablesMajorants,
  gaussianRadialPrimitiveMajorant,radialGaussianWeightMajorants,originalRadialClassDerivativeDemand,
  exactFixedShiftRadialCalculus} from '../source-radial-class-kernel.mjs';
import {originalRadialStepDerivativeProgram,prepareOriginalRadialClassMajorants,
  assertOriginalRadialClassMajorants,originalRadialClassMajorantCertificate,
  attachGlobalPressureRadialClassOperator,attachGlobalInitializedMeanRadialClassOperator}
  from '../source-radial-class-majorants.mjs';

let prepared;
const get=async()=>prepared??=await prepareOriginalRadialClassMajorants({order:2,pole:9,ibpOrder:3,maxNodes:100000,maxWork:200000});
const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),
  equal=(a,b)=>createFactoredRationalVerifier(G,{maxTerms:100000})(G.sub(a,b)).pass,
  fixtures={};

test('the fixed original radial constants bind the recorded source domain, rho, common phase and every complete operator',async()=>{
  const p=await get();assert.equal(assertOriginalRadialClassMajorants(p),true);
  assert.equal(p.checks.length,10);assert.ok(p.checks.every(c=>c.pass));
  assert.deepEqual(p.rows.map(r=>r.e),[0,1,2]);assert.equal(p.pressureRows.length,3);
  assert.equal(p.source.originalDomainArchiveSHA256.length,64);
  assert.equal(p.source.originalTemporalArchiveSHA256.length,64);
  assert.deepEqual(p.G.source.parametersExactExpressions.h,{exp:{product:[{integer:-8002},{ref:'T'}]}});
  assert.equal(p.scope.actualCurrentInputMClassNormsCertified,false);
  assert.equal(p.scope.actualPhysicalCutoffFlatnessCertified,false);
  assert.equal(p.scope.allOrderCurrentClassCertified,false);assert.equal(p.scope.completeN6,false);
});

test('radial IBP keeps its extra radial and four-or-higher torus derivatives, both source moments and the exact epsilon scale',async()=>{
  const p=await get(),F=p.G;
  for(const e of p.rows)for(const row of e.orders){
    assert.equal(row.zeroMomentNeededForPrimitive,false);assert.equal(row.primitiveInputOrder,row.order);
    assert.equal(row.addedSPower,0);assert.equal(row.poleChange,0);
    for(const a of row.remainderRows){
      const d=originalRadialClassDerivativeDemand({outputOrder:row.order,ibpOrder:a.ibpOrder});
      assert.deepEqual(a.demand,d);assert.equal(d.flatRemainderInputOrder,row.order+2*a.ibpOrder+3);
      assert.equal(d.cutoffInputOrder,row.order+1);assert.equal(d.zeroModeInverted,false);
      assert.equal(a.zeroFullWeightedHaarMomentRequired,true);assert.equal(a.allSlowDerivativesOfThatMomentRequired,true);
      assert.equal(a.epsilonExponentGain,F.mul(F.q(a.ibpOrder),p.phase.kappa));
      assert.equal(a.addedSPower,F.mul(F.q(a.ibpOrder),p.phase.rho));
      assert.notEqual(a.constant,F.zero);
    }
  }
  assert.equal(p.phase.noContinuousBandScaleSubstituted,true);assert.equal(p.phase.noNewCommonQThreshold,true);
  assert.equal(p.cutoff.requestedDerivativeOrder,3);assert.equal(p.rho.requestedDerivativeOrder,11);
  assert.equal(p.rho.rows.length,12);assert.equal(p.cutoff.rows.length,4);
});

test('the original flat step generates literal complete quotient derivatives beyond twelve with original source bounds',()=>{
  const s=originalRadialStepDerivativeProgram(G,{order:14,maxWork:200000});fixtures.step=s;
  assert.equal(s.sigma,G.step(s.x));assert.equal(s.source.pass,true);
  assert.equal(s.finiteTwelveJetExtrapolation,false);assert.equal(s.sigmaJets.length,15);
  assert.equal(s.sourceAuthenticated,false);assert.equal(s.source.activation.seedPower,2);
  for(let n=0;n<=14;n++){
    const row=s.rows[n];assert.equal(row.terms.length,n+1);assert.equal(row.bound,q(s.source.activation.ordinaryDerivativeBounds[n]));
    assert.equal(row.completeQuotientDerivative,true);
    assert.equal(row.interior,G.add(...row.terms.map(t=>t.value)));
    if(n){
      assert.equal(s.reciprocalRows[n].terms.length,n);assert.equal(row.exteriorDerivativesZero,true);
      assert.equal(s.reciprocal[n],G.neg(G.mul(s.reciprocal[0],G.add(...s.reciprocalRows[n].terms.map(t=>t.value)))));
    }
  }
  // Direct differentiation of the literal quotient is an additional
  // low-order implementation control; all14 derivatives are checked by
  // an independent exact Taylor interpreter in the observed runner.
  for(let n=0;n<3;n++)assert.equal(equal(G.derivative(s.rows[n].interior,s.x),s.rows[n+1].interior),true);
  assert.throws(()=>G.step(s.x,13),{code:'RESOURCE_LIMIT'},'The old numerical primitive is still unchanged.');
});

test('every Bell and Leibniz composition term matches direct complete polynomial differentiation',()=>{
  const x=G.fresh('radial_bell_x'),y=G.fresh('radial_bell_y'),
    inner=G.add(G.pow(x,3),G.mul(q(2),G.pow(x,2)),G.mul(q(-5),x),q(7)),
    outer=G.add(G.pow(y,5),G.mul(q(-3),G.pow(y,2)),q(2)),innerDerivatives=[inner],outerDerivatives=[outer];
  for(let n=1;n<=6;n++){
    innerDerivatives.push(G.derivative(innerDerivatives.at(-1),x));
    outerDerivatives.push(G.derivative(outerDerivatives.at(-1),y));
  }
  const bell=radialBellMajorants(G,{derivatives:innerDerivatives,order:6,maxWork:10000}),direct=[G.substitute(outer,y,inner)],composed=[];
  for(let n=0;n<=6;n++){
    if(n)direct.push(G.derivative(direct.at(-1),x));
    composed.push(G.add(...Array.from({length:n+1},(_,j)=>G.mul(bell.table[n][j],G.substitute(outerDerivatives[j],y,inner)))));
    assert.equal(equal(direct[n],composed[n]),true);
  }
  assert.equal(equal(composed[4],G.sub(composed[4],G.mul(q(6),G.pow(innerDerivatives[2],2),G.substitute(outerDerivatives[2],y,inner)))),false);
  fixtures.bell={x,y,inner,outer,innerDerivatives,outerDerivatives,bell,direct,composed};
});

test('the complete fixed-shift primitive retains both finite endpoints, cutoff error, slow dependence and physical transport',()=>{
  const [U,u,Y0,Y1,Z]=['U','u','Y0','Y1','Z'].map(n=>G.fresh('radial_shift_'+n)),
    body=G.add(G.pow(U,3),G.mul(q(2),U,Y0),G.pow(Y1,2),G.mul(Z,G.pow(U,2))),
    chi=G.div(G.mul(G.add(G.one,G.pow(U,2)),G.add(G.one,Z)),q(7)),
    result=exactFixedShiftRadialCalculus(G,{body,U,u,Y:[Y0,Y1],slow:[Z],M:q(3,2),vr:[G.one,q(-2,5)],chi,span:q(5,3)});
  assert.equal(result.integrandIdentity.pass,true);assert.equal(result.productIdentity.pass,true);
  assert.equal(equal(result.beforeFTC.compact,result.expected),true);
  assert.equal(equal(result.endpoints.rawEndpoints,G.zero),false);
  assert.equal(equal(result.cutoffRemainder,G.zero),false);
  assert.equal(equal(result.beforeFTC.compact,G.sub(result.expected,result.endpoints.rawEndpoints)),false);
  assert.equal(equal(result.beforeFTC.compact,G.add(result.expected,result.cutoffRemainder)),false);
  assert.equal(equal(G.derivative(result.beforeFTC.compact,Z),G.derivative(result.expected,Z)),true);
  assert.equal(result.sourceZeroEndpointReductionApplied,false);assert.equal(result.zeroModeAssumedZero,false);
  assert.equal(result.sourceAuthenticated,false);fixtures.shift=result;
});

test('Gaussian primitive constants keep both edge recurrences and use only the valid supported half-line on each collar',()=>{
  const a=G.fresh('radial_gaussian_a'),gaussians=Array.from({length:17},(_,pole)=>gaussianRadialPrimitiveMajorant(G,{a,pole,maxWork:1000})),
    weight=radialGaussianWeightMajorants(G,{innerExponent:q(2),outerExponent:q(3),width:q(8),collar:q(1,4),radiusBase:q(16),pole:9});
  for(const row of gaussians){
    assert.ok(row.rows.every(r=>r.positiveCoefficientCheck.pass));assert.equal(row.sourceAuthenticated,false);
    assert.notEqual(row.constant,G.zero);assert.equal(row.numericalQuadratureExecuted,false);
  }
  assert.equal(weight.inner.a,q(2));assert.equal(weight.outer.a,q(3));
  assert.equal(weight.supportedHalfLineConstant,G.maximum(weight.innerConstant,weight.outerConstant,weight.middleConstant));
  assert.equal(weight.sourceAuthenticated,false);assert.equal(weight.requiredPremises.length,6);
  assert.throws(()=>gaussianRadialPrimitiveMajorant(G,{a:q(0),pole:3}),{code:'INVALID_INPUT'});
  fixtures.gaussian={a,rows:gaussians,weight};
});

test('all three weighted radial power changes retain the literal falling derivatives and complete coordinate compositions',()=>{
  const change=radialChangeOfVariablesMajorants(G,{order:6,radiusBase:q(16),dr:q(5,2),maxWork:10000});
  for(const rows of [change.inverseRows,change.directRows,...change.exponents.flatMap(e=>[e.sourceRows,e.outputRows])]){
    const variable=rows===change.inverseRows||change.exponents.some(e=>e.sourceRows===rows)?change.U:change.R;
    for(let n=0;n<3;n++)assert.equal(equal(G.derivative(rows[n].actualDerivative,variable),rows[n+1].actualDerivative),true);
  }
  assert.deepEqual(change.exponents.map(e=>e.e),[0,1,2]);
  for(const e of change.exponents)for(const row of e.transformedSource){
    assert.equal(row.terms.length,row.order+1);assert.equal(row.value,G.add(...row.terms.map(t=>t.value)));
    for(const t of row.terms)assert.equal(t.binomial,String(radialBinomial(row.order,t.prefactorOrder)));
  }
  fixtures.change=change;
});

test('rho retains every source seed and mixed slow derivative, a proved positive full mass and both original logarithmic edges',async()=>{
  const p=await get(),F=p.G,r=p.rho,n=p.rho.requestedDerivativeOrder;
  assert.equal(r.seedJets.completeIntegerPolynomial,true);assert.equal(r.seedDerivativeBodies.length,n+1);
  assert.equal(r.allRequiredMixedSlowNormsConstructed,true);assert.equal(r.numericalNormValuesComputed,false);
  assert.equal(r.massLower,F.div(F.exp(F.q(-16,3)),F.q(20)));
  for(let j=0;j<=n;j++){
    assert.equal(r.profileRows[j].derivatives.length,(j+1)*(j+2)/2);
    assert.equal(r.rows[j].weightedSlowBound,F.mul(p.chart.throughOrder[j].bound,r.profileRows[j].bound,p.geometry.middleZetaInverse));
    assert.equal(r.rows[j].torusDerivativesExactlyZero,true);
    assert.ok(r.profileRows[j].derivatives.every(d=>d.orders[2]===0&&d.orders[0]+d.orders[1]<=j));
  }
  assert.equal(p.chart.identity.pass,true);
  for(let j=1;j<=n;j++)assert.equal(p.chart.throughOrder[j].bound,
    F.mul(F.q(3n**BigInt(j)*2n**BigInt(j*(j-1)/2)),...p.chart.coefficientJets.slice(0,j).map(x=>x.bound)));
  assert.equal(p.geometry.a,F.pow(F.parameter('t1'),2));assert.equal(p.geometry.b,F.q(4));
});

test('the pressure estimate includes the complete rho-P product with whole normalized Haar projection, including higher IBP input orders',async()=>{
  const p=await get(),F=p.G;
  for(const r of p.pressureInput)assert.equal(r.constant,F.add(F.one,
    F.mul(F.q(2n**BigInt(r.order)),r.rhoWeightedNorm,r.wholeHaarProjectionConstant)));
  for(const r of p.pressureRows){
    assert.equal(r.pressureConstant,F.mul(p.rows[0].orders[r.order].primitiveConstant,p.pressureInput[r.order].constant));
    for(const a of r.cutoffRemainders)assert.equal(a.input.order,r.order+2*a.ibpOrder+3);
  }
  assert.ok(p.pressureInput.every(r=>r.normalizedHaarMass==='1'&&r.PIndependentOfRAndY&&!r.sourceInputBoundInvented));
  assert.equal(p.scope.actualCurrentReconstructed,false);
  assert.throws(()=>attachGlobalPressureRadialClassOperator({G:F},p),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>attachGlobalInitializedMeanRadialClassOperator({G:F},p),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('private seals cover every pressure-input row and reject altered source constants while permitting separate appended expressions',async()=>{
  const p=await get();assert.throws(()=>assertOriginalRadialClassMajorants({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  // Order3 is not directly referenced by an output row or its first IBP
  // input. The complete pressureInput inventory must still be sealed.
  const original=p.pressureInput[3].constant;p.pressureInput[3].constant=p.G.zero;
  assert.throws(()=>assertOriginalRadialClassMajorants(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.pressureInput[3].constant=original;
  const id=p.roots.T_1_order_1,node=p.G.nodes[id];p.G.nodes[id]={op:'rational',args:['0','1']};
  assert.throws(()=>assertOriginalRadialClassMajorants(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.G.nodes[id]=node;
  p.G.fresh('separate_appended_radial_control');assert.equal(assertOriginalRadialClassMajorants(p),true);
});

test('replacement norms, phases, thresholds and incomplete derivative budgets fail without shortening the operator inventory',async()=>{
  for(const input of [{norm:1},{source:true},{qBig:1},{epsilon:0},{complete:true}])
    await assert.rejects(()=>prepareOriginalRadialClassMajorants(input),{code:'INVALID_INPUT'});
  for(const input of [{order:-1},{ibpOrder:0},{order:100,maxWork:100},{maxNodes:5},{pole:1000,maxWork:100}])
    await assert.rejects(()=>prepareOriginalRadialClassMajorants(input),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>originalRadialClassDerivativeDemand({outputOrder:1,ibpOrder:0}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>originalRadialStepDerivativeProgram(G,{order:20,maxWork:100}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>radialBellMajorants(G,{derivatives:[G.one],order:3}),{code:'INVALID_INPUT'});
  assert.throws(()=>radialBellMajorants(G,{derivatives:Array(11).fill(G.one),order:10,maxWork:1}),{code:'RESOURCE_LIMIT'});
  const s=fixtures.shift;
  assert.throws(()=>exactFixedShiftRadialCalculus(G,{...s.input,M:s.input.U}),{code:'INVALID_INPUT'});
  assert.throws(()=>exactFixedShiftRadialCalculus(G,{...s.input,chi:s.input.Y[0]}),{code:'INVALID_INPUT'});
});

test('the retained fixed source constant program is immutable and exports all independent calculus witnesses with unfilled current-class premises',async()=>{
  const p=await get(),certificate=await originalRadialClassMajorantCertificate(p);
  assert.equal(certificate.graph.nodeCount,certificate.program.nodes.length);
  assert.equal(certificate.graph.sha256,await sha256(canonicalStringify(certificate.program)));
  assert.ok(certificate.graph.nodeCount>5000&&certificate.graph.nodeCount<30000);
  p.G.fresh('after_radial_certificate');assert.deepEqual(await originalRadialClassMajorantCertificate(p),certificate);
  const artifact={schema:'MathScope.N6.ObservedOriginalFixedRadialClassMajorants/1',certificate,
    independent:{program:G.pack({}, {schema:'MathScope.N6.RadialIndependentCalculusInputs/1'}),fixtures,
      cutoffFormalPoints:[['1/3','2','3'],['2/5','3','7'],['3/7','5','11']],
      gaussianPoleRange:[0,16],ibpOrders:[1,2,3,4,5],chartOrderRange:[0,11]},
    actualCurrentAttachmentExecuted:false,actualCurrentInputNormsInvented:false,completeN6:false};
  if(process.env.MATHSCOPE_FIXED_RADIAL_MAJORANT_ARTIFACT)
    fs.writeFileSync(process.env.MATHSCOPE_FIXED_RADIAL_MAJORANT_ARTIFACT,JSON.stringify(artifact,null,2)+'\n');
});
