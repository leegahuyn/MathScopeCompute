/** Original system0 eta RHS and finite diagonal-Volterra correspondence. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const [runtime,registryPath,output]=process.argv.slice(2);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const pins={
 'actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
 'actual-global-source-expressions.mjs':'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
 'actual-continuation-exact-stress.mjs':'22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2',
 'actual-continuation-exact-inner.mjs':'3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8',
 'actual-background-majorant.mjs':'e741d1cd144481c205874d05842b7961807c923f92155a662347dbcd48785b52',
 'actual-residual-order-induction-expressions.mjs':'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501'
};
const nav=path.join(runtime,'mathscope-m2/navier');
for(const [name,pin]of Object.entries(pins))if(sha(fs.readFileSync(path.join(nav,name)))!==pin)throw Error('source pin '+name);
const registry=fs.readFileSync(registryPath);
if(sha(registry)!=='049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad')throw Error('N4 registry');
const {prepareActualOrderOneStressProgram}=await import(pathToFileURL(path.join(nav,'actual-continuation-exact-stress.mjs')));
const {ActualInductionExpressions}=await import(pathToFileURL(path.join(nav,'actual-residual-order-induction-expressions.mjs')));
const {evaluateSourceProgramDiagnostic}=await import(pathToFileURL(path.join(nav,'actual-global-source-expressions.mjs')));
const p=prepareActualOrderOneStressProgram({terms:0,bits:128,heatIterations:0});
const prefix=sha(JSON.stringify(p.G.nodes.slice(0,117100)));
if(prefix!=='d125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116')throw Error('source prefix');
const G=new ActualInductionExpressions(p.G,{maxNodes:8000000,maxDerivativeOrder:32});
const sys=G.picardSystems[0],stored=JSON.parse(JSON.parse(registry).base.picard)[0];
for(const key of ['name','order','xi','eta','diagonal','A0','A1','forcing','sourceLeading','radialDomain'])
 if(JSON.stringify(sys[key])!==JSON.stringify(stored[key]))throw Error('actual system0 registry field '+key);
const fieldAliases=[],fieldAtomic=new Set(),fieldRoots={F:p.inner.F0,U:p.inner.U0,v:p.inner.v0};
const fieldPairs={F:[[0,0],[1,0],[0,1],[2,0],[1,1],[0,2]],
 U:[[0,0],[1,0],[0,1],[2,0],[1,1],[0,2]],v:[[0,0],[1,0],[2,0],[0,1]]};
const paths=(x,e,p='')=>!x&&!e?[p]:[...(x?paths(x-1,e,p+'X'):[]),...(e?paths(x,e-1,p+'E'):[])];
for(const [name,pairs]of Object.entries(fieldPairs))for(const [x,e]of pairs)for(const path of paths(x,e)){
 let id=fieldRoots[name];for(const c of path)id=G.derivative(id,c==='X'?p.constants.X:sys.eta);
 id=G.substitute(id,p.constants.X,G.pow(sys.xi,2));
 fieldAliases.push({name,x,eta:e,path,node:id});fieldAtomic.add(id);
}
for(const [name,key]of [['F','F0'],['U','U0'],['v','v0']])
 if(fieldAliases.find(v=>v.name===name&&v.x===0&&v.eta===0).node!==sys.sourceLeading[key])throw Error('actual leading field binding');
const boundKeep=new Set([...sys.A0.flat(),...sys.A1.flat(),...sys.forcing]),boundStack=[...boundKeep];
while(boundStack.length){const id=boundStack.pop();if(fieldAtomic.has(id))continue;const n=G.nodes[id];
 if(!['rational','source_parameter','coordinate','add','multiply','inverse','integer_power'].includes(n.op))throw Error('uncompressed source majorant operation '+id+' '+n.op);
 const children=['rational','source_parameter','coordinate'].includes(n.op)?[]:n.op==='inverse'||n.op==='integer_power'?n.args.slice(0,1):n.args;
 for(const j of children)if(!boundKeep.has(j)){boundKeep.add(j);boundStack.push(j);}
}
const Cformula=G.div(G.mul(G.q(262144),G.pow(p.inner.B,2)),G.pow(p.inner.delta,2));
if(Cformula!==sys.tail.sourceBound)throw Error('original C1 majorant formula');
const aliases=[],derivatives=new Map(),atomic=new Set();
function family(kind,row,col,root){
 let id=root;
 for(let m=0;m<=2;m++){
  aliases.push({kind,row,col,etaOrder:m,node:id});
  if(G.nodes[id].op!=='rational')atomic.add(id);
  if(m<2){const next=G.derivative(id,sys.eta);if(derivatives.has(id)&&derivatives.get(id)!==next)throw Error('nonfunctional derivative');derivatives.set(id,next);id=next;}
 }
}
for(let i=0;i<6;i++){
 for(let j=0;j<6;j++){family('A0',i,j,sys.A0[i][j]);family('A1',i,j,sys.A1[i][j]);}
 family('f',i,null,sys.forcing[i]);
}
const native=[],rhs=[];
for(let i=0;i<6;i++)for(let m=0;m<=3;m++){
 const id=G.picardRoot(0,i,sys.xi,sys.eta,m);atomic.add(id);native.push({component:i,etaOrder:m,node:id});
 if(m<3)derivatives.set(id,G.picardRoot(0,i,sys.xi,sys.eta,m+1));
 if(m<=2)rhs.push({component:i,etaOrder:m,node:G.picardRhs(0,i,sys.xi,sys.eta,m)});
}
// Source finite diagonal Gf, and eta differentiation of its literal fixed
// interval. Retain each original binder when constructing the comparison.
const partial=G.picardPartialSum(0,1),firstTerm=[];
for(let i=0;i<6;i++){
 const term=partial.sum[i];
 if(term===G.zero){firstTerm.push({component:i,zero:true});continue;}
 const root=G.nodes[term];if(root.op!=='multiply'||!root.args.includes(sys.xi))throw Error('Gf outer xi');
 const integral=root.args.find(x=>x!==sys.xi),int=G.nodes[integral];
 if(int.op!=='definite_integral'||int.args[2]!==G.zero||int.args[3]!==G.one)throw Error('Gf exact fixed bounds');
 const binder=int.args[1],scaled=G.mul(binder,sys.xi),rows=[];
 let differentiated=term;
 for(let m=0;m<=2;m++){
  const f=aliases.find(a=>a.kind==='f'&&a.row===i&&a.etaOrder===m).node;
  const integrand=G.mul(G.pow(binder,sys.diagonal[i]),G.substitute(f,sys.xi,scaled));
  const expected=G.mul(sys.xi,G.integral(integrand,binder,G.zero,G.one));
  rows.push({etaOrder:m,actual:differentiated,expected,identicalNode:differentiated===expected});
  if(differentiated!==expected)throw Error('finite G eta interchange source nodes '+i+','+m);
  if(m<2)differentiated=G.derivative(differentiated,sys.eta);
 }
 firstTerm.push({component:i,zero:false,term,integral,binder,rows});
}
let evaluatorControl;
try{
 evaluateSourceProgramDiagnostic(G.pack({native:native[0].node}),native[0].node,
 {coordinates:{[G.nodes[sys.xi].args[0]]:1,eta:0},maxOperations:100});
 throw Error('diagnostic unexpectedly evaluated native Picard');
}catch(error){
 if(error.code!=='UNSUPPORTED')throw error;
 evaluatorControl={code:error.code,message:error.message,
  meaning:'Finite diagnostic interpreter does not assign an infinite Picard value; a native denotation theorem must identify the mathematical series.'};
}
const keep=new Set([...rhs.map(v=>v.node),...atomic,...aliases.map(v=>v.node)]),stack=[...keep];
while(stack.length){const id=stack.pop();if(atomic.has(id))continue;const n=G.nodes[id];
 if(!['rational','add','multiply','inverse','integer_power'].includes(n.op))throw Error('uncompressed RHS operation '+n.op);
 const children=n.op==='rational'?[]:n.op==='integer_power'||n.op==='inverse'?n.args.slice(0,1):n.args;
 for(const j of children)if(!keep.has(j)){keep.add(j);stack.push(j);}
}
const out={schema:'MathScope.OriginalN1NativeRhsEtaKernel/1',sourcePins:pins,
 registrySHA256:sha(registry),originalPrefix:{nodes:117100,sha256:prefix},
 system:0,systemName:sys.name,sourceSystem:sys,coefficientAliases:aliases,
 sourceScalarNodes:{h:G.parameter('h'),A:G.core.A,D:G.core.D,d:G.core.d,L:G.core.L,eta:sys.eta,xi:sys.xi},
 leadingFieldAliases:fieldAliases,leadingCoefficientNodes:[...boundKeep].sort((a,b)=>a-b).map(i=>[i,G.nodes[i]]),
 sourceMajorantFormula:{B:p.inner.B,delta:p.inner.delta,C1:Cformula,formula:'262144*B^2/delta^2'},
 actualNativeJets:native,derivativeMap:[...derivatives],rhs,firstFiniteGf:firstTerm,
 evaluatorControl,nodes:[...keep].sort((a,b)=>a-b).map(i=>[i,G.nodes[i]]),
 graphNodes:G.nodes.length,finiteDisplayIsExactLimit:false,
 sourceNamespace:'Source prefix before117100 authenticated; later nodes belong only to this disposable derivative replay.',
 release:'HOLD'};
fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({status:'PASS_ACTUAL_N1_RHS_ETA_KERNEL_EXPORT',rhsRows:rhs.length,
 firstFiniteGfRows:firstTerm.flatMap(v=>v.rows??[]).length,aliases:aliases.length,graphNodes:G.nodes.length,sliceNodes:keep.size,evaluatorNativeUnsupported:true}));
