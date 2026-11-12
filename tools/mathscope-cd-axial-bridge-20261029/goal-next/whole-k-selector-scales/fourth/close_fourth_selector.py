"""Exact fourth-selector comparisons in the pinned original source arithmetic."""
from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sys


DEN = 512
SOURCE = "f8cb4034e86d7b669d52a6f2248aebba156b51b5"
SPECS = {
    "historical-c4": (
        "018af4f89ff5b43a3d6cd6a6096034070371e51170428991ec466c2e735b9497",
        "48c7f9b4d051ae2ede6c568079daf9a53ebf960e8cc7884b4c01797ee14eef8b",
        "26932ce7c403658fed60c07733fedcd58953005c6b156f1e3e056946c0051844",
        "historical-c4-operands.json",
        "e1c782cbb6ea5670e618e41833a4d7f640d6ed50d02d6c4f73607e1b52f4790f",
        {159898: (159894, 34), 197797: (197793, 45), 261537: (261533, 56)},
    ),
    "fourth-ftc": (
        "49e6a71566c13cf22910d94fed5f9d75e7361d79e2fa381b3618404b14e29649",
        "f647cffde45b05c896c59fbe96c0fc5789d8521ce8ad30b05ebfbbb712d25e26",
        "cab725cdeec1ce06d1ec20bad5b90ad1cb43219c2fc7a2368d896768fc32fc42",
        "fourth-ftc-all-upper-operands.json",
        "d1a32576780f3c10956d03aaca6f51a5cd408a1ae5558e31e04384bbccab33bd",
        {209645: (209640, 71)},
    ),
}
PROFILE_SHA = "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a"
THRESHOLD_SHA = "1a5ce5577bd4c5d47975b89a1de4433eb37a46068ba388459d2821f8ddd0c69a"
BINDING_SHA = "a457680a35236c844cd78603e1f8af59a088608431df4c76014b98c128e48b23"
EARLIER_SHA = "a4c58765594add6fe9d5d460d2f5c6861003f7ed9d13f31f3c2828ab3f756d96"
ORIGINAL_STAGE_SHA = "0c7285a274b3442eca8cf2127c3d279f8a09ec0db48f5d444006f23d324b3cd8"
ORIGINAL_FINAL_SHA = "88f7cf6fe5af934d6b3bcacc8ad975e86bd0b37fee2110b9db8c73e72acb129e"
ARITHMETIC_INPUT_SHA = "03806ccc21ae6f759d0f5908d9eaabb24e3972aaedd530d43aea8ade522fa3f0"
SMALL_PROFILE = {
    "Md", "T", "BOuter", "lambda", "h", "Pstar", "logP", "XR", "Lambda", "sigmaStar",
    "CSelected", "t1", "Tsh", "muMoment", "Q", "rho", "K",
}
RATIONAL = {"rational", "source_parameter"}
POLYNOMIAL = {"add", "multiply", "maximum", "sqrt_positive"}
UNARY = {"exp", "log_positive", "inverse"}


def read(path, pin):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == pin, path
    return raw


def read_json(path, pin):
    return json.loads(read(path, pin))


def node_table(trace):
    rows = trace["nodes"]
    result = {r["id"]: (r["node"]["op"], r["node"]["args"]) for r in rows}
    assert len(result) == len(rows) and list(result) == sorted(result)
    return result


def children(op, args):
    if op in POLYNOMIAL | UNARY:
        return args
    if op == "integer_power":
        return args[:1]
    assert op in RATIONAL
    return []


def dependencies(nodes, roots, stop=()):
    visited, todo = set(), list(roots)
    while todo:
        i = todo.pop()
        if i in visited:
            continue
        visited.add(i)
        if i not in stop:
            operands = children(*nodes[i])
            assert all(0 <= j < i for j in operands)
            todo.extend(operands)
    return sorted(visited)


def rational_rank(value):
    value = abs(value)
    if value <= 1:
        return 0, 0
    # x=S^(1/512)>2^(100000/512), so x^e covers this binary numerator.
    return 0, (value.numerator.bit_length()*DEN+99999)//100000


def frequency_operand_ranks(nodes, roots):
    # Rank (d,e) means exp iterated d times at x^e, x=S^(1/512).
    def combine(ranks):
        level = max(d for d, _ in ranks)
        assert all(0 <= e < 2**90 for _, e in ranks)
        return level, max(e if d == level else 1 for d, e in ranks)

    def product(ranks):
        d, e = combine(ranks)
        return (d, e+1) if d else (0, sum(j for _, j in ranks))

    def power(rank, exponent):
        d, e = rank
        assert 0 <= exponent <= 2**190
        return (0, 0) if not exponent else (d, e+1) if d else (0, e*exponent)

    bounds = {}
    for i in dependencies(nodes, roots):
        op, args = nodes[i]
        assert 1 <= len(args) <= 2**190
        inverse = None
        if op == "rational":
            value = Fraction(*map(int, args))
            direct = rational_rank(value)
            if value:
                inverse = rational_rank(1/value)
        elif op == "source_parameter":
            name, = args
            if name in SMALL_PROFILE:
                direct = inverse = (0, 1)
            else:
                direct, inverse = {
                    "sourceEnvelopeS": ((0, DEN), (0, 0)),
                    "loopMuMax": ((0, 12*DEN), (0, 0)),
                    "loopD0": ((0, 0), (0, DEN+1)),
                    "loopDelta": ((0, 0), (1, 16*DEN)),
                }[name]
        elif op == "add":
            d, e = combine([bounds[j][0] for j in args])
            direct = d, e+1
        elif op == "multiply":
            direct = product([bounds[j][0] for j in args])
            if all(bounds[j][1] is not None for j in args):
                inverse = product([bounds[j][1] for j in args])
        elif op == "maximum":
            direct = combine([bounds[j][0] for j in args])
        elif op == "sqrt_positive":
            direct, inverse = bounds[args[0]]
        elif op == "log_positive":
            assert nodes[args[0]][0] == "source_parameter"
            assert nodes[args[0]][1][0] in {"CSelected", "XR", "Lambda"}
            direct = 0, 1
        elif op == "exp":
            d, e = bounds[args[0]][0]
            direct = inverse = d+1, e
        elif op == "inverse":
            inverse, direct = bounds[args[0]]
            assert direct is not None
        else:
            assert op == "integer_power"
            j, k = args
            direct = power(bounds[j][k < 0], abs(k))
            if bounds[j][k >= 0] is not None:
                inverse = power(bounds[j][k >= 0], abs(k))
        bounds[i] = direct, inverse
    assert all(bounds[i][0][0] == 2 and bounds[i][0][1] < 16*DEN for i in roots)
    return {str(i): list(bounds[i][0]) for i in roots}, len(bounds)


def relative_ranks(nodes, roots, atoms, special, anchors, cap):
    ranks = {i: (0, 1) for i in atoms}
    denominator = anchors[0]
    ranks.update({i: (0, denominator) for i in anchors[1]})
    ranks.update({i: (2, denominator) for i in special})
    for i in dependencies(nodes, roots.values(), ranks):
        if i in ranks:
            continue
        op, args = nodes[i]
        values = [ranks[j] for j in children(op, args)]
        assert values and len(values) <= cap
        level, exponent = max(d for d, _ in values), max(e for _, e in values)
        if op == "add":
            ranks[i] = level, exponent+1
        elif op == "multiply":
            ranks[i] = (level, exponent+1) if level else (0, sum(e for _, e in values))
        elif op == "integer_power":
            k = args[1]
            assert k >= 0 and (not level or k <= cap)
            ranks[i] = (0, 0) if k == 0 else (level, exponent+1) if level else (0, exponent*k)
        elif op == "exp":
            ranks[i] = level+1, exponent
        elif op == "log_positive":
            inner_op, inner_args = nodes[args[0]]
            assert inner_op == "maximum" and 1 in inner_args
            ranks[i] = max(0, level-1), exponent
        else:
            assert op in {"maximum", "sqrt_positive"}
            ranks[i] = level, exponent
    assert all(ranks[i][0] == 1 and ranks[i][1] < 3*denominator for i in roots.values())
    return {name: {"root": i, "rank": list(ranks[i])} for name, i in roots.items()}, len(ranks)


def verify_threshold(path):
    trace = read_json(path, THRESHOLD_SHA)["trace"]
    nodes = node_table(trace)
    roots = trace["roots"]
    assert (roots["Bnorm"], roots["E"], roots["ellMinimum"], roots["thresholdCondition_5"]) == (300170, 617292, 617432, 617354)
    assert nodes[300162] == ("rational", [str(2**128), "1"])
    assert nodes[216823] == ("source_parameter", ["C12EnvelopeR"])
    assert nodes[300163] == ("integer_power", [216823, 4096])
    assert nodes[300164] == ("add", [300162, 300163])
    # Positivity of every sibling on each path used for the lower bounds.
    at_least_one = {"CSelected", "XR", "Lambda"}
    positive = SMALL_PROFILE | {"C12EnvelopeR", "directionalMarginKappa", "Tf", "X0I1", "X0I2", "X0Ipos",
                                "Xa", "loopD0", "loopDelta", "loopMuMax", "radialFrequencyN", "sourceEnvelopeS"}
    lower = {}
    for i, (op, args) in nodes.items():
        values = [lower.get(j, -1) for j in args if type(j) is int]
        if op == "rational":
            q = Fraction(*map(int, args))
            lower[i] = int(q >= 1) if q >= 0 else -1
        elif op == "source_parameter":
            lower[i] = 1 if args[0] in at_least_one else 0 if args[0] in positive else -1
        elif op in {"add", "multiply"} and min(values) >= 0:
            lower[i] = max(values) if op == "add" else min(values)
        elif op == "maximum":
            lower[i] = max(values)
        elif op in {"exp", "sqrt_positive"}:
            lower[i] = 0
        elif op == "log_positive":
            lower[i] = 0 if values == [1] else -1
        elif op == "inverse":
            lower[i] = min(0, values[0])
        elif op == "integer_power":
            lower[i] = 0 if args[1] % 2 == 0 else min(0, values[0])
        else:
            lower[i] = -1
    for chain in (
        (300170, 300169, 300168, 215575, 215564, 215511, 215510, 163605, 162478, 161416),
        (300170, 300169, 300168, 300167, 300166, 300165, 300164),
        (215563, 215560, 215535, 1),
    ):
        for i, j in zip(chain, chain[1:]):
            op, args = nodes[i]
            assert j in args and op in {"add", "multiply", "maximum"}
            if op == "add":
                assert all(lower[x] >= 0 for x in args if x != j), i
            if op == "multiply":
                assert all(lower[x] >= 1 for x in args if x != j), i
    assert nodes[161416] == ("maximum", [118573, 117782])
    assert nodes[617292] == ("integer_power", [300170, 256])
    assert nodes[617432] == ("ceiling", [617431]) and 617430 in nodes[617431][1] and 617354 in nodes[617430][1]
    assert nodes[617431][0] == nodes[617430][0] == "maximum"
    shape = {
        300174: ("multiply", [300172, 300173]), 300172: ("add", [474, 3622]),
        300173: ("rational", ["1", str(2**33)]), 3622: ("sqrt_positive", [24]),
        137446: ("rational", [str(2**33), "1"]), 128133: ("rational", ["15", "1"]),
        19: ("rational", ["1", "2"]), 20: ("rational", ["-1", "1"]),
        24: ("rational", ["2", "1"]), 474: ("rational", ["4", "1"]),
        4803: ("rational", ["1", "256"]), 617289: ("source_parameter", ["directionalMarginKappa"]),
        617290: ("inverse", [617289]), 617291: ("multiply", [24, 617290]),
        617294: ("inverse", [216823]), 617295: ("integer_power", [617294, 31]),
        617307: ("multiply", [24, 617292]), 617308: ("add", [617292, 617307]),
        617309: ("multiply", [300174, 617308]), 617310: ("multiply", [20, 617309]),
        617311: ("exp", [617310]), 617312: ("multiply", [19, 617311]),
        617313: ("exp", [617309]), 617314: ("multiply", [24, 617313]),
        617315: ("multiply", [474, 617291]), 617316: ("inverse", [617315]),
        617317: ("multiply", [617295, 617316]),
        617320: ("multiply", [24, 617319]), 617321: ("maximum", [1, 617320]),
        617322: ("integer_power", [617312, 2]), 617323: ("multiply", [128133, 617321]),
        617324: ("inverse", [617323]), 617325: ("multiply", [617322, 617324]),
        617326: ("integer_power", [617314, 2]), 617327: ("multiply", [24, 617317]),
        617328: ("inverse", [617327]), 617329: ("multiply", [617326, 617328]),
        617330: ("inverse", [617325]), 617331: ("multiply", [617329, 617330]),
        617347: ("multiply", [4803, 617289]), 617350: ("inverse", [617347]),
        617352: ("multiply", [617331, 617350]), 617353: ("integer_power", [617352, 2]),
        617354: ("multiply", [137446, 617353]),
    }
    for i, expected in shape.items():
        assert nodes[i] == expected, i
    assert nodes[617319][0] == "multiply" and nodes[nodes[617319][1][0]][0] == "inverse"
    assert nodes[617296] == ("integer_power", [216823, 83])
    assert nodes[617318] == ("multiply", [128133, 617296])
    return {"ellMinimum": 617432, "Bnorm": 300170, "M2Anchors": [117782, 118573],
            "positiveFactorPathChecked": True, "concentrationRoot": 617354}


def tower(endpoint):
    depth = 0
    while set(endpoint) == {"exp"}:
        depth += 1
        endpoint = endpoint["exp"]
    assert set(endpoint) == {"rational"}
    return depth, Fraction(endpoint["rational"])


def verify_imported_integrals(directory, binding):
    stage = read_json(directory/"fourth-archived-selector-stage.json", ORIGINAL_STAGE_SHA)
    final = read_json(directory/"fourth-archived-selector-final.json", ORIGINAL_FINAL_SHA)
    arithmetic = read_json(directory/"historical-scale-arithmetic-input.json", ARITHMETIC_INPUT_SHA)
    assert final["pass"] and final["complete"] and final["exitCode"] == 0
    assert final["selectionTrace"]["sha256"] == THRESHOLD_SHA
    assert final["partialAttachments"]["closed-selector-and-physical-scales"]["sha256"] == ORIGINAL_STAGE_SHA
    assert stage["originalSameProcess"] and stage["finalSourcePassRequired"] and not stage["standaloneCompletionClaim"]
    data = stage["data"]
    assert data["pass"] and data["sourceAuthenticated"] and all(c["pass"] for c in data["checks"])
    diagnostics = data["diagnostics"]
    assert diagnostics["sourceArithmeticEvaluationComplete"] and diagnostics["allArithmeticBoundariesAccountedFor"]
    a13 = diagnostics["originalA13Audit"]
    assert a13["pass"] and a13["representedIntegralBoundsProved"] and all(c["pass"] for c in a13["checks"])
    records = diagnostics["integralBounds"]
    assert [r["root"] for r in records] == [239,257,275]
    assert all(r["strictlyPositiveLower"] and r["finiteUpper"] and r["exactOriginalIntegrandRetained"] for r in records)
    assert arithmetic["archiveNumericalSHA256"] == ORIGINAL_STAGE_SHA
    assert arithmetic["boundaryIntervals"] == {str(r["root"]):r["numericalInterval"] for r in records}
    assert binding["importedA13BoundaryProof"]["authenticatedSameProcessStageSHA256"] == ORIGINAL_STAGE_SHA
    assert binding["importedA13BoundaryProof"]["originalCompleteClosureNodesCompared"] == 77
    return {"sourceAuthenticatedArchiveFinalSHA256":ORIGINAL_FINAL_SHA,
            "sourceAuthenticatedArchiveStageSHA256":ORIGINAL_STAGE_SHA,
            "directedArithmeticInputSHA256":ARITHMETIC_INPUT_SHA,
            "boundaryNodes":[239,257,275],"completeBodyNodesMatchedToN4":77}


def check_program(directory, stem, profile):
    packet_pin, atoms_pin, comparison_pin, old_name, old_pin, special = SPECS[stem]
    packet = read_json(directory/(stem+"-relative-degree.json"), packet_pin)
    atoms = read_json(directory/(stem+"-relative-atoms.json"), atoms_pin)
    comparison = read_json(directory/(stem+"-atoms-directed.json"), comparison_pin)
    original = read_json(directory/old_name, old_pin)
    assert packet["sourceCommit"] == comparison["sourceCommit"] == original["sourceCommit"] == SOURCE
    assert packet["originalDefinitions"] == original["originalDefinitions"] == profile
    assert packet["originalPacketSHA256"] == comparison["originalPacketSHA256"] == old_pin
    assert atoms["relativeDegreePacketSHA256"] == comparison["relativeDegreePacketSHA256"] == packet_pin
    assert comparison["atomicReductionSHA256"] == atoms_pin
    assert comparison["historicalInputSHA256"] == ARITHMETIC_INPUT_SHA
    assert comparison["complete"] and comparison["strictFiniteAtoms"] and not comparison["strictAtomComparison"]
    assert comparison["priorReceiptSHA256"] is None and set(comparison["unseparatedAtomRoots"]) == special.keys()
    assert comparison["testedAtomCount"] == comparison["totalAtomCount"] == len(atoms["nonRationalAtomicRoots"])
    nodes = node_table(packet["trace"])
    assert all(nodes[i] == record for i, record in node_table(original["trace"]).items())
    special_rows = []
    for i, (a, k) in special.items():
        op, [argument] = nodes[i]
        assert op == "exp"
        op, [denominator, numerator] = nodes[argument]
        assert op == "multiply" and nodes[denominator] == ("inverse", [6259])
        assert nodes[6259] == ("source_parameter", ["radialFrequencyN"])
        op, [j, power] = nodes[numerator]
        assert op == "multiply" and j == a
        op, [base, exponent] = nodes[power]
        assert op == "integer_power" and exponent == k and k <= 72
        assert nodes[base] == ("add", [1, 6259])
        special_rows.append({"atom": i, "A": a, "k": k})
    A_ranks, A_count = frequency_operand_ranks(nodes, [x[0] for x in special.values()])
    assert packet["degreeProof"]["anchorIds"] == [117782, 118573]
    assert packet["degreeProof"]["thresholdSourceLower"]["archivedTraceSHA256"] == THRESHOLD_SHA
    denominator = int(atoms["anchorExponentDenominator"])
    assert denominator == 16384*int(atoms["maximumPolynomialDegree"])
    cap = max(atoms["finiteFanInCap"], Fraction(atoms["largestRationalAtom"]))
    assert Fraction(comparison["cap"]["rational"]) == cap
    low_depth, low_arg = tower(comparison["anchor"]["lower"])
    assert low_depth == 5 and low_arg > 1_000_000 and cap < 2**1000000
    largest = comparison["largestAbsoluteAtomUpper"]
    assert {r["id"] for r in largest[:len(special)]} == special.keys()
    for item in largest[len(special):]:
        upper_depth, upper_arg = tower(item["upper"])
        assert upper_depth < low_depth and upper_arg < 2_000_000
        assert 1 + low_arg + low_arg**2/2 > 2_000_000
    all_atoms = set()
    visited, todo = set(), list(packet["degreeProof"]["cutRoots"])
    while todo:
        i = todo.pop()
        if i in visited:
            continue
        visited.add(i)
        op, args = nodes[i]
        if op in POLYNOMIAL:
            todo.extend(args)
        elif op == "integer_power" and args[1] >= 0:
            todo.append(args[0])
        else:
            all_atoms.add(i)
    assert sorted(i for i in all_atoms if nodes[i][0] != "rational") == atoms["nonRationalAtomicRoots"]
    roots = original["trace"]["roots"]
    assert roots == {k: r["root"] for k, r in packet["degreeProof"]["originalTargets"].items()}
    final, count = relative_ranks(nodes, roots, all_atoms, special, (denominator, (117782,118573)), cap)
    return {"targets": final, "BnormExponentDenominator": str(denominator), "relativeNodes": count,
            "AExactRanks": A_ranks, "AReachableNodes": A_count, "AExponentDenominator": DEN,
            "specialAtoms": special_rows, "allOtherNonRationalAtoms": comparison["totalAtomCount"]-len(special),
            "inputSHA256": [packet_pin, atoms_pin, comparison_pin, old_pin]}


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("inputs", "profile", "binding", "earlier", "out"):
        parser.add_argument("--"+name, type=Path, required=True)
    args = parser.parse_args()
    sys.set_int_max_str_digits(0)
    prefix = b"export const PINNED_N3 = "
    line, = [x for x in read(args.profile, PROFILE_SHA).splitlines() if x.startswith(prefix)]
    assert line.endswith(b";")
    profile = json.loads(line[len(prefix):-1])["parametersExactExpressions"]
    assert profile["sourceEnvelopeS"] == {"power": [{"ref":"CSelected"}, 100000]}
    assert profile["C12EnvelopeR"] == {"exp": {"power": [{"ref":"sourceEnvelopeS"}, 256]}}
    assert profile["radialFrequencyN"] == {"sum":[{"integer":1},{"ceil":{"power":[{"ref":"C12EnvelopeR"},50]}}]}
    assert profile["directionalMarginKappa"] == {"power":[{"ref":"C12EnvelopeR"},-10]}
    binding = read_json(args.binding, BINDING_SHA)
    earlier = read_json(args.earlier, EARLIER_SHA)
    assert binding["sourceCommit"] == earlier["sourceCommit"] == SOURCE
    assert earlier["exactRatios"] == {"b1*qBig":1, "b2*qBig":16, "b3*qBig":32}
    threshold = verify_threshold(args.inputs/"fourth-threshold-source.json")
    integral_provenance = verify_imported_integrals(args.inputs, binding)
    assert binding["threshold"]["archival"] == threshold["ellMinimum"]
    proofs = {name: check_program(args.inputs, name, profile) for name in SPECS}
    assert {x["upperRequiredLog"] for x in binding["diagonalAndLower"]} == {
        x["root"] for x in proofs["fourth-ftc"]["targets"].values()
    }
    assert proofs["historical-c4"]["targets"]["historicalLogC4"]["root"] == binding["historical"]["independent"]
    result = {"schema":"MathScope.N7.OriginalFourthScaleExactMaximum/1","sourceCommit":SOURCE,
              "originalBindingSHA256":BINDING_SHA,"earlierScalesSHA256":EARLIER_SHA,
              "thresholdTraceSHA256":THRESHOLD_SHA,"threshold":threshold,"comparisons":proofs,
              "importedOriginalIntegralBounds":integral_provenance,
              "winningOperand":"log b3 + log 2","exactRatios":{**earlier["exactRatios"],"b4*qBig":64},
              "physicalFourthCutoffJets":"ZERO on q>=qBig/64, including the flat endpoint",
              "frozenFourthCutoff":"At the one possible original representative cell, the exact modular phase remains OPEN.",
              "M3":"62/64","finalJets":0,"release":"HOLD"}
    raw = (json.dumps(result, indent=2)+"\n").encode()
    args.out.write_bytes(raw)
    print("PASS actual b4*qBig=64, historical c4 and all 25 original clauses", sha256(raw).hexdigest())


if __name__ == "__main__":
    main()
