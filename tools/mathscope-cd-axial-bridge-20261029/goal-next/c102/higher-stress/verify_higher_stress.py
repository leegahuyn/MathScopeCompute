"""Authenticate six higher Signed stress arms and transfer original C4 field bounds."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import runpy
import sys


BASE = Path("primary-forced-join/active-n3-c5-binding")
BAND = BASE/"first-wave-guard-traces"
PINS = {
 "reader":(BASE/"spatial-readback/source_stream.py","2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb"),
 "cache":(BASE/"live-wave-gauge/signed/source_cache.py","909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f"),
 "exact":(Path("first-force-repair/verify_repaired_first_force.py"),"260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75"),
 "signed":(BAND/"first-forced-budget/signed-centered-flux/signed-pressure-flux.json","8debc1a74134334ab4aa1cac81e8e3cadf550f839b64283881e2e405d5734942"),
 "leading":(Path("c100/leading-stress/leading-stress.json"),"2d8db865ddc536ec129e5c66bf0c351bfccdc2cca9959d465d5b41fa47b4a4ff"),
}
MANIFEST="8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a"
REGISTRY="e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03"
STREAM="faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
XBOUND=17744284
ETA=17732775
RB=17743710
QACT=17732776


def pin(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return raw


class View:
    def __init__(self, stream):
        self.stream=stream

    def node(self,i):
        row=self.stream.record(i)
        return row["op"],row["args"]


def bind_source(S,E,defs,replay):
    assert defs[32019]["name"]=="CommonOriginalTimeCutoff"
    assert defs[32019]["parameters"]==[17732777] and defs[32019]["body"]==17732791
    assert defs[32019]["derivativeLimits"]==[128] and not defs[32019]["unspecifiedOracle"]
    assert S.args(QACT,"multiply")==[17732740,17732766]
    logq=17735156
    assert S.args(logq,"log_positive")==[QACT]
    actual_q_scaling=[
      (3,17743838,17743840,17727385),
      (2,17743844,17743846,17727322),
      (1,17743850,17743852,17727273)]
    for n,cut,power,radius_scale in actual_q_scaling:
        exp=S.args(power,"exp")[0]
        assert E.of(exp)==E.mul(E.scalar(2*n),E.of(9),E.of(logq))
        slot,actual,orders=S.args(cut,"actual_expression_partial")
        assert slot==32019 and orders==[0]
        assert E.of(actual[0])==E.mul(E.of(radius_scale),E.of(QACT))
    @cache
    def same_after_eta_substitution(left,right):
        if left==2:
            return right==ETA
        original,actual=S.record(left),S.record(right)
        cls,ref=original["op"],original["args"]
        if cls!=actual["op"]:
            return False
        val=actual["args"]
        def all_args(aa,bb):
            return len(aa)==len(bb) and all(same_after_eta_substitution(i,j) for i,j in zip(aa,bb,strict=True))
        if cls in ("rational","source_parameter","coordinate"):
            return ref==val
        if cls in ("add","multiply","maximum","minimum"):
            if all_args(ref,val):
                return True
            assert len(ref)==len(val)==2,(left,right,cls)
            return all_args(ref,val[::-1])
        if cls in ("inverse","sqrt_positive","exp","log_positive","smooth_piecewise","sine","cosine","ceiling","ceiling_nonnegative"):
            return all_args(ref,val)
        if cls in ("integer_power","source_step_derivative"):
            return ref[1:]==val[1:] and all_args(ref[:1],val[:1])
        if cls=="definite_integral":
            assert ref[1]==val[1] and ref[1]!=2
            return all_args([ref[0],*ref[2:]],[val[0],*val[2:]])
        if cls=="actual_expression_partial":
            if ref[0]!=val[0] or ref[2]!=val[2]:
                return False
            decl=defs[ref[0]]
            assert len(ref[1])==len(decl["parameters"]) and not decl.get("unspecifiedOracle",False)
            assert all(0<=r<=n for r,n in zip(ref[2],decl["derivativeLimits"],strict=True))
            return all_args(ref[1],val[1])
        if cls=="actual_natural_series":
            return ref[0]==val[0] and ref[3:]==val[3:] and all_args(ref[1:3],val[1:3])
        if cls=="actual_quadratic_root":
            return ref[:2]==val[:2] and ref[3:]==val[3:] and all_args(ref[2:3],val[2:3])
        if cls in ("actual_background_picard","actual_background_even_profile"):
            return ref[:2]==val[:2] and ref[4:]==val[4:] and all_args(ref[2:4],val[2:4])
        if cls=="actual_monotone_root":
            return ref[0]==val[0] and all_args(ref[1:],val[1:])
        raise AssertionError((left,right,cls,ref))
    rows=[]
    by_key={(row["order"],row["component"]):row for row in replay["rows"]}
    local=[
      ("theta",2,21999622, [17744332,17744336,17744341],[17744302,17744313,17744324],[17744285,17744304,17744317]),
      ("z",1,22000445,[17744447,17744451,17744456],[17744418,17744428,17744439],[17744402,17744420,17744432]),
    ]
    for component,e,raw,values,derivatives,integrals in local:
        full=E.of(raw)
        roots=set(values+derivatives)
        actual_polynomial={m:c for m,c in full.items() if roots.intersection(dict(m))}
        terms=[]
        for (n,cut,power,_),value,derivative,integral in zip(actual_q_scaling,values,derivatives,integrals,strict=True):
            row=by_key[n,component]
            end=28826 if (n,component)==(1,"theta") else 28824
            for node in (value,derivative):
                assert S.args(node,"smooth_piecewise")[:4]==[XBOUND,28814,end,0]
                assert S.args(node,"smooth_piecewise")[5]==0
            inside=S.args(value,"smooth_piecewise")[4]
            factor=S.args(inside,"multiply")
            assert 20 in factor
            quotient=factor[1] if factor[0]==20 else factor[0]
            denominv=17744290 if e==2 else 17744407
            assert E.of(quotient)==E.mul(E.of(denominv),E.of(integral))
            target=S.args(denominv,"inverse")[0]
            if e==1:
                target=S.args(target,"sqrt_positive")[0]
            assert E.of(target)==E.mul(E.scalar(2),E.of(XBOUND))
            materialized,binder,lo,hi=S.args(integral,"definite_integral")
            formal_integrand,formal_binder,formal_lo,formal_hi=row["forwardArgs"]
            assert (binder,lo,hi)==(formal_binder,formal_lo,XBOUND) and formal_hi==4756
            if component=="theta" and n>1:
                left=S.args(formal_integrand,"multiply")
                right=S.args(materialized,"multiply")
                weight=next(i for i in left if E.of(i)==E.mul(E.scalar(2),E.of(binder)))
                assert weight in right
                formal_integrand=next(i for i in left if i!=weight)
                materialized=next(i for i in right if i!=weight)
            assert same_after_eta_substitution(formal_integrand,materialized), (n,component,formal_integrand,materialized)
            if n==1:
                historical_slot,historical_params,historical_orders=S.args(formal_integrand,"actual_expression_partial")
                assert historical_params==[formal_binder,2] and historical_orders==[0,0]
                assert S.args(materialized,"actual_expression_partial")==[historical_slot,[binder,ETA],[0,0]]
            else:
                assert S.args(formal_integrand,"smooth_piecewise")[:4]==[formal_binder,28814,28824,0]
                assert S.args(materialized,"smooth_piecewise")[:4]==[binder,28814,28824,0]
            terms.append(E.mul(E.of(cut),E.of(power),E.add(E.of(derivative),E.mul(E.scalar(e),E.of(value),E.inv(E.of(RB))))))
            rows.append({"physicalOrder":n,"component":component,"sourceValue":value,"raisedRDerivative":derivative,
                         "actualTimeCutoff":cut,"actualQPower":power,"literalExponentInH":2*n,
                         "originalFormals":[formal_binder,2],"actualOperands":[binder,ETA],
                         "activeIntegral":integral,"outerEndpoint":end,"pairedStructuralSubstitution":True,
                         "wholeConservativeReduction":row["exactWholeReduction"]})
        expected=E.neg(E.mul(E.of(17732744),E.of(17732886),E.add(*terms)))
        assert len(actual_polynomial)==6 and actual_polynomial==expected
    return {"rows":rows,"linearHigherStressMonomialsMatched":12,"fullHaarResiduals":[21999622,22000445],
            "baseTimeCutoff":32019,"fullGraphNativeRawArgumentPairsLexical":len(rows),
            "pairedNodesChecked":same_after_eta_substitution.cache_info().currsize,"sourcePhysicalOrder":[3,2,1]}


def author_caps(replay,fields,signed,leading):
    assert replay["etaIndependent"] and replay["sourceTf"]==128 and replay["lowerOuterLogGap"]==127
    assert replay["lowerInnerLogDistance"]=="t1/128"
    assert [row["component"] for row in replay["rows"] if row["exteriorZeroAfter"] is None]==["theta"]
    assert {row["exactWholeReduction"] for row in replay["rows"]}=={0}
    assert fields["derivativeOrder"]==4 and fields["logCap"]=="H/2^288"
    assert all(x["sign"]==-1 for row in fields["rows"] for x in row["fields"].values())
    assert signed["actualAngularN1TerminalBound"]["actualB"]==17717057
    assert signed["actualAngularN1TerminalBound"]["terminalTthetaOneCoefficient"].startswith("2^-64993 * Xb")
    chart=signed["compactInitializedFiveMapAttachment"]["mixedRZTChartAndCutoffCoefficientBitsThrough7"]
    assert (chart["sOrdinary"],chart["etaOrdinary"],chart["sScaleOrdinary"])==(85,90,89)
    assert leading["weightedLeadingC2"]["collars"][1]["poleByOrdinaryOrder"]==[3,6,9]
    assert replay["cutoff"]["formula"]==["chi(s)=1-sigma_1(2s-1)"]*3
    euler=[]
    for table in replay["cutoff"]["finiteEulerRows"]:
        values=[sum(Q(c)*Q(1,64)**j for j,c in enumerate(row["polynomialInSourceH"])) for row in table]
        assert max(values)<2**22
        euler.append([str(v) for v in values])
    # D is a common unweighted raw profile cap, log D below H/2^288.
    # X <= Renv^2 and X^-1 <= Renv on the positive stress supports.
    # This chart includes the original one-sided eta traces through C4.
    assert 2**16 * 16 < 2**24                  # undo E=sqrt(2X) F and VOverR; leading v uses the U0 average
    assert 2**48 * 2**16 * 16 < 2**70         # at most eight ordered convection products plus the linear terms
    assert 2**70 * 2**4 * 2**16 * 4 < 2**96  # angular weight, integration or FTC, and positive reciprocal
    assert 96+360+524+4+4 < 1024             # X/eta pullback, Euler weight, R^e and product rule
    assert 40 < 4096
    d,u,t,width=Q(1,32),Q(1,128),Q(1,128),Q(2)
    inner=512*u*u+8*t*(u/(width-t*u))**3
    outer=512*d*d+2*t**2*(d/(width-d))**3
    assert inner<1 and outer<4
    assert 1/u**2+4/d**2==20480 and Q(2,3)*30720==20480
    # With 6 active terms and one of the three profiles of the original T0,
    # the strict complement/log hierarchy H > Bnorm^511/2 pays this charge.
    assert 1024+30720+3<65536
    assert (65536+16) * 2**257 < 2**(4096*510)
    assert Q(1,2**257)+2*Q(1,2**288) < Q(1,2**256)
    return {
       "normalizedUnweightedCoefficientCapBeforeQ":"2^1024*Renv^40*D^2",
       "baseProfileLogCap":"H/2^288",
       "fixedSlowEulerPolynomialsAtHMax":euler,
       "threeRegions":[
          {"domain":"u<=1/128","higherStress":"exactly zero by literal support",
           "leadingZetaPoleThrough2":[0,3,6]},
          {"domain":"d<=1/32","higherStress":"only original n=1 theta remains",
           "terminalZetaPoleThrough2":[3,6,9]},
          {"domain":"u>1/128 and d>1/32","higherStress":"all six terms included",
           "inverseZetaCap":"2^30720","logCoefficientCap":"H/2^256"}],
       "collarPrimitiveLogSlopeRationals":[str(inner),str(outer)],
       "higherEpsilonMinimum":"3","fullStressEpsilonMinimum":"1",
       "weightedFullStressLocalRFComponentPoleAtMost":9,
       "scope":"The whole stress portion of the original weighted local radial flux through ordinary RZT order two. This leaves the covariance, time, axial and pressure pieces of actual Sigma to the separate joined transfer."}


def main(a):
    assert __debug__
    for name,(path,digest) in PINS.items():
        pin(a.goal/path,digest)
    sys.path[:0]=[str((a.goal/PINS[name][0]).parent) for name in ("reader","cache")]
    import source_stream
    import source_cache
    stress_pins={}
    def data(name):
        raw=getattr(a,name).read_bytes()
        stress_pins[name]=sha256(raw).hexdigest()
        return json.loads(raw)
    support,fields=data("support"),data("fields")
    signed=json.loads(pin(a.goal/PINS["signed"][0],PINS["signed"][1]))
    leading=json.loads(pin(a.goal/PINS["leading"][0],PINS["leading"][1]))
    caps=author_caps(support,fields,signed,leading)
    Exact=runpy.run_path(str(a.goal/PINS["exact"][0]))["Exact"]
    root=a.artifact/"first-correction-spatial-source"
    manifest=json.loads(pin(root/source_stream.MANIFEST,MANIFEST))
    N=source_stream.Native(root,manifest)
    assert N.pin==REGISTRY
    defs=json.loads(N.base_snapshot["base"]["expression"])
    S=source_cache.load(source_stream,root,manifest,22153782,a.cache)
    try:
        assert (S.verify["nodes"],S.verify["sha256"])==(22155584,STREAM)
        native=bind_source(S,Exact(View(S)),defs,support)
    finally:
        S.__exit__()
    proof={"schema":"MathScope.C102.OriginalFullSignedStressWeightedLocalFlux/1",
          "status":"VERIFIED_NATIVE_BINDING_CONDITIONAL_FULL_ORIGINAL_STRESS_LOCAL_FLUX",
          "source":native,"sourceRecords":22155584,"caps":caps,
          "pins":{**stress_pins,**{k:r[1] for k,r in PINS.items()}},
          "finalJets":0,"release":"HOLD"}
    a.out.write_bytes((json.dumps(proof,indent=2)+"\n").encode())
    print("PASS all six native higher Signed stress rows and the leading/true outer/complement weighted C2 transfer")


if __name__=="__main__":
    cli=ArgumentParser(description=__doc__)
    for name in ("goal","artifact","cache","support","fields","out"):
        cli.add_argument("--"+name,type=Path,required=True)
    main(cli.parse_args())
