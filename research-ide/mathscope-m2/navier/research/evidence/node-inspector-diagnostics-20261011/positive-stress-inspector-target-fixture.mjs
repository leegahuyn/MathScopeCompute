import test from 'node:test';
import assert from 'node:assert/strict';
test('small read-only inspector target',async()=>{
  const end=performance.now()+2500;let sum=0;
  function diagnosticArithmeticBurst(){
    const stop=performance.now()+4;
    while(performance.now()<stop)sum+=Math.sqrt(1+sum%97);
  }
  while(performance.now()<end){diagnosticArithmeticBurst();await new Promise(resolve=>setTimeout(resolve,4));}
  assert.ok(sum>0);
});
