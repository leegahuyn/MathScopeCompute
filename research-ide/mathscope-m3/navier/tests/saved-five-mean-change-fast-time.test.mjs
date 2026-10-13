import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {openSavedInitializedSource,savedInitializedSourceProgram} from '../source-saved-initialized-authority.mjs';
import {attachSavedInitializedNormFamily} from '../source-saved-initialized-norm-family.mjs';
import {attachSavedInitializedCutoffAuthority} from '../source-saved-initialized-cutoff-norms.mjs';
import {auditExpressionFreeCoordinates,auditSavedFiveFastTime,assertSavedFiveFastTimeAudit} from '../source-saved-five-fast-time-audit.mjs';

const primitives=()=>[{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},
  {op:'coordinate',args:['Y0']},{op:'coordinate',args:['Y1']},{op:'coordinate',args:['R']}];
function fixture(nodes,root,definitions=[],options={}){
  return auditExpressionFreeCoordinates({node:id=>nodes[id],roots:[root],definitions,forbidden:[2,3],...options});
}

test('a hidden fast coordinate in a named body is not erased by a slow-only signature',()=>{
  const nodes=primitives();nodes.push({op:'m3_aux_expression_partial',args:[-1,[4],[0]]});
  const r=fixture(nodes,5,[{name:'captured',parameters:[4],body:2}]);
  assert.equal(r.status,'DEPENDENCE_NOT_EXCLUDED');assert.deepEqual(r.rows[0].forbiddenCoordinates,[2]);
  assert.deepEqual(r.namedDefinitions[0].capturedCoordinates,[2]);
  assert.equal(r.oldFreeCoordinateRoutineCalled,false);assert.equal(r.sourceAuthenticated,false);
});

test('integral binders remove their variable but never erase a moving fast endpoint',()=>{
  const nodes=primitives();nodes.push({op:'definite_integral',args:[2,2,0,1]});
  assert.equal(fixture(nodes,5).independent,true);
  nodes.push({op:'definite_integral',args:[2,2,0,3]});
  const r=fixture(nodes,6);assert.equal(r.independent,false);assert.deepEqual(r.rows[0].forbiddenCoordinates,[3]);
});

test('named formal arguments are substituted simultaneously without dropping captured coordinates',()=>{
  const nodes=primitives();nodes.push({op:'add',args:[2,4]},{op:'m3_aux_expression_partial',args:[-1,[3],[0]]});
  const r=fixture(nodes,6,[{name:'both',parameters:[4],body:5}]);
  assert.deepEqual(r.rows[0].forbiddenCoordinates,[2,3]);assert.equal(r.independent,false);
});

test('an unknown operator cannot become a proof even underneath both Haar binders',()=>{
  const nodes=primitives();nodes.push({op:'unreviewed_operator',args:[]},
    {op:'definite_integral',args:[5,2,0,1]},{op:'definite_integral',args:[6,3,0,1]});
  const r=fixture(nodes,7);assert.equal(r.status,'UNRESOLVED');assert.equal(r.independent,false);
  assert.equal(r.unknownOperations[0].op,'unreviewed_operator');
});

test('malformed calls, duplicate formal parameters and missing nodes fail closed',()=>{
  const nodes=primitives();nodes.push({op:'m3_aux_expression_partial',args:[-1,[4],[0,0]]});
  assert.throws(()=>fixture(nodes,5,[{name:'bad',parameters:[4],body:4}]),{code:'INVALID_FAST_TIME_AUDIT'});
  nodes[5]={op:'m3_aux_expression_partial',args:[-1,[4,4],[0,0]]};
  assert.throws(()=>fixture(nodes,5,[{name:'duplicate',parameters:[4,4],body:4}]),{code:'INVALID_FAST_TIME_AUDIT'});
  assert.throws(()=>fixture(nodes,999),{code:'INVALID_FAST_TIME_AUDIT'});
});

test('cycles and exhausted traversal budgets never issue an independence result',()=>{
  const nodes=primitives();nodes.push({op:'add',args:[5,4]});
  assert.equal(fixture(nodes,5).stopReason,'DEPENDENCY_CYCLE');
  nodes[5]={op:'add',args:[0,4]};
  const r=fixture(nodes,5,[],{maxWork:1});assert.equal(r.stopReason,'RESOURCE_LIMIT');assert.equal(r.independent,false);
});

test('higher named partials conservatively retain any hidden fast dependence',()=>{
  const nodes=primitives();nodes.push({op:'multiply',args:[2,4]},{op:'m3_aux_expression_partial',args:[-1,[4],[3]]});
  const r=fixture(nodes,6,[{name:'partial',parameters:[4],body:5}]);
  assert.equal(r.independent,false);assert.deepEqual(r.rows[0].forbiddenCoordinates,[2]);
});

test('base expression calls inspect their defining body instead of trusting a declared signature',()=>{
  const nodes=primitives();nodes.push({op:'actual_expression_partial',args:[0,[4],[1]]});
  const r=fixture(nodes,5,[],{registries:{expression:[{name:'hidden-base',parameters:[4],body:2}]}});
  assert.equal(r.independent,false);assert.deepEqual(r.rows[0].forbiddenCoordinates,[2]);
});

test('indexed fields inspect every local body, coefficient, derivative map and moving guard',()=>{
  const nodes=primitives();nodes.push({op:'m3_aux_indexed_partial',args:[0,[4],[0]]});
  const local={name:'slow-local',parameters:[4],body:4};
  const row={localSystem:-1,localBody:4,localParameters:[4],values:[4],coefficient:1,derivativeMaps:[[{parameter:0,coefficient:1}]],guards:[[4,0,1]]};
  const field={name:'finite-field',parameters:[4],directions:[4],directionParameterIndices:[0],rows:[row]};
  const run=()=>fixture(nodes,5,[local],{registries:{fieldDefinitions:[field]}});
  assert.equal(run().independent,true);row.coefficient=2;assert.equal(run().independent,false);
  row.coefficient=1;row.derivativeMaps[0][0].coefficient=3;assert.deepEqual(run().rows[0].forbiddenCoordinates,[3]);
  row.derivativeMaps[0][0].coefficient=1;row.guards[0][2]=2;assert.equal(run().independent,false);
  row.localBody=0;assert.throws(run,{code:'INVALID_FAST_TIME_AUDIT'});
});

test('Fourier inverses keep both torus outputs and hidden body coordinates without truncating tails',()=>{
  const nodes=primitives();nodes.push({op:'coordinate',args:['hidden']} ,{op:'add',args:[4,5]},
    {op:'m3_aux_inverse_partial',args:[0,[2,3,4],[0,0,0]]},
    {op:'definite_integral',args:[7,2,0,1]},{op:'definite_integral',args:[8,3,0,1]});
  const inverse={name:'exact-inverse',body:6,Y:[2,3],parameters:[2,3,4],directions:[2,3,4],directionParameterIndices:[0,1,2],
    operator:'(sqrt(2)-1)*partial_y0+partial_y1',finiteSumDeclaredEqualToLimit:false};
  const registries={inverseDefinitions:[inverse]};
  assert.equal(fixture(nodes,7,[],{registries}).independent,false);
  const r=fixture(nodes,9,[],{registries});assert.equal(r.independent,true);assert.ok(r.rows[0].freeCoordinates.includes(5));
  inverse.finiteSumDeclaredEqualToLimit=true;assert.throws(()=>fixture(nodes,7,[],{registries}),{code:'INVALID_FAST_TIME_AUDIT'});
});

let saved;
async function setup(){
  if(!saved)saved=(async()=>{const cap=await openSavedInitializedSource(),family=attachSavedInitializedNormFamily(cap),
    cutoff=await attachSavedInitializedCutoffAuthority(family);return {cap,cutoff};})();
  return saved;
}
async function evidence(name,value){
  const base=process.env.RUNNER_TEMP;
  if(!base)return;
  const dir=join(base,'m3-focused-resume');await mkdir(dir,{recursive:true});
  await writeFile(join(dir,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
}

test('actual saved five-map fast-time independence is checked from definition bodies',async()=>{
  const {cap,cutoff}=await setup(),startedAt=new Date().toISOString(),audit=auditSavedFiveFastTime(cap,cutoff);
  const result={schema:'MathScope.N6.SavedFiveFastTimeObserved/1',startedAt,finishedAt:new Date().toISOString(),audit};
  await evidence('saved-five-fast-time-observed.json',result);
  const source=savedInitializedSourceProgram(cap);
  const selectedCollections=source.definitionCollections.filter(r=>['expression','expressionDefinitions','monotone','fieldDefinitions','inverseDefinitions'].some(k=>r.namespace.endsWith('.'+k)));
  const registryJSON=JSON.stringify(selectedCollections);
  await evidence('saved-five-fast-time-definition-readback.json',{
    schema:'MathScope.N6.SavedDefinitionReadback/1',source:cap.source,
    sourceScope:source.definitionScope,allDefinitionsFitCaptureBudget:Buffer.byteLength(registryJSON)<=4000000,
    registrySHA256:createHash('sha256').update(registryJSON).digest('hex'),
    registryBytes:Buffer.byteLength(registryJSON),
    collections:Buffer.byteLength(registryJSON)<=4000000?selectedCollections:null,
    selectedNodeBindings:audit.analysis.accessedNodeIds.map(id=>[id,source.node(id)]),
    profiles:source.definitionCollections.map(r=>({namespace:r.namespace,isArray:Array.isArray(r.value),
      size:Array.isArray(r.value)?r.value.length:Object.keys(r.value??{}).length,
      firstKeys:Object.keys(Array.isArray(r.value)?r.value[0]??{}:r.value??{})})),
    proofsAdded:false,wholeM3Complete:false});
  console.log('FAST_TIME_AUDIT',JSON.stringify({status:audit.status,visited:audit.analysis.visitedNodeCount,
    unknownOps:[...new Set(audit.analysis.unknownOperations.map(x=>x.op))],rows:audit.analysis.rows,
    stopReason:audit.analysis.stopReason,wholeM3Complete:false}));
  assert.equal(assertSavedFiveFastTimeAudit(audit),true);
  for(const key of ['actualWholeMeanDifferenceRecomputed','smoothnessOrDomainProved','leanKernelChecked',
    'fastTimeIntegratedIntoMeanNormCertificate','initialHaarAndPositiveIBPCutoffCompositionApplied',
    'completeInitialTupleClassCertified','originalN601Complete','originalN602Complete','completeN6','wholeM3Complete'])
    assert.equal(audit.scope[key],false,key+' remains outside this audit');
  assert.equal(audit.status,'INDEPENDENCE_VERIFIED','Unresolved source operators or surviving fast coordinates are a real gate failure, not a passed proof.');
});

test('copied authorities, completion overrides and invalid budgets cannot certify actual fast time',async()=>{
  const {cap,cutoff}=await setup();
  assert.throws(()=>auditSavedFiveFastTime(structuredClone(cap),cutoff));
  assert.throws(()=>auditSavedFiveFastTime(cap,structuredClone(cutoff)));
  assert.throws(()=>auditSavedFiveFastTime(cap,cutoff,{completeN6:true}));
  assert.throws(()=>auditSavedFiveFastTime(cap,cutoff,{maxWork:0}),{code:'RESOURCE_LIMIT'});
  const r=auditSavedFiveFastTime(cap,cutoff,{maxWork:1});
  assert.equal(r.scope.newIndependentFastTimeZeroCheck,false);
  assert.throws(()=>assertSavedFiveFastTimeAudit(structuredClone(r)),{code:'INVALID_FAST_TIME_AUDIT'});
});

// Read inherited release records without changing or normalizing their historical flags.
test('prerequisite records are captured verbatim for the continuation checkpoint',async()=>{
  const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8',maxBuffer:8*1024*1024}).split('\0').filter(Boolean);
  const names=new Set(['M2_FINAL_COMPLETION.json','N6_PROGRESS.json','N7_PROGRESS.json','N8_PROGRESS.json','M3_ALL64_REVIEW_KO.md']);
  const paths=tracked.filter(p=>names.has(p.split('/').at(-1))),matches=[];
  for(const path of paths){
    const raw=await readFile(join(process.cwd(),path));
    matches.push({path,bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex'),text:raw.toString('utf8')});
  }
  await evidence('prerequisite-records-verbatim.json',{schema:'MathScope.ResumeReadback/2',
    discovery:'git ls-files -z across the complete tracked repository',trackedFileCount:tracked.length,
    records:matches,rewritten:false});
  assert.ok(matches.some(r=>r.path.endsWith('M2_FINAL_COMPLETION.json')),'The actual inherited M2 record must be located in the full tracked repository.');
});
