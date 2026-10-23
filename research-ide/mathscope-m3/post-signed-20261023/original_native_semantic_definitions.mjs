/** Typed semantic edges from original pinned SourceCoupledExpressions registries.
 * Direct AST child references alone omit native function definitions. This
 * module exposes the stored body/coeff/guard DAG roots but DOES NOT derive
 * symbolic derivatives, evaluate ODE/Volterra integrals, or prove Fourier tails.
 */
const bad=(s)=>{throw Object.assign(Error('NATIVE_REGISTRY_SEMANTIC_GAP '+s),{code:'NATIVE_REGISTRY_SEMANTIC_GAP'})};
const array=(v,name)=>{if(!Array.isArray(v))bad(name+' list absent');return v};
const decode=(s,name)=>{if(typeof s!=='string')bad(name+' definitions not captured');try{return array(JSON.parse(s),name)}catch(e){bad(name+' JSON malformed')}};
const at=(rows,id,name)=>{if(!Number.isSafeInteger(id)||id<0||id>=rows.length||!rows[id])bad(name+' missing system '+id);return rows[id]};
const indexed=(id,prefix,rows)=>{
 if(typeof id!=='string'||!id.startsWith(prefix))bad('unexpected '+prefix+' source id '+String(id));
 const n=Number(id.slice(prefix.length));const row=at(rows,n,prefix);
 if(row.id!==id)bad(prefix+' id in native registry does not match '+id);
 return row;
};
export function loadOriginalExtendedNativeRegistry(snapshot,{runtimeCovarianceSystems=null}={}){
 if(!snapshot||!snapshot.base||!Array.isArray(snapshot.counts)||snapshot.counts.length!==5)
    bad('full coupled facade snapshot absent');
 const coupled=decode(snapshot.definitions,'coupled');
 if(coupled.length!==5||coupled.some((a,i)=>!Array.isArray(a)||a.length!==snapshot.counts[i]))
    bad('coupled facade counts differ from original registry');
 const auxiliary=snapshot.base;
 if(!auxiliary||!auxiliary.base)bad('auxiliary base registry missing');
 const aux={
  expressions:decode(auxiliary.expressionDefinitions,'auxiliary.expression'),
  fields:decode(auxiliary.fieldDefinitions,'auxiliary.field'),
  inverses:decode(auxiliary.inverseDefinitions,'auxiliary.inverse')
 };
 for(const [key,expected]of [['expressions','expressions'],['fields','fields'],['inverses','inverses']]){
  if(aux[key].length!==auxiliary[expected])bad('auxiliary '+key+' count mismatch');
 }
 const base=auxiliary.base;
 const globals={
  expressions:decode(base.expression,'global.expression'),
  indexed:decode(base.m3GlobalFields,'global.indexed'),
  pulses:decode(base.m3GlobalPulses,'global.pulses'),
  quadratic:decode(base.quadratic,'global.quadratic'),
  monotone:decode(base.monotone,'global.monotone'),
  picard:decode(base.picard,'global.picard'),
 };
 if(globals.expressions.length!==base.expressionCount||
    globals.indexed.length!==base.m3GlobalFieldCount||
    globals.pulses.length!==base.m3GlobalPulseCount)bad('original base source registry counts changed');
 if(runtimeCovarianceSystems!==null){
   array(runtimeCovarianceSystems,'source covariance');
   for(const d of runtimeCovarianceSystems){
     if(!Number.isSafeInteger(d.variable)||!Array.isArray(d.parameters)||
        !Array.isArray(d.matrix)||d.matrix.length!==2||
        d.matrix.some(row=>!Array.isArray(row)||row.length!==2)||
        !Number.isSafeInteger(d.normUpper)||!Number.isSafeInteger(d.length))
       bad('Original actual covariance runtime system lacks matrix, norm and interval roots');
   }
 }
 return {coupled,aux,globals,covariance:runtimeCovarianceSystems,
   counts:{coupled:snapshot.counts,auxiliary:[aux.expressions.length,aux.fields.length,aux.inverses.length],
       baseExpressions:globals.expressions.length,baseIndexed:globals.indexed.length,basePulse:globals.pulses.length}};
}
function rooted(...items){
 const nodes=[];
 function append(v){
  if(v===undefined||v===null)bad('native definition missing an expected source body');
  if(Number.isSafeInteger(v)&&v>=0){nodes.push(v);return}
  if(Array.isArray(v)){v.forEach(append);return}
  bad('native definition root must be an original graph integer, got '+String(v).slice(0,100));
 }
 items.forEach(append);
 return [...new Set(nodes)];
}
function sourceFieldRoots(field,r){
 if(!field||!Array.isArray(field.rows))bad('native indexed field rows missing');
 let out=[...(field.parameters??[]),...(field.directions??[])];
 for(const row of field.rows){
  if(!Number.isSafeInteger(row.localBody)||!Number.isSafeInteger(row.coefficient)||!Array.isArray(row.values))
    bad('native indexed row missing retained localBody/coefficient/values');
  if(row.localSystem!==undefined){
    const [expectedBody]=originalExpression(row.localSystem,r);
    if(expectedBody!==row.localBody)bad('Native indexed row localSystem does not match stored localBody');
  }
  out.push(row.localBody,row.coefficient,...row.values,...(row.localParameters??[]));
  for(const item of (row.derivativeMaps??[]).flat())out.push(item.coefficient);
  for(const guard of row.guards??[])out.push(...guard);
  for(const d of row.derivativeScales??[])out.push(d);
 }
 return rooted(out);
}
function originalExpression(id,r){
 if(typeof id==='string'){
  if(id.startsWith('coupled-expression:'))return [indexed(id,'coupled-expression:',r.coupled[0]).body,'coupled_expression'];
  if(id.startsWith('forced-expression:'))return [indexed(id,'forced-expression:',r.coupled[4]).body,'forced_expression'];
  bad('unrecognized expression source id '+id);
 }
 if(!Number.isSafeInteger(id))bad('invalid source expression system id');
 return id<0?[at(r.aux.expressions,-1-id,'auxiliary.expression').body,'auxiliary_expression']:
   [at(r.globals.expressions,id,'global.expression').body,'global_expression'];
}
function originalIndexed(id,r){
 if(typeof id==='string'){
  if(id.startsWith('coupled-field:'))return [sourceFieldRoots(indexed(id,'coupled-field:',r.coupled[1]),r),'coupled_indexed'];
  bad('unrecognized indexed source id '+id);
 }
 // Auxiliary indexed uses numeric list IDs; global indexed belongs to global op.
 return [sourceFieldRoots(at(r.aux.fields,id,'auxiliary.indexed'),r),'auxiliary_indexed'];
}
function originalInverse(id,r){
 if(typeof id==='string'){
  if(id.startsWith('coupled-inverse:'))return [indexed(id,'coupled-inverse:',r.coupled[2]).body,'coupled_fourier_inverse'];
  bad('unrecognized inverse source id '+id);
 }
 return [at(r.aux.inverses,id,'auxiliary.fourier').body,'auxiliary_fourier_inverse'];
}
function forcedPulseRoots(def){
 if(!def||!Array.isArray(def.matrix)||!Array.isArray(def.forcing)||!Number.isSafeInteger(def.length))bad('forced ODE matrix/forcing body missing');
 return rooted(def.variable,def.parameters,def.length,def.matrix,def.forcing.flatMap(x=>[x.real,x.imaginary]));
}
function sourcePulseRoots(def){
 if(!def||!Array.isArray(def.matrix)||!Number.isSafeInteger(def.length))
   bad('global pulse native forcing or matrix missing');
 return rooted(def.variable,def.parameters,def.length,def.matrix);
}
const expressionOps=new Set(['m3_coupled_expression_partial','m3_aux_expression_partial','m3_forced_expression_partial','actual_expression_partial']);
const indexedOps=new Set(['m3_coupled_indexed_partial','m3_aux_indexed_partial']);
const inverseOps=new Set(['m3_coupled_inverse_partial','m3_aux_inverse_partial']);
export function nativeSemanticDefinitionEdges(node,r){
 const {op,args}=node;
 if(!Array.isArray(args))bad('invalid native call argument list');
 if(expressionOps.has(op)){
  const [body,label]=originalExpression(args[0],r);
  return {kind:label,bodyRoots:rooted(body),resolved:true,
    differentiationSemanticsVerified:false};
 }
 if(indexedOps.has(op)){
  const [b,label]=originalIndexed(args[0],r);
  return {kind:label,bodyRoots:rooted(b),resolved:true,
    differentiationSemanticsVerified:false};
 }
 if(inverseOps.has(op)){
  const [body,label]=originalInverse(args[0],r);
  return {kind:label,bodyRoots:rooted(body),resolved:true,
    fourierTailAndCoefficientsVerified:false};
 }
 if(op==='m3_forced_pulse_partial'){
  const def=at(r.coupled[3],args[0],'forced.pulse');
  return {kind:'forced_ODE',bodyRoots:forcedPulseRoots(def),resolved:true,
    odeVariationalBoundsVerified:false};
 }
 if(op==='m3_global_pulse_jet'){
  const def=at(r.globals.pulses,args[0],'global.pulse');
  return {kind:'global_ODE',bodyRoots:sourcePulseRoots(def),resolved:true,
    odeVariationalBoundsVerified:false};
 }
 if(op==='m3_global_indexed_partial'){
  const f=at(r.globals.indexed,args[0],'global.indexed');
  return {kind:'global_indexed',bodyRoots:sourceFieldRoots(f,r),resolved:true,
    differentiationSemanticsVerified:false};
 }
 if(op==='actual_background_picard'){
  const f=at(r.globals.picard,args[0],'global.picard');
  return {kind:'background_picard',bodyRoots:rooted(f.xi,f.eta,f.A0,f.A1,f.forcing),resolved:true,
    analyticODEProofVerified:false};
 }
 if(op==='actual_covariance_volterra'){
  if(!r.covariance)return {kind:'source_covariance_volterra',bodyRoots:[],resolved:false,
    blocker:'Missing separately captured actual covarianceSystems source registry'};
  const d=at(r.covariance,args[0],'actual.covariance.volterra');
  return {kind:'source_covariance_volterra',resolved:true,
    bodyRoots:rooted(d.variable,d.parameters,d.matrix,d.normUpper,d.length,d.initial),
    matrixCoefficientBoundsAndTailVerified:false};
 }
 return null;
}