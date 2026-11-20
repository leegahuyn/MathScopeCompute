"""Verify the original common-reference background and fast phase cancellation."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path


PINS = {
    "band":"a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b",
    "initialized":"4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e",
    "harmonic":"339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20",
    "operator":"8de6b94b5819ec7b7cdbf8312de32e0c7f8556d9e2d78fa250542f1d6ee3b759",
    "repeat":"4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7",
    "lean":"1f8d73eca9e401c28776d7e7b030ab00ce3c845bd6a91e6d863a9226fe890283",
}
STAGE=Path("primary-forced-join/active-n3-c5-binding/repeat-candidate-preflight/pinned-original")


def read(path, key):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==PINS[key], (path,key)
    return raw.decode()


def add(*exponents):
    return tuple(map(sum,zip(*exponents,strict=True)))


def scale(a,k):
    return tuple(k*x for x in a)


def dyadic_exponents():
    # x=(c,h_coeff) means a factor ratio^(c+h_coeff*h).
    zero=(0,0)
    h=(0,1)
    A=(Q(1,2),1)
    D=(Q(1,2),-1)
    one=(1,0)
    half=(Q(1,2),0)
    s=scale(one,-1)
    Qr=one
    Rr=scale(half,-1)
    Zr=scale(D,-1)
    Tr=s
    eps=h
    theta_exponent=add(scale(A,-1),Rr,A,half)
    axial_exponent=add(scale(A,-1),A)
    radial_exponent=add(scale(A,-1),eps,half)
    pressure_exponent=add(scale(A,-2),scale(A,2))
    profiles={"q=Q*s":add(Qr,s),"X=R^2/(2s)":add(scale(Rr,2),scale(s,-1)),
              "eta=Z/s^D":add(Zr,D)}
    assert add(scale(D,-2),scale(h,-2))==Tr # the complete physical s-equation
    assert tuple(profiles.values())==(zero,zero,zero)
    assert (theta_exponent,axial_exponent,radial_exponent,pressure_exponent)==(zero,)*4
    assert add(scale(A,-1),A,half)!=zero # dropping R/reference scale leaves a half
    assert add(scale(A,-1),half)!=zero # dropping the epsilon label factor costs h
    return profiles


def eikonal_difference():
    # Coefficients are on independent actual nonlinear monomials. Omega
    # is exactly p F + p_z G in this same native chart.
    fast={"p F":-1,"p_z G":-1,"eps v Omega_T":1}
    background={"p F":1,"p_z G":1,"b n_R":1,"eps v G Omega_Z":-1}
    corrections={"Delta_R n_R":1,"Delta_theta n_theta":1,"Delta_z n_z":1}
    tags=set(fast)|set(background)|set(corrections)
    actual={k:fast.get(k,0)+background.get(k,0)+corrections.get(k,0) for k in tags}
    actual={k:v for k,v in actual.items() if v}
    assert "p F" not in actual and "p_z G" not in actual
    expected={**corrections,"b n_R":1,"eps v Omega_T":1,"eps v G Omega_Z":-1}
    assert actual==expected
    assert (set(background)|set(corrections))-set(actual)=={"p F","p_z G"}
    return dict(sorted(actual.items()))


def main(a):
    m2=a.runtime/"research-ide/mathscope-m2/navier"
    m3=a.runtime/"research-ide/mathscope-m3/navier"
    band=read(m3/"source-global-band.mjs","band")
    initialized=read(m3/"source-initialized-angular.mjs","initialized")
    op=read(m2/"actual-covariance-source-operator.mjs","operator")
    residual=read(m3/"source-harmonic-assembly.mjs","harmonic")
    repeat=read(a.goal/STAGE/"source-postfive-repeat-forced.mjs","repeat")
    lean=read(a.repo/"research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/InverseChart.lean","lean")
    for fragment in ("D=G.sub(q(1,2),h)", "A=G.add(q(1,2),h)"):
        assert fragment in op
    for fragment in (
        "chartBody=G.sub(G.sub(sv,G.mul(G.pow(Z,2),power(sv,G.mul(q(2),h)))),T)",
        "left:q(1,2),right:q(2)", "X=G.div(G.pow(R,2),G.mul(q(2),s)),eta=G.div(Z,power(s,D)),qActual=G.mul(Q,s)",
        "b:G.mul(epsilon,power(s,q(-1,2)))", "G:power(s,G.neg(A))", "pressure:power(s,G.mul(q(-2),A))",
        "F:power(s,G.neg(G.add(A,q(1,2))))", "phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G))",
        "phase=G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),epsilon),G.mul(x0,R)),G.mul(v,phaseSpeed))",
        "fullEikonalRemainder=G.add(G.mul(fields.b,frame.n[0]),G.mul(epsilon,v,G.sub(HT,G.mul(fields.G,HZ))))",
    ):
        assert fragment in band, fragment
    for fragment in (
        "ratio=G.exp(G.mul(G.sub(ell,ellReference),G.log(G.q(2))))",
        "referenceValues=[G.div(R,G.sqrt(ratio)),G.div(Z,power(ratio,D)),G.div(T,ratio),ellReference,...Y]",
        "background=[band.fields.b,G.mul(R,band.fields.F),band.fields.G]",
        "phase=localMap(prior.phase)", "Dlocal=originalCylindricalDifferentialOperators(G,lift.geometry)",
    ):
        assert fragment in initialized,fragment
    for fragment in (
        "const background = [band.fields.b, G.mul(band.coordinates.R, band.fields.F), band.fields.G]",
        "G.add(background[j], five.velocity[name])", "G.log(initial.reference.ratio)",
        "G.expressionValue(system, initial.reference.values)", "velocity: velocity.map((root, j) => C.value(shareMean(root, G.neg(A)",
        "geometry: template.lift.geometry, phase: template.phase, k: template.k, mean, waves, flat",
    ):
        assert fragment in repeat,fragment
    assert "time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))" in residual
    assert "C.imaginary(G.mul(k,G.q(m),phaseDerivative),x)" in residual
    assert "chart_joint_scale_transports_root" in lean and "chart_joint_scale_preserves_radial" in lean
    profiles=dyadic_exponents()
    # Simple exact negative source-domain control: s=1/2 and ratio=4
    # could meet independent coarse size ranges while its scaled root is
    # outside the registered [1/2,2] bracket.
    assert Q(1,2)/4==Q(1,8)<Q(1,2)
    return {
        "schema":"MathScope.C121.OriginalRepeatReferenceBackground/1",
        "status":"VERIFIED_ORIGINAL_SOURCE_EXPONENTS_CONDITIONAL_ON_JOINT_ADMISSION",
        "pins":PINS,
        "ratioExponentConvention":"ratio^(constant + hCoefficient*h)",
        "referenceMap":{"R":"R/sqrt(ratio)","Z":"Z/ratio^D","T":"T/ratio","Q":"ratio*Q","s":"s/ratio"},
        "preservedPhysicalProfileExponents":{k:list(map(str,v)) for k,v in profiles.items()},
        "allFinitePositiveWeights":"The same q gives the same chi(b_n q) and q^(2nh) for each shared native coefficient.",
        "referenceBackgroundAfterSourceScaling":["b","R F","G"],"referencePressureAfterSourceScaling":"same",
        "delta":"ratio^(-A) times the actual post-Five mean increment in the registered reference chart",
        "reducedEikonalCoefficients":eikonal_difference(),
        "requiredDomain":["Fixed local labels and ratio; original s and s/ratio in [1/2,2].",
                          "Both sources have the same physical (q,X,eta), with equal retained original profiles and a proven zero tail for any differing finite atlas prefix.",
                          "Same live fixed lift; ci*N v=1, N xi=0 and L v=0."],
        "inadmissibleCoarseScaleControl":{"s":"1/2","ratio":"4","candidateReferenceS":"1/8","insideReferenceBracket":False},
        "open":["Use each actual active guard to certify its joint admissible reference label, and independently bound the real post-Five increment and all residual terms."],
        "finalJets":0,"release":"HOLD",
    }


if __name__=="__main__":
    p=ArgumentParser(description=__doc__)
    for flag in ("goal","repo","runtime","out"):
        p.add_argument("--"+flag,type=Path,required=True)
    a=p.parse_args()
    r=main(a)
    a.out.write_bytes((json.dumps(r,indent=2)+"\n").encode())
    print("PASS original reference-scale profile invariants and fixed-chart fast phase cancellation")
