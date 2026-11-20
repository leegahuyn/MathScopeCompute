import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime,registry,c100dir,c101dir,goal,output]=process.argv.slice(2);
assert(output,'ORIGINAL_RUNTIME ORIGINAL_REGISTRY C100_Y C101_OUTER_Y GOAL_NEXT NEW_JSON');
const sha=value=>createHash('sha256').update(value).digest('hex');
const read=async(path,pin)=>{
  const bytes=await readFile(path);
  assert.equal(sha(bytes),pin,path);
  return JSON.parse(bytes);
};
const C100Ops='afa75d0bba159592b4ce217dc06c9b871fb7137f9617291240370a53b1aad35f';
const C101Outer='867fbbeac0e03f6e685c89c8e08022ac09f71dfbe0de6b1b00cb0f7c38e0af59';
const C101Ops='f9910c12ee41bda2e75fcc12d71a6837f52d495dcdc0bb91af43ea6c3eb7bb46';
const Leading='5c0fda42461aca2e77cd2987100a0e7a38dced94ec3be8883ae639df765f06cd';
const Moments='3d4be5e7b50d1f1310ee2588f59cf055be87ddfaff60f75ca4cbf98c9371d4cb';
const previous=await read(resolve(c100dir,'n1-radial-seams-operands.json'),C100Ops);
const outer=await read(resolve(c101dir,'n1-outer-flux.json'),C101Outer);
const sourceOuter=await read(resolve(c101dir,'n1-outer-flux-operands.json'),C101Ops);
const leading=await read(resolve(goal,'axial-order-one-identity/leading-axial-support/leading-axial-support.json'),Leading);
const moments=await read(resolve(goal,'axial-order-one-identity/whole-moments/whole-moments.json'),Moments);
assert.equal(outer.operandsSHA256,C101Ops);
assert.equal(leading.Ipos.U,'0');
assert.equal(leading.Ipos.v,'-mConst/X');
assert.deepEqual(outer.exactOrdinaryUncutWholeErrorIntegralZero,{axial:true,weightedAngular:true});
const pins={...previous.sourcePins,
  'actual-leading-all-order-jets.mjs':'d3af156118671a3e582c19a82064aab884a09d6ce81f51a6b2d64d35444cd29d',
  'actual-global-source-outer.mjs':'5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9'};
for(const [name,pin] of Object.entries(pins))
  assert.equal(sha(await readFile(resolve(runtime,name))),pin,name);
const load=name=>import(pathToFileURL(resolve(runtime,name)));
const src=await load('actual-residual-order-induction-source.mjs');
const {actualLeadingAllOrderJets}=await load('actual-leading-all-order-jets.mjs');
const {explicitPrimitiveBodyIdentity}=await load('actual-global-primitive-kernels.mjs');
const {sourceGraphRationalIdentity}=await load('actual-continuation-exact-identities.mjs');
const live=src.prepareActualOrderInduction({order:1,maxNodes:2000000});
assert.ok(src.assertActualOrderInduction(live));
const {G,bootstrap}=live,{orderOne:r,constants:{X,eta}}=bootstrap;
assert.equal(sha(JSON.stringify(G.nodes)),sourceOuter.originalPrefixSHA256);
assert.equal(sourceOuter.originalPrefixSHA256,previous.originalPrefixSHA256);
const archived=await read(registry,'049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad');
assert.deepEqual(G.picardSystems,JSON.parse(archived.base.picard).slice(0,2));
const q=(a,b=1)=>G.q(a,b),z=G.zero,o=G.one,step=s=>G.step(s);
const {mConst}=G.outer.roots;
const XR=G.parameter('XR'),Md=G.parameter('Md'),T=G.parameter('T'),BOuter=G.parameter('BOuter');
const kEnd=G.sub(G.exp(Md),o),s=G.fresh('C102_complete_mConst_radial_datum');
const k=G.mul(q(4),G.sub(o,step(G.div(G.log(G.add(o,s)),Md))));
const kMoment=G.integral(G.mul(G.exp(s),k),s,z,kEnd);
const mConstRebuild=G.mul(XR,G.exp(o),G.add(q(4),kMoment));
assert.ok(explicitPrimitiveBodyIdentity(G,mConst,mConstRebuild).pass);
assert.ok(!G.dependsOn(mConst,eta));
const actualProfile=G.source.parametersExactExpressions;
const ref=name=>({ref:name}),integer=n=>({integer:n});
assert.deepEqual(actualProfile.T,{sum:[{exp:ref('Md')},integer(10)]});
assert.deepEqual(actualProfile.BOuter,{product:[integer(1000),ref('T')]});
assert.deepEqual(actualProfile.X0Ipos,{product:[ref('XR'),
  {exp:{sum:[ref('T'),integer(2),{product:[integer(60),ref('BOuter')]},integer(-14)]}}]});
assert.equal(r.X0,G.parameter('X0Ipos'));
assert.equal(r.Rbase,G.sqrt(G.mul(q(2),r.X0)));
const normalizedLast=r.supports[4][1];
assert.deepEqual(G.nodes[normalizedLast],{op:'rational',args:['14337','4096']});
const last=G.mul(r.X0,G.pow(normalizedLast,2));
assert.equal(last,outer.outerEndpoints.lastAngularBump);
assert.equal(last,117099);
assert.equal(r.Xplus,outer.outerEndpoints.Xplus);
assert.equal(r.Xb,outer.outerEndpoints.Xb);
const support=bootstrap.program.orderOneStress.supportOrder;
assert.ok(support.pass);
assert.ok(support.arithmeticChecks.allIposBumpsBeforeRight);
const actual=bootstrap.program.orderOneStress;
assert.equal(actual.axialSupported,117047);
assert.deepEqual(actual.totalResidualIntegrals,[117072,117075]);
const axialBack=G.nodes[117066],axialForward=G.nodes[117057];
for(const [record,endpoints] of [[axialForward,[r.Xminus,X]],[axialBack,[X,r.Xplus]]]){
  assert.equal(record.op,'definite_integral');
  const [fn,bound,a,b]=record.args;
  assert.deepEqual([a,b],endpoints);
  assert.deepEqual(G.nodes[fn],{op:'actual_expression_partial',args:[1,[bound,eta],[0,0]]});
}
assert.equal(G.expressionSystems[1].body,117047);
assert.equal(sourceOuter.sourceRoots.Fpos,moments.patch.F0IposRoot);

const leadingBounds=actualLeadingAllOrderJets({radialOrder:0,etaOrder:0});
assert.ok(leadingBounds.pass);
assert.equal(leadingBounds.parameterExpressionSHA256,leading.sourceParameterSHA256);
assert.equal(leadingBounds.sourceFunctionIdentity.U0Root,bootstrap.finalU);
assert.equal(leadingBounds.bounds.U0.actualCompletedLeadingSource,true);
assert.deepEqual(leadingBounds.bounds.U0.domain.X,['0','infinity']);
assert.deepEqual(leadingBounds.bounds.F0active.domain.X,['0','Xplus=Xv*exp(1)']);
assert.ok(leadingBounds.bounds.F0active.actualHeatI2CorrectionIncluded);
const program=leadingBounds.normProgram, positiveRoots={U:leadingBounds.bounds.U0.root,F:leadingBounds.bounds.F0active.root};
const closure=new Set(),stack=Object.values(positiveRoots);
while(stack.length){
  const id=stack.pop();
  if(closure.has(id))continue;
  closure.add(id);
  const {op,args}=program.nodes[id];
  if(['rational','source_parameter'].includes(op))continue;
  if(op==='integer_power')stack.push(args[0]);
  else if(['add','multiply','inverse','exp','log_positive','sqrt_positive','maximum','ceiling'].includes(op))stack.push(...args);
  else throw Error('unexpected positive norm operation '+op);
}
const jacobian=G.derivative(r.normalizedR,X);
const radial=G.sqrt(G.mul(q(2),X));
assert.ok(sourceGraphRationalIdentity(G,G.sub(jacobian,G.inv(G.mul(r.Rbase,radial))),
  {atomicNodes:[r.Rbase,radial]}).pass);
const result={schema:'MathScope.C102.OriginalN1AbsoluteOuterOperands/1',
  prior:{C100Ops,C101Outer,C101Ops,Leading,Moments},runtimePins:pins,
  originalPrefixSHA256:sourceOuter.originalPrefixSHA256,
  originalSource:{X,eta,cut:r.Xcut,IposLeft:r.X0,last,IposRight:r.IposRight,Xplus:r.Xplus,Xb:r.Xb,rb:r.Rbase,
    mConst,mConstRebuild,kMoment,kEnd,T,BOuter,actualF0:bootstrap.actualHeat.heat.finalF,actualU0:bootstrap.finalU,
    actualAxialDensity:117047,forwardAxialIntegral:117057,backwardAxialIntegral:117066},
  normalizedLast:'14337/4096',
  sameSourcePositiveLeadingValueBounds:{...positiveRoots,sourceProfile:leadingBounds.parameterExpressionSHA256,
    domains:{U:leadingBounds.bounds.U0.domain,F:leadingBounds.bounds.F0active.domain},
    activeHeatI2:true,programSHA256:sha(JSON.stringify(program.nodes)),nodeCount:closure.size,
    arithmeticNodes:[...closure].sort((a,b)=>a-b).map(id=>[id,program.nodes[id]])},
  symbolicSourceScales:{T:actualProfile.T,BOuter:actualProfile.BOuter,X0:actualProfile.X0Ipos},
  dispatch:{positiveIposBeforeBothOuterSwitches:true,originalTwoAxialRadialBinders:true,
    actualMassMomentRebuilt:true,earlierOrdinaryCompensationRetained:true}};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({boundNodes:closure.size,mConst,last,Xplus:r.Xplus,density:117047}));
