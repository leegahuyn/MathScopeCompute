"""Independently check operand binding in the live Repeat refresh export."""

import argparse
from collections import Counter
from hashlib import sha256
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from verify_repeat_indexed_attachment import load, row_map, verify as verify_registration


COMPONENTS = ("rr", "rtheta", "rz", "thetatheta", "thetaz", "zz")
OLD_VELOCITY = [22153222, 22153223, 22153224]
OLD_PRESSURE = 22153227
OLD_RESIDUAL = [22153560, 22153562, 22153564]
THETA = 17732752


def checked(path, expected):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == expected, path
    return data


def verify(output):
    registration = verify_registration(output)
    indexed = load(output / "active-repeat-indexed-attachment.json")
    report = load(output / "active-repeat-full-refresh.json")
    append = report["append"]
    base = output / "active-n3-repeat-forced-source"
    original = json.loads(load(base / "original-source-functions.json")["definitions"])
    assert report["status"] == "CANDIDATE_FULL_PRESSURE_AND_PDE_GRAPH_CONSTRUCTED"
    assert report["predecessor"] == {
        "originalStreamSHA256": indexed["inputs"]["repeatBaseStreamSHA256"],
        "indexedAppendSHA256": indexed["append"]["nodeSHA256"],
        "indexedDefinitionsSHA256": indexed["append"]["definitionsSHA256"],
    }
    assert append["start"] == indexed["append"]["endExclusive"]
    assert append["previousCounts"] == indexed["append"]["newNativeDefinitionCounts"]
    assert append["newCounts"][1] == append["previousCounts"][1] + 6
    assert append["newCounts"][2:] == append["previousCounts"][2:]
    files = "active-repeat-full-refresh-"
    definitions = json.loads(checked(output / (files + "definitions.json"), append["definitionsSHA256"]))
    lines = checked(output / (files + "append.jsonl"), append["nodeSHA256"]).splitlines()
    assert len(lines) == append["end"] - append["start"] and lines
    assert len(definitions["fields"]) == 6
    assert len(definitions["expressions"]) == append["newCounts"][0] - append["previousCounts"][0]
    rows = dict(enumerate(map(json.loads, lines), append["start"]))
    roots = report["roots"]
    assert roots["oldVelocity"] == OLD_VELOCITY
    assert roots["oldPressure"] == OLD_PRESSURE
    assert roots["oldConservative"] == OLD_RESIDUAL
    assert roots["repeatAngular"] == [item["root"] for item in registration["outputs"]]

    def terms(node, stop):
        if node in stop or node not in rows or rows[node]["op"] != "add":
            return Counter([node])
        left, right = rows[node]["args"]
        return terms(left, stop) + terms(right, stop)

    # Stop only at the independently checked preceding roots and increments.
    for i, value in enumerate(roots["velocity"]):
        expected = {OLD_VELOCITY[i], roots["repeatAngular"][i]}
        assert terms(value, expected) == Counter(expected)
    pair = {OLD_PRESSURE, roots["repeatAngular"][3], roots["mean"]["pressureIncrement"]}
    assert terms(roots["pressure"], pair) == Counter(pair)

    baseline = original[1][20]
    # The original mean fields share one dispatch. The new fields must match
    # its values/guards/maps rather than an angular dispatch with the angle left in.
    assert THETA not in baseline["parameters"] and THETA not in baseline["directions"]
    old_rows = [row_map(row) for row in baseline["rows"]]
    assert len(old_rows) == 162
    defs = {item["id"]: item for item in definitions["expressions"]}
    for i, key in enumerate(COMPONENTS):
        field = definitions["fields"][i]
        value = roots["covariance"][key]
        assert value["field"] == field["id"] == f"coupled-field:{33+i}"
        assert field["name"] == f"ActualPostFiveRepeatCovarianceDelta_{key}"
        assert field["parameters"] == baseline["parameters"] and field["directions"] == baseline["directions"]
        assert [row_map(row) for row in field["rows"]] == old_rows
        assert all(defs[row["localSystem"]]["body"] == row["localBody"] for row in field["rows"])
        assert rows[value["root"]] == {
            "op": "m3_coupled_indexed_partial",
            "args": [field["id"], field["parameters"], [0] * len(field["directions"])],
        }
        assert value["updated"] in rows

    assert all(roots["mean"][key] in rows for key in (
        "pressureIncrement", "pressureRemainder", "deltaRadialPressureDerivative"))
    assert all(len(roots[key]) == 3 for key in (
        "velocity", "advective", "conservative", "pressureGradient", "vectorLaplacian"))
    divisor = roots["divergence"]
    assert divisor in rows
    for advective, conservative, velocity in zip(
        roots["advective"], roots["conservative"], roots["velocity"], strict=True
    ):
        assert advective in rows and conservative in rows
        value = rows[conservative]
        payload = value["args"]
        assert value["op"] == "add" and advective in payload
        correction = rows[next(arg for arg in payload if arg != advective)]
        assert correction["op"] == "multiply" and set(correction["args"]) == {velocity, divisor}
    scope = report["scope"]
    assert scope["completeSecondForcedState"] is False
    assert scope["fullPhysicalResidualASTRecomputed"] is True
    assert scope["physicalAllDomainAdmission"] == scope["fixedLabelC1AllRows"] == scope["completeFlatRemainder"] == "OPEN"
    assert scope["finalJets"] == 0 and scope["release"] == "HOLD"
    return {
        "status": "VERIFIED_REPEAT_PRESSURE_AND_CONSERVATIVE_GRAPH_BINDINGS",
        "covarianceRows": 972, "nodeRecords": len(lines),
        "candidatePhysicalResidualRoots": roots["conservative"],
        "fullPressureRoot": roots["pressure"],
        "scope": scope,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("export", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    args.out.write_bytes((json.dumps(verify(args.export), indent=2) + "\n").encode())
