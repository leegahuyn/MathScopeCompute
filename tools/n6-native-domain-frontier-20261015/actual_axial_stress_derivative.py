"""Exact algebra of one actual axial stress derivative; no analytic closure.

The full 83-node cone is pinned to the historical source record. Its interior
expression is compared with an independent Cartesian chain-rule calculation.
Native partials and the scoped integral are formal atoms. Analytic hypotheses,
positive collars, density joins, zero total moments and stress gluing remain
unproved. No assertion switch can promote them or any original obligation.
"""
from __future__ import annotations

import argparse
from functools import lru_cache
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

import sympy as s

ROOT = 517234
MIDDLE = 517233
X_NODE = 517175
BINDER = 117055
CONE_SHA256 = "f02b61635b695f7941caf256042307c99757589e772a0049146797b399b71920"
STAGE3_SHA256 = "388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f"
EXPECTED_CONE = {
    "0": {"op":"rational","args":["0","1"]},
    "1": {"op":"rational","args":["1","1"]},
    "6": {"op":"source_parameter","args":["T"]},
    "7": {"op":"source_parameter","args":["BOuter"]},
    "8": {"op":"source_parameter","args":["lambda"]},
    "12": {"op":"source_parameter","args":["XR"]},
    "19": {"op":"rational","args":["1","2"]},
    "20": {"op":"rational","args":["-1","1"]},
    "24": {"op":"rational","args":["2","1"]},
    "56": {"op":"add","args":[1,6]},
    "76": {"op":"add","args":[1,56]},
    "83": {"op":"rational","args":["60","1"]},
    "84": {"op":"multiply","args":[7,83]},
    "98": {"op":"add","args":[76,84]},
    "101": {"op":"rational","args":["13","1"]},
    "102": {"op":"inverse","args":[8]},
    "103": {"op":"multiply","args":[101,102]},
    "588": {"op":"exp","args":[1]},
    "612": {"op":"exp","args":[98]},
    "613": {"op":"multiply","args":[12,612]},
    "3292": {"op":"exp","args":[103]},
    "3293": {"op":"multiply","args":[613,3292]},
    "3612": {"op":"source_parameter","args":["t1"]},
    "3617": {"op":"source_parameter","args":["Xa"]},
    "28811": {"op":"rational","args":["1","128"]},
    "28812": {"op":"multiply","args":[3612,28811]},
    "28813": {"op":"exp","args":[28812]},
    "28814": {"op":"multiply","args":[3617,28813]},
    "28824": {"op":"multiply","args":[588,3293]},
    "117055": {"op":"coordinate","args":["actual_n1_Tz_forward$286"]},
    "517015": {"op":"coordinate","args":["physical_norm_face_7_0$28311"]},
    "517016": {"op":"coordinate","args":["physical_norm_face_7_1$28312"]},
    "517017": {"op":"coordinate","args":["physical_norm_face_7_2$28313"]},
    "517128": {"op":"integer_power","args":[517015,2]},
    "517131": {"op":"multiply","args":[24,517015]},
    "517132": {"op":"multiply","args":[19,517131]},
    "517133": {"op":"multiply","args":[24,517132]},
    "517173": {"op":"integer_power","args":[517016,2]},
    "517174": {"op":"add","args":[517128,517173]},
    "517175": {"op":"multiply","args":[19,517174]},
    "517176": {"op":"multiply","args":[24,517175]},
    "517177": {"op":"sqrt_positive","args":[517176]},
    "517178": {"op":"multiply","args":[24,517177]},
    "517179": {"op":"inverse","args":[517178]},
    "517180": {"op":"multiply","args":[517133,517179]},
    "517181": {"op":"inverse","args":[517177]},
    "517182": {"op":"integer_power","args":[517181,2]},
    "517183": {"op":"multiply","args":[517180,517182]},
    "517184": {"op":"multiply","args":[20,517183]},
    "517185": {"op":"multiply","args":[24,517016]},
    "517186": {"op":"multiply","args":[19,517185]},
    "517190": {"op":"multiply","args":[24,517186]},
    "517191": {"op":"multiply","args":[517179,517190]},
    "517192": {"op":"multiply","args":[24,517191]},
    "517193": {"op":"integer_power","args":[517179,2]},
    "517194": {"op":"multiply","args":[517192,517193]},
    "517195": {"op":"multiply","args":[20,517194]},
    "517196": {"op":"multiply","args":[517133,517195]},
    "517197": {"op":"multiply","args":[517182,517196]},
    "517198": {"op":"multiply","args":[517182,517191]},
    "517199": {"op":"multiply","args":[20,517198]},
    "517200": {"op":"multiply","args":[24,517181]},
    "517201": {"op":"multiply","args":[517199,517200]},
    "517202": {"op":"multiply","args":[517180,517201]},
    "517203": {"op":"add","args":[517197,517202]},
    "517204": {"op":"multiply","args":[20,517203]},
    "517218": {"op":"actual_expression_partial","args":[1,[517175,517017],[0,1]]},
    "517219": {"op":"multiply","args":[517186,517218]},
    "517220": {"op":"multiply","args":[517184,517219]},
    "517221": {"op":"actual_expression_partial","args":[1,[117055,517017],[0,1]]},
    "517222": {"op":"definite_integral","args":[517221,117055,28814,517175]},
    "517223": {"op":"multiply","args":[517204,517222]},
    "517224": {"op":"add","args":[517220,517223]},
    "517225": {"op":"multiply","args":[517132,517218]},
    "517226": {"op":"multiply","args":[517199,517225]},
    "517227": {"op":"actual_expression_partial","args":[1,[517175,517017],[1,1]]},
    "517228": {"op":"multiply","args":[517186,517227]},
    "517229": {"op":"multiply","args":[517132,517228]},
    "517230": {"op":"multiply","args":[517181,517229]},
    "517231": {"op":"add","args":[517226,517230]},
    "517232": {"op":"add","args":[517224,517231]},
    "517233": {"op":"multiply","args":[20,517232]},
    "517234": {"op":"smooth_piecewise","args":[517175,28814,28824,0,517233,0]}
}


class Gap(ValueError):
    """Changed source or an algebraic comparison that did not close."""


def require(condition, message):
    if not condition:
        raise Gap(message)


def canonical(value):
    """Canonical raw node JSON: sorted keys, UTF-8, no whitespace."""
    return json.dumps(value, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":")).encode("utf-8")


def digest(value):
    return hashlib.sha256(value).hexdigest()


def cone_sha256(cone):
    return digest(canonical(cone))


def children(node):
    """Only actual operands; registry indices and partial orders are not nodes."""
    op, args = node["op"], node["args"]
    if op in {"rational", "coordinate", "source_parameter"}:
        return []
    if op in {"exp", "inverse", "sqrt_positive", "integer_power"}:
        return args[:1]
    if op in {"add", "multiply", "smooth_piecewise", "definite_integral"}:
        return args
    if op == "actual_expression_partial":
        return args[1]
    raise Gap("Unreviewed source operation " + op)


def validate_cone(frontier):
    require(type(frontier) is dict, "Missing actual primitive frontier")
    require(type(frontier.get("node")) is int and frontier["node"] == ROOT,
            "Changed original frontier node")
    require(canonical(frontier.get("sourceNode")) == canonical(EXPECTED_CONE[str(ROOT)]),
            "Changed original Cartesian-X guard summary")
    cone = frontier.get("smallOriginalPrimitiveCone")
    require(type(cone) is dict, "Missing raw original primitive cone")
    # Canonical bytes distinguish boolean/int and float/int substitutions as
    # well as every operation, argument, coordinate name and binder.
    require(cone_sha256(EXPECTED_CONE) == CONE_SHA256,
            "Internal full-cone pin mismatch")
    require(canonical(cone) == canonical(EXPECTED_CONE),
            "Changed complete 83-node source cone")
    todo, seen = [ROOT], set()
    while todo:
        node_id = todo.pop()
        if node_id in seen:
            continue
        require(str(node_id) in cone, "Unexpanded source dependency")
        seen.add(node_id)
        todo.extend(children(cone[str(node_id)]))
    require(seen == {int(i) for i in cone} and len(seen) == 83,
            "Source cone is incomplete or includes unrelated nodes")
    # No reliance on diagnostic coneComplete/coneIsNotAProof or input labels.
    return cone


def extract_frontier(document, kind):
    require(type(document) is dict, "Invalid input document")
    key = {"frontier": "currentActualPrimitiveFrontier",
           "background": "unprovedPrimitiveFrontier"}[kind]
    require(key in document, "Missing input frontier field " + key)
    return document[key]


def compare_source_nodes(cone, get):
    """Compare all actual nodes, including endpoint ancestry and real binder."""
    for node_id in sorted(cone, key=int):
        require(canonical(get(int(node_id))) == canonical(cone[node_id]),
                "Live source node differs at " + node_id)
    return {"actualNodeCountCompared": len(cone),
            "allOriginalConeNodesStructurallyEqual": True,
            "fullSourceArchiveAuthenticatedByThisTool": False}


def load_live_source(source_db, stage3):
    require(source_db.is_file() and stage3.is_file(),
            "Missing source database or inherited Stage3 module")
    require(digest(stage3.read_bytes()) == STAGE3_SHA256,
            "Changed inherited Stage3 parser")
    name = "axial_stress_stage3"
    spec = importlib.util.spec_from_file_location(name, stage3)
    require(spec is not None and spec.loader is not None,
            "Cannot load inherited Stage3")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module.Source(source_db)


def exact_algebra(cone):
    """Expand actual ops and separately differentiate a generic primitive."""
    x1, x2, eta = s.symbols("x1 x2 eta", real=True)
    u = s.Dummy("actual_n1_Tz_forward", real=True)
    r = s.Symbol("r", positive=True)
    Ieta, feta, fXeta = s.symbols("Ieta feta fXeta")
    parameters = {name: s.Symbol(name, real=True) for name in
                  ["Xa", "t1", "XR", "T", "BOuter", "lambda"]}
    coordinate_atoms = {517015: x1, 517016: x2, 517017: eta, BINDER: u}
    density_eta = s.Function("native1_eta")
    density_Xeta = s.Function("native1_Xeta")
    cart_X = (x1**2 + x2**2) / 2
    radial_square = x1**2 + x2**2

    @lru_cache(None)
    def at(node_id):
        node = cone[str(node_id)]
        op, args = node["op"], node["args"]
        if op == "rational":
            return s.Rational(int(args[0]), int(args[1]))
        if op == "coordinate":
            require(node_id in coordinate_atoms, "Unreviewed actual coordinate")
            return coordinate_atoms[node_id]
        if op == "source_parameter":
            require(args[0] in parameters, "Unreviewed fixed source parameter")
            return parameters[args[0]]
        if op == "add":
            return s.Add(*(at(i) for i in args))
        if op == "multiply":
            return s.Mul(*(at(i) for i in args))
        if op == "integer_power":
            require(type(args[1]) is int, "Noninteger source power")
            return at(args[0])**args[1]
        if op == "inverse":
            return 1 / at(args[0])
        if op == "exp":
            return s.exp(at(args[0]))
        if op == "sqrt_positive":
            return s.sqrt(at(args[0]))
        if op == "actual_expression_partial":
            require(args[0] == 1, "Changed axial native registry index")
            require(args[2] in [[0, 1], [1, 1]], "Unreviewed native jet")
            function = density_eta if args[2] == [0, 1] else density_Xeta
            return function(*(at(i) for i in args[1]))
        if op == "definite_integral":
            body, binder, lo, hi = args
            require(binder == BINDER, "Changed original integral binder")
            return s.Integral(at(body), (at(binder), at(lo), at(hi)))
        raise Gap("Operation not used in interior algebra: " + op)

    require(s.expand(at(X_NODE) - cart_X) == 0, "Changed Cartesian X")
    require(s.expand(at(517176) - 2*cart_X) == 0, "Changed radial square")
    a = parameters["Xa"] * s.exp(parameters["t1"] / 128)
    b = parameters["XR"] * s.exp(parameters["T"] + 3
        + 60*parameters["BOuter"] + 13/parameters["lambda"])
    require(s.simplify(at(28814) - a) == 0, "Changed actual lower guard")
    require(s.simplify(at(28824) - b) == 0, "Changed actual upper guard")
    actual_integral = at(517222)
    require(actual_integral == s.Integral(density_eta(u, eta),
            (u, a, cart_X)), "Integral is not the actual scoped eta-density")
    raw = at(MIDDLE)
    abstracted = raw.xreplace({
        actual_integral: Ieta,
        density_eta(cart_X, eta): feta,
        density_Xeta(cart_X, eta): fXeta,
    })
    source = s.cancel(abstracted.subs(radial_square, r**2))
    expected = x1*x2*(-3*Ieta/r**5 + 2*feta/r**3 - fXeta/r)
    require(s.cancel(source - expected) == 0,
            "Actual source interior differs from proposed algebra")

    # Independent differentiation starts from a generic two-variable J, not
    # the source expression. Jet substitutions are conditional formal names:
    # J_eta=Ieta, J_Xeta=feta, J_XXeta=fXeta are NOT established analytically.
    J = s.Function("J")
    primitive = -J(cart_X, eta) / s.sqrt(radial_square)
    direct = s.diff(primitive, eta, x2, x1)
    replacements = {}
    eta_seen = False
    for derivative in direct.atoms(s.Derivative):
        if (derivative.expr.func == J
                and derivative.variable_count == ((eta, 1),)):
            require(derivative.expr.args[1] == eta
                    and s.expand(derivative.expr.args[0] - cart_X) == 0,
                    "Changed generic primitive eta derivative")
            replacements[derivative] = Ieta
            eta_seen = True
    require(eta_seen, "Missing generic primitive eta jet")
    orders_seen = set()
    for substitution in direct.atoms(s.Subs):
        require(len(substitution.variables) == 1
                and len(substitution.point) == 1
                and s.expand(substitution.point[0] - cart_X) == 0,
                "Unexpected Cartesian chain substitution")
        variable = substitution.variables[0]
        derivative = substitution.expr
        matched = False
        for order, atom in [(1, feta), (2, fXeta)]:
            if derivative == s.Derivative(J(variable, eta),
                                          (variable, order), eta):
                replacements[substitution] = atom
                orders_seen.add(order)
                matched = True
        require(matched, "Unreviewed generic primitive derivative")
    require(orders_seen == {1, 2}, "Missing generic primitive jets")
    chain = s.cancel(direct.xreplace(replacements).subs(radial_square, r**2))
    require(not chain.has(s.Derivative, s.Subs, J),
            "Unreplaced formal chain derivative")
    require(s.cancel(chain - expected) == 0,
            "Independent Cartesian chain formula differs")
    # Deliberately wrong coefficients/omitted terms must remain nonzero.
    wrong = [expected + x1*x2*Ieta/r**5,
             expected - x1*x2*feta/r**3,
             expected + x1*x2*fXeta/r]
    require(all(s.cancel(source - value) != 0 for value in wrong),
            "Algebraic negative control collapsed")
    return {
        "sympyVersion": s.__version__,
        "arithmetic": "exact rational symbolic algebra; no numerical substitution",
        "sourceInteriorNode": MIDDLE,
        "sourceExpansionMinusExpected": str(s.cancel(source - expected)),
        "independentCartesianChainMinusExpected": str(s.cancel(chain - expected)),
        "wrongCoefficientAndOmittedTermControlsRejected": len(wrong),
        "formula": "x1*x2*(-3*r^(-5)*Ieta + 2*r^(-3)*feta - r^(-1)*fXeta)",
        "formalPrimitive": "-J(X,eta)/sqrt(2X)",
        "formalOrderedDerivative": "D_x1 D_x2 D_eta",
        "coordinateIdentities": {"X": "(x1^2+x2^2)/2", "r": "sqrt(2X)>0"},
        "formalNativeAtoms": {
            "feta": "native expression 1 at [517175,517017], orders [0,1]",
            "fXeta": "native expression 1 at [517175,517017], orders [1,1]",
            "Ieta": "integral native expression 1 at [117055,517017], orders [0,1], binder117055, lower28814, upper517175"},
        "actualGuard": {"node": ROOT, "op": "smooth_piecewise",
            "args": EXPECTED_CONE[str(ROOT)]["args"],
            "a": "Xa*exp(t1/128)",
            "b": "XR*exp(T+3+60*BOuter+13/lambda)",
            "positivityFinitenessAndOrderProved": False},
    }


def audit(frontier, source_get=None):
    cone = validate_cone(frontier)
    result = {
        "schema": "MathScope.N6.ActualAxialStressDerivativeAlgebra/1",
        "scope": "exact algebra of the original interior517233 only",
        "sourceConeNodeCount": len(cone),
        "sourceConeCanonicalSHA256": cone_sha256(cone),
        "sourceConeCanonicalEncoding": "UTF-8 JSON sort_keys=True separators=(comma,colon)",
        "originalGuardAndBinderAndNativeTuplesCompared": True,
        "exactAlgebra": exact_algebra(cone),
        "liveSourceComparison": (compare_source_nodes(cone, source_get)
                                 if source_get is not None else None),
        "unprovedAnalyticHypothesesForPrimitiveInterpretation": [
            "Registry expression1 must be identified with the full axial residual f, including its actual body, sign and normalization; this cone only pins calls.",
            "The actual a,b and parameters are finite, lambda!=0 and 0<a<b; the interior uses a<X<b and r>=sqrt(2a)>0.",
            "The actual native partials f_eta and f_Xeta exist with suitable joint regularity on the compact integration interval and a parameter neighborhood.",
            "For the actual scoped primitive J=int_a^X f, justify J_eta=int_a^X f_eta, J_Xeta=f_eta and J_XXeta=f_Xeta using differentiation under the integral and FTC."],
        "unprovedAdditionalStressGluingRequirements": [
            "Actual density vanishes on the required inner and outer collars and its required endpoint jets vanish.",
            "For every admitted eta, int_a^b f(s,eta)ds=0, with the required parameter derivative identities; density flatness alone does not give this total moment.",
            "All complete literal bodies and the original26 ordered requests must pass together under the original acceptance gate."],
        "actualNativeDerivativeExistenceProved": False,
        "actualIntegralFinitenessProved": False,
        "actualDensityJoinsProved": False,
        "actualStressPrimitiveJoinsProved": False,
        "smoothPiecewiseRegularityProved": False,
        "originalBackground26ClosureProved": False,
        "numericalEvidenceUsed": False,
        "newOriginalGuardsDischarged": 0,
        "newOriginalJetsDischarged": 0,
        "newOriginalPDETermsDischarged": 0,
        "sourceDefinitionsConstantsQuantifiersAndOrderedDerivativesChanged": False,
    }
    return result


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--frontier", type=Path,
                    help="Historical FIRST26_FRONTIER_RUN38734477166.json")
    ap.add_argument("--background", type=Path,
                    help="Fresh ACTUAL_BACKGROUND_26_JET_REGULARITY.json")
    ap.add_argument("--source-db", type=Path)
    ap.add_argument("--stage3", type=Path)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)
    require(args.frontier is not None or args.background is not None,
            "Supply --frontier or --background")
    require((args.source_db is None) == (args.stage3 is None),
            "--source-db and --stage3 must be supplied together")
    paths = [(kind, getattr(args, kind)) for kind in ["frontier", "background"]
             if getattr(args, kind) is not None]
    protected = [path.resolve() for _, path in paths]
    protected.extend(path.resolve() for path in [args.source_db, args.stage3]
                     if path is not None)
    require(args.out.resolve() not in protected, "Cannot overwrite an input")
    loaded = []
    for kind, path in paths:
        raw = path.read_bytes()
        document = json.loads(raw)
        frontier = extract_frontier(document, kind)
        validate_cone(frontier)
        loaded.append((kind, path, raw, frontier))
    get = (load_live_source(args.source_db, args.stage3)
           if args.source_db is not None else None)
    result = audit(loaded[-1][3], get)
    result["inputBindings"] = [
        {"kind": kind, "file": path.name, "sha256": digest(raw)}
        for kind, path, raw, _ in loaded]
    if args.stage3 is not None:
        result["stage3SHA256"] = digest(args.stage3.read_bytes())
    for _, path, raw, _ in loaded:
        require(path.read_bytes() == raw, "Input changed during read-only audit")
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8")
    print(json.dumps({"sourceConeNodes": result["sourceConeNodeCount"],
        "sourceConeSHA256": result["sourceConeCanonicalSHA256"],
        "sourceAndIndependentChainDifferences": ["0", "0"],
        "liveSourceCompared": get is not None, "newOriginalDischarged": 0}))


if __name__ == "__main__":
    main()

