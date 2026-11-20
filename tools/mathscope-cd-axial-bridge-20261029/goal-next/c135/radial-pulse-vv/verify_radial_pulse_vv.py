"""Exact collar proof audit for the original native pulse and pressure derivatives."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import runpy

WORK = {
    "candidate": ("continuation132/hosted-44682703381/active-n3-repeat-forced-candidate.json","b9c43c30c8782034650ba432ff20d3e7a258bb752f81e2fa0bf3a7211621430e"),
    "registry": ("continuation132/hosted-44682703381/active-n3-repeat-forced-source/original-source-functions.json","62548608d4e2555e1dbfd2e441d8fa0c8a7dc5c22817d61fa1c57a42b41ae5ce"),
    "protection": ("continuation132/active-repeat-source/protected-wave-bodies.json","2d326dee551a7c4b83908aab1244fcbd9916d398fa3d77af17eb73698106256b"),
    "live": ("continuation133/live-radial-trace/live-radial-trace.json","70d841c3686c7f3135592e04e170048cd5663cfaaf4e53ac5b12bae84bb5c8ba"),
    "c134": ("continuation134/radial-time-gaussian/radial-time-gaussian.json","a69531c3a1be1d2c8fdf2a56f2b41d50c84f89b806134540c5072ea281091d23"),
    "c134program": ("continuation134/radial-time-gaussian/verify_radial_time_gaussian.py","73cd66c070f1e1ed9468aa1db1bb27c0c502b832f4e6d29f8fe0f72487e2a3c1"),
    "c115": ("continuation115/k2-radial-time-analytic/final/first-forced-t-transfer.json","aa0068461cdfeda7a8ac77700a60a2695c811db8a79a5e9bd854f43e7f37b05a"),
    "c120": ("continuation120/signed-pulse-time/signed-fast-pulse.json","9d58464ea8182764e9354867105ebd9cb8454ddf53d6a70b359fe488849f0b35"),
    "sigma": ("continuation108/early-sigma-c6/final/early-sigma-c6.json","d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f"),
    "inverse": ("continuation110/k1-analytic-seams/final/directional-inverse-seams.json","0e3821bd9a51f8961153416df12af8c4f0dcc5327a624daa781040532e6d3865"),
    "mixedCurl": ("continuation119/signed-curl-mixed-t/signed-mixed-curl.json","2efe3573d8c7a9b41bb2ba6682307140a017436ada61291f6d131c24ff25cf2a"),
    "joinedFrame": ("continuation106/frame15/joined-c15.json","98e3fa519ab4e323373d8f0beb85029938ba7b4ede221af982524705fd590fd3"),
}
NAVIER = "mathscope-m3/navier/"
SOURCE = {
    "frame": ("mathscope-m2/navier/actual-covariance-matrix.mjs","7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26"),
    "band": (NAVIER+"source-global-band.mjs","a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"),
    "forced": (NAVIER+"source-forced-pulse.mjs","866d8ec69758b9f036b73e6e8f04fb88cfb248e7a01d32e7b048df535c1020f9"),
    "mapped": (NAVIER+"source-mapped-forced-curl.mjs","3764b705d26c3333578db9fbc15004779d825026d2a487d3809320fd41cb62bd"),
    "lift": (NAVIER+"source-initialized-angular.mjs","4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e"),
    "fullForced": (NAVIER+"source-global-forced-current.mjs","1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3"),
    "globalPressure": (NAVIER+"source-global-pressure.mjs","c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4"),
    "fourier": (NAVIER+"source-auxiliary-fourier.mjs","59e1d8f7fd72b880de030a2a56bee9be65b5e02203cffa73157ce8dae420ad2e"),
    "homogeneousPressure": (NAVIER+"source-global-angular.mjs","eb4e4ae44e9bb84713f89d36d1d7ae33cf1b072638d0a8e67e2a90f38d411010"),
    "harmonic": (NAVIER+"source-harmonic-assembly.mjs","339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20"),
    "signed": (NAVIER+"generic-signed-source-kernel.mjs","15eea2c0f984c5b3bb58dd372d9b01660e44a85526c1f329b41b41855b4c27e2"),
}
AXES = (17732748,17732749,17732750,17745430,17745431)
OFFSETS = ((0,0,0,0),(1,0,0,0),(0,1,0,0),(0,0,0,1))


def blob(root, pin):
    rel, digest = pin
    p = root/rel
    raw = p.read_bytes()
    assert sha256(raw).hexdigest()==digest,p
    if p.suffix==".json":
        return json.loads(raw)
    return runpy.run_path(str(p)) if p.suffix==".py" else raw.decode()


def atom(name):
    return {(name,):1}


def add(*args):
    result=Counter()
    for p in args:
        result.update(p)
    return {k:v for k,v in result.items() if v}


def neg(p):
    return {k:-v for k,v in p.items()}


def mul(a,b):
    return add(*({tuple(sorted(k+l)):v*w} for k,v in a.items() for l,w in b.items()))


def diff(p, axis, rules=None):
    rules=rules or {}
    result=[]
    for word,c in p.items():
        for i, name in enumerate(word):
            symbol, *tags = name.split(":")
            derivative = rules.get(name,atom(symbol+":"+":".join(sorted([*tags,axis]))))
            result.append(mul({word[:i]+word[i+1:]:c},derivative))
    return add(*result)


def vector(name, count=3):
    return tuple(atom(name+str(j)) for j in range(count))


def matrix(name, rows, cols):
    return tuple(tuple(atom(name+str(i)+str(j)) for j in range(cols)) for i in range(rows))


def dot(a,b):
    return add(*(mul(x,y) for x,y in zip(a,b,strict=True)))


def mv(A,b):
    return tuple(dot(row,b) for row in A)


def dv(p, rules=None):
    return diff(p,"v",rules)


def exact_formulae():
    t,f=vector("t"),vector("f")
    M,Pi=matrix("M",3,3),matrix("Pi",3,3)
    bare_rhs=tuple(add(x,neg(y)) for x,y in zip(mv(M,t),mv(Pi,f),strict=True))
    t_rules={"t"+str(j):v for j,v in enumerate(bare_rhs)}
    dd=tuple(dv(x,t_rules) for x in bare_rhs)
    Mv=tuple(tuple(dv(a) for a in row) for row in M)
    Piv=tuple(tuple(dv(a) for a in row) for row in Pi)
    mv_terms=[mv(Mv,t),mv(M,mv(M,t)),mv(M,mv(Pi,f)),mv(Piv,f),mv(Pi,tuple(dv(x) for x in f))]
    want=tuple(add(a,b,neg(c),neg(d),neg(e)) for a,b,c,d,e in zip(*mv_terms,strict=True))
    assert dd==want
    assert all(row!=add(row,dropped) for row,dropped in zip(dd,mv_terms[-1],strict=True))

    P,rho=atom("P"),atom("rho")
    B,Q=matrix("B",3,2),matrix("Q",2,2)
    w=vector("w",2)
    wv=mv(Q,w)
    w_rules={"P":mul(rho,P),**{"w"+str(j):p for j,p in enumerate(wv)}}
    Bv=tuple(tuple(dv(x) for x in row) for row in B)
    Bvv=tuple(tuple(dv(x) for x in row) for row in Bv)
    primary=tuple(mul(P,x) for x in mv(B,w))
    primary_dd=tuple(dv(dv(x,w_rules),w_rules) for x in primary)
    widened=[mv(B,w),mv(Bv,w),mv(B,wv),mv(Bvv,w),mv(Bv,wv),mv(B,tuple(dv(x,w_rules) for x in wv))]
    derived=tuple(mul(P,add(mul(add(dv(rho),mul(rho,rho)),a),mul(mul({():2},rho),add(b,c)),d,mul({():2},e),ff))
                  for a,b,c,d,e,ff in zip(*widened,strict=True))
    assert primary_dd==derived

    n,b=vector("n"),vector("b")
    p,q,h,psi=map(atom,("p","q","h","psi"))
    # h=q^-1, p is the pressure scalar without i/(m*k).
    # q is treated as a differentiable scalar here and tied to n.n below.
    numerator=add(dot(b,t),dot(n,f))
    p=mul(mul(psi,h),numerator)
    inv_v=neg(mul(dv(q),mul(h,h)))
    p_v=dv(p,{"h":inv_v})
    explicit=add(mul(add(mul(dv(psi),h),mul(psi,inv_v)),numerator),
                 mul(mul(psi,h),add(dot(tuple(dv(x) for x in b),t),dot(b,tuple(dv(x) for x in t)),
                   dot(tuple(dv(x) for x in n),f),dot(n,tuple(dv(x) for x in f)))))
    assert p_v==explicit
    omitted=dv(mul(mul(psi,h),dot(b,t)),{"h":inv_v})
    assert p_v!=omitted
    mixed={}
    for axis in ("R","Z","L"):
        inv_a=neg(mul(diff(q,axis),mul(h,h)))
        av=diff(p_v,axis,{"h":inv_a})
        va=dv(diff(p,axis,{"h":inv_a}),{"h":inv_v})
        assert av==va
        assert av!=diff(omitted,axis,{"h":inv_a})
        mixed[axis]=len(av)

    normal_square=dot(n,n)
    nv=tuple(dv(x) for x in n)
    assert dv(normal_square)==mul({():2},dot(n,nv))
    affine_rules={"n"+str(j)+":v":{} for j in range(3)}
    assert dv(dv(normal_square),affine_rules)==mul({():2},dot(nv,nv))
    # On the active psi=1 region take t=0, n=(1-v,1,0), f=R*v*n.
    # Then exact projection is zero and normalized pressure p/(i/mk)=R*v.
    radius,v=Fraction(3,2),Fraction(2,5)
    nn=(1-v,Fraction(1),Fraction(0))
    ff=tuple(radius*v*x for x in nn)
    norm=sum(x*x for x in nn)
    quotient=sum(x*y for x,y in zip(nn,ff,strict=True))/norm
    projected=tuple(x-y*quotient for x,y in zip(ff,nn,strict=True))
    assert projected==(0,0,0) and quotient==radius*v
    return {"forcedSecondPulseTermsPerComponent":[len(row) for row in dd],
            "primarySecondPulseTermsPerComponent":[len(row) for row in primary_dd],
            "forcedPressurePulseTerms":len(p_v),"forcedPressureMixedTerms":mixed,
            "nonzeroNormalSourceControl":{"projection":[0,0,0],"normalizedPressure":"R*v",
              "normalizedPressureVAtR3Over2":str(radius),"normalizedPressureRV":"1"}}


def source_bindings(d):
    cases={
        "frame":("nPrime=[G.neg(HR),G.zero,G.neg(G.mul(epsilon,HZ))]",
                 "n=[G.sub(x0,G.mul(v,HR)),G.div(p,R),G.sub(pz,G.mul(epsilon,v,HZ))]",
                 "G.div(G.mul(q(sign),u),Ls)","sub(mul(Aphi,B),BPrime)"),
        "band":("phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G))",
                "z=w.map(x=>G.mul(P,x)),t=mul(frame.B,z.map(x=>[x]))",
                "G.mul(v,phaseSpeed)"),
        "forced":("projectedRaw=projection.map(row=>cscale(G,G.q(-1),cdot(G,row,forcing)))",
                  "pressureNumerator=cadd(G,cdot(G,normalRow,velocity),cdot(G,n,forcing))",
                  "denominator=G.mul(G.q(m),k,nSquared)",
                  "pressure=cscale(G,psi,result.pressure)"),
        "mapped":("map=x=>G.simultaneousSubstitute(x,[w],[pulseValue])",
                  "pressure:mapComplex(pathCutoff.pressure)",
                  "remainder=[G.neg(Dz[1]),G.sub(Dz[0],Dr[2]),G.add(Dr[1],G.div(X[1],R))]"),
        "lift":("check('source-lift-longitudinal-radial-derivative-zero',operators.L(v),G.zero)",
                "check('source-lift-normalized-pulse-time-one',G.mul(geometry.ci,operators.N(v)),G.one)",
                "check('original-integer-lift-pulse-at-Hw-is-w',atPulse,w)",
                "check('original-integer-lift-N-basepoint-invariance-'+j,x)"),
        "fullForced":("const waveRows=sumStateRows(G,old.waveRows,increment)",
                      "commonPhysicalTimeAtMappedEndpoint:",
                      "matrixIndependentOfBasepointN:principalInvariant"),
        "globalPressure":("radialFast=G.derivative(radialPrimitive,R)",
                          "[Z,T,...Y].every(y=>!G.freeCoordinates(radialPrimitive).has(y))"),
        "fourier":("divisor=exactAuxiliaryDivisor(G,k)",
                   "Finite Fourier part of N^-1(F-HaarMean(F))"),
        "homogeneousPressure":("pressureTerm=G.neg(G.mul(k,squared,imaginary))",
                               "normalForcingDeclaredZeroOnlyForThisPrimary:true"),
        "harmonic":("Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))",
                    "time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))",
                    "const apply=(M,derivative,phaseDerivative)"),
        "signed":("homogeneousPressure=services.homogeneousPressure(G,{normal:f.frame.n,nPrime:f.frame.nPrime",
                  "K:f.frame.principalK,k,amplitude:weighted}"),
    }
    for key,strings in cases.items():
        for code in strings:
            assert code in d[key],(key,code)
    return {key:len(v) for key,v in cases.items()}


def audit_live(d):
    registry=json.loads(d["registry"]["definitions"])
    assert d["registry"]["counts"]==[2269,29,2,60,0]
    defs={r["id"]:r for r in registry[0]}
    lines=[]
    charts={r["chart"]:dict(r["reportedOwnersAndVerifiedProtectedBodyRoots"])
            for r in d["protection"]["charts"]}
    pressure_total=0
    expected_pressure={(0,0,0,0,0),(1,0,0,0,0),(0,1,0,0,0),(0,0,0,1,0),(0,0,0,0,1)}
    for t in d["candidate"]["templates"]:
        key=t["key"]
        per_mode={m:{"pressure":set(),"velocity":set()} for m in (1,2)}
        for row in t["rawSupport"]["waveJets"]:
            definition=defs[row["system"]]
            assert definition["body"]==row["actualBody"]==charts[key][row["system"]]
            prefix,chart,m,component,part=definition["name"].split("_")
            assert prefix=="PostFiveRepeatWave" and chart==key and part in ("real","imaginary")
            m,component=int(m),int(component)
            pmap=dict(zip(definition["parameters"],row["orders"],strict=True))
            assert all(n==0 or x in AXES for x,n in pmap.items())
            order=tuple(pmap[x] for x in AXES)
            role="pressure" if component==3 else "velocity"
            per_mode[m][role].add(order)
            pressure_total+=int(role=="pressure")
        for m,inventory in per_mode.items():
            assert inventory["pressure"]==expected_pressure, (key,m,inventory)
            lines.append({"chart":key,"mode":m,**{k:sorted(v) for k,v in inventory.items()}})
    assert pressure_total==d["live"]["rawPressureUses"]==200
    assert d["candidate"]["preRepeatNodeCount"]==22155584
    return pressure_total, lines


def plus(a,b):
    return tuple(x+y for x,y in zip(a,b,strict=True))


def coefficient_hull(d, roots):
    prior=d["c134program"]
    grouped=prior["load"](roots,"modeOneRecipe")["grouped_recipes"]()
    mean_map={"Db":"beta","Dv":"v","Dg":"gamma"}
    robust={(r,z,0,l) for r,z,l in product(range(4),repeat=3) if r+z+l<=3}
    direct=set()
    old_mean=set()
    for a in robust:
        for family in grouped.values():
            for factors in family:
                for name,b in factors:
                    j=plus(a,b)
                    if name in ("U","Uo","P"):
                        direct.add(j)
                    if name in mean_map:
                        old_mean.add((mean_map[name],j))
    direct.update(plus(a,o) for a in robust for o in OFFSETS)
    _, mean_cov, inv, short, _=prior["load"](roots,"meanCollar")["collar"](
         prior["load"](roots,"meanAlgebra"),6,sorted(old_mean))
    direct.update(a for _,a in mean_cov)
    primary_slow=max(sum(a[:3]) for a in direct)
    primary_L=max(a[3] for a in direct)
    assert primary_slow<=11 and primary_L<=8
    sigma={(field,(r,z,0)) for field in ("theta","z")
           for r,z in product(range(4),repeat=2) if r+z<=3}
    for side in ("inner","outer"):
        covers={(r["field"],tuple(r["RZT"])) for r in d["sigma"]["regions"][side]["rows"]}
        assert sigma<=covers
    assert d["joinedFrame"]["originalBackgroundOrder"]==16
    assert d["joinedFrame"]["regularTargetOrder"]==15
    assert d["c134"]["rawFirstForcedAudit"]["eachModeOneRowContainsPrimaryWaveOrPressure"]
    assert d["c134"]["rawFirstForcedAudit"]["modeTwoRawOriginalMonomials"]==1270
    return {"preCutoffRZLDownset":sorted(robust),"rawAddedPulseOrder":1,
        "primaryOrdinaryEnvelope":primary_slow,"primaryLMax":primary_L,"primaryOrdinaryDirectionCount":len(direct),
        "oldMeanRoles":len(old_mean),"oldMeanPrimaryCovarianceRoles":len(mean_cov),
        "oldMeanInverseSourceRoles":len(inv),"oldMeanShortPrimitiveRoles":len(short),
        "signedSigmaRZZeroTThrough3":sorted(sigma),"newSlowJetOutsidePinnedFrame":False}


def main(roots):
    docs={k:blob(roots["work"],v) for k,v in WORK.items()}
    source={k:blob(roots["runtime"],v) for k,v in SOURCE.items()}
    pressure, directions=audit_live(docs)
    assert docs["inverse"]["tail"]["uniformPointwiseFourierTail"] == "<25*K^(-1/2)*(||f||_2+||L^2 f||_2/36)"
    assert docs["mixedCurl"]["originalRadialChart"]["ordinaryCommutatorTR"]=="ZERO_ON_FIXED_NATIVE_LABEL"
    assert docs["c120"]["protectedRadialImaginaryCoefficient"]==22001995
    assert docs["c115"]["nativeConditions"]["noEndpointTerms"] is True
    return {"schema":"MathScope.C135.OriginalRadialPulseAndForcedPressureTraces/1",
        "status":"CONDITIONAL_FIXED_LABEL_SECOND_PULSE_AND_MIXED_PRESSURE",
        "workPins":WORK,"sourcePins":SOURCE,"exactSourceStringChecks":source_bindings(source),
        "pressureNativeApplications":pressure,"allRawChartModes":directions,
        "symbolicPulseAndPressure":exact_formulae(),"originalCoefficientEnvelope":coefficient_hull(docs,roots),
        "traceScope":{"W_vv":"value plus first R/Z/L, phase-free and after restoring harmonic",
            "W_v":"R/Z/L orders through two",
            "pressure":"v, Rv, Zv, Lv, m=1 and m=2, including full normal source",
            "radialFaces":[3617,28826],"gaussianPower":"1/2","finiteFixedLabelPole":True},
        "uniformEpsilonClaim":False,"fullSupportedRepeatC1Claim":False,"release":"HOLD"}


if __name__=="__main__":
    p=ArgumentParser()
    for name in ("work","goal","runtime","out"):
        p.add_argument("--"+name,type=Path,required=True)
    a=vars(p.parse_args())
    a["out"].write_bytes((json.dumps(main(a),indent=2,sort_keys=True)+"\n").encode())
