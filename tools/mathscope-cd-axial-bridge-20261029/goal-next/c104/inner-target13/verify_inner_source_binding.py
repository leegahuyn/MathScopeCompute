"""Check lexical equality of the three rebuilt original inner factor roots."""

from hashlib import sha256
from pathlib import Path
import gzip
import json
import runpy
import sys


def pinned(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return data


goal, rebuild_path, receipt_path = map(Path, sys.argv[1:])
target_dir = goal / "whole-k-annular-wrz-norm"
band = goal / "primary-forced-join/active-n3-c5-binding/first-wave-guard-traces"
digest_path = band / "outer-normalized-amplitude/verify_live_outer_source.py"
pinned(digest_path, "f1acd10897e224cc9151e9485d08aad9c1d82858a3ac710ac0510b6a73c07a02")
digest = runpy.run_path(str(digest_path))["SourceDigest"]
compressed = pinned(target_dir / "target-c7-graph.jsonl.gz",
                    "6aa5a4aa57466efa0fc80a7137675284e8a3fc84d308312e95f48298efda4625")
raw = gzip.decompress(compressed)
raw_sha = sha256(raw).hexdigest()
assert raw_sha == "8ecdc6d5ba6faae0114249a5041eee1d8af1268e1ec98cc4f526a8b615bb70e5"
header, *records = map(json.loads, raw.splitlines())
assert header["nodeCount"] == len(records) == 153455
rebuilt = json.loads(pinned(rebuild_path,
                            "9f8174d9c0fc16143868bb0f6788815bc9bac02ef02c83ba5c518f3039c84cee"))
old = digest(records.__getitem__, json.loads(header["definitions"]["expression"]))
new = digest(rebuilt["factorNodes"].__getitem__, [])
assert len(rebuilt["factorNodes"]) == 6516
assert rebuilt["factorRoots"]["eta"] == 2
rebuilt_args = (rebuilt["factorRoots"]["innerLogDistance"], 2)
roots = [
    ("innerFactor", 117782, "3b4dece873c90e298e39581d910851f3c763e2514c5a40102ea2b77a5faeb164"),
    ("innerTheta", 118522, "ef1ed0454dfd42a25917982ce986dae98dcc97c5fd0f0ebb4336a0cb575a9190"),
    ("innerZ", 119069, "a87c1091b3731960e925b27bfa5a86f2e201bc09534a881b56397d7034984b1b"),
]
checks = []
for name, original, expected in roots:
    rebuilt_root = rebuilt["factorRoots"][name]
    assert old.of(original, (117676, 2)) == new.of(rebuilt_root, rebuilt_args) == expected
    checks.append({"name": name, "historicalRoot": original, "rebuiltRoot": rebuilt_root,
                   "boundLexicalSHA256": expected})
assert records[119712] == {"op": "multiply", "args": [118522, 119711]}
assert records[119713] == {"op": "multiply", "args": [119069, 119711]}
assert records[119711]["op"] == "multiply"
receipt = {"schema": "MathScope.C104.OriginalInnerRegularSourceBinding/1",
           "status": "VERIFIED_ORIGINAL_INNER_FACTOR_LEXICAL_BINDING",
           "historicalGraphSHA256": raw_sha, "historicalGraphNodes": len(records),
           "rebuiltSourceGraphNodes": len(rebuilt["factorNodes"]),
           "factorChecks": checks, "regularRootProducts": [[119712, 118522, 119711], [119713, 119069, 119711]],
           "historicalOrderedArguments": [117676, 2], "rebuiltOrderedArguments": list(rebuilt_args)}
receipt_path.write_bytes((json.dumps(receipt, indent=2) + "\n").encode())
print(f"Original inner lexical binding passed for {len(checks)} roots and two wrapper products")
