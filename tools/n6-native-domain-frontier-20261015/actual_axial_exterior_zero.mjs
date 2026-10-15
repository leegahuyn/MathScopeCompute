/** Exact retained-source axial exterior-zero traces, without analytic closure.
 *
 * Only the live original support proof authorizes the graph checker. All
 * source nodes/definitions and the private proof data are sealed before and
 * after every run. Multiplication by a source zero is algebra conditional on
 * the actual finite/defined operands; ordinary derivative existence, density
 * gluing, stress moments and numerical bounds are separate application work.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,realpath,stat} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {COLLAR_SOURCE_PINS,prepareActualLeadingInnerCollar,
 proveActualCollarOrdering} from './actual_leading_inner_collar.mjs';

const BASE='research-ide/mathscope-m2/navier/';
export const AXIAL_EXTERIOR_SOURCE_PINS=Object.freeze({...COLLAR_SOURCE_PINS,
 [BASE+'actual-continuation-exact-support.mjs']:'0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98',
 [BASE+'actual-continuation-exact-identities.mjs']:'bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712',
 [BASE+'actual-residual-order-induction-expressions.mjs']:'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501'});
const HEADER='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1';
const FIXED='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b';
const PAPER='0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f';
const DIAGNOSTICS='b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1';
const DENSITY='f815fd78afc4ef36627e657a34ba84624c838a44039de6435b748020b52b1689';
const contexts=new WeakMap();
const sha=b=>createHash('sha256').update(b).digest('hex');
const jsonSha=v=>sha(JSON.stringify(v));
const copy=v=>structuredClone(v);
const n=(op,args)=>({op,args});
const THREE=[9236,29289,50558];
export const AXIAL_EXTERIOR_TERM_IDS=Object.freeze([87480,87481,87488,87489,87490,117027,117030,117031]);
const TERM_ROLES=['time U1','X v0 U1_X','U0 Z_(c+lambda1) U1',
 'X v1 U0_X','U1 Z_c U0','Z_(-2A+lambda1) Pi1',
 '-2(X U1_XX+U1_X)','-Z_(c-D) Z_c U0'];
export const AXIAL_EXTERIOR_EXPECTED_NODES=Object.freeze({
 0:n('rational',['0','1']),1:n('rational',['1','1']),2:n('coordinate',['eta']),
 8:n('source_parameter',['lambda']),24:n('rational',['2','1']),
 103:n('multiply',[101,102]),101:n('rational',['13','1']),102:n('inverse',[8]),
 3293:n('multiply',[613,3292]),588:n('exp',[1]),4756:n('coordinate',['X']),
 5097:n('inverse',[613]),5098:n('multiply',[4756,5097]),5099:n('log_positive',[5098]),
 5128:n('smooth_piecewise',[5099,0,103,0,5127,0]),
 5157:n('smooth_piecewise',[4756,5091,5093,3458,5156,5128]),
 5175:n('smooth_piecewise',[4756,4567,5089,5090,5174,5157]),
 6258:n('source_parameter',['loopIRight']),
 7959:n('smooth_piecewise',[4756,6257,6258,0,7958,0]),
 7961:n('multiply',[7959,7960]),7966:n('add',[5175,7961]),
 7981:n('source_parameter',['X0I1']),7982:n('source_parameter',['I1Right']),
 9169:n('actual_quadratic_root',[1,0,2]),9170:n('actual_quadratic_root',[1,1,2]),
 9195:n('inverse',[7981]),9196:n('multiply',[4756,9195]),
 8843:n('rational',['-9','1']),688:n('rational',['-10','1']),
 9197:n('add',[8843,9196]),9198:n('multiply',[24,9197]),
 9199:n('source_step_derivative',[9198,1]),
 9202:n('add',[688,9196]),9203:n('multiply',[24,9202]),
 9204:n('source_step_derivative',[9203,1]),
 9200:n('multiply',[24,9199]),9201:n('multiply',[9169,9200]),
 9205:n('multiply',[24,9204]),9206:n('multiply',[9170,9205]),
 9207:n('add',[9201,9206]),9209:n('multiply',[9207,9208]),
 9236:n('add',[7966,9209]),
 28824:n('multiply',[588,3293]),
 28839:n('smooth_piecewise',[4756,28819,28823,28835,28838,0]),
 28987:n('source_parameter',['X0Ipos']),28988:n('source_parameter',['IposRight']),
 29268:n('smooth_piecewise',[4756,28987,28988,0,29267,0]),
 29289:n('add',[28839,29268]),
 29008:n('rational',['8193','4096']),29328:n('multiply',[28987,29327]),
 29336:n('smooth_piecewise',[4756,28819,29328,29332,29335,0]),
 29436:n('smooth_piecewise',[4756,28819,29328,29343,29435,0]),
 50558:n('smooth_piecewise',[4756,28819,28824,50557,50556,0]),
 87480:n('multiply',[1953,87479]),87481:n('multiply',[18779,72309]),
 87488:n('multiply',[9236,87487]),87489:n('multiply',[29441,33214]),
 87490:n('multiply',[29289,78019]),117027:n('multiply',[1953,117026]),
 117030:n('multiply',[190,117029]),117031:n('multiply',[20,79047]),
 117045:n('add',[117031,117044]),
 117047:n('smooth_piecewise',[4756,28814,28824,0,117045,0])
});
const EXPECTED_SHA=jsonSha(AXIAL_EXTERIOR_EXPECTED_NODES);
const EXPECTED_TRACE=[
 {node:5128,rightEndpoint:103,selected:'after',after:0},
 {node:5157,rightEndpoint:5093,selected:'after',after:5128},
 {node:5175,rightEndpoint:5089,selected:'after',after:5157},
 {node:7959,rightEndpoint:6258,selected:'after',after:0},
 {node:9199,stepArgument:9198,derivativeOrder:1,rule:'flat step derivative outside the actual I1 bump support'},
 {node:9204,stepArgument:9203,derivativeOrder:1,rule:'flat step derivative outside the actual I1 bump support'},
 {node:28839,rightEndpoint:28823,selected:'after',after:0},
 {node:29268,rightEndpoint:28988,selected:'after',after:0},
 {node:50558,rightEndpoint:28824,selected:'after',after:0}
];
const THREE_VISITED=[9236,7966,5175,5157,5128,7961,7959,9209,9207,9201,
 9169,9200,24,9199,9206,9170,9205,9204,29289,28839,29268,50558];

function contextOf(context){
 const s=contexts.get(context);assert(s,'Use the live authenticated axial-exterior context.');
 assert.equal(jsonSha(AXIAL_EXTERIOR_EXPECTED_NODES),EXPECTED_SHA,'Internal exterior source pin changed.');
 assert.equal(jsonSha(s.G.nodes.slice(0,s.prefixCount)),s.prefixSHA256,'Original exterior source prefix changed.');
 assert(s.G.functionDefinitionsUnchanged(s.definitions),'Original exterior function definitions changed.');
 assert.equal(jsonSha(s.support),s.supportSHA256,'Live exterior support proof data changed.');
 assert.equal(jsonSha(s.smallOrdering),s.smallOrderingSHA256,'Live exterior scalar ordering changed.');
 return s;
}

function rawTerms(G,p){
 const q=(a,b=1)=>G.q(a,b),{X,eta}=p.constants,{A,D,d,L}=G.core;
 const {U1,v1,Pi1}=p.orderOne,U0=p.completedOrderOne.finalU,v0=p.completedOrderOne.finalv;
 const nu=p.inner.lambda1,c=G.neg(A);
 assert.equal(nu,25);assert.equal(nu,G.mul(q(2),G.parameter('h')));
 const Z=(a,f)=>G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(a,f),G.mul(X,G.derivative(f,X)))),
  G.mul(d,G.derivative(f,eta))),L);
 const T=(a,f)=>G.div(G.add(G.neg(G.mul(a,f)),G.mul(D,eta,G.derivative(f,eta)),
  G.mul(X,G.derivative(f,X))),L);
 const U1x=G.derivative(U1,X),U1xx=G.derivative(U1x,X),U0x=G.derivative(U0,X);
 return [T(G.add(c,nu),U1),G.mul(X,v0,U1x),G.mul(U0,Z(G.add(c,nu),U1)),
  G.mul(X,v1,U0x),G.mul(U1,Z(c,U0)),Z(G.add(G.mul(q(-2),A),nu),Pi1),
  G.mul(q(-2),G.add(G.mul(X,U1xx),U1x)),G.neg(Z(G.sub(c,D),Z(c,U0)))];
}

export async function prepareActualAxialExteriorZero({kernelRoot,diagnosticsPath}){
 const root=resolve(kernelRoot),sourceFiles=[];
 for(const [path,pin]of Object.entries(AXIAL_EXTERIOR_SOURCE_PINS)){
  const b=await readFile(resolve(root,path));assert.equal(sha(b),pin,path);
  sourceFiles.push({path,sha256:pin,bytes:b.length});
 }
 const original=await prepareActualLeadingInnerCollar({kernelRoot:root,diagnosticsPath});
 const G=original.G,p=original.prepared,smallOrdering=proveActualCollarOrdering(original);
 const supportModule=await import(pathToFileURL(resolve(root,BASE+'actual-continuation-exact-support.mjs')));
 const inductionModule=await import(pathToFileURL(resolve(root,BASE+'actual-residual-order-induction-expressions.mjs')));
 assert.deepEqual([p.constants.X,p.constants.eta,p.finalU,p.orderOne.U1,p.orderOne.Pi1,
  p.finalv,p.orderOne.v1,p.orderOne.Xplus,p.constants.Xv,p.stress.axial],
  [4756,2,9236,29289,50558,18778,29440,28824,3293,117045]);
 for(const [id,node]of Object.entries(AXIAL_EXTERIOR_EXPECTED_NODES))
  assert.deepEqual(G.nodes[id],node,'Original exterior source node '+id);
 const terms=rawTerms(G,p);
 assert.deepEqual(terms,AXIAL_EXTERIOR_TERM_IDS);
 assert.deepEqual(terms,p.program.orderOneStress.axialTerms);
 assert.equal(G.add(...terms),117045);
 const bootstrapDensity=G.expressionSystems[1];
 assert.deepEqual(bootstrapDensity,{name:'actual_n1_Tz_forward_integrand',parameters:[4756,2],
  body:117047,derivativeLimits:[4,6],
  implementation:'actual-continuation-exact-functions.mjs:materializeExpressionFunction',unspecifiedOracle:false});
 const induction=new inductionModule.ActualInductionExpressions(G,{maxNodes:1500000,maxDerivativeOrder:128});
 const density=copy(induction.expressionSystems[1]);assert.equal(jsonSha(density),DENSITY);
 const diagnosticRaw=await readFile(resolve(diagnosticsPath));assert.equal(sha(diagnosticRaw),DIAGNOSTICS);
 const diag=JSON.parse(diagnosticRaw);
 assert.equal(diag.allReachedRegistryInventory.find(v=>v.key==='expression:1').sha256,DENSITY);
 const support=supportModule.actualSupportOrderProof(p.completedOrderOne);
 assert(support.pass);assert.equal(support.endpoints.Xplus,28824);
 const context=Object.freeze({schema:'MathScope.N6.LiveAxialExteriorZeroContext/1',G,prepared:p});
 contexts.set(context,{G,p,root,sourceFiles,supportModule,support,supportSHA256:jsonSha(support),
  smallOrdering,smallOrderingSHA256:jsonSha(smallOrdering),terms,
  bootstrapDensity:copy(bootstrapDensity),density,diagnosticsPath:resolve(diagnosticsPath),
  prefixCount:G.nodes.length,prefixSHA256:jsonSha(G.nodes),definitions:G.captureFunctionDefinitions()});
 validateActualAxialExteriorSource(context);
 return context;
}

/** Reader options are adverse-test diagnostics, never replacement source authority. */
export function validateActualAxialExteriorSource(context,{readNode,readParameters}={}){
 const s=contextOf(context),G=s.G,get=readNode??(id=>G.nodes[id]);
 for(const [id,expected]of Object.entries(AXIAL_EXTERIOR_EXPECTED_NODES))
  assert.deepEqual(get(Number(id)),expected,'Changed actual exterior source node '+id);
 const e=(readParameters??(()=>G.source.parametersExactExpressions))();
 const expected={
  lambda:{exp:{product:[{integer:-1000},{ref:'T'}]}},
  BOuter:{product:[{integer:1000},{ref:'T'}]},
  X0Ipos:{product:[{ref:'XR'},{exp:{sum:[{ref:'T'},{integer:2},
   {product:[{integer:60},{ref:'BOuter'}]},{integer:-14}]}}]},
  IposRight:{product:[{ref:'X0Ipos'},{exp:{integer:5}}]},
  X0I1:{product:[{ref:'XR'},{exp:{sum:[{ref:'T'},{integer:2},
   {product:[{integer:60},{ref:'BOuter'}]},{integer:-25}]}}]},
  I1Right:{product:[{ref:'X0I1'},{exp:{integer:5}}]},
  loopIRight:{product:[{ref:'XR'},{exp:{sum:[{ref:'T'},{integer:3}]}}]}
 };
 for(const [key,value]of Object.entries(expected))assert.deepEqual(e[key],value,'Changed actual exterior endpoint '+key);
 contextOf(context);return copy(expected);
}

function endpointOrdering(context){
 const s=contextOf(context),G=s.G,p=s.p,q=(a,b=1)=>G.q(a,b),r=p.orderOne;
 const parameters=validateActualAxialExteriorSource(context);
 const Xv=p.constants.Xv,lambda=G.parameter('lambda'),XR=G.parameter('XR'),t1=G.parameter('t1');
 const pulse=G.outer.stages.find(v=>v.id==='pulse');
 assert.equal(Xv,3293);assert.equal(r.Xplus,G.mul(Xv,G.exp(G.one)));
 assert.equal(r.Xcut,G.mul(G.parameter('Xa'),G.exp(G.div(t1,q(32)))));
 assert.equal(p.inner.aSquared,G.mul(G.parameter('Xa'),G.exp(G.div(t1,q(16)))));
 assert.equal(pulse.length,G.div(q(13),lambda));
 assert.equal(G.outer.roots.Xp,613);
 assert.equal(Xv,G.mul(613,G.exp(pulse.length)));
 assert.equal(5089,G.mul(XR,G.exp(q(-5))));
 assert.equal(5093,G.mul(G.mul(XR,G.exp(G.one)),G.exp(G.parameter('T'))));
 assert.equal(r.supports[1][1],G.q(8193,4096));
 assert.equal(s.support.endpoints.lastU,29328);
 assert.equal(29328,G.mul(r.X0,G.pow(r.supports[1][1],2)));
 assert(8193n**2n<16n*4096n**2n);assert(16n<32n);
 assert(1n*16n<1n*32n);assert(5n-14n===-9n);
 assert(5n-25n===-20n);assert(2n+60000n*10n>3n);
 assert(64n>27n);assert(2n*(32n-10n)>1n);
 const upper=G.mul(Xv,G.exp(q(3,2)));
 return {coordinate:4756,parameterExpressions:parameters,
  actualEndpoints:copy(s.support.endpoints),
  strictChain:'Xcut28823<aSquared24805<1<XR12<IposRight28988<Xv3293<Xplus28824',
  domain:{kind:'strict-positive-outward-half-line',coordinate:4756,
   left:28824,leftSourceNode:copy(G.nodes[28824]),inequality:'X>Xplus>0'},
  optionalOutwardInterval:{left:28824,right:upper,rightSourceNode:copy(G.nodes[upper]),
   formula:'Jout=(Xplus,Xv*exp(3/2))',nonemptyReason:'1<3/2 and Xv>0'},
  exactLogComparisons:{
   IposRightOverXv:'exp(-9-13/lambda)<1',
   XplusOverXv:'exp(1)>1',
   tailLog:'X>Xplus=Xp*exp(13/lambda+1) implies log(X/Xp)>13/lambda+1>13/lambda',
   I1Support:'X>Xplus>I1Right=X0I1*exp(5), so X/X0I1>exp(5)>32',
   actualStepArguments:['2*(X/X0I1-9)>1','2*(X/X0I1-10)>1']},
  actualAverageCutoff:{source:29328,sourceNode:copy(G.nodes[29328]),
   normalizedSupport:29008,normalizedSupportSourceNode:copy(G.nodes[29008]),
   squaredSupport:29327,squaredSupportSourceNode:copy(G.nodes[29327]),
   formula:'lastU=X0Ipos*(8193/4096)^2',
   strictBound:'(8193/4096)^2<16<32<exp(5), so lastU<IposRight<Xv<Xplus',
   exactIntegerCheck:'8193^2<16*4096^2',
   actualAverageBranches:[29336,29436]},
  derivation:[
   'The authenticated exact parameter graph has T>10 and lambda=exp(-1000*T)>0; it is never set to zero. The scalar ordering proves0<t1<1, Xa=4/Lambda, and aSquared<loopILeft<1<XR.',
   'Xcut=Xa*exp(t1/32)<Xa*exp(t1/16)=aSquared<1. X0Ipos=XR*exp(60001*T-12)>XR and IposRight=X0Ipos*exp(5)>X0Ipos.',
   'The pulse source endpoints give Xv=XR*exp(T+2+60BOuter)*exp(13/lambda). Thus IposRight/Xv=exp(-9-13/lambda)<1, and Xplus=Xv*exp(1)>Xv.',
   'The leading patchRight=XR*exp(-5), decayEnd=XR*exp(T+1), loopIRight=XR*exp(T+3), and I1Right=XR*exp(T+2+60BOuter-20) are all strictly below Xv. This uses BOuter=1000*T and T>10.',
   'For the original logarithmic tail branch, positive X/Xp and monotonic log give log(X/Xp)>13/lambda. For the two actual I1 derivative bumps, X/X0I1>exp(5)>32>13.5 places their step arguments above1.',
   'All selections concern the same free X. No branch or endpoint inside an integral, and no shifted native argument, inherits this outward domain.'],
  numericalCoordinateComparisonUsed:false};
}

/** A diagnostic candidate is checked under the single fixed free-X exterior.
 * The production receipt itself always checks the exact ordered original roots.
 */
export function inspectActualAxialExteriorCandidate(context,root,{endpoint=28824}={}){
 const s=contextOf(context);assert.equal(endpoint,28824,'Exterior endpoint/scope must be original Xplus.');
 assert(Number.isSafeInteger(root)&&s.G.nodes[root],'Unknown exterior candidate.');
 const result=s.supportModule.checkActualExteriorZeros(s.G,[root],s.support,{endpoint});
 contextOf(context);return result;
}

export async function proveActualAxialExteriorZero(context){
 const s=contextOf(context),{G}=s;
 const parameters=validateActualAxialExteriorSource(context),ordering=endpointOrdering(context);
 const trace=s.supportModule.checkActualExteriorZeros(G,THREE,s.support,{endpoint:28824});
 assert(trace.pass);assert.equal(trace.visitedNodes,22);
 assert.deepEqual(trace.checks,THREE.map((expression,index)=>({index,expression,zero:true})));
 assert.deepEqual(trace.zeroBranchTrace,EXPECTED_TRACE);
 assert.equal(trace.compactIntegrandMistakenForZeroPrimitive,false);
 const eight=s.supportModule.checkActualExteriorZeros(G,s.terms,s.support,{endpoint:28824});
 assert(eight.pass);assert.deepEqual(eight.checks,s.terms.map((expression,index)=>({index,expression,zero:true})));
 const allTraceIDs=new Set([...Object.keys(AXIAL_EXTERIOR_EXPECTED_NODES).map(Number),
  29327,...THREE_VISITED,...eight.zeroBranchTrace.map(v=>v.node)]);
 for(const record of eight.zeroBranchTrace){
  assert(G.nodes[record.node]);
  if(record.selected==='after'){
   assert.equal(G.nodes[record.node].op,'smooth_piecewise');
   assert.equal(G.nodes[record.node].args[2],record.rightEndpoint);
   assert.equal(G.nodes[record.node].args[5],record.after);
  }
 }
 contextOf(context);
 for(const row of s.sourceFiles)assert.equal(sha(await readFile(resolve(s.root,row.path))),row.sha256,row.path);
 assert.equal(sha(await readFile(s.diagnosticsPath)),DIAGNOSTICS);
 // Reads above yield control. Reauthenticate the graph immediately before
 // serializing; a caller cannot retain source authority across a mutation.
 // The final byte pass is synchronous so a later awaited read cannot leave
 // an earlier file's stale verification in the receipt.
 for(const row of s.sourceFiles)assert.equal(sha(readFileSync(resolve(s.root,row.path))),row.sha256,row.path);
 assert.equal(sha(readFileSync(s.diagnosticsPath)),DIAGNOSTICS);
 contextOf(context);
 return {schema:'MathScope.N6.ActualAxialExteriorZero/1',
  sourceHeaderSHA256:HEADER,fixedDefinitionSHA256:FIXED,sourcePaperSHA256:PAPER,
  diagnosticsSHA256:DIAGNOSTICS,sourceFiles:copy(s.sourceFiles),
  originalConstructionOptions:{terms:0,bits:128,heatIterations:0},
  originalPrefixNodeCount:s.prefixCount,originalPrefixSHA256:s.prefixSHA256,
  originalSourcePrefixUnchanged:true,originalFunctionDefinitionsUnchanged:true,sourceBytesUnchanged:true,
  exactOriginalRoots:{U0:9236,U1:29289,Pi1:50558,v0:18778,v1:29440,
   X:4756,eta:2,Xv:3293,Xplus:28824,rawAxial:117045,density:117047},
  exteriorDomain:copy(ordering.domain),actualEndpointOrdering:ordering,
  actualSupportOrder:copy(s.support),actualScalarParameterOrdering:copy(s.smallOrdering),
  actualExteriorTrace:trace,actualThreeProfileVisitedNodes:[...THREE_VISITED],
  actualEightTermExteriorTrace:eight,
  selectedSourceNodes:Object.fromEntries([...allTraceIDs].sort((a,b)=>a-b).map(id=>[id,copy(G.nodes[id])])),
  actualRawAxialFormula:{root:117045,terms:[...s.terms],termRoles:[...TERM_ROLES],
   allEightOriginalTermsIndependentlyReconstructed:true,lambda1:25,
   leadingU0:9236,leadingv0:18778,U1:29289,v1:29440,Pi1:50558},
  actualDensity:{registry:'expression:1',bootstrapDefinition:copy(s.bootstrapDensity),
   definition:copy(s.density),definitionSHA256:DENSITY,component:'axial',
   guard:[4756,28814,28824],sourceNode:copy(G.nodes[117047]),
   angularGuardUsesDifferentRightEndpoint:28826},
  sourceConclusions:{actualThreeOriginalProfilesHaveZeroExteriorBranch:true,
   actualEightOriginalAxialTermZeroTracesBound:true,
   originalRawResidualAndSupportedDensityWrapperRetained:true},
  analyticPremises:[
   'The source zero checker is algebra on the retained branches. Every original factor/operand must have its actual finite value on the admitted outward positive-radius domain; no undefined expression is canceled by multiplying by zero.',
   'The separately accepted actual raw-residual/completed-profile regularity theorem supplies the ordinary derivatives and the finiteness of v0=18778,v1=29440 and all native/primitive operands. Their vanishing is not assumed by this receipt.',
   'Use joint actual smoothness before deducing higher derivative zeros or endpoint jets at Xplus, and preserve original inward eta endpoint conventions. Source incidence or a passing trace alone proves no derivative existence.',
   'For the strict source branch X>Xplus, the Pi1 after branch is zero; its interior50556 is not replaced by zero. Density gluing, total axial integral cancellation, and stress primitive gluing are separate statements.'],
  actualAnalyticCompositionApplied:false,
  analyticRightExteriorZeroProvedHere:false,rawAxialResidualZeroProvedHere:false,
  allDerivativeExistenceProvedHere:false,densityJoinsProvedHere:false,
  actualTotalAxialMomentZeroProvedHere:false,TzPrimitiveGluingProvedHere:false,
  numericalNormHonestyProvedHere:false,wholeGOnJProved:false,
  newOriginalGuardsDischarged:0,newOriginalJetsDischarged:0,newOriginalPDETermsDischarged:0};
}

async function rejectReadOnlyAlias(output,inputs){
 const maybeStat=async path=>{try{return await stat(path,{bigint:true});}
  catch(error){if(error.code==='ENOENT')return null;throw error;}};
 const outputStat=await maybeStat(output);
 const outputReal=outputStat?await realpath(output):null;
 for(const input of inputs){
  assert.notEqual(output,resolve(input),'Original input paths are read-only.');
  const inputReal=await realpath(input),inputStat=await stat(input,{bigint:true});
  assert.notEqual(outputReal,inputReal,'Output aliases an original read-only input.');
  assert(!(outputStat&&outputStat.dev===inputStat.dev&&outputStat.ino===inputStat.ino),
   'Output is a hardlink to an original read-only input.');
 }
}

export async function runAxialExteriorZeroCLI(args){
 assert.deepEqual(Object.keys(args).sort(),['diagnostics','kernel-root','out'],
  'Only source paths/output are accepted; no proof or endpoint overrides.');
 const output=resolve(args.out);
 const inputs=[resolve(args.diagnostics),...Object.keys(AXIAL_EXTERIOR_SOURCE_PINS)
  .map(path=>resolve(args['kernel-root'],path))];
 await rejectReadOnlyAlias(output,inputs);
 const context=await prepareActualAxialExteriorZero({kernelRoot:args['kernel-root'],diagnosticsPath:args.diagnostics});
 const result=await proveActualAxialExteriorZero(context);
 await mkdir(dirname(output),{recursive:true});await rejectReadOnlyAlias(output,inputs);
 await writeFile(output,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({schema:result.schema,actualSourceExteriorZero:true,
  actualRootCount:3,sourceEightTermsRetained:8,analyticCompositionApplied:false,newOriginalDischarged:0}));
 return result;
}
async function main(){
 const args={};
 for(let j=2;j<process.argv.length;j+=2){
  assert(process.argv[j].startsWith('--')&&process.argv[j+1],'Use complete named path arguments.');
  const key=process.argv[j].slice(2);assert(!Object.hasOwn(args,key),'Duplicate argument.');args[key]=process.argv[j+1];
 }
 await runAxialExteriorZeroCLI(args);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();

