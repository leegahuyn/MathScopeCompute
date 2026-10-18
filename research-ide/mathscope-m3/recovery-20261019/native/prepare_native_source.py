#!/usr/bin/env python3
"""Extract a small byte-authenticated capsule of the existing slow inverse.

This reads existing source/record closure. It does not regenerate the 700 raw
records, 3,407 indexed records, or any expensive mathematical execution.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path

EXPECTED = {
    "header": "f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1",
    "closure": "2cbb5c74eb58ef82f948a19bad00a299c38b802cb8e668e94da8e34a37f77e91",
    "profile": "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a",
}
RELATIVE_PATHS = {
    "header": "recovered/base/analysis/base/PR30-primary67-continuation/pressure-proof/angular-pde/ANGULAR_ORIGINAL_HEADER.json",
    "closure": "work/prune_recovery/scalar/evidence/RAW_INITIALIZED_SCALAR_CLOSURE.json",
    "profile": "recovered/base/work/n602_continuation/source/research-ide/mathscope-m2/navier/source-profile-data.mjs",
}
EXPECTED_CAPSULE_PAYLOAD_SHA256 = "adec1be9fb28cdca2238d99a2126e5d8c444ca0bebc442d8cbb7a746d69c0d60"

def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()

def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()

def prepare(recovery_root: Path):
    inputs = {}
    content = {}
    for key, relative in RELATIVE_PATHS.items():
        path = recovery_root / relative
        data = path.read_bytes()
        sha = hashlib.sha256(data).hexdigest()
        if sha != EXPECTED[key]:
            raise ValueError(f"Original source byte pin mismatch: {relative}")
        content[key] = data.decode()
        inputs[key] = {"path": relative, "sha256": sha, "bytes": len(data)}
    header = json.loads(content["header"])
    closure = json.loads(content["closure"])
    if closure["source_header_sha256"] != EXPECTED["header"]:
        raise ValueError("Record closure is bound to a different header")
    registry = {}
    def unpack(tree):
        for key, value in tree.items():
            if key == "base":
                unpack(value)
            elif isinstance(value, str):
                try:
                    registry[key] = json.loads(value)
                except json.JSONDecodeError:
                    pass
    unpack(header["definitions"])
    definition = registry["monotone"][2]
    if digest(definition) != "a7b26202a039c4a338e0210e99ea2329c40323d6d6615d3a2519fc097d12dfa0":
        raise ValueError("ActualCommonBandSlowInverse definition changed")
    profile = json.loads(content["profile"].split("export const PINNED_N3 = ", 1)[1].strip().removesuffix(";"))
    expected_parameters = {
        "Md": {"integer": 1048576},
        "T": {"sum": [{"exp": {"ref": "Md"}}, {"integer": 10}]},
        "h": {"exp": {"product": [{"integer": -8002}, {"ref": "T"}]}},
    }
    actual_parameters = {key: profile["parametersExactExpressions"][key] for key in expected_parameters}
    if actual_parameters != expected_parameters:
        raise ValueError("Original nonzero h expression changed")
    expected_nodes = {
        9: ("source_parameter", ["h"]), 19: ("rational", ["1", "2"]),
        24: ("rational", ["2", "1"]), 20: ("rational", ["-1", "1"]),
        25: ("multiply", [9, 24]), 622811: ("integer_power", [622803, 2]),
        622812: ("log_positive", [622810]), 622813: ("multiply", [25, 622812]),
        622814: ("exp", [622813]), 622815: ("multiply", [622811, 622814]),
        622816: ("multiply", [20, 622815]), 622817: ("add", [622810, 622816]),
        622818: ("multiply", [20, 622804]), 622819: ("add", [622817, 622818]),
        622820: ("actual_monotone_root", [2, 622803, 622804]),
        623935: ("actual_monotone_root", [2, 623921, 623934]),
    }
    for node_id, (op, args) in expected_nodes.items():
        if closure["records"][str(node_id)] != {"op": op, "args": args}:
            raise ValueError(f"Original slow residual AST differs at {node_id}")
    ids = sorted(set(expected_nodes) | {622803, 622804, 622810})
    result = {
        "schema": "MathScope.ActualSlowInverseSourceCapsule/1",
        "implementation_kind": "NEW native evaluator source capsule; not recovered lost implementation",
        "source_inputs": inputs,
        "definition": definition,
        "definition_sha256": digest(definition),
        "records": {str(node_id): closure["records"][str(node_id)] for node_id in ids},
        "parameter_expressions": actual_parameters,
        "parameter_expression_family_sha256": profile["parameterExpressionSHA256"],
        "paper": {"sha256": profile["sourcePaperSHA256"], "pdf_pages": [7, 24, 62, 63], "equations": ["3.2", "4.1", "6.1"]},
        "call_nodes": [622820, 623935],
        "original_expression": "s - Z^2*exp(2*h*log(s)) - T",
        "h_expression": "exp(-8002*(exp(1048576)+10))",
        "h_strictly_positive": True,
        "h_replaced_by_zero": False,
        "original_source_changed": False,
        "new_M3_closures": 0,
    }
    result["capsule_payload_sha256"] = digest(result)
    if result["capsule_payload_sha256"] != EXPECTED_CAPSULE_PAYLOAD_SHA256:
        raise ValueError("Extracted complete source capsule differs from the reviewed byte-pinned identity")
    return result

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--recovery-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    capsule = prepare(args.recovery_root.resolve())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(capsule, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"source_capsule": str(args.output), "records": len(capsule["records"]), "source_calls": capsule["call_nodes"], "new_M3_closures": 0}))

if __name__ == "__main__":
    main()
