import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runJob,getExamples,validateRequest,verifyCorrelatorFamily} from '../index.mjs';
import {makeM2Visualization,listM2Panels,makeObservationPair} from '../../visualization/m2-views.mjs';
import {traceBasis,numericValue} from '../../visualization/observations.mjs';
import {packMarks} from '../../visualization/webgl-marks.mjs';
import {canonicalStringify,sha256} from '../../../mathscope-m0/contracts.mjs';
const examples=getExamples(),results=new Map(),clone=x=>JSON.parse(JSON.stringify(x)),reports=[];
const lookup=async id=>{if(!results.has(id))results.set(id,await runJob(examples.find(x=>x.id===id).request));return results.get(id);};
const job=(request,result)=>({id:'observation-audit',status:result.status,request,result,inputHash:'same-owned-input',resultHash:'same-owned-result'});
const close=(a,b,tol=1e-11)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const resolve=(object,path)=>path.replaceAll('[','.').replaceAll(']','').split('.').reduce((v,k)=>v?.[k],object);

test('all eleven observation examples compute and expose nonempty source-bound panels',async()=>{
  for(const e of examples){const r=await lookup(e.id),j=job(e.request,r),v=makeM2Visualization(j);assert.equal(r.status,'COMPLETED',e.id);assert.ok(r.checks.every(c=>c.pass===true||c.ok===true),e.id);assert.equal(v.state,'READY');assert.ok(v.table.rows.length>0,e.id);for(const p of v.table.sourcePaths)assert.notEqual(resolve(j,p),undefined,p);assert.ok(v.axisMetadata.every(a=>a.type&&a.sourceField&&a.unit&&a.scale&&a.transform&&Number.isFinite(a.dataDimension)),e.id);reports.push({id:e.id,status:r.status,sourceHash:r.sourceHash,checks:r.checks.length,view:v.kind,tableRows:v.table.rows.length});}
});
test('Delta lower-bound and unit modes preserve physical field and spectral C(t)',async()=>{
  for(const mode of ['assumed_bound','units']){const r=await lookup('i2-delta-'+mode),[a,b]=r.states;assert.equal(a.modelHash,b.modelHash);for(const[p,i]of a.correlator.map((p,i)=>[p,i]))close(p.correlation,b.correlator[i].correlation);if(mode==='units')assert.notEqual(a.observationHash,b.observationHash);else{assert.equal(a.observationHash,b.observationHash);assert.equal(a.sampleHash,b.sampleHash);}const j=job(examples.find(e=>e.id==='i2-delta-'+mode).request,r),pair=makeObservationPair(j);assert.deepEqual(pair.left.color.range,pair.right.color.range);assert.deepEqual(pair.left.scene.bounds,pair.right.scene.bounds);}
});
test('Effective spectral family obeys independently evaluated exponential Delta ratio',async()=>{
  const r=await lookup('i2-delta-effective_model'),[a,b]=r.states;assert.notEqual(a.modelHash,b.modelHash);for(let i=0;i<a.correlator.length;i++){const t=a.correlator[i].time;close(b.correlator[i].correlation/a.correlator[i].correlation,Math.exp(-(b.delta-a.delta)*t));}
  const e=examples.find(e=>e.id==='i2-delta-effective_model'),v=makeM2Visualization(job(e.request,r),{panel:'correlator'});assert.equal(v.axisMetadata[0].type,'SPECTRAL_TIME');assert.equal(v.scene.points.length,50);assert.ok(v.scene.points.every(p=>p.pos.every(Number.isFinite)));
});
test('Ensemble correlators are computed from the actual Gibbs chains, with algorithmic lag',async()=>{
  const r=await lookup('i2-delta-ensemble_estimate'),[a,b]=r.states;assert.notEqual(a.modelHash,b.modelHash);assert.notEqual(a.sampleHash,b.sampleHash);
  for(const s of r.states){const xs=s.result.replicas[0].history.filter(p=>p.phase!=='BURN_IN').map(p=>p.action),mean=xs.reduce((x,y)=>x+y,0)/xs.length,den=xs.reduce((x,y)=>x+(y-mean)**2,0)/xs.length;for(const p of s.correlator){const cov=xs.slice(p.lag).reduce((v,x,i)=>v+(x-mean)*(xs[i]-mean),0)/(xs.length-p.lag);close(p.value,cov/den);}}
  const e=examples.find(e=>e.id==='i2-delta-ensemble_estimate'),v=makeM2Visualization(job(e.request,r),{panel:'correlator'});assert.equal(v.axisMetadata[0].type,'MONTE_CARLO_LAG');
});
test('a corrupted correlator is rejected against its declared spectral or ensemble source',async()=>{for(const mode of ['effective_model','ensemble_estimate']){const r=clone(await lookup('i2-delta-'+mode)),field=mode==='effective_model'?'correlation':'value';r.states[0].correlator[1][field]+=.01;assert.equal(verifyCorrelatorFamily(r.states,mode.toUpperCase()).pass,false);}});
test('4D integral and conditional mean differ by fibre length; Wilson endpoints retain covariance',async()=>{
  const integral=await lookup('i2-4d-finite_marginal'),mean=await lookup('i2-4d-conditional_mean');for(let i=0;i<integral.visualization.points.length;i++)close(integral.visualization.points[i].value/4,mean.visualization.points[i].value);
  for(const op of ['slice','finite_marginal','conditional_mean','wilson_open','wilson_closed']){const r=await lookup('i2-4d-'+op);assert.equal(r.observationContract.reconstructionAllowed,false);assert.equal(r.observationContract.scalarReturnsConnection,false);}
  const open=await lookup('i2-4d-wilson_open'),closed=await lookup('i2-4d-wilson_closed');assert.equal(open.observationContract.outputType,'GAUGE_COVARIANT_TRANSPORT');assert.equal(closed.observationContract.outputType,'GAUGE_INVARIANT_CLOSED_CHARACTER');assert.notDeepEqual(open.observationContract.endpointConvention.path[0],open.observationContract.endpointConvention.path.at(-1));assert.deepEqual(closed.observationContract.endpointConvention.path[0],closed.observationContract.endpointConvention.path.at(-1));
});
test('same-profile blowup views contract by exact coordinate exponents in a fixed physical viewport',async()=>{
  const r=await lookup('i2-blowup-pair'),e=examples.find(e=>e.id==='i2-blowup-pair'),j=job(e.request,r),a=r.pairs[0],b=r.pairs[1],ratio=b.tau/a.tau,D=.5-e.request.input.h;
  for(let i=0;i<a.left.result.visualization.points.length;i++){const p=a.left.result.visualization.points[i],q=b.left.result.visualization.points[i];close(q.pos[0],p.pos[0]*Math.sqrt(ratio));close(q.pos[1],p.pos[1]*Math.sqrt(ratio));close(q.pos[2],p.pos[2]*ratio**D);assert.deepEqual(a.right.result.visualization.points[i].pos,b.right.result.visualization.points[i].pos);assert.equal(p.value,a.right.result.visualization.points[i].value);assert.equal(a.magnification[i].radial,1/Math.sqrt(p.q));}
  const pa=makeObservationPair(j,{panel:a.id,colorMode:'FIXED'}),pb=makeObservationPair(j,{panel:b.id,colorMode:'FIXED'});assert.deepEqual(pa.left.scene.bounds,pb.left.scene.bounds);assert.deepEqual(pa.left.color.range,pb.left.color.range);const auto=makeObservationPair(j,{panel:a.id,colorMode:'AUTO'});assert.notDeepEqual(auto.left.color.range,pa.left.color.range);
  const zero=makeM2Visualization(j,{panel:'tau-3'});assert.equal(zero.state,'SINGULAR_BOUNDARY');assert.equal(zero.scene.points.length,0);assert.equal(zero.scene.lines.length,0);
  const tiny=clone(e.request);tiny.input.taus=[.1,1e-260];const rr=await runJob(tiny);assert.equal(rr.pairs[1].state,'PRECISION_REQUIRED');assert.ok(!rr.pairs[1].left);
});
test('source replay is deterministic including nested chains and profile budgets',async()=>{
  for(const id of ['i2-delta-assumed_bound','i2-delta-ensemble_estimate','i2-blowup-pair']){const e=examples.find(e=>e.id===id),a=await lookup(id),b=await runJob(e.request);assert.equal(await sha256(a),await sha256(b),id);}
});
test('unimodular basis shear changes chain coordinates and preserves exact H and Frobenius',async()=>{
  const e=examples.find(e=>e.id==='i2-complex-basis'),variants=[];
  for(const basis of ['ORIGINAL','REVERSE','SHEAR']){const q=clone(e.request);q.input.basis=basis;const r=await runJob(q);assert.ok(r.checks.every(c=>c.pass===true||c.ok===true));variants.push(r.results);const j=job(q,r),panels=listM2Panels(j);assert.ok(panels.some(p=>p.id==='filtration-0'));for(const p of panels.filter(p=>p.chart?.kind==='MATRIX')){const v=makeM2Visualization(j,{panel:p.id});for(const path of v.table.sourcePaths)assert.notEqual(resolve(j,path),undefined,path);}const trace=traceBasis(j,0,1);assert.equal(trace.ok,true);assert.equal(trace.invariantSource,'EXISTING_COMPUTATION_RESULT');}
  assert.notEqual(canonicalStringify(variants[0].complex.differentials),canonicalStringify(variants[2].complex.differentials));assert.equal(canonicalStringify(variants[0].cohomology),canonicalStringify(variants[2].cohomology));assert.equal(canonicalStringify(variants[0].frobenius.transported),canonicalStringify(variants[2].frobenius.transported));
});
test('selected basis traces the actual retraction, homotopy and exact comparison roundtrip',async()=>{
  const e=examples.find(e=>e.id==='i2-complex-basis'),r=await lookup(e.id),j=job(e.request,r),d=r.results,c=d.complex,R=d.retraction;
  const apply=(m,v)=>{if(!m)return [];const out=Array(m.rows).fill(0n);for(const [i,k,a]of m.entries)out[i]+=BigInt(a)*(v[k]||0n);return out;};
  const asVector=(terms,size)=>{const out=Array(size).fill(0n);for(const t of terms)out[t.targetIndex]+=BigInt(t.coefficient);return out;};
  let nonzeroR=0,nonzeroH=0;
  for(let k=0;k<c.basis.length;k++)for(let i=0;i<c.basis[k].length;i++){
    const trace=traceBasis(j,k,i),t=trace.computedComparison,unit=Array(c.basis[k].length).fill(0n);unit[i]=1n;
    assert.equal(t.kind,'EXPLICIT_REPLACEMENT_SELECTED_COLUMN');assert.equal(t.formalPass,false);
    for(const term of [...t.projection.terms,...(t.homotopy?.terms||[]),...t.inclusionImages.flatMap(x=>x.terms)])assert.equal(resolve(j,term.sourceField),term.coefficient);
    const rb=apply(R.r[k],unit),hb=apply(R.h[k],unit),irb=apply(R.i[k],rb),dhb=k?apply(c.differentials[k-1],hb):Array(unit.length).fill(0n),hdb=c.differentials[k]?apply(R.h[k+1],apply(c.differentials[k],unit)):Array(unit.length).fill(0n);
    assert.deepEqual(asVector(t.projection.terms,rb.length),rb);assert.deepEqual(asVector(t.homotopy?.terms||[],hb.length),hb);assert.deepEqual(asVector(t.roundtrip.terms,unit.length),irb);
    assert.deepEqual(unit.map((v,n)=>v-irb[n]),unit.map((_,n)=>(dhb[n]||0n)+(hdb[n]||0n)));
    if(!t.projection.zero)nonzeroR++;if(t.homotopy&&!t.homotopy.zero)nonzeroH++;
  }
  assert.ok(nonzeroR>0);assert.ok(nonzeroH>0);
  for(const id of ['comparison-r-0','comparison-h-1','kernel-2']){const v=makeM2Visualization(j,{panel:id});assert.ok(v.table.rows.length);for(const path of v.table.sourcePaths)assert.notEqual(resolve(j,path),undefined,path);}
});
test('changed editor, cancellation and unsupported precision never display stale paired data',async()=>{
  const e=examples[0],r=await lookup(e.id),j=job(e.request,r),v=makeM2Visualization(j,{currentEditorMatches:false});assert.equal(v.state,'INPUT_CHANGED');assert.equal(v.scene.points.length,0);assert.equal(makeObservationPair(j,{currentEditorMatches:false}),null);
  const matching=clone(e.request);assert.equal(makeM2Visualization(j,{currentRequest:matching}).state,'READY');const pair=makeObservationPair(j,{currentRequest:matching});assert.equal(pair.left.state,'READY');assert.equal(pair.right.state,'READY');assert.equal(pair.left.binding.currentEditorMatches,true);
  matching.input.deltas=[100,200];assert.equal(makeM2Visualization(j,{currentRequest:matching}).state,'INPUT_CHANGED');assert.equal(makeObservationPair(j,{currentRequest:matching}),null);
  const q=clone(e.request);q.input.mode='GUESS_GAP';assert.equal(validateRequest(q).ok,false);q.input.mode=e.request.input.mode;q.precision.mode='PADIC_BALL';assert.equal(validateRequest(q).code,'PRECISION_REQUIRED');
  await assert.rejects(()=>runJob(e.request,{checkCancelled:()=>{throw Object.assign(Error('Cancelled'),{code:'CANCELLED'});}}),e=>e.code==='CANCELLED');
});
test('GPU packing consumes the same retained source points without rewriting exact values',()=>{
  const points=Array.from({length:6000},(_,i)=>({xy:[(i%100)*6.531+.123,Math.floor(i/100)*4.777+.789,0],value:'9007199254740993123',sourcePath:`result.exact[${i}]`,radius:3,color:'#76e2cd'})),before=canonicalStringify(points),a=packMarks(points);assert.equal(a.buffer.length,42000);assert.ok(a.maxFloat32PixelError<.001);assert.equal(canonicalStringify(points),before);assert.ok(Number.isNaN(numericValue({kind:'PADIC_BALL',residue:'5',p:3,digits:4})));
});
test.after(()=>{fs.writeFileSync(new URL('../../evidence/observatory-audit.json',import.meta.url),JSON.stringify({schema:'MathScope.I2ObservationAudit/1',examples:reports,allSourceBound:true,scope:'Finite source calculations, exact basis invariants, declared model dependencies and display contracts. Browser raster/interaction acceptance is a separate report.'},null,2));});
