"""Independent bounded differentiation of the 365 original Cartesian leaf jets.

This module never calls a source producer or its derivative registry helpers.
It distinguishes a derivative on an existing leaf's declared domain from the
unproved assertion that every original PDE argument lies in that domain.
The first absent-input derivative is zero even when differentiability in an
unrelated input is unknown. A later absent-input derivative does NOT erase an
earlier unproved differentiation; that order is deliberately retained.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from fractions import Fraction
from pathlib import Path
import hashlib
import json
import sqlite3
import time

PARENT = "7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f"
EXPECTED_REMAINING = 365
PREFIX_DB_SHA256 = "ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003"
PREFIX_HEADER_SHA256 = "010f1cc18f09c5e9ef226788e8770016603bf520b25289f01d4a08f5aa1da97c"
EXPRESSION_OPS = {"actual_expression_partial", "m3_aux_expression_partial"}
REGISTERED_OPS = EXPRESSION_OPS | {"m3_aux_indexed_partial", "m3_aux_inverse_partial"}
UNARY = {"inverse", "exp", "log_positive", "sqrt_positive", "sine", "cosine", "ceiling", "integer_power", "source_step_derivative"}


def require(ok, message):
    if not ok:
        raise ValueError(message)


def js_hash(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text(encoding="utf8"))


def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()
    path.write_bytes(raw)
    return {"path": path.name, "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}


def file_hash(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024*1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


class VerifiedSourceStore(dict):
    """Lazy read-only fallback to the byte-pinned inherited SQLite prefix."""

    def __init__(self, initial, context):
        super().__init__(initial)
        self.db = None
        self.missing = set()
        self.loaded = {}
        self.receipt = {"available": False, "originalParentSHA256": PARENT}
        root = Path(context.get("inputs", "__missing_original_source_prefix__"))
        candidates = list(root.rglob("source-dag-checkpoint.sqlite")) if root.is_dir() else []
        for path in candidates:
            header = path.parent / "header.json"
            if file_hash(path) != PREFIX_DB_SHA256:
                continue
            require(header.is_file() and file_hash(header) == PREFIX_HEADER_SHA256, "pinned source SQLite header changed")
            self.db = sqlite3.connect(path.resolve().as_uri()+"?mode=ro", uri=True)
            self.db.execute("PRAGMA query_only=ON")
            self.receipt = {"available": True, "databaseSHA256": PREFIX_DB_SHA256,
                            "headerSHA256": PREFIX_HEADER_SHA256, "sourcePath": str(path.relative_to(root)),
                            "originalParentSHA256": PARENT, "readOnly": True, "wholeParentRecomputed": False}
            break

    def get(self, ident, default=None):
        if dict.__contains__(self, ident):
            return dict.__getitem__(self, ident)
        if self.db is None or ident in self.missing or type(ident) is not int:
            return default
        result = self.db.execute("SELECT raw FROM nodes WHERE id=?", (ident,)).fetchone()
        if result is None:
            self.missing.add(ident)
            return default
        node = json.loads(result[0])
        require(set(node) == {"op", "args"} and isinstance(node["op"], str) and isinstance(node["args"], list), "invalid source-prefix node grammar")
        dict.__setitem__(self, ident, node)
        self.loaded[ident] = {"sourceNode": ident, "node": node, "nodeSHA256": js_hash(node)}
        return node

    def __getitem__(self, ident):
        result = self.get(ident)
        if result is None:
            raise KeyError(ident)
        return result

    def evidence(self):
        return {**self.receipt, "loadedNodeCount": len(self.loaded), "missingNodeIDs": sorted(self.missing),
                "loadedSourceWitnesses": [self.loaded[x] for x in sorted(self.loaded)]}


def definition_key(node):
    op, a = node["op"], node["args"]
    if op == "actual_expression_partial":
        return f"expression:{a[0]}"
    if op == "m3_aux_expression_partial":
        return f"expressionDefinitions:{-1-a[0]}"
    if op == "m3_aux_indexed_partial":
        return f"fieldDefinitions:{a[0]}"
    if op == "m3_aux_inverse_partial":
        return f"inverseDefinitions:{a[0]}"
    return None


class BudgetStop(RuntimeError):
    pass


class SourceCalculus:
    """Small independently implemented scalar calculus with explicit stops.

    Source references are lazy, so a million-node body need not be copied.
    All arithmetic coefficients use fractions; no floating values enter it.
    Substitution is simultaneous. Integral binders shadow substitutions, and
    derivative rules for integrals/joins are not accepted without a proof.
    """

    def __init__(self, witnesses, definitions, max_work=180000, max_nodes=70000):
        self.source = witnesses
        self.defs = definitions
        self.nodes = []
        self.intern = {}
        self.derivatives = {}
        self.support_cache = {}
        self.support_active = set()
        self.capture_cache = {}
        self.capture_active = set()
        self.expansions = {}
        self.work = 0
        self.max_work = max_work
        self.max_nodes = max_nodes
        self.deadline = float("inf")
        self.zero = self.q(0)
        self.one = self.q(1)

    def tick(self):
        self.work += 1
        if self.work > self.max_work or len(self.nodes) >= self.max_nodes or time.monotonic() > self.deadline:
            raise BudgetStop("bounded independent jet work/time/node budget reached")

    def put(self, op, args):
        self.tick()
        key = json.dumps([op, args], separators=(",", ":"), ensure_ascii=False)
        if key in self.intern:
            return self.intern[key]
        result = len(self.nodes)
        self.nodes.append({"op": op, "args": args})
        self.intern[key] = result
        return result

    def q(self, n, d=1):
        value = Fraction(n, d)
        return self.put("rational", [str(value.numerator), str(value.denominator)])

    def ref(self, ident, env=()):
        return self.put("source_value", [ident, [list(x) for x in env]])

    def add(self, *args):
        args = [a for a in args if a != self.zero]
        if not args:
            return self.zero
        if len(args) == 1:
            return args[0]
        if all(self.nodes[a]["op"] == "rational" for a in args):
            return self.q(sum((Fraction(*map(int, self.nodes[a]["args"])) for a in args), Fraction(0)))
        return self.put("add", sorted(args))

    def mul(self, *args):
        if self.zero in args:
            return self.zero
        args = [a for a in args if a != self.one]
        if not args:
            return self.one
        if len(args) == 1:
            return args[0]
        if all(self.nodes[a]["op"] == "rational" for a in args):
            value = Fraction(1)
            for a in args:
                value *= Fraction(*map(int, self.nodes[a]["args"]))
            return self.q(value)
        return self.put("multiply", sorted(args))

    def neg(self, a):
        return self.mul(self.q(-1), a)

    def pow(self, a, n):
        return self.one if n == 0 else a if n == 1 else self.put("integer_power", [a, n])

    def stop(self, source, variable, reason, **extra):
        return self.put("independent_uncomputed_derivative", [source, variable, reason, extra])

    def source_support(self, ident):
        """Support from the complete scalar operand grammar, never a name.

        A registry function has an explicitly complete input tuple. Its body
        capture audit is returned separately. Unknown grammar is a stop and
        cannot be used to infer absence of a variable.
        """
        self.tick()
        if ident in self.support_cache:
            return self.support_cache[ident]
        if ident in self.support_active:
            return frozenset(), frozenset({f"cycle:{ident}"})
        n = self.source.get(ident)
        if n is None:
            return frozenset(), frozenset({f"missing-source-node:{ident}"})
        self.support_active.add(ident)
        op, a = n["op"], n["args"]
        if op == "coordinate":
            result = frozenset({ident}), frozenset()
        elif op in {"rational", "source_parameter"}:
            result = frozenset(), frozenset()
        else:
            unknown = set()
            binder = None
            if op in {"add", "multiply", "maximum", "smooth_piecewise"}:
                children = a
            elif op in UNARY:
                children = [a[0]]
            elif op == "definite_integral":
                children = [a[0], a[2], a[3]]
                binder = a[1]
            elif op in REGISTERED_OPS:
                binding = self.defs.get(definition_key(n))
                if not binding or len(a[1]) != len(binding["definition"].get("parameters", [])):
                    children = []
                    unknown.add(f"incomplete-registry-application:{ident}")
                else:
                    children = a[1]
                    audit = self.capture_audit(ident)
                    if not audit["pass"]:
                        unknown.add(f"unproved-capture-closure:{ident}:{definition_key(n)}")
            elif op in {"m3_coupled_expression_partial", "m3_coupled_indexed_partial", "m3_coupled_inverse_partial", "m3_global_indexed_partial", "m3_forced_expression_partial"}:
                children = a[1]
            elif op == "actual_monotone_root":
                children = a[1:]
            elif op == "actual_quadratic_root":
                children = [a[2]]
            elif op == "actual_natural_series":
                children = a[1:3]
            elif op in {"actual_background_picard", "actual_background_even_profile"}:
                children = a[2:4]
            elif op in {"actual_covariance_volterra", "m3_global_pulse_jet"}:
                children = [a[2], *a[3]]
            elif op == "m3_forced_pulse_partial":
                children = [a[3], *a[4]]
            else:
                children = []
                unknown.add(f"unreviewed-source-operation:{ident}:{op}")
            coords = set()
            for j, child in enumerate(children):
                c, u = self.source_support(child)
                coords.update(c - {binder} if binder is not None and j == 0 else c)
                unknown.update(u)
            result = frozenset(coords), frozenset(unknown)
        self.support_active.remove(ident)
        self.support_cache[ident] = result
        return result

    def capture_audit(self, ident):
        n = self.source[ident]
        key = definition_key(n)
        binding = self.defs.get(key)
        if binding is None:
            return {"pass": False, "reason": "actual registry definition unavailable", "key": key}
        d = binding["definition"]
        parameters = d.get("parameters", [])
        values, orders = n["args"][1:3]
        directions = parameters if n["op"] in EXPRESSION_OPS else d.get("directions", [])
        require(len(values) == len(parameters) and len(set(parameters)) == len(parameters), "invalid complete registry argument tuple")
        require(len(orders) == len(directions) and all(type(x) is int and x >= 0 for x in orders), "invalid exact stored derivative orders")
        require(all(self.source.get(x, {}).get("op") == "coordinate" for x in parameters), "a formal function parameter is not an actual coordinate")
        require(all(x in parameters for x in directions), "a direction escaped its complete parameter tuple")
        if n["op"] in EXPRESSION_OPS and "derivativeLimits" in d:
            require(len(d["derivativeLimits"]) == len(orders) and all(x <= limit for x, limit in zip(orders, d["derivativeLimits"])), "stored derivative exceeds actual finite source declaration")
        if key in self.capture_active:
            return {"pass": False, "key": key, "reason": "recursive registry capture closure is unproved"}
        if key in self.capture_cache:
            closure = self.capture_cache[key]
        else:
            self.capture_active.add(key)
            roots = []
            if "body" in d:
                roots = [d["body"]]
            elif "rows" in d:
                for row in d["rows"]:
                    roots.extend([row["coefficient"], *row.get("values", []), *sum(row.get("guards", []), [])])
                    roots.extend(x["coefficient"] for maps in row.get("derivativeMaps", []) for x in maps)
            coords, unknown = set(), set()
            for root in roots:
                c, u = self.source_support(root)
                coords.update(c)
                unknown.update(u)
            self.capture_active.remove(key)
            closure = {"formalBodyFreeCoordinates": sorted(coords), "unboundCapturedCoordinates": sorted(coords-set(parameters)), "unreviewedSupport": sorted(unknown), "rootCount": len(roots)}
            self.capture_cache[key] = closure
        return {"pass": bool(closure["rootCount"]) and not closure["unreviewedSupport"] and not closure["unboundCapturedCoordinates"], "key": key,
                "definitionSHA256": binding["definitionSHA256"], "parameters": parameters,
                "actualValues": values, "storedDerivativeOrders": orders, "directions": directions,
                "frozenParameterIndices": [j for j, x in enumerate(parameters) if x not in directions],
                **closure,
                "simultaneousSubstitution": True, "differentiateBeforeApplication": True,
                "indexedJoinsProved": False, "sourceLimitExistenceProved": False}

    def expand(self, ident, env=()):
        key = ident, tuple(env)
        if key in self.expansions:
            return self.expansions[key]
        self.tick()
        n = self.source.get(ident)
        if n is None:
            return self.put("missing_source_value", [ident, [list(x) for x in env]])
        op, a = n["op"], n["args"]
        e = dict(env)
        child = lambda x: self.ref(x, env)
        if op == "coordinate":
            result = e.get(ident, self.put("coordinate", [n["args"][0], ident]))
        elif op == "rational":
            result = self.q(int(a[0]), int(a[1]))
        elif op == "source_parameter":
            result = self.put("source_parameter", [a[0], ident])
        elif op == "add":
            result = self.add(*(child(x) for x in a))
        elif op == "multiply":
            result = self.mul(*(child(x) for x in a))
        elif op in UNARY:
            result = self.put(op, [child(a[0]), *a[1:]])
        elif op == "definite_integral":
            scoped = tuple((k, v) for k, v in env if k != a[1])
            result = self.put(op, [self.ref(a[0], scoped), a[1], child(a[2]), child(a[3])])
        elif op in {"maximum", "smooth_piecewise"}:
            result = self.put(op, [child(x) for x in a])
        elif op in EXPRESSION_OPS:
            audit = self.capture_audit(ident)
            if not audit["pass"]:
                result = self.put("unexpanded_registry_value", [ident, [list(x) for x in env], audit])
            else:
                definition = self.defs[definition_key(n)]["definition"]
                result = self.ref(definition["body"])
                for p, order in zip(definition["parameters"], a[2]):
                    for _ in range(order):
                        result = self.d(result, p)
                application = {p: child(value) for p, value in zip(definition["parameters"], a[1])}
                result = self.substitute(result, application)
        else:
            result = self.put("unexpanded_source_value", [ident, [list(x) for x in env], op])
        self.expansions[key] = result
        return result

    def substitute(self, ident, replacements, cache=None):
        """Simultaneous capture-free substitution into independent formulas.

        Integrals are explicit stops for differentiation; their binder and
        delayed reference environments are retained without evaluating them.
        """
        self.tick()
        if cache is None:
            cache = {}
        if ident in cache:
            return cache[ident]
        n = self.nodes[ident]
        op, a = n["op"], n["args"]
        sub = lambda x: self.substitute(x, replacements, cache)
        if op == "coordinate":
            result = replacements.get(a[1], ident)
        elif op == "source_value":
            prior = {k: sub(v) for k, v in a[1]}
            # The source body is still unexpanded. Complete parameter mapping
            # is simultaneous, so an inserted argument is never rebound.
            for k, v in replacements.items():
                prior.setdefault(k, v)
            result = self.ref(a[0], tuple(sorted(prior.items())))
        elif op in {"rational", "source_parameter"}:
            result = ident
        elif op in {"integer_power", "source_step_derivative"}:
            result = self.put(op, [sub(a[0]), a[1]])
        elif op in {"add", "multiply", "maximum", "smooth_piecewise", "inverse", "exp", "log_positive", "sqrt_positive", "sine", "cosine", "ceiling"}:
            result = self.put(op, [sub(x) for x in a])
        else:
            # A deferred substitution across an unsupported calculus stop is
            # preserved verbatim and cannot be counted as an evaluated jet.
            result = self.put("uncomputed_capture_free_substitution", [ident, sorted(replacements.items())])
        cache[ident] = result
        return result

    def d(self, ident, variable):
        key = ident, variable
        if key in self.derivatives:
            return self.derivatives[key]
        self.tick()
        n = self.nodes[ident]
        op, a = n["op"], n["args"]
        der = lambda x: self.d(x, variable)
        if op in {"rational", "source_parameter"}:
            result = self.zero
        elif op == "coordinate":
            result = self.one if a[1] == variable else self.zero
        elif op == "source_value":
            support, unknown = self.source_support(a[0])
            env = dict(a[1])
            # An existing complete source function, with no varying inputs,
            # is constant. Do not make this shortcut through substitutions.
            if not env and not unknown and variable not in support:
                result = self.zero
            else:
                result = der(self.expand(a[0], tuple(sorted(env.items()))))
        elif op == "add":
            result = self.add(*(der(x) for x in a))
        elif op == "multiply":
            result = self.add(*(self.mul(der(x), *(y for j, y in enumerate(a) if j != i)) for i, x in enumerate(a)))
        elif op == "inverse":
            result = self.neg(self.mul(der(a[0]), self.pow(ident, 2)))
        elif op == "integer_power":
            result = self.mul(self.q(a[1]), self.pow(a[0], a[1]-1), der(a[0]))
        elif op == "exp":
            result = self.mul(ident, der(a[0]))
        elif op == "log_positive":
            result = self.mul(der(a[0]), self.put("inverse", [a[0]]))
        elif op == "sqrt_positive":
            result = self.mul(der(a[0]), self.put("inverse", [self.mul(self.q(2), ident)]))
        elif op == "sine":
            result = self.mul(self.put("cosine", [a[0]]), der(a[0]))
        elif op == "cosine":
            result = self.neg(self.mul(self.put("sine", [a[0]]), der(a[0])))
        elif op == "source_step_derivative":
            # Exact symbolic chain-rule transport is retained; the theorem
            # proving source-step smoothness is a named pending prerequisite.
            result = self.put("step_chain_rule_pending_proof", [self.mul(self.put(op, [a[0], a[1]+1]), der(a[0])), variable])
        elif op == "definite_integral":
            result = self.stop(ident, variable, "source finite-integral Leibniz uniform continuity/dominating bound not proved", originalIntegral=a)
        elif op == "smooth_piecewise":
            result = self.stop(ident, variable, "all original active-domain joins and matching derivatives not proved", guards=a[:3])
        elif op in {"maximum", "ceiling"}:
            result = self.stop(ident, variable, "varying nonsmooth selector needs exact local constancy/crossing proof")
        else:
            result = self.stop(ident, variable, "actual analytic/limit/function derivative not independently proved", operation=op)
        self.derivatives[key] = result
        return result

    def reachable(self, root):
        """Only formula edges are followed, never literal registry/source IDs."""
        seen, stack, stops = set(), [root], []
        while stack:
            ident = stack.pop()
            if ident in seen:
                continue
            seen.add(ident)
            n = self.nodes[ident]
            op, a = n["op"], n["args"]
            if op == "source_value":
                stack.extend(v for _, v in a[1])
            elif op in {"rational", "coordinate", "source_parameter"}:
                pass
            elif op in UNARY:
                stack.append(a[0])
            elif op in {"add", "multiply", "maximum", "smooth_piecewise"}:
                stack.extend(a)
            else:
                stops.append({"formulaNode": ident, "node": n})
        return {"nodes": len(seen), "stops": stops}


def validate_inputs(context):
    baseline = Path(context["baseline"])
    checkpoint = read(baseline / "checkpoints/cartesian-source-checkpoint.json")
    previous = read(baseline / "cartesian-closure-result.json")
    matrix = read(context["matrix_path"])
    require(previous["originalNodesSHA256"] == matrix["parentNodesSHA256"] == PARENT, "original source parent changed")
    requests = previous["remainingUnresolvedRequests"]
    require(len(requests) == EXPECTED_REMAINING and previous["closedIndependentJets"] == 28, "original 365/28 frontier changed")
    by_result = {r["result"]: r for r in matrix["originalIndependentCartesianRequests"]}
    require(len(by_result) == 393, "original request identity is ambiguous")
    require(len({r["result"] for r in requests}) == 365, "remaining jet identity is ambiguous")
    witnesses = {}
    for row in checkpoint["sourceWitnesses"]:
        require(js_hash(row["node"]) == row["nodeSHA256"], "changed source node witness")
        require(row["sourceNode"] not in witnesses or witnesses[row["sourceNode"]] == row["node"], "conflicting source node witnesses")
        witnesses[row["sourceNode"]] = row["node"]
    witnesses = VerifiedSourceStore(witnesses, context)
    definitions = {}
    for row in checkpoint["definitionBindings"]:
        require(js_hash(row["definition"]) == row["definitionSHA256"], "changed actual defining body")
        require(row["key"] not in definitions or definitions[row["key"]] == row, "conflicting registry definitions")
        definitions[row["key"]] = row
    program = checkpoint["cartesian"]["scalarProgram"]
    for request in requests:
        original = by_result[request["result"]]
        for key in ["base", "result", "orderedDifferentiationCoordinates", "actualOrDerivedOperand", "operation"]:
            require(request[key] == original[key], "original derivative request changed")
        require(witnesses.get(request["baseSourceNode"]) == request["actualSourceNode"], "original leaf source binding changed")
        require(program[request["base"]] == {"op": "actual_opaque_value", "args": [request["baseSourceNode"], request["actualSourceNode"]["op"]]}, "a substituted opaque base requires an explicit capture-preserving support proof")
        require(definition_key(request["actualSourceNode"]) == request["actualDefinitionKey"], "original registry node binding changed")
        require(definitions[request["actualDefinitionKey"]]["definitionSHA256"] == request["actualDefinitionSHA256"], "original registry body hash changed")
        for variable in request["orderedDifferentiationCoordinates"]:
            require(program[variable]["op"] == "coordinate" and len(program[variable]["args"]) == 2, "not an exact original Cartesian source coordinate")
    return checkpoint, previous, requests, program, witnesses, definitions


def slow_root_all_order_theorem(witnesses, definitions):
    """Uniform analytic derivative bound for the actual implicit source leaf.

    This is a rigorous local theorem over EVERY point of its original source
    image. It is not the missing theorem placing all original PDE arguments
    inside that image, nor a norm bound for any Picard coefficient.
    """
    expected = {
        9: {"op": "source_parameter", "args": ["h"]},
        19: {"op": "rational", "args": ["1", "2"]},
        20: {"op": "rational", "args": ["-1", "1"]},
        24: {"op": "rational", "args": ["2", "1"]},
        25: {"op": "multiply", "args": [9, 24]},
        622811: {"op": "integer_power", "args": [622803, 2]},
        622812: {"op": "log_positive", "args": [622810]},
        622813: {"op": "multiply", "args": [25, 622812]},
        622814: {"op": "exp", "args": [622813]},
        622815: {"op": "multiply", "args": [622811, 622814]},
        622816: {"op": "multiply", "args": [20, 622815]},
        622817: {"op": "add", "args": [622810, 622816]},
        622818: {"op": "multiply", "args": [20, 622804]},
        622819: {"op": "add", "args": [622817, 622818]},
        622820: {"op": "actual_monotone_root", "args": [2, 622803, 622804]},
    }
    for ident, value in expected.items():
        require(witnesses.get(ident) == value, f"source-pinned all-order implicit theorem body changed at {ident}")
    definition = definitions["monotone:2"]["definition"]
    require({k: definition[k] for k in ["variable", "parameters", "body", "left", "right"]} == {"variable": 622810, "parameters": [622803, 622804], "body": 622819, "left": 19, "right": 24}, "original slow implicit root binding changed")
    delta, radius, h_max = Fraction(1, 1024), Fraction(1, 16), Fraction(1, 64)
    z2_upper = 2+4*delta+delta*delta
    s_lower, s_upper = Fraction(1, 2)-radius, 2+radius
    contraction = 2*h_max*3*2/s_lower
    center_defect = 11*delta
    image_radius = center_defect+contraction*radius
    require(z2_upper < 3 and s_lower == Fraction(7, 16) and s_upper < 3, "uniform complex slow-root disk geometry failed")
    require(3 < 2**32 and contraction == Fraction(3, 7) < 1 and image_radius < radius, "exact holomorphic contraction bounds failed")
    return {"schema": "MathScope.N6.SourceSlowImplicitAllOrders/1", "status": "PROVED_UNIFORM_ALL_ORDER_LEAF_BOUND_ON_ORIGINAL_SOURCE_IMAGE",
            "sourceNode": 622820, "sourceNodeSHA256": js_hash(expected[622820]), "definitionSHA256": definitions["monotone:2"]["definitionSHA256"],
            "sourceParentSHA256": PARENT, "actualEquation": "s-Z^2*exp(2*h*Log(s))-T=0", "premises": ["0<h<1/64", "1/2<=s0<=2", "-1<=eta0<=1", "Z0=s0^(1/2-h)*eta0", "T0=s0*(1-eta0^2)"],
            "uniformComplexParameterPolydiscRadius": str(delta), "sourceRootDiskRadius": str(radius),
            "exactRationalChecks": {"ZSquaredUpper": str(z2_upper), "sModulusLower": str(s_lower), "sModulusUpper": str(s_upper), "contractionUpper": str(contraction), "centerDefectUpper": str(center_defect), "imageRadiusUpper": str(image_radius), "strictInvarianceMargin": str(radius-image_radius)},
            "proof": [
                "At every original source-image point F(s0;Z0,T0)=0 and |Z0|^2<=2. For |Z-Z0|,|T-T0|<1/1024, |Z|^2<=2+4/1024+1/1024^2<3.",
                "On the closed complex s-disk |s-s0|<=1/16, Re(s)>=7/16>0 and |s|<3. Principal Log is holomorphic there. Since 0<2h<1/32 and 3<2^32, |exp(2h Log(s))|=|s|^(2h)<2.",
                "The map Psi(s)=T+Z^2 exp(2h Log(s)) has |Psi'(s)|<=(1/32)*3*2/(7/16)=3/7. Its center displacement is at most 11/1024. The recomputed strict invariant-disk inequality gives |Psi(s)-s0|<1/16.",
                "Complex Banach iteration converges uniformly on smaller parameter polydiscs to the unique holomorphic fixed point in this disk. At real source-image parameters it equals the original unique monotone source root. This argument is uniform over all s0,eta0,h in the stated ranges.",
                "The root has modulus less than 3 throughout each parameter polydisc. Two-variable Cauchy estimates give |partial_Z^a partial_T^b s(Z0,T0)|<=3*a!*b!*1024^(a+b) for every pair of nonnegative integers a,b. No finite order sampling or source derivative helper is used."],
            "allOrderDerivativeBound": "forall integers a,b>=0: |partial_Z^a partial_T^b s| <= 3*a!*b!*1024^(a+b)",
            "derivativeRecurrence": "Differentiate F(s(Z,T),Z,T)=0; at each total order n isolate F_s*D^alpha(s) and retain all lower-order Leibniz/Faa-di-Bruno terms; F_s never vanishes on the contraction disk.",
            "allOrderBoundVerifiedByAnalyticProof": True, "globalOriginalPDEArgumentsInsideImageProved": False,
            "originalWholeFieldWMSNormProved": False, "actualPicardCommonEtaStripOrCoefficientNormProved": False,
            "globalGuardCountDischarged": 0, "samplePointsUsedAsProof": False}


def run(context, out, shard=0, shards=1):
    started = time.monotonic()
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    require(type(shard) is int and type(shards) is int and 0 <= shard < shards <= 32, "invalid deterministic jet shard")
    checkpoint, previous, requests, program, witnesses, definitions = validate_inputs(context)
    slow_all_orders = slow_root_all_order_theorem(witnesses, definitions)
    slow_all_orders_artifact = write(out / f"slow-root-all-orders-shard-{shard}.json", slow_all_orders)
    # Family sharding keeps shared bodies, captures and derivative memoization
    # together, with stable assignment independent of hash randomization.
    families = sorted({r["actualDefinitionKey"] for r in requests})
    selected = {key for i, key in enumerate(families) if i % shards == shard}
    grouped = defaultdict(list)
    for request in requests:
        if request["actualDefinitionKey"] in selected:
            grouped[request["actualDefinitionKey"]].append(request)
    rows, family_rows = [], []
    for key in sorted(grouped):
        calc = SourceCalculus(witnesses, definitions)
        calc.deadline = time.monotonic() + 45
        family_start = time.monotonic()
        for request in grouped[key]:
            row = dict(request)
            row["requestId"] = f"cartesian-result:{request['result']}"
            row["orderedSourceCoordinates"] = [program[v]["args"][1] for v in request["orderedDifferentiationCoordinates"]]
            row["calculusAttempted"] = True
            row["globalPDEArgumentsInsideOriginalDomainProved"] = False
            row["originalDomainGuardsRetained"] = 94
            row["unconditionalAnalyticJetProved"] = False
            row["originalSourceNodeSHA256"] = js_hash(request["actualSourceNode"])
            row["derivativeComputed"] = False
            row["closedOnOriginalLeafDefinedDomain"] = False
            try:
                audit = calc.capture_audit(request["baseSourceNode"])
                row["exactParameterAndCaptureSemantics"] = audit
                require(audit["pass"], "capture audit has unbound coordinates or unreviewed source grammar")
                support, unknown = calc.source_support(request["baseSourceNode"])
                row["completeApplicationSupport"] = {"sourceCoordinates": sorted(support), "unreviewed": sorted(unknown)}
                require(not unknown, "source input support contains unreviewed operations")
                word = row["orderedSourceCoordinates"]
                if word and word[0] not in support:
                    result = calc.zero
                    row["lemma"] = "FIRST_ABSENT_INPUT_THEN_DERIVATIVES_OF_ZERO"
                    row["proof"] = "The exact capture-free application has no occurrence of the first requested independent coordinate. On the domain where this original leaf value exists, varying that coordinate changes no input and therefore yields the identical constant function. Its first derivative is exactly zero; every subsequent derivative of zero is zero. This proof does not commute derivatives or assume differentiability in another coordinate."
                    row["exactValue"] = "0"
                else:
                    result = calc.ref(request["baseSourceNode"])
                    for variable in word:
                        result = calc.d(result, variable)
                    row["lemma"] = "INDEPENDENT_EXACT_BODY_CHAIN_PRODUCT_CALCULUS"
                evidence = calc.reachable(result)
                row["formulaRoot"] = result
                row["formulaDAG"] = f"jet-formulas-shard-{shard}-family-{families.index(key)}.json"
                row["formulaSHA256"] = js_hash(calc.nodes[result])
                row["independentFormulaNodesReachable"] = evidence["nodes"]
                row["unprovedCalulusStops"] = evidence["stops"]
                if not evidence["stops"]:
                    row["status"] = "PROVED_EXACT_JET_ON_ORIGINAL_LEAF_DEFINED_DOMAIN"
                    row["derivativeComputed"] = True
                    row["closedOnOriginalLeafDefinedDomain"] = True
                    row["proofPremises"] = ["This original source leaf value exists on its declared input domain", "All required original active-domain positive/nonzero conditions", "Every original global PDE argument is in that domain remains a separate open obligation"]
                else:
                    row["status"] = "PARTIAL_EXACT_FORMULA_WITH_EXPLICIT_ANALYTIC_STOPS"
                    row["minimalObligation"] = "; ".join(sorted({s["node"]["args"][2] if s["node"]["op"] == "independent_uncomputed_derivative" else s["node"]["op"] for s in evidence["stops"]}))
            except (BudgetStop, RecursionError) as error:
                row["status"] = "RESOURCE_STOP_RETAINED"
                row["failure"] = {"type": type(error).__name__, "message": str(error), "work": calc.work, "formulaNodes": len(calc.nodes)}
            except ValueError as error:
                row["status"] = "SOURCE_SEMANTICS_OR_CALCULUS_STOP_RETAINED"
                row["failure"] = {"type": type(error).__name__, "message": str(error)}
            rows.append(row)
            print(json.dumps({"stage": "A", "shard": shard, "requestId": row["requestId"], "sourceNode": row["baseSourceNode"], "word": row["orderedSourceCoordinates"], "status": row["status"]}), flush=True)
        formulas = write(out / f"jet-formulas-shard-{shard}-family-{families.index(key)}.json", {"schema": "MathScope.N6.CloudIndependentJetFormulaDAG/1", "definitionKey": key, "sourceParentSHA256": PARENT, "nodes": calc.nodes, "sourceValueMeaning": "exact source node with simultaneous formal-parameter environment; source values are not derivative oracles", "originalSourceDerivativeHelperCalled": False})
        family_rows.append({"definitionKey": key, "definitionSHA256": definitions[key]["definitionSHA256"], "requests": len(grouped[key]), "work": calc.work, "formulaNodes": len(calc.nodes), "formulas": formulas, "elapsedSeconds": time.monotonic()-family_start})
        # Durable per-family checkpoint survives an interrupted later family.
        write(out / f"jet-checkpoint-shard-{shard}.json", {"sourceParentSHA256": PARENT, "shard": shard, "shards": shards, "completedFamilies": family_rows, "completedRequestIds": [r["requestId"] for r in rows], "allRequestsRetained": rows})
    counts = Counter(r["status"] for r in rows)
    fallback = write(out / f"source-prefix-witnesses-shard-{shard}.json", witnesses.evidence())
    result = {"schema": "MathScope.N6.CloudJetShard/1", "stage": "A", "shard": shard, "shards": shards,
              "sourceParentSHA256": PARENT, "initialOriginalRequests": 393, "previouslyClosedOnDeclaredDomains": 28,
              "baselineRemainingRequests": 365, "attemptedRequests": len(rows), "allAssignedRequestsPreserved": len(rows) == sum(len(v) for v in grouped.values()),
              "newClosedOnOriginalLeafDefinedDomains": sum(r["closedOnOriginalLeafDefinedDomain"] for r in rows),
              "unconditionalAnalyticJetsProved": 0, "globalGuardsDischarged": 0, "counts": dict(counts),
              "families": family_rows, "requests": rows, "all94OriginalGlobalGuardsStillRequired": True,
              "verifiedLazySourcePrefixEvidence": fallback,
              "sourceSlowImplicitAllOrders": slow_all_orders_artifact,
              "originalN601Complete": False, "originalN602Complete": False, "original56Of64Changed": False,
              "wholeCartesianPDEProved": False, "unknownJetReplacedByZero": False,
              "firstAbsentInputLemmaProof": "The original leaf's complete actual argument tuple and capture audit determine all varying coordinates. If the FIRST ordered differentiation coordinate is absent, the function on its existing domain is constant in that coordinate, so that derivative and derivatives of its zero result are zero. A later absent coordinate cannot erase an unproved earlier derivative.",
              "allOrderFamilyLemma": {"quantifier": "For every original capture-verified source application f and every integer n>=1, every ordered derivative word whose FIRST coordinate is absent from all actual inputs has value zero wherever that original leaf is defined on an open domain.", "recurrence": "D_absent f=0; D_j(0)=0 for every subsequent independent direction j; induction proves every word length n.", "exactPositiveOrderBound": "absolute derivative=0", "globalSourceImageProved": False, "commonWholeFieldWMSBoundProved": False, "mixedDerivativesCommuted": False, "sourceLimitExistenceAssumedAsDeclaredDomainPremise": True},
              "elapsedSeconds": time.monotonic()-started}
    write(out / f"jet-results-shard-{shard}.json", result)
    return result


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--context", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--shard", type=int, default=0)
    parser.add_argument("--shards", type=int, default=1)
    args = parser.parse_args()
    run(read(args.context), args.output, args.shard, args.shards)
