import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {compactFromLegacy,compactDerivativesFromLegacy} from './compact_lookup.mjs';
import {pinRuntime} from './pin_runtime.mjs';

const [mode,runtime,orderRaw]=process.argv.slice(2),order=Number(orderRaw);
assert(['baseline','compact'].includes(mode)&&runtime&&Number.isInteger(order)&&order>=0&&order<=8&&global.gc);
await pinRuntime(runtime);
const navier=resolve(runtime,'research-ide/mathscope-m2/navier'), imp=n=>import(pathToFileURL(resolve(navier,n)).href);
const {ActualConvergentExpressions}=await imp('actual-continuation-exact-functions.mjs');
const {ActualInductionExpressions}=await imp('actual-residual-order-induction-expressions.mjs');
const {exactSlowProfileExpansion}=await imp('actual-all-band-background-norm-kernel.mjs');
const G=new ActualInductionExpressions(new ActualConvergentExpressions(),{maxNodes:8000000,maxDerivativeOrder:128});
if(mode==='compact'){G.lookup=compactFromLegacy(G.lookup);G.derivatives=compactDerivativesFromLegacy(G.derivatives)}
const q=(n,d=1)=>G.q(n,d),s=G.fresh('lookup_chart_s'),X=G.fresh('lookup_chart_X'),eta=G.fresh('lookup_chart_eta'),h=G.parameter('h');
const A=G.add(q(1,2),h),multiplier=G.exp(G.mul(G.neg(G.add(A,q(1,2))),G.log(s)));
const started=Date.now(),expansion=exactSlowProfileExpansion(G,{s,X,eta,h,multiplier,order,maxJetRequests:200000});
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const graphSHA256=sha(G.nodes),expansionSHA256=sha(expansion),definitionsSHA256=sha(G.captureFunctionDefinitions());
global.gc();const memory=process.memoryUsage();
console.log(JSON.stringify({mode,order,rows:expansion.rows.length,work:expansion.work,nodes:G.nodes.length,
  lookupEntries:G.lookup.size,derivativeCacheEntries:G.derivatives.size,substitutionCacheEntries:G.substitutions.size,
  graphSHA256,expansionSHA256,definitionsSHA256,retainedHeap:memory.heapUsed,rss:memory.rss,elapsedMs:Date.now()-started}));
