"""Original mode-two-only Haar contribution to early Signed T."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
from itertools import product
import json
from pathlib import Path


BASE_PATH = "continuation115/k2-radial-time-analytic/final"
BASE_PIN = "eaaeba91d9a62e83be10dd494943f36fd6e52616d6f187b094e1b3370b85b06a"
BASE_RECEIPT = "aa0068461cdfeda7a8ac77700a60a2695c811db8a79a5e9bd854f43e7f37b05a"
SIGMA_PATH = "continuation108/early-sigma-c6/final"
SIGMA_PIN = "d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f"
SIGMA_CODE = "f0dff0510af992c4f54115fcfb62daf4ea78bea9d77a8c8f54b2221b2ff4f6b8"


def pin(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return raw


def source(work, runtime):
    path=work/BASE_PATH/"verify_first_forced_t_transfer.py"
    pin(path,BASE_PIN)
    s=spec_from_file_location("c115_source_bound_time",path)
    base=module_from_spec(s)
    s.loader.exec_module(base)
    d=base.load({"work":work,"runtime":runtime})
    assert base.check_sources(d)
    sigma=json.loads(pin(work/SIGMA_PATH/"early-sigma-c6.json",SIGMA_PIN))
    conservative=pin(work/SIGMA_PATH/"verify_sigma_c6.py",SIGMA_CODE).decode()
    for fragment in ('C("rz",a)','scalar(V(sh(a,1)),eps=E)','scalar(bt(sh(a,2)),eps=E)','compact("v" if f=="theta" else "gamma",sh(b,2))'):
        assert fragment in conservative
    original=d["forced"]
    for fragment in ("partner:-row.m","at.get(-row.m).velocity[j]",
                     "waveRows=sumStateRows(G,old.waveRows,increment),covariance=exactAngularWaveCovariance"):
        assert fragment in original
    assert sigma["SigmaApplications"]==[22001223,22001224]
    assert sigma["incrementalPressureZ"]==22000443 and sigma["fixedRadialEndpoints"]==[17743711,17743713]
    assert "fixed endpoints" in sigma["pressure"] and "oriented short primitives" in sigma["pressure"]
    return base,d,sigma


def gauge_table(base,d,work):
    ledger=d["matrix"]["sharpBandDegreeAudit"]["exactDerivativeLedgers"]
    directions=sorted(a for a in product(range(4),range(4),range(2),range(4)) if a[0]+a[1]+a[3]<=3)
    assert len(directions)==40
    old=json.loads(pin(work/BASE_PATH/"first-forced-t-transfer.json",BASE_RECEIPT))
    prior={tuple(row["RZTL"]):row for row in old["modeTwo"]["directions"]}
    result={}
    for alpha in directions:
        j=base.slow(alpha)
        variants=base.variation(alpha,ledger)
        frame=max(row["positiveCoefficientBits"]+7*row["sourcePower"]+row["propagatorPower"]+6 for row in variants)
        log=2*(sum(d["frame"]["uniformLogRanks"])+64+128+1)+32+2*sum(alpha)+185+128+frame
        assert log < 2**16
        entry={"RZTL":list(alpha),"rawBand":3*j+11,"gaugeBand":str(3*j+Q(23,2)),
               "collarPole":3*j+13,"gaugePrefactorRankInHOver2Pow128":log,"orderedTerms":variants}
        if alpha in prior:
            assert entry==prior[alpha]
        result[alpha]=entry
    assert len(prior)==20 and (0,3,1,0) in result
    return result


def add(a,b):
    return tuple(x+y for x,y in zip(a,b,strict=True))


def curl_and_covariance_table(gauge):
    zero=(0,0,0,0)
    R,Z,L=(1,0,0,0),(0,1,0,0),(0,0,0,1)
    cov=set(a for a in product(range(3),range(3),range(2),[0]) if a[0]+a[1]<=2)
    velocities={}
    pairing=[]
    for alpha in sorted(cov):
        j=sum(alpha[:3])
        for b in product(*(range(x+1) for x in alpha)):
            c=tuple(x-y for x,y in zip(alpha,b,strict=True))
            for role in (b,c):
                # D_r, D_z and the phase carrier are the actual cylindrical curl.
                feet=[add(role,offset) for offset in (zero,R,Z,L)]
                assert all(foot in gauge for foot in feet)
                p=max(gauge[foot]["collarPole"] for foot in feet)
                s=max(Q(gauge[foot]["gaugeBand"]) for foot in feet)
                assert p==3*sum(role[:3])+16 and s==3*sum(role[:3])+Q(29,2)
                velocities[role]=feet
        pairing.append({"RZTL":alpha,"epsilon":"99999/50000","band":3*j+29,"poleAfterZetaSquared":3*j+32})
    assert len(pairing)==12 and len(velocities)==12
    assert {row["RZTL"] for row in pairing}==cov
    need=(0,2,1,0)
    bound=next(row for row in pairing if row["RZTL"]==need)
    assert bound["band"]==38 and bound["poleAfterZetaSquared"]==41
    assert 2*Q(1,2**112)+Q(1,2**112)<Q(1,2**110)
    return pairing,velocities


def linear_dependency():
    # Six covariance names are treated independently. The actual C108
    # readback retained these roles in its conservative signed operators.
    # A whole/left primitive does not add a spatial derivative to its input.
    T=(0,0,1,0)
    Z=(0,1,0,0)
    theta={("rtheta",T),("thetaz",add(T,Z)),("thetaz",Z)}
    axial={("rz",T),("zz",add(T,Z)),("zz",Z),
           ("rr",add(T,Z)),("rr",Z),("thetatheta",add(T,Z)),("thetatheta",Z),
           ("rz",add(T,add(Z,Z))),("rz",add(Z,Z))}
    assert ("rz",(0,2,1,0)) in axial and all(a[2]<=1 for _,a in theta|axial)
    # Time derivatives falling on the cutoff or density require the Z-only
    # rows as well. No radial derivative of the covariance occurs when
    # differentiating the centered whole/left integral at fixed R.
    def lower_closure(rows):
        return sorted({(field, b) for field, a in rows for b in product(*(range(x+1) for x in a))})
    return {"theta":lower_closure(theta),"z":lower_closure(axial)}


def main(args):
    base,d,sigma=source(args.work,args.runtime)
    gauges=gauge_table(base,d,args.work)
    covariance,velocity=curl_and_covariance_table(gauges)
    requested=linear_dependency()
    needed={tuple(a) for case in requested.values() for _,a in case}
    assert needed<={row["RZTL"] for row in covariance}
    report={
        "schema":"MathScope.C116.FirstModeTwoOnlySignedTimeCovariance/1",
        "status":"ORIGINAL_MODE_TWO_HAAR_TIME_BLOCK_CONDITIONAL_LINEAR_SIGMA_TRANSFER",
        "pins":{"baseCode":BASE_PIN,"base":BASE_RECEIPT,"sigma":SIGMA_PIN,"sigmaCode":SIGMA_CODE},
        "gaugeRows":list(gauges.values()),
        "velocityRows":[{"RZTL":a,"sourceGaugeDirections":v} for a,v in sorted(velocity.items())],
        "covarianceRowsAllSixTensorComponents":covariance,
        "sameHarmonicSupport":"Original angular projection keeps only m+n=0. Mode two has no initialized Primary increment and no Mode One cross. The paired phase and its T derivative cancel at fixed source chart.",
        "conditionalCovarianceLogCap":"H/2^110",
        "linearModeTwoSigmaT":{"nativeSigmaRoots":sigma["SigmaApplications"],
            "sourceOrders":requested,"largestCovarianceTimeDirection":[0,2,1,0],
            "pressureZ":sigma["incrementalPressureZ"],"centeredRho":sigma["normalizedBumpRoot"],
            "origin":"The isolated block enters the same direct radial flux, axial covariance flux, radial pressure density, and whole signed moments. The compact time source and products of the initialized means are held separately.",
            "scope":"On the collars the original oriented short primitives retain both Gaussian powers. Away from them the original fixed whole/left radial domain and cRho*P product are retained."},
        "openSeparateMean":["v_TT","gamma_TT","beta_TT"],
        "notWholeSignedTime":True,"finalJets":0,"release":"HOLD"}
    args.out.write_bytes((json.dumps(report,indent=2,ensure_ascii=False)+"\n").encode())
    print("PASS: 40 Mode Two gauge rows; all six Haar components at 12 directions including true TZZ; isolated Sigma time dependency")


if __name__=="__main__":
    p=ArgumentParser()
    for key in ("work","runtime","out"):
        p.add_argument(f"--{key}",type=Path,required=True)
    main(p.parse_args())
