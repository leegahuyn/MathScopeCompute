#!/usr/bin/env python3
"""Validate release metadata and create release notes; no network or credentials."""
import json
import os
from pathlib import Path
import posixpath
import re
from urllib.parse import quote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
metadata = json.loads((ROOT / "RELEASE.json").read_text())
if not re.fullmatch(r"mathscope-research-en-[A-Za-z0-9._-]{1,60}", metadata["tag"]):
    raise ValueError("Unexpected English release tag")
if not isinstance(metadata["title"], str) or not metadata["title"].strip() or "\n" in metadata["title"]:
    raise ValueError("Invalid release title")
receipt = json.loads((ROOT / "dist/MathScope_M0_M1_English_Full.package-receipt.json").read_text())
if not (receipt["status"] == "ZIP_CONTENT_VERIFIED" and receipt["originalMembersIncluded"] == 935
        and receipt["allOriginalMembersIncluded"] and receipt["crcVerified"]
        and receipt["everyMemberHashVerified"] and receipt["sourcePinsMatched"] == 50):
    raise ValueError("Full source and evidence ZIP was not completely verified")
notes = "# " + metadata["title"] + "\n\n"
notes += ("This English edition preserves all **935 members** of the previously delivered "
          "v54 source/evidence archive. It adds English guides, all 70 original acceptance "
          "criteria, a 59-example English launcher, and separately identified follow-up evidence. "
          "Original mathematical sources and historical evidence retain their original bytes.\n\n")
notes += f"ZIP SHA-256: `{receipt['sha256']}`\n\n"
notes += ("The ZIP includes its full member manifest. The separate checksum and package receipt "
          "are attached to this release. Packaging success is an integrity check and does not "
          "promote any unproved mathematical obligation.\n\n")
release_repo = os.environ.get("GITHUB_REPOSITORY", "leegahuyn/MathScopeCompute")
release_ref = os.environ.get("GITHUB_SHA", metadata["tag"])
if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", release_repo):
    raise ValueError("Invalid repository for release-note links")
if not re.fullmatch(r"[A-Za-z0-9._-]+", release_ref):
    raise ValueError("Invalid release reference for release-note links")


def absolute_doc_link(match):
    target = match.group(1)
    parts = urlsplit(target)
    if parts.scheme or parts.netloc or not parts.path or parts.path.startswith("/"):
        return match.group(0)
    path = posixpath.normpath(posixpath.join("research-ide/docs", parts.path))
    if path == ".." or path.startswith("../"):
        raise ValueError("Release-note link escapes the repository")
    url = f"https://github.com/{release_repo}/blob/{release_ref}/{quote(path, safe='/')}"
    if parts.fragment:
        url += "#" + quote(parts.fragment, safe="-_")
    return "](" + url + ")"


status_text = (ROOT / "docs/CURRENT_STATUS_EN.md").read_text()
notes += re.sub(r"\]\(([^)]+)\)", absolute_doc_link, status_text)
(ROOT / "dist/RELEASE_NOTES.md").write_text(notes)
print(json.dumps({"tag": metadata["tag"], "originalMembers": 935,
                  "zipSHA256": receipt["sha256"], "notes": "dist/RELEASE_NOTES.md"}))
