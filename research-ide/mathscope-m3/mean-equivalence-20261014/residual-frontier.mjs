/** Exact multi-label inventory. Labels describe source syntax/reachability,
 * never inferred cancellation, cover disjointness or source PDE truth.
 */
import {hashJSON,requireResidual} from './residual-source.mjs';
const definitionHashes=new WeakMap();
const definitionHash=value=>{if(!definitionHashes.has(value))definitionHashes.set(value,hashJSON(value));return definitionHashes.get(value);};
export function sourceSemanticChildren(n){const a=n.args;
  if(['rational','coordinate','source_parameter'].includes(n.op))return [];
  if(['add','multiply','maximum','smooth_piecewise'].includes(n.op))return a;
  if(['inverse','sqrt_positive','exp','log_positive','sine','cosine','ceiling','integer_power','source_step_derivative'].includes(n.op))return [a[0]];
  if(n.op==='definite_integral')return [a[0],a[1],a[2],a[3]];
  if(['actual_expression_partial','m3_aux_expression_partial','m3_aux_indexed_partial','m3_aux_inverse_partial','m3_global_indexed_partial','m3_coupled_expression_partial','m3_coupled_indexed_partial','m3_coupled_inverse_partial','m3_forced_expression_partial'].includes(n.op))return a[1];
  if(n.op==='actual_monotone_root')return a.slice(1);
  if(n.op==='actual_quadratic_root')return [a[2]];
  if(n.op==='actual_natural_series')return a.slice(1,3);
  if(['actual_background_picard','actual_background_even_profile'].includes(n.op))return a.slice(2,4);
  if(['actual_covariance_volterra','m3_global_pulse_jet'].includes(n.op))return [a[2],...a[3]];
  if(n.op==='m3_forced_pulse_partial')return [a[3],...a[4]];
  return null;
}
export function definitionForNode(n,definitions){let kind,index;const a=n.args;
  const grouped={m3_coupled_expression_partial:[0,'coupled-expression:'],m3_coupled_indexed_partial:[1,'coupled-field:'],m3_coupled_inverse_partial:[2,'coupled-inverse:'],m3_forced_expression_partial:[4,'forced-expression:']};
  if(grouped[n.op]){const [group,prefix]=grouped[n.op];requireResidual(typeof a[0]==='string'&&a[0].startsWith(prefix),'An actual coupled registry identifier changed.');index=Number(a[0].slice(prefix.length));kind='definitions:'+group;const value=definitions.definitions?.[group]?.[index];requireResidual(Number.isSafeInteger(index)&&value?.id===a[0],'A required coupled source definition is absent:'+a[0]);return {key:kind+':'+index,kind,index,name:value.name??null,definition:value,definitionSHA256:definitionHash(value)};}
  if(n.op==='actual_expression_partial'){kind='expression';index=a[0];}
  else if(n.op==='m3_aux_expression_partial'){kind='expressionDefinitions';index=-1-a[0];}
  else if(n.op==='m3_aux_indexed_partial'){kind='fieldDefinitions';index=a[0];}
  else if(n.op==='m3_aux_inverse_partial'){kind='inverseDefinitions';index=a[0];}
  else if(n.op==='m3_global_indexed_partial'){kind='m3GlobalFields';index=a[0];}
  else if(n.op==='actual_monotone_root'){kind='monotone';index=a[0];}
  else if(n.op==='actual_quadratic_root'){kind='quadratic';index=a[0];}
  else if(['actual_background_picard','actual_background_even_profile'].includes(n.op)){kind='picard';index=a[0];}
  else if(n.op==='actual_natural_series'){kind='fixed';index=null;}
  else if(n.op==='m3_forced_pulse_partial'){kind='definitions:3';index=a[0];}
  else if(n.op==='m3_global_pulse_jet'){kind='m3GlobalPulses';index=a[0];}
  else if(n.op==='actual_covariance_volterra'){kind='m3GlobalPulses';const matches=(definitions.m3GlobalPulses??[]).map((value,index)=>({value,index})).filter(row=>row.value.covariance===a[0]);requireResidual(matches.length===1,'An actual covariance source definition is absent or ambiguous.');index=matches[0].index;}
  else return null;
  const value=index===null?definitions[kind]:kind==='definitions:3'?definitions.definitions?.[3]?.[index]:definitions[kind]?.[index];requireResidual(value,'A required actual source registry is absent:'+kind+':'+index);
  return {key:kind+':'+index,kind,index,name:value.name??(kind==='fixed'?'Actual B.14/B.15 natural recurrence':null),definition:value,definitionSHA256:definitionHash(value)};
}
function lexicalLabels(id,n,geometry,definition){const labels=[];
  if(n.op==='coordinate'){labels.push('COORDINATE_ATOM');if(id===geometry.R)labels.push('RADIAL_COORDINATE');if(id===geometry.Z)labels.push('AXIAL_COORDINATE');if(id===geometry.T)labels.push('TIME_COORDINATE');if(geometry.Y.includes(id))labels.push('TWO_TORUS_COORDINATE');if(id===geometry.theta)labels.push('ANGULAR_COORDINATE');}
  if(n.op==='source_parameter')labels.push('EXACT_SOURCE_PARAMETER');
  if(id===geometry.epsilon)labels.push('VISCOSITY_AND_AXIAL_SCALE_EPSILON');
  if(id===geometry.ci)labels.push('FAST_TIME_SCALE');if(id===geometry.radialFast)labels.push('FAST_RADIAL_SCALE');
  if(['sine','cosine'].includes(n.op))labels.push('TRIGONOMETRIC_ATOM');
  if(n.op==='exp')labels.push('EXPONENTIAL_ATOM');if(n.op==='log_positive')labels.push('POSITIVE_LOG_DOMAIN');if(n.op==='sqrt_positive')labels.push('POSITIVE_SQUARE_ROOT_DOMAIN');
  if(n.op==='definite_integral')labels.push('INTEGRAL_EXISTENCE_AND_PARAMETER_JET');
  if(n.op==='smooth_piecewise')labels.push('PIECEWISE_SUPPORT_OR_JOIN');if(['maximum','ceiling'].includes(n.op))labels.push('DISCRETE_OR_MAXIMUM_SELECTOR');
  if(n.op==='actual_natural_series')labels.push('NATURAL_INFINITE_LIMIT');if(n.op==='actual_quadratic_root')labels.push('IMPLICIT_QUADRATIC_BRANCH');if(n.op==='actual_monotone_root')labels.push('IMPLICIT_MONOTONE_BRANCH');
  if(['actual_background_picard','actual_background_even_profile'].includes(n.op))labels.push('BACKGROUND_PICARD_LIMIT');
  if(['actual_covariance_volterra','m3_global_pulse_jet','m3_forced_pulse_partial'].includes(n.op))labels.push('VOLTERRA_PULSE_LIMIT');
  if(n.op.includes('indexed'))labels.push('INDEXED_COVER_OPERATOR');if(['m3_aux_inverse_partial','m3_coupled_inverse_partial'].includes(n.op))labels.push('FOURIER_DIOPHANTINE_INVERSE');
  if(definition){labels.push('REGISTRY_DEFINED_SOURCE_OPERATOR');const name=definition.name??'';
    if(/Angular|Wave|Primary/.test(name))labels.push('REGISTRY_NAME_CONTAINS_ANGULAR_WAVE_OR_PRIMARY');
    if(/Pressure/.test(name))labels.push('REGISTRY_NAME_CONTAINS_PRESSURE');
    if(/Mean/.test(name))labels.push('REGISTRY_NAME_CONTAINS_MEAN');
    if(/Residual/.test(name))labels.push('REGISTRY_NAME_CONTAINS_RESIDUAL');
  }
  if(!labels.length)labels.push('OTHER_EXACT_SOURCE_ATOM');return labels;
}
const ordinary=new Set(['rational','coordinate','source_parameter','add','multiply','inverse','integer_power','exp','log_positive','sqrt_positive','sine','cosine','source_step_derivative','definite_integral','smooth_piecewise','maximum','ceiling']);
export function createResidualFrontier({node,definitions,geometry,nodeCount}){
  const bindings=new Map(),opaque=new Map(),cache=new Map(),sourceRows=new Map();
  const witness=id=>{requireResidual(Number.isSafeInteger(id)&&id>=0&&id<nodeCount,'A literal registry index/order was used as a scalar node.');if(!sourceRows.has(id)){const n=node(id);sourceRows.set(id,{sourceNode:id,node:structuredClone(n),nodeSHA256:hashJSON(n)});}return sourceRows.get(id);};
  const bind=n=>{const b=definitionForNode(n,definitions);if(b&&!bindings.has(b.key))bindings.set(b.key,b);return b;};
  function extraRoots(b){if(!b)return [];const d=b.definition;
    if(b.kind==='fixed')return Object.values(d.core).filter(Number.isSafeInteger);
    if(b.kind==='quadratic')return [...d.rhs,...d.linear.flat(),...d.quadraticDiagonal.flat(),d.scale,...(d.preconditioner??[]).flat(),...[d.rootRadius,d.lipschitzUpper].filter(Number.isSafeInteger)];
    if(b.kind==='monotone')return ['body','left','right','derivativeLower','derivativeUpper'].map(k=>d[k]);
    if(b.kind==='picard')return [...d.A0.flat(),...d.A1.flat(),...d.forcing,...d.zeroAxisDatum,...d.radialDomain,d.xi,d.eta,...Object.values(d.sourceLeading??{}),...['sourceBound','sourceStrip','solutionStrip','loss','Kcondition','Kprecision','K','error','target'].map(key=>d.tail?.[key]),...['commonCollar','naturalExtensionToY5'].map(key=>d.solutionNorm?.[key])].filter(Number.isSafeInteger);
    if(b.kind==='definitions:3'||b.kind==='m3GlobalPulses'){const original=d.originalDefinition?JSON.parse(d.originalDefinition):{};return [...(d.matrix??[]).flat(),...(d.forcing??[]).flatMap(z=>[z.real,z.imaginary]),...(d.initial??[]).flatMap(z=>typeof z==='number'?[z]:[z.real,z.imaginary]),...(d.parameters??[]),d.variable,d.left,d.length,original.normUpper,...(original.matrix??[]).flat(),...(original.parameters??[])].filter(Number.isSafeInteger);}
    if(d.body!==undefined)return [d.body,...(d.parameters??[])];
    const roots=[...(d.parameters??[])];
    for(const r of d.rows??[]){roots.push(...(r.values??[]),...[r.coefficient,r.localBody].filter(Number.isSafeInteger),...(r.localParameters??[]),...(r.guards??[]).flat(),...(r.derivativeScales??[]),...(r.derivativeMaps??[]).flat().map(x=>x.coefficient));
      const op=typeof r.localSystem==='string'?r.localSystem.startsWith('coupled-expression:')?'m3_coupled_expression_partial':'m3_forced_expression_partial':r.localSystem<0?'m3_aux_expression_partial':'actual_expression_partial';
      if(r.localSystem!==undefined){const entry=definitionForNode({op,args:[r.localSystem]},definitions);bindings.set(entry.key,entry);roots.push(entry.definition.body,...(entry.definition.parameters??[]));}
    }return roots.filter(Number.isSafeInteger);
  }
  function atom(id){if(cache.has(id))return cache.get(id);const n=node(id),b=bind(n),seen=new Set(),frontier=new Set(),pending=[id],closureLabels=new Set();
    while(pending.length){const x=pending.pop();if(seen.has(x))continue;seen.add(x);const w=witness(x),m=w.node,def=bind(m),child=sourceSemanticChildren(m);
      lexicalLabels(x,m,geometry,def).forEach(label=>closureLabels.add(label));
      if(!ordinary.has(m.op)){frontier.add(x);opaque.set(x,{...w,definitionKey:def?.key??null,definitionSHA256:def?.definitionSHA256??null,allLiteralOperandsRetained:true,
        obligation: m.op.includes('indexed')?'Prove the complete finite cover, all local derivative maps, fixed labels, flat joins and nonlinear disjointness for these exact rows.':m.op==='m3_aux_inverse_partial'?'Prove the exact same Fourier limit, full source coefficients, Diophantine divisors and all requested mixed derivatives.':'Prove this exact source function/implicit/limit body, coordinate closure, existence and requested jets.',
        analyticObligationDischarged:false});}
      if(child===null)continue;pending.push(...child,...extraRoots(def));
    }
    const result={...witness(id),rootSyntaxLabels:lexicalLabels(id,n,geometry,b),labels:[...closureLabels].sort(),definitionKey:b?.key??null,definitionSHA256:b?.definitionSHA256??null,
      explicitDefiningClosureVisitedNodes:seen.size,opaqueFrontierSourceIDs:[...frontier].sort((a,b)=>a-b),frontierCompleteForReviewedOperandGrammar:true,actualSourceJetClassProved:false};cache.set(id,result);return result;
  }
  const classify=(monomial,coefficient)=>{const factors=monomial?monomial.split(',').map(piece=>{const [id,power]=piece.split(':').map(Number);return {sourceNode:id,power};}):[];
    const labels=new Set([coefficient.startsWith('-')?'NEGATIVE_EXACT_COEFFICIENT':'POSITIVE_EXACT_COEFFICIENT']);
    for(const f of factors){atom(f.sourceNode).labels.forEach(x=>labels.add(x));if(f.power>1)labels.add('REPEATED_ACTUAL_ATOM');}
    return {monomial,coefficient,factors,labels:[...labels].sort(),opaqueFrontierSourceIDs:[...new Set(factors.flatMap(f=>atom(f.sourceNode).opaqueFrontierSourceIDs))].sort((a,b)=>a-b)};
  };
  return {atom,classify,diagnostics:()=>({sourceWitnesses:[...sourceRows.values()],actualOpaqueFrontier:[...opaque.values()].sort((a,b)=>a.sourceNode-b.sourceNode),definitionBindings:[...bindings.values()],atomicRecords:[...cache.values()].sort((a,b)=>a.sourceNode-b.sourceNode),oldPassFlagsInsideDefinitionsUsedAsProof:false,classificationIsExactSyntaxAndReachability:true})};
}
