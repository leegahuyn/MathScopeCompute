"""Replay all high transverse Primary covariance roles of the actual radial cofactor."""
from argparse import ArgumentParser
from hashlib import sha256
from itertools import product
from math import comb,prod
import inspect
import json
from pathlib import Path
import runpy

TRACE = "primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/"
GLOBAL = TRACE + "first-forced-budget/global-covariance-join/"
PRIMARY = TRACE + "initial-mean-norm/primary/"
PINS = {
    "demand":("work","continuation136/radial-mean-ordinary/replay1.json","63e1a3f97e8d89a05ec39271ef31965171e7e74948c4b405364b7af096bc84ef"),
    "reduced":("work","continuation136/radial-mean-reduced-envelope/replay1.json","eb79a9ab3e63889cf68edcc9d04082e1bb9594ad0a3b1f7e32a82ed4de7b991a"),
    "oriented":("work","continuation136/radial-mean-reduced/reduced-ordinary.json","1fcae2e2e3171f8e7d5049aede8e7ad06d54accb1a9b2ec2327b1cd9f079e507"),
    "cofactor":("work","continuation135/radial-mean-cofactors/native-mean-cofactors.json","d8e7199c846f822c554f569e555d2718ec38810851cd8ba8e224f7cc837d8cb3"),
    "fastMean":("work","continuation136/radial-mean-N/radial-mean-N.json","36ae6be1f5a5a5f172075c0ab6915bccf8a1a5b2c220e18791d9d44d84831ce4"),
    "oldL9":("work","continuation129/temporal-presigned-extra/original-primary-l9.json","12d869922e481f5468455a11b200d8d5faf75429be7fd0fc5381e262eb9f82eb"),
    "sourceBinding":("goal",GLOBAL+"verify_global_primary_covariance.py","303947e4f79f68c5eb72ffaf1ac380913d929cb92cd1e4a5718bb4e147841fca"),
    "actualSource":("goal",GLOBAL+"live-transverse-replay.json","958080d2e9444fbea108d8c51404d878e41e1512ee03543882442412a7aad742"),
    "globalBound":("goal",GLOBAL+"global-primary-covariance.json","05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e"),
    "protectedPrimary":("goal",PRIMARY+"primary-quotient-ledger.json","a72f12c82dd35106862cf6a874be1af79502a99d6de0e37e06db8794b66e5244"),
    "cutoff":("goal",PRIMARY+"verify_primary_quotient.py","f54f5f4cecdbcb3fa6fe8297afba0d679b8b65c4aae62a852288ec616c09bb74"),
    "frame15":("work","continuation106/frame15/frame-c15.json","09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8"),
    "joinedFrame":("work","continuation106/frame15/joined-c15.json","98e3fa519ab4e323373d8f0beb85029938ba7b4ede221af982524705fd590fd3"),
    "C11":("work","continuation106/high-compact-mode-one/primary-quotient-c11.json","595b67bd263d08a54ac25bc7dae5cdc108d050158b6c238e603c19e00704aec8"),
    "band":("runtime","mathscope-m3/navier/source-global-band.mjs","a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"),
    "curl":("runtime","mathscope-m2/navier/actual-full-curl.mjs","4276a850dbff4b5c357c47e1827eb7785b19c7e7c395c94ee4f22ef0c96d58d2"),
    "family":("runtime","mathscope-m2/navier/actual-common-admissible-family.mjs","7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75"),
    "frameSource":("runtime","mathscope-m2/navier/actual-covariance-matrix.mjs","7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26"),
}
PAIRS = {"rr":(0,0),"rtheta":(0,1),"rz":(0,2),"thetatheta":(1,1),"thetaz":(1,2),"zz":(2,2)}
# Terms in the actual imaginary curl after replacing C by chi times its
# transverse-independent quotient. Tuple = (transverse derivative of chi,
# largest additional ordinary derivative of the corresponding potential).
IMAG = (((0,1),),((0,1),(1,0)),((0,1),(1,0)))
REAL = ((0,0),)


def load(roots,k):
    kind,rel,expected=PINS[k]
    p=roots[kind]/rel
    data=p.read_bytes()
    assert sha256(data).hexdigest()==expected,(k,p)
    return runpy.run_path(str(p)) if p.suffix==".py" else json.loads(data) if p.suffix==".json" else data.decode()


def source(d, roots):
    raw=d["sourceBinding"]["source_binding"](roots["runtime"],d["actualSource"],d["protectedPrimary"])
    assert json.loads(json.dumps(raw))==d["globalBound"]["sameLiveCovariance"]
    assert d["actualSource"]["transverseCoordinate"]==17733037 and d["actualSource"]["cutoff"]==17733045
    assert d["actualSource"]["pins"]["stream"]=="faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
    assert [x["LxiUpper"] for x in raw["coverMatrices"]]==[1,3,9,27,81]
    assert all(x["LvExact"]==0 for x in raw["coverMatrices"])
    assert raw["slowDerivativeJacobian"]==["ratio^(1/2)","ratio^D","ratio"]
    assert raw["samePointCoordinates"]["preserved"]==["X","eta","q"]
    assert 'r0=q(1,1n<<34n)' in d["family"]
    assert 'w=[0,1].map(j=>G.covarianceValue(system,j,v,parameters))' in d["band"]
    assert 'parameters=[R,Z,T,Xrep,etaRep,sRep,ell]' in d["band"]
    assert 'actualMovingPulseFrame(G,{F:fields.F,FR:G.derivative(fields.F,R),GR:G.derivative(fields.G,R),R,epsilon,k,p,pz,x0,v,Ls,u,c0,lambda0,HR,HZ,sign})' in d["band"]
    assert 'n=[G.sub(x0,G.mul(v,HR)),G.div(p,R),G.sub(pz,G.mul(epsilon,v,HZ))]' in d["frameSource"]
    assert 'G.mul(radialFast,G.derivative(x,xi))' in d["curl"]
    assert 'G.dependsOn(radialFast,xi)' in d["curl"]
    assert 'remainder=[G.neg(axialDerivatives[1]),G.sub(axialDerivatives[0],radialDerivatives[2]),G.add(radialDerivatives[1],G.mul(ir,C[1]))]' in d["curl"]
    blocks={}
    for name,(a,b) in PAIRS.items():
        symbols={(x,y) for x,y in product(REAL,repeat=2)}
        symbols.update(product(IMAG[a],IMAG[b]))
        predicted={((u==0)+(v==0),u+v) for (u,_),(v,_) in symbols}
        actual=sorted((p for p in raw["sameLiveLocalBlocks"] if p["field"]==name),key=lambda p:p["sign"])
        assert [p["sign"] for p in actual]==[-1,1]
        assert all({tuple(x) for x in p["cutoffMonomials"]}==predicted for p in actual)
        blocks[name]=(symbols,actual)
    assert len(blocks)==6
    return raw,blocks


def cutoff(d):
    frame=d["frame15"]
    assert frame["matrixDirections"]==816 and frame["cutoffOrder"]==19
    assert d["joinedFrame"]["originalBackgroundOrder"]==16 and d["joinedFrame"]["regularTargetOrder"]==15
    assert all(len(frame["catalogue"][k])>=16 for k in ("squareRootWeight","tangent","weight"))
    o=d["cutoff"]["cutoff_constants"]
    code=inspect.getsource(o)
    assert code.count("maximum=9")==1
    new={}
    exec(compile(code.replace("maximum=9","maximum=19"),inspect.getfile(o),"exec"),o.__globals__,new)
    cap=new["cutoff_constants"]()
    for k,w in o().items():
        if isinstance(w,list):
            assert cap[k][:len(w)]==w
    bump=list(map(int,cap["bumpInDimensionlessOffset"]))
    assert len(bump)==20 and all(v*2**(34*j)<2**1536 for j,v in enumerate(bump))
    return bump


def shape_weights(d,j):
    rows=d["C11"]["weightedQuotientLedger"]["bounds"]
    branches=[r for r in rows if r["slowOrder"]==j and r["role"].startswith("velocity")]
    assert len(branches)==5
    assert all(x["totalLogPoleAfterG"]<=3*(j+1) for x in branches)
    w=d["globalBound"]["ordinaryDerivativeBudget"]["radialRows"][j]
    assert (w["innerPole"],w["outerPole"])==(6+3*j,9+3*j)
    assert (w["innerGaussian"],w["outerGaussian"])==("exp(-1/u^2)","exp(-4/d^2)")
    return w


def cutoff_products(symbols,bump,L):
    table=[]
    for a,b in sorted({(u,v) for (u,_),(v,_) in symbols}):
        ops=[]
        worst=0
        for i in range(L+1):
            start,end=a+i,b+L-i
            coefficient=comb(L,i)
            cap=coefficient*bump[start]*bump[end]*2**(34*(start+end))*81**L
            worst+=cap
            ops.append({"leftChi":start,"rightChi":end,"binomial":coefficient})
        assert sum(op["binomial"] for op in ops)==2**L
        assert worst.bit_length()<2*1536+512
        assert max(max(op["leftChi"],op["rightChi"]) for op in ops)==max(a,b)+L
        table.append({"startingChiDerivativeOrders":[a,b],"maxChiOrder":max(a,b)+L,
                      "exactTransverseLeibniz":ops,"log2IntegerCutoffCap":worst.bit_length()})
    return table


def rows(d,blocks,bump):
    demand=d["demand"]
    source_roles={(f,tuple(a)) for f,a in demand["initializedMeanPrimaryCovariance"]}
    requests=sorted((f,a) for f,a in source_roles if a[3]>8)
    known={(r["component"],tuple(r["RZTL"])) for r in d["oldL9"]["sourceRows"]}
    absent=set(requests)-known
    assert len(requests)==35 and len(known & set(requests))==6 and len(absent)==29
    assert absent=={(f,tuple(a)) for f,a in demand["aboveL8AbsentFromExactL9"]}
    controls={("W_rtheta",(0,0,0,10)),("W_rz",(0,0,0,10)),("W_rz",(0,1,0,10))}
    assert controls<=absent
    assert not demand["nonCovarianceAboveL8"]
    independent=sorted((f,a) for f,a in source_roles if sum(a[:3])>11)
    assert len(independent)==28 and not set(independent)&set(requests)
    assert max(a[3] for _,a in independent)==3
    out=[]
    for f,a in requests:
        r,z,t,L=a
        j=r+z+t
        terms,body=blocks[f.removeprefix("W_")]
        derivatives=list(product(*(range(x+1) for x in a[:3])))
        assert sum(prod(comb(n,k) for n,k in zip(a[:3],b,strict=True)) for b in derivatives)==2**j
        slow_frame=max(max(sum(c)+u,j-sum(c)+v)
                       for c in derivatives for (_,u),(_,v) in terms)
        assert slow_frame==j+1<=5
        cutoff=cutoff_products(terms,bump,L)
        assert max(row["maxChiOrder"] for row in cutoff)<=11
        poles=shape_weights(d,j)
        out.append({"component":f,"RZTL":a,"newBeyondC129":(f,a) in absent,
                    "protectedBothSignBlocks":body,"ordinaryCoefficientOrder":slow_frame,
                    "maximumChiOrder":max(row["maxChiOrder"] for row in cutoff),
                    "cutoffProducts":cutoff,"coverUpper":81**L,
                    "fixedLabelPole":{"inner":poles["innerPole"],"outer":poles["outerPole"]},
                    "asymptoticWeight":"zeta"})
    assert max(row["maximumChiOrder"] for row in out)==11
    return out,independent


def modular_join(d, high):
    reduced=d["reduced"]
    oriented=d["oriented"]
    assert reduced["schema"]=="MathScope.C136.ReducedOriginalRadialMeanOrdinary/1"
    assert reduced["pins"]["meanFrontier"][1]==PINS["oriented"][2]
    assert reduced["sourceRoots"]==[22001223,22001224,22000443]
    assert reduced["endpoints"]==[17743711,17743713]
    assert reduced["missingSigmaDirections"]==[] and len(reduced["sigmaDirections"])==33
    assert len(reduced["gaugeDirections"])==145 and len(reduced["postSignedW"])==251
    assert reduced["includedPriorOldMeanCount"]==349
    assert "upper endpoint" in oriented["outerOrientation"] and "locally zero" in oriented["wholeRadialCorrection"]
    assert oriented["counts"]["cutoffDerivativesAwayFromTransition"]==0
    assert len(oriented["targetDirections"])==14 and oriented["counts"]["inverseRHS"]==76
    assert oriented["counts"]["old"]==349 and oriented["counts"]["W"]==251
    modular=reduced["sigmaReceiptModularHull"]
    assert modular["primaryEnvelope"]=={"L":10,"T":2,"count":603,"slow":10}
    assert not modular["nonCovarianceAboveL8"]
    assert len(modular["primaryCovariance"])==2438 and len(modular["initializedMeanRows"])==717
    need={(name,tuple(a)) for name,a in modular["primaryCovariance"] if a[3]>8}
    additional={(name,tuple(a)) for name,a in modular["aboveL8AbsentFromExactL9"]}
    proven={(r["component"],tuple(r["RZTL"])) for r in high}
    source_ids={(r["component"],tuple(r["RZTL"])) for r in high if r["newBeyondC129"]}
    assert len(additional)==19 and additional<=source_ids and need<=proven
    assert all(sum(a[:3])<=10 for _,a in need)
    initial=d["cofactor"]["conditionalFiveMapCofactorTrace"]
    assert initial["freshFiveMapOnBothRadialCollars"]=="identically zero"
    assert "full integral is exactly zero" in initial["proof"]
    assert d["fastMean"]["status"]=="CONDITIONAL_FIXED_LABEL_ORIGINAL_POSITIVE_N_MEAN_COFACTOR"
    assert len(d["fastMean"]["positiveNOutputRows"])==18
    return {"status":"CONDITIONAL_ORIGINAL_ORDINARY_MEAN_COFACTOR_BOTH_RADIAL_COLLARS",
            "targetRZTL":oriented["targetDirections"],"ordinaryCofactorDirections":42,
            "positiveNPreviouslyAttachedDirections":18,"actualPostFiveMeanComponents":["beta","v","gamma"],
            "nonGaussianMeanPart":"smooth original background",
            "noncompactMeanAndOrdinaryDerivativeWeight":"zeta times finite radial pole",
            "FiveMapIncrement":"identically zero on both collars",
            "independentSigmaDonorDirections":len(reduced["sigmaDirections"]),
            "highTransverseModularRoles":sorted(need),"newHighTransverseModularRoles":sorted(additional),
            "modularOrdinaryAndTransverseEnvelope":modular["primaryEnvelope"],
            "orientedRecurrenceLocalInverseInputs":76,
            "ordinaryBeyond11OnSelectedModularRoute":False}


def main(roots):
    d={k:load(roots,k) for k in PINS}
    bound,blocks=source(d,roots)
    high,independent=rows(d,blocks,cutoff(d))
    modular=modular_join(d,high)
    return {
        "schema":"MathScope.C137.OriginalHighTransversePrimaryCovarianceCollars/1",
        "status":"CONDITIONAL_ORIGINAL_FIXED_LABEL_PRIMARY_L9_L10_COVARIANCE",
        "pins":PINS,"higherTransverseRoles":high,"nativeCover":bound["coverMatrices"],
        "countAboveL8":len(high),"countNewBeyondC129":sum(r["newBeyondC129"] for r in high),
        "countL10":sum(r["RZTL"][3]==10 for r in high),
        "maximumOrdinaryCoefficientOrder":max(r["ordinaryCoefficientOrder"] for r in high),
        "maximumChiOrder":max(r["maximumChiOrder"] for r in high),
        "maximumInnerPole":max(r["fixedLabelPole"]["inner"] for r in high),
        "maximumOuterPole":max(r["fixedLabelPole"]["outer"] for r in high),
        "independentSlowOver11OldConservativeCrop":independent,
        "ordinaryCofactorJoin":modular,
        "uniformEpsilonClaim":False,"fullSupportedRepeatC1Claim":False,"release":"HOLD",
    }


if __name__=="__main__":
    p=ArgumentParser()
    for k in ("work","goal","runtime","out"):
        p.add_argument("--"+k,type=Path,required=True)
    args=vars(p.parse_args())
    args["out"].write_bytes((json.dumps(main(args),indent=2,sort_keys=True)+"\n").encode())
