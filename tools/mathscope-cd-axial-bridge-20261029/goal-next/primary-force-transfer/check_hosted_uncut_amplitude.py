"""Check uncut amplitude bounds from the authenticated hosted order-two primary."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from hashlib import sha256
from math import comb
from pathlib import Path
import json
import subprocess

PRIMARY_SOURCE = "f8cb4034e86d7b669d52a6f2248aebba156b51b5"
NAVIER_M3 = "research-ide/mathscope-m3/navier/"
NAVIER_M2 = "research-ide/mathscope-m2/navier/"
PINS = {
    "current-full-graph.json": "91381026ef0083167c5d6cae788547cc7b2644224aa51de99ec9ed4696fef962",
    "current-certificate.json": "4c85bbb35096dab9d606ea6f308ab6baad7c5dd3223522844c1c8abe44de7cab",
    "target-certificate.json": "2f0cafb7569f2c05ef752066eef05e992bd36f40532137e4dc0d0dec2a62b581",
    "primary-certificate.json": "294a93a740eef5c99b8035f31b39e027920426b39ea3fb843faf0373b61f4cba",
    "primary-additive-program.json": "689577564c72e794e3ca6aafe0e713da4853493a6109175ddd73d426b3317f5b",
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def pinned(path, digest):
    raw = path.read_bytes()
    require(sha256(raw).hexdigest() == digest, f"Exact source required for {path.name}")
    return json.loads(raw)


class Graph:
    def __init__(self, nodes, start=0):
        self.nodes = nodes
        self.start = start

    def node(self, i):
        require(isinstance(i, int) and self.start <= i < self.start + len(self.nodes), f"Invalid graph node {i}")
        return self.nodes[i - self.start]

    def args(self, i, op):
        node = self.node(i)
        require(node["op"] == op, f"Expected {op} at #{i}")
        return node["args"]

    def rational(self, i):
        return Fraction(*map(int, self.args(i, "rational")))

    def factors(self, i, atomic):
        if i in atomic or self.node(i)["op"] != "multiply":
            return Counter({i: 1})
        result = Counter()
        for child in self.args(i, "multiply"):
            result.update(self.factors(child, atomic))
        return result

    def linear(self, i, atom):
        if i == atom:
            return Fraction(0), Fraction(1)
        node = self.node(i)
        if node["op"] == "rational":
            return self.rational(i), Fraction(0)
        children = [self.linear(child, atom) for child in node["args"]]
        if node["op"] == "add":
            return tuple(sum(values) for values in zip(*children, strict=True))
        require(node["op"] == "multiply" and len(children) == 2, f"Expected affine expression at #{i}")
        (a, b), (c, d) = children
        require(b * d == 0, f"Non-affine term at #{i}")
        return a * c, a * d + b * c


def product(left, right, m):
    terms = [(left[j][0] + right[m-j][0] + (comb(m, j)-1).bit_length(),
              left[j][1] + right[m-j][1]) for j in range(m+1)]
    return max(p for p, _ in terms) + m.bit_length(), max(d for _, d in terms)


def source_pins(repo):
    anchors = {
        NAVIER_M3 + "source-global-band.mjs": [
            "ci=G.mul(power(Tg,paletteIndex),power(Q,G.add(G.one,h))),Ls=G.div(G.mul(q(2),r0),ci)",
            "Htheta=G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),t[0],t[1]),v,G.zero,Ls))",
        ],
        NAVIER_M3 + "source-global-class.mjs": [
            "Each fixed jth slow cutoff derivative is <=slowCutoff*S^(3j)",
            "G.pow(G.div(q(2),c.r0),j),time.stepBounds[j]",
        ],
        NAVIER_M2 + "actual-global-wave-bound-kernel.mjs": [
            "sourceCutoffs=Array.from({length:order+2},(_,j)=>degree(3*j+3))",
            "amplitude=productJets(productJets(sigma,t),sourceCutoffs)",
            "since y>=c_y*zeta",
        ],
    }
    result = {}
    for path, needles in anchors.items():
        blob = subprocess.check_output(["git", "show", PRIMARY_SOURCE + ":" + path], cwd=repo)
        for needle in needles:
            require(needle.encode() in blob, f"Missing original source anchor in {path}")
        result[path] = sha256(blob).hexdigest()
    return result


def check_cutoffs(g, band):
    cut = band["cutoffs"]
    geo = band["geometry"]
    L, r0, ci = (geo[k] for k in ("Ls", "r0", "ci"))
    v, xi = band["coordinates"]["v"], cut["xi"]
    psi, chi = cut["psi"], cut["chi"]
    factors = g.args(L, "multiply")
    require(g.rational(factors[0]) == 2 * g.rational(r0) == Fraction(1, 2**33), "Pulse length numerator")
    require(g.args(factors[1], "inverse") == [ci], "Pulse length denominator")
    require(g.args(geo["S"], "integer_power") == [geo["ell"], 2], "Actual S=ell^2")

    u, w = g.args(psi, "multiply")
    u, du = g.args(u, "source_step_derivative")
    w, dw = g.args(w, "source_step_derivative")
    require(du == dw == 0, "Longitudinal cutoff leaf orders")
    offset, ramp = g.args(u, "add")
    require(g.rational(offset) == -4, "First ramp shift")
    numerator, denominator = g.args(ramp, "multiply")
    require(g.args(denominator, "inverse") == [L], "Longitudinal ramp denominator")
    require(g.linear(numerator, v) == (0, 20), "Longitudinal ramp numerator")
    require(g.linear(w, ramp) == (16, -1), "Second ramp shift")

    a, lo, hi, left, inside, right = g.args(chi, "smooth_piecewise")
    require(tuple(g.rational(x) for x in (lo, hi, left, right)) ==
            (Fraction(1, 4), Fraction(3, 4), 1, 0), "Transverse cutoff guards")
    step, order = g.args(inside, "source_step_derivative")
    require(order == 0 and g.linear(step, a) == (Fraction(3, 2), -2), "Transverse cutoff transition")
    square, = g.args(a, "sqrt_positive")
    normalized, power = g.args(square, "integer_power")
    require(power == 2 and g.linear(normalized, xi) == (0, 1 / g.rational(r0)), "Actual |xi/r0|")
    return psi, chi


def check_amplitudes(g, current, primary):
    band = current["sourceBand"]
    psi, chi = check_cutoffs(g, band)
    slow = current["local"]["slowCutoff"]["body"]
    epsilon = band["geometry"]["epsilon"]
    v, L = band["coordinates"]["v"], band["geometry"]["Ls"]
    roots = []
    for j, binding in enumerate(primary["sourcePulseBindings"]):
        family = band["families"][j]
        row = current["local"]["rows"][j]
        A = band["target"]["squareRootWeights"][j]
        y = band["target"]["weights"][j]
        require(g.args(A, "sqrt_positive") == [y], "Same positive target root")
        require(binding["originalPositiveA"] == A and binding["originalP"] == family["P"], "Same Gaussian and weight")
        require(binding["originalAmplitude"] == family["t"] and binding["weightedAmplitude"] == row["weightedAmplitude"],
                "Same source pulse and weighted amplitude")
        require(binding["sign"] == family["sign"] == row["sign"] == (1, -1)[j], "Original signs")
        require(all(binding[key] for key in ("sourceAmplitudeBodyMatches", "sameOriginalTimeCutoff",
                    "frozenReferenceAndCarrier", "coefficientsBoundBySamePrimitive")), "Pulse binding flags")
        h_roots = []
        for a in range(2):
            h = primary["sourceReferences"]["H"][a][j]
            require(h == band["target"]["H"][a][j], "Same H column")
            args = g.args(h, "multiply")
            integral, = (r for r in args if g.node(r)["op"] == "definite_integral")
            body, binder, lo, hi = g.args(integral, "definite_integral")
            require(binder == v and g.rational(lo) == 0 and hi == L, "Same original H integral endpoints")
            factors = g.factors(body, {psi, *family["t"]})
            square, = (r for r in factors if g.node(r)["op"] == "integer_power")
            require(g.args(square, "integer_power") == [psi, 2], "Keep the inner squared time cutoff")
            require(factors == Counter([square, family["t"][0], family["t"][a+1]]), "Same full H integrand")
            h_roots.append(integral)
        for i, t in enumerate(family["t"]):
            cut_amplitude = row["weightedAmplitude"][i]
            factors = g.factors(cut_amplitude, {psi, chi, slow, A, t})
            eps_sqrt, = (r for r in factors if r not in {psi, chi, slow, A, t})
            require(g.args(eps_sqrt, "sqrt_positive") == [epsilon], "Same fixed epsilon")
            uncut = [slow, eps_sqrt, A, chi, t]
            require(factors == Counter([*uncut, psi]), "Remove precisely the outer longitudinal factor")
            roots.append({"sign": family["sign"], "component": i, "cutAmplitude": cut_amplitude,
                          "uncutFactors": uncut, "removedOuterPsi": psi, "retainedHIntegrals": h_roots})
    require(len(roots) == 6, "Both signs of every original primary component")
    return roots


def main():
    parser = ArgumentParser(description=__doc__)
    for key in ("repo", "artifact", "transfer-receipt", "out"):
        parser.add_argument("--" + key, type=Path, required=True)
    args = parser.parse_args()
    sources = source_pins(args.repo)
    current = pinned(args.artifact / "current-certificate.json", PINS["current-certificate.json"])
    primary = pinned(args.artifact / "primary-certificate.json", PINS["primary-certificate.json"])
    target = pinned(args.artifact / "target-certificate.json", PINS["target-certificate.json"])
    cutoff_transfer = pinned(args.transfer_receipt, "aa2538773aff20371f3f5e9b5f258d649ed0060f5edbaa6a46c89cc05534dc0b")
    g = Graph(pinned(args.artifact / "current-full-graph.json", PINS["current-full-graph.json"])["nodes"])
    amplitudes = check_amplitudes(g, current, primary)
    del g

    additive = pinned(args.artifact / "primary-additive-program.json", PINS["primary-additive-program.json"])
    norm = Graph(additive["norm"]["nodes"], additive["norm"]["start"])
    b = primary["bounds"]
    require(b == additive["record"]["bounds"] and primary["request"]["order"] == 2, "Actual additive norm record")
    require(b["backgroundRow"]["backgroundDerivativeOrder"] == 5 and target["request"]["derivativeOrder"] == 3,
            "Actual C5/C3 inputs")
    require(all(check["pass"] for check in primary["checks"] + target["checks"]), "Original class checks")
    K = b["K"]
    Kterms = set(norm.args(K, "maximum"))
    require({b["coefficientConstants"]["maximum"], *[r["N_m"] for r in b["targetRows"]],
            b["haarLengthUpper"], b["backgroundRow"]["B_m"]} <= Kterms, "K covers actual cutoff, target and background")
    require(b["coefficientConstants"]["order"] == 4, "Actual source cutoff bounds through order four")

    weighted = b["degreeProgram"]["weighted"]
    sigma = [(r["power"], r["pole"]) for r in weighted["sigma"]]
    t = [(p+1, 0) for p in weighted["mixed"]["powers"]["t"]]
    require(len(sigma) == len(t) == 4 and weighted["targetPoles"] == [3, 6, 9, 12], "Retain all orders and target poles")
    sigma_t = [product(sigma, t, m) for m in range(4)]
    # The slow/transverse product uses the same conservative degree row
    # as the three-cutoff product, without dividing by a zero cutoff.
    cutoffs = [(3*m+3, 0) for m in range(4)]
    rows = [product(sigma_t, cutoffs, m) for m in range(4)]
    require(rows == [(d["power"], d["pole"]) for d in weighted["amplitude"]], "Exact majorant recurrence")
    require(rows == [(84, 2), (445, 6), (851, 12), (1257, 18)], "Exact finite-order degrees")
    require(cutoff_transfer["actual_flat_operands"] == 30 and
            max(cutoff_transfer["scaled_psi_derivative_bounds_1_to_4"]) < 2**60,
            "Original cutoff derivative constant")
    report = {
        "sourceCommit": PRIMARY_SOURCE,
        "hostedRun": 43035074273,
        "sourceBlobSHA256": sources,
        "pinnedNativeArtifacts": PINS,
        "verifiedUncutAmplitudes": amplitudes,
        "normNamespace": "target-plus-additive",
        "originalSourceOnlyKRoot": K,
        "hostedFixedChartUncutDegreesPowerPole": rows,
        "hostedFixedChartUncutBound": "(K*S)^power sqrt(epsilon*zeta) delta^(-pole) P(v)",
        "hostedFixedChartHalfCutoffDerivativeThroughC3": "2^95*K^1257*S^1256 sqrt(epsilon*zeta) delta^(-18) P(v)",
        "scope": "Fixed-label interior of the authenticated primary chart and original source class hypotheses",
        "actualCommonReferenceTransportAndForcedJoin": "OPEN",
        "fullSupportedInputUniformClass": "OPEN",
        "release": "HOLD",
    }
    args.out.write_bytes((json.dumps(report, indent=2) + "\n").encode())
    print("PASS six actual uncut amplitudes, four preserved H integrals and C0-C3 majorant rows")


if __name__ == "__main__":
    main()

