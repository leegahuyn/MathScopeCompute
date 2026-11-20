/** Replay the original n=1,2,3 stress coefficient joins and finite norm inputs. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,arithmeticRuntime,supportOut,normOut]=process.argv.slice(2);
assert(normOut);
const navier=resolve(runtime,'research-ide/mathscope-m2/navier');
const pins={
 'actual-residual-order-induction-source.mjs':'30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
 'actual-residual-order-induction-norms.mjs':'0387335a081650c4a6ffed6e213215d32a363350c2a156a7163e82f4c0234634',
 'actual-positive-global-stress.mjs':'77227cd74000f5b6d4bec0361106af21d8020b2eee1eb979c1adc9ec3aae97d1',
 'actual-continuation-exact-support.mjs':'0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98',
 'actual-residual-order-induction-kernels.mjs':'97f8bbc5927ee2b2ac5b41851ba5bc2c800fd4cad6b85c7a1039095c066f7fef',
};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const paths=Object.fromEntries(Object.keys(pins).map(name=>[name,resolve(navier,name)]));
for(const [name,hash] of Object.entries(pins)) assert.equal(sha(await readFile(paths[name])),hash,name);
const load=name=>import(pathToFileURL(paths[name]).href);
const [
  {prepareActualOrderInduction,assertActualOrderInduction},
  {attachActualInductionNorms,assertActualInductionNorms},
  {prepareActualPositiveGlobalStress,assertActualPositiveGlobalStress},
  {sourceNormalizedCutoffWeights, sourceAllOrderCutoffJets},
  traceModule,
]=await Promise.all([
  load('actual-residual-order-induction-source.mjs'),
  load('actual-residual-order-induction-norms.mjs'),
  load('actual-positive-global-stress.mjs'),
  load('actual-residual-order-induction-kernels.mjs'),
  import(pathToFileURL(resolve(arithmeticRuntime,'research-ide/mathscope-m2/navier/actual-common-selection-arithmetic-trace.mjs')).href)
]);

const proof=prepareActualPositiveGlobalStress({order:3,maxNodes:5000000});
assert(assertActualPositiveGlobalStress(proof));
const G=proof.G;
const prefix=sha(JSON.stringify(G.nodes.slice(0,117100)));
assert.equal(prefix,'d125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116');
const support=proof.moments.pressure.primitives.sourceSupport;
assert(support.pass && support.expressionChecks.allEndpointsIndependentOfEta);
for(const name of ['axialEnd','plus','terminal','cutoff','interpolationStartsAfterPulse','consecutiveStages'])
  assert.equal(support.expressionChecks[name],true,name);
assert.equal(support.arithmeticChecks.nextStageLongerThanOne,true);
assert(support.parameterChecks.actualTf);
const rows=proof.stressRows.map(row=>{
  const fact=proof.rawRows[row.order-1];
  assert(fact.allOriginalConvolutionTermsRetained && !fact.lowerForcingDropped);
  assert(row.originalSignedFTC.pass && row.wholeDensityCheck.pass && row.backwardSign.pass);
  assert(row.interiorCoefficientCheck.pass && row.actualConservativeTotalReduced===G.zero);
  assert(fact.innerRestriction.sourceCoreChecks && fact.sourceInner.pass && row.allFixedDerivativeJetsMatch);
  assert.deepEqual(fact.pairs,Array.from({length:row.order+1},(_,i)=>[i,row.order-i]));
  assert(Object.values(fact.exterior).every(x=>x.pass && x.zero.value===G.zero && x.endpoint===support.endpoints.Xplus));
  const b=G.nodes[row.sourceBackwardIntegral];
  const f=G.nodes[row.sourceForwardIntegral];
  assert(b.op==='definite_integral' && f.op==='definite_integral');
  assert.equal(f.args[2],support.endpoints.Xminus);
  const terminal=row.order===1&&row.component==='theta';
  assert.equal(b.args[3], terminal ? support.endpoints.Xb : support.endpoints.Xplus);
  return {order:row.order,component:row.component,actualStress:row.actualStress,actualRawResidual:row.actualRawResidual,
    forward:row.sourceForwardIntegral,backward:row.sourceBackwardIntegral,whole:row.actualWholeResidualIntegral,originalStoredTotal:row.originalTotal,
    forwardArgs:f.args,backwardArgs:b.args,allOrderedLowerPairs:fact.pairs,
    exactWholeReduction:row.actualConservativeTotalReduced,exteriorZeroAfter:terminal?null:support.endpoints.Xplus,
    exteriorProof:fact.exteriorMechanism,lowerViscosity:row.component==='theta'?fact.lowerAngular:fact.lowerAxial};
});
assert.equal(rows.length,6);
assert.deepEqual(rows.filter(row=>row.order===1).map(row=>[row.component,row.originalStoredTotal]).sort(),[['theta',117072],['z',117075]]);
const cuts=Array.from({length:3},(_,i)=>sourceNormalizedCutoffWeights({order:i+1,derivativeOrder:6}));
const flat=sourceAllOrderCutoffJets({order:6});
assert(flat.pass && flat.activation.seedPower===2);
const output={
 schema:'MathScope.C107.OriginalPositiveStressSupportAndScaling/1',pins,prefix,nodes:G.nodes.length,
 endpoints:support.endpoints,etaIndependent:true,sourceTf:128,lowerOuterLogGap:127,
 lowerInnerLogDistance:'t1/128',rows,
 cutoff:{formula:cuts.map(v=>v.sourceCutoff),finiteEulerRows:cuts.map(v=>v.weights),
  sigmaOrdinaryCaps:flat.activation.ordinaryDerivativeBounds},
 conditionalScope:'Original analytic moment, signed forward/backward FTC, and continuous one-sided physical eta realization.',
};
await writeFile(supportOut,JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({actualStressRows:rows.length,nativeStressGraphNodes:G.nodes.length}));

const prepared=prepareActualOrderInduction({order:3,maxNodes:3000000});
assert(assertActualOrderInduction(prepared));
assert.equal(prepared.G.nodes.length,123870);
const hash=createHash('sha256');
for(const node of prepared.G.nodes) hash.update(JSON.stringify(node)+'\n');
assert.equal(hash.digest('hex'),'ae216216f5076bd6d8c4d5a61f34af1979141af5f13b591c6de371bc0a672d9e');
const norm=attachActualInductionNorms(prepared,{derivativeOrder:8,throughOrder:3});
assert(assertActualInductionNorms(norm));
const roots={}, normalized=[];
for(const row of norm.normalized){
 const n=row.order, use={};
 for(const name of ['E','U','Pi','VOverR']){
  const jets=row.jets[name];
  assert.equal(jets.length,45);
  use[name]=norm.G.maximum(norm.G.one,...jets.map(v=>v.upper));
  roots['n'+n+'_'+name]=use[name];
 }
 normalized.push({order:n,actualSourceRoots:row.actualSourceRoots,domain:row.domain,maximumThrough8:use});
}
const trace=traceModule.traceExactArithmeticDependencies(norm.G,roots,{maxNodes:500000});
assert.deepEqual(trace.nonArithmeticBoundaries.map(row=>row.id),[239,257,275]);
await writeFile(normOut,JSON.stringify({schema:'MathScope.C107.OriginalPositiveStressFieldNormTrace/1',
 pins, normalized,sourceParameterExpressionSHA256:prepared.program.parameterExpressionSHA256,trace})+'\n',{flag:'wx'});
console.log(JSON.stringify({originalInductionPrefix:123870,normalizedFields:12,arithmeticTraceNodes:trace.nodeCount}));
