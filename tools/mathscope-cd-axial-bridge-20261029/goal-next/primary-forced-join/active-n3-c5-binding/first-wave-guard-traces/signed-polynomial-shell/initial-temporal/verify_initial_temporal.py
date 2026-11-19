"""Read back the actual pre-Forced centered Temporal source and shifted pressure."""
from argparse import ArgumentParser
from functools import cache
from hashlib import sha256
from pathlib import Path
import json
import sys

R,Z,T,ELL,Y0,Y1=17732748,17732749,17732750,17732737,17745430,17745431
EPS,VR1,INVR,PHI,A=17732744,17733068,17733137,17745445,17745446
LABELS=[R,Z,T,ELL,Y0,Y1]
LO,HI=17743711,17743713
PINS={
    "registry":"e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03",
    "manifest":"8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a",
    "cache":"909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f",
    "reader":"6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48",
    "streamCode":"2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb",
    "globalPressure":"c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4",
    "pressure":"fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f",
    "potential":"c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8",
    "temporal":"16c13ea7a6ba49f78514e1c2a94e29499086e3b11c463e07f6513b8e31f32f1b",
    "fourier":"59e1d8f7fd72b880de030a2a56bee9be65b5e02203cffa73157ce8dae420ad2e",
    "meanShell":"168d59a2b935ca6b21da8e830c02a10f172231349d8d9a89cc6d38e73762a90f",
}
STREAM="faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"


def bind(g,registry):
    aux=json.loads(registry["base"]["inverseDefinitions"])
    fields=json.loads(registry["base"]["fieldDefinitions"])
    names=dict(enumerate(("rr","rtheta","rz","thetatheta","thetaz","zz")))
    for native,name in names.items():
        assert fields[native]["name"]=="GlobalCompleteCommonTorus_"+name
        assert fields[native]["parameters"]==LABELS and len(fields[native]["rows"])==162
    assert g.rational(0)==0 and g.rational(1)==1 and g.rational(20)==-1

    @cache
    def shape(i,renaming=()):
        names_at=dict(renaming)
        if i in names_at:
            return ("coordinate",names_at[i])
        if i<ELL:
            return ("pre_common_torus",i)
        op,a=(g.record(i)[name] for name in ("op","args"))
        if op=="coordinate":
            return (op,i)
        if op in ("rational","source_parameter"):
            return (op,tuple(a))
        if op in ("add","multiply","maximum","minimum"):
            return (op,tuple(sorted((shape(j,renaming) for j in a), key=repr)))
        if op in ("exp","log_positive","sqrt_positive","inverse","ceiling","sine","cosine"):
            return (op,shape(a[0],renaming))
        if op in ("integer_power","source_step_derivative"):
            return (op,shape(a[0],renaming),a[1])
        if op=="smooth_piecewise":
            return (op,tuple(shape(j,renaming) for j in a))
        if op=="definite_integral":
            body,x,l,r=a
            bound=tuple(sorted({**names_at,x:"binder"+str(len(renaming))}.items()))
            return (op,shape(body,bound),shape(l,renaming),shape(r,renaming))
        if op in ("actual_monotone_root","actual_monotone_root_partial"):
            return (op,a[0],shape(a[1],renaming),shape(a[2],renaming),tuple(a[3:]))
        if op in ("m3_aux_indexed_partial","m3_aux_expression_partial","actual_expression_partial","m3_global_indexed_partial"):
            return (op,a[0],tuple(shape(j,renaming) for j in a[1]),tuple(a[2]) if len(a)==3 else ())
        raise AssertionError((i,op,a))

    def product(i,terms):
        assert sorted(g.args(i,"multiply"))==sorted(terms)

    def sum_of(i,terms):
        assert sorted(g.args(i,"add"))==sorted(terms)

    def typed(i,field,orders,arguments=LABELS):
        assert g.args(i,"m3_aux_indexed_partial")==[field,arguments,orders]

    def check_stress_independent(root):
        seen=set()

        pending=[root]
        older_prefix=set()
        while pending:
            i=pending.pop()
            if i in seen:
                continue
            seen.add(i)
            assert i not in (Y0,Y1)
            # Source parameters and imported profile bodies precede construction
            # of the two actual common-torus coordinates in this live namespace.
            if i<ELL:
                older_prefix.add(i)
                continue
            op,a=(g.record(i)[name] for name in ("op","args"))
            if op in ("rational","source_parameter","coordinate"):
                continue
            if op in ("add","multiply","maximum","minimum","smooth_piecewise","definite_integral"):
                children=a
            elif op in ("inverse","sqrt_positive","exp","log_positive","ceiling","sine","cosine",
                        "integer_power","source_step_derivative"):
                children=a[:1]
            elif op in ("actual_expression_partial","actual_monotone_root","actual_monotone_root_partial"):
                children=a[1] if isinstance(a[1],list) else a[1:]
            else:
                raise AssertionError((i,op,a))
            assert all(u<i for u in children),(i,op,a)
            pending.extend(children)
        return {"walked":len(seen)-len(older_prefix),"preCommonTorusOperandCount":len(older_prefix)}

    centered=[]
    for j,(component,raw,stress,rest,inner,outer,negative,centered_root,coordinates) in enumerate((
        ("theta",17754253,17744077,17754252,19561019,19561020,19561025,19561026,[19560955,19560956]),
        ("z",17754268,17744195,17754267,19563358,19563359,19563364,19563365,[19563094,19563095]),
    )):
        d=aux[j]
        assert d["name"]=="GlobalActualTemporal_"+component and d["body"]==raw
        assert d["Y"]==[Y0,Y1] and d["parameters"]==LABELS
        assert d["directions"]==[R,Z,T,Y0,Y1] and d["directionParameterIndices"]==[0,1,2,4,5]
        assert d["zeroMode"]=="The exact normalized Haar mean is projected out."
        assert d["operator"]=="(sqrt(2)-1)*partial_y0+partial_y1"
        assert d["finiteSumDeclaredEqualToLimit"] is False
        sum_of(raw,[stress,rest])
        outer_body,b0,lo,hi=g.args(outer,"definite_integral")
        haar_body,b1,inlo,inhi=g.args(inner,"definite_integral")
        assert (outer_body,b0,b1,lo,hi,inlo,inhi)==(inner,*coordinates,0,1,0,1)
        assert all(g.record(a)["op"]=="coordinate" for a in coordinates)
        shifted_stress,other=g.args(haar_body,"add")
        assert shifted_stress==stress
        renaming=tuple(zip((Y0,Y1),coordinates,strict=True))
        bound_shape=shape(other,tuple((x,x) for x in coordinates))
        assert shape(rest,renaming)==bound_shape, (component,"differed after alpha-renaming")
        swapped=tuple(zip((Y0,Y1),reversed(coordinates),strict=True))
        assert shape(rest,swapped)!=bound_shape
        product(negative,[20,outer])
        sum_of(centered_root,[raw,negative])
        centered.append({"component":component,"operatorBody":raw,"actualZeroModeSubtraction":centered_root,
                         "originalHaar":[inner,outer],"boundHaarCoordinates":coordinates,
                         "negativeStressArm":stress,"stressFreeOfYNodesVisited":check_stress_independent(stress),
                         "unaveragedNonstressArm":rest,"alphaRenamedNonstressArm":other})

    def bind_direct(radial_field,axial_field,w,radials,stored):
        rr,y0,y1,beta,axial=radials
        for i,orders in ((rr,[1,0,0,0,0]),(y0,[0,0,0,1,0]),(y1,[0,0,0,0,1]),
                         (beta,[0,0,0,0,0])):
            typed(i,radial_field,orders)
        typed(axial,axial_field,[0,1,0,0,0])
        lscale,ladd,ascale,combined,metric,actual_flux,axial_scaled=stored
        product(lscale,[VR1,y1])
        sum_of(ladd,[y0,lscale])
        product(ascale,[A,ladd])
        sum_of(combined,[rr,ascale])
        if w==2:
            pair=[j for j in g.args(metric,"multiply") if j!=INVR][0]
            product(pair,[24,beta])
            assert g.rational(24)==2
            product(metric,[INVR,pair])
        else:
            product(metric,[INVR,beta])
        sum_of(actual_flux,[combined,metric])
        product(axial_scaled,[EPS,axial])

    bind_direct(1,4,2,[17754240,17754241,17754242,17753399,17754250],
                [17754243,17754244,17754245,17754246,17754248,17754249,17754251])
    bind_direct(2,5,1,[17754254,17754255,17754256,17753400,17754263],
                [17754257,17754258,17754259,17754260,17754261,17754262,17754264])
    sum_of(17754252,[17754249,17754251])
    sum_of(17754266,[17754262,17754264])
    product(17754265,[EPS,17754234])
    sum_of(17754267,[17754265,17754266])

    def head_leaves(i):
        op,a=(g.record(i)[name] for name in ("op","args"))
        if op in ("add","multiply"):
            for j in a:
                yield from head_leaves(j)
        else:
            yield i

    def verify_shift(bound,at_r,shift,y0,y1,scale):
        assert g.record(bound)["op"]=="coordinate"
        sum_of(shift,[17753501,at_r])
        product(17753501,[20,PHI])
        sum_of(y0,[Y0,shift])
        sum_of(y1,[Y1,scale])
        product(scale,[VR1,shift])
        assert shape(PHI,((R,bound),))==shape(at_r)
        for d in (Z,T,Y0,Y1):
            assert shape(shift,((d,"forbidden"),))==shape(shift)
        assert shape(shift,((R,"expected_R"),))!=shape(shift)
        assert shape(shift,((bound,"expected_bound"),))!=shape(shift)
        return {"bound":bound,"primitiveAtR":PHI,"primitiveAtBinder":at_r,"shift":shift,
                "shiftedY":[y0,y1],"sameOriginalDirection":[1,VR1],"independentOf":[Z,T,Y0,Y1]}

    pressures=[]
    for row in (
        (17753495,17753500,17753502,17753503,17753505,17753504,17753666,17753667,17753668,
         {(0,(1,0,0,0,0)),(0,(0,0,0,1,0)),(0,(0,0,0,0,1)),(0,(0,0,0,0,0)),(2,(0,1,0,0,0)),(3,(0,0,0,0,0))}),
        (17753980,17753985,17753986,17753987,17753989,17753988,17754190,17754191,17754192,
         {(0,(1,1,0,0,0)),(0,(0,1,0,1,0)),(0,(0,1,0,0,1)),(0,(0,1,0,0,0)),(2,(0,2,0,0,0)),(3,(0,1,0,0,0))}),
    ):
        bound,at_r,shift,y0,y1,scale,body,left,whole,needed=row
        moving=verify_shift(bound,at_r,shift,y0,y1,scale)
        assert g.args(left,"definite_integral")==[body,bound,LO,R]
        assert g.args(whole,"definite_integral")==[body,bound,LO,HI]
        observed=set()
        for i in head_leaves(body):
            if g.record(i)["op"]=="m3_aux_indexed_partial":
                field,args,orders=g.args(i,"m3_aux_indexed_partial")
                assert args==[bound,Z,T,ELL,y0,y1], (i,args)
                observed.add((field,tuple(orders)))
        assert observed==needed
        pressures.append({**moving,"integrand":body,"left":left,"whole":whole,
                          "covarianceRequests":[[names[i],list(o)] for i,o in sorted(observed)]})

    sum_of(17754234,[17754231,17754233])
    sum_of(17754231,[17754191,17754230])
    product(17754230,[20,17754229])
    product(17754229,[17744145,17753668])
    product(17754233,[20,17754232])
    product(17754232,[17743734,17754192])
    return {"centeredInitialTemporal":centered,"pressurePaths":pressures,"pressureZ":17754234,
            "actualChi":17743734,"actualChiZ":17744145,"radialFast":A,
            "pressureZFormula":"I_Z-chi*J_Z-chi_Z*J with actual shifted I_Z,J_Z and actual original unshifted-in-Z translation."}


def main():
    if not __debug__:
        raise RuntimeError("Python assertions must be enabled")
    p=ArgumentParser(description=__doc__)
    for arg in ("goal","work","artifact","cache","out"):
        p.add_argument("--"+arg,type=Path,required=True)
    a=p.parse_args()
    base=a.goal/"primary-forced-join/active-n3-c5-binding"
    hosted=a.artifact/"first-correction-spatial-source"
    orig=a.work/"continuation66/stage2/runtime-exact/research-ide/mathscope-m3/navier"
    files={
        "registry":hosted/"original-source-functions.json","manifest":hosted/"original-source-export-manifest.json",
        "cache":base/"live-wave-gauge/signed/source_cache.py","reader":base/"spatial-readback/verify_spatial_artifact.py",
        "streamCode":base/"spatial-readback/source_stream.py",
        "globalPressure":orig/"source-global-pressure.mjs","pressure":orig/"source-pressure.mjs",
        "potential":orig/"source-temporal-potential.mjs","temporal":orig/"source-global-temporal.mjs",
        "fourier":orig/"source-auxiliary-fourier.mjs",
        "meanShell":a.work/"continuation84/mean-shell/final/mean-shell.json",
    }
    raw={k:f.read_bytes() for k,f in files.items()}
    for k,v in raw.items():
        assert sha256(v).hexdigest()==PINS[k],k
    tokens={
        "globalPressure":["f=G.sub(gr,G.mul(rho,P)),fZ=G.derivative(f,Z)","G.derivative(radialPrimitive,R)===a",
                          "[Z,T,...Y].every(y=>!G.freeCoordinates(radialPrimitive).has(y))",
                          "Etheta=G.sub(G.add(De(W.rtheta,2),Dz(W.thetaz)),De(stress[0],2))"],
        "pressure":["G.sub(G.substitute(radialPrimitive,R,r),radialPrimitive)","left=G.integral(integrand,r,innerRadius,R),whole="],
        "potential":["rawPsi=G.div(G.sub(integrals.left,G.mul(chi,integrals.whole)),R)","beta=G.neg(Dz(psi)),gamma=De(psi,1)"],
        "temporal":["system=G.defineAuxiliaryInverse","exactInverseEquation:'N inverse = actual E - normalized Haar mean(actual E)'"],
        "fourier":["centeredBody=G.sub(body,mean.C)","if(k0===0&&k1<=0)continue;"],
    }
    assert all(all(s.encode() in raw[k] for s in strings) for k,strings in tokens.items())
    manifest,registry=json.loads(raw["manifest"]),json.loads(raw["registry"])
    assert manifest["node_stream_sha256"]==STREAM
    sys.path[:0]=[str(files[k].parent) for k in ("cache","reader")]
    import source_cache
    import verify_spatial_artifact as reader
    graph=source_cache.load(reader,hosted,manifest,22153782,a.cache)
    try:
        bindings=bind(graph,registry)
    finally:
        graph.__exit__(None,None,None)
    result={"status":"VERIFIED_ACTUAL_INITIAL_TEMPORAL_CENTERING_AND_PRESSURE_TRANSLATION",
            "sourceStream":graph.verify,"pins":PINS,**bindings,
            "conditionalOuterCollar":{
                "pressure":"chi=1 and rho=0 throughout the short outer radial integral; original exterior support gives W(beta)=0. Then p_m=-Wrr(R)+integral_R^beta (Wrr/r+epsilon*Wrz_Z-Wthetatheta/r)(r,Y+shift)dr.",
                "mean":"C84 initial FiveMap vanishes on the collar. The remaining initial mean increment is linear Temporal from W, its indicated derivatives and pressure. Parent stress terms are Y-independent and disappear from the actual centered Fourier source, independently of their whole radial stress moments.",
                "transport":"Z or T differentiation leaves the translation fixed on this chart. Radial differentiation retains the endpoint and the translation derivative. The original full tail loss applies per requested torus derivative."
            },
            "open":["Uniform weighted jets of actual initial covariance and the full Temporal estimates.",
                    "Same-live normalized outer Primary coefficients and complete projected Forced bounds.",
                    "Higher stress whole moment in the post-Forced Haar residual and final Signed seam."],"finalJets":0,"release":"HOLD"}
    with a.out.open("x",encoding="utf8",newline="\n") as f:
        json.dump(result,f,indent=2)
        f.write("\n")
    print(result["status"])


if __name__=="__main__":
    main()
