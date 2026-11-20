"""Replay the whole-chart value estimate for the protected Repeat eikonal."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path

GEOMETRY = "primary-forced-join/active-n3-c5-binding/first-wave-guard-traces/first-forced-budget/geometry/outer-forced-geometry.json"
PINS = {
    "band": "a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b",
    "background": "1833785fc21ad6c73029361d6d6a44b2bb0baa099d57986709114093a53de9cc",
    "chart": "ba0830ec36ca4dcd8c7c9709e868a4523b938afc4ed0c97cb9ddbfbb160b823c",
    "radial": "789ebac9d163f4170581078e2a73e85cb4703582155d7ae8e71846915b6b08fc",
    "guards": "2b37b73515aff09625b0b8e8e433a651cfaf8ad3bfd273befa3eb6485b1006d8",
    "geometry": "e97b1f2055965d91455ad44d709eeed3cc02cd69d6f989f73471de80213a0291",
    "pulse": "d17ce2cd317c62775c5208b2c75efab78a6e962f2c4539c2da1091c92a3e17c7",
    "support": "4d9c3154390b57f5ac498ef90dbce34d22ae45171a830cfb70a8a3af5a67bd46",
    "reference": "7f4db7e44f838f60e0ae27e9df8cbdd67fe6c41b154ea2dad11a810399ea079f",
    "joint": "411d526087ae7aa5e2fd281f1a10fb6b659cb390fc5da1004bdebd81f6d3a6b5",
    "delta": "b2eca297bde1beb0f736818ad3722341e160bfe7df47dab7dac9afbb422ee176",
}

def read(path,key,as_json=True):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],(key,path)
    return json.loads(raw) if as_json else raw.decode()

def main(a):
    band=read(a.band,"band",False)
    for source in (
        "ell=window.ell,Q=window.Q,S=G.pow(ell,2),epsilon=power(Q,h),k=G.ceiling(G.inv(G.sqrt(epsilon)))",
        "p=G.div(roundedInteger,k)", "pz=beta[1]", "G.mul(p,fields.F),G.mul(pz,fields.G)",
        "HR=G.derivative(phaseSpeed,R),HZ=G.derivative(phaseSpeed,Z),HT=G.derivative(phaseSpeed,T)",
        "G.mul(epsilon,v,G.sub(HT,G.mul(fields.G,HZ)))",
        "Ls=G.div(G.mul(q(2),r0),ci)", "lengthRatioBounds:[c.Lmin,c.Lmax]",
    ):
        assert source in band,source
    files=a.goal
    bg=read(files/"c106/background16/background-c16.json","background")
    chart=read(files/"c106/background16/chart16.json","chart")
    b=read(files/"c106/radial-b10/radial-b-c10.json","radial")
    guards=read(files/"c107/forced-mode-one-guards/mode-one-guard-geometry.json","guards")
    geo=read(files/GEOMETRY,"geometry")
    pulse=read(files/"c120/repeat-raw-pulse-and-projection/repeat-radial-operands.json","pulse")
    support=read(files/"c120/whole-k-order-support/whole-k-order-support.json","support")
    ref=read(a.reference,"reference")
    joint=read(a.joint,"joint")
    delta=read(a.delta,"delta")
    assert bg["derivativeOrder"]==16 and chart["atomDerivativeOrder"]==17
    assert chart["totalDirections"]==969 and bg["inputs"]["chartSHA"]==PINS["chart"]
    assert bg["comparison"]["sign"]==-1 and "Original physical F/G pointwise" in bg["use"]
    assert "qBig/64 <= q < qBig/16" in bg["use"] and "Positive orders n>=4 vanish" in bg["use"]
    assert b["normalizedB"].startswith("b/epsilon=") and b["ordinaryDerivativeOrder"]==10
    assert b["originalLiveSlabThresholdComparison"]==-1 and b["analyticSourceConditionsRetained"]
    assert guards["pins"]["radialBC10"]==PINS["radial"] and guards["pins"]["geometry"]==PINS["geometry"]
    assert pulse["sourceStreamSHA256"]==delta["protectedSource"]
    assert pulse["registrySHA256"]==delta["protectedNativeRegistry"]
    keys={f"{i}:{s}" for i in range(5) for s in (-1,1)}
    assert {r["chart"] for r in pulse["protectedPulseCoordinateChecks"]}==keys
    assert all(r["effectiveCiNVOne"] and r["affineLVZero"] and r["affineNXiZero"]
               for r in pulse["protectedPulseCoordinateChecks"])
    assert {r["chart"] for r in geo["eikonalAndMeanTransport"]["exactSourceChecks"]}==keys
    assert support["background"]["allHigherOrdersExactlyFlatZeroFrom"]==4
    assert support["background"]["exactB1ThroughB4TimesQBig"]==[1,16,32,64]
    assert ref["pins"]["band"]==PINS["band"] and ref["referenceMap"]["s"]=="s/ratio"
    assert joint["exactGuard"] and set(ref["reducedEikonalCoefficients"])=={
        "Delta_R n_R","Delta_theta n_theta","Delta_z n_z","b n_R","eps v G Omega_Z","eps v Omega_T"}
    assert [ref["reducedEikonalCoefficients"][x] for x in ("b n_R","eps v Omega_T","eps v G Omega_Z")]==[1,1,-1]
    row=next(r for r in guards["phaseTransportRows"] if r["RZL"]==[0,0,0])
    terms=[tuple(map(Q,x)) for x in row["baselineGeometry"]]
    assert terms==[
        (1,4,0,1,0,1,0,0), # (b/epsilon) n_R
        (2,6,1,0,1,1,0,0), # v omega_T
        (2,6,2,0,1,1,0,0), # v G omega_Z
    ]
    assert guards["actualFixedPalette"]["carrier"].endswith("2/sqrt(epsilon)]")
    assert guards["actualFixedPalette"]["fixedTimeFactor"].endswith("1/S]")
    debit=Q(1,100000)
    # The original threshold implies B>=2^128, H>B^511/2 and
    # log B, log 2 <= H/2^128. Correct ceiling costs at most 4
    # for m=1,2. Terms use a common C_FG,b/epsilon <= exp(H/2^128).
    mass=sum(x[0] for x in terms)
    rank=6+2+(int(4*mass)-1).bit_length()
    assert mass==5 and rank==13
    assert 128*510>129  # H/2^128 > B >= log B.
    # ell <= 2L0, L0>=B^512 and 1/h<B give
    # log(S)/H < 12/(B^255) <= 12*2^(-32640).
    assert 128*255==32640 and Q(12,2**32640)<Q(1,2**32636)
    assert Q(rank,2**128)+Q(1,2**32636)<debit/2
    # On q/tau0 in [1/2,2] with both roots in [1/2,2],
    # Q/tau0 is in [1/4,4]. Thus -log(epsilon) >= H/2 from L0>=4.
    assert 2**(128*512)>=4 and Q(1)-Q(2,4)==Q(1,2)
    assert debit*Q(2**(128*511),4)>1  # Covers log(2) in the sum.
    base=Q(1,2)-debit
    delta_grade=Q(delta["epsilonGradeAfterFinalDebit"])
    assert base==Q(49999,100000) and delta_grade==Q(39994,100000)
    total=min(base,delta_grade)-debit
    assert total==Q(39993,100000)
    result={
        "schema":"MathScope.C123.OriginalProtectedRepeatWholeEikonalValue/1",
        "status":"VERIFIED_ORIGINAL_SOURCE_BINDING_CONDITIONAL_WHOLE_EIKONAL_VALUE",
        "pins":PINS,"protectedStream":delta["protectedSource"],"charts":sorted(keys),
        "requiredOriginalBackgroundValuesAndSlopes":["b/epsilon","G","F_T","G_T","F_Z","G_Z"],
        "backgroundScope":"All original admitted radial regions on qBig/64 <= q < qBig/16. Both chart brackets and original real flat source realization.",
        "originalFrozenGeometry":["p,p_z at fixed label and representative","0 <= v <= L_s <= L_max S","|n_R| <= Bnorm^4","m=1,2; mk <= 4/sqrt(epsilon)"],
        "baseline":{"scalar":"mk(b n_R + epsilon v (omega_T - G omega_Z))",
                    "absoluteBoundBeforeDebit":"20 Bnorm^6 S epsilon^(1/2) exp(2H/2^128)",
                    "coefficientRankInHOver2Pow128":rank,"bandDegree":1,"epsilonGrade":str(base)},
        "postFiveMeanIncrementEpsilonGrade":str(delta_grade),
        "combined":{"scalar":"mk(b n_R + epsilon v (omega_T - G omega_Z) + Delta dot n)",
                    "epsilonGrade":str(total),"finiteSumDebit":str(debit)},
        "pending":["Active Repeat application and true guard readback","Derivative estimates of the complete mean phase scalar",
                   "Full conservative, pressure and nonlinear residual estimates"],"finalJets":0,"release":"HOLD",
    }
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS original ten charts; baseline grade",base,"whole eikonal grade",total)

if __name__=="__main__":
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for name in ("goal","band","reference","joint","delta","out"):
        p.add_argument("--"+name,required=True,type=Path)
    main(p.parse_args())
