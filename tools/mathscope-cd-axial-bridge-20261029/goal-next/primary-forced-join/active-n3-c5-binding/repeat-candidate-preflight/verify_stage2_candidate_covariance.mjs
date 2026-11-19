import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [runtime, candidatePath, oldWavePath, activePath, output] = process.argv.slice(2);
assert.ok(output);
const prefix = 'research-ide/mathscope-m3/';
const navier = prefix + 'navier/';
const post = prefix + 'post-signed-20261023/';
const load = name => import(pathToFileURL(resolve(runtime, name)).href);
const digest = data => createHash('sha256').update(data).digest('hex');
const pinned = (path, hash) => {
  const body = readFileSync(path);
  assert.equal(digest(body), hash);
  return JSON.parse(body);
};
const candidate = pinned(candidatePath, '43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf');
const oldWave = pinned(oldWavePath, '7ac31a18079dd4cabf9f190dfbca0559d1ade8ea779aa4866238cd7b935eba67');
const active = pinned(activePath, '74a686bc95f4c094f1de834062b8b402aa5b861940fa3e109aa0f1913d52d529');

const originals = {
  [post + 'source-postfive-repeat-forced.mjs']: '4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7',
  [post + 'source-postfive-full-3d-residual.mjs']: 'd93195ac381c75860e5d450a77ad3160ade16ca4579f4988dc38948e504163de',
  [navier + 'source-global-forced-current.mjs']: '1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3',
  [navier + 'source-coupled-expressions.mjs']: '5f83192211b649526a2616421a68c9e53004ace96776243e55e37b0a6973cf39',
  [navier + 'source-global-current.mjs']: 'b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36',
  [navier + 'source-initialized-angular.mjs']: '4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e',
  [navier + 'source-global-angular.mjs']: 'eb4e4ae44e9bb84713f89d36d1d7ae33cf1b072638d0a8e67e2a90f38d411010',
  [navier + 'source-harmonic-assembly.mjs']: '339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20',
  [navier + 'source-quadratic-identity.mjs']: '696ff2202a9fb58e4de791a264fa23321fd81774f1f1a4f8336803d6a10b5bcd',
  [navier + 'source-mapped-forced-curl.mjs']: '3764b705d26c3333578db9fbc15004779d825026d2a487d3809320fd41cb62bd',
};
for (const [path, hash] of Object.entries(originals)) {
  assert.equal(digest(readFileSync(resolve(runtime, path))), hash, path);
}
const [repeat, postFive, forced, harmonic, exact, expr] = await Promise.all([
  load(post + 'source-postfive-repeat-forced.mjs'),
  load(post + 'source-postfive-full-3d-residual.mjs'),
  load(navier + 'source-global-forced-current.mjs'),
  load(navier + 'source-harmonic-assembly.mjs'),
  load(navier + 'source-quadratic-identity.mjs'),
  load('research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs'),
]);
assert.equal(typeof repeat.constructPostFiveRepeatInverses, 'function');
assert.equal(typeof forced.exactAngularWaveCovariance, 'function');
assert.equal('completeSourceField' in forced, false, 'indexed helper is module-private');

const archivedSnapshot = candidate.snapshot;
const activeStage = active.stages.at(-1);
assert.deepEqual(candidate.precedingConservativeResidual, [4456772, 4456774, 4456776]);
assert.deepEqual(activeStage.conservativeResidual, [22153560, 22153562, 22153564]);
assert.equal(activeStage.nodeCount, 22153565);
assert.equal(active.split.nodeCount, 22153782);
assert.equal(archivedSnapshot.node_count, 4682006);
assert.equal(archivedSnapshot.node_stream_sha256, oldWave.graphSHA256);
assert.equal(archivedSnapshot.definitions_sha256, oldWave.registrySHA256);
assert.equal(candidate.registeredPositiveSystems, 40);
assert.equal(candidate.scope.completeSecondForcedState, false);
assert.deepEqual(candidate.templates.length, 10);
assert.deepEqual(Object.keys(candidate.systems[0]).sort(),
  ['key','m','pullback','system','mappedCutoff','positive','negative'].sort());

const beforeNodeAccess = {get nodes() { throw new Error('The private owner must be checked first'); }};
for (const [name, invalidOwner] of [
  ['archived serializable candidate', candidate],
  ['same active physical metadata but missing owner', {
    G: beforeNodeAccess, velocity: {fullPhysicalVelocity: activeStage.velocity},
    residual: {conservative: activeStage.conservativeResidual},
    pressure: {fullPhysicalPressure: activeStage.pressure}, five: {},
  }],
  ['manifest and definitions as object', {G: archivedSnapshot, five: {}}],
]) {
  assert.throws(() => postFive.assertActualPostFiveFull3DPDE(invalidOwner),
    {code: 'INVALID_POSTFIVE_3D_SOURCE_SEAL'}, name);
  assert.throws(() => repeat.constructPostFiveRepeatInverses(invalidOwner),
    {code: 'INVALID_POSTFIVE_3D_SOURCE_SEAL'}, name);
}

const pairs = {rr:[0,0], rtheta:[0,1], rz:[0,2], thetatheta:[1,1], thetaz:[1,2], zz:[2,2]};
const modes = [-4,-3,-2,-1,1,2,3,4];
const rootInArchive = id => Number.isSafeInteger(id) && id >= 0 && id < archivedSnapshot.node_count;

function checkCovariance(template) {
  // This exact graph keeps original value roots as independent symbolic
  // leaves. It does not rehydrate native functions or alter their owners.
  const G = new expr.ActualConvergentExpressions();
  const C = harmonic.exactHarmonicComplexAlgebra(G);
  const verify = exact.createQuadraticSourceVerifier(G, {maxTerms: 2000});
  const atoms = new Map();
  const atom = id => {
    assert.ok(rootInArchive(id), id);
    if (id === 0) return G.zero;
    if (!atoms.has(id)) atoms.set(id, G.fresh('archived_root_' + id));
    return atoms.get(id);
  };
  const value = roots => C.value(atom(roots.real), atom(roots.imaginary));
  const analyze = ({left,right}) => {
    const positive = [1,2,3,4].map(m => ({
      m, velocity: left[m-1].map((z,j)=>C.add(z,right[m-1][j])),
    }));
    return positive.flatMap(row=>[row,{m:-row.m,velocity:row.velocity.map(C.conjugate)}]);
  };
  const previous = oldWave.waves.filter(row=>row.key===template.key);
  const incoming = candidate.systems.filter(row=>row.key===template.key);
  assert.deepEqual(previous.map(row=>row.mode), [1,2]);
  assert.deepEqual(incoming.map(row=>row.m), [1,2,3,4]);
  assert.ok(previous.every(row=>row.phase===template.phase));
  const previousIds = previous.map(row=>row.fields.map(({real,imaginary})=>
    ({real:real.application, imaginary:imaginary.application})));
  const incomingIds = incoming.map(row=>{
    assert.equal(row.positive.m, row.m);
    assert.equal(row.negative.m, -row.m);
    const ids = [...row.positive.velocity,row.positive.pressure];
    for (const z of ids) assert.ok(archivedSnapshot.original_root_ids.includes(z.real)
      && archivedSnapshot.original_root_ids.includes(z.imaginary));
    return ids;
  });
  const previousWave = [1,2,3,4].map(m=>previousIds[m-1]?.slice(0,3).map(value) ?? [C.zero,C.zero,C.zero]);
  const correction = incomingIds.map(row=>row.slice(0,3).map(value));
  const zeros = [1,2,3,4].map(()=>[C.zero,C.zero,C.zero]);
  const all = analyze({left:previousWave,right:correction});
  const wNew = forced.exactAngularWaveCovariance(G,{rows:all});
  assert.deepEqual(wNew.modes, modes);
  const wOld = forced.exactAngularWaveCovariance(G,{rows:analyze({left:previousWave,right:zeros})});
  const wCorrection = forced.exactAngularWaveCovariance(G,{rows:analyze({left:zeros,right:correction})});
  const lowOnly = [correction[0],correction[1],zeros[2],zeros[3]];
  const low = forced.exactAngularWaveCovariance(G,{rows:analyze({left:previousWave,right:lowOnly})});
  const reduction = [];
  for (const [name,[i,j]] of Object.entries(pairs)) {
    assert.equal(wNew.contributions[name].length,8);
    const addends=[];
    for (let m=0; m<4; m++) {
      for (const part of ['real','imaginary']) {
        const u=previousWave[m], d=correction[m];
        addends.push(G.mul(u[i][part],d[j][part]),
          G.mul(d[i][part],u[j][part]),G.mul(d[i][part],d[j][part]));
      }
    }
    const delta=G.mul(G.q(2),G.add(...addends));
    assert.ok(verify(G.sub(wNew.values[name],G.add(wOld.values[name],delta))).pass, name);
    assert.equal(verify(G.sub(wNew.values[name],G.add(wOld.values[name],wCorrection.values[name]))).pass,
      false, 'omit mixed old and new waves ' + name);
    assert.equal(verify(G.sub(wNew.values[name],low.values[name])).pass,
      false, 'discard new modes 3 and 4 ' + name);
    reduction.push(name);
  }
  assert.throws(()=>forced.exactAngularWaveCovariance(G,{rows:all.filter(row=>row.m!==-4)}),
    {code:'INVALID_INPUT'});
  return {template:template.key, phase:template.phase,
    oldModes:[1,2], incomingModes:[1,2,3,4],
    actualArchiveOldVelocityAndPressureIDs:previousIds,
    actualArchiveCandidateVelocityAndPressureIDs:incomingIds,
    exactCovarianceComponents:reduction, omittedMixedTermsRejected:6,
    omittedHighModesRejected:6, missingConjugateRejected:true,
  };
}

const retained = candidate.templates.map(checkCovariance);
const M = [0,...modes];
const nextModes=[...new Set(M.flatMap(a=>M.map(b=>a+b)))].sort((a,b)=>a-b);
assert.deepEqual(nextModes, Array.from({length:17},(_,i)=>i-8));
const report = {
  schema:'MathScope.N8.RepeatForcedAssemblyPreflight/1',
  status:'VERIFIED_IMPORTS_AND_ARCHIVE_ROOT_KEYED_COVARIANCE_CONDITIONAL_NEXT_STAGE',
  originalModuleSHA256:originals,
  knownArchive:{run:43015175416,count:4682006,oldPrefix:4456994,
    previousResidual:candidate.precedingConservativeResidual},
  activeFirst:{run:44528954587,countAfterSplit:active.split.nodeCount,
    activePreviousResidual:activeStage.conservativeResidual,listMismatchWithArchive:true},
  sameProcessPDERequired:true, serializedSealControls:6,
  importedActualActiveM3OverlayCovariance:true,
  archivedRootKeysRepresentOpaqueSymbolicLeaves:true,
  replayedTemplateCount:retained.length,exactVarianceUpdates:retained.length*6,
  rejectedOldWaveOmission:retained.length*6,rejectedHighModeOmission:retained.length*6,
  rejectedMissingConjugate:retained.length,
  sources:{candidate:archivedSnapshot.node_stream_sha256,archivedRegistry:archivedSnapshot.definitions_sha256},
  localModesAfterConditionalSecondForced:modes,
  nextPossibleResidualModes:nextModes,
  templates:retained,
  liveOriginalActiveN3RepeatRun: 'OPEN',
  completeSecondCorrection: 'OPEN',
  finalJets:0,release:'HOLD',
};
const text=JSON.stringify(report,null,2)+'\n';
writeFileSync(output,text,{flag:'wx'});
console.log(JSON.stringify({cases:retained.length,expectedNextResidualModes:nextModes,
  covarianceIdentities:report.exactVarianceUpdates,negativeControls:report.rejectedOldWaveOmission+
  report.rejectedHighModeOmission+report.rejectedMissingConjugate+report.serializedSealControls,
  sha256:digest(text)}));
