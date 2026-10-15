/** Bind the actual Picard sourceLeading roots to natural/B26 constructors. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const opt={};for(let i=2;i<process.argv.length;i+=2){assert(process.argv[i].startsWith('--')&&process.argv[i+1]);opt[process.argv[i].slice(2)]=process.argv[i+1];}
assert(opt.diagnostics,'--diagnostics is required');
const root=resolve(opt['kernel-root']??process.cwd()),out=resolve(opt.out??'work/ACTUAL_PICARD_LEADING_BINDING.json');
const diag=JSON.parse(await readFile(resolve(opt.diagnostics),'utf8')),raw=diag.fullNativePayloads['picard:0'];
assert(raw?.name==='ActualSameN3OrderOneInner');
const target=diag.argumentAndContextGraph[String(raw.tail.target)];assert(target.op==='rational'&&target.args[0]==='1');
const denominator=BigInt(target.args[1]);assert(denominator>0n&&(denominator&(denominator-1n))===0n);const bits=denominator.toString(2).length-1;
const path='research-ide/mathscope-m2/navier/actual-continuation-exact-inner.mjs',sourcePath=resolve(root,path),before=await readFile(sourcePath);
const {prepareActualFirstOrderInnerProgram}=await import(pathToFileURL(sourcePath));
const p=prepareActualFirstOrderInnerProgram({terms:0,bits,etaOrder:raw.tail.etaOrder}),G=p.G,pre=p.pre,inner=p.inner,sourceNodeCount=G.nodes.length;
const definition=G.picardSystems[inner.system];assert.deepEqual(definition,raw);
const coefficientPrefixEnd=1+Math.max(raw.xi,raw.eta,...raw.A0.flat(),...raw.A1.flat(),...raw.forcing,...raw.radialDomain,...Object.values(raw.sourceLeading),...Object.entries(raw.tail).filter(([k,v])=>k!=='etaOrder'&&Number.isSafeInteger(v)).map(([,v])=>v),...Object.values(raw.solutionNorm).filter(Number.isSafeInteger));
assert.deepEqual(G.core,diag.fullNativePayloads.fixed.core);assert.deepEqual(G.source,diag.fullNativePayloads.fixed.source);
const q=(a,b=1)=>G.q(a,b),o=G.one,z=G.zero,{X,eta}=p.constants,{A,D,d,L,Ustar}=G.core,xi=inner.xi,Lambda=G.parameter('Lambda'),Xa=G.parameter('Xa'),Y=G.mul(Lambda,X);
const naturalF=pre.functions.naturalF(Y),naturalU=pre.functions.naturalU(Y),collarU=pre.functions.B26UAt(X),collarF=G.div(pre.functions.B26EAt(X),G.sqrt(G.mul(q(2),X)));
const F0=G.choose(X,Xa,inner.aSquared,naturalF,collarF,collarF),U0=G.choose(X,Xa,inner.aSquared,naturalU,collarU,collarU);
assert.equal(inner.F0,F0);assert.equal(inner.U0,U0);
const average=G.add(Ustar,G.div(G.natural('average',Y),Lambda));
const coreV=G.div(G.sub(G.sub(G.mul(q(2),eta,naturalU),G.mul(q(2),D,eta,average)),G.mul(d,G.derivative(average,eta))),L);
const t=G.fresh('independent_picard_collar_M'),collarM=G.add(pre.functions.coreMoments(q(4))[0],G.integral(pre.functions.B26UAt(t),t,Xa,X)),collarAverage=G.div(collarM,X);
const collarV=G.div(G.sub(G.sub(G.mul(q(2),eta,collarU),G.mul(q(2),D,eta,collarAverage)),G.mul(d,G.derivative(collarAverage,eta))),L);
const v0=G.choose(X,Xa,inner.aSquared,coreV,collarV,collarV);
function canonical(id,env=new Map()){
 const{op,args}=G.nodes[id];if(op==='coordinate')return env.has(id)?['bound',env.get(id)]:['coordinate',id];
 if(['rational','source_parameter'].includes(op))return[op,args];
 if(op==='definite_integral'){const next=new Map(env);next.set(args[1],env.size);return[op,canonical(args[0],next),canonical(args[2],env),canonical(args[3],env)];}
 if(['integer_power','source_step_derivative'].includes(op))return[op,canonical(args[0],env),args[1]];
 if(op==='actual_natural_series')return[op,args[0],canonical(args[1],env),canonical(args[2],env),...args.slice(3)];
 assert(!op.startsWith('actual_'),'Unexpected native operation in Picard leading constructor: '+op);
 const children=args.map(a=>canonical(a,env));if(op==='add'||op==='multiply')children.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));return[op,...children];
}
assert.deepEqual(canonical(inner.v0),canonical(v0));
const square=G.pow(xi,2);for(const[name,value]of Object.entries({F0:inner.F0,U0:inner.U0,v0:inner.v0,omega0OverX:inner.omegaOverX}))assert.equal(definition.sourceLeading[name],G.substitute(value,X,square),name);
// terms controls nodes created AFTER registration, so compare precisely the
// immutable original coefficient prefix, not the displayed partial-sum suffix.
let overlap=0;for(const[id,node]of Object.entries(diag.argumentAndContextGraph)){const i=Number(id);if(i<coefficientPrefixEnd){assert.deepEqual(G.nodes[i],node);overlap++;}}assert(overlap>0);
const wrong=G.choose(X,Xa,inner.aSquared,naturalF,naturalF,naturalF);assert.notEqual(wrong,F0);
assert.deepEqual(before,await readFile(sourcePath));
const result={schema:'MathScope.N6.ActualPicardLeadingConstructorBinding/1',sourcePath:path,sourceSHA256:createHash('sha256').update(before).digest('hex'),sourceBytesUnchanged:true,sourceNodeCount,coefficientPrefixEnd,bits,etaOrder:raw.tail.etaOrder,displayTerms:0,
 checks:{fullOriginalPicardDefinitionEqual:true,fixedCoreAndSourceEqual:true,actualF0NaturalAndB26Branches:true,actualU0NaturalAndB26Branches:true,actualV0CoreAverageAndCollarMoment:true,sourceLeadingAllFourXiSquaredSubstitutions:true,diagnosticOverlappingNodesEqual:true,referenceSubstitutionMutationRejected:true},
 diagnosticOverlap:overlap,sourceLeading:definition.sourceLeading,constructorRoots:{F0,U0,v0:inner.v0,omega0OverX:inner.omegaOverX,X,xi,eta,Xa,aSquared:inner.aSquared},
 conservationTheorem:'ACTUAL_NATURAL_B26_JOIN_KO.md',guardDerivativeLineageGateSeparate:true,originalCountsUnchanged:true,newOriginalGuardsDischarged:0,newOriginalJetsDischarged:0,newOriginalPDETermsDischarged:0};
await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({schema:result.schema,sourceNodeCount,diagnosticOverlap:overlap,checks:result.checks,newDischarged:0})+'\n');
