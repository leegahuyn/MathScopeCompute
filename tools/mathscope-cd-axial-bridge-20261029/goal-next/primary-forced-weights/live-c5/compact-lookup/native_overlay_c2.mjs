/** Validate the scratch overlay against the unchanged native C2 issuer. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {compactFromLegacy,compactDerivativesFromLegacy} from './compact_lookup.mjs';
import {pinRuntime} from './pin_runtime.mjs';
const [mode,original,overlay,baselineFile]=process.argv.slice(2);
assert(['no-callback','compact-callback'].includes(mode)&&original&&overlay&&baselineFile&&global.gc);
await pinRuntime(original);
const sha=raw=>createHash('sha256').update(raw).digest('hex');
const manifest=JSON.parse(await readFile(resolve(original,'GIT-SOURCE-SHA256.json')));
const changed='research-ide/mathscope-m2/navier/actual-compact-all-band-background-norms.mjs';
for(const [path,pin] of Object.entries(manifest)){
  const raw=await readFile(resolve(overlay,path));
  assert.equal(sha(raw),path===changed?'7c8137302c6d2716a41fdf7c7eaeb29acfe527a005bd1c1dfb2eb5b7cfb5fefe':pin,path);
}
const baseline=JSON.parse(await readFile(baselineFile)),navier=resolve(overlay,'research-ide/mathscope-m2/navier');
const imp=n=>import(pathToFileURL(resolve(navier,n)).href);
const {prepareActualCompletedBackgroundC2}=await imp('actual-residual-order-induction-background.mjs');
const {attachActualCompactAllBandBackgroundNorms,assertActualCompactAllBandBackgroundNorms}=await imp('actual-compact-all-band-background-norms.mjs');
const background=prepareActualCompletedBackgroundC2({order:3,maxNodes:4000000,maxDerivativeOrder:128});
let called=0,callbackNodes=0;const events=[];
const context={onProgress:e=>events.push(e)};
if(mode==='compact-callback')context.compactNormCaches=G=>{
  called++;callbackNodes=G.nodes.length;
  const lsize=G.lookup.size,dsize=G.derivatives.size;
  G.lookup=compactFromLegacy(G.lookup);G.derivatives=compactDerivativesFromLegacy(G.derivatives);
  assert.equal(G.lookup.size,lsize);assert.equal(G.derivatives.size,dsize);
};
const result=attachActualCompactAllBandBackgroundNorms(background,{derivativeOrder:2,maxJetRequests:100000},context),G=result.G;
assertActualCompactAllBandBackgroundNorms(result);
const hash=x=>sha(Buffer.from(JSON.stringify(x)));
const results={nodes:G.nodes.length,graphSHA256:hash(G.nodes),programSHA256:hash(result.program),rowsSHA256:hash(result.rows),rootsSHA256:hash(result.roots)};
for(const [k,v] of Object.entries(results))assert.equal(v,baseline[k],k);
assert.equal(called,mode==='compact-callback'?1:0);
const stages=events.map(x=>x.stage);
for(const stage of ['all-band-full-leading-FTC','all-band-norm-cache-checkpoint','all-band-coefficient-field-start',
  'all-band-coefficient-field-expanded','all-band-coefficient-ftc-progress','all-band-coefficient-field-done',
  'all-band-background-before-pack','all-band-background-before-seal','all-band-background-norms-sealed'])assert(stages.includes(stage),stage);
assert.equal(events.filter(x=>x.stage==='all-band-coefficient-field-start').length,4);
assert.equal(events.filter(x=>x.stage==='all-band-coefficient-field-done').length,4);
const old=G.nodes[0].args[0];G.nodes[0].args[0]='987654321';
assert.throws(()=>assertActualCompactAllBandBackgroundNorms(result));G.nodes[0].args[0]=old;
const oldNorm=result.rows[0].Cslow;result.rows[0].Cslow=oldNorm+1;
assert.throws(()=>assertActualCompactAllBandBackgroundNorms(result));result.rows[0].Cslow=oldNorm;
assertActualCompactAllBandBackgroundNorms(result);
console.log(JSON.stringify({status:'PASS_REVERSIBLE_OVERLAY_NATIVE_C2_SEAL_PARITY',mode,...results,
  callbackCalls:called,callbackNodes,progress:events,sourceAndNormMutationsRejected:true,
  scope:'Instrumented scratch C2 overlay; not a complete C8 run.',release:'HOLD'}));
