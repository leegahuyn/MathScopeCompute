/** Fresh unchanged finite-jet majorant. Full scalar norm DAG stays in CI. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const opt={};for(let i=2;i<process.argv.length;i+=2){assert(process.argv[i].startsWith('--')&&process.argv[i+1]);opt[process.argv[i].slice(2)]=process.argv[i+1];}
const root=resolve(opt['kernel-root']),out=resolve(opt.out),sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(resolve(root,'SOURCE_EXPORT.json'),'utf8'));
const paths=['research-ide/mathscope-m2/navier/actual-leading-all-order-jets.mjs',
 'research-ide/mathscope-m2/navier/actual-leading-all-order-jets-arithmetic.mjs',
 'research-ide/mathscope-m2/navier/actual-residual-order-induction-kernels.mjs',
 'research-ide/mathscope-m2/navier/actual-continuation-exact-heat.mjs',
 'research-ide/mathscope-m2/navier/source-profile-data.mjs'];
const before=await Promise.all(paths.map(p=>readFile(resolve(root,p))));
const sourceRows=paths.map((path,i)=>{const pin=manifest.files.find(r=>r.path===path);assert(pin);assert.equal(sha(before[i]),pin.sha256);return{path,sha256:pin.sha256,bytes:before[i].length};});
const {actualLeadingAllOrderJets}=await import(pathToFileURL(resolve(root,paths[0])));
const j=actualLeadingAllOrderJets({radialOrder:10,etaOrder:24},{jetOrderBudget:128});
assert(j.pass&&j.checks.every(c=>c.pass));assert.equal(j.totalTaylorOrder,34);
assert.equal(j.derivativeConvention,'ordinary physical X and ordinary eta');
assert.equal(j.sourceFunctionIdentity.parameterExpressionSHA256,'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152');
assert(j.sourceFunctionIdentity.sameOriginalN&&j.sourceFunctionIdentity.actualB8AndI1RootBodiesPresent&&j.sourceFunctionIdentity.actualHeatI2RootBodyPresent);
if(opt.compact){const c=JSON.parse(await readFile(resolve(opt.compact),'utf8'));assert.equal(c.sourceHeaderSHA256,'f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1');assert.equal(j.sourceFunctionIdentity.U0Root,c.definitions['expression:3'].fullDefinition.body);}
assert(j.normProgram.nodes.length<=350000);assert(j.normProgram.ledger.length>100);
assert(j.primitive.derivativeOrder===42&&j.primitive.sourceDefinitionUnchanged);
for(let i=0;i<paths.length;i++)assert.deepEqual(await readFile(resolve(root,paths[i])),before[i]);
const result={schema:'MathScope.N6.ActualLeading10x24SourceLedger/1',executionRun:process.env.GITHUB_RUN_ID,
 sourceRows,sourceBytesUnchanged:true,sourceHeaderSHA256:'f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1',
 parameterExpressionSHA256:j.parameterExpressionSHA256,actualSourceFunctionIdentity:j.sourceFunctionIdentity,
 requestedRectangle:{radialOrder:10,etaOrder:24,totalTaylorOrder:34,primitiveDerivativeOrder:42},
 sameOriginalDerivativeConvention:j.derivativeConvention,bounds:j.bounds,physicalConversion:j.physicalConversion,
 actualScope:j.scope,originalChecks:j.checks,primitive:j.primitive,heatDerivativeProof:j.heatDerivativeProof,
 normProgram:j.normProgram,
 normProgramSHA256:sha(JSON.stringify(j.normProgram)),
 actualAnalyticMajorantPremisesComposedHere:false,originalBnormApplicationProvedHere:false,
 newOriginalGuardsDischarged:0,newOriginalJetsDischarged:0,newOriginalPDETermsDischarged:0};
await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(result)+'\n');
process.stdout.write(JSON.stringify({schema:result.schema,normNodes:j.normProgram.nodes.length,ledgerRows:j.normProgram.ledger.length,sourceLedgerBound:true,analyticApplication:false,newDischarged:0})+'\n');
