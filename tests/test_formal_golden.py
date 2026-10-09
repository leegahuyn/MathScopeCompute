import importlib.util
from datetime import datetime, timezone
import json
from pathlib import Path
from types import SimpleNamespace

import pytest

spec = importlib.util.spec_from_file_location("golden_replay", Path(__file__).resolve().parents[1] / "formal" / "replay.py")
formal = importlib.util.module_from_spec(spec)
spec.loader.exec_module(formal)


@pytest.fixture
def copied_package(tmp_path, monkeypatch):
    for name in ("GoldenAlgebra.lean", "golden-manifest.json", "lean-toolchain"):
        (tmp_path / name).write_bytes((formal.ROOT / name).read_bytes())
    monkeypatch.setattr(formal, "ROOT", tmp_path)
    return tmp_path


@pytest.fixture
def successful_lean(monkeypatch):
    calls = []
    audit = "\n".join(f"'{name}' depends on axioms: [propext, Classical.choice, Quot.sound]"
                      for name in formal.THEOREMS)

    def run(args, **kwargs):
        calls.append(args)
        stdout = (f"Lean (version 4.34.0-rc2, test, commit {formal.LEAN_COMMIT}, Release)"
                  if args[1:] == ["--version"] else audit)
        return SimpleNamespace(returncode=0, stdout=stdout, stderr="")

    monkeypatch.setattr(formal.shutil, "which", lambda _name: "lean")
    monkeypatch.setattr(formal.subprocess, "run", run)
    return calls


def test_audited_source_and_scope_are_bundled():
    package = formal.check_package()
    assert package["sourceHash"] == formal.SOURCE_HASH
    assert "not a full PDE theorem" in package["manifest"]["formalScope"]
    assert package["manifest"]["dependencies"] == []


def test_axiom_audit_rejects_missing_wrong_or_admitted_theorems():
    audit = "\n".join(f"'{name}' depends on axioms: [propext, Classical.choice, Quot.sound]" for name in formal.THEOREMS)
    assert formal.valid_audit(audit)
    assert not formal.valid_audit(audit.replace("propext", "sorryAx", 1))
    assert not formal.valid_audit(audit.replace("constant_one_stationary", "other_claim"))
    assert not formal.valid_audit(audit.split("\n")[0])
    assert not formal.valid_audit(audit + "\n" + audit.split("\n")[0])


def test_missing_runtime_never_emits_formal_receipt(monkeypatch):
    monkeypatch.setattr(formal.shutil, "which", lambda _name: None)
    with pytest.raises(RuntimeError, match="no formal verification performed"):
        formal.replay()


def test_altered_bundled_source_is_rejected_before_execution(copied_package, successful_lean):
    with (copied_package / "GoldenAlgebra.lean").open("ab") as source:
        source.write(b"\n-- altered\n")
    with pytest.raises(ValueError, match="integrity failure"):
        formal.replay()
    assert successful_lean == []


@pytest.mark.parametrize("field,value", [
    ("schema", "MathScopeGoldenFormal/999"),
    ("claimId", "UNREVIEWED-CLAIM"),
    ("sourceHash", "0" * 64),
    ("toolchain", "leanprover/lean4:v0.0.0"),
    ("dependencies", ["unreviewed-package"]),
    ("formalScope", "Full PDE global existence and uniqueness"),
    ("assumptions", []),
    ("excludedClaims", []),
    ("extraClaim", "Unreviewed theorem"),
])
def test_altered_manifest_is_rejected_before_execution(copied_package, successful_lean, field, value):
    manifest_path = copied_package / "golden-manifest.json"
    manifest = json.loads(manifest_path.read_bytes())
    manifest[field] = value
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    with pytest.raises(ValueError, match="integrity failure"):
        formal.replay()
    assert successful_lean == []


@pytest.mark.parametrize("replacement", [b"{}", b"{invalid json", b"\xff"])
def test_invalid_manifest_is_rejected_before_execution(copied_package, successful_lean, replacement):
    (copied_package / "golden-manifest.json").write_bytes(replacement)
    with pytest.raises(ValueError, match="integrity failure"):
        formal.replay()
    assert successful_lean == []


def test_manifest_bytes_are_pinned(copied_package, successful_lean):
    with (copied_package / "golden-manifest.json").open("ab") as manifest:
        manifest.write(b"\n")
    with pytest.raises(ValueError, match="integrity failure"):
        formal.replay()
    assert successful_lean == []


def test_replays_have_fresh_ids_and_utc_times_with_stable_proof_hash(successful_lean):
    started = datetime.now(timezone.utc)
    first, second = formal.replay(), formal.replay()
    finished = datetime.now(timezone.utc)
    assert first["state"]["evidence"] == second["state"]["evidence"] == "FORMAL"
    assert first["id"] != second["id"]
    assert first["proofHash"] == second["proofHash"]
    first_time = datetime.fromisoformat(first["generatedAt"])
    second_time = datetime.fromisoformat(second["generatedAt"])
    assert first_time.utcoffset() == second_time.utcoffset() == timezone.utc.utcoffset(None)
    assert started <= first_time <= second_time <= finished
    assert successful_lean == [["lean", "--version"], ["lean", "GoldenAlgebra.lean"]] * 2
