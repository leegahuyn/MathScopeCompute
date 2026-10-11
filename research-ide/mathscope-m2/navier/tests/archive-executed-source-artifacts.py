#!/usr/bin/env python3
"""Losslessly archive oversized executed artifacts without changing raw files.

The gzip header has mtime=0 and no original filename. The immutable manifest
records both encodings and verifies the decompressed ORIGINAL SHA256. This
script does not manufacture mathematical/source authentication.
"""
from __future__ import annotations

import argparse
import datetime
import gzip
import hashlib
import io
import json
import os
from pathlib import Path, PureWindowsPath
import sys

THRESHOLD = 8 * 1024 * 1024


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def git_blob_sha1(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()


def require_within(root: Path, path: Path) -> None:
    try:
        path.relative_to(root)
    except ValueError as error:
        raise ValueError("Artifact path escapes the repository root: " + str(path)) from error


def root_relative(root: Path, text: str, *, required: bool) -> Path:
    if not text or any(c in text for c in "\0\r\n") or Path(text).is_absolute() or PureWindowsPath(text).is_absolute():
        raise ValueError("Use a nonempty repository-relative path: " + repr(text))
    # Check lexical traversal before resolving symlinks.
    path = Path(os.path.abspath(root / text))
    require_within(root, path)
    require_within(root, path.resolve(strict=required))
    if path == root:
        raise ValueError("The artifact path must name a file.")
    return path


def deterministic_gzip(raw: bytes) -> bytes:
    out = io.BytesIO()
    # GzipFile uses the portable OS=255 byte; no path is placed in the header.
    with gzip.GzipFile(filename="", mode="wb", compresslevel=9, fileobj=out, mtime=0) as stream:
        stream.write(raw)
    return out.getvalue()


def literal_ignore_rule(name: str) -> str:
    # Leading slash anchors this exact basename in its containing directory.
    return "/" + "".join("\\" + c if c in "\\ #!*?[]" else c for c in name)


def archive(root: Path, raw_paths: list[str], manifest_relative: str) -> dict:
    manifest_path = root_relative(root, manifest_relative, required=False)
    if manifest_path.exists() or manifest_path.is_symlink():
        raise FileExistsError("Each invocation needs a new immutable manifest: " + str(manifest_path))
    if not manifest_path.parent.is_dir():
        raise ValueError("The manifest parent directory must already exist.")
    require_within(root, manifest_path.parent.resolve(strict=True))

    prepared = []
    seen = set()
    for relative in raw_paths:
        raw_path = root_relative(root, relative, required=True)
        if not raw_path.is_file():
            raise ValueError("The raw artifact is not a regular file: " + relative)
        if raw_path in seen:
            raise ValueError("Duplicate raw artifact: " + relative)
        seen.add(raw_path)
        raw = raw_path.read_bytes()
        row = {"rawPath": raw_path.relative_to(root).as_posix(), "rawBytes": len(raw),
               "rawSHA256": sha256(raw), "rawGitBlobSHA1": git_blob_sha1(raw)}
        if len(raw) <= THRESHOLD:
            row.update({"archived": False, "reason": "RAW_NOT_OVER_8_MiB"})
            prepared.append((raw_path, raw, None, None, row))
            continue
        gzip_path = root_relative(root, row["rawPath"] + ".gz", required=False)
        if gzip_path.is_symlink():
            raise ValueError("Do not write or reuse a symlink as a gzip archive: " + str(gzip_path))
        compressed = deterministic_gzip(raw)
        restored = gzip.decompress(compressed)
        if restored != raw or sha256(restored) != row["rawSHA256"]:
            raise ValueError("Lossless gzip round-trip verification failed: " + relative)
        if gzip_path.exists() and gzip_path.read_bytes() != compressed:
            raise FileExistsError("An existing gzip artifact has different bytes; it will not be overwritten: " + str(gzip_path))
        ignore_path = raw_path.parent / ".gitignore"
        if ignore_path.is_symlink():
            raise ValueError("Do not modify a symlink as .gitignore: " + str(ignore_path))
        row.update({"archived": True, "gzipPath": gzip_path.relative_to(root).as_posix(),
                    "gzipBytes": len(compressed), "gzipSHA256": sha256(compressed),
                    "gzipGitBlobSHA1": git_blob_sha1(compressed), "gzipMTime": 0,
                    "gzipHeaderFilename": "", "roundTripSHA256": sha256(restored),
                    "roundTripMatchesOriginal": True, "existingArchiveReused": gzip_path.exists(),
                    "ignorePath": ignore_path.relative_to(root).as_posix(),
                    "ignoreRule": literal_ignore_rule(raw_path.name)})
        prepared.append((raw_path, raw, gzip_path, compressed, row))

    ignore_edits = {}
    for raw_path, raw, gzip_path, compressed, row in prepared:
        if compressed is None:
            continue
        if not gzip_path.exists():
            # Exclusive creation never overwrites a prior executed archive.
            with gzip_path.open("xb") as stream:
                stream.write(compressed)
        else:
            if gzip_path.read_bytes() != compressed:
                raise FileExistsError("Archive changed after preflight: " + str(gzip_path))
        ignore_path = raw_path.parent / ".gitignore"
        if ignore_path not in ignore_edits:
            before = ignore_path.read_bytes() if ignore_path.exists() else b""
            ignore_edits[ignore_path] = {"before": before, "rules": []}
        ignore_edits[ignore_path]["rules"].append(row["ignoreRule"])

    ignore_records = []
    for path, edit in ignore_edits.items():
        before = edit["before"]
        text = before.decode("utf-8")
        existing = set(text.splitlines())
        additions = [rule for rule in edit["rules"] if rule not in existing]
        after = before
        if additions:
            after += (b"\n" if before and not before.endswith(b"\n") else b"") + ("\n".join(additions) + "\n").encode("utf-8")
            # Only exact, directory-anchored raw basenames are appended.
            path.write_bytes(after)
        ignore_records.append({"path": path.relative_to(root).as_posix(), "beforeSHA256": sha256(before),
                               "afterSHA256": sha256(after), "addedExactRules": additions})

    for path, raw, compressed_path, compressed, row in prepared:
        if path.read_bytes() != raw:
            raise ValueError("The original raw artifact changed during archiving: " + str(path))
        if compressed is not None and gzip.decompress(compressed_path.read_bytes()) != raw:
            raise ValueError("The stored gzip artifact no longer matches the raw bytes: " + str(path))
    manifest = {"schema": "MathScope.ExecutedSourceArtifactArchive/1",
                "createdAtUTC": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "thresholdBytes": THRESHOLD, "compression": {"format": "gzip", "level": 9, "mtime": 0, "filename": ""},
                "rawArtifactsPreserved": True, "sourceAuthorityCreated": False,
                "shaVerificationDomain": "Original decompressed bytes; callers keep their recorded raw SHA256.",
                "files": [row for *_, row in prepared], "gitignoreEdits": ignore_records}
    encoded = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    with manifest_path.open("xb") as stream:
        stream.write(encoded)
    return {"manifest": manifest_path.relative_to(root).as_posix(), "manifestBytes": len(encoded),
            "manifestSHA256": sha256(encoded), "manifestGitBlobSHA1": git_blob_sha1(encoded),
            "files": manifest["files"]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=str(Path(__file__).resolve().parents[4]), help="Repository root (defaults to this script's repository).")
    parser.add_argument("--manifest", required=True, help="New, immutable repository-relative manifest path.")
    parser.add_argument("raw_paths", nargs="+", help="Repository-relative original artifact paths; only files larger than 8 MiB are archived.")
    args = parser.parse_args()
    root = Path(args.root).resolve(strict=True)
    if not root.is_dir():
        parser.error("--root must be an existing directory")
    result = archive(root, args.raw_paths, args.manifest)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError) as error:
        print(type(error).__name__ + ": " + str(error), file=sys.stderr)
        raise SystemExit(1)
