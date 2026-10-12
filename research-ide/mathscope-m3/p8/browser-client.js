/* Static source worker; no user-supplied code is evaluated. */
(()=>{'use strict';
  const source=__P8_STATIC_WORKER_SOURCE__;
  let worker=null,url=null,pending=null,sequence=0;
  function dispose(reason){if(worker)worker.terminate();worker=null;if(url)URL.revokeObjectURL(url);url=null;if(pending){clearTimeout(pending.timer);pending.reject(Error(reason));pending=null;}}
  function start(){if(worker)return;if(typeof Worker!=='function')throw Error('이 브라우저는 P8 계산 Worker를 지원하지 않습니다.');url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));try{worker=new Worker(url);}catch(error){dispose(error.message||'Worker creation failed.');throw error;}worker.onmessage=event=>{if(!pending||event.data.id!==pending.id)return;const job=pending;pending=null;clearTimeout(job.timer);if(event.data.error)job.reject(Error(event.data.error));else job.resolve(event.data.result);};worker.onerror=event=>{event.preventDefault();dispose(event.message||'P8 worker failed.');};}
  function call(method,input){if(pending)return Promise.reject(Error('P8 계산이 실행 중입니다.'));try{start();}catch(e){return Promise.reject(e);}return new Promise((resolve,reject)=>{const id=++sequence;pending={id,resolve,reject,timer:setTimeout(()=>dispose('P8 계산이 90초 제한에 도달했습니다. 새 실행이 필요합니다.'),90000)};try{worker.postMessage({id,method,input});}catch(error){dispose(error.message||'Request cannot be cloned.');}});}
  window.MathScopeP8Engine=Object.freeze({capabilities:()=>call('capabilities'),run:request=>call('run',request),replay:record=>call('replay',record),exportReviewPackets:()=>call('exportReviewPackets'),cancel:()=>dispose('P8 계산을 취소했습니다.')});
  window.addEventListener('pagehide',()=>dispose('페이지를 닫아 P8 계산을 종료했습니다.'));
})();
