from argparse import ArgumentParser
import gzip
from hashlib import sha256
import json
from pathlib import Path

p = ArgumentParser()
p.add_argument("--source", type=Path, required=True)
p.add_argument("--out", type=Path, required=True)
a = p.parse_args()
source = a.source
index = {17732737,17732748,17732749,17732750,17745430,17745431,
    19570771,19570920,19570922,19570927,19570929,
    21374923,21374927,21374945,21374946,21374947,21374948,
    22150796,22150797,22150943,22150945,22151940,22151941,
    22151944,22151945,22151952,22151962,22151963,22151964,
    22151965,22151966,22153217,22153219,22153221,22153222,
    22153223,22153224,22154876}
need = index | set(range(22150935,22150955)) | set(range(22153216,22153225))
digest = sha256()
rows = {}
with gzip.open(source / "original-source-nodes.jsonl.gz", "rb") as stream:
    header = stream.readline()
    assert json.loads(header) == {"schema": "MathScope.M3.FullNodesJSONL/1", "node_count": 22155584}
    digest.update(header)
    for ordinal, raw in enumerate(stream):
        digest.update(raw)
        if ordinal in need:
            rows[str(ordinal)] = json.loads(raw)
assert ordinal + 1 == 22155584 and rows.keys() == set(map(str, need))
assert digest.hexdigest() == "faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
native = (source / "original-source-functions.json").read_bytes()
assert sha256(native).hexdigest() == "e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03"
registry = json.loads(json.loads(native)["definitions"])[0]
named = {r["name"]:r for r in registry
         if r["name"] in ["PostSignedFiveBump_v","PostSignedFiveBump_beta","PostSignedFiveBump_gamma"]
          or r["body"] in need}
a.out.write_bytes((json.dumps({"sourceNodes": ordinal + 1, "sourceSHA256": digest.hexdigest(),
                  "nativeSHA256": sha256(native).hexdigest(), "nodes": rows, "registry": named},
                 indent=2) + "\n").encode())
print("PASS original source hash, active registry, protected records", len(rows), len(named))
