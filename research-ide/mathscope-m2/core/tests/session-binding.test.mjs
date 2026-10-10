import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createM2Engine} from '../engine.mjs';
import {buildM2SessionBundle,commitM2SessionBundle} from '../session-binding.mjs';
import {createFoundationFixture,FOUNDATION_READ_PROJECTION_SHA256,FOUNDATION_SOURCE_SLICES} from './fixtures/foundation-v031.fixture.mjs';

const copy=x=>JSON.parse(JSON.stringify(x));
const sourcePath=process.env.MATHSCOPE_V031_ORIGINAL_HTML||fileURLToPath(new URL('../../../../../tmp/source/v0.3.1.original.html',import.meta.url));

function blankSession(){
  return {
    schema:'MathScopeResearchSession/0.3.1-foundation.1',id:'test-research-session',title:'M2 contract test',sessionRevision:1,environmentRef:null,
    ...Object.fromEntries(['goals','objects','representations','functionSpaces','differentialSystems','optimizations','operators','pdes','spectra','geometries','topologies','entropies','symmetries','kclasses','claims','evidence','assumptions','revisions','checkpoints','researchRuns'].map(key=>[key,[]]))
  };
}
const origin=s=>({id:s.id,revision:s.sessionRevision});
const request={kind:'arithmetic.projective',input:{p:'3',n:2,m:1}};

async function setup(t,req=request){
  const engine=createM2Engine({local:true});
  t.after(()=>engine.dispose());
  const submitted=await engine.submit(req),job=await engine.wait(submitted.id);
  return {engine,job,foundation:createFoundationFixture(blankSession())};
}

test('validator fixture is verbatim within the provider read projection and its pinned projection digest',{skip:!existsSync(sourcePath)},()=>{
  const html=readFileSync(sourcePath,'utf8');
  assert.equal(createHash('sha256').update(html).digest('hex'),FOUNDATION_READ_PROJECTION_SHA256);
  for(const slice of FOUNDATION_SOURCE_SLICES)assert.ok(html.includes(slice),'source oracle differs from the provider read projection');
});

test('actual finite run commits through the extracted Foundation contract and returns record IDs',async t=>{
  const {engine,job,foundation}=await setup(t),start=foundation.getSession();
  const report=await commitM2SessionBundle(job,engine,foundation,origin(start));
  assert.equal(report.sessionId,start.id);
  assert.equal(report.sessionRevision,start.sessionRevision+1);
  assert.equal(report.session.sessionRevision,report.sessionRevision);
  assert.equal(report.bundleId,'m2-'+job.id);
  for(const key of ['objectIds','representationIds','claimIds','evidenceIds','runIds'])assert.equal(report[key].length,1);
  assert.deepEqual(foundation.validateSession(report.session),[]);
  assert.equal(report.session.representations[0].method,'sampled-finite');
  assert.equal(foundation.guard3DRepresentation(report.session.representations[0]).ok,true);
  assert.equal(report.session.objects[0].type,'FiniteComputationRecord');
  assert.deepEqual(report.session.objects[0].sourceRecord.object,job.result.object);
  assert.equal(report.session.evidence[0].grade,'NUMERICAL INDICATOR');
  assert.equal(report.session.evidence[0].formalPass,false);
  assert.equal(report.session.evidence[0].resultHash,job.resultHash);
  assert.equal(report.session.evidence[0].environmentHash,job.environmentHash);
  assert.equal(report.session.representations[0].provenance.sourceDataHash,job.result.visualization.sourceHash);
  assert.deepEqual(foundation.effects,['M2 finite worker result']);
  assert.equal(foundation.dependencyGraph(report.session).unknown.size,0,'domain names and request metadata must not become dangling typed references');
});

test('original Foundation rejects custom method, missing required fields and proof-grade adapter claims transactionally',async t=>{
  const {engine,job,foundation}=await setup(t),start=foundation.getSession();
  const valid=await buildM2SessionBundle(job,engine,start,origin(start));
  const custom=copy(valid);custom.representations[0].method='custom';
  assert.throws(()=>foundation.commitTypedBundle(custom),/representation method unsupported/);
  const missing=copy(valid);delete missing.representations[0].sampling;
  assert.throws(()=>foundation.commitTypedBundle(missing),/sampling missing/);
  const malformed=copy(valid);malformed.objects[0].assumptions='untyped';
  assert.throws(()=>foundation.commitTypedBundle(malformed),/assumptions must be array/);
  const promoted=copy(valid);promoted.evidence[0].grade='FORMAL PASS';
  assert.throws(()=>foundation.commitTypedBundle(promoted),/Proof-grade evidence/);
  const proof=copy(valid);proof.claims[0].status='PROVED';
  assert.throws(()=>foundation.commitTypedBundle(proof),/cannot issue proved claims/);
  assert.deepEqual(foundation.getSession(),start);
  assert.equal(foundation.effects.length,0);
});

test('a JSON copy of an owned receipt and altered public job hashes cannot grant save authority',async t=>{
  const {engine,job,foundation}=await setup(t),start=foundation.getSession();
  const serialized={...engine,receipt:async id=>copy(await engine.receipt(id))};
  await assert.rejects(commitM2SessionBundle(job,serialized,foundation,origin(start)),/receipt/);
  await assert.rejects(commitM2SessionBundle({...job,inputHash:'f'.repeat(64)},engine,foundation,origin(start)),/receipt/);
  assert.equal(foundation.effects.length,0);
});

test('a terminal UNSUPPORTED computation is not saved as a completed claim',async t=>{
  const {engine,job,foundation}=await setup(t,{kind:'arithmetic.elliptic',input:{p:'5',backend:'kedlaya'}});
  assert.equal(job.status,'UNSUPPORTED');
  await assert.rejects(commitM2SessionBundle(job,engine,foundation,origin(foundation.getSession())),/완료 또는 부분/);
  assert.equal(foundation.effects.length,0);
});

test('changed current environment and altered environment content are rejected',async t=>{
  const {engine,job,foundation}=await setup(t),start=foundation.getSession(),env=await engine.environment();
  const wrongHash={...engine,environment:async()=>({...env,hash:'f'.repeat(64)})};
  await assert.rejects(commitM2SessionBundle(job,wrongHash,foundation,origin(start)),/환경의 해시/);
  const wrongSource={...engine,environment:async()=>({...env,workerSha256:'f'.repeat(64)})};
  await assert.rejects(commitM2SessionBundle(job,wrongSource,foundation,origin(start)),/환경의 해시/);
  assert.equal(foundation.effects.length,0);
});

test('stale origin is refused before requesting a receipt, with integer revision semantics',async t=>{
  const {engine,job,foundation}=await setup(t),start=foundation.getSession();
  let calls=0;const observed={...engine,receipt:async id=>{calls++;return engine.receipt(id);}};
  await assert.rejects(commitM2SessionBundle(job,observed,foundation,{id:start.id,revision:0}),/revision이 변경/);
  await assert.rejects(commitM2SessionBundle(job,observed,foundation,{id:start.id,revision:'1'}),/정수 revision/);
  assert.equal(calls,0);
  assert.equal(foundation.effects.length,0);
});

test('session revision changes while the receipt awaits cannot write the detached original snapshot',async t=>{
  const {engine,job,foundation}=await setup(t),expected=origin(foundation.getSession());
  const delayed={...engine,receipt:async id=>{
    const receipt=await engine.receipt(id);
    foundation.mutate(s=>s.sessionRevision++);
    return receipt;
  }};
  await assert.rejects(commitM2SessionBundle(job,delayed,foundation,expected),/revision이 변경/);
  assert.equal(foundation.getSession().objects.length,0);
  assert.equal(foundation.effects.length,0);
});

test('session switching during environment verification is refused even if the revision number matches',async t=>{
  const {engine,job,foundation}=await setup(t),expected=origin(foundation.getSession());
  const switched={...engine,environment:async()=>{
    const env=await engine.environment();
    foundation.mutate(s=>s.id='another-research-session');
    return env;
  }};
  await assert.rejects(commitM2SessionBundle(job,switched,foundation,expected),/revision이 변경/);
  assert.equal(foundation.effects.length,0);
});

test('mutating the caller origin during an await cannot move the captured authorization baseline',async t=>{
  const {engine,job,foundation}=await setup(t),expected=origin(foundation.getSession());
  const changed={...engine,receipt:async id=>{
    const receipt=await engine.receipt(id);
    foundation.mutate(s=>s.sessionRevision++);
    expected.revision++;
    return receipt;
  }};
  await assert.rejects(commitM2SessionBundle(job,changed,foundation,expected),/revision이 변경/);
  assert.equal(foundation.effects.length,0);
});

test('the final wrapper check catches a change after bundle building and before commit',async t=>{
  const {engine,job,foundation}=await setup(t),expected=origin(foundation.getSession());
  let reads=0;
  const racing={...foundation,getSession:()=>{
    if(++reads===4)foundation.mutate(s=>s.sessionRevision++);
    return foundation.getSession();
  }};
  await assert.rejects(commitM2SessionBundle(job,engine,racing,expected),/revision이 변경/);
  assert.equal(reads,4);
  assert.equal(foundation.effects.length,0);
});

test('each replaced typed record uses its own parent revision and fresh evidence cites all current revisions',async t=>{
  const {engine,job,foundation}=await setup(t);
  const first=await commitM2SessionBundle(job,engine,foundation,origin(foundation.getSession()));
  foundation.mutate(s=>{
    s.representations[0].revision=s.representations[0].id+':r7';
    s.claims[0].revision=s.claims[0].id+':r3';
  });
  const submitted=await engine.submit(request),fresh=await engine.wait(submitted.id);
  const second=await commitM2SessionBundle(fresh,engine,foundation,origin(foundation.getSession()));
  const s=second.session,obj=s.objects[0],rep=s.representations[0],claim=s.claims[0],ev=s.evidence.find(x=>x.id===second.evidenceIds[0]);
  assert.equal(obj.parentRevision,first.objectIds[0]+':r1');
  assert.equal(obj.revision,obj.id+':r2');
  assert.equal(rep.parentRevision,rep.id+':r7');
  assert.equal(rep.revision,rep.id+':r8');
  assert.equal(claim.parentRevision,claim.id+':r3');
  assert.equal(claim.revision,claim.id+':r4');
  assert.deepEqual(ev.upstreamRevisions,[obj.revision,rep.revision,claim.revision]);
  assert.equal(ev.supportsCurrent,true);
  assert.equal(ev.freshness,'CURRENT');
  assert.equal(s.evidence.find(x=>x.id===first.evidenceIds[0]).supportsCurrent,false);
  assert.deepEqual(foundation.validateSession(s),[]);
});

test('target-node mutation is refused even when a legacy edit leaves sessionRevision unchanged',async t=>{
  const {engine,job,foundation}=await setup(t);
  await commitM2SessionBundle(job,engine,foundation,origin(foundation.getSession()));
  const submitted=await engine.submit(request),fresh=await engine.wait(submitted.id),expected=origin(foundation.getSession());
  const mutated={...engine,environment:async()=>{
    const env=await engine.environment();
    foundation.mutate(s=>{s.objects[0].revision=s.objects[0].id+':r99';});
    return env;
  }};
  await assert.rejects(commitM2SessionBundle(fresh,mutated,foundation,expected),/수학 기록이 변경/);
  assert.equal(foundation.effects.length,1);
  assert.equal(foundation.getSession().objects[0].revision.endsWith(':r99'),true);
});

test('unrelated source changes do not invalidate M2 through an invented dangling domainRef',async t=>{
  const {engine,job,foundation}=await setup(t);
  const report=await commitM2SessionBundle(job,engine,foundation,origin(foundation.getSession()));
  const s=report.session,independent={...copy(s.objects[0]),id:'independent-source',revision:'independent-source:r1',parentRevision:null};
  s.objects.push(independent);
  assert.deepEqual(foundation.invalidateForChange(s,'object',independent.id),[]);
  assert.equal(s.evidence[0].supportsCurrent,true);
  assert.equal(s.evidence[0].freshness,'CURRENT');
});

test('distinct valid job IDs that share a sanitized spelling retain distinct evidence records',async t=>{
  const {engine,foundation}=await setup(t),reports=[];
  for(const id of ['m2-run:a','m2-run-a']){
    const submitted=await engine.submit(request,{id}),job=await engine.wait(submitted.id);
    reports.push(await commitM2SessionBundle(job,engine,foundation,origin(foundation.getSession())));
  }
  assert.notEqual(reports[0].evidenceIds[0],reports[1].evidenceIds[0]);
  assert.equal(foundation.getSession().evidence.length,2);
  assert.equal(foundation.getSession().evidence[0].supportsCurrent,false);
  assert.equal(foundation.getSession().evidence[1].supportsCurrent,true);
});
