import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {unpackN8Observation,n8MathematicalPayload,compareN8Mathematics,n8RunCategories} from '../tools/n8-reproduction-contract.mjs';

const publicRoot=new URL('../../evidence/all64-20261012/public-v99/',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,publicRoot),'utf8'));
const clone=value=>JSON.parse(JSON.stringify(value));

test('the actual selected public record supplies every named numerical category and its actual camera',()=>{
  const observed=unpackN8Observation(read('flow-export.json')),categories=n8RunCategories(observed);
  for(const name of ['edition','source','constants','basis','domain','timeSchedule','quadrature','truncations','precision','tails','residual','energy','camera'])
    assert.ok(name in categories,name);
  assert.equal(categories.timeSchedule.acceptedSteps,13);
  assert.equal(categories.truncations.modes,125);
  assert.equal(categories.camera.state.yaw,-.7200000000000001);
  assert.equal(categories.energy.originalPaperWholeSpaceEnergy,false);
  assert.equal(categories.precision.rigorousErrorEnclosure,false);
  assert.equal(categories.residual.originalLocalizedSourceResidual,false);
  assert.equal(categories.tails.certifiedContinuumTail,false);
});

test('original source fixtures preserve their own missing whole-field observables explicitly',()=>{
  for(const file of ['core-refinement-export.json','near-terminal-run.json']){
    const value=n8RunCategories(unpackN8Observation(read(file)));
    assert.equal(value.role,'ORIGINAL_SOURCE_FIXTURE');
    assert.equal(value.energy.finitePeriodicEnergySubstituted,false);
    assert.equal(typeof value.residual.status,'string');
    assert.notEqual(value.residual.status,'PASS');
    assert.notEqual(value.energy.status,'PASS');
  }
});

test('a fabricated original whole-space energy claim cannot enter the selected-run manifest',()=>{
  const value=read('flow-export.json');
  value.record.result.observations.energy.originalPaperWholeSpaceEnergy=true;
  assert.throws(()=>n8RunCategories(unpackN8Observation(value)),/finite periodic run/);
  const another=read('flow-export.json');
  another.record.result.results.precision.rigorousErrorEnclosure=true;
  assert.throws(()=>n8RunCategories(unpackN8Observation(another)),/finite periodic run/);
});

test('serialized milestone and proof flags never grant imported authority',()=>{
  for(const field of ['wholeM3Complete','formalProofIssued']){
    const value=read('flow-export.json');value.record[field]=true;
    assert.throws(()=>unpackN8Observation(value),/cannot supply proof or milestone authority/);
  }
  const value=read('flow-export.json');value.record.serializedAuthority='TRUSTED';
  assert.throws(()=>unpackN8Observation(value),/cannot supply proof or milestone authority/);
});

test('comparison retains every computed field, path and energy value but separates presentation metadata',()=>{
  const result=unpackN8Observation(read('flow-export.json')).result;
  const expected=n8MathematicalPayload(result),metadataOnly=clone(result);
  metadataOnly.runHash='a'.repeat(64);
  assert.equal(compareN8Mathematics(n8MathematicalPayload(metadataOnly),expected).pass,true);
  for(const mutate of [
    value=>{value.observations.samples[10].velocity[0]+=1e-6;},
    value=>{value.observations.energy.global.integral+=1e-6;},
    value=>{value.results.final.pop();}
  ]){
    const changed=clone(result);mutate(changed);
    assert.equal(compareN8Mathematics(n8MathematicalPayload(changed),expected,
      {absoluteTolerance:2e-12,relativeTolerance:2e-11}).pass,false);
  }
});

test('a tolerance accepts bounded roundoff and rejects changed structure, integers and nonfinite values',()=>{
  const tolerance={absoluteTolerance:2e-12,relativeTolerance:2e-11};
  assert.equal(compareN8Mathematics({x:.5+1e-13},{x:.5},tolerance).pass,true);
  for(const [actual,expected] of [[{x:.5+1e-6},{x:.5}],[{x:1e14+1},{x:1e14}],
    [{x:null},{x:0}],[{x:[1,2]},{x:[1]}],[{x:1,y:2},{x:1}],
    [{x:NaN},{x:0}],[{x:Infinity},{x:Infinity}]])
    assert.equal(compareN8Mathematics(actual,expected,tolerance).pass,false);
  assert.throws(()=>compareN8Mathematics([1,2],[1,2],{maxNodes:1}),/budget/);
  assert.throws(()=>compareN8Mathematics(1,1,{absoluteTolerance:1}),/tolerance/);
});
