// One genuine source operator per process. Coordinate memory before running.
// Usage: node research-ide/mathscope-m2/navier/tests/actual-cutoff-mass-enclosure-source-check.mjs [new-evidence-directory]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualCovarianceOperator,assertActualCovarianceOperator} from '../actual-covariance-source-operator.mjs';
import {attachActualCutoffMassEnclosure,assertActualCutoffMassEnclosure} from '../actual-cutoff-mass-enclosure.mjs';
import {readRational,rational,qadd,qmul,qsub,qcompare,qtext} from '../actual-continuation-arithmetic.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from '../source-profile.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

assert.ok(process.argv.length<=3,'Use at most one new evidence directory.');
const repository=fileURLToPath(new URL('../../../../',import.meta.url));
const evidence=process.argv[2]?path.resolve(process.argv[2]):fileURLToPath(new URL('../research/evidence/m2-continuation-20261011/',import.meta.url));
const stem='actual-cutoff-mass-enclosure-source',jsonPath=path.join(evidence,stem+'.json'),logPath=path.join(evidence,stem+'.log');
fs.mkdirSync(evidence,{recursive:true});
assert.ok(!fs.existsSync(jsonPath)&&!fs.existsSync(logPath),'Existing evidence is preserved: choose a new directory for a rerun.');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex'),relative=file=>path.relative(repository,file).split(path.sep).join('/');
function sourceManifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];
  while(pending.length){
    const file=pending.pop();if(seen.has(file))continue;
    const bytes=fs.readFileSync(file),text=bytes.toString('utf8');seen.set(file,digest(bytes));
    const imports=[...text.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...text.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)];
    for(const match of imports)if(match[1].startsWith('.'))pending.push(path.resolve(path.dirname(file),match[1]));
  }
  const files=Object.fromEntries([...seen].map(([file,sha256])=>[relative(file),sha256]).sort(([a],[b])=>a.localeCompare(b)));
  return {scope:'Local literal import closure of this direct actual-source checker; built-in modules are identified by the Node version.',fileCount:seen.size,sha256:digest(canonicalStringify(files)),files};
}
const input={sourceProfile:SOURCE_PROFILE_ID,ellExact:'1',precisionBits:192,tolerance:'1/10000000000',maxCells:1024};
const started=performance.now(),record={schema:'MathScope.ActualCutoffMassEnclosureSourceCheck/1',generatedAt:new Date().toISOString(),
  sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),
  command:['node',relative(fileURLToPath(import.meta.url)),...(process.argv[2]?[process.argv[2]]:[])],
  mode:'DIRECT_ACTUAL_SOURCE_CUTOFF_FACTORS_AND_DIRECTED_NUMERICAL_INTEGRAL',input,inputSHA256:digest(canonicalStringify(input)),
  runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},sourceManifest:sourceManifest(),checks:[],
  scope:{workerExecution:false,browserExecution:false,actualSourceAnalyticLeanProof:false,wholeGNUMComplete:false}};
const log=value=>{const line=typeof value==='string'?value:JSON.stringify(value);fs.appendFileSync(logPath,line+'\n');console.log(line);};
const check=(id,fn)=>{try{fn();record.checks.push({id,pass:true});}catch(error){record.checks.push({id,pass:false,message:error.message});throw error;}};
const q=readRational,le=(a,b)=>qcompare(q(a),q(b))<=0;
log({event:'START',inputSHA256:record.inputSHA256,sourceManifestSHA256:record.sourceManifest.sha256,sourceFiles:record.sourceManifest.fileCount});
try{
  const {sourceProfile,ellExact,...controls}=input,operator=prepareActualCovarianceOperator({sourceProfile,ellExact}),{G,geometry,cutoffs}=operator;
  const originalNodeCount=G.nodes.length,originalProgramSHA256=digest(canonicalStringify(operator.program));
  const result=await attachActualCutoffMassEnclosure(operator,controls);
  check('authentic-original-source-and-node-bound-numerical-result',()=>{
    assert.equal(assertActualCovarianceOperator(operator),true);assert.equal(assertActualCutoffMassEnclosure(result),true);
    assert.equal(result.sourceProgram.sha256,originalProgramSHA256);assert.equal(result.sourceProgram.nodeCount,originalNodeCount);
    assert.equal(result.sourceProgram.ellExact,'1');assert.equal(result.bindingProgram.nodeCount,G.nodes.length);
    assert.equal(result.pass,true);assert.ok(result.checks.every(x=>x.pass));
    assert.equal(result.sourceBinding.literalOriginalBranchesChecked,true);
  });
  check('literal-original-chi-integral-and-original-Haar-factor-retained',()=>{
    const roots=result.sourceBinding.roots;
    assert.equal(roots.chi,cutoffs.chi);assert.equal(roots.transverseMass,cutoffs.transverseMass);
    assert.equal(roots.transverseMass,G.integral(G.pow(cutoffs.chi,2),cutoffs.xi,G.neg(geometry.r0),geometry.r0));
    assert.equal(geometry.r0,G.q(1,1n<<34n));
    assert.equal(geometry.haarFactor,G.mul(G.q(1,2),geometry.Dgeom,geometry.ci,cutoffs.transverseMass));
    assert.equal(result.sourceBinding.originalHaarMassRootRetained,true);
  });
  check('literal-original-longitudinal-integral-and-both-mass-reductions',()=>{
    const roots=result.sourceBinding.roots,{v}=operator.coordinates;
    assert.equal(roots.psi,cutoffs.psi);assert.equal(roots.Ls,geometry.Ls);
    assert.equal(roots.longitudinalSquareMass,G.integral(G.pow(cutoffs.psi,2),v,G.zero,geometry.Ls));
    assert.equal(roots.normalizedLongitudinalSquareMass,G.div(roots.longitudinalSquareMass,geometry.Ls));
    for(const side of ['lower','upper']){
      const I=q(result.sigmaIntegral.integral[side]),transverse=qadd(rational(1,2),I),longitudinal=qadd(rational(1,2),qmul(rational(1,10),I));
      assert.equal(result.values.normalizedTransverseMass[side],qtext(transverse));
      assert.equal(result.values.transverseMass[side],qtext(qmul(rational(1,1n<<34n),transverse)));
      assert.equal(result.values.normalizedLongitudinalSquareMass[side],qtext(longitudinal));
    }
    assert.deepEqual(result.values.longitudinalSquareMass.coefficient,result.values.normalizedLongitudinalSquareMass);
    assert.equal(result.values.longitudinalSquareMass.positiveExactScaleRoot,geometry.Ls);
    // The current source plateau has radius 1/4. An older admissible cutoff
    // with radius 1/2 has a different mass and must not enter this evaluator.
    assert.ok(le('3/4',result.values.normalizedTransverseMass.lower));assert.ok(le(result.values.normalizedTransverseMass.upper,'1'));
  });
  check('actual-factor-error-widths-and-directed-error-budget-meet-request',()=>{
    const sigma=result.sigmaIntegral,b=sigma.errorBudget;
    assert.ok(le(b.quadratureWidth,b.quadratureAllocation)&&le(b.arithmeticAndElementaryWidth,b.arithmeticAllocation));
    assert.equal(qcompare(qadd(q(b.quadratureWidth),q(b.arithmeticAndElementaryWidth)),q(sigma.integralWidth)),0);
    assert.ok(le(sigma.integralWidth,input.tolerance));assert.equal(sigma.arithmetic.binary64UsedForDecisions,false);
    assert.equal(sigma.proof.wholeCellJetsAreIntervals,true);assert.equal(sigma.sourceAuthenticated,false);
    for(const [name,scale] of [['normalizedTransverseMass',rational(1)],['transverseMass',rational(1,1n<<34n)],['normalizedLongitudinalSquareMass',rational(1,10)]]){
      const value=result.values[name],width=qsub(q(value.upper),q(value.lower));
      assert.equal(qcompare(width,qmul(scale,q(sigma.integralWidth))),0);
    }
  });
  check('literal-ell-one-exp-log-palette-and-strict-nonzero-h-enclose-the-whole-longitudinal-mass',()=>{
    const length=result.sourceBinding.ellOneLength,mass=result.values.longitudinalSquareMass;
    assert.equal(length.ellExact,'1');assert.equal(length.roots.Q,geometry.Q);assert.equal(length.roots.paletteIndex,geometry.paletteIndex);
    assert.equal(length.roots.ci,geometry.ci);assert.equal(length.roots.h,operator.constants.h);assert.equal(length.roots.Ls,geometry.Ls);
    assert.equal(G.nodes[length.roots.Q].op,'exp');assert.equal(G.nodes[length.roots.h].op,'source_parameter');
    assert.equal(length.strictHContract.upperBoundExact,'2^-4096');assert.equal(length.strictHContract.positive,true);
    assert.equal(length.hSetToZero,false);assert.equal(length.LsReplacedByPoint,false);assert.equal(length.strictInsideDisplayedClosedInterval,true);
    assert.equal(length.enclosure.lower,qtext(rational(1,1n<<32n)));
    assert.equal(length.enclosure.upper,qtext(qmul(rational(1,1n<<32n),qadd(rational(1),rational(1,1n<<4095n)))));
    for(const side of ['lower','upper'])assert.equal(mass.absoluteEnclosure[side],qtext(qmul(q(length.enclosure[side]),q(mass.coefficient[side]))));
    const budget=mass.absoluteWidthBudget;
    assert.equal(qcompare(qadd(q(budget.normalizedIntegralContribution),q(budget.originalLengthEnclosureContribution)),q(budget.totalWidth)),0);
    assert.equal(qcompare(qsub(q(mass.absoluteEnclosure.upper),q(mass.absoluteEnclosure.lower)),q(budget.totalWidth)),0);
    assert.ok(qcompare(q(budget.originalLengthEnclosureContribution),rational(0))>0);
    assert.equal(budget.exactRationalProducts,true);assert.equal(budget.additionalFloatingRounding,'0');
    assert.equal(result.scope.actualOriginalLsNumericallyEnclosed,true);assert.equal(result.scope.actualLongitudinalSquareMassAbsoluteEnclosure,true);
  });
  check('all-first-and-symmetric-second-slow-mass-derivatives-vanish-by-source-independence',()=>{
    for(const root of [result.sourceBinding.roots.transverseMass,result.sourceBinding.roots.longitudinalSquareMass,
      result.sourceBinding.roots.normalizedLongitudinalSquareMass,geometry.Ls])
      for(const coordinate of ['R','Z','T'])assert.equal(G.freeCoordinates(root).has(operator.coordinates[coordinate]),false);
    assert.deepEqual(result.slowDerivatives.first.map(r=>r.coordinate),['R','Z','T']);
    assert.deepEqual(result.slowDerivatives.symmetricSecond.map(r=>r.coordinate),['RR','RZ','RT','ZZ','ZT','TT']);
    for(const row of [...result.slowDerivatives.first,...result.slowDerivatives.symmetricSecond])
      for(const field of ['transverseMass','longitudinalSquareMass'])assert.deepEqual(row[field],{lower:'0',upper:'0'});
  });
  check('original-nonzero-h-and-unevaluated-H-Volterra-sqrt-scope-preserved',()=>{
    assert.deepEqual(G.nodes[operator.constants.h],{op:'source_parameter',args:['h']});
    assert.equal(sourceExponentContract().positive,true);assert.equal(sourceExponentContract().notNumericallyReplaced,true);
    for(const family of operator.families){
      const root=G.mul(geometry.haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),family.t[0],family.t[1]),operator.coordinates.v,G.zero,geometry.Ls));
      assert.equal(root,family.covariance.theta);
    }
    for(const field of ['originalHRecomputed','actualVolterraSolutionNumericallyEnclosed','actualSlowPulseDerivativeNumericallyEnclosed',
      'positiveWeightsOfExercisedMemberCertified','actualFullCurlNumericalEnclosure','fullPhysicalResidualAndFlatErrorPackageComplete',
      'wholeGNUMComplete','newLeanKernelProof','hNumericallyReplacedByZero'])assert.equal(result.scope[field],false);
    assert.equal(result.scope.actualSourceCutoffFactorsNumericallyEnclosed,true);assert.equal(result.scope.sourceAuthenticated,true);
  });
  check('copied-and-edited-numerical-receipts-are-rejected',()=>{
    assert.throws(()=>assertActualCutoffMassEnclosure(structuredClone(result)),error=>error.code==='INVALID_SOURCE_CONSTRUCTION');
    const saved=result.values.transverseMass.lower;
    try{result.values.transverseMass.lower='0';assert.throws(()=>assertActualCutoffMassEnclosure(result),error=>error.code==='INVALID_SOURCE_CONSTRUCTION');}
    finally{result.values.transverseMass.lower=saved;}
    assert.equal(assertActualCutoffMassEnclosure(result),true);
  });
  check('altered-original-and-appended-integral-bodies-are-rejected',()=>{
    for(const root of [cutoffs.chi,result.sourceBinding.roots.longitudinalSquareMass]){
      const saved=G.nodes[root];
      try{G.nodes[root]={op:'rational',args:['0','1']};assert.throws(()=>assertActualCutoffMassEnclosure(result),error=>error.code==='INVALID_SOURCE_CONSTRUCTION');}
      finally{G.nodes[root]=saved;}
      assert.equal(assertActualCutoffMassEnclosure(result),true);
    }
  });
  check('literal-runtime-source-bytes-remain-unchanged',()=>assert.deepEqual(sourceManifest(),record.sourceManifest));
  record.result=result;record.pass=true;record.status='EXECUTED_VERIFIED_SCOPED';record.exitCode=0;
  record.scope={...record.scope,...result.scope};
}catch(error){record.pass=false;record.status='FAILED';record.exitCode=1;record.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack};process.exitCode=1;}
record.elapsedMs=performance.now()-started;record.peakRSSBytes=process.resourceUsage().maxRSS*1024;
log({event:'FINISH',pass:record.pass,exitCode:record.exitCode,checks:record.checks,sourceGraph:record.result?.sourceProgram,bindingGraph:record.result?.bindingProgram,
  elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,...(record.error?{error:record.error}:{})});
record.log={path:relative(logPath),sha256:digest(fs.readFileSync(logPath))};
fs.writeFileSync(jsonPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
