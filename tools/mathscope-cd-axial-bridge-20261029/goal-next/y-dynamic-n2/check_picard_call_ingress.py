"""Transport the registered radial collar to the actual profile call sites."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from functools import lru_cache
from hashlib import sha256
import json
from pathlib import Path
import sys

from check_picard_radial_invariance import (
    CORE, CORE_EXPONENT, INV_XA, LAMBDA, PINS, PROFILE, T1, XA,
    pinned, verify_profile_parameters,
)


REACHED = {
    2: ("4779b42d41b9ef8f54484744860f2c6f3da4bde19d5e01bab9af704699f3ee32",116),
    3: ("3de8ebed1c18e6d5ec3d104d82e2b5c65302c82865f0025015ba23b96cc886fa",182),
    4: ("1b9f1a4febae2d9c7c24df080b7aec07f871f4b04c05fcc8a5650bb77e0dcbfc",259),
}
COEFFICIENT_CERTIFICATES = {
    2: "c9a191e8fe50a33f1231f5e25963528c35e0a80778bd78f2d87a68c30a28385f",
    3: "fa0a15746415dea2f8c22b6f082ae6b9c26dc36894a3a73840a6322c214a1c0d",
    4: "9c058835c10337f808ea81e426e43c3fce99379cfeac869e08a909c9598e936c",
}

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "y-higher-flow"))
from range_flow_n4 import children


def run(source_path, registry_path, certificate_path, profile_path, prefix, *, root_bracket=True):
    reached_sha, expected_calls = REACHED[prefix]
    _, stream_sha, registry_sha = PINS[prefix]
    data = json.loads(pinned(source_path, reached_sha))
    registry = json.loads(pinned(registry_path, registry_sha))["base"]
    cert = json.loads(pinned(certificate_path, COEFFICIENT_CERTIFICATES[prefix]))
    assert data["graphSHA256"] == cert["sourceGraphSHA256"] == stream_sha
    assert data["registrySHA256"] == cert["registrySHA256"] == registry_sha
    assert data["unresolvedReachedNative"] == []
    expressions, monotones = (json.loads(registry[key]) for key in ("expression","monotone"))
    picard = json.loads(registry["picard"])
    covered_systems = {row["system"]: row for row in cert["systems"]}
    for system, recorded in covered_systems.items():
        assert picard[system]["radialDomain"] == recorded["radialDomain"] == [0,24806]
        assert picard[system]["name"] == recorded["name"]
    nd = {i:(n["op"],n["args"]) for i,n in data["nodes"]}
    profile_source = pinned(profile_path, PROFILE).decode()
    profile = json.loads(profile_source.split("export const PINNED_N3 = ", 1)[1].rstrip()[:-1])
    verify_profile_parameters(profile)
    assert profile["parametersExactExpressions"]["XR"] == {"product": [
        {"integer": 110},
        {"power": [{"product": [{"ref": "CSelected"}, {"ref": "Pstar"}]}, 10]},
    ]}
    assert nd[12] == ("source_parameter", ["XR"])
    sources = dict(data["sourceBodies"])
    calls = {i:a for i,(op,a) in nd.items() if op == "actual_background_even_profile"}
    assert len(calls) == expected_calls
    assert not any(op == "actual_background_picard" for op,_ in nd.values())
    bits = {i:1<<j for j,i in enumerate(calls)}

    def lit(i):
        op,a = nd[i]
        return Fraction(int(a[0]),int(a[1])) if op == "rational" else None

    def factor(i, atom):
        op,a = nd[i]
        if op != "multiply" or atom not in a:
            return None
        return a[1] if a[0] == atom else a[0]

    @lru_cache(None)
    def positive(i, strict):
        op,a = nd[i]
        q = lit(i)
        if q is not None:
            return q>0 if strict else q>=0
        if i in (XA,T1,LAMBDA,INV_XA,12):
            return True
        if op == "exp":
            return True
        if op == "integer_power" and a[1]>0 and a[1]%2==0 and not strict:
            return True
        if op == "sqrt_positive":
            return not strict or positive(a[0], True)
        if op == "add":
            return all(positive(j, False) for j in a) and (
                not strict or any(positive(j, True) for j in a)
            )
        if op == "multiply":
            return all(positive(j,strict) for j in a)
        if op == "inverse":
            return positive(a[0],True)
        if op == "actual_monotone_root" and a[0] == 2 and root_bracket:
            row = monotones[2]
            assert lit(row["left"]) == Fraction(1,2) and lit(row["right"]) == 2
            return True
        return False

    @lru_cache(None)
    def cap(i):
        if i == XA:
            return True
        x = factor(i,XA)
        if x is None or nd[x][0] != "exp":
            q = lit(i)
            return q is not None and q <= 0
        [power] = nd[x][1]
        q = lit(power)
        if q is not None:
            return q <= 0
        z = factor(power,T1)
        return z is not None and lit(z) is not None and lit(z) <= CORE_EXPONENT

    assert cap(CORE)

    @lru_cache(None)
    def need(kind, i):
        if kind == "upper" and cap(i):
            return ()
        if kind == "lower":
            if positive(i,False):
                return ()
            op,a = nd[i]
            if op == "multiply":
                return (*need(kind,a[0]),*need(kind,a[1]))
        return ((kind,i),)

    @lru_cache(None)
    def depends(i, variable):
        if i == variable:
            return True
        op,a = nd[i]
        if op == "definite_integral":
            return any(depends(j,variable) for j in a[2:]) or (a[1]!=variable and depends(a[0],variable))
        return any(depends(j,variable) for j in children({"op":op,"args":a}))

    def merge(dst, src):
        for condition,b in src.items():
            dst[condition] = dst.get(condition,0)|b

    def impose(dst,conditions,b):
        for condition in conditions:
            dst[condition] = dst.get(condition,0)|b

    stats = Counter()
    unsupported_binders = Counter()
    unsupported_natives = Counter()
    memo = {}
    coefficient_profiles = {}
    for row in cert["systems"]:
        for i,profile in row["priorEvenProfiles"].items():
            coefficient_profiles[int(i)] = tuple(profile)
    for i,(op,a) in nd.items():
        child_ids = children({"op":op,"args":a})
        obligations, visible, unsupported = {},0,0
        for j in child_ids:
            if j in memo:
                visible |= memo[j][1]
                unsupported |= memo[j][2]
        if i in calls:
            system,component,x,eta,order_x,order_eta = a
            assert system in covered_systems and 0<=component<=3 and order_x>=0 and order_eta>=0
            assert picard[system]["eta"] == eta
            impose(obligations,(*need("upper",x),*need("lower",x)),bits[i])
            visible |= bits[i]
        else:
            for root in sources.get(i,[]):
                if root not in memo:
                    continue
                debt, roots, hidden = memo[root]
                visible |= roots
                unsupported |= hidden
                if not debt:
                    continue
                if op == "actual_expression_partial":
                    entry = expressions[a[0]]
                    assert entry["body"] == root
                    actual = dict(zip(entry["parameters"],a[1],strict=True))
                    assert len(a[2]) == len(entry["parameters"])
                    assert all(0<=v<=limit for v,limit in zip(a[2],entry["derivativeLimits"],strict=True))
                elif op == "actual_monotone_root":
                    entry = monotones[a[0]]
                    assert entry["body"] == root
                    actual = dict(zip(entry["parameters"],a[1:],strict=True))
                else:
                    actual = {}
                for (kind,formal),b in debt.items():
                    if formal in actual:
                        assert nd[formal][0] == "coordinate"
                        impose(obligations,need(kind,actual[formal]),b)
                        stats["nativeFormalActualTransports"] += 1
                    else:
                        unsupported |= b
                        stats["unsupportedNativeConditions"] += 1
                        unsupported_natives[op,kind,formal] += 1

        if op == "definite_integral":
            body,t,left,right = a
            for (kind,atom),b in memo.get(body,({},0,0))[0].items():
                if atom == t:
                    impose(obligations,(*need(kind,left),*need(kind,right)),b)
                    stats["literalBinderEndpointTransports"] += 1
                    continue
                other = factor(atom,t)
                if kind == "upper" and other is not None and {lit(left),lit(right)} <= {Fraction(0),Fraction(1)}:
                    impose(obligations,(*need("upper",other),*need("lower",other)),b)
                    stats["unitBinderProductTransports"] += 1
                elif depends(atom,t):
                    unsupported |= b
                    stats["unsupportedBinderConditions"] += 1
                    unsupported_binders[kind,nd[atom][0],nd[right][0],nd[left][0],t,atom,left,right] += 1
                else:
                    impose(obligations,((kind,atom),),b)
            for j in (left,right):
                merge(obligations,memo.get(j,({},0,0))[0])
        elif op == "smooth_piecewise":
            x,left,right = a[:3]
            for j in a[:3]:
                merge(obligations,memo.get(j,({},0,0))[0])
            for arm,f in enumerate(a[3:]):
                local = dict(memo.get(f,({},0,0))[0])
                if arm < 2:
                    endpoint = left if arm == 0 else right
                    condition = ("upper",x)
                    if condition in local:
                        impose(local,need("upper",endpoint),local.pop(condition))
                        stats["piecewiseUpperTransports"] += 1
                if arm > 0 and ("lower",x) in local:
                    endpoint = left if arm == 1 else right
                    impose(local,need("lower",endpoint),local.pop(("lower",x)))
                    stats["piecewiseLowerTransports"] += 1
                merge(obligations,local)
        else:
            for j in child_ids:
                merge(obligations,memo.get(j,({},0,0))[0])
        if visible or obligations or unsupported:
            memo[i] = obligations,visible,unsupported

    visible = unresolved = unsupported = 0
    debts = {}
    for root in data["roots"]:
        obligations, sites, hidden = memo.get(root,({},0,0))
        visible |= sites
        unsupported |= hidden
        for condition,b in obligations.items():
            unresolved |= b
            debts.setdefault(condition,[]).append(root)
    debt = unresolved|unsupported
    inside_coefficient_domains = []
    outer_certified = []
    open_sites = []
    for i,a in calls.items():
        if visible & bits[i]:
            (open_sites if debt & bits[i] else outer_certified).append(i)
        elif i in coefficient_profiles:
            system,x,rx,et = coefficient_profiles[i]
            assert [a[0],a[2],a[4],a[5]] == [system,x,rx,et]
            inside_coefficient_domains.append(i)
        else:
            open_sites.append(i)
    return {
        "status":"ORIGINAL_PROFILE_CALL_DOMAIN_COVERAGE" if not open_sites else "ORIGINAL_PROFILE_CALL_DOMAIN_PARTIAL",
        "prefix":prefix,"sourceReachabilitySHA256":reached_sha,"sourceGraphSHA256":stream_sha,
        "registeredCoefficientCertificateSHA256":COEFFICIENT_CERTIFICATES[prefix],
        "sourceProfileSHA256":PROFILE,
        "staticProfileCallSites":len(calls),"rootTransportCertified":outer_certified,
        "coefficientCertificateCertified":inside_coefficient_domains,"openSites":open_sites,
        "remainingRootObligations":[[kind,node,roots] for (kind,node),roots in sorted(debts.items())],
        "transportCounts":dict(stats),"usesDefinedPositiveReferenceRootBracket":root_bracket,
        "unsupportedNativeExamples":[[*key,n] for key,n in unsupported_natives.most_common(20)],
        "unsupportedBinderExamples":[[*key,n] for key,n in unsupported_binders.most_common(20)],
        "scope":"Original raw-base reachability roots. Physical native chart image and defined real source operands are premises. Coefficient-site argument bounds use the independently audited registered systems. Further coupled source graphs remain separate.",
    }


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ("source","registry","coefficient_certificate","profile","out"):
        parser.add_argument(name,type=Path)
    parser.add_argument("--prefix",type=int,choices=sorted(REACHED),required=True)
    parser.add_argument("--without-reference-bracket",action="store_true")
    args = parser.parse_args()
    result = run(args.source,args.registry,args.coefficient_certificate,args.profile,args.prefix,
                 root_bracket=not args.without_reference_bracket)
    raw = (json.dumps(result,indent=2)+"\n").encode()
    args.out.write_bytes(raw)
    print(result["status"],len(result["rootTransportCertified"]),
          len(result["coefficientCertificateCertified"]),len(result["openSites"]),sha256(raw).hexdigest())


if __name__ == "__main__":
    main()
