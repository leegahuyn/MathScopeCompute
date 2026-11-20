"""Read the original Signed curl and isolate the mixed time directions."""

from argparse import ArgumentParser
from fractions import Fraction as F
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys


PINS={
    "frontier":"c728ecb801c59bfdf3a60f5e79ca3b474616b80284464fbfe8f30419555ac6fc",
    "signed":"7e494388cecfb1cdfa8c22732491063135af4947ee9b667f37f0ce25d4604aec",
    "phase":"5fe1bb69eda9e5932ac57ba69814a51b26c1cfac4b4449937ead85e9e5ea19c0",
    "pureT":"c484371659b9b10fea0808449e4ae6dbade3782cb1d0a79852a81056b8aa4bdd",
    "c114Code":"0d4f2be79494851dd1e82d2c6587af40f3f1d39d5da53d1b3c204df06448178f",
    "c110Code":"351b5b6c6f4a3c3f9b75a8a79a946f03da612270d60955a1cc9a1b43760f5cb2",
    "pressure":"c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4",
}
CHI,XI,EPS,RADIAL,T,THETA=17733045,17733037,17732744,17735155,17732750,17732752
DIRS={0:"R",1:"Z",3:"xi"}


def pin(path,key):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==PINS[key],path
    return data


def attachment(g,n,c80,phase,frontier,exact,free):
    E=exact(g)
    epsilon,radial=E.of(EPS),E.of(RADIAL)
    half=E.scalar(F(1,2))
    by_chart={(r["chart"],r["component"],r["part"]):r for r in frontier["protectedTimeOperands"] if r["harmonic"]==1}
    @cache
    def true_free(i):
        if i>=0:
            return free(i)
        denominator=next(key for key,value in E.inverse_atoms.items() if value==i)
        return frozenset().union(*(true_free(k) for monomial,_ in denominator for k,power in monomial))

    definitions=[]
    for d in n.expressions:
        if not d["name"].startswith("GenericSignedAfterForced_"):
            continue
        expr=E.of(d["body"])
        assert all(dict(m)[CHI]==1 for m in expr)
        quotient={tuple((i,k) for i,k in m if i!=CHI):c for m,c in expr.items()}
        assert len(quotient)==len(expr) and E.mul(quotient,E.of(CHI))==expr
        rest=frozenset().union(*(true_free(i) for monomial in quotient for i,k in monomial))
        assert XI not in rest and g.node(d["parameters"][3])==g.node(XI)
        assert d["parameters"][2]==T and min(d["derivativeLimits"])>=2
        definitions.append({"name":d["name"],"id":d["id"],"body":d["body"],"monomials":len(quotient),
                            "coordinateSupportAfterRemovingOnlyChi":sorted(rest)})
    assert [r["monomials"] for r in definitions]==[120,408,232]*2
    _,left,right,before,_,after=g.args(CHI,"smooth_piecewise")
    assert g.rational(left)==F(1,4) and g.rational(right)==F(3,4) and before==1 and after==0
    assert T not in free(CHI) and T not in free(EPS) and T not in free(RADIAL)

    cases=[]
    for row,phase_row in zip(c80["cases"],phase["cases"],strict=True):
        key=row["key"]
        assert key==phase_row["key"] and phase_row["phase"]==row["phase"]
        assert row["localRadialFast"]==RADIAL==c80["actualOperands"]["localRadialFast"]
        assert row["epsilon"]==EPS==c80["actualOperands"]["epsilon"]
        phase_poly=E.of(row["phase"])
        winding={}
        for monomial,factor in phase_poly.items():
            powers=dict(monomial)
            if THETA in powers:
                assert powers[THETA]==1
                winding[tuple((i,k) for i,k in monomial if i!=THETA)]=factor
        winding_root,=[i for i in (17735984,17739402) if E.of(i)==winding]
        app_inventory={}
        for rec in row["nativeJetInventory"]:
            j=rec["component"]
            prototype=n.application(g,row["actualNativeSignedPotential"][j])
            definition,args,orders=n.application(g,rec["root"],zero_order=False)
            assert prototype[:2]==(definition,args) and orders==rec["orders"]
            assert T==args[2] and all(T not in free(i) for j,i in enumerate(args) if j!=2)
            if sum(orders)==1:
                d=orders.index(1)
                assert d in DIRS
                mixed=list(orders)
                mixed[2]=1
                app_inventory[j,d]={"originalNode":rec["root"],"definition":definition["id"],
                                    "actualArguments":args,"afterOrdinaryTOrders":mixed}
        def jet(j,d):
            return E.of(app_inventory[j,d]["originalNode"])
        Dr=lambda j:E.add(jet(j,0),E.mul(radial,jet(j,3)))
        Dz=lambda j:E.mul(epsilon,jet(j,1))
        R=g.args(row["actualNativeSignedPotential"][1],"m3_coupled_expression_partial")[1][0]
        potential_azimuth=E.of(row["actualNativeSignedPotential"][1])
        expected=(E.neg(Dz(1)),E.sub(Dz(0),Dr(2)),
                  E.add(Dr(1),E.mul(E.inv(E.of(R)),potential_azimuth)))
        for j,(z,pred) in enumerate(zip(row["actualVelocityCoefficients"],expected,strict=True)):
            assert E.of(z["imaginary"])==E.mul(half,pred)
        protected=[]
        for j,z in enumerate(row["actualVelocityCoefficients"]):
            for part in ("real","imaginary"):
                record=by_chart[key,j,part]
                raw=record["protectedBody"]
                signed=z[part]
                terms=g.args(raw,"add")
                assert len(terms)==2 and terms.count(signed)==1
                protected.append({"component":j,"part":part,"completeRepeatWave":raw,
                                  "exactSignedAddend":signed,"remainingWaveAddend":next(i for i in terms if i!=signed)})
        assert set(app_inventory)=={(1,1),(0,1),(2,0),(2,3),(1,0),(1,3)}
        cases.append({"chart":key,"phaseThetaCoefficient":winding_root,"actualSignedAddends":protected,
                      "ordinaryMixedRequests":[{"potentialComponent":j,"direction":DIRS[d],**entry}
                                               for (j,d),entry in sorted(app_inventory.items())]})
    assert len(cases)==10
    return definitions,cases


def radial_chart(g,exact,free):
    E=exact(g)
    physical_R,dr,root_Q,shape,dshape=17734051,17734049,17734050,17734062,17735154
    assert g.args(root_Q,"sqrt_positive")==[17732740] and g.args(physical_R,"multiply")==[17732748,root_Q]
    assert g.args(17734060,"log_positive")==[physical_R]
    assert g.args(17734061,"multiply")==[dr,17734060] and g.args(shape,"exp")==[17734061]
    assert E.of(dshape)==E.mul(E.of(shape),E.of(dr),E.of(root_Q),E.inv(E.of(physical_R)))
    assert g.args(17734058,"multiply")==[17733022,17734042]
    assert g.args(17745443,"multiply")==[17734042,17745442]
    assert g.args(17734042,"log_positive")==[17734041]
    observed=[]
    for label,index,factor,primitive,a in (
        ("local Signed",17733022,17734059,17734063,RADIAL),
        ("common pressure",17745442,17745444,17745445,17745446),
    ):
        [log_factor]=g.args(factor,"exp")
        assert sorted(g.args(log_factor,"multiply"))==sorted([17734042,index])
        assert E.of(primitive)==E.mul(E.of(factor),E.of(shape))
        assert E.of(a)==E.mul(E.of(factor),E.of(dshape))
        assert sorted(free(primitive))==sorted(free(a))==[17732737,17732748]
        observed.append({"chart":label,"frozenIndex":index,"radialPrimitive":primitive,
                         "radialFast":a,"freeCoordinates":sorted(free(a))})
    return {"physicalR":physical_R,"dr":dr,"commonRadialShape":shape,
            "commonRadialShapePartialR":dshape,"localAndCommonReference":observed,
            "sourcePressureModuleSHA256":PINS["pressure"],"ordinaryCommutatorTR":"ZERO_ON_FIXED_NATIVE_LABEL"}


def control():
    # Exact rational representative normal; the symbolic formula uses
    # n_theta != 0 and works for any original admitted local normal.
    normal=(2,3,5)
    for vector in ((0,-normal[2],normal[1]),(normal[1],-normal[0],0)):
        assert sum(i*j for i,j in zip(normal,vector,strict=True))==0
    r=(0,-normal[1],-normal[2])
    z=(normal[0],normal[1],0)
    assert r[1] and z[1]
    return {"tangentRadialPerturbation":"(R-R0)(T-T0)*(n_theta e_z-n_z e_theta)",
            "tangentAxialPerturbation":"(Z-Z0)(T-T0)*(n_theta e_r-n_r e_theta)",
            "twiceImaginaryCurlTimeValues":["(0,-n_theta,-n_z)","epsilon*(n_r,n_theta,0)"],
            "vanishingLowerJetData":"C, C_T and first spatial derivatives are zero at the selected point. The other ordinary mixed direction and the tangential-fast mixed derivative are zero.",
            "actualSourceCounterexample":False}


def main():
    cli=ArgumentParser(description=__doc__)
    for arg in ("work","goal","out"):
        cli.add_argument("--"+arg,type=Path,required=True)
    args=cli.parse_args()
    c110=args.work/"continuation110/active-j2-full-source"
    c114=args.work/"continuation114/j2-radial-joint"
    pin(c110/"verify_predecessor_cutoff_tails.py","c110Code")
    pin(c114/"verify_radial_time_frontier.py","c114Code")
    scope=args.goal/"primary-forced-join/active-n3-c5-binding"
    reader,cache_reader,exact=scope/"spatial-readback",scope/"live-wave-gauge/signed",args.goal/"first-force-repair"
    sys.path[:0]=[str(c110),str(c114),str(reader),str(cache_reader),str(exact)]
    from verify_predecessor_cutoff_tails import PINS as OLD, pinned
    pinned(reader/"source_stream.py","reader")
    pinned(cache_reader/"source_cache.py","cacheReader")
    pinned(exact/"verify_repaired_first_force.py","exactAlgebra")
    import source_stream as st
    from source_cache import load
    from verify_repaired_first_force import Exact
    from verify_radial_time_frontier import free_coordinates
    c80=args.work/"continuation80/signed-wave/final"
    signed=json.loads(pin(c80/"signed-local-curl.json","signed"))
    phase=json.loads(pin(c80/"signed-phase-gradient.json","phase"))
    frontier=json.loads(pin(c114/"radial-time-frontier.json","frontier"))
    pure=json.loads(pin(args.work/"continuation118/pure-sigma-time-join/signed-pure-time-gauge.json","pureT"))
    assert pure["pureTimeGauge"]["gaussian"]=="sqrt(zeta)" and pure["originalSigma"]==[22001223,22001224]
    archive=args.work/"continuation70/hosted-44582875351/first-correction-spatial-source"
    pressure=pin(archive.parent/"pr30-runtime-overlays"/f"{PINS['pressure']}.mjs","pressure")
    assert b"physicalR=G.mul(G.sqrt(band.geometry.Q),R),radialPrimitive=G.mul(power(Lambda,baseIndex),power(physicalR,dr))" in pressure
    assert b"radialFast=G.derivative(radialPrimitive,R)" in pressure
    mf=json.loads(pinned(archive/st.MANIFEST,"manifest"))
    native=st.Native(archive,mf)
    assert frontier["source"]["sha256"]==phase["sourceStreamSHA256"]==mf["node_stream_sha256"]
    assert native.pin==OLD["registry"]==frontier["source"]["registrySHA256"]
    g=load(st,archive,mf,22153782,args.work/"continuation80/signed-wave/cache")
    def node(i):
        row=g.record(i)
        return row["op"],row["args"]
    g.node=node
    try:
        free=free_coordinates(g)
        radial=radial_chart(g,Exact,free)
        definitions,cases=attachment(g,native,signed,phase,frontier,Exact,free)
    finally:
        g.__exit__(None,None,None)
    result={"schema":"MathScope.C119.ActiveSignedCurlMixedTimeReduction/1",
            "status":"VERIFIED_PROTECTED_SIGNED_CURL_AND_TRANSVERSE_REDUCTION_ORDINARY_MIXED_OPEN",
            "sourceStreamSHA256":mf["node_stream_sha256"],"registrySHA256":native.pin,"pins":PINS,
            "originalRadialChart":radial,
            "purePhaseFreeSignedTimeBound":pure["pureTimeGauge"],"originalDefinitions":definitions,"cases":cases,
            "curlTimeImaginary":["-epsilon*Z_T(C_theta)/2",
                     "(epsilon*Z_T(C_r)-R_T(C_z)-radialFast*xi_T(C_z))/2",
                     "(R_T(C_theta)+radialFast*xi_T(C_theta)+C_theta_T/R)/2"],
            "transverseReduction":"Each C=chi(xi)*B with no xi remaining in B, including compound denominators. Hence ∂xi∂T C=chi'(xi)*B_T. The same C118 core or an admitted fixed-chart xi=0 section pays B_T without pointwise division by chi.",
            "ordinaryMixedControl":control(),
            "open":"Same-body mixed R,T and Z,T donor bounds on original Sigma and physical gauge; exact active appended -epsilon*T use remains to be read. No numerical actual mixed trace inferred.",
            "finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print(result["status"],len(definitions),len(cases))


if __name__=="__main__":
    assert __debug__
    main()
