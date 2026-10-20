#!/usr/bin/env python3
"""Restore the exact archived public site source; never overwrite different bytes."""
from pathlib import Path
import gzip, hashlib, json
root = Path(__file__).resolve().parent
meta = json.loads((root / "REPOSITORY_STORAGE.json").read_text(encoding="utf-8"))
packed = (root / meta["stored_path"]).read_bytes()
assert len(packed) == meta["stored_bytes"]
assert hashlib.sha256(packed).hexdigest() == meta["stored_sha256"]
raw = gzip.decompress(packed)
assert len(raw) == meta["original_bytes"]
assert hashlib.sha256(raw).hexdigest() == meta["original_sha256"]
target = root / meta["original_path"]
if target.exists():
    assert target.read_bytes() == raw, "Refusing to overwrite a different file"
else:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(raw)
print(json.dumps({"restored": str(target), "bytes": len(raw), "sha256": meta["original_sha256"], "verified": True}))
