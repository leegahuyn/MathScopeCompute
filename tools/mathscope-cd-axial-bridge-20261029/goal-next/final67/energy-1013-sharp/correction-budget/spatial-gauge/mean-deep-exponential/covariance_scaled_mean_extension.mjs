// Runs in the independently pinned old-namespace arithmetic context.
const historicalPin='03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0';
const valuationPin='240a21bc2a0886b4f21ead841a5baf949bf68bd6f71cf05fbbefb474bfab6ce8';
const [historical,valuation]=await Promise.all([
  load(scaledMeanInputs.historicalPath,historicalPin),
  load(resolve(goal,'primary-forced-weights/weighted-stage-zero-valuation.json'),valuationPin),
]);
assert.equal(valuation.source.oldGraph,sourceSHA256);
assert.equal(valuation.source.meanPositiveGraph,old.graphSHA256);
const actualParameters=(await sourceArithmetic(tree,thresholds.sourcePins,'coarse-upper'))
  .evaluateClosedArithmeticDefinitions(historical.definitions,N,{names:['h']}).values;
const h=actualParameters.get('h');
const ell=N.fromClosed(fixed.hostedOriginal[617432]);
const logTau=N.neg(N.mul(N.add(ell,point(15)),N.log(point(2))));
const hLogTau=N.mul(h,logTau);
const epsilonUpper=N.exp(N.add(hLogTau,N.mul(h,N.log(point(4)))));
assert.equal(N.compareEndpoints(N.toClosed(epsilonUpper).upper,{rational:'1'}),-1);
let BnormRefinement;
if(scaledMeanInputs.mode==='deep-sum-refined-Bnorm') {
  const producerPin='1cda839b66df1ecd0d9eed24abf338d84f90977c85f9428df3b5c11e9be414ce';
  const producerBytes=await (await import('node:fs/promises')).readFile(resolve(goal,
    'whole-k-annular-initial/numerical/evaluate_stage_zero_fixed.mjs'));
  assert.equal(sha(producerBytes),producerPin);
  assert.ok(producerBytes.toString().includes(
    "const BnormUpper = N.exp(N.div(N.log(N.mul(N.point('2'), B)), N.point('512')));"));
  const B=N.fromClosed(thresholds.thresholds['10']);
  const refinedUpper=N.toClosed(N.exp(N.div(N.log(N.mul(point(2),B)),point(512)))).upper;
  const previous=leaves['hosted-original'][300170];
  const comparison=N.compareEndpoints(refinedUpper,previous.upper);
  assert.equal(comparison,-1);
  BnormRefinement={producerPin,originalScalar:300170,threshold:'10',
    formula:'exp(log(2*B)/512)',B: N.toClosed(B),previous,
    refined:{lower:previous.lower,upper:refinedUpper},upperComparison:comparison};
  // Refine a local replay leaf only. The pinned JSON and prior 67-atom
  // replay are preserved and the new input enclosure is recorded below.
  leaves['hosted-original']={...leaves['hosted-original'],300170:BnormRefinement.refined};
}
const covarianceRoots=old.roots.covarianceByTransverseAndSlowOrder.flat();
assert.equal(covarianceRoots.length,42);
assert.equal(new Set(covarianceRoots).size,42);
const covarianceSet=new Set(covarianceRoots);
const modifiedCache=new Map(),modifiedRecords=new Set(),dependentRecords=new Map();
const sumValues=values=>values.reduce((a,b)=>N.add(a,b),N.zero());
function scaledBound(id) {
  if(modifiedCache.has(id))return modifiedCache.get(id);
  let value,dependent;
  if(covarianceSet.has(id)) {
    value=N.mul(point(2),N.mul(epsilonUpper,oldBound(id)));
    dependent=true;
  } else {
    const row=old.nodes[id],{op,args}=row;
    if(op==='authenticated_source_norm_root'||op==='rational') {
      value=oldBound(id);dependent=false;
    } else {
      const childIDs=op==='integer_power'?args.slice(0,1):args;
      const values=childIDs.map(scaledBound);
      dependent=childIDs.some(child=>dependentRecords.get(child));
      if(dependent)assert.ok(['add','multiply','maximum','integer_power'].includes(op),
        'No inverse, square root or exp may depend on substituted covariance roots: '+id);
      if(op==='add')value=sumValues(values);
      else if(op==='multiply')value=values.reduce((a,b)=>N.mul(a,b),N.one());
      else if(op==='maximum')value=N.max(values);
      else if(op==='integer_power') {
        assert.ok(Number.isSafeInteger(args[1])&&args[1]>=0);
        value=N.pow(values[0],args[1]);
      } else {
        assert.equal(args.length,1);
        const operation={inverse:'inverse',sqrt_positive:'sqrt',exp:'exp'}[op];
        assert.ok(operation,op);
        value=N[operation](values[0]);
      }
    }
  }
  modifiedCache.set(id,value);dependentRecords.set(id,dependent);modifiedRecords.add(id);
  return value;
}
const closed=value=>N.toClosed(value);
const alpha={value:'99999/100000',R:'99998/100000',Z:'99998/100000'};
const betaAlpha={value:'199999/100000',R:'199998/100000',Z:'199998/100000'};
const priorCoefficientPin='a063ec41e45055397ab3f3eea1df520a7806df690db2b80fe371a5aa8da31356';
const priorCoefficient=await load(resolve(goal,
  'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/weighted-velocity-coefficients.json'),
  priorCoefficientPin);
const oldCommonBound=(field,direction,root)=>{
  const previous=priorCoefficient.coefficients[field][direction];
  assert.equal(previous.root,root);
  const exponent=field==='beta'?betaAlpha[direction]:alpha[direction];
  const upper=N.fromClosed({lower:previous.closed.upper,upper:previous.closed.upper});
  return N.mul(upper,N.exp(N.mul(point(exponent),N.add(hLogTau,N.mul(h,N.log(point(4)))))));
};
const velocity=Object.fromEntries(Object.entries(expected).map(([field,rows])=>[
  field,Object.fromEntries(Object.entries(rows).map(([direction,root])=>{
    const betaFactor=field==='beta'?epsilonUpper:N.one();
    const value=N.mul(betaFactor,scaledBound(root));
    const previous=oldCommonBound(field,direction,root);
    const comparison=N.compareEndpoints(closed(value).upper,closed(previous).upper);
    assert.notEqual(comparison,null);
    return [direction,{root,interval:closed(value),previousCommonGainUpper:closed(previous).upper,
      upperComparison:comparison}];
  })),
]));
const cutoffIdentityPin='36f30a23afbfdb254e392a351d322f4dfd8a4656bd1c935d25cf65994b30b6c3';
const cutoff=await load(resolve(goal,
  'final67/energy-1013-sharp/correction-budget/spatial-gauge/actual-mean-cutoff/mean-cutoff-source-final.json'),
  cutoffIdentityPin);
assert.equal(cutoff.sourceSHA256,sourceSHA256);
assert.deepEqual(cutoff.cutoffConstants,{value:1,z:20,zz:692,radialDerivative:0});
const upperPoint=interval=>N.fromClosed({lower:interval.upper,upper:interval.upper});
const valueScale=N.exp(N.mul(N.add(point('1/2'),h),N.log(point(4))));
const derivativeScale=N.exp(N.mul(N.add(point(1),h),N.log(point(4))));
const Renv=N.fromClosed(fixed.hostedOriginal[216823]),Rinv=N.mul(point(2),Renv);
const normalized=Object.fromEntries(Object.entries(velocity).map(([name,row])=>[name,{
  value:N.mul(valueScale,upperPoint(row.value.interval)),
  R:N.mul(derivativeScale,upperPoint(row.R.interval)),
  Z:N.mul(derivativeScale,upperPoint(row.Z.interval)),
  connection:N.mul(N.mul(derivativeScale,Rinv),upperPoint(row.value.interval)),
}]));
const tauH=N.exp(hLogTau);
const psiValue=N.mul(N.mul(point('1/2'),Renv),
  N.mul(N.exp(N.mul(h,N.log(point(4)))),upperPoint(velocity.gamma.value.interval)));
const K0=N.mul(point(20),N.mul(tauH,psiValue));
const Kr=N.mul(point(30),N.mul(tauH,normalized.gamma.value));
const Ktheta=N.mul(point(10),N.mul(tauH,normalized.gamma.value));
const Kz=N.add(N.mul(point('173/5'),N.mul(tauH,K0)),
  N.mul(point(20),N.mul(tauH,normalized.beta.value)));
const localized=Object.entries(normalized).map(([name,row])=>({
  name,value:name==='beta'?N.add(row.value,K0):row.value,
  R:name==='beta'?N.add(row.R,Kr):row.R,
  Z:sumValues([row.Z,N.mul(point(20),N.mul(tauH,row.value)),name==='beta'?Kz:N.zero()]),
  connection:name==='gamma'?N.zero():(name==='beta'?N.add(row.connection,Ktheta):row.connection),
}));
const Xb=N.fromClosed(background.Xb);
const energy=N.mul(N.mul(point(32),Xb),N.add(
  sumValues(localized.map(row=>N.pow(row.value,2))),
  N.mul(point(2),sumValues(localized.flatMap(row=>[row.R,row.Z,row.connection].map(value=>N.pow(value,2)))))));
const fourA=N.add(point(2),N.mul(point(4),h));
const budget=N.mul(point('1/'+String(1n<<26n)),
  N.exp(N.sub(N.sub(N.mul(point(-2),hLogTau),N.mul(fourA,N.log(Xb))),N.log(fourA))));
const energyComparison=N.compareEndpoints(closed(energy).upper,closed(budget).lower);
assert.notEqual(energyComparison,null);
const previousEnergyPin='b4eb1971ae9cd515175bddbb1fd229b485be0c8c71f3cf14f0d03990ec7351e1';
const previousEnergy=await load(resolve(goal,
  'final67/energy-1013-sharp/correction-budget/spatial-gauge/actual-mean-cutoff/actual-mean-cutoff-final.json'),
  previousEnergyPin);
const energyUpperComparison=N.compareEndpoints(closed(energy).upper,
  previousEnergy.twiceEnergyAndDissipationUpperDividedByTau0);
assert.notEqual(energyUpperComparison,null);
const scaledResult={
  schema:'MathScope.N7.SameSourceCovarianceScaledMean/1',
  status:'DIRECTED_SOURCE_COVARIANCE_EPSILON_REPLAY_WITH_QUADRATIC_TERMS_RETAINED',
  sourceSHA256,nativeRegistrySHA256:registrySHA256,oldPositiveGraphSHA256:old.graphSHA256,
  inputPins:{evaluator:scaledMeanInputs.evaluatorPin,meanPath:meanPathPin,meanReadback:meanReadPin,
    historical:historicalPin,valuation:valuationPin,priorCoefficient:priorCoefficientPin,
    actualCutoffIdentities:cutoffIdentityPin,previousEnergy:previousEnergyPin},
  arithmeticMode:scaledMeanInputs.mode,
  ...(BnormRefinement?{BnormRefinement}:{}),
  epsilonReferenceUpper:closed(epsilonUpper),
  covarianceRoots,substitution:'Each actual reference covariance norm <=2 epsilon_ref times the corresponding original norm. a_fast is already retained numerically in that norm.',
  dependentOperationsAllowed:['add','multiply','maximum','nonnegative integer_power'],
  dependentRecords:[...dependentRecords].filter(([,value])=>value).length,
  arithmeticRecords:modifiedRecords.size,velocity,
  betaHandling:'The extra beta epsilon is applied at its typed value/derivative outputs. It is not substituted at shared psi-derivative DAG nodes. Omitting it inside quadratic fresh-target beta inputs remains conservative.',
  improvementCounts:Object.fromEntries([-1,0,1].map(value=>[String(value),
    Object.values(velocity).flatMap(row=>Object.values(row)).filter(row=>row.upperComparison===value).length])),
  actualMeanCutoffEnergy:{
    comparison:energyComparison,
    upperDividedByTau0:closed(energy).upper,budgetDividedByTau0:closed(budget).lower,
    previousUpperDividedByTau0:previousEnergy.twiceEnergyAndDissipationUpperDividedByTau0,
    upperComparisonToPrevious:energyUpperComparison,
    localized:localized.map(row=>({name:row.name,value:closed(row.value),
      radialDerivative:closed(row.R),axialDerivative:closed(row.Z),angularConnection:closed(row.connection)})),
    potentialValue:closed(psiValue),
    commutator:{value:closed(K0),radial:closed(Kr),axial:closed(Kz),angular:closed(Ktheta)},
    scope:'The actual initialized mean cutoff formula and radial-characteristic potential bound use the same source conditions as the pinned preceding mean-cutoff identity.'
  },
  assumptions:valuation.proofDependencies,
  strengthenedFiniteSlabReason:'Frozen-band epsilon is constant under slow and auxiliary derivatives. Both source curl pieces retain their amplitude factors, and every fixed-slab radial fast coefficient already occurs in the old positive program. Thus the actual covariance factor can be propagated by monotonicity through its linear and quadratic downstream formulas without an additional abstract fast-derivative epsilon loss.',
  scope:'Conditional fixed-slab replay on the same saved initialized source. This includes the initialized mean cutoff energy envelope with the pinned source curl, radial-characteristic potential bound, actual axial commutator and Cartesian connection terms. Source analytic envelopes and chart/zero-extension premises remain required. The budget comparison stays open and final-field corrections are separate.',
  release:'HOLD',arithmetic:N.report(),
};
await writeFile(diagnostic,JSON.stringify(scaledResult,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:scaledResult.status,improvementCounts:scaledResult.improvementCounts,
  dependentRecords:scaledResult.dependentRecords,energyComparison}));
