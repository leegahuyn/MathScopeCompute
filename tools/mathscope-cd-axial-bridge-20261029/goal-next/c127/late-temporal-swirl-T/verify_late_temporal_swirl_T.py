"""Direct original Temporal swirl T transfer with its static anisotropic inverse."""
import argparse
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import runpy

NAV="continuation66/stage2/runtime-exact/research-ide/mathscope-m3/navier/"
PINS={
    "demand":("W","continuation126/late-swirl-time/replay.json","24591e84cd0c571fe18687b1884ea9def7945c3c6ece12dc51d3572b417dd34e"),
    "covariance":("W","continuation127/late-swirl-complete/complete-covariance.json","c555b0f627542dadc8674967bc4b3064541297a43e65c09e9d175221347d210f"),
    "old":("W","continuation127/late-swirl-complete/pre-signed-noncompact.json","b53565d7fbea00b6c391f62a2d755e3e544645b04a568f3247859c9d2e12b09f"),
    "vTTLL":("W","continuation127/sigma-rrt/old-v-ttl2.json","616b5cee7d992e8115f6438e69fc92c51496b193f9fe5484d746db7c79aba609"),
    "protected":("W","continuation122/repeat-postfive-mean/protected-postfive-source.json","83e2ae7c57ee51633c23df4e58ea81ec77b72e214970d4cf93d484e3f4738831"),
    "prior":("G","c108/mode-one-late-mean/late-mode-one-mean.json","b01790ea041aa3a5ad4d998e61c52aceb7cb0dd40bd6a68282ae74b03639ad41"),
    "covPrior":("G","c108/first-k1-energy/k1-donor-join.json","8684f3f27a56f46d4b70feaaf738104c091b2ca35f31ba014c7a0c55005aee59"),
    "time":("G","c117/noncompact-temporal-mixed/noncompact-temporal-mixed.json","75dae2662614f581f41ac7db09fe41dc01a0fed81cf7e0853f1fcfc3be5e4126"),
    "compact":("G","c116/mean-time-operands/mean-time-operands.json","3ec640563531208b18f019167174e7c39db1c744e937f834d313eeefafd86e14"),
    "fourier":("G","c110/k1-analytic-seams/directional-inverse-seams.json","0e3821bd9a51f8961153416df12af8c4f0dcc5327a624daa781040532e6d3865"),
    "ops":("G","c105/late-grade/verify_late_grade.py","b7df296fa485ae391e0d53762e58c6a9eb469f53842083acb5189e220d81c4cc"),
    "eq":("W",NAV+"source-full-mean-equations.mjs","2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76"),
    "pressure":("W",NAV+"source-global-pressure.mjs","c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4"),
    "current":("W",NAV+"source-global-current.mjs","b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36"),
    "band":("W",NAV+"source-global-band.mjs","a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"),
    "potential":("W",NAV+"source-temporal-potential.mjs","c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8"),
}
FOUR=((0,0,0,0),(0,0,0,2),(0,0,1,0),(0,0,1,2))
EXTRA=("v",(0,0,2,2))


def load(a):
    results={}
    for name,(root,rel,digest) in PINS.items():
        path=(a.goal if root=="G" else a.work)/rel
        raw=path.read_bytes()
        assert sha256(raw).hexdigest()==digest,path
        if path.suffix==".py":
            results[name]=runpy.run_path(str(path))
        elif path.suffix==".json":
            results[name]=json.loads(raw)
        else:
            results[name]=raw.decode()
    return results


def bind(d):
    known=d["protected"]
    assert known["nodes"]["22154876"]["args"]==[22150797,22151941]
    assert d["demand"]["roots"]["temporalSwirl"]==22150797
    assert d["fourier"]["stream"]["sha256"]==known["sourceSHA256"]
    assert d["fourier"]["source"]["originalLateCenteredSources"]==[22032006,22032008]
    assert d["fourier"]["source"]["nativeInverseNames"][2]=="ActualAfterSigned_theta_OriginalFastTime"
    assert d["fourier"]["source"]["radialShiftDirectionSecondComponent"]==17733068
    assert d["fourier"]["tail"]["exactFiniteModeControls"]==4224
    assert d["fourier"]["tail"]["uniformPointwiseFourierTail"]=="<25*K^(-1/2)*(||f||_2+||L^2 f||_2/36)"
    literals={
        "eq":("De(G.add(G.mul(b,v),G.mul(beta,V),G.mul(beta,v),W.rtheta),2)",
              "Dz(G.add(G.mul(G0,v),G.mul(V,gamma),G.mul(gamma,v),W.thetaz))",
              "G.neg(G.mul(epsilon,lapVector(v))),G.neg(De(stress[0],2))",
              "time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))"),
        "pressure":("baseEll=G.sub(ell,q(2)),baseIndex=paletteIndex(baseEll)",
                    "ci=G.mul(power(Tg,baseIndex),power(band.geometry.Q,G.add(G.one,h)))"),
        "current":("at=body=>G.simultaneousSubstitute(body,[q0,X,eta],[band.chart.qActual,band.chart.X,band.chart.eta])",
                  "fullOriginalStress=[background.normalizedBodies.Ttheta,background.normalizedBodies.Tz].map(x=>G.mul(stressScale,at(x)))"),
        "band":("epsilon=power(Q,h)", "TthetaTerms.push(G.mul(weight,sourceRoots.Ttheta))"),
        "potential":("deltaV=G.neg(G.div(inverseTheta,ci))",),
    }
    for name,markers in literals.items():
        assert all(t in d[name] for t in markers),name


def bounds(d):
    p=d["ops"]
    Norm,scale,add,mul,sh,leibniz,encode,E=(p[k] for k in (
        "NORM","scale","add","mul","shift","leibniz","encode","EPS"))
    supplied={}
    for f,a,value in d["prior"]["ordinaryMeanRows"]:
        supplied[f,tuple(a)]=value
    for row in d["time"]["middle"]+d["old"]["middle"]:
        supplied[row["field"],tuple(row["RZTL"])]=row
    assert EXTRA not in supplied
    extra=d["vTTLL"]
    assert extra["target"]=={"field":"v","RZTL":[0,0,2,2]}
    assert extra["compactContribution"].startswith("exactly zero")
    assert extra["conditionalLogCoefficientUnitsHOver2Pow128"]==26998
    supplied[EXTRA]=extra["directTemporal"]
    demand=d["demand"]["temporalT"]
    requested_means={(f,tuple(a)) for f,a in demand["oldInitializedMeans"]}
    assert requested_means<=supplied.keys() and len(requested_means)==65
    assert not demand["shiftedPrimitiveRoles"]
    assert {(f,tuple(a)) for f,a in demand["centeredForcings"]}=={("Etheta",a) for a in FOUR}
    requested_w={(f,tuple(a)) for f,a in demand["postSignedCovariance"]}
    assert requested_w=={(f,tuple(a)) for f,a in d["covariance"]["requiredCovariance"]}
    assert len(requested_w)==16
    assert Q(d["covPrior"]["conditionalResult"]["covarianceGrade"])>=Q(9,10)
    # C105 conservative old covariance cap. C125/C127 newer time rows
    # have a stronger unweighted grade and need no compensation here.
    older={(f,tuple(a)) for f,a in d["covariance"]["previouslyAttached"] if not a[2]}
    assert len(older)==8
    compact=d["compact"]["compactProfile"]
    assert compact["compactZeroOnBothSourceCollars"] and compact["compactIndependentOfL"]
    assert compact["motionOfSRetained"] and compact["compactChargeInHOver2Pow128"]<2**16
    ranks=d["old"]["common"]["coefficientRanksInHOver2Pow128"]
    assert max(ranks)<2**16
    assert max(d["time"]["common"]["coefficientRanksInHOver2Pow128"])<2**16
    assert d["prior"]["coefficientRankThroughAllMeanRows"]["whole"]<2**17

    used_w=set()
    used_mean=set()

    def w(f,a):
        used_w.add((f,a))
        assert (f,a) in requested_w
        return Norm(9*E//10,128,1,2**28) if (f,a) in older else Norm(E-1,0,1,0)

    @cache
    def mean(f,a):
        row=supplied[f,a]
        used_mean.add((f,a))
        slow=sum(a[:3])
        assert Q(row["coefficientMass"])<2**26
        ordinary=Norm(Q(row["minEpsilon"])*E,Q(row["bandIntercept"])+3*slow,1,2**17)
        if a[3]:
            return ordinary
        mean_compact=Norm(2*E if f=="beta" else E,
                          (Q(7,2) if f=="beta" else Q(1,2))+3*slow,1,2**17)
        return add(ordinary,mean_compact)

    def base(f,a):
        if a[3]:
            return None
        assert sum(a[:3])<=3
        return Norm(E if f=="b" else 0,0,1,2)

    def product_jet(f,g,a):
        terms=[]
        for b,c,k in leibniz(a):
            x,y=f(b),g(c)
            if x is not None and y is not None:
                terms.append(scale(mul(x,y),m=k))
        return add(*terms)

    b=lambda a:base("b",a)
    V=lambda a:base("V",a)
    G=lambda a:base("G",a)
    beta=lambda a:mean("beta",a)
    v=lambda a:mean("v",a)
    gamma=lambda a:mean("gamma",a)

    def flux_r(a):
        return add(product_jet(b,v,a),product_jet(beta,V,a),
                   product_jet(beta,v,a),w("rtheta",a))

    def flux_z(a):
        return add(product_jet(G,v,a),product_jet(V,gamma,a),
                   product_jet(gamma,v,a),w("thetaz",a))

    def radial_flux(a):
        # The four query directions differentiate neither a(R) nor R^-1.
        return add(flux_r(sh(a,0)),scale(flux_r(sh(a,3)),e=-1,c=1),
                   scale(flux_r(a),m=2,c=1))

    def vector_lap(a):
        # D_r² expands into R², 2a RL, a_R L, a² L².
        return add(v(sh(a,0,2)),scale(v(sh(sh(a,0),3)),e=-1,m=2,c=1),
                   scale(v(sh(a,3)),e=-1,c=1),scale(v(sh(a,3,2)),e=-2,c=2),
                   scale(v(sh(a,0)),c=1),scale(v(sh(a,3)),e=-1,c=2),
                   scale(v(sh(a,1,2)),e=2*E),scale(v(a),c=1))

    rows={}
    for a in FOUR:
        raw=add(scale(v(sh(a,2)),e=E),radial_flux(a),
                scale(flux_z(sh(a,1)),e=E),scale(vector_lap(a),e=E))
        rows[a]=raw
    assert used_w==requested_w
    assert used_mean<=requested_means and EXTRA in used_mean

    # Positive absolute inequality for the centered projection. The
    # norm constants apply with L2 Haar and need no L infinity loss.
    ordinary_f=rows[(0,0,1,0)]
    ordinary_l=rows[(0,0,1,2)]
    inverse=scale(add(scale(ordinary_f,m=Q(85,6)),scale(ordinary_l,m=Q(85,216))),s=1,m=96)
    remaining_fast=scale(v((0,0,1,0)),m=2)
    result=add(remaining_fast,inverse)
    norm=encode(result)
    rank=norm["totalCoefficientChargeInHOver2Pow128"]
    # Coarsen the raw H/2^100 covariance log by one explicit epsilon
    # debit on the directed slab. The finite S powers are retained.
    assert 2*Q(rank,2**128)<Q(1,100000)
    assert result.e>=9*E//10
    return {"sourceRows":[{"RZTL":a,"bounds":encode(x)} for a,x in rows.items()],
            "usedOldMean":sorted(used_mean),"conservativeOldMeanCount":len(requested_means),
            "unusedConservativeOldMeanRows":sorted(requested_means-used_mean),
            "usedPostSignedCovariance":sorted(used_w),
            "nativeSwirlT":{**norm,"epsilonAfterFiniteCoefficientDebit":str(Q(result.e-1,E))},
            "boundedInverseConstants":{"f":"85/6","L2f":"85/216","ciInverseBound":"96 S"},
            "retainedFastTerm":"-Pi_0(v_T)"}


def main(a):
    d=load(a)
    bind(d)
    norm=bounds(d)
    return {"schema":"MathScope.C127.OriginalLateTemporalSwirlSlowTimeBound/1",
            "status":"CONDITIONAL_DIRECT_ORIGINAL_TEMPORAL_SWIRL_T",
            "pins":PINS,"roots":{"actualTemporalSwirl":22150797,"centeredEtheta":22032006,"rawEtheta":22031277},
            "nativeTime":"fixed original label and torus, c_i independent of T",
            "stressProjection":"De_2 of the original background theta stress is independent of the two auxiliary torus variables, so Pi_0 removes it at both time orders.",
            "exactFastAndNonfastFormula":"partial_T delta v=-Pi_0 v_T - (1/c_i) N^-1 Pi_0 (partial_T Etheta_nonfast)",
            "weightedSourceAndTransfer":norm,
            "fourierTail":"C110 cutoff-K uniform tail <=25 K^(-1/2)(||f||_2+||L^2 f||_2/36) applies to both orders T^0 and T^1, on any common native compact on which these four source rows are jointly ordinary.",
            "differentiation":"Each finite static Fourier sum differentiates coefficientwise under Haar. Uniform paired tails for the values and derivatives let the one-dimensional FTC pass to the limit. The normalizing ci is frozen.",
            "scope":"Conditional on the original same-body joint ordinary source realization, all admitted labels, chart bounds and flat joins. No pointwise outer-endpoint extension, FiveMap angular increment, full pressure, Repeat closure or final jets.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    p=argparse.ArgumentParser()
    for f in ("work","goal","out"):
        p.add_argument("--"+f,type=Path,required=True)
    a=p.parse_args()
    out=main(a)
    a.out.write_bytes((json.dumps(out,indent=2)+"\n").encode())
    print(out["status"],out["weightedSourceAndTransfer"]["nativeSwirlT"])
