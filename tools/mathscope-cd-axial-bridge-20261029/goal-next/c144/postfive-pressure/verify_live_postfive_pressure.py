"""Verify the old original physical PostFive pressure and its exact radial derivative."""
import argparse
from collections import defaultdict
from fractions import Fraction
import gzip
from hashlib import sha256
import json
from pathlib import Path


STREAM = "7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2"
REGISTRY = "62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce"
COUNT = 22380596
RUNTIME = {
    "source-updated-mean-pressure.mjs": "6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07",
    "source-pressure.mjs": "fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f",
    "source-full-mean-equations.mjs": "2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76",
}
ELL, R, Z, T = 17732737, 17732748, 17732749, 17732750
Y1, Y2 = 17745430, 17745431
LOWER, UPPER = 17743711, 17743713
RHO, CHI, A = 17743727, 17743734, 17745446
GR, P = 22152220, 22152227
IR, IW, IRL, IWL, IRZ, IWZ = 22152412, 22152413, 22152457, 22152458, 22152563, 22152564
DP, A0 = 22152582, 22152570
ATOMS = {GR, 22152356, A0, A, CHI, IRL, IWL}
KNOWN = {
    20: ("rational", ["-1", "1"]),
    17743725: ("definite_integral", [17743724, 17743710, LOWER, UPPER]),
    17743726: ("inverse", [17743725]),
    RHO: ("multiply", [17743709, 17743726]),
    CHI: ("source_step_derivative", [17743701, 0]),
    GR: ("m3_coupled_expression_partial", ["coupled-expression:1338", [ELL,R,Z,T,Y1,Y2], [0]*6]),
    22152221: ("definite_integral", [GR, Y1, 0, 1]),
    22152222: ("definite_integral", [22152221, Y2, 0, 1]),
    22152225: ("m3_coupled_expression_partial", ["coupled-expression:1339", [ELL,22152224,Z,T], [0]*4]),
    22152226: ("definite_integral", [22152225, 22152224, LOWER, UPPER]),
    P: ("m3_coupled_expression_partial", ["coupled-expression:1340", [ELL,Z,T], [0]*3]),
    22152356: ("multiply", [RHO,P]),
    22152357: ("multiply", [20,22152356]),
    22152358: ("add", [GR,22152357]),
    22152365: ("add", [17753501,22152364]),
    22152366: ("add", [Y1,22152365]),
    22152367: ("multiply", [17733068,22152365]),
    22152368: ("add", [Y2,22152367]),
    22152403: ("multiply", [17743726,22152402]),
    22152404: ("multiply", [P,22152403]),
    22152405: ("multiply", [20,22152404]),
    22152410: ("m3_coupled_expression_partial", ["coupled-expression:1338",
                                                [ELL,22152359,Z,T,22152366,22152368], [0]*6]),
    22152411: ("add", [22152405,22152410]),
    22152567: ("multiply", [CHI,IW]),
    22152568: ("multiply", [20,22152567]),
    22152569: ("add", [IR,22152568]),
    A0: ("multiply", [17743762,IW]),
    22153225: ("multiply", [20,22031621]),
    22153226: ("add", [22152569,22153225]),
    22153227: ("add", [22031665,22153226]),
    22155587: ("add", [17732937,22152569]),
}
for left, whole, body, binder in (
    (IR,IW,22152411,22152359), (IRL,IWL,22152456,22152420), (IRZ,IWZ,22152562,22152470),
):
    KNOWN[left] = ("definite_integral", [body,binder,LOWER,R])
    KNOWN[whole] = ("definite_integral", [body,binder,LOWER,UPPER])


def pinned(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return data


def readback(path, needed):
    digest = sha256()
    records = {}
    with gzip.open(path, "rb") as data:
        header = data.readline()
        assert json.loads(header)["node_count"] == COUNT
        digest.update(header)
        for i, line in enumerate(data):
            digest.update(line)
            if i in needed:
                records[i] = json.loads(line)
    assert digest.hexdigest() == STREAM and i + 1 == COUNT
    assert set(records) == needed
    return records


def polynomial(nodes, root):
    if root in ATOMS:
        return {(root,): Fraction(1)}
    node = nodes[root]
    op, args = node["op"], node["args"]
    if op == "rational":
        return {(): Fraction(*map(int,args))}
    assert op in {"add","multiply"}, (root,node)
    left, right = map(lambda i: polynomial(nodes,i),args)
    out = defaultdict(Fraction)
    if op == "add":
        for key, val in [*left.items(), *right.items()]:
            out[key] += val
    else:
        for x, a in left.items():
            for y, b in right.items():
                out[tuple(sorted((*x,*y)))] += a*b
    return {key: val for key, val in out.items() if val}


def verify(artifact, runtime):
    for file, digest in RUNTIME.items():
        pinned(runtime / file, digest)
    registry = json.loads(pinned(artifact / "original-source-functions.json", REGISTRY))
    expr = json.loads(registry["definitions"])[0]
    short = [ELL,R,Z,T]
    for i, body, coordinates, name in (
        (1338,22152063,[*short,Y1,Y2],"PostSignedAfterFiveMomentsFreshPAndJ_complete_gr"),
        (1339,22152222,short,"PostSignedAfterFiveMomentsFreshPAndJ_haar_gr"),
        (1340,22152226,[ELL,Z,T],"PostSignedAfterFiveMomentsFreshPAndJ_P"),
        (1358,22155587,[R,Z,T,ELL,Y1,Y2],"PostFiveRepeatMeanPressure"),
    ):
        item = expr[i]
        assert (item["id"],item["body"],item["parameters"],item["name"]) == (f"coupled-expression:{i}",body,coordinates,name)
    nodes = readback(artifact / "original-source-nodes.jsonl.gz",
                     set(KNOWN) | set(range(22152571,DP+1)) | {17754219})
    for node, (op,args) in KNOWN.items():
        assert nodes[node] == {"op":op,"args":args}, (node,nodes[node])
    expected = {(GR,): Fraction(1), (22152356,): Fraction(-1), (A0,): Fraction(-1)}
    assert polynomial(nodes, DP) == expected
    mutated = dict(nodes)
    mutated[22152573] = {"op":"rational","args":["0","1"]}
    # Exercise the incorrect formula with only the cutoff derivative deleted.
    assert polynomial(mutated, DP) == {key: value for key, value in expected.items() if key != (A0,)}
    return {
        "oldCompletePressureRoot":22153227, "oldRefreshedMeanPressureRoot":22152569,
        "templateRepeatMeanPressureRoot":22155587,
        "nativeDensity":22152358, "nativeHaarMean":22152222, "nativeRadialMeanMoment":P,
        "fixedRadialEnvelope":[LOWER,UPPER], "cutoff":CHI, "normalizingRho":RHO,
        "actualPairs":{"main":[IR,IW],"auxiliaryDerivative":[IRL,IWL],"slowZDerivative":[IRZ,IWZ]},
        "radialDirectionDerivative":DP, "cutoffDerivativeRemainder":A0,
        "exactLaurentCancellation":{str(atom[0]):str(value) for atom,value in expected.items()},
        "dropChiDerivativeDistinct":True, "originalSourceRecords":COUNT, "originalSourceSHA256":STREAM,
        "originalRegistrySHA256":REGISTRY, "sourceFileSHA256":RUNTIME,
        "repeatUpdatedMeanPressureIndependentlyAvailable":False, "release":"HOLD",
    }


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    for name in ("artifact","runtime","output"):
        cli.add_argument(name,type=Path)
    options = cli.parse_args()
    result = verify(options.artifact,options.runtime)
    options.output.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n",encoding="utf-8",newline="\n")
