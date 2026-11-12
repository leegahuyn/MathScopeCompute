"""Raise the exact alpha-equivalence visit limit in the owned original run."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path


SOURCE = "research-ide/mathscope-m2/navier/actual-global-primitive-kernels.mjs"
ORIGINAL = "efebfbcfb124f5bed96bf13435333cb784a0d5cab319303a0244c788ce1bed59"
OLD = b"export function explicitPrimitiveBodyIdentity(G,left,right,{atomicNodes=[],maxVisits=300000}={})"
NEW = OLD.replace(b"300000", b"1200000")


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("runtime", type=Path)
    parser.add_argument("receipt", type=Path)
    args = parser.parse_args()
    path = args.runtime / SOURCE
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == ORIGINAL
    assert raw.count(OLD) == 1 and NEW not in raw
    patched = raw.replace(OLD, NEW)
    assert patched.replace(NEW, OLD) == raw
    path.write_bytes(patched)
    receipt = {
        "oldSHA256": ORIGINAL,
        "newSHA256": sha256(patched).hexdigest(),
        "defaultVisitLimit": [300000, 1200000],
        "originalBytesRecoveredByInverseReplacement": True,
    }
    args.receipt.write_bytes((json.dumps(receipt, indent=2) + "\n").encode())


if __name__ == "__main__":
    main()
