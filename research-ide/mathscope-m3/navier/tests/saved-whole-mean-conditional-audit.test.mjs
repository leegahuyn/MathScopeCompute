import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createIndependentMeanReader} from '../source-saved-whole-mean-direct-audit.mjs';
import {createFactoredRationalVerifier} from '../forced-rational-identity.mjs';
import {openSavedInitializedSource} from '../source-saved-initialized-authority.mjs';
import {attachSavedInitializedNormFamily} from '../source-saved-initialized-norm-family.mjs';
import {attachSavedInitializedCutoffAuthority} from '../source-saved-initialized-cutoff-norms.mjs';
import {createConditionalFTCImporter,reconstructConditionalConservativeMean,collectConditionalMeanDiagnostics,auditSavedWholeMeanConditional,assertSavedWholeMeanConditionalAudit} from '../source-saved-whole-mean-conditional-audit.mjs';

function fixture(){
  const nodes=[{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},...['R','Z','T','Y0','Y1'].map(x=>({op:'coordinate',args:[x]}))];
  const put=(op,args)=>{const id=nodes.length;nodes.push({op,args});return id;},node=id=>nodes[id],sum=xs=>xs.reduce((a,b)=>put('add',[a,b]));
  const groups=[];for(let group=0;group<3;group++){
    const faces=[];for(let mask=0;mask<8;mask++){
      let value=put('sqrt_positive',[put('add',[1,put('integer_power',[2,2])])]);
      for(let j=0;j<3;j++)if(mask&(1<<j)){const bound=put('coordinate',[`face-${group}-${mask}-${j}`]);value=put('definite_integral',[value,bound,0,1]);}
      faces.push(value);
    }groups.push(sum(faces));
  }
  const aggregate=put('add',[groups[0],put('add',[groups[1],groups[2]])]),maximum=put('maximum',[1,aggregate]),G=createIndependentMeanReader({node}),
    input={geometry:{R:2,Z:3,T:4,Y:[5,6],epsilon:1,ci:1,radialFast:0,vr:[1,1],vt:[1,1]},background:{b:0,V:0,G:0},velocity:{beta:0,v:0,gamma:0},covariance:{rr:0,rtheta:0,rz:0,thetatheta:0,thetaz:0,zz:0},stress:[0,0],pressure:0};
  return {nodes,put,node,aggregate,maximum,G,input};
}

test('conditional replacement requires all three FTC anchors and retains every analytic/capture premise',()=>{
  const f=fixture(),importer=createConditionalFTCImporter(f.G,{node:f.node,maximum:f.maximum}),x=f.put('multiply',[f.maximum,3]),Z=f.G.importSource(3),verify=createFactoredRationalVerifier(f.G),changed=importer.at(x);
  assert.equal(importer.proof.faces.length,24);assert.deepEqual(importer.proof.faceDimensionCounts,[3,9,9,3]);
  assert.equal(verify(f.G.sub(f.G.derivative(changed,Z),f.G.importSource(f.aggregate))).pass,true);
  assert.equal(importer.sourceAuthenticated,false);assert.equal(importer.allAnalyticPremisesProved,false);
  const hypotheses=f.G.diagnostics().domainHypotheses;
  assert.equal(hypotheses.filter(h=>h.kind==='CONDITIONAL_ORIGINAL_FTC_MAXIMUM').length,3);
  assert.ok(hypotheses.some(h=>h.kind==='ORIGINAL_FTC_CAPTURE_CLOSURE'));
  assert.ok(hypotheses.every(h=>h.provedByThisAudit===false));
  assert.throws(()=>createConditionalFTCImporter(f.G,{node:f.node,maximum:f.maximum,globalSmoothnessProved:true}));
  assert.throws(()=>createConditionalFTCImporter(f.G,{node:id=>f.node(id),maximum:f.maximum}));
  const bad=fixture();bad.nodes[bad.maximum]={op:'maximum',args:[1,2]};assert.throws(()=>createConditionalFTCImporter(bad.G,{node:bad.node,maximum:bad.maximum}));
});

test('conditional conservative recomputation retains full pressure and vector swirl viscosity',()=>{
  const f=fixture(),importer=createConditionalFTCImporter(f.G,{node:f.node,maximum:f.maximum}),verify=createFactoredRationalVerifier(f.G);
  f.input.velocity.v=f.put('integer_power',[2,2]);f.input.pressure=f.put('multiply',[f.maximum,3]);
  const rebuilt=reconstructConditionalConservativeMean(f.G,f.input,importer),B=f.G.importSource(f.aggregate);
  assert.equal(verify(f.G.sub(rebuilt.Etheta,f.G.q(-3))).pass,true);
  assert.equal(verify(f.G.sub(rebuilt.Ez,B)).pass,true);assert.equal(verify(f.G.sub(rebuilt.pressureZ,B)).pass,true);
  assert.equal(verify(rebuilt.Ez).pass,false,'Omitting the latest pressure gradient must fail.');
  assert.equal(verify(f.G.sub(rebuilt.Etheta,f.G.q(-4))).pass,false,'Omitting cylindrical vector connection term must fail.');
  assert.equal(rebuilt.sixCovarianceRootsRetained,true);assert.equal(rebuilt.sourceAuthenticated,false);
});

test('conditional recomputation does not erase the next exact unknown source operator',()=>{
  const f=fixture(),importer=createConditionalFTCImporter(f.G,{node:f.node,maximum:f.maximum});
  f.input.velocity.v=f.put('opaque_actual_limit',[2]);
  assert.throws(()=>reconstructConditionalConservativeMean(f.G,f.input,importer),{code:'UNRESOLVED_CUSTOM_DERIVATIVE'});
  assert.ok(f.G.diagnostics().unknownSourceOperators.some(r=>r.sourceNode===f.input.velocity.v&&r.operation==='opaque_actual_limit'));
});

test('conditional recomputation records that atomic integral comparisons lack alpha-equivalence certification',()=>{
  const f=fixture(),importer=createConditionalFTCImporter(f.G,{node:f.node,maximum:f.maximum}),body=f.put('exp',[f.put('multiply',[3,5])]),
    integral=f.put('definite_integral',[body,5,0,1]),sourceDerivative=f.put('definite_integral',[f.put('multiply',[5,body]),5,0,1]),Z=f.G.importSource(3),verify=createFactoredRationalVerifier(f.G);
  assert.equal(verify(f.G.sub(f.G.derivative(f.G.importSource(integral),Z),f.G.importSource(sourceDerivative))).pass,true);
  assert.equal(importer.at(integral),f.G.importSource(integral),'A root without the represented maximum keeps its original integral binder.');
  assert.equal(verify(f.G.sub(f.G.derivative(importer.at(integral),Z),importer.at(sourceDerivative))).pass,true);
  const renamed=sourceId=>f.G.substitute(f.G.importSource(sourceId),importer.maximum,importer.selected);
  assert.equal(verify(f.G.sub(f.G.derivative(renamed(integral),Z),renamed(sourceDerivative))).pass,false,
    'The same exact integral can have distinct alpha-renamed atomic node identities; this must never be reported as a PDE counterexample.');
});

test('conditional recomputation preserves evidence when an old diagnostics rule spends exhausted reader work',()=>{
  const f=fixture(),rule={sourceOperation:'fixture_limit',independentOperation:'independent_fixture_limit',importCall(){},differentiate(){},substitute(){},
    diagnostics:G=>{G.assertSourceNodeBinding(2,f.node(2));return {};}};
  const G=createIndependentMeanReader({node:f.node,maxWork:2,sourceOperationRules:[rule]});
  assert.throws(()=>G.importSource(2),{code:'RESOURCE_LIMIT'});
  const d=collectConditionalMeanDiagnostics(G,{maxWork:2,maxNodes:200000});
  assert.equal(d.diagnosticsAvailable,false);assert.equal(d.diagnosticsFailure.code,'RESOURCE_LIMIT');assert.equal(d.diagnosticsFailure.primarySourceStopPreserved,true);
  assert.equal(d.workUsed,null);assert.equal(d.workUsedExact,false);assert.equal(d.scalarNodes,2);assert.equal(d.sourceOperatorAudits,null);
  const broken=createIndependentMeanReader({node:f.node,sourceOperationRules:[{...rule,diagnostics:()=>{throw new TypeError('implementation failure');}}]});
  assert.throws(()=>collectConditionalMeanDiagnostics(broken),{name:'TypeError'},'An unrelated implementation error must remain a test failure.');
});

let pending;
const setup=()=>pending||=(async()=>{const cap=await openSavedInitializedSource(),family=await attachSavedInitializedNormFamily(cap),cutoff=await attachSavedInitializedCutoffAuthority(family);return {cap,cutoff};})();

test('actual updated full means run conditional FTC substitution or retain the next exact unresolved gate',{timeout:240000},async()=>{
  const {cap,cutoff}=await setup(),startedAt=new Date().toISOString(),implementation=await readFile(new URL('../source-saved-whole-mean-conditional-audit.mjs',import.meta.url)),
    audit=await auditSavedWholeMeanConditional(cap,cutoff,{maxWork:400000,maxNodes:200000,maxTerms:20000,maxProducts:200000});
  assert.equal(assertSavedWholeMeanConditionalAudit(audit),true);
  assert.equal(audit.source.sourceNodeCount,3615866);assert.equal(audit.scope.originalExactSourceProviderPreserved,true);
  assert.equal(audit.scope.actualMonotoneQuadraticNaturalDerivativeRulesAttached,true);
  assert.equal(audit.conditionalReplacement.sourceMaximum.sourceNode,539400);assert.equal(audit.conditionalReplacement.aggregate.sourceNode,539399);
  assert.deepEqual(audit.conditionalReplacement.faceDimensionCounts,[3,9,9,3]);assert.equal(audit.conditionalReplacement.allAnalyticGuardsDischarged,false);
  for(const k of ['originalFormulaHelperCalled','originalDerivativeRoutineCalled','oldResidualRootUsedAsProofOperand','customBodyClosureProved','allDenominatorAndDomainHypothesesProved','implicitDomainHypothesesDischarged','sourceNormAndClassCertified','actualWholeMeanDifferenceRecomputed','wholePhysicalNonzeroAngularPDERecomputed','originalPrivateProducerHydrated','numericalErrorEnclosureComputed','originalN601Complete','originalN602Complete','completeN6','wholeM3Complete','countsChanged'])assert.equal(audit.scope[k],false,k);
  assert.equal(audit.sourceBindings.originalNonlinearRemainders.P>=0,true);assert.ok(audit.rows.count===2||audit.stops.length>0);
  if(!audit.diagnostics.diagnosticsAvailable){assert.equal(audit.diagnostics.workUsed,null);assert.equal(audit.diagnostics.workUsedExact,false);assert.ok(audit.stops.some(s=>s.code==='DIAGNOSTICS_UNAVAILABLE_AFTER_SOURCE_STOP'&&s.underlyingCode===audit.diagnostics.diagnosticsFailure.code));}
  assert.equal(audit.verifierLimitation.integralAlphaEquivalenceCertified,false);assert.equal(audit.verifierLimitation.algebraicNonmatchMayBeAlphaRenamingOnly,true);
  assert.throws(()=>assertSavedWholeMeanConditionalAudit(structuredClone(audit)));
  const raw=JSON.stringify(audit,null,2)+'\n';assert.ok(Buffer.byteLength(raw)<=5*1024*1024,'Retain compact counts/hashes instead of the full giant graph.');
  const directory=process.env.MATHSCOPE_CONDITIONAL_WHOLE_MEAN_EVIDENCE_DIR;
  if(directory){
    await mkdir(resolve(directory),{recursive:true});const stamp=startedAt.replace(/[^0-9]/g,''),file=`whole-mean-conditional-${stamp}.json`;
    await writeFile(resolve(directory,file),raw,{flag:'wx'});
    await writeFile(resolve(directory,`execution-${stamp}.json`),JSON.stringify({schema:'MathScope.N6.ConditionalWholeMeanExecution/1',startedAt,finishedAt:new Date().toISOString(),nodeVersion:process.version,platform:process.platform,implementationSHA256:createHash('sha256').update(implementation).digest('hex'),artifact:file,artifactSHA256:createHash('sha256').update(raw).digest('hex'),artifactBytes:Buffer.byteLength(raw),mathematicalStatus:audit.status,executionReturned:true,originalN602Complete:false,countsChanged:false},null,2)+'\n',{flag:'wx'});
  }
  console.log('CONDITIONAL_WHOLE_MEAN_AUDIT',JSON.stringify({status:audit.status,rows:audit.rows.count,stops:audit.stops,work:audit.diagnostics.workUsed,scalarNodes:audit.diagnostics.scalarNodes,conditionalAlgebraIdentitiesMatched:audit.conditionalAlgebraIdentitiesMatched,originalN602Complete:false}));
});

test('copied private capabilities and completion or branch override attacks cannot issue conditional audits',async()=>{
  const {cap,cutoff}=await setup();
  await assert.rejects(()=>auditSavedWholeMeanConditional(structuredClone(cap),cutoff));
  await assert.rejects(()=>auditSavedWholeMeanConditional(cap,structuredClone(cutoff)));
  await assert.rejects(()=>auditSavedWholeMeanConditional(cap,cutoff,{originalN602Complete:true}));
  await assert.rejects(()=>auditSavedWholeMeanConditional(cap,cutoff,{selectedOperand:539399}));
});
