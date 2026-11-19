/** Reuse the original sharp-center norm primitives, without any Taylor polynomial import. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
export async function innerNormContext(goal,runtime,historicalPath){
 const {load,sourceArithmetic}=await import(pathToFileURL(resolve(goal,
  'whole-k-annular-initial/numerical/source_arithmetic.mjs')).href);
 const sharpPin='3137901e2d882df250b7df3673e276a14b6f4e9e87a006d1065f575976461481';
 const sharp=await load(resolve(goal,'final67/energy-1013-sharp/center-energy-sharp.json'),sharpPin);
 const pins=sharp.pins;
 const [native,axis,historical,thresholds,fixed,background]=await Promise.all([
  load(resolve(goal,'whole-k-inner-axis/inner-axis-native.json'),pins.native),
  load(resolve(goal,'whole-k-inner-axis/inner-axis-jet-bounds.json'),pins.axis),
  load(historicalPath,pins.historical),
  load(resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json'),pins.thresholds),
  load(resolve(goal,'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json'),pins.fixed),
  load(resolve(goal,'whole-k-annular-wrz-norm/numerical/background-c8-complete.json'),pins.background),
 ]);
 for(const [name,pin] of Object.entries(axis.originalRuntime.runtimeGitBlobs)){
  const bytes=await readFile(resolve(runtime,name));
  assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),pin,name);
 }
 const amplitude=await load(resolve(goal,'whole-k-exterior/amplitude/whole-k-exterior-amplitude.json'),pins.amplitude);
 assert.equal(amplitude.bounds.rawAmplitudeFixedDyadicLower,'2^4920000');
 const sha=x=>createHash('sha256').update(x).digest('hex');
 const modules=await Promise.all(Object.entries(sharp.sourceModuleSHA256).map(async([name,pin])=>{
  const file=resolve(runtime,'research-ide/mathscope-m2/navier',name);
  assert.equal(sha(await readFile(file)),pin,name);
  return [name,await import(pathToFileURL(file).href)];
 }));
 const M=Object.fromEntries(modules);
 const {prepareActualOrderInduction,assertActualOrderInduction}=M['actual-residual-order-induction-source.mjs'];
 const {sourceNormalizedCutoffWeights}=M['actual-residual-order-induction-kernels.mjs'];
 const {traceExactArithmeticDependencies}=M['actual-common-selection-arithmetic-trace.mjs'];
 const {actualLeadingAllOrderJets}=M['actual-leading-all-order-jets.mjs'];
 const prepared=prepareActualOrderInduction({order:3,maxNodes:2200000});
 assert.equal(assertActualOrderInduction(prepared),true);
 const {G,records}=prepared;
 assert.equal(G.nodes.length,native.originalNodeCount);assert.equal(sha(JSON.stringify(G.nodes)),native.originalNodes);
 const roots={};const hRoot=G.parameter('h');
 const f=[1,1,2,6];
 for(const row of native.rows){
  const a=records[row.n].norm.auxiliary;
  assert.equal(a.solutionNorm,row.analytic.solutionNorm);assert.equal(a.strip,row.analytic.strip);
  const weights=sourceNormalizedCutoffWeights({order:row.n,derivativeOrder:3});
  const W=weights.weights.map(w=>G.add(...w.polynomialInSourceH.map((c,k)=>G.mul(G.q(BigInt(c)),G.pow(hRoot,k)))));
  for(const item of row.cauchy)roots['H_'+item.bound]=G.mul(W[item.e],G.q(f[item.r]*f[item.t]),
   G.pow(G.div(G.q(2),a.strip),item.t),a.solutionNorm);
 }
 const trace=traceExactArithmeticDependencies(G,roots);assert.equal(trace.nonArithmeticBoundaries.length,0);
 const {N,evaluateClosedArithmeticDefinitions,tracedArithmeticEvaluator}=await sourceArithmetic(runtime,thresholds.sourcePins,'coarse-upper');
 const parameters=evaluateClosedArithmeticDefinitions(historical.definitions,N,{names:[...new Set([
  ...trace.sourceParameters,'h','Lambda','K'])]}).values;
 const arithmetic=tracedArithmeticEvaluator(trace,N,{parameters});
 const H=new Map(Object.keys(roots).map(name=>[Number(name.slice(2)),arithmetic.value(roots[name])]));
 const leading=actualLeadingAllOrderJets({radialOrder:3,etaOrder:3});assert.ok(leading.pass);
 assert.equal(leading.normProgram.roots.U0CorePhysicalTotal,sharp.leadingActualCore.U);
 assert.equal(leading.normProgram.roots.F0CorePhysicalTotal,sharp.leadingActualCore.F);
 assert.equal(sharp.leadingActualCore.ordinaryFactor,720);
 const leadingTrace=traceExactArithmeticDependencies({nodes:leading.normProgram.nodes},
  {U:leading.normProgram.roots.U0CorePhysicalTotal,F:leading.normProgram.roots.F0CorePhysicalTotal});
 assert.equal(leadingTrace.nonArithmeticBoundaries.length,0);
 const leadingParameters=evaluateClosedArithmeticDefinitions(historical.definitions,N,{names:leadingTrace.sourceParameters}).values;
 const leadingArithmetic=tracedArithmeticEvaluator(leadingTrace,N,{parameters:leadingParameters});
 const q=x=>N.point(String(x)),closed=x=>N.toClosed(x);
 const leadingCaps={L_U:N.mul(q(720),leadingArithmetic.value(leadingTrace.roots.U)),
  L_F:N.mul(q(720),leadingArithmetic.value(leadingTrace.roots.F)),K:parameters.get('K')};
 leadingCaps['L_F^2']=N.pow(leadingCaps.L_F,2);
 const h=parameters.get('h'),Lambda=parameters.get('Lambda'),Xb=N.fromClosed(background.Xb);
 const ell=N.fromClosed(fixed.hostedOriginal[617432]);
 const hLogTau=N.mul(h,N.neg(N.mul(N.add(ell,q(15)),N.log(q(2)))));
 assert.equal(N.compareEndpoints(closed(h).lower,{rational:'0'}),1);
 assert.equal(N.compareEndpoints(closed(h).upper,{rational:'1/64'}),-1);
 assert.equal(N.compareEndpoints(closed(hLogTau).upper,{rational:'0'}),-1);
 assert.equal(N.compareEndpoints(closed(Lambda).lower,{rational:'1'}),1);
 assert.equal(N.compareEndpoints(closed(Xb).lower,{rational:'1'}),1);
 return {N,q,closed,load,pins,sharpPin,native,axis,H,leadingCaps,h,hLogTau,Lambda,Xb,
  traceReport:arithmetic.report(),leadingReport:leadingArithmetic.report(),
  sourceModuleSHA256:sharp.sourceModuleSHA256,originalNodePrefix:native.originalNodes};
}
