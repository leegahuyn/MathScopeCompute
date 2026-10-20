/** Optional read-only export from an ALREADY genuine executed forced object.
 * No constructor, mutation, private seal restoration, or extra pipeline run.
 * The caller decides whether its live resource budget permits the export.
 */
export function collectLiveInitialScalarClosure(forced,{maxNodes=100000,maxMilliseconds=5000}={}){
  const initial=forced?.input,G=initial?.G;
  if(!G||!Array.isArray(G.nodes)||!Array.isArray(initial?.templates)||!initial?.reference)
    throw Error('Expected the genuine forced constructor result with its original initialized input.');
  const start=performance.now(),captured=G.captureFunctionDefinitions(),registries={};
  function unpack(d){for(const[k,v]of Object.entries(d)){if(k==='base')unpack(v);else if(typeof v==='string'){try{registries[k]=JSON.parse(v);}catch{}}}}
  unpack(captured);const roots=new Set();
  for(const t of initial.templates){roots.add(t.phase);roots.add(t.k);for(const r of t.waveRows)for(const v of r.velocity){roots.add(v.real);roots.add(v.imaginary);}}
  for(const r of initial.reference.normalizedMeanVelocity)roots.add(r);
  const stack=[...roots],seen=new Set(),records={},definitions={},nativeBoundaries=[];
  const calls=new Set(['actual_expression_partial','m3_aux_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial',
    'm3_global_indexed_partial','m3_coupled_expression_partial','m3_coupled_indexed_partial','m3_coupled_inverse_partial','m3_forced_expression_partial']);
  function definition(op,args){
    const groups={actual_expression_partial:'expression',m3_aux_expression_partial:'expressionDefinitions',
      m3_aux_indexed_partial:'fieldDefinitions',m3_aux_inverse_partial:'inverseDefinitions',m3_global_indexed_partial:'m3GlobalFields',
      actual_monotone_root:'monotone',actual_quadratic_root:'quadratic',actual_background_even_profile:'picard',actual_background_picard:'picard'};
    if(groups[op]){const group=groups[op],idx=op==='m3_aux_expression_partial'?-1-args[0]:args[0];return[group+':'+idx,registries[group]?.[idx]];}
    const group={m3_coupled_expression_partial:0,m3_coupled_indexed_partial:1,m3_coupled_inverse_partial:2,m3_forced_pulse_partial:3,m3_forced_expression_partial:4}[op];
    if(group!==undefined){const idx=op==='m3_forced_pulse_partial'?args[0]:Number(args[0].split(':').at(-1));return['definitions:'+group+':'+idx,registries.definitions?.[group]?.[idx]];}
    if(op==='actual_natural_series')return['fixed',registries.fixed];
    if(op==='actual_covariance_volterra'){const d=registries.m3GlobalPulses?.filter(d=>d.covariance===args[0]);return['covariance:'+args[0],d?.length===1?d[0]:undefined];}
    return null;
  }
  while(stack.length&&seen.size<maxNodes&&performance.now()-start<maxMilliseconds){
    const id=stack.pop();if(seen.has(id))continue;seen.add(id);
    const node=G.nodes[id];if(!node)throw Error('Missing live original scalar '+id);records[id]=node;
    const {op,args}=node;let children=[];
    if(['rational','coordinate','source_parameter'].includes(op)){}
    else if(['inverse','sqrt_positive','log_positive','exp','sine','cosine','ceiling','integer_power','source_step_derivative'].includes(op))children=args.slice(0,1);
    else if(['add','multiply','maximum','smooth_piecewise','definite_integral'].includes(op))children=args;
    else if(calls.has(op))children=args[1];
    else if(op==='actual_natural_series')children=args.slice(1,3);
    else if(op==='actual_quadratic_root')children=args.slice(2,3);
    else if(op==='actual_monotone_root')children=args.slice(1);
    else if(['actual_background_even_profile','actual_background_picard'].includes(op))children=args.slice(2,4);
    else if(['actual_covariance_volterra','m3_global_pulse_jet'].includes(op))children=[args[2],...args[3]];
    else if(op==='m3_forced_pulse_partial')children=[args[3],...args[4]];
    else nativeBoundaries.push({id,op,reason:'unsupported operand grammar'});
    stack.push(...children);
    const found=definition(op,args);
    if(found){const[key,d]=found;if(d){definitions[key]=d;if(Number.isSafeInteger(d.body))stack.push(d.body);else nativeBoundaries.push({id,op,registry:key,reason:'native numerical kernel retained'});}
      else nativeBoundaries.push({id,op,registry:key,reason:'definition not exposed by captured registry'});}
  }
  return {schema:'MathScope.LiveActualInitialScalarClosure/1',source:initial.source,
    originalNodeCount:G.nodes.length,actualInitialTuple:{velocity:initial.global.velocity,pressure:initial.global.pressure},
    rootList:[...roots],templates:initial.templates.map(t=>({key:t.key,phase:t.phase,k:t.k,waveRows:t.waveRows})),
    reference:initial.reference,records,definitions,nativeBoundaries,elapsedMilliseconds:performance.now()-start,
    retainedScalarCount:seen.size,remainingScalarQueue:stack.length,completeScalarArgumentAndExpressionBodyClosure:stack.length===0,
    fullNumericalNativeClosure:false,privateSealSerializedOrRestored:false,
    scope:'Observed existing genuine graph only. Node numbers belong to this execution; older graph equality and numerical evaluator completion are not asserted.'};
}
