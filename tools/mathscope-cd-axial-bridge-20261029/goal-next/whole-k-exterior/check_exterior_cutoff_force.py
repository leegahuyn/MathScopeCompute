"""Exact component and coarse factored norm bounds on the full outer heat region."""
from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import json

import sympy as sp

CELL_SHA = "254868bebdad829d656c06cfa903a5b5cdf288d35cf5ec9bdf52461c3a7e008b"
REGION_SHA = "82f4bdcebd43a72451e7523059547dbca37e7a47cc5d66a24e787b0851a4420a"
AMPLITUDE_SHA = "647a71162df52b9bfb489479c14dbf6b916086d7f64a36c5c61cee9820a6c7cf"


def component_check():
    x, y, z, t = sp.symbols("x y z t", real=True)
    r = sp.Symbol("r", positive=True)
    radius = sp.sqrt(x*x+y*y)
    swirl = sp.Function("U")(radius, z, t)
    p = sp.Function("p")(radius, z, t)
    v = sp.Matrix([-y*swirl/radius, x*swirl/radius, 0])
    coords = (x, y, z)

    def on_ray(expr):
        return sp.simplify(expr.subs({x: r, y: 0}, simultaneous=True).doit())

    kinetic_gradient = [sum(sp.diff(v[j], coord)**2 for j in range(3)) for coord in coords]
    U = sp.Function("U")(r, z, t)
    P = sp.Function("p")(r, z, t)
    radial = sp.diff(P, r) - U**2/r
    angular = sp.diff(U, t) - sp.diff(U, r, 2) - sp.diff(U, r)/r + U/r**2 - sp.diff(U, z, 2)
    axial = sp.diff(P, z)
    for j, expected in enumerate((radial, angular, axial)):
        acceleration = sum(v[k]*sp.diff(v[j], coords[k]) for k in range(3))
        laplace = sum(sp.diff(v[j], q, 2) for q in coords)
        expression = sp.diff(v[j], t) + acceleration - laplace + sp.diff(p, coords[j])
        assert sp.simplify(on_ray(expression)-expected) == 0
    assert sp.simplify(on_ray(kinetic_gradient[0]+kinetic_gradient[1]) -
                       (sp.diff(U, r)**2+U**2/r**2)) == 0
    assert sp.simplify(on_ray(kinetic_gradient[2]) - sp.diff(U, z)**2) == 0

    C = sp.Function("C")(r, z, t)
    K = sp.Function("K")(r, t)
    p_loc = sp.Function("p_loc")(r, t)
    pairs = {U: C*K, P: C*p_loc}
    heat = {sp.diff(K, t): sp.diff(K, r, 2)+sp.diff(K, r)/r-K/r**2,
            sp.diff(p_loc, r): K**2/r}
    lap_c = sp.diff(C, r, 2)+sp.diff(C, r)/r+sp.diff(C, z, 2)
    expected = (C*(1-C)*K**2/r+sp.diff(C, r)*p_loc,
                (sp.diff(C, t)-lap_c)*K-2*sp.diff(C, r)*sp.diff(K, r),
                sp.diff(C, z)*p_loc)
    for expression, rhs in zip((radial, angular, axial), expected, strict=True):
        assert sp.simplify(expression.xreplace(pairs).doit().xreplace(heat)-rhs) == 0
    # Wrong centrifugal sign leaves twice the convective term.
    assert sp.expand((sp.diff(P, r) + U**2/r) - radial) == 2*U**2/r
    return {
        "rotationProof": "Cartesian differentiation at y=0,x=r plus rotational invariance",
        "thetaForce": "(C_t-Delta C)K-2*C_r*K_r",
        "radialForce": "C*(1-C)*K^2/r+C_r*p_loc",
        "axialForce": "C_z*p_loc",
        "transverseGradientSquared": "((C*K)_r)^2+(C*K/r)^2",
        "axialGradientSquared": "((C*K)_z)^2",
    }


def norms(K, Kr, inverse_radius, Ploc, volume):
    # On the seed transition 0<=u<=1, a'(u)=u^-2 a(u) and
    # a''(u)=(u^-4-2u^-3)a(u). Use x^k exp(-x)<=k!.
    seed1, seed2 = 2, 24 + 2*6
    denominator_inv = 9
    D1, D2 = 2*seed1, 2*seed2
    sigma1 = denominator_inv*(seed1+D1)
    sigma2 = denominator_inv*(seed2+D2+2*sigma1*D1)
    chi1, chi2 = 2*sigma1, 4*sigma2
    assert (chi1, chi2) == (108, 19440)

    # The same bound 3/4 covers r and |zeta| since both square to <=1/2.
    max_radius = Fraction(3, 4)
    assert max_radius**2 > Fraction(1, 2)
    Cr = Cz_z0 = int(4*max_radius*chi1)
    radial_lap_c = 8*chi1+8*chi2
    axial_lap_c_z02 = 4*chi1+8*chi2
    K_over_r = inverse_radius*K
    assert Fraction(33, 32)*K_over_r <= Kr and Fraction(K*K, 2) <= Ploc
    U_r, U_zeta = Cr*K+Kr, Cz_z0*K
    fr = K*K*inverse_radius//4 + Cr*Ploc  # C(1-C)<=1/4.
    fz_z0 = Cz_z0*Ploc
    ft = (K*chi1, K*radial_lap_c+2*Cr*Kr, K*axial_lap_c_z02)
    spacetime = volume/2
    theta_normalized = sum(ft)
    # tau0/z0^2=tau0^(2h)<=1, and A+D=1. With
    # Bnorm=tau0^A*B, the radial and axial force bounds have Bnorm^2.
    coefficient_bounds = {
        "endpointEnergy": volume*K*K,
        "transverseDissipation": spacetime*(U_r**2+K_over_r**2),
        "axialDissipation": spacetime*U_zeta**2,
        "forceSquaredIntegral": spacetime*(theta_normalized**2+fr**2+fz_z0**2),
        "absoluteWorkIntegral": spacetime*K*theta_normalized,
    }
    powers = {name: ((x.numerator+x.denominator-1)//x.denominator-1).bit_length()
              for name, x in coefficient_bounds.items()}
    return {
        "heatAmplitudeFactor": "B=cInfinity*2^A",
        "cutoffDerivatives": {"chiPrime": chi1, "chiSecond": chi2, "CtTau0": chi1,
            "Cr": Cr, "CzZ0": Cz_z0, "radialLaplacian": radial_lap_c, "axialLaplacianZ0Squared": axial_lap_c_z02},
        "heatUpperMultipliers": {"KOverB": str(K), "KrOverB": str(Kr),
            "KOverRadiusB": str(K_over_r), "AbsPressureOverBSquared": str(Ploc)},
        "forceUpperMultipliers": {
            "thetaOverB": {"inverseTau0": str(ft[0]), "constant": str(ft[1]), "inverseZ0Squared": str(ft[2])},
            "radialOverBSquared": str(fr),
            "axialOverBSquaredZ0Inverse": str(fz_z0),
        },
        "normalizedVolumeUpper": str(volume),
        "normalizedSpacetimeVolumeUpper": str(spacetime),
        "endpointEnergyIntegralOverTau0Pow2ABSquaredUpper": str(volume*K*K),
        "transverseDissipationIntegralOverTau0Pow2ABSquaredUpper": str(spacetime*(U_r**2+K_over_r**2)),
        "axialDissipationIntegralOverTau0Pow2ABSquaredUpper": str(spacetime*U_zeta**2),
        "normalizedForceSquaredIntegralUpper": "spacetimeVolumeUpper*tau0^(2*A+2)*(thetaBound^2+radialBound^2+axialBound^2)",
        "normalizedAbsoluteWorkIntegralUpper": "spacetimeVolumeUpper*KOverB*B*tau0^(2*A+1)*thetaBound",
        "normalizedAmplitude": "Bnorm=tau0^A*cInfinity*2^A",
        "normalizedIntegralPowerOfTwoTimesBnormSquaredIfBnormLeOne": powers,
    }


def main():
    p = ArgumentParser(description=__doc__)
    p.add_argument("--exterior-cell-receipt", type=Path, required=True)
    p.add_argument("--exterior-region-receipt", type=Path, required=True)
    p.add_argument("--exterior-amplitude-receipt", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    args = p.parse_args()
    cell = args.exterior_cell_receipt.read_bytes()
    assert sha256(cell).hexdigest() == CELL_SHA
    data = json.loads(cell)
    assert data["geometry"]["strictHeatExterior"] == "2*q*Xb < 1/48 < r^2, so X=r^2/(2*q)>Xb"
    assert data["sourceCode"]["pressureNormalization"] == "original radial infinity; no additive time function"
    assert data["fieldAtoms"]["count"] == 67
    assert data["open"]["N7-06"] == "OPEN"
    assert sha256(args.exterior_region_receipt.read_bytes()).hexdigest() == REGION_SHA
    amplitude = args.exterior_amplitude_receipt.read_bytes()
    assert sha256(amplitude).hexdigest() == AMPLITUDE_SHA
    scale = json.loads(amplitude)["bounds"]
    assert scale["MFixedDyadicUpper"] == "2^(-8388607)"
    # With 2A<=33/32, (2^512)^(2A)<=2^528. For the shell
    # r>=1/4, (4)^(2A)<8 follows from 4A<=33/16<3.
    assert Fraction(33, 32)*512 == 528
    assert Fraction(33, 32)*2 < 3
    A, h, tau = sp.symbols("A h tau", positive=True)
    assert sp.simplify((A+sp.Rational(1, 2)-h).subs(A, sp.Rational(1, 2)+h)) == 1
    assert sp.simplify(tau/(tau**(sp.Rational(1, 2)-h))**2 - tau**(2*h)) == 0
    # The complete radial cylinder has spatial measure <=pi*sqrt(2)/2.
    # The r>=1/4 cylinder has measure (7/16)*pi*sqrt(2).
    broad = norms(2**528, 2**1041, 2**512, 2**1055, Fraction(33, 14))
    moderate = norms(8, 33, 4, 32, Fraction(33, 16))
    # Bnorm^2 = 2^(2A)*M < 4*M. The bound below also verifies Bnorm<1.
    amplitude_exponent = 8388607-2
    powers = broad["normalizedIntegralPowerOfTwoTimesBnormSquaredIfBnormLeOne"]
    numeric = {name: f"2^(-{amplitude_exponent-power})" for name, power in powers.items()}
    assert min(amplitude_exponent-power for power in powers.values()) > 2**22
    report = {
        "status": "CONDITIONAL_SOURCE_THEOREM_BOUND_EXTERIOR_FORCE",
        "sourceCellReceiptSHA256": CELL_SHA,
        "sourceRegionReceiptSHA256": REGION_SHA,
        "sourceAmplitudeReceiptSHA256": AMPLITUDE_SHA,
        "region": "2^-512<=r<=1/sqrt(2), |zeta|<=1/sqrt(2), 1/2<=rho<=1; all physical angles",
        "actualExteriorIdentification": data["sourceCode"],
        "verifiedCylindricalAlgebra": component_check(),
        "coarseFactoredBounds": broad,
        "normalizedStrictDyadicUpper": numeric,
        "sharperSubregion": {"condition": "r>=1/4", "bounds": moderate},
        "positiveCellForceSquaredLower": "4*pi*Hmin^2*I_E*tau0^(2*A)*cInfinity^2",
        "positiveCellForceSquaredUpper": "216*pi*I_E*tau0^(2*A)*cInfinity^2 + (pi/16)*I_radial4*tau0^(2*A+2)*cInfinity^4",
        "cellRadialFourthIntegral": "I_radial4=integral_(1/4)^(1/2) (r^2/2)^(-4*A) dr/r",
        "scope": "Same original exterior heat field under the stated source support theorems and all three outer cutoff factors",
        "entireWholeKForceNorm": "OPEN",
        "release": "HOLD",
    }
    args.out.write_bytes((json.dumps(report, indent=2) + "\n").encode())
    print("PASS heat exterior force and cutoff transition bounds over the full outer cylinder")


if __name__ == "__main__":
    main()

