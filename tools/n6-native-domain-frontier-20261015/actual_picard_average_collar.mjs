/** Same-source Picard average and positive-order restriction on Xminus.
 *
 * The literal t-integrals are never restricted using the caller collar.
 * Their FTC/parameter calculus uses the FULL common Picard interval [0,a^2].
 * This source/calculus receipt is conditional on the accepted same-system
 * genuine Picard regularity theorem; a separate application composes it.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {COLLAR_SOURCE_PINS,prepareActualLeadingInnerCollar,
 proveActualCollarOrdering} from './actual_leading_inner_collar.mjs';

const BASE='research-ide/mathscope-m2/navier/';
export const PICARD_AVERAGE_SOURCE_PINS=Object.freeze({...COLLAR_SOURCE_PINS,
 [BASE+'actual-continuation-exact-identities.mjs']:'bf7ba32a83fc5297de59cc620e24488d56a1e4c718e5b297373e78dbaf22b712'});
const HEADER='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1';
const FIXED='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b';
const PAPER='0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f';
const DIAGNOSTICS='b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1';
const PICARD='c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60';
const contexts=new WeakMap();
const sha=b=>createHash('sha256').update(b).digest('hex');
const jsonSha=v=>sha(JSON.stringify(v));
const n=(op,args)=>({op,args});
const copy=v=>structuredClone(v);

export const PICARD_AVERAGE_EXPECTED_NODES=Object.freeze({
 0:n('rational',['0','1']),1:n('rational',['1','1']),2:n('coordinate',['eta']),
 8:n('source_parameter',['lambda']),9:n('source_parameter',['h']),
 19:n('rational',['1','2']),20:n('rational',['-1','1']),
 21:n('multiply',[9,20]),22:n('add',[19,21]),23:n('add',[9,19]),
 24:n('rational',['2','1']),25:n('multiply',[9,24]),
 28:n('add',[1,27]),30:n('add',[1,29]),1953:n('inverse',[28]),
 4756:n('coordinate',['X']),24806:n('sqrt_positive',[24805]),
 28835:n('actual_background_even_profile',[0,1,4756,2,0,0]),
 28839:n('smooth_piecewise',[4756,28819,28823,28835,28838,0]),
 28987:n('source_parameter',['X0Ipos']),28988:n('source_parameter',['IposRight']),
 29008:n('rational',['8193','4096']),
 29268:n('smooth_piecewise',[4756,28987,28988,0,29267,0]),
 29289:n('add',[28839,29268]),
 29327:n('rational',['67125249','16777216']),
 29328:n('multiply',[28987,29327]),
 29329:n('coordinate',['actual_n1_axis_average$200']),
 29330:n('multiply',[4756,29329]),
 29331:n('actual_background_even_profile',[0,1,29330,2,0,0]),
 29332:n('definite_integral',[29331,29329,0,1]),
 29333:n('multiply',[4756,29332]),
 29334:n('smooth_piecewise',[4756,28819,29328,29333,29326,0]),
 29335:n('multiply',[6185,29334]),
 29336:n('smooth_piecewise',[4756,28819,29328,29332,29335,0]),
 29342:n('actual_background_even_profile',[0,1,29330,2,0,1]),
 29343:n('definite_integral',[29342,29329,0,1]),
 29436:n('smooth_piecewise',[4756,28819,29328,29343,29435,0]),
 29440:n('multiply',[1953,29439]),
 50557:n('actual_background_even_profile',[0,3,4756,2,0,0]),
 50558:n('smooth_piecewise',[4756,28819,28824,50557,50556,0]),
});
const expectedNodesSHA=jsonSha(PICARD_AVERAGE_EXPECTED_NODES);
const BRANCHES=new Map([[28839,3],[29268,3],[29334,3],[29336,3],[29436,3],[50558,3]]);
const ROOTS=Object.freeze({average:29336,literalAverage:29332,averageEta:29436,
 literalAverageEta:29343,U1:29289,Pi1:50558,v1:29440,innerU:28835,
 innerPi:50557,system:0,xi:25516,X:4756,eta:2,lambda1:25});

function contextOf(context){
 const s=contexts.get(context);assert(s,'Use the live authenticated Picard-average context.');
 assert.equal(jsonSha(PICARD_AVERAGE_EXPECTED_NODES),expectedNodesSHA,'Internal source pin changed.');
 assert.equal(jsonSha(s.G.nodes.slice(0,s.prefixCount)),s.prefixSHA256,'Original average source prefix changed.');
 assert(s.G.functionDefinitionsUnchanged(s.definitions),'Original average function definitions changed.');
 assert.equal(jsonSha(s.ordering),s.orderingSHA256,'Live average collar ordering changed.');
 return s;
}

/** Read-only source authentication; later graph operations may only append. */
export async function prepareActualPicardAverageCollar({kernelRoot,diagnosticsPath}){
 const root=resolve(kernelRoot),sourceFiles=[];
 for(const [path,pin]of Object.entries(PICARD_AVERAGE_SOURCE_PINS)){
  const raw=await readFile(resolve(root,path));assert.equal(sha(raw),pin,path);
  sourceFiles.push({path,sha256:pin,bytes:raw.length});
 }
 const leading=await prepareActualLeadingInnerCollar({kernelRoot:root,diagnosticsPath});
 const G=leading.G,p=leading.prepared,ordering=proveActualCollarOrdering(leading);
 const primitive=await import(pathToFileURL(resolve(root,BASE+'actual-global-primitive-kernels.mjs')));
 const algebra=await import(pathToFileURL(resolve(root,BASE+'actual-continuation-exact-identities.mjs')));
 assert.equal(jsonSha(G.picardSystems[0]),PICARD);
 assert.deepEqual([p.inner.system,p.constants.X,p.constants.eta,p.inner.lambda1,
  p.orderOne.M1overX,p.orderOne.U1,p.orderOne.Pi1,p.orderOne.v1],
  [0,4756,2,25,29336,29289,50558,29440]);
 for(const [id,expected]of Object.entries(PICARD_AVERAGE_EXPECTED_NODES))
  assert.deepEqual(G.nodes[id],expected,'Original average source node '+id);
 assert.equal(G.derivative(29336,2),29436);
 assert.equal(G.derivative(29332,2),29343);
 const context=Object.freeze({schema:'MathScope.N6.LivePicardAverageCollarContext/1',G,prepared:p});
 contexts.set(context,{G,p,leading,root,sourceFiles,primitive,algebra,ordering,
  orderingSHA256:jsonSha(ordering),diagnosticsPath:resolve(diagnosticsPath),
  prefixCount:G.nodes.length,prefixSHA256:jsonSha(G.nodes),definitions:G.captureFunctionDefinitions()});
 validateActualPicardAverageSource(context);
 return context;
}

/** Isolated readers support adverse tests; they cannot authorize a new source. */
export function validateActualPicardAverageSource(context,{readNode,readSystem}={}){
 const s=contextOf(context),G=s.G,get=readNode??(id=>G.nodes[id]);
 const system=(readSystem??(id=>G.picardSystems[id]))(0);
 for(const [id,expected]of Object.entries(PICARD_AVERAGE_EXPECTED_NODES))
  assert.deepEqual(get(Number(id)),expected,'Changed actual average source node '+id);
 assert.equal(system.xi,25516,'Changed Picard radial coordinate.');
 assert.equal(system.eta,2,'Changed Picard eta coordinate.');
 assert.equal(system.order,1,'Changed original Picard order.');
 assert.deepEqual(system.diagonal,[0,0,2,0,3,1],'Changed original Picard diagonal.');
 assert.deepEqual(system.A0[1],[0,0,0,0,0,1],'Changed actual Picard U row.');
 assert.deepEqual(system.A0[2],[0,0,0,0,0,20],'Changed actual Picard K sign/row.');
 assert.deepEqual(system.A1[1],[0,0,0,0,0,0],'Changed actual Picard U eta source.');
 assert.deepEqual(system.A1[2],[0,0,0,0,0,0],'Changed actual Picard K eta source.');
 assert.equal(system.forcing[1],0,'Changed actual Picard U forcing.');
 assert.equal(system.forcing[2],0,'Changed actual Picard K forcing.');
 assert.deepEqual(system.zeroAxisDatum,[0,0,0,0,0,0],'Changed actual zero-axis data.');
 assert.deepEqual(system.radialDomain,[0,24806],'Changed full common Picard radial interval.');
 assert.equal(jsonSha(system),PICARD,'Changed same-source complete Picard definition.');
 contextOf(context);
 return {system:0,definitionSHA256:PICARD,xi:25516,eta:2,order:1,
  diagonal:copy(system.diagonal),Urow:copy(system.A0[1]),Krow:copy(system.A0[2]),
  A1U:copy(system.A1[1]),A1K:copy(system.A1[2]),
  forcingU:system.forcing[1],forcingK:system.forcing[2],
  zeroAxisDatum:copy(system.zeroAxisDatum),commonRadialDomain:copy(system.radialDomain),
  commonASquared:24805,equations:['partial_xi U=W5','partial_xi K=-2*K/xi-W5'],
  allSourceRowsCompared:true};
}

function provePositiveOrdering(context){
 const s=contextOf(context),G=s.G,e=G.source.parametersExactExpressions,q=(a,b=1)=>G.q(a,b);
 const expected={
  X0Ipos:{product:[{ref:'XR'},{exp:{sum:[{ref:'T'},{integer:2},
   {product:[{integer:60},{ref:'BOuter'}]},{integer:-14}]}}]},
  IposRight:{product:[{ref:'X0Ipos'},{exp:{integer:5}}]}
 };
 for(const [key,value]of Object.entries(expected))assert.deepEqual(e[key],value,'Original positive-order endpoint '+key);
 assert.equal(s.p.orderOne.X0,28987);assert.equal(s.p.orderOne.IposRight,28988);
 assert.equal(s.p.orderOne.supports[1][1],29008);
 assert.equal(G.pow(29008,2),29327);assert.equal(G.mul(28987,29327),29328);
 assert(8193n>4096n);assert(25n-14n===11n);assert(11n>0n);
 return {parameterExpressions:expected,actualX0Ipos:28987,actualIposRight:28988,
  actualLastU:29328,lastUNormalizedRight:29008,exactLastUFactor:'(8193/4096)^2>1',
  proof:'X0Ipos/X0I1=exp(11)>1. The authenticated leading ordering gives Xkeep<1<X0I1, hence Xkeep<X0Ipos<lastU. IposRight/X0Ipos=exp(5)>1.',
  noNumericalEndpointEvaluation:true};
}

/** A fresh local cache; no traversal into an integral/native lexical scope. */
export function restrictActualPositiveOrderCollar(context,root,{readNode}={}){
 const s=contextOf(context),G=s.G;validateActualPicardAverageSource(context);
 provePositiveOrdering(context);
 const get=readNode??(id=>G.nodes[id]),cache=new Map(),trace=[],opaque=[];
 assert(Number.isSafeInteger(root)&&G.nodes[root],'Unknown positive-order collar root.');
 function visit(id){
  if(cache.has(id))return cache.get(id);
  const actual=get(id);assert.deepEqual(actual,G.nodes[id],'Changed positive collar operand '+id);
  const {op,args}=actual;let value=id;
  if(op==='smooth_piecewise'){
   assert.equal(args[0],4756,'No positive collar transport to shifted/bound coordinates.');
   const branch=BRANCHES.get(id);assert(branch!==undefined,'Unreviewed positive collar branch '+id);
   assert.deepEqual(actual,PICARD_AVERAGE_EXPECTED_NODES[id],'Changed positive collar branch '+id);
   trace.push({node:id,sourceNode:copy(actual),selected:'before',selectedRoot:args[branch]});
   value=visit(args[branch]);
  }else if(op==='add')value=G.add(...args.map(visit));
  else if(op==='multiply')value=G.mul(...args.map(visit));
  else if(op==='inverse')value=G.inv(visit(args[0]));
  else if(op==='integer_power')value=G.pow(visit(args[0]),args[1]);
  else opaque.push({node:id,operation:op,lexicalBodiesAndArgumentsNotRestricted:true});
  cache.set(id,value);return value;
 }
 const reduced=visit(root);contextOf(context);
 return {root,reduced,trace,opaque,domain:copy(s.ordering.openCollar),
  scope:'free X only; full t-integral bodies/endpoints and native calls opaque'};
}

function equal(s,left,right){
 const check=s.primitive.explicitPrimitiveBodyIdentity(s.G,left,right,{maxVisits:600000});
 assert(check.pass,'Actual Picard-average source body identity failed.');return check;
}
const vFormula=(G,U,average,averageEta)=>{
 const {D,d,L}=G.core,q=(a,b=1)=>G.q(a,b),eta=2,nu=25;
 return G.div(G.sub(G.sub(G.mul(q(2),eta,U),
  G.mul(q(2),eta,G.add(D,nu),average)),G.mul(d,averageEta)),L);
};

/** Conditional algebra substitutes ONLY the two authenticated average atoms.
 * It creates diagnostic nodes and never changes any original node or body.
 */
function conditionalAverageSubstitution(s,root,average,averageEta){
 const G=s.G,cache=new Map(),map=new Map([[29332,average],[29343,averageEta]]);
 function visit(id){
  if(map.has(id))return map.get(id);
  if(cache.has(id))return cache.get(id);
  const {op,args}=G.nodes[id];let value=id;
  if(op==='add')value=G.add(...args.map(visit));
  else if(op==='multiply')value=G.mul(...args.map(visit));
  else if(op==='inverse')value=G.inv(visit(args[0]));
  else if(op==='integer_power')value=G.pow(visit(args[0]),args[1]);
  cache.set(id,value);return value;
 }
 return visit(root);
}

export async function proveActualPicardAverageCollar(context){
 const s=contextOf(context),{G,p}=s,rows=validateActualPicardAverageSource(context);
 const positiveOrdering=provePositiveOrdering(context);
 const projections={};
 for(const [name,root]of Object.entries({U1:29289,Pi1:50558,average:29336,
  averageEta:29436,M1:29334,v1:29440}))
  projections[name]=restrictActualPositiveOrderCollar(context,root);
 assert.equal(projections.U1.reduced,28835);
 assert.equal(projections.Pi1.reduced,50557);
 assert.equal(projections.average.reduced,29332);
 assert.equal(projections.averageEta.reduced,29343);
 assert.equal(projections.M1.reduced,29333);
 const t=G.fresh('picard_average_literal_check'),tX=G.mul(t,4756);
 const reconstructed=G.integral(G.picardEven(0,1,tX,2,0,0),t,G.zero,G.one);
 const reconstructedEta=G.integral(G.picardEven(0,1,tX,2,0,1),t,G.zero,G.one);
 const U=G.picardEven(0,1,4756,2,0,0),K=G.picardEven(0,2,4756,2,0,0);
 const Ueta=G.picardEven(0,1,4756,2,0,1),Keta=G.picardEven(0,2,4756,2,0,1);
 const average=G.add(U,K),averageEta=G.add(Ueta,Keta);
 assert.equal(G.derivative(average,2),averageEta);
 const rootX=G.sqrt(4756),evenInterpretations=[];
 assert.deepEqual(G.nodes[rootX],n('sqrt_positive',[4756]));
 for(const [component,even]of [[1,U],[2,K],[3,50557]]){
  const value=G.materializePicardEvenDerivative(0,component,4756,2,0,0);
  assert.deepEqual(G.nodes[value],n('actual_background_picard',[0,component,rootX,2,0]));
  evenInterpretations.push({component,evenNode:even,evenSourceNode:copy(G.nodes[even]),
   picardValueNode:value,picardSourceNode:copy(G.nodes[value])});
 }
 const stateRoots=Array.from({length:6},(_,j)=>G.picardRoot(0,j,25516,2,0));
 stateRoots.forEach((id,j)=>assert.deepEqual(G.nodes[id],n('actual_background_picard',[0,j,25516,2,0])));
 assert.deepEqual(stateRoots,p.inner.values);
 const generic=s.primitive.originalEvenAveragePrimitiveIdentity();
 assert(generic.pass&&generic.check.pass&&!generic.wrongSign.pass);
 assert.equal(generic.sourceAuthenticated,false);
 const sourceV=vFormula(G,29289,29336,29436);
 const localV=vFormula(G,U,29332,29343);
 const innerV=vFormula(G,U,average,averageEta);
 const conditionalV=conditionalAverageSubstitution(s,projections.v1.reduced,average,averageEta);
 const exactBodyChecks={
  literalAverage:equal(s,29332,reconstructed),
  literalAverageEta:equal(s,29343,reconstructedEta),
  massBeforeXkeep:equal(s,29333,G.mul(4756,29332)),
  originalVFormula:equal(s,29440,sourceV),
  localVFormula:equal(s,projections.v1.reduced,localV),
  U1Inner:equal(s,projections.U1.reduced,U),
  Pi1Inner:equal(s,projections.Pi1.reduced,50557),
  conditionalVTransfer:equal(s,conditionalV,innerV)
 };
 contextOf(context);
 for(const row of s.sourceFiles)assert.equal(sha(await readFile(resolve(s.root,row.path))),row.sha256,row.path);
 assert.equal(sha(await readFile(s.diagnosticsPath)),DIAGNOSTICS,'Historical diagnostics changed.');
 return {schema:'MathScope.N6.ActualPicardAverageCollar/1',sourceHeaderSHA256:HEADER,
  fixedDefinitionSHA256:FIXED,sourcePaperSHA256:PAPER,diagnosticsSHA256:DIAGNOSTICS,
  actualPicardSHA256:PICARD,sourceFiles:copy(s.sourceFiles),
  originalConstructionOptions:{terms:0,bits:128,heatIterations:0},
  originalPrefixNodeCount:s.prefixCount,originalPrefixSHA256:s.prefixSHA256,
  originalSourcePrefixUnchanged:true,originalFunctionDefinitionsUnchanged:true,sourceBytesUnchanged:true,
  exactOriginalRoots:copy(ROOTS),
  actualAverageBinding:{sourceAverage:29336,beforeXkeep:29332,
   literalIntegral:copy(G.nodes[29332]),integrandNode:29331,
   binder:29329,radialProduct:29330,massBefore:29333,
   etaDerivative:{wholeAverage:29436,literalIntegral:29343,integrandNode:29342,
    fixedBoundsIndependentOfEta:true,actualSourceDerivativeBindings:[
     {source:29336,coordinate:2,derivative:29436},
     {source:29332,coordinate:2,derivative:29343}]},
   sourceNodes:Object.fromEntries(Object.keys(PICARD_AVERAGE_EXPECTED_NODES).map(id=>[id,copy(G.nodes[id])]))},
  actualPicardRows:{...rows,stateRoots,stateNodes:stateRoots.map(id=>copy(G.nodes[id]))},
  evenProfileInterpretation:{sourceImplementation:BASE+'actual-continuation-exact-functions.mjs:materializePicardEvenDerivative',
   radialOrder:0,etaOrder:0,identity:'even_component(X,eta)=W_component(sqrt(X),eta)',
   sourceX:4756,radialNode:rootX,radialSourceNode:copy(G.nodes[rootX]),
   sourceBindings:evenInterpretations,
   genuineInfinitePicardOperations:true,displayedFiniteTermsUsed:false},
  coordinateDerivativeInterpretation:{coordinateMap:'X=xi^2',
   positiveInterval:'0<X<aSquared and 0<xi<sqrt(aSquared)',
   exactJacobian:'dX/dxi=2*xi>0',
   U:{evenNode:U,sourceW5:stateRoots[5],formula:'partial_X U_even=W5/(2*xi)',
    sourceEquation:'partial_xi U=W5 from the bound actual U row'},
   Pi:{evenNode:50557,sourceW3:stateRoots[3],formula:'partial_X Pi_even=rhs3/(2*xi)',
    diagonal:rows.diagonal[3],actualA0Row:copy(G.picardSystems[0].A0[3]),
    actualA1Row:copy(G.picardSystems[0].A1[3]),
    actualForcing:G.picardSystems[0].forcing[3]},
   conditionedOnSameGenuinePicardODEAndSmoothness:true},
  genericAverageIdentity:generic,collarOrdering:copy(s.ordering),
  positiveOrderOrdering:positiveOrdering,positiveOrderRestrictions:projections,exactBodyChecks,
  conditionalAverageIdentities:{
   value:{left:29332,right:average,rightSourceNode:copy(G.nodes[average]),
    terms:[U,K],termSourceNodes:[copy(G.nodes[U]),copy(G.nodes[K])],
    identity:'integral_0^1 U_even(tX,eta)dt=U_even(X,eta)+K_even(X,eta)'},
   eta:{left:29343,right:averageEta,rightSourceNode:copy(G.nodes[averageEta]),
    terms:[Ueta,Keta],termSourceNodes:[copy(G.nodes[Ueta]),copy(G.nodes[Keta])],
    identity:'integral_0^1 partial_eta U_even(tX,eta)dt=partial_eta(U_even+K_even)(X,eta)'},
   v1:{original:29440,restricted:projections.v1.reduced,inner:innerV,
    conditionalReduced:conditionalV,
    formula:'[2*eta*U-2*eta*(D+nu)*(U+K)-d*partial_eta(U+K)]/L',
    nu:25,nuIdentity:'nu=2*h; distinct from outer lambda node8',
    substitutedAverageAtoms:[29332,29343],conditionalSourceSubstitutionOnly:true}},
  requiredPicardRegularity:{schema:'MathScope.N6.ActualPicardRegularityComposition/1',
   actualPicardSHA256:PICARD,actualFixedSHA256:FIXED,
   requiredSubkernelConclusions:{
    actualPicardAllFixedMixedDerivativeNormalConvergence:true,
    actualZeroAxisSingularODEViaRescaledIntegral:true,
    actualNativeEvenProfilesCInfinityOnZeroToASquared:true,
    actualCoefficientCInfinityXiAndCommonEtaHolomorphy:true,
    actualSolutionParity:['even','even','even','even','odd','odd']},
   radialDomain:'FULL 0<=X<=aSquared24805; not just the open Xminus collar',
   parameterDomain:'actual common Picard eta neighborhood of [-1,1]; physical endpoint jets are inward'},
  conditionalCalculusArgument:[
   'Use the actual same-system normal-convergent Picard solution, its U/K rows, and its smooth even X extension on the FULL 0<=X<=aSquared. The displayed finite Picard terms are not used.',
   'For xi>0, U_xi=W5 and K_xi=-2*K/xi-W5 imply d_X[X*(U_even+K_even)]=U_even with X=xi^2. The independent exact generic identity checks the factor2*xi and the K sign.',
   'The actual zero-axis data and smooth bounded even profiles imply X*(U_even+K_even)->0 as X->0. FTC on [0,X] gives X*(U_even+K_even)=integral_0^X U_even(s,eta)ds; no arbitrary integration constant is discarded.',
   'For X>0, s=tX and ds=X dt give integral_0^X U_even(s,eta)ds=X*integral_0^1 U_even(tX,eta)dt. The exact literal29332 uses those bounds and tX argument. Divide by the positive collar X.',
   'All0<=t<=1 sample0<=tX<=X<aSquared. The entire sampled interval is covered by the same Picard theorem; no caller collar assumption is transported under the t binder.',
   'Joint smoothness on the full compact Picard interval and its parameter neighborhood justifies eta differentiation under the fixed t integral, giving the separately bound literal29343 identity and every existing fixed mixed jet.',
   'On the strict free-X collar the U1 and Pi1 cutoffs select the actual same-system U and Pi, and Ipos corrections are inactive. Substituting ONLY the two proved average identities in the unchanged v1 formula yields the same inner Picard v1.'],
  conditionalConclusions:{literalAverageEqualsSamePicardUPlusK:true,
   literalAverageEtaEqualsSamePicardUEtaPlusKEta:true,
   sameActualPositiveU1AndPi1OnCollar:true,
   sameActualV1OnCollarUnderAverageIdentity:true},
  actualAnalyticCompositionApplied:false,actualAverageEqualityApplied:false,
  rawAxialResidualZeroProvedHere:false,densityJoinsProvedHere:false,
  actualTotalAxialMomentZeroProvedHere:false,TzPrimitiveGluingProvedHere:false,
  wholeGOnJProved:false,newOriginalGuardsDischarged:0,
  newOriginalJetsDischarged:0,newOriginalPDETermsDischarged:0};
}

export async function runPicardAverageCollarCLI(args){
 const allowed=['kernel-root','diagnostics','out'];
 assert.deepEqual(Object.keys(args).sort(),[...allowed].sort(),'Only source paths and output are accepted; no proof switches.');
 const output=resolve(args.out);
 assert.notEqual(output,resolve(args.diagnostics),'Historical diagnostics are read-only.');
 for(const path of Object.keys(PICARD_AVERAGE_SOURCE_PINS))
  assert.notEqual(output,resolve(args['kernel-root'],path),'Original source files are read-only.');
 const context=await prepareActualPicardAverageCollar({kernelRoot:args['kernel-root'],diagnosticsPath:args.diagnostics});
 const result=await proveActualPicardAverageCollar(context);
 await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({schema:result.schema,actualLiteralAverageBound:29332,
  conditionalOnActualPicardRegularity:true,sourceBytesUnchanged:true,newOriginalDischarged:0}));
 return result;
}
async function main(){
 const args={};
 for(let j=2;j<process.argv.length;j+=2){
  assert(process.argv[j].startsWith('--')&&process.argv[j+1],'Use complete named path arguments.');
  const key=process.argv[j].slice(2);assert(!Object.hasOwn(args,key),'Duplicate argument.');
  args[key]=process.argv[j+1];
 }
 await runPicardAverageCollarCLI(args);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();

