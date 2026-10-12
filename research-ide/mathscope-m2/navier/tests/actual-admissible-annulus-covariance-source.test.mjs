import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualAdmissibleAnnulusCovariance,assertActualAdmissibleAnnulusCovariance,actualAdmissibleAnnulusCovarianceCertificateFromProgram} from '../actual-admissible-annulus-covariance.mjs';
import {assertActualAdmissibleAnnulusBackground} from '../actual-admissible-annulus-background.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=f=>path.relative(repository,f).split(path.sep).join('/'),digest=b=>createHash('sha256').update(b).digest('hex');
function manifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];while(pending.length){
    const file=pending.pop();if(seen.has(file))continue;const bytes=fs.readFileSync(file),body=bytes.toString('utf8');seen.set(file,digest(bytes));
    for(const m of [...body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...body.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)])
      if(m[1].startsWith('.'))pending.push(path.resolve(path.dirname(file),m[1]));
  }
  const files=Object.fromEntries([...seen].map(([file,sha])=>[relative(file),sha]).sort(([a],[b])=>a.localeCompare(b)));
  return{scope:'Literal local import closure of this actual whole-annulus H runner.',fileCount:seen.size,files,sha256:digest(canonicalStringify(files))};
}
const evidence=process.env.MATHSCOPE_ANNULUS_COVARIANCE_EVIDENCE_DIR,stem=process.env.MATHSCOPE_ANNULUS_COVARIANCE_RECEIPT_STEM??'actual-admissible-annulus-covariance-source';assert.match(stem,/^[a-z0-9-]+$/);
const target=evidence?path.join(path.resolve(evidence),stem+'.json'):null;if(target){fs.mkdirSync(path.dirname(target),{recursive:true});assert.ok(!fs.existsSync(target),'Preserve previous source attempts.');}
const before=manifest(),started=performance.now(),sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),executed=[],progress=[];
const sourceTest=(name,fn)=>test(name,async()=>{try{await fn();executed.push({id:name,pass:true});}catch(e){executed.push({id:name,pass:false,message:e.message});throw e;}});let p;
try{p=prepareActualAdmissibleAnnulusCovariance({}, {onProgress:row=>{const event={...row,elapsedMs:performance.now()-started,rssBytes:process.memoryUsage().rss};progress.push(event);console.log('# annulus-H-source '+JSON.stringify(event));}});}
catch(e){const record={schema:'MathScope.ActualAnnulusCovarianceSourceFailure/1',generatedAt:new Date().toISOString(),sourceCommit,sourceManifest:before,sourceManifestUnchangedAfterRun:canonicalStringify(manifest())===canonicalStringify(before),
  progress,error:{code:e.code??null,message:e.message,stack:e.stack},elapsedMs:performance.now()-started,peakRSSBytes:process.resourceUsage().maxRSS*1024,actualCertificateIssued:false,pass:false,designedNegativeControl:false};
  if(target)fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n',{flag:'wx'});throw e;}

sourceTest('the authentic whole-annulus b_n background is reproduced and privately bound',async()=>{
  assert.equal(assertActualAdmissibleAnnulusCovariance(p),true);assert.equal(assertActualAdmissibleAnnulusBackground(p.source),true);
  const c=await actualAdmissibleAnnulusCovarianceCertificateFromProgram(p);assert.equal(c.background.graph.sha256,'c2e0e84547b245eb3687ecc8b78d94badfcf3efbddc191b5f7ef2de6f65867ed');
  assert.equal(p.source.scope.actualN1TermNotDropped,true);assert.ok(p.checks.every(c=>c.pass));
});
sourceTest('the original n1 correction and slow factors enter both actual phase speeds',()=>{
  const G=p.G,q=(n,d=1)=>G.q(n,d);
  assert.deepEqual(p.fields,p.source.slow.fields);assert.notEqual(p.fields.F,p.leadingFields.F);assert.notEqual(p.fields.G,p.leadingFields.G);
  for(const f of p.families){assert.equal(f.phaseSpeed,G.add(G.mul(f.carrier.p,p.fields.F),G.mul(f.carrier.pz,p.fields.G)));assert.equal(f.frame.principalK[0][1],G.neg(G.mul(q(2),p.fields.F)));}
  assert.equal(p.sourceBinding.terminalOnlySupportReductionUsed,false);assert.equal(p.sourceBinding.originalEllOneOperatorReused,false);
});
sourceTest('source-only B and the original all-order C2 bounds control the retained actual matrices',()=>{
  const G=p.G,{Bnorm,E}=p.constants;assert.equal(E,G.pow(Bnorm,256));assert.equal(G.freeCoordinates(Bnorm).size,0);
  assert.deepEqual(p.bounds.primitive.sourceInputs.actualC2Roots,p.source.transfer.newC2Roots);assert.equal(p.bounds.operatorPowerAudit.pass,true);
  assert.ok(Object.values(p.bounds.operatorPowerAudit.computed).every(n=>n<256));
  assert.equal(p.bounds.writtenUniversalEnlargedSourceNormArgument,true);assert.equal(p.bounds.allBandsLiteralGraphsMaterialized,false);
});
sourceTest('the exact selected band, palette and positive length use the same sufficient source selector',()=>{
  const G=p.G,q=(n,d=1)=>G.q(n,d),g=p.geometry;
  assert.equal(g.ell,p.source.selection.ell);assert.equal(g.Q,p.source.selection.Q);assert.equal(g.S,G.pow(g.ell,2));assert.equal(p.selection.entireBandSourceQStarRatioUpper,q(1,128));
  assert.equal(g.k,G.ceiling(G.inv(G.sqrt(g.epsilon))));assert.equal(g.Ls,G.div(G.mul(q(2),g.r0),g.ci));
  assert.deepEqual(g.lengthRatioBounds,[p.bounds.recipe.input.lengthRatioLower,p.bounds.recipe.input.lengthRatioUpper]);
  for(const x of [g.ell,g.Q,g.S,g.epsilon,g.k,g.ci,g.Ls,p.selection.sourceEllMinimum,p.selection.sourceQStar])assert.equal(G.freeCoordinates(x).size,0);
});
sourceTest('the order-zero reference and every carrier label remain independent of all slow derivatives',()=>{
  const G=p.G,{R,Z,T,v}=p.coordinates;
  assert.equal(p.frozen.orderZero,true);assert.equal(p.frozen.F0,G.simultaneousSubstitute(p.leadingFields.F,[R,Z,T],[p.frozen.Rrep,p.frozen.Zrep,p.frozen.Trep]));
  for(const f of p.families)for(const x of [f.carrier.p,f.carrier.pz,f.carrier.x0,p.frozen.c0,p.frozen.lambda0])for(const a of [R,Z,T,v])assert.equal(G.derivative(x,a),G.zero);
  assert.ok(p.families.every(f=>f.carrier.nonzeroAngularInteger));
});
sourceTest('both moving pressure terms, moving bases and their original normalized ODEs are retained',()=>{
  const G=p.G,{v}=p.coordinates,{dot}=awaitableAlgebra();
  function awaitableAlgebra(){return{dot:(a,b)=>G.add(...a.map((x,i)=>G.mul(x,b[i]))) };}
  for(const f of p.families){
    assert.deepEqual(f.frame.BPrime,f.frame.B.map(row=>row.map(x=>G.derivative(x,v))));
    for(let i=0;i<3;i++)for(let j=0;j<3;j++){
      const pressure=G.sub(G.add(...f.frame.principalK.map((row,k)=>G.mul(f.frame.n[k],row[j]))),f.frame.nPrime[j]);
      assert.equal(f.frame.Aphi[i][j],G.add(G.neg(f.frame.principalK[i][j]),G.div(G.mul(f.frame.n[i],pressure),dot(f.frame.n,f.frame.n))));
    }
    const system=G.covarianceSystems[f.system];assert.deepEqual(system.matrix,f.frame.wMatrix);assert.deepEqual(system.initial,[G.one,G.zero]);
    assert.equal(system.length,p.geometry.Ls);assert.equal(system.normUpper,p.constants.matrixNorm);assert.equal(f.initial.finitePartialSumUsed,false);
  }
});
sourceTest('the original transverse mass, angular half, Haar and two full covariance integrands survive',()=>{
  const G=p.G,{v}=p.coordinates,g=p.geometry,q=(n,d=1)=>G.q(n,d);
  assert.equal(g.angularAverage,q(1,2));assert.equal(g.haarFactor,G.mul(q(1,2),g.Dgeom,g.ci,p.cutoffs.transverseMass));assert.equal(p.cutoffs.transverseMassNormalizedToOne,false);
  for(const f of p.families){for(const[name,j]of[['theta',1],['z',2]])assert.equal(f.covariance[name],G.mul(g.haarFactor,G.integral(G.mul(G.pow(p.cutoffs.psi,2),f.t[0],f.t[j]),v,G.zero,g.Ls)));
    assert.equal(f.covariance.mass,G.mul(g.haarFactor,G.integral(G.mul(G.pow(p.cutoffs.psi,2),G.pow(f.t[0],2)),v,G.zero,g.Ls)));}
});
sourceTest('the target keeps the actual full leading moments, pressure and both viscosity shear terms',()=>{
  const G=p.G,raw=p.target.raw,q=(n,d=1)=>G.q(n,d),{X}=raw.coordinates;
  assert.equal(raw.F,p.source.background.prepared.records[0].global.F);assert.equal(raw.M,p.source.background.prepared.bootstrap.finalM);
  assert.equal(raw.Pi,G.add(G.core.P0,raw.Cp));assert.equal(raw.terms.thetaShear,G.mul(q(2),X,G.derivative(raw.F,X)));
  assert.equal(raw.terms.zShear,G.div(G.mul(q(2),X,G.derivative(raw.U,X)),G.sqrt(G.mul(q(2),X))));
  assert.equal(raw.chartFactor,G.exp(G.mul(G.neg(G.add(p.constants.A,q(1,2))),G.log(p.chart.s))));assert.equal(raw.originalCompletedSourceRetained,true);
});
sourceTest('the two actual inverse identities and positive analytic bounds refer to this H',()=>{
  const G=p.G,q=(n,d=1)=>G.q(n,d),t=p.target,qt=p.quantitative;
  assert.ok(t.inverseChecks.every(c=>c.pass));assert.deepEqual(t.H,[p.families.map(f=>f.covariance.theta),p.families.map(f=>f.covariance.z)]);
  assert.equal(qt.absoluteDeterminantLower,G.mul(q(15,8),qt.Ac,p.constants.u,...p.families.map(f=>f.covariance.mass)));
  assert.equal(qt.massLower,G.mul(p.geometry.haarFactor,p.bounds.recipe.mass.massLowerCoefficient,G.sqrt(p.geometry.Ls)));
  assert.equal(p.decision.actualDeterminantSign,'NEGATIVE');assert.deepEqual(p.decision.actualInverseWeightSigns,['POSITIVE','POSITIVE']);
});
sourceTest('the nonterminal witness substitutes all slow and representative variables without replacing its n1 body',()=>{
  const G=p.G,w=p.roots.witness;assert.equal(w.X,G.q(110));assert.equal(w.X,w.Xrep);assert.notEqual(w.actualF,w.leadingF);
  for(const x of [...w.H.flat(),...w.weights,...w.target,w.actualF,w.leadingF])assert.equal(G.freeCoordinates(x).size,0);
  assert.equal(w.activeOrderOneRetainedInFormula,true);assert.equal(w.coefficientNonzeroNumericallyAsserted,false);assert.equal(w.explicitLatticeIndexMaterialized,false);
});
sourceTest('whole-annulus positivity does not declare flat edges, every-band graph, final Gamma or M3 complete',()=>{
  assert.equal(p.decision.actualPositiveWeightsOnOpenWholeAnnulus,true);assert.match(p.chart.positiveWeightDomain,/Xa<X<Xb/);assert.match(p.chart.covarianceDomain,/4\/S\^3/);
  for(const k of ['allBandsLiteralCovarianceGraphsConstructed','allSourceBoxIndicesMaterialized','originalAllOrderPhysicalCutoffSelectionComplete','innerFlatSquareRootExtensionCertified','outerFlatExtensionForThisNewBackgroundCertified','numericalWholeHEnclosure','wholeGPOSComplete','wholePhysicalResidualAndFlatErrorComplete','newAnalyticLeanKernelProof','m3MayStart'])assert.equal(p.decision[k],false);
  assert.equal(p.decision.unknownOriginalGammaMembership,'NOT_EVALUATED');
});
sourceTest('forged objects, changed norms, dropped n1 fields and changed pulse coefficients lose source authority',()=>{
  assert.throws(()=>assertActualAdmissibleAnnulusCovariance({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const oldF=p.fields.F;p.fields.F=p.leadingFields.F;assert.throws(()=>assertActualAdmissibleAnnulusCovariance(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.fields.F=oldF;
  const E=p.bounds.errorConstants.operator;p.bounds.errorConstants.operator=p.G.one;assert.throws(()=>assertActualAdmissibleAnnulusCovariance(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.bounds.errorConstants.operator=E;
  const system=p.G.covarianceSystems[p.families[0].system],old=system.matrix[0][0];system.matrix[0][0]=p.G.zero;assert.throws(()=>assertActualAdmissibleAnnulusCovariance(p),{code:'INVALID_SOURCE_CONSTRUCTION'});system.matrix[0][0]=old;
  assert.equal(assertActualAdmissibleAnnulusCovariance(p),true);
});
sourceTest('issued graph prefix and metadata are immutable while independent later appends preserve its hash',async()=>{
  const first=await actualAdmissibleAnnulusCovarianceCertificateFromProgram(p),nodes=p.program.nodes;p.program.nodes=nodes.slice();assert.throws(()=>assertActualAdmissibleAnnulusCovariance(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.program.nodes=nodes;
  p.program.originalGammaIsComplete=true;assert.throws(()=>assertActualAdmissibleAnnulusCovariance(p),{code:'INVALID_SOURCE_CONSTRUCTION'});delete p.program.originalGammaIsComplete;
  p.G.fresh('independent_after_annulus_covariance_certificate');const next=await actualAdmissibleAnnulusCovarianceCertificateFromProgram(p);assert.equal(first.graph.sha256,next.graph.sha256);
});
sourceTest('the saved result binds every executed source group to the unchanged literal import closure',async()=>{
  const after=manifest(),certificate=await actualAdmissibleAnnulusCovarianceCertificateFromProgram(p),priorPass=executed.every(x=>x.pass),sameFiles=canonicalStringify(after)===canonicalStringify(before),
    record={schema:'MathScope.ActualAdmissibleAnnulusCovarianceSourceTest/1',generatedAt:new Date().toISOString(),sourceCommit,
      command:['node','--max-old-space-size=3072','--test','--test-reporter=tap',relative(fileURLToPath(import.meta.url))],mode:'DIRECT_ACTUAL_WHOLE_ANNULUS_COVARIANCE_SOURCE',
      runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},sourceManifest:before,sourceManifestUnchangedAfterRun:sameFiles,
      progress,certificate,executedChecks:[...executed,{id:'the saved result binds every executed source group to the unchanged literal import closure',pass:priorPass&&sameFiles}],executedTestGroupCount:executed.length+1,
      elapsedMs:performance.now()-started,peakRSSBytes:process.resourceUsage().maxRSS*1024,decision:p.decision,pass:priorPass&&sameFiles};
  if(target)fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n',{flag:'wx'});assert.equal(record.pass,true);assert.equal(certificate.pass,true);
});
