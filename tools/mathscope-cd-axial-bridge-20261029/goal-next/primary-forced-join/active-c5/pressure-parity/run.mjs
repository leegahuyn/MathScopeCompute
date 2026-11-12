import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime,output]=process.argv.slice(2);if(!output)throw Error('Usage: run.mjs RUNTIME OUTPUT');
const load=x=>import(pathToFileURL(path.resolve(runtime,'research-ide',x)).href);
const [F,B,R,C,P,contracts]=await Promise.all([
 load('mathscope-m2/navier/actual-common-admissible-family.mjs'),
 load('mathscope-m3/navier/source-global-band.mjs'),
 load('mathscope-m3/navier/source-global-representative.mjs'),
 load('mathscope-m3/navier/source-global-current.mjs'),
 load('mathscope-m3/navier/source-global-pressure.mjs'),load('mathscope-m0/contracts.mjs')]);
const stamp=Date.now(),context={onProgress:r=>{if(r.stage?.includes('sealed'))console.error(r.stage,r.nodeCount,Date.now()-stamp);}};
const family=F.prepareActualCommonAdmissibleFamily({throughOrder:2,derivativeOrder:2,maxNodes:4000000},context);
assert.equal(F.assertActualCommonAdmissibleFamily(family),true);
const band=B.attachGlobalSourceBand(family,{coefficientOrder:1,maxNodes:4000000},context);
assert.equal(B.assertGlobalSourceBand(band),true);
const representative=R.attachGlobalFixedRepresentative(band,context);
assert.equal(R.assertGlobalFixedRepresentative(representative),true);
const current=C.attachGlobalCurrentState(representative,context);
assert.equal(C.assertGlobalCurrentState(current),true);
console.error('CURRENT',current.G.nodes.length,Date.now()-stamp);
const pressure=P.attachGlobalCurrentPressure(current,context);
assert.equal(P.assertGlobalCurrentPressure(pressure),true);
const G=pressure.G, hash=crypto.createHash('sha256');
for(const n of G.nodes)hash.update(JSON.stringify(n)+'\n');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const cert=await P.globalCurrentPressureCertificate(pressure);
const result={status:'PASS_GENUINE_N1_C2_PRESSURE',nodes:G.nodes.length,
 rawNodesSHA256:hash.digest('hex'),definitionsSHA256:sha(contracts.canonicalStringify(G.captureFunctionDefinitions())),
 certificateSHA256:sha(contracts.canonicalStringify(cert)),graph:cert.graph,
 checks:pressure.checks.map(({id,pass})=>({id,pass})),scope:pressure.scope};
const saved=G.nodes[0];
G.nodes[0]={...saved,op:'different_invalid_operation'};
assert.throws(()=>P.assertGlobalCurrentPressure(pressure));
G.nodes[0]=saved;
assert.equal(P.assertGlobalCurrentPressure(pressure),true);
G.nodes[0]={...saved};
assert.equal(P.assertGlobalCurrentPressure(pressure),true);
G.nodes[0]=saved;
assert.equal(P.assertGlobalCurrentPressure(pressure),true);
const oldPressure=pressure.pressure.value;
pressure.pressure.value=-1;
assert.throws(()=>P.assertGlobalCurrentPressure(pressure));
pressure.pressure.value=oldPressure;
assert.equal(P.assertGlobalCurrentPressure(pressure),true);
result.mutationAndEquivalentReplacementControls=true;
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.error('PRESSURE',G.nodes.length,Date.now()-stamp);
