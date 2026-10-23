/** Exact source definition/application lineage of the genuine post-Signed
 * SourceCoupledExpressions Fourier inverse. A formal AST is NOT an analytic
 * all-order or numerical field certificate. No private Signed seal is issued. */
const fail=message=>{throw Object.assign(new Error(message),{code:'ORIGINAL_COUPLED_INVERSE_PROVENANCE_FAILED'});};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const root=(G,id)=>Number.isSafeInteger(id)&&id>=0&&Boolean(G.nodes?.[id]);
export function checkOriginalCoupledTemporalInverse(G,{system,exact,body,Y,parameters,finite}={}){
  if(!Array.isArray(G?.nodes)||
     typeof system!=='string'||!/^coupled-inverse:(0|[1-9]\d*)$/.test(system)||
     !root(G,exact)||!root(G,body)||!Array.isArray(Y)||Y.length!==2||Y[0]===Y[1]||
     !Y.every(y=>root(G,y)&&G.nodes[y].op==='coordinate')||
     !Array.isArray(parameters)||parameters.length!==6||new Set(parameters).size!==6||
     !parameters.every(p=>root(G,p))||!Y.every(y=>parameters.includes(y)))
    fail('Unbound source Fourier definition or wrong original two-torus parameters.');
  const node=G.nodes[exact];
  if(node.op!=='m3_coupled_inverse_partial'||
     node.args?.[0]!==system||!equal(node.args?.[1],parameters)||
     !equal(node.args?.[2],[0,0,0,0,0]))
    fail('New Signed inverse must use its own genuine coupled-inverse definition.');
  let def;
  try{def=G.auxiliaryInverseSystem?.(system);}
  catch(e){fail('Source inverse definition inaccessible: '+(e?.code??e?.message??'unknown'));}
  const directions=[parameters[0],parameters[1],parameters[2],...Y];
  if(def?.id!==system||def.body!==body||!equal(def.Y,Y)||
     !equal(def.parameters,parameters)||!equal(def.directions,directions)||
     def.finiteSumDeclaredEqualToLimit!==false||
     def.operator!=='(sqrt(2)-1)*partial_y0+partial_y1')
    fail('Original Fourier inverse body, operator or parameter lineage changed.');
  if(!finite||finite.fullLatticeModeCount!==8||finite.omittedTailRetained!==true||
     finite.finiteSumClaimedWholeInverse!==false||!Array.isArray(finite.tails)||
     finite.tails.length!==2||finite.tails.some(t=>!t.tailTendsToZero||t.omittedModesSetToZero))
    fail('Finite original Fourier comparison cannot stand in for an infinite inverse.');
  return {pass:true,method:'ORIGINAL_COUPLED_INVERSE_SOURCE_PROVENANCE',
    actualCoupledInverseNode:exact,originalSourceBody:body,finiteFourierModes:8,
    tailsRetained:true,numericalCoefficientIntervalsAvailable:false,
    allOrderTailProofCertified:false};
}
