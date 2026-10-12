import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../../../mathscope-m1/gauge/matrix.mjs';
import {createConfiguration,action,measure,transformConfiguration,randomExponential} from '../../../mathscope-m2/gauge/lattice.mjs';
import {normalizeInput,rngFromSeed} from '../../../mathscope-m2/gauge/contracts.mjs';
import {wilsonGradient} from '../wilson-flow.mjs';
import {su2Geometry,packMatrices,unpackMatrices,su2Initial,wilsonSummary,cloverSummary,standardWilsonForce,standardFlowCurve,heatbathSweep,su2Conditional,spatialOperatorBasis,transformPacked} from '../su2-kernel.mjs';

const make=async()=>{const input=normalizeInput('gauge.lattice',{beta:2.1,lattice:{Ns:2,Nt:4,as:1,at:1,spatialBoundary:'PERIODIC',temporalBoundary:'PERIODIC',lengthUnit:'a',origin:[0,0,0,0]},initial:{kind:'HOT_HAAR',seed:'m3-independent-packed-check'}});const matrix=await createConfiguration(input);return {matrix,g:su2Geometry(2,4),links:packMatrices(matrix.links)};};
const maxdiff=(a,b)=>a.reduce((m,x,i)=>Math.max(m,Math.abs(x-b[i])),0);

test('full SU2 packed action, all plaquettes, clover energy and unrounded Q match independent M1/M2 matrices',async()=>{
 const {matrix,g,links}=await make(),a=wilsonSummary(links,g,2.1),c=cloverSummary(links,g),ref=measure(matrix,'CLOVER');
 assert.ok(Math.abs(a.action-ref.action)<1e-10);assert.ok(Math.abs(a.meanPlaquette-ref.meanPlaquette)<1e-13);
 assert.ok(Math.abs(c.cloverEnergy-ref.topology.curvatureEnergyIntegral/g.V)<1e-12);assert.ok(Math.abs(c.unroundedCloverCharge-ref.topology.rawCharge)<1e-12);
 const decoded=unpackMatrices(links);decoded.forEach((u,i)=>assert.ok(M.distance(u,matrix.links[i])<1e-13));
});

test('standard force is exactly half the existing B=-Tr M3 velocity at g0^2=4/beta',async()=>{
 const {matrix,g,links}=await make(),force=standardWilsonForce(links,g),gradient=wilsonGradient(matrix),v=[];
 for(const a of gradient.gradients)v.push(-2/2.1*a.re[1],-2/2.1*a.im[1],-2/2.1*a.im[0]);
 assert.ok(maxdiff(force,v)<1e-12);
 const h=1e-6,id=13,q=M.matrix(2);q.re[1]=h;q.re[2]=-h;const plus=matrix.links.slice(),minus=matrix.links.slice();plus[id]=M.multiply(M.exponential(q),plus[id]);minus[id]=M.multiply(M.exponential(M.scale(q,-1)),minus[id]);
 const fd=(action({...matrix,links:plus})-action({...matrix,links:minus}))/(2*h);assert.ok(Math.abs(fd+2.1*force[id*3])<2e-7);
});

test('heatbath conditional marginal matches separate Haar quadrature for weak and strong staples',()=>{
 const rows=[];for(const alpha of [0,.05,1,8,40]){
  const rng=rngFromSeed('m3-su2-conditional-'+alpha),n=24000,q=new Float64Array(4);let sum=0,sq=0,norm=0;
  for(let k=0;k<n;k++){su2Conditional(alpha,rng,q);sum+=q[0];sq+=q[0]*q[0];norm=Math.max(norm,Math.abs(Math.hypot(...q)-1));}
  const panels=8192,h=Math.PI/panels;let z=0,x=0;for(let k=0;k<=panels;k++){const theta=k*h,w=(k===0||k===panels?1:k%2?4:2)*Math.sin(theta)**2*Math.exp(alpha*(Math.cos(theta)-1));z+=w;x+=w*Math.cos(theta);}
  const observed=sum/n,expected=x/z,se=Math.sqrt((sq/n-observed**2)/n),score=Math.abs(observed-expected)/se;rows.push({alpha,observed,expected,se,score});assert.ok(norm<1e-13);assert.ok(score<4.5,JSON.stringify(rows));
 }
});

test('microcanonical sweep conserves independent full action, with nontrivial group changes',async()=>{
 const {matrix,g,links}=await make(),before=links.slice(),a=action(matrix);heatbathSweep(links,g,2.1,rngFromSeed('unused-for-overrelaxation'),{overrelaxation:true});
 const b=action({...matrix,links:unpackMatrices(links)});assert.ok(Math.abs(a-b)<1e-10);assert.ok(maxdiff(before,links)>.1);
});

test('standard RK3 flow decreases action, converges on step halving and commutes with site gauge transformations',async()=>{
 const {matrix,g,links}=await make(),rng=rngFromSeed('m3-packed-gauge-frames'),frames=Array.from({length:g.V},()=>randomExponential(matrix.group,rng,.8)),transformed=transformConfiguration(matrix,frames),packedFrames=packMatrices(frames);
 assert.ok(maxdiff(transformPacked(links,g,packedFrames),packMatrices(transformed.links))<1e-13);
 const coarse=await standardFlowCurve(links,g,{maxTime:.32,step:.08,measureEvery:1}),fine=await standardFlowCurve(links,g,{maxTime:.32,step:.04,measureEvery:1}),finer=await standardFlowCurve(links,g,{maxTime:.32,step:.02,measureEvery:1}),gauge=await standardFlowCurve(packMatrices(transformed.links),g,{maxTime:.32,step:.04,measureEvery:1});
 const e1=maxdiff(coarse.links,fine.links),e2=maxdiff(fine.links,finer.links);assert.ok(e1>5*e2,`${e1}/${e2}`);assert.ok(maxdiff(gauge.links,transformPacked(fine.links,g,packedFrames))<1e-12);assert.ok(fine.curve.at(-1).meanPlaquette>fine.curve[0].meanPlaquette);
 const direct=measure({...matrix,links:unpackMatrices(fine.links)},'CLOVER');assert.ok(Math.abs(direct.topology.curvatureEnergyIntegral/g.V-fine.curve.at(-1).cloverEnergy)<1e-12);
});

test('spatial smearing basis is gauge invariant and cannot see another time slice',async()=>{
 const {matrix,g,links}=await make(),rng=rngFromSeed('m3-smear-frames'),frames=packMatrices(Array.from({length:g.V},()=>randomExponential(matrix.group,rng,.8))),a=spatialOperatorBasis(links,g),b=spatialOperatorBasis(transformPacked(links,g,frames),g),changed=links.slice(),fresh=su2Initial(g,'other-time');
 for(let site=0;site<g.V;site++)if(g.coordinates[site][3]===1)changed.set(fresh.subarray(site*16,site*16+16),site*16);
 const c=spatialOperatorBasis(changed,g);assert.ok(maxdiff(a.values.flat(),b.values.flat())<1e-12);assert.deepEqual(a.values[0],c.values[0]);assert.notDeepEqual(a.values[1],c.values[1]);
});
