"""Exact source pins and side checks for the arbitrary positive-order ingress."""
from argparse import ArgumentParser
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import sympy as s


parser = ArgumentParser(description=__doc__)
parser.add_argument("--source", required=True, type=Path, help="Original research-ide directory")
ROOT = parser.parse_args().source
PINS = {
    "mathscope-m2/navier/actual-common-admissible-family.mjs":
        ("7fd3ec07b567af86f84df7a1b789a5a57366186d4e8c26c2a4a35dc5948c5b75", [
            "growth=G.add(previous,G.log(q(n===2?16:2)))",
            "smallBand=n===1?G.mul(G.add(ellMinimum,q(10)),log2):G.zero",
            "ell0=G.add(ellMinimum,q(6))",
            "later:'log b_n=max(log c_n, log b_(n-1)+log2",
        ]),
    "mathscope-m3/navier/global-source-index.mjs":
        ("a3da73e5ad4d853dff04942ea513a3f8ab9fb1abf2b9e30f7eecf3956aaa6a2f", [
            "lower=previous?G.maximum(ell0,floor(G.div(previous.logScale,log2))):ell0",
            "upper=G.sub(floor(G.div(next.logScale,log2)),G.one)",
            "Window N needs the genuine common selector through N+1.",
        ]),
    "mathscope-m3/navier/source-global-band.mjs":
        ("babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60", [
            "family.selector.rows.length<activeOrder+1",
            "prepareActualCommonAdmissibleFamily({throughOrder:Math.max(2,request.coefficientOrder+1)",
            "s=G.monotoneRoot(chartSystem,[Z,T]),X=G.div(G.pow(R,2),G.mul(q(2),s))",
        ]),
    "mathscope-m3/navier/source-global-current.mjs":
        ("93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760", [
            "conditions:['0<q<qGlobalStar','b_(N+1)*q>=1']",
            "prefixSharedByAllCoverLabels:true,prefixSharedByWholeRadialIntegral:true",
            "qGlobalStar=G.exp(G.neg(G.mul(G.add(band.family.constants.ell0,q(4)),G.log(q(2)))))",
        ]),
}
for file,(expected,needles) in PINS.items():
    blob = (ROOT/file).read_bytes()
    assert hashlib.sha256(blob).hexdigest() == expected, file
    assert all(needle in blob.decode() for needle in needles), file

checks = {}
def check(name, predicate):
    if not predicate:
        raise AssertionError(name)
    checks[name] = True


# Exact symbolic coordinate operations. The sign of eta is unrestricted.
v,k,X = s.symbols("s k X", positive=True)
eta,h = s.symbols("eta h", real=True)
D = s.Rational(1,2)-h
R = s.sqrt(2*v*X)
Z = v**D*eta
T = v*(1-eta**2)
check("original_inverse_equation", s.simplify(v-Z**2*v**(2*h)-T) == 0)
check("relative_candidate_radial_profile", s.simplify((s.sqrt(k)*R)**2/(2*k*v)-X) == 0)
check("relative_candidate_axial_image", s.simplify(k**D*Z-(k*v)**D*eta) == 0)
check("relative_candidate_time_image", s.expand(k*T-k*v*(1-eta**2)) == 0)
check("remaining_monotone_inverse_margin", 1-8*F(1,16) == F(1,2))
check("relative_guard_inside_root_bracket", F(3,4) < 1)
check("nearest_integer_interior_reference_bracket", F(1,2) < 1)
check("later_window_lower_label_below_global_q_star", 1-8 < -4)
check("first_window_L_plus_2_below_global_q_star", 1-4-2 < -4)
check("first_to_second_log_growth", 4 == (16).bit_length()-1)

# Rational log witness. Floors at both sides of dyadic boundaries are
# exact; the attached proof treats a_N=L+fractional_part for arbitrary reals.
def floor(x):
    return x.numerator//x.denominator

def window(ell0, a, b):
    return max(ell0,floor(a)),floor(b)-1

for numerator in range(33):
    f = F(numerator,33)
    a = 100+f
    lo,hi = window(14,a,a+1)
    check(f"minimal_growth_window_{numerator}", (lo,hi)==(100,100))

# Minimum countermodel for importing the N=1 same-window rule. This is
# allowed by the guaranteed growth, not an alleged evaluation of b3.
L = 100
lo,hi = window(14,F(L),F(L+1))
s0 = F(1,2)
q = F(1,2**L)*s0
candidate = L+1
candidate_s = q*2**candidate
check("N2_one_label_window_countermodel", lo == hi == L)
check("N1_anchor_not_in_N2_window_countermodel", not lo <= L+2 <= hi)
check("outside_window_active_candidate_countermodel", candidate > hi and candidate_s == 1)
check("same_physical_N2_prefix_still_valid", 2**(L+1)*q == 1)
check("inside_active_N2_example", 2**L*F(3,4)*2**(-L) == F(3,4))

# Independent exact constants for the complex reciprocal weight collar.
check("zeta_left_log_gap", F(1,128)-2*F(1,512) == F(1,256))
check("zeta_right_log_gap", 127-2*F(1,512) > 126)
check("zeta_complex_exponent_majorant", 256**2 + F(4,126**2) < 65537)
check("zeta_real_exponent_majorant", 128**2 + F(4,127**2) < 16385)

print(json.dumps({
    "schema":"MathScope.OriginalArbitraryPositiveWindowSideChecks/1",
    "sourceSHA256":{f:x[0] for f,x in PINS.items()},
    "checks":checks,"exactSideCheckCount":len(checks),
    "genericN2Countermodel":{"window":[lo,hi],"reference":L,"relativeCandidate":candidate,
        "referenceS":str(s0),"relativeS":str(candidate_s),
        "scope":"Countermodel to deriving the N=1 anchor and same-window label rule from factor-two growth."},
    "scope":"Source pins, exact algebra, countermodel and reciprocal-weight inequalities. The attached proof treats arbitrary real selector logs.",
},indent=2))

