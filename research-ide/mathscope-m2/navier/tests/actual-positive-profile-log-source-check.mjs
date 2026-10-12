// This reads and evaluates the literal pinned parameter graph only.
// It does not invoke a background or pulse source constructor.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {encloseActualPositiveProfileLogs,actualPositiveProfileLogCertificate,assertActualPositiveProfileLogs,numericalEndpointIsClosed} from '../actual-positive-profile-log-enclosure.mjs';
import {canonicalStringify} from '../../../mathscope-m0/contracts.mjs';

const root=fileURLToPath(new URL('../../../../',import.meta.url)),relative=f=>path.relative(root,f).split(path.sep).join('/'),hash=b=>createHash('sha256').update(b).digest('hex'),
  out=process.argv[2]?path.resolve(process.argv[2]):fileURLToPath(new URL('../research/evidence/positive-profile-log-20261011/parameter-source-attempt1.json',import.meta.url));
assert.equal(fs.existsSync(out),false,'A numerical source record cannot be overwritten.');fs.mkdirSync(path.dirname(out),{recursive:true});
function manifest(){
  const files=new Map(),stack=[fileURLToPath(import.meta.url)];
  while(stack.length){const f=stack.pop();if(files.has(f))continue;const body=fs.readFileSync(f,'utf8');files.set(f,hash(body));
    for(const m of body.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g))if(m[1].startsWith('.'))stack.push(path.resolve(path.dirname(f),m[1]));}
  const rows=Object.fromEntries([...files].map(([f,h])=>[relative(f),h]).sort(([a],[b])=>a.localeCompare(b)));
  return {files:rows,fileCount:files.size,sha256:hash(canonicalStringify(rows))};
}
const before=manifest(),started=performance.now(),request={precisionBits:192,logCoordinateTolerance:'1/1000000000000'},p=await encloseActualPositiveProfileLogs(request);
assert.equal(assertActualPositiveProfileLogs(p),true);assert.equal(p.sourceBinding.checks.length,24);assert.ok(p.sourceBinding.checks.every(x=>x.pass));
assert.equal(p.rows.length,15);assert.ok(p.rows.every(x=>x.toleranceMet&&numericalEndpointIsClosed(x.interval.lower)&&numericalEndpointIsClosed(x.interval.upper)));
assert.deepEqual(manifest(),before);const certificate=actualPositiveProfileLogCertificate(p);
const result={schema:'MathScope.ObservedPositiveProfileLogNumericalSource/1',generatedAt:new Date().toISOString(),
  sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),mode:'DIRECT_PINNED_PARAMETER_NUMERICAL_EVALUATION',
  command:[process.execPath,...process.execArgv,...process.argv.slice(1)],request,sourceManifest:before,literalImportsUnchangedAfterRun:true,
  certificate,sourceDefinitionChecks:24,numericalRows:15,elapsedMs:performance.now()-started,peakRSSBytes:process.resourceUsage().maxRSS*1024,
  pulseOrBackgroundSourceConstructorExecuted:false,originalValueRelativeToleranceClaimed:false,pass:true,exitCode:0};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({pass:true,sourceDefinitionChecks:24,numericalRows:15,output:relative(out),sha256:hash(fs.readFileSync(out)),elapsedMs:result.elapsedMs,peakRSSBytes:result.peakRSSBytes}));
