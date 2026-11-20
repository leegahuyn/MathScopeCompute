/** Directed comparisons for the unchanged original finite correction scales. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [goal,runtime,historicalPath,familyPath,firstK1Path,out]=process.argv.slice(2);
assert(out);
const pins={
  historical:'03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0',
  family:'b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78',
  firstK1:'8d03cf3e9acbafed674b06c80685d198a4da07cffdd85a0f9b8647db6a4bcfb3',
  firstScale:'0f2ef1dff821d7d936a9c254a5e846f6557445e2d3ccf97f3201915a6a949298',
  arithmetic:'4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47',
  fixed:'9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c',
  thresholds:'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf',
};
const load=async(key,path)=>{
  const buf=await readFile(path);
  assert.equal(createHash('sha256').update(buf).digest('hex'),pins[key],key);
  return buf;
};
const json=async(key,path)=>JSON.parse(await load(key,path));
const arithmetic=resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs');
const [historical,family,k1,firstScale,fixed,thresholds]=await Promise.all([
  json('historical',historicalPath),json('family',familyPath),json('firstK1',firstK1Path),
  json('firstScale',resolve(goal,'final67/first-scale-selector.json')),
  json('fixed',resolve(goal,'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json')),
  json('thresholds',resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json')),
  load('arithmetic',arithmetic),
]);
assert.equal(firstScale.actualC_hatEvaluated,false);
assert(firstScale.m0And1.every(row=>row.C_hatNumeric===null));
assert(k1.energy.scope.includes('first stage, not the later stages'));
assert.equal(k1.firstCorrectionWhole,'CONDITIONAL');
const ns=new Map(family.nodes.map(row=>[row.id,row]));
const fixedNode=ns.get(family.fixed_source);
assert.equal(fixedNode.data.qbig,'2^(-(ellMinimum+10))');
const cutoffRows=[];
for (const [i,id] of family.concrete_window_scale_nodes.entries()) {
  const j=i+1;
  const node=ns.get(id);
  assert.equal(node.operation,'ActualShrinkingScale');
  assert.equal(node.data.j,j);
  assert.equal(node.data.gamma,`h*${j}/20`);
  assert.equal(node.data.L,'max(1,1+L_previous,1+log(1/qbig),max_m(2*P_hat/gamma)^2,max_m2*(C_hat+j)/gamma)');
  assert.equal(node.data.original_cutoff,'chi=1 on(-infinity,1/2],chi=0 on[1,infinity)');
  assert.equal(node.data.a,'exp(L)');
  assert.deepEqual(node.inputs,[family.fixed_source,...(i?[family.concrete_window_scale_nodes[i-1]]:[]),...node.data.norm_inputs]);
  const normRows=node.data.norm_inputs.map((c,m)=>{
    const norm=ns.get(c);
    assert.equal(norm.operation,'ActualCutoffCurlBound');
    assert.equal(norm.data.m,m);
    assert.equal(norm.data.j,j);
    assert.equal(norm.data.C_hat,'1+ceil(S_hat_(j,m,P_hat_(j,m)))');
    assert.equal(norm.data.S_hat,'S_hat_(j,m,p)=sup_(a>=1,(x,t) in D) q^(ellPrime_m-g_j)*|T_a Z_j|_m/(1+|log q|)^p');
    const uncut=ns.get(norm.inputs[0]);
    assert.equal(uncut.operation,'ExactSourceFunctionalBound');
    const potential=ns.get(uncut.inputs[0]);
    assert.equal(potential.operation,'ActualCorrectionPotentials');
    assert.equal(potential.data.j,j);
    return {m,cutoff:c,uncut:uncut.id,potential:potential.id,unboundSupremum:true};
  });
  assert.equal(normRows.length,j+1);
  cutoffRows.push({j,selector:id,normRows});
}

const {sourceArithmetic}=await import(pathToFileURL(arithmetic).href);
const {N,evaluateClosedArithmeticDefinitions}=await sourceArithmetic(runtime,thresholds.sourcePins,'coarse-upper');
const q=x=>N.point(String(x));
const h=evaluateClosedArithmeticDefinitions(historical.definitions,N,{names:['h']}).values.get('h');
const ell=N.fromClosed(fixed.hostedOriginal[617432]);
const B=N.mul(N.add(ell,q(10)),N.log(q(2)));
const hB=N.mul(h,B);
const h2B=N.mul(h,hB);
const cmp=(a,b)=>N.compareEndpoints(N.toClosed(a).lower,{rational:String(b)});
assert.equal(cmp(hB,1000000),1);
assert.equal(cmp(h2B,1000000),1);

// All scalar cutoff threshold comparisons are exact after canceling B.
assert(11n**4n<64n*4n**4n);
assert(5n**5n>64n*2n**5n);
assert(11n**2n<8n*4n**2n);
assert(17n*11n**4n<1024n*4n**4n);
assert.equal(cmp(N.exp(q(1)),'5/2'),1);
assert.equal(N.compareEndpoints(N.toClosed(N.exp(q(1))).upper,{rational:'11/4'}),-1);

const thresholdRows=[2,3,4].map(j=>({j,cutoffIsZeroOnFullSlabIf:'L_j >= B+log(64)',
  predecessorBranches:Array.from({length:j},(_,k)=>{
    const i=k+1;
    return {i,precedenceOffset:j-i,selector:cutoffRows[k].selector,
      cHatLowerNeeded:`(${i}*h/40)*(B+log(64)-${j-i})-${i}`,
      pHatLowerSufficient:`(${i}*h/40)*sqrt(B+log(64)-${j-i})`,
      actualKnownNumericLower:false};
  })}));
const result={schema:'MathScope.C109.CanonicalCorrectionScaleFrontier/1',
  status:'VERIFIED_ORIGINAL_SELECTOR_BRANCH_ARITHMETIC_ACTUAL_CUTOFF_VALUES_OPEN',pins,
  originalDomain:{slab:'qBig/64 <= q < qBig/16',tau0:'qBig/32',selectorSupremum:'a>=1 and the full original D'},
  exactSelectorBranches:cutoffRows,thresholdRows,
  fixedScaleChecks:{hBStrictLower:1000000,hSquaredBStrictLower:1000000,
    hB:N.toClosed(hB),h2B:N.toClosed(h2B),arithmetic:N.report()},
  baselineCompatibility:{premise:'P_hat=0 and 1<=C_hat<=2 for the first four canonical stages; these are compatibility controls, not actual supplied values.',
    formula:'hB>120 makes the C branch smaller than B, so the unchanged recurrence returns L_j=B+j for j<=4.',
    stage2FullScalarPlateau:'e^2 < 8, so a_2 q < 1/2 when q<qBig/16 under the baseline premises.',
    lowSlabPoint:{qOverQBig:'17/1024',qOverTau0:'17/32',eta:'0',rho:'17/32'},
    stages2Through4CanHavePositiveCutoff:'(17/1024)*(11/4)^4 <1',
    unconditionalZeroStartsAt5:'e^5>64; exact original recurrence forces a_j>=e^j/qBig'},
  scope:'The C108 bound is a conditional first-stage energy upper on K. It supplies no actual lower for the full-D canonical cutoff-curl supremum of any stage. The candidate scalar cutoff controls establish insufficiency of the currently authenticated inequalities, not nonzero values of the actual later corrections.',
  laterStagesIdenticallyZeroOnK:'OPEN',N706:'OPEN',N805:'OPEN',finalJets:0,release:'HOLD'};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log('PASS canonical selectors j=1..5, simultaneous hB and h^2 B lower; no actual j=2..4 cutoff lower supplied');
