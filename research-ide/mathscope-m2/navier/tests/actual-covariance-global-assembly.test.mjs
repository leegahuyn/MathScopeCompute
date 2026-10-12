import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualSourceExpressions,evaluateSourceProgramDiagnostic} from '../actual-global-source-expressions.mjs';
import {sourcePartitionBump,sourceSquaredProductPartition,assertSourceSquaredProductPartition,covariancePhysicalExponentAudit,covarianceGlobalAssemblyRecipe} from '../actual-covariance-global-assembly.mjs';
import {rational as Q,qadd as add,qsub as sub,qmul as mul,qdiv as div} from '../actual-continuation-arithmetic.mjs';

const G=new ActualSourceExpressions(),offsets=Array.from({length:10},(_,i)=>G.var('offset_'+i));
const partition=sourceSquaredProductPartition(G,{bandOffset:offsets[0],meshOffsets:[offsets.slice(1,4),offsets.slice(4,7),offsets.slice(7,10)]});
const h=G.q(3,16),q=G.q(1,4096),bandQ=G.q(1,2048),target=[G.q(-2),G.q(3,7)];
const assembly=covarianceGlobalAssemblyRecipe(G,{h,q,Q:bandQ,target,partition});
const evalAt=(root,values)=>evaluateSourceProgramDiagnostic(G.pack({root}),root,{coordinates:Object.fromEntries(values.map((v,i)=>['offset_'+i,v]))}).value;
const sum=a=>a.reduce(add,Q(0)),squared=a=>mul(a,a);

test('complete band-specific product includes one row per box and both signs inside every row',()=>{
  assert.equal(partition.rows.length,81);assert.equal(partition.maxPositiveBoxes,16);
  assert.equal(new Set(partition.rows.map(r=>r.key)).size,81);
  assert(partition.rows.every(r=>r.countInGlobalSum===1&&r.signColumns.length===2));
  assert.equal(new Set(partition.meshes.flat().map(d=>d.offset)).size,9);
  assert.equal(partition.originalFamily.pointwiseInfiniteComplementIsExactlyZero,true);
  assert.equal(partition.originalFamily.uncutInfiniteNumericalSumUsed,false);
});

test('the actual smooth bump and complete partition agree at centers, support joins and overlapping band/mesh offsets',()=>{
  for(const values of [Array(10).fill(0),Array(10).fill(.5),Array(10).fill(-.5),Array.from({length:10},(_,i)=>(i-5)/10),[.37,-.49,.2,.45,.26,-.3,.4,-.2,.5,-.5]]){
    const weights=partition.rows.map(r=>evalAt(r.squaredCutoff,values));
    assert(weights.every(x=>x>=0&&x<=1));assert(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<5e-14);
    assert(weights.filter(x=>x>0).length<=16);
    assert(Math.abs(evalAt(partition.expandedSquaredSum,values)-1)<5e-14);
  }
  const t=G.var('bump_position'),b=sourcePartitionBump(G,t);
  for(const [x,value]of [[-2,0],[-.75,0],[-.5,.5],[-.25,1],[0,1],[.25,1],[.5,.5],[.75,0],[2,0]]){
    const r=evaluateSourceProgramDiagnostic(G.pack({b}),b,{coordinates:{bump_position:x}});
    assert.equal(r.value,value);assert.equal(r.sameProfileCertificate,false);
  }
});

test('flat bump joins and center have the correct active-branch derivatives without an absolute-value singularity',()=>{
  const t=G.var('bump_derivative_position'),b=sourcePartitionBump(G,t),d1=G.derivative(b,t),d2=G.derivative(d1,t);
  for(const x of [-.75,-.25,0,.25,.75])for(const root of [d1,d2]){
    assert.equal(evaluateSourceProgramDiagnostic(G.pack({root}),root,{coordinates:{bump_derivative_position:x}}).value,0);
  }
});

test('independent exact rational normalization handles unequal masses in every band and detects duplicated signs',()=>{
  for(let seed=0;seed<12;seed++){
    const band=[Q(seed+1),Q(2*seed+3),Q(5)],normal=a=>{const den=sum(a.map(squared));return a.map(x=>div(squared(x),den));},bw=normal(band);
    let total=Q(0),first;
    for(let b=0;b<3;b++){
      const mesh=Array.from({length:3},(_,j)=>normal([Q(1+b+j),Q(seed+2+j),Q(2+b)]));
      for(let r=0;r<3;r++)for(let z=0;z<3;z++)for(let t=0;t<3;t++){
        const weight=mul(bw[b],mul(mesh[0][r],mul(mesh[1][z],mesh[2][t])));first??=weight;total=add(total,weight);
      }
    }
    assert.deepEqual(total,Q(1));assert.notDeepEqual(sub(total,first),Q(1));
    assert.deepEqual(mul(Q(2),total),Q(2),'summing plus/minus cutoffs separately doubles the total');
  }
});

test('physical exponent cancellation is exact in h and retains both epsilon and the target scale',()=>{
  const audit=covariancePhysicalExponentAudit();assert.equal(audit.pass,true);
  assert.deepEqual(audit.QExponent,['0','0']);assert.deepEqual(audit.qExponent,['-1','-1']);assert.equal(audit.hReplacedByZero,false);
  for(const hv of [Q(1,2),Q(1,100),Q(1,1000000000000000000000000n)]){
    const A=add(Q(1,2),hv),withAll=add(add(mul(Q(-2),A),hv),add(A,Q(1,2)));
    assert.deepEqual(withAll,Q(0));assert.notDeepEqual(sub(withAll,hv),Q(0),'omitting epsilon leaves a nonzero Q power');
  }
});

test('source-scale graph reproduces the two-component physical target for different complete overlapping partitions',()=>{
  for(const values of [Array(10).fill(0),Array(10).fill(.5),Array.from({length:10},(_,i)=>(i-5)/10)]){
    for(let j=0;j<2;j++){
      const expected=evalAt(assembly.roots.physicalTarget[j],values),local=evalAt(assembly.roots.physicalOneBand[j],values),full=evalAt(assembly.roots.expandedPhysicalSum[j],values);
      assert(Math.abs(local/expected-1)<5e-14);assert(Math.abs(full/expected-1)<5e-14);
    }
  }
  assert(assembly.checks.every(c=>c.pass));assert.deepEqual(assembly.exactResidual,[G.zero,G.zero]);
  assert.match(assembly.proof.average,/not the pointwise/);
});

test('missing, duplicated, copied or mutated box rows cannot be accepted as a complete generated partition',()=>{
  assert.throws(()=>assertSourceSquaredProductPartition(G,structuredClone(partition)),/unchanged generated/);
  const H=new ActualSourceExpressions(),x=H.var('x'),create=()=>sourceSquaredProductPartition(H,{bandOffset:x,meshOffsets:Array.from({length:3},()=>[x,x,x])});
  const missing=create();missing.rows.pop();assert.throws(()=>assertSourceSquaredProductPartition(H,missing));
  const duplicated=create();duplicated.rows.push(duplicated.rows[0]);assert.throws(()=>assertSourceSquaredProductPartition(H,duplicated));
  const weighted=create();weighted.rows[0].countInGlobalSum=2;assert.throws(()=>assertSourceSquaredProductPartition(H,weighted));
  assertSourceSquaredProductPartition(G,partition);
});

test('the assembly rejects malformed domains and never upgrades a generic lemma into source completion',()=>{
  assert.throws(()=>sourceSquaredProductPartition(G,{bandOffset:G.q(3,4),meshOffsets:Array.from({length:3},()=>[G.zero,G.zero,G.zero])}),/offset/);
  assert.throws(()=>sourceSquaredProductPartition(G,{bandOffset:offsets[0],meshOffsets:[offsets.slice(1,4)]}),/three/);
  assert.throws(()=>covarianceGlobalAssemblyRecipe(G,{h,q:G.zero,Q:bandQ,target,partition}),/strictly positive/);
  assert.throws(()=>covarianceGlobalAssemblyRecipe(G,{h,q,Q:bandQ,target,partition,complete:true}),/exact h/);
  assert.equal(assembly.scope.actualEveryBoxHCertified,false);assert.equal(assembly.scope.sourceUniformQStarCertified,false);
  assert.equal(assembly.scope.actualGlobalEquation730Certified,false);assert.equal(assembly.scope.originalN506Complete,false);
  assert.equal(assembly.scope.actualSourceBindingRequired,true);assert.match(assembly.proof.edges,/only on the open/);
});
