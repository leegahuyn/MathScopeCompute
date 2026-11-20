"""Independently read an optional native Repeat indexed registration."""

import argparse
from hashlib import sha256
import json
from pathlib import Path


def load(path):
    return json.loads(path.read_bytes())


def fingerprint(raw):
    return sha256(raw).hexdigest()


def row_map(row):
    return {name: row[name] for name in ("values", "guards", "derivativeMaps", "coefficient", "label")}


def verify(output):
    report = load(output / "active-repeat-indexed-attachment.json")
    before = output / "active-n3-repeat-forced-source"
    manifest = load(before / "original-source-export-manifest.json")
    frozen_registry = (before / "original-source-functions.json").read_bytes()
    old = json.loads(json.loads(frozen_registry)["definitions"])
    definitions = (output / "active-repeat-indexed-definitions.json").read_bytes()
    added = json.loads(definitions)
    suffix = (output / "active-repeat-indexed-append.jsonl").read_bytes()
    nodes = [json.loads(line) for line in suffix.splitlines()]
    assert report["status"] == "REGISTERED_NATIVE_INDEXED_CANDIDATES_FULL_STATE_OPEN"
    assert report["sameOriginalDefinitionPrefix"] is True
    assert report["inputs"]["repeatBaseStreamSHA256"] == manifest["node_stream_sha256"]
    assert report["inputs"]["repeatBaseDefinitionSHA256"] == manifest["definitions_sha256"] == fingerprint(frozen_registry)
    assert manifest["node_stream_uncompressed_bytes"] == 1036106095
    assert manifest["node_stream_sha256"] == "7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2"
    assert manifest["definitions_sha256"] == "62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce"
    append = report["append"]
    start = append["firstNode"]
    end = append["endExclusive"]
    assert start == report["inputs"]["repeatBaseNodes"] == manifest["node_count"] == 22380596
    assert append["nodeRecords"] == len(nodes) == end - start
    assert 0 < end - start <= 500_000
    assert append["nodeBytes"] == len(suffix) and append["nodeSHA256"] == fingerprint(suffix)
    assert append["definitionsSHA256"] == fingerprint(definitions)
    assert append["oldNativeDefinitionCounts"] == [len(bucket) for bucket in old] == [2269, 29, 2, 60, 0]
    assert append["newNativeDefinitionCounts"] == [len(old[0]) + len(added["expressions"]), 33, 2, 60, 0]
    assert len(added["fields"]) == 4
    expressions = {item["id"]: item for item in added["expressions"]}
    assert len(expressions) == len(added["expressions"])
    baseline = old[1][9]
    expected_rows = list(map(row_map, baseline["rows"]))
    assert len(expected_rows) == 162 and len({r["label"]["key"] for r in expected_rows}) == 81
    assert all(len(r["guards"]) == 5 for r in expected_rows)
    assert len(report["registration"]["coordinateChecks"]) == 720
    pairs = zip(report["registration"]["fields"], added["fields"], strict=True)
    outputs = []
    for i, (registered, new) in enumerate(pairs):
        assert new["id"] == registered["field"] == f"coupled-field:{29+i}"
        assert new["parameters"] == baseline["parameters"] and new["directions"] == baseline["directions"]
        assert new["requiredSourcePremises"] == baseline["requiredSourcePremises"]
        assert new["sourceAuthenticated"] is False
        assert list(map(row_map, new["rows"])) == expected_rows
        locals_by_sign = {}
        for row in new["rows"]:
            local = expressions[row["localSystem"]]
            assert local["body"] == row["localBody"] and local["parameters"] == row["localParameters"]
            sign = row["label"]["sign"]
            assert locals_by_sign.setdefault(sign, local["id"]) == local["id"]
        assert set(locals_by_sign) == {-1, 1} and len(set(locals_by_sign.values())) == 2
        root = registered["root"]
        assert start <= root < end
        assert nodes[root-start] == {
            "op": "m3_coupled_indexed_partial", "args": [new["id"], new["parameters"], [0] * len(new["directions"])],
        }
        outputs.append({"field": new["id"], "name": new["name"], "root": root, "signSystems": locals_by_sign})
    scope = ("physicalAllDomainAdmission", "fixedLabelC1AllRows", "fullUpdatedState", "fullConservativeResidual")
    assert all(report[k] == "OPEN" for k in scope)
    assert report["finalJets"] == 0 and report["release"] == "HOLD"
    return {
        "status": "VERIFIED_PROVISIONAL_ACTUAL_NATIVE_INDEXED_ROW_REGISTRATION",
        "outputs": outputs, "fieldRows": 648, "nativeNodeSuffixSHA256": fingerprint(suffix),
        "priorSourceSHA256": manifest["node_stream_sha256"],
        "describedOpenObligations": list(scope), "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("export", type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    args.out.write_bytes((json.dumps(verify(args.export), indent=2, sort_keys=True) + "\n").encode())
