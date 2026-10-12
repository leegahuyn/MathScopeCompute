// One original source graph per process; reserve the heavy-memory slot first.
// Usage: node --max-old-space-size=2048 <this file> [new-evidence-directory] [new-receipt-stem]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualHeatScaledEnclosure,assertActualHeatScaledEnclosure,actualHeatScaledEnclosureCertificateFromProgram} from '../actual-heat-scaled-enclosure.mjs';
import {assertActualEllOneCovarianceObstruction,actualEllOneCovarianceObstructionCertificateFromProgram} from '../actual-covariance-ell-one-obstruction.mjs';
import {readRational as read,rational as Q,qsub,qmul,qcompare,qtext} from '../actual-continuation-arithmetic.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from '../source-profile.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

assert.ok(process.argv.length<=4,'Use only a new evidence directory and a new receipt stem.');
const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=file=>path.relative(repository,file).split(path.sep).join('/');
const evidence=process.argv[2]?path.resolve(process.argv[2]):fileURLToPath(new URL('../research/evidence/actual-heat-20261011/',import.meta.url));
const stem=process.argv[3]??'actual-heat-scaled-enclosure-source';assert.match(stem,/^[a-z0-9-]+$/);
const recordPath=path.join(evidence,stem+'.json'),logPath=path.join(evidence,stem+'.log');
fs.mkdirSync(evidence,{recursive:true});assert.ok(!fs.existsSync(recordPath)&&!fs.existsSync(logPath),'Existing evidence must never be overwritten.');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function sourceManifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];
  while(pending.length){
    const file=pending.pop();if(seen.has(file))continue;
    const bytes=fs.readFileSync(file),body=bytes.toString('utf8');seen.set(file,digest(bytes));
    const imports=[...body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...body.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)];
    for(const match of imports)if(match[1].startsWith('.'))pending.push(path.resolve(path.dirname(file),match[1]));
  }
  const files=Object.fromEntries([...seen].map(([file,sha256])=>[relative(file),sha256]).sort(([a],[b])=>a.localeCompare(b)));
  return {scope:'Literal local import closure of this direct source execution, including its runner; Node version identifies built-ins.',fileCount:seen.size,sha256:digest(canonicalStringify(files)),files};
}
const input={sourceProfile:SOURCE_PROFILE_ID,precisionBits:192,tolerance:'1/10000000000000000000000000000000000000000',maxTerms:128};
const started=performance.now(),record={schema:'MathScope.ActualHeatScaledEnclosureSourceCheck/1',generatedAt:new Date().toISOString(),
  sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),
  command:['node','--max-old-space-size=2048',relative(fileURLToPath(import.meta.url)),...(process.argv.slice(2))],input,inputSHA256:digest(canonicalStringify(input)),
  mode:'DIRECT_ACTUAL_ORIGINAL_HEAT_SOURCE_AND_DIRECTED_SCALED_NUMERICS',runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},
  sourceManifest:sourceManifest(),checks:[],scope:{workerExecution:false,browserExecution:false,pluginDecimalUsedForCertification:false,newLeanKernelProof:false,wholeGNUMComplete:false}};
const log=value=>{const line=typeof value==='string'?value:JSON.stringify(value);fs.appendFileSync(logPath,line+'\n');console.log(line);};
const check=async(id,fn)=>{try{await fn();record.checks.push({id,pass:true});}catch(error){record.checks.push({id,pass:false,message:error.message});throw error;}};
const nonzeroRows=['loss','R','T','RR','RT','TT'],zeroJets=['Z','RZ','ZZ','ZT'];
log({event:'START',inputSHA256:record.inputSHA256,sourceManifestSHA256:record.sourceManifest.sha256,sourceFiles:record.sourceManifest.fileCount});
try{
  const p=prepareActualHeatScaledEnclosure(input),{G}=p,sourceCertificate=await actualEllOneCovarianceObstructionCertificateFromProgram(p.source),sourceCount=p.source.program.nodes.length;
  await check('private-authentic-source-and-all-original-heat-bindings',()=>{
    assert.equal(assertActualHeatScaledEnclosure(p),true);assert.equal(assertActualEllOneCovarianceObstruction(p.source),true);
    assert.ok(p.checks.every(row=>row.pass));assert.equal(p.checks.length,11);
    assert.equal(p.sourceBinding.sourceProfile,SOURCE_PROFILE_ID);assert.equal(p.sourceBinding.parameterExpressionSHA256,sourceExponentContract().parameterExpressionSHA256);
    assert.equal(p.sourceBinding.witness,'ACTUAL_ELL1_TERMINAL_S1_ETA0_DELTA1_OVER4');
  });
  await check('original-positive-h-gamma-and-complete-heat-loss-are-never-numerically-replaced',()=>{
    assert.deepEqual(G.nodes[p.roots.h],{op:'source_parameter',args:['h']});assert.equal(sourceExponentContract().positive,true);
    assert.equal(p.proof.hNotReplacedByZero,true);assert.equal(p.proof.sourceHeatNotReplacedByOne,true);
    const original=p.source.operator.background.prepared.bootstrap.actualHeat.heat;
    assert.equal(p.roots.originalGamma,original.gamma);assert.equal(p.roots.originalLoss,original.heatLoss);
    assert.equal(p.roots.originalHeatFactor,G.sub(G.one,original.heatLoss));assert.equal(p.roots.originalArgument,original.heatArgument);
    for(const root of [p.roots.originalGamma,p.roots.originalLoss,p.roots.witnessHeatFactor,p.roots.witnessArgument])assert.notEqual(G.nodes[root].op,'rational');
    assert.equal(p.numerics.bounds.closedZeroEndpointsAreEnclosuresOnly,true);
  });
  await check('chart-reduction-is-bound-to-the-original-inverse-root-and-positive-terminal-point',()=>{
    const {R,T}=p.source.operator.coordinates;
    assert.equal(p.roots.reducedArgument,G.div(G.mul(G.q(4),T),G.pow(R,2)));
    assert.equal(p.roots.witnessX,p.source.roots.witnessX);assert.equal(p.roots.witnessR,p.source.roots.witnessR);
    assert.match(p.proof.chartIdentity,/s-Z\^2\*s\^\(2h\)=T/);assert.match(p.proof.chartIdentity,/throughout the smooth source chart/);
    assert.match(p.proof.chartIdentity,/not an evaluated inverse-root approximation/);
    assert.match(p.proof.sourceBounds,/Pstar=exp\(2\*Tprof\)>2\^256/);
  });
  await check('actual-first-and-symmetric-second-heat-jets-include-all-nine-directions',()=>{
    assert.deepEqual(Object.keys(p.roots.witnessSlowJets),['R','Z','T','RR','RZ','RT','ZZ','ZT','TT']);
    for(const [key,root]of Object.entries(p.roots.witnessSlowJets)){
      assert.equal(G.freeCoordinates(root).size,0);assert.equal(root===G.zero,zeroJets.includes(key));
    }
    for(const root of [p.roots.witnessHeatFactor,p.roots.witnessArgument,...Object.values(p.roots.normalizedMomentRoots),...Object.values(p.roots.witnessPositiveFactors)])assert.equal(G.freeCoordinates(root).size,0);
    assert.equal(p.proof.identityAudit.checks.length,9);assert.ok(p.proof.identityAudit.checks.every(r=>r.pass));
  });
  await check('finite-global-remainder-directed-arithmetic-and-complete-coefficient-widths-meet-tolerance',()=>{
    const n=p.numerics,m=n.moments;assert.equal(m.terms,1);assert.equal(m.errorBudget.includesAllImproperTail,true);
    assert.equal(m.errorBudget.includesParameterBoxVariation,true);assert.equal(m.errorBudget.refinementDifferenceUsedAsError,false);
    assert.equal(m.arithmetic.binary64UsedForDecisions,false);assert.equal(n.arithmetic.binary64UsedForDecisions,false);
    assert.equal(m.sourceAuthenticated,false);assert.equal(m.originalParametersSubstitutedByGenericValues,false);
    for(const row of Object.values(m.coefficients)){
      assert.equal(row.pass,true);assert.equal(row.signedRemainder,'NONPOSITIVE');
      assert.ok(qcompare(read(row.remainderAbsoluteUpper),read(m.errorBudget.remainderAllocation))<=0);
      assert.ok(qcompare(read(row.arithmeticAndParameterWidth),read(m.errorBudget.arithmeticAndParameterAllocation))<=0);
      assert.ok(qcompare(read(row.totalWidth),read(m.request.tolerance))<=0);
    }
    for(const row of n.rows)assert.ok(qcompare(read(row.coefficientWidth),read(input.tolerance))<=0);
    assert.match(m.proof.convergenceClaim,/not claimed to converge/);
  });
  await check('exact-positive-source-scale-roots-and-outward-absolute-enclosures-retain-jet-signs',()=>{
    const exponents={loss:-6655,R:-7935,T:-6655,RR:-9216,RT:-7935,TT:-9214},signs={loss:'POSITIVE',R:'POSITIVE',T:'NEGATIVE',RR:'NEGATIVE',RT:'POSITIVE',TT:'POSITIVE'};
    for(const row of p.numerics.rows){
      assert.equal(row.sourceFactorSetToZero,false);
      if(zeroJets.includes(row.id)){assert.equal(row.sign,'ZERO');assert.deepEqual(row.rawAbsoluteEnclosure,{lower:'0',upper:'0'});continue;}
      assert.ok(nonzeroRows.includes(row.id));assert.equal(row.factorStrictUpperPowerOfTwo,exponents[row.id]);assert.equal(row.sign,signs[row.id]);
      assert.notEqual(G.nodes[p.roots.witnessPositiveFactors[row.id]].op,'rational');
      const scale=Q(1,1n<<BigInt(-exponents[row.id]));
      if(row.sign==='POSITIVE'){
        assert.ok(qcompare(read(row.coefficient.lower),Q(0))>0);assert.equal(row.rawAbsoluteEnclosure.lower,'0');
        assert.equal(row.rawAbsoluteEnclosure.upper,qtext(qmul(read(row.coefficient.upper),scale)));
      }else{
        assert.ok(qcompare(read(row.coefficient.upper),Q(0))<0);assert.equal(row.rawAbsoluteEnclosure.upper,'0');
        assert.equal(row.rawAbsoluteEnclosure.lower,qtext(qmul(read(row.coefficient.lower),scale)));
      }
    }
    const loss=p.numerics.rows.find(r=>r.id==='loss');
    assert.equal(p.numerics.heatFactorEnclosure.lower,qtext(qsub(Q(1),read(loss.rawAbsoluteEnclosure.upper))));
    assert.equal(p.numerics.heatFactorEnclosure.upper,'1');assert.equal(p.numerics.errorBudget.rawRelativePrecisionClaimed,false);
  });
  await check('omitted-second-chain-term-control-fails-and-all-order-written-bound-is-scoped',()=>{
    assert.equal(p.proof.identityAudit.negativeControl.correctlyRejected,true);assert.equal(p.proof.identityAudit.negativeControl.check.pass,false);
    assert.match(p.proof.everyFiniteOrderBound,/Every|every fixed/);assert.match(p.proof.everyFiniteOrderBound,/Only j<=2/);
    assert.equal(p.proof.finiteSeriesNotIdentifiedWithHeat,true);assert.equal(p.scope.newLeanKernelProof,false);
  });
  await check('heat-factor-numerics-do-not-promote-the-whole-F-pulse-covariance-weight-or-M3-gates',()=>{
    assert.equal(p.scope.actualHeatFactorAndNineSlowJetsBound,true);assert.equal(p.scope.actualPositiveParametersPreserved,true);
    for(const key of ['wholeLeadingFJetsEnclosed','actualPulseVolterraJetsEnclosed','wholeCovarianceHEnclosed','determinantOrWeightsEnclosed','wholeGNUMComplete','newLeanKernelProof','m3MayStart'])assert.equal(p.scope[key],false);
    assert.match(p.sourceBinding.referencePluginRole,/No plugin decimal/);
    assert.equal(p.source.decision.originalLargeBandTheoremCounterexample,false);
  });
  await check('copies-and-edited-coefficient-or-source-scope-receipts-are-rejected',()=>{
    assert.throws(()=>assertActualHeatScaledEnclosure({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    const row=p.numerics.rows.find(r=>r.id==='R'),saved=row.coefficient.lower;
    try{row.coefficient.lower='0';assert.throws(()=>assertActualHeatScaledEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{row.coefficient.lower=saved;}
    try{p.scope.wholeGNUMComplete=true;assert.throws(()=>assertActualHeatScaledEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.scope.wholeGNUMComplete=false;}
    assert.equal(assertActualHeatScaledEnclosure(p),true);
  });
  await check('original-integral-node-program-array-and-promoted-metadata-mutations-are-rejected',()=>{
    const root=p.roots.originalLoss,saved=G.nodes[root],nodes=p.program.nodes;
    try{G.nodes[root]={op:'rational',args:['0','1']};assert.throws(()=>assertActualHeatScaledEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{G.nodes[root]=saved;}
    try{p.program.nodes=nodes.slice();assert.throws(()=>assertActualHeatScaledEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.program.nodes=nodes;}
    try{p.program.wholeGNUMComplete=true;assert.throws(()=>assertActualHeatScaledEnclosure(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{delete p.program.wholeGNUMComplete;}
    assert.equal(assertActualHeatScaledEnclosure(p),true);
  });
  await check('later-graph-appends-preserve-source-and-numerical-certificate-prefixes',async()=>{
    const before=await actualHeatScaledEnclosureCertificateFromProgram(p),count=p.program.nodes.length;
    G.fresh('after_actual_heat_scaled_certificate');
    assert.deepEqual(await actualHeatScaledEnclosureCertificateFromProgram(p),before);
    assert.deepEqual(await actualEllOneCovarianceObstructionCertificateFromProgram(p.source),sourceCertificate);
    assert.equal(p.program.nodes.length,count);assert.equal(G.nodes.length,count+1);assert.equal(p.source.program.nodes.length,sourceCount);
  });
  await check('executed-literal-source-import-bytes-remain-unchanged',()=>assert.deepEqual(sourceManifest(),record.sourceManifest));
  record.certificate=await actualHeatScaledEnclosureCertificateFromProgram(p);
  record.originalSourceGraph=sourceCertificate.graph;record.originalSourceScope=sourceCertificate.decision;
  record.sourceManifestUnchangedAfterRun=true;record.scope={...record.scope,...p.scope};record.pass=true;record.status='EXECUTED_VERIFIED_SCOPED';record.exitCode=0;
}catch(error){record.pass=false;record.status='FAILED';record.exitCode=1;record.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack};process.exitCode=1;}
record.elapsedMs=performance.now()-started;record.peakRSSBytes=process.resourceUsage().maxRSS*1024;
log({event:'FINISH',pass:record.pass,exitCode:record.exitCode,checks:record.checks,graph:record.certificate?{sha256:record.certificate.graph.sha256,nodeCount:record.certificate.graph.nodeCount,canonicalBytes:record.certificate.graph.canonicalBytes}:null,
  elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,...(record.error?{error:record.error}:{})});
record.log={path:relative(logPath),sha256:digest(fs.readFileSync(logPath))};
fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
