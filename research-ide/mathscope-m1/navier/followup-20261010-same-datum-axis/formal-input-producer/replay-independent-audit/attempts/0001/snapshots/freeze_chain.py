#!/usr/bin/env python3
"""Freeze accepted sources and mathematical bindings for one clean kernel replay.

This command does not compile Lean or assess the original acceptance gates.
It refuses to replace an existing selection manifest. Additional consumers are
explicit --append MODULE=navier/relative/attempt-directory arguments.
"""
from __future__ import annotations
import argparse
import datetime
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
NAVIER = HERE.parent.parent
A = "followup-20261010-same-datum-axis"
S = "followup-20261010-symbolic-gluing"
BASE = [
    ("SameDatumInputs", f"{A}/formal-input-producer/attempts/0012"),
    ("SameDatumMass", f"{A}/independent-review/formal-mass-bound/attempts/0002"),
    ("FieldBounds", f"{A}/formal-input-producer/field-attempts/0009"),
    ("ThresholdBridge", f"{S}/formal-threshold-bridge/attempts/0005"),
    ("PressureSelection", f"{S}/formal-pressure-selection/attempts/0001"),
    ("AmplitudeInput", f"{S}/formal-amplitude-input/attempts/0002"),
    ("AmplitudeDynamics", f"{S}/formal-amplitude-input/dynamics-attempts/0002"),
    ("OperatorBounds", f"{A}/formal-input-producer/operator-attempts/0004"),
    ("AxisFiniteJet", f"{A}/independent-review/formal-finite-jet/attempts/0002"),
    ("ConcreteProducer", f"{A}/formal-input-producer/assembly-attempts/0002"),
    ("SelectedReferenceBoxes", f"{A}/independent-review/formal-finite-jet/attempts/0004"),
    ("ConcreteFiniteJet", f"{A}/independent-review/formal-finite-jet/attempts/0006"),
]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def binding(relative):
    p = Path(relative)
    if p.is_absolute() or ".." in p.parts:
        raise ValueError("Expected a Navier-relative path")
    return {"path": str(p), "sha256": sha(NAVIER / p)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--append", action="append", default=[])
    parser.add_argument("--bind", action="append", default=[])
    parser.add_argument("--output", type=Path, default=HERE / "selected-chain.json")
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Refusing to replace a frozen selection manifest")
    selections = BASE + [tuple(item.split("=", 1)) for item in args.append]
    modules = []
    for name, directory in selections:
        source = binding(f"{directory}/{name}.lean")
        receipt = binding(f"{directory}/receipt.json")
        data = json.loads((NAVIER / receipt["path"]).read_text())
        if data["status"] != "PASS" or data["sourceSHA256"] != source["sha256"]:
            raise ValueError("Unsuccessful or changed input: " + name)
        axioms = data["printedAxioms"]
        if not axioms or any(set(xs) - {"propext", "Classical.choice", "Quot.sound"}
                             for xs in axioms.values()):
            raise ValueError("Missing or unaccepted axiom audit: " + name)
        modules.append({"name": name, "source": source["path"],
                        "sourceSHA256": source["sha256"],
                        "receipt": receipt["path"], "receiptSHA256": receipt["sha256"],
                        "expectedDeclarations": sorted(axioms)})
    inventory = binding(f"{A}/formal-input-producer/attempts/0012/original-source-hashes-before.json")
    evidence = [binding(p) for p in [
        f"{S}/attempts/one-profile-0002/receipt.json",
        f"{A}/evaluated-phi-mixed-comparison.json",
        *args.bind,
    ]]
    result = {
        "schema": "MathScope.CleanAxisChainSelection/1",
        "createdUTC": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "toolchainDirectory": "lean-4.34.0-rc2-linux",
        "kernelSHA256": "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5",
        "originalCommit": "f9e8bc5b38b6e212696e8a30e3e91517af887bbd",
        "originalInventory": inventory,
        "modules": modules,
        "finalModule": modules[-1]["name"],
        "evidenceBindings": evidence,
        "scope": "Fresh compilation of the actual same-datum inputs, fixed point, exact coefficient projections and finite-jet consumers against the preserved original Lean rc2 build. Mathematical interval bindings and original-gate assessment are separately recorded; this is not the protected Comparator.",
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"selection": str(args.output), "sha256": sha(args.output),
                      "modules": len(modules),
                      "declarations": sum(len(x["expectedDeclarations"]) for x in modules)}))


if __name__ == "__main__":
    main()
