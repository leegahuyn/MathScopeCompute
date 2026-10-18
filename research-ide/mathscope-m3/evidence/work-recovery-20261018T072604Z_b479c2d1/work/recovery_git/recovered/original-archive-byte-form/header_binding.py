"""Bind a detached registry header to the first record of the source gzip.

This is an input-integrity gate, not a mathematics verifier.  Its caller must
still authenticate the full source stream with the inherited Stage 3 verifier.
The returned header comes from the gzip record, never the detached JSON file.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import math
from pathlib import Path
from typing import Any


class HeaderBindingError(ValueError):
    """The detached header is not an unambiguous copy of the source header."""


def _unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise HeaderBindingError("Duplicate JSON object key: " + key)
        result[key] = value
    return result


def _reject_constant(value: str) -> None:
    raise HeaderBindingError("Non-finite JSON constant is forbidden: " + value)


class _ExactFloatToken(str):
    """Preserve numeric spelling during comparison without float rounding."""


def _finite_float(value: str) -> _ExactFloatToken:
    number = float(value)
    if not math.isfinite(number):
        raise HeaderBindingError("Non-finite JSON number is forbidden: " + value)
    return _ExactFloatToken(value)


def _parse(raw: bytes, origin: str) -> dict[str, Any]:
    try:
        value = json.loads(
            raw.decode("utf-8"),
            object_pairs_hook=_unique_object,
            parse_constant=_reject_constant,
            parse_float=_finite_float,
        )
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise HeaderBindingError("Invalid JSON in " + origin) from error
    if not isinstance(value, dict):
        raise HeaderBindingError(origin + " must contain a JSON object")
    if not isinstance(value.get("definitions"), dict):
        raise HeaderBindingError(origin + " must contain an object-valued definitions registry")
    return value


def canonical_header(value: dict[str, Any]) -> bytes:
    """Type-sensitive JSON; decimal tokens retain their exact source spelling.

    Whitespace and object key ordering are ignored. Differently written
    decimals may be conservatively rejected; distinct decimals can never be
    accepted merely because Python rounds them to the same binary float.
    """
    def encode(item: Any) -> str:
        if isinstance(item, _ExactFloatToken):
            return str(item)
        if isinstance(item, dict):
            return "{" + ",".join(
                json.dumps(key, ensure_ascii=False) + ":" + encode(item[key])
                for key in sorted(item)
            ) + "}"
        if isinstance(item, list):
            return "[" + ",".join(encode(child) for child in item) + "]"
        return json.dumps(item, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    return encode(value).encode("utf-8")


def bind_header_to_gzip(
    source_gzip: str | Path,
    detached_header: str | Path,
    *,
    max_header_bytes: int = 64 * 1024 * 1024,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Reject a detached-header mismatch and return the gzip-derived header.

    Invoke this BEFORE the Stage 4 replay.  Then run Stage 3's full compressed
    hash, uncompressed hash, node count and source-node authentication against
    the same immutable input gzip.  This gate alone does not authenticate any
    graph hash or establish that a function exists or is differentiable.
    """
    if type(max_header_bytes) is not int or max_header_bytes < 1:
        raise HeaderBindingError("max_header_bytes must be a positive integer")
    source_gzip = Path(source_gzip)
    detached_header = Path(detached_header)
    try:
        with gzip.open(source_gzip, "rb") as stream:
            first_record = stream.readline(max_header_bytes + 1)
        with detached_header.open("rb") as stream:
            detached_raw = stream.read(max_header_bytes + 1)
    except (OSError, EOFError) as error:
        raise HeaderBindingError("Unable to read source gzip or detached header") from error
    if not first_record or not first_record.endswith(b"\n"):
        raise HeaderBindingError("Missing complete newline-terminated source header record")
    if len(first_record) > max_header_bytes or len(detached_raw) > max_header_bytes:
        raise HeaderBindingError("Header exceeds explicit input size limit")
    source = _parse(first_record, "source gzip header")
    detached = _parse(detached_raw, "detached header")
    source_canonical = canonical_header(source)
    detached_canonical = canonical_header(detached)
    if source_canonical != detached_canonical:
        raise HeaderBindingError("Detached header differs from source gzip header")
    evidence = {
        "schema": "MathScope.N6.SourceHeaderBinding/1",
        "sourceHeaderCanonicalSHA256": hashlib.sha256(source_canonical).hexdigest(),
        "sourceHeaderRecordSHA256": hashlib.sha256(first_record).hexdigest(),
        "detachedHeaderFileSHA256": hashlib.sha256(detached_raw).hexdigest(),
        "canonicalJSONEqual": True,
        "typeSensitiveComparison": True,
        "registryConsumedFrom": "source gzip first record",
        "fullGraphAuthenticatedByThisGate": False,
        "requiredNextGate": "Inherited Stage 3 authentication of the same complete source gzip",
        "mathematicalObligationsDischarged": 0,
    }
    # Preserve the ordinary json.loads value types expected by the inherited
    # registry consumer, after the exact-token comparison has succeeded.
    return json.loads(first_record), evidence


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-gzip", required=True, type=Path)
    parser.add_argument("--detached-header", required=True, type=Path)
    parser.add_argument("--evidence", required=True, type=Path)
    arguments = parser.parse_args()
    try:
        _, receipt = bind_header_to_gzip(arguments.source_gzip, arguments.detached_header)
    except HeaderBindingError as error:
        parser.exit(2, str(error) + "\n")
    arguments.evidence.parent.mkdir(parents=True, exist_ok=True)
    arguments.evidence.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(receipt, ensure_ascii=False))
