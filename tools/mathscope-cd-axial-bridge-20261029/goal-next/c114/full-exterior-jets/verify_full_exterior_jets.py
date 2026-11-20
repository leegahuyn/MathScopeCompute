"""Replay normalized 67+13 jets across the original moving exterior."""
import argparse
from collections import Counter
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
from itertools import product
import json
from math import isqrt
from pathlib import Path


C113 = "work/goal-next/continuation113/exterior-local-jets/verify_exterior_local_jets.py"
C113_SHA = "def39b652b76f702a3fb8281cd7118e83bac7c024884260a7ab2bffe3a12b64d"
C113_RECEIPT = "work/goal-next/continuation113/exterior-local-jets/exterior-local-jets-stencil.json"
C113_RECEIPT_SHA = "fcbb78a7d04daff2bd4040e9a3ae739f852168c2442f4c19c69552b0b6416964"
MOVING = "final67/moving-heat-energy/moving-heat-energy.json"
MOVING_SHA = "c614a3a12ec8d9dcf5bd02235dd6227bb79969d372f345baad6aec471c127c2b"
ARITHMETIC_SOURCE = "work/goal-next/final67/source"
HEAT_ARG_UPPER = Q(1,55)
B = ["b@0,0,0", "b@0,0,1", "b@0,1,0", "b@0,2,0", "b@1,0,0", "b@2,0,0"]
P = ["p@0,0,0,0", "p@1,0,0,0", "p@0,1,0,0", "p@0,0,1,0"]
ACTIVE = set(B+P)
AXIAL = {B[2], B[3], P[3]}
NORMALIZERS = {
    B[0]: "s^a/B", B[1]: "tau0*s^a/B", B[2]: "z0*s^a/B", B[3]: "z0^2*s^a/B",
    B[4]: "s^(a+1)/B", B[5]: "s^(a+2)/B",
    P[0]: "4A*s^(2A)/B^2", P[1]: "s^(2A+1/2)/B^2",
    P[2]: "s^(2A+1/2)/B^2", P[3]: "4A*z0*s^(2A)/B^2",
}


def pinned_json(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return json.loads(raw)


def load_bound_inputs(workspace, goal):
    c113 = workspace / C113
    assert sha256(c113.read_bytes()).hexdigest() == C113_SHA
    spec = spec_from_file_location("c113_exterior_jet", c113)
    local = module_from_spec(spec)
    spec.loader.exec_module(local)
    parent = local.source_reader(workspace, goal)
    from outer_cutoff import ActualOuterCutoff, chi_jets
    archived = ActualOuterCutoff(workspace / ARITHMETIC_SOURCE)
    parent.chi_jets = chi_jets
    stencil = pinned_json(goal / local.STENCIL, local.STENCIL_SHA)
    source = parent.verify_sources(workspace)
    assert archived.archive["constants"]["r0"] == 1 and "r0===G.one" in source["localization"]
    moving = pinned_json(goal / MOVING, MOVING_SHA)
    labels = [key for key in stencil["variables"] if key.startswith(("A", "b@", "p@"))]
    cutoff = [key for key in stencil["variables"] if key.startswith("C@")]
    assert len(labels) == len(set(labels)) == 67 and len(cutoff) == 13
    assert cutoff == list(archived.atoms), (cutoff, archived.atoms)
    assert set(labels) == set(source["exterior"]["fieldAtomIntervals"])
    assert {key for key in labels if not key.startswith("A")} == ACTIVE
    assert source["exterior"]["geometry"]["movingLowerFace"] == "r^2>=2*q*Xb>=tau0*Xb=s0>0"
    assert "original smooth annular zero extension" in source["exterior"]["geometry"]["seam"]
    assert "0<=-Z*H'/H<=h" in source["exterior"]["heatAnalyticBounds"]["allZ"]
    assert "8s_*<1/4" in source["radialProof"]
    assert "Xb" in moving["domain"]
    return local, parent, stencil, labels, cutoff, archived, moving


class Poly:
    """Small exact polynomial with sorted factor-name tuples as monomials."""
    def __init__(self, terms):
        self.terms = {key: value for key, value in terms.items() if value}

    @classmethod
    def coerce(cls, value):
        return value if isinstance(value, cls) else cls({(): Q(value)})

    @classmethod
    def variable(cls, name):
        return cls({(name,): Q(1)})

    def __add__(self, other):
        result = Counter(self.terms)
        result.update(self.coerce(other).terms)
        return Poly(result)

    __radd__ = __add__

    def __neg__(self):
        return Poly({key: -value for key, value in self.terms.items()})

    def __sub__(self, other):
        return self + (-self.coerce(other))

    def __mul__(self, other):
        result = Counter()
        for left, a in self.terms.items():
            for right, b in self.coerce(other).terms.items():
                result[tuple(sorted(left + right))] += a*b
        return Poly(result)

    __rmul__ = __mul__

    def __pow__(self, exponent):
        assert exponent >= 0
        result = self.coerce(1)
        for _ in range(exponent):
            result *= self
        return result

    def __eq__(self, other):
        return self.terms == self.coerce(other).terms


def audit_stencil(stencil, cutoff):
    variables = stencil["variables"]
    raw = {key: Poly.variable(key) for key in {"x", "y", *cutoff, *(ACTIVE - AXIAL)}}
    x, y = raw["x"], raw["y"]
    b, bt, bs, bss = (raw[key] for key in (B[0], B[1], B[4], B[5]))
    p, px, py = (raw[key] for key in P[:3])
    C, Ct, Cz, Czz, Cs, Css = (raw["C@" + key] for key in
                               ("0,0,0","0,0,1","0,1,0","0,2,0","1,0,0","2,0,0"))
    radius = x*x+y*y
    U, U_tau, U_z, U_zz = C*b, Ct*b + C*bt, Cz*b, Czz*b
    U_s, U_ss = Cs*b+C*bs, Css*b+2*Cs*bs+C*bss
    Qv = C*p
    Qx, Qy, Qz = C*px+2*x*Cs*p, C*py+2*y*Cs*p, Cz*p
    laplace = 8*U_s+4*radius*U_ss+U_zz
    expected = {
        "velocity": [-y*U, x*U, Poly.coerce(0)],
        "velocity_gradient": [
            [-2*x*y*U_s, -U-2*y*y*U_s, -y*U_z],
            [U+2*x*x*U_s, 2*x*y*U_s, x*U_z],
            [Poly.coerce(0)]*3,
        ],
        "localized_pressure": Qv,
        "force": [y*(U_tau+laplace)-x*U**2+Qx,
                  -x*(U_tau+laplace)-y*U**2+Qy, Qz],
    }

    def evaluate(terms):
        result = Poly.coerce(0)
        for term in terms:
            value = Poly.coerce(Q(term["coefficient"]))
            for index, power in term["powers"]:
                value *= raw.get(variables[index], Poly.coerce(0))**power
            result += value
        return result

    evidence = {}
    for key, target in expected.items():
        actual = stencil["outputs"][key]
        if key == "localized_pressure":
            assert evaluate(actual) == target
            evidence[key] = 1
        elif key == "velocity_gradient":
            assert [list(map(evaluate,row)) for row in actual] == target
            evidence[key] = 9
        else:
            assert list(map(evaluate, actual)) == target
            evidence[key] = 3
    assert evaluate(stencil["outputs"]["force"][2]) != 0
    assert expected["force"][0] != -y*U_tau+y*laplace-x*U**2+Qx
    # Pressure derivative in the raw exterior is p_x=x*b^2. All transport
    # and diffusion terms are perpendicular to (x,y); the radial part has
    # the original bare pressure slope times C, not C^2.
    radial = -C*C*b*b+C*b*b+2*Cs*p
    assert radial == C*(Poly.coerce(1)-C)*b*b+2*Cs*p
    return evidence


def exact_angular_modes():
    # On the physical circle, x/r=(e^iθ+e^-iθ)/2 and
    # y/r=(e^iθ-e^-iθ)/(2i). The symbols are the frequencies, with
    # rational numerator here for the radial sum of squares.
    x_square = Counter({-2:Q(1,4), 0:Q(1,2), 2:Q(1,4)})
    y_square = Counter({-2:Q(-1,4), 0:Q(1,2), 2:Q(-1,4)})
    x_square.update(y_square)
    assert {k:v for k,v in x_square.items() if v} == {0:Q(1)}
    # The exact 16 products have horizontal factors x,y,xy,x²,y²,
    # and the axial force is the nonzero angle-independent p_z.
    return {"velocity":[-1,1],"gradient":[-2,-1,0,1,2],"pressure":[0],
            "forceXY":[-1,1],"forceZ":[0],"forceUnion":[-1,0,1],
            "omittedFourierModesAboveAbsoluteTwo":[0,0]}


def positive_sqrt(q, bits, I):
    root = isqrt((q.numerator << (2*bits))//q.denominator)
    lo = Q(root, 1<<bits)
    hi = lo if lo*lo == q else Q(root+1, 1<<bits)
    assert lo*lo <= q <= hi*hi
    return I(lo,hi)


def split(lo, hi, count):
    return [(lo+(hi-lo)*Q(i,count), lo+(hi-lo)*Q(i+1,count)) for i in range(count)]


def axes(parent, radix, z_argument, z_sign, rho, bits):
    I = parent.I
    s = I(*radix)
    R0, R1, R2, R3 = parent.chi_jets(2*s.lo,2*s.hi,bits)
    R = R0, 2*R1, 4*R2, 8*R3
    az = I(*z_argument)
    z_abs = I(positive_sqrt(az.lo/2,bits,I).lo,positive_sqrt(az.hi/2,bits,I).hi)
    zeta = z_sign*z_abs
    zeta2 = I(az.lo/2,az.hi/2)
    W0, W1, W2, W3 = parent.chi_jets(az.lo,az.hi,bits)
    W = W0, 4*zeta*W1, 4*W1+16*zeta2*W2, 48*zeta*W2+64*zeta*zeta2*W3
    T = parent.chi_jets(*rho,bits)
    return s, R, W, T


def check_cutoff_against_archive(parent, archived):
    I = parent.I
    x, y, zeta, rho = Q(1,2), Q(1,4), Q(3,5), Q(7,8)
    s = x*x+y*y
    _, R,W,T = axes(parent,(s,s),(2*zeta*zeta,2*zeta*zeta),1,(rho,rho),144)
    original = archived.evaluate(I.point(x),I.point(y),I.point(zeta),I.point(rho),144)
    for key,value in original["cutoff_jets"].items():
        i,j,k = map(int,key.partition("@")[2].split(","))
        outer = parent.rounded(R[i]*W[j]*T[k],144)
        lo,hi = map(Q,value["coefficient_interval"])
        assert original["status"] == "MISSING_ACTUAL_FIELD_JETS"
        assert outer.lo <= hi and lo <= outer.hi
        assert (value["z0_power"],value["tau0_power"]) == (-j,-k)
    return len(original["cutoff_jets"])


def normalized_jets(parent, heat, s, R, W, T, rho, x_over_r, y_over_r):
    I = parent.I
    H,H1,H2,G = heat
    h_bound = Q(1,1<<160)
    assert parent.SMALL_H < h_bound
    a = I(1,1+h_bound)
    pressure_divisor = I(1,1+2*h_bound)  # 2A
    rho_inverse = I(1/rho[1],1/rho[0])
    M = a*H+H1
    M = I(max(H.lo,M.lo),M.hi)  # H1/H >= -h
    N = a*(a+1)*H+2*(a+1)*H1+H2
    H_square = H.square()
    R0, Rs, Rss,_ = R
    W0,Wz,Wzz,_ = W
    c,Ctau,*_ = T
    zero = I.point(0)
    bare = dict(zip(B+P,(H,H1*rho_inverse,zero,zero,-M,N,
                        -G,H_square*x_over_r,H_square*y_over_r,zero),strict=True))
    pressure_gradient_radial = W0*c*(R0*H_square-s*Rs*G/pressure_divisor)
    post = dict(zip(B+P,(
        R0*W0*c*H,
        R0*W0*(Ctau*H+c*H1*rho_inverse),
        R0*c*Wz*H,
        R0*c*Wzz*H,
        W0*c*(s*Rs*H-R0*M),
        W0*c*(s.square()*Rss*H-2*s*Rs*M+R0*N),
        -R0*W0*c*G,
        pressure_gradient_radial*x_over_r,
        pressure_gradient_radial*y_over_r,
        -R0*c*Wz*G,
    ),strict=True))
    return bare,post


def merge(enclosures, values, I):
    for key,value in values.items():
        if key in enclosures:
            other = enclosures[key]
            value = I(min(other.lo,value.lo),max(other.hi,value.hi))
        enclosures[key] = value


def partition(parent, heat, n, bits, cutoff):
    I = parent.I
    radial = [(Q(0),Q(1,4))] + split(Q(1,4),Q(1,2),n)
    axial = [(Q(0),Q(1,2))] + split(Q(1,2),Q(1),n)
    times = split(Q(1,2),Q(1),n)
    indices = [tuple(map(int,key.partition("@")[2].split(","))) for key in cutoff]
    physical_angle = (I(-1,1),I(-1,1))
    evaluations = {
        (ridx,zidx,sign,tidx): axes(parent,rad,ax,sign,rho,bits)
        for (ridx,rad),(zidx,ax),sign,(tidx,rho) in product(
            enumerate(radial),enumerate(axial),(-1,1),enumerate(times))
    }
    regional = {}
    all_post,all_cutoffs,all_bare = {},{},{}
    for (ridx,zidx,sign,tidx),(s,R,W,T) in evaluations.items():
        bare,post = normalized_jets(parent,heat,s,R,W,T,times[tidx],*physical_angle)
        group = f"radial-{'plateau' if not ridx else 'transition'}/axial-{'plateau' if not zidx else 'transition'}"
        cell = regional.setdefault(group,{})
        merge(cell,post,I)
        merge(all_bare,bare,I)
        merge(all_post,post,I)
        values = {key: R[i]*W[j]*T[k] for key,(i,j,k) in zip(cutoff,indices,strict=True)}
        merge(all_cutoffs,values,I)
        assert post[B[0]].lo >= 0 and post[B[1]].hi <= 0 and post[B[4]].hi <= 0 and post[P[0]].hi <= 0
        assert (sign*post[B[2]]).hi <= 0 and (sign*post[P[3]]).lo >= 0
        if ridx==0:
            assert post[B[5]].lo >= 0
        if zidx==0:
            assert post[B[2]] == post[B[3]] == post[P[3]] == I.point(0)
    return len(evaluations),all_bare,all_post,all_cutoffs,regional


def hull_for_fixed_scale(parent, values):
    factor = parent.I(0,1)
    return {key: interval*factor for key,interval in values.items()}


def include_exact_zeros(parent, labels, values):
    return {key: values.get(key,parent.I.point(0)) for key in labels}


def exact_domains(parent, heat):
    I = parent.I
    boundary_checks = {
        "radial support boundary": ((Q(1,2),)*2,(Q(3,4),)*2,1,(Q(3,4),)*2),
        "axial support boundary": ((Q(3,8),)*2,(Q(1),)*2,1,(Q(3,4),)*2),
        "time support boundary": ((Q(3,8),)*2,(Q(3,4),)*2,1,(Q(1),)*2),
    }
    for data in boundary_checks.values():
        rho = data[-1]
        s,R,W,T = axes(parent,*data,144)
        _,post = normalized_jets(parent,heat,s,R,W,T,rho,I(-1,1),I(-1,1))
        assert all(value == I.point(0) for value in post.values())
    assert Q(1,2)+Q(1,2)*Q(32,31) < 2
    assert HEAT_ARG_UPPER == 2*Q(1,110)
    # X=q^-1 s/2; at fixed z,t radial infinity has the same q and remains
    # in the original exterior. Under the radial support upper face the
    # original p_loc is still negative, because this has not truncated it.
    assert heat[3].lo > 0
    return list(boundary_checks)


def simultaneous_transition_point(parent, heat):
    I = parent.I
    s,rho,z_argument = Q(3,8),Q(3,4),Q(3,4)
    xy = Q(3,5),Q(4,5)
    assert sum(x*x for x in xy)==1
    radius,R,W,T = axes(parent,(s,s),(z_argument,z_argument),1,(rho,rho),144)
    assert R[:3] == (I.point(Q(1,2)),I.point(-8),I.point(0))
    assert W[0] == I.point(Q(1,2)) and W[2] == I.point(-16)
    assert T[:3] == (I.point(Q(1,2)),I.point(-4),I.point(0))
    _,post = normalized_jets(parent,heat,radius,R,W,T,(rho,rho),*xy)
    signs = dict(zip(B+P,(1,-1,-1,-1,-1,1,-1,1,1,1),strict=True))
    assert all((post[key]*sign).lo>0 for key,sign in signs.items())
    # On a unit spatial plateau the midpoint time gate is 1/2. Moving the
    # squared velocity cutoff inside the pressure tail changes the endpoint
    # derivative factor from 1/2 to 1/4.
    assert T[0] * heat[0].square() != T[0].square() * heat[0].square()
    assert (T[0]*heat[0].square()).lo > (T[0].square()*heat[0].square()).hi
    assert (-post[B[1]]).lo>0 and post[P[3]].lo>0
    return {"s":"3/8","zetaSquared":"3/8","zetaSign":1,"rho":"3/4",
            "cartesianRadialUnit":["3/5","4/5"],
            "allTenActiveJetSigns":signs,
            "post":{key:parent.rounded(value,144).encoded() for key,value in post.items()}}


def serialize(parent, values, bits):
    return {key:parent.rounded(value,bits).encoded() for key,value in values.items()}


def adjacent_transfer_from_C113(workspace, parent, localized):
    source = pinned_json(workspace / C113_RECEIPT, C113_RECEIPT_SHA)
    old_scales = source["normalizationMultipliers"]
    assert set(old_scales) == ACTIVE - AXIAL
    for key, expression in old_scales.items():
        equivalent = expression
        if key.startswith("b@"):
            equivalent = equivalent.replace("A+1/2","a").replace("A+3/2","a+1").replace("A+5/2","a+2")
        assert equivalent.replace("(a)","a") == NORMALIZERS[key], (key, equivalent)
    old = source["uniformWholePatchEnclosures"]["upper"]
    assert set(old) == set(localized)
    for key,value in old.items():
        a,b = map(Q,value)
        interval = localized[key]
        assert interval.lo <= b and a <= interval.hi
    return len(old)


def integer_hull(values):
    return {key:[value.lo.numerator//value.lo.denominator,-((-value.hi.numerator)//value.hi.denominator)]
            for key,value in values.items()}


def refine_against_coarse(parent, fine, coarse):
    I = parent.I
    return {key:I(max(value.lo,coarse[key].lo),min(value.hi,coarse[key].hi)) for key,value in fine.items()}


def main():
    parser = argparse.ArgumentParser()
    for key in ("workspace","goal","out"):
        parser.add_argument(f"--{key}",type=Path,required=True)
    args = parser.parse_args()
    local,parent,stencil,labels,cutoff,archive,moving = load_bound_inputs(args.workspace,args.goal)
    heat8 = local.heat_weighted_jets(parent,8,HEAT_ARG_UPPER)[:4]
    heat4 = local.heat_weighted_jets(parent,4,HEAT_ARG_UPPER)[:4]
    # Both orders enclose the same source heat variables. Retain the rigorously
    # directed intersection and check the Taylor tail separately.
    I = parent.I
    heat = tuple(parent.rounded(I(max(old.lo,new.lo),min(old.hi,new.hi)),160)
                 for old,new in zip(heat4,heat8,strict=True))
    tails = {order: local.derivative_tails(parent,order,HEAT_ARG_UPPER) for order in (4,8)}
    improvements = [i/j for i,j in zip(
        (*tails[4][0],tails[4][1]),(*tails[8][0],tails[8][1]),strict=True)]
    sharp_integer = min(value.numerator // value.denominator for value in improvements)
    assert sharp_integer >= 1000
    bits = 144
    coarse = partition(parent,heat,4,bits,cutoff)
    fine = partition(parent,heat,8,bits,cutoff)
    counts = {4:coarse[0],8:fine[0]}
    _,bare0,post0,C0,_ = coarse
    _,bare,post,C,regional = fine
    bare = refine_against_coarse(parent,bare,bare0)
    post = refine_against_coarse(parent,post,post0)
    C = refine_against_coarse(parent,C,C0)
    tightened = [key for key,value in post.items() if value.hi-value.lo<post0[key].hi-post0[key].lo]
    assert tightened and sum(1 for key in labels if key not in ACTIVE)==57
    assert all(bare[key] == I.point(0) for key in AXIAL)
    assert len([key for key,value in post.items() if value != I.point(0)]) == 10
    all_localized = include_exact_zeros(parent,labels,post)
    reports = {
        "schema":"MathScope.C114.OriginalMovingHeatExterior67JetIntervals/1",
        "status":"VERIFIED_WHOLE_MOVING_EXTERIOR_UNDER_ORIGINAL_EXTERIOR_IDENTIFICATION",
        "pins":{"C113Code":C113_SHA,"C113Receipt":C113_RECEIPT_SHA,"stencil":local.STENCIL_SHA,"moving":MOVING_SHA,
                **{name:pin for name,(_,pin) in parent.PINS.items()}},
        "originalMovingExterior":moving["domain"],
        "cover":{"radial":"2qXb<=s<=1/2; use [0,1/4] for the regional coefficient on the radial plateau only",
                 "axial":"zeta^2<=1/2, both signs","time":"rho in [1/2,1]","circle":"all physical theta",
                 "argument":"0<=Z=4tau/s<=2/Xb<1/55","flatBoundaryChecks":exact_domains(parent,heat),
                 "cells":counts,"strictRefinementForLocalized":tightened,
                 "outsidePositiveSupport":"Original flat zero extension; all 67 localized rows vanish"},
        "pressureGauge":{"unlocalized":"-integral_r^infinity K_heat(r',tau)^2 dr'/r'",
                         "localized":"p=C*p_loc, not integral of (C*K_heat)^2; keep p_z=C_z*p_loc",
                         "rayArgument":"q=q(z,t) stays fixed on the whole positive ray; X increases",
                         "radialDerivative":"p_loc,s=(B^2/2)s^(-2A-1)*H^2"},
        "normalization":{"a":"A+1/2","tauDerivative":"The b time label uses positive tau; physical d/dt=-d/dtau",
                         "labelMultipliersAtPoint":NORMALIZERS,
                         "fixedScaleRule":"Replace s in all positive multipliers by s*=tau0*Xb; z0 and tau0 unchanged",
                         "naturalParameterScales":"B=2^A*c_infinity, z0=tau0^(1/2-h); remain exact"},
        "bare67":serialize(parent,include_exact_zeros(parent,labels,bare),bits),
        "localized67":serialize(parent,all_localized,bits),
        "localizedTenIntegerCaps":integer_hull(post),
        "C113OverlappingUpperPatchRowsConsistent":adjacent_transfer_from_C113(args.workspace,parent,all_localized),
        "normalizedPhysicalTimeDerivativeB":parent.rounded(-post[B[1]],bits).encoded(),
        "fixedScaleBare67":serialize(parent,include_exact_zeros(parent,labels,hull_for_fixed_scale(parent,bare)),bits),
        "fixedScaleLocalized67":serialize(parent,include_exact_zeros(parent,labels,hull_for_fixed_scale(parent,post)),bits),
        "regionalTenLocalized":{key:serialize(parent,value,bits) for key,value in regional.items()},
        "cutoff13Normalized":serialize(parent,C,bits),
        "cutoff13Scale":"derivative C@i,j,k uses multiplier z0^j*tau0^k",
        "cutoffOrdinaryArchiveChecks":check_cutoff_against_archive(parent,archive),
        "originalOutputIdentities":audit_stencil(stencil,cutoff),
        "exactPhysicalAngularModes":exact_angular_modes(),
        "simultaneousTransitionPoint":simultaneous_transition_point(parent,heat),
        "coefficientOrderOnly":{"orders":[4,8],"tailImprovementStrictlyAbove":sharp_integer-1},
        "localExteriorJetEnclosures":67,"localizedExactZero":57,"bareExactZero":60,
        "scope":"Entire reference moving heat exterior on K via the original exterior theorem and its one-sided trace at X=Xb. Annulus, center and other tails are separate.",
        "wholeKFinalJets":0,"wholeKLastResolvedTau":None,"N7_06":"OPEN","N8_05":"OPEN","release":"HOLD"
    }
    args.out.write_bytes((json.dumps(reports,indent=2,ensure_ascii=False)+"\n").encode())
    print(f"PASS: {counts[4]} and {counts[8]} directed cells, 67 bare and 67 localized exterior rows, 13 cutoff rows, 16 exact output polynomials")


if __name__ == "__main__":
    main()
