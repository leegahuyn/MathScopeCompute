#!/usr/bin/env python3
"""Read-only review of the exact two-archive addon packaging change.

Only the source-file collection helpers are evaluated. Full release validation,
manifest generation, package generation, tests, Lean and Comparator are not run.
Negative controls change in-memory policy dictionaries, never repository files.
"""
from __future__ import annotations
import argparse
import ast
import copy
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re

HERE = Path(__file__).resolve().parent


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def helper_namespace(source, root):
    tree = ast.parse(source)
    names = {"sha", "read_json", "require", "edition_files", "validate_addon_root", "addon_files"}
    constants = {"MANIFEST", "ORIGINAL_ROOTS", "ARCHIVE_MEMBERS_ROOT", "SKIP_DIRS", "SKIP_FILES"}
    selected = []
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name in names:
            selected.append(node)
        elif isinstance(node, ast.Assign) and all(isinstance(x, ast.Name) and x.id in constants for x in node.targets):
            selected.append(node)
    scope = {"ROOT": root, "hashlib": hashlib, "json": json, "os": os, "Path": Path, "PurePosixPath": PurePosixPath, "re": re}
    exec(compile(ast.Module(body=selected, type_ignores=[]), "actual-file-collection-helpers", "exec"), scope)
    return scope


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists() or not args.output.resolve().is_relative_to(HERE):
        parser.error("Use a new receipt path in this review directory")
    inputs = json.loads((HERE / "source-snapshots.json").read_text())
    root = Path(inputs["researchIDERoot"])
    checks = []

    def check(name, ok, detail=None):
        row = {"name": name, "pass": bool(ok)}
        if detail is not None:
            row["detail"] = detail
        checks.append(row)

    for row in inputs["inputs"]:
        path = HERE / row["snapshotRelativePath"]
        check("source snapshot bytes and hash: " + path.name, path.stat().st_size == row["bytes"] and sha(path) == row["sha256"])
    current_source = (HERE / "inputs/verify_english_release.current.py").read_text()
    previous_source = (HERE / "inputs/verify_english_release.head.py").read_text()
    current_tree, previous_tree = ast.parse(current_source), ast.parse(previous_source)
    def without_addon(tree):
        return ast.dump(ast.Module(body=[n for n in tree.body if not (isinstance(n, ast.FunctionDef) and n.name == "addon_files")], type_ignores=[]), include_attributes=False)
    check("only addon_files changes executable release-verifier syntax", without_addon(current_tree) == without_addon(previous_tree))
    current_policy = json.loads((HERE / "inputs/addon-allowlist.current.json").read_text())
    previous_policy = json.loads((HERE / "inputs/addon-allowlist.head.json").read_text())
    addon_root = "mathscope-m1/navier/followup-20261010-comparator-transport"
    check("only transport root is appended to allowed roots", current_policy["allowedRoots"] == previous_policy["allowedRoots"] + [addon_root])
    check("all other dated-addon policy fields remain unchanged", {k: v for k, v in current_policy.items() if k != "allowedRoots"} == {k: v for k, v in previous_policy.items() if k != "allowedRoots"})
    archive_policy = json.loads((HERE / "inputs/addon-archive-allowlist.json").read_text())
    expected = {
        addon_root + "/old-run-0001/raw/final-artifact-0001/original-comparator-37979127351-1.zip": (135397, "1af31713f8f021605af509bab4634fed7ab041636f6f1670be2bd3e3c61788d2", 11654200401),
        addon_root + "/diagnostic-run-0001/raw/remote-diagnostic-0001/original-guard-diagnostic-38013278865-1.zip": (44015, "b99bc876ebfdb71cd641247bca1b6cad38c757d9431ba81f7c70ca28a122f2ba", 11655127117),
    }
    check("archive policy identifies exactly the two actual historical ZIPs", archive_policy["schema"] == "MathScope.PostV54EvidenceArchiveAllowlist/1" and set(archive_policy["files"]) == set(expected))
    check("archive integrity explicitly does not imply gate PASS", archive_policy["archiveIntegrityImpliesGatePass"] is False)
    for name, (size, digest, artifact_id) in expected.items():
        row = archive_policy["files"][name]
        path = root / name
        check("exact archive identity and actual bytes: " + Path(name).name, row["bytes"] == size and row["sha256"] == digest and row["actualArtifactId"] == artifact_id and not path.is_symlink() and path.stat().st_size == size and sha(path) == digest)
    current = helper_namespace(current_source, root)
    previous = helper_namespace(previous_source, root)
    actual_members = current["addon_files"]()
    previous_members = previous["addon_files"]()
    check("actual collection delta is exactly the two pinned ZIPs", set(actual_members) - set(previous_members) == set(expected) and set(previous_members) <= set(actual_members))
    check("all prior addon paths resolve to the same files", all(actual_members[name] == path for name, path in previous_members.items()))
    check("no other ZIP enters the actual addon collection", {name for name in actual_members if name.endswith(".zip")} == set(expected))
    edition = current["edition_files"]()
    check("generic edition ZIP exclusion is retained", not any(name.endswith((".zip", ".zip.sha256")) for name in edition))
    check("new archive policy itself enters hashed edition provenance", "provenance/addon-archive-allowlist.json" in edition)
    original = json.loads((root / "provenance/original-v54-PACKAGE_MANIFEST.json").read_text())
    check("new ZIPs and current addons cannot replace original members", set(actual_members).isdisjoint({row["path"] for row in original["files"]}))

    normal_reader = current["read_json"]
    def with_policy(policy, roots=None):
        def reader(name):
            if name == "provenance/addon-archive-allowlist.json":
                return policy
            if name == "provenance/addon-allowlist.json" and roots is not None:
                return roots
            return normal_reader(name)
        current["read_json"] = reader
        try:
            return current["addon_files"]()
        finally:
            current["read_json"] = normal_reader

    def rejects(name, policy, expected_message, roots=None):
        try:
            with_policy(policy, roots)
        except ValueError as exc:
            check(name, expected_message in str(exc), str(exc))
        else:
            check(name, False, "Unexpected acceptance")

    one = next(iter(expected))
    changed_hash = copy.deepcopy(archive_policy)
    changed_hash["files"][one]["sha256"] = "0" * 64
    rejects("in-memory incorrect archive hash is rejected", changed_hash, "archive bytes differ")
    changed_size = copy.deepcopy(archive_policy)
    changed_size["files"][one]["bytes"] += 1
    rejects("in-memory incorrect archive size is rejected", changed_size, "archive bytes differ")
    boolean_size = copy.deepcopy(archive_policy)
    boolean_size["files"][one]["bytes"] = True
    rejects("boolean is not an integer archive length", boolean_size, "Invalid evidence-archive identity")
    unsafe = copy.deepcopy(archive_policy)
    unsafe["files"]["../" + one] = unsafe["files"].pop(one)
    rejects("unsafe relative archive path is rejected", unsafe, "Invalid evidence-archive identity")
    without_root = copy.deepcopy(current_policy)
    without_root["allowedRoots"].remove(addon_root)
    rejects("pinned archives outside allowed addon roots are rejected", archive_policy, "missing or outside", without_root)
    no_pins = copy.deepcopy(archive_policy)
    no_pins["files"] = {}
    unpinned = with_policy(no_pins)
    check("actual same ZIPs stay excluded when unlisted", not any(name.endswith(".zip") for name in unpinned) and set(unpinned) == set(previous_members))

    package_source = (HERE / "inputs/package_english_release.py").read_text()
    check("package consumes addon_files into observed source bytes", "**edition_files(),**addon_files(),MANIFEST:ROOT/MANIFEST" in package_source and "data=path.read_bytes()" in package_source)
    check("nested ZIP bytes are written directly and member digests rechecked", "archive.writestr(info,data)" in package_source and "sha(returned)!=sha(data)" in package_source)
    check("package retains original collision and concurrent-source protections", "Original archive and Git source differ" in package_source and "path.read_bytes()!=contents[name]" in package_source)
    check("review never invokes a manifest or package generator", True, "Only six exact collection helpers and in-memory negative policy controls were executed; no verify/package/main function was called.")
    for row in inputs["inputs"]:
        if "sourceAbsolutePath" in row:
            path = Path(row["sourceAbsolutePath"])
            check("reviewed repository input unchanged after review: " + path.name, path.stat().st_size == row["bytes"] and sha(path) == row["sha256"])
    for row in inputs["frozenBeforeReview"]:
        path = Path(row["path"])
        check("manifest or original criterion/assessment unchanged: " + path.name, path.stat().st_size == row["bytes"] and sha(path) == row["sha256"])
    passed = sum(row["pass"] for row in checks)
    receipt = {
        "schema": "MathScope.IndependentEvidenceArchivePackagingReview/1",
        "completedUTC": datetime.now(timezone.utc).isoformat(),
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checksPassed": passed, "checksTotal": len(checks), "checks": checks,
        "headCommit": inputs["headCommit"],
        "sourceSnapshotManifestSHA256": sha(HERE / "source-snapshots.json"),
        "reviewerSHA256": sha(__file__),
        "actualAllowedArchiveCount": len(expected), "actualAllowedArchiveBytes": sum(row[0] for row in expected.values()),
        "actualAddonMembersRead": len(actual_members), "unchangedCollectionMembers": len(previous_members),
        "mathematicalChecksExecuted": False, "ComparatorExecuted": False,
        "fullReleaseValidationExecuted": False, "manifestRegenerated": False,
        "packageBuilt": False, "repositoryFilesModified": False,
        "N106Completed": False,
        "scope": "Only the exact file-selection change and two actual fixed-byte historical CI ZIPs were reviewed. Their future inclusion in a built distribution still requires the normal manifest regeneration and full package/member verification by the release producer. No gate completion follows from archive integrity."
    }
    with args.output.open("x", encoding="utf-8") as handle:
        json.dump(receipt, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(json.dumps({k: receipt[k] for k in ["status", "checksPassed", "checksTotal", "actualAllowedArchiveCount", "actualAllowedArchiveBytes", "actualAddonMembersRead", "N106Completed"]} | {"failed": [r for r in checks if not r["pass"]]}, indent=2))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
