"""Exact finite palette and original 162-row lift replay."""
import argparse
from collections import Counter
from copy import deepcopy
from fractions import Fraction as F
from functools import cache
import gzip
from hashlib import sha256
from itertools import combinations, product
import json
from pathlib import Path
import subprocess

GRAPH_SHA = "a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269"
REACHED_SHA = "5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459"
REGISTRY_SHA = "bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e"
PROJECTION_SHA = "6a99e63be8e1ba2445e93a240005aaa4345c556f4e4d14ba6bcf813297b2b656"
COMMIT = "f8cb4034e86d7b669d52a6f2248aebba156b51b5"
MODULUS = 1048576
PALETTE = 2250
R0 = F(1, 16384 * MODULUS)
J = ((3, 1), (1, 5))
R, Z, T, ELL, S, X, Y0, Y1 = 622802, 622803, 622804, 622791, 622820, 622824, 635044, 635045
C0, C1, N0, N1, THETA, DELTA = 3675254, 3675255, 3675256, 3675257, 622806, 3675258


def digest(data):
    return sha256(data).hexdigest()


def pinned(path, expected):
    raw = path.read_bytes()
    assert digest(raw) == expected, path
    return json.loads(raw)


def matrices():
    def mul(a, b):
        return tuple(tuple(sum(a[i][k] * b[k][j] for k in range(2)) for j in range(2)) for i in range(2))

    powers = [((1, 0), (0, 1))]
    for _ in range(4):
        powers.append(mul(powers[-1], J))
    return powers


def finite_palette(powers):
    assert PALETTE == 9 * 5 ** 3 * 2 < MODULUS
    assert F(2) < F(3, 2) ** 2
    row_norm = max(sum(abs(x) for x in row) for matrix in powers for row in matrix)
    assert row_norm == 1028
    assert 3 * R0 < F(1, 2)
    perturbation = 3 * R0 * (row_norm + 1)
    clearance = F(1, MODULUS) - perturbation
    assert clearance > 0
    rows = []
    for d, matrix in enumerate(powers[1:], 1):
        residues = [(matrix[1][0] * n) % MODULUS for n in range(1, PALETTE + 1)]
        minimum = min(min(r, MODULUS-r) for r in residues)
        assert minimum >= 1 and 0 < matrix[1][0] * PALETTE < MODULUS
        rows.append({"difference": d, "minimumVerticalIntegerDistanceNumerator": minimum,
                     "maxUnreducedVerticalNumerator": matrix[1][0] * PALETTE})
    return {"matrixPowers": powers, "positiveDifferenceChecks": rows, "positiveResidueCount": 4 * PALETTE,
            "zeroDifference": "Distinct palette numerators 1 through 2250 differ modulo 1048576.",
            "maxCoveringRowNorm": row_norm, "r0": str(R0), "cartesianBoxRadiusStrictlyBelow": str(3 * R0),
            "maxCombinedPerturbationStrictlyBelow": str(perturbation), "strictClearanceAbove": str(clearance),
            "logCoveringBound": "Tg > 4 gives f(ell+4)-f(ell) < 2(1+h) < 3 for ell>=8 and h<1/64. Floors differ by at most 3, within the retained 0..4 matrix selector."}


# Monomials are sorted tuples of opaque atom powers. Rational arithmetic is
# exact. Analytic functions keep their normalized arguments as opaque atoms.
def num(x):
    return (((), F(x)),) if x else ()


def atom(tag, *args):
    return ((((tag, *args), 1),), F(1)),


def tidy(terms):
    return tuple(sorted(((k, v) for k, v in terms.items() if v), key=lambda item: repr(item[0])))


def add(*xs):
    terms = Counter()
    for x in xs:
        for k, v in x:
            terms[k] += v
    return tidy(terms)


def mul(*xs):
    out = num(1)
    for x in xs:
        terms = Counter()
        for a, c in out:
            for b, d in x:
                powers = Counter(dict(a))
                powers.update(dict(b))
                key = tuple(sorted(((k, v) for k, v in powers.items() if v), key=lambda kv: repr(kv[0])))
                terms[key] += c * d
        out = tidy(terms)
    return out


def inv(x):
    assert x
    if len(x) == 1:
        powers, c = x[0]
        return ((tuple((a, -d) for a, d in powers), 1 / c),)
    return atom("inverse", x)


def pow_nat(x, n):
    assert type(n) is int and n >= 0
    return mul(*(x for _ in range(n)))


def minus(x):
    return mul(num(-1), x)


def sub(x, y):
    return add(x, minus(y))


def floor(x):
    return minus(atom("ceiling", minus(x)))


def log(x):
    return atom("log_positive", x)


def exp(x):
    return atom("exp", x)


def sqrt(x):
    return atom("sqrt_positive", x)


def mod(x, m):
    return sub(x, mul(num(m), floor(mul(num(F(1, m)), x))))


def scalar(x):
    if not x:
        return F(0)
    assert len(x) == 1 and not x[0][0], x
    return x[0][1]


class Source:
    def __init__(self, nodes):
        self.nodes = nodes

    def get(self, index, expected=None):
        node = self.nodes[index]
        op, args = node["op"], node["args"]
        assert expected is None or expected == op, (index, expected, op)
        return op, args

    def normalize(self, root, *, aliases=None, case=None):
        aliases = {} if aliases is None else aliases

        @cache
        def walk(i):
            if i in aliases:
                return aliases[i]
            if case is not None and i == case[0]:
                return num(case[1])
            op, a = self.get(i)
            if op == "rational":
                return num(F(*map(int, a)))
            if op == "coordinate":
                return atom("coordinate", i)
            if op == "source_parameter":
                return atom("parameter", a[0])
            if op == "add":
                return add(*(walk(x) for x in a))
            if op == "multiply":
                return mul(*(walk(x) for x in a))
            if op == "inverse":
                return inv(walk(a[0]))
            if op == "integer_power":
                n = a[1]
                base = walk(a[0])
                return pow_nat(base if n >= 0 else inv(base), abs(n))
            if op in {"ceiling", "exp", "sqrt_positive", "log_positive"}:
                return atom(op, walk(a[0]))
            if op == "smooth_piecewise":
                x, lo, hi = (scalar(walk(j)) for j in a[:3])
                return walk(a[3 if x <= lo else 5 if x >= hi else 4])
            raise ValueError((i, op, a))

        return walk(root)

    def exact(self, root, expected, *, aliases=None, case=None):
        observed = self.normalize(root, aliases=aliases, case=case)
        assert observed == expected, (root, observed, expected)

    def number(self, root):
        return scalar(self.normalize(root))


def source_pins(repo):
    m2 = "research-ide/mathscope-m2/navier/"
    m3 = "research-ide/mathscope-m3/navier/"
    required = {
        m2+"source-support.mjs": ["MODULUS=1048576n,PALETTE=2250,DELTA_MAX=4,R0_DENOMINATOR=16384n*MODULUS",
                                   "errorNumerator=3n*(maxRowNorm+1n)"],
        m2+"actual-covariance-source-certificate.mjs": ["let color=mod(band.ell,9)",
            "for(const a of grid)color=G.add(G.mul(q(5),color),mod(a,5))", "colors.map(x=>[G.div(G.add(x,G.one),q(1048576)),G.zero])"],
        m3+"source-global-pressure.mjs": ["baseEll=G.sub(ell,q(2)),baseIndex=paletteIndex(baseEll)",
            "copy=mappedY.map((x,j)=>floor(G.add(G.sub(x,center[j]),G.q(1,2))))",
            "const rectangle=exactCommonTorusRectangle(G,{Y,matrix:b.matrix.value,center:label.centers[signIndex]"],
        m3+"source-global-forced-current.mjs": ["...sign.rectangle.center,...sign.rectangle.copy",
            "G.choose(t.lift.xi,G.neg(r0),r0,G.zero,G.choose(t.lift.v,G.zero,Ls,G.zero,bodyAt(t),G.zero),G.zero)"],
        m3+"source-initialized-angular.mjs": ["offset=matrix.value.map((row,j)=>G.sub(G.sub(dot(G,row,Y),center[j]),copy[j]))",
            "xi=G.div(dot(G,vr,offset),Dgeom),eta=G.div(dot(G,vt,offset),Dgeom),v=G.div(G.add(eta,r0),ci)"],
        m3+"source-coupled-expressions.mjs": ["Changing-label and nearest-copy joins are flat."],
        m3+"source-global-band.mjs": ["chi=G.choose(a,q(1,4),q(3,4)",
            "G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4)))",
            "G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls)))"],
    }
    pins = {}
    for path, snippets in required.items():
        raw = subprocess.check_output(["git", "-c", "core.longpaths=true", "-C", str(repo), "show", f"{COMMIT}:{path}"])
        assert all(snippet.encode() in raw for snippet in snippets), path
        pins[path] = digest(raw)
    return pins


def verify_graph(graph, nodes):
    h = sha256()
    matches = 0
    with gzip.open(graph, "rb") as f:
        header = f.readline()
        h.update(header)
        assert json.loads(header)["node_count"] == 4420257
        count = 0
        for count, line in enumerate(f, 1):
            h.update(line)
            if count-1 in nodes:
                assert json.loads(line) == nodes[count-1], count-1
                matches += 1
    assert count == 4420257 and h.hexdigest() == GRAPH_SHA
    assert matches == len(nodes) == 159655
    return count


def check_rows(src, projection, powers):
    coord = lambda i: atom("coordinate", i)
    ref = coord(ELL)
    h = atom("parameter", "h")
    log2, log_tg = log(num(2)), log(add(num(4), sqrt(num(2))))
    d_exponent = sub(num(F(1, 2)), h)
    q_at = lambda ell: exp(minus(mul(ell, log2)))
    index = lambda ell: floor(mul(sub(mul(add(num(1), h), ell, log2), mul(num(2), log(ell))), inv(log_tg)))
    q_phys = mul(q_at(ref), atom("slow_inverse_s"))
    actual_band = minus(mul(log(q_phys), inv(log2)))
    nearest_band = floor(add(actual_band, num(F(1, 2))))
    aliases = {S: atom("slow_inverse_s"), X: atom("radial_similarity_X")}
    audited = []
    seen = set()
    for row in projection["rows"]:
        label, vals = row["label"], row["values"]
        relative, *offsets = map(int, label["key"].split(":"))
        sign = label["sign"]
        assert relative in (-1, 0, 1) and all(x in (-1, 0, 1) for x in offsets)
        assert sign in (1, -1) and label["countBoxOnce"]
        assert (relative, *offsets, sign) not in seen
        seen.add((relative, *offsets, sign))
        ell = add(nearest_band, num(relative))
        src.exact(label["ell"], ell, aliases=aliases)
        ratio = mul(q_at(ref), inv(q_at(ell)))
        slow = (mul(coord(R), sqrt(ratio)), mul(coord(Z), exp(mul(d_exponent, log(ratio)))),
                mul(coord(T), ratio))
        mesh = tuple(mul(x, pow_nat(ell, 6)) for x in slow)
        grid = tuple(add(floor(add(a, num(F(1, 2)))), num(k)) for a, k in zip(mesh, offsets))
        for actual, expected in zip(label["grid"], grid):
            src.exact(actual, expected, aliases=aliases)
        col = mod(ell, 9)
        for g in grid:
            col = add(mul(num(5), col), mod(g, 5))
        c1 = mul(add(mul(num(2), col), num(1 if sign == 1 else 2)), num(F(1, MODULUS)))
        assert vals[:10] == [R, Z, T, label["ell"], *label["grid"], ELL, Y0, Y1]
        assert vals[14:] == [THETA, label["fixedDifference"]]
        src.exact(vals[10], c1, aliases=aliases)
        src.exact(vals[11], num(0))
        guards = row["guards"]
        assert len(guards) == 5 and guards[0] == [X, 3617, 28826]
        expected_guards = (*map(lambda pair: sub(*pair), zip(mesh, grid)), sub(actual_band, ell))
        for (test, lo, hi), expected in zip(guards[1:], expected_guards):
            assert src.number(lo) == F(-3, 4) and src.number(hi) == F(3, 4)
            src.exact(test, expected, aliases=aliases)
        delta = label["fixedDifference"]
        src.exact(delta, sub(index(ell), index(sub(ref, num(2)))), aliases=aliases)
        copy_alias = {**aliases, vals[10]: atom("center0"), vals[11]: num(0)}
        for d, matrix in enumerate(powers):
            expected = tuple(floor(add(mul(num(m[0]), coord(Y0)), mul(num(m[1]), coord(Y1)),
                         minus(atom("center0")) if j == 0 else num(0), num(F(1, 2))))
                         for j, m in enumerate(matrix))
            for v, nf in zip(vals[12:14], expected):
                src.exact(v, nf, aliases=copy_alias, case=(delta, d))
        assert row["derivativeMaps"] == [[{"coefficient": 1, "parameter": i}] for i in (0, 1, 2, 8, 9, 14)]
        assert row["coefficient"] == 1
        audited.append({"key": label["key"], "sign": sign, "ell": label["ell"], "grid": label["grid"],
                        "center": vals[10:12], "copies": vals[12:14], "difference": delta,
                        "guards": guards})
    assert seen == {(*k, s) for k in product((-1, 0, 1), repeat=4) for s in (1, -1)}
    counts = Counter()
    for a, b in combinations(sorted(seen), 2):
        if a[0] != b[0]:
            assert 0 < abs(a[0]-b[0]) <= 2 < 9
            counts["differentRelativeBandModulo9"] += 1
        elif a[1:4] != b[1:4]:
            assert any(0 < abs(x-y) <= 2 < 5 for x,y in zip(a[1:4],b[1:4]))
            counts["sameBandDifferentGridModulo5"] += 1
        else:
            assert a[4] != b[4]
            counts["sameBoxOppositeSignBit"] += 1
    assert sum(counts.values()) == 162*161//2
    return audited, counts


def parse_registry(registry):
    return {row["id"]: row for row in json.loads(registry["definitions"])[0]}, {
        row["id"]: row for row in json.loads(registry["definitions"])[1]}



def check_local_lifts(src, projection, registry, powers):
    expressions, indexed = parse_registry(registry)
    coord = lambda i: atom("coordinate", i)
    ell = coord(ELL)
    h = atom("parameter", "h")
    log2 = log(num(2))
    ratio = exp(mul(sub(ell,coord(3675253)),log2))
    d_exponent = sub(num(F(1, 2)),h)
    expected_reference_values = [mul(coord(R),sqrt(ratio)),mul(coord(Z),exp(mul(d_exponent,log(ratio)))),
                                 mul(coord(T),ratio)]
    expected_body_ids = {}
    for field_id, field in projection["fields"].items():
        actual = indexed[field_id]
        assert actual["name"] == field["name"]
        assert actual["directions"] == [R, Z, T, Y0, Y1, THETA]
        assert len(actual["rows"]) == 162
        assert not actual["sourceAuthenticated"]
        for row, bound in zip(actual["rows"], projection["rows"]):
            assert all(row[k] == value for k, value in bound.items())
            template = field["templatesBySign"][str(row["label"]["sign"])]
            assert row["localBody"] == template["localBody"]
            assert row["localSystem"] == template["localSystem"]
            assert row["localParameters"] == template["localParameters"]
        for sign, template in field["templatesBySign"].items():
            outer = expressions[template["localSystem"]]
            assert outer["body"] == template["localBody"] and outer["parameters"] == template["localParameters"]
            hits = [n for n in src.get(outer["body"], "multiply")[1] if str(n) in projection["referenceCalls"]]
            assert len(hits) == 1
            call = projection["referenceCalls"][str(hits[0])]
            op, (system, values, orders) = src.get(hits[0], "m3_coupled_expression_partial")
            assert system == call["ownSystem"] and values == call["values"] and not any(orders)
            own = expressions[system]
            assert own["parameters"] == call["parameters"] == outer["parameters"]
            assert own["parameters"][7:] == [3675253, Y0, Y1, C0, C1, N0, N1, THETA, DELTA]
            assert values[3:] == own["parameters"][3:]
            for value, expected in zip(values[:3],expected_reference_values):
                src.exact(value,expected)
            assert system not in expected_body_ids
            expected_body_ids[system] = (int(sign), field_id, own["body"], own["derivativeLimits"])

    q_label = exp(minus(mul(ell,log2)))
    q = mul(q_label,atom("slow_inverse_s"))
    x_alias = {S: atom("slow_inverse_s")}
    formal_ci = atom("positive_ci")
    ci_id = 623025
    log_tg = log(add(num(4),sqrt(num(2))))
    cover_index = floor(mul(sub(mul(add(num(1),h),ell,log2),mul(num(2),log(ell))),inv(log_tg)))
    src.exact(ci_id,mul(exp(mul(log_tg,cover_index)),exp(mul(add(num(1),h),log(q_label)))))
    dgeom = sub(num(4), mul(num(2), sqrt(num(2))))
    vr = (num(1), sub(num(1), sqrt(num(2))))
    vt = (sub(sqrt(num(2)), num(1)), num(1))
    expected_slow = (sub(minus(mul(log(q), inv(log2))), ell),
                     sub(mul(coord(T), pow_nat(ell, 6)), coord(623857)),
                     sub(mul(coord(Z), pow_nat(ell, 6)), coord(623856)),
                     sub(mul(coord(R), pow_nat(ell, 6)), coord(623855)))
    receipts = []
    for system, (sign, field, body, limits) in expected_body_ids.items():
        assert len(limits) == 16 and all(i == 16 for i in limits)
        local = body
        slow = []
        for i, expected in enumerate((*expected_slow, None)):
            op, (test, lo, hi, before, mid, after) = src.get(local, "smooth_piecewise")
            assert before == after == 0
            if i == 4:
                assert [test,lo,hi] == [X,3617,28826]
            else:
                assert [src.number(lo),src.number(hi)] == [F(-3,4),F(3,4)]
                src.exact(test, expected, aliases=x_alias)
            slow.append(local)
            local = mid
        selector = []
        for d in range(5):
            op, (test, lo, hi, left, inside, right) = src.get(local, "smooth_piecewise")
            assert test == DELTA and left == right
            assert [src.number(lo), src.number(hi)] == [F(2*d-1,2), F(2*d+1,2)]
            selector.append(inside)
            local = left
        assert local == 0
        cases = []
        for d, (matrix, first) in enumerate(zip(powers, selector)):
            op, (xi, lo, hi, before, second, after) = src.get(first, "smooth_piecewise")
            assert before == after == 0 and [src.number(lo),src.number(hi)] == [-R0,R0]
            op, (v, lo_v, ls, before_v, true_body, after_v) = src.get(second, "smooth_piecewise")
            assert lo_v == before_v == after_v == 0
            offset = [sub(sub(add(mul(num(a),coord(Y0)),mul(num(b),coord(Y1))),coord(c)),coord(n))
                      for (a,b),c,n in zip(matrix,(C0,C1),(N0,N1))]
            xi_nf = mul(add(*(mul(a,b) for a,b in zip(vr,offset))),inv(dgeom))
            eta_nf = mul(add(*(mul(a,b) for a,b in zip(vt,offset))),inv(dgeom))
            src.exact(xi, xi_nf)
            src.exact(v, mul(add(eta_nf, num(R0)), inv(formal_ci)), aliases={ci_id: formal_ci})
            src.exact(ls, mul(num(2*R0),inv(formal_ci)), aliases={ci_id: formal_ci})
            cases.append({"difference":d,"transverseGuard":first,"longitudinalGuard":second,
                          "xi":xi,"v":v,"pulseLength":ls,"guardedSourceBody":true_body})
        receipts.append({"field":field,"sign":sign,"ownSystem":system,"ownBody":body,
                         "slowGuards":slow,"auxiliaryCases":cases})

    for atom_id, partial in projection["indexedAtoms"].items():
        op, (field,values,orders) = src.get(int(atom_id), "m3_coupled_indexed_partial")
        assert field == partial["field"] and values == partial["arguments"] and orders == partial["orders"]
        local = partial["localOrders"]
        assert local == [orders[0],orders[1],orders[2],0,0,0,0,0,orders[3],orders[4],0,0,0,0,orders[5],0]
        assert all(0 <= i <= 16 for i in local)
    assert len(receipts) == 16 and len(projection["indexedAtoms"]) == 100
    return receipts


def controls(src, projection, registry, powers, local_lifts):
    results = {}
    for name, edit in (
        ("wrongSignCenter", lambda r: r[0]["values"].__setitem__(10, r[1]["values"][10])),
        ("wrongSignNearestCopy", lambda r: r[0]["values"].__setitem__(12, r[1]["values"][12])),
        ("missingOutermostBandGuard", lambda r: r[0]["guards"].pop()),
        ("differentCoveringDifference", lambda r: r[0]["label"].__setitem__("fixedDifference", r[54]["label"]["fixedDifference"])),
    ):
        changed = {"rows": deepcopy(projection["rows"])}
        edit(changed["rows"])
        try:
            check_rows(src,changed,powers)
        except AssertionError:
            results[name] = "REJECTED"
        else:
            raise AssertionError(name)
    guard = local_lifts[0]["auxiliaryCases"][0]["transverseGuard"]
    node = deepcopy(src.nodes[guard])
    node["args"][2] = 300173  # the actual rational 2*r0, not r0
    try:
        check_local_lifts(Source({**src.nodes,guard:node}),projection,registry,powers)
    except AssertionError:
        results["widenedActualTransverseGuard"] = "REJECTED"
    else:
        raise AssertionError("widenedActualTransverseGuard")
    return results

def main(args):
    powers = matrices()
    palette = finite_palette(powers)
    reached = pinned(args.reached, REACHED_SHA)
    projection = pinned(args.projection, PROJECTION_SHA)
    registry = pinned(args.registry, REGISTRY_SHA)
    nodes = dict(reached["nodes"])
    count = verify_graph(args.graph, nodes)
    source = Source(nodes)
    pins = source_pins(args.repo)
    rows, pairs = check_rows(source, projection, powers)
    local_lifts = check_local_lifts(source, projection, registry, powers)
    negative = controls(source, projection, registry, powers, local_lifts)
    result = {"schema": "MathScope.M3.OriginalFixedSupportPalette/1", "producerCommit": COMMIT,
              "fullSourceGraphSHA256": GRAPH_SHA, "fullSourceNodeCount": count, "reachedNodesMatched": len(nodes),
              "registrySHA256": REGISTRY_SHA, "harmonicProjectionSHA256": PROJECTION_SHA,
              "sourcePins": pins, "palette": palette, "rowCount": len(rows), "pairCount": sum(pairs.values()),
              "pairSeparation": pairs, "rows": rows, "localLifts": local_lifts,
              "localLiftCaseCount": 5*len(local_lifts), "indexedPartialCount": len(projection["indexedAtoms"]),
              "negativeControls": negative,
              "status": "VERIFIED_FIXED_LABEL_PALETTE_AND_ACTUAL_LIFTS",
              "conditionalDerivativeSupport": "Each local derivative must be defined and inherit the original zero extension and flat joins. The palette does not prove these regularity premises.",
              "nearestCopySeam": "Both adjacent integer lifts lie outside the support rectangle in a neighborhood of a coordinate seam. Fixed-label auxiliary zeros are independent of evaluation of the local body.",
              "completeSecondForcingInput": False}
    args.output.write_text(json.dumps(result, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"status": result["status"], "rows": len(rows), "pairs": sum(pairs.values()),
                      "positiveResidues": palette["positiveResidueCount"], "clearance": palette["strictClearanceAbove"],
                      "localLiftCases": result["localLiftCaseCount"], "controls": negative}))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    for name in ("repo", "graph", "registry", "reached", "projection", "output"):
        p.add_argument("--"+name, required=True, type=Path)
    main(p.parse_args())
