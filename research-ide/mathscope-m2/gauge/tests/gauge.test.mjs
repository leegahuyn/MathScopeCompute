import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../../../mathscope-m1/gauge/matrix.mjs';
import {availableGroups,createGroup,groupElementResidual} from '../../../mathscope-m1/gauge/groups.mjs';
import {createField,evaluateJet,curvatureFromJet} from '../../../mathscope-m1/gauge/fields.mjs';
import {getExamples,run,validate,validateRequest} from '../index.mjs';
import {normalizeInput,SU2,rngFromSeed} from '../contracts.mjs';
import {createConfiguration,createGeometry,pathHolonomy,plaquetteMatrix,action,descriptor,gaugeDiagnostics,randomExponential,transformConfiguration,measure,haarSU2,fieldStrengthAt} from '../lattice.mjs';
import {createActionCache,proposeLink,metropolisProbability,su2Quadrature} from '../ensemble.mjs';
import {analyzeSeries} from '../statistics.mjs';

const lattice={Ns:2,Nt:2,as:.4,at:.25,spatialBoundary:'PERIODIC',temporalBoundary:'PERIODIC',lengthUnit:'ell0',origin:[0,0,0,0]};
const base={group:SU2,lattice,beta:1.4,initial:{kind:'SEEDED_EXPONENTIAL',seed:'independent-m2-lattice-fixture'}};
const ensembleBase={group:base.group,lattice:base.lattice,beta:base.beta};
const conf=async(input=base)=>createConfiguration(normalizeInput('gauge.lattice',input));
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b} within ${tol}`);

test('four-dimensional cells, open sites, continuous group degrees and anisotropic action metadata',async()=>{
  const periodic=await conf({...base,initial:{kind:'IDENTITY'}}),p=descriptor(periodic);assert.equal(p.siteCount,16);assert.equal(p.activeLinks,64);assert.equal(p.continuousLinkDegreesOfFreedom,192);assert.equal(p.plaquetteCount,96);close(p.physicalExtents.L,.8);close(p.physicalExtents.T,.5);close(p.anisotropy,1.6);
  const open=await conf({...base,lattice:{...lattice,spatialBoundary:'OPEN',temporalBoundary:'OPEN'},initial:{kind:'IDENTITY'}}),o=descriptor(open);assert.equal(o.activeLinks,32);assert.equal(o.plaquetteCount,24);assert.equal(open.links.filter(x=>x===null).length,32);assert.equal(action(open),0);
});
test('empty and reversed paths; a deliberately reordered noncommutative product is rejected',async()=>{
  const c=await conf(),dirs=[1,2,3,-1,4],p=pathHolonomy(c,0,dirs),reverse=pathHolonomy(c,p.end,dirs.slice().reverse().map(v=>-v));assert.ok(M.distance(reverse.matrix,M.dagger(p.matrix))<1e-12);assert.deepEqual(M.jsonMatrix(pathHolonomy(c,0,[]).matrix),M.jsonMatrix(M.identity(2)));
  const pl=c.geometry.plaquettes[0],correct=plaquetteMatrix(c,pl),wrongEdges=[pl.edges[1],pl.edges[0],...pl.edges.slice(2)];let wrong=M.identity(2);for(const e of wrongEdges)wrong=M.multiply(wrong,e.inverse?M.dagger(c.links[e.id]):c.links[e.id]);assert.ok(M.distance(correct,wrong)>1e-3,'Swapping noncommuting factors must change the actual plaquette.');
});
test('a pure gauge has flat plaquettes; central holonomy is distinguishable from identity links',async()=>{
  for(const initial of [{kind:'IDENTITY'},{kind:'PURE_GAUGE',seed:'pure'},{kind:'CENTER_HOLONOMY',centerPower:1}]){
    const c=await conf({...base,initial}),r=measure(c);for(const p of c.geometry.plaquettes)assert.ok(M.distance(plaquetteMatrix(c,p),M.identity(2))<1e-12);close(r.action,0);
    close(r.meanPolyakovReal,initial.kind==='CENTER_HOLONOMY'?-1:1);
  }
});
test('all fifteen actual M1 groups preserve plaquette trace and action under independent site frames',async()=>{
  for(const g of availableGroups()){
    const c=await conf({...base,group:g.spec}),r=gaugeDiagnostics(c,`gauge-${g.id}`),d=descriptor(c);assert.equal(r.passed,true,g.id);const a=action(c);assert.ok(a>=-1e-10&&a<=d.actionBound.upper+1e-10,g.id);
    assert.equal(c.group.dimension,g.dimension);assert.equal(c.group.matrixDimension,g.matrixDimension);
  }
});
test('Lie-projected curvature energy and unrounded topology are gauge invariant for compact G2',async()=>{
  const group=availableGroups().find(g=>g.id==='G2').spec,c=await conf({...base,group}),rng=rngFromSeed('all-site-G2'),frames=Array.from({length:c.geometry.V},()=>randomExponential(c.group,rng,.9)),g=transformConfiguration(c,frames);
  for(const method of ['PLAQUETTE','CLOVER']){const a=measure(c,method),b=measure(g,method);close(a.topology.rawCharge,b.topology.rawCharge,1e-10);close(a.topology.curvatureEnergyIntegral,b.topology.curvatureEnergyIntegral,1e-9);assert.equal(a.topology.integerCertificate,'NOT_AVAILABLE');assert.equal(a.topology.roundedCharge,null);}
});
test('open edges, actual group membership, unsupported representation and absent metadata are rejected',async()=>{
  const open=await conf({...base,lattice:{...lattice,spatialBoundary:'OPEN',temporalBoundary:'OPEN'}});assert.throws(()=>pathHolonomy(open,0,[-1]),/open boundary/);
  const links=open.links.map(u=>u?M.jsonMatrix(u):null);links.find(x=>x!==null).re[0]+=1;
  await assert.rejects(()=>conf({...base,lattice:open.geometry.lattice,initial:{kind:'EXPLICIT_LINKS',links}}),/not in the selected/);
  assert.equal(validate('gauge.lattice',{...base,lattice:{Ns:2,Nt:2}}).ok,false);assert.equal(validate('gauge.lattice',{...base,group:{...SU2,representation:'ADJOINT'}}).ok,false);
  assert.equal(validate('gauge.ensemble',{...ensembleBase,group:availableGroups().find(g=>g.id==='SU3').spec,sampler:{algorithm:'SU2_HAAR_METROPOLIS'}}).code,'UNSUPPORTED');
  assert.equal(validate('gauge.ensemble',{...ensembleBase,delta:2}).ok,false,'An unsupported Delta label cannot silently reuse an ensemble.');
});
test('memory, operation, item and incorrect mathematical-claim inputs fail before source allocation',()=>{
  assert.equal(validate('gauge.lattice',{...base,lattice:{...lattice,Ns:32,Nt:32}}).code,'BUDGET_EXCEEDED');
  assert.equal(validateRequest({kind:'gauge.lattice',input:base,budget:{maxOperations:1}}).code,'BUDGET_EXCEEDED');
  assert.equal(validateRequest({kind:'gauge.lattice',input:base,budget:{maxItems:1}}).code,'BUDGET_EXCEEDED');
  assert.equal(validate('gauge.lattice',{...base,claimQuantumMassGap:true}).code,'UNSUPPORTED');
  assert.equal(validateRequest({kind:'gauge.lattice',input:base,precision:{mode:'EXACT'}}).code,'UNSUPPORTED');
});
test('changing display stride or time slice leaves the raw source, model and action unchanged',async()=>{
  const a=await run('gauge.lattice',{...base,view:{timeSlice:0,stride:1}}),b=await run('gauge.lattice',{...base,view:{timeSlice:1,stride:2}});
  assert.equal(a.sourceHash,b.sourceHash);assert.equal(a.modelHash,b.modelHash);assert.equal(a.runHash,b.runHash);assert.notEqual(a.visualization.observationHash,b.visualization.observationHash);assert.deepEqual(a.source.links,b.source.links);assert.equal(a.measurements.action,b.measurements.action);assert.equal(b.visualization.points.length,1);
  const selected=b.visualization.points[0];assert.equal(selected.value,b.measurements.sites[selected.sourceIndex].actionDensity);assert.equal(selected.sourceCoordinate4[3],lattice.at);
});
test('local acceptance uses every affected plaquette and exactly matches a recomputed total action difference',async()=>{
  const c=await conf(),cache=createActionCache(c),id=c.geometry.active[3].id,rng=rngFromSeed('new-link'),u=haarSU2(rng),before=action(c),old=M.clone(c.links[id]);
  c.links[id]=u;const expected=action(c)-before;c.links[id]=old;const step=proposeLink(c,cache,id,u,-10000);
  close(step.deltaAction,expected,2e-12);close(cache.action,action(c),2e-12);close(step.acceptanceProbability,metropolisProbability(expected));
  const rejectedCandidate=haarSU2(rng),snapshot=M.jsonMatrix(c.links[id]),reject=proposeLink(c,cache,id,rejectedCandidate,0);assert.equal(reject.accepted,false);assert.deepEqual(M.jsonMatrix(c.links[id]),snapshot);close(cache.action,action(c),2e-12);
});
test('normalized four-normal SU2 Haar constructor has the S3 second moment and actual membership',()=>{
  const rng=rngFromSeed('haar-moment-test');let sum=0,square=0,maxResidual=0;const n=20000;
  for(let i=0;i<n;i++){const u=haarSU2(rng),a=M.trace(u).re/2;sum+=a;square+=a*a;if(i<64)maxResidual=Math.max(maxResidual,groupElementResidual(createGroup(SU2),u).max);}
  assert.ok(Math.abs(sum/n)<.015);assert.ok(Math.abs(square/n-.25)<.01);assert.ok(maxResidual<1e-12);
});
function besselI(n,x){let term=(x/2)**n,fac=1;for(let j=2;j<=n;j++)fac*=j;term/=fac;let sum=term;for(let k=1;k<150;k++){term*=(x*x/4)/(k*(k+n));sum+=term;if(Math.abs(term)<1e-17*Math.abs(sum))break;}return sum;}
test('Haar angular quadrature agrees with an independent analytic Bessel power-series oracle',()=>{
  const zero=su2Quadrature(0);close(zero.partition,1,1e-13);close(zero.meanNormalizedTrace,0,1e-13);close(zero.secondMoment,.25,1e-13);
  for(const beta of [.1,1,2,6,15]){const r=su2Quadrature(beta),m=besselI(2,beta)/besselI(1,beta);close(r.meanNormalizedTrace,m,1e-12);close(r.partition,Math.exp(-beta)*2*besselI(1,beta)/beta,1e-12);close(r.secondMoment,1-3*m/beta,1e-12);}
});
test('one-link Markov samples pass independent distribution checks, not just fixed-seed reproduction',async()=>{
  for(const beta of [0,2,6]){const r=await run('gauge.sampler-reference',{group:SU2,beta,seed:`distribution-${beta}`,samples:16000,burnIn:1500});assert.equal(r.comparison.passed,true);assert.ok(r.statistics.effectiveSampleSize>=100);assert.equal(r.model.notAFourDimensionalEnsemble,true);}
});
test('finite beta=0 lattice matches product Haar expectation; manifests and histories are complete',async()=>{
  const input={...ensembleBase,beta:0,sampler:{algorithm:'SU2_HAAR_METROPOLIS',seed:'product-Haar-control',starts:['COLD','HOT_HAAR'],burnIn:16,samples:128,thin:1,maxLag:24,minimumESS:40}},r=await run('gauge.ensemble',input);
  assert.equal(r.replicas.length,2);for(const replica of r.replicas){assert.equal(replica.samples.length,128);assert.equal(replica.history.length,144);assert.equal(replica.acceptance,1);assert.equal(replica.statistics.action.status,'DETERMINISTIC_OBSERVABLE');assert.equal(replica.finalSource.links.length,64);}
  for(const reference of r.diagnostics.betaZeroReference)assert.equal(reference.withinTolerance,true);assert.equal(r.lattice.partitionFunction.lowerBoundFloat64,1);assert.equal(r.transferOperator.finiteMatrix,null);assert.equal(r.reflectionPositivity.status,'RESEARCH_OPEN');
});
test('full-basis general-group proposal runs in the actual SU3 group with conservative small-chain status',async()=>{
  const group=availableGroups().find(x=>x.id==='SU3').spec,r=await run('gauge.ensemble',{...ensembleBase,group,sampler:{algorithm:'FULL_BASIS_LIE_METROPOLIS',seed:'su3-full-basis',starts:['COLD'],samples:8,burnIn:2,stepSize:.4}});
  assert.equal(r.manifest.algorithm.allTangentDirections,8);assert.equal(r.status,'PARTIAL');assert.equal(r.replicas[0].statistics.plaquette.confidenceInterval95,null);assert.equal(r.replicas[0].finalSource.links.find(x=>x).n,3);
});
test('seed replay is deterministic while seed, beta and view revision have distinct consequences',async()=>{
  const input={...ensembleBase,sampler:{seed:'replay-seed',starts:['COLD'],samples:8,burnIn:2}},a=await run('gauge.ensemble',input),b=await run('gauge.ensemble',input),view=await run('gauge.ensemble',{...input,view:{timeSlice:1,stride:2}}),seed=await run('gauge.ensemble',{...input,sampler:{...input.sampler,seed:'other-seed'}}),model=await run('gauge.ensemble',{...input,beta:1.2});
  assert.equal(a.ensembleHash,b.ensembleHash);assert.deepEqual(a.replicas,b.replicas);assert.equal(a.ensembleHash,view.ensembleHash);assert.notEqual(a.visualization.observationHash,view.visualization.observationHash);assert.equal(a.modelHash,seed.modelHash);assert.notEqual(a.ensembleHash,seed.ensembleHash);assert.notEqual(a.modelHash,model.modelHash);
});
test('autocorrelation matches an independent AR(1) theoretical scale and short/stalled data receive no interval',()=>{
  const rng=rngFromSeed('AR1-independent'),white=[],ar=[];let x=0;for(let i=0;i<33768;i++){const e=rng.normal();x=.8*x+e;if(i>=1000){white.push(e);ar.push(x);}}
  const w=analyzeSeries(white,{maxLag:256}),a=analyzeSeries(ar,{maxLag:256});assert.ok(w.integratedAutocorrelationTime<.8);assert.ok(a.integratedAutocorrelationTime>3.5&&a.integratedAutocorrelationTime<6,'AR(1) phi=.8 has theoretical tau_int=4.5.');assert.ok(a.effectiveSampleSize<a.count/7);assert.equal(analyzeSeries(Array(100).fill(3)).status,'STALLED_OR_CONSTANT');assert.equal(analyzeSeries([1,0,1,0,1,0,1,0]).confidenceInterval95,null);
});
test('forward plaquette refinement converges to independent analytic BPST curvature with first order',async()=>{
  const example=getExamples().find(e=>e.request.kind==='gauge.lattice-refinement'),r=await run(example.request.kind,example.request.input);assert.equal(r.convergence.observedDecrease,true);for(const order of r.convergence.observedOrders)assert.ok(order>.8&&order<1.2);assert.ok(r.levels.at(-1).midpointRefinementDifference<r.levels[0].midpointRefinementDifference/1000);
});
test('symmetric clover has the declared second-order smooth-field convergence at a fixed physical site',async()=>{
  const fs=getExamples().find(e=>e.request.kind==='gauge.lattice-refinement').request.input.field,field=createField(createGroup(SU2),fs),point=[.2,-.3,.1,.4],F=curvatureFromJet(evaluateJet(field,point,{order:1})),errors=[];
  for(const a of [.2,.1,.05]){
    const c=await conf({...base,lattice:{...lattice,Ns:3,Nt:3,as:a,at:a,spatialBoundary:'OPEN',temporalBoundary:'OPEN',origin:point.map(v=>v-a)},initial:{kind:'CLASSICAL_FIELD',field:fs,transportSteps:8}}),site=c.geometry.index([1,1,1,1]);let e=0;for(let mu=0;mu<4;mu++)for(let nu=mu+1;nu<4;nu++)e+=M.distance(fieldStrengthAt(c,site,mu,nu,'CLOVER'),F[mu][nu])**2;errors.push(Math.sqrt(e));
  }
  assert.ok(errors[0]/errors[1]>3.5);assert.ok(errors[1]/errors[2]>3.8);
});
test('running numerical work observes cancellation instead of returning an invented completed receipt',async()=>{
  let checks=0;await assert.rejects(()=>run('gauge.ensemble',{...ensembleBase,sampler:{starts:['COLD'],samples:64,burnIn:10}},{checkCancelled(){if(++checks>20)throw Object.assign(Error('Cancelled by test'),{code:'CANCELLED'});}}),e=>e.code==='CANCELLED');
});
