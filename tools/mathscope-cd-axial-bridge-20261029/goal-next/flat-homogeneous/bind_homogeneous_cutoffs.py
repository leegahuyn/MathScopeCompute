"""Recover the primary and Signed principal cutoff recipes on the pinned source."""
from argparse import ArgumentParser
from copy import deepcopy
from collections import defaultdict
from fractions import Fraction
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile

# Reuse the exact stream and cutoff checker from the adjacent first-Forced audit.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "flat"))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "cycle"))
from group_postfive_residual import children
from bind_forced_cutoffs import (Archive, GRAPH_SHA, PROJECTION_SHA, REGISTRY_SHA,
                                 PRODUCER_COMMIT, check_cutoff, git_blob, pinned_json)

FORCED_SHA = "719318e74afc94b7f6c45e6cf36d05362cffa8cf1f4567d0d5b61ed852e0b76d"
PSI = 623055
V = 622805
XI = 623035
LS = 623027
K = 622801
LEVEL = 3675258
ONE = 1
HALF = 19
MINUS = 20
NAVIER = "research-ide/mathscope-m3/navier/"
M2 = "research-ide/mathscope-m2/navier/"


def sources(repo):
    checks = {
        NAVIER + "source-global-band.mjs": (
            "G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4)))",
            "G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls)))",
        ),
        NAVIER + "source-global-current.mjs": (
            "a,band.cutoffs.chi,band.cutoffs.psi,x",
            "weighted=amplitude.map(x=>G.mul(slowCutoff.body,x))",
            "rawPotential=cross(G,f.frame.n,weighted)",
        ),
        NAVIER + "source-global-angular.mjs": (
            "positive=row.curl.fullCoefficient.map(x=>C.scale(G.q(1,2),x))",
            "x.real===G.mul(G.q(1,2),row.curl.leading[j])",
        ),
        NAVIER + "source-initialized-angular.mjs": (
            "localMap=body=>G.simultaneousSubstitute(atRepresentative(body)",
            "positive.velocity.map((z,j)=>shareComplex(z,'InitializedOriginalWave_'",
        ),
        NAVIER + "source-global-forced-current.mjs": (
            "waveRows=sumStateRows(G,old.waveRows,increment)",
            "kind==='residual'?G.add(G.mul(G.q(2),A),G.q(1,2))",
        ),
        M2 + "actual-full-curl.mjs": ("exactCylindricalHarmonicCurl", "fullCoefficient"),
        "research-ide/mathscope-m3/tangency-proof-20261023/generic-signed-source-kernel.fixed.mjs": (
            "da,band.cutoffs.chi,band.cutoffs.psi,x",
            "weighted=amplitude.map(x=>G.mul(slowCutoff,x))",
            "rawPotential=cross(G,f.frame.n,weighted)",
        ),
        "research-ide/mathscope-m3/staged-patches-20261023/PR30_Cumulative_Signed162_Cor85_TemporalFrontier.patch": (
            "G.mul(half,lift(row.curl.leading[j]))",
            "velocity:velocity.map(z=>C.conjugate(z))",
            "real=services.reconstruct(G,{geometry:old.lift.geometry,phase:old.phase,k:old.k,rows:signedRows})",
        ),
    }
    found = {}
    for path, patterns in checks.items():
        data = git_blob(repo, PRODUCER_COMMIT, path)
        assert all(pattern.encode() in data for pattern in patterns), path
        found[path] = sha256(data).hexdigest()
    return found


def literal(graph, i):
    return Fraction(*map(int, graph.op(i, "rational")))


def free_pulse_scan(graph, roots):
    """Check the free actual argument, respecting the original integral binder."""
    pending = list(roots)
    visited = set()
    while pending:
        i = pending.pop()
        if i in visited:
            continue
        visited.add(i)
        assert i != V, ("Unexpected free pulse coordinate", i, roots)
        op, a = graph.node(i)
        if op == "definite_integral":
            body, binder, left, right = a
            pending.extend([left, right] if binder == V else [body, left, right])
        else:
            pending.extend(children(op, a))
    return len(visited)


def case_body(graph, i, d):
    guards = []
    saw_level = False
    while graph.node(i)[0] == "smooth_piecewise":
        test, lo, hi, before, inside, after = graph.op(i, "smooth_piecewise")
        if test == LEVEL:
            low, high = literal(graph, lo), literal(graph, hi)
            assert low.denominator == high.denominator == 2 and high - low == 1
            assert before == after
            if low < d < high:
                saw_level = True
                i = inside
            else:
                i = before
        else:
            assert before == after == 0, (i, test, before, after)
            guards.append([test, lo, hi])
            i = inside
    assert saw_level and i != 0
    return i, guards


def cos_coefficients(graph, root, phase):
    terms = defaultdict(list)

    def visit(i, scalar):
        op, args = graph.node(i)
        if op == "add":
            for child in args:
                visit(child, scalar)
            return
        assert op == "multiply" and len(args) == 2, (i, op, args)
        if MINUS in args:
            visit(next(v for v in args if v != MINUS), -scalar)
            return
        trig = [j for j in args if graph.node(j)[0] in ("cosine", "sine")]
        assert len(trig) == 1, (i, args)
        fn, [argument] = graph.node(trig[0])
        mode, remain = graph.factors((argument, 1), (K, -1), (phase, -1))
        assert not remain and mode.denominator == 1 and 0 < abs(mode) <= 2
        terms[(fn, int(mode))].append((scalar, next(j for j in args if j != trig[0])))

    visit(root, 1)
    assert terms["cosine", 1] == terms["cosine", -1]
    assert len(terms["cosine", 1]) == 1 and terms["cosine", 1][0][0] == 1
    return terms["cosine", 1][0][1], sorted({mode for fn, mode in terms})


class Recipes:
    def __init__(self, graph, registry):
        self.graph = graph
        self.base = json.loads(registry["base"]["base"]["expression"])
        self.aux = json.loads(registry["base"]["expressionDefinitions"])
        self.coupled = json.loads(registry["definitions"])[0]
        self.names = {d["name"]:d for d in self.coupled}
        self.potentials = {}

    def resolve(self, i):
        op, args = self.graph.node(i)
        assert op.endswith("expression_partial"), (i, op, args)
        system, actual, orders = args
        if isinstance(system, str):
            definition = self.coupled[int(system.split(":")[1])]
            assert system == definition["id"]
        elif system >= 0:
            definition = self.base[system]
        else:
            definition = self.aux[-system - 1]
        assert len(definition["parameters"]) == len(actual) == len(orders)
        return definition, actual, orders

    @cache
    def strip_formal(self, i):
        """Strip one explicit factor, leaving native and denominator subtrees opaque."""
        if i == PSI:
            return 1, ["source", ONE]
        op, args = self.graph.node(i)
        if op not in ("multiply", "add"):
            return 0, ["source", i]
        rows = [self.strip_formal(j) for j in args]
        powers = [power for power, _ in rows]
        if op == "add":
            assert len(set(powers)) == 1, (i, powers)
            power = powers[0]
        else:
            power = sum(powers)
        if power == 0:
            return 0, ["source", i]
        assert power == 1, (i, powers)
        kept = [recipe for _, recipe in rows if op == "add" or recipe != ["source", ONE]]
        return 1, kept[0] if len(kept) == 1 else [op, *kept]

    def strip_leading(self, root, potential_prefix, xi, v):
        """Peel psi only inside the two exact potential leaves in a leading curl."""
        hits = []

        def visit(i):
            op, args = self.graph.node(i)
            if op.endswith("expression_partial"):
                definition, actual, orders = self.resolve(i)
                if not definition["name"].startswith(potential_prefix):
                    return 0, ["source", i]
                assert not any(orders)
                formals = definition["parameters"]
                assert formals[3:5] == [XI, V] and actual[3:5] == [xi, v]
                body = definition["body"]
                assert self.strip_formal(body)[0] == 1
                key = definition["name"]
                record = {"name":key, "body":body, "parameters":formals,
                          "uncutBody":self.strip_formal(body)[1]}
                assert self.potentials.setdefault(key, record) == record
                hits.append({"call":i,"potential":key,"actualArguments":actual})
                return 1, ["mappedPotential", key, actual]
            if op not in ("multiply", "add"):
                return 0, ["source", i]
            rows = [visit(child) for child in args]
            powers = [power for power, _ in rows]
            if op == "add":
                assert len(set(powers)) == 1, (i, powers)
                power = powers[0]
            else:
                power = sum(powers)
            if power == 0:
                return 0, ["source", i]
            assert power == 1, (i, powers)
            return 1, [op, *(recipe for _,recipe in rows)]

        assert self.graph.op(root, "multiply")[0] == HALF, root
        power, recipe = visit(root)
        assert power == 1 and len(hits) == 2
        return recipe, hits

    def primary_term(self, current, wanted):
        reached = self.graph.explicit_reach([current])
        found = [i for i in reached if self.graph.node(i)[0] == "m3_coupled_expression_partial"
                 and self.graph.node(i)[1][0] == wanted["id"]]
        assert len(found) == 1
        call = found[0]
        definition, actual, orders = self.resolve(call)
        assert definition == wanted and not any(orders)
        assert actual == wanted["parameters"]
        # Require the selected primary coefficient as an actual summand, not an
        # occurrence under the forced inverse or a different harmonic.
        assert self.graph.node(current)[0] == "add" and call in self.graph.node(current)[1]
        return call


def bind(graph, registry, projection, forced):
    recipes = Recipes(graph, registry)
    assert graph.op(PSI, "multiply") == [623051, 623054]
    assert literal(graph, HALF) == Fraction(1, 2)
    free_pulse_scan(graph,[LS])
    cases = {(x["difference"], x["sign"]): x for x in forced["bindings"] if x["mode"] == 1}
    phases = {(x["difference"],x["sign"]):x["ownPhase"] for x in projection["forcingChart"]["phaseCases"]}
    assert len(cases) == len(phases) == 10
    rows = []
    for (d, sign), phase in sorted(phases.items()):
        f = cases[d, sign]
        assert f["phase"] == phase and f["length"] == LS and f["waveNumber"] == K
        check_cutoff(graph, f["cutoff"], f["cutoffDerivative"], LS, f["pulseValue"])
        sign_index = 0 if sign == 1 else 1
        for j in range(3):
            full = recipes.names[f"ActualForcedCurrent_velocity_{j}_own_{sign_index}"]
            signed = recipes.names[f"GenericSigned162_velocity_{j}_own_{sign_index}"]
            body, guards = case_body(graph, full["body"], d)
            signed_body, signed_guards = case_body(graph, signed["body"], d)
            assert guards == signed_guards and len(guards) == 7
            assert guards[-1] == [f["pulseValue"], 0, LS]
            xi = guards[-2][0]
            current, modes = cos_coefficients(graph, body, phase)
            signed_real, signed_modes = cos_coefficients(graph, signed_body, phase)
            assert modes == [-2, -1, 1, 2] and signed_modes == [-1, 1]
            primary = recipes.names[f"InitializedOriginalWave_{d}_{sign}_{j}_real"]
            call = recipes.primary_term(current, primary)
            p_recipe, p_hits = recipes.strip_leading(primary["body"], f"GlobalOriginalPotential_{sign}_", xi, f["pulseValue"])
            s_recipe, s_hits = recipes.strip_leading(signed_real, f"GenericSignedAfterForced_{sign_index}_", xi, f["pulseValue"])
            for hit in p_hits+s_hits:
                assert hit["actualArguments"][:3] == [622802,622803,622804]
                assert hit["actualArguments"][5:8] == [623950,623955,623935]
            rows.append({"key":f"{d}:{sign}","difference":d,"sign":sign,"component":j,
                         "phase":phase,"waveNumber":K,"pulseValue":f["pulseValue"],
                         "mappedCutoff":f["cutoff"],"mappedPulseDerivative":f["cutoffDerivative"],
                         "wholeWaveCosineCoefficient":current,"signedCosineCoefficient":signed_real,
                         "sourceGuards":guards,
                         "primary":{"activeField":full["id"],"sourceCall":call,"body":primary["body"],
                                    "uncutHalfLeading":p_recipe,"mappedPotentialCalls":p_hits},
                         "signed":{"activeField":signed["id"],"body":signed_real,
                                   "uncutHalfLeading":s_recipe,"mappedPotentialCalls":s_hits}})
    assert len(rows) == 30 and len(recipes.potentials) == 12
    for family in ("GlobalOriginalPotential", "GenericSignedAfterForced"):
        group = [record for name, record in recipes.potentials.items() if name.startswith(family)]
        assert len(group) == 6
        shared_amplitudes = set()
        for item in group:
            occurrences = [i for i in graph.explicit_reach([item["body"]])
                           if graph.node(i)[0] == "multiply" and PSI in graph.node(i)[1]]
            assert len(occurrences) == 1
            product = occurrences[0]
            factors = graph.op(product, "multiply")
            assert len(factors) == 2
            uncut_scalar = next(i for i in factors if i != PSI)
            chi, epsilon_times_weight = graph.op(uncut_scalar, "multiply")
            sqrt_epsilon, weight = graph.op(epsilon_times_weight, "multiply")
            assert chi == 623043 and sqrt_epsilon == 622799
            checked_scope = free_pulse_scan(graph,[chi,sqrt_epsilon,weight,625300])
            assert 625300 in graph.explicit_reach([item["body"]])
            item["scalarFactors"] = {"pulseCutoffProduct":product,"uncutScalar":uncut_scalar,
                                     "chi":chi,"sqrtEpsilon":sqrt_epsilon,"fixedWeight":weight,
                                     "slowCutoff":625300,"freePulseCheckedNodes":checked_scope}
            shared_amplitudes.add(weight)
        assert len(shared_amplitudes) == 2
    return rows, recipes.potentials


def main():
    p = ArgumentParser(description=__doc__)
    for arg in ("repo", "graph", "registry", "projection", "forced", "out"):
        p.add_argument("--"+arg,type=Path,required=True)
    p.add_argument("--controls-out", type=Path)
    a=p.parse_args()
    assert __debug__
    registry=pinned_json(a.registry,REGISTRY_SHA)
    projection=pinned_json(a.projection,PROJECTION_SHA)
    forced=pinned_json(a.forced,FORCED_SHA)
    assert forced["actualPositiveSystems"] == 20
    with TemporaryFile() as file:
        graph=Archive(a.graph,file)
        rows, potentials=bind(graph,registry,projection,forced)
        if a.controls_out:
            control_results={}
            for label, field, from_key in [
                ("CutoffUsedInPlaceOfItsDerivative","cutoffDerivative","cutoff"),
                ("PhaseFromDifferentSign","phase","otherSignPhase"),
                ("TransverseCoordinateUsedAsPulse","pulseValue","transverse"),
            ]:
                altered=deepcopy(forced)
                first=altered["bindings"][0]
                value=(first["cutoff"] if from_key=="cutoff" else
                       altered["bindings"][2]["phase"] if from_key=="otherSignPhase" else
                       rows[0]["sourceGuards"][-2][0])
                first[field]=value
                try:
                    bind(graph,registry,projection,altered)
                except AssertionError:
                    control_results[label]="REJECTED"
                else:
                    raise ValueError("Unexpected accepted mutation: "+label)
            a.controls_out.write_text(json.dumps(control_results,indent=2)+"\n",encoding="utf8")
    result={"schema":"MathScope.N6.FirstCycleHomogeneousCutoffRecipe/1",
            "verdict":"BOUND_PRIMARY_AND_SIGNED_HALF_LEADING_CUTOFF_RECIPES",
            "sourceCommit":PRODUCER_COMMIT,"sourceBlobs":sources(a.repo),
            "graphSHA256":GRAPH_SHA,"registrySHA256":REGISTRY_SHA,
            "residualProjectionSHA256":PROJECTION_SHA,"forcedPrincipalCutoffsSHA256":FORCED_SHA,
            "positiveModesPerFamily":10,"checkedRealComponentsPerFamily":30,
            "formalCutoff":PSI,"formalPulseCoordinate":V,
            "uncutPotentialDefinitions":potentials,"bindings":rows,
            "ownChartCoefficient":"For each positive m=1 component use dpsi * uncutHalfLeading; negative m=-1 is its real conjugate.",
            "residualReferenceChartScale":projection["forcingChart"]["referenceResidualMultiplier"],
            "pulseDerivativeSupportVOverLs":[["1/5","1/4"],["3/4","4/5"]],
            "zeroBranchOrder":"Check inherited fixed row and own-chart guards before evaluating any uncut potential.",
            "homogeneousEquationPremise":"Use the original moving-normal homogeneous equation with fixed slow variables and fixed transverse coordinate.",
            "divideByCutoff":False,"completeFirstCycleFlatResidual":False,"completeSecondForcingInput":False}
    a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps({"caseRows":len(rows),"potentials":len(potentials),
                      "sha256":sha256(a.out.read_bytes()).hexdigest()}))


if __name__ == "__main__":
    main()
