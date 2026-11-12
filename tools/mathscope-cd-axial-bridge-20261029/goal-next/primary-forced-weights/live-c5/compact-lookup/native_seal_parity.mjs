/** Original private C2 issuer with an unchanged or compact intern table. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {compactFromLegacy,compactDerivativesFromLegacy} from './compact_lookup.mjs';
import {pinRuntime} from './pin_runtime.mjs';
const [mode,runtime]=process.argv.slice(2);
assert(['baseline','compact'].includes(mode)&&runtime&&global.gc);
await pinRuntime(runtime);
const navier=resolve(runtime,'research-ide/mathscope-m2/navier'),imp=n=>import(pathToFileURL(resolve(navier,n)).href);
const {prepareActualCompletedBackgroundC2}=await imp('actual-residual-order-induction-background.mjs');
const {attachActualCompactAllBandBackgroundNorms,assertActualCompactAllBandBackgroundNorms}=await imp('actual-compact-all-band-background-norms.mjs');
const start=Date.now(),progress=e=>process.stderr.write(JSON.stringify({mode,elapsedMs:Date.now()-start,...e})+'\n');
const background=prepareActualCompletedBackgroundC2({order:3,maxNodes:4000000,maxDerivativeOrder:128},{onProgress:progress});
const G=background.G;
if(mode==='compact'){G.lookup=compactFromLegacy(G.lookup);G.derivatives=compactDerivativesFromLegacy(G.derivatives)}
progress({stage:'background-ready-before-native-norm',nodeCount:G.nodes.length});
const result=attachActualCompactAllBandBackgroundNorms(background,{derivativeOrder:2,maxJetRequests:100000},{onProgress:progress});
assertActualCompactAllBandBackgroundNorms(result);
// The real issuer must still reject a changed graph and changed norm row.
const firstArg=G.nodes[0].args[0];
G.nodes[0].args[0]='987654321';
assert.throws(()=>assertActualCompactAllBandBackgroundNorms(result),/INVALID_SOURCE_CONSTRUCTION|unchanged internally constructed/);
G.nodes[0].args[0]=firstArg;
const originalNorm=result.rows[0].Cslow;result.rows[0].Cslow=originalNorm+1;
assert.throws(()=>assertActualCompactAllBandBackgroundNorms(result),/INVALID_SOURCE_CONSTRUCTION|unchanged internally constructed/);
result.rows[0].Cslow=originalNorm;
assertActualCompactAllBandBackgroundNorms(result);
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const digest={mode,status:'PASS_UNCHANGED_NATIVE_C2_ISSUER_AND_WEAKMAP_SEAL',nodes:G.nodes.length,
  graphSHA256:sha(G.nodes),programSHA256:sha(result.program),rowsSHA256:sha(result.rows),rootsSHA256:sha(result.roots),
  checks:result.checks,sourceGraphMutationRejected:true,normRowMutationRejected:true,release:'HOLD'};
global.gc();digest.retainedHeap=process.memoryUsage().heapUsed;digest.elapsedMs=Date.now()-start;
console.log(JSON.stringify(digest));
