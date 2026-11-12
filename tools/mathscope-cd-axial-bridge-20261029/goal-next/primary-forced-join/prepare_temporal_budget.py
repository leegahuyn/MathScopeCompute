"""Use one authenticated resource ceiling across Temporal and angular initialization."""

from argparse import ArgumentParser
import json
from pathlib import Path

from prepare_live_join import blob


FILES = {
    "source-auxiliary-derivative-closure.mjs": (
        "1e80efce9858cba7a2f7baf6ba700f4fb07085f6",
        "maximumTotalNodes>5000000",
        "maximumTotalNodes>{budget}",
        "at most five million nodes",
        "at most {budget} nodes",
    ),
    "source-global-temporal.mjs": (
        "04577e8da66311862a17c0ab0fc62491dd366178",
        "declareExactAuxiliaryMaterializationBudget(G,5000000)",
        "declareExactAuxiliaryMaterializationBudget(G,{budget})",
    ),
    "source-global-angular.mjs": (
        "97f982d74a887dcdf4dcff2214a16536bcfc52db",
        "materializationBudget=declareExactAuxiliaryMaterializationBudget(G,5000000),{epsilon,k}",
        "materializationBudget=declareExactAuxiliaryMaterializationBudget(G,{budget}),{{epsilon,k}}",
        "assertGlobalInitialAngularState(s);const G=s.G,start=G.nodes.length,materializationBudget=declareExactAuxiliaryMaterializationBudget(G,5000000),",
        "assertGlobalInitialAngularState(s);const G=s.G,start=G.nodes.length,materializationBudget=declareExactAuxiliaryMaterializationBudget(G,{budget}),",
    ),
}
ALLOWED = (6200000, 6800000)


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("navier", type=Path)
    parser.add_argument("budget", type=int, choices=ALLOWED)
    parser.add_argument("receipt", type=Path)
    args = parser.parse_args()
    changes = []
    outputs = {}
    for name, (expected, *edits) in FILES.items():
        path = args.navier / name
        original = path.read_bytes()
        assert blob(original) == expected, name
        changed = original
        reversals = []
        for old, template in zip(edits[::2], edits[1::2], strict=True):
            old, new = old.encode(), template.format(budget=args.budget).encode()
            assert changed.count(old) == 1 and new not in changed, name
            changed = changed.replace(old, new, 1)
            reversals.append((new, old))
        reverted = changed
        for new, old in reversed(reversals):
            reverted = reverted.replace(new, old, 1)
        assert reverted == original, name
        outputs[path] = changed
        changes.append({"file": name, "beforeGitBlob": expected, "afterGitBlob": blob(changed),
                        "replacements": [[old.decode(), new.decode()] for new, old in reversals]})
    for path, changed in outputs.items():
        path.write_bytes(changed)
    args.receipt.write_bytes((json.dumps({
        "status": "PINNED_TEMPORAL_AND_ANGULAR_RESOURCE_LITERALS_ONLY",
        "originalNodeBudget": 5000000, "requestedNodeBudget": args.budget,
        "files": changes,
    }, indent=2) + "\n").encode())


if __name__ == "__main__":
    main()
