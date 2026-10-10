"""Independent Fraction checks of executed source induction operators.

Usage: node actual-residual-order-induction-fixture.mjs | python3 this.py
The finite rational matrix substitutions below test a universal identity.
They are not observations of the same-N3 profile and are not used as its
coefficient values or analytic norm inputs.
"""
import json
import math
import random
import sys
from fractions import Fraction as F

data = json.load(sys.stdin if len(sys.argv) == 1 else open(sys.argv[1], encoding="utf-8"))
counts = {}


def check(group, condition, message):
    if not condition:
        raise AssertionError(group + ": " + message)
    counts[group] = counts.get(group, 0) + 1


def evaluate(program, slots):
    values = []
    for node in program["nodes"]:
        op, a = node["op"], node["args"]
        if op == "verification_slot":
            v = slots[a[0]]
        elif op == "rational":
            v = F(int(a[0]), int(a[1]))
        elif op == "add":
            v = sum((values[x] for x in a), F(0))
        elif op == "multiply":
            v = math.prod(values[x] for x in a)
        elif op == "inverse":
            v = 1 / values[a[0]]
        elif op == "integer_power":
            v = values[a[0]] ** a[1]
        else:
            raise AssertionError("Unexpected exported actual operator " + op)
        values.append(v)
    return values


cert = data["sourceCertificate"]
for name, value in cert["checks"].items():
    check("actual_source_gates", value is True, name)
for row in cert["actualSystems"]:
    for name, receipt in row["checks"].items():
        check("actual_source_gates", receipt["pass"] and receipt["numeratorMonomials"] == 0, str((row["order"], row["kind"], name)))
for row in cert["actualMomentChecks"]:
    for receipt in row["checks"]:
        check("actual_source_gates", receipt["pass"] and receipt["numeratorMonomials"] == 0, "actual whole-support moment body")
    check("actual_source_gates", not row["negative"]["pass"], "missing actual correction rejected")
check("actual_source_gates", cert["normalizedFiniteBlock"] == {"orders": [1, 2], "tailStarts": 3}, "retain actual n2 before summing higher tail")
check("actual_source_gates", cert["canonicalNormRequests"] == [{"throughOrder": n, "derivativeOrder": n} for n in range(1, 5)], "canonical requests are prefix independent")
for name in ["weightedStressSelectorComputed", "physicalResidualSelectorComputed", "fullOriginalProposition55Certified", "originalN506Complete", "sourceUniformQStarCertified"]:
    check("scope", cert["scope"][name] is False, name)

# Rebuild every signed seed polynomial from formal differentiation.
# D_t(exp(-z^p)P) = exp(-z^p)(p z^(p+1)P-z^2 P'), z=1/t.
def seed_recurrence(p, rows):
    polynomial = {0: 1}
    bounds = []
    for k, row in enumerate(rows):
        actual = {r["power"]: int(r["coefficient"]) for r in row["polynomial"]}
        check("seed_signed_coefficients", actual == polynomial, str((p, k)))
        bound = sum(abs(c) * max(1, (j + p - 1) // p) ** max(1, (j + p - 1) // p) for j, c in polynomial.items())
        check("seed_global_majorants", int(row["ordinaryDerivativeUpper"]) == bound, str((p, k)))
        for monomial in row["monomialBounds"]:
            j = monomial["power"]
            upper = max(1, (j + p - 1) // p) ** max(1, (j + p - 1) // p)
            check("seed_global_majorants", int(monomial["integerMaximumUpper"]) == upper, "every new degree has its own all-z maximum")
        bounds.append(bound)
        nxt = {}
        for j, c in polynomial.items():
            nxt[j + p + 1] = nxt.get(j + p + 1, 0) + p * c
            if j:
                nxt[j + 1] = nxt.get(j + 1, 0) - j * c
        polynomial = {j: c for j, c in nxt.items() if c}
    return bounds


for key, p, floor in [("activation", 2, 64), ("timeStep", 1, 16)]:
    item = data["cutoff"][key]
    seed = seed_recurrence(p, item["seedDerivatives"])
    reciprocal = [floor]
    step = [1]
    for m in range(1, len(seed)):
        reciprocal.append(floor * sum(math.comb(m, k) * 2 * seed[k] * reciprocal[m-k] for k in range(1, m+1)))
        step.append(sum(math.comb(m, k) * seed[k] * reciprocal[m-k] for k in range(m+1)))
    check("reciprocal_and_step", reciprocal == list(map(int, item["reciprocalOrdinaryDerivativeBounds"])), key)
    check("reciprocal_and_step", step == list(map(int, item["ordinaryDerivativeBounds"])), key)
    check("reciprocal_and_step", F(11, 4) ** (2**p) < floor, "positive denominator never disappears")


def stirling(n):
    rows = [[1]]
    for r in range(1, n+1):
        rows.append([k * (rows[-1][k] if k < len(rows[-1]) else 0) + (rows[-1][k-1] if k else 0) for k in range(r+1)])
    return rows


S = stirling(26)
time_step = list(map(int, data["cutoff"]["timeStep"]["ordinaryDerivativeBounds"]))
ordinary = [1] + [2**k * time_step[k] for k in range(1, 27)]
euler = [sum(S[r][k] * ordinary[k] for k in range(r+1)) for r in range(27)]
check("euler_cutoff", ordinary == list(map(int, data["cutoff"]["timeCutoff"]["ordinaryDerivativeBounds"])), "linear cutoff scaling")
check("euler_cutoff", euler == list(map(int, data["cutoff"]["timeCutoff"]["eulerDerivativeBounds"])), "Stirling transform including order26")
for row in data["weights"]:
    n, m = row["order"], row["derivativeOrder"]
    for weight in row["weights"]:
        r = weight["eulerOrder"]
        expected = [math.comb(r, k) * (2*n)**k * euler[r-k] for k in range(r+1)]
        extra = [math.comb(r, k) * (2*n)**k * euler[r-k+1] for k in range(r+1)]
        check("euler_cutoff", expected == list(map(int, weight["polynomialInSourceH"])), str((n, m, r, "ordinary")))
        check("euler_cutoff", extra == list(map(int, weight["extraPotentialCutoffPolynomialInSourceH"])), str((n, m, r, "extra stream")))
        if r:
            check("euler_cutoff", extra != expected, "dropping the m+1 Stokes cutoff derivative is detected")

for row in data["natural"]:
    r, m = row["radialLogOrder"], row["etaOrder"]
    ss = stirling(r)[r]
    exact = sum((F(ss[k] * math.factorial(k+m)) * F(1, 4)**k * 2**(k+m+1) for k in range(r+1)), F(0))
    check("natural_cauchy", exact == F(row["coefficient"]), str((r, m)))
    check("natural_cauchy", row["scope"]["comparisonProfileSubstituted"] is False, "actual positive Banach error is retained")

# Original six PDE rows, calculated directly rather than by reusing the
# exported matrix formulas. nu is deliberately not bounded by the n2
# simplification: several trials exceed 3 and 100.
rng = random.Random(20261010)
program = data["actualKernel"]
for trial in range(96):
    rat = lambda: F(rng.randint(-19, 19), rng.randint(2, 23))
    slots = {name: rat() for name in ["F0", "U0", "v0", "HF", "HU", "ZF", "ZU", "pKnown", "Hz"]}
    slots.update({"nu": [F(0), F(1, 17), F(5, 2), F(117), F(-4, 7)][trial % 5], "h": F(1, 100+trial), "eta": F(trial % 19-9, 10), "xi": F(2+trial % 7, 11), "Htheta": F(1+trial, 97)})
    for j in range(6):
        slots["W"+str(j)], slots["We"+str(j)] = rat(), rat()
    values = evaluate(program, slots)
    rhs = [values[program["forcing"][i]] + sum(values[program["matrix0"][i][j]] * slots["W"+str(j)] + values[program["matrix1"][i][j]] * slots["We"+str(j)] for j in range(6)) for i in range(6)]
    nu, h, eta, xi = (slots[k] for k in ["nu", "h", "eta", "xi"])
    A, D, d, L, X = F(1, 2)+h, F(1, 2)-h, 1-eta**2, 1-2*h*eta**2, xi**2
    f, u, k, pressure, fxi, uxi = (slots["W"+str(j)] for j in range(6))
    fe, ue, ke, pe = (slots["We"+str(j)] for j in range(4))
    fx, ux = fxi/(2*xi), uxi/(2*xi)
    v = (2*eta*u - 2*eta*(D+nu)*(u+k) - d*(ue+ke))/L
    time = lambda exponent, f, fe, fx: (-exponent*f + D*eta*fe + X*fx)/L
    axial = lambda exponent, f, fe, fx: (2*eta*(exponent*f-X*fx) + d*fe)/L
    b, c = -A-F(1, 2), -A
    px = 2*slots["F0"]*f + slots["pKnown"]
    theta = time(b+nu, f, fe, fx) + slots["v0"]*(X*fx+f) + slots["U0"]*axial(b+nu, f, fe, fx) + v*slots["HF"] + u*slots["ZF"] + slots["Htheta"]
    z = time(c+nu, u, ue, ux) + X*slots["v0"]*ux + slots["U0"]*axial(c+nu, u, ue, ux) + v*slots["HU"] + u*slots["ZU"] + axial(-2*A+nu, pressure, pe, px) + slots["Hz"]
    expected = [fxi, uxi, -uxi, 2*xi*px, 2*theta, 2*z]
    for j in range(6):
        check("independent_six_pde", rhs[j] == expected[j], str((trial, j)))
    check("independent_six_pde", rhs[4] != 2*(theta-slots["Htheta"]), "actual known theta forcing omission")
    average_identity = 2*xi*(u+k) + X*(rhs[1]+rhs[2]-2*k/xi) - 2*xi*u
    check("independent_six_pde", average_identity == 0, "regular stream average PDE")

# Exact inverse Jacobian and the full second-derivative product budget.
for trial in range(64):
    h, eta, R = F(1, trial+100), F(trial % 15-7, 8), F(trial % 7+1, 3)
    X, D, d, L = R**2/2, F(1, 2)-h, 1-eta**2, 1-2*h*eta**2
    J = [[R/2, 1/R, F(0)], [D*eta, F(0), F(1)], [d, F(0), -2*eta]]  # d(R,Z,T)/d(log s,X,eta), s=1
    inverse_rows = [[F(0), R, F(0)], [2*eta/L, -2*eta*X/L, d/L], [1/L, -X/L, -D*eta/L]]
    for i in range(3):
        for j in range(3):
            check("slow_inverse_jacobian", sum(J[j][k]*inverse_rows[i][k] for k in range(3)) == int(i == j), str((trial, i, j)))
    # This budget identity applies to the exact coefficient derivative
    # rows computed in JS: max row l1=A, max derivative-row l1=B.
    a = [[F(rng.randint(-7, 7), 9) for _ in range(3)] for _ in range(3)]
    da = [[[F(rng.randint(-7, 7), 9) for _ in range(3)] for _ in range(3)] for _ in range(3)]
    A0 = max(F(1), *(sum(map(abs, row)) for row in a))
    B0 = max(F(1), *(sum(map(abs, row)) for matrix in da for row in matrix))
    grad = [F(rng.randint(-11, 11), 11) for _ in range(3)]
    hess = [[F(rng.randint(-11, 11), 11) for _ in range(3)] for _ in range(3)]
    for i in range(3):
        for j in range(3):
            value = sum(a[i][k]*a[j][l]*hess[k][l] + a[i][k]*da[j][k][l]*grad[l] for k in range(3) for l in range(3))
            check("slow_second_derivative_budget", abs(value) <= A0*A0+A0*B0, str((trial, i, j)))
# D=(1+x)d_x and f=x at x=0 give D^2 f=1. Keeping only the
# transformed Hessian would incorrectly return0.
a0, da0, grad0, hess0 = F(1), F(1), F(1), F(0)
check("slow_second_derivative_budget", a0*a0*hess0+a0*da0*grad0 == 1 and a0*a0*hess0 == 0, "omitting the derivative of the Jacobian changes the actual result")

# Universal scalar selection and the exact dyadic compact-band membership.
# These rational examples verify the inequality algorithm, not actual
# values of the source-dependent c_n, which remain positive expressions.
for anchor in range(1, 9):
    for offset in [F(0), F(1, 7), F(9, 13), F(99, 100)]:
        c = 2**(anchor+3) + offset
        ell = 0
        while F(2**ell) < 4*c:
            ell += 1
        Q = F(1, 2**ell)
        check("dyadic_local_finiteness", 1/(8*c) <= Q <= 1/(4*c), "ceil retains the original dyadic scale")
        for q0 in [Q/2, Q, 2*Q]:
            for n in range(1, anchor+1):
                cn = c * F(2)**(n-anchor)
                check("dyadic_local_finiteness", cn*q0 <= F(1, 2), "exact plateau")
            for n in range(anchor+4, anchor+8):
                cn = c * F(2)**(n-anchor)
                check("dyadic_local_finiteness", cn*q0 >= 1, "omitted whole tail and every jet vanish")
        if offset:
            check("dyadic_local_finiteness", c*8*(Q/2) < 1, "anchor+3 can be active and cannot be omitted")
for n in range(1, 18):
    for k in range(n*n, n*n+4):
        B, qh = F(2)**(n**3-n), F(2)**(-k)
        check("normalized_tail", B*qh**n <= F(2)**(-n), "positive actual-style logarithmic selector inequality")
for J in [3, 4, 7, 14]:
    for t in [F(1, 2), F(3, 4), F(99, 100), F(1)]:
        partial = sum(F(1, 2**n)*t**n for n in range(J, J+40))
        check("normalized_tail", partial <= F(1, 2**(J-1))*t**J, "geometric tail beginning at J")
        check("normalized_tail", t**J <= t**2, "C2 velocity proximity keeps q^(2h)")
check("normalized_tail", F(1000)*F(1, 2)**4 > F(1, 4)*F(1, 2)**3, "a large finite n2 term cannot be silently absorbed in the n>=3 tail")

for r in data["recipes"]:
    n = r["order"]
    check("ordered_source_indices", r["forcingPairs"] == [[i, n-i] for i in range(1, n)], "all ordered strict-lower pairs")
    check("ordered_source_indices", r["omega"]["orderedPairs"] == [[i, n-1-i] for i in range(n)], "Omega_(n-1) ordered pairs")
    check("ordered_source_indices", r["omega"]["axialViscosityOrder"] == (n-2 if n >= 2 else None), "lower axial viscosity")
    check("ordered_source_indices", r["exactExponent"]["integerMultiplier"] == 2*n and not r["coefficientParameterBound"]["fixedAbsExponentThree"], "no fixed low-order exponent bound")

dyadic = cert["dyadic"]
check("scope", dyadic["possibleOrders"] == [1, 2, 3, 4] and dyadic["offFrom"] == 5 and dyadic["plateauThrough"] == 1, "executed actual dyadic band")
check("scope", dyadic["ellOperation"] == "ceiling" and dyadic["QOperation"] == "exp", "underflow-safe exact original band")
check("scope", dyadic["qDerivativePreserved"] and not dyadic["thisFiniteBandEqualsAllBands"], "finite actual family is not a whole-annulus numerical observation")
print(json.dumps({"schema": "MathScope.ActualResidualOrderInductionIndependentAudit/1", "pass": True, "checks": sum(counts.values()), "groups": counts,
                  "actualKernelSHA256": data["actualKernelSHA256"], "scope": "Universal exact arithmetic and executed same-source construction gates; no all-order stress/residual or N5-06 completion claim."}, indent=2))
