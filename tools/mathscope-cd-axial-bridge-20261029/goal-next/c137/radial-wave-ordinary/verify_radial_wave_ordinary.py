"""Replay the ordinary native wave and pressure closure of the first Repeat radial hull."""
from argparse import ArgumentParser
from collections import Counter
from functools import cache
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import runpy

PINS = {
    "hull": ("work", "continuation136/radial-operator-hull/radial-operator-hull.json", "a9abe087f3f5f7796ab06150ec61cb7ca4f8f5ec9770e8cf0eb86c68c1e55127"),
    "allTT": ("work", "continuation135/radial-all-tt/all-wave-tt.json", "0b2bc4cb556d2fcf45f2cc513f3e3fad2753bc01b256aa8226c6c5fe4037171d"),
    "nativeReader": ("work", "continuation135/radial-all-tt/verify_all_wave_tt.py", "c361ed8a91f7b9fdaaa3143830dc0b5ae2e1b411012b935b535c6be2e1b3b663"),
    "highSigma": ("work", "continuation135/radial-sigma-mixed/replay1.json", "847609b8d145c6ae52f9b6a96c7aa0764531f8c8767c97be619f0969f73d6184"),
    "gaussianReplay": ("work", "continuation134/radial-time-gaussian/verify_radial_time_gaussian.py", "73cd66c070f1e1ed9468aa1db1bb27c0c502b832f4e6d29f8fe0f72487e2a3c1"),
    "sigmaSpatial": ("goal", "c108/early-sigma-c6/early-sigma-c6.json", "d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f"),
    "sigmaT": ("goal", "c118/pure-sigma-time-join/pure-sigma-time.json", "b128b6131412a2aef44c6a945b00ca03b38c04308a57c141e03476ea82d5c796"),
    "sigmaRT": ("goal", "c119/signed-mixed-native-time/signed-mixed-sigma-time.json", "d43d7d90c831c82b13c9fb68be5e4ab3acd8212fb7a1bd894e4d061d26673014"),
    "sigmaRZT": ("work", "continuation125/sigma-mixed-join/sigma-mixed-join.json", "ec610109784540efae884f7ddcb5a5c8da354cbd9e94c0c7aee8dd2790b65f0a"),
    "sigmaRRT": ("work", "continuation127/sigma-rrt/join.json", "e59a7141b801536964f6991ff99a38112e4a997cd29a3a25fe3807566fdfec3c"),
    "sigmaZ3T": ("work", "continuation128/sigma-high-time/sigma-high-time.json", "c09bf88e3ad65ecf9b5f21e25fe229469cd3e491bacb2dd0ee5ead4627d6ef00"),
    "sigmaRRZT": ("work", "continuation130/sigma-rrzt/join.json", "00d57efc37cceec1dcc907792d9da7db92278ed77298c6b52bef008c402e2cc3"),
    "pressure": ("work", "continuation120/first-cycle-wave-pressure/final/repeat-wave-pressure.json", "412d110f4167387da8fa5cc697c50ac5c7d147a2f3eec8969daadc56cdbc11e5"),
    "pressureApps": ("work", "continuation120/first-cycle-wave-pressure/final/pressure-applications.json", "0e92e5acc5bd570c86bef2ba6780dc4aeea1df2a13e3f3884cffb6e11aa8578d"),
    "forcedNumeric": ("work", "continuation129/temporal-presigned-extra/full-covariance-first.json", "797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac"),
    "subtractions": ("work", "continuation136/radial-subtractions/radial-subtractions.json", "5a180455eb9a631903da085ca0bd62218da2562e19a43c12fb1b79796c1e7636"),
}
ZERO = (0,0,0,0)
GAUGE_OFFSETS = (ZERO,(1,0,0,0),(0,1,0,0),(0,0,0,1))
REGIONS = ("inner","outer")
SIGMA, PRESSURE_Z, ENDS = [22001223,22001224], 22000443, [17743711,17743713]
PARTS = ("real","imaginary")
COMP = ("r","theta","z")
GAUSS = {"1":"1/2","2":"1"}


def load(a):
    docs = {}
    for k, (base, name, h) in PINS.items():
        p = getattr(a,base)/name
        raw = p.read_bytes()
        assert sha256(raw).hexdigest() == h, p
        docs[k] = runpy.run_path(str(p)) if p.suffix == ".py" else json.loads(raw)
    return docs


def down(a):
    return product(*(range(x+1) for x in a))


def plus(a,b):
    return tuple(x+y for x,y in zip(a,b,strict=True))


def typed_rows(rows):
    table = {}
    for row in rows:
        table.setdefault(tuple(row["RZT"]),set()).add(row["field"])
    return {q for q,fields in table.items() if fields == {"theta","z"}}


def collar_directions(d):
    h = d["hull"]
    assert h["basis"] == ["R","Z","T","L","N"]
    assert h["waveDerivativesByN"] == {"0":28,"1":9,"2":1}
    assert h["secondTime"] == [[0,0,2,0,0]]
    wave = {tuple(q[:4]) for q in h["waveFirstDerivativeHull"] + h["waveSeeds"] if not q[4] and q[2]<2}
    assert len(wave) == 28 and ZERO in wave and {(0,0,2,0)}.isdisjoint(wave)
    assert all(q in wave for a in wave for q in down(a))
    press = {tuple(q[:4]) for q in h["pressureFirstDerivativeHull"]+h["pressureSeeds"] if not q[4]}
    assert press == {tuple(q) for q in d["pressure"]["fourteenCommonProductDirections"]}
    assert len(press) == 14 and all(q in press for a in press for q in down(a))
    assert d["pressure"]["archivedExactApplicationAndActiveCapsuleReceiptSHA256"] == PINS["pressureApps"][2]
    for region in REGIONS:
        rows = d["pressure"]["pressureOverP"]["regions"][region]
        assert {tuple(r["RZTL"]) for r in rows} == press and len(rows) == len(press)
        for row in rows:
            assert [row[k]["weight"] for k in ("primary1","forced1","signed1","forced2")] == ["sqrt(zeta)"]*3+["zeta"]
            assert all(Q(row[k]["pole"]) >= 0 for k in ("primary1","forced1","signed1","forced2"))
    gauges = {plus(b,o) for alpha in wave for b in down(alpha) for o in GAUGE_OFFSETS}
    assert len(gauges) == 55 and max(sum(q[:3]) for q in gauges) == 4 and max(q[3] for q in gauges) == 4
    st = d["sigmaSpatial"]
    assert st["SigmaApplications"] == SIGMA and st["incrementalPressureZ"] == PRESSURE_Z
    assert st["fixedRadialEndpoints"] == ENDS
    t = d["sigmaT"]
    assert t["actualNativeSigma"] == SIGMA and t["actualIncrementalPressureZ"] == PRESSURE_Z
    assert t["actualShiftedMomentEndpoints"] == ENDS
    m = d["sigmaRT"]
    assert m["nativeSigmaRoots"] == SIGMA and m["actualIncrementalPressureZ"] == PRESSURE_Z
    assert m["sourceEndpoints"] == ENDS
    high = d["highSigma"]
    assert high["sourceRoots"] == SIGMA + [PRESSURE_Z] and high["fixedEndpoints"] == ENDS
    sigma_tables = {}
    for region in REGIONS:
        tab = {"sigmaSpatial":typed_rows(st["regions"][region]["rows"]),
               "sigmaT":typed_rows(t["physicalDirections"][region]["rows"]),
               "sigmaRT":{tuple(x) for x in m["mixedRZT"]},
               "highSigma":{tuple(x) for x in high["targets"]}}
        for k in ("sigmaRZT","sigmaRRT","sigmaZ3T","sigmaRRZT"):
            row = d[k]
            assert row["nativeSigmaRoots"] == SIGMA and row["actualIncrementalPressureZ"] == PRESSURE_Z
            assert row["sourceEndpoints"] == ENDS and region in row["regions"]
            tab[k] = {tuple(q) for q in row["targetsRZT"]}
        sigma_tables[region] = tab
    sigma = {q[:3] for q in gauges}
    assert len(sigma) == 25
    coverage = []
    for q in sorted(sigma):
        sources = [k for k in sigma_tables["inner"] if all(q in sigma_tables[r][k] for r in REGIONS)]
        assert len(sources) == 1, (q,sources)
        coverage.append({"RZT":q,"witness":sources[0]})
    numeric = d["forcedNumeric"]
    paid = {tuple(q) for q in numeric["targetGaugeDirections"]}
    for reg in REGIONS:
        tab1 = {tuple(q["RZTL"]):q for q in numeric["threeRegionModeOneGauges"][reg]}
        tab2 = {tuple(q["RZTL"]):q for q in numeric["modeTwoGauges"]}
        assert paid == set(tab1) == set(tab2)
        for b in gauges & paid:
            assert all(Q(x)>=0 for x in (tab1[b]["poleAfterHalfGaussian"],tab2[b]["poleAfterZeta"]))
    extra = gauges - paid
    assert extra == {(3,0,0,1),(4,0,0,0)}
    assert extra <= {tuple(q) for q in high["forceRZTL"]}
    assert set(high["regions"]) == set(REGIONS)
    return wave,press,gauges,extra,coverage


def replay_gaussian_routes(a,d,wave,gauges,extra):
    mod = d["gaussianReplay"]
    roots = {"work":a.work,"goal":a.goal,
             "runtime":a.work/"continuation66/stage2/runtime-exact/research-ide"}
    pins = ("modeOneRecipe","primary","meanCollar","meanAlgebra","frame","forcedSystem","forcedCurl",
            "oldFirstForced","signedInverse","signedStress")
    src = {k:mod["load"](roots,k) for k in pins}
    recipes = src["modeOneRecipe"]["grouped_recipes"]()
    assert all(any(k in {"U","Uo","P"} for k,o in term) for layer in recipes.values() for term in layer)
    raw = set()
    mean = set()
    mean_map = {"Db":"beta","Dv":"v","Dg":"gamma"}
    for alpha in extra:
        for b in down(alpha):
            raw.update((k,plus(b,o)) for layer in recipes.values() for term in layer for k,o in term if k in {"U","Uo","P"})
            mean.update((mean_map[k],plus(b,o)) for layer in recipes.values() for term in layer for k,o in term if k in mean_map)
            raw.update(("U_modeTwo",plus(b,o)) for o in GAUGE_OFFSETS)
    _, cov, inverse, primitive, _ = src["meanCollar"]["collar"](src["meanAlgebra"],6,sorted(mean))
    primary_rows = raw | {("U_Covariance",j) for _,j in cov}
    for k,rows in (("primaryRows",primary_rows),("initializedMeanRows",mean),("initializedMeanPrimaryCovariance",cov),
                   ("oldMeanInverseRoles",inverse),("oldMeanShortPrimitiveRoles",primitive)):
        assert rows <= {(x,tuple(j)) for x,j in d["highSigma"][k]}, k
    ledger = src["primary"]["weightedQuotientLedger"]
    assert max(sum(q[:3]) for q in wave) <= 11
    assert max(q[3] for q in wave) <= ledger["transverseDerivativeCoverage"]["normalizedVelocityL"]
    assert src["frame"]["matrixDirections"] == 816 and src["frame"]["cutoffOrder"] >= max(q[3] for q in gauges)
    fixed = src["oldFirstForced"]["nativeConditions"]
    assert {"v","xi","Ls","H_w","P"} <= set(fixed["fixedAtNativeT"]) and fixed["noEndpointTerms"]
    assert "normalRow,velocity),cdot(G,n,forcing)" in src["forcedSystem"]
    assert "A_m=i*n(Y) cross (psi(v(Y))*t_m(v(Y),basepoint))/(k*m*|n(Y)|^2)" in src["forcedCurl"]
    assert "G.div(x,G.mul(G.q(2),a[j]))" in src["signedInverse"]
    assert "squareRootWeights,epsilon,target:target.Sigma" in src["signedStress"]
    assert "G.mul(k,f.frame.nSquared)" in src["signedStress"]
    return {"bothModeAdditionalGaugeDirections":sorted(extra),"originalPrimaryRows":len(primary_rows),
            "oldMeanRows":len(mean),"oldMeanPrimaryCovarianceRows":len(cov),
            "oldMeanInverseRoles":len(inverse),"oldMeanPrimitiveRoles":len(primitive),
            "primaryEnvelope":mod["envelope"]({q for _,q in primary_rows}),"formulaGroupCounts":{k:len(v) for k,v in recipes.items()}}


def flatten(v,root,op,stop=()):
    this, args = v.node(root)
    if this == op and root not in stop:
        for child in args:
            yield from flatten(v,child,op,stop)
    else:
        yield root


def pressure_body(v,defs,c135,fun,sm,normal,opposite):
    body = fun["body"]
    c = sm["cutoff"]
    psi = c["nativePsi"]
    m = sm["harmonic"]
    j = int(m==1 and opposite=="real")
    leaves = v.leaves(body)
    assert set(SIGMA)&leaves == (set(SIGMA) if j else set())
    primary = []
    for leaf in leaves:
        op,args = v.node(leaf)
        if op == "m3_coupled_expression_partial" and defs[args[0]]["name"].startswith("InitializedOriginalPrimaryPressure_"):
            assert not any(args[2]) and args[1] == defs[args[0]]["parameters"]
            primary.append(leaf)
    assert len(primary)==j
    signed = None
    forced = body
    if j:
        top = v.args(body,"add")
        assert len(top)==2
        signed, = [x for x in top if set(SIGMA)<=v.leaves(x)]
        earlier, = [x for x in top if x!=signed]
        assert len(v.args(earlier,"add"))==2
        forced, = [x for x in v.args(earlier,"add") if x!=primary[0]]
    factors = list(flatten(v,forced,"multiply",stop=(psi,)))
    factors.remove(psi)
    if opposite=="imaginary":
        factors.remove(20)
    numerator, = [i for i in factors if v.node(i)[0]=="add"]
    inv, = [i for i in factors if v.node(i)[0]=="inverse"]
    assert len(factors)==2
    den, = v.args(inv,"inverse")
    dterms = list(flatten(v,den,"multiply"))
    dterms.remove(c135["K"])
    if m==2:
        dterms.remove(24)
    ns, = dterms
    ss=list(flatten(v,ns,"add"))
    assert len(ss)==3
    square=[]
    for item in ss:
        a,b=v.args(item,"multiply")
        assert a==b
        square.append(a)
    assert set(square)==set(normal)
    expected = {row["firstForcedRemaining"]["unprojectedOriginalForcing"]:normal[i]
                for i,direction in enumerate(COMP) for row in sm["rows"]
                if row["component"]==direction and row["part"]==opposite}
    t_expected = {row["firstForcedCutoff"]["uncutZeroDataPulseValue"]
                  for row in sm["rows"] if row["part"]==opposite}
    source = {}
    states = {}
    additive = list(flatten(v,numerator,"add"))
    assert len(additive)==6
    for term in additive:
        factors = list(flatten(v,term,"multiply",stop=list(expected)+list(normal)+list(t_expected)))
        hit = set(factors)&set(expected)
        pulse = set(factors)&t_expected
        if hit:
            [atom] = hit
            assert not pulse and Counter(factors)==Counter((atom,expected[atom]))
            source[atom]=expected[atom]
        elif pulse:
            [atom] = pulse
            assert atom not in states
            _,_,component,_,_,_=v.args(atom,"m3_forced_pulse_partial")
            states[atom]=(component,tuple(sorted(x for x in factors if x!=atom)))
        else:
            raise AssertionError((body,term,factors))
    assert source==expected and set(states)==t_expected
    normal_row={j:factors for j,factors in states.values()}
    assert set(normal_row)=={0,1,2} and all(normal_row.values())
    return {"nativePressureBody":body,"primaryPressureApplications":primary,"signedPressureBody":signed,
            "forcedPressureBody":forced,"psi":psi,"normalSquared":ns,"carrierDenominator":den,
            "normalSourceTerms":sorted(source.items()),"originalUncutTangentStates":sorted(states),
            "sixTermNumerator":numerator,"sharedNormalRowProductFactors":sorted(normal_row.items())}


def active_callers(a,d):
    mod=d["nativeReader"]
    inp=mod["read"](a)
    mod["source_rules"](inp)
    g,native,defs,tail=mod["get_streams"](a,inp)
    v=mod["View"](g,tail)
    prefix=mod["PREFIX"]
    exact=runpy.run_path(str(inp["algebra"]))["Exact"]
    E=exact(mod["AppendixAlgebra"](v))
    full=exact(v)

    def expand(poly):
        value=full.scalar(0)
        for powers,scalar in poly.items():
            term=full.scalar(scalar)
            for node,power in powers:
                term=full.mul(term,full.pow(full.of(node),power))
            value=full.add(value,term)
        return value
    ttcuts = {(r["chart"],r["harmonic"]):r for r in d["allTT"]["chartAndModeDefinitions"]}
    tt = {r["definition"]:r for r in d["allTT"]["rows"]}
    pressures = {r["activeOwner"]:r for r in d["pressureApps"]["activePressureWrappers"]}
    sub = {(r["chart"],r["harmonic"]):r for r in d["subtractions"]["chartModes"]}
    old_mode2 = {(r["chart"],r["part"]):r for r in inp["nativePressure"]["protectedModeTwoPressure"]}
    assert d["allTT"]["activeSource"]==inp["liveCensus"]["source"]
    assert len(tt)==120 and len(pressures)==40 and len(sub)==20 and len(old_mode2)==20
    targets=tt|pressures
    used=set()
    active_pressure_nodes=set()
    active_wave_nodes=set()
    counts=Counter()
    outputs=[]
    shared_normal_rows={}
    grouped_pressure_radial=0
    exact_pressure_axial=0
    slot_names={mod["R"]:"R",mod["Z"]:"Z",mod["Y0"]:"Y0",mod["Y1"]:"Y1"}

    @cache
    def calls(root):
        if root<prefix:
            return frozenset()
        op,x=v.node(root)
        if op=="m3_coupled_expression_partial":
            return frozenset((root,)) if x[0] in targets else frozenset()
        if op in {"add","multiply","inverse"}:
            return frozenset().union(*(calls(j) for j in x))
        if op=="integer_power":
            return calls(x[0])
        return frozenset()

    try:
        for template in inp["candidate"]["templates"]:
            key=template["key"]
            meta={(r["system"],tuple(r["orders"])):r["actualBody"] for r in template["rawSupport"]["waveJets"]}
            actual={}
            used_pressure={}
            level=int(key.split(":")[0])
            radial=E.mul(E.of(mod["A"]),E.pow(E.of(mod["LAMBDA"]),-level))
            for row in template["rows"]:
                m=row["m"]
                for j,fields in enumerate(row["raw"]):
                    for p,root in fields.items():
                        pressure_slots=set()
                        pressure_from={}
                        for node in calls(root):
                            owner,args,orders=v.args(node,"m3_coupled_expression_partial")
                            fun=defs[owner]
                            assert args==fun["parameters"] and len(orders)==len(args)
                            assert sum(orders)<=2 and all(o<=l for o,l in zip(orders,fun["derivativeLimits"],strict=True))
                            vector=tuple(orders)
                            assert meta[owner,vector]==fun["body"]
                            assert actual.setdefault((owner,vector),node)==node
                            used.add(owner)
                            if owner in tt:
                                t=tt[owner]
                                assert t["chart"]==key and t["nativeProtectedBody"]==fun["body"] and t["actualArgumentIds"]==args
                                active_wave_nodes.add(node)
                                continue
                            p0=pressures[owner]
                            assert p0["chart"]==key and p0["mode"]==m and p0["activeBody"]==fun["body"]
                            assert sum(orders)<=1
                            axis=slot_names[args[orders.index(1)]] if sum(orders) else "value"
                            pressure_slots.add((p0["part"],axis))
                            pressure_from[p0["part"],axis]=node
                            active_pressure_nodes.add(node)
                            used_pressure.setdefault(owner,{})[axis]=node
                        opposite="imaginary" if p=="real" else "real"
                        expect={(opposite,"value")} if m in (1,2) else set()
                        if m in (1,2):
                            expect |= {(p,x) for x in (("R","Y0","Y1"),(),("Z",))[j]}
                        assert pressure_slots==expect, (key,m,j,p,pressure_slots,expect)
                        if m in (1,2) and j==0:
                            coeff=lambda a:mod["coefficient"](E,root,pressure_from[p,a])
                            assert coeff("R")==E.scalar(1)
                            assert mod["equal"](full,expand(coeff("Y0")),expand(radial))
                            assert mod["equal"](full,expand(coeff("Y1")),expand(E.mul(radial,E.of(mod["VR"]))))
                            grouped_pressure_radial+=1
                        if m in (1,2) and j==2:
                            assert mod["coefficient"](E,root,pressure_from[p,"Z"])==E.of(mod["EPS"])
                            exact_pressure_axial+=1
                        counts[m]+=1
            assert set(actual)==set(meta), (key,len(actual),len(meta),set(meta)-set(actual))
            for owner,apps in sorted(used_pressure.items()):
                pr=pressures[owner]
                m=pr["mode"]
                p=pr["part"]
                other="imaginary" if p=="real" else "real"
                assert sorted(apps)==pr["fiveOriginalDerivativeSlots"]
                bd=pressure_body(v,defs,mod,defs[owner],sub[key,m],ttcuts[key,m]["normal"],other)
                normal_row=bd["sharedNormalRowProductFactors"]
                assert shared_normal_rows.setdefault(key,normal_row)==normal_row
                if m==2:
                    old=old_mode2[key,p]
                    assert [bd[x] for x in ("nativePressureBody","psi","normalSquared","carrierDenominator","sixTermNumerator")]==[
                           old[x] for x in ("actualModeTwoPressure","cutoff","normalSquared","carrierDenominator","numerator")]
                outputs.append({"chart":key,"harmonic":m,"part":p,"activeOwner":owner,"slots":apps,**bd})
        assert used==set(targets) and len(active_pressure_nodes)==200 and len(outputs)==40
        assert len(counts)==4 and set(counts.values())=={60}
        assert grouped_pressure_radial==exact_pressure_axial==40 and len(shared_normal_rows)==10
    finally:
        g.__exit__(None,None,None)
    return {"activeSource":inp["liveCensus"]["source"],"rawScalarRoutes":sum(counts.values()),
            "activeWaveOwners":len(tt),"exactActiveWaveApplications":len(active_wave_nodes),
            "activePressureOwners":len(pressures),"exactActivePressureApplications":len(active_pressure_nodes),
            "activePressureBodyAudits":outputs,
            "exactGroupedPolarPressureRadial":grouped_pressure_radial,
            "exactPolarPressureAxial":exact_pressure_axial}


def verify(a):
    d=load(a)
    wave,press,gauges,extra,sigma=collar_directions(d)
    gaussian=replay_gaussian_routes(a,d,wave,gauges,extra)
    native=active_callers(a,d)
    return {"schema":"MathScope.C137.OrdinaryRadialWavePressure/1",
            "status":"VERIFIED_ACTIVE_SOURCE_ROUTES_AND_CONDITIONAL_ORDINARY_GAUSSIAN_TRACES",
            "pins":PINS,"supportedOrdinaryWaveRZTL":sorted(wave),"supportedOrdinaryPressureRZTL":sorted(press),
            "conservativePhaseFreeGaugeRZTL":sorted(gauges),"sameNativeSigma":SIGMA,
            "sameCenteredPressureZ":PRESSURE_Z,"sameFixedSigmaEndpoints":ENDS,"sigmaRZTRows":sigma,
            "gaussianAdditionalGaugeReplay":gaussian,"native":native,
            "collarBound":{"finitePoleTimesZetaPower":GAUSS,"bothRegions":list(REGIONS),
                "scope":"Fixed label and epsilon; finite slow and transverse chart ranges, original admitted profiles and positive chart/frame collars, protected original Volterra and centered Fourier realization. Phase and radial Laurent derivatives can cost a fixed finite pole.",
                "originalMotivation":"Any finite Laurent factor is absorbed by the same half/full Gaussian on both original radial faces. For m=1 retain coherent Primary + Forced + Signed, and for m=2 only original Forced; signed target contributes zeta divided by one half Gaussian."},
            "pressureNativeFormula":"psi*i*(normalRow.t+n.f)/(m*k*norm(n)^2) with its native split; only the mode-one imaginary pressure has Primary and Signed addends.",
            "scope":"Ordinary N=0 non-TT wave and pressure portions of the protected radial-hull derivative. Includes the seed values. C135 authenticates the same wave owners through formal TT and N/TN are separate prior packets.",
            "open":"Full residual radial C1 needs the independent ordinary mean/higher-transverse cofactor receipts and the exact subtraction, TT and N-based pulse packets. No uniform epsilon or gate promotion is inferred here.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=ArgumentParser()
    for key in ("work","goal","out"):
        p.add_argument("--"+key,type=Path,required=True)
    a=p.parse_args()
    result=verify(a)
    a.out.write_bytes((json.dumps(result,indent=2,sort_keys=True)+"\n").encode())
    print(result["status"],len(result["supportedOrdinaryWaveRZTL"]),len(result["supportedOrdinaryPressureRZTL"]),
          len(result["conservativePhaseFreeGaugeRZTL"]),len(result["sigmaRZTRows"]))
