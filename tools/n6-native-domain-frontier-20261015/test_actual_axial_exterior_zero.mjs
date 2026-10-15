import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,link,symlink,readFile,writeFile,rm,unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,dirname,basename,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 AXIAL_EXTERIOR_EXPECTED_NODES,AXIAL_EXTERIOR_SOURCE_PINS,AXIAL_EXTERIOR_TERM_IDS,
 prepareActualAxialExteriorZero,validateActualAxialExteriorSource,
 inspectActualAxialExteriorCandidate,proveActualAxialExteriorZero,runAxialExteriorZeroCLI
} from './actual_axial_exterior_zero.mjs';

const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const kernelRoot=process.env.MATHSCOPE_KERNEL_ROOT??repo;
const diagnosticsPath=process.env.MATHSCOPE_DIAGNOSTICS??resolve(repo,
 'research-ide/mathscope-m3/evidence/n6-continuation-20261015/run-38734477166/NATIVE_DOMAIN_DIAGNOSTICS.json');
const ready=prepareActualAxialExteriorZero({kernelRoot,diagnosticsPath});
let otherReady;
const other=()=>otherReady??=prepareActualAxialExteriorZero({kernelRoot,diagnosticsPath});
const clone=v=>structuredClone(v);
const changedReader=(G,id,change)=>i=>{
 if(i!==id)return G.nodes[i];
 const value=clone(G.nodes[i]);change(value);return value;
};

test('exact original three exterior profiles retain the original nine choices and22 visits',async()=>{
 const context=await ready,result=await proveActualAxialExteriorZero(context);
 assert.equal(result.schema,'MathScope.N6.ActualAxialExteriorZero/1');
 assert.equal(result.sourceFiles.length,12);
 assert.deepEqual(result.sourceFiles.map(row=>row.path),Object.keys(AXIAL_EXTERIOR_SOURCE_PINS));
 assert.deepEqual(result.actualExteriorTrace.checks,[9236,29289,50558].map((expression,index)=>
  ({index,expression,zero:true})));
 assert.equal(result.actualExteriorTrace.visitedNodes,22);
 assert.deepEqual(result.actualExteriorTrace.zeroBranchTrace.map(row=>row.node),
  [5128,5157,5175,7959,9199,9204,28839,29268,50558]);
 assert.equal(result.actualExteriorTrace.compactIntegrandMistakenForZeroPrimitive,false);
 for(const id of result.actualThreeProfileVisitedNodes)
  assert.deepEqual(result.selectedSourceNodes[id],context.G.nodes[id]);
 assert.equal(result.originalPrefixNodeCount,117100);
});

test('all eight actual axial terms and the original native1 supported wrapper remain bound',async()=>{
 const result=await proveActualAxialExteriorZero(await ready);
 assert.deepEqual(result.actualRawAxialFormula.terms,AXIAL_EXTERIOR_TERM_IDS);
 assert.equal(result.actualRawAxialFormula.root,117045);
 assert.deepEqual(result.actualEightTermExteriorTrace.checks,AXIAL_EXTERIOR_TERM_IDS.map((expression,index)=>
  ({index,expression,zero:true})));
 assert.equal(result.actualRawAxialFormula.lambda1,25);
 assert.notEqual(result.actualRawAxialFormula.lambda1,8);
 assert.deepEqual(result.actualDensity.sourceNode,
  {op:'smooth_piecewise',args:[4756,28814,28824,0,117045,0]});
 assert.equal(result.actualDensity.registry,'expression:1');
 assert.equal(result.actualDensity.definition.body,117047);
 assert.deepEqual(result.actualDensity.definition.parameters,[4756,2]);
 assert.deepEqual(result.actualDensity.definition.derivativeLimits,[128,128]);
 assert.equal(result.actualDensity.angularGuardUsesDifferentRightEndpoint,28826);
});

test('outward order uses exact positive exponents and the strict original Xplus endpoint',async()=>{
 const result=await proveActualAxialExteriorZero(await ready),o=result.actualEndpointOrdering;
 assert.deepEqual(result.exteriorDomain,{kind:'strict-positive-outward-half-line',coordinate:4756,
  left:28824,leftSourceNode:{op:'multiply',args:[588,3293]},inequality:'X>Xplus>0'});
 assert.equal(o.strictChain,'Xcut28823<aSquared24805<1<XR12<IposRight28988<Xv3293<Xplus28824');
 assert.equal(o.exactLogComparisons.IposRightOverXv,'exp(-9-13/lambda)<1');
 assert.equal(o.exactLogComparisons.XplusOverXv,'exp(1)>1');
 assert.deepEqual(o.exactLogComparisons.actualStepArguments,
  ['2*(X/X0I1-9)>1','2*(X/X0I1-10)>1']);
 assert.equal(o.optionalOutwardInterval.nonemptyReason,'1<3/2 and Xv>0');
 assert.equal(o.actualAverageCutoff.source,29328);
 assert.equal(o.actualAverageCutoff.formula,'lastU=X0Ipos*(8193/4096)^2');
 assert.equal(o.actualAverageCutoff.strictBound,
  '(8193/4096)^2<16<32<exp(5), so lastU<IposRight<Xv<Xplus');
 assert.deepEqual(o.actualAverageCutoff.actualAverageBranches,[29336,29436]);
 assert.equal(o.numericalCoordinateComparisonUsed,false);
});

test('changed original branch coordinate, right endpoint, selected zero or middle body is rejected',async()=>{
 const context=await ready,G=context.G;
 const mutations=[
  [5128,n=>{n.args[0]=4756;}],[5128,n=>{n.args[2]=1;}],
  [5157,n=>{n.args[5]=5127;}],[5175,n=>{n.args[2]=5093;}],
  [7959,n=>{n.args[5]=7958;}],[28839,n=>{n.args[2]=28824;}],
  [29008,n=>{n.args[0]='16385';}],[29328,n=>{n.args[1]=1;}],
  [29336,n=>{n.args[2]=28988;}],[29436,n=>{n.args[5]=29343;}],
  [29268,n=>{n.args[5]=29267;}],[50558,n=>{n.args[5]=50556;}],
  [50558,n=>{n.args[4]=0;}]
 ];
 for(const [id,change]of mutations)assert.throws(()=>validateActualAxialExteriorSource(context,
  {readNode:changedReader(G,id,change)}),/Changed actual exterior source node/);
});

test('guard, density component, eta coordinate and original raw-term substitutions are rejected',async()=>{
 const context=await ready,G=context.G;
 for(const [id,change]of [
  [117047,n=>{n.args[1]=0;}],[117047,n=>{n.args[2]=28826;}],
  [117047,n=>{n.args[4]=0;}],[117047,n=>{n.args[0]=2;}],
  [117045,n=>{n.args[0]=0;}],[87489,n=>{n.args[1]=0;}],
  [2,n=>{n.args=['X'];}]
 ])assert.throws(()=>validateActualAxialExteriorSource(context,
  {readNode:changedReader(G,id,change)}),/Changed actual exterior source node/);
});

test('actual I1 step derivative orders, shifted arguments, and logarithmic scale cannot change',async()=>{
 const context=await ready,G=context.G;
 for(const [id,change]of [
  [9199,n=>{n.args[1]=0;}],[9204,n=>{n.args[0]=9198;}],
  [9197,n=>{n.args[0]=688;}],[9203,n=>{n.args[0]=1;}],
  [9195,n=>{n.args[0]=28987;}],[5097,n=>{n.args[0]=3293;}],
  [5099,n=>{n.op='log_abs';}]
 ])assert.throws(()=>validateActualAxialExteriorSource(context,
  {readNode:changedReader(G,id,change)}),/Changed actual exterior source node/);
});

test('endpoint parameters cannot substitute lambda0, wrong exponent, cutoff or alias',async()=>{
 const context=await ready,G=context.G;
 for(const change of [
  e=>{e.lambda={integer:0};},e=>{e.BOuter={integer:0};},
  e=>{e.X0Ipos={ref:'X0I1'};},e=>{e.IposRight={ref:'Xplus'};},
  e=>{e.X0I1={integer:1};},e=>{e.I1Right={ref:'Xb'};},
  e=>{e.loopIRight={integer:0};}
 ]){
  const parameters=clone(G.source.parametersExactExpressions);change(parameters);
  assert.throws(()=>validateActualAxialExteriorSource(context,{readParameters:()=>parameters}),
   /Changed actual exterior endpoint/);
 }
});

test('copied receipts, copied contexts and graph aliases have no live support authority',async()=>{
 const context=await ready,result=await proveActualAxialExteriorZero(context);
 assert.throws(()=>validateActualAxialExteriorSource({...context}),/live authenticated/);
 assert.throws(()=>inspectActualAxialExteriorCandidate({G:context.G,prepared:context.prepared,
  actualSupportOrder:result.actualSupportOrder},9236),/live authenticated/);
 assert.throws(()=>validateActualAxialExteriorSource({G:Object.create(context.G),prepared:context.prepared}),
  /live authenticated/);
 const fresh=await other();assert.notEqual(fresh.G,context.G);
 assert(validateActualAxialExteriorSource(fresh).lambda);
});

test('a live support proof rejects stale mutated original prefix or native definition',async()=>{
 const context=await other(),G=context.G,oldNode=G.nodes[50558];
 try{
  const changed=clone(oldNode);changed.args[5]=50556;G.nodes[50558]=changed;
  assert.throws(()=>inspectActualAxialExteriorCandidate(context,50558),/source prefix changed/);
 }finally{G.nodes[50558]=oldNode;}
 const body=G.expressionSystems[1].body;
 try{
  G.expressionSystems[1].body=0;
  assert.throws(()=>validateActualAxialExteriorSource(context),/function definitions changed/);
 }finally{G.expressionSystems[1].body=body;}
 assert(validateActualAxialExteriorSource(context).lambda);
});

test('unselected exact source parameters are covered by the full definition seal',async()=>{
 const context=await other(),e=context.G.source.parametersExactExpressions;
 for(const key of ['XR','Q']){
  const old=e[key];
  try{
   e[key]={integer:-1};
   assert.throws(()=>validateActualAxialExteriorSource(context),/function definitions changed/);
  }finally{e[key]=old;}
 }
 assert(validateActualAxialExteriorSource(context).lambda);
});

test('pending async proof rejects a prefix mutation across awaited source reads',async()=>{
 const context=await other(),G=context.G,old=G.nodes[3];
 const pending=proveActualAxialExteriorZero(context);
 try{
  G.nodes[3]={op:'rational',args:['-1','1']};
  await assert.rejects(pending,/source prefix changed/);
 }finally{G.nodes[3]=old;}
 assert(validateActualAxialExteriorSource(context).lambda);
});

test('prior result arrays and nested receipts cannot poison subsequent source proof output',async()=>{
 const context=await ready,result=await proveActualAxialExteriorZero(context);
 result.actualThreeProfileVisitedNodes[0]=-1;
 result.actualRawAxialFormula.termRoles[0]='counterfeit';
 result.actualEndpointOrdering.domain.left=0;
 result.actualSupportOrder.endpoints.Xplus=0;
 result.actualScalarParameterOrdering.openCollar.right='infinity';
 result.selectedSourceNodes[117047].args[4]=0;
 const fresh=await proveActualAxialExteriorZero(context);
 assert.equal(fresh.actualThreeProfileVisitedNodes[0],9236);
 assert.equal(fresh.actualRawAxialFormula.termRoles[0],'time U1');
 assert.equal(fresh.actualEndpointOrdering.domain.left,28824);
 assert.equal(fresh.actualSupportOrder.endpoints.Xplus,28824);
 assert.notEqual(fresh.actualScalarParameterOrdering.openCollar.right,'infinity');
 assert.equal(fresh.selectedSourceNodes[117047].args[4],117045);
});

test('mutation of exported nested source expectations cannot counterfeit the verifier',async()=>{
 const context=await ready,old=AXIAL_EXTERIOR_EXPECTED_NODES[50558].args[5];
 try{
  AXIAL_EXTERIOR_EXPECTED_NODES[50558].args[5]=50556;
  assert.throws(()=>validateActualAxialExteriorSource(context),/Internal exterior source pin changed/);
 }finally{AXIAL_EXTERIOR_EXPECTED_NODES[50558].args[5]=old;}
 assert(validateActualAxialExteriorSource(context).lambda);
});

test('free-X outward order cannot leak into an integral binder or its moving endpoint',async()=>{
 const context=await ready,G=context.G;
 const bound=G.node('definite_integral',[9236,4756,G.zero,G.one]);
 const moving=G.node('definite_integral',[29289,2,G.zero,9236]);
 for(const id of [bound,moving]){
  const result=inspectActualAxialExteriorCandidate(context,id);
  assert.equal(result.pass,false);assert.equal(result.zeroBranchTrace.length,0);
 }
});

test('shifted native argument and shifted piecewise coordinate inherit no caller exterior',async()=>{
 const context=await ready,G=context.G,shift=G.add(4756,G.one);
 const native=G.expressionValue(1,[shift,2],[0,0]);
 const shifted=G.node('smooth_piecewise',[shift,28814,28824,1,1,0]);
 const alias=G.node('coordinate',['X_alias']);
 const wrongCoordinate=G.node('smooth_piecewise',[alias,28814,28824,1,1,0]);
 for(const id of [native,shifted,wrongCoordinate]){
  const result=inspectActualAxialExteriorCandidate(context,id);
  assert.equal(result.pass,false);assert.equal(result.zeroBranchTrace.length,0);
 }
});

test('endpoint override and invalid roots are rejected; velocity finiteness remains a separate premise',async()=>{
 const context=await ready;
 for(const endpoint of [28826,28819,0])assert.throws(()=>inspectActualAxialExteriorCandidate(context,
  9236,{endpoint}),/original Xplus/);
 assert.throws(()=>inspectActualAxialExteriorCandidate(context,-1),/Unknown exterior candidate/);
 const result=await proveActualAxialExteriorZero(context);
 assert.equal(result.exactOriginalRoots.v0,18778);assert.equal(result.exactOriginalRoots.v1,29440);
 assert.deepEqual(result.actualExteriorTrace.checks.map(v=>v.expression),[9236,29289,50558]);
 assert.match(result.analyticPremises[1],/finiteness of v0=18778,v1=29440/);
});

test('source traces retain finite-operand premises and discharge no analytic or original obligations',async()=>{
 const result=await proveActualAxialExteriorZero(await ready);
 for(const key of ['actualAnalyticCompositionApplied','analyticRightExteriorZeroProvedHere',
  'rawAxialResidualZeroProvedHere','allDerivativeExistenceProvedHere','densityJoinsProvedHere',
  'actualTotalAxialMomentZeroProvedHere','TzPrimitiveGluingProvedHere','numericalNormHonestyProvedHere',
  'wholeGOnJProved'])assert.equal(result[key],false,key);
 for(const key of ['newOriginalGuardsDischarged','newOriginalJetsDischarged','newOriginalPDETermsDischarged'])
  assert.equal(result[key],0,key);
 assert.match(result.analyticPremises[0],/finite value/);
 assert.match(result.analyticPremises[1],/v0=18778,v1=29440/);
 assert.match(result.analyticPremises[1],/vanishing is not assumed/);
 assert.match(result.analyticPremises[3],/interior50556 is not replaced/);
});

test('CLI rejects proof switches and literal historical/source output paths before execution',async()=>{
 await assert.rejects(runAxialExteriorZeroCLI({'kernel-root':kernelRoot,diagnostics:diagnosticsPath,
  out:'unused.json',proof:true}),/Only source paths/);
 await assert.rejects(runAxialExteriorZeroCLI({'kernel-root':kernelRoot,diagnostics:diagnosticsPath,
  out:diagnosticsPath}),/read-only/);
 const source=resolve(kernelRoot,Object.keys(AXIAL_EXTERIOR_SOURCE_PINS)[0]);
 await assert.rejects(runAxialExteriorZeroCLI({'kernel-root':kernelRoot,diagnostics:diagnosticsPath,
  out:source}),/read-only/);
});

test('CLI rejects existing hardlink and directory-symlink aliases without changing input bytes',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'mathscope-exterior-alias-'));
 const before=await readFile(diagnosticsPath),disposable=join(directory,'diagnostics-copy.json');
 await writeFile(disposable,before);
 const folder=join(directory,'historical-directory');let junctionCreated=false;
 try{
  const hard=join(directory,'historical-hardlink.json');await link(disposable,hard);
  await assert.rejects(runAxialExteriorZeroCLI({'kernel-root':kernelRoot,diagnostics:disposable,
   out:hard}),/hardlink|aliases/);
  await symlink(directory,folder,'junction');junctionCreated=true;
  await assert.rejects(runAxialExteriorZeroCLI({'kernel-root':kernelRoot,diagnostics:disposable,
   out:join(folder,basename(disposable))}),/aliases|hardlink/);
  assert.deepEqual(await readFile(disposable),before);
 }finally{
  if(junctionCreated)await unlink(folder);
  assert(resolve(directory).startsWith(resolve(tmpdir())+sep+'mathscope-exterior-alias-'));
  await rm(directory,{recursive:true,force:true});
 }
});
