"""Local repeat append shape checks. Output contains only counts, hashes and flags."""

import argparse
from collections import Counter, defaultdict
from functools import lru_cache
import gzip
from hashlib import sha256
import json
from pathlib import Path
import re


PARTS = ("real", "imaginary")
GAUGE = re.compile(r"ActualPostFiveRepeatCurl_([0-4]:(?:-1|1))_m([1-4])_(real|imaginary)_([0-2])\Z")
N1_SEAL = "6332fb76cda800042d25169cd395558b4296684d11d3ef10589e354ba38149b0"
N1_REGISTRY = "5d8a751e5ad4b5d2bd4efa5a1f285dc465b0a5b19b3e0bbf8113f160bb582920"
N1_CANDIDATE = "43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf"


def checked_object(path, pin):
    blob = path.read_bytes()
    assert sha256(blob).hexdigest() == pin
    return json.loads(blob)


def read_suffix(path, pin, count):
    digest, result = sha256(), []
    with gzip.open(path, "rb") as stream:
        for line in stream:
            digest.update(line)
            result.append(json.loads(line))
    assert len(result) == count and digest.hexdigest() == pin
    return result


def analyze(candidate, definitions, appended, before, zero=0, minus_one=20):
    def node(index):
        return appended[index-before] if before <= index < before + len(appended) else None

    expressions = {row["id"]: row for row in definitions[0]}
    named = {row["name"]: row for row in definitions[0] if row["name"].startswith("PostFiveRepeatPullback_")}
    by_case = {(template["key"], row["m"]): row for template in candidate["templates"] for row in template["rows"]}
    assert len(by_case) == len(candidate["systems"]) == 40
    counts = Counter()

    def signed(index, atom_ids):
        if index == zero:
            return Counter()
        if index in atom_ids:
            return Counter({index: 1})
        record = node(index)
        if record and record["op"] == "add":
            result = Counter()
            for child in record["args"]:
                result.update(signed(child, atom_ids))
            return result
        if record and record["op"] == "multiply" and minus_one in record["args"] and len(record["args"]) == 2:
            value = next(i for i in record["args"] if i != minus_one)
            return Counter({k: -v for k, v in signed(value, atom_ids).items()})
        return Counter({index: 1})

    def guard_stack(index, interior):
        guards = []
        for _ in range(7):
            record = node(index)
            assert record and record["op"] == "smooth_piecewise"
            condition, lo, hi, left, index, right = record["args"]
            assert left == right == zero
            guards.append((condition, lo, hi))
        assert index == interior
        return tuple(guards)

    def app(index, definition):
        record = node(index)
        assert record and record["op"] == "m3_coupled_expression_partial"
        system, values, orders = record["args"]
        assert system == definition["id"] and len(values) == len(orders) == len(definition["parameters"])
        assert not any(orders)
        return values

    gauge_cases = defaultdict(set)
    zero_apps = defaultdict(list)
    for row in definitions[0]:
        if match := GAUGE.fullmatch(row["name"]):
            assert before <= row["body"] < before + len(appended)
            gauge_cases[(match[1], int(match[2]))].add(row["id"])
    assert set(gauge_cases) == set(by_case) and all(len(group) == 6 for group in gauge_cases.values())
    gauge_defs = set().union(*gauge_cases.values())
    for index, record in enumerate(appended, before):
        if record["op"] == "m3_coupled_expression_partial":
            system, args, orders = record["args"]
            if system in gauge_defs and args == expressions[system]["parameters"] and not any(orders):
                zero_apps[system].append(index)
    assert set(zero_apps) == gauge_defs and all(len(roots) == 1 for roots in zero_apps.values())
    counts["uniqueZeroOrderGaugeApplications"] = len(zero_apps)

    @lru_cache(maxsize=65536)
    def gauge_reach(index):
        record = node(index)
        if not record:
            return frozenset()
        op, args = record["op"], record["args"]
        if op == "m3_coupled_expression_partial" and args[0] in gauge_defs:
            assert args[1] == expressions[args[0]]["parameters"]
            return frozenset({args[0]})
        if op in ("add", "multiply", "inverse"):
            return frozenset().union(*(gauge_reach(i) for i in args))
        if op == "integer_power":
            return gauge_reach(args[0])
        return frozenset()

    guards_by_template, pulse_by_template = {}, {}
    for system in candidate["systems"]:
        key, m = system["key"], system["m"]
        row = by_case[key, m]
        inverse = definitions[3][system["system"]]
        assert inverse["id"] == system["system"] and inverse["name"] == f"ActualPostFiveRepeatForced_{key}_m{m}"
        assert inverse["left"] == zero and all(x == {part: zero for part in PARTS} for x in inverse["initial"])
        assert len(inverse["initial"]) == len(inverse["forcing"]) == len(inverse["matrix"]) == 3
        assert all(len(r) == 3 for r in inverse["matrix"])
        assert inverse["variable"] not in inverse["parameters"] and not inverse["finitePartialSumIsExactSolution"]
        assert not inverse["homogeneousPulseSubstitutedForForcedSolution"]
        assert inverse["directionParameterIndices"] == [0, 1, 2, 3, 4]
        Y = inverse["directions"][3:5]
        counts["zeroDataPulseSystems"] += 1
        mapped_by_part = {part: set() for part in PARTS}
        for component, pullback in enumerate(system["pullback"]):
            for part in PARTS:
                p = pullback[part]
                raw, sub, supported, guarded = (row[kind][component][part] for kind in ("raw", "subtraction", "supported", "guarded"))
                expected = signed(raw, {raw, sub})
                expected.subtract(signed(sub, {raw, sub}))
                assert signed(supported, {raw, sub}) == expected
                counts["exactAdditiveSourceJoins"] += 1
                assert p["body"] == guarded
                stack = guard_stack(guarded, supported)
                assert stack == guards_by_template.setdefault(key, stack)
                counts["sevenGuardChains"] += 1
                name = f"PostFiveRepeatPullback_{key}_{m}_{component}_{part}"
                definition = named[name]
                assert definition["body"] == guarded
                formal = app(p["shared"], definition)
                mapped = app(p["mapped"], definition)
                assert formal == definition["parameters"]
                changed = {u: v for u, v in zip(formal, mapped) if u != v}
                assert set(changed) == set(Y)
                signature = (inverse["variable"], inverse["length"], *(changed[y] for y in Y))
                assert signature == pulse_by_template.setdefault(key, signature)
                counts["pullbackApplicationPairs"] += 1
                mapped_by_part[part].add(p["mapped"])

        def wrapper_reach(index):
            record = node(index)
            if not record:
                return frozenset()
            op, args = record["op"], record["args"]
            if op == "m3_coupled_expression_partial":
                definition = expressions[args[0]]
                if definition["name"].startswith("CoupledForced_source_"):
                    assert app(index, definition) == definition["parameters"] == [inverse["variable"], *inverse["parameters"]]
                    return frozenset({definition["body"]})
                return frozenset()
            if op in ("add", "multiply", "inverse"):
                return frozenset().union(*(wrapper_reach(i) for i in args))
            if op == "integer_power":
                return wrapper_reach(args[0])
            return frozenset()

        for force in inverse["forcing"]:
            for part in PARTS:
                assert wrapper_reach(force[part]) == mapped_by_part[part]
                counts["forcingComponentsBoundToThreePullbacks"] += 1
        pos, neg = system["positive"], system["negative"]
        reached = frozenset().union(*(gauge_reach(z[part]) for z in pos["velocity"] for part in PARTS))
        assert reached == gauge_cases[key, m]
        assert all(not gauge_reach(pos["pressure"][part]) for part in PARTS)
        counts["sameHarmonicCurlGaugeAssociations"] += 1
        for z, q in zip([*pos["velocity"], pos["pressure"]], [*neg["velocity"], neg["pressure"]]):
            assert z["real"] == q["real"]
            assert signed(q["imaginary"], {z["imaginary"]}) == Counter({k: -v for k, v in signed(z["imaginary"], {z["imaginary"]}).items()})
            counts["exactConjugateVelocityPressurePairs"] += 1
        assert pos["pressure"] == system["mappedCutoff"]["pressure"]
    return dict(sorted(counts.items()))


def main():
    command = argparse.ArgumentParser(description=__doc__)
    command.add_argument("archived_n1_directory", type=Path)
    command.add_argument("output", type=Path)
    args = command.parse_args()
    archive = args.archived_n1_directory
    packet = archive / "append-packet"
    candidate = checked_object(archive / "recovered-original/post-five-repeat-forced-candidate.json", N1_CANDIDATE)
    registry = checked_object(packet / "original-source-functions.json", N1_REGISTRY)
    suffix = read_suffix(packet / "repeat-appended-nodes.jsonl.gz", N1_SEAL, 225012)
    counts = analyze(candidate, json.loads(registry["definitions"]), suffix, 4456994)
    result = {"schema": "MathScope.N8.LocalRepeatShapePrototype/1", "archivedN1Fixture": True,
              "inputSHA256": {"candidate": N1_CANDIDATE, "registry": N1_REGISTRY, "append": N1_SEAL},
              "counts": counts, "allStructuralChecksPassed": True, "activeN3AppendChecked": False,
              "guardComplementEquality": "OPEN", "completeSecondCorrection": "OPEN", "finalJets": 0, "release": "HOLD"}
    with args.output.open("x", encoding="utf8", newline="\n") as handle:
        handle.write(json.dumps(result, indent=2) + "\n")


if __name__ == "__main__":
    if not __debug__:
        raise RuntimeError("Run without Python optimization.")
    main()
