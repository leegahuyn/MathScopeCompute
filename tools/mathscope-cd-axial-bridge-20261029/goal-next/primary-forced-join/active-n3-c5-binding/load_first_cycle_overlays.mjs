import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {dirname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const path = process.env.MATHSCOPE_FIRST_CYCLE_OVERLAY_MANIFEST;
assert.ok(path);
const manifest = JSON.parse(readFileSync(path, 'utf8'));
assert.equal(manifest.schema, 'MathScope.PR30OriginalVerifiedStorageOverlays/1');
const modules = new Map(manifest.files.map(row => {
  const original = readFileSync(row.original);
  assert.equal(createHash('sha1').update(`blob ${original.length}\0`).update(original).digest('hex'), row.gitBlobSHA);
  const source = readFileSync(resolve(dirname(path), row.overlay));
  assert.equal(createHash('sha256').update(source).digest('hex'), row.sha256);
  return [pathToFileURL(resolve(row.original)).href, source];
}));
assert.equal(modules.size, manifest.files.length);
registerHooks({load(url, context, nextLoad) {
  if (modules.has(url)) return {format: 'module', source: modules.get(url), shortCircuit: true};
  return nextLoad(url, context);
}});
