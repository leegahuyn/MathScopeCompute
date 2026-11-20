"""Verify first spatial derivatives of the protected Repeat background eikonal."""
from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path

PINS = {
    "baseline": "12aae9ad5d4faaee53643e8178065221010d0b132d5f0eda49bb50158967acf9",
    "guards": "2b37b73515aff09625b0b8e8e433a651cfaf8ad3bfd273befa3eb6485b1006d8",
    "pulse": "d17ce2cd317c62775c5208b2c75efab78a6e962f2c4539c2da1091c92a3e17c7",
    "pulseCode": "60ac8c18b7c7c2e8af30a0564c946ed3c354bad14039e3f8ccc6806bb4a2e903",
    "harmonic": "339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20",
    "lift": "4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e",
    "frame": "7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26",
    "repeat": "4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7",
    "band": "a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b",
    "background": "1833785fc21ad6c73029361d6d6a44b2bb0baa099d57986709114093a53de9cc",
    "radial": "789ebac9d163f4170581078e2a73e85cb4703582155d7ae8e71846915b6b08fc",
}

def read(path,key,as_json=True):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key],key
    return json.loads(raw) if as_json else raw.decode()

def check_source(path,key,fragments):
    source=read(path,key,False)
    for fragment in fragments:
        assert fragment in source,(key,fragment)

def mon(*f):
    return tuple(sorted(f))

def deriv(expr,d,native_v_depends_on_slow=False):
    out=Counter()
    for product,coef in expr.items():
        for j,atom in enumerate(product):
            if atom in {"eps","mk","x0"} or (atom=="v" and not native_v_depends_on_slow):
                continue
            out[mon(*product[:j],atom+d,*product[j+1:])]+=coef
    return {k:v for k,v in out.items() if v}

def main(a):
    root=a.goal
    navier=a.runtime/"navier"
    pulse_package=root/"c120/repeat-raw-pulse-and-projection"
    check_source(pulse_package/"verify_repeat_radial_operands.py","pulseCode",(
        "ORDINARY=(17732748,17732749,17732750)",
        "assert ensure_equal(e,e.dot(L,du),e.zero)",
        'assert not set(ORDINARY).intersection(free(case["v"])|free(case["xi"])|free(LENGTH))',
        '"affineLVZero":True',
    ))
    check_source(navier/"source-harmonic-assembly.mjs","harmonic",(
        "Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))", "Dz=x=>G.mul(epsilon,G.derivative(x,Z))",
    ))
    check_source(navier/"source-initialized-angular.mjs","lift",(
        "v=G.div(G.add(eta,r0),ci)",
        "localMap=body=>G.simultaneousSubstitute(atRepresentative(body),[band.cutoffs.xi,v],[lift.xi,lift.v])",
        "phase=localMap(prior.phase)",
        "G.div(R,G.sqrt(ratio)),G.div(Z,power(ratio,D)),G.div(T,ratio),ellReference,...Y",
    ))
    check_source(a.runtime.parent/"mathscope-m2/navier/actual-covariance-matrix.mjs","frame",(
        "n=[G.sub(x0,G.mul(v,HR)),G.div(p,R),G.sub(pz,G.mul(epsilon,v,HZ))]",
    ))
    check_source(navier/"source-global-band.mjs","band",(
        "HR=G.derivative(phaseSpeed,R),HZ=G.derivative(phaseSpeed,Z),HT=G.derivative(phaseSpeed,T)",
        "G.mul(epsilon,v,G.sub(HT,G.mul(fields.G,HZ)))",
    ))
    check_source(a.runtime/"post-signed-20261023/source-postfive-repeat-forced.mjs","repeat",(
        "geometry: template.lift.geometry, phase: template.phase, k: template.k",
        "G.expressionValue(system, initial.reference.values)",
    ))
    pulse=read(pulse_package/"repeat-radial-operands.json","pulse")
    baseline=read(a.baseline,"baseline")
    bg=read(root/"c106/background16/background-c16.json","background")
    radial=read(root/"c106/radial-b10/radial-b-c10.json","radial")
    guards=read(root/"c107/forced-mode-one-guards/mode-one-guard-geometry.json","guards")
    assert baseline["protectedStream"]==pulse["sourceStreamSHA256"]
    assert set(baseline["charts"])=={r["chart"] for r in pulse["protectedPulseCoordinateChecks"]}
    assert len(pulse["protectedPulseCoordinateChecks"])==10
    assert all(r["affineLVZero"] for r in pulse["protectedPulseCoordinateChecks"])
    assert all(guards["nativeGuardTriples"][r["chart"]][-1][0]==r["v"] for r in pulse["protectedPulseCoordinateChecks"])
    assert bg["derivativeOrder"]==16 and bg["comparison"]["sign"]==-1
    assert "qBig/64 <= q < qBig/16" in bg["use"]
    assert radial["ordinaryDerivativeOrder"]==10 and radial["originalLiveSlabThresholdComparison"]==-1
    assert radial["normalizedB"].startswith("b/epsilon=")
    base={mon("mk","eps","b0","x0"):1,mon("mk","eps","b0","v","HR"):-1,
          mon("mk","eps","v","HT"):1,mon("mk","eps","v","G","HZ"):-1}
    out_rows=[]
    for axis,order in (("R",[1,0,0]),("Z",[0,1,0])):
        actual=deriv(base,axis)
        original=Counter()
        for product,coef in [
            (("b0"+axis,"x0"),1),(("b0"+axis,"v","HR"),-1),
            (("b0","v","HR"+axis),-1),(("v","HT"+axis),1),
            (("v","G"+axis,"HZ"),-1),(("v","G","HZ"+axis),-1),
        ]:
            original[mon("mk","eps",*product)]+=coef
        assert actual==original
        bad=deriv(base,axis,native_v_depends_on_slow=True)
        assert bad!=actual and len(bad)==len(actual)+3
        row=next(r for r in guards["phaseTransportRows"] if r["RZL"]==order)
        terms=[tuple(map(Q,x)) for x in row["baselineGeometry"]]
        assert terms==[(1,4,0,1,0,1,0,0),(2,6,1,0,1,1,0,0),
                       (2,6,1,1,1,1,0,0),(4,6,2,0,1,1,0,0)]
        assert row["baselineLogRank"]==12
        out_rows.append({"axis":axis,"signedExpandedMonomials":[[*k,v] for k,v in sorted(actual.items())],
                         "sourceGroupCount":5,"fakeSlowVAddsTerms":len(bad)-len(actual),
                         "positiveC107Terms":row["baselineGeometry"]})
    eps_debit=Q(1,100000)
    rank=6+2+(4*9-1).bit_length()
    assert rank==14 and Q(rank,2**128)+Q(1,2**32636)<eps_debit/2
    r=Q(1,2)-eps_debit
    z=r+1
    assert (r,z)==(Q(49999,100000),Q(149999,100000))
    result={
        "schema":"MathScope.C124.OriginalProtectedRepeatBackgroundEikonalFirstDerivative/1",
        "status":"VERIFIED_DERIVATIVE_SHAPES_CONDITIONAL_ADMITTED_PHYSICAL_FIRST_DERIVATIVES",
        "pins":PINS,"protectedSourceSHA256":baseline["protectedStream"],"charts":baseline["charts"],
        "nativeCoordinates":{"v_R":0,"v_Z":0,"Lv":0,"L_of_n_and_pure_background_eikonal":0,
                             "D_r":"partial_R+a L","D_z":"epsilon partial_Z"},
        "ordinaryRequestedJets":["F_RR","G_RR","F_RZ","G_RZ","F_TR","G_TR",
                                 "F_TZ","G_TZ","F_ZZ","G_ZZ","G_R","G_Z","(b/epsilon)_R","(b/epsilon)_Z"],
        "ordinaryRows":out_rows,"ordinaryBoundPreDebit":"36 Bnorm^6 S exp(2H/2^128) sqrt(epsilon)",
        "coefficientRankInHOver2Pow128":rank,"bandDegree":1,
        "ordinaryFirstDerivativeEpsilonGrade":str(r),
        "normalizedPhysicalEpsilonGrades":{"D_r":str(r),"D_z":str(z)},
        "normalFirstPartials":{"radial":"-v omega_Ralpha", "azimuthal":"-1_(alpha=R) p/R^2","axial":"-epsilon v omega_Zalpha"},
        "normalFirstOrdinaryCaps":["2 Bnorm^6 S exp(H/2^128)","Bnorm^7 when alpha=R; zero when alpha=Z",
                                  "2 epsilon Bnorm^6 S exp(H/2^128)"],
        "unnormalizedPhysical":"Multiply normalized scalar derivatives by Q_own^(-1/2).",
        "scope":["Original early slab, joint admitted charts and source smooth realization.",
                 "Differentiate only the scalar coefficient, with fixed labels and before any physical phase factor.",
                 "Active Repeat readback and full residual remain OPEN."],"finalJets":0,"release":"HOLD",
    }
    a.out.write_bytes((json.dumps(result,indent=2)+"\n").encode())
    print("PASS original ten fixed lifts and normalized derivative grades",r,z)

if __name__=="__main__":
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for name in ("goal","runtime","baseline","out"):
        p.add_argument("--"+name,required=True,type=Path)
    main(p.parse_args())
