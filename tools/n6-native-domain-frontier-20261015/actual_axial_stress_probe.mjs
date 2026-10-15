/** Exact original axial-stress binding. Analytic joins stay explicit. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const opt={};for(let i=2;i<process.argv.length;i+=2){assert(process.argv[i].startsWith('--')&&process.argv[i+1]);opt[process.argv[i].slice(2)]=process.argv[i+1];}
for(const name of ['kernel-root','diagnostics','out'])assert(opt[name],`--${name} is required`);
const root=resolve(opt['kernel-root']),out=resolve(opt.out),base='research-ide/mathscope-m2/navier/';
const sha=b=>createHash('sha256').update(b).digest('hex');
const pins={
 'actual-continuation-exact-stress.mjs':'22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2',
 'actual-continuation-exact-pde-proof.mjs':'816bd419d6b09545c18d2629c405fe91391f502b467409adecf6eed07c43c547',
 'actual-continuation-exact-inner.mjs':'3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8',
 'actual-continuation-exact-order-one.mjs':'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72',
 'actual-continuation-exact-support.mjs':'0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98',
 'actual-residual-order-induction-expressions.mjs':'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501'
};
const sourceFiles=[];for(const [file,pin]of Object.entries(pins)){const raw=await readFile(resolve(root,base+file));assert.equal(sha(raw),pin,file);sourceFiles.push({path:base+file,sha256:pin,bytes:raw.length});}
const diagnosticsRaw=await readFile(resolve(opt.diagnostics));
assert.equal(sha(diagnosticsRaw),'b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1');
const diag=JSON.parse(diagnosticsRaw);
const {prepareActualOrderOneStressProgram}=await import(pathToFileURL(resolve(root,base+'actual-continuation-exact-stress.mjs')));
const {ActualInductionExpressions}=await import(pathToFileURL(resolve(root,base+'actual-residual-order-induction-expressions.mjs')));
const {actualInnerPDEIdentity}=await import(pathToFileURL(resolve(root,base+'actual-continuation-exact-pde-proof.mjs')));
const {sourceGraphRationalIdentity}=await import(pathToFileURL(resolve(root,base+'actual-continuation-exact-identities.mjs')));
const {actualSupportOrderProof,checkActualExteriorZeros}=await import(pathToFileURL(resolve(root,base+'actual-continuation-exact-support.mjs')));
// These are the ORIGINAL construction options, not a new heat iteration.
const p=prepareActualOrderOneStressProgram({terms:0,bits:128,heatIterations:0}),G=p.G,r=p.orderOne;
assert.deepEqual({source:G.source,core:G.core,pressure:G.pressure,outer:G.outer,naturalKernel:G.naturalKernel},diag.fullNativePayloads.fixed);
assert.equal(G.source.sourcePaperSHA256,'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f');
assert.deepEqual(G.picardSystems[0],diag.fullNativePayloads['picard:0']);
const originalNodeCount=G.nodes.length,definitions=G.captureFunctionDefinitions();
const q=(n,d=1)=>G.q(n,d),{X,eta}=p.constants,{A,D,d,L}=G.core,c=G.neg(A),nu=p.inner.lambda1;
assert.equal(nu,G.mul(q(2),G.parameter('h')));
const {U1,v1,Pi1,Xminus,Xplus,Xb}=r,U0=p.completedOrderOne.finalU,v0=p.completedOrderOne.finalv;
const Z=(a,f)=>G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(a,f),G.mul(X,G.derivative(f,X)))),G.mul(d,G.derivative(f,eta))),L);
const T=(a,f)=>G.div(G.add(G.neg(G.mul(a,f)),G.mul(D,eta,G.derivative(f,eta)),G.mul(X,G.derivative(f,X))),L);
const U1x=G.derivative(U1,X),U1xx=G.derivative(U1x,X),U0x=G.derivative(U0,X);
const expectedTerms=[T(G.add(c,nu),U1),G.mul(X,v0,U1x),G.mul(U0,Z(G.add(c,nu),U1)),G.mul(X,v1,U0x),G.mul(U1,Z(c,U0)),Z(G.add(G.mul(q(-2),A),nu),Pi1),G.mul(q(-2),G.add(G.mul(X,U1xx),U1x)),G.neg(Z(G.sub(c,D),Z(c,U0)))];
assert.deepEqual(expectedTerms,p.program.orderOneStress.axialTerms);
assert.equal(G.add(...expectedTerms),p.stress.axial);
const density=G.expressionSystems[1];
assert.deepEqual(density,{name:'actual_n1_Tz_forward_integrand',parameters:[X,eta],body:117047,derivativeLimits:[4,6],implementation:'actual-continuation-exact-functions.mjs:materializeExpressionFunction',unspecifiedOracle:false});
assert.deepEqual(G.nodes[density.body],{op:'smooth_piecewise',args:[X,Xminus,Xplus,G.zero,p.stress.axial,G.zero]});
assert.equal(p.stress.axial,117045);assert.equal(Xminus,28814);assert.equal(Xplus,28824);assert.equal(Xb,28826);
// The original serialized graph is the append-only induction copy. Check
// that exact ABI as well as its retained bootstrap body, without generating
// a new coefficient, stress or selector.
const induction=new ActualInductionExpressions(G,{maxNodes:1500000,maxDerivativeOrder:128});
const canonicalDefinition=induction.expressionSystems[1];
assert.deepEqual(canonicalDefinition,{...density,derivativeLimits:[128,128],implementation:'actual-residual-order-induction-expressions.mjs:materializeExpressionFunction',historicalBodyPreserved:true});
assert.equal(sha(JSON.stringify(canonicalDefinition)),'f815fd78afc4ef36627e657a34ba84624c838a44039de6435b748020b52b1689');
assert.equal(diag.allReachedRegistryInventory.find(row=>row.key==='expression:1').sha256,sha(JSON.stringify(canonicalDefinition)));
const forward=G.nodes[p.stress.zForward];assert.equal(forward.op,'multiply');
const support=actualSupportOrderProof(p.completedOrderOne);
const exterior=checkActualExteriorZeros(G,expectedTerms,support);
assert(support.pass&&exterior.pass);
const inner=actualInnerPDEIdentity(p.completedOrderOne,{order:1});assert(inner.pass&&inner.checks.axial.pass);
// Raw equation mutation controls are exact rational differences. Original
// profiles/derivatives remain symbolic atoms; no numerical zero is supplied.
const atoms=[...expectedTerms,U0,v0,U1,v1,Pi1,U0x,U1x,U1xx];
const omissionControls=expectedTerms.map((term,index)=>{
 const check=sourceGraphRationalIdentity(G,G.sub(p.stress.axial,G.add(...expectedTerms.filter((_,j)=>j!==index))),{atomicNodes:atoms});
 assert(!check.pass,`omitted axial term ${index}`);return {index,sourceTerm:term,correctlyRejected:true};
});
assert(G.functionDefinitionsUnchanged(definitions));
for(const row of sourceFiles)assert.equal(sha(await readFile(resolve(root,row.path))),row.sha256);
const selected=[density.body,p.stress.axial,p.stress.Tz,p.stress.zForward,p.stress.zBackward,p.stress.totalAxial,...expectedTerms,Xminus,Xplus,Xb];
const result={schema:'MathScope.N6.ActualAxialStressSourceBinding/1',
 sourceHeaderSHA256:'f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1',
 fixedDefinitionSHA256:'c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b',
 sourcePaperSHA256:G.source.sourcePaperSHA256,diagnosticsSHA256:sha(diagnosticsRaw),sourceFiles,
 originalConstructionOptions:{terms:0,bits:128,heatIterations:0},originalPrefixNodeCount:originalNodeCount,
 actualDensity:{registry:'expression:1',definition:canonicalDefinition,definitionSHA256:sha(JSON.stringify(canonicalDefinition)),component:'axial',guard:[X,Xminus,Xplus],angularGuardUsesDifferentRightEndpoint:Xb},
 actualAxialFormula:{root:p.stress.axial,terms:expectedTerms,termRoles:['time U1','X v0 U1_X','U0 Z_(c+lambda1) U1','X v1 U0_X','U1 Z_c U0','Z_(-2A+lambda1) Pi1','-2(X U1_XX+U1_X)','-Z_(c-D) Z_c U0'],
  allEightOriginalTermsIndependentlyReconstructed:true,lambda1:nu,lambda1Equals2h:true,leadingU0:U0,leadingv0:v0,U1,v1,Pi1},
 selectedActualSourceNodes:Object.fromEntries([...new Set(selected)].map(i=>[i,G.nodes[i]])),
 actualInnerPDE:inner,actualSupportOrder:support,actualRawAxialExterior:exterior,
 exactNegativeControls:{allEightTermOmissionsRejected:omissionControls},
 actualSourceBytesUnchanged:true,originalDefinitionsUnchanged:true,sourceAssertionsUsedAsAnalyticPremises:false,
 regularityOfActualDensityProvedHere:false,forwardBackwardPrimitiveEqualityProvedHere:false,
 remainingAnalyticPremises:[
  'Bind global U0,v0 and U1,v1,Pi1 restrictions to the exact inner PDE solution on a common open collar through Xminus; the global and inner B26 mass integrals use different binders.',
  'Compose actual completed-leading/order-one joint regularity and L nonvanishing before interpreting native1 ordinary partials at all joins.',
  'Prove the actual axial mass and pressure-flux moments vanish and justify differentiation under their integrals before equating forward/backward stress primitives.'
 ],
 wholeGOnJProved:false,newOriginalGuardsDischarged:0,newOriginalJetsDischarged:0,newOriginalPDETermsDischarged:0};
await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({schema:result.schema,densityBody:density.body,rawAxial:p.stress.axial,exactAxialTerms:8,innerAxialIdentity:inner.checks.axial.pass,allEightExteriorTermsZero:exterior.pass,analyticDensityApplication:false,newDischarged:0}));
