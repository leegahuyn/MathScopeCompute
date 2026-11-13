import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const args=process.argv.slice(2);
assert.equal(args.length,4,'GOAL_NEXT PINNED_RUNTIME HISTORICAL_INPUT OUTPUT');
const [goal,runtime,historicalFile,out]=args;
const pin={
  native:'19ac2bfde61e1a9808a2a9f4aa324a2d634fed376fcc2084d886500a164255d3',
  axis:'4422bdae491795b5582ff4f1be09d2c58734fcbfc26749f2921c535050842638',
  force:'fbe6238fad746e69e18c640b937c5c3ff77dbae0c481c3fe52448b763ae698a7',
  historical:'03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0',
  thresholds:'af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf',
  fixed:'9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c',
  background:'4c056bb0ed357b7741b9a1e0ef02d82edfda30cf0cd1e10abc321b1d4cf0b966',
};
const sourcePins={
  'actual-residual-order-induction-source.mjs':'30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
  'actual-residual-order-induction-kernels.mjs':'97f8bbc5927ee2b2ac5b41851ba5bc2c800fd4cad6b85c7a1039095c066f7fef',
  'actual-leading-all-order-jets.mjs':'d3af156118671a3e582c19a82064aab884a09d6ce81f51a6b2d64d35444cd29d',
  'actual-common-selection-arithmetic-trace.mjs':'195a465e4570c1da341db4d56d71beb1773d5040bd95b296c17c7dfd2a395edc',
};
const {load,sourceArithmetic}=await import(pathToFileURL(resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs')));
const [native,axis,force,historical,thresholds,fixed,background]=await Promise.all([
  load(resolve(goal,'whole-k-inner-axis/inner-axis-native.json'),pin.native),
  load(resolve(goal,'whole-k-inner-axis/inner-axis-jet-bounds.json'),pin.axis),
  load(resolve(goal,'whole-k-core-force/whole-inner-force-energy.json'),pin.force),
  load(historicalFile,pin.historical),
  load(resolve(goal,'whole-k-selector-scales/historical-scale-arithmetic-result.json'),pin.thresholds),
  load(resolve(goal,'whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json'),pin.fixed),
  load(resolve(goal,'whole-k-annular-wrz-norm/numerical/background-c8-complete.json'),pin.background),
]);
const radialPin='0d67104a020f0e7b57cdbeabc4bade9d5401cbe795cdde9a7b0e60ce90cb8c5d';
const amplitudePin='647a71162df52b9bfb489479c14dbf6b916086d7f64a36c5c61cee9820a6c7cf';
const [radial,amplitude]=await Promise.all([
  load(resolve(goal,'final67/moving-heat-energy/radial-force.json'),radialPin),
  load(resolve(goal,'whole-k-exterior/amplitude/whole-k-exterior-amplitude.json'),amplitudePin),
]);
assert.equal(radial.originalAmplitudeSHA256,amplitudePin);
assert.equal(radial.geometricHeatExteriorFullForceL1TimeL2SpaceSquaredOverS_R[0],'2^-20');
assert.equal(amplitude.bounds.rawAmplitudeFixedDyadicLower,'2^4920000');
assert.equal(force.inputSHA256.intervals,pin.axis);
assert.equal(force.originalOperators.verifiedRestrictedIdentities,16);
assert.equal(force.scope.sameOriginalCommonBField,true);
assert.equal(force.geometry.sliceNormalizedMeasureUpper,'(704/7)*tau0/Lambda');
assert.equal(force.geometry.slabNormalizedMeasureUpper,'(352/7)*tau0/Lambda');
assert.equal(force.geometry.factors.R,'4*sqrt(tau0/Lambda)');

const sha=(bytes)=>createHash('sha256').update(bytes).digest('hex');
const fromSource=async name=>{
  const filename=resolve(runtime,'research-ide/mathscope-m2/navier',name);
  assert.equal(sha(await readFile(filename)),sourcePins[name],name);
  return import(pathToFileURL(filename));
};
const [{prepareActualOrderInduction,assertActualOrderInduction},{sourceNormalizedCutoffWeights},
  {traceExactArithmeticDependencies},{actualLeadingAllOrderJets}]=await Promise.all([
  fromSource('actual-residual-order-induction-source.mjs'),fromSource('actual-residual-order-induction-kernels.mjs'),
  fromSource('actual-common-selection-arithmetic-trace.mjs'),fromSource('actual-leading-all-order-jets.mjs'),
]);
const prepared=prepareActualOrderInduction({order:3,maxNodes:2_200_000});
assert(assertActualOrderInduction(prepared));
const {G,records}=prepared;
assert.equal(G.nodes.length,native.originalNodeCount);
assert.equal(sha(JSON.stringify(G.nodes)),native.originalNodes);
for(const row of native.rows) {
  const a=records[row.n].norm.auxiliary;
  assert.equal(a.solutionNorm,row.analytic.solutionNorm);
  assert.equal(a.strip,row.analytic.strip);
}
const leading=actualLeadingAllOrderJets({radialOrder:3,etaOrder:3});
assert(leading.pass);
assert.equal(leading.totalTaylorOrder,6);
assert.equal(axis.leading.M0StrictCoreFormula,'X*(Ustar+Lambda^-1*actual_natural_average(Lambda*X,eta))');
const leadingRoots=leading.normProgram.roots;
assert(leadingRoots.U0CorePhysicalTotal&&leadingRoots.F0CorePhysicalTotal);
const scalarRoots={};
const fct=(k)=>[1,1,2,6][k];
const q=(a,b=1)=>G.q(a,b);
for(const row of native.rows){
  const a=records[row.n].norm.auxiliary;
  scalarRoots[`n${row.n}`]=a.solutionNorm;
  scalarRoots[`strip${row.n}`]=a.strip;
  const weights=sourceNormalizedCutoffWeights({order:row.n,derivativeOrder:3});
  const h=G.parameter('h');
  const W=weights.weights.map(w=>G.add(...w.polynomialInSourceH.map((x,k)=>G.mul(q(BigInt(x)),G.pow(h,k)))));
  for(const e of [0,1,2,3])for(let r=0;r+e<=3;r++)for(let t=0;t+r+e<=3;t++){
    const item=row.cauchy.find(j=>j.e===e&&j.r===r&&j.t===t);
    assert.equal(native.sourceNodeRecords[String(item.W)].op,G.nodes[W[e]].op);
    const bound=G.mul(W[e],q(fct(r)*fct(t)),G.pow(G.div(q(2),a.strip),t),a.solutionNorm);
    scalarRoots[`bound${item.bound}`]=bound;
  }
  W.forEach((root,e)=>scalarRoots[`W${row.n}_${e}`]=root);
}
const traces={core:traceExactArithmeticDependencies(G,scalarRoots)};
assert.equal(traces.core.nonArithmeticBoundaries.length,0);
const {N,evaluateClosedArithmeticDefinitions,tracedArithmeticEvaluator}=await sourceArithmetic(runtime,thresholds.sourcePins,'coarse-upper');
const actualParameters=evaluateClosedArithmeticDefinitions(historical.definitions,N,{names:[...new Set([
  ...traces.core.sourceParameters,'h','Lambda','K','CSelected','sigmaStar','C12EnvelopeR',
])]}).values;
const arithmetic=tracedArithmeticEvaluator(traces.core,N,{parameters:actualParameters});
const n=(x)=>N.point(String(x));
const upper=(v)=>N.fromClosed({lower:{rational:'0'},upper:N.toClosed(v).upper});
const A=[1,1], D=[1,-1], onePower=[2,0], halfPower=[1,0];
const plusPower=([a,b],[c,d])=>[a+c,b+d];
const scalePower=([a,b],s)=>[a*s,b*s];
const minusPower=(x,y)=>plusPower(x,scalePower(y,-1));
const h=actualParameters.get('h');
const ell=N.fromClosed(fixed.hostedOriginal[617432]);
const tlog=N.neg(N.mul(N.add(ell,n(15)),N.log(n(2))));
const hLog=N.mul(tlog,h);
// Represent alpha/2 + beta*h exactly. Do not add an astronomical-power
// exponent to h in fixed precision before multiplying by log(tau0).
const tpow=([alpha,beta])=>N.exp(N.add(N.mul(n(`${alpha}/2`),tlog),N.mul(n(beta),hLog)));
const one=N.one(),half=n('1/2'),zero=N.zero();
const sum=(items)=>items.reduce((a,b)=>N.add(a,b),zero);
const product=(items)=>items.reduce((a,b)=>N.mul(a,b),one);
const pow=(x,k)=>N.pow(x,k);
const lp=actualParameters.get('Lambda');
const t0=tpow(onePower);
const pjet=new Map();
const chooseBig=(x,y)=>N.compareEndpoints(x,y);
// In this original strict core, use only the actual natural leading
// profiles. The global/B26 majorants include terms from outside this chart.
const leadTrace=traceExactArithmeticDependencies({nodes:leading.normProgram.nodes},
  {F:leadingRoots.F0CorePhysicalTotal,U:leadingRoots.U0CorePhysicalTotal});
assert.equal(leadTrace.nonArithmeticBoundaries.length,0);
const lp2=evaluateClosedArithmeticDefinitions(historical.definitions,N,{names:leadTrace.sourceParameters}).values;
const leadEval=tracedArithmeticEvaluator(leadTrace,N,{parameters:lp2});
const ordinary=n(720);
const lF=N.mul(ordinary,leadEval.value(leadTrace.roots.F));
const lU=N.mul(ordinary,leadEval.value(leadTrace.roots.U));
const Xb=N.fromClosed(background.Xb);
// The original exterior-amplitude receipt gives B_h=2^A cInfinity>1.
// Drop this positive factor in S_R to obtain a source-relative lower bound.
const logXb=N.log(Xb);
const fourA=N.add(n(2),N.mul(n(4),h));
const lowerLogSROverTau=N.sub(N.sub(N.mul(n(-2),hLog),N.mul(fourA,logXb)),N.log(fourA));
const quarterForceLowerOverTau=N.mul(n(`1/${2**22}`),N.exp(lowerLogSROverTau));
const quarterForceLower=N.mul(t0,quarterForceLowerOverTau);
for(const row of native.rows){
  for(const item of row.cauchy){
    // Original cutoff Euler weights can be kept exactly by tracing their
    // positive polynomial roots; the archived argument ids are stable.
    const key=`${row.n}:${item.e}:${item.r}:${item.t}`;
    pjet.set(item.bound,{key,value:arithmetic.value(scalarRoots[`bound${item.bound}`])});
  }
}

const sourceCaps={L_U:lU,L_F:lF,K:actualParameters.get('K')};
const required=new Set();
const programs=force.originalOperators.componentUpperPrograms;
for(const rows of [...programs.velocity,...programs.gradient.flat(),...programs.directForce])
  for(const term of rows) for(const factor of term.factors) if(factor.startsWith('I_'))required.add(factor.slice(2));
assert.equal(required.size,22);
// These positive factors use the independently authenticated core source.
// Strip out large physical powers before doing any directed arithmetic.
const abstract=new Map();
for(const name of required){
  const item=axis.scalarIntervals[name];
  const [field,orders]=name.split('@');
  const [i,j,k]=orders.split(',').map(Number);
  const leadingTerms=Object.entries(item.leadingTerms).map(([id,c])=>{
    const val=id==='L_F^2'?pow(lF,2):sourceCaps[id];
    assert(val,`unbound original leading ${id}`);
    return N.mul(n(c),val);
  });
  const positiveTerms=Object.entries(item.positiveTerms).map(([id,c])=>{
    const match=/^H_(\d+)\*tau0\^\((\d+)\*h\)$/.exec(id);
    assert(match,id);
    const item=pjet.get(Number(match[1]));
    assert(item,`missing positive core factor ${id}`);
    return product([n(c),item.value,tpow([0,Number(match[2])])]);
  });
  const base=field==='a'?A:field==='b'?plusPower(A,halfPower):scalePower(A,2);
  const tExponent=plusPower(base,plusPower([2*(i+k),0],scalePower(D,j)));
  abstract.set(name,{dimensionless:sum([...leadingTerms,...positiveTerms]),tauExponent:tExponent});
}

const constants={
  R:[N.div(n(4),N.sqrt(lp)),halfPower], C_tau:[n(5),[-2,0]], C_z:[n(20),scalePower(D,-1)],
  C_zz:[n(692),scalePower(D,-2)], C_zzz:[n(69472),scalePower(D,-3)],
  C_z_tau:[n(100),scalePower(plusPower(D,onePower),-1)],
};
function termBound(term, weight){
  let tExponent=weight;
  const factors=[n(term.coefficient)];
  for(const key of term.factors){
    if(key.startsWith('I_')){
      const item=abstract.get(key.slice(2));
      const power=axis.scalarIntervals[key.slice(2)].LambdaPower;
      factors.push(item.dimensionless,pow(lp,Number(power)));
      tExponent=minusPower(tExponent,item.tauExponent);
    }else{
      assert(constants[key],key);
      const [mantissa,exponent]=constants[key];
      factors.push(mantissa);
      tExponent=plusPower(tExponent,exponent);
    }
  }
  return N.mul(product(factors),tpow(tExponent));
}
const evalRows=(rows,w)=>rows.map(terms=>upper(sum(terms.map(term=>termBound(term,w)))));
const squareSum=(rows)=>sum(rows.map(x=>pow(x,2)));
const U=evalRows(programs.velocity,A);
const dxy=evalRows(programs.gradient.flatMap(row=>row.slice(0,2)),plusPower(A,halfPower));
const dz=evalRows(programs.gradient.map(row=>row[2]),plusPower(A,halfPower));
const F=evalRows(programs.directForce,plusPower(A,onePower));
const V=N.inverse(lp);
const valuesOverTau={energy:N.mul(n('352/7'),N.mul(V,squareSum(U))),
  transverseDissipation:N.mul(n('352/7'),N.mul(V,squareSum(dxy))),
  axialDissipation:N.mul(n('352/7'),N.mul(V,squareSum(dz))),
  forceSquare:N.mul(n('352/7'),N.mul(V,squareSum(F)))};
const values=Object.fromEntries(Object.entries(valuesOverTau).map(([k,v])=>[k,N.mul(t0,v)]));
const centerLeftOverTau=N.mul(n(2),sum([valuesOverTau.energy,valuesOverTau.transverseDissipation,valuesOverTau.axialDissipation]));
const coreBudgetComparison=chooseBig(N.toClosed(centerLeftOverTau).upper,N.toClosed(quarterForceLowerOverTau).lower);
assert.equal(coreBudgetComparison,-1,'whole inner LHS must fit below one quarter of the exterior force lower bound');
assert(4n * 2n**22n < 2n**8192n,'the certified heat exterior LHS consumes less than another quarter');
const report={schema:'MathScope.N7.DirectedOriginalWholeInnerIntegrals/2',pins:{...pin,radial:radialPin,amplitude:amplitudePin},
  sourceModuleSHA256:sourcePins, boundScalarInputCount:required.size,
  sourceGraphSHA256:native.originalNodes,originalNativeCoreRows:native.rows.map(r=>r.analytic),
  sourceParameterValues:'original h, Lambda, CSelected, K, ellMinimum',
  leadingActualCore:{U:leadingRoots.U0CorePhysicalTotal,F:leadingRoots.F0CorePhysicalTotal,ordinaryFactor:720},
  coreBudgetComparison:{centerLHSUpperBelowQuarterOfExteriorRHS:coreBudgetComparison===-1,
    exactDirectedComparison:coreBudgetComparison,
    exteriorRHSLower:'2^-20*S_R using the original positive radial-force receipt',
    quarterOfExteriorRHSLower:N.toClosed(quarterForceLower).lower,
    comparedAfterDividingBothByTau0:true,
    centerLHSUpperDividedByTau0:N.toClosed(centerLeftOverTau).upper,
    quarterExteriorRHSLowerDividedByTau0:N.toClosed(quarterForceLowerOverTau).lower,
    annularSufficientRemaining:'2(E_annular+D_annular) <= 2^-21*S_R; the center and exterior together consume less than half of the verified 2^-20*S_R RHS lower'},
  normArithmetic:{positiveOrder:arithmetic.report(),leading:leadEval.report()},
  geometry:'whole original inner X<=Xa, original whole-K slab',
  intervals:Object.fromEntries(Object.entries(values).map(([key,value])=>[key,{lower:{rational:'0'},upper:N.toClosed(value).upper}])),
  intervalUpperDividedByTau0:Object.fromEntries(Object.entries(valuesOverTau).map(([key,value])=>[key,N.toClosed(value).upper])),
  exactAffineTauExponents:'[alpha,beta] means alpha/2+beta*h; original cutoff/radial/field monomials were combined symbolically before log(tau0) multiplication',
  scope:{N706:'OPEN',N805:'OPEN',finalJets:0,release:'HOLD'}};
await writeFile(out,JSON.stringify(report,null,2)+'\n');
console.log('PASS original center normalized energy, dissipation and force upper endpoints',required.size,'scalar factors');
console.log('center-to-exterior comparison',coreBudgetComparison);
