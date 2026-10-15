/** The unchanged n1 natural auxiliary norm; no n2 analytic premise. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const opt={};for(let i=2;i<process.argv.length;i+=2){assert(process.argv[i].startsWith('--')&&process.argv[i+1]);opt[process.argv[i].slice(2)]=process.argv[i+1];}
const root=resolve(opt['kernel-root']),out=resolve(opt.out),path='research-ide/mathscope-m2/navier/actual-residual-order-induction-source.mjs',before=await readFile(resolve(root,path)),hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(resolve(root,'SOURCE_EXPORT.json'),'utf8'));assert.equal(hash(before),manifest.files.find(r=>r.path===path).sha256);
const {prepareActualOrderInduction}=await import(pathToFileURL(resolve(root,path)));
const p=prepareActualOrderInduction({order:1,maxNodes:2000000,maxDerivativeOrder:128}),G=p.G,rec=p.records[1],aux=G.picardSystems[rec.auxiliary.system];
const compact=JSON.parse(await readFile(resolve(opt.compact),'utf8')),diagraw=await readFile(resolve(opt.diagnostics));assert.equal(hash(diagraw),'b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1');
const diag=JSON.parse(diagraw);assert.deepEqual(G.picardSystems[rec.raw.system],compact.definitions['picard:0'].fullDefinition);assert.deepEqual(G.source,diag.fullNativePayloads.fixed.source);assert.deepEqual(G.core,diag.fullNativePayloads.fixed.core);
assert.equal(aux.name,'ActualSameN3auxiliaryOrder1');assert.equal(aux.kind,'auxiliary');assert.equal(aux.order,1);assert.deepEqual(aux.diagonal,[0,0,2,0,3,1]);assert.deepEqual(aux.zeroAxisDatum,[0,0,0,0,0,0]);
assert(aux.actualNaturalAuxiliaryEquations&&!aux.actualFinalizedLowerCutoffs&&aux.lowerOrders.length===1);
assert(rec.norm.auxiliary.lowerMixedRadialBounds.length===1&&rec.norm.auxiliary.lowerRegularVBounds.length===1);
const n=rec.norm.auxiliary,roots={C:n.C,solutionNorm:n.solutionNorm,strip:n.strip,sourceStrip:n.sourceStrip,loss:n.loss,previousStrip:n.previousStrip,radialDomain:n.radialDomain,radius:n.radius,Kcondition:n.Kcondition,
 naturalBase:n.leadingBase.naturalBase,gBound:n.leadingBase.gBound,H:n.lowerMixedRadialBounds[0],V:n.lowerRegularVBounds[0],e1:n.e1,e2:n.e2,E:n.exponentBound,omega:n.omega,pKnown:n.pKnown,Htheta:n.Htheta,Hz:n.Hz,matrixBound:n.matrixBound,...Object.fromEntries(n.forcingBounds.map((v,j)=>['forcingBound'+j,v]))};
const nodes={},todo=Object.values(roots),unary=new Set(['inverse','integer_power','sqrt_positive','exp','log_positive','ceiling']);
while(todo.length){const i=todo.pop();if(nodes[i])continue;const a=G.nodes[i];nodes[i]=a;assert(Object.keys(nodes).length<2000);if(['rational','source_parameter'].includes(a.op))continue;if(unary.has(a.op))todo.push(a.args[0]);else if(['add','multiply','maximum'].includes(a.op))todo.push(...a.args);else assert.fail('Nonconstant n1 auxiliary majorant operator '+a.op);}
const sourceSystem={name:aux.name,order:aux.order,kind:aux.kind,xi:aux.xi,eta:aux.eta,diagonal:aux.diagonal,A0:aux.A0,A1:aux.A1,forcing:aux.forcing,zeroAxisDatum:aux.zeroAxisDatum,radialDomain:aux.radialDomain,lowerOrders:aux.lowerOrders,tail:aux.tail,solutionNorm:aux.solutionNorm,actualNaturalAuxiliaryEquations:aux.actualNaturalAuxiliaryEquations,actualFinalizedLowerCutoffs:aux.actualFinalizedLowerCutoffs};
const parityCache=new Map();
function parity(id){
 if(parityCache.has(id))return parityCache.get(id);const {op,args}=G.nodes[id];let v;
 if(op==='rational'||op==='source_parameter')v=0;
 else if(op==='coordinate')v=id===aux.xi?1:0;
 else if(op==='add'){const aa=args.filter(x=>x!==G.zero).map(parity);assert(aa.every(x=>x===aa[0]));v=aa[0]??0;}
 else if(op==='multiply')v=args.reduce((a,x)=>a^parity(x),0);
 else if(op==='inverse')v=parity(args[0]);
 else if(op==='integer_power')v=(args[1]%2+2)%2?parity(args[0]):0;
 else if(op==='actual_natural_series'){assert.equal(parity(args[1]),0);assert.equal(parity(args[2]),0);v=0;}
 else if(op==='definite_integral'){assert.notEqual(args[1],aux.xi);assert.equal(parity(args[2]),0);assert.equal(parity(args[3]),0);v=parity(args[0]);}
 else if(['exp','log_positive','sqrt_positive','ceiling','sine','cosine','source_step_derivative'].includes(op)){assert.equal(parity(args[0]),0);v=0;}
 else if(op==='smooth_piecewise'){assert(args.every(x=>parity(x)===0));v=0;}
 else assert.fail('Unproved natural-auxiliary reflection operation '+op);
 parityCache.set(id,v);return v;
}
const profileParity=[0,0,0,0,1,1];for(const key of ['A0','A1'])for(let i=0;i<6;i++)for(let j=0;j<6;j++)if(aux[key][i][j]!==G.zero)assert.equal(parity(aux[key][i][j]),(1+profileParity[i]+profileParity[j])%2);
for(let i=0;i<6;i++)if(aux.forcing[i]!==G.zero)assert.equal(parity(aux.forcing[i]),(1+profileParity[i])%2);
assert.deepEqual(before,await readFile(resolve(root,path)));
const result={schema:'MathScope.N6.ActualN1AuxiliaryNormBinding/1',sourcePath:path,sourceSHA256:hash(before),sourceBytesUnchanged:true,sourceHeaderSHA256:compact.sourceHeaderSHA256,
 originalActualPicardDefinitionCompared:true,fixedCoreAndSourceCompared:true,n2Constructed:false,originalAuxiliarySystem:sourceSystem,originalAuxiliaryDefinitionSHA256:hash(JSON.stringify(aux)),
 actualSourceParameterExpressions:G.source.parametersExactExpressions,scalarRoots:roots,scalarNodes:nodes,
 actualAuxiliaryReflection:{sourceProfileParity:profileParity,everyNonzeroMatrixAndForcingEntryCompared:true,coefficientAncestorNodes:parityCache.size,naturalOnlyNativeBoundary:true},
 analyticMajorantProvedHere:false,originalBnormApplicationProvedHere:false,newOriginalGuardsDischarged:0,newOriginalJetsDischarged:0,newOriginalPDETermsDischarged:0};
await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({schema:result.schema,scalarNodes:Object.keys(nodes).length,n2Constructed:false,analyticApplication:false,newDischarged:0})+'\n');
