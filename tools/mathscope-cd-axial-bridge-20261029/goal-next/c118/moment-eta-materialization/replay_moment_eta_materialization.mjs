import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,c117StructuralPath,c117FamiliesPath,requestedArg,familySuffix,output]=process.argv.slice(2);
const chosen=Number(requestedArg);
assert.ok(output&&Number.isSafeInteger(chosen)&&chosen>3&&chosen<Number.MAX_SAFE_INTEGER,'Supply two C117 receipts, a caller-selected eta degree above three, an actual family suffix and a fresh output file');
const sha=b=>createHash('sha256').update(b).digest('hex');
const hashJson=o=>sha(JSON.stringify(o));
async function readPinned(path,digest){
  const body=await readFile(path);
  assert.equal(sha(body),digest,path);
  return JSON.parse(body);
}
const structuralPin='c6118b7dbc26065850d4c13d15da30310f5c7f9b66eb425ffbbca7b06d8eb07c';
const familiesPin='f80b0b68c74e110c1040595a9f40f08e17d86764da87062839eeaf6931f8d7a5';
const [structural,earlier]=await Promise.all([readPinned(c117StructuralPath,structuralPin),readPinned(c117FamiliesPath,familiesPin)]);
for(const [module,digest] of Object.entries(structural.originalSourceSHA256)){
  assert.equal(sha(await readFile(resolve(runtime,module))),digest,module);
}
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const mod=await load('actual-positive-global-stress.mjs');
const {ActualInductionExpressions}=await load('actual-residual-order-induction-expressions.mjs');
const live=mod.prepareActualPositiveGlobalStress({order:2,maxNodes:2000000,maxDerivativeOrder:16});
assert.ok(mod.assertActualPositiveGlobalStress(live));
const G=live.G, list=live.momentFamilies;
const bootstrap=live.moments.pressure.primitives.prepared.bootstrap;
const {X,eta,Xv}=bootstrap.constants,{Xplus,Xb}=bootstrap.orderOne;
assert.equal(eta,G.core.eta);assert.equal(eta,2);
assert.equal(live.request.throughOrder,2);
assert.deepEqual(list.map(f=>({name:f.name,system:f.system,body:f.actualBody})),earlier.results);
assert.deepEqual(live.stressRows.map(r=>({n:r.order,component:r.component,forward:r.sourceForwardIntegral,backward:r.sourceBackwardIntegral})),earlier.stress);
const protectedGraph={nodes:G.nodes.length,nodeSHA256:hashJson(G.nodes),definitions:G.captureFunctionDefinitions()};
function isolate(maxDerivativeOrder){
  const A=new ActualInductionExpressions(G,{maxNodes:2000000,maxDerivativeOrder});
  // The normal scratch constructor enlarges inherited derivative limits.
  // Restore byte-identical definitions, so only the appended alias below has the caller's limit.
  A.expressionSystems=structuredClone(G.expressionSystems);
  assert.equal(hashJson(A.nodes),protectedGraph.nodeSHA256);
  assert.ok(A.functionDefinitionsUnchanged(protectedGraph.definitions));
  assert.notEqual(A.nodes,G.nodes);
  return A;
}
function resource(fn){
  let deny;
  try{fn();}catch(e){assert.equal(e.code,'RESOURCE_LIMIT');deny=e.message;}
  assert.ok(deny);
  return deny;
}
function derive(A,root,order){
  let source=root;
  for(let j=0;j<order;j++)source=A.derivative(source,eta);
  return source;
}
function lexicalFree(A,root){return [...A.freeCoordinates(root)].sort((x,y)=>x-y);}
function fixedIntegral(A,source,order,outer){
  const node=A.nodes[source];
  assert.equal(node.op,'definite_integral');
  const [integrand,binder,lo,hi]=node.args;
  assert.deepEqual([lo,hi],[A.zero,outer]);
  assert.equal(A.nodes[binder].op,'coordinate');
  assert.notEqual(binder,eta);assert.notEqual(binder,X);
  assert.equal(A.derivative(lo,eta),A.zero);assert.equal(A.derivative(hi,eta),A.zero);
  assert.deepEqual(lexicalFree(A,lo),[]);assert.deepEqual(lexicalFree(A,hi),[]);
  const bodyDerivative=derive(A,integrand,order),expected=A.integral(bodyDerivative,binder,lo,hi);
  return {domain:[lo,hi],binder,integrand,bodyDerivative,expected,
    interpretation:'ordinary eta differentiation of the compact fixed-endpoint integral, conditional on ordinary uniform regularity of the original density including joins'};
}
function sameBodyAlias(A,family,degree,tag,{allowNestedLimit=false}={}){
  const old=A.expressionSystems[family.system];
  assert.deepEqual(old.parameters,[eta]);assert.equal(old.body,family.actualBody);assert.deepEqual(old.derivativeLimits,[2]);
  const candidate=A.defineExpressionFunction({name:tag+'_'+family.name,parameters:old.parameters,body:old.body,derivativeLimits:[degree]});
  assert.deepEqual(A.expressionSystems[candidate].parameters,old.parameters);
  assert.equal(A.expressionSystems[candidate].body,family.actualBody);
  const derivative=A.expressionValue(candidate,[eta],[degree]);
  assert.deepEqual(A.nodes[derivative].args,[candidate,[eta],[degree]]);
  const originalDenial=resource(()=>A.expressionValue(family.system,[eta],[3]));
  assert.equal(originalDenial,'The shared body derivative budget is exhausted.');
  const attemptedAliasDegree=degree+1;
  const aliasDenial=resource(()=>A.expressionValue(candidate,[eta],[attemptedAliasDegree]));
  assert.equal(aliasDenial,'The shared body derivative budget is exhausted.');
  const base={name:family.name,originalSystem:family.system,originalBody:family.actualBody,alias:candidate,
    derivative,originalDenial,attemptedAliasDegree,aliasDenial};
  let direct,realized;
  try{
    direct=derive(A,family.actualBody,degree);
    realized=A.materializeExpressionFunction(candidate,[eta],[degree]);
  }catch(error){
    if(!allowNestedLimit||error.code!=='RESOURCE_LIMIT')throw error;
    return {...base,state:'RESOURCE_LIMIT_DURING_ORIGINAL_BODY_MATERIALIZATION',message:error.message,
      graphWideLimit:A.maxDerivativeOrder,acceptedOuterAliasDerivativeOrder:degree};
  }
  assert.equal(realized,direct);
  const freeCoordinates=lexicalFree(A,realized);
  assert.ok(freeCoordinates.every(v=>v===eta));
  return {...base,state:'EXACT_MATERIALIZED_SAME_BODY',materialized:realized,direct,freeCoordinates};
}
const thirdCopy=isolate(16);
const third=list.map((f,index)=>{
  const row=sameBodyAlias(thirdCopy,f,3,'third_eta_same_body');
  const leading=f.name==='ActualSourceLeadingSubtractedAngularZero';
  if(leading){
    const proof=live.leading.angular;
    assert.equal(proof.actualSubtractedMomentRoot,f.actualBody);
    assert.ok(proof.normalizationCheck.pass&&proof.originalAuditProof.constantOfIntegrationIncluded);
    assert.ok(proof.originalAuditProof.pass&&!proof.originalAuditProof.heatChangeAloneUsedAsWholeMoment);
    return {...row,endpoint:{kind:'complete physical subtracted angular invariant (5.19)',
      terminalSourceGuard:Xb,subtractedTermIndependentOfPhysicalZ:true,originalConstantOfIntegrationRetained:true,
      originalImproperUnrenormalizedIntegralUsed:false,requiresOriginalAngularRegularityForIntegralInterpretation:true}};
  }
  const fixed=fixedIntegral(thirdCopy,f.actualBody,3,index===0?Xv:Xplus);
  assert.equal(row.materialized,fixed.expected);
  return {...row,endpoint:fixed};
});
assert.equal(third.length,12);
assert.equal(new Set(third.filter(v=>v.endpoint.domain).map(v=>v.endpoint.binder)).size,11);
assert.ok(thirdCopy.functionDefinitionsUnchanged(protectedGraph.definitions));
assert.equal(hashJson(thirdCopy.nodes.slice(0,protectedGraph.nodes)),protectedGraph.nodeSHA256);

const f=list.find(row=>row.name.endsWith(familySuffix));
assert.ok(f&&familySuffix.length>0&&list.filter(row=>row.name.endsWith(familySuffix)).length===1,'Give the exact unique source family suffix');
const chosenCopy=isolate(Math.max(16,chosen+1));
const requested=sameBodyAlias(chosenCopy,f,chosen,'caller_requested_eta_limit',{allowNestedLimit:true});
if(f.name!=='ActualSourceLeadingSubtractedAngularZero'){
  const [integrand,binder,lower,upper]=chosenCopy.nodes[f.actualBody].args;
  const call=chosenCopy.nodes[integrand];
  assert.equal(call.op,'actual_expression_partial');
  const [system,args,oldOrders]=call.args,nativePosition=args.indexOf(eta);
  assert.ok(nativePosition>=0&&args.includes(binder));
  const definition=chosenCopy.expressionSystems[system],limits=definition.derivativeLimits;
  const newOrders=oldOrders.map((v,j)=>j===nativePosition?v+chosen:v);
  const nested={system,sourceBody:definition.body,arguments:args,limits,requestedOrders:newOrders,domain:[lower,upper]};
  if(requested.state==='EXACT_MATERIALIZED_SAME_BODY'){
    requested.endpoint=fixedIntegral(chosenCopy,f.actualBody,chosen,f===list[0]?Xv:Xplus);
    assert.equal(requested.materialized,requested.endpoint.expected);
    nested.directMaterializationCall=chosenCopy.expressionValue(system,args,newOrders);
    assert.equal(nested.directMaterializationCall,requested.endpoint.bodyDerivative);
  }else if(newOrders.some((v,j)=>v>limits[j])){
    nested.directMaterializationDenial=resource(()=>chosenCopy.expressionValue(system,args,newOrders));
    assert.equal(nested.directMaterializationDenial,requested.message);
  }
  requested.originalNestedIntegralOperand=nested;
}
assert.ok(chosenCopy.functionDefinitionsUnchanged(protectedGraph.definitions));
assert.equal(hashJson(chosenCopy.nodes.slice(0,protectedGraph.nodes)),protectedGraph.nodeSHA256);
assert.equal(G.nodes.length,protectedGraph.nodes);
assert.equal(hashJson(G.nodes),protectedGraph.nodeSHA256);
assert.deepEqual(G.captureFunctionDefinitions(),protectedGraph.definitions);
assert.ok(mod.assertActualPositiveGlobalStress(live));

const result={schema:'MathScope.C118.OriginalActualMomentSameBodyEtaMaterialization/1',
  C117:{structuralSHA256:structuralPin,actualFamiliesSHA256:familiesPin},X,eta,Xv,Xplus,Xb,
  protected:{nodes:protectedGraph.nodes,nodeSHA256:protectedGraph.nodeSHA256,definitionsSHA256:hashJson(protectedGraph.definitions),
    originalGraphUnchanged:true,originalDefinitionsUnchanged:true,operatingSourceTouched:false,privateSealRechecked:true},
  thirdEta:{requested:3,count:third.length,fixedEndpointIntegralCount:11,originalSubtractedAngularCount:1,
    scratchNodeCount:thirdCopy.nodes.length,rows:third},
  callerChosen:{degree:chosen,scratchNodeCount:chosenCopy.nodes.length,topWrapperOnly:true,
    originalNestedDefinitionsUnchanged:true,arbitraryCallerDepthAlwaysSucceeds:false,row:requested},
  ordinaryMeaning:'Exact symbolic AD; differentiation under the integral is interpreted for the 11 fixed compact integrals only with original ordinary mixed regularity. The remaining angular body uses the separately authenticated complete physical subtracted invariant (5.19).',
  numericalZerosOrPhysicalFinalJetsCertified:false,generalY:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({eta,protected:result.protected.nodes,third:result.thirdEta.rows.map(v=>v.materialized),fixed:result.thirdEta.fixedEndpointIntegralCount,
  chosen:result.callerChosen,oldGraphUnchanged:result.protected.originalGraphUnchanged}));
