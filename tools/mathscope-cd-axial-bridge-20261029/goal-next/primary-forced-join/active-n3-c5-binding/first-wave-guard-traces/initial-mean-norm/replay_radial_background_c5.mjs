/** Evaluate the source's radial bracket, including the Euler cutoff commutator. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime, goal, work, output] = process.argv.slice(2);
assert.ok(runtime && goal && work && output, 'four arguments are required');
const order = 5;
const nav = resolve(runtime, 'research-ide/mathscope-m2/navier');
const numericTree = resolve(work, 'annular-numeric-24/pinned-original-runtime');
const tracing = resolve(numericTree, 'research-ide/mathscope-m2/navier/actual-common-selection-arithmetic-trace.mjs');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = async (path, pin) => {
  const bytes = await readFile(path);
  if (pin) assert.equal(sha(bytes), pin, path);
  return JSON.parse(bytes);
};
const modules = [
  [resolve(nav,'actual-residual-order-induction-source.mjs'),'30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047'],
  [resolve(nav,'actual-residual-order-induction-norms.mjs'),'0387335a081650c4a6ffed6e213215d32a363350c2a156a7163e82f4c0234634'],
  [resolve(nav,'actual-residual-order-induction-kernels.mjs'),'97f8bbc5927ee2b2ac5b41851ba5bc2c800fd4cad6b85c7a1039095c066f7fef'],
  [tracing,'195a465e4570c1da341db4d56d71beb1773d5040bd95b296c17c7dfd2a395edc'],
];
const [{prepareActualOrderInduction,assertActualOrderInduction},
       {attachActualInductionNorms,assertActualInductionNorms},
       {sourceNormalizedCutoffWeights},{traceExactArithmeticDependencies}] =
  await Promise.all(modules.map(async ([path, pin]) => {
    assert.equal(sha(await readFile(path)), pin, path);
    return import(pathToFileURL(path).href);
  }));
const prepared=prepareActualOrderInduction({order:3,maxNodes:3_000_000});
assert.ok(assertActualOrderInduction(prepared) && prepared.G.nodes.length===123870);
const pre=createHash('sha256');
for (const node of prepared.G.nodes) pre.update(JSON.stringify(node)+'\n');
const prefixSHA=pre.digest('hex');
assert.equal(prefixSHA,'ae216216f5076bd6d8c4d5a61f34af1979141af5f13b591c6de371bc0a672d9e');
const profileRoots=prepared.records.map(({global},n)=>({n,v:global.v,M:global.M}));
const norms=attachActualInductionNorms(prepared,{derivativeOrder:order,throughOrder:3});
assert.ok(assertActualInductionNorms(norms));
const {G}=norms,h=G.parameter('h');
const poly=coeff=>G.add(...coeff.map((v,k)=>G.mul(G.q(BigInt(v)),G.pow(h,k))));
const lead=G.maximum(G.one,...norms.leadingNormalized.radialBracket.map(o=>o.upper));
assert.equal(norms.leadingNormalized.radialBracket.length,21);
const roots={leadingRadialBracket:lead}, counts=[];
for (const row of norms.normalized) {
  const n=row.order, weights=sourceNormalizedCutoffWeights({order:n,derivativeOrder:order}).weights;
  const ordinary=weights.map(x=>poly(x.polynomialInSourceH));
  const extra=weights.map(x=>poly(x.extraPotentialCutoffPolynomialInSourceH));
  const jetTerms=row.jets.VOverR,extraTerms=row.jets.ExtraStream;
  assert.equal(jetTerms.length,21);
  const bounds=[];
  for (const [i, jet] of jetTerms.entries()) {
    const er=extraTerms[i];
    assert.equal(jet.radialOrder,er.radialOrder);
    assert.equal(jet.etaOrder,er.etaOrder);
    for (let e=0;e+jet.radialOrder+jet.etaOrder<=order;e++) {
      bounds.push(G.add(G.mul(ordinary[e],jet.upper),G.mul(extra[e],er.upper)));
    }
  }
  assert.equal(bounds.length,56);
  roots['radial_'+n]=G.maximum(G.one,...bounds);
  assert.equal(row.actualSourceRoots.VOverX,profileRoots[n].v);
  assert.equal(row.actualSourceRoots.Stream,profileRoots[n].M);
  counts.push({n,profileJets:jetTerms.length,eulerMixed:bounds.length,ordinaryAndExtraBothRetained:true});
}
const trace=traceExactArithmeticDependencies(G,roots,{maxNodes:500000});
const history=await read(resolve(work,'whole-k-prefix/historical-scale-arithmetic-input.json'),
  '03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0');
const audit=await read(resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json'),
  'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf');
const local=await read(resolve(goal,'final67/local-background-c8/c8-slab.json'),
  'e26c62baf924c4209bbac2ebd944bd17a992bfe4599fd1a8fab2cb8c91d7c02b');
const library=resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs');
const {sourceArithmetic}=await import(pathToFileURL(library).href);
const {N,evaluateClosedArithmeticDefinitions,tracedArithmeticEvaluator}=await sourceArithmetic(numericTree,audit.sourcePins,'coarse-upper');
const parameterNames=[...new Set([...trace.sourceParameters,'h','Lambda','C12EnvelopeR'])];
const parameters=evaluateClosedArithmeticDefinitions(history.definitions,N,{names:parameterNames}).values;
const boundaries=new Map();
for (const item of trace.nonArithmeticBoundaries) {
  const saved=history.nodes.find(row=>row.id===item.id);
  assert.ok(saved && history.boundaryIntervals[item.id], 'unknown boundary '+item.id);
  assert.deepEqual(item.node,saved.node);
  boundaries.set(item.id,N.fromClosed(history.boundaryIntervals[item.id]));
}
const ev=tracedArithmeticEvaluator(trace,N,{parameters,boundaries,maxNodeVisits:trace.nodeCount});
const ell=N.fromClosed(history.archivedEllMinimumInterval);
const H=N.mul(parameters.get('h'),N.mul(N.add(ell,N.point('15')),N.log(N.point('2'))));
const Hc=N.max([N.point('2'),parameters.get('Lambda'),parameters.get('C12EnvelopeR')]);
// The C89 ordinary coefficient recurrence also covers s^(-1/2),
// whose pure Euler coefficient derivatives are bounded by 2*(1/2)^e.
const chart=N.mul(N.pow(N.point('2'),1867),N.pow(Hc,143));
const leading=ev.value(lead);
const positive=counts.map(row=>{
  const e=ev.value(roots['radial_'+row.n]);
  const qWeight=N.mul(N.point('2'),N.exp(N.mul(N.point(String(-2*row.n)),H)));
  return {...row,unweighted:N.toClosed(e).upper,directedOnSlab:N.toClosed(N.mul(qWeight,e)).upper};
});
const series=N.add(leading,...positive.map(row=>N.fromClosed({lower:{rational:'0'},upper:row.directedOnSlab})));
const bound=N.mul(chart,series);
const slabComparison=N.compareEndpoints(N.toClosed(bound).upper,local.gates.smallGrowth128.lower);
assert.ok(slabComparison!==null);
const result={
  schema:'MathScope.C91.OriginalNativeRadialBThroughC5/1',
  prefixSHA,sourceParameterExpressionSHA256:prepared.program.parameterExpressionSHA256,
  moduleHashes:modules.map(([name,pin])=>[name.slice(name.lastIndexOf('/')+1),pin]),
  profileRoots,traceSHA256:sha(JSON.stringify(trace)),traceNodes:trace.nodeCount,
  knownBoundaries:trace.nonArithmeticBoundaries.map(o=>o.id),
  normalizedB:'b/epsilon=s^(-1/2)*(leadingRadialBracket+sum positive native radial brackets)',
  leadingRadialBracketUpper:N.toClosed(leading).upper,
  positive,chartCoefficient:'2^1867*max(2,Lambda,C12EnvelopeR)^143',
  directedFullSlabUpper:N.toClosed(bound).upper,originalLiveSlabThresholdComparison:slabComparison,
  analyticSourceConditionsRetained:true,finalJets:0,release:'HOLD',
};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'DIRECTED_ORIGINAL_RADIAL_B_OVER_EPS_C5',profileRoots,
  nodes:trace.nodeCount,knownBoundaries:result.knownBoundaries,slabComparison}));
