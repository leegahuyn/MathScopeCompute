/** Increase one exact node ceiling in memory, without changing source files. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {registerHooks} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const SHA='cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3';
const BEFORE='if(this.nodes.length>=350000)';
const AFTER='if(this.nodes.length>=750000)';

export function leadingCapacity(runtime){
  const target=pathToFileURL(resolve(runtime,'mathscope-m2/navier/actual-global-source-expressions.mjs')).href;
  let applied=0;
  registerHooks({load(url,context,next){
    const result=next(url,context);
    if (url!==target) return result;
    assert.equal(++applied,1);
    const raw=Buffer.from(result.source);
    assert.equal(createHash('sha256').update(raw).digest('hex'),SHA);
    const original=raw.toString('utf8');
    assert.equal(original.split(BEFORE).length,2);
    const expanded=original.replace(BEFORE,AFTER);
    assert.equal(expanded.replace(AFTER,BEFORE),original);
    return {...result,source:expanded};
  }});
  return ()=>{
    assert.equal(applied,1);
    return {verifiedUnmodifiedOriginalSHA256:SHA,oldNodeLimit:350000,newNodeLimit:750000,
      mutation:'One bounded integer resource ceiling in the process loader. No mathematical operation or source disk file changed.'};
  };
}
