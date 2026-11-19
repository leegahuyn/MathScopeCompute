import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {pathToFileURL} from 'node:url';
import zlib from 'node:zlib';

const [archive, runtime, output] = process.argv.slice(2);
assert(output, 'ARCHIVE ORIGINAL_NAVIER_DIRECTORY OUTPUT_DIRECTORY');
const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');
const pins = {
  'actual-continuation-exact-functions.mjs': '326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
  'actual-residual-order-induction-expressions.mjs': 'dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501',
};
for (const [name, digest] of Object.entries(pins)) {
  assert.equal(sha(fs.readFileSync(path.join(runtime, name))), digest, name);
}
const registryBytes = fs.readFileSync(path.join(archive, 'original-source-functions.json'));
const registrySHA256 = sha(registryBytes);
assert.equal(registrySHA256, '049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad');
const {base} = JSON.parse(registryBytes);
const systems = JSON.parse(base.picard);
assert.equal(systems.length, 10);
const common = [];
const graphHash = crypto.createHash('sha256');
let count = -1;
for await (const line of readline.createInterface({
  input: fs.createReadStream(path.join(archive, 'original-source-nodes.jsonl.gz')).pipe(zlib.createGunzip()),
  crlfDelay: Infinity,
})) {
  graphHash.update(line + '\n');
  if (count >= 0 && count <= 130347) common.push(JSON.parse(line));
  count++;
}
const sourceSHA256 = graphHash.digest('hex');
assert.equal(count, 7358162);
assert.equal(sourceSHA256, 'ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd');
const {ActualConvergentExpressions} = await import(pathToFileURL(path.resolve(runtime, 'actual-continuation-exact-functions.mjs')));
const {ActualInductionExpressions} = await import(pathToFileURL(path.resolve(runtime, 'actual-residual-order-induction-expressions.mjs')));
const commonLookup = new Map(common.map(({op, args}, i) => [JSON.stringify([op, args]), i]));

function children({op, args}) {
  if (['coordinate', 'source_parameter', 'rational'].includes(op)) return [];
  if (['integer_power', 'source_step_derivative'].includes(op)) return [args[0]];
  if (op === 'definite_integral') return [args[0], args[1], args[2], args[3]];
  if (op === 'actual_natural_series') return args.slice(1, 3);
  if (['actual_background_even_profile', 'actual_background_picard'].includes(op)) return args.slice(2, 4);
  if (op === 'actual_quadratic_root') return [args[2]];
  if (op === 'actual_monotone_root') return args.slice(1);
  if (op === 'actual_expression_partial') return args[1];
  assert(['add', 'multiply', 'inverse', 'exp', 'log_positive', 'sqrt_positive',
    'maximum', 'ceiling', 'smooth_piecewise', 'sine', 'cosine'].includes(op), op);
  return args;
}

function loadSystem() {
  const graph = new ActualInductionExpressions(new ActualConvergentExpressions(), {maxNodes: 1500000});
  graph.nodes = common.slice();
  graph.lookup = new Map(commonLookup);
  graph.expressionSystems = JSON.parse(base.expression);
  graph.quadraticSystems = JSON.parse(base.quadratic);
  graph.monotoneSystems = JSON.parse(base.monotone);
  graph.picardSystems = systems;
  graph.derivatives = new Map();
  graph.substitutions = new Map();
  graph.dependencyCache = new Map();
  graph.expressionMaterializations = new Map();
  graph.serial = 4500000;
  return graph;
}

const rows = [];
fs.mkdirSync(output, {recursive:true});
for (const [system, source] of systems.entries()) {
  const G = loadSystem();
  // These are real source entry points. Python will reconstruct the
  // recurrence and shifted arguments from the stored original body.
  const displays = [0, 1, 2, 3].map((n) => G.picardPartialSum(system, n));
  assert(displays.every((item) => item.finiteTermsAreExactExpressions && !item.finitePartialSumIsExactSolution &&
    item.errorBoundForTheseDisplayedTerms === null && item.sourceCertifiedTail === source.tail));
  if (system === 0) assert.throws(() => G.picardPartialSum(system, 9), {code:'RESOURCE_LIMIT'});
  const partialDerivatives = displays[3].terms.slice(0, 2).map((term) => term.map((x) => G.derivative(x, source.eta)));
  const rhs = [0, 1].map((m) => source.forcing.map((_, j) => G.picardRhs(system, j, source.xi, source.eta, m)));
  const rhsEtaCoefficients = [source.A0, source.A1].map((matrix) => matrix.map((row) => row.map((x) => G.derivative(x, source.eta))));
  const rhsEtaForcing = source.forcing.map((x) => G.derivative(x, source.eta));
  const radial = [0, 1].map((m) => source.forcing.map((_, j) => G.picardRadialDerivative(system, j, source.xi, source.eta, m)));
  const axis = [0, 1].map((m) => source.forcing.map((_, j) => G.picardRoot(system, j, G.zero, source.eta, m)));
  const pending = [
    ...source.A0.flat(), ...source.A1.flat(), ...source.forcing, source.xi, source.eta, G.zero, G.one,
    ...displays.flatMap((p) => [...p.sum, ...p.terms.flat()]),
    ...partialDerivatives.flat(), ...rhs.flat(), ...radial.flat(), ...axis.flat(),
    ...rhsEtaCoefficients.flat(2), ...rhsEtaForcing,
  ];
  const reached = new Set();
  while (pending.length) {
    const i = pending.pop();
    if (reached.has(i)) continue;
    reached.add(i);
    pending.push(...children(G.nodes[i]));
  }
  const nodes = [...reached].sort((a,b) => a-b).map((node) => [node, G.nodes[node]]);
  const data = {
    sourceSHA256, registrySHA256, pins, system, source,
    displays: displays.map(({count, terms, sum}) => ({count,terms,sum})),
    partialDerivatives, rhs, rhsEtaCoefficients, rhsEtaForcing, radial, axis,
    displayNineRejected: system === 0 ? true : null,
    nodes,
  };
  const file = 'system-' + system + '.json.gz';
  const buffer = zlib.gzipSync(Buffer.from(JSON.stringify(data) + '\n'), {level:9});
  fs.writeFileSync(path.join(output,file),buffer,{flag:'wx'});
  const row = {system, order:source.order, file, sha256:sha(buffer), reached:reached.size};
  rows.push(row);
  console.log(JSON.stringify(row));
}
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({sourceSHA256,registrySHA256,pins,rows}, null, 2)+'\n',{flag:'wx'});
