"""Recover the original first Forced contribution to the first-cycle gauge."""
from argparse import ArgumentParser
import gzip
from hashlib import sha256
import json
from pathlib import Path


CALIBRATION_SHA = "1626a44766f1ba0058f62889a95fdef0a32b8f0af5589d966f242ac13f4e1021"
PARTS = ("real", "imaginary")


def read(path, digest=None):
    data = path.read_bytes()
    if digest is not None:
        assert sha256(data).hexdigest() == digest, path
    return json.loads(data)


def native_applications(graph, manifest, systems):
    digest = sha256()
    applications = {}
    with gzip.open(graph, "rb") as stream:
        header = stream.readline()
        digest.update(header)
        assert json.loads(header) == {"schema": "MathScope.M3.FullNodesJSONL/1",
            "node_count": manifest["node_count"]}
        for index, line in enumerate(stream):
            digest.update(line)
            if not line.startswith(b'{"op":"m3_coupled_expression_partial"'):
                continue
            name, actual, orders = json.loads(line)["args"]
            if name in systems and actual == systems[name]["parameters"] and not any(orders):
                assert len(actual) == len(orders) and name not in applications
                applications[name] = index
    assert index + 1 == manifest["node_count"]
    assert digest.hexdigest() == manifest["node_stream_sha256"]
    assert set(applications) == set(systems)
    return applications


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--first-dir", required=True, type=Path)
    parser.add_argument("--calibration", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    assert __debug__
    manifest = read(args.first_dir / "original-source-export-manifest.json")
    assert manifest["scope"] == "REPAIRED_FIRST_FORCED_ONLY"
    assert not manifest["final_all_cycle_A_b_p"] and manifest["actual_final_67_jets_certified"] == 0
    registry = read(args.first_dir / "original-source-functions.json", manifest["definitions_sha256"])
    expressions, fields, _, _, _ = json.loads(registry["definitions"])
    by_id = {row["id"]: row for row in expressions}
    replay = read(args.calibration, CALIBRATION_SHA)["correctedFirstForce"]
    assert replay["graphSHA256"] == manifest["node_stream_sha256"]
    ledger = {(row["key"], row["mode"]): row for row in replay["ledger"]}
    assert len(ledger) == 20
    cases = []
    systems = {}
    for t in replay["actualFirstForcedVelocityCharts"]:
        for mode in t["fullMappedCurlAndPressure"]:
            m = mode["mode"]
            keys = {}
            for system in mode["potentialSystems"]:
                definition = by_id[system]
                prefix = f"ActualMappedOriginalForced_{t['key']}_m{m}_"
                assert definition["name"].startswith(prefix)
                part, index = definition["name"][len(prefix):].split("_")
                j = int(index)
                assert part in PARTS and j in (0, 1, 2) and (part, j) not in keys
                assert system not in systems
                keys[part, j] = system
                systems[system] = definition
            assert len(keys) == 6
            row = ledger[t["key"], m]
            assert all(owner["guards"] == row["sourceGuards"] for owner in t["owners"])
            cases.append((t, mode, row, keys))
    assert len(cases) == 20 and len(systems) == 120
    applications = native_applications(args.first_dir / "original-source-nodes.jsonl.gz", manifest, systems)
    results = []
    for t, mode, row, keys in cases:
        potential = []
        for j in range(3):
            real = keys["real", j]
            imaginary = keys["imaginary", j]
            # The normalized complex gauge is i times the two shared native
            # potential coordinates whose exact curls are already verified.
            potential.append({"real": {"coefficient": -1, "root": applications[imaginary]},
                "imaginary": {"coefficient": 1, "root": applications[real]}})
        results.append({"key": t["key"], "mode": mode["mode"], "phase": row["phase"],
            "sourceGuards": row["sourceGuards"], "positiveNormalizedCylindricalPotential": potential,
            "negativeModeRule": "complex conjugate on the same phase",
            "verifiedFullCurlVelocity": mode["positiveVelocityCoefficients"],
            "sameModePressure": mode["positivePressureCoefficients"]})
    ref_fields = fields[9:12]
    assert [f["name"] for f in ref_fields] == [f"ActualForcedCurrent_velocity_{j}" for j in range(3)]
    assert all(len(f["rows"]) == 162 for f in ref_fields)
    keys = ("values", "derivativeMaps", "guards", "coefficient", "label")
    rows = [{key: row[key] for key in keys} for row in ref_fields[0]["rows"]]
    assert all(rows == [{key: row[key] for key in keys} for row in f["rows"]] for f in ref_fields)
    output = {
        "schema": "MathScope.M3.FirstForcedGaugeContribution/1",
        "sourceCommit": manifest["executing_commit"], "sourceGraphSHA256": manifest["node_stream_sha256"],
        "sourceRegistrySHA256": manifest["definitions_sha256"], "completeCurlReplaySHA256": CALIBRATION_SHA,
        "nativePotentialApplications": len(applications), "positiveModeCases": len(results),
        "sameIndexedRowMaps": rows, "cases": results,
        "ownToReferencePotentialMultiplier": "rho^(A-1/2)",
        "referenceToPhysicalPotentialMultiplier": "Q_ref^(1/2-A)",
        "physicalCartesianComponents": [
            "A_r*cos(theta)-A_theta*sin(theta)", "A_r*sin(theta)+A_theta*cos(theta)", "A_z"],
        "scope": "The original first Forced contribution to A_1 on its defined source charts.",
        "completeFirstCorrectionPotentials": False, "finalJets": 0,
    }
    args.out.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(applications)} native potential roots, {len(results)} exact positive mode cases, {len(rows)} row maps")


if __name__ == "__main__":
    main()
