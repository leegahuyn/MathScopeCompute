"""Read the original active Repeat graph and finite-order stress receipt."""

import argparse
import gzip
import hashlib
import json
from pathlib import Path


GOAL = Path("work/goal-next")
HOSTED = GOAL / "continuation132/hosted-44682703381"
HOSTED_GRAPH = HOSTED / "active-n3-repeat-forced-source"
RUNTIME = GOAL / "continuation66/stage2/runtime-exact/research-ide"
STRESS_RECEIPT = GOAL / "axial-alln/order-three.json"
PINS = {
    Path("work/delivery/inputs/paper/recovered-repository-pinned-166-pages.pdf"):
        "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
    STRESS_RECEIPT: "26bbd0d14f0218dfe0a6be2494845e6de86bb8cb23f782bccb695ba2abfee2c7",
    GOAL / "continuation56/leading-axial-support/final/LEADING_AXIAL_SUPPORT.md":
        "ac76353ab60c75487d374a3a03678442007d8f55036cd5520a9208a9aa24a683",
    HOSTED_GRAPH / "original-source-export-manifest.json":
        "04351d6619a0d782ac108f231efc67ffbd35c2f88e7951f2b1b14445a8ca59a2",
    HOSTED_GRAPH / "original-source-functions.json":
        "62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce",
}
M2_PINS = {
    "actual-covariance-sensitivity": "f27ed95c3a1e40a4dfa4a38340d170aa92c7ec6102b277c952e1dc2dc91ac27c",
    "actual-global-source-outer": "5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9",
    "actual-continuation-exact-b8": "1e0d6586a60ee5aa3d5315c40f624ebb9e8a4925a00117818d41d6697fc67baf",
    "actual-continuation-exact-global": "497e18fc52c10b9eb482bdb6cc18b406c02f453dc19663ba5535c13a41ec015f",
    "actual-continuation-exact-heat": "c999b45a6d1e18226c80fb9866b6743553f1859c67dffa39490cd25f7e13d172",
    "actual-continuation-exact-pregluing": "7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3",
    "actual-continuation-exact-leading-conservation":
        "48650f7a1ad5515dc24cf26395bb3b6435ca11c602bfcf8fb09446012a21474b",
    "actual-positive-global-stress": "77227cd74000f5b6d4bec0361106af21d8020b2eee1eb979c1adc9ec3aae97d1",
    "actual-continuation-exact-support": "0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98",
    "actual-continuation-exact-stress": "22d0fe9deae4dd7a5dca687758fb3b8b57a56cba7472c9fb23b76dd360f0bcc2",
    "actual-background-residual-bridge": "a0d2823ee658aadff65171441c06c9cb0f52ac7115be948e17600d343fd5788a",
}
M3_PINS = {
    "source-global-band": "a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b",
    "source-global-current": "b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36",
    "source-signed-stress": "c0882d323cfb6f23fac966bf9fe86810a569ab5bde5ea2b020d062e6029b1dbd",
}
for milestone, pins in (("m2", M2_PINS), ("m3", M3_PINS)):
    for name, digest in pins.items():
        PINS[RUNTIME / f"mathscope-{milestone}/navier/{name}.mjs"] = digest

X, ETA, XA, XMINUS, XPLUS, XB = 4756, 2, 3617, 28814, 28824, 28826
ORDER_THREE_PREFIX_LENGTH = 123869
ORDER_THREE_PREFIX_HASH = "89cf4399ac52722aec46382217924afa5670198a4a7fad2429728b7f296f38e6"
NATIVE_STRESS = {
    "theta": [117068, 120800, 123850],
    "z": [117069, 120807, 123857],
}
EXPECTED_LEADING = {"theta": (32017, 17732694), "z": (32018, 17732695)}
EXPECTED_BAND = {"theta": (32025, 17732874), "z": (32026, 17732877)}
EXPECTED_PREFIX = {
    "I": (32013, 17727674),
    "J": (32014, 17727683),
    "S": (32015, 17727698),
    "Cp": (32016, 17727703),
}


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def scan_original_stream(path, manifest, selected):
    full_hash = hashlib.sha256()
    prefix_hash = hashlib.sha256(b"[")
    order_three_hash = hashlib.sha256(b"[")
    nodes = {}
    count = 0
    uncompressed_bytes = 0
    with gzip.open(path, "rb") as stream:
        header = next(stream)
        assert json.loads(header) == {
            "schema": "MathScope.M3.FullNodesJSONL/1",
            "node_count": manifest["node_count"],
        }
        full_hash.update(header)
        uncompressed_bytes += len(header)
        for count, line in enumerate(stream, 1):
            identity = count - 1
            full_hash.update(line)
            uncompressed_bytes += len(line)
            if identity < 117100:
                if identity > 0:
                    prefix_hash.update(b",")
                prefix_hash.update(line.rstrip(b"\r\n"))
            if identity < ORDER_THREE_PREFIX_LENGTH:
                if identity > 0:
                    order_three_hash.update(b",")
                order_three_hash.update(line.rstrip(b"\r\n"))
            if identity in selected:
                nodes[identity] = json.loads(line)
    assert count == manifest["node_count"]
    assert full_hash.hexdigest() == manifest["node_stream_sha256"]
    assert uncompressed_bytes == manifest["node_stream_uncompressed_bytes"]
    assert nodes.keys() == selected
    prefix_hash.update(b"]")
    order_three_hash.update(b"]")
    assert order_three_hash.hexdigest() == ORDER_THREE_PREFIX_HASH
    return nodes, prefix_hash.hexdigest()


def flatten_sum(nodes, identity):
    record = nodes.get(identity)
    if record is None or record["op"] != "add":
        return [identity]
    return [term for child in record["args"] for term in flatten_sum(nodes, child)]


def prove_graph_readback(nodes, definitions, receipt):
    cert = receipt["certificate"]
    support = cert["leading"]["angular"]["originalAuditProof"]["sourceOrderProof"]
    assert support["pass"]
    assert [support["endpoints"][name] for name in ("Xa", "Xminus", "Xplus", "Xb")] == [
        XA, XMINUS, XPLUS, XB,
    ]
    assert nodes[XA] == {"op": "source_parameter", "args": ["Xa"]}
    assert nodes[XMINUS] == {"op": "multiply", "args": [XA, 28813]}
    assert nodes[XPLUS] == {"op": "multiply", "args": [588, support["endpoints"]["Xv"]]}
    assert nodes[XB] == {"op": "multiply", "args": [12, 28825]}
    assert cert["leading"]["angular"]["sourceHeatExterior"]["pass"]
    assert cert["leading"]["angular"]["originalAuditProof"]["pass"]
    assert cert["leading"]["angular"]["originalAuditProof"]["constantOfIntegrationIncluded"]
    assert cert["leading"]["mass"]["pass"]
    assert cert["leading"]["mass"]["massExterior"]["pass"]
    assert cert["sourceFTC"]["pass"]

    for suffix, (definition, body) in EXPECTED_PREFIX.items():
        row = definitions[definition]
        assert row["name"] == f"ActualCovarianceSensitivityTargetPrefix_{suffix}"
        assert row["parameters"] == [X, ETA]
        assert row["body"] == body
        assert nodes[body]["op"] == "definite_integral"
        assert nodes[body]["args"][2:] == [0, X]

    result = {}
    for j, name in enumerate(("theta", "z")):
        lead_id, lead_body = EXPECTED_LEADING[name]
        band_id, band_body = EXPECTED_BAND[name]
        assert definitions[lead_id]["name"] == f"ActualCovarianceSensitivityFullLeadingTarget_{j}"
        assert definitions[lead_id]["parameters"] == [X, ETA]
        assert definitions[lead_id]["body"] == lead_body
        assert nodes[lead_body]["op"] == "add"
        assert definitions[band_id]["name"] == f"ActualCommonBandNormalized_T{name}"
        assert definitions[band_id]["parameters"] == [17727245, X, ETA]
        assert definitions[band_id]["body"] == band_body
        summands = flatten_sum(nodes, band_body)
        expected_application = {"op": "actual_expression_partial", "args": [lead_id, [X, ETA], [0, 0]]}
        assert len(summands) == 4
        assert sum(nodes[term] == expected_application for term in summands) == 1
        weights = {}
        for term in summands:
            record = nodes[term]
            if record == expected_application:
                continue
            assert record["op"] == "multiply"
            operands = record["args"]
            (stress,) = set(operands).intersection(NATIVE_STRESS[name])
            (weight,) = set(operands) - {stress}
            weights[stress] = weight
        assert set(weights) == set(NATIVE_STRESS[name])

        rows = [r for r in cert["stressRows"] if r["component"] == name]
        ftc_rows = [r for r in cert["sourceFTC"]["rows"] if r["component"] == name]
        assert [r["order"] for r in rows] == [1, 2, 3]
        assert [r["order"] for r in ftc_rows] == [1, 2, 3]
        positive = []
        for row, ftc in zip(rows, ftc_rows, strict=True):
            order = row["order"]
            stress = NATIVE_STRESS[name][order - 1]
            assert row["actualStress"] == stress == ftc["root"]
            assert all(row[key]["pass"] for key in (
                "rawDensityCheck", "wholeDensityCheck", "backwardSign",
                "originalSignedFTC", "interiorCoefficientCheck",
            ))
            assert row["actualConservativeTotalReduced"] == 0
            assert row["allFixedDerivativeJetsMatch"] and row["pass"]
            assert all(ftc[key]["pass"] for key in ("densityCheck", "primitiveCheck", "check"))
            assert not ftc["negativeWrongSign"]["pass"]
            outer = XB if name == "theta" and order == 1 else XPLUS
            assert nodes[stress] == {
                "op": "smooth_piecewise",
                "args": [X, XMINUS, outer, 0, row["sourceForward"], 0],
            }
            assert ftc["openDomain"] == [XMINUS, outer]
            assert ftc["fixedLabelEndpoints"]
            assert nodes[row["sourceForwardIntegral"]]["op"] == "definite_integral"
            assert nodes[row["sourceForwardIntegral"]]["args"][2:] == [XMINUS, X]
            assert nodes[row["sourceBackwardIntegral"]]["op"] == "definite_integral"
            assert nodes[row["sourceBackwardIntegral"]]["args"][2:] == [X, outer]
            if order == 1:
                assert row["originalTotalCheck"]["pass"]
                assert nodes[row["originalTotal"]]["op"] == "definite_integral"
                assert nodes[row["originalTotal"]]["args"][2:] == [XMINUS, outer]
            positive.append({
                "order": order,
                "stress": stress,
                "weight": weights[stress],
                "left": XMINUS,
                "right": outer,
                "forwardIntegral": row["sourceForwardIntegral"],
                "backwardIntegral": row["sourceBackwardIntegral"],
                "rawDensity": row["actualRawResidual"],
                "verifiedConservativeTotal": row["actualConservativeTotalReduced"],
            })
        result[name] = {"leadingBody": lead_body, "bandBody": band_body, "positive": positive}

    axial_one = next(r for r in cert["sourceFTC"]["rows"] if r["order"] == 1 and r["component"] == "z")
    assert axial_one["materializedDensity"] == 117047
    assert nodes[117047] == {"op": "smooth_piecewise", "args": [X, XMINUS, XPLUS, 0, 117045, 0]}
    assert nodes[117045]["op"] == "add"
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    args = parser.parse_args()
    for path, expected in PINS.items():
        assert hashlib.sha256((args.root / path).read_bytes()).hexdigest() == expected, path
    hosted = args.root / HOSTED_GRAPH
    manifest = load_json(hosted / "original-source-export-manifest.json")
    receipt = load_json(args.root / STRESS_RECEIPT)
    registry = load_json(hosted / "original-source-functions.json")
    definitions = json.loads(registry["base"]["base"]["expression"])
    selected = {
        XA, XMINUS, XPLUS, XB, 117045, 117047,
        *range(17732694, 17732698), *range(17732812, 17732878),
        *(body for _, body in EXPECTED_PREFIX.values()),
    }
    for row in receipt["certificate"]["stressRows"]:
        selected.update(row[key] for key in (
            "actualStress", "sourceForwardIntegral", "sourceBackwardIntegral", "originalTotal",
        ) if row[key] is not None)
    nodes, prefix_hash = scan_original_stream(hosted / "original-source-nodes.jsonl.gz", manifest, selected)
    assert prefix_hash == receipt["prefixSHA256"]
    stresses = prove_graph_readback(nodes, definitions, receipt)
    print(json.dumps({
        "originalCommit": manifest["original_pr30_commit"],
        "executingCommit": manifest["executing_commit"],
        "nativeStreamNodes": manifest["node_count"],
        "nativeStreamSHA256": manifest["node_stream_sha256"],
        "actualOrderOnePrefixNodes": 117100,
        "actualOrderOnePrefixSHA256": prefix_hash,
        "actualOrderThreeStressPrefixNodes": ORDER_THREE_PREFIX_LENGTH,
        "actualOrderThreeStressPrefixSHA256": ORDER_THREE_PREFIX_HASH,
        "leadingPrefixBodies": {name: body for name, (_, body) in EXPECTED_PREFIX.items()},
        "orderOneAxialGuardedIntegrand": {"node": 117047, "args": nodes[117047]["args"]},
        "stress": stresses,
        "sameSourceAnalyticLeadingExteriorRequired": True,
        "allRecursiveOrdersProved": False,
        "finalJets": "0/67",
        "release": "HOLD",
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
