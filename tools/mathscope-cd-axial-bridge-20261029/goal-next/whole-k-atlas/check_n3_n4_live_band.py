"""Check the physical N3 reduction of the actual original N4 band."""
from argparse import ArgumentParser
from collections import Counter
from functools import lru_cache
from hashlib import sha256
from pathlib import Path
import gzip
import json


PINS = {
    3: ("f59857c4616e90727e64d9aa77b8ee8a51082274c16cff53098ea7f5db5f511c",
        "75c53ba678b7db51dc53527d6b753d76e1fc013d515ff253b7b581513b0b53a0"),
    4: ("ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd",
        "049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad"),
}
SOURCE = "f8cb4034e86d7b669d52a6f2248aebba156b51b5"
SCALE_PIN = "5a6ecee45d797d582e3218c36f980d5eb131619c860cec1bfb4d57aea89cdf56"
SHARED = 123870
PROFILE_PRELUDE = 130000
FORMAL_NAMES = ("R", "Z", "T", "Xrep", "etarep", "srep", "ell")
NORMALIZED = {"F": "F", "G": "U", "M": "M", "pressure": "Pi", "Ttheta": "Ttheta", "Tz": "Tz"}
COMMUTATIVE = {"add", "multiply", "maximum"}


def pinned(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return json.loads(raw)


class Band:
    def __init__(self, root, n):
        self.n = n
        self.receipt = json.loads((root/"original-whole-k-prefix.json").read_bytes())
        r = self.receipt
        assert r["sourceCommit"] == SOURCE and r["requestedPrefix"] == n and r["currentStage"] == "COMPLETE"
        assert r["scope"]["originalCurrentPressurePrivateSeals"]
        g = root/"original-whole-k-current-pressure-graph"
        self.stream_path = g/"original-source-nodes.jsonl.gz"
        graph_sha, registry_sha = PINS[n]
        manifest = json.loads((g/"original-source-export-manifest.json").read_bytes())
        assert r["snapshot"] == manifest and manifest["node_stream_sha256"] == graph_sha
        assert manifest["definitions_sha256"] == registry_sha and manifest["function_registry_capture_kind"] == "RAW_BASE_ONLY"
        base = pinned(g/"original-source-functions.json", registry_sha)["base"]
        self.expression = json.loads(base["expression"])
        self.monotone = json.loads(base["monotone"])
        self.pulses = json.loads(base["m3GlobalPulses"])
        self.fixed = json.loads(base["fixed"])
        assert len(self.pulses) == 2 and all(p["initial"] == [1,0] and p["left"] == 0 for p in self.pulses)
        self.params = tuple(self.pulses[0]["parameters"])
        self.pulse_time = self.pulses[0]["variable"]
        self.length = self.pulses[0]["length"]
        assert all(tuple(p["parameters"]) == self.params and p["variable"] == self.pulse_time
                   and p["length"] == self.length and p["directions"] == list(self.params[:3])
                   and p["directionParameterIndices"] == [0,1,2] for p in self.pulses)
        self.active = r["selector"]["activeBackgroundRows"]
        assert [row["order"] for row in self.active] == list(range(1,n+1))
        self.cut_rows = {row["scale"]: "b"+str(row["order"]) for row in self.active}
        self.nodes = {}
        self.prelude = {}
        start = r["authenticatedUpstream"]["nodeCount"]
        self.band_start = start
        end = max(i for pulse in self.pulses for row in pulse["matrix"] for i in row)+1
        assert start <= min(self.params) < end <= start+12000
        digest, prefix = sha256(), sha256()
        with gzip.open(self.stream_path, "rb") as stream:
            header = stream.readline()
            assert json.loads(header) == {"schema":"MathScope.M3.FullNodesJSONL/1","node_count":manifest["node_count"]}
            digest.update(header)
            for i,line in enumerate(stream):
                digest.update(line)
                if i < SHARED:
                    prefix.update(line)
                if i < PROFILE_PRELUDE:
                    node = json.loads(line)
                    self.prelude[i] = (node["op"],node["args"])
                if (i < 10000 or start-15000 <= i < end or
                        line.startswith(b'{"op":"source_parameter"') or
                        (len(line) < 100 and line.startswith(b'{"op":"rational"'))):
                    node = json.loads(line)
                    self.nodes[i] = (node["op"],node["args"])
            assert i+1 == manifest["node_count"] and digest.hexdigest() == graph_sha
        self.prefix = prefix.hexdigest()
        self.expression_by_name = {d["name"]:i for i,d in enumerate(self.expression)}
        assert len(self.expression_by_name) <= len(self.expression)

    def node(self, i):
        return self.nodes[i] if i in self.nodes else self.prelude[i]

    def flatten(self, i, op, *, prelude=False, stop_before_band=False):
        if stop_before_band and i < self.band_start:
            return [i]
        if i not in self.nodes and (not prelude or i not in self.prelude):
            return [i]
        if self.node(i)[0] != op:
            return [i]
        return [z for j in self.node(i)[1] for z in self.flatten(j, op, prelude=prelude, stop_before_band=stop_before_band)]

    def expression_named(self, name):
        i = self.expression_by_name[name]
        return i, self.expression[i]

    def atom(self, system):
        return self.expression[system]["name"]

    def validate_rows(self):
        formal = self.expression_named("ActualCommonBandNormalized_F")[1]["parameters"]
        q0,X0,eta0 = formal
        self.local_q = self.receipt["scope"]["exactPrefixDomain"]["q"]
        self.basic_systems = {}
        self.leading_systems = {}
        self.normalized_systems = {}
        self.normalized_leads = {}
        self.fourth_terms = {}
        self.formal = formal
        self.cutoffs = set()
        for row in self.active:
            assert row["scale"] == self.receipt["selector"]["rows"][row["order"]-1]["scale"]
            assert row["chi"] == row["reducedChi"] and row["extra"] == row["reducedExtra"]
            assert self.node(row["sigma"])[0] == "multiply"
            assert Counter(self.node(row["sigma"])[1]) == Counter([row["scale"],q0])
            chi, sigma, extra, power = (row[k] for k in ("chi","sigma","extra","positivePower"))
            op,args = self.node(chi)
            assert op == "actual_expression_partial"
            system, arguments, orders = args
            assert arguments == [sigma] and orders == [0]
            cutoff = self.expression[system]
            self.cutoffs.add(system)
            assert len(cutoff["parameters"]) == 1
            cutoff_op, branches = self.node(cutoff["body"])
            assert cutoff_op == "smooth_piecewise" and len(branches) == 6
            assert branches[:4] == [cutoff["parameters"][0],19,1,1] and branches[5] == 0, branches
            assert cutoff["name"] == "CommonOriginalTimeCutoff"
            op, args = self.node(extra)
            assert op == "multiply" and sigma in args
            [extra_call] = [i for i in args if i != sigma]
            assert self.node(extra_call) == ("actual_expression_partial", [system,[sigma],[1]])
            assert self.node(row["weight"])[0] == "multiply"
            assert Counter(self.node(row["weight"])[1]) == Counter([chi,power])
            op,[exponent] = self.node(power)
            assert op == "exp"
            factors = self.flatten(exponent,"multiply",prelude=True)
            [log_q] = [i for i in factors if i in self.nodes and self.node(i)==("log_positive",[q0])]
            [coefficient] = [i for i in factors if i not in (log_q,self.fixed["core"]["h"])]
            assert self.node(coefficient) == ("rational",[str(2*row["order"]),"1"])
            assert self.fixed["core"]["h"] in factors and len(factors) == 3
        for name, key in NORMALIZED.items():
            sys, d = self.expression_named("ActualCommonBandNormalized_"+name)
            assert d["parameters"] == formal
            terms = self.flatten(d["body"],"add",stop_before_band=True)
            assert len(terms) == self.n+1
            for row in self.active:
                [term] = [i for i in terms if Counter(self.flatten(i,"multiply")) ==
                          Counter(self.flatten(row["weight"],"multiply")+[row["sourceRoots"][key]])]
                terms.remove(term)
                if row["order"] == 4:
                    self.fourth_terms[name] = term
            [self.normalized_leads[name]] = terms
            self.normalized_systems[name] = sys
        # Radial velocity carries the original extra cutoff derivative.
        sys,d = self.expression_named("ActualCommonBandNormalized_b")
        assert d["parameters"] == formal
        op, args = self.node(d["body"])
        assert op == "multiply" and len(args) == 2
        [inverse] = [i for i in args if i in self.nodes and self.node(i)[0] == "inverse"]
        [sqrt] = self.node(inverse)[1]
        assert self.node(sqrt)[0] == "sqrt_positive"
        [radicand] = self.node(sqrt)[1]
        assert Counter(self.flatten(radicand,"multiply")) == Counter([24,X0])
        [numerator] = [i for i in args if i != inverse]
        terms = self.flatten(numerator,"add",stop_before_band=True)
        assert len(terms) == self.n+1
        for row in self.active:
            power = row["positivePower"]
            [term] = [i for i in terms if i in self.nodes and self.node(i)[0]=="multiply" and power in self.node(i)[1]]
            [difference] = [i for i in self.node(term)[1] if i != power]
            op, pieces = self.node(difference)
            assert op == "add" and len(pieces) == 2
            [positive] = [i for i in pieces if Counter(self.flatten(i,"multiply")) ==
                          Counter([row["chi"], X0, row["sourceRoots"]["v"]])]
            [negative] = [i for i in pieces if i != positive]
            factors = self.flatten(negative,"multiply")
            [inverse_L] = [i for i in factors if i in self.nodes and self.node(i)==("inverse",[self.fixed["core"]["L"]])]
            assert Counter(factors) == Counter([20,24,eta0,row["sourceRoots"]["M"],inverse_L]
                                               + self.flatten(row["extra"],"multiply"))
            terms.remove(term)
            if row["order"] == 4:
                self.fourth_terms["b"] = term
        [self.normalized_leads["b"]] = terms
        self.normalized_systems["b"] = sys
        self.profile_slots = {}
        self.multipliers = {}
        for name in ("F","G","b","pressure"):
            sys,d = self.expression_named("M3GlobalBandSlow_"+name)
            assert d["parameters"] == [*self.params[:3], self.params[-1]]
            terms = self.flatten(d["body"], "multiply")
            [call] = [i for i in terms if i in self.nodes and self.node(i)[0] == "actual_expression_partial"]
            _,[native,slots,orders] = self.node(call)
            assert native == self.normalized_systems[name] and slots[0] == self.local_q and orders == [0,0,0]
            assert len(slots) == 3
            self.profile_slots[name] = slots
            self.multipliers[name] = [i for i in terms if i != call]
            self.basic_systems[name] = sys
        assert len({tuple(row) for row in self.profile_slots.values()}) == 1
        live_R, live_Z, live_T, *_, ell = self.params
        op,args = self.node(self.local_q)
        assert op == "multiply" and len(args) == 2
        [self.live_s] = [i for i in args if self.node(i)[0] == "actual_monotone_root"]
        [band_Q] = [i for i in args if i != self.live_s]
        _,[system,Z,T] = self.node(self.live_s)
        assert (Z,T) == (live_Z,live_T)
        inverse = self.monotone[system]
        assert inverse["name"] == "ActualCommonBandSlowInverse" and inverse["parameters"] == [live_Z,live_T]
        assert inverse["left"] == 19 and inverse["right"] == 24
        root_variable = inverse["variable"]
        terms = self.flatten(inverse["body"],"add")
        assert len(terms) == 3 and root_variable in terms
        [minus_T] = [i for i in terms if self.node(i)[0] == "multiply" and
                     Counter(self.flatten(i,"multiply")) == Counter([20,live_T])]
        [minus_Z_squared_s] = [i for i in terms if i not in (root_variable,minus_T)]
        factors = self.flatten(minus_Z_squared_s,"multiply")
        assert len(factors) == 3 and 20 in factors
        [Z_squared] = [i for i in factors if self.node(i) == ("integer_power",[live_Z,2])]
        [radial_factor] = [i for i in factors if i not in (20,Z_squared)]
        op,[power] = self.node(radial_factor)
        assert op == "exp"
        power_factors = self.flatten(power,"multiply",prelude=True)
        [log_root] = [i for i in power_factors if self.node(i)==("log_positive",[root_variable])]
        assert Counter(power_factors) == Counter([24,self.fixed["core"]["h"],log_root])
        op,[exponent] = self.node(band_Q)
        assert op == "exp" and Counter(self.flatten(exponent,"multiply")) == Counter([20,ell,127])
        _,X,eta = self.profile_slots["F"]
        assert self.node(X)[0] == "multiply" and self.node(eta)[0] == "multiply"
        [squared] = [i for i in self.node(X)[1] if self.node(i)==("integer_power",[live_R,2])]
        [X_inv] = [i for i in self.node(X)[1] if i != squared]
        op,[X_denom] = self.node(X_inv)
        assert op == "inverse" and Counter(self.flatten(X_denom,"multiply")) == Counter([24,self.live_s])
        assert live_Z in self.node(eta)[1]
        [eta_inv] = [i for i in self.node(eta)[1] if i != live_Z]
        op,[eta_denom] = self.node(eta_inv)
        assert op == "inverse"
        op,[eta_exponent] = self.node(eta_denom)
        assert op == "exp"
        factors = self.flatten(eta_exponent,"multiply")
        assert self.fixed["core"]["D"] in factors
        [log_s] = [i for i in factors if i != self.fixed["core"]["D"]]
        assert self.node(log_s) == ("log_positive",[self.live_s])
        for name, original in (("F",2),("G",3)):
            sys,d = self.expression_named("ActualCommonBandLeading_"+name)
            assert d["parameters"] == list(self.params[:3])
            terms = self.flatten(d["body"],"multiply")
            [call] = [i for i in terms if i in self.nodes and self.node(i)[0]=="actual_expression_partial"]
            assert self.node(call) == ("actual_expression_partial",[original,self.profile_slots[name][1:],[0,0]])
            assert Counter(i for i in terms if i != call) == Counter(self.multipliers[name])
            self.leading_systems[name] = sys


def stable_hash(token):
    return sha256(json.dumps(token,separators=(",",":")).encode()).hexdigest()


class MatrixForm:
    """Compare local typed formulas with the proven common F/G bodies as atoms."""
    def __init__(self, band):
        self.band = band
        self.variables = dict(zip((*band.params,band.pulse_time),(*FORMAL_NAMES,"v"),strict=True))
        self.calls = {}
        self.changed = {}

    def load_dependencies(self):
        """Read exact pre-band operands reached by the local registered roots."""
        b = self.band
        pending = [b.length, *(i for pulse in b.pulses for row in pulse["matrix"] for i in row)]
        seen = set()
        read = set()
        while pending:
            missing = set()
            while pending:
                i = pending.pop()
                if i < SHARED or i in self.variables or i in seen:
                    continue
                if i not in b.nodes and i not in b.prelude:
                    missing.add(i)
                    continue
                seen.add(i)
                op, args = b.node(i)
                if op in {"rational", "source_parameter"}:
                    continue
                if op == "actual_expression_partial":
                    pending.extend(args[1])
                elif op == "integer_power":
                    pending.append(args[0])
                elif op == "actual_monotone_root":
                    pending.extend(args[1:])
                else:
                    assert op in COMMUTATIVE | {"inverse","exp","log_positive","sqrt_positive","ceiling","smooth_piecewise"}, (i,op)
                    pending.extend(args)
            if missing:
                assert len(read | missing) <= 2000, "Matrix upstream dependency budget"
                pending = sorted(missing, reverse=True)
                with gzip.open(b.stream_path, "rb") as stream:
                    next(stream)
                    for i, line in enumerate(stream):
                        if i in missing:
                            node = json.loads(line)
                            b.nodes[i] = (node["op"], node["args"])
                        if i == pending[0]:
                            break
                assert missing <= b.nodes.keys()
                read.update(missing)
        return sorted(read)

    @lru_cache(maxsize=None)
    def fingerprint(self, i):
        b = self.band
        if i in self.variables:
            return stable_hash(["coordinate",self.variables[i]])
        if i < SHARED:
            return stable_hash(["same-source-prefix",i])
        op, args = b.node(i)
        if i in self.changed:
            op, args = self.changed[i]
        if op in {"rational","source_parameter"}:
            token = [op,args]
        elif op == "actual_expression_partial":
            system, slots, orders = args
            name = b.atom(system)
            if system in b.basic_systems.values():
                assert slots == [*b.params[:3],b.params[-1]], (name,slots)
            else:
                assert system in b.leading_systems.values(), (name,slots)
            self.calls[i] = (name,slots,orders)
            token = [op,name,[self.fingerprint(j) for j in slots],orders]
        elif op == "integer_power":
            token = [op,self.fingerprint(args[0]),args[1]]
        elif op == "actual_monotone_root":
            assert i == b.live_s
            token = [op,"ActualCommonBandSlowInverse",[self.fingerprint(j) for j in args[1:]]]
        elif op in COMMUTATIVE:
            token = [op,sorted(self.fingerprint(j) for j in b.flatten(i,op))]
        else:
            assert op in {"inverse","exp","log_positive","sqrt_positive","ceiling","smooth_piecewise"}, (i,op)
            token = [op,[self.fingerprint(j) for j in args]]
        return stable_hash(token)


def compare(left, right):
    assert left.prefix == right.prefix and left.fixed["core"] == right.fixed["core"]
    for a,b in zip(left.active,right.active[:3],strict=True):
        assert a["sourceRoots"] == b["sourceRoots"]
        assert all(i < SHARED for i in a["sourceRoots"].values())
    for name in ("F","G"):
        a,b = left.normalized_leads[name],right.normalized_leads[name]
        assert a == b and a < SHARED, (name,a,b)
    assert set(right.fourth_terms) == {*NORMALIZED,"b"}
    l,r = MatrixForm(left),MatrixForm(right)
    extra_matrix_nodes = [l.load_dependencies(), r.load_dependencies()]
    # The cutoff parameters are live; compare the full chart first without
    # using the abstract F/G call nodes.
    for name in left.profile_slots:
        assert [l.fingerprint(i) for i in left.profile_slots[name]] == [r.fingerprint(i) for i in right.profile_slots[name]]
        assert sorted(l.fingerprint(i) for i in left.multipliers[name]) == sorted(r.fingerprint(i) for i in right.multipliers[name])
    roots = []
    for j,(p,q) in enumerate(zip(left.pulses,right.pulses,strict=True)):
        for a,b in zip((k for row in p["matrix"] for k in row),(k for row in q["matrix"] for k in row),strict=True):
            digest = l.fingerprint(a)
            assert digest == r.fingerprint(b), (j,a,b)
            roots.append({"signIndex":j,"N3":a,"N4":b,"canonicalSHA256":digest})
    assert l.fingerprint(left.length) == r.fingerprint(right.length)
    leading = [(i,row) for i,row in r.calls.items() if row[0].startswith("ActualCommonBandLeading_")]
    assert sorted((name,tuple(orders)) for _,(name,_,orders) in leading) == [
        ("ActualCommonBandLeading_F",(0,0,0)),("ActualCommonBandLeading_F",(1,0,0)),
        ("ActualCommonBandLeading_G",(1,0,0))]
    [slots] = {tuple(s) for _,(_,s,_) in leading}
    assert all(i not in right.params[:3] for i in slots)
    Xrep, eta_rep, s_rep = right.params[3:6]
    Rrep, Zrep, Trep = slots
    op,[radicand] = right.node(Rrep)
    assert op == "sqrt_positive" and Counter(right.flatten(radicand,"multiply")) == Counter([24,Xrep,s_rep])
    assert right.node(Zrep)[0] == "multiply" and eta_rep in right.node(Zrep)[1]
    [Zpower] = [i for i in right.node(Zrep)[1] if i != eta_rep]
    op,[Zexp] = right.node(Zpower)
    assert op == "exp"
    Zfactors = right.flatten(Zexp,"multiply")
    assert right.fixed["core"]["D"] in Zfactors
    [log_rep] = [i for i in Zfactors if i != right.fixed["core"]["D"]]
    assert right.node(log_rep) == ("log_positive",[s_rep])
    assert right.node(Trep)[0] == "multiply" and s_rep in right.node(Trep)[1]
    [positive] = [i for i in right.node(Trep)[1] if i != s_rep]
    op,parts = right.node(positive)
    assert op == "add" and 1 in parts
    [negative] = [i for i in parts if i != 1]
    assert right.node(negative)[0] == "multiply" and 20 in right.node(negative)[1]
    [square] = [i for i in right.node(negative)[1] if i != 20]
    assert right.node(square) == ("integer_power",[eta_rep,2])
    formal = set(right.params[3:6])
    pending, seen, used = list(slots), set(), set()
    while pending:
        i = pending.pop()
        if i < SHARED or i in seen:
            continue
        seen.add(i)
        if i in formal:
            used.add(i)
            continue
        op,args = right.node(i)
        assert op not in {"coordinate","actual_expression_partial","actual_monotone_root"}
        if op not in {"source_parameter","rational"}:
            pending.extend(args[:1] if op=="integer_power" else args)
    assert used == formal
    # A changed source call at the frozen point must change the matrix.
    altered = MatrixForm(right)
    i,(name,_,orders) = leading[0]
    altered.changed[i] = ("actual_expression_partial",[right.expression_by_name[name],list(right.params[:3]),orders])
    assert any(altered.fingerprint(row["N4"]) != row["canonicalSHA256"] for row in roots)
    return {
        "sharedPrefixRecords": SHARED, "sharedPrefixSHA256": left.prefix,
        "commonNormalizedLeadRoots": {k:left.normalized_leads[k] for k in ("F","G")},
        "sevenActualFourthTermsIdentified": True,
        "matchedLiveProfileSlotsAndMultipliers": sorted(left.profile_slots),
        "N4CutoffAndExtra": {key:right.active[-1][key] for key in ("chi","extra","sigma","weight","positivePower")},
        "N4ExactRemovedFieldTerms": right.fourth_terms,
        "matrixEntries": roots, "length": [left.length,right.length],
        "readPreBandMatrixOperands": extra_matrix_nodes,
        "N4LiveNativeCalls": [{"node":i,"name":name,"arguments":s,"orders":o}
                              for i,(name,s,o) in sorted(r.calls.items()) if i not in dict(leading)],
        "N4FrozenLeadingCalls": [{"node":i,"name":name,"arguments":s,"orders":o} for i,(name,s,o) in leading],
        "rejectFrozenToLiveArgumentSubstitution":True,
    }


def main():
    parser = ArgumentParser(description=__doc__)
    for key in ("n3","n4","fourth","out"):
        parser.add_argument("--"+key,type=Path,required=True)
    args=parser.parse_args()
    scale=pinned(args.fourth,SCALE_PIN)
    assert scale["sourceCommit"] == SOURCE and scale["exactRatios"] == {
        "b1*qBig":1,"b2*qBig":16,"b3*qBig":32,"b4*qBig":64,
    }
    left,right=Band(args.n3,3),Band(args.n4,4)
    left.validate_rows()
    right.validate_rows()
    result={"schema":"MathScope.N7.PhysicalFourthBandJetReduction/1",
            "sourceCommit":SOURCE,"originalGraphPins":PINS,"scaleReceiptSHA256":SCALE_PIN,
            **compare(left,right),
            "scope":"Same formal own-band coordinates and fixed representative. The actual fourth cutoff and extra have flat zero jets at physical q>=qBig/64. Frozen carrier calls use only leading F/G. No wider N3 certificate or all-cycle jet promotion.",
            "release":"HOLD"}
    raw=(json.dumps(result,indent=2)+"\n").encode()
    args.out.write_bytes(raw)
    print("PASS eight original pulse matrix entries, exact fourth field terms and frozen leading inputs",sha256(raw).hexdigest())


if __name__=="__main__":
    main()
