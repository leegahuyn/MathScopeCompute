"""Expand one finite resource admission limit in an isolated original checkout."""
from hashlib import sha1, sha256
from pathlib import Path
import json
import sys

source = Path(sys.argv[1])
receipt = Path(sys.argv[2])
old = source.read_bytes()
assert sha1(f"blob {len(old)}\0".encode() + old).hexdigest() == "1f1c18a26372c998d8389b6c5138b3c9d3a66f36"
old_limit = b"maxNodes>4000000"
new_limit = b"maxNodes>16000000"
assert old.count(old_limit) == 1 and new_limit not in old
patched = old.replace(old_limit, new_limit)
assert patched.replace(new_limit, old_limit) == old
source.write_bytes(patched)
receipt.write_text(json.dumps({
    "oldSHA256": sha256(old).hexdigest(),
    "newSHA256": sha256(patched).hexdigest(),
    "changedExpression": [old_limit.decode(), new_limit.decode()],
    "originalBytesRecoveredByInverseReplacement": True,
}, indent=2) + "\n", encoding="utf-8")
