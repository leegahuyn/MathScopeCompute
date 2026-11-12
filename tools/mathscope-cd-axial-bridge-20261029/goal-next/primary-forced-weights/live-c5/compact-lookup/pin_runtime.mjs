import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const sha=b=>createHash('sha256').update(b).digest('hex');
export async function pinRuntime(root){
  const raw=await readFile(resolve(root,'GIT-SOURCE-SHA256.json'));
  assert.equal(sha(raw),'4ed49674a762ecf54adaa8ddf9b5c0955c484b5442dc251d862f0156f502f066');
  const manifest=JSON.parse(raw);assert.equal(Object.keys(manifest).length,119);
  for(const [path,pin] of Object.entries(manifest)){
    assert(path.startsWith('research-ide/')&&!path.split('/').includes('..'));
    assert.equal(sha(await readFile(resolve(root,path))),pin,path);
  }
}
