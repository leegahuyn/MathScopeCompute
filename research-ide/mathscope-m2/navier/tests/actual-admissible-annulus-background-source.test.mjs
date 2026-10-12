import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {prepareActualAdmissibleAnnulusBackground,assertActualAdmissibleAnnulusBackground,actualAdmissibleAnnulusBackgroundCertificateFromProgram} from '../actual-admissible-annulus-background.mjs';
import {assertActualCompletedBackgroundC2} from '../actual-residual-order-induction-background.mjs';
import {assertActualBackgroundPhysicalSeminorms} from '../actual-background-physical-seminorms.mjs';
import {sourceGraphRationalIdentity} from '../actual-continuation-exact-identities.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

const repository=fileURLToPath(new URL('../../../../',import.meta.url)),relative=f=>path.relative(repository,f).split(path.sep).join('/'),digest=b=>createHash('sha256').update(b).digest('hex');
function manifest(){
  const seen=new Map(),pending=[fileURLToPath(import.meta.url)];while(pending.length){
    const file=pending.pop();if(seen.has(file))continue;const bytes=fs.readFileSync(file),body=bytes.toString('utf8');seen.set(file,digest(bytes));
    for(const m of [...body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),...body.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)])
      if(m[1].startsWith('.'))pending.push(path.resolve(path.dirname(file),m[1]));
  }
  const files=Object.fromEntries([...seen].map(([file,sha])=>[relative(file),sha]).sort(([a],[b])=>a.localeCompare(b)));
  return {scope:'Literal local import closure of this exact actual annulus source runner.',fileCount:seen.size,files,sha256:digest(canonicalStringify(files))};
}
const evidence=process.env.MATHSCOPE_ANNULUS_BACKGROUND_EVIDENCE_DIR,stem=process.env.MATHSCOPE_ANNULUS_BACKGROUND_RECEIPT_STEM??'actual-admissible-annulus-background-source';assert.match(stem,/^[a-z0-9-]+$/);
const target=evidence?path.join(path.resolve(evidence),stem+'.json'):null;if(target){fs.mkdirSync(path.dirname(target),{recursive:true});assert.ok(!fs.existsSync(target),'Preserve every previous source attempt.');}
const before=manifest(),started=performance.now(),sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:repository,encoding:'utf8'}).trim(),executed=[],progress=[];
const sourceTest=(name,fn)=>test(name,async()=>{try{await fn();executed.push({id:name,pass:true});}catch(e){executed.push({id:name,pass:false,message:e.message});throw e;}});let p;
try{p=prepareActualAdmissibleAnnulusBackground({}, {onProgress:row=>{const event={...row,elapsedMs:performance.now()-started,rssBytes:process.memoryUsage().rss};progress.push(event);console.log('# annulus-source '+JSON.stringify(event));}});}
catch(e){const record={schema:'MathScope.ActualAdmissibleAnnulusSourceFailure/1',generatedAt:new Date().toISOString(),sourceCommit,sourceManifest:before,
  sourceManifestUnchangedAfterRun:canonicalStringify(manifest())===canonicalStringify(before),progress,error:{code:e.code??null,message:e.message,stack:e.stack},elapsedMs:performance.now()-started,
  peakRSSBytes:process.resourceUsage().maxRSS*1024,actualCertificateIssued:false,pass:false,designedNegativeControl:false};if(target)fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n',{flag:'wx'});throw e;}

sourceTest('the new background consumes the private canonical C2 induction and keeps its original source',()=>{
  assert.equal(assertActualAdmissibleAnnulusBackground(p),true);assert.equal(assertActualCompletedBackgroundC2(p.background),true);
  assert.equal(p.background.prepared.order,3);assert.equal(p.background.induction.allIntegerOrdersBySameWellFoundedRecipe,true);
  assert.equal(p.sourceBinding.oldBackgroundReplaced,false);assert.equal(p.sourceBinding.oldSourceModulesChanged,false);assert.ok(p.checks.every(c=>c.pass));
});

sourceTest('actual physical n1 and n2 constraints enter the enlarged scales without claiming an all-order physical selector',()=>{
  assert.equal(p.physical.norms.length,2);p.physical.norms.forEach(n=>assert.equal(assertActualBackgroundPhysicalSeminorms(n),true));
  assert.deepEqual(p.physical.rows.map(r=>r.request),[{throughOrder:1,derivativeOrder:1},{throughOrder:2,derivativeOrder:2}]);
  for(const row of p.selection.rows){const operands=p.G.nodes[row.logScale].args;for(const c of row.physicalConstraints)assert.ok(operands.includes(c.requiredLog));}
  assert.ok(p.selection.rows[1].physicalConstraints.some(x=>x.kind==='normalized-higher-stress-over-zeta'));
  assert.equal(p.scope.allOrderPhysicalCutoffClausesComplete,false);
});

sourceTest('the first scale contains the actual threshold and the second contains the necessary sixteenfold gap',()=>{
  const G=p.G,q=(n,d=1)=>G.q(n,d),[first,second]=p.selection.rows;
  assert.equal(first.smallBand,G.mul(G.add(p.selection.sourceEllMinimum,q(10)),G.log(q(2))));
  assert.ok(G.nodes[first.logScale].args.includes(first.smallBand));assert.equal(second.growth,G.add(first.logScale,G.log(q(16))));
  for(const [j,row]of p.selection.rows.entries()){assert.equal(row.historicalLogScale,p.background.cutoffs.rows[j].logScale);assert.ok(G.nodes[row.logScale].args.includes(row.historicalLogScale));}
  assert.equal(p.selection.distinctBackground,true);assert.equal(p.band.sameAsHistoricalCanonicalField,false);
});

sourceTest('the exact original dyadic label and its whole physical band are source-only and below qStar',()=>{
  const G=p.G,q=(n,d=1)=>G.q(n,d),ell=G.ceiling(G.div(G.add(G.log(q(4)),p.selection.rows[0].logScale),G.log(q(2))));
  assert.equal(p.selection.ell,ell);assert.equal(p.selection.Q,G.exp(G.neg(G.mul(ell,G.log(q(2))))));
  assert.equal(p.band.sourceQStarRatioUpper,q(1,128));assert.equal(p.band.firstOrderPlateau,true);assert.equal(p.band.allOrdersFromTwoInactive,true);
  for(const root of [p.selection.ell,p.selection.Q,p.selection.S,p.selection.epsilon,p.selection.sourceEllMinimum,p.selection.sourceQStar,...p.selection.rows.map(x=>x.scale)])assert.equal(G.freeCoordinates(root).size,0);
  assert.equal(p.band.unknownOriginalGammaMembership,'NOT_EVALUATED');assert.equal(p.band.allDyadicBandsCovered,false);
});

sourceTest('the exact one-active-order body retains the actual F1 U1 stream and radial term everywhere on the enlarged annulus',()=>{
  const G=p.G,q=(n,d=1)=>G.q(n,d),{X}=p.coordinates,r=p.background.prepared.records,w=p.roots.firstOrderPower,
    body=x=>G.expressionSystems[G.nodes[x].args[0]].body;
  assert.equal(w,G.exp(G.mul(q(2),G.parameter('h'),G.log(p.coordinates.q))));
  assert.equal(body(p.profile.F),G.add(r[0].global.F,G.mul(w,r[1].global.F)));
  assert.equal(body(p.profile.G),G.add(r[0].global.U,G.mul(w,r[1].global.U)));
  assert.equal(body(p.profile.stream),G.add(p.background.prepared.bootstrap.finalM,G.mul(w,r[1].global.M)));
  assert.equal(body(p.profile.b),G.div(G.add(G.mul(X,r[0].global.v),G.mul(w,X,r[1].global.v)),G.sqrt(G.mul(q(2),X))));
  assert.notEqual(r[1].global.F,G.zero);assert.equal(p.band.actualActiveOrderOneRetained,true);assert.equal(p.band.completeForEveryDoublingContinuation,true);
});

sourceTest('original nonreduced cutoff bodies remain recorded and the exact band arguments explain every reduction',()=>{
  const G=p.G,q=(n,d=1)=>G.q(n,d),node=G.nodes[p.cutoff.body];assert.equal(node.op,'smooth_piecewise');assert.equal(node.args[1],q(1,2));assert.equal(node.args[2],G.one);
  for(const [j,row]of p.rawRows.entries()){
    assert.equal(row.argument,G.mul(p.selection.rows[j].scale,p.coordinates.q));assert.equal(row.chi,G.expressionValue(p.cutoff.system,[row.argument]));
    assert.equal(row.extra,G.mul(row.argument,G.expressionValue(p.cutoff.system,[row.argument],[1])));assert.equal(row.reducedChi,j===0?G.one:G.zero);assert.equal(row.reducedExtra,G.zero);
  }
  assert.equal(p.selection.arithmetic.secondScaleTimesPhysicalQLower,'1');assert.equal(p.transfer.eulerAudit.pass,true);
  assert.equal(p.transfer.sameFieldValuesAsCanonicalClaimed,false);
});

sourceTest('the actual finite n2 block and unchanged C2 constants are transferred with the same Euler cutoff bounds',()=>{
  assert.deepEqual(p.transfer.oldC2Roots,p.transfer.newC2Roots);assert.deepEqual(p.transfer.oldC2Roots,p.background.roots);
  assert.ok(p.background.chart.finiteBlock.finite.some(x=>x.order===2));assert.equal(p.transfer.c2ConstantsUnchanged,true);assert.equal(p.transfer.completeNormalizedInductionConsumed,true);
  assert.match(p.transfer.diagonal,/b_n>=c_n/);assert.match(p.transfer.potentialExplanation,/next Euler jet/);assert.equal(p.transfer.originalPotentialIdentity.pass,true);
});

sourceTest('the original slow F normalization is present before all actual R Z T derivatives',()=>{
  const G=p.G,{R,Z,T}=p.slow.coordinates,{s,X,eta,q:actualQ}=p.slow.chart,cp=p.coordinates,at=x=>G.simultaneousSubstitute(x,[cp.q,cp.X,cp.eta],[actualQ,X,eta]),
    exponent=G.neg(G.add(G.core.A,G.q(1,2))),scale=G.exp(G.mul(exponent,G.log(s))),slowF=G.expressionSystems[G.nodes[p.slow.fields.F].args[0]].body;
  assert.equal(slowF,G.mul(scale,at(p.profile.F)));assert.notEqual(slowF,at(p.profile.F));
  for(const name of ['F','G','b']){
    assert.equal(p.slow.jets[name].length,10);
    for(const row of p.slow.jets[name]){let direct=p.slow.fields[name];for(const [v,n]of [[R,row.orders[0]],[Z,row.orders[1]],[T,row.orders[2]]])for(let k=0;k<n;k++)direct=G.derivative(direct,v);assert.equal(row.root,direct);}
    for(const x of G.freeCoordinates(p.slow.fields[name]))assert.ok([R,Z,T].includes(x));
  }
  assert.equal(p.scope.actualSourceSlowJetsThrough,2);
});

sourceTest('new H positivity inner flat extension all physical clauses and M3 are not promoted by the cutoff result',()=>{
  for(const k of ['actualNewCovarianceHConstructed','actualNewPositiveWeightsProved','innerFlatSquareRootExtension','wholeGPOSComplete','wholePhysicalResidualAndFlatErrorComplete','newAnalyticLeanKernelProof','m3MayStart'])assert.equal(p.scope[k],false);
  assert.equal(p.selection.sourceThreshold.actualNewPulseOperatorChecked,false);assert.equal(p.scope.actualWholeAnnulusOneActiveOrderBandConstructed,true);
});

sourceTest('copied reports changed source constants and removed physical witnesses lose private source authority',()=>{
  assert.throws(()=>assertActualAdmissibleAnnulusBackground({...p}),{code:'INVALID_SOURCE_CONSTRUCTION'});
  const original=p.sourceThreshold.constants.Bnorm;p.sourceThreshold.constants.Bnorm=p.G.one;assert.throws(()=>assertActualAdmissibleAnnulusBackground(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.sourceThreshold.constants.Bnorm=original;
  const norms=p.physical.norms;p.physical.norms=[];assert.throws(()=>assertActualAdmissibleAnnulusBackground(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.physical.norms=norms;
  const old=p.background.roots.FGErrorConstant;p.background.roots.FGErrorConstant=p.G.one;assert.throws(()=>assertActualAdmissibleAnnulusBackground(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.background.roots.FGErrorConstant=old;
  assert.equal(assertActualAdmissibleAnnulusBackground(p),true);
});

sourceTest('fixed program prefix metadata and node arrays are sealed while later independent appends are allowed',async()=>{
  const initial=await actualAdmissibleAnnulusBackgroundCertificateFromProgram(p),nodes=p.program.nodes;p.program.nodes=nodes.slice();assert.throws(()=>assertActualAdmissibleAnnulusBackground(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.program.nodes=nodes;
  p.program.claimAllBands=true;assert.throws(()=>assertActualAdmissibleAnnulusBackground(p),{code:'INVALID_SOURCE_CONSTRUCTION'});delete p.program.claimAllBands;
  const root=p.roots.b1,original=p.G.nodes[root];p.G.nodes[root]={op:'rational',args:['1','1']};assert.throws(()=>assertActualAdmissibleAnnulusBackground(p),{code:'INVALID_SOURCE_CONSTRUCTION'});p.G.nodes[root]=original;
  p.G.fresh('post_issued_annulus_independent_coordinate');assert.equal((await actualAdmissibleAnnulusBackgroundCertificateFromProgram(p)).graph.sha256,initial.graph.sha256);
});

sourceTest('the actual source receipt binds all executed groups to the immutable literal import closure',async()=>{
  const after=manifest(),certificate=await actualAdmissibleAnnulusBackgroundCertificateFromProgram(p),priorPass=executed.every(x=>x.pass);
  const record={schema:'MathScope.ActualAdmissibleAnnulusBackgroundSourceTest/1',generatedAt:new Date().toISOString(),sourceCommit,
    command:['node','--max-old-space-size=3072','--test','--test-reporter=tap',relative(fileURLToPath(import.meta.url))],mode:'DIRECT_ACTUAL_ANNULUS_CUTOFF_ENLARGEMENT_SOURCE',
    runtime:{node:process.version,v8:process.versions.v8,platform:process.platform,architecture:process.arch},sourceManifest:before,sourceManifestUnchangedAfterRun:canonicalStringify(after)===canonicalStringify(before),
    progress,certificate,executedChecks:[...executed,{id:'the actual source receipt binds all executed groups to the immutable literal import closure',pass:priorPass&&canonicalStringify(after)===canonicalStringify(before)}],
    executedTestGroupCount:executed.length+1,elapsedMs:performance.now()-started,peakRSSBytes:process.resourceUsage().maxRSS*1024,scope:p.scope,pass:priorPass&&canonicalStringify(after)===canonicalStringify(before)};
  if(target)fs.writeFileSync(target,JSON.stringify(record,null,2)+'\n',{flag:'wx'});assert.equal(record.pass,true);assert.equal(certificate.pass,true);
});
