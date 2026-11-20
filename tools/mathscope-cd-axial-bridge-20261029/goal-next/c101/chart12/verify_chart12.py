"""Extend the authenticated pointwise chart coefficient recurrence to order twelve."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
import json
from math import comb, factorial
from pathlib import Path
import runpy


KERNEL = "384daafdcb5cad2e57b4bbb0440bc4b2e4a5912b4835e2d7510c21301a44ff15"


def pin(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


def main(goal, kernel, output):
    prior = goal/"c100/chart11"
    manifest_digest = "1cb348c1d8460106cfac6fe5fa62e4308f51a477406ed163600617d088a6d84c"
    manifest = json.loads(pin(prior/"MANIFEST.json", manifest_digest))["producedFiles"]
    pin(prior/"verify_chart11.py", manifest["verify_chart11.py"])
    old = json.loads(pin(prior/"chart11.json", manifest["chart11.json"]))
    source = pin(kernel, KERNEL)
    assert old["sourceKernelSHA256"] == KERNEL
    assert b'alpha.findLastIndex(x=>x>0)' in source
    assert b'put([...term.profileOrders],chart.derivative(term.coefficient,axis));' in source
    assert b'put(beta,G.mul(term.coefficient,chart.coefficients[axis][j]));' in source
    assert old["atomDerivativeOrder"] == 12 and old["ordinaryDirections"] == 364
    support = runpy.run_path(str(prior/"verify_chart11.py"))["support"]

    # Same positive coefficient-atom calculation, now with one more derivative.
    atom_order = 13
    assert 1 - 2*Fraction(1, 64)*Fraction(5, 4)**2 > Fraction(1, 2)
    reciprocal = 2 * 4**atom_order * factorial(atom_order)
    half_power = factorial(atom_order+1)
    scale = 2**(atom_order+2) * half_power
    atom_integer = 2 * 2**atom_order * 8 * 4**atom_order * scale * half_power * reciprocal
    assert atom_integer < 2**192
    # At most four elementary factors and the ordinary conversion of Euler s.
    # X is in [2/Hc,Hc^2], and the coefficient has at most one X-power.
    atom_geometry = 15
    assert Fraction(atom_order) + Fraction(1, 2) < atom_geometry
    # Each of the six summands costs at most the total-order binomial sum.
    assert 6 * 2**atom_order < 2**16
    exponent = 192 + 12*(192+16)
    geometry = atom_geometry*(12+1)
    assert (exponent, geometry, atom_order-12) == (2688, 195, 1)
    old_rows = {tuple(row["ordinarySlowOrders"]):row["profileUpperSupport"] for row in old["slowOrders"]}
    new_rows = []
    n = 0
    for r in range(13):
        for z in range(13-r):
            for t in range(13-r-z):
                alpha = (r, z, t)
                rows = list(sorted(support(alpha)))
                assert max(map(sum, rows)) == sum(alpha)
                if sum(alpha) == 12:
                    data = json.dumps(rows, separators=(",", ":")).encode()
                    new_rows.append({"RZT": alpha, "terms": len(rows), "profileSupportSHA256": sha256(data).hexdigest()})
                else:
                    assert [list(row) for row in rows] == old_rows[alpha]
                n += 1
    assert n == comb(15, 3) == 455 and len(new_rows) == 91
    assert 4 * n < 2**11
    result = {
        "schema":"MathScope.C101.OriginalC12PointwiseCoefficientTransfer/1",
        "status":"VERIFIED_ORIGINAL_COEFFICIENT_RECURRENCE_CONDITIONAL_CHART_REALIZATION",
        "kernelSHA256":KERNEL, "priorChartManifestSHA256":manifest_digest,
        "atomDerivativeOrder":atom_order, "atomIntegerBoundComputed":str(atom_integer),
        "atomCoefficientCap":"2^192*Hc^15", "pointwiseCoefficientCap":"2^2699*Hc^195",
        "totalDirections":n, "degreeTwelveDirections":new_rows,
        "open":["Original global background derivatives through C12",
                "Same original profile/target realization and integrated order-twelve faces"],
        "finalJets":"0/67", "release":"HOLD",
    }
    output.write_bytes((json.dumps(result, indent=2)+"\n").encode())
    print("PASS 455 original chart directions, 91 new at order twelve, coefficient cap 2^2699 Hc^195")


if __name__ == "__main__":
    assert __debug__
    cli = ArgumentParser(description=__doc__)
    for arg in ("goal", "kernel", "out"):
        cli.add_argument("--"+arg, type=Path, required=True)
    args=cli.parse_args()
    main(args.goal,args.kernel,args.out)
