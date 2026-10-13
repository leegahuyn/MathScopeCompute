import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {originalInitialHaarResidualDemand,exactInitialHaarResidualSplit,composeOriginalInitialHaarResidualRows}
  from '../source-initial-haar-class-kernel.mjs';
import {DeferredSourceNormScalars} from '../source-deferred-norm-scalars.mjs';
import {openSavedInitializedSource,savedInitializedSourceProgram} from '../source-saved-initialized-authority.mjs';
import {attachSavedInitializedNormFamily,constructSavedInitializedNormProgram} from '../source-saved-initialized-norm-family.mjs';
import {attachSavedInitialHaarResidualNorm,assertSavedInitialHaarResidualNorm,savedInitialHaarResidualNormCertificate}
  from '../source-saved-initial-haar-class.mjs';

const G=new ActualConvergentExpressions(),q=(a,b=1)=>G.q(a,b),R=G.fresh('haar_R'),Z=G.fresh('haar_Z'),T=G.fresh('haar_T'),
  common=G.mul(G.add(q(1),Z,G.pow(Z,2)),G.add(q(1),T,G.pow(T,2))),
  leading=[G.mul(G.pow(R,4),common),G.mul(q(3),G.pow(R,3),common)],
  higher=[G.mul(G.pow(R,5),common),G.mul(q(2),G.pow(R,4),common)],
  remainder=[G.mul(q(2),G.pow(R,6),common),G.mul(q(5),G.pow(R,5),common)],
  W={rtheta:G.add(leading[0],remainder[0]),rz:G.add(leading[1],remainder[1]),
    thetaz:G.mul(q(7),G.pow(R,3),common),zz:G.mul(q(11),G.pow(R,4),common)},
  pressure=G.mul(q(13),G.pow(R,2),common),input={R,Z,T,epsilon:q(1,2),haarCovariance:W,
    leadingStress:leading,higherStress:higher,haarPressure:pressure},fixture={};
let actualPending;
async function actual(){
  return actualPending??=(async()=>{
    const cap=await openSavedInitializedSource(),family=attachSavedInitializedNormFamily(cap),
      parent=constructSavedInitializedNormProgram(family,{order:0}),haar=attachSavedInitialHaarResidualNorm(cap,parent,{order:0});
    return {cap,family,parent,haar};
  })();
}

test('the arbitrary finite Haar demand retains next-order curl, stress and full pressure derivatives',()=>{
  fixture.demands=Array.from({length:41},(_,order)=>originalInitialHaarResidualDemand({order}));
  for(const d of fixture.demands){assert.equal(d.requiredPrimaryHaarOrder,d.order+1);assert.equal(d.requiredCommonYOrder,d.order+2);
    assert.equal(d.requiredTargetWeightedOrder,d.order+3);assert.equal(d.requiredBackgroundSlowOrder,d.order+5);}
  for(const input of [{order:-1},{order:.5},{order:Number.MAX_SAFE_INTEGER},{norm:1}])assert.throws(()=>originalInitialHaarResidualDemand(input));
});

test('both full identities (9.11) and every mixed derivative through total order three execute exactly',()=>{
  const split=exactInitialHaarResidualSplit(G,input),verify=createFactoredRationalVerifier(G,{maxTerms:100000,maxProducts:1000000});
  fixture.split=split;fixture.jets=[];
  for(let a=0;a<=3;a++)for(let b=0;b<=3-a;b++)for(let c=0;c<=3-a-b;c++){
    const orders=[a,b,c],jet=x=>orders.reduce((body,n,j)=>{for(let k=0;k<n;k++)body=G.derivative(body,[R,Z,T][j]);return body;},x),
      rows=split.rows.map(r=>{const left=jet(r.direct),right=jet(r.decomposed),identity=verify(G.sub(left,right));
        assert.equal(identity.pass,true);return {name:r.name,left,right,identity};});
    fixture.jets.push({orders,rows});
  }
  assert.equal(fixture.jets.length,20);
  assert.equal(split.curlCovarianceRemainderDeclaredZero,false);assert.equal(split.higherOriginalStressDeclaredZero,false);
  assert.equal(split.fullPressureDerivativeRetained,true);assert.equal(split.actualPrimaryCovarianceIdentityStillRequired,true);
});

test('discarding a curl remainder, higher original stress or axial pressure changes the exact residual',()=>{
  const verify=createFactoredRationalVerifier(G,{maxTerms:100000,maxProducts:1000000});fixture.omissions=[];
  for(const row of fixture.split.rows)for(const key of ['radialCurlCovariance','higherOriginalStress',...(row.name==='Ez'?['fullAxialPressure']:[])]){
    const wrong=G.sub(row.decomposed,row.terms[key]),difference=G.sub(row.direct,wrong),identity=verify(difference);
    assert.equal(identity.pass,false);fixture.omissions.push({name:row.name,key,difference});
  }
});

test('all through-order norm convolutions retain every connection coefficient and the exact original positive margin',()=>{
  const S=new DeferredSourceNormScalars(),field=(n,pole,exponent)=>({constant:S.q(n),power:2,pole,epsilonExponent:exponent,weight:'zeta',gaussian:'1'}),
    rows=(base,pole,exponent)=>Array.from({length:5},(_,order)=>({order,field:field(base+order,pole+order,exponent)})),
    args={order:3,radiusBase:S.q(2),covarianceRemainderRows:rows(11,3,'2-2*kappa_s'),
      fullHaarCovarianceRows:rows(19,4,'1'),higherStressRows:rows(29,5,'3'),pressureRows:rows(37,6,'1-kappa_s')},
    products=composeOriginalInitialHaarResidualRows(S,args);
  for(const r of products.rows){assert.equal(r.completeInverseRadiusLeibnizTerms,r.order+1);
    for(const f of Object.values(r.fields)){assert.equal(f.epsilonExponent,'2-2*kappa_s');assert.equal(f.positiveMarginOverOriginalRequirement,'499/50000');
      assert.equal(f.retainedTermExponents.fullAxialCovariance,'2');}
    assert.equal(r.fields.Ez.retainedTermExponents.fullAxialPressure,'2-kappa_s');
  }
  fixture.normFixture={nodes:S.nodes,input:args,products};
  assert.throws(()=>composeOriginalInitialHaarResidualRows(S,{...args,order:4}),{code:'RESOURCE_LIMIT'});
  const bad=structuredClone(args);bad.higherStressRows[0].field.epsilonExponent='1';
  assert.throws(()=>composeOriginalInitialHaarResidualRows(S,bad));
});

test('the genuine saved source matches all six complete common-Y and Haar fields and executes its C0 Haar norm',async()=>{
  const {cap,parent,haar}=await actual();assert.equal(assertSavedInitialHaarResidualNorm(haar),true);
  assert.equal(haar.source.sourceNodePrefixSHA256,cap.source.sourceNodePrefixSHA256);
  assert.equal(haar.sourceBinding.fields.length,6);
  for(const f of haar.sourceBinding.fields){assert.equal(f.completeCommonYDefinition.rows.length,162);assert.equal(f.completeHaarDefinition.rows.length,81);
    assert.equal(f.actualSignLocalDefinitions.length,2);assert.equal(f.actualCommonYRoot,cap.actualRoots.covariance[f.name]);}
  assert.deepEqual(haar.scalarProgram.nodes.slice(0,parent.scalarProgram.nodes.length),parent.scalarProgram.nodes);
  assert.equal(haar.scope.actualFiniteHaarNormCompositionExecuted,true);
  assert.equal(haar.scope.initialHaarResidualExponent,'149/100');
  assert.equal(haar.scope.initializedTangentialResidualClassComplete,false);
  assert.equal(haar.sourceBinding.leadingIdentity.literalOriginalIdentityFunctionReexecutedOnHydratedLiveCurrent,false);
  assert.equal(haar.sourceBinding.leadingIdentity.wholeCovarianceDeclaredEqualToLeadingTarget,false);
});

test('caller records, omitted source rows, changed norm inputs and promoted completion flags cannot pass the private Haar seal',async()=>{
  const {cap,parent,haar}=await actual();
  for(const fake of [{},structuredClone(cap),{source:cap.source}])assert.throws(()=>attachSavedInitialHaarResidualNorm(fake,parent));
  assert.throws(()=>attachSavedInitialHaarResidualNorm(cap,structuredClone(parent)));
  assert.throws(()=>assertSavedInitialHaarResidualNorm(structuredClone(haar)));
  const row=haar.sourceBinding.fields[0].completeCommonYDefinition.rows.pop();
  assert.throws(()=>assertSavedInitialHaarResidualNorm(haar),{code:'INVALID_SAVED_INITIAL_HAAR_CLASS'});
  haar.sourceBinding.fields[0].completeCommonYDefinition.rows.push(row);
  const old=haar.rows[0].fields.Ez.constant;haar.rows[0].fields.Ez.constant=0;
  assert.throws(()=>assertSavedInitialHaarResidualNorm(haar),{code:'INVALID_SAVED_INITIAL_HAAR_CLASS'});haar.rows[0].fields.Ez.constant=old;
  haar.scope.completeN6=true;assert.throws(()=>assertSavedInitialHaarResidualNorm(haar));haar.scope.completeN6=false;
  assert.equal(assertSavedInitialHaarResidualNorm(haar),true);
});

test('the complete observed source, source-bound Haar program and all retained terms are exported losslessly',async()=>{
  const {cap,parent,haar}=await actual(),p=savedInitializedSourceProgram(cap),certificate=await savedInitialHaarResidualNormCertificate(haar),
    ids=[...Object.values(cap.actualRoots.background),...Object.values(cap.actualRoots.covariance),...cap.actualRoots.originalStress,
      ...Object.values(cap.actualRoots.temporalVelocity),...Object.values(cap.actualRoots.initializedVelocity),
      cap.actualRoots.temporalPressure.value,cap.actualRoots.initializedPressure.value,...Object.values(cap.actualRoots.freshInputDefects),
      ...Object.values(cap.actualRoots.initializedDefects),...Object.values(cap.actualRoots.retainedRemainderDefects),
      ...haar.sourceBinding.fields.map(f=>f.actualHaarRoot)];
  assert.deepEqual(certificate.program,haar);assert.match(certificate.graph.sha256,/^[0-9a-f]{64}$/);
  fixture.actual={source:cap,parent,certificate,selectedNodeBindings:[...new Set(ids)].sort((a,b)=>a-b).map(id=>({id,node:p.node(id)}))};
});

after(async()=>{
  if(process.env.MATHSCOPE_INITIAL_HAAR_DIRECTORY&&fixture.actual)await writeFile(
    process.env.MATHSCOPE_INITIAL_HAAR_DIRECTORY+'/initial-haar-class.json',
    JSON.stringify({schema:'MathScope.N6.InitialHaarClassObservedGate/1',fixture,
      graph:{nodes:G.nodes,coordinates:{R,Z,T}},processObservation:{pid:process.pid,rssBytes:process.memoryUsage().rss,maxRSSBytes:process.resourceUsage().maxRSS*1024},
      actualSavedHaarNormProgramExecuted:true,allHighOrderSourceBodiesMaterialized:false,
      wholeInitializedTangentialResidualClassCertified:false,completeN6:false},null,2)+'\n',{flag:'wx'});
});
