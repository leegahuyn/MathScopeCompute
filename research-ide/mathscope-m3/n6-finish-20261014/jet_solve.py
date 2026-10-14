"""Further independent jet proofs: finite-integral calculus and theta fibers.

All original source bindings are retained. In particular, theta differentiation
does not require a slow-label or torus-copy gluing assertion when EVERY switch
is independently proved theta independent. The complete 162 rows are expanded;
no local row is substituted for the original indexed source field.
"""
from __future__ import annotations
from collections import Counter, defaultdict
import copy
from fractions import Fraction as Q
import hashlib
import json
from pathlib import Path
import sys
import time

OLD = Path(__file__).resolve().parent.parent / "n6-cloud-20261014"
if str(OLD) not in sys.path:
    sys.path.insert(0, str(OLD))
from jet_worker import (SourceCalculus, BudgetStop, PARENT, EXPRESSION_OPS,
                        definition_key, file_hash, js_hash, read, require,
                        slow_root_all_order_theorem, validate_inputs, write)
from guard_worker import (Parameters, PROFILE_SHA, STEP_SHA, step_lemma,
                          fact, rational, combine, inverse, power, unary,
                          nonzero, positive)


class DirectionalSourceCalculus(SourceCalculus):
    def __init__(self, witnesses, definitions, parameters=None, **kwargs):
        super().__init__(witnesses, definitions, **kwargs)
        self.parameters = parameters
        self.expression_support_cache = {}
        self.regularity_cache = {}
        self.theta_identities = {}
        self.theta_expansions = {}
        self.leibniz_certificates = []
        self.selector_certificates = []
        self.fiber_constant_uses = []
        self._fresh_coordinate = -1

    def fresh_coordinate(self):
        value = self._fresh_coordinate
        self._fresh_coordinate -= 1
        return value, self.put("coordinate", ["independent-capture-free-integral:"+str(-value), value])

    def expression_support(self, ident):
        self.tick()
        if ident in self.expression_support_cache:
            return self.expression_support_cache[ident]
        n = self.nodes[ident]
        op, a = n["op"], n["args"]
        if op == "coordinate":
            result = frozenset({a[1]}), frozenset()
        elif op in {"rational", "source_parameter"}:
            result = frozenset(), frozenset()
        elif op == "source_value":
            support, unknown = self.source_support(a[0])
            env = dict(a[1])
            coords, stops = set(), set(unknown)
            for coordinate in support:
                if coordinate in env:
                    c, u = self.expression_support(env[coordinate])
                    coords.update(c);stops.update(u)
                else:
                    coords.add(coordinate)
            result = frozenset(coords), frozenset(stops)
        elif op == "definite_integral":
            coords, stops = set(), set()
            for j, child in enumerate([a[0], a[2], a[3]]):
                c, u = self.expression_support(child)
                coords.update(c-{a[1]} if j == 0 else c);stops.update(u)
            result = frozenset(coords), frozenset(stops)
        elif op in {"integer_power", "source_step_derivative"}:
            result = self.expression_support(a[0])
        elif op in {"add", "multiply", "maximum", "smooth_piecewise", "inverse", "exp", "log_positive", "sqrt_positive", "sine", "cosine", "ceiling"}:
            coords, stops = set(), set()
            for child in a:
                c, u = self.expression_support(child);coords.update(c);stops.update(u)
            result = frozenset(coords), frozenset(stops)
        else:
            # In particular an unproved earlier derivative cannot be erased
            # merely because a later differentiation coordinate is absent.
            result = frozenset(), frozenset({f"unproved-expression:{ident}:{op}"})
        self.expression_support_cache[ident] = result
        return result

    def independent_of(self, ident, variables):
        coordinates, unreviewed = self.expression_support(ident)
        return not unreviewed and not coordinates.intersection(variables)

    def reachable(self, root):
        seen, stack, stops = set(), [root], []
        while stack:
            ident = stack.pop()
            if ident in seen:
                continue
            seen.add(ident)
            n = self.nodes[ident];op, a = n["op"], n["args"]
            if op == "source_value":
                stack.extend(value for _, value in a[1])
            elif op in {"rational", "coordinate", "source_parameter"}:
                pass
            elif op in {"integer_power", "source_step_derivative"}:
                stack.append(a[0])
            elif op == "definite_integral":
                # The binder is a literal original/alpha-renamed coordinate.
                # An unproved derivative of an integral remains an explicit
                # stop; a proper integral VALUE is an allowed scalar value.
                stack.extend([a[0], a[2], a[3]])
            elif op in {"add", "multiply", "maximum", "smooth_piecewise", "inverse", "exp", "log_positive", "sqrt_positive", "sine", "cosine", "ceiling"}:
                stack.extend(a)
            else:
                stops.append({"formulaNode": ident, "node": n})
        return {"nodes": len(seen), "stops": stops}

    def substitute(self, ident, replacements, cache=None):
        n = self.nodes[ident]
        if n["op"] != "definite_integral":
            return super().substitute(ident, replacements, cache)
        self.tick()
        a = n["args"]
        body, binder = a[:2]
        replacement_support = set()
        for variable, value in replacements.items():
            if variable != binder:
                support, unknown = self.expression_support(value)
                if unknown:
                    return self.put("uncomputed_capture_free_substitution", [ident, sorted(replacements.items())])
                replacement_support.update(support)
        body_replacements = {k: v for k, v in replacements.items() if k != binder}
        if binder in replacement_support:
            renamed, renamed_expr = self.fresh_coordinate()
            body = self.substitute(body, {binder: renamed_expr})
            binder = renamed
        return self.put("definite_integral", [self.substitute(body, body_replacements), binder,
                        self.substitute(a[2], replacements), self.substitute(a[3], replacements)])

    def expand(self, ident, env=()):
        n = self.source.get(ident)
        if n and n["op"] == "m3_aux_indexed_partial":
            key = ident, tuple(env)
            if key not in self.theta_expansions:
                orders = n["args"][2]
                d = self.defs[definition_key(n)]["definition"]
                theta = next((v for v in d.get("directions", []) if self.source.get(v, {}).get("args", [""])[0] == "m3_global_band_angle$6"), None)
                # Exact source geometry is supplied by the caller; synthetic
                # and noncanonical bindings may set this explicitly.
                theta = getattr(self, "theta_source_coordinate", theta)
                if theta in d.get("directions", []) and all(order == 0 or direction == theta for order, direction in zip(orders, d["directions"])):
                    identity = self.indexed_theta_identity(ident, theta=theta, env=env)
                    self.theta_expansions[key] = identity["formulaRoot"]
                else:
                    self.theta_expansions[key] = super().expand(ident, env)
            return self.theta_expansions[key]
        return super().expand(ident, env)

    def indexed_theta_identity(self, source_id, theta=None, env=()):
        """Exact pure-theta source atom identity, with all source rows.

        Stored partials are differentiated at FORMAL parameters first, then
        simultaneously applied to every original argument. An arbitrary
        caller substitution never freezes a changing source selector.
        """
        n = self.source[source_id]
        require(n["op"] == "m3_aux_indexed_partial", "not an original auxiliary indexed source atom")
        key = definition_key(n)
        binding = self.defs[key];d = binding["definition"]
        theta = theta if theta is not None else self.theta_source_coordinate
        require(theta in d["directions"] and theta in d["parameters"], "actual physical-angle direction absent")
        theta_direction = d["directions"].index(theta)
        orders = n["args"][2]
        require(len(orders) == len(d["directions"]) and all(order == 0 or j == theta_direction for j, order in enumerate(orders)), "non-pure-theta original partial requires its own calculus proof")
        cache_key = source_id, theta, tuple(env)
        if cache_key in self.theta_identities:
            return self.theta_identities[cache_key]
        audit = self.capture_audit(source_id)
        require(audit["pass"], "complete indexed source capture closure unproved")
        require(len(d["rows"]) == 162 or getattr(self, "allow_synthetic_cover", False), "original complete 162-row cover changed")
        terms, row_proofs = [], []
        for index, row in enumerate(d["rows"]):
            op = "m3_aux_expression_partial" if row["localSystem"] < 0 else "actual_expression_partial"
            local_key = definition_key({"op": op, "args": [row["localSystem"]]})
            local = self.defs[local_key]["definition"]
            require(local["body"] == row["localBody"] and local["parameters"] == row["localParameters"], "original indexed local-body binding changed")
            require(theta in local["parameters"], "local original physical angle parameter absent")
            local_theta = local["parameters"].index(theta)
            require(row["values"][local_theta] == theta, "original local theta value is not the actual identity argument")
            declared = row["derivativeMaps"][theta_direction]
            require(len(declared) == 1 and declared[0]["parameter"] == local_theta and self.source[declared[0]["coefficient"]] == {"op": "rational", "args": ["1", "1"]}, "source theta chart Jacobian is not the independently verified identity")
            for j, value in enumerate(row["values"]):
                if j != local_theta:
                    support, unknown = self.source_support(value)
                    require(not unknown and theta not in support, "a non-angle local argument varies in physical theta")
            for value in [row["coefficient"], *sum(row.get("guards", []), [])]:
                support, unknown = self.source_support(value)
                require(not unknown and theta not in support, "an original row coefficient/selector changes along theta")
            local_env = tuple(zip(local["parameters"], [self.ref(value) for value in row["values"]]))
            body = self.mul(self.ref(row["coefficient"]), self.ref(local["body"], local_env))
            for guard in row.get("guards", []):
                body = self.put("smooth_piecewise", [*(self.ref(x) for x in guard), self.zero, body, self.zero])
            terms.append(body)
            row_proofs.append({"row": index, "label": row.get("label"), "localDefinitionKey": local_key,
                               "localDefinitionSHA256": self.defs[local_key]["definitionSHA256"],
                               "localBody": local["body"], "allOtherInputsAndGuardsThetaIndependent": True,
                               "actualThetaArgumentAndJacobianIdentityVerified": True})
        formal = self.add(*terms)
        for _ in range(orders[theta_direction]):
            formal = self.d(formal, theta)
        argument_env = {parameter: self.ref(value, env) for parameter, value in zip(d["parameters"], n["args"][1])}
        root = self.substitute(formal, argument_env)
        remaining = self.reachable(root)["stops"]
        result = {"sourceNode": source_id, "sourceNodeSHA256": js_hash(n), "definitionKey": key,
                  "definitionSHA256": binding["definitionSHA256"], "orders": orders,
                  "formalThetaSourceCoordinate": theta, "formulaRoot": root, "rowProofs": row_proofs,
                  "allOriginalRowsRetained": True, "originalRows": len(terms),
                  "storedPartialsTakenBeforeCompleteSimultaneousApplication": True,
                  "provedOnOriginalLeafDefinedDomain": not remaining, "remainingStops": remaining,
                  "slowLabelOrTorusCopyJoinsAssumed": False, "globalFullFieldSourceDomainProved": False}
        self.theta_identities[cache_key] = result
        return result

    def regularity(self, ident, parameters, binder=None):
        """Fiber C-infinity and finite-interval domination proof.

        Unknown source values are allowed only when NONE of the varying
        parameters or the integration variable changes any of their inputs.
        A primitive denominator's unresolved sign is allowed only when its
        entire argument is independent of the integration variable: its
        original definedness then supplies one open parameter collar.
        """
        directions = frozenset(parameters) | ({binder} if binder is not None else set())
        key = ident, directions, binder
        if key in self.regularity_cache:
            return self.regularity_cache[key]
        self.tick()
        n = self.nodes[ident];op, a = n["op"], n["args"]
        certificates, premises = [], []
        if op == "rational":
            value = rational(Q(*map(int, a)))
        elif op == "source_parameter" and self.parameters is not None:
            value = self.parameters.parameter(a[0])
        elif op == "source_value" and self.source.get(a[0], {}).get("op") in {"rational", "coordinate", "source_parameter"}:
            result = self.regularity(self.expand(a[0], tuple(map(tuple, a[1]))), parameters, binder)
            self.regularity_cache[key] = result
            return result
        elif self.independent_of(ident, directions):
            value = fact(finite=True, smooth=True, stops=())
            certificates.append({"rule": "DEFINED_SOURCE_VALUE_CONSTANT_IN_ALL_VARYING_DIRECTIONS", "formulaNode": ident, "directions": sorted(directions)})
        elif op == "coordinate":
            value = fact(finite=True, smooth=True)
        elif op == "source_value":
            expanded = self.expand(a[0], tuple(map(tuple, a[1])))
            if self.nodes[expanded]["op"] in {"unexpanded_source_value", "unexpanded_registry_value", "missing_source_value"}:
                value = fact(stops={"varying original limit/function coefficient has no independent C-infinity proof"})
            else:
                result = self.regularity(expanded, parameters, binder)
                self.regularity_cache[key] = result
                return result
        elif op in {"add", "multiply"}:
            children = [self.regularity(x, parameters, binder) for x in a]
            value = combine(op, [x["fact"] for x in children])
            for child in children:
                certificates.extend(child["certificates"]);premises.extend(child["premises"])
        elif op == "integer_power":
            child = self.regularity(a[0], parameters, binder)
            value = power(child["fact"], a[1]);certificates.extend(child["certificates"]);premises.extend(child["premises"])
        elif op in {"inverse", "log_positive", "sqrt_positive"}:
            child = self.regularity(a[0], parameters, binder)
            certificates.extend(child["certificates"]);premises.extend(child["premises"])
            argument = child["fact"]
            condition = nonzero(argument) if op == "inverse" else positive(argument)
            if not condition and argument["finite"] and argument["smooth"] and binder is not None and self.independent_of(a[0], {binder}):
                premises.append({"kind": "ORIGINAL_ACTIVE_PRIMITIVE_DEFINEDNESS", "operation": op, "argumentFormulaNode": a[0], "required": "nonzero" if op == "inverse" else "positive", "constantInIntegrationVariableVerified": True, "impliedByOriginalProperIntegralDefinednessOnActiveBranch": True})
                value = fact(finite=True, smooth=True)
            else:
                value = inverse(argument) if op == "inverse" else unary(op, argument)
        elif op in {"exp", "sine", "cosine"}:
            child = self.regularity(a[0], parameters, binder)
            value = unary(op, child["fact"]);certificates.extend(child["certificates"]);premises.extend(child["premises"])
        elif op == "source_step_derivative" and self.step_all_order_lemma is not None:
            child = self.regularity(a[0], parameters, binder)
            value = fact(finite=child["fact"]["finite"], smooth=child["fact"]["smooth"], stops=child["fact"]["stops"])
            certificates.extend(child["certificates"]);premises.extend(child["premises"])
        elif op == "smooth_piecewise" and all(self.independent_of(x, directions) for x in a[:3]):
            children = [self.regularity(x, parameters, binder) for x in a[3:]]
            value = fact(finite=all(x["fact"]["finite"] for x in children), smooth=all(x["fact"]["smooth"] for x in children), stops=set().union(*(x["fact"]["stops"] for x in children)))
            for child in children:
                certificates.extend(child["certificates"]);premises.extend(child["premises"])
        else:
            value = fact(stops={f"unproved varying source regularity: {op}"})
        result = {"fact": value, "certificates": certificates, "premises": premises}
        self.regularity_cache[key] = result
        return result

    def d(self, ident, variable):
        key = ident, variable
        if key in self.derivatives:
            return self.derivatives[key]
        n = self.nodes[ident];op, a = n["op"], n["args"]
        if self.independent_of(ident, {variable}):
            self.derivatives[key] = self.zero
            return self.zero
        if op == "smooth_piecewise" and all(self.independent_of(x, {variable}) for x in a[:3]):
            result = self.put(op, [*a[:3], *(self.d(x, variable) for x in a[3:])])
            self.selector_certificates.append({"formulaNode": ident, "sourceCoordinate": variable,
                                               "allSelectorArgumentsActuallyIndependent": True,
                                               "rule": "DIFFERENTIATE_EACH_FIXED_SELECTED_BRANCH_NO_JOIN_CROSSED"})
            self.derivatives[key] = result
            return result
        if op == "definite_integral":
            body, binder, left, right = a
            proof = self.regularity(body, {variable}, binder)
            endpoint_proofs = [self.regularity(x, {variable}) for x in [left, right]]
            passed = proof["fact"]["finite"] and proof["fact"]["smooth"] and all(x["fact"]["finite"] and x["fact"]["smooth"] for x in endpoint_proofs)
            certificate = {"formulaNode": ident, "sourceCoordinate": variable, "binderSourceCoordinate": binder,
                           "proved": passed, "integrandRegularityStops": sorted(proof["fact"]["stops"]),
                           "originalDefinednessPremises": proof["premises"],
                           "proof": "On every compact parameter collar contained in the original active primitive domain, the finite closed integration interval and the proved C-infinity integrand have bounded continuous derivatives of every fixed requested order. Compactness supplies the actual local dominating constant. Leibniz follows by dominated convergence, with both moving endpoint terms retained. No finite samples or a claimed registry derivative are used.",
                           "globalOriginalPDEDomainProved": False}
            self.leibniz_certificates.append(certificate)
            if passed:
                dl, dr = self.d(left, variable), self.d(right, variable)
                interior = self.zero if binder == variable else self.put("definite_integral", [self.d(body, variable), binder, left, right])
                upper = self.zero if dr == self.zero else self.mul(self.substitute(body, {binder: right}), dr)
                lower = self.zero if dl == self.zero else self.neg(self.mul(self.substitute(body, {binder: left}), dl))
                result = self.add(interior, upper, lower)
                self.derivatives[key] = result
                return result
        return super().d(ident, variable)


def latest_remaining(context, original):
    matrix = read(context["current_matrix_path"])
    require(matrix["parentNodesSHA256"] == PARENT, "current source parent changed")
    prior = {r["result"]: r for shard in matrix["stageA"] for r in shard["requests"]}
    require(len(prior) == 365, "current jet shard union incomplete")
    by_id = {r["result"]: r for r in original}
    require(set(prior) == set(by_id), "current original request IDs changed")
    remaining = []
    for ident, row in prior.items():
        require(row.get("originalRequest", by_id[ident]) == by_id[ident], "current original source request metadata changed")
        if not row["closedOnOriginalLeafDefinedDomain"]:
            remaining.append(by_id[ident])
    return matrix, remaining


def source_parameters(context):
    path = Path(context["repo"]) / "research-ide/mathscope-m2/navier/source-profile-data.mjs"
    require(file_hash(path) == PROFILE_SHA, "original exact source profile changed")
    raw = path.read_text(encoding="utf8")
    data = json.loads(raw.split("export const PINNED_N3 = ", 1)[1].strip().removesuffix(";"))
    return Parameters(data["parametersExactExpressions"])


FORMULA_UNARY = {"inverse", "exp", "log_positive", "sqrt_positive", "sine", "cosine", "ceiling"}
FORMULA_ALL_CHILDREN = {"add", "multiply", "maximum", "smooth_piecewise"}


def formula_semantic_hash(nodes, root):
    """Node-number-independent exact typed formula fingerprint."""
    memo = {}
    def visit(ident):
        require(type(ident) is int and 0 <= ident < len(nodes), "formula reference escaped its exact DAG")
        if ident in memo:
            return memo[ident]
        n = nodes[ident];op, a = n["op"], n["args"]
        if op in {"rational", "coordinate", "source_parameter"}:
            value = [op, a]
        elif op == "source_value":
            value = [op, a[0], sorted([coordinate, visit(child)] for coordinate, child in a[1])]
        elif op in {"integer_power", "source_step_derivative"}:
            value = [op, visit(a[0]), a[1]]
        elif op == "definite_integral":
            value = [op, visit(a[0]), a[1], visit(a[2]), visit(a[3])]
        elif op in FORMULA_UNARY | FORMULA_ALL_CHILDREN:
            children = [visit(x) for x in a]
            value = [op, sorted(children) if op in {"add", "multiply"} else children]
        else:
            raise ValueError("unproved derivative/source wrapper cannot enter an applied formula: "+op)
        memo[ident] = js_hash(value)
        return memo[ident]
    return visit(root)


class FormulaArena:
    def __init__(self):
        self.nodes, self.intern = [], {}
        self.zero = self.put("rational", ["0", "1"])

    def put(self, op, args):
        key = json.dumps([op, args], ensure_ascii=False, separators=(",", ":"))
        if key not in self.intern:
            self.intern[key] = len(self.nodes);self.nodes.append({"op": op, "args": args})
        return self.intern[key]

    def inline_formula(self, nodes, root, memo=None):
        memo = {} if memo is None else memo
        def visit(ident):
            if ident in memo:
                return memo[ident]
            n = nodes[ident];op, a = n["op"], n["args"]
            if op in {"rational", "coordinate", "source_parameter"}:
                out = self.put(op, a)
            elif op == "source_value":
                out = self.put(op, [a[0], [[coordinate, visit(child)] for coordinate, child in a[1]]])
            elif op in {"integer_power", "source_step_derivative"}:
                out = self.put(op, [visit(a[0]), a[1]])
            elif op == "definite_integral":
                out = self.put(op, [visit(a[0]), a[1], visit(a[2]), visit(a[3])])
            elif op in FORMULA_UNARY | FORMULA_ALL_CHILDREN:
                out = self.put(op, [visit(x) for x in a])
            else:
                raise ValueError("unproved formula wrapper refused by exact Cartesian importer: "+op)
            memo[ident] = out
            return out
        return visit(root)


def apply(context, results_root, out):
    """Independently replay new proofs and apply every verified exact formula.

    Original source function VALUES remain values with complete capture-free
    environments. No stored source derivative helper is used as an oracle.
    The resulting complete Cartesian expression graph is still conditional
    on its actual source domains and is not asserted to be a zero PDE.
    """
    sys.setrecursionlimit(max(sys.getrecursionlimit(), 20000))
    out = Path(out);out.mkdir(parents=True, exist_ok=True)
    checkpoint, previous, originals, original_program, source, definitions = validate_inputs(context)
    current, remaining = latest_remaining(context, originals)
    current_rows = {r["result"]: r for s in current["stageA"] for r in s["requests"]}
    remaining_by_id = {r["result"]: r for r in remaining}
    original_by_id = {r["result"]: r for r in originals}
    baseline = read(Path(context["baseline"]) / "cartesian-applied-pde-checkpoint.json")
    old_program = baseline["scalarProgram"];old_map = baseline["originalScalarNodeToClosedScalarNode"]
    arena = FormulaArena();substitutions, proofs = {}, []
    verify = SourceCalculus(source, definitions, max_work=80000000, max_nodes=600000)
    previous_applied = current.get("cloudExecution", {}).get("jetApplication", {}).get("newAppliedOriginalResults", [])
    for result_id in previous_applied:
        row = current_rows[result_id];request = original_by_id[result_id]
        require(row["closedOnOriginalLeafDefinedDomain"] and row.get("exactValue") == "0" and row.get("lemma") == "FIRST_ABSENT_INPUT_THEN_DERIVATIVES_OF_ZERO", "unrecognized previous applied jet proof")
        require(verify.capture_audit(request["baseSourceNode"])["pass"], "previous zero rule's actual capture proof failed")
        support, unknown = verify.source_support(request["baseSourceNode"])
        first = original_program[request["orderedDifferentiationCoordinates"][0]]["args"][1]
        require(not unknown and first not in support, "previous zero rule failed independent support replay")
        substitutions[old_map[result_id]] = arena.zero
    parameters = source_parameters(context)
    theta = checkpoint["cartesian"]["sourceGeometry"]["theta"]
    step = step_lemma();slow = slow_root_all_order_theorem(source, definitions)
    step_path = Path(context["repo"]) / "research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs"
    require(file_hash(step_path) == STEP_SHA, "source step changed before final application")
    by_family = defaultdict(list);seen_requests = set();received = []
    for path in sorted(Path(results_root).rglob("jet-solve-shard-*-result.json")):
        data = read(path)
        require(data["sourceParentSHA256"] == PARENT and data["currentMatrixSHA256"] == file_hash(context["current_matrix_path"]), "new jet result uses a different original/current checkpoint")
        received.append({"path": str(path.relative_to(results_root)), "sha256": file_hash(path), "attempted": data["attemptedRemainingRequests"]})
        for row in data["rows"]:
            ident = row["originalScalarResult"]
            require(ident in remaining_by_id and ident not in seen_requests, "new request identity missing/duplicated")
            seen_requests.add(ident)
            require(row["originalRequest"] == remaining_by_id[ident], "new proof changed original source request")
            if row["newClosedOnLeafDefinedDomain"]:
                by_family[row["originalRequest"]["actualDefinitionKey"]].append((path.parent, row))
    shared_support, shared_capture, shared_system = {}, {}, {}
    for family, family_rows in sorted(by_family.items()):
        calc = DirectionalSourceCalculus(source, definitions, parameters, max_work=160000000, max_nodes=900000)
        calc.theta_source_coordinate = theta;calc.step_all_order_lemma = step;calc.slow_root_image_theorem = slow
        calc.support_cache = shared_support;calc.capture_cache = shared_capture;calc.system_capture_cache = shared_system
        loaded, imported = {}, {}
        for folder, row in family_rows:
            artifact = row["formulaArtifact"]
            path = (folder / artifact["path"]).resolve()
            require(path.is_relative_to(folder.resolve()) and file_hash(path) == artifact["sha256"], "new exact formula artifact changed")
            if path not in loaded:
                loaded[path] = read(path)
                require(loaded[path]["sourceParentSHA256"] == PARENT and loaded[path]["definitionSHA256"] == definitions[family]["definitionSHA256"], "formula source body binding changed")
                imported[path] = {}
            graph = loaded[path]["nodes"]
            request = row["originalRequest"]
            require(calc.capture_audit(request["baseSourceNode"])["pass"], "new formula source capture replay failed")
            independently_derived = calc.ref(request["baseSourceNode"])
            for coordinate in request["orderedDifferentiationCoordinates"]:
                independently_derived = calc.d(independently_derived, original_program[coordinate]["args"][1])
            require(not calc.reachable(independently_derived)["stops"], "new exact formula replay retained an analytic stop")
            claimed_hash = formula_semantic_hash(graph, row["formulaRoot"])
            require(formula_semantic_hash(calc.nodes, independently_derived) == claimed_hash, "independent new derivative formula disagreed")
            target = old_map[request["result"]]
            require(target not in substitutions, "new proof overwrote a previously applied jet")
            require(old_program[target] == {"op": "unresolved_total_source_jet", "args": [old_map[request["base"]], [old_map[x] for x in request["orderedDifferentiationCoordinates"]]]}, "original->closed scalar request mapping changed")
            substitutions[target] = arena.inline_formula(graph, row["formulaRoot"], imported[path])
            proofs.append({"requestId": row["requestId"], "originalResult": request["result"], "originalSourceNode": request["baseSourceNode"],
                           "formulaArtifactSHA256": artifact["sha256"], "formulaSemanticSHA256": claimed_hash,
                           "independentDerivativeReplayPassed": True, "newCartesianFormulaRoot": substitutions[target],
                           "globalSourceDomainProved": False})
    mapping = {}
    def visit(ident):
        if ident in mapping:
            return mapping[ident]
        if ident in substitutions:
            result = substitutions[ident]
        else:
            n = old_program[ident];op, a = n["op"], n["args"]
            if op in {"rational", "coordinate", "source_parameter", "actual_opaque_value"}:
                result = arena.put(op, a)
            elif op == "unresolved_total_source_jet":
                result = arena.put(op, [visit(a[0]), [visit(x) for x in a[1]]])
            elif op in {"integer_power", "source_step_derivative"}:
                result = arena.put(op, [visit(a[0]), a[1]])
            elif op in {"add", "multiply"}:
                children = [visit(x) for x in a]
                if op == "multiply" and arena.zero in children:
                    result = arena.zero
                else:
                    children = [x for x in children if op != "add" or x != arena.zero]
                    result = arena.zero if not children else children[0] if len(children) == 1 else arena.put(op, children)
            elif op in FORMULA_UNARY | {"maximum", "smooth_piecewise", "unresolved_opaque_substitution", "definite_integral"}:
                # Old Cartesian integral binders are scalar coordinate refs;
                # new formula integral binders are literal source IDs, with
                # their distinct source_grammar documented below.
                result = arena.put("cartesian_original_integral" if op == "definite_integral" else op, [visit(x) for x in a])
            else:
                raise ValueError("unreviewed original Cartesian scalar grammar: "+op)
        mapping[ident] = result
        return result
    for ident in range(len(old_program)):
        visit(ident)
    applied = copy.deepcopy(baseline)
    applied["schema"] = "MathScope.N6.FinishAppliedCartesianJetProofs/1"
    applied["scalarProgram"] = arena.nodes
    applied["originalScalarNodeToClosedScalarNode"] = [mapping[x] for x in old_map]
    for key in ["cartesianVelocity", "advectiveResidual", "conservativeResidual", "backToCylindrical"]:
        if key in baseline:
            applied[key] = [mapping[x] for x in baseline[key]]
    if baseline.get("divergence") is not None:
        applied["divergence"] = mapping[baseline["divergence"]]
    for row in applied.get("jets", []):
        for key in ["cartesianVelocity", "time", "laplacian", "pressureGradient"]:
            row[key] = mapping[row[key]]
        row["spatial"] = [mapping[x] for x in row["spatial"]]
    new_ids = {row["originalResult"] for row in proofs}
    applied["remainingOriginalRequests"] = [r for r in remaining if r["result"] not in new_ids]
    applied.update(newSourceJetProofs=proofs, priorAdditionalZeroRulesIndependentlyRechecked=len(previous_applied),
                   formulaIntegralBinderGrammar="definite_integral uses original/alpha-renamed source-coordinate literal; cartesian_original_integral uses scalar coordinate reference", 
                   sourceValueGrammar="source_value [originalSourceID, simultaneous capture-free environment coordinate->scalarID]; all original node/registry hashes are retained by checkpoint inputs",
                   allGlobalDomainGuardsDischarged=False, actualCartesianPDEVerified=False, originalN601Complete=False, originalN602Complete=False)
    artifact = write(out / "jet-solve-applied-cartesian-checkpoint.json", applied)
    evidence = write(out / "jet-solve-application-source-prefix-witnesses.json", source.evidence())
    result = {"schema": "MathScope.N6.FinishJetApplication/1", "sourceParentSHA256": PARENT,
              "currentMatrixSHA256": file_hash(context["current_matrix_path"]), "receivedShards": received,
              "attemptedRemainingRequests": len(seen_requests), "priorAdditionalJetsApplied": len(previous_applied),
              "newExactJetsIndependentlyReplayedAndApplied": len(proofs), "newAppliedOriginalResults": sorted(new_ids),
              "remainingLeafJets": len(remaining)-len(proofs), "newScalarNodes": len(arena.nodes),
              "appliedCartesianCheckpoint": artifact, "sourcePrefixEvidence": evidence,
              "newUnconditionalJetsProved": 0, "wholeCartesianPDEProved": False, "N6-01": "OPEN", "N6-02": "PARTIAL"}
    write(out / "jet-solve-application-result.json", result)
    return result


def new_request_row(original, program):
    """Retain original meaning and serialize the strict verifier bindings."""
    row = copy.deepcopy(original)
    row.update({"requestId": f"cartesian-result:{original['result']}", "originalRequest": copy.deepcopy(original),
                "originalMinimalObligation": copy.deepcopy(original.get("minimalObligation")),
                "originalScalarResult": original["result"], "baseSourceNode": original["baseSourceNode"],
                "originalSourceNodeSHA256": js_hash(original["actualSourceNode"]),
                "orderedSourceCoordinates": [program[x]["args"][1] for x in original["orderedDifferentiationCoordinates"]],
                "calculationAttempted": True, "derivativeComputed": False,
                "newClosedOnLeafDefinedDomain": False, "newUnconditionalJetProved": False,
                "globalOriginalPDEDomainProved": False})
    return row


def run(context, out, shard=0, shards=4):
    sys.setrecursionlimit(max(sys.getrecursionlimit(), 20000))
    started = time.monotonic();out = Path(out);out.mkdir(parents=True, exist_ok=True)
    checkpoint, previous, originals, program, source, definitions = validate_inputs(context)
    current, remaining = latest_remaining(context, originals)
    theta = checkpoint["cartesian"]["sourceGeometry"]["theta"]
    families = sorted({r["actualDefinitionKey"] for r in remaining})
    assigned = {key for i, key in enumerate(families) if i % shards == shard}
    grouped = defaultdict(list)
    for request in remaining:
        if request["actualDefinitionKey"] in assigned:
            grouped[request["actualDefinitionKey"]].append(request)
    rows, family_records = [], []
    shared_support, shared_captures, shared_systems = {}, {}, {}
    parameters = source_parameters(context)
    step_path = Path(context["repo"]) / "research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs"
    require(file_hash(step_path) == STEP_SHA, "original step producer changed")
    step = step_lemma();slow = slow_root_all_order_theorem(source, definitions)
    for family in sorted(grouped):
        calc = DirectionalSourceCalculus(source, definitions, parameters, max_work=80000000, max_nodes=600000)
        calc.deadline = time.monotonic()+150
        calc.theta_source_coordinate = theta
        calc.support_cache = shared_support;calc.capture_cache = shared_captures;calc.system_capture_cache = shared_systems
        calc.step_all_order_lemma = step;calc.slow_root_image_theorem = slow
        local_rows = []
        # Pure angle words go first: they do not cross a label/copy boundary.
        ordered = sorted(grouped[family], key=lambda r: (not all(program[x]["args"][1] == theta for x in r["orderedDifferentiationCoordinates"]), r["result"]))
        for original in ordered:
            row = new_request_row(original, program)
            try:
                audit = calc.capture_audit(original["baseSourceNode"])
                row["exactParameterAndCaptureSemantics"] = audit
                require(audit["pass"], "source family complete capture audit failed")
                result = calc.ref(original["baseSourceNode"])
                for direction in row["orderedSourceCoordinates"]:
                    result = calc.d(result, direction)
                stops = calc.reachable(result)["stops"]
                row.update(formulaRoot=result, remainingStops=stops,
                           status="PROVED_EXACT_ADDITIONAL_LEAF_JET" if not stops else "EXACT_EXPANSION_WITH_REMAINING_ANALYTIC_STOPS",
                           newClosedOnLeafDefinedDomain=not stops,
                           derivativeComputed=not stops,
                           exactZero=result == calc.zero,
                           proofScope="original leaf's active defined domain; actual selector invariance and compact-integral regularity checked independently")
            except (ValueError, BudgetStop, RecursionError, KeyError) as error:
                row.update(status="ATTEMPT_RETAINED_WITH_PRECISE_STOP", failure={"type": type(error).__name__, "message": str(error), "work": calc.work, "formulaNodes": len(calc.nodes)})
            rows.append(row);local_rows.append(row)
            print(json.dumps({"stage": "JET-SOLVE", "shard": shard, "requestId": row["requestId"], "status": row["status"], "closed": row["newClosedOnLeafDefinedDomain"]}), flush=True)
        filename = f"jet-solve-shard-{shard}-family-{families.index(family)}-formulas.json"
        artifact = write(out / filename, {"schema": "MathScope.N6.FinishIndependentJetFormulaDAG/1", "sourceParentSHA256": PARENT,
                         "definitionKey": family, "definitionSHA256": definitions[family]["definitionSHA256"],
                         "nodes": calc.nodes, "thetaSourceCoordinate": theta,
                         "thetaFieldIdentities": list(calc.theta_identities.values()),
                         "finiteIntegralLeibnizCertificates": calc.leibniz_certificates,
                         "actualFixedSelectorCertificates": calc.selector_certificates,
                         "actualNativeSystemCaptureAudits": list(calc.system_capture_cache.values()),
                         "sourceValueGrammar": "[original source ID, simultaneous capture-free environment pairs]; source IDs and integral binders are literals, all environment values are formula node references",
                         "globalFullFieldDomainOrSupportClaimed": False})
        for row in local_rows:
            row["formulaArtifact"] = artifact
        family_records.append({"definitionKey": family, "work": calc.work, "formulaNodes": len(calc.nodes),
                               "rows": len(local_rows), "newClosed": sum(r["newClosedOnLeafDefinedDomain"] for r in local_rows), "formulaArtifact": artifact})
        write(out / f"jet-solve-shard-{shard}-checkpoint.json", {"rows": rows, "families": family_records, "sourceParentSHA256": PARENT})
    result = {"schema": "MathScope.N6.FinishJetShard/1", "sourceParentSHA256": PARENT, "stage": "JET-SOLVE", "shard": shard, "shards": shards,
              "currentMatrixSHA256": file_hash(context["current_matrix_path"]), "inputRemainingRequests": len(remaining),
              "attemptedRemainingRequests": len(rows), "newClosedOnLeafDefinedDomains": sum(r["newClosedOnLeafDefinedDomain"] for r in rows),
              "newUnconditionalJetsProved": 0, "rows": rows, "families": family_records,
              "counts": dict(Counter(r["status"] for r in rows)), "allAssignedOriginalRequestsPreserved": len(rows) == sum(len(x) for x in grouped.values()),
              "originalSourceDerivativeHelperCalled": False, "globalFullFieldSupportOrDomainProved": False,
              "wholeCartesianPDEProved": False, "N6-01": "OPEN", "N6-02": "PARTIAL", "original56Of64Changed": False,
              "elapsedSeconds": time.monotonic()-started}
    write(out / f"jet-solve-shard-{shard}-result.json", result)
    write(out / f"jet-solve-shard-{shard}-source-prefix-witnesses.json", source.evidence())
    return result


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser();parser.add_argument("--context", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True);parser.add_argument("--shard", type=int, default=0);parser.add_argument("--shards", type=int, default=4)
    args = parser.parse_args();run(read(args.context), args.output, args.shard, args.shards)
