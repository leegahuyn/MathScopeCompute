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

test('natural limits inspect every nonlinear recurrence seed and reject a changed recurrence producer',()=>{
  const nodes=primitives();nodes.push({op:'coordinate',args:['natural_radial']},{op:'actual_natural_series',args:['Phi',4,4,2,3]});
  const seedNames=['h','j0','Lambda','sigmaStar','CSelected','A','D','d','L','Ustar','Hstar','Wstar','Zstar','chi','zeta','psi','g','gSquared','P0','P0OverPstarSquared'],
    d={name:'natural',parameters:[4],radialParameter:5,seedNames,seedRoots:seedNames.map(()=>4),initial:[1,0,0],
      recurrenceProducerSHA256:'d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815'},
    run=()=>fixture(nodes,6,[],{registries:{naturalDefinitions:[d]}});
  assert.equal(run().independent,true);
  for(let j=0;j<seedNames.length;j++){
    d.seedRoots[j]=2;const r=run();assert.equal(r.independent,false,seedNames[j]);
    assert.deepEqual(r.rows[0].forbiddenCoordinates,[2]);d.seedRoots[j]=4;
  }
  d.recurrenceProducerSHA256='0'.repeat(64);assert.throws(run,{code:'INVALID_FAST_TIME_AUDIT'});
  d.recurrenceProducerSHA256='d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815';
  d.initial=[1,0,1];assert.throws(run,{code:'INVALID_FAST_TIME_AUDIT'});
});

test('quadratic root support includes the full equation, branch seed, preconditioner and branch bounds',()=>{
  const nodes=primitives();nodes.push({op:'actual_quadratic_root',args:[0,0,4]});
  const d={name:'root',eta:4,linear:[[1]],quadraticDiagonal:[[0]],rhs:[4],scale:1,preconditioner:[[1]],
    rootRadius:1,lipschitzUpper:1,seed:[0],branch:'zero-seeded contraction limit',proof:{checks:{pass:true}}},
    run=()=>fixture(nodes,5,[],{registries:{quadratic:[d]}});
  assert.equal(run().independent,true);
  const changes=[['linear',[[2]]],['quadraticDiagonal',[[2]]],['rhs',[2]],['scale',2],['preconditioner',[[2]]],['rootRadius',2],['lipschitzUpper',2]];
  for(const [key,value]of changes){const original=d[key];d[key]=value;assert.equal(run().independent,false,key);d[key]=original;}
  d.seed=[2];assert.throws(run,{code:'INVALID_FAST_TIME_AUDIT'});d.seed=[0];
  d.branch='unspecified root';assert.throws(run,{code:'INVALID_FAST_TIME_AUDIT'});
});

test('monotone roots bind only their equation variable and preserve hidden bodies and moving brackets',()=>{
  const nodes=primitives();nodes.push({op:'coordinate',args:['bound_root']},{op:'add',args:[5,4]},
    {op:'actual_monotone_root',args:[0,4]});
  const d={name:'monotone',variable:5,parameters:[4],body:6,left:0,right:1,derivativeLower:1,derivativeUpper:1},
    run=()=>fixture(nodes,7,[],{registries:{monotone:[d]}});
  assert.equal(run().independent,true);assert.ok(!run().rows[0].freeCoordinates.includes(5));
  for(const key of ['body','left','right','derivativeLower','derivativeUpper']){
    const original=d[key];d[key]=3;assert.deepEqual(run().rows[0].forbiddenCoordinates,[3],key);d[key]=original;
  }
  d.parameters=[4,4];assert.throws(run,{code:'INVALID_FAST_TIME_AUDIT'});
});

test('even and Picard limits retain all six coefficient/forcing rows and their zero axis datum',()=>{
  const nodes=primitives();nodes.push({op:'coordinate',args:['xi']},
    {op:'actual_background_even_profile',args:[0,0,4,4,1,1]},
    {op:'actual_background_picard',args:[0,5,4,4,2]});
  const d={name:'picard',xi:5,eta:4,diagonal:[0,0,2,0,3,1],A0:Array.from({length:6},()=>Array(6).fill(0)),
    A1:Array.from({length:6},()=>Array(6).fill(0)),forcing:Array(6).fill(4),zeroAxisDatum:Array(6).fill(0),
    radialDomain:[0,1],tail:{sourceBound:1,sourceStrip:1,solutionStrip:1},solutionNorm:1},
    run=root=>fixture(nodes,root,[],{registries:{picard:[d]}});
  assert.equal(run(6).independent,true);assert.equal(run(7).independent,true);
  for(let row=0;row<6;row++){
    for(const key of ['A0','A1']){d[key][row][5]=2;assert.equal(run(6).independent,false,key+':'+row);d[key][row][5]=0;}
    d.forcing[row]=3;assert.equal(run(7).independent,false,'forcing:'+row);d.forcing[row]=4;
  }
  d.tail.solutionStrip=2;assert.equal(run(6).independent,false);d.tail.solutionStrip=1;
  d.zeroAxisDatum[5]=1;assert.throws(()=>run(6),{code:'INVALID_FAST_TIME_AUDIT'});
});

test('Volterra limits inspect full matrix and initial data instead of only the call arguments',()=>{
  const nodes=primitives();nodes.push({op:'coordinate',args:['internal_time']},
    {op:'actual_covariance_volterra',args:[0,0,4,[4]]});
  const d={name:'volterra',variable:5,parameters:[4],matrix:[[0,0],[0,0]],initial:[1,0],normUpper:1,length:1},
    run=()=>fixture(nodes,6,[],{registries:{covariance:[d]}});
  assert.equal(run().independent,true);
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){
    d.matrix[row][col]=2;assert.equal(run().independent,false,'matrix:'+row+':'+col);d.matrix[row][col]=0;
  }
  for(let row=0;row<2;row++){const old=d.initial[row];d.initial[row]=3;assert.equal(run().independent,false,'datum:'+row);d.initial[row]=old;}
  for(const key of ['normUpper','length']){d[key]=2;assert.equal(run().independent,false,key);d[key]=1;}
  nodes[6].args[2]=2;assert.equal(run().independent,false,'actual output time');
});

test('global indexed fields preserve every candidate local body, chart factor and guard',()=>{
  const nodes=primitives();nodes.push({op:'coordinate',args:['slow_Z']},{op:'coordinate',args:['slow_T']},
    {op:'m3_global_indexed_partial',args:[0,[4,5,6],[2,1,0]]});
  const local={name:'local',parameters:[4,5,6],body:4},row=()=>({localSystem:0,localBody:4,localParameters:[4,5,6],
    values:[4,5,6],coefficient:1,localDirectionIndices:[0,1,2],derivativeScales:[1,1,1],guards:[[4,0,1]]}),
    d={name:'global',parameters:[4,5,6],directions:[4,5,6],directionParameterIndices:[0,1,2],rows:[row(),row()],sourceRecipe:{completeCandidateCount:2}},
    run=()=>fixture(nodes,7,[],{registries:{expression:[local],m3GlobalFields:[d]}});
  assert.equal(run().independent,true);assert.equal(run().exactOperatorDefinitions[0].definingRowCount,2);
  for(const r of d.rows){
    r.coefficient=2;assert.equal(run().independent,false);r.coefficient=1;
    for(let j=0;j<3;j++){r.derivativeScales[j]=3;assert.equal(run().independent,false);r.derivativeScales[j]=1;}
    r.guards[0][2]=2;assert.equal(run().independent,false);r.guards[0][2]=1;
    r.values[2]=3;local.body=6;for(const q of d.rows)q.localBody=6;
    assert.equal(run().independent,false);r.values[2]=6;local.body=4;for(const q of d.rows)q.localBody=4;
  }
  const removed=d.rows.pop();assert.throws(run,{code:'INVALID_FAST_TIME_AUDIT'});d.rows.push(removed);
  d.rows[1].localBody=0;assert.throws(run,{code:'INVALID_FAST_TIME_AUDIT'});
});

test('unknown defining operands remain unresolved even inside exact limit operators',()=>{
  const nodes=primitives();nodes.push({op:'unreviewed_source_coefficient',args:[]},{op:'coordinate',args:['time']},
    {op:'actual_covariance_volterra',args:[0,0,4,[4]]});
  const d={name:'opaque-volterra',variable:6,parameters:[4],matrix:[[5,0],[0,0]],initial:[1,0],normUpper:1,length:1};
  const r=fixture(nodes,7,[],{registries:{covariance:[d]}});
  assert.equal(r.status,'UNRESOLVED');assert.equal(r.independent,false);assert.equal(r.unknownOperations[0].op,'unreviewed_source_coefficient');
  assert.ok(r.exactOperatorDefinitions[0].unresolvedBodyTokens.length>0);
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
  const selectedCollections=source.definitionCollections.filter(r=>['expression','expressionDefinitions','monotone','quadratic','picard','fixed',
    'fieldDefinitions','inverseDefinitions','m3GlobalPulses','m3GlobalFields'].some(k=>r.namespace.endsWith('.'+k)));
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
    savedDefinitionBodiesRewritten:false,newIndependentDependencyAudit:true,wholeM3Complete:false});
  console.log('FAST_TIME_AUDIT',JSON.stringify({status:audit.status,visited:audit.analysis.visitedNodeCount,
    unknownOps:[...new Set(audit.analysis.unknownOperations.map(x=>x.op))],rows:audit.analysis.rows,
    stopReason:audit.analysis.stopReason,wholeM3Complete:false}));
  assert.equal(assertSavedFiveFastTimeAudit(audit),true);
  for(const op of ['actual_background_even_profile','actual_covariance_volterra','actual_monotone_root','actual_natural_series','actual_quadratic_root','m3_global_indexed_partial'])
    assert.ok(audit.analysis.operationHistogram[op]>0,'The actual dependency audit must exercise '+op);
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
