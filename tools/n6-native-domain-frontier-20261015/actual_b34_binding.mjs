/** Literal original B34 shift and exact matching ideal profile. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const opt={};for(let i=2;i<process.argv.length;i+=2)opt[process.argv[i].slice(2)]=process.argv[i+1];
const root=resolve(opt['kernel-root']),path='research-ide/mathscope-m2/navier/actual-continuation-exact-pregluing.mjs';
const before=await readFile(resolve(root,path));
const {prepareActualPregluingProgram}=await import(pathToFileURL(resolve(root,path)));
const p=prepareActualPregluingProgram({etaDerivativeOrder:0}),G=p.G,sourceNodeCount=G.nodes.length;
assert(opt.diagnostics,'Authenticated original diagnostics are required');
const rawDiagnostics=await readFile(resolve(opt.diagnostics));
assert.equal(createHash('sha256').update(rawDiagnostics).digest('hex'),'b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1');
const diag=JSON.parse(rawDiagnostics),fixed=diag.fullNativePayloads.fixed;
assert.deepEqual(G.source,fixed.source);assert.deepEqual(G.core,fixed.core);
assert.deepEqual({source:G.source,core:G.core,pressure:G.pressure,outer:G.outer,naturalKernel:G.naturalKernel},fixed);
let diagnosticOverlap=0;
for(const[id,node]of Object.entries(diag.argumentAndContextGraph)){
 const i=Number(id);if(i<sourceNodeCount){assert.deepEqual(G.nodes[i],node);diagnosticOverlap++;}
}
assert(diagnosticOverlap>0);
const q=(a,b=1)=>G.q(a,b),X=G.var('X'),eta=G.core.eta;
const C=G.parameter('CSelected'),Tsh=G.parameter('Tsh'),XR=G.parameter('XR'),P=G.parameter('Pstar'),Xi=p.constants.Xi;
assert.equal(Xi,q(110));const f=G.inv(G.add(G.one,G.pow(eta,2))),Ei=p.functions.B26EAt(Xi),ell=G.log(G.mul(C,Ei));
assert.equal(p.roots.B26Ei,Ei);assert.equal(p.roots.ellI,ell);
const y=G.log(G.div(X,Xi)),sigma=G.step(G.div(y,Tsh));
const expected=G.exp(G.add(G.neg(G.log(C)),G.mul(q(1,10),y),G.mul(G.sub(G.one,sigma),ell),G.mul(sigma,G.log(f))));
assert.equal(p.roots.B34E,expected);assert.equal(p.functions.shiftEAt(X),expected);
const ideal=G.mul(P,f,G.exp(G.mul(q(1,10),G.log(G.div(X,XR)))));
assert.equal(p.functions.idealEAt(X),ideal);
assert.deepEqual(G.source.parametersExactExpressions.Tsh,{power:[{ref:'Q'},90]});
assert.deepEqual(G.source.parametersExactExpressions.XR,{product:[{integer:110},{power:[{product:[{ref:'CSelected'},{ref:'Pstar'}]},10]}]});
const wrong=G.exp(G.add(G.neg(G.log(C)),G.mul(q(1,10),y),G.mul(G.sub(G.one,sigma),ell),G.mul(sigma,G.neg(G.log(f)))));
assert.notEqual(wrong,expected);assert.deepEqual(before,await readFile(resolve(root,path)));
const result={schema:'MathScope.N6.ActualB34LiteralBinding/1',sourcePath:path,sourceSHA256:createHash('sha256').update(before).digest('hex'),
 sourceBytesUnchanged:true,sourceNodeCount,diagnosticOverlap,
 authenticatedDiagnosticsSHA256:createHash('sha256').update(rawDiagnostics).digest('hex'),
 actualRoots:{X,eta,Xi,Ei,ellI:ell,shiftE:expected,idealE:ideal,Tsh,XR},
 checks:{fixedSourceAndCoreEqual:true,authenticatedOriginalOverlappingNodesEqual:true,literalEndpointLogAmplitude:true,literalB34Shift:true,literalIdealProfile:true,literalQ90Width:true,literalXRScale:true,changedLogFSignRejected:true},
 proof:'ACTUAL_B34_RADIAL_POSITIVITY_KO.md',newOriginalObligationsDischarged:0};
await writeFile(resolve(opt.out),JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({literalB34SourceBound:true,newOriginalDischarged:0})+'\n');
