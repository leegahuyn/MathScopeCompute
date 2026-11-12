import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [sourceRoot, output, arithmeticOutput] = process.argv.slice(2);
assert.ok(sourceRoot && output, 'Supply original source snapshot and output path');
const navier = resolve(sourceRoot,'research-ide/mathscope-m2/navier');
const source = name=>import(pathToFileURL(resolve(navier,name)).href);
const {prepareActualOrderInduction,assertActualOrderInduction} = await source('actual-residual-order-induction-source.mjs');
const {attachActualCanonicalCutoffs,assertActualNormalizedCutoffs} = await source('actual-residual-order-induction-cutoffs.mjs');
const {sourceNormalizedCutoffWeights} = await source('actual-residual-order-induction-kernels.mjs');
const hash = value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

const prepared=prepareActualOrderInduction({order:3,maxNodes:2200000});
assert.equal(assertActualOrderInduction(prepared),true);
const cutoffs=attachActualCanonicalCutoffs(prepared);
assert.equal(assertActualNormalizedCutoffs(cutoffs),true);
const {G,records}=prepared;
const originalHash=hash(G.nodes);
assert.equal(originalHash,'9c1ccdd3a60ce37974a3d63d7436e178cd8b1214bc7c7c69418538849ae8b49c');
assert.equal(G.nodes.length,212870);
const originalNodeCount=G.nodes.length;
const broad=cutoffs.normPrefixes[2];
assert.equal(broad.order,3);
assert.equal(broad.derivativeOrder,3);
assert.ok(Object.values(broad.checks).every(Boolean));
assert.deepEqual(broad.normalized.map(row=>row.order),[1,2,3]);
const fields=['StreamOverR','E','Pi'];
const q=(n,d=1)=>G.q(n,d);
const h=G.parameter('h');
const higher=[];
const canonical=[];
const nodeIds=new Set();
for (let n=1;n<=3;n++){
  const basis=broad.normalized[n-1], row=cutoffs.rows[n-1];
  assert.equal(basis.actualSourceRoots.F,records[n].global.F);
  assert.equal(basis.actualSourceRoots.U,records[n].global.U);
  assert.equal(basis.actualSourceRoots.Pi,records[n].global.Pi);
  assert.equal(basis.actualSourceRoots.Stream,records[n].global.M);
  assert.equal(basis.sourceCoefficientReplacedByBound,false);
  assert.deepEqual(basis.domain,{X:[137007,137008],eta:['-1','1']});
  const weights=sourceNormalizedCutoffWeights({order:n,derivativeOrder:3});
  assert.equal(weights.pass,true);
  assert.equal(weights.sourceCutoff,'chi(s)=1-sigma_1(2s-1)');
  const W=weights.weights.map(e=>G.add(...e.polynomialInSourceH.map((v,k)=>G.mul(q(BigInt(v)),G.pow(h,k)))));
  assert.equal(W[0],G.one);
  for (let m=0;m<=3;m++){
    if (m<=n){
      const rule=row.coefficientBounds[m];
      assert.equal(rule.derivativeOrder,m);
      assert.ok(G.nodes[row.logScale].args.includes(rule.requiredLog));
      const roots=cutoffs.normPrefixes[n-1].normalized[n-1].jets;
      for (const field of fields) for (let e=0;e<=m;e++) for (const j of roots[field]){
        if (e+j.radialOrder+j.etaOrder>m) continue;
        const term=rule.terms.find(t=>t.field===field&&t.eulerOrder===e&&
                            t.radialOrder===j.radialOrder&&t.etaOrder===j.etaOrder);
        assert.ok(term);
        assert.equal(term.upper,G.mul(W[e],j.upper));
      }
      canonical.push({n,m,B:rule.bound,requiredLog:rule.requiredLog,logc:row.logScale,c:row.scale});
      for(const id of [rule.bound,rule.requiredLog,row.logScale,row.scale])nodeIds.add(id);
      continue;
    }
    for(const field of fields){
      if(field==='E' && m===3 || field==='Pi' && m>=2)continue;
      const terms=[];
      for(let e=0;e<=m;e++)for(const j of basis.jets[field]){
        if(e+j.radialOrder+j.etaOrder>m)continue;
        terms.push({e,r:j.radialOrder,t:j.etaOrder,jet:j.upper,W:W[e],upper:G.mul(W[e],j.upper)});
      }
      const bound=G.maximum(G.one,...terms.map(t=>t.upper));
      assert.ok(terms.every(t=>G.nodes[bound].args.includes(t.upper)));
      higher.push({n,m,field,bound,weights:weights.weights.slice(0,m+1).map(e=>e.polynomialInSourceH),terms});
      nodeIds.add(bound);
      for(const t of terms)for(const id of [t.jet,t.W,t.upper])nodeIds.add(id);
    }
  }
}
assert.equal(assertActualNormalizedCutoffs(cutoffs),true);
assert.equal(hash(G.nodes.slice(0,originalNodeCount)),originalHash);
const Uroot=broad.leadingNormalized.U[0].upper;
assert.ok(broad.leadingNormalized.U.every(j=>j.upper===Uroot));
const leading=broad.leading;
assert.equal(leading.pass,true);
assert.equal(leading.bounds.U0.actualCompletedLeadingSource,true);
assert.equal(leading.bounds.F0inner.domain.includesNaturalAndActualB26,true);
assert.equal(leading.bounds.F0inner.domain.beforeC12,true);
const Lroot=leading.bounds.F0inner.root;
const program=leading.normProgram;
const pressureRows=program.ledger.filter(r=>JSON.stringify(r).includes('actual A21 pressure jet'));
assert.ok(pressureRows.length>0);
const K=G.parameter('K'), pressureDatumBounds=[G.mul(q(5),K),G.mul(q(160),K)];
for(const id of [K,...pressureDatumBounds])nodeIds.add(id);
const outputData={
  schema:'MathScope.N7.ActualStrictCoreHighNorms/1',
  originalCanonical:{nodeCount:originalNodeCount,sha256:originalHash},
  extendedNodeCount:G.nodes.length,
  originalLowerPrefix:hash(G.nodes.slice(0,120820)),
  positive: broad.normalized.map(r=>({order:r.order,domain:r.domain,roots:r.actualSourceRoots})),
  canonical,higher,
  leading:{U0Bound:G.nodes[Uroot],U0BoundRoot:Uroot,U0Source:records[0].global.U,
           producer:leading.sourceFunctionIdentity,bounds:leading.bounds,
           normProgramSHA256:hash(program.nodes),F0BoundNode:program.nodes[Lroot],
           pressureRows,pressureDatumBounds,K},
  sourceNodeRecords:Object.fromEntries([...nodeIds].sort((a,b)=>a-b).map(i=>[i,G.nodes[i]])),
  scope:{onlyOriginalOrders:[0,1,2,3],actualHigherBoundsRetained:true,
         higherBoundsAddedToOriginalCutoff:false,finiteSupremumNumericallyEvaluated:false},
};
await writeFile(output,JSON.stringify(outputData,null,2)+'\n');
console.log('PASS original through-three norm roots, higher n=1,2 unabsorbed coefficients, and leading inputs');
if (arithmeticOutput) {
  const {traceExactArithmeticDependencies} = await source('actual-common-selection-arithmetic-trace.mjs');
  const roots = {L_U: Uroot, K, h, Rstar: G.parameter('C12EnvelopeR')};
  for (const row of higher) roots['H_' + row.bound] = row.bound;
  const main = traceExactArithmeticDependencies(G, roots);
  const leadingF = traceExactArithmeticDependencies({nodes: program.nodes}, {L_F: Lroot});
  assert.ok(main.nonArithmeticBoundaries.every(({id, node}) =>
    [239, 257, 275].includes(id) && node.op === 'definite_integral'));
  assert.deepEqual(leadingF.nonArithmeticBoundaries, []);
  await writeFile(arithmeticOutput, JSON.stringify({
    schema: 'MathScope.N7.ExactSlowJetNormTrace/1',
    highNormReceiptSHA256: createHash('sha256').update(JSON.stringify(outputData,null,2)+'\n').digest('hex'),
    canonicalGraphSHA256: originalHash, leadingProgramSHA256: hash(program.nodes),
    definitions: G.source.parametersExactExpressions, main, leadingF,
  })+'\n');
  console.log('PASS exact arithmetic traces', main.nodeCount, leadingF.nodeCount);
}
