"""Original late Temporal radial and axial T through the outer shifted FTC."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from pathlib import Path
import runpy
from types import FunctionType

RUNTIME="continuation66/stage2/runtime-exact/research-ide/mathscope-m3/navier/"
PINS={
    "frontier":("W","continuation129/temporal-velocity-time/frontier.json","d1ee3fa60dc761433c04659ccc73cce9292dc9955560b42f7d424831502b1332"),
    "cov":("W","continuation129/temporal-postsigned-covariance/temporal-postsigned-covariance.json","97c245a1f59d1d35af8f843e6983be14aa3a0e3e58816bbe3f1171f0d590352d"),
    "old":("W","continuation129/temporal-old-mean/temporal-old-mean.json","d5db88769a2246d6142fe6bb8102e9e8ad873233d12181e0a6278a8c54e20bbd"),
    "ops":("G","c105/late-grade/verify_late_grade.py","b7df296fa485ae391e0d53762e58c6a9eb469f53842083acb5189e220d81c4cc"),
    "fourier":("G","c110/k1-analytic-seams/directional-inverse-seams.json","0e3821bd9a51f8961153416df12af8c4f0dcc5327a624daa781040532e6d3865"),
    "eq":("W",RUNTIME+"source-full-mean-equations.mjs","2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76"),
    "pressure":("W",RUNTIME+"source-pressure.mjs","fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f"),
    "potential":("W",RUNTIME+"source-temporal-potential.mjs","c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8"),
    "ci":("W",RUNTIME+"source-global-pressure.mjs","c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4"),
    "compact":("W","continuation106/high-compact-mode-one/compact-mode-one-c15.json","00fd9f3b53554f4afb369bab8d667d093c3ec7a00b0370eb06a945b0697d8884"),
    "protected":("W","continuation122/repeat-postfive-mean/protected-postfive-source.json","83e2ae7c57ee51633c23df4e58ea81ec77b72e214970d4cf93d484e3f4738831"),
    "leanSource":("X","MathScopeCompute-Continuation22/research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/SignedStressEnergyGate.lean","53c4c235aeb8922fa149c77d97698aa72ad0eef674f0ab314cba9374d6e66ff2"),
    "leanGitHub":("W","continuation127/lean-success.json","2f3cda9840406116f106f0f8cb3b1f313e1d92a0fbafe16d6c08fb3837baeba4"),
}
T=(0,0,1,0)
ZT=(0,1,1,0)


def load(a):
    d={}
    for key,(root,rel,sha) in PINS.items():
        path={"G":a.goal,"W":a.work,"X":a.work.parent}[root]/rel
        raw=path.read_bytes()
        assert sha256(raw).hexdigest()==sha,path
        if path.suffix==".json":
            d[key]=json.loads(raw)
        elif path.suffix==".py":
            d[key]=runpy.run_path(str(path))
        else:
            d[key]=raw.decode()
    return d


def bind(d):
    f=d["frontier"]["actualSource"]
    assert f["potential"]==22150943 and f["pressureZ"]==22031648
    assert f["centeredAxialSource"]==22032008
    protected=d["protected"]
    assert protected["nodes"]["22150943"]["args"][0]=="coupled-expression:1329"
    assert protected["sourceSHA256"]==d["fourier"]["stream"]["sha256"]
    assert d["leanGitHub"]["databaseId"]==44689157294 and d["leanGitHub"]["conclusion"]=="success"
    assert any(s["name"]=="Compile and record proof assumptions" and s["conclusion"]=="success"
               for job in d["leanGitHub"]["jobs"] for s in job["steps"])
    assert "theorem late_centered_radial_derivative" in d["leanSource"]
    assert "(ha : psi a = 0) (hb : psi b = 0)" in d["leanSource"]
    assert "theorem late_centered_fast_time_cancel" in d["leanSource"]
    assert "(hAnchoredInverse" in d["leanSource"]
    assert 22032008 in d["fourier"]["source"]["originalLateCenteredSources"]
    assert d["fourier"]["source"]["commonTorusArguments"]==[17745430,17745431]
    assert d["fourier"]["source"]["fixedWholeRadialEndpoints"]==[17743711,17743713]
    assert d["fourier"]["source"]["radialDerivativeOfShift"]==17745446
    assert d["fourier"]["tail"]["uniformPointwiseFourierTail"]=="<25*K^(-1/2)*(||f||_2+||L^2 f||_2/36)"
    bound={
      "eq":("De(G.add(G.mul(b,gamma),G.mul(beta,G0),G.mul(beta,gamma),W.rz),1)",
            "G.neg(G.mul(epsilon,lap(gamma)))",
            "Dz(G.add(G.mul(q(2),G0,gamma),G.pow(gamma,2),W.zz,pressure))",
            "G.neg(Dz(G.add(G.mul(b,gamma),G.mul(G0,beta),G.mul(beta,gamma),W.rz)))"),
      "pressure":("fixed-band-radial-shift-independent-of-Z-T-Y",
                  "G.simultaneousSubstitute(body,[R,...Y],[r,...shiftedY])"),
      "potential":("weighted=G.mul(R,gammaDesired)",
                   "rawPsi=G.div(G.sub(integrals.left,G.mul(chi,integrals.whole)),R)",
                   "realizedGammaFromFTC=G.div(radialNumerator,R)",
                   "gammaIdentity=globalGraphEqual(G,realizedGammaFromFTC,G.sub(gammaDesired,cutoffRemainder)",
                   "cutoffRemainder=G.div(G.mul(G.derivative(chi,R),integrals.whole),R)"),
      "ci":("ci=G.mul(power(Tg,baseIndex),power(band.geometry.Q,G.add(G.one,h)))",
            "radialFast=G.derivative(radialPrimitive,R)"),
    }
    for k,literals in bound.items():
        assert all(text in d[k] for text in literals),k


def selected_calculus(d):
    base=d["ops"]["calculus"]
    s=inspect.getsource(base)
    old_start=s.index("    old_data=")
    old_end=s.index("    def background",old_start)
    s=s[:old_start]+'''    fourier_inputs={}
    old_inputs=d["actualOld"]
    availability=d["availableCovariance"]

    def W(f,a):
        waveseen.add((f,a))
        if (f,a) not in availability:
            raise KeyError((f,a))
        assert (f,a) in allowed_W,(f,a)
        return NORM(availability[f,a],0,1,0)

    def old(f,a,compact=False):
        assert (f,a) in allowed_old,(f,a,compact)
        oldseen.add((f,a))
        row=old_inputs[f,a]
        e=Q(row["minEpsilon"])*EPS
        slow=sum(a[:3])
        n=NORM(e,Q(row["bandIntercept"])+3*slow,1,d["directRank"])
        if a[3] or compact=="directOnly":
            return n
        c=NORM(2*EPS if f=="beta" else EPS,
               (Q(7,2) if f=="beta" else Q(1,2))+3*slow,1,d["compactRank"])
        return add(n,c)

'''+s[old_end:]
    nonfast_start=s.index("    @cache\n    def nonfast")
    nonfast_end=s.index("    @cache\n    def desired_nonfast",nonfast_start)
    s=s[:nonfast_start]+'''    @cache
    def nonfast(f,a):
        # The complete radial flux and scalar radial viscosity are
        # integrated by the outer shifted FTC, not estimated inside.
        assert f=="z"
        forcing.add((f,a))
        z=shift(a,1)
        return add(scale(gamma(shift(a,2)),e=EPS),
                   scale(flux("z",z,False),e=EPS),
                   scale(gamma(shift(a,1,2)),e=3*EPS),
                   scale(p_far(a),e=EPS))

    @cache
    def radial_source(a):
        return add(Zflux(a),scale(radial(gamma,a),e=EPS))

    @cache
    def inverse_field(label,f,a):
        if a[2]:
            inverse_field(label,f,(a[0],a[1],0,a[3]))
        b=shift(a,3,2)
        left,right=f(a),f(b)
        fourier_inputs[label,a]=(left,right)
        return scale(add(scale(left,m=Q(85,6)),scale(right,m=Q(85,216))),s=1,m=96)

    def Q0(f,a):
        assert f=="z"
        return inverse_field("axialRemainder",lambda a:nonfast("z",a),a)

    def radial_direct(a):
        return inverse_field("radialFluxMinusRadialViscosity",radial_source,a)

'''+s[nonfast_end:]
    output_start=s.index("    for label,output in")
    s=s[:output_start]+'''    T=(0,0,1,0)
    ZT=(0,1,1,0)
    bT=add(scale(old("beta",T,compact="directOnly"),m=2),
           scale(radial_direct(ZT),e=EPS),
           scale(rad_weight(lambda a:Tchi("weightedDesiredNonfast",a),ZT,-1),e=EPS))
    gT=add(scale(old("gamma",T,compact="directOnly"),m=2),
           De(radial_direct,T,1),
           desired_nonfast(T),
           rad_weight(lambda a:cutoff_whole("weightedDesiredNonfast",a,additional_r=1),T,-1))
    aT=add(old_temporal_psi(T),radial_direct(T),
           rad_weight(lambda a:Tchi("weightedDesiredNonfast",a),T,-1))
    return {"betaT":bT,"gammaT":gT,"A_T_T":aT}, {"W":waveseen,"old":oldseen,
               "cutoff":cutoff,"primitive":primitive,"fourier":fourier_inputs,
               "background":bgseen}
'''
    env=base.__globals__
    loc={}
    exec(compile(s,inspect.getfile(base),"exec"),env,loc)
    fn=FunctionType(loc["calculus"].__code__,env)
    return fn(d)


def main(a):
    d=load(a)
    bind(d)
    f,c,o=d["frontier"],d["cov"],d["old"]
    limits=o["originalDirectionTable"]
    full_old={(r["field"],tuple(r["RZTL"])):r for r in limits["middle"]}
    allowed_old={(n,tuple(j)) for n,j in f["combinedOldMean"]}
    assert set(full_old)==allowed_old and len(full_old)==172
    direct_rank=max(limits["common"]["coefficientRanksInHOver2Pow128"])
    assert direct_rank==48629
    assert o["compactProfile"]["compactIndependentOfL"] and o["compactProfile"]["motionOfSRetained"]
    compact_rank=o["compactProfile"]["compactChargeInHOver2Pow128"]
    assert compact_rank==51307
    exact_cov={(n,tuple(j)) for n,j in f["combinedPostSignedCovariance"]}
    old_cov={(n,tuple(j)) for n,j in c["previouslyAttached"]}
    newer={(x["tensor"],tuple(x["RZTL"])) for x in c["newlyAttached"]}
    assert len(old_cov|newer)==86
    caps={key:(89999 if not key[1][2] else 99999) for key in old_cov|newer}
    assert all(x["wholePathEpsilonGrade"]=="99999/100000" for x in c["newlyAttached"])
    # T=0 C105 spatial donors were already charged under its common
    # coefficient-and-band debit. Positive-T rows have raw normalized caps.
    assert 2*(Q(1,2**100)+Q(128,2**32636))<Q(1,100000)
    restrictions={"late":{"demand":{"postSignedCovarianceOrders":sorted(exact_cov),
                                  "initialMeanOrdinaryInputOrders":sorted(allowed_old)}},
                  "actualOld":full_old,"availableCovariance":caps,"directRank":direct_rank,
                  "compactRank":compact_rank}
    rows,trace=selected_calculus({**d,**restrictions})
    assert trace["W"]<=caps.keys() and trace["old"]<=allowed_old
    assert max(map(sum,trace["cutoff"]))<=d["compact"]["cutoff"]["order"]==13
    norm=d["ops"]["encode"]
    inputs=[{"source":name,"RZTL":r,"f":norm(f),"L2f":norm(of)}
            for (name,r),(f,of) in sorted(trace["fourier"].items())]
    assert all(not j[2] or (n,(j[0],j[1],0,j[3])) in trace["fourier"]
               for n,j in trace["fourier"])
    normalized={name:norm(q) for name,q in rows.items()}
    for name,bound in normalized.items():
        assert 2*Q(bound["totalCoefficientChargeInHOver2Pow128"],2**128)<Q(1,100000)
        bound["epsilonAfterFiniteCoefficientDebit"]=str(Q(bound["epsilon"])-Q(1,100000))
    # Negative control for the endpoint hypotheses. For RF(r)=r on
    # [1,3] with evaluation at 2 and chi=1/2, the centered primitive
    # of the derivative is zero even though RF at the point is two.
    nonflat=Q(2-1)-Q(1,2)*(3-1)
    assert nonflat==0 and nonflat!=2
    return {"schema":"MathScope.C130.OriginalLateTemporalVelocityTShiftedFTC/1",
            "status":"CONDITIONAL_ORIGINAL_LATE_TEMPORAL_RADIAL_AXIAL_T",
            "actualSource":f["actualSource"],"pins":PINS,
            "sourceRoleCounts":{"postSignedCovariance":len(trace["W"]),"oldMean":len(trace["old"]),
                                  "pairedFourier":len(inputs)},
            "sourceW":sorted(trace["W"]),"sourceOldMean":sorted(trace["old"]),
            "unusedConservativeCovarianceWithoutNewInput":sorted((exact_cov-caps.keys())-trace["W"]),
            "shiftedPrimitiveRoles":sorted(trace["primitive"]),"cutoffRZT":sorted(trace["cutoff"]),
            "pairedFourierInputs":inputs,
            "normalizedTemporalT":normalized,
            "endpointControl":{"alpha":1,"R":2,"omega":3,"chi":"1/2","TchiD_rRF":str(nonflat),"pointRF":"2"},
            "lean":{"GitHubRun":d["leanGitHub"]["url"],"theorems":["late_centered_radial_derivative","late_centered_fast_time_cancel"],
                    "sourceInstantiation":"At each torus point use r -> R_factor(r)*F(r,Y+shift(r,R)); both endpoints vanish by the actual flat native support premise; the fixed static inverse is anchored on the projected mode."},
            "proof":"Apply the exact outer shifted Tchi to Dr of R times (full radial axial-momentum flux minus epsilon times Dr old gamma). The center and static inverse commute with shifts. Both projected endpoint traces vanish on the original flat native support, so the whole term is zero and the left tube is the pointwise term. Apply D_1 to the remaining shifted primitive to cancel the internal radial translation and retain the outer chi_R whole term.",
            "open":"The result is conditional on original ordinary chart/torus realization, fixed-label shifts and flat endpoint traces. The separate fresh FiveMap and complete post-Five/Repeat estimates remain unclosed.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=ArgumentParser()
    for key in ("work","goal","out"):
        p.add_argument("--"+key,type=Path,required=True)
    a=p.parse_args()
    answer=main(a)
    a.out.write_bytes((json.dumps(answer,indent=2)+"\n").encode())
    print(answer["status"],answer["sourceRoleCounts"],answer["normalizedTemporalT"])
