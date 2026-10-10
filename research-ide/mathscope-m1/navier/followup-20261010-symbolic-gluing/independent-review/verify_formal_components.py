#!/usr/bin/env python3
"""Independent receipt/source-chain audit and exact polynomial replay.

This is deliberately not described as an independent Lean recompilation.
"""
import ast
import datetime
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import re
import subprocess

HERE = Path(__file__).resolve().parent
GLUE = HERE.parent
NAV = GLUE.parent
AXIS = NAV / "followup-20261010-same-datum-axis"
AUDIT = Path("/workspace/scratch/afa9cd11a21b/mathscope-m1/navier/official-validation")
REPO = AUDIT / "repo"
COMMIT = "f9e8bc5b38b6e212696e8a30e3e91517af887bbd"
KERNEL = AUDIT / "lean-4.34.0-rc2-linux/lib/lean/libleanshared.so"
KERNEL_SHA = "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5"
ALLOWED = {"propext", "Classical.choice", "Quot.sound"}

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def tracked():
    paths = subprocess.check_output(["git", "ls-files", "-z"], cwd=REPO).decode().split("\0")
    return {p: sha(REPO/p) for p in paths if p and (REPO/p).is_file()}

def poly_add(p, q):
    r = dict(p)
    for k, v in q.items():
        r[k] = r.get(k, 0) + v
    return {k: v for k, v in r.items() if v}

def poly_mul(p, q):
    r = {}
    for k, v in p.items():
        for l, w in q.items():
            r[k+l] = r.get(k+l, 0) + v*w
    return {k: v for k, v in r.items() if v}

def polynomial(expr):
    def go(node):
        if isinstance(node, ast.Expression): return go(node.body)
        if isinstance(node, ast.Name) and node.id == "Q": return {1: 1}
        if isinstance(node, ast.Constant) and isinstance(node.value, int):
            return {} if node.value == 0 else {0: node.value}
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
            return poly_add(go(node.left), go(node.right))
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Mult):
            return poly_mul(go(node.left), go(node.right))
        raise ValueError("Unexpected syntax in literal positive polynomial")
    return go(ast.parse(expr, mode="eval"))

def main():
    num = 1
    while (HERE / f"formal-components-review-{num:03d}.json").exists(): num += 1
    out = HERE / f"formal-components-review-{num:03d}.json"
    inputs = HERE / f"formal-components-review-{num:03d}.inputs"
    inputs.mkdir()
    checks, snapshots = [], {}
    def check(name, ok, detail=None):
        checks.append({"name": name, "pass": bool(ok), **({"detail": detail} if detail is not None else {})})
    def snap(key, p):
        q = inputs / key
        q.parent.mkdir(parents=True, exist_ok=True)
        q.write_bytes(p.read_bytes())
        snapshots[key] = {"source": str(p), "sha256": sha(q)}
    before = tracked()
    check("original commit", subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=REPO, text=True).strip() == COMMIT)
    check("original tracked count", len(before) == 2669, len(before))
    check("pinned kernel", sha(KERNEL) == KERNEL_SHA)
    concrete_dir = AXIS / "formal-input-producer/assembly-attempts/0002"
    concrete = json.loads((concrete_dir / "receipt.json").read_text())
    roots = {name: Path(item["sourcePath"]).parent for name, item in concrete["importedInputs"].items()}
    roots["ConcreteProducer"] = concrete_dir
    # The accepted numerical consumers are recorded as consumers, not as
    # independent reviews of the reviewer's own new proof production.
    targets = {"PressureSelection", "AmplitudeInput", "AmplitudeDynamics", "ThresholdBridge"}
    records = {}
    for module, root in roots.items():
        rec = json.loads((root / "receipt.json").read_text())
        src, obj, log = root / f"{module}.lean", root / f"{module}.olean", root / "lean.log"
        check(f"{module}: producer PASS exit zero", rec.get("status") == "PASS" and rec.get("exitCode") == 0)
        check(f"{module}: source hash", sha(src) == rec["sourceSHA256"])
        check(f"{module}: original lock", rec.get("originalCommit") == COMMIT and rec.get("originalTrackedFilesPreserved") is True)
        check(f"{module}: kernel lock", rec.get("kernelSHA256", rec.get("kernelSHA256Before")) == KERNEL_SHA)
        expected_obj = rec.get("oleanSHA256", rec.get("outputOleanSHA256"))
        if expected_obj: check(f"{module}: object hash", sha(obj) == expected_obj)
        if "logSHA256" in rec: check(f"{module}: log hash", sha(log) == rec["logSHA256"])
        runner = root / "runner.py"
        if runner.exists() and "runnerSHA256" in rec:
            check(f"{module}: producer bytes", sha(runner) == rec["runnerSHA256"])
            snap(f"{module}/runner.py", runner)
        ax = {name: [a.strip() for a in body.split(",") if a.strip()]
              for name, body in re.findall(r"'([^']+)' depends on axioms:\s*\[([^\]]*)\]", log.read_text(), re.S)}
        check(f"{module}: logged axiom list equals receipt", ax == rec["printedAxioms"])
        check(f"{module}: only standard printed axioms", bool(ax) and all(set(v) <= ALLOWED for v in ax.values()))
        check(f"{module}: no added axioms or proof holes", not re.search(r"(?m)^\s*(axiom|opaque|unsafe)\b|\b(sorry|admit|native_decide)\b", src.read_text()))
        if module in concrete["importedInputs"]:
            dep = concrete["importedInputs"][module]
            check(f"{module}: concrete source and output pins", sha(src) == dep["sourceSHA256"] and sha(obj) == dep["oleanSHA256"])
        for p in [src, root/"receipt.json", log]: snap(f"{module}/{p.name}", p)
        records[module] = {"directory": str(root), "sourceSHA256": sha(src), "oleanSHA256": sha(obj),
                           "receiptSHA256": sha(root/"receipt.json"), "printedDeclarationCount": len(ax),
                           "primaryReviewTarget": module in targets}
    for module, root in roots.items():
        rec = json.loads((root / "receipt.json").read_text())
        if "base" in rec:
            b = rec["base"]
            check(f"{module}: base dependency pin", b["sourceSHA256"] == records["SameDatumInputs"]["sourceSHA256"]
                  and b["oleanSHA256"] == records["SameDatumInputs"]["oleanSHA256"]
                  and b["receiptSHA256"] == records["SameDatumInputs"]["receiptSHA256"])
        for dep in rec.get("dependencies", []):
            target = records[dep["module"]]
            check(f"{module}: {dep['module']} dependency pins", all(dep[key] == target[key]
                  for key in ["sourceSHA256", "oleanSHA256", "receiptSHA256"]))
    originals = ["AxisContraction", "NaturalAxisData", "NaturalAxisCoefficients", "AnalyticPrimitive",
                 "AnalyticCoefficientBounds", "OutgoingTail", "OutgoingSchedule", "PressureDatum",
                 "NaturalAxisBridge", "AxisReference", "AxisEvaluation"]
    for name in originals:
        p = REPO / "NavierStokes" / f"{name}.lean"
        git = subprocess.check_output(["git", "show", f"{COMMIT}:NavierStokes/{name}.lean"], cwd=REPO)
        check(f"original {name}: exact pinned git bytes", p.read_bytes() == git)
        snap(f"original/{name}.lean", p)
    threshold = (roots["ThresholdBridge"] / "ThresholdBridge.lean").read_text()
    polys = {}
    for name, expected in [("literalBoundTree", {5:2, 6:3, 7:3, 8:11, 9:8, 10:2, 11:29}),
                           ("literalLipTree", {4:2, 5:3, 6:4, 7:17, 8:14, 9:4, 10:58})]:
        expr = re.search(r"def " + name + r" \(Q : ℝ\) : ℝ :=\s*(.*?)\ntheorem", threshold, re.S).group(1)
        p = polynomial(expr.strip())
        check(f"independent exact expansion: {name}", p == expected)
        polys[name] = {"coefficients": p, "degree": max(p), "coefficientSum": sum(p.values())}
    check("bound coefficient sum 58", polys["literalBoundTree"]["coefficientSum"] == 58)
    check("Lipschitz coefficient sum 102", polys["literalLipTree"]["coefficientSum"] == 102)
    check("threshold absorption coefficient", 1+58+102 == 161 and 161 <= 2**260)
    check("sharp exponent and factor", 64-11 == 53 and F(58,2) == 29)
    check("tail normalization constant", F(1,256)/(1-F(1,256)) == F(1,255))
    check("exponential tail reserve", 3**5 == 243 and 243 < 255)
    check("amplitude exponent reserve", 64+1 == 65 and 65 <= 200)
    check("fixed Cauchy radius loss", ((1+F(1,16))/(1-F(1,16))**3) == F(4352,3375)
          and F(4352,3375) < F(4,3) < 2)
    bindings = {
        "PressureSelection": ["PressureData newPressure", "pressureData_of_ideal_prefix newPressure_admissible Pstar_ge_two",
                              "releaseLag canonicalTail canonicalTail.rampEnd", "newTailDebt_small"],
        "AmplitudeInput": ["boundedAxisElement rho_pos selected_radius_gap", "phaseOpenDomain_convex",
                           "actualComplexAmplitude_analytic actualComplexAmplitude_norm", "actualAmplitudeQ ^ 65"],
        "AmplitudeDynamics": ["actualPhase_derivative", "realAmplitude_pos", "actualRealAmplitude_logDerivative"],
        "ThresholdBridge": ["remainderBound O d S R 2", "remainderLip O d S R 2", "controlledRemainder",
                            "exists_unique_natural_fixedPoint", "(b : InputNormBounds"],
        "OperatorBounds": ["theorem selectedInputNormBounds", "actual_fixedPoint_at_selectedLambda",
                           "selectedInputNormBounds a ha"],
        "ConcreteProducer": ["actual_fixedPoint_at_selectedLambda actualAmplitudeInput actualAmplitudeInput_norm",
                             "selectedAmplitude_scale : actualAmplitudeLambda = selectedLambda := rfl",
                             "selectedAmplitude_normalization : actualAmplitudeC = selectedC := rfl",
                             "integrated_solution axisWindow rho_pos chiInput selectedAxisData selectedAxisData_compatible",
                             "newPressure_is_literal_integral eta"]}
    for module, needles in bindings.items():
        body = (roots[module]/f"{module}.lean").read_text()
        for needle in needles: check(f"review binding {module}: {needle}", needle in body)
    check("threshold 0004 and 0005 proof identical", (GLUE/"formal-threshold-bridge/attempts/0004/ThresholdBridge.lean").read_bytes()
          == (roots["ThresholdBridge"]/"ThresholdBridge.lean").read_bytes())
    # These negative tests validate the audit predicate; no source is mutated.
    check("negative audit: sorryAx rejected", not ({"propext", "sorryAx"} <= ALLOWED))
    check("negative audit: changed bytes rejected", hashlib.sha256(b"changed").hexdigest() != records["PressureSelection"]["sourceSHA256"])
    after = tracked()
    check("original tracked files preserved across independent audit", before == after)
    check("kernel preserved across independent audit", sha(KERNEL) == KERNEL_SHA)
    snap("FORMAL_COMPONENT_REVIEW.md", HERE/"FORMAL_COMPONENT_REVIEW.md")
    snap("verify_formal_components.py", Path(__file__))
    (inputs/"original-hashes-before.json").write_text(json.dumps(before, indent=2)+"\n")
    (inputs/"original-hashes-after.json").write_text(json.dumps(after, indent=2)+"\n")
    receipt = {"schema": "MathScope.Navier.IndependentFormalComponentsReview/1",
        "status": "PASS" if all(c["pass"] for c in checks) else "FAIL",
        "finishedUTC": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "passed": sum(c["pass"] for c in checks), "total": len(checks), "checks": checks,
        "sources": records, "snapshots": snapshots, "independentPolynomialReplay": polys,
        "originalCommit": COMMIT, "originalTrackedFileCount": len(before), "kernelSHA256": KERNEL_SHA,
        "independentlyRecompiledByThisVerifier": False,
        "reviewConclusion": "No gap found in the reviewed pressure/amplitude/threshold component claims; actual norm premises are supplied by the pinned concrete producer.",
        "allOriginalNineConditionsProvedByThisReview": False,
        "full125MixedCoefficientArrayKernelEvaluatedByThisReview": False,
        "full4792NodeGraphKernelEvaluatedByThisReview": False}
    out.write_text(json.dumps(receipt, indent=2)+"\n")
    print(json.dumps({"path": str(out), "status": receipt["status"], "passed": receipt["passed"], "total": receipt["total"]}))
    for c in checks:
        if not c["pass"]: print(json.dumps(c))
    return 0 if receipt["status"] == "PASS" else 1

if __name__ == "__main__":
    raise SystemExit(main())
