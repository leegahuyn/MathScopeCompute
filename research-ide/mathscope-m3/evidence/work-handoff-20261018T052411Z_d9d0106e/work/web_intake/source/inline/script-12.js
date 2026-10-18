
(() => {
  'use strict';
  const service = 'https://mathscope-compute.onrender.com';
  const history = [];
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  function failure(message, job = {}, cause) {
    const error = new Error(message, cause ? {cause} : undefined);
    Object.assign(error, {
      name: job.status === 'cancelled' ? 'AbortError' : 'Error',
      failureKind: job.error?.failureKind || (job.status === 'cancelled' ? 'CANCELLED' : job.status === 'timed_out' ? 'TIMEOUT' : 'COMPUTATION_FAILED'),
      jobId: job.jobId || null, status: job.status || 'unconfirmed',
      executionScope: job.jobId ? 'SERVER_WORKER' : 'CLIENT_REQUEST',
      cancellationConfirmed: job.cancellationConfirmed === true,
      workerStopped: job.workerStopped === true
    });
    return error;
  }
  async function json(path, method, body, token, timeoutMs = 20000) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(service + path, {
        method, credentials:'omit', redirect:'error', signal:controller.signal,
        headers:{...(body ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:'Bearer ' + token} : {})},
        ...(body ? {body:JSON.stringify(body)} : {})
      });
      const data = await response.json();
      if (!response.ok) throw Error('Compute HTTP ' + response.status + ': ' + JSON.stringify(data.detail || data).slice(0, 200));
      return data;
    } finally { clearTimeout(timer); }
  }
  function start(payload, {onStatus = () => {}} = {}) {
    let handle = null, cancellationRequested = false, terminal = false, last = null;
    function report(job) {
      const {token:secret, result:scientificResult, ...safe} = job;
      last = safe;
      try { onStatus({...safe}); } catch (_) { /* Rendering must not strand a server job. */ }
      return job;
    }
    async function cancelOwned() {
      return report(await json('/v1/jobs/' + encodeURIComponent(handle.jobId) + '/cancel', 'POST', null, handle.token));
    }
    const promise = (async () => {
      try {
        // Do not abort an in-flight submission on a user's cancel click: retain its
        // ownership handle, then cancel the actual worker as soon as it arrives.
        const submitted = await json('/v1/jobs', 'POST', payload, null, 120000);
        if (!submitted.jobId || !submitted.token) throw Error('Job ownership handle missing');
        handle = {jobId:submitted.jobId, token:submitted.token};
        let job = report(submitted), deadline = performance.now() + 125000;
        while (true) {
          if (cancellationRequested && !['cancelled','timed_out'].includes(job.status)) job = await cancelOwned();
          if (job.status === 'completed' && !cancellationRequested) {
            if (job.workerStopped !== true || !job.result) throw failure('Worker completion is not confirmed', job);
            terminal = true;
            return {result:job.result, job:{...last}};
          }
          if (['cancelled','timed_out','failed'].includes(job.status)) {
            terminal = true;
            throw failure(job.error?.message || 'Server job ' + job.status, job);
          }
          if (performance.now() >= deadline) throw failure('Job deadline exceeded; checking server cancellation', {...job,status:'timed_out'});
          await sleep(Math.min(1000, Math.max(200, Number(job.pollAfterMs) || 300)));
          job = report(await json('/v1/jobs/' + encodeURIComponent(handle.jobId), 'GET', null, handle.token));
        }
      } catch (error) {
        if (handle && !terminal) {
          try {
            const stopped = await cancelOwned();
            terminal = ['cancelled','timed_out','failed'].includes(stopped.status);
            throw failure(error.message + (stopped.cancellationConfirmed ? ' · server worker stopped' : ' · server stop unconfirmed'), stopped, error);
          } catch (stopError) {
            if (stopError.cause === error) throw stopError;
            throw failure(error.message + ' · server cancellation could not be confirmed', last || {}, error);
          }
        }
        if (error.executionScope) throw error;
        throw failure(error.message + (!handle ? ' · submission outcome unknown; no result committed' : ''), last || {}, error);
      } finally {
        if (last) { history.push({...last}); if (history.length > 10) history.shift(); }
        if (handle) handle.token = null;
      }
    })();
    return {
      promise,
      cancel() { cancellationRequested = true; return promise.then(value => value.job, error => ({jobId:error.jobId,status:error.status,cancellationConfirmed:error.cancellationConfirmed,workerStopped:error.workerStopped})); },
      getStatus() { return last ? {...last} : {status:'submitting',cancellationRequested}; }
    };
  }
  window.MathScopeJobs = Object.freeze({start, getHistory:() => history.map(item => ({...item}))});
})();

async function progressiveSurface(T, group, nx, ny, at, opts = {}) {
  if (![nx,ny].every(n=>Number.isInteger(n)&&n>=2) || nx*ny>250000) throw Error('Surface grid exceeds the bounded display budget');
  const stride=group.userData?.lod==='compact'?2:1;
  const axis=n=>{const a=[];for(let i=0;i<n;i+=stride)a.push(i);if(a.at(-1)!==n-1)a.push(n-1);return a;};
  const xs=axis(nx),ys=axis(ny),count=xs.length*ys.length;
  const sourceValid=new Uint8Array(nx*ny),points=new Array(nx*ny);
  const vertices=new Float32Array(count*3),colors=new Float32Array(count*3);
  const indexes=new Uint32Array((xs.length-1)*(ys.length-1)*6);
  const loading=group.userData.loading||{},started=performance.now();
  let yields=0,updates=0,indexCount=0,validCount=0,maskedCount=0,mesh=null;
  const check=()=>{if(loading.isCancelled?.())throw new DOMException('View changed while loading surface','AbortError');};
  async function update(phase,loaded,total) {
    check(); updates++;
    loading.onProgress?.({phase,loaded,total,partial:loaded<total,geometryIsEvidence:false});
    // Yield after each bounded row batch so the page paints and handles input.
    await new Promise(resolve=>setTimeout(resolve,0)); yields++; check();
  }
  for(let j=0;j<ny;j++) {
    for(let i=0;i<nx;i++) {
      const k=j*nx+i,p=at(i/(nx-1),j/(ny-1),i,j),valid=!!p&&[p[0],p[1],p[2]].every(Number.isFinite);
      points[k]=valid?p:null;sourceValid[k]=valid?1:0;if(!valid)maskedCount++;
    }
    if((j+1)%8===0||j===ny-1)await update('validate source rows',j+1,ny);
  }
  const geometry=new T.BufferGeometry();
  const positionAttribute=new T.Float32BufferAttribute(vertices,3),colorAttribute=new T.Float32BufferAttribute(colors,3);
  const indexAttribute=new T.BufferAttribute(indexes,1);
  geometry.setAttribute('position',positionAttribute);geometry.setAttribute('color',colorAttribute);geometry.setIndex(indexAttribute);geometry.setDrawRange(0,0);
  const material=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,opacity:.93});
  mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;group.add(mesh);
  // Three copies typed arrays when constructing Float32BufferAttribute.
  const positions=positionAttribute.array,colourValues=colorAttribute.array;
  try {
    for(let row=0;row<ys.length;row++) {
      const j=ys[row];
      for(let col=0;col<xs.length;col++) {
        const i=xs[col],k=row*xs.length+col,p=points[j*nx+i];
        if(p){positions.set(p,k*3);validCount++;}
        const hue=opts.hue?opts.hue(i/(nx-1),j/(ny-1),i,j):.48+.25*Math.sin(i*.2);
        const color=new T.Color().setHSL(((hue%1)+1)%1,.7,.54);colourValues.set([color.r,color.g,color.b],k*3);
      }
      if(row>0)for(let col=0;col<xs.length-1;col++) {
        let masked=false;
        for(let y=ys[row-1];y<=ys[row];y++)for(let x=xs[col];x<=xs[col+1];x++)if(!sourceValid[y*nx+x])masked=true;
        if(masked)continue;
        const a=(row-1)*xs.length+col,b=a+1,c=a+xs.length,d=c+1;
        indexes.set([a,b,c,b,d,c],indexCount);indexCount+=6;
      }
      if((row+1)%4===0||row===ys.length-1) {
        positionAttribute.needsUpdate=true;colorAttribute.needsUpdate=true;indexAttribute.needsUpdate=true;
        geometry.setDrawRange(0,indexCount);
        await update('load mesh rows',row+1,ys.length);
      }
    }
  } catch(error) { group.remove(mesh);geometry.dispose();material.dispose();throw error; }
  const stats={sourceSamples:nx*ny,renderedVertices:validCount,triangles:indexCount/3,stride,maskedSourceSamples:maskedCount,
    progressive:{complete:true,rowBatch:8,yields,updates,elapsedMs:Number((performance.now()-started).toFixed(2)),partialGeometryIsEvidence:false}};
  group.userData.surfaceStats=[...(group.userData.surfaceStats||[]),stats];
  return {mesh,triangles:stats.triangles,vertices:stats.renderedVertices};
}

window.MathScopeProgressiveSurface=progressiveSurface;
(() => {
  let generation=0, previous=null;
  const $=id=>document.getElementById(id);
  function cleanup(){if(previous){previous.scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});previous.renderer.dispose();previous=null;}}
  async function run(){
    const button=$('v031ProgressiveRun'),cancel=$('v031ProgressiveCancel'),canvas=$('v031ProgressiveCanvas'),info=$('v031ProgressiveStatus');
    if(button.disabled)return;button.disabled=true;cancel.disabled=false;
    const own=++generation,updates=[],started=performance.now();cleanup();
    try{
      const T=await import('three');if(own!==generation)throw new DOMException('Cancelled','AbortError');
      const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'}),scene=new T.Scene();previous={renderer,scene};
      renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));renderer.setSize(Math.max(240,canvas.clientWidth),260,false);
      scene.background=new T.Color(0x061520);const camera=new T.PerspectiveCamera(45,Math.max(240,canvas.clientWidth)/260,.1,100);camera.up.set(0,0,1);camera.position.set(8,-9,7);camera.lookAt(0,0,0);
      const group=new T.Group();scene.add(group);group.userData.loading={isCancelled:()=>own!==generation||!canvas.getClientRects().length,onProgress:p=>{updates.push({...p,elapsedMs:Number((performance.now()-started).toFixed(2))});info.textContent='SYNTHETIC benchmark · '+p.phase+' '+p.loaded+'/'+p.total+' · no mathematical evidence';canvas.dataset.loading=JSON.stringify(p);renderer.render(scene,camera);}};
      await window.MathScopeProgressiveSurface(T,group,201,201,(u,v)=>[(u-.5)*8,(v-.5)*8,Math.sin(u*12)*Math.cos(v*12)],{hue:u=>u*.6});
      renderer.render(scene,camera);
      info.textContent='Synthetic mesh loaded. Measuring 180 visible stationary frames…';
      const frameTimes=[],submitTimes=[];let lastFrame=null;const frameStart=performance.now();
      await new Promise((resolve,reject)=>{function frame(time){
        if(own!==generation||!canvas.getClientRects().length||document.visibilityState!=='visible'||performance.now()-frameStart>15000){reject(new DOMException('Frame sample interrupted','AbortError'));return;}
        if(lastFrame!==null)frameTimes.push(time-lastFrame);lastFrame=time;
        const submit=performance.now();renderer.render(scene,camera);submitTimes.push(performance.now()-submit);
        if(frameTimes.length>=180)resolve();else requestAnimationFrame(frame);
      }requestAnimationFrame(frame);});
      const sorted=[...frameTimes].sort((a,b)=>a-b);
      const frameSample={frames:180,fps:Number((180000/frameTimes.reduce((a,b)=>a+b,0)).toFixed(2)),frameMsP95:Number(sorted[171].toFixed(2)),renderSubmitMsMean:Number((submitTimes.reduce((a,b)=>a+b,0)/submitTimes.length).toFixed(3)),scope:'Visible stationary frame callbacks and CPU command submission; GPU completion and browser CPU utilization are not measured'};
      const report={pass:true,source:'SYNTHETIC 201×201 finite display benchmark',sourceSamples:40401,triangles:80000,stats:group.userData.surfaceStats[0],progressUpdates:updates.length,partialUpdates:updates.filter(x=>x.phase==='load mesh rows'&&x.partial).length,elapsedMs:Number((performance.now()-started).toFixed(2)),frameSample,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio||1},geometryIsEvidence:false};
      canvas.dataset.report=JSON.stringify(report);info.textContent=JSON.stringify(report,null,2);
    }catch(error){const report={pass:false,cancelled:error.name==='AbortError',error:error.message,partialUpdates:updates.length,geometryIsEvidence:false};canvas.dataset.report=JSON.stringify(report);info.textContent=(report.cancelled?'LOADING CANCELLED':'LOADING FAILED')+' · no mathematical evidence · '+error.message;cleanup();}
    finally{button.disabled=false;cancel.disabled=true;}
  }
  function init(){$('v031ProgressiveRun')?.addEventListener('click',run);$('v031ProgressiveCancel')?.addEventListener('click',()=>{generation++;$('v031ProgressiveStatus').textContent='Stopping progressive loading…';});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

