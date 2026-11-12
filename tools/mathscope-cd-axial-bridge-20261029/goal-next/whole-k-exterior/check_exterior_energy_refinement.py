"""Directed, independent space/time refinements on the original fixed heat exterior."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from functools import lru_cache
from hashlib import sha256
import json
from pathlib import Path
import sys


HERE = Path(__file__).resolve().parent
S_MIN = Q(1, 2**1024)
PINS = {
    "region/whole-k-exterior-region.json": "82f4bdcebd43a72451e7523059547dbca37e7a47cc5d66a24e787b0851a4420a",
    "amplitude/whole-k-exterior-amplitude.json": "647a71162df52b9bfb489479c14dbf6b916086d7f64a36c5c61cee9820a6c7cf",
    "exterior-cutoff-force.json": "9bba52b109ec9c61db0cd8bdc32cd5aaf6baedfac416277ec65b00d5c656afea",
}


def p2(n):
    return Q(2**n) if n >= 0 else Q(1, 2**(-n))


def source_readback(source):
    data = {}
    for name, expected in PINS.items():
        raw = (HERE / name).read_bytes()
        assert sha256(raw).hexdigest() == expected
        data[name] = json.loads(raw)
    region = data["region/whole-k-exterior-region.json"]["region"]
    assert region["closedRegion"]["rSquared"] == ["2^-1024", "1/2"]
    assert region["heatProof"].endswith("<2^-17, including the entire pressure tail")
    amplitude = data["amplitude/whole-k-exterior-amplitude.json"]
    assert amplitude["bounds"]["sqrtMFixedDyadicUpper"] == "2^(-4194303)"
    force = data["exterior-cutoff-force.json"]
    assert force["verifiedCylindricalAlgebra"]["thetaForce"] == "(C_t-Delta C)K-2*C_r*K_r"
    assert force["coarseFactoredBounds"]["cutoffDerivatives"] == {
        "chiPrime": 108, "chiSecond": 19440, "CtTau0": 108, "Cr": 324, "CzZ0": 324,
        "radialLaplacian": 156384, "axialLaplacianZ0Squared": 155952,
    }
    m3 = source / "research-ide/mathscope-m3"
    for path, expected in (
        (m3/"recovery-20261019/outer_cutoff.py", "535e1126c6450627bd61cf0e5a94c33938b12e71886a995175493dddfe6b8ced"),
        (m3/"closure-evidence-20261023/original_torus_fourier_interval.py", "a57677542de54d521d6ab72039b94fa869452f15637a586876e85c10af259499"),
        (m3/"closure-evidence-20261023/rigorous_rational_intervals.py", "e5f63a02a7cef384eafb697be14f1e9c8dccca973b8c51b6e296a592c0f87616"),
    ):
        assert sha256(path.read_bytes()).hexdigest() == expected
        sys.path.insert(0, str(path.parent))
    from outer_cutoff import ActualOuterCutoff
    from region.check_whole_k_exterior_region import collar
    outer = ActualOuterCutoff(source)
    cell = json.loads((HERE/"whole-k-exterior-cell.json").read_bytes())
    assert collar(outer, cell) == region
    from check_whole_k_exterior_cell import LocalizationProgram
    parameters = LocalizationProgram(outer.archive).data["parametersExactExpressions"]
    assert parameters["h"] == {"exp":{"product":[{"integer":-8002},{"ref":"T"}]}}
    assert parameters["T"] == {"sum":[{"exp":{"ref":"Md"}},{"integer":10}]}
    assert 8002*10 > 4096


def uniform_error():
    # 0<h<2^-4096 and B_log>max(2^23,(64/h)^2/2) from the pinned source.
    # Thus tau0<2^-8192 and tau0^(2h)<2^-4096. On the exterior
    # s^-h <= exp(1024*h) <= 1+2048*h, and H>=1-2h.
    h_upper, t_upper, z_weight = p2(-4096), p2(-8192), p2(-4096)
    shape_error = p2(-4000)
    assert 2048*h_upper+2*h_upper < shape_error
    assert (1+shape_error)*(1+2*h_upper)-1 < 2*shape_error
    inv_r = p2(512)
    u0 = inv_r
    u_error = shape_error*inv_r
    u = u0+u_error
    f0 = 108*inv_r
    f_error = (
        108*u_error+(156384*t_upper+155952*z_weight)*u
        +2*t_upper*324*4*inv_r**2
    )
    sqrt_m = p2(-4194302)
    radial_force = sqrt_m*(4*inv_r**3+324*2*inv_r**2)
    axial_force = sqrt_m*324*2*inv_r**2
    theta = f0+f_error
    common_error = p2(-2800)
    assert 3*(u0+u)*u_error/2 < common_error
    assert 3*(f0*u_error+u*f_error) < common_error
    assert 3*((f0+theta)*f_error+radial_force**2+axial_force**2) < common_error
    force_l1l2_error = f_error+radial_force+axial_force
    assert (4*f0+force_l1l2_error)*force_l1l2_error < common_error
    radial_gradient0 = 324*inv_r+inv_r**2
    radial_gradient_error = 324*u_error+2*shape_error*inv_r**2
    axial_gradient0 = 324*inv_r
    axial_gradient_error = 324*u_error
    radial_d_error = 3*(
        (2*radial_gradient0+radial_gradient_error)*radial_gradient_error
        +(2*inv_r**2+inv_r*u_error)*inv_r*u_error
    )
    axial_d_error = 3*(2*axial_gradient0+axial_gradient_error)*axial_gradient_error
    flux_coefficient_error = 8*inv_r**2*(3*shape_error+2*shape_error**2)
    coefficient_error = p2(-1800)
    assert max(radial_d_error, axial_d_error, flux_coefficient_error) < coefficient_error
    assert 3*(t_upper*(radial_gradient0+radial_gradient_error)**2
              +t_upper*(u*inv_r)**2+z_weight*(axial_gradient0+axial_gradient_error)**2) < common_error
    assert 8*t_upper*inv_r**2*(1+shape_error)*(1+2*shape_error) < common_error
    return common_error, coefficient_error


def directed_factors(source):
    source_readback(source)
    from outer_cutoff import I, chi_jets, rounded
    from original_torus_fourier_interval import pi_bracket

    def sum_cells(a, b, count, bits, bound):
        step = (b-a)/count
        rows = [rounded(bound(a+j*step, a+(j+1)*step), bits) for j in range(count)]
        return rounded(step*I(sum(i.lo for i in rows), sum(i.hi for i in rows)), bits)

    def log_two(bits):
        n = bits
        x = Q(1,3)
        lower = 2*sum(x**(2*j+1)/(2*j+1) for j in range(n))
        return rounded(I(lower, lower+2*x**(2*n+1)/((2*n+1)*(1-x*x))), bits)

    def nonnegative(interval):
        return I(max(Q(0), interval.lo), max(Q(0), interval.hi))

    @lru_cache(maxsize=None)
    def space(count, bits):
        def radial_integrand(a, b):
            lo = chi_jets(2*b, 2*b, bits)[0].square().lo/b
            hi = chi_jets(2*a, 2*a, bits)[0].square().hi/a
            return I(lo,hi)

        def transverse_integrand(a, b):
            v, d, *_ = chi_jets(2*a, 2*b, bits)
            w = v/I(a,b)
            return (4*d-w).square()+w.square()

        def axial_integrand(a, b):
            return I(chi_jets(2*b*b, 2*b*b, bits)[0].square().lo,
                     chi_jets(2*a*a, 2*a*a, bits)[0].square().hi)

        def axial_derivative_integrand(a, b):
            return (4*I(a,b)*chi_jets(2*a*a, 2*b*b, bits)[1]).square()

        radial = 1022*log_two(bits)+sum_cells(Q(1,4),Q(1,2),count,bits,radial_integrand)
        transverse = 2*(1/S_MIN-4)+sum_cells(Q(1,4),Q(1,2),count,bits,transverse_integrand)
        axial = 2*sum_cells(Q(0),Q(1),count,bits,axial_integrand)
        axial_derivative = 2*sum_cells(Q(0),Q(1),count,bits,axial_derivative_integrand)
        return radial, transverse, axial, axial_derivative

    @lru_cache(maxsize=None)
    def time(count, bits):
        def work(a, b):
            v, d, *_ = chi_jets(a,b,bits)
            return nonnegative(v)*nonnegative(-d)

        arguments = (
            lambda a,b: chi_jets(a,b,bits)[0].square(),
            work,
            lambda a,b: chi_jets(a,b,bits)[1].square(),
        )
        values = [sum_cells(Q(1,2),Q(1),count,bits,func) for func in arguments]
        assert values[1].lo <= Q(1,2) <= values[1].hi
        assert values[2].hi >= 2
        return values

    common, coefficient = uniform_error()

    def evaluate(n_space, n_time, bits):
        radial, transverse, axial, axial_derivative = space(n_space,bits)
        time_square, time_work, time_derivative = time(n_time,bits)
        pi_value = pi_bracket(bits//2)
        pi = I(pi_value.lo, pi_value.hi)
        error = I(-common,common)
        c_error = I(-coefficient,coefficient)
        e = pi*radial*axial/2+error
        w = pi*radial*axial*time_work+error
        f = pi*radial*axial*time_derivative+error
        f_l1l2 = pi*radial*axial+error
        d_r = pi*transverse*axial*time_square+c_error
        d_z = pi*radial*axial_derivative*time_square+c_error
        flux = (2/S_MIN)*pi*axial*time_square+c_error
        defect = e-w+I(-common,common)
        assert e.lo > 0 and d_r.lo > 0 and d_z.lo > 0 and f.lo > 0 and f_l1l2.lo > 0 and flux.lo > 0
        assert defect.lo <= 0 <= defect.hi
        return {
            "endpointEnergyOverM": e, "workOverM": w, "forceSquaredOverM": f,
            "forceL1tL2xSquaredOverM": f_l1l2,
            "transverseDissipationOverMAndTau0": d_r, "axialDissipationOverMAndTau0Pow2h": d_z,
            "innerViscousFluxOverMAndTau0": flux, "defectOverM": defect,
            "defectOverEndpointEnergy": defect/e,
        }

    return evaluate


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--localization-source", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    evaluate = directed_factors(args.localization_source)
    specs = {"base": (128,128,80), "spaceOnly": (256,128,80), "timeOnly": (128,256,80),
             "both": (256,256,80), "arithmeticOnly": (128,128,112)}
    rows = {key: evaluate(*spec) for key, spec in specs.items()}

    def width(row, key):
        interval = rows[row][key]
        return interval.hi-interval.lo

    metrics = ("endpointEnergyOverM","workOverM","forceSquaredOverM","defectOverEndpointEnergy")
    for metric in metrics:
        assert width("spaceOnly",metric) < width("base",metric), metric
    for metric in metrics[1:]:
        assert width("timeOnly",metric) < width("base",metric), metric
    assert width("both",metrics[-1]) < min(width("spaceOnly",metrics[-1]),width("timeOnly",metrics[-1]))
    defect_upper = {
        key: max(abs(row[metrics[-1]].lo),abs(row[metrics[-1]].hi)) for key,row in rows.items()
    }
    assert all(defect_upper[k] < defect_upper["base"] for k in ("spaceOnly","timeOnly","both"))
    result = {
        "schema": "MathScope.N7.DirectedActualFixedHeatExteriorRefinement/1",
        "sourceSHA256": PINS,
        "domain": "2^-1024<=s=r^2<=1/2, zeta^2<=1/2, 1/2<=rho<=1; all physical angles",
        "normalization": "B=2^A*cInfinity; M=tau0^(2A)*B^2; U=tau0^A*u; F=tau0^(A+1)*f",
        "heatShapeErrors": "abs(r*K/B-1)<2^-4000 and abs(r^2*K_r/B+1)<2*2^-4000",
        "integratedAbsoluteErrors": "2^-2800 in E/M, W/M and both force norms squared/M; 2^-1800 for factored dissipation and inner flux coefficients",
        "normalizedBalance": "E+tau0*integral(|grad U|^2)-W-innerViscousFlux=0 on this fixed exterior. Outward normal on inner cylindrical boundary is -e_r.",
        "refinementAxes": {k: {"spaceCells": v[0],"timeCells": v[1],"bits": v[2]} for k,v in specs.items()},
        "intervals": {k: {name: interval.encoded() for name,interval in row.items()} for k,row in rows.items()},
        "displayWidths": {k: {name: float(width(k,name)) for name in metrics} for k in rows},
        "displayDefectAbsoluteUpper": {k: float(value) for k,value in defect_upper.items()},
        "wholeKForceL1tL2xSquaredLower": str(rows["both"]["forceL1tL2xSquaredOverM"].lo)+" * M",
        "scope": "Original heat exterior with physical radial, axial and time cutoff transitions. Full central cylinder and whole-field N7/N8 criteria remain OPEN.",
        "N7_06": "OPEN", "N8_05": "OPEN", "finalJets": 0, "release": "HOLD",
    }
    raw = (json.dumps(result,indent=2)+"\n").encode()
    args.out.write_bytes(raw)
    print("PASS original exterior energy, work, dissipation, force square and independent spatial/time refinements")
    print("interval widths", json.dumps(result["displayWidths"]))
    print("absolute normalized defect upper bounds", json.dumps(result["displayDefectAbsoluteUpper"]))
    print(sha256(raw).hexdigest(), args.out.name)


if __name__ == "__main__":
    main()
