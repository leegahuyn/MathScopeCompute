"""Independent readback of the original GitHub N=2 stage and optional full graph."""
import argparse
from array import array
from collections import Counter
from contextlib import contextmanager
from functools import lru_cache
import gzip
import hashlib
import json
from pathlib import Path
import re
from tempfile import TemporaryFile


SOURCE = "f8cb4034e86d7b669d52a6f2248aebba156b51b5"
PR30 = "a9b3a5b317525f6d0a71e2e356b054c9d25d2e60"
PROFILE = "e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152"
AXIAL_PREFIX = "d125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116"
SHA = re.compile(r"[0-9a-f]{64}")
COMMIT = re.compile(r"[0-9a-f]{40}")
COMMON = {"velocity-potential-physical", "pressure-stress-physical", "normalized-pressure"}
WEIGHTED_ONE = {"first-stress-direct-zeta-with-endpoint-pole"}
WEIGHTED_HIGHER = {"higher-stress-quotient-by-zeta", "higher-stress-direct-zeta"}
STAGES = ["sealed-original-band-N2", "sealed-original-representative-N2",
          "sealed-original-current-N2", "sealed-original-pressure-N2"]
ROOT_NAMES = ["pressure", "radialPressureGradient", "axialPressureGradient",
              "radialResidual", "angularResidual", "axialResidual", "axialStress",
              "referenceTime", "omittedScaleTimesTime"]


def as_node(value, count=None):
    assert type(value) is int and value >= 0
    assert count is None or value < count, (value,count)
    return value


def sha_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while block := stream.read(1024*1024):
            digest.update(block)
    return digest.hexdigest()


def check_stage(receipt, expected_commit=None):
    assert receipt["schema"] == "MathScope.M3.OriginalAxialN2CurrentPressurePrefix/1"
    assert receipt["sourceCommit"] == SOURCE
    assert COMMIT.fullmatch(receipt["executingCommit"])
    assert expected_commit is None or receipt["executingCommit"] == expected_commit
    assert receipt["requestedPrefix"] == 2 and receipt["finalJets"] == 0
    assert receipt["release"] == "HOLD"
    milestones = receipt["stages"]
    stages = [row["name"] for row in milestones]
    assert stages == STAGES[:len(stages)]
    if not stages or "selector" not in receipt:
        raise ValueError("The GitHub stage has not emitted its sealed N=2 band selector yet.")
    previous_count = 0
    previous_time = 0
    for milestone in milestones:
        assert type(milestone["nodes"]) is int and milestone["nodes"] >= previous_count
        assert type(milestone["milliseconds"]) is int and milestone["milliseconds"] >= previous_time
        previous_count,previous_time = milestone["nodes"],milestone["milliseconds"]
    band_count = milestones[0]["nodes"]
    selector = receipt["selector"]
    rows = selector["rows"]
    historical = selector["historicalRows"]
    assert len(rows) == len(historical) == selector["originalPrefix"] == 3
    assert selector["sourceFamilySHA256"] == PROFILE
    as_node(selector["commonEll0"],band_count)

    for j,(row,old) in enumerate(zip(rows,historical)):
        n = j+1
        assert row["order"] == old["order"] == n
        assert row["previousLogScale"] == (0 if j == 0 else rows[j-1]["logScale"])
        assert (row["historicalScale"],row["historicalLogScale"]) == (old["scale"],old["logScale"])
        assert row["sourceCoefficientRoots"] == old["sourceCoefficientRoots"]
        for name in ("historicalScale","historicalLogScale","growth","smallBand","logScale","scale"):
            as_node(row[name],band_count)
        wanted = COMMON | (WEIGHTED_ONE if n == 1 else WEIGHTED_HIGHER)
        pairs = [(r["derivativeOrder"],r["kind"]) for r in row["constraints"]]
        assert len(pairs) == len(set(pairs))
        assert set(pairs) == {(m,kind) for m in range(n+1) for kind in wanted}
        for clause in row["constraints"]:
            as_node(clause["bound"],band_count)
            as_node(clause["requiredLog"],band_count)

    window = selector["window"]
    assert window["schema"] == "MathScope.N6.OriginalBandWindow/1"
    assert window["coefficientOrder"] == 2 and window["exactTail"]["firstOmitted"] == 3
    assert window["nextSourceScale"] == rows[2]["scale"]
    assert window["nextSourceLogScale"] == rows[2]["logScale"]
    assert window["coefficientRows"] == rows[:2]
    assert window["domain"]["bounds"] == [window["lower"],window["upper"]]
    assert window["domain"]["qOverQ"] == ["1/2","2"]
    for name in ("lower","upper","ell","Q"):
        as_node(window[name],band_count)
    active = selector["activeBackgroundRows"]
    assert len(active) == 2
    for j,row in enumerate(active):
        assert row["order"] == j+1
        assert row["scale"] == rows[j]["scale"] and row["logScale"] == rows[j]["logScale"]
        assert row["sourceSelectorRow"] == j
        assert row["chi"] == row["reducedChi"] and row["extra"] == row["reducedExtra"]
        as_node(row["sourceRoots"]["Tz"],band_count)

    checks = {r["id"]:r["pass"] for r in selector["sourceBandChecks"]}
    assert len(checks) == len(selector["sourceBandChecks"])
    assert all(value is True for value in checks.values())
    assert {"genuine-common-source-family","source-coefficient-window-is-complete",
            "original-cutoff-closed-flat-zero-boundary",
            "actual-positive-coefficients-and-pressure-retained",
            "source-prefix-and-original-function-definitions-preserved"} <= checks.keys()
    chart = selector["exactInteriorChartPoint"]
    assert chart["eta"] == 0
    for name in ("lowerLabel","Q","relative","s","q"):
        as_node(chart[name])

    if "scope" in receipt:
        assert stages == STAGES
        scope = receipt["scope"]
        assert scope["commonSelectorThroughThree"] and scope["originalN2PressureAndCurrentPrivateSeals"]
        assert scope["completeAllCycleFinalField"] is False
        assert scope["fullPhysicalRootDomainsIndependentlyAudited"] is False
        domain = scope["exactPrefixDomain"]
        assert domain["prefixOrder"] == 2 and domain["nextScale"] == rows[2]["scale"]
        assert domain["prefixSharedByAllCoverLabels"] and domain["prefixSharedByWholeRadialIntegral"]
        assert domain["conditions"] == ["0<q<qGlobalStar","b_(N+1)*q>=1"]
        named = scope["roots"]
        assert list(named) == ROOT_NAMES
        assert named["referenceTime"] == domain["q"]
        assert named["omittedScaleTimesTime"] == domain["nextScaleTimesQ"]
        for value in named.values():
            as_node(value,milestones[-1]["nodes"])
    if "snapshot" in receipt:
        assert receipt["currentStage"] == "COMPLETE" and "scope" in receipt
        snapshot = receipt["snapshot"]
        assert snapshot["scope"] == "ORIGINAL_N2_CURRENT_PRESSURE_PREFIX"
        assert snapshot["executing_commit"] == receipt["executingCommit"]
        assert snapshot["original_pr30_commit"] == PR30
        assert snapshot["node_count"] == milestones[-1]["nodes"]
        assert snapshot["original_root_ids"] == list(dict.fromkeys(receipt["scope"]["roots"].values()))
        assert snapshot["final_all_cycle_A_b_p"] is False
        assert snapshot["exact_source_node_stream_preserved"] is True
        assert snapshot["actual_final_67_jets_certified"] == 0 and snapshot["release"] == "HOLD"
        assert SHA.fullmatch(snapshot["node_stream_sha256"]) and SHA.fullmatch(snapshot["definitions_sha256"])
    return selector


@contextmanager
def full_graph_nodes(directory, receipt):
    # One authenticated gzip pass. Keep a disk-backed node stream and 8 bytes
    # per offset, parsing only requested anchors after SHA/count verification.
    manifest_path = directory/"original-source-export-manifest.json"
    manifest = json.loads(manifest_path.read_bytes())
    assert receipt.get("snapshot") == manifest
    registry_path = directory/"original-source-functions.json"
    assert sha_file(registry_path) == manifest["definitions_sha256"]
    offsets = array("Q")
    digest = hashlib.sha256()
    prefix = hashlib.sha256(b"[")
    histogram = Counter()
    total = 0
    with TemporaryFile(mode="w+b") as spool:
        with gzip.open(directory/"original-source-nodes.jsonl.gz","rb") as stream:
            header = stream.readline()
            assert json.loads(header) == {"schema":"MathScope.M3.FullNodesJSONL/1",
                                          "node_count":manifest["node_count"]}
            digest.update(header)
            total += len(header)
            for i,line in enumerate(stream):
                assert line.endswith(b"\n")
                offsets.append(spool.tell())
                spool.write(line)
                digest.update(line)
                total += len(line)
                if i < 117100:
                    if i:
                        prefix.update(b",")
                    prefix.update(line[:-1])
                op_end = line.find(b'"',7)
                assert line[:7] == b'{"op":"' and op_end > 7
                histogram[line[7:op_end].decode("ascii")] += 1
        prefix.update(b"]")
        assert prefix.hexdigest() == AXIAL_PREFIX
        assert len(offsets) == manifest["node_count"]
        assert total == manifest["node_stream_uncompressed_bytes"]
        assert digest.hexdigest() == manifest["node_stream_sha256"]
        assert dict(histogram) == manifest["operation_histogram"]

        @lru_cache(maxsize=2048)
        def lookup(i):
            spool.seek(offsets[as_node(i,len(offsets))])
            return json.loads(spool.readline())

        yield lookup, {"graphNodeCount":len(offsets),"graphNodeSha256":digest.hexdigest(),
                       "registrySha256":manifest["definitions_sha256"],
                       "first117100NodeSha256":prefix.hexdigest(),
                       "graphManifestSha256":sha_file(manifest_path)}


def check_anchors(receipt, selector, lookup):
    used = set()
    def node(i):
        i = as_node(i)
        used.add(i)
        return lookup(i)
    def exact(i, op, args):
        assert node(i) == {"op":op,"args":args}, (i,op,args)
    def operation(i, op):
        record = node(i)
        assert record["op"] == op,(i,op,record)
        return record["args"]
    def rational(i,n,d=1):
        return node(i) == {"op":"rational","args":[str(n),str(d)]}
    def split(i,op,test):
        a,b = operation(i,op)
        if test(a):
            return b
        assert test(b),(i,op,a,b)
        return a
    def remove_int(i,op,n,d=1):
        return split(i,op,lambda j:rational(j,n,d))
    def remove_node(i,op,known):
        return split(i,op,lambda j:j==known)
    def negated(i):
        return remove_int(i,"multiply",-1)
    def log_int(i,n):
        [arg] = operation(i,"log_positive")
        assert rational(arg,n)
    def divide(i,numerator,denominator):
        other = remove_node(i,"multiply",numerator)
        exact(other,"inverse",[denominator])
    def floor_log(i,log2,logscale):
        ceiling = negated(i)
        [negative] = operation(ceiling,"ceiling")
        divide(negated(negative),logscale,log2)

    rows = selector["rows"]
    log2 = rows[0]["growth"]
    ell0 = selector["commonEll0"]
    ell_minimum = remove_int(ell0,"add",6)
    exact(0,"rational",["0","1"])
    for j,row in enumerate(rows):
        n = j+1
        assert operation(row["logScale"],"maximum") == [
            row["historicalLogScale"],row["growth"],row["smallBand"],
            *[r["requiredLog"] for r in row["constraints"]]]
        exact(row["historicalScale"],"exp",[row["historicalLogScale"]])
        exact(row["scale"],"exp",[row["logScale"]])
        if n == 1:
            log_int(log2,2)
            assert remove_int(remove_node(row["smallBand"],"multiply",log2),"add",10) == ell_minimum
        else:
            assert row["smallBand"] == 0
            log_int(remove_node(row["growth"],"add",rows[j-1]["logScale"]),16 if n == 2 else 2)
        for clause in row["constraints"]:
            num,inv = operation(clause["requiredLog"],"multiply")
            if node(inv)["op"] != "inverse":
                num,inv = inv,num
            [den] = operation(inv,"inverse")
            [h] = [den if n == 1 else remove_int(den,"multiply",n)]
            exact(h,"source_parameter",["h"])
            a,b = operation(num,"add")
            bound = clause["bound"]
            if node(a) != {"op":"log_positive","args":[bound]}:
                a,b = b,a
            exact(a,"log_positive",[bound])
            assert (b if n == 1 else remove_int(b,"multiply",n)) == log2
            assert any(rational(i,1) for i in operation(bound,"maximum")), (bound,clause["kind"])

    window = selector["window"]
    a,b = operation(window["lower"],"maximum")
    assert a == ell0
    floor_log(b,log2,rows[1]["logScale"])
    floor_log(remove_int(window["upper"],"add",-1),log2,rows[2]["logScale"])
    [scale_exponent] = operation(window["Q"],"exp")
    assert remove_node(negated(scale_exponent),"multiply",log2) == window["ell"]
    assert node(window["ell"])["op"] == "coordinate"

    point = selector["exactInteriorChartPoint"]
    assert point["lowerLabel"] == b
    [x] = operation(point["Q"],"exp")
    ell_log2 = negated(x)
    assert remove_node(ell_log2,"multiply",log2) == b
    [x] = operation(point["relative"],"exp")
    assert negated(remove_node(x,"add",ell_log2)) == rows[1]["logScale"]
    assert remove_int(remove_int(point["s"],"multiply",1,2),"add",1,2) == point["relative"]
    assert remove_node(point["q"],"multiply",point["Q"]) == point["s"]

    q0 = None
    for j,row in enumerate(selector["activeBackgroundRows"]):
        sigma = row["sigma"]
        q1 = remove_node(sigma,"multiply",rows[j]["scale"])
        assert q0 is None or q0 == q1
        q0 = q1
        assert node(q0)["op"] == "coordinate"
        sys,actuals,orders = operation(row["chi"],"actual_expression_partial")
        assert actuals == [sigma] and orders == [0]
        extra = remove_node(row["extra"],"multiply",sigma)
        exact(extra,"actual_expression_partial",[sys,[sigma],[1]])
        x,left,right,before,_,after = operation(row["sourceRoots"]["Tz"],"smooth_piecewise")
        assert (x,left,right,before,after) == (4756,28814,28824,0,0)

    if "scope" in receipt:
        domain = receipt["scope"]["exactPrefixDomain"]
        assert remove_node(domain["nextScaleTimesQ"],"multiply",rows[2]["scale"]) == domain["q"]
    return {"typedAnchorNodesChecked":len(used),"originalScaleAndWindowAST":True,
            "interiorChartPointAST":True,"activeAxialStressAndTimeCutoffAST":True}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("stage",type=Path)
    ap.add_argument("output",type=Path)
    group = ap.add_mutually_exclusive_group()
    group.add_argument("--graph-dir",type=Path,help="Original completed gzip graph and registry directory")
    group.add_argument("--anchors",type=Path,help="Optional JSON mapping node-ID strings to exact nodes")
    ap.add_argument("--executing-commit",help="Pin the GitHub workflow HEAD SHA")
    args = ap.parse_args()
    if not __debug__:
        raise RuntimeError("This exact checker uses assertions.")
    raw = args.stage.read_bytes()
    receipt = json.loads(raw)
    selector = check_stage(receipt,args.executing_commit)
    graph = None
    anchors = None
    if args.graph_dir:
        with full_graph_nodes(args.graph_dir,receipt) as (lookup,graph):
            anchors = check_anchors(receipt,selector,lookup)
    elif args.anchors:
        data = args.anchors.read_bytes()
        nodes = json.loads(data)
        anchors = check_anchors(receipt,selector,lambda i:nodes[str(i)])
        anchors["inputSha256"] = hashlib.sha256(data).hexdigest()
    result = {
        "schema":"MathScope.OriginalN2SelectorStageReadback/1",
        "stageSha256":hashlib.sha256(raw).hexdigest(),
        "originalSourceCommit":receipt["sourceCommit"],"executingCommit":receipt["executingCommit"],
        "completedStages":receipt["stages"],"currentStage":receipt["currentStage"],
        "laterStageError":receipt.get("error"),"originalN2Window":selector["window"],
        "originalSelectorOrder3":selector["rows"][2],
        "exactInteriorChartPoint":selector["exactInteriorChartPoint"],
        "graphAuthentication":graph,"literalAnchorChecks":anchors,
        "fullPhysicalNativeDomainClosureAudited":False,
        "checkScope":"Original GitHub stage readback; with a full graph, authenticate its entire stream and exact selected AST anchors. Root semantic-closure and numerical-field certification remain separate.",
    }
    args.output.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print("PASS: original N=2 stage metadata and all 20 b3 selector clauses."
          + (" Full graph and literal AST anchors also passed." if graph else
             " Literal AST anchors also passed." if anchors else ""))


if __name__ == "__main__":
    main()

