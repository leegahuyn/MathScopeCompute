import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
assert.equal(process.argv.length,8,'usage: inspect_hosted.mjs <operating-readback.html> <worker.js> <screen.json> <manifest.json> <patches.json> <out.json>');
const [operatingPath,workerPath,screenPath,manifestPath,patchesPath,out]=process.argv.slice(2),H=b=>crypto.createHash('sha256').update(b).digest('hex');
const op=fs.readFileSync(operatingPath),worker=fs.readFileSync(workerPath),screenBytes=fs.readFileSync(screenPath);
assert.equal(H(op),'a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48');
assert.equal(H(worker),'eacd0e21b85b79f1892182963c77e50248a77e11ac07c1d1f0bc789b57587705');
const w=worker.toString('utf8'), encoded=w.match(/^const encoded = "([A-Za-z0-9+/=]+)";/)?.[1];assert(encoded);
const candidate=zlib.gunzipSync(Buffer.from(encoded,'base64'));
assert.equal(H(candidate),'0504482900dbeac2faf992be9a923bc51ab1de6bcec0b82ac058085444669735');
const screen=JSON.parse(screenBytes);assert.equal(screen.http.candidateSHA256,H(candidate));
assert.equal(H(screenBytes),'b9e8f292e0b606a552a6c6d7317c9efda22dbb187fc3339516061a0a4f2abb67');
const manifestBytes=fs.readFileSync(manifestPath),patchBytes=fs.readFileSync(patchesPath),manifest=JSON.parse(manifestBytes),patches=JSON.parse(patchBytes);
assert.equal(H(manifestBytes),'4ff2f3eb25a35bd48dc4ea8e9822619ce2511e714d24c06c089b6d6bec74baeb');
assert.equal(H(patchBytes),'04662c00f3e1c93eedbce8782231433b5a9f7bb60e1bda630475202844e14fe3');
assert.equal(manifest.baseSHA256,'e6ebde6250a861296554f26305cb40200b0a70e822acb3f588e9dca423d6e784');assert.equal(manifest.candidateSHA256,H(candidate));assert.equal(patches.length,4);
const count=(data,search)=>{let n=0,pos=0;while((pos=data.indexOf(search,pos))!==-1){n++;pos+=search.length;}return n;};
const patchAnchors=patches.map((p,i)=>{assert.equal(p.operation,'replace');const before=Buffer.from(p.find),after=Buffer.from(p.replace);assert(before.length&&after.length);
 const unpatched=(data)=>count(Buffer.from(data.toString('utf8').split(p.replace).join('')),before);
 return {patch:i+1,beforeBytes:before.length,afterBytes:after.length,operatingBeforeOccurrences:count(op,before),operatingAfterOccurrences:count(op,after),operatingBeforeNotInsideExactAfter:unpatched(op),candidateBeforeOccurrences:count(candidate,before),candidateAfterOccurrences:count(candidate,after),candidateBeforeNotInsideExactAfter:unpatched(candidate)};});
assert.deepEqual(patchAnchors.map(x=>[x.operatingAfterOccurrences,x.operatingBeforeNotInsideExactAfter]),[[1,0],[1,0],[0,1],[0,1]]);
assert(patchAnchors.every(x=>x.candidateAfterOccurrences===1&&x.candidateBeforeNotInsideExactAfter===0));
const csp=w.match(/'Content-Security-Policy': "([^"]+)"/)?.[1];assert(csp);
const routes=w.match(/const htmlRoutes = new Set\((\[[^\]]+\])\)/);assert(routes);
const assets=buffer=>{
 const html=buffer.toString('utf8'), rows=[];
 for(const m of html.matchAll(/<(script|link|img|iframe)\b[^>]{0,1500}?(?:src|href)\s*=\s*["']([^"']+)["']/gi)) rows.push({element:m[1].toLowerCase(),url:m[2]});
 const unique=[...new Map(rows.map(x=>[x.element+'|'+x.url,x])).values()];return {count:rows.length,unique};
};
const result={schema:'MathScope.R108.StaticHostedPrerequisites/1',status:'PASS_PINNED_STATIC_DEPENDENCY_INVENTORY',
 input:{operatingSha256:H(op),operatingBytes:op.length,workerSha256:H(worker),candidateSha256:H(candidate),candidateBytes:candidate.length,screenSha256:H(screenBytes),screenObservedUtc:screen.observedUtc,manifestSha256:H(manifestBytes),patchesSha256:H(patchBytes)},
 patch:{requiredBaselineSha256:manifest.baseSHA256,baselineMatchesArchivedOperating:H(op)===manifest.baseSHA256,anchors:patchAnchors},
 worker:{csp,htmlRoutes:JSON.parse(routes[1]),otherPathsStatus:404,nonGetOrHeadStatus:405},operatingHtml:assets(op),candidateHtml:assets(candidate),
 scope:'Historical stored responses and exact committed isolated Worker. Static HTML references and literal CSP are not a live deployment check, complete browser network trace, or proof of backend availability. No production change, private authentication, or publication.'};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
