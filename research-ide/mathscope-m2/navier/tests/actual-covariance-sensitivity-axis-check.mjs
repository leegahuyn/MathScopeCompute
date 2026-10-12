// One actual Z/T source graph per process. Coordinate memory before running.
// Usage: node research-ide/mathscope-m2/navier/tests/actual-covariance-sensitivity-axis-check.mjs Z [new-evidence-directory]
// Existing R receipts, product code, worker bytes and prior axis evidence are never overwritten.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualCovarianceSensitivityProgram,assertActualCovarianceSensitivityProgram} from '../actual-covariance-sensitivity.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {SOURCE_PROFILE_ID} from '../source-profile.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

const axis=process.argv[2];
assert.ok(['Z','T'].includes(axis),'Choose Z or T; the historical R receipt is not an output of this helper.');
assert.ok(process.argv.length<=4,'At most one optional new evidence directory is supported.');
const repository=fileURLToPath(new URL('../../../../',import.meta.url));
const evidence=process.argv[3]?path.resolve(process.argv[3]):fileURLToPath(new URL('../research/evidence/differential-extension-20261011/',import.meta.url));
const stem='actual-covariance-sensitivity-axis-'+axis+'-source',jsonPath=path.join(evidence,stem+'.json'),logPath=path.join(evidence,stem+'.log');
fs.mkdirSync(evidence,{recursive:true});
assert.ok(!fs.existsSync(jsonPath)&&!fs.existsSync(logPath),'Preserve the existing receipt: choose a new evidence directory for a rerun.');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const relative=file=>path.relative(repository,file).split(path.sep).join('/');

// Record the local literal-import closure, including this checker. This is a
// source-byte manifest, separate from the generated expression-program hash.
function sourceManifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];
  while(pending.length){
    const file=pending.pop();if(seen.has(file))continue;
    const bytes=fs.readFileSync(file),text=bytes.toString('utf8');seen.set(file,digest(bytes));
    const imports=[...text.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...text.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)];
    for(const match of imports)if(match[1].startsWith('.'))pending.push(path.resolve(path.dirname(file),match[1]));
  }
  const files=Object.fromEntries([...seen].map(([file,sha256])=>[relative(file),sha256]).sort(([a],[b])=>a.localeCompare(b)));
  return {scope:'Local literal module imports reachable from this actual-source checker; built-in Node modules are identified by the runtime version.',fileCount:seen.size,sha256:digest(canonicalStringify(files)),files};
}

const input={sourceProfile:SOURCE_PROFILE_ID,ellExact:'1',slowCoordinate:axis,derivativeOrder:1,terms:0};
const command=['node',relative(fileURLToPath(import.meta.url)),axis,...(process.argv[3]?[process.argv[3]]:[])];
const started=performance.now(),record={schema:'MathScope.ActualCovarianceSensitivityAxisSourceCheck/1',
  generatedAt:new Date().toISOString(),command,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),
  mode:'DIRECT_ACTUAL_SOURCE_PREPARE_AND_BODY_CHECKS',kind:'ns.actual-covariance-sensitivity',axis,input,inputSHA256:digest(canonicalStringify(input)),
  runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},
  sourceManifest:sourceManifest(),checks:[],scope:{workerExecution:false,browserExecution:false,numericalDerivativeEnclosure:false,actualSourceAnalyticLeanProof:false}};
const log=value=>{const line=typeof value==='string'?value:JSON.stringify(value);fs.appendFileSync(logPath,line+'\n');console.log(line);};
function check(id,fn){try{fn();record.checks.push({id,pass:true});}catch(error){record.checks.push({id,pass:false,message:error.message});throw error;}}

log({event:'START',axis,inputSHA256:record.inputSHA256,sourceManifestSHA256:record.sourceManifest.sha256,sourceFiles:record.sourceManifest.fileCount});
try{
  const prepared=prepareActualCovarianceSensitivityProgram(input),{G,operator,rows,pulse,inverse}=prepared;
  check('authentic-source-and-normalized-request',()=>{
    assert.equal(assertActualCovarianceSensitivityProgram(prepared),true);
    assert.deepEqual(prepared.request,input);assert.ok(prepared.checks.every(c=>c.pass));assert.ok(pulse.checks.every(c=>c.pass));
    assert.deepEqual(rows.map(r=>r.sign),[1,-1]);
  });
  // Hash the original production compiler result before any checker appends.
  let serialized=canonicalStringify(prepared.program);
  record.graph={sha256:digest(serialized),nodeCount:G.nodes.length,canonicalBytes:Buffer.byteLength(serialized),
    compiler:prepared.program.compiler,compilerInput:prepared.program.compilerInput,
    hashDomain:'Canonical actual covariance sensitivity program immediately after authentic preparation; later checker appends excluded.'};
  serialized=null;
  const parameter=operator.coordinates[axis],parameterIndex=['R','Z','T'].indexOf(axis);
  record.axisBinding={parameterRoot:parameter,coordinateNode:G.nodes[parameter],parameterIndex,systems:[]};
  check('selected-axis-drives-both-real-variation-systems',()=>{
    assert.equal(G.nodes[parameter].op,'coordinate');assert.equal(inverse.parameter,parameter);
    for(const row of pulse.rows){
      const system=G.pulseSensitivitySystems[row.system],family=operator.families.find(f=>f.sign===row.sign);
      assert.equal(row.parameter,parameter);assert.equal(row.coordinate,axis);assert.equal(system.parameter,parameter);assert.equal(system.parameterIndex,parameterIndex);
      assert.ok(system.matrixDerivative.flat().some(x=>x!==G.zero));
      for(let j=0;j<2;j++){
        assert.equal(row.wDerivative[j],G.derivative(family.w[j],parameter));
        const node=G.nodes[row.wDerivative[j]];assert.equal(node.op,'actual_pulse_sensitivity_volterra');
        assert.equal(node.args[0],row.system);assert.equal(node.args[1],j+2);
      }
      record.axisBinding.systems.push({sign:row.sign,system:row.system,parameterRoot:system.parameter,parameterIndex:system.parameterIndex,matrixDerivativeRoots:system.matrixDerivative,wDerivativeRoots:row.wDerivative});
    }
  });
  check('original-H-mass-integrals-and-actual-body-derivatives',()=>{
    for(const row of rows){
      const family=operator.families.find(f=>f.sign===row.sign);assert.equal(row.exact.parameter,parameter);
      assert.equal(row.exact.factor,operator.geometry.haarFactor);assert.equal(row.exact.cutoff,operator.cutoffs.psi);
      assert.deepEqual(row.exact.amplitudeDerivative,family.t.map(t=>G.derivative(t,parameter)));
      for(const integral of row.exact.rows){
        assert.equal(integral.original,family.covariance[integral.component]);
        assert.equal(integral.directDerivative,G.derivative(integral.original,parameter));
        assert.ok(integral.productCheck.pass&&integral.leibnizCheck.pass);
      }
    }
    for(let i=0;i<2;i++)for(let j=0;j<2;j++){
      assert.equal(inverse.matrixDerivative[i][j],G.derivative(inverse.matrix[i][j],parameter));
      assert.equal(sourceGraphRationalIdentity(G,G.sub(inverse.matrixDerivative[i][j],rows[j].exact.rows[i].derivative)).pass,true);
    }
    assert.ok(inverse.matrixDerivative.flat().some(x=>x!==G.zero));
  });
  check('actual-full-target-body-is-differentiated-in-requested-axis',()=>{
    assert.deepEqual(inverse.target,prepared.target.components);
    assert.deepEqual(inverse.targetDerivative,prepared.target.components.map(t=>G.derivative(t,parameter)));
    assert.ok(inverse.targetDerivative.some(x=>x!==G.zero));
    assert.equal(prepared.target.originalCompletedSourceRetained,true);assert.equal(prepared.target.actualHeatPreparedPressureRetained,true);assert.equal(prepared.target.bothShearTermsRetained,true);
  });
  check('all-inverse-value-equation-and-direct-derivative-checks-pass',()=>{
    for(const list of [inverse.valueChecks,inverse.derivativeChecks,inverse.directChecks]){assert.equal(list.length,2);assert.ok(list.every(c=>c.pass));}
    assert.deepEqual(inverse.directWeightDerivative,inverse.weights.map(y=>G.derivative(y,parameter)));
  });
  check('finite-amplitude-and-source-integral-tails-retained',()=>{
    for(const row of rows){
      assert.equal(row.finiteTerms,0);assert.ok(row.finiteDerivativeChecks.every(c=>c.pass));
      assert.notEqual(row.tail.absoluteError,G.zero);assert.notEqual(row.tail.factorialTail,G.zero);
      assert.equal(row.tail.sourceDerived,true);assert.equal(row.tail.errorTendsToZero,true);assert.equal(row.tail.numericalWholeIntegralEnclosure,false);
      const family=operator.families.find(f=>f.sign===row.sign);
      assert.equal(row.tail.envelopeSquaredIntegral,G.integral(G.mul(G.pow(operator.cutoffs.psi,2),G.pow(family.P,2)),operator.coordinates.v,G.zero,operator.geometry.Ls));
    }
  });
  check('conditional-domain-and-unfinished-global-scope-preserved',()=>{
    for(const field of ['certifiedBandMembership','determinantNonzeroCertified','positiveWeightsCertified'])assert.equal(prepared.domain.exercisedMember[field],false);
    for(const field of ['positiveWeightsOfExercisedMemberCertified','squareRootWeightsConstructed','secondSlowDerivativeConstructed','actualNumericalWholeHQuadrature','actualSourceFullCurlComplete','fullPhysicalResidualAndFlatErrorPackageComplete','newLeanKernelProof'])assert.equal(prepared.scope[field],false);
    assert.equal(prepared.scope.inverseDerivativeConditionalOnNonzeroDeterminant,true);
    assert.equal(inverse.domain.nonzeroDeterminantProved,false);assert.equal(inverse.domain.positiveWeightsProved,false);
    assert.equal(assertActualCovarianceSensitivityProgram(prepared),true);
  });
  check('runtime-source-bytes-unchanged-during-check',()=>assert.deepEqual(sourceManifest(),record.sourceManifest));
  record.sourceChecks=prepared.checks;record.pulseSourceChecks=pulse.checks.map(({id,pass})=>({id,pass}));
  record.inverseChecks={value:inverse.valueChecks.map(c=>c.pass),derivativeEquation:inverse.derivativeChecks.map(c=>c.pass),directDerivative:inverse.directChecks.map(c=>c.pass)};
  record.derivativeRoots={H:inverse.matrixDerivative,target:inverse.targetDerivative,weights:inverse.weightDerivative,
    integrals:rows.map(r=>({sign:r.sign,components:r.exact.rows.map(x=>({component:x.component,original:x.original,derivative:x.derivative}))}))};
  record.domain=prepared.domain;record.scope={...record.scope,...prepared.scope};
  record.pass=true;record.status='EXECUTED_VERIFIED_SCOPED';record.exitCode=0;
}catch(error){
  record.pass=false;record.status='FAILED';record.exitCode=1;record.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack};process.exitCode=1;
}
record.elapsedMs=performance.now()-started;record.peakRSSBytes=process.resourceUsage().maxRSS*1024;
log({event:'FINISH',axis,pass:record.pass,exitCode:record.exitCode,checks:record.checks,graph:record.graph,elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,...(record.error?{error:record.error}:{})});
record.log={path:relative(logPath),sha256:digest(fs.readFileSync(logPath))};
fs.writeFileSync(jsonPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
