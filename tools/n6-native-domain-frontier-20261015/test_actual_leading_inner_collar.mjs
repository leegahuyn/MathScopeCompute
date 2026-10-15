import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareActualLeadingInnerCollar,proveActualCollarOrdering,restrictActualLeadingCollar,
 compareActualCollarBodies,proveActualLeadingInnerCollar} from './actual_leading_inner_collar.mjs';

const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const kernelRoot=process.env.MATHSCOPE_KERNEL_ROOT??repo;
const diagnosticsPath=process.env.MATHSCOPE_DIAGNOSTICS??resolve(repo,
 'research-ide/mathscope-m3/evidence/n6-continuation-20261015/run-38734477166/NATIVE_DOMAIN_DIAGNOSTICS.json');
const ready=prepareActualLeadingInnerCollar({kernelRoot,diagnosticsPath});
let secondReady;
const secondContext=()=>secondReady??=prepareActualLeadingInnerCollar({kernelRoot,diagnosticsPath});

test('actual source U, mass, mass eta and v match on the strict open collar',async()=>{
 const context=await ready,result=await proveActualLeadingInnerCollar(context);
 for(const c of Object.values(result.exactBodyChecks)){assert(c.pass);assert.equal(c.sourceValuesReplaced,false);assert.equal(c.derivativeOrMomentIdentityAssumed,false);}
 assert.equal(result.originalNaturalMassConstant,4486);assert.equal(result.originalNaturalMassEtaConstant,5306);
 assert.deepEqual(result.actualDerivativeBindings.find(r=>r.source===5293),{source:5293,coordinate:2,derivative:6182});
 assert.deepEqual(result.actualDerivativeBindings.find(r=>r.source===24899),{source:24899,coordinate:2,derivative:24908});
 assert.match(result.ordering.openCollar.containment,/aSquared<loopILeft<1/);
 assert.equal(result.projections.globalU.reduced,4788);assert.equal(result.projections.globalM.reduced,5255);
 assert.equal(result.projections.globalMeta.reduced,5665);
 assert.equal(result.TzPrimitiveGluingProvedHere,false);assert.equal(result.newOriginalJetsDischarged,0);
});

test('copied context and copied/cross-graph ordering receipts are rejected',async()=>{
 const context=await ready,ordering=proveActualCollarOrdering(context);
 assert.throws(()=>proveActualCollarOrdering({...context}),/live authenticated/);
 assert.throws(()=>restrictActualLeadingCollar(context,9236,{...ordering}),/Copied or cross-graph/);
 assert.throws(()=>restrictActualLeadingCollar({G:Object.create(context.G)},9236,ordering),/live authenticated/);
 const other=Object.freeze({...context,G:Object.create(context.G)});
 assert.throws(()=>restrictActualLeadingCollar(other,9236,ordering),/live authenticated/);
 const authenticatedOther=await secondContext();
 assert.notEqual(authenticatedOther.G,context.G);
 assert.throws(()=>restrictActualLeadingCollar(authenticatedOther,9236,ordering),/Copied or cross-graph/);
 const otherOrdering=proveActualCollarOrdering(authenticatedOther);
 assert.throws(()=>restrictActualLeadingCollar(context,9236,otherOrdering),/Copied or cross-graph/);
});

test('an isolated original-prefix mutation is rejected and safely restored',async()=>{
 const context=await secondContext(),G=context.G,original=G.nodes[5254];
 try{
  const changed=structuredClone(original);changed.args[2]=G.zero;G.nodes[5254]=changed;
  assert.throws(()=>proveActualCollarOrdering(context),/Original source prefix changed/);
 }finally{G.nodes[5254]=original;}
 assert(proveActualCollarOrdering(context));
 assert(compareActualCollarBodies(context,5255,24899).pass);
});

test('nested data mutation cannot broaden the same live ordering token',async()=>{
 const context=await ready,ordering=proveActualCollarOrdering(context),old=ordering.openCollar.right;
 try{
  ordering.openCollar.right='infinity';
  assert.throws(()=>restrictActualLeadingCollar(context,9236,ordering),/Live collar receipt data changed/);
 }finally{ordering.openCollar.right=old;}
 assert.equal(restrictActualLeadingCollar(context,9236,ordering).reduced,4788);
});

test('changing an inactive source branch into an active branch is rejected',async()=>{
 const context=await ready,ordering=proveActualCollarOrdering(context),G=context.G;
 const active=structuredClone(G.nodes[7959]);active.args[3]=7958;
 assert.throws(()=>restrictActualLeadingCollar(context,9236,ordering,{readNode:i=>i===7959?active:G.nodes[i]}),/Changed actual branch/);
 const shifted=structuredClone(G.nodes[5175]);shifted.args[1]=3617;
 assert.throws(()=>restrictActualLeadingCollar(context,9236,ordering,{readNode:i=>i===5175?shifted:G.nodes[i]}),/Changed actual branch/);
});

test('I1 step argument and derivative support mutations are rejected',async()=>{
 const context=await ready,ordering=proveActualCollarOrdering(context),G=context.G;
 assert.throws(()=>restrictActualLeadingCollar(context,9236,ordering,{readNode:i=>i===9199?{op:'source_step_derivative',args:[9198,0]}:G.nodes[i]}),/Changed I1 derivative support/);
 assert.throws(()=>restrictActualLeadingCollar(context,9236,ordering,{readNode:i=>i===9198?{op:'multiply',args:[24,9202]}:G.nodes[i]}),/Changed I1 step argument/);
});

test('a derivative-only change is not hidden by value or mass equality',async()=>{
 const context=await ready,G=context.G,wrong=G.add(24908,G.one);
 assert.throws(()=>compareActualCollarBodies(context,5665,wrong),/body identity failed/);
 const ordering=proveActualCollarOrdering(context),changed=structuredClone(G.nodes[5665]);changed.args[0]=G.one;
 assert.throws(()=>restrictActualLeadingCollar(context,18767,ordering,{readNode:i=>i===5665?changed:G.nodes[i]}),/Changed actual arithmetic/);
 assert(compareActualCollarBodies(context,5255,24899).pass);
});

test('mass constant, lower endpoint and binder capture mutations fail',async()=>{
 const context=await ready,G=context.G;
 const lower=G.node('definite_integral',[24897,24859,G.zero,4756]);
 assert.throws(()=>compareActualCollarBodies(context,5255,G.add(4486,lower)),/body identity failed/);
 const captured=G.node('definite_integral',[24897,5249,3617,4756]);
 assert.throws(()=>compareActualCollarBodies(context,5255,G.add(4486,captured)),/body identity failed/);
 assert.throws(()=>compareActualCollarBodies(context,5255,G.add(G.one,24898)),/body identity failed/);
});

test('legitimate consistent binder alpha-renaming preserves the full primitive',async()=>{
 const context=await ready,G=context.G,t=G.fresh('adverse_test_legitimate_binder');
 const body=G.substitute(24897,24859,t),renamed=G.node('definite_integral',[body,t,3617,4756]);
 assert(compareActualCollarBodies(context,5255,G.add(4486,renamed)).pass);
});

test('shifted or scaled branch coordinates cannot reuse the free-X collar',async()=>{
 const context=await ready,G=context.G,ordering=proveActualCollarOrdering(context),a=G.nodes[4789].args;
 for(const selector of [G.add(4756,G.one),G.mul(G.q(2),4756)]){
  const wrong=G.node('smooth_piecewise',[selector,...a.slice(1)]);
  assert.throws(()=>restrictActualLeadingCollar(context,wrong,ordering),/shifted\/bound/);
 }
});

test('integral shadowing and nested binders never inherit the caller collar',async()=>{
 const context=await ready,G=context.G,ordering=proveActualCollarOrdering(context);
 const shadow=G.node('definite_integral',[5090,4756,G.zero,G.one]);
 const projected=restrictActualLeadingCollar(context,shadow,ordering);
 assert.equal(projected.reduced,shadow);assert.equal(projected.trace.length,0);
 assert(projected.opaque.some(r=>r.node===shadow));
 const wronglyRestricted=G.node('definite_integral',[4789,4756,G.zero,G.one]);
 assert.throws(()=>compareActualCollarBodies(context,shadow,wronglyRestricted),/body identity failed/);
 const t=G.fresh('adverse_test_outer_binder'),nested=G.node('definite_integral',[shadow,t,G.zero,4756]);
 assert.equal(restrictActualLeadingCollar(context,nested,ordering).reduced,nested);
});

test('native sharing and a moved integral endpoint remain opaque',async()=>{
 const context=await ready,G=context.G,ordering=proveActualCollarOrdering(context);
 // An original native definition evaluated at a shifted X does not authorize
 // unwrapping its body in the original caller collar.
 const native=G.expressionValue(1,[G.add(4756,G.one),2],[0,0]);
 const projected=restrictActualLeadingCollar(context,native,ordering);
 assert.equal(projected.reduced,native);assert.equal(projected.trace.length,0);
 const endpoint=G.node('definite_integral',[24897,24859,3617,5090]);
 assert.equal(restrictActualLeadingCollar(context,endpoint,ordering).reduced,endpoint);
 assert.throws(()=>compareActualCollarBodies(context,5255,G.add(4486,endpoint)),/body identity failed/);
});

test('proof diagnostics append nodes while preserving all original nodes and definitions',async()=>{
 const context=await ready,G=context.G,result=await proveActualLeadingInnerCollar(context);
 assert(result.originalSourcePrefixUnchanged);assert(result.originalFunctionDefinitionsUnchanged);
 assert(G.nodes.length>=result.originalPrefixNodeCount);
 for(const key of ['densityJoinsProvedHere','actualTotalAxialMomentZeroProvedHere','TzPrimitiveGluingProvedHere',
  'boundedPiecewiseIntegrabilityProvedHere','numericalNormHonestyProvedHere','wholeGOnJProved'])assert.equal(result[key],false);
 for(const key of ['newOriginalGuardsDischarged','newOriginalJetsDischarged','newOriginalPDETermsDischarged'])assert.equal(result[key],0);
});
