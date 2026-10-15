import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 PICARD_AVERAGE_EXPECTED_NODES,prepareActualPicardAverageCollar,
 validateActualPicardAverageSource,restrictActualPositiveOrderCollar,
 proveActualPicardAverageCollar,runPicardAverageCollarCLI
} from './actual_picard_average_collar.mjs';

const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const kernelRoot=process.env.MATHSCOPE_KERNEL_ROOT??repo;
const diagnosticsPath=process.env.MATHSCOPE_DIAGNOSTICS??resolve(repo,
 'research-ide/mathscope-m3/evidence/n6-continuation-20261015/run-38734477166/NATIVE_DOMAIN_DIAGNOSTICS.json');
const ready=prepareActualPicardAverageCollar({kernelRoot,diagnosticsPath});
let otherReady;
const other=()=>otherReady??=prepareActualPicardAverageCollar({kernelRoot,diagnosticsPath});
const clone=v=>structuredClone(v);
const changedReader=(G,id,change)=>i=>{
 if(i!==id)return G.nodes[i];
 const value=clone(G.nodes[i]);change(value);return value;
};

test('actual literal average, eta average and positive-order collar bodies bind',async()=>{
 const context=await ready,result=await proveActualPicardAverageCollar(context);
 assert.equal(result.schema,'MathScope.N6.ActualPicardAverageCollar/1');
 assert.equal(result.actualAverageBinding.sourceAverage,29336);
 assert.equal(result.actualAverageBinding.beforeXkeep,29332);
 assert.deepEqual(result.actualAverageBinding.literalIntegral,
  {op:'definite_integral',args:[29331,29329,0,1]});
 assert.deepEqual(result.actualAverageBinding.etaDerivative.actualSourceDerivativeBindings,
  [{source:29336,coordinate:2,derivative:29436},{source:29332,coordinate:2,derivative:29343}]);
 for(const [key,check]of Object.entries(result.exactBodyChecks)){
  assert(check.pass,key);assert.equal(check.sourceValuesReplaced,false,key);
  assert.equal(check.derivativeOrMomentIdentityAssumed,false,key);
 }
 assert.equal(result.positiveOrderRestrictions.U1.reduced,28835);
 assert.equal(result.positiveOrderRestrictions.Pi1.reduced,50557);
 assert.equal(result.positiveOrderRestrictions.average.reduced,29332);
 assert.equal(result.positiveOrderRestrictions.averageEta.reduced,29343);
 assert.equal(result.positiveOrderRestrictions.M1.reduced,29333);
 assert.equal(result.conditionalAverageIdentities.v1.nu,25);
 assert.notEqual(result.conditionalAverageIdentities.v1.nu,8);
 assert(result.genericAverageIdentity.check.pass);
 assert.equal(result.genericAverageIdentity.wrongSign.pass,false);
 assert.equal(result.genericAverageIdentity.sourceAuthenticated,false);
});

test('the full genuine even Picard U/K/Pi operations are distinguished from finite terms',async()=>{
 const context=await ready,result=await proveActualPicardAverageCollar(context);
 const interpretation=result.evenProfileInterpretation;
 assert.deepEqual(interpretation.sourceBindings.map(v=>v.component),[1,2,3]);
 for(const row of interpretation.sourceBindings){
  assert.deepEqual(row.evenSourceNode,
   {op:'actual_background_even_profile',args:[0,row.component,4756,2,0,0]});
  assert.equal(row.picardSourceNode.op,'actual_background_picard');
  assert.deepEqual(row.picardSourceNode.args.slice(0,2),[0,row.component]);
  assert.deepEqual(row.picardSourceNode.args.slice(3),[2,0]);
 }
 assert.equal(interpretation.displayedFiniteTermsUsed,false);
 assert.equal(result.actualPicardRows.stateNodes.length,6);
 result.actualPicardRows.stateNodes.forEach((node,j)=>
  assert.deepEqual(node,{op:'actual_background_picard',args:[0,j,25516,2,0]}));
 assert.equal(result.coordinateDerivativeInterpretation.exactJacobian,'dX/dxi=2*xi>0');
 assert.equal(result.coordinateDerivativeInterpretation.Pi.diagonal,0);
});

test('Picard common domain covers all tX, including points outside the caller collar',async()=>{
 const result=await proveActualPicardAverageCollar(await ready);
 assert.deepEqual(result.actualPicardRows.commonRadialDomain,[0,24806]);
 assert.equal(result.actualPicardRows.commonASquared,24805);
 assert.match(result.requiredPicardRegularity.radialDomain,/FULL 0<=X<=aSquared/);
 assert.match(result.conditionalCalculusArgument[4],/All0<=t<=1 sample0<=tX<=X<aSquared/);
 assert.match(result.conditionalCalculusArgument[4],/no caller collar assumption/);
 assert.match(result.conditionalCalculusArgument[2],/no arbitrary integration constant/);
});

test('wrong native system, component, argument, radial order or eta order is rejected',async()=>{
 const context=await ready,G=context.G;
 const mutations=[
  [29331,n=>{n.args[0]=1;}],[29331,n=>{n.args[1]=2;}],
  [29331,n=>{n.args[2]=4756;}],[29331,n=>{n.args[3]=4756;}],
  [29331,n=>{n.args[4]=1;}],[29331,n=>{n.args[5]=1;}],
  [29342,n=>{n.args[5]=0;}],[50557,n=>{n.args[1]=1;}],
  [28835,n=>{n.op='finite_picard_partial_sum';}]
 ];
 for(const [id,change]of mutations)
  assert.throws(()=>validateActualPicardAverageSource(context,
   {readNode:changedReader(G,id,change)}),/Changed actual average source node/);
});

test('tX, outer X Jacobian, endpoints and captured binders cannot change',async()=>{
 const context=await ready,G=context.G;
 const mutations=[
  [29330,n=>{n.args=[4756,4756];}],
  [29333,n=>{n.args=[29332,29332];}],
  [29332,n=>{n.args[2]=3617;}],
  [29332,n=>{n.args[3]=4756;}],
  [29332,n=>{n.args[1]=2;}],
  [29343,n=>{n.args[2]=1;}],
  [29343,n=>{n.args[3]=29330;}],
  [29329,n=>{n.args=['captured_eta'];}],
  [2,n=>{n.args=['different_parameter'];}]
 ];
 for(const [id,change]of mutations)
  assert.throws(()=>validateActualPicardAverageSource(context,
   {readNode:changedReader(G,id,change)}),/Changed actual average source node/);
});

test('wrong actual U/K sign, diagonal, forcing, parameter or axis data fails',async()=>{
 const context=await ready,G=context.G;
 const changes=[
  s=>{s.A0[2][5]=1;},s=>{s.A0[1][5]=20;},
  s=>{s.diagonal[2]=1;},s=>{s.diagonal[1]=2;},
  s=>{s.forcing[1]=1;},s=>{s.forcing[2]=1;},
  s=>{s.A1[2][0]=1;},s=>{s.A1[1][0]=1;},
  s=>{s.zeroAxisDatum[2]=1;},s=>{s.zeroAxisDatum[1]=1;},
  s=>{s.eta=4756;},s=>{s.xi=4756;},
  s=>{s.radialDomain[0]=3617;},s=>{s.radialDomain[1]=28819;},
  s=>{s.order=2;}
 ];
 for(const change of changes){
  const changed=clone(G.picardSystems[0]);change(changed);
  assert.throws(()=>validateActualPicardAverageSource(context,{readSystem:()=>changed}),/Changed/);
 }
});

test('copied or forged contexts have no proof authority',async()=>{
 const context=await ready;
 assert.throws(()=>validateActualPicardAverageSource({...context}),/live authenticated/);
 assert.throws(()=>restrictActualPositiveOrderCollar(
  {G:Object.create(context.G),prepared:context.prepared},29336),/live authenticated/);
 const fresh=await other();
 assert.notEqual(fresh.G,context.G);
 assert(validateActualPicardAverageSource(fresh).allSourceRowsCompared);
});

test('source prefix and definition mutations are detected before calculus',async()=>{
 const context=await other(),G=context.G,oldNode=G.nodes[29332];
 try{
  const changed=clone(oldNode);changed.args[3]=4756;G.nodes[29332]=changed;
  assert.throws(()=>validateActualPicardAverageSource(context),/source prefix changed/);
 }finally{G.nodes[29332]=oldNode;}
 const datum=G.picardSystems[0].zeroAxisDatum;
 try{
  G.picardSystems[0].zeroAxisDatum=[0,1,0,0,0,0];
  assert.throws(()=>validateActualPicardAverageSource(context),/function definitions changed/);
 }finally{G.picardSystems[0].zeroAxisDatum=datum;}
 assert(validateActualPicardAverageSource(context).allSourceRowsCompared);
});

test('global cutoff and expanded average-eta branch mutations are rejected',async()=>{
 const context=await ready,G=context.G;
 for(const [root,id,change]of [
  [29289,29268,n=>{n.args[3]=29267;}],
  [29336,29336,n=>{n.args[3]=29335;}],
  [29440,29436,n=>{n.args[3]=29332;}],
  [50558,50558,n=>{n.args[3]=50556;}]
 ]){
  assert.throws(()=>restrictActualPositiveOrderCollar(context,root,
   {readNode:changedReader(G,id,change)}),/Changed positive collar operand/);
 }
});

test('restriction never crosses integral or native lexical boundaries',async()=>{
 const context=await ready,G=context.G;
 const shadow=G.node('definite_integral',[28839,4756,G.zero,G.one]);
 const restriction=restrictActualPositiveOrderCollar(context,shadow);
 assert.equal(restriction.reduced,shadow);assert.equal(restriction.trace.length,0);
 const movedEndpoint=G.node('definite_integral',[29331,29329,G.zero,28839]);
 assert.equal(restrictActualPositiveOrderCollar(context,movedEndpoint).reduced,movedEndpoint);
 const shifted=G.add(4756,G.one);
 const native=G.picardEven(0,1,shifted,2,0,0);
 assert.equal(restrictActualPositiveOrderCollar(context,native).reduced,native);
 const shared=G.expressionValue(1,[shifted,2],[0,0]);
 assert.equal(restrictActualPositiveOrderCollar(context,shared).reduced,shared);
});

test('a shifted guard cannot inherit the free-X collar',async()=>{
 const context=await ready,G=context.G;
 const wrong=G.node('smooth_piecewise',[G.add(4756,G.one),
  ...G.nodes[29336].args.slice(1)]);
 assert.throws(()=>restrictActualPositiveOrderCollar(context,wrong),/shifted\/bound/);
});

test('receipt copies cannot mutate the live ordering or original source',async()=>{
 const context=await ready,result=await proveActualPicardAverageCollar(context);
 result.collarOrdering.openCollar.right='infinity';
 result.actualAverageBinding.sourceNodes['29332'].args[3]=4756;
 const again=await proveActualPicardAverageCollar(context);
 assert.equal(again.collarOrdering.openCollar.right,'Xa*exp(3*t1/256)');
 assert.deepEqual(again.actualAverageBinding.sourceNodes['29332'],
  PICARD_AVERAGE_EXPECTED_NODES[29332]);
});

test('source and conditional algebra leave analytic closure and original counts open',async()=>{
 const context=await ready,result=await proveActualPicardAverageCollar(context);
 for(const key of ['actualAnalyticCompositionApplied','actualAverageEqualityApplied',
  'rawAxialResidualZeroProvedHere','densityJoinsProvedHere',
  'actualTotalAxialMomentZeroProvedHere','TzPrimitiveGluingProvedHere','wholeGOnJProved'])
  assert.equal(result[key],false,key);
 for(const key of ['newOriginalGuardsDischarged','newOriginalJetsDischarged',
  'newOriginalPDETermsDischarged'])assert.equal(result[key],0);
 assert(result.originalSourcePrefixUnchanged);
 assert(result.originalFunctionDefinitionsUnchanged);
 assert(context.G.nodes.length>=result.originalPrefixNodeCount);
});

test('CLI rejects proof switches and protects historical inputs',async()=>{
 await assert.rejects(runPicardAverageCollarCLI({
  'kernel-root':kernelRoot,diagnostics:diagnosticsPath,out:'unused.json',
  'assume-average-true':'true'}),/Only source paths/);
 await assert.rejects(runPicardAverageCollarCLI({
  'kernel-root':kernelRoot,diagnostics:diagnosticsPath,out:diagnosticsPath}),/read-only/);
 await assert.rejects(runPicardAverageCollarCLI({
  'kernel-root':kernelRoot,diagnostics:diagnosticsPath,
  out:resolve(kernelRoot,'research-ide/mathscope-m2/navier/actual-global-primitive-kernels.mjs')}),/read-only/);
});

