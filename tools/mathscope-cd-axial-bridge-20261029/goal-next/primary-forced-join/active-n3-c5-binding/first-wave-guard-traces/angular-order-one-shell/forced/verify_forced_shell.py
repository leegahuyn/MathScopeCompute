"""Bind the actual first Forced shell input classes and the C84 spatial derivative lower set."""
from argparse import ArgumentParser
from collections import Counter, defaultdict
from fractions import Fraction
from functools import cache
from hashlib import sha256
from itertools import product
from pathlib import Path
import json
import sys

PINS = {
    "first": "6bf1e8c538e67bec6ea52e5960fd5cb23a556442d413d120025c49f30f117c27",
    "manifest": "8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a",
    "registry": "e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03",
    "wave": "40eca0227cc0f9d541dc868fb4fc8cc1734eb63dbad54ea2631748c19c3d5c9b",
    "covariance": "87ee4c05499ed8cdc1b22c490eb9eebb26375e04063559245ead711eaf8be970",
    "gaussian": "16906cc8b40c719d9c2de416490499c632df9a59376378b313831ef93868144e",
    "sourceForced": "1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3",
    "sourceInitialized": "4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e",
    "sourcePulse": "866d8ec69758b9f036b73e6e8f04fb88cfb248e7a01d32e7b048df535c1020f9",
    "sourceCurl": "3764b705d26c3333578db9fbc15004779d825026d2a487d3809320fd41cb62bd",
    "sourceHarmonic": "339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20",
    "sourceCache": "909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f",
    "reader": "6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48",
    "streamCode": "2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb",
    "exactCode": "260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75",
}
STREAM = "faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
R, Z, T, Y0, Y1, VR1, RADIAL = 17732748, 17732749, 17732750, 17745430, 17745431, 17733068, 17732770
SQRT2, LENGTH, R0 = 3622, 17733029, 14220486
PARTS = ("real", "imaginary")


class NodeView:
    def __init__(self, graph):
        self.graph = graph

    def node(self, index):
        rec = self.graph.record(index)
        return rec["op"], rec["args"]


def scalar_roles(name, template):
    if name.startswith(f"InitializedOriginalWave_{template}_"):
        return "u"
    if name.startswith(f"InitializedOriginalPrimaryPressure_{template}_"):
        return "p"
    if name.startswith(f"OriginalPrimaryPrincipalFlat_{template}_"):
        return "tail"
    if name.startswith("ActualInitializedMeanVelocity_"):
        return "mean"
    raise AssertionError(("unexpected coupled field in initialized forcing", name))


def bind(graph, exact, registry, source_rows, wave):
    defs, _, _, pulses, _ = json.loads(registry["definitions"])
    by_id = {d["id"]: d for d in defs}
    by_name = {d["name"]: d for d in defs}
    wrappers = {(d["name"], d["body"], tuple(d["parameters"])): d
                for d in defs if d["name"].startswith("CoupledForced_source_")}
    active = {(c["key"], c["mode"]): c for c in wave["cases"]}
    assert len(source_rows) == len(active) == len(pulses) == 20
    assert [by_name[f"ActualInitializedMeanVelocity_{j}"]["body"] for j in range(3)] == [21435335,21435336,21435337]
    summary, cases, control = Counter(), [], None
    e = exact(NodeView(graph))

    def check_equal(left, right):
        delta = e.sub(left,right)
        assert not e.reduce_sqrt_two(delta,SQRT2) or not e.reduce_sqrt_two(e.clear_compound_denominators(delta),SQRT2)

    def partial_affine(polynomial, slot):
        terms = []
        for key, factor in polynomial.items():
            powers = dict(key)
            gain = powers.pop(slot, 0)
            assert gain in (0, 1)
            if gain:
                terms.append({tuple(sorted(powers.items())): factor})
        return e.add(*terms)

    def derivative_L(polynomial):
        return e.add(partial_affine(polynomial, Y0), e.mul(e.of(VR1), partial_affine(polynomial, Y1)))

    @cache
    def direct_roles(root, template):
        op, args = NodeView(graph).node(root)
        if op == "m3_coupled_expression_partial":
            return frozenset([scalar_roles(by_id[args[0]]["name"], template)])
        if op in ("add", "multiply"):
            return frozenset().union(*(direct_roles(j, template) for j in args))
        if op == "integer_power":
            return direct_roles(args[0], template)
        return frozenset()

    def expansion(template):
        @cache
        def expand(root):
            op, args = NodeView(graph).node(root)
            if op == "rational":
                return e.scalar(Fraction(*map(int, args)))
            if not direct_roles(root, template) or op == "m3_coupled_expression_partial":
                return {((root, 1),): Fraction(1)}
            if op == "add":
                return e.add(*(expand(j) for j in args))
            if op == "multiply":
                return e.mul(*(expand(j) for j in args))
            assert op == "integer_power" and args[1] >= 0
            return e.pow(expand(args[0]), args[1])
        return expand

    for row in source_rows:
        key, m = row["key"], row["harmonic"]
        delta, sign = map(int, key.split(":"))
        template = f"{delta}_{sign}"
        case = active[key, m]
        native = pulses[case["system"]]
        assert native["id"] == row["system"]
        assert row["sourcePulseSystem"] == int(sign == -1)
        assert native["forcing"] == row["projected"]
        assert native["directions"] == [R,Z,T,Y0,Y1] and native["directionParameterIndices"] == list(range(5))
        assert native["left"] == 0 and native["length"] == LENGTH
        assert native["initial"] == [{"real": 0, "imaginary": 0}]*3
        assert native["finitePartialSumIsExactSolution"] is False
        assert native["homogeneousPulseSubstitutedForForcedSolution"] is False
        w, v, xi = native["variable"], case["pulse"], case["guards"][-2][0]
        h = row["H_w"]
        ci = e.mul(e.scalar(2), e.of(R0), e.inv(e.of(LENGTH)))
        tg = e.add(e.scalar(4), e.of(SQRT2))
        shift = e.mul(ci, e.pow(tg, -delta), e.sub(e.of(w), e.of(v)))
        for j, axis in enumerate((Y0,Y1)):
            direction = e.neg(e.of(VR1)) if j == 0 else e.one
            check_equal(e.of(h[j]), e.add(e.of(axis), e.mul(shift, direction)))
            check_equal(partial_affine(e.of(h[j]), R), e.zero)
            check_equal(partial_affine(e.of(h[j]), Z), e.zero)
        image = {axis: e.of(x) for axis, x in zip((Y0,Y1),h,strict=True)}
        check_equal(e.affine_at(e.of(xi),image),e.of(xi))
        check_equal(e.affine_at(e.of(v),image),e.of(w))
        for r in (xi,v):
            check_equal(partial_affine(e.of(r),R),e.zero)
            check_equal(partial_affine(e.of(r),Z),e.zero)
        check_equal(derivative_L(e.of(v)),e.zero)
        for j,axis in enumerate((Y0,Y1)):
            check_equal(derivative_L(e.of(h[j])),derivative_L(e.of(axis)))

        expand = expansion(template)
        classification, wrapped = Counter(), {part: {} for part in PARTS}
        leaf_orders = defaultdict(set)
        for j in range(3):
            for part in PARTS:
                supported = row["supported"][j][part]
                raw = row["raw"][j][part]
                principal = 0 if m == 2 else row["principal"][j][part]
                assert expand(supported) == e.sub(expand(raw),expand(principal)), (key,m,j,part)
                for monomial in expand(supported):
                    role_list = []
                    for atom, power in monomial:
                        op, args = NodeView(graph).node(atom)
                        if op != "m3_coupled_expression_partial":
                            continue
                        role = scalar_roles(by_id[args[0]]["name"],template)
                        role_list.extend([role]*power)
                        leaf_orders[role].add(sum(args[2]))
                    cls = "+".join(sorted(role_list))
                    assert cls in ({"u","p","tail","mean+u"} if m == 1 else {"u+u"}), (key,m,j,part,cls)
                    classification[cls] += 1
                definition = by_name[f"ActualWholeNonzeroSource_{key}_{m}_{j}_{part}"]
                assert definition["body"] == supported
                mapped = row["originalSource"][j][part]
                exact_args = [h[0] if x == Y0 else h[1] if x == Y1 else x for x in definition["parameters"]]
                assert graph.args(mapped,"m3_coupled_expression_partial") == [
                    definition["id"],exact_args,[0]*len(exact_args)]
                wrap = wrappers[f"CoupledForced_source_{j}_{part}",mapped,tuple([w,*native["parameters"]])]
                wrapped[part][wrap["id"]] = (j,wrap["parameters"])
                endpoint = case["nativeZeroOrderPulse"][part][j]
                assert graph.args(endpoint,"m3_forced_pulse_partial") == [native["id"],part,j,v,native["parameters"],[0]*5]

        def wrapper_polynomial(i, wanted):
            def has_wrapper(atom):
                op,args = NodeView(graph).node(atom)
                if op == "m3_coupled_expression_partial":
                    return args[0] in wanted
                if op in ("add","multiply"):
                    return any(has_wrapper(n) for n in args)
                return False

            @cache
            def expand_mapped(root):
                op,args = NodeView(graph).node(root)
                if op == "m3_coupled_expression_partial" and args[0] in wanted:
                    j, params = wanted[args[0]]
                    assert args[1:] == [params,[0]*len(params)]
                    return {((j,1),):Fraction(1)}
                if op == "rational":
                    return e.scalar(Fraction(*map(int,args)))
                if not has_wrapper(root):
                    return {((root,1),):Fraction(1)}
                assert op in ("add","multiply")
                return (e.add if op == "add" else e.mul)(*(expand_mapped(x) for x in args))
            return expand_mapped(i)

        for part in PARTS:
            for z in row["projected"]:
                pol = wrapper_polynomial(z[part],wrapped[part])
                assert all(sum(n for atom,n in term if atom in range(3)) == 1 for term in pol)
                assert {atom for term in pol for atom,n in term if atom in range(3)} == {0,1,2}
        expected = {"u","p","tail","mean+u"} if m == 1 else {"u+u"}
        assert set(classification) == expected
        assert leaf_orders["u"] == ({0,1,2} if m == 1 else {0,1})
        if m == 1:
            assert leaf_orders["p"] == {0,1} and leaf_orders["tail"] == {0} and leaf_orders["mean"] == {0,1}
            if key == "0:1":
                atom, eps = 21441797, 17732744
                seed,_,orders = graph.args(atom,"m3_coupled_expression_partial")
                assert by_id[seed]["name"]=="InitializedOriginalWave_0_1_0_real"
                assert by_id[seed]["parameters"][2]==Z and orders[2]==sum(orders)==2
                for part in PARTS:
                    for j in range(3):
                        terms = {term:q for term,q in expand(row["supported"][j][part]).items()
                                 if any(a==atom for a,_ in term)}
                        assert terms == ({((eps,3),(atom,1)):Fraction(-1)} if (part,j)==("real",0) else {})
                projected = row["projected"][0]["real"]
                pol = wrapper_polynomial(projected,wrapped["real"])
                own = {term:q for term,q in pol.items() if any(a==0 for a,_ in term)}
                assert own=={((0,1),(21661925,1)):Fraction(-1)}
                assert graph.args(21661925,"add")==[1,21661924]
                assert graph.rational(1)==1 and graph.rational(20)==-1
                assert graph.args(21661924,"multiply")==[20,21661923]
                assert graph.args(21661923,"multiply")==[21661914,21661922]
                assert graph.args(21661922,"inverse")==[21661917]
                def flatten_add(i):
                    op,args = NodeView(graph).node(i)
                    return [u for j in args for u in flatten_add(j)] if op == "add" else [i]

                squares = flatten_add(21661917)
                assert len(squares)==3 and 21661914 in squares
                squares=[21661914,*[j for j in squares if j!=21661914]]
                normals=[]
                for i in squares:
                    a,b=graph.args(i,"multiply")
                    assert a==b
                    normals.append(a)
                assert len(set(normals))==3
                control = {"row":key,"component":0,"part":"real","raw":row["raw"][0]["real"],
                           "actualAfterTailSubtraction":row["supported"][0]["real"],
                           "atom":atom,"native":by_id[seed]["name"],"derivative":orders,
                           "sourceDiffusionFactor":"-epsilon^3","projected":projected,
                           "normalComponents":normals,"normalSquared":21661917,
                           "radialProjectionDiagonal":21661925,"epsilon":eps,
                           "projectedDiffusionFactor":"epsilon^3 (n_theta^2+n_z^2)/|n|^2",
                           "nonvanishingPremise":"Admitted original nonzero angular normal and positive epsilon.",
                           "scope":"The independent formal source jet survives exact projection. This does not exclude cancellation with other analytically related jets on the specific field."}
        summary.update({f"m{m}:{k}":n for k,n in classification.items()})
        cases.append({"key":key,"mode":m,"system":native["id"],"whole":row["supported"],
                      "projected":row["projected"],"matrix":native["matrix"],"pulseEndpoint":v,
                      "fixedPath":h,"classes":dict(sorted(classification.items())),
                      "sourceDerivativeTotals":{k:sorted(a) for k,a in sorted(leaf_orders.items())}})

    assert control is not None
    return {"cases":cases,"sparseTermCounts":dict(sorted(summary.items())),
            "linearRawSourceControl":control,"projectedComponents":len(cases)*3*2}


def jet_premise():
    R = (1,0,0)
    Z = (0,1,0)
    L = (0,0,1)
    ZERO = (0,0,0)

    def add(u,v):
        return tuple(x+y for x,y in zip(u,v,strict=True))

    def down(order):
        return set(product(*(range(x+1) for x in order)))

    orders = [[ZERO,R,Z,add(Z,Z)], [ZERO,R,Z], [ZERO,R,Z,add(Z,Z)]]
    curl = [{1:[Z]}, {0:[Z],2:[R,L]}, {1:[R,L,ZERO]}]
    potential = [set() for _ in orders]
    for j, rows in enumerate(orders):
        for beta in rows:
            for coefficient, ops in curl[j].items():
                for gamma in ops:
                    potential[coefficient].update(down(add(beta,gamma)))
    for row in orders:
        for beta in row:
            for needed in potential:
                needed.update(down(beta))
    lower = set.union(*potential)
    assert lower=={(0,0,0),(1,0,0),(0,1,0),(0,0,1),(2,0,0),(1,1,0),(1,0,1),
                   (0,2,0),(0,1,1),(1,2,0),(0,3,0),(0,2,1)}
    assert sum(len(x) for x in orders)*3*10 == 330
    return {"directions":["partial_R","partial_Z","L=partial_Y0+vr1*partial_Y1"],
            "downwardClosedOrdersByPotential": [sorted(x) for x in potential],
            "commonOrders":sorted(lower),"covarianceCoefficientRoles":330,
            "projectedRhsDerivativeRows":len(lower)*20*3,
            "maximumNativeVariationalOrder":3,
            "sourceMaxInputOrders":{"mode1Velocity":5,"mode1Pressure":4,"mode1FlatTail":3,"mode1WholeMean":4,"mode2Velocity":4},
            "logic":"D_R,D_Z,L commute with H_w and w=v(Y) on the original fixed lift. Dr and Dz retain their actual coefficients. No pure pulse-time, T or second L derivative enters these spatial covariance requests."}


def main():
    if not __debug__:
        raise RuntimeError("run with Python assertions enabled")
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--goal",type=Path,required=True)
    parser.add_argument("--runtime",type=Path,required=True)
    parser.add_argument("--artifact",type=Path,required=True)
    parser.add_argument("--cache",type=Path,required=True)
    parser.add_argument("--out",type=Path,required=True)
    args = parser.parse_args()
    active = args.goal/"primary-forced-join/active-n3-c5-binding"
    original = args.runtime/"research-ide/mathscope-m3/navier"
    weighted = active/"first-wave-guard-traces/weighted-haar-shell"
    hosted = args.artifact/"first-correction-spatial-source"
    paths = {
        "first": args.artifact/"same-family-mode-two.json",
        "manifest": hosted/"original-source-export-manifest.json",
        "registry": hosted/"original-source-functions.json",
        "wave": active/"live-wave-gauge/forced/forced-wave.json",
        "covariance": weighted/"covariance/covariance-shell.json",
        "gaussian": weighted/"gaussian/gaussian-shell.json",
        "sourceForced": original/"source-global-forced-current.mjs",
        "sourceInitialized": original/"source-initialized-angular.mjs",
        "sourcePulse": original/"source-forced-pulse.mjs",
        "sourceCurl": original/"source-mapped-forced-curl.mjs",
        "sourceHarmonic": original/"source-harmonic-assembly.mjs",
        "sourceCache": active/"live-wave-gauge/signed/source_cache.py",
        "reader": active/"spatial-readback/verify_spatial_artifact.py",
        "streamCode": active/"spatial-readback/source_stream.py",
        "exactCode": args.goal/"first-force-repair/verify_repaired_first_force.py",
    }
    raw={name:path.read_bytes() for name,path in paths.items()}
    for name in ("sourceCache","reader","streamCode","exactCode"):
        raw[name]=raw[name].replace(b'\r\n',b'\n')
    for name,data in raw.items():
        assert sha256(data).hexdigest()==PINS[name],name
    tokens = {
        "sourceForced":["forcing=pullback.map", "length:old.sourcePulseLength,n:normal,K,k,epsilon,forcing,m"],
        "sourceInitialized":["nonzeroAngularForcing=subtractVectorRows(G,waveResidual,primaryFlatResidual)",
                             "G.mul(G.q(1,2),dpsi,x)", "velocity:normalizedMeanVelocity.map"],
        "sourcePulse":["projectedRaw=projection.map(row=>cscale(G,G.q(-1),cdot(G,row,forcing)))",
                       "G.mul(G.q(m*m),damping)", "const indices=forcedDownwardMultiIndices(orders)"],
        "sourceCurl":["[G.neg(Dz[1]),G.sub(Dz[0],Dr[2]),G.add(Dr[1],G.div(X[1],R))]",
                      "simultaneousSubstitute(x,[w],[pulseValue])"],
        "sourceHarmonic":["Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))", "Dz=x=>G.mul(epsilon,G.derivative(x,Z))"],
    }
    for name, fragments in tokens.items():
        assert all(x.encode() in raw[name] for x in fragments),name
    manifest, registry, wave, first = (json.loads(raw[k]) for k in ("manifest","registry","wave","first"))
    assert manifest["node_stream_sha256"]==wave["inputSHA256"]["stream"]==STREAM
    sys.path[:0]=[str(paths[k].parent) for k in ("sourceCache","reader","exactCode")]
    import source_cache
    import verify_spatial_artifact
    from verify_repaired_first_force import Exact
    g = source_cache.load(verify_spatial_artifact,hosted,manifest,22153782,args.cache)
    try:
        evidence = bind(g, Exact, registry, first["full"]["rows"], wave)
    finally:
        g.__exit__(None,None,None)
    receipt={"status":"VERIFIED_ACTUAL_FIRST_FORCED_SOURCE_SPLIT_CONDITIONAL_SHELL_JETS","sourceStream":g.verify,
             "pins":PINS,**evidence,"jetPremise":jet_premise(),
             "weights":{"m1":"Primary linear/pressure/tail and whole mean cross terms require their own weighted envelope. A half-Gaussian Primary estimate alone only supplies sqrt(zeta) with poles.",
                        "m2":"Pure Primary self-quadratic gives a zeta times pole envelope from two half-Gaussian factors.",
                        "transfer":"The original slow shell is fixed along H_w at fixed R,Z,T. Propagate the supplied weight through the exact zero-data block, then the mapped curl, with explicit finite coefficient poles retained.",
                        "covariance":"A zeta envelope with no residual poles follows if each cross factor has exponent >=1/2 and either their sum is >1 or the exact product estimate removes all poles. Two half-Gaussians with poles give zeta times poles."},
             "open":["Actual uniform weighted native projected forcing and matrix derivative bounds for all templates",
                     "Any extra Gaussian reserve or pole cancellation on the complete m1 original projected source",
                     "Complete covariance, pressure, Signed shell and final endpoint estimates"],
             "finalJets":0,"release":"HOLD"}
    with args.out.open("x",encoding="utf8",newline="\n") as out:
        json.dump(receipt,out,indent=2)
        out.write("\n")
    print(receipt["status"])


if __name__ == "__main__":
    main()
