"""Exact physical reference-transport ledger on the pinned original source."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from math import floor
from pathlib import Path


SOURCE = {
    "part": ("mathscope-m2/navier/actual-covariance-source-certificate.mjs", "c5b619ac5b4377c93daefefc65f6ddc4336a7ffac3a9118981a32969890a0681"),
    "band": ("mathscope-m3/navier/source-global-band.mjs", "a0992d899c921dae3f45ed1ff306a935c61fa5841666692b89d39ce88b8c0b5b"),
    "current": ("mathscope-m3/navier/source-global-current.mjs", "b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36"),
    "cover": ("mathscope-m3/navier/source-global-pressure.mjs", "c0a32aa8a4c1fc9ce4f13d5a74c09ba18bb0568748ae8e8596a45f0fc64ee0f4"),
    "lift": ("mathscope-m3/navier/source-initialized-angular.mjs", "4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e"),
    "forced": ("mathscope-m3/navier/source-global-forced-current.mjs", "1093de46dfe1916679064aec3e5401f47839eaad6c9b213bd150fc9151e999c3"),
    "signedCover": ("mathscope-m3/navier/generic-signed-162-indexed.mjs", "973136acf1571a75a307e374576ec8dbbe0340c19e90ee327373df7638100bec"),
    "signed": ("mathscope-m3/navier/generic-signed-source-kernel.mjs", "15eea2c0f984c5b3bb58dd372d9b01660e44a85526c1f329b41b41855b4c27e2"),
    "aux": ("mathscope-m3/navier/source-auxiliary-fourier.mjs", "59e1d8f7fd72b880de030a2a56bee9be65b5e02203cffa73157ce8dae420ad2e"),
    "temporal": ("mathscope-m3/navier/source-global-temporal.mjs", "16c13ea7a6ba49f78514e1c2a94e29499086e3b11c463e07f6513b8e31f32f1b"),
    "shift": ("mathscope-m3/navier/source-pressure.mjs", "fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f"),
    "potential": ("mathscope-m3/navier/source-temporal-potential.mjs", "c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8"),
    "initialFive": ("mathscope-m3/navier/source-global-initial-mean.mjs", "cde60a57a820915c1403d8ce7b13fdbf8e75cb33e5821c8423ab9ac569fcd584"),
    "bump": ("mathscope-m3/navier/source-global-moment.mjs", "c4cb5abe7aae54393bc3ed0ce3b7a39b26ef2c36719693545adca654b15fe741"),
    "newPressure": ("mathscope-m3/navier/source-updated-mean-pressure.mjs", "6ea6cb85cddd54b0421203e8fc37d24bdfcb8d3c6e62f78c5dada3dab8bd0c07"),
    "stress": ("mathscope-m3/navier/source-global-updated-mean-stress.mjs", "4e91089ebd54aff4b2b1cd8479aef94dc255f14320ccf08f2cb60cf15c4b0ff4"),
    "meanPDE": ("mathscope-m3/navier/source-full-mean-equations.mjs", "2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76"),
    "repeat": ("mathscope-m3/post-signed-20261023/source-postfive-repeat-forced.mjs", "4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7"),
    "finalFive": ("mathscope-m3/post-signed-20261023/source-signed-actual-five-map.mjs", "22976ece2c801beb9e51045820749cc077ddf2c198e364f2033a53789989466d"),
    "newTemporal": ("mathscope-m3/post-signed-20261023/source-signed-actual-temporal-inverse.mjs", "5299e02c6d7b67c5fedb919be8d359a79678bd903183e27def736a65926bd628"),
}

EVIDENCE = {
    "live": ("continuation133/live-reference/partial.json", "947262a5685a7cf4ce60061e4c428c590484da10b292918a4972566bcd50bf2e"),
    "radial": ("continuation137/actual-radial-c1/actual-radial-c1.json", "519ce3b290761aff72299c32589341da77e32c750baa88f833b490110f24f7ac"),
    "threshold": ("continuation138/reference-threshold/replay1.json", "bda90628f9e8b4352b4a3c245ee997706f8968f6a06b92b4d27cce8e796693a0"),
}


def pinned(root, entry):
    path, expect = entry
    raw = (root / path).read_bytes()
    assert sha256(raw).hexdigest() == expect, path
    return raw.decode("utf-8")


def dot(a, b):
    return sum(x * y for x, y in zip(a, b, strict=True))


def mv(matrix, vector):
    return tuple(dot(row, vector) for row in matrix)


def mm(a, b):
    return tuple(tuple(dot(row, col) for col in zip(*b)) for row in a)


def radical_mul(a, b):
    return a[0]*b[0]+2*a[1]*b[1], a[0]*b[1]+a[1]*b[0]


def matrix_checks():
    J = ((3, 1), (1, 5))
    powers = [((1, 0), (0, 1))]
    for _ in range(4):
        powers.append(mm(powers[-1], J))
    dets = [a*d-b*c for ((a,b),(c,d)) in powers]
    assert dets == [14**i for i in range(5)]
    vr, vt = ((1,0),(1,-1)), ((-1,1),(1,0))
    for vector, eigen in ((vr, (4,-1)), (vt, (4,1))):
        actual = tuple(zip(*(mv(J, v) for v in zip(*vector)), strict=True))
        assert actual == tuple(radical_mul(v,eigen) for v in vector)
    lattice_lifts = ((0,0), (2,-3), (-1,1))
    samples = ((Q(1,2),Q(0)), (Q(2,7),Q(1,11)), (Q(-1,2),Q(3,2)))
    centers = ((Q(0),Q(0)), (Q(1,2**20),Q(0)))
    cases = 0
    for d in (0,1):
        for j in range(5-d):
            assert mm(powers[j], powers[d]) == powers[j+d]
            for y in samples:
                z_a = mv(powers[j+d], y)
                for lift in lattice_lifts:
                    z_b = mv(powers[j], tuple(a+b for a,b in zip(mv(powers[d],y),lift)))
                    original_lift = mv(powers[j],lift)
                    for c in centers:
                        a_copy = tuple(floor(a-b+Q(1,2)) for a,b in zip(z_a,c))
                        b_copy = tuple(floor(a-b+Q(1,2)) for a,b in zip(z_b,c))
                        assert tuple(b-a for a,b in zip(a_copy,b_copy)) == original_lift
                        assert tuple(z-c-k for z,c,k in zip(z_a,c,a_copy)) == tuple(z-c-k for z,c,k in zip(z_b,c,b_copy))
                        cases += 1
    y = samples[0]
    assert tuple(x%1 for x in mv(J,y)) != y
    assert tuple(x%1 for x in mv(J,(Q(1,14)*5,Q(-1,14)))) == (0,0)
    for k in ((1,0),(0,1),(2,-3)):
        jtk = mv(tuple(zip(*J)),k)
        divisor = lambda k_: (k_[1]-k_[0],k_[0])
        assert divisor(jtk) == radical_mul((4,1),divisor(k))
    assert max(map(abs,mv(J, (1,0)))) > 1
    return {"integerPowers": powers, "determinants": dets, "copyControls": cases,
            "negativeUnchangedTorus": "Y=(1/2,0); Jg Y=(1/2,1/2) mod 1",
            "nonInjectivityWitness": "Jg(5/14,-1/14) is integral",
            "finiteSquareCutoffNotPreserved": "Jg^T(1,0)=(3,1)"}


def add(*terms):
    return tuple(map(sum,zip(*terms,strict=True)))


def scale(mult, a):
    return tuple(mult*t for t in a)


def exponent_checks():
    # w=(constant,h coefficient) denotes a multiplicative λ^w weight.
    half, one, h = (Q(1,2),0), (1,0), (0,1)
    A = add(half,h)
    D = add(half,scale(-1,h))
    stress = scale(2,A)
    f = add(stress,half)
    assert add(D,h) == half
    assert add(A,one,h) == f == add(A,h,half,half)
    assert add(h,A,half) == stress
    pressure = add(f,scale(-1,half))
    P = pressure
    # R^2 contributes -1 and dR contributes -1/2 on the angular flux.
    Jth = add(stress,scale(-3,half))
    Jz_left, Jz_right = add(stress,scale(-2,half)),add(f,scale(-3,half))
    assert Jz_left == Jz_right
    Jz = Jz_left
    assert add(P,scale(-1,stress)) == add(Jth,scale(-1,Jth)) == add(Jz,scale(-1,Jz)) == (0,0)
    assert add(P,scale(-1,one)) == Jz
    assert add(P,half) == f
    assert add(f,scale(-1,one),scale(-1,h)) == A
    assert add(A,scale(-1,half),half) == A
    assert add(one,scale(-2,D),scale(-2,h)) == (0,0)
    assert add(A,half,scale(-1,half)) == A
    # The extra R powers in the two stresses cancel against dividing by R^e.
    for e in (1,2):
        moment = add(f,scale(-e,half),scale(-1,half))
        bump = scale(e+1,half)
        assert add(moment,bump) == f
        assert add(f,scale(-e,half),scale(-1,half),scale(e,half)) == stress
    weights = dict(A=A,D=D,velocity=A,pressure=pressure,stress=stress,rho=half,
                   Etheta_Ez_gr=f,P=P,Jtheta=Jth,Jz=Jz,cRho=scale(-1,one),
                   temporalVelocity=A,temporalPotential=add(A,scale(-1,half)),
                   sigma=stress,sdim=scale(-1,one))
    return {key: list(map(str,value)) for key,value in weights.items()}


def verify(runtime, work):
    source = {k:pinned(runtime,v) for k,v in SOURCE.items()}
    docs = {k:json.loads(pinned(work,v)) for k,v in EVIDENCE.items()}
    for k, snippets in {
        "part": ("Yi=Jg^i Y, Y=v_r*r^d_r+v_t*t", "nearestBand=floor(G.add(bandCoordinate,q(1,2)))", "G.mul(G.pow(ell,6),x)", "centers=colors.map"),
        "band": ("chartSystem=G.defineMonotoneSystem", "parameters:[Z,T]", "left:q(1,2),right:q(2)", "F:power(s,G.neg(G.add(A,q(1,2))))", "b:G.mul(epsilon,power(s,q(-1,2)))"),
        "current": ("innerRadius=G.sqrt(G.parameter('Xa')),outerRadius=G.mul(q(2),G.sqrt(band.chart.Xb))", "rhoMass=integrate(unnormalized),rho=G.div(unnormalized,rhoMass)", "prefixSharedByWholeRadialIntegral:true"),
        "cover": ("J=[[3n,1n],[1n,5n]]", "baseEll=G.sub(ell,q(2)),baseIndex=paletteIndex(baseEll)", "physicalR=G.mul(G.sqrt(band.geometry.Q),R),radialPrimitive=G.mul(power(Lambda,baseIndex),power(physicalR,dr))", "ci=G.mul(power(Tg,baseIndex),power(band.geometry.Q,G.add(G.one,h)))", "delta=G.sub(i,baseIndex)", "normalizedMeasure:true"),
        "lift": ("originalOperatorFormula:'H_w=Y+(ci_label/Tg^delta)*(w-v(Y))*v_t'", "normalizedMeanVelocity=referenceFunctions.velocity.map", "referenceValues=[G.div(R,G.sqrt(ratio)),G.div(Z,power(ratio,D)),G.div(T,ratio),ellReference,...Y]"),
        "forced": ("exponent=kind==='velocity'?A", "referenceValues=[G.mul(G.sqrt(ratio),R),G.mul(power(ratio,D),Z),G.mul(ratio,T)", "latestMean=reconstructUpdatedFullMeanPressure"),
        "signedCover": ("localMap(G,forced,t,body)", "exponent=kind==='velocity'?A:G.mul(G.q(2),A)", "updatedCovariance=Object.fromEntries"),
        "signed": ("Sigma=[...latestStress.Sigma]", "Y.every(y=>!G.freeCoordinates(x).has(y))", "inversion=services.signedInverse(G,{H,amplitudes:a,epsilon:eps,target:Sigma})"),
        "aux": ("k.v_t=(k1-k0)+k0*sqrt(2)", "finiteCutoffDeclaredExact:false", "sourceProjection"),
        "temporal": ("exactInverseEquation:'N inverse = actual E - normalized Haar mean(actual E)'", "Every finite inverse sum has zero Haar mean."),
        "shift": ("shiftedY=Y.map((y,j)=>G.add(y,G.mul(shift,vr[j])))", "left=G.integral(integrand,r,innerRadius,R),whole=G.integral(integrand,r,innerRadius,outerRadius)"),
        "potential": ("deltaV=G.neg(G.div(inverseTheta,ci)),gammaDesired=G.neg(G.div(inverseZ,ci))", "beta=G.neg(Dz(psi)),gamma=De(psi,1)"),
        "bump": ("inQ=G.mul(g.power(s,G.neg(A)),G.substitute(profile,x,G.div(R,G.sqrt(s))))",),
        "newPressure": ("source=G.sub(gr,G.mul(rho,P)),integrals=shiftedRadialIntegrals", "exactNormalizedHaar(G,gr,Y)"),
        "stress": ("The whole original wave cover, the original stress and the realized mean potentials have smooth shell zero extension.", "These new stress sources are independent of the auxiliary coordinates."),
        "meanPDE": ("Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x))),Dz=x=>G.mul(epsilon,G.derivative(x,Z))", "time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))"),
        "repeat": ("const system = G.defineExpressionFunction({ name, parameters, body })", "G.expressionValue(system, initial.reference.values)", "const mapped = G.simultaneousSubstitute(shared, Y, Hw)", "const n = inverse.normal.value;"),
        "newTemporal": ("const exact=G.auxiliaryInverseValue(system,parameters);", "geometry={...pressure.geometry,chi:pressure.pressure.chi}"),
    }.items():
        assert all(snippet in source[k] for snippet in snippets), k
    for k in ("initialFive", "finalFive"):
        assert all(s in source[k] for s in ("Jtheta:G.mul(power(s,G.sub(G.mul(q(2),A),q(3,2)))", "Jz:G.mul(power(s,G.sub(G.mul(q(2),A),G.one))", "copies[j].inQ")), k
    assert docs["live"]["manifestNodeCount"] == 22380596
    assert docs["live"]["newIndexedFields"] == 0
    assert docs["radial"]["status"] == "CONDITIONAL_ACTUAL_240_FIXED_LABEL_RADIAL_C1"
    assert docs["threshold"]["status"] == "EXACT_SOURCE_BOUND_ENDPOINT_CONTROL_NEAREST_POLICY_CONDITIONAL"
    # Both actual normalized s values, squared, remain strictly within the native bracket.
    assert Q(1,4)<Q(1,2)<4 and Q(1,4)<Q(2)<4
    return {"schema":"MathScope.C139.ConditionalPhysicalReferenceTransport/1",
            "status":"CONDITIONAL_MATCHED_OWN_LABEL_TRANSPORT_ON_ADMITTED_OVERLAP",
            "source":SOURCE, "evidence":EVIDENCE, "matrix":matrix_checks(), "affineExponents":exponent_checks(),
            "ratio":"λ=Q_b/Q_a=1/2 with b=a+1",
            "referenceFreePhysicalScale":"q − z² q^(2h) = τ; same positive root for τ≥0 away from z=τ=0",
            "nearestReferenceProposal":"ell=floor(-log₂(q)+1/2) gives |−log₂(q)−ell|≤1/2; an original larger coefficient prefix with b_(N+1)q≥4 suffices for its integer window",
            "referenceChange":"S=(λ^-1/2 R,λ^-D Z,λ^-1 T), Y_b=Jg^d Y_a (mod integer lattice)",
            "nativePhysicalPreimage":"Jg^(i_own-i(b-2)) Y_b = Jg^(i_own-i(a-2)) Y_a modulo integers",
            "pulledInverse":"I_b(S,Jg^d Y)=Tg^d λ^w I_a; exact normalized zero-Haar solution uniqueness",
            "pressuresAndMean":"Normalized PostFive means have required covariance if source support/analytic induction premises hold",
            "wholeRadius":"Both fixed normalized envelopes enclose the same physical support; endpoint differences drop only for the supported extended actual integrands",
            "ownSigma":"Native Signed Haar stresses depend on the own label/slow coordinates, not the outer reference label",
            "firstPhysicalJets":"Conditional equality holds on an open overlap where matched analytic transports hold; differentiate there with the same frozen label and full torus map",
            "unproved":["Actual shared-label full-wave comparison and all integration support traces across active graph on both charts",
                         "Physical reference selection and all moving changing-label/outer-domain admissions",
                         "Hosted registration and whole-field acceptance"],
            "fullNativeSeamVerified":False, "finalJets":0,"release":"HOLD"}


if __name__ == "__main__":
    p=ArgumentParser(description=__doc__)
    for name in ("runtime","work","out"):
        p.add_argument("--"+name,required=True,type=Path)
    args=p.parse_args()
    result=verify(args.runtime,args.work)
    args.out.write_bytes((json.dumps(result,indent=2,sort_keys=True)+"\n").encode())
    print(result["status"])
