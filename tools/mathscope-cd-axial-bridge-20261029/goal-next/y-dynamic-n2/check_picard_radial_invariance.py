"""Check original actual Picard coefficient domains before finite iteration."""

from argparse import ArgumentParser
from collections import Counter
from dataclasses import dataclass, replace
from fractions import Fraction
from functools import lru_cache
import gzip
from hashlib import sha256
import json
from pathlib import Path


PINS = {
    2: (2852905,"75db9fddc311fb7ce8d7968fbde4a52a07521cf8d47feb0b8f302d6bed108987",
        "6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f"),
    3: (3914395,"f59857c4616e90727e64d9aa77b8ee8a51082274c16cff53098ea7f5db5f511c",
        "75c53ba678b7db51dc53527d6b753d76e1fc013d515ff253b7b581513b0b53a0"),
    4: (7358162,"ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd",
        "049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad"),
}
RUNTIME = "326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311"
INDUCTION = "dfa10931c2eee87344dff4c95ecbeaf84d21c5ea5891d6452ea1f5fd4a4d9501"
EXACT_BRANCH = "cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3"
PROFILE = "df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a"
ETA, FOUR, LAMBDA, T1, XA, INV_XA, CORE = 2, 474, 3454, 3612, 3617, 3679, 24805
CORE_EXPONENT = Fraction(1,16)
CAPS = ("ratio", "radial", "natural", "relative_log", "absolute_log")


class DomainError(Exception):
    pass


def pinned(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


@dataclass(frozen=True)
class Range:
    nonnegative: bool = False
    positive: bool = False
    unit: bool = False
    # Bounds are multiples of t1 in exp, Xa*exp, 4*exp, log-relative and log-X units.
    ratio: Fraction | None = None
    radial: Fraction | None = None
    natural: Fraction | None = None
    relative_log: Fraction | None = None
    absolute_log: Fraction | None = None


UNKNOWN = Range()


def combine(left, right, *, enclosure):
    facts = {}
    for name in ("nonnegative", "positive", "unit"):
        a, b = getattr(left,name), getattr(right,name)
        facts[name] = (a and b) if enclosure else (a or b)
    for name in CAPS:
        a, b = getattr(left,name), getattr(right,name)
        if enclosure:
            facts[name] = max(a,b) if a is not None and b is not None else None
        else:
            facts[name] = min(x for x in (a,b) if x is not None) if a is not None or b is not None else None
    return Range(**facts)


def upper(value):
    return Range(**{name:getattr(value,name) for name in CAPS})


def verify_profile_parameters(profile):
    expressions = profile["parametersExactExpressions"]

    def ref(name):
        return {"ref":name}

    def integer(n):
        return {"integer":n}

    assert expressions["T"] == {"sum":[{"exp":ref("Md")},integer(10)]}
    assert expressions["h"] == {"exp":{"product":[integer(-8002),ref("T")]}}
    assert expressions["j0"] == {"power":[ref("h"),4]}
    assert expressions["sigmaStar"] == {"quotient":[ref("j0"),integer(2000)]}
    assert expressions["logP"] == {"product":[integer(2),ref("T")]}
    assert expressions["Pstar"] == {"exp":ref("logP")}
    assert expressions["K"] == {"power":[ref("Pstar"),2]}
    numerator, denominator = expressions["Q"]["quotient"]
    assert denominator == {"power":[ref("sigmaStar"),2]}
    multiplier, K = numerator["product"]
    assert int(multiplier["integer"]) > 1 and K == ref("K")
    assert expressions["Lambda"] == {"power":[ref("Q"),64]}
    assert expressions["Xa"] == {"quotient":[integer(4),ref("Lambda")]}
    assert expressions["BRefUpper"] == {"power":[ref("Q"),300]}
    assert expressions["logCSelected"] == {"sum":[
        {"product":[integer(10),{"log":{"sum":[integer(1),ref("BRefUpper")]}}]},
        {"power":[ref("Q"),200]},
    ]}
    assert expressions["CSelected"] == {"exp":ref("logCSelected")}
    assert expressions["t1"] == {"power":[ref("CSelected"),-120]}
    assert Fraction(1,2**120) < Fraction(1,128)


class Source:
    def __init__(self, graph, runtime, prefix):
        raw = pinned(runtime, RUNTIME).decode()
        pinned(runtime.with_name("actual-residual-order-induction-expressions.mjs"), INDUCTION)
        exact = pinned(runtime.with_name("actual-global-source-expressions.mjs"), EXACT_BRANCH)
        assert b"v=ev(x<=a?args[3]:x>=b?args[5]:args[4],env)" in exact
        profile = pinned(runtime.with_name("source-profile-data.mjs"), PROFILE).decode()
        self.profile = json.loads(profile.split("export const PINNED_N3 = ",1)[1].rstrip()[:-1])
        verify_profile_parameters(self.profile)
        assert "this.integral(this.mul(this.pow(t,s.diagonal[i]),this.substitute(f,s.xi,this.mul(t,s.xi))),t,this.zero,this.one)" in raw
        assert "this.derivative(term[j],s.eta)" in raw
        assert "for(let j=0;j<2*radialOrder;j++)body=this.derivative(body,s.xi)" in raw
        assert "this.mul(this.sqrt(X),...variables)" in pinned(
            runtime.with_name("actual-residual-order-induction-expressions.mjs"), INDUCTION
        ).decode()
        count, stream_sha, registry_sha = PINS[prefix]
        base = json.loads(pinned(graph/"original-source-functions.json",registry_sha))["base"]
        self.systems = json.loads(base["picard"])
        self.actual = {0:1}
        assert self.systems[0]["name"] == "ActualSameN3OrderOneInner"
        for i in range(3,2*prefix+2,2):
            order = (i+1)//2
            assert self.systems[i]["name"] == f"ActualSameN3actualOrder{order}"
            self.actual[i] = order
        assert list(self.actual.values()) == list(range(1,prefix+2))
        last = max(root for i in self.actual for root in self.roots(self.systems[i]))
        self.nodes = []
        digest = sha256()
        with gzip.open(graph/"original-source-nodes.jsonl.gz","rb") as stream:
            header = stream.readline()
            assert json.loads(header)["node_count"] == count
            digest.update(header)
            for i,line in enumerate(stream):
                digest.update(line)
                if i <= last:
                    node = json.loads(line)
                    self.nodes.append((node["op"],node["args"]))
        assert i+1 == count and digest.hexdigest() == stream_sha
        for i,name in ((LAMBDA,"Lambda"),(T1,"t1"),(XA,"Xa")):
            assert self.nodes[i] == ("source_parameter",[name])
        assert self.nodes[INV_XA] == ("inverse",[XA])
        assert self.nodes[FOUR] == ("rational",["4","1"])
        assert self.nodes[24806] == ("sqrt_positive",[CORE])

    @staticmethod
    def roots(entry):
        return sorted(set(entry["forcing"]) | {v for row in (*entry["A0"],*entry["A1"]) for v in row})

    def children(self, i):
        op,a = self.nodes[i]
        if op in {"rational","coordinate","source_parameter"}:
            return []
        if op in {"add","multiply","exp","log_positive","inverse","sqrt_positive","smooth_piecewise"}:
            return a
        if op in {"source_step_derivative","integer_power"}:
            return a[:1]
        if op == "definite_integral":
            return [a[0],a[2],a[3]]
        if op == "actual_natural_series":
            return a[1:3]
        if op == "actual_background_even_profile":
            return a[2:4]
        raise DomainError((i,op,"unexpected source coefficient operator"))

    @lru_cache(maxsize=None)
    def relevant(self, i):
        return self.nodes[i][0] in {"actual_natural_series","actual_background_even_profile"} or any(
            self.relevant(child) for child in self.children(i)
        )

    @lru_cache(maxsize=None)
    def free(self, i):
        op,a = self.nodes[i]
        if op == "coordinate":
            return frozenset((i,))
        if op == "definite_integral":
            return (self.free(a[0]) - {a[1]}) | self.free(a[2]) | self.free(a[3])
        return frozenset().union(*(self.free(child) for child in self.children(i)))

    def literal(self, i):
        op,a = self.nodes[i]
        return Fraction(int(a[0]),int(a[1])) if op == "rational" else None

    def check(self, system, *, use_guards=True, prior_exponent=CORE_EXPONENT):
        entry = self.systems[system]
        xi = entry["xi"]
        assert entry["eta"] == ETA and entry["radialDomain"] == [0,24806]
        assert entry["diagonal"] == [0,0,2,0,3,1]
        assert entry["zeroAxisDatum"] == [0]*6
        if system == 0:
            assert entry["tail"]["tailIsForTheCertifiedIndexNotForDisplayedTerms"] is True
        else:
            assert entry["tail"]["finitePartialSumIsSolution"] is False
        assert all(i >= 4 and j < 4 for i,row in enumerate(entry["A1"]) for j,value in enumerate(row) if value != 0)
        roots = self.roots(entry)
        assert all(self.free(i) <= {xi,ETA} for i in roots)

        def interval(i, env):
            op,a = self.nodes[i]
            known = env.get(i,UNKNOWN)
            if op == "coordinate":
                return known
            bound = UNKNOWN
            if i == XA:
                bound = Range(True,True,radial=Fraction(0))
            elif i == T1:
                bound = Range(True,True,relative_log=Fraction(1))
            elif i in (LAMBDA,INV_XA):
                bound = Range(True,True)
            elif op == "rational":
                q = self.literal(i)
                bound = Range(q>=0,q>0,0<=q<=1,
                              ratio=Fraction(0) if 0<=q<=1 else None,
                              natural=Fraction(0) if 0<=q<=4 else None,
                              relative_log=Fraction(0) if q<=0 else None)
            elif op == "integer_power" and a[1] == 2:
                bound = Range(nonnegative=True, radial=CORE_EXPONENT if a[0]==xi else None)
            elif op == "multiply":
                i0,i1 = a
                r0,r1 = interval(i0,env),interval(i1,env)
                bound = Range(r0.nonnegative and r1.nonnegative,r0.positive and r1.positive,r0.unit and r1.unit)
                for atom,r in ((i0,r1),(i1,r0)):
                    if atom == XA:
                        bound = replace(bound,radial=r.ratio)
                    elif atom == LAMBDA:
                        bound = replace(bound,natural=r.radial)
                    elif atom == FOUR:
                        bound = replace(bound,natural=r.ratio)
                    elif atom == INV_XA:
                        bound = replace(bound,ratio=r.radial)
                for a_id,b_id in ((i0,i1),(i1,i0)):
                    q = self.literal(a_id)
                    if q is not None and q >= 0 and b_id == T1:
                        bound = replace(bound,relative_log=q)
                if r0.unit and r1.radial is not None:
                    bound = replace(bound,radial=r1.radial)
                if r1.unit and r0.radial is not None:
                    bound = replace(bound,radial=r0.radial)
            elif op == "log_positive":
                arg = interval(a[0],env)
                if not arg.positive:
                    raise DomainError((system,i,a[0],"log argument not proved positive"))
                bound = Range(relative_log=arg.ratio,absolute_log=arg.radial)
            elif op == "exp":
                arg = interval(a[0],env)
                bound = Range(True,True,ratio=arg.relative_log,radial=arg.absolute_log)
            return combine(bound,known,enclosure=False)

        def independent_eta(i):
            if ETA in self.free(i):
                raise DomainError((system,i,"radial guard, bound, or argument depends on eta"))

        def extend(env, i, value):
            return {**env,i:combine(env.get(i,UNKNOWN),value,enclosure=False)}

        def enter(branch, a, env):
            x,left,right = a[:3]
            if not use_guards:
                return env
            # Branch predicates are scalar evaluated even when only one arm has calls.
            for i in (x,left,right):
                independent_eta(i)
            if branch == 0:
                return extend(env,x,upper(interval(left,env)))
            if branch == 1:
                lower = interval(left,env)
                cap = upper(interval(right,env))
                return extend(env,x,replace(cap,nonnegative=lower.nonnegative,positive=lower.nonnegative))
            lower = interval(right,env)
            return extend(env,x,Range(nonnegative=lower.nonnegative,positive=lower.positive))

        env = {xi:Range(nonnegative=True)}
        stack = [(i,env) for i in roots]
        seen, natural, profiles = set(), {}, {}
        by_role = Counter()
        while stack:
            i,env = stack.pop()
            if not self.relevant(i):
                continue
            key = (i,tuple(sorted(env.items())))
            if key in seen:
                continue
            seen.add(key)
            op,a = self.nodes[i]
            by_role[op] += 1
            if op == "definite_integral":
                body,t,left,right = a
                if self.relevant(body):
                    for end in (left,right):
                        independent_eta(end)
                    r = combine(interval(left,env),interval(right,env),enclosure=True)
                    stack.append((body,{**env,t:r}))
                stack.extend((end,env) for end in (left,right))
                continue
            if op == "smooth_piecewise":
                stack.extend((child,env) for child in a[:3])
                for arm,body in enumerate(a[3:]):
                    if self.relevant(body):
                        stack.append((body,enter(arm,a,env)))
                continue
            if op == "actual_natural_series":
                _,y,eta,_,_ = a
                independent_eta(y)
                assert eta == ETA
                r = interval(y,env)
                if not r.nonnegative or r.natural is None or r.natural > 2:
                    raise DomainError((system,i,y,r,"natural argument outside proved range"))
                natural[i] = max(natural.get(i,Fraction(0)),r.natural)
            if op == "actual_background_even_profile":
                prior,component,x,eta,radial_order,eta_order = a
                independent_eta(x)
                assert prior in self.actual and self.actual[prior] < self.actual[system]
                assert eta == ETA and component in (0,1)
                r = interval(x,env)
                if not r.nonnegative or r.radial is None or r.radial > prior_exponent:
                    raise DomainError((system,i,x,r,"prior even profile outside proved range"))
                profiles[i] = [prior,x,radial_order,eta_order]
            stack.extend((child,env) for child in self.children(i))
        return {
            "system": system, "name": entry["name"], "radialCoordinate": xi,
            "radialDomain": entry["radialDomain"], "distinctCoefficientRoots": len(roots),
            "lexicalStates": len(seen), "naturalCallContexts": by_role["actual_natural_series"],
            "distinctNaturalCalls": len(natural), "upperExponentByNaturalCall": {
                i:str(r) for i,r in sorted(natural.items())
            }, "priorEvenProfiles": profiles,
            "etaIndependentRadialArgumentsAndRelevantGuards": True,
        }


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("graph","runtime","out"):
        parser.add_argument(name,type=Path)
    parser.add_argument("--prefix",type=int,choices=sorted(PINS),default=2)
    args = parser.parse_args()
    source = Source(args.graph,args.runtime,args.prefix)
    result = [source.check(system) for system in source.actual]
    controls = {}
    for name,options in (("pretendPriorEndsAtXa",{"prior_exponent":Fraction(0)}),
                         ("dropLazyRadialGuard",{"use_guards":False})):
        try:
            source.check(3,**options)
        except DomainError as exc:
            controls[name] = str(exc)
        else:
            raise AssertionError((name,"mutated source domain accepted"))
    count, stream_sha, registry_sha = PINS[args.prefix]
    receipt = {
        "status":"ACTUAL_COEFFICIENT_DOMAINS_INVARIANT_UNDER_FINITE_VOLTERRA_TERMS",
        "originalGraphPrefix":args.prefix,
        "sourceGraphSHA256":stream_sha,"sourceNodes":count,"registrySHA256":registry_sha,
        "systems":result,"negativeControls":controls,
        "sourceParameters":"The pinned expressions give T>0, 0<sigmaStar<1, K>1, Q>1, Lambda=Q^64, Xa=4/Lambda and CSelected>2. Thus 0<t1=CSelected^-120<1/128.",
        "sourceRealPremises":"The original real source arithmetic, eta differentiability or strip, and primitive definedness outside the tracked natural operands retain their original hypotheses.",
        "finiteInduction":"Every G substitution t*xi with 0<=t<=1 preserves the proved radial interval. The exact coefficient guards, radial arguments and relevant endpoints are eta-independent; eta differentiation of the retained literal calls preserves their radial argument and lower-profile domain. Induction first on the verified actual systems and then on finite Volterra word length preserves all tracked natural argument domains.",
        "open":"Auxiliary systems, other native contexts, all-order source coverage, complex eta strip convergence of this audited invocation, and all downstream stages are separate.",
    }
    raw = (json.dumps(receipt,indent=2)+"\n").encode()
    args.out.write_bytes(raw)
    print(f"PASS original actual Picard domains through order {max(source.actual.values())}",sha256(raw).hexdigest())


if __name__ == "__main__":
    main()
