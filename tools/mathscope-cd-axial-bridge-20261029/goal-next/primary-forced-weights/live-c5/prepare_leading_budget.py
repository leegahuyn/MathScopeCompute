"""Raise only the authenticated leading expression-graph storage limit."""

from argparse import ArgumentParser
from hashlib import sha1, sha256
import json
from pathlib import Path


SOURCE = "research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs"
BLOB = "854bb862276d03c236b2df73ba1bb9a61373c4df"
OLD = b"if(this.nodes.length>=350000)fail("
NEW = b"if(this.nodes.length>=1400000)fail("


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("source_tree", type=Path)
    parser.add_argument("out", type=Path)
    args = parser.parse_args()
    path = args.source_tree / SOURCE
    original = path.read_bytes()
    assert sha1(f"blob {len(original)}\0".encode() + original).hexdigest() == BLOB
    assert original.count(OLD) == 1 and NEW not in original
    updated = original.replace(OLD, NEW)
    assert updated.count(NEW) == 1 and updated.replace(NEW, OLD) == original
    path.write_bytes(updated)
    receipt = {
        "source": SOURCE, "originalGitBlob": BLOB,
        "oldSHA256": sha256(original).hexdigest(), "newSHA256": sha256(updated).hexdigest(),
        "limit": {"old": 350000, "new": 1400000},
        "originalBytesRecoveredByInverseReplacement": True,
    }
    args.out.write_bytes((json.dumps(receipt, indent=2) + "\n").encode())


if __name__ == "__main__":
    main()
