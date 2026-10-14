"""Actual radial bump/domain/normalization lemmas from pinned source bytes.

No enormous pinned parameter is numerically evaluated. The actual outer wait
and actual global rho bump are expanded into their retained scalar bodies.
Written real-function proofs are kept separate from the exact source checks.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from fractions import Fraction
import json
from pathlib import Path
import time

from pde_replay import HERE, EvidenceError, digest, js_hash, require

ROOT = HERE.parents[2]
PARAM_PATH = "research-ide/mathscope-m2/navier/source-profile-data.mjs"
SOURCE_PATHS = (PARAM_PATH,
    "research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs",
    "research-ide/mathscope-m2/navier/actual-global-source-outer.mjs",
    "research-ide/mathscope-m3/navier/source-global-current.mjs")


def verified_cloud(root, name, manifest):
    folder = root if (root / "residual-audit-summary.json").is_file() else root / "mean-proof-residual-38500114302"
    pin = next(row for row in manifest["members"] if row["path"] == name)
    raw = (folder / name).read_bytes()
    require(len(raw) == pin["bytes"] and digest(raw) == pin["sha256"], "Changed pinned cloud input: " + name)
    return json.loads(raw)


def exact_nodes(witnesses, expected, label):
    for node_id, node in expected.items():
        require(witnesses.get(node_id) == node, f"Changed actual {label} scalar body at node {node_id}.")


def scalar_closure(nodes, roots):
    pending, seen = list(roots), set()
    while pending:
        node_id = pending.pop()
        if node_id in seen:
            continue
        seen.add(node_id)
        node = nodes[node_id]
        if node["op"] in ("rational", "coordinate", "source_parameter"):
            continue
        if node["op"] in ("integer_power", "source_step_derivative"):
            pending.append(node["args"][0])
        elif node["op"] in ("add", "multiply", "inverse", "exp", "log_positive", "sqrt_positive", "smooth_piecewise", "definite_integral"):
            pending.extend(node["args"])
        else:
            raise EvidenceError(f"Unexpanded source scalar at {node_id}: {node['op']}")
    return [{"sourceNode": n, "node": nodes[n], "nodeSHA256": js_hash(nodes[n])} for n in sorted(seen)]


def radial_source_body(nodes):
    expected = {
        633682: {"op": "source_parameter", "args": ["X0Imean"]},
        633683: {"op": "multiply", "args": [24, 633682]},
        633684: {"op": "sqrt_positive", "args": [633683]},
        633685: {"op": "exp", "args": [19]},
        633686: {"op": "multiply", "args": [633684, 633685]},
        633687: {"op": "sqrt_positive", "args": [622820]},
        633696: {"op": "multiply", "args": [633686, 633687]},
        633697: {"op": "inverse", "args": [633696]},
        633698: {"op": "multiply", "args": [622802, 633697]},
        633699: {"op": "add", "args": [20, 633698]},
        633700: {"op": "multiply", "args": [669, 633699]},
        669: {"op": "rational", "args": ["10", "1"]},
        633701: {"op": "multiply", "args": [20, 633700]},
        633702: {"op": "add", "args": [1, 633701]},
        633703: {"op": "multiply", "args": [633700, 633702]},
        633704: {"op": "inverse", "args": [633703]},
        633705: {"op": "multiply", "args": [20, 633704]},
        633706: {"op": "exp", "args": [633705]},
        633707: {"op": "smooth_piecewise", "args": [633700, 0, 1, 0, 633706, 0]},
        633709: {"op": "coordinate", "args": ["global_whole_radial_integral$30570"]},
        633710: {"op": "sqrt_positive", "args": [3617]},
        633711: {"op": "sqrt_positive", "args": [28826]},
        633712: {"op": "multiply", "args": [24, 633711]},
        633713: {"op": "multiply", "args": [633697, 633709]},
        633714: {"op": "add", "args": [20, 633713]},
        633715: {"op": "multiply", "args": [669, 633714]},
        633716: {"op": "multiply", "args": [20, 633715]},
        633717: {"op": "add", "args": [1, 633716]},
        633718: {"op": "multiply", "args": [633715, 633717]},
        633719: {"op": "inverse", "args": [633718]},
        633720: {"op": "multiply", "args": [20, 633719]},
        633721: {"op": "exp", "args": [633720]},
        633722: {"op": "smooth_piecewise", "args": [633715, 0, 1, 0, 633721, 0]},
        633723: {"op": "multiply", "args": [633697, 633722]},
        633724: {"op": "definite_integral", "args": [633723, 633709, 633710, 633712]},
        633733: {"op": "source_step_derivative", "args": [633700, 0]},
        3617: {"op": "source_parameter", "args": ["Xa"]},
        12: {"op": "source_parameter", "args": ["XR"]},
        28826: {"op": "multiply", "args": [12, 28825]},
        28825: {"op": "exp", "args": [319]},
        0: {"op": "rational", "args": ["0", "1"]},
        1: {"op": "rational", "args": ["1", "1"]},
        19: {"op": "rational", "args": ["1", "2"]},
        20: {"op": "rational", "args": ["-1", "1"]},
        24: {"op": "rational", "args": ["2", "1"]},
    }
    exact_nodes(nodes, expected, "radial bump and mass")
    return [{"sourceNode": n, "node": value, "nodeSHA256": js_hash(value)} for n, value in expected.items()]


def actual_wait_source(nodes):
    # Source expressions are checked before any positivity lemma is applied.
    expected = {
        241: {"op": "multiply", "args": [225, 240]},
        240: {"op": "add", "args": [224, 239]},
        224: {"op": "multiply", "args": [222, 223]},
        222: {"op": "add", "args": [8, 21]},
        223: {"op": "inverse", "args": [167]},
        167: {"op": "add", "args": [1, 166]},
        166: {"op": "multiply", "args": [8, 20]},
        239: {"op": "definite_integral", "args": [238, 226, 0, 1]},
        238: {"op": "multiply", "args": [233, 237]},
        237: {"op": "add", "args": [21, 236]},
        236: {"op": "add", "args": [8, 235]},
        235: {"op": "multiply", "args": [167, 234]},
        234: {"op": "source_step_derivative", "args": [226, 0]},
        242: {"op": "multiply", "args": [186, 207]},
        243: {"op": "add", "args": [241, 242]},
        186: {"op": "multiply", "args": [184, 185]},
        184: {"op": "rational", "args": ["-4", "1"]},
        185: {"op": "log_positive", "args": [9]},
        207: {"op": "add", "args": [1, 21]},
        21: {"op": "multiply", "args": [9, 20]},
        259: {"op": "multiply", "args": [245, 258]},
        245: {"op": "exp", "args": [244]},
        244: {"op": "multiply", "args": [20, 219]},
        219: {"op": "multiply", "args": [19, 207]},
        258: {"op": "add", "args": [243, 257]},
        257: {"op": "definite_integral", "args": [256, 246, 0, 1]},
        256: {"op": "multiply", "args": [254, 255]},
        254: {"op": "add", "args": [1, 253]},
        253: {"op": "multiply", "args": [20, 252]},
        252: {"op": "source_step_derivative", "args": [246, 0]},
        255: {"op": "multiply", "args": [207, 251]},
        251: {"op": "exp", "args": [250]},
        250: {"op": "multiply", "args": [207, 249]},
        249: {"op": "definite_integral", "args": [248, 247, 0, 246]},
        248: {"op": "source_step_derivative", "args": [247, 0]},
        275: {"op": "definite_integral", "args": [274, 262, 1, 261]},
        274: {"op": "multiply", "args": [269, 273]},
        269: {"op": "multiply", "args": [267, 268]},
        267: {"op": "source_step_derivative", "args": [266, 1]},
        266: {"op": "multiply", "args": [19, 265]},
        265: {"op": "add", "args": [20, 262]},
        268: {"op": "multiply", "args": [260, 264]},
        260: {"op": "multiply", "args": [9, 14]},
        264: {"op": "exp", "args": [263]},
        263: {"op": "multiply", "args": [207, 262]},
        273: {"op": "inverse", "args": [272]},
        272: {"op": "multiply", "args": [24, 271]},
        271: {"op": "add", "args": [1, 270]},
        270: {"op": "multiply", "args": [20, 260]},
        261: {"op": "rational", "args": ["3", "1"]},
        280: {"op": "multiply", "args": [278, 279]},
        279: {"op": "inverse", "args": [207]},
        278: {"op": "log_positive", "args": [277]},
        277: {"op": "multiply", "args": [259, 276]},
        276: {"op": "inverse", "args": [275]},
        319: {"op": "add", "args": [261, 294]},
        294: {"op": "add", "args": [218, 280]},
        218: {"op": "add", "args": [1, 199]},
        9: {"op": "source_parameter", "args": ["h"]},
        8: {"op": "source_parameter", "args": ["lambda"]},
        14: {"op": "source_parameter", "args": ["co"]},
    }
    exact_nodes(nodes, expected, "positive outer wait")
    # Independently expand only affine arithmetic, stopping at the actual
    # wait and log h. This checks the endpoint formula used by containment.
    cache = {}
    def affine(node_id):
        atom = {6: "T", 7: "BOuter", 13: "Tf", 185: "log(h)", 280: "wait"}.get(node_id)
        if atom:
            return {atom: Fraction(1)}
        if node_id in cache:
            return cache[node_id]
        node = nodes[node_id]
        if node["op"] == "rational":
            out = {"constant": Fraction(*map(int, node["args"]))}
        elif node["op"] == "inverse" and node["args"] == [8]:
            out = {"1/lambda": Fraction(1)}
        elif node["op"] == "add":
            out = {}
            for child in node["args"]:
                for name, value in affine(child).items():
                    out[name] = out.get(name, Fraction(0)) + value
        elif node["op"] == "multiply":
            left, right = map(affine, node["args"])
            require(set(left) <= {"constant"} or set(right) <= {"constant"}, "Unexpected nonlinear source endpoint.")
            constant, other = (left, right) if set(left) <= {"constant"} else (right, left)
            out = {name: constant.get("constant", Fraction(0)) * value for name, value in other.items()}
        else:
            raise EvidenceError(f"Unexpected endpoint source operation: {node_id} {node['op']}")
        cache[node_id] = out
        return out
    require(affine(319) == {"T": 1, "Tf": 1, "BOuter": 90, "1/lambda": 13, "log(h)": -4, "wait": 1, "constant": 7}, "Actual outer endpoint affine formula changed.")
    return scalar_closure(nodes, [319])


def source_parameter_checks(parameters):
    expected = {
        "Md": {"integer": 1048576},
        "T": {"sum": [{"exp": {"ref": "Md"}}, {"integer": 10}]},
        "h": {"exp": {"product": [{"integer": -8002}, {"ref": "T"}]}},
        "lambda": {"exp": {"product": [{"integer": -1000}, {"ref": "T"}]}},
        "co": {"rational": "1/256"}, "Tf": {"integer": 128},
        "BOuter": {"product": [{"integer": 1000}, {"ref": "T"}]},
        "logP": {"product": [{"integer": 2}, {"ref": "T"}]},
        "Pstar": {"exp": {"ref": "logP"}},
        "K": {"power": [{"ref": "Pstar"}, 2]},
        "j0": {"power": [{"ref": "h"}, 4]},
        "sigmaStar": {"quotient": [{"ref": "j0"}, {"integer": 2000}]},
        "Q": {"quotient": [{"product": [{"integer": "1852673427797059126777135760139006525652319754650249024631321344126610074238976"}, {"ref": "K"}]}, {"power": [{"ref": "sigmaStar"}, 2]}]},
        "Lambda": {"power": [{"ref": "Q"}, 64]},
        "Xa": {"quotient": [{"integer": 4}, {"ref": "Lambda"}]},
        "BRefUpper": {"power": [{"ref": "Q"}, 300]},
        "logCSelected": {"sum": [{"product": [{"integer": 10}, {"log": {"sum": [{"integer": 1}, {"ref": "BRefUpper"}]}}]}, {"power": [{"ref": "Q"}, 200]}]},
        "CSelected": {"exp": {"ref": "logCSelected"}},
        "XR": {"product": [{"integer": 110}, {"power": [{"product": [{"ref": "CSelected"}, {"ref": "Pstar"}]}, 10]}]},
        "X0Imean": {"product": [{"ref": "XR"}, {"exp": {"sum": [{"ref": "T"}, {"integer": 2}, {"product": [{"integer": 60}, {"ref": "BOuter"}]}, {"integer": -8}]}}]},
    }
    for key, value in expected.items():
        require(parameters[key] == value, "Changed exact source parameter: " + key)
    return expected


def audit(root, output):
    started = time.monotonic()
    manifest = json.loads((HERE / "pde_input_manifest.json").read_text())
    summary = verified_cloud(root, "residual-audit-summary.json", manifest)
    frontier = verified_cloud(root, "residual-actual-atoms-and-frontier.json", manifest)
    require(summary["source"]["sourceNodeSHA256"] == manifest["originalNodesSHA256"], "Source graph binding changed.")
    witnesses = {r["sourceNode"]: r["node"] for r in frontier["sourceWitnesses"]}
    for row in frontier["sourceWitnesses"]:
        require(js_hash(row["node"]) == row["nodeSHA256"], "Changed cloud source witness.")
    producers = {r["path"]: r for r in summary["source"]["sourceProducerBindings"]}
    source_files = []
    for path in SOURCE_PATHS:
        pin, raw = producers[path], (ROOT / path).read_bytes()
        require(len(raw) == pin["bytes"] and digest(raw) == pin["sha256"], "Changed source producer: " + path)
        source_files.append(pin)
    text = (ROOT / PARAM_PATH).read_text(encoding="utf-8")
    parameters = json.loads(text.split("export const PINNED_N3 = ", 1)[1].rstrip().rstrip(";"))["parametersExactExpressions"]
    checks = source_parameter_checks(parameters)
    bump_nodes, wait_nodes = radial_source_body(witnesses), actual_wait_source(witnesses)
    # Compact exact arithmetic checks supporting the written inequalities.
    require(8002 > 1000 and 1048576 + 11 > 128 and 8002 * 128 > 2048, "Source scale ordering failed.")
    require(Fraction(27, 255) < 1 and Fraction(121, 100) < 13, "Exact outer containment constants failed.")
    require(Fraction(1, 3) * Fraction(1, 10) == Fraction(1, 30), "Normalization lower interval coefficient failed.")
    guards = []
    for key in ("fieldDefinitions:6", "fieldDefinitions:7", "fieldDefinitions:8", "fieldDefinitions:9", "definitions:1:0", "definitions:1:1", "definitions:1:2"):
        definition = next(r for r in frontier["definitionBindings"] if r["key"] == key)
        rows = definition["definition"]["rows"]
        require(len(rows) == 162 and all(r["guards"][0] == [622824, 3617, 28826] for r in rows), "Changed actual radial indexed-cover guard.")
        guards.append({"key": key, "name": definition["name"], "rows": 162, "radialGuard": [622824, 3617, 28826], "sourceSHA256": definition["definitionSHA256"]})
    result = {
        "schema": "MathScope.N6.ActualRadialCutoffAnalyticContinuation/1",
        "sourceCommit": manifest["sourceCommit"], "cloudRun": manifest["cloudRun"], "originalNodesSHA256": manifest["originalNodesSHA256"],
        "status": "ACTUAL_BUMP_FLATNESS_AXIS_GAP_AND_POSITIVE_NORMALIZATION_ON_ORIGINAL_SLOW_CHART_PROVED",
        "bump": {"sourceNode": 633707, "massSourceNode": 633724, "chiSourceNode": 633733,
            "formula": "L=sqrt(2*X0Imean)*exp(1/2)*sqrt(s); u=10*(R/L-1); b(u)=exp(-1/(u*(1-u))) on (0,1), zero outside.",
            "allOrderFlatnessProof": ["Every derivative on (0,1) is exp(-1/[u(1-u)]) times a rational function whose only poles are finite powers at 0 and 1.", "Near 0, 1/[u(1-u)]>=1/u; near 1, 1/[u(1-u)]>=1/(1-u).", "For every integer m, t^-m*exp(-1/t) -> 0 as t->0+ (put y=1/t and use exp(y)>=y^(m+1)/(m+1)!).", "All one-sided jets therefore approach zero, agreeing with every derivative of the zero exterior branches.", "The zero extension is C-infinity on the entire real u-axis; smooth positive L preserves these joins under composition."],
            "interiorSingularDenominatorGuarded": "u*(1-u)>0 only where the interior branch is used; it is never evaluated at a join.",
            "axisGap": "For every s in [1/2,2], L>=sqrt(X0Imean*e)>sqrt(Xa)>0; b and chi vanish for 0<=R<=sqrt(X0Imean*e).",
            "wholeGlobalVelocityAxisSmoothnessProved": False},
        "sourceParameters": checks, "sourceFiles": source_files,
        "actualOuterWait": {"Qsteep": 241, "Qhold": 243, "Qb": 259, "Qp": 275, "wait": 280, "outerLogEndpoint": 319, "Xb": 28826,
            "sourceFormula": "Q0=(lambda-h)/(1-lambda); Qsteep=positive_exp*(Q0+nonnegative_integral); Qhold=Qsteep+(1-h)*4*log(1/h); Qb=exp(-(1-h)/2)*(Qhold+nonnegative_integral); Qp=int_1^3 exp((1-h)*t)*(h/256)*sigma'((t-1)/2)/(2*(1-h/256)) dt.",
            "stepDefinition": "sigma(t)=exp(-1/t^2)/(exp(-1/t^2)+exp(-1/(1-t)^2)) on (0,1), extended by 0/1.",
            "proof": ["Pinned T=e^1048576+10>128, h=e^(-8002T), lambda=e^(-1000T), so 0<h<lambda<1 and log(1/h)=8002T>2048.", "For the exact source sigma, 0<=sigma<=1 and sigma'>0 on (0,1); its flat extensions give int_0^1 sigma'=1.", "Thus Q0>0 and the two displayed source integral terms are nonnegative.", "1-h>1/2, so Qhold>4*2048/2=4096.", "e^(1/2)<2, so exp(-(1-h)/2)>1/2 and Qb>2048.", "Qp>0; using exp((1-h)t)<e^3<27 and int_1^3 sigma'((t-1)/2)dt=2 gives Qp<27h/255<h<1.", "The logarithm and divisor of wait=log(Qb/Qp)/(1-h) are defined, and wait>0."],
            "oldSourcePassFlagUsedAsProof": False},
        "fixedRadialEnvelope": {"left": 633710, "right": 633712,
            "actualEndpointFormula": "log(Xb/XR)=T+Tf+90*BOuter+13/lambda+4*log(1/h)+7+wait.",
            "proof": ["Source Q>1 and Lambda=Q^64>1 imply 0<Xa<4; CSelected>1,Pstar>1 imply XR>110.", "X0Imean=XR*exp(T+60*BOuter-6)>110>4>Xa.", "All omitted addends of log(Xb/XR) are positive; hence Xb/(X0Imean*e)>exp(12)>13>121/100, and Xb/X0Imean>exp(13)>exp(5).", "For s in [1/2,2], L>=sqrt(X0Imean*e)>sqrt(Xa), and (11/10)*L<= (11/5)*sqrt(X0Imean*e)<2*sqrt(Xb).", "The complete bump support (L,11L/10) is strictly inside the fixed source integration interval for every such s.", "For any original mean-patch X in [X0Imean,exp(5)*X0Imean], sqrt(X0Imean)<=R=sqrt(2*s*X)<=2*sqrt(exp(5)*X0Imean)<2*sqrt(Xb). This places the full reserved mean patch, and all actually supported five-profile copies, inside the same fixed envelope."],
            "entireSupportContainedForActualChart": True, "entireOriginalMeanPatchContainedForActualChart": True,
            "actualFiveProfilesSourceSupportProofSuppliedSeparately": True},
        "normalization": {"sourceNode": 633724,
            "formula": "rhoMass=(1/10)*int_0^1 exp(-1/[u*(1-u)])du",
            "proof": "The full-support substitution u=10*(r/L-1) in the actual source integral cancels L. On [1/3,2/3], u(1-u)>=2/9; on [0,1], u(1-u)<=1/4.",
            "lower": "exp(-9/2)/30", "upper": "exp(-4)/10", "positiveAndFinite": True,
            "independentOfSourceSlowCoordinates": True, "allParameterDerivativesOfMass": "0 on the actual original slow chart",
            "rhoDenominator633724DischargedOnOriginalChart": True},
        "indexedRadialGuards": guards,
        "chartScope": {"required": "Actual original slow chart image Z=s^(1/2-h)*eta,T=s*(1-eta^2), s in[1/2,2], eta in[-1,1].", "implicitRoot": 622820,
            "onChartRootExistence": "F_s>1/2; at image point F(s)=0; IVT+strict monotonicity give the unique bracket root; analytic IFT gives local smooth continuation, including one-sided eta endpoints.",
            "outsideBracketCounterexample": {"Z": "0", "T": "3", "F": "s-3", "maximumOnBracket": "-1", "actualBracketRootExists": False, "pointIsInOriginalChart": False},
            "globalAllCoordinateRootExtensionProved": False},
        "remaining": ["The original global velocity/pressure include background, Fourier inverse, indexed-cover and implicit/natural limit coefficients; this bump theorem does not prove all of them smooth.", "Every use of the bounded root outside the declared chart needs an explicit compatible extension or guarding proof.", "The radial shell guard uses X=R^2/(2s), so it requires s to exist before its guard is evaluated; it alone cannot define s outside the original chart.", "Global cutoff/chart joins and every nonzero-angular PDE residual remain unproved."],
        "proofBoundary": {"actualSourceScalarBodiesVerified": True, "actualRadialCutoffFunctionAnalyzed": True,
            "actualSourceOuterWaitPositivityProved": True, "actualRhoMassPositiveOnOriginalChart": True,
            "finiteDerivativeCheckUsedAsAllOrderProof": False, "oldSourcePassFlagsUsedAsProof": False,
            "completeGlobalFieldExistenceAndSmoothnessProved": False, "fullActualCartesianPDEVerified": False,
            "originalN601Complete": False, "originalN602Complete": False, "original56Of64Changed": False}}
    output.mkdir(parents=True, exist_ok=True)
    files = []
    def save(name, value):
        raw = (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()
        with (output / name).open("xb") as stream:
            stream.write(raw)
        files.append({"path": name, "sha256": digest(raw), "bytes": len(raw)})
    save("analytic_pde_radial_source_witnesses.json", {"bump": bump_nodes, "outerEndpoint": wait_nodes})
    save("analytic_pde_radial_cutoff.json", result)
    require(time.monotonic() - started < 120, "Analytic source cutoff audit time bound exceeded.")
    save("analytic_pde_cutoff_execution.json", {"finishedAtUTC": datetime.now(timezone.utc).isoformat(), "elapsedSeconds": time.monotonic() - started,
        "implementationSHA256": digest(Path(__file__).read_bytes()), "inputs": manifest, "sourceFiles": source_files, "artifacts": files,
        "successMeans": "exact source binding and written local analytic lemmas; original whole-field global proof remains open"})
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        result = audit(args.artifacts, args.output)
    except Exception as error:
        args.output.mkdir(parents=True, exist_ok=True)
        target = args.output / "analytic_pde_cutoff_failure.json"
        if not target.exists():
            target.write_text(json.dumps({"status": "FAILED", "type": type(error).__name__, "message": str(error), "originalN602Complete": False}, indent=2) + "\n")
        raise
    print(json.dumps({"status": result["status"], "rhoMass633724PositiveOnOriginalChart": True, "actualOuterWait280Positive": True, "completeGlobalFieldSmoothnessProved": False, "originalN602Complete": False}))


if __name__ == "__main__":
    main()
