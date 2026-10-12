import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {ActualConvergentExpressions} from '../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from '../../../mathscope-m2/navier/actual-continuation-exact-identities.mjs';
import {exactLocalizationTau,flatExponentialJetPolynomial,prepareActualSourceLocalization,assertActualSourceLocalization,actualSourceLocalizationCertificate} from '../source-localization.mjs';

let sourcePromise,lastMemoryCheck=0;
function observe(extra={}){
  const status=readFileSync('/proc/self/status','utf8'),hostPID=Number(status.match(/^Pid:\s+(\d+)/m)?.[1]),
    vmSizeBytes=Number(status.match(/^VmSize:\s+(\d+) kB/m)?.[1])*1024,
    rssBytes=process.memoryUsage().rss,maxRSSBytes=process.resourceUsage().maxRSS*1024;
  process.stdout.write('# N7_LOCALIZATION '+JSON.stringify({...extra,at:new Date().toISOString(),hostPID,rssBytes,maxRSSBytes,vmSizeBytes})+'\n');
  if(rssBytes>13*1024**3/2||vmSizeBytes>7*1024**3)
    throw Object.assign(Error('The owned source process exceeded its memory gate.'),{code:'RESOURCE_LIMIT'});
}
function source(){return sourcePromise??=Promise.resolve().then(()=>{
  observe({stage:'n7-localization-source-start'});
  return prepareActualSourceLocalization({}, {onProgress:observe,checkCancelled:()=>{
    if(Date.now()-lastMemoryCheck>1000){lastMemoryCheck=Date.now();observe({stage:'n7-localization-memory-checkpoint'});}
  }});
});}

test('kernel: exact decimal tau survives underflow and forbids the terminal point',()=>{
  for(const text of ['1e-2','1e-4','1e-8','1e-12','1e-1000','1e-1000000','0.00125']){
    const row=exactLocalizationTau(text);assert.equal(row.exactSign,'POSITIVE');assert.equal(row.underflowReplacedByZero,false);
    assert.equal(row.internalTauReconstructedFromDisplayedTime,false);
  }
  assert.equal(exactLocalizationTau('1e-1000').displayTau,null);
  assert.equal(exactLocalizationTau('1e-1000').displayTime,1);
  assert.deepEqual([exactLocalizationTau('0.00125').coefficient,exactLocalizationTau('0.00125').powerOfTen],['125',-5]);
  for(const text of ['0','0e-1000'])assert.throws(()=>exactLocalizationTau(text),{code:'TERMINAL_TIME_FORBIDDEN'});
  for(const text of ['1','1.01','-0.1','NaN','1e-1000001'])assert.throws(()=>exactLocalizationTau(text));
});

test('kernel: the all-order flat exponential recurrence agrees with independent exact derivatives',()=>{
  assert.deepEqual(flatExponentialJetPolynomial(0).coefficients,['1']);
  assert.deepEqual(flatExponentialJetPolynomial(1).coefficients,['0','0','1']);
  assert.deepEqual(flatExponentialJetPolynomial(2).coefficients,['0','0','0','-2','1']);
  const G=new ActualConvergentExpressions(),u=G.fresh('positive_u'),v=G.inv(u),base=G.exp(G.neg(v));let derivative=base;
  for(let n=0;n<=6;n++){
    const p=flatExponentialJetPolynomial(n),polynomial=G.add(...p.coefficients.map((a,j)=>G.mul(G.q(BigInt(a)),G.pow(v,j)))),expected=G.mul(polynomial,base);
    assert.equal(sourceGraphRationalIdentity(G,G.sub(derivative,expected),{atomicNodes:[base]}).pass,true);
    assert.match(p.flatnessProof,/\(m\+1\)!\/v/);derivative=G.derivative(derivative,u);
  }
});

test('kernel: caller-supplied cutoff scales or certificates are not accepted',async()=>{
  for(const input of [{qStar:'1e-9'},{h:0},{inner:{}},{decimalTaus:[]}])
    await assert.rejects(prepareActualSourceLocalization(input),{code:'INVALID_INPUT'});
  await assert.rejects(prepareActualSourceLocalization({}, {inner:{}}),{code:'INVALID_SOURCE_CONSTRUCTION'});
});

test('source: construct the original full Cartesian cutoff on the same private common6 domain',async()=>{
  const result=await source();assert.equal(assertActualSourceLocalization(result),true);
  assert.ok(result.checks.every(row=>row.pass));assert.equal(result.scope.fullN6FinalPotentialsConstructed,false);
  assert.equal(result.scope.actualOriginalSourceCutoffConstructed,true);assert.equal(result.scope.originalCriterionComplete,false);
  assert.equal(result.constants.qStar,result.inner.localization.qStar);
  assert.equal(result.constants.tau0,result.inner.localization.tau0);
  assert.equal(result.constants.z0,result.inner.localization.z0);
  assert.equal(result.sourceBinding.common6FamilyGraph.sha256,'bff6b64458f52426e996a7b5a1dee44b4ae1f7fb226d54654889c79679e4e219');
});

test('source: exact primitive seams and Cartesian axis jets keep their flat extensions',async()=>{
  const r=await source(),G=r.G,{coordinate:s,body}=r.cutoff.primitive;
  let derivative=body;
  for(let order=0;order<=4;order++){
    for(const [point,expected] of [[G.zero,order===0?G.one:G.zero],[G.q(1,2),order===0?G.one:G.zero],[G.one,G.zero],[G.q(2),G.zero]])
      assert.equal(G.substitute(derivative,s,point),expected);
    derivative=G.derivative(derivative,s);
  }
  // This evaluates the smooth cutoff's extension at tau=0, not a velocity at
  // the forbidden terminal time. Its Cartesian jets are constant near here.
  const coordinates=Object.values(r.cutoff.coordinates),atOrigin=id=>G.simultaneousSubstitute(id,coordinates,coordinates.map(()=>G.zero));
  assert.equal(atOrigin(r.cutoff.body),G.one);
  for(const id of [...r.cutoff.gradient,...r.cutoff.hessian.flat(),r.cutoff.physicalTimeDerivative])assert.equal(atOrigin(id),G.zero);
  assert.equal(r.domain.unitPlateau.spatialNeighborhoodFixed,true);assert.equal(r.domain.compactK.independentOfTime,true);
});

test('source: the original fields are multiplied before curl and pressure uses the same cutoff',async()=>{
  const r=await source(),G=r.G,c=r.cutoff.body,grad=r.cutoff.gradient,permutations=[[1,2],[2,0],[0,1]];
  assert.equal(r.operator.sharedFieldInstance,r.fieldInputs.sharedInstance);
  for(const [i,[j,k]] of permutations.entries())assert.deepEqual(r.operator.velocity[i].terms,[
    {field:'A',component:k,derivative:j,coefficient:c},{field:'A',component:j,derivative:k,coefficient:G.neg(c)},
    {field:'A',component:k,derivative:null,coefficient:grad[j]},{field:'A',component:j,derivative:null,coefficient:G.neg(grad[k])},
    {field:'B_e_theta',component:i,derivative:null,coefficient:c}]);
  assert.deepEqual(r.operator.pressure,[{field:'p_loc',derivative:null,coefficient:c}]);
  assert.equal(r.fieldInputs.actualBackgroundSource.leadingM,r.inner.family.prepared.bootstrap.finalM);
  assert.equal(r.fieldInputs.actualBackgroundSource.finitePrefixCalledFullField,false);
  assert.equal(r.operator.sourceFieldValuesMaterialized,false);assert.equal(r.operator.externalSourceIdentificationRequired,true);
  assert.equal(r.operator.undefinedLocalFieldsMultipliedByZero,false);
  assert.match(r.operator.globalDefinition,/extend it identically by zero outside/);
});

test('source: all four prescribed tau examples and smaller decimals are exactly in the initial zero extension',async()=>{
  const r=await source();assert.deepEqual(r.decimalSamples.slice(0,4).map(row=>row.input),['1e-2','1e-4','1e-8','1e-12']);
  for(const row of r.decimalSamples){
    const K=-row.powerOfTen;assert.ok((1n<<8204n)>4n*BigInt(K));
    assert.equal(row.comparison.exactIntegerCheck.right,String(4*K));assert.equal(row.cutoffState,'EXACT_TEMPORAL_ZERO_EXTENSION');
    assert.deepEqual(row.normalizedVelocity.components,['0','0','0']);assert.deepEqual(row.physicalVelocity.components,['0','0','0']);
    assert.equal(row.localizedZeroBranchEvaluated,true);assert.equal(row.sourceLocalVelocityEvaluated,false);
    assert.equal(row.comparison.sourceLocalDomainContainsThisPoint,false);assert.equal(row.missingSourceValuesSetToZero,false);
    assert.equal(row.underflowReplacedByZero,false);assert.ok(Number.isInteger(row.physicalVelocity.positiveScale));
  }
  assert.equal(r.decimalSamples.at(-1).displayTimeRoundedToOne,true);
});

test('source: active inner-path intervals remain tied to the unit plateau and external final-field bridge',async()=>{
  const r=await source();assert.equal(r.innerPath.allSelectedPathsInUnitPlateau,true);
  assert.deepEqual(r.innerPath.rows,r.inner.rows);
  assert.equal(r.innerPath.sourceTheoremBridge.dependencies.length,2);
  for(const row of r.innerPath.rows){assert.equal(row.externalSourceTheoremBridgeRequired,true);assert.equal(row.physicalVelocity.binary64,null);}
  assert.equal(r.scope.fullLocalizedForceConstructed,false);assert.equal(r.scope.wholeN8ReconstructionComputed,false);
});

test('source: copied records and removal of a cutoff commutator cannot acquire private source authority',async()=>{
  const r=await source();assert.throws(()=>assertActualSourceLocalization({...r}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const coefficient=r.operator.velocity[0].terms[2].coefficient;
  try{r.operator.velocity[0].terms[2].coefficient=r.G.zero;assert.throws(()=>assertActualSourceLocalization(r),{code:'INVALID_SOURCE_CONSTRUCTION'});}
  finally{r.operator.velocity[0].terms[2].coefficient=coefficient;}
  assert.equal(assertActualSourceLocalization(r),true);
});

test('source: export every actual scalar coefficient while preserving the unexecuted whole-field scope',async()=>{
  const r=await source(),certificate=await actualSourceLocalizationCertificate(r);
  assert.equal(certificate.verification.checksPass,true);assert.equal(certificate.verification.originalFinalN6FieldsNumericallyEvaluated,false);
  assert.equal(certificate.formulaProgram.underflowReplacedByZero,false);
  assert.equal(certificate.formulaProgram.coordinateDependentRootsExplicit,true);
  assert.equal(certificate.scope.newLeanKernelProof,false);assert.equal(certificate.scope.wholeM3Complete,false);
  if(process.env.M3_N7_LOCALIZATION_EVIDENCE)writeFileSync(process.env.M3_N7_LOCALIZATION_EVIDENCE,JSON.stringify(certificate,null,2)+'\n');
  observe({stage:'n7-localization-source-certificate-written'});
});
