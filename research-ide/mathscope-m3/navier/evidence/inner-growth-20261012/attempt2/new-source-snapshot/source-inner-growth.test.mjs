import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {prepareActualInnerGrowth,assertActualInnerGrowth,actualInnerGrowthCertificate} from '../source-inner-growth.mjs';
import {evaluateActualCorePoint} from '../../../mathscope-m2/navier/actual-core-evaluator.mjs';
import {readRational,rational,qcompare,qsub,qadd,qdiv} from '../../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';

let task,state,certificate;
const get=()=>task??=prepareActualInnerGrowth({}, {onProgress:e=>console.log('# INNER_SOURCE '+JSON.stringify({...e,at:new Date().toISOString(),rssBytes:process.memoryUsage().rss}))});
const compare=(a,b)=>qcompare(readRational(a),readRational(b));

test('same common6 source and actual nonlinear core construct the original Xin=Xa/2 path',async()=>{
  state=await get();certificate=await actualInnerGrowthCertificate(state);
  const previous=JSON.parse(await readFile(new URL('../../../mathscope-m2/navier/research/evidence/common-physical-package-20261011/actual-common-physical-package-source-attempt6.json',import.meta.url)));
  assert.deepEqual(certificate.sourceBinding.common6FamilyGraph,previous.certificates.family.graph);
  assert.equal(certificate.checks.every(c=>c.pass),true);
  assert.equal(certificate.leading.freshCore.request.Y,'2');
  assert.equal(certificate.leading.freshCore.coordinates.etaExact,'0');
  assert.equal(certificate.leading.freshCore.domain.sourcePosition,'ACTUAL_UNMODIFIED_CORE');
  assert.equal(certificate.leading.freshCore.scope.comparisonReplacedActualPhi,false);
  assert.equal(certificate.leading.freshCore.scope.positiveBanachErrorRetained,true);
  assert.equal(compare(certificate.leading.freshCore.phi.rows[0].actualNonlinearInterval.lower,'1/2'),1);
});

test('independent bit refinement encloses the same source Phi while keeping nonzero analytic error',async()=>{
  const p=await get(),fine=p.leading.freshCore.phi.rows[0],coarse=evaluateActualCorePoint({Y:'2',eta:{kind:'DIRECT_RATIONAL',value:'0'},radialOrder:0,etaOrder:0,bits:128,degree:32}).phi.rows[0];
  const f=fine.actualNonlinearInterval,c=coarse.actualNonlinearInterval;
  assert.ok(compare(c.lower,f.lower)<=0&&compare(c.upper,f.upper)>=0);
  assert.ok(qcompare(qsub(readRational(f.upper),readRational(f.lower)),qsub(readRational(c.upper),readRational(c.lower)))<0);
  assert.ok(compare(fine.positiveNonlinearErrorUpper,'0')>0);
  assert.ok(compare(fine.comparisonRadialCauchyTailUpper,'0')>0);
});

test('source tail includes actual n1, n2 and the whole n>=3 common-cutoff family',async()=>{
  const p=await get(),G=p.G,tail=p.remainder.finiteBlock,canonical=p.family.source.background.cutoffs;
  assert.deepEqual(tail.finite.map(x=>x.order),[1,2]);
  assert.equal(tail.coefficient,G.add(tail.finite[0].bound,tail.finite[1].bound,G.q(1,4)));
  assert.notEqual(tail.coefficient,G.add(tail.finite[0].bound,G.q(1,4)));
  assert.equal(p.family.source.background.induction.allIntegerOrdersBySameWellFoundedRecipe,true);
  for(const [i,row]of p.family.selector.rows.entries()){
    assert.equal(row.historicalScale,canonical.rows[i].scale);
    assert.ok(G.nodes[row.logScale].args.includes(canonical.rows[i].logScale));
  }
  assert.equal(p.remainder.allCutoffTermsAndUnboundedTailRetained,true);
  assert.equal(p.formulaProgram.nodes.some(n=>n.op==='source_parameter'&&n.args[0]==='h'),true);
  assert.equal(p.formulaProgram.nodes.some(n=>n.op==='source_parameter'&&n.args[0]==='CSelected'),true);
});

test('exact interval rows use certified error radii, not one-sided midpoints or omitted scale factors',async()=>{
  const p=await get(),phi=p.leading.freshCore.phi.rows[0].actualNonlinearInterval;
  for(const row of p.rows){
    const error=rational(1,1n<<BigInt(row.depth+2));
    assert.equal(qcompare(readRational(row.interval.lower),qsub(readRational(phi.lower),error)),0);
    assert.equal(qcompare(readRational(row.interval.upper),qadd(readRational(phi.upper),error)),0);
    assert.ok(compare(row.interval.lower,'0')>0);
    assert.equal(row.physicalVelocity.binary64,null);
    assert.equal(row.finiteSumMidpointUsed,false);
    assert.equal(row.sourceProfilePoint.X,p.point.Xin);
    assert.equal(row.sourceProfilePoint.eta,p.G.zero);
  }
  for(let j=1;j<p.rows.length;j++)assert.ok(compare(p.rows[j].remainderAbsUpper,p.rows[j-1].remainderAbsUpper)<0);
  const scaleIdentity=p.G.mul(p.leading.rigorousLower,p.G.q(2));
  // The actual positive factor eScale=2/(CSelected*sqrt Lambda) is retained.
  assert.notEqual(p.leading.positivePrefactor,p.G.one);
  assert.equal(p.G.freeCoordinates(scaleIdentity).size,0);
});

test('localization plateau keeps the source cutoff, squared radius, original qstar and exact positive tau',async()=>{
  const p=await get(),G=p.G,c=p.localization;
  assert.equal(c.sourceQStar,p.family.constants.qStar);
  assert.equal(c.sourceEll0,p.family.constants.ell0);
  assert.equal(c.qStar,G.exp(G.neg(G.mul(G.add(c.sourceEll0,G.q(4)),G.log(G.q(2))))));
  assert.notEqual(c.qStar,c.sourceQStar);
  assert.equal(c.tau0,G.div(c.qStar,G.q(32)));
  assert.equal(G.nodes[c.cutoff.body].op,'smooth_piecewise');
  const body=G.nodes[c.cutoff.body];
  assert.deepEqual(body.args.slice(1,4),[G.q(1,2),G.one,G.one]);
  assert.equal(body.args.at(-1),G.zero);
  for(const row of p.rows){
    assert.equal(G.nodes[row.tau].op,'exp');
    assert.equal(row.position[1],G.zero);assert.equal(row.position[2],G.zero);
    assert.equal(row.cutoffArguments.axial,G.zero);
    assert.equal(row.exactPlateau.product,'1');
  }
  assert.match(c.spatialCutoff,/r\^2/);
  assert.match(c.sourceDomainIdentity,/sourceQStar\/64/);
  assert.equal(c.forceOrGlobalFieldEvaluated,false);
});

test('whole N6 existence and localization remain visible external dependencies of the path claim',async()=>{
  const p=await get();
  assert.equal(p.annularRestriction.evidenceKind,'EXTERNAL_SOURCE_THEOREM_APPLIED_TO_EXACT_ORIGINAL_INNER_RESTRICTION');
  assert.equal(p.annularRestriction.originalFinalN6InstanceConstructed,false);
  assert.equal(p.annularRestriction.allAnnularTermsNumericallyEnumerated,false);
  assert.equal(p.claims.originalLocalizedPath.status,'CONDITIONAL_ON_EXTERNAL_SOURCE_THEOREM_IDENTIFICATION');
  assert.equal(p.claims.finalN6Construction.status,'NOT_CONSTRUCTED_BY_THIS_MODULE');
  assert.equal(p.claims.originalN7CriterionComplete,false);
  assert.equal(p.scope.finitePlotUsedAsBlowupProof,false);
  assert.equal(p.scope.newLeanKernelProof,false);
  assert.equal(p.scope.wholeM3Complete,false);
});

test('missing n2, changed common sequence, removed theorem premise or forged positivity are rejected',async()=>{
  const p=await get();
  assert.throws(()=>assertActualInnerGrowth({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  for(const [object,key,replacement]of [[p.remainder.finiteBlock,'coefficient',p.G.zero],[p.leading,'rigorousLower',p.G.zero],[p.claims.originalLocalizedPath,'dependencies',[]],[p.scope,'originalCompleteN6FieldConstructed',true]]){
    const old=object[key];object[key]=replacement;
    try{assert.throws(()=>assertActualInnerGrowth(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{object[key]=old;}
  }
  const row=p.family.selector.rows[0],old=row.logScale;row.logScale=p.G.zero;
  try{assert.throws(()=>assertActualInnerGrowth(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{row.logScale=old;}
  assert.equal(assertActualInnerGrowth(p),true);
  await assert.rejects(prepareActualInnerGrowth({h:0}),{code:'INVALID_INPUT'});
  await assert.rejects(prepareActualInnerGrowth({depths:[-1]}),{code:'INVALID_INPUT'});
});

test('issued certificate contains the actual closed scalar program and no serialized source authority',async()=>{
  const p=await get(),result=await actualInnerGrowthCertificate(p);
  assert.throws(()=>assertActualInnerGrowth(result),{code:'INVALID_SOURCE_CONSTRUCTION'});
  assert.equal(result.graph.scalarNodeCount,result.formulaProgram.nodes.length);
  assert.match(result.graph.scalarProgramSHA256,/^[0-9a-f]{64}$/);
  assert.equal(result.verification.freshCoreIntervalExecuted,true);
  assert.equal(result.verification.freshCommonFamilyExecuted,true);
  assert.equal(result.verification.wholeLocalizedN6FieldExecuted,false);
  assert.equal(result.formulaProgram.numericalHugeConstantsEvaluated,false);
  const program=result.formulaProgram,ids=program.sourceNodeIds;
  assert.equal(program.allScalarRootsHaveNoFreeCoordinates,true);
  assert.equal(program.definiteIntegralBodiesAndEndpointsRetained,true);
  assert.ok(program.nodes.some(n=>n.op==='definite_integral'));
  for(const [j,node]of program.nodes.entries()){
    const original=p.G.nodes[ids[j]];
    assert.equal(node.op,original.op);
    const expected=['rational','source_parameter','coordinate'].includes(node.op)?node.args:
      ['integer_power','source_step_derivative'].includes(node.op)?[ids[node.args[0]],node.args[1]]:node.args.map(i=>ids[i]);
    assert.deepEqual(expected,original.args);
    if(node.op==='definite_integral')assert.equal(program.nodes[node.args[1]].op,'coordinate');
  }
  for(const row of p.rows){
    assert.equal(ids[program.roots['velocityScale_'+row.depth]],row.physicalVelocity.positiveScale);
    assert.equal(ids[program.roots['timeCutoffArgument_'+row.depth]],row.cutoffArguments.time);
    assert.equal(ids[program.roots['radialCutoffArgument_'+row.depth]],row.cutoffArguments.radial);
  }
  assert.equal(ids[program.functions.localizationCutoff.body],p.localization.cutoff.body);
  if(process.env.M3_N7_INNER_EVIDENCE)await writeFile(process.env.M3_N7_INNER_EVIDENCE,JSON.stringify(result,null,2)+'\n');
});
