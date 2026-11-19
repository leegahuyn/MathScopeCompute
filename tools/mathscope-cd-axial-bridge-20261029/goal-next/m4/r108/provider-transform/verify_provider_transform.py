"""Replay a calibrated, read-only WebsitePublisher representation transform."""

import argparse
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path
import re


CONTROL_PUBLIC = "5308764d429ad401b70cce1e1b2152eaaeb8eede04db7a9aee96abf2d50d76c4"
PRODUCTION_PUBLIC = "a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48"
FRAGMENT_RECEIPT = "2e8ad1d4890842b1c52fe899dcee8ba7c41c5cd3cc5f9dda202b9957d4856d35"
BASELINE_BLOB = "b7673347278aa73a72d5a41cc9e62cee7945d05b"
MARKER_BLOB = "8f0c8e01221ebaa47fff7a778cb1ee865e74f68a"
TITLE_DESC = re.compile(rb'(<title>[^<]+</title>)\n  (<meta name="description"[^>]+>)')
SEO_GAP = b"\n  \n  \n  "
LATE_HEAD = b'\n<meta name="disable-service-worker" content="true">\n\n<meta property="og:title"'
WPE_DEBUG = b"<!-- WPE-DEBUG path=api slug="


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def git_blob_id(data):
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def locate(data, marker):
    start = data.index(marker)
    assert data.find(marker, start + 1) == -1, marker
    return start


def tags_from(data):
    tags = TITLE_DESC.findall(data[:1500])
    assert len(tags) == 1
    return list(tags[0])


@dataclass(frozen=True)
class Edit:
    role: str
    start: int
    end: int
    replacement: bytes = b""


def edit(data, changes):
    """Apply checked nonoverlapping edits, then replay the exact reverse transform."""
    start = 0
    result = bytearray()
    reverse = []
    audit = []
    for change in sorted(changes, key=lambda row: row.start):
        assert start <= change.start < change.end <= len(data), change.role
        result.extend(data[start:change.start])
        result_start = len(result)
        result.extend(change.replacement)
        removed = data[change.start:change.end]
        reverse.append((result_start, len(result), removed))
        audit.append({
            "role": change.role, "publicRange": [change.start, change.end],
            "publicRangeSHA256": sha256(removed), "replacementBytes": len(change.replacement),
        })
        start = change.end
    result.extend(data[start:])
    rendered_again = bytearray()
    pos = 0
    for begin, end, original in reverse:
        rendered_again.extend(result[pos:begin])
        rendered_again.extend(original)
        pos = end
    rendered_again.extend(result[pos:])
    assert rendered_again == data
    return bytes(result), audit


def platform_edits(data, tags, alternate_newline=False):
    initial_head = data.index(b"<head>") + len(b"<head>")
    charset = data.index(b"\n  <meta charset=", initial_head, 1500)
    assert b"__wpTranslateGuard" in data[initial_head:charset]
    end_head = data.index(b"</head>")
    late_head = locate(data[:end_head], LATE_HEAD)
    assert data[end_head - 1:end_head] == b"\n"
    seo_gap = locate(data[charset:charset + 500], SEO_GAP) + charset
    body = locate(data, WPE_DEBUG) - 1
    end_body = data.rindex(b"</body>")
    tail = data[body:end_body]
    assert tail[:1] == b"\n"
    assert b'<div id="wpa-widget"' in tail and b"window.__wpPv" in tail
    assert all(len(tag) > 0 and b"\n" not in tag for tag in tags)
    seo_original = b"\n  " + b"\n  ".join(tags) + b"\n  "
    split = int(alternate_newline)
    return [
        Edit("head prelude", initial_head, charset),
        Edit("retained raw title and description", seo_gap, seo_gap + len(SEO_GAP), seo_original),
        Edit("head suffix", late_head, end_head - 1 + split),
        Edit("body WPE/platform suffix", body + split, end_body),
    ]


def tested_fragments(data, receipt, marker_block):
    matches = receipt["matches"]
    assert len(matches) == 14
    edits = []
    for item in matches:
        start = item["byteOffset"]
        size = item["byteLength"]
        assert sha256(data[start:start + size]) == item["providerSHA256"] == item["localSHA256"]
        expected = f'<!--#wps-include fragment="{item["name"]}" -->'.encode()
        assert marker_block.count(expected) == 1
        edits.append(Edit(item["name"], start, start + size, expected))
    assert sum(e.end - e.start for e in edits) == 1125144
    assert sum(len(e.replacement) for e in edits) == 923
    return edits


def inspect(args):
    observation = json.loads(args.observation.read_bytes())
    control_info = observation["calibration"]
    production_info = observation["production"]
    assert (control_info["slug"], control_info["version"], control_info["versionHash"]) == (
        "desktop-source.html", 6, "d60acd51"
    )
    assert (production_info["slug"], production_info["version"], production_info["versionHash"]) == (
        "v0.3.1.html", 137, "9171eb0c"
    )
    assert not production_info["withinTier"] and observation["project"] == 29770

    control = args.control_http.read_bytes()
    public = args.production_http.read_bytes()
    baseline = args.baseline.read_bytes()
    markers = args.markers.read_bytes()
    fragment_json = args.fragment_receipt.read_bytes()
    assert sha256(control) == CONTROL_PUBLIC
    assert sha256(public) == PRODUCTION_PUBLIC
    assert sha256(fragment_json) == FRAGMENT_RECEIPT
    assert git_blob_id(baseline) == BASELINE_BLOB
    assert git_blob_id(markers) == MARKER_BLOB

    witness = json.loads(args.control_witness.read_bytes())
    control_tags = [tag.encode() for tag in witness["exactStrippedTags"]]
    assert sum(map(len, control_tags)) == 139
    assert witness["editableSHA256"].startswith(control_info["versionHash"])
    recovered, calibration_edits = edit(control, platform_edits(control, control_tags))
    if args.control_editable is not None:
        authenticated = json.loads(args.control_editable.read_bytes())["content"].encode()
        assert authenticated == recovered
        assert tags_from(authenticated) == control_tags
    assert len(recovered) == control_info["storedVersionBytes"] == witness["editableBytes"]
    assert sha256(recovered) == witness["editableSHA256"]
    mutated_tags = [control_tags[0].replace(b"Desktop", b"desktop", 1), control_tags[1]]
    assert mutated_tags[0] != control_tags[0] and len(mutated_tags[0]) == len(control_tags[0])
    other_source, _ = edit(control, platform_edits(control, mutated_tags))
    assert len(other_source) == len(recovered) and sha256(other_source) != sha256(recovered)

    fragment_edits = tested_fragments(public, json.loads(fragment_json), markers)
    prior_tags = tags_from(baseline)
    assert sum(map(len, prior_tags)) == 366
    candidates = []
    for alternate in (False, True):
        current, audit = edit(public, platform_edits(public, prior_tags, alternate) + fragment_edits)
        digest = sha256(current)
        stored_size = production_info["storedVersionBytes"]
        assert len(current) == stored_size == 29580450
        assert len(current) - sum(map(len, prior_tags)) == 29580084
        assert not digest.startswith(production_info["versionHash"])
        candidates.append({
            "sha256": digest, "bytes": len(current), "sameLengthAsProviderStoredPage": True,
            "providerShortHashMatch": False, "exactPublicRoundTrip": True,
            "reassignClosingNewlineFromHeadToBody": alternate, "edits": audit,
        })
    assert candidates[0]["sha256"] != candidates[1]["sha256"]

    return {
        "schema": "MathScope.R108.C87.CalibratedEditableReadback/1",
        "status": "VERIFIED_CONTROL_ROUNDTRIP_AND_PRODUCTION_IDENTITY_REJECTION",
        "observationSHA256": sha256(args.observation.read_bytes()),
        "controlWitnessSHA256": sha256(args.control_witness.read_bytes()),
        "control": {
            "metadata": control_info, "httpBytes": len(control), "httpSHA256": CONTROL_PUBLIC,
            "editableSHA256": sha256(recovered), "matchesAuthenticatedFullDigest": True,
            "exactPublicRoundTrip": True, "edits": calibration_edits,
            "nonInjectiveControl": {
                "mutation": "Desktop → desktop in the raw title, retaining the same frozen provider metadata",
                "differentEditableSHA256": sha256(other_source), "sameEditableLength": True,
                "sameServedBytesUnderMeasuredTransform": True,
                "scope": "Local replay of removed source text with fixed stored page metadata. No upload.",
            },
        },
        "production": {
            "metadata": production_info, "httpBytes": len(public), "httpSHA256": PRODUCTION_PUBLIC,
            "sameOperatingSnapshotSHA256": True, "sameFragmentSHA256Count": len(fragment_edits),
            "historicalRawHeaderGitBlob": BASELINE_BLOB, "includeMarkerGitBlob": MARKER_BLOB,
            "nativeTitleAndDescriptionRecoveredFromProvider": False,
            "candidates": candidates, "editableSourceIdentity": "OPEN",
        },
        "acceptance": {
            "declaredReleaseScopeAndGlobalHoldAreSeparate": True,
            "required": ["exact claimed operational candidate and its evidence owner",
                         "prepared patch, tests and recovery materials bound to the claimed candidate",
                         "actual matching operational publication and post-publication screen and behavior"],
            "originalCriterionRequiresAPerformedProductionRollback": False,
            "isolatedCandidateAccepted": "16/16 in separately recorded owner-private scope",
            "operationalR1-08": "OPEN", "release": "HOLD",
        },
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for field in ("observation", "control-witness", "control-http", "production-http",
                  "fragment-receipt", "baseline", "markers", "out"):
        parser.add_argument("--" + field, type=Path, required=True)
    parser.add_argument("--control-editable", type=Path)
    args = parser.parse_args()
    if not __debug__:
        parser.error("Python assertions must remain enabled")
    result = inspect(args)
    with args.out.open("x", encoding="utf-8", newline="\n") as output:
        json.dump(result, output, indent=2, ensure_ascii=False)
        output.write("\n")
    print(result["status"])
