"""Exact fixed-label slow-time eikonal check from the protected original Repeat sources."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import factorial
from pathlib import Path

M3 = "continuation66/stage2/runtime-exact/research-ide/mathscope-m3/"
PINS = {
    "source": ("work", "continuation122/repeat-postfive-mean/protected-postfive-source.json", "83e2ae7c57ee51633c23df4e58ea81ec77b72e214970d4cf93d484e3f4738831"),
    "frontier": ("work", "continuation124/repeat-mean-time-frontier/repeat-mean-time-frontier.json", "4e352dbc0f1d409dda4655626879a5a053d2ea76a4241c3325c1fb5747b41049"),
    "value": ("work", "continuation123/repeat-complete-eikonal/repeat-eikonal.json", "12aae9ad5d4faaee53643e8178065221010d0b132d5f0eda49bb50158967acf9"),
    "spatial": ("work", "continuation124/repeat-background-eikonal-derivative/complete-first-derivative.json", "96c1ffb5f1138d08804a96ea0d843bbb74fe79943c68c6dc90352dd0faeeb799"),
    "meanValue": ("work", "continuation124/postfive-mean-derivative/first-derivative-grades.json", "5e5a5a4585aad76fbba3a5c0d2b290fb00d208ce058c5308094a805c5e6dec23"),
    "reference": ("work", "continuation121/repeat-reference-background/repeat-reference-background.json", "7f4db7e44f838f60e0ae27e9df8cbdd67fe6c41b154ea2dad11a810399ea079f"),
    "joint": ("work", "continuation121/repeat-joint-native-bracket/final/repeat-joint-native-bracket.json", "411d526087ae7aa5e2fd281f1a10fb6b659cb390fc5da1004bdebd81f6d3a6b5"),
    "fiveT": ("work", "continuation133/fivemap-velocity-time-bound/fivemap-first-time.json", "a6f277d09c5c287f32e4175008076cfd453fd94b988b4aa8440eb284d3146072"),
    "oldT": ("work", "continuation132/fivemap-old-mean/fivemap-old-mean.json", "1b8ddd4ce8b5006d96835b13ba892157b7fee7aef647d64306f96359abfea9bf"),
    "temporalT": ("work", "continuation130/temporal-velocity-time-bound/late-temporal-velocity-T.json", "13b540ce18ce8671da208ec8eeb1a363be98e428355f195399c3a9b89a5d976a"),
    "swirlT": ("work", "continuation127/late-temporal-swirl-T/late-temporal-swirl-T.json", "dabc398f8bbd002c1ab534dbd430123b2a83a65ff1ea72c1e45fbaf5b1af7d6c"),
    "pulse": ("goal", "c120/repeat-raw-pulse-and-projection/repeat-radial-operands.json", "d17ce2cd317c62775c5208b2c75efab78a6e962f2c4539c2da1091c92a3e17c7"),
    "pulseProgram": ("goal", "c120/repeat-raw-pulse-and-projection/verify_repeat_radial_operands.py", "60ac8c18b7c7c2e8af30a0564c946ed3c354bad14039e3f8ccc6806bb4a2e903"),
    "mixedCurl": ("work", "continuation119/signed-curl-mixed-t/signed-mixed-curl.json", "2efe3573d8c7a9b41bb2ba6682307140a017436ada61291f6d131c24ff25cf2a"),
    "geometry": ("work", "continuation92/geometry/final/outer-forced-geometry.json", "e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291"),
    "guards": ("goal", "c107/forced-mode-one-guards/mode-one-guard-geometry.json", "2b37b73515aff09625b0b8e8e433a651cfaf8ad3bfd273befa3eb6485b1006d8"),
    "background": ("goal", "c106/background16/background-c16.json", "1833785fc21ad6c73029361d6d6a44b2bb0baa099d57986709114093a53de9cc"),
    "chart": ("goal", "c106/background16/chart16.json", "ba0830ec36ca4dcd8c7c9709e868a4523b938afc4ed0c97cb9ddbfbb160b823c"),
    "radial": ("goal", "c106/radial-b10/radial-b-c10.json", "789ebac9d163f4170581078e2a73e85cb4703582155d7ae8e71846915b6b08fc"),
    "band": ("work", M3+"navier/source-global-band.mjs", "a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"),
    "lift": ("work", M3+"navier/source-initialized-angular.mjs", "4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e"),
    "harmonic": ("work", M3+"navier/source-harmonic-assembly.mjs", "339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20"),
    "frame": ("work", "continuation66/stage2/runtime-exact/research-ide/mathscope-m2/navier/actual-covariance-matrix.mjs", "7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26"),
    "repeat": ("work", M3+"post-signed-20261023/source-postfive-repeat-forced.mjs", "4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7"),
}
DEBIT=Q(1,100000)
HALF=Q(1,2)
FIELDS=("beta","v","gamma")
PHASE=("R","theta","z")


def load(a):
    data={}
    for key,(base,rel,digest) in PINS.items():
        p=getattr(a,base)/rel
        b=p.read_bytes()
        assert sha256(b).hexdigest()==digest,p
        data[key]=json.loads(b) if p.suffix==".json" else b.decode("utf-8")
    return data


def source_checks(d):
    snippets={
        "band":("ell=window.ell,Q=window.Q,S=G.pow(ell,2),epsilon=power(Q,h),k=G.ceiling(G.inv(G.sqrt(epsilon)))",
                "p=G.div(roundedInteger,k),x0=G.mul(q(sign,2),Bs,u),phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G))",
                "HR=G.derivative(phaseSpeed,R),HZ=G.derivative(phaseSpeed,Z),HT=G.derivative(phaseSpeed,T)",
                "b:G.mul(epsilon,power(s,q(-1,2)))",
                "phase=G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),epsilon),G.mul(x0,R)),G.mul(v,phaseSpeed))"),
        "frame":("n=[G.sub(x0,G.mul(v,HR)),G.div(p,R),G.sub(pz,G.mul(epsilon,v,HZ))]",),
        "lift":("ratio=G.exp(G.mul(G.sub(ell,ellReference),G.log(G.q(2))))",
                "G.div(R,G.sqrt(ratio)),G.div(Z,power(ratio,D)),G.div(T,ratio),ellReference,...Y",
                "representativeFixed=[current.representative.roots.X,current.representative.roots.eta,current.representative.roots.s].every(x=>[R,Z,T,...Y].every(y=>!G.dependsOn(x,y)))",
                "phase=localMap(prior.phase)", "G.mul(geometry.ci,operators.N(v)),G.one",
                "operators.N(xi),G.zero", "operators.L(v),G.zero"),
        "harmonic":("G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x))",
                    "G.neg(G.mul(epsilon,G.derivative(x,T))),G.derivative(x,geometry.v)",
                    "D.coordinates.some(x=>G.derivative(k,x)!==G.zero)"),
        "repeat":("G.mul(power(exponent), G.expressionValue(system, initial.reference.values))",
                  "C.value(shareMean(root, G.neg(A), 'PostFiveRepeatMeanVelocity_' + j))",
                  "geometry: template.lift.geometry, phase: template.phase, k: template.k"),
        "pulseProgram":('assert not set(ORDINARY).intersection(free(case["v"])|free(case["xi"])|free(LENGTH))',
                        "assert ensure_equal(e,e.mul(fac,e.dot(N,du)),e.one)"),
    }
    for name,texts in snippets.items():
        for text in texts:
            assert text in d[name],(name,text)
    ref,guard=d["reference"],d["joint"]["exactGuard"]
    assert ref["referenceMap"]=={"R":"R/sqrt(ratio)","Z":"Z/ratio^D","T":"T/ratio","Q":"ratio*Q","s":"s/ratio"}
    assert ref["referenceBackgroundAfterSourceScaling"]==["b","R F","G"]
    assert guard["closedEqualityIsTraceOrRequiresOrdinaryExtension"]
    assert guard["strictS"]=="max(1/2,b/2)<s<min(2,2b)"
    assert ref["reducedEikonalCoefficients"]=={"Delta_R n_R":1,"Delta_theta n_theta":1,"Delta_z n_z":1,
                                             "b n_R":1,"eps v G Omega_Z":-1,"eps v Omega_T":1}
    src=d["source"]; ids=d["frontier"]["protected"]; values=d["value"]
    stream=src["sourceSHA256"]
    assert stream==ids["activeSourceSHA256"]==values["protectedStream"]==d["spatial"]["protectedStream"]
    assert stream==d["meanValue"]["protectedSourceSHA256"]==d["pulse"]["sourceStreamSHA256"]==d["mixedCurl"]["sourceStreamSHA256"]
    assert src["nativeSHA256"]==ids["activeNativeRegistrySHA256"]==d["pulse"]["registrySHA256"]
    rows=d["pulse"]["protectedPulseCoordinateChecks"]
    charts=set(values["charts"])
    assert charts=={r["chart"] for r in rows}=={r["chart"] for r in d["geometry"]["eikonalAndMeanTransport"]["exactSourceChecks"]}
    assert len(rows)==len(charts)==10
    assert all(row["affineLVZero"] and row["affineNXiZero"] and row["effectiveCiNVOne"] for row in rows)
    assert all(d["guards"]["nativeGuardTriples"][r["chart"]][-1][0]==r["v"] for r in rows)
    assert d["mixedCurl"]["originalRadialChart"]["ordinaryCommutatorTR"]=="ZERO_ON_FIXED_NATIVE_LABEL"
    return stream,sorted(charts),{r["chart"]:r["v"] for r in rows}


def symbolic():
    # Products over exact independent symbols; solely the source product
    # rule, with the fixed label, fixed Y and fixed lift imposed.
    def poly(*items):
        c=Counter()
        for coefficient,monomial in items:
            c[tuple(sorted(monomial.split()))]+=coefficient
        return Counter({k:v for k,v in c.items() if v})

    def tags(c):
        return [[v,*k] for k,v in sorted(c.items())]

    def differentiate(c,derivatives):
        b=Counter()
        for k,v in c.items():
            for i,x in enumerate(k):
                new=derivatives.get(x)
                if new is not None:
                    terms=k[:i]+k[i+1:]+new
                    b[tuple(sorted(terms))]+=v
        return Counter({k:v for k,v in b.items() if v})

    base=poly((1,"eps b0 n_R"),(1,"eps w omega_T"),(-1,"eps w G omega_Z"))
    dnormal=poly((1,"n_R Delta_R"),(1,"n_theta Delta_theta"),(1,"n_z Delta_z"))
    t={"b0":("b0_T",),"w":None,"omega_T":("omega_TT",),"omega_Z":("omega_ZT",),"G":("G_T",),
       "n_R":("minus1","w","omega_RT"),"n_z":("minus1","eps","w","omega_ZT")}
    t.update({"Delta_"+s:("Delta_"+s+"_T",) for s in PHASE})
    signed=lambda result:Counter({tuple(x for x in k if x!="minus1"):(-v if "minus1" in k else v) for k,v in result.items()})
    expected=signed(differentiate(base,t))
    assert expected==poly((1,"eps b0_T n_R"),(-1,"eps b0 w omega_RT"),(1,"eps w omega_TT"),
                          (-1,"eps w G_T omega_Z"),(-1,"eps w G omega_ZT"))
    mean=signed(differentiate(dnormal,t))
    assert mean==poly((1,"n_R Delta_R_T"),(1,"n_theta Delta_theta_T"),(1,"n_z Delta_z_T"),
                      (-1,"w omega_RT Delta_R"),(-1,"eps w omega_ZT Delta_z"))
    fake=signed(differentiate(base,{**t,"w":("w_T",)}))
    assert len(fake)==len(expected)+2  # n_R is expanded separately below.
    base_expanded=poly((1,"eps b0 x0"),(-1,"eps b0 w omega_R"),(1,"eps w omega_T"),(-1,"eps w G omega_Z"))
    assert len(differentiate(base_expanded,{**t,"w":("w_T",),"omega_R":("omega_RT",)})) \
           ==len(differentiate(base_expanded,{**t,"omega_R":("omega_RT",)}))+3
    fast=signed(differentiate(base_expanded,{"w":()}))
    assert fast==poly((-1,"eps b0 omega_R"),(1,"eps omega_T"),(-1,"eps G omega_Z"))
    # Restoring the uncancelled background carrier before T gives the
    # same result after removing -omega + pF + pzG, including its T jets.
    cancellation=poly((-1,"p F"),(-1,"pz G"),(1,"p F"),(1,"pz G"))
    assert not cancellation and not differentiate(cancellation,{"F":("F_T",),"G":("G_T",)})
    return tags(expected),tags(mean),tags(fast)


def numeric(d):
    point=d["background"]; radial=d["radial"]; geom=d["geometry"]
    assert point["derivativeOrder"]==16 and point["comparison"]["sign"]==-1
    assert point["inputs"]["chartSHA"]==PINS["chart"][2] and d["chart"]["totalDirections"]==969
    assert "qBig/64 <= q < qBig/16" in point["use"]
    assert radial["normalizedB"].startswith("b/epsilon=s^(-1/2)")
    assert radial["originalLiveSlabThresholdComparison"]==-1 and radial["ordinaryDerivativeOrder"]==10
    assert geom["conditionalCoefficientCaps"]["derivativeArithmetic"]["phaseGenealogy"].startswith("Each derivative of omega=pF+pzG costs at most 2*Bnorm^5*C_FG")
    assert d["guards"]["actualFixedPalette"]["carrier"].endswith("2/sqrt(epsilon)]")
    # b0, F/G through order two <= M, M=exp(H/2^128).
    # Normal value B^4; normal T derivative costs <=2 B^6 S M
    # (also epsilon in z), since |w|<=B S and |p|,|pz|<=B^5.
    mass=sum([1,2,2,2,2])*4
    rank=6+2+(mass-1).bit_length()
    assert (mass,rank)==(36,14)
    assert 2*(Q(rank,2**128)+Q(1,2**32636))<DEBIT
    base=HALF-DEBIT

    agg=d["fiveT"]
    assert agg["status"]=="CONDITIONAL_AUTHENTICATED_ORIGINAL_FIVEMAP_TIME_NORM"
    for key,donor in (("initialized","oldT"),("temporalT","temporalT"),("swirlT","swirlT")):
        assert agg["pins"][key]==PINS[donor][2]
    ast=d["source"]["nodes"]
    roots=agg["accumulatedAndInitializedRoots"]
    assert roots=={"initialized":[21374946,21374947,21374948],"latestFive":[22151963,22151941,22151945],
                   "postMinusInitialized":[22153217,22153219,22153221]}
    assert d["frontier"]["protected"]["protectedLateIncrement"]==roots["postMinusInitialized"]
    for index,(node,init,latest) in enumerate(zip(roots["postMinusInitialized"],roots["initialized"],roots["latestFive"],strict=True)):
        total,negative=ast[str(node)]["args"]
        assert ast[str(total)]=={"op":"add","args":[22151019+index,latest]}
        assert ast[str(negative)]=={"op":"multiply","args":[20,init]}
    assert ast["22154876"]=={"op":"add","args":[22150797,22151941]}
    assert d["temporalT"]["actualSource"]=={"potential":22150943,"separateFiveMapPotential":22151952,
                                          "pressureZ":22031648,"centeredAxialSource":22032008}
    assert d["swirlT"]["roots"]["actualTemporalSwirl"]==22150797
    old=d["oldT"]["originalDirectionTable"]
    t0=(0,0,1,0)
    middle={(r["field"],tuple(r["RZTL"])):r for r in old["middle"]}
    direct={f:Q(middle[f,t0]["minEpsilon"]) for f in FIELDS}
    assert len(middle)==266
    ranks=old["common"]["coefficientRanksInHOver2Pow128"]
    assert ranks==[48608,48636]
    gaussian=d["guards"]["gaussianComparisons"]["source"]
    assert gaussian.startswith("zeta=exp(-1/u^2-4/d^2)")
    for region,maximum in (("inner",27),("outer",30)):
        rows={(r["field"],tuple(r["RZTL"])):r for r in old[region]}
        assert rows.keys()==middle.keys() and max(r["pole"] for r in rows.values())==maximum
        for key,r in rows.items():
            whole=middle[key]
            assert Q(r["epsilon"])>=Q(whole["minEpsilon"])
            assert Q(r["band"])<=Q(whole["bandIntercept"])+3*sum(key[1][:3])
        # On a narrow collar x<=1, exp(-1/x^2) x^-p <= p!
        # follows from the pth exponential term. One H-rank pays p!.
        assert factorial(maximum).bit_length()<128 and ranks[0]+1<=ranks[1]
    before={"beta":d["temporalT"]["normalizedTemporalT"]["betaT"],
            "gamma":d["temporalT"]["normalizedTemporalT"]["gammaT"],
            "v":d["swirlT"]["weightedSourceAndTransfer"]["nativeSwirlT"]}
    time_grades={}
    for f in FIELDS:
        initial=agg["initializedFixedLabelMeanTSeparateAddend"][f]
        late=agg["postFiveFixedLabelAccumulatedMeanIncrementT"][f]
        fresh=agg["fiveMapFixedLabelBounds"][f+"_T"]
        assert Q(initial["epsilon"])==direct[f] and Q(initial["band"])<=Q(27,2)
        assert Q(late["epsilon"])==min(Q(before[f]["epsilon"]),Q(fresh["epsilon"]))
        assert Q(late["band"])==max(Q(before[f]["band"]),Q(fresh["band"]))
        for donor in (initial,late):
            assert 2*(Q(donor["totalCoefficientChargeInHOver2Pow128"],2**128)+Q(donor["band"])/2**32636)<DEBIT
            assert Q(donor["epsilon"])-DEBIT==Q(donor["epsilonAfterJointCoefficientAndBandDebit"])
        time_grades[f]=min(Q(r["epsilonAfterJointCoefficientAndBandDebit"]) for r in (initial,late))
    assert time_grades=={"beta":Q(47999,25000),"v":Q(22999,25000),"gamma":Q(22999,25000)}
    vals={r["component"]:Q(r["gradeAfterDebit"]) for r in d["meanValue"]["componentRows"] if r["direction"]=="value"}
    assert vals=={"beta":Q(189997,100000),"v":Q(89997,100000),"gamma":Q(22499,25000)}
    # Since rho in [1/4,4] and 0<h<1/16, each original -A-1+h*grade
    # exponent is between -2 and 2. Thus a factor of 16 pays it.
    for f in FIELDS:
        g=time_grades[f]
        e=tuple(-Q(3,2)+(g-1)*h for h in (Q(0),Q(1,16)))
        assert all(-2<=x<=2 for x in e)
    assert Q(1,2)-Q(1,16)>0 and Q(1,2)+Q(1,16)<1
    transported={f:time_grades[f]-HALF for f in FIELDS}
    hits_normal={"beta":vals["beta"]-HALF,"v":None,"gamma":vals["gamma"]+1-HALF}
    # 3 mean derivatives * 2 donor contributions * ratio cover 16,
    # plus the two nonzero time-normal terms at coefficient 2 each;
    # mk contributes at most 4 epsilon^(-1/2).
    mean_mass=4*(3*2*16+2+2)
    mean_rank=6+1+(mean_mass-1).bit_length()
    assert (mean_mass,mean_rank)==(400,16)
    assert 2*(Q(mean_rank,2**128)+Q(1,2**32636))<DEBIT
    assert DEBIT*Q(2**(128*511),4)>1   # log(2)<1 for the finite final sum.
    mean=min(*transported.values(),*(v for v in hits_normal.values() if v is not None))-DEBIT
    all_t=min(base,mean)-DEBIT
    assert all_t==Q(20997,50000) and all_t+1==Q(70997,50000)
    return {"background":str(base),"meanIncrement":str(mean),"wholeOrdinaryT":str(all_t),
            "normalizedSlowPhysicalTime":str(all_t+1),
            "preDebitByComponent":{"derivativeHitsMean":{f:str(g) for f,g in transported.items()},
                                  "derivativeHitsNormal":{f:None if g is None else str(g) for f,g in hits_normal.items()}},
            "finiteArithmetic":{"coefficientMassBeforeDebits":[mass,mean_mass],
                                "logRankHOver2Pow128":[rank,mean_rank],"remainingBandBeforeDebits":1,
                                "finiteProductDebit":str(DEBIT),"finiteSumDebit":str(DEBIT)}}


def main(a):
    d=load(a)
    stream,charts,pulse=source_checks(d)
    bg,mean,fast=symbolic()
    grades=numeric(d)
    return {"schema":"MathScope.C133.ProtectedRepeatOrdinaryEikonalTime/1",
            "status":"VERIFIED_FIXED_LABEL_PRODUCT_RULE_CONDITIONAL_ORIGINAL_POINTWISE_BOUND",
            "pins":PINS,"protectedStream":stream,"charts":charts,
            "fixedCoordinates":{"labels":["ell_own","ell_ref"],"hold":["R","Z","Y0","Y1","theta","lift","representative"],
                                "independentNativeT":17732750,"ordinaryTOfLiftedPulse":0,
                                "protectedPulseNodes":pulse,"ordinaryTOfNormalTheta":0,
                                "normalizedCommonFast":"c_i,eff N","Nxi":0,"ciNV":1},
            "scalar":"E_m=mk[b n_R + epsilon w(omega_T-G omega_Z)+Delta dot n], m=1,2",
            "omega":"pF+p_z G",
            "timeNormal":["-w omega_RT","0","-epsilon w omega_ZT"],
            "exactProducts":{"ordinaryTOfBackgroundWithoutMk":bg,"ordinaryTOfMeanWithoutMk":mean,
                              "fastBackgroundWithoutMk":fast},
            "reference":{"ratio":"rho=Q_ref/Q_own","law":"Delta_T,own=rho^(-A-1) [(initialized)_T+(Temporal)_T+(FiveMap)_T]_ref",
                         "epsilon":"epsilon_ref=rho^h epsilon_own","fixedLabelRatioConversionUpper":16,
                         "strictJointGuard":d["joint"]["exactGuard"]["strictS"]},
            "bounds":grades,
            "normalizedTimeOperator":"-epsilon partial_T+c_i,eff N; the fast pulse differentiates the lifted phase since c_i,eff Nw=1",
            "originalPhysicalSlowOnDimensionlessScalar":"-Q_own^(-1) partial_T E on fixed labels; retain Q_own^(-1-h) when translating the normalized slow bound to physical units",
            "separateFastRemainder":"c_i,eff N E_m=mk[-b omega_R+epsilon(omega_T-G omega_Z)-Delta_R omega_R-epsilon Delta_z omega_Z+(c_i,eff N Delta) dot n]. The whole fast mean derivative needs its own bound.",
            "scope":["Original protected ten fixed lifts, strict jointly admitted own/reference chart on the stated early slab, original source realization and flat traces.",
                     "First time derivative of the scalar eikonal coefficient before multiplication by restored waves.",
                     "The evidence covers normalized ordinary and slow terms. Active application validation, fast mean, wave amplitudes, pressure and total residual are independent."],
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for key in ("work","goal","out"):
        p.add_argument("--"+key,type=Path,required=True)
    a=p.parse_args()
    ans=main(a)
    a.out.write_bytes((json.dumps(ans,indent=2)+"\n").encode())
    print(ans["status"],ans["bounds"]["wholeOrdinaryT"],ans["bounds"]["normalizedSlowPhysicalTime"])
