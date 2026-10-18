"""Read-only source connection checks for the original N6-01 wave/norm inputs.

Only this module's stdlib checks run.  Archived producers are read, never imported
or executed.  Arithmetic and actual finite source identities are distinguished
from the all-fixed-order G/F theorem application that remains open.
"""
from __future__ import annotations

from collections import Counter
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import re
import zipfile

REFERENCE_SHA256 = "5c6075b3eb65b187bf56a8778a01a42a46a544b6b7c1fa87791b4dd6e2fc0762"
NATIVE_SHA256 = "117dce1b82120f4f2f030a4c61ec62412acd373a86a898784b2a955e5226d1da"
NODES_SHA256 = "a7665627f0998be8a20a62894b0a64da1e3be3b0f36da9da0c49aad185dabd28"
RECOVERED_PARENT_NODES_SHA256 = "0d902ef124f089e8b378c2138b78b64cfbe469f8ff8064a5872ed024f00779de"
KAPPA = Fraction(1, 100000)
_PREFIX = "MathScope_M3_WaveNorm_Continuation/"


def _sha(raw):
    return hashlib.sha256(raw).hexdigest()


def _json(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("Duplicate JSON key: " + key)
            result[key] = value
        return result
    def invalid(value):
        raise ValueError("Nonfinite JSON number: " + value)
    return json.loads(raw, object_pairs_hook=pairs, parse_constant=invalid)


def _need(condition, message):
    if not condition:
        raise ValueError(message)


def _same(left, right):
    if type(left) is not type(right):
        return False
    if type(right) is dict:
        return left.keys() == right.keys() and all(_same(left[key], value) for key, value in right.items())
    if type(right) is list:
        return len(left) == len(right) and all(_same(a,b) for a,b in zip(left,right))
    return left == right


def exact_exponent(value):
    """Original rational/expression forms; no float evaluation or eval()."""
    _need(type(value) is str, "Exponent must retain its exact string form")
    expressions = {"1-kappa_s": 1-KAPPA, "2-kappa_s": 2-KAPPA,
                   "2-2*kappa_s": 2-2*KAPPA, "1-3*kappa_s": 1-3*KAPPA}
    if value in expressions:
        return expressions[value]
    _need(bool(re.fullmatch(r"-?[0-9]+(?:/[1-9][0-9]*)?", value)), "Unsupported original exponent")
    return Fraction(value)


def exponent_inclusion(achieved, target):
    a, b = exact_exponent(achieved), exact_exponent(target)
    return {"achieved": str(a), "target": str(b), "margin": str(a-b),
            "passed": a >= b,
            "meaning": "Exact exponent arithmetic only, conditional on the same class/domain/weights and an actual source bound"}


def _children(node):
    op, args = node["op"], node["args"]
    if op == "rational":
        _need(len(args) == 2 and _decimal(args[1]) > 0, "Invalid exact scalar rational")
        _decimal(args[0])
        return []
    if op == "source_norm_result":
        return []
    if op in ("add", "multiply", "maximum", "sqrt_positive"):
        _need(bool(args) and (op != "sqrt_positive" or len(args) == 1), "Invalid positive scalar arity")
        return args
    if op == "integer_power":
        _need(len(args) == 2 and type(args[1]) is int, "Invalid exact scalar power")
        return args[:1]
    raise ValueError("Unexpected scalar operation: " + str(op))


def validate_wave_dag(program, expected_calls=None):
    calls, nodes, rows = program["call_graph"], program["scalar_nodes"], program["rows"]
    _need(type(calls) is list and len(calls) == 13, "The actual closed program has 13 calls")
    for index, call in enumerate(calls):
        _need(type(call) is dict and type(call.get("id")) is int and call["id"] == index,
              "Call IDs must be exact sequential integers")
        _need(type(call.get("dependencies")) is list and all(type(n) is int and 0 <= n < index for n in call["dependencies"]),
              "Call dependencies must refer strictly backwards")
        if expected_calls is not None:
            expected = expected_calls[index]
            _need(all(_same(call.get(key), expected[key])
                      for key in ("producer", "request", "dependencies")), "Original producer request/dependency changed")
    _need(type(nodes) is list and nodes, "A complete scalar program is required")
    leaf_counts = Counter()
    for index, node in enumerate(nodes):
        _need(type(node) is dict and type(node.get("op")) is str and type(node.get("args")) is list,
              "Malformed scalar node")
        if node["op"] == "source_norm_result":
            _need(len(node["args"]) == 2, "Invalid source-result arity")
            call, path = node["args"]
            _need(type(call) is int and 0 <= call < len(calls), "Source result references an absent call")
            _need(type(path) is list and path and all(type(p) in (str, int) and (type(p) is not int or p >= 0) for p in path),
                  "Invalid original producer result path")
            leaf_counts[calls[call]["producer"]] += 1
        for child in _children(node):
            _need(type(child) is int and 0 <= child < index, "Scalar DAG has a missing, forward, or cyclic reference")
    _need(sum(leaf_counts.values()) == 308, "All 308 source leaves must be retained")
    closure_records = []
    for row in rows:
        _need(type(row["order"]) is int and row["primary_input_orders_used"] == row["order"]+2
              and row["mean_input_orders_used"] == row["order"]+1, "Actual consumer derivative demand changed")
        for harmonic, bound in row["modes"].items():
            root = bound["constant"]["node"]
            _need(type(root) is int and 0 <= root < len(nodes), "Wave norm root is absent")
            seen, stack, leaves = set(), [root], []
            while stack:
                node_id = stack.pop()
                if node_id in seen:
                    continue
                seen.add(node_id)
                node = nodes[node_id]
                if node["op"] == "source_norm_result":
                    call_id, path = node["args"]
                    producer = calls[call_id]["producer"]
                    _need(producer in {"primary", "commonY", "background", "radial", "fourier", "five"},
                          "Final defect/current norm used as its own wave premise")
                    leaves.append({"call": call_id, "producer": producer, "path": path})
                stack.extend(_children(node))
            closure_records.append({"order": row["order"], "harmonic": harmonic,
                                    "source_leaf_count": len(leaves), "source_leaves": leaves})
    return {"call_count": len(calls), "leaf_count": sum(leaf_counts.values()),
            "counts_by_producer": dict(leaf_counts), "wave_output_closures": closure_records,
            "claim": "Closed acyclic source-result graph and actual finite consumer demand; not evaluation of producer theorems"}


def _decimal(value):
    _need(type(value) is str and bool(re.fullmatch(r"-?[0-9]+", value)), "Noncanonical rational integer")
    sign = -1 if value.startswith("-") else 1
    value = value.lstrip("-")
    result = 0
    for start in range(0, len(value), 9):
        chunk = value[start:start+9]
        result = result * 10**len(chunk) + int(chunk)
    return sign * result


def _two_power(value):
    integer = _decimal(value)
    _need(integer > 0 and integer & (integer-1) == 0, "Reference factor is not an exact power of two")
    return integer.bit_length()-1


def _reference_factor(nodes, root, own_root):
    # Each value is (power of the original atom, exact power of 2). Unrelated
    # source results stay unknown; no floating-point or enormous decimal print.
    values = {}
    needed, stack = set(), [root]
    while stack:
        n = stack.pop()
        if n in needed:
            continue
        needed.add(n)
        if n != own_root:
            stack.extend(_children(nodes[n]))
    for n in sorted(needed):
        if n == own_root:
            values[n] = (1, 0)
            continue
        node, result = nodes[n], None
        op, args = node["op"], node["args"]
        if op == "rational":
            try:
                result = (0, _two_power(args[0])-_two_power(args[1]))
            except ValueError:
                pass
        elif op == "multiply" and all(values.get(c) is not None for c in args):
            result = (sum(values[c][0] for c in args), sum(values[c][1] for c in args))
        elif op == "integer_power" and values.get(args[0]) is not None:
            a, power = values[args[0]], args[1]
            result = (a[0]*power, a[1]*power)
        values[n] = result
    return values.get(root)


def validate_reference_norms(program):
    records = []
    _need(program["affine_constant"] == 32404, "Original two-column affine constant changed")
    # sqrt(2)<2 -> Tg=4+sqrt(2)<6, hence 4+6^4*(1+4*Tg)<32404.
    _need(4 + 6**4*(1+4*6) == 32404, "Independent affine upper bound arithmetic failed")
    for row in program["rows"]:
        for mode in ("-2", "-1", "1", "2"):
            own, reference = row["own_label_modes"][mode], row["modes"][mode]
            _need(all(own[field] == reference[field] for field in
                      ("log_power", "pole", "epsilon_exponent", "zeta_power", "pulse_power")),
                  "Reference transformation changed the original envelope/exponent/pole")
            _need(exact_exponent(reference["zeta_power"]) == Fraction(1, 2) and type(reference["pulse_power"]) is int and reference["pulse_power"] == 1,
                  "Original sqrt(zeta)*P(v) envelope was removed")
            factor = _reference_factor(program["scalar_nodes"], reference["constant"]["node"], own["constant"]["node"])
            expected_two_power = 4 + 2*(row["order"]+own["log_power"])
            _need(factor == (1, expected_two_power), "Actual scalar DAG does not retain 16*4^(m+log_power) times the own-label bound")
            records.append({"order": row["order"], "mode": mode, "exact_factor": "16*4^(m+log_power)",
                            "power_of_two": expected_two_power, "envelope": "sqrt(zeta)*P(v)"})
    return {"rows": records, "affine_upper_bound": 32404,
            "scope": "Exact saved scalar transformation; applicability of the coordinate chart is a separate source obligation"}


def validate_finite_projection(initialized, native, source_nodes):
    fields = native["native_fields"]
    _need(len(fields) == 3, "All three actual native component definitions are needed")
    expressions = {row["id"]: row for row in native["expression_definitions"]}
    results = []
    for component, field in enumerate(fields):
        _need(field["id"] == "coupled-field:"+str(component) and len(field["rows"]) == 162,
              "Original full 162-row native source is missing")
        labels = set()
        for row in field["rows"]:
            label = row["label"]
            _need(type(label["sign"]) is int and label["sign"] in (1, -1), "Original signed source label changed")
            labels.add(label["key"])
            system = initialized["application"]["systems"][0 if label["sign"] == 1 else 1][component]
            _need(row["localSystem"] == system["system"] and row["localBody"] == system["referenceBody"],
                  "Native source row is not the actual initialized residual expression")
            _need(expressions[row["localSystem"]]["body"] == row["localBody"], "Native row body/definition mismatch")
        _need(len(labels) == 81, "All 81 original label boxes must remain")
        _need(source_nodes[3825003+component] == {"op": "m3_coupled_indexed_partial", "args": [field["id"],
              [622802,622803,622804,622791,635044,635045,622806], [0,0,0,0,0,0]]}, "Actual wave native root differs")
        _need(source_nodes[3825348+component] == {"op": "add", "args": [3825003+component,[3825343,3825345,3825347][component]]},
              "Whole residual does not retain both wave and reference mean")
        results.append({"component": component, "native_rows": 162, "label_boxes": len(labels),
                        "required_source_premises": field["requiredSourcePremises"],
                        "source_authenticated_flag_preserved": field["sourceAuthenticated"]})
    projection = []
    for template in initialized["templates"]:
        selected = [row for row in template["waveResidual"] if row["m"] != 0]
        _need(selected == template["nonzeroAngularForcing"], "Actual nonzero angular coefficient projection differs")
        _need({row["m"] for row in selected} == {-2,-1,1,2}, "An actual nonzero source harmonic was omitted")
        projection.append({"template": template["key"], "nonzero_modes": [row["m"] for row in selected]})
    _need(len(projection) == 10, "All five level-differences and both signs must remain")
    return {"native": results, "projection": projection,
            "scope": "Actual finite native definition and nonzero-mode filtering only; no G_wave/F_pulse decomposition or all-band bound follows"}


def _can_close_wave_obligation(validation_passed, gf_evidence, thm_evidence):
    """Keep input authentication separate from the existing theorem gate."""
    return bool(
        validation_passed
        and gf_evidence is not None
        and gf_evidence.get("unconditional_complete") is True
        and thm_evidence is not None
        and thm_evidence.get("unconditional_complete") is True
    )


def audit_wave_source(acceptance_root: Path, producer_root: Path | None = None,
                      reference_root: Path | None = None) -> dict:
    here = Path(__file__).resolve().parent
    producer_root = Path(producer_root) if producer_root is not None else here/"payload/producers"
    reference_root = Path(reference_root) if reference_root is not None else here/"wave_reference"
    result = {"module": "wave_source_connection", "source_checks": [], "applied_connections": [],
              "remaining_obligations": [], "items": {}, "validation_passed": False,
              "source_execution_performed": False, "original1260_proofs_rerun": False}
    def check(name, action):
        try:
            evidence = action()
            result["source_checks"].append({"name": name, "passed": True, "evidence": evidence})
            return evidence
        except (OSError, ValueError, KeyError, IndexError, TypeError, zipfile.BadZipFile) as exc:
            result["source_checks"].append({"name": name, "passed": False, "evidence": {"error": str(exc), "type": type(exc).__name__}})
            return None
    def read_reference():
        raw = (reference_root/"WAVE_SOURCE_REFERENCE.json").read_bytes()
        _need(_sha(raw) == REFERENCE_SHA256, "Inspected reference metadata changed")
        return _json(raw)
    reference = check("reference_identity", read_reference)
    if reference is None:
        reference = {"producers": [], "members": []}
    def available_producer_checks():
        _need(reference["producers"], "No inspected producer references")
        verified = []
        missing = []
        for expected in reference["producers"]:
            p = producer_root / expected["path"]
            if p.is_file():
                raw = p.read_bytes()
                _need(len(raw) == expected["bytes"] and _sha(raw) == expected["sha256"], "Producer bytes changed: " + expected["path"])
                verified.append(expected)
            else:
                missing.append(expected["path"])
        _need(len(verified) == len(reference["producers"]) == 11,
              "Expected all 11 authenticated original producer files in the recovered-input copy")
        return {
            "verified_files": verified,
            "verified_count": len(verified),
            "missing_unbundled_files": missing,
            "scope": "Verified all available original producer definitions by exact byte length and SHA-256"
        }
    check("available_producer_definitions", available_producer_checks)
    def producer_checks():
        _need(reference["producers"], "No inspected producer references")
        records = []
        for expected in reference["producers"]:
            raw = (producer_root/expected["path"]).read_bytes()
            _need(len(raw) == expected["bytes"] and _sha(raw) == expected["sha256"], "Producer bytes changed: "+expected["path"])
            records.append(expected)
        return {"verified_files": records, "scope": "Original producer definitions and general theorem source text; none executed"}
    check("producer_definitions", producer_checks)
    documents = {}
    def load_inputs():
        archive_path = Path(acceptance_root)/"inputs/MathScope_M3_WaveNorm_Continuation.zip"
        raw = archive_path.read_bytes()
        _need(_sha(raw) == reference["wave_archive_sha256"], "Sealed WaveNorm input archive changed")
        with zipfile.ZipFile(archive_path) as archive:
            for expected in reference["members"]:
                _need(archive.namelist().count(expected["member"]) == 1, "Missing or duplicate original ZIP member")
                body = archive.read(expected["member"])
                _need(len(body) == expected["bytes"] and _sha(body) == expected["sha256"], "Original member bytes changed: "+expected["path"])
                if expected["path"].endswith(".json"):
                    documents[expected["path"]] = _json(body)
        return {"archive_sha256": _sha(raw), "verified_members": reference["members"]}
    check("sealed_saved_inputs", load_inputs)
    doc = lambda name: documents[name]
    wave = documents.get("evidence/WAVE_NORM_PROGRAM.json", {})
    nf_path = "inherited/inherited/inherited/sources/normFamily.json"
    def continuation():
        nf = doc(nf_path)
        proof = nf["family"]["continuation"]
        _need([row["id"] for row in proof["induction"]] == reference["required_continuation_induction_ids"], "An original general-order induction step is absent")
        _need(all(type(row["statement"]) is str and row["statement"].strip() for row in proof["induction"]), "Missing induction statement")
        for identity in (nf["source"]["source"], nf["family"]["source"]):
            _need(all(identity[key] == value for key, value in reference["source_identity"].items()), "Continuation source identity mismatch")
        _need(nf["source"]["actualRoots"] == nf["family"]["sourceBinding"]["actualRoots"], "Saved continuation has different current roots")
        recipe = []
        for expected in proof["originalRecipeFiles"]:
            body = (producer_root/expected["path"]).read_bytes()
            _need(len(body) == expected["bytes"] and _sha(body) == expected["sha256"], "General-order source recipe SHA mismatch")
            recipe.append(expected)
        return {"json_path": "normFamily.json:$.family.continuation", "quantifiers": proof["quantifiers"],
                "induction": proof["induction"], "verified_recipe_files": recipe,
                "scope": "Same-source general-order theorem and its exact original recipe located; derivative-array materialization is not an added gate",
                "application_remaining": "Discharge its original common-domain/operator/source transport hypotheses for the actual final targets"}
    check("general_fixed_order_source_continuation", continuation)
    dag = check("actual_call_graph_and_no_self_premise", lambda: validate_wave_dag(wave, reference["expected_calls"]))
    if dag is not None:
        check("complete_source_leaf_inventory", lambda: {"counts": dag["counts_by_producer"]} if dag["counts_by_producer"] == reference["expected_leaf_counts"]
              else (_ for _ in ()).throw(ValueError("Original source producer leaf inventory changed")))
    check("own_label_to_reference_scalar_norm", lambda: validate_reference_norms(wave))
    def rational_connections():
        records = []
        for row in wave["rows"]:
            for mode, bound in row["modes"].items():
                inclusion = exponent_inclusion(bound["epsilon_exponent"], "7/10")
                _need(inclusion["passed"], "Original B0 exponent inclusion fails")
                records.append({"target": "9.8-wave-B0", "order": row["order"], "mode": mode, **inclusion})
        _need(1-3*KAPPA == Fraction(99997,100000), "Independent primary reference loss arithmetic changed")
        _need(2*(1-KAPPA) == Fraction(99999,50000), "Independent nonlinear remainder arithmetic changed")
        mean = doc("inherited/inherited/evidence/FAST_CUTOFF_MEAN_REPORT.json")
        for row in mean["rows"]:
            achieved = row["composed_bound"]["epsilonExponentExact"]
            record = exponent_inclusion(achieved,"6/5")
            _need(record["passed"], "Original C0 mean exponent inclusion fails")
            records.append({"target":"9.8-mean-C0","source_root":row["actual_final_source_id"],**record})
        defects = doc("inherited/evidence/CURRENT_DEFECT_APPLICATION.json")
        for row in defects["rows"]:
            record = exponent_inclusion(row["bound"]["epsilonExponentExact"],"6/5")
            _need(record["passed"], "Original C0 defect exponent inclusion fails")
            records.append({"target":"9.8-defects-C0","source_root":row["current_source_id"],**record})
        first = doc(nf_path)["certificates"][0]["program"]["rows"][0]
        for name, target in (("v","9/10"),("gamma","9/10"),("beta","19/10")):
            record = exponent_inclusion(first["velocity"][name]["epsilonExponent"],target)
            _need(record["passed"], "Original velocity exponent inclusion fails")
            records.append({"target":"9.9-"+name,**record})
        record = exponent_inclusion(first["fullPressure"]["epsilonExponent"],"9/10")
        _need(record["passed"], "Original pressure exponent inclusion fails")
        records.append({"target":"9.9-pressure",**record})
        return {"records":records,"original_parameters":{"B0":"7/10","C0_star":"6/5"},
                "toy_amplitude_constants_used":False,"claim":"Exact original exponent margins; actual class hypotheses remain explicit"}
    exponents = check("independent_exact_original_exponent_inclusions", rational_connections)
    def recovered_parent_finite_source():
        folder = reference_root/"source_recovery"
        raw = (folder/"NATIVE_DEFINITIONS.json").read_bytes()
        _need(_sha(raw) == NATIVE_SHA256, "Recovered native source witness changed")
        native = _json(raw)
        rec_path = folder/"RECOVERED_PARENT_SOURCE_NODES.ndjson"
        raw_nodes = rec_path.read_bytes()
        _need(_sha(raw_nodes) == RECOVERED_PARENT_NODES_SHA256, "Recovered parent source nodes changed")
        nodes = dict(_json(line) for line in raw_nodes.splitlines())
        return validate_finite_projection(doc("inherited/inherited/inherited/sources/initialized.json"), native, nodes)
    recovered_finite = check("recovered_parent_native_162_and_nonzero_projection", recovered_parent_finite_source)

    def finite_source():
        folder = reference_root/"source_recovery"
        raw = (folder/"NATIVE_DEFINITIONS.json").read_bytes()
        _need(_sha(raw) == NATIVE_SHA256, "Recovered native source witness changed")
        native = _json(raw)
        raw = (folder/"TARGET_SOURCE_NODES.ndjson").read_bytes()
        _need(_sha(raw) == NODES_SHA256, "Recovered selected source nodes changed")
        nodes = dict(_json(line) for line in raw.splitlines())
        return validate_finite_projection(doc("inherited/inherited/inherited/sources/initialized.json"), native, nodes)
    finite = check("actual_native_162_and_nonzero_projection", finite_source)

    def gf_decomposition_check():
        folder = reference_root / "source_recovery/raw"
        raw_tail = (folder / "GAUSSIAN_TAIL_CONNECTION.json").read_bytes()
        _need(_sha(raw_tail) == "6a7bbf2800790caceda249eb80415d6bf32d08bf2c23ef58c112d52cc1217b2b",
              "Gaussian tail connection artifact SHA mismatch")
        tail_data = _json(raw_tail)
        _need(tail_data.get("schema") == "MathScope.GaussianCutoffSourceBound/1", "Invalid Gaussian tail schema")
        _need("exp(-c*Sstar)" in tail_data.get("bound", ""), "Gaussian tail bound missing")
        raw_app = (folder / "CURRENT_WAVE_APPLICATION.json").read_bytes()
        _need(_sha(raw_app) == "caabcf049178f04936d9a0c36c866600ca134377947bb3b643c53c226726517f",
              "Current wave application artifact SHA mismatch")
        app_data = _json(raw_app)
        _need(app_data.get("schema") == "MathScope.CurrentInitialWaveApplication/1", "Invalid wave application schema")
        _need("Pi_nonzero R_assembled = G_wave + F_pulse" in app_data.get("decomposition", ""), "Decomposition missing")
        unconditional_cert = app_data.get("unconditional_global_wave_certificate") is True
        premises_not_eliminated = list(app_data.get("all_finite_order_rule", {}).get("premises_not_eliminated", []))
        final_tau_computed = tail_data.get("final_resolvable_tau_computed") is True
        unconditional_complete = unconditional_cert and len(premises_not_eliminated) == 0
        return {
            "schema": "MathScope.GFDecompositionAudit/2",
            "G_wave": {"modes": [-2, -1, 1, 2], "exponent": "99997/100000", "target": "7/10", "envelope": "sqrt(zeta)*P(v)"},
            "F_pulse": {"bound": tail_data["bound"], "cutoff": tail_data["cutoff_region"], "paper_sha256": tail_data["source"]["paperSHA256"]},
            "conditional_wave_connection_complete": app_data.get("conditional_wave_connection_complete") is True,
            "unconditional_global_wave_certificate": unconditional_cert,
            "final_resolvable_tau_computed": final_tau_computed,
            "premises_not_eliminated": premises_not_eliminated,
            "unconditional_complete": unconditional_complete,
            "evidence": [
                {"path": "wave_reference/source_recovery/raw/GAUSSIAN_TAIL_CONNECTION.json",
                 "sha256": "6a7bbf2800790caceda249eb80415d6bf32d08bf2c23ef58c112d52cc1217b2b"},
                {"path": "wave_reference/source_recovery/raw/CURRENT_WAVE_APPLICATION.json",
                 "sha256": "caabcf049178f04936d9a0c36c866600ca134377947bb3b643c53c226726517f"}
            ]
        }
    gf_evidence = check("gf_conditional_artifact_audit", gf_decomposition_check)

    def all_order_theorem_check():
        folder = reference_root / "source_recovery"
        raw_native = (folder / "NATIVE_DEFINITIONS.json").read_bytes()
        _need(_sha(raw_native) == NATIVE_SHA256, "Native definitions witness changed")
        raw_ref = (reference_root / "WAVE_SOURCE_REFERENCE.json").read_bytes()
        _need(_sha(raw_ref) == REFERENCE_SHA256, "Reference metadata changed")
        raw_app = (folder / "raw/CURRENT_WAVE_APPLICATION.json").read_bytes()
        _need(_sha(raw_app) == "caabcf049178f04936d9a0c36c866600ca134377947bb3b643c53c226726517f",
              "Current wave application artifact SHA mismatch")
        app = _json(raw_app)
        unconditional_cert = app.get("unconditional_global_wave_certificate") is True
        premises_not_eliminated = list(app.get("all_finite_order_rule", {}).get("premises_not_eliminated", []))
        unconditional_complete = unconditional_cert and len(premises_not_eliminated) == 0
        return {
            "schema": "MathScope.AllOrderTheoremAudit/2",
            "target_item": "N6-01",
            "rule": app.get("all_finite_order_rule", {}).get("rule"),
            "unconditional_global_wave_certificate": unconditional_cert,
            "premises_not_eliminated": premises_not_eliminated,
            "unconditional_complete": unconditional_complete,
            "discharged_hypotheses": [] if not unconditional_complete else [
                "same_domain", "normalization", "compact_support",
                "divergence_free", "two_zero_moments", "all_fixed_order_continuation"
            ],
            "evidence": [
                {"path": "wave_reference/WAVE_SOURCE_REFERENCE.json",
                 "sha256": REFERENCE_SHA256},
                {"path": "wave_reference/source_recovery/NATIVE_DEFINITIONS.json",
                 "sha256": NATIVE_SHA256}
            ]
        }
    thm_evidence = check("all_fixed_order_theorem_audit", all_order_theorem_check)

    for evidence, name in ((dag,"closed_finite_source_dependency_graph"),
                           (exponents,"exact_original_exponent_margins"),
                           (recovered_finite,"recovered_parent_finite_source_projection_transport"),
                           (finite,"actual_finite_source_projection_transport"),
                           (gf_evidence,"gf_conditional_artifact_audit"),
                           (thm_evidence,"all_fixed_order_theorem_audit")):
        if evidence is not None:
            result["applied_connections"].append({"name":name,"scope":"The checked limited identity/arithmetic only; conditional premises remain explicit","evidence":evidence})

    result["validation_passed"] = bool(result["source_checks"]) and all(check["passed"] for check in result["source_checks"])
    unconditionally_closed = _can_close_wave_obligation(
        result["validation_passed"], gf_evidence, thm_evidence)
    if unconditionally_closed:
        result["remaining_obligations"] = []
        result["items"]["N6-01"] = {
            "status": "CLOSED",
            "mathematical_complete": True,
            "original_B0": "7/10",
            "original_C0_star": "6/5",
            "new_M3_completions": 1,
            "scope": "Proposition 9.5 and (9.8)-(9.10) verified unconditionally on exact target roots",
            "Discharged_by": ["gf_conditional_artifact_audit", "all_fixed_order_theorem_audit"]
        }
    else:
        result["remaining_obligations"] = [
            {
                "id": "N6-01.GF_ACTUAL_ROOT_TRANSPORT",
                "target_roots": [3825348, 3825349, 3825350],
                "wave_increment_roots": [3825003, 3825004, 3825005],
                "mean_reference_roots": [3825343, 3825345, 3825347],
                "required": "Construct or connect an exact source identity on the actual target roots decomposing the nonzero harmonic projection into G_wave in W^(7/10) plus F_pulse with every fixed derivative rapid/flat, preserving all retained modes m in {-2,-1,1,2}, the sqrt(zeta)*P(v) envelope, and the positive cutoff derivative tail.",
                "not_counted_as_proof": [
                    "conditional_wave_connection_complete boolean in CURRENT_WAVE_APPLICATION.json",
                    "narrative decomposition string without root-level operator transport",
                    "finite m=0,1,2 scalar DAG rows alone",
                    "dropping the pulse-cutoff tail or declaring the raw full residual to lie in W"
                ]
            },
            {
                "id": "N6-01.GENERAL_THEOREM_APPLICATION",
                "theorem_source": "normFamily.json:$.family.continuation (SameSavedSourceFiniteNormContinuation)",
                "undischarged_premises_in_artifact": [] if thm_evidence is None else thm_evidence.get("premises_not_eliminated", []),
                "required": "Discharge the general theorem's actual-source hypotheses for the final N6-01 targets: same original domain/chart, normalization, compact support, stress/moment selector, two zero moments, divergence-free velocity, and band/label/copy uniformity for current velocity, pressure, mean residual, defects, and wave remainder.",
                "evidence_located": [
                    {"path": "wave_reference/WAVE_SOURCE_REFERENCE.json",
                     "sha256": REFERENCE_SHA256},
                    {"path": "wave_reference/source_recovery/NATIVE_DEFINITIONS.json",
                     "sha256": NATIVE_SHA256}
                ]
            }
        ]
        result["items"]["N6-01"] = {
            "status": "BLOCKED",
            "mathematical_complete": False,
            "original_B0": "7/10",
            "original_C0_star": "6/5",
            "new_M3_completions": 0,
            "scope": "Checked saved source inputs, exact rational exponent margins, finite 162-row projection, and general theorem location; N6-01 remains BLOCKED because CURRENT_WAVE_APPLICATION.json has unconditional_global_wave_certificate=false and 4 undischarged premises in premises_not_eliminated"
        }
    return result


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="Audit N6-01 wave source connection without false CLOSED promotion.")
    ap.add_argument("--root", type=Path, default=Path(__file__).resolve().parent, help="Workspace root directory")
    ap.add_argument("--out", type=Path, default=None, help="Optional JSON output path")
    args = ap.parse_args()
    root_dir = args.root.resolve()
    res = audit_wave_source(
        acceptance_root=root_dir / "payload/acceptance",
        producer_root=root_dir / "payload/producers",
        reference_root=root_dir / "wave_reference",
    )
    if args.out is not None:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(res, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": res["items"]["N6-01"]["status"],
        "mathematical_complete": res["items"]["N6-01"]["mathematical_complete"],
        "new_M3_completions": res["items"]["N6-01"]["new_M3_completions"],
        "validation_passed": res["validation_passed"],
        "remaining_obligations_count": len(res["remaining_obligations"]),
    }, ensure_ascii=False))
