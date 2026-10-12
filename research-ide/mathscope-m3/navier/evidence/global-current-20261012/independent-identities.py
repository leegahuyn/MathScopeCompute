"""Independent exact finite checks of the global radial calculus.

These polynomial examples verify algebra and detect a concrete omitted
c_rho*P term. They do not evaluate the original Navier field or prove its
all-order bounds. No JavaScript graph evaluator is imported or emulated.
"""
from fractions import Fraction as F
import json


def clean(a):
    return {k: v for k, v in a.items() if v}


def add(*parts):
    out = {}
    for part in parts:
        for k, v in part.items():
            out[k] = out.get(k, F(0)) + v
    return clean(out)


def scale(a, c):
    return clean({k: v * F(c) for k, v in a.items()})


def sub(a, b):
    return add(a, scale(b, -1))


def mul(a, b):
    out = {}
    for (ar, az), av in a.items():
        for (br, bz), bv in b.items():
            k = (ar + br, az + bz)
            out[k] = out.get(k, F(0)) + av * bv
    return clean(out)


def power(a, n):
    out = {(0, 0): F(1)}
    for _ in range(n):
        out = mul(out, a)
    return out


def derivative(a, axis):
    out = {}
    for k, v in a.items():
        if k[axis]:
            dest = list(k)
            dest[axis] -= 1
            out[tuple(dest)] = v * k[axis]
    return clean(out)


def radial_primitive(a):
    # Exact integral from 1 to r. All actual test integrands are polynomial.
    out = {}
    for (rp, zp), value in a.items():
        assert rp >= 0, "This independent finite check has no logarithm oracle."
        c = value / (rp + 1)
        out = add(out, {(rp + 1, zp): c}, {(0, zp): -c})
    return out


def at_radius(a, radius):
    out = {}
    for (rp, zp), value in a.items():
        out[(0, zp)] = out.get((0, zp), F(0)) + value * F(radius) ** rp
    return clean(out)


def whole(a):
    return at_radius(radial_primitive(a), 2)


def record(a):
    return [{"rPower": k[0], "zPower": k[1], "coefficient": str(v)}
            for k, v in sorted(a.items())]


one = {(0, 0): F(1)}
r = {(1, 0): F(1)}
z = {(0, 1): F(1)}
ri = {(-1, 0): F(1)}
eps = F(2, 7)
bump = mul(power(sub(r, one), 4), power(sub(scale(one, 2), r), 4))
base = mul(power(r, 2), bump)
Wrr = mul(base, add(one, power(z, 2)))
Wrtheta = mul(base, add(one, z))
Wrz = mul(mul(r, bump), add(z, power(z, 2)))
Wthetatheta = mul(base, add(scale(one, 2), power(z, 2)))
Wthetaz = mul(base, power(z, 2))
Wzz = mul(base, add(one, power(z, 3)))
stress_theta = scale(mul(base, add(one, z)), F(1, 5))
stress_z = scale(mul(base, sub(one, z)), F(3, 11))

# Positive normalized bump mixtures on |z|<=1, with a genuinely variable
# second moment. This detects loss of the derivative of c_rho itself.
rho_a = scale(bump, 1 / whole(bump)[(0, 0)])
rho_b = scale(mul(r, bump), 1 / whole(mul(r, bump))[(0, 0)])
weight = scale(sub(one, power(z, 2)), F(1, 4))
rho = add(rho_a, mul(weight, sub(rho_b, rho_a)))
c_rho = scale(whole(mul(power(r, 2), rho)), F(1, 2))

dr = lambda a: derivative(a, 0)
dz = lambda a: scale(derivative(a, 1), eps)
De = lambda a, e: add(dr(a), scale(mul(ri, a), e))
gr = add(scale(De(Wrr, 1), -1), scale(dz(Wrz), -1), mul(ri, Wthetatheta))
P = whole(gr)
pressure_source = sub(gr, mul(rho, P))
p = radial_primitive(pressure_source)
Jtheta = whole(mul(power(r, 2), Wthetaz))
Jz = sub(whole(mul(r, Wzz)), scale(whole(mul(power(r, 2), gr)), F(1, 2)))
Etheta = sub(add(De(Wrtheta, 2), dz(Wthetaz)), De(stress_theta, 2))
Ez = sub(add(De(Wrz, 1), dz(add(Wzz, p))), De(stress_z, 1))
moments = [dz(Jtheta), dz(add(Jz, mul(c_rho, P)))]

checks = []


def check(name, condition):
    checks.append({"id": name, "pass": bool(condition)})


check("positive-mixture-whole-rho-normalization", whole(rho) == one)
check("pressure-source-whole-zero", whole(pressure_source) == {})
check("pressure-FTC", dr(p) == pressure_source)
check("pressure-has-both-zero-boundaries", at_radius(p, 1) == at_radius(p, 2) == {})
check("pressure-first-moment-includes-c-rho-P",
      whole(mul(r, p)) == add(scale(whole(mul(power(r, 2), gr)), F(-1, 2)), mul(c_rho, P)))

for j, (E, stress, Wrt, Wtz, exponent) in enumerate([
    (Etheta, stress_theta, Wrtheta, Wthetaz, 2),
    (Ez, stress_z, Wrz, add(Wzz, p), 1),
]):
    weight_r = power(r, exponent)
    check(f"weighted-residual-divergence-{j}",
          mul(weight_r, E) == add(dr(mul(weight_r, sub(Wrt, stress))), dz(mul(weight_r, Wtz))))
    check(f"actual-whole-residual-moment-{j}", whole(mul(weight_r, E)) == moments[j])
    weighted_source = sub(mul(weight_r, E), mul(rho, moments[j]))
    sigma = scale(mul({(-exponent, 0): F(1)}, radial_primitive(weighted_source)), -1)
    check(f"normalized-Sigma-source-whole-zero-{j}", whole(weighted_source) == {})
    check(f"Sigma-FTC-{j}", mul(weight_r, De(sigma, exponent)) == scale(weighted_source, -1))
    check(f"Sigma-both-boundaries-zero-{j}", at_radius(sigma, 1) == at_radius(sigma, 2) == {})

omitted_product = sub(moments[1], dz(Jz))
omitted_crho_derivative = sub(moments[1], add(dz(Jz), mul(c_rho, dz(P))))
check("dropping-c-rho-P-is-detected", omitted_product != {})
check("dropping-the-c-rho-derivative-is-detected", omitted_crho_derivative != {})
result = {
    "schema": "MathScope.N6.GlobalCurrentIndependentExactChecks/1",
    "status": "PASS" if all(x["pass"] for x in checks) else "FAIL",
    "checks": checks,
    "checksPassed": sum(x["pass"] for x in checks),
    "arithmetic": "Python standard-library Fraction; exact bivariate Laurent polynomials",
    "radialDomain": ["1", "2"],
    "epsilon": str(eps),
    "negativeControls": {
        "missingFullCRhoP": record(omitted_product),
        "missingDerivativeOfCRho": record(omitted_crho_derivative),
    },
    "scope": "Independent finite algebra examples for the actual global mean/pressure/Sigma formulas; no numerical original-field or all-order source-class assertion.",
    "originalN604Complete": False,
    "originalSourceExecutedByThisScript": False,
}
print(json.dumps(result, indent=2) + "\n", end="")
assert result["status"] == "PASS"
