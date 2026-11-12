import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [mode,runtime,original,receiptFile,baselineFile]=process.argv.slice(2);
assert(['original','overlay'].includes(mode)&&runtime&&original&&receiptFile&&baselineFile);
const sha=x=>createHash('sha256').update(x).digest('hex');
const manifest=JSON.parse(await readFile(resolve(original,'GIT-SOURCE-SHA256.json'))),receipt=JSON.parse(await readFile(receiptFile));
const overlays=Object.fromEntries(receipt.files.map(x=>[x.file,x.overlaySHA256]));
for(const [file,pin] of Object.entries(manifest))assert.equal(sha(await readFile(resolve(runtime,file))),mode==='overlay'?(overlays[file]??pin):pin,file);
if(mode==='overlay')assert.equal(sha(await readFile(resolve(runtime,'research-ide/mathscope-m2/navier/mathscope-large-seal.mjs'))),receipt.helperSHA256);
const baseline=JSON.parse(await readFile(baselineFile)),navier=resolve(runtime,'research-ide/mathscope-m2/navier'),imp=n=>import(pathToFileURL(resolve(navier,n)).href);
const {prepareActualCompletedBackgroundC2}=await imp('actual-residual-order-induction-background.mjs');
const {attachActualCompactAllBandBackgroundNorms,assertActualCompactAllBandBackgroundNorms,actualCompactAllBandBackgroundNormCertificate}=await imp('actual-compact-all-band-background-norms.mjs');
const background=prepareActualCompletedBackgroundC2({order:3,maxNodes:4000000,maxDerivativeOrder:128});
const result=attachActualCompactAllBandBackgroundNorms(background,{derivativeOrder:2,maxJetRequests:100000}),G=result.G;
assertActualCompactAllBandBackgroundNorms(result);
const hash=x=>sha(Buffer.from(JSON.stringify(x)));
// Program property ordering differs under frozen sharing; compare canonical
// graph, rows, roots, certificate digest/byte count, not raw JSON key order.
const {canonicalStringify}=await import(pathToFileURL(resolve(runtime,'research-ide/mathscope-m0/contracts.mjs')).href);
const graphSHA256=hash(G.nodes), rowsSHA256=hash(result.rows),rootsSHA256=hash(result.roots);
assert.equal(graphSHA256,baseline.graphSHA256);assert.equal(rowsSHA256,baseline.rowsSHA256);assert.equal(rootsSHA256,baseline.rootsSHA256);
const certificate=await actualCompactAllBandBackgroundNormCertificate(result);
assert.equal(certificate.graph.sha256,sha(Buffer.from(canonicalStringify(result.program))));
assert.equal(certificate.graph.compilerBytes,Buffer.byteLength(canonicalStringify(result.program)));
const first=G.nodes[0];
if(mode==='overlay')assert.throws(()=>{first.args[0]='9999'});
else {first.args[0]='9999';assert.throws(()=>assertActualCompactAllBandBackgroundNorms(result));first.args[0]='0';}
// Preserve literal key order because the older C2 source seal uses JSON.stringify.
const equivalent=JSON.parse(JSON.stringify(first));G.nodes[0]=equivalent;assertActualCompactAllBandBackgroundNorms(result);
equivalent.args[0]='9999';assert.throws(()=>assertActualCompactAllBandBackgroundNorms(result));G.nodes[0]=first;
const oldProgram=result.program.nodes;
result.program.nodes=oldProgram.slice();result.program.nodes[0]={op:'rational',args:['9999','1']};
assert.throws(()=>assertActualCompactAllBandBackgroundNorms(result));result.program.nodes=oldProgram;
const old=result.rows[0].Cslow;result.rows[0].Cslow=old+1;assert.throws(()=>assertActualCompactAllBandBackgroundNorms(result));result.rows[0].Cslow=old;
assertActualCompactAllBandBackgroundNorms(result);
console.log(JSON.stringify({status:'PASS_NATIVE_C2_SEAL',mode,nodes:G.nodes.length,graphSHA256,rowsSHA256,rootsSHA256,
  certificate:certificate.graph,sourceFrozen:mode==='overlay',equalReplacementAccepted:true,mutatedReplacementRejected:true,
  programMutationRejected:true,normMutationRejected:true,checks:result.checks.length,release:'HOLD'}));
