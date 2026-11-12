"""Prepare only the pinned repairs, storage and node limits for the live join."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "primary-forced-weights" /
                       "live-c5" / "large-pack"))
from prepare_large_lower_and_forks import ExactPatch

IMPORTS = "import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';"
PRESSURE = "source-global-pressure.mjs"
TEMPORAL = "source-global-temporal.mjs"
ANGULAR = "source-global-angular.mjs"
DERIVATIVE = "source-auxiliary-derivative-closure.mjs"
PINS = {
    PRESSURE: "fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d",
    TEMPORAL: "d5e20e78c119b678b61df35c1bf0f560826e7dddb74e70edd0c17a67d18a9759",
    ANGULAR: "4e9c3ea67b124a953856f83d0aca0dcfec4b01a245043424de2bb035b8d902ca",
    DERIVATIVE: "9541710d750b16d215b08d06384898ae63d77ade30c2cb93aaed1308505b039b",
    "source-global-initial-mean.mjs": "513779930558d044076318f39396060465b6518184b952482a0d973ac16bd411",
    "source-global-moment.mjs": "0d02d55b291db8c55db26810ae4783d62e09ac3d058fd582f4161cb444871e46",
    "source-initialized-angular.mjs": "655809f64af15daa67260ae4207ceac3d3090816086e9920027eedda2ccf24b7",
    "source-global-forced-current.mjs": "b41f298702238cf6170c16f31362e9429ebc659ca2a999d8d85cf2159ae01be3",
}
REPAIRS = {
    "source-initialized-angular.mjs": "3e4f32a554e8e2ceccd3e003aa220c2f191c23b98cceb3b07f1f2d81e4bf2f1d",
    "source-global-forced-current.mjs": "492c97715d7fae56929e9bbe6991450db20186da00d4e6de2aa17c4a25959827",
}


def prepare(path, repaired, budget, witness):
    name = path.name
    assert sha256(path.read_bytes()).hexdigest() == PINS[name], path
    patch = ExactPatch(repaired / name if name in REPAIRS else path,
                       (REPAIRS.get(name, PINS[name]),))
    if witness and name == "source-global-forced-current.mjs":
        return patch
    if name == PRESSURE:
        patch.change(IMPORTS, IMPORTS +
                     "\nimport {captureNodes} from '../../mathscope-m2/navier/mathscope-large-seal.mjs';")
        patch.change("prefix=canonicalStringify(G.nodes)", "prefix=captureNodes(G.nodes)")
        patch.change("canonicalStringify(G.nodes.slice(0,prefixCount))===prefix", "prefix.verify(G.nodes)")
        patch.change("prefix:canonicalStringify(G.nodes)", "prefix:captureNodes(G.nodes)")
        patch.change("seal.prefix!==canonicalStringify(s.G.nodes.slice(0,seal.count))",
                     "!seal.prefix.verify(s.G.nodes)")
    elif name != DERIVATIVE:
        patch.change(IMPORTS, IMPORTS + "\nimport {captureSourceDelta} from './mathscope-active-forced-seal.mjs';")
        end = "start,count" if name in (ANGULAR, *REPAIRS) else "start"
        patch.change(f"delta:canonicalStringify(G.nodes.slice({end}))", "delta:captureSourceDelta(G.nodes,start)")
        original = (
            "s.delta!==canonicalStringify(state.G.nodes.slice(s.start,s.count))"
            if name == "source-global-moment.mjs" else
            "seal.delta!==canonicalStringify(s.G.nodes.slice(seal.start,seal.count))"
        )
        replacement = "!s.delta.verify(state.G.nodes)" if name == "source-global-moment.mjs" else "!seal.delta.verify(s.G.nodes)"
        patch.change(original, replacement)
    if name in (TEMPORAL, ANGULAR):
        patch.change("declareExactAuxiliaryMaterializationBudget(G,5000000)",
                     f"declareExactAuxiliaryMaterializationBudget(G,{budget})",
                     2 if name == ANGULAR else 1)
    if name == DERIVATIVE:
        patch.change("maximumTotalNodes>5000000", f"maximumTotalNodes>{budget}")
        patch.change("at most five million nodes", f"at most {budget} nodes")
    return patch


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("navier", type=Path)
    parser.add_argument("repaired", type=Path)
    parser.add_argument("budget", type=int, choices=(8_000_000, 24_000_000, 30_000_000))
    parser.add_argument("receipt", type=Path)
    parser.add_argument("--witness", action="store_true")
    args = parser.parse_args()
    changes = []
    outputs = {}
    for name, original in PINS.items():
        path = args.navier / name
        patch = prepare(path, args.repaired, args.budget, args.witness)
        data = patch.checked()
        outputs[path] = data
        changes.append({
            "file": name, "originalSHA256": original,
            "pinnedRepairSHA256": REPAIRS.get(name),
            "outputSHA256": sha256(data).hexdigest(),
            "exactStorageAndBudgetReversal": True,
        })
    for path, data in outputs.items():
        path.write_bytes(data)
    args.receipt.write_bytes((json.dumps({
        "files": changes, "declaredNodeBudget": args.budget, "witness": args.witness,
        "status": "PINNED_REPAIRS_AND_REVERSIBLE_ACTIVE_FORCED_STORAGE",
    }, indent=2) + "\n").encode())


if __name__ == "__main__":
    main()
