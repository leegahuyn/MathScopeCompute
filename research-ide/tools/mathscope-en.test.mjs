import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const run = (file, args) => spawnSync(process.execPath, [file, ...args], { cwd: root, encoding: 'utf8', timeout: 60000, maxBuffer: 8*1024*1024 });
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const original = run('mathscope-m1/cli.mjs', ['list', '--json']);
const english = run('tools/mathscope-en.mjs', ['list', '--json']);
assert.equal(original.status, 0, original.stderr);
assert.equal(english.status, 0, english.stderr);
const originalList = JSON.parse(original.stdout);
const englishList = JSON.parse(english.stdout);

test('All 59 actual example IDs have English labels with the original order and domain', () => {
  assert.equal(englishList.exampleCount, 59);
  assert.equal(englishList.presentationOnly, true);
  assert.equal(englishList.requestsModified, false);
  assert.deepEqual(englishList.examples.map(x=>[x.id,x.domain]),originalList.examples.map(x=>[x.id,x.domain]));
  for (const x of englishList.examples) assert.ok(x.label.length>0&&!/[가-힣]/u.test(x.label));
});

test('English listing preserves every exact request and the original label', () => {
  originalList.examples.forEach((x,i) => {
    assert.deepEqual(englishList.examples[i].request,x.request);
    assert.equal(englishList.examples[i].presentationRequestSha256,digest(x.request));
    assert.equal(englishList.examples[i].originalLabel,x.label);
  });
});

test('English run delegates to the pinned Worker with the same prime result and mathematical hash', () => {
  const tmp=mkdtempSync(join(tmpdir(),'mathscope-english-delegation-'));
  try {
    const first=join(tmp,'original');
    const second=join(tmp,'english');
    const a=run('mathscope-m1/cli.mjs',['run','prime-1000','--out',first]);
    const b=run('tools/mathscope-en.mjs',['run','prime-1000','--out',second]);
    assert.equal(a.status,0,a.stderr);
    assert.equal(b.status,0,b.stderr);
    const aSummary=JSON.parse(readFileSync(join(first,'summary.json')));
    const bSummary=JSON.parse(readFileSync(join(second,'summary.json')));
    assert.equal(aSummary.status,'COMPLETED');
    assert.equal(bSummary.status,'COMPLETED');
    assert.equal(bSummary.workerSha256,'0526fb1030c328e940c39672e86dfb9d24f09f4622794269c1e0eadbb92cc0ca');
    assert.equal(aSummary.mathematicalHash,bSummary.mathematicalHash);
    assert.deepEqual(JSON.parse(readFileSync(join(first,'request.json'))),JSON.parse(readFileSync(join(second,'request.json'))));
    assert.equal(bSummary.interpretation.exportedEvidenceTrusted,false);
    assert.deepEqual(readdirSync(second).sort(),['environment.json','files-manifest.json','replay-bundle.json','request.json','result.json','summary.json']);
  } finally { rmSync(tmp,{recursive:true,force:true}); }
});

test('Delegation preserves invalid-example and existing-directory refusal', () => {
  const unknown=run('tools/mathscope-en.mjs',['run','does-not-exist']);
  assert.equal(unknown.status,1);
  const tmp=mkdtempSync(join(tmpdir(),'mathscope-english-refusal-'));
  try {
    const existing=run('tools/mathscope-en.mjs',['run','prime-1000','--out',tmp]);
    assert.equal(existing.status,1);
    assert.deepEqual(readdirSync(tmp),[]);
  } finally { rmSync(tmp,{recursive:true,force:true}); }
});

test('Unsupported English-list arguments fail without inventing a run interface', () => {
  assert.equal(run('tools/mathscope-en.mjs',['list','--request']).status,1);
  assert.equal(run('tools/mathscope-en.mjs',['replay','arbitrary.json']).status,1);
});
