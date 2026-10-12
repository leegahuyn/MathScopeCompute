import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {ActualConvergentExpressions} from '../../../../mathscope-m2/navier/actual-continuation-exact-functions.mjs';
import {prepareSourceTerminalCutoffSchedule,assertSourceTerminalCutoffSchedule,
  prepareSourceTerminalPositiveWindow,assertSourceTerminalPositiveWindow,
  constructSourceTerminalForceWindow,assertSourceTerminalForceWindow} from '../source-terminal-cutoff-schedule.mjs';

const observed=[];
function fixture(J=5,sourceValued=false){
  const G=new ActualConvergentExpressions(),coordinates=['terminal_x','terminal_y','terminal_z','terminal_sigma'].map(x=>G.var(x)),
    norms=Array.from({length:J+1},(_,j)=>({j,norms:Array.from({length:Math.floor(j/2)+1},(_,a)=>({a,
      boundRoot:sourceValued?G.add(G.q(j+a+1),G.exp(G.parameter('T'))):G.q(j+a+1,j+2)}))})),
    schedule=prepareSourceTerminalCutoffSchedule(G,{norms}),window=prepareSourceTerminalPositiveWindow(G,schedule,{firstInactiveOrder:J}),
    [x,y,z]=coordinates,jets=Array.from({length:J},(_,j)=>({j,forceRoots:[G.add(G.mul(G.q(j+1),x),G.pow(y,2)),
      G.add(G.mul(G.q(j+2),y),G.mul(x,z)),G.add(G.mul(G.q(j+3),z),G.pow(x,2))]}));
  return {G,norms,schedule,window,input:{coordinates,jets}};
}

test('source-scalar minimum retains every separate differentiated constraint and exact original parameters',()=>{
  for(const[J,sourceValued]of[[1,false],[5,false],[8,false],[3,true]]){
    const f=fixture(J,sourceValued),extension=constructSourceTerminalForceWindow(f.G,f.window,f.input);
    assert.equal(assertSourceTerminalCutoffSchedule(f.schedule),true);
    assert.equal(assertSourceTerminalPositiveWindow(f.window),true);
    assert.equal(assertSourceTerminalForceWindow(extension),true);
    for(const row of f.schedule.rows){
      const p=Math.floor(row.j/2);assert.equal(row.requiredPairCount,row.j?(p+1)*(p+2)/2:0);
      assert.equal(row.norms.length,p+1);
      if(row.j){assert.equal(f.G.nodes[row.bRoot].op,'ceiling');assert.ok(row.clauses.every(c=>c.power>0));}
    }
    assert.deepEqual(f.window.possibleActiveOrders,Array.from({length:J},(_,j)=>j));
    assert.equal(f.window.inactiveOrdersStart,J);assert.equal(extension.rows.length,J);
    observed.push({J,sourceValued,normInputs:f.norms,forceInputs:f.input,schedule:f.schedule,window:f.window,extension,
      program:f.G.pack({force0:extension.forceRoots[0],force1:extension.forceRoots[1],force2:extension.forceRoots[2]})});
  }
});

test('full three-component force operands, factorials and both original cutoff factors are retained',()=>{
  const f=fixture(),r=constructSourceTerminalForceWindow(f.G,f.window,f.input);
  for(let j=0;j<r.rows.length;j++){
    assert.deepEqual(r.rows[j].forceRoots,f.input.jets[j].forceRoots);
    assert.equal(r.rows[j].bRoot,f.schedule.rows[j].bRoot);
    assert.equal(f.G.nodes[r.rows[j].cutoffRoot].op,'multiply');
  }
  assert.deepEqual(r.rows.map(x=>x.factorial),['1','1','2','6','24']);
  assert.equal(r.compactTimeSupport.to,2);assert.equal(r.velocityExtendedPastOne,false);
  for(const key of ['originalLocalizedForceJetsAuthenticated','sourceNormsAuthenticated','allOrderJoiningEstablished',
    'originalN704Complete','originalN705Complete','wholeM3Complete'])assert.equal(r[key],false);
  assert.ok(r.conditionalJoining.every(x=>x.rows.every(y=>y.pass)));
});

test('missing norms, duplicate orders and incomplete active jets fail before a force is returned',()=>{
  let f=fixture();f.norms[4].norms.pop();
  assert.throws(()=>prepareSourceTerminalCutoffSchedule(f.G,{norms:f.norms}),{code:'JET_NORM_MISSING'});
  f=fixture();f.norms[3].norms.push(f.norms[3].norms[0]);
  assert.throws(()=>prepareSourceTerminalCutoffSchedule(f.G,{norms:f.norms}),{code:'DUPLICATE_NORM'});
  f=fixture();f.norms[1].j=2;
  assert.throws(()=>prepareSourceTerminalCutoffSchedule(f.G,{norms:f.norms}),{code:'INVALID_JET_SEQUENCE'});
  f=fixture();assert.throws(()=>prepareSourceTerminalPositiveWindow(f.G,f.schedule,{firstInactiveOrder:6}),{code:'INCOMPLETE_CUTOFF_PREFIX'});
  for(const change of [x=>x.jets.pop(),x=>x.jets[2].j=1]){
    f=fixture();change(f.input);assert.throws(()=>constructSourceTerminalForceWindow(f.G,f.window,f.input),{code:'INCOMPLETE_ACTIVE_FORCE'});
  }
});

test('a sampled coordinate bound or a time-dependent force jet cannot replace a terminal source operand',()=>{
  let f=fixture();f.norms[0].norms[0].boundRoot=f.input.coordinates[0];
  assert.throws(()=>prepareSourceTerminalCutoffSchedule(f.G,{norms:f.norms}),{code:'COORDINATE_DEPENDENT_NORM'});
  f=fixture();f.norms[0].norms[0].boundRoot=f.G.q(-1);
  assert.throws(()=>prepareSourceTerminalCutoffSchedule(f.G,{norms:f.norms}),{code:'NEGATIVE_NORM'});
  f=fixture();f.input.jets[1].forceRoots[0]=f.input.coordinates[3];
  assert.throws(()=>constructSourceTerminalForceWindow(f.G,f.window,f.input),{code:'TIME_DEPENDENT_TERMINAL_JET'});
  f=fixture();f.input.jets[1].forceRoots[0]=f.G.var('unsubstituted_eta');
  assert.throws(()=>constructSourceTerminalForceWindow(f.G,f.window,f.input),{code:'TIME_DEPENDENT_TERMINAL_JET'});
});

test('private graph, cutoff and force seals reject clones, metadata changes and full-body changes',()=>{
  let f=fixture();assert.throws(()=>assertSourceTerminalCutoffSchedule(structuredClone(f.schedule)),{code:'INVALID_TERMINAL_SCHEDULE'});
  f=fixture();f.schedule.rows[1].clauses[0].power++;
  assert.throws(()=>assertSourceTerminalCutoffSchedule(f.schedule),{code:'INVALID_TERMINAL_SCHEDULE'});
  f=fixture();f.window.possibleActiveOrders.pop();
  assert.throws(()=>assertSourceTerminalPositiveWindow(f.window),{code:'INVALID_TERMINAL_WINDOW'});
  f=fixture();let r=constructSourceTerminalForceWindow(f.G,f.window,f.input);
  r.rows[1].forceRoots[0]=f.G.zero;
  assert.throws(()=>assertSourceTerminalForceWindow(r),{code:'INVALID_TERMINAL_FORCE_WINDOW'});
  f=fixture();r=constructSourceTerminalForceWindow(f.G,f.window,f.input);
  f.G.nodes[r.forceRoots[0]]={op:'rational',args:['0','1']};
  assert.throws(()=>assertSourceTerminalForceWindow(r),{code:'INVALID_TERMINAL_FORCE_WINDOW'});
});

test('fake source authority, a different source graph and changed original exponent definitions are rejected',()=>{
  let f=fixture();assert.throws(()=>prepareSourceTerminalCutoffSchedule(f.G,{norms:f.norms,sourceAuthenticated:true}),{code:'INVALID_INPUT'});
  assert.throws(()=>constructSourceTerminalForceWindow(new ActualConvergentExpressions(),f.window,f.input),{code:'WRONG_SOURCE_GRAPH'});
  assert.throws(()=>prepareSourceTerminalPositiveWindow(new ActualConvergentExpressions(),f.schedule,{firstInactiveOrder:3}),{code:'WRONG_SOURCE_GRAPH'});
  f=fixture();f.G.source=structuredClone(f.G.source);f.G.source.parametersExactExpressions.h={integer:0};
  assert.throws(()=>prepareSourceTerminalCutoffSchedule(f.G,{norms:f.norms}),{code:'CHANGED_ORIGINAL_SOURCE'});
});

test('independent program extension preserves the finite result and resource failures stay explicit',()=>{
  const f=fixture(),r=constructSourceTerminalForceWindow(f.G,f.window,f.input);
  f.G.exp(f.G.q(123456));assert.equal(assertSourceTerminalForceWindow(r),true);
  f.norms[1].norms[0].boundRoot=f.G.q(299);
  assert.throws(()=>prepareSourceTerminalCutoffSchedule(f.G,{norms:f.norms,maxAddedNodes:1}),{code:'RESOURCE_LIMIT'});
  const g=fixture();assert.throws(()=>constructSourceTerminalForceWindow(g.G,g.window,{...g.input,maxAddedNodes:1}),{code:'RESOURCE_LIMIT'});
  assert.throws(()=>prepareSourceTerminalPositiveWindow(g.G,g.schedule,{firstInactiveOrder:0}),{code:'INCOMPLETE_CUTOFF_PREFIX'});
});

if(process.env.M3_SOURCE_TERMINAL_EVIDENCE)test.after(async()=>{
  await writeFile(process.env.M3_SOURCE_TERMINAL_EVIDENCE,JSON.stringify({schema:'MathScope.N7.SourceTerminalWindowObservedInputs/1',
    cases:observed,sourceNormsAndForceJetsAreFixtures:true,globalOriginalTerminalJetsComputed:false,
    originalN704Complete:false,originalN705Complete:false,wholeM3Complete:false},null,2)+'\n');
});
