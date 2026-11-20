"""Attach the original fixed-label Signed slow time derivative through its physical curl."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path

PRESSURE="c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4"
BAND="a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"
CURL="4276a850dbff4b5c357c47e1827eb7785b19c7e7c395c94ee4f22ef0c96d58d2"
C108="d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f"
C118="c484371659b9b10fea0808449e4ae6dbade3782cb1d0a79852a81056b8aa4bdd"
F15="09ba701341a49d681fbd607b762dcdc8d50a42763421c35484c34457fb27c2a8"
C107="449ced00be741aa9ed095a490a993ad728564776e62393ba75af49fbacfbca2a"


def read(p, expected):
    raw=p.read_bytes()
    assert sha256(raw).hexdigest()==expected, (p,expected)
    return raw


def data(p,sha):
    return json.loads(read(p,sha))


def bounds(a):
    mixed=data(a.sigma,a.sigma_sha)
    transverse=data(a.curl,a.curl_sha)
    p2=a.runtime/"research-ide/mathscope-m2/navier/actual-full-curl.mjs"
    p3=a.runtime/"research-ide/mathscope-m3/navier"
    pressure=read(p3/"source-global-pressure.mjs",PRESSURE).decode()
    band=read(p3/"source-global-band.mjs",BAND).decode()
    curl=read(p2,CURL).decode()
    assert "physicalR=G.mul(G.sqrt(band.geometry.Q),R)" in pressure
    assert "radialPrimitive=G.mul(power(Lambda,baseIndex),power(physicalR,dr))" in pressure
    assert "radialFast=G.derivative(radialPrimitive,R)" in pressure
    assert "baseEll=G.sub(ell,q(2)),baseIndex=paletteIndex(baseEll)" in pressure
    assert "phase=G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),epsilon),G.mul(x0,R)),G.mul(v,phaseSpeed))" in band
    assert "phaseDerivatives:{R:HR,Z:HZ,T:HT}" in band and "epsilon=power(Q,h)" in band
    assert "remainder=[G.neg(axialDerivatives[1]),G.sub(axialDerivatives[0],radialDerivatives[2]),G.add(radialDerivatives[1],G.mul(ir,C[1]))]" in curl
    assert "xi remaining in B" in transverse["transverseReduction"]
    assert "∂xi∂T C=chi'(xi)*B_T" in transverse["transverseReduction"]
    radial=transverse["originalRadialChart"]
    assert radial["sourcePressureModuleSHA256"]==PRESSURE
    assert radial["ordinaryCommutatorTR"]=="ZERO_ON_FIXED_NATIVE_LABEL"
    assert [x["radialFast"] for x in radial["localAndCommonReference"]]==[17735155,17745446]
    assert all(x["freeCoordinates"]==[17732737,17732748] for x in radial["localAndCommonReference"])
    assert transverse["curlTimeImaginary"]==[
        "-epsilon*Z_T(C_theta)/2",
        "(epsilon*Z_T(C_r)-R_T(C_z)-radialFast*xi_T(C_z))/2",
        "(R_T(C_theta)+radialFast*xi_T(C_theta)+C_theta_T/R)/2",
    ]
    assert mixed["nativeSigmaRoots"]==[22001223,22001224]
    assert mixed["mixedRZT"]==[[1,0,1],[0,1,1]]
    s0=data(a.goal/"c108/early-sigma-c6/early-sigma-c6.json",C108)["commonBound"]
    s1=mixed["mixedCommon"]
    pure=data(a.goal/"c118/pure-sigma-time-join/signed-pure-time-gauge.json",C118)
    frame=data(a.goal/"c106/frame15/frame-c15.json",F15)
    cut=data(a.goal/"c107/post-signed-gauge/signed-gauge-cutoffs.json",C107)
    assert pure["pureTimeGauge"]["gaussian"]=="sqrt(zeta)"
    assert frame["matrixDirections"]==816 and frame["cutoffOrder"]==19
    assert all(cut["GaussianReciprocal"][side][2]["extraPole"]==6 for side in ("inner","outer"))
    assert s0["epsilon"]==s1["epsilon"]=="1"
    assert s1["logCoefficientUnitsHOver2Pow128"]<=2**20
    # C106 normalized positive Gram and frame, C107 cutoff and C119
    # Σ make all four assignments of the two distinct derivatives. A
    # conservative finite rank also absorbs the factors from sums/shifts.
    base_band=max(Q(s0["band"]),Q(s1["band"]))
    gauge_band=base_band+Q(1,4)+6
    gauge_pole=max(s0["pole"],s1["collarPole"])+6
    gauge_rank=max(s0["coefficientInHOver2Pow128"],s1["logCoefficientUnitsHOver2Pow128"])+2**15
    assert (gauge_band,gauge_pole)==(Q(287,4),54)
    assert Q(gauge_rank,2**128)+gauge_band/2**32636<Q(1,2**107)

    # In the fixed-label chart n and n_T keep the C106 band slope. The
    # original radial fast coefficient is T-free. When the first
    # transverse derivative hits chi, use the same product estimate
    # before multiplication by chi, without division by a cutoff value.
    radial_cost=Q(1,100000)
    velocity_grade=min(Q(1)-Q(1,2),Q(1)-radial_cost)
    ordinary_band=gauge_band+3
    # Physical -epsilon*∂T of the phase includes epsilon*k*phi_T.
    # phi_T=-v*HT and the admitted time chart gives |v HT| <= C S^4
    # with the earlier finite coefficient reserves.
    time_grade=min(velocity_grade+1,velocity_grade+Q(1,2))
    full_band=ordinary_band+4
    full_rank=gauge_rank+2**15
    assert (velocity_grade,time_grade)==(Q(1,2),1)
    assert Q(full_rank,2**128)+full_band/2**32636<Q(1,2**106)
    return {
        "schema":"MathScope.C119.OriginalSignedNativePhysicalSlowTime/1",
        "status":"CONDITIONAL_ORIGINAL_SLOW_PART_OF_PHYSICAL_SIGNED_TIME",
        "pins":{"mixedSigma":a.sigma_sha,"curl":a.curl_sha,"band":BAND,"radialPrimitive":PRESSURE,
                "originalCurl":CURL,"frame":F15,"cutoff":C107},
        "mixedPhaseFreeGauge":{"epsilon":"1","gaussian":"sqrt(zeta)","band":str(gauge_band),
                               "collarPole":gauge_pole,"logCoefficient":"H/2^107"},
        "boundaryConditions":{"nativePulseAndTransverseHeldFixed":True,"radialFastTimeDerivativeZero":True,
                              "retainsMixedRAndZSlots":True,"transverseFactor":"∂xi∂T C=chi'(xi) B_T"},
        "normalizedPhysicalCurlTime":{"epsilon":str(velocity_grade),"gaussian":"sqrt(zeta)",
                                       "band":str(ordinary_band),"collarPole":gauge_pole},
        "physicalSlowTerm":{"original":"-epsilon ∂T of full Signed harmonic at fixed native representative",
                            "phaseCoefficient":"+i*epsilon*k*v*HT before real harmonic combination",
                            "epsilon":str(time_grade),"gaussian":"sqrt(zeta)","band":str(full_band),
                            "collarPole":gauge_pole,"middlePole":0,"logCoefficient":"H/2^106"},
        "open":"The independent native pulse derivative and complete same-body aggregate through the active Repeat guard on every chart.",
        "finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for flag in ("goal","runtime","sigma","curl","out"):
        p.add_argument("--"+flag,type=Path,required=True)
    for flag in ("sigma-sha","curl-sha"):
        p.add_argument("--"+flag,required=True)
    a=p.parse_args()
    result=bounds(a)
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS original Signed physical slow-time term",result["physicalSlowTerm"]["band"])
