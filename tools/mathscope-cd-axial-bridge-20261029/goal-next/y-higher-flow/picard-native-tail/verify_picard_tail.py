"""Bind the original live Picard tail constructors to exact positive-source inequalities."""

from argparse import ArgumentParser
from fractions import Fraction
from functools import cache
import gzip
from hashlib import sha256
import json
from math import factorial
from pathlib import Path


SOURCE = "ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd"
REGISTRY = "049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad"
PROFILE = "e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152"
PREVIOUS = "6cf52d3f2c05f8173b8640229c270dcdc962da5626f5574927933c2fef9e58b3"
POSITIVE_PARAMETERS = {"h", "rho", "Lambda", "Q", "Xa", "t1", "sigmaStar", "CSelected"}
KCONDITION = [24825,117202,117787,118577,120959,121901,124035,125101,127432,128619]


def q(value):
    value = Fraction(value)
    return ("q", value)


def scale(*factors):
    constant = Fraction(1)
    symbols = {}
    for factor in factors:
        if factor[0] == "q":
            constant *= factor[1]
        else:
            operands = factor[2] if factor[0] == "scale" else ((factor,1),)
            if factor[0] == "scale":
                constant *= factor[1]
            for atom, power in operands:
                symbols[atom] = symbols.get(atom,0) + power
    if not constant:
        return q(0)
    symbols = tuple(sorted(((a,n) for a,n in symbols.items() if n),key=repr))
    if not symbols:
        return q(constant)
    if constant == 1 and len(symbols) == 1 and symbols[0][1] == 1:
        return symbols[0][0]
    return ("scale",constant,symbols)


def add(*terms):
    constant = Fraction(0)
    others = []
    for term in terms:
        if term[0] == "q":
            constant += term[1]
        elif term[0] == "add":
            constant += term[1]
            others.extend(term[2])
        else:
            others.append(term)
    if not others:
        return q(constant)
    if not constant and len(others) == 1:
        return others[0]
    return ("add",constant,tuple(sorted(others,key=repr)))


def pow_(argument,n):
    if n == 0:
        return q(1)
    if n == 1:
        return argument
    if argument[0] == "q":
        return q(argument[1] ** n)
    if argument[0] == "scale":
        _, c, ops = argument
        return ("scale", c ** n, tuple((atom,power*n) for atom,power in ops))
    return ("scale",Fraction(1),((argument,n),))


def op(name,args):
    if name == "maximum" and all(arg[0] == "q" for arg in args):
        return q(max(arg[1] for arg in args))
    if name == "log_positive" and args == [q(1)]:
        return q(0)
    if name == "exp" and args == [q(0)]:
        return q(1)
    if name == "ceiling" and args[0][0] == "q":
        value = args[0][1]
        return q(-((-value.numerator)//value.denominator))
    children = tuple(sorted(args,key=repr) if name == "maximum" else args)
    # Retain the exact canonical child identities behind each transcendental
    # or order operation while keeping long recursive bound graphs compact.
    return (name,sha256(repr(children).encode()).hexdigest())


def sign(node,nodes):
    name, args = nodes[node]["op"], nodes[node]["args"]
    if name == "rational":
        value = int(args[0])
        return (value > 0) - (value < 0)
    if name == "source_parameter":
        assert args[0] in POSITIVE_PARAMETERS, (name,args)
        return 1
    if name == "add":
        children = [sign(child,nodes) for child in args]
        assert all(x >= 0 for x in children), (node,args)
        return max(children)
    if name == "multiply":
        a,b = args
        return sign(a,nodes) * sign(b,nodes)
    if name == "integer_power":
        base,n = args
        s = sign(base,nodes)
        assert s or n > 0
        return s ** n if n >= 0 else s ** (-n)
    if name == "inverse":
        result = sign(args[0],nodes)
        assert result
        return result
    if name == "exp":
        return 1
    if name == "maximum":
        return max(sign(x,nodes) for x in args)
    raise AssertionError((node,name,args))


def check_profile(p):
    def I(i):
        return {"integer":i}
    def r(name):
        return {"ref":name}
    expected = {
        "Md":I(1048576),
        "T":{"sum":[{"exp":r("Md")},I(10)]},
        "h":{"exp":{"product":[I(-8002),r("T")]}},
        "j0":{"power":[r("h"),4]},
        "sigmaStar":{"quotient":[r("j0"),I(2000)]},
        "rho":{"quotient":[{"power":[r("sigmaStar"),2]},I(65536)]},
        "logP":{"product":[I(2),r("T")]},
        "Pstar":{"exp":r("logP")},
        "K":{"power":[r("Pstar"),2]},
        "Q":{"quotient":[{"product":[I(str(2**260)),r("K")]},{"power":[r("sigmaStar"),2]}]},
        "Lambda":{"power":[r("Q"),64]},
        "Xa":{"quotient":[I(4),r("Lambda")]},
        "BRefUpper":{"power":[r("Q"),300]},
        "logCSelected":{"sum":[{"product":[I(10),{"log":{"sum":[I(1),r("BRefUpper")]}}]},{"power":[r("Q"),200]}]},
        "CSelected":{"exp":r("logCSelected")},
        "t1":{"power":[r("CSelected"),-120]},
    }
    assert p == expected


def verify(live,archive,prior):
    assert live["parameterExpressionSHA256"] == PROFILE
    check_profile(live["profileScalars"])
    raw_registry = (archive/"original-source-functions.json").read_bytes()
    assert sha256(raw_registry).hexdigest() == live["registrySHA256"] == REGISTRY
    original = json.loads(json.loads(raw_registry)["base"]["picard"])
    assert len(original) == 10 and live["actualRegistryMatches"]
    old = prior.read_bytes()
    assert sha256(old).hexdigest() == PREVIOUS
    old = json.loads(old)
    assert old["sourceRegistrySHA256"] == REGISTRY and old["sourceStreamSHA256"] == SOURCE
    assert [r["system"] for r in old["systems"]] == list(range(10))
    nodes = dict(live["nodes"])
    assert len(nodes) == len(live["nodes"])
    entire_digest, prefix_digest = sha256(), sha256(b"[")
    with gzip.open(archive/"original-source-nodes.jsonl.gz","rb") as file:
        header = next(file)
        assert json.loads(header)["node_count"] == 7358162
        entire_digest.update(header)
        prefix_nodes = live["originalFirstNodes"]
        assert prefix_nodes == 130348
        for i,line in enumerate(file):
            entire_digest.update(line)
            if i < prefix_nodes:
                if i:
                    prefix_digest.update(b",")
                prefix_digest.update(line.rstrip(b"\r\n"))
            if i in nodes and i < live["originalNodeCountBeforeQueries"]:
                assert json.loads(line) == nodes[i], i
    assert i+1 == 7358162 and entire_digest.hexdigest() == SOURCE
    prefix_digest.update(b"]")
    assert prefix_digest.hexdigest() == live["originalPrefixSHA256"]

    def expr(i):
        n = nodes[i]
        return n["op"], n["args"]

    @cache
    def norm(i):
        name,args = expr(i)
        if name == "rational":
            return q(Fraction(*map(int,args)))
        if name == "source_parameter":
            return ("parameter",args[0])
        if name == "integer_power":
            return pow_(norm(args[0]),args[1])
        if name == "multiply":
            return scale(*map(norm,args))
        if name == "add":
            return add(*map(norm,args))
        if name == "inverse":
            return pow_(norm(args[0]),-1)
        return op(name,list(map(norm,args)))

    Lambda,Q,rho,t1,h,Xa = (("parameter",key) for key in ("Lambda","Q","rho","t1","h","Xa"))
    e = lambda value: op("exp",[value])
    ln = lambda value: op("log_positive",[value])
    maxi = lambda *rows: op("maximum",list(rows))
    ceil = lambda value: op("ceiling",[value])
    boot = live["bootstrapHistorical"]
    B = scale(q(4096),pow_(Lambda,2),pow_(Q,3),pow_(t1,-1))
    Delta = scale(rho,q(Fraction(1,1024)),pow_(Q,-1))
    C1 = scale(q(2**18),pow_(B,2),pow_(Delta,-2))
    # These are all source identities, not guessed upper-cap values.
    assert norm(boot["B"]) == B and norm(boot["delta"]) == Delta and norm(boot["C1"]) == C1
    assert sorted(row["index"] for row in live["rows"]) == list(range(10))
    summary = []
    for row in live["rows"]:
        sid,n,kind = row["index"],row["order"],row["kind"]
        sys = original[sid]
        C,s,a2,k = (row["indexData"][key] for key in ("C","s","aSquared","Kcondition"))
        s_norm = scale(Delta,q(Fraction(1,8 if sid==0 else 8*256**n)))
        assert norm(s) == s_norm and s == row["indexData"]["loss"] == sys["tail"]["loss"]
        assert [row["xi"],row["eta"],row["domain"]] == [sys["xi"],sys["eta"],sys["radialDomain"]]
        assert row["domain"] == [0,old["systems"][sid]["radialDomain"][1]]
        assert [C,s,k] == [sys["tail"][key] for key in ("sourceBound","solutionStrip","Kcondition")]
        assert k == KCONDITION[sid]
        assert norm(row["domain"][1]) == op("sqrt_positive",[norm(a2)])
        radius = Fraction(6)+Fraction(1,2**(n-1))
        if kind == "actual":
            assert norm(a2) == scale(Xa,e(scale(q(Fraction(1,16)),t1)))
        else:
            assert norm(a2) == scale(q(radius),pow_(Lambda,-1))
        assert norm(k) == ceil(scale(q(72),pow_(norm(C),2),norm(a2),pow_(norm(s),-1)))
        assert norm(row["indexData"]["solutionNorm"]) == e(scale(q(Fraction(9,2)),pow_(norm(C),2),norm(a2),pow_(norm(s),-1)))
        if sid == 0:
            assert kind == "actual" and n == 1 and row["cone"] is None and norm(C) == C1
        else:
            cone = row["cone"]
            assert norm(cone["bootstrapB"]) == B
            E,H,V,M = (norm(cone[name]) for name in ("E","H0","V0","matrixBound"))
            ZH = scale(H,add(scale(q(5),E),q(5),scale(q(6),norm(cone["e1"]))))
            assert norm(cone["e1"]) == scale(q(16),pow_(norm(cone["previousStrip"]),-1))
            assert E == add(q(4),scale(q(2*n),h))
            assert M == scale(q(512),add(q(1),E),add(q(1),H,V,ZH))
            assert norm(C) == scale(q(2),add(M,*map(norm,cone["forcingBounds"])))
            assert all(sign(i,nodes) >= 0 for i in [cone["V0"],cone["e1"],*cone["forcingBounds"]])
            if kind == "actual":
                assert H == maxi(q(1),B)
            else:
                g = norm(cone["gBound"])
                assert sign(cone["gBound"],nodes) == 1
                N0 = scale(q(64),Q,add(q(1),g))
                assert norm(cone["naturalBase"]) == N0 and norm(cone["radius"]) == q(radius)
                assert 0 < 8-radius <= 2
                multiply = maxi(q(1),scale(q(Fraction(2,1)/(8-radius)**2),pow_(Lambda,2)))
                assert H == maxi(q(1),scale(N0,multiply))
        seen = set()
        rejected_shift = set()
        for item in row["queries"]:
            m,bits = item["etaOrder"],item["bits"]
            assert (m,bits) not in seen
            seen.add((m,bits))
            assert [item["order"],item["kind"]] == [n,kind]
            assert item["positiveRemainderRetained"] and item["actualSourceConvergenceModulus"]
            assert not item["finiteDisplayedTermsCertified"]
            # P_m, the positivity guard max(1,P_m), and b log(2) are
            # retained as exact source operands in the historical graph.
            P = scale(q(factorial(m)),pow_(scale(q(2),pow_(norm(s),-1)),m))
            numerator = add(scale(q(bits),ln(q(2))),ln(maxi(q(1),P)))
            Kprec = ceil(scale(numerator,pow_(ln(q(4)),-1)))
            tags = expr(item["K"])
            assert tags[0] == "maximum" and tags[1][:2] == [1,k] and len(tags[1]) == 3
            assert norm(tags[1][2]) == Kprec
            expected = scale(q(Fraction(1,3)),P,e(scale(q(-1),norm(item["K"]),ln(q(4)))))
            assert norm(item["tail"]) == expected and norm(item["target"]) == q(Fraction(1,2**bits))
            if m:
                wrongP = scale(q(factorial(m)),pow_(pow_(norm(s),-1),m))
                alternative = scale(q(Fraction(1,3)),wrongP,e(scale(q(-1),norm(item["K"]),ln(q(4)))))
                assert norm(item["tail"]) != alternative
                rejected_shift.add((m,bits))
            # m! <= 16^m; s<=1; ln(2)>=1/2; ln(1/s)<=1/s-1.
            # These give unrounded Kprec <= [b/2+(7/2)m]/s <= 170/s.
            assert factorial(m) <= 16**m
            assert Fraction(bits,2) + Fraction(7*m,2) <= 170 < 288
        assert seen == {(m,b) for m in range(13) for b in (128,256)}
        assert len(rejected_shift) == 24
        summary.append({"system":sid,"order":n,"kind":kind,"xi":row["xi"],"eta":row["eta"],"aSquared":a2,
            "C":C,"solutionStrip":s,"Kcondition":k,"queries":len(seen),
            "omittedCauchyNumeratorFactorRejected":len(rejected_shift)})

    sid0 = summary[0]
    K0 = boot["K"]
    k0 = original[0]["tail"]["Kcondition"]
    m0 = boot["etaOrder"]
    target0 = norm(boot["target"])
    assert target0[0] == "q" and target0[1].numerator == 1
    denominator = target0[1].denominator
    bits0 = denominator.bit_length()-1
    assert denominator == 2**bits0
    assert bits0 in (128,256) and 0 <= m0 <= 4
    legacy = ceil(scale(q(Fraction(1,2)),add(q(bits0+m0*m0+4*m0),scale(q(2*m0),pow_(Delta,-1)))))
    assert norm(boot["Kprecision"]) == legacy
    assert expr(K0) == ("maximum",[1,k0,boot["Kprecision"]])
    s0 = norm(sid0["solutionStrip"])
    factor0 = scale(q(factorial(m0)),pow_(scale(q(2),pow_(s0,-1)),m0))
    assert norm(boot["error"]) == scale(q(Fraction(1,3)),factor0,e(scale(q(-1),norm(K0),ln(q(4)))))
    # The original legacy eta precondition also implies K0=Kcondition:
    # its unfloored threshold is at most this coefficient divided by delta.
    historical_upper = Fraction(bits0+m0*m0+4*m0,2)+m0
    assert historical_upper < 2304
    return {
        "status":"VERIFIED_LIVE_SOURCE_TAIL_FORMULAS_AND_EXACT_SYMBOLIC_INDEX_DOMINANCE",
        "sourceStreamSHA256":SOURCE,"registrySHA256":REGISTRY,"parameterExpressionSHA256":PROFILE,
        "nativeRecurrencePriorSHA256":PREVIOUS,"sameOriginalPrefixSHA256":live["originalPrefixSHA256"],
        "sameOriginalPrefixNodes":prefix_nodes,"scalarGraphNodes":len(nodes),
        "sourceSystems":summary,"tailRequests":sum(r["queries"] for r in summary),
        "wrongCauchyFactorControl":sum(r["omittedCauchyNumeratorFactorRejected"] for r in summary),
        "bootstrapHistorical":{**boot,"sourceBits":bits0,"unroundedPrecisionUpperOverDelta":str(historical_upper)},
        "tailInequalities":{
            "actualPositiveSourceCone":"Lambda>=1, C>=Lambda^2, a^2>=4/Lambda, 0<s<=1",
            "unroundedKconditionLower":"288*Lambda^3/s",
            "unroundedRequestedKprecisionUpper":"170/s for 0<=m<=12 and 0<bits<=256",
            "evaluatedKSelection":"exactly Kcondition for requested branches and historical bootstrap",
            "log2KconditionLower":"768*2^1048576",
            "tailFormula":"m!*(2/s)^m*4^(-K)/3 <= 2^(-bits)/3",
            "certifiedOrdinaryScope":"Conditional under the original C47/C54 actual coefficient majorants, B.26 semantics and Cauchy strip. Uniform for each admitted fixed source radial domain and eta in [-1,1].",
        },
        "remaining":["No K-term numerical evaluation or roundoff interval.",
            "General generated native derivatives above the checked scope and complete original Y charts remain open."],
        "release":"HOLD",
    }


def main():
    parser = ArgumentParser(description=__doc__)
    for field in ("actual","archive","prior","out"):
        parser.add_argument("--"+field,type=Path,required=True)
    args = parser.parse_args()
    assert __debug__
    original_style = args.actual.read_bytes()
    report = verify(json.loads(original_style),args.archive,args.prior)
    report["actualReplaySHA256"] = sha256(original_style).hexdigest()
    with args.out.open("x",encoding="utf-8",newline="\n") as f:
        json.dump(report,f,indent=2)
        f.write("\n")
    print(report["status"],report["tailRequests"],flush=True)


if __name__ == "__main__":
    main()
