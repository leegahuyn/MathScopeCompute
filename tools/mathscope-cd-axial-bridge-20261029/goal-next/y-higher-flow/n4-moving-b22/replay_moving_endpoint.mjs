import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {pathToFileURL} from "node:url";
import zlib from "node:zlib";

const [graphDir, reachPath, sourceDir, flowDir, output, control = "positive"] = process.argv.slice(2);
assert(output, "usage: replay_moving_endpoint.mjs GRAPH_DIR REACHED SOURCE_DIR Y_HIGHER_FLOW OUTPUT");
assert.equal(control, "positive");
const pins = {};
function pinned(file, expected) {
  const contents = fs.readFileSync(file);
  const actual = crypto.createHash("sha256").update(contents).digest("hex");
  assert.equal(actual, expected, file);
  pins[path.basename(file)] = actual;
  return contents;
}
function receipt(relative, hash, expectedStatus) {
  const result = JSON.parse(pinned(path.join(flowDir, relative), hash));
  assert.equal(result.status, expectedStatus);
  return result;
}
const reached = JSON.parse(pinned(reachPath, "1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc"));
const originalProfiles = reached.nodes.filter(([, node]) => node.op === "actual_background_even_profile");
assert.equal(originalProfiles.length, 259);
const originalDerivatives = originalProfiles.filter(([, node]) => node.args[4] > 0);
assert.equal(originalDerivatives.length, 112);
const replayTargets = originalDerivatives.filter(([id]) => id === 121999);
assert.equal(replayTargets.length, 1);
const gateway = receipt("n4-residual-frame/gateway-closure.json", "ffb665bd31b95354179440012e36d31fdf9a4c31870e99ca3de498a50174782f", "PASS_PROFILE_GATEWAY_CLOSURE");
const physical = receipt("n4-physical-frame/physical-flow.json", "e2a30ba0678dbe201350865ef86d8066e0f3121a1891368695f8fdd8bce865e1", "PASS_ACTUAL_PHYSICAL_FRAME_INPUT_FLOW");
const selector = receipt("n4-selector-frame/selector-flow.json", "2a3793078d70f1e5310175c547366475c42459309f7c9c379f79f39a72e09c85", "PASS_ACTUAL_SELECTOR_FRAME_INPUT_FLOW");
const pressure = receipt("n4-residual-frame/pressure-flow.json", "802fbb3512741de2416ae9d90b070db66eefe35280680f54d04885ca0e7aed52", "PASS_ACTUAL_RESIDUAL_INTEGRAL_INPUT_FLOW");
assert.equal(gateway.overlap.verifiedInputGates, 29);
assert.equal(gateway.profileSites, originalProfiles.length);
assert.deepEqual(gateway.physicalGates, physical.physicalApplications);
assert.deepEqual(gateway.selectorGates, selector.selectorRoots);
assert.deepEqual(gateway.pressureGates, [...pressure.residualIntegralRoots, ...pressure.pointCallRoots]);
assert.equal(pressure.sourceProfileDescendants, 182);

const library = path.join(sourceDir, "actual-continuation-exact-functions.mjs");
const adapter = path.join(sourceDir, "actual-residual-order-induction-expressions.mjs");
pinned(library, "326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311");
pinned(adapter, "dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501");
const registryFile = path.join(graphDir, "original-source-functions.json");
const {base: registry} = JSON.parse(pinned(registryFile, "049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad"));
const picard = JSON.parse(registry.picard);
const graphFile = path.join(graphDir, "original-source-nodes.jsonl.gz");
const prefixEnd = Math.max(...originalProfiles.map(([id]) => id));
assert.equal(prefixEnd, 130347);
const graphHash = crypto.createHash("sha256");
const prefix = [];
let nodeCount = -1;
for await (const line of readline.createInterface({input: fs.createReadStream(graphFile).pipe(zlib.createGunzip()), crlfDelay: Infinity})) {
  graphHash.update(line + "\n");
  if (nodeCount >= 0 && nodeCount <= prefixEnd) prefix.push(JSON.parse(line));
  nodeCount++;
}
const graphSha = graphHash.digest("hex");
assert.equal(nodeCount, 7358162);
assert.equal(graphSha, "ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd");
for (const [id, node] of originalProfiles) assert.deepEqual(prefix[id], node);
assert.deepEqual(prefix[2], {op: "coordinate", args: ["eta"]});
assert.deepEqual(prefix[474], {op: "rational", args: ["4", "1"]});
assert.deepEqual(prefix[3454], {op: "source_parameter", args: ["Lambda"]});
assert.deepEqual(prefix[3612], {op: "source_parameter", args: ["t1"]});
assert.deepEqual(prefix[3617], {op: "source_parameter", args: ["Xa"]});
assert.deepEqual(prefix[24], {op: "rational", args: ["2", "1"]});
assert.deepEqual(prefix[3625], {op: "multiply", args: [24, 3612]});
assert.deepEqual(prefix[3623], {op: "exp", args: [3612]});
assert.deepEqual(prefix[3626], {op: "exp", args: [3625]});
assert.deepEqual(prefix[3624], {op: "multiply", args: [3617, 3623]});
assert.deepEqual(prefix[3627], {op: "multiply", args: [3617, 3626]});
assert.deepEqual(prefix[3746], {op: "log_positive", args: [3624]});
assert.deepEqual(prefix[3747], {op: "log_positive", args: [3627]});
assert.deepEqual(prefix[3749], {op: "exp", args: [3748]});
assert.deepEqual(prefix[3752], {op: "multiply", args: [3679, 3749]});
assert.deepEqual(prefix[3753], {op: "log_positive", args: [3752]});
assert.deepEqual(prefix[3679], {op: "inverse", args: [3617]});

const {ActualConvergentExpressions} = await import(pathToFileURL(path.resolve(library)));
const {ActualInductionExpressions} = await import(pathToFileURL(path.resolve(adapter)));
const G = new ActualInductionExpressions(new ActualConvergentExpressions(), {maxNodes: 1500000});
G.nodes = prefix;
G.lookup = new Map(prefix.map(({op, args}, id) => [JSON.stringify([op, args]), id]));
G.expressionSystems = JSON.parse(registry.expression);
G.picardSystems = picard;
G.quadraticSystems = JSON.parse(registry.quadratic);
G.monotoneSystems = JSON.parse(registry.monotone);
G.derivatives = new Map();
G.substitutions = new Map();
G.dependencyCache = new Map();
G.expressionMaterializations = new Map();
G.serial = 4000000;

function children({op, args}) {
  if (["coordinate", "source_parameter", "rational"].includes(op)) return [];
  if (["integer_power", "source_step_derivative"].includes(op)) return [args[0]];
  if (op === "actual_natural_series") return [args[1], args[2]];
  if (["actual_background_picard", "actual_background_even_profile"].includes(op)) return [args[2], args[3]];
  if (op === "actual_expression_partial") return args[1];
  if (op === "actual_quadratic_root") return args.slice(2);
  if (op === "actual_monotone_root") return args.slice(1);
  if (op === "definite_integral") return [args[0], args[2], args[3]];
  return args.filter(Number.isSafeInteger);
}
const [caller, {args: [system, component, X, eta, radialOrder, etaOrder]}] = replayTargets[0];
assert.deepEqual([system, component, X, eta, radialOrder, etaOrder], [3, 1, 120241, 2, 2, 1]);
const expression = G.materializePicardEvenDerivative(system, component, X, eta, radialOrder, etaOrder);
const todo = [expression], seen = new Set();
while (todo.length) {
  const id = todo.pop();
  if (seen.has(id)) continue;
  seen.add(id);
  const node = G.nodes[id];
  const edges = children(node);
  assert(edges.every(child => child < id), JSON.stringify({id, node, edges}));
  todo.push(...edges);
}
const ids = [...seen].sort((a,b) => a-b);
const natural = ids.filter(id=>id > prefixEnd && G.nodes[id].op === "actual_natural_series");
const targets = natural.filter(id=>G.nodes[id].args[1] === 3845);
assert.equal(targets.length, 1);
assert.equal(G.nodes[targets[0]].args[2], eta);
const result = {
  schema: "MathScope.Y.N4.B22SingleSiteMovingEndpoint/1", graphSha, nodeCount, pins,
  caller, system, component, X, eta, radialOrder, etaOrder, expression, prefixEnd,
  freshNaturalCount: natural.length, targets, targetY: 3845,
  boundCoordinate: 3843, nodes: ids.map(id => [id, G.nodes[id]])
};
const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(result) + "\n"), {level: 9});
fs.writeFileSync(output, compressed);
console.log(JSON.stringify({caller, expression, reached: seen.size, freshNaturalCount: natural.length, targets, bytes: compressed.length}));
