"""Exact retained Cartesian axial finite-face source binding, no finiteness proof.

The 83-node derivative cone, its actual native1 tuples, the scoped radial
primitive, original three finite-face integrals and one selector ancestry path
are compared with live inherited Source records. This binds the proposed
bounded-piecewise-integrability premise; it does not establish that premise.
"""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path

import actual_axial_stress_derivative as algebra

Gap = algebra.Gap
require = algebra.require
canonical = algebra.canonical
digest = algebra.digest

SCHEMA = "MathScope.N6.ActualAxialFaceBinding/1"
CONE_SHA256 = "f02b61635b695f7941caf256042307c99757589e772a0049146797b399b71920"
HEADER_SHA256 = "f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1"
FIXED_SHA256 = "c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b"
SELECTOR_PATH = [617466, 617465, 617444, 617443, 617442, 539400,
                 539399, 517247, 517240]

# These records were extracted from the complete original stream after its
# inherited gzip/raw/parent authentication, never reconstructed by a producer.
EXPECTED_EXTRA_NODES = json.loads(r'''{
  "0": {
    "op": "rational",
    "args": [
      "0",
      "1"
    ]
  },
  "1": {
    "op": "rational",
    "args": [
      "1",
      "1"
    ]
  },
  "2": {
    "op": "coordinate",
    "args": [
      "eta"
    ]
  },
  "6": {
    "op": "source_parameter",
    "args": [
      "T"
    ]
  },
  "7": {
    "op": "source_parameter",
    "args": [
      "BOuter"
    ]
  },
  "8": {
    "op": "source_parameter",
    "args": [
      "lambda"
    ]
  },
  "9": {
    "op": "source_parameter",
    "args": [
      "h"
    ]
  },
  "12": {
    "op": "source_parameter",
    "args": [
      "XR"
    ]
  },
  "13": {
    "op": "source_parameter",
    "args": [
      "Tf"
    ]
  },
  "14": {
    "op": "source_parameter",
    "args": [
      "co"
    ]
  },
  "19": {
    "op": "rational",
    "args": [
      "1",
      "2"
    ]
  },
  "20": {
    "op": "rational",
    "args": [
      "-1",
      "1"
    ]
  },
  "21": {
    "op": "multiply",
    "args": [
      9,
      20
    ]
  },
  "24": {
    "op": "rational",
    "args": [
      "2",
      "1"
    ]
  },
  "56": {
    "op": "add",
    "args": [
      1,
      6
    ]
  },
  "76": {
    "op": "add",
    "args": [
      1,
      56
    ]
  },
  "83": {
    "op": "rational",
    "args": [
      "60",
      "1"
    ]
  },
  "84": {
    "op": "multiply",
    "args": [
      7,
      83
    ]
  },
  "98": {
    "op": "add",
    "args": [
      76,
      84
    ]
  },
  "101": {
    "op": "rational",
    "args": [
      "13",
      "1"
    ]
  },
  "102": {
    "op": "inverse",
    "args": [
      8
    ]
  },
  "103": {
    "op": "multiply",
    "args": [
      101,
      102
    ]
  },
  "114": {
    "op": "add",
    "args": [
      98,
      103
    ]
  },
  "139": {
    "op": "add",
    "args": [
      13,
      114
    ]
  },
  "147": {
    "op": "rational",
    "args": [
      "30",
      "1"
    ]
  },
  "148": {
    "op": "multiply",
    "args": [
      7,
      147
    ]
  },
  "158": {
    "op": "add",
    "args": [
      139,
      148
    ]
  },
  "166": {
    "op": "multiply",
    "args": [
      8,
      20
    ]
  },
  "167": {
    "op": "add",
    "args": [
      1,
      166
    ]
  },
  "179": {
    "op": "add",
    "args": [
      1,
      158
    ]
  },
  "180": {
    "op": "multiply",
    "args": [
      19,
      167
    ]
  },
  "181": {
    "op": "multiply",
    "args": [
      20,
      180
    ]
  },
  "184": {
    "op": "rational",
    "args": [
      "-4",
      "1"
    ]
  },
  "185": {
    "op": "log_positive",
    "args": [
      9
    ]
  },
  "186": {
    "op": "multiply",
    "args": [
      184,
      185
    ]
  },
  "199": {
    "op": "add",
    "args": [
      179,
      186
    ]
  },
  "207": {
    "op": "add",
    "args": [
      1,
      21
    ]
  },
  "218": {
    "op": "add",
    "args": [
      1,
      199
    ]
  },
  "219": {
    "op": "multiply",
    "args": [
      19,
      207
    ]
  },
  "222": {
    "op": "add",
    "args": [
      8,
      21
    ]
  },
  "223": {
    "op": "inverse",
    "args": [
      167
    ]
  },
  "224": {
    "op": "multiply",
    "args": [
      222,
      223
    ]
  },
  "225": {
    "op": "exp",
    "args": [
      181
    ]
  },
  "226": {
    "op": "coordinate",
    "args": [
      "Qsteep$15"
    ]
  },
  "227": {
    "op": "coordinate",
    "args": [
      "sigmaIntegral$16"
    ]
  },
  "228": {
    "op": "source_step_derivative",
    "args": [
      227,
      0
    ]
  },
  "229": {
    "op": "definite_integral",
    "args": [
      228,
      227,
      0,
      226
    ]
  },
  "230": {
    "op": "multiply",
    "args": [
      20,
      229
    ]
  },
  "231": {
    "op": "add",
    "args": [
      226,
      230
    ]
  },
  "232": {
    "op": "multiply",
    "args": [
      167,
      231
    ]
  },
  "233": {
    "op": "exp",
    "args": [
      232
    ]
  },
  "234": {
    "op": "source_step_derivative",
    "args": [
      226,
      0
    ]
  },
  "235": {
    "op": "multiply",
    "args": [
      167,
      234
    ]
  },
  "236": {
    "op": "add",
    "args": [
      8,
      235
    ]
  },
  "237": {
    "op": "add",
    "args": [
      21,
      236
    ]
  },
  "238": {
    "op": "multiply",
    "args": [
      233,
      237
    ]
  },
  "239": {
    "op": "definite_integral",
    "args": [
      238,
      226,
      0,
      1
    ]
  },
  "240": {
    "op": "add",
    "args": [
      224,
      239
    ]
  },
  "241": {
    "op": "multiply",
    "args": [
      225,
      240
    ]
  },
  "242": {
    "op": "multiply",
    "args": [
      186,
      207
    ]
  },
  "243": {
    "op": "add",
    "args": [
      241,
      242
    ]
  },
  "244": {
    "op": "multiply",
    "args": [
      20,
      219
    ]
  },
  "245": {
    "op": "exp",
    "args": [
      244
    ]
  },
  "246": {
    "op": "coordinate",
    "args": [
      "Qflatten$17"
    ]
  },
  "247": {
    "op": "coordinate",
    "args": [
      "sigmaIntegral$18"
    ]
  },
  "248": {
    "op": "source_step_derivative",
    "args": [
      247,
      0
    ]
  },
  "249": {
    "op": "definite_integral",
    "args": [
      248,
      247,
      0,
      246
    ]
  },
  "250": {
    "op": "multiply",
    "args": [
      207,
      249
    ]
  },
  "251": {
    "op": "exp",
    "args": [
      250
    ]
  },
  "252": {
    "op": "source_step_derivative",
    "args": [
      246,
      0
    ]
  },
  "253": {
    "op": "multiply",
    "args": [
      20,
      252
    ]
  },
  "254": {
    "op": "add",
    "args": [
      1,
      253
    ]
  },
  "255": {
    "op": "multiply",
    "args": [
      207,
      251
    ]
  },
  "256": {
    "op": "multiply",
    "args": [
      254,
      255
    ]
  },
  "257": {
    "op": "definite_integral",
    "args": [
      256,
      246,
      0,
      1
    ]
  },
  "258": {
    "op": "add",
    "args": [
      243,
      257
    ]
  },
  "259": {
    "op": "multiply",
    "args": [
      245,
      258
    ]
  },
  "260": {
    "op": "multiply",
    "args": [
      9,
      14
    ]
  },
  "261": {
    "op": "rational",
    "args": [
      "3",
      "1"
    ]
  },
  "262": {
    "op": "coordinate",
    "args": [
      "Qterminal$19"
    ]
  },
  "263": {
    "op": "multiply",
    "args": [
      207,
      262
    ]
  },
  "264": {
    "op": "exp",
    "args": [
      263
    ]
  },
  "265": {
    "op": "add",
    "args": [
      20,
      262
    ]
  },
  "266": {
    "op": "multiply",
    "args": [
      19,
      265
    ]
  },
  "267": {
    "op": "source_step_derivative",
    "args": [
      266,
      1
    ]
  },
  "268": {
    "op": "multiply",
    "args": [
      260,
      264
    ]
  },
  "269": {
    "op": "multiply",
    "args": [
      267,
      268
    ]
  },
  "270": {
    "op": "multiply",
    "args": [
      20,
      260
    ]
  },
  "271": {
    "op": "add",
    "args": [
      1,
      270
    ]
  },
  "272": {
    "op": "multiply",
    "args": [
      24,
      271
    ]
  },
  "273": {
    "op": "inverse",
    "args": [
      272
    ]
  },
  "274": {
    "op": "multiply",
    "args": [
      269,
      273
    ]
  },
  "275": {
    "op": "definite_integral",
    "args": [
      274,
      262,
      1,
      261
    ]
  },
  "276": {
    "op": "inverse",
    "args": [
      275
    ]
  },
  "277": {
    "op": "multiply",
    "args": [
      259,
      276
    ]
  },
  "278": {
    "op": "log_positive",
    "args": [
      277
    ]
  },
  "279": {
    "op": "inverse",
    "args": [
      207
    ]
  },
  "280": {
    "op": "multiply",
    "args": [
      278,
      279
    ]
  },
  "294": {
    "op": "add",
    "args": [
      218,
      280
    ]
  },
  "319": {
    "op": "add",
    "args": [
      261,
      294
    ]
  },
  "4756": {
    "op": "coordinate",
    "args": [
      "X"
    ]
  },
  "28825": {
    "op": "exp",
    "args": [
      319
    ]
  },
  "28826": {
    "op": "multiply",
    "args": [
      12,
      28825
    ]
  },
  "117047": {
    "op": "smooth_piecewise",
    "args": [
      4756,
      28814,
      28824,
      0,
      117045,
      0
    ]
  },
  "137008": {
    "op": "multiply",
    "args": [
      24,
      28826
    ]
  },
  "215514": {
    "op": "sqrt_positive",
    "args": [
      137008
    ]
  },
  "346574": {
    "op": "multiply",
    "args": [
      20,
      215514
    ]
  },
  "517235": {
    "op": "integer_power",
    "args": [
      517234,
      2
    ]
  },
  "517236": {
    "op": "add",
    "args": [
      1,
      517235
    ]
  },
  "517237": {
    "op": "sqrt_positive",
    "args": [
      517236
    ]
  },
  "517238": {
    "op": "definite_integral",
    "args": [
      517237,
      517017,
      20,
      1
    ]
  },
  "517239": {
    "op": "definite_integral",
    "args": [
      517238,
      517016,
      346574,
      215514
    ]
  },
  "517240": {
    "op": "definite_integral",
    "args": [
      517239,
      517015,
      346574,
      215514
    ]
  },
  "517247": {
    "op": "add",
    "args": [
      517240,
      517246
    ]
  },
  "539399": {
    "op": "add",
    "args": [
      517247,
      539398
    ]
  },
  "539400": {
    "op": "maximum",
    "args": [
      1,
      539399
    ]
  },
  "617442": {
    "op": "log_positive",
    "args": [
      539400
    ]
  },
  "617443": {
    "op": "add",
    "args": [
      127,
      617442
    ]
  },
  "617444": {
    "op": "multiply",
    "args": [
      136158,
      617443
    ]
  },
  "617465": {
    "op": "maximum",
    "args": [
      137420,
      127,
      617464,
      617441,
      617444,
      617447,
      617450,
      617453,
      617456,
      617459,
      617462
    ]
  },
  "617466": {
    "op": "exp",
    "args": [
      617465
    ]
  }
}''')
EXTRA_SHA256 = "7d85fc4dafef6e55e16e6b9a0f9d83b2307821d3fafaaf880bfafa43305d15a7"


def validate_background(background):
    require(type(background) is dict and background.get("schema") ==
            "MathScope.N6.ActualBackground26JetRegularity/1",
            "Changed actual background receipt schema")
    header = background.get("sourceHeaderBinding", {})
    require(header.get("sourceHeaderRecordSHA256") == HEADER_SHA256,
            "Changed original source header reference")
    require(background.get("fixedDefinitionSHA256") == FIXED_SHA256,
            "Changed original fixed-definition reference")
    frontier = algebra.extract_frontier(background, "background")
    cone = algebra.validate_cone(frontier)
    require(algebra.cone_sha256(cone) == CONE_SHA256,
            "Changed full Cartesian derivative cone pin")
    require(frontier.get("scopedCoordinates") == [517015, 517016, 517017]
            and all(type(i) is int for i in frontier["scopedCoordinates"]),
            "Changed actual finite-face scoped coordinates")
    return cone


def expected_nodes():
    require(digest(canonical(EXPECTED_EXTRA_NODES)) == EXTRA_SHA256,
            "Internal finite-face source pin changed")
    require(algebra.cone_sha256(algebra.EXPECTED_CONE) == CONE_SHA256,
            "Internal full Cartesian cone pin changed")
    result = copy.deepcopy(algebra.EXPECTED_CONE)
    for key, value in EXPECTED_EXTRA_NODES.items():
        if key in result:
            require(canonical(result[key]) == canonical(value),
                    "Conflicting shared source node " + key)
        result[key] = copy.deepcopy(value)
    return dict(sorted(result.items(), key=lambda row: int(row[0])))


def validate_source(background, get):
    require(callable(get), "Live original source comparison is required")
    cone = validate_background(background)
    expected = expected_nodes()
    actual = {}
    for key, node in expected.items():
        value = get(int(key))
        require(canonical(value) == canonical(node),
                "Changed live finite-face source node " + key)
        actual[key] = copy.deepcopy(value)
    require(all(canonical(actual[key]) == canonical(value)
                for key, value in cone.items()), "Changed live derivative cone")
    # Each edge is an actual ordinary operand; orders/registry labels do not
    # become ancestry edges. This path has no native-body expansion.
    for parent, child in zip(SELECTOR_PATH, SELECTOR_PATH[1:]):
        node = actual[str(parent)]
        require(node["op"] in {"exp", "maximum", "multiply", "add", "log_positive"}
                and child in node["args"], "Changed actual selector ancestry")
    return actual


def face_scopes():
    return [
        {"node": 517240, "body": 517239, "binder": 517015,
         "bounds": [346574, 215514], "endpointScope": [],
         "bodyScope": [517015]},
        {"node": 517239, "body": 517238, "binder": 517016,
         "bounds": [346574, 215514], "endpointScope": [517015],
         "bodyScope": [517015, 517016]},
        {"node": 517238, "body": 517237, "binder": 517017,
         "bounds": [20, 1], "endpointScope": [517015, 517016],
         "bodyScope": [517015, 517016, 517017]},
        {"node": 517222, "body": 517221, "binder": 117055,
         "bounds": [28814, 517175],
         "endpointScope": [517015, 517016, 517017],
         "bodyScope": [517015, 517016, 517017, 117055]},
    ]


def audit(background, get):
    nodes = validate_source(background, get)
    cone = {key: copy.deepcopy(nodes[key]) for key in algebra.EXPECTED_CONE}
    extra = {key: copy.deepcopy(nodes[key]) for key in EXPECTED_EXTRA_NODES}
    native_calls = [
        {"node": 517218, "registry": "expression:1", "arguments": [517175, 517017],
         "orders": [0, 1], "lexicalScope": [517015, 517016, 517017]},
        {"node": 517221, "registry": "expression:1", "arguments": [117055, 517017],
         "orders": [0, 1], "lexicalScope": [517015, 517016, 517017, 117055]},
        {"node": 517227, "registry": "expression:1", "arguments": [517175, 517017],
         "orders": [1, 1], "lexicalScope": [517015, 517016, 517017]},
    ]
    return {
        "schema": SCHEMA,
        "sourceHeaderRecordSHA256": HEADER_SHA256,
        "fixedDefinitionSHA256": FIXED_SHA256,
        "stage3SHA256": algebra.STAGE3_SHA256,
        "sourceConeCanonicalSHA256": CONE_SHA256,
        "sourceConeNodeCount": 83,
        "completeOriginalDerivativeCone": cone,
        "faceAndEndpointSourceNodes": extra,
        "selectedSourceNodes": nodes,
        "selectedSourceNodesCanonicalSHA256": digest(canonical(nodes)),
        "sourceComparison": {
            "actualNodeCountCompared": len(nodes),
            "everySelectedNodeStructurallyEqual": True,
            "fullSourceArchiveAuthenticatedByThisTool": False,
            "requiredInheritedAuthentication":
                "same original complete gzip/raw/parent stream under pinned Stage3",
        },
        "actualGuard": {"node": 517234, "sourceNode": copy.deepcopy(nodes["517234"]),
                        "coordinate": 517175, "left": 28814, "right": 28824},
        "actualCartesianCoordinates": {
            "x1": 517015, "x2": 517016, "eta": 517017, "X": 517175,
            "XFormula": "(x1^2+x2^2)/2", "r": 517177,
            "rFormula": "sqrt(2X)", "orderedDerivative": [517015, 517016, 517017],
        },
        "actualNative1Calls": native_calls,
        "native1DefinitionReference": {
            "registry": "expression:1", "parameters": [4756, 2], "body": 117047,
            "sourceWrapper": copy.deepcopy(nodes["117047"]),
            "definitionAssociationRequiresAcceptedDensityReceipt": True,
            "finiteOrdinaryNativeValuesProvedHere": False,
        },
        "actualRadialPrimitive": {
            "node": 517222, "sourceNode": copy.deepcopy(nodes["517222"]),
            "binder": 117055, "lower": 28814, "upper": 517175,
            "bodyCall": 517221, "orders": [0, 1],
            "intervalConvention": "oriented integral from a to Cartesian X; no widened interval",
        },
        "actualFaceIntegrals": face_scopes(),
        "actualFiniteFaceBox": {
            "coordinates": [517015, 517016, 517017],
            "coordinateSourceNodes": {str(i): copy.deepcopy(nodes[str(i)])
                                      for i in [517015, 517016, 517017]},
            "bounds": [[346574, 215514], [346574, 215514], [20, 1]],
            "radiusNode": 215514, "radiusSquareNode": 137008, "Xb": 28826,
            "radiusFormula": "sqrt(2*Xb)",
            "boxFormula": "[-sqrt(2*Xb),sqrt(2*Xb)]^2 x [-1,1]",
            "finitePositiveRadiusRequiresActualConstantProof": True,
            "coordinateBoxWidened": False,
        },
        "actualPositiveFaceIntegrand": {
            "node": 517237, "formula": "sqrt(1+E^2)", "E": 517234,
            "sourceNodes": {str(i): copy.deepcopy(nodes[str(i)])
                            for i in [517235, 517236, 517237]},
            "conditionalLowerBound": "sqrt(1+E^2)>=1 for every finite real actual E",
        },
        "actualSelectorAncestry": {
            "root": 617466, "face": 517240, "path": list(SELECTOR_PATH),
            "pathSourceNodes": {str(i): copy.deepcopy(nodes[str(i)]) for i in SELECTOR_PATH},
            "otherAncestorsOmittedFromThisFocusedBinding": True,
        },
        "lexicalScopeRules": [
            "Each integral binds its coordinate only in its body; its endpoints use the enclosing scope.",
            "The radial primitive binds117055 only in517221; Cartesian X517175 and eta517017 retain their actual outer meanings.",
            "A native1 argument tuple denotes the same registered function at that tuple; no caller coordinate box is transplanted into its lexical body.",
            "The exterior Cartesian guard restricts actual E, never the independent radial binder to the same Cartesian point.",
        ],
        "minimalUnprovedFiniteFacePremise": [
            "The same fixed-source endpoint Xb is finite and strictly positive; the original radius is sqrt(2Xb).",
            "The accepted actual density theorem must identify native expression1 and supply its finite ordinary eta and Xeta derivatives on the original positive-radius compact domain and inward eta endpoints.",
            "The literal oriented integral517222 of the actual eta derivative over a..X is finite on the active original guard, with its own binder117055.",
            "The guarded actual E517234 and sqrt(1+E^2)517237 are bounded piecewise integrable on the exact face box; continuity across Xplus and zero total axial moment are not assumed.",
        ],
        "actualFaceFinitenessProvedHere": False,
        "actualNativeDerivativeExistenceProvedHere": False,
        "actualAnalyticCompositionApplied": False,
        "actualFaceContinuityProvedHere": False,
        "actualStressPrimitiveJoinsProvedHere": False,
        "actualTotalAxialMomentZeroProvedHere": False,
        "numericalNormHonestyProvedHere": False,
        "originalBackground26ClosureProved": False,
        "wholeGOnJProved": False,
        "newOriginalGuardsDischarged": 0,
        "newOriginalJetsDischarged": 0,
        "newOriginalPDETermsDischarged": 0,
        "sourceDefinitionsConstantsQuantifiersAndOrderedDerivativesChanged": False,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    for name in ["background", "source-db", "stage3", "out"]:
        ap.add_argument("--" + name, type=Path, required=True)
    args = ap.parse_args(argv)
    inputs = [args.background, args.source_db, args.stage3]
    for path in inputs:
        require(args.out.resolve() != path.resolve(), "Cannot overwrite an original input")
        require(not args.out.exists() or not args.out.samefile(path),
                "Output aliases an original input")
    raw = args.background.read_bytes()
    background = json.loads(raw)
    get = algebra.load_live_source(args.source_db, args.stage3)
    try:
        result = audit(background, get)
        # Revalidate after collecting the receipt, including all live records.
        get.__call__.cache_clear()
        validate_source(background, get)
        require(args.background.read_bytes() == raw, "Background input changed during audit")
        require(digest(args.stage3.read_bytes()) == algebra.STAGE3_SHA256,
                "Inherited Stage3 changed during audit")
        result["inputBindings"] = [{"kind": "background", "file": args.background.name,
                                    "sha256": digest(raw)}]
        args.out.parent.mkdir(parents=True, exist_ok=True)
        for path in inputs:
            require(args.out.resolve() != path.resolve() and
                    (not args.out.exists() or not args.out.samefile(path)),
                    "Output aliases an original input")
        args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps({"schema": SCHEMA, "sourceConeNodes": 83,
                          "selectedSourceNodes": result["sourceComparison"]["actualNodeCountCompared"],
                          "originalFaceRoot": 517240, "actualFaceFinitenessProvedHere": False,
                          "newOriginalDischarged": 0}))
        return result
    finally:
        get.db.close()


if __name__ == "__main__":
    main()
