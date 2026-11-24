"""Lift the original pressure and mean residual source DAG at fixed mean velocity."""

import argparse
from collections import Counter
from fractions import Fraction
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent / "c147/registration-recovery"))
from reconstruct_offline_indexed_append import Archive, PREFIX, STREAM_HASH, dump

NAMES = ("rr", "rtheta", "rz", "thetatheta", "thetaz", "zz")
ELL, R, Z, T = 17732737, 17732748, 17732749, 17732750
Y1, Y2 = 17745430, 17745431
EPS, FAST, VR2, INV_R = 17732744, 17745446, 17733068, 17733137
LOWER, UPPER = 17743711, 17743713
RHO, CHI, CHI_R, CHI_Z = 17743727, 17743734, 17743762, 17744145
CUTOFF = 22000000
BASE_REGISTRY = "62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce"
REPEAT_NODES = "3d0538045a0927ac3389281222d346139fa8c9647a061372dd4177696bab859f"
REPEAT_DEFS = "83dc44c8062e33fa36a0ed26852ff261ecb7fba426e3733c6edb9c9ef4aa1a73"
COV_NODES = "e8ab3ec42669a055a9e1e39177488564082d3a300d80ee615b5e312c78660f12"
COV_DEFS = "f67efc40db18b897d4346e4773ad14b231a7aebf361628df9b0bfddecdebd90f"
SHARED = (
    ("gr", 1338, 22152063, 22152220, [ELL, R, Z, T, Y1, Y2]),
    ("haarGr", 1339, 22152222, 22152223, [ELL, R, Z, T]),
    ("P", 1340, 22152226, 22152227, [ELL, Z, T]),
    ("Jtheta", 1341, 22152293, None, [ELL, Z, T]),
    ("Jz", 1342, 22152354, None, [ELL, Z, T]),
)
PRESSURE = {
    "density": 22152358, "left": 22152412, "whole": 22152413,
    "auxiliaryLeft": 22152457, "auxiliaryWhole": 22152458,
    "slowZLeft": 22152563, "slowZWhole": 22152564,
    "value": 22152569, "A0": 22152570, "fullRadialDerivative": 22152582,
    "partialR": 22152577, "Lp": 22152580, "slowZDerivative": 22152596,
    "innerBoundary": 22152586, "outerBoundary": 22152590,
    "radialResidual": 22152598, "Etheta": 22152123, "Ez": 22152600,
}


def checked(path, digest):
    body = path.read_bytes()
    assert sha256(body).hexdigest() == digest, path
    return body


def import_rows(graph, body):
    for line in body.splitlines(keepends=True):
        assert graph.node(**{"operation": json.loads(line)["op"], "args": json.loads(line)["args"]}) == PREFIX + len(graph.added) - 1


def application(graph, item, args=None, orders=None):
    indexed = "directions" in item
    op = "m3_coupled_indexed_partial" if indexed else "m3_coupled_expression_partial"
    values = item["parameters"] if args is None else args
    width = len(item["directions"] if indexed else item["parameters"])
    partial = [0] * width if orders is None else orders
    assert len(values) == len(item["parameters"]) and len(partial) == width
    return graph.node(op, [item["id"], values, partial])


def product(graph, left, right):
    if not left or not right:
        return 0
    if left == 1 or right == 1:
        return right if left == 1 else left
    return graph.node("multiply", [left, right])


def total(graph, *nodes):
    terms = [node for node in nodes if node]
    return graph.add(terms) if terms else 0


class Lift:
    """Exact homogeneous coefficient under simultaneous W -> W + s delta W."""

    def __init__(self, graph, fields, added_fields):
        self.graph = graph
        self.covariance = {}
        self.shared = {}
        self.calls = Counter()
        for j, (name, new) in enumerate(zip(NAMES, added_fields, strict=True)):
            old = fields[20 + j]
            assert old["name"] == "GenericSigned162_covariance_delta_" + name
            assert new["name"] == "ActualPostFiveRepeatCovarianceDelta_" + name
            for key in ("parameters", "directions"):
                assert old[key] == new[key]
            assert new["directions"] == [R, Z, T, Y1, Y2]
            self.covariance[old["id"]] = new

    @cache
    def term(self, node):
        if node < CUTOFF:
            return 0
        g = self.graph
        data = g.record(node)
        op, args = data["op"], data["args"]
        if op == "add":
            return total(g, *(self.term(child) for child in args))
        if op == "multiply":
            left, right = args
            dl, dr = self.term(left), self.term(right)
            assert not (dl and dr), ("nonlinear mean dependence", node)
            return total(g, product(g, dl, right), product(g, left, dr))
        if op == "definite_integral":
            body, binder, low, high = args
            assert not any(map(self.term, [binder, low, high])), ("changed integral domain", node)
            delta = self.term(body)
            return g.clone(node, [delta, binder, low, high]) if delta else 0
        if op in ("m3_coupled_indexed_partial", "m3_coupled_expression_partial",
                  "m3_aux_expression_partial", "m3_aux_inverse_partial", "m3_coupled_inverse_partial"):
            name, values, orders = args
            assert not any(map(self.term, values)), ("changed native call values", node)
            target = self.covariance.get(name) or self.shared.get(name)
            if target is not None:
                self.calls[name] += 1
                return application(g, target, values, orders)
            # Other shared functions are frozen original operands. No registry
            # entries are mutated when the Repeat corrections are appended.
            return 0
        if op in ("coordinate", "rational", "source_parameter"):
            return 0
        if op in ("inverse", "integer_power", "sqrt_positive", "exp", "log_positive",
                  "source_step_derivative", "ceiling", "sine", "cosine"):
            children = args[:1]
        elif op in ("smooth_piecewise", "maximum"):
            children = args
        else:
            raise AssertionError(("unhandled source operation", node, op))
        assert not any(map(self.term, children)), ("nonlinear source operator", node, op)
        return 0


def exact_polynomial(graph, root, atoms):
    @cache
    def expand(node):
        if node in atoms:
            return Counter({(node,): Fraction(1)})
        op, args = graph.record(node).values()
        if op == "rational":
            value = Fraction(int(args[0]), int(args[1]))
            return Counter({(): value}) if value else Counter()
        if op == "add":
            result = Counter()
            for child in args:
                result.update(expand(child))
            return result
        assert op == "multiply", (node, op, sorted(atoms))
        left, right = map(expand, args)
        result = Counter()
        for a, va in left.items():
            for b, vb in right.items():
                result[tuple(sorted(a + b))] += va * vb
        return result

    return {k: n for k, n in expand(root).items() if n}


def verify_delta(gr, lift, fields, pressure):
    g = lift.graph
    delta = dict(zip(NAMES, fields, strict=True))

    def d(name, axis=None):
        orders = [int(direction == axis) for direction in delta[name]["directions"]]
        return application(g, delta[name], orders=orders)

    def mul(*nodes):
        result = 1
        for node in nodes:
            result = product(g, result, node)
        return result

    def de(name, power):
        return total(g, d(name, R), mul(FAST, d(name, Y1)), mul(FAST, VR2, d(name, Y2)),
                     mul(g.rational(power), INV_R, d(name)))

    gr_expected = total(g, mul(20, de("rr", 1)), mul(20, EPS, d("rz", Z)),
                        mul(INV_R, d("thetatheta")))
    raw_atoms = {EPS, FAST, VR2, INV_R, *(d(name, axis) for name in NAMES for axis in (None,R,Z,Y1,Y2))}
    assert g.record(INV_R) == {"op": "inverse", "args": [R]}
    for label, actual, expected, atoms in (
        ("gr", gr, gr_expected, raw_atoms),
        ("Etheta", pressure["Etheta"], total(g, de("rtheta",2), mul(EPS, d("thetaz", Z))), raw_atoms),
        ("Ez", pressure["Ez"], total(g, de("rz",1), mul(EPS, d("zz",Z)), mul(EPS,pressure["slowZDerivative"])),
         raw_atoms | {pressure["slowZDerivative"]}),
    ):
        assert exact_polynomial(g, actual, atoms) == exact_polynomial(g, expected, atoms), label

    p = pressure["P"]
    source = total(g, gr, mul(20, RHO, p))
    assert g.record(pressure["density"]) == g.record(source) or exact_polynomial(
        g, pressure["density"], {gr,RHO,p}) == exact_polynomial(g, source, {gr,RHO,p})
    for left_name, whole_name in (("left","whole"), ("auxiliaryLeft","auxiliaryWhole"),
                                  ("slowZLeft","slowZWhole")):
        left, whole = (g.record(pressure[k])["args"] for k in (left_name, whole_name))
        assert left[:3] == whole[:3] and left[2:] == [LOWER,R] and whole[2:] == [LOWER,UPPER]
    assert Z not in (g.free(LOWER) | g.free(UPPER))
    left, whole = (pressure[key] for key in ("left","whole"))
    assert exact_polynomial(g, pressure["value"], {left,whole,CHI}) == {
        (left,): 1, tuple(sorted((CHI,whole))): -1}
    assert g.record(pressure["A0"]) == {"op":"multiply", "args":[CHI_R,whole]}
    terms = {gr, RHO, p, pressure["A0"], FAST, CHI,
             pressure["auxiliaryLeft"], pressure["auxiliaryWhole"], 17754219}
    # The archived coefficient a*chi may be reused as a shared product by the
    # source, so it must be expanded instead of treated as an independent atom.
    terms.remove(17754219)
    radial_expected = {(gr,): 1, tuple(sorted((RHO,p))): -1, (pressure["A0"],): -1}
    assert exact_polynomial(g, pressure["fullRadialDerivative"], terms) == radial_expected
    assert exact_polynomial(g, pressure["radialResidual"], terms) == {
        key: value for key,value in radial_expected.items() if key != (gr,)}
    without_cutoff_derivative = total(g, gr, mul(20,RHO,p))
    assert exact_polynomial(g, without_cutoff_derivative, terms) != radial_expected
    left_z, whole_z = (pressure[key] for key in ("slowZLeft","slowZWhole"))
    assert exact_polynomial(g,pressure["slowZDerivative"],{left_z,whole_z,CHI,CHI_Z,whole}) == {
        (left_z,): 1, tuple(sorted((CHI,whole_z))): -1, tuple(sorted((CHI_Z,whole))): -1}
    return {"deltaRadialDerivativeTerms": ["delta_g_r","-rho*delta_P","-chi_R*I_whole"],
            "deletedCutoffDerivativeDetected": True,
            "slowZFixedEnvelopeVerified": True,
            "sixCovarianceDirectionsCheckedAgainstEquations": True}


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--original", type=Path, required=True)
    cli.add_argument("--repeat", type=Path, required=True)
    cli.add_argument("--covariance", type=Path, required=True)
    cli.add_argument("--out", type=Path, required=True)
    args = cli.parse_args()
    native = json.loads(checked(args.original / "original-source-functions.json", BASE_REGISTRY))
    expressions, fields, *_ = json.loads(native["definitions"])
    repeat_defs = json.loads(checked(args.repeat / "offline-replay1-offline-definitions.json", REPEAT_DEFS))
    cov_defs = json.loads(checked(args.covariance / "offline-definitions.json", COV_DEFS))
    sys.setrecursionlimit(20_000)
    with TemporaryFile() as storage:
        graph = Archive(args.original / "original-source-nodes.jsonl.gz", storage)
        # A single fast byte scan proves that the pre-window freeze cannot hide
        # a selected field or shared-function application in the original DAG.
        prefixes = tuple(f'"{name}"'.encode() for name in [
            *(f"coupled-field:{j}" for j in range(20,26)),
            *(f"coupled-expression:{j}" for _,j,*_ in SHARED),
        ])
        storage.seek(0)
        for i in range(CUTOFF):
            data = storage.readline()
            if b'"m3_coupled_' in data:
                assert not any(key in data for key in prefixes), i
        import_rows(graph, checked(args.repeat / "offline-replay1-offline-append.jsonl", REPEAT_NODES))
        import_rows(graph, checked(args.covariance / "offline-append.jsonl", COV_NODES))
        first = PREFIX + len(graph.added)
        assert first == 22387300
        lift = Lift(graph, fields, cov_defs["fields"])
        added_expressions = []
        pressure = {}
        for name, identity, body, old_root, parameters in SHARED:
            old = expressions[identity]
            assert old["id"] == f"coupled-expression:{identity}"
            assert old["body"] == body and old["parameters"] == parameters and old["name"].endswith("_" + {"gr":"complete_gr","haarGr":"haar_gr"}.get(name,name))
            delta_body = lift.term(body)
            assert delta_body and graph.free(delta_body) <= set(parameters)
            new = {**old, "id": f'coupled-expression:{len(expressions)+len(repeat_defs["expressions"])+len(cov_defs["expressions"])+len(added_expressions)}',
                   "name": "ActualPostFiveRepeatMeanDelta_" + name, "body": delta_body}
            added_expressions.append(new)
            lift.shared[old["id"]] = new
            pressure[name] = lift.term(old_root) if old_root is not None else application(graph, new)
        gr = added_expressions[0]["body"]
        for name, root in PRESSURE.items():
            pressure[name] = lift.term(root)
            assert pressure[name], (name, root)
        eq_checks = verify_delta(gr, lift, cov_defs["fields"], pressure)
        corrected_velocity = [total(graph, old, application(graph, extra))
                              for old,extra in zip(range(22153222,22153225), repeat_defs["fields"][:3],strict=True)]
        corrected_p = total(graph, 22153227, application(graph, repeat_defs["fields"][3]), pressure["value"])
        assert all({Z,R} <= graph.free(root) for root in [*corrected_velocity,corrected_p])
        updated_mean = total(graph, 22152569, pressure["value"])
        delta_suffix = b"".join(dump(row) for row in graph.added[first-PREFIX:])
        defs = dump(added_expressions)
        details = {
            "status": "EXACT_ARCHIVE_FIXED_MEAN_REPEAT_PRESSURE_AND_RESIDUAL_OPERATOR_CANDIDATE",
            "originalArchiveSHA256": STREAM_HASH, "authenticatedOriginalNodeCount": PREFIX,
            "firstAppendNode": first, "endExclusive": PREFIX + len(graph.added),
            "appendSHA256": sha256(delta_suffix).hexdigest(),
            "newDefinitionsSHA256": sha256(defs).hexdigest(),
            "newExpressionCount": len(added_expressions),
            "nativeDerivativeReplayCalls": dict(lift.calls),
            "meanDelta": pressure, "fullVelocityCandidate": corrected_velocity,
            "fullPressureCandidate": corrected_p, "updatedMeanPressure": updated_mean,
            "operatorChecks": eq_checks, "meanVelocityFrozenAtOriginalPostFiveValue": True,
            "privateLiveRegistration": False, "samePhysicalFieldGlobalRegularity": False,
            "fullNonzeroAngularResidualRecomputed": False, "finalJets": 0, "release": "HOLD",
        }
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "offline-append.jsonl").write_bytes(delta_suffix)
    (args.out / "offline-definitions.json").write_bytes(defs)
    (args.out / "offline-report.json").write_bytes(dump(details))
    print(json.dumps(details, indent=2))


if __name__ == "__main__":
    main()
