import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [sourceRoot, outPath] = process.argv.slice(2);
assert.ok(sourceRoot && outPath, 'Supply source snapshot root and receipt path');
const navier = resolve(sourceRoot, 'research-ide/mathscope-m2/navier');
const src = name => import(pathToFileURL(resolve(navier, name)).href);
const { prepareActualOrderInduction, assertActualOrderInduction } =
  await src('actual-residual-order-induction-source.mjs');
const { attachActualCanonicalCutoffs, assertActualNormalizedCutoffs } =
  await src('actual-residual-order-induction-cutoffs.mjs');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const started = Date.now();
const progress = event => process.stderr.write(JSON.stringify(event)+'\n');

progress({phase:'prepare-original-order-three'});
const options = { order: 3, maxNodes: 2200000 };
const prepared = prepareActualOrderInduction(options, {onProgress:progress});
assert.equal(assertActualOrderInduction(prepared), true);
const {G,records} = prepared;
const prefixSHA256 = hash(G.nodes.slice(0,117100));
const orderTwoPrefixNodeCount = 120820;
assert.equal(records[2].stress.backwardZ,orderTwoPrefixNodeCount-1);
const orderTwoPrefixSHA256 = hash(G.nodes.slice(0,orderTwoPrefixNodeCount));
assert.equal(prefixSHA256, 'd125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116');
const constructedNodes = G.nodes.length;
assert.deepEqual(records.map(r=>r.order), [0,1,2,3]);
const source = records[3];
assert.equal(source.global.completed,true);
assert.equal(source.global.actualFullLowerSupportConsumed,true);
assert.ok(source.global.actualMomentChecks.every(c=>c.pass));
assert.equal(source.raw.order,3);
assert.equal(G.picardSystems[source.raw.system].order,3);
assert.equal(G.picardSystems[source.raw.system].lowerOrders.length,3);
assert.deepEqual(G.picardSystems[source.raw.system].lowerOrders.map(r=>r.order),[0,1,2]);
progress({phase:'original-through-three-coefficients',nodes:constructedNodes,seconds:(Date.now()-started)/1000});

const cutoffs = attachActualCanonicalCutoffs(prepared, {onProgress:progress});
assert.equal(assertActualNormalizedCutoffs(cutoffs),true);
assert.deepEqual(cutoffs.rows.map(r=>r.order),[1,2,3]);
const row = cutoffs.rows[2];
const m0 = row.coefficientBounds.find(r=>r.derivativeOrder===0);
const m1 = row.coefficientBounds.find(r=>r.derivativeOrder===1);
const normalized = cutoffs.normPrefixes[2].normalized[2];
assert.deepEqual(row.canonicalNormRequest, {throughOrder:3,derivativeOrder:3});
assert.deepEqual(normalized.actualSourceRoots.F,source.global.F);
assert.deepEqual(normalized.actualSourceRoots.U,source.global.U);
assert.deepEqual(normalized.actualSourceRoots.Pi,source.global.Pi);
assert.deepEqual(row.sourceCoefficientRoots,normalized.actualSourceRoots);
assert.equal(normalized.sourceCoefficientReplacedByBound,false);
assert.deepEqual(normalized.domain.eta,['-1','1']);
const E0 = normalized.jets.E.find(r=>r.radialOrder===0&&r.etaOrder===0);
const E1 = normalized.jets.E.find(r=>r.radialOrder===1&&r.etaOrder===0);
const e0 = m0.terms.find(r=>r.field==='E'&&r.eulerOrder===0&&r.radialOrder===0&&r.etaOrder===0);
const e1 = m1.terms.find(r=>r.field==='E'&&r.eulerOrder===0&&r.radialOrder===1&&r.etaOrder===0);
assert.equal(e0.upper,E0.upper);
assert.equal(e1.upper,E1.upper);
assert.equal(G.nodes[m0.bound].op,'maximum');
assert.ok(G.nodes[m0.bound].args.includes(e0.upper));
assert.ok(G.nodes[m1.bound].args.includes(e1.upper));
assert.equal(G.nodes[row.logScale].op,'maximum');
assert.ok(G.nodes[row.logScale].args.includes(m0.requiredLog));
assert.ok(G.nodes[row.logScale].args.includes(m1.requiredLog));
assert.deepEqual(G.nodes[row.scale],{op:'exp',args:[row.logScale]});
const q=(a,b=1)=>G.q(a,b), h=G.parameter('h'), log2=G.log(q(2));
for (const r of [m0,m1]) {
  const expected=G.div(G.add(G.mul(q(3),log2),G.log(r.bound)),G.mul(q(3),h));
  assert.equal(expected,r.requiredLog);
}
assert.equal(row.originalPositiveExponent,G.mul(q(3),h));

const roots = {
  leadingF: records[0].global.F, lowerF1: records[1].global.F, lowerF2: records[2].global.F,
  F3: source.global.F, U3: source.global.U, Pi3: source.global.Pi, M3: source.global.M,
  rawF3:source.raw.F, actualF3:source.actual.F, coreC3:source.norm.actual.C,
  Xlo:normalized.domain.X[0], Xhi:normalized.domain.X[1], h, log2,
  B30:m0.bound, B31:m1.bound, E30:E0.upper, EX30:E1.upper,
  logBound0:m0.requiredLog, logBound1:m1.requiredLog, logc3:row.logScale,c3:row.scale,
  nh:row.originalPositiveExponent,
};
const operatorIds = new Set(Object.values(roots));
const descend = (id, depth) => {
  operatorIds.add(id);
  if (!depth) return;
  const {op,args} = G.nodes[id];
  if (['multiply','add','maximum','inverse','log_positive','exp','sqrt_positive'].includes(op))
    for(const v of args) descend(v, depth-1);
};
for (const id of [m0.requiredLog,m1.requiredLog]) descend(id, 3);
for (const id of [m0.bound,m1.bound,row.logScale,row.scale]) descend(id, 1);
for (const id of [E0.upper,E1.upper,normalized.domain.X[0],normalized.domain.X[1]]) descend(id, 2);
const sourceNodeRecords = Object.fromEntries([...operatorIds].sort((a,b)=>a-b).map(id=>[id,G.nodes[id]]));
const output = {
  schema:'MathScope.N7.ActualThirdOrderCanonicalDiagonal/1',
  input:options,
  graph:{constructedNodes,canonicalNodes:G.nodes.length,prefixSHA256,
         orderTwoPrefixNodeCount,orderTwoPrefixSHA256,
         allNodeSHA256:hash(G.nodes),nativeDefinitionsSHA256:hash(G.captureFunctionDefinitions())},
  actualThirdSource:{rawSystem:source.raw.system,auxiliarySystem:source.auxiliary.system,
        actualLowerOrders:G.picardSystems[source.raw.system].lowerOrders.map(r=>r.order),
        actualLowerFormals:G.picardSystems[source.raw.system].lowerOrders,
        actualZeroAxisDatum:G.picardSystems[source.raw.system].zeroAxisDatum,
        actualFinalizedLowerCutoffs:G.picardSystems[source.raw.system].actualFinalizedLowerCutoffs,
        actualCompletedFiveMoments:source.global.actualMomentChecks.map(r=>r.pass),
        actualCutoffPreserved:source.actual.cutoffPreserved,
        stressRoots:[source.stress.Ttheta,source.stress.Tz],
        rawResidualRoots:[source.stress.rawTheta,source.stress.rawZ]},
  normalized:{roots:normalized.actualSourceRoots,domain:normalized.domain,
              derivativeConvention:normalized.derivativeConvention,
              sourceCoefficientReplacedByBound:normalized.sourceCoefficientReplacedByBound,
              E0,E1},
  cutoff:{order:row.order,canonicalNormRequest:row.canonicalNormRequest,
          m0,m1,logScale:row.logScale,scale:row.scale},
  roots,sourceNodeRecords,
  scope:{actualCanonicalHistoricalCutoffBuilt:true,orderFourAllocated:false,
         actualCommonB3ValueNumericallyEvaluated:false,nativeSupremumNumericallyEvaluated:false},
};
await writeFile(outPath,JSON.stringify(output,null,2)+'\n');
progress({phase:'PASS-original-third-diagonal',canonicalNodes:G.nodes.length,
          seconds:(Date.now()-started)/1000});
