import test from 'node:test';
import assert from 'node:assert/strict';
import {ActualConvergentExpressions} from '../actual-continuation-exact-functions.mjs';
import {ActualPulseJetExpressions} from '../actual-pulse-jet-kernel.mjs';
import {snapshotActualProgramArrays} from '../actual-program-array-snapshot.mjs';
import {canonicalStringify,sha256} from '../../../mathscope-m0/contracts.mjs';

function fixture(){
  const G=new ActualPulseJetExpressions(new ActualConvergentExpressions()),v=G.fresh('snapshot_v'),a=G.fresh('snapshot_a'),
    body=G.add(G.pow(a,2),v),definition=G.defineExpressionFunction({name:'SnapshotOriginalBody',parameters:[a,v],body}),
    matrix=[[a,v],[G.zero,a]],covariance=G.defineCovarianceVolterra({name:'SnapshotOriginalODE',variable:v,parameters:[a],matrix,normUpper:G.q(4),length:G.one}),
    jet=G.definePulseSecondVariation({name:'SnapshotOriginalVariation',variable:v,parameters:[a],directions:[a],matrix,initial:[G.one,G.zero],
      left:G.zero,length:G.one,matrixNorm:G.q(4),matrixFirstNorms:[G.one],matrixSecondNorms:[[G.zero]],matrixTimeNorm:G.one,
      initialNorm:G.one,initialFirstNorms:[G.zero],initialSecondNorms:[[G.zero]],leftFirstNorms:[G.zero],leftSecondNorms:[[G.zero]]}),
    raw=G.pack({body,covariance,jet},{checks:[{id:'fixture-only',pass:true}]}),program=snapshotActualProgramArrays(raw),
    count=G.nodes.length,nodes=canonicalStringify(G.nodes),definitions=G.captureFunctionDefinitions(),
    covarianceCount=G.covarianceSystems.length,covariances=canonicalStringify(G.covarianceSystems),serialized=canonicalStringify(program),
    unchanged=()=>canonicalStringify(program)===serialized&&canonicalStringify(G.nodes.slice(0,count))===nodes&&
      G.functionDefinitionsUnchanged(definitions)&&canonicalStringify(G.covarianceSystems.slice(0,covarianceCount))===covariances;
  return {G,v,a,body,definition,raw,program,count,serialized,unchanged};
}

test('append-only original graph and function additions leave the sealed program hash unchanged',async()=>{
  const f=fixture(),{G,raw,program,body,a,v}=f,before=await sha256(f.serialized);
  const arrays=Object.entries(raw).filter(([,value])=>Array.isArray(value));
  for(const [key,value]of arrays){assert.notEqual(program[key],value,key);assert.deepEqual(program[key],value,key);}
  assert.equal(program.nodes[body],G.nodes[body]);
  assert.equal(program.expressionSystems[f.definition],G.expressionSystems[f.definition]);
  G.defineExpressionFunction({name:'LaterAdditiveBody',parameters:[a,v],body:G.mul(G.add(a,G.one),v)});
  G.defineCovarianceVolterra({name:'LaterAdditiveODE',variable:v,parameters:[a],matrix:[[a,G.zero],[G.zero,a]],normUpper:G.q(2),length:G.one});
  assert.ok(G.nodes.length>f.count);
  assert.ok(raw.nodes.length>program.nodes.length);
  assert.ok(raw.expressionSystems.length>program.expressionSystems.length);
  assert.notEqual(canonicalStringify(raw),f.serialized,'the old live-array pack reproduces the defect');
  assert.equal(f.unchanged(),true);
  assert.equal(await sha256(canonicalStringify(program)),before);
});

test('an existing node mutation remains visible and is rejected by the same canonical-prefix seal',()=>{
  const f=fixture(),node=f.G.nodes[f.body],old=node.args[0];
  node.args[0]=f.G.zero;
  assert.equal(f.program.nodes[f.body],node);
  assert.equal(f.unchanged(),false);
  node.args[0]=old;
  assert.equal(f.unchanged(),true);
});

test('an existing retained function definition mutation remains rejected',()=>{
  const f=fixture(),definition=f.G.expressionSystems[f.definition],old=definition.body;
  definition.body=f.G.zero;
  assert.equal(f.program.expressionSystems[f.definition],definition);
  assert.equal(f.unchanged(),false);
  definition.body=old;
  assert.equal(f.unchanged(),true);
});

test('nested fixed metadata is still guarded and is not silently deep-copied',()=>{
  const f=fixture(),old=f.G.naturalKernel.sourceEquations[0];
  assert.equal(f.program.naturalSeriesKernel,f.G.naturalKernel);
  f.G.naturalKernel.sourceEquations[0]='tampered';
  assert.equal(f.unchanged(),false);
  f.G.naturalKernel.sourceEquations[0]=old;
  assert.equal(f.unchanged(),true);
});

test('a snapshot helper does not accept a descriptor without an actual node array',()=>{
  for(const value of [null,[],{}, {nodes:{}}])assert.throws(()=>snapshotActualProgramArrays(value),{code:'INVALID_INPUT'});
});
