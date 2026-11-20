"""Bind original eta=-1 owner operands and enclose their Phi descendants."""

import argparse
from collections import Counter
from fractions import Fraction as F
from hashlib import sha256
import json
from math import factorial
from pathlib import Path
import runpy


PINS = {
    "expanded": "797b0331d34b8e1011c7e5c0e993e3cd2e0fdc864b410085c69c126e14b971b7",
    "registry": "62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce",
    "checker": "c7bf1a01906fe52a40914f464f7c939badb23cb6463a96f59ffb078e53a773dd",
    "natural": "510b458365617bf881ae80cf9a0eafe097261777dbf301014adf00a1db508c43",
}


def pinned(path, name):
    content = path.read_bytes()
    assert sha256(content).hexdigest() == PINS[name], name
    return content


def source_boundary_calls(paths):
    graph = json.loads(pinned(paths.expanded, "expanded"))
    registry = json.loads(pinned(paths.registry, "registry"))["base"]["base"]
    pinned(paths.checker, "checker")
    children = runpy.run_path(str(paths.checker))["children"]
    natural = json.loads(pinned(paths.natural, "natural"))

    nodes, bodies = dict(graph["nodes"]), dict(graph["sourceBodies"])
    expressions = json.loads(registry["expression"])
    monotones = json.loads(registry["monotone"])
    calls = graph["calls"]
    assert len(calls) == 567
    assert [r["id"] for r in calls] == [r["id"] for r in natural["calls"]]
    assert nodes[2] == {"op": "coordinate", "args": ["eta"]}
    assert nodes[20] == {"op": "rational", "args": ["-1", "1"]}
    assert nodes[474] == {"op": "rational", "args": ["4", "1"]}
    assert all(row["eta"] == 2 for row in calls)
    rank = {r["id"]:j for j,r in enumerate(calls)}
    ordinary, unguarded = {}, {}
    for i, node in sorted(nodes.items()):
        mask = 1 << rank[i] if i in rank else 0
        clean = mask
        operands = children(node)
        for j in operands:
            assert j < i
            mask |= ordinary.get(j,0)
        if node["op"] == "smooth_piecewise":
            operands = operands[:3]
        if node["op"] == "definite_integral":
            assert node["args"][1] != 2
            operands = operands[1:]
        for j in operands:
            clean |= unguarded.get(j,0)
        if mask:
            ordinary[i] = mask
        if clean:
            unguarded[i] = clean

    def from_mask(mask):
        return [r for j,r in enumerate(calls) if mask & (1<<j)]

    inputs = Counter()
    boundaries = []
    bound_mask = 0
    clean_mask = 0
    for i, node in nodes.items():
        args = node["args"]
        if node["op"] == "actual_expression_partial":
            definition, values, derivatives = expressions[args[0]], args[1], args[2]
        elif node["op"] == "actual_monotone_root":
            definition, values, derivatives = monotones[args[0]], args[1:], None
        else:
            continue
        parameters = definition["parameters"]
        if 2 not in parameters:
            continue
        value = values[parameters.index(2)]
        inputs[(node["op"],nodes[value]["op"],value if nodes[value]["op"]=="rational" else None)] += 1
        if derivatives is None or value != 20 or any(derivatives):
            continue
        body = definition["body"]
        assert bodies[i] == [body]
        scope = ordinary.get(body,0)
        if scope:
            bound_mask |= scope
            clean_mask |= unguarded.get(body,0)
            boundaries.append({"application":i,"owner":definition["name"],"body":body,
                               "xActual":values[parameters.index(4756)],
                               "etaActual":value,"naturalDescendantIds":[r["id"] for r in from_mask(scope)]})

    expected = {
        ("actual_expression_partial","coordinate",None):4870,
        ("actual_expression_partial","rational",20):3305,
        ("actual_expression_partial","multiply",None):32,
        ("actual_monotone_root","coordinate",None):12,
    }
    assert inputs == expected
    assert len(boundaries)==38 and clean_mask==0
    by_id = from_mask(bound_mask)
    assert len(by_id)==490
    assert len([r for r in by_id if r["y"]==474])==15
    phi = [r for r in by_id if r["component"]=="Phi"]
    positive = [r["id"] for r in phi if r["m"]>0]
    assert len(phi)==243 and len(positive)==179
    assert [r["id"] for r in phi if r["y"]==474 and r["m"]==0] == [4468]
    assert {r["radius"] for r in natural["calls"] if r["id"] in positive} <= {
        f"2^-{260*(53-m)-12}" for m in range(1,6)
    }
    return inputs,boundaries,phi,positive


def enclosure_constants(phi):
    # Source polynomial on the complex eta disk, with h,j0 < 1/1000.
    radius = F(1,128)
    zmax = 1+radius
    assert F(9,2)+12*zmax*zmax+2*F(1,1000)*zmax < 20
    assert F(499,1000)-20*radius>F(1,3)
    assert F(1,9)-F(1,1000)**2>F(1,10)
    assert 10*F(1,1000)**2<1
    assert F(3**5,2)<122
    assert 5*122*10<2**13
    assert all(factorial(r["k"])*factorial(r["m"])*F(10,9)**r["k"]*128**r["m"]<2**46 for r in phi)
    eta_comparison_bits=8*16004-13-46
    assert eta_comparison_bits==127973
    assert F(1,2**eta_comparison_bits)+F(1,2**12468)<F(1,2**12460)

    # A dyadic enclosure at the exact original Y literal, with eta=-1.
    n=0
    term=partial=F(1)
    while True:
        next_term=-2*term/((n+1)*(n+2))
        assert abs(next_term)<=abs(term)
        if abs(next_term)<F(1,2**264):
            break
        n+=1
        term=next_term
        partial+=term
    pad=F(1,2**264)
    assert n<64 and F(1,2**12460)<pad
    grid=2**260
    low=((min(partial,partial+next_term)-pad)*grid).__floor__()
    high=((max(partial,partial+next_term)+pad)*grid).__ceil__()
    assert high-low==1
    return {"call":4468,"Y":4,"eta":-1,"comparison":"f0(4)","seriesDegree":n,
            "endpointNumerators":[str(low),str(high)],"denominator":"2^260"}


def run(paths):
    inputs,boundaries,phi,positive=source_boundary_calls(paths)
    literal=enclosure_constants(phi)
    return {
        "schema":"MathScope.C143.OriginalEtaBoundaryNaturalEnclosure/1",
        "status":"ORIGINAL_LITERAL_ETA_BOUNDARY_AND_CONDITIONAL_PHI_ENCLOSURES",
        "pins":PINS,
        "exactSourceEtaOperandTypes":[[list(key),val] for key,val in sorted(inputs.items())],
        "originalEtaZeroLiteralBindings":0,
        "zeroOrderBoundaryApplications":boundaries,
        "lexicalNaturalDescendantCount":490,
        "unguardedNaturalDescendantCount":0,
        "conditionalPhi":{
            "positiveEtaOrderIds":positive,
            "positiveEtaOrderCount":179,
            "uniformRawRadiusCenteredAtZero":"2^-12460",
            "zeroEtaOrderCenter":"d_Y^k f0(Y), radius 2^-12460",
            "literalY4":literal,
        },
        "premises":[
            "Only the original executed branches of the zero-order owner bodies and their actual integral domains",
            "C139 defined native chart conditions and 0<=Y<=41/10; original same-datum B_rho comparison",
        ],
        "originalNumericalAcceptanceIncrement":0,
        "finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    for name in (*PINS,"output"):
        parser.add_argument(name,type=Path)
    args=parser.parse_args()
    result=run(args)
    args.output.write_bytes((json.dumps(result,indent=2,sort_keys=True)+"\n").encode())
