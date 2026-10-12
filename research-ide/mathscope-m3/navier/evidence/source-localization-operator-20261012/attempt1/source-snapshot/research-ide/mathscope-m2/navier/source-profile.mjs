import {PINNED_N3} from './source-profile-data.mjs';

export const SOURCE_PROFILE_ID='same-profile-2026-10-10.3';
export function getPinnedSourceProfile(){return structuredClone(PINNED_N3);}
export function assertSourceProfile(id=SOURCE_PROFILE_ID){if(id!==SOURCE_PROFILE_ID)throw Object.assign(Error('Only the exact accepted N3 profile is installed on this source path.'),{code:'UNSUPPORTED'});return getPinnedSourceProfile();}
export function sourceExponentContract(){
  return {profileId:SOURCE_PROFILE_ID,parameterExpressionSHA256:PINNED_N3.parameterExpressionSHA256,hExact:structuredClone(PINNED_N3.parametersExactExpressions.h),hExpression:'exp(-8002*(exp(1048576)+10))',positive:true,upperBoundExact:'2^-4096',binary64Enclosure:[0,2**-1000],zeroIsEnclosureEndpointOnly:true,proof:['T=exp(1048576)+10>1','h=exp(-8002*T)<exp(-8002)','e>2 implies exp(-8002)<2^-8002<2^-4096<2^-1000'],A:'1/2+h',D:'1/2-h',notNumericallyReplaced:true,source:PINNED_N3.inputs.assembly};
}
export function validateParameterGraph(){
  const p=PINNED_N3.parametersExactExpressions,seen=new Set(),active=new Set(),order=[];
  const visitValue=v=>{if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(visitValue);return;}if(v.ref!==undefined)visit(v.ref);else Object.values(v).forEach(visitValue);};
  const visit=name=>{if(seen.has(name))return;if(!Object.hasOwn(p,name))throw Error('Missing N3 expression reference: '+name);if(active.has(name))throw Error('Cyclic N3 expression graph');active.add(name);visitValue(p[name]);active.delete(name);seen.add(name);order.push(name);};
  Object.keys(p).forEach(visit);
  if(JSON.stringify(p.h)!==JSON.stringify({exp:{product:[{integer:-8002},{ref:'T'}]}}))throw Error('The accepted exponent h was changed.');
  return {ok:true,parameters:order.length,topologicalOrder:order,largeIntegersPreserved:true,parameterExpressionSHA256:PINNED_N3.parameterExpressionSHA256,scope:'Original definition graph and source identity, not an evaluation of its enormous exponentials.'};
}
