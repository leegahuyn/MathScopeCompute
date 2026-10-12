import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
test('small checkpoint and CPU diagnostic integration',async()=>{
  console.log('# SOURCE_PROGRESS '+JSON.stringify({phase:'positive-stress-leading-angular-source-start',at:new Date().toISOString(),rssBytes:process.memoryUsage().rss}));
  const start=performance.now();let checkpoints=0,sum=0;
  async function checkpoint(complete=false){
    checkpoints++;
    await writeFile(process.env.M2_COMMON_PHYSICAL_EVIDENCE,JSON.stringify({complete,certificates:{fixture:{checkpoints}},sourceConstructions:{fixture:1},mathematicalSourceExecuted:false}));
  }
  function diagnosticArithmeticBurst(){
    const until=performance.now()+3;
    while(performance.now()<until)sum+=Math.sqrt(1+sum%97);
  }
  await checkpoint();
  while(performance.now()-start<2400){
    diagnosticArithmeticBurst();
    if(performance.now()-start<550&&performance.now()-start>checkpoints*100)await checkpoint();
    await new Promise(resolve=>setTimeout(resolve,4));
  }
  assert.ok(sum>0);assert.ok(checkpoints>=3);await checkpoint(true);
});
