/** Exercise both ownership modes and the explicit node limit of the original exporter. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [navier,wrapper,scratch,result] = process.argv.slice(2);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const pathOf = name => join(scratch,name);
const definitionFile = 'original-source-functions.json';
const original = pathToFileURL(resolve(navier,'../post-signed-20261023/export_original_source_graph.mjs')).href;
const {exportOriginalSourceGraph} = await import(original);
const {exportCoupledSnapshot,ACTIVE_SOURCE_EXPORT_MAX_NODES} = await import(pathToFileURL(wrapper).href);
const nodes = [{op:'rational',args:['0','1']},{op:'rational',args:['1','1']},{op:'add',args:[0,1]}];
const raw = {nodes};
const groups = Array.from({length:5},()=>[]);
const defs = {base:{fixture:true},definitions:JSON.stringify(groups),counts:groups.map(g=>g.length)};
const coupled = {nodes,baseGraph:raw,captureFunctionDefinitions:()=>defs};
const common = {roots:[2],scope:'MATHEMATICAL_EXPORT_INTERFACE_FIXTURE',sourceCommit:'fixture',pr30Commit:'fixture'};
const legacy = await exportOriginalSourceGraph(coupled,{...common,dir:pathOf('old')});
assert.equal(legacy.function_registry_capture_kind,'RAW_BASE_ONLY');
const fixed = await exportCoupledSnapshot(navier,coupled,{...common,dir:pathOf('fixed')});
assert.equal(fixed.function_registry_capture_kind,'EXTENDED_COUPLED_FACADE');
assert.equal(fixed.extended_coupled_registry_included,true);
const readStream = name => gunzipSync(readFileSync(join(pathOf(name),'original-source-nodes.jsonl.gz')));
const expected = [{schema:'MathScope.M3.FullNodesJSONL/1',node_count:3}, ...nodes].map(r=>JSON.stringify(r)+'\n').join('');
assert.equal(readStream('fixed').toString('utf8'),expected);
assert.equal(sha(readStream('fixed')),fixed.node_stream_sha256);
assert.deepEqual(JSON.parse(readFileSync(join(pathOf('fixed'),definitionFile))),defs);

const oldBudgetShape = {length:22_155_584,0:nodes[0]};
const base = {nodes:oldBudgetShape};
const large = {nodes:oldBudgetShape,baseGraph:base,captureFunctionDefinitions:()=>defs};
await assert.rejects(exportOriginalSourceGraph(base,{...common,roots:[0],dir:pathOf('default-big'),definitionGraph:large}),
  {code:'INVALID_ORIGINAL_GRAPH_EXPORT'});
// The explicit limit passes the size gate. Its deliberately incomplete
// synthetic graph must then fail at the first missing node.
await assert.rejects(exportCoupledSnapshot(navier,large,{...common,roots:[0],dir:pathOf('sparse')}),
  {code:'INVALID_ORIGINAL_NODE'});
await assert.rejects(exportCoupledSnapshot(navier,{...coupled,baseGraph:{nodes:[...nodes]}},
  {...common,dir:pathOf('wrong-owner')}),/share the exact original node array/);
const over = {length:ACTIVE_SOURCE_EXPORT_MAX_NODES+1,0:nodes[0]};
await assert.rejects(exportCoupledSnapshot(navier,{nodes:over,baseGraph:{nodes:over}},
  {...common,roots:[0],dir:pathOf('over-budget')}),/explicit export budget/);
const evidence = {schema:'MathScope.N7.OriginalCoupledExporterContractTest/1',
  originalModuleSHA256:sha(readFileSync(new URL(original))),wrapperSHA256:sha(readFileSync(wrapper)),
  legacyOwnerKind:legacy.function_registry_capture_kind,fixedOwnerKind:fixed.function_registry_capture_kind,
  exactNodeStreamPreserved:true,definitionRegistryIncluded:true,
  explicitNodeLimit:ACTIVE_SOURCE_EXPORT_MAX_NODES,retryIngressGraphNodes:22_155_584,
  controls:['legacy-same-owner-raw-only','legacy-large-size-rejected','explicit-limit-reaches-missing-node',
    'different-node-array-rejected','too-large-explicit-size-rejected'],
  positiveFixtureNodes:3,actualOriginalFullStreamExportAcknowledged:false,finalJets:0,release:'HOLD'};
writeFileSync(result,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
console.log('PASS original exporter owner, exact stream and 22m explicit node admission');
