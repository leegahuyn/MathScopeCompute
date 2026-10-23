/** Exact SourceExpressions child-reference selector for the pinned source operator schemas.
 * Metadata integers (component, derivative order, system index) are NEVER node ids.
 * Unknown node shapes fail closed; a root-reachable census is not an evaluation.
 */
const bad=(op,reason)=>{throw Object.assign(new Error('UNRECOGNIZED_SOURCE_NODE_SHAPE '+op+': '+reason),{code:'UNRECOGNIZED_SOURCE_NODE_SHAPE',sourceOp:op})};
const primitive=new Set(['rational','coordinate','source_parameter']);
const unary=new Set(['inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling']);
const allArgs=new Set(['add','multiply','maximum','smooth_piecewise']);
const expressions=new Set(['actual_expression_partial','m3_aux_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial','m3_coupled_expression_partial','m3_coupled_indexed_partial','m3_coupled_inverse_partial','m3_forced_expression_partial','m3_global_indexed_partial','actual_expression_partial']);
const volterra=new Set(['actual_covariance_volterra','actual_pulse_jet_volterra','actual_pulse_sensitivity_volterra','actual_pulse_third_jet_volterra','actual_n6_pulse_higher_jet_volterra','m3_global_pulse_jet']);
const must=(op,yes,why)=>{if(!yes)bad(op,why)};
const ids=(op,a)=>{must(op,a.every(x=>Number.isSafeInteger(x)&&x>=0),'non-integer node pointer');return a};
export function exactOriginalSourceNodeChildren({op,args}){
 must(op,Array.isArray(args),'missing node args');
 if(primitive.has(op))return [];
 if(unary.has(op)||op==='integer_power'||op==='source_step_derivative'){
   must(op,args.length>=1&&Number.isSafeInteger(args[0]),'missing unary operand');
   return [args[0]];
 }
 if(allArgs.has(op)){
   must(op,(op==='add'||op==='multiply')?args.length===2:op==='smooth_piecewise'?args.length===6:args.length>=1,'wrong arity');
   return ids(op,args);
 }
 if(op==='definite_integral'){
   must(op,args.length===4,'expected [body,boundVariable,left,right]');
   return ids(op,[args[0],args[2],args[3]]);
 }
 if(op==='actual_natural_series'){
   must(op,args.length===5,'expected [component,Y,eta,radialOrder,etaOrder]');
   return ids(op,[args[1],args[2]]);
 }
 if(op==='actual_background_picard'){
   must(op,args.length===5,'expected [system,component,xi,eta,etaOrder]');
   return ids(op,[args[2],args[3]]);
 }
 if(op==='actual_background_even_profile'){
   must(op,args.length===6,'expected [system,component,X,eta,radialOrder,etaOrder]');
   return ids(op,[args[2],args[3]]);
 }
 if(op==='actual_quadratic_root'){
   must(op,args.length===3,'expected [system,component,eta]');
   return ids(op,[args[2]]);
 }
 if(op==='actual_monotone_root'){
   must(op,args.length>=2,'expected [system,...coordinate values]');
   return ids(op,args.slice(1));
 }
 if(volterra.has(op)){
   must(op,args.length===(op==='m3_global_pulse_jet'?5:4)&&Array.isArray(args[3]),
     'expected system+component+time+values array');
   return ids(op,[args[2],...args[3]]);
 }
 if(op==='m3_forced_pulse_partial'){
   must(op,args.length===6&&Array.isArray(args[4]),'expected forced time and parameter value array');
   return ids(op,[args[3],...args[4]]);
 }
 if(expressions.has(op)){
   must(op,args.length===3&&Array.isArray(args[1]),'expected system+values+derivative metadata');
   return ids(op,args[1]);
 }
 if(op==='actual_expression_partial'){
   must(op,args.length===3&&Array.isArray(args[1]),'expected system+values+derivative metadata');
   return ids(op,args[1]);
 }
 bad(op,'unrecognized original native node requires independent source-specific shape rule');
}