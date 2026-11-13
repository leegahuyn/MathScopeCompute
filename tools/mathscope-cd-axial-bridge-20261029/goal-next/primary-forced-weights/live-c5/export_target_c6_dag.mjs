/** Exact typed source DAG export for actual live target.ftcRows.
 * Caller must first verify the private target/family seal. No seals are serialized.
 * Compressed NDJSON: header; node and referenced-definition records; trailer.
 * Coordinates are retained as nodes, including lexical integral binders.
 */
import {createWriteStream} from 'node:fs';
import {createGzip} from 'node:zlib';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createHash} from 'node:crypto';

export async function exportActualTargetC6Dag(target,{outputPath,maxVisited=2500000,onProgress=()=>{}}={}){
 if(!target?.G?.nodes||!target?.family||target.request?.derivativeOrder!==6||!Array.isArray(target.ftcRows)||typeof outputPath!=='string')throw Error('TARGET_SOURCE_OR_REQUEST_MISMATCH');
 if(!Number.isSafeInteger(maxVisited)||maxVisited<1)throw Error('INVALID_VISIT_BUDGET');
 const G=target.G,rows=target.ftcRows.map(r=>({kind:r.kind,component:r.component,radialOrder:r.radialOrder,etaOrder:r.etaOrder,
  coordinates:r.coordinates,lower:r.lower,upper:r.upper,body:r.body,actualCoefficientBody:r.actualCoefficientBody??null,
  actualStressBody:r.actualStressBody??null,actualDerivative:r.actualDerivative,bound:r.bound,
  faces:r.faces.map(f=>({mask:f.mask,derivative:f.derivative,selectedCoordinates:f.selectedCoordinates,upperBound:f.upperBound}))}));
 if(rows.length!==168||rows.some(r=>r.faces.length!==4))throw Error('TARGET_ROW_COUNT_OR_FACE_COUNT_MISMATCH');
 const keys=new Set(rows.map(r=>`${r.kind}/${r.component}/${r.radialOrder}/${r.etaOrder}`));
 for(const kind of ['inner','middle','outer'])for(let c=0;c<2;c++)for(let r=0;r<=6;r++)for(let e=0;r+e<=6;e++)if(!keys.has(`${kind}/${c}/${r}/${e}`))throw Error('MISSING_TARGET_ROW');
 if(keys.size!==168)throw Error('DUPLICATE_TARGET_ROW');
 const ints=x=>{if(Number.isSafeInteger(x))return [x];if(Array.isArray(x))return x.flatMap(ints);throw Error('MALFORMED_NODE_ARRAY');};
 const defArrays={expression:G.expressionSystems,picard:G.picardSystems,quadratic:G.quadraticSystems,monotone:G.monotoneSystems};
 const seenDefs={expression:new Set(),picard:new Set(),quadratic:new Set(),monotone:new Set()};
 const queue=[],seen=new Set();const add=x=>{if(!Number.isSafeInteger(x)||x<0||x>=G.nodes.length)throw Error(`INVALID_NODE_${x}`);if(!seen.has(x)){seen.add(x);queue.push(x);if(seen.size>maxVisited)throw Error('TARGET_DAG_VISIT_BUDGET');}};
 const addDef=(kind,id)=>{
  if(!Array.isArray(defArrays[kind])||!Number.isSafeInteger(id)||!defArrays[kind][id])throw Error(`UNKNOWN_${kind}_${id}`);
  if(seenDefs[kind].has(id))return;seenDefs[kind].add(id);const d=defArrays[kind][id];let refs=[];
  if(kind==='expression')refs=[...d.parameters,d.body];
  if(kind==='monotone')refs=[...d.parameters,d.variable,d.body,d.left,d.right,d.derivativeLower,d.derivativeUpper];
  if(kind==='quadratic')refs=[...ints(d.linear),...ints(d.quadraticDiagonal),...ints(d.rhs),d.scale,...ints(d.preconditioner),d.rootRadius,d.lipschitzUpper];
  if(kind==='picard')refs=[d.xi,d.eta,...ints(d.A0),...ints(d.A1),...ints(d.forcing),...ints(d.radialDomain),...ints(d.zeroAxisDatum)];
  refs.forEach(add);
 };
 for(const r of rows){[...r.coordinates,...r.lower,...r.upper,r.body,r.actualDerivative,r.bound].forEach(add);
  if(r.actualCoefficientBody!==null)add(r.actualCoefficientBody);if(r.actualStressBody!==null)add(r.actualStressBody);
  for(const f of r.faces)[f.derivative,...f.selectedCoordinates,f.upperBound].forEach(add);}
 const unary=new Set(['inverse','exp','log_positive','sqrt_positive','ceiling','ceiling_nonnegative','sine','cosine']);
 for(let j=0;j<queue.length;j++){
  if(j%32768===0)onProgress({stage:'target-c6-export-walk',visited:j,queued:queue.length});
  const id=queue[j],n=G.nodes[id],a=n.args;let children=[];
  if(['coordinate','rational','source_parameter'].includes(n.op))children=[];
  else if(['add','multiply','maximum','smooth_piecewise'].includes(n.op))children=a;
  else if(unary.has(n.op)||['integer_power','source_step_derivative'].includes(n.op))children=[a[0]];
  else if(n.op==='definite_integral')children=a; // body, binder, lower and upper are distinct typed slots
  else if(n.op==='actual_expression_partial'){addDef('expression',a[0]);children=a[1];}
  else if(n.op==='actual_background_picard'||n.op==='actual_background_even_profile'){addDef('picard',a[0]);children=a.slice(2,4);}
  else if(n.op==='actual_natural_series')children=a.slice(1,3);
  else if(n.op==='actual_quadratic_root'){addDef('quadratic',a[0]);children=[a[2]];}
  else if(n.op==='actual_monotone_root'){addDef('monotone',a[0]);children=a.slice(1);}
  else throw Error(`UNSUPPORTED_TYPED_OP_${n.op}_NODE_${id}`);
  children.forEach(add);
 }
 const ids=[...seen].sort((a,b)=>a-b),fixed=G.captureFunctionDefinitions?.().fixed??null;
 const bodyHash=createHash('sha256');for(const id of ids)bodyHash.update(JSON.stringify([id,G.nodes[id]])+'\n');
 const sourcePrefix117100SHA256=G.nodes.length>=117100
  ?createHash('sha256').update(JSON.stringify(G.nodes.slice(0,117100))).digest('hex'):null;
 const header={kind:'header',schema:'MathScope.ActualTargetC6TypedDag/1',sourceProfile:target.sourceBinding?.parameterExpressionSHA256??G.source?.parameterExpressionSHA256,
  graphNamespace:'live-target-G',originalGraphNodeCount:G.nodes.length,rowCount:rows.length,rows,
  definitionCounts:Object.fromEntries(Object.entries(seenDefs).map(([k,v])=>[k,v.size])),nodeCount:ids.length,nodeRecordsSHA256:bodyHash.digest('hex'),
  fixedRegistry:fixed,sourcePrefix117100SHA256,
  scope:'Exact typed reachable nodes and referenced source registrations; no private seal or equality to archived C7 is claimed.'};
 async function* stream(){yield JSON.stringify(header)+'\n';for(const id of ids)yield JSON.stringify({kind:'node',id,node:G.nodes[id]})+'\n';
  for(const [kind,values] of Object.entries(seenDefs))for(const id of [...values].sort((a,b)=>a-b))yield JSON.stringify({kind:'definition',type:kind,id,definition:defArrays[kind][id]})+'\n';
  yield JSON.stringify({kind:'trailer',nodeCount:ids.length,definitionCounts:header.definitionCounts})+'\n';}
 await pipeline(Readable.from(stream()),createGzip({level:6}),createWriteStream(outputPath));
 return {schema:header.schema,sourceProfile:header.sourceProfile,rowCount:rows.length,nodeCount:ids.length,definitionCounts:header.definitionCounts,nodeRecordsSHA256:header.nodeRecordsSHA256,outputPath};
}
