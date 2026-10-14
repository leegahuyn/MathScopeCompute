/** Fixed-source M2-to-N6 Picard bridge audit.
 * Does not infer source-wide analytic norms from an order-one theorem.
 */
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {resolve,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {sourcePicardSystem} from '../../mathscope-m2/navier/source-background.mjs';
import {buildActualPicardAcceptance,verifyActualPicardAcceptance} from '../../mathscope-m2/navier/actual-picard-acceptance.mjs';

const path=process.argv[2];
if(!path)throw Error('Usage: node run_source.mjs <new-output.json>');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const HERE=dirname(fileURLToPath(import.meta.url));
const M2ROOT=resolve(HERE,'../../mathscope-m2');
const RESEARCHIDE=resolve(HERE,'../..');
function checkSourceItem(item){
  const root=item.path.startsWith('navier/')?M2ROOT:
             item.path.startsWith('mathscope-m1/')?RESEARCHIDE:null;
  if(!root)throw Error('Unknown pinned source root: '+item.path);
  const target=resolve(root,item.path);
  if(!target.startsWith(root+sep))throw Error('Source path escape');
  const raw=readFileSync(target);
  if(raw.length!==item.bytes||sha(raw)!==item.sha256)
    throw Error('Actual pinned source bytes mismatch: '+item.path);
  return {path:item.path,bytes:item.bytes,sha256:item.sha256};
}
const system=Array.from({length:8},(_,i)=>sourcePicardSystem(i+1));
const acceptance=buildActualPicardAcceptance({order:1,bits:128});
const verification=verifyActualPicardAcceptance(acceptance);
if(!verification.pass)throw Error('Retained M2 actual n=1 certificate failed its own verifier');
const pinned=[...acceptance.sourceBindings,...Object.values(acceptance.majorant.sourceInputs)]
  .map(checkSourceItem);
const a1=system[0].A1;
for(let n=1;n<8;n++){
  if(JSON.stringify(a1)!==JSON.stringify(system[n].A1))throw Error('Picard derivative block changed with n='+String(n+1));
}
const data={
  schema:'MathScope.N6PicardM2NativeBridgeAudit/1',
  verifiedM2FixedOrder:1,
  sourceRequestedOrders:[1,2,3,4,5,6,7,8],
  declaredM2Criterion:acceptance.criterion.id,
  m2SourceParameterHash:acceptance.parameterExpressionSHA256,
  paperSHA256:acceptance.sourcePaperSHA256,
  exactM2OriginalSystem:system[0],
  m2NormalizedSystem:acceptance.normalizedSystem,
  majorantConstants:acceptance.majorant.derivedConstants,
  nativeN6OriginalParentSHA256:'7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f',
  originalM3SourceNodes:{picardXi:25516,picardEta:2,natural4483:4483,quadratic5029:5029},
  allSourceOrdersShareSymbolicEtaDerivativeBlock:true,
  allHigherOrdersActuallySolved:false,
  allOriginalSourceEtaComplexInverseDomainsVerified:false,
  existingActualOrderOneProofIsNotGlobalNSCertificate:true,
  requiredBridgeClaims:[
    {id:'PB-COMPLEX-STRIP',status:'OPEN',premise:'Original native A0,A1,f bounded holomorphic on one common S_rho for each actual finite n and all original active arguments'},
    {id:'PB-NATIVE-IDENTITY',status:'OPEN',premise:'Every literal original native coefficient/integral/inverse branch equals the source-bound norm-input function in M2'},
    {id:'PB-PREVIOUS-ORDERS',status:'OPEN',premise:'For each n>=2, actual finalized lower-order coefficients/moments/cutoffs imply uniform forcing norms on the same radial interval'},
    {id:'PB-ALL-BANDS',status:'OPEN',premise:'Actual N6 bands/labels/copies and Cartesian evaluation remain inside certified source domains with W/M/S uniform bounds'}
  ],
  verifiedFiniteM2Checks:verification.checks.filter(c=>c.pass).length,
  actualPinnedSourceFilesVerified:pinned,
  passed:true
};
data.certificateSHA256=sha(JSON.stringify({...data,certificateSHA256:undefined}));
const out=resolve(path);
mkdirSync(dirname(out),{recursive:true});
writeFileSync(out,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({schema:data.schema,sourceOrdersChecked:system.length,verifiedFixedOrder:1,openBridgeClaims:data.requiredBridgeClaims.length,sourceHash:data.m2SourceParameterHash,pinnedFilesVerified:pinned.length,certificateSHA256:data.certificateSHA256}));
