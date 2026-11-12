/** Check exact fixture, then create a new disposable original/overlay pair. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {inventory,sha} from './inventory.mjs';
const [source,destination]=process.argv.slice(2);
if(!destination)throw Error('Usage: node create_pair.mjs SOURCE_RUNTIME NEW_OUTPUT_DIRECTORY');
const own=path.dirname(fileURLToPath(import.meta.url));
const manifestBytes=fs.readFileSync(path.join(own,'input-manifest.json'));
assert.equal(sha(manifestBytes),'cbc739f318a2f0e7e6ee621e9559472227b3b35456ee209146a168852743741c');
assert.deepEqual(inventory(source),JSON.parse(manifestBytes));
assert(!fs.existsSync(destination),'Output must be a new directory');
const helper=fs.readFileSync(path.join(own,'old-helper.mjs'));
assert.equal(sha(helper),'81bb2348dada517cc7cc76adc78b617703ba3f83f9a3f578e62c5394f8b49fc8');
fs.mkdirSync(destination,{recursive:true});
const patched=path.join(destination,'pressure.overlay.mjs');
const input=path.join(source,'research-ide/mathscope-m3/navier/source-global-pressure.mjs');
const child=spawnSync(process.execPath,[path.join(own,'prepare_pressure.mjs'),input,patched],{stdio:'inherit'});
assert.equal(child.status,0,'Reversible pressure overlay failed');
for(const mode of ['original','overlay']){
  const out=path.join(destination,mode);
  fs.cpSync(source,out,{recursive:true,errorOnExist:true});
  if(mode==='overlay'){
    fs.copyFileSync(patched,path.join(out,'research-ide/mathscope-m3/navier/source-global-pressure.mjs'));
    fs.writeFileSync(path.join(out,'research-ide/mathscope-m2/navier/mathscope-large-seal.mjs'),helper,{flag:'wx'});
  }
}
console.log('PASS: pinned scratch original and old-helper overlay runtimes prepared');
