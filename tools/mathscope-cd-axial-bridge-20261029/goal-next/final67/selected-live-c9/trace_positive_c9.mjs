import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const [runtime, arithmeticRuntime, traceOutput] = process.argv.slice(2);
const source = (tree,name) => import(pathToFileURL(resolve(tree,'mathscope-m2/navier',name)).href);
const [{prepareActualOrderInduction,assertActualOrderInduction},
       {attachActualInductionNorms,assertActualInductionNorms},
       {sourceNormalizedCutoffWeights},
       {traceExactArithmeticDependencies}] = await Promise.all([
  source(runtime,'actual-residual-order-induction-source.mjs'),
  source(runtime,'actual-residual-order-induction-norms.mjs'),
  source(runtime,'actual-residual-order-induction-kernels.mjs'),
  source(arithmeticRuntime,'actual-common-selection-arithmetic-trace.mjs'),
]);
const prepared = prepareActualOrderInduction({order:3,maxNodes:3_000_000});
assert(assertActualOrderInduction(prepared));
const originalPrefix = prepared.G.nodes.length;
assert.equal(originalPrefix,123870);
const norms = attachActualInductionNorms(prepared,{derivativeOrder:9,throughOrder:3});
assert(assertActualInductionNorms(norms));
const {G} = norms;
const q = (...n) => G.q(...n);
const h = G.parameter('h');
const roots = {};
const finite = [];
for (const row of norms.normalized) {
  const n = row.order;
  const weights = sourceNormalizedCutoffWeights({order:n,derivativeOrder:9});
  const W = weights.weights.map(row => G.add(...row.polynomialInSourceH.map(
    (coefficient,i) => G.mul(q(BigInt(coefficient)),G.pow(h,i)))));
  const fieldMax = field => G.maximum(G.one,...row.jets[field].flatMap(jet =>
    W.slice(0,10-jet.radialOrder-jet.etaOrder).map(weight => G.mul(weight,jet.upper))));
  const E = fieldMax('E');
  const U = fieldMax('U');
  roots['normalized_positive_F_'+n] = E;
  roots['normalized_positive_G_'+n] = U;
  finite.push({n,E,U,normalizedEulerWeights:W.length,mixedProfileOrders:row.jets.E.length});
}
const trace = traceExactArithmeticDependencies(G,roots,{maxNodes:450_000});
console.log(JSON.stringify(trace.nonArithmeticBoundaries));
const output = {schema:'MathScope.N7.OriginalLivePositiveC9ProfileTrace/1',originalPrefix,
  originalAllOrderNormNodes:norms.program.nodes.length, builtNodes:G.nodes.length, derivativeOrder:9,finite,
  normalizedRadialBasis:'E=sqrt(2X)*F, G=U; retain original q^(2nh) for each fixed Euler cutoff',
  sourceParameterExpressionSHA256:prepared.program.parameterExpressionSHA256,trace,
  scope:{chartCoefficientBound:'OPEN',leadingFullC9:'OPEN',actualUniformSelectedC9:'OPEN',finalJets:0,release:'HOLD'}};
writeFileSync(traceOutput,JSON.stringify(output)+'\n',{flag:'wx'});
console.log(JSON.stringify({originalPrefix,builtNodes:G.nodes.length,arithmeticTraceNodes:trace.nodeCount,
  nonArithmeticBoundaries:trace.nonArithmeticBoundaries.length,roots}));
