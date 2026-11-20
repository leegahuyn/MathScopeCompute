/** Optional in-process evidence hook after the verified original first cycle. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const API = '4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7';
const SCOPE = 'SAME_LIVE_ACTIVE_N3_POST_FIVE_REPEAT_FORCED_CONDITIONAL_SOURCE';
const PARTS = ['real','imaginary'];
const ROLE = /^ActualPostFiveRepeatCurl_([0-4]:(?:-1|1))_m([1-4])_(real|imaginary)_([0-2])$/;
const fileDigest = raw => createHash('sha256').update(raw).digest('hex');

function gaugeRoots(graph, count) {
  const definitions = new Map(graph.coupledDefinitions().expressions.flatMap(row =>
    ROLE.test(row.name) && row.body >= count ? [[row.id,row]] : []));
  assert.equal(definitions.size, 240, '40 mapped complex gauges on the actual append');
  const applications = new Map();
  for (let index=count; index<graph.nodes.length; index++) {
    const row = graph.nodes[index];
    if (row.op!=='m3_coupled_expression_partial') continue;
    const [id, actuals, orders] = row.args;
    const definition = definitions.get(id);
    if (!definition || orders.some(order => order !== 0)
        || JSON.stringify(actuals) !== JSON.stringify(definition.parameters)) continue;
    assert.ok(!applications.has(id), 'unique native shared gauge application');
    applications.set(id, index);
  }
  assert.equal(applications.size, definitions.size);
  const named = new Map([...definitions.values()].map(row=>[row.name,row]));
  assert.equal(named.size, 240);
  return (key, m) => [0,1,2].map(component =>
    Object.fromEntries([['real','imaginary', -1], ['imaginary','real',1]].map(([kind,rawPart,sign]) => {
      const label = 'ActualPostFiveRepeatCurl_'+key+'_m'+m+'_'+rawPart+'_'+component;
      const definition = named.get(label);
      assert.ok(definition);
      return [kind, {id:applications.get(definition.id), sign, system:definition.id,
        rawBody:definition.body, actualArguments:definition.parameters}];
    })));
}

const writeNewJSON = (out, name, value) => writeFile(join(out,name), JSON.stringify(value,null,2)+'\n', {flag:'wx'});

export async function emitActiveN3RepeatCandidate({
  navier, pde, out, firstCycle, context, mode = 'metadata', deferExport = false, maxNodes = 35_000_000,
  onLiveCandidate,
}) {
  assert.ok(['metadata','full-source'].includes(mode));
  assert.ok(onLiveCandidate === undefined || typeof onLiveCandidate === 'function');
  assert.ok(Number.isSafeInteger(maxNodes) && 0 < maxNodes && maxNodes <= 35_000_000);
  assert.equal(firstCycle.status, 'VERIFIED_FIRST_CYCLE_SOURCE_CONSTRUCTION');
  assert.equal(firstCycle.prefix, 3);
  assert.deepEqual(firstCycle.split.roots,[22153774,22153776,22153778]);
  assert.equal(firstCycle.split.divergence,22153781);
  assert.equal(firstCycle.split.nodeCount,22153782);
  const path = name => resolve(navier,'../post-signed-20261023',name);
  const load = name => import(pathToFileURL(path(name)).href);
  const repeat = 'source-postfive-repeat-forced.mjs';
  assert.equal(fileDigest(await readFile(path(repeat))), API);
  const [{assertActualPostFiveFull3DPDE},{constructPostFiveRepeatInverses}] =
    await Promise.all([load('source-postfive-full-3d-residual.mjs'),load(repeat)]);
  assert.ok(assertActualPostFiveFull3DPDE(pde));
  assert.deepEqual(pde.residual.conservative,firstCycle.stages.at(-1).conservativeResidual);
  assert.deepEqual(pde.residual.conservative,[22153560,22153562,22153564]);
  const G=pde.G, count=G.nodes.length;
  assert.ok(count>=firstCycle.split.nodeCount && count<maxNodes);
  assert.ok(!G.coupledDefinitions().expressions.some(row=>ROLE.test(row.name)), 'no prior repeat append');
  const definitions = G.captureFunctionDefinitions();
  context.checkCancelled?.();
  const result = constructPostFiveRepeatInverses(pde, {
    onProgress: context.onProgress, checkCancelled: context.checkCancelled,
  });
  assert.equal(result.G,G);
  assert.ok(G.nodes.length > count && G.nodes.length <= maxNodes);
  assert.ok(G.functionDefinitionsUnchanged(definitions));
  assert.ok(assertActualPostFiveFull3DPDE(pde));
  assert.equal(result.templates.length,10);
  assert.equal(result.systems.length,40);
  assert.ok(result.scope.completeSecondForcedState===false);
  const at=gaugeRoots(G,count);
  const rootIds=new Set(pde.residual.conservative);
  const collect = complex => {
    for (const part of PARTS) {
      assert.ok(Number.isSafeInteger(complex[part]) && G.nodes[complex[part]]);
      rootIds.add(complex[part]);
    }
  };
  const templates = result.templates.map(({template,rows,rawSupport})=>{
    assert.deepEqual(rows.map(row=>row.m),[1,2,3,4]);
    rows.forEach(row=>[...row.raw,...row.subtraction,...row.supported,...row.guarded].forEach(collect));
    return {key:template.key, phase:template.phase, sign:template.sign,
      difference:template.levelDifference, rows, rawSupport};
  });
  const systems = result.systems.map(row=>{
    for (const signed of [row.positive,row.negative]) [...signed.velocity,signed.pressure].forEach(collect);
    const potential=at(row.key,row.m);
    potential.forEach(component=>Object.values(component).forEach(({id})=>rootIds.add(id)));
    return {...row, mappedPotentialCoefficients:potential};
  });
  const receipt = {
    schema:'MathScope.N8.SameLiveActiveN3RepeatForcedCandidate/1',
    status:'ORIGINAL_REPEAT_FORCED_CANDIDATES_CONSTRUCTED_STAGE2_OPEN',
    mode, sourceModuleSHA256:API, precedingConservativeResidual:pde.residual.conservative,
    firstCycleSplitNodeCount:firstCycle.split.nodeCount, preRepeatNodeCount:count,
    postRepeatNodeCount:G.nodes.length, registeredPositiveSystems:40,
    typedMappedPotentialApplications:240, fields:result.fields, mean:result.mean,
    templates, systems, rootIds:[...rootIds], scope:result.scope, graphSnapshot:null,
  };
  await writeNewJSON(out,'active-n3-repeat-forced-candidate.json',receipt);
  if (mode==='full-source' && !deferExport) {
    const {exportOriginalSourceGraph}=await load('export_original_source_graph.mjs');
    const snapshot=await exportOriginalSourceGraph(G,{
      definitionGraph:G, dir:join(out,'active-n3-repeat-forced-source'), roots:receipt.rootIds,
      scope:SCOPE, sourceCommit: process.env.GITHUB_SHA || 'UNKNOWN_LOCAL_RUN',
      pr30Commit:pde.five.temporal.frontier.signed.source.sourceCommit, maxNodes,
    });
    await writeNewJSON(out,'active-n3-repeat-forced-export.json',{
      schema:'MathScope.N8.SameLiveRepeatCandidateExport/1',snapshot,
      candidate:'active-n3-repeat-forced-candidate.json', guardedMatchesOriginalSupportedSource:'OPEN',
      completeSecondCorrection:'OPEN',finalJets:0,release:'HOLD',
    });
  }
  onLiveCandidate?.(result);
  return receipt;
}
