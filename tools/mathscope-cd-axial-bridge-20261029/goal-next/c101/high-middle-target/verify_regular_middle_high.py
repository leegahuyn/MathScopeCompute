"""Exact original raw middle target reduction through degree eleven."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import inspect
import json
from math import factorial
from pathlib import Path
import runpy


BUDGET=Path("primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget")
MIDDLE=BUDGET/"middle-covariance"
TARGET=Path("whole-k-annular-wrz-norm")
PINS={
    "recurrence": (MIDDLE/"replay_middle_coeff_log.py","4b74bcb4295d490879f1f320df9e00274a3664f15af491ee57555fa14979c438"),
    "previous": (MIDDLE/"middle-coeff-log.json","7b4283b548cf1139624f753657d30ab43cc97d2ce741ece4fd7e7616632c8986"),
    "sameBody": (MIDDLE/"wrapped-middle.json","4e08b2bbcf5ba20387a631e05e1eae15a857a3be56372c1106fde810d1797515"),
    "raw": (TARGET/"target-numerical/evaluate_target_middle.mjs","ec4f3703f3bd40bf91cc6369ab0451868c74d56be249f21acb8cf477358f7606"),
    "reduction": (TARGET/"target-numerical/target-middle-reduction.json","2afed7192b136698b4ff4df92cab416c372406736bae4292a2adc49eae6481b1"),
    "terminal": (TARGET/"target-numerical/terminal-amplitude-link.json","370f913b7f664b9e0f4cd289cc1970f946ce917620984db814f187df72e9d812"),
    "band": (BUDGET/"geometry/outer-forced-geometry.json","e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291"),
}
SENSITIVITY="f27ed95c3a1e40a4dfa4a38340d170aa92c7ec6102b277c952e1dc2dc91ac27c"
CHART="9ef9baa5136aeca25f7ef343d83d14a121e127949ec64a7cb03cc81590772efd"
CORE="d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815"
OUTER="5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9"
PROFILE="df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a"


def pinned(path,wanted):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==wanted,path
    return data


def source_check(raw,original):
    for clause in (
        "I=prefix('I',G.mul(q(2),X,F)),J=prefix('J',G.mul(q(2),X,U,F))",
        "S=prefix('S',G.sub(G.pow(U,2),G.mul(X,G.pow(F,2)))),Cp=prefix('Cp',G.pow(F,2))",
        "Pi=G.add(G.core.P0,Cp)",
        'W=G.sub(G.one,G.div(G.add(G.mul(q(2),c.D,eta,M),G.mul(d,G.derivative(M,eta))),X))',
        'thetaStock=G.neg(G.div(G.mul(F,X,W),L)),thetaMoment=G.div(angularNumerator,G.mul(q(2),X,L)),thetaShear=G.mul(q(2),X,G.derivative(F,X))',
        'zMoment=G.div(axialNumerator,G.mul(L,sqrt2X)),zShear=G.div(G.mul(q(2),X,G.derivative(U,X)),sqrt2X)',
    ):
        assert clause in original and clause in raw
    assert "const prefix = f => jet((r, e) => r ? f(r-1, e) : N.mul(Xb, f(0, e)))" in raw
    assert "factorials[e] * 32n**BigInt(e)" in raw


def extend(fn):
    src=inspect.getsource(fn)
    changes=(
        ("7**10 < 2**32","7**12 < 2**34"),
        ("assert F[2] == U[2] == 10","order = F[2]\n    assert order == U[2] and 11 <= order <= 12"),
        ("((1,0,10),(2,0,10),(24,0,10),(24,0,10),(1,0,10),(32,0,10))",
         "((1,0,order),(2,0,order),(30,0,order),(30,0,order),(2,0,order),(32,0,order))"),
        ("assert theta[2] == axial[2] == 9","assert theta[2] == axial[2] == order-1"),
        ("chart_degree = 122","chart_degree = 169"),
    )
    for old,new in changes:
        assert src.count(old)==1,old
        src=src.replace(old,new)
    ns={}
    exec(compile(src,inspect.getfile(fn),"exec"),fn.__globals__,ns)
    return ns["raw_middle"]


def pressure_datum(navier,terminal):
    core=pinned(navier/"actual-continuation-exact-core.mjs",CORE).decode()
    outer=pinned(navier/"actual-global-source-outer.mjs",OUTER).decode()
    profile=pinned(navier/"source-profile-data.mjs",PROFILE).decode()
    profile=json.JSONDecoder().raw_decode(profile.split("PINNED_N3 = ",1)[1])[0]
    p=profile["parametersExactExpressions"]
    assert p["K"]=={"power":[{"ref":"Pstar"},2]}
    assert p["Q"]["quotient"][0]["product"][1]=={"ref":"K"}
    assert p["Q"]["quotient"][1]=={"power":[{"ref":"sigmaStar"},2]}
    assert p["logCSelected"]["sum"][1]=={"power":[{"ref":"Q"},200]}
    assert "wait=log(Qb/Qp)/(1-h)>0" in terminal["proof"]["wait"]
    required=(
        "const stages=[];let y=z,logA=z;",
        "logA=sum(logA,delta(length))",
        "stage('initial',o,s=>sub(mul(q(1,10),s),mul(q(3,5),S(s))))",
        "stage('wait',wait,s=>mul(terminalSlope,s),z,terminalSlope)",
        "stage('terminal',q(3),s=>sum(mul(terminalSlope,s),d.log(div(fo(s),sub(o,rho)))),z)",
    )
    assert all(x in outer for x in required)
    formulas=(
        "f=G.inv(G.add(one,G.pow(eta,2))),logf=G.log(f)",
        "if(id==='initial'){delta=G.sub(G.mul(G.q(1,10),s),G.mul(G.q(3,5),primitive(s)));theta=one;}",
        "else if(id==='axialDecay'){delta=G.mul(G.q(-1,2),s);theta=one;}",
        "else if(id==='entry'){delta=G.sub(G.mul(G.q(-1,2),s),G.mul(lambda,primitive(s)));theta=one;}",
        "else if(['reservedPower','pulse'].includes(id)){delta=G.mul(alpha,s);theta=one;}",
        "delta=G.sub(G.mul(alpha,s),G.mul(G.log(two),cutoff));theta=G.sub(one,cutoff);",
        "else if(id==='angular'){delta=G.mul(alpha,s);theta=G.zero;}",
        "else if(id==='steepen'){delta=G.sub(G.mul(alpha,s),G.mul(G.sub(one,lambda),primitive(s)));theta=G.zero;}",
        "else if(id==='steepPower'){delta=G.mul(G.q(-3,2),s);theta=G.zero;}",
        "else if(id==='flatten'){delta=G.add(G.mul(G.q(-3,2),s),G.mul(G.sub(one,h),primitive(s)));theta=G.zero;}",
        "else if(id==='wait'){delta=G.mul(terminalSlope,s);theta=G.zero;}",
        "else if(id==='terminal'){delta=G.add(G.mul(terminalSlope,s),G.log(G.div(fo(s),G.sub(one,rho))));theta=G.zero;}",
        "stage.logAStart,delta,G.mul(theta,logf)",
        "initialInfinitePrefix=G.mul(G.q(5),G.pow(f,2))",
        "terminalInfiniteTail=G.div(G.exp(G.mul(two,last.logAEnd)),G.add(one,G.mul(two,h)))",
        "pressureOverPstarSquared=G.mul(G.q(-1,2),G.add(initialInfinitePrefix,...stages.map(x=>x.integral),terminalInfiniteTail))",
        "pressure=G.mul(G.pow(Pstar,2),pressureOverPstarSquared)",
    )
    assert all(x in core for x in formulas)
    assert Q(1,10)-Q(3,5)*Q(1,2)==-Q(1,5)
    assert Q(1,5)<Q(1,2) and (1-Q(1,64))**-2<2
    total_real=Q(5+2+2,2)
    enlarge=(1-Q(1,32)**2)**-2
    assert enlarge< Q(10,9) and total_real*enlarge<5
    assert 5*factorial(12)*32**12<2**96<2**260
    return {"source":"Original A.21 signed all-log-radius leading pressure with both tails",
            "inputK":"K=Pstar^2<CSelected",
            "actualCauchyRadius":"1/32","realEtaZeroBoundInK":str(total_real),
            "complexDensityFactorUpper":str(enlarge),
            "ordinaryEtaJetBound":"5*K*m!*32^m for every finite m",
            "independentOrdinaryC12Cap":"CSelected^2<Renv",
            "signedNegativePressureRetained":True,
            "normalizedSigmoidPremise":"Original real sigmoid lies in [0,1] and satisfies sigma(t)+sigma(1-t)=1."}


def verify(a):
    refs={name:pinned(a.goal/path,digest) for name,(path,digest) in PINS.items()}
    old,binding,reduction=(json.loads(refs[n]) for n in ("previous","sameBody","reduction"))
    chart=json.loads(pinned(a.chart,CHART))
    navier=a.runtime/"research-ide/mathscope-m2/navier"
    original=pinned(navier/"actual-covariance-sensitivity.mjs",SENSITIVITY).decode()
    P0=pressure_datum(navier,json.loads(refs["terminal"]))
    source_check(refs["raw"].decode(),original)
    same=binding["bindings"]["historicalMiddleComparisonToActiveT0"]
    assert [x["historicalCall"] for x in same]==reduction["actualTargetBodies"]==[117773,117774]
    assert [x["historicalBody"] for x in same]==[117771,117772]
    assert [x["activeBody"] for x in same]==[17732694,17732695]
    assert all(x["literalMatch"] and x["historicalLexicalSHA256"]==x["rebuiltLexicalSHA256"] for x in same)
    assert [x["activeArgs"] for x in same]==[[17732770,17732775]]*2
    assert reduction["verifiedRows"]==72 and reduction["verifiedFaces"]==288
    assert chart["combinedPointwiseFactor"]=="2^2288*Hc^168"
    assert "H=-h*log(tau0) > h*Bnorm^512/2 > Bnorm^511/2." in refs["band"].decode()
    original_fn=runpy.run_path(str(a.goal/PINS["recurrence"][0]))["raw_middle"]
    assert json.loads(json.dumps(original_fn((0,1,10),(0,1,10))))==old["targetBounds"]
    high=extend(original_fn)
    # The middle prefix starts at the axis, so all pure eta integrands must
    # be available on that path. Radial derivatives after the first use FTC.
    # Xa^-1<=Renv^2, Xb<=Renv^2, Renv>=2^4096. The independently
    # checked pressure datum C12 is below the enlarged Renv^32.
    assert factorial(12)<2**29
    assert 2*(12+1)+1<=30 and 2*12+2<=30
    assert 7**12<2**34 and 2288<4096
    rows=[]
    for order in (10,11):
        cap=high((0,1,order+1),(0,1,order+1))
        assert cap["theta"][2]==cap["axial"][2]==order
        assert cap["bothMiddleSlowEnvelopeDegree"]==2
        assert cap["bothMiddleSlowRenvDegree"]<256
        # D >= 1, log D <= Renv^4096. Use 2 and one more normalized reserve
        # for passage of the physical coefficient log to the original H.
        log_exp=4098
        assert log_exp+257<4096*511
        rows.append({"order":order,"inputLeadingOrdinaryOrder":order+1,"positiveRecurrence":cap,
                     "pointwisePhysicalLogPowerRenv":log_exp,"conditionalOriginalLogCap":"H/2^256"})
    return {"schema":"MathScope.C101.RegularMiddleStressC11/1",
            "status":"VERIFIED_SAME_BODY_MIDDLE_C11_REDUCTION_CONDITIONAL_HIGH_LEADING_INPUTS",
            "pins":{**{k:h for k,(_,h) in PINS.items()},"sensitivity":SENSITIVITY,"chart":CHART,
                    "pressureCore":CORE,"outerPhysicalSource":OUTER,"profile":PROFILE},
            "sourceRows":same,"ordinaryCapRows":rows,
            "domain":["log(X/Xa)>=t1/8","log(Xb/X)>=1/4","abs(eta)<=1","1/2<=s<=2"],
            "inheritedOriginalC9AbsoluteRecurrenceReplayed":True,
            "highInputBound":{"symbol":"D","logCap":"Renv^4096","includes":["F0","U0"],
                              "prefixPureEtaPath":"0<=X<=Xb",
                              "ordinaryPointwiseLeadingRemainder":"same actual selected F0/U0 up to total order 12"},
            "independentActualP0":P0,
            "innerAndOuterGuardOverlap":"Inner y/t1 in [1/8,1/4]; outer d in [1/4,1/2].",
            "scope":"Raw unweighted target and s multiplier at ordinary fixed-label derivatives. The companion inverse zeta costs <2^185 when only a pointwise multiplier is needed. Higher native FTC face evaluation and actual high leading enclosures remain separate.",
            "finalJets":0,"release":"HOLD"}


if __name__=="__main__":
    if not __debug__:
        raise RuntimeError("Verification requires assertions.")
    p=ArgumentParser()
    for name in ("goal","runtime","chart","out"):
        p.add_argument("--"+name,type=Path,required=True)
    a=p.parse_args()
    result=verify(a)
    a.out.write_text(json.dumps(result,indent=2)+"\n",encoding="utf8",newline="\n")
    print("Original exact middle C10/C11 targets:",[r["positiveRecurrence"] for r in result["ordinaryCapRows"]])
