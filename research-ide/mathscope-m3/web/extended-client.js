/* Generated static worker bytes replace exactly one token at build time. */
(()=>{
  'use strict';
  const workerSource = __M3_EXTENDED_STATIC_WORKER_SOURCE__;
  const build = __M3_EXTENDED_BUILD_METADATA__;
  let pending=null;
  const execute=(message)=>{
    if(pending)return Promise.reject(new Error('다른 M3 계산이 실행 중입니다.'));
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'}));
      const worker=new Worker(url);URL.revokeObjectURL(url);
      const id=crypto.randomUUID();
      const finish=(error,value)=>{if(!pending||pending.id!==id)return;clearTimeout(pending.timer);worker.terminate();pending=null;error?reject(error):resolve(value);};
      pending={id,worker,finish,timer:setTimeout(()=>finish(new Error('계산 예산 120초에 도달했습니다. 결과는 미완료로 남습니다.')),120000)};
      worker.onerror=event=>finish(new Error(event.message||'계산 Worker를 시작하지 못했습니다.'));
      worker.onmessage=event=>{const m=event.data;if(m.id!==id)return;m.ok?finish(null,m):finish(new Error(m.error?.message||'입력 또는 실행이 거부되었습니다.'));};
      worker.postMessage({...message,id});
    });
  };
  window.MathScopeM3ExtendedEngine=Object.freeze({
    build,
    run:request=>execute({action:'run',request}),
    replay:record=>execute({action:'replay',record}),
    inspect:record=>execute({action:'inspect',record}),
    select:(record,stateIndex,pointIndex)=>execute({action:'select',record,stateIndex,pointIndex}),
    cancel(){if(!pending)return false;pending.finish(new Error('사용자가 계산을 중단했습니다. 미완료 결과는 채택하지 않습니다.'));return true;},
    busy:()=>!!pending
  });
})();
