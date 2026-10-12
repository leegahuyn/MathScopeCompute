import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {prepareOriginalRadialClassMajorants,assertOriginalRadialClassMajorants}
  from '../source-radial-class-majorants.mjs';
import {originalPressureClassDerivativeDemand,copyClosedOriginalSourceConstants,originalRadialPhaseUpperFactorization,
  exactCompleteRadialCovarianceForce,exactRadialCovarianceForceJet,radialCovarianceForceMajorant}
  from '../source-pressure-class-kernel.mjs';
import {attachGlobalRadialPressureClass,assertGlobalRadialPressureClass}
  from '../source-global-pressure-class-majorants.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {radialFactorial} from '../source-radial-class-kernel.mjs';

const G=new ActualConvergentExpressions(),q=(a,b=1)=>G.q(a,b),
  R=G.fresh('pressure_fixture_R'),Z=G.fresh('pressure_fixture_Z'),T=G.fresh('pressure_fixture_T'),
  Y=[G.fresh('pressure_fixture_Y0'),G.fresh('pressure_fixture_Y1')],directions=[R,Z,T,...Y],
  W={rr:G.mul(G.pow(R,5),G.add(G.one,Z,G.pow(Z,2)),G.add(G.one,T,G.pow(T,2)),
      G.add(G.one,Y[0],G.pow(Y[0],3)),G.add(G.one,Y[1],G.pow(Y[1],2))),
    rz:G.mul(G.pow(R,4),G.add(G.one,G.pow(Z,3)),G.add(G.one,T,G.pow(T,3)),G.add(G.one,Y[0],Y[1],G.mul(Y[0],Y[1]))),
    thetatheta:G.mul(G.add(G.pow(R,3),G.pow(R,4)),G.add(G.one,Z,T),G.add(G.one,G.pow(Y[0],2),G.pow(Y[1],3)))},
  input={R,Z,T,Y,W,epsilon:G.one,radialFast:G.mul(q(3),G.pow(R,2))},fixtures={};
const indices=(m)=>{
  const out=[];const walk=(prefix,left)=>{if(prefix.length===4){for(let n=0;n<=left;n++)out.push([...prefix,n]);return;}
    for(let n=0;n<=left;n++)walk([...prefix,n],left-n);};walk([],m);return out;
};

test('every finite pressure demand keeps the extra covariance derivative and full m+2p+4 IBP input',()=>{
  fixtures.demands=[];
  for(let m=0;m<=12;m++)for(let p=0;p<=5;p++){
    const d=originalPressureClassDerivativeDemand({order:m,ibpOrder:p});fixtures.demands.push(d);
    assert.equal(d.primitiveInputCovarianceOrder,m+1);
    assert.equal(d.requiredCommonYCovarianceOrder,p===0?m+1:m+2*p+4);
    assert.equal(d.requiredBackgroundSlowOrder,d.requiredCommonYCovarianceOrder+3);
    assert.equal(d.requiredTargetWeightedOrder,d.requiredCommonYCovarianceOrder+1);
    assert.equal(d.sourceAuthenticated,false);
  }
  assert.equal(fixtures.demands[0].requiredCommonYCovarianceOrder,1);
  for(const bad of [{order:-1},{order:1.5},{ibpOrder:-1},{norm:2},{order:Number.MAX_SAFE_INTEGER}])
    assert.throws(()=>originalPressureClassDerivativeDemand(bad));
});

test('the exact discrete original radial scale factors without replacing the floor or original h',()=>{
  const ell=G.fresh('pressure_fixture_ell'),p=originalRadialPhaseUpperFactorization(G,{ell});
  assert.equal(p.identity.pass,true);assert.equal(G.nodes[p.index].op,'multiply');
  assert.equal(p.h,G.parameter('h'));assert.equal(p.kappa,q(1,100000));
  assert.equal(p.upperConstant,G.one);assert.equal(p.additionalSPower,0);
  assert.equal(p.sourceAuthenticated,false);assert.equal(p.continuousBandScaleSubstituted,false);
  assert.deepEqual(p.factors.length,3);fixtures.phase=p;
});

test('the original complete radial force retains all five signed terms and both irrational torus directions',()=>{
  const f=exactCompleteRadialCovarianceForce(G,input),t=f.terms;
  const expanded=G.add(G.neg(t.slowRadial),G.neg(t.fastRadial),G.neg(t.connectionRR),G.neg(t.axial),t.connectionTheta),
    proof=createFactoredRationalVerifier(G,{maxProducts:1000000});
  assert.equal(proof(G.sub(f.value,expanded)).pass,true);assert.deepEqual(f.vr,[G.one,G.sub(G.one,G.sqrt(q(2)))]);
  assert.equal(f.allFiveTermsRetained,true);assert.equal(f.sourceAuthenticated,false);
  for(const [name,term]of Object.entries(t)){
    assert.notEqual(term,G.zero);assert.equal(proof(term).pass,false,name+' is a genuine nonzero term');
  }
  fixtures.force=f;
});

test('all56 five-coordinate jets through order3 execute complete coefficient and covariance Leibniz terms',()=>{
  const jets=indices(3).map(orders=>exactRadialCovarianceForceJet(G,input,{orders,maxWork:100000}));
  assert.equal(jets.length,56);
  for(const j of jets){
    assert.equal(j.identity.pass,true,'mixed '+j.orders.join(','));
    assert.equal(j.radialRows.length,j.orders[0]+1);
    assert.equal(j.requiredCovarianceOrder,j.order+1);
    assert.ok(j.radialRows.every(r=>r.covarianceJets.auxiliary.length===2));
  }
  assert.ok(jets.filter(j=>j.direct!==G.zero).length>40);
  fixtures.jets=jets;
});

test('omitting either cylindrical connection, the epsilon axial term or one auxiliary direction is rejected',()=>{
  const f=fixtures.force,verify=createFactoredRationalVerifier(G,{maxTerms:100000,maxProducts:1000000}),
    wrong=[G.add(f.value,f.terms.connectionRR),G.sub(f.value,f.terms.connectionTheta),G.add(f.value,f.terms.axial),
      G.add(f.value,G.mul(input.radialFast,f.vr[1],G.derivative(W.rr,Y[1])))];
  fixtures.negatives=wrong.map(value=>({value,difference:G.sub(f.value,value)}));
  for(const row of fixtures.negatives)assert.equal(verify(row.difference).pass,false);
});

test('fixed-band differentiation rejects an epsilon or fast multiplier with an unretained slow dependence',()=>{
  for(const changed of [{...input,epsilon:Z},{...input,radialFast:G.mul(input.radialFast,T)},
    {...input,Y:[Y[0],Y[0]]},{...input,W:{rr:W.rr,rz:W.rz}}])
    assert.throws(()=>exactCompleteRadialCovarianceForce(G,changed),{code:'INVALID_INPUT'});
  assert.throws(()=>exactRadialCovarianceForceJet(G,input,{orders:[1,0,0,0,0],maxWork:1}),{code:'RESOURCE_LIMIT'});
});

test('the full positive norm majorant uses W throughm+1 and retains the exact sqrt2 l1 coefficient',()=>{
  const B=q(2),inputNorm=q(10000000),bounds=Array.from({length:6},(_,j)=>G.mul(q(radialFactorial(j+4)),G.pow(B,j+4)));
  fixtures.majorants=Array.from({length:5},(_,m)=>radialCovarianceForceMajorant(G,{order:m,radiusBase:B,
    directPowerDerivativeBounds:bounds,inputNorm,maxWork:1000}));
  for(const [m,r]of fixtures.majorants.entries()){
    assert.equal(r.rows.length,m+1);assert.equal(r.originalLNorm,G.sqrt(q(2)));
    assert.equal(r.constant,G.mul(inputNorm,r.multiplier));assert.equal(r.inputDerivativeOrder,m+1);
    assert.equal(r.outputEpsilonExponent,'1-kappa_s');assert.equal(r.addedSPower,0);
    assert.equal(r.sourceAuthenticated,false);assert.equal(r.numericalInputNormAcceptedAsSourceAuthority,false);
  }
  assert.throws(()=>radialCovarianceForceMajorant(G,{order:5,radiusBase:B,directPowerDerivativeBounds:bounds,inputNorm}),{code:'INVALID_INPUT'});
  fixtures.normDomain={R:['1','2'],otherCoordinates:['-1','1'],epsilon:'1',M:'1',dr:'3',inputNorm};
});

test('closed fixed-source copying keeps the exact mass integrand, endpoints, step, maximum and positive roots',()=>{
  const H=new ActualConvergentExpressions(),x=G.fresh('pressure_fixture_integral'),
    body=G.inv(G.add(G.one,G.pow(x,2))),mass=G.integral(body,x,G.zero,G.one),
    mixed=G.maximum(G.mul(q(4),mass),G.sqrt(q(2)),G.step(q(1,3),2),G.exp(G.neg(G.parameter('h')))),
    copied=copyClosedOriginalSourceConstants(G,H,[mass,mixed],{maxWork:10000});
  assert.equal(copied.allCopiedRootsClosed,true);assert.equal(copied.sourceAuthenticated,false);
  const newMass=copied.mapping.get(mass),node=H.nodes[newMass];assert.equal(node.op,'definite_integral');
  assert.equal(H.nodes[node.args[1]].op,'coordinate');assert.notEqual(H.nodes[node.args[1]].args[0],G.nodes[x].args[0]);
  assert.equal(node.args[2],H.zero);assert.equal(node.args[3],H.one);
  assert.ok(copied.identities.some(r=>r.operation==='source_step_derivative'));
  assert.ok(copied.identities.some(r=>r.operation==='maximum'));
  fixtures.copy={sourceRoots:[mass,mixed],targetRoots:copied.roots.map(r=>r.targetRoot),identities:copied.identities,
    targetProgram:H.pack({mass:newMass,mixed:copied.mapping.get(mixed)})};
});

test('closed copying rejects absent signatures, different signatures, open coordinates and unknown function operators',()=>{
  const H=new ActualConvergentExpressions();
  assert.throws(()=>copyClosedOriginalSourceConstants({source:{}},{source:{}},[]),{code:'INVALID_INPUT'});
  assert.throws(()=>copyClosedOriginalSourceConstants(G,{source:{parameterExpressionSHA256:'0'.repeat(64)}},[]),{code:'INVALID_INPUT'});
  assert.throws(()=>copyClosedOriginalSourceConstants(G,H,[R]),{code:'INVALID_INPUT'});
  const unknown=G.node('unproved_caller_norm',[]);
  assert.throws(()=>copyClosedOriginalSourceConstants(G,H,[unknown]),{code:'UNSUPPORTED_SOURCE_CONSTANT'});
  assert.throws(()=>copyClosedOriginalSourceConstants(G,H,[fixtures.phase.h],{maxWork:0}),{code:'INVALID_INPUT'});
});

test('the actual original fixed radial constants copy completely with their pressure-rho product and two Gaussian edges',async()=>{
  const radial=await prepareOriginalRadialClassMajorants({order:0,pole:18,ibpOrder:1,maxWork:200000,maxNodes:200000}),
    H=new ActualConvergentExpressions(),roots=[radial.geometry.B,radial.phase.dr,radial.phase.kappa,radial.phase.rho,
      radial.weight.wholeIntegralConstant,radial.geometry.middleZetaInverse,
      ...radial.pressureInput.flatMap(r=>[r.wholeHaarProjectionConstant,r.rhoWeightedNorm,r.constant]),
      radial.pressureRows[0].pressureConstant,radial.cutoff.rows[1].bound,
      radial.change.exponents[0].throughOrder[0].transformedSource,
      radial.change.exponents[0].throughOrder[0].outputPrefactor,
      radial.change.exponents[0].throughOrder[0].outputComposition],
    copied=copyClosedOriginalSourceConstants(radial.G,H,roots,{maxWork:200000});
  assert.equal(assertOriginalRadialClassMajorants(radial),true);assert.ok(copied.identities.length>50);
  assert.equal(copied.roots.length,roots.length);assert.ok(copied.roots.every(r=>H.freeCoordinates(r.targetRoot).size===0));
  fixtures.actualFixedCopy={sourceNodes:radial.G.nodes.length,copiedNodes:copied.work,
    sourceParameterSHA256:radial.source.parameterExpressionSHA256,rootCount:roots.length,
    originalPole:18,sourceClassAuthority:false,actualCurrentAttachmentExecuted:false};
});

test('private pressure class authority cannot be hydrated from arrays, an archive or a caller norm',()=>{
  for(const fake of [{},{scope:{actualFiniteDerivativeOrder:100,actualFullCovarianceMOneClassCertified:true}},
    {bounds:{rows:[{order:1,fields:{fullCovariance:{constant:G.one,epsilonExponent:'1'}}}]}},
    {sourceAuthenticated:true,actualCompleteGrInputNormsConstructed:true}]){
    assert.throws(()=>attachGlobalRadialPressureClass(fake,{}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    assert.throws(()=>assertGlobalRadialPressureClass(fake),{code:'INVALID_SOURCE_CONSTRUCTION'});
  }
});

after(async()=>{
  if(process.env.MATHSCOPE_PRESSURE_CLASS_DIRECTORY){
    const payload={schema:'MathScope.N6.PressureClassKernelFixtures/1',fixtures,
      program:G.pack({R,Z,T,Y,W}),actualCurrentAttachmentExecuted:false,actualInputNormFromFixtureIsNotSourceAuthority:true,
      sourceAuthenticated:false,completeN6:false};
    await writeFile(process.env.MATHSCOPE_PRESSURE_CLASS_DIRECTORY+'/pressure-class-kernel.json',JSON.stringify(payload,null,2)+'\n');
  }
});
