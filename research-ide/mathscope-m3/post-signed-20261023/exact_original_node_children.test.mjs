import test from 'node:test';
import assert from 'node:assert/strict';
import {exactOriginalSourceNodeChildren as c} from './exact_original_node_children.mjs';

test('original natural-series metadata derivative orders are not graph edges',()=>{
 assert.deepEqual(c({op:'actual_natural_series',args:['average',474,2,0,0]}),[474,2]);
});
test('background Picard component and derivative order not graph edges',()=>{
 assert.deepEqual(c({op:'actual_background_picard',args:[7,3,501,502,5]}),[501,502]);
});
test('even-profile system and component and two derivative orders excluded',()=>{
 assert.deepEqual(c({op:'actual_background_even_profile',args:[7,3,501,502,0,8]}),[501,502]);
});
test('quadratic-root metadata system and component excluded',()=>{
 assert.deepEqual(c({op:'actual_quadratic_root',args:[0,4,2]}),[2]);
});
test('monotone-root system index excluded',()=>{
 assert.deepEqual(c({op:'actual_monotone_root',args:[0,300,501]}),[300,501]);
});
test('Volterra source time AND full parameter tuple included',()=>{
 for(const op of ['actual_covariance_volterra','actual_pulse_jet_volterra',
    'actual_pulse_sensitivity_volterra','actual_pulse_third_jet_volterra',
    'actual_n6_pulse_higher_jet_volterra']){
  assert.deepEqual(c({op,args:[0,3,99,[120,130]]}),[99,120,130],op);
 }
});
test('global-pulse and forced-pulse source shapes retain all arguments',()=>{
 assert.deepEqual(c({op:'m3_global_pulse_jet',args:['system',2,99,[100,101],[0,2]]}),[99,100,101]);
 assert.deepEqual(c({op:'m3_forced_pulse_partial',args:['system','part',2,99,[100,101],[0,2]]}),[99,100,101]);
});
test('shared source expressions keep all argument roots not derivative order metadata',()=>{
 for(const op of ['actual_expression_partial','m3_aux_inverse_partial',
  'm3_coupled_inverse_partial','m3_global_indexed_partial','m3_forced_expression_partial']){
    assert.deepEqual(c({op,args:['function-id',[100,101],[4,0]]}),[100,101],op);
 }
});
test('integer exponent and step order are not nodes',()=>{
 assert.deepEqual(c({op:'integer_power',args:[50,500]}),[50]);
 assert.deepEqual(c({op:'source_step_derivative',args:[50,12]}),[50]);
});
test('integral bound-variable metadata ignored, all value operands kept',()=>{
 assert.deepEqual(c({op:'definite_integral',args:[50,31,10,90]}),[50,10,90]);
});
test('unknown native shapes refuse misleading reachability counts',()=>{
 assert.throws(()=>c({op:'unimplemented_future_native',args:[5,2]}),
   {code:'UNRECOGNIZED_SOURCE_NODE_SHAPE'});
});
test('invalid native array must not fall back to numbers that look like ids',()=>{
 assert.throws(()=>c({op:'actual_covariance_volterra',args:[1,3,5,700]}),
   {code:'UNRECOGNIZED_SOURCE_NODE_SHAPE'});
});
