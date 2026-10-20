import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {validateRecoveryData,displayNumber,intervalDisplay,visibleCriteria,safeEvidenceLink,decodeRecoveryPayload,collectRecoveryParts,annotateHistoricalPanels} from '../recovery-model.mjs';
const raw=readFileSync(new URL('../generated/RECOVERY_UI_DATA.json',import.meta.url),'utf8');
const data=JSON.parse(raw);
const copy=()=>structuredClone(data);
test('original evidence retains exactly 64 M3 and 16 M4 source-scoped conditions',()=>{
  assert.equal(validateRecoveryData(data),data);
  assert.deepEqual(data.criteria.filter(r=>r.stage==='M3'&&r.status==='OPEN').map(r=>r.id).sort(),['N7-06','N8-05']);
  assert.equal(data.status.actualGlobalLastResolvedTau,null);
  assert.equal(data.criteria.filter(r=>r.stage==='M4'&&r.status==='PARTIAL').length,14);
  assert.equal(data.criteria.filter(r=>r.stage==='M4'&&r.status==='OPEN').length,2);
});
test('fabricated completion, tau and initial scope are rejected',()=>{
  for(const mutate of [d=>d.status.m3Complete=64,d=>d.status.actualGlobalLastResolvedTau=0,d=>d.status.actualGlobalLastResolvedTau=1e-12,d=>d.status.m4Complete=16,d=>d.status.initial1260Scope='GLOBAL']){
    const d=copy();mutate(d);assert.throws(()=>validateRecoveryData(d));
  }
});
test('original IDs and acceptance text cannot be removed or duplicated',()=>{
  const missing=copy();missing.criteria.pop();assert.throws(()=>validateRecoveryData(missing));
  const duplicate=copy();duplicate.criteria[0].id=duplicate.criteria[1].id;assert.throws(()=>validateRecoveryData(duplicate));
  const stripped=copy();stripped.criteria[0].original_acceptance='';assert.throws(()=>validateRecoveryData(stripped));
  const forged=copy();forged.criteria.find(r=>r.id==='R1-08').status='PASS';assert.throws(()=>validateRecoveryData(forged));
});
test('N8 numerical axes cannot be replaced with four coordinates or N7 axes',()=>{
  const d=copy();d.refinement.n8.forEach((r,i)=>r.axis=['x1','x2','x3','t'][i]);assert.throws(()=>validateRecoveryData(d));
  const n7=copy();n7.refinement.n7[1].axis='grid';assert.throws(()=>validateRecoveryData(n7));
  const base=data.refinement.raw.N805.axes[0].baseline;
  for(const axis of data.refinement.raw.N805.axes)for(const key of Object.keys(base))assert.equal(axis.doubled[key],axis.baseline[key]*(key===axis.axis?2:1));
});
test('cutoff support cannot be promoted into actual global energy or corrupt cell coverage',()=>{
  const count=copy();count.support.exact_zero_cells++;assert.throws(()=>validateRecoveryData(count));
  const global=copy();global.support.whole_K_energy=0;assert.throws(()=>validateRecoveryData(global));
  const cell=copy();cell.support.cells[0].energy=0;assert.throws(()=>validateRecoveryData(cell));
  const duplicate=copy();duplicate.support.cells[1].index=duplicate.support.cells[0].index;assert.throws(()=>validateRecoveryData(duplicate));
  const dangling=copy();dangling.support.cells[0].jet_set=99999;assert.throws(()=>validateRecoveryData(dangling));
});
test('null, invalid and unrepresentable values never become zero observations',()=>{
  for(const value of [null,undefined,'','unknown','null','Infinity','1/0','1e-999','1/'+'1'+'0'.repeat(500)])assert.equal(displayNumber(value),null);
  assert.equal(displayNumber('0'),0);assert.equal(displayNumber('0/7'),0);
});
test('large exact rational endpoints avoid Infinity/Infinity display corruption',()=>{
  assert.equal(displayNumber('1'+'0'.repeat(400)+'/'+'2'+'0'.repeat(399)),5);
  const rows=data.nativeRows.filter(r=>r.interval.some(s=>s.length>700));assert.ok(rows.length>0);
  for(const row of rows){const d=intervalDisplay(row);assert.ok(d.drawable,row.id);assert.ok(d.lo<=d.hi,row.id);}
});
test('intervals preserve unknown, ordered bounds and exact zero separately',()=>{
  assert.equal(intervalDisplay({interval:null}).drawable,false);assert.equal(intervalDisplay({interval:['2','1']}).drawable,false);
  const zero=intervalDisplay({interval:['0','0']});assert.equal(zero.drawable,true);assert.equal(zero.exact,true);
  const root=data.nativeRows.find(r=>r.family==='root'),r=intervalDisplay(root);assert.ok(r.lo<0&&r.hi>0);assert.equal(root.details.originalRhsNumericallyEvaluated,false);
});
test('empty or scoped filtering leaves authoritative evidence unchanged',()=>{
  const before=JSON.stringify(data);assert.equal(visibleCriteria(data,'all','all','zz_no_original_id').length,0);
  assert.deepEqual(visibleCriteria(data,'M3','OPEN','').map(r=>r.id).sort(),['N7-06','N8-05']);assert.equal(visibleCriteria(data,'M4','all','').length,16);assert.equal(JSON.stringify(data),before);
});
test('source links reject unsafe protocols and unrelated repositories',()=>{
  for(const url of ['javascript:alert(1)','data:text/html,test','https://example.com/file','https://github.com/other/repo/file','https://github.com/leegahuyn/MathScopeCompute/../../elsewhere'])assert.equal(safeEvidenceLink({url}),null);
  for(const source of Object.values(data.sources))assert.ok(safeEvidenceLink(source),source.path);
});
test('lossless inline gzip restores every exact original byte before JSON validation',async()=>{
  const block=readFileSync(new URL('../generated/integrated-block.html',import.meta.url),'utf8');
  const match=block.match(/<script id="ms3ip-recovery-data" type="application\/octet-stream" data-encoding="gzip-base64" data-bytes="(\d+)" data-sha256="([a-f0-9]{64})">([\s\S]*?)<\/script>/);
  assert.ok(match);const restored=await decodeRecoveryPayload(match[3],'gzip-base64',Number(match[1]));
  assert.deepEqual(Buffer.from(restored),Buffer.from(raw));assert.equal(createHash('sha256').update(restored).digest('hex'),match[2]);
  assert.deepEqual(validateRecoveryData(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(restored))),data);
  assert.equal(match[3].includes('<'),false);assert.ok(match[3].length<160000);
});
test('compressed payload rejects unsupported or malformed transport before displaying values',async()=>{
  const good=gzipSync(Buffer.from('source')).toString('base64');
  for(const [encoded,format,size,decompressor] of [[good,'raw',6,DecompressionStream],['','gzip-base64',6,DecompressionStream],['!!!!','gzip-base64',6,DecompressionStream],['A'.repeat(400004),'gzip-base64',6,DecompressionStream],[good,'gzip-base64',0,DecompressionStream],[good,'gzip-base64',2500001,DecompressionStream],[good,'gzip-base64',6,null]])await assert.rejects(()=>decodeRecoveryPayload(encoded,format,size,decompressor));
});
test('compressed output cannot exceed its pinned decoded length or leave a truncated result',async()=>{
  const packed=gzipSync(Buffer.from('x'.repeat(100000))).toString('base64');
  await assert.rejects(()=>decodeRecoveryPayload(packed,'gzip-base64',32),/크기가/);
  await assert.rejects(()=>decodeRecoveryPayload(packed,'gzip-base64',100001),/크기가/);
  const truncated=Buffer.from(packed,'base64').subarray(0,-8).toString('base64');
  await assert.rejects(()=>decodeRecoveryPayload(truncated,'gzip-base64',100000));
});
test('gzip corruption is rejected and a valid same-size replacement cannot satisfy original SHA',async()=>{
  const corrupted=gzipSync(Buffer.from(raw));corrupted[corrupted.length-5]^=1;
  await assert.rejects(()=>decodeRecoveryPayload(corrupted.toString('base64'),'gzip-base64',Buffer.byteLength(raw)));
  const altered=raw.replace('62','63');assert.equal(Buffer.byteLength(altered),Buffer.byteLength(raw));assert.notEqual(altered,raw);
  const decoded=await decodeRecoveryPayload(gzipSync(Buffer.from(altered)).toString('base64'),'gzip-base64',Buffer.byteLength(raw));
  assert.notEqual(createHash('sha256').update(decoded).digest('hex'),createHash('sha256').update(raw).digest('hex'));
});
test('unsupported browser still has static scoped status and canonical immutable ledger links',()=>{
  const block=readFileSync(new URL('../generated/integrated-block.html',import.meta.url),'utf8');
  const fallback=block.match(/<details id="ms3ip-static-sources">([\s\S]*?)<\/details>/)?.[1];assert.ok(fallback);
  assert.equal((fallback.match(/<a href=/g)||[]).length,4);
  assert.ok(fallback.includes('/cf98ec1e832d88317f0c07072b5053a88866c904/research-ide/mathscope-m3/ORIGINAL_M3_M4_CRITERIA.json'));
  assert.ok(block.includes('62 / 64 · 저장 원장 기준'));assert.ok(block.includes('null · 미해결'));
  const receipt=JSON.parse(readFileSync(new URL('../generated/IMMUTABLE_SOURCE_LINKS.json',import.meta.url),'utf8'));
  assert.equal(receipt.allPassed,true);assert.ok(receipt.uniqueSourcePaths>20);assert.ok(receipt.sources.every(row=>row.exists));
});
test('production patch affects one isolated block and retains outside engines',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../generated/PREPUBLICATION_MANIFEST.json',import.meta.url),'utf8'));
  assert.equal(manifest.outside_marker_bytes_identical,true);assert.equal(manifest.all_outside_scripts_identical,true);assert.equal(manifest.expected_base_version_hash,'d7474dd6');assert.equal(manifest.published,false);
  const patch=JSON.parse(readFileSync(new URL('../generated/websitepublisher-patch.json',import.meta.url),'utf8'));
  assert.equal(patch.project_id,29770);assert.equal(patch.slug,'v0.3.1.html');assert.equal(patch.patches.length,1);assert.equal(patch.patches[0].operation,'replace');
});
test('ordered inert data fragments reconstruct the same pinned full JSON bytes',async()=>{
  const plan=JSON.parse(readFileSync(new URL('../generated/fragments/FRAGMENT_PUBLICATION_PLAN.json',import.meta.url),'utf8'));
  const rendered=readFileSync(new URL('../generated/fragments/rendered-block.html',import.meta.url),'utf8');
  const parts=[...rendered.matchAll(/<script id="ms3ip-recovery-part-\d+" type="application\/octet-stream" data-ms3ip-part="(\d+)">([A-Za-z0-9+/=]+)<\/script>/g)].map(m=>({index:m[1],content:m[2]}));
  assert.equal(parts.length,12);const joined=collectRecoveryParts(parts,12);
  const decoded=await decodeRecoveryPayload(joined,'gzip-base64',plan.decodedDataBytes);
  assert.deepEqual(Buffer.from(decoded),Buffer.from(raw));assert.equal(createHash('sha256').update(decoded).digest('hex'),plan.dataSha256);
});
test('missing, duplicated, reordered, empty and oversized data fragments fail closed',()=>{
  const good=[{index:'0',content:'AAAA'},{index:'1',content:'BBBB'}];assert.equal(collectRecoveryParts(good,2),'AAAABBBB');
  for(const [parts,count] of [[good,3],[[good[0],good[0]],2],[[good[1],good[0]],2],[[{index:'0',content:''}],1],[[{index:'0',content:'A'.repeat(12001)}],1],[good,0],[good,65]])assert.throws(()=>collectRecoveryParts(parts,count));
  assert.throws(()=>collectRecoveryParts(Array.from({length:34},(_,i)=>({index:String(i),content:'A'.repeat(12000)})),34));
});
test('complete fragment requests expand to the exact scoped block before one guarded activation',()=>{
  const dir=new URL('../generated/fragments/',import.meta.url);
  const plan=JSON.parse(readFileSync(new URL('FRAGMENT_PUBLICATION_PLAN.json',dir),'utf8'));
  const patch=JSON.parse(readFileSync(new URL('activation-patch.json',dir),'utf8'));
  assert.equal(plan.fragments.length,14);assert.equal(plan.dynamicDomInstaller,false);assert.equal(plan.evalOrFunctionConstructor,false);assert.equal(plan.outsideMarkerBytesIdentical,true);assert.equal(plan.outsideScriptCount,39);
  assert.equal(patch.base_version_hash,'d7474dd6');assert.equal(patch.patches.length,1);assert.equal(patch.slug,'v0.3.1.html');
  let expanded=patch.patches[0].replace;
  for(const row of plan.fragments){
    const content=readFileSync(new URL(row.name+'.html',dir),'utf8');
    const requestRaw=readFileSync(new URL(row.name+'.request.json',dir));const request=JSON.parse(requestRaw);
    assert.equal(request.operation,'create');assert.equal(request.project_id,29770);assert.equal(request.name,row.name);assert.equal(request.content,content);
    assert.equal(createHash('sha256').update(requestRaw).digest('hex'),row.requestSha256);assert.ok(requestRaw.length<40000);
    const include='<!--#wps-include fragment="'+row.name+'" -->';assert.equal(expanded.split(include).length-1,1);expanded=expanded.replace(include,content);
  }
  assert.equal(expanded,readFileSync(new URL('rendered-block.html',dir),'utf8'));
  assert.equal(createHash('sha256').update(expanded).digest('hex'),plan.renderedBlockSha256);
});

function historicalDocument(ids) {
  const nodes = new Map();
  const doc = {
    getElementById: id => nodes.get(id) || null,
    createElement: tagName => ({tagName, attributes: {}, setAttribute(name, value) {this.attributes[name] = value;}}),
    addHost(id) {
      const original = {textContent: 'M3 56/64', evidence: {energy: null, tau: null, inheritedCount: 56}};
      const host = {id, children: [original], prepend(node) {this.children.unshift(node); nodes.set(node.id, node);}};
      nodes.set(id, host);
      return host;
    },
  };
  ids.forEach(id => doc.addHost(id));
  return doc;
}

test('three historical scope notices are idempotent and preserve original engine children and data',()=>{
  const ids=['ms-m3eight-dialog','ms-m4-dialog','n3-picard-audit'];
  const doc=historicalDocument(ids), originals=ids.map(id=>doc.getElementById(id).children[0]);
  const before=JSON.stringify(originals);
  assert.equal(annotateHistoricalPanels(doc),3);
  assert.equal(annotateHistoricalPanels(doc),0);
  ids.forEach((id,index)=>{
    const host=doc.getElementById(id);assert.equal(host.children.length,2);assert.strictEqual(host.children[1],originals[index]);
    const note=host.children[0];assert.equal(note.id,'ms3ip-history-'+id);assert.equal(note.tagName,'aside');assert.equal(note.attributes.role,'note');
    for(const required of ['과거 저장 상태','62/64','N7-06·N8-05','OPEN','미확인','τ=null'])assert.ok(note.textContent.includes(required),required);
    assert.equal(/2026-\d\d-\d\d/.test(note.textContent),false);
  });
  assert.equal(JSON.stringify(originals),before);
});

test('missing historical hosts leave current UI usable and later available hosts receive one notice',()=>{
  const doc=historicalDocument([]);assert.equal(annotateHistoricalPanels(doc),0);
  const unrelated=doc.addHost('unrelated-preserved-panel'), original=unrelated.children[0];
  doc.addHost('n3-picard-audit');assert.equal(annotateHistoricalPanels(doc),1);assert.equal(annotateHistoricalPanels(doc),0);
  doc.addHost('ms-m4-dialog');assert.equal(annotateHistoricalPanels(doc),1);assert.equal(annotateHistoricalPanels(doc),0);
  assert.deepEqual(unrelated.children,[original]);
});

test('followup-2 replays exactly two guarded fragment patches while retaining all original evidence bytes',()=>{
  const dir=new URL('../generated/followup-2/',import.meta.url), originalDir=new URL('../generated/fragments/',import.meta.url);
  const plan=JSON.parse(readFileSync(new URL('FOLLOWUP_PLAN.json',dir),'utf8'));
  const hash=value=>createHash('sha256').update(value).digest('hex');
  assert.equal(plan.preparedOnly,true);assert.equal(plan.noRemoteWrites,true);assert.equal(plan.storedPageSSIUnchanged,true);
  assert.deepEqual(plan.noticeHostIds,['ms-m3eight-dialog','ms-m4-dialog','n3-picard-audit']);
  assert.equal(plan.patches.length,2);assert.equal(plan.dataSha256,hash(raw));assert.equal(plan.dataPartCount,12);
  assert.equal(plan.m3Complete,62);assert.equal(plan.actualGlobalLastResolvedTau,null);assert.equal(plan.wholeKActualEnergy,null);assert.equal(plan.m4OriginalAcceptance,'UNCONFIRMED');
  let expanded=readFileSync(new URL('stored-block.html',originalDir),'utf8');
  const originals=JSON.parse(readFileSync(new URL('FRAGMENT_PUBLICATION_PLAN.json',originalDir),'utf8'));
  for(const record of originals.fragments){
    let content=readFileSync(new URL(record.name+'.html',originalDir),'utf8');
    const changed=plan.patches.find(row=>row.name===record.name);
    if(changed){
      const requestBytes=readFileSync(new URL(record.name.endsWith('-layout')?'layout-patch.json':'runtime-patch.json',dir));
      const request=JSON.parse(requestBytes);assert.equal(hash(requestBytes),changed.requestSha256);assert.ok(requestBytes.length<5000);
      assert.equal(request.operation,'patch');assert.equal(request.project_id,29770);assert.equal(request.name,record.name);assert.equal(request.base_version_hash,changed.beforeSha256.slice(0,8));assert.equal(request.force,undefined);
      assert.equal(hash(content),changed.beforeSha256);assert.equal(request.patches.length,2);
      for(const patch of request.patches){assert.equal(patch.operation,'replace');assert.equal(content.split(patch.find).length-1,1);content=content.replace(patch.find,patch.replace);}
      assert.equal(hash(content),changed.afterSha256);
      assert.equal(content,readFileSync(new URL(record.name.endsWith('-layout')?'layout.html':'runtime.html',dir),'utf8'));
    } else {assert.equal(hash(content),record.contentSha256);}
    const token='<!--#wps-include fragment="'+record.name+'" -->';assert.equal(expanded.split(token).length-1,1);expanded=expanded.replace(token,content);
  }
  assert.equal(expanded,readFileSync(new URL('rendered-block.html',dir),'utf8'));assert.equal(hash(expanded),plan.renderedBlockSha256);
  assert.equal(plan.outsideMarkerBytesIdentical,true);assert.equal(plan.outsideScriptCount,39);
  const oldModel=readFileSync(new URL('../baseline/v118-published/recovery-model.mjs',import.meta.url),'utf8');
  assert.ok(readFileSync(new URL('../recovery-model.mjs',import.meta.url),'utf8').startsWith(oldModel));
});

test('prepared launcher CSS separates observed-size hit regions across desktop and narrow width assumptions',()=>{
  const layout=readFileSync(new URL('../generated/followup-2/layout.html',import.meta.url),'utf8');
  assert.ok(layout.includes('#ms-m3eight-launch{bottom:132px!important}'));
  assert.ok(layout.includes('#ms-m4-launcher{bottom:188px!important}'));
  for(const id of ['ms-m3eight-dialog','ms-m4-dialog','n3-picard-audit'])assert.ok(layout.includes('#'+id+'>.ms3ip-historical-notice'));
  const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  for(const width of [320,390,700,701,1348,1363]){
    const height=936, narrow=width<=700;
    const fresh={right:width-(narrow?12:20),bottom:height-76};fresh.left=fresh.right-194.5;fresh.top=fresh.bottom-46;
    const old={right:width-14,bottom:height-132};old.left=old.right-150.125;old.top=old.bottom-42.890625;
    const m4={left:12,right:151.5625,bottom:height-(narrow?188:12)};m4.top=m4.bottom-42.796875;
    for(const [a,b] of [[fresh,old],[fresh,m4],[old,m4]])assert.equal(overlap(a,b),false,String(width));
    for(const box of [fresh,old,m4])assert.ok(box.left>=0&&box.right<=width&&box.top>=0&&box.bottom<=height);
  }
  // These fixed observed-size calculations do not simulate a mobile browser or certify its layout.
});
