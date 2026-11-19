import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {pathToFileURL} from "node:url";
import zlib from "node:zlib";

const [graphDir, reachPath, sourceDir, flowDir, output, control = "positive"] = process.argv.slice(2);
assert(output, "usage: replay_original_derivatives.mjs GRAPH_DIR REACHED SOURCE_DIR Y_HIGHER_FLOW OUTPUT [drop-binders|drop-guards]");
assert(["positive", "drop-binders", "drop-guards"].includes(control));
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
const replayTargets = originalDerivatives.filter(([, node]) => node.args[0] === 0);
assert.equal(replayTargets.length, 38);
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
function walk(root, cut = {}) {
  const todo = [root];
  const seen = new Set();
  while (todo.length) {
    const id = todo.pop();
    if (seen.has(id) || id <= prefixEnd) continue;
    seen.add(id);
    const node = G.nodes[id];
    const {op, args} = node;
    if (op === "definite_integral" && args[1] === cut.binder) todo.push(args[2], args[3]);
    else if (op === "smooth_piecewise" && args[0] === cut.square && args[1] === 3617) todo.push(...args.slice(0, 4));
    else todo.push(...children(node));
  }
  return seen;
}
function witness(root, target, cut) {
  const alternatives = [{id: root, parent: null, childIndex: null}];
  const seen = new Set();
  while (alternatives.length) {
    const step = alternatives.pop();
    if (seen.has(step.id) || step.id <= prefixEnd) continue;
    seen.add(step.id);
    const node = G.nodes[step.id];
    const {op, args} = node;
    if (step.id === target) {
      const route = [];
      for (let edge = step; edge; edge = edge.parent) route.unshift({id: edge.id, ...G.nodes[edge.id], childIndex: edge.childIndex});
      return route;
    }
    const edges = op === "smooth_piecewise" && args[0] === cut.square && args[1] === 3617 ? args.slice(0, 4) : children(node);
    for (const [index,id] of edges.entries()) alternatives.push({id, parent: step, childIndex: index});
  }
  return [];
}
function factors(id) {
  const node = G.nodes[id];
  return node.op === "multiply" ? node.args.flatMap(factors) : [id];
}
// The tuple normalizes to Lambda^lambda * Xa^xa * product(squares).
// Every log argument has exactly this positive-monomial grammar on its
// selected branch, and each square is subsequently checked against its guard.
function monomial(id) {
  if (id === 3454) return {lambda: 1, xa: 0, squares: [], logs: 0};
  if (id === 3617) return {lambda: 0, xa: 1, squares: [], logs: 0};
  if (id === 3679) return {lambda: 0, xa: -1, squares: [], logs: 0};
  if (id === 474) return {lambda: 1, xa: 1, squares: [], logs: 0};
  if (id === 3623 || id === 3626) return {lambda: 0, xa: 0, squares: [], logs: 0, timePower: id === 3623 ? 1 : 2};
  const {op, args} = G.nodes[id];
  if (op === "integer_power" && args[1] === 2) return {lambda: 0, xa: 0, squares: [id], logs: 0};
  if (op === "multiply") {
    const left = monomial(args[0]), right = monomial(args[1]);
    return {lambda: left.lambda + right.lambda, xa: left.xa + right.xa, squares: [...left.squares, ...right.squares], logs: left.logs + right.logs, timePower: (left.timePower ?? 0) + (right.timePower ?? 0)};
  }
  if (op === "exp" && G.nodes[args[0]].op === "log_positive") {
    const inner = monomial(G.nodes[args[0]].args[0]);
    return {...inner, logs: inner.logs + 1};
  }
  throw new Error("Unexpected natural operand subexpression: " + JSON.stringify(displayTree(id)));
}
function countBy(rows, key) {
  const counts = {};
  for (const row of rows) counts[key(row)] = (counts[key(row)] ?? 0) + 1;
  return counts;
}
function baselineTime(id) {
  const n = G.nodes[id];
  if (n.op !== "multiply" || !n.args.includes(474)) return undefined;
  const exp = G.nodes[n.args.find((arg) => arg !== 474)];
  if (exp.op !== "exp") return undefined;
  const [u] = exp.args;
  return G.nodes[u].op === "coordinate" ? u : undefined;
}
function displayTree(id, depth = 12) {
  if (depth === 0 || id <= prefixEnd || !G.nodes[id]) return id;
  return [id, G.nodes[id].op, ...children(G.nodes[id]).map((child) => displayTree(child, depth - 1))];
}

const rows = [];
const violations = [];
for (const [caller, {args: [system, component, X, eta, radialOrder, etaOrder]}] of replayTargets) {
  assert.equal(eta, 2);
  assert.deepEqual(picard[system].radialDomain, [0, 24806]);
  assert([1, 2].includes(radialOrder));
  const expression = G.materializePicardEvenDerivative(system, component, X, eta, radialOrder, etaOrder);
  const seen = walk(expression);
  const natural = [...seen].filter((id) => G.nodes[id].op === "actual_natural_series");
  const byY = Map.groupBy(natural, (id) => G.nodes[id].args[1]);
  const ownersByBinder = Map.groupBy([...seen].filter((id) => G.nodes[id].op === "definite_integral"), (id) => G.nodes[id].args[1]);
  const binderCuts = new Map(), guardCuts = new Map();
  function survivingAfterBinderCut(binder, targets) {
    if (!binderCuts.has(binder)) binderCuts.set(binder, control === "drop-binders" ? seen : walk(expression, {binder}));
    return targets.filter((id) => binderCuts.get(binder).has(id));
  }
  const groups = [];
  for (const [Y, targets] of byY) {
    assert(targets.every((id) => G.nodes[id].args[2] === eta), "Unexpected eta argument of " + targets);
    const time = baselineTime(Y);
    if (time !== undefined) {
      const owners = ownersByBinder.get(time) ?? [];
      const intervals = owners.map((id) => G.nodes[id].args.slice(2));
      assert(owners.length > 0 && intervals.every(([left,right]) => left === 3612 && [3625, 3753].includes(right)), JSON.stringify({caller, Y, time, intervals}));
      const surviving = survivingAfterBinderCut(time, targets);
      if (surviving.length) violations.push({caller, Y, missing: "baseline time binder", binder: time, surviving: surviving.length});
      const integralOwners = [{binder: time, owners, surviving: surviving.length}];
      if (intervals.some(([,right]) => right === 3753)) {
        const logarithmOwners = ownersByBinder.get(3748) ?? [];
        assert(logarithmOwners.length > 0 && logarithmOwners.every((id) => G.nodes[id].args[2] === 3746 && G.nodes[id].args[3] === 3747), JSON.stringify({caller,Y,time,logarithmOwners}));
        const survivingLog = survivingAfterBinderCut(3748, targets);
        if (survivingLog.length) violations.push({caller, Y, missing: "outer B22 logX binder", binder: 3748, surviving: survivingLog.length});
        integralOwners.push({binder: 3748, owners: logarithmOwners, surviving: survivingLog.length});
      }
      groups.push({Y, kind: "baseline-time", targets, integralOwners});
      continue;
    }
    let normal;
    try {
      normal = monomial(Y);
    } catch (err) {
      throw new Error(JSON.stringify({caller, system, component, X, radialOrder, etaOrder, Y, operand: displayTree(Y, 19)}), {cause: err});
    }
    const {lambda, xa, squares, logs, timePower = 0} = normal;
    if (squares.length === 0 && lambda === 1 && xa === 1 && timePower <= 2) {
      groups.push({Y, kind: "fixed-time", targets, timePower});
      continue;
    }
    const [square] = squares;
    const kind = logs === 0 ? "direct" : logs + "-log";
    const context = JSON.stringify({caller, system, component, X, radialOrder, etaOrder, Y, kind, square, operands: G.nodes[Y]});
    assert.deepEqual([lambda, xa, squares.length, timePower], [1, 0, 1, 0], context);
    const Xroot = G.sqrt(X);
    const radialFactors = factors(G.nodes[square].args[0]);
    assert.equal(radialFactors.filter((factor) => factor === Xroot).length, 1, context);
    const binders = radialFactors.filter((factor) => factor !== Xroot);
    const names = binders.map((binder) => G.nodes[binder].op === "coordinate" ? G.nodes[binder].args[0] : "");
    assert(names.every((name) => /^(induction_even_X|actual_Picard_radial_average)/.test(name)), context);
    assert.equal(names.filter((name) => name.startsWith("induction_even_X")).length, radialOrder, context);
    const integralOwners = [];
    for (const binder of new Set(binders)) {
      const owners = ownersByBinder.get(binder) ?? [];
      assert(owners.length > 0, context);
      assert(owners.every((id) => G.nodes[id].args[2] === G.zero && G.nodes[id].args[3] === G.one), context);
      const surviving = survivingAfterBinderCut(binder, targets);
      if (surviving.length) violations.push({caller, Y, missing: "binder", binder, surviving: surviving.length});
      integralOwners.push({binder, owners, surviving: surviving.length});
    }
    if (kind !== "direct" && !guardCuts.has(square)) guardCuts.set(square, control === "drop-guards" ? seen : walk(expression, {square}));
    const afterGuardCut = kind === "direct" ? null : guardCuts.get(square);
    const guardedReach = afterGuardCut ? targets.filter((id) => afterGuardCut.has(id)).length : null;
    if (guardedReach) {
      const sample = targets.find((id) => afterGuardCut.has(id));
      const route = control === "positive" ? witness(expression, sample, {square}) : [];
      violations.push({caller, Y, missing: "positive-log guard", square, surviving: guardedReach, sample, route});
    }
    groups.push({Y, kind, square, targets, integralOwners, guardedReach});
  }
  assert(natural.length > 0, "No generated natural nodes for " + caller);
  rows.push({caller, system, component, X, eta, radialOrder, etaOrder, expression, ancestors: seen.size, natural: natural.length, groups});
}
const all = rows.flatMap(({groups}) => groups.flatMap(({targets}) => targets));
const kindCounts = {};
for (const {groups} of rows) for (const {kind, targets} of groups) kindCounts[kind] = (kindCounts[kind] ?? 0) + targets.length;
assert.equal(rows.length, replayTargets.length);
assert(control === "positive" || violations.length > 0);
const result = {
  status: control === "positive" ? (violations.length ? "OPEN_GUARD_PATHS" : "PASS_ORIGINAL_N4_DYNAMIC_RADIAL_NATURAL_INPUTS") : "NEGATIVE_CONTROL",
  control, graphSha, nodeCount, pins, originalProfileSites: 259, originalPositiveRadialSitesAcrossSystems: originalDerivatives.length,
  originalSystem: 0, originalPositiveRadialSites: rows.length,
  originalPositiveRadialSitesByDerivative: countBy(rows, r => r.radialOrder),
  generatedNaturalOccurrences: all.length, distinctGeneratedNaturalNodes: new Set(all).size,
  kindCounts, violations, rows,
  open: ["positive radial sites of higher systems and typed definition descent from generated calls", "r=0 source data and arbitrary-order caller graphs", "native actual infinite limit semantics", "regularity and equality of actual native derivative with ordinary Picard limit"]
};
fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({...result, violations: violations.length, rows: rows.length}, null, 2));
