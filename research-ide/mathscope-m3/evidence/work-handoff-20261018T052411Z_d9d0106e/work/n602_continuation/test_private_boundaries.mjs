import assert from 'node:assert/strict';
import fs from 'node:fs';
import {currentFromForced,assertFiniteCurrent,attachPostForcedSigned,attachPostSignedTemporal,attachPostTemporalFreshFive}
  from './source/research-ide/mathscope-m3/navier/source-finite-cycle-continuation.mjs';
const fake={schema:'MathScope.N6.GlobalActualForcedCurrent/1',stage:'post-forced',
  privateSealAccepted:true,actualOriginalForcedAngularSubstepConstructed:true,
  sourceBinding:{originalForcedPrivateSealRequired:true},scope:{actualCompleteUpdatedCurrentConstructed:true}};
const rows=[];
for(const [name,fn]of Object.entries({currentFromForced,assertFiniteCurrent,attachPostForcedSigned,attachPostSignedTemporal,attachPostTemporalFreshFive})){
  for(const [kind,value]of [['empty',{}],['serialized-authority-flags',JSON.parse(JSON.stringify(fake))]]){
    assert.throws(()=>fn(value),error=>error.code==='INVALID_SOURCE_CONSTRUCTION');
    rows.push({name,kind,rejected:true});
  }
}
const result={schema:'MathScope.N602.NewPrivateBoundaryRegression/1',checks:rows,passed:rows.length,
  actualPositiveConstructionExecuted:false,genericOrSerializedFlagsGrantAuthority:false};
fs.writeFileSync(new URL('PRIVATE_BOUNDARY_RESULT.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:rows.length,scope:'new factory private boundaries only'}));
