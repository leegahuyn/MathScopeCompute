/** Opt-in directed cap for deep positive exponential sums. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

export async function makeFineArithmeticModule(goal) {
  const bytes=await readFile(resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    '4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47');
  let helper=bytes.toString();
  const initialization="    let js = await readFile(file, 'utf8');";
  assert.equal(helper.split(initialization).length,2);
  helper=helper.replace(initialization,initialization+
    '\n    js=js.replace("let operations=0", "let deepPositiveSumRefinements=0;let operations=0");'+
    '\n    js=js.replace("precisionBits,operations,regularOperations", "precisionBits,operations,deepPositiveSumRefinements,regularOperations");');
  const oldCap='const upper=addPoints(big.argument,one,depth+1).upper;return {lower:big,upper:expPoint(upper,depth+1)};';
  assert.equal(helper.split(oldCap).length,2);
  const fineCap=[
    'let cursor=big;let layers=0;',
    'while(cursor.kind==="exp"&&cursor.sign===1){layers++;cursor=cursor.argument;}',
    'if(layers>=2&&cursor.kind==="rational"&&qcompare(cursor.value,Q(256))>=0){',
    'let upper=checkedQ(qadd(cursor.value,Q(1,1n<<128n)));',
    'for(let j=0;j<layers;j++)upper=expPoint(upper,depth+1);',
    'deepPositiveSumRefinements++;return {lower:big,upper};}',
    oldCap,
  ].join('');
  helper=helper.replace(oldCap,fineCap);
  return 'data:text/javascript;base64,'+Buffer.from(helper).toString('base64');
}
