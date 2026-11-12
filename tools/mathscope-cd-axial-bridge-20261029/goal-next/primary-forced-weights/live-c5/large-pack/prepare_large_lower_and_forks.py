"""Patch only owned source storage and original lower-chain integrity checks."""

from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path


M2 = "research-ide/mathscope-m2/navier/"
M3 = "research-ide/mathscope-m3/navier/"
LOWER = {
    "actual-global-positive-primitives.mjs": (
        "ad2d7ee3dd1da9a69aef0334724c8a67051f359b0a89bae153041fd6809f7513", "seal", "seal.G", "nodes", 1),
    "actual-global-pressure-convolution.mjs": (
        "169d12967c1f0a57b1f1e07f7d98c732b5831a048f7517e731bf4fe4955d6d2b", "s", "result.G", "count", 1),
    "actual-global-conservative-moments.mjs": (
        "e2f21cb108137a49e29cb17aa4bbf66e8971e106dbb446a276f6821a72c29221", "s", "result.G", "count", 1),
    "actual-positive-global-stress.mjs": (
        "77227cd74000f5b6d4bec0361106af21d8020b2eee1eb979c1adc9ec3aae97d1", "s", "result.G", "count", 1),
    "actual-velocity-all-order-tail.mjs": (
        "275000b0e3ce22a16a17855fb41fabc1c75e350ba4a2c0973f72920cfe168f08", "s", "s.G", "count", 2),
    "actual-pressure-stress-all-order-tail.mjs": (
        "3748cac5658e485d3c7c59a7aef4bb80a3ca6ba50de934bd3cacc5431d3ff66a", "s", "result.G", "count", 1),
}
INDUCTION = M2 + "actual-residual-order-induction-expressions.mjs"
INDUCTION_PINS = (
    "dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501",
    "495197014413f796ecc4563122ca8b75e9a4844fadb6ddda0ff305711eee2fc8",
    "6ac4b997740f549ced7205fb8f47025012c8a4426b25acffd51dbb9d85e4729a",
    "fdcd5ff773875e287f5fa3c54fcea63f78792bff67dd1fe1dda4b5a08d7c5d99",
    "ae440b8387271132d83a47722338cd2dff8a114182f07a9c828e0adfc72072cd",
)
GLOBAL = M3 + "source-global-expressions.mjs"
GLOBAL_PIN = "89904bd7441a57cf634ff7b4c579e9ee7688868d14eafd999e44f41f74f0c2d1"
PARTITION = M2 + "actual-covariance-global-assembly.mjs"
PARTITION_PIN = "bd0f09f78a2f93cad9fdb679ba25509ecb2891ba86eee1bc3e57df6da74e37cc"
INDUCTION_NORMS = M2 + "actual-residual-order-induction-norms.mjs"
INDUCTION_NORM_PINS = (
    "0387335a081650c4a6ffed6e213215d32a363350c2a156a7163e82f4c0234634",
    "91c9b4ab946c06f07be2f78415a4b4cc2666fdab45ad7e643fe885f0df304817",
)
WEIGHTED_STRESS = M2 + "actual-order-one-weighted-stress.mjs"
WEIGHTED_STRESS_PIN = "49cde0b930f375e8eca5610ecb7d1e91c9c4361bdd1395a1971081fb1fdfd1b3"
CUTOFFS = M2 + "actual-residual-order-induction-cutoffs.mjs"
CUTOFFS_PIN = "be8c7dbe6a7bc78ace2e87dc5e205640a06237e3db0670f9388aab4c0c0772f5"


class ExactPatch:
    def __init__(self, path, allowed):
        self.path = path
        self.raw = path.read_bytes()
        self.before = sha256(self.raw).hexdigest()
        assert self.before in allowed, path
        self.source = self.raw.decode("utf-8")
        self.edits = []

    def change(self, old, new, count=1):
        assert old != new and self.source.count(old) == count, (self.path, old)
        self.source = self.source.replace(old, new)
        self.edits.append((old, new, count))

    def checked(self):
        restored = self.source
        for old, new, count in reversed(self.edits):
            assert restored.count(new) == count, (self.path, new)
            restored = restored.replace(new, old)
        assert restored.encode("utf-8") == self.raw, self.path
        return self.source.encode("utf-8")


def lower_patch(path, details):
    pin, seal, graph, length, count = details
    patch = ExactPatch(path, (pin,))
    imports = "import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';"
    patch.change(imports, imports + "\nimport {makeProgramSnapshot,canonicalHash} from './mathscope-large-seal.mjs';")
    patch.change("),{nodes,...metadata}=packed;\n  result.program={...structuredClone(metadata),nodes:G.nodes.slice()};",
                 ");\n  const programSeal=makeProgramSnapshot(packed);result.program=programSeal.program;", count)
    patch.change("prefix:canonicalStringify(G.nodes),",
                 "/* live prefix retained by programSeal */", count)
    patch.change("program:canonicalStringify(result.program)});", "program:programSeal});", count)
    program = f"canonicalStringify(result.program)!=={seal}.program"
    prefix = f"canonicalStringify({graph}.nodes.slice(0,{seal}.{length}))!=={seal}.prefix"
    # Replace the complete pair so the original result and live prefix are
    # each checked by the same exact source snapshot.
    pairs = [
        (f"{program}||\n    {prefix}", graph),
        (f"{program}||{prefix}", graph),
    ]
    if count == 2:
        pairs.append((f"{program}||\n    canonicalStringify(G.nodes.slice(0,s.count))!==s.prefix", "G"))
    changed = 0
    for old, live in pairs:
        if old in patch.source:
            patch.change(old, f"!{seal}.program.verify({live}.nodes,result.program)")
            changed += 1
    assert changed == count, path
    patch.change("const encoded=canonicalStringify(result.program);",
                 "const encoded=canonicalHash(result.program);", count)
    patch.change("await sha256(encoded)", "encoded.sha256", count)
    patch.change("new TextEncoder().encode(encoded).length", "encoded.bytes", count)
    return patch


def induction_patch(path):
    patch = ExactPatch(path, INDUCTION_PINS)
    anchor = "import {fail} from './actual-continuation-arithmetic.mjs';"
    patch.change(anchor, anchor + "\nimport {canForkOwnedLookup,forkOwnedLookup} from './mathscope-owned-lookup.mjs';\n"
                 "import {captureNodes} from './mathscope-large-seal.mjs';")
    patch.change("    for(const [key,value]of Object.entries(base)){\n      if(value instanceof Map)this[key]=new Map(value);",
                 "    const fork=canForkOwnedLookup(base.lookup);\n    for(const [key,value]of Object.entries(base)){\n"
                 "      if(fork&&key==='lookup')this.lookup=forkOwnedLookup(value,base.nodes.length);\n"
                 "      else if(fork&&key==='nodes')this.nodes=captureNodes(value).fork();\n"
                 "      else if(value instanceof Map)this[key]=new Map(value);")
    return patch


def global_patch(path):
    patch = ExactPatch(path, (GLOBAL_PIN,))
    anchor = "import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';"
    patch.change(anchor, anchor + "\nimport {canForkOwnedLookup,forkOwnedLookup} from '../../mathscope-m2/navier/mathscope-owned-lookup.mjs';\n"
                 "import {captureNodes} from '../../mathscope-m2/navier/mathscope-large-seal.mjs';")
    patch.change("    this.nodes=nodes.slice();this.lookup=new Map(lookup);this.baseNodeCount=nodes.length;",
                 "    const fork=canForkOwnedLookup(lookup);\n"
                 "    this.nodes=fork?captureNodes(nodes).fork():nodes.slice();\n"
                 "    this.lookup=fork?forkOwnedLookup(lookup,nodes.length):new Map(lookup);this.baseNodeCount=nodes.length;")
    return patch


def partition_patch(path):
    patch = ExactPatch(path, (PARTITION_PIN,))
    anchor = "const saved=new WeakMap(),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);"
    patch.change(anchor, "import {captureRawNodes} from './mathscope-large-seal.mjs';\n" + anchor)
    patch.change("nodes:JSON.stringify(G.nodes),data:JSON.stringify(result)",
                 "nodes:captureRawNodes(G.nodes),data:JSON.stringify(result)")
    patch.change("JSON.stringify(G.nodes.slice(0,s.nodeCount))!==s.nodes", "!s.nodes.verify(G.nodes)")
    return patch


def induction_norm_patch(path):
    patch = ExactPatch(path, INDUCTION_NORM_PINS)
    anchor = "const sealedNorms=new WeakMap();"
    patch.change(anchor, "import {captureRawNodes} from './mathscope-large-seal.mjs';\n" + anchor)
    patch.change("prefix:JSON.stringify(G.nodes)", "prefix:captureRawNodes(G.nodes)")
    patch.change("JSON.stringify(r.G.nodes.slice(0,r.nodeCount))!==r.prefix", "!r.prefix.verify(r.G.nodes)")
    return patch


def weighted_stress_patch(path):
    patch = ExactPatch(path, (WEIGHTED_STRESS_PIN,))
    patch.change("import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';",
                 "import {canonicalStringify} from '../../mathscope-m0/contracts.mjs';\n"
                 "import {captureNodes,makeProgramSnapshot,canonicalHash} from './mathscope-large-seal.mjs';")
    patch.change("),{nodes,...metadata}=packed;\n  result.program={...structuredClone(metadata),nodes:nodes.slice()};",
                 ");\n  const programSeal=makeProgramSnapshot(packed);result.program=programSeal.program;")
    patch.change("nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),\n"
                 "    binding:resultBinding(result),metadata:canonicalStringify(metadata),serialized:canonicalStringify(result.program)",
                 "programSeal,livePrefix:captureNodes(G.nodes),definitions:G.captureFunctionDefinitions(),\n    binding:resultBinding(result)")
    patch.change("canonicalStringify(saved.G.nodes.slice(0,saved.count))!==saved.nodes", "!saved.livePrefix.verify(saved.G.nodes)")
    patch.change("  const {nodes,...metadata}=result.program??{};\n"
                 "  if(!Array.isArray(nodes)||canonicalStringify(nodes)!==saved.nodes||canonicalStringify(metadata)!==saved.metadata)",
                 "  if(!saved.programSeal.verify(saved.G.nodes,result.program))")
    patch.change("hash=await sha256(s.serialized)", "encoded=canonicalHash(result.program)")
    patch.change("sha256:hash,nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).byteLength",
                 "sha256:encoded.sha256,nodeCount:s.count,canonicalBytes:encoded.bytes")
    return patch


def cutoffs_patch(path):
    patch = ExactPatch(path, (CUTOFFS_PIN,))
    anchor = "const sealed=new WeakMap();"
    patch.change(anchor, "import {captureRawNodes} from './mathscope-large-seal.mjs';\n" + anchor)
    patch.change("prefix:JSON.stringify(G.nodes)", "prefix:captureRawNodes(G.nodes)", 2)
    patch.change("JSON.stringify(r.G.nodes.slice(0,r.nodeCount))!==r.prefix", "!r.prefix.verify(r.G.nodes)")
    return patch


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("runtime", type=Path)
    parser.add_argument("receipt", type=Path)
    args = parser.parse_args()
    patches = [lower_patch(args.runtime / (M2 + file), details) for file, details in LOWER.items()]
    patches += [
        induction_patch(args.runtime / INDUCTION),
        global_patch(args.runtime / GLOBAL),
        partition_patch(args.runtime / PARTITION),
        induction_norm_patch(args.runtime / INDUCTION_NORMS),
        weighted_stress_patch(args.runtime / WEIGHTED_STRESS),
        cutoffs_patch(args.runtime / CUTOFFS),
    ]
    files = {}
    outputs = [(patch, patch.checked()) for patch in patches]
    for patch, data in outputs:
        patch.path.write_bytes(data)
        files[patch.path.relative_to(args.runtime).as_posix()] = {
            "beforeSHA256": patch.before, "afterSHA256": sha256(data).hexdigest(),
            "reversedToExactInput": True, "anchors": len(patch.edits),
        }
    receipt = {"schema": "MathScope.N7.OwnedLargeGraphLowerAndForks/1", "files": files, "release": "HOLD"}
    args.receipt.write_bytes((json.dumps(receipt, indent=2) + "\n").encode())
    print(f"PASS {len(files)} exact reversible source overlays")


if __name__ == "__main__":
    main()
