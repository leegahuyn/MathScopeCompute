import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getExamples,runJob,validateRequest,getCapabilities} from '../index.mjs';
import {getChecklist,BLUEPRINT_SOURCE} from '../checklist.mjs';
import {integrateTangentPulse} from '../pulse-ode.mjs';
import {executeDomain,requestHash} from '../../core/registry.mjs';
import {createM2Engine} from '../../core/engine.mjs';
import {canonicalStringify,sha256} from '../../../mathscope-m0/contracts.mjs';
import {makeM2Visualization as makeVisualization} from '../../visualization/m2-views.mjs';

const examples=getExamples(),fixtures=new Map();
const norm=x=>Math.hypot(...x),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const plus=(a,b)=>a.map((x,i)=>x+b[i]),times=(a,s)=>a.map(x=>x*s);
const matrixVector=(A,x)=>A.map(r=>dot(r,x));
const finiteTree=(value,path='result')=>{
  if(typeof value==='number')assert.ok(Number.isFinite(value),path+' is finite');
  else if(Array.isArray(value))value.forEach((v,i)=>finiteTree(v,path+'['+i+']'));
  else if(value&&typeof value==='object')for(const[k,v]of Object.entries(value))finiteTree(v,path+'.'+k);
};

test('all twenty-five N4/N5 examples execute with source graphics and distinguish completed operators from unresolved constructions',async()=>{
  assert.equal(examples.length,25);
  for(const e of examples){
    const result=await executeDomain(e.request),job={id:e.id,request:e.request,inputHash:await requestHash(e.request),status:result.status,result,resultHash:await sha256(result)};
    fixtures.set(e.id,job);finiteTree(result);
    assert.equal(result.status,['ns-m2-actual-uniform-covariance','ns-m2-actual-picard-acceptance','ns-m2-actual-pulse-amplitude','ns-m2-actual-moment-restoration','ns-m2-actual-residual-order','ns-m2-cutoffs','ns-m2-curl','ns-m2-dyadic','ns-m2-core-charts','ns-m2-torus','ns-m2-support','ns-m2-pulse-curl','ns-m2-tail'].includes(e.id)?'COMPLETED':'PARTIAL',e.id);assert.ok(result.checks.length>0,e.id);assert.ok(result.checks.every(c=>c.pass===true),e.id+' bounded default checks');
    assert.equal(result.scope.fullSameProfileN4,false);assert.equal(result.scope.fullSameProfileN5,false);assert.equal(result.scope.formalPass,false);
    assert.equal(result.sourceLedger.n3Profile.commit,'55dacb898f8c204bf0c5925ea901d75d6c2d0f46');
    assert.equal(result.sourceLedger.n3Profile.assessmentSha256,'e57681b7bb751967b406ad440942728ecfd8fe47eb9672129ff19c8a7eb6634c');
    assert.equal(result.sourceLedger.n3Profile.globalEvaluator,false);if(result.status==='PARTIAL')assert.ok(result.blockers.length>0);
    const before=await sha256(result),view=makeVisualization(job);
    assert.equal(view.state,'READY');assert.ok(view.table.rows.length>0,e.id+' has a numerical/source table');assert.ok(view.scene.points.length+view.scene.lines.length+view.scene.arrows.length>0,e.id+' has real finite marks');
    assert.ok(view.axisMetadata.every(a=>a.sourceField.startsWith('result.')),e.id+' axis fields resolve to source result paths');assert.equal(view.binding.inputHash,job.inputHash);assert.equal(view.binding.resultHash,job.resultHash);assert.equal(await sha256(result),before);
  }
});

test('source recursion retains every ordered pair, separate indices, zero positive-order axis data and n-1 terms',async()=>{
  const result=await runJob({kind:'ns.background-recursion',input:{maxOrder:2}}),orders=result.results.orders;
  assert.deepEqual(orders[1].pairs.map(p=>[p.i,p.j]),[[0,1],[1,0]]);
  assert.deepEqual(orders[2].pairs.map(p=>[p.i,p.j]),[[0,2],[1,1],[2,0]]);
  assert.equal(orders[2].pairs[1].role,'KNOWN_REPAIRED_PREVIOUS_ORDER');
  for(const row of orders.slice(1)){
    assert.deepEqual(row.axis,{phi:0,U:0,Pi:0});assert.equal(row.indices.backgroundOrder,row.n);assert.notEqual(row.indices.radialTaylorOrder,row.indices.etaDerivativeOrder);
    assert.ok(row.angular.axialViscosity.includes('phi_'+(row.n-1)));assert.ok(row.axial.axialViscosity.includes('U_'+(row.n-1)));assert.equal(row.pressure.radialCorrection,`-Omega_${row.n-1}/(2X)`);
    assert.equal(row.constructionState,'NOT_SOLVED');assert.match(row.reuseGuard,/FIVE_MOMENTS/);
  }
  assert.match(orders[0].axis.Pi,/not Pi_0\(X,eta\)/);assert.equal(result.results.nextOrderGuard.satisfied,false);
});

test('cutoff inequalities certify the whole stated q domain using an outward derivative interval and preserve finite-schedule limits',async()=>{
  for(const input of[{orders:4,logPower:2,growth:.4},{orders:2,logPower:3,growth:.25,constants:[[1e6,1e5],[7e7,3e8,1e9]]},{orders:2,logPower:0,growth:1,constants:[[1,2],[3,4,5]]}]){
    const r=await runJob({kind:'ns.background-cutoffs',input,precision:{mode:'OUTWARD_FLOAT64'}}),rows=r.results.rows;
    for(const [i,row]of rows.entries()){
      assert.equal(row.inequalities.length,row.j+1);assert.ok(row.inequalities.every(x=>x.logBound[1]<=x.targetLog[0]));
      assert.ok(row.monotonicity.logDerivativeAtBoundary[1]<=0);assert.equal(row.monotonicity.boundaryPassed,true);assert.match(row.monotonicity.proofMethod,/NOT_FINITE_Q_SAMPLING/);
      assert.match(row.monotonicity.derivativeDecreasesBecause,/-P\/\(1\+t\)\^2/);assert.equal(row.constantScope,'USER_DECLARED_BOUND_CONSTANTS');
      if(i)assert.ok(row.log2a>=rows[i-1].log2a+1);assert.equal(row.validFor,`0<q<=2^(-${row.log2a})`);
      // Independent scalar spot checks are regression checks only. They are not the all-q proof.
      for(const extra of[0,.125,10,1000])for(const C of row.constants){const t=row.log2a*Math.log(2)+extra,logBound=Math.log(C)+(input.logPower??2)*Math.log1p(t)-(input.growth??.4)*row.j*t/2;assert.ok(logBound<=-row.j*Math.log(2)+1e-9);}
    }
    assert.equal(r.results.tailContract.uncomputedHigherConstants,true);assert.equal(r.precisionLedger.fullResultExact,false);
  }
  const baseline=await runJob({kind:'ns.background-cutoffs',input:{orders:2}}),boundary=-baseline.results.rows[1].log2a-1;
  const on=await runJob({kind:'ns.background-cutoffs',input:{orders:2,tailIndex:2,log2q:boundary}}),inside=await runJob({kind:'ns.background-cutoffs',input:{orders:2,tailIndex:2,log2q:boundary-1}});
  assert.equal(on.results.tailContract.valid,false,'strict q<(2*a_J)^-1 must not include its boundary');assert.equal(inside.results.tailContract.valid,true);
  const inactive=await runJob({kind:'ns.background-cutoffs',input:{orders:2,log2q:0}});assert.deepEqual(inactive.results.query.activePositiveOrders,[]);assert.deepEqual(inactive.results.query.inactivePositiveOrders,[1,2]);
  const large=await executeDomain({kind:'ns.background-cutoffs',input:{orders:1,constants:[[{kind:'FLOAT64',value:1e100},{kind:'FLOAT64',value:1e90}]]}});assert.equal(large.status,'COMPLETED');assert.equal(large.results.tailContract.J,1);assert.deepEqual(large.results.rows[0].constants[0],{kind:'FLOAT64',value:1e100});assert.ok(large.results.rows[0].allQBoundPassed);
  const maximum=await executeDomain({kind:'ns.background-cutoffs',input:{orders:10}});assert.equal(maximum.results.rows.length,10);assert.deepEqual(maximum.results.rows.at(-1).constants.at(-1),{kind:'FLOAT64',value:1e20});assert.ok(maximum.results.rows.every(row=>row.allQBoundPassed));
});

test('full potential curl converges in independent Cartesian divergence and omitting the cutoff derivative fails',()=>{
  const r=fixtures.get('ns-m2-curl').result,e=r.results.errors;
  assert.ok(e[0].maxCartesianDivergence/e[1].maxCartesianDivergence>3.8);assert.ok(e[1].maxCartesianDivergence/e[2].maxCartesianDivergence>3.8);
  assert.ok(r.results.omittedCutoffDerivativeMaxDivergence>100*e[2].maxCartesianDivergence);
  assert.match(r.results.regularity,/C3/);assert.match(r.results.regularity,/not a C-infinity/);assert.match(r.results.curlRule,/grad\(chi\) cross A/);
});

test('dyadic charts use the actual source h and preserve the same physical point across interval reconstructions',()=>{
  const r=fixtures.get('ns-m2-dyadic').result;
  for(const row of r.results.rows){assert.ok(Object.values(row.overlapAtNextBand.intervalsOverlap).every(Boolean));assert.ok(row.epsilonK2[0]>=1&&row.epsilonK2[1]<=4);assert.ok(row.tau>0);assert.equal(row.k,2);assert.equal(row.h.notNumericallyReplaced,true);}
  assert.equal(r.results.labelsFrozenDuringDifferentiation,true);assert.match(r.visualization.lostInformation.join(' '),/space-time chart/);assert.match(r.results.definitions.auxiliaryTorus,/not a physical spatial dimension/);
});

test('uniform source supports cover the full countable mesh and retain same-label harmonics and once-per-box counting',async()=>{
  const labels=[{id:'a',ell:16,grid:[0,0,0],sign:1},{id:'b',ell:16,grid:[0,0,0],sign:-1},{id:'c',ell:16,grid:[4,4,4],sign:1},{id:'d',ell:16,grid:[5,0,0],sign:1},{id:'e',ell:20,grid:[123,456,789],sign:1}],r=await runJob({kind:'ns.pulse-support',input:{labels}});
  assert.equal(r.results.pairChecks.length,10);assert.ok(r.results.pairChecks.every(p=>p.auxiliarySupportsDisjoint));assert.ok(r.results.pairChecks.some(p=>p.potentialSlowOverlap));assert.equal(r.results.distinctSlowBoxes,4);assert.equal(r.results.palette.commonToAllBandsAndLabels,true);assert.equal(r.results.palette.dependsOnEnumeratedActiveSet,false);
  assert.equal(r.results.torus.determinant,14);assert.equal(r.results.torus.haar.normalizedCoveringFactor,'1');assert.equal(r.results.torus.haar.rectangleJacobianExact,'4-2*sqrt(2)');assert.equal(r.results.products.sameLabelHarmonics,'retained');
});

function cartesianReference(options,end,steps=8192){
  const {matrix:A,normalAtMidpoint:n0,normalDerivative:nd,midpoint:m,dampingCoefficient:d,initial}=options,h=(end-m)/steps;let t=initial.slice();
  const rhs=(v,x)=>{const n=plus(n0,times(nd,v-m)),Kx=matrixVector(A,x),n2=dot(n,n);return plus(plus(times(Kx,-1),times(n,(dot(n,Kx)-dot(nd,x))/n2)),times(x,-d*n2));};
  for(let j=0;j<steps;j++){const v=m+j*h,k1=rhs(v,t),k2=rhs(v+h/2,plus(t,times(k1,h/2))),k3=rhs(v+h/2,plus(t,times(k2,h/2))),k4=rhs(v+h,plus(t,times(k3,h)));t=plus(t,times(plus(plus(k1,times(plus(k2,k3),2)),k4),h/6));}return t;
}

test('tangent-coordinate pulse agrees with independently integrated original Cartesian ODE in a nonstiff overlap domain',()=>{
  const base=[1.2,-.4,0],initial=times(base,2.3/norm(base)),options={matrix:[[0,-2,0],[-1,0,0],[.4,0,0]],normalAtMidpoint:[.4,1.2,-.7],normalDerivative:[.3,0,0],midpoint:2,length:1.2,steps:64,dampingCoefficient:.4,initial},r=integrateTangentPulse(options);
  for(const row of[r.rows[0],r.rows.at(-1)]){const direct=cartesianReference(options,row.v),actual=times(row.t,Math.exp(row.logScale));assert.ok(norm(plus(actual,times(direct,-1)))/norm(direct)<1e-8);}
  assert.ok(r.diagnostics.maxRelativeOrthogonality<1e-14);assert.ok(r.diagnostics.maxReconstructedRhsRelativeResidual<1e-14);assert.equal(r.method.rigorousSolutionErrorBound,null);
});

test('analytic scalar shear and damping agree; logarithmic amplitudes survive ordinary floating point underflow',()=>{
  const lambda=.5,options={matrix:[[lambda,0,0],[0,lambda,0],[0,0,lambda]],normalAtMidpoint:[.4,1.2,-.7],normalDerivative:[.3,0,0],midpoint:2,length:2,steps:128,dampingCoefficient:.4,initial:times([1.2,-.4,0],1/Math.hypot(1.2,.4))},r=integrateTangentPulse(options);
  for(const row of r.rows){const s=row.v-options.midpoint;assert.ok(Math.abs(row.logUndampedNorm+lambda*s)<1e-11);assert.ok(Math.abs(row.logScale+lambda*s+row.dampingIntegral)<1e-11);}
  const strong=integrateTangentPulse({...options,dampingCoefficient:1e7});assert.ok(strong.rows.at(-1).logScale<-745);assert.ok(Number.isFinite(strong.rows.at(-1).logScale));assert.ok(norm(strong.rows.at(-1).t)>.999999999);
  assert.throws(()=>integrateTangentPulse({...options,initial:[1,0,0]}),/already lie/);assert.throws(()=>integrateTangentPulse({...options,normalDerivative:[.3,.1,0]}),/fixed transverse/);assert.throws(()=>integrateTangentPulse({...options,initial:[1,0]}),/three-component/);
});

test('default pulse ODE refines at fourth order and reports constraints and empirical errors separately',async()=>{
  const errors=[];
  for(const steps of[32,64,128,256]){const r=await runJob({kind:'ns.pulse-ode',input:{steps}}),d=r.results.diagnostics;errors.push(d.maxStepRefinementLogDifference);assert.ok(d.maxRelativeOrthogonality<1e-13);assert.ok(d.maxEnergyIdentityResidual<1e-10);assert.ok(d.maxReconstructedRhsRelativeResidual<1e-13);assert.equal(d.rigorousSolutionErrorBound,null);assert.equal(r.status,'PARTIAL');}
  for(let i=1;i<errors.length;i++)assert.ok(errors[i-1]/errors[i]>12,'empirical RK4 refinement ratio');
  for(const sign of[-1,1]){const r=await runJob({kind:'ns.pulse-ode',input:{sign,GR:.4,steps:128}});assert.ok(r.checks.every(c=>c.pass));assert.ok(r.results.diagnostics.maxRelativeOrthogonality<1e-13);}
});

test('covariance matches its cone fixture and preserves a visible negative-weight failure outside the cone',async()=>{
  const good=fixtures.get('ns-m2-covariance').result;assert.ok(good.results.weights.every(x=>x>0));assert.equal(good.results.cosineHalfFactor,.5);assert.equal(good.results.haar.jacobian,'4-2*sqrt(2)');assert.equal(good.results.haar.normalizedCoveringFactor,'1');assert.ok(Math.abs(good.results.reconstructed[0]+1)<1e-12);assert.equal(good.results.reconstructed[1],0);
  const r=await runJob({kind:'ns.pulse-covariance',input:{target:[1,0]}});assert.equal(r.status,'PARTIAL');assert.ok(r.results.weights.every(x=>x<0));assert.equal(r.checks.find(c=>c.id==='positive-two-family-weights').pass,false);assert.equal(r.results.globalProfileMatching,false);
  const view=makeVisualization({id:'outside-cone',request:{kind:'ns.pulse-covariance',input:{target:[1,0]}},result:r,status:r.status,inputHash:'outside-cone-source'});assert.equal(view.state,'READY');assert.ok(view.table.rows.length>0);assert.ok(view.scene.points.length>0);
});

test('flat tails retain finite log intervals, fixed derivative order and an all-later-label monotonicity condition',()=>{
  const r=fixtures.get('ns-m2-tail').result,d=r.results,{c,C,M,N}=d.parameters,threshold=d.uniformAfterThreshold;
  assert.ok(threshold&&threshold.logDerivativeUpper<0);assert.equal(threshold.derivativeDecreases,true);assert.equal(d.allDerivativeOrdersInstantiated,false);assert.match(d.retainedRemainder,/psi_prime/);
  assert.ok(d.rows.some(x=>x.machineUnderflow));for(const row of d.rows){assert.ok(row.logBound.every(Number.isFinite));const direct=-c*row.ell**2+(M+N)*row.ell*Math.log(2)+2*C*Math.log(row.ell);assert.ok(direct>=row.logBound[0]-1e-10&&direct<=row.logBound[1]+1e-10);}
  for(const ell of[threshold.ellAtLeast,threshold.ellAtLeast+100,100000])assert.ok(-2*c*ell+(M+N)*Math.log(2)+2*C/ell<0);
});

test('unknown fields, malformed shapes, unsupported precision and singular/underflow boundaries produce explicit failure states',async()=>{
  const cases=[
    [{kind:'ns.pulse-ode',input:{steps:33}},'FAILED'],
    [{kind:'ns.pulse-ode',input:{FR:-.01}},'FAILED'],
    [{kind:'ns.pulse-ode',input:{sign:0}},'FAILED'],
    [{kind:'ns.pulse-ode',input:{epsilon:'0.04'}},'FAILED'],
    [{kind:'ns.pulse-ode',input:{madeUpParameter:1}},'FAILED'],
    [{kind:'ns.pulse-ode',input:{},precision:{mode:'EXACT'}},'PRECISION_REQUIRED'],
    [{kind:'ns.pulse-ode',input:{},precision:{mode:'FORMAL'}},'PRECISION_REQUIRED'],
    [{kind:'ns.pulse-ode',input:{},precision:{bits:128}},'PRECISION_REQUIRED'],
    [{kind:'ns.pulse-ode',input:{},precision:{mode:'OUTWARD_FLOAT64'}},'PRECISION_REQUIRED'],
    [{kind:'ns.pulse-ode',input:{},precision:{tolerance:1e-30}},'UNSUPPORTED'],
    [{kind:'ns.dyadic-charts',input:{T:0}},'UNSUPPORTED'],
    [{kind:'ns.dyadic-charts',input:{T:Number.MIN_VALUE}},'PRECISION_REQUIRED'],
    [{kind:'ns.dyadic-charts',input:{ellStart:900,count:50,T:1e-100}},'PRECISION_REQUIRED'],
    [{kind:'ns.dyadic-charts',input:{tau:0}},'FAILED'],
    [{kind:'ns.background-cutoffs',input:{orders:2,constants:[[1,0],[1,2,3]]}},'FAILED'],
    [{kind:'ns.background-cutoffs',input:{orders:2,tailIndex:3}},'FAILED'],
    [{kind:'ns.pulse-support',input:{labels:[{id:'a',slow:[0,1],unprovedDerivative:1}]}},'FAILED'],
    [{kind:'ns.pulse-support',input:{labels:[{id:'a',slow:[0,1]},{id:'a',slow:[2,3]}]}},'FAILED'],
    [{kind:'ns.pulse-covariance',input:{target:[1,0,0]}},'FAILED'],
    [{kind:'ns.actual-uniform-covariance',input:{anchorOrder:1,ellExact:'1'}},'FAILED'],
    [{kind:'ns.actual-uniform-covariance',input:{anchorOrder:3}},'FAILED'],
    [{kind:'ns.actual-uniform-covariance',input:{ellExact:'0'}},'FAILED'],
    [{kind:'ns.actual-uniform-covariance',input:{ellExact:'129'}},'BUDGET_EXCEEDED'],
    [{kind:'ns.actual-uniform-covariance',input:{ellExact:1}},'FAILED'],
    [{kind:'ns.actual-uniform-covariance',input:{terms:3}},'FAILED'],
    [{kind:'ns.actual-uniform-covariance',input:{qStar:'1/2'}},'FAILED'],
    [{kind:'ns.actual-uniform-covariance',input:{},precision:{mode:'DIRECTED_BIGINT'}},'PRECISION_REQUIRED'],
    [{kind:'ns.actual-uniform-covariance',input:{},precision:{bits:128}},'UNSUPPORTED']
  ];
  for(const [request,state]of cases){const r=await executeDomain(request);assert.equal(r.status,state,canonicalStringify(request));assert.ok(r.blockers.length>0);assert.equal(makeVisualization({id:'bad-input',request,result:r,status:r.status}).state,state);}
  assert.equal(validateRequest({kind:'ns.pulse-ode',input:{epsilon:Infinity}}).ok,false);assert.equal(validateRequest({kind:'ns.pulse-ode',input:{},inventedOption:true}).ok,false);
});

test('bounded resource requests reject undersized budgets and computations honor cancellation',async()=>{
  for(const budget of[{maxOperations:1},{maxItems:1}]){const r=await executeDomain({kind:'ns.pulse-ode',input:{},budget});assert.equal(r.status,'BUDGET_EXCEEDED');assert.ok(r.blockers.length>0);}
  let ticks=0;await assert.rejects(()=>executeDomain({kind:'ns.pulse-ode',input:{}},{checkCancelled(){if(++ticks>5)throw Object.assign(Error('test cancellation'),{code:'CANCELLED'});}}),{code:'CANCELLED'});assert.ok(ticks>5);
});

test('local engine replay recomputes the exact request and rejects a tampered result',async()=>{
  const engine=createM2Engine({local:true});
  try{
    const submitted=await engine.submit({kind:'ns.pulse-ode',input:{steps:64}}),j=await engine.wait(submitted.id);assert.equal(j.status,'PARTIAL');
    const bundle=await engine.exportBundle(j.id),replayed=await engine.replay(bundle);assert.equal(replayed.status,'MATCH');assert.equal(replayed.artifactBytesMatch,true);assert.equal(replayed.importedEvidenceTrusted,false);
    const altered=structuredClone(bundle);altered.result.results.samples[0].logScale+=1;await assert.rejects(()=>engine.replay(altered),/digest mismatch/);
    const singular=await engine.submit({kind:'ns.dyadic-charts',input:{T:0}});assert.equal((await engine.wait(singular.id)).status,'UNSUPPORTED');
    const overflow=await engine.submit({kind:'ns.background-cutoffs',input:{orders:1,logPower:32,growth:1e-8,constants:[[1e12,1e12]],tailIndex:1}});assert.equal((await engine.wait(overflow.id)).status,'PRECISION_REQUIRED');
  }finally{engine.dispose();}
});

test('all sixteen original blueprint criteria retain exact text and each accepted source domain without a new formal theorem claim',async()=>{
  const source=JSON.parse(await readFile(new URL('./fixtures/original-n4-n5.json',import.meta.url),'utf8')),list=getChecklist();
  assert.equal(source.sourceSHA256,BLUEPRINT_SOURCE.sha256);assert.equal(list.length,16);assert.deepEqual(list.map(({id,title,criteria,sourcePage})=>({id,title,criteria,sourcePage})),source.criteria);
  assert.equal(list.filter(x=>x.status==='PARTIAL').length,0);assert.equal(list.filter(x=>x.status==='PASS').length,16);assert.equal(list.filter(x=>x.status==='OPEN').length,0);assert.ok(list.every(x=>x.formalComplete===false&&x.implementedScope&&x.evidencePath));
  const c=getCapabilities();assert.equal(c.fullN4,false);assert.equal(c.fullN5,false);assert.equal(c.n3Profile.globalEvaluator,false);
});
