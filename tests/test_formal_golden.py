import importlib.util
from pathlib import Path

import pytest

spec = importlib.util.spec_from_file_location("golden_replay", Path(__file__).resolve().parents[1] / "formal" / "replay.py")
formal = importlib.util.module_from_spec(spec)
spec.loader.exec_module(formal)


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


def test_altered_bundled_source_is_rejected_before_execution(tmp_path, monkeypatch):
    for name in ("GoldenAlgebra.lean", "golden-manifest.json", "lean-toolchain"):
        (tmp_path / name).write_bytes((formal.ROOT / name).read_bytes())
    with (tmp_path / "GoldenAlgebra.lean").open("ab") as source:
        source.write(b"\n-- altered\n")
    monkeypatch.setattr(formal, "ROOT", tmp_path)
    with pytest.raises(ValueError, match="integrity failure"):
        formal.check_package()
