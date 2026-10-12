// One authenticated source per process; reserve the heavy-memory slot.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualTerminalPhysicalVelocityJets,assertActualTerminalPhysicalVelocityJets,actualTerminalPhysicalVelocityJetsCertificateFromProgram} from '../actual-terminal-physical-velocity-jets.mjs';
import {assertActualTerminalHarmonicThirdJets,actualTerminalHarmonicThirdJetsCertificateFromProgram} from '../actual-terminal-harmonic-third-jets.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {SOURCE_PROFILE_ID,sourceExponentContract} from '../source-profile.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

assert.ok(process.argv.length<=4);
const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=file=>path.relative(repository,file).split(path.sep).join('/'),digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const directory=process.argv[2]?path.resolve(process.argv[2]):fileURLToPath(new URL('../research/evidence/terminal-physical-jets-20261011/',import.meta.url)),stem=process.argv[3]??'actual-terminal-physical-velocity-jets-source';
assert.match(stem,/^[a-z0-9-]+$/);fs.mkdirSync(directory,{recursive:true});
const recordPath=path.join(directory,stem+'.json'),logPath=path.join(directory,stem+'.log');assert.ok(!fs.existsSync(recordPath)&&!fs.existsSync(logPath),'Never overwrite an earlier actual-source run.');
function manifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];
  while(pending.length){
    const file=pending.pop();if(seen.has(file))continue;const bytes=fs.readFileSync(file),body=bytes.toString('utf8');seen.set(file,digest(bytes));
    for(const match of [...body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...body.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)])
      if(match[1].startsWith('.'))pending.push(path.resolve(path.dirname(file),match[1]));
  }
  const files=Object.fromEntries([...seen].map(([f,h])=>[relative(f),h]).sort(([a],[b])=>a.localeCompare(b)));
  return {scope:'Literal local import closure of this exact actual physical source runner, including its own bytes.',fileCount:seen.size,files,sha256:digest(canonicalStringify(files))};
}
const input={sourceProfile:SOURCE_PROFILE_ID,terms:1},started=performance.now(),deadline=started+180000,
  record={schema:'MathScope.ActualTerminalPhysicalVelocityJetsSourceCheck/1',generatedAt:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),
    command:[process.execPath,...process.execArgv,relative(fileURLToPath(import.meta.url)),...process.argv.slice(2)],input,inputSHA256:digest(canonicalStringify(input)),
    mode:'DIRECT_AUTHENTIC_SELECTED_TERMINAL_PHYSICAL_VELOCITY_SPACE2_TIME1',runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},sourceManifest:manifest(),checks:[],progress:[]};
const log=value=>{const line=JSON.stringify(value);fs.appendFileSync(logPath,line+'\n');console.log(line);},
  check=async(id,fn)=>{await fn();record.checks.push({id,pass:true});log({event:'CHECK',id,pass:true});},
  context={checkCancelled:()=>{if(performance.now()>deadline)throw Object.assign(Error('The actual physical source exceeded its declared 180-second budget.'),{code:'RESOURCE_LIMIT'});},onProgress:step=>{
    global.gc?.();const row={...step,elapsedMs:performance.now()-started,rssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed};record.progress.push(row);log({event:'PROGRESS',...row});
  }};
log({event:'START',inputSHA256:record.inputSHA256,sourceManifestSHA256:record.sourceManifest.sha256,sourceFiles:record.sourceManifest.fileCount});
try{
  const p=prepareActualTerminalPhysicalVelocityJets(input,context),{G}=p,harmonic=p.harmonic,coefficient=harmonic.coefficientSource,source=coefficient.source,
    originalCertificate=await actualTerminalHarmonicThirdJetsCertificateFromProgram(harmonic),{R,Z,T,theta,xi,v}=p.coordinates,q=(n,d=1)=>G.q(n,d),pow=(x,a)=>G.exp(G.mul(a,G.log(x)));
  await check('private-original-harmonic-source-and-frozen-graph-reproduced',()=>{
    assert.equal(assertActualTerminalPhysicalVelocityJets(p),true);assert.equal(assertActualTerminalHarmonicThirdJets(harmonic),true);
    assert.equal(originalCertificate.graph.sha256,'235374c4fe2bfe79912ed0a653c594864fc6a221c92f1142bef5ac0665bf0cd6');assert.equal(originalCertificate.graph.nodeCount,376092);
    assert.equal(originalCertificate.graph.canonicalBytes,15852199);assert.ok(p.checks.every(c=>c.pass));assert.equal(p.checks.length,11);
    assert.equal(p.sourceBinding.parameterExpressionSHA256,sourceExponentContract().parameterExpressionSHA256);assert.equal(p.sourceBinding.sourceProfile,SOURCE_PROFILE_ID);
    assert.deepEqual(G.nodes.slice(0,harmonic.program.nodes.length),harmonic.program.nodes);
  });
  await check('actual-new-band-Q-palette-ci-and-original-fixed-mesh-enter-the-physical-map',()=>{
    const map=p.geometry,g=source.geometry;assert.equal(map.selectedBand.Q,g.Q);assert.notEqual(g.Q,source.operator.geometry.Q);
    for(const name of ['ell','S','epsilon','k','paletteQuotient','paletteIndex','ci','Ls','r0','Dgeom'])assert.equal(map.selectedBand[name],g[name]);
    assert.deepEqual(map.grid,coefficient.slowCutoff.meshLabels);assert.deepEqual(map.basis,source.operator.geometry.rectangleBasis);assert.ok(map.checks.every(c=>c.pass));
    assert.equal(g.Q,G.exp(G.neg(G.mul(g.ell,G.log(q(2))))));assert.equal(g.epsilon,pow(g.Q,source.constants.h));
    assert.equal(g.ci,G.mul(pow(g.Tg,g.paletteIndex),pow(g.Q,G.add(G.one,source.constants.h))));assert.equal(g.Ls,G.div(G.mul(q(2),g.r0),g.ci));
    assert.ok(map.fixedChecks.every(c=>!c.freeSlowOrFast&&c.derivatives.every(x=>x===G.zero)));
  });
  await check('radial-fast-first-and-second-derivatives-come-from-the-original-physical-map-body',()=>{
    const g=p.geometry;assert.equal(g.radialFast,G.derivative(g.radialPrimitive,R));assert.equal(g.radialFastFirst,G.derivative(g.radialFast,R));assert.equal(g.radialFastSecond,G.derivative(g.radialFastFirst,R));
    assert.notEqual(g.radialFastFirst,G.zero);assert.notEqual(g.radialFastSecond,G.zero);
    for(const r of p.rows){assert.equal(r.jets.radialFastBinding.body,g.radialFast);assert.ok(r.jets.radialFastBinding.partials.some(c=>c.order===2));}
    assert.equal(g.chain.ancestorEllOnePulseNotReused,true);assert.equal(g.chain.localOnly,true);
  });
  await check('original-real-potential-rotates-before-all-Cartesian-spatial-and-time-differentiation',()=>{
    const c=G.cosine(theta),s=G.sine(theta);
    for(const[index,r]of p.rows.entries()){
      assert.deepEqual(r.potential,harmonic.rows[index].harmonic.originalBodies.map(b=>b.real));assert.equal(r.originalPhase,source.families[index].phase);
      assert.deepEqual(r.jets.cartesianPotential,[G.sub(G.mul(c,r.potential[0]),G.mul(s,r.potential[1])),G.add(G.mul(s,r.potential[0]),G.mul(c,r.potential[1])),r.potential[2]]);
      assert.equal(r.jets.counts.velocity,3);assert.equal(r.jets.counts.gradient,9);assert.equal(r.jets.counts.symmetricHessian,18);assert.equal(r.jets.counts.time,3);assert.equal(r.jets.counts.pressureGradient,3);
      assert.equal(r.jets.counts.maxPotentialDerivativeOrderUsed,3);assert.equal(r.jets.counts.spaceTimePotentialPartialUsed,true);
    }
  });
  await check('every-used-original-fast-slow-partial-is-materialized-and-no-higher-jet-is-silently-zero',()=>{
    for(const r of p.rows){
      const bindings=[...r.jets.potentialBindings,r.jets.pressureBinding,r.jets.radialFastBinding];
      for(const b of bindings){assert.equal(b.originalBodyBound,true);assert.equal(b.unspecifiedOracle,false);assert.ok(b.partials.every(c=>c.pass&&c.materialized===c.direct));if(b.system!==null)assert.equal(G.expressionSystems[b.system].body,b.body);}
      assert.ok(r.jets.potentialBindings.some(b=>b.partials.some(c=>c.orders[b.parameters.indexOf(xi)]>=2)));
      assert.ok(r.jets.potentialBindings.some(b=>b.partials.some(c=>c.orders[b.parameters.indexOf(theta)]>=2)));
      assert.ok(r.jets.potentialBindings.some(b=>b.partials.some(c=>c.orders[b.parameters.indexOf(v)]>=1)));
      assert.equal(r.jets.unrequestedHigherJetsDeclaredZero,false);assert.equal(r.jets.finiteApproximationSubstitutedForExactBody,false);
    }
  });
  await check('actual-fast-Volterra-time-and-mixed-slow-time-derivatives-use-the-original-ODE-RHS',()=>{
    for(const family of source.families){
      const matrix=family.frame.wMatrix,w=family.w;
      for(let j=0;j<2;j++){
        const expected=G.add(...matrix[j].map((x,k)=>G.mul(x,w[k])));assert.equal(G.derivative(w[j],v),expected);
        const mixed=G.derivative(G.derivative(w[j],R),v),expectedMixed=G.add(...matrix[j].flatMap((x,k)=>[G.mul(G.derivative(x,R),w[k]),G.mul(x,G.derivative(w[k],R))]));
        assert.equal(sourceGraphRationalIdentity(G,G.sub(mixed,expectedMixed),{atomicNodes:[...matrix.flat(),...matrix.flat().map(x=>G.derivative(x,R)),...w,...w.map(x=>G.derivative(x,R))],maxTerms:40000}).pass,true);
      }
    }
  });
  await check('original-full-H-positive-weight-slow-fast-cutoff-and-moving-pressure-row-remain',()=>{
    for(const[index,r]of p.rows.entries()){
      const family=source.families[index];assert.deepEqual(r.originalH,source.target.H);assert.equal(r.originalWeight,source.target.weights[index]);assert.equal(r.originalSquareRoot,source.target.squareRootWeights[index]);
      assert.deepEqual(r.sourcePressureRow,family.frame.pressureImaginaryRow);
      const expectedAmplitude=G.mul(coefficient.slowCutoff.body,G.sqrt(source.geometry.epsilon),source.target.squareRootWeights[index],source.cutoffs.chi,source.cutoffs.psi);
      assert.equal(r.pressureAmplitude,expectedAmplitude);assert.equal(r.pressureImaginary,G.mul(expectedAmplitude,G.add(...family.frame.pressureImaginaryRow.map((x,j)=>G.mul(x,family.t[j])))));
      assert.equal(r.pressure,G.neg(G.mul(r.pressureImaginary,G.sine(G.mul(source.geometry.k,family.phase)))));
      assert.ok(r.jets.pressureBinding.partials.every(c=>c.order<=1));assert.notEqual(G.derivative(source.cutoffs.chi,xi),G.zero);assert.notEqual(G.derivative(source.cutoffs.psi,v),G.zero);
    }
    assert.deepEqual(G.nodes[source.constants.h],{op:'source_parameter',args:['h']});assert.ok(coefficient.pulses.every(x=>!x.finite.finiteSumIsExactSolution));
  });
  await check('both-signs-map-all40-scaled-roots-with-original-guards-and-eliminate-auxiliary-variables',()=>{
    const independent=[xi,v,...p.geometry.Yi,...p.geometry.templateGrid];
    for(const r of p.rows){
      assert.equal(r.composition.length,40);assert.equal(r.rectangle.sign,r.sign);assert.ok(r.composition.every(c=>c.originalBodyBound&&c.materialized===c.body&&c.independentAuxiliaryEliminated&&c.zeroGuardBeforeVolterraEvaluation&&!c.slowDomainArtificiallyZeroExtended));
      for(const item of r.composition){
        assert.equal(G.nodes[item.timeGuard].op,'smooth_piecewise');assert.equal(G.nodes[item.timeGuard].args[0],r.rectangle.v);
        assert.equal(G.nodes[item.transverseGuard].op,'smooth_piecewise');assert.equal(G.nodes[item.transverseGuard].args[0],r.rectangle.xi);
        assert.ok(independent.every(x=>!G.freeCoordinates(item.mapped).has(x)));assert.ok(!G.freeCoordinates(item.mapped).has(source.cutoffs.xi));
      }
      assert.ok(r.halfChecks.every(c=>c.pass));assert.equal(r.jets.checks.length,19);assert.ok(r.jets.checks.every(c=>c.pass));
    }
    for(const name of ['potential','velocity','gradient','hessian','time','pressureGradient']){
      const a=p.rows[0].mapped[name].flat(),b=p.rows[1].mapped[name].flat(),sum=p.roots.combinedPhysicalJets[name].flat();
      assert.deepEqual(sum,a.map((x,j)=>G.add(x,b[j])));
    }
  });
  await check('all-original-Q-scales-and-local-positive-domain-are-retained-without-global-completion',()=>{
    const Q=source.geometry.Q,{A,h}=source.constants,scales=p.geometry.scales;
    assert.equal(scales.potential,pow(Q,G.sub(q(1,2),A)));assert.equal(scales.velocity,pow(Q,G.neg(A)));assert.equal(scales.gradient,pow(Q,G.neg(G.add(A,q(1,2)))));
    assert.equal(scales.hessian,pow(Q,G.neg(G.add(A,G.one))));assert.equal(scales.time,pow(Q,G.neg(G.add(A,G.one,h))));assert.equal(scales.pressure,pow(Q,G.mul(q(-2),A)));assert.equal(scales.pressureGradient,pow(Q,G.neg(G.add(G.mul(q(2),A),q(1,2)))));
    assert.match(p.domain.originalSource,/canonical c_n/);assert.match(p.domain.slowEdges,/No zero extension at Xplus/);
    assert.equal(p.scope.actualPhysicalSecondVelocityDerivativesConstructed,true);assert.equal(p.scope.actualLocalDivergenceOfCurlProved,true);
    for(const key of ['numericalVelocityOrResidualEnclosed','wholeGNUMComplete','allLabelSeriesControlled','globalPhysicalResidual','flatErrorPackageComplete','fullSameProfileN5','differentStrengthenedBackgroundSubstituted','newAnalyticLeanKernelProof','workerExecution','browserExecution','m3MayStart'])assert.equal(p.scope[key],false);
  });
  await check('edited-geometry-jets-shared-bodies-and-forged-reports-lose-private-source-authority',()=>{
    assert.throws(()=>assertActualTerminalPhysicalVelocityJets({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
    const old=p.rows[0].jets.roots.hessian[0][0];try{p.rows[0].jets.roots.hessian[0][0]=G.zero;assert.throws(()=>assertActualTerminalPhysicalVelocityJets(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.rows[0].jets.roots.hessian[0][0]=old;}
    const oldci=p.geometry.selectedBand.ci;try{p.geometry.selectedBand.ci=source.operator.geometry.ci;assert.throws(()=>assertActualTerminalPhysicalVelocityJets(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.geometry.selectedBand.ci=oldci;}
    const system=G.expressionSystems[p.rows[0].jets.potentialBindings[0].system],body=system.body;try{system.body=G.zero;assert.throws(()=>assertActualTerminalPhysicalVelocityJets(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{system.body=body;}
    try{p.scope.globalPhysicalResidual=true;assert.throws(()=>assertActualTerminalPhysicalVelocityJets(p),{code:'INVALID_SOURCE_CONSTRUCTION'});}finally{p.scope.globalPhysicalResidual=false;}
    assert.equal(assertActualTerminalPhysicalVelocityJets(p),true);
  });
  await check('later-independent-appends-preserve-all-issued-source-certificate-prefixes',async()=>{
    const before=await actualTerminalPhysicalVelocityJetsCertificateFromProgram(p);G.fresh('after_physical_velocity_sealed_prefix');
    assert.deepEqual(await actualTerminalPhysicalVelocityJetsCertificateFromProgram(p),before);assert.deepEqual(await actualTerminalHarmonicThirdJetsCertificateFromProgram(harmonic),originalCertificate);
  });
  await check('all-literal-source-import-bytes-remain-unchanged',()=>assert.deepEqual(manifest(),record.sourceManifest));
  record.certificate=await actualTerminalPhysicalVelocityJetsCertificateFromProgram(p);record.originalHarmonicSourceGraph=originalCertificate.graph;record.scope=p.scope;record.sourceManifestUnchangedAfterRun=true;
  record.status='EXECUTED_VERIFIED_SCOPED';record.pass=true;record.exitCode=0;
}catch(error){record.status='FAILED';record.pass=false;record.exitCode=1;record.error={name:error.name,code:error.code??null,message:error.message,stack:error.stack};process.exitCode=1;}
record.elapsedMs=performance.now()-started;record.peakRSSBytes=process.resourceUsage().maxRSS*1024;
log({event:'FINISH',pass:record.pass,exitCode:record.exitCode,checks:record.checks,graph:record.certificate?.graph?{sha256:record.certificate.graph.sha256,nodeCount:record.certificate.graph.nodeCount,canonicalBytes:record.certificate.graph.canonicalBytes}:null,
  elapsedMs:record.elapsedMs,peakRSSBytes:record.peakRSSBytes,...(record.error?{error:record.error}:{})});
record.log={path:relative(logPath),sha256:digest(fs.readFileSync(logPath))};fs.writeFileSync(recordPath,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
