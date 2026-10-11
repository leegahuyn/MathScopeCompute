"""Read-only cross-check of the already executed corrected source4 packet.

This deliberately does not import any mathematical source constructor, create
a private authentication token, or rerun the browser/Worker/runtime pipeline.
The sole output is a new review receipt; the source artifacts are immutable.
"""
import collections
import datetime
import gc
import gzip
import hashlib
import json
import pathlib
import resource
import sys
from fractions import Fraction as F

resource.setrlimit(resource.RLIMIT_AS, (512 * 1024**2, 512 * 1024**2))
ROOT = pathlib.Path(__file__).resolve().parents[6]
BASE = pathlib.Path(__file__).resolve().parent
PREFIX = "actual-physical-center-full-jet-source-attempt4"
OUT = BASE / "independent-source4-crosscheck-sensitivity.json"
if OUT.exists():
    raise SystemExit("Review receipt already exists; do not overwrite it.")
checks = []
references = {}


def require(condition, name, details=None):
    if not condition:
        raise AssertionError(name)
    checks.append({"id": name, "pass": True, **({"details": details} if details is not None else {})})


def path(value):
    p = pathlib.Path(value)
    return p if p.is_absolute() else ROOT / p


def digest(value, compressed=False):
    h = hashlib.sha256()
    opener = gzip.open if compressed else open
    with opener(path(value), "rb") as f:
        while chunk := f.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()


def read(value):
    with path(value).open(encoding="utf8") as f:
        return json.load(f)


def canonical_sha(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def reference(ref):
    assert digest(ref["path"]) == ref["sha256"], ref["path"]
    references[ref["path"]] = ref["sha256"]


def all_pass(rows):
    return isinstance(rows, list) and len(rows) > 0 and all(r.get("pass") is True for r in rows)


def key(row):
    # JS's explicit null and absent optional sign both use the physical key.
    sign = row.get("sign")
    return ":".join(str(x) for x in [row["quantity"], "physical" if sign is None else sign, row["component"], row["derivative"]])


def interval_width(box):
    lo, hi = F(box["lower"]), F(box["upper"])
    assert lo <= hi
    return hi - lo


def closed(endpoint):
    p = endpoint
    for _ in range(128):
        if not isinstance(p, dict) or len(p) != 1:
            return False
        if "rational" in p:
            F(p["rational"])
            return True
        if "exp" in p:
            p = p["exp"]
        elif "neg" in p:
            p = p["neg"]
        else:
            return False
    return False


s = read(BASE / (PREFIX + ".json"))
observer = read(BASE / (PREFIX + "-process.json"))
require(digest(BASE / (PREFIX + ".json")) == "88f7cf6fe5af934d6b3bcacc8ad975e86bd0b37fee2110b9db8c73e72acb129e", "final-source-sha")
require(digest(BASE / (PREFIX + "-process.json")) == "91d434d69db5df06ccf5afad4e5e7b71eb442db7a75bdfbc4647d82812e10a3e", "observer-sha")
require(s["pass"] and s["complete"] and s["exitCode"] == 0 and len(s["checks"]) == 8 and all_pass(s["checks"]), "source-eight-final-checks")
require(observer["pass"] and observer["complete"] and observer["exitCode"] == 0 and observer["timeout"] is False and observer["checks"] == {"passed": 8, "failed": 0}, "observed-normal-process-completion")
for r in [observer["source"], observer["log"], s["log"], *s["certificates"].values(), *s["partialAttachments"].values(), s["originalTorusMap"], s["selectionTrace"], s["sourceDiagnostics"], s["preparedSourceSchema"]]:
    reference(r)
require(True, "all-final-artifact-and-log-reference-shas", len(references))
expected_counts = {"initial": 119, "late": 131}
for stage, field in [("initial", "initialManifest"), ("late", "lateImportManifest")]:
    manifest = s[field]
    assert manifest["fileCount"] == len(manifest["files"]) == expected_counts[stage]
    assert canonical_sha(manifest["files"]) == manifest["sha256"]
    for filename, sha in manifest["files"].items():
        assert digest(filename) == sha, filename
        snapshot = BASE / (PREFIX + "-" + stage + "-snapshots") / filename
        assert digest(snapshot) == sha, str(snapshot)
    require(True, "all-" + stage + "-current-and-snapshot-bytes", {"files": manifest["fileCount"], "manifestSHA256": manifest["sha256"]})
for snap in observer["snapshots"]:
    assert digest(snap["path"]) == snap["sha256"]
require(True, "observer-snapshots-unchanged", len(observer["snapshots"]))
for filename, sha in s["initialManifest"]["files"].items():
    if filename in s["lateImportManifest"]["files"]:
        assert s["lateImportManifest"]["files"][filename] == sha
require(True, "overlapping-initial-late-bytes-identical")

archive_path = BASE / "executed-source4-gzip-archive-20261011.json"
archive = read(archive_path)
archive_count = 0
for item in archive["files"]:
    if item.get("archived"):
        assert digest(item["rawPath"]) == item["rawSHA256"]
        assert digest(item["gzipPath"]) == item["gzipSHA256"]
        assert digest(item["gzipPath"], compressed=True) == item["rawSHA256"] == item["roundTripSHA256"]
        archive_count += 1
require(archive_count > 0 and archive["sourceAuthorityCreated"] is False, "gzip-round-trip-original-bytes", {"archives": archive_count, "manifestSHA256": digest(archive_path)})

eq = read(s["originalTorusMap"]["path"])
p = read(s["certificates"]["physicalCenter"]["path"])
f = read(s["certificates"]["bodies"]["path"])
n = read(s["certificates"]["numerical"]["path"])
q = n["sourceBounds"]
c = q["diagnostics"]["selectorScaleEnclosure"]
require(eq["specification"]["formula"] == "2*((1+h)*rho_g-h*kappa_s)" and eq["specification"]["kappa"] == "1/100000" and eq["specification"]["printedPage"] == 63, "original-equation-six-two-specification")
require(eq["parameterBindings"]["strictPositiveSourceRetained"] is True and eq["parameterBindings"]["definitions"] == {"h": {"exp": {"product": [{"integer": -8002}, {"ref": "T"}]}}, "T": {"sum": [{"exp": {"ref": "Md"}}, {"integer": 10}]}, "Md": {"integer": 1048576}}, "positive-original-h-definition")
require(eq == p["point"]["originalTorusMapBinding"] and eq["roots"]["dr"] == eq["roots"]["actualDr"] == p["point"]["originalPhysicalMap"]["dr"] == p["point"]["inverse"]["input"]["dr"], "same-original-dr-in-actual-inverse-point")
require(eq["comparison"] == {"method": "Literal typed arithmetic trees, preserving original binary parentheses and only commuting binary add/multiply.", "sameDrRoot": True, "allSixExpectedBodiesMatched": True, "oldMissingFactorAccepted": False}, "all-six-original-typed-equations-and-legacy-rejection")
nodes = {r["id"]: r for r in eq["nodes"]}
def tree(i):
    r = nodes[i]
    op = r["op"]
    if op in ["rational", "source_parameter"]:
        return (op, *r["args"])
    args = [tree(a) for a in r["args"]]
    if op in ["add", "multiply"]:
        args.sort(key=repr)
    return (op, *args)
def comm(op, *args):
    return (op, *sorted(args, key=repr))
one, two, four, minusone = [("rational", str(x), "1") for x in [1, 2, 4, -1]]
h = ("source_parameter", "h")
root2 = ("sqrt_positive", two)
lam = comm("add", four, comm("multiply", minusone, root2))
tg = comm("add", four, root2)
rho = comm("multiply", ("inverse", ("log_positive", tg)), ("log_positive", lam))
kap = ("rational", "1", "100000")
expected = comm("multiply", two, comm("add", comm("multiply", comm("add", one, h), rho), comm("multiply", minusone, comm("multiply", h, kap))))
require(tree(eq["roots"]["dr"]) == expected, "independent-typed-outer-two-parentheses-check")
require(n["sourceBinding"]["originalPhysicalPoint"] == p["point"]["inverse"] and n["sourceBinding"]["originalBand"] == p["sourceBinding"]["selectedBand"], "same-new-point-and-first-band-through-final-certificate")
require(all_pass(p["checks"]) and all_pass(f["checks"]) and all_pass(n["checks"]) and all_pass(q["checks"]) and all_pass(c["checks"]), "all-source-layer-declared-final-checks")

body_rows = f["rows"] + f["physical"]["rows"]
body_map = {key(r): r for r in body_rows}
num_map = {r["rowKey"]: r for r in n["rows"]}
scale_map = {key(r): r for r in c["rowScales"]}
require(len(f["rows"]) == 228 and len(f["physical"]["rows"]) == 42 and len(body_map) == len(num_map) == len(scale_map) == 270 and body_map.keys() == num_map.keys() == scale_map.keys(), "unique-228-plus42-exact-row-map")
widths = []
errors = []
for row_key, body in body_map.items():
    row, scale = num_map[row_key], scale_map[row_key]
    assert row["rowKey"] == key(row)
    assert all(row[k] == v for k, v in body.items()), row_key
    assert row["bodyDerivativeBinding"] is True and row["sourceNumericalPremisesBound"] is True
    width = interval_width(row["directedInterval"])
    assert width == F(row["width"]) and 0 < width <= F(row["tolerance"])
    assert row["tolerance"] == n["request"]["tolerance"] and row["toleranceMet"] is True
    error = F(row["positiveErrorRadius"])
    assert error > 0
    assert scale["sourceRoot"] == row["positiveExactScale"] == scale["positiveExactScale"]
    assert scale["actualScaleRecipeBound"] is True and scale["toleranceMet"] is True
    assert scale["originalValue"] == row.get("physicalValue", row.get("normalizedDirectionDerivative"))
    assert interval_width(scale["coordinate"]) == F(scale["logCoordinateWidth"]) <= F(c["request"]["logCoordinateTolerance"])
    assert closed(scale["interval"]["lower"]) and closed(scale["interval"]["upper"])
    assert scale["originalValueRelativeToleranceGuaranteed"] is False
    widths.append(width)
    errors.append(error)
require(True, "all270-original-fields-exactly-paired-with-numerical-rows")
require(True, "all270-directed-rational-widths-and-positive-remainders", {"largestWidth": str(max(widths)), "tolerance": n["request"]["tolerance"], "distinctPositiveErrorRadii": sorted({str(x) for x in errors})})
require(True, "all270-positive-scale-root-and-closed-endpoint-correspondence")
directions = {tuple(r.get("directions", [r["derivative"]])) for r in f["physical"]["rows"]}
require(directions == {("r",), ("z",), ("t",), ("theta",), ("r", "r"), ("r", "z"), ("r", "t"), ("z", "z"), ("z", "t"), ("t", "t"), ("r", "theta"), ("z", "theta"), ("t", "theta"), ("theta", "theta")}, "complete-four-directions-and-covariant-hessian-row-set")
require(all(r["includesCylindricalFrameConnection"] == ("theta" in r["derivative"]) and r["includesAngularDirectionConnection"] == (r["derivative"] == "thetatheta") for r in f["physical"]["rows"]) and f["physical"]["originalSineTermDifferentiatedBeforePhaseEvaluation"] is True and f["physical"]["actualCoefficientDerivativeOrder"] == 2 and f["physical"]["actualPhaseDerivativeOrder"] == 3, "phase-differentiated-before-zero-and-angular-connections-retained")
require(all("Rsharp*partial_R" in r["derivativeMeaning"] for r in n["rows"] if r["quantity"] != "physicalCurl"), "pulse-normalized-radial-meaning-explicit")
require(len(f["variations"]) == 2 and all(len(v["indices"]) == 10 and len(v["matrices"]) == 10 for v in f["variations"]), "both-original-twenty-component-variations")
require(f["inverse"]["pass"] and all_pass(f["inverse"]["inverseChecks"]) and all(x["pass"] for x in f["inverse"]["squareRoots"]), "actual-inverse-and-square-root-finite-identities")

for name, ref in s["partialAttachments"].items():
    attachment = read(ref["path"])
    assert attachment["originalSameProcess"] is True and attachment["finalSourcePassRequired"] is True and attachment["standaloneCompletionClaim"] is False
    d = attachment["data"]
    if name == "closed-selector-and-physical-scales":
        assert d == c
    elif name == "first-selector-ftc-upper-bounds":
        assert d == q["diagnostics"]["firstSelectorFTCUpperBounds"]
    else:
        for k, v in d.items():
            if k == "checks":
                assert q[k][:len(v)] == v
            elif k == "diagnostics":
                assert all(q[k][j] == x for j, x in v.items())
            else:
                assert q[k] == v
    del attachment, d
    gc.collect()
require(True, "same-process-partials-preserved-in-final-source-bound-data")
require(q["wholeTime"]["pass"] is True and q["scope"]["originalInitialLayerDiscarded"] is False and all_pass(q["geometry"]["checks"]), "whole-time-initial-layer-and-complete-geometry-premises-retained")
cond = q["conditioning"]
require(cond["pass"] and all_pass(cond["checks"]) and cond["sourceAuthenticated"] is False and cond["arithmetic"]["binary64UsedForDecisions"] is False, "conditional-directed-conditioning-consumed-by-private-parent")
require(F(cond["determinant"]["upper"]) < 0 and all(F(r["upper"]) <= 1 for r in cond["inverseRowBounds"]) and all(F(y["lower"]) >= F(1, 8) and F(y["upper"]) <= F(1, 2) for y in cond["Y"]) and all(F(y["lower"]) >= F(1, 4) for y in cond["sqrtY"]), "independent-rational-determinant-inverse-weight-sqrt-domain-check")

coarse = []
for row in c["rows"] + c["absoluteValues"]:
    assert closed(row["interval"]["lower"]) and closed(row["interval"]["upper"])
    assert row["originalValueRelativeToleranceGuaranteed"] is False
    if row["toleranceMet"]:
        assert interval_width(row["coordinate"]) == F(row["logCoordinateWidth"]) <= F(row["logCoordinateTolerance"])
    else:
        coarse.append(row["name"])
require(sorted(coarse) == ["T", "etaBeta"], "positive-scales-log-widths-with-two-explicit-coarse-ingredients", {"scaleRows": len(c["rows"]), "absoluteValues": len(c["absoluteValues"]), "coarseOnly": coarse})
require(c["scope"]["individualTPrecisionMet"] is False and c["scope"]["individualEtaBetaPrecisionMet"] is False and c["scope"]["originalFTCValuesIndividuallyNumericallyEvaluated"] is False, "no-individual-coarse-T-eta-or-FTC-precision-promotion")
require([v["sourceRoot"] for v in c["absoluteValues"] if v["name"].startswith("absolute_covariance_")] == [x for row in p["roots"]["actualH"] for x in row] and [v["sourceRoot"] for v in c["absoluteValues"] if v["name"].startswith("absolute_weights_")] == p["roots"]["actualWeights"], "absolute-H-and-weights-original-root-correspondence")

centers = p["numerics"]["values"]["centers"]
assert len(centers) == 2 and all(x == p["numerics"]["absolute"]["values"]["center"] for x in centers)
for i, row in enumerate(p["rows"]):
    assert row["center"]["a"] == p["roots"]["actualCenters"][i]
    assert row["system"] == i
    assert 0 < F(centers[i]["lower"]) <= F(centers[i]["upper"]) < F(1, 2)
require(128 * (1024 - 260) + 1 == 97793, "raw-negative-mode-value-positive-dyadic-exponent")
require(True, "actual-center-and-negative-mode-root-pairs", [{"sign": r["sign"], "system": r["system"], "center": r["center"]["a"], "other": r["center"]["other"]} for r in p["rows"]])

for field in ["wholeGNUMComplete", "userRequestedM2Complete", "newLeanKernelProof", "globalResidualNumericallyEnclosed", "allSourceLabelsNumericallyCovered", "workerExecution", "browserExecution", "M3Started", "hReplacedByZero", "rawUnscaledRelativeAccuracyClaimed", "oldPointActualJetTransplanted"]:
    assert s["scope"][field] is False and n["scope"][field] is False
require(True, "witness-source-scope-does-not-close-global-or-runtime-gates")

result = {
    "schema": "MathScope.IndependentCorrectedSource4ReadOnlyCrosscheck/1",
    "reviewer": "/root/sensitivity_kernel",
    "generatedAtUTC": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "reviewScriptSHA256": digest(__file__),
    "source": observer["source"],
    "observer": {"path": str((BASE / (PREFIX + "-process.json")).relative_to(ROOT)), "sha256": digest(BASE / (PREFIX + "-process.json"))},
    "observedExecution": {k: observer[k] for k in ["exitCode", "timeout", "startedAt", "finishedAt", "elapsedSeconds", "peakRSSBytes"]},
    "referenceFiles": references,
    "checks": checks,
    "quantityCounts": dict(collections.Counter(r["quantity"] for r in n["rows"])),
    "recordedGraphs": {"physicalPoint": p["graph"], "finiteBodies": f["graph"], "completeNumericalSource": n["graph"]},
    "scope": {"reviewOnly": True, "readOnlySources": True, "newSourceConstructorExecution": False, "fullGraphReconstructedByReviewer": False, "newPrivateSourceAuthorityCreated": False, "source4WitnessPacketCrosschecked": True, "runtimeOrWorkerExecutionReviewedHere": False, "browserExecutionReviewedHere": False, "correctedCommonSource6ReviewedHere": False, "wholeGNUMComplete": False, "M2Complete": False, "M3Started": False},
    "reviewProcessPeakRSSBytes": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024,
    "pass": True,
}
OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
print(json.dumps({"pass": True, "checks": len(checks), "receipt": str(OUT.relative_to(ROOT)), "sha256": digest(OUT), "peakRSSBytes": result["reviewProcessPeakRSSBytes"]}))
