/** Exact ORIGINAL n=1 source differential-polynomial binding; no real evaluation. */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import crypto from 'node:crypto';
const [runtime,registryPath,output,n4RegistryPath]=process.argv.slice(2);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const registryRaw=fs.readFileSync(registryPath);
if(sha(registryRaw)!=='bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e')throw Error('legacy original #672 registry pin');
const expr=JSON.parse(JSON.parse(registryRaw).base.base.expression);
if(expr[1].body!==117047||expr[672].body!==117069||expr[672].name!=='ActualAllFiniteOrderOneStress_z')throw Error('original aliases');
if(JSON.stringify(expr[1].parameters)!=='[4756,2]'||JSON.stringify(expr[672].parameters)!=='[4756,2]')throw Error('original formal parameters');
const n4Raw=fs.readFileSync(n4RegistryPath);
if(sha(n4Raw)!=='049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad')throw Error('N4 namespace control pin');
const n4expr=JSON.parse(JSON.parse(n4Raw).base.expression);
if(n4expr[1].body!==117047||n4expr[672].name!=='ActualCompactSlowCoefficient_565'||n4expr[672].body!==490174)throw Error('namespace control');
const namespaceControl={legacy672:expr[672],N4RegistrySHA256:sha(n4Raw),N4_672:n4expr[672],
  sameFunctionIdIsDifferentFunction:true,expression1DensityBodyStable:117047};
const pins={
  'mathscope-m2/navier/actual-global-source-expressions.mjs':'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
  'mathscope-m2/navier/actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'mathscope-m2/navier/actual-continuation-exact-stress.mjs':'22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2',
  'mathscope-m2/navier/actual-residual-order-induction-source.mjs':'30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047'
};
for(const [f,pin]of Object.entries(pins))if(sha(fs.readFileSync(path.join(runtime,f)))!==pin)throw Error('source arithmetic/AD pin '+f);
const {prepareActualOrderOneStressProgram}=await import(pathToFileURL(path.join(runtime,'mathscope-m2/navier/actual-continuation-exact-stress.mjs')));
const p=prepareActualOrderOneStressProgram({terms:0,bits:128,heatIterations:0}),G=p.G;
const prefixSHA=sha(JSON.stringify(G.nodes.slice(0,117100)));
if(prefixSHA!=='d125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116')throw Error('original source prefix');
const {X,eta}=p.constants;
const fields={U0:p.finalU,U1:p.orderOne.U1,v0:p.finalv,v1:p.orderOne.v1,Pi:p.orderOne.Pi1};
if(JSON.stringify(fields)!=='{"U0":9236,"U1":29289,"v0":18778,"v1":29440,"Pi":50558}')throw Error('actual field roots');
if(p.stress.axial!==117045||p.program.orderOneStress.axialSupported!==117047)throw Error('original raw/density');
const aliases=[],atomic=new Set();
function paths(k,m,prefix=''){
  if(!k&&!m)return [prefix];
  return [...(k?paths(k-1,m,prefix+'X'):[]),...(m?paths(k,m-1,prefix+'E'):[])];
}
const pairs={
  U0:[[0,0],[1,0],[0,1],[2,0],[1,1],[0,2],[2,1],[1,2],[0,3]],
  U1:[[0,0],[1,0],[0,1],[2,0],[1,1],[0,2],[2,1]],
  Pi:[[0,0],[1,0],[0,1],[1,1],[0,2]],
  v0:[[0,0],[0,1]],v1:[[0,0],[0,1]]
};
for(const [name,requests]of Object.entries(pairs))for(const [k,m]of requests)for(const derivativePath of paths(k,m)){
  let id=fields[name];for(const c of derivativePath)id=G.derivative(id,c==='X'?X:eta);
  if(id===G.zero)throw Error('unexpected zero field jet '+name+derivativePath);
  aliases.push({name,x:k,eta:m,path:derivativePath,node:id});atomic.add(id);
}
const rawEta=G.derivative(117045,eta),densityEta=G.derivative(117047,eta);
const nativeDensityEta=G.materializeExpressionFunction(1,[X,eta],[0,1]);
if(nativeDensityEta!==densityEta)throw Error('formal eta native materializer');
if(JSON.stringify(G.nodes[densityEta])!==JSON.stringify({op:'smooth_piecewise',args:[X,28814,28824,0,rawEta,0]}))throw Error('fixed support eta derivative');
const keep=new Set([X,eta,9,19,20,21,22,24,25,26,27,28,117045,117047,117069,rawEta,densityEta]);
for(const i of [117055,117056,117057,117064,117065,117066,117073,117074,117075])keep.add(i);
const work=[...keep];
const children=({op,args:a})=>{
 if(['rational','coordinate','source_parameter'].includes(op))return [];
 if(['integer_power','source_step_derivative'].includes(op))return a.slice(0,1);
 if(op==='definite_integral')return [a[0],a[2],a[3]];
 if(op==='actual_expression_partial')return a[1];
 return a;
};
while(work.length){const i=work.pop();if(atomic.has(i))continue;for(const j of children(G.nodes[i]))if(!keep.has(j)){keep.add(j);work.push(j);}}
const out={schema:'MathScope.OriginalN1AxialActualJetSlice/1',sourcePins:pins,
 originalPrefix:{count:117100,sha256:prefixSHA},registrySHA256:sha(registryRaw),
 fields,aliases,constants:{X,eta,h:9,A:G.core.A,D:G.core.D,d:G.core.d,L:G.core.L},
 raw:117045,density:117047,rawEta,densityEta,nativeDensityEta,
 sourceAxialTerms:p.program.orderOneStress.axialTerms,
 nativeDefinitions:{density:expr[1],stress:expr[672]},registryNamespaceControl:namespaceControl,
 sourceNodes:[...keep].sort((a,b)=>a-b).map(i=>[i,G.nodes[i]]),
 finiteDerivativeGraphNodeCount:G.nodes.length,
 sourceNativeDerivativeSemantics:'Aliased actual jets are the original AD outputs. Ordinary primitive-limit differentiation and mixed partial commutation remain explicit analytic premises.',
 allN:false,order:1,release:'HOLD'};
fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({status:'PASS_ORIGINAL_N1_ACTUAL_JET_SOURCE_EXPORT',prefixSHA,sliceNodes:keep.size,aliases:aliases.length,rawEta,densityEta,graphNodes:G.nodes.length}));
