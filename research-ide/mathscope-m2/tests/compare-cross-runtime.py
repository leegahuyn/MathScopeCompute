#!/usr/bin/env python3
"""Compare stored M2 Node/browser receipts without rounding their mathematical data.

Usage (from the repository root):
  python research-ide/mathscope-m2/tests/compare-cross-runtime.py \
    research-ide/mathscope-m2/evidence/node-cross-runtime-receipts.json.gz \
    research-ide/mathscope-m2/evidence/browser-v60-cross-runtime-receipts.json.gz \
    research-ide/mathscope-m2/evidence/cross-runtime-comparison.json

Inputs may be JSON or gzip JSON. The companion full-leaf report is gzip JSON.
This is a diagnostic, not a tolerance gate or a cross-runtime portability proof.
"""

import argparse
import collections
import gzip
import hashlib
import json
import math
from pathlib import Path
import re
import struct


HEX_DIGEST = re.compile(r"[a-f0-9]{64}")
NUMERIC_TOKEN = re.compile(r"(?<![A-Za-z0-9_])[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?")
TYPES = ("NUMBER", "HASH", "STRING", "BOOLEAN", "TYPE", "ARRAY_LENGTH", "MISSING_KEY", "VALUE", "NONFINITE_NUMBER")
M2 = "research-ide/mathscope-m2/"
M1 = "research-ide/mathscope-m1/"

# These are source-inspection annotations for this finite diagnostic set. They
# do not purport to isolate every native primitive in a long numerical pipeline.
TRACES = {
    "haar_sampling": {
        "grade": "SOURCE_DEPENDENCY_TRACED; FIRST_DIFFERING_NATIVE_PRIMITIVE_NOT_ISOLATED",
        "files": [M2 + "gauge/contracts.mjs", M2 + "gauge/lattice.mjs", M2 + "gauge/quaternion-oracle.mjs", M2 + "gauge/ensemble.mjs"],
        "dependency": "Seeded integer RNG -> Box-Muller sqrt(-2*log(u))*cos(2*pi*v) -> four-dimensional Math.hypot normalization -> SU(2) links -> Wilson measurements and derived statistics. Metropolis also calls Math.log.",
        "limit": "Matching stored acceptance/count/checkpoint data does not record or prove equality of every unpersisted proposal decision. No claim that Math.hypot alone caused this result.",
    },
    "transfer_cutoff": {
        "grade": "SOURCE_DEPENDENCY_TRACED; FIRST_DIFFERING_NATIVE_PRIMITIVE_NOT_ISOLATED",
        "files": [M2 + "gauge/transfer.mjs", M2 + "gauge/quaternion-oracle.mjs", M2 + "gauge/contracts.mjs", M2 + "gauge/enclosures.mjs"],
        "dependency": "Haar quadrature inputs depend on Box-Muller/normalization; the symmetric eigensolver uses atan2/sin/cos; finite real-time verification uses log/sin/cos/hypot. The transfer exponential enclosure itself uses the explicit enclosure implementation, not an unqualified native-exp enclosure.",
        "limit": "The reported operator-error allowance changes by a small absolute amount; no universal bound on all runtimes follows from this comparison.",
    },
    "small_lattice_reference": {
        "grade": "SOURCE_DEPENDENCY_TRACED; FIRST_DIFFERING_NATIVE_PRIMITIVE_NOT_ISOLATED",
        "files": [M2 + "gauge/reference.mjs", M2 + "gauge/quaternion-oracle.mjs", M2 + "gauge/ensemble.mjs"],
        "dependency": "Independent Haar quaternion importance sampling and the matrix ensemble both contain native normal draws/normalization; confidence radii use log/sqrt. Their implementations remain separate.",
        "limit": "The independent oracle and all stored pass/fail values agree across these two runs; this does not establish equality for every input or seed.",
    },
    "reference_envelope": {
        "grade": "SOURCE_FORMULA_TRACED; NATIVE_PRIMITIVE_NOT_INDEPENDENTLY_ISOLATED",
        "files": [M2 + "navier/source-envelope.mjs"],
        "dependency": "For identical lambda0=sqrt(2), u=2, length=8, row 27 has s=2.6875. logP uses asinh(s)-asinh(u) and (1+u*u)**1.5. Only this reference-envelope scalar differs; the stored integrated ODE samples and ODE diagnostics are identical.",
        "limit": "This identifies the executed reference formula, not a separately measured browser asinh primitive or an actual ODE-solution discrepancy.",
    },
    "angular_quadrature": {
        "grade": "SOURCE_FORMULA_TRACED; NATIVE_PRIMITIVE_NOT_INDEPENDENTLY_ISOLATED",
        "files": [M2 + "navier/index.mjs"],
        "dependency": "The differing scalar is sum_{i=0}^{127} cos(2*pi*i/128)^2/128. The analytic angular factor, covariance matrix, reconstructed target, and checks are unchanged.",
        "limit": "Individual browser cosine evaluations were not instrumented in these receipts.",
    },
    "source_pulse_curl": {
        "grade": "SOURCE_DEPENDENCY_TRACED; FIRST_DIFFERING_NATIVE_PRIMITIVE_NOT_ISOLATED",
        "files": [M2 + "navier/source-pulse-curl.mjs"],
        "dependency": "The source jets call exp/sin/cos; Cartesian evaluation uses hypot/atan2/powers and finite differences. The largest difference is in a cancellation-sensitive centered finite-difference divergence. Source checks, conjugacy, and negative-control verdicts are unchanged.",
        "limit": "The discrepancy in a finite-difference residual is not itself a rigorous bound on the field error.",
    },
    "finite_spectral_exp": {
        "grade": "DIRECT_SAME_INPUT_SOURCE_EXPRESSION_WITNESS_AVAILABLE",
        "files": [M1 + "gauge/family.mjs", M2 + "observatory/index.mjs"],
        "dependency": "upperBound=C0*Math.exp(-delta*time/hbar). For the stored witness C0=1, delta=.5, time=.75, hbar=1, the expression is exactly Math.exp(-.375); the two recorded values differ by one binary64 ULP.",
        "limit": "This isolates one direct native exp discrepancy. It does not identify every primitive responsible for every other differing leaf.",
    },
    "effective_field_covariance": {
        "grade": "SOURCE_DEPENDENCY_TRACED; FIRST_DIFFERING_NATIVE_PRIMITIVE_NOT_ISOLATED",
        "files": [M1 + "gauge/fields.mjs", M1 + "gauge/matrix.mjs", M2 + "observatory/index.mjs"],
        "dependency": "The additional small difference is in the classical field's independent finite-difference covariance residual; its recorded tolerance verdict is unchanged.",
        "limit": "A cancellation-sensitive verification residual can have a large ULP/relative change despite a small absolute difference.",
    },
    "finite_blowup_profile": {
        "grade": "SOURCE_DEPENDENCY_TRACED; FIRST_DIFFERING_NATIVE_PRIMITIVE_NOT_ISOLATED",
        "files": [M1 + "navier/profile.mjs", M1 + "navier/coordinates.mjs", M2 + "observatory/index.mjs"],
        "dependency": "M1 constructs logarithmically spaced X using exp/log. Stored X differs in a low bit; finite profile evaluation and similarity-to-physical velocity use sqrt/powers/trigonometry. The displayed X labels preserve that actual source difference.",
        "limit": "No equal-velocity/different-hypot witness was found; therefore this diagnostic does not attribute these values specifically to Math.hypot. This remains a finite candidate observation, not a blowup theorem.",
    },
}
EXAMPLE_TRACES = {
    "m2-su2-wilson-ensemble": ["haar_sampling"],
    "m2-su2-cube-transfer-cutoff": ["haar_sampling", "transfer_cutoff"],
    "m2-su2-small-lattice-reference": ["haar_sampling", "small_lattice_reference"],
    "m2-su2-haar-reference": ["haar_sampling"],
    "ns-m2-pulse-ode": ["reference_envelope"],
    "ns-m2-covariance": ["angular_quadrature"],
    "ns-m2-pulse-curl": ["source_pulse_curl"],
    "i2-delta-assumed_bound": ["finite_spectral_exp"],
    "i2-delta-units": ["finite_spectral_exp"],
    "i2-delta-effective_model": ["finite_spectral_exp", "effective_field_covariance"],
    "i2-delta-ensemble_estimate": ["haar_sampling"],
    "i2-blowup-pair": ["finite_blowup_profile"],
}


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def read_json(path):
    raw = path.read_bytes()
    decoded = gzip.decompress(raw) if raw[:2] == b"\x1f\x8b" else raw
    return json.loads(decoded), {"name": path.name, "bytes": len(raw), "sha256": sha256(raw), "decodedBytes": len(decoded), "decodedSha256": sha256(decoded)}


def write_json(path, value):
    raw = (json.dumps(value, ensure_ascii=False, indent=None if path.suffix == ".gz" else 2, allow_nan=False) + "\n").encode()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(gzip.compress(raw, mtime=0) if path.suffix == ".gz" else raw)


def normalize(data):
    """Accept stored jobs and common wrapper shapes, rejecting duplicate job IDs."""
    found = {}
    wrappers = ("jobs", "results", "records", "runs", "job", "result", "value", "data", "content")

    def walk(value, context=None):
        if isinstance(value, list):
            for item in value:
                walk(item, context)
        elif isinstance(value, dict):
            label = value.get("exampleId", value.get("example", value.get("id", context)))
            if isinstance(label, dict):
                label = label.get("id", context)
            if "request" in value and "result" in value and ("mathematicalHash" in value or "inputHash" in value):
                if context is not None and (not label or str(label).startswith("m2-job:")):
                    label = context
                if label is None or str(label) in found:
                    raise ValueError("Missing or duplicated example ID: " + str(label))
                found[str(label)] = value
                return
            for key in wrappers:
                if key in value:
                    walk(value[key], label)
            if not any(k in value for k in wrappers):
                for key, item in value.items():
                    if isinstance(item, (dict, list)):
                        walk(item, key)

    walk(data)
    return found


def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def digest(value):
    return isinstance(value, str) and HEX_DIGEST.fullmatch(value) is not None


def bits(value):
    return struct.pack(">d", float(value)).hex()


def ordered_bits(value):
    raw = struct.unpack(">Q", struct.pack(">d", float(value)))[0]
    return (~raw & 0xffffffffffffffff) if raw >> 63 else raw | (1 << 63)


def ulps(a, b):
    return 0 if a == b else abs(ordered_bits(a) - ordered_bits(b))


def string_classification(a, b, path):
    if path.endswith(".label") and NUMERIC_TOKEN.sub("<NUMBER>", a) == NUMERIC_TOKEN.sub("<NUMBER>", b):
        return "NUMERIC_DISPLAY_LABEL"
    return "OTHER_STRING"


def compare(a, b, path="result", ignore_metrics=True):
    rows = []
    examined = collections.Counter()

    def visit(x, y, current):
        # Exactly the exclusion used by the engine's mathematical result hash.
        # In particular, nested executionMetrics and every status are compared.
        if ignore_metrics and current == "result.executionMetrics":
            examined["excludedTopLevelExecutionMetrics"] += 1
            return
        if number(x) and number(y):
            examined["numericLeaves"] += 1
            if x == y:
                return
            if math.isfinite(x) and math.isfinite(y):
                absolute = abs(x - y)
                rows.append({"path": current, "type": "NUMBER", "node": x, "browser": y, "nodeFloat64": bits(x), "browserFloat64": bits(y), "absoluteError": absolute, "relativeError": absolute / max(abs(x), abs(y), 1e-300), "ulpDistance": ulps(x, y)})
            else:
                rows.append({"path": current, "type": "NONFINITE_NUMBER", "node": str(x), "browser": str(y)})
        elif type(x) is not type(y):
            rows.append({"path": current, "type": "TYPE", "nodeType": type(x).__name__, "browserType": type(y).__name__})
        elif isinstance(x, dict):
            examined["objects"] += 1
            for key in sorted(set(x) | set(y)):
                if key not in x or key not in y:
                    rows.append({"path": current + "." + key, "type": "MISSING_KEY", "missing": "NODE" if key not in x else "BROWSER"})
                else:
                    visit(x[key], y[key], current + "." + key)
        elif isinstance(x, list):
            examined["arrays"] += 1
            if len(x) != len(y):
                rows.append({"path": current, "type": "ARRAY_LENGTH", "node": len(x), "browser": len(y)})
            for i, (u, v) in enumerate(zip(x, y)):
                visit(u, v, current + "[" + str(i) + "]")
        else:
            kind = "HASH" if digest(x) and digest(y) else "BOOLEAN" if isinstance(x, bool) else "STRING" if isinstance(x, str) else "VALUE"
            examined[{"HASH": "digestLeaves", "BOOLEAN": "booleanLeaves", "STRING": "stringLeaves", "VALUE": "otherLeaves"}[kind]] += 1
            if x != y:
                row = {"path": current, "type": kind, "node": x, "browser": y}
                if kind == "STRING":
                    row["classification"] = string_classification(x, y, current)
                rows.append(row)

    visit(a, b, path)
    return rows, dict(examined)


def summarize(rows):
    numeric = [r for r in rows if r["type"] == "NUMBER"]
    counts = collections.Counter(r["type"] for r in rows)
    bins = collections.Counter()
    for row in numeric:
        n = row["ulpDistance"]
        bins["1" if n == 1 else "2..4" if n <= 4 else "5..16" if n <= 16 else "17..1024" if n <= 1024 else ">1024"] += 1
    strings = [r for r in rows if r["type"] == "STRING"]
    return {
        "differenceCounts": {kind: counts[kind] for kind in TYPES},
        "numericULPBinsExclusive": {key: bins[key] for key in ("1", "2..4", "5..16", "17..1024", ">1024")},
        "maximumAbsolute": max(numeric, key=lambda r: r["absoluteError"]) if numeric else None,
        "maximumRelative": max(numeric, key=lambda r: r["relativeError"]) if numeric else None,
        "maximumULP": max(numeric, key=lambda r: r["ulpDistance"]) if numeric else None,
        "hashFieldsByName": dict(sorted(collections.Counter(r["path"].rsplit(".", 1)[-1] for r in rows if r["type"] == "HASH").items())),
        "stringClassification": {key: sum(r["classification"] == key for r in strings) for key in ("NUMERIC_DISPLAY_LABEL", "OTHER_STRING")},
        "stringExamples": strings[:2],
    }


def direct_exp_witness(node, browser, source_root):
    key = "i2-delta-assumed_bound"
    if key not in node or key not in browser:
        return None
    left = [data[key]["result"]["pairs"][0]["left"] for data in (node, browser)]
    models = [state["spectral"]["model"] for state in left]
    rows = [state["correlator"][6] for state in left]
    inputs = [{"C0": sum(model["weights"]), "delta": model["declaredLowerBound"], "time": row["time"], "hbar": model["hbar"]} for model, row in zip(models, rows)]
    actual = inputs[0]
    expression = "upperBound=C0*Math.exp(-s.delta*t/s.hbar)"
    path = source_root / (M1 + "gauge/family.mjs")
    source = path.read_text() if path.is_file() else ""
    source_found = expression in source
    exponent = -actual["delta"] * actual["time"] / actual["hbar"]
    exact_reduction = inputs[0] == inputs[1] and actual == {"C0": 1, "delta": .5, "time": .75, "hbar": 1} and exponent == -.375
    return {
        "exampleId": key, "path": "result.pairs[0].left.correlator[6].upperBound",
        "sourceFile": M1 + "gauge/family.mjs", "sourceExpression": expression,
        "sourceExpressionPresent": source_found,
        "sourceLine": source[:source.index(expression)].count("\n") + 1 if source_found else None,
        "inputs": inputs, "inputsEqual": inputs[0] == inputs[1], "exponent": exponent,
        "node": rows[0]["upperBound"], "browser": rows[1]["upperBound"],
        "nodeFloat64": bits(rows[0]["upperBound"]), "browserFloat64": bits(rows[1]["upperBound"]),
        "ulpDistance": ulps(rows[0]["upperBound"], rows[1]["upperBound"]),
        "grade": "DIRECT_SAME_INPUT_SOURCE_EXPRESSION_WITNESS" if source_found and exact_reduction else "WITNESS_PRECONDITIONS_NOT_MET",
        "reason": "C0 is exactly 1 and the identical binary64 exponent is exactly -0.375; multiplication by 1 leaves the native Math.exp output unchanged. The stored upperBound therefore exposes that direct call's result, rather than merely a downstream difference.",
        "separateBrowserPrimitiveInstrumentation": False,
    }


def self_test():
    assert ulps(1.0, math.nextafter(1.0, math.inf)) == 1
    assert ulps(-1.0, math.nextafter(-1.0, -math.inf)) == 1
    assert compare({"executionMetrics": {"wall": 1}}, {"executionMetrics": {"wall": 2}})[0] == []
    assert compare({"nested": {"executionMetrics": 1}}, {"nested": {"executionMetrics": 2}})[0][0]["type"] == "NUMBER"
    assert compare({"pass": True}, {"pass": False})[0][0]["type"] == "BOOLEAN"
    assert compare({"status": "PASS"}, {"status": "FAIL"})[0][0]["classification"] == "OTHER_STRING"
    assert compare({"label": "X=1.0; stage=A"}, {"label": "X=1.0000000000000002; stage=A"})[0][0]["classification"] == "NUMERIC_DISPLAY_LABEL"
    assert compare([1], [1, 2])[0][0]["type"] == "ARRAY_LENGTH"
    assert compare({"x": 1}, {})[0][0]["type"] == "MISSING_KEY"
    assert compare(1, "1")[0][0]["type"] == "TYPE"
    assert compare("a" * 64, "b" * 64)[0][0]["type"] == "HASH"
    assert compare({"x": [True, 2, "same", None]}, {"x": [True, 2, "same", None]})[0] == []
    return 12


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("node_receipts", type=Path, nargs="?")
    parser.add_argument("browser_receipts", type=Path, nargs="?")
    parser.add_argument("output", type=Path, nargs="?")
    parser.add_argument("--leaves", type=Path, help="Full differing-leaf gzip JSON path")
    parser.add_argument("--source-root", type=Path, default=Path(__file__).resolve().parents[3])
    parser.add_argument("--baseline", type=Path, help="Optional independent static-worker-parity.json")
    parser.add_argument("--runtime-audit", type=Path, help="Optional later browser runtime-binding audit; never substituted for the original receipts")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    tests = self_test()
    if args.self_test and not any((args.node_receipts, args.browser_receipts, args.output)):
        print(json.dumps({"selfTestsPassed": tests}))
        return
    if not all((args.node_receipts, args.browser_receipts, args.output)):
        parser.error("provide Node receipts, browser receipts, and output summary")
    local_data, local_metadata = read_json(args.node_receipts)
    browser_data, browser_metadata = read_json(args.browser_receipts)
    node, browser = normalize(local_data), normalize(browser_data)
    if not node or not browser:
        raise ValueError("No full job receipts found")
    baseline_path = args.baseline or args.source_root / (M2 + "evidence/static-worker-parity.json")
    baseline = None
    if baseline_path.is_file():
        baseline, baseline_metadata = read_json(baseline_path)
    baseline_by_id = {r["id"]: r for r in baseline.get("records", [])} if baseline else {}
    records, leaf_records, total_examined = [], [], collections.Counter()
    for name in sorted(set(node) | set(browser)):
        a, b = node.get(name), browser.get(name)
        if a is None or b is None:
            records.append({"exampleId": name, "missing": "NODE" if a is None else "BROWSER"})
            continue
        differences, examined = compare(a["result"], b["result"])
        requests, _ = compare(a["request"], b["request"], "request", False)
        checkpoints, _ = compare(a.get("checkpoint"), b.get("checkpoint"), "checkpoint", False)
        total_examined.update(examined)
        leaf_records.append({"exampleId": name, "resultDifferences": differences, "requestDifferences": requests, "checkpointDifferences": checkpoints})
        reference = baseline_by_id.get(name)
        records.append({
            "exampleId": name, "kind": a["request"].get("kind"), "nodeStatus": a.get("status"), "browserStatus": b.get("status"),
            "statusEqual": a.get("status") == b.get("status"), "requestEqual": not requests,
            "inputHashEqual": a.get("inputHash") == b.get("inputHash"), "checkpointEqual": not checkpoints,
            "nodeMathematicalHash": a.get("mathematicalHash"), "browserMathematicalHash": b.get("mathematicalHash"),
            "mathematicalHashEqual": a.get("mathematicalHash") == b.get("mathematicalHash"),
            "nodeMatchesIndependentStaticWorkerBaseline": a.get("mathematicalHash") == reference.get("mathematicalHash") if reference else None,
            "environmentHashEqual": a.get("environmentHash") == b.get("environmentHash"),
            "examined": examined, "sourceDependencyTraceIds": EXAMPLE_TRACES.get(name, []), **summarize(differences),
        })
    all_rows = [row for record in leaf_records for row in record["resultDifferences"]]
    present = [r for r in records if "missing" not in r]
    total = summarize(all_rows)
    traces_used = sorted({trace for r in present for trace in r["sourceDependencyTraceIds"]})
    source_files = sorted({file for trace in traces_used for file in TRACES[trace]["files"]})
    source_artifacts = [{"path": file, "sha256": sha256((args.source_root / file).read_bytes()) if (args.source_root / file).is_file() else None} for file in source_files]
    env = local_data.get("environment", {}) if isinstance(local_data, dict) else {}
    browser_worker = browser_data.get("workerSha256") if isinstance(browser_data, dict) else None
    runtime_audit_path = args.runtime_audit or args.source_root / (M2 + "evidence/browser-v61-runtime-audit.json")
    later_audit = None
    exp_witness = direct_exp_witness(node, browser, args.source_root)
    if runtime_audit_path.is_file():
        audit, audit_metadata = read_json(runtime_audit_path)
        later_environment = audit.get("environment", {})
        later_runtime = later_environment.get("runtime", {})
        samples = later_runtime.get("mathProbe", {}).get("samples", [])
        relevant_probes = [r for r in samples if r.get("name") in ("exp(-0.375)", "asinh(2.6875)")]
        later_audit = {"source": audit_metadata, "pageVersion": audit.get("version"), "environmentSchema": later_environment.get("schema"), "environmentHash": later_environment.get("hash"), "reportedBrowserIdentity": later_runtime.get("identity"), "probeCount": len(samples), "probeSha256": later_runtime.get("mathProbe", {}).get("sha256"), "scope": later_runtime.get("scope"), "portabilityGuarantee": later_runtime.get("portabilityGuarantee"), "workerSha256MatchesOriginalReceipts": later_environment.get("workerSha256") == browser_worker, "relevantProbes": relevant_probes, "interpretation": "Separate later calling-runtime probes corroborate the native Math behavior. This metadata does not retrospectively become part of the older job receipts and does not attest a remote or custom worker runtime."}
        exp_probe = next((p for p in relevant_probes if p["name"] == "exp(-0.375)"), None)
        if exp_witness and exp_probe:
            exp_witness["laterBrowserCallingRuntimeProbeFloat64"] = exp_probe["float64"]
            exp_witness["laterBrowserProbeMatchesOriginalReceipt"] = exp_probe["float64"] == exp_witness["browserFloat64"]
    leaves_path = args.leaves or args.output.with_name(args.output.stem + "-leaves.json.gz")
    leaf_report = {"schema": "MathScope.CrossRuntimeDifferingLeaves/1", "counting": "Every stored occurrence is counted, including repeated source data and visualization aliases.", "records": leaf_records}
    write_json(leaves_path, leaf_report)
    _, leaves_metadata = read_json(leaves_path)
    report = {
        "schema": "MathScope.CrossRuntimeComparison/1",
        "scope": {
            "selection": "The 12 M2 examples whose v59 Chrome mathematical hashes differed from the 64-example Node/static-Worker baseline; full Chrome receipts were captured on page v60 with the same Worker.",
            "evidenceKind": "EXACT_RECEIPT_COMPARISON_AND_SOURCE_DEPENDENCY_DIAGNOSIS",
            "comparison": "Compare exact normalized requests and mathematical result objects recursively. Exclude only the top-level result.executionMetrics, exactly as the engine mathematical hash does. Do not round values or suppress nested metadata, checks, statuses, booleans, keys, or array lengths.",
            "numericPolicy": "Absolute error is |a-b|. Relative error is |a-b|/max(|a|,|b|,1e-300). ULP distance is the distance between sign-ordered IEEE754 binary64 bit patterns; signed zeros compare equal. Bins are exclusive. Large relative/ULP differences in near-zero residuals are not evidence of a large absolute physical error.",
            "counting": "Repeated occurrences of the same quantity and visualization aliases count as separate stored leaves. Job timestamps/IDs/outer receipt hashes are not mathematical result leaves. Top-level job status and checkpoint are compared separately.",
            "runtimeBoundary": "These receipts predate MathScope.M2Environment/2 and do not retrospectively contain its runtime fingerprint. Exact mathematical hashes intentionally remain different across these runtimes. A finite runtime fingerprint is not a portability theorem or a remote-worker attestation.",
            "allInputsOrSeedsCertified": False, "crossRuntimeBitwiseEquality": len(present) == len(node) == len(browser) and all(r["mathematicalHashEqual"] for r in present), "toleranceGateApplied": False,
            "algorithmsChangedByDiagnostic": False, "separateBrowserPrimitiveInstrumentation": False,
        },
        "inputs": {"node": local_metadata, "browser": browser_metadata},
        "runtime": {"node": local_data.get("runtime"), "browserPageVersion": browser_data.get("browserPageVersion"), "browserIdentityInReceipt": None, "browserIdentityScope": "The stored browser receipts identify the page version and Worker source digest; no user-agent or JS-engine version was stored in this capture."},
        "worker": {"nodeDeclaredSha256": env.get("workerSha256"), "browserDeclaredSha256": browser_worker, "declarationsEqual": bool(browser_worker) and env.get("workerSha256") == browser_worker, "independentStaticWorkerBaseline": baseline_metadata if baseline else None, "baselineCount": baseline.get("count") if baseline else None, "baselineWorkerSha256": baseline.get("workerSha256") if baseline else None},
        "originalEnvironment": {"nodeSchema": env.get("schema"), "nodeHash": env.get("hash"), "browserHashes": sorted({job.get("environmentHash", "") for job in browser.values()}), "nodeContainsRuntimeIdentity": "runtime" in env, "note": "The original environment distinguishes execution mode but not a JS-runtime/Math identity. The later application-only environment fix is outside this unchanged-Worker result comparison."},
        "totals": {"nodeJobs": len(node), "browserJobs": len(browser), "comparedJobs": len(present), "missingJobs": [r for r in records if "missing" in r], "identicalRequests": sum(r["requestEqual"] for r in present), "identicalInputHashes": sum(r["inputHashEqual"] for r in present), "identicalStatuses": sum(r["statusEqual"] for r in present), "identicalCheckpoints": sum(r["checkpointEqual"] for r in present), "identicalMathematicalHashes": sum(r["mathematicalHashEqual"] for r in present), "nodeStaticWorkerBaselineMatches": sum(r["nodeMatchesIndependentStaticWorkerBaseline"] is True for r in present), "examined": dict(total_examined), **total},
        "records": records,
        "directNativeExpWitness": exp_witness,
        "laterBrowserRuntimeAudit": later_audit,
        "sourceDependencyTraces": {key: TRACES[key] for key in traces_used},
        "sourceArtifactsAtDiagnosis": source_artifacts,
        "ecmaScriptReference": {"url": "https://tc39.es/ecma262/multipage/numbers-and-dates.html", "sections": ["21.3.2.12 Math.cos", "21.3.2.14 Math.exp", "21.3.2.19 Math.hypot"], "statement": "These Math functions return implementation-approximated Number values. This specification fact permits the kind of runtime difference observed; the receipt and direct-expression witness establish the actual difference here."},
        "reproduction": {"script": M2 + "tests/compare-cross-runtime.py", "scriptSha256": sha256(Path(__file__).read_bytes()), "selfTestsPassed": tests, "fullLeaves": leaves_metadata, "commandFromRepositoryRoot": "python " + M2 + "tests/compare-cross-runtime.py " + M2 + "evidence/node-cross-runtime-receipts.json.gz " + M2 + "evidence/browser-v60-cross-runtime-receipts.json.gz " + M2 + "evidence/cross-runtime-comparison.json"},
    }
    write_json(args.output, report)
    print(json.dumps({"summary": str(args.output), "leaves": str(leaves_path), "jobs": len(present), "differenceCounts": total["differenceCounts"], "stringClassification": total["stringClassification"], "identicalRequests": report["totals"]["identicalRequests"], "identicalStatuses": report["totals"]["identicalStatuses"], "selfTestsPassed": tests}))


if __name__ == "__main__":
    main()
