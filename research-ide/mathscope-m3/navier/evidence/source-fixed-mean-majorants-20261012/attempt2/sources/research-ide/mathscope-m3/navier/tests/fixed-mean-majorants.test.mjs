import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {rectangularSourceFTC} from '../../../mathscope-m2/navier/actual-background-physical-seminorms.mjs';
import {canonicalStringify,sha256} from '../../../mathscope-m0/contracts.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {originalMeanSeedFlatJets,originalFixedMeanResponseBodies,prepareOriginalMeanMapOperatorSeminorms,
  assertOriginalMeanMapOperatorSeminorms,originalMeanMapOperatorCertificate} from '../source-fixed-mean-majorants.mjs';
import {copyFixedMeanSourceExpressions,attachInitializedMeanOperatorMajorants,
  assertInitializedMeanOperatorMajorants} from '../source-initialized-mean-majorants.mjs';

let prepared,certificate;
const get=async()=>prepared??=await prepareOriginalMeanMapOperatorSeminorms({order:1,maxNodes:300000,maxWork:10000});
const equal=(G,a,b,extra={})=>createFactoredRationalVerifier(G,{maxTerms:120000,...extra})(G.sub(a,b)).pass;
const sum=a=>a.reduce((s,n)=>s+n,0);

test('the actual fixed original five-map source produces every requested mixed operator bound on its authentic compact collar',async()=>{
  const p=await get(),G=p.G;
  assert.equal(assertOriginalMeanMapOperatorSeminorms(p),true);
  assert.equal(p.checks.length,10);assert.ok(p.checks.every(row=>row.pass));
  assert.deepEqual(p.domain.meanLogCollar,['1/2','5/2']);
  assert.deepEqual(p.domain.originalSourceEtaStrip,['-1','1']);
  assert.deepEqual(p.domain.sourceSInterval,['1/2','2']);
  assert.equal(p.domain.monotoneRootEvaluatedOnEnlargedBox,false);
  assert.equal(G.nodes[p.roots.sourceH].op,'source_parameter');
  assert.equal(G.nodes[p.roots.sourceLambda].args[0],'lambda');
  assert.equal(p.entries.length,15);assert.equal(p.radialProfiles.length,5);
  assert.ok(p.normRows.length>20);assert.ok(G.nodes.length<100000);
  for(const m of [0,1]){
    const row=p.byOrder[m];assert.equal(row.requiredTargetDerivativeOrder,m+1);
    assert.equal(row.leibnizCoefficientSum,String(2**m));assert.equal(row.sPolynomialPower,0);
    assert.equal(row.originalClassImplication.inputClass,'S_H');
    assert.equal(row.originalClassImplication.outputClass,'M_H');
    assert.equal(row.originalClassImplication.radialOutputClass,'M_(H+1)');
    assert.equal(G.freeCoordinates(row.maximum).size,0);
    for(const component of ['v','gamma','psi','betaOverEpsilon'])assert.ok(G.nodes[row.componentBounds[component]]);
  }
  assert.equal(p.scope.currentDefectClassCertified,false);
  assert.equal(p.scope.fullCurrentAllOrderClassCertified,false);
  assert.equal(p.scope.finalCutoffScheduleInstantiated,false);
  assert.equal(p.source.sameFixedMapAsOriginalLemma8_7,true);
});

test('every weighted radial derivative precedes division by the original zeta and every required FTC face is retained',async()=>{
  const p=await get(),G=p.G,X=p.sourceBodies.coordinates.X;
  for(const profile of p.radialProfiles){
    assert.equal(profile.derivatives.length,3);
    for(const row of profile.derivatives){
      let expected=profile.body;for(let j=0;j<row.order;j++)expected=G.derivative(expected,X);
      assert.equal(row.actualDerivative,expected);
      assert.equal(row.norm.weightedBody,G.div(expected,p.domain.zeta));
      assert.equal(row.norm.ordinaryFieldDerivativeTakenBeforeDividingByZeta,true);
      assert.equal(row.norm.coordinates.length,1);
      assert.deepEqual(row.norm.faces.map(f=>f.mask),[0,1]);
      assert.equal(G.freeCoordinates(row.norm.bound).size,0);
    }
  }
  for(const row of p.normRows){
    if(row.exactZeroBody||row.constantBody)assert.deepEqual(row.faces,[]);
    else assert.deepEqual(row.faces.map(f=>f.mask),Array.from({length:2**row.coordinates.length},(_,i)=>i));
    assert.equal(G.freeCoordinates(row.bound).size,0);
  }
  const primitive=p.radialProfiles.find(p=>p.kind==='primitive');
  assert.equal(primitive.individualPrimitiveDeclaredCompact,false);
  assert.equal(primitive.wholeAxialCombinationUsesExactZeroMoment,true);
  const raw=p.radialProfiles.find(p=>p.kind==='profile').body;
  assert.equal(equal(G,G.div(G.derivative(raw,X),p.domain.zeta),G.derivative(G.div(raw,p.domain.zeta),X)),false,
    'Differentiating the weight would define a different bound target.');
});

test('original coefficient separation obeys independent Euler and eta derivative identities and keeps all lambda gaps',async()=>{
  const p=await get(),G=p.G,{s,eta}=p.sourceBodies.coordinates,
    muSymbols=p.sourceBodies.mu.map((root,j)=>{assert.equal(G.freeCoordinates(root).size,0);return G.fresh('independent_fixed_mu_'+j);});
  // The retained AD graph intentionally keeps integrals of an identically
  // zero piecewise derivative. For this independent rational identity,
  // replace the already verified coordinate-free mu bodies by independent
  // constants before differentiating, rather than asserting those opaque
  // zero integrals vanish from their raw node IDs.
  for(const unit of p.sourceBodies.units){
    const separation=p.separability.find(row=>row.target===unit.target),exponent=p.sourceBodies.chartPowers[unit.target];
    assert.ok(separation.checks.every(c=>c.pass));assert.equal(separation.sourceOnly,true);
    for(const part of ['angular','axial'])for(const original of unit.coefficients[part]){
      const c=G.simultaneousSubstitute(original,p.sourceBodies.mu,muSymbols);
      assert.equal(equal(G,G.mul(s,G.derivative(c,s)),G.mul(exponent,c)),true);
      assert.equal(equal(G,G.mul(G.add(G.one,G.pow(eta,2)),G.derivative(c,eta)),G.mul(G.q(2),eta,c)),true);
    }
    assert.notEqual(unit.coefficients.gap,G.zero);
    assert.equal(unit.coefficients.sourceLambdaReplaced,false);
    assert.equal(unit.coefficients.binary64ExponentialsSubtracted,false);
  }
  const nonzero=p.sourceBodies.units.find(u=>u.target==='Jtheta').coefficients.axial[0],
    wrong=G.div(nonzero,G.add(G.one,G.pow(eta,2)));
  assert.equal(equal(G,nonzero,wrong),false);
});

test('the source map retains both beta product-rule kernels and each extra slow derivative of the full primitive',async()=>{
  const p=await get(),G=p.G,rows=p.entries.filter(row=>row.component==='betaOverEpsilon');
  assert.equal(rows.length,6);
  for(const target of ['P','Jtheta','Jz']){
    const family=rows.filter(row=>row.target===target);
    assert.deepEqual(family.map(row=>row.targetDerivative),[[0,0,0],[0,1,0]]);
    for(const row of family){
      assert.equal(row.epsilonPrefactor,1);
      for(const bound of row.bounds){
        const expected=bound.slowOrders.map((n,j)=>n+(sum(row.targetDerivative)===0&&j===1?1:0));
        assert.deepEqual(bound.originalPotentialSlowOrders,expected);
        assert.ok(p.expansion.rows.some(e=>canonicalStringify(e.slowOrders)===canonicalStringify(expected)));
      }
    }
  }
  const psi=p.sourceBodies.units.find(row=>row.target==='Jtheta').psi,target=G.fresh('new_actual_target_control'),
    missingTargetDerivative=G.mul(psi,target);
  assert.notEqual(psi,G.zero);assert.equal(equal(G,missingTargetDerivative,G.zero,{atomicNodes:[psi]}),false);
});

test('complete fixed-source body copying preserves every moment integrand and both endpoints in a distinct graph namespace',()=>{
  const from=new ActualConvergentExpressions(),to=new ActualConvergentExpressions(),
    make=(G,tag)=>originalFixedMeanResponseBodies(G,Object.fromEntries(['s','X','eta','R'].map(n=>[n,G.fresh(tag+n)]))),
    original=make(from,'norm_'),actual=make(to,'actual_'),
    bindings=['s','X','eta','R','x'].map(n=>[original.coordinates[n],actual.coordinates[n]]),
    copied=copyFixedMeanSourceExpressions(from,to,bindings),pairs=[];
  for(const key of ['lambda','h','A','X0','x0','d','eta0','logK','K','a'])pairs.push([original[key],actual[key]]);
  for(const key of ['powers','mu'])original[key].forEach((root,j)=>pairs.push([root,actual[key][j]]));
  original.copies.forEach((row,j)=>{pairs.push([row.profile,actual.copies[j].profile],[row.inQ,actual.copies[j].inQ]);});
  for(const [source,value]of pairs)assert.equal(equal(to,copied.copy(source),value),true);
  assert.equal(copied.sourceAuthenticated,false);assert.equal(copied.actualIntegrandsAndEndpointsRetained,true);
  const moment=from.nodes[original.mu[0]],bound=to.nodes[copied.copy(original.mu[0])];
  assert.equal(moment.op,'definite_integral');assert.equal(bound.op,'definite_integral');
  assert.equal(bound.args[1],actual.coordinates.x);
  assert.equal(bound.args[2],actual.x0);assert.equal(bound.args[3],to.mul(to.q(11,10),actual.x0));
  assert.notEqual(bound.args[0],to.zero);
  assert.throws(()=>copyFixedMeanSourceExpressions(from,to,[bindings[0],bindings[0]]),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const falseSource=Object.create(to);falseSource.source={...to.source,parameterExpressionSHA256:'0'.repeat(64)};
  assert.throws(()=>copyFixedMeanSourceExpressions(from,falseSource),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('the exact seed polynomial recurrence retains all derivative coefficients and explicit flat endpoint proof',()=>{
  const result=originalMeanSeedFlatJets({order:8,maxWork:10000});
  assert.equal(result.rows.length,9);assert.deepEqual(result.rows[0].polynomial,['1']);
  assert.deepEqual(result.rows[1].polynomial,['1','-2']);
  assert.ok(result.rows.slice(2).every(row=>row.polynomial.some(c=>BigInt(c)<0n)&&row.polynomial.some(c=>BigInt(c)>0n)));
  assert.ok(result.rows.every(row=>row.denominatorPower===2*row.order));
  assert.equal(result.mathematicalOrderCap,null);assert.equal(result.floatingPointValuesUsed,false);
  assert.match(result.flatness,/both endpoints/);
  assert.throws(()=>originalMeanSeedFlatJets({order:8,maxWork:8}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>originalMeanSeedFlatJets({order:Number.MAX_SAFE_INTEGER,maxWork:Number.MAX_SAFE_INTEGER}),{code:'RESOURCE_LIMIT'});
});

test('an independent mixed polynomial confirms the complete rectangular FTC anchoring and missing-face controls',()=>{
  const G=new ActualConvergentExpressions(),x=G.fresh('ftc_x'),y=G.fresh('ftc_y'),z=G.fresh('ftc_z'),
    body=G.add(G.q(7),G.mul(G.q(2),x),G.mul(G.q(3),x,y),G.mul(G.q(5),x,y,z)),
    out=rectangularSourceFTC(G,{body,coordinates:[x,y,z],lower:[G.zero,G.zero,G.zero],upper:[G.one,G.one,G.one]});
  assert.equal(out.faces.length,8);assert.equal(G.freeCoordinates(out.bound).size,0);
  assert.equal(equal(G,out.faces[7].derivative,G.q(5)),true);
  assert.equal(equal(G,out.faces[3].derivative,G.add(G.q(3),G.mul(G.q(5),z))),true);
  assert.equal(equal(G,out.faces[7].derivative,G.zero),false);
  const atLower=G.simultaneousSubstitute(body,[x,y,z],[G.zero,G.zero,G.zero]);assert.equal(atLower,G.q(7));
});

test('caller replacements, resource exhaustion, mutable metadata and serialized states cannot acquire original class authority',async()=>{
  for(const extra of [{lambda:'1/2'},{source:{}},{norms:[]},{classComplete:true},{box:[]}])
    await assert.rejects(()=>prepareOriginalMeanMapOperatorSeminorms(extra),{code:'INVALID_INPUT'});
  await assert.rejects(()=>prepareOriginalMeanMapOperatorSeminorms({order:1,maxNodes:4000,maxWork:10000}),{code:'RESOURCE_LIMIT'});
  const p=await get();assert.throws(()=>assertOriginalMeanMapOperatorSeminorms({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const saved=p.domain.meanLogCollar[0];p.domain.meanLogCollar[0]='0';
  assert.throws(()=>assertOriginalMeanMapOperatorSeminorms(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.domain.meanLogCollar[0]=saved;
  assert.equal(assertOriginalMeanMapOperatorSeminorms(p),true);
  for(const fake of [{},{G:p.G,scope:{initializedJ0:true}},{source:{sameActualGlobalCurrent:true}}])
    assert.throws(()=>attachInitializedMeanOperatorMajorants(fake,p),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.throws(()=>assertInitializedMeanOperatorMajorants({scope:{actualFixedSourceOperatorBoundToNewCurrentDefects:true}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('the complete source program is hashable, contains actual norm bodies and preserves all current-class limitations',async()=>{
  const p=await get();certificate=await originalMeanMapOperatorCertificate(p);
  assert.equal(certificate.schema,'MathScope.N6.ActualFixedMeanOperatorCertificate/1');
  assert.equal(certificate.graph.sha256,await sha256(canonicalStringify(certificate.program)));
  assert.ok(certificate.graph.nodeCount>40000);
  assert.equal(certificate.graph.nodeCount,certificate.program.nodes.length);
  assert.equal(certificate.actualInputDefectNormsStillRequired,true);
  assert.equal(certificate.scope.allOrdersLiterallyExecuted,false);
  assert.equal(certificate.scope.currentDefectClassCertified,false);
  assert.equal(certificate.scope.wholeN6Complete,false);
  const path=process.env.MATHSCOPE_FIXED_MEAN_MAJORANT_ARTIFACT;
  if(path)fs.writeFileSync(path,JSON.stringify({schema:'MathScope.N6.FixedMeanMajorantObservedArtifact/1',certificate,
    independentInputs:{seed:originalMeanSeedFlatJets({order:8,maxWork:10000}),support:{lower:'1',
      upperRationalStrict:'2',collar:['1/2','5/2'],outerInterval:['0','5'],eta:['-1','1'],hStrictUpper:'1/16'},
      leibniz:p.byOrder.map(row=>({order:row.order,requiredTargetDerivativeOrder:row.requiredTargetDerivativeOrder,
        coefficientSum:row.leibnizCoefficientSum,addedSPower:row.sPolynomialPower}))},
    actualInitializedMeanAttachmentExecuted:false,actualInputClassNormsAvailable:false,wholeN6Complete:false},null,2)+'\n');
});
