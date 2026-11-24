"""Independently identify archived and native live Repeat fields by exact ring normal form."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from functools import cache
from hashlib import sha256
import gzip
import json
from pathlib import Path
from time import monotonic

PREFIX = 22_380_596
PINS = {
    "base": "7c03a7e6195fa074f4916bc1aab692f0555e8fb30cf9a999ecf79c34ec0b88b2",
    "registry": "62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce",
    "live": "622c11be9a484374a504bda29ec9d1216a4641c130333305b339de506b7fbcaa",
    "live_definitions": "9ea1a0768973c3f57761d7131291000743a0d7a1dc82b46b3fa7fa11da9af6be",
    "offline": "3d0538045a0927ac3389281222d346139fa8c9647a061372dd4177696bab859f",
    "offline_definitions": "83dc44c8062e33fa36a0ed26852ff261ecb7fba426e3733c6edb9c9ef4aa1a73",
}


def checked(path, key):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[key], (path, key)
    return raw


def dump(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def entry_ids(row):
    op, args = row["op"], row["args"]
    if op in {"add", "multiply", "smooth_piecewise", "sine", "cosine"}:
        yield from args
    elif op in {"m3_coupled_expression_partial", "m3_coupled_indexed_partial"}:
        yield from args[1]


def file_lines(path):
    with gzip.open(path, "rb") as f:
        header = next(f)
        assert json.loads(header) == {"schema":"MathScope.M3.FullNodesJSONL/1","node_count":PREFIX}
        yield None, header
        yield from enumerate(f)


def load_prefix(path, front, retained, own=False):
    h = sha256() if own else None
    remaining = set(front) - retained.keys()
    if not remaining and not own:
        return
    count = -1
    for i, line in file_lines(path):
        if own:
            h.update(line)
        if i in remaining:
            remaining.remove(i)
            retained[i] = json.loads(line)
        if i is not None:
            count = i
        if not (remaining or own):
            break
    assert not remaining, sorted(remaining)[:16]
    if own:
        assert count == PREFIX - 1 and h.hexdigest() == PINS["base"]


def combine(a, b):
    out = Counter(a)
    out.update(b)
    return {k: v for k, v in out.items() if v}


def mul(a, b):
    out = Counter()
    for p, v in a.items():
        for q, w in b.items():
            out[tuple(sorted(p + q))] += v * w
    return {k: v for k, v in out.items() if v}


def serialize_poly(poly):
    return [(m,str(v)) for m,v in sorted(poly.items())]


class Normal:
    def __init__(self, prefix, suffix, atoms):
        self.prefix, self.suffix, self.atoms = prefix, suffix, atoms

    @staticmethod
    def atom(name):
        return {(dump(name),): Fraction(1)}

    @cache
    def fold(self, i):
        if i in self.atoms:
            return self.atom(["p", i])
        if i == 0:
            return {}
        if i == 1:
            return {(): Fraction(1)}
        if i == 20:
            return {(): Fraction(-1)}
        if i < PREFIX:
            if i not in self.prefix:
                return self.atom(["p", i])
            row = self.prefix[i]
        else:
            row = self.suffix[i - PREFIX]
        op, args = row["op"], row["args"]
        if op == "rational":
            f = Fraction(*map(int, args))
            return {(): f} if f else {}
        if op == "add":
            assert len(args) == 2
            return combine(self.fold(args[0]),self.fold(args[1]))
        if op == "multiply":
            assert len(args) == 2
            return mul(self.fold(args[0]),self.fold(args[1]))
        if op in ("sine","cosine"):
            assert len(args) == 1
            pol = self.fold(args[0])
            if not pol:
                return {} if op=="sine" else {():Fraction(1)}
            sign = 1 if min(pol.items())[1] > 0 else -1
            normal = serialize_poly({k:sign*v for k,v in pol.items()})
            coe = sign if op=="sine" else 1
            return {(dump([op,normal]),): Fraction(coe)}
        if op == "smooth_piecewise" and i >= PREFIX:
            assert len(args)==6
            # Identical guards retain the raw endpoint and lazy-arm convention.
            lanes = [serialize_poly(self.fold(a)) for a in args]
            return self.atom([op, lanes])
        if op in {"m3_coupled_expression_partial","m3_coupled_indexed_partial"} and i>=PREFIX:
            return self.atom([op,args[0],[serialize_poly(self.fold(a)) for a in args[1]],args[2]])
        assert i < PREFIX, (i,row)
        return self.atom(["p", i])


def stripped_record(d, exclusions):
    return {k:v for k,v in d.items() if k not in exclusions}


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--live", type=Path, required=True)
    parser.add_argument("--offline", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    start_time = monotonic()
    live, offline = args.live, args.offline
    stream = live / "active-n3-repeat-forced-source"
    reg = json.loads(checked(stream / "original-source-functions.json", "registry"))
    old_expr, old_fields, *_ = json.loads(reg["definitions"])
    ld = json.loads(checked(live / "active-repeat-indexed-definitions.json","live_definitions"))
    od = json.loads(checked(offline / "offline-replay1-offline-definitions.json","offline_definitions"))
    lf = [json.loads(r) for r in checked(live / "active-repeat-indexed-append.jsonl", "live").splitlines()]
    of = [json.loads(r) for r in checked(offline / "offline-replay1-offline-append.jsonl", "offline").splitlines()]
    rec = json.loads((live / "active-repeat-indexed-attachment.json").read_bytes())
    assert rec["inputs"]["repeatBaseStreamSHA256"] == PINS["base"]
    assert rec["inputs"]["repeatBaseDefinitionSHA256"] == PINS["registry"]
    assert rec["append"]["endExclusive"] == PREFIX + len(lf)
    assert rec["append"]["firstNode"] == PREFIX and len(lf)==1764 and len(of)==1994
    candidate = json.loads((live / "active-n3-repeat-forced-candidate.json").read_bytes())
    # The two arrays use these same original scalar coefficient and phase IDs.
    atoms: set[int] = {17732747}
    for t in candidate["templates"]:
        atoms.add(t["phase"])
    for sys in candidate["systems"]:
        for side in ("positive", "negative"):
            vector = sys[side]
            for c in (*vector["velocity"],vector["pressure"]):
                atoms.add(c["real"])
                atoms.add(c["imaginary"])
    atoms.difference_update((0,1,20))
    assert all(x<PREFIX for x in atoms)
    read_prefix = {}
    wanted = {i for row in lf + of for i in entry_ids(row) if i<PREFIX and i not in atoms}
    path = stream / "original-source-nodes.jsonl.gz"
    load_prefix(path, wanted, read_prefix, own=True)
    # The live assembler interns the trig nodes in the common predecessor. Read the
    # transparent arguments of those nodes (not the protected amplitude body).
    for _ in range(4):
        wanted={i for row in read_prefix.values()
                if row["op"] in {"sine","cosine","multiply","add"}
                for i in entry_ids(row) if i<PREFIX and i not in atoms} - read_prefix.keys()
        if not wanted:
            break
        load_prefix(path, wanted, read_prefix)
    ln, on = Normal(read_prefix, lf, atoms), Normal(read_prefix, of, atoms)
    assert len(ld["expressions"]) == len(od["expressions"]) == 16
    assert len(ld["fields"]) == len(od["fields"]) == 4
    checks = []
    for a,b in zip(ld["expressions"],od["expressions"],strict=True):
        assert stripped_record(a,{"body"}) == stripped_record(b,{"body"})
        la, ob = a["body"], b["body"]
        left,right=ln.fold(la),on.fold(ob)
        if left!=right:
            (args.out.parent / "normal-form-mismatch.json").write_text(dump({"name":a["name"],"left":serialize_poly(left),"right":serialize_poly(right)}),encoding="utf-8")
            raise AssertionError(a["name"])
        fp=sha256(dump(serialize_poly(left)).encode()).hexdigest()
        checks.append({"name":a["name"],"liveRoot":la,"offlineRoot":ob,"normalFormSHA256":fp})
    for fieldno,(a,b) in enumerate(zip(ld["fields"],od["fields"],strict=True)):
        assert stripped_record(a,{"rows"}) == stripped_record(b,{"rows"})
        assert len(a["rows"]) == len(b["rows"]) == 162
        for x,y,z in zip(a["rows"], b["rows"], old_fields[9+fieldno]["rows"], strict=True):
            dynamic = {"localBody","localSystem"}
            assert stripped_record(x,dynamic)==stripped_record(y,dynamic)==stripped_record(z,dynamic)
            assert x["localSystem"] == y["localSystem"]
            assert ln.fold(x["localBody"])==on.fold(y["localBody"])
    result={"scope":"ARCHIVE_LIVE_REPEAT_GUARDED_FIELD_EXACT_FORMAL_EQUALITY",
            "inputPins":PINS, "prefixRetainedRecords":len(read_prefix),"expressionChecks":checks,
            "liveIndexedRoots":rec["registration"]["fields"],"unchangedRows":648,
            "ordinaryPhysicalAdmission":"OPEN","allRowDerivativeJoins":"OPEN","finalJets":0,"release":"HOLD"}
    args.out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print(dump({"expressions":len(checks),"rows":648,"retained":len(read_prefix),"elapsedSeconds":round(monotonic()-start_time,1)}))


if __name__ == "__main__":
    main()
