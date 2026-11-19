"""Independently reconstruct the actual Picard terms and differential maps."""

from argparse import ArgumentParser
from fractions import Fraction
from functools import cache
import gzip
from hashlib import sha256
import json
from pathlib import Path


REGISTRY = "049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad"
STREAM = "ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd"
EVIDENCE = {
    "axial-picard/ORIGINAL_PICARD_ANALYTIC.md": "616008ecc34a358b5be24faf57484551c3102db09e92bdb1699c025e36118901",
    "axial-picard/majorants.json": "018c84679a482b887517988a2fdcd7d27e13566ed88b09e1ac6dc17c26ac5021",
    "axial-order-one-identity/general-source-picard/source-picard-scope.json": "b5ee46e2cdf6007b121ba469deb4e4a52ee6a4f5c913d34fc0b48e40c35785fb",
    "axial-order-one-identity/leading-B/leading-B.json": "11fdc71bb1975637193b1808962d07c0c648eceda5e11667ab6898f8958755cd",
}


class Terms:
    def __init__(self, raw):
        self.raw = raw
        self.rows = []
        self.indices = {}
        self.zero = self.q(0)
        self.one = self.q(1)

    def form(self, op, arguments=(), metadata=()):
        key = (op, tuple(arguments), tuple(metadata))
        if key not in self.indices:
            self.indices[key] = len(self.rows)
            self.rows.append(key)
        return self.indices[key]

    def q(self, value):
        value = Fraction(value)
        return self.form("q", metadata=(value.numerator, value.denominator))

    def literal(self, index):
        op, _, meta = self.rows[index]
        return Fraction(*meta) if op == "q" else None

    def coord(self, symbol):
        return self.form("coord", metadata=(symbol,))

    def ring(self, op, arguments):
        identity = 0 if op == "add" else 1
        constant = Fraction(identity)
        children = []
        for item in arguments:
            tag, operands, meta = self.rows[item]
            for child in operands if tag == op else [item]:
                value = self.literal(child)
                if value is None:
                    children.append(child)
                elif op == "add":
                    constant += value
                else:
                    constant *= value
        if op == "mul" and constant == 0:
            return self.zero
        if op == "add":
            coefficients = {}
            for child in children:
                tag, factors, _ = self.rows[child]
                if tag != "mul":
                    factors = (child,)
                rational, symbolic = Fraction(1), []
                for factor in factors:
                    value = self.literal(factor)
                    if value is None:
                        symbolic.append(factor)
                    else:
                        rational *= value
                key = tuple(symbolic)
                coefficients[key] = coefficients.get(key, 0) + rational
            children = [self.mul(self.q(coefficient), *key) for key, coefficient in coefficients.items() if coefficient]
        if constant != identity or not children:
            children.append(self.q(constant))
        return children[0] if len(children) == 1 else self.form(op, sorted(children))

    def add(self, *values):
        return self.ring("add", values)

    def mul(self, *values):
        return self.ring("mul", values)

    def neg(self, value):
        return self.mul(self.q(-1), value)

    def power(self, base, exponent):
        if not exponent:
            return self.one
        if exponent == 1:
            return base
        value = self.literal(base)
        if value is not None:
            return self.q(value ** exponent)
        if exponent < 0:
            return self.power(self.form("inverse", [base]), -exponent)
        return self.form("power", [base], [exponent])

    def other(self, op, values, meta=()):
        if op == "inverse":
            return self.power(values[0], -1)
        if op == "exp" and values[0] == self.zero:
            return self.one
        if op == "log_positive" and values[0] == self.one:
            return self.zero
        if op == "sqrt_positive" and values[0] in (self.zero, self.one):
            return values[0]
        if op == "smooth_piecewise":
            x, a, b, before, middle, after = values
            # Compare ordinary values on admitted source frames, where the
            # switch coordinate and endpoints are defined. The stored
            # compiler can retain a choice whose three arms are all zero.
            if before == middle == after:
                return before
            if x == a:
                return before
            if x == b:
                return after
            lx, la, lb = map(self.literal, (x, a, b))
            if lx is not None and la is not None and lb is not None:
                if lx <= la:
                    return before
                return after if lx >= lb else middle
        return self.form(op, values, meta)

    @cache
    def free(self, index):
        op, arguments, _ = self.rows[index]
        if op == "coord":
            return frozenset({index})
        if op == "integral":
            body, binder, a, b = arguments
            return (self.free(body) - {binder}) | self.free(a) | self.free(b)
        return frozenset().union(*(self.free(child) for child in arguments))

    def multiply_polynomials(self, left, right):
        if max(left) + max(right) > 16:
            return None
        product = {}
        for i, a in left.items():
            for j, b in right.items():
                product[i + j] = self.add(product.get(i + j, self.zero), self.mul(a, b))
        return product

    @cache
    def polynomial(self, index, binder):
        if binder not in self.free(index):
            return {0: index}
        if index == binder:
            return {1: self.one}
        op, values, meta = self.rows[index]
        if op == "add":
            result = {}
            for value in values:
                item = self.polynomial(value, binder)
                if item is None:
                    return None
                for power, coefficient in item.items():
                    result[power] = self.add(result.get(power, self.zero), coefficient)
            return result
        if op == "mul" or op == "power" and 0 <= meta[0] <= 16:
            result = {0: self.one}
            for value in values if op == "mul" else values * meta[0]:
                item = self.polynomial(value, binder)
                if item is None:
                    return None
                result = self.multiply_polynomials(result, item)
                if result is None:
                    return None
            return result
        return None

    def integral(self, body, binder, left, right):
        if body == self.zero or left == right:
            return self.zero
        factor = self.polynomial(body, binder)
        if factor is not None:
            return self.add(*(self.mul(coefficient, self.q(Fraction(1, degree + 1)),
                self.add(self.power(right, degree + 1), self.neg(self.power(left, degree + 1))))
                for degree, coefficient in factor.items()))
        return self.form("integral", [body, binder, left, right])

    @cache
    def sub(self, index, variable, value):
        if index == variable:
            return value
        if variable not in self.free(index):
            return index
        op, args, meta = self.rows[index]
        if op == "integral":
            body, binder, a, b = args
            a, b = self.sub(a, variable, value), self.sub(b, variable, value)
            if binder != variable:
                if binder in self.free(value) and variable in self.free(body):
                    rebound = self.coord(("independent-alpha", index, variable, value))
                    body, binder = self.sub(body, binder, rebound), rebound
                body = self.sub(body, variable, value)
            return self.integral(body, binder, a, b)
        children = tuple(self.sub(child, variable, value) for child in args)
        if op in ("add", "mul"):
            return self.ring(op, children)
        if op == "power":
            return self.power(children[0], meta[0])
        return self.other(op, children, meta)

    @cache
    def read(self, index):
        item = self.raw[index]
        op, args = item["op"], item["args"]
        if op == "rational":
            return self.q(Fraction(*map(int, args)))
        if op == "coordinate":
            return self.coord(index)
        if op == "source_parameter":
            return self.form(op, metadata=args)
        if op == "definite_integral":
            return self.integral(*map(self.read, args))
        if op == "integer_power":
            return self.power(self.read(args[0]), args[1])
        if op == "source_step_derivative":
            return self.other(op, [self.read(args[0])], [args[1]])
        if op == "actual_natural_series":
            return self.other(op, tuple(map(self.read, args[1:3])), [args[0], *args[3:]])
        if op in ("actual_background_picard", "actual_background_even_profile"):
            return self.other(op, tuple(map(self.read, args[2:4])), [*args[:2], *args[4:]])
        if op == "actual_expression_partial":
            return self.other(op, tuple(map(self.read, args[1])), [args[0], *args[2]])
        if op == "actual_quadratic_root":
            return self.other(op, [self.read(args[2])], args[:2])
        if op == "actual_monotone_root":
            return self.other(op, tuple(map(self.read, args[1:])), args[:1])
        if op in ("add", "multiply"):
            return self.ring("add" if op == "add" else "mul", tuple(map(self.read, args)))
        return self.other(op, tuple(map(self.read, args)))

    @cache
    def derivative(self, index, eta):
        node = self.raw[index]
        normalized = self.read(index)
        if normalized == eta:
            return self.one
        if eta not in self.free(normalized):
            return self.zero
        op, args = node["op"], node["args"]
        at = self.read

        def d(i):
            return self.derivative(i, eta)

        if op == "add":
            return self.add(*map(d, args))
        if op == "multiply":
            a,b = args
            return self.add(self.mul(d(a),at(b)), self.mul(at(a),d(b)))
        if op == "inverse":
            return self.neg(self.mul(d(args[0]), self.power(normalized, 2)))
        if op == "integer_power":
            return self.mul(self.q(args[1]), self.power(at(args[0]), args[1] - 1), d(args[0]))
        if op == "exp":
            return self.mul(normalized, d(args[0]))
        if op == "log_positive":
            return self.mul(d(args[0]), self.power(at(args[0]), -1))
        if op == "sqrt_positive":
            return self.mul(d(args[0]), self.power(self.mul(self.q(2), normalized), -1))
        if op == "source_step_derivative":
            return self.mul(self.form(op, [at(args[0])], [args[1] + 1]), d(args[0]))
        if op == "smooth_piecewise":
            return self.other(op, [*map(at,args[:3]), *map(d, args[3:])])
        if op == "definite_integral":
            body, binder, a, b = args
            interior = self.zero if at(binder) == eta else self.integral(d(body), at(binder), at(a), at(b))
            left = self.zero if d(a) == self.zero else self.mul(self.sub(at(body), at(binder), at(a)), d(a))
            right = self.zero if d(b) == self.zero else self.mul(self.sub(at(body), at(binder), at(b)), d(b))
            return self.add(interior, right, self.neg(left))
        if op in ("actual_natural_series", "actual_background_even_profile", "actual_background_picard"):
            _, values, meta = self.rows[normalized]
            first, second = args[1:3] if op == "actual_natural_series" else args[2:4]
            eta_term = self.mul(d(second), self.form(op, values, [*meta[:-1], meta[-1] + 1]))
            if d(first) == self.zero:
                return eta_term
            assert op != "actual_background_picard"
            radial_term = self.mul(d(first), self.form(op, values, [*meta[:-2], meta[-2]+1, meta[-1]]))
            return self.add(radial_term,eta_term)
        raise ValueError((op, args))

    @cache
    def fingerprint(self, index, bound=()):
        op, args, meta = self.rows[index]
        if op == "coord" and index in bound:
            return sha256(repr(("bound", bound[::-1].index(index))).encode()).digest()
        if op == "integral":
            body, binder, a, b = args
            child_hashes = [self.fingerprint(body,bound+(binder,)),self.fingerprint(a,bound),self.fingerprint(b,bound)]
        else:
            child_hashes = [self.fingerprint(x,bound) for x in args]
        if op in ("add", "mul"):
            child_hashes.sort()
        return sha256(repr((op, meta)).encode() + b"".join(child_hashes)).digest()

    @cache
    def atom_hash(self,index,bound):
        op,args,meta = self.rows[index]
        if op == "coord" and index in bound:
            return sha256(repr(("bound", bound[::-1].index(index))).encode()).digest()
        if op == "integral":
            body, binder, left, right = args
            hashes = [self.algebra_hash(body,bound+(binder,)),self.algebra_hash(left,bound),self.algebra_hash(right,bound)]
        else:
            hashes = [self.algebra_hash(child,bound) for child in args]
        return sha256(repr((op,meta)).encode() + b"".join(hashes)).digest()

    @cache
    def polynomial_hash(self,index,bound):
        op,args,meta = self.rows[index]
        if op == "q":
            q = Fraction(*meta)
            return {():q} if q else {}
        if op == "add":
            expanded = {}
            for child in args:
                for key,c in self.polynomial_hash(child,bound).items():
                    expanded[key] = expanded.get(key,Fraction(0)) + c
            return {k:c for k,c in expanded.items() if c}
        if op == "mul" or op == "power" and meta[0] <= 16:
            expanded = {():Fraction(1)}
            for child in args if op == "mul" else args * meta[0]:
                factor = self.polynomial_hash(child,bound)
                assert len(expanded) * len(factor) <= 25000, "Independent coefficientwise expansion exceeded its fixed budget"
                new = {}
                for left,x in expanded.items():
                    for right,y in factor.items():
                        key = tuple(sorted(left+right))
                        new[key] = new.get(key,Fraction(0)) + x*y
                expanded = {k:c for k,c in new.items() if c}
            return expanded
        return {(self.atom_hash(index,bound),):Fraction(1)}

    @cache
    def algebra_hash(self,index,bound):
        polynomial = self.polynomial_hash(index,bound)
        if len(polynomial) == 1:
            (term,coefficient), = polynomial.items()
            if len(term) == 1 and coefficient == 1:
                return term[0]
        return sha256(repr(tuple((key,c.numerator,c.denominator) for key,c in sorted(polynomial.items()))).encode()).digest()

    def equal(self, actual, expected):
        return self.fingerprint(actual) == self.fingerprint(expected) or self.algebra_hash(actual,()) == self.algebra_hash(expected,())

    def check(self, actual, expected, label):
        assert self.equal(self.read(actual), expected), label


def audit(data, source, replay):
    sid = data["system"]
    assert data["source"] == source and data["sourceSHA256"] == STREAM and data["registrySHA256"] == REGISTRY
    assert replay["system"] == sid and replay["radialDomain"] == source["radialDomain"]
    assert replay["eta"] == source["eta"] == 2 and not replay["unproved"]
    assert replay["coefficientRoots"] == sorted({*source["forcing"], *(x for matrix in (source["A0"],source["A1"]) for row in matrix for x in row)})
    trace = Terms(dict(data["nodes"]))
    xi, eta = map(trace.read, [source["xi"], source["eta"]])
    native_t = trace.coord(("independent-unit", sid))
    shifted = trace.mul(native_t, xi)
    shape = source["diagonal"]
    assert shape == [0, 0, 2, 0, 3, 1] and source["zeroAxisDatum"] == [0] * 6
    assert all(value == 0 for i, row in enumerate(source["A1"]) for j, value in enumerate(row) if i < 4 or j >= 4)
    A0, A1 = [[[trace.read(i) for i in row] for row in source[family]] for family in ("A0","A1")]
    f = list(map(trace.read, source["forcing"]))
    terms = [list(map(trace.read, term)) for term in data["displays"][3]["terms"]]
    jets = [list(map(trace.read, row)) for row in data["partialDerivatives"]]

    for k in range(2):
        for j in range(6):
            actual_term = data["displays"][3]["terms"][k][j]
            trace.check(data["partialDerivatives"][k][j], trace.derivative(actual_term, eta), (sid, "term eta", k, j))
    for k in range(3):
        for j in range(6):
            operand = f[j] if k == 0 else trace.add(
                *(trace.mul(a, w) for a, w in zip(A0[j],terms[k-1],strict=True)),
                *(trace.mul(a, w) for a, w in zip(A1[j],jets[k-1],strict=True)),
            )
            weighted = trace.mul(trace.power(native_t,shape[j]),trace.sub(operand,xi,shifted))
            independent = trace.mul(xi,trace.integral(weighted,native_t,trace.zero,trace.one))
            trace.check(data["displays"][3]["terms"][k][j], independent, (sid,"Volterra term",k,j))

    for r, display in enumerate(data["displays"]):
        assert display["count"] == r and len(display["terms"]) == r
        for j, actual in enumerate(display["sum"]):
            for k in range(r):
                trace.check(display["terms"][k][j],terms[k][j],(sid,"display-agreement",r,k,j))
            trace.check(actual,trace.add(*(terms[k][j] for k in range(r))),(sid,"display-sum",r,j))
    assert data["axis"] == [[0] * 6,[0] * 6]
    assert data["displayNineRejected"] is (True if sid == 0 else None)

    D0,D1 = [[[trace.read(i) for i in row] for row in matrix] for matrix in data["rhsEtaCoefficients"]]
    df = list(map(trace.read,data["rhsEtaForcing"]))
    for source_row, actual_row in zip([*source["A0"],*source["A1"],source["forcing"]],[*D0,*D1,df],strict=True):
        assert all(trace.equal(trace.derivative(original,eta),actual)
            for original,actual in zip(source_row,actual_row,strict=True)), (sid,"native coefficient eta derivative")
    def w(j,m):
        return trace.form("actual_background_picard",[xi,eta],[sid,j,m])
    radial_control = 0
    for m in (0,1):
        for j in range(6):
            base = [f[j] if not m else df[j]]
            for k in range(6):
                base.extend([trace.mul(A0[j][k],w(k,m)),trace.mul(A1[j][k],w(k,m+1))])
                if m:
                    base.extend([trace.mul(D0[j][k],w(k,0)),trace.mul(D1[j][k],w(k,1))])
            H = trace.add(*base)
            trace.check(data["rhs"][m][j],H,(sid,"native RHS",m,j))
            average = trace.integral(trace.mul(trace.power(native_t,shape[j]),trace.sub(H,xi,shifted)),native_t,trace.zero,trace.one)
            regular = trace.add(H,trace.mul(trace.q(-shape[j]),average))
            trace.check(data["radial"][m][j],regular,(sid,"regular radial derivative",m,j))
            if shape[j] and trace.fingerprint(H) != trace.fingerprint(regular):
                radial_control += 1
    a1_control = 0
    for j in range(6):
        if any(a != trace.zero for a in A1[j]):
            wrong = trace.add(f[j],*(trace.mul(a,w(k,0)) for k,a in enumerate(A0[j])),
                              *(trace.mul(a,w(k,0)) for k,a in enumerate(A1[j])))
            if trace.fingerprint(trace.read(data["rhs"][0][j])) != trace.fingerprint(wrong):
                a1_control += 1
    assert a1_control == 2 and radial_control == 6
    return {"system":sid,"order":source["order"],"radialDomain":source["radialDomain"],"originalCoefficientRoots":len(replay["coefficientRoots"]),
        "exactFiniteTerms":18,"finiteDisplaySums":24,"etaRHSAndRadial":24,"zeroAxisTraces":12,
        "independentEtaDerivatives":90,"wrongA1EtaShiftRejectedRows":a1_control,
        "omittingRegularRadialAverageRejectedRows":radial_control,
        "nodes":len(data["nodes"])}


def main():
    parser = ArgumentParser(description=__doc__)
    for field in ("graphs","archive","goal","ingress","tail","out"):
        parser.add_argument("--"+field,type=Path,required=True)
    args = parser.parse_args()
    assert __debug__
    registry = (args.archive/"original-source-functions.json").read_bytes()
    assert sha256(registry).hexdigest() == REGISTRY
    systems = json.loads(json.loads(registry)["base"]["picard"])
    prefix, original = [], sha256()
    with gzip.open(args.archive/"original-source-nodes.jsonl.gz","rb") as raw_source:
        header = next(raw_source)
        assert json.loads(header)["node_count"] == 7358162
        original.update(header)
        for i,line in enumerate(raw_source):
            original.update(line)
            if i <= 130347:
                prefix.append(json.loads(line))
    assert i+1 == 7358162 and original.hexdigest() == STREAM
    for file, expected in EVIDENCE.items():
        assert sha256((args.goal/file).read_bytes()).hexdigest() == expected, file
    ingress_bytes = args.ingress.read_bytes()
    tail_bytes = args.tail.read_bytes()
    assert sha256(ingress_bytes).hexdigest() == "14d32aff0e47f0bc8ca5900799fb4727dd57c91db79580b57f2d51d31cfa0590"
    assert sha256(tail_bytes).hexdigest() == "f9c3f539b8bf1a22dbbe07f21c95730020de571a44ced8e7cbb8cac699b73e48"
    source_body_scope = json.loads(ingress_bytes)["sourceSystems"]
    manifest = json.loads((args.graphs/"manifest.json").read_bytes())
    assert manifest["registrySHA256"] == REGISTRY and manifest["sourceSHA256"] == STREAM
    assert [row["system"] for row in manifest["rows"]] == list(range(10))
    rows = []
    for row in manifest["rows"]:
        data = (args.graphs/row["file"]).read_bytes()
        assert sha256(data).hexdigest() == row["sha256"]
        source = json.loads(gzip.decompress(data))
        sid = row["system"]
        assert len(source["nodes"]) == row["reached"] and source["system"] == sid
        assert all(prefix[i] == record for i,record in source["nodes"] if i < len(prefix))
        result = audit(source,systems[sid],source_body_scope[sid])
        result["preservedOriginalNodes"] = sum(i < len(prefix) for i,_ in source["nodes"])
        rows.append(result)
        print("PASS system", sid, flush=True)
    result = {
        "status":"VERIFIED_ORIGINAL_NATIVE_RECURRENCE_AND_RADIAL_RHS_CONDITIONAL_LIMIT",
        "sourceRegistrySHA256":REGISTRY,"sourceStreamSHA256":STREAM,
        "originalAnalyticPremisesPins":EVIDENCE,
        "sourceTypedIngressSHA256":sha256(ingress_bytes).hexdigest(),
        "sourceAuxiliaryTailSHA256":sha256(tail_bytes).hexdigest(),
        "systems":rows,
        "arbitraryDisplayDegreeConclusion":"The same literal G and K definitions give the mathematical recurrence for any fixed degree. The original API guards degrees above eight.",
        "conditionalConvergentMeaning":"Under the original B.26 leading, auxiliary natural, coefficient-majorant, holomorphic strip and ordinary join premises, the shared Volterra recurrence has its unique regular solution and fixed mixed derivatives. The retained derivative tags denote those derivatives.",
        "remaining":"No evaluated truncation K or all charts, all orders, final-jet or release evidence.",
    }
    args.out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8",newline="\n")


if __name__ == "__main__":
    main()
