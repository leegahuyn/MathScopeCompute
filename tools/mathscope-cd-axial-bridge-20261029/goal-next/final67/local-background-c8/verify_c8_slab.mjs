import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [evidence, workRoot, output] = process.argv.slice(2);
assert.equal(process.argv.length,5);
const goal = resolve(evidence);
const work = resolve(workRoot);
const host = join(work,'continuation59/hosted-44553053960');
const pathNorm = 'primary-forced-join/active-n3-c5-binding/norm-leading';
const paths = {
  frontier: [join(host,'primary-K-arithmetic-frontier.json'), 'fbaea5bd2475e54919cef4099479c1c6ad6ad48dc68225190ea9f6c127f07aaa'],
  binding: [join(host,'primary-K-binding-index.json'), '23601379f5b414d470a79f9568ebccf7f27253efa7b39182b6753304190f09ac'],
  priorBinding: [join(work,'continuation38/target-bound/hosted-43371105453-n3/primary-K-binding-index.json'), '17421a6cd0819e9c4e09d56e78761c71346c10a6309def26e5d118319faad8bb'],
  leading: [join(work,'continuation37/n3-leading-ftc-join.json'), 'f4ddade17d8e3da62a1731425cadbf3e4886d0bbb47661b465f22ec4c5e5aa97'],
  chart: [join(work,'continuation37/slow-chart-directed.json'), '81f5a9ad2d0141a495d0e6a99e07e453fd754aaa6473d006a6426423a9352ddd'],
  chartProof: [join(work,'continuation37/slow-chart-majorant.json'), 'f15c6f354276be183238c3d829c335b71e33d3d08f28a0fae49ca17e46d35eb5'],
  background: [join(goal,pathNorm,'n3-background.json'), '6a73957352e35808f716d85355d6d14c164b61ccd027c3ea372bc015e8a01aec'],
  wholeK: [join(goal,pathNorm,'n3-whole-k.json'), '0e1984e6f872e9a167b7920d31a55b4888a807c359a0c38dbff9f8f8af5f4acb'],
  scales: [join(goal,'whole-k-selector-scales/fourth/fourth-selector-maxima.json'), '5a6ecee45d797d582e3218c36f980d5eb131619c860cec1bfb4d57aea89cdf56'],
  cover: [join(goal,'whole-k-atlas/primary-reference-cover.json'), '143d32b523429323eb3efc8ef8ea9c8f8922162bd919712cfe41580103a788be'],
  frozen: [join(goal,'whole-k-selector-scales/n4-single-frozen-cell.json'), '1766b52e6d40470b848ba1fa28b67ef0e8ff3cbb673420a94807a20fd97b3b86'],
  layout: [join(work,'continuation27/original-primary-degree-runtime/research-ide/mathscope-m2/navier/actual-compact-all-band-background-norms.mjs'), '62d877ca5d45073c8e95862bc0f5d0d44197f8ace34bd77d885bfbececc69464'],
  weights: [join(work,'continuation27/original-primary-degree-runtime/research-ide/mathscope-m2/navier/actual-residual-order-induction-cutoffs.mjs'), 'be8c7dbe6a7bc78ace2e87dc5e205640a06237e3db0670f9388aab4c0c0772f5'],
  band: [join(work,'continuation27/original-primary-degree-runtime/research-ide/mathscope-m3/navier/source-global-band.mjs'), 'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60'],
  helper: [join(goal,'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/evaluate_mean_bulk_energy.mjs'), '61d4d23e7ec003206758c861a2e464791730dc6f14b648d3b5eb721418f59f7b'],
};
const hashes = {};
const checked = async key => {
  const [path, pin] = paths[key];
  const body = await readFile(path);
  const digest = createHash('sha256').update(body).digest('hex');
  assert.equal(digest,pin,key);
  hashes[key] = digest;
  return path.endsWith('.json') ? JSON.parse(body) : body.toString('utf8');
};
const [frontier,index,priorIndex,leading,chart,chartProof,background,wholeK,scales,cover,frozen,layout,weights,band] =
  await Promise.all(['frontier','binding','priorBinding','leading','chart','chartProof','background','wholeK','scales','cover','frozen','layout','weights','band'].map(checked));
await checked('helper');
assert.equal(frontier.prefix,3);
assert.equal(frontier.graphNamespace,'norm');
assert.equal(index.graphNamespace,'norm');
assert.equal(index.prefix,3);
assert.equal(index.normRoot,18310069);
assert.equal(frontier.roots.K,index.normRoot);
assert.equal(frontier.roots.backgroundC8,14220496);
assert.equal(chart.parameterExpressionSHA256,index.targetSourceProfileSHA256);
assert.equal(chart.coefficientProofSHA256,hashes.chartProof);
assert.equal(chartProof.faceBound,'Each original nonconstant slow-chart coefficient FTC sum lies in [0,2^1521 H^119].');
assert.equal(leading.sourcePins['primary-K-arithmetic-frontier.json'],hashes.frontier);
assert.deepEqual(leading.countByField,{F:45,U:45});
assert.equal(background.sourcePins.frontier,hashes.frontier);
assert.equal(background.sourcePins.index,hashes.priorBinding);
for(const key of ['normRoot','backgroundSource','targetSourceProfileSHA256','slowConstants','coefficientFTC','finiteBlocks'])assert.deepEqual(index[key],priorIndex[key],key);
assert.equal(background.sourcePins.leading,hashes.leading);
assert.equal(background.sourcePins.chart,hashes.chart);
assert.equal(cover.scaleReceiptSHA256,hashes.scales);
assert.deepEqual(scales.exactRatios,{'b1*qBig':1,'b2*qBig':16,'b3*qBig':32,'b4*qBig':64});
assert.equal(scales.physicalFourthCutoffJets,'ZERO on q>=qBig/64, including the flat endpoint');
assert.match(scales.frozenFourthCutoff,/exact modular phase remains OPEN/);
assert.deepEqual(cover.physicalSlab.N3.qOverQBig,['1/32','1/16']);
assert.deepEqual(cover.physicalSlab.N4.qOverQBig,['1/64','1/32']);
assert.equal(cover.physicalSlab.N3.referenceEll,'ellMinimum+15');
assert.equal(cover.physicalSlab.N4.referenceEll,'ellMinimum+16');
assert.equal(cover.physicalSlab.N3.omittedTimesQ,'>=2');
assert.equal(cover.physicalSlab.N4.omittedTimesQ,'>=2');
assert.ok(cover.frozenRepresentative.includes(">1/2"));
assert.equal(frozen.actualPhaseEvaluated,false);
assert.ok(layout.includes('positiveBound=field=>G.mul(normalizedBlocks[j].coefficient,G.add(...expansionAt(field,alpha).terms.map(t=>t.coefficientUpper)))'));
assert.ok(layout.includes("Ferror=G.mul(q(4),positiveBound('positiveE')),Gerror=G.mul(q(4),positiveBound('positiveU'))"));
assert.ok(weights.includes('originalPower:G.mul(q(2*n),h)'));
assert.ok(band.includes('powerQ=power(q0,G.mul(q(2*n),h))'));
assert.ok(band.includes('Fterms.push(G.mul(weight,sourceRoots.F));Gterms.push(G.mul(weight,sourceRoots.U))'));
assert.ok(band.includes('F0=atRep(leadingFields.F),FR0=atRep(G.derivative(leadingFields.F,R)),GR0=atRep(G.derivative(leadingFields.G,R))'));

const sourceNodes = new Map(frontier.nodes.map(({id,node})=>[id,node]));
const node = id => {
  const row = sourceNodes.get(id);
  assert.ok(row, 'Missing literal source root '+id);
  return row;
};
const args = (id,op,n) => {
  const row=node(id);
  assert.equal(row.op,op,'operation at '+id);
  if(n!==undefined)assert.equal(row.args.length,n,'arity at '+id);
  return row.args;
};
const slow = index.slowConstants.find(r=>r.derivativeOrder===8);
const block = index.finiteBlocks.find(r=>r.derivativeOrder===8);
assert.equal(slow.Cslow,14220475);
assert.equal(block.coefficient,14182092);
assert.deepEqual(block.finite.map(r=>r.bound),[14177917,14178851,14179740,14180546,14181238,14181769,14182085]);
assert.deepEqual(block.finite.map(r=>r.originalPower),[25,4240,120856,123915,127296,130990,135004]);
assert.equal(block.tailStarts,8);
assert.deepEqual(args(block.tailConstant,'rational',2),['1','128']);
assert.equal(wholeK.operands.find(x=>x.kind==='background C8').id,frontier.roots.backgroundC8);
const [bnorm,slowId,factorial,lmax,two] = args(frontier.roots.backgroundC8,'maximum',5);
assert.equal(slowId,slow.Cslow);
assert.deepEqual(args(factorial,'rational',2),['40320','1']);
assert.deepEqual(args(two,'rational',2),['2','1']);
assert.ok(node(bnorm).op==='add');

const chartIds=new Set(index.coefficientFTC.filter(r=>!r.sourceConstant).map(r=>r.bound));
const leadIds=new Map(leading.operands.map(r=>[r.bound,r.field]));
function flatten(id,isLeaf) {
  const queue=[id], leaves=[];
  while(queue.length){
    const current=queue.pop();
    if(isLeaf(current))leaves.push(current);
    else queue.push(...args(current,'add'));
  }
  return leaves;
}
assert.deepEqual(flatten(block.coefficient,id=>id===block.tailConstant||block.finite.some(r=>r.bound===id)).sort((a,b)=>a-b),
 [block.tailConstant,...block.finite.map(r=>r.bound)].sort((a,b)=>a-b));

function auditRow(id){
  const [lead,err]=args(id,'add',2);
  const [four,prod]=args(err,'multiply',2);
  assert.deepEqual(args(four,'rational',2),['4','1']);
  const pair=args(prod,'multiply',2);
  assert.equal(pair.filter(x=>x===block.coefficient).length,1);
  const coefficientSum=pair.find(x=>x!==block.coefficient);
  const positive=flatten(coefficientSum,id=>chartIds.has(id));
  const leadProducts=flatten(lead,id=>node(id).op==='multiply');
  const counts={F:0,U:0};
  const seenChart=new Set(positive),seenLead=new Set();
  for(const leaf of leadProducts){
    const pair=args(leaf,'multiply',2);
    const a=pair.find(x=>leadIds.has(x));
    assert.ok(a,'leading FTC leaf at #'+leaf);
    const c=pair.find(x=>chartIds.has(x));
    assert.ok(c&&a!==c,'chart FTC leaf at #'+leaf);
    assert.equal(leadIds.has(c),false);
    counts[leadIds.get(a)]++;
    seenChart.add(c);
    seenLead.add(a);
  }
  assert.ok((counts.F===0)!==(counts.U===0));
  return {id,lead,err,coefficientSum,F:counts.F,U:counts.U,positiveCount:positive.length,seenChart,seenLead};
}
const slowRows=args(slow.Cslow,'maximum',331);
assert.equal(slowRows[0],1);
const rowData=slowRows.slice(1).map(auditRow);
assert.equal(rowData.filter(r=>r.F>0).length,165);
assert.equal(rowData.filter(r=>r.U>0).length,165);
const ordinaryLeadingLeaves=new Set(rowData.flatMap(r=>[...r.seenLead]));
const ordinaryChartLeaves=new Set(rowData.flatMap(r=>[...r.seenChart]));
assert.equal(ordinaryLeadingLeaves.size,90);
assert.equal(ordinaryChartLeaves.size,25299);

const {prepareMeanBulkEnergy} = await import(pathToFileURL(paths.helper[0]).href);
const runtime=join(work,'annular-numeric-24/pinned-original-runtime');
const history=join(work,'whole-k-prefix/historical-scale-arithmetic-input.json');
const {N,q,closed,hLogTau,Xb} = await prepareMeanBulkEnergy(goal,runtime,history,join(goal,
 'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/weighted-velocity-coefficients.json'));
const compare=(left,right)=>N.compareEndpoints(left,right);
const zero={rational:'0'};
const upperOnly=interval=>N.fromClosed({lower:zero,upper:interval.upper});
assert.equal(compare(closed(hLogTau).upper,zero),-1);
const cutAt=(rate,bits)=>closed(N.mul(N.mul(q('1/'+String(1n<<BigInt(bits))),N.pow(Xb,-2)),
 N.exp(N.mul(q('-'+rate),hLogTau))));
const gates={
 oldStageOne:cutAt('1/10',33),
 normalizedStageOne:cutAt('1',28),
 smallGrowth27:cutAt('1/134217728',6),
 smallGrowth20:cutAt('1/1048576',6),
 smallGrowth64:cutAt('1/18446744073709551616',6),
 smallGrowth128:cutAt('1/340282366920938463463374607431768211456',6),
};
const evaluateToCaps=(interval)=>Object.fromEntries(Object.entries(gates).map(([key,gate])=>[key,compare(interval.upper,gate.lower)]));
assert.equal(compare(gates.smallGrowth27.lower,{rational:'1'}),1);
const originalFinite=background.normalizedFiniteBlock.finite.map((record,i)=>{
  assert.equal(record.id,block.finite[i].bound);
  assert.equal(record.order,block.finite[i].order);
  return record;
});
const weightedBlock=(limit,twoMultiplier)=>{
  const rows=originalFinite.slice(0,limit);
  return rows.reduce((sum,{order,interval})=>N.add(sum,N.mul(q(twoMultiplier),
    N.mul(upperOnly(interval),N.exp(N.mul(q(String(2*order)),hLogTau))))),q('0'));
};
const chartUpper=upperOnly(chart.enclosure);
const leadingFU={F:upperOnly(leading.directedFTCIntervals.F),U:upperOnly(leading.directedFTCIntervals.U)};
const one=q('1');
function slabResults(which,maxN,dyadicFactor){
  const localBlock=weightedBlock(maxN,dyadicFactor);
  const naiveBlock=originalFinite.slice(0,maxN).reduce((sum,{interval})=>N.add(sum,upperOnly(interval)),q('0'));
  const leafRows=rowData.map(({id,lead,err,F,U,positiveCount})=>{
    const leadBound=N.mul(chartUpper,N.add(N.mul(q(String(F)),leadingFU.F),N.mul(q(String(U)),leadingFU.U)));
    const expansionBound=N.mul(q(String(4*positiveCount)),chartUpper);
    return {id,lead,err,F,U,positiveCount,leadBound,weightedPositive:N.mul(expansionBound,localBlock),
      unweightedPositive:N.mul(expansionBound,naiveBlock)};
  });
  const maxOf=values=>closed(N.max([one,...values]));
  const leadingMax=maxOf(leafRows.map(r=>r.leadBound));
  const localMax=maxOf(leafRows.map(r=>N.add(r.leadBound,r.weightedPositive)));
  const naiveMax=maxOf(leafRows.map(r=>N.add(r.leadBound,r.unweightedPositive)));
  return {
    which,maxN,dyadicFactor,weightedBlock:closed(localBlock),unweightedBlock:closed(naiveBlock),
    leadingMax,localSlowC8:localMax,localUnweightedSlowC8:naiveMax,
    leadingComparisons:evaluateToCaps(leadingMax),
    localizedComparisons:evaluateToCaps(localMax),
    unweightedComparisons:evaluateToCaps(naiveMax),
    maximumLeadingProducts:Math.max(...leafRows.map(r=>r.F+r.U)),
    maximumPositiveTerms:Math.max(...leafRows.map(r=>r.positiveCount)),

  };
}
const split=[slabResults('N3 upper reference physical q>=tau0',2,'2'),slabResults('N4 lower reference physical q<=tau0',3,'1'),slabResults('common physical slab with three active terms',3,'2')];
const frozenUpperCandidate=slabResults('Frozen candidate tau0/4<qrep<4*tau0',4,'2');
assert.equal(frozenUpperCandidate.localizedComparisons.normalizedStageOne,1);
assert.deepEqual(args(frontier.roots.K,'maximum',14),wholeK.operands.map(row=>row.id));
assert.equal(wholeK.operands.find(row=>row.kind==='background C8').id,14220496);
assert.deepEqual(args(18310066,'integer_power',2),[18310065,8]);
assert.deepEqual(args(18310065,'exp',1),[18310064]);
assert.deepEqual(args(18310064,'multiply',2),[lmax,18310063]);
assert.deepEqual(args(18310063,'multiply',2),[261,17727099]);
assert.deepEqual(args(261,'rational',2),['3','1']);
assert.deepEqual(args(17727099,'integer_power',2),[bnorm,256]);
assert.deepEqual(args(14220488,'rational',2),['1','8589934592']);
assert.deepEqual(args(lmax,'multiply',2),[14220487,14220488]);
assert.deepEqual(args(14220487,'add',2),[474,3622]);
assert.deepEqual(args(474,'rational',2),['4','1']);
assert.deepEqual(args(3622,'sqrt_positive',1),[24]);
assert.ok(layout.includes("Bnorm=G.add(q(1n<<128n),G.pow(Renv,4096),...['FGErrorConstant','bTotalConstant','FTotalConstant','GTotalConstant'].map(name=>background.roots[name]),background.chart.operatorA,background.chart.operatorB)"));
// Each addend of the original Bnorm recipe is nonnegative. Bnorm>=2^128.
// Lmax>2^-31, hence 3 Bnorm^256 Lmax>Bnorm and W=exp(3 Bnorm^256 Lmax)>Bnorm.
// We can bound all untouched children of backgroundC8 using W^8, 40320 and 2.
const untouchedK=wholeK.operands.filter(row=>row.id!==14220496);
const untouchedComparisons=untouchedK.map(row=>({id:row.id,kind:row.kind,comparisons:evaluateToCaps(row.interval)}));
const smallOtherBackground=[q('2'),q('40320')];
const budgetAux=N.max([...smallOtherBackground,...untouchedK.map(row=>upperOnly(row.interval))]);
const localBudget=split.map(row=>{
  const localBackground=closed(N.max([...smallOtherBackground,
   upperOnly(untouchedK.find(x=>x.id===18310066).interval),upperOnly(row.localSlowC8)]));
  const localMax=closed(N.max([budgetAux,upperOnly(row.localSlowC8)]));
  const unweightedLocalMax=closed(N.max([budgetAux,upperOnly(row.localUnweightedSlowC8)]));
  const comparisons=evaluateToCaps(localMax);
  const unweightedComparisons=evaluateToCaps(unweightedLocalMax);
  assert.equal(comparisons.smallGrowth128,-1);
  assert.equal(unweightedComparisons.smallGrowth128,-1);
  return {which:row.which,localBackground,localMax,unweightedLocalMax,comparisons,unweightedComparisons};
});
const comparisonRows=split.map(r=>({which:r.which,leading:r.leadingComparisons,weighted:r.localizedComparisons,unweighted:r.unweightedComparisons}));
console.log(JSON.stringify({comparisonRows, localBudget:localBudget.map(row=>({which:row.which,comparisons:row.comparisons,unweighted:row.unweightedComparisons}))}));
const record={schema:'MathScope.N7.ActiveLiveSlabC8FromOriginalOperandSums/1',
 scope:'Directed applications to fixed live slab C8 for original F and G; original global B_m, K, all selectors, frozen non-leading terms and corrected amplitudes remain distinct.',
 physicalPremise:'Use original common admissible selectors, positive q with qBig/64<=q<qBig/16 and the authenticated same-family ordinary slow chart s in [1/2,2], X in [Xa/2,2Xb], |eta|<=1, with one-sided physical T=0 if needed.',
 cutoffProof:'b4*qBig=64 and original monotone b_n imply all n>=4 jets zero on physical slab. b3*qBig=32 implies n>=3 zero on q>=tau0. At every equality cutoff is flat, so jets through 8 still vanish.',
 gainProof:'Every n profile jet through8 is bounded by its original unscaled B_n,m times q^(2nh), including Euler derivatives from the exact source weights. For q<=2*tau0 and n<=3, (2*tau0)^(2nh)<=2*exp(2n*hLogTau); for q<=tau0 use exact factor1.',
 originalScope:'Physical s,Q, frozen labels are fixed during their corresponding operations. The possible fourth at a frozen N4 cell is not zero by the live slab inequality. The original moving-frame F0,FR0,GR0 are leading-only at the frozen point.',
 meansRemainOpen:true, originalGlobalKRemainsUnchanged:true, actualFinalJets:0, release:'HOLD',
 hashes:Object.fromEntries(Object.keys(paths).map(key=>[key,hashes[key]])),
 roots:{norm:frontier.roots.K, background:frontier.roots.backgroundC8,Cslow:slow.Cslow, block:block.coefficient,bnorm,factorial,lmax,two,
 finite:block.finite,removedGlobalTail:block.tailConstant},
 auditedLeadLeaves:ordinaryLeadingLeaves.size,auditedChartLeaves:ordinaryChartLeaves.size,
 literalRows:rowData.map(({id,lead,err,F,U,positiveCount})=>({id,lead,err,F,U,positiveCount})),
 gates, originalBackgroundComparisons:evaluateToCaps(background.background.interval), originalGlobalKComparisons:evaluateToCaps(wholeK.enclosure),
 split, frozenUpperCandidate, localBudget, untouchedComparisons, arithmetic:N.report(),
 frozenCandidateScope:'The scalar representative bounds give tau0/4<qRep<4*tau0 on this cover, so b5*qRep>1 under original doubling. This separate universal degree-eight n4 upper still exceeds the compared gates after retaining qRep^(8h). It supplies no lower bound on the actual frozen field.',
 otherBackgroundProof:'The literal nonnegative Bnorm sum gives Bnorm>=2^128. Lmax>2^-31, so the source W=exp(3*Bnorm^256*Lmax)>Bnorm and W^8>=W. The untouched Lmax<1 and rational leaves 40320,2 fit the same interval maximum.',
};
await writeFile(output,JSON.stringify(record,null,2)+String.fromCharCode(10),{flag:'wx'});
