from fractions import Fraction
from hashlib import sha256
import argparse
import json
from pathlib import Path


parser = argparse.ArgumentParser()
parser.add_argument("evidence", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument("--second", type=Path)
args = parser.parse_args()
root = args.evidence
raw = root / "raw"


def load(path):
    return json.loads(path.read_bytes())


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def bundle(directory, name):
    record = load(directory / (name + ".json"))
    if name == "ns-residual":
        return record
    assert record["formalPass"] is False and record["trust"] == "RECOMPUTE_REQUIRED"
    return record["bundle"]


def close(a, b, tolerance=1e-9):
    assert abs(a - b) <= tolerance, (a, b, tolerance)


walk = load(root / "walkthrough-steps.json")
browser = load(raw / "browser-execution.json")
build = load(root / "browser-build.json")
pin = load(root / "source-pin.json")
assert pin["commit"] == walk["baseCommit"]
assert browser["candidateSha256"] == build["candidateSHA256"] and build["reversible"]
assert len(walk["workflow"]) == len(browser["walkthroughs"]) == 4
assert not browser["browserErrors"] and not browser["publicationConfirmed"]
for path, hash_ in pin["files"].items():
    assert digest(root / "source" / path) == hash_, path

artifacts = {}
results = {}
observations = {}
for scenario, run in zip(walk["workflow"], browser["walkthroughs"], strict=True):
    assert scenario["id"] == run["id"]
    for step, execution in zip(scenario["steps"], run["steps"], strict=True):
        name = step["name"]
        assert execution["name"] == name
        assert not execution["formalPass"]
        job = bundle(raw, name)
        for path, expected in step["edits"].items():
            current = job["request"]
            for key in path.split("."):
                current = current[key]
            assert current == expected, (name, path)
        assert job["inputHash"] == execution["inputHash"]
        assert job["environment"]["workerSha256"] == execution["workerSha256"]
        assert job["mathematicalHash"] == execution["mathematicalHash"]
        assert job["result"]["kind"] == job["request"]["kind"]
        artifacts[name] = {"inputHash":job["inputHash"], "workerSha256":job["environment"]["workerSha256"],
                           "mathematicalHash":job["mathematicalHash"],
                           "exportSHA256":digest(raw / (name + ".json"))}
        observations[name] = execution
        results[name] = job["result"]
assert len(results) == 14

field = {}
for p, n in [(3, 4), (3, 8), (5, 8)]:
    name = f"p1-f{p}-n{n}"
    result = results[name]
    data = result["results"]
    # Unique normalized projective coordinates, independent of the worker.
    normalized = [(1, a) for a in range(p)] + [(0, 1)]
    assert int(data["pointCount"]) == len(normalized) == p + 1
    rows = [item for item in data["cohomology"] if item["rank"]]
    assert [item["degree"] for item in rows] == [0, 2]
    assert [item["coefficientRing"] for item in rows] == [f"Z_{p}"] * 2
    assert [item["frobeniusEigenvalue"] for item in rows] == ["1", str(p)]
    assert [item["finiteResidue"] for item in rows] == ["1", str(p)]
    assert result["precisionLedger"]["requested"]["N"] == n
    assert "External" in result["scope"]["comparison"]
    assert not result["scope"]["nativePrismaticComplexComputed"]
    field[name] = {"field":result["object"]["base"],"N":n,"points":len(normalized),"eigenvalues":[1,p]}

result = results["elliptic-f5"]["results"]
affine = {(x, y) for x in range(5) for y in range(5) if (y*y - x*x*x + x) % 5 == 0}
observed_affine = {(int(row["x"]), int(row["y"])) for row in result["primeField"]["affinePoints"]}
assert affine == observed_affine and int(result["primeField"]["count"]) == len(affine) + 1 == 8
trace = 5 + 1 - (len(affine) + 1)
assert int(result["aP"]) == trace == -2 and trace**2 <= 4 * 5
disc = -16 * (4 * (-1)**3)
assert int(result["reduction"]["certificate"]["discriminant"]) == disc == 64
assert int(result["reduction"]["certificate"]["residue"]) == disc % 5 != 0
assert result["reduction"]["curveGoodReduction"] is True
assert [int(v) for v in result["localZeta"]["ellipticL"]["denominator"]] == [1, -trace, 5]
assert not result["localZeta"]["completeGlobalLFunction"]
prism = results["prism-derham"]
assert prism["results"]["route"]["details"]["coefficientMap"] == "A_inf --phi--> A_inf --theta--> O_K"
assert observations["prism-derham"]["sampleTrace"]["comparisonMap"] == prism["results"]["route"]["details"]
assert prism["scope"]["routeForCompletedObjects"] and not prism["scope"]["finiteModPObservationIsZpCertificate"]
frobenius = {"affine":sorted(affine),"points":8,"trace":trace,"goodReductionDiscriminant":disc,
             "ellipticLDenominator":[1,-trace,5],"prismCoefficientMap":prism["results"]["route"]["details"]["coefficientMap"]}

delta = {}
for d,g in [(1,3),(2,3),(2,5)]:
    name = f"delta{d}-grid{g}"
    result = results[name]
    row = result["comparison"][d-1]
    assert result["familySpec"]["mode"] == "CLASSICAL_SCALE"
    assert result["fieldSpec"]["rho"] == 1/d
    close(result["fieldSpec"]["perturbation"]["length"],1.2/d)
    assert len(result["visualization"]["points"]) == g**3
    assert row["physicalFieldHash"] == result["hashes"]["physicalField"]
    assert row["probe"] == result["verification"]["point"]
    assert observations[name]["sampleTrace"]["selected"]["rho"] == 1/d
    assert result["proofBoundary"]["continuumQuantumYM"] == "NOT_CONSTRUCTED_NOT_PROVED"
    delta[name] = {"rho":1/d, "perturbationLength":result["fieldSpec"]["perturbation"]["length"],
                   "samples":g**3, "physicalHash":result["hashes"]["physicalField"],
                   "actionDensity":row["physicalDensity"]["actionDensity"],"probe":row["probe"]}
d1, d2, d2fine = [delta[key] for key in ("delta1-grid3","delta2-grid3","delta2-grid5")]
assert d1["physicalHash"] != d2["physicalHash"] == d2fine["physicalHash"]
close(d2["actionDensity"], 2**4 * d1["actionDensity"])
close(d2["actionDensity"], d2fine["actionDensity"])

ext = {}
for n in [3, 6]:
    result = results[f"exterior-r{n}"]
    assert result["domain"]["excludeAxis"] and not result["domain"]["globalEnergyClaim"]
    assert all(point["position"][0]**2 + point["position"][1]**2 > 0 for point in result["points"])
    assert len(result["points"]) == 16*n
    assert result["errorBudget"]["solutionErrorBound"] is None
    ext[n] = len(result["points"])

axis = {}
for n in [8, 16]:
    result = results[f"axis-tail{n}"]
    tail = result["tails"]["rows"][1]
    assert result["tails"]["degree"] == tail["truncationDegree"] == n
    assert tail["Y"] == "41/160"
    assert result["gates"]["infiniteCoefficientTail"] and result["gates"]["exactRationalArithmetic"]
    assert not result["inputModel"]["pressure"]["completedOutgoingPressure"]
    assert not result["fullNavierStokesSolution"]
    axis[n] = tail["phiTailUpper"]
assert 0 < Fraction(axis[16]) < Fraction(axis[8])

taylor = results["taylor-green"]
close(taylor["meanEnergy"],0.1169166067524773)
close(taylor["meanDissipation"] + taylor["energyDerivative"],0)
assert not taylor["fullSourceSolution"]

validation = results["ns-residual"]
checks = {row["name"]:row for row in validation["checks"]}
assert validation["passed"] == validation["total"] == 51
core = checks["nonlinear_axis_recurrence_order_refinement"]
assert core["pass"] and not core["certifiedNonlinearTail"]
assert abs(core["refined"]["angular"]) < abs(core["coarse"]["angular"])
whole = checks["actual_core_Cartesian_divergence_FD"]
assert whole["normalizedDivergence"] < whole["tolerance"]
assert whole["fullNSResidual"] > 0.99 and not whole["fullNSResidualMustVanish"]
assert not validation["fullCertifiedProfile"]
tg = checks["taylor_green_fd_nu_1"]
assert all(tg[key]["normalizedResidual"] < 1e-9 for key in ("value", "refinedValue"))
negative = checks["negative_pressure_sign_nu_1"]
assert negative["observedResidual"] > 1e-3 and negative["negativeControl"]

second = None
if args.second:
    rerun = load(args.second / "browser-execution.json")
    assert rerun["candidateSha256"] == browser["candidateSha256"]
    second = {"sameCandidate":True,"sameInputAndWorker":0,"sameMathematicalHash":0}
    for name in artifacts:
        job = bundle(args.second,name)
        a = artifacts[name]
        assert job["inputHash"] == a["inputHash"] and job["environment"]["workerSha256"] == a["workerSha256"]
        second["sameInputAndWorker"] += 1
        assert job["mathematicalHash"] == a["mathematicalHash"], name
        second["sameMathematicalHash"] += 1

matrix = load(root / "source/research-ide/mathscope-m4/recovery-20261019/M4_ORIGINAL_ACCEPTANCE_MATRIX.json")
row = next(r for r in matrix["rows"] if r["id"] == "R1-07")
assert row["source_page"] == 68 and matrix["originalSource"]["page_count"] == 99
receipt = {
    "schema":"MathScope.M4.R107.WalkthroughReadback/1", "criterionId":"R1-07",
    "originalBlueprintPage":68, "originalCriterion":row["original_acceptance"],
    "candidateSHA256":build["candidateSHA256"],"sourceCommit":pin["commit"],
    "fourWalkthroughs": {
        "field":field,"frobenius":frobenius,"delta":delta,"ns": {
            "exteriorSamples":ext,"axisTailExactRationals":axis,"taylorGreenEnergy":taylor["meanEnergy"],
            "validationChecks":validation["total"],"angularLeadingResidual":[core["coarse"]["angular"],core["refined"]["angular"]],
            "fullNSResidual":whole["fullNSResidual"],"taylorGreenFD":[tg["value"]["normalizedResidual"],tg["refinedValue"]["normalizedResidual"]],
            "pressureSignNegativeResidual":negative["observedResidual"],
        },
    },
    "jobs":artifacts, "independentCleanBrowserContext":second,
    "externalHumanProductionReadbackObserved":False,"publicationConfirmed":False,
    "scope":"Actual isolated normal release-lab browser and M1 Navier–Stokes tab with exact input and Worker hash. External human production readback remains separate.",
    "verdict":"PASS_FOUR_SCOPED_BROWSER_WALKTHROUGHS",
}
args.output.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps({"workerJobs":len(results),"verifiedWalkthroughs":4,"repeat":second}))
