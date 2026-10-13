import { Worker } from 'node:worker_threads';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createM1Engine } from '../../mathscope-m1/core/engine.mjs';
import { createM2Engine } from '../../mathscope-m2/core/engine.mjs';
import { canonicalStringify } from '../../mathscope-m0/contracts.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(here, '../../..');
const clone = value => structuredClone(value);
const digest = value => createHash('sha256').update(typeof value === 'string' ? value : canonicalStringify(value)).digest('hex');
const engines = { M1: createM1Engine, M2: createM2Engine };
export const readCatalog = async () => JSON.parse(await fs.readFile(path.join(here, 'catalog.json'), 'utf8'));

/** Adapt transport only: math executes from the installed browser Worker bytes. */
export function nativeWorkerFactory(source) {
  const bridge = "const {parentPort}=require('node:worker_threads');globalThis.self=globalThis;globalThis.postMessage=data=>parentPort.postMessage(data);parentPort.on('message',data=>globalThis.onmessage({data}));\n";
  const worker = new Worker(bridge + source, { eval: true, resourceLimits: { maxOldGenerationSizeMb: 512, maxYoungGenerationSizeMb: 64 } });
  const adapter = { onmessage: null, onerror: null, postMessage: value => worker.postMessage(value), terminate: () => worker.terminate() };
  worker.on('message', data => adapter.onmessage?.({ data }));
  worker.on('error', error => adapter.onerror?.({ message: error.message }));
  return adapter;
}

export function inspectInvariants(fixture, job) {
  const r = job.result, d = r?.results, e = fixture.expected || {}, checks = [];
  const check = (id, pass, observed) => checks.push({ id, pass: Boolean(pass), ...(observed === undefined ? {} : { observed }) });
  check('terminal-completed', job.status === 'COMPLETED', job.status);
  if (e.pointCount !== undefined) check('exact-point-count', (d?.pointCount ?? d?.primeField?.count) === e.pointCount, d?.pointCount ?? d?.primeField?.count);
  if (e.aP !== undefined) check('exact-frobenius-trace', d?.aP === e.aP, d?.aP);
  if (e.dimension !== undefined) {
    check('full-lie-dimension', r?.group?.dimension === e.dimension, r?.group?.dimension);
    check('actual-matrix-dimension', r?.group?.matrixDimension === e.matrixDimension, r?.group?.matrixDimension);
    check('exact-jacobi-certificate', r?.verification?.exactCertificate?.ok === true);
    check('group-verification', r?.verification?.ok === true);
  }
  if (e.enclosure) {
    check('heat-directed-enclosures', Array.isArray(r?.derivatives) && r.derivatives.length === fixture.request.input.derivativeOrder + 1 && r.derivatives.every(x => Number.isFinite(x.lower) && x.lower <= x.upper));
    check('heat-ode-contains-zero', r?.odeEnclosure?.lower <= 0 && r?.odeEnclosure?.upper >= 0);
  }
  if (e.axisExcluded) {
    check('axis-excluded', r?.domain?.excludeAxis === true);
    check('actual-exterior-samples', r?.points?.length === fixture.request.input.radialCount * 16 && r.points.every(p => p.velocity.every(Number.isFinite)), r?.points?.length);
  }
  if (e.localTailCertified) {
    check('local-contraction-and-tail', r?.gates?.invariantBall === true && r?.gates?.lipschitzBelowOne === true && r?.gates?.infiniteCoefficientTail === true);
    check('local-quantifier-boundary', r?.gates?.globalWitness === false && r?.fullNavierStokesSolution === false);
  }
  if (e.energyBalance) check('reference-pde-mean-balance', Number.isFinite(r?.meanEnergy) && r?.meanEnergy > 0 && r?.energyDerivative === -r?.meanDissipation && r?.fullSourceSolution === false, { energy: r?.meanEnergy, dissipation: r?.meanDissipation, derivative: r?.energyDerivative });
  if (e.referenceBoundary) check('comparison-reference-boundary', r?.evidence?.formalComplete === false && r?.evidence?.lean === 'NO_NEW_KERNEL_EXECUTION');
  if (e.deltaComparison) {
    check('delta-target-count', r?.comparison?.length === e.deltaComparison, r?.comparison?.map(p => p.delta));
    check('same-declared-generator', r?.comparison?.every(p => typeof p.physicalFieldHash === 'string') && r?.models?.quantumYangMills === false);
  }
  if (e.flatIdentity) {
    check('identity-wilson-action', r?.measurements?.action === 0 || r?.measurements?.wilsonAction === 0 || r?.action === 0, r?.measurements ?? r?.action);
  }
  if (Array.isArray(r?.checks)) for (const c of r.checks) if (typeof c.pass === 'boolean' || typeof c.ok === 'boolean') check('module-check:' + (c.name || c.id), c.pass ?? c.ok);
  return { pass: checks.every(c => c.pass), checks };
}

function numericalSummary(fixture, job) {
  const r = job.result, d = r.results;
  if (['point', 'p1', 'elliptic'].includes(fixture.id)) return { pointCount: d.pointCount ?? d.primeField?.count, aP: d.aP ?? null, finiteResidues: d.cohomology?.map(x => x.finiteResidue) ?? null, N: job.request.precision.N };
  if (fixture.id === 'axis') return { tailDegree: r.tails.degree, tailRows: r.tails.rows.map(x => ({ Y: x.Y, phiTailUpper: x.phiTailUpper })), localGates: Object.fromEntries(Object.entries(r.gates).filter(([k]) => ['invariantBall', 'lipschitzBelowOne', 'infiniteCoefficientTail', 'globalWitness'].includes(k))) };
  if (fixture.id === 'exterior') return { radialCount: job.request.input.radialCount, pointCount: r.points.length, first: r.points[0].velocity, last: r.points.at(-1).velocity, solutionErrorBound: r.errorBudget.solutionErrorBound };
  if (fixture.id === 'delta') return { points: r.visualization.points.length, samplesPerAxis: job.request.input.observation.samplesPerAxis, physicalFieldHash: r.hashes.physicalField, targets: r.comparison.map(x => ({ delta: x.delta, hash: x.physicalFieldHash, rho: x.rho })) };
  if (fixture.id === 'lattice') return { lattice: job.request.input.lattice, measurements: r.measurements, checks: r.checks };
  if (fixture.id === 'heat') return { derivatives: r.derivatives, odeEnclosure: r.odeEnclosure };
  if (fixture.id === 'taylor-green') return { meanEnergy: r.meanEnergy, meanDissipation: r.meanDissipation, energyDerivative: r.energyDerivative };
  if (fixture.expected?.dimension) return { dimension: r.group.dimension, matrixDimension: r.group.matrixDimension, exactCertificate: r.verification.exactCertificate };
  return { status: job.status, scope: r.scope, evidence: r.evidence, checks: r.checks };
}

export async function verifyFixture(fixture) {
  if (!engines[fixture.engine]) throw Error('Unknown fixture engine.');
  const started = new Date().toISOString(), before = process.memoryUsage();
  let workersStarted = 0;
  const local = engines[fixture.engine]({ local: true });
  const isolated = engines[fixture.engine]({ workerFactory: source => { workersStarted++; return nativeWorkerFactory(source); } });
  const run = async engine => { const queued = await engine.submit(clone(fixture.request)); return engine.wait(queued.id); };
  try {
    const a = await run(local), b = await run(isolated), invariant = inspectInvariants(fixture, b), environment = await isolated.environment();
    const pass = invariant.pass && a.status === b.status && a.inputHash === b.inputHash && a.mathematicalHash === b.mathematicalHash && workersStarted === 1;
    return {
      id: fixture.id, engine: fixture.engine, claimId: fixture.claimId, startedAt: started, finishedAt: new Date().toISOString(), pass,
      commandScope: 'FRESH_ISOLATED_INSTALLED_BROWSER_WORKER_VS_CURRENT_LOCAL_MODULE', workersStarted,
      request: clone(fixture.request), requestDigest: digest(fixture.request), inputHash: b.inputHash,
      local: { status: a.status, resultHash: a.resultHash, mathematicalHash: a.mathematicalHash },
      worker: { status: b.status, resultHash: b.resultHash, mathematicalHash: b.mathematicalHash, workerSHA256: environment.workerSha256 },
      mathematicalHashMatch: a.mathematicalHash === b.mathematicalHash, invariant,
      observation: numericalSummary(fixture, b), source: clone(fixture.source),
      memory: { parentRSSBefore: before.rss, parentRSSAfter: process.memoryUsage().rss, scope: 'Process snapshots including threads; not a peak process-tree bound' },
      fullSourceSolution: false, formalKernelExecuted: false,
    };
  } finally { local.dispose(); isolated.dispose(); }
}

const rationalCompare = (a, b) => {
  const read = s => { const [n, d = '1'] = String(s).split('/'); return [BigInt(n), BigInt(d)]; };
  const [n, d] = read(a), [m, e] = read(b); return n * e < m * d ? -1 : n * e > m * d ? 1 : 0;
};
export function inspectRefinement(plan, rows) {
  const checks = [], check = (id, pass) => checks.push({ id, pass: Boolean(pass) });
  check('all-independent-executions-pass', rows.every(x => x.pass));
  check('changed-input-hashes', new Set(rows.map(x => x.inputHash)).size === rows.length);
  if (plan.id === 'padic') check('exact-point-invariant', rows.every(x => x.observation.pointCount === '1'));
  if (plan.id === 'series') {
    const a = rows[0].observation.tailRows, b = rows[1].observation.tailRows;
    check('same-tail-evaluation-locations', a.length === b.length && a.every((x, i) => x.Y === b[i].Y));
    check('exact-omitted-tail-decreases', a.every((x, i) => rationalCompare(b[i].phiTailUpper, x.phiTailUpper) <= 0) && a.some((x, i) => rationalCompare(b[i].phiTailUpper, x.phiTailUpper) < 0));
  }
  if (plan.id === 'spatial') check('fixed-endpoint-numeric-observations', canonicalStringify(rows[0].observation.first) === canonicalStringify(rows[1].observation.first) && canonicalStringify(rows[0].observation.last) === canonicalStringify(rows[1].observation.last));
  if (plan.id === 'lattice-spacing') check('sites-held-fixed', rows.every(x => x.observation.lattice.Ns === rows[0].observation.lattice.Ns && x.observation.lattice.Nt === rows[0].observation.lattice.Nt));
  if (plan.id === 'lattice-volume') check('spacing-held-fixed', rows.every(x => x.observation.lattice.as === rows[0].observation.lattice.as && x.observation.lattice.at === rows[0].observation.lattice.at && x.observation.lattice.Nt === rows[0].observation.lattice.Nt));
  if (plan.id === 'samples') check('physical-source-preserved', rows.every(x => x.observation.physicalFieldHash === rows[0].observation.physicalFieldHash && canonicalStringify(x.observation.targets) === canonicalStringify(rows[0].observation.targets)));
  return { pass: checks.every(x => x.pass), checks, theoremFromConvergenceTable: false, boundType: plan.boundType };
}

export async function runVerification({ outDir = null, onProgress = () => {} } = {}) {
  const catalog = await readCatalog(), startedAt = new Date().toISOString(), fixtures = [], refinements = [];
  let sourceCommit = null; try { sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim(); } catch { /* Standalone copies retain manifest source hashes. */ }
  for (const fixture of catalog.fixtures) { const row = await verifyFixture(fixture); fixtures.push(row); onProgress({ phase: 'fixture', id: fixture.id, pass: row.pass }); }
  for (const plan of catalog.refinementPlan) {
    const original = catalog.fixtures.find(x => x.id === plan.fixtureId), rows = [];
    for (const value of plan.values) {
      const fixture = clone(original);
      if (plan.id === 'lattice-spacing') fixture.request.input.lattice.as = fixture.request.input.lattice.at = value;
      else { const keys = plan.axis.split('.'); let target = fixture.request; for (const key of keys.slice(0, -1)) target = target[key]; target[keys.at(-1)] = value; }
      rows.push(await verifyFixture(fixture));
    }
    const row = { ...plan, rows, assessment: inspectRefinement(plan, rows) }; refinements.push(row); onProgress({ phase: 'refinement', id: plan.id, pass: row.assessment.pass });
  }
  const artifactFiles = ['catalog.json', 'verify-fixtures.mjs', 'verify-fixtures.test.mjs', 'README_KO.md'];
  const sourceFiles = []; for (const name of artifactFiles) { const bytes = await fs.readFile(path.join(here, name)); sourceFiles.push({ path: 'research-ide/mathscope-m4/release-lab/' + name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }); }
  const report = {
    schema: 'MathScope.M4.ReleaseLabCleanWorkerVerification/1', startedAt, finishedAt: new Date().toISOString(), sourceCommit, runtime: { node: process.version, platform: process.platform, arch: process.arch },
    catalogSHA256: digest(await fs.readFile(path.join(here, 'catalog.json'), 'utf8')), sourceFiles, fixtures, refinements,
    pass: fixtures.every(x => x.pass) && refinements.every(x => x.assessment.pass),
    scopes: { exactFixtureWorkerParity: true, independentDeclaredRefinementAxes: true, allOriginalR101Accepted: false, allOriginalR102Accepted: false, externalReaderR107Verified: false, wholeM3Complete: false, wholeM4Complete: false },
    limits: { parallelFiles: 1, cleanWorkerPerExecution: true, workerOldGenerationMiB: 512, workerYoungGenerationMiB: 64, wallTimeoutPerJobFromRequest: true, rawFullResultsOmittedFromCompactReport: true },
    boundary: 'Exact hashes and scoped fixture/tail checks; finite identity/sampling rows do not certify an infinite quantum limit, whole NS construction, or external-user reproduction.',
  };
  if (outDir) {
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argument = process.argv.indexOf('--out');
  const outDir = argument >= 0 ? path.resolve(process.argv[argument + 1]) : path.join(here, 'evidence', 'run-' + new Date().toISOString().replace(/[:.]/g, ''));
  const result = await runVerification({ outDir, onProgress: value => console.log(JSON.stringify(value)) });
  console.log(JSON.stringify({ pass: result.pass, fixtures: result.fixtures.length, refinements: result.refinements.length, outDir }));
  process.exitCode = result.pass ? 0 : 1;
}
