/** Exact same-source leading/inner restriction on an open Xminus collar.
 * Integrals and native calls are opaque to restriction. Their retained bodies
 * are compared separately by lexical alpha-equivalence, with no atomic leaves.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const BASE='research-ide/mathscope-m2/navier/';
export const COLLAR_SOURCE_PINS=Object.freeze(Object.fromEntries(Object.entries({
 'actual-continuation-exact-stress.mjs':'22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2',
 'actual-continuation-exact-inner.mjs':'3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8',
 'actual-continuation-exact-order-one.mjs':'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72',
 'actual-continuation-exact-global.mjs':'497e18fc52c10b9eb482bdb6cc18b406c02f453dc19663ba5535c13a41ec015f',
 'actual-continuation-exact-b8.mjs':'1e0d6586a60ee5aa3d5315c40f624ebb9e8a4925a00117818d41d6697fc67baf',
 'actual-continuation-exact-pregluing.mjs':'7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3',
 'actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
 'actual-global-source-expressions.mjs':'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
 'actual-global-primitive-kernels.mjs':'efebfbcfb124f5bed96bf13435333cb784a0d5cab319303a0244c788ce1bed59'
}).map(([name,pin])=>[BASE+name,pin])));
const HEADER='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1',
 FIXED='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b',
 PAPER='0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',
 DIAGNOSTICS='b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1';
const contexts=new WeakMap(),orders=new WeakMap();
const sha=raw=>createHash('sha256').update(raw).digest('hex');
const jsonSha=value=>sha(JSON.stringify(value));
const node=(op,args)=>({op,args});

// Only these literal free-X branches are restricted. The source ordering
// proof below supplies strict inequalities for each selected endpoint.
const BRANCHES=new Map([
 [5175,[[4756,4567,5089,5090,5174,5157],3]],
 [5090,[[4756,4564,4567,4789,4795,3458],3]],
 [4789,[[4756,3617,3618,4786,4788,4481],4]],
 [7959,[[4756,6257,6258,0,7958,0],3]],
 [24858,[[4756,3617,24805,4786,4788,4788],4]],
 [9239,[[4756,6257,7982,5293,9238,5293],3]],
 [5293,[[4756,4567,5089,5270,5292,5173],3]],
 [5270,[[4756,4564,4567,5260,5269,4678],3]],
 [5260,[[4756,3617,3618,5180,5255,5259],4]],
 [18778,[[4756,6257,7982,6202,18777,6202],3]],
 [6202,[[4756,3617,5089,6201,6193,6193],4]],
 [6182,[[4756,4567,5089,5696,6149,6181],3]],
 [5696,[[4756,4564,4567,5675,5689,5695],3]],
 [5675,[[4756,3617,3618,5302,5665,5674],4]],
 [24914,[[4756,3617,24805,6201,24913,24913],4]],
 [18767,[[4756,6257,7982,6182,18766,6182],3]]
]);
const PRIMITIVES={
 5254:node('definite_integral',[5253,5249,3617,4756]),
 5255:node('add',[4486,5254]),
 5664:node('definite_integral',[5663,5249,3617,4756]),
 5665:node('add',[5306,5664]),
 24898:node('definite_integral',[24897,24859,3617,4756]),
 24899:node('add',[4486,24898]),
 24907:node('definite_integral',[24906,24859,3617,4756]),
 24908:node('add',[5306,24907])
};

function contextOf(context){
 const s=contexts.get(context);assert(s,'Use the live authenticated collar context; copied receipts are not authority.');
 assert.equal(jsonSha(s.G.nodes.slice(0,s.prefixCount)),s.prefixSHA256,'Original source prefix changed.');
 assert(s.G.functionDefinitionsUnchanged(s.definitions),'Original function definitions changed.');
 return s;
}

/** Authenticate original bytes/diagnostics, then construct the unchanged source.
 * Only diagnostic graph nodes may be appended after this call.
 */
export async function prepareActualLeadingInnerCollar({kernelRoot,diagnosticsPath}){
 const root=resolve(kernelRoot),sourceFiles=[];
 for(const [path,pin]of Object.entries(COLLAR_SOURCE_PINS)){
  const raw=await readFile(resolve(root,path));assert.equal(sha(raw),pin,path);
  sourceFiles.push({path,sha256:pin,bytes:raw.length});
 }
 const raw=await readFile(resolve(diagnosticsPath));assert.equal(sha(raw),DIAGNOSTICS,'Original diagnostics pin.');
 const diag=JSON.parse(raw);assert.equal(diag.headerBinding.sourceHeaderRecordSHA256,HEADER);
 assert.equal(jsonSha(diag.fullNativePayloads.fixed),FIXED);
 const source=await import(pathToFileURL(resolve(root,BASE+'actual-continuation-exact-stress.mjs')));
 const primitive=await import(pathToFileURL(resolve(root,BASE+'actual-global-primitive-kernels.mjs')));
 const p=source.prepareActualOrderOneStressProgram({terms:0,bits:128,heatIterations:0}),G=p.G;
 assert.equal(G.source.sourcePaperSHA256,PAPER);
 assert.deepEqual({source:G.source,core:G.core,pressure:G.pressure,outer:G.outer,naturalKernel:G.naturalKernel},diag.fullNativePayloads.fixed);
 assert.deepEqual(G.picardSystems[0],diag.fullNativePayloads['picard:0']);
 assert.deepEqual([p.constants.X,p.constants.eta,p.finalU,p.finalM,p.finalv,p.inner.U0,p.inner.v0],
  [4756,2,9236,9239,18778,24858,24914]);
 let diagnosticOverlap=0;
 for(const [id,n]of Object.entries(diag.argumentAndContextGraph))if(Number(id)<G.nodes.length){assert.deepEqual(G.nodes[Number(id)],n);diagnosticOverlap++;}
 assert(diagnosticOverlap>0);
 for(const [id,[args]]of BRANCHES)assert.deepEqual(G.nodes[id],node('smooth_piecewise',args),'Original collar guard '+id);
 for(const [id,n]of Object.entries(PRIMITIVES))assert.deepEqual(G.nodes[id],n,'Original collar primitive '+id);
 assert.equal(G.derivative(p.finalM,p.constants.eta),18767);
 assert.equal(G.derivative(5293,p.constants.eta),6182);
 assert.equal(G.derivative(5255,p.constants.eta),5665);
 assert.equal(G.derivative(24899,p.constants.eta),24908);
 assert.equal(G.derivative(4486,p.constants.eta),5306);
 const context=Object.freeze({schema:'MathScope.N6.LiveLeadingInnerCollarContext/1',G,prepared:p});
 contexts.set(context,{G,p,root,sourceFiles,diagnosticOverlap,primitive,
  prefixCount:G.nodes.length,prefixSHA256:jsonSha(G.nodes),definitions:G.captureFunctionDefinitions()});
 return context;
}

/** Exact ordering on a genuine open collar through the historical Xminus.
 * All enormous scales are compared through their defining logs/exponents.
 */
export function proveActualCollarOrdering(context){
 const s=contextOf(context),{G,p}=s,e=G.source.parametersExactExpressions;
 const expected={
  Q:{quotient:[{product:[{integer:String(1n<<260n)},{ref:'K'}]},{power:[{ref:'sigmaStar'},2]}]},
  K:{power:[{ref:'Pstar'},2]},Pstar:{exp:{ref:'logP'}},logP:{product:[{integer:2},{ref:'T'}]},
  T:{sum:[{exp:{ref:'Md'}},{integer:10}]},Md:{integer:1048576},
  h:{exp:{product:[{integer:-8002},{ref:'T'}]}},j0:{power:[{ref:'h'},4]},
  sigmaStar:{quotient:[{ref:'j0'},{integer:2000}]},
  Lambda:{power:[{ref:'Q'},64]},Xa:{quotient:[{integer:4},{ref:'Lambda'}]},
  t1:{power:[{ref:'CSelected'},-120]},CSelected:{exp:{ref:'logCSelected'}},
  logCSelected:{sum:[{product:[{integer:10},{log:{sum:[{integer:1},{ref:'BRefUpper'}]}}]},{power:[{ref:'Q'},200]}]},
  BRefUpper:{power:[{ref:'Q'},300]},
  XR:{product:[{integer:110},{power:[{product:[{ref:'CSelected'},{ref:'Pstar'}]},10]}]},
  loopILeft:{product:[{quotient:[{integer:4},{ref:'Lambda'}]},{exp:{quotient:[{ref:'t1'},{integer:8}]}}]},
  BOuter:{product:[{integer:1000},{ref:'T'}]},
  X0I1:{product:[{ref:'XR'},{exp:{sum:[{ref:'T'},{integer:2},{product:[{integer:60},{ref:'BOuter'}]},{integer:-25}]}}]}
 };
 for(const [key,value]of Object.entries(expected))assert.deepEqual(e[key],value,'Source parameter '+key);
 const q=(n,d=1)=>G.q(n,d),Xa=G.parameter('Xa'),t1=G.parameter('t1'),XR=G.parameter('XR');
 assert.equal(Xa,3617);assert.equal(G.parameter('loopILeft'),6257);
 assert.equal(G.parameter('X0I1'),7981);
 assert.equal(p.orderOne.Xminus,28814);assert.equal(p.orderOne.Xkeep,28819);
 assert.equal(p.inner.aSquared,24805);
 assert.equal(p.orderOne.Xminus,G.mul(Xa,G.exp(G.div(t1,q(128)))));
 assert.equal(p.orderOne.Xkeep,G.mul(Xa,G.exp(G.div(t1,q(64)))));
 assert.equal(p.inner.aSquared,G.mul(Xa,G.exp(G.div(t1,q(16)))));
 assert.equal(4564,G.mul(XR,G.exp(q(-8))));assert.equal(4567,G.mul(XR,G.exp(q(-7))));
 assert.equal(5089,G.mul(XR,G.exp(q(-5))));assert.deepEqual(G.nodes[3618],node('rational',['110','1']));
 const stepArgumentNodes={
  9195:node('inverse',[7981]),9196:node('multiply',[4756,9195]),
  8843:node('rational',['-9','1']),688:node('rational',['-10','1']),
  9197:node('add',[8843,9196]),9198:node('multiply',[24,9197]),
  9202:node('add',[688,9196]),9203:node('multiply',[24,9202]),
  24:node('rational',['2','1']),4756:node('coordinate',['X'])
 };
 for(const [id,n]of Object.entries(stepArgumentNodes))assert.deepEqual(G.nodes[id],n,'Original I1 free-X argument '+id);
 // Cross-products compare exact positive exponent coefficients, never X.
 const coeffs=[[1n,256n],[1n,128n],[3n,256n],[1n,64n],[1n,16n],[1n,8n]];
 const inequalities=coeffs.slice(1).map((b,j)=>{
  const a=coeffs[j],left=a[0]*b[1],right=b[0]*a[1];assert(left<right);
  return {left:String(left),right:String(right),strict:true};
 });
 assert(1048576n+11n>10n);assert(12n<(1n<<16640n));assert(20n*10n>8n);
 assert(60001n*10n-23n>0n);assert((1n<<120n)>1n);
 const token=Object.freeze({schema:'MathScope.N6.ActualLeadingInnerCollarOrdering/1',
  coordinate:4756,eta:2,
  openCollar:{left:'Xa*exp(t1/256)',right:'Xa*exp(3*t1/256)',contains:'Xminus=Xa*exp(t1/128)',
   containment:'Xa<left<Xminus<right<Xkeep<aSquared<loopILeft<1'},
  exactExponentCrossProducts:inequalities,
  actualEndpointNodeBindings:{Xa:3617,Xminus:28814,Xkeep:28819,aSquared:24805,loopILeft:6257,X0I1:7981},
  actualI1StepArgumentSourceNodes:stepArgumentNodes,
  exactScaleInequalities:{LambdaLowerExponent:'16640',smallEndpointNumerator:'12',
   smallEndpointUpperDenominator:'2^16640',logXRStrictLower:'20*T>200',
   logRestLeftStrictLower:'20*T-8>192',I1LogRatio:'60001*T-23>0'},
  derivation:[
   'T=exp(1048576)+10>1048576+11>10; h=exp(-8002*T) lies strictly between0 and1, so0<sigmaStar=h^4/2000<1. K=Pstar^2>1 and the literal Q formula imply Q>2^260.',
   'Lambda=Q^64>2^16640. logCSelected>Q^200>1 implies CSelected>e>2, so0<t1=CSelected^-120<2^-120<1.',
   'For0<t1<1, exp(t1/8)<e<3. The bound e<3 follows from n!>=2^(n-1) for n>=2, strict for n>=3, and the geometric series. Therefore loopILeft=(4/Lambda)*exp(t1/8)<12/2^16640<1.',
   'Multiplying the exact coefficient inequalities by positive t1 and using strict monotonicity of exp proves Xa<collarLeft<Xminus<collarRight<Xkeep<aSquared<loopILeft.',
   'log XR=log110+10logCSelected+20T>20T>200. Hence restLeft=XR*exp(-8)>1, with restLeft<restRight=XR*exp(-7)<patchRight=XR*exp(-5). Xi=110>1.',
   'BOuter=1000T makes X0I1/XR=exp(T+2+60BOuter-25)=exp(60001T-23)>1. Thus X<Xkeep<1<XR<X0I1 on the entire collar.',
   'The I1 arguments2*(X/X0I1-9) and2*(X/X0I1-10) are strictly negative there. The literal source step is constant zero for negative arguments, so its first derivative is exactly zero.'],
  numericalCoordinateComparisonUsed:false});
 orders.set(token,{context,G,coordinate:4756,parameterSHA256:jsonSha(e),receiptSHA256:jsonSha(token)});
 return token;
}

function orderOf(context,token){
 const s=contextOf(context),o=orders.get(token);
 assert(o&&o.context===context&&o.G===s.G,'Copied or cross-graph collar certificate.');
 assert.equal(jsonSha(token),o.receiptSHA256,'Live collar receipt data changed.');
 assert.equal(jsonSha(s.G.source.parametersExactExpressions),o.parameterSHA256);
 return s;
}

/** Restrict only in the literal FREE X domain. No descent under any binder or
 * actual_expression_partial occurs, including its arguments and endpoints.
 * readNode supports isolated adverse readers in tests; it is not proof authority.
 */
export function restrictActualLeadingCollar(context,root,token,{readNode}={}){
 const s=orderOf(context,token),G=s.G,get=readNode??(i=>G.nodes[i]),cache=new Map(),trace=[],opaque=[];
 assert(Number.isSafeInteger(root)&&G.nodes[root],'Unknown restriction root.');
 function at(id){
  if(cache.has(id))return cache.get(id);
  const n=get(id);assert(n&&Array.isArray(n.args),'Missing actual node '+id);
  const {op,args:a}=n;let out=id;
  if(['add','multiply','inverse','integer_power'].includes(op))
   assert.deepEqual(n,G.nodes[id],'Changed actual arithmetic source operand '+id);
  if(op==='smooth_piecewise'){
   assert.equal(a[0],4756,'No collar transport to a shifted/bound branch coordinate.');
   const rule=BRANCHES.get(id);assert(rule,'Unreviewed free-X guard '+id);
   assert.deepEqual(n,node('smooth_piecewise',rule[0]),'Changed actual branch '+id);
   const branch=rule[1];trace.push({node:id,sourceNode:n,selected:branch===3?'before':'middle',selectedRoot:a[branch]});
   out=at(a[branch]);
  }else if(op==='source_step_derivative'&&[9198,9203].includes(a[0])){
   assert.deepEqual(n,node('source_step_derivative',[id===9199?9198:9203,1]),'Changed I1 derivative support.');
   assert([9199,9204].includes(id),'Unreviewed I1 derivative order.');
   const expected=id===9199?G.div(G.sub(G.div(4756,G.parameter('X0I1')),G.q(9)),G.q(1,2)):
    G.div(G.sub(G.div(4756,G.parameter('X0I1')),G.q(10)),G.q(1,2));
   assert.equal(a[0],expected);assert.deepEqual(get(a[0]),G.nodes[expected],'Changed I1 step argument.');
   trace.push({node:id,sourceNode:n,rule:'first derivative of the same constant-zero step on a strictly negative free-X argument'});out=G.zero;
  }else if(op==='add')out=G.add(...a.map(at));
  else if(op==='multiply')out=G.mul(...a.map(at));
  else if(op==='inverse')out=G.inv(at(a[0]));
  else if(op==='integer_power')out=G.pow(at(a[0]),a[1]);
  else{
   assert.deepEqual(n,G.nodes[id],'Changed opaque source operand '+id);
   opaque.push({node:id,operation:op,lexicalBodiesAndArgumentsNotRestricted:true});
  }
  cache.set(id,out);return out;
 }
 const reduced=at(root);contextOf(context);
 return {root,reduced,trace,opaque,domain:token.openCollar,
  scope:'literal free X only; all integral bodies/endpoints and native calls opaque'};
}

/** Exact retained-body identity; no derivative, primitive or moment assumption. */
export function compareActualCollarBodies(context,left,right){
 const s=contextOf(context),check=s.primitive.explicitPrimitiveBodyIdentity(s.G,left,right,{maxVisits:600000});
 assert(check.pass,'Actual collar body identity failed.');return check;
}

export async function proveActualLeadingInnerCollar(context){
 const s=contextOf(context),{G}=s,ordering=proveActualCollarOrdering(context),projections={};
 for(const [name,id]of Object.entries({globalU:9236,innerU:24858,globalM:9239,globalMeta:18767,globalv:18778,innerv:24914}))
  projections[name]=restrictActualLeadingCollar(context,id,ordering);
 const checks={
  U:compareActualCollarBodies(context,projections.globalU.reduced,projections.innerU.reduced),
  M:compareActualCollarBodies(context,projections.globalM.reduced,24899),
  M_eta:compareActualCollarBodies(context,projections.globalMeta.reduced,24908),
  v:compareActualCollarBodies(context,projections.globalv.reduced,projections.innerv.reduced)
 };
 assert.equal(projections.globalU.reduced,4788);assert.equal(projections.globalM.reduced,5255);
 assert.equal(projections.globalMeta.reduced,5665);assert.equal(projections.innerv.reduced,24913);
 const primitiveNodes=Object.fromEntries(Object.keys(PRIMITIVES).map(id=>[id,G.nodes[id]]));
 for(const [id,n]of Object.entries(PRIMITIVES))assert.deepEqual(G.nodes[id],n);
 contextOf(context);
 for(const row of s.sourceFiles)assert.equal(sha(await readFile(resolve(s.root,row.path))),row.sha256,row.path);
 return {schema:'MathScope.N6.ActualLeadingInnerCollar/1',sourceHeaderSHA256:HEADER,
  fixedDefinitionSHA256:FIXED,sourcePaperSHA256:PAPER,diagnosticsSHA256:DIAGNOSTICS,
  sourceFiles:s.sourceFiles,originalConstructionOptions:{terms:0,bits:128,heatIterations:0},
  originalPrefixNodeCount:s.prefixCount,originalPrefixSHA256:s.prefixSHA256,diagnosticOverlap:s.diagnosticOverlap,
  originalSourcePrefixUnchanged:true,originalFunctionDefinitionsUnchanged:true,sourceBytesUnchanged:true,
  actualOriginalRoots:{globalU:9236,globalM:9239,globalMeta:18767,globalv:18778,innerU:24858,innerv:24914},
  actualDerivativeBindings:[
   {source:9239,coordinate:2,derivative:18767},
   {source:5293,coordinate:2,derivative:6182},
   {source:5255,coordinate:2,derivative:5665},
   {source:24899,coordinate:2,derivative:24908},
   {source:4486,coordinate:2,derivative:5306}],
  ordering,projections,exactBodyChecks:checks,retainedMassPrimitiveNodes:primitiveNodes,
  originalNaturalMassConstant:4486,originalNaturalMassEtaConstant:5306,
  conclusions:{sameActualLeadingUOnOpenXminusCollar:true,sameActualLeadingMassAndEtaDerivative:true,
   sameActualLeadingvOnOpenXminusCollar:true,actualBoundVariablesAlphaRenamed:true,
   noMomentOrDerivativeIdentityAssumedByBodyComparison:true},
  derivativeInterpretation:'Equality of these same-source functions on an open collar gives equality of every existing fixed ordinary derivative there. Joint smoothness and inward eta endpoint jets retain their separately authenticated completed-profile prerequisites.',
  allDerivativeExistenceProvedHere:false,actualPositiveOrderAverageEqualsPicardKProvedHere:false,
  densityJoinsProvedHere:false,actualTotalAxialMomentZeroProvedHere:false,TzPrimitiveGluingProvedHere:false,
  boundedPiecewiseIntegrabilityProvedHere:false,numericalNormHonestyProvedHere:false,
  wholeGOnJProved:false,newOriginalGuardsDischarged:0,newOriginalJetsDischarged:0,newOriginalPDETermsDischarged:0};
}

async function main(){
 const args={};for(let j=2;j<process.argv.length;j+=2){assert(process.argv[j].startsWith('--')&&process.argv[j+1]);args[process.argv[j].slice(2)]=process.argv[j+1];}
 for(const key of ['kernel-root','diagnostics','out'])assert(args[key],'--'+key+' is required');
 const context=await prepareActualLeadingInnerCollar({kernelRoot:args['kernel-root'],diagnosticsPath:args.diagnostics});
 const result=await proveActualLeadingInnerCollar(context);await mkdir(dirname(resolve(args.out)),{recursive:true});
 await writeFile(resolve(args.out),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({schema:result.schema,actualLeadingInnerCollar:true,
  exactBodyChecks:Object.fromEntries(Object.entries(result.exactBodyChecks).map(([k,v])=>[k,v.pass])),
  originalPrefixUnchanged:true,newOriginalDischarged:0}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
