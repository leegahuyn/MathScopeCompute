/** One read-only, privately authenticated full saved parent per Node process.
 * This is source-byte identity, not the original producer's private math seal.
 */
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyExactStageSnapshot} from '../navier/tests/exact-stage-snapshot.mjs';
export const RESIDUAL_PINS=Object.freeze({index:'ba251f2f3401d2d81467a8ac3c5ceb0da7c6ddc3899aab6d9d580755ff0fd1f3',capture:'37960fe03a79493d12b6b9051b8a69a88ab71cc3505cc8cd62c6f2fc4bc0daeb',angular:'ba60de00a1e41f9c448da3aabcbf791bc4649b5fcfd99cff7a71865463db8b14',parentNodes:'7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f',verifier:'9ea6c0d39883fd0f584606a51b372752b8e64a6f2fb10ab943bd96172922dccc',snapshotReader:'9d874a93890ee0d410e2f94c3dfdb8fb888105525fb3b7bb968333edd9362b4a'});
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../../..'),BASE='research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291/';
export const hashBytes=x=>createHash('sha256').update(x).digest('hex');
export const hashJSON=x=>hashBytes(JSON.stringify(x));
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_ACTUAL_RESIDUAL_SOURCE'});};
export const requireResidual=(ok,message)=>{if(!ok)fail(message);};
export function deepFreeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(deepFreeze);Object.freeze(value);}return value;}
function pathOf(path){const file=resolve(ROOT,path);requireResidual(file.startsWith(ROOT+sep),'A saved source path escaped the repository.');return file;}
async function pinned(path,pin,bytes){const raw=await readFile(pathOf(path));requireResidual(hashBytes(raw)===pin&&(bytes===undefined||raw.length===bytes),'Changed original source bytes: '+path);return raw;}
const jsonPinned=async(path,pin)=>JSON.parse(await pinned(path,pin));
async function captureFiles(capture){requireResidual(capture.files.length===155,'Keep all155 actual source dependencies.');for(const row of capture.files){await pinned(row.path,row.sha256,row.bytes);await pinned(BASE+'sources/'+row.path,row.sha256,row.bytes);}}
const seals=new WeakMap();let pending;
function registries(definitions){const out={};function visit(layer){for(const [key,value]of Object.entries(layer)){if(key==='base')visit(value);else if(typeof value==='string'){let decoded;try{decoded=JSON.parse(value);}catch{continue;}requireResidual(!Object.hasOwn(out,key),'Ambiguous actual registry:'+key);out[key]=deepFreeze(decoded);}}}visit(definitions);return deepFreeze(out);}
export async function openFullResidualSource(...replacement){
  requireResidual(replacement.length===0,'No caller source, field, root, flag or branch replacement is accepted.');
  if(!pending)pending=(async()=>{
    const startedAt=new Date().toISOString(),capture=await jsonPinned(BASE+'source-bytes-before.json',RESIDUAL_PINS.capture);await captureFiles(capture);
    await pinned('research-ide/mathscope-m3/navier/tests/exact-stage-snapshot.mjs',RESIDUAL_PINS.snapshotReader);
    await pinned('research-ide/mathscope-m3/navier/forced-rational-identity.mjs',RESIDUAL_PINS.verifier);
    const index=await jsonPinned(BASE+'checkpoint-index.json',RESIDUAL_PINS.index),angular=await jsonPinned(BASE+'initialized-angular-construction.json',RESIDUAL_PINS.angular),first=index.checkpoints[0];
    requireResidual(first.firstNode===0&&first.nodeCount===3892594&&first.nodesSHA256===RESIDUAL_PINS.parentNodes,'The complete original parent changed.');
    const full=angular.global;requireResidual(JSON.stringify(full.velocity)==='[3825006,3825007,3825008]'&&full.pressure===3825009&&JSON.stringify(full.direct.conservativeResidual)==='[3825257,3825259,3825261]'&&JSON.stringify(full.assembledResidual)==='[3825348,3825349,3825350]'&&full.oldFlatResidual.numericalZeroAssumed===false,'Retain the full actual Cartesian-equivalent field, pressure and nonzero original tails.');
    const nodes=[],nodeHash=createHash('sha256');let sourceBytes=0,header;
    const stream=await verifyExactStageSnapshot(pathOf(first.path),{onHeader:h=>{header=deepFreeze(h);},onNode:(id,n)=>{requireResidual(id===nodes.length,'Source graph row order changed.');const line=JSON.stringify([id,n])+'\n';nodeHash.update(line);sourceBytes+=Buffer.byteLength(line);nodes.push(deepFreeze(n));}});
    requireResidual(nodes.length===3892594&&nodeHash.digest('hex')===RESIDUAL_PINS.parentNodes&&stream.manifestSHA256===first.sha256,'The full original node stream failed identity verification.');await captureFiles(capture);
    const node=id=>{requireResidual(Number.isSafeInteger(id)&&id>=0&&id<nodes.length,'An original source operand is outside the complete source parent.');return nodes[id];};
    const metadata=deepFreeze({schema:'MathScope.N6.FullResidualSourceBytes/1',status:'SOURCE_VERIFIED',startedAt,finishedAt:new Date().toISOString(),sourceNodeCount:nodes.length,sourceNodeSHA256:RESIDUAL_PINS.parentNodes,sourceBytes,snapshotManifestSHA256:first.sha256,sourceCaptureSHA256:RESIDUAL_PINS.capture,sourceProducerBindings:capture.files,sourceProducerCount:155,fullStreamAndCompressedBytesVerified:true,producerBytesVerifiedBeforeAndAfter:true,angularCertificateSHA256:RESIDUAL_PINS.angular,operatorDefinitionsSHA256:hashJSON(header.definitions),paperSHA256:angular.source.paperSHA256,parameterExpressionSHA256:angular.source.parameterExpressionSHA256,oldPassBitsUsedAsMathProof:false,originalN601Complete:false,originalN602Complete:false});
    const capability=Object.freeze({schema:'MathScope.N6.FullResidualSourceCapability/1',source:metadata});
    seals.set(capability,Object.freeze({node,nodeCount:nodes.length,header,definitions:registries(header.definitions),full:deepFreeze(full),angular:deepFreeze(angular),metadata}));return capability;
  })().catch(error=>{pending=null;throw error;});return pending;
}
export function fullResidualProgram(capability){requireResidual(seals.has(capability)&&Object.isFrozen(capability),'Use this privately byte-bound full source capability.');return seals.get(capability);}
export function sourceWitness(capability,id){const p=fullResidualProgram(capability),node=p.node(id);return {sourceNode:id,node:structuredClone(node),nodeSHA256:hashJSON(node)};}
export function verifySourceWitnesses(capability,witnesses){const p=fullResidualProgram(capability);requireResidual(Array.isArray(witnesses),'Source witnesses must be an array.');for(const w of witnesses){const n=p.node(w.sourceNode);requireResidual(hashJSON(n)===w.nodeSHA256&&JSON.stringify(n)===JSON.stringify(w.node),'Changed actual source witness:'+w.sourceNode);}return true;}
