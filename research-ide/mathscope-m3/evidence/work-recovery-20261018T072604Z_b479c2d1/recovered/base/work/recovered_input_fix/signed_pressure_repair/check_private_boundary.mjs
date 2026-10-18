import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {attachGlobalSignedFullPressure} from './overlay/research-ide/mathscope-m3/navier/source-global-signed-full-pressure.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const source=process.argv[2]?resolve(process.argv[2]):resolve(here,'fixtures/initialized-angular-construction.json');
const frozenActualSource=JSON.parse(readFileSync(source,'utf8'));
let rejected=false,message='',code='';
try{attachGlobalSignedFullPressure(frozenActualSource,frozenActualSource);}
catch(error){rejected=error.code==='INVALID_SOURCE_CONSTRUCTION';message=error.message;code=error.code;}
if(!rejected)throw new Error('A serialized packet was incorrectly accepted as a live privately sealed source.');
const result={schema:'MathScope.SignedPressureRepairBoundaryCheck/1',module_import_passed:true,
  actual_source_packet:source,serialized_packet_rejected:rejected,error_code:code,error_message:message,
  actual_signed_pressure_construction_executed:false,actual_residual_equality_checked:false,
  original_N602_completed:false,
  scope:'Module loading and rejection of a real serialized initialized packet only; no source constructor or mathematical residual comparison was run.'};
writeFileSync(resolve(here,'BOUNDARY_CHECK.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
